package org.nativescript.mason.masonkit

import android.view.ViewGroup
import java.lang.ref.WeakReference
import java.util.WeakHashMap

class Node private constructor(private var nativePtr: Long) {
  var isViewGroup: Boolean = false
    private set

  var data: Any? = null
    set(value) {
      field = value
      isViewGroup = value is ViewGroup
    }

  var owner: Node? = null
    internal set
  private var children = mutableListOf<Node>()

  constructor() : this(0) {
    nativePtr = nativeNewNodeWithMeasureFunc(
      Mason.instance.nativePtr, style.getNativePtr(), MeasureFuncImpl(
        WeakReference(
          View.ViewMeasureFunc(
            WeakReference(this)
          )
        )
      )
    )
  }

  constructor(style: Style) : this(
    nativeNewNode(
      Mason.instance.nativePtr,
      style.getNativePtr()
    )
  ) {
    this.style = style
  }

  constructor(
    style: Style,
    children: Array<Node>
  ) : this(
    nativeNewNodeWithChildren(
      Mason.instance.nativePtr,
      style.getNativePtr(),
      children.map { it.nativePtr }.toLongArray()
    )
  ) {
    children.forEach {
      it.owner = this
    }
    this.children.addAll(children)

    this.style = style
  }

  constructor(style: Style, measure: MeasureFunc) : this(
    nativeNewNodeWithMeasureFunc(
      Mason.instance.nativePtr, style.getNativePtr(), MeasureFuncImpl(
        WeakReference(measure)
      )
    )
  ) {
    this.style = style
  }

  var style = Style()
    set(value) {
      field = value
      nativeSetStyle(Mason.instance.nativePtr, nativePtr, value.getNativePtr())
    }

  internal fun updateNodeStyle() {
    if (style.isDirty) {
      nativeUpdateAndSetStyle(
        Mason.instance.nativePtr, nativePtr, style.getNativePtr(),
        style.display.ordinal,
        style.positionType.ordinal,
        style.direction.ordinal,
        style.flexDirection.ordinal,
        style.flexWrap.ordinal,
        style.overflow.ordinal,
        style.alignItems.ordinal,
        style.alignSelf.ordinal,
        style.alignContent.ordinal,
        style.justifyContent.ordinal,

        style.position.left.type,
        style.position.left.value,
        style.position.right.type,
        style.position.right.value,
        style.position.top.type,
        style.position.top.value,
        style.position.bottom.type,
        style.position.bottom.value,

        style.margin.left.type,
        style.margin.left.value,
        style.margin.right.type,
        style.margin.right.value,
        style.margin.top.type,
        style.margin.top.value,
        style.margin.bottom.type,
        style.margin.bottom.value,

        style.padding.left.type,
        style.padding.left.value,
        style.padding.right.type,
        style.padding.right.value,
        style.padding.top.type,
        style.padding.top.value,
        style.padding.bottom.type,
        style.padding.bottom.value,

        style.border.left.type,
        style.border.left.value,
        style.border.right.type,
        style.border.right.value,
        style.border.top.type,
        style.border.top.value,
        style.border.bottom.type,
        style.border.bottom.value,

        style.flexGrow,
        style.flexShrink,

        style.flexBasis.type,
        style.flexBasis.value,

        style.size.width.type,
        style.size.width.value,
        style.size.height.type,
        style.size.height.value,

        style.minSize.width.type,
        style.minSize.width.value,
        style.minSize.height.type,
        style.minSize.height.value,

        style.maxSize.width.type,
        style.maxSize.width.value,
        style.maxSize.height.type,
        style.maxSize.height.value,

        style.flexGap.width.type,
        style.flexGap.width.value,
        style.flexGap.height.type,
        style.flexGap.height.value,

        style.aspectRatio ?: Float.NaN
      )
    } else {
      nativeSetStyle(Mason.instance.nativePtr, nativePtr, style.getNativePtr())
    }
  }

  fun configure(block: (Node) -> Unit) {
    block(this)
    updateNodeStyle()
  }

