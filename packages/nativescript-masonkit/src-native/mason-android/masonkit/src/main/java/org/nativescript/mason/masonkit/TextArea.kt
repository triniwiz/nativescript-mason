package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Rect
import android.text.Editable
import android.text.InputFilter
import android.text.InputType
import android.text.TextWatcher
import android.util.AttributeSet
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.events.EventOptions
import org.nativescript.mason.masonkit.input.TextInput
import org.nativescript.mason.masonkit.input.TextInputOwner
import kotlin.math.max

@SuppressLint("AppCompatCustomView")
class TextArea @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : TextInput(context, attrs), Element, MeasureFunc, StyleChangeListener, TextInputOwner {

  override val view: View
    get() = this

  override val style: Style
    get() = node.style

  override lateinit var node: Node
    private set

  /**
   * Guards requestLayout() propagation: EditText calls it internally for cursor
   * moves, IME events, and text reflow, none of which change our fixed
   * (rows × lineHeight) intrinsic size. When false, those calls are dropped so a
   * full Mason re-layout isn't triggered on every keystroke.
   */
  private var mAllowRequestLayout = true  // true during init so setup() passes through

  override fun requestLayout() {
    if (mAllowRequestLayout) {
      super.requestLayout()
    }
    // Always redraw (cursor blink, selection handles, etc.) even when suppressed.
    // invalidate() is a no-op if already dirty, so this is cheap.
  }

  /**
   * Call when the textarea's intrinsic size has actually changed (rows, cols,
   * or font metrics). Marks the Rust node dirty, permits one requestLayout()
   * propagation, then re-locks suppression.
   */
  private fun layoutIfSizeChanged() {
    node.dirty()
    mAllowRequestLayout = true
    requestLayout()
    mAllowRequestLayout = false
  }

  var rows: Int = 2
    set(value) {
      field = max(1, value)
      // Do NOT set minLines/maxLines: Mason controls the frame size via measure().
      // maxLines also truncates DynamicLayout's line-coordinate table, breaking
      // bringPointIntoView() for content past that line count.
      layoutIfSizeChanged()
    }

  var cols: Int = 20
    set(value) {
      field = max(1, value)
      layoutIfSizeChanged()
    }

  var placeholder: String = ""
    set(value) {
      field = value
      hint = value
    }

  var name: String = ""

  var maxLength: Int = -1
    set(value) {
      field = value
      filters = if (value > -1) {
        arrayOf(InputFilter.LengthFilter(value), beforeFilter)
      } else {
        arrayOf(beforeFilter)
      }
    }

