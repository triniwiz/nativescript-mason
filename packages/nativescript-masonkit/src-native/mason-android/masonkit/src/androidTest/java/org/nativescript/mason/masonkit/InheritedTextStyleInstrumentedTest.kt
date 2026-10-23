package org.nativescript.mason.masonkit

import android.view.View.MeasureSpec
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class InheritedTextStyleInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext
  private val longText = "a paragraph long enough to wrap several times in a narrow box"

  private fun paragraphHeight(text: String, whiteSpace: Styles.WhiteSpace? = null): Float {
    val mason = Mason()
    val div = mason.createView(context)
    whiteSpace?.let { div.style.whiteSpace = it }
    val p = mason.createTextView(context, TextType.P).apply { append(text) }
    div.append(p)
    NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.nativePtr, div.node.nativePtr, 200f, -1f)
    div.measure(MeasureSpec.makeMeasureSpec(200, MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED))
    div.layout(0, 0, 200, maxOf(div.measuredHeight, 1))
    return p.height.toFloat()
  }

  @Test
  fun aParagraphInANowrapDivStaysOnOneLine() {
    val oneLine = paragraphHeight("a")
    val wrapped = paragraphHeight(longText)
    Assert.assertTrue("the text wraps in a plain div ($wrapped vs $oneLine)", wrapped > oneLine * 1.5f)
    for (whiteSpace in listOf(Styles.WhiteSpace.NoWrap, Styles.WhiteSpace.Pre)) {
      Assert.assertEquals("one line under an inherited $whiteSpace", oneLine, paragraphHeight(longText, whiteSpace), 1f)
    }
  }

  @Test
  fun aDisplayChangeKeepsAHiddenViewHidden() {
    val mason = Mason()
    val div = mason.createView(context)
    div.style.values.put(StyleKeys.VISIBILITY, 1)
    div.visibility = android.view.View.INVISIBLE
    div.style.display = Display.Flex
    Assert.assertEquals(android.view.View.INVISIBLE, div.visibility)
  }
}
