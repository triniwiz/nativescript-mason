package org.nativescript.mason.masonkit

import android.util.SizeF
import android.view.View
import android.view.View.MeasureSpec
import androidx.core.view.isGone
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Overflow

interface Element : EventTarget {
  val style: Style

  override val node: Node

  fun syncStyle(low: String, high: String) {
    fun parseDecimalToLong(s: String): Long? {
      if (s.isEmpty()) return null
      return try {
        java.lang.Long.parseUnsignedLong(s)
      } catch (_: NumberFormatException) {
        try {
          java.math.BigInteger(s).toLong()
        } catch (_: Exception) {
          null
        }
      }
    }

    val low = parseDecimalToLong(low)
    val high = parseDecimalToLong(high)

    if (low != null || high != null) {
      syncStyle(low ?: 0L, high ?: 0L)
    }
  }

  fun syncStyle(low: Long, high: Long) {
    style.setStateFromHalves(low, high)
  }

  fun onNodeAttached() {}

  fun onNodeDetached() {}

  fun markNodeDirty() {
    node.dirty()
  }

  fun isNodeDirty(): Boolean {
    return node.isDirty()
  }

  fun configure(block: (Style) -> Unit): Element {
    style.inBatch = true
    block(style)
    style.inBatch = false
    return this
  }

  val view: View

  fun layoutFlat(): MasonLayoutTree {
    if (node.nativePtr == 0L) {
      return MasonLayoutTree.empty
    }
    if (node.mason.inCompute) {
      return node.layoutTree
    }
    val layouts = NativeHelpers.nativeNodeLayout(node.mason.nativePtr, node.nativePtr)
    if (layouts.isEmpty()) {
      return MasonLayoutTree.empty
    }
    node.layoutTree.fromFloatArray(layouts)
    return node.layoutTree
  }

  fun compute() {
    val mason = node.mason
    if (mason.inCompute) return // nested compute → skip to avoid Rust RWLock deadlock
    mason.inCompute = true
    try {
      NativeHelpers.nativeNodeCompute(mason.nativePtr, node.nativePtr)
    } finally {
      mason.inCompute = false
    }
    node.computeCache = SizeF(-2f, -2f)
    node.computeCacheDirty = false // compute just ran — cache is clean
  }

  fun compute(width: Float, height: Float) {
    // Fast-path: if compute cache already contains the requested size and
    // cache is clean, skip the native compute to avoid redundant work and
    // repeated max-content (-2 x -2) cycles caused by races.
    if (!node.computeCacheDirty && node.computeCache.width == width && node.computeCache.height == height) {
      // cache hit — skip native compute
      return
    }

    val mason = node.mason
    if (mason.inCompute) return // nested compute → skip to avoid Rust RWLock deadlock
    mason.inCompute = true
    try {
      NativeHelpers.nativeNodeComputeWH(mason.nativePtr, node.nativePtr, width, height)
    } finally {
      mason.inCompute = false
    }
    node.computeCache = SizeF(width, height)
    node.computeCacheDirty = false // compute just ran — cache is clean
  }

  fun computeMaxContent() {
    val mason = node.mason
    if (mason.inCompute) return // nested compute → skip to avoid Rust RWLock deadlock
    mason.inCompute = true
    try {
      NativeHelpers.nativeNodeComputeMaxContent(mason.nativePtr, node.nativePtr)
    } finally {
      mason.inCompute = false
    }
    node.computeCache = SizeF(-2f, -2f)
    node.computeCacheDirty = false // compute just ran — cache is clean
  }

  fun computeMinContent() {
    val mason = node.mason
    if (mason.inCompute) return // nested compute → skip to avoid Rust RWLock deadlock
    mason.inCompute = true
    try {
      NativeHelpers.nativeNodeComputeMinContent(mason.nativePtr, node.nativePtr)
    } finally {
      mason.inCompute = false
    }
    node.computeCache = SizeF(-2f, -2f)
    node.computeCacheDirty = false // compute just ran — cache is clean
  }

