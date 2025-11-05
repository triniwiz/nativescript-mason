package org.nativescript.mason.masonkit

import android.content.Context
import android.util.AttributeSet
import android.util.SparseArray
import android.util.TypedValue
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams
import androidx.core.content.withStyledAttributes
import androidx.core.util.size
import com.google.gson.Gson
import kotlin.math.roundToInt

class View @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0, override: Boolean = false
) : ViewGroup(context, attrs, defStyleAttr), Element,
  StyleChangeListener {

  override lateinit var node: Node

  // private set
  override val style: Style
    get() = node.style

  override val view: android.view.View
    get() = this

  private val nodes = mutableMapOf<android.view.View, Node>()

  constructor(context: Context, mason: Mason) : this(context) {
    node = mason.createNode().apply {
      view = this@View
    }
    node.style.setStyleChangeListener(this)
  }

  init {
    if (!override) {
      if (!::node.isInitialized) {
        node = Mason.shared.createNode().apply {
          view = this@View
        }

        node.style.setStyleChangeListener(this)
      }
    }
  }

  internal var isScrollRoot = false

  fun updateNodeAndStyle() {
    node.style.updateNativeStyle()
  }

  override fun onTextStyleChanged(change: Int) {
    Node.invalidateDescendantTextViews(node, change)
  }

//  fun setStyleFromString(style: String) {
//    try {
//      val parsedStyle = gson.fromJson(style, Style::class.java)
//      this.style = parsedStyle
//    } catch (_: Exception) {
//    }
//  }

  fun getStyleAsString(): String? {
    try {
      return gson.toJson(style)
    } catch (e: Exception) {
      e.printStackTrace()
    }
    return null
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

    compute(
      mapMeasureSpec(specWidthMode, specWidth).value,
      mapMeasureSpec(specHeightMode, specHeight).value
    )
    // todo cache layout
    val layout = layout()
    setMeasuredDimension(
      layout.width.toInt(),
      layout.height.toInt(),
    )
  }

  // Public addView methods delegate to Node
  override fun addView(child: android.view.View?) {
    child ?: return

    // Get or create a node for any view
    val childNode = if (child is Element) {
      (child as Element).node
    } else {
      node.mason.nodeForView(child)
    }


    // If suppression is active we are in a platform-driven addView (from Node) — avoid mutating nodes.
    if (node.suppressChildOps > 0) {
      super<ViewGroup>.addView(child)
      return
    }


    if (childNode.parent == node) {
      super<ViewGroup>.addView(child)
      return
    }

    node.appendChild(childNode)
  }

  override fun addView(child: android.view.View?, index: Int) {
    child ?: return

    val childNode = if (child is Element) {
      (child as Element).node
    } else {
      node.mason.nodeForView(child)
    }


    // If suppression is active we are in a platform-driven addView (from Node) — avoid mutating nodes.
    if (node.suppressChildOps > 0) {
      super<ViewGroup>.addView(child, index)
      return
    }


    if (childNode.parent == node) {
      super<ViewGroup>.addView(child, index)
      return
    }

    node.addChildAt(childNode, index)
  }

  override fun addView(child: android.view.View?, params: ViewGroup.LayoutParams?) {
    child ?: return

    val childNode = if (child is Element) {
      (child as Element).node
    } else {
      node.mason.nodeForView(child)
    }

    // If suppression is active we are in a platform-driven addView (from Node) — avoid mutating nodes.
    if (node.suppressChildOps > 0) {
      super<ViewGroup>.addView(child, params)
      return
    }

    if (childNode.parent == node) {
      super<ViewGroup>.addView(child, params)
      return
    }

    node.appendChild(childNode)
  }

  override fun addView(child: android.view.View?, index: Int, params: ViewGroup.LayoutParams?) {
    child ?: return

    val childNode = if (child is Element) {
      (child as Element).node
    } else {
      node.mason.nodeForView(child)
    }

    // If suppression is active we are in a platform-driven addView (from Node) — avoid mutating nodes.
    if (node.suppressChildOps > 0) {
      super<ViewGroup>.addView(child, index, params)
      return
    }


    if (childNode.parent == node) {
      super<ViewGroup>.addView(child, index, params)
      return
    }

    node.addChildAt(childNode, index)
  }

  override fun removeView(view: android.view.View?) {
    view ?: return

    val childNode = if (view is Element) {
      (view as Element).node
    } else {
      node.mason.nodeForView(view)
    }

    // If suppression is active we are in a platform-driven addView (from Node) — avoid mutating nodes.
    if (node.suppressChildOps > 0) {
      super.removeView(view)
      return
    }

    if (childNode.parent == node) {
      super.removeView(view)
      return
    }

    node.removeChild(childNode)
  }

  override fun removeViewAt(index: Int) {
    // If suppression is active we are in a platform-driven addView (from Node) — avoid mutating nodes.
    if (node.suppressChildOps > 0) {
      super.removeViewAt(index)
      return
    }
    node.removeChildAt(index)
  }

  override fun removeAllViews() {
    // If suppression is active we are in a platform-driven addView (from Node) — avoid mutating nodes.
    if (node.suppressChildOps > 0) {
      super.removeAllViews()
      return
    }
    node.removeChildren()
  }

  override fun removeViewInLayout(view: android.view.View) {
    if (node.suppressChildOps > 0) {
      removeViewFromMasonTree(view, true)
    }
    super.removeViewInLayout(view)
  }

  override fun removeViews(start: Int, count: Int) {
    if (node.suppressChildOps > 0) {
      for (i in start until start + count) {
        removeViewFromMasonTree(getChildAt(i), false)
      }
    }
    super.removeViews(start, count)
  }

  override fun removeViewsInLayout(start: Int, count: Int) {
    if (node.suppressChildOps > 0) {
      for (i in start until start + count) {
        removeViewFromMasonTree(getChildAt(i), true)
      }
    }
    super.removeViewsInLayout(start, count)
  }

  override fun removeAllViewsInLayout() {
    if (node.suppressChildOps > 0) {
      val childCount = nodes.count()
      for (i in 0 until childCount) {
        removeViewFromMasonTree(getChildAt(i), true)
      }
    }
    super.removeAllViewsInLayout()
  }

  private fun removeViewFromMasonTree(view: android.view.View, inLayout: Boolean) {
    nodes[view]?.let { node ->
      val owner = node.parent as Node
      val count = owner.getChildCount()
      for (i in 0 until count) {
        owner.getChildAt(i)?.let {
          if (it == node) {
            owner.removeChildAt(i)
            return
          }
        }
      }
      node.view = null
      nodes.remove(view)
      if (inLayout) {
        computeMaxContent()
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

    for (i in 0 until layoutParameters.numericAttributes.size) {
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
          val overflow = Overflow.fromInt(value.roundToInt())
          node.style.overflow = Point(overflow, overflow)
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

    for (i in 0 until layoutParameters.stringAttributes.size) {
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

  private fun checkAndUpdateStyle() {
    if (!node.style.inBatch) {
      node.style.updateNativeStyle()
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

  var overflow: Point<Overflow>
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


  var scrollBarWidth: Float
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
    left: LengthPercentage, top: LengthPercentage, right: LengthPercentage, bottom: LengthPercentage
  ) {
    style.padding = Rect(
      left, right, top, bottom
    )
    checkAndUpdateStyle()
  }

  fun setPadding(
    left: Float,
    leftType: Int,
    top: Float,
    topType: Int,
    right: Float,
    rightType: Int,
    bottom: Float,
    bottomType: Int
  ) {
    style.padding = Rect(
      LengthPercentage.fromTypeValue(leftType, left) ?: style.padding.left,
      LengthPercentage.fromTypeValue(rightType, right) ?: style.padding.right,
      LengthPercentage.fromTypeValue(topType, top) ?: style.padding.top,
      LengthPercentage.fromTypeValue(bottomType, bottom) ?: style.padding.bottom
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
    left: LengthPercentage, top: LengthPercentage, right: LengthPercentage, bottom: LengthPercentage
  ) {
    style.border = Rect(
      left, right, top, bottom
    )
    checkAndUpdateStyle()
  }

  fun setBorder(
    left: Float,
    leftType: Int,
    top: Float,
    topType: Int,
    right: Float,
    rightType: Int,
    bottom: Float,
    bottomType: Int
  ) {
    style.border = Rect(
      LengthPercentage.fromTypeValue(leftType, left) ?: style.border.left,
      LengthPercentage.fromTypeValue(rightType, right) ?: style.border.right,
      LengthPercentage.fromTypeValue(topType, top) ?: style.border.top,
      LengthPercentage.fromTypeValue(bottomType, bottom) ?: style.border.bottom
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
      left, right, top, bottom
    )
    checkAndUpdateStyle()
  }

  fun setMargin(
    left: Float,
    leftType: Int,
    top: Float,
    topType: Int,
    right: Float,
    rightType: Int,
    bottom: Float,
    bottomType: Int
  ) {
    style.margin = Rect(
      LengthPercentageAuto.fromTypeValue(leftType, left) ?: style.margin.left,
      LengthPercentageAuto.fromTypeValue(rightType, right) ?: style.margin.right,
      LengthPercentageAuto.fromTypeValue(topType, top) ?: style.margin.top,
      LengthPercentageAuto.fromTypeValue(bottomType, bottom) ?: style.margin.bottom
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
      left, right, top, bottom
    )
    checkAndUpdateStyle()
  }

  fun setInset(
    left: Float,
    leftType: Int,
    top: Float,
    topType: Int,
    right: Float,
    rightType: Int,
    bottom: Float,
    bottomType: Int
  ) {
    style.inset = Rect(
      LengthPercentageAuto.fromTypeValue(leftType, left) ?: style.inset.left,
      LengthPercentageAuto.fromTypeValue(rightType, right) ?: style.inset.right,
      LengthPercentageAuto.fromTypeValue(topType, top) ?: style.inset.top,
      LengthPercentageAuto.fromTypeValue(bottomType, bottom) ?: style.inset.bottom
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
    widthType: Int,
    height: Float,
    heightType: Int,
  ) {
    style.minSize = Size(
      Dimension.fromTypeValue(widthType, width) ?: style.minSize.width,
      Dimension.fromTypeValue(heightType, height) ?: style.minSize.height
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
    widthType: Int,
    height: Float,
    heightType: Int,
  ) {
    style.size = Size(
      Dimension.fromTypeValue(widthType, width) ?: style.size.width,
      Dimension.fromTypeValue(heightType, height) ?: style.size.height
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
    widthType: Int,
    height: Float,
    heightType: Int,
  ) {
    style.maxSize = Size(
      Dimension.fromTypeValue(widthType, width) ?: style.size.width,
      Dimension.fromTypeValue(heightType, height) ?: style.size.height
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
    widthType: Int,
    height: Float,
    heightType: Int,
  ) {
    style.gap = Size(
      LengthPercentage.fromTypeValue(widthType, width) ?: style.gap.width,
      LengthPercentage.fromTypeValue(heightType, height) ?: style.gap.height
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
      context.withStyledAttributes(attrs, R.styleable.mason) {

        if (width >= 0) {
          numericAttributes.append(R.styleable.mason_mason_width, width.toFloat())
        }

        if (height >= 0) {
          numericAttributes.append(
            R.styleable.mason_mason_height, height.toFloat()
          )
        }

        val attributeCount = indexCount
        for (i in 0 until attributeCount) {
          val attribute = getIndex(i)
          val typedValue = TypedValue()
          getValue(attribute, typedValue)
          when (typedValue.type) {
            TypedValue.TYPE_DIMENSION -> {
              numericAttributes.put(
                attribute, getDimensionPixelSize(attribute, 0).toFloat()
              )
            }

            TypedValue.TYPE_STRING -> {
              stringAttributes.put(attribute, getString(attribute))
            }

            else -> {
              numericAttributes.put(attribute, getFloat(attribute, 0f))
            }
          }
        }

      }
    }

  }

  companion object {
    internal fun mapMeasureSpec(mode: Int, value: Int): AvailableSpace {
      return when (mode) {
        MeasureSpec.EXACTLY -> AvailableSpace.Definite(value.toFloat())
        MeasureSpec.UNSPECIFIED -> {
          if (value != 0) {
            AvailableSpace.Definite(value.toFloat())
          } else {
            AvailableSpace.MaxContent
          }
        }

        MeasureSpec.AT_MOST -> {
          if (value != 0) {
            AvailableSpace.Definite(value.toFloat())
          } else {
            AvailableSpace.MaxContent
          }
        }

        else -> AvailableSpace.MinContent
      }
    }

    internal val gson = Gson()

    @JvmStatic
    fun createGridView(mason: Mason, context: Context): View {
      return View(context, mason).apply {
        style.display = Display.Grid
      }
    }

    @JvmStatic
    fun createFlexView(mason: Mason, context: Context): View {
      return View(context, mason).apply {
        style.display = Display.Flex
      }
    }

    @JvmStatic
    fun createBlockView(mason: Mason, context: Context): View {
      return View(context, mason).apply {
        style.display = Display.Block
      }
    }
  }
}
