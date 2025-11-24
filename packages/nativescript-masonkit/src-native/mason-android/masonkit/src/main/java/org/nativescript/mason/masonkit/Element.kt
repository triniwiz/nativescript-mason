package org.nativescript.mason.masonkit

import android.os.Build
import android.util.Log
import android.util.SizeF
import android.view.View
import androidx.core.view.isGone
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.TextAlign

interface Element {
  val style: Style

  val node: Node

  fun syncStyle(state: String, textState: String) {
    val stateValue = state.toLongOrNull()?.takeIf { it > -1 }
    val textStateValue = textState.toLongOrNull()?.takeIf { it > -1 }

    textStateValue?.let { textStateValue ->
      val value = TextStateKeys(textStateValue)
      style.setOrAppendState(value)
    }

    stateValue?.let { stateValue ->
      style.isDirty = stateValue
      style.updateNativeStyle()
    }
  }

  fun onNodeAttached() {}

  fun onNodeDetached() {}

  fun markNodeDirty() {
    node.dirty()
  }

  fun isNodeDirty(): Boolean {
    return node.isDirty()
  }

  fun configure(block: (Style) -> Unit) {
    style.inBatch = true
    block(style)
    style.inBatch = false
  }

  val view: View

  fun layout(): Layout {
    if (node.nativePtr == 0L) {
      return Layout.empty
    }
    val layouts = NativeHelpers.nativeNodeLayout(node.mason.nativePtr, node.nativePtr)
    if (layouts.isEmpty()) {
      return Layout.empty
    }
    return Layout.fromFloatArray(layouts, 0).second
  }

  fun compute() {
    NativeHelpers.nativeNodeCompute(node.mason.nativePtr, node.nativePtr)
    node.computeCache = SizeF(-2f, -2f)
  }

  fun compute(width: Float, height: Float) {
    NativeHelpers.nativeNodeComputeWH(node.mason.nativePtr, node.nativePtr, width, height)
    node.computeCache = SizeF(width, height)
  }

  fun computeMaxContent() {
    NativeHelpers.nativeNodeComputeMaxContent(node.mason.nativePtr, node.nativePtr)
    node.computeCache = SizeF(-2f, -2f)
  }

  fun computeMinContent() {
    node.computeCache = SizeF(-2f, -2f)
    NativeHelpers.nativeNodeComputeMinContent(node.mason.nativePtr, node.nativePtr)
  }

  fun computeWithViewSize() {
    val width = view.width.toFloat()
    val height = view.height.toFloat()
    compute(width, height)
    node.computeCache = SizeF(width, height)
  }

