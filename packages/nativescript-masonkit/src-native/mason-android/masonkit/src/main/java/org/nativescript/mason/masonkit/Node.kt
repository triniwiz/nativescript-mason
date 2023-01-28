package org.nativescript.mason.masonkit

import android.util.Log
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
        style.position.ordinal,
        style.direction.ordinal,
        style.flexDirection.ordinal,
        style.flexWrap.ordinal,
        style.overflow.ordinal,
        style.alignItems.value,
        style.alignSelf.value,
        style.alignContent.value,
        style.justifyItems.value,
        style.justifySelf.value,
        style.justifyContent.value,

        style.inset.left.type,
        style.inset.left.value,
        style.inset.right.type,
        style.inset.right.value,
        style.inset.top.type,
        style.inset.top.value,
        style.inset.bottom.type,
        style.inset.bottom.value,

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

        style.gap.width.type,
        style.gap.width.value,
        style.gap.height.type,
        style.gap.height.value,

        style.aspectRatio ?: Float.NaN,

        style.gridAutoRows,
        style.gridAutoColumns,
        style.gridAutoFlow.ordinal,
        style.gridColumn.start.type,
        style.gridColumn.start.placementValue,
        style.gridColumn.end.type,
        style.gridColumn.end.placementValue,
        style.gridRow.start.type,
        style.gridRow.start.placementValue,
        style.gridRow.end.type,
        style.gridRow.end.placementValue,
        style.gridTemplateRows,
        style.gridTemplateColumns
      )
      style.isDirty = false
    } else {
      nativeSetStyle(Mason.instance.nativePtr, nativePtr, style.getNativePtr())
    }
  }

  var inBatch = false
    set(value) {
      if (field && !value) {
        updateNodeStyle()
      }
      field = value
    }

  fun configure(block: (Node) -> Unit) {
    inBatch = true
    block(this)
    inBatch = false
    updateNodeStyle()
  }

  @JvmOverloads
  fun computeAndLayout(width: Float? = null, height: Float? = null): Layout {
    if (width != null && height != null) {
      return Layout.fromFloatArray(
        nativeUpdateSetStyleComputeWithSizeAndLayout(
          Mason.instance.nativePtr,
          nativePtr,
          style.getNativePtr(),
          width, height,
          style.display.ordinal,
          style.position.ordinal,
          style.direction.ordinal,
          style.flexDirection.ordinal,
          style.flexWrap.ordinal,
          style.overflow.ordinal,
          style.alignItems.value,
          style.alignSelf.value,
          style.alignContent.value,
          style.justifyItems.value,
          style.justifySelf.value,
          style.justifyContent.value,

          style.inset.left.type,
          style.inset.left.value,
          style.inset.right.type,
          style.inset.right.value,
          style.inset.top.type,
          style.inset.top.value,
          style.inset.bottom.type,
          style.inset.bottom.value,

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

          style.gap.width.type,
          style.gap.width.value,
          style.gap.height.type,
          style.gap.height.value,

          style.aspectRatio ?: Float.NaN,
          style.gridAutoRows,
          style.gridAutoColumns,
          style.gridAutoFlow.ordinal,
          style.gridColumn.start.type,
          style.gridColumn.start.placementValue,
          style.gridColumn.end.type,
          style.gridColumn.end.placementValue,
          style.gridRow.start.type,
          style.gridRow.start.placementValue,
          style.gridRow.end.type,
          style.gridRow.end.placementValue,
          style.gridTemplateRows,
          style.gridTemplateColumns
        ), 0
      ).second
    }

    return Layout.fromFloatArray(
      nativeUpdateSetStyleComputeAndLayout(
        Mason.instance.nativePtr,
        nativePtr,
        style.getNativePtr(),
        style.display.ordinal,
        style.position.ordinal,
        style.direction.ordinal,
        style.flexDirection.ordinal,
        style.flexWrap.ordinal,
        style.overflow.ordinal,
        style.alignItems.value,
        style.alignSelf.value,
        style.alignContent.value,
        style.justifyItems.value,
        style.justifySelf.value,
        style.justifyContent.value,

        style.inset.left.type,
        style.inset.left.value,
        style.inset.right.type,
        style.inset.right.value,
        style.inset.top.type,
        style.inset.top.value,
        style.inset.bottom.type,
        style.inset.bottom.value,

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

        style.gap.width.type,
        style.gap.width.value,
        style.gap.height.type,
        style.gap.height.value,

        style.aspectRatio ?: Float.NaN,

        style.gridAutoRows,
        style.gridAutoColumns,
        style.gridAutoFlow.ordinal,
        style.gridColumn.start.type,
        style.gridColumn.start.placementValue,
        style.gridColumn.end.type,
        style.gridColumn.end.placementValue,
        style.gridRow.start.type,
        style.gridRow.start.placementValue,
        style.gridRow.end.type,
        style.gridRow.end.placementValue,
        style.gridTemplateRows,
        style.gridTemplateColumns
      ), 0
    ).second
  }

  fun layout(): Layout {
    return Layout.fromFloatArray(nativeLayout(Mason.instance.nativePtr, nativePtr), 0).second
  }

  fun getNativePtr(): Long {
    return nativePtr
  }

  val root: Node?
    get() {
      return owner?.let {
        var current: Node? = it
        var next = current
        while (next != null) {
          next = current?.owner
          if (next != null) {
            current = next
          }
        }
        return current
      }
    }

  fun rootCompute() {
    root?.compute()
  }

  fun rootCompute(width: Float, height: Float) {
    root?.compute(width, height)
  }

  fun rootComputeMaxContent() {
    root?.computeMaxContent()
  }

  fun rootComputeMinContent() {
    root?.computeMinContent()
  }

  fun rootComputeWithViewSize() {
    root?.computeWithViewSize()
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

  fun computeWithViewSize() {
    (data as View?)?.let {
      compute(it.width.toFloat(), it.height.toFloat())
    }
  }

  fun getChildAt(index: Int): Node? {
    if (Mason.shared) {
      val child = nativeGetChildAt(Mason.instance.nativePtr, nativePtr, index)
      if (child == 0L) {
        return null
      }
      val parent = this
      return Node(child).apply {
        owner = parent
      }
    }
    return children[index]
  }

  fun addChild(child: Node): Node? {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }

    nativeAddChild(Mason.instance.nativePtr, nativePtr, child.nativePtr)

    if (nodes.containsKey(child.nativePtr)) {
      val parent = this
      return nodes[child.nativePtr]?.apply { owner = parent }
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

      child.owner = this

      children.add(child)
      nodes[child.nativePtr] = child
      return
    }

    nativeAddChildAt(Mason.instance.nativePtr, nativePtr, child.nativePtr, index)

    if (nodes.containsKey(child.nativePtr)) {
      val parent = this
      nodes[child.nativePtr]?.apply { owner = parent }
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
      val parent = this
      nodes[child.nativePtr]?.apply { owner = parent }
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
      val parent = this
      nodes[child.nativePtr]?.apply { owner = parent }
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
      val parent = this
      for (i in children.indices) {
        val child = Node(children[i]).apply {
          owner = parent
        }
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
    if (nativePtr != 0L) {
      owner?.removeChild(this)
      nativeDestroy(nativePtr)
      nativePtr = 0
    }

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
    position: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyItems: Int,
    justifySelf: Int,
    justifyContent: Int,

    insetLeftType: Int,
    insetLeftValue: Float,
    insetRightType: Int,
    insetRightValue: Float,
    insetTopType: Int,
    insetTopValue: Float,
    insetBottomType: Int,
    insetBottomValue: Float,

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

    gapRowType: Int,
    gapRowValue: Float,
    gapColumnType: Int,
    gapColumnValue: Float,

    aspectRatio: Float,

    gridAutoRows: Array<MinMax>,
    gridAutoColumns: Array<MinMax>,
    gridAutoFlow: Int,
    gridColumnStartType: Int,
    gridColumnStartValue: Short,
    gridColumnEndType: Int,
    gridColumnEndValue: Short,
    gridRowStartType: Int,
    gridRowStartValue: Short,
    gridRowEndType: Int,
    gridRowEndValue: Short,
    gridTemplateRows: Array<TrackSizingFunction>,
    gridTemplateColumns: Array<TrackSizingFunction>
  )


  private external fun nativeUpdateSetStyleComputeAndLayout(
    mason: Long,
    node: Long,
    style: Long,
    display: Int,
    position: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyItems: Int,
    justifySelf: Int,
    justifyContent: Int,

    insetLeftType: Int,
    insetLeftValue: Float,
    insetRightType: Int,
    insetRightValue: Float,
    insetTopType: Int,
    insetTopValue: Float,
    insetBottomType: Int,
    insetBottomValue: Float,

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

    gapRowType: Int,
    gapRowValue: Float,
    gapColumnType: Int,
    gapColumnValue: Float,

    aspectRatio: Float,

    gridAutoRows: Array<MinMax>,
    gridAutoColumns: Array<MinMax>,
    gridAutoFlow: Int,
    gridColumnStartType: Int,
    gridColumnStartValue: Short,
    gridColumnEndType: Int,
    gridColumnEndValue: Short,
    gridRowStartType: Int,
    gridRowStartValue: Short,
    gridRowEndType: Int,
    gridRowEndValue: Short,
    gridTemplateRows: Array<TrackSizingFunction>,
    gridTemplateColumns: Array<TrackSizingFunction>

  ): FloatArray

  private external fun nativeUpdateSetStyleComputeWithSizeAndLayout(
    mason: Long,
    node: Long,
    style: Long,
    width: Float,
    height: Float,
    display: Int,
    position: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyItems: Int,
    justifySelf: Int,
    justifyContent: Int,

    insetLeftType: Int,
    insetLeftValue: Float,
    insetRightType: Int,
    insetRightValue: Float,
    insetTopType: Int,
    insetTopValue: Float,
    insetBottomType: Int,
    insetBottomValue: Float,

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

    gapRowType: Int,
    gapRowValue: Float,
    gapColumnType: Int,
    gapColumnValue: Float,

    aspectRatio: Float,

    gridAutoRows: Array<MinMax>,
    gridAutoColumns: Array<MinMax>,
    gridAutoFlow: Int,
    gridColumnStartType: Int,
    gridColumnStartValue: Short,
    gridColumnEndType: Int,
    gridColumnEndValue: Short,
    gridRowStartType: Int,
    gridRowStartValue: Short,
    gridRowEndType: Int,
    gridRowEndValue: Short,
    gridTemplateRows: Array<TrackSizingFunction>,
    gridTemplateColumns: Array<TrackSizingFunction>
  ): FloatArray
}
