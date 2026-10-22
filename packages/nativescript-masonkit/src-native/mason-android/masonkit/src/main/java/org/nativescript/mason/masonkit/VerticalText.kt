package org.nativescript.mason.masonkit

import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.text.TextRunShaper
import android.os.Build
import android.text.Spannable
import android.text.Spanned
import android.text.TextPaint
import android.text.style.ReplacementSpan
import androidx.annotation.RequiresApi
import java.nio.ByteBuffer
import java.nio.ByteOrder

// text-orientation for vertical text. Lines are laid out sideways and turned 90° clockwise;
// a grapheme kept upright gets a cell of its own along the line and is drawn turned back.
// The same table and rules are in iOS VerticalText.swift and Windows VerticalText.h.

/**
 * Code points whose Unicode Vertical_Orientation is U, Tu or Tr (UAX #50): upright under
 * `text-orientation: mixed`. Sorted start/end pairs.
 */
private val UPRIGHT_RANGES = intArrayOf(
  0x00A7, 0x00A7, 0x00A9, 0x00A9, 0x00AE, 0x00AE, 0x00B1, 0x00B1, 0x00BC, 0x00BE,
  0x00D7, 0x00D7, 0x00F7, 0x00F7, 0x02EA, 0x02EB, 0x1100, 0x11FF, 0x1401, 0x167F,
  0x18B0, 0x18FF, 0x2016, 0x2016, 0x2020, 0x2021, 0x2030, 0x2031, 0x203B, 0x203C,
  0x2042, 0x2042, 0x2047, 0x2049, 0x2051, 0x2051, 0x2065, 0x2065, 0x20DD, 0x20E0,
  0x20E2, 0x20E4, 0x2100, 0x2101, 0x2103, 0x2109, 0x210F, 0x210F, 0x2113, 0x2114,
  0x2116, 0x2117, 0x211E, 0x2123, 0x2125, 0x2125, 0x2127, 0x2127, 0x2129, 0x2129,
  0x212E, 0x212E, 0x2135, 0x213F, 0x2145, 0x214A, 0x214C, 0x214D, 0x214F, 0x2189,
  0x218C, 0x218F, 0x221E, 0x221E, 0x2234, 0x2235, 0x2300, 0x2307, 0x230C, 0x231F,
  0x2324, 0x232B, 0x237D, 0x239A, 0x23BE, 0x23CD, 0x23CF, 0x23CF, 0x23D1, 0x23DB,
  0x23E2, 0x2422, 0x2424, 0x24FF, 0x25A0, 0x2619, 0x2620, 0x2767, 0x2776, 0x2793,
  0x2B12, 0x2B2F, 0x2B50, 0x2B59, 0x2BB8, 0x2BFF, 0x2E50, 0x2E51, 0x2E80, 0xA4CF,
  0xA960, 0xA97F, 0xAC00, 0xD7FF, 0xE000, 0xFAFF, 0xFE10, 0xFE1F, 0xFE30, 0xFE6F,
  0xFF01, 0xFF60, 0xFFE0, 0xFFE7, 0xFFF0, 0xFFF8, 0xFFFC, 0xFFFD, 0x13000, 0x1345F,
  0x14400, 0x1467F, 0x16FE0, 0x18AFF, 0x1B000, 0x1B2FF, 0x1D000, 0x1D1FF, 0x1D2E0, 0x1D37F,
  0x1F000, 0x1F2FF, 0x1F300, 0x1F64F, 0x1F680, 0x1F77F, 0x1F900, 0x1FAFF, 0x20000, 0x3FFFD,
)

/**
 * The Tr ones among them (brackets, the long vowel mark, wave dashes): upright only as the
 * font's vertical form, else drawn sideways, which turns them the way that form does.
 */
private val ROTATED_RANGES = intArrayOf(
  0x2329, 0x232A, 0x3008, 0x3011, 0x3014, 0x301F, 0x3030, 0x3030, 0x30A0, 0x30A0,
  0x30FC, 0x30FC, 0xFE59, 0xFE5E, 0xFF08, 0xFF09, 0xFF0D, 0xFF0D, 0xFF1A, 0xFF1E,
  0xFF3B, 0xFF3B, 0xFF3D, 0xFF3D, 0xFF3F, 0xFF3F, 0xFF5B, 0xFF60, 0xFFE3, 0xFFE3,
)

