package org.nativescript.mason.masonkit

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.hypot

/**
 * Radial ending shapes (Background.kt). Lengths normally go through `Mason.shared`, which loads
 * the native library, so the radius tests pass a px-only parser instead.
 */
class RadialGradientTest {

  private val px: (String) -> BackgroundOffset? = { t ->
    when {
      t.endsWith("%") -> t.dropLast(1).toFloatOrNull()?.let { BackgroundOffset(it / 100f, 0f) }
      t.endsWith("px") -> t.dropLast(2).toFloatOrNull()?.let { BackgroundOffset(0f, it) }
      else -> null
    }
  }

  private fun radii(shape: String?, cx: Float = 50f, cy: Float = 25f) =
    radialGradientRadii(shape, cx, cy, 100f, 50f, px)

  @Test
  fun defaultIsAnEllipseToTheFarthestCorner() {
    val sqrt2 = 1.4142135f
    assertArrayEquals(floatArrayOf(50f * sqrt2, 25f * sqrt2), radii(null), 1e-3f)
    assertArrayEquals(floatArrayOf(50f * sqrt2, 25f * sqrt2), radii("ellipse"), 1e-3f)
  }

  @Test
  fun circleReachesTheFarthestCorner() {
    val r = hypot(50f, 25f)
    assertArrayEquals(floatArrayOf(r, r), radii("circle"), 1e-3f)
  }

  @Test
  fun sizeKeywordsFollowTheCentre() {
    // Centre at (20, 10) in a 100 x 50 box: closest sides 20 and 10, farthest 80 and 40.
    assertArrayEquals(floatArrayOf(10f, 10f), radii("circle closest-side", 20f, 10f), 1e-3f)
    assertArrayEquals(floatArrayOf(80f, 80f), radii("circle farthest-side", 20f, 10f), 1e-3f)
    val near = hypot(20f, 10f)
    assertArrayEquals(floatArrayOf(near, near), radii("circle closest-corner", 20f, 10f), 1e-3f)
    assertArrayEquals(floatArrayOf(20f, 10f), radii("closest-side", 20f, 10f), 1e-3f)
    assertArrayEquals(floatArrayOf(80f, 40f), radii("ellipse farthest-side", 20f, 10f), 1e-3f)
  }

  @Test
  fun explicitRadii() {
    assertArrayEquals(floatArrayOf(30f, 30f), radii("circle 30px"), 1e-3f)
    assertArrayEquals(floatArrayOf(30f, 30f), radii("30px"), 1e-3f)
    // Ellipse percentages resolve against the box width and height.
    assertArrayEquals(floatArrayOf(40f, 10f), radii("ellipse 40px 20%"), 1e-3f)
    assertArrayEquals(floatArrayOf(25f, 25f), radii("25% 50%"), 1e-3f)
  }

  @Test
  fun preludeIsNotAColourStop() {
    assertTrue(isRadialPrelude("circle"))
    assertTrue(isRadialPrelude("circle closest-side"))
    assertTrue(isRadialPrelude("at center"))
    assertTrue(isRadialPrelude("ellipse farthest-corner at 20% 30%"))
    assertTrue(isRadialPrelude("20% 40%"))
    assertFalse(isRadialPrelude("red"))
    assertFalse(isRadialPrelude("red 20%"))
    assertFalse(isRadialPrelude("rgba(0, 0, 0, 0.5) 10%"))
  }

  @Test
  fun shapePartDropsThePosition() {
    assertEquals("circle closest-side", radialShapePart("circle closest-side at 20% 30%"))
    assertNull(radialShapePart("at top left"))
    assertEquals("ellipse", radialShapePart("ellipse"))
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
}
