package org.nativescript.mason.masonkit

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

/**
 * CSS `transform` (CSS Transforms 1 and the 3D functions of level 2). Lengths stay unresolved
 * until the box size is known: percentages in `translate*` are of the element's border box.
 */
internal sealed class TransformFn {
  data class Translate(val x: CssLength, val y: CssLength, val z: CssLength = CssLength.ZERO) : TransformFn()
  data class Scale(val x: Float, val y: Float, val z: Float = 1f) : TransformFn()
  /** Rotation about ([x], [y], [z]) by [degrees]; a 2D rotate is about z. */
  data class Rotate(val x: Float, val y: Float, val z: Float, val degrees: Float) : TransformFn()
  data class Skew(val xDegrees: Float, val yDegrees: Float) : TransformFn()
  /** Column-major 4x4. */
  class Matrix(val m: FloatArray) : TransformFn()
  /** `perspective()`: kept so a list round-trips, but a flat element ignores it (see [projectAffine]). */
  data class Perspective(val length: CssLength?) : TransformFn()
}

private val TRANSFORM_FN = Regex("""([a-zA-Z0-9]+)\(([^()]*)\)""")

/** The functions of a `transform` value, or null when any of it is invalid. `none` is empty. */
internal fun parseTransformList(value: String): List<TransformFn>? {
  val v = value.trim()
  if (v.isEmpty() || v.equals("none", ignoreCase = true)) return emptyList()
  val out = mutableListOf<TransformFn>()
  var last = 0
  for (m in TRANSFORM_FN.findAll(v)) {
    if (v.substring(last, m.range.first).isNotBlank()) return null
    last = m.range.last + 1
    val args = m.groupValues[2].split(',').flatMap { it.trim().split(Regex("""\s+""")) }.filter { it.isNotEmpty() }
    out.add(parseTransformFn(m.groupValues[1].lowercase(), args) ?: return null)
  }
  if (v.substring(last).isNotBlank() || out.isEmpty()) return null
  return out
}

private fun number(token: String?): Float? = token?.trim()?.toFloatOrNull()?.takeIf { it.isFinite() }

/** `scale()` also takes percentages. */
private fun scaleNumber(token: String?): Float? {
  val t = token?.trim() ?: return null
  return if (t.endsWith("%")) number(t.dropLast(1))?.div(100f) else number(t)
}

private fun length(token: String?): CssLength? {
  val t = token ?: return null
  // A bare 0 is a length; other bare numbers read as px, as elsewhere in Mason.
  return parseCssLength(t)
}

/** An `<angle>`; a bare number is degrees, as Mason has always read it. */
private fun angle(token: String?): Float? {
  val t = token?.trim()?.lowercase() ?: return null
  number(t)?.let { return it }
  return parseCssAngleToRadians(t)?.let { Math.toDegrees(it).toFloat() }?.takeIf { it.isFinite() }
}

private fun parseTransformFn(name: String, a: List<String>): TransformFn? {
  return when (name) {
  "translate" -> if (a.size in 1..2) TransformFn.Translate(length(a[0]) ?: return null, if (a.size == 2) length(a[1]) ?: return null else CssLength.ZERO) else null
  "translatex" -> if (a.size == 1) TransformFn.Translate(length(a[0]) ?: return null, CssLength.ZERO) else null
  "translatey" -> if (a.size == 1) TransformFn.Translate(CssLength.ZERO, length(a[0]) ?: return null) else null
  "translatez" -> if (a.size == 1) TransformFn.Translate(CssLength.ZERO, CssLength.ZERO, length(a[0])?.takeIf { !it.isPercent } ?: return null) else null
  "translate3d" -> if (a.size == 3) TransformFn.Translate(length(a[0]) ?: return null, length(a[1]) ?: return null, length(a[2])?.takeIf { !it.isPercent } ?: return null) else null
  "scale" -> if (a.size in 1..2) {
    val x = scaleNumber(a[0]) ?: return null
    TransformFn.Scale(x, if (a.size == 2) scaleNumber(a[1]) ?: return null else x)
  } else null
  "scalex" -> if (a.size == 1) TransformFn.Scale(scaleNumber(a[0]) ?: return null, 1f) else null
  "scaley" -> if (a.size == 1) TransformFn.Scale(1f, scaleNumber(a[0]) ?: return null) else null
  "scalez" -> if (a.size == 1) TransformFn.Scale(1f, 1f, scaleNumber(a[0]) ?: return null) else null
  "scale3d" -> if (a.size == 3) TransformFn.Scale(scaleNumber(a[0]) ?: return null, scaleNumber(a[1]) ?: return null, scaleNumber(a[2]) ?: return null) else null
  "rotate", "rotatez" -> if (a.size == 1) TransformFn.Rotate(0f, 0f, 1f, angle(a[0]) ?: return null) else null
  "rotatex" -> if (a.size == 1) TransformFn.Rotate(1f, 0f, 0f, angle(a[0]) ?: return null) else null
  "rotatey" -> if (a.size == 1) TransformFn.Rotate(0f, 1f, 0f, angle(a[0]) ?: return null) else null
  "rotate3d" -> if (a.size == 4) TransformFn.Rotate(number(a[0]) ?: return null, number(a[1]) ?: return null, number(a[2]) ?: return null, angle(a[3]) ?: return null) else null
  "skew" -> if (a.size in 1..2) TransformFn.Skew(angle(a[0]) ?: return null, if (a.size == 2) angle(a[1]) ?: return null else 0f) else null
  "skewx" -> if (a.size == 1) TransformFn.Skew(angle(a[0]) ?: return null, 0f) else null
  "skewy" -> if (a.size == 1) TransformFn.Skew(0f, angle(a[0]) ?: return null) else null
  "matrix" -> if (a.size == 6) {
    val n = a.map { number(it) ?: return null }
    TransformFn.Matrix(floatArrayOf(n[0], n[1], 0f, 0f, n[2], n[3], 0f, 0f, 0f, 0f, 1f, 0f, n[4], n[5], 0f, 1f))
  } else null
  "matrix3d" -> if (a.size == 16) TransformFn.Matrix(FloatArray(16) { number(a[it]) ?: return null }) else null
  "perspective" -> if (a.size == 1) TransformFn.Perspective(if (a[0].equals("none", true)) null else length(a[0]) ?: return null) else null
  else -> null
  }
}

