package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Build
import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.ForegroundColorSpan
import android.text.style.ReplacementSpan
import android.text.style.StrikethroughSpan
import android.text.style.StyleSpan
import android.text.style.UnderlineSpan
import android.text.style.UpdateAppearance
import android.util.AttributeSet
import android.util.Log
import androidx.annotation.ColorInt
import androidx.core.text.getSpans
import org.nativescript.mason.masonkit.Direction.Inherit
import org.nativescript.mason.masonkit.Direction.LTR
import org.nativescript.mason.masonkit.Direction.RTL
import java.nio.ByteBuffer
import java.util.Objects

object TextStyleKeys {
  const val COLOR = 0
  const val DECORATION_LINE = 4
  const val DECORATION_COLOR = 8
}

class TextView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null
) : androidx.appcompat.widget.AppCompatTextView(context, attrs) {
  private val textPaint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
  private var owner: TextView? = null
  private val children: MutableList<TextView> = mutableListOf()
  private val spans: MutableList<Spannable> = mutableListOf()
  lateinit var node: Node
    private set


  fun configure(block: (Node) -> Unit) {
    node.configure(block)
  }

  private lateinit var textLayout: StaticLayout
  private val values = ByteBuffer.allocateDirect(12)

  init {
    values.putInt(TextStyleKeys.COLOR, Color.BLACK)
    values.putInt(TextStyleKeys.DECORATION_COLOR, Color.BLACK)
  }


  var color: Int
    get() {
      return values.getInt(TextStyleKeys.COLOR)
    }
    set(value) {
      values.putInt(TextStyleKeys.COLOR, value)
    }


  var decorationColor: Int
    get() {
      return values.getInt(TextStyleKeys.DECORATION_COLOR)
    }
    set(value) {
      values.putInt(TextStyleKeys.DECORATION_COLOR, value)
    }


  enum class DecorationLine(val value: Int) {
    None(0),
    Underline(1),
    Overline(2),
    LineThrough(3);

    companion object {
      fun fromInt(value: Int): DecorationLine {
        return when (value) {
          0 -> None
          1 -> Underline
          2 -> Overline
          3 -> LineThrough
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  var decorationLine: DecorationLine
    set(value) {
      values.putInt(TextStyleKeys.DECORATION_LINE, value.value)
    }
    get() {
      return DecorationLine.fromInt(values.getInt(TextStyleKeys.DECORATION_LINE))
    }

  private val measureFunc: MeasureFunc = object : MeasureFunc {
    override fun measure(
      knownDimensions: Size<Float?>,
      availableSpace: Size<Float?>
    ): Size<Float> {

      val spannable = SpannableStringBuilder(text)

      spannable.setSpan(
        ForegroundColorSpan(color),
        0,
        spannable.length,
        Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
      )


      when (decorationLine) {
        DecorationLine.None -> {}
        DecorationLine.Underline -> {
          val line = UnderlineSpan()
          spannable.setSpan(
            line, 0, spannable.length,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
          )

        }

        DecorationLine.Overline -> {
          // todo
        }

        DecorationLine.LineThrough -> {
          val lt = StrikethroughSpan()
          textPaint.color = decorationColor
          lt.updateDrawState(textPaint)
          spannable.setSpan(
            lt, 0, spannable.length,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
          )
        }
      }


      for (child in children) {
        child.measureFunc.measure(knownDimensions, availableSpace)
        for (span in child.spans) {
          spannable.append(span)
        }
      }

      if (owner != null) {
        spans.add(spannable)
        return Size(0f, 0f)
      }

      val maxWidth = availableSpace.width ?: Float.MAX_VALUE
      val measuredWidth = maxOf(maxWidth, paint.measureText(text.toString())).toInt()


      textLayout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        StaticLayout.Builder.obtain(
          spannable, 0, spannable.length, paint, measuredWidth
        ).setLineSpacing(0F, 1F)
          .build()
      } else {
        StaticLayout(spannable, paint, measuredWidth, Layout.Alignment.ALIGN_NORMAL, 1F, 0f, false)
      }

      return Size(textLayout.width.toFloat(), textLayout.height.toFloat())
    }
  }

  constructor(context: Context, mason: Mason) : this(context) {
    node = mason.createTextNode(measureFunc)
    node.data = this
  }


  override fun onDraw(canvas: Canvas) {
    // super.onDraw(canvas)
    if (::textLayout.isInitialized) {
      canvas.save()
      val layout = node.layout()
      textLayout.draw(canvas)
      canvas.restore()
    }
//    if (::textLayout.isInitialized) {
//      canvas.save()
//      var currentX = 0
//      var currentY = 0
//      // canvas.translate(getPaddingLeft(), getPaddingTop()); // Offset for padding
//      textLayout.draw(canvas)
//      currentX = textLayout.width
//      currentY = textLayout.height
//      canvas.restore()
//      for (view in children) {
//        if (view::textLayout.isInitialized) {
//          canvas.save()
//          canvas.translate(currentX.toFloat(), 0F)
//          view.textLayout.draw(canvas)
//          canvas.restore()
//          currentX = view.textLayout.width
//          currentY = view.textLayout.height
//        }
//      }
//    }
  }

//  fun setText(text: String){
//    if (!Objects.equals(this.text.toString(), text)) {
//      this.text = text // Use TextView's built-in setText
//    //  requestLayout()  // Ensures Taffy re-measures if necessary
//     // invalidate()
//    }
//  }


  @JvmOverloads
  fun addView(view: TextView, index: Int = -1) {
    if (view.node.owner != null) {
    }
    if (index == -1) {
      children.add(view)
      view.owner = this
    }
  }
}
