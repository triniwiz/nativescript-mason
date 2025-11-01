package org.nativescript.mason.masonkit

import android.util.Log
import android.util.SizeF
import android.view.View
import androidx.core.view.isGone

interface Element {
  val style: Style

  val node: Node

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
    Mason.shared.printTree(node)
  }

  fun append(element: Element) {
    node.appendChild(element.node)
  }

  fun append(text: String) {
    val textNode = TextNode(node.mason).apply {
      data = text
      if (this@Element is TextView) {
        container = this@Element
        attributes.clear()
        // Copy current TextView attributes to the new text node
        attributes.putAll(getDefaultAttributes())
      }
    }
    node.appendChild(textNode)
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
      if (this@Element is TextView) {
        container = this@Element
        // Copy current TextView attributes to the new text node
        attributes.clear()
        attributes.putAll(getDefaultAttributes())
      }
    }
    node.addChildAt(textNode, 0)
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
    node.dirty()


    val root = node.getRootNode() ?: node

    if (root.type == NodeType.Document) {
      // If root is document, use documentElement to compute

      root.document?.documentElement?.compute(root.computeCache.width, root.computeCache.height)

      root.document?.documentElement?.view?.invalidate()
      root.document?.documentElement?.view?.requestLayout()
      return
    }

    // Otherwise use the topmost element (root)
    if (root.view is Element) {
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
    node.addChildAt(TextNode(node.mason).apply {
      data = text
      if (this@Element is TextView) {
        container = this@Element
        attributes.clear()
        // Copy current TextView attributes to the new text node
        attributes.putAll(getDefaultAttributes())
      }
    }, index)
  }

  fun addChildAt(element: Element, index: Int) {
    node.addChildAt(element.node, index)
  }

  fun addChildAt(node: Node, index: Int) {
    node.addChildAt(node, index)
  }

  fun replaceChildAt(text: String, index: Int) {
    node.replaceChildAt(TextNode(node.mason).apply {
      data = text
      if (this@Element is TextView) {
        container = this@Element
        attributes.clear()
        // Copy current TextView attributes to the new text node
        attributes.putAll(getDefaultAttributes())
      }
    }, index)
  }

  fun replaceChildAt(element: Element, index: Int) {
    node.replaceChildAt(element.node, index)
  }

  fun replaceChildAt(node: Node, index: Int) {
    node.replaceChildAt(node, index)
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
      var realLayout = layout
      var isText = false
      var hasWidthConstraint = false
      var hasHeightConstraint = false
      if (view.isGone) {
        return
      }

      if (node.type == NodeType.Text) {
        realLayout = node.computedLayout
        isText = true
        hasWidthConstraint = node.style.size.width != Dimension.Auto
        hasHeightConstraint = node.style.size.height != Dimension.Auto
      }

      val x = realLayout.x.takeIf { !it.isNaN() }?.toInt() ?: 0
      val y = realLayout.y.takeIf { !it.isNaN() }?.toInt() ?: 0


      var width = realLayout.width.takeIf { !it.isNaN() }?.toInt() ?: 0
      var height = realLayout.height.takeIf { !it.isNaN() }?.toInt() ?: 0

      if (isText) {
        if (!hasWidthConstraint && realLayout.contentSize.width > realLayout.width) {
          width = realLayout.contentSize.width.toInt()
        }

        if (!hasHeightConstraint && realLayout.contentSize.height > realLayout.height) {
          height = realLayout.contentSize.height.toInt()
        }
      }

      if (view !is Element) {
        // measured already grab dim
        width = view.measuredWidth
        height = view.measuredHeight
      }

      val right: Int = x + width
      val bottom: Int = y + height


      if (view is org.nativescript.mason.masonkit.View && view.isScrollRoot) {
        (view.parent as? View)?.layout(x, y, right, bottom)
        view.layout(
          0,
          0,
          realLayout.contentSize.width.toInt(),
          realLayout.contentSize.height.toInt()
        )
      } else {
        view.layout(x, y, right, bottom)
      }

      if (view is Scroll) {
        view.scrollRoot.layout(
          0,
          0,
          realLayout.contentSize.width.toInt(),
          realLayout.contentSize.height.toInt()
        )
      }
    }
  }

  if (layout.children.isNotEmpty()) {
    val children = node.children.filter {
      if (it.nativePtr == 0L) {
        false
      } else if (node.parent?.view is TextView && node.view is TextView) {
        val flatten =
          (node.parent?.view as TextView).shouldFlattenTextContainer(node.view as TextView)
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