private fun inRanges(ranges: IntArray, cp: Int): Boolean {
  var lo = 0
  var hi = ranges.size / 2 - 1
  while (lo <= hi) {
    val mid = (lo + hi) ushr 1
    when {
      cp < ranges[mid * 2] -> hi = mid - 1
      cp > ranges[mid * 2 + 1] -> lo = mid + 1
      else -> return true
    }
  }
  return false
}

internal fun isRotatedUpright(cp: Int): Boolean = inRanges(ROTATED_RANGES, cp)

/** Full-width characters: drawn as their vertical forms, centred on the ideographic em box. */
internal fun isWideUpright(cp: Int): Boolean = cp >= 0x2E80 || cp in 0x1100..0x11FF

/** A grapheme's cell along the line, without letter spacing. */
internal class UprightCell(val advance: Float) {
  companion object {
    /** A Tr character the font has no vertical form for: it stays sideways. */
    val SIDEWAYS = UprightCell(0f)
  }
}

private data class CellKey(
  val typeface: Typeface?,
  val size: Float,
  val features: String?,
  val variations: String?,
  val glyph: String,
)

private const val CELL_CACHE_LIMIT = 1024
private val uprightCells = object : LinkedHashMap<CellKey, UprightCell>(64, 0.75f, true) {
  override fun removeEldestEntry(eldest: MutableMap.MutableEntry<CellKey, UprightCell>?) = size > CELL_CACHE_LIMIT
}
private val cellPaint = TextPaint()
private val plainBounds = Rect()
private val formBounds = Rect()
private val cellMetrics = Paint.FontMetrics()

internal fun variationsOf(paint: Paint): String? =
  if (Build.VERSION.SDK_INT >= 26) paint.fontVariationSettings else null

internal fun withVerticalForms(features: String?): String =
  if (features.isNullOrEmpty()) "'vert' 1" else "$features, 'vert' 1"

/**
 * The cell [glyph] takes upright in [paint], or null when it stays sideways. Full-width
 * graphemes are drawn as the font's vertical form ('vert'), as small kana, commas and brackets
 * have one; a bracket or other Tr character without one stays sideways. Cells are the font's
 * vertical advance (vmtx), else the height of the font the glyph comes from. Before API 31 the
 * glyph's font isn't known: 1em full width and the paint's font height otherwise.
 */
internal fun uprightCell(glyph: String, wide: Boolean, rotated: Boolean, paint: Paint): UprightCell? {
  val key = CellKey(paint.typeface, paint.textSize, paint.fontFeatureSettings, variationsOf(paint), glyph)
  synchronized(uprightCells) {
    val cell = uprightCells[key] ?: resolveCell(glyph, wide, rotated, paint).also { uprightCells[key] = it }
    return cell.takeUnless { it === UprightCell.SIDEWAYS }
  }
}

private fun resolveCell(glyph: String, wide: Boolean, rotated: Boolean, paint: Paint): UprightCell {
  val p = cellPaint
  p.set(paint)
  p.letterSpacing = 0f
  p.textScaleX = 1f
  if (wide) {
    p.getTextBounds(glyph, 0, glyph.length, plainBounds)
    p.fontFeatureSettings = withVerticalForms(paint.fontFeatureSettings)
    // A vertical form is another glyph: a turned bracket, a small kana in the cell's corner.
    p.getTextBounds(glyph, 0, glyph.length, formBounds)
    if (rotated && plainBounds == formBounds) return UprightCell.SIDEWAYS
  }
  if (Build.VERSION.SDK_INT >= 31) {
    verticalAdvance(glyph, p)?.let { return UprightCell(it) }
  }
  if (wide) return UprightCell(paint.textSize)
  p.getFontMetrics(cellMetrics)
  return UprightCell(cellMetrics.descent - cellMetrics.ascent)
}

/** The font's vertical advance for [glyph], else that font's height, or null if it isn't one glyph. */
@RequiresApi(31)
private fun verticalAdvance(glyph: String, paint: Paint): Float? {
  val glyphs = TextRunShaper.shapeTextRun(glyph, 0, glyph.length, 0, glyph.length, 0f, 0f, false, paint)
  if (glyphs.glyphCount() != 1) return null
  val font = glyphs.getFont(0)
  val tables = verticalTablesOf(font)
  if (tables != null) {
    val advance = tables.advance(glyphs.getGlyphId(0))
    if (advance > 0) return advance * paint.textSize / tables.unitsPerEm
  }
  font.getMetrics(paint, cellMetrics)
  return cellMetrics.descent - cellMetrics.ascent
}

