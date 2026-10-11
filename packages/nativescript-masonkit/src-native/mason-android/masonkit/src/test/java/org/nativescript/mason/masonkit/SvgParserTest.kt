package org.nativescript.mason.masonkit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.nativescript.mason.masonkit.SvgPathCommand.Close
import org.nativescript.mason.masonkit.SvgPathCommand.CubicTo
import org.nativescript.mason.masonkit.SvgPathCommand.LineTo
import org.nativescript.mason.masonkit.SvgPathCommand.MoveTo
import org.nativescript.mason.masonkit.SvgPathCommand.QuadTo
import kotlin.math.sqrt

/** Mirrors `SvgParserTests.swift`; keep the two in step. */
class SvgParserTest {

  private val eps = 1e-3f

  // Bootstrap Icons v1.11 (MIT), verbatim from github.com/twbs/icons.
  private val house = """<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house" viewBox="0 0 16 16">
  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
</svg>"""
  private val grid = """<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grid" viewBox="0 0 16 16">
  <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
</svg>"""
  private val layers = """<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-layers" viewBox="0 0 16 16">
  <path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882zm3.515 7.008L14.438 10 8 13.433 1.562 10 4.25 8.567l3.515 1.874a.5.5 0 0 0 .47 0zM8 9.433 1.562 6 8 2.567 14.438 6z"/>
</svg>"""
  private val checkLg = """<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
</svg>"""
  private val circleHalf = """<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-circle-half" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16"/>
</svg>"""

  // Bootstrap 5.3's own CSS data URIs, as they arrive (percent-encoded).
  private val bsSelectChevron =
    "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e"
  private val bsCheck =
    "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m5.5 10 3 3 6-6'/%3e%3c/svg%3e"
  private val bsAccordion =
    "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2300000080' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e"
  private val bsNavbarToggler =
    "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2833, 37, 41, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e"

  // MARK: helpers

  private data class Bounds(val minX: Float, val minY: Float, val maxX: Float, val maxY: Float)

  /** Bounds of the drawn outline, sampling curves finely. */
  private fun bounds(commands: List<SvgPathCommand>): Bounds {
    var minX = Float.MAX_VALUE
    var minY = Float.MAX_VALUE
    var maxX = -Float.MAX_VALUE
    var maxY = -Float.MAX_VALUE
    fun add(x: Float, y: Float) {
      minX = minOf(minX, x); minY = minOf(minY, y); maxX = maxOf(maxX, x); maxY = maxOf(maxY, y)
    }
    var px = 0f
    var py = 0f
    for (c in commands) {
      when (c) {
        is MoveTo -> { add(c.x, c.y); px = c.x; py = c.y }
        is LineTo -> { add(c.x, c.y); px = c.x; py = c.y }
        is CubicTo -> {
          for (i in 1..64) {
            val t = i / 64f
            val u = 1 - t
            add(
              u * u * u * px + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
              u * u * u * py + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y,
            )
          }
          px = c.x; py = c.y
        }

        is QuadTo -> {
          for (i in 1..64) {
            val t = i / 64f
            val u = 1 - t
            add(u * u * px + 2 * u * t * c.x1 + t * t * c.x, u * u * py + 2 * u * t * c.y1 + t * t * c.y)
          }
          px = c.x; py = c.y
        }

        Close -> {}
      }
    }
    return Bounds(minX, minY, maxX, maxY)
  }

  private fun cubicAt(p0x: Float, p0y: Float, c: CubicTo, t: Float): Pair<Float, Float> {
    val u = 1 - t
    return (u * u * u * p0x + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x) to
      (u * u * u * p0y + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y)
  }

  private fun endPoint(c: SvgPathCommand): Pair<Float, Float>? = when (c) {
    is MoveTo -> c.x to c.y
    is LineTo -> c.x to c.y
    is CubicTo -> c.x to c.y
    is QuadTo -> c.x to c.y
    Close -> null
  }

  private fun assertPoint(ex: Float, ey: Float, actual: Pair<Float, Float>?, tol: Float = eps) {
    assertNotNull(actual)
    assertEquals("x", ex, actual!!.first, tol)
    assertEquals("y", ey, actual.second, tol)
  }