  var value: String
    get() = text?.toString().orEmpty()
    set(value) {
      if (text?.toString() == value) {
        return
      }
      setText(value, BufferType.EDITABLE)
      setSelection(text?.length ?: 0)
      // The TextWatcher.afterTextChanged will handle node.dirty() + requestLayout()
    }

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    setup(mason)
  }

  init {
    if (!::node.isInitialized && !override) {
      setup(Mason.shared)
    }
  }

  override fun isOpaque(): Boolean {
    return false
  }

  /**
   * Report the entire view bounds as the "focused rect" so the IME doesn't pan
   * the window when the cursor is below the visible area — ViewRootImpl's
   * scrollToRectOrFocus() sees the whole textarea box already on-screen and
   * leaves the window scroll alone.
   */
  override fun getFocusedRect(r: Rect) {
    r.set(0, 0, width, height)
  }

  /**
   * Report the entire view bounds as the "drawing rect" so parent scroll
   * containers (e.g. Scroll) don't try to bring the textarea into view based
   * on its internal content scroll offset, which is self-contained and should
   * not affect any ancestor's scroll position.
   */
  override fun getDrawingRect(outRect: Rect) {
    outRect.set(0, 0, width, height)
  }

  /**
   * Block ancestors from also scrolling/panning when bringPointIntoView()
   * scrolls our own content into view — the textarea box itself stays fixed.
   */
  override fun requestRectangleOnScreen(rectangle: Rect?, immediate: Boolean): Boolean {
    return false
  }

  /**
   * Returns the number of visual content lines (based on newline characters).
   * Always at least 1.
   */
  private val contentLineCount: Int
    get() {
      val current = text?.toString().orEmpty()
      if (current.isEmpty()) return 1
      return max(1, current.count { it == '\n' } + 1)
    }

  private fun setup(mason: Mason) {
    node = mason.createNode(this).apply {
      view = this@TextArea
    }
    node.style.values.put(StyleKeys.ITEM_IS_REPLACED, 1.toByte())
    owner = this
    background = null
    isSingleLine = false
    // Do NOT set minLines/maxLines — see rows setter comment above.
    // Mason's measure() already returns rows×lineHeight as the intrinsic
    // height, so the frame is fixed to the correct size externally.
    // Leaving the EditText's own layout unconstrained lets DynamicLayout
    // track all line coordinates so internal scroll always stays correct.
    inputType =
      InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE or
        InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
    setHorizontallyScrolling(false)
    // Text scrolls vertically inside the fixed-height box when content overflows
    // (web <textarea> behaviour). isScrollContainer=false keeps the Window system
    // from treating this view as a scrollable region regardless of windowSoftInputMode.
    isScrollContainer = false
    setVerticalScrollBarEnabled(true)
    gravity = Gravity.TOP or Gravity.START
    // Do NOT call setTextIsSelectable(true) — on EditText it can silently reset
    // the InputType and focusability set above, breaking keyboard input.

    val density = resources.displayMetrics.density
    val pad = max(1, (2f * density).toInt())
    setPadding(pad, pad, pad, pad)

    configure { style ->
      style.display = Display.InlineBlock
      style.boxSizing = BoxSizing.BorderBox
      style.padding = Rect(
        LengthPercentage.Points(pad.toFloat()),
        LengthPercentage.Points(pad.toFloat()),
        LengthPercentage.Points(pad.toFloat()),
        LengthPercentage.Points(pad.toFloat())
      )
      style.fontSize = Constants.DEFAULT_FONT_SIZE
      style.background = "#FFFFFF"
      style.border = "1 solid #767676"
      style.borderRadius = "4"
      style.textAlign = TextAlign.Left
      style.syncFontMetrics()
    }

    cursorPaint.color = style.resolvedColor
    setTextColor(style.resolvedColor)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, style.resolvedFontSize.toFloat())
    style.resolvedFontFace.resolvedTypeface?.let {
      typeface = it
    }
    style.setStyleChangeListener(this)

    // All init-time requestLayout() calls have passed. Lock suppression so that
    // EditText's internal calls (cursor, IME, selection, text reflow) no longer
    // propagate to Mason's root and trigger full-tree re-layout.
    mAllowRequestLayout = false

    // Invalidate and, for CSS height:auto support, mark the node dirty
    // so the Rust engine can re-invoke measure() if needed.
    addTextChangedListener(object : TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
      override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
      override fun afterTextChanged(s: Editable?) {
        // Height is fixed by `rows` — no need to call requestLayout() on every
        // keystroke. The EditText scrolls the new content internally.
        // dirty() lets the Rust engine know intrinsic size may change if the
        // style height is ever set to Auto.
        node.dirty()
        invalidate()
      }
    })
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach {
      it.shader = null
      it.shaderWidth = -1
      it.shaderHeight = -1
    }
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
  }

  override fun onDraw(canvas: Canvas) {
    // View.draw() pre-translates the canvas by (-scrollX, -scrollY) for internal
    // scroll, but ViewUtils.onDraw paints background/border at (0,0,w,h) in that
    // same translated space, leaving the box off-screen while text still draws
    // correctly. Counter-translate by (+scrollX, +scrollY) for background/border,
    // then restore the scroll offset for the text-content super.onDraw call.
    val sx = scrollX.toFloat()
    val sy = scrollY.toFloat()
    canvas.save()
    canvas.translate(sx, sy)
    ViewUtils.onDraw(this, canvas, style) { c ->
      c.save()
      c.translate(-sx, -sy)
      super.onDraw(c)
      c.restore()
    }
    canvas.restore()
  }

  override fun measure(
    knownWidth: Float,
    knownHeight: Float,
    availableWidth: Float,
    availableHeight: Float
  ): Long {
    // Values are in physical pixels. Returns CONTENT size only (excludes
    // totalPadding*) since Mason applies CSS padding externally in the box
    // model — including it here would double-count it. lineHeight includes
    // fontMetrics.leading to match Android's own StaticLayout line height.
    val charWidth = max(paint.measureText("0"), paint.measureText("W"))
    val fm = paint.fontMetricsInt
    val lineHeight = (-fm.ascent + fm.descent + fm.leading).toFloat()

    // CONTENT size: fixed cols × rows matching web <textarea> default.
    // The view scrolls internally when text overflows (isScrollEnabled-aware).
    var width = charWidth * cols
    var height = lineHeight * rows

    // Definite constraints from the Rust layout engine.
    // Sentinel -3f means "unconstrained" (auto). Guard against non-positive
    // finites and the -1/-2 available-space sentinels which must never appear
    // as known dimensions but would otherwise corrupt the computed size.
    if (knownWidth != -3f && knownWidth.isFinite() && knownWidth >= 0f) {
      width = knownWidth
    }
    if (knownHeight != -3f && knownHeight.isFinite() && knownHeight >= 0f) {
      height = knownHeight
    }

    return MeasureOutput.make(width, height)
  }

  override fun onChange(low: Long, high: Long) {
    val fontColor = StateKeys.hasFlag(low, high, StateKeys.FONT_COLOR)
    val fontSize = StateKeys.hasFlag(low, high, StateKeys.FONT_SIZE)
    val font =
      StateKeys.hasFlag(low, high, StateKeys.FONT_WEIGHT) ||
        StateKeys.hasFlag(low, high, StateKeys.FONT_STYLE) ||
        StateKeys.hasFlag(low, high, StateKeys.FONT_FAMILY)
    val textAlign = StateKeys.hasFlag(low, high, StateKeys.TEXT_ALIGN)

    if (fontColor) {
      cursorPaint.color = style.resolvedColor
      setTextColor(style.resolvedColor)
    }

    if (fontSize) {
      setTextSize(TypedValue.COMPLEX_UNIT_SP, style.resolvedFontSize.toFloat())
    }

    if (font) {
      style.resolvedFontFace.resolvedTypeface?.let {
        typeface = it
      }
    }

    if (textAlign) {
      gravity = resolveGravity(style.resolvedTextAlign)
    }

    if (fontSize || font || textAlign) {
      // Font metrics affect intrinsic measure — propagate through Mason.
      layoutIfSizeChanged()
      invalidate()
    }
  }

  override fun onBeforeInput(
    type: String,
    data: String?,
    options: EventOptions?
  ): Boolean {
    val event = org.nativescript.mason.masonkit.events.InputEvent(
      type = "beforeinput",
      data = data,
      inputType = type,
      options
    ).apply {
      target = this@TextArea
    }

    node.mason.dispatch(event)

    return !event.defaultPrevented
  }

  private fun resolveGravity(value: TextAlign): Int {
    val horizontal = when (value) {
      TextAlign.Right, TextAlign.End -> Gravity.END
      TextAlign.Center -> Gravity.CENTER_HORIZONTAL
      else -> Gravity.START
    }
    return Gravity.TOP or horizontal
  }
}
