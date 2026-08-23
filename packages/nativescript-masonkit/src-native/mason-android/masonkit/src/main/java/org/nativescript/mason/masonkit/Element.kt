package org.nativescript.mason.masonkit

import android.os.Build
import android.util.Log
import android.util.SizeF
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.view.isGone
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.events.Event
import java.util.UUID

interface Element : EventTarget {
  val style: Style

  override val node: Node

  var innerHTML: String
    get() {
      return ""
    }
    set(value) {
      node.mason.getHtmlParser(view.context)?.parseInto(value, this)
    }

  override fun addEventListener(type: String, listener: (Event) -> Unit): UUID {
    val id = node.mason.addEventListener(node, type, listener)
    if (type == "click" && !node.hasNativeClickDispatch) {
      node.hasNativeClickDispatch = true
      view.isClickable = true
      view.setOnClickListener {
        dispatch(
          Event(type = "click").apply {
            target = this@Element
          }
        )
      }
    }
    return id
  }

  // Reconstructs the two 64-bit dirty-mask halves from four signed 32-bit
  // words (see style.ts's splitBigIntToInt32Parts) - bit-exact, avoids the
  // decimal-string encode/parse round trip the old syncStyle(String, String)
  // overload used on every single style write.
  fun syncStyleParts(lowLow: Int, lowHigh: Int, highLow: Int, highHigh: Int) {
    val low = (lowHigh.toLong() shl 32) or (lowLow.toLong() and 0xFFFFFFFFL)
    val high = (highHigh.toLong() shl 32) or (highLow.toLong() and 0xFFFFFFFFL)
    syncStyle(low, high)
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
    if (mason.inCompute) return // re-entrant compute → skip to avoid Rust RWLock deadlock
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
    if (mason.inCompute) return // re-entrant compute → skip to avoid Rust RWLock deadlock
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
    if (mason.inCompute) return // re-entrant compute → skip to avoid Rust RWLock deadlock
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
    if (mason.inCompute) return // re-entrant compute → skip to avoid Rust RWLock deadlock
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
    if (mason.inCompute) return node.layoutTree // re-entrant compute → skip to avoid Rust RWLock deadlock
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
    Log.w("MASON_DIAG2", "computeAndLayout(w,h) CALLED node=${node.nativePtr} w=$width h=$height cacheDirty=${node.computeCacheDirty} cacheW=${node.computeCache.width} cacheH=${node.computeCache.height} treeCount=${node.layoutTree.nodeCount}")
    val mason = node.mason
    if (mason.inCompute) {
      Log.w("MASON_DIAG2", "  -> SKIPPED (inCompute)")
      return node.layoutTree // nested compute → skip to avoid Rust RWLock deadlock
    }

    // Fast-path: if compute cache already contains the requested size,
    // cache is clean, and we have a valid layout tree, skip the native
    // compute to avoid redundant recomputation on spurious layout passes
    // (e.g. triggered by setPadding → requestLayout in applyLayoutFlat).
    if (!node.computeCacheDirty
      && node.computeCache.width == width
      && node.computeCache.height == height
      && node.layoutTree.nodeCount > 0
    ) {
      Log.w("MASON_DIAG2", "  -> SKIPPED (cache hit)")
      return node.layoutTree
    }

    Log.w("MASON_DIAG2", "  -> RUNNING native compute")
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


  fun append(elements: List<*>) {
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
    elements.forEach {
      when (it) {
        is Element -> {
          append(it)
        }

        is String -> {
          append(it)
        }

        is Node -> {
          append(it)
        }

      }
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(false)
    }
  }

  fun append(texts: Array<String>) {
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
    texts.forEach { append(it) }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(false)
    }
  }

