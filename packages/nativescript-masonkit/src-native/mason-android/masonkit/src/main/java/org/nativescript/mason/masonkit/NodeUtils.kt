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
    // A queued deferred removal must not undo this re-add at flush time.
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

  /**
   * Deferred platform detach. Per-child ViewGroup.removeView costs a
   * requestLayout+invalidate fan-out per call (~260µs on-device), so bulk
   * removals (clear/refill/shuffle) pay O(n) fan-outs. Queue the detaches
   * here and flush them as one removeViewInLayout pass (no per-child
   * requestLayout) plus a single requestLayout/invalidate per parent at the
   * end of the current message-loop turn.
   *
   * Safety:
   * - Each entry remembers the EXPECTED parent; the flush only detaches when
   *   `view.parent === expected`, so a same-turn re-parent (Vue move) or
   *   re-add cancels out instead of being re-removed.
   * - Re-adds must call [cancelRemoval] before attaching (see addView below),
   *   otherwise a move back under the same parent would be undone by the flush.
   * - The view is hidden immediately at queue time so a frame drawn before
   *   the flush never shows the dead child.
   */
  private class PendingRemoval(val expected: ViewGroup, val view: View, val oldVisibility: Int)

  private val pendingRemovals = ArrayList<PendingRemoval>(16)
  private var removalFlushPosted = false

  fun cancelRemoval(view: View) {
    if (pendingRemovals.isEmpty()) return
    val it = pendingRemovals.iterator()
    while (it.hasNext()) {
      val p = it.next()
      if (p.view === view) {
        it.remove()
        // The GONE we set at queue time must not leak into a reused view
        // (e.g. a same-parent move re-attaching it this turn).
        if (p.view.visibility != p.oldVisibility) {
          p.view.visibility = p.oldVisibility
        }
      }
    }
  }

  private fun queueRemoval(expectedParent: ViewGroup, view: View) {
    cancelRemoval(view)
    // Hide immediately so a frame drawn before the flush can't show the dead
    // child; the original visibility is restored on cancel.
    val old = view.visibility
    if (old != View.GONE) view.visibility = View.GONE
    pendingRemovals.add(PendingRemoval(expectedParent, view, old))
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
    val __t = System.nanoTime()
    val batch = pendingRemovals.toList()
    pendingRemovals.clear()
    val touched = LinkedHashSet<ViewGroup>()
    for (p in batch) {
      val v = p.view
      // Restore the queued-time visibility so a reused view isn't stuck GONE.
      if (v.visibility != p.oldVisibility) {
        v.visibility = p.oldVisibility
      }
      // Skip when the view was re-parented or detached during the turn —
      // someone else already took it out of `expected`.
      if (v.parent === p.expected) {
        p.expected.removeViewInLayout(v)
        touched.add(p.expected)
      }
    }
    for (p in touched) {
      p.requestLayout()
      p.invalidate()
    }
    Perf.hit("rcBatch")
    Perf.add("rcFlush", System.nanoTime() - __t)
  }

  fun removeView(parent: Node, view: View?) {
    view ?: return
    val pv = parent.view
    if (pv is ViewGroup && view.parent === pv) {
      // Fast path: the view is exactly where the tree expects it — defer the
      // platform detach to the batch flush.
      Perf.timed("rcViewPlat") {
        queueRemoval(pv, view)
      }
    } else {
      parent.suppressChildOperations {
        Perf.timed("rcViewPlat") {
          when (pv) {
            is org.nativescript.mason.masonkit.View -> {
              (pv as org.nativescript.mason.masonkit.View).removeView(view)
            }

            is Scroll -> {
              (pv as Scroll).removeView(view)
            }

            is ViewGroup -> {
              (pv as ViewGroup).removeView(view)
            }
          }
        }
        // Attached somewhere the tree didn't expect — pull it from wherever
        // it actually lives so it can't dangle.
        if (view.parent != null && view.parent !== pv) {
          removeViewFallback(view)
        }
      }
    }
    // Fixed views live under their containing block, not their tree parent.
    val __tf = System.nanoTime()
    if ((view as? Element)?.node?.style?.position == Position.Fixed) {
      removeViewFallback(view)
    }
    Perf.add("rcFixedChk", System.nanoTime() - __tf)
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
