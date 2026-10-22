package org.nativescript.mason.masonkit

import android.text.Layout
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.MetricAffectingSpan

// text-spacing-trim: full-width punctuation gives up its blank half next to other punctuation
// (every value but space-all), at the start of a line (trim-start, space-first past the first
// line, trim-both), at the end of a line (trim-both, else a closing bracket when that lets it
// fit, as Chrome does) or everywhere (trim-all). Minikin shapes every font of a run with the
// paint's features, so a trimmed mark takes the font's half-width alternate ('halt'); an
// upright cell in vertical text is halved instead (see VerticalText.kt). The same classes and
// rules are in iOS SpacingTrim.swift and Windows SpacingTrim.h.

internal const val PUNCTUATION_OPENING = 1
internal const val PUNCTUATION_CLOSING = 2
internal const val PUNCTUATION_MIDDLE = 3

// text-spacing-trim as stored: 0 normal, 1 space-all, 2 space-first, 3 trim-start, 4 trim-both,
// 5 trim-all, 6 auto (as normal).
internal const val SPACING_TRIM_SPACE_ALL = 1
internal const val SPACING_TRIM_SPACE_FIRST = 2
internal const val SPACING_TRIM_START = 3
internal const val SPACING_TRIM_BOTH = 4
internal const val SPACING_TRIM_ALL = 5
private const val SPACING_TRIM_AUTO = 6

/** The full-width punctuation class of [c], or 0. */
internal fun fullWidthPunctuation(c: Char): Int = when (c.code) {
  0x3008, 0x300A, 0x300C, 0x300E, 0x3010, 0x3014, 0x3016, 0x3018, 0x301A, 0x301D, 0xFF08, 0xFF3B, 0xFF5B,
  0xFF5F -> PUNCTUATION_OPENING

  0x3001, 0x3002, 0x3009, 0x300B, 0x300D, 0x300F, 0x3011, 0x3015, 0x3017, 0x3019, 0x301B, 0x301E, 0x301F,
  0xFF09, 0xFF0C, 0xFF0E, 0xFF3D, 0xFF5D, 0xFF60 -> PUNCTUATION_CLOSING

  0x30FB, 0xFF1A, 0xFF1B -> PUNCTUATION_MIDDLE
  else -> 0
}

private fun isForcedBreak(c: Char): Boolean = c == '\n' || c == '\r' || c == '\u2028' || c == '\u2029'

private fun isBidiControl(c: Char): Boolean = c in '\u202A'..'\u202E' || c in '\u2066'..'\u2069'

/** Whether [index] starts a paragraph: nothing but bidi controls before it since the start or a forced break. */
private fun startsParagraph(text: CharSequence, index: Int): Boolean {
  var i = index - 1
  while (i >= 0 && isBidiControl(text[i])) i--
  return i < 0 || isForcedBreak(text[i])
}

private fun endsParagraph(text: CharSequence, index: Int): Boolean {
  var i = index + 1
  while (i < text.length && isBidiControl(text[i])) i++
  return i >= text.length || isForcedBreak(text[i])
}

/** A full-width mark of class [kind] set half-width. */
internal class HalfWidthSpan(val kind: Int) : MetricAffectingSpan() {
  private fun apply(tp: TextPaint) {
    val features = tp.fontFeatureSettings
    tp.fontFeatureSettings = if (features.isNullOrEmpty()) "'halt' 1" else "$features, 'halt' 1"
  }

  override fun updateMeasureState(textPaint: TextPaint) = apply(textPaint)

  override fun updateDrawState(tp: TextPaint) = apply(tp)
}

/** text-spacing-trim: space-all. Minikin turns on the font's 'chws' by default (API 35+), which trims too. */
internal class NoTrimSpan : MetricAffectingSpan() {
  private fun apply(tp: TextPaint) {
    val features = tp.fontFeatureSettings
    tp.fontFeatureSettings = if (features.isNullOrEmpty()) "'chws' 0" else "$features, 'chws' 0"
  }

  override fun updateMeasureState(textPaint: TextPaint) = apply(textPaint)

  override fun updateDrawState(tp: TextPaint) = apply(tp)
}

private fun modeAt(modes: ByteArray?, index: Int): Int = modes?.get(index)?.toInt() ?: 0

