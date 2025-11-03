package org.nativescript.mason.masonkit

import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.style.AbsoluteSizeSpan
import android.text.style.ForegroundColorSpan
import android.text.style.StrikethroughSpan
import android.text.style.UnderlineSpan
import android.util.Log

class TextNode(mason: Mason) : Node(mason, 0, NodeType.Text), CharacterData {
  constructor(mason: Mason, data: String) : this(mason) {
    this.data = data
  }

  internal var container: TextView? = null

  internal var attributes: MutableMap<String, Any> = mutableMapOf()

  override var data: String = ""
    set(value) {
      field = value
      // Invalidate the container when text changes
      container?.invalidateInlineSegments()
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
    attributes["color"]?.let { color ->
      if (color is Int && color != 0) {
        spannable.setSpan(ForegroundColorSpan(color), start, end, flags)
      }
    }

    // Apply font size
    attributes["fontSize"]?.let { size ->
      if (size is Float && size > 0) {
        spannable.setSpan(AbsoluteSizeSpan(size.toInt(), true), start, end, flags)
      }
    }

    // Apply typeface
    attributes["typeface"]?.let { typeface ->
      if (typeface is android.graphics.Typeface) {
        spannable.setSpan(Spans.TypefaceSpan(typeface), start, end, flags)
      }
    }

    // Apply decoration
    attributes["decorationLine"]?.let { decoration ->
      when (decoration) {
        Styles.DecorationLine.Underline -> {
          spannable.setSpan(UnderlineSpan(), start, end, flags)
        }

        Styles.DecorationLine.LineThrough -> {
          spannable.setSpan(StrikethroughSpan(), start, end, flags)
        }

        else -> {}
      }
    }

    // Apply backgroundColor
    attributes["backgroundColor"]?.let { color ->
      if (color is Int && color != 0) {
        spannable.setSpan(Spans.BackgroundColorSpan(color), start, end, flags)
      }
    }
  }

  private fun processText(text: String): String {
    val container = this.container ?: return text
    var processed = text

    // Apply text transform
    processed = when (container.textTransform) {
      Styles.TextTransform.None -> processed
      Styles.TextTransform.Capitalize -> processed.split(" ").joinToString(" ") {
        it.replaceFirstChar { c -> if (c.isLowerCase()) c.titlecase() else c.toString() }
      }

      Styles.TextTransform.Uppercase -> processed.uppercase()
      Styles.TextTransform.Lowercase -> processed.lowercase()
      else -> processed
    }

    // Apply whitespace processing
    processed = when (container.whiteSpace) {
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
