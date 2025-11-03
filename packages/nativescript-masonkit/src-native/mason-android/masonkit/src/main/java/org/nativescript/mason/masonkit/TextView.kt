package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
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
import androidx.core.graphics.withTranslation
import androidx.core.widget.TextViewCompat
import org.nativescript.mason.masonkit.Styles.TextJustify
import org.nativescript.mason.masonkit.Styles.TextWrap
import java.nio.ByteBuffer
import kotlin.math.ceil

class TextView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : androidx.appcompat.widget.AppCompatTextView(context, attrs), Element, MeasureFunc,
  StyleChangeListener {

  override val view: View
    get() = this

  override val style: Style
    get() = node.style

  internal val fontFace: FontFace
    get() {
      return style.font
    }

  var type: TextType = TextType.None
    private set

  override lateinit var node: Node
    private set

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    setup(mason)
  }

  constructor(context: Context, mason: Mason, type: TextType, isAnonymous: Boolean = false) : this(
    context, null, true
  ) {
    this.type = type
    setup(mason, isAnonymous)
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

  private fun setup(mason: Mason, isAnonymous: Boolean = false) {
    TextViewCompat.setAutoSizeTextTypeWithDefaults(this, TextViewCompat.AUTO_SIZE_TEXT_TYPE_NONE)
    node = mason.createTextNode(this, isAnonymous).apply {
      view = this@TextView
      this.isAnonymous = isAnonymous
    }
    val scale = context.resources.displayMetrics.density
    val margin = { top: Float, bottom: Float ->
      Rect<LengthPercentageAuto>(
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(top),
        LengthPercentageAuto.Points(bottom)
      )
    }

    if (type != TextType.None) {
      node.style.inBatch = true

      when (type) {
        TextType.Span -> {
          style.font = FontFace("sans-serif")
          style.display = Display.Inline
        }

        TextType.Code -> {
          style.font = FontFace("monospace")
          style.display = Display.Inline
          setBackgroundColor(0xFFEFEFEF.toInt())
        }

        TextType.H1 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 32
          paint.textSize = 32 * scale
          node.style.margin = margin(16f, 16f)
        }

        TextType.H2 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 24
          paint.textSize = 24 * scale
          node.style.margin = margin(14f, 14f)
        }

        TextType.H3 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 18
          paint.textSize = 18 * scale
          node.style.margin = margin(12f, 12f)
        }

        TextType.H4 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
          node.style.margin = margin(10f, 10f)
        }

        TextType.H5 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 13
          paint.textSize = 13 * scale
          node.style.margin = margin(8f, 8f)
        }

        TextType.H6 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 10
          paint.textSize = 10 * scale
          node.style.margin = margin(6f, 6f)
        }

        TextType.Li -> {
          style.font = FontFace("sans-serif")
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
        }

        TextType.Blockquote -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
        }

        TextType.B, TextType.Strong -> {
          style.font = FontFace("sans-serif")
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
          style.display = Display.Inline
        }

        TextType.Pre -> {
          style.font = FontFace("monospace")
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
          whiteSpace = Styles.WhiteSpace.Pre
        }

        TextType.I, TextType.Em -> {
          fontFace.style = FontFace.NSCFontStyle.Italic
        }

        TextType.P -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontSize = Constants.DEFAULT_FONT_SIZE
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
          node.style.margin = margin(16f, 16f)
        }

        else -> {
          style.font = FontFace("sans-serif")
          paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
        }
      }

      fontFace.loadSync(context) {}

      node.style.inBatch = false

    } else {
      style.font = FontFace("sans-serif")
      paint.textSize = Constants.DEFAULT_FONT_SIZE * scale
      fontFace.loadSync(context) {}
    }

    node.style.setStyleChangeListener(this)

