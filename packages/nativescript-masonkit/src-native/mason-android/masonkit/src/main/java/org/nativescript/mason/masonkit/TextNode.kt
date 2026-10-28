package org.nativescript.mason.masonkit

import android.graphics.Paint
import kotlin.math.abs
import kotlin.math.roundToInt
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.TextUtils
import android.text.Spanned
import android.text.TextPaint
import android.text.style.AlignmentSpan
import android.text.style.LineHeightSpan
import android.text.style.MetricAffectingSpan
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

  /**
   * Text set through [TextView.text], shown as given (no whitespace collapsing) with its own
   * spans drawn over the node's style, as a platform TextView shows it.
   */
  internal var verbatim: CharSequence? = null

  override var data: String = ""
    set(value) {
      if (field == value) return
      field = value
      verbatim = null
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

  /** Rounds each line's bottom rather than its height, so fractions don't add up across lines. */
  internal class LineBoxes {
    private var lastTop = -1
    private var lastBase = 0f
    private var lastBottom = 0f
    private var boxLineTop = NO_LINE

    /** Whether the line being chosen comes right after one that held an inline box. */
    var afterBoxLine = false
      private set

    /**
     * The inline boxes on the line [start, end). StaticLayout starts a line that breaks inside a
     * text run from the metrics the line before it ended with, so when that line was grown for a
     * box, [afterBoxLine] says the incoming metrics are the box's rather than this line's. Every
     * line-height span of a paragraph sees each of its lines, so this span's history is complete.
     */
    fun inlineBoxes(text: CharSequence?, start: Int, end: Int, spanstartv: Int, v: Int): LineScan {
      val top = v - spanstartv
      if (top <= 0) {
        // The first line of the paragraph this span starts in: no line of its own came before.
        afterBoxLine = false
        boxLineTop = NO_LINE
      } else if (top != lastTop) {
        afterBoxLine = lastTop == boxLineTop && startsInsideRun(text, start, end)
      }
      val line = LineScan.of(text, start, end)
      if (line.hasBoxes) boxLineTop = top
      return line
    }

    // StaticLayout splits a paragraph into runs at MetricAffectingSpan edges; a paragraph starts fresh.
    private fun startsInsideRun(text: CharSequence?, start: Int, end: Int): Boolean {
      val spanned = text as? Spanned ?: return false
      if (start <= 0 || text[start - 1] == '\n') return false
      return spanned.nextSpanTransition(start - 1, end, MetricAffectingSpan::class.java) != start
    }

    fun apply(fm: Paint.FontMetricsInt, spanstartv: Int, v: Int, height: Float) {
      val top = v - spanstartv
      val base = when {
        top <= 0 -> 0f
        // chooseHeight can run twice for one line.
        top == lastTop -> lastBase
        abs(lastBottom - top) < 1f -> lastBottom
        else -> top.toFloat()
      }
      val bottom = base + height
      lastTop = top
      lastBase = base
      lastBottom = bottom
      val diff = (bottom.roundToInt() - top) - (fm.descent - fm.ascent)
      if (diff == 0) return
      val half = diff / 2
      fm.ascent -= half
      fm.descent += (diff - half)
      fm.top = fm.ascent
      fm.bottom = fm.descent
    }

    private companion object {
      const val NO_LINE = Int.MIN_VALUE
    }
  }

  /**
   * One line's inline boxes and own metrics. Every line-height span of a paragraph is asked about
   * each line in turn, so the line is scanned once and the result shared, per thread.
   */
  internal class LineScan {
    private var text: CharSequence? = null
    private var start = -1
    private var end = -1
    private var generation = -1
    private var metricsPaint: TextPaint? = null
    private val metrics = Paint.FontMetricsInt()
    private val runPaint = TextPaint()
    private val runMetrics = Paint.FontMetricsInt()

    var hasBoxes = false
      private set

    /** The union of the line's boxes' extents above (negative) and below the baseline. */
    var boxAscent = 0
      private set
    var boxDescent = 0
      private set

    /** Sets [out] to the line's own metrics, as StaticLayout measures each text run, grown to fit its boxes. */
    fun lineMetrics(paint: TextPaint, out: Paint.FontMetricsInt) {
      if (metricsPaint !== paint) {
        metricsPaint = paint
        measure(paint)
      }
      out.ascent = metrics.ascent
      out.descent = metrics.descent
      out.top = metrics.ascent
      out.bottom = metrics.descent
    }

    private fun measure(paint: TextPaint) {
      metrics.ascent = 0
      metrics.descent = 0
      val spanned = text as? Spanned
      var i = start
      while (i < end) {
        val next = spanned?.nextSpanTransition(i, end, MetricAffectingSpan::class.java) ?: end
        val spans = spanned?.getSpans(i, next, MetricAffectingSpan::class.java)
        // Boxes are added below; StaticLayout measures any other run, replaced or not, by its font.
        if (spans == null || spans.none { it is InlineBox }) {
          runPaint.set(paint)
          spans?.forEach { it.updateMeasureState(runPaint) }
          runPaint.getFontMetricsInt(runMetrics)
          metrics.ascent = minOf(metrics.ascent, runMetrics.ascent)
          metrics.descent = maxOf(metrics.descent, runMetrics.descent)
        }
        i = next
      }
      if (metrics.descent - metrics.ascent <= 0) paint.getFontMetricsInt(metrics)
      if (hasBoxes) {
        metrics.ascent = minOf(metrics.ascent, boxAscent)
        metrics.descent = maxOf(metrics.descent, boxDescent)
      }
    }

    private fun scan(text: CharSequence?, start: Int, end: Int) {
      this.text = text
      this.start = start
      this.end = end
      generation = measuredGeneration
      metricsPaint = null
      hasBoxes = false
      boxAscent = 0
      boxDescent = 0
      val spanned = text as? Spanned ?: return
      for (box in spanned.getSpans(start, end, InlineBox::class.java)) {
        hasBoxes = true
        boxAscent = minOf(boxAscent, box.ascent)
        boxDescent = maxOf(boxDescent, box.descent)
      }
    }

    companion object {
      // Bumped whenever an inline box measures itself, so a resized box is never read from a stale scan.
      @JvmStatic
      var measuredGeneration = 0

      private val current = object : ThreadLocal<LineScan>() {
        override fun initialValue() = LineScan()
      }

      fun of(text: CharSequence?, start: Int, end: Int): LineScan {
        val line = current.get()!!
        if (line.text !== text || line.start != start || line.end != end || line.generation != measuredGeneration) {
          line.scan(text, start, end)
        }
        return line
      }
    }
  }

  /** An inline box's extent above (negative) and below the baseline, as its span last measured it. */
  internal interface InlineBox {
    val ascent: Int
    val descent: Int
  }

  class FixedLineHeightSpan(private val heightDip: Float) : LineHeightSpan.WithDensity {
    private val boxes = LineBoxes()

    override fun chooseHeight(
      text: CharSequence?,
      start: Int,
      end: Int,
      spanstartv: Int,
      lineHeight: Int,
      fm: Paint.FontMetricsInt?,
      paint: TextPaint?
    ) {
      val m = fm ?: return
      if (m.descent - m.ascent <= 0) return
      val height = heightDip * (paint?.density ?: 1f)
      val line = boxes.inlineBoxes(text, start, end, spanstartv, lineHeight)
      // line-height sizes the text: the container's strut on a box's line, the line's own text after one.
      if (paint != null && line.hasBoxes) paint.getFontMetricsInt(m)
      else if (paint != null && boxes.afterBoxLine) line.lineMetrics(paint, m)
      boxes.apply(m, spanstartv, lineHeight, height)
      if (!line.hasBoxes) return
      // An inline box taller than the strut grows the line (CSS 2.1 10.8).
      m.ascent = minOf(m.ascent, line.boxAscent)
      m.descent = maxOf(m.descent, line.boxDescent)
      m.top = m.ascent
      m.bottom = m.descent
    }

    override fun chooseHeight(
      text: CharSequence?,
      start: Int,
      end: Int,
      spanstartv: Int,
      lineHeight: Int,
      fm: Paint.FontMetricsInt?
    ) {
      fm?.let { if (it.descent - it.ascent > 0) boxes.apply(it, spanstartv, lineHeight, heightDip) }
    }
  }

  /** line-height: normal: a single-font line gets its exact ascent + descent; mixed fonts keep StaticLayout's height. */
  class NormalLineHeightSpan(private val fontSizeDip: Float, private val typeface: android.graphics.Typeface?) :
    LineHeightSpan.WithDensity {
    private val boxes = LineBoxes()
    private var density = 0f
    private var exact = 0f
    private var intAscent = 0
    private var intDescent = 0

    private fun resolve(paint: TextPaint) {
      if (paint.density == density && exact > 0f) return
      val p = TextPaint().apply {
        set(paint)
        textSize = fontSizeDip * paint.density
        this@NormalLineHeightSpan.typeface?.let { typeface = it }
      }
      val f = p.fontMetrics
      val i = p.fontMetricsInt
      density = paint.density
      exact = f.descent - f.ascent
      intAscent = i.ascent
      intDescent = i.descent
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
      val m = fm ?: return
      if (m.descent - m.ascent <= 0 || fontSizeDip <= 0f || paint == null) return
      resolve(paint)
      val line = boxes.inlineBoxes(text, start, end, spanstartv, lineHeight)
      if (boxes.afterBoxLine) line.lineMetrics(paint, m)
      val own = m.descent - m.ascent
      val height = if (m.ascent == intAscent && m.descent == intDescent) exact else own.toFloat()
      boxes.apply(m, spanstartv, lineHeight, height)
    }

    override fun chooseHeight(
      text: CharSequence?,
      start: Int,
      end: Int,
      spanstartv: Int,
      lineHeight: Int,
      fm: Paint.FontMetricsInt?
    ) {}
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
    verbatim?.let { text ->
      val start = target.length
      target.append(text.toString())
      val previousBG = attributes.backgroundColor
      attributes.backgroundColor = null
      applyAttributes(target, start, target.length, attributes)
      attributes.backgroundColor = previousBG
      // Applied after the node's own style, so its spans win, as they would on a TextView.
      if (text is Spanned) TextUtils.copySpansFrom(text, 0, text.length, null, target, start)
      return
    }
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
    // Shared by the text spans and the Input placeholder, so their faces cannot drift apart.
    internal fun isBold(face: org.nativescript.fontmanager.FontFace) = face.weight.weight >= 600

    internal fun isItalic(face: org.nativescript.fontmanager.FontFace) =
      face.style != org.nativescript.fontmanager.FontStyle.Normal

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
            isBold = typeface != null && isBold(fontFace),
            isItalic = typeface != null && isItalic(fontFace)
          ),
          start, end, flags
        )
      }

      // Resolve line-height to absolute (multiplier * font-size) + idempotent
      // FixedLineHeightSpan; RelativeLineHeightSpan compounds on repeated
      // chooseHeight() calls into an exponential blowup.
      val lineHeight = attributes.lineHeight?.takeIf { it > 0 }
      if (lineHeight == null) {
        val fontSizeDip = (attributes.fontSize?.takeIf { it > 0 } ?: Constants.DEFAULT_FONT_SIZE).toFloat()
        spannable.setSpan(NormalLineHeightSpan(fontSizeDip, typeface), start, end, flags)
      } else {
        val type = attributes.lineHeightType ?: 0
        lineHeight.let {
          if (type == StyleState.SET) {
            spannable.setSpan(FixedLineHeightSpan(it), start, end, flags)
          } else {
            val fontSizeDip = (attributes.fontSize?.takeIf { fs -> fs > 0 }
              ?: Constants.DEFAULT_FONT_SIZE).toFloat()
            val absolute = it * fontSizeDip
            if (absolute > 0f) {
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
      processed = when (style.resolvedTextTransform) {
        Styles.TextTransform.None -> processed
        Styles.TextTransform.Capitalize -> processed.split(" ").joinToString(" ") {
          it.replaceFirstChar { c -> if (c.isLowerCase()) c.titlecase() else c.toString() }
        }

        Styles.TextTransform.Uppercase -> processed.uppercase()
        Styles.TextTransform.Lowercase -> processed.lowercase()
        else -> processed
      }

      // Apply whitespace processing
      processed = when (style.resolvedWhiteSpace) {
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