/** A 2D affine map in device px: x' = a x + c y + tx, y' = b x + d y + ty. */
internal data class Affine(val a: Float, val b: Float, val c: Float, val d: Float, val tx: Float, val ty: Float) {
  companion object {
    val IDENTITY = Affine(1f, 0f, 0f, 1f, 0f, 0f)
  }
}

/** [left] * [right], both column-major 4x4. */
private fun multiply(left: FloatArray, right: FloatArray): FloatArray {
  val out = FloatArray(16)
  for (col in 0 until 4) for (row in 0 until 4) {
    var s = 0f
    for (k in 0 until 4) s += left[k * 4 + row] * right[col * 4 + k]
    out[col * 4 + row] = s
  }
  return out
}

private fun identity4() = floatArrayOf(1f, 0f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 1f, 0f, 0f, 0f, 0f, 1f)

private fun matrixFor(fn: TransformFn, width: Float, height: Float, ctx: LengthContext): FloatArray {
  val m = identity4()
  when (fn) {
    is TransformFn.Translate -> {
      m[12] = fn.x.toPx(width, ctx)
      m[13] = fn.y.toPx(height, ctx)
      m[14] = fn.z.toPx(0f, ctx)
    }
    is TransformFn.Scale -> {
      m[0] = fn.x; m[5] = fn.y; m[10] = fn.z
    }
    is TransformFn.Rotate -> {
      val len = sqrt(fn.x * fn.x + fn.y * fn.y + fn.z * fn.z)
      if (len == 0f) return m
      val x = fn.x / len
      val y = fn.y / len
      val z = fn.z / len
      val r = Math.toRadians(fn.degrees.toDouble())
      val s = sin(r).toFloat()
      val c = cos(r).toFloat()
      val t = 1f - c
      // CSS Transforms 2, rotate3d(): column-major.
      m[0] = c + x * x * t; m[1] = y * x * t + z * s; m[2] = z * x * t - y * s
      m[4] = x * y * t - z * s; m[5] = c + y * y * t; m[6] = z * y * t + x * s
      m[8] = x * z * t + y * s; m[9] = y * z * t - x * s; m[10] = c + z * z * t
    }
    is TransformFn.Skew -> {
      m[4] = tan(Math.toRadians(fn.xDegrees.toDouble())).toFloat()
      m[1] = tan(Math.toRadians(fn.yDegrees.toDouble())).toFloat()
    }
    // The translation components are CSS px.
    is TransformFn.Matrix -> return fn.m.copyOf().also {
      it[12] *= ctx.scale; it[13] *= ctx.scale; it[14] *= ctx.scale
    }
    is TransformFn.Perspective -> {
      val d = fn.length?.toPx(0f, ctx) ?: return m
      if (d > 0f) m[11] = -1f / d
    }
  }
  return m
}

/**
 * The 4x4 of a transform list over a [width] x [height] box (device px), flattened to how it
 * paints a flat element without a `perspective` on its parent: z drops out (an orthographic
 * projection), and a perspective term only scales the result.
 */
internal fun projectAffine(fns: List<TransformFn>, width: Float, height: Float, ctx: LengthContext): Affine {
  if (fns.isEmpty()) return Affine.IDENTITY
  var m = identity4()
  for (fn in fns) m = multiply(m, matrixFor(fn, width, height, ctx))
  val w = m[15].takeIf { it != 0f } ?: 1f
  return Affine(m[0] / w, m[1] / w, m[4] / w, m[5] / w, m[12] / w, m[13] / w)
}

/**
 * An affine as Android view properties: `translation`, then `rotation` and `scale` about the
 * pivot, with [shear] (x += shear * y, about the pivot) left for the view's own draw.
 */
internal data class ViewTransform(
  val translationX: Float, val translationY: Float, val rotation: Float,
  val scaleX: Float, val scaleY: Float, val shear: Float,
)

/** QR-decompose the linear part: L = R(rotation) * diag(scaleX, scaleY) * [[1, shear], [0, 1]]. */
internal fun decompose(m: Affine): ViewTransform {
  val sx = sqrt(m.a * m.a + m.b * m.b)
  if (sx == 0f) {
    // Degenerate x column: no rotation is recoverable, draw nothing on that axis.
    return ViewTransform(m.tx, m.ty, 0f, 0f, m.d, 0f)
  }
  val rotation = Math.toDegrees(atan2(m.b.toDouble(), m.a.toDouble())).toFloat()
  val upper = (m.a * m.c + m.b * m.d) / sx
  val sy = (m.a * m.d - m.b * m.c) / sx
  return ViewTransform(m.tx, m.ty, rotation, sx, sy, upper / sx)
}
