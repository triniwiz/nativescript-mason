package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import org.nativescript.mason.masonkit.View.Companion.mapMeasureSpec
import org.nativescript.mason.masonkit.enums.ListStyleType
import kotlin.math.max


class Li @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : FrameLayout(context, attrs), Element, StyleChangeListener, MeasureFunc {

  var holder: ListView.Holder? = null
  var position: Int = -1
  var isOrdered: Boolean = false
  override lateinit var node: Node

  internal var marker = ""

  val content = FrameLayout(context, attrs)
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
    if (!override) {
      if (!::node.isInitialized) {
        node = Mason.shared.createListItemNode(this).apply {
          view = this@Li
        }
        node.style.setStyleChangeListener(this)
      }
    }

    addView(content)

    // css visible default
    clipChildren = false
    clipToPadding = false
  }

  override fun generateDefaultLayoutParams(): LayoutParams {
    return LayoutParams(
      LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT
    )
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
    ViewUtils.dispatchDraw(this, canvas, style) {
      if (markerWidth > 0) {
        // Get the resolved list style type, considering ordered mode
        val listType = resolveListStyleType()
        var x = 0f
        if (listType != ListStyleType.None.value) {
          val fm = style.paint.fontMetrics
          val baseline =
            findFirstTextBaseline(content)
              .takeIf { it != -1 }
              ?: run {
                // fallback: first line baseline
                (-fm.ascent).toInt()
              }

          val oldPaintStyle = style.paint.style
          val oldStroke = style.paint.strokeWidth
          // ensure fill for shapes
          style.paint.style = Paint.Style.FILL

          when (listType) {
            ListStyleType.Custom.value -> {
              // custom text marker
              if (marker.isNotEmpty()) {
                it.drawText(
                  marker, 0f, baseline.toFloat(), style.paint
                )
                x = style.paint.measureText(marker)
              }
            }

            ListStyleType.Disc.value -> {
              // filled disc
              val r = markerSize / 2f
              val cy = baseline - fm.descent / 2f
              it.drawCircle(r, cy, r, style.paint)
              x = markerSize
            }

            ListStyleType.Circle.value -> {
              // hollow circle
              val r = markerSize / 2f
              val cy = baseline - fm.descent / 2f

              style.paint.style = Paint.Style.STROKE
              style.paint.strokeWidth = max(1f, style.paint.textSize * 0.08f)

              it.drawCircle(r, cy, r, style.paint)
              x = markerSize
            }

            ListStyleType.Square.value -> {
              // filled square
              val half = markerSize / 2f
              val cy = baseline - fm.descent / 2f

              val left = 0f
              val top = cy - half
              val right = markerSize
              val bottom = cy + half

              it.drawRect(left, top, right, bottom, style.paint)
              x = markerSize
            }

            ListStyleType.Decimal.value -> {
              // decimal number marker
              if (position > -1) {
                val text = "${position + 1}."
                it.drawText(
                  text, 0f, baseline.toFloat(), style.paint
                )
                x = style.paint.measureText(text)
              }
            }

            else -> {}
          }

          // restore paint
          style.paint.style = oldPaintStyle
          style.paint.strokeWidth = oldStroke

          // translate canvas for content after marker + gap
          if (x > 0) {
            val gap = style.paint.textSize * 0.5f // proportional gap
            it.translate(x + gap, 0f)
          }
        }
      }
      super.dispatchDraw(it)
    }
  }

  override val style: Style
    get() = node.style

  override val view: View
    get() = this

  override fun onTextStyleChanged(change: Int) {
    Node.invalidateDescendantTextViews(node, change)
  }

  private fun findFirstTextBaseline(view: View): Int {
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

        val width = mapMeasureSpec(specWidthMode, specWidth).value
        var height = mapMeasureSpec(specHeightMode, specHeight).value

        if (specHeightMode == MeasureSpec.UNSPECIFIED) {
          height = -2f
        }
        compute(
          width,
          height
        )

      }

      !is Element -> {
        compute(
          mapMeasureSpec(specWidthMode, specWidth).value,
          mapMeasureSpec(specHeightMode, specHeight).value
        )
      }

      else -> {}
    }

    // todo cache layout
    val layout = layout()

    measureChild(
      content,
      MeasureSpec.makeMeasureSpec(
        layout.width.toInt(), MeasureSpec.EXACTLY,
      ), MeasureSpec.makeMeasureSpec(
        layout.height.toInt(), MeasureSpec.AT_MOST
      )
    )
    setMeasuredDimension(layout.width.toInt(), layout.height.toInt())
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // todo cache layout
    val layout = layout()

    applyLayoutRecursive(node, layout)
  }

  internal var markerWidth: Float = 0f
  internal var markerHeight: Float = 0f
  private var markerSize: Float = 0f
  internal var counter: Int = -1


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
    knownDimensions: Size<Float?>,
    availableSpace: Size<Float?>
  ): Size<Float> {
    (node.parent?.view as? ListView)?.let {
      isOrdered = it.isOrdered
    }

    val listStyleType = resolveListStyleType()

    if (listStyleType == ListStyleType.None.value) {
      markerWidth = 0f
      markerHeight = 0f
      markerSize = 0f
      return Size.uniform(0f)
    }

    val paint = style.paint
    val fm = paint.fontMetrics
    val textHeight = fm.descent - fm.ascent

    markerSize = paint.textSize * 0.35f

    val width: Float = when (listStyleType) {
      ListStyleType.None.value -> 0f

      ListStyleType.Custom.value -> {
        // Custom text marker
        if (marker.isNotEmpty()) {
          paint.measureText(marker)
        } else {
          0f
        }
      }

      ListStyleType.Disc.value, ListStyleType.Circle.value, ListStyleType.Square.value -> {
        // Shape markers use markerSize
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

    return Size(markerWidth, markerHeight)
  }
}
