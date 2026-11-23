package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RectF
import android.graphics.Region
import android.view.MotionEvent
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/*
 * Geometry and hit testing for the basic shapes parsed by Rust.
 */

// MARK: - Lengths

/** A CSS number with its unit: null is a bare number, `%` a percentage. */
internal data class CssLength(val value: Float, val unit: String?, private val math: NativePaintOffset? = null) {
  val isPercent: Boolean get() = unit == "%"
  val isNumber: Boolean get() = unit == null

  /** Device px; percentages resolve against [basis] (device px). */
  fun toPx(basis: Float, ctx: LengthContext): Float = math?.resolve(basis, ctx) ?: when (unit) {
    "%" -> value / 100f * basis
    "dppx" -> value
    else -> ctx.cssPx(value, unit) * ctx.scale
  }

  companion object {
    val ZERO = CssLength(0f, null)
    val FIFTY_PERCENT = CssLength(50f, "%")
    val HUNDRED_PERCENT = CssLength(100f, "%")
  }
}

/**
 * What relative units resolve against. Built from `Mason.shared` at draw time; tests pass
 * their own, since `Mason.shared` loads the native library.
 */
internal data class LengthContext(
  @JvmField val scale: Float,
  @JvmField val emBasis: Float = 16f,
  @JvmField val rootFontSize: Float = 16f,
  @JvmField val viewportWidth: Float = 0f,
  @JvmField val viewportHeight: Float = 0f,
) {
  /** CSS px for a typed geometry value, using the current draw context. */
  fun cssPx(num: Float, unit: String?): Float = when (unit) {
    "rem" -> num * rootFontSize
    "em" -> num * (if (emBasis > 0f) emBasis else rootFontSize)
    "pt" -> num * 96f / 72f
    "pc" -> num * 16f
    "in" -> num * 96f
    "cm" -> num * 96f / 2.54f
    "mm" -> num * 96f / 25.4f
    "q" -> num * 96f / 101.6f
    "vw" -> num / 100f * viewportWidth
    "vh" -> num / 100f * viewportHeight
    "vmin" -> num / 100f * min(viewportWidth, viewportHeight)
    "vmax" -> num / 100f * max(viewportWidth, viewportHeight)
    else -> num
  }

  companion object {
    fun forStyle(style: Style): LengthContext {
      val mason = Mason.shared
      return LengthContext(
        mason.scale, style.fontSize.toFloat(), mason.rootFontSize, mason.viewportWidth, mason.viewportHeight
      )
    }
  }
}

// MARK: - Model

/** A pure rectangle (android.graphics.RectF is a stub in JVM tests). */
internal data class RectBox(val l: Float, val t: Float, val r: Float, val b: Float) {
  val width: Float get() = r - l
  val height: Float get() = b - t
}

/** `<geometry-box>`. The SVG boxes have no meaning for a Mason box: border box. */
enum class GeometryBox { BORDER_BOX, PADDING_BOX, CONTENT_BOX, MARGIN_BOX;

  companion object {
    fun parse(value: String): GeometryBox? = when (value.trim().lowercase()) {
      "border-box", "fill-box", "stroke-box", "view-box" -> BORDER_BOX
      "padding-box" -> PADDING_BOX
      "content-box" -> CONTENT_BOX
      "margin-box" -> MARGIN_BOX
      else -> null
    }
  }
}

/** A circle/ellipse radius: a length or a side/corner keyword. */
internal sealed class ShapeRadius {
  data class Length(val length: CssLength) : ShapeRadius()
  object ClosestSide : ShapeRadius()
  object FarthestSide : ShapeRadius()
  object ClosestCorner : ShapeRadius()
  object FarthestCorner : ShapeRadius()
}

/** One axis of a projected `<position>`, with a device-pixel offset. */
internal data class PositionAxis(val offset: CssLength, val pixels: Float = 0f) {
  fun resolve(size: Float, ctx: LengthContext): Float {
    return offset.toPx(size, ctx) + pixels
  }

