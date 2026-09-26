package org.nativescript.mason.masonkit

import android.view.View
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.Position

internal object NodeUtils {
  fun isInlineLike(node: Node): Boolean {
    // prefer to use style.display when initialized, otherwise fall back to display mode
    if (node.style.isValueInitialized) {
      return node.style.display == Display.Inline
        || node.style.display == Display.InlineBlock
        || node.style.display == Display.InlineFlex
        || node.style.display == Display.InlineGrid

    }
    if (node.isAnonymous) {
      if (node.view == null || node.view is TextContainer) {
        return true
      }
    } else if (node.view is TextContainer) {
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

  fun syncNode(node: Node, children: List<Node>) {
    // Pre-size array to avoid intermediate list allocation
    var count = 0
    for (child in children) {
      if (child.nativePtr != 0L) count++
    }
    val nativeChildren = LongArray(count)
    var i = 0
    for (child in children) {
      if (child.nativePtr != 0L) {
        nativeChildren[i++] = child.nativePtr
      }
    }
    NativeHelpers.nativeNodeSetChildren(
      node.mason.nativePtr,
      node.nativePtr,
      nativeChildren
    )
  }

  fun syncNode(node: Node, children: Array<Node>) {
    var count = 0
    for (child in children) {
      if (child.nativePtr != 0L) count++
    }
    val nativeChildren = LongArray(count)
    var i = 0
    for (child in children) {
      if (child.nativePtr != 0L) {
        nativeChildren[i++] = child.nativePtr
      }
    }
    NativeHelpers.nativeNodeSetChildren(
      node.mason.nativePtr,
      node.nativePtr,
      nativeChildren
    )
  }

  fun invalidateLayout(node: Node, invalidateRoot: Boolean = false) {
    if (node.type == NodeType.Text) {
      ((node as? TextNode)?.container?.node?.view as? Element)?.invalidateLayout()
      return
    }
    (node.view as? Element)?.let {
      it.invalidateLayout(invalidateRoot)
    }
  }

  fun addView(parent: Node, view: View?) {
    view ?: return
    cancelRemoval(view)
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          if (view.parent != null) {
            (view.parent as? ViewGroup)?.removeView(view)
          }
          (parent.view as org.nativescript.mason.masonkit.View).addView(view)
        }

        is Scroll -> {
          if (view.parent != null) {
            (view.parent as? ViewGroup)?.removeView(view)
          }
          (parent.view as Scroll).addView(view)
        }

        is ViewGroup -> {
          (parent.view as ViewGroup).addView(view)
        }
      }
    }
  }

  fun addView(parent: Node, view: View?, index: Int) {
    view ?: return
    cancelRemoval(view)
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          (parent.view as org.nativescript.mason.masonkit.View).addView(view, index)
        }

        is Scroll -> {
          (parent.view as Scroll).addView(view, index)
        }

        is ViewGroup -> {
          (parent.view as ViewGroup).addView(view, index)
        }
      }
    }
  }

  fun addView(parent: Node, view: View?, params: ViewGroup.LayoutParams?) {
    view ?: return
    cancelRemoval(view)
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          (parent.view as org.nativescript.mason.masonkit.View).addView(view, params)
        }

        is Scroll -> {
          if (params != null) {
            (parent.view as Scroll).addView(view, params)
          } else {
            (parent.view as Scroll).addView(view)
          }
        }

        is ViewGroup -> {
          (parent.view as ViewGroup).addView(view, params)
        }
      }
    }
  }

  fun addView(parent: Node, view: View?, index: Int, params: ViewGroup.LayoutParams?) {
    view ?: return
    cancelRemoval(view)
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          (parent.view as org.nativescript.mason.masonkit.View).addView(view, index, params)
        }

        is Scroll -> {
          if (params != null) {
            (parent.view as Scroll).addView(view, index, params)
          } else {
            (parent.view as Scroll).addView(view, index)
          }
        }

        is ViewGroup -> {
          (parent.view as ViewGroup).addView(view, index, params)
        }
      }
    }
  }

  private class PendingRemoval(val expected: ViewGroup, val view: View, val oldVisibility: Int) {
    var cancelled = false
  }

  private val pendingRemovals = ArrayList<PendingRemoval>(16)
  private val pendingByView = java.util.IdentityHashMap<View, PendingRemoval>()
  private var removalFlushPosted = false

  fun cancelRemoval(view: View) {
    if (pendingByView.isEmpty()) return
    val p = pendingByView.remove(view) ?: return
    p.cancelled = true
    if (p.view.visibility != p.oldVisibility) {
      p.view.visibility = p.oldVisibility
    }
    // Not every add path detaches from the old parent, and addView throws if it has one.
    if (view.parent === p.expected) {
      p.expected.removeViewInLayout(view)
      p.expected.requestLayout()
      p.expected.invalidate()
    }
  }

  // Removes the view from its parent before returning, even when the parent is a
  // Mason view that defers the detach, so the caller can add it elsewhere.
  fun detachNow(view: View) {
    (view.parent as? ViewGroup)?.removeView(view)
    cancelRemoval(view)
  }

  private fun queueRemoval(expectedParent: ViewGroup, view: View) {
    cancelRemoval(view)
    val old = view.visibility
    if (old != View.GONE) view.visibility = View.GONE
    val pending = PendingRemoval(expectedParent, view, old)
    pendingRemovals.add(pending)
    pendingByView[view] = pending
    if (!removalFlushPosted) {
      removalFlushPosted = true
      android.os.Handler(android.os.Looper.getMainLooper()).post {
        flushRemovals()
      }
    }
  }

  private fun flushRemovals() {
    removalFlushPosted = false
    if (pendingRemovals.isEmpty()) return
    val batch = pendingRemovals.toList()
    pendingRemovals.clear()
    pendingByView.clear()
    val touched = LinkedHashSet<ViewGroup>()
    for (p in batch) {
      if (p.cancelled) continue
      val v = p.view
      if (v.visibility != p.oldVisibility) {
        v.visibility = p.oldVisibility
      }
      if (v.parent === p.expected) {
        p.expected.removeViewInLayout(v)
        touched.add(p.expected)
      }
    }
    for (p in touched) {
      p.requestLayout()
      p.invalidate()
    }
  }

  fun removeView(parent: Node, view: View?) {
    view ?: return
    val pv = parent.view
    if (pv is ViewGroup && view.parent === pv) {
      queueRemoval(pv, view)
    } else {
      parent.suppressChildOperations {
        when (pv) {
          is org.nativescript.mason.masonkit.View -> {
            pv.removeView(view)
          }

          is Scroll -> {
            pv.removeView(view)
          }

          is ViewGroup -> {
            pv.removeView(view)
          }
        }
        if (view.parent != null && view.parent !== pv) {
          removeViewFallback(view)
        }
      }
    }
    // Fixed views live under their containing block, not their tree parent.
    if ((view as? Element)?.node?.style?.position == Position.Fixed) {
      removeViewFallback(view)
    }
  }

  // Fallback removal: if the expected parent doesn't have a view (or the view
  // isn't a child), try removing the view directly from its actual parent
  // ViewGroup to avoid leaving dangling attachments.
  fun removeViewFallback(view: View?) {
    view ?: return
    val p = view.parent as? ViewGroup
    p?.removeView(view)
  }
}