  fun computeWithViewSize() {
    val width = view.width.toFloat()
    val height = view.height.toFloat()
    compute(width, height)
    node.computeCache = SizeF(width, height)
    node.computeCacheDirty = false // compute just ran — cache is clean
  }

  fun computeAndLayout(): MasonLayoutTree {
    val mason = node.mason
    if (mason.inCompute) return node.layoutTree // nested compute → skip to avoid Rust RWLock deadlock
    mason.inCompute = true
    try {
      val layout = NativeHelpers.nativeNodeComputeAndLayout(mason.nativePtr, node.nativePtr)
      if (layout.isEmpty()) {
        return MasonLayoutTree.empty
      }
      node.layoutTree.fromFloatArray(layout)
    } finally {
      mason.inCompute = false
      node.computeCache = SizeF(-1f, -1f)
      node.computeCacheDirty = false // compute just ran — cache is clean
    }
    return node.layoutTree
  }

  /**
   * Compatibility helper used by tests: perform a compute+layout and
   * return a `Layout` (recursive) representation of the root.
   */
  fun layout(): Layout {
    val mason = node.mason
    val floats = NativeHelpers.nativeNodeComputeAndLayout(mason.nativePtr, node.nativePtr)
    if (floats.isEmpty()) return Layout.empty
    return Layout.fromFloatArray(floats, 0).second
  }

  fun computeAndLayout(width: Float, height: Float): MasonLayoutTree {
    val mason = node.mason
    if (mason.inCompute) return node.layoutTree // nested compute → skip to avoid Rust RWLock deadlock

    // Fast-path: if compute cache already contains the requested size,
    // cache is clean, and we have a valid layout tree, skip the native
    // compute to avoid redundant recomputation on spurious layout passes
    // (e.g. triggered by setPadding → requestLayout in applyLayoutFlat).
    if (!node.computeCacheDirty
      && node.computeCache.width == width
      && node.computeCache.height == height
      && node.layoutTree.nodeCount > 0
    ) {
      return node.layoutTree
    }

    mason.inCompute = true
    try {
      val layout = NativeHelpers.nativeNodeComputeWithSizeAndLayout(
        mason.nativePtr,
        node.nativePtr,
        width,
        height
      )
      if (layout.isEmpty()) {
        return MasonLayoutTree.empty
      }
      node.layoutTree.fromFloatArray(layout)
    } finally {
      mason.inCompute = false
      node.computeCache = SizeF(width, height)
      node.computeCacheDirty = false // compute just ran — cache is clean
    }
    return node.layoutTree
  }

  fun computeWithSize(width: Float, height: Float) {
    compute(width, height)
    attachAndApply()
  }

  fun computeWithViewSize(layout: Boolean) {
    computeWithViewSize()
    if (layout) {
      attachAndApply()
    }
  }

  fun computeWithMaxContent() {
    computeMaxContent()
    attachAndApply()
  }

  fun computeWithMinContent() {
    computeMinContent()
    attachAndApply()
  }

  fun attachAndApply() {
    applyLayoutFlat(node, layoutFlat())
  }

  fun append(element: Element) {
    node.appendChild(element.node)
  }

  fun append(text: String) {
    val textNode = TextNode(node.mason).apply {
      data = text
      if (this@Element is TextContainer) {
        container = this@Element
      }
    }
    node.appendChild(textNode)

    textNode.apply {
      attributes.sync(this@Element.style)
    }
  }

  fun append(node: Node) {
    this.node.appendChild(node)
  }

  fun append(texts: Array<String>) {
    texts.forEach { append(it) }
  }

  fun append(elements: Array<Element>) {
    elements.forEach { append(it) }
  }

  fun append(nodes: Array<Node>) {
    nodes.forEach { append(it) }
  }

  fun prepend(element: Element) {
    node.addChildAt(element.node, 0)
  }

