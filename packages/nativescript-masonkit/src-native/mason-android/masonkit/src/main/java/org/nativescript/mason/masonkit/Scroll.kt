package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.ViewGroup
import androidx.core.graphics.withSave
import org.nativescript.mason.masonkit.enums.Overflow
import kotlin.math.min

/**
 * A single-view scrolling container backed by the Mason layout engine.
 *
 * Children are added directly to this view; there is no inner scroll-root.
 * Layout computation is driven by the Rust engine via [computeAndLayout],
 * and the resulting content dimensions are forwarded to [TwoDScrollView]'s
 * [scrollContentWidth] / [scrollContentHeight] for scroll-range calculations.
 */
class Scroll @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0, override: Boolean = false
) : TwoDScrollView(context, attrs), Element, StyleChangeListener {

  override lateinit var node: Node

  override val view: android.view.View
    get() = this

  override val style: Style
    get() = node.style

  // Effective scroll enable — updated after measurement for `auto` mode.
  private var _enableScrollX: Boolean = false
  private var _enableScrollY: Boolean = false

  override var enableScrollX: Boolean
    get() = _enableScrollX
    set(value) { _enableScrollX = value }

  override var enableScrollY: Boolean
    get() = _enableScrollY
    set(value) { _enableScrollY = value }

  private fun isScrollableX(): Boolean {
    return node.style.values.get(StyleKeys.OVERFLOW_X) == Overflow.Scroll.value
  }

  private fun isScrollableY(): Boolean {
    return node.style.values.get(StyleKeys.OVERFLOW_Y) == Overflow.Scroll.value
  }

  private fun isAutoX(): Boolean {
    return node.style.values.get(StyleKeys.OVERFLOW_X) == Overflow.Auto.value
  }

  // Default `visible` on Y acts as `auto` (web-like); horizontal stays non-scrolling
  // to avoid surprise sideways scroll. Explicit `hidden`/`clip`/`scroll` override.
  private fun isAutoY(): Boolean {
    val v = node.style.values.get(StyleKeys.OVERFLOW_Y)
    return v == Overflow.Auto.value || v == Overflow.Visible.value
  }

  constructor(context: Context, mason: Mason) : this(context, null, 0, true) {
    node = mason.createNode().apply {
      view = this@Scroll
    }
    node.style.setStyleChangeListener(this)
  }

  init {
    if (!override) {
      if (!::node.isInitialized) {
        node = Mason.shared.createNode().apply {
          view = this@Scroll
        }
        node.style.setStyleChangeListener(this)
      }
    }
    clipChildren = false
    clipToPadding = false
  }

  override fun onChange(low: Long, high: Long) {
    Node.invalidateDescendantTextViews(node, low, high)
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach {
      it.shader = null
      it.shaderWidth = -1
      it.shaderHeight = -1
    }
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
  }

  override fun dispatchDraw(canvas: Canvas) {
    ViewUtils.dispatchDraw(this, canvas, style, beforeChildren = { c ->
      c.withSave {
        clipScrollViewport(this)
        ViewUtils.drawChildrenOutsetShadows(this@Scroll, this)
      }
    }) {
      it.withSave {
        clipScrollViewport(this)
        super.dispatchDraw(this)
      }
    }
  }

  private fun clipScrollViewport(canvas: Canvas) {
    val left = scrollX + paddingLeft
    val top = scrollY + paddingTop
    val right = scrollX + width - paddingRight
    val bottom = scrollY + height - paddingBottom

    if (right > left && bottom > top) {
      canvas.clipRect(left, top, right, bottom)
    }
  }

  // addView: manage Mason node tree, then delegate to FrameLayout

  override fun addView(child: android.view.View) {
    child ?: return
    if (child == this) return
    val childNode = if (child is Element) child.node else node.mason.nodeForView(child)
    if (node.suppressChildOps > 0) { super.addView(child); return }
    if (childNode.parent == node) { super.addView(child); return }
    node.appendChild(childNode)
  }

  override fun addView(child: android.view.View, index: Int) {
    child ?: return
    val childNode = if (child is Element) child.node else node.mason.nodeForView(child)
    if (node.suppressChildOps > 0) { super.addView(child, index); return }
    if (childNode.parent == node) { super.addView(child, index); return }
    node.addChildAt(childNode, index)
  }

  override fun addView(child: android.view.View, params: ViewGroup.LayoutParams) {
    child ?: return
    val childNode = if (child is Element) child.node else node.mason.nodeForView(child)
    if (node.suppressChildOps > 0) { super.addView(child, params); return }
    if (childNode.parent == node) { super.addView(child, params); return }
    node.appendChild(childNode)
  }

  override fun addView(child: android.view.View, index: Int, params: ViewGroup.LayoutParams) {
    child ?: return
    val childNode = if (child is Element) child.node else node.mason.nodeForView(child)
    if (node.suppressChildOps > 0) { super.addView(child, index, params); return }
    if (childNode.parent == node) { super.addView(child, index, params); return }
    node.addChildAt(childNode, index)
  }

  // removeView is the inverse of addView — drop the mason node (which detaches
  // the android view under suppression via NodeUtils.removeView) so removals
  // don't orphan the node and leave stale layout slots.

  override fun removeView(view: android.view.View?) {
    view ?: return
    val childNode = if (view is Element) view.node else node.mason.nodeForView(view)
    if (node.suppressChildOps > 0) { super.removeView(view); return }
    if (childNode.parent == node) {
      node.removeChild(childNode)
      return
    }
    super.removeView(view)
  }

  override fun removeViewAt(index: Int) {
    if (node.suppressChildOps > 0) { super.removeViewAt(index); return }
    node.removeChildAt(index)
  }

  // Measurement

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)
    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    if (parent !is Element) {
      if (!node.mason.inCompute) {
        val widthArg = View.mapMeasureSpec(specWidthMode, specWidth).value
        val heightArg = if (specHeightMode == MeasureSpec.EXACTLY && specHeight == 0) {
          -2f // MaxContent
        } else {
          View.mapMeasureSpec(specHeightMode, specHeight).value
        }

        computeAndLayout(widthArg, heightArg)

        if (node.layoutTree.nodeCount == 0) {
          setMeasuredDimension(0, 0)
          return
        }

        val computedW = node.computedWidth.toInt()
        val computedH = node.computedHeight.toInt()

        val measuredW = if (specWidthMode == MeasureSpec.EXACTLY) specWidth else computedW
        val measuredH = when (specHeightMode) {
          MeasureSpec.EXACTLY -> specHeight
          MeasureSpec.AT_MOST -> min(specHeight, computedH)
          else -> computedH
        }

        updateScrollState(measuredW, measuredH)

        setMeasuredDimension(measuredW, measuredH)
      } else {
        setMeasuredDimension(specWidth, specHeight)
      }
    } else {
      setMeasuredDimension(specWidth, specHeight)
    }
  }

  /**
   * Update [_enableScrollX], [_enableScrollY], [scrollContentWidth], and
   * [scrollContentHeight] from the current layout-tree data.  Called after
   * the layout engine has computed this node.
   */
  private fun updateScrollState(viewportW: Int = -1, viewportH: Int = -1) {
    val computedW = node.computedWidth.toInt()
    val computedH = node.computedHeight.toInt()

    val nv = node.layoutTree.cursor
    nv.pointTo(0)
    val cw = nv.contentWidth.toInt()
    val ch = nv.contentHeight.toInt()

    // For a height:auto container computedH == contentH, so comparing them would
    // never report overflow. Use the actual laid-out viewport size instead.
    val vpW = when { viewportW >= 0 -> viewportW; width > 0 -> width; else -> computedW }
    val vpH = when { viewportH >= 0 -> viewportH; height > 0 -> height; else -> computedH }

    // Taffy content size (cw/ch) excludes the container's own padding; the
    // scrollable region must include it (the computed box), else the bottom
    // padding is unreachable. Use the larger of content size and computed box.
    val fullW = maxOf(cw, computedW)
    val fullH = maxOf(ch, computedH)

    _enableScrollX = isScrollableX() || (isAutoX() && fullW > vpW)
    _enableScrollY = isScrollableY() || (isAutoY() && fullH > vpH)

    scrollContentWidth = if (_enableScrollX) maxOf(fullW, vpW) else vpW
    scrollContentHeight = if (_enableScrollY) maxOf(fullH, vpH) else vpH
  }

  // Layout

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // Run base TwoDScrollView logic (focus, scroll-position clamping).
    super.onLayout(changed, l, t, r, b)

    if (parent !is Element) {
      // Only re-read the layout from Rust if we don't already have a
      // valid cached layout tree (computeAndLayout populates it during
      // onMeasure).  Re-reading via layoutFlat() can pick up stale Rust
      // state when spurious layout passes occur.
      if (node.layoutTree.nodeCount == 0) {
        layoutFlat()
      }
      if (node.layoutTree.nodeCount != 0) {
        applyLayoutFlat(node, node.layoutTree)
      }
    } else {
      // When laid out by a parent Element, the parent computed our layout.
      if (node.layoutTree.nodeCount > 0) {
        updateScrollState(r - l, b - t)
      }
    }

    scrollTo(scrollX, scrollY)
  }

  override fun generateDefaultLayoutParams(): LayoutParams {
    return LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
  }
}