  private fun assertBounds(expected: Bounds, actual: Bounds, tol: Float) {
    assertEquals("minX", expected.minX, actual.minX, tol)
    assertEquals("minY", expected.minY, actual.minY, tol)
    assertEquals("maxX", expected.maxX, actual.maxX, tol)
    assertEquals("maxY", expected.maxY, actual.maxY, tol)
  }

  private fun doc(svg: String): SvgDocument = parseSvgDocument(svg) ?: throw AssertionError("no document")

  // MARK: path grammar

  @Test
  fun moveLineAbsoluteAndRelative() {
    assertEquals(
      listOf(MoveTo(1f, 2f), LineTo(3f, 4f), MoveTo(4f, 6f), LineTo(5f, 7f)),
      parseSvgPathData("M1 2 L3 4 m1 2 l1 1")
    )
  }

  @Test
  fun implicitLinetoAfterMoveto() {
    // Extra pairs after M are absolute linetos, after m relative ones.
    assertEquals(
      listOf(MoveTo(2f, 5f), LineTo(8f, 11f), LineTo(14f, 5f)),
      parseSvgPathData("m2 5 6 6 6-6")
    )
    assertEquals(
      listOf(MoveTo(0f, 0f), LineTo(1f, 1f), LineTo(2f, 0f)),
      parseSvgPathData("M0 0 1 1 2 0")
    )
  }

  @Test
  fun horizontalVerticalAndImplicitRepeats() {
    assertEquals(
      listOf(MoveTo(1f, 1f), LineTo(5f, 1f), LineTo(5f, 4f), LineTo(3f, 4f), LineTo(3f, 2f), LineTo(3f, 1f)),
      parseSvgPathData("M1 1H5V4h-2v-2-1")
    )
  }

  @Test
  fun compactNumbers() {
    assertEquals(
      listOf(MoveTo(1.5f, 0.5f), LineTo(-1f, -2f), LineTo(10f, 0.02f), LineTo(0.5f, 0.25f)),
      parseSvgPathData("M1.5.5L-1-2L1e1,2E-2L.5.25")
    )
  }

  @Test
  fun closeReturnsToSubpathStartAndNextSegmentStartsThere() {
    val cmds = parseSvgPathData("M10 10 l5 0 z l0 5")
    assertEquals(listOf(MoveTo(10f, 10f), LineTo(15f, 10f), Close, MoveTo(10f, 10f), LineTo(10f, 15f)), cmds)
  }

  @Test
  fun cubicAndSmoothCubic() {
    val cmds = parseSvgPathData("M0 0 C1 2 3 4 5 6 S9 10 11 12 s1 1 2 2")
    assertEquals(MoveTo(0f, 0f), cmds[0])
    assertEquals(CubicTo(1f, 2f, 3f, 4f, 5f, 6f), cmds[1])
    // First control point reflects (3,4) about (5,6).
    assertEquals(CubicTo(7f, 8f, 9f, 10f, 11f, 12f), cmds[2])
    // Relative: reflect (9,10) about (11,12) -> (13,14); ctrl2 = (12,13); end = (13,14).
    assertEquals(CubicTo(13f, 14f, 12f, 13f, 13f, 14f), cmds[3])
  }

  @Test
  fun smoothCubicWithoutPreviousCubicUsesCurrentPoint() {
    assertEquals(
      listOf(MoveTo(0f, 0f), CubicTo(0f, 0f, 1f, 1f, 2f, 0f)),
      parseSvgPathData("M0 0S1 1 2 0")
    )
  }

  @Test
  fun quadraticAndSmoothQuadratic() {
    val cmds = parseSvgPathData("M0 0 Q5 10 10 0 T20 0 t10 0 q1 1 2 0")
    assertEquals(QuadTo(5f, 10f, 10f, 0f), cmds[1])
    assertEquals(QuadTo(15f, -10f, 20f, 0f), cmds[2])
    assertEquals(QuadTo(25f, 10f, 30f, 0f), cmds[3])
    assertEquals(QuadTo(31f, 1f, 32f, 0f), cmds[4])
  }

