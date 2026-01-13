package org.nativescript.mason.masonkit

import android.view.View
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.Display

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
    val nativeChildren = children.mapNotNull {
      if (it.nativePtr == 0L) {
        null
      } else {
        it.nativePtr
      }
    }
    NativeHelpers.nativeNodeSetChildren(
      node.mason.nativePtr,
      node.nativePtr,
      nativeChildren.toLongArray()
    )
  }

  fun syncNode(node: Node, children: Array<Node>) {
    val nativeChildren = children.mapNotNull {
      if (it.nativePtr == 0L) {
        null
      } else {
        it.nativePtr
      }
    }
    NativeHelpers.nativeNodeSetChildren(
      node.mason.nativePtr,
      node.nativePtr,
      nativeChildren.toLongArray()
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
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          val masonView = view as? org.nativescript.mason.masonkit.View
          // this is a scroll
          if (masonView != null && (parent.view as org.nativescript.mason.masonkit.View).isScrollRoot) {
            if (masonView.parent != null) {
              (masonView.parent as? ViewGroup)?.removeView(masonView)
            }

            (parent.view as org.nativescript.mason.masonkit.View).addView(masonView)
          } else {
            if (view.parent != null) {
              (view.parent as? ViewGroup)?.removeView(view)
            }

            (parent.view as org.nativescript.mason.masonkit.View).addView(view)
          }
        }

        is Scroll -> {
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
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          val masonView = view as? org.nativescript.mason.masonkit.View
          // this is a scroll
          if (masonView != null && masonView.isScrollRoot) {
            if (masonView.parent != null) {
              (parent.view as org.nativescript.mason.masonkit.View).addView(
                masonView.parent as View?,
                index
              )
            }
          } else {
            (parent.view as org.nativescript.mason.masonkit.View).addView(view, index)
          }
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
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          val masonView = view as? org.nativescript.mason.masonkit.View
          // this is a scroll
          if (masonView != null && masonView.isScrollRoot) {
            if (masonView.parent != null) {
              (parent.view as org.nativescript.mason.masonkit.View).addView(
                masonView.parent as View?,
                params
              )
            }
          } else {
            (parent.view as org.nativescript.mason.masonkit.View).addView(view, params)
          }
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
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          val masonView = view as? org.nativescript.mason.masonkit.View
          // this is a scroll
          if (masonView != null && masonView.isScrollRoot) {
            if (masonView.parent != null) {
              (parent.view as org.nativescript.mason.masonkit.View).addView(
                masonView.parent as View?,
                index,
                params
              )
            }
          } else {
            (parent.view as org.nativescript.mason.masonkit.View).addView(view, index, params)
          }
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

  fun removeView(parent: Node, view: View?) {
    view ?: return
    parent.suppressChildOperations {
      when (parent.view) {
        is org.nativescript.mason.masonkit.View -> {
          val masonView = view as? org.nativescript.mason.masonkit.View
          // this is a scroll
          if (masonView != null && masonView.isScrollRoot) {
            if (masonView.parent != null) {
              (parent.view as org.nativescript.mason.masonkit.View).removeView(masonView.parent as View?)
            }
          } else {
            (parent.view as org.nativescript.mason.masonkit.View).removeView(view)
          }
        }

        is Scroll -> {
          (parent.view as Scroll).removeView(view)
        }

        is ViewGroup -> {
          (parent.view as ViewGroup).removeView(view)
        }
      }
    }
  }
}
