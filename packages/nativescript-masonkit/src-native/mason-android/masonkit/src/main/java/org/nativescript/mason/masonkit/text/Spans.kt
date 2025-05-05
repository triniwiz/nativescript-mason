package org.nativescript.mason.masonkit.text

import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.text.TextPaint
import android.text.style.DynamicDrawableSpan
import android.util.Log
import android.view.View
import android.view.ViewGroup
import org.nativescript.mason.masonkit.FontFace
import org.nativescript.mason.masonkit.Node

class Spans {
  enum class Type {
    View,
    BackgroundColor,
    ForegroundColor,
    DecorationLine,
    Justify,
    Tracking,
    Size,
    Typeface
  }

  interface NSCSpan {
    val type: Type
  }

  class TypefaceSpan(private val typeface: Typeface, private val isBold: Boolean = false) :
    android.text.style.MetricAffectingSpan(),
    NSCSpan {
    override val type: Type
      get() = Type.Typeface

    override fun updateDrawState(tp: TextPaint?) {
      if (isBold && !typeface.isBold) {
        tp?.isFakeBoldText = true
      }
      tp?.typeface = typeface
    }

    override fun updateMeasureState(textPaint: TextPaint) {
      if (isBold && !typeface.isBold) {
        textPaint.isFakeBoldText = true
      }

      textPaint.typeface = typeface
    }
  }

  class TypefaceSpan2(family: String) : android.text.style.TypefaceSpan(family), NSCSpan {
    override val type: Type
      get() = Type.Typeface
  }

  class SizeSpan(size: Int, scale: Boolean = false) :
    android.text.style.AbsoluteSizeSpan(size, scale), NSCSpan {
    override val type: Type
      get() = Type.Size
  }

  class ScaleXSpan(scale: Float) : android.text.style.ScaleXSpan(scale), NSCSpan {
    override val type: Type
      get() = Type.Justify
  }

  // used to track empty children
  class TrackingSpan : android.text.style.ReplacementSpan(), NSCSpan {
    override fun getSize(
      paint: Paint,
      text: CharSequence?,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
    ): Int {
      return 0
    }

    override fun draw(
      canvas: Canvas,
      text: CharSequence?,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint
    ) {
      // noop
    }

    override val type: Type
      get() = Type.Tracking

  }

  class StrikethroughSpan : android.text.style.StrikethroughSpan(), NSCSpan {
    override val type: Type
      get() = Type.DecorationLine
  }

  class UnderlineSpan : android.text.style.UnderlineSpan(), NSCSpan {
    override val type: Type
      get() = Type.DecorationLine
  }

  class BackgroundColorSpan(val color: Int) : android.text.style.BackgroundColorSpan(color),
    NSCSpan {
    override val type: Type
      get() = Type.BackgroundColor
  }

  class ForegroundColorSpan(val color: Int) : android.text.style.ForegroundColorSpan(color),
    NSCSpan {

    override val type: Type
      get() = Type.ForegroundColor
  }

  class ViewSpannable(val view: View, val node: Node) : DynamicDrawableSpan(), NSCSpan {
    override val type: Type
      get() = Type.View
    private val drawableCache = ViewDrawable(view)

    init {
      if (view.parent is ViewGroup) {
        (view.parent as ViewGroup).removeView(view)
      }
    }

    private inner class ViewDrawable(val view: View) : Drawable() {

      override fun draw(canvas: Canvas) {
        view.draw(canvas)
      }

      override fun setAlpha(alpha: Int) {
        view.alpha = alpha.toFloat() / 255f
      }

      override fun setColorFilter(colorFilter: ColorFilter?) {}

      @Deprecated(
        "", ReplaceWith(
          "if (view.alpha < 1f) PixelFormat.TRANSLUCENT else PixelFormat.OPAQUE",
          "android.graphics.PixelFormat",
          "android.graphics.PixelFormat"
        )
      )
      override fun getOpacity(): Int {
        return if (view.alpha < 1f) PixelFormat.TRANSLUCENT else PixelFormat.OPAQUE
      }
    }

    override fun getSize(
      paint: Paint,
      text: CharSequence?,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
    ): Int {
      if (fm != null) {
        val textHeight = fm.descent - fm.ascent
        val viewHeight = view.measuredHeight

        if (viewHeight > textHeight) {
          val extraHeight = (viewHeight - textHeight) / 2
          fm.ascent -= extraHeight
          fm.descent += extraHeight
        }
      }
      return view.measuredWidth
    }

    override fun draw(
      canvas: Canvas,
      text: CharSequence?,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint
    ) {
      canvas.save()
      val width = view.measuredWidth
      val height = view.measuredHeight

      val fontMetrics = paint.fontMetricsInt
      val baselineOffset = y + fontMetrics.descent - height


      canvas.translate(x, baselineOffset.toFloat())
      view.layout(0, 0, width, height)
      view.draw(canvas)
      canvas.restore()
    }

    override fun getDrawable(): Drawable {
      return drawableCache
    }
  }
}
