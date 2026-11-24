package org.nativescript.mason.masonkit

import android.os.Build

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
    minLineHeight: Float,
    inline: Boolean,
  ): Boolean = nativePrepare(
    node.mason.nativePtr, node.nativePtr, text, locale, advances, ascent, descent, lineHeight, minLineHeight, inline
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
    minLineHeight: Float,
    inline: Boolean,
  ): Boolean

  @JvmStatic
  private external fun nativeClear(mason: Long, node: Long)

  @JvmStatic
  private external fun nativeLines(mason: Long, node: Long, width: Float): FloatArray?
}

/** A text Rust measures, as of [version] of its engine's text, with the lines last drawn. */
internal class PreparedRun(
  private val node: Node,
  val text: String,
  val runStyle: Spans.RunStyleSpan?,
  val version: Int,
  val inline: Boolean,
) {
  private var linesWidth = Float.NaN
  private var lines: PreparedLines? = null

  fun lines(width: Float): PreparedLines? {
    if (width != linesWidth) {
      lines = PreparedText.lines(node, width)
      linesWidth = width
    }
    return lines
  }
}

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
    const val WIDTH = 2
    const val BASELINE = 3
    const val ASCENT = 4
    const val DESCENT = 5
    const val STRIDE = 6
  }
}
