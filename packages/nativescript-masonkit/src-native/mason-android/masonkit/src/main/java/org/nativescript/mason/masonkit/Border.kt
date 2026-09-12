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
    private val DASH_EFFECT = android.graphics.DashPathEffect(floatArrayOf(10f, 10f), 0f)
    private val DOT_EFFECT = android.graphics.DashPathEffect(floatArrayOf(2f, 8f), 0f)
  }

  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val path = Path()
  private val ringPath = Path()
  private val clipPath = Path()
  private val outerClipPath = Path()

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

  /** Check if there are any border radii set */
  fun hasRadii(): Boolean {
    return topLeftCorner.x > 0f || topLeftCorner.y > 0f ||
      topRightCorner.x > 0f || topRightCorner.y > 0f ||
      bottomRightCorner.x > 0f || bottomRightCorner.y > 0f ||
      bottomLeftCorner.x > 0f || bottomLeftCorner.y > 0f
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
    if (topWidth <= 0f && rightWidth <= 0f && bottomWidth <= 0f && leftWidth <= 0f) return

    // Build path with corners and sides
    buildBorderPath(width, height)

    // Ensure paint has smooth joins and dithering for crisper rounded corners
    paint.isDither = true
    paint.strokeJoin = Paint.Join.ROUND

    // Fast path: if all sides share the same color, style, and width, draw a filled
    // ring (outer minus inner) using even-odd fill to avoid stroked-join artifacts.
    if (topColor == rightColor && rightColor == bottomColor && bottomColor == leftColor &&
      topStyle == rightStyle && rightStyle == bottomStyle && bottomStyle == leftStyle &&
      topWidth == rightWidth && rightWidth == bottomWidth && bottomWidth == leftWidth &&
      topWidth > 0f
    ) {
      if (topStyle == BorderStyle.Solid) {
        // Solid single-color border: draw a filled ring with even-odd fill.
        // This avoids CLEAR-layer edge artifacts around rounded corners.
        paint.color = topColor
        paint.isDither = true

        val outer = buildBorderPathInset(0f, width, height)
        val inner = buildBorderPathInset(topWidth, width, height)

        val fillPaint = Paint(paint)
        fillPaint.style = Paint.Style.FILL
        fillPaint.pathEffect = null

        ringPath.reset()
        ringPath.fillType = Path.FillType.EVEN_ODD
        ringPath.addPath(outer)
        ringPath.addPath(inner)
        canvas.drawPath(ringPath, fillPaint)
      } else {
        // Non-solid single-color border: stroke the path once and apply pathEffect
        paint.color = topColor
        paint.strokeWidth = topWidth
        paint.style = Paint.Style.STROKE
        paint.isDither = true
        paint.strokeJoin = Paint.Join.ROUND
        // Use butt caps for closed path strokes to avoid rounded end artifacts
        paint.strokeCap = Paint.Cap.BUTT
        when (topStyle) {
          BorderStyle.Dashed -> paint.pathEffect = DASH_EFFECT
          BorderStyle.Dotted -> paint.pathEffect = DOT_EFFECT
          else -> paint.pathEffect = null
        }
        canvas.drawPath(path, paint)
      }
    } else {
      // Draw each side separately for per-side colors and styles
      drawSide(canvas, Side.Top, topColor, topStyle, width, height)
      drawSide(canvas, Side.Right, rightColor, rightStyle, width, height)
      drawSide(canvas, Side.Bottom, bottomColor, bottomStyle, width, height)
      drawSide(canvas, Side.Left, leftColor, leftStyle, width, height)
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

    // CSS spec proportional radius reduction on the outer box, then inset the
    // centerline radii by half the maximum stroke.
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

    path.moveTo(ofs + tlX, ofs)

    // Top edge
    path.lineTo(ofs + innerWidth - trX, ofs)

    // Corners (reuse tempRadius to avoid PointF allocation)
    tempRadius.set(trX, trY)
    addCorner(path, Corner.TOP_RIGHT, tempRadius, topRightExponent, innerWidth, innerHeight, ofs)

    // Right edge
    path.lineTo(ofs + innerWidth, ofs + innerHeight - brY)

    tempRadius.set(brX, brY)
    addCorner(
      path,
      Corner.BOTTOM_RIGHT,
      tempRadius,
      bottomRightExponent,
      innerWidth,
      innerHeight,
      ofs
    )

    // Bottom edge
    path.lineTo(ofs + blX, ofs + innerHeight)

    tempRadius.set(blX, blY)
    addCorner(
      path,
      Corner.BOTTOM_LEFT,
      tempRadius,
      bottomLeftExponent,
      innerWidth,
      innerHeight,
      ofs
    )

    // Left edge
    path.lineTo(ofs, ofs + tlY)

    tempRadius.set(tlX, tlY)
    addCorner(path, Corner.TOP_LEFT, tempRadius, topLeftExponent, innerWidth, innerHeight, ofs)

    path.close()
  }

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

  private fun drawSide(
    canvas: Canvas,
    side: Side,
    color: Int,
    style: BorderStyle,
    viewWidth: Float,
    viewHeight: Float
  ) {
    val sideWidth = getWidthForSide(side)
    if (style == BorderStyle.None || color == 0 || sideWidth <= 0f) return

    canvas.save()

    // Clip to this side's band so fill/stroke doesn't bleed into other sides
    when (side) {
      Side.Top -> canvas.clipRect(0f, 0f, viewWidth, sideWidth)
      Side.Right -> canvas.clipRect(viewWidth - sideWidth, 0f, viewWidth, viewHeight)
      Side.Bottom -> canvas.clipRect(0f, viewHeight - sideWidth, viewWidth, viewHeight)
      Side.Left -> canvas.clipRect(0f, 0f, sideWidth, viewHeight)
    }

    paint.color = color
    paint.strokeWidth = sideWidth
    paint.style = Paint.Style.STROKE
    paint.strokeJoin = Paint.Join.ROUND

    // choose stroke cap & pattern per style, scale pattern to stroke width for better visual parity
    when (style) {
      BorderStyle.Solid -> {
        paint.pathEffect = null
        paint.strokeCap = Paint.Cap.ROUND
        // draw on a path inset for this side so stroke centers match per-side widths
        val sidePath = buildBorderPathInset(sideWidth / 2f, viewWidth, viewHeight)
        canvas.drawPath(sidePath, paint)
      }

      BorderStyle.Dashed -> {
        paint.strokeCap = Paint.Cap.ROUND
        val pattern = floatArrayOf(sideWidth * 3f, sideWidth * 2f)
        paint.pathEffect = android.graphics.DashPathEffect(pattern, 0f)
        val sidePath = buildStraightEdgePath(side, sideWidth / 2f, viewWidth, viewHeight)
        canvas.drawPath(sidePath, paint)
      }

      BorderStyle.Dotted -> {
        // use round caps with dash length ~ strokeWidth to create circular dots
        paint.strokeCap = Paint.Cap.ROUND
        val pattern = floatArrayOf(sideWidth, sideWidth * 2f)
        paint.pathEffect = android.graphics.DashPathEffect(pattern, 0f)
        val sidePath = buildStraightEdgePath(side, sideWidth / 2f, viewWidth, viewHeight)
        canvas.drawPath(sidePath, paint)
      }

      BorderStyle.Double -> {
        val total = sideWidth
        if (total < 3f) {
          // fallback to solid fill band
          paint.pathEffect = null
          paint.style = Paint.Style.FILL
          val band = bandRectForSide(side, viewWidth, viewHeight, total)
          canvas.drawRect(band, paint)
        } else {
          val line = total / 3f
          val gap = total / 3f

          // Outer stroke
          paint.pathEffect = null
          paint.style = Paint.Style.STROKE
          paint.strokeWidth = line
          paint.strokeCap = Paint.Cap.BUTT
          val outerPath = buildBorderPathInset(line / 2f, viewWidth, viewHeight)
          canvas.drawPath(outerPath, paint)

          // Inner stroke
          paint.strokeWidth = line
          val innerCenter = line + gap
          val innerPath = buildBorderPathInset(innerCenter + line / 2f, viewWidth, viewHeight)
          canvas.drawPath(innerPath, paint)
        }
      }

      BorderStyle.Groove -> {
        val band = bandRectForSide(side, viewWidth, viewHeight, sideWidth)
        val dark = darkenColor(color, 0.2f)
        val light = lightenColor(color, 0.2f)
        paint.style = Paint.Style.FILL
        if (side == Side.Top || side == Side.Bottom) {
          val half = band.width() / 2f
          val leftRect = RectF(band.left, band.top, band.left + half, band.bottom)
          val rightRect = RectF(band.left + half, band.top, band.right, band.bottom)
          paint.color = dark
          canvas.drawRect(leftRect, paint)
          paint.color = light
          canvas.drawRect(rightRect, paint)
        } else {
          val half = band.height() / 2f
          val topRect = RectF(band.left, band.top, band.right, band.top + half)
          val bottomRect = RectF(band.left, band.top + half, band.right, band.bottom)
          paint.color = dark
          canvas.drawRect(topRect, paint)
          paint.color = light
          canvas.drawRect(bottomRect, paint)
        }
      }

      BorderStyle.Ridge -> {
        val band = bandRectForSide(side, viewWidth, viewHeight, sideWidth)
        val dark = darkenColor(color, 0.2f)
        val light = lightenColor(color, 0.2f)
        paint.style = Paint.Style.FILL
        if (side == Side.Top || side == Side.Bottom) {
          val half = band.width() / 2f
          val leftRect = RectF(band.left, band.top, band.left + half, band.bottom)
          val rightRect = RectF(band.left + half, band.top, band.right, band.bottom)
          paint.color = light
          canvas.drawRect(leftRect, paint)
          paint.color = dark
          canvas.drawRect(rightRect, paint)
        } else {
          val half = band.height() / 2f
          val topRect = RectF(band.left, band.top, band.right, band.top + half)
          val bottomRect = RectF(band.left, band.top + half, band.right, band.bottom)
          paint.color = light
          canvas.drawRect(topRect, paint)
          paint.color = dark
          canvas.drawRect(bottomRect, paint)
        }
      }

      BorderStyle.Inset -> {
        val band = bandRectForSide(side, viewWidth, viewHeight, sideWidth)
        paint.style = Paint.Style.FILL
        paint.color = darkenColor(color, 0.35f)
        canvas.drawRect(band, paint)
      }

      BorderStyle.Outset -> {
        val band = bandRectForSide(side, viewWidth, viewHeight, sideWidth)
        paint.style = Paint.Style.FILL
        paint.color = lightenColor(color, 0.35f)
        canvas.drawRect(band, paint)
      }

      else -> {
        paint.pathEffect = null
        paint.strokeCap = Paint.Cap.BUTT
        val sidePath = buildBorderPathInset(sideWidth / 2f, viewWidth, viewHeight)
        canvas.drawPath(sidePath, paint)
      }
    }

    canvas.restore()
  }

  /**
   * Build a border path inset by a custom half-stroke (ofs). This mirrors buildBorderPath
   * but uses the provided offset so each side can be stroked centered at a different inset
   * (matching CSS where each side's stroke is centered on a path inset by half that side's width).
   */
  private fun buildBorderPathInset(ofs: Float, width: Float, height: Float): Path {
    val tl = topLeftCorner
    val tr = topRightCorner
    val br = bottomRightCorner
    val bl = bottomLeftCorner

    val p = Path()

    val innerWidth = (width - ofs * 2).coerceAtLeast(0f)
    val innerHeight = (height - ofs * 2).coerceAtLeast(0f)

    // CSS spec proportional radius reduction on the outer box, then inset the
    // requested path so border centerlines and inner rings do not bulge outward.
    val f = cssRadiusScale(width, height)
    val tlX = insetRadius(tl.x * f, ofs)
    val tlY = insetRadius(tl.y * f, ofs)
    val trX = insetRadius(tr.x * f, ofs)
    val trY = insetRadius(tr.y * f, ofs)
    val brX = insetRadius(br.x * f, ofs)
    val brY = insetRadius(br.y * f, ofs)
    val blX = insetRadius(bl.x * f, ofs)
    val blY = insetRadius(bl.y * f, ofs)

    p.moveTo(ofs + tlX, ofs)
    p.lineTo(ofs + innerWidth - trX, ofs)

    tempRadius.set(trX, trY)
    addCorner(p, Corner.TOP_RIGHT, tempRadius, topRightExponent, innerWidth, innerHeight, ofs)

    p.lineTo(ofs + innerWidth, ofs + innerHeight - brY)

    tempRadius.set(brX, brY)
    addCorner(p, Corner.BOTTOM_RIGHT, tempRadius, bottomRightExponent, innerWidth, innerHeight, ofs)

    p.lineTo(ofs + blX, ofs + innerHeight)

    tempRadius.set(blX, blY)
    addCorner(p, Corner.BOTTOM_LEFT, tempRadius, bottomLeftExponent, innerWidth, innerHeight, ofs)

    p.lineTo(ofs, ofs + tlY)

    tempRadius.set(tlX, tlY)
    addCorner(p, Corner.TOP_LEFT, tempRadius, topLeftExponent, innerWidth, innerHeight, ofs)

    p.close()
    return p
  }

  /** Build a straight-edge centerline path for a single side (excludes corner arcs). */
  private fun buildStraightEdgePath(side: Side, ofs: Float, width: Float, height: Float): Path {
    val f = cssRadiusScale(width, height)
    val tlX = insetRadius(topLeftCorner.x * f, ofs)
    val tlY = insetRadius(topLeftCorner.y * f, ofs)
    val trX = insetRadius(topRightCorner.x * f, ofs)
    val trY = insetRadius(topRightCorner.y * f, ofs)
    val brX = insetRadius(bottomRightCorner.x * f, ofs)
    val brY = insetRadius(bottomRightCorner.y * f, ofs)
    val blX = insetRadius(bottomLeftCorner.x * f, ofs)
    val blY = insetRadius(bottomLeftCorner.y * f, ofs)

    val p = Path()
    when (side) {
      Side.Top -> {
        val y = ofs
        p.moveTo(ofs + tlX, y)
        p.lineTo(width - ofs - trX, y)
      }

      Side.Right -> {
        val x = width - ofs
        p.moveTo(x, ofs + trY)
        p.lineTo(x, height - ofs - brY)
      }

      Side.Bottom -> {
        val y = height - ofs
        p.moveTo(ofs + blX, y)
        p.lineTo(width - ofs - brX, y)
      }

      Side.Left -> {
        val x = ofs
        p.moveTo(x, ofs + tlY)
        p.lineTo(x, height - ofs - blY)
      }
    }
    return p
  }

  /** Compute the RectF band for a given side and band thickness (in pixels) */
  private fun bandRectForSide(side: Side, width: Float, height: Float, band: Float): RectF {
    return when (side) {
      Side.Top -> RectF(0f, 0f, width, band)
      Side.Right -> RectF(width - band, 0f, width, height)
      Side.Bottom -> RectF(0f, height - band, width, height)
      Side.Left -> RectF(0f, 0f, band, height)
    }
  }

  private fun clamp01(v: Float): Float = when {
    v < 0f -> 0f
    v > 1f -> 1f
    else -> v
  }

  private fun insetRadius(radius: Float, inset: Float): Float {
    return (radius - inset).coerceAtLeast(0f)
  }

  private fun darkenColor(color: Int, amount: Float): Int {
    val a = Color.alpha(color)
    val r = (Color.red(color) * (1f - clamp01(amount))).toInt().coerceIn(0, 255)
    val g = (Color.green(color) * (1f - clamp01(amount))).toInt().coerceIn(0, 255)
    val b = (Color.blue(color) * (1f - clamp01(amount))).toInt().coerceIn(0, 255)
    return Color.argb(a, r, g, b)
  }

  private fun lightenColor(color: Int, amount: Float): Int {
    val a = Color.alpha(color)
    val r = (Color.red(color) + (255 - Color.red(color)) * clamp01(amount)).toInt().coerceIn(0, 255)
    val g =
      (Color.green(color) + (255 - Color.green(color)) * clamp01(amount)).toInt().coerceIn(0, 255)
    val b =
      (Color.blue(color) + (255 - Color.blue(color)) * clamp01(amount)).toInt().coerceIn(0, 255)
    return Color.argb(a, r, g, b)
  }

  private fun getWidthForSide(side: Side): Float = when (side) {
    Side.Left -> leftWidth
    Side.Top -> topWidth
    Side.Right -> rightWidth
    Side.Bottom -> bottomWidth
  }

  enum class Side { Left, Top, Right, Bottom }
}