  @Test
  fun implicitRepeatsOfCurves() {
    val cmds = parseSvgPathData("M0 0c1 1 2 1 3 0 1 1 2 1 3 0")
    assertEquals(3, cmds.size)
    assertEquals(CubicTo(4f, 1f, 5f, 1f, 6f, 0f), cmds[2])
  }

  @Test
  fun errorsKeepTheValidPrefix() {
    assertEquals(listOf(MoveTo(0f, 0f), LineTo(10f, 10f)), parseSvgPathData("M0 0 L10 10 L20"))
    assertEquals(emptyList<SvgPathCommand>(), parseSvgPathData("L10 10"))
    assertEquals(listOf(MoveTo(0f, 0f), LineTo(1f, 0f), Close), parseSvgPathData("M0 0 H1 Z 5 5"))
    assertEquals(listOf(MoveTo(0f, 0f)), parseSvgPathData("M0 0 X 5"))
  }

  // MARK: arcs

  @Test
  fun semicircleArcPassesThroughTheTop() {
    val cmds = parseSvgPathData("M0 0 A10 10 0 0 1 20 0")
    assertEquals(3, cmds.size) // move + two quarter cubics
    assertPoint(10f, -10f, endPoint(cmds[1]))
    assertPoint(20f, 0f, endPoint(cmds[2]))
    assertBounds(Bounds(0f, -10f, 20f, 0f), bounds(cmds), 0.01f)
  }

  @Test
  fun sweepFlagPicksTheOtherSide() {
    val cmds = parseSvgPathData("M0 0 A10 10 0 0 0 20 0")
    assertPoint(10f, 10f, endPoint(cmds[1]))
  }

  @Test
  fun compactArcFlags() {
    // a rx ry rot large sweep x y with the flags and x run together: `0110` = 0, 1, 10.
    val cmds = parseSvgPathData("M0 0a10 10 0 0110 10")
    assertEquals(2, cmds.size)
    val c = cmds[1] as CubicTo
    assertPoint(10f, 10f, c.x to c.y)
    // Quarter of the circle centred at (0, 10): midpoint at 45°.
    val half = sqrt(0.5f) * 10f
    assertPoint(half, 10f - half, cubicAt(0f, 0f, c, 0.5f), 0.01f)
  }

  @Test
  fun largeArcFlag() {
    // Same chord, large arc, negative sweep: three quarters of the circle centred at (0, 10).
    val cmds = parseSvgPathData("M0 0 A10 10 0 1 0 10 10")
    assertEquals(4, cmds.size)
    assertPoint(-10f, 10f, endPoint(cmds[1]))
    assertPoint(0f, 20f, endPoint(cmds[2]))
    assertPoint(10f, 10f, endPoint(cmds.last()))
    assertBounds(Bounds(-10f, 0f, 10f, 20f), bounds(cmds), 0.01f)
  }

  @Test
  fun tooSmallRadiiAreScaledUp() {
    val cmds = parseSvgPathData("M0 0 A1 1 0 0 1 20 0")
    assertPoint(10f, -10f, endPoint(cmds[1]), 0.01f)
    assertBounds(Bounds(0f, -10f, 20f, 0f), bounds(cmds), 0.01f)
  }

  @Test
  fun rotatedEllipticalArc() {
    // rx 20 turned 90° runs along y; ry 10 along x.
    val cmds = parseSvgPathData("M0 0 A20 10 90 0 1 0 40")
    assertPoint(0f, 40f, endPoint(cmds.last()))
    assertBounds(Bounds(0f, 0f, 10f, 40f), bounds(cmds), 0.02f)
  }

  @Test
  fun degenerateArcs() {
    assertEquals(listOf(MoveTo(0f, 0f), LineTo(5f, 5f)), parseSvgPathData("M0 0 A0 4 0 0 1 5 5"))
    assertEquals(listOf(MoveTo(3f, 3f)), parseSvgPathData("M3 3 A4 4 0 0 1 3 3"))
  }

  // MARK: shapes

