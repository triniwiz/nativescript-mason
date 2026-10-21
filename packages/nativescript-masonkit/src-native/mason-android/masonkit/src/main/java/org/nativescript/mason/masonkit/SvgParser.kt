package org.nativescript.mason.masonkit

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

/*
 * Static SVG reader for `data:image/svg+xml` (pure Kotlin for JVM tests; Background.kt draws). No <text>, patterns,
 * masks, filters, markers, nested <svg> or remote references. Keep in step with SvgParser.swift.
 */

/** One absolute path segment. Arcs, H/V, S and T are already normalised away. */
sealed class SvgPathCommand {
  data class MoveTo(val x: Float, val y: Float) : SvgPathCommand()
  data class LineTo(val x: Float, val y: Float) : SvgPathCommand()
  data class CubicTo(
    val x1: Float, val y1: Float, val x2: Float, val y2: Float, val x: Float, val y: Float
  ) : SvgPathCommand()

  data class QuadTo(val x1: Float, val y1: Float, val x: Float, val y: Float) : SvgPathCommand()
  object Close : SvgPathCommand() {
    override fun toString() = "Close"
  }
}

sealed class SvgPaint {
  object None : SvgPaint() {
    override fun toString() = "None"
  }

  /** The element's CSS `color`, supplied when rendering. */
  object CurrentColor : SvgPaint() {
    override fun toString() = "CurrentColor"
  }

  data class Color(val argb: Int) : SvgPaint()

  /** A gradient in the shape's own user space. */
  data class Gradient(val gradient: SvgGradient) : SvgPaint()

  /** `url(#id)` while parsing, resolved per shape; never reaches a shape. */
  internal data class Ref(val id: String, val fallback: SvgPaint?) : SvgPaint()
}

enum class SvgSpread { PAD, REFLECT, REPEAT }

/** [offset] in 0..1; [argb] includes stop-opacity. With [currentColor] only its alpha is used. */
data class SvgGradientStop(val offset: Float, val argb: Int, val currentColor: Boolean = false)

class SvgGradient(
  val radial: Boolean,
  /** Linear: the gradient vector. */
  val x1: Float, val y1: Float, val x2: Float, val y2: Float,
  /** Radial: the end circle and the focal point. */
  val cx: Float, val cy: Float, val r: Float, val fx: Float, val fy: Float,
  val stops: List<SvgGradientStop>,
  val spread: SvgSpread,
  /** Gradient space to the shape's user space (bounding-box units and gradientTransform). */
  val transform: FloatArray,
)

/** One clip shape, with the transform to root user space. */
class SvgClipPath(val commands: List<SvgPathCommand>, val transform: FloatArray, val evenOdd: Boolean)

/** A clip region: the union of its paths. */
class SvgClip(val paths: List<SvgClipPath>)

/** An `<image>`; [width]/[height] null means the image's own size. */
class SvgImage(
  val href: String,
  val x: Float, val y: Float, val width: Float?, val height: Float?,
  val alignX: Int?, val alignY: Int?, val slice: Boolean,
  val transform: FloatArray,
  val opacity: Float,
)

enum class SvgLineCap { BUTT, ROUND, SQUARE }
enum class SvgLineJoin { MITER, ROUND, BEVEL }

/** A paintable shape in the root's user space (`transform` maps it there). */
data class SvgShape(
  val commands: List<SvgPathCommand>,
  /** Affine [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f. */
  val transform: FloatArray,
  val fill: SvgPaint,
  val fillOpacity: Float,
  val evenOdd: Boolean,
  val stroke: SvgPaint,
  val strokeOpacity: Float,
  val strokeWidth: Float,
  val lineCap: SvgLineCap,
  val lineJoin: SvgLineJoin,
  val miterLimit: Float,
  val dashArray: FloatArray?,
  val dashOffset: Float,
) {
  val hasFill: Boolean get() = fill != SvgPaint.None && fillOpacity > 0f
  val hasStroke: Boolean get() = stroke != SvgPaint.None && strokeOpacity > 0f && strokeWidth > 0f

  override fun equals(other: Any?) = this === other
  override fun hashCode() = System.identityHashCode(this)
}

sealed class SvgOp {
  data class Shape(val shape: SvgShape) : SvgOp()

  /** Children until the matching [EndGroup] composite as one layer at [opacity]. */
  data class BeginGroup(val opacity: Float) : SvgOp()
  object EndGroup : SvgOp() {
    override fun toString() = "EndGroup"
  }

  /** Children until the matching [EndClip] are clipped to [clip]. */
  data class BeginClip(val clip: SvgClip) : SvgOp()
  object EndClip : SvgOp() {
    override fun toString() = "EndClip"
  }

  data class Image(val image: SvgImage) : SvgOp()
}

class SvgDocument(
  /** Intrinsic size in CSS px. */
  val width: Float,
  val height: Float,
  /** x, y, width, height; null without a (valid) viewBox. */
  val viewBox: FloatArray?,
  /** null = `none`, else one of xMin/xMid/xMax for x and y, as -1/0/1 fractions of the slack. */
  val alignX: Int?,
  val alignY: Int?,
  val slice: Boolean,
  val ops: List<SvgOp>,
  /** Some paint still needs the element's CSS `color`. */
  val usesCurrentColor: Boolean,
) {
  val shapes: List<SvgShape> get() = ops.mapNotNull { (it as? SvgOp.Shape)?.shape }

  /** The affine that maps root user space onto a [outW] x [outH] viewport. */
  fun viewportTransform(outW: Float, outH: Float): FloatArray {
    val vb = viewBox ?: return floatArrayOf(outW / width, 0f, 0f, outH / height, 0f, 0f)
    return svgViewBoxTransform(vb, alignX, alignY, slice, outW, outH)
  }
}

/** Maps viewBox [vb] (x, y, w, h) onto a [outW] x [outH] viewport per preserveAspectRatio. */
internal fun svgViewBoxTransform(vb: FloatArray, alignX: Int?, alignY: Int?, slice: Boolean, outW: Float, outH: Float): FloatArray {
  val sx = outW / vb[2]
  val sy = outH / vb[3]
  if (alignX == null || alignY == null) {
    return floatArrayOf(sx, 0f, 0f, sy, 0f - vb[0] * sx, 0f - vb[1] * sy)
  }
  val s = if (slice) max(sx, sy) else min(sx, sy)
  var tx = 0f - vb[0] * s
  var ty = 0f - vb[1] * s
  tx += (outW - vb[2] * s) * (alignX + 1) / 2f
  ty += (outH - vb[3] * s) * (alignY + 1) / 2f
  return floatArrayOf(s, 0f, 0f, s, tx, ty)
}

// MARK: - Number scanning

private fun isSvgWsp(c: Char) = c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\u000C'

internal class SvgScanner(private val s: String, var i: Int = 0) {
  val atEnd: Boolean get() = i >= s.length
  fun peek(): Char = s[i]

  fun skipWsp() {
    while (i < s.length && isSvgWsp(s[i])) i++
  }

  fun skipCommaWsp() {
    skipWsp()
    if (i < s.length && s[i] == ',') {
      i++
      skipWsp()
    }
  }

  /** An SVG number: `-1`, `.5`, `1.5` (so `1.5.5` is two numbers), `1e-3`. */
  fun number(): Double? {
    val n = s.length
    val start = i
    var j = i
    if (j < n && (s[j] == '+' || s[j] == '-')) j++
    var digits = 0
    while (j < n && s[j] in '0'..'9') { j++; digits++ }
    if (j < n && s[j] == '.') {
      j++
      while (j < n && s[j] in '0'..'9') { j++; digits++ }
    }
    if (digits == 0) return null
    if (j < n && (s[j] == 'e' || s[j] == 'E')) {
      var k = j + 1
      if (k < n && (s[k] == '+' || s[k] == '-')) k++
      if (k < n && s[k] in '0'..'9') {
        while (k < n && s[k] in '0'..'9') k++
        j = k
      }
    }
    val v = s.substring(start, j).toDoubleOrNull() ?: return null
    i = j
    return v
  }

  /** An arc flag: a single `0` or `1`, which needs no separator from what follows. */
  fun flag(): Boolean? {
    if (i < s.length && (s[i] == '0' || s[i] == '1')) {
      return (s[i++] == '1')
    }
    return null
  }
}

/** Every number in a list such as `points`, `viewBox` or `stroke-dasharray`. */
internal fun parseSvgNumberList(value: String): List<Double> {
  val sc = SvgScanner(value)
  val out = ArrayList<Double>()
  sc.skipWsp()
  while (!sc.atEnd) {
    val v = sc.number() ?: break
    out.add(v)
    sc.skipCommaWsp()
  }
  return out
}

