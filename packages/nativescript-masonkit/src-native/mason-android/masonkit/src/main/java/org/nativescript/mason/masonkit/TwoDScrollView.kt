package org.nativescript.mason.masonkit

import android.content.Context
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
import android.widget.FrameLayout
import android.widget.Scroller
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
open class TwoDScrollView : FrameLayout {

  private val tempRect = Rect()

  private var lastScroll: Long = 0

  private var scroller: Scroller? = null

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
    scroller = Scroller(getContext())
    isFocusable = true
    descendantFocusability = FOCUS_AFTER_DESCENDANTS
    setWillNotDraw(false)
    val configuration = ViewConfiguration.get(getContext())
    touchSlop = configuration.scaledTouchSlop
    minimumVelocity = configuration.scaledMinimumFlingVelocity
    maximumVelocity = configuration.scaledMaximumFlingVelocity
  }

  private fun canScroll(): Boolean {
    return (height < scrollContentHeight + paddingTop + paddingBottom)
      || (width < scrollContentWidth + paddingLeft + paddingRight)
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
    if (!canScroll()) return false

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
      }

      MotionEvent.ACTION_MOVE -> {
        var deltaX = (lastMotionX - x).toInt()
        var deltaY = (lastMotionY - y).toInt()
        lastMotionX = x
        lastMotionY = y

        if (enableScrollX) {
          if (deltaX < 0) {
            if (scrollX < 0) deltaX = 0
          } else if (deltaX > 0) {
            val rightEdge = width - paddingRight
            val availableToScroll = scrollContentWidth - scrollX - rightEdge
            deltaX = if (availableToScroll > 0) min(availableToScroll, deltaX) else 0
          }
        } else {
          deltaX = 0
        }

        if (enableScrollY) {
          if (deltaY < 0) {
            if (scrollY < 0) deltaY = 0
          } else if (deltaY > 0) {
            val bottomEdge = height - paddingBottom
            val availableToScroll = scrollContentHeight - scrollY - bottomEdge
            deltaY = if (availableToScroll > 0) min(availableToScroll, deltaY) else 0
          }
        }
        if (deltaY != 0 || deltaX != 0) scrollBy(deltaX, deltaY)
      }

      MotionEvent.ACTION_UP -> {
        val vt = velocityTracker
        vt!!.computeCurrentVelocity(1000, maximumVelocity.toFloat())
        val initialXVelocity = vt.xVelocity.toInt()
        val initialYVelocity = vt.yVelocity.toInt()
        if ((abs(initialXVelocity) + abs(initialYVelocity) > minimumVelocity) && childCount > 0) {
          fling(-initialXVelocity, -initialYVelocity)
        }
        if (velocityTracker != null) {
          velocityTracker!!.recycle()
          velocityTracker = null
        }
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
    if (scroller!!.computeScrollOffset()) {
      val oldX = scrollX
      val oldY = scrollY
      val x = scroller!!.currX
      val y = scroller!!.currY
      if (childCount > 0) {
        scrollTo(
          clamp(x, width - paddingRight - paddingLeft, scrollContentWidth),
          clamp(y, height - paddingBottom - paddingTop, scrollContentHeight)
        )
      } else {
        scrollTo(x, y)
      }
      if (oldX != scrollX || oldY != scrollY) {
        onScrollChanged(scrollX, scrollY, oldX, oldY)
      }
      postInvalidate()
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
      awakenScrollBars(scroller!!.duration)
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
        if (yDiff > touchSlop || xDiff > touchSlop) isBeingDragged = true
      }
      MotionEvent.ACTION_DOWN -> {
        lastMotionY = y
        lastMotionX = x
        isBeingDragged = !scroller!!.isFinished
      }
      MotionEvent.ACTION_CANCEL, MotionEvent.ACTION_UP -> isBeingDragged = false
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
      val viewportHeight = height - paddingBottom - paddingTop
      val viewportWidth = width - paddingRight - paddingLeft

      scroller!!.fling(
        scrollX, scrollY, velocityX, velocityY,
        0, maxOf(scrollContentWidth - viewportWidth, 0),
        0, maxOf(scrollContentHeight - viewportHeight, 0)
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

      awakenScrollBars(scroller!!.duration)
      invalidate()
    }
  }

  private fun clamp(n: Int, my: Int, child: Int): Int {
    if (my >= child || n < 0) return 0
    if ((my + n) > child) return child - my
    return n
  }

  interface ScrollChangeListener {
    fun onScrollChanged(view: View?, x: Int, y: Int, oldx: Int, oldy: Int)
  }

  companion object {
    const val ANIMATED_SCROLL_GAP: Int = 250
    const val MAX_SCROLL_FACTOR: Float = 0.5f
  }
}
