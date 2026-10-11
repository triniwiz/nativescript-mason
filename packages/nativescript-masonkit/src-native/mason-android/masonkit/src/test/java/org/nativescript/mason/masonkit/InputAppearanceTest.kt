package org.nativescript.mason.masonkit

import org.junit.Assert.assertEquals
import org.junit.Test

class InputAppearanceTest {
  @Test
  fun noneTurnsTheNativeControlOff() {
    assertEquals(Input.Appearance.None, Input.Appearance.fromCss("none"))
    assertEquals(Input.Appearance.None, Input.Appearance.fromCss(" NONE "))
  }

  @Test
  fun everyOtherKeywordIsAuto() {
    val cases = listOf("auto", "menulist-button", "textfield", "button", "initial", "", "nonee", null)
    for (c in cases) assertEquals("$c", Input.Appearance.Auto, Input.Appearance.fromCss(c))
  }
}