  companion object {
    val CENTER = PositionAxis(CssLength.FIFTY_PERCENT)
  }
}

internal data class ShapePosition(val x: PositionAxis, val y: PositionAxis) {
  companion object {
    val CENTER = ShapePosition(PositionAxis.CENTER, PositionAxis.CENTER)
  }
}

internal sealed class BasicShape {
  /** Insets top, right, bottom, left; `rect()` and `xywh()` are converted to this. */
  data class Inset(
    val top: CssLength, val right: CssLength, val bottom: CssLength, val left: CssLength,
    /** TL x/y, TR x/y, BR x/y, BL x/y; null without `round`. */
    val radii: List<CssLength>? = null,
  ) : BasicShape()

  /** `rect(top right bottom left)`: edges measured from the top/left; null is `auto`. */
  data class Rect(
    val top: CssLength?, val right: CssLength?, val bottom: CssLength?, val left: CssLength?,
    val radii: List<CssLength>? = null,
  ) : BasicShape()

  data class Xywh(
    val x: CssLength, val y: CssLength, val w: CssLength, val h: CssLength,
    val radii: List<CssLength>? = null,
  ) : BasicShape()

  data class Circle(val radius: ShapeRadius, val position: ShapePosition) : BasicShape()
  data class Ellipse(val rx: ShapeRadius, val ry: ShapeRadius, val position: ShapePosition) : BasicShape()
  data class Polygon(val evenOdd: Boolean, val points: List<Pair<CssLength, CssLength>>) : BasicShape()
  data class PathData(val evenOdd: Boolean, val commands: List<SvgPathCommand>) : BasicShape()
}

/** A parsed `clip-path`: a shape in a reference box, or just the box's own (rounded) shape. */
internal data class ClipPathValue(val shape: BasicShape?, val box: GeometryBox)

// MARK: - Parsing

internal fun parseClipPath(value: String, context: LengthContext = LengthContext(1f)): ClipPathValue? =
  NativeClipPath.parse(value)?.project(context)

internal class NativeClipPath private constructor(private val handle: Long) {
  fun project(context: LengthContext): ClipPathValue? {
    val records = Mason.nativeClipPathRecords(
      this, handle, context.scale, context.emBasis, context.rootFontSize, context.viewportWidth, context.viewportHeight
    ) ?: return null
    val box = GeometryBox.entries[records[ClipPathRecord.BOX].toInt()]
    val evenOdd = records[ClipPathRecord.EVEN_ODD] != 0.0
    val count = (records.size - ClipPathRecord.STRIDE) / 2
    val hasMath = records[ClipPathRecord.HAS_MATH] != 0.0
    fun fraction(index: Int): Double = records[ClipPathRecord.STRIDE + index * 2]
    fun pixels(index: Int): Float = records[ClipPathRecord.STRIDE + index * 2 + 1].toFloat()
    fun math(index: Int): NativePaintOffset? = if (hasMath) {
      NativePaintOffset.retain(this, Mason.nativeClipPathOffset(this, handle, index), context.emBasis)
    } else null
    fun length(index: Int, offset: NativePaintOffset? = math(index)): CssLength {
      val f = fraction(index)
      return if (f == 0.0) CssLength(pixels(index), "dppx", offset) else CssLength((f * 100).toFloat(), "%", offset)
    }
    fun edge(index: Int): CssLength? = if (fraction(index).isNaN()) null else length(index)
    fun position(index: Int): PositionAxis {
      math(index)?.let { return PositionAxis(length(index, it)) }
      val fraction = fraction(index)
      val pixels = pixels(index)
      if (fraction == 0.0 && pixels == 0f) return PositionAxis(CssLength.ZERO)
      if (fraction == 0.0 || pixels == 0f) return PositionAxis(length(index, null))
      return PositionAxis(length(index, null), pixels)
    }
    fun radius(kind: Int, index: Int): ShapeRadius = when (records[kind].toInt()) {
      1 -> ShapeRadius.ClosestSide
      2 -> ShapeRadius.FarthestSide
      3 -> ShapeRadius.ClosestCorner
      4 -> ShapeRadius.FarthestCorner
      else -> ShapeRadius.Length(length(index))
    }
    fun corners(): List<CssLength>? = if (count > 4) (4 until count).map(::length) else null
    val shape = when (records[ClipPathRecord.KIND].toInt()) {
      0 -> null
      1 -> BasicShape.Inset(length(0), length(1), length(2), length(3), corners())
      2 -> BasicShape.Rect(edge(0), edge(1), edge(2), edge(3), corners())
      3 -> BasicShape.Xywh(length(0), length(1), length(2), length(3), corners())
      4 -> BasicShape.Circle(radius(ClipPathRecord.RADIUS_X_KIND, 2), ShapePosition(position(0), position(1)))
      5 -> BasicShape.Ellipse(
        radius(ClipPathRecord.RADIUS_X_KIND, 2), radius(ClipPathRecord.RADIUS_Y_KIND, 3),
        ShapePosition(position(0), position(1))
      )
      6 -> BasicShape.Polygon(evenOdd, (0 until count step 2).map { length(it) to length(it + 1) })
      7 -> BasicShape.PathData(evenOdd, decodeSvgPathRecords(records, ClipPathRecord.STRIDE))
      else -> return null
    }
    return ClipPathValue(shape, box)
  }

