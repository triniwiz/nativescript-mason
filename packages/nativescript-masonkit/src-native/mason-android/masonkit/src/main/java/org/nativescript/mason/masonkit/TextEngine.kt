package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.os.Build
import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.AbsoluteSizeSpan
import android.text.style.AlignmentSpan
import android.text.style.CharacterStyle
import android.text.style.ForegroundColorSpan
import android.text.style.ReplacementSpan
import android.text.style.StrikethroughSpan
import android.text.style.UpdateLayout
import android.util.DisplayMetrics
import android.util.Log
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
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FontVariantNumeric
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.VerticalAlign
import kotlin.math.ceil
import kotlin.math.abs

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

  private var mIncludePadding: Boolean = true
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
        child.attributes.copy(attributes = defaultAttrs)
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
      if (fontSize == 0) {
        paint.textSize = 0f
      } else {
        paint.textSize = TypedValue.applyDimension(
          TypedValue.COMPLEX_UNIT_SP,
          fontSize.toFloat(),
          displayMetrics
        )
      }
      layout = true
      dirty = true
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


    if (
      StateKeys.hasFlag(
        low, high, StateKeys.TEXT_WRAP
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.WHITE_SPACE
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.TEXT_TRANSFORM
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.DECORATION_LINE
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.DECORATION_COLOR
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.DECORATION_STYLE
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.LETTER_SPACING
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.TEXT_JUSTIFY
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.BACKGROUND_COLOR
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.LINE_HEIGHT
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.TEXT_ALIGN
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.TEXT_OVERFLOW
      ) ||
      StateKeys.hasFlag(
        low, high, StateKeys.TEXT_SHADOWS
      )

    ) {
      dirty = true
    }


    if (dirty) {
      updateStyleOnTextNodes()
      invalidateInlineSegments()
      if (layout) {
        if (node.isAnonymous) {
          node.layoutParent?.dirty()
        }
        (node.view as? Element)?.invalidateLayout()
      }
    }
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
      try {
        for (child in node.children) {
          if (child is TextNode) fallback.append(child.data)
        }
      } catch (_: Exception) {
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
        try {
          container.setText(spannable.toString(), BufferType.NORMAL)
        } catch (_: Exception) {
        }
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

    // Adjust width constraint to account for container padding so StaticLayout
    // measures the text inside the content-box (matching web behavior).
    try {
      val padL = container.node.computedPaddingLeft.toInt()
      val padR = container.node.computedPaddingRight.toInt()
      if (widthConstraint != Int.MAX_VALUE) {
        val adjusted = widthConstraint - (padL + padR)
        widthConstraint = if (adjusted > 0) adjusted
        else 0
      } else if (availableWidth.isFinite() && availableWidth > 0f) {
        val adjusted = availableWidth.toInt() - (padL + padR)
        if (adjusted > 0) widthConstraint = adjusted
      }
    } catch (_: Throwable) {
    }

    var allowWrap = true
    if (node.style.isTextValueInitialized) {
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
      try {
        val padL = container.node.computedPaddingLeft.toInt()
        val padR = container.node.computedPaddingRight.toInt()
        val adjusted = availableWidth.toInt() - (padL + padR)
        widthConstraint = if (adjusted > 0) adjusted else 0
      } catch (_: Throwable) {
        widthConstraint = availableWidth.toInt()
      }
    }

    // Respect style `max-width` when present (Points only). Clamp the
    // width constraint so StaticLayout won't measure wider than the author
    // intended. Percent/Auto cases require context-dependent resolution
    // and are not handled here.

    when (val msw = style.maxSize.width) {
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
        try {
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
            try {
              Log.d(
                "com.test",
                "measure-clamp parentFloated nodePtr=${node.nativePtr} parentPtr=${p.nativePtr} before=$before after=$widthConstraint pContent=$pContent"
              )
            } catch (_: Throwable) {
            }
          }
        } catch (_: Throwable) {
        }
      }
    }

    val alignment = getLayoutAlignment()  // Use the alignment from textAlign property

    var layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {

//      val heuristic = when (textDirection) {
//        View.TEXT_DIRECTION_ANY_RTL -> android.text.TextDirectionHeuristics.ANYRTL_LTR
//        View.TEXT_DIRECTION_LTR -> android.text.TextDirectionHeuristics.LTR
//        View.TEXT_DIRECTION_RTL -> android.text.TextDirectionHeuristics.RTL
//        View.TEXT_DIRECTION_LOCALE -> android.text.TextDirectionHeuristics.LOCALE
//        View.TEXT_DIRECTION_FIRST_STRONG_RTL -> android.text.TextDirectionHeuristics.FIRSTSTRONG_RTL
//        View.TEXT_DIRECTION_FIRST_STRONG_LTR -> android.text.TextDirectionHeuristics.FIRSTSTRONG_LTR
//        else -> android.text.TextDirectionHeuristics.FIRSTSTRONG_LTR
//      }

      var builder = StaticLayout.Builder.obtain(
        spannable, 0, spannable.length, paint, widthConstraint
      )
        .setAlignment(alignment)
        .setLineSpacing(0f, 1f)
        .setIncludePad(includePadding)
      //.setTextDirection(heuristic)


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
      StaticLayout(
        spannable, paint, widthConstraint, alignment, 1f, // lineSpacingMultiplier
        0f, // lineSpacingExtra
        includePadding // includePad
      )
    }

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
          val minContentWidth = spannable.split(white_space)
            .maxOfOrNull { Layout.getDesiredWidth(it, paint) } ?: 0f
          // For min-content, use the widest word but never smaller than what the
          // layout/paint already measured (handles complex emoji clusters)
          measuredWidth = maxOf(measuredWidth, minContentWidth)
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
            spannable.split(white_space)
              .maxOfOrNull { paint.measureText(it) } ?: 0f
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
        layout.width.toFloat()
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

    if (widthConstraint == Int.MAX_VALUE){
      // rebuild static layout with the measuredWidth
      layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {

//      val heuristic = when (textDirection) {
//        View.TEXT_DIRECTION_ANY_RTL -> android.text.TextDirectionHeuristics.ANYRTL_LTR
//        View.TEXT_DIRECTION_LTR -> android.text.TextDirectionHeuristics.LTR
//        View.TEXT_DIRECTION_RTL -> android.text.TextDirectionHeuristics.RTL
//        View.TEXT_DIRECTION_LOCALE -> android.text.TextDirectionHeuristics.LOCALE
//        View.TEXT_DIRECTION_FIRST_STRONG_RTL -> android.text.TextDirectionHeuristics.FIRSTSTRONG_RTL
//        View.TEXT_DIRECTION_FIRST_STRONG_LTR -> android.text.TextDirectionHeuristics.FIRSTSTRONG_LTR
//        else -> android.text.TextDirectionHeuristics.FIRSTSTRONG_LTR
//      }

        var builder = StaticLayout.Builder.obtain(
          spannable, 0, spannable.length, paint, measuredWidth.toInt()
        )
          .setAlignment(alignment)
          .setLineSpacing(0f, 1f)
          .setIncludePad(includePadding)
        //.setTextDirection(heuristic)


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
        StaticLayout(
          spannable, paint, measuredWidth.toInt(), alignment, 1f, // lineSpacingMultiplier
          0f, // lineSpacingExtra
          includePadding // includePad
        )
      }
    }

    if (container is TextView) {
      container.cachedStaticLayout = layout
      container.cachedStaticLayoutWidth = widthConstraint
    }

    // CRITICAL: Collect and send segments to Rust
    collectAndCacheSegments(layout, spannable, paint)

    return layout
  }

  private fun getLayoutAlignment(): android.text.Layout.Alignment {
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

  fun measure(
    paint: TextPaint,
    knownDimensions: Size<Float?>,
    availableSpace: Size<Float?>
  ): Size<Float> {
    // Guard: Rust holds a read lock during measure — no buffer writes allowed
    style.inMeasure = true
    val pendingInvalidate = style.fontDirty
    try {
      val layout = measureLayout(
        paint,
        knownDimensions.width ?: Float.NaN,
        knownDimensions.height ?: Float.NaN,
        availableSpace.width ?: Float.NaN,
        availableSpace.height ?: Float.NaN
      )


      // Use the actual measured dimensions from the layout
      val width = if (layout != null) {
        when (availableSpace.width) {
          -1f -> minMeasuredTextWidth
          -2f -> maxMeasuredTextWidth
          else -> measuredTextWidth
        }
      } else {
        0f
      }

      val height = if (layout != null) {
        when (availableSpace.height) {
          -1f -> minMeasuredTextHeight
          -2f -> maxMeasuredTextHeight
          else -> measuredTextHeight
        }
      } else {
        0f
      }
      // Deferred: syncFontMetrics will set pendingMetricsSync instead of writing
      style.syncFontMetrics()

      val fontMetrics = paint.fontMetrics

      val minLineHeight = -fontMetrics.ascent + fontMetrics.descent + fontMetrics.leading

      val measuredHeight = layout?.height?.toFloat()

      val finalHeight = measuredHeight?.coerceAtLeast(minLineHeight) ?: height

      try {
        val nodePtr = node.nativePtr
        Log.d(
          "TextEngine.measure",
          "nodePtr=${nodePtr} available=${availableSpace.width}x${availableSpace.height} measured=${width}x${finalHeight} layoutPresent=${layout != null}"
        )
        if (finalHeight != 0f && abs(finalHeight) < 1e-6f) {
          Log.w("TextEngine.measure", "tiny finalHeight on nodePtr=${nodePtr} -> ${finalHeight}")
        }
        if (width != 0f && abs(width) < 1e-6f) {
          Log.w("TextEngine.measure", "tiny width on nodePtr=${nodePtr} -> ${width}")
        }
      } catch (_: Throwable) {
      }

      return Size(width, finalHeight)
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

  private fun collectAndCacheSegments(
    layout: android.text.Layout,
    attributed: SpannableStringBuilder,
    paint: TextPaint
  ) {

    val segments = mutableListOf<InlineSegment>()

    // Use a TextPaint matching the current TextView properties for consistent measurement
    val textPaint = TextPaint(paint)

    // By default follow web semantics: report measured child and run heights
    // to native without imposing aggressive caps here. The layout engine on
    // native side will compute line-box metrics similarly to browser rules.

    // Walk through the spannable to find text runs and view placeholders
    var currentPos = 0
    while (currentPos < attributed.length) {

      val brSpans = attributed.getSpans(currentPos, currentPos + 1, BrSpan::class.java)
      if (brSpans.isNotEmpty()) {
        // Inline child placeholder
        val brSpan = brSpans[0]
        segments.add(
          InlineSegment.Br()
        )

        currentPos = attributed.getSpanEnd(brSpan)
        continue
      }


      val viewSpans = attributed.getSpans(currentPos, currentPos + 1, ViewSpan::class.java)

      if (viewSpans.isNotEmpty()) {
        // Inline child placeholder
        val viewSpan = viewSpans[0]
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

        currentPos = attributed.getSpanEnd(viewSpan)
      } else {
        // Text segment - measure this run with proper paint
        val nextViewStart = findNextViewSpan(attributed, currentPos)
        val end = if (nextViewStart >= 0) nextViewStart else attributed.length

        if (end > currentPos) {
          val textRun = attributed.subSequence(currentPos, end)

          // Measure with the attributed text's spans applied
          // val width = Layout.getDesiredWidth(textRun, 0, textRun.length, textPaint)

          val width = try {
            val startX = layout.getPrimaryHorizontal(currentPos)
            val endX = layout.getPrimaryHorizontal(end) // runEnd is the index after the last char
            kotlin.math.abs(endX - startX)
          } catch (_: Throwable) {
            // fallback to desired width if layout doesn't support primaryHorizontal for some reason
            Layout.getDesiredWidth(textRun, 0, textRun.length, textPaint)
          }

          // Get font metrics for this specific run by applying spans to a temporary paint
          val runPaint = TextPaint(textPaint)

          // Apply all character style spans to the paint
          val spans =
            attributed.getSpans(currentPos, end, android.text.style.CharacterStyle::class.java)
          for (span in spans) {
            span.updateDrawState(runPaint)
          }

          val fontMetrics = runPaint.fontMetrics

          // Use the run's measured font metrics directly to represent ascent
          // and descent, matching browser behavior where intrinsic font
          // metrics determine line-box contributions.
          var ascentPx = -fontMetrics.ascent
          var descentPx = fontMetrics.descent

          segments.add(
            InlineSegment.Text(
              // Encode resolved whitespace as a compact flags byte
              style.resolvedWhiteSpace.value,
              ceil(width),  // Already in px
              ascentPx,  // positive ascent value in px
              descentPx  // descent in px
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
            floats[i * 3 + 0] = seg.width
            floats[i * 3 + 1] = seg.ascent
            floats[i * 3 + 2] = seg.descent
            floats[i * 3 + 3] = seg.flags.toFloat()
          }

          is InlineSegment.InlineChild -> {
            kinds[i] = 1
            longs[i] = seg.id
            floats[i * 3 + 0] = seg.descent
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
      // prefer the fast packed primitive arrays. Removed the previous
      // deferred-post path since writes are contained within the enclosing
      // lock context and do not require posting to the view thread.
      val tJniStart = System.nanoTime()
      NativeHelpers.nativeNodeSetSegmentsPacked(
        node.mason.nativePtr,
        node.nativePtr,
        floats,
        longs,
        kinds
      )
      val tJniEnd = System.nanoTime()

      try {
        Log.d(
          "mason-text-bench",
          "packed count=$count packMs=${(tPackEnd - tPackStart) / 1e6} jniMs=${(tJniEnd - tJniStart) / 1e6}"
        )
      } catch (_: Throwable) {
      }
    }

    // segments are up-to-date now — align attributedStringVersion so cache checks succeed
    attributedStringVersion = segmentsInvalidateVersion
  }

  private fun findNextViewSpan(text: SpannableStringBuilder, start: Int): Int {
    val spans = text.getSpans(start, text.length, ViewSpan::class.java)
    return if (spans.isNotEmpty()) {
      text.getSpanStart(spans[0])
    } else {
      -1
    }
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

      Log.d(
        "TextEngine:getSize",
        "$width $height ..... ${childNode.cachedWidth} ${childNode.cachedHeight}"
      )

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
      try {
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
      } catch (_: Throwable) {
      }

      try {
        Log.d(
          "mason-debug-text",
          "ViewSpan.getSize node=${childNode.nativePtr} w=$width h=$height fm=${fm?.ascent},${fm?.descent}"
        )
      } catch (_: Throwable) {
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

      Log.d(
        "TextEngine:draw",
        "$cachedWidth $cachedHeight ..... ${childNode.cachedWidth} ${childNode.cachedHeight}"
      )

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
        try {
          Log.d(
            "mason-debug-text",
            "ViewSpan.draw node=${childNode.nativePtr} x=$x drawTop=$drawY cachedW=$cachedWidth cachedH=$cachedHeight"
          )
        } catch (_: Throwable) {
        }
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

  private var minMeasuredTextWidth: Float = 0f
  private var minMeasuredTextHeight: Float = 0f

  private var measuredTextWidth: Float = 0f
  private var measuredTextHeight: Float = 0f

  private var maxMeasuredTextWidth: Float = 0f
  private var maxMeasuredTextHeight: Float = 0f

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

    val color = container.style.resolvedColor
    // Apply color
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
      val bgColor = container.style.resolvedBackgroundColor
      if (bgColor != 0 && ((bgColor shr 24) and 0xFF) != 0) {
        spannable.setSpan(Spans.BackgroundColorSpan(bgColor), start, end, flags)
      }
    }

    val fontSize = container.style.resolvedFontSize

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
      val isBold = fontFace.fontDescriptors.weight.isBold
      val isItalic = fontFace.fontDescriptors.style.fontStyle == android.graphics.Typeface.ITALIC
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
      try {
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
      } catch (_: Throwable) {
      }

      // Leading margin to offset the bar + gap
      val leading = (barWidth + gap).toInt()
      try {
        Log.d(
          "mason-debug-text",
          "Blockquote span applied node=${container.node.nativePtr} barWidth=$barWidth gap=$gap leading=$leading"
        )
      } catch (_: Throwable) {
      }
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
    // Apply letter spacing
    if (letterSpacingValue != 0f) {
      spannable.setSpan(
        android.text.style.ScaleXSpan(1f + letterSpacingValue), start, end, flags
      )
    }

    val lineHeight = container.style.resolvedLineHeight
    val lineType = container.style.resolvedLineHeightType

    // Apply line height

    lineHeight.takeIf { it > 0 }?.let {
      // 1
      if (lineType == StyleState.SET) {
        spannable.setSpan(FixedLineHeightSpan(it.toInt()), start, end, flags)
      } else {
        spannable.setSpan(RelativeLineHeightSpan(it), start, end, flags)
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

    for (child in node.children) {
      when {
        child.view is Br.FakeView -> {
          composed.append(createBRholder())
        }

        child is TextNode -> {
          composed.append(child.attributed())
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

    isBuilding = false

    // Cache the result
    cachedAttributedString = composed
    // mark cached string as up-to-date with the current invalidate version
    attributedStringVersion = segmentsInvalidateVersion

    return composed
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
