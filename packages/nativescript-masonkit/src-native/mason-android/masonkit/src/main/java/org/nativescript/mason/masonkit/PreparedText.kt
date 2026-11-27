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
    minLineHeight, inline, paragraph.alignment.ordinal, paragraph.indentPx, paragraph.nowrap,
    paragraph.centersVertically
  )

  internal fun clear(node: Node) = nativeClear(node.mason.nativePtr, node.nativePtr)

  internal fun lines(node: Node, contentWidth: Float, viewWidth: Int, widthFromParent: Boolean): PreparedLines? =
    nativeLines(node.mason.nativePtr, node.nativePtr, contentWidth, viewWidth, widthFromParent)?.let(::PreparedLines)

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
    alignment: Int,
    firstLineIndentPx: Int,
    nowrap: Boolean,
    centersVertically: Boolean,
  ): Boolean

  @JvmStatic
  private external fun nativeClear(mason: Long, node: Long)

  @JvmStatic
  private external fun nativeLines(
    mason: Long,
    node: Long,
    contentWidth: Float,
    viewWidth: Int,
    widthFromParent: Boolean,
  ): FloatArray?
}

internal data class PreparedParagraph(
  val alignment: Layout.Alignment,
  val indentPx: Int,
  val nowrap: Boolean,
  val centersVertically: Boolean,
) {
  /**
   * Layout.drawText's line starts. It truncates an aligned line's extent to whole pixels, even
   * ones when centred. TextLine shapes the line alone, so a line broken inside a word loses its
   * kerning and the extent isn't a sum of the paragraph's advances.
   */
  fun lineLefts(lines: PreparedLines, text: String, paint: TextPaint): FloatArray {
    val lefts = FloatArray(lines.lineCount)
    if (alignment == Layout.Alignment.ALIGN_NORMAL) {
      if (lefts.isNotEmpty()) lefts[0] = indentPx.toFloat()
      return lefts
    }
    for (i in lefts.indices) {
      val start = lines.lineStart(i)
      val end = lines.lineVisibleEnd(i)
      val extent = paint.getRunAdvance(text, start, end, start, end, false, end).toInt()
      val indentShift = if (i == 0) indentPx shr 1 else 0
      lefts[i] = when (alignment) {
        Layout.Alignment.ALIGN_CENTER -> ((lines.layoutWidth - (extent and 1.inv())) shr 1) + indentShift
        else -> lines.layoutWidth - extent
      }.toFloat()
    }
    return lefts
  }

  fun unconstrainedAlignmentShift(layoutWidth: Int, contentWidth: Int): Float {
    if (!nowrap || alignment == Layout.Alignment.ALIGN_NORMAL || contentWidth <= 0 || layoutWidth <= contentWidth) return 0f
    val slack = (layoutWidth - contentWidth).toFloat()
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
      val centersVertically = (engine.container as? TextView)?.centersVertically == true
      return PreparedParagraph(alignment, indentPx, nowrap, centersVertically)
    }

    private fun isFlexOrGridContainer(style: Style): Boolean = style.isValueInitialized && when (style.display) {
      Display.Flex, Display.InlineFlex, Display.Grid, Display.InlineGrid -> true
      else -> false
    }
  }
}

/** A text Rust measures, as of [version] of its engine's text, with the lines last drawn. */
internal class PreparedRun(
  private val engine: TextEngine,
  val text: String,
  val runStyle: Spans.RunStyleSpan?,
  val version: Int,
  val inline: Boolean,
  val paragraph: PreparedParagraph,
) {
  private var drawnContentWidth = Float.NaN
  private var drawnViewWidth = 0
  private var drawn: DrawnLines? = null

  fun drawnLines(contentWidth: Float, viewWidth: Int, paint: TextPaint): DrawnLines? {
    if (contentWidth != drawnContentWidth || viewWidth != drawnViewWidth) {
      val widthFromParent = paragraph.alignment != Layout.Alignment.ALIGN_NORMAL && engine.widthFromParent()
      drawn = PreparedText.lines(engine.node, contentWidth, viewWidth, widthFromParent)?.let {
        DrawnLines(it, paragraph.lineLefts(it, text, paint))
      }
      drawnContentWidth = contentWidth
      drawnViewWidth = viewWidth
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

/** Rust's line boxes for a prepared text after their layout's width, in the order prepared_text.rs packs them. */
@JvmInline
internal value class PreparedLines(private val packed: FloatArray) : TextLines {
  val layoutWidth: Int
    get() = packed[0].toInt()

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
    const val START = 1
    const val END = 2
    const val VISIBLE_END = 3
    const val WIDTH = 4
    const val BASELINE = 5
    const val ASCENT = 6
    const val DESCENT = 7
    const val STRIDE = 7
  }
}
