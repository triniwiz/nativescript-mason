package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Build
import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.AbsoluteSizeSpan
import android.text.style.ForegroundColorSpan
import android.text.style.ReplacementSpan
import android.text.style.StrikethroughSpan
import android.text.style.UnderlineSpan
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import androidx.core.graphics.createBitmap
import androidx.core.widget.TextViewCompat
import org.nativescript.mason.masonkit.Styles.TextJustify
import org.nativescript.mason.masonkit.Styles.TextWrap
import java.nio.ByteBuffer
import java.nio.ByteOrder

class TextView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : androidx.appcompat.widget.AppCompatTextView(context, attrs), Element, MeasureFunc {

  override val view: View
    get() = this

  override val style: Style
    get() = node.style

  lateinit var font: FontFace
    private set

  var type: TextType = TextType.None
    private set

  override lateinit var node: Node
    private set

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    setup(mason)
  }

  constructor(context: Context, mason: Mason, type: TextType) : this(context, null, true) {
    this.type = type
    setup(mason)
  }

  init {
    if (!::node.isInitialized && !override) {
      setup(Mason.shared)
    }
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
      textNode.container = this

      // Add to children
      node.children.add(textNode)
      textNode.parent = node

      // Clear layout tree (text nodes don't have nativePtr)
      if (node.nativePtr != 0L) {
        NativeHelpers.nativeNodeRemoveChildren(node.mason.nativePtr, node.nativePtr)
      }

      invalidateInlineSegments()
      node.dirty()
      invalidate()
      requestLayout()
    }

  private fun setup(mason: Mason) {
    TextViewCompat.setAutoSizeTextTypeWithDefaults(this, TextViewCompat.AUTO_SIZE_TEXT_TYPE_NONE)
    node = mason.createTextNode(this)
      .apply {
        view = this@TextView
      }

    val scale = context.resources.displayMetrics.density
    val margin = { top: Float, bottom: Float ->
      Rect<LengthPercentageAuto>(
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(top * scale),
        LengthPercentageAuto.Points(bottom * scale)
      )
    }

    if (type != TextType.None) {
      node.style.inBatch = true

      when (type) {
        TextType.Span -> {
          font = FontFace("sans-serif")
          style.display = Display.Inline
        }

        TextType.Code -> {
          font = FontFace("monospace")
          style.display = Display.Inline
          setBackgroundColor(0xFFEFEFEF.toInt())
        }

        TextType.H1 -> {
          font = FontFace("sans-serif")
          font.weight = FontFace.NSCFontWeight.Bold
          fontSize = 32
          paint.textSize = 32 * scale
          node.style.margin = margin(16f, 16f)
        }

        TextType.H2 -> {
          font = FontFace("sans-serif")
          font.weight = FontFace.NSCFontWeight.Bold
          fontSize = 24
          paint.textSize = 24 * scale
          node.style.margin = margin(14f, 14f)
        }

        TextType.H3 -> {
          font = FontFace("sans-serif")
          font.weight = FontFace.NSCFontWeight.Bold
          fontSize = 18
          paint.textSize = 18 * scale
          node.style.margin = margin(12f, 12f)
        }

        TextType.H4 -> {
          font = FontFace("sans-serif")
          font.weight = FontFace.NSCFontWeight.Bold
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
          node.style.margin = margin(10f, 10f)
        }

        TextType.H5 -> {
          font = FontFace("sans-serif")
          font.weight = FontFace.NSCFontWeight.Bold
          fontSize = 13
          paint.textSize = 13 * scale
          node.style.margin = margin(8f, 8f)
        }

        TextType.H6 -> {
          font = FontFace("sans-serif")
          font.weight = FontFace.NSCFontWeight.Bold
          fontSize = 10
          paint.textSize = 10 * scale
          node.style.margin = margin(6f, 6f)
        }

        TextType.Li -> {
          font = FontFace("sans-serif")
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
        }

        TextType.Blockquote -> {
          font = FontFace("sans-serif")
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
        }

        TextType.B, TextType.Strong -> {
          font = FontFace("sans-serif")
          font.weight = FontFace.NSCFontWeight.Bold
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
          style.display = Display.Inline
        }

        TextType.Pre -> {
          font = FontFace("monospace")
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
          whiteSpace = Styles.WhiteSpace.Pre
        }

        TextType.I, TextType.Em -> {
          font.style = FontFace.NSCFontStyle.Italic
        }

        else -> {
          font = FontFace("sans-serif")
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
        }
      }

      font.loadSync(context) {}

      node.style.inBatch = false

    } else {
      font = FontFace("sans-serif")
      paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
      font.loadSync(context) {}
    }

//    setSpannableFactory(object : Spannable.Factory() {
//      override fun newSpannable(source: CharSequence): Spannable {
//        if (source is String) {
//          return SpannableString(source)
//        }
//        return source as Spannable
//      }
//    })
  }

  val textValues: ByteBuffer by lazy {
    ByteBuffer.allocateDirect(52).apply {
      order(ByteOrder.nativeOrder())
      putInt(TextStyleKeys.COLOR, Color.BLACK)
      putInt(TextStyleKeys.DECORATION_COLOR, Constants.UNSET_COLOR.toInt())
      putInt(TextStyleKeys.TEXT_ALIGN, AlignContent.Start.value)
      putInt(TextStyleKeys.TEXT_JUSTIFY, TextJustify.None.value)
      putInt(TextStyleKeys.SIZE, Constants.DEFAULT_FONT_SIZE)
    }
  }

  val values: ByteBuffer
    get() {
      return style.values
    }

  fun syncStyle(state: String, textState: String) {
    val stateValue = state.toLongOrNull() ?: return
    val textStateValue = textState.toLongOrNull() ?: return
    var invalidate = false
    if (textStateValue != -1L) {
      val value = TextStateKeys(textStateValue)
      if (value.hasFlag(TextStateKeys.TRANSFORM) || value.hasFlag(TextStateKeys.TEXT_WRAP) || value.hasFlag(
          TextStateKeys.WHITE_SPACE
        ) || value.hasFlag(
          TextStateKeys.TEXT_OVERFLOW
        ) || value.hasFlag(TextStateKeys.COLOR) || value.hasFlag(TextStateKeys.BACKGROUND_COLOR) || value.hasFlag(
          TextStateKeys.DECORATION_COLOR
        ) || value.hasFlag(TextStateKeys.DECORATION_LINE)
      ) {
        invalidate = true
      }
    }

    if (stateValue != -1L) {
      style.isDirty = stateValue
      style.updateNativeStyle()
    }

    if (invalidate) {
      invalidateInlineSegments()
      invalidateLayout()
    }
  }

  var includePadding = true

  var textAlign: TextAlign
    get() {
      return style.textAlign
    }
    set(value) {
      style.textAlign = value
    }

  var textJustify: TextJustify
    get() {
      return TextJustify.fromInt(textValues.getInt(TextStyleKeys.TEXT_JUSTIFY))
    }
    set(value) {
      textValues.putInt(TextStyleKeys.TEXT_JUSTIFY, value.value)
    }

  var color: Int
    get() = textValues.getInt(TextStyleKeys.COLOR)
    set(value) {
      textValues.putInt(TextStyleKeys.COLOR, value)
      paint.color = value
      updateStyleOnTextNodes()
      invalidateInlineSegments()
    }

  var fontSize: Int
    get() {
      return textValues.getInt(TextStyleKeys.SIZE)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.SIZE, value)
      if (value == 0) {
        paint.textSize = 0f
      } else {
        paint.textSize = value * resources.displayMetrics.density
      }
      updateStyleOnTextNodes()
      invalidateInlineSegments()
      invalidateLayout()
    }

  // Update attributes on all direct TextNode children when styles change
  private fun updateStyleOnTextNodes() {
    val defaultAttrs = getDefaultAttributes()

    for (child in node.children) {
      if (child is TextNode && child.container === this) {
        // Only update TextNodes that belong to THIS TextView
        // Don't touch TextNodes that belong to child TextViews
        child.attributes.putAll(defaultAttrs)
      }
    }
  }

  internal fun getDefaultAttributes(): Map<String, Any> {
    val attrs = mutableMapOf<String, Any>()

    if (color != 0) {
      attrs["color"] = color
    }

    if (fontSize > 0) {
      attrs["fontSize"] = fontSize
    }

    font.font?.let {
      attrs["typeface"] = it
    }

    if (decorationLine != Styles.DecorationLine.None) {
      attrs["decorationLine"] = decorationLine
    }

    if (decorationColor != 0) {
      attrs["decorationColor"] = decorationColor
    }

    if (letterSpacing != 0f) {
      attrs["letterSpacing"] = letterSpacing
    }

    if (backgroundColorValue != 0) {
      attrs["backgroundColor"] = backgroundColorValue
    }

    return attrs
  }

  var fontStyle: FontFace.NSCFontStyle
    set(value) {
      font.style = value
    }
    get() {
      return font.style
    }

  var textWrap: TextWrap = TextWrap.Wrap
    set(value) {
      field = value
      textValues.putInt(TextStyleKeys.TEXT_WRAP, value.ordinal)
      invalidateInlineSegments()
    }

  var whiteSpace: Styles.WhiteSpace = Styles.WhiteSpace.Normal
    set(value) {
      field = value
      textValues.putInt(TextStyleKeys.WHITE_SPACE, value.ordinal)
      invalidateInlineSegments()
    }

  var textTransform: Styles.TextTransform = Styles.TextTransform.None
    set(value) {
      field = value
      textValues.putInt(TextStyleKeys.TRANSFORM, value.ordinal)
      invalidateInlineSegments()
    }


  var backgroundColorValue: Int
    get() {
      return textValues.getInt(TextStyleKeys.BACKGROUND_COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.BACKGROUND_COLOR, value)

      val parent = node.parent
      if (parent?.view is TextView) {
        (parent.view as TextView).invalidateInlineSegments()
      }

      updateStyleOnTextNodes()
      invalidateInlineSegments()
    }

  var decorationLine: Styles.DecorationLine = Styles.DecorationLine.None
    set(value) {
      field = value
      textValues.putInt(TextStyleKeys.DECORATION_LINE, value.ordinal)
      updateStyleOnTextNodes()
    }

  var decorationColor: Int = 0
    set(value) {
      field = value
      textValues.putInt(TextStyleKeys.DECORATION_COLOR, value)
      updateStyleOnTextNodes()
    }

  var decorationStyle: Styles.DecorationStyle = Styles.DecorationStyle.Solid
    set(value) {
      field = value
      textValues.putInt(TextStyleKeys.DECORATION_STYLE, value.value)
      updateStyleOnTextNodes()
    }


  private fun mapMeasureSpec(mode: Int, value: Int): AvailableSpace {
    return when (mode) {
      MeasureSpec.EXACTLY -> AvailableSpace.Definite(value.toFloat())
      MeasureSpec.UNSPECIFIED -> {
        if (value != 0) {
          AvailableSpace.MaxContent
        } else {
          AvailableSpace.MinContent
        }
      }

      MeasureSpec.AT_MOST -> {
        if (value != 0) {
          AvailableSpace.Definite(value.toFloat())
        } else {
          AvailableSpace.MaxContent
        }
      }

      else -> AvailableSpace.MinContent
    }
  }


  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    if (node.parent == null && parent !is Element) {
      compute(
        mapMeasureSpec(specWidthMode, specWidth).value,
        mapMeasureSpec(specHeightMode, specHeight).value
      )

      val layout = layout()
      node.computedLayout = layout
      setMeasuredDimension(
        layout.width.toInt(),
        layout.height.toInt(),
      )
    } else {
      if (specWidthMode == MeasureSpec.EXACTLY && specHeightMode == MeasureSpec.EXACTLY) {
        setMeasuredDimension(
          specWidth, specHeight
        )
      } else {
        val layout = layout()
        setMeasuredDimension(
          layout.width.toInt(), layout.height.toInt()
        )
      }
    }
  }

  private fun measureLayout(
    knownWidth: Float,
    knownHeight: Float,
    availableWidth: Float,
    availableHeight: Float
  ): Layout? {
    val spannable = buildAttributedString()
    if (layoutParams == null) {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.WRAP_CONTENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
      )
    }
    text = spannable

    if (spannable.isEmpty()) {
      return null
    }

    // Determine the width constraint for StaticLayout
    // For inline elements, we want to measure to content, not fill available width
    val isInline = if (node.isStyleInitialized) {
      node.style.display == Display.Inline
    } else {
      node.parent?.view is TextView
    }

    val widthConstraint = when {
      knownWidth.isFinite() && knownWidth > 0 -> {
        knownWidth.toInt()
      }

      isInline || availableWidth.isInfinite() -> {
        // For inline or unconstrained, use a very large value to get natural width
        Int.MAX_VALUE
      }

      availableWidth.isFinite() && availableWidth > 0 -> {
        availableWidth.toInt()
      }

      else -> {
        Int.MAX_VALUE
      }
    }

    val alignment = getLayoutAlignment()  // Use the alignment from textAlign property

    val layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      StaticLayout.Builder.obtain(
        spannable,
        0,
        spannable.length,
        paint,
        widthConstraint
      )
        .setAlignment(alignment)
        .setLineSpacing(0f, 1f)
        .setIncludePad(true)
        .build()
    } else {
      StaticLayout(
        spannable,
        paint,
        widthConstraint,
        alignment,
        1f, // lineSpacingMultiplier
        0f, // lineSpacingExtra
        true // includePad
      )
    }

    // Get the ACTUAL measured width from the layout, not the constraint
    var measuredWidth = 0
    for (i in 0 until layout.lineCount) {
      val lineWidth = layout.getLineWidth(i).toInt()
      if (lineWidth > measuredWidth) {
        measuredWidth = lineWidth
      }
    }

    // Store the actual measured dimensions (not the constraints)
    this.measuredTextWidth = measuredWidth.toFloat()
    this.measuredTextHeight = layout.height.toFloat()

    return layout
  }

  private fun getLayoutAlignment(): Layout.Alignment {
    return when (textAlign) {
      TextAlign.Left, TextAlign.Start -> Layout.Alignment.ALIGN_NORMAL
      TextAlign.Right, TextAlign.End -> Layout.Alignment.ALIGN_OPPOSITE
      TextAlign.Center -> Layout.Alignment.ALIGN_CENTER
      TextAlign.Justify -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Layout.Alignment.ALIGN_NORMAL // Justify handled by justificationMode
        } else {
          Layout.Alignment.ALIGN_NORMAL
        }
      }

      else -> Layout.Alignment.ALIGN_NORMAL
    }
  }

  private var measuredTextWidth: Float = 0f
  private var measuredTextHeight: Float = 0f

  override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float> {

    val layout = measureLayout(
      knownDimensions.width ?: Float.NaN,
      knownDimensions.height ?: Float.NaN,
      availableSpace.width ?: Float.NaN,
      availableSpace.height ?: Float.NaN
    )

    // Use the actual measured dimensions from the layout
    val width = if (layout != null) {
      measuredTextWidth + paddingLeft + paddingRight
    } else {
      (paddingLeft + paddingRight).toFloat()
    }

    val height = if (layout != null) {
      measuredTextHeight + paddingTop + paddingBottom
    } else {
      (paddingTop + paddingBottom).toFloat()
    }

    return Size(width, height)
  }

  private fun collectAndCacheSegments(layout: Layout, attributed: SpannableStringBuilder) {
    if (!segmentsNeedRebuild) return

    val segments = mutableListOf<InlineSegment>()

    // Use a TextPaint matching the current TextView properties for consistent measurement
    val textPaint = TextPaint(paint).apply {
      textSize =
        this@TextView.fontSize * resources.displayMetrics.density  // fontSize is already in px
      typeface = this@TextView.font.font
    }

    // Walk through the spannable to find text runs and view placeholders
    var currentPos = 0
    while (currentPos < attributed.length) {
      val viewSpans = attributed.getSpans(currentPos, currentPos + 1, ViewSpan::class.java)

      if (viewSpans.isNotEmpty()) {
        // Inline child placeholder
        val viewSpan = viewSpans[0]
        val childLayout = viewSpan.childNode.computedLayout

        segments.add(
          InlineSegment.InlineChild(
            viewSpan.childNode.nativePtr,
            childLayout.height  // Already in px
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
          val width = Layout.getDesiredWidth(textRun, 0, textRun.length, textPaint)

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
              width,  // Already in px
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
        node.mason.nativePtr,
        node.nativePtr,
        segments.toTypedArray()
      )
    }

    segmentsNeedRebuild = false
  }

  private fun findNextViewSpan(text: SpannableStringBuilder, start: Int): Int {
    val spans = text.getSpans(start, text.length, ViewSpan::class.java)
    return if (spans.isNotEmpty()) {
      text.getSpanStart(spans[0])
    } else {
      -1
    }
  }

  private var segmentsNeedRebuild = true

  internal fun invalidateInlineSegments() {
    segmentsNeedRebuild = true
    node.dirty()

    // If this TextView is a child of another TextView, invalidate parent too
    // This handles the case where a flattened child's styles change
    val parent = node.parent
    if (parent?.view is TextView) {
      (parent.view as TextView).invalidateInlineSegments()
    }
  }

  internal fun attachTextNode(node: TextNode, index: Int = -1) {
    node.container = this
    invalidateInlineSegments()
  }

  internal fun detachTextNode(node: TextNode) {
    if (node.container === this) {
      node.container = null
      invalidateInlineSegments()
    }
  }

  internal fun onCharacterDataChanged(node: TextNode) {
    if (node.container === this) {
      invalidateInlineSegments()
    }
  }

  private fun processTextNode(node: TextNode): CharSequence {
    return node.data
  }

  // When building attributed string, walk tree and apply current styles
  private fun buildAttributedString(): SpannableStringBuilder {
    val composed = SpannableStringBuilder()

    for (child in node.children) {
      when {
        child is TextNode -> {
          composed.append(child.attributed())
        }

        child.view is TextView -> {
          val childTextView = child.view as TextView

          if (shouldFlattenTextContainer(childTextView)) {
            val nested = childTextView.buildAttributedString()

            val start = composed.length
            composed.append(nested)
            val end = composed.length

            applyTextViewStylesToSpan(composed, start, end, childTextView)
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

    return composed
  }

  private fun applyTextViewStylesToSpan(
    spannable: SpannableStringBuilder,
    start: Int,
    end: Int,
    textView: TextView
  ) {
    if (start >= end) return

    val flags = Spannable.SPAN_EXCLUSIVE_EXCLUSIVE

    // Apply color
    if (textView.color != 0) {
      spannable.setSpan(
        ForegroundColorSpan(textView.color),
        start,
        end,
        flags
      )
    }

    // Apply font size
    if (textView.paint.textSize > 0) {
      spannable.setSpan(
        AbsoluteSizeSpan(textView.fontSize, true),
        start,
        end,
        flags
      )
    }

    // Apply typeface
    textView.font.font?.let { typeface ->
      spannable.setSpan(
        Spans.TypefaceSpan(typeface),
        start,
        end,
        flags
      )
    }

    // Apply text decoration
    if (textView.decorationLine != Styles.DecorationLine.None) {
      when (textView.decorationLine) {
        Styles.DecorationLine.Underline -> {
          spannable.setSpan(UnderlineSpan(), start, end, flags)
        }

        Styles.DecorationLine.LineThrough -> {
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        else -> {}
      }
    }

    // Apply letter spacing
    if (textView.letterSpacing != 0f) {
      spannable.setSpan(
        android.text.style.ScaleXSpan(1f + textView.letterSpacing),
        start,
        end,
        flags
      )
    }
  }

  internal fun shouldFlattenTextContainer(textView: TextView): Boolean {

    // Always flatten if style is not initialized (pure text container)
    if (!node.isStyleInitialized) {
      return true
    }

    val style = textView.node.style

    // Check for view-like properties that prevent flattening
    val hasBackground = textView.backgroundColorValue != 0
    val hasBorder = style.border.top.value > 0f || style.border.right.value > 0f ||
      style.border.bottom.value > 0f || style.border.left.value > 0f
    val hasPadding = style.padding.top.value > 0f || style.padding.right.value > 0f ||
      style.padding.bottom.value > 0f || style.padding.left.value > 0f
    val hasMargin = style.margin.top.value > 0f || style.margin.right.value > 0f ||
      style.margin.bottom.value > 0f || style.margin.left.value > 0f
    val hasExplicitSize = style.size.width != Dimension.Auto || style.size.height != Dimension.Auto
    val hasDisplayBlock = style.display == Display.Block || style.display == Display.Flex ||
      style.display == Display.Grid

    val shouldFlatten =
      !(hasBackground || hasBorder || hasPadding || hasMargin || hasExplicitSize || hasDisplayBlock)

    return shouldFlatten
  }

  // Append multiple items (strings or nodes)
  fun append(vararg items: Any) {
    for (item in items) {
      when (item) {
        is String -> {
          val textNode = TextNode(node.mason).apply {
            data = item
            container = this@TextView
          }
          node.appendChild(textNode)
        }

        is TextView -> {
          node.appendChild(item.node)
        }

        is Element -> {
          node.appendChild(item.node)
        }

        is Node -> {
          node.appendChild(item)
        }

        else -> {
          // Convert to string and append as text
          val textNode = TextNode(node.mason).apply {
            data = item.toString()
            container = this@TextView
          }
          node.appendChild(textNode)
        }
      }
    }
  }

  /*

  override fun onDraw(canvas: Canvas) {
//    val textSpannable = text as? Spannable
//    if (textSpannable != null) {
//      val viewSpans = textSpannable.getSpans(0, textSpannable.length, ViewSpan::class.java)
//      for ((index, span) in viewSpans.withIndex()) {
//        val start = textSpannable.getSpanStart(span)
//        val end = textSpannable.getSpanEnd(span)
//      }
//    }

    // Let TextView handle the spannable drawing (which calls ViewSpan.draw())
    super.onDraw(canvas)

//    Log.d("TextView", "onDraw complete")
  }

  */

  // Custom span for inline child views
  private inner class ViewSpan(
    val childNode: Node,
    private val viewHelper: ViewHelper
  ) : ReplacementSpan() {
    private var cachedWidth: Int = 0
    private var cachedHeight: Int = 0
    private var cachedFontMetrics: Paint.FontMetricsInt? = null

    override fun getSize(
      paint: Paint,
      text: CharSequence?,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
    ): Int {
      // Special handling for inline TextView (non-flattened)
      if (childNode.view is TextView) {
        val childTextView = childNode.view as TextView

        // Use Taffy's computed layout instead of measuring
        // This avoids triggering Android's layout system
        val layout = childNode.computedLayout

        if (layout.width > 0 && layout.height > 0) {
          cachedWidth = layout.width.toInt()
          cachedHeight = layout.height.toInt()

          // Get font metrics from the child's paint
          val childPaint = childTextView.paint
          val childFontMetrics = childPaint.fontMetricsInt

          cachedFontMetrics = Paint.FontMetricsInt().apply {
            ascent = childFontMetrics.ascent
            descent = childFontMetrics.descent
            top = childFontMetrics.top
            bottom = childFontMetrics.bottom
          }

          fm?.let {
            val baseline = -childFontMetrics.ascent + childTextView.paddingTop
            it.ascent = -baseline
            it.descent = cachedHeight - baseline
            it.top = it.ascent
            it.bottom = it.descent
          }

          return cachedWidth
        }
      }

      // For other view types, use layout dimensions
      val layout = childNode.computedLayout
      val width = layout.width.toInt()
      val height = layout.height.toInt()

      cachedWidth = width
      cachedHeight = height

      fm?.let {
        it.ascent = -height
        it.descent = 0
        it.top = it.ascent
        it.bottom = 0
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

      if (childNode.view is TextView) {
        val childTextView = childNode.view as TextView
        // Ensure child is measured and laid out at the correct size
        if (cachedWidth > 0 && cachedHeight > 0) {
          childTextView.measure(
            MeasureSpec.makeMeasureSpec(cachedWidth, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(cachedHeight, MeasureSpec.EXACTLY)
          )
          childTextView.layout(0, 0, cachedWidth, cachedHeight)
        }

        // Draw background if present
        if (childTextView.backgroundColorValue != 0) {
          val bgPaint = Paint().apply {
            color = childTextView.backgroundColorValue
          }
          canvas.drawRect(
            x,
            top.toFloat(),
            x + cachedWidth,
            bottom.toFloat(),
            bgPaint
          )
        }

        // Calculate proper y position for baseline alignment
        val drawY = if (cachedFontMetrics != null) {
          y + cachedFontMetrics!!.ascent - childTextView.paddingTop
        } else {
          top
        }

        canvas.save()
        canvas.translate(x, drawY.toFloat())
        childTextView.draw(canvas)
        canvas.restore()
      } else {
        // For other views, use bitmap approach
        if (cachedWidth > 0 && cachedHeight > 0) {
          viewHelper.updateBitmap(false)
          viewHelper.bitmap?.let {
            canvas.drawBitmap(it, x, top.toFloat(), paint)
          }
        }
      }
    }
  }

  // Helper to capture view as bitmap for rendering
  private inner class ViewHelper(val view: View, val node: Node) {
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

  private fun createPlaceholder(child: Node): SpannableStringBuilder {
    val childView = child.view as? View ?: return SpannableStringBuilder("")

    val helper = ViewHelper(childView, child)
    val placeholder = SpannableStringBuilder(Constants.VIEW_PLACEHOLDER)

    val viewSpan = ViewSpan(child, helper)
    placeholder.setSpan(viewSpan, 0, placeholder.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)

    return placeholder
  }
}