  companion object {
    fun parse(value: String): NativeClipPath? {
      val handle = Mason.nativeClipPathParse(value)
      if (handle == 0L) return null
      return NativeClipPath(handle).also { Mason.shared.gc.track(it) { Mason.nativeClipPathRelease(handle) } }
    }

    fun install(clip: NativeClipPath?, style: Style) {
      val node = style.node
      if (node.isPlaceholder) return
      val mason = node.mason
      if (mason.inCompute) mason.deferStyleRecords(style)
      else style.prepareMut()
      Mason.nativeClipPathInstall(clip, clip?.handle ?: 0, if (mason.inCompute) 0 else mason.nativePtr, node.nativePtr)
    }
  }
}

// MARK: - Resolution

/** A clip shape in device px, in the element's box coordinates. */
internal sealed class ResolvedClip {
  /** [radii]: TL x/y, TR x/y, BR x/y, BL x/y, already reduced to fit. */
  data class RoundRect(val rect: RectBox, val radii: FloatArray) : ResolvedClip() {
    override fun equals(other: Any?) = other is RoundRect && other.rect == rect && other.radii.contentEquals(radii)
    override fun hashCode() = rect.hashCode() * 31 + radii.contentHashCode()
  }

  data class Ellipse(val cx: Float, val cy: Float, val rx: Float, val ry: Float) : ResolvedClip()

  /** x/y pairs. */
  data class Polygon(val points: FloatArray, val evenOdd: Boolean) : ResolvedClip() {
    override fun equals(other: Any?) = other is Polygon && other.evenOdd == evenOdd && other.points.contentEquals(points)
    override fun hashCode() = points.contentHashCode()
  }

  /** SVG path data in CSS px from the reference box origin: scaled by [scale], moved by [dx]/[dy]. */
  data class PathShape(
    val commands: List<SvgPathCommand>, val evenOdd: Boolean, val dx: Float, val dy: Float, val scale: Float,
  ) : ResolvedClip()
}

/** CSS corner-radius reduction: scale all radii so no two on one side overlap. */
internal fun fitRadii(radii: FloatArray, w: Float, h: Float) {
  var f = 1f
  fun limit(sum: Float, size: Float) {
    if (sum > 0f && sum > size) f = min(f, max(0f, size) / sum)
  }
  limit(radii[0] + radii[2], w)
  limit(radii[3] + radii[5], h)
  limit(radii[6] + radii[4], w)
  limit(radii[1] + radii[7], h)
  if (f < 1f) for (i in radii.indices) radii[i] *= f
}

