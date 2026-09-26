package org.nativescript.mason.masonkit

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test

class GradientStopsTest {

  private fun resolved(vararg positions: Float?) = resolveStopPositions(positions.toList())

  @Test
  fun twoPositionsBecomeTwoStopsOfOneColour() {
    assertEquals(
      listOf("blue", "red 10%", "red 30%", "green"),
      expandColorStops(listOf("blue", "red 10% 30%", "green"))
    )
  }

  @Test
  fun colourFunctionsWithSpacesStayWhole() {
    assertEquals(
      listOf("rgb(0, 0, 255) 0%", "rgb(0, 0, 255) 50%"),
      expandColorStops(listOf("rgb(0, 0, 255) 0% 50%"))
    )
  }

  @Test
  fun singlePositionStopsAndHintsAreUntouched() {
    val stops = listOf("red 10%", "40%", "rgba(0, 0, 0, 0.5)")
    assertEquals(stops, expandColorStops(stops))
  }

  @Test
  fun unpositionedStopsSpreadEvenly() {
    assertArrayEquals(floatArrayOf(0f, 0.5f, 1f), resolved(null, null, null), 1e-6f)
  }

  @Test
  fun unpositionedStopsSpreadBetweenTheirNeighbours() {
    assertArrayEquals(floatArrayOf(0f, 0.8f, 0.9f, 1f), resolved(null, 0.8f, null, null), 1e-6f)
    assertArrayEquals(floatArrayOf(0.1f, 0.55f, 1f), resolved(0.1f, null, null), 1e-6f)
  }

  @Test
  fun aPositionBeforeAnEarlierOneMovesUpToIt() {
    assertArrayEquals(floatArrayOf(0.5f, 0.5f, 1f), resolved(0.5f, 0.2f, null), 1e-6f)
  }

  @Test
  fun aLoneStopSitsAtTheStart() {
    assertArrayEquals(floatArrayOf(0f), resolved(null), 1e-6f)
  }
}
