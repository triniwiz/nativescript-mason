package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.max
import kotlin.math.min

class SaturationValueView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null
) : View(context, attrs) {

  private val saturationPaint = Paint()
  private val valuePaint = Paint()

  var hue: Float = 0f
    set(value) {
      field = value
      updateSaturationGradient()
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
    updateSaturationGradient()
    valuePaint.shader =
      LinearGradient(0f, 0.5f, 0f, h - 0.5f, Color.TRANSPARENT, Color.BLACK, Shader.TileMode.CLAMP)
  }

  private fun updateSaturationGradient() {
    val pureHue = Color.HSVToColor(floatArrayOf(hue, 1f, 1f))
    saturationPaint.shader =
      LinearGradient(0.5f, 0f, width - 0.5f, 0f, Color.WHITE, pureHue, Shader.TileMode.CLAMP)
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), saturationPaint)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), valuePaint)
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