private fun resolveRadii(radii: List<CssLength>?, box: RectBox, rect: RectBox, ctx: LengthContext): FloatArray {
  val out = FloatArray(8)
  if (radii != null) {
    // Percentages are of the reference box, as for the box's own border-radius.
    for (i in 0 until 8) out[i] = max(0f, radii[i].toPx(if (i % 2 == 0) box.width else box.height, ctx))
  }
  fitRadii(out, rect.width, rect.height)
  return out
}

/** Insets that add up to more than the box are scaled down proportionally (CSS Shapes 1). */
private fun insetRect(box: RectBox, t: Float, r: Float, b: Float, l: Float): RectBox {
  var top = t
  var right = r
  var bottom = b
  var left = l
  val hs = left + right
  if (hs > box.width && hs > 0f) {
    val f = box.width / hs
    left *= f
    right *= f
  }
  val vs = top + bottom
  if (vs > box.height && vs > 0f) {
    val f = box.height / vs
    top *= f
    bottom *= f
  }
  return RectBox(box.l + left, box.t + top, box.r - right, box.b - bottom)
}

private fun resolveRadius(r: ShapeRadius, cx: Float, cy: Float, box: RectBox, horizontal: Boolean?, ctx: LengthContext): Float {
  val dl = abs(cx - box.l)
  val dr = abs(box.r - cx)
  val dt = abs(cy - box.t)
  val db = abs(box.b - cy)
  return when (r) {
    is ShapeRadius.Length -> {
      // A circle's percentage is of the box diagonal / sqrt(2); an ellipse's of its own axis.
      val basis = when (horizontal) {
        null -> hypot(box.width, box.height) / sqrt(2f)
        true -> box.width
        false -> box.height
      }
      max(0f, r.length.toPx(basis, ctx))
    }

    ShapeRadius.ClosestSide -> when (horizontal) {
      null -> minOf(dl, dr, dt, db)
      true -> min(dl, dr)
      false -> min(dt, db)
    }

    ShapeRadius.FarthestSide -> when (horizontal) {
      null -> maxOf(dl, dr, dt, db)
      true -> max(dl, dr)
      false -> max(dt, db)
    }

    ShapeRadius.ClosestCorner -> minOf(hypot(dl, dt), hypot(dr, dt), hypot(dl, db), hypot(dr, db))

    ShapeRadius.FarthestCorner -> maxOf(hypot(dl, dt), hypot(dr, dt), hypot(dl, db), hypot(dr, db))
  }
}

/** [shape] in device px for reference box [box] (element box coordinates). */
internal fun resolveBasicShape(shape: BasicShape, box: RectBox, ctx: LengthContext): ResolvedClip {
  val w = box.width
  val h = box.height
  return when (shape) {
    is BasicShape.Inset -> {
      val rect = insetRect(
        box, shape.top.toPx(h, ctx), shape.right.toPx(w, ctx), shape.bottom.toPx(h, ctx), shape.left.toPx(w, ctx)
      )
      ResolvedClip.RoundRect(rect, resolveRadii(shape.radii, box, rect, ctx))
    }

    is BasicShape.Rect -> {
      // rect(t r b l) is inset(t, W - r, H - b, l); `auto` is the matching box edge.
      val top = shape.top?.toPx(h, ctx) ?: 0f
      val left = shape.left?.toPx(w, ctx) ?: 0f
      val right = shape.right?.toPx(w, ctx) ?: w
      val bottom = shape.bottom?.toPx(h, ctx) ?: h
      val rect = insetRect(box, top, w - right, h - bottom, left)
      ResolvedClip.RoundRect(rect, resolveRadii(shape.radii, box, rect, ctx))
    }

    is BasicShape.Xywh -> {
      val x = shape.x.toPx(w, ctx)
      val y = shape.y.toPx(h, ctx)
      val rw = max(0f, shape.w.toPx(w, ctx))
      val rh = max(0f, shape.h.toPx(h, ctx))
      val rect = insetRect(box, y, w - x - rw, h - y - rh, x)
      ResolvedClip.RoundRect(rect, resolveRadii(shape.radii, box, rect, ctx))
    }

    is BasicShape.Circle -> {
      val cx = box.l + shape.position.x.resolve(w, ctx)
      val cy = box.t + shape.position.y.resolve(h, ctx)
      val r = resolveRadius(shape.radius, cx, cy, box, null, ctx)
      ResolvedClip.Ellipse(cx, cy, r, r)
    }

    is BasicShape.Ellipse -> {
      val cx = box.l + shape.position.x.resolve(w, ctx)
      val cy = box.t + shape.position.y.resolve(h, ctx)
      ResolvedClip.Ellipse(
        cx, cy, ellipseRadius(shape.rx, cx, cy, box, true, ctx), ellipseRadius(shape.ry, cx, cy, box, false, ctx)
      )
    }

    is BasicShape.Polygon -> {
      val pts = FloatArray(shape.points.size * 2)
      shape.points.forEachIndexed { i, (x, y) ->
        pts[i * 2] = box.l + x.toPx(w, ctx)
        pts[i * 2 + 1] = box.t + y.toPx(h, ctx)
      }
      ResolvedClip.Polygon(pts, shape.evenOdd)
    }

    is BasicShape.PathData -> ResolvedClip.PathShape(shape.commands, shape.evenOdd, box.l, box.t, ctx.scale)
  }
}

