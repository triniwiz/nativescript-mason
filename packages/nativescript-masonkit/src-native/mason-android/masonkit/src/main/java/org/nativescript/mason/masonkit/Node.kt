package org.nativescript.mason.masonkit

import android.os.Build
import android.util.Log
import android.view.ViewGroup
import dalvik.annotation.optimization.CriticalNative
import java.lang.ref.WeakReference


class Node internal constructor(internal val mason: Mason, internal var nativePtr: Long) {

  enum class NodeKind(val value: Int) {
    Element(0),
    Text(1),
  }


  var isViewGroup: Boolean = false
    private set

  var data: Any? = null
    set(value) {
      field = value
      isViewGroup = value is ViewGroup
    }

  var owner: Node? = null
    internal set
  internal var children = mutableListOf<Node>()


  val style = Style(this)

  internal fun updateNodeStyle() {
    if (nativePtr == -1L) {
      return
    }

    Style.nativeUpdateWithValues(
      mason.nativePtr,
      nativePtr,
      this.style.display.value,
      this.style.position.value,
      this.style.direction.value,
      this.style.flexDirection.value,
      this.style.flexWrap.value,
      this.style.overflow.value,
      this.style.alignItems.value,
      this.style.alignSelf.value,
      this.style.alignContent.value,
      this.style.justifyItems.value,
      this.style.justifySelf.value,
      this.style.justifyContent.value,

      this.style.inset.left.type,
      this.style.inset.left.value,
      this.style.inset.right.type,
      this.style.inset.right.value,
      this.style.inset.top.type,
      this.style.inset.top.value,
      this.style.inset.bottom.type,
      this.style.inset.bottom.value,

      this.style.margin.left.type,
      this.style.margin.left.value,
      this.style.margin.right.type,
      this.style.margin.right.value,
      this.style.margin.top.type,
      this.style.margin.top.value,
      this.style.margin.bottom.type,
      this.style.margin.bottom.value,


      this.style.padding.left.type,
      this.style.padding.left.value,
      this.style.padding.right.type,
      this.style.padding.right.value,
      this.style.padding.top.type,
      this.style.padding.top.value,
      this.style.padding.bottom.type,
      this.style.padding.bottom.value,


      this.style.border.left.type,
      this.style.border.left.value,
      this.style.border.right.type,
      this.style.border.right.value,
      this.style.border.top.type,
      this.style.border.top.value,
      this.style.border.bottom.type,
      this.style.border.bottom.value,
      this.style.flexGrow,
      this.style.flexShrink,
      this.style.flexBasis.type,
      this.style.flexBasis.value,

      this.style.size.width.type,
      this.style.size.width.value,
      this.style.size.height.type,
      this.style.size.height.value,


      this.style.minSize.width.type,
      this.style.minSize.width.value,
      this.style.minSize.height.type,
      this.style.minSize.height.value,

      this.style.maxSize.width.type,
      this.style.maxSize.width.value,
      this.style.maxSize.height.type,
      this.style.maxSize.height.value,

      this.style.gap.width.type,
      this.style.gap.width.value,
      this.style.gap.height.type,
      this.style.gap.height.value,
      this.style.aspectRatio ?: Float.NaN,
      this.style.gridAutoRows,
      this.style.gridAutoColumns,
      this.style.gridAutoFlow.value,

      this.style.gridColumn.start.type,
      this.style.gridColumn.start.placementValue,
      this.style.gridColumn.end.type,
      this.style.gridColumn.end.placementValue,

      this.style.gridRow.start.type,
      this.style.gridRow.start.placementValue,
      this.style.gridRow.end.type,
      this.style.gridRow.end.placementValue,
      this.style.gridTemplateRows,
      this.style.gridTemplateColumns,
      this.style.overflowX.value,
      this.style.overflowY.value,
      this.style.scrollBarWidth.value,
      this.style.textAlign.value,
      this.style.boxSizing.value
    )

//    val view = data as? android.view.View
//
//    view?.let {
//      if (it.parent == null) return
//
//      if (!it.isInLayout) {
//
//        it.requestLayout()
//      }
//    } ?: style.updateNativeStyle()

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
  }

  @JvmOverloads
  fun computeAndLayout(width: Float? = null, height: Float? = null): Layout {
    if (width != null && height != null) {
      return Layout.fromFloatArray(
        nativeComputeWithSizeAndLayout(
          mason.nativePtr,
          nativePtr,
          width, height
        ), 0
      ).second
    }

    return Layout.fromFloatArray(
      nativeComputeAndLayout(
        mason.nativePtr,
        nativePtr,
      ), 0
    ).second
  }