  fun computeAndLayout(): Layout {
    return Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeAndLayout(
        node.mason.nativePtr,
        node.nativePtr,
      ), 0
    ).second
  }

  fun computeAndLayout(width: Float, height: Float): Layout {
    return Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeWithSizeAndLayout(
        node.mason.nativePtr,
        node.nativePtr,
        width, height
      ), 0
    ).second
  }

  fun computeWithSize(width: Float, height: Float) {
    compute(width, height)
    attachAndApply()
  }

  fun computeWithViewSize(layout: Boolean) {
    computeWithViewSize()
    if (layout) {
      attachAndApply()
    }
  }

  fun computeWithMaxContent() {
    computeMaxContent()
    attachAndApply()
  }

  fun computeWithMinContent() {
    computeMinContent()
    attachAndApply()
  }

  fun attachAndApply() {
    applyLayoutRecursive(node, layout())
  }

  fun append(element: Element) {
    node.appendChild(element.node)
  }

  fun append(text: String) {
    val textNode = TextNode(node.mason).apply {
      data = text
      if (this@Element is TextView) {
        container = this@Element
      }

      attributes.clear()
      // Copy current TextView attributes to the new text node
      attributes.putAll(getDefaultAttributes())
    }
    node.appendChild(textNode)
  }

  fun append(node: Node) {
    this.node.appendChild(node)
  }

  fun append(texts: Array<String>) {
    texts.forEach { append(it) }
  }

  fun append(elements: Array<Element>) {
    elements.forEach { append(it) }
  }

  fun append(nodes: Array<Node>) {
    nodes.forEach { append(it) }
  }

  fun prepend(element: Element) {
    node.addChildAt(element.node, 0)
  }

  fun prepend(string: String) {
    val textNode = TextNode(node.mason).apply {
      data = string
      if (this@Element is TextView) {
        container = this@Element
        // Copy current TextView attributes to the new text node
        attributes.clear()
        attributes.putAll(getDefaultAttributes())
      }
    }
    node.addChildAt(textNode, 0)
  }

  fun prepend(node: Node) {
    this.node.addChildAt(node, 0)
  }

  fun prepend(strings: Array<String>) {
    strings.reversed().forEach { prepend(it) }
  }

  fun prepend(elements: Array<Element>) {
    elements.reversed().forEach { prepend(it) }
  }

  fun prepend(nodes: Array<Node>) {
    nodes.reversed().forEach { prepend(it) }
  }

  fun invalidateLayout() {
    invalidateLayout(false)
  }

  fun invalidateLayout(invalidateRoot: Boolean) {
    node.dirty()
    val root = node.getRootNode() ?: node

    if (root.type == NodeType.Document) {
      // If root is document, use documentElement to compute

      root.document?.documentElement?.compute(
        root.computeCache.width,
        root.computeCache.height
      )

      root.document?.documentElement?.view?.invalidate()
      root.document?.documentElement?.view?.requestLayout()
      return
    }

    // Otherwise use the topmost element (root)
    if (root.view is Element && root.computeCacheDirty) {
      val width = if (root.computeCache.width == Float.MIN_VALUE) {
        -1f
      } else {
        root.computeCache.width
      }

      val height = if (root.computeCache.height == Float.MIN_VALUE) {
        -1f
      } else {
        root.computeCache.height
      }
      (root.view as Element).compute(width, height)
    }

    (root.view as? View)?.let {
      if (invalidateRoot) {
        root.dirty()
      }
      it.invalidate()
      it.requestLayout()
    }
  }


  fun appendView(view: View) {
    val child = node.mason.nodeForView(view)
    append(child)
  }

  fun appendView(views: Array<View>) {
    // todo use a single jni call
    views.forEach {
      appendView(it)
    }

  }

  fun prependView(view: View) {
    val child = node.mason.nodeForView(view)
    prepend(child)
  }

  fun prependView(views: Array<View>) {
    // todo use a single jni call
    views.reversed().forEach { prependView(it) }
  }

  fun addChildAt(text: String, index: Int) {
    node.addChildAt(TextNode(node.mason).apply {
      data = text
      if (this@Element is TextView) {
        container = this@Element
        attributes.clear()
        // Copy current TextView attributes to the new text node
        attributes.putAll(getDefaultAttributes())
      }
    }, index)
  }

  fun addChildAt(element: Element, index: Int) {
    node.addChildAt(element.node, index)
  }

  fun addChildAt(node: Node, index: Int) {
    node.addChildAt(node, index)
  }

  fun replaceChildAt(text: String, index: Int) {
    node.replaceChildAt(TextNode(node.mason).apply {
      data = text
      if (this@Element is TextView) {
        container = this@Element
        attributes.clear()
        // Copy current TextView attributes to the new text node
        attributes.putAll(getDefaultAttributes())
      }
    }, index)
  }

  fun replaceChildAt(element: Element, index: Int) {
    node.replaceChildAt(element.node, index)
  }

  fun replaceChildAt(node: Node, index: Int) {
    node.replaceChildAt(node, index)
  }

  fun removeChildAt(index: Int) {
    node.removeChildAt(index)
  }

}

internal fun Element.getDefaultAttributes(): Map<String, Any> {
  val resolvedFont = style.resolvedFontFace
 // todo replace with class
  return mapOf(
    "color" to style.resolvedColor,
    "fontSize" to style.resolvedFontSize,
    "fontWeight" to style.resolvedFontWeight,
    "fontStyle" to style.resolvedFontStyle,
    "fontFamily" to resolvedFont.fontFamily,
    "font" to resolvedFont,
    "textWrap" to style.resolvedTextWrap,
    "whiteSpace" to style.resolvedWhiteSpace,
    "textTransform" to style.resolvedTextTransform,
    "backgroundColor" to style.resolvedBackgroundColor,
    "decorationLine" to style.resolvedDecorationLine,
    "decorationColor" to style.resolvedDecorationColor,
    "decorationStyle" to style.resolvedDecorationStyle,
    "letterSpacing" to style.resolvedLetterSpacing,
    "lineHeight" to style.resolvedLineHeight,
    "lineHeightType" to style.resolvedLineHeightType,
    "textAlign" to when (style.resolvedTextAlign) {
      TextAlign.Left, TextAlign.Start -> android.text.Layout.Alignment.ALIGN_NORMAL
      TextAlign.Right, TextAlign.End -> android.text.Layout.Alignment.ALIGN_OPPOSITE
      TextAlign.Center -> android.text.Layout.Alignment.ALIGN_CENTER
      TextAlign.Justify -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          android.text.Layout.Alignment.ALIGN_NORMAL // Justify handled by justificationMode
        } else {
          android.text.Layout.Alignment.ALIGN_NORMAL
        }
      }

      else -> android.text.Layout.Alignment.ALIGN_NORMAL
    }
  )
}

