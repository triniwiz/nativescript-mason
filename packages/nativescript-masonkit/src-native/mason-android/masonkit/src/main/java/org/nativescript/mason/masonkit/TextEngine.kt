package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Build
import android.text.BoringLayout
import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextDirectionHeuristic
import android.text.TextDirectionHeuristics
import android.text.TextPaint
import android.text.TextUtils
import android.text.style.AbsoluteSizeSpan
import android.text.style.AlignmentSpan
import android.text.style.CharacterStyle
import android.text.style.ForegroundColorSpan
import android.text.style.LeadingMarginSpan
import android.text.style.LineBackgroundSpan
import android.text.style.MetricAffectingSpan
import android.text.style.ParagraphStyle
import android.text.style.ReplacementSpan
import android.text.style.StrikethroughSpan
import android.text.style.UpdateLayout
import android.util.DisplayMetrics
import android.util.TypedValue
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewGroup
import android.widget.TextView.BufferType
import androidx.core.graphics.createBitmap
import org.nativescript.mason.masonkit.Styles.TextWrap
import org.nativescript.mason.masonkit.TextNode.FixedLineHeightSpan
import org.nativescript.mason.masonkit.TextNode.RelativeLineHeightSpan
import org.nativescript.mason.masonkit.enums.Direction
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FontVariantNumeric
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.VerticalAlign
import kotlin.math.ceil

/** U+200B ZERO WIDTH SPACE breaks a line without being whitespace (Java
 *  classifies it as a format char), so `isWhitespace` alone reports a whole
 *  ZWSP-joined run as one unbreakable word. */
private fun Char.isSoftWrapOpportunity(): Boolean = isWhitespace() || this == '\u200B'

private fun advanceSum(advances: FloatArray, start: Int, end: Int): Float {
  var w = 0f
  for (i in start until end) w += advances[i]
  return w
}

// Every strong right-to-left character and bidi control is at or above U+0590.
private const val FIRST_RTL_CHAR = '\u0590'

private fun uniformAdvances(text: CharSequence, paint: TextPaint, scratch: TextPaint): FloatArray? {
  val len = text.length
  if (len == 0) return null
  // One bulk copy instead of an interface charAt per character.
  val chars = CharArray(len)
  TextUtils.getChars(text, 0, len, chars, 0)
  var maybeRtl = false
  for (c in chars) {
    if (c == '\t' || c == '\n') return null
    if (c >= FIRST_RTL_CHAR) maybeRtl = true
  }
  if (maybeRtl && TextDirectionHeuristics.ANYRTL_LTR.isRtl(chars, 0, len)) return null
  scratch.set(paint)
  if (text is Spanned) {
    if (text.nextSpanTransition(0, len, MetricAffectingSpan::class.java) < len ||
      text.getSpans(0, len, ReplacementSpan::class.java).isNotEmpty() ||
      text.getSpans(0, len, LeadingMarginSpan::class.java).isNotEmpty()
    ) return null
    for (span in text.getSpans(0, len, MetricAffectingSpan::class.java)) {
      span.updateMeasureState(scratch)
    }
  }
  val advances = FloatArray(len)
  scratch.getTextWidths(chars, 0, len, advances)
  return advances
}

// Characters a line's visible end skips (TextLine.isLineEndSpace).
private fun isLineEndSpace(ch: Char): Boolean =
  ch == ' ' || ch == '	' || ch == ' ' ||
    (ch in ' '..' ' && ch != ' ') || ch == ' ' || ch == '　'

private fun hasSoftWrapOpportunity(text: CharSequence): Boolean {
  for (i in 0 until text.length) {
    if (text[i].isSoftWrapOpportunity()) return true
  }
  return false
}

/**
 * Compute the widest segment between soft wrap opportunities in [text] without
 * allocating a split array.
 * When [useLayout] is true, uses [Layout.getDesiredWidth] for rich text;
 * otherwise uses [Paint.measureText] for plain text.
 */
private fun maxWordWidth(
  text: CharSequence,
  paint: TextPaint,
  useLayout: Boolean,
  advances: FloatArray? = null
): Float {
  var maxW = 0f
  val len = text.length
  val chars = CharArray(len)
  TextUtils.getChars(text, 0, len, chars, 0)
  var start = 0
  var i = 0
  while (i <= len) {
    val isWs = i < len && chars[i].isSoftWrapOpportunity()
    if (i == len || isWs) {
      if (i > start) {
        // Measure the range directly; slicing a Spannable per word copies
        // overlapping spans and turns this loop quadratic.
        val w = if (advances != null) advanceSum(advances, start, i)
        else if (useLayout) Layout.getDesiredWidth(text, start, i, paint)
        else paint.measureText(text, start, i)
        if (w > maxW) maxW = w
      }
      start = i + 1
    }
    i++
  }
  return ceil(maxW)
}

class TextEngine(val container: TextContainer) {

  val node: Node
    get() {
      return container.node
    }

  val style: Style
    get() {
      return container.node.style
    }

  var textContent: String
    get() {
      return buildString { appendText(node) }
    }
    set(value) {
      val only = node.children.singleOrNull() as? TextNode
      if (only != null && only.javaClass == TextNode::class.java && only.container === container) {
        if (only.data == value) invalidateInlineSegments() else only.data = value
        return
      }
      // Remove all existing children
      var hadNativeChildren = false
      for (child in node.children) {
        if (child.nativePtr != 0L) {
          hadNativeChildren = true
          break
        }
      }
      node.children.clear()

      // Create a single text node with the new text
      val textNode = TextNode(node.mason, value)
      textNode.attributes.sync(node.style)
      textNode.container = container

      // Add to children
      node.children.add(textNode)
      textNode.parent = node

      // Clear layout tree (text nodes don't have nativePtr)
      if (hadNativeChildren && node.nativePtr != 0L) {
        NativeHelpers.nativeNodeRemoveChildren(node.mason.nativePtr, node.nativePtr)
      }

      invalidateInlineSegments()
    }

  val innerHTML: String
    get() = buildString {
      for (child in node.children) appendHTML(child)
    }

  private fun StringBuilder.appendText(parent: Node) {
    for (child in parent.children) {
      if (child is TextNode) append(child.data) else appendText(child)
    }
  }

  private fun StringBuilder.appendHTML(child: Node) {
    if (child is TextNode) {
      append(android.text.TextUtils.htmlEncode(child.data))
      return
    }

    val textView = child.view as? org.nativescript.mason.masonkit.TextView
    val tag = if (child.isAnonymous) null else
      textView?.type?.takeUnless { it == org.nativescript.mason.masonkit.enums.TextType.None }?.cssValue
    if (tag != null) append('<').append(tag).append('>')
    for (descendant in child.children) appendHTML(descendant)
    if (tag != null) append("</").append(tag).append('>')
  }

  // Web parity: browsers don't add Android's extra "font padding" (top/bottom
  // metrics) to the line box — `line-height: normal` uses the font's recommended
  // ascent/descent (~1.2×). includeFontPadding=true inflated lines to ~1.33×, so
  // default it off to match the web/iOS line box.
  private var mIncludePadding: Boolean = false
  var includePadding: Boolean
    get() {
      return mIncludePadding
    }
    set(value) {
      mIncludePadding = value
      (container.node.view as? Element)?.invalidateLayout()
    }

  // Update attributes on all direct TextNode children when styles change
  internal fun updateStyleOnTextNodes() {
    val defaultAttrs = node.getDefaultAttributes()

    for (child in node.children) {
      if (child is TextNode && child.container === container) {
        // Only update TextNodes that belong to THIS TextView
        // Don't touch TextNodes that belong to child TextViews
        child.attributes.sync(defaultAttrs)
      }
    }
  }


