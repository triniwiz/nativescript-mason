package org.nativescript.mason.masonkit

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SpacingTrimTest {
  @Test
  fun findsFullWidthPunctuation() {
    assertFalse(hasFullWidthPunctuation("Plain Latin text, with (ASCII) punctuation."))
    assertFalse(hasFullWidthPunctuation("漢字だけ"))
    assertTrue(hasFullWidthPunctuation("「引用」"))
    assertTrue(hasFullWidthPunctuation("end。"))
    assertTrue(hasFullWidthPunctuation("a（b"))
    assertTrue(hasFullWidthPunctuation("・"))
  }
}