  @Test
  fun rectCircleEllipseLinePolys() {
    val d = doc(
      """<svg viewBox="0 0 100 100">
        <rect x="1" y="2" width="10" height="20"/>
        <rect x="0" y="0" width="10" height="10" rx="20"/>
        <circle cx="50" cy="50" r="10"/>
        <ellipse cx="50" cy="50" rx="20" ry="5"/>
        <line x1="0" y1="0" x2="10" y2="10" stroke="red"/>
        <polyline points="0,0 10,0 10,10 5"/>
        <polygon points="0 0 10 0 10 10"/>
      </svg>"""
    )
    val shapes = d.shapes
    assertEquals(7, shapes.size)
    assertEquals(
      listOf(MoveTo(1f, 2f), LineTo(11f, 2f), LineTo(11f, 22f), LineTo(1f, 22f), Close),
      shapes[0].commands
    )
    // rx alone also sets ry; both clamp to half the size, so this is a circle.
    assertBounds(Bounds(0f, 0f, 10f, 10f), bounds(shapes[1].commands), 0.01f)
    assertTrue(shapes[1].commands.any { it is CubicTo })
    assertBounds(Bounds(40f, 40f, 60f, 60f), bounds(shapes[2].commands), 0.01f)
    assertBounds(Bounds(30f, 45f, 70f, 55f), bounds(shapes[3].commands), 0.01f)
    assertEquals(SvgPaint.None, shapes[4].fill) // a line is never filled
    assertEquals(SvgPaint.Color(0xFFFF0000.toInt()), shapes[4].stroke)
    // The odd coordinate is dropped; polylines stay open, polygons close.
    assertEquals(listOf(MoveTo(0f, 0f), LineTo(10f, 0f), LineTo(10f, 10f)), shapes[5].commands)
    assertEquals(Close, shapes[6].commands.last())
  }

  @Test
  fun roundedRectCorners() {
    val cmds = svgRectCommands(0f, 0f, 20f, 10f, 4f, null)
    assertEquals(MoveTo(4f, 0f), cmds[0])
    assertEquals(LineTo(16f, 0f), cmds[1])
    assertPoint(20f, 4f, endPoint(cmds[2]))
    assertBounds(Bounds(0f, 0f, 20f, 10f), bounds(cmds), 0.01f)
  }

  @Test
  fun emptyShapesAreSkipped() {
    val d = doc("""<svg viewBox="0 0 10 10"><rect width="0" height="5"/><circle r="0"/><path d=""/></svg>""")
    assertEquals(0, d.shapes.size)
  }

  // MARK: paint

  @Test
  fun fillRuleEvenOddAndNonzero() {
    val d = doc(
      """<svg viewBox="0 0 10 10" fill-rule="evenodd">
        <path d="M0 0h10v10H0z"/>
        <path fill-rule="nonzero" d="M0 0h10v10H0z"/>
        <g><path style="fill-rule: nonzero" d="M0 0h1v1H0z"/></g>
      </svg>"""
    )
    assertTrue(d.shapes[0].evenOdd)
    assertFalse(d.shapes[1].evenOdd)
    assertFalse(d.shapes[2].evenOdd)
  }

  @Test
  fun groupsInheritFillAndStroke() {
    val d = doc(
      """<svg viewBox="0 0 10 10">
        <g fill="red" stroke="blue" stroke-width="3" stroke-linecap="square">
          <rect width="1" height="1"/>
          <g fill="none" stroke-linejoin="bevel"><rect width="1" height="1"/></g>
          <rect width="1" height="1" style="fill:#00ff00;stroke:none"/>
        </g>
        <rect width="1" height="1"/>
      </svg>"""
    )
    val s = d.shapes
    assertEquals(SvgPaint.Color(0xFFFF0000.toInt()), s[0].fill)
    assertEquals(SvgPaint.Color(0xFF0000FF.toInt()), s[0].stroke)
    assertEquals(3f, s[0].strokeWidth, 0f)
    assertEquals(SvgLineCap.SQUARE, s[0].lineCap)
    assertEquals(SvgPaint.None, s[1].fill)
    assertEquals(SvgLineJoin.BEVEL, s[1].lineJoin)
    assertEquals(SvgPaint.Color(0xFF00FF00.toInt()), s[2].fill)
    assertFalse(s[2].hasStroke)
    // Defaults outside the group: black fill, no stroke.
    assertEquals(SvgPaint.Color(0xFF000000.toInt()), s[3].fill)
    assertEquals(SvgPaint.None, s[3].stroke)
  }