  fun prepend(string: String) {
    val textNode = TextNode(node.mason).apply {
      data = string
      if (this@Element is TextContainer) {
        container = this@Element
      }
    }
    node.addChildAt(textNode, 0)

    textNode.apply {
      if (this@Element is TextContainer) {
        // Copy current TextView attributes to the new text node
        attributes.sync(style)
      }
    }
  }

  fun prepend(node: Node) {
    this.node.addChildAt(node, 0)
  }

  fun prepend(strings: Array<String>) {
    strings.reversed().forEach { prepend(it) }
  }

  fun prepend(elements: Array<Element>) {
    elements.reversed().forEach { prepend(it) }
  }

  fun prepend(nodes: Array<Node>) {
    nodes.reversed().forEach { prepend(it) }
  }

  fun invalidateLayout() {
    invalidateLayout(false)
  }

  fun invalidateLayout(invalidateRoot: Boolean) {
    node.dirty()
    val root = node.getRootNode() ?: node

    // Debounce/schedule expensive compute work to the next UI loop/frame
    val targetView = when {
      root.type == NodeType.Document -> root.document?.documentElement?.view
      else -> root.view as? View
    }

    // If no view is available, fallback to immediately compute
    if (targetView == null) {
      if (root.type == NodeType.Document) {
        root.document?.documentElement?.compute(root.computeCache.width, root.computeCache.height)
      } else if (root.view is Element && root.computeCacheDirty) {
        // MIN_VALUE sentinel means we’ve never computed before; treat as
        // unconstrained (max-content) rather than min-content so the initial
        // async compute doesn’t collapse the layout to zero.
        val width = if (root.computeCache.width == Float.MIN_VALUE) -2f else root.computeCache.width
        val height =
          if (root.computeCache.height == Float.MIN_VALUE) -2f else root.computeCache.height
        (root.view as Element).compute(width, height)
      }
      return
    }

    if (invalidateRoot) {
      root.dirty()
    }

    // Schedule a one‑shot compute on the view's message queue to coalesce rapid invalidations.
    // We no longer gate on `node.mason.inCompute` – if a view is attached we always
    // post a runnable (unless one is already scheduled).  This keeps layout work
    // off the caller thread, batches rapid calls and avoids re‑entrancy.  Only when
    // there is *no* view available do we compute synchronously as a fallback.

    fun doCompute() {
      if (root.type == NodeType.Document) {
        root.document?.documentElement?.compute(
          if (root.computeCache.width == Float.MIN_VALUE) -2f else root.computeCache.width,
          if (root.computeCache.height == Float.MIN_VALUE) -2f else root.computeCache.height
        )
        root.document?.documentElement?.view?.invalidate()
        root.document?.documentElement?.view?.requestLayout()
        return
      }

      if (root.view is Element && root.computeCacheDirty) {
        var width = if (root.computeCache.width == Float.MIN_VALUE) -2f else root.computeCache.width
        var height =
          if (root.computeCache.height == Float.MIN_VALUE) -2f else root.computeCache.height

        // if the existing cache value was the max-content sentinel and the view
        // already has a real size, switch to the view dimensions.  also update
        // the stored cache immediately so callers can observe the change.
        targetView.let { v ->
          // Prefer the Mason node's computed layout when available (most authoritative).
          val nodeW = root.computedWidth
          val nodeH = root.computedHeight

          if (width == -2f) {
            if (!nodeW.isNaN() && nodeW > 0f) {
              width = nodeW
            } else if (v.measuredWidth > 0) {
              width = v.measuredWidth.toFloat()
            }
          }

          if (height == -2f) {
            if (!nodeH.isNaN() && nodeH > 0f) {
              height = nodeH
            } else if (v.measuredHeight > 0) {
              height = v.measuredHeight.toFloat()
            }
          }

          root.computeCache = SizeF(width, height)
        }

        val cachedW = root.cachedWidth
        val cachedH = root.cachedHeight
        val nodeW2 = root.computedWidth
        val nodeH2 = root.computedHeight

        if (cachedW > 0f && cachedH > 0f) {
          root.computeCache = SizeF(cachedW, cachedH)
          root.computeCacheDirty = false
          return
        }

        if (!nodeW2.isNaN() && !nodeH2.isNaN() && nodeW2 > 0f && nodeH2 > 0f) {
          root.computeCache = SizeF(nodeW2, nodeH2)
          root.computeCacheDirty = false
          return
        }

        (root.view as Element).compute(width, height)
      }
    }

    if (!root.computeScheduled) {
      root.computeScheduled = true
      // Always post compute to the view's message queue to coalesce rapid
      // invalidations and allow JNI write-backs (setComputedSize) to arrive
      // before we decide whether to run another native compute. Executing
      // synchronously here caused repeated immediate `native_compute_wh`
      // calls in tight sequences.
      targetView.post {
        try {
          root.computeScheduled = false
          doCompute()
          // Single invalidate+requestLayout at the end — doCompute early
          // returns no longer duplicate this, avoiding redundant traversals.
          (root.view as? View)?.let { v ->
            v.invalidate()
            v.requestLayout()
          }
        } catch (_: Throwable) {
          // swallow to avoid crashing from posted task
        }
      }
    }
  }

