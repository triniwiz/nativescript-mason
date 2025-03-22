package org.nativescript.mason.masonkit

import android.os.Build
import android.util.Log
import android.view.View.MeasureSpec
import dalvik.annotation.optimization.CriticalNative
import dalvik.annotation.optimization.FastNative
import java.lang.ref.WeakReference


class Node internal constructor(internal val mason: Mason, internal var nativePtr: Long) {
  internal var knownWidth: Float? = null
  internal var knownHeight: Float? = null
  internal var availableWidth: Float? = null
  internal var availableHeight: Float? = null
  internal var measureFunc: MeasureFunc = object : MeasureFunc {
    override fun measure(
      knownDimensions: Size<Float?>,
      availableSpace: Size<Float?>
    ): Size<Float> {
      knownWidth = knownDimensions.width
      knownHeight = knownDimensions.height
      availableWidth = availableSpace.width
      availableHeight = availableSpace.height
      val view = this@Node.data as? android.view.View

      if (knownDimensions.width != null && knownDimensions.height != null) {
        if (view != null) {
          view.measure(
            MeasureSpec.makeMeasureSpec(knownDimensions.width!!.toInt(), MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(knownDimensions.height!!.toInt(), MeasureSpec.EXACTLY)
          )
          return Size(view.measuredWidth.toFloat(), view.measuredHeight.toFloat())
        }

        return Size(knownDimensions.width!!, knownDimensions.height!!)
      }

      val width = if (knownDimensions.width != null) {
        MeasureSpec.makeMeasureSpec(knownDimensions.width!!.toInt(), MeasureSpec.EXACTLY)
      } else if (availableSpace.width != null) {
        if (availableSpace.width == -1f || availableSpace.width == -2f) {
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        } else {
          MeasureSpec.makeMeasureSpec(availableSpace.width!!.toInt(), MeasureSpec.AT_MOST)
        }
      } else {
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      }


      val height = if (knownDimensions.height != null) {
        MeasureSpec.makeMeasureSpec(knownDimensions.height!!.toInt(), MeasureSpec.EXACTLY)
      } else if (availableSpace.height != null) {
        if (availableSpace.height == -1f || availableSpace.height == -2f) {
          MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
        } else {
          MeasureSpec.makeMeasureSpec(availableSpace.height!!.toInt(), MeasureSpec.AT_MOST)
        }
      } else {
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      }


      if (view != null) {
        view.measure(width, height)
        return Size(view.measuredWidth.toFloat(), view.measuredHeight.toFloat())
      }

      return Size(
        knownDimensions.width ?: 0f,
        knownDimensions.height ?: 0f
      )
    }
  }

  internal var isKnown = false
  var data: Any? = null

  var owner: Node? = null
    internal set
  internal var children = arrayListOf<Node>()

  val style = Style(this)

  var inBatch: Boolean
    get() {
      return style.inBatch
    }
    set(value) {
      style.inBatch = value
    }

  fun configure(block: Node.() -> Unit) {
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
    return try {
      children[index]
    } catch (e: Exception) {
      null
    }
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

    if (removedNode == 0L) {
      return null
    }

    child.owner = null

    children.remove(child)

    return child
  }

  fun removeChildAt(index: Int): Node? {
    val removedNode = nativeRemoveChildAt(mason.nativePtr, nativePtr, index)

    if (removedNode == 0L) {
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
    return children.size
  }

  fun getChildren(): List<Node> {
    return children
  }

  fun setMeasureFunction(measure: MeasureFunc) {
    nativeSetContext(
      mason.nativePtr,
      nativePtr,
      MeasureFuncImpl(WeakReference(measure))
    )
    measureFunc = measure
  }

  fun removeMeasureFunction() {
    nativeRemoveContext(mason.nativePtr, nativePtr)
  }

  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
    if (nativePtr != 0L) {
      nativeDestroy(nativePtr)
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
    external fun nativeNewNode(mason: Long): Long

    @JvmStatic
    external fun nativeNewNodeWithChildren(
      mason: Long,
      children: LongArray
    ): Long

    @JvmStatic
    external fun nativeNewNodeWithContext(
      mason: Long,
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

    @JvmStatic
    @FastNative
    private external fun nativeComputeWithSizeAndLayout(
      mason: Long,
      node: Long,
      width: Float,
      height: Float
    ): FloatArray

    @JvmStatic
    @FastNative
    private external fun nativeGetChildren(
      mason: Long,
      node: Long
    ): LongArray


    @JvmStatic
    @FastNative
    private external fun nativeLayout(
      mason: Long,
      node: Long,
    ): FloatArray


  }

  private external fun nativeSetContext(
    mason: Long,
    node: Long,
    measureFunc: Any
  )

  private external fun nativeComputeAndLayout(
    mason: Long,
    node: Long,
  ): FloatArray


}
