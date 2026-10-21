package org.nativescript.mason.masonkit

import android.os.Build
import android.text.Layout
import org.junit.Assert.assertEquals
import org.junit.Test
import org.nativescript.mason.masonkit.Styles.TextJustify
import org.nativescript.mason.masonkit.enums.TextAlign

class TextJustifyTest {

  private fun mode(align: TextAlign, justify: TextJustify, sdk: Int = Build.VERSION_CODES.VANILLA_ICE_CREAM) =
    TextEngine.justificationMode(align, justify, sdk)

  @Test
  fun noneKeepsJustifiedTextRagged() {
    assertEquals(Layout.JUSTIFICATION_MODE_NONE, mode(TextAlign.Justify, TextJustify.None))
  }

  @Test
  fun autoAndInterWordJustifyBetweenWords() {
    assertEquals(Layout.JUSTIFICATION_MODE_INTER_WORD, mode(TextAlign.Justify, TextJustify.Auto))
    assertEquals(Layout.JUSTIFICATION_MODE_INTER_WORD, mode(TextAlign.Justify, TextJustify.InterWord))
  }

  @Test
  fun interCharacterNeedsApi35() {
    assertEquals(Layout.JUSTIFICATION_MODE_INTER_CHARACTER, mode(TextAlign.Justify, TextJustify.InterCharacter))
    assertEquals(Layout.JUSTIFICATION_MODE_INTER_CHARACTER, mode(TextAlign.Justify, TextJustify.Distribute))
    assertEquals(
      Layout.JUSTIFICATION_MODE_INTER_WORD,
      mode(TextAlign.Justify, TextJustify.InterCharacter, Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    )
  }

  @Test
  fun onlyTextAlignJustifyJustifies() {
    assertEquals(Layout.JUSTIFICATION_MODE_NONE, mode(TextAlign.Start, TextJustify.InterWord))
    assertEquals(Layout.JUSTIFICATION_MODE_NONE, mode(TextAlign.Justify, TextJustify.Auto, Build.VERSION_CODES.N))
  }
}
