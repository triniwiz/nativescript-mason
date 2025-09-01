package org.nativescript.mason.masonkit

interface MasonView {
  fun onNodeAttached() {}
  fun onNodeDetached() {}

  fun isLeaf(): Boolean

  val style: Style
    get() {
      return node.style
    }
  val node: Node

  fun markNodeDirty() {
    node.dirty()
  }

  fun isNodeDirty(): Boolean {
    return node.isDirty()
  }

  fun configure(block: Node.() -> Unit) {
    node.configure(block)
  }


  val rootNode: Node
    get() {
      return node.root ?: node
    }

  fun invalidateLayout() {
    val root = rootNode.data as? MasonView

    root?.let {
      it.markNodeDirty()
      (root as? View)?.requestLayout()
    }
  }
}
