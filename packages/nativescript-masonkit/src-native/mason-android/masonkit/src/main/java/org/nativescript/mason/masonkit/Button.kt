package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.os.Build
import android.util.AttributeSet
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import androidx.core.view.ViewCompat
import androidx.core.widget.TextViewCompat
import org.nativescript.fontmanager.FontFace
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.events.Event

class Button @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : androidx.appcompat.widget.AppCompatTextView(context, attrs), Element, MeasureFunc,
  TextContainer {


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

  // Track last-known view states to detect transitions independent of
  // the node's pseudo buffer (which may be written from touch handlers).
  private var lastPressed: Boolean = false
  private var lastDisabled: Boolean = false
  private var lastFocus: Boolean = false

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
    style.mBackground?.layers?.forEach {
      it.shader = null
      it.shaderWidth = -1
      it.shaderHeight = -1
    } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
  }


  private val defaultPaint by lazy {
    Paint().apply {
      color = Color.argb(40, 0, 0, 0) // subtle dark overlay
    }
  }

  private val pressedStateTouchSlop by lazy(LazyThreadSafetyMode.NONE) {
    ViewConfiguration.get(context).scaledTouchSlop.toFloat()
  }

  private fun isWithinPressedBounds(x: Float, y: Float): Boolean {
    val slop = pressedStateTouchSlop
    return x >= -slop && y >= -slop && x < width + slop && y < height + slop
  }

  override fun onDraw(canvas: Canvas) {
    ViewUtils.onDraw(this, canvas, style) {
      super.onDraw(it)
    }

    // Default :active brightness fallback — only when the user hasn't set
    // an explicit :active pseudo buffer (their bg override takes priority).
    /*    if (node.hasPseudo(PseudoState.ACTIVE) &&
          style.resolvedFilterString.isEmpty() &&
          node.getPseudoBuffer(PseudoState.ACTIVE.mask).capacity() == 0
        ) {
          val w = width.toFloat()
          val h = height.toFloat()
          canvas.withSave {
            if (style.mBorderRenderer.hasRadii()) {
              clipPath(style.mBorderRenderer.getOuterClipPath(w, h))
            }
              drawRect(0f, 0f, w, h, defaultPaint)
          }
        }*/
  }

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    setup(mason)
  }

  override fun getAccessibilityClassName(): CharSequence {
    return android.widget.Button::class.java.name
  }

  private fun setup(mason: Mason) {
    TextViewCompat.setAutoSizeTextTypeWithDefaults(this, TextViewCompat.AUTO_SIZE_TEXT_TYPE_NONE)
    node = mason.createButtonNode(this).apply {
      view = this@Button
    }

    val fontSize = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP,
      Constants.DEFAULT_FONT_SIZE.toFloat(),
      context.resources.displayMetrics
    )

    val x = 6f

    setPadding(0, 0, 0, 0)

    paint.textSize = fontSize
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      defaultFocusHighlightEnabled = false
    }
    minWidth = 0
    minHeight = 0
    isAllCaps = false
    setBackgroundColor(Color.TRANSPARENT)
    stateListAnimator = null
    elevation = 0f
    isClickable = true
    isFocusable = true
    outlineProvider = null
    setBackgroundResource(0)
    ViewCompat.setBackgroundTintList(view, null)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      foreground = null
    }
    configure { style ->
      // Mason button defaults stay close to UA expectations, but use a lighter
      // 1px border so the native appearance does not feel overly heavy.
      style.display = Display.InlineBlock
      style.boxSizing = BoxSizing.BorderBox
      style.padding = Rect(
        LengthPercentage.Points(1f),
        LengthPercentage.Points(x),
        LengthPercentage.Points(1f),
        LengthPercentage.Points(x),
      )
      style.fontSize = Constants.DEFAULT_FONT_SIZE
      style.background = "#F0F0F0"
      style.border = "1 solid #767676"
      style.borderRadius = "4"
      style.textAlign = TextAlign.Center
      style.syncFontMetrics()
    }

    // AppCompatTextView's own draw pass ignores `paint.color`/layout alignment
    // (it rebuilds its Layout from getGravity()/mCurTextColor), so unlike P's
    // TextView (which draws its own StaticLayout from the live paint every
    // frame) Button needs its CSS-resolved color/alignment explicitly synced.
    setTextColor(style.resolvedColor)
    gravity = resolveGravity(style.resolvedTextAlign)

    node.hasNativeClickDispatch = true

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
    // Detect view-state transitions using last-known values so we reliably
    // trigger a rebuild even when the node's pseudo buffer was updated
    // earlier (e.g., from touch handlers).
    var pseudoChanged = false
    var textAffectingPseudoChanged = false
    val key = StateKeys.ALL_TEXT
    val hadPseudoTextBefore = node.hasPseudoSetFor(key)
    var changedTextKeys = StateKeys.NONE

    val wantActive = isPressed
    if (wantActive != lastPressed) {
      lastPressed = wantActive
      val activeTextKeys = node.getPseudoSetFlags(PseudoState.ACTIVE.mask) and key
      if (activeTextKeys != StateKeys.NONE) {
        textAffectingPseudoChanged = true
        changedTextKeys = changedTextKeys or activeTextKeys
      }
      node.setPseudo(PseudoState.ACTIVE, wantActive, true)
      pseudoChanged = true
    }

    val wantDisabled = !isEnabled
    if (wantDisabled != lastDisabled) {
      lastDisabled = wantDisabled
      val disabledTextKeys = node.getPseudoSetFlags(PseudoState.DISABLED.mask) and key
      if (disabledTextKeys != StateKeys.NONE) {
        textAffectingPseudoChanged = true
        changedTextKeys = changedTextKeys or disabledTextKeys
      }
      node.setPseudo(PseudoState.DISABLED, wantDisabled, true)
      pseudoChanged = true
    }

    val wantFocus = isFocused
    if (wantFocus != lastFocus) {
      lastFocus = wantFocus
      val focusTextKeys = node.getPseudoSetFlags(PseudoState.FOCUS.mask) and key
      if (focusTextKeys != StateKeys.NONE) {
        textAffectingPseudoChanged = true
        changedTextKeys = changedTextKeys or focusTextKeys
      }
      node.setPseudo(PseudoState.FOCUS, wantFocus, true)
      pseudoChanged = true
    }

    if (pseudoChanged) {
      // Re-resolve text paint properties only when one of the toggled pseudo
      // buffers can affect text. This still restores base text on the way back
      // to normal, but avoids unnecessary layout work for visual-only pseudos.
      if (textAffectingPseudoChanged) {
        val nowHasPseudoText = node.hasPseudoSetFor(key)
        if (hadPseudoTextBefore || nowHasPseudoText) {
          onChange(changedTextKeys.low, changedTextKeys.high)
        }
      }

      // Force background/border rebuild when pressed state changes
      style.mBackground?.layers?.forEach {
        it.shader = null
        it.shaderWidth = -1
        it.shaderHeight = -1
      }
      style.mBorderRenderer.invalidate()

      invalidate()
    }
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    if (!isEnabled) return super.onHoverEvent(event)
    when (event.actionMasked) {
      MotionEvent.ACTION_HOVER_ENTER -> node.setPseudo(PseudoState.HOVER, true)
      MotionEvent.ACTION_HOVER_EXIT -> node.setPseudo(PseudoState.HOVER, false)
    }
    return super.onHoverEvent(event)
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    if (!isEnabled) return super.onTouchEvent(ev)
    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        isPressed = true
        return true
      }

      MotionEvent.ACTION_MOVE -> {
        isPressed = isWithinPressedBounds(ev.x, ev.y)
        return true
      }

      MotionEvent.ACTION_UP -> {
        val shouldClick = isWithinPressedBounds(ev.x, ev.y)
        isPressed = false
        if (shouldClick) {
          performClick()
        }
        return true
      }

      MotionEvent.ACTION_CANCEL -> {
        isPressed = false
        return true
      }
    }
    return super.onTouchEvent(ev)
  }

  override fun onFocusChanged(gainFocus: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
    node.setPseudo(PseudoState.FOCUS, gainFocus)
  }


  override fun measure(
    knownWidth: Float, knownHeight: Float,
    availableWidth: Float, availableHeight: Float
  ): Long {
    return engine.measure(paint, knownWidth, knownHeight, availableWidth, availableHeight)
  }

  override fun onChange(low: Long, high: Long) {
    engine.onTextStyleChanged(low, high, paint, resources.displayMetrics)

    // super.onDraw() (AppCompatTextView) reads its own mCurTextColor/gravity,
    // not `paint` - keep both synced whenever the CSS-resolved values change.
    if (StateKeys.hasFlag(low, high, StateKeys.FONT_COLOR)) {
      setTextColor(style.resolvedColor)
    }
    if (StateKeys.hasFlag(low, high, StateKeys.TEXT_ALIGN)) {
      gravity = resolveGravity(style.resolvedTextAlign)
    }
  }

  private fun resolveGravity(value: TextAlign): Int {
    val horizontal = when (value) {
      TextAlign.Right, TextAlign.End -> Gravity.END
      TextAlign.Left, TextAlign.Start -> Gravity.START
      else -> Gravity.CENTER_HORIZONTAL
    }
    return Gravity.CENTER_VERTICAL or horizontal
  }

  fun addView(view: Element) {
    node.addChildAt(view.node, -1)
  }

  fun addView(view: Element, index: Int) {
    node.addChildAt(view.node, index)
  }

  fun removeView(view: Element) {
    node.removeChild(view.node)
    engine.invalidateInlineSegments()
  }

  fun removeView(index: Int) {
    node.removeChildAt(index)
    engine.invalidateInlineSegments()
  }

  fun removeAllViews() {
    node.removeChildren()
    engine.invalidateInlineSegments()
  }
}
