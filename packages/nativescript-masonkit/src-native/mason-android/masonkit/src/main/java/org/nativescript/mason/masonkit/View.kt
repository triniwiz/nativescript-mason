package org.nativescript.mason.masonkit

import android.content.Context
import android.util.AttributeSet
import android.util.SparseArray
import android.util.TypedValue
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams
import androidx.annotation.Keep
import androidx.core.view.marginLeft
import androidx.core.view.updateLayoutParams
import com.google.gson.Gson
import java.lang.ref.WeakReference
import kotlin.math.roundToInt

interface MeasureFunc {
  fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float>
}

internal class MeasureFuncImpl(
  private val measureFunc: WeakReference<MeasureFunc>
) {
  @Keep
  fun measure(knownDimensionsSpec: Long, availableSpaceSpec: Long): Long {
    val knownWidth = MeasureOutput.getWidth(knownDimensionsSpec)
    val knownHeight = MeasureOutput.getHeight(knownDimensionsSpec)

    val availableWidth = MeasureOutput.getWidth(availableSpaceSpec)
    val availableHeight = MeasureOutput.getHeight(availableSpaceSpec)

    val result = measureFunc.get()?.measure(
      Size(
        if (knownWidth.isNaN()) null else knownWidth,
        if (knownHeight.isNaN()) null else knownHeight
      ), Size(
        if (availableWidth.isNaN()) null else availableWidth,
        if (availableHeight.isNaN()) null else availableHeight
      )
    )

    return MeasureOutput.make(result?.width ?: Float.NaN, result?.height ?: Float.NaN)
  }
}

class View @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : ViewGroup(context, attrs, defStyleAttr) {

  var node = Node()
    private set

  private val nodes = mutableMapOf<android.view.View, Node>()

  init {
    node.data = this

//    val layoutParams = if (attrs != null) {
//      LayoutParams(context, attrs)
//    } else {
//      generateDefaultLayoutParams()
//    }
//
//    applyLayoutParams(layoutParams as LayoutParams, node, this)
  }


  val masonPtr: Long
    get() {
      return Mason.instance.getNativePtr()
    }

  val masonNodePtr: Long
    get() {
      return node.getNativePtr()
    }

  val masonStylePtr: Long
    get() {
      return style.getNativePtr()
    }


  val masonPtrs: String
    get() {
      return Mason.instance.getNativePtr()
        .toString() + ":" + masonNodePtr.toString() + ":" + masonStylePtr.toString();
    }

  var style: Style
    get() {
      return node.style
    }
    set(value) {
      node.style = value
    }

  fun markNodeDirty() {
    node.dirty()
  }

  fun isNodeDirty(): Boolean {
    return node.isDirty()
  }

  fun updateNodeAndStyle() {
    node.updateNodeStyle()
  }

  fun setStyleFromString(style: String) {
    try {
      val parsedStyle = gson.fromJson(style, Style::class.java)
      this.style = parsedStyle
    } catch (_: Exception) {
    }
  }

  fun getStyleAsString(): String? {
    return gson.toJson(style)
  }

  fun nodeForView(view: android.view.View): Node {
    val that = this
    return nodes[view] ?: run {
      val node = Node().apply {
        data = view
        owner = that.node
      }
      nodes[view] = node
      node
    }
  }

