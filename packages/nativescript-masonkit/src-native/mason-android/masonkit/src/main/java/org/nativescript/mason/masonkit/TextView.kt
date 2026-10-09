package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.app.assist.AssistStructure
import android.content.Context
import android.content.res.Resources
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PointF
import android.graphics.Rect
import android.graphics.RectF
import android.os.Bundle
import android.graphics.Typeface
import android.os.Build
import android.text.StaticLayout
import android.text.TextPaint
import android.widget.TextView.BufferType
import android.util.AttributeSet
import android.util.TypedValue
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.ViewConfiguration
import android.view.ContextThemeWrapper
import android.view.View
import android.view.ViewGroup
import android.view.ViewStructure
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityNodeProvider
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeProviderCompat
import androidx.customview.widget.ExploreByTouchHelper
import org.nativescript.fontmanager.FontStyle
import org.nativescript.fontmanager.FontWeight
import org.nativescript.mason.masonkit.Styles.TextJustify
import org.nativescript.mason.masonkit.Styles.TextWrap
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.events.Event
import java.lang.ref.WeakReference
import java.nio.ByteBuffer
import java.util.WeakHashMap
import kotlin.math.abs

val white_space = "\\s+".toRegex()

internal class ThemelessContext private constructor(base: Context, template: android.widget.TextView) :
  ContextThemeWrapper(base, base.resources.newTheme()) {
  // The paint a themed platform TextView starts with (flags, typeface, density, locale).
  // TextPaint.set, unlike the copy constructor, also copies density, which dip sizes use.
  private val templatePaint = TextPaint().apply { set(template.paint) }

  fun newTextPaint(): TextPaint = TextPaint().apply { set(templatePaint) }

  companion object {
    private val wrappers = WeakHashMap<Context, WeakReference<ThemelessContext>>()

    @Synchronized
    /** A text paint with the platform TextView's defaults, for views built on [context]. */
    fun textPaint(context: Context): TextPaint {
      val wrapped = wrap(context)
      return (wrapped as? ThemelessContext)?.newTextPaint()
        ?: TextPaint().apply { set(android.widget.TextView(context).paint) }
    }

    fun wrap(context: Context): Context {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || context is ThemelessContext) return context
      wrappers[context]?.get()?.let { return it }
      val wrapper = ThemelessContext(context, android.widget.TextView(context))
      wrappers[context] = WeakReference(wrapper)
      return wrapper
    }
  }
}

/**
 * A Mason text element. It lays out and draws its text itself, and is a ViewGroup so the
 * inline boxes in its text can be real child views.
 */