// MARK: - Path data

private fun isPathCommand(c: Char) = "MmLlHhVvCcSsQqTtAaZz".indexOf(c) >= 0

/**
 * Parse SVG path data into absolute commands. On an error the path is kept up to the last
 * complete segment, as SVG requires.
 */
fun parseSvgPathData(d: String): List<SvgPathCommand> {
  val out = ArrayList<SvgPathCommand>()
  val sc = SvgScanner(d)
  var cmd = ' '
  var cx = 0.0
  var cy = 0.0
  var sx = 0.0
  var sy = 0.0
  // Last cubic second control point / quadratic control point, for S and T reflection.
  var lastCubic = false
  var lastQuad = false
  var ctrlX = 0.0
  var ctrlY = 0.0
  var needMove = false

  fun ensureMove() {
    if (needMove) {
      out.add(SvgPathCommand.MoveTo(cx.toFloat(), cy.toFloat()))
      needMove = false
    }
  }

  sc.skipWsp()
  loop@ while (!sc.atEnd) {
    val c = sc.peek()
    if (isPathCommand(c)) {
      cmd = c
      sc.i++
      sc.skipWsp()
    } else if (cmd == ' ' || cmd == 'Z' || cmd == 'z') {
      break // a number where a command letter must be
    }
    if (out.isEmpty() && cmd != 'M' && cmd != 'm') break // must start with a moveto
    val rel = cmd.isLowerCase()
    val ox = if (rel) cx else 0.0
    val oy = if (rel) cy else 0.0
    when (cmd) {
      'M', 'm' -> {
        val x = sc.number() ?: break@loop
        sc.skipCommaWsp()
        val y = sc.number() ?: break@loop
        cx = ox + x; cy = oy + y
        sx = cx; sy = cy
        out.add(SvgPathCommand.MoveTo(cx.toFloat(), cy.toFloat()))
        needMove = false
        lastCubic = false; lastQuad = false
        cmd = if (rel) 'l' else 'L' // further pairs are implicit linetos
      }

      'L', 'l' -> {
        val x = sc.number() ?: break@loop
        sc.skipCommaWsp()
        val y = sc.number() ?: break@loop
        ensureMove()
        cx = ox + x; cy = oy + y
        out.add(SvgPathCommand.LineTo(cx.toFloat(), cy.toFloat()))
        lastCubic = false; lastQuad = false
      }

      'H', 'h' -> {
        val x = sc.number() ?: break@loop
        ensureMove()
        cx = ox + x
        out.add(SvgPathCommand.LineTo(cx.toFloat(), cy.toFloat()))
        lastCubic = false; lastQuad = false
      }

      'V', 'v' -> {
        val y = sc.number() ?: break@loop
        ensureMove()
        cy = oy + y
        out.add(SvgPathCommand.LineTo(cx.toFloat(), cy.toFloat()))
        lastCubic = false; lastQuad = false
      }

      'C', 'c', 'S', 's' -> {
        val smooth = cmd == 'S' || cmd == 's'
        var x1: Double
        var y1: Double
        if (smooth) {
          x1 = if (lastCubic) 2 * cx - ctrlX else cx
          y1 = if (lastCubic) 2 * cy - ctrlY else cy
        } else {
          x1 = ox + (sc.number() ?: break@loop); sc.skipCommaWsp()
          y1 = oy + (sc.number() ?: break@loop); sc.skipCommaWsp()
        }
        val x2 = ox + (sc.number() ?: break@loop); sc.skipCommaWsp()
        val y2 = oy + (sc.number() ?: break@loop); sc.skipCommaWsp()
        val x = ox + (sc.number() ?: break@loop); sc.skipCommaWsp()
        val y = oy + (sc.number() ?: break@loop)
        ensureMove()
        out.add(
          SvgPathCommand.CubicTo(
            x1.toFloat(), y1.toFloat(), x2.toFloat(), y2.toFloat(), x.toFloat(), y.toFloat()
          )
        )
        ctrlX = x2; ctrlY = y2
        cx = x; cy = y
        lastCubic = true; lastQuad = false
      }

      'Q', 'q', 'T', 't' -> {
        val smooth = cmd == 'T' || cmd == 't'
        var x1: Double
        var y1: Double
        if (smooth) {
          x1 = if (lastQuad) 2 * cx - ctrlX else cx
          y1 = if (lastQuad) 2 * cy - ctrlY else cy
        } else {
          x1 = ox + (sc.number() ?: break@loop); sc.skipCommaWsp()
          y1 = oy + (sc.number() ?: break@loop); sc.skipCommaWsp()
        }
        val x = ox + (sc.number() ?: break@loop); sc.skipCommaWsp()
        val y = oy + (sc.number() ?: break@loop)
        ensureMove()
        out.add(SvgPathCommand.QuadTo(x1.toFloat(), y1.toFloat(), x.toFloat(), y.toFloat()))
        ctrlX = x1; ctrlY = y1
        cx = x; cy = y
        lastCubic = false; lastQuad = true
      }

      'A', 'a' -> {
        val rx = sc.number() ?: break@loop; sc.skipCommaWsp()
        val ry = sc.number() ?: break@loop; sc.skipCommaWsp()
        val rot = sc.number() ?: break@loop; sc.skipCommaWsp()
        val large = sc.flag() ?: break@loop; sc.skipCommaWsp()
        val sweep = sc.flag() ?: break@loop; sc.skipCommaWsp()
        val x = ox + (sc.number() ?: break@loop); sc.skipCommaWsp()
        val y = oy + (sc.number() ?: break@loop)
        ensureMove()
        appendSvgArc(out, cx, cy, rx, ry, rot, large, sweep, x, y)
        cx = x; cy = y
        lastCubic = false; lastQuad = false
      }

      'Z', 'z' -> {
        out.add(SvgPathCommand.Close)
        cx = sx; cy = sy
        needMove = true // a drawing command straight after Z starts at the subpath start
        lastCubic = false; lastQuad = false
      }

      else -> break@loop
    }
    sc.skipCommaWsp()
  }
  return out
}

/**
 * An elliptical arc from (x1, y1) to (x2, y2) as cubic Béziers: endpoint to centre
 * parameterisation per SVG 1.1 F.6.5, radii scaled up per F.6.6, then at most 90° per cubic.
 */
internal fun appendSvgArc(
  out: MutableList<SvgPathCommand>,
  x1: Double, y1: Double, rxIn: Double, ryIn: Double, angleDeg: Double,
  largeArc: Boolean, sweep: Boolean, x2: Double, y2: Double,
) {
  if (x1 == x2 && y1 == y2) return
  var rx = abs(rxIn)
  var ry = abs(ryIn)
  if (rx == 0.0 || ry == 0.0) {
    out.add(SvgPathCommand.LineTo(x2.toFloat(), y2.toFloat()))
    return
  }
  val phi = Math.toRadians(angleDeg % 360.0)
  val cosPhi = cos(phi)
  val sinPhi = sin(phi)
  val dx2 = (x1 - x2) / 2
  val dy2 = (y1 - y2) / 2
  val x1p = cosPhi * dx2 + sinPhi * dy2
  val y1p = -sinPhi * dx2 + cosPhi * dy2
  val lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    val s = sqrt(lambda)
    rx *= s; ry *= s
  }
  val rx2 = rx * rx
  val ry2 = ry * ry
  val num = rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p
  val den = rx2 * y1p * y1p + ry2 * x1p * x1p
  var coef = if (den == 0.0) 0.0 else sqrt(max(0.0, num / den))
  if (largeArc == sweep) coef = -coef
  val cxp = coef * (rx * y1p / ry)
  val cyp = coef * -(ry * x1p / rx)
  val cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2
  val cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2
  val ux = (x1p - cxp) / rx
  val uy = (y1p - cyp) / ry
  val vx = (-x1p - cxp) / rx
  val vy = (-y1p - cyp) / ry
  val theta1 = atan2(uy, ux)
  var dTheta = atan2(ux * vy - uy * vx, ux * vx + uy * vy)
  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI
  else if (sweep && dTheta < 0) dTheta += 2 * Math.PI

  val segments = max(1, ceil(abs(dTheta) / (Math.PI / 2) - 1e-7).toInt())
  val delta = dTheta / segments
  val t = 4.0 / 3.0 * tan(delta / 4)
  fun mapX(u: Double, v: Double) = cx + rx * cosPhi * u - ry * sinPhi * v
  fun mapY(u: Double, v: Double) = cy + rx * sinPhi * u + ry * cosPhi * v
  var a1 = theta1
  for (i in 0 until segments) {
    val a2 = a1 + delta
    val c1 = cos(a1)
    val s1 = sin(a1)
    val c2 = cos(a2)
    val s2 = sin(a2)
    val last = i == segments - 1
    out.add(
      SvgPathCommand.CubicTo(
        mapX(c1 - t * s1, s1 + t * c1).toFloat(), mapY(c1 - t * s1, s1 + t * c1).toFloat(),
        mapX(c2 + t * s2, s2 - t * c2).toFloat(), mapY(c2 + t * s2, s2 - t * c2).toFloat(),
        (if (last) x2 else mapX(c2, s2)).toFloat(), (if (last) y2 else mapY(c2, s2)).toFloat(),
      )
    )
    a1 = a2
  }
}

