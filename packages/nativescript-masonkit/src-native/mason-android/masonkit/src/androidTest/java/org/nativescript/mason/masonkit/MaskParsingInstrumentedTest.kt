package org.nativescript.mason.masonkit

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MaskParsingInstrumentedTest {

  @Test
  fun animationEndpointAndMaskAliasBridge() {
    assertArrayEquals(
      arrayOf("2", "number", "100", "%", "number", "0", "%", "2", "number", "10.0000001", "px", "number", "50", "%"),
      Mason.expandCssShorthand("animation-position-list", "top right, 10.0000001PX"),
    )
    assertArrayEquals(
      arrayOf("2", "number", "10", "px", "keyword", "auto", "", "1", "keyword", "contain", ""),
      Mason.expandCssShorthand("animation-size-list", "10px, contain"),
    )
    assertNull(Mason.expandCssShorthand("animation-position-list", "right 10px bottom 5px"))
    assertArrayEquals(arrayOf("subtract, exclude, add"), Mason.expandCssShorthand("webkit-mask-composite-list", "source-out, XOR, copy"))
    assertArrayEquals(arrayOf("padding-box, content-box"), Mason.expandCssShorthand("webkit-mask-box-list", "padding, content-box"))
  }

  @Test
  fun shorthandBridgeAndHtmlFollowTheSameLonghands() {
    val css = "url(a.svg) center / contain padding xor"
    val values = Mason.expandCssShorthand("-webkit-mask", css)!!
    assertArrayEquals(arrayOf("url(a.svg)", "contain", "center", "repeat", "padding-box", "padding-box", "match-source", "exclude"), values)
    assertNull(Mason.expandCssShorthand("mask", "url(a.svg),"))
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext)
        .parse("<div style='-webkit-mask: $css; mask-border: url(b.svg) 25% / / 4px'></div>").single().style
      assertEquals("contain", style.maskSize)
      assertEquals("center", style.maskPosition)
      assertEquals("exclude", style.maskComposite)
      assertEquals("url(b.svg)", style.maskBorderSource)
      assertEquals("auto", style.maskBorderWidth)
      assertEquals("4px", style.maskBorderOutset)
    }
  }

  @Test
  fun maskBatchInstallsFinalLayersAndClipOnce() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      val view = mason.createView(instrumentation.targetContext)
      val helper = NodeHelper(mason)
      val style = view.style
      helper.applyMaskBatch(view, """
        ["0", "linear-gradient(black, transparent)", "0", "linear-gradient(red, blue)",
         "1", "min(25%, 20dppx) auto", "3", "no-repeat", "10", "4px", "14", "inset(1px)"]
      """.trimIndent())
      assertEquals("linear-gradient(red, blue)", style.maskImage)
      assertEquals("min(25%, 20dppx) auto", helper.getMaskSize(view))
      assertEquals("no-repeat", style.maskRepeat)
      assertEquals("4px", style.maskBorderWidth)
      assertEquals("inset(1px)", style.clipPath)
      val layers = style.mMask!!.currentLayers()
      assertEquals(1, layers.size)
      val width = checkNotNull(layers.single().source?.size?.width)
      assertEquals(10f, width.resolve(40f, 0f), 0.0001f)
      assertEquals(20f, width.resolve(120f, 0f), 0.0001f)
      assertEquals(1, style.values.getInt(StyleKeys.MASK_REVISION))
      assertEquals(1, style.values.getInt(StyleKeys.CLIP_PATH_REVISION))

      helper.applyMaskBatch(view, """["0", ""]""")
      assertEquals("", style.maskImage)
      assertEquals("no-repeat", style.maskRepeat)
      assertTrue(style.mMask!!.currentLayers().isEmpty())
      assertEquals(2, style.values.getInt(StyleKeys.MASK_REVISION))
      assertEquals(1, style.values.getInt(StyleKeys.CLIP_PATH_REVISION))
    }
  }

  // Bootstrap writes some icons unencoded, quotes, commas and all.
  private val rawChevron =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 16c-.3 0-.5-.1-.7-.3l-6-6c-.4-.4-.4-1 0-1.4s1-.4 1.4 0l5.3 5.3 5.3-5.3c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-6 6c-.2.2-.4.3-.7.3'/></svg>"

  // MARK: layer lists

  @Test
  fun noneAndEmptyMeanNoMask() {
    assertTrue(parseMaskLayers("").isEmpty())
    assertTrue(parseMaskLayers("none").isEmpty())
    assertTrue(parseMaskLayers("none, NONE").isEmpty())
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

    assertEquals(MaskMode.LUMINANCE, MaskMode.parse("/**/LUMINANCE"))
    assertEquals(MaskMode.MATCH_SOURCE, MaskMode.parse("match-source"))
    assertNull(MaskMode.parse("lum"))
    assertEquals(MaskComposite.EXCLUDE, MaskComposite.parse("exclude/**/"))
    assertNull(MaskComposite.parse("xor"))
  }

  // MARK: gradients

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
    val list = parseMaskLayers("url(\"data:image/svg+xml,<svg a='1,2)'/>\"), linear-gradient(rgba(0, 0, 0, 1), red)")
    assertEquals(2, list.size)
    assertEquals("data:image/svg+xml,<svg a='1,2)'/>", list[0].source?.image)
    assertEquals(listOf("rgba(0, 0, 0, 1)", "red"), list[1].source?.gradient?.stops)
  }

  @Test
  fun urlForms() {
    fun extractCssUrl(css: String) = parseMaskLayers(css).singleOrNull()?.source?.image
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
    val url = parseMaskLayers("url(\"data:image/svg+xml;charset=utf-8,$svg\")").single().source!!.image!!
    val doc = decodeSvgDataUrl(url)
    assertNotNull(doc)
    assertEquals(1, doc!!.shapes.size)
  }

  @Test
  fun synchronizingLayersStoresTheRustMask() {
    val mason = Mason()
    val style = mason.createNode().style
    style.maskImage = "none, linear-gradient(blue, transparent)"
    style.maskRepeat = "no-repeat"
    val layers = style.mMask!!.currentLayers()
    assertEquals(2, layers.size)
    assertNull(layers[0].source)
    assertEquals(BackgroundRepeat.NO_REPEAT, layers[1].source?.repeat)
    assertEquals(1, style.values.getInt(StyleKeys.MASK_REVISION))
    assertEquals(0, mason.createNode().style.values.getInt(StyleKeys.MASK_REVISION))

    val gradient = checkNotNull(layers[1].source?.gradient)
    style.maskImage = "none"
    assertTrue(style.mMask!!.currentLayers().isEmpty())
    assertEquals(2, style.values.getInt(StyleKeys.MASK_REVISION))
    assertEquals(listOf("blue", "transparent"), gradient.stops)
    assertEquals(0xff0000ff.toInt(), checkNotNull(gradient.paint(100f, 100f)).color(0))
  }
}