// `px` is a CSS pixel (the same size as a dip), matching the web and iOS's
// BorderParser; `dppx` is the escape hatch for a literal device pixel.
// Alternation order matters: `dppx` also ends with `px`, and `rem` with `em`.
private val lengthPercentageRegex = Regex("""^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(dppx|px|%|dip|rem|em|vmin|vmax|vw|vh|pt)?$""")

/** 1pt = 1/72in and 1 CSS px = 1/96in, so a point is 96/72 CSS px. */
private const val PX_PER_PT = 96f / 72f

/**
 * CSS px for one length token, before the density multiply. `em` resolves
 * against [emBasis] (the element's own font size) when given, else the root
 * font size — matching `tokenToDevicePx` in style.ts.
 */
private fun cssPxForUnit(num: Float, unit: String?, emBasis: Float?): Float {
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
  val match = lengthPercentageRegex.matchEntire(value.trim()) ?: return null
  val raw = match.groupValues[1].toFloatOrNull() ?: return null
  // Clamp values that exceed a practical maximum (e.g. Float.MAX_VALUE from
  // calc(infinity*1px) evaluated by NS's CSS parser) so cssRadiusScale()
  // doesn't overflow when summing corner pairs.
  val num = raw.coerceIn(-9999f, 9999f)
  val unit = match.groupValues.getOrNull(2)
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
  val match = lengthPercentageRegex.matchEntire(trimmed) ?: return null
  val num = match.groupValues[1].toFloatOrNull() ?: return null
  val unit = match.groupValues.getOrNull(2)
  return when (unit) {
    "dppx" -> LengthPercentageAuto.Points(num)
    "%" -> LengthPercentageAuto.Percent(num / 100f)
    else -> LengthPercentageAuto.Points(cssPxForUnit(num, unit, null) * Mason.shared.scale)
  }
}

