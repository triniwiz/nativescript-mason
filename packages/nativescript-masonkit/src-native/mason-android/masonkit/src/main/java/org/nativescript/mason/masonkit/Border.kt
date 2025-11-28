package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PointF
import org.nativescript.mason.masonkit.LengthPercentage.Percent
import org.nativescript.mason.masonkit.LengthPercentage.Points
import org.nativescript.mason.masonkit.LengthPercentage.Zero
import org.nativescript.mason.masonkit.enums.BorderStyle
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin

class Border(val owner: Style, side: Side) {
  val keys: IKey = when (side) {
    Side.Left -> Keys.left
    Side.Top -> Keys.top
    Side.Right -> Keys.right
    Side.Bottom -> Keys.bottom
  }

  internal var setState = true

  interface IKey {
    val widthValue: Int
    val widthType: Int
    val style: Int
    val color: Int

    val corner1RadiusXType: Int
    val corner1RadiusXValue: Int
    val corner1RadiusYType: Int
    val corner1RadiusYValue: Int
    val corner1Exponent: Int

    val corner2RadiusXType: Int
    val corner2RadiusXValue: Int
    val corner2RadiusYType: Int
    val corner2RadiusYValue: Int
    val corner2Exponent: Int
  }

  class Keys {
    class Left : IKey {
      override val widthValue: Int
        get() = StyleKeys.BORDER_LEFT_VALUE
      override val widthType: Int
        get() = StyleKeys.BORDER_LEFT_TYPE
      override val style: Int
        get() = StyleKeys.BORDER_LEFT_STYLE
      override val color: Int
        get() = StyleKeys.BORDER_LEFT_COLOR

      override val corner1RadiusXType = StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE
      override val corner1RadiusXValue = StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE
      override val corner1RadiusYType = StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE
      override val corner1RadiusYValue = StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE
      override val corner1Exponent = StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT

      override val corner2RadiusXType = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE
      override val corner2RadiusXValue = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE
      override val corner2RadiusYType = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE
      override val corner2RadiusYValue = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE
      override val corner2Exponent = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT
    }

    class Top : IKey {
      override val widthValue: Int
        get() = StyleKeys.BORDER_TOP_VALUE
      override val widthType: Int
        get() = StyleKeys.BORDER_TOP_TYPE
      override val style: Int
        get() = StyleKeys.BORDER_TOP_STYLE
      override val color: Int
        get() = StyleKeys.BORDER_TOP_COLOR

      override val corner1RadiusXType = StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE
      override val corner1RadiusXValue = StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE
      override val corner1RadiusYType = StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE
      override val corner1RadiusYValue = StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE
      override val corner1Exponent = StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT

      override val corner2RadiusXType = StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE
      override val corner2RadiusXValue = StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE
      override val corner2RadiusYType = StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE
      override val corner2RadiusYValue = StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE
      override val corner2Exponent = StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT
    }

    class Right : IKey {
      override val widthValue: Int
        get() = StyleKeys.BORDER_RIGHT_VALUE
      override val widthType: Int
        get() = StyleKeys.BORDER_RIGHT_TYPE
      override val style: Int
        get() = StyleKeys.BORDER_RIGHT_STYLE
      override val color: Int
        get() = StyleKeys.BORDER_RIGHT_COLOR


      override val corner1RadiusXType = StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE
      override val corner1RadiusXValue = StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE
      override val corner1RadiusYType = StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE
      override val corner1RadiusYValue = StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE
      override val corner1Exponent = StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT

      override val corner2RadiusXType = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE
      override val corner2RadiusXValue = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE
      override val corner2RadiusYType = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE
      override val corner2RadiusYValue = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE
      override val corner2Exponent = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT
    }

    class Bottom : IKey {
      override val widthValue: Int
        get() = StyleKeys.BORDER_BOTTOM_VALUE
      override val widthType: Int
        get() = StyleKeys.BORDER_BOTTOM_TYPE
      override val style: Int
        get() = StyleKeys.BORDER_BOTTOM_STYLE
      override val color: Int
        get() = StyleKeys.BORDER_BOTTOM_COLOR

