package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import org.nativescript.mason.masonkit.View.Companion.mapMeasureSpec
import org.nativescript.mason.masonkit.enums.ListStyleType
import java.lang.ref.WeakReference
import java.nio.ByteBuffer
import java.nio.ByteOrder

class ListView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : FrameLayout(context, attrs), Element, StyleChangeListener {
  override lateinit var node: Node
//
//  override fun generateDefaultLayoutParams(): LayoutParams {
//    return LayoutParams(
//      LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT
//    )
//  }

  object Keys {
    const val COUNT = 0
    const val MULTI_TEMPLATE = 4
  }

  val values: ByteBuffer by lazy {
    ByteBuffer.allocateDirect(32).apply {
      order(ByteOrder.nativeOrder())
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    ViewUtils.dispatchDraw(this, canvas, style) {
      super.dispatchDraw(it)
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    style.mBackground?.layers?.forEach { it.shader = null } // force rebuild on next draw
    style.mBorderRenderer.invalidate()
    super.onSizeChanged(w, h, oldw, oldh)
  }

  var count: Int
    set(value) {
      values.putInt(Keys.COUNT, value)
    }
    get() {
      return staticViews.size + values.getInt(Keys.COUNT)
    }

  var isOrdered: Boolean = false
  private var itemIds = mutableMapOf<Int, Long>()
  private var staticViews = mutableListOf<Li>()

  interface Listener {
    fun onCreate(type: Int): Li
    fun onBind(holder: Holder, index: Int)
    fun getItemViewType(position: Int): Int
  }

  class HolderData(var id: Long = -1, val view: Holder, val viewType: Int)

  internal val staticTemplates by lazy {
    mutableMapOf<Int, HolderData>()
  }

  var listener: Listener? = null

  private var viewType = mutableMapOf<Int, Int>()

  override fun addView(child: View?) {
    super.addView(child)
  }

  override fun addView(child: View?, width: Int, height: Int) {
    super.addView(child, width, height)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)

    val availableWidth = mapMeasureSpec(specWidthMode, specWidth).value
    val availableHeight = mapMeasureSpec(specHeightMode, specHeight).value

    // Only compute if we are the layout root — when parent is an Element,
    // Taffy computes top-down and will handle this node in the recursive call.
    if (parent !is Element) {
      compute(
        availableWidth, availableHeight
      )
    }

    val layout = layout()
    val width = layout.width.toInt()
    val height = layout.height.toInt()

    measureChild(
      list, MeasureSpec.makeMeasureSpec(
        layout.width.toInt(), MeasureSpec.EXACTLY,
      ), MeasureSpec.makeMeasureSpec(
        layout.height.toInt(), MeasureSpec.EXACTLY
      )
    )

    setMeasuredDimension(width, height)
  }

  internal var virtualItems = mutableListOf<Li>()

  class Holder(val view: Li) : RecyclerView.ViewHolder(view) {
    init {
      view.holder = this
    }
  }

  class Adapter(list: ListView) : RecyclerView.Adapter<Holder>() {
    private var list: WeakReference<ListView> = WeakReference(list)

    override fun onCreateViewHolder(
      parent: ViewGroup, viewType: Int
    ): Holder {
      val li = list.get()?.let { list ->
        list.listener?.onCreate(viewType)?.let {
          list.virtualItems.add(it)
          it
        }
      } ?: Mason.shared.createListItem(parent.context)

      return Holder(li)
    }

    override fun onBindViewHolder(
      holder: Holder, position: Int
    ) {
      val list = list.get() ?: return
      // Sync ordered mode to the Li item
      holder.view.isOrdered = list.isOrdered
      holder.view.position = position
      holder.view.holder = holder

      if (holder.view.resolveListStyleType() != ListStyleType.None.value) {
        // Set marker text for custom markers
        val marker = if (list.isOrdered) {
          "${position + 1}."
        } else {
          "\u2022" // bullet character as fallback for custom type
        }
        holder.view.setMarkerValue(marker)
      } else {
        holder.view.setMarkerValue("")
      }

      list.listener?.onBind(holder, position)
    }

    override fun getItemCount(): Int {
      return list.get()?.count ?: 0
    }

    override fun onViewRecycled(holder: Holder) {
      super.onViewRecycled(holder)
      holder.view.resetForRecycle()
      holder.view.holder = null
    }

  }

  private val adapter by lazy {
    Adapter(this)
  }

  private val layoutManager by lazy {
    LinearLayoutManager(context).apply {
      orientation = LinearLayoutManager.VERTICAL
    }
  }

  class MasonRecyclerView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
  ) : RecyclerView(context, attrs)

