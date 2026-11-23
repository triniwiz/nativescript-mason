package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.assertNull
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BackgroundInstrumentedTest {
  @Test
  fun copiedBackgroundOffsetsKeepTheirFormulaUntilEdited() {
    val position = checkNotNull(parsePosition(listOf("min(25%, 20dppx)", "center"))).x
    val copy = position.copy()
    assertEquals(position, copy)
    assertEquals(position.hashCode(), copy.hashCode())
    assertEquals("min(25%, 20dppx)", copy.cssValue(true))
    assertEquals(10f, copy.resolve(80f, 40f), 0.0001f)
    assertEquals(20f, copy.resolve(160f, 40f), 0.0001f)

    copy.fraction = 0.5f
    assertEquals(60f, copy.resolve(160f, 40f), 0.0001f)
    assertEquals(20f, position.resolve(160f, 40f), 0.0001f)
    assertEquals(30f, position.copy(fraction = 0.25f).resolve(160f, 40f), 0.0001f)
  }

  @Test
  fun backgroundMathUsesThePositioningAreaAndTheTile() {
    val layer = parseLayer("url(tiles.png) right min(10%, 2em) bottom calc(10% + 2px) / clamp(10px, 50%, 4em) auto")
    val x = checkNotNull(layer.position?.x)
    val units = LengthContext(scale = 2f, emBasis = 20f)
    val first = resolveTileSize(layer, 80f, 40f, 240f, 120f, units)
    val second = resolveTileSize(layer, 80f, 40f, 400f, 120f, units)
    assertEquals(120f, first.first, 0.0001f)
    assertEquals(60f, first.second, 0.0001f)
    assertEquals(160f, second.first, 0.0001f)
    assertEquals(108f, x.resolve(240f, first.first, units), 0.0001f)
    assertEquals(216f, x.resolve(400f, second.first, units), 0.0001f)
    assertEquals("right min(10%, 2em)", x.cssValue(true))
    val size = checkNotNull(parseSize("min(50%, 40px) auto"))
    assertEquals(80f, resolveBitmapSize(size, 80f, 40f, 400f, 120f, units).first, 0.0001f)
  }

  @Test
  fun paintSnapshotKeepsGradientsAndMathAfterLayerReplacement() {
    val currentColor = 0xff123456.toInt()
    val background = checkNotNull(NativeBackground.parse(
      "url(tiles.png) min(10%, 2em) center, linear-gradient(currentColor 20dppx, white), " +
        "url(spacer.png), radial-gradient(in oklab, red, blue)", currentColor
    ))
    val layers = checkNotNull(background.readLayers())
    val oldOffset = checkNotNull(layers[0].position?.x)
    val linear = checkNotNull(layers[1].gradient)
    val radial = checkNotNull(layers[3].gradient)
    assertEquals("tiles.png", layers[0].image)
    assertEquals("spacer.png", layers[2].image)

    assertEquals(1, background.setLonghand("position", "center"))
    val reused = checkNotNull(background.readLayers(reusing = layers))
    assertTrue(linear === reused[1].gradient)
    assertTrue(radial === reused[3].gradient)
    assertEquals(-1L, background.replace("url(replacement.png)", currentColor))
    assertEquals("replacement.png", background.readLayers()?.single()?.image)

    val units = LengthContext(scale = 2f, emBasis = 20f)
    assertEquals("min(10%, 2em)", oldOffset.cssValue(true))
    assertEquals(20f, oldOffset.resolve(240f, 40f, units), 0.0001f)
    assertEquals(listOf("currentColor 20dppx", "white"), linear.stops)
    val paint = checkNotNull(linear.paint(200f, 100f, units))
    assertEquals(currentColor, paint.color(0))
    assertEquals(0.2f, paint.position(0), 0.0001f)
    assertEquals("radial", radial.type)
    assertEquals(ColorInterpolation.Space.OKLAB, radial.interpolation?.space)
    assertEquals(listOf("red", "blue"), radial.stops)
  }

  @Test
  fun shorthandBridgeAndNativePaintShareBackgroundGrammar() {
    val css = "url(é.svg) center / contain local content-box text, linear-gradient(red, blue) #fff"
    val fields = Mason.expandCssShorthand("background", css)
    assertArrayEquals(
      arrayOf("#fff", "url(é.svg), linear-gradient(red, blue)", "", "center, 0% 0%", "contain, auto",
        "text, border-box", "content-box, padding-box", "local, scroll"),
      fields,
    )
    val layers = parseBackgroundLayers(css)
    assertEquals("é.svg", layers[0].image)
    assertEquals(BackgroundClip.TEXT, layers[0].clip)
    assertEquals(BackgroundAttachment.LOCAL, layers[0].attachment)
    assertEquals("linear", layers[1].gradient?.type)
    assertEquals(0xffffffff.toInt(), layers[1].layerColor)
    assertNull(Mason.expandCssShorthand("background", "background(a.svg),"))
  }

  // Bootstrap 5.3's `.btn-close` icon, percent-encoded as it ships.
  private val btnClose =
    "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e"

  @Test
  fun shorthandTakesBothRepeatKeywords() {
    assertEquals(BackgroundRepeat(RepeatStyle.SPACE, RepeatStyle.ROUND), parseLayer("url(a.png) space round").repeat)
    assertEquals(BackgroundRepeat.REPEAT_Y, parseLayer("url(a.png) repeat-y").repeat)
  }

  @Test
  fun svgDataUrlWithNestedUrlsStaysWhole() {
    val svg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><pattern id='p'/><rect fill='url(%23p)' points='1,2'/></svg>"
    val layer = parseLayer("url(\"$svg\") center / contain no-repeat")
    assertEquals(svg, layer.image)
    assertEquals(BackgroundRepeat(RepeatStyle.NO_REPEAT, RepeatStyle.NO_REPEAT), layer.repeat)
    // Commas and parentheses inside the quotes don't split layers.
    val layers = parseBackgroundLayers("url(\"$svg\"), linear-gradient(red, blue)")
    assertEquals(2, layers.size)
    assertEquals(svg, layers[0].image)
    assertEquals("a.png", parseLayer("url(a.png) repeat-x").image)
  }

  @Test
  fun shorthandTransfersTypedLayersAndCurrentColor() {
    val color = 0xff123456.toInt()
    val layers = parseBackgroundLayers(
      "url(a.png) right 10dppx bottom 25% / 50% auto local content-box text, " +
        "linear-gradient(currentColor, blue) repeat-x currentColor",
      color
    )!!
    val image = layers[0]
    assertEquals(BackgroundOffset(1f, -10f), image.position?.x)
    val y = image.position!!.y
    assertEquals(0.75f, y.fraction, 0f)
    assertEquals(0f, y.px, 0f)
    assertEquals(BackgroundSize(BackgroundOffset(0.5f)), image.size)
    assertEquals(BackgroundAttachment.LOCAL, image.attachment)
    assertEquals(BackgroundOrigin.CONTENT_BOX, image.origin)
    assertEquals(BackgroundClip.TEXT, image.clip)
    assertEquals(BackgroundRepeat.REPEAT_X, layers[1].repeat)
    assertEquals("linear", layers[1].gradient?.type)
    assertEquals(color, layers[1].layerColor)
    assertTrue(parseBackgroundLayers("url(a.png), broken").isEmpty())
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
  fun invalidValueParsesToNull() {
    assertNull(parseRepeat("bogus"))
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
  fun invalidKeywordsKeepTheInitialValue() {
    val layer = parseMaskLayers("url(a.png)", clip = "nope", mode = "nope", composite = "nope", repeat = "nope").single()
    assertEquals(MaskClip.BORDER_BOX, layer.clip)
    assertEquals(MaskMode.MATCH_SOURCE, layer.mode)
    assertEquals(MaskComposite.ADD, layer.composite)
    assertEquals(BackgroundRepeat.REPEAT, layer.source?.repeat)
    val layers = parseMaskLayers("url(a.png), none, url(b.png), url(c.png)", repeat = "round, invalid, no-repeat")
    assertEquals(listOf("round", null, "no-repeat", "round"), layers.map { it.source?.repeat?.value })
  }

  @Test
  fun repeatKeywords() {
    assertEquals(BackgroundRepeat.REPEAT, parseMaskRepeat("repeat"))
    assertEquals(BackgroundRepeat.NO_REPEAT, parseMaskRepeat("no-repeat"))
    assertEquals(BackgroundRepeat.REPEAT_X, parseMaskRepeat("repeat-x"))
    assertEquals(BackgroundRepeat.REPEAT_Y, parseMaskRepeat("repeat-y"))
    assertEquals(BackgroundRepeat.REPEAT_X, parseMaskRepeat("repeat no-repeat"))
    assertEquals(BackgroundRepeat(RepeatStyle.NO_REPEAT, RepeatStyle.ROUND), parseMaskRepeat("no-repeat round"))
    assertEquals(BackgroundRepeat(RepeatStyle.SPACE, RepeatStyle.SPACE), parseMaskRepeat("space"))
    assertEquals(BackgroundRepeat(RepeatStyle.ROUND, RepeatStyle.SPACE), parseMaskRepeat("round space"))
    assertEquals(BackgroundRepeat.NO_REPEAT, parseMaskRepeat("no-repeat no-repeat"))
    assertNull(parseMaskRepeat("repeat-x repeat"))
    assertNull(parseMaskRepeat("bogus"))
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

  @Test
  fun bgLonghandsApplyBeforeAndAfterReplacingImages() {
    val node = Mason.shared.createNode()
    val style = node.style
    val sibling = Mason.shared.createNode()
    style.backgroundSize = "contain, 50% auto"
    style.backgroundRepeat = "space round, no-repeat"
    style.backgroundPositionX = "right 10dppx"
    style.backgroundImage = "url(a.png), url(b.png), url(c.png)"
    assertEquals(1, style.values.getInt(StyleKeys.BACKGROUND_REVISION))
    val layers = style.mBackground!!.layers
    assertEquals(listOf("contain", null, "contain"), layers.map { it.size?.keyword })
    assertEquals(0.5f, layers[1].size!!.width!!.fraction, 0f)
    assertEquals("space round", layers[0].repeat.value)
    assertEquals("no-repeat", layers[1].repeat.value)
    assertEquals(-10f, layers[2].position!!.x.px, 0f)

    style.backgroundRepeat = "repeat, invalid"
    assertEquals("space round", layers[0].repeat.value)
    assertEquals(1, style.values.getInt(StyleKeys.BACKGROUND_REVISION))
    style.backgroundPosition = "left bottom"
    style.backgroundClip = "text, padding-box"
    style.backgroundImage = "url(d.png), url(e.png)"
    val replaced = style.mBackground!!.layers
    assertEquals(0f, replaced[0].position!!.x.fraction, 0f)
    assertEquals(1f, replaced[0].position!!.y.fraction, 0f)
    assertEquals(listOf(BackgroundClip.TEXT, BackgroundClip.PADDING_BOX), replaced.map { it.clip })
    assertEquals("no-repeat", replaced[1].repeat.value)
    assertEquals(4, style.values.getInt(StyleKeys.BACKGROUND_REVISION))
    style.background = ""
    assertEquals(5, style.values.getInt(StyleKeys.BACKGROUND_REVISION))
    assertEquals(0, sibling.style.values.getInt(StyleKeys.BACKGROUND_REVISION))
  }

  @Test
  fun backgroundReplayResetsLonghandsAndPublishesOnce() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason.shared
      val view = mason.createView(instrumentation.targetContext)
      val style = view.style
      style.backgroundRepeat = "no-repeat"
      style.background = "url(initial.png) red"
      val revision = style.values.getInt(StyleKeys.BACKGROUND_REVISION)
      NodeHelper(mason).applyBackgroundBatch(view, """
        ["background","","0","background-image","url(replacement.png)","0","background-size","cover",""]
        """.trimIndent())
      assertEquals(revision + 1, style.values.getInt(StyleKeys.BACKGROUND_REVISION))
      assertEquals(0, style.backgroundColor)
      assertEquals("repeat", style.backgroundRepeat)
      assertEquals("cover", style.backgroundSize)
      assertEquals("replacement.png", style.mBackground!!.layers.single().image)
    }
  }

  @Test
  fun shadowRecordsAreStoredIndependently() {
    val node = Mason.shared.createNode()
    val sibling = Mason.shared.createNode()
    val style = node.style
    style.boxShadow = "2dppx 6dppx 4dppx red, inset 3dppx 4dppx blue"
    style.textShadow = "1dppx 5dppx green"
    assertEquals(1, style.values.getInt(StyleKeys.BOX_SHADOW_REVISION))
    assertEquals(1, style.values.getInt(StyleKeys.TEXT_SHADOW_REVISION))
    assertEquals(listOf(2f, 3f), style.boxShadows.map { it.offsetX })
    assertEquals(listOf(5f), style.textShadows.map { it.offsetY })
    assertEquals(0, sibling.style.values.getInt(StyleKeys.BOX_SHADOW_REVISION))
    style.boxShadow = "none"
    assertTrue(style.boxShadows.isEmpty())
    assertEquals(1, style.textShadows.size)
    assertEquals(2, style.values.getInt(StyleKeys.BOX_SHADOW_REVISION))
    assertEquals(1, style.values.getInt(StyleKeys.TEXT_SHADOW_REVISION))
  }

  @Test
  fun paintWritesDuringMeasureAreCommittedAfterLayout() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      val root = mason.createView(instrumentation.targetContext)
      val style = mason.createNode().style
      val sibling = mason.createNode().style
      val initialSlot = style.values
      var measured = false
      root.node.setMeasureFunction(object : MeasureFunc {
        override fun measure(knownWidth: Float, knownHeight: Float, availableWidth: Float, availableHeight: Float): Long {
          if (!measured) {
            assertTrue(mason.inCompute)
            measured = true
            style.boxShadow = "1dppx 2dppx red"
            style.boxShadow = "3dppx 4dppx blue"
            style.textShadow = "1dppx 2dppx red"
            style.filter = "blur(2dppx)"
            style.filter = "none"
            style.transform = "translateX(25%)"
            assertEquals(0, initialSlot.getInt(StyleKeys.BOX_SHADOW_REVISION))
            assertEquals(0, initialSlot.getInt(StyleKeys.TRANSFORM_REVISION))
            assertEquals(StyleState.INHERIT, initialSlot.get(StyleKeys.TEXT_SHADOW_STATE))
          }
          return MeasureOutput.make(10f, 20f)
        }
      })

      root.computeMaxContent()

      assertTrue(measured)
      assertEquals(1, style.values.getInt(StyleKeys.BOX_SHADOW_REVISION))
      assertEquals(listOf(3f), style.boxShadows.map { it.offsetX })
      assertEquals(1, style.values.getInt(StyleKeys.TEXT_SHADOW_REVISION))
      assertEquals(StyleState.SET, style.values.get(StyleKeys.TEXT_SHADOW_STATE))
      assertEquals(0, style.values.getInt(StyleKeys.FILTER_REVISION))
      assertEquals(1, style.values.getInt(StyleKeys.TRANSFORM_REVISION))
      assertEquals(0, sibling.values.getInt(StyleKeys.BOX_SHADOW_REVISION))
      assertEquals(StyleState.INHERIT, sibling.values.get(StyleKeys.TEXT_SHADOW_STATE))
    }
  }

  @Test
  fun filterChainsAreStoredIndependentlyAndReuseTheBaseOnPseudoReset() {
    val node = Mason.shared.createNode()
    val style = node.style
    style.filter = "blur(2dppx) opacity(.5)"
    style.backdropFilter = "brightness(.6)"
    assertEquals(1, style.values.getInt(StyleKeys.FILTER_REVISION))
    assertEquals(1, style.values.getInt(StyleKeys.BACKDROP_FILTER_REVISION))
    val base = style.mFilter
    assertEquals(2, base?.filters?.size)
    assertEquals(1, style.mBackdropFilter?.filters?.size)
    node.setPseudoString(PseudoState.HOVER.mask, "filter", "contrast(.75)")
    val hoverFilter = node.pseudoFilter(PseudoState.HOVER.mask)
    assertNotNull(hoverFilter)
    node.setPseudoString(PseudoState.HOVER.mask, "filter", "contrast(.75)")
    assertTrue(hoverFilter === node.pseudoFilter(PseudoState.HOVER.mask))
    node.setPseudo(PseudoState.HOVER, true)
    style.updateResolvedFilter()
    assertEquals("contrast(.75)", style.mFilter?.css)
    node.setPseudo(PseudoState.HOVER, false)
    style.updateResolvedFilter()
    assertTrue(base === style.mFilter)
    node.setPseudo(PseudoState.HOVER, true)
    node.clearPseudoString(PseudoState.HOVER.mask, "filter")
    style.updateResolvedFilter()
    assertTrue(base === style.mFilter)
    assertNull(node.pseudoFilter(PseudoState.HOVER.mask))
    style.backdropFilter = "none"
    assertNull(style.mBackdropFilter)
    assertEquals(1, style.values.getInt(StyleKeys.FILTER_REVISION))
    assertEquals(2, style.values.getInt(StyleKeys.BACKDROP_FILTER_REVISION))
  }
}
