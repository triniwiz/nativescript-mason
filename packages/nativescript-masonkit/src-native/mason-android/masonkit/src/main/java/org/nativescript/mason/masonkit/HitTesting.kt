package org.nativescript.mason.masonkit

import android.view.View
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.Overflow

internal object HitTesting {
  private fun contains(view: View, x: Float, y: Float): Boolean {
    return x >= 0f && x < view.width && y >= 0f && y < view.height
  }

  private fun childPoint(parent: ViewGroup, child: View, x: Float, y: Float): FloatArray {
    val point = floatArrayOf(
      x + parent.scrollX - child.left,
      y + parent.scrollY - child.top
    )
    val matrix = child.matrix
    if (!matrix.isIdentity) {
      val inverse = android.graphics.Matrix()
      if (matrix.invert(inverse)) {
        inverse.mapPoints(point)
      }
    }
    return point
  }

  private fun clipsAxis(value: Overflow, contentExtent: Float, viewExtent: Int): Boolean {
    return when (value) {
      Overflow.Hidden, Overflow.Scroll, Overflow.Clip -> true
      Overflow.Auto -> contentExtent > viewExtent
      else -> false
    }
  }

  private fun clippedOutside(view: View, x: Float, y: Float): Boolean {
    val element = view as? Element ?: return !contains(view, x, y)
    // clip-path clips the element and its subtree, hit testing included.
    if (element.style.mClipPath?.contains(view, x, y) == false) return true
    if (!element.style.isValueInitialized) return false

    val overflow = element.style.overflow
    val clipsX = clipsAxis(overflow.x, element.node.overflowWidth.toFloat(), view.width)
    val clipsY = clipsAxis(overflow.y, element.node.overflowHeight.toFloat(), view.height)

    return (clipsX && (x < 0f || x >= view.width)) || (clipsY && (y < 0f || y >= view.height))
  }

  private fun zSortedChildren(parent: ViewGroup): List<View> {
    return (0 until parent.childCount)
      .map { index -> parent.getChildAt(index) to index }
      .sortedWith(
        compareBy<Pair<View, Int>> {
          val element = it.first as? Element
          if (element == null || element.node.nativePtr == 0L || !element.style.isValueInitialized) {
            0
          } else {
            element.style.zIndex
          }
        }.thenBy { it.second }
      )
      .map { it.first }
  }

  fun elementFromPoint(root: View, x: Float, y: Float): View? {
    return hitTest(root, x, y, null)
  }

  /** Whether a descendant of [view] takes a touch at (x, y): a pointer-events: none element passes the rest through. */
  fun childTakesPoint(view: View, x: Float, y: Float): Boolean {
    if (view !is ViewGroup) return false
    val children = zSortedChildren(view)
    for (i in children.size - 1 downTo 0) {
      val child = children[i]
      val point = childPoint(view, child, x, y)
      if (hitTest(child, point[0], point[1], null) != null) return true
    }
    return false
  }

  /** The node a pointer at (x, y) in [root] targets: the element under it, or the inline element a text view draws there. */
  fun pointerTarget(root: View, x: Float, y: Float): Node? {
    val point = FloatArray(2)
    val hit = hitTest(root, x, y, point) ?: return null
    var view: View? = hit
    while (view != null && view !is Element) {
      if (view === root) return null
      view = view.parent as? View
    }
    val element = view as? Element ?: return null
    var node: Node? = (if (view === hit && view is TextView) view.inlineNodeAt(point[0], point[1]) else null) ?: element.node
    while (node != null && node.pointerEvents == PointerEvents.NONE) node = node.parent
    return node
  }

  private fun takesPointer(view: View): Boolean =
    (view as? Element)?.node?.pointerEvents != PointerEvents.NONE

  private fun hitTest(view: View, x: Float, y: Float, point: FloatArray?): View? {
    if (view.visibility != View.VISIBLE || view.width <= 0 || view.height <= 0) return null
    if (clippedOutside(view, x, y)) return null

    if (view is ViewGroup) {
      val children = zSortedChildren(view)
      for (i in children.size - 1 downTo 0) {
        val child = children[i]
        val childPoint = childPoint(view, child, x, y)
        val hit = hitTest(child, childPoint[0], childPoint[1], point)
        if (hit != null) return hit
      }
    }

    if (!contains(view, x, y) || !takesPointer(view)) return null
    point?.let {
      it[0] = x
      it[1] = y
    }
    return view
  }
}
