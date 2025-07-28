package org.nativescript.mason.masonkit

interface MasonView {
  fun onNodeAttached(){}
  fun onNodeDetached(){}

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
}