  fun recomputeRoot() {
    val root = node.getRootNode() ?: node

    if (root.type == NodeType.Document) {
      // If root is document, use documentElement to compute

      root.document?.documentElement?.compute(
        root.computeCache.width,
        root.computeCache.height
      )
      return
    }

    // Otherwise use the topmost element (root)
    if (root.view is Element && root.computeCacheDirty) {
      val width = if (root.computeCache.width == Float.MIN_VALUE) {
        -1f
      } else {
        root.computeCache.width
      }

      val height = if (root.computeCache.height == Float.MIN_VALUE) {
        -1f
      } else {
        root.computeCache.height
      }
      (root.view as Element).compute(width, height)
    }
  }


  fun appendView(view: View) {
    val child = node.mason.nodeForView(view)
    append(child)
  }

  fun appendView(views: Array<View>) {
    // todo use a single jni call
    views.forEach {
      appendView(it)
    }

  }

  fun prependView(view: View) {
    val child = node.mason.nodeForView(view)
    prepend(child)
  }

  fun prependView(views: Array<View>) {
    // todo use a single jni call
    views.reversed().forEach { prependView(it) }
  }

  fun addChildAt(text: String, index: Int) {
    val child = TextNode(node.mason).apply {
      data = text
      if (this@Element is TextContainer) {
        container = this@Element
      }
    }
    node.addChildAt(child, index)
    child.apply {
      if (this@Element is TextContainer) {
        // Copy current TextView attributes to the new text node
        attributes.sync(style)
      }
    }
  }

  fun addChildAt(element: Element, index: Int) {
    node.addChildAt(element.node, index)
  }

  fun addChildAt(node: Node, index: Int) {
    this.node.addChildAt(node, index)
  }

  fun replaceChildAt(text: String, index: Int) {
    val child = TextNode(node.mason).apply {
      data = text
      if (this@Element is TextContainer) {
        container = this@Element
      }
    }
    node.replaceChildAt(child, index)

    child.apply {
      data = text
      if (this@Element is TextContainer) {
        // Copy current TextView attributes to the new text node
        attributes.sync(style)
      }
    }
  }

  fun replaceChildAt(element: Element, index: Int) {
    node.replaceChildAt(element.node, index)
  }

  fun replaceChildAt(node: Node, index: Int) {
    this.node.replaceChildAt(node, index)
  }

