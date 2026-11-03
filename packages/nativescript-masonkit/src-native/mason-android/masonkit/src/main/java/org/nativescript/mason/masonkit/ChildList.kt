package org.nativescript.mason.masonkit

internal class ChildList(initialCapacity: Int) : ArrayList<Node>(initialCapacity) {
  var mayHaveAnonymous = false
    private set

  // Bumped on every change to the list.
  var version = 0
    private set

  private fun note(node: Node) {
    version++
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
    version++
    super.clear()
    mayHaveAnonymous = false
  }

  override fun remove(element: Node): Boolean {
    version++
    return super.remove(element)
  }

  override fun removeAt(index: Int): Node {
    version++
    return super.removeAt(index)
  }

  override fun removeAll(elements: Collection<Node>): Boolean {
    version++
    return super.removeAll(elements)
  }

  override fun retainAll(elements: Collection<Node>): Boolean {
    version++
    return super.retainAll(elements)
  }

  override fun removeRange(fromIndex: Int, toIndex: Int) {
    version++
    super.removeRange(fromIndex, toIndex)
  }
}
