package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.util.TypedValue
import android.view.View
import androidx.core.widget.TextViewCompat
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.events.Event

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

    val x = 6f

    val y = 1f

    setPadding(0, 0, 0, 0)
    configure { style ->
      style.display = Display.InlineBlock

      style.padding = Rect(
        LengthPercentage.Points(y),
        LengthPercentage.Points(x),
        LengthPercentage.Points(y),
        LengthPercentage.Points(x),
      )
      style.background = "#F0F0F0"
      style.border = "1px solid #767676"
      style.borderRadius = "4px"
      style.textAlign = TextAlign.Center
      style.syncFontMetrics()
    }

    paint.textSize = fontSize

    minWidth = 0
    minHeight = 0
    isAllCaps = false
    background = null
    isClickable = true
    isFocusable = true

    setOnClickListener {
      node.mason.dispatch(
        Event(
          type = "click",
        ).apply {
          target = this@Button
        }
      )
    }

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

    // Write pseudo-state (active/pressed) into the node state buffer (u16 at index)
    try {
      val buf = node.stateValue
      if (buf.capacity() >= NodeStateKeys.NODE_STATE_BUFFER_SIZE) {
        // write native-order short mask (1 = ACTIVE)
        buf.order(java.nio.ByteOrder.nativeOrder())
        buf.putShort(NodeStateKeys.PSEUDO_FLAGS_INDEX, if (pressed) 1.toShort() else 0.toShort())
        // mark node dirty so native side will pick up the change
        NativeHelpers.nativeNodeMarkDirty(node.mason.nativePtr, node.nativePtr)
      }
    } catch (t: Throwable) {
      // ignore if no buffer/native available yet
    }

    // Force background/border rebuild when pressed state changes
    style.mBackground?.layers?.forEach { it.shader = null }
    style.mBorderRenderer.invalidate()

    invalidate()
  }


  override fun measure(
    knownDimensions: Size<Float?>,
    availableSpace: Size<Float?>
  ): Size<Float> {
    return engine.measure(paint, knownDimensions, availableSpace)
  }

  override fun onChange(low: Long, high: Long) {
    engine.onTextStyleChanged(low, high, paint, resources.displayMetrics)
  }


}