internal fun Element.applyLayoutRecursive(node: Node, layout: Layout) {
  node.computedLayout = layout

  if (node.type != NodeType.Element) {
    return
  }

  (node.view as? View)?.let { view ->
    if (view != this) {
      var hasWidthConstraint = false
      var hasHeightConstraint = false
      if (view.isGone) {
        return
      }

      var overflow: Point<Overflow> = Point(Overflow.Visible, Overflow.Visible)
      var overFlowX = false
      var overFlowY = false
      var boxing = BoxSizing.BorderBox
      if (node.style.isValueInitialized) {
        boxing = node.style.boxSizing
        hasWidthConstraint = node.style.size.width != Dimension.Auto
        hasHeightConstraint = node.style.size.height != Dimension.Auto

        overflow = node.style.overflow

        overFlowX = when (overflow.x) {
          Overflow.Visible -> true
          Overflow.Hidden -> false
          Overflow.Scroll -> true
          Overflow.Clip -> false
          Overflow.Auto -> true
        }

        overFlowY = when (overflow.y) {
          Overflow.Visible -> true
          Overflow.Hidden -> false
          Overflow.Scroll -> true
          Overflow.Clip -> false
          Overflow.Auto -> true
        }
      }


      val x = layout.x.takeIf { !it.isNaN() }?.toInt() ?: 0
      val y = layout.y.takeIf { !it.isNaN() }?.toInt() ?: 0


      var width = layout.width.takeIf { !it.isNaN() }?.toInt() ?: 0
      var height = layout.height.takeIf { !it.isNaN() }?.toInt() ?: 0


      if (view !is Element) {
        // measured already grab dim
        width = view.measuredWidth
        height = view.measuredHeight
      }

      var right: Int = x + width
      var bottom: Int = y + height

      var clipX = false
      var clipY = false
      var contentWidth = 0
      var contentHeight = 0

      if (overFlowX) {
        contentWidth = if (boxing == BoxSizing.BorderBox) {
          x + (layout.contentSize.width
            + layout.border.left + layout.border.right
            + layout.padding.left + layout.padding.right).toInt()
        } else {
          layout.contentSize.width.toInt()
        }

        when (overflow.x) {
          Overflow.Visible -> {
            if (contentWidth > right) {
              right = contentWidth
            }
          }

          Overflow.Auto -> {
            if (contentWidth > right) {
              clipX = true
            }
          }

          Overflow.Scroll, Overflow.Clip, Overflow.Hidden -> {
            clipX = true
          }
        }
      }

      if (overFlowY) {
        contentHeight = if (boxing == BoxSizing.BorderBox) {
          y + (layout.contentSize.height
            + layout.border.top + layout.border.bottom
            + layout.padding.top + layout.padding.bottom).toInt()
        } else {
          layout.contentSize.height.toInt()
        }

        when (overflow.y) {
          Overflow.Visible -> {
            if (contentHeight > bottom) {
              bottom = contentHeight
            }
          }

          Overflow.Auto -> {
            if (contentHeight > bottom) {
              clipY = true
            }
          }

          Overflow.Scroll, Overflow.Clip, Overflow.Hidden -> {
            clipY = true
          }
        }
      }

      node.overflowWidth = contentWidth
      node.overflowHeight = contentHeight

      // only set padding on a text element
      if (view is TextView) {
        view.setPadding(
          layout.padding.left.toInt(),
          layout.padding.top.toInt(),
          layout.padding.right.toInt(),
          layout.padding.bottom.toInt()
        )
      }


      if (view is org.nativescript.mason.masonkit.View && view.isScrollRoot) {
        if (this !== view.parent) {
          (view.parent as? View)?.layout(x, y, right, bottom)
        }

        view.layout(
          0,
          0,
          if (clipX) {
            contentWidth
          } else {
            right
          },
          if (clipY) {
            contentHeight
          } else {
            bottom
          }
        )
      } else {
        view.layout(
          x, y, if (clipX) {
            contentWidth
          } else {
            right
          },
          if (clipY) {
            contentHeight
          } else {
            bottom
          }
        )
      }
    }
  }

  if (layout.children.isNotEmpty()) {
    val children = node.children.filter {
      if (it.nativePtr == 0L) {
        false
      } else if (node.parent?.view is TextView && node.view is TextView) {
        val flatten =
          (node.parent?.view as TextView).shouldFlattenTextContainer(node.view as TextView)
        !flatten
      } else {
        true
      }
    }

    for (i in 0 until children.count()) {
      val child = children[i]
      if (child.type == NodeType.Text) {
        continue
      }
      val layoutChild = layout.children[i]
      applyLayoutRecursive(child, layoutChild)

    }
  }
}
