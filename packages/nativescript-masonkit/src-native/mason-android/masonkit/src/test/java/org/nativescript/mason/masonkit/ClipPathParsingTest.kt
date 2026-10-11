package org.nativescript.mason.masonkit

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * `clip-path` parsing and geometry (ClipPath.kt). Lengths resolve through an explicit
 * [LengthContext], since `Mason.shared` loads the native library.
 */
class ClipPathParsingTest {

  private val ctx1 = LengthContext(scale = 1f, emBasis = 10f, rootFontSize = 16f, viewportWidth = 400f, viewportHeight = 800f)
  private val ctx2 = LengthContext(scale = 2f, emBasis = 10f, rootFontSize = 16f, viewportWidth = 400f, viewportHeight = 800f)

  private fun px(v: Float) = CssLength(v, "px")
  private fun pct(v: Float) = CssLength(v, "%")

  private fun shape(value: String): BasicShape = parseClipPath(value)!!.shape!!

  private fun resolve(value: String, w: Float, h: Float, ctx: LengthContext = ctx1): ResolvedClip {
    val v = parseClipPath(value)!!
    val box = referenceBox(v.box, w, h, FloatArray(4), FloatArray(4), FloatArray(4))
    return resolveBasicShape(v.shape!!, box, ctx)
  }

  private fun assertRect(expected: RectBox, actual: RectBox) {
    assertEquals(expected.l, actual.l, 1e-3f)
    assertEquals(expected.t, actual.t, 1e-3f)
    assertEquals(expected.r, actual.r, 1e-3f)
    assertEquals(expected.b, actual.b, 1e-3f)
  }

  // MARK: none and invalid input

  @Test
  fun noneEmptyAndUrlAreNoClip() {
    assertNull(parseClipPath(""))
    assertNull(parseClipPath("none"))
    assertNull(parseClipPath("NONE"))
    // No SVG <clipPath> elements exist here: an invalid reference is ignored.
    assertNull(parseClipPath("url(#clip)"))
    assertNull(parseClipPath("url(#clip) border-box"))
  }

  @Test
  fun invalidInputIsNoClip() {
    listOf(
      "bogus", "circle(", "foo(1px)", "inset()", "inset(1px 2px 3px 4px 5px)", "inset(red)",
      "inset(10px round)", "inset(10px round -2px)", "inset(10px round 1px / 2px / 3px)",
      "circle(10px 20px)", "circle(-5px)", "circle(at)", "circle(at left left)", "circle(at top 10px)",
      "ellipse(10px)", "ellipse(1px 2px 3px)", "polygon()", "polygon(1px)", "polygon(evenodd)",
      "polygon(1px 2px 3px)", "polygon(bogus, 0 0)", "path(M 0 0 L 10 10)", "path(evenodd)",
      "path(winding, 'M0 0')", "rect(1px 2px 3px)", "xywh(0 0 -1px 2px)",
      "border-box padding-box", "circle(1px) inset(1px)", "circle(1px) bogus-box",
    ).forEach { assertNull(it, parseClipPath(it)) }
  }

  // MARK: geometry boxes

  @Test
  fun boxAloneClipsToTheBox() {
    assertEquals(ClipPathValue(null, GeometryBox.PADDING_BOX), parseClipPath("padding-box"))
    assertEquals(ClipPathValue(null, GeometryBox.CONTENT_BOX), parseClipPath("content-box"))
    assertEquals(ClipPathValue(null, GeometryBox.MARGIN_BOX), parseClipPath("margin-box"))
    assertEquals(ClipPathValue(null, GeometryBox.BORDER_BOX), parseClipPath("border-box"))
    // The SVG boxes are the border box for a Mason element.
    assertEquals(ClipPathValue(null, GeometryBox.BORDER_BOX), parseClipPath("fill-box"))
    assertEquals(ClipPathValue(null, GeometryBox.BORDER_BOX), parseClipPath("stroke-box"))
    assertEquals(ClipPathValue(null, GeometryBox.BORDER_BOX), parseClipPath("view-box"))
  }

  @Test
  fun shapeAndBoxInEitherOrder() {
    val a = parseClipPath("content-box circle(10px)")!!
    val b = parseClipPath("circle(10px) content-box")!!
    assertEquals(a, b)
    assertEquals(GeometryBox.CONTENT_BOX, a.box)
    // Shapes default to the border box.
    assertEquals(GeometryBox.BORDER_BOX, parseClipPath("circle(10px)")!!.box)
  }