/**
 * Marks the punctuation set half-width wherever the line breaks, with [HalfWidthSpan]: next to
 * other punctuation (an opening mark after a mark, a closing mark before a closing or middle
 * one), at the start and end of each paragraph, and everywhere for trim-all. [modes] holds each
 * position's text-spacing-trim, null when all are normal.
 */
internal fun applySpacingTrim(text: Spannable, modes: ByteArray?) {
  val len = text.length
  if (len == 0) return
  if (modes != null) {
    var i = 0
    while (i < len) {
      if (modes[i].toInt() != SPACING_TRIM_SPACE_ALL) {
        i++
        continue
      }
      var end = i
      while (end < len && modes[end].toInt() == SPACING_TRIM_SPACE_ALL) end++
      text.setSpan(NoTrimSpan(), i, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      i = end
    }
  }
  for (i in 0 until len) {
    val kind = fullWidthPunctuation(text[i])
    val mode = modeAt(modes, i)
    if (kind == 0 || mode == SPACING_TRIM_SPACE_ALL) continue
    val trimmed = mode == SPACING_TRIM_ALL || when (kind) {
      PUNCTUATION_OPENING -> (i > 0 && fullWidthPunctuation(text[i - 1]) != 0) ||
        ((mode == SPACING_TRIM_START || mode == SPACING_TRIM_BOTH) && startsParagraph(text, i))

      PUNCTUATION_CLOSING -> (i + 1 < len && fullWidthPunctuation(text[i + 1]).let {
        it == PUNCTUATION_CLOSING || it == PUNCTUATION_MIDDLE
      }) || (mode == SPACING_TRIM_BOTH && endsParagraph(text, i))

      else -> false
    }
    if (trimmed) text.setSpan(HalfWidthSpan(kind), i, i + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
  }
}

/**
 * Each position's text-spacing-trim (the innermost element's value), or null when all are
 * normal. [own] is the text's own value; [elements] the flattened elements' nodes and ranges.
 */
internal fun spacingTrimModes(length: Int, own: Int, elements: List<Triple<Node, Int, Int>>): ByteArray? {
  fun value(mode: Int) = (if (mode == SPACING_TRIM_AUTO) 0 else mode).toByte()
  if (value(own).toInt() == 0 && elements.none { value(it.first.style.resolvedTextSpacingTrim.toInt()).toInt() != 0 }) {
    return null
  }
  val modes = ByteArray(length) { value(own) }
  for ((node, start, end) in elements) modes.fill(value(node.style.resolvedTextSpacingTrim.toInt()), start, end)
  return modes
}

private fun halved(text: Spanned, index: Int): Boolean =
  text.getSpans(index, index + 1, HalfWidthSpan::class.java).isNotEmpty() ||
    text.getSpans(index, index + 1, Spans.UprightGlyphSpan::class.java).any { it.half != 0 }

/** Whether the mark at [index] is a closing one a line end may still trim. */
private fun closingToTrim(text: Spanned, modes: ByteArray?, index: Int): Boolean {
  if (fullWidthPunctuation(text[index]) != PUNCTUATION_CLOSING || halved(text, index)) return false
  val mode = modeAt(modes, index)
  return mode != SPACING_TRIM_SPACE_ALL && mode != SPACING_TRIM_ALL
}

/**
 * Whether a soft line break could trim a mark of [text]: an opening mark that trims at the
 * start of a line, or any closing mark, which trims at the end of one if that lets it fit.
 */
internal fun trimsAtLineEdges(text: Spanned, modes: ByteArray?): Boolean {
  for (i in 0 until text.length) {
    val kind = fullWidthPunctuation(text[i])
    if (kind == 0 || kind == PUNCTUATION_MIDDLE) continue
    val mode = modeAt(modes, i)
    if (mode == SPACING_TRIM_SPACE_ALL || mode == SPACING_TRIM_ALL || halved(text, i)) continue
    if (kind == PUNCTUATION_CLOSING || mode == SPACING_TRIM_SPACE_FIRST || mode == SPACING_TRIM_START ||
      mode == SPACING_TRIM_BOTH
    ) return true
  }
  return false
}

/**
 * The closing bracket ending the first word of the line [start, end), which a line may not
 * start with, so the break before the word was taken because of it.
 */
private fun pushedClosingMark(text: Spanned, modes: ByteArray?, start: Int, end: Int): Int {
  val limit = minOf(end, start + 8)
  for (i in start + 1 until limit) {
    val c = text[i]
    if (c == ' ' || isForcedBreak(c)) return -1
    val kind = fullWidthPunctuation(c)
    if (kind == 0) continue
    if (kind != PUNCTUATION_CLOSING) return -1
    // The last of a run of closing marks; the ones before it are trimmed already.
    var last = i
    while (last + 1 < end && fullWidthPunctuation(text[last + 1]) == PUNCTUATION_CLOSING) last++
    // Chrome fits closing brackets this way but not commas and full stops.
    when (text[last].code) {
      0x3001, 0x3002, 0xFF0C, 0xFF0E -> return -1
    }
    return if (closingToTrim(text, modes, last)) last else -1
  }
  return -1
}

/** [text] with the marks in [trims] (position to class) set half-width. */
private fun halving(text: Spanned, trims: Map<Int, Int>): Spanned {
  val out = SpannableStringBuilder(text)
  for ((index, kind) in trims) {
    val upright = out.getSpans(index, index + 1, Spans.UprightGlyphSpan::class.java).firstOrNull()
    if (upright == null) {
      out.setSpan(HalfWidthSpan(kind), index, index + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      continue
    }
    if (upright.combined) continue
    val start = out.getSpanStart(upright)
    val end = out.getSpanEnd(upright)
    out.removeSpan(upright)
    out.setSpan(
      Spans.UprightGlyphSpan(upright.glyph, upright.wide, upright.rotated, half = kind),
      start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
    )
  }
  return out
}

/**
 * [text] laid out by [build] with the marks trimmed at its soft line breaks: an opening mark
 * starting a line, a closing mark ending one (trim-both), and a closing bracket that would end a
 * line if it were half-width, which is set so (every value that trims). Trims move the breaks,
 * so the layout is redone until they settle; a trimmed layout lays out a copy of [text].
 * [width] is the line length, [indent] the first line's.
 */
internal fun layoutTrimmingLineEdges(
  text: Spanned, modes: ByteArray?, paint: TextPaint, width: Int, indent: Int, build: (CharSequence) -> StaticLayout
): StaticLayout {
  var layout = build(text)
  var applied = emptyMap<Int, Int>()
  // Fitting trims whose line still broke before them.
  val rejected = HashSet<Int>()
  repeat(3) {
    val lines = layout.lineCount
    if (lines < 2) return layout
    val current = layout.text
    val desired = HashMap<Int, Int>()
    for (n in 0 until lines) {
      val start = layout.getLineStart(n)
      val end = layout.getLineEnd(n)
      if (end <= start) continue
      if (n > 0 && !startsParagraph(text, start) && fullWidthPunctuation(text[start]) == PUNCTUATION_OPENING &&
        !halved(text, start)
      ) {
        val mode = modeAt(modes, start)
        if (mode == SPACING_TRIM_SPACE_FIRST || mode == SPACING_TRIM_START || mode == SPACING_TRIM_BOTH) {
          desired[start] = PUNCTUATION_OPENING
        }
      }
      if (n + 1 >= lines || isForcedBreak(text[end - 1])) continue
      var last = end - 1
      while (last > start && text[last] == ' ') last--
      if (closingToTrim(text, modes, last) &&
        (modeAt(modes, last) == SPACING_TRIM_BOTH || applied[last] == PUNCTUATION_CLOSING)
      ) desired[last] = PUNCTUATION_CLOSING
      // A closing bracket the line broke before, when half-width would let it end this one.
      val next = layout.getLineStart(n + 1)
      val mark = pushedClosingMark(text, modes, next, layout.getLineEnd(n + 1))
      if (mark < 0 || mark in rejected || applied.containsKey(mark)) continue
      val piece = Layout.getDesiredWidth(current, next, mark + 1, paint)
      val half = Layout.getDesiredWidth(current, mark, mark + 1, paint) / 2f
      val available = width - if (n == 0) indent else 0
      if (layout.getLineWidth(n) + piece - half <= available + 0.01f) desired[mark] = PUNCTUATION_CLOSING
    }
    for ((index, kind) in applied) {
      if (kind == PUNCTUATION_CLOSING && index !in desired && modeAt(modes, index) != SPACING_TRIM_BOTH) {
        rejected.add(index)
      }
    }
    if (desired == applied) return layout
    applied = desired
    layout = build(if (applied.isEmpty()) text else halving(text, applied))
  }
  return layout
}
