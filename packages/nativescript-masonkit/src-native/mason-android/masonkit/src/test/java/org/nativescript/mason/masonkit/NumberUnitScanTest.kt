package org.nativescript.mason.masonkit

import org.junit.Assert.assertEquals
import org.junit.Test

class NumberUnitScanTest {
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
