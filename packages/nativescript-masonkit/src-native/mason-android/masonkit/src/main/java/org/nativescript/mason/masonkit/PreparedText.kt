package org.nativescript.mason.masonkit

import android.os.Build
import android.text.Layout
import android.text.TextPaint
import org.nativescript.mason.masonkit.Styles.TextWrap
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextAlign

/** Plain text laid out and drawn without a StaticLayout. */
object PreparedText {
  /**
   * Whether qualifying texts are prepared. Always false below Android 13 (API 33), which added the
   * Paint.getFontMetricsInt overload for a text range that preparing reads line metrics with.
   * Starts false when the `debug.mason.preparedtext` system property is `0`. Turning it off lays
   * every prepared text out again with a StaticLayout. Turning it on again prepares a qualifying
   * text the next time it changes.
   */
  @JvmStatic
  var enabled = supported && NativeHelpers.nativeSystemProperty("debug.mason.preparedtext") != "0"
    set(value) {
      val wasEnabled = field
      field = value && supported
      if (wasEnabled && !field) TextEngine.dropPreparedTexts()
    }

  private val supported: Boolean
    get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

  /** False when the platform has no NDK ICU4C. */
  internal fun prepare(
    node: Node,
    text: String,
    locale: String,
    advances: FloatArray,
    ascent: Int,
    descent: Int,
    lineHeight: Float,
    fixedLineHeight: Boolean,
    minLineHeight: Float,
    inline: Boolean,
    paragraph: PreparedParagraph,
  ): Boolean = nativePrepare(
    node.mason.nativePtr, node.nativePtr, text, locale, advances, ascent, descent, lineHeight, fixedLineHeight,
    minLineHeight, inline, paragraph.indentPx, paragraph.nowrap
  )

  internal fun clear(node: Node) = nativeClear(node.mason.nativePtr, node.nativePtr)

  internal fun lines(node: Node, width: Float): PreparedLines? =
    nativeLines(node.mason.nativePtr, node.nativePtr, width)?.let(::PreparedLines)

  @JvmStatic
  private external fun nativePrepare(
    mason: Long,
    node: Long,
    text: String,
    locale: String,
    advances: FloatArray,
    ascent: Int,
    descent: Int,
    lineHeight: Float,
    fixedLineHeight: Boolean,
    minLineHeight: Float,
    inline: Boolean,
    firstLineIndentPx: Int,
    nowrap: Boolean,
  ): Boolean

  @JvmStatic
  private external fun nativeClear(mason: Long, node: Long)

  @JvmStatic
  private external fun nativeLines(mason: Long, node: Long, width: Float): FloatArray?
}

internal data class PreparedParagraph(val alignment: Layout.Alignment, val indentPx: Int, val nowrap: Boolean) {
  val drawnAtViewWidth: Boolean
    get() = alignment != Layout.Alignment.ALIGN_NORMAL || indentPx != 0 || nowrap

  /**
   * Layout.drawText's line starts. It truncates an aligned line's extent to whole pixels, even
   * ones when centred. TextLine shapes the line alone, so a line broken inside a word loses its
   * kerning and the extent isn't a sum of the paragraph's advances.
   */
  fun lineLefts(lines: PreparedLines, text: String, paint: TextPaint, contentWidth: Int): FloatArray {
    val lefts = FloatArray(lines.lineCount)
    if (alignment == Layout.Alignment.ALIGN_NORMAL) {
      if (lefts.isNotEmpty()) lefts[0] = indentPx.toFloat()
      return lefts
    }
    val layoutWidth = if (nowrap) UNWRAPPED_LAYOUT_WIDTH else contentWidth
    for (i in lefts.indices) {
      val start = lines.lineStart(i)
      val end = lines.lineVisibleEnd(i)
      val extent = paint.getRunAdvance(text, start, end, start, end, false, end).toInt()
      val indentShift = if (i == 0) indentPx shr 1 else 0
      lefts[i] = when (alignment) {
        Layout.Alignment.ALIGN_CENTER -> ((layoutWidth - (extent and 1.inv())) shr 1) + indentShift
        else -> layoutWidth - extent
      }.toFloat()
    }
    return lefts
  }

  fun unconstrainedAlignmentShift(contentWidth: Int): Float {
    if (!nowrap || alignment == Layout.Alignment.ALIGN_NORMAL || contentWidth <= 0 || UNWRAPPED_LAYOUT_WIDTH <= contentWidth) {
      return 0f
    }
    val slack = (UNWRAPPED_LAYOUT_WIDTH - contentWidth).toFloat()
    return if (alignment == Layout.Alignment.ALIGN_OPPOSITE) -slack else -slack / 2f
  }

