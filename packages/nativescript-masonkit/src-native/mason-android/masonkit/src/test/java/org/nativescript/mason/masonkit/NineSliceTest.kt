package org.nativescript.mason.masonkit

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** `border-image` / `mask-border` parsing and the shared 9-slice geometry (NineSlice.kt). */
class NineSliceTest {

  private val ctx = LengthContext(scale = 1f)
  private fun num(v: Float) = CssLength(v, null)
  private fun px(v: Float) = CssLength(v, "px")
  private fun pct(v: Float) = CssLength(v, "%")

  private val svgSquare =
    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 3'><rect width='3' height='3'/></svg>\")"

  // MARK: border-image shorthand

  @Test
  fun borderImageDefaults() {
    val spec = parseBorderImage("url(a.png)")!!
    assertEquals("url(a.png)", spec.source)
    assertEquals(List(4) { pct(100f) }, spec.slice)
    assertFalse(spec.fill)
    assertEquals(List(4) { num(1f) }, spec.width)
    assertEquals(List(4) { num(0f) }, spec.outset)
    assertEquals(BorderImageRepeat.STRETCH, spec.repeatX)
    assertEquals(BorderImageRepeat.STRETCH, spec.repeatY)
    assertFalse(spec.luminance)
  }

  @Test
  fun borderImageFullShorthand() {
    val spec = parseBorderImage("url(a.png) 30 fill / 10px / 2 round space")!!
    assertEquals(List(4) { num(30f) }, spec.slice)
    assertTrue(spec.fill)
    assertEquals(List(4) { px(10f) }, spec.width)
    assertEquals(List(4) { num(2f) }, spec.outset)
    assertEquals(BorderImageRepeat.ROUND, spec.repeatX)
    assertEquals(BorderImageRepeat.SPACE, spec.repeatY)
    // Any order, and `/` without spaces.
    assertEquals(spec, parseBorderImage("round space fill 30/10px/2 url(a.png)"))
  }

  @Test
  fun borderImageWidthOrOutsetOnly() {
    val widthOnly = parseBorderImage("linear-gradient(red, blue) 10% / 5px 2")!!
    assertEquals("linear", parseMaskGradient(widthOnly.source)?.type)
    assertEquals(listOf(px(5f), num(2f), px(5f), num(2f)), widthOnly.width)
    assertEquals(List(4) { num(0f) }, widthOnly.outset)
    val outsetOnly = parseBorderImage("url(a.png) 10 / / 4px")!!
    assertEquals(List(4) { num(1f) }, outsetOnly.width)
    assertEquals(List(4) { px(4f) }, outsetOnly.outset)
  }

  @Test
  fun borderImageNothingToDraw() {
    assertNull(parseBorderImage(""))
    assertNull(parseBorderImage("none"))
    assertNull(parseBorderImage("none 30 round"))
    // No source at all is `none`.
    assertNull(parseBorderImage("30 round"))
  }

  @Test
  fun borderImageInvalid() {
    listOf(
      "url(a.png) 30 /", "url(a.png) 30 / /", "url(a.png) fill 10 fill", "url(a.png) bogus",
      "url(a.png) 30 / 1 / 10%", "url(a.png) round round round", "element(#x) 30",
      "url(a.png) url(b.png)", "url(a.png) 10px", "url(a.png) 30 luminance",
    ).forEach { assertNull(it, parseBorderImage(it)) }
  }

  @Test
  fun unencodedSvgSourceSurvives() {
    val spec = parseBorderImage("$svgSquare 1 fill")!!
    assertEquals(svgSquare, spec.source)
    assertTrue(spec.fill)
    assertEquals(List(4) { num(1f) }, spec.slice)
  }

  // MARK: mask-border