  fun removeChildAt(index: Int) {
    node.removeChildAt(index)
  }

}
/*
internal fun Element.applyLayoutRecursive(node: Node, layout: Layout) {
  node.computedLayout = layout

  if (node.type != NodeType.Element) {
    return
  }

  if (node.view is Br.FakeView) {
    return
  }

  (node.view as? View)?.let { view ->
    if (view != this) {
      if (view.isGone) {
        return
      }
      var overflow: Point<Overflow> = Point(Overflow.Visible, Overflow.Visible)
      var boxing = BoxSizing.BorderBox
      if (node.style.isValueInitialized) {
        boxing = node.style.boxSizing
        overflow = node.style.overflow
      }

      val x = layout.x.takeIf { !it.isNaN() }?.toInt() ?: 0
      val y = layout.y.takeIf { !it.isNaN() }?.toInt() ?: 0

      var width = layout.width.takeIf { !it.isNaN() }?.toInt() ?: 0
      var height = layout.height.takeIf { !it.isNaN() }?.toInt() ?: 0

      if (view !is Element) {
        // measured already grab dim
        width = view.measuredWidth
        height = view.measuredHeight
      }

      // Calculate content size (what's inside the box)
      val contentWidth = if (boxing == BoxSizing.BorderBox) {
        layout.width.toInt()
      } else {
        layout.contentSize.width.toInt()
      }

      val contentHeight = if (boxing == BoxSizing.BorderBox) {
        layout.height.toInt()
      } else {
        layout.contentSize.height.toInt()
      }

      // Store overflow dimensions for scrolling
      node.overflowWidth = contentWidth
      node.overflowHeight = contentHeight

      // Determine final layout dimensions based on overflow.  per the CSS
      // spec, overflow (including `visible`) never changes the size of the
      // element's box – it only affects how the contents are clipped or
      // scrolled.  siblings should not be affected by over‑spilling children.
      val layoutWidth = width
      val layoutHeight = height

      val right = x + layoutWidth
      val bottom = y + layoutHeight

      // apply padding on the native view so that scroll roots and other
      // containers honor CSS padding when laying out their children.  we used
      // to do this only for text/list views because they also needed an
      // explicit measure pass, but the padding is generally harmless and
      // important for scrollable elements.
      view.setPadding(
        layout.padding.left.toInt(),
        layout.padding.top.toInt(),
        layout.padding.right.toInt(),
        layout.padding.bottom.toInt()
      )

      // For TextContainer and ListView views, explicitly measure with EXACTLY specs.
      // The MasonView parent never calls child.measure() — it applies layout
      // directly via applyLayoutRecursive.  Without this, measuredWidth/Height
      // stay 0 and Android may skip drawing the view.
      if (view is TextContainer || view is ListView) {
        view.measure(
          MeasureSpec.makeMeasureSpec(layoutWidth, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(layoutHeight, MeasureSpec.EXACTLY)
        )
      }

      if (view is Scroll) {
        // Scroll is a single-view container — position at its box dimensions
        // and update content dimensions for scroll-range calculations.
        val scrollCW = if (overflow.x == Overflow.Scroll || overflow.x == Overflow.Auto) {
          maxOf(layout.contentSize.width.toInt(), layoutWidth)
        } else {
          layoutWidth
        }
        val scrollCH = if (overflow.y == Overflow.Scroll || overflow.y == Overflow.Auto) {
          maxOf(layout.contentSize.height.toInt(), layoutHeight)
        } else {
          layoutHeight
        }
        view.scrollContentWidth = scrollCW
        view.scrollContentHeight = scrollCH
        view.layout(x, y, right, bottom)
      } else {
        val lx = x.coerceIn(Int.MIN_VALUE, Int.MAX_VALUE)
        val ty = y.coerceIn(Int.MIN_VALUE, Int.MAX_VALUE)
        val rx = right.coerceIn(Int.MIN_VALUE, Int.MAX_VALUE)
        val by = bottom.coerceIn(Int.MIN_VALUE, Int.MAX_VALUE)
        view.layout(lx, ty, rx, by)
      }
    }
  }

  if (layout.children.isNotEmpty()) {
    // Only filter out nodes that don't exist in the native layout (nativePtr == 0).
    // Do NOT remove flattened text containers here — indices must stay aligned
    // with layout.children from Rust.
    val children = node.children.filter { it.nativePtr != 0L }

    for (i in 0 until children.count()) {
      val child = children.getOrNull(i) ?: continue
      if (child.type == NodeType.Text) {
        continue
      }

      // Skip flattened text containers — parent draws their text
      if (child.parent?.view is TextContainer && child.view is TextContainer) {
        val flatten =
          (child.parent?.view as TextContainer).engine.shouldFlattenTextContainer(child.view as TextContainer)
        if (flatten) {
          // Ensure the flattened view occupies no space
          (child.view as? View)?.layout(0, 0, 0, 0)
          continue
        }
      }

      val layoutChild = layout.children.getOrNull(i) ?: continue
      applyLayoutRecursive(child, layoutChild)
    }
  }
}

*/