  @Test
  fun referenceBoxes() {
    val border = floatArrayOf(1f, 2f, 3f, 4f)
    val padding = floatArrayOf(5f, 6f, 7f, 8f)
    val margin = floatArrayOf(10f, 20f, 30f, 40f)
    assertRect(RectBox(0f, 0f, 100f, 60f), referenceBox(GeometryBox.BORDER_BOX, 100f, 60f, border, padding, margin))
    assertRect(RectBox(4f, 1f, 98f, 57f), referenceBox(GeometryBox.PADDING_BOX, 100f, 60f, border, padding, margin))
    assertRect(RectBox(12f, 6f, 92f, 50f), referenceBox(GeometryBox.CONTENT_BOX, 100f, 60f, border, padding, margin))
    assertRect(RectBox(-40f, -10f, 120f, 90f), referenceBox(GeometryBox.MARGIN_BOX, 100f, 60f, border, padding, margin))
  }

  @Test
  fun boxShapesFollowTheBorderRadius() {
    val radii = FloatArray(8) { 10f }
    val border = floatArrayOf(4f, 4f, 4f, 4f)
    val padding = floatArrayOf(3f, 3f, 3f, 3f)
    val margin = floatArrayOf(5f, 5f, 5f, 5f)
    val zero = FloatArray(4)
    val padBox = resolveBoxShape(GeometryBox.PADDING_BOX, 100f, 100f, radii, border, padding, zero)
    assertRect(RectBox(4f, 4f, 96f, 96f), padBox.rect)
    assertArrayEquals(FloatArray(8) { 6f }, padBox.radii, 1e-3f)
    val contentBox = resolveBoxShape(GeometryBox.CONTENT_BOX, 100f, 100f, radii, border, padding, zero)
    assertArrayEquals(FloatArray(8) { 3f }, contentBox.radii, 1e-3f)
    val marginBox = resolveBoxShape(GeometryBox.MARGIN_BOX, 100f, 100f, radii, zero, zero, margin)
    assertRect(RectBox(-5f, -5f, 105f, 105f), marginBox.rect)
    assertArrayEquals(FloatArray(8) { 15f }, marginBox.radii, 1e-3f)
    // A square corner stays square in the margin box.
    val square = resolveBoxShape(GeometryBox.MARGIN_BOX, 100f, 100f, FloatArray(8), zero, zero, margin)
    assertArrayEquals(FloatArray(8), square.radii, 0f)
  }

  // MARK: inset / rect / xywh

  @Test
  fun insetExpandsLikeMargin() {
    assertEquals(BasicShape.Inset(px(10f), px(10f), px(10f), px(10f)), shape("inset(10px)"))
    assertEquals(BasicShape.Inset(px(1f), pct(20f), px(1f), pct(20f)), shape("inset(1px 20%)"))
    assertEquals(BasicShape.Inset(px(1f), px(2f), px(3f), px(2f)), shape("inset(1px 2px 3px)"))
    assertEquals(BasicShape.Inset(px(1f), px(2f), px(3f), px(4f)), shape("INSET(1px 2px 3px 4px)"))
  }

  @Test
  fun insetRound() {
    val s = shape("inset(10px round 5px)") as BasicShape.Inset
    assertEquals(List(8) { px(5f) }, s.radii)
    val e = shape("inset(0 round 1px 2px / 3px)") as BasicShape.Inset
    // TL x/y, TR x/y, BR x/y, BL x/y
    assertEquals(listOf(px(1f), px(3f), px(2f), px(3f), px(1f), px(3f), px(2f), px(3f)), e.radii)
  }

