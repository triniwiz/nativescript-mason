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
import java.nio.ByteBuffer
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
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
      val base = LengthPercentage.fromTypeValue(
        owner.values.get(keys.widthType),
        owner.values.getFloat(keys.widthValue)
      )!!
      return owner.resolvePseudo(StateKeys.BORDER, base) { buf ->
        LengthPercentage.fromTypeValue(buf.get(keys.widthType), buf.getFloat(keys.widthValue))!!
      }
    }
    set(value) {
      val oldType = owner.values.get(keys.widthType)
      val oldValue = owner.values.getFloat(keys.widthValue)
      if (oldType != value.type || oldValue != value.value) {
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
      val base = owner.values.getInt(keys.color)
      return owner.resolvePseudo(StateKeys.BORDER_COLOR, base) { buf -> buf.getInt(keys.color) }
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
      val base = BorderStyle.from(owner.values.get(keys.style))
      return owner.resolvePseudo(StateKeys.BORDER_STYLE, base) { buf ->
        BorderStyle.from(
          buf.get(
            keys.style
          )
        )
      }
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

  private fun readCorner1From(buf: ByteBuffer): Point<LengthPercentage> {
    return Point(
      LengthPercentage.fromTypeValue(
        buf.get(keys.corner1RadiusXType),
        buf.getFloat(keys.corner1RadiusXValue)
      )!!,
      LengthPercentage.fromTypeValue(
        buf.get(keys.corner1RadiusYType),
        buf.getFloat(keys.corner1RadiusYValue)
      )!!
    )
  }

  var corner1Radius: Point<LengthPercentage>
    get() {
      val base = readCorner1From(owner.values)
      return owner.resolvePseudo(StateKeys.BORDER_RADIUS, base) { buf -> readCorner1From(buf) }
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


  private fun readCorner2From(buf: ByteBuffer): Point<LengthPercentage> {
    return Point(
      LengthPercentage.fromTypeValue(
        buf.get(keys.corner2RadiusXType),
        buf.getFloat(keys.corner2RadiusXValue)
      )!!,
      LengthPercentage.fromTypeValue(
        buf.get(keys.corner2RadiusYType),
        buf.getFloat(keys.corner2RadiusYValue)
      )!!
    )
  }

  var corner2Radius: Point<LengthPercentage>
    get() {
      val base = readCorner2From(owner.values)
      return owner.resolvePseudo(StateKeys.BORDER_RADIUS, base) { buf -> readCorner2From(buf) }
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
    get() {
      val base = owner.values.getFloat(keys.corner1Exponent)
      return owner.resolvePseudo(
        StateKeys.BORDER_RADIUS,
        base
      ) { buf -> buf.getFloat(keys.corner1Exponent) }
    }
    set(value) {
      owner.prepareMut()
      owner.values.putFloat(keys.corner1Exponent, value)
      if (setState) {
        owner.setOrAppendState(StateKeys.BORDER_RADIUS)
      }
    }

  var corner2Exponent: Float
    get() {
      val base = owner.values.getFloat(keys.corner2Exponent)
      return owner.resolvePseudo(
        StateKeys.BORDER_RADIUS,
        base
      ) { buf -> buf.getFloat(keys.corner2Exponent) }
    }
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
  }

  private val paint by lazy(LazyThreadSafetyMode.NONE) { Paint(Paint.ANTI_ALIAS_FLAG) }
  private val path by lazy(LazyThreadSafetyMode.NONE) { Path() }
  private val ringPath by lazy(LazyThreadSafetyMode.NONE) { Path() }

  // Reused across draws: Path and Paint are native-backed, so allocating them per frame churns the GC.
  private val insetPathA by lazy(LazyThreadSafetyMode.NONE) { Path() }
  private val insetPathB by lazy(LazyThreadSafetyMode.NONE) { Path() }
  private val ringFillPaint by lazy(LazyThreadSafetyMode.NONE) { Paint() }
  private val clipPath by lazy(LazyThreadSafetyMode.NONE) { Path() }
  private val outerClipPath by lazy(LazyThreadSafetyMode.NONE) { Path() }

  // Reusable RectF for arc corner calculations — avoids allocation per corner
  private val cornerRect = RectF()
  // Reusable RectF for addRoundRect calls
  private val roundRectBounds = RectF()

  // Reusable PointF for passing radius to addCorner/addCornerToPath
  private val tempRadius = PointF()

  /**
   * CSS spec proportional radius reduction.
   * If the sum of adjacent radii on any side exceeds the side's length,
   * all radii are scaled down by the minimum ratio so they fit.
   * Returns the scale factor (1.0 if no reduction needed).
   */
  private fun cssRadiusScale(
    w: Float, h: Float,
    tl: PointF = topLeftCorner, tr: PointF = topRightCorner,
    br: PointF = bottomRightCorner, bl: PointF = bottomLeftCorner
  ): Float {
    var f = 1f
    val topSum = tl.x + tr.x
    if (topSum > 0f) f = f.coerceAtMost(w / topSum)
    val rightSum = tr.y + br.y
    if (rightSum > 0f) f = f.coerceAtMost(h / rightSum)
    val bottomSum = bl.x + br.x
    if (bottomSum > 0f) f = f.coerceAtMost(w / bottomSum)
    val leftSum = tl.y + bl.y
    if (leftSum > 0f) f = f.coerceAtMost(h / leftSum)
    return f.coerceAtMost(1f)
  }

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
  private var outerClipPathDirty = true
  private var lastClipWidth = 0f
  private var lastClipHeight = 0f
  private var lastOuterClipWidth = 0f
  private var lastOuterClipHeight = 0f

  private fun computeHash(): Int {
    var result = 17

    // Border widths: use raw type + float bits to avoid allocating LengthPercentage
    val leftKeys = style.mBorderLeft.keys
    val topKeys = style.mBorderTop.keys
    val rightKeys = style.mBorderRight.keys
    val bottomKeys = style.mBorderBottom.keys

    result = 31 * result + style.values.get(leftKeys.widthType)
    result =
      31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(leftKeys.widthValue))

    result = 31 * result + style.values.get(topKeys.widthType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(topKeys.widthValue))

    result = 31 * result + style.values.get(rightKeys.widthType)
    result =
      31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(rightKeys.widthValue))

    result = 31 * result + style.values.get(bottomKeys.widthType)
    result =
      31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(bottomKeys.widthValue))

    // Colors (ints)
    result = 31 * result + style.mBorderLeft.color
    result = 31 * result + style.mBorderTop.color
    result = 31 * result + style.mBorderRight.color
    result = 31 * result + style.mBorderBottom.color

    // Border radii: read raw type/value for each corner to avoid allocating Points/LengthPercentage
    val tl = Border.cornerTopLeftKeys
    result = 31 * result + style.values.get(tl.xType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(tl.xValue))
    result = 31 * result + style.values.get(tl.yType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(tl.yValue))

    val tr = Border.cornerTopRightKeys
    result = 31 * result + style.values.get(tr.xType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(tr.xValue))
    result = 31 * result + style.values.get(tr.yType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(tr.yValue))

    val br = Border.cornerBottomRightKeys
    result = 31 * result + style.values.get(br.xType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(br.xValue))
    result = 31 * result + style.values.get(br.yType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(br.yValue))

    val bl = Border.cornerBottomLeftKeys
    result = 31 * result + style.values.get(bl.xType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(bl.xValue))
    result = 31 * result + style.values.get(bl.yType)
    result = 31 * result + java.lang.Float.floatToIntBits(style.values.getFloat(bl.yValue))

    // Exponents (floats)
    result = 31 * result + java.lang.Float.floatToIntBits(style.mBorderLeft.corner1Exponent)
    result = 31 * result + java.lang.Float.floatToIntBits(style.mBorderLeft.corner2Exponent)
    result = 31 * result + java.lang.Float.floatToIntBits(style.mBorderRight.corner1Exponent)
    result = 31 * result + java.lang.Float.floatToIntBits(style.mBorderRight.corner2Exponent)

    return result
  }

  fun invalidate() {
    cacheInvalidated = true
    clipPathDirty = true
    outerClipPathDirty = true
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

    // CSS spec proportional radius reduction on the outer box, then inset the
    // radii so the clipped content follows the same curve family inside the border.
    val f = cssRadiusScale(width, height)
    val tlX = insetRadius(tl.x * f, maxStrokeHalf)
    val tlY = insetRadius(tl.y * f, maxStrokeHalf)
    val trX = insetRadius(tr.x * f, maxStrokeHalf)
    val trY = insetRadius(tr.y * f, maxStrokeHalf)
    val brX = insetRadius(br.x * f, maxStrokeHalf)
    val brY = insetRadius(br.y * f, maxStrokeHalf)
    val blX = insetRadius(bl.x * f, maxStrokeHalf)
    val blY = insetRadius(bl.y * f, maxStrokeHalf)

    val ofs = maxStrokeHalf

    clipPath.moveTo(ofs + tlX, ofs)

    // Top edge
    clipPath.lineTo(ofs + innerWidth - trX, ofs)

    // Top-right corner (reuse tempRadius to avoid PointF allocation)
    tempRadius.set(trX, trY)
    addCornerToPath(
      clipPath,
      Corner.TOP_RIGHT,
      tempRadius,
      topRightExponent,
      innerWidth,
      innerHeight,
      ofs
    )

    // Right edge
    clipPath.lineTo(ofs + innerWidth, ofs + innerHeight - brY)

    // Bottom-right corner
    tempRadius.set(brX, brY)
    addCornerToPath(
      clipPath,
      Corner.BOTTOM_RIGHT,
      tempRadius,
      bottomRightExponent,
      innerWidth,
      innerHeight,
      ofs
    )

    // Bottom edge
    clipPath.lineTo(ofs + blX, ofs + innerHeight)

    // Bottom-left corner
    tempRadius.set(blX, blY)
    addCornerToPath(
      clipPath,
      Corner.BOTTOM_LEFT,
      tempRadius,
      bottomLeftExponent,
      innerWidth,
      innerHeight,
      ofs
    )

    // Left edge
    clipPath.lineTo(ofs, ofs + tlY)

    // Top-left corner
    tempRadius.set(tlX, tlY)
    addCornerToPath(
      clipPath,
      Corner.TOP_LEFT,
      tempRadius,
      topLeftExponent,
      innerWidth,
      innerHeight,
      ofs
    )

    clipPath.close()

    return clipPath
  }

  /**
   * Outer clip path at full view bounds (no border inset).
   * Used to clip the entire view to the border-radius shape, matching CSS behavior
   * where border-radius clips everything including corners.
   */
  fun getOuterClipPath(width: Float, height: Float): Path {
    if (!outerClipPathDirty && width == lastOuterClipWidth && height == lastOuterClipHeight && !outerClipPath.isEmpty) {
      return outerClipPath
    }

    outerClipPath.reset()

    val f = cssRadiusScale(width, height)
    val tlX = topLeftCorner.x * f
    val tlY = topLeftCorner.y * f
    val trX = topRightCorner.x * f
    val trY = topRightCorner.y * f
    val brX = bottomRightCorner.x * f
    val brY = bottomRightCorner.y * f
    val blX = bottomLeftCorner.x * f
    val blY = bottomLeftCorner.y * f

    val hasSuperellipse = topLeftExponent != 1f || topRightExponent != 1f ||
      bottomRightExponent != 1f || bottomLeftExponent != 1f

    if (!hasSuperellipse) {
      val radii = floatArrayOf(tlX, tlY, trX, trY, brX, brY, blX, blY)
      roundRectBounds.set(0f, 0f, width, height)
      outerClipPath.addRoundRect(roundRectBounds, radii, Path.Direction.CW)
    } else {
      outerClipPath.moveTo(tlX, 0f)

      // Top edge
      outerClipPath.lineTo(width - trX, 0f)

      // Top-right corner
      tempRadius.set(trX, trY)
      addCornerToPath(outerClipPath, Corner.TOP_RIGHT, tempRadius, topRightExponent, width, height)

      // Right edge
      outerClipPath.lineTo(width, height - brY)

      // Bottom-right corner
      tempRadius.set(brX, brY)
      addCornerToPath(
        outerClipPath,
        Corner.BOTTOM_RIGHT,
        tempRadius,
        bottomRightExponent,
        width,
        height
      )

      // Bottom edge
      outerClipPath.lineTo(blX, height)

      // Bottom-left corner
      tempRadius.set(blX, blY)
      addCornerToPath(
        outerClipPath,
        Corner.BOTTOM_LEFT,
        tempRadius,
        bottomLeftExponent,
        width,
        height
      )

      // Left edge
      outerClipPath.lineTo(0f, tlY)

      // Top-left corner
      tempRadius.set(tlX, tlY)
      addCornerToPath(outerClipPath, Corner.TOP_LEFT, tempRadius, topLeftExponent, width, height)

      outerClipPath.close()
    }

    // Cache dimensions to allow short-circuit returns on subsequent calls
    outerClipPathDirty = false
    lastOuterClipWidth = width
    lastOuterClipHeight = height

    return outerClipPath
  }

  fun uniformRadius(width: Float, height: Float): Float {
    if (topLeftExponent != 1f || topRightExponent != 1f ||
      bottomRightExponent != 1f || bottomLeftExponent != 1f
    ) return -1f
    val r = topLeftCorner.x
    if (topLeftCorner.y != r || topRightCorner.x != r || topRightCorner.y != r ||
      bottomRightCorner.x != r || bottomRightCorner.y != r ||
      bottomLeftCorner.x != r || bottomLeftCorner.y != r
    ) return -1f
    return r * cssRadiusScale(width, height)
  }

  /** Check if there are any border radii set */
  fun hasRadii(): Boolean {
    return topLeftCorner.x > 0f || topLeftCorner.y > 0f ||
      topRightCorner.x > 0f || topRightCorner.y > 0f ||
      bottomRightCorner.x > 0f || bottomRightCorner.y > 0f ||
      bottomLeftCorner.x > 0f || bottomLeftCorner.y > 0f
  }

  /** [getRadii] without allocating, into [out] (8 floats). Valid after updateCache(). */
  fun copyRadii(out: FloatArray) {
    out[0] = topLeftCorner.x; out[1] = topLeftCorner.y
    out[2] = topRightCorner.x; out[3] = topRightCorner.y
    out[4] = bottomRightCorner.x; out[5] = bottomRightCorner.y
    out[6] = bottomLeftCorner.x; out[7] = bottomLeftCorner.y
  }

  /**
   * Returns border radii as FloatArray(8) for use with Path.addRoundRect.
   * Format: [topLeftX, topLeftY, topRightX, topRightY, bottomRightX, bottomRightY, bottomLeftX, bottomLeftY]
   */
  fun getRadii(): FloatArray {
    return floatArrayOf(
      topLeftCorner.x, topLeftCorner.y,
      topRightCorner.x, topRightCorner.y,
      bottomRightCorner.x, bottomRightCorner.y,
      bottomLeftCorner.x, bottomLeftCorner.y
    )
  }

  private fun addCornerToPath(
    path: Path,
    corner: Corner,
    radius: PointF,
    exponent: Float,
    width: Float,
    height: Float,
    ofs: Float = 0f
  ) {
    if (radius.x <= 0f && radius.y <= 0f) return

    if (exponent == 1f) {
      // Use Android's analytic arc with reusable RectF
      when (corner) {
        Corner.TOP_LEFT -> cornerRect.set(ofs, ofs, ofs + radius.x * 2, ofs + radius.y * 2)
        Corner.TOP_RIGHT -> cornerRect.set(
          ofs + width - radius.x * 2,
          ofs,
          ofs + width,
          ofs + radius.y * 2
        )

        Corner.BOTTOM_RIGHT -> cornerRect.set(
          ofs + width - radius.x * 2,
          ofs + height - radius.y * 2,
          ofs + width,
          ofs + height
        )

        Corner.BOTTOM_LEFT -> cornerRect.set(
          ofs,
          ofs + height - radius.y * 2,
          ofs + radius.x * 2,
          ofs + height
        )
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

      var px: Float
      var py: Float

      when (corner) {
        Corner.TOP_LEFT -> {
          px = radius.x * (1 - cx); py = radius.y * (1 - cy)
        }

        Corner.TOP_RIGHT -> {
          px = width - radius.x * (1 - cy); py = radius.y * (1 - cx)
        }

        Corner.BOTTOM_RIGHT -> {
          px = width - radius.x * (1 - cx); py = height - radius.y * (1 - cy)
        }

        Corner.BOTTOM_LEFT -> {
          px = radius.x * (1 - cy); py = height - radius.y * (1 - cx)
        }
      }

      // offset by ofs to convert from local (0..width/height) coords to absolute
      px += ofs
      py += ofs
      path.lineTo(px, py)
    }
  }

  fun updateCache(viewWidth: Float, viewHeight: Float) {
    val newHash = computeHash()
    if (!cacheInvalidated && newHash == lastHash) return

    lastHash = newHash
    cacheInvalidated = false
    clipPathDirty = true  // border properties changed, clip path needs rebuild
    outerClipPathDirty = true

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

    setCorner(topLeftCorner, Border.cornerTopLeftKeys, viewWidth, viewHeight)
    setCorner(topRightCorner, Border.cornerTopRightKeys, viewWidth, viewHeight)
    setCorner(bottomRightCorner, Border.cornerBottomRightKeys, viewWidth, viewHeight)
    setCorner(bottomLeftCorner, Border.cornerBottomLeftKeys, viewWidth, viewHeight)

    // Exponents
    topLeftExponent = style.mBorderTop.corner1Exponent       // Top-Left
    topRightExponent = style.mBorderTop.corner2Exponent       // Top-Right
    bottomRightExponent = style.mBorderBottom.corner2Exponent    // Bottom-Right
    bottomLeftExponent = style.mBorderBottom.corner1Exponent    // Bottom-Left

  }

  private fun setCorner(corner: PointF, keys: Border.IKeyCorner, viewWidth: Float, viewHeight: Float) {
    val values = style.values
    corner.x = lengthPx(values.get(keys.xType), values.getFloat(keys.xValue), viewWidth)
    corner.y = lengthPx(values.get(keys.yType), values.getFloat(keys.yValue), viewHeight)
  }

  private fun lengthPx(type: Byte, value: Float, size: Float): Float =
    if (type == LengthPercentage.Kind.Percent.value) value * size else value

  // Valid after updateCache().
  fun hasVisibleBorder(): Boolean {
    if (topStyle == BorderStyle.None && rightStyle == BorderStyle.None &&
      bottomStyle == BorderStyle.None && leftStyle == BorderStyle.None
    ) return false
    if (topColor == 0 && rightColor == 0 && bottomColor == 0 && leftColor == 0) return false
    return !(topWidth <= 0f && rightWidth <= 0f && bottomWidth <= 0f && leftWidth <= 0f)
  }

  /** Draws the border into the canvas */
  fun draw(canvas: Canvas, width: Float, height: Float) {
    if (!hasVisibleBorder()) return

    if (drawUniformSolid(canvas, width, height)) return
    paintRings(canvas, width, height)
  }

  /** The rounded edge [f] of the way from the border edge to the padding edge. */
  private fun buildEdgePath(f: Float, width: Float, height: Float, into: Path): Path {
    val l = leftWidth * f
    val t = topWidth * f
    val r = rightWidth * f
    val b = bottomWidth * f
    val w = (width - l - r).coerceAtLeast(0f)
    val h = (height - t - b).coerceAtLeast(0f)
    val s = cssRadiusScale(width, height)
    val tlX = (topLeftCorner.x * s - l).coerceAtLeast(0f)
    val tlY = (topLeftCorner.y * s - t).coerceAtLeast(0f)
    val trX = (topRightCorner.x * s - r).coerceAtLeast(0f)
    val trY = (topRightCorner.y * s - t).coerceAtLeast(0f)
    val brX = (bottomRightCorner.x * s - r).coerceAtLeast(0f)
    val brY = (bottomRightCorner.y * s - b).coerceAtLeast(0f)
    val blX = (bottomLeftCorner.x * s - l).coerceAtLeast(0f)
    val blY = (bottomLeftCorner.y * s - b).coerceAtLeast(0f)

    into.reset()
    into.moveTo(tlX, 0f)
    into.lineTo(w - trX, 0f)
    tempRadius.set(trX, trY)
    addCorner(into, Corner.TOP_RIGHT, tempRadius, topRightExponent, w, h, 0f)
    into.lineTo(w, h - brY)
    tempRadius.set(brX, brY)
    addCorner(into, Corner.BOTTOM_RIGHT, tempRadius, bottomRightExponent, w, h, 0f)
    into.lineTo(blX, h)
    tempRadius.set(blX, blY)
    addCorner(into, Corner.BOTTOM_LEFT, tempRadius, bottomLeftExponent, w, h, 0f)
    into.lineTo(0f, tlY)
    tempRadius.set(tlX, tlY)
    addCorner(into, Corner.TOP_LEFT, tempRadius, topLeftExponent, w, h, 0f)
    into.close()
    into.offset(l, t)
    return into
  }

  private val ringFill by lazy(LazyThreadSafetyMode.NONE) {
    Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL; isDither = true }
  }
  private val ringPart = Path()
  private val sidePath = Path()
  private val splitTL = PointF()
  private val splitTR = PointF()
  private val splitBR = PointF()
  private val splitBL = PointF()

  // Where a corner's dividing line ends: from the outer corner through the inner one (inset by
  // the border widths) out to the radius box, capped at half the view so the lines can't cross.
  // Stopping at the inner corner would leave a rounded corner's curve out of both sides.
  private fun cornerSplit(
    x: Float, y: Float, dirX: Float, dirY: Float,
    insetX: Float, insetY: Float, radiusX: Float, radiusY: Float, width: Float, height: Float, out: PointF
  ) {
    val boxX = min(max(radiusX, insetX), width / 2f)
    val boxY = min(max(radiusY, insetY), height / 2f)
    val tx = if (insetX > 0f) boxX / insetX else Float.POSITIVE_INFINITY
    val ty = if (insetY > 0f) boxY / insetY else Float.POSITIVE_INFINITY
    val t = min(tx, ty).let { if (it.isInfinite()) 0f else it }
    out.set(x + dirX * insetX * t, y + dirY * insetY * t)
  }

  // Shared with Windows' PaintBorder: each style fills rings between rounded edges, split per
  // side by the corner diagonals, so radii, double lines and 3D shades follow the shape.
  private fun paintRings(canvas: Canvas, width: Float, height: Float) {
    val styles = arrayOf(topStyle, rightStyle, bottomStyle, leftStyle)
    val colors = intArrayOf(topColor, rightColor, bottomColor, leftColor)
    val widths = floatArrayOf(topWidth, rightWidth, bottomWidth, leftWidth)
    val drawn = (0 until 4).filter {
      widths[it] > 0f && styles[it] != BorderStyle.None && styles[it] != BorderStyle.Hidden && Color.alpha(colors[it]) > 0
    }
    if (drawn.isEmpty()) return

    // Dotted or dashed alike on every side: one stroke along the middle of the border.
    val first = drawn[0]
    val patterned = styles[first] == BorderStyle.Dashed || styles[first] == BorderStyle.Dotted
    if (patterned && drawn.size == 4 &&
      drawn.all { styles[it] == styles[first] && widths[it] == widths[first] && colors[it] == colors[first] }
    ) {
      val w = widths[first]
      val dotted = styles[first] == BorderStyle.Dotted
      strokePaint.color = colors[first]
      strokePaint.strokeWidth = w
      strokePaint.strokeCap = if (dotted) Paint.Cap.ROUND else Paint.Cap.BUTT
      strokePaint.strokeJoin = Paint.Join.ROUND
      strokePaint.pathEffect = android.graphics.DashPathEffect(
        if (dotted) floatArrayOf(0f, w * 2) else floatArrayOf(w * 2, w * 2), 0f
      )
      canvas.drawPath(buildEdgePath(0.5f, width, height, insetPathA), strokePaint)
      strokePaint.pathEffect = null
      strokePaint.strokeCap = Paint.Cap.BUTT
      return
    }

    val allDouble = drawn.all { styles[it] == BorderStyle.Double }
    val bands = if (allDouble) arrayOf(0f to 1f / 3f, 2f / 3f to 1f) else arrayOf(0f to 1f)
    // inset and groove darken the top and left; outset and ridge the bottom and right.
    fun shade(i: Int): Float {
      val topLeft = i == 0 || i == 3
      return when (styles[i]) {
        BorderStyle.Inset, BorderStyle.Groove -> if (topLeft) 0.6f else 1f
        BorderStyle.Outset, BorderStyle.Ridge -> if (topLeft) 1f else 0.6f
        else -> 1f
      }
    }
    fun color(i: Int): Int {
      val f = shade(i)
      val c = colors[i]
      if (f == 1f) return c
      return Color.argb(Color.alpha(c), (Color.red(c) * f).toInt(), (Color.green(c) * f).toInt(), (Color.blue(c) * f).toInt())
    }
    // A side with no width adds nothing to the ring, so it needn't match.
    val oneColor = drawn.all { colors[it] == colors[drawn[0]] && shade(it) == 1f } &&
      (0 until 4).all { it in drawn || widths[it] <= 0f }
    val s = cssRadiusScale(width, height)
    cornerSplit(0f, 0f, 1f, 1f, leftWidth, topWidth, topLeftCorner.x * s, topLeftCorner.y * s, width, height, splitTL)
    cornerSplit(width, 0f, -1f, 1f, rightWidth, topWidth, topRightCorner.x * s, topRightCorner.y * s, width, height, splitTR)
    cornerSplit(width, height, -1f, -1f, rightWidth, bottomWidth, bottomRightCorner.x * s, bottomRightCorner.y * s, width, height, splitBR)
    cornerSplit(0f, height, 1f, -1f, leftWidth, bottomWidth, bottomLeftCorner.x * s, bottomLeftCorner.y * s, width, height, splitBL)

    for ((from, to) in bands) {
      ringPath.reset()
      ringPath.op(buildEdgePath(from, width, height, insetPathA), buildEdgePath(to, width, height, insetPathB), Path.Op.DIFFERENCE)
      if (oneColor) {
        ringFill.color = colors[drawn[0]]
        canvas.drawPath(ringPath, ringFill)
        continue
      }
      for (i in drawn) {
        sidePath.reset()
        when (i) {
          0 -> { sidePath.moveTo(0f, 0f); sidePath.lineTo(width, 0f); sidePath.lineTo(splitTR.x, splitTR.y); sidePath.lineTo(splitTL.x, splitTL.y) }
          1 -> { sidePath.moveTo(width, 0f); sidePath.lineTo(width, height); sidePath.lineTo(splitBR.x, splitBR.y); sidePath.lineTo(splitTR.x, splitTR.y) }
          2 -> { sidePath.moveTo(0f, height); sidePath.lineTo(splitBL.x, splitBL.y); sidePath.lineTo(splitBR.x, splitBR.y); sidePath.lineTo(width, height) }
          else -> { sidePath.moveTo(0f, 0f); sidePath.lineTo(splitTL.x, splitTL.y); sidePath.lineTo(splitBL.x, splitBL.y); sidePath.lineTo(0f, height) }
        }
        sidePath.close()
        if (!ringPart.op(ringPath, sidePath, Path.Op.INTERSECT)) continue
        ringFill.color = color(i)
        canvas.drawPath(ringPart, ringFill)
      }
    }
  }

  private val strokePaint by lazy(LazyThreadSafetyMode.NONE) {
    Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.STROKE
      isDither = true
    }
  }

  private fun drawUniformSolid(canvas: Canvas, width: Float, height: Float): Boolean {
    if (topStyle != BorderStyle.Solid || rightStyle != BorderStyle.Solid ||
      bottomStyle != BorderStyle.Solid || leftStyle != BorderStyle.Solid
    ) return false
    if (topColor != rightColor || rightColor != bottomColor || bottomColor != leftColor) return false
    val bw = topWidth
    if (bw <= 0f || bw != rightWidth || bw != bottomWidth || bw != leftWidth) return false
    val r = uniformRadius(width, height)
    if (r != 0f && r < bw) return false

    val half = bw / 2f
    strokePaint.color = topColor
    strokePaint.strokeWidth = bw
    if (r == 0f) {
      strokePaint.strokeJoin = Paint.Join.MITER
      canvas.drawRect(half, half, width - half, height - half, strokePaint)
    } else {
      strokePaint.strokeJoin = Paint.Join.ROUND
      canvas.drawRoundRect(half, half, width - half, height - half, r - half, r - half, strokePaint)
    }
    return true
  }

  private enum class Corner { TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT }

  private fun addCorner(
    path: Path,
    corner: Corner,
    radius: PointF,
    exponent: Float,
    width: Float,
    height: Float,
    ofs: Float = 0f
  ) {
    if (radius.x <= 0f && radius.y <= 0f) return

    if (exponent == 1f) {
      // Use Android's analytic arc with reusable RectF
      when (corner) {
        Corner.TOP_LEFT -> cornerRect.set(ofs, ofs, ofs + radius.x * 2, ofs + radius.y * 2)
        Corner.TOP_RIGHT -> cornerRect.set(
          ofs + width - radius.x * 2,
          ofs,
          ofs + width,
          ofs + radius.y * 2
        )

        Corner.BOTTOM_RIGHT -> cornerRect.set(
          ofs + width - radius.x * 2,
          ofs + height - radius.y * 2,
          ofs + width,
          ofs + height
        )

        Corner.BOTTOM_LEFT -> cornerRect.set(
          ofs,
          ofs + height - radius.y * 2,
          ofs + radius.x * 2,
          ofs + height
        )
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

      var px: Float
      var py: Float

      when (corner) {
        Corner.TOP_LEFT -> {
          px = radius.x * (1 - cx); py = radius.y * (1 - cy)
        }

        Corner.TOP_RIGHT -> {
          px = width - radius.x * (1 - cy); py = radius.y * (1 - cx)
        }

        Corner.BOTTOM_RIGHT -> {
          px = width - radius.x * (1 - cx); py = height - radius.y * (1 - cy)
        }

        Corner.BOTTOM_LEFT -> {
          px = radius.x * (1 - cy); py = height - radius.y * (1 - cx)
        }
      }
      px += ofs
      py += ofs
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

  private fun insetRadius(radius: Float, inset: Float): Float {
    return (radius - inset).coerceAtLeast(0f)
  }

  enum class Side { Left, Top, Right, Bottom }
}

// `px` is a CSS pixel (the same size as a dip), matching the web and iOS's
// BorderParser; `dppx` is the escape hatch for a literal device pixel.
// Alternation order matters: `dppx` also ends with `px`, and `rem` with `em`.
internal val lengthPercentageRegex = Regex("""^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(dppx|px|%|dip|rem|em|vmin|vmax|vw|vh|pt)?$""")

private val lengthUnits = setOf("dppx", "px", "%", "dip", "rem", "em", "vmin", "vmax", "vw", "vh", "pt")

internal class NumberUnit(@JvmField val num: Float, @JvmField val unit: String?)

internal fun scanNumberUnit(value: String): NumberUnit? {
  val n = value.length
  var i = 0
  if (i < n && value[i] == '-') i++
  fun digits(): Boolean {
    val start = i
    while (i < n && value[i] in '0'..'9') i++
    return i > start
  }
  if (!digits()) return null
  if (i < n && value[i] == '.') {
    i++
    if (!digits()) return null
  }
  if (i < n && (value[i] == 'e' || value[i] == 'E')) {
    val mark = i
    i++
    if (i < n && (value[i] == '+' || value[i] == '-')) i++
    if (!digits()) i = mark
  }
  val num = try {
    java.lang.Float.parseFloat(value.substring(0, i))
  } catch (_: NumberFormatException) {
    return null
  }
  if (i == n) return NumberUnit(num, null)
  val unit = value.substring(i)
  return if (unit in lengthUnits) NumberUnit(num, unit) else null
}

internal inline fun forEachWhitespaceToken(value: String, block: (String) -> Unit) {
  val n = value.length
  var i = 0
  while (i < n) {
    while (i < n && value[i].isRegexSpace()) i++
    val start = i
    while (i < n && !value[i].isRegexSpace()) i++
    if (i > start) block(value.substring(start, i))
  }
}

@Suppress("NOTHING_TO_INLINE")
internal inline fun Char.isRegexSpace(): Boolean =
  this == ' ' || this == '\t' || this == '\n' || this == '\u000B' || this == '\u000C' || this == '\r'

/** 1pt = 1/72in and 1 CSS px = 1/96in, so a point is 96/72 CSS px. */
private const val PX_PER_PT = 96f / 72f

/**
 * CSS px for one length token, before the density multiply. `em` resolves
 * against [emBasis] (the element's own font size) when given, else the root
 * font size — matching `tokenToDevicePx` in style.ts.
 */
internal fun cssPxForUnit(num: Float, unit: String?, emBasis: Float?): Float {
  val mason = Mason.shared
  return when (unit) {
    "rem" -> num * mason.rootFontSize
    "em" -> num * (emBasis?.takeIf { it > 0f } ?: mason.rootFontSize)
    "pt" -> num * PX_PER_PT
    "vw" -> (num / 100f) * mason.viewportWidth
    "vh" -> (num / 100f) * mason.viewportHeight
    "vmin" -> (num / 100f) * minOf(mason.viewportWidth, mason.viewportHeight)
    "vmax" -> (num / 100f) * maxOf(mason.viewportWidth, mason.viewportHeight)
    else -> num
  }
}

// allow hex, simple names, and functional color forms like rgb(...), rgba(...), hsl(...)
private val colorRegex = Regex("""^(#\w{3,8}|[a-zA-Z]+|(?:rgb|rgba|hsl|hsla|hsv|hsva)\([^)]*\))$""")

fun parseLengthPercentage(value: String): LengthPercentage? {
  val match = scanNumberUnit(value.trim()) ?: return null
  val raw = match.num
  // Clamp values that exceed a practical maximum (e.g. Float.MAX_VALUE from
  // calc(infinity*1px) evaluated by NS's CSS parser) so cssRadiusScale()
  // doesn't overflow when summing corner pairs.
  val num = raw.coerceIn(-9999f, 9999f)
  val unit = match.unit
  return when (unit) {
    "dppx" -> Points(num)
    "%" -> Percent(raw / 100f)  // percentages don't overflow so use raw
    else -> Points(cssPxForUnit(num, unit, null) * Mason.shared.scale)
  }
}

fun parseLengthPercentageAuto(value: String): LengthPercentageAuto? {
  val trimmed = value.trim()
  // "auto" has no numeric part, so it can never match lengthPercentageRegex
  // below (its first group is a mandatory digit run) — check it separately.
  if (trimmed == "auto") return LengthPercentageAuto.Auto
  val match = scanNumberUnit(trimmed) ?: return null
  val num = match.num
  val unit = match.unit
  return when (unit) {
    "dppx" -> LengthPercentageAuto.Points(num)
    "%" -> LengthPercentageAuto.Percent(num / 100f)
    else -> LengthPercentageAuto.Points(cssPxForUnit(num, unit, null) * Mason.shared.scale)
  }
}

fun parseLength(style: Style, value: String): Float? {
  val match = scanNumberUnit(value.trim()) ?: return null
  val num = match.num
  val unit = match.unit
  return when (unit) {
    "dppx" -> num
    "%" -> 0f // don't parse
    // This one has a style in hand, so `em` can use the element's own font size.
    else -> cssPxForUnit(num, unit, style.fontSize.toFloat()) * Mason.shared.scale
  }
}

/**
 * Split on top-level whitespace but preserve parentheses groups (e.g. "rgba(0, 1, 2)").
 */
internal fun splitTopLevelWhitespace(input: String): List<String> {
  val result = mutableListOf<String>()
  val sb = StringBuilder()
  var depth = 0
  for (c in input) {
    when (c) {
      '(' -> {
        depth++
        sb.append(c)
      }

      ')' -> {
        depth = maxOf(0, depth - 1)
        sb.append(c)
      }

      else -> {
        if (c.isWhitespace() && depth == 0) {
          if (sb.isNotEmpty()) {
            result.add(sb.toString())
            sb.setLength(0)
          }
        } else {
          sb.append(c)
        }
      }
    }
  }
  if (sb.isNotEmpty()) result.add(sb.toString())
  return result
}

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
      style.invalidateBorderRenderer()
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

  val split = splitTopLevelWhitespace(value)
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
    if (!style.inBatch) {
      style.inBatch = true; batch = true
    }
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
    style.invalidateBorderRenderer()
  }

  if (batch) {
    style.inBatch = false
  }
}

