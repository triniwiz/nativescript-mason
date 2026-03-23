package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.ListStyleType
import kotlin.math.max


class Li @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null
) : View(context, attrs, 0, true), MeasureFunc {

  var holder: ListView.Holder? = null
  var position: Int = -1
  var isOrdered: Boolean = false

  internal var marker = ""

  internal fun setMarkerValue(value: String) {
    marker = value
  }

  constructor(context: Context, mason: Mason) : this(context) {
    node = mason.createListItemNode(this).apply {
      view = this@Li
    }
    node.style.setStyleChangeListener(this)
  }

  init {
    node = Mason.shared.createListItemNode(this).apply {
      view = this@Li
    }
    node.style.setStyleChangeListener(this)
  }

  /**
   * Reset view state for recycling.
   */
  internal fun resetForRecycle() {
    position = -1
    isOrdered = false
    marker = ""
    markerWidth = 0f
    markerHeight = 0f
    markerSize = 0f
  }

  override fun dispatchDraw(canvas: Canvas) {
    // Draw children's outset box shadows first at parent level
    ViewUtils.drawChildrenOutsetShadows(this, canvas)

    ViewUtils.dispatchDraw(this, canvas, style) {
      drawMarker(it)
      // Call ViewGroup.dispatchDraw directly to draw children, avoiding
      // View's dispatchDraw which would double-wrap with ViewUtils.
      dispatchDrawChildren(it)
    }
  }

  private fun drawMarker(canvas: Canvas) {
    if (markerWidth <= 0) return

    val listType = resolveListStyleType()
    if (listType == ListStyleType.None.value) return

    val fm = style.paint.fontMetrics
    val baseline = findFirstTextBaseline(this@Li).takeIf { it != -1 } ?: (-fm.ascent).toInt()

    val oldPaintStyle = style.paint.style
    val oldStroke = style.paint.strokeWidth
    style.paint.style = Paint.Style.FILL

    when (listType) {
      ListStyleType.Custom.value -> {
        if (marker.isNotEmpty()) {
          canvas.drawText(marker, 0f, baseline.toFloat(), style.paint)
        }
      }

      ListStyleType.Disc.value -> {
        val r = markerSize / 2f
        val cy = baseline - fm.descent / 2f
        canvas.drawCircle(r, cy, r, style.paint)
      }

      ListStyleType.Circle.value -> {
        val r = markerSize / 2f
        val cy = baseline - fm.descent / 2f
        style.paint.style = Paint.Style.STROKE
        style.paint.strokeWidth = max(1f, style.paint.textSize * 0.08f)
        canvas.drawCircle(r, cy, r, style.paint)
      }

      ListStyleType.Square.value -> {
        val half = markerSize / 2f
        val cy = baseline - fm.descent / 2f
        canvas.drawRect(0f, cy - half, markerSize, cy + half, style.paint)
      }

      ListStyleType.Decimal.value -> {
        if (position > -1) {
          val text = "${position + 1}."
          canvas.drawText(text, 0f, baseline.toFloat(), style.paint)
        }
      }

      else -> {}
    }

    style.paint.style = oldPaintStyle
    style.paint.strokeWidth = oldStroke
  }

  private fun findFirstTextBaseline(view: android.view.View): Int {
    if (view is android.widget.TextView) {
      return view.baseline
    }
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val child = view.getChildAt(i)
        val baseline = findFirstTextBaseline(child)
        if (baseline != -1) return baseline + child.top
      }
    }
    return -1
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    when (parent) {
      is ListView.MasonRecyclerView -> {
        node.dirty()
        if (!node.mason.inCompute) {
          val width = mapMeasureSpec(specWidthMode, specWidth).value
          var height = mapMeasureSpec(specHeightMode, specHeight).value

          if (specHeightMode == MeasureSpec.UNSPECIFIED) {
            height = -2f
          }
          compute(width, height)
          layoutFlat()
        }
      }

      !is Element -> {
        if (!node.mason.inCompute) {
          compute(
            mapMeasureSpec(specWidthMode, specWidth).value,
            mapMeasureSpec(specHeightMode, specHeight).value
          )
          layoutFlat()
        }
      }

      else -> {}
    }

    if (node.layoutTree.nodeCount == 0) {
      setMeasuredDimension(0, 0)
      return
    }

    val width = node.computedWidth.toInt()
    val height = node.computedHeight.toInt()
    setMeasuredDimension(width, height)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    if (parent !is Element || parent is ListView.MasonRecyclerView) {
      layoutFlat()
    }
    applyLayoutFlat(node, node.layoutTree)

    // Ensure children are offset by markerWidth so the marker has room.
    // This mirrors iOS's sublayerTransform approach — if Taffy's internal
    // marker node already reserved the space, children will already be at
    // x >= markerWidth and no additional offset is needed.  When the Taffy
    // measure function was not invoked (the common edge case), children
    // sit at x=0 and we shift them here.
    val offset = markerWidth.toInt()
    if (offset > 0 && childCount > 0) {
      val firstChild = getChildAt(0)
      val needed = offset - firstChild.left
      if (needed > 0) {
        for (i in 0 until childCount) {
          val child = getChildAt(i)
          child.layout(
            child.left + needed, child.top,
            child.right + needed, child.bottom
          )
        }
      }
    }
  }

  internal var markerWidth: Float = 0f
  internal var markerHeight: Float = 0f
  private var markerSize: Float = 0f
  internal var counter: Int = -1

  /**
   * Eagerly compute marker dimensions from the current position, ordered
   * mode, and list-style-type — independent of whether Taffy's internal
   * marker-node measure function fires.  Mirrors iOS's calculateMarkerMetrics().
   */
  internal fun calculateMarkerMetrics() {
    val listStyleType = resolveListStyleType()

    if (listStyleType == ListStyleType.None.value) {
      markerWidth = 0f
      markerHeight = 0f
      markerSize = 0f
      return
    }

    val paint = style.paint
    val fm = paint.fontMetrics
    val textHeight = fm.descent - fm.ascent

    markerSize = paint.textSize * 0.35f

    val width: Float = when (listStyleType) {
      ListStyleType.None.value -> 0f

      ListStyleType.Custom.value -> {
        if (marker.isNotEmpty()) paint.measureText(marker) else 0f
      }

      ListStyleType.Disc.value, ListStyleType.Circle.value, ListStyleType.Square.value -> {
        markerSize
      }

      ListStyleType.Decimal.value -> {
        if (position > -1) {
          paint.measureText("${position + 1}.")
        } else {
          paint.measureText("0.")
        }
      }

      else -> 0f
    }

    val gap = paint.textSize * 0.5f
    markerWidth = width + gap
    markerHeight = textHeight
  }

  internal fun resolveListStyleType(): Byte {
    val recycler = parent as? ListView.MasonRecyclerView
    val parentListView = recycler?.parent as? ListView

    if (parentListView?.style?.isValueInitialized == true) {
      val isSet =
        parentListView.style.values.get(StyleKeys.LIST_STYLE_TYPE_STATE) != StyleState.INHERIT
      if (isSet) {
        return parentListView.style.values.get(StyleKeys.LIST_STYLE_TYPE)
      }
    }

    if (style.isValueInitialized) {
      val isSet = style.values.get(StyleKeys.LIST_STYLE_TYPE_STATE) != StyleState.INHERIT
      if (isSet) {
        return style.values.get(StyleKeys.LIST_STYLE_TYPE)
      }
    }

    return if (isOrdered) {
      ListStyleType.Decimal.value
    } else {
      ListStyleType.Disc.value
    }
  }

  override fun measure(
    knownWidth: Float, knownHeight: Float,
    availableWidth: Float, availableHeight: Float
  ): Long {
    // Use the Android view hierarchy (same as resolveListStyleType) so that
    // recycled items inside the RecyclerView correctly pick up the parent
    // ListView's ordered flag — node.parent (Taffy tree) may not reflect the
    // actual view hierarchy for recycled items.
    val recycler = parent as? ListView.MasonRecyclerView
    (recycler?.parent as? ListView)?.let {
      isOrdered = it.isOrdered
    }

    val listStyleType = resolveListStyleType()

    if (listStyleType == ListStyleType.None.value) {
      markerWidth = 0f
      markerHeight = 0f
      markerSize = 0f
      return MeasureOutput.ZERO
    }

    val paint = style.paint
    val fm = paint.fontMetrics
    val textHeight = fm.descent - fm.ascent

    markerSize = paint.textSize * 0.35f

    val width: Float = when (listStyleType) {
      ListStyleType.None.value -> 0f

      ListStyleType.Custom.value -> {
        if (marker.isNotEmpty()) {
          paint.measureText(marker)
        } else {
          0f
        }
      }

      ListStyleType.Disc.value, ListStyleType.Circle.value, ListStyleType.Square.value -> {
        markerSize
      }

      ListStyleType.Decimal.value -> {
        if (position > -1) {
          paint.measureText("${position + 1}.")
        } else {
          paint.measureText("0.")
        }
      }

      else -> 0f
    }

    val gap = paint.textSize * 0.5f
    markerWidth = width + gap
    markerHeight = textHeight

    return MeasureOutput.make(markerWidth, markerHeight)
  }
}
