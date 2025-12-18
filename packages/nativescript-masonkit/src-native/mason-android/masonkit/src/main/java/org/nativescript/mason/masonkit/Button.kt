package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.util.TypedValue
import android.view.View
import androidx.core.widget.TextViewCompat
import org.nativescript.mason.masonkit.enums.Display

class Button @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : androidx.appcompat.widget.AppCompatButton(context, attrs), Element, MeasureFunc, TextContainer {


  override val view: View
    get() = this

  override val style: Style
    get() = node.style

  internal val fontFace: FontFace
    get() {
      return style.font
    }

  var includePadding: Boolean
    get() {
      return engine.includePadding
    }
    set(value) {
      engine.includePadding = value
    }

  override lateinit var node: Node
    private set

  override val engine: TextEngine by lazy {
    TextEngine(this)
  }

  var textContent: String
    get() {
      return engine.textContent
    }
    set(value) {
      engine.textContent = value
    }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach { it.shader = null } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
  }

  override fun onDraw(canvas: Canvas) {
    ViewUtils.onDraw(this, canvas, style) {
      super.onDraw(it)
    }
  }

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    setup(mason)
  }

  private fun setup(mason: Mason) {
    TextViewCompat.setAutoSizeTextTypeWithDefaults(this, TextViewCompat.AUTO_SIZE_TEXT_TYPE_NONE)
    node = mason.createTextNode(this, false).apply {
      view = this@Button
    }

    val fontSize = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP,
      Constants.DEFAULT_FONT_SIZE.toFloat(),
      context.resources.displayMetrics
    )

    val x = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP,
      6f,
      context.resources.displayMetrics
    )

    val y = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP,
      1f,
      context.resources.displayMetrics
    )

    setPadding(0, 0, 0, 0)
    configure { style ->
      style.display = Display.InlineBlock

      style.padding = Rect(
        LengthPercentage.Points(y),
        LengthPercentage.Points(x),
        LengthPercentage.Points(y),
        LengthPercentage.Points(x),
      )
      style.border = "1px"
      style.borderRadius = "4px"
      style.syncFontMetrics()
    }

    style.font = FontFace("sans-serif")
    paint.textSize = fontSize

    minWidth = 0
    minHeight = 0
    isAllCaps = false
    background = null
    isClickable = true
    isFocusable = true

    node.style.setStyleChangeListener(this)
  }

  override fun drawableStateChanged() {
    super.drawableStateChanged()

    val pressed = isPressed

    alpha = if (pressed) {
      0.8f
    } else {
      1f
    }

//    style.triggerPress(pressed)
//
//    style.mBackground?.layers?.forEach { it.shader = null }
//    style.mBorderRenderer.invalidate()

    invalidate()
  }


  override fun measure(
    knownDimensions: Size<Float?>,
    availableSpace: Size<Float?>
  ): Size<Float> {
    return engine.measure(paint, knownDimensions, availableSpace)
  }

  override fun onTextStyleChanged(change: Int) {
    engine.onTextStyleChanged(change, paint, resources.displayMetrics)
  }


}