  fun append(elements: Array<Element>) {
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
    elements.forEach { append(it) }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(false)
    }
  }

  fun append(nodes: Array<Node>) {
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
    nodes.forEach { append(it) }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(false)
    }
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
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
    strings.reversed().forEach { prepend(it) }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(false)
    }
  }

  fun prepend(elements: Array<Element>) {
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
    elements.reversed().forEach { prepend(it) }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(false)
    }
  }

  fun prepend(nodes: Array<Node>) {
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
    nodes.reversed().forEach { prepend(it) }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(false)
    }
  }

  fun invalidateLayout() {
    invalidateLayout(false)
  }

  fun invalidateLayout(invalidateRoot: Boolean) {
    node.dirty()
    val root = node.getRootNode() ?: node

    // Ensure the ROOT node's computeCacheDirty is true so that the
    // fast-path cache check in computeAndLayout() (which only inspects the
    // root's flag) doesn't return a stale layout tree.  node.dirty() only
    // sets the flag on the child whose style changed; Rust propagates dirty
    // marks internally but the Kotlin-side cache on the root stays clean
    // unless we explicitly mark it here.
    if (root !== node) {
      root.computeCacheDirty = true
    }

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

    if (!root.computeScheduled) {
      root.computeScheduled = true
      // Schedule a single requestLayout on the next animation frame to
      // coalesce rapid invalidations.  The previous approach ran compute()
      // (without serialization) here, which set computeCacheDirty=false and
      // poisoned the cache that computeAndLayout() relies on — causing it
      // to return a stale layout tree.  By only requesting a layout pass we
      // let computeAndLayout() (called from onMeasure) do the compute AND
      // serialize the layout in one shot, giving applyLayoutFlat correct data.
      targetView.postOnAnimation {
        root.computeScheduled = false
        if (root.type == NodeType.Document) {
          root.document?.documentElement?.let { docEl ->
            docEl.compute(
              if (root.computeCache.width == Float.MIN_VALUE) -2f else root.computeCache.width,
              if (root.computeCache.height == Float.MIN_VALUE) -2f else root.computeCache.height
            )
            docEl.view?.invalidate()
            docEl.view?.requestLayout()
          }
          return@postOnAnimation
        }
        // For normal Element roots, just request a full layout pass.
        // computeCacheDirty is still true (set by node.dirty() above),
        // so computeAndLayout() in onMeasure will recompute + serialize.
        (root.view as? View)?.requestLayout()
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
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
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
    val vg = (view as? ViewGroup)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      vg?.suppressLayout(true)
    }
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
        attributes.sync(this@Element.node.style)
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
        attributes.sync(this@Element.node.style)
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

  // Remove a specific child node (e.g. the TextNode a framework stamped onto its
  // JS text node) without needing its index. Node.removeChild handles both
  // TextNode and element children.
  fun removeChild(node: Node) {
    this.node.removeChild(node)
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

// Flat layout tree application (iterative DFS, zero-allocation per pass)

// Preallocated stack frame to avoid Pair allocations in DFS
private class LayoutStackFrame {
  var treeIdx = 0
  var node: Node? = null
}

// One DFS traversal's stack + position. Pooled per re-entrancy depth (see
// below) rather than per-call, so normal (non-reentrant) passes still pay
// zero allocation cost after warmup.
private class LayoutDfsState {
  val stack = ArrayList<LayoutStackFrame>(32)
  var top = -1
}

// applyLayoutFlat can re-enter itself: a child's view.measure()/view.layout()
// call below can synchronously trigger another top-level layout pass
// elsewhere in the tree (e.g. a nested Scroll/Input, or Android deciding a
// sibling also needs a fresh traversal) before this DFS finishes. A single
// shared stack+index used to corrupt the outer call's traversal: the inner
// call reset the shared top to -1 and overwrote in-flight frames, so the
// outer while loop below saw a negative top and exited early having laid
// out only part of its subtree — permanently leaving the rest of that
// fixture/screen stuck with stale or default (zero) geometry, since nothing
// ever re-drives a layout pass for nodes a truncated DFS never reached.
// Each re-entrancy depth now gets its own independent pooled state instead
// of sharing one.
private val dfsStatePool = ArrayList<LayoutDfsState>()
private var dfsDepth = 0

private fun acquireDfsState(): LayoutDfsState {
  val state = if (dfsDepth < dfsStatePool.size) {
    dfsStatePool[dfsDepth]
  } else {
    val s = LayoutDfsState()
    dfsStatePool.add(s)
    s
  }
  state.top = -1
  dfsDepth++
  return state
}

private fun releaseDfsState() {
  dfsDepth--
}

private fun pushFrame(state: LayoutDfsState, treeIdx: Int, node: Node) {
  state.top++
  val frame: LayoutStackFrame
  if (state.top < state.stack.size) {
    frame = state.stack[state.top]
  } else {
    frame = LayoutStackFrame()
    state.stack.add(frame)
  }
  frame.treeIdx = treeIdx
  frame.node = node
}

private fun popFrame(state: LayoutDfsState): LayoutStackFrame {
  val frame = state.stack[state.top]
  state.top--
  return frame
}

internal fun Element.applyLayoutFlat(rootNode: Node, tree: MasonLayoutTree) {
  if (tree.nodeCount == 0) return

  val nv = tree.cursor
  val dfs = acquireDfsState()
  try {
    pushFrame(dfs, 0, rootNode)

    while (dfs.top >= 0) {
      val frame = popFrame(dfs)
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
          val rootPadLeft = nv.paddingLeft.toInt()
          val rootPadTop = nv.paddingTop.toInt()
          val rootPadRight = nv.paddingRight.toInt()
          val rootPadBottom = nv.paddingBottom.toInt()
          if (view is TextContainer) {
            val rootBL = nv.borderLeft.toInt()
            val rootBT = nv.borderTop.toInt()
            val rootBR = nv.borderRight.toInt()
            val rootBB = nv.borderBottom.toInt()
            val tL = rootPadLeft + rootBL
            val tT = rootPadTop + rootBT
            val tR = rootPadRight + rootBR
            val tB = rootPadBottom + rootBB
            if (view.paddingLeft != tL || view.paddingTop != tT || view.paddingRight != tR || view.paddingBottom != tB) {
              view.setPadding(tL, tT, tR, tB)
            }
          } else if (view is Scroll || view is ListView) {
            // Ensure scroll roots receive padding for correct scroll/clamp behaviour
          //  view.setPadding(rootPadLeft, rootPadTop, rootPadRight, rootPadBottom)
          }
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
          val padLeft = nv.paddingLeft.toInt()
          val padTop = nv.paddingTop.toInt()
          val padRight = nv.paddingRight.toInt()
          val padBottom = nv.paddingBottom.toInt()
          if (view is TextContainer) {
            // CSS positions content at border + padding from the view edge.
            // Android's setPadding controls where text draws, so include
            // the border width so text renders inside the border boundary.
            val bL = nv.borderLeft.toInt()
            val bT = nv.borderTop.toInt()
            val bR = nv.borderRight.toInt()
            val bB = nv.borderBottom.toInt()
            val totalLeft = padLeft + bL
            val totalTop = padTop + bT
            val totalRight = padRight + bR
            val totalBottom = padBottom + bB
            if (view.paddingLeft != totalLeft || view.paddingTop != totalTop || view.paddingRight != totalRight || view.paddingBottom != totalBottom) {
              view.setPadding(totalLeft, totalTop, totalRight, totalBottom)
            }
          } else if (view is Scroll || view is ListView) {
            // Scroll and list containers rely on Android padding for content sizing/clamping
           // view.setPadding(padLeft, padTop, padRight, padBottom)
          }

          // P14: skip the measure()/layout() pair when this view's frame
          // already matches the target - same equality-guard pattern already
          // used for setPadding() above. Safe for Scroll/Input/generic Element
          // views: their children are walked by this function's own DFS
          // (pushed below from `tree.childIndices`), not by a nested
          // applyLayoutFlat re-triggered from onLayout, so skipping the
          // Android-side measure/layout call here doesn't skip any of Mason's
          // own child processing for them.
          //
          // Li is excluded: its onLayout unconditionally calls
          // `applyLayoutFlat(node, node.layoutTree)` against its OWN separate
          // layout tree (RecyclerView items aren't part of the parent's flat
          // tree, since RecyclerView virtualizes/recycles them) - that nested
          // call is the only thing that drives Li's own children, so it must
          // still fire on every pass regardless of whether Li's own frame
          // changed. Any other view type with a similar own-layoutTree-via-
          // onLayout pattern would need the same exclusion.
          val skipMeasureAndLayout = view !is Li &&
            view.measuredWidth == layoutWidth && view.measuredHeight == layoutHeight &&
            view.left == x && view.top == y && view.right == right && view.bottom == bottom

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

            // Enable scroll axes based on overflow style + content exceeding viewport.
            // updateScrollState() in Scroll.onLayout won't run when the Scroll's own
            // layoutTree is empty (parent owns the layout tree), so set these here.
            view.enableScrollX = overflowX == Overflow.Scroll.value ||
              (overflowX == Overflow.Auto.value && scrollCW > layoutWidth)
            view.enableScrollY = overflowY == Overflow.Scroll.value ||
              (overflowY == Overflow.Auto.value && scrollCH > layoutHeight)

            if (!skipMeasureAndLayout) {
              view.measure(
                MeasureSpec.makeMeasureSpec(layoutWidth, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(layoutHeight, MeasureSpec.EXACTLY)
              )
              view.layout(x, y, right, bottom)
            }

          } else if (view is Input) {
            if (!skipMeasureAndLayout) {
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
            }
          } else {
            if (!skipMeasureAndLayout) {
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
          pushFrame(dfs, childTreeIdx, child)
        }
      }
    }
  } finally {
    releaseDfsState()
  }
}