      override val corner1RadiusXType = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE
      override val corner1RadiusXValue = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE
      override val corner1RadiusYType = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE
      override val corner1RadiusYValue = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE
      override val corner1Exponent = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT

      override val corner2RadiusXType = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE
      override val corner2RadiusXValue = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE
      override val corner2RadiusYType = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE
      override val corner2RadiusYValue = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE
      override val corner2Exponent = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT
    }

    companion object {
      val left by lazy {
        Left()
      }

      val top by lazy {
        Top()
      }

      val right by lazy {
        Right()
      }

      val bottom by lazy {
        Bottom()
      }
    }

  }

  interface IKeyCorner {
    val xType: Int
    val xValue: Int
    val yType: Int
    val yValue: Int
    val exponent: Int
  }

  object cornerTopLeftKeys : IKeyCorner {
    override val xType: Int get() = StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE
    override val xValue: Int get() = StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE
    override val yType: Int get() = StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE
    override val yValue: Int get() = StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE
    override val exponent: Int get() = StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT
  }

  object cornerTopRightKeys : IKeyCorner {
    override val xType: Int get() = StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE
    override val xValue: Int get() = StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE
    override val yType: Int get() = StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE
    override val yValue: Int get() = StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE
    override val exponent: Int get() = StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT
  }

  object cornerBottomRightKeys : IKeyCorner {
    override val xType: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE
    override val xValue: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE
    override val yType: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE
    override val yValue: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE
    override val exponent: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT
  }

  object cornerBottomLeftKeys : IKeyCorner {
    override val xType: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE
    override val xValue: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE
    override val yType: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE
    override val yValue: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE
    override val exponent: Int get() = StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT
  }

  enum class Side {
    Left,
    Top,
    Right,
    Bottom
  }

  var width: LengthPercentage
    get() {
      return LengthPercentage.fromTypeValue(
        owner.values.getInt(keys.widthType),
        owner.values.getFloat(keys.widthValue)
      )!!
    }
    set(value) {
      val old = width
      if (old != value) {
        owner.values.putInt(keys.widthType, value.type)
        owner.values.putFloat(keys.widthValue, value.value)
        if (setState) {
          owner.setOrAppendState(StateKeys.BORDER)
        }
      }
    }

  var color: Int
    get() {
      return owner.values.getInt(keys.color)
    }
    set(value) {
      val old = color
      if (old != value) {
        owner.values.putInt(keys.color, value)
        if (setState) {
          owner.setOrAppendState(StateKeys.BORDER_COLOR)
        }
      }
    }

  var style: BorderStyle
    get() {
      return BorderStyle.fromInt(owner.values.getInt(keys.style))
    }
    set(value) {
      val old = style
      if (old != value) {
        owner.values.putInt(keys.style, value.value)
        if (setState) {
          owner.setOrAppendState(StateKeys.BORDER_STYLE)
        }
      }
    }

  var corner1Radius: Point<LengthPercentage>
    get() {
      return Point(
        LengthPercentage.fromTypeValue(
          owner.values.getInt(keys.corner1RadiusXType),
          owner.values.getFloat(keys.corner1RadiusXValue),
        )!!,
        LengthPercentage.fromTypeValue(
          owner.values.getInt(keys.corner1RadiusYType),
          owner.values.getFloat(keys.corner1RadiusYValue),
        )!!
      )
    }
    set(value) {
      owner.values.putInt(keys.corner1RadiusXType, value.x.type)
      owner.values.putFloat(keys.corner1RadiusXValue, value.x.value)

      owner.values.putInt(keys.corner1RadiusYType, value.y.type)
      owner.values.putFloat(keys.corner1RadiusYValue, value.y.value)

      if (setState) {
        owner.setOrAppendState(StateKeys.BORDER_RADIUS)
      }

    }