/** A font's vertical metrics: vhea's long metric count and the vmtx advances. */
private class VerticalTables(val unitsPerEm: Int, private val longMetrics: Int, private val vmtx: ByteBuffer) {
  fun advance(glyph: Int): Int {
    val index = if (glyph < longMetrics) glyph else longMetrics - 1
    val at = index * 4
    return if (at + 2 <= vmtx.limit()) vmtx.getShort(at).toInt() and 0xFFFF else 0
  }
}

private val NO_TABLES = VerticalTables(1, 0, ByteBuffer.allocate(0))
private val verticalTables = HashMap<Long, VerticalTables>()

@RequiresApi(31)
private fun verticalTablesOf(font: Font): VerticalTables? {
  val key = (font.sourceIdentifier.toLong() shl 16) or font.ttcIndex.toLong()
  val tables = verticalTables.getOrPut(key) { readVerticalTables(font) ?: NO_TABLES }
  return tables.takeUnless { it === NO_TABLES }
}

private fun tag(s: String): Int =
  (s[0].code shl 24) or (s[1].code shl 16) or (s[2].code shl 8) or s[3].code

private val TAG_TTCF = tag("ttcf")
private val TAG_HEAD = tag("head")
private val TAG_VHEA = tag("vhea")
private val TAG_VMTX = tag("vmtx")

/** Reads head, vhea and vmtx from the font file (a collection's [Font.getTtcIndex] face). */
@RequiresApi(31)
private fun readVerticalTables(font: Font): VerticalTables? = try {
  val file = font.buffer.duplicate().order(ByteOrder.BIG_ENDIAN)
  var directory = 0
  if (file.getInt(0) == TAG_TTCF) directory = file.getInt(12 + 4 * font.ttcIndex)
  val count = file.getShort(directory + 4).toInt() and 0xFFFF
  var head = -1
  var vhea = -1
  var vmtx = -1
  var vmtxLength = 0
  for (i in 0 until count) {
    val record = directory + 12 + i * 16
    when (file.getInt(record)) {
      TAG_HEAD -> head = file.getInt(record + 8)
      TAG_VHEA -> vhea = file.getInt(record + 8)
      TAG_VMTX -> {
        vmtx = file.getInt(record + 8)
        vmtxLength = file.getInt(record + 12)
      }
    }
  }
  if (head < 0 || vhea < 0 || vmtx < 0) null
  else {
    val unitsPerEm = file.getShort(head + 18).toInt() and 0xFFFF
    val longMetrics = file.getShort(vhea + 34).toInt() and 0xFFFF
    file.position(vmtx)
    val metrics = file.slice().order(ByteOrder.BIG_ENDIAN)
    metrics.limit(vmtxLength.coerceAtMost(metrics.capacity()))
    if (unitsPerEm == 0 || longMetrics == 0) null else VerticalTables(unitsPerEm, longMetrics, metrics)
  }
} catch (_: RuntimeException) {
  null
}

// Code points that stay part of the grapheme before them.
private fun extendsCluster(cp: Int): Boolean {
  when (Character.getType(cp).toByte()) {
    Character.NON_SPACING_MARK, Character.ENCLOSING_MARK, Character.COMBINING_SPACING_MARK -> return true
  }
  return cp == 0x200D || cp in 0xFE00..0xFE0F || cp in 0xE0100..0xE01EF || cp in 0x1F3FB..0x1F3FF ||
    cp in 0xE0020..0xE007F
}

// Controls, line breaks and format characters (zero-width spaces among them) keep their
// sideways advance. Spaces are upright too under `upright`, as in browsers.
private fun staysSideways(cp: Int): Boolean =
  when (Character.getType(cp).toByte()) {
    Character.CONTROL, Character.FORMAT, Character.LINE_SEPARATOR, Character.PARAGRAPH_SEPARATOR -> true
    else -> false
  }

/**
 * Marks the graphemes their text-orientation keeps upright (0 mixed, 1 upright, 2 sideways)
 * with [Spans.UprightGlyphSpan], and the runs text-combine-upright combines (1 all, 2-4 digits)
 * with one span each: a flattened inline element's own values, else [orientation] and
 * [combine]. Inline boxes (replacement spans) are left alone.
 */
