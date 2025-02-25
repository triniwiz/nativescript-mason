package org.nativescript.mason.masonkit

import android.content.Context
import android.util.AttributeSet
import com.google.gson.Gson
import dalvik.annotation.optimization.CriticalNative
import java.lang.ref.WeakReference
import java.util.WeakHashMap


class Mason {

  internal var nativePtr = nativeInit()
  internal val nodes = WeakHashMap<Long, Node>()
  private val viewNodes = WeakHashMap<android.view.View, Node>()

  fun clear() {
    nativeClear(nativePtr)
  }

  fun getNativePtr(): Long {
    return nativePtr
  }

  private fun createNode(kind: Node.NodeKind, children: Array<Node>? = null): Node {
    val nodePtr = children?.let {
      Node.nativeNewNodeWithChildren(
        nativePtr,
        kind.value,
        children.map { it.nativePtr }.toLongArray()
      )
    } ?: Node.nativeNewNode(nativePtr, kind.value)
    return Node(this, nodePtr).apply {
      children?.let {
        children.forEach {
          it.owner = this
        }
        this.children.addAll(children)
      }
      nodes[nodePtr] = this
    }
  }

  fun createNode(): Node {
    return createNode(Node.NodeKind.Element)
  }

  fun createNode(children: Array<Node>): Node {
    return createNode(Node.NodeKind.Element, children)
  }

  fun createTextNode(): Node {
    return createNode(Node.NodeKind.Text)
  }

  private fun createNode(kind: Node.NodeKind, measure: MeasureFunc): Node {
    val nodePtr = Node.nativeNewNodeWithContext(nativePtr, kind.value, MeasureFuncImpl(WeakReference(measure)))
    return Node(this, nodePtr).apply {  nodes[nodePtr] = this }
  }

  fun createNode(measureFunc: MeasureFunc): Node {
    return createNode(Node.NodeKind.Element, measureFunc)
  }

  fun createTextNode(measureFunc: MeasureFunc): Node {
    return createNode(Node.NodeKind.Text, measureFunc)
  }

  fun createView(context: Context): View {
    return View(context, this)
  }

  fun createTextView(context: Context): TextView {
    return TextView(context, this)
  }

  fun nodeForView(view: android.view.View, kind: Node.NodeKind = Node.NodeKind.Element): Node {
    return if (view is View) {
      nodes[view.node.nativePtr] ?: run {
        val node = createNode(kind).apply {
          data = view
        }
        node
      }
    } else {
      viewNodes[view] ?: run {
        val node = createNode(kind).apply {
          data = view
        }
        node
      }
    }
  }

  fun requestLayout(node: Long) {
    nodes[node]?.updateNodeStyle()
  }

  fun requestLayout(view: android.view.View) {
    if (view is View) {
      nodes[view.node.nativePtr]?.updateNodeStyle()
    } else {
      viewNodes[view]?.updateNodeStyle()
    }
  }

  companion object {
    private var didInit = false

    internal fun initLib() {
      if (didInit) {
        return
      }
      System.loadLibrary("masonnative")
      didInit = true
    }

    init {
      initLib()
    }

    @JvmStatic
    val instance = Mason()

    // enable when using along external bindings
    @JvmStatic
    var shared = true

    internal val gson =
      Gson().newBuilder()
        .registerTypeAdapter(Dimension::class.java, DimensionSerializer())
        .registerTypeAdapter(LengthPercentageSerializer::class.java, LengthPercentageSerializer())
        .registerTypeAdapter(
          LengthPercentageAutoSerializer::class.java,
          LengthPercentageAutoSerializer()
        )
        .create()

    @JvmStatic
    @CriticalNative
    private external fun nativeInit(): Long

    @JvmStatic
    @CriticalNative
    private external fun nativeInitWithCapacity(capacity: Int): Long

    @JvmStatic
    @CriticalNative
    private external fun nativeClear(mason: Long)
  }
}
