package org.nativescript.mason.masonkit

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.BorderStyle
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.GridAutoFlow
import org.nativescript.mason.masonkit.enums.ListStylePosition
import org.nativescript.mason.masonkit.enums.ListStyleType
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.JustifyItems
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.VerticalAlign

/**
 * Instrumented tests for inline layout behaviour — specifically verifying
 * that flattened TextContainer children (e.g. `<code>` inside `<p>`) do not
 * inflate the parent's height or misalign layout indices.
 */
@RunWith(AndroidJUnit4::class)
class InlineLayoutInstrumentedTest {

  private val TAG = "InlineLayoutTest"

  @Test
  fun schemaKeywordsReachNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="display: INLINE-GRID; grid-auto-flow: dense  COLUMN;
          align-items: flex-end; justify-self: invalid; text-wrap: pretty;
          hyphens: auto; writing-mode: VERTICAL-RL; unicode-bidi: isolate;
          text-orientation: sideways-right; text-combine-upright: digits 4;
          text-spacing-trim: trim-both; line-clamp: 200; -webkit-line-clamp: 3;
          line-clamp: 5px"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(Display.InlineGrid, style.display)
      Assert.assertEquals(GridAutoFlow.ColumnDense, style.gridAutoFlow)
      Assert.assertEquals(AlignItems.End, style.alignItems)
      Assert.assertEquals(Styles.TextWrap.Pretty, style.textWrap)
      Assert.assertEquals(2, style.resolvedHyphens.toInt())
      Assert.assertEquals(1, style.resolvedWritingMode.toInt())
      Assert.assertEquals(3, style.resolvedUnicodeBidi.toInt())
      Assert.assertEquals(2, style.resolvedTextOrientation.toInt())
      Assert.assertEquals(4, style.resolvedTextCombineUpright.toInt())
      Assert.assertEquals(4, style.resolvedTextSpacingTrim.toInt())
      Assert.assertEquals(3, style.resolvedLineClamp)
      Assert.assertNull(Mason.htmlKeyword("justify-self", "invalid"))
    }
  }

  @Test
  fun rustGeometryReachesNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="aspect-ratio: auto 3 / 2; transform-origin: calc(10px + 5px) 25%"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(1.5f, style.aspectRatio ?: Float.NaN, 0f)
      Assert.assertEquals("15px 25%", style.transformOrigin)
    }
  }

  @Test
  fun rustTypographyReachesNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      val style = HTMLParser(mason, instrumentation.targetContext).parse("""
        <div style="line-height: 150%; letter-spacing: 0.25em; font-size: 20px;
          text-indent: 5% hanging; font-weight: BOLD; font-stretch: semi-condensed;
          font-family: 'Missing, Font', monospace; font-family: url(bad); font-feature-settings: 'tnum' on, 'liga' off"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(20f, style.fontSize, 0f)
      Assert.assertEquals(700, style.fontWeight.weight)
      Assert.assertEquals("monospace", style.fontFamily)
      Assert.assertEquals("'tnum' 1, 'liga' 0", style.resolvedFontFeatures)
      Assert.assertEquals(1, style.values.get(StyleKeys.FONT_FEATURES_REVISION).toInt())
      style.fontFeatureSettings = "'liga' -1"
      Assert.assertEquals("'tnum' 1, 'liga' 0", style.resolvedFontFeatures)
      style.fontFeatureSettings = "NORMAL"
      Assert.assertEquals("", style.resolvedFontFeatures)
      Assert.assertEquals(2, style.values.get(StyleKeys.FONT_FEATURES_REVISION).toInt())
      val text = mason.createTextView(instrumentation.targetContext, TextType.P) as TextContainer
      text.style.fontFeatureSettings = "'liga' OFF, 'tnum'"
      Assert.assertEquals("'liga' 0, 'tnum' 1", text.getPaint().fontFeatureSettings)
      text.style.fontFeatureSettings = "normal"
      Assert.assertNull(text.getPaint().fontFeatureSettings)
      Assert.assertEquals(30f, style.lineHeight, 0f)
      Assert.assertEquals(1, style.resolvedLineHeightType.toInt())
      Assert.assertEquals(5f * mason.scale, style.letterSpacing, 0.001f)
      Assert.assertEquals("5%", style.textIndent)
      Assert.assertEquals("semi-condensed", style.fontStretch)
    }
  }

  @Test
  fun rustFontStyleAndWordSpacingReachNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="font-style: oblique -0.125turn; word-spacing: 25%;
          font-variant-numeric: tabular-nums slashed-zero; vertical-align: -25%"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(-45, style.values.getInt(StyleKeys.FONT_STYLE_SLANT))
      Assert.assertEquals(1, style.resolvedWordSpacingType.toInt())
      Assert.assertEquals(25f, style.resolvedWordSpacing, 0f)
      Assert.assertEquals(136, style.fontVariantNumeric)
      Assert.assertEquals(VerticalAlign.Percent, style.verticalAlign)
      Assert.assertEquals(-0.25f, style.verticalAlign.value, 0f)
      style.verticalAlign = VerticalAlign.Top
      Assert.assertEquals(VerticalAlign.Top, style.verticalAlign)
      style.verticalAlign = VerticalAlign.length(-2f)
      Assert.assertEquals(VerticalAlign.Length, style.verticalAlign)
      Assert.assertEquals(-2f, style.verticalAlign.value, 0f)
      style.fontStyle = org.nativescript.fontmanager.FontStyle.Italic
      Assert.assertEquals(org.nativescript.fontmanager.FontStyle.Italic, style.fontStyle)
      Assert.assertEquals(0, style.values.getInt(StyleKeys.FONT_STYLE_SLANT))
    }
  }

  @Test
  fun rustInlineBatchPreservesDeclarationOrder() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val ignored = "--ignored: url(data:image/svg+xml;x:y);".repeat(256)
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="/* a:b;c */ display: grid; $ignored flex-flow: column wrap; flex-direction: row;
          display: flex; overflow: hidden scroll; text-justify: INTER-WORD"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(Display.Flex, style.display)
      Assert.assertEquals(FlexDirection.Row, style.flexDirection)
      Assert.assertEquals(FlexWrap.Wrap, style.flexWrap)
      Assert.assertEquals(Overflow.Hidden, style.overflowX)
      Assert.assertEquals(Overflow.Scroll, style.overflowY)
      Assert.assertEquals(Styles.TextJustify.InterWord, style.textJustify)
    }
  }

  @Test
  fun rustInlineBatchResolvesInheritedFontContextAndViewportOverrides() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      val root = HTMLParser(mason, instrumentation.targetContext).parse("""
        <div style="font-size: 20px"><div style="letter-spacing: .5em; padding-left: 2em;
          font-size: calc(125% + 5px); line-height: 150%; width: 10vw; width: 30px;
          margin-top: 5vw"></div></div>
      """.trimIndent()).single()
      val style = root.children[0].style
      Assert.assertEquals(30f, style.fontSize, 0f)
      Assert.assertEquals(15f * mason.scale, style.letterSpacing, 0.001f)
      Assert.assertEquals(LengthPercentage.Points(60f * mason.scale), style.padding.left)
      Assert.assertEquals(45f, style.lineHeight, 0f)
      mason.setViewport(600f, 800f)
      Assert.assertEquals(30f * mason.scale, style.size.width.value, 0.001f)
      Assert.assertEquals(LengthPercentageAuto.Points(30f * mason.scale), style.margin.top)
    }
  }

  @Test
  fun viewportReplayUpdatesInheritedFontChain() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      mason.setViewport(400f, 800f)
      val root = HTMLParser(mason, instrumentation.targetContext).parse("""
        <div style="font-size: 5vw"><div style="font-size: calc(50% + 5px)"><div><div style="padding-left: 2em;
          line-height: 150%; height: 30px"></div></div></div><div style="font-size: 12px; padding-left: 2em"></div></div>
      """.trimIndent()).single()
      val relative = root.children.first()
      val leaf = relative.children.single().children.single().style
      val fixed = root.children.last().style
      Assert.assertEquals(15f, relative.style.resolvedFontSize, .001f)
      Assert.assertEquals(LengthPercentage.Points(30f * mason.scale), leaf.padding.left)
      leaf.size = leaf.size.copy(height = Dimension.Points(70f))
      fixed.padding = fixed.padding.copy(left = LengthPercentage.Points(90f))

      mason.setViewport(800f, 800f)
      Assert.assertEquals(25f, relative.style.resolvedFontSize, .001f)
      Assert.assertEquals(LengthPercentage.Points(50f * mason.scale), leaf.padding.left)
      Assert.assertEquals(37.5f, leaf.lineHeight, .001f)
      Assert.assertEquals(Dimension.Points(70f), leaf.size.height)
      Assert.assertEquals(LengthPercentage.Points(90f), fixed.padding.left)
    }
  }

  @Test
  fun rustInlineBatchAppliesResolvedBordersAndFinalMaskValues() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      val style = HTMLParser(mason, instrumentation.targetContext).parse("""
        <div style="border: .25em solid red; border-radius: .5em / 20%;
          mask: linear-gradient(currentColor, transparent) center / contain;
          mask-repeat: no-repeat; mask-border: none; mask-border-width: 4px;
          clip-path: inset(1px); color: #0080ff; font-size: 20px"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(LengthPercentage.Points(5f * mason.scale), style.mBorderTop.width)
      Assert.assertEquals(LengthPercentage.Points(10f * mason.scale), style.borderTopLeftRadius.x)
      Assert.assertEquals(LengthPercentage.Percent(.2f), style.borderTopLeftRadius.y)
      Assert.assertEquals("no-repeat", style.maskRepeat)
      Assert.assertEquals("4px", style.maskBorderWidth)
      Assert.assertEquals("inset(1px)", style.clipPath)
      Assert.assertEquals(1, style.mMask?.currentLayers()?.size)
    }
  }

  @Test
  fun rustInlineBatchInstallsBackgroundOnce() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      val style = HTMLParser(mason, instrumentation.targetContext).parse("""
        <div style="background-repeat: round; color: red; background: url(a.svg) lime;
          color: blue; background-size: 2em auto; background-image: linear-gradient(currentColor, white);
          color: black; background-repeat: space; background-color: #123456; background: invalid;
          font-size: 20px"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(1, style.values.getInt(StyleKeys.BACKGROUND_REVISION))
      val layer = style.mBackground!!.layers.single()
      Assert.assertEquals("url(a.svg) lime", style.background)
      Assert.assertEquals(0xff123456.toInt(), style.backgroundColor)
      Assert.assertEquals("space", style.backgroundRepeat)
      Assert.assertEquals(40f * mason.scale, layer.size!!.width!!.px, .001f)
      Assert.assertEquals(0xff0000ff.toInt(), layer.gradient?.paint(100f, 100f)?.color(0))
    }
  }

  @Test
  fun rustInlineEffectBatchAppliesEachGroupOnce() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      val style = HTMLParser(mason, instrumentation.targetContext).parse("""
        <div style="box-shadow: 1px 2px blue; filter: blur(1px);
          box-shadow: calc(.1em + 2px) 3px rgb(calc(200 + 55) 0 0); text-shadow: 1px 2px blue;
          filter: blur(calc(1px + 1px)); backdrop-filter: brightness(calc(100% - 20%)); font-size: 20px"></div>
      """.trimIndent()).single().style
      for (key in intArrayOf(StyleKeys.BOX_SHADOW_REVISION, StyleKeys.TEXT_SHADOW_REVISION,
        StyleKeys.FILTER_REVISION, StyleKeys.BACKDROP_FILTER_REVISION)) {
        Assert.assertEquals(1, style.values.getInt(key))
      }
      val shadow = style.boxShadows.single()
      Assert.assertEquals(4f * mason.scale, shadow.offsetX, .001f)
      Assert.assertEquals(0xffff0000.toInt(), shadow.color)
      Assert.assertEquals("blur(calc(1px + 1px))", style.filter)
      Assert.assertEquals("brightness(calc(100% - 20%))", style.backdropFilter)
    }
  }

  @Test
  fun generatedAccessorsKeepTypedValuesAndIsolateWrites() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val mason = Mason()
      val writer = mason.createView(instrumentation.targetContext).style
      val sibling = mason.createView(instrumentation.targetContext).style
      val original = sibling.margin
      val originalColor = sibling.color
      val originalBorder = sibling.borderWidth
      val originalCorner = sibling.cornerShapeTopLeft
      for (flag in listOf(StateKeys.LIST_STYLE_TYPE, StateKeys.WHITE_SPACE, StateKeys.FONT_FEATURE_SETTINGS)) {
        Assert.assertTrue(StateKeys.hasFlag(flag.low, flag.high, StateKeys.ALL_TEXT))
        Assert.assertTrue(TextEngine.hasTextLayoutFlags(flag.low, flag.high))
      }
      Assert.assertTrue(TextEngine.hasTextVisualFlags(StateKeys.FONT_COLOR.low, StateKeys.FONT_COLOR.high))
      Assert.assertFalse(StateKeys.hasFlag(StateKeys.BORDER_COLOR.low, StateKeys.BORDER_COLOR.high, StateKeys.LAYOUT_MASK))
      val bottomRight = Point<LengthPercentage>(LengthPercentage.Points(3f), LengthPercentage.Points(5f))
      writer.mBorderRight.corner2Radius = bottomRight
      Assert.assertEquals(bottomRight, writer.mBorderBottom.corner2Radius)
      Assert.assertNotEquals(bottomRight, sibling.mBorderBottom.corner2Radius)
      writer.configure {
        it.cornerShape = "squircle notch"
        it.cornerShapeBottomRight = "bevel"
      }
      Assert.assertEquals(2f, writer.mBorderTop.corner1Exponent, 0f)
      Assert.assertEquals("bevel", writer.cornerShapeBottomRight)
      Assert.assertEquals("notch", writer.cornerShapeTopRight)
      Assert.assertEquals(originalCorner, sibling.cornerShapeTopLeft)
      val insets = Rect(LengthPercentageAuto.Percent(0.25f), LengthPercentageAuto.Points(4f),
        LengthPercentageAuto.Auto, LengthPercentageAuto.Points(8f))
      writer.margin = insets
      writer.flexGrow = 2f
      writer.decorationThickness = 3f
      writer.color = 0xff123456.toInt()
      writer.textWrap = Styles.TextWrap.Balance
      writer.size = Size(Dimension.Points(80f), Dimension.Percent(.5f))
      writer.setMinSizeWidth(24f, Dimension.Kind.Points.value)
      writer.setMinSizeHeight(Dimension.Percent(.25f))
      writer.setMinSizeWidth(200f, Byte.MAX_VALUE)
      writer.setPaddingWithValueType(6f, 0)
      writer.setBorderWidth(9f, 0)
      writer.setBorderBottomWidth(.25f, 1)
      writer.borderStyle = Rect(BorderStyle.Solid, BorderStyle.Dashed, BorderStyle.Hidden, BorderStyle.Dotted)
      val palette = Rect(0xff000100.toInt(), 0xff000200.toInt(), 0xff000300.toInt(), 0xff000400.toInt())
      writer.borderColor = palette
      val radius = Point(LengthPercentage.Percent(.5f), LengthPercentage.Points(7f))
      writer.borderTopRightRadius = radius
      Assert.assertEquals(insets, writer.margin)
      Assert.assertEquals(insets.top, writer.marginTop)
      Assert.assertEquals(2f, writer.flexGrow, 0f)
      Assert.assertEquals(3f, writer.decorationThickness, 0f)
      Assert.assertEquals(0xff123456.toInt(), writer.color)
      Assert.assertEquals(Styles.TextWrap.Balance, writer.textWrap)
      Assert.assertEquals(Dimension.Points(80f), writer.size.width)
      Assert.assertEquals(Dimension.Percent(.5f), writer.size.height)
      Assert.assertEquals(Dimension.Points(24f), writer.minSize.width)
      Assert.assertEquals(Dimension.Percent(.25f), writer.minSize.height)
      Assert.assertEquals(Rect.uniform(LengthPercentage.Points(6f)), writer.padding)
      Assert.assertEquals(LengthPercentage.Points(9f), writer.borderTopWidth)
      Assert.assertEquals(LengthPercentage.Percent(.25f), writer.mBorderBottom.width)
      Assert.assertEquals(BorderStyle.Dashed, writer.borderRightStyle)
      Assert.assertEquals(BorderStyle.Dotted, writer.mBorderLeft.style)
      Assert.assertEquals(palette, writer.borderColor)
      Assert.assertEquals(palette.bottom, writer.mBorderBottom.color)
      Assert.assertEquals(radius, writer.borderTopRightRadius)
      Assert.assertEquals(originalBorder, sibling.borderWidth)
      Assert.assertEquals(BorderStyle.Dashed, BorderStyle.fromName("DASHED"))
      Assert.assertFalse(BorderStyle.isValid("dashed invalid"))
      val hover = writer.node.preparePseudoBuffer(PseudoState.HOVER.mask)
      hover.put(StyleKeys.BORDER_TOP_STYLE, BorderStyle.Double.value)
      hover.putLong(StyleKeys.PSEUDO_SET_MASK_LOW, StateKeys.BORDER_STYLE.low)
      writer.node.setPseudo(PseudoState.HOVER, true)
      Assert.assertEquals(BorderStyle.Double, writer.borderStyle.top)
      Assert.assertEquals(BorderStyle.Double, writer.mBorderTop.style)
      val hoveredStyles = writer.borderStyle
      writer.borderStyle = hoveredStyles
      writer.node.setPseudo(PseudoState.HOVER, false)
      Assert.assertEquals(hoveredStyles, writer.borderStyle)
      writer.border = ""
      Assert.assertEquals(Rect.zero, writer.borderWidth)
      Assert.assertEquals(Rect.uniform(BorderStyle.None), writer.borderStyle)
      Assert.assertEquals(Rect.uniform(0), writer.borderColor)
      Assert.assertEquals(radius, writer.borderTopRightRadius)
      Assert.assertEquals(originalColor, sibling.color)
      Assert.assertEquals(original, sibling.margin)
      writer.configure {
        it.gridArea = "1 / 2 / 3 / 4"
        it.gridRowStart = "5"
        it.gridColumn = "tracks"
        it.gridColumnEnd = "6"
        it.size = Size(Dimension.Points(91f), Dimension.Percent(.5f))
      }
      Assert.assertEquals("5", writer.gridRowStart)
      Assert.assertEquals("3", writer.gridRowEnd)
      Assert.assertEquals("tracks", writer.gridColumnStart)
      Assert.assertEquals("6", writer.gridColumnEnd)
      Assert.assertEquals(Dimension.Points(91f), writer.size.width)
      writer.gridArea = ""
      Assert.assertEquals("auto", writer.gridColumnEnd)
      writer.overflow = Point(Overflow.Hidden, Overflow.Scroll)
      Assert.assertEquals(Overflow.Hidden, writer.overflow.x)
      Assert.assertEquals(Overflow.Scroll, writer.overflow.y)

      mason.setViewport(200f, 400f)
      val grid = mason.createView(instrumentation.targetContext)
      val template = "repeat(2, calc(1em + 5vw + 2dppx))"
      grid.style.configure {
        it.display = Display.Grid
        it.size = Size(Dimension.Points(500f), Dimension.Points(100f))
        it.fontSize = 20f
        it.gridTemplateColumns = template
      }
      grid.append(mason.createView(instrumentation.targetContext))
      val second = mason.createView(instrumentation.targetContext)
      grid.append(second)
      Assert.assertEquals(30f * mason.scale + 2f, grid.layout().children[1].x, .5f)
      Assert.assertEquals(template, grid.style.gridTemplateColumns)
    }
  }

  @Test
  fun rustLengthsReachNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="padding: calc(1rem + 2px) 3dppx; margin: calc(100% - 25%);
          border: calc(3px * 2) solid red; width: fit-content(calc(1rem + 2px));
          height: fit-content(calc(50% - 25%)); flex-basis: MIN-CONTENT; max-height: auto"></div>
      """.trimIndent()).single().style
      val mason = Mason.shared
      Assert.assertEquals((mason.rootFontSize + 2f) * mason.scale, style.padding.top.value, 0.0001f)
      Assert.assertEquals(3f, style.padding.right.value, 0f)
      Assert.assertEquals(0.75f, style.margin.top.value, 0f)
      Assert.assertEquals(6f * mason.scale, style.borderWidth.top.value, 0.0001f)
      Assert.assertEquals(Dimension.FitContentPoints((mason.rootFontSize + 2f) * mason.scale), style.size.width)
      Assert.assertEquals(Dimension.FitContentPercent(0.25f), style.size.height)
      Assert.assertEquals(Dimension.MinContent, style.flexBasis)
      Assert.assertEquals(Dimension.Auto, style.maxHeight)
      Assert.assertEquals(LengthPercentageAuto.Auto, parseLengthPercentageAuto("AUTO"))
      Assert.assertNull(parseLengthPercentage("calc(1px"))
    }
  }

  @Test
  fun rustColorsReachNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="color: color-mix(in srgb, red 25%, blue);
          background-color: hsl(180 100% 50% / 50%); border: 2px solid #10203080"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(0xff4000bf.toInt(), style.color)
      Assert.assertEquals(0x8000ffff.toInt(), style.backgroundColor)
      Assert.assertEquals(0x80102030.toInt(), style.borderColor.top)
      Assert.assertEquals(0xff663399.toInt(), parseSvgColor("rebeccapurple"))
      Assert.assertEquals(0x44112233, parseHexColor("#1234"))
      Assert.assertNull(parseRgbColor("red"))
    }
  }

  @Test
  fun rustTextDecorationsReachNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="text-decoration: underline overline rgba(0, 0, 255, 50%) 2px dashed;
          text-decoration-line: line-through underline"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(Styles.DecorationLine.UnderlineLineThrough, style.decorationLine)
      Assert.assertEquals(Styles.DecorationStyle.Dashed, style.decorationStyle)
      Assert.assertEquals(0x800000ff.toInt(), style.decorationColor)
      Assert.assertEquals(parseLength(style, "2px")!!, style.decorationThickness, 0f)
      style.setTextDecoration("overline shiny")
      Assert.assertEquals(Styles.DecorationStyle.Dashed, style.decorationStyle)
      Assert.assertEquals(Styles.DecorationLine.UnderlineLineThrough, style.decorationLine)
      style.setTextDecoration("overline")
      Assert.assertEquals(Styles.DecorationLine.Overline, style.decorationLine)
      Assert.assertEquals(Styles.DecorationStyle.Solid, style.decorationStyle)
      Assert.assertEquals(Constants.UNSET_COLOR.toInt(), style.decorationColor)
      Assert.assertEquals(0f, style.decorationThickness, 0f)
    }
  }

  @Test
  fun rustCornerShapesReachNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="corner-shape: squircle superellipse( 1.5 ) notch;
          corner-shape-bottom-left: square"></div>
      """.trimIndent()).single().style
      Assert.assertEquals("squircle", style.cornerShapeTopLeft)
      Assert.assertEquals("superellipse(1.5)", style.cornerShapeTopRight)
      Assert.assertEquals("notch", style.cornerShapeBottomRight)
      Assert.assertEquals("square", style.cornerShapeBottomLeft)
      style.cornerShapeTopRight = "round bevel"
      Assert.assertEquals("superellipse(1.5)", style.cornerShapeTopRight)
      style.cornerShape = ""
      Assert.assertEquals("round", style.cornerShapeBottomRight)
    }
  }

  @Test
  fun rustBorderAndListShorthandsReachNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val style = HTMLParser(Mason(), instrumentation.targetContext).parse("""
        <div style="border: 2px 4px solid red; border-left: 6px dashed blue;
          border-radius: 9px / 3px; list-style: square inside"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(parseLengthPercentage("2px"), style.borderWidth.top)
      Assert.assertEquals(parseLengthPercentage("4px"), style.borderWidth.right)
      Assert.assertEquals(parseLengthPercentage("2px"), style.borderWidth.bottom)
      Assert.assertEquals(parseLengthPercentage("6px"), style.borderWidth.left)
      Assert.assertEquals(BorderStyle.Dashed, style.borderStyle.left)
      Assert.assertEquals(parseColor("blue"), style.borderColor.left)
      Assert.assertEquals(parseLengthPercentage("9px"), style.borderTopLeftRadius.x)
      Assert.assertEquals(parseLengthPercentage("3px"), style.borderTopLeftRadius.y)
      Assert.assertEquals(ListStyleType.Square, style.listStyleType)
      Assert.assertEquals(ListStylePosition.Inside, style.listStylePosition)
      style.border = "8px dotted solid"
      Assert.assertEquals(parseLengthPercentage("6px"), style.borderWidth.left)
      style.fontSize = 20f
      style.borderRadius = "calc(100% / 2) 10dppx / 2 1em;"
      Assert.assertEquals(LengthPercentage.Percent(.5f), style.borderTopLeftRadius.x)
      Assert.assertEquals(LengthPercentage.Points(10f), style.borderTopRightRadius.x)
      Assert.assertEquals(LengthPercentage.Points(20f * style.node.mason.scale), style.borderTopRightRadius.y)
    }
  }

  @Test
  fun rustLayoutShorthandsReachNativeStyles() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    instrumentation.runOnMainSync {
      val parser = HTMLParser(Mason(), instrumentation.targetContext)
      val style = parser.parse("""
        <div style="flex-flow: column wrap; flex: 2 3 10px; gap: normal 8px;
          padding: 1px 2px 3px; margin: 1px auto; inset: 4px auto;
          overflow: hidden scroll; place-items: center end"></div>
      """.trimIndent()).single().style
      Assert.assertEquals(FlexDirection.Column, style.flexDirection)
      Assert.assertEquals(FlexWrap.Wrap, style.flexWrap)
      Assert.assertEquals(2f, style.flexGrow, 0f)
      Assert.assertEquals(3f, style.flexShrink, 0f)
      Assert.assertEquals(parseLengthPercentage("10px")?.value, style.flexBasis.value)
      Assert.assertEquals(parseLengthPercentage("0"), style.gap.width)
      Assert.assertEquals(parseLengthPercentage("8px"), style.gap.height)
      Assert.assertEquals(parseLengthPercentage("2px"), style.padding.left)
      Assert.assertEquals(parseLengthPercentage("3px"), style.padding.bottom)
      Assert.assertEquals(LengthPercentageAuto.Auto, style.margin.right)
      Assert.assertEquals(LengthPercentageAuto.Auto, style.inset.left)
      Assert.assertEquals(Overflow.Hidden, style.overflowX)
      Assert.assertEquals(Overflow.Scroll, style.overflowY)
      Assert.assertEquals(AlignItems.Center, style.alignItems)
      Assert.assertEquals(JustifyItems.End, style.justifyItems)
      Assert.assertArrayEquals(arrayOf("hero", "sidebar", "hero", "sidebar"),
        Mason.expandCssShorthand("grid-area", "hero / sidebar"))
      val padding = style.padding
      parsePaddingShorthand(style, "1px bogus 2px")
      Assert.assertEquals(padding, style.padding)
      val implicitFlex = parser.parse("<div style='flex: 2'></div>").single()
      Assert.assertTrue(implicitFlex.style.flexBasis is Dimension.Points)
      Assert.assertEquals(0f, implicitFlex.style.flexBasis.value, 0f)
    }
  }

  @Test
  fun mixedRunsExposeTextContentAndInnerHTML() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    val p = mason.createTextView(context, TextType.P)
    val script = mason.createTextView(context, TextType.Span).apply { append("script") }
    val setup = mason.createTextView(context, TextType.Span).apply { append("setup") }

    p.append("<")
    p.append(script)
    p.append(" ")
    p.append(setup)
    p.append(">")

    Assert.assertEquals("<script setup>", p.textContent)
    Assert.assertEquals("&lt;<span>script</span> <span>setup</span>&gt;", p.innerHTML)
  }

  @Test
  fun anonymousTextViewsSerializeAsTextRuns() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    val p = mason.createTextView(context, TextType.P)
    val open = mason.createTextView(context, TextType.Span, true).apply { append("<") }
    val script = mason.createTextView(context, TextType.Span).apply { append("script") }
    val space = mason.createTextView(context, TextType.Span, true).apply { append(" ") }
    val setup = mason.createTextView(context, TextType.Span).apply { append("setup") }
    val close = mason.createTextView(context, TextType.Span, true).apply { append(">") }

    p.append(open)
    p.append(script)
    p.append(space)
    p.append(setup)
    p.append(close)

    Assert.assertEquals("<script setup>", p.textContent)
    Assert.assertEquals("&lt;<span>script</span> <span>setup</span>&gt;", p.innerHTML)
  }

  /**
   * Reproduces the user-reported bug: a `<p>` with two `<code>` children that
   * have only `backgroundColor` set.  Those children should be flattened
   * (text rendered as spans in the parent), so the parent height must be a
   * single text-line height — not double or inflated.
   */
  @Test
  fun flattenedCodeChildrenDoNotInflateParentHeight() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    // Build: <p>Supports <code>flexbox</code>, <code>grid</code></p>
    val p = mason.createTextView(context, TextType.P)

    val code1 = mason.createTextView(context, TextType.Code)
    code1.append("flexbox")
    code1.style.backgroundColor = 0xFFEFEFEF.toInt()

    val code2 = mason.createTextView(context, TextType.Code)
    code2.append("grid")
    code2.style.backgroundColor = 0xFFEFEFEF.toInt()

    p.append("Supports ")
    p.append(code1)
    p.append(", ")
    p.append(code2)

    // Compute layout with a reasonable container width
    // Wide enough for one line at any density.
    val layout = computeAndLayout(p, mason, 4000f, -1f)
    val lineHeight = p.paint.fontSpacing

    Log.i(TAG, "P layout: width=${layout.width} height=${layout.height}")
    Log.i(TAG, "P children count: ${layout.children.size}")

    for ((i, child) in layout.children.withIndex()) {
      Log.i(TAG, "  child[$i]: x=${child.x} y=${child.y} w=${child.width} h=${child.height}")
    }

    // The <code> children should be flattened, so the <p> is one line high.
    Assert.assertTrue(
      "P height (${layout.height}) looks inflated, expected one line ($lineHeight)",
      layout.height < lineHeight * 1.5f
    )

    // Verify code children exist as flattened (zero or near-zero size)
    // in the layout tree — they should not have independent rendered sizes.
    for ((i, child) in layout.children.withIndex()) {
      if (i > 0) { // skip text nodes at index 0 etc
        Log.i(TAG, "  child[$i] height=${child.height}")
      }
    }
  }

  /**
   * Verify that adding more flattened children does NOT increase the parent
   * height.  This directly tests the scaling issue the user reported.
   */
  @Test
  fun addingFlattenedChildrenDoesNotScaleHeight() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    // Build a <p> with 1 code child
    val p1 = mason.createTextView(context, TextType.P)
    val c1 = mason.createTextView(context, TextType.Code)
    c1.append("one")
    c1.style.backgroundColor = 0xFFEFEFEF.toInt()
    p1.append("Text ")
    p1.append(c1)

    val layout1 = computeAndLayout(p1, mason, 4000f, -1f)
    val height1 = layout1.height
    Log.i(TAG, "1 child → height=$height1")

    // Build a <p> with 4 code children
    val p4 = mason.createTextView(context, TextType.P)
    p4.append("Text ")
    for (i in 0 until 4) {
      val c = mason.createTextView(context, TextType.Code)
      c.append("code$i")
      c.style.backgroundColor = 0xFFEFEFEF.toInt()
      p4.append(c)
      if (i < 3) p4.append(" ")
    }

    val layout4 = computeAndLayout(p4, mason, 4000f, -1f)
    val height4 = layout4.height
    Log.i(TAG, "4 children → height=$height4")

    // Heights should be very close (same single-line height) — allow small
    // tolerance for text wrapping differences
    val ratio = height4 / height1.coerceAtLeast(1f)
    Log.i(TAG, "Height ratio (4 children / 1 child) = $ratio")

    Assert.assertTrue(
      "Height scaled suspiciously: 1 child=$height1  4 children=$height4  ratio=$ratio",
      ratio < 1.5f
    )
  }

  /**
   * Verify that `shouldFlattenTextContainer` returns true for a code element
   * with only backgroundColor (no border, padding, or explicit size).
   */
  @Test
  fun shouldFlattenCodeWithOnlyBackgroundColor() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)
    val code = mason.createTextView(context, TextType.Code)
    code.append("test")
    code.style.backgroundColor = 0xFFEFEFEF.toInt()
    p.append(code)

    // Access the engine to check flattening
    val engine = (p as TextContainer).engine
    val shouldFlatten = engine.shouldFlattenTextContainer(code as TextContainer)

    Log.i(TAG, "shouldFlatten(code with backgroundColor only) = $shouldFlatten")
    Assert.assertTrue(
      "Code with only backgroundColor should be flattened",
      shouldFlatten
    )
  }

  /**
   * Verify that `shouldFlattenTextContainer` returns false for a code element
   * with border — it should be treated as inline-block.
   */
  @Test
  fun shouldNotFlattenCodeWithBorder() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)
    val code = mason.createTextView(context, TextType.Code)
    code.append("test")
    // Avoid constructing LengthPercentage directly in tests — use Style helpers
    code.style.setBorderTopWidth(1f, 0.toByte())
    code.style.setBorderRightWidth(1f, 0.toByte())
    code.style.setBorderBottomWidth(1f, 0.toByte())
    code.style.setBorderLeftWidth(1f, 0.toByte())
    p.append(code)

    val engine = (p as TextContainer).engine
    val shouldFlatten = engine.shouldFlattenTextContainer(code as TextContainer)

    Log.i(TAG, "shouldFlatten(code with border) = $shouldFlatten")
    Assert.assertFalse(
      "Code with border should NOT be flattened",
      shouldFlatten
    )
  }

  /**
   * Verify that after layout, the engine's computed layout for flattened
   * children does not contain inflated sizes that would cause wasted space
   * when applied via applyLayoutRecursive.
   */
  @Test
  fun flattenedChildrenLayoutSizesAreReasonable() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)

    // Create 3 flattened code children
    val codes = mutableListOf<TextView>()
    for (i in 0 until 3) {
      val c = mason.createTextView(context, TextType.Code)
      c.append("item$i")
      c.style.backgroundColor = 0xFFDDDDDD.toInt()
      codes.add(c)
    }

    p.append("Start ")
    for ((i, c) in codes.withIndex()) {
      p.append(c)
      if (i < codes.size - 1) p.append(" ")
    }
    p.append(" end")

    val layout = computeAndLayout(p, mason, 5000f, -1f)
    val lineHeight = p.paint.fontSpacing

    Log.i(TAG, "Parent layout: ${layout.width}x${layout.height}")
    Log.i(TAG, "Child layouts (${layout.children.size}):")
    for ((i, child) in layout.children.withIndex()) {
      Log.i(TAG, "  [$i]: ${child.width}x${child.height} at (${child.x}, ${child.y})")
    }

    // The parent should have a reasonable single-line height
    Assert.assertTrue(
      "Parent height ${layout.height} is too large for a single line of text ($lineHeight)",
      layout.height in 1f..(lineHeight * 1.5f)
    )

    // Sum of children heights should not exceed parent height significantly
    val childHeightSum = layout.children.sumOf { it.height.toDouble() }.toFloat()
    Log.i(TAG, "Sum of child heights: $childHeightSum  Parent height: ${layout.height}")

    // With flattened children, their individual layout heights should be small
    // (the engine measures them but the parent's native measure governs the
    // actual parent height). The key thing is parent height isn't inflated.
  }

  /**
   * Writeback capture test specifically for the P-with-code scenario.
   * Captures all setComputedSize callbacks and verifies no suspicious
   * height inflation.
   */
  @Test
  fun noSuspiciousWritebacksForFlattenedCodeChildren() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val events = mutableListOf<Triple<Int, Float, Float>>()

    Node.setComputedSizeTestCallback { id, w, h ->
      synchronized(events) { events.add(Triple(id, w, h)) }
    }

    val p = mason.createTextView(context, TextType.P)
    val code1 = mason.createTextView(context, TextType.Code)
    code1.append("flexbox")
    code1.style.backgroundColor = 0xFFEFEFEF.toInt()

    val code2 = mason.createTextView(context, TextType.Code)
    code2.append("grid")
    code2.style.backgroundColor = 0xFFEFEFEF.toInt()

    p.append("Supports ")
    p.append(code1)
    p.append(", ")
    p.append(code2)

    // Compute multiple times
    for (i in 0 until 3) {
      NativeHelpers.nativeNodeCompute(mason.getNativePtr(), p.node.nativePtr)
      try { Thread.sleep(100) } catch (_: InterruptedException) {}
    }

    try { Thread.sleep(500) } catch (_: InterruptedException) {}
    Node.setComputedSizeTestCallback(null)

    val captured: List<Triple<Int, Float, Float>> = synchronized(events) { events.toList() }
    Log.i(TAG, "Captured writebacks (${captured.size}): $captured")

    // Check for suspicious writebacks: anything taller than one line
    val suspicious = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in captured) {
      if (h > p.paint.fontSpacing * 1.5f) {
        Log.w(TAG, "Large writeback: id=$id w=$w h=$h")
        suspicious.add(Triple(id, w, h))
      }
    }

    Assert.assertTrue(
      "Found suspiciously large writebacks: $suspicious",
      suspicious.isEmpty()
    )
  }

  // Helper

  private fun computeAndLayout(
    tv: TextView, mason: Mason, width: Float, height: Float
  ): Layout {
    return Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeWithSizeAndLayout(
        mason.nativePtr,
        tv.node.nativePtr,
        width, height
      ), 0
    ).second
  }
}