  @Test
  fun strokeAttributes() {
    val d = doc(
      """<svg viewBox="0 0 10 10"><path d="M0 0L5 5" fill="none" stroke="#123456" stroke-width="2.5"
        stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"
        stroke-dasharray="1 2 3" stroke-dashoffset="1"/></svg>"""
    )
    val s = d.shapes.single()
    assertFalse(s.hasFill)
    assertEquals(SvgPaint.Color(0xFF123456.toInt()), s.stroke)
    assertEquals(2.5f, s.strokeWidth, 0f)
    assertEquals(0.5f, s.strokeOpacity, 0f)
    assertEquals(SvgLineCap.ROUND, s.lineCap)
    assertEquals(SvgLineJoin.ROUND, s.lineJoin)
    assertEquals(10f, s.miterLimit, 0f)
    // An odd dash list repeats to an even one.
    assertEquals(listOf(1f, 2f, 3f, 1f, 2f, 3f), s.dashArray!!.toList())
    assertEquals(1f, s.dashOffset, 0f)
  }

  @Test
  fun opacityFoldsIntoASinglePaintAndGroupsOtherwise() {
    val d = doc(
      """<svg viewBox="0 0 10 10">
        <rect width="1" height="1" opacity=".5" fill-opacity=".5"/>
        <rect width="1" height="1" opacity=".5" stroke="red"/>
        <g opacity="0.25"><rect width="1" height="1"/></g>
      </svg>"""
    )
    val ops = d.ops
    assertEquals(0.25f, (ops[0] as SvgOp.Shape).shape.fillOpacity, 1e-6f)
    assertEquals(SvgOp.BeginGroup(0.5f), ops[1])
    assertTrue(ops[2] is SvgOp.Shape)
    assertEquals(SvgOp.EndGroup, ops[3])
    assertEquals(SvgOp.BeginGroup(0.25f), ops[4])
    assertTrue(ops[5] is SvgOp.Shape)
    assertEquals(SvgOp.EndGroup, ops[6])
  }

  @Test
  fun currentColorIsLeftForTheElementUnlessTheSvgSetsColor() {
    val d = doc(house)
    assertTrue(d.usesCurrentColor)
    assertEquals(SvgPaint.CurrentColor, d.shapes.single().fill)

    val own = doc("""<svg viewBox="0 0 1 1" color="#ff0000"><path fill="currentColor" stroke="currentColor" d="M0 0h1v1z"/></svg>""")
    assertFalse(own.usesCurrentColor)
    assertEquals(SvgPaint.Color(0xFFFF0000.toInt()), own.shapes.single().fill)
    assertEquals(SvgPaint.Color(0xFFFF0000.toInt()), own.shapes.single().stroke)
  }

  @Test
  fun urlPaintUsesItsFallback() {
    val d = doc(
      """<svg viewBox="0 0 1 1"><defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs>
        <path fill="url(#g) blue" d="M0 0h1v1z"/><path fill="url(#g)" stroke="red" d="M0 0h1v1z"/></svg>"""
    )
    assertEquals(2, d.shapes.size)
    assertEquals(SvgPaint.Color(0xFF0000FF.toInt()), d.shapes[0].fill)
    assertEquals(SvgPaint.None, d.shapes[1].fill)
  }

  @Test
  fun invalidPaintKeepsTheInheritedOne() {
    val d = doc("""<svg viewBox="0 0 1 1" fill="red"><path fill="notacolor" d="M0 0h1v1z"/></svg>""")
    assertEquals(SvgPaint.Color(0xFFFF0000.toInt()), d.shapes.single().fill)
  }

  // MARK: document structure

  @Test
  fun nonRenderedContentIsSkipped() {
    val d = doc(
      """<?xml version="1.0"?><!DOCTYPE svg><!-- <path d="M0 0h9v9z"/> -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
        <title>t</title><defs><path d="M0 0h1v1z"/></defs>
        <clipPath id="c"><rect width="5" height="5"/></clipPath>
        <path d="M0 0h2v2z"><title>has a child</title></path>
        <g display="none"><path d="M0 0h3v3z"/></g>
        <path visibility="hidden" d="M0 0h4v4z"/>
        <text>skip</text>
      </svg>"""
    )
    assertEquals(1, d.shapes.size)
    assertEquals(LineTo(2f, 0f), d.shapes.single().commands[1])
  }

