package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.text.TextPaint
import android.text.style.ReplacementSpan
import android.view.View
import android.view.ViewGroup
import androidx.core.graphics.withSave

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

  class UnderlineSpan(val color: Int) : android.text.style.CharacterStyle(), NSCSpan {
    override val type: Type
      get() = Type.DecorationLine

    override fun updateDrawState(tp: TextPaint?) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        tp?.underlineColor = color
        tp?.isUnderlineText = true
      }
    }
  }

  class UnderlineLineThrough(val color: Int) : android.text.style.CharacterStyle(), NSCSpan {
    override val type: Type
      get() = Type.DecorationLine

    override fun updateDrawState(tp: TextPaint?) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      //  tp?.underlineColor = color
        tp?.isUnderlineText = true
        tp?.isStrikeThruText = true
      }
    }
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

  class ViewSpannable(val view: View, val node: Node) : ReplacementSpan(), NSCSpan {

    override val type: Type
      get() = Type.View

    init {
      if (view.parent is ViewGroup) {
        (view.parent as ViewGroup).removeView(view)
      }
    }

    override fun getSize(
      paint: Paint,
      text: CharSequence,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
    ): Int {
      val layout = node.computedLayout
      val width = layout.width.toInt()
      val height = layout.height.toInt()

      fm?.let {
        val fontHeight = paint.fontMetricsInt.descent - paint.fontMetricsInt.ascent
        val centerY = paint.fontMetricsInt.ascent + fontHeight / 2

        val halfViewHeight = height / 2
        it.ascent = centerY - halfViewHeight
        it.descent = centerY + halfViewHeight
        it.top = it.ascent
        it.bottom = it.descent
      }
      return width
    }

    override fun draw(
      canvas: Canvas,
      text: CharSequence,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint
    ) {
      val layout = node.computedLayout
      val width = layout.width.toInt()
      val height = layout.height.toInt()

      val fontMetrics = paint.fontMetricsInt
      val fontHeight = fontMetrics.descent - fontMetrics.ascent
      val centerLine = y + fontMetrics.ascent + fontHeight / 2
      val drawTop = centerLine - height / 2

      canvas.withSave {
        translate(x, drawTop.toFloat())
        view.draw(this)
      }
    }
  }
}
