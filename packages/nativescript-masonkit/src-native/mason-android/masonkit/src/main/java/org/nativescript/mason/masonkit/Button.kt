package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.util.AttributeSet
import android.util.Log
import android.util.TypedValue
import android.view.MotionEvent
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

    // Default :active brightness fallback — only when the user hasn't set
    // an explicit :active pseudo buffer (their bg override takes priority).
    if (node.hasPseudo(PseudoState.ACTIVE) &&
      style.resolvedFilterString.isEmpty() &&
      node.getPseudoBuffer(PseudoState.ACTIVE.mask).capacity() == 0
    ) {
      val w = width.toFloat()
      val h = height.toFloat()
      canvas.save()
      if (style.mBorderRenderer.hasRadii()) {
        canvas.clipPath(style.mBorderRenderer.getOuterClipPath(w, h))
      }
      val gray = (0.85f * 255).toInt()
      val paint = Paint().apply {
        color = Color.rgb(gray, gray, gray)
        xfermode = PorterDuffXfermode(PorterDuff.Mode.MULTIPLY)
      }
      canvas.drawRect(0f, 0f, w, h, paint)
      canvas.restore()
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
      style.border = "1 solid #767676"
      style.borderRadius = "4"
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

    // Default :active brightness is applied in ViewUtils.render as a fallback
    // only when no explicit :active pseudo buffer has been set by the user.
  }

  override fun drawableStateChanged() {
    super.drawableStateChanged()

    // Sync pseudo-states via Node API

    // Ensure engine recomputes when active (pressed) state changes so pseudo
    // style merges are applied. Previously used `false` which skipped marking
    // the engine dirty and prevented pseudo updates from taking effect.
    node.setPseudo(PseudoState.ACTIVE, isPressed, true)
    node.setPseudo(PseudoState.DISABLED, !isEnabled, false)
    node.setPseudo(PseudoState.FOCUS, isFocused, true)
    // Re-resolve text paint properties for pseudo-aware values
    onChange(
      StateKeys.FONT_COLOR.low or StateKeys.FONT_SIZE.low or StateKeys.TEXT_ALIGN.low,
      StateKeys.FONT_COLOR.high or StateKeys.FONT_SIZE.high or StateKeys.TEXT_ALIGN.high or StateKeys.FONT_WEIGHT.high
    )

    // Force background/border rebuild when pressed state changes
    style.mBackground?.layers?.forEach { it.shader = null }
    style.mBorderRenderer.invalidate()

    invalidate()
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_HOVER_ENTER -> node.setPseudo(PseudoState.HOVER, true)
      MotionEvent.ACTION_HOVER_EXIT -> node.setPseudo(PseudoState.HOVER, false)
    }
    return super.onHoverEvent(event)
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN -> node.setPseudo(PseudoState.ACTIVE, true)
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> node.setPseudo(PseudoState.ACTIVE, false)
    }
    return super.onTouchEvent(ev)
  }

  override fun onFocusChanged(gainFocus: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
    node.setPseudo(PseudoState.FOCUS, gainFocus)
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
