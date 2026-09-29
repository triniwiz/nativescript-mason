package org.nativescript.mason.masonkit

/**
 * A node's child list that remembers whether it may hold an anonymous node.
 * Without one, the author-children count is just [size], so appends need no
 * scan (NodeUtils.countAuthorChildren was O(n) per append, O(n²) per container).
 *
 * The flag is sticky until [clear]: removals keep it set, which only costs the
 * fast path. `isAnonymous` is fixed when a node is created, before it is added.
 */
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
