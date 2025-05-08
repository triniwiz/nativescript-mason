package org.nativescript.mason.masonkit

import android.content.Context
import com.google.gson.Gson
import dalvik.annotation.optimization.CriticalNative
import org.nativescript.mason.masonkit.Node.Companion
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

  @JvmOverloads
  fun createNode(children: Array<Node>? = null): Node {
    val nodePtr = children?.let {
      Node.nativeNewNodeWithChildren(
        nativePtr,
        children.map { it.nativePtr }.toLongArray()
      )
    } ?: Node.nativeNewNode(nativePtr)
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

  fun createNode(measure: MeasureFunc): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr =
      Node.nativeNewNodeWithContext(nativePtr, func)
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

  fun nodeForView(view: android.view.View): Node {
    return when (view) {
      is MasonView -> {
        nodes[view.node.nativePtr] ?: run {
          val node = createNode().apply {
            data = view
          }
          nodes[view.node.nativePtr] = node
          node
        }
      }

      else -> {
        viewNodes[view] ?: run {
          // is leaf to ensure it triggers android's view measure
          val node = createNode().apply {
            data = view
            setMeasureFunction(measureFunc)
          }
          viewNodes[view] = node
          node
        }
      }
    }
  }

  fun requestLayout(node: Long) {
    nodes[node]?.style?.updateNativeStyle()
  }

  fun requestLayout(view: android.view.View) {
    if (view is View) {
      nodes[view.node.nativePtr]?.style?.updateNativeStyle()
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
  }
}
