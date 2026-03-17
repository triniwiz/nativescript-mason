package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.os.Build
import android.text.StaticLayout
import android.util.AttributeSet
import android.util.Log
import android.util.TypedValue
import android.view.KeyEvent
import android.view.View
import androidx.core.widget.TextViewCompat
import org.nativescript.mason.masonkit.Styles.TextJustify
import org.nativescript.mason.masonkit.Styles.TextWrap
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.events.Event
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


  // Cached StaticLayout and width used for drawing when we render our own layout
  internal var cachedStaticLayout: StaticLayout? = null
  internal var cachedStaticLayoutWidth: Int = -1
  // Float-aware StaticLayout: wraps text around floated sibling elements
  internal var floatAwareStaticLayout: StaticLayout? = null
  // Height applied by float-aware expansion so onSizeChanged can skip clearing the cache
  private var floatExpandedHeight: Int = -1
  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach { it.shader = null } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
    // Invalidate cached StaticLayout when size changes, but skip if this
    // size change was triggered by our own float-aware height expansion.
    if (floatExpandedHeight > 0 && h == floatExpandedHeight) {
      // Keep the float-aware layout intact — we just expanded to fit it.
    } else {
      cachedStaticLayout = null
      cachedStaticLayoutWidth = -1
      floatAwareStaticLayout = null
      floatExpandedHeight = -1
    }
    super.onSizeChanged(w, h, oldw, oldh)
  }

  override fun onDraw(canvas: Canvas) {
    // Suppress view-level border only when this TextView will be flattened
    // and the blockquote bar is drawn as an inline span.
    val ignoreBorder =
      (this.type == TextType.Blockquote && this.engine.shouldFlattenTextContainer(this))
    ViewUtils.onDraw(this, canvas, style, ignoreBorder) { c ->
      // Build float-aware layout lazily if we have floated siblings.
      // Note: cachedStaticLayout may be null here (cleared by onSizeChanged
      // when applyLayoutFlat positions the view), so try building float-aware
      // layout unconditionally.
      if (floatAwareStaticLayout == null) {
        floatAwareStaticLayout = engine.buildFloatAwareStaticLayout(paint)
      }

      val layoutToDraw = floatAwareStaticLayout ?: cachedStaticLayout

      if (layoutToDraw != null) {
        // If the float-aware layout is taller than the view, expand bounds
        // so text below the floats isn't clipped, and also grow ancestor
        // containers so their borders wrap the full content.
        if (layoutToDraw === floatAwareStaticLayout) {
          val neededHeight = layoutToDraw.height + paddingTop + paddingBottom
          if (neededHeight > height) {
            val extraHeight = neededHeight - height
            floatExpandedHeight = neededHeight
            post {
              layout(left, top, right, top + neededHeight)
              // Grow ancestor Elements so their borders wrap the expanded
              // text. Account for the child's bottom margin and the ancestor's
              // border + padding when computing the needed height.
              var child: android.view.View = this@TextView
              var childNode: Node? = this@TextView.node
              var anc = parent as? android.view.View
              var topExpanded: android.view.View? = null
              while (anc != null && anc is Element) {
                val ancElement = anc as Element
                val childMarginBottom = childNode?.let {
                  resolveMarginValue(try { it.style.margin.bottom } catch (_: Throwable) { null })
                } ?: 0f
                val ancBorderBottom = ancElement.node.computedBorderBottom
                val needed = child.bottom + childMarginBottom.toInt() + anc.paddingBottom + ancBorderBottom.toInt()
                val available = anc.height
                if (needed <= available) break
                anc.layout(anc.left, anc.top, anc.right, anc.top + needed)
                topExpanded = anc
                childNode = ancElement.node
                child = anc
                anc = anc.parent as? android.view.View
                anc?.invalidate()
              }
              // Single invalidate on the topmost expanded ancestor redraws
              // the whole subtree in one pass instead of per-ancestor.
              (topExpanded ?: this@TextView).invalidate()
            }
          }
        }
        layoutToDraw.draw(c)
      } else {
        // Fall back to platform drawing if building a StaticLayout fails.
        super.onDraw(c)
      }
    }
  }

  var textContent: String
    get() {
      return engine.textContent
    }
    set(value) {
      // Invalidate our cached layout when text changes
      cachedStaticLayout = null
      cachedStaticLayoutWidth = -1
      floatAwareStaticLayout = null
      engine.textContent = value
    }

  override fun setText(text: CharSequence, type: BufferType) {
    cachedStaticLayout = null
    cachedStaticLayoutWidth = -1
    floatAwareStaticLayout = null
    super.setText(text, type)
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
    background = null

    if (type != TextType.None) {
      node.style.inBatch = true

      when (type) {
        TextType.Span -> {
          style.display = Display.Inline
        }

        TextType.Code -> {
          style.fontFamily = "monospace"
          style.display = Display.Inline
        }

        TextType.H1 -> {
          node.style.display = Display.Block
          style.fontWeight = FontFace.NSCFontWeight.Bold
          fontSize = 32
          node.style.margin = margin(16f, 16f)
        }

        TextType.H2 -> {
          node.style.display = Display.Block
          style.fontWeight = FontFace.NSCFontWeight.Bold
          fontSize = 24
          node.style.margin = margin(14f, 14f)
        }

        TextType.H3 -> {
          node.style.display = Display.Block
          style.fontWeight = FontFace.NSCFontWeight.Bold
          fontSize = 20
          node.style.margin = margin(12f, 8f)
        }

        TextType.H4 -> {
          node.style.display = Display.Block
          style.fontWeight = FontFace.NSCFontWeight.Bold
          fontSize = Constants.DEFAULT_FONT_SIZE
          node.style.margin = margin(10f, 10f)
        }

        TextType.H5 -> {
          node.style.display = Display.Block
          style.fontWeight = FontFace.NSCFontWeight.Bold
          fontSize = 13
          node.style.margin = margin(8f, 8f)
        }

        TextType.H6 -> {
          node.style.display = Display.Block
          style.fontWeight = FontFace.NSCFontWeight.Bold
          fontSize = 10
          node.style.margin = margin(6f, 6f)
        }

        TextType.Li -> {
        }

        TextType.Blockquote -> {
          node.style.display = Display.Block
          node.style.margin = Rect(
            top = LengthPercentageAuto.Points(16f),
            right = LengthPercentageAuto.Points(40f),
            bottom = LengthPercentageAuto.Points(16f),
            left = LengthPercentageAuto.Points(40f),
          )
        }

        TextType.B, TextType.Strong -> {
          style.fontWeight = FontFace.NSCFontWeight.Bold
          style.display = Display.Inline
        }

        TextType.Pre -> {
          node.style.display = Display.Block
          style.fontFamily = "monospace"
          fontSize = Constants.DEFAULT_FONT_SIZE
          whiteSpace = Styles.WhiteSpace.Pre
          node.style.margin = margin(16f, 16f)
        }

        TextType.I, TextType.Em -> {
          style.fontStyle = FontFace.NSCFontStyle.Italic
          style.display = Display.Inline
        }

        TextType.P -> {
          node.style.display = Display.Block
          node.style.margin = margin(16f, 16f)
        }

        TextType.A -> {
          node.style.display = Display.Inline
          node.style.decorationLine = Styles.DecorationLine.Underline


          isClickable = true
          isFocusable = true
          isFocusableInTouchMode = true

          setOnClickListener {
            node.mason.dispatch(
              Event(
                type = "click",
              ).apply {
                target = this@TextView
              }
            )
          }

          setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
              performClick()
              true
            } else {
              false
            }
          }
        }

        else -> {}
      }

      fontFace.load(context) { _ -> }

      node.style.inBatch = false

    } else {
      fontFace.load(context) { _ -> }
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
      // Baseline is ascent distance from top of content box
      // `metrics.ascent` is negative (distance above baseline). Use its
      // negated value to get the positive distance from the top to baseline.
      val baselineY = node.computedPaddingTop + node.computedBorderTop + -metrics.ascent
      return baselineY.toInt()
    }

    // Fallback to TextView's baseline
    return super.getBaseline()
  }

  override fun onChange(low: Long, high: Long) {
    // Style change affects layout; invalidate cached StaticLayout
    cachedStaticLayout = null
    cachedStaticLayoutWidth = -1
    floatAwareStaticLayout = null
    engine.onTextStyleChanged(low, high, paint, resources.displayMetrics)
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

    if (parent !is Element || node.parent == null) {
      if (!node.mason.inCompute) {
        compute(
          mapMeasureSpec(specWidthMode, specWidth).value,
          mapMeasureSpec(specHeightMode, specHeight).value
        )
      }

      layoutFlat()
      setMeasuredDimension(node.computedWidth.toInt(), node.computedHeight.toInt())
    } else {
      if (specWidthMode == MeasureSpec.EXACTLY && specHeightMode == MeasureSpec.EXACTLY) {
        setMeasuredDimension(specWidth, specHeight)
      } else {
        setMeasuredDimension(node.computedWidth.toInt(), node.computedHeight.toInt())
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

  fun addView(view: Element) {
    addChildAt(view, -1)
  }

  fun addView(view: Element, index: Int) {
    addChildAt(view, index)
  }
}