//    setSpannableFactory(object : Spannable.Factory() {
//      override fun newSpannable(source: CharSequence): Spannable {
//        if (source is String) {
//          return SpannableString(source)
//        }
//        return source as Spannable
//      }
//    })
  }

  override fun onTextStyleChanged(change: TextStyleChange) {
    when (change) {
      TextStyleChange.COLOR -> {
        paint.color = color
        updateStyleOnTextNodes()
        invalidateInlineSegments()
      }

      TextStyleChange.FONT_SIZE -> {
        val fontSize = this.fontSize
        if (fontSize == 0) {
          paint.textSize = 0f
        } else {
          paint.textSize = fontSize * resources.displayMetrics.density
        }
        updateStyleOnTextNodes()
        invalidateInlineSegments()
        invalidateLayout()
      }

      TextStyleChange.FONT_WEIGHT -> {
        updateStyleOnTextNodes()
      }

      TextStyleChange.FONT_STYLE -> {
        updateStyleOnTextNodes()
      }

      TextStyleChange.TEXT_WRAP -> {
        invalidateInlineSegments()
      }

      TextStyleChange.WHITE_SPACE -> {
        invalidateInlineSegments()
      }

      TextStyleChange.TEXT_TRANSFORM -> {
        invalidateInlineSegments()
      }

      TextStyleChange.BACKGROUND_COLOR -> {
        val parent = node.parent
        if (parent?.view is TextView) {
          (parent.view as TextView).invalidateInlineSegments()
        }

        updateStyleOnTextNodes()
        invalidateInlineSegments()
      }

      TextStyleChange.DECORATION_LINE -> {
        updateStyleOnTextNodes()
      }

      TextStyleChange.DECORATION_COLOR -> {
        updateStyleOnTextNodes()
      }

      TextStyleChange.DECORATION_STYLE -> {
        updateStyleOnTextNodes()
      }

      TextStyleChange.LETTER_SPACING -> {
        updateStyleOnTextNodes()
      }

      TextStyleChange.TEXT_JUSTIFY -> {
        updateStyleOnTextNodes()
      }
    }
  }

  val textValues: ByteBuffer
    get() {
      return style.textValues
    }

  val values: ByteBuffer
    get() {
      return style.values
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
      return style.textJustify
    }
    set(value) {
      style.textJustify = value
    }

  var color: Int
    get() = style.color
    set(value) {
      style.color = value
    }

  var font: String
    get() {
      return ""
    }
    set(value) {

    }

  var fontFamily: String
    get() {
      return style.fontFamily
    }
    set(value) {
      style.fontFamily = value
    }

  var fontVariant: String
    get() {
      return style.fontVariant
    }
    set(value) {
      style.fontVariant = value
    }


  var fontStretch: String
    get() {
      return style.fontStretch
    }
    set(value) {
      style.fontStretch = value
    }


  var fontSize: Int
    get() {
      return style.fontSize
    }
    set(value) {
      style.fontSize = value
    }

  var fontWeight: FontFace.NSCFontWeight
    get() {
      return style.fontWeight
    }
    set(value) {
      style.fontWeight = value
    }

  var fontStyle: FontFace.NSCFontStyle
    set(value) {
      style.fontStyle = value
    }
    get() {
      return style.fontStyle
    }

  var textWrap: TextWrap
    get() {
      return style.textWrap
    }
    set(value) {
      style.textWrap = value
    }

  var letterSpacingValue: Float
    get() {
      return style.letterSpacing
    }
    set(value) {
      style.letterSpacing = value
    }

  var whiteSpace: Styles.WhiteSpace
    get() {
      return style.whiteSpace
    }
    set(value) {
      style.whiteSpace = value
    }

  var textTransform: Styles.TextTransform
    get() {
      return style.textTransform
    }
    set(value) {
      style.textTransform = value
    }

  var backgroundColorValue: Int
    get() {
      return style.backgroundColor
    }
    set(value) {
      style.backgroundColor = value
    }

  var decorationLine: Styles.DecorationLine
    get() {
      return style.decorationLine
    }
    set(value) {
      style.decorationLine = value
    }

  var decorationColor: Int
    get() {
      return style.decorationColor
    }
    set(value) {
      style.decorationColor = value
    }

  var decorationStyle: Styles.DecorationStyle
    get() {
      return style.decorationStyle
    }
    set(value) {
      style.decorationStyle = value
    }


  // Update attributes on all direct TextNode children when styles change
  internal fun updateStyleOnTextNodes() {
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

    val color = style.resolvedColor

    if (color != 0) {
      attrs["color"] = color
    }

    val fontSize = style.resolvedFontSize

    if (fontSize > 0) {
      attrs["fontSize"] = fontSize
    }

    // todo
    fontFace.font?.let {
      attrs["typeface"] = it
    }

    val decorationLine = style.resolvedDecorationLine
    if (decorationLine != Styles.DecorationLine.None) {
      attrs["decorationLine"] = decorationLine
    }

    val decorationColor = style.resolvedDecorationColor
    if (decorationColor != 0) {
      attrs["decorationColor"] = decorationColor
    }

    val letterSpacing = style.resolvedLetterSpacing
    if (letterSpacing != 0f) {
      attrs["letterSpacing"] = letterSpacing
    }

    val backgroundColorValue = style.backgroundColor
    if (backgroundColorValue != 0) {
      attrs["backgroundColor"] = backgroundColorValue
    }

    return attrs
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
    knownWidth: Float, knownHeight: Float, availableWidth: Float, availableHeight: Float
  ): Layout? {
    val spannable = buildAttributedString()
    if (layoutParams == null) {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
      )
    }
    text = spannable

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

    if (textWrap != TextWrap.NoWrap && availableWidth > 0 && availableWidth != Float.MIN_VALUE) {
      widthConstraint = availableWidth.toInt()
    }

    if (isInline) {
      widthConstraint = Int.MAX_VALUE
    }

    val alignment = getLayoutAlignment()  // Use the alignment from textAlign property

    val layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      StaticLayout.Builder.obtain(
        spannable, 0, spannable.length, paint, widthConstraint
      ).setAlignment(alignment).setLineSpacing(0f, 1f).setIncludePad(true).build()
    } else {
      StaticLayout(
        spannable, paint, widthConstraint, alignment, 1f, // lineSpacingMultiplier
        0f, // lineSpacingExtra
        true // includePad
      )
    }

    // Get the ACTUAL measured width from the layout, not the constraint
    var measuredWidth = 0
    for (i in 0 until layout.lineCount) {
      val lineWidth = ceil(layout.getLineWidth(i)).toInt()
      if (lineWidth > measuredWidth) {
        measuredWidth = lineWidth
      }
    }

    // Store the actual measured dimensions (not the constraints)
    this.measuredTextWidth = measuredWidth.toFloat()
    this.measuredTextHeight = layout.height.toFloat()

    // CRITICAL: Collect and send segments to Rust
    collectAndCacheSegments(layout, spannable)

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
      measuredTextWidth
    } else {
      0f
    }

    val height = if (layout != null) {
      measuredTextHeight
    } else {
      0f
    }

    return Size(width, height)
  }

  private fun collectAndCacheSegments(layout: Layout, attributed: SpannableStringBuilder) {

    val segments = mutableListOf<InlineSegment>()

    // Use a TextPaint matching the current TextView properties for consistent measurement
    val textPaint = TextPaint(paint).apply {
      textSize =
        this@TextView.fontSize * resources.displayMetrics.density  // fontSize is already in px
      typeface = this@TextView.fontFace.font
    }

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

  // monotonically increasing version for invalidation; cachedAttributedString is valid when
  // attributedStringVersion == segmentsInvalidateVersion
  private var attributedStringVersion: Int = 0
  private var segmentsInvalidateVersion: Int = 0
  internal var cachedAttributedString: SpannableStringBuilder? = null
  private var isBuilding = false

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

    if (parent?.view is TextView) {
      (parent.view as TextView).invalidateInlineSegments()
    }

    invalidate()
    requestLayout()

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

    isBuilding = false

    // Cache the result
    cachedAttributedString = composed
    // mark cached string as up-to-date with the current invalidate version
    attributedStringVersion = segmentsInvalidateVersion

    return composed
  }

  private fun applyTextViewStylesToSpan(
    spannable: SpannableStringBuilder, start: Int, end: Int, textView: TextView
  ) {
    if (start >= end) return

    val flags = Spannable.SPAN_EXCLUSIVE_EXCLUSIVE

    val color = textView.style.resolvedColor
    // Apply color
    if (color != 0) {
      spannable.setSpan(
        ForegroundColorSpan(color), start, end, flags
      )
    }

    // Apply font size
    if (textView.paint.textSize > 0) {
      spannable.setSpan(
        AbsoluteSizeSpan(textView.fontSize, true), start, end, flags
      )
    }

    // Apply typeface
    textView.fontFace.font?.let { typeface ->
      spannable.setSpan(
        Spans.TypefaceSpan(typeface), start, end, flags
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
    if (textView.letterSpacingValue != 0f) {
      spannable.setSpan(
        android.text.style.ScaleXSpan(1f + textView.letterSpacingValue), start, end, flags
      )
    }
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

  override fun addChildAt(text: String, index: Int) {
    node.addChildAt(TextNode(node.mason, text).apply {
      container = this@TextView
      attributes.clear()
      attributes.putAll(getDefaultAttributes())
    }, index)
  }

  // Custom span for inline child views
  private inner class ViewSpan(
    val childNode: Node, private val viewHelper: ViewHelper
  ) : ReplacementSpan() {

    private var cachedFontMetrics: Paint.FontMetricsInt? = null
    private var cachedBaseline: Int = 0

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

      val childView = childNode.view as? View

      // Prefer the view baseline (most accurate). Fallback to paint metrics + padding.
      val childBaselineFromTop: Int = when (childView) {
        is android.widget.TextView -> {
          val b = childView.baseline
          if (b >= 0) {
            b
          } else {
            val childPaintFm = childView.paint.fontMetricsInt
            childView.paddingTop + (-childPaintFm.ascent)
          }
        }

        else -> {
          val b = childView?.baseline ?: -1
          if (b >= 0) b else height
        }
      }

      // Parent font metrics (paint represents parent)
      val parentFm = paint.fontMetricsInt

      // Expand ascent/descent to include child but keep the parent's baseline location (y) unchanged
      val ascent = kotlin.math.min(parentFm.ascent, -childBaselineFromTop) // ascent negative
      val descent = kotlin.math.max(parentFm.descent, height - childBaselineFromTop)

      fm?.let {
        it.ascent = ascent
        it.descent = descent
        it.top = kotlin.math.min(parentFm.top, ascent)
        it.bottom = kotlin.math.max(parentFm.bottom, descent)
      }

      // Cache baseline and child height for draw
      cachedBaseline = childBaselineFromTop

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

      val parentPaddingLeft = childNode.computedLayout.padding.left
      val drawX = x + parentPaddingLeft

      // position top so child baseline (top + cachedBaseline) == y
      val drawTop = y - cachedBaseline

      canvas.withTranslation(drawX, drawTop.toFloat()) {
        childView.draw(this)
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

  internal fun shouldFlattenTextContainer(textView: TextView): Boolean {
    if (!textView.style.isValueInitialized) return true
    val style = textView.node.style
    val hasBackground = textView.backgroundColorValue != 0 || textView.background != null
    val border = style.border
    val hasBorder =
      border.top.value > 0f || border.right.value > 0f || border.bottom.value > 0f || border.left.value > 0f

    val padding = style.padding
    val hasPadding =
      padding.top.value > 0f || padding.right.value > 0f || padding.bottom.value > 0f || padding.left.value > 0f

    val size = style.size
    val hasExplicitSize = size.width != Dimension.Auto || size.height != Dimension.Auto

    // If it has any view properties, treat as inline-block
    return !(hasBackground || hasBorder || hasPadding || hasExplicitSize)
  }
}
