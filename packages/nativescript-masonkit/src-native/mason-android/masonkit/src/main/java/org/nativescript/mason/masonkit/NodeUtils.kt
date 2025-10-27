package org.nativescript.mason.masonkit

internal object NodeUtils {
  fun isInlineLike(node: Node): Boolean {
    // prefer to use style.display when initialized, otherwise fall back to display mode
    if (node.isStyleInitialized) {
      return node.style.display == Display.Inline
        || node.style.display == Display.InlineBlock
        || node.style.display == Display.InlineFlex
        || node.style.display == Display.InlineGrid

    }
    if (node.isAnonymous) {
      if (node.view == null || node.view is TextView) {
        return true
      }
    } else if (node.view is TextView) {
      return true
    }
    return false
  }

  fun collectAuthorChildren(out: MutableList<Node>, nodes: List<Node>) {
    for (child in nodes) {
      if (child.isAnonymous) {
        collectAuthorChildren(out, child.children)
      } else {
        out.add(child)
      }
    }
  }
}
