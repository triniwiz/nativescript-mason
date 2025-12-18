package org.nativescript.mason.masonkit

import android.util.SizeF
import android.view.View
import android.view.View.MeasureSpec
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.TextType
import java.lang.ref.WeakReference


open class Node internal constructor(
  internal val mason: Mason, internal var nativePtr: Long, nodeType: NodeType = NodeType.Element
) {
  internal var computeCacheDirty = false

  internal var isImage = false
  var computeCache: SizeF = SizeF(Float.MIN_VALUE, Float.MIN_VALUE)
    set(value) {
      computeCacheDirty = true
      field = if (isImage && value.width == -1f && value.height == -1f) {
        SizeF(Float.MIN_VALUE, Float.MIN_VALUE)
      } else {
        value
      }
    }
  var computedLayout: Layout = Layout.empty
    internal set

  // cache overflow size
  internal var overflowWidth = 0
  internal var overflowHeight = 0

  internal var knownWidth: Float? = null
  internal var knownHeight: Float? = null
  internal var availableWidth: Float? = null
  internal var availableHeight: Float? = null
  internal var document: Document? = null
  internal var cachedWidth: Float = 0f
  internal var cachedHeight: Float = 0f
  internal open var layoutParent: Node? = null
  open var parent: Node?
    internal set(value) {
      layoutParent = value
    }
    get() {
      var p = layoutParent
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
      val view = this@Node.view as? View

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
  internal val style = Style(this)

  internal var suppressChildOps = 0
  internal inline fun <T> suppressChildOperations(block: () -> T): T {
    suppressChildOps++
    try {
      return block()
    } finally {
      suppressChildOps--
    }
  }

  internal fun getOrCreateAnonymousTextContainer(
    append: Boolean = true, checkLast: Boolean = true
  ): Node {
    // Check if last child is an anonymous text container
    val lastChild = children.lastOrNull()
    if (checkLast && lastChild?.isAnonymous == true && lastChild.view is TextContainer) {
      return lastChild
    }

    // Create new anonymous container
    val textView = mason.createTextView(
      (view as? View)?.context ?: throw IllegalStateException("View context required"),
      TextType.Span,
      true
    )

    if (append) {
      // Add container to this node
      children.add(textView.node)

      textView.node.parent = this

      suppressChildOperations {
        (view as? ViewGroup)?.addView(textView)
      }

      // Add to native layout tree
      if (textView.node.nativePtr != 0L) {
        NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, textView.node.nativePtr)
      }

    }

    return textView.node
  }

  internal fun getOrCreateAnonymousInlineContainer(
    append: Boolean = true, checkLast: Boolean = true
  ): Node {
    // Check if last child is an anonymous inline container
    val lastChild = children.lastOrNull()
    if (checkLast && lastChild?.isAnonymous == true && lastChild.view == null) {
      return lastChild
    }

    // Create new anonymous container
    val container = mason.createNode(
      null, true
    )

    if (append) {
      // Add container to this node
      children.add(container)

      container.parent = this

      // Add to native layout tree
      NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, container.nativePtr)
    }

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
    NodeUtils.collectAuthorChildren(out, children)
    return out
  }

  fun getLayoutChildren(): List<Node> {
    return children
  }

  companion object {
    // Efficient single-pass invalidation that only walks each TextView once
    internal fun invalidateDescendantTextViews(node: Node, state: Int) {
      // Early exit if node has no initialized text values
      // if (!node.style.isTextValueInitialized) {
      //  return
      // }

      // Direct invalidation if this is a TextView
      if (node.view is TextContainer) {
        // Notify all text style changes to ensure paint is fully updated
        (node.view as StyleChangeListener).onTextStyleChanged(state)
      }

      // Iterate children (only layout children, not author children)
      val size = node.children.size
      for (i in 0 until size) {
        invalidateDescendantTextViews(node.children[i], state)
      }
    }
  }

  open fun appendChild(child: Node) {
    if (child is TextNode) {
      var pending = false
      val container = if (view is TextContainer) {
        this
      } else {
        pending = true
        getOrCreateAnonymousTextContainer()
      }

      if (style.font.font == null) {
        style.font.loadSync((container.view as View).context) {}
      }

      if (pending) {
        if (child.nativePtr != 0L) {
          NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, child.nativePtr)
        }
        NodeUtils.addView(this, child.view as? View)
      }

      container.children.add(child)
      (container.view as? TextView)?.let {
        child.attributes.sync(it.style)
        child.container = it
        it.engine.invalidateInlineSegments()
      }
      NodeUtils.invalidateLayout(this)
    } else {
      children.add(child)
      child.parent = this
      if (child.nativePtr != 0L) {
        NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, child.nativePtr)
      }
      NodeUtils.addView(this, child.view as? View)

      // Single pass invalidation of descendants with text styles
      invalidateDescendantTextViews(child, TextStyleChangeMask.ALL)

      onNodeAttached?.let { it() }
    }
  }

  fun appendChild(view: View) {
    val child = mason.nodeForView(view)
    appendChild(child)
  }

  fun replaceChildAt(child: Node, index: Int) {
    if (index <= -1) {
      appendChild(child)
      return
    }
    val nodes = getChildren()
    if (index >= nodes.size) {
      appendChild(child)
      return
    }
    val reference = nodes[index]
    if (reference == child) {
      return
    }

    if (child is TextNode) {
      if (reference is TextNode) {
        reference.container?.let { container ->
          val idx = container.node.children.indexOf(reference).takeIf { it > -1 } ?: return
          container.node.children[idx] = child
          child.attributes.sync(container.node.style)
          child.container = container
          reference.container = null
          container.engine.invalidateInlineSegments()
          if (!style.inBatch) {
            (container.node.view as? Element)?.invalidateLayout()
          }
        }
      } else {
        val container = getOrCreateAnonymousTextContainer(append = false, checkLast = false)
        container.children.add(child)
        (container.view as? TextView)?.let {
          child.attributes.sync(it.node.style)
          child.container = it
          it.engine.invalidateInlineSegments()
        }
        val idx = children.indexOf(reference).takeIf { it > -1 } ?: return
        children[idx] = container
        reference.parent = null
        NodeUtils.syncNode(this, children)
      }
    } else {

      val idx = children.indexOf(reference).takeIf { it > -1 }
        ?: if (reference is TextNode && reference.container?.node?.isAnonymous == true) {
          reference.container?.node?.children?.indexOf(reference)?.takeIf { it > -1 }
        } else {
          null
        } ?: return

      // If we're replacing a TextNode that's inside an anonymous text container,
      // we need to split that container: keep left text nodes (if any) in original container,
      // move right text nodes (if any) into a new anonymous text container, then
      // insert the element node between them (or replace the container if there are no siblings).
      if (reference is TextNode) {
        val containerNode = reference.layoutParent ?: reference.container?.node
        if (containerNode != null && containerNode.parent == this) {
          val idxInContainer = containerNode.children.indexOf(reference).takeIf { it > -1 } ?: -1
          if (idxInContainer >= 0) {
            val hasLeft = idxInContainer > 0
            val hasRight = idxInContainer < containerNode.children.size - 1
            val containerIndexInParent = children.indexOf(containerNode).takeIf { it > -1 } ?: -1
            // prepare a new after-container if needed
            var afterContainer: Node? = null
            if (hasRight) {
              afterContainer = getOrCreateAnonymousTextContainer(append = false, checkLast = false)
              // move right-side text nodes into afterContainer
              val moved =
                containerNode.children.subList(idxInContainer + 1, containerNode.children.size)
                  .toList()
              for (m in moved) {
                containerNode.children.remove(m)
                m.parent = afterContainer
                afterContainer.children.add(m)
                (afterContainer.view as? TextView)?.let { tv ->
                  (m as? TextNode)?.let {
                    m.attributes.sync(tv.style)
                    m.container = tv
                  }
                }
              }
              // insert afterContainer into parent's layout children immediately after original container
              if (containerIndexInParent >= 0) {
                children.add(containerIndexInParent + 1, afterContainer)
                afterContainer.parent = this
                (view as? ViewGroup)?.let { view ->
                  view.indexOfChild(reference.container as? View).takeIf { it > -1 }?.let {
                    view.addView(afterContainer.view as? View, it + 1)
                  }
                }
                if (afterContainer.nativePtr != 0L) {
                  NativeHelpers.nativeNodeAddChild(
                    mason.nativePtr,
                    nativePtr,
                    afterContainer.nativePtr
                  )
                }
              } else {
                // fallback: append
                children.add(afterContainer)
                afterContainer.parent = this


                (view as? ViewGroup)?.let { view ->
                  view.indexOfChild(reference.container as? View).takeIf { it > -1 }?.let {
                    view.addView(afterContainer.view as? View, it + 1)
                  }
                }

                if (afterContainer.nativePtr != 0L) {
                  NativeHelpers.nativeNodeAddChild(
                    mason.nativePtr,
                    nativePtr,
                    afterContainer.nativePtr
                  )
                }
              }
            }

            // remove the reference text node from the original container
            containerNode.children.removeAt(idxInContainer)
            reference.container?.engine?.invalidateInlineSegments()
            reference.parent = null
            reference.container = null

            // if original container is now empty, remove it from this node
            if (containerNode.children.isEmpty()) {
              val pIdx = children.indexOf(containerNode)
              if (pIdx >= 0) {
                children.removeAt(pIdx)
                NodeUtils.removeView(this, containerNode.view as? View)
              }
            }

            // Determine insertion index in this.children for the element `child`.
            // Cases:
            // - left & right: replace original container position with [leftContainer (already there), child, afterContainer]
            // - left only: insert child after containerNode
            // - right only: replace containerNode with [child, afterContainer]
            // - neither: replace containerNode with child
            when {
              hasLeft && hasRight -> {
                // original container remains (left). Insert child after it.
                val pos = children.indexOf(containerNode)
                val insertPos = if (pos >= 0) pos + 1 else children.size
                children.add(insertPos, child)
                child.parent = this
                NodeUtils.addView(this, child.view as? View)
              }

              hasLeft && !hasRight -> {
                // original container remains as left, insert child after it
                val pos = children.indexOf(containerNode)
                val insertPos = if (pos >= 0) pos + 1 else children.size
                children.add(insertPos, child)
                child.parent = this
                NodeUtils.addView(this, child.view as? View)
              }

              !hasLeft && hasRight -> {
                // replace original container with child, afterContainer is already inserted after
                val pos =
                  containerIndexInParent.takeIf { it >= 0 } ?: children.indexOf(containerNode)
                if (pos >= 0) {
                  children[pos] = child
                } else {
                  children.add(child)
                }
                child.parent = this
                NodeUtils.addView(this, child.view as? View)
              }

              else -> {
                // neither left nor right -> containerNode was sole child, replace it with child
                val pos =
                  containerIndexInParent.takeIf { it >= 0 } ?: children.indexOf(containerNode)
                if (pos >= 0) {
                  children[pos] = child
                } else {
                  children.add(child)
                }
                child.parent = this
                NodeUtils.addView(this, child.view as? View)
              }
            }

            // Single invalidation pass for the newly inserted child
            invalidateDescendantTextViews(child, TextStyleChangeMask.ALL)

            // sync native/layout trees
            NodeUtils.syncNode(this, children)
            if (!style.inBatch) {
              (view as? Element)?.invalidateLayout()
            }
            return
          }
        }
      }

      // default non-text replacement (when reference is not a text node in an anonymous container)
      children[idx] = child
      child.parent = this
      reference.parent = null
      NodeUtils.removeView(this, reference.view as? View)
      NodeUtils.addView(this, child.view as? View)

      // Single invalidation pass for the newly inserted child
      invalidateDescendantTextViews(child, TextStyleChangeMask.ALL)

      NodeUtils.syncNode(this, children)
      if (!style.inBatch) {
        if (child.view is TextContainer) {
          (child.view as? View)?.invalidate()
        }
        (view as? Element)?.invalidateLayout()
      }
    }
  }

  fun addChildAt(child: Node, index: Int) {
    if (index <= -1) {
      appendChild(child)
      return
    }
    val authorChildren = getChildren()
    // if index is past end, fall back to append behavior
    if (index >= authorChildren.size) {
      appendChild(child)
      return
    }

    val reference = authorChildren[index]

    // Inserting a TextNode
    if (child is TextNode) {
      // If we're inserting next to/in a text container, try to insert into that container
      if (reference is TextNode) {
        val containerNode = reference.layoutParent ?: reference.container?.node
        if (containerNode != null && containerNode.parent == this) {
          val idxInContainer =
            containerNode.children.indexOf(reference).takeIf { it > -1 } ?: return
          // Insert the new text node before 'reference' inside the same anonymous container
          containerNode.children.add(idxInContainer, child)
          child.parent = containerNode
          (containerNode.view as? TextView)?.let { tv ->
            child.attributes.sync(tv.style)
            child.container = tv
            tv.engine.invalidateInlineSegments()
          }
          if (!style.inBatch) {
            (containerNode as? Element)?.invalidateLayout()
          }
          NodeUtils.invalidateLayout(this)
          return
        }
      }

      // Reference is not a text node (or not in an anonymous text container).
      // Create an anonymous text container and insert it at the index.
      val container = getOrCreateAnonymousTextContainer(append = false, checkLast = false)
      container.children.clear()
      container.children.add(child)
      child.parent = container
      (container.view as? TextView)?.let {
        child.attributes.sync(it.node.style)
        child.container = it
        it.engine.invalidateInlineSegments()
      }

      val refPos = children.indexOf(reference).takeIf { it >= 0 } ?: 0
      children.add(refPos, container)
      container.parent = this
      // ensure the view/native tree gets updated via NodeUtils
      NodeUtils.addView(this, container.view as? View)

      NodeUtils.syncNode(this, children)
      if (!style.inBatch) {
        (view as? Element)?.invalidateLayout()
      }
      NodeUtils.invalidateLayout(this)
      return
    }

    // Inserting a non-TextNode (element). If the reference is a TextNode inside an anonymous
    // text container we must split that container so the element can be inserted between text runs.
    if (reference is TextNode) {
      val containerNode = reference.layoutParent ?: reference.container?.node
      if (containerNode != null && containerNode.parent == this) {
        val idxInContainer = containerNode.children.indexOf(reference).takeIf { it > -1 } ?: -1
        if (idxInContainer >= 0) {
          val containerIndexInParent = children.indexOf(containerNode).takeIf { it > -1 } ?: -1
          if (containerIndexInParent < 0) {
            // fallback to naive insert (shouldn't happen for anonymous text containers)
            val insertIndex = children.indexOf(reference).takeIf { it >= 0 } ?: index
            val pos = insertIndex.coerceAtLeast(0).coerceAtMost(children.size)
            children.add(pos, child)
            child.parent = this
            NodeUtils.addView(this, child.view as? View)
            NodeUtils.syncNode(this, children)
            if (!style.inBatch) {
              (view as? Element)?.invalidateLayout()
            }
            NodeUtils.invalidateLayout(this)
            return
          }

          // left = nodes before idxInContainer
          val leftSlice = containerNode.children.subList(0, idxInContainer).toList()
          // right = nodes starting at idxInContainer (the reference and any after) -> these become afterContainer
          val rightSlice =
            containerNode.children.subList(idxInContainer, containerNode.children.size).toList()

          // rebuild original container as the left part (or it will be removed if leftSlice empty)
          containerNode.children.clear()
          if (leftSlice.isNotEmpty()) {
            for (n in leftSlice) {
              containerNode.children.add(n)
              n.parent = containerNode
            }
            (containerNode.view as? TextView)?.let { tv ->
              containerNode.children.forEach { tn ->
                (tn as? TextNode)?.let {
                  tn.attributes.sync(tv.style)
                  tn.container = tv
                }
              }
              tv.engine.invalidateInlineSegments()
            }
            (containerNode.view as? Element)?.invalidateLayout()
          }

          // create afterContainer for the right slice (reference + following text nodes)
          var afterContainer: Node? = null
          if (rightSlice.isNotEmpty()) {
            afterContainer = getOrCreateAnonymousTextContainer(append = false, checkLast = false)
            afterContainer.children.clear()
            for (n in rightSlice) {
              afterContainer.children.add(n)
              n.parent = afterContainer
              (afterContainer.view as? TextView)?.let { tv ->
                (n as? TextNode)?.let {
                  n.attributes.sync(tv.style)
                  n.container = tv
                }
              }
            }
            (afterContainer.view as? TextView)?.engine?.invalidateInlineSegments()
            (afterContainer.view as? TextView)?.invalidateLayout()
          }

          // Replace in this.children so that final order = [ ... leftContainer? , child, afterContainer? ]
          if (leftSlice.isNotEmpty()) {
            // containerNode already at containerIndexInParent represents left
            val insertPos = containerIndexInParent + 1
            children.add(insertPos, child)
            child.parent = this
            if (afterContainer != null) {
              children.add(insertPos + 1, afterContainer)
              afterContainer.parent = this
              // add view for after-container
              NodeUtils.addView(this, afterContainer.view as? View)
            }
          } else {
            // no left — replace original containerNode with child (and maybe afterContainer)
            val replacePos = containerIndexInParent
            children.removeAt(replacePos)
            children.add(replacePos, child)
            child.parent = this
            if (afterContainer != null) {
              children.add(replacePos + 1, afterContainer)
              afterContainer.parent = this
              if (afterContainer.nativePtr != 0L) {
                NativeHelpers.nativeNodeAddChild(
                  mason.nativePtr,
                  nativePtr,
                  afterContainer.nativePtr
                )
              }
              NodeUtils.addView(this, afterContainer.view as? View)
            } else {
              // nothing left and nothing right -> container removed
              NodeUtils.removeView(this, containerNode.view as? View)
            }
          }

          // ensure all affected nodes are invalidated so layout recomputes correctly
          (containerNode.view as? Element)?.invalidateLayout()
          (afterContainer?.view as? Element)?.invalidateLayout()
          (child.view as? Element)?.invalidateLayout()

          // Single invalidation pass
          invalidateDescendantTextViews(child, TextStyleChangeMask.ALL)

          // sync views/native tree once using the updated children vector
          NodeUtils.syncNode(this, children)
          // ensure child view is added, then sync
          NodeUtils.addView(this, child.view as? View)
          NodeUtils.syncNode(this, children)
          if (!style.inBatch) {
            (view as? Element)?.invalidateLayout()
          }
          NodeUtils.invalidateLayout(this)
          return
        }
      }
    }

    // Default: simple insert at index among author children (non-text splitting cases)
    val insertIndex = children.indexOf(reference).takeIf { it >= 0 } ?: index
    val pos = insertIndex.coerceAtLeast(0).coerceAtMost(children.size)
    children.add(pos, child)
    child.parent = this
    if (child.nativePtr != 0L) {
      if (child.view is View) {
        NodeUtils.addView(this, child.view as? View)
      } else {
        NativeHelpers.nativeNodeAddChild(mason.nativePtr, nativePtr, child.nativePtr)
      }
    }

    // Single invalidation pass
    invalidateDescendantTextViews(child, TextStyleChangeMask.ALL)

    NodeUtils.syncNode(this, children)
    if (!style.inBatch) {
      (view as? Element)?.invalidateLayout()
    }
    NodeUtils.invalidateLayout(this)
  }

  fun removeChildAt(index: Int): Node? {
    if (index < 0) {
      return null
    }
    val children = getChildren()
    if (index >= children.size) {
      return null
    }
    val reference = children[index]
    val idx =
      reference.layoutParent?.children?.indexOf(reference)?.takeIf { it > -1 } ?: return null
    val removed = reference.layoutParent?.children?.removeAt(idx) ?: return null
    if (removed is TextNode) {
      removed.container?.engine?.invalidateInlineSegments()
      removed.container = null
      if (reference.layoutParent?.children?.isEmpty() == true) {
        reference.layoutParent?.layoutParent?.let {
          NodeUtils.removeView(it, reference.layoutParent?.view as? View)
        }
        reference.layoutParent?.parent = null
        NodeUtils.syncNode(this, children)
      }
    } else {
      NodeUtils.removeView(reference.parent!!, removed.view as View)
      NativeHelpers.nativeNodeRemoveChild(mason.nativePtr, nativePtr, removed.nativePtr)
      removed.parent = null
      NodeUtils.invalidateLayout(this, true)
    }
    return removed
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
        val view = this@Node.view as? View
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
    if (children.isEmpty()) {
      return null
    }
    val nodes = getChildren()
    val idx = nodes.indexOf(child).takeIf { it > -1 } ?: return null
    return removeChildAt(idx)
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

  private var mAttributes: TextDefaultAttributes? = null

  internal val attributes: TextDefaultAttributes
    get() {
      if (mAttributes == null) {
        mAttributes = TextDefaultAttributes.empty()
      }
      return mAttributes!!
    }
}


internal fun Node.getDefaultAttributes(): TextDefaultAttributes {
  attributes.sync(style)
  return attributes
}
