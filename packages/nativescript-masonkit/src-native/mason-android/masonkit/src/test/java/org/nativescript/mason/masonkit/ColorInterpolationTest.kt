package org.nativescript.mason.masonkit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ColorInterpolationTest {

  private val red = 0xFFFF0000.toInt()
  private val blue = 0xFF0000FF.toInt()
  private val white = 0xFFFFFFFF.toInt()
  private val black = 0xFF000000.toInt()

  private fun a(c: Int) = (c ushr 24) and 0xFF
  private fun r(c: Int) = (c shr 16) and 0xFF
  private fun g(c: Int) = (c shr 8) and 0xFF
  private fun b(c: Int) = c and 0xFF

  private fun mix(from: Int, to: Int, space: ColorInterpolation.Space, hue: ColorInterpolation.HueMethod = ColorInterpolation.HueMethod.SHORTER) =
    interpolateArgb(from, to, 0.5, ColorInterpolation(space, hue))

  private fun assertChannels(expected: IntArray, actual: Int, tolerance: Int = 1) {
    val got = intArrayOf(r(actual), g(actual), b(actual))
    for (i in 0 until 3) {
      assertTrue("channel $i: expected ${expected.toList()}, got ${got.toList()}", kotlin.math.abs(expected[i] - got[i]) <= tolerance)
    }
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
    val (rest, method) = ColorInterpolation.extract("90deg in oklch longer hue")!!
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
  fun parseGradientSeparatesDirectionMethodAndStops() {
    val gradient = parseGradient("linear-gradient(to bottom right in oklab, #6366f1 0%, #d946ef 100%)")!!
    assertEquals("to bottom right", gradient.direction)
    assertEquals(listOf("#6366f1 0%", "#d946ef 100%"), gradient.stops)
    assertEquals(ColorInterpolation.Space.OKLAB, gradient.interpolation?.space)
  }

  @Test
  fun parseGradientDropsAMethodOnlyArgument() {
    val gradient = parseGradient("linear-gradient(in oklab, red, blue)")!!
    assertNull(gradient.direction)
    assertEquals(listOf("red", "blue"), gradient.stops)
  }

  // Reference values: CSS Color 4 `color-mix(in <space>, a, b)` at 50%.
  @Test
  fun oklabMidpointMatchesColorMix() {
    assertChannels(intArrayOf(140, 83, 162), mix(red, blue, ColorInterpolation.Space.OKLAB))
    assertChannels(intArrayOf(99, 99, 99), mix(white, black, ColorInterpolation.Space.OKLAB))
  }

  @Test
  fun labAndOklchMidpointsMatchColorMix() {
    assertChannels(intArrayOf(193, 0, 136), mix(red, blue, ColorInterpolation.Space.LAB))
    assertChannels(intArrayOf(186, 0, 194), mix(red, blue, ColorInterpolation.Space.OKLCH))
  }

  @Test
  fun srgbLinearMidpointIsBrighterThanGamma() {
    assertChannels(intArrayOf(188, 188, 188), mix(white, black, ColorInterpolation.Space.SRGB_LINEAR))
  }

  @Test
  fun oklchTakesTheShorterHueUnlessToldOtherwise() {
    val shorter = mix(red, blue, ColorInterpolation.Space.OKLCH)
    assertTrue(r(shorter) > g(shorter) && b(shorter) > g(shorter))
    val longer = mix(red, blue, ColorInterpolation.Space.OKLCH, ColorInterpolation.HueMethod.LONGER)
    assertTrue(g(longer) > r(longer))
  }

  @Test
  fun transparentEndpointsDoNotGreyTheGradient() {
    val mid = mix(red, 0x00000000, ColorInterpolation.Space.OKLAB)
    assertEquals(255, r(mid))
    assertEquals(0, g(mid))
    assertEquals(0, b(mid))
    assertTrue(kotlin.math.abs(a(mid) - 128) <= 1)
  }

  @Test
  fun achromaticEndpointsBorrowTheOtherHue() {
    val mid = mix(white, blue, ColorInterpolation.Space.HSL)
    assertTrue(b(mid) >= r(mid) && b(mid) >= g(mid))
  }

  @Test
  fun expandsEachSegmentAndKeepsTheOriginalStops() {
    val (colors, positions) = expandInterpolatedStops(
      intArrayOf(red, blue), floatArrayOf(0f, 1f), ColorInterpolation(ColorInterpolation.Space.OKLAB)
    )
    assertEquals(9, colors.size)
    assertEquals(red, colors.first())
    assertEquals(blue, colors.last())
    assertEquals(0.5f, positions[4], 1e-6f)
    assertChannels(intArrayOf(140, 83, 162), colors[4])
  }

  @Test
  fun hardStopsAndSrgbAreLeftAlone() {
    val colors = intArrayOf(red, blue, blue)
    val positions = floatArrayOf(0f, 0.5f, 0.5f)
    val (outColors, _) = expandInterpolatedStops(colors, positions, ColorInterpolation(ColorInterpolation.Space.OKLAB))
    assertEquals(3 + 7, outColors.size)

    val (srgb, _) = expandInterpolatedStops(colors, positions, ColorInterpolation(ColorInterpolation.Space.SRGB))
    assertTrue(srgb === colors)
  }
}
