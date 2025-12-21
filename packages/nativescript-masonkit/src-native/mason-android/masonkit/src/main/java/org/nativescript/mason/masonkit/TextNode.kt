package org.nativescript.mason.masonkit

import android.graphics.Paint
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.TextPaint
import android.text.style.AbsoluteSizeSpan
import android.text.style.AlignmentSpan
import android.text.style.ForegroundColorSpan
import android.text.style.LineHeightSpan
import android.text.style.StrikethroughSpan
import android.text.style.UnderlineSpan


class TextNode(mason: Mason) : Node(mason, 0, NodeType.Text), CharacterData {
  constructor(mason: Mason, data: String) : this(mason) {
    this.data = data
  }

  internal var container: TextContainer? = null

  override var data: String = ""
    set(value) {
      field = value
      // Invalidate the container when text changes
      container?.engine?.invalidateInlineSegments()
    }

  override var layoutParent: Node?
    get() {
      return container?.node
    }
    set(value) {}

  override val length: Int
    get() = data.length

  override fun substringData(offset: Int, count: Int): String {
    if (offset < 0 || offset > data.length || count < 0) {
      throw IndexOutOfBoundsException("offset: $offset, count: $count, length: ${data.length}")
    }
    val end = (offset + count).coerceAtMost(data.length)
    return data.substring(offset, end)
  }

  override fun appendData(data: String): CharacterData {
    this.data += data
    return this
  }

  override fun insertData(offset: Int, data: String): CharacterData {
    if (offset < 0 || offset > this.data.length) {
      throw IndexOutOfBoundsException("offset: $offset, length: ${this.data.length}")
    }
    this.data = this.data.substring(0, offset) + data + this.data.substring(offset)
    return this
  }

  override fun deleteData(offset: Int, count: Int): CharacterData {
    if (offset < 0 || offset > data.length || count < 0) {
      throw IndexOutOfBoundsException("offset: $offset, count: $count, length: ${data.length}")
    }
    val end = (offset + count).coerceAtMost(data.length)
    this.data = data.substring(0, offset) + data.substring(end)
    return this
  }

  override fun replaceData(offset: Int, count: Int, data: String): CharacterData {
    if (offset < 0 || offset > this.data.length || count < 0) {
      throw IndexOutOfBoundsException("offset: $offset, count: $count, length: ${this.data.length}")
    }
    val end = (offset + count).coerceAtMost(this.data.length)
    this.data = this.data.substring(0, offset) + data + this.data.substring(end)
    return this
  }

  class FixedLineHeightSpan(private val heightDip: Int) : LineHeightSpan.WithDensity {

    private fun choose(
      fm: Paint.FontMetricsInt,
      scale: Float = 1f
    ) {
      val originalHeight = fm.descent - fm.ascent
      if (originalHeight <= 0) return

      val diff = (heightDip * scale).toInt() - originalHeight
      if (diff == 0) return

      val half = diff / 2
      fm.ascent -= half
      fm.descent += (diff - half)
      fm.top = fm.ascent
      fm.bottom = fm.descent
    }

    override fun chooseHeight(
      text: CharSequence?,
      start: Int,
      end: Int,
      spanstartv: Int,
      lineHeight: Int,
      fm: Paint.FontMetricsInt?,
      paint: TextPaint?
    ) {
      fm?.let {
        choose(it, paint?.density ?: 1f)
      }
    }


    override fun chooseHeight(
      text: CharSequence?,
      start: Int,
      end: Int,
      spanstartv: Int,
      lineHeight: Int,
      fm: Paint.FontMetricsInt?
    ) {
      fm?.let {
        choose(it)
      }
    }
  }

  class RelativeLineHeightSpan(private val multiplier: Float) : LineHeightSpan {

    override fun chooseHeight(
      text: CharSequence?,
      start: Int,
      end: Int,
      spanstartv: Int,
      lineHeight: Int,
      fm: Paint.FontMetricsInt?
    ) {
      fm?.let { fm ->
        val originalHeight = fm.descent - fm.ascent
        if (originalHeight <= 0) return

        val targetHeight = (originalHeight * multiplier).toInt()
        val diff = targetHeight - originalHeight
        if (diff == 0) return

        val half = diff / 2
        fm.ascent -= half
        fm.descent += (diff - half)
        fm.top = fm.ascent
        fm.bottom = fm.descent
      }
    }
  }

  // Build attributed string from this text node's data and attributes
  fun attributed(): SpannableStringBuilder {
    val processed = processText(data)
    val spannable = SpannableStringBuilder(processed)

    // Apply attributes as spans
    applyAttributes(spannable, 0, spannable.length)

    return spannable
  }

