package org.nativescript.mason.masonkit

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

/*
 * A small static-SVG reader for `data:image/svg+xml` images. Pure Kotlin (no android.graphics)
 * so the JVM tests can run it; `renderSvgDocument` in Background.kt rasterizes the result.
 * Covers the basic shapes, the full path grammar, presentation attributes, `transform` and
 * viewBox; not gradients/patterns (`url(#..)` uses its fallback colour), <use>, <text>,
 * <image>, clip paths, masks, filters, markers or <style>. Mirrors `SvgParser.swift`; keep
 * the two in step.
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
}

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
      // Gradients/patterns aren't drawn: use the fallback colour, else nothing.
      val close = v.indexOf(')')
      val fallback = if (close >= 0) v.substring(close + 1).trim() else ""
      if (fallback.isEmpty()) SvgPaint.None else parseSvgPaint(fallback) ?: SvgPaint.None
    }

    else -> parseSvgColor(v)?.let { SvgPaint.Color(it) }
  }
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
)

private class SvgFrame(val style: SvgStyleState, val ctm: FloatArray, val skip: Boolean, val group: Boolean)

private val CONTAINER_TAGS = setOf("svg", "g", "a", "switch")
private val SHAPE_TAGS = setOf("path", "rect", "circle", "ellipse", "line", "polyline", "polygon")

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

/** Presentation attributes plus the `style` attribute's declarations (which win). */
private fun svgProperties(attrs: Map<String, String>): Map<String, String> {
  val style = attrs["style"] ?: return attrs
  val merged = HashMap(attrs)
  for (decl in style.split(';')) {
    val colon = decl.indexOf(':')
    if (colon <= 0) continue
    val name = decl.substring(0, colon).trim().lowercase()
    val value = decl.substring(colon + 1).replace("!important", "").trim()
    if (name.isNotEmpty() && value.isNotEmpty()) merged[name] = value
  }
  return merged
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

/** Parse an SVG document; null when it has no root `<svg>` or no usable size. */
fun parseSvgDocument(svg: String): SvgDocument? {
  val ops = ArrayList<SvgOp>()
  val stack = ArrayList<SvgFrame>()
  var usesCurrentColor = false
  var rootFound = false
  var width = 0f
  var height = 0f
  var viewBox: FloatArray? = null
  var alignX: Int? = 0
  var alignY: Int? = 0
  var slice = false
  var vbW = 0f
  var vbH = 0f

  fun resolvePaint(p: SvgPaint, style: SvgStyleState): SvgPaint {
    if (p != SvgPaint.CurrentColor) return p
    style.color?.let { return SvgPaint.Color(it) }
    usesCurrentColor = true
    return p
  }

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
      if (stack.isNotEmpty()) {
        val frame = stack.removeAt(stack.size - 1)
        if (frame.group) ops.add(SvgOp.EndGroup)
      }
      continue
    }
    val selfClosing = body.endsWith("/")
    var nameEnd = 0
    while (nameEnd < body.length && !isSvgWsp(body[nameEnd]) && body[nameEnd] != '/') nameEnd++
    val rawName = body.substring(0, nameEnd)
    val name = rawName.substringAfter(':')
    val parent = stack.lastOrNull()

    if (!rootFound) {
      if (name != "svg") {
        if (!selfClosing) stack.add(SvgFrame(SvgStyleState(), SVG_IDENTITY, skip = true, group = false))
        continue
      }
    }
    if (parent?.skip == true) {
      if (!selfClosing) stack.add(SvgFrame(parent.style, parent.ctm, skip = true, group = false))
      continue
    }

    val attrs = parseSvgAttributes(body.substring(nameEnd))
    val props = svgProperties(attrs)

    val isRoot = !rootFound
    if (isRoot) {
      rootFound = true
      viewBox = attrs["viewBox"]?.let { vb ->
        parseSvgNumberList(vb).takeIf { it.size == 4 && it[2] > 0 && it[3] > 0 }
          ?.map { it.toFloat() }?.toFloatArray()
      }
      vbW = viewBox?.get(2) ?: 0f
      vbH = viewBox?.get(3) ?: 0f
      val w = attrs["width"]?.takeIf { !it.trim().endsWith("%") }?.let { parseSvgLength(it, 0f) }?.takeIf { it > 0f }
      val h = attrs["height"]?.takeIf { !it.trim().endsWith("%") }?.let { parseSvgLength(it, 0f) }?.takeIf { it > 0f }
      val ratio = if (vbW > 0f && vbH > 0f) vbW / vbH else null
      width = w ?: (if (h != null && ratio != null) h * ratio else vbW)
      height = h ?: (if (w != null && ratio != null) w / ratio else vbH)
      if (vbW <= 0f) vbW = width
      if (vbH <= 0f) vbH = height
      attrs["preserveAspectRatio"]?.trim()?.split(Regex("\\s+"))?.let { parts ->
        when (val align = parts.firstOrNull() ?: "") {
          "none" -> { alignX = null; alignY = null }
          else -> if (align.length == 8 && align.startsWith("x")) {
            alignX = when (align.substring(1, 4)) { "Min" -> -1; "Max" -> 1; else -> 0 }
            alignY = when (align.substring(5, 8)) { "Min" -> -1; "Max" -> 1; else -> 0 }
          }
        }
        slice = parts.getOrNull(1) == "slice"
      }
    }

    val parentStyle = parent?.style ?: SvgStyleState()
    val parentCtm = parent?.ctm ?: SVG_IDENTITY
    val hidden = props["display"]?.trim() == "none"
    val isContainer = name in CONTAINER_TAGS
    val isShape = name in SHAPE_TAGS

    if (hidden || (!isContainer && !isShape)) {
      if (!selfClosing) stack.add(SvgFrame(parentStyle, parentCtm, skip = true, group = false))
      continue
    }

    val style = applySvgStyle(parentStyle, props)
    // The root's own transform is ignored (as in SVG 1.1); nested elements compose theirs.
    val ctm = if (isRoot) parentCtm else {
      attrs["transform"]?.let { t -> parseSvgTransform(t)?.let { svgMultiply(parentCtm, it) } } ?: parentCtm
    }
    val opacity = props["opacity"]?.let { parseSvgOpacity(it) } ?: 1f

    if (isContainer) {
      val group = opacity < 1f
      if (group) ops.add(SvgOp.BeginGroup(opacity))
      if (selfClosing) {
        if (group) ops.add(SvgOp.EndGroup)
      } else {
        stack.add(SvgFrame(style, ctm, skip = false, group = group))
      }
      continue
    }

    // A shape. Its children (<title>, <animate>, ...) are never drawn.
    if (!selfClosing) stack.add(SvgFrame(style, ctm, skip = true, group = false))
    if (!style.visible || opacity <= 0f) continue
    val diag = sqrt((vbW * vbW + vbH * vbH) / 2f)
    fun lx(k: String) = parseSvgLength(attrs[k], vbW)
    fun ly(k: String) = parseSvgLength(attrs[k], vbH)
    val commands: List<SvgPathCommand> = when (name) {
      "path" -> parseSvgPathData(attrs["d"] ?: "")
      "rect" -> svgRectCommands(lx("x") ?: 0f, ly("y") ?: 0f, lx("width") ?: 0f, ly("height") ?: 0f, lx("rx"), ly("ry"))
      "circle" -> {
        val r = parseSvgLength(attrs["r"], diag) ?: 0f
        svgEllipseCommands(lx("cx") ?: 0f, ly("cy") ?: 0f, r, r)
      }

      "ellipse" -> {
        val rx = lx("rx")
        val ry = ly("ry")
        svgEllipseCommands(lx("cx") ?: 0f, ly("cy") ?: 0f, rx ?: ry ?: 0f, ry ?: rx ?: 0f)
      }

      "line" -> listOf(
        SvgPathCommand.MoveTo(lx("x1") ?: 0f, ly("y1") ?: 0f),
        SvgPathCommand.LineTo(lx("x2") ?: 0f, ly("y2") ?: 0f),
      )

      "polyline" -> svgPolyCommands(attrs["points"] ?: "", close = false)
      "polygon" -> svgPolyCommands(attrs["points"] ?: "", close = true)
      else -> emptyList()
    }
    if (commands.size < 2) continue

    val fill = if (name == "line") SvgPaint.None else resolvePaint(style.fill, style)
    val stroke = resolvePaint(style.stroke, style)
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
    if (!shape.hasFill && !shape.hasStroke) continue
    if (opacity < 1f) {
      if (shape.hasFill && shape.hasStroke) {
        // Fill and stroke overlap, so they composite together.
        ops.add(SvgOp.BeginGroup(opacity))
        ops.add(SvgOp.Shape(shape))
        ops.add(SvgOp.EndGroup)
        continue
      }
      shape = shape.copy(fillOpacity = shape.fillOpacity * opacity, strokeOpacity = shape.strokeOpacity * opacity)
    }
    ops.add(SvgOp.Shape(shape))
  }
  // An unclosed document still balances its groups.
  for (frame in stack.asReversed()) if (frame.group) ops.add(SvgOp.EndGroup)

  if (!rootFound || width <= 0f || height <= 0f) return null
  return SvgDocument(width, height, viewBox, alignX, alignY, slice, ops, usesCurrentColor)
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
