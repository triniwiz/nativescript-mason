package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Rect
import android.util.AttributeSet
import android.view.FocusFinder
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewDebug.ExportedProperty
import android.view.ViewGroup
import android.view.animation.AnimationUtils
import android.widget.EdgeEffect
import android.widget.FrameLayout
import android.widget.OverScroller
import androidx.core.view.NestedScrollingChild3
import androidx.core.view.NestedScrollingChildHelper
import androidx.core.view.NestedScrollingParent3
import androidx.core.view.NestedScrollingParentHelper
import androidx.core.view.ViewCompat
import androidx.core.view.isEmpty
import androidx.core.view.isNotEmpty
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min


/**
 * Layout container for a view hierarchy that can be scrolled by the user,
 * allowing it to be larger than the physical display.
 *
 * Subclasses set [scrollContentWidth] and [scrollContentHeight] to declare the
 * total scrollable content area.  All scroll-range calculations use these
 * virtual dimensions instead of querying a single child view, so the container
 * can host an arbitrary number of direct children.
 */
open class TwoDScrollView : FrameLayout, NestedScrollingChild3, NestedScrollingParent3 {

  private val tempRect = Rect()

  // Nested scrolling: this view participates both as a child (dispatching
  // unconsumed scroll to an outer scrolling parent — e.g. another scroll
  // container or a CoordinatorLayout) and as a parent (receiving nested
  // scroll from inner scrolling children). The two helpers implement the
  // full NestedScrollingChild3 / NestedScrollingParent3 contract.
  private val childHelper = NestedScrollingChildHelper(this)
  private val parentHelper = NestedScrollingParentHelper(this)

  // Scratch buffers reused across a gesture to avoid per-frame allocation.
  private val scrollOffset = IntArray(2)
  private val scrollConsumed = IntArray(2)

  // Accumulated window-coordinate shift contributed by nested parents during
  // the current touch gesture, so finger deltas stay correct as the outer
  // parent moves us.
  private var nestedXOffset = 0
  private var nestedYOffset = 0

  // Tracks the scroller position consumed by the NON_TOUCH (fling) pass.
  private var lastScrollerX = 0
  private var lastScrollerY = 0

  private var lastScroll: Long = 0

  private var scroller: OverScroller? = null

  private var scrollChangeListener: ScrollChangeListener? = null

  open var enableScrollX: Boolean = true
  open var enableScrollY: Boolean = true

  /** Total width of the scrollable content area (set by subclasses after layout). */
  var scrollContentWidth: Int = 0

  /** Total height of the scrollable content area (set by subclasses after layout). */
  var scrollContentHeight: Int = 0

  @ExportedProperty(category = "layout")
  private var fillViewport = false

  private var twoDScrollViewMovedFocus = false

  private var lastMotionY = 0f
  private var lastMotionX = 0f

  private var isLayoutDirty = true

  private var childToScrollTo: View? = null

  private var isBeingDragged = false

  private var velocityTracker: VelocityTracker? = null

  private var touchSlop = 0
  private var minimumVelocity = 0
  private var maximumVelocity = 0
  private var overflingDistance = 0

  // Overscroll effects (stretch on API 31+, glow earlier), one per edge.
  // Created on first overscroll; most block elements never scroll.
  private class EdgeEffects(context: Context) {
    val top = EdgeEffect(context)
    val bottom = EdgeEffect(context)
    val left = EdgeEffect(context)
    val right = EdgeEffect(context)
  }

  private var edgeEffects: EdgeEffects? = null

  private fun edges(): EdgeEffects = edgeEffects ?: EdgeEffects(context).also { edgeEffects = it }

  @JvmOverloads
  constructor(context: Context, attrs: AttributeSet? = null) : super(context, attrs) {
    initTwoDScrollView(context, attrs)
  }

  constructor(context: Context, attrs: AttributeSet?, defStyle: Int) : super(
    context, attrs, defStyle
  ) {
    initTwoDScrollView(context, attrs)
  }

  fun setScrollChangeListner(listener: ScrollChangeListener?) {
    scrollChangeListener = listener
  }

  fun isFillViewport(): Boolean = fillViewport