  @Test
  fun maskBorderShorthand() {
    val l = splitBorderImageShorthand("url(a.png) 30 luminance", mask = true)!!
    assertArrayEquals(arrayOf("url(a.png)", "30", "auto", "0", "stretch", "luminance"), l)
    val d = splitBorderImageShorthand("url(a.png)", mask = true)!!
    assertArrayEquals(arrayOf("url(a.png)", "0", "auto", "0", "stretch", "alpha"), d)
    assertNull(splitBorderImageShorthand("url(a.png) alpha luminance", mask = true))
  }

  @Test
  fun maskBorderLonghandDefaults() {
    val spec = parseBorderImageLonghands("url(a.png)", mask = true)!!
    assertEquals(List(4) { num(0f) }, spec.slice)
    assertEquals(List<CssLength?>(4) { null }, spec.width)
    assertEquals(List(4) { num(0f) }, spec.outset)
    assertFalse(spec.luminance)
    assertTrue(parseBorderImageLonghands("url(a.png)", mode = "luminance", mask = true)!!.luminance)
    assertNull(parseBorderImageLonghands("url(a.png)", mode = "bogus", mask = true))
    assertNull(parseBorderImageLonghands("none", mask = true))
    assertNull(parseBorderImageLonghands("", mask = true))
    assertNull(parseBorderImageLonghands("url(a.png)", slice = "10px", mask = true))
  }

  @Test
  fun longhands() {
    assertEquals(listOf(num(10f), pct(20f), num(10f), pct(20f)) to true, parseBorderImageSlice("10 20% fill"))
    assertEquals(List(4) { num(10f) } to true, parseBorderImageSlice("fill 10"))
    assertNull(parseBorderImageSlice("10 fill 20"))
    assertNull(parseBorderImageSlice("-1"))
    assertNull(parseBorderImageSlice("fill"))
    assertEquals(listOf(null, px(10f), num(2f), pct(5f)), parseBorderImageWidth("auto 10px 2 5%"))
    assertNull(parseBorderImageWidth("-1px"))
    assertEquals(listOf(num(1f), px(2f), num(1f), px(2f)), parseBorderImageOutset("1 2px"))
    assertNull(parseBorderImageOutset("5%"))
    assertEquals(BorderImageRepeat.ROUND to BorderImageRepeat.ROUND, parseBorderImageRepeat("round"))
    assertEquals(BorderImageRepeat.REPEAT to BorderImageRepeat.SPACE, parseBorderImageRepeat("repeat space"))
    assertNull(parseBorderImageRepeat("stretch stretch stretch"))
    assertNull(parseBorderImageRepeat("no-repeat"))
  }

  // MARK: axis tiling

  private fun assertTiles(starts: FloatArray, size: Float, actual: AxisTiles) {
    assertArrayEquals(starts, actual.starts, 1e-3f)
    assertEquals(size, actual.size, 1e-3f)
  }

  @Test
  fun stretchFillsTheArea() {
    assertTiles(floatArrayOf(10f), 80f, axisTiles(10f, 80f, 30f, BorderImageRepeat.STRETCH))
  }

  @Test
  fun roundFitsAWholeNumber() {
    assertTiles(floatArrayOf(0f, 100f / 3, 200f / 3), 100f / 3, axisTiles(0f, 100f, 30f, BorderImageRepeat.ROUND))
    // At least one tile, even when the tile is wider than the area.
    assertTiles(floatArrayOf(5f), 20f, axisTiles(5f, 20f, 50f, BorderImageRepeat.ROUND))
  }

  @Test
  fun spaceSpreadsWholeTiles() {
    assertTiles(floatArrayOf(2.5f, 35f, 67.5f), 30f, axisTiles(0f, 100f, 30f, BorderImageRepeat.SPACE))
    // No whole tile fits: nothing is drawn.
    assertEquals(0, axisTiles(0f, 20f, 30f, BorderImageRepeat.SPACE).starts.size)
  }

  @Test
  fun repeatCentresATile() {
    // One tile centred on 50 (35..65), then outwards; the ends are cut by the region.
    assertTiles(floatArrayOf(-25f, 5f, 35f, 65f, 95f), 30f, axisTiles(0f, 100f, 30f, BorderImageRepeat.REPEAT))
    // Two tiles' room: the centred one leaves halves at both ends.
    assertTiles(floatArrayOf(-10f, 10f, 30f), 20f, axisTiles(0f, 40f, 20f, BorderImageRepeat.REPEAT))
  }

