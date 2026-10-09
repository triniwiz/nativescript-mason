package org.nativescript.mason.masonkit

import android.content.Context
import android.os.Build
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.ViewConfiguration
import org.nativescript.fontmanager.FontFace
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.events.Event

/**
 * A Mason button: a text element that lays out and draws its label like any other Mason text,
 * with the UA button look, pressed/hover/focus states and click dispatch.
 */
class Button @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : TextView(context, attrs, true) {

  internal val fontFace: FontFace
    get() {
      return style.font
    }

  // Track last-known view states to detect transitions independent of
  // the node's pseudo buffer (which may be written from touch handlers).
  private var lastPressed: Boolean = false
  private var lastDisabled: Boolean = false
  private var lastFocus: Boolean = false

  private val pressedStateTouchSlop by lazy(LazyThreadSafetyMode.NONE) {
    ViewConfiguration.get(context).scaledTouchSlop.toFloat()
  }

  private fun isWithinPressedBounds(x: Float, y: Float): Boolean {
    val slop = pressedStateTouchSlop
    return x >= -slop && y >= -slop && x < width + slop && y < height + slop
  }

  init {
    if (!override) setupButton(Mason.shared)
  }

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    setupButton(mason)
  }

  override fun createOwnNode(mason: Mason, isAnonymous: Boolean): Node = mason.createButtonNode(this)

  override val centersVertically: Boolean
    get() = true

  override fun getAccessibilityClassName(): CharSequence {
    return android.widget.Button::class.java.name
  }

  private fun setupButton(mason: Mason) {
    setup(mason)
    val x = 6f
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      defaultFocusHighlightEnabled = false
    }
    isClickable = true
    isFocusable = true
    // Preflight (Tailwind-style) drops the UA border, background, padding and font size.
    val preflight = mason.preflight
    configure { style ->
      style.display = Display.InlineBlock
      style.boxSizing = BoxSizing.BorderBox
      if (!preflight) {
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
      }
      style.textAlign = TextAlign.Center
      style.syncFontMetrics()
    }

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
      style.invalidateBorderRenderer()

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

  override fun onFocusChanged(gainFocus: Boolean, direction: Int, previouslyFocusedRect: android.graphics.Rect?) {
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
    node.setPseudo(PseudoState.FOCUS, gainFocus)
  }
}