  fun setFillViewport(fillViewport: Boolean) {
    if (fillViewport != this.fillViewport) {
      this.fillViewport = fillViewport
      requestLayout()
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    if (!fillViewport) return
    val heightMode = MeasureSpec.getMode(heightMeasureSpec)
    if (heightMode == MeasureSpec.UNSPECIFIED) return
    if (isNotEmpty()) {
      val child = getChildAt(0)
      var height = measuredHeight
      if (child.measuredHeight < height) {
        val lp = child.layoutParams as LayoutParams
        val childWidthMeasureSpec = getChildMeasureSpec(
          widthMeasureSpec, paddingLeft + paddingRight, lp.width
        )
        height -= paddingTop
        height -= paddingBottom
        val childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
        child.measure(childWidthMeasureSpec, childHeightMeasureSpec)
      }
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    super.onLayout(changed, l, t, r, b)
    isLayoutDirty = false
    if (childToScrollTo != null && isViewDescendantOf(childToScrollTo!!, this)) {
      scrollToChild(childToScrollTo!!)
    }
    childToScrollTo = null
    scrollTo(scrollX, scrollY)
  }

  val maxScrollAmountVertical: Int
    get() = (MAX_SCROLL_FACTOR * height).toInt()

  val maxScrollAmountHorizontal: Int
    get() = (MAX_SCROLL_FACTOR * width).toInt()

  private fun initTwoDScrollView(context: Context?, attrs: AttributeSet?) {
    scroller = OverScroller(getContext())
    isFocusable = true
    descendantFocusability = FOCUS_AFTER_DESCENDANTS
    setWillNotDraw(false)
    val configuration = ViewConfiguration.get(getContext())
    touchSlop = configuration.scaledTouchSlop
    minimumVelocity = configuration.scaledMinimumFlingVelocity
    maximumVelocity = configuration.scaledMaximumFlingVelocity
    overflingDistance = configuration.scaledOverflingDistance
    childHelper.isNestedScrollingEnabled = true
  }

  /** Scroll axes this view can currently consume, for nested-scroll start. */
  private fun nestedScrollAxes(): Int {
    var axes = 0
    if (enableScrollX) axes = axes or ViewCompat.SCROLL_AXIS_HORIZONTAL
    if (enableScrollY) axes = axes or ViewCompat.SCROLL_AXIS_VERTICAL
    return axes
  }

  /**
   * Apply a scroll delta to this container, clamped to the scroll range, and
   * return the amount actually consumed on each axis ([0] = x, [1] = y).
   * Disabled axes consume nothing.
   */
  private fun scrollByClamped(dx: Int, dy: Int, out: IntArray) {
    val ldx = if (enableScrollX) dx else 0
    val ldy = if (enableScrollY) dy else 0
    if (ldx == 0 && ldy == 0) {
      out[0] = 0
      out[1] = 0
      return
    }
    val oldX = scrollX
    val oldY = scrollY
    scrollBy(ldx, ldy) // scrollTo override clamps to [0, range]
    out[0] = scrollX - oldX
    out[1] = scrollY - oldY
  }

  private fun getScrollRangeX(): Int =
    maxOf(scrollContentWidth - (width - paddingLeft - paddingRight), 0)

  private fun getScrollRangeY(): Int =
    maxOf(scrollContentHeight - (height - paddingTop - paddingBottom), 0)

  private fun releaseEdgeEffects() {
    val e = edgeEffects ?: return
    e.top.onRelease()
    e.bottom.onRelease()
    e.left.onRelease()
    e.right.onRelease()
  }

  private fun canScroll(): Boolean {
    return enableScrollX || enableScrollY
  }

  fun executeKeyEvent(event: KeyEvent): Boolean {
    tempRect.setEmpty()
    if (!canScroll()) {
      if (isFocused) {
        var currentFocused = findFocus()
        if (currentFocused === this) currentFocused = null
        val nextFocused = FocusFinder.getInstance().findNextFocus(this, currentFocused, FOCUS_DOWN)
        return nextFocused != null && nextFocused !== this && nextFocused.requestFocus(FOCUS_DOWN)
      }
      return false
    }
    var handled = false
    if (event.action == KeyEvent.ACTION_DOWN) {
      when (event.keyCode) {
        KeyEvent.KEYCODE_DPAD_UP -> handled = if (!event.isAltPressed) arrowScroll(FOCUS_UP, false) else fullScroll(FOCUS_UP, false)
        KeyEvent.KEYCODE_DPAD_DOWN -> handled = if (!event.isAltPressed) arrowScroll(FOCUS_DOWN, false) else fullScroll(FOCUS_DOWN, false)
        KeyEvent.KEYCODE_DPAD_LEFT -> handled = if (!event.isAltPressed) arrowScroll(FOCUS_LEFT, true) else fullScroll(FOCUS_LEFT, true)
        KeyEvent.KEYCODE_DPAD_RIGHT -> handled = if (!event.isAltPressed) arrowScroll(FOCUS_RIGHT, true) else fullScroll(FOCUS_RIGHT, true)
      }
    }
    return handled
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    if (ev.action == MotionEvent.ACTION_DOWN && ev.edgeFlags != 0) return false
    if (!canScroll()) return super.onTouchEvent(ev)

    if (velocityTracker == null) velocityTracker = VelocityTracker.obtain()
    velocityTracker!!.addMovement(ev)

    val action = ev.action
    val y = ev.y
    val x = ev.x

    when (action) {
      MotionEvent.ACTION_DOWN -> {
        if (!scroller!!.isFinished) scroller!!.abortAnimation()
        lastMotionY = y
        lastMotionX = x
        nestedXOffset = 0
        nestedYOffset = 0
        // A touch gesture supersedes any in-flight fling nested scroll.
        stopNestedScroll(ViewCompat.TYPE_NON_TOUCH)
        startNestedScroll(nestedScrollAxes(), ViewCompat.TYPE_TOUCH)
        // Let the view handle the down event (e.g. for tap/click listeners)
        super.onTouchEvent(ev)
      }

      MotionEvent.ACTION_MOVE -> {
        var deltaX = (lastMotionX - x).toInt()
        var deltaY = (lastMotionY - y).toInt()

        // Pre-scroll: give a nested parent first claim on the delta.
        if (dispatchNestedPreScroll(deltaX, deltaY, scrollConsumed, scrollOffset, ViewCompat.TYPE_TOUCH)) {
          deltaX -= scrollConsumed[0]
          deltaY -= scrollConsumed[1]
          nestedXOffset += scrollOffset[0]
          nestedYOffset += scrollOffset[1]
        }

        // Re-anchor against any window shift the parent applied.
        lastMotionX = x - scrollOffset[0]
        lastMotionY = y - scrollOffset[1]

        // Consume locally what we can, within range.
        scrollByClamped(deltaX, deltaY, scrollConsumed)
        val scrolledX = scrollConsumed[0]
        val scrolledY = scrollConsumed[1]
        var unconsumedX = deltaX - scrolledX
        var unconsumedY = deltaY - scrolledY

        // Hand the leftover up to a nested parent (Child3 consumed-aware path).
        scrollConsumed[0] = 0
        scrollConsumed[1] = 0
        dispatchNestedScroll(
          scrolledX, scrolledY, unconsumedX, unconsumedY,
          scrollOffset, ViewCompat.TYPE_TOUCH, scrollConsumed
        )
        lastMotionX -= scrollOffset[0]
        lastMotionY -= scrollOffset[1]
        nestedXOffset += scrollOffset[0]
        nestedYOffset += scrollOffset[1]
        unconsumedX -= scrollConsumed[0]
        unconsumedY -= scrollConsumed[1]

        // Whatever neither we nor any parent could take feeds the edge glow.
        val w = width.coerceAtLeast(1).toFloat()
        val h = height.coerceAtLeast(1).toFloat()
        var needsInvalidate = false
        if (enableScrollX && unconsumedX != 0 && !hasNestedScrollingParent(ViewCompat.TYPE_TOUCH)) {
          if (unconsumedX < 0) edges().left.onPull(-unconsumedX / w, 1f - y / h)
          else edges().right.onPull(unconsumedX / w, y / h)
          needsInvalidate = true
        }
        if (enableScrollY && unconsumedY != 0 && !hasNestedScrollingParent(ViewCompat.TYPE_TOUCH)) {
          if (unconsumedY < 0) edges().top.onPull(-unconsumedY / h, x / w)
          else edges().bottom.onPull(unconsumedY / h, 1f - x / w)
          needsInvalidate = true
        }
        if (needsInvalidate) postInvalidateOnAnimation()
      }

      MotionEvent.ACTION_UP -> {
        val vt = velocityTracker
        vt!!.computeCurrentVelocity(1000, maximumVelocity.toFloat())
        val initialXVelocity = vt.xVelocity.toInt()
        val initialYVelocity = vt.yVelocity.toInt()
        if ((abs(initialXVelocity) + abs(initialYVelocity) > minimumVelocity) && childCount > 0) {
          fling(-initialXVelocity, -initialYVelocity)
        } else {
          stopNestedScroll(ViewCompat.TYPE_TOUCH)
        }
        if (velocityTracker != null) {
          velocityTracker!!.recycle()
          velocityTracker = null
        }
        releaseEdgeEffects()
        postInvalidateOnAnimation()
        // Let the view handle the up event (e.g. for tap/click listeners)
        super.onTouchEvent(ev)
      }

      MotionEvent.ACTION_CANCEL -> {
        if (velocityTracker != null) {
          velocityTracker!!.recycle()
          velocityTracker = null
        }
        stopNestedScroll(ViewCompat.TYPE_TOUCH)
        releaseEdgeEffects()
        postInvalidateOnAnimation()
      }
    }
    return true
  }

  override fun onScrollChanged(x: Int, y: Int, oldx: Int, oldy: Int) {
    super.onScrollChanged(x, y, oldx, oldy)
    scrollChangeListener?.onScrollChanged(this, x, y, oldx, oldy)
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    val currentFocused = findFocus()
    if (null == currentFocused || this === currentFocused) return
    currentFocused.getDrawingRect(tempRect)
    offsetDescendantRectToMyCoords(currentFocused, tempRect)
    val scrollDeltaX = computeScrollDeltaToGetChildRectOnScreen(tempRect)
    val scrollDeltaY = computeScrollDeltaToGetChildRectOnScreen(tempRect)
    doScroll(scrollDeltaX, scrollDeltaY)
  }

  override fun scrollTo(x: Int, y: Int) {
    var x = x
    var y = y
    if (childCount > 0) {
      x = clamp(x, width - paddingRight - paddingLeft, scrollContentWidth)
      y = clamp(y, height - paddingBottom - paddingTop, scrollContentHeight)
      if (x != scrollX || y != scrollY) {
        super.scrollTo(x, y)
      }
    }
  }

  override fun computeScroll() {
    if (scroller!!.isFinished) {
      stopNestedScroll(ViewCompat.TYPE_NON_TOUCH)
      return
    }

    scroller!!.computeScrollOffset()
    val x = scroller!!.currX
    val y = scroller!!.currY
    var unconsumedX = x - lastScrollerX
    var unconsumedY = y - lastScrollerY
    lastScrollerX = x
    lastScrollerY = y

    // Pre-scroll: let a nested parent take momentum first.
    scrollConsumed[0] = 0
    scrollConsumed[1] = 0
    dispatchNestedPreScroll(unconsumedX, unconsumedY, scrollConsumed, null, ViewCompat.TYPE_NON_TOUCH)
    unconsumedX -= scrollConsumed[0]
    unconsumedY -= scrollConsumed[1]

    if (unconsumedX != 0 || unconsumedY != 0) {
      scrollByClamped(unconsumedX, unconsumedY, scrollConsumed)
      val scrolledX = scrollConsumed[0]
      val scrolledY = scrollConsumed[1]
      unconsumedX -= scrolledX
      unconsumedY -= scrolledY

      // Pass anything we couldn't take up to a nested parent.
      scrollConsumed[0] = 0
      scrollConsumed[1] = 0
      dispatchNestedScroll(
        scrolledX, scrolledY, unconsumedX, unconsumedY,
        null, ViewCompat.TYPE_NON_TOUCH, scrollConsumed
      )
      unconsumedX -= scrollConsumed[0]
      unconsumedY -= scrollConsumed[1]
    }

    // Truly-unconsumed momentum hits our own edge — absorb into the glow.
    if (unconsumedX != 0 || unconsumedY != 0) {
      val v = scroller!!.currVelocity.toInt()
      val e = edges()
      if (enableScrollY && unconsumedY != 0) {
        if (unconsumedY < 0 && e.top.isFinished) e.top.onAbsorb(v)
        else if (unconsumedY > 0 && e.bottom.isFinished) e.bottom.onAbsorb(v)
      }
      if (enableScrollX && unconsumedX != 0) {
        if (unconsumedX < 0 && e.left.isFinished) e.left.onAbsorb(v)
        else if (unconsumedX > 0 && e.right.isFinished) e.right.onAbsorb(v)
      }
      scroller!!.abortAnimation()
    }

    if (!scroller!!.isFinished) {
      postInvalidateOnAnimation()
    } else {
      stopNestedScroll(ViewCompat.TYPE_NON_TOUCH)
    }
  }

  override fun getTopFadingEdgeStrength(): Float {
    if (isEmpty()) return 0.0f
    val length = getVerticalFadingEdgeLength()
    return if (scrollY < length) scrollY / length.toFloat() else 1.0f
  }

  override fun getBottomFadingEdgeStrength(): Float {
    if (isEmpty()) return 0.0f
    val length = getVerticalFadingEdgeLength()
    val bottomEdge = height - paddingBottom
    val span = scrollContentHeight - scrollY - bottomEdge
    return if (span < length) span / length.toFloat() else 1.0f
  }

  override fun getLeftFadingEdgeStrength(): Float {
    if (isEmpty()) return 0.0f
    val length = getHorizontalFadingEdgeLength()
    return if (scrollX < length) scrollX / length.toFloat() else 1.0f
  }

  override fun getRightFadingEdgeStrength(): Float {
    if (isEmpty()) return 0.0f
    val length = getHorizontalFadingEdgeLength()
    val rightEdge = width - paddingRight
    val span = scrollContentWidth - scrollX - rightEdge
    return if (span < length) span / length.toFloat() else 1.0f
  }

  override fun computeHorizontalScrollRange(): Int {
    return if (childCount == 0) width else scrollContentWidth
  }

  override fun computeVerticalScrollRange(): Int {
    return if (childCount == 0) height else scrollContentHeight
  }

  override fun requestLayout() {
    isLayoutDirty = true
    super.requestLayout()
  }

  private fun findFocusableViewInMyBounds(
    topFocus: Boolean, top: Int, leftFocus: Boolean, left: Int, preferredFocusable: View?
  ): View? {
    val verticalFadingEdgeLength = getVerticalFadingEdgeLength() / 2
    val topWithoutFadingEdge = top + verticalFadingEdgeLength
    val bottomWithoutFadingEdge = top + height - verticalFadingEdgeLength
    val horizontalFadingEdgeLength = getHorizontalFadingEdgeLength() / 2
    val leftWithoutFadingEdge = left + horizontalFadingEdgeLength
    val rightWithoutFadingEdge = left + width - horizontalFadingEdgeLength

    if (preferredFocusable != null
      && preferredFocusable.top < bottomWithoutFadingEdge
      && preferredFocusable.bottom > topWithoutFadingEdge
      && preferredFocusable.left < rightWithoutFadingEdge
      && preferredFocusable.right > leftWithoutFadingEdge
    ) {
      return preferredFocusable
    }
    return findFocusableViewInBounds(
      topFocus, topWithoutFadingEdge, bottomWithoutFadingEdge,
      leftFocus, leftWithoutFadingEdge, rightWithoutFadingEdge
    )
  }

  private fun findFocusableViewInBounds(
    topFocus: Boolean, top: Int, bottom: Int,
    leftFocus: Boolean, left: Int, right: Int
  ): View? {
    val focusables = getFocusables(FOCUS_FORWARD)
    var focusCandidate: View? = null
    var foundFullyContainedFocusable = false

    for (i in 0 until focusables.size) {
      val view = focusables[i]
      val viewTop = view.top
      val viewBottom = view.bottom
      val viewLeft = view.left
      val viewRight = view.right

      if (top < viewBottom && viewTop < bottom && left < viewRight && viewLeft < right) {
        val viewIsFullyContained = (top < viewTop) && (viewBottom < bottom) && (left < viewLeft) && (viewRight < right)
        if (focusCandidate == null) {
          focusCandidate = view
          foundFullyContainedFocusable = viewIsFullyContained
        } else {
          val viewIsCloserToVerticalBoundary = (topFocus && viewTop < focusCandidate.top) || (!topFocus && viewBottom > focusCandidate.bottom)
          val viewIsCloserToHorizontalBoundary = (leftFocus && viewLeft < focusCandidate.left) || (!leftFocus && viewRight > focusCandidate.right)
          if (foundFullyContainedFocusable) {
            if (viewIsFullyContained && viewIsCloserToVerticalBoundary && viewIsCloserToHorizontalBoundary) {
              focusCandidate = view
            }
          } else {
            if (viewIsFullyContained) {
              focusCandidate = view
              foundFullyContainedFocusable = true
            } else if (viewIsCloserToVerticalBoundary && viewIsCloserToHorizontalBoundary) {
              focusCandidate = view
            }
          }
        }
      }
    }
    return focusCandidate
  }

  fun fullScroll(direction: Int, horizontal: Boolean): Boolean {
    if (!horizontal) {
      val down = direction == FOCUS_DOWN
      val height = getHeight()
      tempRect.top = 0
      tempRect.bottom = height
      if (down) {
        tempRect.bottom = scrollContentHeight
        tempRect.top = tempRect.bottom - height
      }
      return scrollAndFocus(direction, tempRect.top, tempRect.bottom, 0, 0, 0)
    } else {
      val right = direction == FOCUS_DOWN
      val width = getWidth()
      tempRect.left = 0
      tempRect.right = width
      if (right) {
        tempRect.right = scrollContentWidth
        tempRect.left = tempRect.right - width
      }
      return scrollAndFocus(0, 0, 0, direction, tempRect.left, tempRect.right)
    }
  }

  private fun scrollAndFocus(
    directionY: Int, top: Int, bottom: Int, directionX: Int, left: Int, right: Int
  ): Boolean {
    var handled = true
    val height = getHeight()
    val containerTop = scrollY
    val containerBottom = containerTop + height
    val up = directionY == FOCUS_UP
    val width = getWidth()
    val containerLeft = scrollX
    val containerRight = containerLeft + width
    val leftwards = directionX == FOCUS_UP
    var newFocused = findFocusableViewInBounds(up, top, bottom, leftwards, left, right)
    if (newFocused == null) newFocused = this
    if ((top >= containerTop && bottom <= containerBottom) || (left >= containerLeft && right <= containerRight)) {
      handled = false
    } else {
      val deltaY = if (up) (top - containerTop) else (bottom - containerBottom)
      val deltaX = if (leftwards) (left - containerLeft) else (right - containerRight)
      doScroll(deltaX, deltaY)
    }
    if (newFocused !== findFocus() && newFocused.requestFocus(directionY)) {
      twoDScrollViewMovedFocus = true
      twoDScrollViewMovedFocus = false
    }
    return handled
  }

  fun arrowScroll(direction: Int, horizontal: Boolean): Boolean {
    var currentFocused = findFocus()
    if (currentFocused === this) currentFocused = null
    val nextFocused = FocusFinder.getInstance().findNextFocus(this, currentFocused, direction)
    val maxJump = if (horizontal) maxScrollAmountHorizontal else maxScrollAmountVertical

    if (!horizontal) {
      if (nextFocused != null) {
        nextFocused.getDrawingRect(tempRect)
        offsetDescendantRectToMyCoords(nextFocused, tempRect)
        doScroll(0, computeScrollDeltaToGetChildRectOnScreen(tempRect))
        nextFocused.requestFocus(direction)
      } else {
        var scrollDelta = maxJump
        if (direction == FOCUS_UP && scrollY < scrollDelta) {
          scrollDelta = scrollY
        } else if (direction == FOCUS_DOWN && childCount > 0) {
          val screenBottom = scrollY + height
          if (scrollContentHeight - screenBottom < maxJump) {
            scrollDelta = scrollContentHeight - screenBottom
          }
        }
        if (scrollDelta == 0) return false
        doScroll(0, if (direction == FOCUS_DOWN) scrollDelta else -scrollDelta)
      }
    } else {
      if (nextFocused != null) {
        nextFocused.getDrawingRect(tempRect)
        offsetDescendantRectToMyCoords(nextFocused, tempRect)
        doScroll(computeScrollDeltaToGetChildRectOnScreen(tempRect), 0)
        nextFocused.requestFocus(direction)
      } else {
        var scrollDelta = maxJump
        if (direction == FOCUS_UP && scrollX < scrollDelta) {
          scrollDelta = scrollX
        } else if (direction == FOCUS_DOWN && childCount > 0) {
          val screenRight = scrollX + width
          if (scrollContentWidth - screenRight < maxJump) {
            scrollDelta = scrollContentWidth - screenRight
          }
        }
        if (scrollDelta == 0) return false
        doScroll(if (direction == FOCUS_DOWN) scrollDelta else -scrollDelta, 0)
      }
    }
    return true
  }

  private fun doScroll(deltaX: Int, deltaY: Int) {
    if (deltaX != 0 || deltaY != 0) smoothScrollBy(deltaX, deltaY)
  }

  fun smoothScrollBy(dx: Int, dy: Int) {
    val duration = AnimationUtils.currentAnimationTimeMillis() - lastScroll
    if (duration > ANIMATED_SCROLL_GAP) {
      scroller!!.startScroll(scrollX, scrollY, dx, dy)
      awakenScrollBars(SCROLL_ANIMATION_DURATION)
      invalidate()
    } else {
      if (!scroller!!.isFinished) scroller!!.abortAnimation()
      scrollBy(dx, dy)
    }
    lastScroll = AnimationUtils.currentAnimationTimeMillis()
  }

  fun smoothScrollTo(x: Int, y: Int) {
    smoothScrollBy(x - scrollX, y - scrollY)
  }

  private fun scrollToChild(child: View) {
    child.getDrawingRect(tempRect)
    offsetDescendantRectToMyCoords(child, tempRect)
    val scrollDelta = computeScrollDeltaToGetChildRectOnScreen(tempRect)
    if (scrollDelta != 0) scrollBy(0, scrollDelta)
  }

  private fun scrollToChildRect(rect: Rect, immediate: Boolean): Boolean {
    val delta = computeScrollDeltaToGetChildRectOnScreen(rect)
    val scroll = delta != 0
    if (scroll) {
      if (immediate) scrollBy(0, delta) else smoothScrollBy(0, delta)
    }
    return scroll
  }

  protected fun computeScrollDeltaToGetChildRectOnScreen(rect: Rect): Int {
    if (childCount == 0) return 0
    val height = getHeight()
    var screenTop = scrollY
    var screenBottom = screenTop + height
    val fadingEdge = getVerticalFadingEdgeLength()
    if (rect.top > 0) screenTop += fadingEdge
    if (rect.bottom < scrollContentHeight) screenBottom -= fadingEdge
    var scrollYDelta = 0
    if (rect.bottom > screenBottom && rect.top > screenTop) {
      scrollYDelta += if (rect.height() > height) (rect.top - screenTop) else (rect.bottom - screenBottom)
      val distanceToBottom = scrollContentHeight - screenBottom
      scrollYDelta = min(scrollYDelta, distanceToBottom)
    } else if (rect.top < screenTop && rect.bottom < screenBottom) {
      scrollYDelta -= if (rect.height() > height) (screenBottom - rect.bottom) else (screenTop - rect.top)
      scrollYDelta = max(scrollYDelta, -scrollY)
    }
    return scrollYDelta
  }

  override fun requestChildFocus(child: View?, focused: View) {
    if (!twoDScrollViewMovedFocus) {
      if (!isLayoutDirty) scrollToChild(focused)
      else childToScrollTo = focused
    }
    super.requestChildFocus(child, focused)
  }

  override fun requestChildRectangleOnScreen(child: View, rectangle: Rect, immediate: Boolean): Boolean {
    rectangle.offset(child.left - child.scrollX, child.top - child.scrollY)
    return scrollToChildRect(rectangle, immediate)
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    val handled = super.dispatchKeyEvent(event)
    return handled || executeKeyEvent(event)
  }

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    val action = ev.action
    if ((action == MotionEvent.ACTION_MOVE) && isBeingDragged) return true
    if (!canScroll()) {
      isBeingDragged = false
      return false
    }
    val y = ev.y
    val x = ev.x
    when (action) {
      MotionEvent.ACTION_MOVE -> {
        val yDiff = abs(y - lastMotionY).toInt()
        val xDiff = abs(x - lastMotionX).toInt()
        val exceedsY = enableScrollY && yDiff > touchSlop
        val exceedsX = enableScrollX && xDiff > touchSlop
        if (exceedsY || exceedsX) isBeingDragged = true
      }
      MotionEvent.ACTION_DOWN -> {
        lastMotionY = y
        lastMotionX = x
        nestedXOffset = 0
        nestedYOffset = 0
        isBeingDragged = !scroller!!.isFinished
        startNestedScroll(nestedScrollAxes(), ViewCompat.TYPE_TOUCH)
      }
      MotionEvent.ACTION_CANCEL, MotionEvent.ACTION_UP -> {
        isBeingDragged = false
        stopNestedScroll(ViewCompat.TYPE_TOUCH)
      }
    }
    return isBeingDragged
  }

  override fun onRequestFocusInDescendants(direction: Int, previouslyFocusedRect: Rect?): Boolean {
    var direction = direction
    if (direction == FOCUS_FORWARD) direction = FOCUS_DOWN
    else if (direction == FOCUS_BACKWARD) direction = FOCUS_UP
    val nextFocus = if (previouslyFocusedRect == null) FocusFinder.getInstance().findNextFocus(this, null, direction)
    else FocusFinder.getInstance().findNextFocusFromRect(this, previouslyFocusedRect, direction)
    return nextFocus != null && nextFocus.requestFocus(direction, previouslyFocusedRect)
  }

  override fun measureChild(child: View, parentWidthMeasureSpec: Int, parentHeightMeasureSpec: Int) {
    val lp = child.layoutParams
    val childWidthMeasureSpec = getChildMeasureSpec(parentWidthMeasureSpec, paddingLeft + paddingRight, lp.width)
    val childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    child.measure(childWidthMeasureSpec, childHeightMeasureSpec)
  }

  override fun measureChildWithMargins(
    child: View, parentWidthMeasureSpec: Int, widthUsed: Int,
    parentHeightMeasureSpec: Int, heightUsed: Int
  ) {
    val lp = child.layoutParams as MarginLayoutParams
    val childWidthMeasureSpec = MeasureSpec.makeMeasureSpec(lp.leftMargin + lp.rightMargin, MeasureSpec.UNSPECIFIED)
    val childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(lp.topMargin + lp.bottomMargin, MeasureSpec.UNSPECIFIED)
    child.measure(childWidthMeasureSpec, childHeightMeasureSpec)
  }

  private fun isViewDescendantOf(child: View, parent: View?): Boolean {
    if (child === parent) return true
    val theParent = child.parent
    return (theParent is ViewGroup) && isViewDescendantOf(theParent as View, parent)
  }

  fun fling(velocityX: Int, velocityY: Int) {
    if (childCount > 0) {
      val vx = if (enableScrollX) velocityX else 0
      val vy = if (enableScrollY) velocityY else 0

      // Begin a NON_TOUCH nested-scroll pass so the fling can hand off
      // unconsumed momentum to (or borrow it from) a nested parent.
      startNestedScroll(nestedScrollAxes(), ViewCompat.TYPE_NON_TOUCH)
      lastScrollerX = scrollX
      lastScrollerY = scrollY

      scroller!!.fling(
        scrollX, scrollY, vx, vy,
        Int.MIN_VALUE, if (enableScrollX) Int.MAX_VALUE else 0,
        Int.MIN_VALUE, if (enableScrollY) Int.MAX_VALUE else 0,
        if (enableScrollX) overflingDistance else 0,
        if (enableScrollY) overflingDistance else 0
      )

      val movingDown = velocityY > 0
      val movingRight = velocityX > 0

      var newFocused = findFocusableViewInMyBounds(
        movingRight, scroller!!.finalX, movingDown, scroller!!.finalY, findFocus()
      )
      if (newFocused == null) newFocused = this
      if (newFocused !== findFocus() && newFocused.requestFocus(if (movingDown) FOCUS_DOWN else FOCUS_UP)) {
        twoDScrollViewMovedFocus = true
        twoDScrollViewMovedFocus = false
      }

      awakenScrollBars(SCROLL_ANIMATION_DURATION)
      postInvalidateOnAnimation()
    }
  }

  // Paint the overscroll effects, mirroring framework ScrollView edge drawing.
  override fun draw(canvas: Canvas) {
    super.draw(canvas)

    val e = edgeEffects ?: return

    var needInvalidate = false
    val sX = scrollX
    val sY = scrollY

    if (!e.top.isFinished) {
      val restore = canvas.save()
      val w = width - paddingLeft - paddingRight
      canvas.translate(paddingLeft.toFloat(), min(0, sY).toFloat())
      e.top.setSize(w, height)
      if (e.top.draw(canvas)) needInvalidate = true
      canvas.restoreToCount(restore)
    }

    if (!e.bottom.isFinished) {
      val restore = canvas.save()
      val w = width - paddingLeft - paddingRight
      val h = height
      canvas.translate((-w + paddingLeft).toFloat(), (max(getScrollRangeY(), sY) + h).toFloat())
      canvas.rotate(180f, w.toFloat(), 0f)
      e.bottom.setSize(w, h)
      if (e.bottom.draw(canvas)) needInvalidate = true
      canvas.restoreToCount(restore)
    }

    if (!e.left.isFinished) {
      val restore = canvas.save()
      val h = height - paddingTop - paddingBottom
      canvas.rotate(270f)
      canvas.translate((-h + paddingTop).toFloat(), min(0, sX).toFloat())
      e.left.setSize(h, width)
      if (e.left.draw(canvas)) needInvalidate = true
      canvas.restoreToCount(restore)
    }

    if (!e.right.isFinished) {
      val restore = canvas.save()
      val h = height - paddingTop - paddingBottom
      canvas.rotate(90f)
      canvas.translate(-paddingTop.toFloat(), -(max(getScrollRangeX(), sX) + width).toFloat())
      e.right.setSize(h, width)
      if (e.right.draw(canvas)) needInvalidate = true
      canvas.restoreToCount(restore)
    }

    if (needInvalidate) postInvalidateOnAnimation()
  }

  private fun clamp(n: Int, my: Int, child: Int): Int {
    if (my >= child || n < 0) return 0
    if ((my + n) > child) return child - my
    return n
  }

  // region NestedScrollingChild3 — delegate the full contract to the helper.

  override fun setNestedScrollingEnabled(enabled: Boolean) {
    childHelper.isNestedScrollingEnabled = enabled
  }

  override fun isNestedScrollingEnabled(): Boolean = childHelper.isNestedScrollingEnabled

  override fun startNestedScroll(axes: Int): Boolean =
    childHelper.startNestedScroll(axes)

  override fun startNestedScroll(axes: Int, type: Int): Boolean =
    childHelper.startNestedScroll(axes, type)

  override fun stopNestedScroll() = childHelper.stopNestedScroll()

  override fun stopNestedScroll(type: Int) = childHelper.stopNestedScroll(type)

  override fun hasNestedScrollingParent(): Boolean = childHelper.hasNestedScrollingParent()

  override fun hasNestedScrollingParent(type: Int): Boolean =
    childHelper.hasNestedScrollingParent(type)

  override fun dispatchNestedScroll(
    dxConsumed: Int, dyConsumed: Int, dxUnconsumed: Int, dyUnconsumed: Int,
    offsetInWindow: IntArray?
  ): Boolean = childHelper.dispatchNestedScroll(
    dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow
  )

  override fun dispatchNestedScroll(
    dxConsumed: Int, dyConsumed: Int, dxUnconsumed: Int, dyUnconsumed: Int,
    offsetInWindow: IntArray?, type: Int
  ): Boolean = childHelper.dispatchNestedScroll(
    dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow, type
  )

  // NestedScrollingChild3 — consumed-aware dispatch.
  override fun dispatchNestedScroll(
    dxConsumed: Int, dyConsumed: Int, dxUnconsumed: Int, dyUnconsumed: Int,
    offsetInWindow: IntArray?, type: Int, consumed: IntArray
  ) = childHelper.dispatchNestedScroll(
    dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow, type, consumed
  )

  override fun dispatchNestedPreScroll(
    dx: Int, dy: Int, consumed: IntArray?, offsetInWindow: IntArray?
  ): Boolean = childHelper.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow)