  var corner2Radius: Point<LengthPercentage>
    get() {
      return Point(
        LengthPercentage.fromTypeValue(
          owner.values.getInt(keys.corner2RadiusXType),
          owner.values.getFloat(keys.corner2RadiusXValue),
        )!!,
        LengthPercentage.fromTypeValue(
          owner.values.getInt(keys.corner2RadiusYType),
          owner.values.getFloat(keys.corner2RadiusYValue),
        )!!
      )
    }
    set(value) {
      owner.values.putInt(keys.corner2RadiusXType, value.x.type)
      owner.values.putFloat(keys.corner2RadiusXValue, value.x.value)

      owner.values.putInt(keys.corner2RadiusYType, value.y.type)
      owner.values.putFloat(keys.corner2RadiusYValue, value.y.value)

      if (setState) {
        owner.setOrAppendState(StateKeys.BORDER_RADIUS)
      }
    }


  var corner1Exponent: Float
    get() = owner.values.getFloat(keys.corner1Exponent)
    set(value) {
      owner.values.putFloat(keys.corner1Exponent, value)
      if (setState) {
        owner.setOrAppendState(StateKeys.BORDER_RADIUS)
      }
    }

  var corner2Exponent: Float
    get() = owner.values.getFloat(keys.corner2Exponent)
    set(value) {
      owner.values.putFloat(keys.corner2Exponent, value)
      if (setState) {
        owner.setOrAppendState(StateKeys.BORDER_RADIUS)
      }
    }
}

private fun LengthPercentage.toPx(viewSize: Float): Float {
  return when (this) {
    is Points -> this.points
    is Zero -> 0f
    is Percent -> {
      this.percentage * viewSize
    }
  }
}

class BorderRenderer(private val style: Style) {

  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val path = Path()

  // cached corner points
  private val topLeftCorner = PointF()
  private val topRightCorner = PointF()
  private val bottomRightCorner = PointF()
  private val bottomLeftCorner = PointF()

  // cached side widths
  private var leftWidth = 0f
  private var topWidth = 0f
  private var rightWidth = 0f
  private var bottomWidth = 0f

  // cached colors
  private var leftColor = 0
  private var topColor = 0
  private var rightColor = 0
  private var bottomColor = 0

  // cached styles
  private var leftStyle = BorderStyle.None
  private var topStyle = BorderStyle.None
  private var rightStyle = BorderStyle.None
  private var bottomStyle = BorderStyle.None


  private var topLeftExponent = 0f
  private var topRightExponent = 0f
  private var bottomRightExponent = 0f
  private var bottomLeftExponent = 0f

  private var lastHash = 0

  private var cacheInvalidated = true

  private fun computeHash(): Int {
    var result = 17
    result = 31 * result + style.mBorderLeft.width.hashCode()
    result = 31 * result + style.mBorderTop.width.hashCode()
    result = 31 * result + style.mBorderRight.width.hashCode()
    result = 31 * result + style.mBorderBottom.width.hashCode()

    result = 31 * result + style.mBorderLeft.color
    result = 31 * result + style.mBorderTop.color
    result = 31 * result + style.mBorderRight.color
    result = 31 * result + style.mBorderBottom.color

    result = 31 * result + style.borderTopLeftRadius.hashCode()
    result = 31 * result + style.borderTopRightRadius.hashCode()
    result = 31 * result + style.borderBottomRightRadius.hashCode()
    result = 31 * result + style.borderBottomLeftRadius.hashCode()

    result = 31 * result + style.mBorderLeft.corner1Exponent.hashCode()
    result = 31 * result + style.mBorderLeft.corner2Exponent.hashCode()
    result = 31 * result + style.mBorderRight.corner1Exponent.hashCode()
    result = 31 * result + style.mBorderRight.corner2Exponent.hashCode()

    return result
  }

  fun invalidate() {
    cacheInvalidated = true
  }

