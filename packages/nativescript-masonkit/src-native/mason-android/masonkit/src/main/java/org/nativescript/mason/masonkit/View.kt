package org.nativescript.mason.masonkit

import android.content.Context
import android.util.AttributeSet
import android.util.Log
import android.util.SparseArray
import android.util.TypedValue
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams
import androidx.annotation.Keep
import com.google.gson.Gson
import java.lang.ref.WeakReference
import java.util.WeakHashMap
import kotlin.math.roundToInt

interface MeasureFunc {
  fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float>
}

internal class MeasureFuncImpl(private val measureFunc: WeakReference<MeasureFunc>) {
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

  var style: Style
    get() {
      return node.style
    }
    set(value) {
      node.style = value
    }

  fun markNodeDirty(){
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

  val node = Node()

  private val nodes = mutableMapOf<android.view.View, Node>()

  init {
    node.data = this

    val layoutParams = if (attrs != null) {
      LayoutParams(context, attrs)
    } else {
      generateDefaultLayoutParams()
    }

    applyLayoutParams(layoutParams as LayoutParams, node, this);
  }

  fun nodeForView(view: android.view.View): Node {
    // TODO evaluate
    return nodesRef[view] ?: nodes[view] ?: run {
      val node = Node().apply { data = view }
      nodes[view] = node
      nodesRef[view] = node
      node
    }
  }

  private fun applyLayoutRecursive(node: Node, xOffset: Float, yOffset: Float) {
    val view = node.data as? android.view.View

    if (view != null && view !== this) {
      if (view.visibility == GONE) {
        return
      }

      val layout = node.layout()

      val widthIsNaN = layout.width.isNaN()
      val heightIsNaN = layout.height.isNaN()

      val measureWidth = if (widthIsNaN) 0 else layout.width.roundToInt()
      val measureHeight = if (heightIsNaN) 0 else layout.height.roundToInt()

      if (!node.isViewGroup && widthIsNaN or heightIsNaN) {
        val widthSpec = if (widthIsNaN) MeasureSpec.UNSPECIFIED else MeasureSpec.EXACTLY
        val heightSpec = if (heightIsNaN) MeasureSpec.UNSPECIFIED else MeasureSpec.EXACTLY

        view.measure(
          MeasureSpec.makeMeasureSpec(
            measureWidth,
            widthSpec
          ), MeasureSpec.makeMeasureSpec(
            measureHeight,
            heightSpec
          )
        )
      }


      val left = (xOffset + if (layout.x.isNaN()) 0F else layout.x).roundToInt()
      val top = (yOffset + if (layout.y.isNaN()) 0F else layout.y).roundToInt()

      val right =
        left + if (widthIsNaN && !node.isViewGroup) view.measuredWidth else layout.width.roundToInt()
      val bottom =
        top + if (heightIsNaN && !node.isViewGroup) view.measuredHeight else layout.height.roundToInt()

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
    if (parent !is View && (parent as? android.view.View)?.id == android.R.id.content) {
      createLayout(
        MeasureSpec.makeMeasureSpec(r - l, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(b - t, MeasureSpec.EXACTLY)
      )
    }
    applyLayoutRecursive(node, 0F, 0F)
  }

  private fun setSizeFromMeasureSpec(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val widthSize = MeasureSpec.getSize(widthMeasureSpec)
    val heightSize = MeasureSpec.getSize(heightMeasureSpec)

    var width: Dimension = Dimension.Points(widthSize.toFloat())
    var height: Dimension = Dimension.Points(heightSize.toFloat())

    val paramsWidth = layoutParams.width
    val paramsHeight = layoutParams.height

    if (widthSize == 0 && paramsWidth == ViewGroup.LayoutParams.WRAP_CONTENT) {
      width = Dimension.Undefined
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

    node.updateNodeStyle()
  }

  private fun createLayout(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setSizeFromMeasureSpec(widthMeasureSpec, heightMeasureSpec)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val layout = if (parent !is View) {
      if ((parent as? android.view.View)?.id == android.R.id.content) {
        setSizeFromMeasureSpec(widthMeasureSpec, heightMeasureSpec)
        //   node.updateNodeStyle()
      }
      // node.computeMaxContent()
      // node.layout()
      node.computeAndLayout()
    } else {
      node.layout()
    }

    setMeasuredDimension(layout.width.roundToInt(), layout.height.roundToInt())
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
      }.apply {
        data = child
        setMeasureFunction(ViewMeasureFunc(WeakReference(this)))
      }
    }

    val lp = child.layoutParams as? LayoutParams ?: run {
      LayoutParams(child.layoutParams)
    }

    applyLayoutParams(lp, childNode, child)

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
          Dimension.Points(backgroundPadding.left.toFloat()),
          Dimension.Points(backgroundPadding.right.toFloat()),
          Dimension.Points(backgroundPadding.top.toFloat()),
          Dimension.Points(backgroundPadding.bottom.toFloat())
        )
      }
    }

