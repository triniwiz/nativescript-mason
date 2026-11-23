package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class GradientInstrumentedTest {
  private fun num(value: Float) = CssLength(value, null)
  private fun px(value: Float) = CssLength(value, "px")


  @Test
  fun parseGradientSeparatesDirectionMethodAndStops() {
    val gradient = parseGradient("linear-gradient(to bottom right in oklab, #6366f1 0%, #d946ef 100%)")!!
    assertEquals("to bottom right", gradient.direction)
    assertEquals(listOf("#6366f1 0%", "#d946ef 100%"), gradient.stops)
    assertEquals(ColorInterpolation.Space.OKLAB, gradient.interpolation?.space)
  }

  @Test
  fun extractsTheMethodAndKeepsTheDirection() {
    val (rest, method) = ColorInterpolation.extract("to bottom right in oklab")!!
    assertEquals("to bottom right", rest)
    assertEquals(ColorInterpolation.Space.OKLAB, method.space)
    assertEquals(ColorInterpolation.HueMethod.SHORTER, method.hue)
  }

  @Test
  fun extractsAMethodThatComesFirstOrAlone() {
    assertEquals("to right", ColorInterpolation.extract("in oklch to right")!!.first)
    assertEquals("", ColorInterpolation.extract("in srgb-linear")!!.first)
    assertEquals(ColorInterpolation.Space.SRGB_LINEAR, ColorInterpolation.extract("in srgb-linear")!!.second.space)
  }

  @Test
  fun extractsHueMethods() {
    val (rest, method) = ColorInterpolation.extract("90deg in/**/oklch longer hue")!!
    assertEquals("90deg", rest)
    assertEquals(ColorInterpolation.HueMethod.LONGER, method.hue)
  }

  @Test
  fun unknownSpacesStillLeaveTheArgument() {
    val (rest, method) = ColorInterpolation.extract("to right in display-p3")!!
    assertEquals("to right", rest)
    assertEquals(ColorInterpolation.Space.SRGB, method.space)
  }

  @Test
  fun leavesArgumentsWithoutAMethodAlone() {
    assertNull(ColorInterpolation.extract("to right"))
    assertNull(ColorInterpolation.extract("circle at center"))
  }

  @Test
  fun parseGradientDropsAMethodOnlyArgument() {
    val gradient = parseGradient("linear-gradient(in oklab, red, blue)")!!
    assertNull(gradient.direction)
    assertEquals(listOf("red", "blue"), gradient.stops)
  }

  @Test
  fun parsedGradientKeepsThePrelude() {
    val g = parseMaskGradient("radial-gradient(circle closest-side, red, blue)")!!
    assertEquals("circle closest-side", g.direction)
    assertEquals(listOf("red", "blue"), g.stops)
    val at = parseMaskGradient("radial-gradient(at top left, red, blue)")!!
    assertEquals("at top left", at.direction)
    assertNull(parseMaskGradient("radial-gradient(red, blue)")!!.direction)
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
  fun borderImageWidthOrOutsetOnly() {
    val widthOnly = parseBorderImage("linear-gradient(red, blue) 10% / 5px 2")!!
    assertEquals("linear", parseMaskGradient(widthOnly.source)?.type)
    assertEquals(listOf(CssLength(5f, "dppx"), num(2f), CssLength(5f, "dppx"), num(2f)), widthOnly.width)
    assertEquals(List(4) { num(0f) }, widthOnly.outset)
    val outsetOnly = parseBorderImage("url(a.png) 10 / / 4px")!!
    assertEquals(List(4) { num(1f) }, outsetOnly.width)
    assertEquals(List(4) { CssLength(4f, "dppx") }, outsetOnly.outset)
  }

  @Test
  fun resolvesGradientMathWithTheCurrentBoxAndFont() {
    val layer = parseLayer("linear-gradient(calc(.25turn), red calc(50% - 1em), blue)")
    val gradient = checkNotNull(layer.gradient)
    val units = LengthContext(scale = 2f, emBasis = 10f)
    val first = checkNotNull(gradient.paint(200f, 80f, units))
    assertEquals(90f, first.angle, 0.0001f)
    assertEquals(0.4f, first.position(0), 0.0001f)
    assertEquals(0.45f, checkNotNull(gradient.paint(400f, 80f, units)).position(0), 0.0001f)
    assertEquals(0.3f, checkNotNull(gradient.paint(200f, 80f, units.copy(emBasis = 20f))).position(0), 0.0001f)
  }

  @Test
  fun storesStopsAcrossResizes() {
    val gradient = parseGradient("linear-gradient(currentColor 20dppx, white)", 0xff123456.toInt())!!
    val first = gradient.paint(200f, 100f)!!
    val second = gradient.paint(200f, 200f)!!
    assertEquals(0xff123456.toInt(), first.color(0))
    assertEquals(0.2f, first.position(0), 0.00001f)
    assertEquals(0.1f, second.position(0), 0.00001f)
    assertEquals(listOf("currentColor 20dppx", "white"), gradient.stops)
  }

  @Test
  fun radialGeometryUsesSharedBoxAndSizeRules() {
    fun check(css: String, x: Float, y: Float, rx: Float, ry: Float) {
      val paint = parseGradient(css)!!.paint(100f, 50f)!!
      assertEquals(x, paint.x0, 0.001f)
      assertEquals(y, paint.y0, 0.001f)
      assertEquals(rx, paint.radiusX, 0.001f)
      assertEquals(ry, paint.radiusY, 0.001f)
    }
    val diagonal = kotlin.math.hypot(50f, 25f)
    val sqrt2 = kotlin.math.sqrt(2f)
    check("radial-gradient(red, blue)", 50f, 25f, 50f * sqrt2, 25f * sqrt2)
    check("radial-gradient(ellipse, red, blue)", 50f, 25f, 50f * sqrt2, 25f * sqrt2)
    check("radial-gradient(circle, red, blue)", 50f, 25f, diagonal, diagonal)
    check("radial-gradient(circle closest-side at 20% 20%, red, blue)", 20f, 10f, 10f, 10f)
    check("radial-gradient(circle farthest-side at 20% 20%, red, blue)", 20f, 10f, 80f, 80f)
    val near = kotlin.math.hypot(20f, 10f)
    check("radial-gradient(circle closest-corner at 20% 20%, red, blue)", 20f, 10f, near, near)
    check("radial-gradient(closest-side at 20% 20%, red, blue)", 20f, 10f, 20f, 10f)
    check("radial-gradient(ellipse farthest-side at 20% 20%, red, blue)", 20f, 10f, 80f, 40f)
    check("radial-gradient(circle 30dppx, red, blue)", 50f, 25f, 30f, 30f)
    check("radial-gradient(30dppx, red, blue)", 50f, 25f, 30f, 30f)
    check("radial-gradient(ellipse 40dppx 20%, red, blue)", 50f, 25f, 40f, 10f)
    check("radial-gradient(25% 50%, red, blue)", 50f, 25f, 25f, 25f)
  }

  @Test
  fun conicGeometryAndTypedCopiesUseSharedDirections() {
    val conic = parseGradient("conic-gradient(at right 20dppx bottom 10dppx from 100grad, red, blue)")!!
      .paint(200f, 100f)!!
    assertEquals(180f, conic.x0, 0.001f)
    assertEquals(90f, conic.y0, 0.001f)
    assertEquals(90f, conic.angle, 0.001f)

    val linear = parseGradient("linear-gradient(to bottom, red, blue)")!!
    val copy = linear.copy(direction = "to right").paint(300f, 100f)!!
    assertEquals(0f, copy.x0, 0.001f)
    assertEquals(300f, copy.x1, 0.001f)
    assertEquals(copy.y0, copy.y1, 0.001f)
  }

}
