package org.nativescript.mason.masonkit

import android.util.SizeF
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewGroup
import java.lang.ref.WeakReference


open class Node internal constructor(
  internal val mason: Mason,
  internal var nativePtr: Long,
  nodeType: NodeType = NodeType.Element
) {
  internal var isFlattened: Boolean = false
  internal var computeCacheDirty = false

  internal var computeCache = SizeF(Float.MIN_VALUE, Float.MIN_VALUE)
    set(value) {
      field = value
      computeCacheDirty = true
    }

  var computedLayout: Layout = Layout.empty
    internal set
  internal var knownWidth: Float? = null
  internal var knownHeight: Float? = null
  internal var availableWidth: Float? = null
  internal var availableHeight: Float? = null
  internal var document: Document? = null
  open var parent: Node? = null
    internal set

  internal var isAnonymous = false

  var onNodeAttached: (() -> Unit)? = null
  var onNodeDetached: (() -> Unit)? = null

  val parentNode: Node?
    get() {
      return parent
    }

  val parentElement: Element?
    get() {
      return parent?.let {
        if (it.type == NodeType.Element) {
          return it.view as Element?
        }
        null
      }
    }


  internal fun setDefaultMeasureFunction() {
    setMeasureFunction(measureFunc)
  }

  internal var measureFunc: MeasureFunc = object : MeasureFunc {
    override fun measure(
      knownDimensions: Size<Float?>,
      availableSpace: Size<Float?>
    ): Size<Float> {
      knownWidth = knownDimensions.width
      knownHeight = knownDimensions.height
      availableWidth = availableSpace.width
      availableHeight = availableSpace.height
      val view = this@Node.view as? android.view.View

      if (knownDimensions.width != null && knownDimensions.height != null) {
        return Size(knownDimensions.width!!, knownDimensions.height!!)
      }
      if (view !is Element) {
        var width = 0
        var height = 0
        val layoutParams = view?.layoutParams
        val widthSpec = if (knownWidth != null) {
          if (knownWidth!!.isNaN() || knownWidth!!.isInfinite()) {
            width = Int.MAX_VALUE
            MeasureSpec.UNSPECIFIED
          } else {
            width = knownWidth!!.toInt()
            MeasureSpec.EXACTLY
          }
        } else if (layoutParams != null) {
          val paramsWidth = layoutParams.width
          when (paramsWidth) {
            ViewGroup.LayoutParams.MATCH_PARENT -> {
              if (availableWidth != null && availableWidth!!.isFinite()) {
                if (availableWidth == -2f) {
                  width = Int.MAX_VALUE
                  MeasureSpec.UNSPECIFIED
                } else {
                  width = availableWidth!!.toInt()
                  MeasureSpec.AT_MOST
                }
              } else {
                MeasureSpec.EXACTLY
              }
            }

            ViewGroup.LayoutParams.WRAP_CONTENT -> {
              MeasureSpec.UNSPECIFIED
            }

            else -> {
              if (paramsWidth >= 0) {
                width = paramsWidth
              }
              MeasureSpec.EXACTLY
            }
          }
        } else {
          MeasureSpec.UNSPECIFIED
        }

        val heightSpec = if (knownHeight != null) {
          if (knownHeight!!.isNaN() || knownHeight!!.isInfinite()) {
            height = Int.MAX_VALUE
            MeasureSpec.UNSPECIFIED
          } else {
            height = knownHeight!!.toInt()
            MeasureSpec.EXACTLY
          }
        } else if (layoutParams != null) {
          val paramsHeight = layoutParams.height
          when (paramsHeight) {
            ViewGroup.LayoutParams.MATCH_PARENT -> {
              if (availableHeight != null && availableHeight!!.isFinite()) {
                if (availableWidth == -2f) {
                  height = Int.MAX_VALUE
                  MeasureSpec.UNSPECIFIED
                } else {
                  height = availableHeight!!.toInt()
                  MeasureSpec.AT_MOST
                }
              } else {
                MeasureSpec.EXACTLY
              }
            }

            ViewGroup.LayoutParams.WRAP_CONTENT -> {
              MeasureSpec.UNSPECIFIED
            }

            else -> {
              if (paramsHeight >= 0) {
                height = paramsHeight
              }
              MeasureSpec.EXACTLY
            }
          }
        } else {
          MeasureSpec.UNSPECIFIED
        }

        view?.measure(
          MeasureSpec.makeMeasureSpec(
            width,
            widthSpec
          ),
          MeasureSpec.makeMeasureSpec(
            height,
            heightSpec
          )
        )

      }

      val width = knownDimensions.width ?: view?.measuredWidth?.toFloat() ?: 0f

      val height = knownDimensions.height ?: view?.measuredHeight?.toFloat() ?: 0f

      return Size(width, height)
    }
  }

  var type: NodeType = nodeType
    internal set

  var view: Any? = null

  internal var children = arrayListOf<Node>()

  internal var isStyleInitialized = false
  internal val style: Style by lazy {
    isStyleInitialized = true
    Style(this)
  }

  open fun appendChild(child: Node) {
    if (type == NodeType.Document) {
      if (children.isNotEmpty()) {
        return
      }
      if (child.type == NodeType.Text || child.type == NodeType.Document) {
        return
      }
    }

    // Remove from old parent
    child.parent?.removeChild(child)

    // For TextView containers, delegate to the TextView
    if (view is TextView && child is TextNode) {
      children.add(child)
      child.parent = this
      (view as TextView).attachTextNode(child)
      return
    }

    // Check if this is a text node
    if (child is TextNode) {
      appendTextChild(child)
      return
    }

    // Check if child has a view (element)
    if (child.view != null && child.nativePtr != 0L) {
      if (view is TextView && child.view is TextView && !child.isStyleInitialized) {
        child.style.display = Display.Inline
      }
      appendElementChild(child)
      return
    }

    // Fallback
    children.add(child)
    child.parent = this

    if (nativePtr != 0L && child.nativePtr != 0L) {
      NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, child.nativePtr)
    }
  }

  private fun appendElementChild(child: Node): Node {
    // Remove from old parent
    child.parent?.removeChild(child)

    // Add to author tree
    children.add(child)
    child.parent = this

    // Add view to hierarchy
    (child.view as? View)?.let { childView ->
      when (view) {
        is org.nativescript.mason.masonkit.View -> {
          val masonView = childView as? org.nativescript.mason.masonkit.View
          // this is a scroll
          if (masonView != null && masonView.isScrollRoot) {
            if (masonView.parent != null) {
              (view as org.nativescript.mason.masonkit.View).addView(masonView.parent as View?)
            }
          } else {
            (view as org.nativescript.mason.masonkit.View).addView(childView)
          }
        }

        is Scroll -> {
          (view as Scroll).addView(childView)
        }

        is android.view.ViewGroup -> {
          (view as android.view.ViewGroup).addView(childView)
        }
      }
    }

    // Add to native layout tree
    if (child.nativePtr != 0L) {
      NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, child.nativePtr)
    }

    (child.view as? Element)?.onNodeAttached()
    dirty()
    return child
  }

  private fun appendTextChild(child: Node): Node {
    // Check that child is actually a TextNode
    if (child !is TextNode) {
      // Fallback to element child
      return appendElementChild(child)
    }

    // Remove from old parent
    child.parent?.removeChild(child)

    // If this node already has a TextView, add directly to it
    if (view is TextView) {
      children.add(child)
      child.parent = this
      (view as TextView).attachTextNode(child)
      return child
    }

    // Check if we can append to an existing anonymous text container
    val lastChild = children.lastOrNull()
    if (lastChild?.isAnonymous == true && lastChild.view is TextView) {
      lastChild.children.add(child)
      child.parent = lastChild
      (lastChild.view as TextView).attachTextNode(child)
      return child
    }

    // Create new anonymous container
    val container = getOrCreateAnonymousTextContainer()
    container.children.add(child)
    child.parent = container
    (container.view as? TextView)?.attachTextNode(child)

    return child
  }

  internal fun getOrCreateAnonymousTextContainer(): Node {
    // Check if last child is an anonymous text container
    val lastChild = children.lastOrNull()
    if (lastChild?.isAnonymous == true && lastChild.view is TextView) {
      return lastChild
    }

    // Create new anonymous container
    val textView = mason.createTextView(
      (view as? View)?.context ?: throw IllegalStateException("View context required"),
    ).apply {
      isAnonymous = true
    }

    // Add container to this node
    children.add(textView.node)
    textView.node.parent = this
    (view as? android.view.ViewGroup)?.addView(textView)

    // Add to native layout tree
    if (textView.node.nativePtr != 0L) {
      NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, textView.node.nativePtr)
    }

    return textView.node
  }

  fun getNativePtr(): Long {
    return nativePtr
  }

  fun getRootNode(): Node? {
    return parent?.let {
      var current: Node? = it
      while (current?.parent != null) {
        current = current.parent
      }
      return current
    }
  }


  fun getChildAt(index: Int): Node? {
    return children.getOrNull(index)
  }

  fun getChildren(): List<Node> {
    val out = mutableListOf<Node>()
    collectAuthorChildren(out, children)
    return out
  }

  fun getLayoutChildren(): List<Node> {
    return children
  }

  private fun collectAuthorChildren(out: MutableList<Node>, nodes: List<Node>) {
    for (child in nodes) {
      if (child.isAnonymous) {
        collectAuthorChildren(out, child.children)
      } else {
        out.add(child)
      }
    }
  }

  fun appendChild(view: View) {
    val child = mason.nodeForView(view)
    appendChild(child)
  }

  fun addChildAt(child: Node, index: Int) {
    // Handle -1 as append
    if (index == -1) {
      appendChild(child)
      return
    }

    // Validate index
    if (index < 0 || index > children.size) {
      throw IndexOutOfBoundsException("Index: $index, Size: ${children.size}")
    }

    if (child.parent === this) {
      val currentIndex = children.indexOf(child)
      if (currentIndex == index) {
        return
      }
    }

    when (child.type) {
      NodeType.Element -> addElementChildAt(child, index)
      NodeType.Text -> addTextChildAt(child, index)
      NodeType.Document -> {} // noop
    }
  }

  private fun addElementChildAt(child: Node, index: Int) {
    // Remove from old parent first
    val wasInSameParent = child.parent === this
    val oldIndex = if (wasInSameParent) children.indexOf(child) else -1

    child.parent?.removeChild(child)

    // Adjust index if we removed from same parent and it was before insertion point
    val adjustedIndex = if (wasInSameParent && oldIndex != -1 && oldIndex < index) {
      index - 1
    } else {
      index
    }

    // Insert into author tree
    children.add(adjustedIndex, child)
    child.parent = this

    // Add view to hierarchy
    (child.view as? android.view.View)?.let { childView ->
      when (view) {
        is org.nativescript.mason.masonkit.View -> {
          val masonView = childView as? org.nativescript.mason.masonkit.View
          // this is a scroll
          if (masonView != null && masonView.isScrollRoot) {
            if (masonView.parent != null) {
              (view as org.nativescript.mason.masonkit.View).addView(
                masonView.parent as View?,
                adjustedIndex
              )
            }
          } else {
            (view as org.nativescript.mason.masonkit.View).addView(childView, adjustedIndex)
          }
        }

        is Scroll -> {
          // Scroll typically only has one child, so just add
          (view as Scroll).addView(childView)
        }

        is android.view.ViewGroup -> {
          (view as android.view.ViewGroup).addView(childView, adjustedIndex)
        }
      }
    }

    // Sync native layout tree (full rebuild to maintain order)
    val nativeChildren = children.mapNotNull { if (it.nativePtr != 0L) it.nativePtr else null }
    NativeHelpers.nativeNodeSetChildren(mason.nativePtr, nativePtr, nativeChildren.toLongArray())

    (child.view as? Element)?.onNodeAttached()
    dirty()
  }

  private fun removeElementChild(child: Node): Node? {
    val index = children.indexOfFirst { it === child }
    if (index == -1) return null

    // Remove from author tree
    children.removeAt(index)
    child.parent = null

    // Remove from view hierarchy
    (child.view as? android.view.View)?.let { childView ->
      when (view) {
        is org.nativescript.mason.masonkit.View -> {
          val masonView = childView as? org.nativescript.mason.masonkit.View
          // this is a scroll
          if (masonView != null  && masonView.isScrollRoot) {
            if (masonView.parent != null) {
              (view as org.nativescript.mason.masonkit.View).removeView(masonView.parent as View?)
            }
          } else {
            (view as org.nativescript.mason.masonkit.View).removeView(childView)
          }
        }

        is Scroll -> {
          (view as Scroll).removeView(childView)
        }

        is android.view.ViewGroup -> {
          (view as android.view.ViewGroup).removeView(childView)
        }
      }
    }

    // Remove from native layout tree
    if (child.nativePtr != 0L) {
      NativeHelpers.nativeNodeRemoveChild(mason.nativePtr, nativePtr, child.nativePtr)
    }

    (child.view as? Element)?.onNodeDetached()
    dirty()
    return child
  }

  private fun removeTextChild(child: Node): Node? {
    // Find the text container holding this text node
    for (containerNode in children) {
      if (!containerNode.isAnonymous || containerNode.view !is TextView) {
        continue
      }

      val textContainer = containerNode.view as TextView
      // Try to remove from this container
      textContainer.detachTextNode(child as TextNode)

      // If container is now empty, remove it
      if (containerNode.children.isEmpty()) {
        removeElementChild(containerNode)
      }

      return child
    }

    return null
  }

  fun removeChildAt(index: Int): Node? {
    if (index < 0 || index >= children.size) return null

    val child = children[index]
    return removeChild(child)
  }

  fun dirty() {
    NativeHelpers.nativeNodeMarkDirty(mason.nativePtr, nativePtr)
  }

  fun isDirty(): Boolean {
    return NativeHelpers.nativeNodeDirty(mason.nativePtr, nativePtr)
  }

  fun getChildCount(): Int {
    return children.size
  }

  fun setMeasureFunction(measure: MeasureFunc) {
    NativeHelpers.nativeNodeSetContext(
      mason.nativePtr,
      nativePtr,
      MeasureFuncImpl(WeakReference(measure))
    )
    measureFunc = measure
  }

  fun removeMeasureFunction() {
    NativeHelpers.nativeNodeRemoveContext(mason.nativePtr, nativePtr)
    measureFunc = object : MeasureFunc {
      override fun measure(
        knownDimensions: Size<Float?>,
        availableSpace: Size<Float?>
      ): Size<Float> {
        val view = this@Node.view as? android.view.View
        val width = knownDimensions.width ?: view?.measuredWidth?.toFloat() ?: 0f
        val height = knownDimensions.height ?: view?.measuredHeight?.toFloat() ?: 0f
        return Size(width, height)
      }
    }
  }

  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
    if (nativePtr != 0L) {
      NativeHelpers.nativeNodeDestroy(nativePtr)
      nativePtr = 0
      parent?.removeChild(this)
    }
  }


  fun removeChild(child: Node): Node? {
    if (child.parent !== this) return null

    return when (child.type) {
      NodeType.Element -> removeElementChild(child)
      NodeType.Text -> removeTextChild(child)
      NodeType.Document -> null
    }
  }

  private fun addTextChildAt(child: Node, index: Int) {
    // For text nodes, if inserting at end, use appendChild behavior
    if (index >= children.size) {
      appendChild(child)
    } else {
      // TODO: Implement proper insertion into text containers at specific positions
      // For now, just append
      appendChild(child)
    }
  }

  fun removeChildren() {
    children.forEach {
      it.parent = null
      (it.view as? Element)?.onNodeDetached()
      (it.view as? View)?.let { view ->
        when (this.view) {
          is org.nativescript.mason.masonkit.View -> {
            val masonView = view as? org.nativescript.mason.masonkit.View
            // this is a scroll
            if (masonView != null && masonView.isScrollRoot) {
              if (masonView.parent != null) {
                (this.view as org.nativescript.mason.masonkit.View).removeView(masonView.parent as View?)
              }
            } else {
              (this.view as org.nativescript.mason.masonkit.View).removeView(view)
            }
          }

          is Scroll -> {
            (this.view as Scroll).removeView(view)
          }

          is android.view.ViewGroup -> {
            (this.view as android.view.ViewGroup).removeView(view)
          }
        }
      }
    }
    children.clear()

    if (nativePtr != 0L) {
      NativeHelpers.nativeNodeRemoveChildren(mason.nativePtr, nativePtr)
    }

    dirty()
  }

}
