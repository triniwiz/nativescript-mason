package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PointF
import android.graphics.RectF
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
        owner.values.get(keys.widthType),
        owner.values.getFloat(keys.widthValue)
      )!!
    }
    set(value) {
      val old = width
      if (old != value) {
        owner.prepareMut()
        owner.values.put(keys.widthType, value.type)
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
        owner.prepareMut()
        owner.values.putInt(keys.color, value)
        if (setState) {
          owner.setOrAppendState(StateKeys.BORDER_COLOR)
        }
      }
    }

  var style: BorderStyle
    get() {
      return BorderStyle.from(owner.values.get(keys.style))
    }
    set(value) {
      val old = style
      if (old != value) {
        owner.prepareMut()
        owner.values.put(keys.style, value.value)
        if (setState) {
          owner.setOrAppendState(StateKeys.BORDER_STYLE)
        }
      }
    }

  var corner1Radius: Point<LengthPercentage>
    get() {
      return Point(
        LengthPercentage.fromTypeValue(
          owner.values.get(keys.corner1RadiusXType),
          owner.values.getFloat(keys.corner1RadiusXValue),
        )!!,
        LengthPercentage.fromTypeValue(
          owner.values.get(keys.corner1RadiusYType),
          owner.values.getFloat(keys.corner1RadiusYValue),
        )!!
      )
    }
    set(value) {
      owner.prepareMut()
      owner.values.put(keys.corner1RadiusXType, value.x.type)
      owner.values.putFloat(keys.corner1RadiusXValue, value.x.value)

      owner.values.put(keys.corner1RadiusYType, value.y.type)
      owner.values.putFloat(keys.corner1RadiusYValue, value.y.value)

      if (setState) {
        owner.setOrAppendState(StateKeys.BORDER_RADIUS)
      }

    }


  var corner2Radius: Point<LengthPercentage>
    get() {
      return Point(
        LengthPercentage.fromTypeValue(
          owner.values.get(keys.corner2RadiusXType),
          owner.values.getFloat(keys.corner2RadiusXValue),
        )!!,
        LengthPercentage.fromTypeValue(
          owner.values.get(keys.corner2RadiusYType),
          owner.values.getFloat(keys.corner2RadiusYValue),
        )!!
      )
    }
    set(value) {
      owner.prepareMut()
      owner.values.put(keys.corner2RadiusXType, value.x.type)
      owner.values.putFloat(keys.corner2RadiusXValue, value.x.value)

      owner.values.put(keys.corner2RadiusYType, value.y.type)
      owner.values.putFloat(keys.corner2RadiusYValue, value.y.value)

      if (setState) {
        owner.setOrAppendState(StateKeys.BORDER_RADIUS)
      }
    }


  var corner1Exponent: Float
    get() = owner.values.getFloat(keys.corner1Exponent)
    set(value) {
      owner.prepareMut()
      owner.values.putFloat(keys.corner1Exponent, value)
      if (setState) {
        owner.setOrAppendState(StateKeys.BORDER_RADIUS)
      }
    }

  var corner2Exponent: Float
    get() = owner.values.getFloat(keys.corner2Exponent)
    set(value) {
      owner.prepareMut()
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

  companion object {
    // Static DashPathEffect instances — avoid allocation per draw
    private val DASH_EFFECT = android.graphics.DashPathEffect(floatArrayOf(10f, 10f), 0f)
    private val DOT_EFFECT = android.graphics.DashPathEffect(floatArrayOf(2f, 8f), 0f)
  }

  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val path = Path()
  private val clipPath = Path()

  // Reusable RectF for arc corner calculations — avoids allocation per corner
  private val cornerRect = RectF()

  // Reusable PointF for passing radius to addCorner/addCornerToPath
  private val tempRadius = PointF()

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
  private var clipPathDirty = true
  private var lastClipWidth = 0f
  private var lastClipHeight = 0f

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
    clipPathDirty = true
  }


  fun getClipPath(width: Float, height: Float): Path {
    // Return cached clip path if nothing changed
    if (!clipPathDirty && width == lastClipWidth && height == lastClipHeight) {
      return clipPath
    }

    clipPathDirty = false
    lastClipWidth = width
    lastClipHeight = height
    clipPath.reset()

    val tl = topLeftCorner
    val tr = topRightCorner
    val br = bottomRightCorner
    val bl = bottomLeftCorner

    // Inset the clip path by half the maximum stroke so strokes draw inside bounds
    val maxStrokeHalf = maxOf(leftWidth, topWidth, rightWidth, bottomWidth) / 2f
    val innerWidth = (width - maxStrokeHalf * 2).coerceAtLeast(0f)
    val innerHeight = (height - maxStrokeHalf * 2).coerceAtLeast(0f)

    // Clamp radii to inner dimensions
    val tlX = tl.x.coerceAtMost(innerWidth / 2f)
    val tlY = tl.y.coerceAtMost(innerHeight / 2f)
    val trX = tr.x.coerceAtMost(innerWidth / 2f)
    val trY = tr.y.coerceAtMost(innerHeight / 2f)
    val brX = br.x.coerceAtMost(innerWidth / 2f)
    val brY = br.y.coerceAtMost(innerHeight / 2f)
    val blX = bl.x.coerceAtMost(innerWidth / 2f)
    val blY = bl.y.coerceAtMost(innerHeight / 2f)

    val ofs = maxStrokeHalf

    clipPath.moveTo(ofs + tlX, ofs)

    // Top edge
    clipPath.lineTo(ofs + innerWidth - trX, ofs)

    // Top-right corner (reuse tempRadius to avoid PointF allocation)
    tempRadius.set(trX, trY)
    addCornerToPath(clipPath, Corner.TOP_RIGHT, tempRadius, topRightExponent, innerWidth, innerHeight)

    // Right edge
    clipPath.lineTo(ofs + innerWidth, ofs + innerHeight - brY)

    // Bottom-right corner
    tempRadius.set(brX, brY)
    addCornerToPath(clipPath, Corner.BOTTOM_RIGHT, tempRadius, bottomRightExponent, innerWidth, innerHeight)

    // Bottom edge
    clipPath.lineTo(ofs + blX, ofs + innerHeight)

    // Bottom-left corner
    tempRadius.set(blX, blY)
    addCornerToPath(clipPath, Corner.BOTTOM_LEFT, tempRadius, bottomLeftExponent, innerWidth, innerHeight)

    // Left edge
    clipPath.lineTo(ofs, ofs + tlY)

    // Top-left corner
    tempRadius.set(tlX, tlY)
    addCornerToPath(clipPath, Corner.TOP_LEFT, tempRadius, topLeftExponent, innerWidth, innerHeight)

    clipPath.close()

    return clipPath
  }

  /** Check if there are any border radii set */
  fun hasRadii(): Boolean {
    return topLeftCorner.x > 0f || topLeftCorner.y > 0f ||
      topRightCorner.x > 0f || topRightCorner.y > 0f ||
      bottomRightCorner.x > 0f || bottomRightCorner.y > 0f ||
      bottomLeftCorner.x > 0f || bottomLeftCorner.y > 0f
  }

  private fun addCornerToPath(
    path: Path,
    corner: Corner,
    radius: PointF,
    exponent: Float,
    width: Float,
    height: Float
  ) {
    if (radius.x <= 0f && radius.y <= 0f) return

    if (exponent == 1f) {
      // Use Android's analytic arc with reusable RectF
      when (corner) {
        Corner.TOP_LEFT -> cornerRect.set(0f, 0f, radius.x * 2, radius.y * 2)
        Corner.TOP_RIGHT -> cornerRect.set(width - radius.x * 2, 0f, width, radius.y * 2)
        Corner.BOTTOM_RIGHT -> cornerRect.set(width - radius.x * 2, height - radius.y * 2, width, height)
        Corner.BOTTOM_LEFT -> cornerRect.set(0f, height - radius.y * 2, radius.x * 2, height)
      }

      val startAngle = when (corner) {
        Corner.TOP_LEFT -> 180f
        Corner.TOP_RIGHT -> 270f
        Corner.BOTTOM_RIGHT -> 0f
        Corner.BOTTOM_LEFT -> 90f
      }

      path.arcTo(cornerRect, startAngle, 90f)
      return
    }

    // Superellipse fallback
    val steps = 16
    for (i in 0..steps) {
      val t = i / steps.toFloat()
      val angle = t * Math.PI / 2.0
      val cx = cos(angle).pow(exponent.toDouble()).toFloat()
      val cy = sin(angle).pow(exponent.toDouble()).toFloat()

      val px: Float
      val py: Float

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
      path.lineTo(px, py)
    }
  }

  fun updateCache(viewWidth: Float, viewHeight: Float) {
    val newHash = computeHash()
    if (!cacheInvalidated && newHash == lastHash) return

    lastHash = newHash
    cacheInvalidated = false
    clipPathDirty = true  // border properties changed, clip path needs rebuild

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
    // Quick bail if all sides are invisible
    if (topStyle == BorderStyle.None && rightStyle == BorderStyle.None &&
      bottomStyle == BorderStyle.None && leftStyle == BorderStyle.None
    ) return
    if (topColor == 0 && rightColor == 0 && bottomColor == 0 && leftColor == 0) return

    // Build path with corners and sides
    buildBorderPath(width, height)

    // Fast path: if all sides share the same color, style, and width, draw once
    if (topColor == rightColor && rightColor == bottomColor && bottomColor == leftColor &&
      topStyle == rightStyle && rightStyle == bottomStyle && bottomStyle == leftStyle &&
      topWidth == rightWidth && rightWidth == bottomWidth && bottomWidth == leftWidth
    ) {
      drawSide(canvas, Side.Top, path, topColor, topStyle)
    } else {
      // Draw each side separately for per-side colors and styles
      drawSide(canvas, Side.Top, path, topColor, topStyle)
      drawSide(canvas, Side.Right, path, rightColor, rightStyle)
      drawSide(canvas, Side.Bottom, path, bottomColor, bottomStyle)
      drawSide(canvas, Side.Left, path, leftColor, leftStyle)
    }
  }

  private enum class Corner { TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT }

  private fun buildBorderPath(width: Float, height: Float) {
    val tl = topLeftCorner
    val tr = topRightCorner
    val br = bottomRightCorner
    val bl = bottomLeftCorner

    path.reset()

    // Inset the border path by half the maximum stroke so strokes draw inside bounds
    val maxStrokeHalf = maxOf(leftWidth, topWidth, rightWidth, bottomWidth) / 2f
    val innerWidth = (width - maxStrokeHalf * 2).coerceAtLeast(0f)
    val innerHeight = (height - maxStrokeHalf * 2).coerceAtLeast(0f)

    // Clamp radii to inner dimensions
    val tlX = tl.x.coerceAtMost(innerWidth / 2f)
    val tlY = tl.y.coerceAtMost(innerHeight / 2f)
    val trX = tr.x.coerceAtMost(innerWidth / 2f)
    val trY = tr.y.coerceAtMost(innerHeight / 2f)
    val brX = br.x.coerceAtMost(innerWidth / 2f)
    val brY = br.y.coerceAtMost(innerHeight / 2f)
    val blX = bl.x.coerceAtMost(innerWidth / 2f)
    val blY = bl.y.coerceAtMost(innerHeight / 2f)

    val ofs = maxStrokeHalf

    path.moveTo(ofs + tlX, ofs)

    // Top edge
    path.lineTo(ofs + innerWidth - trX, ofs)

    // --- Corners (reuse tempRadius to avoid PointF allocation) ---
    tempRadius.set(trX, trY)
    addCorner(path, Corner.TOP_RIGHT, tempRadius, topRightExponent, innerWidth, innerHeight)

    // Right edge
    path.lineTo(ofs + innerWidth, ofs + innerHeight - brY)

    tempRadius.set(brX, brY)
    addCorner(path, Corner.BOTTOM_RIGHT, tempRadius, bottomRightExponent, innerWidth, innerHeight)

    // Bottom edge
    path.lineTo(ofs + blX, ofs + innerHeight)

    tempRadius.set(blX, blY)
    addCorner(path, Corner.BOTTOM_LEFT, tempRadius, bottomLeftExponent, innerWidth, innerHeight)

    // Left edge
    path.lineTo(ofs, ofs + tlY)

    tempRadius.set(tlX, tlY)
    addCorner(path, Corner.TOP_LEFT, tempRadius, topLeftExponent, innerWidth, innerHeight)

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

    if (exponent == 1f) {
      // Use Android's analytic arc with reusable RectF
      when (corner) {
        Corner.TOP_LEFT -> cornerRect.set(0f, 0f, radius.x * 2, radius.y * 2)
        Corner.TOP_RIGHT -> cornerRect.set(width - radius.x * 2, 0f, width, radius.y * 2)
        Corner.BOTTOM_RIGHT -> cornerRect.set(width - radius.x * 2, height - radius.y * 2, width, height)
        Corner.BOTTOM_LEFT -> cornerRect.set(0f, height - radius.y * 2, radius.x * 2, height)
      }

      val startAngle = when (corner) {
        Corner.TOP_LEFT -> 180f
        Corner.TOP_RIGHT -> 270f
        Corner.BOTTOM_RIGHT -> 0f
        Corner.BOTTOM_LEFT -> 90f
      }

      path.arcTo(cornerRect, startAngle, 90f)
      return
    }

    // Superellipse fallback
    val steps = 16
    for (i in 0..steps) {
      val t = i / steps.toFloat()
      val angle = t * Math.PI / 2.0
      val cx = cos(angle).pow(exponent.toDouble()).toFloat()
      val cy = sin(angle).pow(exponent.toDouble()).toFloat()

      val px: Float
      val py: Float

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
      BorderStyle.Dashed -> paint.pathEffect = DASH_EFFECT
      BorderStyle.Dotted -> paint.pathEffect = DOT_EFFECT
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

private val lengthPercentageRegex = Regex("""^(-?\d+(?:\.\d+)?)(px|%|dip|em)?$""")
private val colorRegex = Regex("""^(#\w{3,8}|[a-zA-Z]+)$""")

fun parseLengthPercentage(value: String): LengthPercentage? {
  val match = lengthPercentageRegex.matchEntire(value.trim()) ?: return null
  val num = match.groupValues[1].toFloatOrNull() ?: return null
  val unit = match.groupValues.getOrNull(2)
  return when (unit) {
    "px" -> Points(num)
    "%" -> Percent(num / 100f)
    "dip" -> Points(num * Mason.shared.scale)
    else -> {
      return Points(num * Mason.shared.scale)
    }
  }
}

fun parseLength(style: Style, value: String): Float? {
  val match = lengthPercentageRegex.matchEntire(value.trim()) ?: return null
  val num = match.groupValues[1].toFloatOrNull() ?: return null
  val unit = match.groupValues.getOrNull(2)
  return when (unit) {
    "px" -> num
    "%" -> 0f // don't parse
    "dip" -> num * Mason.shared.scale
    "em" ->  {
      (style.fontSize * Mason.shared.scale) * num
    }
    else -> {
      return num * Mason.shared.scale
    }
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
  val widths = mutableListOf<LengthPercentage>()
  var borderStyle: BorderStyle? = BorderStyle.Solid
  // default to black
  var color: Int? = Color.BLACK

  val split = value.split(SPLIT_REGEX)
  split.forEach { part ->
    when {
      parseLengthPercentage(part) != null -> {
        val parsed = when (part) {
          "thin" -> Points(scale * 1)
          "medium" -> Points(scale * 3)
          "thick" -> Points(scale * 5)
          else -> parseLengthPercentage(part)
        }
        parsed?.let {
          widths.add(it)
          width = it
          valid = true
        }
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

  // If explicit per-side widths provided, map them according to CSS shorthand
  // rules: 1 value -> all sides; 2 values -> top/bottom, right/left;
  // 3 values -> top, right/left, bottom; 4 values -> top, right, bottom, left.
  if (widths.isNotEmpty()) {
    val wRect = when (widths.size) {
      1 -> Rect.uniform(widths[0])
      2 -> Rect(widths[0], widths[1], widths[0], widths[1])
      3 -> Rect(widths[0], widths[1], widths[2], widths[1])
      else -> Rect(widths[0], widths[1], widths[2], widths[3])
    }
    if (!style.inBatch) { style.inBatch = true; batch = true }
    dirty = true
    style.borderWidth = wRect
  } else {
    width?.let {
      if (!style.inBatch) {
        style.inBatch = true
        batch = true
      }
      dirty = true
      style.borderWidth = Rect.uniform(it)
    }
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
  val parts = SPLIT_REGEX
    .split(value.trim().removeSuffix(";"))
    .mapNotNull { parseLengthPercentage(it) }

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
  if (parts.isNotEmpty()) {
    style.mBorderRenderer.invalidate()

    if (!style.inBatch) {
      style.isDirty = StateKeys.BORDER_RADIUS.bits
      style.updateNativeStyle()
    }
  }
}


