package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.os.Build
import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.StaticLayout
import android.text.TextDirectionHeuristic
import android.text.TextDirectionHeuristics
import android.text.TextPaint
import android.text.style.AbsoluteSizeSpan
import android.text.style.AlignmentSpan
import android.text.style.CharacterStyle
import android.text.style.ForegroundColorSpan
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
import androidx.core.graphics.withTranslation
import org.nativescript.mason.masonkit.Styles.TextWrap
import org.nativescript.mason.masonkit.TextNode.FixedLineHeightSpan
import org.nativescript.mason.masonkit.TextNode.RelativeLineHeightSpan
import org.nativescript.mason.masonkit.enums.Direction
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FontVariantNumeric
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.VerticalAlign
import kotlin.math.ceil

/**
 * Compute the widest word in [text] without allocating a split array.
 * When [useLayout] is true, uses [Layout.getDesiredWidth] for rich text;
 * otherwise uses [Paint.measureText] for plain text.
 */
private fun maxWordWidth(text: CharSequence, paint: TextPaint, useLayout: Boolean): Float {
  var maxW = 0f
  val len = text.length
  var start = 0
  var i = 0
  while (i <= len) {
    val isWs = i < len && text[i].isWhitespace()
    if (i == len || isWs) {
      if (i > start) {
        val sub = text.subSequence(start, i)
        val w = if (useLayout) Layout.getDesiredWidth(sub, paint) else paint.measureText(
          sub,
          0,
          sub.length
        )
        if (w > maxW) maxW = w
      }
      start = i + 1
    }
    i++
  }
  return maxW
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
      var result = ""
      for (child in node.children) {
        if (child is TextNode) {
          result += child.data
        }
      }
      return result
    }
    set(value) {
      // Remove all existing children
      node.children.clear()

      // Create a single text node with the new text
      val textNode = TextNode(node.mason, value)
      textNode.container = container

      // Add to children
      node.children.add(textNode)
      textNode.parent = node

      // Clear layout tree (text nodes don't have nativePtr)
      if (node.nativePtr != 0L) {
        NativeHelpers.nativeNodeRemoveChildren(node.mason.nativePtr, node.nativePtr)
      }

      invalidateInlineSegments()
      node.dirty()
      (node.view as? View)?.let {
        it.invalidate()
        it.requestLayout()
      }
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
      style.resolvedFontFace.font?.let {
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
        updateStyleOnTextNodes()
        invalidateInlineSegments()
      } else if (textVisualChanged) {
        // Visual-only change (color, decoration, shadow): rebuild spans and redraw,
        // but do NOT call invalidateInlineSegments which would set root.computeCacheDirty
        // and trigger a spurious full layout recompute that shifts sibling views.
        updateStyleOnTextNodes()
        (node.view as? View)?.invalidate()
      }
      if (layout) {
        if (node.isAnonymous) {
          node.layoutParent?.dirty()
        }
        (node.view as? Element)?.invalidateLayout()
      }
    }
  }

  // Flags that affect text measurement/layout (require full inline-segment recompute).
  private fun hasTextLayoutFlags(low: Long, high: Long): Boolean {
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
  private fun hasTextVisualFlags(low: Long, high: Long): Boolean {
    return (
      StateKeys.hasFlag(low, high, StateKeys.FONT_COLOR) ||
        StateKeys.hasFlag(low, high, StateKeys.DECORATION_LINE) ||
        StateKeys.hasFlag(low, high, StateKeys.DECORATION_COLOR) ||
        StateKeys.hasFlag(low, high, StateKeys.DECORATION_STYLE) ||
        StateKeys.hasFlag(low, high, StateKeys.BACKGROUND_COLOR) ||
        StateKeys.hasFlag(low, high, StateKeys.TEXT_SHADOWS)
      )
  }

  // Builds (or reuses a cached) StaticLayout for the given shape. This is the
  // actual expensive step in measureLayout() (text shaping + line breaking) -
  // everything else in that function (width-constraint resolution, measured-
  // width derivation, segment collection) still runs every call regardless of
  // whether this hits the cache, so their side effects are unaffected.
  private fun buildStaticLayoutCached(
    spannable: CharSequence,
    paint: TextPaint,
    widthConstraint: Int,
    availableWidth: Float,
    alignment: android.text.Layout.Alignment,
    heuristic: TextDirectionHeuristic
  ): StaticLayout {
    val justified = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      style.resolvedTextAlign == TextAlign.Justify

    for (entry in staticLayoutCache) {
      if (entry != null &&
        entry.version == segmentsInvalidateVersion &&
        entry.widthConstraint == widthConstraint &&
        entry.availableWidth == availableWidth &&
        entry.spannableLength == spannable.length &&
        entry.alignment == alignment &&
        entry.includePadding == includePadding &&
        entry.justified == justified &&
        entry.heuristic == heuristic
      ) {
        return entry.layout
      }
    }

    val built = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      var builder = StaticLayout.Builder.obtain(
        spannable, 0, spannable.length, paint, widthConstraint
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
        spannable, paint, widthConstraint, alignment, 1f, // lineSpacingMultiplier
        0f, // lineSpacingExtra
        includePadding // includePad
      )
    }

    staticLayoutCache[staticLayoutCacheNextIdx] = StaticLayoutCacheEntry(
      version = segmentsInvalidateVersion,
      widthConstraint = widthConstraint,
      availableWidth = availableWidth,
      spannableLength = spannable.length,
      alignment = alignment,
      includePadding = includePadding,
      justified = justified,
      heuristic = heuristic,
      layout = built
    )
    staticLayoutCacheNextIdx = (staticLayoutCacheNextIdx + 1) % staticLayoutCache.size

    return built
  }

  private fun measureLayout(
    paint: TextPaint,
    knownWidth: Float,
    knownHeight: Float,
    availableWidth: Float,
    availableHeight: Float
  ): Layout? {
    val spannable = try {
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
    (container.node.view as? View)?.let {
      if (it.layoutParams == null) {
        it.layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
        )
      }
    }
    // skip setText to avoid wiping externally-set text.
    if (node.children.isNotEmpty()) {
      try {
        container.setText(spannable, BufferType.SPANNABLE)
      } catch (_: Exception) {
        // As a last resort, set plain text to avoid leaving the view blank
        container.setText(spannable.toString(), BufferType.NORMAL)
      }
    }

    if (spannable.isEmpty() && node.children.isEmpty()) {
      return null
    }

    // Determine the width constraint for StaticLayout
    // For inline elements, we want to measure to content, not fill available width
    val isInline = NodeUtils.isInlineLike(node)

    var widthConstraint = Int.MAX_VALUE
    var heightConstraint = Int.MAX_VALUE

    if (knownWidth > 0 && knownHeight != Float.MIN_VALUE) {
      widthConstraint = knownWidth.toInt()
    }

    if (knownHeight > 0 && knownHeight != Float.MIN_VALUE) {
      heightConstraint = knownHeight.toInt()
    }

    if (isInline) {
      widthConstraint = Int.MAX_VALUE
    }

    // The available space from the layout engine (Taffy's compute_leaf_layout)
    // is already content-box (padding+border subtracted). Do NOT subtract
    // padding again here — that would double-count it.
    if (widthConstraint == Int.MAX_VALUE && availableWidth.isFinite() && availableWidth > 0f) {
      widthConstraint = availableWidth.toInt()
    }

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

    if (allowWrap && availableWidth > 0 && availableWidth != Float.MIN_VALUE) {
      widthConstraint = availableWidth.toInt()
    }

    // Respect style `max-width` when present (Points only). Clamp the
    // width constraint so StaticLayout won't measure wider than the author
    // intended. Percent/Auto cases require context-dependent resolution
    // and are not handled here.
    //
    // Skip this during the min-content pass (availableWidth == -1): min-content
    // is the widest unbreakable word and is NOT reduced by `max-width`. Clamping
    // here forces widthConstraint to the max-width, so the min-content branch
    // below returns the wrapped line width (~max-width) instead of the widest
    // word. A grid item then reports a min-content as large as its max-width,
    // which becomes an `auto` track's base size — the track can no longer shrink
    // to its container and overflows (e.g. a heading with `max-w-*` never wraps).
    if (availableWidth != -1f) when (val msw = style.maxSize.width) {
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

    val p = node.parent
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

    val alignment = getLayoutAlignment()  // Use the alignment from textAlign property
    val textDirectionHeuristic = getTextDirectionHeuristic()

    var layout = buildStaticLayoutCached(
      spannable, paint, widthConstraint, availableWidth, alignment, textDirectionHeuristic
    )

    // Get the ACTUAL measured width from the layout, not the constraint
    var measuredWidth = 0f

    if (isInline) {
      for (i in 0 until layout.lineCount) {
        val lineWidth = ceil(layout.getLineWidth(i))
        if (lineWidth > measuredWidth) {
          measuredWidth = lineWidth
        }
      }

      if (widthConstraint == Int.MAX_VALUE) {
        if (availableWidth == -1f) {
          // Min-content: widest word. Single-pass avoids split() allocation.
          measuredWidth = maxWordWidth(spannable, paint, useLayout = true)
        }

        if (availableWidth == -2f) {
          val desiredWidth = android.text.Layout.getDesiredWidth(spannable, paint)
          measuredWidth = maxOf(measuredWidth, desiredWidth)
        }
      }
    } else {
      measuredWidth = if (widthConstraint == Int.MAX_VALUE) {
        when (availableWidth) {
          -1f -> {
            // Min-content: widest word. Single-pass avoids split() allocation.
            maxWordWidth(spannable, paint, useLayout = false)
          }

          -2f -> {
            val desiredWidth = Layout.getDesiredWidth(spannable, paint)
            maxOf(measuredWidth, desiredWidth)
          }

          else -> {
            0f
          }
        }
      } else {
        // Use actual text width (max line width), NOT the constraint.
        // StaticLayout.getWidth() returns the constraint passed to the
        // constructor which would cancel out padding growth — Taffy adds
        // padding back on top of what we return here, so returning the
        // constraint keeps the total size unchanged as padding increases.
        var maxLineWidth = 0f
        for (i in 0 until layout.lineCount) {
          val lineWidth = ceil(layout.getLineWidth(i))
          if (lineWidth > maxLineWidth) {
            maxLineWidth = lineWidth
          }
        }
        maxLineWidth
      }
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

    if (widthConstraint == Int.MAX_VALUE) {
      // rebuild static layout with the measuredWidth
      layout = buildStaticLayoutCached(
        spannable, paint, measuredWidth.toInt(), availableWidth, alignment, textDirectionHeuristic
      )
    }

    if (container is TextView) {
      container.cachedStaticLayout = layout
      container.cachedStaticLayoutWidth = widthConstraint
    }

    // CRITICAL: Collect and send segments to Rust
    collectAndCacheSegments(layout, spannable, paint)

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
    val pendingInvalidate = style.fontDirty
    try {
      val layout = measureLayout(
        paint,
        knownWidth,
        knownHeight,
        availableWidth,
        availableHeight
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

      paint.getFontMetrics(scratchFontMetrics)
      val fontMetrics = scratchFontMetrics

      val minLineHeight = -fontMetrics.ascent + fontMetrics.descent + fontMetrics.leading

      val measuredHeight = layout?.height?.toFloat()

      val finalHeight = measuredHeight?.coerceAtLeast(minLineHeight) ?: height

      return MeasureOutput.make(width, finalHeight)
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
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return null

    val parentNode = node.parent ?: return null
    val view = container.node.view as? View ?: return null

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

    if (exclusions.isEmpty()) return null

    // Get text from the container (already set during measure)
    val text = (container as? android.widget.TextView)?.text as? Spannable ?: return null
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
  internal fun rebuildCachedStaticLayout(paint: TextPaint, contentWidth: Int): StaticLayout? {
    if (contentWidth <= 0) return null
    val text = (container as? android.widget.TextView)?.text as? Spannable ?: return null
    if (text.isEmpty()) return null

    val alignment = getLayoutAlignment()
    val layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val heuristic = getTextDirectionHeuristic()
      var builder = StaticLayout.Builder.obtain(text, 0, text.length, paint, contentWidth)
        .setAlignment(alignment)
        .setLineSpacing(0f, 1f)
        .setIncludePad(includePadding)
        .setTextDirection(heuristic as android.text.TextDirectionHeuristic)
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
      builder.build()
    } else {
      StaticLayout(text, paint, contentWidth, alignment, 1f, 0f, includePadding)
    }

    if (container is TextView) {
      container.cachedStaticLayout = layout
      container.cachedStaticLayoutWidth = contentWidth
    }
    return layout
  }

  private fun collectAndCacheSegments(
    layout: android.text.Layout,
    attributed: SpannableStringBuilder,
    paint: TextPaint
  ) {
    // Nothing relevant changed since the segments already sent for this
    // exact layout — skip the full spannable walk + JNI push.
    if (lastSegmentsLayout === layout && lastSegmentsVersion == segmentsInvalidateVersion) {
      return
    }

    val segments = mutableListOf<InlineSegment>()

    // Use a TextPaint matching the current TextView properties for consistent measurement
    val textPaint = TextPaint(paint)

    // Pre-collect all ViewSpan and BrSpan boundaries sorted by start position.
    // This replaces the per-iteration findNextViewSpan() call — which re-scanned the
    // full span array from currentPos to attributed.length on every text run — with a
    // single upfront O(spans) pass.  Subsequent lookups are O(1) via index cursor.
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
          // Width via StaticLayout horizontal positions.  Avoids creating a
          // subSequence CharSequence copy; the attributed string is used directly
          // in the fallback path instead.
          //
          // getPrimaryHorizontal() resolves a full bidi-aware visual position
          // for each offset - calling it twice re-does that resolution twice.
          // For a run that's confined to one line and contains no RTL
          // characters (the common case for plain LTR UI text), a run's total
          // glyph advance is the same whether read in logical or visual order,
          // so Layout.getDesiredWidth() (a single, direct sum of advances) is
          // equivalent and cheaper. Anything else (multi-line run, any RTL
          // content) keeps the exact original bidi-safe path.
          val singleLine = layout.getLineForOffset(currentPos) == layout.getLineForOffset(end)
          val width = if (singleLine &&
            !TextDirectionHeuristics.ANYRTL_LTR.isRtl(attributed, currentPos, end - currentPos)
          ) {
            Layout.getDesiredWidth(attributed, currentPos, end, textPaint)
          } else {
            try {
              val startX = layout.getPrimaryHorizontal(currentPos)
              val endX = layout.getPrimaryHorizontal(end)
              kotlin.math.abs(endX - startX)
            } catch (_: Throwable) {
              Layout.getDesiredWidth(attributed, currentPos, end, textPaint)
            }
          }

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
          val fontMetrics = scratchFontMetrics
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

      val tPackStart = System.nanoTime()
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
      val tPackEnd = System.nanoTime()

      // Call the packed JNI path synchronously. This path is safe when
      // invoked inside the expected native/Java measurement flow and we
      // prefer the fast packed primitive arrays.
      NativeHelpers.nativeNodeSetSegmentsPacked(
        node.mason.nativePtr,
        node.nativePtr,
        floats,
        longs,
        kinds
      )
    }

    // segments are up-to-date now — align attributedStringVersion so cache checks succeed
    attributedStringVersion = segmentsInvalidateVersion
    lastSegmentsVersion = segmentsInvalidateVersion
    lastSegmentsLayout = layout
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

    override fun getSize(
      paint: Paint, text: CharSequence?, start: Int, end: Int, fm: Paint.FontMetricsInt?
    ): Int {
      var width = if (childNode.cachedWidth > 0) {
        childNode.cachedWidth.toInt()
      } else {
        childNode.computedWidth.toInt()
      }

      var height = if (childNode.cachedHeight > 0) {
        childNode.cachedHeight.toInt()
      } else {
        childNode.computedHeight.toInt()
      }

      // Fallback: if computed sizes are zero, try measuring the child view
      if ((width <= 0 || height <= 0) && childNode.view is View) {
        val childView = childNode.view as View
        childView.measure(
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        )
        val mw = childView.measuredWidth
        val mh = childView.measuredHeight
        if (mw > 0) width = mw
        if (mh > 0) height = mh
      }

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

      // If this is a block-level child, try to use the parent's available
      // width so the placeholder spans the full line instead of shrinking to
      // the child's computed width (which may be zero while layouts are
      // being computed).
      if (childNode.style.display == Display.Block) {
        var parentWidth = childNode.parent?.computedWidth?.toInt() ?: 0
        if (parentWidth <= 0) {
          // Fallback to nearest ancestor Element width to get the real container width
          val ancestorElement = findAncestorElement(childNode)
          parentWidth = ancestorElement?.node?.computedWidth?.toInt() ?: parentWidth
        }

        if (parentWidth <= 0) {
          // Fallback to this TextContainer's computed width
          try {
            val fallback = container.node.computedWidth.toInt()
            if (fallback > 0) parentWidth = fallback
          } catch (_: Throwable) {
          }
        }

        // Match web semantics: if we have a parent/container width, use it.
        // Otherwise leave the measured width as-is to allow overflow when nowrap.
        if (parentWidth > 0) {
          width = parentWidth
        }
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
      var cachedWidth = if (childNode.cachedWidth > 0) {
        childNode.cachedWidth.toInt()
      } else {
        childNode.computedWidth.toInt()
      }

      var cachedHeight = if (childNode.cachedHeight > 0) {
        childNode.cachedHeight.toInt()
      } else {
        childNode.computedHeight.toInt()
      }

      val childView = childNode.view as? View ?: return

      // Ensure the child view has a measured size. Prefer cached/computed
      // sizes but fall back to an intrinsic measure pass when necessary.
      if (cachedWidth <= 0 || cachedHeight <= 0) {
        childView.measure(
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED),
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        )
        val mw = childView.measuredWidth
        val mh = childView.measuredHeight
        if (mw > 0) cachedWidth = mw
        if (mh > 0) cachedHeight = mh
      }

      // If this child is a block, prefer to size it to the parent's width so
      // borders and backgrounds span the full line.
      if (childNode.style.display == Display.Block) {
        var parentWidth = childNode.parent?.computedWidth?.toInt() ?: 0
        if (parentWidth <= 0) {
          val ancestorElement = findAncestorElement(childNode)
          parentWidth = ancestorElement?.node?.computedWidth?.toInt() ?: parentWidth
        }
        if (parentWidth > 0) {
          cachedWidth = parentWidth
        }
      }

      if (cachedWidth > 0 && cachedHeight > 0) {
        childView.measure(
          MeasureSpec.makeMeasureSpec(cachedWidth, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(cachedHeight, MeasureSpec.EXACTLY)
        )
        childView.layout(0, 0, cachedWidth, cachedHeight)
      }

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

      canvas.withTranslation(x, drawY) {
        childView.draw(this)
      }
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
  internal var cachedAttributedString: SpannableStringBuilder? = null
  private var isBuilding = false

  // Last (version, layout) collectAndCacheSegments() sent over JNI for.
  // buildStaticLayoutCached returns the same cached instance on a hit, so
  // `layout === lastSegmentsLayout` means line-break geometry hasn't moved.
  private var lastSegmentsVersion: Int = -1
  private var lastSegmentsLayout: android.text.Layout? = null

  private var minMeasuredTextWidth: Float = 0f
  private var minMeasuredTextHeight: Float = 0f

  private var measuredTextWidth: Float = 0f
  private var measuredTextHeight: Float = 0f

  private var maxMeasuredTextWidth: Float = 0f
  private var maxMeasuredTextHeight: Float = 0f

  // P4: cache for the StaticLayout construction inside measureLayout(). A
  // single call to measureLayout() can build up to two StaticLayouts (an
  // unconstrained probe, then a rebuild at the measured width) with distinct
  // shapes, and repeated calls tend to alternate between only a handful of
  // distinct probes per pass (min-content, max-content, 1-2 definite-width
  // finalizations) - a single cache slot would have both builds in one call
  // evict each other, missing every time. Sized at 4 slots, round-robin
  // eviction; keyed on everything that actually changes StaticLayout's shape,
  // gated by segmentsInvalidateVersion (already the trusted "did the
  // spannable/paint-affecting style change" signal - see cachedAttributedString
  // above, which uses the same version for the same reason).
  private class StaticLayoutCacheEntry(
    val version: Int,
    val widthConstraint: Int,
    val availableWidth: Float,
    val spannableLength: Int,
    val alignment: android.text.Layout.Alignment,
    val includePadding: Boolean,
    val justified: Boolean,
    val heuristic: TextDirectionHeuristic,
    val layout: StaticLayout
  )

  private val staticLayoutCache = arrayOfNulls<StaticLayoutCacheEntry>(4)
  private var staticLayoutCacheNextIdx = 0

  // P20: reused across paint.getFontMetrics() call sites in this class instead
  // of the allocating no-arg `paint.fontMetrics` property, which returns a
  // fresh Paint.FontMetrics every call. Every use reads the fields immediately
  // and doesn't retain the instance, so sharing one scratch object across call
  // sites is safe (Android text measurement/draw all happen on the UI thread).
  private val scratchFontMetrics = android.graphics.Paint.FontMetrics()

  // P17/P20: reused per text-run in collectAndCacheSegments() instead of a
  // fresh `TextPaint(textPaint)` copy per run - `.set()` overwrites all fields
  // cheaply, same effect as the copy constructor without the allocation. Only
  // used to read the run's font metrics after applying its character-style
  // spans; nothing retains this instance across runs.
  private val scratchRunPaint = TextPaint()

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

    // Apply background color as a text span only for inline elements.
    // Block-level elements (Button, div, etc.) draw their own background
    // via ViewUtils/mBackground — adding a BackgroundColorSpan creates a
    // redundant colored rect behind the text glyphs ("cutout" artifact).
    if (container.node.view == null) {
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
    fontFace.font?.let { typeface ->
      val isBold = fontFace.weight.weight >= 600
      val isItalic = fontFace.style.fontStyle == android.graphics.Typeface.ITALIC
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
      when (decorationLine) {
        Styles.DecorationLine.Underline -> {
          val scale = container.node.mason.scale
          val thicknessPx = container.style.resolvedDecorationThickness * scale
          spannable.setSpan(
            Spans.UnderlineSpan(
              container.style.resolvedDecorationColor,
              thicknessPx
            ), start, end, flags
          )
        }

        Styles.DecorationLine.LineThrough -> {
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        Styles.DecorationLine.Overline -> {
          val scale = container.node.mason.scale
          val thicknessPx = container.style.resolvedDecorationThickness * scale
          spannable.setSpan(
            Spans.OverlineSpan(
              container.style.resolvedDecorationColor,
              thicknessPx
            ), start, end, flags
          )
        }

        Styles.DecorationLine.UnderlineLineThrough -> {
          val scale = container.node.mason.scale
          val thicknessPx = container.style.resolvedDecorationThickness * scale
          spannable.setSpan(
            Spans.UnderlineSpan(
              container.style.resolvedDecorationColor,
              thicknessPx
            ), start, end, flags
          )
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        Styles.DecorationLine.UnderlineOverline -> {
          spannable.setSpan(
            Spans.UnderlineSpan(
              container.style.resolvedDecorationColor,
              container.style.resolvedDecorationThickness
            ), start, end, flags
          )
          spannable.setSpan(
            Spans.OverlineSpan(
              container.style.resolvedDecorationColor,
              container.style.resolvedDecorationThickness
            ), start, end, flags
          )
        }

        Styles.DecorationLine.OverlineUnderlineLineThrough -> {
          spannable.setSpan(
            Spans.OverlineSpan(
              container.style.resolvedDecorationColor,
              container.style.resolvedDecorationThickness
            ), start, end, flags
          )
          spannable.setSpan(
            Spans.UnderlineSpan(
              container.style.resolvedDecorationColor,
              container.style.resolvedDecorationThickness
            ), start, end, flags
          )
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        else -> {}
      }
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
  private fun buildAttributedString(): SpannableStringBuilder {

    // Return cached version if valid
    if (cachedAttributedString != null && attributedStringVersion == segmentsInvalidateVersion) {
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
            composed.append(child.attributed(true))
          }

          child.view is TextContainer -> {
            val childTextContainer = child.view as TextContainer
            if (shouldFlattenTextContainer(childTextContainer)) {
              val nested = childTextContainer.engine.buildAttributedString()
              val start = composed.length
              composed.append(nested)
              val end = composed.length
              applyTextViewStylesToSpan(composed, start, end, childTextContainer)
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
    // mark cached string as up-to-date with the current invalidate version
    attributedStringVersion = segmentsInvalidateVersion

    return wrapped
  }

  internal fun invalidateInlineSegments(markDirty: Boolean = true) {
    segmentsInvalidateVersion += 1
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
    // If this TextView is a child of another TextView, invalidate parent to
    // This handles the case where a flattened child's styles change
    val parent = node.parent

    if (parent?.view is TextContainer) {
      (parent.view as TextContainer).engine.invalidateInlineSegments()
    } else {
      parent?.dirty()
      parent?.computeCacheDirty = true
      (parent?.view as? View)?.invalidate()
    }

    when (node.view) {
      is Element -> {
        (node.view as Element).apply {
          val root = node.getRootNode() ?: this.node
          root.computeCacheDirty = true
          view.invalidate()
          invalidateLayout()
        }
      }

      is View -> {
        findAncestorElement(node)?.let { element ->
          val root = element.node.getRootNode() ?: element.node
          root.computeCacheDirty = true
          root.dirty()
        }
        (node.view as View).apply {
          invalidate()
          requestLayout()
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
}

/** Describes a floated sibling element's position and side for float-aware text wrapping. */
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
