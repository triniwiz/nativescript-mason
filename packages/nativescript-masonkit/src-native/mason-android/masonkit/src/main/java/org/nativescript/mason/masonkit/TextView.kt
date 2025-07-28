package org.nativescript.mason.masonkit

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.text.LineBreaker
import android.icu.text.Transliterator
import android.os.Build
import android.text.BoringLayout
import android.text.Layout
import android.text.Spannable
import android.text.SpannableString
import android.text.SpannableStringBuilder
import android.text.StaticLayout
import android.util.AttributeSet
import android.util.Log
import android.view.View
import androidx.annotation.RequiresApi
import org.nativescript.mason.masonkit.TextAlign.Start
import org.nativescript.mason.masonkit.text.Spans
import org.nativescript.mason.masonkit.text.Styles
import org.nativescript.mason.masonkit.text.Styles.DecorationLine
import org.nativescript.mason.masonkit.text.Styles.TextJustify
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Locale
import kotlin.collections.component1
import kotlin.collections.component2
import kotlin.collections.set
import kotlin.math.ceil
import kotlin.math.max

object TextStyleKeys {
  const val COLOR = 0
  const val DECORATION_LINE = 4
  const val DECORATION_COLOR = 8
  const val TEXT_ALIGN = 12
  const val TEXT_JUSTIFY = 16
  const val BACKGROUND_COLOR = 20
  const val SIZE = 24
  const val TRANSFORM = 28
  const val FONT_STYLE_TYPE = 32
  const val FONT_STYLE_SLANT = 36
  const val TEXT_WRAP = 40
  const val WHITE_SPACE = 40
  const val TEXT_OVERFLOW = 44
}

const val UNSET_COLOR = 0xDEADBEEF

@JvmInline
value class TextStateKeys internal constructor(val bits: Long) {
  companion object {
    val COLOR = TextStateKeys(1L shl 0)
    val DECORATION_LINE = TextStateKeys(1L shl 1)
    val DECORATION_COLOR = TextStateKeys(1L shl 2)
    val TEXT_ALIGN = TextStateKeys(1L shl 3)
    val TEXT_JUSTIFY = TextStateKeys(1L shl 4)
    val BACKGROUND_COLOR = TextStateKeys(1L shl 5)

    val SIZE = TextStateKeys(1L shl 6)
    val TRANSFORM = TextStateKeys(1L shl 7)
    val FONT_STYLE = TextStateKeys(1L shl 8)
    val FONT_STYLE_SLANT = TextStateKeys(1L shl 9)
    val TEXT_WRAP = TextStateKeys(1L shl 10)
    val WHITE_SPACE = TextStateKeys(1L shl 11)
    val TEXT_OVERFLOW = TextStateKeys(1L shl 12)
  }

  infix fun or(other: TextStateKeys): TextStateKeys = TextStateKeys(bits or other.bits)
  infix fun and(other: TextStateKeys): TextStateKeys = TextStateKeys(bits and other.bits)
  infix fun hasFlag(flag: TextStateKeys): Boolean = (bits and flag.bits) != 0L
}

const val VIEW_PLACEHOLDER = "\uFFFC"