  fun layout(): Layout {
    val layouts = nativeLayout(mason.nativePtr, nativePtr)
    if (layouts.isEmpty()) {
      return Layout.empty()
    }
    return Layout.fromFloatArray(layouts, 0).second
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
    nativeCompute(mason.nativePtr, nativePtr)
  }

  fun compute(width: Float, height: Float) {
    nativeComputeWH(mason.nativePtr, nativePtr, width, height)
  }

  fun computeMaxContent() {
    nativeComputeMaxContent(mason.nativePtr, nativePtr)
  }

  fun computeMinContent() {
    nativeComputeMinContent(mason.nativePtr, nativePtr)
  }

  fun computeWithViewSize() {
    (data as View?)?.let {
      compute(it.width.toFloat(), it.height.toFloat())
    }
  }

  fun getChildAt(index: Int): Node? {
    if (Mason.shared) {
      val child = nativeGetChildAt(mason.nativePtr, nativePtr, index)
      if (child == -1L) {
        return null
      }

      return mason.nodes[child]
    }
    return children[index]
  }

  fun addChild(child: Node): Node {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }

    nativeAddChild(mason.nativePtr, nativePtr, child.nativePtr)

    child.owner = this

    children.add(child)

    return child
  }

  fun addChildAt(child: Node, index: Int) {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }

    if (index == -1) {
      this.addChild(child);
      return
    }

    nativeAddChildAt(mason.nativePtr, nativePtr, child.nativePtr, index)

    child.owner = this

    val ret = children.set(index, child)

    ret.owner = null
  }

  fun insertChildBefore(child: Node, referenceChild: Node) {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }

    nativeInsertChildBefore(
      mason.nativePtr,
      nativePtr,
      child.nativePtr,
      referenceChild.nativePtr
    )

    child.owner = this
    val index = children.indexOf(referenceChild)
    if (index != -1) {
      children.add(index, child)
    }
  }

  fun insertChildAfter(child: Node, referenceChild: Node) {
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.");
    }

    nativeInsertChildAfter(
      mason.nativePtr,
      nativePtr,
      child.nativePtr,
      referenceChild.nativePtr
    )

    child.owner = this
    val index = children.indexOf(referenceChild)
    if (index != -1) {
      val newPosition = index + 1
      if (newPosition == children.size) {
        children.add(child)
      } else {
        children.add(newPosition, child)
      }
    }
  }

  fun removeChildren() {
    nativeRemoveChildren(mason.nativePtr, nativePtr)
    children.forEach { it.owner = null }
    children.clear()
  }

  fun removeChild(child: Node): Node? {
    val removedNode = nativeRemoveChild(mason.nativePtr, nativePtr, child.nativePtr)

    if (removedNode == -1L) {
      return null
    }

    child.owner = null

    children.remove(child)

    return child
  }

  fun removeChildAt(index: Int): Node? {
    val removedNode = nativeRemoveChildAt(mason.nativePtr, nativePtr, index)

    if (removedNode == -1L) {
      return null
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      children.removeIf { it.nativePtr == removedNode }
    } else {
      val position = children.indexOfFirst { it.nativePtr == removedNode }
      if (position != -1) {
        children.removeAt(position)
      }
    }


    return mason.nodes[removedNode]?.apply {
      owner = null
    } ?: Node(mason, removedNode)
  }

  fun dirty() {
    nativeMarkDirty(mason.nativePtr, nativePtr)
  }

  fun isDirty(): Boolean {
    return nativeDirty(mason.nativePtr, nativePtr)
  }

  fun getChildCount(): Int {
    if (Mason.shared) {
      return nativeGetChildCount(mason.nativePtr, nativePtr)
    }
    return children.size
  }

  fun getChildren(): Array<Node> {
    if (Mason.shared) {
      val children = nativeGetChildren(mason.nativePtr, nativePtr)
      val ret = arrayOfNulls<Node>(children.size)
      val parent = this
      for (i in children.indices) {
        val child = Node(mason, children[i]).apply {
          owner = parent
        }
        ret[i] = child
      }
      return ret.requireNoNulls()
    }
    return children.toTypedArray()
  }

  fun setMeasureFunction(measure: MeasureFunc) {
    nativeSetContext(
      mason.nativePtr,
      nativePtr,
      MeasureFuncImpl(WeakReference(measure))
    )
  }

  fun removeMeasureFunction() {
    nativeRemoveContext(mason.nativePtr, nativePtr)
  }

  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
    if (nativePtr != -1L) {
      Log.d("com.test", "node finalize: $nativePtr")
      //nativeDestroy(nativePtr)
      nativePtr = 0
      owner?.removeChild(this)
    }
  }

  companion object {
    init {
      Mason.initLib()
    }

    @CriticalNative
    @JvmStatic
    external fun nativeNewNode(mason: Long, kind: Int): Long

    @JvmStatic
    external fun nativeNewNodeWithChildren(
      mason: Long,
      kind: Int,
      children: LongArray
    ): Long

    @JvmStatic
    external fun nativeNewNodeWithContext(
      mason: Long,
      kind: Int,
      measure: Any
    ): Long

    @CriticalNative
    @JvmStatic
    private external fun nativeDestroy(
      mason: Long,
    )

    @CriticalNative
    @JvmStatic
    private external fun nativeCompute(mason: Long, node: Long)

    @CriticalNative
    @JvmStatic
    private external fun nativeComputeSize(mason: Long, node: Long, size: Long)

    @CriticalNative
    @JvmStatic
    private external fun nativeComputeWH(mason: Long, node: Long, width: Float, height: Float)

    @CriticalNative
    @JvmStatic
    private external fun nativeComputeMaxContent(mason: Long, node: Long)

    @CriticalNative
    @JvmStatic
    private external fun nativeComputeMinContent(mason: Long, node: Long)

    @CriticalNative
    @JvmStatic
    private external fun nativeAddChild(
      mason: Long,
      node: Long,
      child: Long
    )

    @CriticalNative
    @JvmStatic
    private external fun nativeAddChildAt(
      mason: Long,
      node: Long,
      child: Long,
      index: Int
    )

    @CriticalNative
    @JvmStatic
    private external fun nativeReplaceChildAt(
      mason: Long,
      node: Long,
      child: Long,
      index: Int
    ): Long


    @CriticalNative
    @JvmStatic
    private external fun nativeInsertChildBefore(
      mason: Long,
      node: Long,
      child: Long,
      reference: Long
    )

    @CriticalNative
    @JvmStatic
    private external fun nativeInsertChildAfter(
      mason: Long,
      node: Long,
      child: Long,
      reference: Long
    )


    @CriticalNative
    @JvmStatic
    private external fun nativeGetChildAt(mason: Long, node: Long, index: Int): Long

    @CriticalNative
    @JvmStatic
    private external fun nativeGetChildCount(mason: Long, node: Long): Int

    @CriticalNative
    @JvmStatic
    private external fun nativeMarkDirty(mason: Long, node: Long)

    @CriticalNative
    @JvmStatic
    private external fun nativeDirty(mason: Long, node: Long): Boolean

    @CriticalNative
    @JvmStatic
    private external fun nativeRemoveChildren(
      mason: Long,
      node: Long,
    )

    @CriticalNative
    @JvmStatic
    private external fun nativeRemoveChildAt(
      mason: Long,
      node: Long,
      index: Int
    ): Long

    @CriticalNative
    @JvmStatic
    private external fun nativeRemoveChild(
      mason: Long,
      node: Long,
      child: Long,
    ): Long


    @CriticalNative
    @JvmStatic
    private external fun nativeSetStyle(mason: Long, node: Long, style: Long)


    @CriticalNative
    @JvmStatic
    private external fun nativeRemoveContext(
      mason: Long,
      node: Long
    )

  }

  private external fun nativeLayout(
    mason: Long,
    node: Long,
  ): FloatArray


  private external fun nativeGetChildren(
    mason: Long,
    node: Long
  ): LongArray

  private external fun nativeSetContext(
    mason: Long,
    node: Long,
    measureFunc: Any
  )


  private external fun nativeUpdateAndSetStyle(
    mason: Long, node: Long,
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
    gridTemplateColumns: Array<TrackSizingFunction>,
    overflowX: Int,
    overflowY: Int,
    scrollBarWidth: Float,
    textAlign: Int,
    boxSizing: Int
  )


  private external fun nativeUpdateSetStyleComputeAndLayout(
    mason: Long,
    node: Long,
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
    gridTemplateColumns: Array<TrackSizingFunction>,
    overflowX: Int,
    overflowY: Int,
    scrollBarWidth: Float,
    textAlign: Int,
    boxSizing: Int,
  ): FloatArray

  private external fun nativeUpdateSetStyleComputeWithSizeAndLayout(
    mason: Long,
    node: Long,
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
    gridTemplateColumns: Array<TrackSizingFunction>,
    overflowX: Int,
    overflowY: Int,
    scrollBarWidth: Float,
    textAlign: Int,
    boxSizing: Int,
  ): FloatArray

  private external fun nativeComputeWithSizeAndLayout(
    mason: Long,
    node: Long,
    width: Float,
    height: Float
  ): FloatArray

  private external fun nativeComputeAndLayout(
    mason: Long,
    node: Long,
  ): FloatArray


}
