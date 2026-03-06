package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.os.Build
import android.util.AttributeSet
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
import android.graphics.Paint

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

  companion object {
    // Enable to draw float rects/margins for debugging
    var DEBUG_FLOAT_OVERLAY: Boolean = false
  }

  private val debugOutlinePaint = Paint().apply {
    style = Paint.Style.STROKE
    strokeWidth = 2f
    color = android.graphics.Color.RED
  }

  private val debugMarginPaint = Paint().apply {
    style = Paint.Style.STROKE
    strokeWidth = 1f
    color = android.graphics.Color.CYAN
  }

  private val debugTextPaint = Paint().apply {
    style = Paint.Style.FILL
    color = android.graphics.Color.WHITE
    textSize = 18f
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

  private fun ensureScratch(lines: Int) {
    if (lines <= 0) return
    if (scratchLeft.size < lines) scratchLeft = IntArray(lines)
    if (scratchRight.size < lines) scratchRight = IntArray(lines)
  }
  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach { it.shader = null } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
    try {
      val estimatedLines = kotlin.math.max(1, (h / kotlin.math.max(1f, paint.fontSpacing)).toInt() + 4)
      ensureScratch(estimatedLines)
    } catch (_: Throwable) {}
  }

  private val emptyFloats by lazy {
    Pair(IntArray(0), FloatArray(0))
  }
  // Reusable scratch arrays to avoid allocations in onDraw
  private var scratchLeft = IntArray(0)
  private var scratchRight = IntArray(0)
  override fun onDraw(canvas: Canvas) {
    // Suppress view-level border only when this TextView will be flattened
    // and the blockquote bar is drawn as an inline span.
    val ignoreBorder =
      (this.type == TextType.Blockquote && this.engine.shouldFlattenTextContainer(this))
    ViewUtils.onDraw(this, canvas, style, ignoreBorder) { c ->
      // Query float rects for this view (already mapped to view-local px)
      val (idsLocal, rectsLocal) = try {
        NodeHelper.shared.getFloatRectsLocalToView(this)
      } catch (_: Throwable) {
        emptyFloats
      }

      val lineCount = try { layout.lineCount } catch (_: Throwable) { 0 }

      if (rectsLocal.isEmpty() || lineCount == 0) {
        // No floats — fall back to default draw
        super.onDraw(c)

        // draw debug overlay if requested
        if (DEBUG_FLOAT_OVERLAY && rectsLocal.isNotEmpty()) {
          try {
            val fcount = rectsLocal.size / 4
            for (j in 0 until fcount) {
              val base = j * 4
              val l = rectsLocal[base]
              val t = rectsLocal[base + 1]
              val w = rectsLocal[base + 2]
              val h = rectsLocal[base + 3]
              c.drawRect(l, t, l + w, t + h, debugOutlinePaint)
            }
          } catch (_: Throwable) {}
        }

        return@onDraw
      }

      // Build per-line insets (absolute left and absolute right bounds) in px
      val widthF = width.toFloat()
      val padLeft = totalPaddingLeft.toFloat()
      val padRight = totalPaddingRight.toFloat()
      val marginLeftView = node.computedLayout.margin.left
      val marginRightView = node.computedLayout.margin.right

      // deterministic safety gap to avoid glyph overhang clipping
      // Use a cheap font-derived metric: a small fraction of the font line-height
      // (descent - ascent). This avoids per-draw `measureText` calls.
      val fm = paint.fontMetrics
      var safetyGap = (fm.descent - fm.ascent) * 0.06f
      if (safetyGap <= 0f) safetyGap = paint.textSize * 0.03f
      if (safetyGap <= 0f) safetyGap = 1f


      // Ensure scratch arrays were preallocated during onMeasure. If they
      // are not large enough, avoid allocating here (no allocations in onDraw)
      if (scratchLeft.size < lineCount || scratchRight.size < lineCount) {
        super.onDraw(c)
        return@onDraw
      }
      val leftArr = scratchLeft
      val rightArr = scratchRight

      for (lineIndex in 0 until lineCount) {
        val lineTop = layout.getLineTop(lineIndex).toFloat()
        val lineBottom = layout.getLineBottom(lineIndex).toFloat()

        var leftInset = 0f
        var rightInset = 0f

        val fcount = rectsLocal.size / 4
        for (j in 0 until fcount) {
          val base = j * 4
          val l = rectsLocal[base]
          val t = rectsLocal[base + 1]
          val w = rectsLocal[base + 2]
          val h = rectsLocal[base + 3]
          val r = l + w
          val b = t + h
          if (t < lineBottom && b > lineTop) {
            // Decide side by center-of-float heuristic
            val mid = l + w * 0.5f
            if (mid < widthF * 0.5f) {
              // left float — push text right of float's right edge
              if (r > leftInset) leftInset = r
            } else {
              // right float — push text left of float's left edge
              if (rightInset == 0f || l < rightInset) rightInset = l
            }
          }
        }

        // leftInset/rightInset are absolute view-local x coordinates when set
        // apply deterministic safety gap
        if (leftInset > 0f) leftInset += safetyGap
        if (rightInset > 0f) rightInset -= safetyGap

        leftArr[lineIndex] = kotlin.math.ceil(leftInset).toInt()
        // if there is no right float overlapping this line, use full-width as right bound
        rightArr[lineIndex] = if (rightInset <= 0f) kotlin.math.ceil(widthF).toInt() else kotlin.math.floor(rightInset).toInt()
      }

      // Group contiguous lines with identical insets and draw per-group
      var groupStart = 0
      var prevLeft = leftArr[0]
      var prevRight = rightArr[0]

      for (i in 1..lineCount) {
        val currLeft = if (i < lineCount) leftArr[i] else -1
        val currRight = if (i < lineCount) rightArr[i] else -1
        if (i == lineCount || currLeft != prevLeft || currRight != prevRight) {
          val top = layout.getLineTop(groupStart).toFloat()
          val bottom = layout.getLineBottom(i - 1).toFloat()

          c.save()
          try {
            // left/right arrays hold absolute coordinates in view-local content space.
            val clipLeft = prevLeft.toFloat()
            val clipRight = prevRight.toFloat()

            // Convert content-space to absolute view coords by adding padding and margins
            val groupLeftAbs = clipLeft + padLeft + marginLeftView
            val groupRightAbs = clipRight + padLeft + marginLeftView

            // clamp to content area (inside view padding)
            val clampedLeft = kotlin.math.max(groupLeftAbs, padLeft)
            val clampedRight = kotlin.math.min(groupRightAbs, widthF - padRight)

            if (clampedRight <= clampedLeft + 1f) {
              // Invalid or very small clip — draw full content to avoid clipping
              super.onDraw(c)
            } else {
              c.clipRect(clampedLeft, top, clampedRight, bottom)
              // Translate so layout.draw starts at the clipped content origin
              c.translate(groupLeftAbs, 0f)
              layout.draw(c)
            }
          } catch (_: Throwable) {
            super.onDraw(c)
          } finally {
            c.restore()
          }

          groupStart = i
          if (i < lineCount) {
            prevLeft = leftArr[i]
            prevRight = rightArr[i]
          }
        }
      }

      // Draw debug overlay on top
      if (DEBUG_FLOAT_OVERLAY) {
        try {
          val fcount = rectsLocal.size / 4
          for (j in 0 until fcount) {
            val base = j * 4
            val l = rectsLocal[base]
            val t = rectsLocal[base + 1]
            val w = rectsLocal[base + 2]
            val h = rectsLocal[base + 3]
            c.drawRect(l, t, l + w, t + h, debugOutlinePaint)
            if (j < idsLocal.size) {
              c.drawText(idsLocal[j].toString(), l + 2f, t + 14f, debugTextPaint)
            }
          }
        } catch (_: Throwable) {}
      }
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
      // `metrics.ascent` is negative (distance above baseline). Use its
      // negated value to get the positive distance from the top to baseline.
      val baselineY = layout.padding.top + layout.border.top + -metrics.ascent
      return baselineY.toInt()
    }

    // Fallback to TextView's baseline
    return super.getBaseline()
  }

  override fun onChange(low: Long, high: Long) {
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
      // Preallocate scratch arrays based on available line count so we avoid
      // doing allocations during onDraw. Prefer Android's StaticLayout line
      // count (`this.layout.lineCount`) when present; otherwise estimate from
      // the computed layout height and font spacing.
      try {
        val androidLines = try { this.layout?.lineCount ?: -1 } catch (_: Throwable) { -1 }
        val estimatedLines = if (androidLines > 0) androidLines + 4 else kotlin.math.max(1, (layout.height / paint.fontSpacing).toInt() + 4)
        if (scratchLeft.size < estimatedLines) scratchLeft = IntArray(estimatedLines)
        if (scratchRight.size < estimatedLines) scratchRight = IntArray(estimatedLines)
      } catch (_: Throwable) {}
    } else {
      // Call super to update Android's internal text Layout (mLayout).
      // Without this, the internal Layout used for rendering may have a stale
      // width, causing text to be clipped or wrapped incorrectly.
      super.onMeasure(widthMeasureSpec, heightMeasureSpec)

      // Override measured dimensions with the computed values
      if (specWidthMode == MeasureSpec.EXACTLY && specHeightMode == MeasureSpec.EXACTLY) {
        setMeasuredDimension(
          specWidth, specHeight
        )
      } else {
        val layout = layout()
        setMeasuredDimension(
          layout.width.toInt(), layout.height.toInt()
        )
        // When we used Android's measurement, preallocate scratch arrays
        // based on the Android `layout.lineCount` where possible.
        try {
          val androidLines = try { this.layout?.lineCount ?: -1 } catch (_: Throwable) { -1 }
          val estimatedLines = if (androidLines > 0) androidLines + 4 else kotlin.math.max(1, (measuredHeight / paint.fontSpacing).toInt())
          if (scratchLeft.size < estimatedLines) scratchLeft = IntArray(estimatedLines)
          if (scratchRight.size < estimatedLines) scratchRight = IntArray(estimatedLines)
        } catch (_: Throwable) {}
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
