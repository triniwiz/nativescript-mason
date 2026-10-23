package org.nativescript.mason.masonkit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** `background-repeat` parsing and the `space` / `round` tiling (CSS Backgrounds 3, 3.4). */
class BackgroundRepeatTest {

  private fun axis(
    style: RepeatStyle, areaLength: Float, tile: Float, offset: Float = 0f,
    paintStart: Float = 0f, paintEnd: Float = areaLength
  ): Triple<Float, Float, Int> {
    val out = FloatArray(3)
    tileAxis(style, 0f, areaLength, paintStart, paintEnd, tile, offset, out)
    return Triple(out[0], out[1], out[2].toInt())
  }

  @Test
  fun parsesOneAndTwoKeywords() {
    assertEquals(BackgroundRepeat.REPEAT_X, BackgroundRepeat.parse("repeat-x"))
    assertEquals(BackgroundRepeat(RepeatStyle.SPACE, RepeatStyle.SPACE), BackgroundRepeat.parse("space"))
    assertEquals(BackgroundRepeat(RepeatStyle.ROUND, RepeatStyle.NO_REPEAT), BackgroundRepeat.parse(" Round  no-repeat "))
    assertNull(BackgroundRepeat.parse("space repeat-y"))
    assertNull(BackgroundRepeat.parse("repeat repeat repeat"))
    assertNull(BackgroundRepeat.parse(""))
  }

  @Test
  fun serializesTheShortestForm() {
    assertEquals("repeat-x", BackgroundRepeat(RepeatStyle.REPEAT, RepeatStyle.NO_REPEAT).value)
    assertEquals("repeat-y", BackgroundRepeat(RepeatStyle.NO_REPEAT, RepeatStyle.REPEAT).value)
    assertEquals("round", BackgroundRepeat(RepeatStyle.ROUND, RepeatStyle.ROUND).value)
    assertEquals("space round", BackgroundRepeat(RepeatStyle.SPACE, RepeatStyle.ROUND).value)
  }

  @Test
  fun shorthandTakesBothRepeatKeywords() {
    assertEquals(BackgroundRepeat(RepeatStyle.SPACE, RepeatStyle.ROUND), parseLayer("url(a.png) space round").repeat)
    assertEquals(BackgroundRepeat.REPEAT_Y, parseLayer("url(a.png) repeat-y").repeat)
  }

  @Test
  fun invalidValueParsesToNull() {
    assertNull(parseRepeat("bogus"))
  }

  @Test
  fun spaceSpreadsWholeTilesEdgeToEdge() {
    // 3 tiles of 30 in 100: 5 between them, the last ending at 100. Position is ignored.
    val (first, step, count) = axis(RepeatStyle.SPACE, 100f, 30f, offset = 12f)
    assertEquals(0f, first, 1e-4f)
    assertEquals(35f, step, 1e-4f)
    assertEquals(3, count)
    assertEquals(100f, first + (count - 1) * step + 30f, 1e-4f)
  }

  @Test
  fun spaceWithRoomForOneTileUsesThePosition() {
    val (first, _, count) = axis(RepeatStyle.SPACE, 100f, 60f, offset = 20f)
    assertEquals(20f, first, 0f)
    assertEquals(1, count)
  }

  @Test
  fun spaceContinuesAcrossALargerPaintArea() {
    val (first, step, count) = axis(RepeatStyle.SPACE, 100f, 30f, paintStart = -50f, paintEnd = 150f)
    assertEquals(35f, step, 1e-4f)
    assertEquals(-70f, first, 1e-3f)
    assertEquals(7, count)
  }

  @Test
  fun repeatAndNoRepeat() {
    val (first, step, count) = axis(RepeatStyle.REPEAT, 100f, 30f, offset = 10f)
    assertEquals(-20f, first, 1e-4f)
    assertEquals(30f, step, 0f)
    assertEquals(4, count)
    assertEquals(Triple(10f, 30f, 1), axis(RepeatStyle.NO_REPEAT, 100f, 30f, offset = 10f))
    assertEquals(0, axis(RepeatStyle.REPEAT, 100f, 0f).third)
  }

  @Test
  fun roundFitsAWholeNumberOfTiles() {
    // 100 / 30 rounds to 3 tiles of 33.33; the auto height keeps the 30x20 ratio.
    val layer = BackgroundLayer(repeat = BackgroundRepeat(RepeatStyle.ROUND, RepeatStyle.REPEAT))
    val (w, h) = resolveTileSize(layer, 30f, 20f, 100f, 100f)
    assertEquals(100f / 3f, w, 1e-4f)
    assertEquals(20f * (100f / 3f) / 30f, h, 1e-4f)
  }

  @Test
  fun roundOnBothAxesFitsEachIndependently() {
    val layer = BackgroundLayer(repeat = BackgroundRepeat(RepeatStyle.ROUND, RepeatStyle.ROUND))
    val (w, h) = resolveTileSize(layer, 30f, 20f, 100f, 45f)
    assertEquals(100f / 3f, w, 1e-4f)
    assertEquals(22.5f, h, 1e-4f)
  }

  @Test
  fun roundNeverDropsBelowOneTile() {
    val layer = BackgroundLayer(repeat = BackgroundRepeat(RepeatStyle.ROUND, RepeatStyle.NO_REPEAT))
    val (w, _) = resolveTileSize(layer, 300f, 300f, 100f, 100f)
    assertEquals(100f, w, 1e-4f)
  }

  @Test
  fun svgDataUrlWithNestedUrlsStaysWhole() {
    val svg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><pattern id='p'/><rect fill='url(%23p)' points='1,2'/></svg>"
    val layer = parseLayer("url(\"$svg\") center / contain no-repeat")
    assertEquals(svg, layer.image)
    assertEquals(BackgroundRepeat(RepeatStyle.NO_REPEAT, RepeatStyle.NO_REPEAT), layer.repeat)
    // Commas and parentheses inside the quotes don't split layers.
    val layers = splitLayers("url(\"$svg\"), linear-gradient(red, blue)")
    assertEquals(2, layers.size)
    assertEquals(svg, findCssUrl(layers[0])?.second)
    assertEquals("a.png", parseLayer("url(a.png) repeat-x").image)
  }
}