// MARK: - Basic shapes

private const val KAPPA = 0.5522847498307936

fun svgEllipseCommands(cx: Float, cy: Float, rx: Float, ry: Float): List<SvgPathCommand> {
  if (rx <= 0f || ry <= 0f) return emptyList()
  val kx = (KAPPA * rx).toFloat()
  val ky = (KAPPA * ry).toFloat()
  return listOf(
    SvgPathCommand.MoveTo(cx + rx, cy),
    SvgPathCommand.CubicTo(cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry),
    SvgPathCommand.CubicTo(cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy),
    SvgPathCommand.CubicTo(cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry),
    SvgPathCommand.CubicTo(cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy),
    SvgPathCommand.Close,
  )
}

/** A rect, rounded when rx/ry are given; a missing one copies the other, both clamp to half. */
fun svgRectCommands(x: Float, y: Float, w: Float, h: Float, rxIn: Float?, ryIn: Float?): List<SvgPathCommand> {
  if (w <= 0f || h <= 0f) return emptyList()
  var rx = rxIn?.takeIf { it >= 0f }
  var ry = ryIn?.takeIf { it >= 0f }
  if (rx == null) rx = ry ?: 0f
  if (ry == null) ry = rx
  rx = min(rx, w / 2)
  ry = min(ry, h / 2)
  if (rx <= 0f || ry <= 0f) {
    return listOf(
      SvgPathCommand.MoveTo(x, y),
      SvgPathCommand.LineTo(x + w, y),
      SvgPathCommand.LineTo(x + w, y + h),
      SvgPathCommand.LineTo(x, y + h),
      SvgPathCommand.Close,
    )
  }
  val kx = (KAPPA * rx).toFloat()
  val ky = (KAPPA * ry).toFloat()
  val r = x + w
  val b = y + h
  return listOf(
    SvgPathCommand.MoveTo(x + rx, y),
    SvgPathCommand.LineTo(r - rx, y),
    SvgPathCommand.CubicTo(r - rx + kx, y, r, y + ry - ky, r, y + ry),
    SvgPathCommand.LineTo(r, b - ry),
    SvgPathCommand.CubicTo(r, b - ry + ky, r - rx + kx, b, r - rx, b),
    SvgPathCommand.LineTo(x + rx, b),
    SvgPathCommand.CubicTo(x + rx - kx, b, x, b - ry + ky, x, b - ry),
    SvgPathCommand.LineTo(x, y + ry),
    SvgPathCommand.CubicTo(x, y + ry - ky, x + rx - kx, y, x + rx, y),
    SvgPathCommand.Close,
  )
}

fun svgPolyCommands(points: String, close: Boolean): List<SvgPathCommand> {
  val nums = parseSvgNumberList(points)
  val count = nums.size / 2
  if (count < 2) return emptyList()
  val out = ArrayList<SvgPathCommand>(count + 1)
  for (i in 0 until count) {
    val x = nums[i * 2].toFloat()
    val y = nums[i * 2 + 1].toFloat()
    out.add(if (i == 0) SvgPathCommand.MoveTo(x, y) else SvgPathCommand.LineTo(x, y))
  }
  if (close) out.add(SvgPathCommand.Close)
  return out
}

// MARK: - Transforms

internal val SVG_IDENTITY = floatArrayOf(1f, 0f, 0f, 1f, 0f, 0f)

/** m · n: apply n first, then m. */
internal fun svgMultiply(m: FloatArray, n: FloatArray) = floatArrayOf(
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
)

/** A `transform` list (matrix, translate, scale, rotate, skewX, skewY); null if malformed. */
fun parseSvgTransform(value: String): FloatArray? {
  var result = SVG_IDENTITY
  val s = value
  var i = 0
  while (i < s.length) {
    while (i < s.length && (isSvgWsp(s[i]) || s[i] == ',')) i++
    if (i >= s.length) break
    val nameStart = i
    while (i < s.length && s[i].isLetter()) i++
    val name = s.substring(nameStart, i)
    while (i < s.length && isSvgWsp(s[i])) i++
    if (name.isEmpty() || i >= s.length || s[i] != '(') return null
    val close = s.indexOf(')', i)
    if (close < 0) return null
    val args = parseSvgNumberList(s.substring(i + 1, close)).map { it.toFloat() }
    i = close + 1
    val t: FloatArray = when (name) {
      "matrix" -> if (args.size == 6) args.toFloatArray() else return null
      "translate" -> when (args.size) {
        1 -> floatArrayOf(1f, 0f, 0f, 1f, args[0], 0f)
        2 -> floatArrayOf(1f, 0f, 0f, 1f, args[0], args[1])
        else -> return null
      }

      "scale" -> when (args.size) {
        1 -> floatArrayOf(args[0], 0f, 0f, args[0], 0f, 0f)
        2 -> floatArrayOf(args[0], 0f, 0f, args[1], 0f, 0f)
        else -> return null
      }

      "rotate" -> {
        if (args.size != 1 && args.size != 3) return null
        val a = Math.toRadians(args[0].toDouble())
        val c = cos(a).toFloat()
        val sn = sin(a).toFloat()
        val r = floatArrayOf(c, sn, -sn, c, 0f, 0f)
        if (args.size == 3) {
          svgMultiply(
            svgMultiply(floatArrayOf(1f, 0f, 0f, 1f, args[1], args[2]), r),
            floatArrayOf(1f, 0f, 0f, 1f, -args[1], -args[2])
          )
        } else r
      }

      "skewX" -> if (args.size == 1) {
        floatArrayOf(1f, 0f, tan(Math.toRadians(args[0].toDouble())).toFloat(), 1f, 0f, 0f)
      } else return null

      "skewY" -> if (args.size == 1) {
        floatArrayOf(1f, tan(Math.toRadians(args[0].toDouble())).toFloat(), 0f, 1f, 0f, 0f)
      } else return null

      else -> return null
    }
    result = svgMultiply(result, t)
  }
  return result
}

// MARK: - Paint and lengths

/** `fill`/`stroke` value; null when it is not a valid paint (the attribute is then ignored). */
internal fun parseSvgPaint(raw: String): SvgPaint? {
  val v = raw.trim()
  if (v.isEmpty()) return null
  val lower = v.lowercase()
  return when {
    lower == "none" -> SvgPaint.None
    lower == "currentcolor" -> SvgPaint.CurrentColor
    lower == "transparent" -> SvgPaint.Color(0)
    lower.startsWith("url(") -> {
      val close = v.indexOf(')')
      if (close < 0) return SvgPaint.None
      val fallback = v.substring(close + 1).trim().takeIf { it.isNotEmpty() }?.let { parseSvgPaint(it) }
      SvgPaint.Ref(svgUrlFragment(v.substring(0, close + 1)) ?: "", fallback)
    }

    else -> parseSvgColor(v)?.let { SvgPaint.Color(it) }
  }
}

/** The id in a local `url(#id)` (quotes allowed), else null. */
internal fun svgUrlFragment(value: String): String? {
  val v = value.trim()
  if (!v.startsWith("url(", ignoreCase = true)) return null
  val close = v.indexOf(')')
  if (close < 0) return null
  val inner = v.substring(4, close).trim().trim('"', '\'').trim()
  return if (inner.startsWith("#") && inner.length > 1) inner.substring(1) else null
}

internal fun parseSvgColor(value: String): Int? = parseColor(value)

/** A length in user units: plain, px, the absolute units, em/ex at 16px, % of [percentBasis]. */
internal fun parseSvgLength(raw: String?, percentBasis: Float): Float? {
  val v = raw?.trim() ?: return null
  if (v.isEmpty()) return null
  val sc = SvgScanner(v)
  val n = sc.number() ?: return null
  val unit = v.substring(sc.i).trim().lowercase()
  val scale = when (unit) {
    "", "px" -> 1.0
    "%" -> percentBasis / 100.0
    "pt" -> 4.0 / 3.0
    "pc" -> 16.0
    "in" -> 96.0
    "cm" -> 96.0 / 2.54
    "mm" -> 96.0 / 25.4
    "em" -> 16.0
    "ex" -> 8.0
    else -> return null
  }
  return (n * scale).toFloat()
}

