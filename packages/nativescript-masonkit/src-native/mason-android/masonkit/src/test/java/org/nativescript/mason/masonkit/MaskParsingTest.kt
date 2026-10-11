package org.nativescript.mason.masonkit

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * `mask-*` parsing (Mask.kt). Lengths go through `Mason.shared`, which loads the native
 * library, so these stick to keywords and percentages.
 */
class MaskParsingTest {

  // Bootstrap writes some icons unencoded, quotes, commas and all.
  private val rawChevron =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 16c-.3 0-.5-.1-.7-.3l-6-6c-.4-.4-.4-1 0-1.4s1-.4 1.4 0l5.3 5.3 5.3-5.3c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-6 6c-.2.2-.4.3-.7.3'/></svg>"

  // Bootstrap 5.3's `.btn-close` icon, percent-encoded as it ships.
  private val btnClose =
    "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e"

  // MARK: layer lists

  @Test
  fun noneAndEmptyMeanNoMask() {
    assertTrue(parseMaskLayers("").isEmpty())
    assertTrue(parseMaskLayers("none").isEmpty())
    assertTrue(parseMaskLayers("none, NONE").isEmpty())
  }

  @Test
  fun noneNextToAnImageIsATransparentLayer() {
    val layers = parseMaskLayers("url(a.png), none, linear-gradient(black, transparent)")
    assertEquals(3, layers.size)
    assertEquals("a.png", layers[0].source?.image)
    assertNull(layers[1].source)
    assertEquals("linear", layers[2].source?.gradient?.type)
  }

  @Test
  fun unsupportedImageInvalidatesTheList() {
    assertTrue(parseMaskLayers("url(a.png), element(#x)").isEmpty())
    assertTrue(parseMaskLayers("bogus").isEmpty())
  }

  @Test
  fun initialValues() {
    val layer = parseMaskLayers("url(a.png)").single()
    assertEquals(MaskClip.BORDER_BOX, layer.clip)
    assertEquals(MaskMode.MATCH_SOURCE, layer.mode)
    assertEquals(MaskComposite.ADD, layer.composite)
    val source = layer.source!!
    // Unlike background-origin, mask-origin starts at the border box.
    assertEquals(BackgroundOrigin.BORDER_BOX, source.origin)
    assertEquals(BackgroundRepeat.REPEAT, source.repeat)
    assertNull(source.size)
    assertNull(source.position)
  }

  @Test
  fun longhandListsRepeatCyclically() {
    val layers = parseMaskLayers(
      image = "url(a.png), url(b.png), url(c.png)",
      size = "contain, cover",
      repeat = "no-repeat",
      mode = "alpha, luminance",
      composite = "subtract, intersect, exclude, add",
      clip = "content-box, no-clip",
    )
    assertEquals(listOf("contain", "cover", "contain"), layers.map { it.source?.size?.keyword })
    assertTrue(layers.all { it.source?.repeat == BackgroundRepeat.NO_REPEAT })
    assertEquals(listOf(MaskMode.ALPHA, MaskMode.LUMINANCE, MaskMode.ALPHA), layers.map { it.mode })
    assertEquals(
      listOf(MaskComposite.SUBTRACT, MaskComposite.INTERSECT, MaskComposite.EXCLUDE),
      layers.map { it.composite }
    )
    assertEquals(listOf(MaskClip.CONTENT_BOX, MaskClip.NO_CLIP, MaskClip.CONTENT_BOX), layers.map { it.clip })
  }

  @Test
  fun positionKeywordsAndPercentages() {
    val layers = parseMaskLayers("url(a.png), url(b.png)", position = "center, right 25%")
    val center = layers[0].source!!.position!!
    assertEquals(0.5f, center.x.fraction, 0f)
    assertEquals(0.5f, center.y.fraction, 0f)
    val other = layers[1].source!!.position!!
    assertEquals(1f, other.x.fraction, 0f)
    assertEquals(0.25f, other.y.fraction, 0f)
  }