  @JvmOverloads
  fun computeAndLayout(size: Size<Float>? = null): Layout {
    if (size != null) {
      return Layout.fromFloatArray(
        nativeUpdateSetStyleComputeWithSizeAndLayout(
          Mason.instance.nativePtr,
          nativePtr,
          style.getNativePtr(),
          size.width, size.height,
          style.display.ordinal,
          style.positionType.ordinal,
          style.direction.ordinal,
          style.flexDirection.ordinal,
          style.flexWrap.ordinal,
          style.overflow.ordinal,
          style.alignItems.ordinal,
          style.alignSelf.ordinal,
          style.alignContent.ordinal,
          style.justifyContent.ordinal,

          style.position.left.type,
          style.position.left.value,
          style.position.right.type,
          style.position.right.value,
          style.position.top.type,
          style.position.top.value,
          style.position.bottom.type,
          style.position.bottom.value,

          style.margin.left.type,
          style.margin.left.value,
          style.margin.right.type,
          style.margin.right.value,
          style.margin.top.type,
          style.margin.top.value,
          style.margin.bottom.type,
          style.margin.bottom.value,

          style.padding.left.type,
          style.padding.left.value,
          style.padding.right.type,
          style.padding.right.value,
          style.padding.top.type,
          style.padding.top.value,
          style.padding.bottom.type,
          style.padding.bottom.value,

          style.border.left.type,
          style.border.left.value,
          style.border.right.type,
          style.border.right.value,
          style.border.top.type,
          style.border.top.value,
          style.border.bottom.type,
          style.border.bottom.value,

          style.flexGrow,
          style.flexShrink,

          style.flexBasis.type,
          style.flexBasis.value,

          style.size.width.type,
          style.size.width.value,
          style.size.height.type,
          style.size.height.value,

          style.minSize.width.type,
          style.minSize.width.value,
          style.minSize.height.type,
          style.minSize.height.value,

          style.maxSize.width.type,
          style.maxSize.width.value,
          style.maxSize.height.type,
          style.maxSize.height.value,

          style.flexGap.width.type,
          style.flexGap.width.value,
          style.flexGap.height.type,
          style.flexGap.height.value,

          style.aspectRatio ?: Float.NaN
        ), 0
      ).second
    }
    return Layout.fromFloatArray(
      nativeUpdateSetStyleComputeAndLayout(
        Mason.instance.nativePtr, nativePtr, style.getNativePtr(),
        style.display.ordinal,
        style.positionType.ordinal,
        style.direction.ordinal,
        style.flexDirection.ordinal,
        style.flexWrap.ordinal,
        style.overflow.ordinal,
        style.alignItems.ordinal,
        style.alignSelf.ordinal,
        style.alignContent.ordinal,
        style.justifyContent.ordinal,

        style.position.left.type,
        style.position.left.value,
        style.position.right.type,
        style.position.right.value,
        style.position.top.type,
        style.position.top.value,
        style.position.bottom.type,
        style.position.bottom.value,

        style.margin.left.type,
        style.margin.left.value,
        style.margin.right.type,
        style.margin.right.value,
        style.margin.top.type,
        style.margin.top.value,
        style.margin.bottom.type,
        style.margin.bottom.value,

        style.padding.left.type,
        style.padding.left.value,
        style.padding.right.type,
        style.padding.right.value,
        style.padding.top.type,
        style.padding.top.value,
        style.padding.bottom.type,
        style.padding.bottom.value,

        style.border.left.type,
        style.border.left.value,
        style.border.right.type,
        style.border.right.value,
        style.border.top.type,
        style.border.top.value,
        style.border.bottom.type,
        style.border.bottom.value,

        style.flexGrow,
        style.flexShrink,

        style.flexBasis.type,
        style.flexBasis.value,

        style.size.width.type,
        style.size.width.value,
        style.size.height.type,
        style.size.height.value,

        style.minSize.width.type,
        style.minSize.width.value,
        style.minSize.height.type,
        style.minSize.height.value,

        style.maxSize.width.type,
        style.maxSize.width.value,
        style.maxSize.height.type,
        style.maxSize.height.value,

        style.flexGap.width.type,
        style.flexGap.width.value,
        style.flexGap.height.type,
        style.flexGap.height.value,

        style.aspectRatio ?: Float.NaN
      ), 0
    ).second
  }

  fun layout(): Layout {
    return Layout.fromFloatArray(nativeLayout(Mason.instance.nativePtr, nativePtr), 0).second
  }

  fun getNativePtr(): Long {
    return nativePtr
  }

  fun compute() {
    nativeCompute(Mason.instance.nativePtr, nativePtr)
  }