private fun parseSvgOpacity(raw: String): Float? {
  val v = raw.trim()
  val n = if (v.endsWith("%")) v.dropLast(1).trim().toFloatOrNull()?.div(100f) else v.toFloatOrNull()
  return n?.coerceIn(0f, 1f)
}

/** `preserveAspectRatio`: (alignX, alignY, slice); null align means `none`. */
internal fun parseSvgPreserveAspectRatio(raw: String?): Triple<Int?, Int?, Boolean> {
  val parts = raw?.trim()?.split(Regex("\\s+")) ?: return Triple(0, 0, false)
  val align = parts.firstOrNull() ?: ""
  val slice = parts.getOrNull(1) == "slice"
  if (align == "none") return Triple(null, null, slice)
  if (align.length == 8 && align.startsWith("x")) {
    val ax = when (align.substring(1, 4)) { "Min" -> -1; "Max" -> 1; else -> 0 }
    val ay = when (align.substring(5, 8)) { "Min" -> -1; "Max" -> 1; else -> 0 }
    return Triple(ax, ay, slice)
  }
  return Triple(0, 0, slice)
}

// MARK: - Bounds

/** Exact bounds (minX, minY, maxX, maxY) of a path's geometry, or null when it has no points. */
fun svgPathBounds(commands: List<SvgPathCommand>): FloatArray? {
  var minX = Float.MAX_VALUE
  var minY = Float.MAX_VALUE
  var maxX = -Float.MAX_VALUE
  var maxY = -Float.MAX_VALUE
  var any = false
  fun add(x: Float, y: Float) {
    any = true
    minX = min(minX, x); minY = min(minY, y); maxX = max(maxX, x); maxY = max(maxY, y)
  }
  // Roots in (0, 1) of a t^2 + b t + c.
  fun roots(a: Double, b: Double, c: Double): List<Double> {
    val out = ArrayList<Double>(2)
    if (abs(a) < 1e-12) {
      if (abs(b) > 1e-12) out.add(-c / b)
    } else {
      val disc = b * b - 4 * a * c
      if (disc >= 0) {
        val sq = sqrt(disc)
        out.add((-b + sq) / (2 * a)); out.add((-b - sq) / (2 * a))
      }
    }
    return out.filter { it > 0.0 && it < 1.0 }
  }
  var px = 0f
  var py = 0f
  for (c in commands) {
    when (c) {
      is SvgPathCommand.MoveTo -> { add(c.x, c.y); px = c.x; py = c.y }
      is SvgPathCommand.LineTo -> { add(c.x, c.y); px = c.x; py = c.y }
      is SvgPathCommand.CubicTo -> {
        add(c.x, c.y)
        fun axis(p0: Float, p1: Float, p2: Float, p3: Float) =
          roots((-p0 + 3 * p1 - 3 * p2 + p3).toDouble(), (2 * (p0 - 2 * p1 + p2)).toDouble(), (p1 - p0).toDouble())
        for (t in axis(px, c.x1, c.x2, c.x) + axis(py, c.y1, c.y2, c.y)) {
          val u = 1 - t
          add(
            (u * u * u * px + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x).toFloat(),
            (u * u * u * py + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y).toFloat(),
          )
        }
        px = c.x; py = c.y
      }

      is SvgPathCommand.QuadTo -> {
        add(c.x, c.y)
        fun axis(p0: Float, p1: Float, p2: Float) = roots(0.0, (2 * (p0 - 2 * p1 + p2)).toDouble(), (2 * (p1 - p0)).toDouble())
        for (t in axis(px, c.x1, c.x) + axis(py, c.y1, c.y)) {
          val u = 1 - t
          add((u * u * px + 2 * u * t * c.x1 + t * t * c.x).toFloat(), (u * u * py + 2 * u * t * c.y1 + t * t * c.y).toFloat())
        }
        px = c.x; py = c.y
      }

      SvgPathCommand.Close -> {}
    }
  }
  return if (any) floatArrayOf(minX, minY, maxX, maxY) else null
}

/** Bounds of [b] after affine [m]. */
internal fun svgTransformBounds(m: FloatArray, b: FloatArray): FloatArray {
  val xs = FloatArray(4)
  val ys = FloatArray(4)
  var k = 0
  for (x in floatArrayOf(b[0], b[2])) for (y in floatArrayOf(b[1], b[3])) {
    xs[k] = m[0] * x + m[2] * y + m[4]
    ys[k] = m[1] * x + m[3] * y + m[5]
    k++
  }
  var minX = xs[0]
  var minY = ys[0]
  var maxX = xs[0]
  var maxY = ys[0]
  for (q in 1 until 4) {
    minX = min(minX, xs[q]); minY = min(minY, ys[q]); maxX = max(maxX, xs[q]); maxY = max(maxY, ys[q])
  }
  return floatArrayOf(minX, minY, maxX, maxY)
}

private fun unionBounds(a: FloatArray?, b: FloatArray?): FloatArray? {
  if (a == null) return b
  if (b == null) return a
  return floatArrayOf(min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))
}

// MARK: - Style sheets

internal class SvgCssDeclaration(val name: String, val value: String, val important: Boolean)

/** A compound selector: optional type, then ids and classes. */
internal class SvgCssSelector(val type: String?, val ids: List<String>, val classes: List<String>) {
  val specificity = ids.size * 1_000_000 + classes.size * 1_000 + (if (type != null) 1 else 0)

  fun matches(name: String, id: String?, classes: Set<String>): Boolean =
    (type == null || type == name) && ids.all { it == id } && this.classes.all { it in classes }
}

internal class SvgCssRule(val selector: SvgCssSelector, val declarations: List<SvgCssDeclaration>, val order: Int)

private fun isCssIdentChar(c: Char) = c.isLetterOrDigit() || c == '-' || c == '_' || c.code > 0x7F

/** One compound selector; null for anything else (combinators, attributes, pseudo-classes). */
internal fun parseSvgCssSelector(raw: String): SvgCssSelector? {
  val s = raw.trim()
  if (s.isEmpty()) return null
  var i = 0
  var type: String? = null
  if (s[0] == '*') {
    i = 1
  } else if (isCssIdentChar(s[0])) {
    while (i < s.length && isCssIdentChar(s[i])) i++
    type = s.substring(0, i)
  }
  val ids = ArrayList<String>()
  val classes = ArrayList<String>()
  while (i < s.length) {
    val c = s[i]
    if (c != '.' && c != '#') return null
    val start = ++i
    while (i < s.length && isCssIdentChar(s[i])) i++
    if (i == start) return null
    (if (c == '.') classes else ids).add(s.substring(start, i))
  }
  return SvgCssSelector(type, ids, classes)
}

/** `name: value` pairs split on `;` outside quotes and parentheses. */
internal fun parseSvgCssDeclarations(text: String): List<SvgCssDeclaration> {
  val out = ArrayList<SvgCssDeclaration>()
  fun take(decl: String) {
    val colon = decl.indexOf(':')
    if (colon <= 0) return
    val name = decl.substring(0, colon).trim().lowercase()
    var value = decl.substring(colon + 1).trim()
    val important = Regex("!\\s*important\\s*$", RegexOption.IGNORE_CASE).find(value)
    if (important != null) value = value.substring(0, important.range.first).trim()
    if (name.isNotEmpty() && value.isNotEmpty()) out.add(SvgCssDeclaration(name, value, important != null))
  }
  var depth = 0
  var quote = 0.toChar()
  var start = 0
  for (i in text.indices) {
    val c = text[i]
    when {
      quote != 0.toChar() -> if (c == quote) quote = 0.toChar()
      c == '"' || c == '\'' -> quote = c
      c == '(' -> depth++
      c == ')' -> if (depth > 0) depth--
      c == ';' && depth == 0 -> {
        take(text.substring(start, i)); start = i + 1
      }
    }
  }
  take(text.substring(start))
  return out
}

