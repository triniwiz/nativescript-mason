package org.nativescript.mason.masonkit

import android.util.SizeF
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewGroup
import java.lang.ref.WeakReference


open class Node internal constructor(
  internal val mason: Mason, internal var nativePtr: Long, nodeType: NodeType = NodeType.Element
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
  internal var cachedWidth: Float = 0f
  internal var cachedHeight: Float = 0f
  open var parent: Node? = null
    internal set
    get() {
      var p = field
      while (p?.isAnonymous == true) {
        p = p.parent
      }
      return p
    }

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

  fun setComputedSize(width: Float, height: Float) {
    cachedWidth = width
    cachedHeight = height
  }

  internal fun setDefaultMeasureFunction() {
    setMeasureFunction(measureFunc)
  }

  internal var measureFunc: MeasureFunc = object : MeasureFunc {
    override fun measure(
      knownDimensions: Size<Float?>, availableSpace: Size<Float?>
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
            width, widthSpec
          ), MeasureSpec.makeMeasureSpec(
            height, heightSpec
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

  internal fun isInlineLike(node: Node): Boolean {
    // prefer to use style.display when initialized, otherwise fall back to display mode
    if (node.isStyleInitialized) {
      return node.style.display == Display.Inline
        || node.style.display == Display.InlineBlock
        || node.style.display == Display.InlineFlex
        || node.style.display == Display.InlineGrid

    }
    if (node.isAnonymous && node.view is TextView) {
      return true
    }
    return false
  }

  private fun appendElementChild(child: Node): Node {
    // Remove from old parent
    child.parent?.removeChild(child)

    // check

    if (child.isStyleInitialized && child.style.display == Display.Inline) {
      val lastChild = children.lastOrNull()
      if (lastChild != null) {
        // 1) reuse an existing anonymous inline wrapper (created earlier)
        if (lastChild.isAnonymous && lastChild.view == null) {
          // append into existing wrapper
          // remove child from old parent already done above
          child.parent = lastChild
          lastChild.children.add(child)

          // add child's native/view nodes under this Node's view hierarchy (container is anonymous, so add to this view)
          (child.view as? View)?.let { childView ->
            when (view) {
              is org.nativescript.mason.masonkit.View -> {
                val masonView = childView as? org.nativescript.mason.masonkit.View
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

              is ViewGroup -> {
                (view as ViewGroup).addView(childView)
              }
            }
          }

          // Add native child to the anonymous container's native node
          if (child.nativePtr != 0L) {
            NativeHelpers.nativeNodeAddChild(mason.nativePtr, lastChild.nativePtr, child.nativePtr)
          }

          (child.view as? Element)?.onNodeAttached()
          return child
        }

        // 2) previous sibling is inline-level element -> create a wrapper and move previous + new child inside it
        if (isInlineLike(lastChild)) {
          val container = mason.createNode(null, true)
          container.style.display = Display.Inline
          // replace lastChild in this.children with container
          val lastIndex = children.indexOf(lastChild)
          if (lastIndex > -1) {
            children[lastIndex] = container
            // children.removeAt(lastIndex)
            // children.add(lastIndex, container)
          } else {
            // fallback append
            children.add(container)
          }

          // reparent lastChild -> container
          container.children.add(lastChild)
          lastChild.parent = container

          // parent the new child under container
          container.children.add(child)
          child.parent = container
          container.parent = this

          // update native children for the new container (order: moved lastChild then new child)
          NativeHelpers.nativeNodeSetChildren(
            mason.nativePtr, container.nativePtr, longArrayOf(lastChild.nativePtr, child.nativePtr)
          )

          // Add to native layout tree
          if (child.nativePtr != 0L) {
            NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, container.nativePtr)
          }


          // Add views for children
          (child.view as? View)?.let { childView ->
            if (childView.parent == view) {
              (child.view as? Element)?.let {
                it.onNodeAttached()
                it.invalidateLayout()
              }
              return@let
            }
            when (view) {
              is org.nativescript.mason.masonkit.View -> {
                val masonView = childView as? org.nativescript.mason.masonkit.View
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

              is ViewGroup -> {
                (view as ViewGroup).addView(childView)
              }
            }
          }

          (child.view as? Element)?.let {
            it.onNodeAttached()
            it.invalidateLayout()
          }

          return child
        }
      }
    }

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

        is ViewGroup -> {
          (view as ViewGroup).addView(childView)
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

    // Create new anonymous container
    val container = getOrCreateAnonymousTextContainer()
    container.children.add(child)
    child.parent = container
    child.apply {
      // clear attributes when adding to another container
      attributes.clear()
      attributes.putAll((container.view as TextView).getDefaultAttributes())
    }
    (container.view as? TextView)?.attachTextNode(child)

    return child
  }

  internal fun getOrCreateAnonymousTextContainer(
    append: Boolean = true,
    checkLast: Boolean = true
  ): Node {
    // Check if last child is an anonymous text container
    val lastChild = children.lastOrNull()
    if (checkLast && lastChild?.isAnonymous == true && lastChild.view is TextView) {
      return lastChild
    }

    // Create new anonymous container
    val textView = mason.createTextView(
      (view as? View)?.context ?: throw IllegalStateException("View context required"),
      TextType.None,
      true
    )

    if (append) {
      // Add container to this node
      children.add(textView.node)
    }

    textView.node.parent = this
    (view as? ViewGroup)?.addView(textView)

    // Add to native layout tree
    if (textView.node.nativePtr != 0L) {
      NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, textView.node.nativePtr)
    }

    return textView.node
  }

  internal fun getOrCreateAnonymousInlineContainer(
    append: Boolean = true,
    checkLast: Boolean = true
  ): Node {
    // Check if last child is an anonymous inline container
    val lastChild = children.lastOrNull()
    if (checkLast && lastChild?.isAnonymous == true && lastChild.view == null) {
      return lastChild
    }

    // Create new anonymous container
    val container = mason.createNode(
      null,
      true
    )

    if (append) {
      // Add container to this node
      children.add(container)
    }

    container.parent = this

    // Add to native layout tree
    NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, container.nativePtr)

    return container
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
    return getChildren().getOrNull(index)
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

  fun replaceChildAt(child: Node, index: Int) {
    if (index <= -1) {
      return
    }

    val authorNodes = getChildren()

    if (child.parent === this) {
      val currentIndex = authorNodes.indexOf(child)
      // todo handle replacement in parent
      if (currentIndex > -1) {
        return
      }
    }

    when (child.type) {
      NodeType.Element -> replaceElementChildAt(child, index, authorNodes)
      NodeType.Text -> replaceTextChildAt(child, index, authorNodes)
      NodeType.Document -> {} // noop
    }

    if (isStyleInitialized && !style.inBatch) {
      (view as? Element)?.invalidateLayout()
    }

  }

  private fun replaceNodeAt(child: Node, index: Int, nodes: List<Node>? = null) {
    if (index < 0) {
      return
    }
    val authorNodes = nodes ?: getChildren()

    // If index out of range, append
    if (index >= authorNodes.size) {
      appendChild(child)
      return
    }

    val element = authorNodes.getOrNull(index)
    // No-op if same
    if (element == child) {
      return
    }

    if (element != null) {
      // Remove the existing author-level node. This handles anonymous containers/text nodes.
      element.parent?.removeChild(element)
      addChildAt(child, index)

    }
  }

  fun addChildAt(child: Node, index: Int) {
    // Handle -1 as append
    if (index <= -1) {
      appendChild(child)
      return
    }

    val authorNodes = getChildren()

    if (child.parent === this) {
      val currentIndex = authorNodes.indexOf(child)
      if (currentIndex == index) {
        return
      }
    }

    when (child.type) {
      NodeType.Element -> addElementChildAt(child, index, authorNodes)
      NodeType.Text -> addTextChildAt(child, index, authorNodes)
      NodeType.Document -> {} // noop
    }
  }

  private fun replaceTextChildAt(child: Node, index: Int, nodes: List<Node>? = null) {
    when (type) {
      NodeType.Document -> {
        if (children.isNotEmpty()) {
          return
        }

        if (child.type == NodeType.Text || child.type == NodeType.Document) {
          return
        }
      }

      NodeType.Text -> {
        return
      }

      else -> {}
    }

    // Remove from old parent
    child.parent?.removeChild(child)
    val authorNodes = nodes ?: getChildren()

    // For text nodes, if inserting at end, use appendChild behavior
    if (index >= authorNodes.size || index <= -1) {
      appendChild(child)
      return
    }

    val element = authorNodes[index]
    // Anonymous nodes are always hidden
    if (element is TextNode) {
      val layoutIndex = element.container?.node?.children?.indexOf(element)
      if (layoutIndex != null && layoutIndex > -1) {
        element.container?.node?.children?.set(layoutIndex, child)
      } else {
        element.container?.node?.children?.add(child)
      }

      (child as TextNode).apply {
        // clear attributes when adding to another container
        this.attributes.clear()
        element.container?.let { textView ->
          this.attributes.putAll(textView.getDefaultAttributes())
        }
      }

      element.container?.let {
        child.container = it
        element.container = null
        it.invalidateInlineSegments()
      }

    } else if (element.view is Element) {
      val layoutIndex = children.indexOf(element)

// For TextView containers, delegate to the TextView
      if (view is TextView && child is TextNode) {
        if (layoutIndex > -1) {
          children[index] = child
        } else {
          children.add(child)
        }
        child.parent = this

        (view as TextView).attachTextNode(child)

        if (layoutIndex > -1 && element.nativePtr != 0L) {
          NativeHelpers.nativeNodeRemoveChild(mason.nativePtr, nativePtr, element.nativePtr)
        }
        element.parent = null

        return
      }

      // Check if this is a text node get or create anonymous textContainer
      if (child is TextNode) {
        val container = getOrCreateAnonymousTextContainer(false)
        container.appendChild(child)
        child.apply {
          // clear attributes when adding to another container
          attributes.clear()
          attributes.putAll((container.view as TextView).getDefaultAttributes())
        }
        child.parent = container

        if (layoutIndex > -1) {
          children[index] = container
        } else {
          children.add(container)
        }

        (container.view as TextView).attachTextNode(child)

        if (layoutIndex > -1 && element.nativePtr != 0L) {
          NativeHelpers.nativeNodeRemoveChild(mason.nativePtr, nativePtr, element.nativePtr)
        }
        element.parent = null

        return
      }

      // Check if child has a view (element)
      if (child.view != null && child.nativePtr != 0L) {
        replaceElementChildAt(child, index)
        return
      }
    }

  }

  // todo
  private fun replaceElementChildAt(child: Node, index: Int, nodes: List<Node>? = null) {
    val authorNodes = nodes ?: getChildren()

    // Remove from old parent first
    val wasInSameParent = child.parent === this
    val oldIndex = if (wasInSameParent) authorNodes.indexOf(child) else -1

    child.parent?.removeChild(child)

    // Adjust index if we removed from same parent and it was before insertion point
    val adjustedIndex = if (wasInSameParent && oldIndex != -1 && oldIndex < index) {
      index - 1
    } else {
      index
    }

    // Check if we're inserting into an anonymous text container
    val element = authorNodes.getOrNull(adjustedIndex)
    if (element is TextNode && element.container?.node?.isAnonymous == true && element.view is TextView) {
      // Split the anonymous container
      val containerNode = element.container!!.node
      val textChildren = containerNode.children
      // Find the split index in the container
      val splitIdx = adjustedIndex - authorNodes.indexOf(containerNode)
      if (splitIdx >= 0 && splitIdx <= textChildren.size) {
        // Create new anonymous container for the split
        val newContainer = getOrCreateAnonymousTextContainer(append = false, checkLast = false)
        newContainer.children.clear()
        // Move text nodes after splitIdx to new container
        val nodesToMove = textChildren.subList(splitIdx, textChildren.size).toList()
        nodesToMove.forEach { node ->
          node.parent = newContainer
          newContainer.children.add(node)
        }
        // Remove moved nodes from original container
        textChildren.subList(splitIdx, textChildren.size).clear()

        // Insert child and new container into children array
        val containerIdx = children.indexOf(containerNode)
        if (containerIdx != -1) {
          children.add(containerIdx + 1, child)
          child.parent = this
          children.add(containerIdx + 2, newContainer)
          newContainer.parent = this

          // Add views to hierarchy
          (child.view as? View)?.let { childView ->
            (view as? ViewGroup)?.addView(childView, containerIdx + 1)
          }
          (newContainer.view as? View)?.let { newContainerView ->
            (view as? ViewGroup)?.addView(newContainerView, containerIdx + 2)
          }

          // Sync native layout tree (full rebuild to maintain order)
          val nativeChildren =
            children.mapNotNull { if (it.nativePtr != 0L) it.nativePtr else null }
          NativeHelpers.nativeNodeSetChildren(
            mason.nativePtr,
            nativePtr,
            nativeChildren.toLongArray()
          )
          dirty()
          return
        }
      }
    } else if (element?.view is Element) {

     /* todo
      val parent = element.parent
      element.parent?.children?.remove(element)
      if (parent?.isAnonymous == true && parent.children.isEmpty()){

      }
      if (element.parent?.view is ViewGroup){
        (element.parent?.view as ViewGroup).removeView(element.view as View)
      }
      parent?.dirty()

      */

      return
    }

    // Default: Insert into author tree
    children.add(adjustedIndex, child)
    child.parent = this

    // Add view to hierarchy
    (child.view as? View)?.let { childView ->
      (view as? ViewGroup)?.addView(childView, adjustedIndex)
    }

    // Sync native layout tree (full rebuild to maintain order)
    val nativeChildren = children.mapNotNull { if (it.nativePtr != 0L) it.nativePtr else null }
    NativeHelpers.nativeNodeSetChildren(mason.nativePtr, nativePtr, nativeChildren.toLongArray())

    (child.view as? Element)?.onNodeAttached()
    dirty()
  }

  private fun addTextChildAt(child: Node, index: Int, nodes: List<Node>? = null) {
    when (type) {
      NodeType.Document -> {
        if (children.isNotEmpty()) {
          return
        }

        if (child.type == NodeType.Text || child.type == NodeType.Document) {
          return
        }
      }

      NodeType.Text -> {
        return
      }

      else -> {}
    }

    // Remove from old parent
    child.parent?.removeChild(child)
    val authorNodes = nodes ?: getChildren()

    // For text nodes, if inserting at end, use appendChild behavior
    if (index >= authorNodes.size || index <= -1) {
      appendChild(child)
      return
    }

    val element = authorNodes[index]
    // Anonymous nodes are always hidden
    if (element is TextNode) {
      val layoutIndex = element.container?.node?.children?.indexOf(element)
      if (layoutIndex != null && layoutIndex > -1) {
        element.container?.node?.children?.add(layoutIndex, child)
      } else {
        element.container?.node?.children?.add(child)
      }

      (child as TextNode).apply {
        // clear attributes when adding to another container
        attributes.clear()
        element.container?.let { textView ->
          attributes.putAll(textView.getDefaultAttributes())
        }
      }

      child.parent = this
      element.container?.attachTextNode(child)
    } else if (element.view is Element) {
      val layoutIndex = children.indexOf(element)

// For TextView containers, delegate to the TextView
      if (view is TextView && child is TextNode) {
        if (layoutIndex > -1) {
          children.add(index, child)
        } else {
          children.add(child)
        }
        child.parent = this
        (view as TextView).attachTextNode(child)
        return
      }

      // Check if this is a text node get or create anonymous textContainer
      if (child is TextNode) {
        val container = getOrCreateAnonymousTextContainer(false)
        container.appendChild(child)
        child.apply {
          // clear attributes when adding to another container
          attributes.clear()
          attributes.putAll((container.view as TextView).getDefaultAttributes())
        }
        child.parent = container


        if (layoutIndex > -1) {
          children.add(index, container)
        } else {
          children.add(container)
        }

        (container.view as TextView).attachTextNode(child)
        return
      }

      // Check if child has a view (element)
      if (child.view != null && child.nativePtr != 0L) {
        addElementChildAt(child, index)
        return
      }
    }

  }

  private fun addElementChildAt(child: Node, index: Int, nodes: List<Node>? = null) {
    val authorNodes = nodes ?: getChildren()

    // Remove from old parent first
    val wasInSameParent = child.parent === this
    val oldIndex = if (wasInSameParent) authorNodes.indexOf(child) else -1

    child.parent?.removeChild(child)

    // Adjust index if we removed from same parent and it was before insertion point
    val adjustedIndex = if (wasInSameParent && oldIndex != -1 && oldIndex < index) {
      index - 1
    } else {
      index
    }

    // Check if we're inserting into an anonymous text container
    val element = authorNodes.getOrNull(adjustedIndex)
    if (element != null && element.isAnonymous && element.view is TextView) {
      // Split the anonymous container
      val containerNode = element
      val textChildren = containerNode.children
      // Find the split index in the container
      val splitIdx = adjustedIndex - authorNodes.indexOf(containerNode)
      if (splitIdx >= 0 && splitIdx <= textChildren.size) {
        // Create new anonymous container for the split
        val newContainer = getOrCreateAnonymousTextContainer(append = false, checkLast = false)
        newContainer.children.clear()
        // Move text nodes after splitIdx to new container
        val nodesToMove = textChildren.subList(splitIdx, textChildren.size).toList()
        nodesToMove.forEach { node ->
          node.parent = newContainer
          newContainer.children.add(node)
        }
        // Remove moved nodes from original container
        textChildren.subList(splitIdx, textChildren.size).clear()

        // Insert child and new container into children array
        val containerIdx = children.indexOf(containerNode)
        if (containerIdx != -1) {
          children.add(containerIdx + 1, child)
          child.parent = this
          children.add(containerIdx + 2, newContainer)
          newContainer.parent = this

          // Add views to hierarchy
          (child.view as? View)?.let { childView ->
            (view as? ViewGroup)?.addView(childView, containerIdx + 1)
          }
          (newContainer.view as? View)?.let { newContainerView ->
            (view as? ViewGroup)?.addView(newContainerView, containerIdx + 2)
          }

          // Sync native layout tree (full rebuild to maintain order)
          val nativeChildren =
            children.mapNotNull { if (it.nativePtr != 0L) it.nativePtr else null }
          NativeHelpers.nativeNodeSetChildren(
            mason.nativePtr,
            nativePtr,
            nativeChildren.toLongArray()
          )
          dirty()
          return
        }
      }
    }

    // Default: Insert into author tree
    children.add(adjustedIndex, child)
    child.parent = this

    // Add view to hierarchy
    (child.view as? View)?.let { childView ->
      (view as? ViewGroup)?.addView(childView, adjustedIndex)
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
          if (masonView != null && masonView.isScrollRoot) {
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
        if (child == containerNode) {
          children.remove(child)
          (child as? TextNode)?.container = null
          return child
        }
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
      mason.nativePtr, nativePtr, MeasureFuncImpl(WeakReference(measure))
    )
    measureFunc = measure
  }

  fun removeMeasureFunction() {
    NativeHelpers.nativeNodeRemoveContext(mason.nativePtr, nativePtr)
    measureFunc = object : MeasureFunc {
      override fun measure(
        knownDimensions: Size<Float?>, availableSpace: Size<Float?>
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

          is ViewGroup -> {
            (this.view as ViewGroup).removeView(view)
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
