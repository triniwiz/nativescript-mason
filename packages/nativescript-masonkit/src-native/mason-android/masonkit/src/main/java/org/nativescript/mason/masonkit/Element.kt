package org.nativescript.mason.masonkit

import android.util.SizeF
import android.view.View
import androidx.core.view.isGone
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Overflow

interface Element {
  val style: Style

  val node: Node

  fun syncStyle(state: String, textState: String) {
    val stateValue = state.toLongOrNull()?.takeIf { it > -1 }
    val textStateValue = textState.toLongOrNull()?.takeIf { it > -1 }

    textStateValue?.let { textStateValue ->
      val value = TextStateKeys(textStateValue)
      style.setOrAppendState(value)
    }

    stateValue?.let { stateValue ->
      style.isDirty = stateValue
      style.updateNativeStyle()
    }
  }

  fun onNodeAttached() {}

  fun onNodeDetached() {}

  fun markNodeDirty() {
    node.dirty()
  }

  fun isNodeDirty(): Boolean {
    return node.isDirty()
  }

  fun configure(block: (Style) -> Unit) {
    style.inBatch = true
    block(style)
    style.inBatch = false
  }

  val view: View

  fun layout(): Layout {
    if (node.nativePtr == 0L) {
      return Layout.empty
    }
    val layouts = NativeHelpers.nativeNodeLayout(node.mason.nativePtr, node.nativePtr)
    if (layouts.isEmpty()) {
      return Layout.empty
    }
    return Layout.fromFloatArray(layouts, 0).second
  }

  fun compute() {
    NativeHelpers.nativeNodeCompute(node.mason.nativePtr, node.nativePtr)
    node.computeCache = SizeF(-2f, -2f)
  }

  fun compute(width: Float, height: Float) {
    NativeHelpers.nativeNodeComputeWH(node.mason.nativePtr, node.nativePtr, width, height)
    node.computeCache = SizeF(width, height)
  }

  fun computeMaxContent() {
    NativeHelpers.nativeNodeComputeMaxContent(node.mason.nativePtr, node.nativePtr)
    node.computeCache = SizeF(-2f, -2f)
  }

  fun computeMinContent() {
    node.computeCache = SizeF(-2f, -2f)
    NativeHelpers.nativeNodeComputeMinContent(node.mason.nativePtr, node.nativePtr)
  }

  fun computeWithViewSize() {
    val width = view.width.toFloat()
    val height = view.height.toFloat()
    compute(width, height)
    node.computeCache = SizeF(width, height)
  }

  fun computeAndLayout(): Layout {
    return Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeAndLayout(
        node.mason.nativePtr,
        node.nativePtr,
      ), 0
    ).second
  }

  fun computeAndLayout(width: Float, height: Float): Layout {
    return Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeWithSizeAndLayout(
        node.mason.nativePtr,
        node.nativePtr,
        width, height
      ), 0
    ).second
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
    applyLayoutRecursive(node, layout())
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
      attributes.sync(style)
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

    if (root.type == NodeType.Document) {
      // If root is document, use documentElement to compute

      root.document?.documentElement?.compute(
        root.computeCache.width,
        root.computeCache.height
      )

      root.document?.documentElement?.view?.invalidate()
      root.document?.documentElement?.view?.requestLayout()
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

    (root.view as? View)?.let {
      if (invalidateRoot) {
        root.dirty()
      }
      it.invalidate()
      it.requestLayout()
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

internal fun Element.applyLayoutRecursive(node: Node, layout: Layout) {
  node.computedLayout = layout

  if (node.type != NodeType.Element) {
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

      // Determine final layout dimensions based on overflow
      val layoutWidth = when (overflow.x) {
        Overflow.Visible -> maxOf(width, contentWidth)
        Overflow.Scroll, Overflow.Auto -> width // scrollable, use box size
        Overflow.Hidden, Overflow.Clip -> width // clipped, use box size
      }

      val layoutHeight = when (overflow.y) {
        Overflow.Visible -> maxOf(height, contentHeight)
        Overflow.Scroll, Overflow.Auto -> height // scrollable, use box size
        Overflow.Hidden, Overflow.Clip -> height // clipped, use box size
      }

      val right = x + layoutWidth
      val bottom = y + layoutHeight

      // only set padding on a text element
      if (view is TextContainer) {
        view.setPadding(
          layout.padding.left.toInt(),
          layout.padding.top.toInt(),
          layout.padding.right.toInt(),
          layout.padding.bottom.toInt()
        )
      }

      if (view is org.nativescript.mason.masonkit.View && view.isScrollRoot) {
        if (this !== view.parent) {
          (view.parent as? View)?.layout(x, y, right, bottom)
        }
        // For scroll root, layout at 0,0 with content dimensions
        view.layout(
          0,
          0,
          when (overflow.x) {
            Overflow.Scroll, Overflow.Auto -> contentWidth
            else -> layoutWidth
          },
          when (overflow.y) {
            Overflow.Scroll, Overflow.Auto -> contentHeight
            else -> layoutHeight
          }
        )
      } else {
        view.layout(x, y, right, bottom)
      }
    }
  }

  if (layout.children.isNotEmpty()) {
    val children = node.children.filter {
      if (it.nativePtr == 0L) {
        false
      } else if (node.parent?.view is TextContainer && node.view is TextContainer) {
        val flatten =
          (node.parent?.view as TextContainer).engine.shouldFlattenTextContainer(node.view as TextContainer)
        !flatten
      } else {
        true
      }
    }

    for (i in 0 until children.count()) {
      val child = children[i]
      if (child.type == NodeType.Text) {
        continue
      }
      val layoutChild = layout.children[i]
      applyLayoutRecursive(child, layoutChild)
    }
  }
}