  fun updateCache(viewWidth: Float, viewHeight: Float) {
    val newHash = computeHash()
    if (!cacheInvalidated && newHash == lastHash) return

    lastHash = newHash
    cacheInvalidated = false

    // Widths
    leftWidth = style.mBorderLeft.width.toPx(viewWidth)
    topWidth = style.mBorderTop.width.toPx(viewWidth)
    rightWidth = style.mBorderRight.width.toPx(viewWidth)
    bottomWidth = style.mBorderBottom.width.toPx(viewWidth)

    // Colors
    leftColor = style.mBorderLeft.color
    topColor = style.mBorderTop.color
    rightColor = style.mBorderRight.color
    bottomColor = style.mBorderBottom.color

    // Styles
    leftStyle = style.mBorderLeft.style
    topStyle = style.mBorderTop.style
    rightStyle = style.mBorderRight.style
    bottomStyle = style.mBorderBottom.style

    // Corner radii
    topLeftCorner.x = style.borderTopLeftRadius.x.toPx(viewWidth)   // TL.x
    topLeftCorner.y = style.borderTopLeftRadius.y.toPx(viewHeight)  // TL.y
    topRightCorner.x = style.borderTopRightRadius.x.toPx(viewWidth)
    topRightCorner.y = style.borderTopRightRadius.y.toPx(viewHeight)
    bottomRightCorner.x = style.borderBottomRightRadius.x.toPx(viewWidth)
    bottomRightCorner.y = style.borderBottomRightRadius.y.toPx(viewHeight)
    bottomLeftCorner.x = style.borderBottomLeftRadius.x.toPx(viewWidth)
    bottomLeftCorner.y = style.borderBottomLeftRadius.y.toPx(viewHeight)

    // Exponents
    topLeftExponent = style.mBorderTop.corner1Exponent       // Top-Left
    topRightExponent = style.mBorderTop.corner2Exponent       // Top-Right
    bottomRightExponent = style.mBorderBottom.corner2Exponent    // Bottom-Right
    bottomLeftExponent = style.mBorderBottom.corner1Exponent    // Bottom-Left

  }

  /** Draws the border into the canvas */
  fun draw(canvas: Canvas, width: Float, height: Float) {
    // resets when building
   // path.reset()

    // Build path with corners and sides
    buildBorderPath(width, height)

    // Draw each side separately for per-side colors and styles
    drawSide(canvas, Side.Top, path, topColor, topStyle)
    drawSide(canvas, Side.Right, path, rightColor, rightStyle)
    drawSide(canvas, Side.Bottom, path, bottomColor, bottomStyle)
    drawSide(canvas, Side.Left, path, leftColor, leftStyle)
  }

  private enum class Corner { TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT }

  private fun buildBorderPath(width: Float, height: Float) {
    val tl = topLeftCorner
    val tr = topRightCorner
    val br = bottomRightCorner
    val bl = bottomLeftCorner

    path.reset()

    // Clamp radii to avoid exceeding view dimensions
    val tlX = tl.x.coerceAtMost(width / 2f)
    val tlY = tl.y.coerceAtMost(height / 2f)
    val trX = tr.x.coerceAtMost(width / 2f)
    val trY = tr.y.coerceAtMost(height / 2f)
    val brX = br.x.coerceAtMost(width / 2f)
    val brY = br.y.coerceAtMost(height / 2f)
    val blX = bl.x.coerceAtMost(width / 2f)
    val blY = bl.y.coerceAtMost(height / 2f)

    path.moveTo(0f + tlX, 0f)

    // Top edge + top-right corner
    path.lineTo(width - trX, 0f)
    path.quadTo(width, 0f, width, trY)

    // Right edge + bottom-right corner
    path.lineTo(width, height - brY)
    path.quadTo(width, height, width - brX, height)

    // Bottom edge + bottom-left corner
    path.lineTo(blX, height)
    path.quadTo(0f, height, 0f, height - blY)

    // Left edge + top-left corner
    path.lineTo(0f, tlY)
    path.quadTo(0f, 0f, tlX, 0f)

    path.close()
  }