  @Test
  fun transforms() {
    val d = doc(
      """<svg viewBox="0 0 10 10"><g transform="translate(2 3)"><rect width="1" height="1" transform="scale(2)"/></g>
        <rect width="1" height="1" transform="rotate(90 5 5)"/></svg>"""
    )
    assertEquals(listOf(2f, 0f, 0f, 2f, 2f, 3f), d.shapes[0].transform.toList())
    val r = d.shapes[1].transform
    // rotate(90, 5, 5) maps (0,0) to (10,0).
    assertEquals(10f, r[0] * 0 + r[2] * 0 + r[4], 1e-4f)
    assertEquals(0f, r[1] * 0 + r[3] * 0 + r[5], 1e-4f)
    assertNull(parseSvgTransform("translate(1 2"))
    assertEquals(listOf(1f, 0f, 1f, 1f, 0f, 0f), parseSvgTransform("skewX(45)")!!.map { Math.round(it * 1e4f) / 1e4f })
  }

  @Test
  fun intrinsicSizeAndViewport() {
    assertEquals(16f, doc(house).width, 0f)
    val vbOnly = doc("""<svg viewBox="0 0 20 10"><path d="M0 0h1v1z"/></svg>""")
    assertEquals(20f, vbOnly.width, 0f)
    assertEquals(10f, vbOnly.height, 0f)
    val widthOnly = doc("""<svg width="40px" viewBox="0 0 20 10"><path d="M0 0h1v1z"/></svg>""")
    assertEquals(20f, widthOnly.height, 0f)
    assertNull(parseSvgDocument("""<svg><path d="M0 0h1v1z"/></svg>"""))
    assertNull(parseSvgDocument("""<div/>"""))

    // xMidYMid meet: 20x10 into 40x40 scales by 2 and centres vertically.
    assertEquals(listOf(2f, 0f, 0f, 2f, 0f, 10f), vbOnly.viewportTransform(40f, 40f).toList())
    val none = doc("""<svg viewBox="0 0 20 10" preserveAspectRatio="none"><path d="M0 0h1v1z"/></svg>""")
    assertEquals(listOf(2f, 0f, 0f, 4f, 0f, 0f), none.viewportTransform(40f, 40f).toList())
    val slice = doc("""<svg viewBox="0 0 20 10" preserveAspectRatio="xMinYMin slice"><path d="M0 0h1v1z"/></svg>""")
    assertEquals(listOf(4f, 0f, 0f, 4f, 0f, 0f), slice.viewportTransform(40f, 40f).toList())
  }

  // MARK: real icons

  private fun checkIcon(svg: String, subpaths: Int, closes: Int, expected: Bounds, tol: Float) {
    val d = doc(svg)
    assertEquals(16f, d.width, 0f)
    assertNotNull(d.viewBox)
    val cmds = d.shapes.flatMap { it.commands }
    assertEquals("subpaths", subpaths, cmds.count { it is MoveTo })
    assertEquals("closes", closes, cmds.count { it == Close })
    assertBounds(expected, bounds(cmds), tol)
  }

  @Test
  fun bootstrapHouse() = checkIcon(house, 2, 2, Bounds(0.5f, 1.207f, 15.5f, 15f), 0.02f)

  @Test
  fun bootstrapGrid() = checkIcon(grid, 8, 8, Bounds(1f, 1f, 15f, 15f), 0.01f)

  // The 0.5-radius corner arcs reach just past x 0 / 16 and to y 1.5 / 14.5.
  @Test
  fun bootstrapLayers() = checkIcon(layers, 3, 3, Bounds(0f, 1.5f, 16f, 14.5f), 0.01f)