  override fun dispatchNestedPreScroll(
    dx: Int, dy: Int, consumed: IntArray?, offsetInWindow: IntArray?, type: Int
  ): Boolean = childHelper.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow, type)

  override fun dispatchNestedFling(velocityX: Float, velocityY: Float, consumed: Boolean): Boolean =
    childHelper.dispatchNestedFling(velocityX, velocityY, consumed)

  override fun dispatchNestedPreFling(velocityX: Float, velocityY: Float): Boolean =
    childHelper.dispatchNestedPreFling(velocityX, velocityY)

  // endregion

  // region NestedScrollingParent3 — host inner scrolling children.

  override fun onStartNestedScroll(child: View, target: View, axes: Int): Boolean =
    onStartNestedScroll(child, target, axes, ViewCompat.TYPE_TOUCH)

  override fun onStartNestedScroll(child: View, target: View, axes: Int, type: Int): Boolean =
    canScroll() && (axes and (ViewCompat.SCROLL_AXIS_HORIZONTAL or ViewCompat.SCROLL_AXIS_VERTICAL)) != 0

  override fun onNestedScrollAccepted(child: View, target: View, axes: Int) =
    onNestedScrollAccepted(child, target, axes, ViewCompat.TYPE_TOUCH)

  override fun onNestedScrollAccepted(child: View, target: View, axes: Int, type: Int) {
    parentHelper.onNestedScrollAccepted(child, target, axes, type)
    // Become a nested child ourselves so the chain continues outward.
    startNestedScroll(axes, type)
  }

  override fun onStopNestedScroll(target: View) = onStopNestedScroll(target, ViewCompat.TYPE_TOUCH)

  override fun onStopNestedScroll(target: View, type: Int) {
    parentHelper.onStopNestedScroll(target, type)
    stopNestedScroll(type)
  }

  override fun getNestedScrollAxes(): Int = parentHelper.nestedScrollAxes

  // Pre-scroll as a parent: we don't pre-consume from our child here (the
  // child scrolls first); just forward the opportunity to our own parent.
  override fun onNestedPreScroll(target: View, dx: Int, dy: Int, consumed: IntArray, type: Int) {
    dispatchNestedPreScroll(dx, dy, consumed, null, type)
  }

  override fun onNestedScroll(
    target: View, dxConsumed: Int, dyConsumed: Int, dxUnconsumed: Int, dyUnconsumed: Int, type: Int
  ) {
    // Pre-NestedScrollingParent3 signature — route through the consumed-aware
    // path with a throwaway buffer.
    onNestedScroll(target, dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, type, intArrayOf(0, 0))
  }

  // NestedScrollingParent3 — consume the child's leftover, then bubble up.
  override fun onNestedScroll(
    target: View, dxConsumed: Int, dyConsumed: Int, dxUnconsumed: Int, dyUnconsumed: Int,
    type: Int, consumed: IntArray
  ) {
    scrollByClamped(dxUnconsumed, dyUnconsumed, scrollConsumed)
    val myConsumedX = scrollConsumed[0]
    val myConsumedY = scrollConsumed[1]
    consumed[0] += myConsumedX
    consumed[1] += myConsumedY
    // Forward whatever neither the child nor we could take to our own parent.
    dispatchNestedScroll(
      dxConsumed + myConsumedX, dyConsumed + myConsumedY,
      dxUnconsumed - myConsumedX, dyUnconsumed - myConsumedY,
      null, type, consumed
    )
  }

  override fun onNestedPreFling(target: View, velocityX: Float, velocityY: Float): Boolean =
    dispatchNestedPreFling(velocityX, velocityY)

  override fun onNestedFling(
    target: View, velocityX: Float, velocityY: Float, consumed: Boolean
  ): Boolean {
    if (!consumed && childCount > 0) {
      dispatchNestedFling(velocityX, velocityY, true)
      fling(velocityX.toInt(), velocityY.toInt())
      return true
    }
    return false
  }

  // endregion

  interface ScrollChangeListener {
    fun onScrollChanged(view: View?, x: Int, y: Int, oldx: Int, oldy: Int)
  }

  companion object {
    const val ANIMATED_SCROLL_GAP: Int = 250
    const val SCROLL_ANIMATION_DURATION: Int = 250
    const val MAX_SCROLL_FACTOR: Float = 0.5f
  }
}