// MARK: - Flat layout tree application (iterative DFS, zero-allocation per pass)

// Preallocated stack frame to avoid Pair allocations in DFS
private class LayoutStackFrame {
  var treeIdx = 0
  var node: Node? = null
}

// Pool of stack frames — grown once, reused every pass
private val layoutStack = ArrayList<LayoutStackFrame>(32)
private var layoutStackTop = -1

private fun pushFrame(treeIdx: Int, node: Node) {
  layoutStackTop++
  val frame: LayoutStackFrame
  if (layoutStackTop < layoutStack.size) {
    frame = layoutStack[layoutStackTop]
  } else {
    frame = LayoutStackFrame()
    layoutStack.add(frame)
  }
  frame.treeIdx = treeIdx
  frame.node = node
}

private fun popFrame(): LayoutStackFrame {
  val frame = layoutStack[layoutStackTop]
  layoutStackTop--
  return frame
}

internal fun Element.applyLayoutFlat(rootNode: Node, tree: MasonLayoutTree) {
  if (tree.nodeCount == 0) return

  val nv = tree.cursor
  layoutStackTop = -1
  pushFrame(0, rootNode)

  while (layoutStackTop >= 0) {
    val frame = popFrame()
    val treeIdx = frame.treeIdx
    val node = frame.node!!
    frame.node = null // release ref

    nv.pointTo(treeIdx)

    // Store layout tree index on node for external access
    node.layoutTreeIndex = treeIdx
    if (node.type != NodeType.Element) continue
    if (node.view is Br.FakeView) continue

    (node.view as? View)?.let { view ->
      if (view == this) {
        // Root node: set padding so scroll-range clamping in
        // TwoDScrollView.scrollTo uses the correct content-box size.
        view.setPadding(
          nv.paddingLeft.toInt(),
          nv.paddingTop.toInt(),
          nv.paddingRight.toInt(),
          nv.paddingBottom.toInt()
        )
        // Skip positioning — the root is sized by its parent.
      } else {
        if (view.isGone) return@let

        var overflowX = Overflow.Visible.value
        var overflowY = Overflow.Visible.value
        var boxing = BoxSizing.BorderBox.value
        if (node.style.isValueInitialized) {
          boxing = node.style.values.get(StyleKeys.BOX_SIZING)
          overflowX = node.style.values.get(StyleKeys.OVERFLOW_X)
          overflowY = node.style.values.get(StyleKeys.OVERFLOW_Y)
        }

        val x = nv.x.takeIf { !it.isNaN() }?.toInt() ?: 0
        val y = nv.y.takeIf { !it.isNaN() }?.toInt() ?: 0

        var width = nv.width.takeIf { !it.isNaN() }?.toInt() ?: 0
        var height = nv.height.takeIf { !it.isNaN() }?.toInt() ?: 0

        if (view !is Element) {
          width = view.measuredWidth
          height = view.measuredHeight
        }

        val contentWidth = if (boxing == BoxSizing.BorderBox.value) {
          nv.width.toInt()
        } else {
          nv.contentWidth.toInt()
        }

        val contentHeight = if (boxing == BoxSizing.BorderBox.value) {
          nv.height.toInt()
        } else {
          nv.contentHeight.toInt()
        }

        node.overflowWidth = contentWidth
        node.overflowHeight = contentHeight

        // CSS spec: overflow does **not** change the size of the element’s box.
        // visible/auto/scroll/hidden/clip all use the width/height computed by the
        // layout algorithm; only the drawing (clipping/scrolling) differs.
        // `overflowWidth`/`overflowHeight` are stored separately and used during
        // painting or when behaving as a scroll root.
        val layoutWidth = width
        val layoutHeight = height

        val right = x + layoutWidth
        val bottom = y + layoutHeight

        // set padding on every view; scroll roots and other containers rely
        // on Android's padding values when performing scroll/clamp logic.

        view.setPadding(
          nv.paddingLeft.toInt(),
          nv.paddingTop.toInt(),
          nv.paddingRight.toInt(),
          nv.paddingBottom.toInt()
        )

        if (view is Scroll) {
          // Scroll is a single-view container: position it at the box
          // dimensions (viewport) and update its content dimensions for
          // scroll-range calculations.
          val scrollCW = when (overflowX) {
            Overflow.Clip.value, Overflow.Hidden.value -> nv.width.toInt()
            Overflow.Auto.value -> if (nv.contentWidth > nv.width) nv.contentWidth.toInt() else nv.width.toInt()
            else -> maxOf(nv.contentWidth.toInt(), nv.width.toInt())
          }
          val scrollCH = when (overflowY) {
            Overflow.Clip.value, Overflow.Hidden.value -> nv.height.toInt()
            Overflow.Auto.value -> if (nv.contentHeight > nv.height) nv.contentHeight.toInt() else nv.height.toInt()
            else -> maxOf(nv.contentHeight.toInt(), nv.height.toInt())
          }
          view.scrollContentWidth = scrollCW
          view.scrollContentHeight = scrollCH

          view.measure(
            MeasureSpec.makeMeasureSpec(layoutWidth, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(layoutHeight, MeasureSpec.EXACTLY)
          )
          view.layout(x, y, right, bottom)

        } else if (view is Input) {
          view.measure(
            MeasureSpec.makeMeasureSpec(
              layoutWidth, MeasureSpec.EXACTLY
            ),
            MeasureSpec.makeMeasureSpec(
              layoutHeight, MeasureSpec.EXACTLY
            )
          )
          view.layout(x, y, right, bottom)
          view.layoutChild(0, 0, width, height)
        } else {
          view.measure(
            MeasureSpec.makeMeasureSpec(
              layoutWidth, MeasureSpec.EXACTLY
            ),
            MeasureSpec.makeMeasureSpec(
              layoutHeight, MeasureSpec.EXACTLY
            )
          )
          view.layout(x, y, right, bottom)
        }

      }
    }

    // Push children in reverse order for correct left-to-right processing.
    // Use the filtered native children list so indices align with the
    // layout.children provided by Rust (which omits nodes without native views).
    val childCnt = tree.childCount[treeIdx]
    if (childCnt > 0) {
      val nativeChildren = node.children.filter { it.nativePtr != 0L }
      val childStart = tree.childStart[treeIdx]
      for (i in (0 until childCnt).reversed()) {
        val child = nativeChildren.getOrNull(i) ?: continue
        if (child.type == NodeType.Text) continue

        if (child.parent?.view is TextContainer && child.view is TextContainer) {
          val flatten =
            (child.parent?.view as TextContainer).engine.shouldFlattenTextContainer(child.view as TextContainer)
          if (flatten) {
            (child.view as? View)?.measure(
              MeasureSpec.makeMeasureSpec(0, MeasureSpec.EXACTLY),
              MeasureSpec.makeMeasureSpec(0, MeasureSpec.EXACTLY)
            )
            continue
          }
        }

        val childTreeIdx = tree.childIndices[childStart + i]
        pushFrame(childTreeIdx, child)
      }
    }
  }
}