  fun compute(width: Float, height: Float) {
    nativeComputeWH(Mason.instance.nativePtr, nativePtr, width, height)
  }

  fun computeMaxContent() {
    nativeComputeMaxContent(Mason.instance.nativePtr, nativePtr)
  }

  fun computeMinContent() {
    nativeComputeMinContent(Mason.instance.nativePtr, nativePtr)
  }

  fun getChildAt(index: Int): Node? {
    if (Mason.shared) {
      val child = nativeGetChildAt(Mason.instance.nativePtr, nativePtr, index)
      if (child == 0L) {
        return null
      }
      return Node(child)
    }
    return children[index]
  }

  fun addChild(child: Node): Node? {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }

    nativeAddChild(Mason.instance.nativePtr, nativePtr, child.nativePtr)

    if (nodes.containsKey(child.nativePtr)) {
      return nodes[child.nativePtr]?.apply { owner = this }
    }

    child.owner = this

    children.add(child)

    nodes[child.nativePtr] = child

    return child
  }

  fun addChildAt(child: Node, index: Int) {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }

    if (index == -1) {
      nativeAddChild(Mason.instance.nativePtr, nativePtr, child.nativePtr)
      return
    }

    nativeAddChildAt(Mason.instance.nativePtr, nativePtr, child.nativePtr, index)

    if (nodes.containsKey(child.nativePtr)) {
      nodes[child.nativePtr]?.apply { owner = this }
      return
    }

    child.owner = this

    val ret = children.set(index, child)

    nodes.remove(ret.nativePtr)
    nodes[child.nativePtr] = child

    ret.owner = null
  }

  fun insertChildBefore(child: Node, referenceChild: Node) {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }


    nativeInsertChildBefore(
      Mason.instance.nativePtr,
      nativePtr,
      child.nativePtr,
      referenceChild.nativePtr
    )

    if (nodes.containsKey(child.nativePtr)) {
      nodes[child.nativePtr]?.apply { owner = this }
      return
    }
    child.owner = this
    val index = children.indexOf(referenceChild)
    if (index != -1) {
      children.add(index, child)
      nodes[child.nativePtr] = child
    }
  }

  fun insertChildAfter(child: Node, referenceChild: Node) {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }


    nativeInsertChildAfter(
      Mason.instance.nativePtr,
      nativePtr,
      child.nativePtr,
      referenceChild.nativePtr
    )

    if (nodes.containsKey(child.nativePtr)) {
      nodes[child.nativePtr]?.apply { owner = this }
      return
    }
    child.owner = this
    val index = children.indexOf(referenceChild)
    if (index != -1) {
      val newPosition = index + 1
      if (newPosition == children.size) {
        children.add(child)
      } else {
        children.add(newPosition, child)
      }
      nodes[child.nativePtr] = child
    }
  }

  fun removeChildren() {
    nativeRemoveChildren(Mason.instance.nativePtr, nativePtr)
    children.forEach { it.owner = null }
    children.clear()
  }

  fun removeChild(child: Node): Node? {
    val removedNode = nativeRemoveChild(Mason.instance.nativePtr, nativePtr, child.nativePtr)
    if (removedNode == 0L) {
      return null
    }
    assert(child.nativePtr == removedNode)
    child.owner = null
    children.remove(child)
    nodes.remove(child.nativePtr)

    return child
  }

  fun removeChildAt(index: Int): Node? {
    val removedNode = nativeRemoveChildAt(Mason.instance.nativePtr, nativePtr, index)

    if (removedNode == 0L) {
      return null
    }

    return nodes.remove(removedNode)?.apply {
      owner = null
      children.remove(this)
    } ?: Node(removedNode)
  }

  fun dirty() {
    nativeMarkDirty(Mason.instance.nativePtr, nativePtr)
  }

  fun isDirty(): Boolean {
    return nativeDirty(Mason.instance.nativePtr, nativePtr)
  }

  fun getChildCount(): Int {
    if (Mason.shared) {
      return nativeGetChildCount(Mason.instance.nativePtr, nativePtr)
    }
    return children.size
  }

  fun getChildren(): Array<Node> {
    if (Mason.shared) {
      val children = nativeGetChildren(Mason.instance.nativePtr, nativePtr)
      val ret = arrayOfNulls<Node>(children.size)
      for (i in children.indices) {
        val child = Node(children[i])
        child.owner = this
        ret[i] = child
      }
      return ret.requireNoNulls()
    }
    return children.toTypedArray()
  }

  fun setMeasureFunction(measure: MeasureFunc) {
    nativeSetMeasureFunc(
      Mason.instance.nativePtr,
      nativePtr,
      MeasureFuncImpl(WeakReference(measure))
    )
  }

  fun removeMeasureFunction() {
    nativeRemoveMeasureFunc(Mason.instance.nativePtr, nativePtr)
  }

  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
    owner?.removeChild(this)
    nativeDestroy(nativePtr)
    nativePtr = 0L
  }

  companion object {
    init {
      Mason.initLib()
    }

    @JvmStatic
    internal val nodes = WeakHashMap<Long, Node>()

    @JvmStatic
    private external fun nativeNewNode(mason: Long, style: Long): Long

    @JvmStatic
    private external fun nativeNewNodeWithChildren(
      mason: Long,
      style: Long,
      children: LongArray
    ): Long

    @JvmStatic
    private external fun nativeNewNodeWithMeasureFunc(
      mason: Long,
      style: Long,
      measure: Any
    ): Long

  }

  private external fun nativeDestroy(
    mason: Long,
  )

  private external fun nativeLayout(
    mason: Long,
    node: Long,
  ): FloatArray

  private external fun nativeCompute(mason: Long, node: Long)

  private external fun nativeComputeWH(mason: Long, node: Long, width: Float, height: Float)

  private external fun nativeComputeMaxContent(mason: Long, node: Long)

  private external fun nativeComputeMinContent(mason: Long, node: Long)

  private external fun nativeAddChild(
    mason: Long,
    node: Long,
    child: Long
  )

  private external fun nativeAddChildAt(
    mason: Long,
    node: Long,
    child: Long,
    index: Int
  )

  private external fun nativeReplaceChildAt(
    mason: Long,
    node: Long,
    child: Long,
    index: Int
  ): Long


  private external fun nativeInsertChildBefore(
    mason: Long,
    node: Long,
    child: Long,
    reference: Long
  )

  private external fun nativeInsertChildAfter(
    mason: Long,
    node: Long,
    child: Long,
    reference: Long
  )


  private external fun nativeGetChildAt(mason: Long, node: Long, index: Int): Long

  private external fun nativeGetChildCount(mason: Long, node: Long): Int

  private external fun nativeMarkDirty(mason: Long, node: Long)

  private external fun nativeDirty(mason: Long, node: Long): Boolean

  private external fun nativeRemoveChildren(
    mason: Long,
    node: Long,
  )

  private external fun nativeRemoveChildAt(
    mason: Long,
    node: Long,
    index: Int
  ): Long

  private external fun nativeRemoveChild(
    mason: Long,
    node: Long,
    child: Long,
  ): Long

  private external fun nativeGetChildren(
    mason: Long,
    node: Long
  ): LongArray

  private external fun nativeSetMeasureFunc(
    mason: Long,
    node: Long,
    measureFunc: Any
  )

  private external fun nativeRemoveMeasureFunc(
    mason: Long,
    node: Long
  )

  private external fun nativeSetStyle(mason: Long, node: Long, style: Long)

  private external fun nativeUpdateAndSetStyle(
    mason: Long, node: Long, style: Long, display: Int,
    positionType: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyContent: Int,

    positionLeftType: Int,
    positionLeftValue: Float,
    positionRightType: Int,
    positionRightValue: Float,
    positionTopType: Int,
    positionTopValue: Float,
    positionBottomType: Int,
    positionBottomValue: Float,

    marginLeftType: Int,
    marginLeftValue: Float,
    marginRightType: Int,
    marginRightValue: Float,
    marginTopType: Int,
    marginTopValue: Float,
    marginBottomType: Int,
    marginBottomValue: Float,

    paddingLeftType: Int,
    paddingLeftValue: Float,
    paddingRightType: Int,
    paddingRightValue: Float,
    paddingTopType: Int,
    paddingTopValue: Float,
    paddingBottomType: Int,
    paddingBottomValue: Float,

    borderLeftType: Int,
    borderLeftValue: Float,
    borderRightType: Int,
    borderRightValue: Float,
    borderTopType: Int,
    borderTopValue: Float,
    borderBottomType: Int,
    borderBottomValue: Float,

    flexGrow: Float,
    flexShrink: Float,

    flexBasisType: Int,
    flexBasisValue: Float,

    widthType: Int,
    widthValue: Float,
    heightType: Int,
    heightValue: Float,

    minWidthType: Int,
    minWidthValue: Float,
    minHeightType: Int,
    minHeightValue: Float,

    maxWidthType: Int,
    maxWidthValue: Float,
    maxHeightType: Int,
    maxHeightValue: Float,

    flexGapWidthType: Int,
    flexGapWidthValue: Float,
    flexGapHeightType: Int,
    flexGapHeightValue: Float,

    aspectRatio: Float
  )


  private external fun nativeUpdateSetStyleComputeAndLayout(
    mason: Long, node: Long, style: Long, display: Int,
    positionType: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyContent: Int,

    positionLeftType: Int,
    positionLeftValue: Float,
    positionRightType: Int,
    positionRightValue: Float,
    positionTopType: Int,
    positionTopValue: Float,
    positionBottomType: Int,
    positionBottomValue: Float,

    marginLeftType: Int,
    marginLeftValue: Float,
    marginRightType: Int,
    marginRightValue: Float,
    marginTopType: Int,
    marginTopValue: Float,
    marginBottomType: Int,
    marginBottomValue: Float,

    paddingLeftType: Int,
    paddingLeftValue: Float,
    paddingRightType: Int,
    paddingRightValue: Float,
    paddingTopType: Int,
    paddingTopValue: Float,
    paddingBottomType: Int,
    paddingBottomValue: Float,

    borderLeftType: Int,
    borderLeftValue: Float,
    borderRightType: Int,
    borderRightValue: Float,
    borderTopType: Int,
    borderTopValue: Float,
    borderBottomType: Int,
    borderBottomValue: Float,

    flexGrow: Float,
    flexShrink: Float,

    flexBasisType: Int,
    flexBasisValue: Float,

    widthType: Int,
    widthValue: Float,
    heightType: Int,
    heightValue: Float,

    minWidthType: Int,
    minWidthValue: Float,
    minHeightType: Int,
    minHeightValue: Float,

    maxWidthType: Int,
    maxWidthValue: Float,
    maxHeightType: Int,
    maxHeightValue: Float,

    flexGapWidthType: Int,
    flexGapWidthValue: Float,
    flexGapHeightType: Int,
    flexGapHeightValue: Float,

    aspectRatio: Float
  ): FloatArray

  private external fun nativeUpdateSetStyleComputeWithSizeAndLayout(
    mason: Long,
    node: Long,
    style: Long,
    width: Float,
    height: Float,
    display: Int,
    positionType: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyContent: Int,

    positionLeftType: Int,
    positionLeftValue: Float,
    positionRightType: Int,
    positionRightValue: Float,
    positionTopType: Int,
    positionTopValue: Float,
    positionBottomType: Int,
    positionBottomValue: Float,

    marginLeftType: Int,
    marginLeftValue: Float,
    marginRightType: Int,
    marginRightValue: Float,
    marginTopType: Int,
    marginTopValue: Float,
    marginBottomType: Int,
    marginBottomValue: Float,

    paddingLeftType: Int,
    paddingLeftValue: Float,
    paddingRightType: Int,
    paddingRightValue: Float,
    paddingTopType: Int,
    paddingTopValue: Float,
    paddingBottomType: Int,
    paddingBottomValue: Float,

    borderLeftType: Int,
    borderLeftValue: Float,
    borderRightType: Int,
    borderRightValue: Float,
    borderTopType: Int,
    borderTopValue: Float,
    borderBottomType: Int,
    borderBottomValue: Float,

    flexGrow: Float,
    flexShrink: Float,

    flexBasisType: Int,
    flexBasisValue: Float,

    widthType: Int,
    widthValue: Float,
    heightType: Int,
    heightValue: Float,

    minWidthType: Int,
    minWidthValue: Float,
    minHeightType: Int,
    minHeightValue: Float,

    maxWidthType: Int,
    maxWidthValue: Float,
    maxHeightType: Int,
    maxHeightValue: Float,

    flexGapWidthType: Int,
    flexGapWidthValue: Float,
    flexGapHeightType: Int,
    flexGapHeightValue: Float,

    aspectRatio: Float
  ): FloatArray
}
