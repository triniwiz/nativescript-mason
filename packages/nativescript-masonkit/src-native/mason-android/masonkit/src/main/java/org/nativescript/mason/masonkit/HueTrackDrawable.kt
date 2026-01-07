package org.nativescript.mason.masonkit

import android.graphics.*
import android.graphics.drawable.Drawable

/**
 * Drawable that paints a horizontal hue gradient track and a circular "gap" filled
 * with the sampled hue color. Designed to be reusable and avoid bitmap churn.
 */
class HueTrackDrawable(private val trackHeightPx: Int, private val density: Float) : Drawable() {
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var gradient: LinearGradient? = null
  private var gapCenterX: Int = -1
  private var gapRadius: Float = 0f
  private var pressed: Boolean = false

  init {
    paint.style = Paint.Style.FILL
    fillPaint.style = Paint.Style.FILL
  }

  override fun draw(canvas: Canvas) {
    val b = bounds
    if (b.width() <= 0 || b.height() <= 0) return

    // ensure gradient exists and covers current width
    if (gradient == null) createGradient(b.width())
    paint.shader = gradient

    // center the track vertically inside the bounds
    val top = b.centerY() - trackHeightPx / 2f
    val rect = RectF(b.left.toFloat(), top, b.right.toFloat(), top + trackHeightPx)
    canvas.drawRect(rect, paint)
  }

  private fun createGradient(width: Int) {
    // quick hue stops from 0..360
    val colors = intArrayOf(
      Color.HSVToColor(floatArrayOf(0f, 1f, 1f)),
      Color.HSVToColor(floatArrayOf(60f, 1f, 1f)),
      Color.HSVToColor(floatArrayOf(120f, 1f, 1f)),
      Color.HSVToColor(floatArrayOf(180f, 1f, 1f)),
      Color.HSVToColor(floatArrayOf(240f, 1f, 1f)),
      Color.HSVToColor(floatArrayOf(300f, 1f, 1f)),
      Color.HSVToColor(floatArrayOf(360f, 1f, 1f))
    )
    gradient = LinearGradient(0f, 0f, width.toFloat(), 0f, colors, null, Shader.TileMode.CLAMP)
  }

  /**
   * Update gap center and pressed state. `centerX` is in drawable coordinates.
   */
  fun setGap(centerX: Int, pressedState: Boolean) {
    // Lightweight: preserve state but avoid allocations and invalidation.
    val w = bounds.width().coerceAtLeast(1)
    this.gapCenterX = centerX.coerceIn(0, w - 1)
    this.pressed = pressedState
  }

  override fun setAlpha(alpha: Int) {
    paint.alpha = alpha
    fillPaint.alpha = alpha
    invalidateSelf()
  }

  override fun getOpacity(): Int = PixelFormat.OPAQUE

  override fun setColorFilter(colorFilter: ColorFilter?) {
    paint.colorFilter = colorFilter
    invalidateSelf()
  }

  override fun getIntrinsicHeight(): Int = trackHeightPx
}