/** Ellipse radii: corner keywords (CSS Shapes 2) keep the box's aspect ratio. */
private fun ellipseRadius(r: ShapeRadius, cx: Float, cy: Float, box: RectBox, horizontal: Boolean, ctx: LengthContext): Float {
  if (r != ShapeRadius.ClosestCorner && r != ShapeRadius.FarthestCorner) return resolveRadius(r, cx, cy, box, horizontal, ctx)
  val side = if (r == ShapeRadius.ClosestCorner) ShapeRadius.ClosestSide else ShapeRadius.FarthestSide
  return resolveRadius(side, cx, cy, box, horizontal, ctx) * sqrt(2f)
}

/** The element's box edges, in its box coordinates, for a reference box. */
internal fun referenceBox(
  box: GeometryBox, w: Float, h: Float, border: FloatArray, padding: FloatArray, margin: FloatArray,
): RectBox = when (box) {
  GeometryBox.BORDER_BOX -> RectBox(0f, 0f, w, h)
  GeometryBox.PADDING_BOX -> RectBox(border[3], border[0], w - border[1], h - border[2])
  GeometryBox.CONTENT_BOX -> RectBox(
    border[3] + padding[3], border[0] + padding[0], w - border[1] - padding[1], h - border[2] - padding[2]
  )

  GeometryBox.MARGIN_BOX -> RectBox(-margin[3], -margin[0], w + margin[1], h + margin[2])
}

/**
 * The shape of a reference box on its own: its rectangle with the border radii adjusted to
 * that edge (shrunk by the border/padding inward, grown by the margin outward).
 * [radii] are the border box's, already reduced to fit; [border]/[padding]/[margin] are TRBL.
 */
internal fun resolveBoxShape(
  box: GeometryBox, w: Float, h: Float, radii: FloatArray,
  border: FloatArray, padding: FloatArray, margin: FloatArray,
): ResolvedClip.RoundRect {
  val rect = referenceBox(box, w, h, border, padding, margin)
  val out = radii.copyOf()
  // Per corner: horizontal radius adjusts by the left/right side, vertical by top/bottom.
  val hSide = intArrayOf(3, 1, 1, 3) // TL, TR, BR, BL -> left, right, right, left
  val vSide = intArrayOf(0, 0, 2, 2) // -> top, top, bottom, bottom
  for (c in 0 until 4) {
    val hs = hSide[c]
    val vs = vSide[c]
    when (box) {
      GeometryBox.BORDER_BOX -> {}
      GeometryBox.PADDING_BOX -> {
        out[c * 2] = max(0f, out[c * 2] - border[hs])
        out[c * 2 + 1] = max(0f, out[c * 2 + 1] - border[vs])
      }

      GeometryBox.CONTENT_BOX -> {
        out[c * 2] = max(0f, out[c * 2] - border[hs] - padding[hs])
        out[c * 2 + 1] = max(0f, out[c * 2 + 1] - border[vs] - padding[vs])
      }

      GeometryBox.MARGIN_BOX -> {
        // A square corner stays square; a rounded one grows with the margin.
        if (out[c * 2] > 0f && out[c * 2 + 1] > 0f) {
          out[c * 2] += margin[hs]
          out[c * 2 + 1] += margin[vs]
        }
      }
    }
  }
  fitRadii(out, rect.width, rect.height)
  return ResolvedClip.RoundRect(rect, out)
}

