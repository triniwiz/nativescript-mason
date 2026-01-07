package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.max
import kotlin.math.min

class SaturationValueView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null
) : View(context, attrs) {

  private var bmp: Bitmap? = null
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)

  var hue: Float = 0f
    set(value) {
      field = value
      regenerateBitmap()
      invalidate()
    }

  var sat: Float = 1f
    internal set
  var valueV: Float = 1f
    internal set

  var onSVChanged: ((s: Float, v: Float) -> Unit)? = null

  private var selectorPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeWidth = 2f * resources.displayMetrics.density
    color = Color.BLACK
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    regenerateBitmap()
  }

  private fun regenerateBitmap() {
    val w = width
    val h = height
    if (w <= 0 || h <= 0) return
    val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val hsv = floatArrayOf(hue, 0f, 0f)
    val pixels = IntArray(w * h)
    for (y in 0 until h) {
      val v = 1f - y.toFloat() / (h - 1).coerceAtLeast(1)
      for (x in 0 until w) {
        val s = x.toFloat() / (w - 1).coerceAtLeast(1)
        hsv[1] = s
        hsv[2] = v
        pixels[y * w + x] = Color.HSVToColor(hsv)
      }
    }
    bitmap.setPixels(pixels, 0, w, 0, 0, w, h)
    bmp?.recycle()
    bmp = bitmap
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    bmp?.let { canvas.drawBitmap(it, 0f, 0f, paint) }
    // draw selector
    val x = sat * (width - 1)
    val y = (1f - valueV) * (height - 1)
    canvas.drawCircle(x, y, 6f * resources.displayMetrics.density, selectorPaint)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN, MotionEvent.ACTION_MOVE -> {
        val x = event.x.coerceIn(0f, (width - 1).toFloat())
        val y = event.y.coerceIn(0f, (height - 1).toFloat())
        sat = (x / (width - 1).coerceAtLeast(1))
        valueV = 1f - (y / (height - 1).coerceAtLeast(1))
        onSVChanged?.invoke(sat, valueV)
        invalidate()
        return true
      }
    }
    return super.onTouchEvent(event)
  }

  fun setSV(s: Float, v: Float) {
    sat = s.coerceIn(0f, 1f)
    valueV = v.coerceIn(0f, 1f)
    invalidate()
  }
}