  companion object {
    fun preparableOrNull(engine: TextEngine, attributes: TextDefaultAttributes): PreparedParagraph? {
      val style = engine.style
      if (style.resolvedTextAlign == TextAlign.Justify) return null
      val whiteSpace = if (style.isValueInitialized) style.resolvedWhiteSpace else Styles.WhiteSpace.Normal
      if (whiteSpace != Styles.WhiteSpace.Normal && whiteSpace != Styles.WhiteSpace.NoWrap) return null
      val textWrap = style.resolvedTextWrap
      if (textWrap != TextWrap.Wrap && textWrap != TextWrap.NoWrap) return null
      val nowrap = style.isValueInitialized && (whiteSpace == Styles.WhiteSpace.NoWrap || textWrap == TextWrap.NoWrap)
      if (engine.percentTextIndent) return null
      val alignment = engine.getLayoutAlignment()
      // StaticLayout aligns by the text's AlignmentSpan; a one-line text's plain-String BoringLayout
      // has no spans and uses its own alignment.
      if (attributes.textAlign.let { it != null && it != alignment }) return null
      val indentPx = engine.textIndentPx(0f)
      if ((alignment != Layout.Alignment.ALIGN_NORMAL || indentPx != 0) && isFlexOrGridContainer(style)) return null
      return PreparedParagraph(alignment, indentPx, nowrap)
    }

    private const val UNWRAPPED_LAYOUT_WIDTH = 1_000_000

    private fun isFlexOrGridContainer(style: Style): Boolean = style.isValueInitialized && when (style.display) {
      Display.Flex, Display.InlineFlex, Display.Grid, Display.InlineGrid -> true
      else -> false
    }
  }
}

/** A text Rust measures, as of [version] of its engine's text, with the lines last drawn. */
internal class PreparedRun(
  private val node: Node,
  val text: String,
  val runStyle: Spans.RunStyleSpan?,
  val version: Int,
  val inline: Boolean,
  val paragraph: PreparedParagraph,
) {
  private var drawnWidth = Float.NaN
  private var drawn: DrawnLines? = null

  fun drawnLines(width: Float, contentWidth: Int, paint: TextPaint): DrawnLines? {
    if (width != drawnWidth) {
      drawn = PreparedText.lines(node, width)?.let {
        DrawnLines(it, paragraph.lineLefts(it, text, paint, contentWidth))
      }
      drawnWidth = width
    }
    return drawn
  }
}

internal class DrawnLines(val lines: PreparedLines, val lefts: FloatArray)

internal interface TextLines {
  val lineCount: Int
  fun lineStart(line: Int): Int
  fun lineEnd(line: Int): Int
  fun lineTop(line: Int): Int
  fun lineBaseline(line: Int): Int

  /** Layout.getLineForVertical: the last line whose top is at or above [y], else the first. */
  fun lineForVertical(y: Int): Int {
    var low = -1
    var high = lineCount
    while (high - low > 1) {
      val guess = (high + low) / 2
      if (lineTop(guess) > y) high = guess else low = guess
    }
    return maxOf(low, 0)
  }
}

/** Rust's line boxes for a prepared text, read in the order prepared_text.rs packs them. */
@JvmInline
internal value class PreparedLines(private val packed: FloatArray) : TextLines {
  override val lineCount: Int
    get() = packed.size / STRIDE

  override fun lineStart(line: Int) = packed[line * STRIDE + START].toInt()
  override fun lineEnd(line: Int) = packed[line * STRIDE + END].toInt()
  fun lineVisibleEnd(line: Int) = packed[line * STRIDE + VISIBLE_END].toInt()
  override fun lineBaseline(line: Int) = packed[line * STRIDE + BASELINE].toInt()
  override fun lineTop(line: Int) = lineBaseline(line) + lineAscent(line)
  fun lineWidth(line: Int) = packed[line * STRIDE + WIDTH]
  fun lineAscent(line: Int) = packed[line * STRIDE + ASCENT].toInt()
  fun lineDescent(line: Int) = packed[line * STRIDE + DESCENT].toInt()

  val height: Int
    get() = if (lineCount == 0) 0 else lineBaseline(lineCount - 1) + lineDescent(lineCount - 1)

  val widest: Float
    get() {
      var widest = 0f
      for (line in 0 until lineCount) widest = maxOf(widest, lineWidth(line))
      return widest
    }

  private companion object {
    const val START = 0
    const val END = 1
    const val VISIBLE_END = 2
    const val WIDTH = 3
    const val BASELINE = 4
    const val ASCENT = 5
    const val DESCENT = 6
    const val STRIDE = 7
  }
}