/** Builds [clip] into [path] (reset first). */
internal fun ResolvedClip.buildPath(path: Path) {
  path.reset()
  when (this) {
    is ResolvedClip.RoundRect -> {
      if (rect.width <= 0f || rect.height <= 0f) return
      val r = RectF(rect.l, rect.t, rect.r, rect.b)
      if (radii.all { it == 0f }) path.addRect(r, Path.Direction.CW) else path.addRoundRect(r, radii, Path.Direction.CW)
    }

    is ResolvedClip.Ellipse -> {
      if (rx <= 0f || ry <= 0f) return
      path.addOval(RectF(cx - rx, cy - ry, cx + rx, cy + ry), Path.Direction.CW)
    }

    is ResolvedClip.Polygon -> {
      if (points.size < 6) return
      path.moveTo(points[0], points[1])
      var i = 2
      while (i < points.size) {
        path.lineTo(points[i], points[i + 1])
        i += 2
      }
      path.close()
      path.fillType = if (evenOdd) Path.FillType.EVEN_ODD else Path.FillType.WINDING
    }

    is ResolvedClip.PathShape -> {
      for (c in commands) {
        when (c) {
          is SvgPathCommand.MoveTo -> path.moveTo(c.x, c.y)
          is SvgPathCommand.LineTo -> path.lineTo(c.x, c.y)
          is SvgPathCommand.CubicTo -> path.cubicTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y)
          is SvgPathCommand.QuadTo -> path.quadTo(c.x1, c.y1, c.x, c.y)
          SvgPathCommand.Close -> path.close()
        }
      }
      path.transform(Matrix().apply {
        setScale(scale, scale)
        postTranslate(dx, dy)
      })
      path.fillType = if (evenOdd) Path.FillType.EVEN_ODD else Path.FillType.WINDING
    }
  }
}

// MARK: - Runtime

class ClipPath internal constructor(private val style: Style) {
  companion object {
    internal const val CSS_NAME = "clip-path"
  }

  private var base = ""

  /** A pseudo-class rule set `clip-path`; until then only [base] is consulted. */
  internal var hasPseudo = false

  private var baseProgram: NativeClipPath? = null
  private var program: NativeClipPath? = null
  private var builtFrom: String? = null
  private var builtContext: LengthContext? = null
  private var value: ClipPathValue? = null
  private var version = 0

  fun get(): String = base

  fun set(value: String) {
    setBase(value)
    changed()
  }

  internal fun setBase(value: String) {
    val css = value.trim()
    if (base != css) {
      base = css
      baseProgram = NativeClipPath.parse(css)
      NativeClipPath.install(baseProgram, style)
    }
  }

  internal fun changed() {
    val view = style.node.view as? android.view.View ?: return
    // Clipping hooks draw(), which a ViewGroup that draws nothing itself skips.
    view.setWillNotDraw(false)
    view.invalidate()
    // The parent draws this element's outset shadow, or skips it while clipped.
    if (style.hasOutsetBoxShadow()) (view.parent as? android.view.View)?.invalidate()
  }

  private fun resolved(): String {
    val node = style.node
    if (hasPseudo && node.pseudoMask != 0) {
      for (i in PSEUDO_CSS_ORDER.indices.reversed()) {
        val state = PSEUDO_CSS_ORDER[i]
        if (node.hasPseudo(state)) {
          node.getPseudoString(state.mask, CSS_NAME)?.let { if (it.isNotEmpty()) return it }
        }
      }
    }
    return base
  }