/** Rules of a `<style>` sheet; at-rules are skipped. */
internal fun parseSvgStyleSheet(raw: String): List<SvgCssRule> {
  val css = Regex("/\\*.*?\\*/", RegexOption.DOT_MATCHES_ALL).replace(raw, " ")
  val rules = ArrayList<SvgCssRule>()
  var order = 0
  var i = 0
  val n = css.length
  while (i < n) {
    while (i < n && css[i].isWhitespace()) i++
    if (i >= n) break
    if (css[i] == '@') {
      val semi = css.indexOf(';', i).let { if (it < 0) n else it }
      val brace = css.indexOf('{', i).let { if (it < 0) n else it }
      if (semi < brace) {
        i = semi + 1
        continue
      }
      var depth = 0
      var j = brace
      while (j < n) {
        if (css[j] == '{') depth++ else if (css[j] == '}') { depth--; if (depth == 0) break }
        j++
      }
      i = j + 1
      continue
    }
    val open = css.indexOf('{', i)
    if (open < 0) break
    val close = css.indexOf('}', open).let { if (it < 0) n else it }
    val declarations = parseSvgCssDeclarations(css.substring(open + 1, close))
    for (sel in css.substring(i, open).split(',')) {
      parseSvgCssSelector(sel)?.let { rules.add(SvgCssRule(it, declarations, order++)) }
    }
    i = close + 1
  }
  return rules
}

// MARK: - Document

/** Inherited presentation state. */
private data class SvgStyleState(
  var fill: SvgPaint = SvgPaint.Color(0xFF000000.toInt()),
  var fillOpacity: Float = 1f,
  var evenOdd: Boolean = false,
  var stroke: SvgPaint = SvgPaint.None,
  var strokeOpacity: Float = 1f,
  var strokeWidth: Float = 1f,
  var lineCap: SvgLineCap = SvgLineCap.BUTT,
  var lineJoin: SvgLineJoin = SvgLineJoin.MITER,
  var miterLimit: Float = 4f,
  var dashArray: FloatArray? = null,
  var dashOffset: Float = 0f,
  /** The SVG's own `color`, which `currentColor` resolves to before the element's CSS color. */
  var color: Int? = null,
  var visible: Boolean = true,
  var clipEvenOdd: Boolean = false,
)

private val CONTAINER_TAGS = setOf("svg", "g", "a", "switch")
private val SHAPE_TAGS = setOf("path", "rect", "circle", "ellipse", "line", "polyline", "polygon")
private val GRADIENT_TAGS = setOf("linearGradient", "radialGradient")

/** Parse attributes of one start tag; returns null on a malformed tag. */
internal fun parseSvgAttributes(tag: String): Map<String, String> {
  val attrs = HashMap<String, String>()
  var i = 0
  val n = tag.length
  while (i < n) {
    while (i < n && (isSvgWsp(tag[i]) || tag[i] == '/')) i++
    val nameStart = i
    while (i < n && !isSvgWsp(tag[i]) && tag[i] != '=' && tag[i] != '/' && tag[i] != '>') i++
    if (i == nameStart) {
      i++
      continue
    }
    val name = tag.substring(nameStart, i)
    while (i < n && isSvgWsp(tag[i])) i++
    if (i >= n || tag[i] != '=') {
      attrs[name] = ""
      continue
    }
    i++
    while (i < n && isSvgWsp(tag[i])) i++
    if (i >= n) break
    val q = tag[i]
    val value: String
    if (q == '"' || q == '\'') {
      val end = tag.indexOf(q, i + 1).let { if (it < 0) n else it }
      value = tag.substring(i + 1, end)
      i = end + 1
    } else {
      val start = i
      while (i < n && !isSvgWsp(tag[i]) && tag[i] != '>') i++
      value = tag.substring(start, i)
    }
    attrs[name] = decodeXmlEntities(value)
  }
  return attrs
}

private fun decodeXmlEntities(v: String): String {
  if (v.indexOf('&') < 0) return v
  val sb = StringBuilder(v.length)
  var i = 0
  while (i < v.length) {
    val c = v[i]
    if (c == '&') {
      val semi = v.indexOf(';', i)
      if (semi > i) {
        val ent = v.substring(i + 1, semi)
        val rep: String? = when {
          ent == "amp" -> "&"
          ent == "lt" -> "<"
          ent == "gt" -> ">"
          ent == "quot" -> "\""
          ent == "apos" -> "'"
          ent.startsWith("#x") || ent.startsWith("#X") -> ent.substring(2).toIntOrNull(16)?.let { String(Character.toChars(it)) }
          ent.startsWith("#") -> ent.substring(1).toIntOrNull()?.let { String(Character.toChars(it)) }
          else -> null
        }
        if (rep != null) {
          sb.append(rep)
          i = semi + 1
          continue
        }
      }
    }
    sb.append(c)
    i++
  }
  return sb.toString()
}

private fun applySvgStyle(parent: SvgStyleState, props: Map<String, String>): SvgStyleState {
  val s = parent.copy()
  fun prop(name: String): String? = props[name]?.trim()?.takeIf { it.isNotEmpty() && it != "inherit" }
  prop("color")?.let { v -> if (!v.equals("currentcolor", true)) parseSvgColor(v)?.let { s.color = it } }
  prop("fill")?.let { v -> parseSvgPaint(v)?.let { s.fill = it } }
  prop("fill-opacity")?.let { v -> parseSvgOpacity(v)?.let { s.fillOpacity = it } }
  prop("fill-rule")?.let { v ->
    when (v) {
      "evenodd" -> s.evenOdd = true
      "nonzero" -> s.evenOdd = false
    }
  }
  prop("clip-rule")?.let { v ->
    when (v) {
      "evenodd" -> s.clipEvenOdd = true
      "nonzero" -> s.clipEvenOdd = false
    }
  }
  prop("stroke")?.let { v -> parseSvgPaint(v)?.let { s.stroke = it } }
  prop("stroke-opacity")?.let { v -> parseSvgOpacity(v)?.let { s.strokeOpacity = it } }
  prop("stroke-width")?.let { v -> parseSvgLength(v, 16f)?.takeIf { it >= 0f }?.let { s.strokeWidth = it } }
  prop("stroke-linecap")?.let { v ->
    when (v) {
      "butt" -> s.lineCap = SvgLineCap.BUTT
      "round" -> s.lineCap = SvgLineCap.ROUND
      "square" -> s.lineCap = SvgLineCap.SQUARE
    }
  }
  prop("stroke-linejoin")?.let { v ->
    when (v) {
      "miter", "miter-clip", "arcs" -> s.lineJoin = SvgLineJoin.MITER
      "round" -> s.lineJoin = SvgLineJoin.ROUND
      "bevel" -> s.lineJoin = SvgLineJoin.BEVEL
    }
  }
  prop("stroke-miterlimit")?.let { v -> v.toFloatOrNull()?.takeIf { it >= 1f }?.let { s.miterLimit = it } }
  prop("stroke-dasharray")?.let { v ->
    if (v == "none") {
      s.dashArray = null
    } else {
      val nums = parseSvgNumberList(v).map { it.toFloat() }
      s.dashArray = if (nums.isEmpty() || nums.any { it < 0f } || nums.all { it == 0f }) null
      else (if (nums.size % 2 == 1) nums + nums else nums).toFloatArray()
    }
  }
  prop("stroke-dashoffset")?.let { v -> parseSvgLength(v, 16f)?.let { s.dashOffset = it } }
  prop("visibility")?.let { v -> s.visible = v == "visible" }
  return s
}

private class SvgNode(val name: String, val attrs: Map<String, String>, val parent: SvgNode?) {
  val children = ArrayList<SvgNode>()
  val classes: Set<String> by lazy {
    attrs["class"]?.split(Regex("\\s+"))?.filter { it.isNotEmpty() }?.toSet() ?: emptySet()
  }
  var props: Map<String, String>? = null

  val href: String? get() = (attrs["href"] ?: attrs["xlink:href"])?.trim()
}

private class SvgTree(val root: SvgNode, val ids: Map<String, SvgNode>, val css: String)