class TextView @JvmOverloads constructor(
  context: Context, attrs: AttributeSet? = null, override: Boolean = false
) : androidx.appcompat.widget.AppCompatTextView(context, attrs), MasonView, MeasureFunc {
  private var spannableText: String? = null
  private var spannable = SpannableStringBuilder("")
  private var spans = mutableMapOf<Spans.Type, Spans.NSCSpan>()

  lateinit var font: FontFace
    private set

  var type: TextType = TextType.None
    private set

  override lateinit var node: Node
    private set

  internal lateinit var textNode: Node

  private var owner: TextView? = null
  private val children: MutableList<TextChild> = mutableListOf()

  private data class TextChild(
    val view: View, val text: TextView?, val attachment: Spans.NSCSpan?, val node: Node
  )

  constructor(context: Context, mason: Mason) : this(context, null, true) {
    setup(mason)
  }

  constructor(context: Context, mason: Mason, type: TextType) : this(context, null, true) {
    this.type = type
    setup(mason)
  }

  init {
    if (!::node.isInitialized && !override) {
      setup(Mason.shared)
    }
  }

  private fun setup(mason: Mason) {
    node = mason.createNode(this)
    textNode = mason.createNode(this).apply {
      data = this@TextView
      style.display = Display.Inline
    }

    val scale = context.resources.displayMetrics.density
    val margin = { top: Float, bottom: Float ->
      Rect<LengthPercentageAuto>(
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(0f),
        LengthPercentageAuto.Points(top * scale),
        LengthPercentageAuto.Points(bottom * scale)
      )
    }

    node.inBatch = true

    when (type) {
      TextType.Span -> {
        font = FontFace("sans-serif")
        style.display = Display.Inline
      }

      TextType.Code -> {
        font = FontFace("monospace")
        style.display = Display.Inline
        setBackgroundColor(0xFFEFEFEF.toInt())
      }

      TextType.H1 -> {
        font = FontFace("sans-serif")
        font.weight = FontFace.NSCFontWeight.Bold
        spans[Spans.Type.Size] = Spans.SizeSpan(32, true)
        node.style.margin = margin(16f, 16f)
      }

      TextType.H2 -> {
        font = FontFace("sans-serif")
        font.weight = FontFace.NSCFontWeight.Bold
        spans[Spans.Type.Size] = Spans.SizeSpan(24, true)
        node.style.margin = margin(14f, 14f)
      }

      TextType.H3 -> {
        font = FontFace("sans-serif")
        font.weight = FontFace.NSCFontWeight.Bold
        spans[Spans.Type.Size] = Spans.SizeSpan(18, true)
        node.style.margin = margin(12f, 12f)
      }

      TextType.H4 -> {
        font = FontFace("sans-serif")
        font.weight = FontFace.NSCFontWeight.Bold
        spans[Spans.Type.Size] = Spans.SizeSpan(16, true)
        node.style.margin = margin(10f, 10f)
      }

      TextType.H5 -> {
        font = FontFace("sans-serif")
        font.weight = FontFace.NSCFontWeight.Bold
        spans[Spans.Type.Size] = Spans.SizeSpan(13, true)
        node.style.margin = margin(8f, 8f)
      }

      TextType.H6 -> {
        font = FontFace("sans-serif")
        font.weight = FontFace.NSCFontWeight.Bold
        spans[Spans.Type.Size] = Spans.SizeSpan(10, true)
        node.style.margin = margin(6f, 6f)
      }

      TextType.Li -> {
        font = FontFace("sans-serif")
      }

      TextType.Blockquote -> {
        font = FontFace("sans-serif")
      }

      TextType.B -> {
        font = FontFace("sans-serif")
        font.weight = FontFace.NSCFontWeight.Bold
        style.display = Display.Inline
      }

      TextType.Pre -> {
        font = FontFace("monospace")
        whiteSpace = Styles.WhiteSpace.Pre
      }

      else -> {
        font = FontFace("sans-serif")
      }
    }

    font.loadSync(context) {}

    spans[Spans.Type.Typeface] = Spans.TypefaceSpan(font.font!!, font.weight.isBold)
    node.inBatch = false

    setSpannableFactory(object : Spannable.Factory() {
      override fun newSpannable(source: CharSequence): Spannable {
        if (source is String) {
          return SpannableString(source)
        }
        return source as Spannable
      }
    })
    setText(spannable, BufferType.SPANNABLE)
  }

  val textValues: ByteBuffer by lazy {
    ByteBuffer.allocateDirect(52).apply {
      order(ByteOrder.nativeOrder())
      putInt(TextStyleKeys.COLOR, Color.BLACK)
      putInt(TextStyleKeys.DECORATION_COLOR, UNSET_COLOR.toInt())
      putInt(TextStyleKeys.TEXT_ALIGN, Start.value)
      putInt(TextStyleKeys.TEXT_JUSTIFY, TextJustify.None.value)
      putInt(TextStyleKeys.SIZE, (15 * resources.displayMetrics.density).toInt())
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

      var dirty = false
      if (value.hasFlag(TextStateKeys.TRANSFORM) || value.hasFlag(TextStateKeys.TEXT_WRAP) || value.hasFlag(
          TextStateKeys.WHITE_SPACE
        ) || value.hasFlag(
          TextStateKeys.TEXT_OVERFLOW
        )
      ) {
        applyTransform(textTransform, true, whiteSpace, textWrap)
        dirty = true
      }

      if (dirty) {
        node.dirty()
        invalidate()
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

  var includePadding = true

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

  private val rootNode: Node
    get() {
      return this.node.root ?: node
    }

  private fun updateFontSize(value: Int) {
    spans[Spans.Type.Size]?.let {
      spannable.removeSpan(it)
    }
    spans[Spans.Type.Size] = Spans.SizeSpan(value)
    applySpans()
  }

  var fontSize: Int
    get() {
      return textValues.getInt(TextStyleKeys.SIZE)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.SIZE, value)
      updateFontSize(value)
      node.dirty()
      if (!node.inBatch) {
        invalidateView()
      }
    }

  var fontStyle: FontFace.NSCFontStyle
    set(value) {
      font.style = value
    }
    get() {
      return font.style
    }


  var textWrap: Styles.TextWrap
    get() {
      return Styles.TextWrap.fromInt(textValues.getInt(TextStyleKeys.TEXT_WRAP))
    }
    set(value) {
      val changed = value != textWrap
      textValues.putInt(TextStyleKeys.TEXT_WRAP, value.value)
      applyTransform(textTransform, changed, whiteSpace, value)
      markDirtyAndRecompute()
    }

  var whiteSpace: Styles.WhiteSpace
    get() {
      return Styles.WhiteSpace.fromInt(textValues.getInt(TextStyleKeys.WHITE_SPACE))
    }
    set(value) {
      val changed = value != whiteSpace
      textValues.putInt(TextStyleKeys.WHITE_SPACE, value.value)
      applyTransform(textTransform, changed, value, textWrap)
      markDirtyAndRecompute()
    }

  var textOverflow: Styles.TextOverflow = Styles.TextOverflow.Clip
    set(value) {
      field = value
      textValues.putInt(TextStyleKeys.TEXT_WRAP, value.value)
      invalidate()
    }

  private fun markDirtyAndRecompute() {
    node.dirty()
    if (!node.inBatch) {
      rootNode.computeCacheWidth?.let { width ->
        rootNode.computeCacheHeight?.let { height ->
          rootNode.compute(width, height)
          (rootNode.data as? View)?.requestLayout()
        }
      }
    }
  }

  private fun fullWidthTransformed(string: String): String {
    val result = StringBuilder(string.length)
    for (char in string) {
      val code = char.code
      if (code in 0x21..0x7E) {
        result.append((code + 0xFEE0).toChar())
      } else {
        result.append(char)
      }
    }
    return result.toString()
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  private fun fullWidthKana(string: String): String {
    val transliterator = Transliterator.getInstance("Halfwidth-Fullwidth")
    return transliterator.transliterate(string)
  }

  private val halfwidthToFullwidthMap: Map<Char, Char> = mapOf(
    'ｦ' to 'ヲ',
    'ｧ' to 'ァ',
    'ｨ' to 'ィ',
    'ｩ' to 'ゥ',
    'ｪ' to 'ェ',
    'ｫ' to 'ォ',
    'ｬ' to 'ャ',
    'ｭ' to 'ュ',
    'ｮ' to 'ョ',
    'ｯ' to 'ッ',
    'ｰ' to 'ー',
    'ｱ' to 'ア',
    'ｲ' to 'イ',
    'ｳ' to 'ウ',
    'ｴ' to 'エ',
    'ｵ' to 'オ',
    'ｶ' to 'カ',
    'ｷ' to 'キ',
    'ｸ' to 'ク',
    'ｹ' to 'ケ',
    'ｺ' to 'コ',
    'ｻ' to 'サ',
    'ｼ' to 'シ',
    'ｽ' to 'ス',
    'ｾ' to 'セ',
    'ｿ' to 'ソ',
    'ﾀ' to 'タ',
    'ﾁ' to 'チ',
    'ﾂ' to 'ツ',
    'ﾃ' to 'テ',
    'ﾄ' to 'ト',
    'ﾅ' to 'ナ',
    'ﾆ' to 'ニ',
    'ﾇ' to 'ヌ',
    'ﾈ' to 'ネ',
    'ﾉ' to 'ノ',
    'ﾊ' to 'ハ',
    'ﾋ' to 'ヒ',
    'ﾌ' to 'フ',
    'ﾍ' to 'ヘ',
    'ﾎ' to 'ホ',
    'ﾏ' to 'マ',
    'ﾐ' to 'ミ',
    'ﾑ' to 'ム',
    'ﾒ' to 'メ',
    'ﾓ' to 'モ',
    'ﾔ' to 'ヤ',
    'ﾕ' to 'ユ',
    'ﾖ' to 'ヨ',
    'ﾗ' to 'ラ',
    'ﾘ' to 'リ',
    'ﾙ' to 'ル',
    'ﾚ' to 'レ',
    'ﾛ' to 'ロ',
    'ﾜ' to 'ワ',
    'ﾝ' to 'ン'
  )

  private val dakutenMap: Map<Char, Char> = mapOf(
    'カ' to 'ガ',
    'キ' to 'ギ',
    'ク' to 'グ',
    'ケ' to 'ゲ',
    'コ' to 'ゴ',
    'サ' to 'ザ',
    'シ' to 'ジ',
    'ス' to 'ズ',
    'セ' to 'ゼ',
    'ソ' to 'ゾ',
    'タ' to 'ダ',
    'チ' to 'ヂ',
    'ツ' to 'ヅ',
    'テ' to 'デ',
    'ト' to 'ド',
    'ハ' to 'バ',
    'ヒ' to 'ビ',
    'フ' to 'ブ',
    'ヘ' to 'ベ',
    'ホ' to 'ボ',
    'ウ' to 'ヴ'
  )

  private val handakutenMap: Map<Char, Char> = mapOf(
    'ハ' to 'パ', 'ヒ' to 'ピ', 'フ' to 'プ', 'ヘ' to 'ペ', 'ホ' to 'ポ'
  )

  private fun fullWidthKanaCompat(string: String): String {
    val builder = StringBuilder(string.length)
    var lastFullwidthKanaIndex = -1

    for (char in string) {
      when (char) {
        in 'ｦ'..'ﾝ' -> {
          // Halfwidth Kana
          val fullwidth = halfwidthToFullwidthMap[char] ?: char
          builder.append(fullwidth)
          lastFullwidthKanaIndex = builder.length - 1
        }

        'ﾞ' -> {
          if (lastFullwidthKanaIndex != -1) {
            val base = builder[lastFullwidthKanaIndex]
            val combined = dakutenMap[base] ?: base
            builder.setCharAt(lastFullwidthKanaIndex, combined)
          } else {
            builder.append('゛')
          }
          lastFullwidthKanaIndex = -1
        }

        'ﾟ' -> {
          if (lastFullwidthKanaIndex != -1) {
            val base = builder[lastFullwidthKanaIndex]
            val combined = handakutenMap[base] ?: base
            builder.setCharAt(lastFullwidthKanaIndex, combined)
          } else {
            builder.append('゜')
          }
          lastFullwidthKanaIndex = -1
        }

        in '\u0021'..'\u007E' -> {
          // Fullwidth ASCII
          val fullwidth = (char.code + 0xFEE0).toChar()
          builder.append(fullwidth)
          lastFullwidthKanaIndex = -1
        }

        else -> {
          builder.append(char)
          lastFullwidthKanaIndex = -1
        }
      }
    }
    return builder.toString()
  }

  private fun balancedText(input: String): String {
    // todo
    return input
  }

  private fun applyTransform(
    value: Styles.TextTransform,
    changed: Boolean,
    whiteSpace: Styles.WhiteSpace,
    textWrap: Styles.TextWrap
  ) {
    if (!changed || spannable.isEmpty()) {
      return
    }

    var transformedText = spannableText ?: return

    transformedText = when (whiteSpace) {
      Styles.WhiteSpace.Normal -> transformedText.replace(Regex("\\s+"), " ")
      Styles.WhiteSpace.Pre -> transformedText
      Styles.WhiteSpace.PreWrap -> transformedText
      Styles.WhiteSpace.PreLine -> transformedText.replace(Regex("[ \t]+"), " ")
    }

    transformedText = when (textWrap) {
      Styles.TextWrap.NoWrap -> transformedText.replace("\n", " ")
      Styles.TextWrap.Wrap -> transformedText
      Styles.TextWrap.Balance -> {
        balancedText(transformedText)
      }
    }

    when (value) {
      Styles.TextTransform.None -> {
        spannable.replace(0, spannable.length, transformedText)
      }

      Styles.TextTransform.Capitalize -> {
        spannable.replace(
          0,
          spannable.length,
          transformedText.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() })
      }

      Styles.TextTransform.Uppercase -> {
        spannable.replace(0, spannable.length, transformedText.uppercase())
      }

      Styles.TextTransform.Lowercase -> {
        spannable.replace(0, spannable.length, transformedText.lowercase())
      }

      Styles.TextTransform.FullWidth -> {
        spannable.replace(0, spannable.length, transformedText.let {
          fullWidthTransformed(it)
        })
      }

      Styles.TextTransform.FullSizeKana -> {
        spannable.replace(0, spannable.length, transformedText.let {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            fullWidthKana(it)
          } else {
            fullWidthKanaCompat(it)
          }
        })
      }

      Styles.TextTransform.MathAuto -> {
        spannable.replace(0, spannable.length, transformedText)
      }
    }
  }

  var textTransform: Styles.TextTransform
    get() {
      return Styles.TextTransform.fromInt(textValues.getInt(TextStyleKeys.TRANSFORM))
    }
    set(value) {
      val changed = value != textTransform
      textValues.putInt(TextStyleKeys.TRANSFORM, value.value)
      applyTransform(value, changed, whiteSpace, textWrap)
      markDirtyAndRecompute()
    }

  private fun updateColor(color: Int, replace: Boolean = false) {
    spans[Spans.Type.ForegroundColor] = Spans.ForegroundColorSpan(color)
    applySpans()
    invalidateView()
  }

  var color: Int
    get() {
      return textValues.getInt(TextStyleKeys.COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.COLOR, value)
      updateColor(value, text.isNotEmpty())
    }


  private fun updateBackgroundColor(color: Int) {
    val background = Spans.BackgroundColorSpan(color)

    if ((spannableText?.length ?: 0) == 0) {
      spans[Spans.Type.BackgroundColor] = background
      return
    }
    spans[Spans.Type.BackgroundColor] = background

    applySpans()

    invalidateView()
  }

  var backgroundColorValue: Int
    get() {
      return textValues.getInt(TextStyleKeys.BACKGROUND_COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.BACKGROUND_COLOR, value)
      updateBackgroundColor(value)
    }

  var decorationColor: Int
    get() {
      return textValues.getInt(TextStyleKeys.DECORATION_COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.DECORATION_COLOR, value)
      updateDecorationLine(decorationLine, value)
    }

  private fun updateDecorationLine(value: DecorationLine, color: Int) {
    val lineSpan = when (value) {
      DecorationLine.None -> null
      DecorationLine.Underline -> Spans.UnderlineSpan()
      DecorationLine.LineThrough -> Spans.StrikethroughSpan()
      DecorationLine.Overline -> null // TODO: Need custom span
    }

    if (lineSpan != null) {
      spans[Spans.Type.DecorationLine] = lineSpan
    } else {
      spans.remove(Spans.Type.DecorationLine)
    }

    applySpans()

    invalidateView()
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
    block(node)
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

    if (owner == null && parent !is MasonView) {
      node.compute(
        mapMeasureSpec(specWidthMode, specWidth).value,
        mapMeasureSpec(specHeightMode, specHeight).value
      )

      val layout = node.layout()
      node.computedLayout = layout
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
    val textToMeasure = spannableText ?: ""
    val boring = BoringLayout.isBoring(textToMeasure, paint)
    val width = boring?.let {
      Float.NaN
    } ?: Layout.getDesiredWidth(textToMeasure, paint)

    val inline = node.style.display == Display.Inline

    val isWidthUnConstrained =
      (availableWidth.isNaN() || availableWidth == -1f || availableWidth == -2f) && knownWidth.isNaN()
    return if (boring == null && (isWidthUnConstrained || (!width.isNaN() && width <= knownWidth))) {
      createLayout(textToMeasure, ceil(width).toInt())
    } else if (boring != null && (isWidthUnConstrained || boring.width <= knownWidth)) {
      BoringLayout.make(
        textToMeasure,
        paint,
        max(boring.width, 0),
        Layout.Alignment.ALIGN_NORMAL,
        1F,
        0f,
        boring,
        includePadding
      )
    } else {
      val maxWidth = knownWidth.takeIf { !it.isNaN() } ?: availableWidth
      createLayout(textToMeasure, ceil(maxWidth).toInt())
    }
  }

  @SuppressLint("WrongConstant")
  private fun createLayout(spannable: String, maxWidth: Int): Layout {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      var builder = StaticLayout.Builder.obtain(
        spannable, 0, spannable.length, paint, maxWidth
      ).setAlignment(Layout.Alignment.ALIGN_NORMAL).setIncludePad(includePadding)
      if (type == TextType.Pre) {
        builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          builder.setBreakStrategy(LineBreaker.BREAK_STRATEGY_SIMPLE)
        } else {
          builder.setBreakStrategy(Layout.BREAK_STRATEGY_SIMPLE)
        }
      }

      return builder.build()
    } else {
      return StaticLayout(
        spannable, paint, maxWidth, Layout.Alignment.ALIGN_NORMAL, 1F, 0f, includePadding
      )
    }
  }

  private fun rebuildText(): SpannableStringBuilder {
    val result = SpannableStringBuilder()
    markDirtyAndRecompute()
    val ownStart = result.length
    result.append(spannable)
    val ownEnd = result.length

    if (result.isEmpty()) {
      return result
    }

    if (ownStart < ownEnd) {
      for ((_, span) in spans) {
        result.setSpan(span, ownStart, ownEnd, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
    }

    for (child in children) {
      when {
        child.text != null -> {
          val childText = child.text.rebuildText()
          val start = result.length
          result.append(childText)
          val end = result.length

          for ((_, span) in child.text.spans) {
            if (start == end) {
              continue
            }
            result.setSpan(span, start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
          }
        }

        child.attachment != null -> {
          val start = result.length
          result.append(VIEW_PLACEHOLDER)
          val end = result.length
          result.setSpan(
            child.attachment, start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
          )
        }
      }
    }
    spannableText = result.toString()
    return result
  }

  internal fun invalidateView() {
    if (owner != null) {
      owner?.invalidateView()
      return
    }


    val rebuilt = rebuildText()
    setText(rebuilt, BufferType.SPANNABLE)
    invalidate()
    requestLayout()
  }

  override fun invalidate() {
    if (::node.isInitialized) {
      node.dirty()
    }
    super.invalidate()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    node.computedLayout.let { parentLayout ->
      parentLayout.children.forEachIndexed { index, layout ->
        children.getOrNull(index)?.let {
          it.node.computedLayout = layout
        }
      }
    }
  }

  fun updateText(text: String?) {
    if (text == spannableText) {
      return
    }

    if (text == null) {
      node.removeChild(textNode)
    } else {
      node.addChildAt(textNode, 0)
    }

    spannableText = text
    spannable.clearSpans()
    spannable.clear()
    spannable.append(text ?: "")
    applySpans()
    node.dirty()
    invalidateView()
  }

  @JvmOverloads
  fun addView(view: View, index: Int = -1) {
    // Return early if the view is already added
    if (children.any { it.view == view }) {
      return
    }
    val isText = view is TextView
    var attachment: Spans.NSCSpan? = null
    val childNode = if (view is MasonView) {
      view.node
    } else {
      Mason.shared.nodeForView(view)
    }

    if (!isText) {
      attachment = Spans.ViewSpannable(view, childNode)
    } else {
      (view as TextView).owner = this
    }

    val child = TextChild(view, view as? TextView, attachment, childNode)

    if (index == -1 || index >= children.size) {
      children.add(child)
    } else {
      children.add(index, child)
    }

    node.addChild(childNode)


    invalidateView()
  }

  fun removeView(view: View) {
    val index = children.indexOfFirst { it.view == view }
    if (index != -1) {
      children.removeAt(index)
      node.removeChild(node.mason.nodeForView(view))
      invalidateView()
    }
  }

  private fun applySpans() {
    if (spannable.isEmpty()) {
      return
    }
    val start = 0
    val end = spannable.length
    if (start < end) {
      for ((_, span) in spans) {
        spannable.setSpan(span, start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
    }
  }

  override fun measure(
    knownDimensions: Size<Float?>, availableSpace: Size<Float?>
  ): Size<Float> {
    val layout = measureLayout(
      knownDimensions.width ?: Float.NaN, knownDimensions.height ?: Float.NaN,
      availableSpace.width ?: Float.NaN, availableSpace.height ?: Float.NaN,
    )
    val height = knownDimensions.height?.takeIf {
      !it.isNaN() && it >= 0
    } ?: layout?.height ?: 0

    return layout?.let {
      Size(it.width.toFloat(), height.toFloat())
    } ?: Size(0f, 0f)
  }
}