    var borderLeft: Dimension = Dimension.Undefined
    var borderRight: Dimension = Dimension.Undefined
    var borderTop: Dimension = Dimension.Undefined
    var borderBottom: Dimension = Dimension.Undefined

    var width: Dimension = Dimension.Auto
    var height: Dimension = Dimension.Auto

    var paddingLeft: Dimension = Dimension.Undefined
    var paddingRight: Dimension = Dimension.Undefined
    var paddingTop: Dimension = Dimension.Undefined
    var paddingBottom: Dimension = Dimension.Undefined

    var marginLeft: Dimension = Dimension.Undefined
    var marginRight: Dimension = Dimension.Undefined
    var marginTop: Dimension = Dimension.Undefined
    var marginBottom: Dimension = Dimension.Undefined

    var minWidth: Dimension = Dimension.Auto
    var minHeight: Dimension = Dimension.Auto

    var maxWidth: Dimension = Dimension.Auto
    var maxHeight: Dimension = Dimension.Auto

    var positionLeft: Dimension = Dimension.Undefined
    var positionRight: Dimension = Dimension.Undefined
    var positionTop: Dimension = Dimension.Undefined
    var positionBottom: Dimension = Dimension.Undefined

    for (i in 0 until layoutParameters.numericAttributes.size()) {
      val attribute: Int = layoutParameters.numericAttributes.keyAt(i)
      val value: Float = layoutParameters.numericAttributes.valueAt(i)

      when (attribute) {
        R.styleable.mason_flex_alignContent -> {
          node.style.alignContent = AlignContent.fromInt(value.roundToInt())
        }
        R.styleable.mason_flex_alignItems -> {
          node.style.alignItems = AlignItems.fromInt(value.roundToInt())
        }
        R.styleable.mason_flex_alignSelf -> {
          node.style.alignSelf = AlignSelf.fromInt(value.roundToInt())
        }
        R.styleable.mason_flex_aspectRatio -> {
          node.style.aspectRatio = value
        }
        R.styleable.mason_mason_borderLeft -> {
          // TODO handle direction
          borderLeft = Dimension.Points(value)
        }
        R.styleable.mason_mason_borderTop -> {
          borderTop = Dimension.Points(value)
        }
        R.styleable.mason_mason_borderRight -> {
          borderRight = Dimension.Points(value)
        }
        R.styleable.mason_mason_borderBottom -> {
          borderBottom = Dimension.Points(value)
        }
        R.styleable.mason_mason_borderStart -> {
          borderLeft = Dimension.Points(value)
        }
        R.styleable.mason_mason_borderEnd -> {
          borderRight = Dimension.Points(value)
        }
        R.styleable.mason_mason_borderAll -> {
          val points = Dimension.Points(value)
          borderLeft = points
          borderRight = points
          borderTop = points
          borderBottom = points
        }
        R.styleable.mason_mason_direction -> {
          node.style.direction = Direction.fromInt(value.roundToInt())
        }
        R.styleable.mason_mason_display -> {
          node.style.display = Display.fromInt(value.roundToInt())
        }
        R.styleable.mason_flex_basis -> {
          node.style.flexBasis = Dimension.Points(value)
        }
        R.styleable.mason_flex_direction -> {
          node.style.flexDirection = FlexDirection.fromInt(value.roundToInt())
        }
        R.styleable.mason_flex_grow -> {
          node.style.flexGrow = value
        }
        R.styleable.mason_flex_shrink -> {
          node.style.flexShrink = value
        }
        R.styleable.mason_mason_height -> {
          height = Dimension.Points(value)
        }
        R.styleable.mason_mason_marginLeft -> {
          marginLeft = Dimension.Points(value)
        }
        R.styleable.mason_flex_justifyContent -> {
          node.style.justifyContent = JustifyContent.fromInt(value.roundToInt())
        }
        R.styleable.mason_mason_marginTop -> {
          marginTop = Dimension.Points(value)
        }
        R.styleable.mason_mason_marginRight -> {
          marginRight = Dimension.Points(value)
        }
        R.styleable.mason_mason_marginBottom -> {
          marginBottom = Dimension.Points(value)
        }
        R.styleable.mason_mason_marginStart -> {
          marginLeft = Dimension.Points(value)
        }
        R.styleable.mason_mason_marginEnd -> {
          marginRight = Dimension.Points(value)
        }
        R.styleable.mason_mason_marginAll -> {
          val points = Dimension.Points(value)
          marginLeft = points
          marginRight = points
          marginTop = points
          marginBottom = points
        }
        R.styleable.mason_mason_maxHeight -> {
          maxWidth = Dimension.Points(value)
        }
        R.styleable.mason_mason_maxWidth -> {
          maxHeight = Dimension.Points(value)
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
          paddingLeft = Dimension.Points(value)
        }
        R.styleable.mason_mason_paddingTop -> {
          paddingTop = Dimension.Points(value)
        }
        R.styleable.mason_mason_paddingRight -> {
          paddingRight = Dimension.Points(value)
        }
        R.styleable.mason_mason_paddingBottom -> {
          paddingBottom = Dimension.Points(value)
        }
        R.styleable.mason_mason_paddingStart -> {
          paddingLeft = Dimension.Points(value)
        }
        R.styleable.mason_mason_paddingEnd -> {
          paddingRight = Dimension.Points(value)
        }
        R.styleable.mason_mason_paddingAll -> {
          val points = Dimension.Points(value)
          paddingLeft = points
          paddingRight = points
          paddingTop = points
          paddingBottom = points
        }
        R.styleable.mason_mason_positionLeft -> {
          positionLeft = Dimension.Points(value)
        }
        R.styleable.mason_mason_positionTop -> {
          positionTop = Dimension.Points(value)
        }
        R.styleable.mason_mason_positionRight -> {
          positionRight = Dimension.Points(value)
        }
        R.styleable.mason_mason_positionBottom -> {
          positionBottom = Dimension.Points(value)
        }
        R.styleable.mason_mason_positionStart -> {
          positionLeft = Dimension.Points(value)
        }
        R.styleable.mason_mason_positionEnd -> {
          positionRight = Dimension.Points(value)
        }
        R.styleable.mason_mason_positionAll -> {
          val points = Dimension.Points(value)
          positionLeft = points
          positionRight = points
          positionBottom = points
          positionTop = points
        }
        R.styleable.mason_mason_positionType -> {
          node.style.positionType = PositionType.fromInt(value.roundToInt())
        }
        R.styleable.mason_mason_width -> {
          width = Dimension.Points(value)
        }
        R.styleable.mason_flex_wrap -> {
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
            marginLeft = Dimension.Auto
          }
          R.styleable.mason_mason_marginTop -> {
            marginTop = Dimension.Auto
          }
          R.styleable.mason_mason_marginRight -> {
            marginRight = Dimension.Auto
          }
          R.styleable.mason_mason_marginBottom -> {
            marginBottom = Dimension.Auto
          }
          R.styleable.mason_mason_marginStart -> {
            marginLeft = Dimension.Auto
          }
          R.styleable.mason_mason_marginEnd -> {
            marginRight = Dimension.Auto
          }
          R.styleable.mason_mason_marginAll -> {
            marginLeft = Dimension.Auto
            marginRight = Dimension.Auto
            marginTop = Dimension.Auto
            marginBottom = Dimension.Auto
          }
        }
      }
      if (value.endsWith("%")) {
        val numericValue = value.replace("%", "").toFloat()
        when (attribute) {
          R.styleable.mason_flex_basis -> {
            node.style.flexBasis = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_height -> {
            height = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_marginLeft -> {
            marginLeft = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_marginTop -> {
            marginTop = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_marginRight -> {
            marginRight = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_marginBottom -> {
            marginBottom = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_marginStart -> {
            marginLeft = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_marginEnd -> {
            marginRight = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_marginAll -> {
            marginLeft = Dimension.Percent(numericValue)
            marginRight = Dimension.Percent(numericValue)
            marginTop = Dimension.Percent(numericValue)
            marginBottom = Dimension.Percent(numericValue)
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
            paddingLeft = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_paddingTop -> {
            paddingTop = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_paddingRight -> {
            paddingRight = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_paddingBottom -> {
            paddingBottom = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_paddingStart -> {
            paddingLeft = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_paddingEnd -> {
            paddingRight = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_paddingAll -> {
            val percent = Dimension.Percent(numericValue)
            paddingLeft = percent
            paddingRight = percent
            paddingTop = percent
            paddingBottom = percent
          }
          R.styleable.mason_mason_positionLeft -> {
            positionLeft = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_positionTop -> {
            positionTop = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_positionRight -> {
            positionRight = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_positionBottom -> {
            positionBottom = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_positionStart -> {
            positionLeft = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_positionEnd -> {
            positionRight = Dimension.Percent(numericValue)
          }
          R.styleable.mason_mason_positionAll -> {
            val percent = Dimension.Percent(numericValue)
            positionLeft = percent
            positionRight = percent
            positionTop = percent
            positionBottom = percent
          }
          R.styleable.mason_mason_width -> {
            width = Dimension.Percent(numericValue)
          }
        }
      }
      if (value == "undefined") {
        when (attribute) {
          R.styleable.mason_mason_width -> {
            width = Dimension.Undefined
          }
          R.styleable.mason_mason_height -> {
            width = Dimension.Undefined
          }
          R.styleable.mason_mason_marginLeft -> {
            marginLeft = Dimension.Undefined
          }
          R.styleable.mason_mason_marginTop -> {
            marginTop = Dimension.Undefined
          }
          R.styleable.mason_mason_marginRight -> {
            marginRight = Dimension.Undefined
          }
          R.styleable.mason_mason_marginBottom -> {
            marginBottom = Dimension.Undefined
          }
          R.styleable.mason_mason_marginStart -> {
            marginLeft = Dimension.Undefined
          }
          R.styleable.mason_mason_marginEnd -> {
            marginRight = Dimension.Undefined
          }
          R.styleable.mason_mason_marginAll -> {
            marginLeft = Dimension.Undefined
            marginRight = Dimension.Undefined
            marginTop = Dimension.Undefined
            marginBottom = Dimension.Undefined
          }
        }
      }
    }

    node.style.border = Rect(borderLeft, borderRight, borderTop, borderBottom)
    node.style.margin = Rect(marginLeft, marginRight, marginTop, marginBottom)
    node.style.padding = Rect(paddingLeft, paddingRight, paddingTop, paddingBottom)
    node.style.position = Rect(positionLeft, positionRight, positionTop, positionBottom)

    node.style.size = Size(width, height)
    node.style.minSize = Size(minWidth, minHeight)
    node.style.maxSize = Size(maxWidth, maxHeight)

    node.updateNodeStyle()
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

  var positionType: PositionType
    get() {
      return style.positionType
    }
    set(value) {
      style.positionType = value
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

  fun getPadding(): Rect<Dimension> {
    return style.padding
  }

  fun getStylePaddingLeft(): Dimension {
    return style.padding.left
  }

  fun getStylePaddingRight(): Dimension {
    return style.padding.right
  }

  fun getStylePaddingTop(): Dimension {
    return style.padding.top
  }

  fun getStylePaddingBottom(): Dimension {
    return style.padding.bottom
  }

  fun getPaddingCssValue(): String {
    return style.padding.cssValue()
  }

  fun getPaddingJsonValue(): String {
    return style.padding.jsonValue()
  }

  fun setPadding(left: Float, top: Float, right: Float, bottom: Float) {
    style.padding = Rect(
      Dimension.Points(left),
      Dimension.Points(right),
      Dimension.Points(top),
      Dimension.Points(bottom)
    )
    checkAndUpdateStyle()
  }

  fun setPadding(left: Dimension, top: Dimension, right: Dimension, bottom: Dimension) {
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
      Dimension.fromTypeValue(left_type, left) ?: Dimension.Undefined,
      Dimension.fromTypeValue(right_type, right) ?: Dimension.Undefined,
      Dimension.fromTypeValue(top_type, top) ?: Dimension.Undefined,
      Dimension.fromTypeValue(bottom_type, bottom) ?: Dimension.Undefined
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

  fun getBorder(): Rect<Dimension> {
    return style.border
  }

  fun getBorderLeft(): Dimension {
    return style.border.left
  }

  fun getBorderRight(): Dimension {
    return style.border.right
  }

  fun getBorderTop(): Dimension {
    return style.border.top
  }

  fun getBorderBottom(): Dimension {
    return style.border.bottom
  }

  fun getBorderCssValue(): String {
    return style.border.cssValue()
  }

  fun getBorderJsonValue(): String {
    return style.border.jsonValue()
  }

  fun setBorder(left: Float, top: Float, right: Float, bottom: Float) {
    style.border = Rect(
      Dimension.Points(left),
      Dimension.Points(right),
      Dimension.Points(top),
      Dimension.Points(bottom)
    )
    checkAndUpdateStyle()
  }

  fun setBorder(left: Dimension, top: Dimension, right: Dimension, bottom: Dimension) {
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
      Dimension.fromTypeValue(left_type, left) ?: Dimension.Undefined,
      Dimension.fromTypeValue(right_type, right) ?: Dimension.Undefined,
      Dimension.fromTypeValue(top_type, top) ?: Dimension.Undefined,
      Dimension.fromTypeValue(bottom_type, bottom) ?: Dimension.Undefined
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

  fun getMargin(): Rect<Dimension> {
    return style.margin
  }

  fun getMarginLeft(): Dimension {
    return style.margin.left
  }

  fun getMarginRight(): Dimension {
    return style.margin.right
  }

  fun getMarginTop(): Dimension {
    return style.margin.top
  }

  fun getMarginBottom(): Dimension {
    return style.margin.bottom
  }

  fun getMarginCssValue(): String {
    return style.margin.cssValue()
  }

  fun getMarginJsonValue(): String {
    return style.margin.jsonValue()
  }

  fun setMargin(left: Float, top: Float, right: Float, bottom: Float) {
    style.margin = Rect(
      Dimension.Points(left),
      Dimension.Points(right),
      Dimension.Points(top),
      Dimension.Points(bottom)
    )
    checkAndUpdateStyle()
  }

  fun setMargin(left: Dimension, top: Dimension, right: Dimension, bottom: Dimension) {
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
      Dimension.fromTypeValue(left_type, left) ?: Dimension.Undefined,
      Dimension.fromTypeValue(right_type, right) ?: Dimension.Undefined,
      Dimension.fromTypeValue(top_type, top) ?: Dimension.Undefined,
      Dimension.fromTypeValue(bottom_type, bottom) ?: Dimension.Undefined
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

  fun getPosition(): Rect<Dimension> {
    return style.position
  }

  fun getPositionLeft(): Dimension {
    return style.margin.left
  }

  fun getPositionRight(): Dimension {
    return style.position.right
  }

  fun getPositionTop(): Dimension {
    return style.position.top
  }

  fun getPositionBottom(): Dimension {
    return style.position.bottom
  }


  fun getPositionCssValue(): String {
    return style.position.cssValue()
  }

  fun getPositionJsonValue(): String {
    return style.position.jsonValue()
  }

  fun setPosition(left: Float, top: Float, right: Float, bottom: Float) {
    style.position = Rect(
      Dimension.Points(left),
      Dimension.Points(right),
      Dimension.Points(top),
      Dimension.Points(bottom)
    )
    checkAndUpdateStyle()
  }

  fun setPosition(left: Dimension, top: Dimension, right: Dimension, bottom: Dimension) {
    style.position = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle()
  }

  fun setPosition(
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    style.position = Rect(
      Dimension.fromTypeValue(left_type, left) ?: Dimension.Undefined,
      Dimension.fromTypeValue(right_type, right) ?: Dimension.Undefined,
      Dimension.fromTypeValue(top_type, top) ?: Dimension.Undefined,
      Dimension.fromTypeValue(bottom_type, bottom) ?: Dimension.Undefined
    )
    checkAndUpdateStyle()
  }

  fun setPositionLeft(value: Float, type: Int) {
    style.setPositionLeft(value, type)
    checkAndUpdateStyle()
  }

  fun setPositionRight(value: Float, type: Int) {
    style.setPositionRight(value, type)
    checkAndUpdateStyle()
  }

  fun setPositionTop(value: Float, type: Int) {
    style.setPositionTop(value, type)
    checkAndUpdateStyle()
  }

  fun setPositionBottom(value: Float, type: Int) {
    style.setPositionBottom(value, type)
    checkAndUpdateStyle()
  }

  fun setPositionWithValueType(value: Float, type: Int) {
    style.setPositionWithValueType(value, type)
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
    return style.minSize.cssValue()
  }

  fun getMinSizeJsonValue(): String {
    return style.minSize.jsonValue()
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
      Dimension.fromTypeValue(width_type, width) ?: Dimension.Undefined,
      Dimension.fromTypeValue(height_type, height) ?: Dimension.Undefined
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
    return style.size.cssValue()
  }

  fun getSizeJsonValue(): String {
    return style.size.jsonValue()
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
      Dimension.fromTypeValue(width_type, width) ?: Dimension.Undefined,
      Dimension.fromTypeValue(height_type, height) ?: Dimension.Undefined
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
    return style.maxSize.cssValue()
  }

  fun getMaxSizeJsonValue(): String {
    return style.maxSize.jsonValue()
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
      Dimension.fromTypeValue(width_type, width) ?: Dimension.Undefined,
      Dimension.fromTypeValue(height_type, height) ?: Dimension.Undefined
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

  fun setFlexGap(width: Float, height: Float) {
    style.flexGap = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )
    checkAndUpdateStyle()
  }

  fun getFlexGap(): Size<Dimension> {
    return style.flexGap
  }

  fun getFlexGapWidth(): Dimension {
    return style.flexGap.width
  }

  fun getFlexGapHeight(): Dimension {
    return style.flexGap.height
  }


  fun setFlexGap(width: Dimension, height: Dimension) {
    style.flexGap = Size(
      width,
      height,
    )
    checkAndUpdateStyle()
  }

  fun setFlexGap(
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    style.flexGap = Size(
      Dimension.fromTypeValue(width_type, width) ?: Dimension.Undefined,
      Dimension.fromTypeValue(height_type, height) ?: Dimension.Undefined
    )
    checkAndUpdateStyle()
  }

  fun setFlexGapWidth(value: Float, type: Int) {
    style.setFlexGapWidth(value, type)
    checkAndUpdateStyle()
  }

  fun setFlexHeight(value: Float, type: Int) {
    style.setFlexHeight(value, type)
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
    internal val nodesRef = WeakHashMap<android.view.View, Node>()

    internal val gson = Gson()

    init {
      Mason.initLib()
    }
  }

  internal class ViewMeasureFunc(private val node: WeakReference<Node>) : MeasureFunc {
    private fun measure(
      width: Float, height: Float, availableWidth: Float, availableHeight: Float
    ): Size<Float> {

      val view = node.get()?.data as? android.view.View

      if (view == null || view is View) {
        return zeroSize
      }

      var retWidth = width
      var retHeight = height

      node.get()?.let { node ->

        val widthIsNaN = width.isNaN()
        val heightIsNaN = height.isNaN()

        var measureWidth = if (widthIsNaN) 0 else width.roundToInt()
        var measureHeight = if (heightIsNaN) 0 else height.roundToInt()


        var widthSpec = if (widthIsNaN) MeasureSpec.UNSPECIFIED else MeasureSpec.EXACTLY

        var heightSpec = if (heightIsNaN) MeasureSpec.UNSPECIFIED else MeasureSpec.EXACTLY

/*

                if (widthIsNaN && view.layoutParams.width == ViewGroup.LayoutParams.MATCH_PARENT) {
                    if (!availableWidth.isNaN()){
                        measureWidth = availableWidth.roundToInt()
                        widthSpec = MeasureSpec.EXACTLY
                    }
                }

                if (heightIsNaN && view.layoutParams.height == ViewGroup.LayoutParams.MATCH_PARENT) {
                    if(!availableHeight.isNaN()) {
                        measureHeight = availableHeight.roundToInt()
                        heightSpec = MeasureSpec.EXACTLY
                    }
                }

                */

//                if (widthIsNaN && availableWidth.isNaN() && heightIsNaN && availableHeight.isNaN()){
//
//                }

//                if (view.layoutParams.width == ViewGroup.LayoutParams.MATCH_PARENT && view.layoutParams.height == ViewGroup.LayoutParams.MATCH_PARENT) {
//                    retWidth = availableWidth
//                    retHeight = availableHeight
//                    return@let
//                }


        if (view.layoutParams.width == ViewGroup.LayoutParams.WRAP_CONTENT && measureWidth == 0) {
          widthSpec = MeasureSpec.UNSPECIFIED
        }

        if (view.layoutParams.height == ViewGroup.LayoutParams.WRAP_CONTENT && measureHeight == 0) {
          heightSpec = MeasureSpec.UNSPECIFIED
        }

        view.measure(
          MeasureSpec.makeMeasureSpec(
            measureWidth, widthSpec
          ), MeasureSpec.makeMeasureSpec(
            measureHeight, heightSpec
          )
        )

        if (widthIsNaN) {
          retWidth = view.measuredWidth.toFloat()
          if (retWidth == 0F) {
            retWidth = Float.NaN
          }
        }

        if (heightIsNaN) {
          retHeight = view.measuredHeight.toFloat()
          if (retHeight == 0F) {
            retHeight = Float.NaN
          }
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
