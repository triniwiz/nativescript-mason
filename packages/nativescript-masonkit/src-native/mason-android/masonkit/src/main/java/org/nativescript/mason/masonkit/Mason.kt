package org.nativescript.mason.masonkit

import android.content.Context
import com.google.gson.Gson
import dalvik.annotation.optimization.CriticalNative
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.events.Event
import java.lang.ref.WeakReference
import java.util.UUID
import java.util.WeakHashMap

class Mason {

  internal val nativePtr by lazy {
    nativeInit()
  }
  private var isAlive = true

  internal val nodes = WeakHashMap<Long, Node>()

  private val nodeEventListeners =
    mutableMapOf<Node, MutableMap<String, MutableMap<UUID, (Event) -> Unit>>>()

  private val viewNodes = WeakHashMap<android.view.View, Node>()
  var scale: Float = 1f
    private set

  fun setDeviceScale(value: Float) {
    scale = value
    nativeSetDeviceScale(nativePtr, value)
  }

  fun clear() {
    nativeClear(nativePtr)
  }

  fun getNativePtr(): Long {
    return nativePtr
  }

  fun printTree(node: Node) {
    nativePrintTree(nativePtr, node.nativePtr)
  }

  fun addEventListener(
    node: Node,
    type: String,
    listener: (Event) -> Unit
  ): UUID {
    val id = UUID.randomUUID()

    val byType = nodeEventListeners.getOrPut(node) { mutableMapOf() }
    val byId = byType.getOrPut(type) { mutableMapOf() }

    byId[id] = listener
    return id
  }

  fun removeEventListener(
    node: Node,
    type: String,
    id: UUID
  ) {
    nodeEventListeners[node]
      ?.get(type)
      ?.remove(id)
  }

  fun dispatch(event: Event) {
    val path = mutableListOf<Node>()
    var current: Node? = event.target?.node
    while (current != null) {
      path.add(current)
      current = current.parent
    }

    for (node in path) {
      if (event.propagationStopped) break

      val listeners =
        nodeEventListeners[node]
          ?.get(event.type)
          ?.values
          ?.toList()
          ?: continue

      for (listener in listeners) {
        if (event.immediatePropagationStopped) break
        listener(event)
      }
    }
  }


  @JvmOverloads
  fun createNode(children: Array<Node>? = null, isAnonymous: Boolean = false): Node {
    val nodePtr = children?.let {
      NativeHelpers.nativeNodeNewWithChildren(
        nativePtr,
        children.map { it.nativePtr }.toLongArray(),
      )
    } ?: NativeHelpers.nativeNodeNew(nativePtr, isAnonymous)
    val node = Node(this, nodePtr).apply {
      children?.let {
        children.forEach {
          it.parent = this
          NativeHelpers.nativeSetAndroidNode(nativePtr, it.nativePtr, it)
        }
        this.children.addAll(children)
      }
      nodes[nodePtr] = this
      this.isAnonymous = isAnonymous
    }

    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node)

    return node
  }

  fun createNode(measure: MeasureFunc, isAnonymous: Boolean = false): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewWithContext(nativePtr, func, isAnonymous)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = this
      measureFunc = measure
      this.isAnonymous = isAnonymous
    }
    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node)

    return node
  }

  @JvmOverloads
  fun createTextNode(children: Array<Node>? = null, isAnonymous: Boolean = false): Node {
    val nodePtr = children?.let {
      NativeHelpers.nativeNodeNewWithChildren(
        nativePtr, children.map { map ->
          if (map.nativePtr == 0L) {
            null
          } else {
            map.nativePtr
          }
        }.mapNotNull { it }.toLongArray()
      )
    } ?: NativeHelpers.nativeNodeNewText(nativePtr, isAnonymous)
    val node = Node(this, nodePtr).apply {
      children?.let {
        children.forEach {
          it.parent = this
          NativeHelpers.nativeSetAndroidNode(nativePtr, it.nativePtr, it)
        }
        this.children.addAll(children)
        this.isAnonymous = isAnonymous
      }
      nodes[nodePtr] = this
    }

    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node)

    return node
  }

  fun createTextNode(measure: MeasureFunc, isAnonymous: Boolean = false): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewTextWithContext(nativePtr, func, isAnonymous)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = this
      measureFunc = measure
      this.isAnonymous = isAnonymous
    }

    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node)

    return node
  }


  fun createImageNode(measure: MeasureFunc): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewImageWithContext(nativePtr, func)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = this
      measureFunc = measure
    }
    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node)

    return node
  }

  fun createLineBreakNode(measure: MeasureFunc): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewLineBreakWithContext(nativePtr, func)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = this
      measureFunc = measure
    }
    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node)

    return node
  }

  fun createView(context: Context): View {
    return View(context, this)
  }


  @JvmOverloads
  fun createTextView(
    context: Context, type: TextType = TextType.None, isAnonymous: Boolean = false
  ): TextView {
    return TextView(context, this, type, isAnonymous)
  }

  fun createImageView(context: Context): Img {
    return Img(context, this)
  }

  fun createScrollView(context: Context): Scroll {
    return Scroll(context, this)
  }

  fun createButton(
    context: Context,
  ): Button {
    return Button(context, this)
  }

  fun createBr(context: Context): Br {
    return Br(context, this)
  }

  @JvmOverloads
  fun createInput(context: Context, type: Input.Type = Input.Type.Text): Input {
    return Input(context, this, type)
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

  fun styleForViewOrNode(viewOrNode: Any?): Style? {
    val view = viewOrNode as? android.view.View
    if (view != null) {
      val node = nodeForView(view)
      return node.style
    }
    val node = viewOrNode as? Node
    return node?.style
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
      Gson().newBuilder().registerTypeAdapter(Dimension::class.java, DimensionSerializer())
        .registerTypeAdapter(LengthPercentageSerializer::class.java, LengthPercentageSerializer())
        .registerTypeAdapter(
          LengthPercentageAutoSerializer::class.java, LengthPercentageAutoSerializer()
        ).create()

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

    @JvmStatic
    @CriticalNative
    private external fun nativeSetDeviceScale(mason: Long, scale: Float)

  }
}