  /** Reuse the parsed clip when only the length context changes. */
  internal fun current(): ClipPathValue? {
    val css = resolved()
    val changed = css != builtFrom
    if (changed) {
      program = if (css == base) baseProgram else NativeClipPath.parse(css)
      builtFrom = css
    }
    val context = program?.let { LengthContext.forStyle(style) }
    if (changed || context != builtContext) {
      value = if (context != null) program?.project(context) else null
      builtContext = context
      version++
    }
    return value
  }

  internal fun isActive(): Boolean = current() != null

  // The clip path in box coordinates, rebuilt when its inputs change.
  private val path = Path()
  private val key = FloatArray(24)
  private val nextKey = FloatArray(24)
  private var keyVersion = -1
  private val border = FloatArray(4)
  private val padding = FloatArray(4)
  private val margin = FloatArray(4)
  private val radii = FloatArray(8)
  private var region: Region? = null

  // Everything outside the shape, erased (anti-aliased) from the clip layer in [end].
  private val inverse = Path()
  private val bounds = RectF()
  private var layerSave = -1
  private var layerDx = 0f
  private var layerDy = 0f
  private val eraser by lazy(LazyThreadSafetyMode.NONE) {
    Paint(Paint.ANTI_ALIAS_FLAG).apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_OUT) }
  }

  private fun pathFor(value: ClipPathValue, w: Float, h: Float): Path {
    val node = style.node
    val k = nextKey
    k[0] = w; k[1] = h
    k[2] = node.computedBorderTop; k[3] = node.computedBorderRight
    k[4] = node.computedBorderBottom; k[5] = node.computedBorderLeft
    k[6] = node.computedPaddingTop; k[7] = node.computedPaddingRight
    k[8] = node.computedPaddingBottom; k[9] = node.computedPaddingLeft
    k[10] = node.computedMarginTop; k[11] = node.computedMarginRight
    k[12] = node.computedMarginBottom; k[13] = node.computedMarginLeft
    k[14] = style.fontSize.toFloat()
    val renderer = style.mBorderRenderer
    renderer.updateCache(w, h)
    if (value.shape == null) renderer.copyRadii(radii) else radii.fill(0f)
    radii.copyInto(k, 15)
    k[23] = Mason.shared.rootFontSize
    if (keyVersion == version && k.contentEquals(key)) return path
    k.copyInto(key)
    keyVersion = version
    region = null
    buildShape(value, w, h, renderer)
    path.computeBounds(bounds, true)
    bounds.set(floor(bounds.left), floor(bounds.top), ceil(bounds.right), ceil(bounds.bottom))
    inverse.set(path)
    inverse.toggleInverseFillType()
    return path
  }

  private fun buildShape(value: ClipPathValue, w: Float, h: Float, renderer: BorderRenderer) {
    val k = key
    for (i in 0 until 4) {
      border[i] = k[2 + i]
      padding[i] = k[6 + i]
      margin[i] = k[10 + i]
    }
    val shape = value.shape
    if (shape == null) {
      // The border box keeps the renderer's own outline (it knows corner-shape too).
      if (value.box == GeometryBox.BORDER_BOX) {
        path.set(renderer.getOuterClipPath(w, h))
        return
      }
      fitRadii(radii, w, h)
      resolveBoxShape(value.box, w, h, radii, border, padding, margin).buildPath(path)
      return
    }
    val box = referenceBox(value.box, w, h, border, padding, margin)
    resolveBasicShape(shape, box, LengthContext.forStyle(style)).buildPath(path)
  }

  /**
   * Starts clipping [view]'s draw; false when no clip applies. `canvas.clipPath` is aliased
   * on Android, so the draw goes into a layer bounded by the shape and [end] erases what lies
   * outside it with an anti-aliased inverse fill. The caller saves/restores around both.
   */
  internal fun begin(view: android.view.View, canvas: Canvas, masked: Boolean): Boolean {
    layerSave = -1
    val value = current() ?: return false
    val w = view.width.toFloat()
    val h = view.height.toFloat()
    // The canvas is in scrolled-content coordinates; the clip belongs to the box.
    val dx = view.scrollX.toFloat()
    val dy = view.scrollY.toFloat()
    pathFor(value, w, h)
    if (path.isEmpty || bounds.isEmpty) {
      // An empty shape lets nothing through.
      canvas.clipRect(0f, 0f, 0f, 0f)
      return true
    }
    layerDx = dx
    layerDy = dy
    // saveLayer's bounds clip too, so nothing escapes the shape's bounding box.
    layerSave = canvas.saveLayer(bounds.left + dx, bounds.top + dy, bounds.right + dx, bounds.bottom + dy, null)
    // The parent skips a clipped child's outset shadow, so it's drawn here, inside the clip.
    // A mask draws its own when it can show it (Mask.beginDraw).
    if (!masked && style.hasOutsetBoxShadow() && w > 0f && h > 0f) {
      canvas.translate(dx, dy)
      style.mBorderRenderer.updateCache(w, h)
      style.mBoxShadowRenderer.drawOutsetShadows(view, canvas, w, h, style.mBorderRenderer)
      canvas.translate(-dx, -dy)
    }
    return true
  }

  /** Finishes [begin]: erases outside the shape and composites the layer. */
  internal fun end(canvas: Canvas) {
    val save = layerSave
    if (save < 0) return
    layerSave = -1
    canvas.translate(layerDx, layerDy)
    canvas.drawPath(inverse, eraser)
    canvas.restoreToCount(save)
  }

  /** Whether box point ([x], [y]) is inside the clip; true when no clip applies. */
  internal fun contains(view: android.view.View, x: Float, y: Float): Boolean {
    val value = current() ?: return true
    val w = view.width.toFloat()
    val h = view.height.toFloat()
    val p = pathFor(value, w, h)
    val r = region ?: Region().also { reg ->
      val bounds = RectF()
      p.computeBounds(bounds, true)
      reg.setPath(
        p,
        Region(floor(bounds.left).toInt() - 1, floor(bounds.top).toInt() - 1, ceil(bounds.right).toInt() + 1, ceil(bounds.bottom).toInt() + 1)
      )
      region = reg
    }
    return r.contains(floor(x).toInt(), floor(y).toInt())
  }
}

