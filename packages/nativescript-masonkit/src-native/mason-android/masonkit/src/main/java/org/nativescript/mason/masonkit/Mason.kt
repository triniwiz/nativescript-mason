package org.nativescript.mason.masonkit

import android.content.Context
import com.google.gson.Gson
import dalvik.annotation.optimization.CriticalNative
import java.lang.ref.WeakReference
import java.util.WeakHashMap


class Mason {

  internal val nativePtr by lazy {
    nativeInit()
  }
  private var isAlive = true

  internal val nodes = WeakHashMap<Long, Node>()
  private val viewNodes = WeakHashMap<android.view.View, Node>()

  fun clear() {
    nativeClear(nativePtr)
  }

  fun getNativePtr(): Long {
    return nativePtr
  }

  fun printTree(node: Node) {
    nativePrintTree(nativePtr, node.nativePtr)
  }

  @JvmOverloads
  fun createNode(children: Array<Node>? = null): Node {
    val nodePtr = children?.let {
      NativeHelpers.nativeNodeNewWithChildren(
        nativePtr,
        children.map { it.nativePtr }.toLongArray(),
      )
    } ?: NativeHelpers.nativeNodeNew(nativePtr)
    return Node(this, nodePtr).apply {
      children?.let {
        children.forEach {
          it.parent = this
        }
        this.children.addAll(children)
      }
      nodes[nodePtr] = this
    }
  }

  fun createNode(measure: MeasureFunc): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr =
      NativeHelpers.nativeNodeNewWithContext(nativePtr, func)
    return Node(this, nodePtr).apply {
      nodes[nodePtr] = this
      measureFunc = measure
    }
  }


  @JvmOverloads
  fun createTextNode(children: Array<Node>? = null): Node {
    val nodePtr = children?.let {
      NativeHelpers.nativeNodeNewWithChildren(
        nativePtr,
        children.map { map ->
          if (map.nativePtr == 0L) {
            null
          } else {
            map.nativePtr
          }
        }.mapNotNull { it }.toLongArray()
      )
    } ?: NativeHelpers.nativeNodeNewText(nativePtr)
    return Node(this, nodePtr).apply {
      children?.let {
        children.forEach {
          it.parent = this
        }
        this.children.addAll(children)
      }
      nodes[nodePtr] = this
    }
  }

  fun createTextNode(measure: MeasureFunc): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr =
      NativeHelpers.nativeNodeNewTextWithContext(nativePtr, func)
    return Node(this, nodePtr).apply {
      nodes[nodePtr] = this
      measureFunc = measure
    }
  }

  fun createView(context: Context): View {
    return View(context, this)
  }


  @JvmOverloads
  fun createTextView(context: Context, type: TextType = TextType.None): TextView {
    return TextView(context, this, type)
  }

  fun createImageView(context: Context): Img {
    return Img(context, this)
  }

  fun createScrollView(context: Context): Scroll {
    return Scroll(context, this)
  }


  fun configureStyleForView(view: android.view.View, block: (Style) -> Unit) {
    val node = nodeForView(view)
    node.style.inBatch = true
    block(node.style)
    node.style.inBatch = false
    node.style.updateNativeStyle()
  }

  fun nodeForView(view: android.view.View): Node {
    return when (view) {
      is Element -> {
        nodes[view.node.nativePtr] ?: run {
          val node = createNode().apply {
            this.view = view
          }
          nodes[view.node.nativePtr] = node
          node
        }
      }

      else -> {
        viewNodes[view] ?: run {
          // is leaf to ensure it triggers android's view measure
          val node = createNode().apply {
            this.view = view
            setDefaultMeasureFunction()
          }
          viewNodes[view] = node
          node
        }
      }
    }
  }

  fun styleForView(view: android.view.View): Style {
    val node = nodeForView(view)
    return node.style
  }

  fun requestLayout(node: Long) {
    nodes[node]?.style?.updateNativeStyle()
  }

  fun requestLayout(view: android.view.View) {
    if (view is Element) {
      view.style.updateNativeStyle()
    } else {
      viewNodes[view]?.style?.updateNativeStyle()
    }
  }


  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
    if (isAlive) {
      nativeDestroy(nativePtr)
      isAlive = false
    }
  }

  companion object {

    internal fun initLib() {
      NativeHelpers.initLib()
    }

    init {
      initLib()
    }

    @JvmStatic
    val shared = Mason()

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

    @JvmStatic
    @CriticalNative
    private external fun nativeDestroy(mason: Long)

    @JvmStatic
    private external fun nativePrintTree(mason: Long, node: Long)
  }
}
