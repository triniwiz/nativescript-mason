package org.nativescript.mason.masonkit

import org.junit.Assert.assertEquals
import org.junit.Test

class NumberUnitScanTest {
  private fun viaRegex(s: String): Pair<Float, String?>? {
    val m = lengthPercentageRegex.matchEntire(s) ?: return null
    val num = m.groupValues[1].toFloatOrNull() ?: return null
    return num to m.groupValues[2].ifEmpty { null }
  }

  private fun viaScan(s: String): Pair<Float, String?>? =
    scanNumberUnit(s)?.let { it.num to it.unit }

  @Test
  fun matchesRegex() {
    val cases = listOf(
      "0", "4", "4px", "-4px", "4.5px", "4.px", ".5px", "4e2", "4E-2px", "4e", "4e+px", "1.5e+3dip",
      "50%", "10dppx", "2rem", "2em", "3vw", "3vh", "3vmin", "3vmax", "12pt", "2e3em", "2e+em", "2E", "1.5em", "4 px", "4PX", "px",
      "", "-", "--4", "4px ", " 4px", "4pxx", "4auto", "auto", "1.2.3", "+4", "4%%", "٣px",
    )
    for (c in cases) assertEquals(c, viaRegex(c), viaScan(c))
  }

  @Test
  fun whitespaceTokens() {
    val cases = listOf("", " ", "4px", " 4px  8px\t12px\n", "a\u000Bb\u000Cc\rd", "4px 8px")
    for (c in cases) {
      val out = mutableListOf<String>()
      forEachWhitespaceToken(c) { out.add(it) }
      assertEquals(c, SPLIT_REGEX.split(c).filter { it.isNotEmpty() }, out)
    }
  }
}
