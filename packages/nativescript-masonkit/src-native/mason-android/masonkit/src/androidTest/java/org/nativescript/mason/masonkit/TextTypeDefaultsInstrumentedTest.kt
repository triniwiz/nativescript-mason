package org.nativescript.mason.masonkit

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.fontmanager.FontStyle
import org.nativescript.fontmanager.FontWeight
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType

/**
 * Instrumented tests verifying that TextType defaults match web-standard
 * CSS user-agent stylesheet values.
 *
 * Web reference for default styles:
 *   https://html.spec.whatwg.org/multipage/rendering.html#the-css-user-agent-style-sheet-and-presentational-hints
 */
@RunWith(AndroidJUnit4::class)
class TextTypeDefaultsInstrumentedTest {

  private val TAG = "TextTypeDefaults"

  // Display defaults

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
    Assert.assertEquals("Strong should be display: inline", Display.Inline, tv.style.display)
  }

  @Test
  fun emHasInlineDisplay() {
    val tv = createTextView(TextType.Em)
    Assert.assertEquals("Em should be display: inline", Display.Inline, tv.style.display)
  }

  @Test
  fun codeHasInlineDisplay() {
    val tv = createTextView(TextType.Code)
    Assert.assertEquals("Code should be display: inline", Display.Inline, tv.style.display)
  }

  @Test
  fun spanHasInlineDisplay() {
    val tv = createTextView(TextType.Span)
    Assert.assertEquals("Span should be display: inline", Display.Inline, tv.style.display)
  }

  @Test
  fun anchorHasInlineDisplay() {
    val tv = createTextView(TextType.A)
    Assert.assertEquals("A should be display: inline", Display.Inline, tv.style.display)
  }

  // Font weight defaults

  @Test
  fun strongHasBoldFontWeight() {
    val tv = createTextView(TextType.Strong)
    Assert.assertEquals(
      "Strong should have bold font weight",
      FontWeight.Bold, tv.style.fontWeight
    )
  }

  @Test
  fun bHasBoldFontWeight() {
    val tv = createTextView(TextType.B)
    Assert.assertEquals(
      "B should have bold font weight",
      FontWeight.Bold, tv.style.fontWeight
    )
  }

  @Test
  fun h1HasBoldFontWeight() {
    val tv = createTextView(TextType.H1)
    Assert.assertEquals(
      "H1 should have bold font weight",
      FontWeight.Bold, tv.style.fontWeight
    )
  }

  // Font style defaults

  @Test
  fun emHasItalicFontStyle() {
    val tv = createTextView(TextType.Em)
    Assert.assertEquals(
      "Em should have italic font style",
      FontStyle.Italic, tv.style.fontStyle
    )
  }

  @Test
  fun iHasItalicFontStyle() {
    val tv = createTextView(TextType.I)
    Assert.assertEquals(
      "I should have italic font style",
      FontStyle.Italic, tv.style.fontStyle
    )
  }

  // Blockquote: web-standard defaults (NO italic, has margins)

  @Test
  fun blockquoteHasNoItalic() {
    val tv = createTextView(TextType.Blockquote)
    // Web blockquote does NOT have italic by default
    Assert.assertNotEquals(
      "Blockquote should NOT have italic font style (web standard)",
      FontStyle.Italic, tv.style.fontStyle
    )
  }

  // UA margins are logical (margin-block, margin-inline): read them off the laid-out box.
  private fun uaMargin(type: TextType): Rect<Float> {
    val tv = createTextView(type)
    return computeAndLayout(tv, tv.node.mason, 400f, -1f).margin
  }

  @Test
  fun blockquoteHasLeftRightMargin() {
    val margin = uaMargin(TextType.Blockquote)
    // Web blockquote: margin-inline-start: 40px, margin-inline-end: 40px
    Assert.assertTrue("Blockquote should have left margin (web: 40px)", margin.left > 0f)
    Assert.assertTrue("Blockquote should have right margin (web: 40px)", margin.right > 0f)
  }

  @Test
  fun blockquoteHasTopBottomMargin() {
    val margin = uaMargin(TextType.Blockquote)
    // Web blockquote: margin-block-start: 1em, margin-block-end: 1em
    Assert.assertTrue("Blockquote should have top margin (web: 1em ≈ 16px)", margin.top > 0f)
    Assert.assertTrue("Blockquote should have bottom margin (web: 1em ≈ 16px)", margin.bottom > 0f)
  }

  @Test
  fun verticalParagraphUaMarginsAreOnItsLeftAndRight() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    val root = mason.createView(context)
    root.style.prepareMut()
    root.style.values.put(StyleKeys.WRITING_MODE, 1)
    root.style.values.put(StyleKeys.WRITING_MODE_STATE, 1)
    root.syncStyle(StateKeys.WRITING_MODE.low, StateKeys.WRITING_MODE.high)
    root.style.setSizeHeight(200f, Dimension.Kind.Points.value)
    val p = mason.createTextView(context, TextType.P)
    root.addView(p)
    val layout = Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.nativePtr, root.node.nativePtr, -1f, -1f), 0
    ).second
    val margin = layout.children[0].margin
    Assert.assertTrue("left ${margin.left}", margin.left > 0f)
    Assert.assertTrue("right ${margin.right}", margin.right > 0f)
    Assert.assertEquals(0f, margin.top)
    Assert.assertEquals(0f, margin.bottom)
  }

  // Font property state tracking: inline children must resolve correctly

  @Test
  fun emFontStyleStateIsSet() {
    val tv = createTextView(TextType.Em)
    // After setting fontStyle via state-tracking setter, resolvedFontFace
    // should produce an italic typeface even when flattened into a parent
    val resolved = tv.style.resolvedFontFace
    Assert.assertNotNull(
      "Em's resolvedFontFace should have a non-null font (italic typeface loaded)",
      resolved.font
    )
  }

  @Test
  fun strongFontWeightStateIsSet() {
    val tv = createTextView(TextType.Strong)
    val resolved = tv.style.resolvedFontFace
    Assert.assertNotNull(
      "Strong's resolvedFontFace should have a non-null font (bold typeface loaded)",
      resolved.font
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

    // The Em should be flattenable (no border, padding, explicit size)
    val engine = (bq as TextContainer).engine
    val shouldFlatten = engine.shouldFlattenTextContainer(em as TextContainer)

    Assert.assertTrue(
      "Em inside Blockquote should be flattened (inline with no view properties)",
      shouldFlatten
    )

    // Compute layout - blockquote should have non-zero size
    val layout = computeAndLayout(bq, mason, 400f, -1f)
    Log.i(TAG, "Blockquote with Em: ${layout.width}x${layout.height}")

    Assert.assertTrue(
      "Blockquote height (${layout.height}) should be non-zero",
      layout.height > 0f
    )
  }

  // Pre defaults

  @Test
  fun preHasMonospaceFont() {
    val tv = createTextView(TextType.Pre)
    Assert.assertTrue(
      "Pre should have monospace font family",
      tv.style.fontFamily.contains("monospace", ignoreCase = true)
    )
  }

  // Code defaults

  @Test
  fun codeHasMonospaceFont() {
    val tv = createTextView(TextType.Code)
    Assert.assertTrue(
      "Code should have monospace font family",
      tv.style.fontFamily.contains("monospace", ignoreCase = true)
    )
  }

  // Helpers

  private fun createTextView(type: TextType): TextView {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    return mason.createTextView(context, type)
  }

  private fun computeAndLayout(
    tv: TextView, mason: Mason, width: Float, height: Float
  ): Layout {
    return Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeWithSizeAndLayout(
        mason.nativePtr,
        tv.node.nativePtr,
        width, height
      ), 0
    ).second
  }
}
