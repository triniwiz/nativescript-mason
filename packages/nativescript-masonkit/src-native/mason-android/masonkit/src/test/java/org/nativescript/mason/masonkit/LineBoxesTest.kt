package org.nativescript.mason.masonkit

import android.graphics.Paint
import org.junit.Assert.assertEquals
import org.junit.Test

class LineBoxesTest {
  private fun metrics(ascent: Int, descent: Int) = Paint.FontMetricsInt().apply {
    this.ascent = ascent
    this.descent = descent
    top = ascent
    bottom = descent
  }

  /** Runs [lines] lines through one LineBoxes as StaticLayout does and returns each line's height. */
  private fun heights(
    lines: Int, exact: Float, ascent: Int = -22, descent: Int = 6, boxes: TextNode.LineBoxes = TextNode.LineBoxes()
  ): List<Int> {
    var v = 0
    return (0 until lines).map {
      val fm = metrics(ascent, descent)
      boxes.apply(fm, 0, v, exact)
      val h = fm.descent - fm.ascent
      v += h
      h
    }
  }

  @Test
  fun linesEndAtTheRoundedExactBottom() {
    // 10px Ahem at density 2.75 is 27.5px per line.
    val hs = heights(10, 27.5f)
    assertEquals(275, hs.sum())
    var bottom = 0
    hs.forEachIndexed { i, h ->
      bottom += h
      assertEquals(Math.round((i + 1) * 27.5f), bottom)
    }
  }

  @Test
  fun wholePixelHeightsAreUnchanged() {
    assertEquals(List(5) { 30 }, heights(5, 30f, ascent = -24, descent = 6))
  }

  @Test
  fun aRepeatedCallForOneLineDoesNotAdvance() {
    val boxes = TextNode.LineBoxes()
    val first = metrics(-22, 6)
    boxes.apply(first, 0, 0, 27.5f)
    val h0 = first.descent - first.ascent
    val again = metrics(-22, 6)
    boxes.apply(again, 0, 0, 27.5f)
    assertEquals(h0, again.descent - again.ascent)
    val next = metrics(-22, 6)
    boxes.apply(next, 0, h0, 27.5f)
    assertEquals(55, h0 + next.descent - next.ascent)
  }

  @Test
  fun aNewLayoutStartsOver() {
    val boxes = TextNode.LineBoxes()
    heights(3, 27.5f, boxes = boxes)
    assertEquals(listOf(28, 27), heights(2, 27.5f, boxes = boxes))
  }
}
