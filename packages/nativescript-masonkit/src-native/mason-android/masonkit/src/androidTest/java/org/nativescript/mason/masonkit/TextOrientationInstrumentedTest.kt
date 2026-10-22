package org.nativescript.mason.masonkit

import android.graphics.Paint
import android.text.Layout
import android.text.SpannableStringBuilder
import android.text.StaticLayout
import android.text.TextPaint
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

/** text-orientation in vertical text: which graphemes stay upright, and their cells. */
@RunWith(AndroidJUnit4::class)
class TextOrientationInstrumentedTest {

  private fun upright(text: String, orientation: Int): List<Int> {
    val spannable = SpannableStringBuilder(text)
    applyUprightGlyphs(spannable, orientation)
    return spannable.getSpans(0, spannable.length, Spans.UprightGlyphSpan::class.java)
      .map { spannable.getSpanStart(it) }.sorted()
  }

  private val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 40f }

  private fun lineWidth(text: String, orientation: Int): Float {
    val spannable = SpannableStringBuilder(text)
    applyUprightGlyphs(spannable, orientation)
    val layout = StaticLayout.Builder.obtain(spannable, 0, spannable.length, paint, 100_000)
      .setAlignment(Layout.Alignment.ALIGN_NORMAL).build()
    return layout.getLineWidth(0)
  }

  @Test
  fun mixedKeepsCjkUprightAndTurnsLatinAndBrackets() {
    // 漢 a 「 字 」 、
    assertEquals(listOf(0, 3, 5), upright("漢a「字」、", 0))
  }

  @Test
  fun uprightKeepsLatinAndSpacesButNotZeroWidthSpaces() {
    assertEquals(listOf(0, 1, 2, 4), upright("A B​C", 1))
  }

  @Test
  fun sidewaysMarksNothing() {
    assertEquals(emptyList<Int>(), upright("漢字", 2))
  }

  @Test
  fun aGraphemeIsOneCell() {
    assertEquals(listOf(0, 2), upright("é👍🏽", 1))
  }

  @Test
  fun fullWidthCellsAreOneEm() {
    assertEquals(120f, lineWidth("漢漢漢", 0), 0.5f)
  }

  // The first cell of a line must be as wide as the others (Minikin drops letter spacing there).
  @Test
  fun narrowUprightCellsAreTheFontsHeightFromTheLineStart() {
    val fm = paint.fontMetrics
    val cell = fm.descent - fm.ascent
    assertEquals(cell * 3, lineWidth("ABC", 1), 0.5f)
  }
}
