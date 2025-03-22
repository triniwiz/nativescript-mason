package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Color
import android.os.Build
import android.text.BoringLayout
import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.StaticLayout
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.core.text.inSpans
import androidx.core.text.set
import org.nativescript.mason.masonkit.TextAlign.Justify
import org.nativescript.mason.masonkit.TextAlign.Start
import org.nativescript.mason.masonkit.text.Spans
import org.nativescript.mason.masonkit.text.Styles.DecorationLine
import org.nativescript.mason.masonkit.text.Styles.TextJustify
import java.lang.ref.WeakReference
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.ceil
import kotlin.math.max

object TextStyleKeys {
  const val COLOR = 0
  const val DECORATION_LINE = 4
  const val DECORATION_COLOR = 8
  const val TEXT_ALIGN = 12
  const val TEXT_JUSTIFY = 16
  const val BACKGROUND_COLOR = 20
}

@JvmInline
value class TextStateKeys internal constructor(val bits: Long) {
  companion object {
    val COLOR = TextStateKeys(1L shl 0)
    val DECORATION_LINE = TextStateKeys(1L shl 1)
    val DECORATION_COLOR = TextStateKeys(1L shl 2)
    val TEXT_ALIGN = TextStateKeys(1L shl 3)
    val TEXT_JUSTIFY = TextStateKeys(1L shl 4)
    val BACKGROUND_COLOR = TextStateKeys(1L shl 5)
  }

  infix fun or(other: TextStateKeys): TextStateKeys = TextStateKeys(bits or other.bits)
  infix fun and(other: TextStateKeys): TextStateKeys = TextStateKeys(bits and other.bits)
  infix fun hasFlag(flag: TextStateKeys): Boolean = (bits and flag.bits) != 0L
}

const val VIEW_PLACEHOLDER = "[[__view__]]"
const val VIEW_POSITION = "[[__position__]]"