open class TextView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : ViewGroup(if (attrs == null) ThemelessContext.wrap(context) else context, attrs), Element, MeasureFunc,
  TextContainer {

  private val textPaint: TextPaint = ThemelessContext.textPaint(context)

  override fun getPaint(): TextPaint = textPaint

  val paint: TextPaint
    @JvmName("masonPaint") get() = textPaint

  override val view: View
    get() = this

  override val style: Style
    get() = node.style

  override val engine: TextEngine by lazy {
    TextEngine(this)
  }

  var type: TextType = TextType.None
    private set

  override lateinit var node: Node
    internal set


  constructor(context: Context, mason: Mason) : this(context, null, true) {
    setup(mason)
  }

  constructor(context: Context, mason: Mason, type: TextType, isAnonymous: Boolean = false) : this(
    context, null, true
  ) {
    this.type = type
    setup(mason, isAnonymous)
  }

  init {
    setWillNotDraw(false)
    if (!::node.isInitialized && !override) {
      setup(Mason.shared)
    }
  }

  override fun setTextSize(size: Float) {
    node.style.fontSize = size.toInt()
  }


  override fun setTextSize(unit: Int, size: Float) {
    if (unit == TypedValue.COMPLEX_UNIT_SP) {
      node.style.fontSize = size.toInt()
      return
    }

    val metrics = resources.displayMetrics
    val px = TypedValue.applyDimension(
      unit, size, metrics
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      node.style.fontSize = TypedValue.deriveDimension(
        TypedValue.COMPLEX_UNIT_SP, px, metrics
      ).toInt()
    } else {
      node.style.fontSize = (px / metrics.density).toInt()
    }
  }


  internal var cachedStaticLayout: android.text.Layout? = null
    private set
  private var cachedStaticLayoutMinWidth = -1
  private var cachedStaticLayoutMaxWidth = -1

  internal fun setCachedStaticLayout(layout: android.text.Layout, minWidth: Int, maxWidth: Int = minWidth) {
    cachedStaticLayout = layout
    cachedStaticLayoutMinWidth = minWidth
    cachedStaticLayoutMaxWidth = maxWidth
  }

  private fun clearCachedStaticLayout() {
    cachedStaticLayout = null
    cachedStaticLayoutMinWidth = -1
    cachedStaticLayoutMaxWidth = -1
  }

  private fun cachedStaticLayoutFits(contentWidth: Int): Boolean =
    contentWidth in cachedStaticLayoutMinWidth..cachedStaticLayoutMaxWidth

  // Float-aware StaticLayout: wraps text around floated sibling elements
  internal var floatAwareStaticLayout: StaticLayout? = null

  // Height applied by float-aware expansion so onSizeChanged can skip clearing the cache
  private var floatExpandedHeight: Int = -1
  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach {
      it.shader = null
      it.shaderWidth = -1
      it.shaderHeight = -1
    } // force rebuild on next draw
    style.invalidateBorderRenderer()
    // Invalidate cached StaticLayout when size changes, but skip if this
    // size change was triggered by our own float-aware height expansion.
    if (floatExpandedHeight > 0 && h == floatExpandedHeight) {
      // Keep the float-aware layout intact — we just expanded to fit it.
    } else {
      val lineLength = if (engine.isVerticalWritingMode) h - paddingTop - paddingBottom
      else w - paddingLeft - paddingRight
      if (!cachedStaticLayoutFits(lineLength)) clearCachedStaticLayout()
      floatAwareStaticLayout = null
      floatExpandedHeight = -1
    }
    super.onSizeChanged(w, h, oldw, oldh)
  }

  override fun onDraw(canvas: Canvas) {
    // Text changed since the last measure (no layout pass in between) is applied here.
    engine.applyTextIfNeeded()
    // Suppress view-level border only when this TextView will be flattened
    // and the blockquote bar is drawn as an inline span.
    val ignoreBorder =
      (this.type == TextType.Blockquote && this.engine.shouldFlattenTextContainer(this))
    ViewUtils.onDraw(this, canvas, style, ignoreBorder) { c ->
      if (engine.isVerticalWritingMode) {
        drawVertical(c)
        return@onDraw
      }
      // Build float-aware layout lazily if we have floated siblings.
      // Note: cachedStaticLayout may be null here (cleared by onSizeChanged
      // when applyLayoutFlat positions the view), so try building float-aware
      // layout unconditionally.
      if (floatAwareStaticLayout == null) {
        floatAwareStaticLayout = engine.buildFloatAwareStaticLayout(textPaint)
      }

      // After rotation Taffy reuses cached measure results, so measure() never
      // re-runs to rebuild cachedStaticLayout (cleared by onSizeChanged). Rebuild
      // it here at the current content width so our custom centered draw still
      // runs instead of falling back to the platform's top-aligned TextView.
      val contentWidth = width - paddingLeft - paddingRight
      if (floatAwareStaticLayout == null &&
        (cachedStaticLayout == null || (contentWidth > 0 && !cachedStaticLayoutFits(contentWidth)))
      ) {
        engine.rebuildCachedStaticLayout(textPaint, contentWidth)
      }

      val layoutToDraw = floatAwareStaticLayout ?: cachedStaticLayout

      if (layoutToDraw != null) {
        // If the float-aware layout is taller than the view, expand bounds
        // so text below the floats isn't clipped, and also grow ancestor
        // containers so their borders wrap the full content.
        if (layoutToDraw === floatAwareStaticLayout) {
          val neededHeight = layoutToDraw.height + paddingTop + paddingBottom
          if (neededHeight > height) {
            val extraHeight = neededHeight - height
            floatExpandedHeight = neededHeight
            post {
              layout(left, top, right, top + neededHeight)
              // Grow ancestor Elements so their borders wrap the expanded
              // text. Account for the child's bottom margin and the ancestor's
              // border + padding when computing the needed height.
              var child: android.view.View = this@TextView
              var childNode: Node? = this@TextView.node
              var anc = parent as? android.view.View
              var topExpanded: android.view.View? = null
              while (anc != null && anc is Element) {
                val ancElement = anc as Element
                val childMarginBottom = childNode?.let {
                  resolveMarginValue(
                    try {
                      it.style.margin.bottom
                    } catch (_: Throwable) {
                      null
                    }
                  )
                } ?: 0f
                val ancBorderBottom = ancElement.node.computedBorderBottom
                val needed =
                  child.bottom + childMarginBottom.toInt() + anc.paddingBottom + ancBorderBottom.toInt()
                val available = anc.height
                if (needed <= available) break
                anc.layout(anc.left, anc.top, anc.right, anc.top + needed)
                topExpanded = anc
                childNode = ancElement.node
                child = anc
                anc = anc.parent as? android.view.View
                anc?.invalidate()
              }
              // Single invalidate on the topmost expanded ancestor redraws
              // the whole subtree in one pass instead of per-ancestor.
              (topExpanded ?: this@TextView).invalidate()
            }
          }
        }
        val contentH = height - paddingTop - paddingBottom
        val dy = if (layoutToDraw.lineCount == 1 && contentH > 0) {
          val baseline0 = layoutToDraw.getLineBaseline(0)
          val glyphCenter = baseline0 +
            (layoutToDraw.getLineAscent(0) + layoutToDraw.getLineDescent(0)) / 2f
          contentH / 2f - glyphCenter
        } else if (centersVertically && contentH > layoutToDraw.height) {
          (contentH - layoutToDraw.height) / 2f
        } else 0f
        // We bypass super.onDraw, which normally insets the layout by the view's
        // padding — so apply paddingLeft/paddingTop here.
        if (layoutToDraw.paint === engine.plainTextPaintOrNull) engine.preparePlainTextPaint(textPaint)
        val tx = paddingLeft.toFloat()
        val ty = paddingTop.toFloat() + dy
        drawnLayout = layoutToDraw
        drawnDx = tx
        drawnDy = ty
        if (tx != 0f || ty != 0f) {
          val save = c.save()
          c.translate(tx, ty)
          layoutToDraw.draw(c)
          TextDecorations.draw(c, layoutToDraw)
          c.restoreToCount(save)
        } else {
          layoutToDraw.draw(c)
          TextDecorations.draw(c, layoutToDraw)
        }
        layoutInlineBoxes(layoutToDraw)
        updateInlineAccessibility()
      }
    }
  }

  /**
   * writing-mode: vertical-rl / vertical-lr with sideways glyphs. The layout is built with the
   * content height as its line length, then each line is turned 90° clockwise. vertical-rl stacks
   * lines from the right, which is one rotation; vertical-lr stacks them from the left with the
   * glyphs still turned clockwise, so each line is placed on its own.
   */
  private fun drawVertical(c: Canvas) {
    val lineLength = height - paddingTop - paddingBottom
    if (cachedStaticLayout == null || (lineLength > 0 && !cachedStaticLayoutFits(lineLength))) {
      engine.rebuildCachedStaticLayout(textPaint, lineLength)
    }
    val layout = cachedStaticLayout ?: return
    drawnLayout = layout
    if (layout.paint === engine.plainTextPaintOrNull) engine.preparePlainTextPaint(textPaint)
    val top = paddingTop.toFloat()
    if (style.resolvedWritingMode.toInt() == 1) {
      val save = c.save()
      c.translate((width - paddingRight).toFloat(), top)
      c.rotate(90f)
      layout.draw(c)
      TextDecorations.draw(c, layout)
      c.restoreToCount(save)
      layoutInlineBoxes(layout)
      updateInlineAccessibility()
      return
    }
    for (i in 0 until layout.lineCount) {
      val lineTop = layout.getLineTop(i)
      val lineBottom = layout.getLineBottom(i)
      val save = c.save()
      c.translate((paddingLeft + lineTop + lineBottom).toFloat(), top)
      c.rotate(90f)
      c.clipRect(0, lineTop, layout.width, lineBottom)
      layout.draw(c)
      TextDecorations.draw(c, layout)
      c.restoreToCount(save)
    }
    layoutInlineBoxes(layout)
    updateInlineAccessibility()
  }

  // The layout last drawn and its offset, for mapping touches into it.
  private var drawnLayout: android.text.Layout? = null
  private var drawnDx = 0f
  private var drawnDy = 0f

  /** Maps a point in this view into the drawn layout's coordinates, undoing [drawVertical]. */
  private fun toLayoutPoint(x: Float, y: Float): PointF? {
    val layout = drawnLayout ?: return null
    if (!engine.isVerticalWritingMode) return PointF(x - drawnDx, y - drawnDy)
    val lx = y - paddingTop
    if (style.resolvedWritingMode.toInt() == 1) return PointF(lx, width - paddingRight - x)
    for (i in 0 until layout.lineCount) {
      val lineTop = layout.getLineTop(i)
      val lineBottom = layout.getLineBottom(i)
      val ly = paddingLeft + lineTop + lineBottom - x
      if (ly >= lineTop && ly < lineBottom) return PointF(lx, ly)
    }
    return null
  }

  // An inline element being pressed: an inline box or a flattened element such as <a>.
  private var inlineTarget: Node? = null
  private var inlineTracking = false
  private var inlineDownX = 0f
  private var inlineDownY = 0f

  /** The pressed inline element and its ancestors inside this container. */
  private fun setInlinePressed(target: Node, pressed: Boolean) {
    var current: Node? = target
    while (current != null && current !== node) {
      current.setPseudo(PseudoState.ACTIVE, pressed)
      current = current.parent
    }
    (target.view as? View)?.isPressed = pressed
    invalidate()
  }

  private fun endInlineTap() {
    inlineTarget?.let { setInlinePressed(it, false) }
    inlineTarget = null
  }

  // Inline boxes and flattened elements are drawn by this view, so it routes their taps: the
  // click goes to the element under the finger and bubbles from there, as on the web.
  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        endInlineTap()
        inlineTracking = false
        val layout = drawnLayout
        val point = if (layout != null && isEnabled) toLayoutPoint(event.x, event.y) else null
        val target = point?.let { engine.inlineNodeAt(layout!!, it.x, it.y) }
        if (target != null && node.mason.hasListenerOnPath(target, "click")) {
          inlineTarget = target
          inlineTracking = true
          inlineDownX = event.x
          inlineDownY = event.y
          setInlinePressed(target, true)
          return true
        }
      }

      MotionEvent.ACTION_MOVE -> {
        if (inlineTracking) {
          val slop = ViewConfiguration.get(context).scaledTouchSlop
          if (abs(event.x - inlineDownX) > slop || abs(event.y - inlineDownY) > slop) endInlineTap()
          return true
        }
      }

      MotionEvent.ACTION_UP -> {
        if (inlineTracking) {
          val target = inlineTarget
          endInlineTap()
          inlineTracking = false
          target?.let { dispatchInlineClick(it) }
          return true
        }
      }

      MotionEvent.ACTION_CANCEL -> {
        if (inlineTracking) {
          endInlineTap()
          inlineTracking = false
          return true
        }
      }
    }
    return super.onTouchEvent(event)
  }

  private fun dispatchInlineClick(target: Node) {
    (target.view as? EventTarget)?.let {
      node.mason.dispatch(Event(type = "click").apply { this.target = it })
    }
  }

  /** Maps a rect in the drawn layout's coordinates back into this view, the inverse of [toLayoutPoint]. */
  private fun toViewRect(r: RectF): Rect {
    val layout = drawnLayout
    if (layout == null || !engine.isVerticalWritingMode) {
      return Rect((r.left + drawnDx).toInt(), (r.top + drawnDy).toInt(), (r.right + drawnDx).toInt(), (r.bottom + drawnDy).toInt())
    }
    val top = paddingTop + r.left
    val bottom = paddingTop + r.right
    if (style.resolvedWritingMode.toInt() == 1) {
      val right = width - paddingRight
      return Rect((right - r.bottom).toInt(), top.toInt(), (right - r.top).toInt(), bottom.toInt())
    }
    val line = layout.getLineForVertical(r.centerY().toInt())
    val sum = paddingLeft + layout.getLineTop(line) + layout.getLineBottom(line)
    return Rect((sum - r.bottom).toInt(), top.toInt(), (sum - r.top).toInt(), bottom.toInt())
  }

  /** Exposes inline boxes and links drawn by this view as virtual accessibility nodes. */
  private inner class InlineAccessibility : ExploreByTouchHelper(this) {
    var items: List<TextEngine.InlineItem> = emptyList()

    fun refresh() {
      items = drawnLayout?.let { engine.inlineAccessibilityItems(it) } ?: emptyList()
    }

    override fun getVirtualViewAt(x: Float, y: Float): Int {
      val p = toLayoutPoint(x, y) ?: return INVALID_ID
      val index = items.indexOfFirst { it.bounds.contains(p.x, p.y) }
      return if (index >= 0) index else INVALID_ID
    }

    override fun getVisibleVirtualViews(virtualViewIds: MutableList<Int>) {
      refresh()
      for (i in items.indices) virtualViewIds.add(i)
    }

    override fun onPopulateNodeForVirtualView(virtualViewId: Int, node: AccessibilityNodeInfoCompat) {
      val item = items.getOrNull(virtualViewId)
      if (item == null) {
        node.contentDescription = ""
        node.setBoundsInParent(Rect(0, 0, 1, 1))
        return
      }
      node.contentDescription = item.label
      node.className = if (item.isButton) "android.widget.Button" else "android.widget.TextView"
      node.setBoundsInParent(toViewRect(item.bounds).takeUnless { it.isEmpty } ?: Rect(0, 0, 1, 1))
      node.isClickable = true
      node.addAction(AccessibilityNodeInfoCompat.ACTION_CLICK)
    }

    override fun onPerformActionForVirtualView(virtualViewId: Int, action: Int, arguments: Bundle?): Boolean {
      if (action != AccessibilityNodeInfoCompat.ACTION_CLICK) return false
      val item = items.getOrNull(virtualViewId) ?: return false
      dispatchInlineClick(item.node)
      return true
    }
  }

  private var inlineAccessibility: InlineAccessibility? = null
  private var inlineAccessibilityLayout: android.text.Layout? = null

  // Installed only while accessibility is on and the text holds inline elements.
  private fun updateInlineAccessibility() {
    val layout = drawnLayout ?: return
    if (layout === inlineAccessibilityLayout || accessibilityManager?.isEnabled != true) return
    inlineAccessibilityLayout = layout
    val helper = inlineAccessibility
    if (helper == null) {
      if (!engine.hasInlineItems(layout)) return
      inlineAccessibility = InlineAccessibility()
    } else {
      helper.invalidateRoot()
    }
  }

  private var inlineProvider: AccessibilityNodeProvider? = null

  // A provider rather than a delegate: NativeScript core replaces every view's delegate.
  override fun getAccessibilityNodeProvider(): AccessibilityNodeProvider? {
    val helper = inlineAccessibility ?: return super.getAccessibilityNodeProvider()
    inlineProvider?.let { return it }
    val compat = helper.getAccessibilityNodeProvider(this) ?: return super.getAccessibilityNodeProvider()
    return InlineProvider(compat).also { inlineProvider = it }
  }

  /**
   * The link helper's provider, plus this view's real children (inline boxes). The helper only
   * knows virtual children, so they are added to its host node afterwards.
   */
  private inner class InlineProvider(private val compat: AccessibilityNodeProviderCompat) : AccessibilityNodeProvider() {
    override fun createAccessibilityNodeInfo(virtualViewId: Int): AccessibilityNodeInfo? {
      val info = compat.createAccessibilityNodeInfo(virtualViewId)?.unwrap() ?: return null
      if (virtualViewId == HOST_VIEW_ID) {
        for (i in 0 until childCount) info.addChild(getChildAt(i))
      }
      return info
    }

    override fun performAction(virtualViewId: Int, action: Int, arguments: Bundle?): Boolean =
      compat.performAction(virtualViewId, action, arguments)

    override fun findAccessibilityNodeInfosByText(text: String, virtualViewId: Int): MutableList<AccessibilityNodeInfo>? =
      compat.findAccessibilityNodeInfosByText(text, virtualViewId)?.map { it.unwrap() }?.toMutableList()

    override fun findFocus(focus: Int): AccessibilityNodeInfo? = compat.findFocus(focus)?.unwrap()
  }

  override fun dispatchHoverEvent(event: MotionEvent): Boolean {
    return inlineAccessibility?.dispatchHoverEvent(event) == true || super.dispatchHoverEvent(event)
  }

  var textContent: String
    get() {
      return engine.textContent
    }
    set(value) {
      // Invalidate our cached layout when text changes
      clearCachedStaticLayout()
      floatAwareStaticLayout = null
      engine.textContent = value
    }

  // The built text, as last applied by the engine.
  private var currentText: CharSequence = ""

  override fun setText(text: CharSequence, type: BufferType) {
    clearCachedStaticLayout()
    floatAwareStaticLayout = null
    currentText = text
    syncInlineBoxViews()
  }

  // The inline boxes in this text are its child views; the text only leaves room for them.
  private fun syncInlineBoxViews() {
    val wanted = ArrayList<View>()
    engine.forEachInlineBox(currentText) { box, _ -> (box.view as? View)?.let { wanted.add(it) } }
    if (wanted.isEmpty() && childCount == 0) return
    var changed = false
    for (i in childCount - 1 downTo 0) {
      val child = getChildAt(i)
      if (child !in wanted) {
        removeViewInLayout(child)
        (child as? Element)?.node?.let {
          if (it.inlineTurn != 0f) {
            it.inlineTurn = 0f
            it.style.applyTransformToView()
          }
        }
        changed = true
      }
    }
    for (view in wanted) {
      if (view.parent === this) continue
      node.detachViewQuietly(view)
      addViewInLayout(view, -1, view.layoutParams ?: generateDefaultLayoutParams(), true)
      changed = true
    }
    if (changed) invalidate()
  }

  // Lays each inline box out where the drawn text left room for it.
  private fun layoutInlineBoxes(layout: android.text.Layout) {
    if (childCount == 0) return
    engine.forEachInlineBox(layout.text) { box, rect ->
      val view = box.view as? View ?: return@forEachInlineBox
      if (rect == null || view.parent !== this) return@forEachInlineBox
      placeInlineBox(box, view, toViewRect(rect))
    }
  }

  /**
   * Lays out an inline box during Mason's layout pass: where the drawn text left room for it,
   * or, before the text has been drawn, where Mason placed it.
   */
  internal fun layoutInlineBox(box: Node, view: View, x: Int, y: Int, width: Int, height: Int) {
    var drawn: RectF? = null
    drawnLayout?.let { layout ->
      engine.forEachInlineBox(layout.text) { n, rect -> if (n === box && rect != null) drawn = rect }
    }
    placeInlineBox(box, view, drawn?.let { toViewRect(it) } ?: Rect(x, y, x + width, y + height))
  }

  private fun placeInlineBox(box: Node, view: View, rect: Rect) {
    var r = rect
    // A form control in vertical text runs down the page like the text: the platform control
    // is horizontal, so it is laid out unturned around the same centre and turned clockwise.
    val turn = if (view is Input && engine.isVerticalWritingMode) 90f else 0f
    if (turn != 0f) {
      val left = r.centerX() - r.height() / 2
      val top = r.centerY() - r.width() / 2
      r = Rect(left, top, left + r.height(), top + r.width())
    }
    if (box.inlineTurn != turn) {
      box.inlineTurn = turn
      box.style.applyTransformToView()
    }
    if (view.left == r.left && view.top == r.top && view.right == r.right && view.bottom == r.bottom &&
      !view.isLayoutRequested
    ) return
    view.measure(
      MeasureSpec.makeMeasureSpec(r.width().coerceAtLeast(0), MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(r.height().coerceAtLeast(0), MeasureSpec.EXACTLY)
    )
    view.layout(r.left, r.top, r.right, r.bottom)
    if (view is Input) view.layoutChild(0, 0, r.width(), r.height())
  }


  internal fun setTextDeferred(text: CharSequence, type: BufferType) = setText(text, type)

  /**
   * The text as laid out. Setting it replaces the content with a single text node shown as
   * given, spans included, as on a platform TextView.
   */
  var text: CharSequence
    get() = currentText
    set(value) {
      textContent = value.toString()
      (node.children.singleOrNull() as? TextNode)?.verbatim = value
      engine.invalidateInlineSegments()
    }

  private val accessibilityManager by lazy {
    context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? android.view.accessibility.AccessibilityManager
  }

  // Plain text alone composites without a layer, as the platform TextView does.
  override fun hasOverlappingRendering(): Boolean {
    return background?.current != null || childCount > 0 || isHorizontalFadingEdgeEnabled
  }

  /** The text for accessibility and autofill, without inline-box placeholders. */
  private fun readableText(): CharSequence {
    val text = currentText
    return if (text.indexOf('\uFFFC') >= 0) text.toString().replace("\uFFFC", "") else text
  }

  override fun getAccessibilityClassName(): CharSequence = "android.widget.TextView"

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)
    info.text = readableText()
  }

  override fun onPopulateAccessibilityEvent(event: AccessibilityEvent) {
    super.onPopulateAccessibilityEvent(event)
    val text = readableText()
    if (text.isNotEmpty()) event.text.add(text)
  }

  override fun findViewsWithText(outViews: ArrayList<View>, searched: CharSequence?, flags: Int) {
    super.findViewsWithText(outViews, searched, flags)
    if (searched.isNullOrEmpty() || flags and FIND_VIEWS_WITH_TEXT == 0 || outViews.contains(this)) return
    if (readableText().toString().contains(searched.toString(), ignoreCase = true)) outViews.add(this)
  }

  override fun onProvideContentCaptureStructure(structure: ViewStructure, flags: Int) {
    provideTextStructure(structure, readableText())
  }

  override fun onProvideStructure(structure: ViewStructure) {
    provideTextStructure(structure, readableText())
  }

  private fun provideTextStructure(structure: ViewStructure, text: CharSequence) {
    provideViewStructure(structure)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) structure.setReceiveContentMimeTypes(receiveContentMimeTypes)
    val drawn = floatAwareStaticLayout ?: cachedStaticLayout
    if (drawn == null || drawn.lineCount <= 1 || drawn.text.length != text.length || engine.isVerticalWritingMode) {
      structure.setText(text, -1, -1)
    } else {
      provideVisibleLines(structure, text, drawn)
    }
    var style = 0
    val typefaceStyle = textPaint.typeface?.style ?: Typeface.NORMAL
    if (typefaceStyle and Typeface.BOLD != 0 || textPaint.flags and Paint.FAKE_BOLD_TEXT_FLAG != 0) style = style or AssistStructure.ViewNode.TEXT_STYLE_BOLD
    if (typefaceStyle and Typeface.ITALIC != 0) style = style or AssistStructure.ViewNode.TEXT_STYLE_ITALIC
    if (textPaint.flags and Paint.UNDERLINE_TEXT_FLAG != 0) style = style or AssistStructure.ViewNode.TEXT_STYLE_UNDERLINE
    if (textPaint.flags and Paint.STRIKE_THRU_TEXT_FLAG != 0) style = style or AssistStructure.ViewNode.TEXT_STYLE_STRIKE_THRU
    structure.setTextStyle(textPaint.textSize, textPaint.color, AssistStructure.ViewNode.TEXT_COLOR_UNDEFINED, style)
    structure.setMinTextEms(-1)
    structure.setMaxTextEms(-1)
    structure.setMaxTextLength(-1)
  }

  private fun provideVisibleLines(structure: ViewStructure, text: CharSequence, layout: android.text.Layout) {
    val location = IntArray(2)
    getLocationInWindow(location)
    var root: android.view.View = this
    while (true) root = root.parent as? android.view.View ?: break
    val top = if (location[1] >= 0) 0 else -location[1]
    fun lineAt(y: Int) = layout.getLineForVertical(y - paddingTop + scrollY)
    val topLine = lineAt(top)
    val bottomLine = lineAt(top + root.height - 1)
    val contextLines = (bottomLine - topLine) / 2
    val topChar = layout.getLineStart((topLine - contextLines).coerceAtLeast(0))
    val bottomChar = layout.getLineEnd((bottomLine + contextLines).coerceAtMost(layout.lineCount - 1))
    val visible = if (topChar > 0 || bottomChar < text.length) text.subSequence(topChar, bottomChar) else text
    structure.setText(visible, -1 - topChar, -1 - topChar)
    val count = bottomLine - topLine + 1
    structure.setTextLines(
      IntArray(count) { layout.getLineStart(topLine + it) },
      IntArray(count) { layout.getLineBaseline(topLine + it) + paddingTop }
    )
  }

  private fun provideViewStructure(structure: ViewStructure) {
    val id = id
    var pkg: String? = null
    var type: String? = null
    var entry: String? = null
    if (id != NO_ID && !(id and 0xFF000000.toInt() == 0 && id and 0x00FFFFFF != 0)) {
      try {
        pkg = resources.getResourcePackageName(id)
        type = resources.getResourceTypeName(id)
        entry = resources.getResourceEntryName(id)
      } catch (_: Resources.NotFoundException) {
      }
    }
    structure.setId(id, pkg, type, entry)
    structure.setImportantForAutofill(importantForAutofill)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) structure.setReceiveContentMimeTypes(receiveContentMimeTypes)
    structure.setDimens(left, top, scrollX, scrollY, width, height)
    structure.setVisibility(visibility)
    structure.setEnabled(isEnabled)
    if (isClickable) structure.setClickable(true)
    if (isFocusable) structure.setFocusable(true)
    if (isFocused) structure.setFocused(true)
    if (isSelected) structure.setSelected(true)
    if (isActivated) structure.setActivated(true)
    if (isLongClickable) structure.setLongClickable(true)
    if (isOpaque) structure.setOpaque(true)
    if (isContextClickable) structure.setContextClickable(true)
    structure.setClassName(accessibilityClassName.toString())
    structure.setContentDescription(contentDescription)
  }

  internal open fun createOwnNode(mason: Mason, isAnonymous: Boolean): Node =
    mason.createTextNode(this, isAnonymous)

  // A button centres its label, several lines included.
  internal open val centersVertically: Boolean
    get() = false

  internal fun setup(mason: Mason, isAnonymous: Boolean = false) {
    node = createOwnNode(mason, isAnonymous).apply {
      view = this@TextView
      this.isAnonymous = isAnonymous
    }
    // Web user-agent default font-size/margin numbers live in mason-core
    // (single source of truth, see ua_default_for_tag); this scales them from
    // CSS px to device pixels by display density. Must stay in sync with iOS
    // MasonText.swift's equivalent call.
    val density = resources.displayMetrics.density
    // ua = [fontSize, marginTop, marginBottom, marginLeft, marginRight]
    val uaMargin = { ua: FloatArray ->
      Rect<LengthPercentageAuto>(
        top = LengthPercentageAuto.Points(ua[1] * density),
        right = LengthPercentageAuto.Points(ua[4] * density),
        bottom = LengthPercentageAuto.Points(ua[2] * density),
        left = LengthPercentageAuto.Points(ua[3] * density),
      )
    }

    setPadding(0, 0, 0, 0)
    background = null

    if (type != TextType.None) {
      node.style.inBatch = true

      when (type) {
        TextType.Span -> {
          style.display = Display.Inline
        }

        TextType.Code -> {
          style.fontFamily = "monospace"
          style.display = Display.Inline
        }

        TextType.H1 -> {
          node.style.display = Display.Block
          style.fontWeight = FontWeight.Bold
          val ua = Mason.nativeUaDefaultForTag("h1") // fontSize 2em, margin 0.67em
          fontSize = ua[0].toInt()
          node.style.margin = uaMargin(ua)
        }

        TextType.H2 -> {
          node.style.display = Display.Block
          style.fontWeight = FontWeight.Bold
          val ua = Mason.nativeUaDefaultForTag("h2") // fontSize 1.5em, margin 0.83em
          fontSize = ua[0].toInt()
          node.style.margin = uaMargin(ua)
        }

        TextType.H3 -> {
          node.style.display = Display.Block
          style.fontWeight = FontWeight.Bold
          val ua = Mason.nativeUaDefaultForTag("h3") // fontSize 1.17em ≈ 18.72, margin 1em
          fontSize = ua[0].toInt()
          node.style.margin = uaMargin(ua)
        }

        TextType.H4 -> {
          node.style.display = Display.Block
          style.fontWeight = FontWeight.Bold
          val ua = Mason.nativeUaDefaultForTag("h4") // fontSize 1em (16), margin 1.33em
          fontSize = ua[0].toInt()
          node.style.margin = uaMargin(ua)
        }

        TextType.H5 -> {
          node.style.display = Display.Block
          style.fontWeight = FontWeight.Bold
          val ua = Mason.nativeUaDefaultForTag("h5") // fontSize 0.83em ≈ 13.28, margin 1.67em
          fontSize = ua[0].toInt()
          node.style.margin = uaMargin(ua)
        }

        TextType.H6 -> {
          node.style.display = Display.Block
          style.fontWeight = FontWeight.Bold
          val ua = Mason.nativeUaDefaultForTag("h6") // fontSize 0.67em ≈ 10.72, margin 2.33em
          fontSize = ua[0].toInt()
          node.style.margin = uaMargin(ua)
        }

        TextType.Li -> {
          // Browsers give <li> `display:list-item`; marker rendering here is
          // handled separately by View.kt's drawListItemMarkers, so plain
          // Block is enough to keep siblings from running together inline.
          node.style.display = Display.Block
        }

        TextType.Blockquote -> {
          node.style.display = Display.Block
          node.style.margin = uaMargin(Mason.nativeUaDefaultForTag("blockquote")) // 1em 40px
        }

        TextType.B, TextType.Strong -> {
          style.fontWeight = FontWeight.Bold
          style.display = Display.Inline
        }

        TextType.Pre -> {
          node.style.display = Display.Block
          style.fontFamily = "monospace"
          whiteSpace = Styles.WhiteSpace.Pre
          node.style.margin = uaMargin(Mason.nativeUaDefaultForTag("pre")) // 1em
        }

        TextType.I, TextType.Em -> {
          style.fontStyle = FontStyle.Italic
          style.display = Display.Inline
        }

        TextType.P -> {
          node.style.display = Display.Block
          node.style.margin = uaMargin(Mason.nativeUaDefaultForTag("p")) // 1em
        }

        TextType.A -> {
          node.style.display = Display.Inline
          // No forced underline — match web (CSS resets links); honor text-decoration.

          // Focusable for keyboard navigation only, so a tap clicks at once.
          isClickable = true
          isFocusable = true

          node.hasNativeClickDispatch = true
          setOnClickListener {
            node.mason.dispatch(
              Event(
                type = "click",
              ).apply {
                target = this@TextView
              }
            )
          }

          setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_UP) {
              performClick()
              true
            } else {
              false
            }
          }
        }

        else -> {}
      }

      node.style.inBatch = false
    }

    textPaint.textSize = TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_SP,
      fontSize.toFloat(),
      resources.displayMetrics
    )

    node.style.setStyleChangeListener(this)
  }

  override fun getBaseline(): Int {
    // Vertical text has no horizontal baseline to align with.
    if (engine.isVerticalWritingMode) return -1
    // Return baseline calculated from our font metrics
    if (style.isValueInitialized) {
      val metrics = style.getFontMetrics()
      // Baseline is ascent distance from top of content box
      // `metrics.ascent` is negative (distance above baseline). Use its
      // negated value to get the positive distance from the top to baseline.
      val baselineY = node.computedPaddingTop + node.computedBorderTop + -metrics.ascent
      return baselineY.toInt()
    }

    val layout = cachedStaticLayout ?: return -1
    return paddingTop + layout.getLineBaseline(0)
  }

  override fun onChange(low: Long, high: Long) {
    // Style change affects layout; invalidate cached StaticLayout
    clearCachedStaticLayout()
    floatAwareStaticLayout = null
    engine.onTextStyleChanged(low, high, textPaint, resources.displayMetrics)
  }

  val values: ByteBuffer
    get() {
      return style.values
    }

  var includePadding: Boolean
    get() {
      return engine.includePadding
    }
    set(value) {
      engine.includePadding = value
    }

  var textAlign: TextAlign
    get() {
      return style.textAlign
    }
    set(value) {
      style.textAlign = value
    }

  var textJustify: TextJustify
    get() {
      return style.textJustify
    }
    set(value) {
      style.textJustify = value
    }

  var color: Int
    get() = style.color
    set(value) {
      style.color = value
    }

  var font: String
    get() {
      return ""
    }
    set(value) {

    }

  var fontFamily: String
    get() {
      return style.fontFamily
    }
    set(value) {
      style.fontFamily = value
    }

  var fontVariant: String
    get() {
      return style.fontVariant
    }
    set(value) {
      style.fontVariant = value
    }

  var fontStretch: String
    get() {
      return style.fontStretch
    }
    set(value) {
      style.fontStretch = value
    }


  var fontSize: Int
    get() {
      return style.fontSize
    }
    set(value) {
      style.fontSize = value
    }

  var fontWeight: FontWeight
    get() {
      return style.fontWeight
    }
    set(value) {
      style.fontWeight = value
    }

  var fontStyle: FontStyle
    set(value) {
      style.fontStyle = value
    }
    get() {
      return style.fontStyle
    }

  var textWrap: TextWrap
    get() {
      return style.textWrap
    }
    set(value) {
      style.textWrap = value
    }

  var letterSpacingValue: Float
    get() {
      return style.letterSpacing
    }
    set(value) {
      style.letterSpacing = value
    }

  var whiteSpace: Styles.WhiteSpace
    get() {
      return style.whiteSpace
    }
    set(value) {
      style.whiteSpace = value
    }

  var textTransform: Styles.TextTransform
    get() {
      return style.textTransform
    }
    set(value) {
      style.textTransform = value
    }

  var backgroundColorValue: Int
    get() {
      return style.backgroundColor
    }
    set(value) {
      style.backgroundColor = value
    }

  var decorationLine: Styles.DecorationLine
    get() {
      return style.decorationLine
    }
    set(value) {
      style.decorationLine = value
    }

  var decorationColor: Int
    get() {
      return style.decorationColor
    }
    set(value) {
      style.decorationColor = value
    }

  var decorationStyle: Styles.DecorationStyle
    get() {
      return style.decorationStyle
    }
    set(value) {
      style.decorationStyle = value
    }

  private fun mapMeasureSpec(mode: Int, value: Int): AvailableSpace {
    return when (mode) {
      MeasureSpec.EXACTLY -> AvailableSpace.Definite(value.toFloat())
      MeasureSpec.UNSPECIFIED -> {
        if (value != 0) {
          AvailableSpace.MaxContent
        } else {
          AvailableSpace.MinContent
        }
      }

      MeasureSpec.AT_MOST -> {
        if (value != 0) {
          AvailableSpace.Definite(value.toFloat())
        } else {
          AvailableSpace.MaxContent
        }
      }

      else -> AvailableSpace.MinContent
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    if (parent !is Element || node.parent == null) {
      computeOrDeferNested(
        mapMeasureSpec(specWidthMode, specWidth).value,
        mapMeasureSpec(specHeightMode, specHeight).value
      )

      layoutFlat()
      setMeasuredDimension(node.computedWidth.toInt(), node.computedHeight.toInt())
    } else {
      if (specWidthMode == MeasureSpec.EXACTLY && specHeightMode == MeasureSpec.EXACTLY) {
        setMeasuredDimension(specWidth, specHeight)
      } else {
        setMeasuredDimension(node.computedWidth.toInt(), node.computedHeight.toInt())
      }
    }
  }

  override fun measure(
    knownWidth: Float, knownHeight: Float,
    availableWidth: Float, availableHeight: Float
  ): Long {
    return engine.measure(textPaint, knownWidth, knownHeight, availableWidth, availableHeight)
  }

  internal fun attachTextNode(node: TextNode, index: Int = -1) {
    node.container = this
    engine.invalidateInlineSegments()
  }

  internal fun detachTextNode(node: TextNode) {
    if (node.container === this) {
      node.container = null
      engine.invalidateInlineSegments()
    }
  }

  internal fun onCharacterDataChanged(node: TextNode) {
    if (node.container === this) {
      engine.invalidateInlineSegments()
    }
  }

  private fun processTextNode(node: TextNode): CharSequence {
    return node.data
  }


  // Append multiple items (strings or nodes)
  fun append(vararg items: Any) {
    for (item in items) {
      when (item) {
        is String -> {
          val textNode = TextNode(node.mason).apply {
            data = item
            container = this@TextView
          }
          node.appendChild(textNode)
        }

        is TextContainer -> {
          node.appendChild(item.node)
        }

        is Element -> {
          node.appendChild(item.node)
        }

        is Node -> {
          node.appendChild(item)
        }

        else -> {
          // Convert to string and append as text
          val textNode = TextNode(node.mason).apply {
            data = item.toString()
            container = this@TextView
          }
          node.appendChild(textNode)
        }
      }
    }
  }

  override fun addChildAt(text: String, index: Int) {
    val child = TextNode(node.mason, text).apply {
      container = this@TextView
    }
    node.addChildAt(child, index)
    child.apply {
      attributes.sync(style)
    }
  }

  // A plain View (an SVG, a canvas, a native control) in text is an atomic inline box, as a
  // replaced element is in HTML; its node would otherwise be a block and break the line.
  private fun nodeFor(child: View): Node =
    if (child is Element) child.node else node.mason.nodeForView(child).also {
      if (it.style.display == Display.Block) it.style.display = Display.InlineBlock
    }

  // Whether Mason attaches [child] as a real child view. Inline content is drawn by this view.
  private fun attachesView(child: Node): Boolean = false

  // Adding a view adds its element to this text. Mason's own attach (under suppression) only
  // attaches the views this text doesn't draw itself.
  override fun addView(child: View?) = addView(child, -1)

  override fun addView(child: View?, index: Int) {
    child ?: return
    val childNode = nodeFor(child)
    if (node.suppressChildOps > 0) {
      if (attachesView(childNode)) super.addView(child, index)
      return
    }
    if (childNode.parent === node) return
    if (index < 0) node.appendChild(childNode) else node.addChildAt(childNode, index)
    engine.invalidateInlineSegments()
  }

  override fun addView(child: View?, params: LayoutParams?) = addView(child, -1)

  override fun addView(child: View?, index: Int, params: LayoutParams?) = addView(child, index)

  override fun removeView(view: View?) {
    view ?: return
    if (node.suppressChildOps > 0) {
      super.removeView(view)
      return
    }
    val childNode = nodeFor(view)
    if (childNode.parent === node) {
      node.removeChild(childNode)
      engine.invalidateInlineSegments()
      return
    }
    super.removeView(view)
  }

  fun removeView(index: Int) = removeViewAt(index)

  override fun removeViewAt(index: Int) {
    if (node.suppressChildOps > 0) {
      super.removeViewAt(index)
      return
    }
    node.removeChildAt(index)
    engine.invalidateInlineSegments()
  }

  override fun removeAllViews() {
    if (node.suppressChildOps > 0) {
      super.removeAllViews()
      return
    }
    node.removeChildren()
    super.removeAllViews()
    engine.invalidateInlineSegments()
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {}
}