  private fun applyAttributes(spannable: SpannableStringBuilder, start: Int, end: Int) {
    if (start >= end) return

    val flags = Spannable.SPAN_EXCLUSIVE_EXCLUSIVE

    // Apply color
    attributes.color?.let { color ->
      if (color != 0) {
        spannable.setSpan(ForegroundColorSpan(color), start, end, flags)
      }
    }

    // Apply font size
    attributes.fontSize?.let { size ->
      var fontSize: Int? = null
      when (size) {
        is Int -> {
          fontSize = size
        }

        is Float -> {
          fontSize = size.toInt()
        }
      }
      fontSize?.takeIf { it > 0 }?.let {
        spannable.setSpan(AbsoluteSizeSpan(it, true), start, end, flags)
      }
    }

    // Apply letter spacing
    attributes.letterSpacing?.takeIf { it > 0 }?.let { spacing ->
      spannable.setSpan(
        android.text.style.ScaleXSpan(1f + spacing), start, end, flags
      )
    }

    // Apply line height
    attributes.lineHeight?.let { lineHeight ->
      val type = attributes.lineHeightType ?: 0
      lineHeight.takeIf { it > 0 }?.let {
        // 1 px/dip
        if (type == StyleState.SET) {
          spannable.setSpan(FixedLineHeightSpan(it.toInt()), start, end, flags)
        } else {
          spannable.setSpan(RelativeLineHeightSpan(it), start, end, flags)
        }
      }
    }

    // Apply typeface
    attributes.font?.font.let { typeface ->
      if (typeface is android.graphics.Typeface) {
        spannable.setSpan(Spans.TypefaceSpan(typeface), start, end, flags)
      }
    }

    // Apply decoration
    attributes.decorationLine?.let { decoration ->
      when (decoration) {
        Styles.DecorationLine.Underline -> {
          spannable.setSpan(UnderlineSpan(), start, end, flags)
        }

        Styles.DecorationLine.LineThrough -> {
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        Styles.DecorationLine.Overline -> {
          /*
          spannable.setSpan(
            OverlineSpan(
              attributes.decorationColor ?: Color.BLACK,
              attributes.decorationThickness ?: (1f * Mason.shared.scale)
            ), start, end, flags
          )*/
        }

        Styles.DecorationLine.UnderlineLineThrough -> {
          spannable.setSpan(UnderlineSpan(), start, end, flags)
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        Styles.DecorationLine.UnderlineOverline -> {}
        Styles.DecorationLine.OverlineUnderlineLineThrough -> {}
        else -> {}
      }
    }

    // Apply textAlignment
    attributes.textAlign?.let { align ->
      spannable.setSpan(AlignmentSpan.Standard(align), start, end, flags)
    }
    // Apply backgroundColor
    attributes.backgroundColor?.let { color ->
      if (color != 0) {
        spannable.setSpan(Spans.BackgroundColorSpan(color), start, end, flags)
      }
    }

    // Apply textShadow
    attributes.textShadow?.let { shadows ->
      if (shadows.isNotEmpty()) {
        for (shadow in shadows) {
          if (shadow.blurRadius > 0) {
            spannable.setSpan(
              Spans.BlurredTextShadowSpan(
                shadow.offsetX,
                shadow.offsetY,
                shadow.blurRadius,
                shadow.color
              ), start, end, flags
            )
          } else {
            spannable.setSpan(
              Spans.TextShadowSpan(
                shadow.offsetX,
                shadow.offsetY,
                shadow.color
              ), start, end, flags
            )
          }

        }
      }
    }

  }

  private fun processText(text: String): String {
    val container = this.container ?: return text
    var processed = text

    // Apply text transform
    processed = when (container.style.textTransform) {
      Styles.TextTransform.None -> processed
      Styles.TextTransform.Capitalize -> processed.split(" ").joinToString(" ") {
        it.replaceFirstChar { c -> if (c.isLowerCase()) c.titlecase() else c.toString() }
      }

      Styles.TextTransform.Uppercase -> processed.uppercase()
      Styles.TextTransform.Lowercase -> processed.lowercase()
      else -> processed
    }

    // Apply whitespace processing
    processed = when (container.style.whiteSpace) {
      Styles.WhiteSpace.Normal, Styles.WhiteSpace.NoWrap -> {
        // Collapse sequences of whitespace
        normalizeNewlines(processed).replace(Regex("[ \t\u000B\u000C\n]+"), " ")
      }

      Styles.WhiteSpace.Pre -> {
        // Preserve all whitespace
        processed
      }

      Styles.WhiteSpace.PreWrap -> {
        // Preserve whitespace sequences and newlines
        normalizeNewlines(processed)
      }

      Styles.WhiteSpace.PreLine -> {
        // Collapse whitespace, preserve newlines
        processPreLine(normalizeNewlines(processed))
      }

      Styles.WhiteSpace.BreakSpaces -> {
        // Like pre-wrap but break at any whitespace
        normalizeNewlines(processed)
      }

    }

    return processed
  }

  private fun normalizeNewlines(s: String): String {
    return s.replace("\r\n", "\n").replace("\r", "\n")
  }

  private fun processPreLine(s: String): String {
    return s.split("\n").joinToString("\n") { line ->
      line.replace(Regex("[ \t\u000B\u000C]+"), " ")
    }
  }
}
