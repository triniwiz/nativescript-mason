package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType
import kotlin.math.ceil

@RunWith(AndroidJUnit4::class)
class TextMinContentInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext
  private val density = context.resources.displayMetrics.density
  private val rowWidth = (200 * density).toInt()

  private fun inNarrowRow(content: String, whiteSpace: Styles.WhiteSpace): TextView {
    val mason = Mason().apply { setDeviceScale(density) }
    val row = mason.createView(context)
    row.style.display = Display.Flex
    row.style.setSizeWidth(rowWidth.toFloat(), Dimension.Kind.Points.value)
    val text = mason.createTextView(context, TextType.Span).apply {
      style.display = Display.Block
      style.whiteSpace = whiteSpace
      textContent = content
    }
    row.addView(text)
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val tree = row.computeAndLayout(rowWidth.toFloat(), -1f)
      if (tree.nodeCount > 0) row.applyLayoutFlat(row.node, tree)
    }
    return text
  }

  private fun assertWrapsInsideTheRow(content: String) {
    val text = inNarrowRow(content, Styles.WhiteSpace.Normal)
    val lines = text.cachedStaticLayout?.lineCount ?: 0
    assertTrue("the text is ${text.width} px wide in a $rowWidth px row", text.width <= rowWidth)
    assertTrue("the text wraps, in $lines lines", lines >= 2)
  }

  private fun assertKeepsItsOneLineWidth(content: String, whiteSpace: Styles.WhiteSpace = Styles.WhiteSpace.Normal) {
    val text = inNarrowRow(content, whiteSpace)
    val layout = text.cachedStaticLayout!!
    assertEquals("$whiteSpace: line count", 1, layout.lineCount)
    val lineWidth = ceil(layout.getLineMax(0)).toInt()
    assertTrue("$whiteSpace: the line is $lineWidth px, wider than the $rowWidth px row", lineWidth > rowWidth)
    assertEquals("$whiteSpace: the text's width", lineWidth.toFloat(), text.width.toFloat(), 1f)
  }

  @Test
  fun aJapaneseSentenceWrapsInsideTheRow() = assertWrapsInsideTheRow(JAPANESE)

  @Test
  fun aSlashSeparatedListWrapsInsideTheRow() = assertWrapsInsideTheRow("red/green/blue/yellow/orange/purple/brown")

  @Test
  fun aWordWiderThanTheRowKeepsItsWidth() = assertKeepsItsOneLineWidth("Pneumonoultramicroscopicsilicovolcanoconiosis")

  // StaticLayout breaks after a hyphen only when it hyphenates.
  @Test
  fun aHyphenatedCompoundKeepsItsWidth() = assertKeepsItsOneLineWidth("well-known-and-widely-adopted-recommendations")

  @Test
  fun aUrlKeepsItsWidth() = assertKeepsItsOneLineWidth("https://example.com/products/category/item")

  @Test
  fun unwrappedTextKeepsItsOneLineWidth() {
    for (whiteSpace in listOf(Styles.WhiteSpace.NoWrap, Styles.WhiteSpace.Pre)) {
      assertKeepsItsOneLineWidth(JAPANESE, whiteSpace)
      assertKeepsItsOneLineWidth("The quick brown fox jumps over the lazy dog", whiteSpace)
    }
  }

  private companion object {
    const val JAPANESE = "日本語の文章は単語の間に空白を入れないので、ほとんどの文字の間で改行できます。"
  }
}