fun parseLength(style: Style, value: String): Float? {
  val match = lengthPercentageRegex.matchEntire(value.trim()) ?: return null
  val num = match.groupValues[1].toFloatOrNull() ?: return null
  val unit = match.groupValues.getOrNull(2)
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
private fun splitTopLevelWhitespace(input: String): List<String> {
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
    style.mBorderRenderer.invalidate()
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
    style.mBorderRenderer.invalidate()
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

  style.mBorderRenderer.invalidate()

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
  style.mBorderRenderer.invalidate()

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

  val hTokens = SPLIT_REGEX.split(hPart).mapNotNull { parseLengthPercentage(it) }
  val vTokens = if (vPart.isNotEmpty()) SPLIT_REGEX.split(vPart)
    .mapNotNull { parseLengthPercentage(it) } else emptyList()

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
  style.borderTopLeftRadius = Point(hMapped[0], vMapped[0])
  style.borderTopRightRadius = Point(hMapped[1], vMapped[1])
  style.borderBottomRightRadius = Point(hMapped[2], vMapped[2])
  style.borderBottomLeftRadius = Point(hMapped[3], vMapped[3])
  // Always invalidate renderer and notify native update for radius changes
  style.mBorderRenderer.invalidate()
  if (!style.inBatch) {
    style.isDirty = StateKeys.BORDER_RADIUS.bits
    style.updateNativeStyle()
  }
}
