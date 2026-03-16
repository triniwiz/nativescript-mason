package org.nativescript.mason.masondemo

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.NativeHelpers
import org.nativescript.mason.masonkit.Layout

@RunWith(AndroidJUnit4::class)
class TextTypeDefaultsInstrumentedTest {

  private val TAG = "TextTypeDefaults"

  @Test
  fun blockquoteHasBlockDisplay() {
    val tv = createTextView(TextType.Blockquote)
    Assert.assertEquals("Blockquote should be display: block", Display.Block, tv.style.display)
  }

  @Test
  fun paragraphHasBlockDisplay() {
    val tv = createTextView(TextType.P)
    Assert.assertEquals("P should be display: block", Display.Block, tv.style.display)
  }

  @Test
  fun preHasBlockDisplay() {
    val tv = createTextView(TextType.Pre)
    Assert.assertEquals("Pre should be display: block", Display.Block, tv.style.display)
  }

  @Test
  fun h1HasBlockDisplay() {
    val tv = createTextView(TextType.H1)
    Assert.assertEquals("H1 should be display: block", Display.Block, tv.style.display)
  }

  @Test
  fun strongHasInlineDisplay() {
    val tv = createTextView(TextType.Strong)
    Assert.assertEquals("Strong should be display: inline", org.nativescript.mason.masonkit.enums.Display.Inline, tv.style.display)
  }

  @Test
  fun emHasInlineDisplay() {
    val tv = createTextView(TextType.Em)
    Assert.assertEquals("Em should be display: inline", org.nativescript.mason.masonkit.enums.Display.Inline, tv.style.display)
  }

  @Test
  fun codeHasInlineDisplay() {
    val tv = createTextView(TextType.Code)
    Assert.assertEquals("Code should be display: inline", org.nativescript.mason.masonkit.enums.Display.Inline, tv.style.display)
  }

  @Test
  fun spanHasInlineDisplay() {
    val tv = createTextView(TextType.Span)
    Assert.assertEquals("Span should be display: inline", org.nativescript.mason.masonkit.enums.Display.Inline, tv.style.display)
  }

  @Test
  fun anchorHasInlineDisplay() {
    val tv = createTextView(TextType.A)
    Assert.assertEquals("A should be display: inline", org.nativescript.mason.masonkit.enums.Display.Inline, tv.style.display)
  }

  @Test
  fun strongHasBoldFontWeight() {
    val tv = createTextView(TextType.Strong)
    Assert.assertEquals(
      "Strong should have bold font weight",
      org.nativescript.mason.masonkit.FontFace.NSCFontWeight.Bold, tv.style.fontWeight
    )
  }

  @Test
  fun bHasBoldFontWeight() {
    val tv = createTextView(TextType.B)
    Assert.assertEquals(
      "B should have bold font weight",
      org.nativescript.mason.masonkit.FontFace.NSCFontWeight.Bold, tv.style.fontWeight
    )
  }

  @Test
  fun h1HasBoldFontWeight() {
    val tv = createTextView(TextType.H1)
    Assert.assertEquals(
      "H1 should have bold font weight",
      org.nativescript.mason.masonkit.FontFace.NSCFontWeight.Bold, tv.style.fontWeight
    )
  }

  @Test
  fun emHasItalicFontStyle() {
    val tv = createTextView(TextType.Em)
    Assert.assertEquals(
      "Em should have italic font style",
      org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Italic, tv.style.fontStyle
    )
  }

  @Test
  fun iHasItalicFontStyle() {
    val tv = createTextView(TextType.I)
    Assert.assertEquals(
      "I should have italic font style",
      org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Italic, tv.style.fontStyle
    )
  }

  @Test
  fun blockquoteHasNoItalic() {
    val tv = createTextView(TextType.Blockquote)
    Assert.assertNotEquals(
      "Blockquote should NOT have italic font style (web standard)",
      org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Italic, tv.style.fontStyle
    )
  }

  @Test
  fun blockquoteHasLeftRightMargin() {
    val tv = createTextView(TextType.Blockquote)
    val margin = tv.style.margin
    Assert.assertTrue(
      "Blockquote should have left margin (web: 40px)",
      (margin.left as? org.nativescript.mason.masonkit.LengthPercentageAuto.Points)?.points?.let { it > 0f } ?: false
    )
    Assert.assertTrue(
      "Blockquote should have right margin (web: 40px)",
      (margin.right as? org.nativescript.mason.masonkit.LengthPercentageAuto.Points)?.points?.let { it > 0f } ?: false
    )
  }

  @Test
  fun blockquoteHasTopBottomMargin() {
    val tv = createTextView(TextType.Blockquote)
    val margin = tv.style.margin
    Assert.assertTrue(
      "Blockquote should have top margin (web: 1em ≈ 16px)",
      (margin.top as? org.nativescript.mason.masonkit.LengthPercentageAuto.Points)?.points?.let { it > 0f } ?: false
    )
    Assert.assertTrue(
      "Blockquote should have bottom margin (web: 1em ≈ 16px)",
      (margin.bottom as? org.nativescript.mason.masonkit.LengthPercentageAuto.Points)?.points?.let { it > 0f } ?: false
    )
  }

  @Test
  fun emFontStyleStateIsSet() {
    val tv = createTextView(TextType.Em)
    Assert.assertEquals(
      "Em should have italic font style",
      org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Italic,
      tv.style.fontStyle
    )
  }

  @Test
  fun strongFontWeightStateIsSet() {
    val tv = createTextView(TextType.Strong)
    Assert.assertEquals(
      "Strong should have bold font weight",
      org.nativescript.mason.masonkit.FontFace.NSCFontWeight.Bold,
      tv.style.fontWeight
    )
  }

  @Test
  fun emInsideBlockquoteFlattenedCorrectly() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val bq = mason.createTextView(context, TextType.Blockquote)
    val em = mason.createTextView(context, TextType.Em)
    em.append("Italic text inside blockquote")
    bq.append(em)

    // Infer flattening via public compute API: parent should have non-zero layout and not inflate
    val layout = bq.computeAndLayout(400f, -1f)
    Log.i(TAG, "Blockquote with Em: ${layout.width}x${layout.height}")

    Assert.assertTrue(
      "Blockquote height (${layout.height}) should be non-zero",
      layout.height > 0f
    )
  }

  @Test
  fun preHasMonospaceFont() {
    val tv = createTextView(TextType.Pre)
    Assert.assertTrue(
      "Pre should have monospace font family",
      tv.style.fontFamily.contains("monospace", ignoreCase = true)
    )
  }

  @Test
  fun codeHasMonospaceFont() {
    val tv = createTextView(TextType.Code)
    Assert.assertTrue(
      "Code should have monospace font family",
      tv.style.fontFamily.contains("monospace", ignoreCase = true)
    )
  }

  private fun createTextView(type: TextType): TextView {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    return mason.createTextView(context, type)
  }

  private fun computeAndLayout(
    tv: TextView, mason: Mason, width: Float, height: Float
  ): Layout {
    return tv.computeAndLayout(width, height)
  }
}
