package org.nativescript.mason.masonkit

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.view.View
import android.view.ViewGroup

import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Position

internal object MasonPositioning {

  // Never repositions children itself, unlike NativeScript's page GridLayout.
  private class FixedOverlay(context: Context) : ViewGroup(context) {
    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {}
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
      setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
    }
  }

  private fun Context.findActivity(): Activity? {
    var ctx = this
    while (ctx is ContextWrapper) {
      if (ctx is Activity) return ctx
      ctx = ctx.baseContext
    }
    return null
  }

  private fun rootOf(node: Node): Node {
    var current = node
    while (current.parent != null) {
      current = current.parent!!
    }
    return current
  }

  // `view is Scroll` is true for plain divs too (Scroll doubles as a generic container); check overflow instead.
  private fun isScrollContainer(view: View): Boolean {
    val element = view as? Element ?: return false
    val overflow = element.style.overflow
    return overflow.x == Overflow.Scroll || overflow.x == Overflow.Auto || overflow.y == Overflow.Scroll || overflow.y == Overflow.Auto
  }

  // fixed's containing block: a full-screen overlay at the Activity's content root.
  private fun fixedHost(node: Node): ViewGroup? {
    val rootView = rootOf(node).view as? View ?: return null
    val activity = rootView.context.findActivity() ?: return null
    val decorContent = activity.findViewById<ViewGroup>(android.R.id.content) ?: return null
    (decorContent.getTag() as? FixedOverlay)?.let { return it }
    val overlay = FixedOverlay(decorContent.context)
    decorContent.addView(overlay, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    decorContent.tag = overlay
    return overlay
  }

  // Sum of left/top offsets from `view` up to `host`; scrollX/Y doesn't affect left/top, so this ignores scrolling.
  private fun accumulateOrigin(baseX: Int, baseY: Int, view: View, host: View): Pair<Int, Int> {
    var x = baseX
    var y = baseY
    var current = view.parent as? View
    while (current != null && current !== host) {
      x += current.left
      y += current.top
      current = current.parent as? View
    }
    return x to y
  }

  // Reparents to the fixed host once, then rewrites (x,y) from root-relative to the host's space.
  fun applyFixed(node: Node, view: View, x: Int, y: Int): Pair<Int, Int> {
    val host = fixedHost(node) ?: return x to y
    val rootView = rootOf(node).view as? View ?: return x to y
    if (view.parent !== host) {
      if (node.fixedOriginalParent == null) {
        node.fixedOriginalParent = view.parent as? ViewGroup
      }
      (view.parent as? ViewGroup)?.removeView(view)
      host.addView(view)
    } else {
      host.bringChildToFront(view)
    }
    val (originX, originY) = accumulateOrigin(rootView.left, rootView.top, rootView, host)
    return (originX + x) to (originY + y)
  }

  // Undoes applyFixed once a node stops being fixed.
  fun clearPositioning(node: Node, view: View) {
    node.stickyScrollHost = null
    val original = node.fixedOriginalParent
    if (original != null) {
      node.fixedOriginalParent = null
      if (view.parent !== original) {
        (view.parent as? ViewGroup)?.removeView(view)
        original.addView(view)
      }
    }
  }

  // Walks the native parent chain, not Mason's node-parent chain, which other mounted screens can corrupt.
  private fun nearestScrollAncestor(view: View): Scroll? {
    var current = view.parent as? View
    while (current != null) {
      if (isScrollContainer(current)) {
        (current as? Scroll)?.let { return it }
      }
      current = current.parent as? View
    }
    return null
  }

  private fun resolvedInset(v: LengthPercentageAuto, dimension: Int): Int? {
    return when (v) {
      is LengthPercentageAuto.Auto -> null
      is LengthPercentageAuto.Zero -> 0
      is LengthPercentageAuto.Points -> v.points.toInt()
      is LengthPercentageAuto.Percent -> (dimension * v.percentage).toInt()
    }
  }

  // Captures a sticky node's natural position, registers it, and returns its current offset.
  fun captureSticky(node: Node, view: View, x: Int, y: Int, width: Int, height: Int): Pair<Int, Int> {
    val host = nearestScrollAncestor(view)
    val parentView = view.parent as? View
    if (host == null || parentView == null) {
      node.stickyScrollHost = null
      node.isStickyEngaged = false
      return x to y
    }

    node.stickyLocalX = x
    node.stickyLocalY = y
    val (naturalX, naturalY) = accumulateOrigin(x, y, view, host)
    node.stickyNaturalX = naturalX
    node.stickyNaturalY = naturalY
    node.stickyWidth = width
    node.stickyHeight = height
    val (cbX, cbY) = accumulateOrigin(parentView.left, parentView.top, parentView, host)
    node.stickyCbLeft = cbX
    node.stickyCbTop = cbY
    node.stickyCbRight = cbX + parentView.width
    node.stickyCbBottom = cbY + parentView.height
    node.stickyScrollHost = host

    host.registerSticky(view)

    val (dx, dy) = stickyDelta(node, host)
    updateEngagement(node, view, dx, dy)
    return (x + dx) to (y + dy)
  }

  // Called on scroll: recomputes every registered sticky descendant's offset.
  fun recomputeSticky(scrollHost: Scroll, descendants: Collection<View>) {
    for (view in descendants.toList()) {
      val element = view as? Element ?: continue
      val node = element.node
      if (node.style.position != Position.Sticky || node.stickyScrollHost !== scrollHost) continue
      val (dx, dy) = stickyDelta(node, scrollHost)
      val newX = node.stickyLocalX + dx
      val newY = node.stickyLocalY + dy
      if (view.left != newX || view.top != newY) {
        view.layout(newX, newY, newX + view.width, newY + view.height)
      }
      updateEngagement(node, view, dx, dy)
    }
  }

  // Shift off natural position to hold the inset, clamped within the containing block.
  private fun stickyDelta(node: Node, host: Scroll): Pair<Int, Int> {
    val viewportLeft = host.scrollX
    val viewportTop = host.scrollY
    val viewportRight = viewportLeft + host.width
    val viewportBottom = viewportTop + host.height
    val naturalX = node.stickyNaturalX
    val naturalY = node.stickyNaturalY
    val size = node.stickyWidth to node.stickyHeight
    val inset = node.style.inset
    val cbHeight = node.stickyCbBottom - node.stickyCbTop
    val cbWidth = node.stickyCbRight - node.stickyCbLeft

    var dy = 0
    val top = resolvedInset(inset.top, cbHeight)
    val bottom = resolvedInset(inset.bottom, cbHeight)
    if (top != null) {
      val minY = viewportTop + top
      if (naturalY < minY) dy = minY - naturalY
    } else if (bottom != null) {
      val maxY = viewportBottom - bottom - size.second
      if (naturalY > maxY) dy = maxY - naturalY
    }
    val minDy = node.stickyCbTop - naturalY
    val maxDy = node.stickyCbBottom - size.second - naturalY
    dy = dy.coerceIn(minOf(minDy, maxDy), maxOf(minDy, maxDy))

    var dx = 0
    val left = resolvedInset(inset.left, cbWidth)
    val right = resolvedInset(inset.right, cbWidth)
    if (left != null) {
      val minX = viewportLeft + left
      if (naturalX < minX) dx = minX - naturalX
    } else if (right != null) {
      val maxX = viewportRight - right - size.first
      if (naturalX > maxX) dx = maxX - naturalX
    }
    val minDx = node.stickyCbLeft - naturalX
    val maxDx = node.stickyCbRight - size.first - naturalX
    dx = dx.coerceIn(minOf(minDx, maxDx), maxOf(minDx, maxDx))

    return dx to dy
  }

  private fun updateEngagement(node: Node, view: View, dx: Int, dy: Int) {
    val engaged = dx != 0 || dy != 0
    if (engaged != node.isStickyEngaged) {
      node.isStickyEngaged = engaged
      if (engaged) {
        (view.parent as? ViewGroup)?.bringChildToFront(view)
      }
    }
  }
}