  private fun applyLayoutRecursive(node: Node, xOffset: Float, yOffset: Float) {
    val view = node.data as? android.view.View

    if (view != null && view !== this) {
      if (view.visibility == GONE) {
        return
      }

      var layout = node.layout()

      var widthIsNaN = layout.width.isNaN()
      var heightIsNaN = layout.height.isNaN()

      var measuredWidth = if (widthIsNaN) 0 else layout.width.roundToInt()
      var measuredHeight = if (heightIsNaN) 0 else layout.height.roundToInt()

      val widthIsZero = node.style.size.width.isZero

      val heightIsZero = node.style.size.height.isZero

      var hasPercentDimensions = false

      if (measuredWidth == 0 && !widthIsZero) {
        when (node.style.size.width) {
          is Dimension.Auto -> {
            widthIsNaN = true
          }

          is Dimension.Percent -> {
            hasPercentDimensions = true
          }

          else -> {}
        }
      }

      if (measuredHeight == 0 && !heightIsZero) {
        when (node.style.size.height) {
          is Dimension.Auto -> {
            heightIsNaN = true
          }

          is Dimension.Percent -> {
            hasPercentDimensions = true
          }

          else -> {}
        }
      }

      if (hasPercentDimensions) {
        node.owner?.dirty()
        node.dirty()
        node.rootComputeWithViewSize()

        layout = node.layout()

        widthIsNaN = layout.width.isNaN()
        heightIsNaN = layout.height.isNaN()
      }

      measuredWidth = if (widthIsNaN) 0 else layout.width.roundToInt()
      measuredHeight = if (heightIsNaN) 0 else layout.height.roundToInt()

      if (widthIsZero) {
        measuredWidth = 0
        widthIsNaN = false
      }

      if (heightIsZero) {
        measuredHeight = 0
        heightIsNaN = false
      }


      view.measure(
        MeasureSpec.makeMeasureSpec(
          measuredWidth,
          MeasureSpec.EXACTLY
        ), MeasureSpec.makeMeasureSpec(
          measuredHeight,
          MeasureSpec.EXACTLY
        )
      )
      measuredWidth = view.measuredWidth
      measuredHeight = view.measuredHeight


      val left = (xOffset + if (layout.x.isNaN()) 0F else layout.x).roundToInt()
      val top = (yOffset + if (layout.y.isNaN()) 0F else layout.y).roundToInt()

      val right =
        left + measuredWidth
      val bottom =
        top + measuredHeight

      view.layout(left, top, right, bottom)
    }

    val childrenCount = node.getChildCount()

    for (i in 0 until childrenCount) {
      if (view == this) {
        node.getChildAt(i)?.let {
          applyLayoutRecursive(it, xOffset, yOffset)
        }
      } else if (view is View) {
        continue
      } else {
        node.getChildAt(i)?.let {
          val layout = it.layout()
          applyLayoutRecursive(
            it, xOffset + layout.x, yOffset + layout.y
          )
        }
      }
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    if (parent !is View) {
      createLayout(
        MeasureSpec.makeMeasureSpec(r - l, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(b - t, MeasureSpec.EXACTLY)
      )

//      val margin = node.style.margin;
//      val parentWidth = (this.parent as android.view.ViewGroup).measuredWidth;
//      val parentHeight = (this.parent as android.view.ViewGroup).measuredHeight;
//
//      this.updateLayoutParams<ViewGroup.MarginLayoutParams> {
//        setMargins(margin.left.let {
//          var ret = it.value
//          if (it.type == 2) {
//            ret = it.value * parentWidth.toFloat();
//          }
//          ret.toInt()
//        }, margin.top.let {
//          var ret = it.value
//          if (it.type == 2) {
//            ret = it.value * parentHeight.toFloat();
//          }
//          ret.toInt()
//        }, margin.right.let {
//          var ret = it.value
//          if (it.type == 2) {
//            ret = it.value * parentWidth.toFloat();
//          }
//          ret.toInt()
//        }, margin.bottom.let {
//          var ret = it.value
//          if (it.type == 2) {
//            ret = it.value.toInt() * parentHeight.toFloat();
//          }
//          ret.toInt()
//        })
//      }
    }

    applyLayoutRecursive(node, 0F, 0F)

  }

  private fun setSizeFromMeasureSpec(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (node.style.size.width == Dimension.Auto && node.style.size.height == Dimension.Auto) {
      val widthSize = MeasureSpec.getSize(widthMeasureSpec)
      val heightSize = MeasureSpec.getSize(heightMeasureSpec)

      var width: Dimension = Dimension.Points(widthSize.toFloat())
      var height: Dimension = Dimension.Points(heightSize.toFloat())

      val paramsWidth = layoutParams.width
      val paramsHeight = layoutParams.height

      if (widthSize == 0 && paramsWidth == ViewGroup.LayoutParams.WRAP_CONTENT) {
        width = Dimension.Auto
      }

      if (heightSize == 0 && paramsHeight == ViewGroup.LayoutParams.WRAP_CONTENT) {
        height = Dimension.Auto
      }

      if (widthSize == 0 && paramsWidth == ViewGroup.LayoutParams.MATCH_PARENT) {
        width = Dimension.Auto
      }

      if (heightSize == 0 && paramsHeight == ViewGroup.LayoutParams.MATCH_PARENT) {
        height = Dimension.Auto
      }

      node.style.size = Size(width, height)

      checkAndUpdateStyle()
    }
  }

  private fun createLayout(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setSizeFromMeasureSpec(widthMeasureSpec, heightMeasureSpec)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    if (parent !is View) {
      createLayout(
        specWidth,
        specHeight
      )
    }

    val layout = if (parent !is View) {
      val masonHeight = node.style.size.height
      val masonWidth = node.style.size.width

      if (masonWidth is Dimension.Auto && masonHeight is Dimension.Auto) {
        node.computeMaxContent()
      } else {

        // MeasureSpec.EXACTLY View will be of the given size
        // MeasureSpec.AT_MOST View can't be larger than the given size
        // MeasureSpec.UNSPECIFIED View can be of any size

        var width = specWidth.toFloat();

        if (specWidthMode != MeasureSpec.EXACTLY) {
          width = when (masonWidth) {
            is Dimension.Percent -> {
              masonWidth.value * (parent as android.view.View).measuredWidth
            }

            is Dimension.Auto -> {
              -2.0f
            }

            is Dimension.Points -> {
              masonWidth.value
            }
          }

          if (specWidthMode == MeasureSpec.AT_MOST && width > specWidth.toFloat()) {
            width = specWidth.toFloat();
          }
        }

        var height = specHeight.toFloat();

        if (specHeightMode != MeasureSpec.EXACTLY) {
          height = when (masonHeight) {
            is Dimension.Percent -> {
              masonHeight.value * (parent as android.view.View).measuredHeight
            }

            is Dimension.Auto -> {
              -2.0f
            }

            is Dimension.Points -> {
              masonHeight.value
            }
          }

          if (specHeightMode == MeasureSpec.AT_MOST && height > specHeight.toFloat()) {
            height = specHeight.toFloat();
          }
        }

        node.compute(width, height)
      }
      node.layout()
    } else {
      node.layout()
    }

    setMeasuredDimension(
      layout.width.roundToInt(),
      layout.height.roundToInt()
    )
  }

  override fun addView(child: android.view.View, index: Int, params: ViewGroup.LayoutParams) {
    node.removeMeasureFunction()
    super.addView(child, index, params)

    if (nodes.containsKey(child)) {
      return
    }

    val childNode = if (child is View) {
      child.node
    } else {
      if (nodes.containsKey(child)) {
        nodes[child]!!
      } else {
        Node()
      }
    }.apply {
      data = child
      setMeasureFunction(ViewMeasureFunc(WeakReference(this)))
    }

    val lp = child.layoutParams as? LayoutParams ?: run {
      LayoutParams(child.layoutParams)
    }

//    applyLayoutParams(lp, childNode, child)

    nodes[child] = childNode

    if (index == -1) {
      node.addChild(childNode)
    } else {
      node.addChildAt(childNode, index)
    }
  }

  fun addViews(children: Array<android.view.View>) {
    addViews(children, -1)
  }

  fun addViews(children: Array<android.view.View>, index: Int) {
    children.forEachIndexed { childIndex, child ->
      if (index < 0) {
        addView(child)
      } else {
        addView(child, index + childIndex, child.layoutParams)
      }
    }
  }

  fun addView(child: android.view.View, node: Node) {
    nodes[child] = node
    addView(child)
  }

  override fun removeView(view: android.view.View) {
    removeViewFromMasonTree(view, false)
    super.removeView(view)
  }

  override fun removeViewAt(index: Int) {
    removeViewFromMasonTree(getChildAt(index), false)
    super.removeViewAt(index)
  }

  override fun removeViewInLayout(view: android.view.View) {
    removeViewFromMasonTree(view, true)
    super.removeViewInLayout(view)
  }

  override fun removeViews(start: Int, count: Int) {
    for (i in start until start + count) {
      removeViewFromMasonTree(getChildAt(i), false)
    }
    super.removeViews(start, count)
  }

  override fun removeViewsInLayout(start: Int, count: Int) {
    for (i in start until start + count) {
      removeViewFromMasonTree(getChildAt(i), true)
    }
    super.removeViewsInLayout(start, count)
  }

  override fun removeAllViews() {
    val childCount = nodes.count()
    for (i in 0 until childCount) {
      removeViewFromMasonTree(getChildAt(i), false)
    }
    super.removeAllViews()
  }

  fun invalidate(view: android.view.View?) {
    if (nodes.containsKey(view)) {
      nodes[view]?.dirty()
      return
    }
    val childCount = nodes.count()
    for (i in 0 until childCount) {
      node.getChildAt(i)?.let {
        if (it.data is View) {
          (it.data as View).invalidate()
        }
      }
    }
    invalidate()
  }

  override fun removeAllViewsInLayout() {
    val childCount = nodes.count()
    for (i in 0 until childCount) {
      removeViewFromMasonTree(getChildAt(i), true)
    }
    super.removeAllViewsInLayout()
  }

  private fun removeViewFromMasonTree(view: android.view.View, inLayout: Boolean) {
    nodes[view]?.let { node ->
      val owner = node.owner as Node
      val count = owner.getChildCount()
      for (i in 0 until count) {
        owner.getChildAt(i)?.let {
          if (it == node) {
            owner.removeChildAt(i)
            return
          }
        }
      }
      node.data = null
      nodes.remove(view)
      if (inLayout) {
        node.computeMaxContent()
      }
    }
  }

  protected fun applyLayoutParams(
    layoutParameters: LayoutParams, node: Node, view: android.view.View
  ) {
    val configuration = view.resources.configuration
    if (configuration.layoutDirection == LAYOUT_DIRECTION_RTL) {
      // TODO support direction
    }
    val background = view.background
    if (background != null) {
      val backgroundPadding = android.graphics.Rect()
      if (background.getPadding(backgroundPadding)) {
        node.style.padding = Rect(
          LengthPercentage.Points(backgroundPadding.left.toFloat()),
          LengthPercentage.Points(backgroundPadding.right.toFloat()),
          LengthPercentage.Points(backgroundPadding.top.toFloat()),
          LengthPercentage.Points(backgroundPadding.bottom.toFloat())
        )
      }
    }

    var borderLeft: LengthPercentage = LengthPercentage.Zero
    var borderRight: LengthPercentage = LengthPercentage.Zero
    var borderTop: LengthPercentage = LengthPercentage.Zero
    var borderBottom: LengthPercentage = LengthPercentage.Zero

    var width: Dimension = Dimension.Auto
    var height: Dimension = Dimension.Auto

    var paddingLeft: LengthPercentage = LengthPercentage.Zero
    var paddingRight: LengthPercentage = LengthPercentage.Zero
    var paddingTop: LengthPercentage = LengthPercentage.Zero
    var paddingBottom: LengthPercentage = LengthPercentage.Zero

    var marginLeft: LengthPercentageAuto = LengthPercentageAuto.Zero
    var marginRight: LengthPercentageAuto = LengthPercentageAuto.Zero
    var marginTop: LengthPercentageAuto = LengthPercentageAuto.Zero
    var marginBottom: LengthPercentageAuto = LengthPercentageAuto.Zero

    var minWidth: Dimension = Dimension.Auto
    var minHeight: Dimension = Dimension.Auto

    var maxWidth: Dimension = Dimension.Auto
    var maxHeight: Dimension = Dimension.Auto

    var insetLeft: LengthPercentageAuto = LengthPercentageAuto.Auto
    var insetRight: LengthPercentageAuto = LengthPercentageAuto.Auto
    var insetTop: LengthPercentageAuto = LengthPercentageAuto.Auto
    var insetBottom: LengthPercentageAuto = LengthPercentageAuto.Auto

    for (i in 0 until layoutParameters.numericAttributes.size()) {
      val attribute: Int = layoutParameters.numericAttributes.keyAt(i)
      val value: Float = layoutParameters.numericAttributes.valueAt(i)

      when (attribute) {
        R.styleable.mason_mason_alignContent -> {
          node.style.alignContent = AlignContent.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_alignItems -> {
          node.style.alignItems = AlignItems.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_alignSelf -> {
          node.style.alignSelf = AlignSelf.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_aspectRatio -> {
          node.style.aspectRatio = value
        }

        R.styleable.mason_mason_borderLeft -> {
          borderLeft = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_borderTop -> {
          borderTop = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_borderRight -> {
          borderRight = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_borderBottom -> {
          borderBottom = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_borderStart -> {
          borderLeft = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_borderEnd -> {
          borderRight = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_borderAll -> {
          val points = LengthPercentage.Points(value)
          borderLeft = points
          borderRight = points
          borderTop = points
          borderBottom = points
        }

        R.styleable.mason_mason_direction -> {
          // TODO handle direction
          node.style.direction = Direction.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_display -> {
          node.style.display = Display.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_flexBasis -> {
          node.style.flexBasis = Dimension.Points(value)
        }

        R.styleable.mason_mason_flexDirection -> {
          node.style.flexDirection = FlexDirection.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_flexGrow -> {
          node.style.flexGrow = value
        }

        R.styleable.mason_mason_flexShrink -> {
          node.style.flexShrink = value
        }

        R.styleable.mason_mason_justifyContent -> {
          node.style.justifyContent = JustifyContent.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_justifyItems -> {
          node.style.justifyItems = JustifyItems.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_justifySelf -> {
          node.style.justifySelf = JustifySelf.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_marginLeft -> {
          marginLeft = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_marginTop -> {
          marginTop = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_marginRight -> {
          marginRight = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_marginBottom -> {
          marginBottom = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_marginStart -> {
          marginLeft = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_marginEnd -> {
          marginRight = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_marginAll -> {
          val points = LengthPercentageAuto.Points(value)
          marginLeft = points
          marginRight = points
          marginTop = points
          marginBottom = points
        }

        R.styleable.mason_mason_maxHeight -> {
          maxHeight = Dimension.Points(value)
        }

        R.styleable.mason_mason_maxWidth -> {
          maxWidth = Dimension.Points(value)
        }

        R.styleable.mason_mason_minHeight -> {
          minHeight = Dimension.Points(value)
        }

        R.styleable.mason_mason_minWidth -> {
          minWidth = Dimension.Points(value)
        }

        R.styleable.mason_mason_overflow -> {
          node.style.overflow = Overflow.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_paddingLeft -> {
          paddingLeft = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_paddingTop -> {
          paddingTop = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_paddingRight -> {
          paddingRight = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_paddingBottom -> {
          paddingBottom = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_paddingStart -> {
          paddingLeft = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_paddingEnd -> {
          paddingRight = LengthPercentage.Points(value)
        }

        R.styleable.mason_mason_paddingAll -> {
          val points = LengthPercentage.Points(value)
          paddingLeft = points
          paddingRight = points
          paddingTop = points
          paddingBottom = points
        }

        R.styleable.mason_mason_insetLeft -> {
          insetLeft = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_insetTop -> {
          insetTop = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_insetRight -> {
          insetRight = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_insetBottom -> {
          insetBottom = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_insetStart -> {
          insetLeft = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_insetEnd -> {
          insetRight = LengthPercentageAuto.Points(value)
        }

        R.styleable.mason_mason_insetAll -> {
          val points = LengthPercentageAuto.Points(value)
          insetLeft = points
          insetRight = points
          insetBottom = points
          insetTop = points
        }

        R.styleable.mason_mason_position -> {
          node.style.position = Position.fromInt(value.roundToInt())
        }

        R.styleable.mason_mason_height -> {
          height = Dimension.Points(value)
        }

        R.styleable.mason_mason_width -> {
          width = Dimension.Points(value)
        }

        R.styleable.mason_mason_flexWrap -> {
          node.style.flexWrap = FlexWrap.fromInt(value.roundToInt())
        }
      }
    }

    for (i in 0 until layoutParameters.stringAttributes.size()) {
      val attribute: Int = layoutParameters.stringAttributes.keyAt(i)
      val value: String = layoutParameters.stringAttributes.valueAt(i)

      if (value == "auto") {
        when (attribute) {
          R.styleable.mason_mason_marginLeft -> {
            marginLeft = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_marginTop -> {
            marginTop = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_marginRight -> {
            marginRight = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_marginBottom -> {
            marginBottom = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_marginStart -> {
            marginLeft = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_marginEnd -> {
            marginRight = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_marginAll -> {
            marginLeft = LengthPercentageAuto.Auto
            marginRight = LengthPercentageAuto.Auto
            marginTop = LengthPercentageAuto.Auto
            marginBottom = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_insetLeft -> {
            insetLeft = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_insetTop -> {
            insetTop = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_insetRight -> {
            insetRight = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_insetBottom -> {
            insetBottom = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_insetStart -> {
            insetLeft = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_insetEnd -> {
            insetRight = LengthPercentageAuto.Auto
          }

          R.styleable.mason_mason_insetAll -> {
            val points = LengthPercentageAuto.Auto
            insetLeft = points
            insetRight = points
            insetBottom = points
            insetTop = points
          }

          R.styleable.mason_mason_height -> {
            height = Dimension.Auto
          }

          R.styleable.mason_mason_width -> {
            width = Dimension.Auto
          }

          R.styleable.mason_mason_maxHeight -> {
            maxHeight = Dimension.Auto
          }

          R.styleable.mason_mason_maxWidth -> {
            maxWidth = Dimension.Auto
          }

          R.styleable.mason_mason_minHeight -> {
            minHeight = Dimension.Auto
          }

          R.styleable.mason_mason_minWidth -> {
            minWidth = Dimension.Auto
          }
        }
      }
      if (value.endsWith("%")) {
        val numericValue = value.replace("%", "").toFloat() / 100
        when (attribute) {
          R.styleable.mason_mason_flexBasis -> {
            node.style.flexBasis = Dimension.Percent(numericValue)
          }

          R.styleable.mason_mason_width -> {
            width = Dimension.Percent(numericValue)
          }

          R.styleable.mason_mason_height -> {
            height = Dimension.Percent(numericValue)
          }

          R.styleable.mason_mason_marginLeft -> {
            marginLeft = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_marginTop -> {
            marginTop = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_marginRight -> {
            marginRight = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_marginBottom -> {
            marginBottom = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_marginStart -> {
            marginLeft = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_marginEnd -> {
            marginRight = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_marginAll -> {
            val percent = LengthPercentageAuto.Percent(numericValue)
            marginLeft = percent
            marginRight = percent
            marginTop = percent
            marginBottom = percent
          }

          R.styleable.mason_mason_maxHeight -> {
            maxHeight = Dimension.Percent(numericValue)
          }

          R.styleable.mason_mason_maxWidth -> {
            maxWidth = Dimension.Percent(numericValue)
          }

          R.styleable.mason_mason_minHeight -> {
            minHeight = Dimension.Percent(numericValue)
          }

          R.styleable.mason_mason_minWidth -> {
            minWidth = Dimension.Percent(numericValue)
          }

          R.styleable.mason_mason_paddingLeft -> {
            paddingLeft = LengthPercentage.Percent(numericValue)
          }

          R.styleable.mason_mason_paddingTop -> {
            paddingTop = LengthPercentage.Percent(numericValue)
          }

          R.styleable.mason_mason_paddingRight -> {
            paddingRight = LengthPercentage.Percent(numericValue)
          }

          R.styleable.mason_mason_paddingBottom -> {
            paddingBottom = LengthPercentage.Percent(numericValue)
          }

          R.styleable.mason_mason_paddingStart -> {
            paddingLeft = LengthPercentage.Percent(numericValue)
          }

          R.styleable.mason_mason_paddingEnd -> {
            paddingRight = LengthPercentage.Percent(numericValue)
          }

          R.styleable.mason_mason_paddingAll -> {
            val percent = LengthPercentage.Percent(numericValue)
            paddingLeft = percent
            paddingRight = percent
            paddingTop = percent
            paddingBottom = percent
          }

          R.styleable.mason_mason_insetLeft -> {
            insetLeft = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_insetTop -> {
            insetTop = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_insetRight -> {
            insetRight = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_insetBottom -> {
            insetBottom = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_insetStart -> {
            insetLeft = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_insetEnd -> {
            insetRight = LengthPercentageAuto.Percent(numericValue)
          }

          R.styleable.mason_mason_insetAll -> {
            val percent = LengthPercentageAuto.Percent(numericValue)
            insetLeft = percent
            insetRight = percent
            insetTop = percent
            insetBottom = percent
          }
        }
      }

      if (value == "0") {
        when (attribute) {
          R.styleable.mason_mason_marginLeft -> {
            marginLeft = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_marginTop -> {
            marginTop = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_marginRight -> {
            marginRight = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_marginBottom -> {
            marginBottom = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_marginStart -> {
            marginLeft = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_marginEnd -> {
            marginRight = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_marginAll -> {
            marginLeft = LengthPercentageAuto.Points(0F)
            marginRight = LengthPercentageAuto.Points(0F)
            marginTop = LengthPercentageAuto.Points(0F)
            marginBottom = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_insetLeft -> {
            insetLeft = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_insetTop -> {
            insetTop = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_insetRight -> {
            insetRight = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_insetBottom -> {
            insetBottom = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_insetStart -> {
            insetLeft = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_insetEnd -> {
            insetRight = LengthPercentageAuto.Points(0F)
          }

          R.styleable.mason_mason_insetAll -> {
            val points = LengthPercentageAuto.Points(0F)
            insetLeft = points
            insetRight = points
            insetBottom = points
            insetTop = points
          }

          R.styleable.mason_mason_height -> {
            height = Dimension.Points(0F)
          }

          R.styleable.mason_mason_width -> {
            width = Dimension.Points(0F)
          }

          R.styleable.mason_mason_maxHeight -> {
            maxHeight = Dimension.Points(0F)
          }

          R.styleable.mason_mason_maxWidth -> {
            maxWidth = Dimension.Points(0F)
          }

          R.styleable.mason_mason_minHeight -> {
            minHeight = Dimension.Points(0F)
          }

          R.styleable.mason_mason_minWidth -> {
            minWidth = Dimension.Points(0F)
          }
        }
      }
    }

    node.style.border = Rect(borderLeft, borderRight, borderTop, borderBottom)

    node.style.margin = Rect(marginLeft, marginRight, marginTop, marginBottom)

    node.style.padding = Rect(paddingLeft, paddingRight, paddingTop, paddingBottom)

    node.style.inset = Rect(insetLeft, insetRight, insetTop, insetBottom)

    node.style.size = Size(width, height)

    node.style.minSize = Size(minWidth, minHeight)

    node.style.maxSize = Size(maxWidth, maxHeight)

    checkAndUpdateStyle()
  }


  fun configure(block: (Node) -> Unit) {
    node.configure(block)
  }

  var inBatch: Boolean
    get() {
      return node.inBatch
    }
    set(value) {
      node.inBatch = value
    }

  private fun checkAndUpdateStyle() {
    if (!node.inBatch) {
      node.updateNodeStyle()
    }
  }

  var display: Display
    get() {
      return style.display
    }
    set(value) {
      style.display = value
      checkAndUpdateStyle()
    }

  var position: Position
    get() {
      return style.position
    }
    set(value) {
      style.position = value
      checkAndUpdateStyle()
    }

  // TODO
  var direction: Direction
    get() {
      return style.direction
    }
    set(value) {
      style.direction = value
    }

  var flexDirection: FlexDirection
    get() {
      return style.flexDirection
    }
    set(value) {
      style.flexDirection = value
      checkAndUpdateStyle()
    }

  var flexWrap: FlexWrap
    get() {
      return style.flexWrap
    }
    set(value) {
      style.flexWrap = value
      checkAndUpdateStyle()
    }

  var overflow: Overflow
    get() {
      return style.overflow
    }
    set(value) {
      style.overflow = value
      checkAndUpdateStyle()
    }

  var overflowX: Overflow
    get() {
      return style.overflowX
    }
    set(value) {
      style.overflowX = value
      checkAndUpdateStyle()
    }

  var overflowY: Overflow
    get() {
      return style.overflowY
    }
    set(value) {
      style.overflowY = value
      checkAndUpdateStyle()
    }


  var alignItems: AlignItems
    get() {
      return style.alignItems
    }
    set(value) {
      style.alignItems = value
      checkAndUpdateStyle()
    }

  var alignSelf: AlignSelf
    get() {
      return style.alignSelf
    }
    set(value) {
      style.alignSelf = value
      checkAndUpdateStyle()
    }

  var alignContent: AlignContent
    get() {
      return style.alignContent
    }
    set(value) {
      style.alignContent = value
      checkAndUpdateStyle()
    }


  var justifyItems: JustifyItems
    get() {
      return style.justifyItems
    }
    set(value) {
      style.justifyItems = value
      checkAndUpdateStyle()
    }

  var justifySelf: JustifySelf
    get() {
      return style.justifySelf
    }
    set(value) {
      style.justifySelf = value
      checkAndUpdateStyle()
    }

  var justifyContent: JustifyContent
    get() {
      return style.justifyContent
    }
    set(value) {
      style.justifyContent = value
      checkAndUpdateStyle()
    }

  var flexGrow: Float
    get() {
      return style.flexGrow
    }
    set(value) {
      style.flexGrow = value
      checkAndUpdateStyle()
    }

  var flexShrink: Float
    get() {
      return style.flexShrink
    }
    set(value) {
      style.flexShrink = value
      checkAndUpdateStyle()
    }


  fun setScrollBarWidth(value: Float) {
    style.setScrollBarWidth(value)
    checkAndUpdateStyle()
  }

  var scrollBarWidth: Dimension
    get() {
      return style.scrollBarWidth
    }
    set(value) {
      style.scrollBarWidth = value
      checkAndUpdateStyle()
    }

  fun setFlexBasis(value: Float, type: Int) {
    style.setFlexBasis(value, type)
    checkAndUpdateStyle()
  }

  var flexBasis: Dimension
    get() {
      return style.flexBasis
    }
    set(value) {
      style.flexBasis = value
      checkAndUpdateStyle()
    }

  fun getPadding(): Rect<LengthPercentage> {
    return style.padding
  }

  fun getStylePaddingLeft(): LengthPercentage {
    return style.padding.left
  }

  fun getStylePaddingRight(): LengthPercentage {
    return style.padding.right
  }

  fun getStylePaddingTop(): LengthPercentage {
    return style.padding.top
  }

  fun getStylePaddingBottom(): LengthPercentage {
    return style.padding.bottom
  }

  fun getPaddingCssValue(): String {
    return style.padding.cssValue
  }

  fun getPaddingJsonValue(): String {
    return style.padding.jsonValue
  }

  fun setPadding(left: Float, top: Float, right: Float, bottom: Float) {
    style.padding = Rect(
      LengthPercentage.Points(left),
      LengthPercentage.Points(right),
      LengthPercentage.Points(top),
      LengthPercentage.Points(bottom)
    )
    checkAndUpdateStyle()
  }

  fun setPadding(
    left: LengthPercentage,
    top: LengthPercentage,
    right: LengthPercentage,
    bottom: LengthPercentage
  ) {
    style.padding = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle()
  }

  fun setPadding(
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    style.padding = Rect(
      LengthPercentage.fromTypeValue(left_type, left) ?: style.padding.left,
      LengthPercentage.fromTypeValue(right_type, right) ?: style.padding.right,
      LengthPercentage.fromTypeValue(top_type, top) ?: style.padding.top,
      LengthPercentage.fromTypeValue(bottom_type, bottom) ?: style.padding.bottom
    )
    checkAndUpdateStyle()
  }


  fun setPaddingLeft(value: Float, type: Int) {
    style.setPaddingLeft(value, type)
    checkAndUpdateStyle()
  }

  fun setPaddingRight(value: Float, type: Int) {
    style.setPaddingRight(value, type)
    checkAndUpdateStyle()
  }

  fun setPaddingTop(value: Float, type: Int) {
    style.setPaddingTop(value, type)
    checkAndUpdateStyle()
  }

  fun setPaddingBottom(value: Float, type: Int) {
    style.setPaddingBottom(value, type)
    checkAndUpdateStyle()
  }

  fun setPaddingWithValueType(value: Float, type: Int) {
    style.setPaddingWithValueType(value, type)
    checkAndUpdateStyle()
  }

  fun getBorder(): Rect<LengthPercentage> {
    return style.border
  }

  fun getBorderLeft(): LengthPercentage {
    return style.border.left
  }

  fun getBorderRight(): LengthPercentage {
    return style.border.right
  }

  fun getBorderTop(): LengthPercentage {
    return style.border.top
  }

  fun getBorderBottom(): LengthPercentage {
    return style.border.bottom
  }

  fun getBorderCssValue(): String {
    return style.border.cssValue
  }

  fun getBorderJsonValue(): String {
    return style.border.jsonValue
  }

  fun setBorder(left: Float, top: Float, right: Float, bottom: Float) {
    style.border = Rect(
      LengthPercentage.Points(left),
      LengthPercentage.Points(right),
      LengthPercentage.Points(top),
      LengthPercentage.Points(bottom)
    )
    checkAndUpdateStyle()
  }

  fun setBorder(
    left: LengthPercentage,
    top: LengthPercentage,
    right: LengthPercentage,
    bottom: LengthPercentage
  ) {
    style.border = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle()
  }

  fun setBorder(
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    style.border = Rect(
      LengthPercentage.fromTypeValue(left_type, left) ?: style.border.left,
      LengthPercentage.fromTypeValue(right_type, right) ?: style.border.right,
      LengthPercentage.fromTypeValue(top_type, top) ?: style.border.top,
      LengthPercentage.fromTypeValue(bottom_type, bottom) ?: style.border.bottom
    )
    checkAndUpdateStyle()
  }

  fun setBorderLeft(value: Float, type: Int) {
    style.setBorderLeft(value, type)
    checkAndUpdateStyle()
  }

  fun setBorderRight(value: Float, type: Int) {
    style.setBorderRight(value, type)
    checkAndUpdateStyle()
  }

  fun setBorderTop(value: Float, type: Int) {
    style.setBorderTop(value, type)
    checkAndUpdateStyle()
  }

  fun setBorderBottom(value: Float, type: Int) {
    style.setBorderBottom(value, type)
    checkAndUpdateStyle()
  }

  fun setBorderWithValueType(value: Float, type: Int) {
    style.setBorderWithValueType(value, type)
    checkAndUpdateStyle()
  }

  fun getMargin(): Rect<LengthPercentageAuto> {
    return style.margin
  }

  fun getMarginLeft(): LengthPercentageAuto {
    return style.margin.left
  }

  fun getMarginRight(): LengthPercentageAuto {
    return style.margin.right
  }

  fun getMarginTop(): LengthPercentageAuto {
    return style.margin.top
  }

  fun getMarginBottom(): LengthPercentageAuto {
    return style.margin.bottom
  }

  fun getMarginCssValue(): String {
    return style.margin.cssValue
  }

  fun getMarginJsonValue(): String {
    return style.margin.jsonValue
  }

  fun setMargin(left: Float, top: Float, right: Float, bottom: Float) {
    style.margin = Rect(
      LengthPercentageAuto.Points(left),
      LengthPercentageAuto.Points(right),
      LengthPercentageAuto.Points(top),
      LengthPercentageAuto.Points(bottom)
    )
    checkAndUpdateStyle()
  }

  fun setMargin(
    left: LengthPercentageAuto,
    top: LengthPercentageAuto,
    right: LengthPercentageAuto,
    bottom: LengthPercentageAuto
  ) {
    style.margin = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle()
  }

  fun setMargin(
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    style.margin = Rect(
      LengthPercentageAuto.fromTypeValue(left_type, left) ?: style.margin.left,
      LengthPercentageAuto.fromTypeValue(right_type, right) ?: style.margin.right,
      LengthPercentageAuto.fromTypeValue(top_type, top) ?: style.margin.top,
      LengthPercentageAuto.fromTypeValue(bottom_type, bottom) ?: style.margin.bottom
    )
    checkAndUpdateStyle()
  }

  fun setMarginLeft(value: Float, type: Int) {
    style.setMarginLeft(value, type)
    checkAndUpdateStyle()
  }

  fun setMarginRight(value: Float, type: Int) {
    style.setMarginRight(value, type)
    checkAndUpdateStyle()
  }

  fun setMarginTop(value: Float, type: Int) {
    style.setMarginTop(value, type)
    checkAndUpdateStyle()
  }

  fun setMarginBottom(value: Float, type: Int) {
    style.setMarginBottom(value, type)
    checkAndUpdateStyle()
  }

  fun setMarginWithValueType(value: Float, type: Int) {
    style.setMarginWithValueType(value, type)
    checkAndUpdateStyle()
  }

  fun getInset(): Rect<LengthPercentageAuto> {
    return style.inset
  }

  fun getInsetLeft(): LengthPercentageAuto {
    return style.inset.left
  }

  fun getInsetRight(): LengthPercentageAuto {
    return style.inset.right
  }

  fun getInsetTop(): LengthPercentageAuto {
    return style.inset.top
  }

  fun getInsetBottom(): LengthPercentageAuto {
    return style.inset.bottom
  }


  fun getInsetCssValue(): String {
    return style.inset.cssValue
  }

  fun getInsetJsonValue(): String {
    return style.inset.jsonValue
  }

  fun setPosition(left: Float, top: Float, right: Float, bottom: Float) {
    style.inset = Rect(
      LengthPercentageAuto.Points(left),
      LengthPercentageAuto.Points(right),
      LengthPercentageAuto.Points(top),
      LengthPercentageAuto.Points(bottom)
    )
    checkAndUpdateStyle()
  }

  fun setPosition(
    left: LengthPercentageAuto,
    top: LengthPercentageAuto,
    right: LengthPercentageAuto,
    bottom: LengthPercentageAuto
  ) {
    style.inset = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle()
  }

  fun setInset(
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    style.inset = Rect(
      LengthPercentageAuto.fromTypeValue(left_type, left) ?: style.inset.left,
      LengthPercentageAuto.fromTypeValue(right_type, right) ?: style.inset.right,
      LengthPercentageAuto.fromTypeValue(top_type, top) ?: style.inset.top,
      LengthPercentageAuto.fromTypeValue(bottom_type, bottom) ?: style.inset.bottom
    )
    checkAndUpdateStyle()
  }

  fun setInsetLeft(value: Float, type: Int) {
    style.setInsetLeft(value, type)
    checkAndUpdateStyle()
  }

  fun setInsetRight(value: Float, type: Int) {
    style.setInsetRight(value, type)
    checkAndUpdateStyle()
  }

  fun setInsetTop(value: Float, type: Int) {
    style.setInsetTop(value, type)
    checkAndUpdateStyle()
  }

  fun setInsetBottom(value: Float, type: Int) {
    style.setInsetBottom(value, type)
    checkAndUpdateStyle()
  }

  fun setInsetWithValueType(value: Float, type: Int) {
    style.setInsetWithValueType(value, type)
    checkAndUpdateStyle()
  }

  fun setMinSize(width: Float, height: Float) {
    style.minSize = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )
    checkAndUpdateStyle()
  }

  fun getMinSize(): Size<Dimension> {
    return style.minSize
  }

  fun getMinSizeWidth(): Dimension {
    return style.minSize.width
  }

  fun getMinSizeHeight(): Dimension {
    return style.minSize.height
  }

  fun getMinSizeCssValue(): String {
    return style.minSize.cssValue
  }

  fun getMinSizeJsonValue(): String {
    return style.minSize.jsonValue
  }

  fun setMinSize(width: Dimension, height: Dimension) {
    style.minSize = Size(
      width,
      height,
    )
    checkAndUpdateStyle()
  }

  fun setMinSize(
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    style.minSize = Size(
      Dimension.fromTypeValue(width_type, width) ?: style.minSize.width,
      Dimension.fromTypeValue(height_type, height) ?: style.minSize.height
    )
    checkAndUpdateStyle()
  }

  fun setMinSizeWidth(value: Float, type: Int) {
    style.setMinSizeWidth(value, type)
    checkAndUpdateStyle()
  }

  fun setMinSizeHeight(value: Float, type: Int) {
    style.setMinSizeHeight(value, type)
    checkAndUpdateStyle()
  }

  fun setSize(width: Float, height: Float) {
    style.size = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )
    checkAndUpdateStyle()
  }

  fun getSize(): Size<Dimension> {
    return style.size
  }

  fun getSizeCssValue(): String {
    return style.size.cssValue
  }

  fun getSizeJsonValue(): String {
    return style.size.jsonValue
  }

  fun getSizeWidth(): Dimension {
    return style.size.width
  }

  fun getSizeHeight(): Dimension {
    return style.size.height
  }

  fun setSize(width: Dimension, height: Dimension) {
    style.size = Size(
      width,
      height,
    )
    checkAndUpdateStyle()
  }

  fun setSize(
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    style.size = Size(
      Dimension.fromTypeValue(width_type, width) ?: style.size.width,
      Dimension.fromTypeValue(height_type, height) ?: style.size.height
    )
    checkAndUpdateStyle()
  }

  fun setSizeWidth(value: Float, type: Int) {
    style.setSizeWidth(value, type)
    checkAndUpdateStyle()
  }

  fun setSizeHeight(value: Float, type: Int) {
    style.setSizeHeight(value, type)
    checkAndUpdateStyle()
  }

  fun setMaxSize(width: Float, height: Float) {
    style.maxSize = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )
    checkAndUpdateStyle()
  }

  fun getMaxSize(): Size<Dimension> {
    return style.maxSize
  }

  fun getMaxSizeWidth(): Dimension {
    return style.maxSize.width
  }

  fun getMaxSizeHeight(): Dimension {
    return style.maxSize.height
  }

  fun getMaxSizeCssValue(): String {
    return style.maxSize.cssValue
  }

  fun getMaxSizeJsonValue(): String {
    return style.maxSize.jsonValue
  }

  fun setMaxSize(width: Dimension, height: Dimension) {
    style.maxSize = Size(
      width,
      height,
    )
    checkAndUpdateStyle()
  }

  fun setMaxSize(
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    style.maxSize = Size(
      Dimension.fromTypeValue(width_type, width) ?: style.size.width,
      Dimension.fromTypeValue(height_type, height) ?: style.size.height
    )
    checkAndUpdateStyle()
  }

  fun setMaxSizeWidth(value: Float, type: Int) {
    style.setMaxSizeWidth(value, type)
    checkAndUpdateStyle()
  }

  fun setMaxSizeHeight(value: Float, type: Int) {
    style.setMaxSizeHeight(value, type)
    checkAndUpdateStyle()
  }

  fun setGap(width: Float, height: Float) {
    style.gap = Size(
      LengthPercentage.Points(width),
      LengthPercentage.Points(height),
    )
    checkAndUpdateStyle()
  }

  fun getGap(): Size<LengthPercentage> {
    return style.gap
  }

  fun getGapRow(): LengthPercentage {
    return style.gap.width
  }

  fun getGapColumn(): LengthPercentage {
    return style.gap.height
  }

  fun setGap(row: LengthPercentage, column: LengthPercentage) {
    style.gap = Size(
      row,
      column,
    )
    checkAndUpdateStyle()
  }

  fun setGap(
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    style.gap = Size(
      LengthPercentage.fromTypeValue(width_type, width) ?: style.gap.width,
      LengthPercentage.fromTypeValue(height_type, height) ?: style.gap.height
    )
    checkAndUpdateStyle()
  }

  fun setGapRow(value: Float, type: Int) {
    setRowGap(value, type)
  }

  fun setRowGap(value: Float, type: Int) {
    style.setGapRow(value, type)
    checkAndUpdateStyle()
  }

  fun setGapColumn(value: Float, type: Int) {
    setColumnGap(value, type)
  }

  fun setColumnGap(value: Float, type: Int) {
    style.setGapColumn(value, type)
    checkAndUpdateStyle()
  }

  var aspectRatio: Float?
    get() {
      return style.aspectRatio
    }
    set(value) {
      style.aspectRatio = value
      checkAndUpdateStyle()
    }


  var gridAutoRows: Array<MinMax>
    get() {
      return style.gridAutoRows
    }
    set(value) {
      style.gridAutoRows = value
      checkAndUpdateStyle()
    }

  var gridAutoColumns: Array<MinMax>
    get() {
      return style.gridAutoColumns
    }
    set(value) {
      style.gridAutoColumns = value
      checkAndUpdateStyle()
    }

  var gridAutoFlow: GridAutoFlow
    get() {
      return style.gridAutoFlow
    }
    set(value) {
      style.gridAutoFlow = value
      checkAndUpdateStyle()
    }

  var gridColumn: Line<GridPlacement>
    get() {
      return style.gridColumn
    }
    set(value) {
      style.gridColumn = value
      checkAndUpdateStyle()
    }

  var gridColumnStart: GridPlacement
    get() {
      return style.gridColumnStart
    }
    set(value) {
      style.gridColumnStart = value
      checkAndUpdateStyle()
    }

  var gridColumnEnd: GridPlacement
    get() {
      return style.gridColumnEnd
    }
    set(value) {
      style.gridColumnEnd = value
      checkAndUpdateStyle()
    }

  var gridRow: Line<GridPlacement>
    get() {
      return style.gridRow
    }
    set(value) {
      style.gridRow = value
      checkAndUpdateStyle()
    }

  var gridRowStart: GridPlacement
    get() {
      return style.gridRowStart
    }
    set(value) {
      style.gridRowStart = value
      checkAndUpdateStyle()
    }

  var gridRowEnd: GridPlacement
    get() {
      return style.gridRowEnd
    }
    set(value) {
      style.gridRowEnd = value
      checkAndUpdateStyle()
    }

  var gridTemplateRows: Array<TrackSizingFunction>
    get() {
      return style.gridTemplateRows
    }
    set(value) {
      style.gridTemplateRows = value
      checkAndUpdateStyle()
    }

  var gridTemplateColumns: Array<TrackSizingFunction>
    get() {
      return style.gridTemplateColumns
    }
    set(value) {
      style.gridTemplateColumns = value
      checkAndUpdateStyle()
    }

  override fun generateLayoutParams(attrs: AttributeSet): ViewGroup.LayoutParams {
    return LayoutParams(context, attrs)
  }

  override fun generateDefaultLayoutParams(): ViewGroup.LayoutParams {
    return LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
    )
  }

  override fun generateLayoutParams(p: ViewGroup.LayoutParams?): ViewGroup.LayoutParams {
    return LayoutParams(p)
  }

  override fun checkLayoutParams(p: ViewGroup.LayoutParams?): Boolean {
    return p is LayoutParams
  }

  class LayoutParams : ViewGroup.LayoutParams {
    internal var numericAttributes = SparseArray<Float>()
    internal var stringAttributes = SparseArray<String>()

    constructor(width: Int, height: Int) : super(width, height) {
      if (width >= 0) {
        numericAttributes.append(R.styleable.mason_mason_width, width.toFloat())
      }

      if (height >= 0) {
        numericAttributes.append(R.styleable.mason_mason_height, height.toFloat())
      }
    }

    constructor(source: ViewGroup.LayoutParams) : super(source) {
      if (source is LayoutParams) {
        numericAttributes = source.numericAttributes.clone()
        stringAttributes = source.stringAttributes.clone()
      } else {
        if (source.width >= 0) {
          numericAttributes.append(R.styleable.mason_mason_width, source.width.toFloat())
        }
        if (source.height >= 0) {
          numericAttributes.append(
            R.styleable.mason_mason_height, source.height.toFloat()
          )
        }
      }
    }

    constructor(context: Context, attrs: AttributeSet) : super(context, attrs) {
      val a = context.obtainStyledAttributes(attrs, R.styleable.mason)

      if (width >= 0) {
        numericAttributes.append(R.styleable.mason_mason_width, width.toFloat())
      }

      if (height >= 0) {
        numericAttributes.append(
          R.styleable.mason_mason_height, height.toFloat()
        )
      }

      val attributeCount = a.indexCount
      for (i in 0 until attributeCount) {
        val attribute = a.getIndex(i)
        val typedValue = TypedValue()
        a.getValue(attribute, typedValue)
        when (typedValue.type) {
          TypedValue.TYPE_DIMENSION -> {
            numericAttributes.put(
              attribute, a.getDimensionPixelSize(attribute, 0).toFloat()
            )
          }

          TypedValue.TYPE_STRING -> {
            stringAttributes.put(attribute, a.getString(attribute))
          }

          else -> {
            numericAttributes.put(attribute, a.getFloat(attribute, 0f))
          }
        }
      }

      a.recycle()
    }

  }

  companion object {
    internal val gson = Gson()

    @JvmStatic
    fun createGridView(context: Context): View {
      return View(context).apply {
        style.display = Display.Grid
      }
    }

    @JvmStatic
    fun createFlexView(context: Context): View {
      return View(context).apply {
        style.display = Display.Flex
      }
    }

    @JvmStatic
    fun createBlockView(context: Context): View {
      return View(context).apply {
        style.display = Display.Block
      }
    }
  }

  internal class ViewMeasureFunc(private val node: WeakReference<Node>) : MeasureFunc {
    private fun measure(
      width: Float, height: Float, availableWidth: Float, availableHeight: Float
    ): Size<Float> {

      val view = node.get()?.data as? android.view.View

      if (view == null) {
        return zeroSize
      } else if (view is View && view.childCount > 0) {
        return zeroSize
      }

      var widthIsNaN = width.isNaN()
      var heightIsNaN = height.isNaN()

      if (!widthIsNaN && !heightIsNaN) {
        return Size(width, height)
      }

      var retWidth = width
      var retHeight = height

      node.get()?.let { node ->

        val widthIsZero = node.style.size.width.isZero
        val heightIsZero = node.style.size.height.isZero

        // return early if the size is zero
        if (widthIsZero && heightIsZero) {
          retWidth = 0F
          retHeight = 0F
          return@let
        }

        if (widthIsNaN || (width.equals(0.0f) && !widthIsZero)) {
          when (node.style.size.width) {
            is Dimension.Points -> {
              retWidth = node.style.size.width.value
              if (!retWidth.isNaN()) widthIsNaN = false
            }

            is Dimension.Percent -> {
              val parentLayout = node.owner?.layout()
              parentLayout?.let {
                retWidth =
                  if (it.width.isNaN()) 0.0f else parentLayout.width * node.style.size.width.value
                widthIsNaN = false
              }
            }

            else -> {}
          }
        }

        if (heightIsNaN || (height.equals(0.0f) && !heightIsZero)) {
          when (node.style.size.height) {
            is Dimension.Points -> {
              retHeight = node.style.size.height.value
              if (!retHeight.isNaN()) heightIsNaN = false
            }

            is Dimension.Percent -> {
              val parentLayout = node.owner?.layout()
              parentLayout?.let {
                retHeight =
                  if (it.height.isNaN()) 0.0f else parentLayout.height * node.style.size.height.value
                heightIsNaN = false
              }
            }

            else -> {}
          }
        }

        val widthSpec = if (widthIsNaN) MeasureSpec.UNSPECIFIED else MeasureSpec.EXACTLY
        val heightSpec = if (heightIsNaN) MeasureSpec.UNSPECIFIED else MeasureSpec.EXACTLY


        view.measure(
          MeasureSpec.makeMeasureSpec(
            if (retWidth.isNaN()) 0 else retWidth.roundToInt(), widthSpec
          ), MeasureSpec.makeMeasureSpec(
            if (retHeight.isNaN()) 0 else retHeight.roundToInt(), heightSpec
          )
        )

        retWidth = view.measuredWidth.toFloat()
        retHeight = view.measuredHeight.toFloat()



        if (retWidth.equals(0f)) {
          retWidth = Float.NaN
        }

        if (retHeight.equals(0f)) {
          retHeight = Float.NaN
        }


      }

      return Size(retWidth, retHeight)
    }

    override fun measure(
      knownDimensions: Size<Float?>, availableSpace: Size<Float?>
    ): Size<Float> {
      val width = knownDimensions.width ?: Float.NaN
      val height = knownDimensions.height ?: Float.NaN

      val availableWidth = availableSpace.width ?: Float.NaN
      val availableHeight = availableSpace.height ?: Float.NaN

      return measure(width, height, availableWidth, availableHeight)
    }
  }

}