  // MARK: 9-slice layout

  private fun spec(value: String) = parseBorderImage(value)!!
  private val borders10 = floatArrayOf(10f, 10f, 10f, 10f)

  private fun piece(layout: NineSliceLayout, dst: RectBox) = layout.pieces.single { it.dst == dst }

  @Test
  fun stretchLayout() {
    // A 30x30 image sliced at 10 into a 60x60 box with 10px borders.
    val layout = layoutNineSlice(spec("url(a.png) 10"), 60f, 60f, borders10, 30f, 30f, 1f, ctx)
    assertEquals(RectBox(0f, 0f, 60f, 60f), layout.area)
    assertEquals(8, layout.pieces.size)
    val tl = piece(layout, RectBox(0f, 0f, 10f, 10f))
    assertEquals(RectBox(0f, 0f, 10f, 10f), tl.src)
    val br = piece(layout, RectBox(50f, 50f, 60f, 60f))
    assertEquals(RectBox(20f, 20f, 30f, 30f), br.src)
    val top = piece(layout, RectBox(10f, 0f, 50f, 10f))
    assertEquals(RectBox(10f, 0f, 20f, 10f), top.src)
    assertTiles(floatArrayOf(10f), 40f, top.xs)
    assertTiles(floatArrayOf(0f), 10f, top.ys)
    val left = piece(layout, RectBox(0f, 10f, 10f, 50f))
    assertEquals(RectBox(0f, 10f, 10f, 20f), left.src)
    assertTiles(floatArrayOf(10f), 40f, left.ys)
  }

  @Test
  fun fillAddsTheMiddle() {
    val layout = layoutNineSlice(spec("url(a.png) 10 fill"), 60f, 60f, borders10, 30f, 30f, 1f, ctx)
    assertEquals(9, layout.pieces.size)
    val middle = piece(layout, RectBox(10f, 10f, 50f, 50f))
    assertEquals(RectBox(10f, 10f, 20f, 20f), middle.src)
    assertTiles(floatArrayOf(10f), 40f, middle.xs)
    assertTiles(floatArrayOf(10f), 40f, middle.ys)
  }

  @Test
  fun roundAndRepeatEdges() {
    // midW = 50; the top slice (10 wide) is scaled by 10/10 and rounded into 5 tiles.
    val round = layoutNineSlice(spec("url(a.png) 10 round"), 70f, 60f, borders10, 30f, 30f, 1f, ctx)
    val top = piece(round, RectBox(10f, 0f, 60f, 10f))
    assertTiles(floatArrayOf(10f, 20f, 30f, 40f, 50f), 10f, top.xs)
    // 2x wider borders scale the edge tiles 2x along the edge too.
    val wide = layoutNineSlice(spec("url(a.png) 10 / 20px repeat stretch"), 100f, 100f, borders10, 30f, 30f, 1f, ctx)
    val wideTop = piece(wide, RectBox(20f, 0f, 80f, 20f))
    assertTiles(floatArrayOf(20f, 40f, 60f), 20f, wideTop.xs)
    val wideLeft = piece(wide, RectBox(0f, 20f, 20f, 80f))
    assertTiles(floatArrayOf(20f), 60f, wideLeft.ys)
  }

  @Test
  fun spaceMiddleUsesEdgeScales() {
    val layout = layoutNineSlice(spec("url(a.png) 10 fill / 20px space"), 100f, 100f, borders10, 30f, 30f, 1f, ctx)
    val middle = piece(layout, RectBox(20f, 20f, 80f, 80f))
    // Tiles are 20 (10 * 20/10): three fit in 60 with no spare room.
    assertTiles(floatArrayOf(20f, 40f, 60f), 20f, middle.xs)
    assertTiles(floatArrayOf(20f, 40f, 60f), 20f, middle.ys)
  }

