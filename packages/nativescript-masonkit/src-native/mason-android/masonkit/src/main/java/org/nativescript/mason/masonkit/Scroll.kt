package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.Overflow
import kotlin.math.min

class Scroll @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0, override: Boolean = false
) : TwoDScrollView(context, attrs), Element {

  internal lateinit var scrollRoot: View

  override val view: android.view.View
    get() = this

  override val style: Style
    get() = node.style

  override var enableScrollX: Boolean
    get() {
      return when (val value = node.style.values.get(StyleKeys.OVERFLOW_X)) {
        Overflow.Scroll.value, Overflow.Auto.value -> true
        Overflow.Visible.value, Overflow.Hidden.value, Overflow.Clip.value -> false
        else -> throw IllegalArgumentException("Unknown overflow enum value: $value")
      }
    }
    set(value) {}

  override var enableScrollY: Boolean
    get() {
      return when (val value = node.style.values.get(StyleKeys.OVERFLOW_Y)) {
        Overflow.Scroll.value, Overflow.Auto.value -> true
        Overflow.Visible.value, Overflow.Hidden.value, Overflow.Clip.value -> false
        else -> throw IllegalArgumentException("Unknown overflow enum value: $value")
      }
    }
    set(value) {}

  override val node: Node
    get() {
      return scrollRoot.node
    }

  constructor(context: Context, mason: Mason) : this(context, null, 0, true) {
    scrollRoot = View(context, mason).apply {
      isScrollRoot = true
    }

    super.addView(
      scrollRoot, LayoutParams(
        LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT
      )
    )
  }

  init {
    if (!override) {
      if (!::scrollRoot.isInitialized) {
        scrollRoot = View(context, attrs, defStyleAttr).apply {
          isScrollRoot = true
        }

        super.addView(
          scrollRoot, LayoutParams(
            LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT
          )
        )

      }
    }

    // handle clipping manually
    clipChildren = false
    clipToPadding = false
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach {
      it.shader = null
      it.shaderWidth = -1
      it.shaderHeight = -1
    } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
  }

  override fun dispatchDraw(canvas: Canvas) {
    // Draw children's outset box shadows first at parent level
    ViewUtils.drawChildrenOutsetShadows(this, canvas)

    ViewUtils.dispatchDraw(this, canvas, style) {
      super.dispatchDraw(it)
    }
  }

  override fun addView(child: android.view.View) {
    if (child == this) {
      return
    }
    if (child == scrollRoot) {
      if (scrollRoot.parent == this) {
        return
      }
      super.addView(child)
    } else {
      scrollRoot.addView(child)
    }
  }

  override fun addView(child: android.view.View, width: Int, height: Int) {
    if (child == scrollRoot) {
      if (scrollRoot.parent == this) {
        return
      }
      super.addView(child, width, height)
    } else {
      scrollRoot.addView(child, width, height)
    }
  }

  override fun addView(
    child: android.view.View, index: Int, params: ViewGroup.LayoutParams
  ) {
    if (child == scrollRoot) {
      if (scrollRoot.parent == this) {
        return
      }
      super.addView(child, index, params)
    } else {
      scrollRoot.addView(child, index, params)
    }
  }

  override fun addView(child: android.view.View, index: Int) {
    if (child == scrollRoot) {
      if (scrollRoot.parent == this) {
        return
      }
      super.addView(child, index)
    } else {
      scrollRoot.addView(child, index)
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // run the base TwoDScrollView logic first so its internal state (focus
    // handling, scroll offsets, dirty flags) stays consistent.  previously we
    // *replaced* onLayout entirely, which meant that scrollTo() and other
    // bookkeeping never ran and could lead to visual glitches during scrolling
    // or after dynamic re-layout.  Super will lay out the scrollRoot at its
    // measured size; we then immediately overwrite those bounds with the
    // engine's output.
    super.onLayout(changed, l, t, r, b)

    // Apply layout for the inner scroll root so its native children are
    // positioned according to the engine's results.  We run compute/layout
    // inside the inner view during measure, so here we just attach and apply
    // the layout produced for the scroll root.
    if (parent !is Element) {
      scrollRoot.layoutFlat()
    }
    if (scrollRoot.node.layoutTree.nodeCount != 0) {
      applyLayoutFlat(scrollRoot.node, scrollRoot.node.layoutTree)
    }

    // restore scroll position
    scrollTo(scrollX, scrollY)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    if (parent !is Element) {
      // Let the inner scroll root perform the compute/layout work in its
      // onMeasure.  For vertical scrolling we give the inner view an
      // unspecified height so it can grow to its content size.
      val childWidthSpec = if (enableScrollX) {
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      } else {
        MeasureSpec.makeMeasureSpec(specWidth, MeasureSpec.EXACTLY)
      }
      val childHeightSpec = if (enableScrollY) {
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      } else {
        heightMeasureSpec
      }

      scrollRoot.measure(childWidthSpec, childHeightSpec)

      val measuredH = when (specHeightMode) {
        MeasureSpec.EXACTLY -> specHeight
        MeasureSpec.AT_MOST -> min(specHeight, scrollRoot.measuredHeight)
        else -> scrollRoot.measuredHeight
      }

      setMeasuredDimension(specWidth, measuredH)
    } else {
      setMeasuredDimension(specWidth, specHeight)
    }

  }

  override fun generateDefaultLayoutParams(): LayoutParams {
    return LayoutParams(
      LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT
    )
  }
}
