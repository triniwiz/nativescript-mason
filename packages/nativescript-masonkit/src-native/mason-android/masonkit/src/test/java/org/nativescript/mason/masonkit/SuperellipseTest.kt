package org.nativescript.mason.masonkit

import org.junit.Assert.*
import org.junit.Test
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Unit tests for superellipse curve math used in Border.kt.
 * These verify the parametric superellipse formula:
 *   x = cos(angle)^exponent
 *   y = sin(angle)^exponent
 * which is used by BorderRenderer.addCorner / addCornerToPath.
 */
class SuperellipseTest {

  private val EPSILON = 1e-6

  /**
   * Compute a superellipse point for a given parameter t in [0, 1].
   * Returns (cx, cy) where cx = cos(angle)^n, cy = sin(angle)^n.
   */
  private fun superellipsePoint(t: Double, exponent: Double): Pair<Double, Double> {
    val angle = t * Math.PI / 2.0
    val cx = cos(angle).pow(exponent)
    val cy = sin(angle).pow(exponent)
    return Pair(cx, cy)
  }

  /**
   * Compute a corner point for top-right corner matching Border.kt logic.
   * radius = (rx, ry), returns (px, py) in a [0, width] x [0, height] rect.
   */
  private fun topRightCornerPoint(
    t: Double, exponent: Double,
    rx: Double, ry: Double,
    width: Double, height: Double
  ): Pair<Double, Double> {
    val (cx, cy) = superellipsePoint(t, exponent)
    val px = width - rx * (1 - cx)
    val py = ry * (1 - cy)
    return Pair(px, py)
  }

  @Test
  fun superellipse_atStartAndEnd_matchesBoundaryPoints() {
    // At t=0: angle=0, cos(0)^n=1, sin(0)^n=0
    val (cx0, cy0) = superellipsePoint(0.0, 0.5)
    assertEquals(1.0, cx0, EPSILON)
    assertEquals(0.0, cy0, EPSILON)

    // At t=1: angle=pi/2, cos(pi/2)^n≈0, sin(pi/2)^n=1
    val (cx1, cy1) = superellipsePoint(1.0, 0.5)
    assertEquals(0.0, cx1, 1e-4) // cos(pi/2) is not exactly 0 in floating point
    assertEquals(1.0, cy1, EPSILON)
  }

  @Test
  fun superellipse_atMidpoint_exponent1_isCircular() {
    // At exponent=1, superellipse should be a circle
    // At t=0.5 (angle=pi/4): cos(pi/4)=sin(pi/4)=1/sqrt(2)
    val (cx, cy) = superellipsePoint(0.5, 1.0)
    val expected = 1.0 / sqrt(2.0)
    assertEquals(expected, cx, EPSILON)
    assertEquals(expected, cy, EPSILON)
  }

  @Test
  fun superellipse_exponent1_satisfiesCircleEquation() {
    // For exponent=1, all points should satisfy x^2 + y^2 ≈ 1
    for (i in 0..16) {
      val t = i / 16.0
      val (cx, cy) = superellipsePoint(t, 1.0)
      val r2 = cx * cx + cy * cy
      assertEquals("At t=$t, x²+y² should ≈ 1", 1.0, r2, 1e-4)
    }
  }

  @Test
  fun superellipse_smallerExponent_producesSquarerCurve() {
    // With smaller exponent (more squircle), the midpoint value should be
    // closer to 1 (the corner pushes outward)
    val (cxCircle, _) = superellipsePoint(0.5, 1.0)
    val (cxSquircle, _) = superellipsePoint(0.5, 0.5)

    // squircle midpoint should be larger (closer to the corner)
    assertTrue(
      "Squircle (exp=0.5) midpoint ($cxSquircle) should be > circle (exp=1) midpoint ($cxCircle)",
      cxSquircle > cxCircle
    )
  }

  @Test
  fun superellipse_largerExponent_producesRounderCurve() {
    // With larger exponent, the midpoint moves closer to origin (more "pinched")
    val (cxCircle, _) = superellipsePoint(0.5, 1.0)
    val (cxRound, _) = superellipsePoint(0.5, 2.0)

    assertTrue(
      "exp=2 midpoint ($cxRound) should be < circle midpoint ($cxCircle)",
      cxRound < cxCircle
    )
  }