  @Test
  fun insetResolves() {
    val r = resolve("inset(10px round 5px)", 100f, 100f, ctx2) as ResolvedClip.RoundRect
    assertRect(RectBox(20f, 20f, 80f, 80f), r.rect)
    assertArrayEquals(FloatArray(8) { 10f }, r.radii, 1e-3f)
    // Insets that add up past the box are scaled down to meet.
    val big = resolve("inset(60% 60%)", 100f, 100f) as ResolvedClip.RoundRect
    assertRect(RectBox(50f, 50f, 50f, 50f), big.rect)
    // Radii larger than the rectangle shrink to fit, keeping their ratio.
    val pill = resolve("inset(0 round 50px)", 40f, 40f) as ResolvedClip.RoundRect
    assertArrayEquals(FloatArray(8) { 20f }, pill.radii, 1e-3f)
    // em uses the element's font size, then the device scale.
    val em = resolve("inset(1em)", 100f, 100f, ctx2) as ResolvedClip.RoundRect
    assertRect(RectBox(20f, 20f, 80f, 80f), em.rect)
  }

  @Test
  fun rectAndXywh() {
    assertEquals(
      BasicShape.Rect(px(10f), null, pct(50f), px(5f), List(8) { px(2f) }),
      shape("rect(10px auto 50% 5px round 2px)")
    )
    val rect = resolve("rect(10px auto auto 20px)", 100f, 100f) as ResolvedClip.RoundRect
    assertRect(RectBox(20f, 10f, 100f, 100f), rect.rect)
    val rect2 = resolve("rect(10% 90% 50% 5px)", 100f, 200f) as ResolvedClip.RoundRect
    assertRect(RectBox(5f, 20f, 90f, 100f), rect2.rect)

    assertEquals(BasicShape.Xywh(px(10f), px(20f), px(30f), pct(40f)), shape("xywh(10px 20px 30px 40%)"))
    val xywh = resolve("xywh(10px 20px 30px 40px round 4px)", 100f, 100f) as ResolvedClip.RoundRect
    assertRect(RectBox(10f, 20f, 40f, 60f), xywh.rect)
    assertArrayEquals(FloatArray(8) { 4f }, xywh.radii, 1e-3f)
  }

  // MARK: circle / ellipse

  @Test
  fun circleParsing() {
    assertEquals(BasicShape.Circle(ShapeRadius.Length(pct(50f)), ShapePosition.CENTER), shape("circle(50%)"))
    assertEquals(BasicShape.Circle(ShapeRadius.ClosestSide, ShapePosition.CENTER), shape("circle()"))
    assertEquals(
      BasicShape.Circle(
        ShapeRadius.FarthestSide,
        ShapePosition(PositionAxis(CssLength.ZERO), PositionAxis(CssLength.ZERO))
      ),
      shape("circle(farthest-side at left top)")
    )
    // Keywords swap into x/y order.
    assertEquals(shape("circle(at left top)"), shape("circle(at top left)"))
  }

  @Test
  fun circleResolves() {
    // 50% of sqrt(w² + h²) / sqrt(2): for a square, half its side.
    assertEquals(ResolvedClip.Ellipse(20f, 20f, 20f, 20f), resolve("circle(50%)", 40f, 40f))
    assertEquals(ResolvedClip.Ellipse(50f, 30f, 30f, 30f), resolve("circle()", 100f, 60f))
    assertEquals(ResolvedClip.Ellipse(10f, 10f, 90f, 90f), resolve("circle(farthest-side at 10px 10px)", 100f, 60f))
    assertEquals(ResolvedClip.Ellipse(90f, 40f, 10f, 10f), resolve("circle(10px at right 10px bottom 20px)", 100f, 60f))
    val vw = resolve("circle(10vw at 25% 75%)", 100f, 100f) as ResolvedClip.Ellipse
    assertEquals(40f, vw.rx, 1e-3f)
    assertEquals(25f, vw.cx, 1e-3f)
    assertEquals(75f, vw.cy, 1e-3f)
    val corner = resolve("circle(closest-corner at 0 0)", 30f, 40f) as ResolvedClip.Ellipse
    assertEquals(0f, corner.rx, 1e-3f)
    val far = resolve("circle(farthest-corner at 0 0)", 30f, 40f) as ResolvedClip.Ellipse
    assertEquals(50f, far.rx, 1e-3f)
  }

  @Test
  fun ellipseParsingAndResolution() {
    assertEquals(
      BasicShape.Ellipse(ShapeRadius.ClosestSide, ShapeRadius.ClosestSide, ShapePosition.CENTER), shape("ellipse()")
    )
    assertEquals(ResolvedClip.Ellipse(0f, 0f, 20f, 30f), resolve("ellipse(20px 50% at 0 0)", 100f, 60f))
    assertEquals(
      ResolvedClip.Ellipse(25f, 30f, 25f, 30f), resolve("ellipse(closest-side farthest-side at 25% 50%)", 100f, 60f)
    )
    assertEquals(ResolvedClip.Ellipse(50f, 30f, 50f, 30f), resolve("ellipse()", 100f, 60f))
  }