  @Test
  fun keywordFallbacks() {
    assertEquals(MaskClip.BORDER_BOX, MaskClip.parse("fill-box"))
    assertEquals(MaskClip.BORDER_BOX, MaskClip.parse("stroke-box"))
    assertEquals(MaskClip.BORDER_BOX, MaskClip.parse("view-box"))
    assertEquals(MaskClip.BORDER_BOX, MaskClip.parse("margin-box"))
    assertEquals(MaskClip.PADDING_BOX, MaskClip.parse(" Padding-Box "))
    assertEquals(MaskClip.NO_CLIP, MaskClip.parse("no-clip"))
    assertNull(MaskClip.parse("nope"))

    assertEquals(BackgroundOrigin.BORDER_BOX, parseMaskOrigin("view-box"))
    assertEquals(BackgroundOrigin.CONTENT_BOX, parseMaskOrigin("content-box"))
    assertNull(parseMaskOrigin("no-clip"))

    assertEquals(MaskMode.LUMINANCE, MaskMode.parse("luminance"))
    assertEquals(MaskMode.MATCH_SOURCE, MaskMode.parse("match-source"))
    assertNull(MaskMode.parse("lum"))
    assertEquals(MaskComposite.EXCLUDE, MaskComposite.parse("exclude"))
    assertNull(MaskComposite.parse("xor"))
  }

  @Test
  fun invalidKeywordsKeepTheInitialValue() {
    val layer = parseMaskLayers("url(a.png)", clip = "nope", mode = "nope", composite = "nope", repeat = "nope").single()
    assertEquals(MaskClip.BORDER_BOX, layer.clip)
    assertEquals(MaskMode.MATCH_SOURCE, layer.mode)
    assertEquals(MaskComposite.ADD, layer.composite)
    assertEquals(BackgroundRepeat.REPEAT, layer.source?.repeat)
  }

  @Test
  fun repeatKeywords() {
    assertEquals(BackgroundRepeat.REPEAT, parseMaskRepeat("repeat"))
    assertEquals(BackgroundRepeat.NO_REPEAT, parseMaskRepeat("no-repeat"))
    assertEquals(BackgroundRepeat.REPEAT_X, parseMaskRepeat("repeat-x"))
    assertEquals(BackgroundRepeat.REPEAT_Y, parseMaskRepeat("repeat-y"))
    assertEquals(BackgroundRepeat.REPEAT_X, parseMaskRepeat("repeat no-repeat"))
    assertEquals(BackgroundRepeat.REPEAT_Y, parseMaskRepeat("no-repeat round"))
    assertEquals(BackgroundRepeat.REPEAT, parseMaskRepeat("space"))
    assertEquals(BackgroundRepeat.NO_REPEAT, parseMaskRepeat("no-repeat no-repeat"))
    assertNull(parseMaskRepeat("repeat-x repeat"))
    assertNull(parseMaskRepeat("bogus"))
  }

  // MARK: gradients

  @Test
  fun gradients() {
    val linear = parseMaskGradient("linear-gradient(black, transparent)")!!
    assertEquals("linear", linear.type)
    assertFalse(linear.repeating)
    assertEquals(listOf("black", "transparent"), linear.stops)

    val repeating = parseMaskGradient("repeating-linear-gradient(45deg, black 0 10%, transparent 10% 20%)")!!
    assertEquals("linear", repeating.type)
    assertTrue(repeating.repeating)
    assertEquals("45deg", repeating.direction)
    assertEquals(4, repeating.stops.size)

    val radial = parseMaskGradient("repeating-radial-gradient(circle at center, black, transparent 25%)")!!
    assertEquals("radial", radial.type)
    assertTrue(radial.repeating)

    val conic = parseMaskGradient("conic-gradient(from 90deg at 25% 75%, red, rgba(0, 0, 255, 0.5))")!!
    assertEquals("conic", conic.type)
    assertEquals("from 90deg at 25% 75%", conic.direction)
    assertEquals(listOf("red", "rgba(0, 0, 255, 0.5)"), conic.stops)

    val bare = parseMaskGradient("repeating-conic-gradient(black 0 25%, white 0 50%)")!!
    assertNull(bare.direction)
    assertTrue(bare.repeating)
    assertEquals(4, bare.stops.size)

    assertNull(parseMaskGradient("linear-gradient"))
    assertNull(parseMaskGradient("foo-gradient(red, blue)"))
  }

  @Test
  fun repeatingStopsTileAcrossTheLine() {
    val a = 0xFF000000.toInt()
    val b = 0x00000000
    // black 0 25%, transparent 25% 50%: a 50% period, so two runs.
    val (colors, positions) = repeatGradientStops(intArrayOf(a, a, b, b), floatArrayOf(0f, 0.25f, 0.25f, 0.5f))
    assertEquals(0f, positions.first(), 0f)
    assertEquals(1f, positions.last(), 0f)
    for (i in 1 until positions.size) assertTrue(positions[i] >= positions[i - 1])
    assertEquals(a, colors.first())
    assertEquals(b, colors.last())
    // The second run starts black again at 50%.
    val at50 = positions.indices.filter { positions[it] == 0.5f }.map { colors[it] }
    assertTrue(at50.contains(a) && at50.contains(b))
    assertTrue(positions.count { it == 0.75f } >= 2)
  }