  internal val list by lazy {
    val recycler = MasonRecyclerView(context)
    recycler.adapter = adapter
    recycler.setItemViewCacheSize(10)
    layoutManager.initialPrefetchItemCount = 3
    recycler.layoutManager = layoutManager
    recycler
  }

  fun reload() {
    // Ensure adapter notifications and layout requests run on the UI thread
    list.post {
      itemIds.clear()
      viewType.clear()
      adapter.notifyDataSetChanged()
      list.requestLayout()
      list.invalidate()
    }
  }

  fun notifyDataSetChanged() {
    reload()
  }


  fun notifyItemInserted(index: Int) {
    viewType.remove(index)
    list.post {
      adapter.notifyItemInserted(index)
      list.requestLayout()
    }
  }

  fun notifyItemChanged(index: Int) {
    viewType.remove(index)
    list.post {
      adapter.notifyItemChanged(index)
    }
  }

  fun notifyItemRemoved(index: Int) {
    viewType.remove(index)
    list.post {
      adapter.notifyItemRemoved(index)
      list.requestLayout()
    }
  }

  fun notifyItemRangeInserted(index: Int, count: Int) {
    if (index < 0 || (count <= 0)) return
    for (i in index until index + count) viewType.remove(i)
    list.post {
      adapter.notifyItemRangeInserted(index, count)
      list.requestLayout()
    }
  }

  fun notifyItemRangeChanged(index: Int, count: Int) {
    if (index < 0 || (count <= 0)) return
    for (i in index until index + count) viewType.remove(i)
    list.post {
      adapter.notifyItemRangeChanged(index, count)
    }
  }

  fun notifyItemRangeRemoved(index: Int, count: Int) {
    if (index < 0 || (count <= 0)) return
    for (i in index until index + count) viewType.remove(i)
    list.post {
      adapter.notifyItemRangeRemoved(index, count)
      list.requestLayout()
    }
  }

  fun notifyItemMoved(
    fromPosition: Int, toPosition: Int
  ) {
    viewType.remove(fromPosition)
    viewType.remove(toPosition)
    adapter.notifyItemMoved(fromPosition, toPosition)
  }


  override fun canScrollHorizontally(direction: Int): Boolean {
    return when (node.style.values.getInt(StyleKeys.OVERFLOW_X)) {
      2, 4 -> true
      else -> false
    }
  }

  override fun canScrollVertically(direction: Int): Boolean {
    return when (node.style.values.getInt(StyleKeys.OVERFLOW_Y)) {
      2, 4 -> true
      else -> false
    }
  }

  override val style: Style
    get() = node.style

  override val view: View
    get() = this

  constructor(context: Context, mason: Mason) : this(context) {
    node = mason.createNode().apply {
      view = this@ListView
    }
    node.style.setStyleChangeListener(this)
  }

  init {
    if (!override) {
      if (!::node.isInitialized) {
        node = Mason.shared.createNode().apply {
          view = this@ListView
        }
        node.style.setStyleChangeListener(this)
      }
    }
    // css visible default
    clipChildren = false
    clipToPadding = false

    list.layoutParams = RecyclerView.LayoutParams(
      LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT
    )

    style.prepareMut()

    style.values.put(StyleKeys.ITEM_IS_LIST, 1.toByte())
    style.values.putInt(StyleKeys.PADDING_LEFT_TYPE, 0)
    style.values.putFloat(StyleKeys.PADDING_LEFT_VALUE, 40f * node.mason.scale)
    node.dirty()

    addView(list)

//    isChildrenDrawingOrderEnabled = true
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val pl = paddingLeft
    val pt = paddingTop
    val pr = paddingRight
    val pb = paddingBottom

    list.measure(
      MeasureSpec.makeMeasureSpec(
        (right - left - pr) - pl, MeasureSpec.EXACTLY,
      ), MeasureSpec.makeMeasureSpec(
        (bottom - top - pb) - pt, MeasureSpec.EXACTLY
      )
    )

    list.layout(
      pl, pt, right - left - pr, bottom - top - pb
    )
  }

  override fun onTextStyleChanged(change: Int) {
    Node.invalidateDescendantTextViews(node, change)
  }
}