/**
 * Touches that start outside an element's clip-path don't hit it (CSS: clipped-out regions
 * take no pointer events); refusing the DOWN lets the parent offer it to what's beneath.
 */
internal fun clipPathRejectsTouch(view: android.view.View, style: Style, ev: MotionEvent): Boolean {
  val clip = style.mClipPath ?: return false
  if (ev.actionMasked != MotionEvent.ACTION_DOWN) return false
  return !clip.contains(view, ev.x, ev.y)
}

/**
 * Every Mason view's dispatchTouchEvent: a DOWN outside the clip-path, or on a pointer-events: none
 * element away from a child that takes it, passes through to what's beneath; pointer events are
 * raised before the view handles the touch.
 */
internal inline fun Element.dispatchMasonTouch(ev: MotionEvent, dispatch: (MotionEvent) -> Boolean): Boolean {
  val view = view
  if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
    if (clipPathRejectsTouch(view, style, ev)) return false
    if (node.pointerEvents == PointerEvents.NONE && !HitTesting.childTakesPoint(view, ev.x, ev.y)) return false
  }
  val wantsStream = PointerDispatch.onTouch(this, ev)
  return dispatch(ev) || wantsStream
}

/** Every Mason view's dispatchHoverEvent: raises mouse and pen pointer events. */
internal inline fun Element.dispatchMasonHover(ev: MotionEvent, dispatch: (MotionEvent) -> Boolean): Boolean {
  PointerDispatch.onHover(this, ev)
  return dispatch(ev)
}
