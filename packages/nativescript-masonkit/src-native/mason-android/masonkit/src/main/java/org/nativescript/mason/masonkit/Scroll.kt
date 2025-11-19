package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.ViewGroup
import androidx.core.graphics.withSave
import org.nativescript.mason.masonkit.View.Companion.mapMeasureSpec
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Overflow

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
      val value = node.style.values.getInt(StyleKeys.OVERFLOW_X)
      return when (value) {
        2, 4 -> true
        0, 1, 3 -> false
        else -> throw IllegalArgumentException("Unknown overflow enum value: $value")
      }
    }
    set(value) {}


  override var enableScrollY: Boolean
    get() {
      val value = node.style.values.getInt(StyleKeys.OVERFLOW_Y)
      return when (value) {
        2, 4 -> true
        0, 1, 3 -> false
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
        LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT
      )
    )
  }

  init {
    // handle clipping manually
    clipChildren = false
    clipToPadding = false
    if (!override) {
      if (!::scrollRoot.isInitialized) {
        scrollRoot = View(context, attrs, defStyleAttr).apply {
          isScrollRoot = true
        }

        super.addView(
          scrollRoot, LayoutParams(
            LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT
          )
        )

      }
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    style.mBackground?.layers?.forEach { it.shader = null } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
  }


  internal val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  override fun dispatchDraw(canvas: Canvas) {
    if (!style.isValueInitialized) {
      super.dispatchDraw(canvas)
      return
    }

    val width = width.toFloat()
    val height = height.toFloat()

    canvas.withSave {
      Style.applyOverflowClip(style, canvas, node)

      style.mBackground?.let { background ->

        // Draw background color first
        background.color?.let { color ->
          paint.style = Paint.Style.FILL
          paint.color = color
          drawRect(0f, 0f, width, height, paint)
        }

        // Draw all layers
        background.layers.forEach { layer ->
          canvas.withSave {
            Style.applyClip(
              canvas, layer.clip, node
            )
            drawBackground(context, this@Scroll, layer, this, this.width, this.height)
          }
        }
      }

      style.mBorderRenderer.updateCache(width, height)
      style.mBorderRenderer.draw(this, width, height)


      super.dispatchDraw(this)
    }
  }

  override fun addView(child: android.view.View) {
    if (child != scrollRoot) {
      scrollRoot.addView(child)
    }
  }


  override fun addView(child: android.view.View, width: Int, height: Int) {
    if (child != scrollRoot) {
      scrollRoot.addView(child, width, height)
    }
  }

  override fun addView(
    child: android.view.View, index: Int, params: ViewGroup.LayoutParams
  ) {
    if (child == scrollRoot) {
      //  scrollRoot.addView(child, index, params)
      super.addView(child, index, params)
    } else {
      scrollRoot.addView(child, index, params)
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // todo cache layout
    val layout = layout()
    applyLayoutRecursive(node, layout)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    val availableWidth = mapMeasureSpec(specWidthMode, specWidth).value
    val availableHeight = mapMeasureSpec(specHeightMode, specHeight).value

    compute(
      availableWidth, availableHeight
    )
    val layout = layout()

    var width = layout.width.toInt()
    var height = layout.height.toInt()

    var boxing = BoxSizing.BorderBox

    if (style.isValueInitialized) {
      boxing = style.boxSizing
    }

    if (style.overflowX == Overflow.Visible) {
      width = if (boxing == BoxSizing.BorderBox) {
        (layout.x + layout.contentSize.width + layout.border.right + layout.border.left + layout.padding.right + layout.padding.left).toInt()
      } else {
        layout.contentSize.height.toInt()
      }
    }

    if (style.overflowY == Overflow.Visible) {
      height = if (boxing == BoxSizing.BorderBox) {
        (layout.y + layout.contentSize.height + layout.border.top + layout.border.bottom + layout.padding.top + layout.padding.bottom).toInt()
      } else {
        layout.contentSize.height.toInt()
      }
    }

    setMeasuredDimension(width, height)
  }

  override fun generateDefaultLayoutParams(): LayoutParams? {
    return LayoutParams(
      LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT
    )
  }
}
