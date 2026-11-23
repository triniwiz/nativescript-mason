package org.nativescript.mason.masonkit

import kotlin.math.atan2
import kotlin.math.sqrt

internal class NativeTransformProgram private constructor(private val handle: Long) {
  val isEmpty = Mason.nativeTransformIsEmpty(handle)

  fun install(style: Style) {
    val node = style.node
    if (node.isPlaceholder) return
    val mason = node.mason
    if (mason.inCompute) mason.deferStyleRecords(style)
    else style.prepareMut()
    Mason.nativeTransformInstall(this, handle, if (mason.inCompute) 0L else mason.nativePtr, node.nativePtr)
  }

  fun affine(width: Float, height: Float, context: LengthContext): Affine {
    val values = Mason.nativeTransformAffine(
      this, handle, width, height, context.scale, context.emBasis, context.rootFontSize,
      context.viewportWidth, context.viewportHeight
    ) ?: return Affine.IDENTITY
    return Affine(values[0], values[1], values[2], values[3], values[4], values[5])
  }

  companion object {
    fun parse(value: String): NativeTransformProgram? {
      val handle = Mason.nativeTransformParse(value)
      if (handle == 0L) return null
      return NativeTransformProgram(handle).also {
        Mason.shared.gc.track(it) { Mason.nativeTransformRelease(handle) }
      }
    }
  }
}

/** A 2D affine map in device px: x' = a x + c y + tx, y' = b x + d y + ty. */
internal data class Affine(val a: Float, val b: Float, val c: Float, val d: Float, val tx: Float, val ty: Float) {
  companion object {
    val IDENTITY = Affine(1f, 0f, 0f, 1f, 0f, 0f)
  }
}

/** An affine as view translation, rotation and scale about the pivot, plus [shear] for the view's own draw. */
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
