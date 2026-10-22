package org.nativescript.mason.masonkit

import android.text.Spannable
import android.text.Spanned
import android.text.TextPaint
import android.text.style.MetricAffectingSpan

// text-spacing-trim: full-width punctuation next to other punctuation gives up its blank half
// (CSS Text 4's trim-adjacent, part of `normal`). Minikin shapes every font of a run with the
// paint's features, so a trimmed mark takes the font's half-width alternate ('halt'); an
// upright cell in vertical text is halved instead (see VerticalText.kt). The same classes and
// rules are in iOS SpacingTrim.swift and Windows SpacingTrim.h.

internal const val PUNCTUATION_OPENING = 1
internal const val PUNCTUATION_CLOSING = 2
internal const val PUNCTUATION_MIDDLE = 3

/** The full-width punctuation class of [c], or 0. */
internal fun fullWidthPunctuation(c: Char): Int = when (c.code) {
  0x3008, 0x300A, 0x300C, 0x300E, 0x3010, 0x3014, 0x3016, 0x3018, 0x301A, 0x301D, 0xFF08, 0xFF3B, 0xFF5B,
  0xFF5F -> PUNCTUATION_OPENING

  0x3001, 0x3002, 0x3009, 0x300B, 0x300D, 0x300F, 0x3011, 0x3015, 0x3017, 0x3019, 0x301B, 0x301E, 0x301F,
  0xFF09, 0xFF0C, 0xFF0E, 0xFF3D, 0xFF5D, 0xFF60 -> PUNCTUATION_CLOSING

  0x30FB, 0xFF1A, 0xFF1B -> PUNCTUATION_MIDDLE
  else -> 0
}

/** A full-width mark set half-width: [opening] drops its start half, else its end half. */
internal class HalfWidthSpan(val opening: Boolean) : MetricAffectingSpan() {
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

/**
 * Marks the punctuation trim-adjacent sets half-width with [HalfWidthSpan]: an opening mark
 * after an opening, closing or middle mark, and a closing mark before a closing or middle mark.
 * Positions an element with `text-spacing-trim: space-all` covers ([off]) are left alone.
 */
internal fun applySpacingTrim(text: Spannable, off: BooleanArray?) {
  val len = text.length
  if (len < 2) return
  if (off != null) {
    var i = 0
    while (i < len) {
      if (!off[i]) {
        i++
        continue
      }
      var end = i
      while (end < len && off[end]) end++
      text.setSpan(NoTrimSpan(), i, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      i = end
    }
  }
  for (i in 0 until len) {
    val kind = fullWidthPunctuation(text[i])
    if (kind == 0 || off?.get(i) == true) continue
    val trimmed = when (kind) {
      PUNCTUATION_OPENING -> i > 0 && fullWidthPunctuation(text[i - 1]) != 0
      PUNCTUATION_CLOSING -> i + 1 < len && fullWidthPunctuation(text[i + 1]).let {
        it == PUNCTUATION_CLOSING || it == PUNCTUATION_MIDDLE
      }

      else -> false
    }
    if (trimmed) text.setSpan(HalfWidthSpan(kind == PUNCTUATION_OPENING), i, i + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
  }
}