/** Element tree under the first top-level `<svg>`, its ids and the text of its `<style>` sheets. */
private fun buildSvgTree(svg: String): SvgTree? {
  var root: SvgNode? = null
  // null entries are elements skipped before the root.
  val stack = ArrayList<SvgNode?>()
  val ids = HashMap<String, SvgNode>()
  val css = StringBuilder()
  var i = 0
  val n = svg.length
  while (i < n) {
    val lt = svg.indexOf('<', i)
    if (lt < 0) break
    if (svg.startsWith("<!--", lt)) {
      val end = svg.indexOf("-->", lt + 4)
      i = if (end < 0) n else end + 3
      continue
    }
    if (svg.startsWith("<![CDATA[", lt)) {
      val end = svg.indexOf("]]>", lt + 9)
      i = if (end < 0) n else end + 3
      continue
    }
    if (svg.startsWith("<?", lt) || svg.startsWith("<!", lt)) {
      val end = svg.indexOf('>', lt + 2)
      i = if (end < 0) n else end + 1
      continue
    }
    // Find the tag end, skipping quoted attribute values.
    var j = lt + 1
    var quote = 0.toChar()
    while (j < n) {
      val c = svg[j]
      if (quote != 0.toChar()) {
        if (c == quote) quote = 0.toChar()
      } else if (c == '"' || c == '\'') {
        quote = c
      } else if (c == '>') break
      j++
    }
    if (j >= n) break
    val body = svg.substring(lt + 1, j)
    i = j + 1

    if (body.startsWith("/")) {
      if (stack.isNotEmpty() && stack.removeAt(stack.size - 1) === root && root != null) break
      continue
    }
    val selfClosing = body.endsWith("/")
    var nameEnd = 0
    while (nameEnd < body.length && !isSvgWsp(body[nameEnd]) && body[nameEnd] != '/') nameEnd++
    val name = body.substring(0, nameEnd).substringAfter(':')

    if (root == null && (name != "svg" || stack.isNotEmpty())) {
      if (!selfClosing) stack.add(null)
      continue
    }
    val parent = stack.lastOrNull()
    val node = SvgNode(name, parseSvgAttributes(body.substring(nameEnd)), parent)
    parent?.children?.add(node)
    if (root == null) root = node
    node.attrs["id"]?.trim()?.takeIf { it.isNotEmpty() }?.let { ids.putIfAbsent(it, node) }
    if (name == "style" && !selfClosing) {
      val end = svg.indexOf("</style", i).let { if (it < 0) n else it }
      css.append(decodeXmlEntities(svg.substring(i, end).replace("<![CDATA[", "").replace("]]>", "")
        .replace("<!--", "").replace("-->", ""))).append('\n')
      i = svg.indexOf('>', end).let { if (it < 0) n else it + 1 }
      continue
    }
    if (selfClosing) {
      if (node === root) break
    } else {
      stack.add(node)
    }
  }
  return root?.let { SvgTree(it, ids, css.toString()) }
}

private const val MAX_SVG_DEPTH = 128
private const val MAX_SVG_VISITS = 100_000
private const val MAX_SVG_OPS = 50_000

private class SvgBuilder(val tree: SvgTree, val vbW: Float, val vbH: Float) {
  val ops = ArrayList<SvgOp>()
  var usesCurrentColor = false
  private val rules = if (tree.css.isBlank()) emptyList() else parseSvgStyleSheet(tree.css)
  private val onStack = java.util.Collections.newSetFromMap(java.util.IdentityHashMap<SvgNode, Boolean>())
  private var visits = 0
  private val diag = sqrt((vbW * vbW + vbH * vbH) / 2f)
  private val emptyClip = SvgClip(emptyList())

  /** Presentation attributes < style sheet < `style` attribute, with !important on top. */
  fun cascade(node: SvgNode): Map<String, String> {
    node.props?.let { return it }
    val out = HashMap(node.attrs)
    val id = node.attrs["id"]?.trim()
    val matched = if (rules.isEmpty()) emptyList() else rules.filter { it.selector.matches(node.name, id, node.classes) }
      .sortedWith(compareBy({ it.selector.specificity }, { it.order }))
    val inline = node.attrs["style"]?.let { parseSvgCssDeclarations(it) } ?: emptyList()
    for (r in matched) for (d in r.declarations) if (!d.important) out[d.name] = d.value
    for (d in inline) if (!d.important) out[d.name] = d.value
    for (r in matched) for (d in r.declarations) if (d.important) out[d.name] = d.value
    for (d in inline) if (d.important) out[d.name] = d.value
    node.props = out
    return out
  }

  /** The inherited style at [node] in document order (for stops and clip paths). */
  private fun documentStyle(node: SvgNode): SvgStyleState {
    val chain = generateSequence(node) { it.parent }.toList().asReversed()
    var s = SvgStyleState()
    for (n in chain) s = applySvgStyle(s, cascade(n))
    return s
  }

  private fun compose(ctm: FloatArray, node: SvgNode): FloatArray =
    node.attrs["transform"]?.let { t -> parseSvgTransform(t)?.let { svgMultiply(ctm, it) } } ?: ctm

  private fun isHidden(node: SvgNode) = cascade(node)["display"]?.trim() == "none"

  private fun opacityOf(props: Map<String, String>) = props["opacity"]?.let { parseSvgOpacity(it) } ?: 1f

  private fun lx(node: SvgNode, k: String) = parseSvgLength(node.attrs[k], vbW)
  private fun ly(node: SvgNode, k: String) = parseSvgLength(node.attrs[k], vbH)

  fun shapeCommands(node: SvgNode): List<SvgPathCommand> = when (node.name) {
    "path" -> parseSvgPathData(node.attrs["d"] ?: "")
    "rect" -> svgRectCommands(
      lx(node, "x") ?: 0f, ly(node, "y") ?: 0f, lx(node, "width") ?: 0f, ly(node, "height") ?: 0f,
      lx(node, "rx"), ly(node, "ry")
    )

    "circle" -> {
      val r = parseSvgLength(node.attrs["r"], diag) ?: 0f
      svgEllipseCommands(lx(node, "cx") ?: 0f, ly(node, "cy") ?: 0f, r, r)
    }

    "ellipse" -> {
      val rx = lx(node, "rx")
      val ry = ly(node, "ry")
      svgEllipseCommands(lx(node, "cx") ?: 0f, ly(node, "cy") ?: 0f, rx ?: ry ?: 0f, ry ?: rx ?: 0f)
    }

    "line" -> listOf(
      SvgPathCommand.MoveTo(lx(node, "x1") ?: 0f, ly(node, "y1") ?: 0f),
      SvgPathCommand.LineTo(lx(node, "x2") ?: 0f, ly(node, "y2") ?: 0f),
    )

    "polyline" -> svgPolyCommands(node.attrs["points"] ?: "", close = false)
    "polygon" -> svgPolyCommands(node.attrs["points"] ?: "", close = true)
    else -> emptyList()
  }

  // MARK: bounds

  private fun useTarget(node: SvgNode): SvgNode? {
    val h = node.href ?: return null
    return if (h.startsWith("#")) tree.ids[h.substring(1)] else null
  }

  /** Bounds of [node]'s geometry in its own user space (inside its transform). */
  private fun localBounds(node: SvgNode, depth: Int, seen: MutableSet<SvgNode>): FloatArray? {
    if (depth > MAX_SVG_DEPTH || !seen.add(node)) return null
    try {
      return when (node.name) {
        in SHAPE_TAGS -> svgPathBounds(shapeCommands(node))
        "image" -> {
          val w = lx(node, "width") ?: return null
          val h = ly(node, "height") ?: return null
          val x = lx(node, "x") ?: 0f
          val y = ly(node, "y") ?: 0f
          floatArrayOf(x, y, x + w, y + h)
        }

        in CONTAINER_TAGS -> {
          var b: FloatArray? = null
          for (c in node.children) b = unionBounds(b, childBounds(c, depth + 1, seen))
          b
        }

        "use" -> {
          val target = useTarget(node) ?: return null
          val t = floatArrayOf(1f, 0f, 0f, 1f, lx(node, "x") ?: 0f, ly(node, "y") ?: 0f)
          if (target.name == "symbol") {
            val w = lx(node, "width") ?: vbW
            val h = ly(node, "height") ?: vbH
            svgTransformBounds(t, floatArrayOf(0f, 0f, w, h))
          } else {
            childBounds(target, depth + 1, seen)?.let { svgTransformBounds(t, it) }
          }
        }

        else -> null
      }
    } finally {
      seen.remove(node)
    }
  }

  /** Bounds of [node] in its parent's user space. */
  private fun childBounds(node: SvgNode, depth: Int, seen: MutableSet<SvgNode>): FloatArray? {
    if (isHidden(node)) return null
    val b = localBounds(node, depth, seen) ?: return null
    return svgTransformBounds(compose(SVG_IDENTITY, node), b)
  }

  private fun boundsOf(node: SvgNode): FloatArray? =
    localBounds(node, 0, java.util.Collections.newSetFromMap(java.util.IdentityHashMap()))

  // MARK: paint

  private fun resolvePaint(p: SvgPaint, style: SvgStyleState, bounds: () -> FloatArray?): SvgPaint = when (p) {
    SvgPaint.CurrentColor -> {
      val c = style.color
      if (c != null) SvgPaint.Color(c) else {
        usesCurrentColor = true
        p
      }
    }

    is SvgPaint.Ref -> {
      val node = tree.ids[p.id]
      if (node != null && node.name in GRADIENT_TAGS) gradientPaint(node, bounds)
      else p.fallback?.let { resolvePaint(it, style, bounds) } ?: SvgPaint.None
    }

    else -> p
  }