/**
 * Parse a side-specific CSS border shorthand, e.g. `border-left: 4px solid #00B894`.
 * Applies width, style, and color only to the specified side.
 */
fun parseBorderSideShorthand(style: Style, side: Border.Side, value: String) {
  val border = when (side) {
    Border.Side.Left -> style.mBorderLeft
    Border.Side.Top -> style.mBorderTop
    Border.Side.Right -> style.mBorderRight
    Border.Side.Bottom -> style.mBorderBottom
  }

  if (value.isEmpty()) {
    border.width = Zero
    border.style = BorderStyle.None
    border.color = Color.TRANSPARENT
    style.invalidateBorderRenderer()
    return
  }

  val scale = style.node.mason.scale
  var width: LengthPercentage? = Points(scale * 3)  // medium default
  var borderStyle: BorderStyle? = BorderStyle.Solid
  var color: Int? = Color.BLACK
  var valid = false

  val split = splitTopLevelWhitespace(value)
  split.forEach { part ->
    when {
      parseLengthPercentage(part) != null -> {
        width = when (part) {
          "thin" -> Points(scale * 1)
          "medium" -> Points(scale * 3)
          "thick" -> Points(scale * 5)
          else -> parseLengthPercentage(part)
        }
        valid = true
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

  if (!valid) return

  var batch = false
  if (!style.inBatch) {
    style.inBatch = true
    batch = true
  }

  width?.let { border.width = it }
  borderStyle?.let { border.style = it }
  color?.let { border.color = it }

  style.invalidateBorderRenderer()

  if (batch) {
    style.inBatch = false
  }
}

// corner-shape
// CSS syntax:
//   corner-shape: round                      → exponent 1 on all corners (default)
//   corner-shape: superellipse               → exponent 0.5 on all corners
//   corner-shape: superellipse(0.3)          → exponent 0.3 on all corners
//   corner-shape: squircle                   → alias for superellipse (0.5)
//   corner-shape: notch                      → exponent 2 on all corners
//   corner-shape: bevel                      → exponent 4 on all corners
//   1–4 value shorthand follows CSS corner order: TL TR BR BL
//

private val cornerShapeTokenRegex =
  Regex("""(round|superellipse(?:\((-?\d+(?:\.\d+)?)\))?|squircle|notch|bevel)""")

fun exponentToCornerShapeToken(exponent: Float): String {
  return when (exponent) {
    1.0f -> "round"
    0.5f -> "squircle"
    2.0f -> "notch"
    4.0f -> "bevel"
    else -> "superellipse($exponent)"
  }
}

fun parseCornerShapeToken(token: String): Float? {
  val match = cornerShapeTokenRegex.matchEntire(token.trim().lowercase()) ?: return null
  val keyword = match.groupValues[1]
  val explicitExp = match.groupValues.getOrNull(2)?.toFloatOrNull()
  return when {
    keyword.startsWith("superellipse") -> explicitExp ?: 0.5f
    keyword == "squircle" -> 0.5f
    keyword == "round" -> 1.0f
    keyword == "notch" -> 2.0f
    keyword == "bevel" -> 4.0f
    else -> null
  }
}

fun parseCornerShape(style: Style, value: String) {
  val tokens = SPLIT_REGEX.split(value.trim().removeSuffix(";"))
  val exponents = tokens.mapNotNull { parseCornerShapeToken(it) }
  if (exponents.isEmpty()) return

  // CSS 4-corner shorthand: 1→all, 2→(TL+BR, TR+BL), 3→(TL, TR+BL, BR), 4→per-corner
  val (tl, tr, br, bl) = when (exponents.size) {
    1 -> listOf(exponents[0], exponents[0], exponents[0], exponents[0])
    2 -> listOf(exponents[0], exponents[1], exponents[0], exponents[1])
    3 -> listOf(exponents[0], exponents[1], exponents[2], exponents[1])
    else -> listOf(exponents[0], exponents[1], exponents[2], exponents[3])
  }

  var batch = false
  if (!style.inBatch) {
    style.inBatch = true
    batch = true
  }

  style.mBorderTop.setState = false
  style.mBorderBottom.setState = false

  style.mBorderTop.corner1Exponent = tl    // top-left
  style.mBorderTop.corner2Exponent = tr    // top-right
  style.mBorderBottom.corner2Exponent = br  // bottom-right
  style.mBorderBottom.corner1Exponent = bl  // bottom-left

  style.mBorderTop.setState = true
  style.mBorderBottom.setState = true

  style.setOrAppendState(StateKeys.BORDER_RADIUS)
  style.invalidateBorderRenderer()

  if (batch) {
    style.inBatch = false
  }
}

fun parseBorderRadius(style: Style, value: String) {
  val cleaned = value.trim().removeSuffix(";")
  // Support slash syntax: 'horizontal / vertical'
  val (hPart, vPart) = if (cleaned.contains('/')) {
    val idx = cleaned.indexOf('/')
    cleaned.substring(0, idx).trim() to cleaned.substring(idx + 1).trim()
  } else {
    cleaned to ""
  }

  fun tokens(part: String): List<LengthPercentage> {
    val out = ArrayList<LengthPercentage>(4)
    forEachWhitespaceToken(part) { t -> parseLengthPercentage(t)?.let { out.add(it) } }
    return out
  }

  val hTokens = tokens(hPart)
  val vTokens = if (vPart.isNotEmpty()) tokens(vPart) else emptyList()

  // Helper to map 1-4 tokens to per-corner values
  fun mapTokens(tokens: List<LengthPercentage>): List<LengthPercentage> {
    return when (tokens.size) {
      1 -> listOf(tokens[0], tokens[0], tokens[0], tokens[0])
      2 -> listOf(tokens[0], tokens[1], tokens[0], tokens[1])
      3 -> listOf(tokens[0], tokens[1], tokens[2], tokens[1])
      4 -> listOf(tokens[0], tokens[1], tokens[2], tokens[3])
      else -> emptyList()
    }
  }

  val hMapped = mapTokens(hTokens)
  val vMapped = if (vTokens.isNotEmpty()) mapTokens(vTokens) else hMapped

  if (hMapped.isEmpty() || vMapped.isEmpty()) return

  // Assign elliptical radii per corner: (horizontal, vertical)
  val batch = !style.inBatch
  if (batch) style.inBatch = true
  style.borderTopLeftRadius = Point(hMapped[0], vMapped[0])
  style.borderTopRightRadius = Point(hMapped[1], vMapped[1])
  style.borderBottomRightRadius = Point(hMapped[2], vMapped[2])
  style.borderBottomLeftRadius = Point(hMapped[3], vMapped[3])
  // Always invalidate renderer and notify native update for radius changes
  style.invalidateBorderRenderer()
  style.setOrAppendState(StateKeys.BORDER_RADIUS)
  if (batch) style.inBatch = false
}