  fun onTextStyleChanged(low: Long, high: Long, paint: Paint, displayMetrics: DisplayMetrics) {
    var dirty = false
    var layout = false

    if (StateKeys.hasFlag(
        low, high, StateKeys.FONT_COLOR
      )
    ) {
      paint.color = style.resolvedColor
      dirty = true
    }

    if (StateKeys.hasFlag(
        low, high, StateKeys.FONT_SIZE
      )
    ) {
      val fontSize = style.resolvedFontSize
      val prevTextSize = paint.textSize
      val newTextSize = if (fontSize == 0) {
        0f
      } else {
        TypedValue.applyDimension(
          TypedValue.COMPLEX_UNIT_SP,
          fontSize.toFloat(),
          displayMetrics
        )
      }
      if (newTextSize != prevTextSize) {
        paint.textSize = newTextSize
        layout = true
        dirty = true
      }
    }

    if (StateKeys.hasFlag(
        low, high, StateKeys.FONT_WEIGHT
      ) || StateKeys.hasFlag(
        low, high, StateKeys.FONT_STYLE
      ) || StateKeys.hasFlag(
        low, high, StateKeys.FONT_FAMILY
      )
    ) {
      style.resolvedFontFace.resolvedTypeface?.let {
        paint.typeface = it
        dirty = true
      }
    }

    if (StateKeys.hasFlag(low, high, StateKeys.FONT_VARIANT_NUMERIC)) {
      val features = FontVariantNumeric.toFontFeatureSettings(style.resolvedFontVariantNumeric)
      paint.fontFeatureSettings = features.ifEmpty { null }
      dirty = true
    }

    if (StateKeys.hasFlag(low, high, StateKeys.WORD_SPACING)) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        paint.wordSpacing = style.resolvedWordSpacing
      }
      dirty = true
    }

    if (StateKeys.hasFlag(low, high, StateKeys.FONT_STRETCH)) {
      val stretchPct = style.resolvedFontStretch
      if (stretchPct > 0 && android.os.Build.VERSION.SDK_INT >= 31) {
        paint.fontVariationSettings = "'wdth' $stretchPct"
      }
      dirty = true
    }


    // Layout-affecting text flags: require invalidateInlineSegments (full recompute).
    val textLayoutChanged = hasTextLayoutFlags(low, high)
    // Visual-only text flags: span rebuild + invalidate, no layout recompute needed.
    val textVisualChanged = !textLayoutChanged && hasTextVisualFlags(low, high)

    if (textLayoutChanged || textVisualChanged) {
      dirty = true
    }

    if (dirty) {
      if (textLayoutChanged) {
        textLayoutFlushPending = true
        if (!textStyleFlushPending) {
          textStyleFlushPending = true
          registerPendingTextStyle(this)
        }
      } else if (textVisualChanged) {
        textVisualFlushPending = true
        if (!textStyleFlushPending) {
          textStyleFlushPending = true
          registerPendingTextStyle(this)
          (node.view as? View)?.invalidate()
        }
      }
      if (layout) {
        if (node.isAnonymous) {
          node.layoutParent?.dirty()
        }
        (node.view as? Element)?.invalidateLayout()
      }
    }
  }

  private var textStyleFlushPending = false
  private var textLayoutFlushPending = false
  private var textVisualFlushPending = false

  internal fun flushTextStyleIfNeeded(quiet: Boolean = false) {
    if (!textStyleFlushPending) return
    pendingTextStyleFlush.remove(this)
    textStyleFlushPending = false
    val layoutPending = textLayoutFlushPending
    val visualPending = textVisualFlushPending
    textLayoutFlushPending = false
    textVisualFlushPending = false
    // A first flush has nothing to compare against, so skip hashing; the next flush
    // stores the signatures (treating them as changed).
    if (!signaturesKnown) {
      if (!layoutPending && !visualPending) return
      if (flushedOnce) {
        signaturesKnown = true
        lastTextLayoutSignature = textLayoutSignature()
        lastTextVisualSignature = textVisualSignature()
      }
      flushedOnce = true
      updateStyleOnTextNodes()
      if (layoutPending) {
        invalidateInlineSegments(quiet = quiet)
      } else if (!quiet) {
        (node.view as? View)?.invalidate()
      }
      return
    }
    if (layoutPending) {
      val sig = textLayoutSignature()
      if (sig == null || sig != lastTextLayoutSignature) {
        lastTextLayoutSignature = sig
        lastTextVisualSignature = textVisualSignature()
        updateStyleOnTextNodes()
        if (sig != null) {
          invalidateInlineSegments(quiet = quiet)
        }
      }
    } else if (visualPending) {
      val sig = textVisualSignature()
      if (sig == null || sig != lastTextVisualSignature) {
        lastTextVisualSignature = sig
        updateStyleOnTextNodes()
        if (!quiet) {
          (node.view as? View)?.invalidate()
        }
      }
    }
  }

  private var lastTextLayoutSignature: Long? = null
  private var lastTextVisualSignature: Long? = null
  private var flushedOnce = false
  private var signaturesKnown = false

  private fun textLayoutSignature(): Long? = try {
    textLayoutSignatureUnsafe()
  } catch (t: Throwable) {
    null
  }

  private fun textLayoutSignatureUnsafe(): Long {
    var h = 0x3456789abcdefL
    h = h * 1000003 xor style.resolvedFontSize.toLong()
    h = h * 1000003 xor (style.resolvedFontFace.resolvedTypeface?.let { System.identityHashCode(it) } ?: 0).toLong()
    h = h * 1000003 xor style.resolvedFontWeight.ordinal.toLong()
    h = h * 1000003 xor style.resolvedFontStyle.hashCode().toLong()
    h = h * 1000003 xor style.resolvedFontVariantNumeric.toLong()
    h = h * 1000003 xor style.resolvedTextWrap.ordinal.toLong()
    h = h * 1000003 xor style.resolvedWhiteSpace.ordinal.toLong()
    h = h * 1000003 xor style.resolvedTextTransform.ordinal.toLong()
    h = h * 1000003 xor style.resolvedLetterSpacing.toRawBits().toLong()
    h = h * 1000003 xor style.resolvedTextJustify.ordinal.toLong()
    h = h * 1000003 xor style.resolvedLineHeight.toRawBits().toLong()
    h = h * 1000003 xor style.resolvedLineHeightType.toLong()
    h = h * 1000003 xor style.resolvedTextAlign.ordinal.toLong()
    h = h * 1000003 xor style.resolvedWordSpacing.toRawBits().toLong()
    h = h * 1000003 xor style.resolvedWordSpacingType.toLong()
    h = h * 1000003 xor style.resolvedWritingMode.toLong()
    h = h * 1000003 xor style.resolvedUnicodeBidi.toLong()
    h = h * 1000003 xor style.resolvedHyphens.toLong()
    h = h * 1000003 xor style.resolvedFontStretch.toLong()
    h = h * 1000003 xor style.textOverflow.ordinal.toLong()
    return h
  }

  private fun textVisualSignature(): Long? = try {
    textVisualSignatureUnsafe()
  } catch (_: Throwable) {
    null
  }

  private fun textVisualSignatureUnsafe(): Long {
    var h = 0x1f123bb5aa77dL
    h = h * 1000003 xor style.resolvedColor.toLong()
    h = h * 1000003 xor style.resolvedDecorationLine.ordinal.toLong()
    h = h * 1000003 xor style.resolvedDecorationColor.toLong()
    h = h * 1000003 xor style.resolvedDecorationStyle.ordinal.toLong()
    h = h * 1000003 xor style.resolvedDecorationThickness.toRawBits().toLong()
    h = h * 1000003 xor style.resolvedTextShadow.hashCode().toLong()
    h = h * 1000003 xor style.resolvedBackgroundColor.toLong()
    return h
  }

  private val DRAW_WIDTH_SLACK = 2

  private fun findCachedStaticLayout(
    length: Int,
    widthConstraint: Int,
    alignment: android.text.Layout.Alignment,
    heuristic: TextDirectionHeuristic,
    justified: Boolean,
    widthSlack: Int = 0
  ): StaticLayoutCacheEntry? {
    for (entry in staticLayoutCache) {
      if (entry != null &&
        entry.version == segmentsInvalidateVersion &&
        entry.widthConstraint == widthConstraint &&
        entry.spannableLength == length &&
        entry.alignment == alignment &&
        entry.includePadding == includePadding &&
        entry.justified == justified &&
        entry.heuristic == heuristic
      ) {
        return entry
      }
    }
    if (justified) return null
    val safeWidthConstraint = if (widthConstraint == Int.MAX_VALUE) 1_000_000 else widthConstraint
    for (entry in staticLayoutCache) {
      if (entry != null &&
        entry.widthIndependent &&
        entry.version == segmentsInvalidateVersion &&
        entry.spannableLength == length &&
        entry.alignment == alignment &&
        entry.includePadding == includePadding &&
        !entry.justified &&
        entry.heuristic == heuristic &&
        entry.maxLineWidth <= safeWidthConstraint &&
        safeWidthConstraint <= entry.layout.width + widthSlack
      ) {
        return entry
      }
    }
    return null
  }

  // Builds (or reuses a cached) StaticLayout for the given shape — the
  // expensive step (text shaping + line breaking) in measureLayout(). Other
  // work in that function (width resolution, segment collection) still runs
  // every call regardless of cache hits.
  private fun buildStaticLayoutCached(
    spannable: CharSequence,
    paint: TextPaint,
    widthConstraint: Int,
    alignment: android.text.Layout.Alignment,
    heuristic: TextDirectionHeuristic
  ): StaticLayoutCacheEntry {
    val justified = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      style.resolvedTextAlign == TextAlign.Justify

    // StaticLayout's internal Int arithmetic overflows on Int.MAX_VALUE ("unconstrained"),
    // producing garbage line breaks. Match iOS's finite fallback instead.
    val safeWidthConstraint = if (widthConstraint == Int.MAX_VALUE) 1_000_000 else widthConstraint

    findCachedStaticLayout(spannable.length, widthConstraint, alignment, heuristic, justified)?.let {
      return it
    }

    val built = singleLineLayout(spannable, paint, safeWidthConstraint, alignment, justified)
      ?: if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      var builder = StaticLayout.Builder.obtain(
        spannable, 0, spannable.length, paint, safeWidthConstraint
      )
        .setAlignment(alignment)
        .setLineSpacing(0f, 1f)
        .setIncludePad(includePadding)
        .setTextDirection(heuristic as android.text.TextDirectionHeuristic)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        builder = builder.setUseLineSpacingFromFallbacks(true)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        builder = if (justified) {
          builder.setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_INTER_WORD)
        } else {
          builder.setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_NONE)
        }
      }

      builder.build()
    } else {
      StaticLayout(
        spannable, paint, safeWidthConstraint, alignment, 1f, // lineSpacingMultiplier
        0f, // lineSpacingExtra
        includePadding // includePad
      )
    }

    val entry = StaticLayoutCacheEntry(
      version = segmentsInvalidateVersion,
      widthConstraint = widthConstraint,
      spannableLength = spannable.length,
      alignment = alignment,
      includePadding = includePadding,
      justified = justified,
      heuristic = heuristic,
      layout = built,
      keepsTrailingSpaces = keepsTrailingSpaces(),
      advances = if (justified) null else advancesFor(spannable, paint)
    )
    staticLayoutCache[staticLayoutCacheNextIdx] = entry
    staticLayoutCacheNextIdx = (staticLayoutCacheNextIdx + 1) % staticLayoutCache.size

    return entry
  }

  private fun currentText(): SpannableStringBuilder {
    return try {
      buildAttributedString()
    } catch (_: Exception) {
      // If attributed string construction fails (span errors), fall back
      // to a plain-text concatenation of direct TextNode children so
      // the view still renders readable text instead of nothing.
      val fallback = SpannableStringBuilder()
      for (child in node.children) {
        if (child is TextNode) fallback.append(child.data)
      }
      fallback
    }
  }

  internal fun applyTextIfNeeded(): SpannableStringBuilder {
    flushTextStyleIfNeeded()
    val spannable = currentText()
    if (node.children.isNotEmpty() && appliedTextVersion != segmentsInvalidateVersion) {
      try {
        (container as? TextView)?.setTextDeferred(spannable, BufferType.SPANNABLE)
          ?: container.setText(spannable, BufferType.SPANNABLE)
      } catch (_: Exception) {
        container.setText(spannable.toString(), BufferType.NORMAL)
      }
      appliedTextVersion = segmentsInvalidateVersion
    }
    return spannable
  }

  internal class MeasureWidthSpec(
    val constraint: Int,
    val isInline: Boolean
  )

  private fun computeWidthConstraint(
    knownWidth: Float,
    knownHeight: Float,
    availableWidth: Float
  ): MeasureWidthSpec {
    // Determine the width constraint for StaticLayout
    // For inline elements, we want to measure to content, not fill available width
    val isInline = NodeUtils.isInlineLike(node)

    var allowWrap = true
    if (node.style.isValueInitialized) {
      val ws = node.style.whiteSpace
      // No wrap for pre / nowrap
      if (ws == Styles.WhiteSpace.Pre || ws == Styles.WhiteSpace.NoWrap) {
        allowWrap = false
      }
      // Explicit override
      if (node.style.textWrap == TextWrap.NoWrap) {
        allowWrap = false
      }
    }

    var widthConstraint = Int.MAX_VALUE

    // `knownWidth` is Taffy's resolved box width, which may be narrower than nowrap
    // content's intrinsic width (e.g. under overflow:hidden); don't wrap to it in that case.
    if (allowWrap && knownWidth > 0 && knownHeight != Float.MIN_VALUE) {
      widthConstraint = knownWidth.toInt()
    }

    if (isInline) {
      widthConstraint = Int.MAX_VALUE
    }

    // The available space from the layout engine (Taffy's compute_leaf_layout)
    // is already content-box (padding+border subtracted). Do NOT subtract
    // padding again here — that would double-count it. Skip entirely when
    // wrapping is disabled so nowrap text stays unconstrained.
    if (allowWrap && widthConstraint == Int.MAX_VALUE && availableWidth.isFinite() && availableWidth > 0f) {
      widthConstraint = availableWidth.toInt()
    }

    // Respect style `max-width` when present (Points only), clamping so
    // StaticLayout won't measure wider than intended. Percent/Auto need
    // context-dependent resolution and aren't handled here.
    //
    // Skipped during the min-content pass (availableWidth == -1): min-content
    // is the widest unbreakable word and isn't reduced by max-width. Clamping
    // there would make a grid item's min-content as large as its max-width,
    // preventing an `auto` track from shrinking to fit its container.
    // The line length runs along the height in vertical writing modes (mason-core hands it
    // over as the width), so max-height limits it there.
    val vertical = isVerticalWritingMode
    if (availableWidth != -1f) when (val msw = if (vertical) style.maxHeight else style.maxWidth) {
      is Dimension.Points -> {
        val resolvedMax = msw.points.toInt()
        if (resolvedMax > 0) {
          widthConstraint = if (widthConstraint == Int.MAX_VALUE) resolvedMax
          else kotlin.math.min(widthConstraint, resolvedMax)
        }
      }

      else -> {}
    }
    // If this node's parent is floated, try to honor the parent's
    // resolved content-box width as an additional constraint during
    // measurement. Floated parents may reduce available inline width and
    // cause wrapping to behave differently; clamp the widthConstraint to
    // the parent's content-box when possible.

    val p = if (vertical) null else node.parent
    if (p != null) {
      val pFloat = try {
        p.style.float
      } catch (_: Throwable) {
        null
      }
      if (pFloat != null && pFloat != org.nativescript.mason.masonkit.enums.Float.None) {
        val pWidth = p.computedWidth
        val pPadL = try {
          p.computedPaddingLeft
        } catch (_: Throwable) {
          0f
        }
        val pPadR = try {
          p.computedPaddingRight
        } catch (_: Throwable) {
          0f
        }
        val pContent = pWidth - pPadL - pPadR
        if (pContent > 0f) {
          val pCW = pContent.toInt()
          val before = widthConstraint
          widthConstraint = if (widthConstraint == Int.MAX_VALUE) pCW
          else kotlin.math.min(widthConstraint, pCW)
        }
      }
    }

    return MeasureWidthSpec(widthConstraint, isInline)
  }

  private fun measureLayout(
    paint: TextPaint,
    availableWidth: Float,
    availableHeight: Float,
    spec: MeasureWidthSpec
  ): Layout? {
    val spannable = applyTextIfNeeded()
    (container.node.view as? View)?.let {
      if (it.layoutParams == null) {
        it.layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
        )
      }
    }

    if (spannable.isEmpty() && node.children.isEmpty()) {
      return null
    }

    val alignment = getLayoutAlignment()  // Use the alignment from textAlign property
    val textDirectionHeuristic = getTextDirectionHeuristic()

    val entry = buildStaticLayoutCached(
      spannable, paint, spec.constraint, alignment, textDirectionHeuristic
    )
    val layout = entry.layout

    val measuredWidth = if (spec.constraint == Int.MAX_VALUE && availableWidth == -1f &&
      !(spec.isInline && !hasSoftWrapOpportunity(spannable))
    ) {
      maxWordWidth(spannable, paint, spec.isInline, if (spec.isInline) advancesFor(spannable, paint) else null)
    } else {
      entry.maxLineWidth
    }

    // Store the actual measured dimensions (not the constraints)

    when (availableWidth) {
      -1f -> {
        this.minMeasuredTextWidth = measuredWidth
      }

      -2f -> {
        this.maxMeasuredTextWidth = measuredWidth
      }

      else -> {
        this.measuredTextWidth = measuredWidth
      }
    }

    when (availableHeight) {
      -1f -> {
        this.minMeasuredTextHeight = layout.height.toFloat()
      }

      -2f -> {
        this.maxMeasuredTextHeight = layout.height.toFloat()
      }

      else -> {
        this.measuredTextHeight = layout.height.toFloat()
      }
    }

    if (container is TextView) {
      if (entry.widthIndependent) {
        container.setCachedStaticLayout(layout, entry.maxLineWidth.toInt(), layout.width + DRAW_WIDTH_SLACK)
      } else {
        container.setCachedStaticLayout(layout, spec.constraint)
      }
    }

    // CRITICAL: Collect and send segments to Rust
    collectAndCacheSegments(layout, spannable, paint, entry.maxLineWidth)

    return layout
  }

  internal fun getLayoutAlignment(): android.text.Layout.Alignment {
    return when (style.resolvedTextAlign) {
      TextAlign.Left, TextAlign.Start -> android.text.Layout.Alignment.ALIGN_NORMAL
      TextAlign.Right, TextAlign.End -> android.text.Layout.Alignment.ALIGN_OPPOSITE
      TextAlign.Center -> android.text.Layout.Alignment.ALIGN_CENTER
      TextAlign.Justify -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          android.text.Layout.Alignment.ALIGN_NORMAL // Justify handled by justificationMode
        } else {
          android.text.Layout.Alignment.ALIGN_NORMAL
        }
      }

      else -> android.text.Layout.Alignment.ALIGN_NORMAL
    }
  }

  /**
   * Resolve CSS `direction` / `unicode-bidi` / `writing-mode` into a
   * [TextDirectionHeuristic] for [StaticLayout.Builder.setTextDirection].
   *
   * Writing-mode values:
   *   0 = horizontal-tb (default)
   *   1 = vertical-rl
   *   2 = vertical-lr
   *   3 = sideways-rl
   *   4 = sideways-lr
   *
   * Unicode-bidi values:
   *   0 = normal         → use first-strong heuristic
   *   1 = embed           → force LTR/RTL based on writing-mode direction
   *   2 = bidi-override   → force LTR/RTL (override character bidi)
   *   3 = isolate          → use first-strong heuristic
   *   4 = isolate-override → force LTR/RTL
   *   5 = plaintext        → use first-strong heuristic
   */

  /** writing-mode: vertical-rl / vertical-lr. Lines run along the height and are drawn rotated. */
  internal val isVerticalWritingMode: Boolean
    get() = style.isValueInitialized && style.resolvedWritingMode.toInt().let { it == 1 || it == 2 }

  internal fun getTextDirectionHeuristic(): TextDirectionHeuristic {
    val writingMode = style.resolvedWritingMode.toInt()
    val bidi = style.resolvedUnicodeBidi.toInt()
    val direction = style.direction

    // Determine the base direction from CSS `direction` property.
    // writing-mode vertical-rl / sideways-rl are inherently RTL in the
    // cross axis, but character direction still follows `direction`.
    val isRTL = direction == Direction.RTL

    return when (bidi) {
      // embed, bidi-override, isolate-override → force direction
      1, 2, 4 -> {
        if (isRTL) TextDirectionHeuristics.RTL
        else TextDirectionHeuristics.LTR
      }
      // normal, isolate, plaintext → first-strong heuristic
      else -> {
        if (isRTL) TextDirectionHeuristics.FIRSTSTRONG_RTL
        else TextDirectionHeuristics.FIRSTSTRONG_LTR
      }
    }
  }

  fun measure(
    paint: TextPaint,
    knownWidth: Float, knownHeight: Float,
    availableWidth: Float, availableHeight: Float
  ): Long {
    // Guard: Rust holds a read lock during measure — no buffer writes allowed
    style.inMeasure = true
    // Post the flush once per dirty episode, not once per measure call — a node is
    // measured many times per compute and each post was a Handler message.
    val pendingInvalidate = style.fontDirty && !style.pendingMetricsSync
    try {
      if (!warming) deferredSegments?.let {
        deferredSegments = null
        NativeHelpers.nativeNodeSetSegmentsPacked(node.mason.nativePtr, node.nativePtr, it.floats, it.longs, it.kinds)
      }
      flushTextStyleIfNeeded()
      val mcSpec = computeWidthConstraint(knownWidth, knownHeight, availableWidth)
      val mcWKey = mcSpec.constraint.toLong()
      val mcWMode = when (availableWidth) {
        -1f -> 0L
        -2f -> 1L
        else -> 2L
      }
      if (mcWMode == 2L && !warming) {
        lastDefiniteKnownWidth = knownWidth
        lastDefiniteKnownHeight = knownHeight
        lastDefiniteAvailableWidth = availableWidth
        lastDefiniteAvailableHeight = availableHeight
      }
      val ver = segmentsInvalidateVersion.toLong()
      for (probe in 0 until MEASURE_CACHE_SIZE) {
        val i = (measureCacheNext - 1 - probe + MEASURE_CACHE_SIZE) % MEASURE_CACHE_SIZE
        val b = i * 3
        if (measureCacheKeys[b] == ver && measureCacheKeys[b + 1] == mcWKey &&
          measureCacheKeys[b + 2] == mcWMode
        ) {
          style.syncFontMetrics()
          return measureCacheVals[i]
        }
      }
      if (mcWMode == 2L && maxContentVersion == ver &&
        mcSpec.constraint >= maxContentWidth && mcSpec.constraint <= maxContentConstraint
      ) {
        storeMeasure(ver, mcWKey, mcWMode, maxContentOut)
        style.syncFontMetrics()
        return maxContentOut
      }
      val layout = measureLayout(
        paint,
        availableWidth,
        availableHeight,
        mcSpec
      )


      // Use the actual measured dimensions from the layout
      val width = if (layout != null) {
        when (availableWidth) {
          -1f -> minMeasuredTextWidth
          -2f -> maxMeasuredTextWidth
          else -> measuredTextWidth
        }
      } else {
        0f
      }

      val height = if (layout != null) {
        when (availableHeight) {
          -1f -> minMeasuredTextHeight
          -2f -> maxMeasuredTextHeight
          else -> measuredTextHeight
        }
      } else {
        0f
      }
      // Deferred: syncFontMetrics will set pendingMetricsSync instead of writing
      style.syncFontMetrics()

      val minLineHeight = minLineHeight(paint)

      val measuredHeight = layout?.height?.toFloat()

      // A text node holding only collapsible whitespace (e.g. a JSX/HTML
      // newline+indent between sibling elements) must collapse to 0x0 rather
      // than floor to minLineHeight. `white-space: pre*`/`break-spaces` opt out.
      val preservesWhitespace = node.style.isValueInitialized && when (node.style.whiteSpace) {
        Styles.WhiteSpace.Pre, Styles.WhiteSpace.PreWrap,
        Styles.WhiteSpace.PreLine, Styles.WhiteSpace.BreakSpaces -> true
        else -> false
      }

      val laidOutContent = layout?.text ?: textContent
      val isCollapsibleWhitespace = !preservesWhitespace && laidOutContent.isBlank()

      val finalHeight = if (isCollapsibleWhitespace) 0f else measuredHeight?.coerceAtLeast(minLineHeight) ?: height
      val finalWidth = if (isCollapsibleWhitespace) 0f else width

      val mcOut = MeasureOutput.make(finalWidth, finalHeight)
      storeMeasure(segmentsInvalidateVersion.toLong(), mcWKey, mcWMode, mcOut)
      if (mcWMode == 1L) {
        maxContentVersion = segmentsInvalidateVersion.toLong()
        maxContentWidth = ceil(finalWidth).toInt()
        maxContentConstraint = mcSpec.constraint
        maxContentOut = mcOut
      }
      return mcOut
    } finally {
      style.inMeasure = false
      if (pendingInvalidate) {
        // Schedule flush for after Rust releases the read lock.
        // View.post runs on the next message-loop iteration when the lock is no longer held.
        (node.view as? View)?.post {
          if (style.flushPendingMetricsSync()) {
            node.dirty()
            (node.view as? View)?.let {
              it.invalidate()
              it.requestLayout()
            }
          }
        }
      }
    }
  }

  /**
   * Build a float-aware StaticLayout that wraps text around floated sibling elements.
   * Called AFTER layout has been computed and view positions are known (during draw phase).
   * Returns null if there are no float exclusions or API level < M.
   */
  internal fun buildFloatAwareStaticLayout(paint: TextPaint): StaticLayout? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || isVerticalWritingMode) return null

    val parentNode = node.parent ?: return null
    val view = container.node.view as? View ?: return null
    val frame = view.drawingTime
    if (frame != 0L && parentNode.floatScanFrame == frame && !parentNode.floatScanHasFloat) return null

    // Collect floated sibling exclusions from the parent's children.
    // Expand each exclusion by the float's margins to match CSS margin-box behavior.
    val exclusions = mutableListOf<FloatExclusion>()
    for (child in parentNode.children) {
      if (child === node) continue
      if (child.type != NodeType.Element) continue
      val childView = child.view as? View ?: continue
      if (!child.style.isValueInitialized) continue
      val floatSide = try {
        child.style.float
      } catch (_: Throwable) {
        continue
      }
      if (floatSide == org.nativescript.mason.masonkit.enums.Float.None) continue

      // Read margins from the float's style to expand the exclusion to the margin box
      val margin = try {
        child.style.margin
      } catch (_: Throwable) {
        null
      }
      val ml = resolveMarginValue(margin?.left)
      val mr = resolveMarginValue(margin?.right)
      val mt = resolveMarginValue(margin?.top)
      val mb = resolveMarginValue(margin?.bottom)

      // Use Android View positions (border-box) expanded by margins
      exclusions.add(
        FloatExclusion(
          (childView.left - ml).toInt(), (childView.top - mt).toInt(),
          (childView.right + mr).toInt(), (childView.bottom + mb).toInt(),
          floatSide
        )
      )
    }

    if (frame != 0L) {
      val selfFloats = node.style.isValueInitialized && try {
        node.style.float != org.nativescript.mason.masonkit.enums.Float.None
      } catch (_: Throwable) {
        false
      }
      parentNode.floatScanFrame = frame
      parentNode.floatScanHasFloat = exclusions.isNotEmpty() || selfFloats
    }
    if (exclusions.isEmpty()) return null

    // Get text from the container (already set during measure)
    if (container !is TextView && container !is android.widget.TextView) return null
    val text: Spannable = currentText()
    if (text.isEmpty()) return null

    val viewWidth = view.width
    if (viewWidth <= 0) return null

    val padL = view.paddingLeft
    val padR = view.paddingRight
    val padT = view.paddingTop
    val contentWidth = viewWidth - padL - padR
    if (contentWidth <= 0) return null

    val textLeft = view.left
    val textTop = view.top

    // Estimate line height from font metrics
    paint.getFontMetrics(scratchFontMetrics)
    val fm = scratchFontMetrics
    val lineH = (-fm.ascent + fm.descent).coerceAtLeast(1f)

    // Calculate max number of lines we need to consider
    val maxExclBottom = exclusions.maxOf { it.bottom }
    val maxLines = ((maxExclBottom - textTop).toFloat() / lineH + 20).toInt().coerceIn(1, 500)

    val leftIndents = IntArray(maxLines)
    val rightIndents = IntArray(maxLines)

    var hasIndents = false

    for (line in 0 until maxLines) {
      val lineTopInParent = textTop + padT + (line * lineH)
      val lineBottomInParent = lineTopInParent + lineH

      var leftInset = 0f
      var rightInset = 0f

      for (e in exclusions) {
        // Check vertical overlap
        if (lineBottomInParent > e.top && lineTopInParent < e.bottom) {
          when (e.side) {
            org.nativescript.mason.masonkit.enums.Float.Left -> {
              // Left float: indent from left = float's right edge - text content left edge
              val indent = e.right.toFloat() - (textLeft + padL)
              leftInset = maxOf(leftInset, indent)
            }

            org.nativescript.mason.masonkit.enums.Float.Right -> {
              // Right float: indent from right = text content right edge - float's left edge
              val indent = (textLeft + viewWidth - padR).toFloat() - e.left.toFloat()
              rightInset = maxOf(rightInset, indent)
            }

            else -> {}
          }
        }
      }

      leftIndents[line] = leftInset.toInt().coerceAtLeast(0)
      rightIndents[line] = rightInset.toInt().coerceAtLeast(0)

      if (leftIndents[line] > 0 || rightIndents[line] > 0) hasIndents = true
    }

    if (!hasIndents) return null

    val alignment = getLayoutAlignment()

    val heuristic = getTextDirectionHeuristic()

    var builder = StaticLayout.Builder.obtain(text, 0, text.length, paint, contentWidth)
      .setAlignment(alignment)
      .setLineSpacing(0f, 1f)
      .setIncludePad(includePadding)
      .setTextDirection(heuristic)
      .setIndents(leftIndents, rightIndents)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      builder = builder.setUseLineSpacingFromFallbacks(true)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      builder = if (style.resolvedTextAlign == TextAlign.Justify) {
        builder.setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_INTER_WORD)
      } else {
        builder.setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_NONE)
      }
    }

    return builder.build()
  }

  /**
   * Rebuild and cache a plain StaticLayout at the given content width. Used by
   * onDraw after rotation, when Taffy reuses cached measure results so measure()
   * never re-runs — leaving cachedStaticLayout null after onSizeChanged cleared
   * it, which would drop drawing back to the platform's top-aligned TextView.
   */
  internal fun rebuildCachedStaticLayout(paint: TextPaint, contentWidth: Int): android.text.Layout? {
    if (contentWidth <= 0) return null
    if (container !is TextView && container !is android.widget.TextView) return null
    val text: Spannable = currentText()
    if (text.isEmpty()) return null

    var allowWrap = true
    if (node.style.isValueInitialized) {
      val ws = node.style.whiteSpace
      if (ws == Styles.WhiteSpace.Pre || ws == Styles.WhiteSpace.NoWrap) {
        allowWrap = false
      }
      if (node.style.textWrap == TextWrap.NoWrap) {
        allowWrap = false
      }
    }

    // Clamp like buildStaticLayoutCached's safeWidthConstraint, and stay
    // unconstrained when wrapping is disabled (this path didn't check nowrap before).
    val safeContentWidth = if (!allowWrap) 1_000_000 else contentWidth.coerceAtMost(1_000_000)

    val alignment = getLayoutAlignment()
    val heuristic = getTextDirectionHeuristic()
    val justified = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      style.resolvedTextAlign == TextAlign.Justify
    findCachedStaticLayout(
      text.length, if (allowWrap) contentWidth else Int.MAX_VALUE, alignment, heuristic, justified,
      DRAW_WIDTH_SLACK
    )?.let {
      if (container is TextView) {
        container.setCachedStaticLayout(it.layout, contentWidth)
      }
      return it.layout
    }
    val layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      var builder = StaticLayout.Builder.obtain(text, 0, text.length, paint, safeContentWidth)
        .setAlignment(alignment)
        .setLineSpacing(0f, 1f)
        .setIncludePad(includePadding)
        .setTextDirection(heuristic as android.text.TextDirectionHeuristic)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        builder = builder.setUseLineSpacingFromFallbacks(true)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        builder = if (justified) {
          builder.setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_INTER_WORD)
        } else {
          builder.setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_NONE)
        }
      }
      builder.build()
    } else {
      StaticLayout(text, paint, safeContentWidth, alignment, 1f, 0f, includePadding)
    }

    if (container is TextView) {
      container.setCachedStaticLayout(layout, contentWidth)
    }
    return layout
  }

  private fun collectAndCacheSegments(
    layout: android.text.Layout,
    attributed: SpannableStringBuilder,
    paint: TextPaint,
    lineWidth: Float
  ) {
    // Nothing relevant changed since the segments already sent for this
    // exact layout — skip the full spannable walk + JNI push.
    for (i in segmentsCacheLayouts.indices) {
      if (segmentsCacheLayouts[i] === layout && segmentsCacheVersions[i] == segmentsInvalidateVersion) {
        return
      }
    }

    val segments = mutableListOf<InlineSegment>()

    // Use a TextPaint matching the current TextView properties for consistent measurement
    val textPaint by lazy(LazyThreadSafetyMode.NONE) { scratchSegmentPaint.apply { set(paint) } }

    // Pre-collect all ViewSpan and BrSpan boundaries sorted by start position
    // in a single O(spans) pass; subsequent lookups are O(1) via index cursor.
    data class SpanBoundary(val start: Int, val end: Int, val viewSpan: ViewSpan?, val isBr: Boolean)
    val spBoundaries = ArrayList<SpanBoundary>(8)
    for (sp in attributed.getSpans(0, attributed.length, ViewSpan::class.java)) {
      spBoundaries.add(SpanBoundary(attributed.getSpanStart(sp), attributed.getSpanEnd(sp), sp, false))
    }
    for (sp in attributed.getSpans(0, attributed.length, BrSpan::class.java)) {
      spBoundaries.add(SpanBoundary(attributed.getSpanStart(sp), attributed.getSpanEnd(sp), null, true))
    }
    spBoundaries.sortBy { it.start }

    // Walk through the spannable to find text runs and view placeholders
    var currentPos = 0
    var bIdx = 0  // cursor into spBoundaries

    while (currentPos < attributed.length) {

      // Advance boundary cursor past any spans that end before currentPos
      while (bIdx < spBoundaries.size && spBoundaries[bIdx].start < currentPos) bIdx++

      val boundary = if (bIdx < spBoundaries.size && spBoundaries[bIdx].start == currentPos)
        spBoundaries[bIdx] else null

      if (boundary != null && boundary.isBr) {
        segments.add(InlineSegment.Br())
        currentPos = boundary.end
        bIdx++
        continue
      }

      if (boundary != null && boundary.viewSpan != null) {
        val viewSpan = boundary.viewSpan
        val rawHeight = viewSpan.childNode.cachedHeight.takeIf { it > 0 }
          ?: viewSpan.childNode.computedHeight

        // Keep reported child heights as-is (zero heights are meaningful
        // for writeback detection). This follows browser semantics where the
        // replaced element's intrinsic height is used by the line box.
        val height = rawHeight

        // Compute baseline (distance from bottom to baseline) for the
        // inline-child using the same vertical-align logic as ViewSpan.getSize().
        val verticalAlign = if (viewSpan.childNode.style.isValueInitialized) {
          viewSpan.childNode.style.verticalAlign
        } else {
          VerticalAlign.Baseline
        }

        var baseline = 0f
        try {
          val pFm = paint.fontMetricsInt
          when (verticalAlign) {
            VerticalAlign.Baseline -> {
              baseline = 0f
            }

            VerticalAlign.TextTop -> {
              val fontAscent = -pFm.ascent.toFloat()
              val belowAscent = height + pFm.ascent
              baseline = pFm.descent.coerceAtLeast(belowAscent.toInt()).toFloat()
            }

            VerticalAlign.TextBottom -> {
              baseline = pFm.descent.toFloat()
            }

            VerticalAlign.Middle -> {
              val xHeight = (-pFm.ascent * 0.5f)
              val halfHeight = height / 2f
              baseline = halfHeight - xHeight / 2f
            }

            VerticalAlign.Top -> {
              baseline = 0f
            }

            VerticalAlign.Bottom -> {
              baseline = height
            }

            VerticalAlign.Sub -> {
              baseline = pFm.descent.toFloat()
            }

            VerticalAlign.Super -> {
              val raiseAmount = (-pFm.ascent * 0.5f)
              baseline = -raiseAmount
            }

            VerticalAlign.Length -> {
              val offset = verticalAlign.value.toInt()
              baseline = -offset.toFloat()
            }

            VerticalAlign.Percent -> {
              val offset = ((-pFm.ascent + pFm.descent) * verticalAlign.value / 100f)
              baseline = -offset
            }

            else -> {
              baseline = 0f
            }
          }
        } catch (_: Throwable) {
          baseline = 0f
        }

        segments.add(
          InlineSegment.InlineChild(
            viewSpan.childNode.nativePtr, baseline  // send baseline/descent
          )
        )

        currentPos = boundary.end
        bIdx++
      } else {
        // Text run: extends from currentPos to the next ViewSpan/BrSpan boundary (or end).
        // Use the pre-collected boundary cursor — no per-iteration getSpans() scan needed.
        val end = if (bIdx < spBoundaries.size) spBoundaries[bIdx].start else attributed.length

        if (end > currentPos) {
          // Width via StaticLayout horizontal positions, using the attributed
          // string directly to avoid a subSequence copy.
          //
          // getPrimaryHorizontal() resolves a full bidi-aware position per
          // offset, so calling it twice repeats that work. For a single-line,
          // non-RTL run, glyph advance is the same in logical or visual order,
          // so Layout.getDesiredWidth() gives an equivalent result more
          // cheaply. Multi-line or RTL runs use the exact bidi-safe path.
          val singleLine = layout.getLineForOffset(currentPos) == layout.getLineForOffset(end)
          val wholeLine = currentPos == 0 && end == attributed.length && layout.lineCount == 1 &&
            !attributed[end - 1].isWhitespace()
          val advances = advancesFor(attributed, paint)
          val ltr = advances != null ||
            !TextDirectionHeuristics.ANYRTL_LTR.isRtl(attributed, currentPos, end - currentPos)
          val width = if (wholeLine && ltr) {
            lineWidth
          } else if (singleLine && ltr) {
            advances?.let { advanceSum(it, currentPos, end) }
              ?: Layout.getDesiredWidth(attributed, currentPos, end, textPaint)
          } else {
            try {
              val startX = layout.getPrimaryHorizontal(currentPos)
              val endX = layout.getPrimaryHorizontal(end)
              kotlin.math.abs(endX - startX)
            } catch (_: Throwable) {
              Layout.getDesiredWidth(attributed, currentPos, end, textPaint)
            }
          }

          val fontMetrics = if (advances != null) {
            uniformFontMetrics()
          } else {
            // Apply character style spans to a single reused TextPaint (avoids a
            // TextPaint allocation per run). Paint.set() copies all fields cheaply.
            val runPaint = scratchRunPaint
            runPaint.set(textPaint)
            val spans =
              attributed.getSpans(currentPos, end, android.text.style.CharacterStyle::class.java)
            for (span in spans) {
              span.updateDrawState(runPaint)
            }
            runPaint.getFontMetrics(scratchFontMetrics)
            scratchFontMetrics
          }
          segments.add(
            InlineSegment.Text(
              style.resolvedWhiteSpace.value,
              ceil(width),
              -fontMetrics.ascent,
              fontMetrics.descent
            )
          )

          currentPos = end
        } else {
          currentPos++
        }
      }
    }

    // Push segments to native: prefer packed primitive arrays (faster JNI path),
    // falling back to the object-array `InlineSegment[]` route if packing or
    // the packed JNI call fails for any reason.
    if (node.nativePtr != 0L) {

      val count = segments.size
      val kinds = IntArray(count)
      val floats = FloatArray(count * 4)
      val longs = LongArray(count)

      for (i in 0 until count) {
        when (val seg = segments[i]) {
          is InlineSegment.Text -> {
            kinds[i] = 0
            floats[i * 4 + 0] = seg.width
            floats[i * 4 + 1] = seg.ascent
            floats[i * 4 + 2] = seg.descent
            floats[i * 4 + 3] = seg.flags.toFloat()
          }

          is InlineSegment.InlineChild -> {
            kinds[i] = 1
            longs[i] = seg.id
            floats[i * 4 + 0] = seg.descent
          }

          is InlineSegment.Br -> {
            kinds[i] = 2
          }

          else -> {
            kinds[i] = -1
          }
        }
      }
      if (warming) {
        deferredSegments = PackedSegments(floats, longs, kinds)
      } else {
        deferredSegments = null
        NativeHelpers.nativeNodeSetSegmentsPacked(
          node.mason.nativePtr,
          node.nativePtr,
          floats,
          longs,
          kinds
        )
      }
    }

    // segments are up-to-date now — align attributedStringVersion so cache checks succeed
    attributedStringVersion = segmentsInvalidateVersion
    segmentsCacheLayouts[segmentsCacheNextIdx] = layout
    segmentsCacheVersions[segmentsCacheNextIdx] = segmentsInvalidateVersion
    segmentsCacheNextIdx = (segmentsCacheNextIdx + 1) % segmentsCacheLayouts.size
  }

  private fun findNextViewSpan(text: SpannableStringBuilder, start: Int): Int {
    val spans = text.getSpans(start, text.length, ViewSpan::class.java)
    return if (spans.isNotEmpty()) {
      text.getSpanStart(spans[0])
    } else {
      -1
    }
  }

  // Resolve an int value taking pseudo-set buffers into account. If a
  // pseudo-style has explicitly set the given key, prefer that value.
  private fun resolvePseudoInt(valueKey: Int, key: StateKeys, base: Int): Int {
    val mask = node.pseudoMask
    if (mask == 0) return base
    var result = base
    for (state in PSEUDO_CSS_ORDER) {
      if (mask and state.mask != 0) {
        val buf = node.getPseudoBuffer(state.mask)
        if (buf.capacity() >= StyleKeys.PSEUDO_SET_MASK_HIGH + 8) {
          val setLow = buf.getLong(StyleKeys.PSEUDO_SET_MASK_LOW)
          val setHigh = buf.getLong(StyleKeys.PSEUDO_SET_MASK_HIGH)
          if ((setLow and key.low) != 0L || (setHigh and key.high) != 0L) {
            try {
              result = buf.getInt(valueKey)
            } catch (_: Throwable) {
            }
          }
        }
      }
    }
    return result
  }


  // Helper to capture view as bitmap for rendering
  private class ViewHelper(val view: View, val node: Node) {
    var bitmap: android.graphics.Bitmap? = null

    fun updateBitmap(afterLayout: Boolean) {
      var width = node.computedWidth.toInt()
      var height = node.computedHeight.toInt()

      // If the computed layout doesn't provide a valid size yet, try an
      // intrinsic measure pass so we can produce a bitmap.
      if (width <= 0 || height <= 0) {
        view.measure(
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        )
        val mw = view.measuredWidth
        val mh = view.measuredHeight
        if (mw > 0 && mh > 0) {
          width = mw
          height = mh
        } else {
          // nothing we can draw right now
          return
        }
      }

      view.layout(0, 0, width, height)

      bitmap = createBitmap(width, height)
      val canvas = Canvas(bitmap!!)
      view.draw(canvas)
    }
  }

  class BrSpan : CharacterStyle(), UpdateLayout {
    override fun updateDrawState(tp: TextPaint?) {}
  }


  // Custom span for inline child views
  private inner class ViewSpan(
    val childNode: Node, private val viewHelper: ViewHelper
  ) : ReplacementSpan() {
    // Where the box sits, in layout coordinates, as of the last draw. The text view lays
    // the box's real view out there.
    internal val drawnRect = RectF()
    internal var drawn = false

    /**
     * The box's extent along the line, then across it. Vertical text runs its lines down
     * the page, so the box's height runs along the line.
     */
    private fun lineExtents(): Pair<Int, Int> {
      var width = if (childNode.cachedWidth > 0) childNode.cachedWidth.toInt() else childNode.computedWidth.toInt()
      var height = if (childNode.cachedHeight > 0) childNode.cachedHeight.toInt() else childNode.computedHeight.toInt()
      if ((width <= 0 || height <= 0) && childNode.view is View) {
        val childView = childNode.view as View
        childView.measure(
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        )
        if (childView.measuredWidth > 0) width = childView.measuredWidth
        if (childView.measuredHeight > 0) height = childView.measuredHeight
      }
      if (isVerticalWritingMode) return height to width
      // A block-level box spans the line, as the web's block in inline content does.
      if (childNode.style.display == Display.Block) {
        var parentWidth = childNode.parent?.computedWidth?.toInt() ?: 0
        if (parentWidth <= 0) parentWidth = findAncestorElement(childNode)?.node?.computedWidth?.toInt() ?: 0
        if (parentWidth <= 0) parentWidth = container.node.computedWidth.toInt()
        if (parentWidth > 0) width = parentWidth
      }
      return width to height
    }

    override fun getSize(
      paint: Paint, text: CharSequence?, start: Int, end: Int, fm: Paint.FontMetricsInt?
    ): Int {
      val (width, height) = lineExtents()

      // Get vertical-align from child's style
      val verticalAlign = if (childNode.style.isValueInitialized) {
        childNode.style.verticalAlign
      } else {
        VerticalAlign.Baseline
      }

      val parentFm = paint.fontMetricsInt
      val lineHeight = -parentFm.ascent + parentFm.descent

      fm?.let { metrics ->
        when (verticalAlign) {
          VerticalAlign.Baseline -> {
            metrics.ascent = -height
            metrics.descent = 0
          }

          VerticalAlign.TextTop -> {
            metrics.ascent = parentFm.ascent
            val belowAscent = height + parentFm.ascent
            metrics.descent = parentFm.descent.coerceAtLeast(belowAscent)
          }

          VerticalAlign.TextBottom -> {
            metrics.descent = parentFm.descent
            val aboveDescent = height - parentFm.descent
            metrics.ascent = parentFm.ascent.coerceAtMost(-aboveDescent)
          }

          VerticalAlign.Middle -> {
            val xHeight = (-parentFm.ascent * 0.5f).toInt()
            val halfHeight = height / 2
            metrics.ascent = -(halfHeight + xHeight / 2)
            metrics.descent = halfHeight - xHeight / 2
          }

          VerticalAlign.Top -> {
            metrics.ascent = -height
            metrics.descent = 0
          }

          VerticalAlign.Bottom -> {
            metrics.ascent = 0
            metrics.descent = height
          }

          VerticalAlign.Sub -> {
            metrics.ascent = -(height - parentFm.descent)
            metrics.descent = parentFm.descent
          }

          VerticalAlign.Super -> {
            val raiseAmount = (-parentFm.ascent * 0.5f).toInt()
            metrics.ascent = -height - raiseAmount
            metrics.descent = -raiseAmount
          }

          VerticalAlign.Length -> {
            // Raise/lower by absolute length (positive = raise, negative = lower)
            val offset = verticalAlign.value.toInt()
            metrics.ascent = -height - offset
            metrics.descent = -offset
          }

          VerticalAlign.Percent -> {
            // Percentage of line-height (positive = raise, negative = lower)
            val offset = (lineHeight * verticalAlign.value / 100f).toInt()
            metrics.ascent = -height - offset
            metrics.descent = -offset
          }
        }

        metrics.top = metrics.ascent
        metrics.bottom = metrics.descent

        // Follow web behavior: do not artificially clamp placeholder font
        // metrics here. Let the native layout compute line-box contributions
        // according to the reported ascent/descent values.
      }
      return width
    }

    override fun draw(
      canvas: Canvas,
      text: CharSequence?,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint
    ) {
      // The box is a real child view, drawn by the text view's dispatchDraw; this only
      // records where it goes.
      val (cachedWidth, cachedHeight) = lineExtents()

      // Get vertical-align from child's style
      val verticalAlign = if (childNode.style.isValueInitialized) {
        childNode.style.verticalAlign
      } else {
        VerticalAlign.Baseline
      }

      val parentFm = paint.fontMetricsInt
      val lineHeight = -parentFm.ascent + parentFm.descent

      // Calculate Y position based on vertical-align
      // The 'y' parameter is the baseline position
      val drawY = when (verticalAlign) {
        VerticalAlign.Baseline -> {
          (y - cachedHeight).toFloat()
        }

        VerticalAlign.TextTop -> {
          (y + parentFm.ascent).toFloat()
        }

        VerticalAlign.TextBottom -> {
          (y + parentFm.descent - cachedHeight).toFloat()
        }

        VerticalAlign.Middle -> {
          val xHeight = -parentFm.ascent * 0.5f
          val middleY = y - xHeight / 2f
          middleY - cachedHeight / 2f
        }

        VerticalAlign.Top -> {
          top.toFloat()
        }

        VerticalAlign.Bottom -> {
          (bottom - cachedHeight).toFloat()
        }

        VerticalAlign.Sub -> {
          (y - cachedHeight + parentFm.descent).toFloat()
        }

        VerticalAlign.Super -> {
          val raiseAmount = -parentFm.ascent * 0.5f
          (y - cachedHeight - raiseAmount)
        }

        VerticalAlign.Length -> {
          // Raise/lower by absolute length
          // Positive values raise the element (move up), negative lower (move down)
          val offset = verticalAlign.value
          (y - cachedHeight - offset)
        }

        VerticalAlign.Percent -> {
          // Percentage of line-height
          // Positive values raise, negative lower
          val offset = lineHeight * verticalAlign.value / 100f
          (y - cachedHeight - offset)
        }
      }

      drawnRect.set(x, drawY, x + cachedWidth, drawY + cachedHeight)
      drawn = true
    }
  }

  private fun createPlaceholder(child: Node): SpannableStringBuilder {
    val childView = child.view as? View ?: return SpannableStringBuilder("")

    val helper = ViewHelper(childView, child)
    val placeholder = SpannableStringBuilder(Constants.VIEW_PLACEHOLDER)

    val viewSpan = ViewSpan(child, helper)
    placeholder.setSpan(viewSpan, 0, placeholder.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)

    return placeholder
  }

  private fun createBRholder(): SpannableStringBuilder {
    val br = SpannableStringBuilder("\n")

    br.setSpan(BrSpan(), 0, br.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)

    return br
  }


  // monotonically increasing version for invalidation; cachedAttributedString is valid when
  // attributedStringVersion == segmentsInvalidateVersion
  private var attributedStringVersion: Int = 0
  private var segmentsInvalidateVersion: Int = 0

  // (version, widthKey, widthMode) per entry.
  private val measureCacheKeys = LongArray(MEASURE_CACHE_SIZE * 3)
  private val measureCacheVals = LongArray(MEASURE_CACHE_SIZE)
  private var measureCacheNext = 0

  private fun storeMeasure(version: Long, widthKey: Long, widthMode: Long, out: Long) {
    val b = measureCacheNext * 3
    measureCacheKeys[b] = version
    measureCacheKeys[b + 1] = widthKey
    measureCacheKeys[b + 2] = widthMode
    measureCacheVals[measureCacheNext] = out
    measureCacheNext = (measureCacheNext + 1) % MEASURE_CACHE_SIZE
  }

  private var maxContentVersion = -1L
  private var maxContentWidth = 0
  private var maxContentConstraint = 0
  private var maxContentOut = 0L
  private var deferredSegments: PackedSegments? = null

  private var lastDefiniteKnownWidth = 0f
  private var lastDefiniteKnownHeight = 0f
  private var lastDefiniteAvailableWidth = Float.NaN
  private var lastDefiniteAvailableHeight = 0f
  private var appliedTextVersion: Int = -1
  internal var cachedAttributedString: SpannableStringBuilder? = null
  private var cachedAttributedStringNested = false
  private var isBuilding = false

  private val segmentsCacheLayouts = arrayOfNulls<android.text.Layout>(4)
  private val segmentsCacheVersions = IntArray(4) { -1 }
  private var segmentsCacheNextIdx = 0

  private var minMeasuredTextWidth: Float = 0f
  private var minMeasuredTextHeight: Float = 0f

  private var measuredTextWidth: Float = 0f
  private var measuredTextHeight: Float = 0f

  private var maxMeasuredTextWidth: Float = 0f
  private var maxMeasuredTextHeight: Float = 0f

  private class StaticLayoutCacheEntry(
    val version: Int,
    val widthConstraint: Int,
    val spannableLength: Int,
    val alignment: android.text.Layout.Alignment,
    val includePadding: Boolean,
    val justified: Boolean,
    val heuristic: TextDirectionHeuristic,
    val layout: android.text.Layout,
    keepsTrailingSpaces: Boolean,
    advances: FloatArray?
  ) {
    val maxLineWidth: Float
    val widthIndependent: Boolean

    init {
      var max = 0f
      var left = true
      for (i in 0 until layout.lineCount) {
        val w = ceil(
          when {
            keepsTrailingSpaces -> layout.getLineWidth(i)
            advances != null -> advanceSum(advances, layout.getLineStart(i), layout.getLineVisibleEnd(i))
            else -> layout.getLineMax(i)
          }
        )
        if (w > max) max = w
        if (layout.getLineLeft(i) != 0f) left = false
      }
      val text = layout.text
      maxLineWidth = max
      widthIndependent = left && (text !is Spanned ||
        text.nextSpanTransition(0, text.length, LineBackgroundSpan::class.java) >= text.length)
    }
  }

  private fun keepsTrailingSpaces(): Boolean = node.style.isValueInitialized && when (node.style.whiteSpace) {
    Styles.WhiteSpace.Pre, Styles.WhiteSpace.BreakSpaces -> true
    else -> false
  }

  private var advancesVersion = -1
  private var advancesLength = -1
  private var cachedAdvances: FloatArray? = null
  private val advancesPaint by lazy(LazyThreadSafetyMode.NONE) { TextPaint() }

  internal var plainTextPaintOrNull: TextPaint? = null
    private set
  internal val plainTextPaint: TextPaint
    get() = plainTextPaintOrNull ?: TextPaint().also { plainTextPaintOrNull = it }
  private var plainTextRunStyle: Spans.RunStyleSpan? = null

  internal fun preparePlainTextPaint(base: TextPaint) {
    plainTextPaint.set(base)
    plainTextRunStyle?.updateDrawState(plainTextPaint)
  }

  private fun plainRunStyle(text: Spanned): Spans.RunStyleSpan? {
    var run: Spans.RunStyleSpan? = null
    for (span in text.getSpans(0, text.length, Any::class.java)) {
      when (span) {
        is AlignmentSpan -> {}
        is Spans.RunStyleSpan -> {
          if (run != null || text.getSpanStart(span) != 0 || text.getSpanEnd(span) != text.length) return null
          run = span
        }
        else -> return null
      }
    }
    return run
  }

  private val singleLineMetrics = BoringLayout.Metrics()
  private val singleLineTextMetrics = Paint.FontMetricsInt()

  private fun singleLineLayout(
    text: CharSequence,
    paint: TextPaint,
    width: Int,
    alignment: android.text.Layout.Alignment,
    justified: Boolean
  ): android.text.Layout? {
    if (justified || text !is Spanned || keepsTrailingSpaces()) return null
    val advances = advancesFor(text, paint) ?: return null
    val len = text.length
    for (span in text.getSpans(0, len, ParagraphStyle::class.java)) {
      if (span !is AlignmentSpan) return null
    }
    var visibleEnd = len
    while (visibleEnd > 0 && isLineEndSpace(text[visibleEnd - 1])) visibleEnd--
    val visibleWidth = advanceSum(advances, 0, visibleEnd)
    if (visibleWidth > width - 0.5f) return null

    val p = advancesPaint
    uniformFontMetrics()
    val primary = uniformMetricsInt
    var top = primary.top
    var ascent = primary.ascent
    var descent = primary.descent
    var bottom = primary.bottom
    val fm = singleLineTextMetrics
    fm.leading = primary.leading
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      p.getFontMetricsInt(text, 0, len, 0, len, false, fm)
      top = minOf(top, fm.top)
      ascent = minOf(ascent, fm.ascent)
      descent = maxOf(descent, fm.descent)
      bottom = maxOf(bottom, fm.bottom)
    }
    val m = singleLineMetrics
    m.top = top
    m.ascent = ascent
    m.descent = descent
    m.bottom = bottom
    m.leading = fm.leading
    m.width = ceil(visibleWidth).toInt()
    val runStyle = plainRunStyle(text)
    if (runStyle != null) {
      plainTextRunStyle = runStyle
      preparePlainTextPaint(paint)
      return BoringLayout.make(text.toString(), plainTextPaint, width, alignment, 1f, 0f, m, includePadding)
    }
    return BoringLayout.make(text, paint, width, alignment, 1f, 0f, m, includePadding)
  }

  private var uniformMetricsTypeface: Typeface? = null
  private var uniformMetricsSize = -1f
  private var uniformMetricsVariation: String? = null
  private val uniformMetrics = Paint.FontMetrics()
  private val uniformMetricsInt = Paint.FontMetricsInt()

  private fun uniformFontMetrics(): Paint.FontMetrics {
    val p = advancesPaint
    val variation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) p.fontVariationSettings else null
    if (p.typeface !== uniformMetricsTypeface || p.textSize != uniformMetricsSize ||
      variation != uniformMetricsVariation
    ) {
      p.getFontMetrics(uniformMetrics)
      p.getFontMetricsInt(uniformMetricsInt)
      uniformMetricsTypeface = p.typeface
      uniformMetricsSize = p.textSize
      uniformMetricsVariation = variation
    }
    return uniformMetrics
  }

  private fun advancesFor(text: CharSequence, paint: TextPaint): FloatArray? {
    if (advancesVersion != segmentsInvalidateVersion || advancesLength != text.length) {
      cachedAdvances = uniformAdvances(text, paint, advancesPaint)
      advancesVersion = segmentsInvalidateVersion
      advancesLength = text.length
    }
    return cachedAdvances
  }

  private val staticLayoutCache = arrayOfNulls<StaticLayoutCacheEntry>(4)
  private var staticLayoutCacheNextIdx = 0

  private var minLineHeightTypeface: Typeface? = null
  private var minLineHeightTextSize = -1f
  private var minLineHeightValue = 0f

  private fun minLineHeight(paint: TextPaint): Float {
    if (paint.typeface !== minLineHeightTypeface || paint.textSize != minLineHeightTextSize) {
      paint.getFontMetrics(scratchFontMetrics)
      val fm = scratchFontMetrics
      minLineHeightValue = -fm.ascent + fm.descent + fm.leading
      minLineHeightTypeface = paint.typeface
      minLineHeightTextSize = paint.textSize
    }
    return minLineHeightValue
  }

  // Reused across paint.getFontMetrics() call sites instead of the allocating
  // no-arg `paint.fontMetrics` property. Safe to share: every use reads the
  // fields immediately and text measurement/draw all happen on the UI thread.
  private val scratchFontMetrics = android.graphics.Paint.FontMetrics()

  // Reused per text-run in collectAndCacheSegments() instead of a fresh
  // `TextPaint(textPaint)` copy — `.set()` overwrites all fields cheaply.
  // Nothing retains this instance across runs.
  private val scratchRunPaint by lazy(LazyThreadSafetyMode.NONE) { TextPaint() }

  // same pooling as scratchRunPaint, for collectAndCacheSegments()'s copy
  private val scratchSegmentPaint by lazy(LazyThreadSafetyMode.NONE) { TextPaint() }

  internal fun shouldFlattenTextContainer(container: TextContainer): Boolean {
    if (!container.node.style.isValueInitialized) return true
    // Blockquotes: prefer flattening to render a CSS-like left bar, but only
    // when it's safe to represent as an inline decoration. If the blockquote
    // has other view-level properties (padding, background drawable, radii,
    // or borders on other sides) we should NOT flatten so the element-level
    // border/background/radius can render like the web.
    if (container is TextView && container.type == org.nativescript.mason.masonkit.enums.TextType.Blockquote) {
      val bstyle = container.style
      val hasBackgroundDrawable = (container.node.view as? View)?.background != null
      val padding = bstyle.padding
      val hasPadding =
        padding.top.value > 0f || padding.right.value > 0f || padding.bottom.value > 0f || padding.left.value > 0f
      val size = bstyle.size
      val hasExplicitSize = size.width != Dimension.Auto || size.height != Dimension.Auto
      val borderWidth = bstyle.borderWidth
      // If any border other than the left is set, don't flatten — web would render a full box
      val otherBorders =
        borderWidth.top.value > 0f || borderWidth.right.value > 0f || borderWidth.bottom.value > 0f
      // If radii present, prefer the view-level rendering so corners clip correctly
      val hasRadii = bstyle.mBorderRenderer.hasRadii()

      // If only the LEFT border is present and there is no background/padding/explicit size,
      // it's safe to flatten and draw a left-bar inline (matches web shorthand like "0 0 0 3px").
      val leftOnlyBorder = borderWidth.left.value > 0f && !otherBorders
      if (leftOnlyBorder && !(hasBackgroundDrawable || hasPadding || hasExplicitSize)) {
        return true
      }

      return !(hasBackgroundDrawable || hasPadding || hasExplicitSize || otherBorders || hasRadii)
    }
    val style = container.node.style

    // Inline-block elements should never be flattened
    if (style.display == Display.InlineBlock) {
      return false
    }

    // Treat a raw background Drawable as a true view-level background which
    // prevents flattening. A plain background color (style.backgroundColor)
    // however can be represented as a text background span when there is no
    // padding/border/explicit size — so do not let a simple color alone block
    // flattening.
    val hasBackgroundDrawable = (container.node.view as? View)?.background != null
    val hasBackgroundColor = container.node.style.backgroundColor != 0
    val borderWidth = style.borderWidth
    val hasBorder =
      borderWidth.top.value > 0f || borderWidth.right.value > 0f || borderWidth.bottom.value > 0f || borderWidth.left.value > 0f

    val padding = style.padding
    val hasPadding =
      padding.top.value > 0f || padding.right.value > 0f || padding.bottom.value > 0f || padding.left.value > 0f

    val size = style.size
    val hasExplicitSize = size.width != Dimension.Auto || size.height != Dimension.Auto

    // If it has any view properties (drawable background, border, padding,
    // explicit size), treat as inline-block and do NOT flatten. A plain
    // background color will not prevent flattening — it will be applied as a
    // `BackgroundColorSpan` when flattened.
    return !(hasBackgroundDrawable || hasBorder || hasPadding || hasExplicitSize)
  }

  private fun applyTextViewStylesToSpan(
    spannable: SpannableStringBuilder, start: Int, end: Int, container: TextContainer
  ) {
    if (start >= end) return

    val flags = Spannable.SPAN_EXCLUSIVE_EXCLUSIVE

    val colorBase = container.style.resolvedColor
    // Prefer pseudo-set color values (e.g. :pressed) when present
    val color = resolvePseudoInt(StyleKeys.FONT_COLOR, StateKeys.FONT_COLOR, colorBase)
    if (color != 0) {
      spannable.setSpan(
        ForegroundColorSpan(color), start, end, flags
      )
    }

    // A flattened inline container's view doesn't paint, so its background is a
    // text span. A Button paints its own.
    if (container !is Button) {
      val bgBase = container.style.resolvedBackgroundColor
      val bgColor = resolvePseudoInt(StyleKeys.BACKGROUND_COLOR, StateKeys.BACKGROUND_COLOR, bgBase)
      if (bgColor != 0 && ((bgColor shr 24) and 0xFF) != 0) {
        spannable.setSpan(android.text.style.BackgroundColorSpan(bgColor), start, end, flags)
      }
    }

    val fontSizeBase = container.style.resolvedFontSize
    val fontSize = resolvePseudoInt(StyleKeys.FONT_SIZE, StateKeys.FONT_SIZE, fontSizeBase)

    // Apply font size (convert SP -> px and apply as absolute px to respect
    // system font scaling). Use dip=false because we're passing px.
    if (fontSize > 0) {
      try {
        val dm = (container.node.view as? View)?.resources?.displayMetrics
          ?: android.content.res.Resources.getSystem().displayMetrics
        val px = android.util.TypedValue.applyDimension(
          android.util.TypedValue.COMPLEX_UNIT_SP,
          fontSize.toFloat(),
          dm
        ).toInt()
        spannable.setSpan(AbsoluteSizeSpan(px, false), start, end, flags)
      } catch (_: Throwable) {
        spannable.setSpan(AbsoluteSizeSpan(fontSize, true), start, end, flags)
      }
    }

    val fontFace = container.style.resolvedFontFace
    // Apply typeface with bold/italic hints so we can synthesize when needed
    fontFace.resolvedTypeface?.let { typeface ->
      val isBold = fontFace.weight.weight >= 600
      val isItalic = fontFace.style != org.nativescript.fontmanager.FontStyle.Normal
      spannable.setSpan(
        Spans.TypefaceSpan(typeface, isBold, isItalic), start, end, flags
      )
    }

    val decorationLine = container.style.resolvedDecorationLine

    // Special handling for blockquotes: draw a left bar and add leading margin
    if (container is TextView && container.type == org.nativescript.mason.masonkit.enums.TextType.Blockquote) {
      val scale = container.node.mason.scale
      // Default visual values
      var barWidth = (6f * scale)
      val gap = (10f * scale)
      var barColor = 0xFF666666.toInt()

      // If the style specifies a left border width, use it (points)
      when (val leftWidth = container.style.borderLeftWidth) {
        is org.nativescript.mason.masonkit.LengthPercentage.Points -> {
          barWidth = leftWidth.points
        }

        is org.nativescript.mason.masonkit.LengthPercentage.Zero -> {
          // leave default
        }

        is org.nativescript.mason.masonkit.LengthPercentage.Percent -> {
          // Percent width isn't meaningful for a hairline; ignore
        }
      }

      val leftColor = container.style.borderColor.left
      if (leftColor != 0) {
        barColor = leftColor
      }

      // Leading margin to offset the bar + gap
      val leading = (barWidth + gap).toInt()
      spannable.setSpan(
        android.text.style.LeadingMarginSpan.Standard(leading),
        start,
        end,
        flags
      )
      // Draw the bar using a LineBackgroundSpan
      spannable.setSpan(Spans.BlockQuoteBackgroundSpan(barColor, barWidth), start, end, flags)
    }

    // Apply text decoration
    if (decorationLine != Styles.DecorationLine.None) {
      spannable.setSpan(
        Spans.DecorationSpan(
          decorationLine,
          container.style.resolvedDecorationColor,
          container.style.resolvedDecorationStyle,
          container.style.resolvedDecorationThickness
        ), start, end, flags
      )
    }

    val letterSpacingValue = container.style.resolvedLetterSpacing
    // Apply letter spacing. Use LetterSpacingSpan (paint.letterSpacing, EM units)
    // which adds tracking between glyphs; ScaleXSpan was wrong — it scales each
    // glyph's width and visibly distorts the text.
    if (letterSpacingValue != 0f) {
      spannable.setSpan(
        Spans.LetterSpacingSpan(letterSpacingValue), start, end, flags
      )
    }

    val lineHeight = container.style.resolvedLineHeight
    val lineType = container.style.resolvedLineHeightType

    // Resolve line-height to an absolute dip value (multiplier * font-size) and use
    // the idempotent FixedLineHeightSpan. RelativeLineHeightSpan multiplies the
    // already-modified metrics on each repeated chooseHeight() call -> exponential blowup.
    lineHeight.takeIf { it > 0 }?.let {
      if (lineType == StyleState.SET) {
        spannable.setSpan(FixedLineHeightSpan(it.toInt()), start, end, flags)
      } else {
        val fontSizeDip = container.style.resolvedFontSize.takeIf { fs -> fs > 0 }
          ?: Constants.DEFAULT_FONT_SIZE
        val absolute = (it * fontSizeDip).toInt()
        if (absolute > 0) {
          spannable.setSpan(FixedLineHeightSpan(absolute), start, end, flags)
        }
      }
    }

    val align = when (style.resolvedTextAlign) {
      TextAlign.Left, TextAlign.Start -> android.text.Layout.Alignment.ALIGN_NORMAL
      TextAlign.Right, TextAlign.End -> android.text.Layout.Alignment.ALIGN_OPPOSITE
      TextAlign.Center -> android.text.Layout.Alignment.ALIGN_CENTER
      TextAlign.Justify -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          android.text.Layout.Alignment.ALIGN_NORMAL // Justify handled by justificationMode
        } else {
          android.text.Layout.Alignment.ALIGN_NORMAL
        }
      }

      else -> android.text.Layout.Alignment.ALIGN_NORMAL
    }

    spannable.setSpan(AlignmentSpan.Standard(align), start, end, flags)

    val shadows = style.resolvedTextShadow
    if (shadows.isNotEmpty()) {
      for (shadow in shadows) {
        if (shadow.blurRadius > 0) {
          spannable.setSpan(
            Spans.BlurredTextShadowSpan(
              shadow.offsetX,
              shadow.offsetY,
              shadow.blurRadius,
              shadow.color
            ), start, end, flags
          )
        } else {
          spannable.setSpan(
            Spans.TextShadowSpan(
              shadow.offsetX,
              shadow.offsetY,
              shadow.color
            ), start, end, flags
          )
        }
      }
    }
  }

  // When building attributed string, walk tree and apply current styles
  // [nested] builds a flattened child's piece, which the outer flow collapses as a whole.
  private fun buildAttributedString(nested: Boolean = false): SpannableStringBuilder {

    // Return cached version if valid
    if (cachedAttributedString != null && attributedStringVersion == segmentsInvalidateVersion &&
      cachedAttributedStringNested == nested
    ) {
      return cachedAttributedString!!
    }

    if (isBuilding) {
      return SpannableStringBuilder()
    }

    isBuilding = true

    val composed = SpannableStringBuilder()

    // Use try/finally so isBuilding is always cleared even when a child
    // span operation throws (e.g. a bad ViewSpan measurement).  Without
    // this guard the engine permanently returns empty strings after the
    // first exception, breaking all subsequent renders.
    try {
      for (child in node.children) {
        when {
          child.view is Br.FakeView -> {
            composed.append(createBRholder())
          }

          child is TextNode -> {
            child.appendAttributedTo(composed)
          }

          child.style.isValueInitialized && child.style.display == Display.None -> {}

          child.view is TextContainer -> {
            val childTextContainer = child.view as TextContainer
            if (shouldFlattenTextContainer(childTextContainer)) {
              val nested = childTextContainer.engine.buildAttributedString(nested = true)
              val start = composed.length
              composed.append(nested)
              val end = composed.length
              applyTextViewStylesToSpan(composed, start, end, childTextContainer)
              if (end > start) {
                composed.setSpan(NodeSpan(child), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
              }
            } else {
              val placeholder = createPlaceholder(child)
              // If the child is a block-level element, ensure it sits on its
              // own line by surrounding the placeholder with newlines. This
              // ensures StaticLayout places the block vertically as a separate
              // block instead of inline with surrounding text.
              val isBlock = child.style.display == Display.Block
              if (isBlock) {
                if (composed.isNotEmpty() && composed.last() != '\n') {
                  composed.append('\n')
                }
                composed.append(placeholder)
                if (composed.isEmpty() || composed.last() != '\n') {
                  composed.append('\n')
                }
              } else {
                composed.append(placeholder)
              }
            }
          }

          child.nativePtr != 0L && child.style.display != Display.None -> {
            val placeholder = createPlaceholder(child)
            val isBlock = child.style.display == Display.Block
            if (isBlock) {
              if (composed.isNotEmpty() && composed.last() != '\n') composed.append('\n')
              composed.append(placeholder)
              if (composed.isEmpty() || composed.last() != '\n') composed.append('\n')
            } else {
              composed.append(placeholder)
            }
          }
        }
      }
    } finally {
      isBuilding = false
    }

    // Text set as given (TextView.text) keeps its spaces.
    if (!nested && node.children.none { it is TextNode && it.verbatim != null }) collapseFlowSpaces(composed)

    // Wrap with Unicode bidi control characters when unicode-bidi requires
    // character-level overrides beyond what StaticLayout's text direction
    // heuristic provides.
    val bidi = style.resolvedUnicodeBidi.toInt()
    val isRTL = style.direction == Direction.RTL

    val wrapped = when (bidi) {
      1 -> {
        // embed: LRE (U+202A) or RLE (U+202B) + PDF (U+202C)
        val result = SpannableStringBuilder()
        result.append(if (isRTL) "\u202B" else "\u202A")
        result.append(composed)
        result.append("\u202C")
        result
      }

      2 -> {
        // bidi-override: LRO (U+202D) or RLO (U+202E) + PDF (U+202C)
        val result = SpannableStringBuilder()
        result.append(if (isRTL) "\u202E" else "\u202D")
        result.append(composed)
        result.append("\u202C")
        result
      }

      3 -> {
        // isolate: LRI (U+2066) or RLI (U+2067) + PDI (U+2069)
        val result = SpannableStringBuilder()
        result.append(if (isRTL) "\u2067" else "\u2066")
        result.append(composed)
        result.append("\u2069")
        result
      }

      4 -> {
        // isolate-override: LRI/RLI + LRO/RLO + content + PDF + PDI
        val result = SpannableStringBuilder()
        result.append(if (isRTL) "\u2067" else "\u2066")
        result.append(if (isRTL) "\u202E" else "\u202D")
        result.append(composed)
        result.append("\u202C")
        result.append("\u2069")
        result
      }

      5 -> {
        // plaintext: FSI (U+2068) + PDI (U+2069)
        val result = SpannableStringBuilder()
        result.append("\u2068")
        result.append(composed)
        result.append("\u2069")
        result
      }

      else -> composed // 0 = normal, no wrapping needed
    }

    // Cache the result
    cachedAttributedString = wrapped
    cachedAttributedStringNested = nested
    // mark cached string as up-to-date with the current invalidate version
    attributedStringVersion = segmentsInvalidateVersion

    return wrapped
  }

  /**
   * Collapses spaces across the pieces of one inline flow, as each text node only collapses its
   * own: a space after another space, or at the start of a line, is dropped.
   */
  private fun collapseFlowSpaces(text: SpannableStringBuilder) {
    if (style.isValueInitialized) {
      when (style.whiteSpace) {
        Styles.WhiteSpace.Normal, Styles.WhiteSpace.NoWrap, Styles.WhiteSpace.PreLine -> {}
        else -> return
      }
    }
    var i = 0
    while (i < text.length) {
      if (text[i] == ' ' && (i == 0 || text[i - 1] == ' ' || text[i - 1] == '\n')) {
        text.delete(i, i + 1)
      } else {
        i++
      }
    }
  }

  /** The inline boxes in [text], each with where it was last drawn in layout coordinates. */
  internal fun forEachInlineBox(text: CharSequence, block: (Node, RectF?) -> Unit) {
    val spanned = text as? Spanned ?: return
    for (span in spanned.getSpans(0, spanned.length, ViewSpan::class.java)) {
      block(span.childNode, if (span.drawn) span.drawnRect else null)
    }
  }

  /** Marks the range a flattened element produced, so a tap on it can find it. */
  internal class NodeSpan(val node: Node)

  /**
   * The inline element under a point in [layout]'s coordinates: an inline box, else the innermost
   * flattened element whose text is under the point. Null over plain text or empty space.
   */
  internal fun inlineNodeAt(layout: Layout, x: Float, y: Float): Node? {
    val text = layout.text as? Spanned ?: return null
    for (span in text.getSpans(0, text.length, ViewSpan::class.java)) {
      if (span.drawn && span.drawnRect.contains(x, y)) return span.childNode
    }
    if (y < 0f || y >= layout.height) return null
    val line = layout.getLineForVertical(y.toInt())
    if (x < layout.getLineLeft(line) || x >= layout.getLineRight(line)) return null
    val lineStart = layout.getLineStart(line)
    var offset = layout.getOffsetForHorizontal(line, x)
    // The nearest boundary can sit after the character under the point.
    val h = layout.getPrimaryHorizontal(offset)
    val rtl = layout.getParagraphDirection(line) == Layout.DIR_RIGHT_TO_LEFT
    if (offset > lineStart && (if (rtl) x > h else x < h)) offset--
    if (offset >= layout.getLineEnd(line)) offset = layout.getLineEnd(line) - 1
    if (offset < lineStart) return null
    var best: NodeSpan? = null
    var bestLength = Int.MAX_VALUE
    for (span in text.getSpans(offset, offset + 1, NodeSpan::class.java)) {
      val start = text.getSpanStart(span)
      val end = text.getSpanEnd(span)
      if (offset < start || offset >= end) continue
      if (end - start < bestLength) {
        best = span
        bestLength = end - start
      }
    }
    return best?.node
  }

  /** An inline element exposed to accessibility, with its bounds in layout coordinates. */
  internal class InlineItem(val node: Node, val bounds: RectF, val label: CharSequence, val isButton: Boolean, val start: Int)

  internal fun hasInlineItems(layout: Layout): Boolean {
    val text = layout.text as? Spanned ?: return false
    return text.getSpans(0, text.length, NodeSpan::class.java).isNotEmpty()
  }

  /**
   * The clickable flattened elements (links, elements with click listeners) in [layout], in
   * reading order. A piece that wraps reports its first line's bounds. Inline boxes are real
   * child views and reach accessibility on their own.
   */
  internal fun inlineAccessibilityItems(layout: Layout): List<InlineItem> {
    val text = layout.text as? Spanned ?: return emptyList()
    val items = ArrayList<InlineItem>()
    for (span in text.getSpans(0, text.length, NodeSpan::class.java)) {
      val child = span.node
      val isLink = (child.view as? TextView)?.type == org.nativescript.mason.masonkit.enums.TextType.A
      if (!isLink && !child.mason.hasListener(child, "click")) continue
      val start = text.getSpanStart(span)
      val end = text.getSpanEnd(span)
      if (end <= start) continue
      val line = layout.getLineForOffset(start)
      val lineEnd = minOf(end, layout.getLineEnd(line))
      val x0 = layout.getPrimaryHorizontal(start)
      val x1 = if (lineEnd < end || lineEnd == layout.getLineEnd(line)) layout.getLineRight(line) else layout.getPrimaryHorizontal(lineEnd)
      val bounds = RectF(minOf(x0, x1), layout.getLineTop(line).toFloat(), maxOf(x0, x1), layout.getLineBottom(line).toFloat())
      items.add(InlineItem(child, bounds, text.subSequence(start, end).toString(), false, start))
    }
    items.sortBy { it.start }
    return items
  }

  internal fun invalidateInlineSegments(markDirty: Boolean = true, quiet: Boolean = false) {
    Node.bumpTextInvalidationEpoch()
    segmentsInvalidateVersion += 1
    staleMeasures[this] = true
    cachedAttributedString = null
    minMeasuredTextWidth = 0f
    minMeasuredTextHeight = 0f
    measuredTextWidth = 0f
    measuredTextHeight = 0f
    maxMeasuredTextWidth = 0f
    maxMeasuredTextHeight = 0f
    node.cachedWidth = 0f
    node.cachedHeight = 0f
    if (markDirty) {
      node.dirty()
    }
    // A flattened child's changes must rebuild its container. Use the layout
    // parent, since an inline run's anonymous container holds its elements.
    val parent = node.layoutParent

    if (parent?.view is TextContainer) {
      (parent.view as TextContainer).engine.invalidateInlineSegments(quiet = quiet)
    } else {
      parent?.dirty()
      parent?.computeCacheDirty = true
      if (!quiet) {
        (parent?.view as? View)?.invalidate()
      }
    }

    when (node.view) {
      is Element -> {
        (node.view as Element).apply {
          val root = node.getRootNode() ?: this.node
          root.computeCacheDirty = true
          if (!quiet) {
            view.invalidate()
            invalidateLayout()
          }
        }
      }

      is View -> {
        findAncestorElement(node)?.let { element ->
          val root = element.node.getRootNode() ?: element.node
          root.computeCacheDirty = true
          root.dirty()
        }
        if (!quiet) {
          (node.view as View).apply {
            invalidate()
            requestLayout()
          }
        }
      }

      else -> {}
    }
  }

  /**
   * Find the nearest ancestor Element in the node tree.
   * This is needed to trigger native layout recomputation when text changes
   * in a View that is not itself an Element.
   */
  internal fun findAncestorElement(node: Node): Element? {
    var current = node.parent
    while (current != null) {
      if (current.view is Element) {
        return current.view as Element
      }
      current = current.parent
    }
    return null
  }

  private fun warmable(): Boolean {
    if (textStyleFlushPending || style.fontDirty) return false
    for (child in node.children) if (child !is TextNode) return false
    val parentFloat = try {
      node.parent?.style?.float
    } catch (_: Throwable) {
      null
    }
    return parentFloat == null || parentFloat == org.nativescript.mason.masonkit.enums.Float.None
  }

  companion object {
    // Every entry is keyed by text version, so a text view only ever needs a few live constraints.
    private const val MEASURE_CACHE_SIZE = 8

    private val staleMeasures = java.util.WeakHashMap<TextEngine, Boolean>()

    private var warming = false

    private const val KNOWN_NONE = -3f

    @JvmStatic
    internal fun warmMeasures(forRoot: Node) {
      flushPendingTextStyles(forRoot)
      Style.flushPendingMetrics(forRoot)
      if (staleMeasures.isEmpty()) return
      val batch = ArrayList<TextEngine>()
      val it = staleMeasures.entries.iterator()
      while (it.hasNext()) {
        val engine = it.next().key ?: continue
        if ((engine.node.getRootNode() ?: engine.node) !== forRoot) continue
        it.remove()
        if (engine.container !is TextView || !engine.warmable()) continue
        batch.add(engine)
      }
      if (batch.isEmpty()) return
      warming = true
      try {
        for (engine in batch) {
          val paint = (engine.container as TextView).paint
          engine.measure(paint, KNOWN_NONE, KNOWN_NONE, -1f, -2f)
          engine.measure(paint, KNOWN_NONE, KNOWN_NONE, -2f, -2f)
          if (!engine.lastDefiniteAvailableWidth.isNaN()) {
            engine.measure(
              paint, engine.lastDefiniteKnownWidth, engine.lastDefiniteKnownHeight,
              engine.lastDefiniteAvailableWidth, engine.lastDefiniteAvailableHeight
            )
          }
        }
      } finally {
        warming = false
      }
    }

    // Flags that affect text measurement/layout (require full inline-segment recompute).
    @JvmStatic
    internal fun hasTextLayoutFlags(low: Long, high: Long): Boolean {
      return (
        StateKeys.hasFlag(low, high, StateKeys.FONT_SIZE) ||
          StateKeys.hasFlag(low, high, StateKeys.FONT_WEIGHT) ||
          StateKeys.hasFlag(low, high, StateKeys.FONT_STYLE) ||
          StateKeys.hasFlag(low, high, StateKeys.FONT_FAMILY) ||
          StateKeys.hasFlag(low, high, StateKeys.FONT_VARIANT_NUMERIC) ||
          StateKeys.hasFlag(low, high, StateKeys.TEXT_WRAP) ||
          StateKeys.hasFlag(low, high, StateKeys.WHITE_SPACE) ||
          StateKeys.hasFlag(low, high, StateKeys.TEXT_TRANSFORM) ||
          StateKeys.hasFlag(low, high, StateKeys.LETTER_SPACING) ||
          StateKeys.hasFlag(low, high, StateKeys.TEXT_JUSTIFY) ||
          StateKeys.hasFlag(low, high, StateKeys.LINE_HEIGHT) ||
          StateKeys.hasFlag(low, high, StateKeys.TEXT_ALIGN) ||
          StateKeys.hasFlag(low, high, StateKeys.TEXT_OVERFLOW) ||
          StateKeys.hasFlag(low, high, StateKeys.WORD_SPACING) ||
          StateKeys.hasFlag(low, high, StateKeys.WRITING_MODE) ||
          StateKeys.hasFlag(low, high, StateKeys.UNICODE_BIDI) ||
          StateKeys.hasFlag(low, high, StateKeys.HYPHENS) ||
          StateKeys.hasFlag(low, high, StateKeys.FONT_STRETCH)
        )
    }

    // Flags that only affect visual appearance (color, decoration, shadow).
    // These require span rebuilds but NOT a layout recompute.
    @JvmStatic
    internal fun hasTextVisualFlags(low: Long, high: Long): Boolean {
      return (
        StateKeys.hasFlag(low, high, StateKeys.FONT_COLOR) ||
          StateKeys.hasFlag(low, high, StateKeys.DECORATION_LINE) ||
          StateKeys.hasFlag(low, high, StateKeys.DECORATION_COLOR) ||
          StateKeys.hasFlag(low, high, StateKeys.DECORATION_STYLE) ||
          StateKeys.hasFlag(low, high, StateKeys.DECORATION_THICKNESS) ||
          StateKeys.hasFlag(low, high, StateKeys.BACKGROUND_COLOR) ||
          StateKeys.hasFlag(low, high, StateKeys.TEXT_SHADOWS)
        )
    }

    @JvmStatic
    internal fun hasAnyTextFlags(low: Long, high: Long): Boolean {
      return hasTextLayoutFlags(low, high) || hasTextVisualFlags(low, high)
    }

    private val pendingTextStyleFlush = HashSet<TextEngine>()
    private var textStyleFlushPosted = false

    internal fun registerPendingTextStyle(engine: TextEngine) {
      // The batch is flushed on the main thread. Text built on another thread is flushed
      // when it is measured or drawn instead, so the batch is never shared across threads.
      if (android.os.Looper.myLooper() !== android.os.Looper.getMainLooper()) return
      pendingTextStyleFlush.add(engine)
      if (!textStyleFlushPosted) {
        textStyleFlushPosted = true
        android.os.Handler(android.os.Looper.getMainLooper()).post {
          textStyleFlushPosted = false
          flushPendingTextStyles()
        }
      }
    }

    @JvmStatic
    @JvmOverloads
    internal fun flushPendingTextStyles(forRoot: Node? = null) {
      if (pendingTextStyleFlush.isEmpty()) return
      val pending = pendingTextStyleFlush.toTypedArray()
      pendingTextStyleFlush.clear()
      for (engine in pending) {
        val quiet = forRoot != null && (engine.node.getRootNode() ?: engine.node) === forRoot
        engine.flushTextStyleIfNeeded(quiet = quiet)
      }
    }
  }
}

/** Describes a floated sibling element's position and side for float-aware text wrapping. */
private class PackedSegments(val floats: FloatArray, val longs: LongArray, val kinds: IntArray)

internal data class FloatExclusion(
  val left: Int,
  val top: Int,
  val right: Int,
  val bottom: Int,
  val side: org.nativescript.mason.masonkit.enums.Float
)

/** Resolve a margin value to pixels. Only Points are resolved; Auto/Percent return 0. */
internal fun resolveMarginValue(value: LengthPercentageAuto?): Float = when (value) {
  is LengthPercentageAuto.Points -> value.points
  else -> 0f
}