  @Test
  fun outsetGrowsTheArea() {
    val layout = layoutNineSlice(spec("url(a.png) 10 / 1 / 5px 1"), 60f, 60f, borders10, 30f, 30f, 1f, ctx)
    // top/bottom 5px, left/right 1 x border width.
    assertEquals(RectBox(-10f, -5f, 70f, 65f), layout.area)
    assertNotNull(layout.pieces.firstOrNull { it.dst == RectBox(-10f, -5f, 0f, 5f) })
  }

  @Test
  fun overlappingWidthsScaleDown() {
    val layout = layoutNineSlice(spec("url(a.png) 10 / 40px"), 60f, 60f, borders10, 30f, 30f, 1f, ctx)
    assertArrayEquals(FloatArray(4) { 30f }, layout.widths, 1e-3f)
    // No room left for edges.
    assertEquals(4, layout.pieces.size)
  }

  @Test
  fun widthKinds() {
    val borders = floatArrayOf(4f, 6f, 8f, 10f)
    // auto = the slice at intrinsic size (unitPx device px per unit); number x border; % of the area.
    val layout = layoutNineSlice(spec("url(a.png) 10 / auto 2 10% 5px"), 100f, 50f, borders, 30f, 30f, 2f, ctx)
    assertArrayEquals(floatArrayOf(20f, 12f, 5f, 5f), layout.widths, 1e-3f)
    // Without an intrinsic size (gradients), auto falls back to the border width.
    val gradient = layoutNineSlice(spec("url(a.png) 10 / auto"), 100f, 50f, borders, 30f, 30f, 0f, ctx)
    assertArrayEquals(floatArrayOf(4f, 6f, 8f, 10f), gradient.widths, 1e-3f)
  }

  @Test
  fun slicesClampAndPercentages() {
    val pct = layoutNineSlice(spec("url(a.png) 50% 25%"), 60f, 60f, borders10, 40f, 20f, 1f, ctx)
    assertArrayEquals(floatArrayOf(10f, 10f, 10f, 10f), pct.slices, 1e-3f)
    // Slices past the image are 100%; meeting slices leave the edges and middle empty.
    val big = layoutNineSlice(spec("url(a.png) 100 fill"), 60f, 60f, borders10, 30f, 30f, 1f, ctx)
    assertArrayEquals(FloatArray(4) { 30f }, big.slices, 1e-3f)
    assertEquals(4, big.pieces.size)
    assertTrue(big.pieces.all { it.src == RectBox(0f, 0f, 30f, 30f) })
  }

  @Test
  fun maskBorderZeroSliceWithFillIsOnlyTheMiddle() {
    // mask-border initial slice 0 + width auto: no corners or edges; `fill` stretches the whole image.
    val mask = parseBorderImageLonghands(svgSquare, slice = "0 fill", mask = true)!!
    val layout = layoutNineSlice(mask, 40f, 40f, borders10, 3f, 3f, 1f, ctx)
    assertEquals(1, layout.pieces.size)
    val middle = layout.pieces.single()
    assertEquals(RectBox(0f, 0f, 3f, 3f), middle.src)
    assertEquals(RectBox(0f, 0f, 40f, 40f), middle.dst)
    val noFill = layoutNineSlice(parseBorderImageLonghands(svgSquare, slice = "0", mask = true)!!, 40f, 40f, borders10, 3f, 3f, 1f, ctx)
    assertEquals(0, noFill.pieces.size)
  }

  @Test
  fun rasterScaleCoversTheLargestPiece() {
    val layout = layoutNineSlice(spec("url(a.png) 1 fill / 10px"), 60f, 60f, borders10, 3f, 3f, 1f, ctx)
    // Corners: 1 unit -> 10px; middle: 1 unit -> 40px (stretch).
    assertEquals(40f, nineSliceRasterScale(layout, 1f), 1e-3f)
  }
}
