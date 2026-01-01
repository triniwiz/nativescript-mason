package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.os.Build
import android.util.AttributeSet
import android.util.TypedValue
import android.view.View
import androidx.core.widget.TextViewCompat
import org.nativescript.mason.masonkit.Styles.TextJustify
import org.nativescript.mason.masonkit.Styles.TextWrap
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType
import java.nio.ByteBuffer

val white_space = "\\s+".toRegex()

@SuppressLint("AppCompatCustomView")
class TextView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : android.widget.TextView(context, attrs), Element, MeasureFunc,
  TextContainer {

  override val view: View
    get() = this

  override val style: Style
    get() = node.style

  internal val fontFace: FontFace
    get() {
      return style.font
    }

  override val engine: TextEngine by lazy {
    TextEngine(this)
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


  override fun setTextSize(size: Float) {
    node.style.fontSize = size.toInt()
  }


  override fun setTextSize(unit: Int, size: Float) {
    if (unit == TypedValue.COMPLEX_UNIT_SP) {
      node.style.fontSize = size.toInt()
      return
    }

    val metrics = resources.displayMetrics
    val px = TypedValue.applyDimension(
      unit, size, metrics
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      node.style.fontSize = TypedValue.deriveDimension(
        TypedValue.COMPLEX_UNIT_SP, px, metrics
      ).toInt()
    } else {
      node.style.fontSize = (px / metrics.density).toInt()
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach { it.shader = null } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
  }

  override fun onDraw(canvas: Canvas) {
    ViewUtils.onDraw(this, canvas, style) {
      super.onDraw(it)
    }
  }

  var textContent: String
    get() {
      return engine.textContent
    }
    set(value) {
      engine.textContent = value
    }

  private fun setup(mason: Mason, isAnonymous: Boolean = false) {
    TextViewCompat.setAutoSizeTextTypeWithDefaults(this, TextViewCompat.AUTO_SIZE_TEXT_TYPE_NONE)
    node = mason.createTextNode(this, isAnonymous).apply {
      view = this@TextView
      this.isAnonymous = isAnonymous
    }
    val margin = { top: Float, bottom: Float ->
      Rect<LengthPercentageAuto>(
        top = LengthPercentageAuto.Points(top),
        right = LengthPercentageAuto.Points(0f),
        bottom = LengthPercentageAuto.Points(bottom),
        left = LengthPercentageAuto.Points(0f),
      )
    }

    gravity = android.view.Gravity.NO_GRAVITY
    setLineSpacing(0f, 1f)
    setPadding(0, 0, 0, 0)

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
          //  setBackgroundColor(0xFFEFEFEF.toInt())
        }

        TextType.H1 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 32
          node.style.margin = margin(16f, 16f)
        }

        TextType.H2 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 24
          node.style.margin = margin(14f, 14f)
        }

        TextType.H3 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 18
          node.style.margin = margin(12f, 12f)
        }

        TextType.H4 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = Constants.DEFAULT_FONT_SIZE
          node.style.margin = margin(10f, 10f)
        }

        TextType.H5 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 13
          node.style.margin = margin(8f, 8f)
        }

        TextType.H6 -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          fontFace.weight = FontFace.NSCFontWeight.Bold
          fontSize = 10
          node.style.margin = margin(6f, 6f)
        }

        TextType.Li -> {
          style.font = FontFace("sans-serif")
        }

        TextType.Blockquote -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
        }

        TextType.B, TextType.Strong -> {
          style.font = FontFace("sans-serif")
          fontFace.weight = FontFace.NSCFontWeight.Bold
          style.display = Display.Inline
        }

        TextType.Pre -> {
          style.font = FontFace("monospace")
          fontSize = Constants.DEFAULT_FONT_SIZE
          whiteSpace = Styles.WhiteSpace.Pre
        }

        TextType.I, TextType.Em -> {
          fontFace.style = FontFace.NSCFontStyle.Italic
        }

        TextType.P -> {
          style.font = FontFace("sans-serif")
          node.style.display = Display.Block
          node.style.margin = margin(16f, 16f)
        }

        else -> {}
      }

      fontFace.loadSync(context) {}

      node.style.inBatch = false

    } else {
      fontFace.loadSync(context) {}
    }

    paint.textSize = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP,
      fontSize.toFloat(),
      resources.displayMetrics
    )

    node.style.setStyleChangeListener(this)
  }

  override fun getBaseline(): Int {
    // Return baseline calculated from our font metrics
    if (style.isValueInitialized) {
      val metrics = style.getFontMetrics()
      val layout = node.computedLayout
      // Baseline is ascent distance from top of content box
      val baselineY = layout.padding.top + layout.border.top + metrics.ascent
      return baselineY.toInt()
    }

    // Fallback to TextView's baseline
    return super.getBaseline()
  }

  override fun onTextStyleChanged(change: Int) {
    engine.onTextStyleChanged(change, paint, resources.displayMetrics)
  }

  val textValues: ByteBuffer
    get() {
      return style.textValues
    }

  val values: ByteBuffer
    get() {
      return style.values
    }

  var includePadding: Boolean
    get() {
      return engine.includePadding
    }
    set(value) {
      engine.includePadding = value
    }

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

  override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float> {
    return engine.measure(paint, knownDimensions, availableSpace)
  }

  internal fun attachTextNode(node: TextNode, index: Int = -1) {
    node.container = this
    engine.invalidateInlineSegments()
  }

  internal fun detachTextNode(node: TextNode) {
    if (node.container === this) {
      node.container = null
      engine.invalidateInlineSegments()
    }
  }

  internal fun onCharacterDataChanged(node: TextNode) {
    if (node.container === this) {
      engine.invalidateInlineSegments()
    }
  }

  private fun processTextNode(node: TextNode): CharSequence {
    return node.data
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

        is TextContainer -> {
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
    val child = TextNode(node.mason, text).apply {
      container = this@TextView
    }
    node.addChildAt(child, index)
    child.apply {
      attributes.sync(style)
    }
  }
}
