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
import android.text.style.ForegroundColorSpan
import android.text.style.ReplacementSpan
import android.text.style.StrikethroughSpan
import android.text.style.UnderlineSpan
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
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.VerticalAlign
import kotlin.math.ceil

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


  fun onTextStyleChanged(change: Int, paint: Paint, displayMetrics: DisplayMetrics) {
    var dirty = false
    var layout = false
    if (change and TextStyleChangeMask.COLOR != 0) {
      paint.color = style.resolvedColor
      dirty = true
    }

    if (change and TextStyleChangeMask.FONT_SIZE != 0) {
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

    if (change and TextStyleChangeMask.FONT_WEIGHT != 0 || change and TextStyleChangeMask.FONT_STYLE != 0 || change and TextStyleChangeMask.FONT_FAMILY != 0) {
      style.resolvedFontFace.font?.let {
        paint.typeface = it
        dirty = true
      }
    }


    if (
      change and TextStyleChangeMask.TEXT_WRAP != 0 ||
      change and TextStyleChangeMask.WHITE_SPACE != 0 ||
      change and TextStyleChangeMask.TEXT_TRANSFORM != 0 ||
      change and TextStyleChangeMask.DECORATION_LINE != 0 ||
      change and TextStyleChangeMask.DECORATION_COLOR != 0 ||
      change and TextStyleChangeMask.DECORATION_STYLE != 0 ||
      change and TextStyleChangeMask.LETTER_SPACING != 0 ||
      change and TextStyleChangeMask.TEXT_JUSTIFY != 0 ||
      change and TextStyleChangeMask.BACKGROUND_COLOR != 0 ||
      change and TextStyleChangeMask.LINE_HEIGHT != 0 ||
      change and TextStyleChangeMask.TEXT_ALIGN != 0 ||
      change and TextStyleChangeMask.TEXT_OVERFLOW != 0 ||
      change and TextStyleChangeMask.TEXT_SHADOW != 0

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
  ): android.text.Layout? {
    val spannable = buildAttributedString()
    (container.node.view as? View)?.let {
      if (it.layoutParams == null) {
        it.layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
        )
      }
    }

    container.setText(spannable, BufferType.SPANNABLE)

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
      widthConstraint = availableWidth.toInt()
    }

    val alignment = getLayoutAlignment()  // Use the alignment from textAlign property

    val layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {

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
    } else {
      measuredWidth = if (widthConstraint == Int.MAX_VALUE) {
        if (availableWidth == -1f) {
          spannable.split(white_space)
            .maxOfOrNull { android.text.Layout.getDesiredWidth(it, paint) } ?: 0f
        } else {
          android.text.Layout.getDesiredWidth(spannable, paint)
        }
      } else {
        layout.width.toFloat()
      }
    }

    // Store the actual measured dimensions (not the constraints)
    this.measuredTextWidth = measuredWidth
    this.measuredTextHeight = layout.height.toFloat()

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
    val layout = measureLayout(
      paint,
      knownDimensions.width ?: Float.NaN,
      knownDimensions.height ?: Float.NaN,
      availableSpace.width ?: Float.NaN,
      availableSpace.height ?: Float.NaN
    )

    // Use the actual measured dimensions from the layout
    val width = if (layout != null) {
      measuredTextWidth
    } else {
      0f
    }

    val height = if (layout != null) {
      measuredTextHeight
    } else {
      0f
    }

    style.syncFontMetrics()

    val fontMetrics = paint.fontMetrics

    val minLineHeight = -fontMetrics.ascent + fontMetrics.descent + fontMetrics.leading

    val measuredHeight = layout?.height?.toFloat()

    val finalHeight = measuredHeight?.coerceAtLeast(minLineHeight) ?: height

    return Size(width, finalHeight)
  }

  private fun collectAndCacheSegments(
    layout: android.text.Layout,
    attributed: SpannableStringBuilder,
    paint: TextPaint
  ) {

    val segments = mutableListOf<InlineSegment>()

    // Use a TextPaint matching the current TextView properties for consistent measurement
    val textPaint = TextPaint(paint)

    // Walk through the spannable to find text runs and view placeholders
    var currentPos = 0
    while (currentPos < attributed.length) {
      val viewSpans = attributed.getSpans(currentPos, currentPos + 1, ViewSpan::class.java)

      if (viewSpans.isNotEmpty()) {
        // Inline child placeholder
        val viewSpan = viewSpans[0]
        val height = viewSpan.childNode.cachedHeight.takeIf { it > 0 }
          ?: viewSpan.childNode.computedLayout.height

        segments.add(
          InlineSegment.InlineChild(
            viewSpan.childNode.nativePtr, height  // Already in px
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

          segments.add(
            InlineSegment.Text(
              ceil(width),  // Already in px
              -fontMetrics.ascent,  // Negative because ascent is negative
              fontMetrics.descent  // Already in px
            )
          )

          currentPos = end
        } else {
          currentPos++
        }
      }
    }

    // Push segments to native
    if (node.nativePtr != 0L) {
      NativeHelpers.nativeNodeSetSegments(
        node.mason.nativePtr, node.nativePtr, segments.toTypedArray()
      )
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
      val layout = node.computedLayout
      val width = layout.width.toInt()
      val height = layout.height.toInt()

      if (width <= 0 || height <= 0) return

      view.layout(0, 0, width, height)

      bitmap = createBitmap(width, height)
      val canvas = Canvas(bitmap!!)
      view.draw(canvas)
    }
  }


  // Custom span for inline child views
  private class ViewSpan(
    val childNode: Node, private val viewHelper: ViewHelper
  ) : ReplacementSpan() {

    override fun getSize(
      paint: Paint, text: CharSequence?, start: Int, end: Int, fm: Paint.FontMetricsInt?
    ): Int {
      val width = if (childNode.cachedWidth > 0) {
        childNode.cachedWidth.toInt()
      } else {
        childNode.computedLayout.width.toInt()
      }

      val height = if (childNode.cachedHeight > 0) {
        childNode.cachedHeight.toInt()
      } else {
        childNode.computedLayout.height.toInt()
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
      val cachedWidth = if (childNode.cachedWidth > 0) {
        childNode.cachedWidth.toInt()
      } else {
        childNode.computedLayout.width.toInt()
      }

      val cachedHeight = if (childNode.cachedHeight > 0) {
        childNode.cachedHeight.toInt()
      } else {
        childNode.computedLayout.height.toInt()
      }

      val childView = childNode.view as? View ?: return

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


  // monotonically increasing version for invalidation; cachedAttributedString is valid when
  // attributedStringVersion == segmentsInvalidateVersion
  private var attributedStringVersion: Int = 0
  private var segmentsInvalidateVersion: Int = 0
  internal var cachedAttributedString: SpannableStringBuilder? = null
  private var isBuilding = false

  private var measuredTextWidth: Float = 0f
  private var measuredTextHeight: Float = 0f

  internal fun shouldFlattenTextContainer(container: TextContainer): Boolean {
    if (!container.node.style.isValueInitialized) return true
    val style = container.node.style

    // Inline-block elements should never be flattened
    if (style.display == Display.InlineBlock) {
      return false
    }

    val hasBackground =
      container.node.style.backgroundColor != 0 || (container.node.view as? View)?.background != null
    val borderWidth = style.borderWidth
    val hasBorder =
      borderWidth.top.value > 0f || borderWidth.right.value > 0f || borderWidth.bottom.value > 0f || borderWidth.left.value > 0f

    val padding = style.padding
    val hasPadding =
      padding.top.value > 0f || padding.right.value > 0f || padding.bottom.value > 0f || padding.left.value > 0f

    val size = style.size
    val hasExplicitSize = size.width != Dimension.Auto || size.height != Dimension.Auto

    // If it has any view properties, treat as inline-block
    return !(hasBackground || hasBorder || hasPadding || hasExplicitSize)
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

    val fontSize = container.style.resolvedFontSize

    // Apply font size
    if (fontSize > 0) {
      spannable.setSpan(
        AbsoluteSizeSpan(fontSize, true), start, end, flags
      )
    }

    val fontFace = container.style.resolvedFontFace
    // Apply typeface
    fontFace.font?.let { typeface ->
      spannable.setSpan(
        Spans.TypefaceSpan(typeface), start, end, flags
      )
    }

    val decorationLine = container.style.resolvedDecorationLine

    // Apply text decoration
    if (decorationLine != Styles.DecorationLine.None) {
      when (decorationLine) {
        Styles.DecorationLine.Underline -> {
          spannable.setSpan(UnderlineSpan(), start, end, flags)
        }

        Styles.DecorationLine.LineThrough -> {
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        Styles.DecorationLine.Overline -> {
          /*  spannable.setSpan(
              OverlineSpan(
                container.style.resolvedDecorationColor,
                container.style.resolvedDecorationThickness
              ), start, end, flags
            )
            */
        }

        Styles.DecorationLine.UnderlineLineThrough -> {
          spannable.setSpan(UnderlineSpan(), start, end, flags)
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        Styles.DecorationLine.UnderlineOverline -> {}
        Styles.DecorationLine.OverlineUnderlineLineThrough -> {}
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
            composed.append(placeholder)
          }
        }

        child.nativePtr != 0L && child.style.display != Display.None -> {
          val placeholder = createPlaceholder(child)
          composed.append(placeholder)
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
    measuredTextWidth = 0f
    measuredTextHeight = 0f
    node.cachedWidth = 0f
    node.cachedHeight = 0f
    if (markDirty) {
      node.dirty()
    }
    // If this TextView is a child of another TextView, invalidate parent too
    // This handles the case where a flattened child's styles change
    val parent = node.parent

    if (parent?.view is TextContainer) {
      (parent.view as TextContainer).engine.invalidateInlineSegments()
    }

    (node.view as? View)?.let {
      it.invalidate()
      it.requestLayout()
    }
  }
}