class TextView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null
) : androidx.appcompat.widget.AppCompatTextView(context, attrs), MasonView, MeasureFunc {
  private var spannable = SpannableStringBuilder("")

  init {
    setSpannableFactory(object : Spannable.Factory() {
      override fun newSpannable(source: CharSequence): Spannable {
        return source as Spannable
      }
    })
    setText(spannable, BufferType.SPANNABLE)
  }

  override lateinit var node: Node
    private set

  // using two nodes to ensure measure is handled correctly
  private lateinit var actualNode: Node

  private val trackingSpan = Spans.TrackingSpan()

  private data class TextChild(
    var root: WeakReference<TextView>,
    var parent: TextChild?,
    val view: View,
    val textView: TextView?,
    var text: String = "",
    val children: MutableList<TextChild> = mutableListOf(),
    val spans: MutableMap<Spans.Type, Spans.NSCSpan> = mutableMapOf()
  )

  private lateinit var info: TextChild

  constructor(context: Context, mason: Mason) : this(context) {
    node = mason.createNode(this)
    actualNode = mason.createNode(this).apply {
      data = this@TextView
    }
    node.addChild(actualNode)
    info = TextChild(WeakReference(this), null, this, this).apply {
      this.spans[Spans.Type.ForegroundColor] = Spans.ForegroundColorSpan(Color.BLACK)
      this.spans[Spans.Type.BackgroundColor] = Spans.ForegroundColorSpan(Color.TRANSPARENT)
    }
  }

  val textValues: ByteBuffer by lazy {
    ByteBuffer.allocateDirect(24).apply {
      order(ByteOrder.nativeOrder())
      putInt(TextStyleKeys.COLOR, Color.BLACK)
      putInt(TextStyleKeys.DECORATION_COLOR, Color.BLACK)
      putInt(TextStyleKeys.TEXT_ALIGN, Start.value)
      putInt(TextStyleKeys.TEXT_JUSTIFY, TextJustify.None.value)
    }
  }

  val values: ByteBuffer
    get() {
      return style.values
    }

  fun syncStyle(state: String, textState: String) {
    val stateValue = state.toLongOrNull() ?: return
    val textStateValue = textState.toLongOrNull() ?: return
    if (textStateValue != -1L) {
      val value = TextStateKeys(textStateValue)
      if (value.hasFlag(TextStateKeys.COLOR)) {
        val color = textValues.getInt(TextStyleKeys.COLOR)
        updateColor(color)
      }

      if (value.hasFlag(TextStateKeys.BACKGROUND_COLOR)) {
        val backgroundColor = textValues.getInt(TextStyleKeys.BACKGROUND_COLOR)
        updateBackgroundColor(backgroundColor)
      }

      val hasDecorationColor = value.hasFlag(TextStateKeys.DECORATION_COLOR)
      val hasDecorationLine = value.hasFlag(TextStateKeys.DECORATION_LINE)

      if (hasDecorationColor || hasDecorationLine) {
        updateDecorationLine(decorationLine, decorationColor)
      }
    }
    if (stateValue != -1L) {
      style.isDirty = stateValue
      style.updateNativeStyle()
    }
  }

  override fun isLeaf(): Boolean {
    return true
  }

  val masonPtr: Long
    get() {
      return node.mason.getNativePtr()
    }

  val masonNodePtr: Long
    get() {
      return node.getNativePtr()
    }

  val masonPtrs: String
    get() {
      return node.mason.getNativePtr().toString() + ":" + masonNodePtr.toString()
    }

  override fun invalidate() {
    super.invalidate()
    if (::info.isInitialized) {
      var next = info.parent
      var parent = info.parent
      while (next != null) {
        next = parent?.parent?.let {
          parent = it
          it
        }
      }
      parent?.textView?.invalidate()
    }
  }

  var includePadding = false

  var textAlign: TextAlign
    get() {
      return style.textAlign
    }
    set(value) {
      style.textAlign = value
    }

  var textJustify: TextJustify
    get() {
      return TextJustify.fromInt(textValues.getInt(TextStyleKeys.TEXT_JUSTIFY))
    }
    set(value) {
      textValues.putInt(TextStyleKeys.TEXT_JUSTIFY, value.value)
    }

  private fun updateColor(color: Int, replace: Boolean = false) {
    val foreground = Spans.ForegroundColorSpan(color)
    info.spans[Spans.Type.ForegroundColor]?.let {
      if (replace) {
        val start = spannable.getSpanStart(it)
        val end = spannable.getSpanEnd(it)
        Log.d("updateColor", "$start $end")
        if (start != -1 && end != -1) {
          spannable.setSpan(foreground, start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
      }
      spannable.removeSpan(it)
    }

    info.spans[Spans.Type.ForegroundColor] = foreground

    if (!batching) {
      invalidateView()
    }
  }

  var color: Int
    get() {
      return textValues.getInt(TextStyleKeys.COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.COLOR, value)
      updateColor(value, info.text.isNotEmpty())
    }


  private fun updateBackgroundColor(color: Int, replace: Boolean = false) {
    val background = Spans.BackgroundColorSpan(color)
    info.spans[Spans.Type.BackgroundColor]?.let {
      if (replace) {
        val start = spannable.getSpanStart(it)
        val end = spannable.getSpanEnd(it)
        if (start != -1 && end != -1) {
          spannable.setSpan(background, start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
      }
      spannable.removeSpan(it)
    }
    info.spans[Spans.Type.BackgroundColor] = background
  }

  var backgroundColorValue: Int
    get() {
      return textValues.getInt(TextStyleKeys.BACKGROUND_COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.BACKGROUND_COLOR, value)
      updateBackgroundColor(value, info.text.isNotEmpty())
    }

  var decorationColor: Int
    get() {
      return textValues.getInt(TextStyleKeys.DECORATION_COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.DECORATION_COLOR, value)
      updateDecorationLine(decorationLine, value)
    }

  private fun updateDecorationLine(value: DecorationLine, color: Int) {/*
    if (spannable.isNotEmpty()) {
      val decoration = info.spans.indexOfFirst { it.type == Spans.Type.DecorationLine }
      if (decoration != -1) {
        spannable.removeSpan(info.spans[decoration])
      }

      when (value) {
        DecorationLine.None -> {
          if (decoration != -1) {
            info.spans.removeAt(decoration)
          }
        }

        DecorationLine.Underline -> {
          val line = Spans.UnderlineSpan()
          spannable.setSpan(
            line, 0, spannable.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
          )
          if (decoration != -1) {
            info.spans[decoration] = line
          } else {
            info.spans.add(line)
          }

        }

        DecorationLine.Overline -> {
          // todo
        }

        DecorationLine.LineThrough -> {
          val span = Spans.StrikethroughSpan()
          val paint = TextPaint()
          paint.color = color
          span.updateDrawState(paint)
          spannable.setSpan(
            span, 0, spannable.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
          )
          if (decoration != -1) {
            info.spans[decoration] = span
          } else {
            info.spans.add(span)
          }
        }
      }
    }
    */
  }

  var decorationLine: DecorationLine
    set(value) {
      textValues.putInt(TextStyleKeys.DECORATION_LINE, value.value)
      updateDecorationLine(value, decorationColor)
    }
    get() {
      return DecorationLine.fromInt(textValues.getInt(TextStyleKeys.DECORATION_LINE))
    }

  private fun mapMeasureSpec(mode: Int, value: Int): AvailableSpace {
    return when (mode) {
      MeasureSpec.EXACTLY -> AvailableSpace.Definite(value.toFloat())
      MeasureSpec.UNSPECIFIED -> {
        if (value != 0) {
          AvailableSpace.MaxContent
        } else {
          AvailableSpace.MinContent
        }
      }

      MeasureSpec.AT_MOST -> {
        if (value != 0) {
          AvailableSpace.Definite(value.toFloat())
        } else {
          AvailableSpace.MaxContent
        }
      }

      else -> AvailableSpace.MinContent
    }
  }

  override fun configure(block: Node.() -> Unit) {
    block(actualNode)
  }

  private var batching = false
    set(value) {
      if (field && !value) {
        // todo dirty state
        //  updateText(spannableText, true)
      }
      field = value
    }

  fun configureText(block: TextView.() -> Unit) {
    batching = true
    block()
    batching = false
  }


  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val specWidth = MeasureSpec.getSize(widthMeasureSpec)
    val specHeight = MeasureSpec.getSize(heightMeasureSpec)

    val specWidthMode = MeasureSpec.getMode(widthMeasureSpec)
    val specHeightMode = MeasureSpec.getMode(heightMeasureSpec)


    if (info.parent == null && parent !is org.nativescript.mason.masonkit.View) {
      node.compute(
        mapMeasureSpec(specWidthMode, specWidth).value,
        mapMeasureSpec(specHeightMode, specHeight).value
      )

      val layout = node.layout()
      setMeasuredDimension(
        layout.width.toInt(),
        layout.height.toInt(),
      )
    } else {
      val layout = node.layout()
      setMeasuredDimension(
        layout.width.toInt(), layout.height.toInt()
      )
    }
  }

  private fun measureLayout(
    knownWidth: Float, knownHeight: Float, availableWidth: Float, availableHeight: Float
  ): Layout? {
    val boring = BoringLayout.isBoring(spannable, paint)
    val width = boring?.let {
      Float.NaN
    } ?: Layout.getDesiredWidth(spannable, paint)

    val isWidthUnConstrained =
      (availableWidth.isNaN() || availableWidth == -1f || availableWidth == -2f) && knownWidth.isNaN()

    return if (boring == null && (isWidthUnConstrained && !width.isNaN() && width <= knownWidth)) {
      createLayout(spannable, ceil(width).toInt())
    } else if (boring != null && (isWidthUnConstrained || boring.width <= knownWidth)) {
      BoringLayout.make(
        spannable,
        paint,
        max(boring.width, 0),
        Layout.Alignment.ALIGN_NORMAL,
        1F,
        0f,
        boring,
        includePadding
      )
    } else {
      createLayout(spannable, ceil(knownWidth.takeIf { !it.isNaN() } ?: availableWidth).toInt())
    }
  }

  private fun createLayout(spannable: Spannable, maxWidth: Int): Layout {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val builder = StaticLayout.Builder.obtain(
        spannable, 0, spannable.length, paint, maxWidth
      ).setAlignment(Layout.Alignment.ALIGN_NORMAL).setIncludePad(includePadding)

      return builder.build()
    } else {
      return StaticLayout(
        spannable, paint, maxWidth, Layout.Alignment.ALIGN_NORMAL, 1F, 0f, includePadding
      )
    }
  }

  private fun invalidateView() {
    val rootView = info.root.get()
    if (rootView != null) {
      rootView.setText(rootView.spannable, BufferType.SPANNABLE)
    } else {
      setText(spannable, BufferType.SPANNABLE)
    }
  }

  fun updateText(text: String?) {
    // do nothing if the current text is the same as the incoming text
    if (text == info.text) return
    val previousSize = info.text.length
    val isRoot = info.parent == null
    if (text == null) {
      info.text = ""

      info.root.get()?.let {
        if (isRoot) {
          for (span in info.spans.values) {
            it.spannable.removeSpan(span)
          }
        } else {

        }

      }

      invalidateView()
      return
    }

    info.text = if (textAlign == Justify && textJustify != TextJustify.None) {
      when (textJustify) {
        TextJustify.Auto, TextJustify.InterWord, TextJustify.Distribute -> {
          val lines = text.split("\n")
          val justifiedText = StringBuilder()

          val paint = paint
          val width = width - paddingLeft - paddingRight

          for (line in lines) {
            val words = line.split(" ")
            if (words.size <= 1) {
              justifiedText.append(line).append("\n")
              continue
            }

            val lineWidth = paint.measureText(line)
            val spaceWidth = paint.measureText(" ")
            val extraSpace = (width - lineWidth) / (words.size - 1)
            val space = " ".repeat((extraSpace / spaceWidth).toInt())

            justifiedText.append(words.joinToString(space)).append("\n")
          }

          if (justifiedText.isEmpty()) {
            justifiedText.toString()
          } else {
            text
          }
        }

        TextJustify.InterCharacter -> {
          info.spans[Spans.Type.Justify] = Spans.ScaleXSpan(0.02f)
          text
        }

        else -> {
          text
        }
      }
    } else {
      text
    }

    val root = info.root.get()

    val spannable = if (isRoot) {
      spannable
    } else {
      root?.spannable
    }
    val start = if (isRoot) {
      0
    } else {
      root?.spannable?.getSpanStart(trackingSpan) ?: -1
    }

    if (start != -1) {
      if (previousSize == 0) {
        val wasTracking = spannable?.getSpanStart(trackingSpan) ?: -1
        if (wasTracking != -1) {
          spannable?.replace(start, start + VIEW_POSITION.length, info.text)
          spannable?.removeSpan(trackingSpan)
        } else {
          spannable?.insert(start, info.text)
        }
      } else {
        spannable?.replace(start, previousSize, "")
        if (info.text.isEmpty()) {
          spannable?.insert(start, VIEW_POSITION)
          spannable?.setSpan(
            trackingSpan, start, start + VIEW_POSITION.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
          )
        }
      }

      val length = info.text.length
      if (length > 0) {
        spannable?.setSpan(
          info.spans[Spans.Type.BackgroundColor],
          start,
          start + length,
          Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        )

        spannable?.setSpan(
          info.spans[Spans.Type.ForegroundColor],
          start,
          start + length,
          Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        )
      }
    }

    if (isRoot) {
      if (info.text.isNotEmpty()) {
        setBackgroundColor(backgroundColorValue)
      }
    }

    if (isRoot) {
      setText(spannable, BufferType.SPANNABLE)
    } else {
      invalidateView()
    }
  }

  val currentText: String
    get() {
      return info.text
    }

  @JvmOverloads
  fun addView(view: View, index: Int = -1) {
    // Return early if the view is already added
    if (info.children.any { it.view == view }) {
      return
    }

    var isEmpty = false
    val text = if (view is TextView) {
      view.info.text.ifEmpty {
        isEmpty = true
        VIEW_POSITION
      }
    } else {
      VIEW_PLACEHOLDER
    }

    val newPos = if (index <= -1) {
      info.children.size
    } else {
      index
    }


    info.root.get()?.let {
      if (newPos == 0) {
        val color = it.info.spans[Spans.Type.ForegroundColor]
        var start = color?.let { color -> it.spannable.getSpanEnd(color) } ?: -1
        if (start == -1) {
          start = it.spannable.getSpanEnd(it.trackingSpan)
        }

        it.spannable.insert(start, text)
        if (view is TextView) {
          view.info.root = info.root
          view.info.parent = info

          if (isEmpty) {

            it.spannable.setSpan(
              view.trackingSpan,
              start,
              start + text.length,
              Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
          } else {
            if (view.info.text.isEmpty()) {
              it.spannable.replace(start, start + VIEW_POSITION.length, "")
              it.spannable.removeSpan(view.trackingSpan)
            }
            view.info.spans[Spans.Type.BackgroundColor]?.let { background ->
              it.spannable.setSpan(
                background,
                start,
                start + text.length,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
              )
            }


            it.spannable.setSpan(
              view.info.spans[Spans.Type.ForegroundColor],
              start,
              start + text.length,
              Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
          }
        }

      } else {
        val child = info.children.getOrNull(newPos - 1)
        val colorOrView =
          child?.spans?.get(Spans.Type.ForegroundColor) ?: child?.spans?.get(Spans.Type.View)
        var start = colorOrView?.let { color -> it.spannable.getSpanEnd(color) } ?: -1
        if (start == -1 && child?.textView != null) {
          start = it.spannable.getSpanEnd(child.textView.trackingSpan)
        }
        it.spannable.insert(start, text)

        if (view is TextView) {

        } else {
          val info = TextChild(info.root, info, view, null, text)
          val childNode = node.mason.nodeForView(view)
          node.addChild(childNode)
          val span = Spans.ViewSpannable(view, childNode)
          info.spans[Spans.Type.View] = span
          it.spannable.setSpan(
            span,
            start,
            VIEW_PLACEHOLDER.length,
            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
          )
        }
      }
    }


    view.layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.WRAP_CONTENT,
      ViewGroup.LayoutParams.WRAP_CONTENT
    )

    if (index == -1) {
      info.children.add(info)
    } else {
      info.children.add(index, info)
    }


    invalidateView()

  }

  fun removeView(view: View) {/*
    val childIndex = children.indexOfFirst { it.view == view }
    if (childIndex != -1) {
      val childInfo = children.removeAt(childIndex)


      childInfo.spans.forEach { span ->
        spannable.removeSpan(span)
      }


      spannable.delete(childInfo.start, childInfo.end)


      for (i in childIndex until children.size) {
        val remainingChild = children[i]
      }

      if (!batching) {
        invalidateView()
      }
    }

    */
  }

  // called for leaf views
  @SuppressWarnings("deprecated")
  override fun measure(
    knownDimensions: Size<Float?>, availableSpace: Size<Float?>
  ): Size<Float> {
    val layout = measureLayout(
      knownDimensions.width ?: Float.NaN, knownDimensions.height ?: Float.NaN,
      availableSpace.width ?: Float.NaN, availableSpace.height ?: Float.NaN,
    )
    val height = knownDimensions.height?.takeIf {
      !it.isNaN() && it >= 0
    } ?: availableSpace.height?.takeIf {
      !it.isNaN() && it >= 0
    }

    return layout?.let {
      Size(it.width.toFloat(), height ?: it.height.toFloat())
    } ?: Size(0f, 0f)
  }
}
