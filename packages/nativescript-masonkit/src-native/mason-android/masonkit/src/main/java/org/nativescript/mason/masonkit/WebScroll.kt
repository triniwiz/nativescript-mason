package org.nativescript.mason.masonkit

import android.graphics.Rect
import android.view.ViewGroup
import kotlin.math.max
import kotlin.math.roundToInt
import android.view.View as AndroidView

/** Element scroll offsets, sizes and scrolling, in device pixels. */
object WebScroll {
  @JvmStatic
  fun scrollLeft(view: AndroidView): Float = (view as? TwoDScrollView)?.scrollX?.toFloat() ?: 0f

  @JvmStatic
  fun scrollTop(view: AndroidView): Float = (view as? TwoDScrollView)?.scrollY?.toFloat() ?: 0f

  /** The padding box (scrollbars overlay, so they take no room). */
  @JvmStatic
  fun clientWidth(view: AndroidView): Float {
    flushPendingLayout(view)
    return clientWidthOf(view)
  }

  @JvmStatic
  fun clientHeight(view: AndroidView): Float {
    flushPendingLayout(view)
    return clientHeightOf(view)
  }

  // On a scrolling axis, scrollTop + clientHeight == scrollHeight at the end.
  @JvmStatic
  fun scrollWidth(view: AndroidView): Float {
    flushPendingLayout(view)
    val client = clientWidthOf(view)
    if (view is TwoDScrollView && view.enableScrollX) return client + view.maxScrollX
    val node = (view as? Element)?.node ?: return client
    return max(client, node.computedContentWidth.orZero())
  }

  @JvmStatic
  fun scrollHeight(view: AndroidView): Float {
    flushPendingLayout(view)
    val client = clientHeightOf(view)
    if (view is TwoDScrollView && view.enableScrollY) return client + view.maxScrollY
    val node = (view as? Element)?.node ?: return client
    return max(client, node.computedContentHeight.orZero())
  }

  /**
   * Scrolls to [x]/[y] (NaN keeps that axis), clamped to the scroll range. Before the view is
   * laid out, the request waits for its next layout pass.
   */
  @JvmStatic
  fun scrollTo(view: AndroidView, x: Float, y: Float, smooth: Boolean) {
    val scroller = view as? TwoDScrollView ?: return
    scroller.setPendingScroll(x, y, smooth)
    if (flushPendingLayout(view) && view.isLaidOut) {
      scroller.applyPendingScroll()
    } else {
      // In case no layout pass comes: retry once layout is current.
      view.post { if (scroller.hasPendingScroll && flushPendingLayout(view) && view.isLaidOut) scroller.applyPendingScroll() }
    }
  }

  /**
   * Scrolls each Mason scroll container above [view] so it shows.
   * [block]/[inline]: 0 start, 1 center, 2 end, 3 nearest.
   */
  @JvmStatic
  fun scrollIntoView(view: AndroidView, block: Int, inline: Int, smooth: Boolean) {
    flushPendingLayout(view)
    val rect = Rect()
    // How far the planned inner scrolls move the view in outer containers.
    var shiftX = 0
    var shiftY = 0
    val plan = ArrayList<Triple<TwoDScrollView, Int, Int>>()
    var outermost: AndroidView = view
    var parent = view.parent
    while (parent is Element && parent is AndroidView) {
      val host: AndroidView = parent
      outermost = host
      if (host is TwoDScrollView && (host.enableScrollX || host.enableScrollY)) {
        view.getDrawingRect(rect)
        host.offsetDescendantRectToMyCoords(view, rect)
        rect.offset(-shiftX, -shiftY)
        val node = (host as Element).node
        val bl = node.computedBorderLeft.orZero()
        val bt = node.computedBorderTop.orZero()
        val portW = host.width - bl - node.computedBorderRight.orZero()
        val portH = host.height - bt - node.computedBorderBottom.orZero()
        val toX = align(rect.left.toFloat(), rect.width().toFloat(), host.scrollX + bl, portW, host.scrollX, inline)
          .roundToInt().coerceIn(0, host.maxScrollX)
        val toY = align(rect.top.toFloat(), rect.height().toFloat(), host.scrollY + bt, portH, host.scrollY, block)
          .roundToInt().coerceIn(0, host.maxScrollY)
        if (toX != host.scrollX || toY != host.scrollY) {
          plan.add(Triple(host, toX, toY))
          shiftX += toX - host.scrollX
          shiftY += toY - host.scrollY
        }
      }
      parent = host.parent
    }
    for ((host, x, y) in plan) host.webScrollTo(x, y, smooth)
    // A host scroll view outside the Mason tree scrolls to it too.
    view.getDrawingRect(rect)
    if (outermost !== view) (outermost as ViewGroup).offsetDescendantRectToMyCoords(view, rect)
    // Instant scrolls already moved the view; smooth ones haven't yet.
    if (smooth) rect.offset(-shiftX, -shiftY)
    outermost.requestRectangleOnScreen(rect, !smooth)
  }

  /** The offset that aligns [start, start + size) in the scrollport per [mode]. */
  private fun align(start: Float, size: Float, portStart: Float, portSize: Float, offset: Int, mode: Int): Float {
    val end = start + size
    val portEnd = portStart + portSize
    return when (mode) {
      0 -> offset + start - portStart
      1 -> offset + (start + size / 2) - (portStart + portSize / 2)
      2 -> offset + end - portEnd
      // CSSOM "nearest".
      else -> when {
        start < portStart && end > portEnd -> offset.toFloat()
        (start < portStart && size <= portSize) || (end > portEnd && size > portSize) -> offset + start - portStart
        (start < portStart && size > portSize) || (end > portEnd && size <= portSize) -> offset + end - portEnd
        else -> offset.toFloat()
      }
    }
  }

  private fun clientWidthOf(view: AndroidView): Float {
    val node = (view as? Element)?.node
    val width = if (view.width > 0 || node == null) view.width.toFloat() else node.computedWidth.orZero()
    if (node == null) return width
    return max(0f, width - node.computedBorderLeft.orZero() - node.computedBorderRight.orZero())
  }

  private fun clientHeightOf(view: AndroidView): Float {
    val node = (view as? Element)?.node
    val height = if (view.height > 0 || node == null) view.height.toFloat() else node.computedHeight.orZero()
    if (node == null) return height
    return max(0f, height - node.computedBorderTop.orZero() - node.computedBorderBottom.orZero())
  }

  /**
   * Runs a pending layout pass now, as geometry reads do on the web. Returns false when layout
   * is still out of date (detached, never measured, or mid-layout).
   */
  private fun flushPendingLayout(view: AndroidView): Boolean {
    val element = view as? Element ?: return true
    val root = element.node.getRootNode() ?: element.node
    if (root.type == NodeType.Document) return true
    if (!root.computeCacheDirty) return true
    if (root.mason.inCompute || root.lastRootWidthArg == Float.MIN_VALUE) return false
    val rootElement = root.view as? Element ?: return false
    val rootView = rootElement.view
    if (!rootView.isAttachedToWindow || rootView.isInLayout) return false
    rootElement.computeAndLayout(root.lastRootWidthArg, root.lastRootHeightArg)
    rootElement.applyLayoutFlat(root, root.layoutTree)
    (view as? Scroll)?.updateScrollState()
    return !root.computeCacheDirty
  }
}

private fun Float.orZero(): Float = if (isNaN()) 0f else this