  private fun gradientPaint(node: SvgNode, bounds: () -> FloatArray?): SvgPaint {
    // The href chain, this gradient first.
    val chain = ArrayList<SvgNode>()
    val seen = java.util.Collections.newSetFromMap(java.util.IdentityHashMap<SvgNode, Boolean>())
    var g: SvgNode? = node
    while (g != null && g.name in GRADIENT_TAGS && chain.size < 16 && seen.add(g)) {
      chain.add(g)
      g = g.href?.takeIf { it.startsWith("#") }?.let { tree.ids[it.substring(1)] }
    }
    fun attr(k: String, sameType: Boolean = false): String? =
      chain.firstNotNullOfOrNull { if (sameType && it.name != node.name) null else it.attrs[k]?.trim()?.takeIf { v -> v.isNotEmpty() } }

    val stops = ArrayList<SvgGradientStop>()
    val stopNodes = chain.firstOrNull { c -> c.children.any { it.name == "stop" } }?.children?.filter { it.name == "stop" } ?: emptyList()
    var last = 0f
    for (stop in stopNodes) {
      val props = cascade(stop)
      val offset = stop.attrs["offset"]?.trim()?.let { o ->
        if (o.endsWith("%")) o.dropLast(1).trim().toFloatOrNull()?.div(100f) else o.toFloatOrNull()
      } ?: 0f
      last = max(last, offset.coerceIn(0f, 1f))
      val opacity = props["stop-opacity"]?.let { parseSvgOpacity(it) } ?: 1f
      val raw = props["stop-color"]?.trim()?.takeIf { it.isNotEmpty() && it != "inherit" } ?: "black"
      var argb = 0xFF000000.toInt()
      var current = false
      if (raw.equals("currentcolor", true)) {
        val c = documentStyle(stop).color
        if (c != null) argb = c else {
          current = true
          usesCurrentColor = true
        }
      } else {
        argb = parseSvgColor(raw) ?: 0xFF000000.toInt()
      }
      val alpha = (((argb ushr 24) and 0xFF) * opacity).toInt().coerceIn(0, 255)
      stops.add(SvgGradientStop(last, (alpha shl 24) or (argb and 0xFFFFFF), current))
    }
    if (stops.isEmpty()) return SvgPaint.None

    val obb = attr("gradientUnits") != "userSpaceOnUse"
    val spread = when (attr("spreadMethod")) {
      "reflect" -> SvgSpread.REFLECT
      "repeat" -> SvgSpread.REPEAT
      else -> SvgSpread.PAD
    }
    var transform = attr("gradientTransform")?.let { parseSvgTransform(it) } ?: SVG_IDENTITY
    if (obb) {
      val b = bounds() ?: return SvgPaint.None
      val w = b[2] - b[0]
      val h = b[3] - b[1]
      if (w <= 0f || h <= 0f) return SvgPaint.None
      transform = svgMultiply(floatArrayOf(w, 0f, 0f, h, b[0], b[1]), transform)
    }
    fun len(k: String, def: String, basis: Float, sameType: Boolean = true): Float {
      val b = if (obb) 1f else basis
      return parseSvgLength(attr(k, sameType) ?: def, b) ?: parseSvgLength(def, b) ?: 0f
    }
    fun solid(): SvgPaint {
      val s = stops.last()
      if (!s.currentColor) return SvgPaint.Color(s.argb)
      return SvgPaint.Gradient(
        SvgGradient(false, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 0f, 0f, listOf(s.copy(offset = 0f), s.copy(offset = 1f)), SvgSpread.PAD, transform)
      )
    }
    if (stops.size == 1) return solid()

    if (node.name == "linearGradient") {
      val x1 = len("x1", "0%", vbW)
      val y1 = len("y1", "0%", vbH)
      val x2 = len("x2", "100%", vbW)
      val y2 = len("y2", "0%", vbH)
      if (x1 == x2 && y1 == y2) return solid()
      return SvgPaint.Gradient(SvgGradient(false, x1, y1, x2, y2, 0f, 0f, 0f, 0f, 0f, stops, spread, transform))
    }
    val cx = len("cx", "50%", vbW)
    val cy = len("cy", "50%", vbH)
    val r = len("r", "50%", diag)
    if (r < 0f) return SvgPaint.None
    if (r == 0f) return solid()
    var fx = attr("fx", true)?.let { parseSvgLength(it, if (obb) 1f else vbW) } ?: cx
    var fy = attr("fy", true)?.let { parseSvgLength(it, if (obb) 1f else vbH) } ?: cy
    // A focal point outside the end circle moves onto it, as in SVG 1.1.
    val d = hypot(fx - cx, fy - cy)
    if (d > r * 0.999f) {
      val k = r * 0.999f / d
      fx = cx + (fx - cx) * k
      fy = cy + (fy - cy) * k
    }
    return SvgPaint.Gradient(SvgGradient(true, 0f, 0f, 0f, 0f, cx, cy, r, fx, fy, stops, spread, transform))
  }

  // MARK: clipping

  /** The clip for [props]' `clip-path` at [ctm]; null for none, [emptyClip] when nothing shows. */
  private fun resolveClip(props: Map<String, String>, ctm: FloatArray, bounds: () -> FloatArray?): SvgClip? {
    val id = props["clip-path"]?.let { svgUrlFragment(it) } ?: return null
    val clipNode = tree.ids[id]?.takeIf { it.name == "clipPath" } ?: return null
    var base = ctm
    if (clipNode.attrs["clipPathUnits"]?.trim() == "objectBoundingBox") {
      val b = bounds() ?: return emptyClip
      val w = b[2] - b[0]
      val h = b[3] - b[1]
      if (w <= 0f || h <= 0f) return emptyClip
      base = svgMultiply(base, floatArrayOf(w, 0f, 0f, h, b[0], b[1]))
    }
    base = compose(base, clipNode)
    val style = documentStyle(clipNode)
    val paths = ArrayList<SvgClipPath>()
    for (child in clipNode.children) collectClip(child, style, base, paths, allowUse = true)
    return if (paths.isEmpty()) emptyClip else SvgClip(paths)
  }

  private fun collectClip(node: SvgNode, parent: SvgStyleState, base: FloatArray, out: MutableList<SvgClipPath>, allowUse: Boolean) {
    if (isHidden(node)) return
    val style = applySvgStyle(parent, cascade(node))
    if (!style.visible) return
    val m = compose(base, node)
    if (node.name in SHAPE_TAGS) {
      val commands = shapeCommands(node)
      if (commands.size >= 2) out.add(SvgClipPath(commands, m, style.clipEvenOdd))
    } else if (node.name == "use" && allowUse) {
      val target = useTarget(node)?.takeIf { it.name in SHAPE_TAGS } ?: return
      val t = svgMultiply(m, floatArrayOf(1f, 0f, 0f, 1f, lx(node, "x") ?: 0f, ly(node, "y") ?: 0f))
      collectClip(target, style, t, out, allowUse = false)
    }
  }

  /** Runs [body] inside [props]' clip; skips it when the clip shows nothing. */
  private inline fun withClip(props: Map<String, String>, ctm: FloatArray, noinline bounds: () -> FloatArray?, body: () -> Unit) {
    val clip = resolveClip(props, ctm, bounds)
    if (clip === emptyClip) return
    if (clip == null) {
      body()
      return
    }
    ops.add(SvgOp.BeginClip(clip))
    val start = ops.size
    body()
    if (ops.size == start) ops.removeAt(ops.size - 1) else ops.add(SvgOp.EndClip)
  }

  // MARK: walk

  fun walk(node: SvgNode, parent: SvgStyleState, ctm: FloatArray, depth: Int) {
    if (depth > MAX_SVG_DEPTH || ++visits > MAX_SVG_VISITS || ops.size >= MAX_SVG_OPS) return
    if (isHidden(node) || !onStack.add(node)) return
    try {
      when (node.name) {
        in CONTAINER_TAGS -> walkContainer(node, parent, ctm, depth)
        in SHAPE_TAGS -> walkShape(node, parent, ctm)
        "use" -> walkUse(node, parent, ctm, depth)
        "image" -> walkImage(node, parent, ctm)
      }
    } finally {
      onStack.remove(node)
    }
  }

