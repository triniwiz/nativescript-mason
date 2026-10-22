package org.nativescript.mason.masonkit

import android.text.Spannable
import android.text.Spanned
import android.text.style.ReplacementSpan

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
 * The Tr ones among them (brackets, the long vowel mark, wave dashes): their vertical forms
 * are the glyph turned, so they're drawn sideways, which turns them the same way.
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

internal fun isUprightInMixed(cp: Int): Boolean =
  inRanges(UPRIGHT_RANGES, cp) && !inRanges(ROTATED_RANGES, cp)

/** Ideographic commas and full stops, whose vertical alternates ('vert') sit in the cell's corner. */
internal fun takesVerticalAlternate(cp: Int): Boolean =
  cp == 0x3001 || cp == 0x3002 || cp == 0xFF0C || cp == 0xFF0E

/** Full-width characters advance 1em upright; others the font's ascent plus descent. */
internal fun isWideUpright(cp: Int): Boolean = cp >= 0x2E80 || cp in 0x1100..0x11FF

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
 * Marks the graphemes [orientation] keeps upright (0 mixed, 1 upright, 2 sideways) with
 * [Spans.UprightGlyphSpan]. Inline boxes (replacement spans) are left alone.
 */
internal fun applyUprightGlyphs(text: Spannable, orientation: Int) {
  if (orientation == 2 || text.isEmpty()) return
  val len = text.length
  var i = 0
  while (i < len) {
    val cp = Character.codePointAt(text, i)
    var end = i + Character.charCount(cp)
    while (end < len) {
      val next = Character.codePointAt(text, end)
      if (!extendsCluster(next) && Character.codePointBefore(text, end) != 0x200D) break
      end += Character.charCount(next)
    }
    val upright = if (orientation == 1) !staysSideways(cp) && !inRanges(ROTATED_RANGES, cp)
    else isUprightInMixed(cp)
    if (upright && text.nextSpanTransition(i, end, ReplacementSpan::class.java) >= end &&
      text.getSpans(i, end, ReplacementSpan::class.java).isEmpty()
    ) {
      text.setSpan(
        Spans.UprightGlyphSpan(text.subSequence(i, end).toString(), isWideUpright(cp)),
        i, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
      )
    }
    i = end
  }
}