  @Test
  fun superellipse_curveIsMonotonic() {
    // cx should decrease monotonically as t goes from 0 to 1
    // cy should increase monotonically
    val exponents = doubleArrayOf(0.3, 0.5, 1.0, 2.0, 4.0)

    for (exp in exponents) {
      var prevCx = Double.MAX_VALUE
      var prevCy = -Double.MAX_VALUE

      for (i in 0..16) {
        val t = i / 16.0
        val (cx, cy) = superellipsePoint(t, exp)

        assertTrue("cx should decrease at t=$t, exp=$exp", cx <= prevCx + EPSILON)
        assertTrue("cy should increase at t=$t, exp=$exp", cy >= prevCy - EPSILON)

        prevCx = cx
        prevCy = cy
      }
    }
  }

  @Test
  fun superellipse_symmetryAtMidpoint() {
    // At t=0.5 (angle=pi/4), cx and cy should be equal for any exponent
    val exponents = doubleArrayOf(0.3, 0.5, 1.0, 1.5, 2.0, 4.0)

    for (exp in exponents) {
      val (cx, cy) = superellipsePoint(0.5, exp)
      assertEquals("cx and cy should be equal at midpoint for exp=$exp", cx, cy, EPSILON)
    }
  }

  @Test
  fun topRightCorner_startEndPoints() {
    val rx = 20.0
    val ry = 20.0
    val width = 100.0
    val height = 100.0

    // At t=0: point should be at (width - rx*(1-1), ry*(1-0)) = (width, ry) - wait...
    // Actually: px = width - rx*(1 - cx) where cx = cos(0)^n = 1
    // So px = width - rx*(1-1) = width, py = ry*(1-0) = 0
    // This is the start of the top-right corner arc: (width, 0) -> just past the top edge
    // Wait, looking at the code flow: the path moves along the top edge to (width-trX, 0),
    // then addCorner adds the curve from there going down the right side.

    val (px0, py0) = topRightCornerPoint(0.0, 0.5, rx, ry, width, height)
    assertEquals("Start x should be at width", width, px0, EPSILON)
    assertEquals("Start y should be at 0", 0.0, py0, EPSILON)

    val (px1, py1) = topRightCornerPoint(1.0, 0.5, rx, ry, width, height)
    assertEquals("End x should be at width", width, px1, 1e-3)
    assertEquals("End y should be at ry", ry, py1, EPSILON)
  }

  @Test
  fun superellipse_variousExponents_stayInUnitQuadrant() {
    // All points should have 0 <= cx <= 1 and 0 <= cy <= 1
    val exponents = doubleArrayOf(0.1, 0.3, 0.5, 1.0, 2.0, 5.0, 10.0)

    for (exp in exponents) {
      for (i in 0..100) {
        val t = i / 100.0
        val (cx, cy) = superellipsePoint(t, exp)
        assertTrue("cx should be in [0,1] at t=$t, exp=$exp, got $cx", cx >= -EPSILON && cx <= 1.0 + EPSILON)
        assertTrue("cy should be in [0,1] at t=$t, exp=$exp, got $cy", cy >= -EPSILON && cy <= 1.0 + EPSILON)
      }
    }
  }

  @Test
  fun superellipse_exponent05_isSquircle() {
    // The "squircle" (exponent=0.5) should produce a curve where
    // the midpoint distance from origin is sqrt(2) * (1/sqrt(2))^0.5
    // For squircle at t=0.5: cx = cy = cos(pi/4)^0.5 = (1/sqrt(2))^0.5
    val (cx, cy) = superellipsePoint(0.5, 0.5)
    val expected = (1.0 / sqrt(2.0)).pow(0.5)
    assertEquals(expected, cx, EPSILON)
    assertEquals(expected, cy, EPSILON)

    // The squircle curve area should be larger than a circle (pushes outward)
    // Approximate by summing areas of trapezoids
    var circleArea = 0.0
    var squircleArea = 0.0
    val steps = 1000
    for (i in 0 until steps) {
      val t0 = i / steps.toDouble()
      val t1 = (i + 1) / steps.toDouble()

      val (cx0c, cy0c) = superellipsePoint(t0, 1.0)
      val (cx1c, cy1c) = superellipsePoint(t1, 1.0)
      circleArea += abs(cx0c - cx1c) * (cy0c + cy1c) / 2.0

      val (cx0s, cy0s) = superellipsePoint(t0, 0.5)
      val (cx1s, cy1s) = superellipsePoint(t1, 0.5)
      squircleArea += abs(cx0s - cx1s) * (cy0s + cy1s) / 2.0
    }

    assertTrue("Squircle area ($squircleArea) should be > circle area ($circleArea)", squircleArea > circleArea)
  }
}