  private fun walkContainer(node: SvgNode, parent: SvgStyleState, parentCtm: FloatArray, depth: Int) {
    val props = cascade(node)
    val style = applySvgStyle(parent, props)
    // The root's own transform is ignored (as in SVG 1.1); nested elements compose theirs.
    val ctm = if (node === tree.root) parentCtm else compose(parentCtm, node)
    val opacity = opacityOf(props)
    withClip(props, ctm, { boundsOf(node) }) {
      val group = opacity < 1f
      if (group) ops.add(SvgOp.BeginGroup(opacity))
      for (child in node.children) walk(child, style, ctm, depth + 1)
      if (group) ops.add(SvgOp.EndGroup)
    }
  }

  private fun walkShape(node: SvgNode, parent: SvgStyleState, parentCtm: FloatArray) {
    val props = cascade(node)
    val style = applySvgStyle(parent, props)
    val ctm = compose(parentCtm, node)
    val opacity = opacityOf(props)
    if (!style.visible || opacity <= 0f) return
    val commands = shapeCommands(node)
    if (commands.size < 2) return
    var bounds: FloatArray? = null
    var measured = false
    val boundsFn = {
      if (!measured) {
        bounds = svgPathBounds(commands); measured = true
      }
      bounds
    }
    val fill = if (node.name == "line") SvgPaint.None else resolvePaint(style.fill, style, boundsFn)
    val stroke = resolvePaint(style.stroke, style, boundsFn)
    var shape = SvgShape(
      commands = commands,
      transform = ctm,
      fill = fill,
      fillOpacity = style.fillOpacity,
      evenOdd = style.evenOdd,
      stroke = stroke,
      strokeOpacity = style.strokeOpacity,
      strokeWidth = style.strokeWidth,
      lineCap = style.lineCap,
      lineJoin = style.lineJoin,
      miterLimit = style.miterLimit,
      dashArray = style.dashArray,
      dashOffset = style.dashOffset,
    )
    if (!shape.hasFill && !shape.hasStroke) return
    withClip(props, ctm, boundsFn) {
      if (opacity < 1f) {
        if (shape.hasFill && shape.hasStroke) {
          // Fill and stroke overlap, so they composite together.
          ops.add(SvgOp.BeginGroup(opacity))
          ops.add(SvgOp.Shape(shape))
          ops.add(SvgOp.EndGroup)
          return@withClip
        }
        shape = shape.copy(fillOpacity = shape.fillOpacity * opacity, strokeOpacity = shape.strokeOpacity * opacity)
      }
      ops.add(SvgOp.Shape(shape))
    }
  }

  private fun walkUse(node: SvgNode, parent: SvgStyleState, parentCtm: FloatArray, depth: Int) {
    val target = useTarget(node) ?: return
    val props = cascade(node)
    val style = applySvgStyle(parent, props)
    // x/y translate the referenced content; the use's own clip is in its user space.
    val own = compose(parentCtm, node)
    val ctm = svgMultiply(own, floatArrayOf(1f, 0f, 0f, 1f, lx(node, "x") ?: 0f, ly(node, "y") ?: 0f))
    val opacity = opacityOf(props)
    withClip(props, own, { boundsOf(node) }) {
      val group = opacity < 1f
      if (group) ops.add(SvgOp.BeginGroup(opacity))
      if (target.name == "symbol") walkSymbol(target, node, style, ctm, depth + 1) else walk(target, style, ctm, depth + 1)
      if (group) ops.add(SvgOp.EndGroup)
    }
  }

  private fun walkSymbol(symbol: SvgNode, use: SvgNode, parent: SvgStyleState, ctm: FloatArray, depth: Int) {
    if (depth > MAX_SVG_DEPTH || isHidden(symbol) || !onStack.add(symbol)) return
    try {
      val w = lx(use, "width") ?: vbW
      val h = ly(use, "height") ?: vbH
      if (w <= 0f || h <= 0f) return
      val props = cascade(symbol)
      val style = applySvgStyle(parent, props)
      val vb = symbol.attrs["viewBox"]?.let { v ->
        parseSvgNumberList(v).takeIf { it.size == 4 && it[2] > 0 && it[3] > 0 }?.map { it.toFloat() }?.toFloatArray()
      }
      val (ax, ay, slice) = parseSvgPreserveAspectRatio(symbol.attrs["preserveAspectRatio"])
      val inner = if (vb != null) svgMultiply(ctm, svgViewBoxTransform(vb, ax, ay, slice, w, h)) else ctm
      val overflow = props["overflow"]?.trim()
      val clip = if (overflow == "visible" || overflow == "auto") null
      else SvgClip(listOf(SvgClipPath(svgRectCommands(0f, 0f, w, h, null, null), ctm, false)))
      val opacity = opacityOf(props)
      if (clip != null) ops.add(SvgOp.BeginClip(clip))
      if (opacity < 1f) ops.add(SvgOp.BeginGroup(opacity))
      for (child in symbol.children) walk(child, style, inner, depth + 1)
      if (opacity < 1f) ops.add(SvgOp.EndGroup)
      if (clip != null) ops.add(SvgOp.EndClip)
    } finally {
      onStack.remove(symbol)
    }
  }

  private fun walkImage(node: SvgNode, parent: SvgStyleState, parentCtm: FloatArray) {
    val props = cascade(node)
    val style = applySvgStyle(parent, props)
    val ctm = compose(parentCtm, node)
    val opacity = opacityOf(props)
    if (!style.visible || opacity <= 0f) return
    val href = node.href ?: return
    // Raster data: URLs only; an SVG inside an SVG is not drawn.
    if (!href.startsWith("data:", true) || href.startsWith("data:image/svg", true)) return
    val w = lx(node, "width")
    val h = ly(node, "height")
    if ((w != null && w <= 0f) || (h != null && h <= 0f)) return
    val x = lx(node, "x") ?: 0f
    val y = ly(node, "y") ?: 0f
    val (ax, ay, slice) = parseSvgPreserveAspectRatio(node.attrs["preserveAspectRatio"])
    withClip(props, ctm, { if (w != null && h != null) floatArrayOf(x, y, x + w, y + h) else null }) {
      ops.add(SvgOp.Image(SvgImage(href, x, y, w, h, ax, ay, slice, ctm, opacity)))
    }
  }
}

/** Parse an SVG document; null when it has no root `<svg>` or no usable size. */
fun parseSvgDocument(svg: String): SvgDocument? {
  val tree = buildSvgTree(svg) ?: return null
  val attrs = tree.root.attrs
  val viewBox = attrs["viewBox"]?.let { vb ->
    parseSvgNumberList(vb).takeIf { it.size == 4 && it[2] > 0 && it[3] > 0 }
      ?.map { it.toFloat() }?.toFloatArray()
  }
  var vbW = viewBox?.get(2) ?: 0f
  var vbH = viewBox?.get(3) ?: 0f
  val w = attrs["width"]?.takeIf { !it.trim().endsWith("%") }?.let { parseSvgLength(it, 0f) }?.takeIf { it > 0f }
  val h = attrs["height"]?.takeIf { !it.trim().endsWith("%") }?.let { parseSvgLength(it, 0f) }?.takeIf { it > 0f }
  val ratio = if (vbW > 0f && vbH > 0f) vbW / vbH else null
  val width = w ?: (if (h != null && ratio != null) h * ratio else vbW)
  val height = h ?: (if (w != null && ratio != null) w / ratio else vbH)
  if (vbW <= 0f) vbW = width
  if (vbH <= 0f) vbH = height
  val (alignX, alignY, slice) = parseSvgPreserveAspectRatio(attrs["preserveAspectRatio"])
  if (width <= 0f || height <= 0f) return null

  val builder = SvgBuilder(tree, vbW, vbH)
  builder.walk(tree.root, SvgStyleState(), SVG_IDENTITY, 0)
  return SvgDocument(width, height, viewBox, alignX, alignY, slice, builder.ops, builder.usesCurrentColor)
}

/** Percent-decode a data URI payload; malformed escapes stay as written and `+` stays `+`. */
fun percentDecodeBytes(payload: String): ByteArray {
  val bytes = java.io.ByteArrayOutputStream(payload.length)
  var i = 0
  while (i < payload.length) {
    if (payload[i] == '%' && i + 2 < payload.length) {
      val hi = Character.digit(payload[i + 1], 16)
      val lo = Character.digit(payload[i + 2], 16)
      if (hi >= 0 && lo >= 0) {
        bytes.write(hi * 16 + lo)
        i += 3
        continue
      }
    }
    val cp = payload.codePointAt(i)
    val enc = String(Character.toChars(cp)).toByteArray(Charsets.UTF_8)
    bytes.write(enc, 0, enc.size)
    i += Character.charCount(cp)
  }
  return bytes.toByteArray()
}

fun decodeSvgDataPayload(payload: String): String =
  if (payload.indexOf('%') < 0) payload else String(percentDecodeBytes(payload), Charsets.UTF_8)