  private fun addCorner(
    path: Path,
    corner: Corner,
    radius: PointF,
    exponent: Float,
    width: Float,
    height: Float
  ) {
    if (radius.x <= 0f && radius.y <= 0f) return

    val steps = if (exponent != 1f) 16 else 1

    for (i in 0..steps) {
      val t = i / steps.toFloat()
      val angle = t * Math.PI / 2.0
      val px: Float
      val py: Float

      if (exponent == 1f) {
        // Simple quarter ellipse (or circle)
        when (corner) {
          Corner.TOP_LEFT -> {
            px = radius.x * (1 - cos(angle)).toFloat(); py = radius.y * (1 - sin(angle)).toFloat()
          }

          Corner.TOP_RIGHT -> {
            px = width - radius.x * (1 - cos(angle)).toFloat(); py =
              radius.y * (1 - sin(angle)).toFloat()
          }

          Corner.BOTTOM_RIGHT -> {
            px = width - radius.x * (1 - cos(angle)).toFloat(); py =
              height - radius.y * (1 - sin(angle)).toFloat()
          }

          Corner.BOTTOM_LEFT -> {
            px = radius.x * (1 - cos(angle)).toFloat(); py =
              height - radius.y * (1 - sin(angle)).toFloat()
          }
        }
      } else {
        // Superellipse curve
        val cx = cos(angle).pow(exponent.toDouble()).toFloat()
        val cy = sin(angle).pow(exponent.toDouble()).toFloat()
        when (corner) {
          Corner.TOP_LEFT -> {
            px = radius.x * (1 - cx); py = radius.y * (1 - cy)
          }

          Corner.TOP_RIGHT -> {
            px = width - radius.x * (1 - cx); py = radius.y * (1 - cy)
          }

          Corner.BOTTOM_RIGHT -> {
            px = width - radius.x * (1 - cx); py = height - radius.y * (1 - cy)
          }

          Corner.BOTTOM_LEFT -> {
            px = radius.x * (1 - cx); py = height - radius.y * (1 - cy)
          }
        }
      }

      path.lineTo(px, py)
    }
  }


  private fun cosSuper(angle: Double, n: Float): Float {
    return (cos(angle).pow(n.toDouble())).toFloat()
  }

  private fun sinSuper(angle: Double, n: Float): Float {
    return (sin(angle).pow(n.toDouble())).toFloat()
  }

  private fun getExponentForCorner(corner: Corner): Float {
    return when (corner) {
      Corner.TOP_LEFT -> style.mBorderLeft.corner1Exponent
      Corner.TOP_RIGHT -> style.mBorderRight.corner1Exponent
      Corner.BOTTOM_RIGHT -> style.mBorderRight.corner2Exponent
      Corner.BOTTOM_LEFT -> style.mBorderLeft.corner2Exponent
    }
  }

  private fun drawSide(canvas: Canvas, side: Side, path: Path, color: Int, style: BorderStyle) {
    if (style == BorderStyle.None || color == 0) return
    paint.color = color
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = getWidthForSide(side)
    when (style) {
      BorderStyle.Solid -> paint.pathEffect = null
      BorderStyle.Dashed -> paint.pathEffect =
        android.graphics.DashPathEffect(floatArrayOf(10f, 10f), 0f)

      BorderStyle.Dotted -> paint.pathEffect =
        android.graphics.DashPathEffect(floatArrayOf(2f, 8f), 0f)

      else -> paint.pathEffect = null
    }
    canvas.drawPath(path, paint)
  }

  private fun getWidthForSide(side: Side): Float = when (side) {
    Side.Left -> leftWidth
    Side.Top -> topWidth
    Side.Right -> rightWidth
    Side.Bottom -> bottomWidth
  }

  enum class Side { Left, Top, Right, Bottom }
}

private val lengthPercentageRegex = Regex("""^(\d+(\.\d+)?)(px|%)$""")
private val colorRegex = Regex("""^(#\w{3,8}|[a-zA-Z]+)$""")


fun parseLengthPercentage(value: String): LengthPercentage? {
  val match = lengthPercentageRegex.matchEntire(value.trim()) ?: return null
  val num = match.groupValues[1].toFloatOrNull() ?: return null
  return when (match.groupValues[3]) {
    "px" -> Points(num)
    "%" -> Percent(num / 100f)
    "dip" -> Points(num * Mason.shared.scale)
    else -> null
  }
}

