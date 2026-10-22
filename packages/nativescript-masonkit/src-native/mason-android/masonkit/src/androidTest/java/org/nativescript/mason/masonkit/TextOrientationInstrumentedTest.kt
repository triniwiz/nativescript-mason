package org.nativescript.mason.masonkit

import android.graphics.Paint
import android.text.Layout
import android.text.SpannableStringBuilder
import android.text.StaticLayout
import android.text.TextPaint
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.TextType

/** text-orientation in vertical text: which graphemes stay upright, and their cells. */
@RunWith(AndroidJUnit4::class)
class TextOrientationInstrumentedTest {

  private val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 40f }

  /** Starts of the graphemes drawn upright in [paint]. */
  private fun upright(text: CharSequence, orientation: Int): List<Int> {
    val spannable = SpannableStringBuilder(text)
    applyUprightGlyphs(spannable, orientation)
    return spannable.getSpans(0, spannable.length, Spans.UprightGlyphSpan::class.java)
      .filter { it.cell(paint) != null }
      .map { spannable.getSpanStart(it) }.sorted()
  }

  private fun lineWidth(text: String, orientation: Int): Float {
    val spannable = SpannableStringBuilder(text)
    applyUprightGlyphs(spannable, orientation)
    val layout = StaticLayout.Builder.obtain(spannable, 0, spannable.length, paint, 100_000)
      .setAlignment(Layout.Alignment.ALIGN_NORMAL).build()
    return layout.getLineWidth(0)
  }

  @Test
  fun mixedKeepsCjkAndBracketVerticalFormsUprightAndTurnsLatin() {
    // 漢 a 「 字 」 、
    assertEquals(listOf(0, 2, 3, 4, 5), upright("漢a「字」、", 0))
  }

  @Test
  fun aFlattenedElementsOrientationOverridesTheParagraphs() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    fun element(orientation: Byte) = mason.createTextView(context, TextType.Span).apply {
      style.prepareMut()
      style.values.put(StyleKeys.TEXT_ORIENTATION, orientation)
      style.values.put(StyleKeys.TEXT_ORIENTATION_STATE, 1)
      syncStyle(StateKeys.TEXT_ORIENTATION.low, StateKeys.TEXT_ORIENTATION.high)
    }
    val text = SpannableStringBuilder("AB漢字")
    text.setSpan(TextEngine.NodeSpan(element(1).node), 1, 2, 0)
    text.setSpan(TextEngine.NodeSpan(element(2).node), 3, 4, 0)
    assertEquals(listOf(1, 2), upright(text, 0))

    // A sideways paragraph still keeps a mixed element's CJK upright.
    val sideways = SpannableStringBuilder("漢字")
    sideways.setSpan(TextEngine.NodeSpan(element(0).node), 1, 2, 0)
    assertEquals(listOf(1), upright(sideways, 2))
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
  private fun combinedSpans(text: String, combine: Int): Pair<SpannableStringBuilder, List<Spans.UprightGlyphSpan>> {
    val spannable = SpannableStringBuilder(text)
    applyUprightGlyphs(spannable, 0, combine)
    val spans = spannable.getSpans(0, spannable.length, Spans.UprightGlyphSpan::class.java).filter { it.combined }
    return spannable to spans
  }

  @Test
  fun digitsCombineRunsOfUpToThatManyIntoOneEm() {
    val (text, spans) = combinedSpans("平成31年12345", 2)
    assertEquals(listOf("31"), spans.map { it.glyph })
    assertEquals(2, text.getSpanStart(spans[0]))
    val layout = StaticLayout.Builder.obtain(text, 2, 4, paint, 100_000).build()
    assertEquals(40f, layout.getLineWidth(0), 0.5f)
  }

  @Test
  fun allSqueezesWideTextIntoItsCell() {
    val (text, spans) = combinedSpans("2026", 1)
    assertEquals(listOf("2026"), spans.map { it.glyph })
    val layout = StaticLayout.Builder.obtain(text, 0, text.length, paint, 100_000).build()
    assertEquals(40f, layout.getLineWidth(0), 0.5f)
  }
  private fun width(text: CharSequence): Float =
    StaticLayout.Builder.obtain(text, 0, text.length, paint, 100_000).build().getLineWidth(0)

  @Test
  fun adjacentPunctuationDropsABlankHalf() {
    for (pair in listOf("」「", "。」", "「「")) {
      val text = SpannableStringBuilder(pair)
      applySpacingTrim(text, null)
      assertEquals(pair, 60f, width(text), 0.5f)
    }
    // A mark beside a letter keeps its width, and space-all trims nothing.
    val beside = SpannableStringBuilder("字」")
    applySpacingTrim(beside, null)
    assertEquals("beside ${width(SpannableStringBuilder("字」"))}", 80f, width(beside), 0.5f)
    val off = SpannableStringBuilder("」「")
    applySpacingTrim(off, BooleanArray(2) { true })
    assertEquals("off ${width(SpannableStringBuilder("」「"))}", 80f, width(off), 0.5f)
  }

  @Test
  fun verticalHalfWidthMarksTakeHalfACell() {
    val text = SpannableStringBuilder("」「")
    applySpacingTrim(text, null)
    applyUprightGlyphs(text, 0)
    assertEquals(60f, width(text), 0.5f)
  }
}