internal fun applyUprightGlyphs(text: Spannable, orientation: Int, combine: Int = 0) {
  if (text.isEmpty()) return
  val len = text.length
  // The innermost element's values win: outer spans are written first, inner ones over them.
  var own: ByteArray? = null
  var combines: ByteArray? = null
  val elements = text.getSpans(0, len, TextEngine.NodeSpan::class.java)
  if (elements.isNotEmpty()) {
    elements.sortBy { text.getSpanStart(it) - text.getSpanEnd(it) }
    val orientations = ByteArray(len) { orientation.toByte() }
    val combined = ByteArray(len) { combine.toByte() }
    for (element in elements) {
      val start = text.getSpanStart(element)
      val end = text.getSpanEnd(element)
      orientations.fill(element.node.style.resolvedTextOrientation, start, end)
      combined.fill(element.node.style.resolvedTextCombineUpright, start, end)
    }
    own = orientations
    combines = combined
  }
  val combinedAny = combines?.any { it.toInt() != 0 } ?: (combine != 0)
  if (orientation == 2 && !combinedAny && own?.any { it.toInt() != 2 } != true) return
  // Positions a combined run covers.
  val covered = if (combinedAny) combineUpright(text, combines, combine) else null
  var i = 0
  while (i < len) {
    val cp = Character.codePointAt(text, i)
    var end = i + Character.charCount(cp)
    while (end < len) {
      val next = Character.codePointAt(text, end)
      if (!extendsCluster(next) && Character.codePointBefore(text, end) != 0x200D) break
      end += Character.charCount(next)
    }
    if (covered != null && covered[i]) {
      i = end
      continue
    }
    val value = own?.get(i)?.toInt() ?: orientation
    val upright = when (value) {
      1 -> !staysSideways(cp)
      2 -> false
      else -> inRanges(UPRIGHT_RANGES, cp)
    }
    if (upright && text.nextSpanTransition(i, end, ReplacementSpan::class.java) >= end &&
      text.getSpans(i, end, ReplacementSpan::class.java).isEmpty()
    ) {
      val rotated = isRotatedUpright(cp)
      // text-spacing-trim: an upright half-width mark keeps half its cell, drawn as its vertical form.
      val half = text.getSpans(i, end, HalfWidthSpan::class.java).firstOrNull()
      if (half != null) text.removeSpan(half)
      text.setSpan(
        Spans.UprightGlyphSpan(
          text.subSequence(i, end).toString(), rotated || isWideUpright(cp), rotated,
          half = half?.kind ?: 0,
        ),
        i, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
      )
    }
    i = end
  }
}

/**
 * text-combine-upright: each run to combine (all of an element's text, or each run of up to N
 * ASCII digits) becomes one upright 1em cell, its text set horizontally and squeezed to fit.
 * [values] holds each position's value, else [combine] applies throughout. Returns the
 * positions combined.
 */
private fun combineUpright(text: Spannable, values: ByteArray?, combine: Int): BooleanArray {
  val len = text.length
  val covered = BooleanArray(len)
  fun mark(start: Int, end: Int) {
    if (end <= start || text.getSpans(start, end, ReplacementSpan::class.java).isNotEmpty()) return
    text.setSpan(
      Spans.UprightGlyphSpan(text.subSequence(start, end).toString(), wide = true, rotated = false, combined = true),
      start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
    )
    covered.fill(true, start, end)
  }
  var i = 0
  while (i < len) {
    val mode = values?.get(i)?.toInt() ?: combine
    var end = i + 1
    while (end < len && (values?.get(end)?.toInt() ?: combine) == mode) end++
    if (mode == 1) {
      // Line breaks end a run.
      var start = i
      for (j in i until end) {
        if (text[j] == '\n') {
          mark(start, j)
          start = j + 1
        }
      }
      mark(start, end)
    } else if (mode >= 2) {
      var j = i
      while (j < end) {
        if (text[j] !in '0'..'9') {
          j++
          continue
        }
        var k = j
        while (k < end && text[k] in '0'..'9') k++
        if (k - j <= mode) mark(j, k)
        j = k
      }
    }
    i = end
  }
  return covered
}
