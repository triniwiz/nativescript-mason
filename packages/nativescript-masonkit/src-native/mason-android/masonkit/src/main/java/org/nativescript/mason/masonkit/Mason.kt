package org.nativescript.mason.masonkit

import android.content.Context
import android.content.res.Resources
import android.text.TextPaint
import com.google.gson.Gson
import dalvik.annotation.optimization.CriticalNative
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.events.Event
import java.lang.ref.WeakReference
import java.nio.ByteBuffer
import java.util.UUID
import java.util.WeakHashMap


class Mason {

  internal val gc by lazy {
    GC(this)
  }

  internal val nativePtr by lazy {
    nativeInit()
  }
  private var isAlive = true

  internal val nodes = HashMap<Long, WeakReference<Node>>()
  private val viewNodes = WeakHashMap<android.view.View, WeakReference<Node>>()

  private val nodeEventListeners =
    mutableMapOf<Node, MutableMap<String, MutableMap<UUID, (Event) -> Unit>>>()

  // True while Rust holds a lock during compute — prevents re-entrant lock acquisition via prepareMut
  @JvmField
  internal var inCompute = false

  var scale: Float = Resources.getSystem().displayMetrics.density
    private set

  init {
    // set default style font metrics
    val buffer = ObjectManager.shared[nativeGetBuffer(
      nativePtr, 0 // default handle
    )] as? ByteBuffer

    buffer?.let {
      FontFaceSet.instance.getOrNull("sans-serif")?.let { font ->
        val paint = TextPaint().apply {
          textSize =
            Constants.DEFAULT_FONT_SIZE * scale
          this.typeface = font.font
        }

        val fm = paint.fontMetrics

        // Android uses negative ascent, positive descent
        val ascent = -fm.ascent
        val descent = fm.descent
        val leading = fm.leading

        val xBounds = android.graphics.Rect()

        val capBounds = android.graphics.Rect()

        // Android doesn't directly expose x-height or cap-height
        // We approximate them based on the font
        val xHeight = Style.getXHeight(paint, xBounds) ?: (ascent * 0.5f)
        val capHeight = Style.getCapHeight(paint, capBounds) ?: (ascent * 0.7f)

        it.putFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, ascent)
        it.putFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, descent)
        it.putFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, xHeight)
        it.putFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, leading)
        it.putFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, capHeight)
      }
    }
  }

  fun drain() {
    gc.drain()
  }

  private fun track(native: NativeObject) {
    gc.track(native)
  }

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

  fun printArenaStats() {
    nativePrintArenaStats(nativePtr)
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
          NativeHelpers.nativeSetAndroidNode(nativePtr, it.nativePtr, it.objectId)
        }
        this.children.addAll(children)
      }
      nodes[nodePtr] = WeakReference(this)
      this.isAnonymous = isAnonymous
    }

    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node.objectId)

    track(node)

    return node
  }

  fun createNode(measure: MeasureFunc, isAnonymous: Boolean = false): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewWithContext(nativePtr, func.objectId, isAnonymous)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = WeakReference(this)
      measureFunc = measure
      measureFuncImpl = func
      this.isAnonymous = isAnonymous
    }
    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node.objectId)

    track(node)

    drain()
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
          NativeHelpers.nativeSetAndroidNode(nativePtr, it.nativePtr, it.objectId)
        }
        this.children.addAll(children)
        this.isAnonymous = isAnonymous
      }
      nodes[nodePtr] = WeakReference(this)
    }

    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node.objectId)

    track(node)

    return node
  }

  fun createTextNode(measure: MeasureFunc, isAnonymous: Boolean = false): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewTextWithContext(nativePtr, func.objectId, isAnonymous)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = WeakReference(this)
      measureFunc = measure
      measureFuncImpl = func
      this.isAnonymous = isAnonymous
    }

    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node.objectId)

    track(node)

    return node
  }

  fun createImageNode(measure: MeasureFunc): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewImageWithContext(nativePtr, func.objectId)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = WeakReference(this)
      measureFunc = measure
      measureFuncImpl = func
    }
    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node.objectId)


    track(node)

    return node
  }

  fun createLineBreakNode(measure: MeasureFunc): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewLineBreakWithContext(nativePtr, func.objectId)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = WeakReference(this)
      measureFunc = measure
      measureFuncImpl = func
    }
    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node.objectId)

    track(node)

    return node
  }

  fun createView(context: Context): View {
    return View(context, this)
  }

  @JvmOverloads
  fun createListView(context: Context, isOrdered: Boolean = false): ListView {
    return ListView(context, this).apply {
      this.isOrdered = isOrdered
    }
  }

  fun createListItemNode(measure: MeasureFunc): Node {
    val func = MeasureFuncImpl(WeakReference(measure))
    val nodePtr = NativeHelpers.nativeNodeNewListItemWithContext(nativePtr, func.objectId)
    val node = Node(this, nodePtr).apply {
      nodes[nodePtr] = WeakReference(this)
      measureFunc = measure
      measureFuncImpl = func
    }

    NativeHelpers.nativeSetAndroidNode(nativePtr, node.nativePtr, node.objectId)

    track(node)

    return node
  }

  fun createListItem(context: Context): Li {
    return Li(context, this)
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
        nodes[view.node.nativePtr]?.get() ?: run {
          val node = createNode().apply {
            this.view = view
          }
          nodes[view.node.nativePtr] = WeakReference(node)
          node
        }
      }

      else -> {
        viewNodes[view]?.get() ?: run {
          // is leaf to ensure it triggers android's view measure
          val node = createNode().apply {
            this.view = view
            setDefaultMeasureFunction()
          }
          viewNodes[view] = WeakReference(node)
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
    nodes[node]?.get()?.style?.updateNativeStyle()
  }

  fun requestLayout(view: android.view.View) {
    if (view is Element) {
      view.style.updateNativeStyle()
    } else {
      viewNodes[view]?.get()?.style?.updateNativeStyle()
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

    @JvmStatic
    private external fun nativePrintArenaStats(mason: Long)

    @JvmStatic
    private external fun nativeGetBuffer(mason: Long, handle: Int): Int

    @JvmStatic
    private external fun nativeNodeGetFloatRects(mason: Long, node: Long): FloatArray

  }
}
