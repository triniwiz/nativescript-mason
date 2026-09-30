package org.nativescript.mason.masonkit

internal class ChildList(initialCapacity: Int) : ArrayList<Node>(initialCapacity) {
  var mayHaveAnonymous = false
    private set

  private fun note(node: Node) {
    if (node.isAnonymous) mayHaveAnonymous = true
  }

  override fun add(element: Node): Boolean {
    note(element)
    return super.add(element)
  }

  override fun add(index: Int, element: Node) {
    note(element)
    super.add(index, element)
  }

  override fun addAll(elements: Collection<Node>): Boolean {
    elements.forEach(::note)
    return super.addAll(elements)
  }

  override fun addAll(index: Int, elements: Collection<Node>): Boolean {
    elements.forEach(::note)
    return super.addAll(index, elements)
  }

  override fun set(index: Int, element: Node): Node {
    note(element)
    return super.set(index, element)
  }

  override fun clear() {
    super.clear()
    mayHaveAnonymous = false
  }
}