  @Test
  fun positions() {
    fun pos(s: String) = parseShapePosition(s.split(" "))
    assertEquals(ShapePosition(PositionAxis(CssLength.HUNDRED_PERCENT), PositionAxis.CENTER), pos("right"))
    assertEquals(ShapePosition(PositionAxis.CENTER, PositionAxis(CssLength.HUNDRED_PERCENT)), pos("bottom"))
    assertEquals(ShapePosition(PositionAxis(px(10f)), PositionAxis.CENTER), pos("10px"))
    assertEquals(ShapePosition(PositionAxis(px(10f)), PositionAxis(pct(20f))), pos("10px 20%"))
    assertEquals(ShapePosition(PositionAxis(px(10f), true), PositionAxis(pct(20f), true)), pos("right 10px bottom 20%"))
    assertEquals(ShapePosition(PositionAxis(px(5f)), PositionAxis(CssLength.ZERO)), pos("top left 5px"))
    assertEquals(ShapePosition(PositionAxis.CENTER, PositionAxis(px(5f), true)), pos("center bottom 5px"))
    assertEquals(ShapePosition(PositionAxis(px(10f)), PositionAxis(CssLength.ZERO)), pos("10px top"))
    assertNull(pos("top 10px"))
    assertNull(pos("left right"))
    assertNull(pos("center 5px top"))
  }

  // MARK: polygon / path

  @Test
  fun polygon() {
    val p = shape("polygon(50% 0, 100% 100%, 0 100%)") as BasicShape.Polygon
    assertEquals(false, p.evenOdd)
    assertEquals(3, p.points.size)
    val r = resolve("polygon(50% 0, 100% 100%, 0 100%)", 40f, 40f) as ResolvedClip.Polygon
    assertArrayEquals(floatArrayOf(20f, 0f, 40f, 40f, 0f, 40f), r.points, 1e-3f)
    val eo = shape("polygon(evenodd, 0 0, 10px 0, 0 10px)") as BasicShape.Polygon
    assertTrue(eo.evenOdd)
    assertEquals(3, eo.points.size)
    assertEquals(false, (shape("polygon(nonzero, 0 0, 1px 1px)") as BasicShape.Polygon).evenOdd)
    // Device px at scale 2.
    val scaled = resolve("polygon(10px 5px, 0 0)", 40f, 40f, ctx2) as ResolvedClip.Polygon
    assertArrayEquals(floatArrayOf(20f, 10f, 0f, 0f), scaled.points, 1e-3f)
  }

  @Test
  fun pathUsesTheSvgPathParser() {
    val p = shape("path('M0 0 L10 0 L0 10 Z')") as BasicShape.PathData
    assertEquals(false, p.evenOdd)
    assertEquals(parseSvgPathData("M0 0 L10 0 L0 10 Z"), p.commands)
    val eo = shape("path(evenodd, \"M 0 0 h 10 v 10 z\")") as BasicShape.PathData
    assertTrue(eo.evenOdd)
    assertEquals(4, eo.commands.size)
    // Path data is CSS px from the reference box origin.
    val v = parseClipPath("path('M0 0 L10 0') content-box")!!
    val box = referenceBox(v.box, 100f, 100f, floatArrayOf(1f, 1f, 1f, 1f), floatArrayOf(2f, 2f, 2f, 2f), FloatArray(4))
    val r = resolveBasicShape(v.shape!!, box, ctx2) as ResolvedClip.PathShape
    assertEquals(3f, r.dx, 0f)
    assertEquals(3f, r.dy, 0f)
    assertEquals(2f, r.scale, 0f)
  }

  @Test
  fun radiiFitting() {
    val radii = floatArrayOf(30f, 30f, 30f, 30f, 30f, 30f, 30f, 30f)
    fitRadii(radii, 40f, 100f)
    assertArrayEquals(FloatArray(8) { 20f }, radii, 1e-3f)
  }
}