  @Test
  fun repeatingStopsCutMidPeriod() {
    val a = 0xFFFF0000.toInt()
    val b = 0xFF0000FF.toInt()
    // A 0.4 period starting at 0.1: 0 and 1 fall inside a run and get interpolated colours.
    val (colors, positions) = repeatGradientStops(intArrayOf(a, b), floatArrayOf(0.1f, 0.5f))
    assertEquals(0f, positions.first(), 0f)
    assertEquals(1f, positions.last(), 0f)
    // 0 sits 0.3 into the run [-0.3, 0.1]: three quarters of the way to blue.
    val first = colors.first()
    assertEquals(0xFF, first ushr 24)
    assertTrue(((first shr 16) and 0xFF) in 60..70)
    assertTrue((first and 0xFF) in 185..195)
  }

  @Test
  fun zeroPeriodIsLeftAlone() {
    val colors = intArrayOf(1, 2)
    val positions = floatArrayOf(0.5f, 0.5f)
    val (c, p) = repeatGradientStops(colors, positions)
    assertArrayEquals(colors, c)
    assertArrayEquals(positions, p, 0f)
  }

  // MARK: URLs

  @Test
  fun splitKeepsQuotedCommasAndParentheses() {
    val list = splitMaskList("url(\"data:image/svg+xml,<svg a='1,2)'/>\"), linear-gradient(rgba(0, 0, 0, 1), red)")
    assertEquals(2, list.size)
    assertEquals("url(\"data:image/svg+xml,<svg a='1,2)'/>\")", list[0])
    assertEquals(" linear-gradient(rgba(0, 0, 0, 1), red)", list[1])
  }

  @Test
  fun urlForms() {
    assertEquals("a.png", extractCssUrl("url(a.png)"))
    assertEquals("a.png", extractCssUrl("url( a.png )"))
    assertEquals("a b.png", extractCssUrl("url('a b.png')"))
    assertEquals("say \"hi\"", extractCssUrl("url(\"say \\\"hi\\\"\")"))
    assertEquals("<svg>", extractCssUrl("url(\"\\3c svg>\")"))
    assertEquals("x)y", extractCssUrl("URL(\"x)y\")"))
    assertNull(extractCssUrl("url(\"open"))
    assertNull(extractCssUrl("image(a.png)"))
  }

  @Test
  fun rawSvgDataUrl() {
    val layer = parseMaskLayers("url(\"data:image/svg+xml,$rawChevron\")").single()
    val url = layer.source!!.image!!
    assertEquals("data:image/svg+xml,$rawChevron", url)
    val doc = decodeSvgDataUrl(url)
    assertNotNull(doc)
    assertEquals(24f, doc!!.viewBox!![2], 0f)
    assertEquals(1, doc.shapes.size)
    assertFalse(doc.shapes[0].commands.isEmpty())
  }

  @Test
  fun rawSvgDataUrlWithPercentAndHash() {
    // Unencoded text may carry a bare `%` or `#`: neither is an escape.
    val svg = "<svg xmlns='http://www.w3.org/2000/svg' id='a100%' viewBox='0 0 10 10'><rect width='10' height='10' fill='#000'/></svg>"
    val doc = decodeSvgDataUrl(extractCssUrl("url(\"data:image/svg+xml;charset=utf-8,$svg\")")!!)
    assertNotNull(doc)
    assertEquals(1, doc!!.shapes.size)
  }

  @Test
  fun percentEncodedSvgDataUrl() {
    val layers = parseMaskLayers(
      "url(\"data:image/svg+xml,$btnClose\")",
      position = "center", size = "contain", repeat = "no-repeat"
    )
    val source = layers.single().source!!
    assertEquals("contain", source.size?.keyword)
    assertEquals(BackgroundRepeat.NO_REPEAT, source.repeat)
    val doc = decodeSvgDataUrl(source.image!!)
    assertNotNull(doc)
    assertEquals(16f, doc!!.viewBox!![2], 0f)
    assertEquals(1, doc.shapes.size)
  }
}
