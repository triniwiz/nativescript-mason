package org.nativescript.mason.masonkit

import android.view.View.MeasureSpec
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class TextContentAttributesInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private fun textHeight(mason: Mason, styleFlushedBeforeText: Boolean): Int {
    val ctx = instr.targetContext
    val root = View.createFlexView(mason, ctx).apply { flexDirection = FlexDirection.Column }
    val text = TextView(ctx, mason, TextType.Span)
    root.addView(text)
    if (styleFlushedBeforeText) {
      text.style.setLineHeight(80f, false)
      TextEngine.flushPendingTextStyles()
      text.textContent = "Hello"
    } else {
      text.textContent = "Hello"
      text.style.setLineHeight(80f, false)
    }
    root.measure(
      MeasureSpec.makeMeasureSpec(1000, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    root.layout(0, 0, root.measuredWidth, root.measuredHeight)
    return text.height
  }

  @Test
  fun textSetAfterAFlushedStyleKeepsTheLineHeight() {
    instr.runOnMainSync {
      val mason = Mason()
      val reference = textHeight(mason, styleFlushedBeforeText = false)
      val afterFlush = textHeight(mason, styleFlushedBeforeText = true)
      assertTrue("line-height 80 should set the reference height, got $reference", reference >= 75)
      assertEquals(reference, afterFlush)
      mason.clear()
    }
  }
}
