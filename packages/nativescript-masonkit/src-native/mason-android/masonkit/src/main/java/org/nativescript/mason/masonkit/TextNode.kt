package org.nativescript.mason.masonkit

import android.graphics.Paint
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.TextPaint
import android.text.style.AlignmentSpan
import android.text.style.LineHeightSpan
import android.text.style.StrikethroughSpan
import android.text.style.UnderlineSpan


open class TextNode(mason: Mason) : Node(mason, 0, NodeType.Text), CharacterData {
  init {
    this.isPlaceholder = true
  }

  constructor(mason: Mason, data: String) : this(mason) {
    this.data = data
  }

  internal var container: TextContainer? = null

  override var data: String = ""
    set(value) {
      if (field == value) return
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
      fm: Paint.FontMetricsInt, scale: Float = 1f
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
  fun attributed(ignoreBackground: Boolean = false): SpannableStringBuilder {
    val processed = this.container?.let {
      processText(data, it.style)
    } ?: data
    val spannable = SpannableStringBuilder(processed)

    val previousBG = attributes.backgroundColor

    if (attributes.backgroundColor != null) {
      attributes.backgroundColor = null
    }

    // Apply attributes as spans
    applyAttributes(spannable, 0, spannable.length, attributes)

    if (ignoreBackground && previousBG != null) {
      attributes.backgroundColor = previousBG
    }

    return spannable
  }

  internal fun appendAttributedTo(target: SpannableStringBuilder) {
    val processed = this.container?.let {
      processText(data, it.style)
    } ?: data
    val start = target.length
    target.append(processed)
    val previousBG = attributes.backgroundColor
    attributes.backgroundColor = null
    applyAttributes(target, start, target.length, attributes)
    attributes.backgroundColor = previousBG
  }

  companion object {
    internal fun applyAttributes(
      spannable: SpannableStringBuilder,
      start: Int,
      end: Int,
      attributes: TextDefaultAttributes
    ) {
      if (start >= end) return

      val flags = Spannable.SPAN_EXCLUSIVE_EXCLUSIVE

      val setColor = attributes.color.let { it != null && it != 0 }
      val measureSize = attributes.fontSize?.takeIf { it > 0 }
      val letterSpacing = attributes.letterSpacing?.takeIf { it != 0f }
      val fontFace = attributes.font
      val typeface = fontFace?.resolvedTypeface
      if (setColor || measureSize != null || letterSpacing != null || typeface != null) {
        spannable.setSpan(
          Spans.RunStyleSpan(
            attributes,
            setColor,
            measureSize,
            letterSpacing,
            typeface,
            isBold = typeface != null && fontFace.weight.weight >= 600,
            isItalic = typeface != null && fontFace.style != org.nativescript.fontmanager.FontStyle.Normal
          ),
          start, end, flags
        )
      }

      // Resolve line-height to absolute (multiplier * font-size) + idempotent
      // FixedLineHeightSpan; RelativeLineHeightSpan compounds on repeated
      // chooseHeight() calls into an exponential blowup.
      attributes.lineHeight?.let { lineHeight ->
        val type = attributes.lineHeightType ?: 0
        lineHeight.takeIf { it > 0 }?.let {
          if (type == StyleState.SET) {
            spannable.setSpan(FixedLineHeightSpan(it.toInt()), start, end, flags)
          } else {
            val fontSizeDip = (attributes.fontSize?.takeIf { fs -> fs > 0 }
              ?: Constants.DEFAULT_FONT_SIZE).toFloat()
            val absolute = (it * fontSizeDip).toInt()
            if (absolute > 0) {
              spannable.setSpan(FixedLineHeightSpan(absolute), start, end, flags)
            }
          }
        }
      }

      // Apply decoration
      attributes.decorationLine?.takeIf { it != Styles.DecorationLine.None }?.let { decoration ->
        spannable.setSpan(
          Spans.DecorationSpan(
            decoration,
            attributes.decorationColor ?: Constants.UNSET_COLOR.toInt(),
            attributes.decorationStyle ?: Styles.DecorationStyle.Solid,
            attributes.decorationThickness ?: 0f
          ), start, end, flags
        )
      }

      // Apply textAlignment
      attributes.textAlign?.let { align ->
        spannable.setSpan(AlignmentSpan.Standard(align), start, end, flags)
      }
      // Apply backgroundColor only when alpha is non-zero (ARGB format: alpha in high 8 bits)
      attributes.backgroundColor?.let { color ->
        if (color != 0 && ((color shr 24) and 0xFF) != 0) {
          spannable.setSpan(Spans.BackgroundColorSpan(attributes), start, end, flags)
        }
      }

      // Apply textShadow
      attributes.textShadow?.let { shadows ->
        if (shadows.isNotEmpty()) {
          for (shadow in shadows) {
            if (shadow.blurRadius > 0) {
              spannable.setSpan(
                Spans.BlurredTextShadowSpan(
                  shadow.offsetX, shadow.offsetY, shadow.blurRadius, shadow.color
                ), start, end, flags
              )
            } else {
              spannable.setSpan(
                Spans.TextShadowSpan(
                  shadow.offsetX, shadow.offsetY, shadow.color
                ), start, end, flags
              )
            }

          }
        }
      }

    }

    internal fun processText(text: String, style: Style): String {
      var processed = text

      // Apply text transform
      processed = when (style.textTransform) {
        Styles.TextTransform.None -> processed
        Styles.TextTransform.Capitalize -> processed.split(" ").joinToString(" ") {
          it.replaceFirstChar { c -> if (c.isLowerCase()) c.titlecase() else c.toString() }
        }

        Styles.TextTransform.Uppercase -> processed.uppercase()
        Styles.TextTransform.Lowercase -> processed.lowercase()
        else -> processed
      }

      // Apply whitespace processing
      processed = when (style.whiteSpace) {
        Styles.WhiteSpace.Normal, Styles.WhiteSpace.NoWrap -> {
          // Collapse sequences of whitespace
          collapseWhitespace(normalizeNewlines(processed), collapseNewlines = true)
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
      if (s.indexOf('\r') < 0) return s
      return s.replace("\r\n", "\n").replace("\r", "\n")
    }

    private fun processPreLine(s: String): String {
      return s.split("\n").joinToString("\n") { line ->
        collapseWhitespace(line, collapseNewlines = false)
      }
    }

    private fun isCollapsible(c: Char, collapseNewlines: Boolean): Boolean =
      c == ' ' || c == '\t' || c == '\u000B' || c == '\u000C' || (collapseNewlines && c == '\n')

    private fun collapseWhitespace(s: String, collapseNewlines: Boolean): String {
      var i = 0
      while (i < s.length) {
        val c = s[i]
        if (isCollapsible(c, collapseNewlines) &&
          (c != ' ' || (i + 1 < s.length && isCollapsible(s[i + 1], collapseNewlines)))
        ) break
        i++
      }
      if (i == s.length) return s
      val sb = StringBuilder(s.length).append(s, 0, i)
      var inRun = false
      while (i < s.length) {
        val c = s[i]
        if (isCollapsible(c, collapseNewlines)) {
          if (!inRun) sb.append(' ')
          inRun = true
        } else {
          sb.append(c)
          inRun = false
        }
        i++
      }
      return sb.toString()
    }
  }
}