  @Test
  fun bootstrapCheckLg() {
    val cmds = doc(checkLg).shapes.single().commands
    assertEquals(1, cmds.count { it is MoveTo })
    assertEquals(Close, cmds.last())
    // Two implicit arcs (`a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0`), then
    // `l3.052 3.093 5.4-6.425` ends at (12.716, 3.992), next to where the path began.
    assertPoint(12.716f, 3.992f, endPoint(cmds[cmds.size - 2]), 0.001f)
    val b = bounds(cmds)
    assertTrue(b.minX > 2.9f && b.maxX < 14.2f && b.minY > 3.4f && b.maxY < 12.4f)
  }

  @Test
  fun bootstrapCircleHalf() {
    // Flags written `1 0` / `1 1` / `0 1` and a full circle from two arcs.
    checkIcon(circleHalf, 2, 1, Bounds(0f, 0f, 16f, 16f), 0.01f)
    val cmds = doc(circleHalf).shapes.single().commands
    assertPoint(8f, 16f, endPoint(cmds.last()))
  }

  @Test
  fun twoPathIconKeepsBothShapes() {
    val d = doc(
      """<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bootstrap-fill" viewBox="0 0 16 16">
  <path d="M6.375 7.125V4.658h1.78c.973 0 1.542.457 1.542 1.237 0 .802-.604 1.23-1.764 1.23zm0 3.762h1.898c1.184 0 1.81-.48 1.81-1.377 0-.885-.65-1.348-1.886-1.348H6.375z"/>
  <path d="M4.002 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4zm1.06 12V3.545h3.399c1.587 0 2.543.809 2.543 2.11 0 .884-.65 1.675-1.483 1.816v.1c1.143.117 1.904.931 1.904 2.033 0 1.488-1.084 2.396-2.888 2.396z"/>
</svg>"""
    )
    assertEquals(2, d.shapes.size)
    assertBounds(Bounds(0.002f, 0f, 16.002f, 16f), bounds(d.shapes[1].commands), 0.01f)
  }

  // MARK: Bootstrap's own data URIs

  @Test
  fun bootstrapChevronIsAStrokeNotAFill() {
    val d = doc(decodeSvgDataPayload(bsSelectChevron))
    val s = d.shapes.single()
    assertFalse(s.hasFill)
    assertEquals(SvgPaint.Color(0xFF343A40.toInt()), s.stroke)
    assertEquals(2f, s.strokeWidth, 0f)
    assertEquals(SvgLineCap.ROUND, s.lineCap)
    assertEquals(SvgLineJoin.ROUND, s.lineJoin)
    assertEquals(listOf(MoveTo(2f, 5f), LineTo(8f, 11f), LineTo(14f, 5f)), s.commands)
    assertFalse(d.usesCurrentColor)
  }

  @Test
  fun bootstrapCheckAndAccordionAndToggler() {
    val check = doc(decodeSvgDataPayload(bsCheck)).shapes.single()
    assertFalse(check.hasFill)
    assertEquals(SvgPaint.Color(0xFF000000.toInt()), check.stroke)
    assertEquals(listOf(MoveTo(5.5f, 10f), LineTo(8.5f, 13f), LineTo(14.5f, 7f)), check.commands)

    // #RRGGBBAA
    val accordion = doc(decodeSvgDataPayload(bsAccordion)).shapes.single()
    assertEquals(SvgPaint.Color(0x80000000.toInt()), accordion.stroke)

    val toggler = doc(decodeSvgDataPayload(bsNavbarToggler))
    val t = toggler.shapes.single()
    assertEquals(30f, toggler.width, 0f)
    val stroke = t.stroke as SvgPaint.Color
    assertEquals(0x00212529, stroke.argb and 0xFFFFFF)
    assertEquals(191f, ((stroke.argb ushr 24) and 0xFF).toFloat(), 1f)
    assertEquals(10f, t.miterLimit, 0f)
    assertEquals(3, t.commands.count { it is MoveTo })
  }

  @Test
  fun dataPayloadDecoding() {
    assertEquals("<svg a='1+1'>", decodeSvgDataPayload("%3csvg a='1+1'%3E"))
    assertEquals("100% %zz", decodeSvgDataPayload("100% %zz"))
    assertEquals("#é", decodeSvgDataPayload("%23%C3%A9"))
  }
}