private val SPLIT_REGEX = Regex("""\s+""")
fun parseBorderShorthand(style: Style, value: String) {
  if (value.isEmpty()) {
    style.mBorder = ""
    var batch = false

    if (!style.inBatch) {
      style.inBatch = true
      batch = true
    }

    style.mBorderLeft.width = Zero
    style.mBorderTop.width = Zero
    style.mBorderRight.width = Zero
    style.mBorderBottom.width = Zero

    style.mBorderLeft.style = BorderStyle.None
    style.mBorderTop.style = BorderStyle.None
    style.mBorderRight.style = BorderStyle.None
    style.mBorderBottom.style = BorderStyle.None


    style.mBorderLeft.color = Color.TRANSPARENT
    style.mBorderTop.color = Color.TRANSPARENT
    style.mBorderRight.color = Color.TRANSPARENT
    style.mBorderBottom.color = Color.TRANSPARENT

    if (batch) {
      style.mBorderRenderer.invalidate()
      style.inBatch = false
    }

    return
  }
  // default to medium 3px
  var valid = false
  val scale = style.node.mason.scale
  var width: LengthPercentage? = Points(scale * 3)
  var borderStyle: BorderStyle? = BorderStyle.Solid
  // default to black
  var color: Int? = Color.BLACK

  val split = value.split(SPLIT_REGEX)
  split.forEach { part ->
    when {
      parseLengthPercentage(part) != null -> {
        width = when (part) {
          "thin" -> Points(scale * 1)
          "medium" -> Points(scale * 3)
          "thick" -> Points(scale * 5)
          else -> parseLengthPercentage(part)
        }
        valid = width != null
      }

      BorderStyle.cssNames.contains(part.lowercase()) -> {
        borderStyle = BorderStyle.fromName(part)
        valid = borderStyle != null
      }

      colorRegex.matches(part) -> {
        color = parseColor(part)
        valid = color != null
      }
    }
  }

  if (!valid) {
    return
  }
  style.mBorder = value

  var batch = false
  var dirty = false

  width?.let {
    if (!style.inBatch) {
      style.inBatch = true
      batch = true
    }
    dirty = true
    style.borderWidth = Rect.uniform(it)
  }

  borderStyle?.let {
    if (!style.inBatch) {
      style.inBatch = true
      batch = true
    }
    dirty = true
    style.borderStyle = Rect.uniform(it)
  }

  color?.let {
    if (!style.inBatch) {
      style.inBatch = true
      batch = true
    }
    dirty = true
    style.borderColor = Rect.uniform(it)
  }

  if (dirty) {
    style.mBorderRenderer.invalidate()
  }

  if (batch) {
    style.inBatch = false
  }
}

fun parseBorderRadius(style: Style, value: String) {
  val parts = value.split(SPLIT_REGEX).mapNotNull { parseLengthPercentage(it) }
  when (parts.size) {
    1 -> {
      parts[0].let {
        val point = Point(it, it)
        style.borderTopLeftRadius = point.copy()
        style.borderTopRightRadius = point.copy()
        style.borderBottomRightRadius = point.copy()
        style.borderBottomLeftRadius = point.copy()
      }
    }

    2 -> {
      style.borderTopLeftRadius = Point(parts[0], parts[0])
      style.borderTopRightRadius = Point(parts[1], parts[1])
      style.borderBottomRightRadius = Point(parts[0], parts[0])
      style.borderBottomLeftRadius = Point(parts[1], parts[1])
    }

    3 -> {
      style.borderTopLeftRadius = Point(parts[0], parts[0])
      style.borderTopRightRadius = Point(parts[1], parts[1])
      style.borderBottomRightRadius = Point(parts[2], parts[2])
      style.borderBottomLeftRadius = Point(parts[1], parts[1])
    }

    4 -> {
      style.borderTopLeftRadius = Point(parts[0], parts[0])
      style.borderTopRightRadius = Point(parts[1], parts[1])
      style.borderBottomRightRadius = Point(parts[2], parts[2])
      style.borderBottomLeftRadius = Point(parts[3], parts[3])
    }
  }
}


