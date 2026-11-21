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
class TextViewCreatedWithTextInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()
  private val content = "A sentence long enough to wrap onto a second line"

  private data class Laid(val text: String, val html: String, val width: Int, val height: Int)

  // JavaScript's mount order: create, insert into the parent, then the deferred text and style setters.
  private fun mount(mason: Mason, createdWithText: Boolean): Laid {
    val ctx = instr.targetContext
    val root = View.createFlexView(mason, ctx).apply { flexDirection = FlexDirection.Column }
    val text = if (createdWithText) {
      mason.createTextViewWithSlot(ctx, TextType.P, content)
    } else {
      mason.createTextViewWithSlot(ctx, TextType.P)
    }
    root.addView(text)
    if (!createdWithText) text.textContent = content
    text.style.fontSize = 22f
    TextEngine.flushPendingTextStyles()
    root.measure(
      MeasureSpec.makeMeasureSpec(300, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    root.layout(0, 0, root.measuredWidth, root.measuredHeight)
    return Laid(text.textContent, text.engine.innerHTML, text.width, text.height)
  }

  @Test
  fun aTextViewCreatedWithTextLaysOutLikeOneGivenTheTextAfterwards() {
    instr.runOnMainSync {
      val mason = Mason()
      val reference = mount(mason, createdWithText = false)
      val created = mount(mason, createdWithText = true)
      assertEquals(content, reference.text)
      assertTrue("the reference should lay out, got $reference", reference.width > 0 && reference.height > 0)
      assertEquals(reference, created)
      mason.clear()
    }
  }

  @Test
  fun aLaterChangeReplacesTheCreatedText() {
    instr.runOnMainSync {
      val mason = Mason()
      val text = mason.createTextViewWithSlot(instr.targetContext, TextType.Span, "before")
      text.textContent = "after"
      assertEquals("after", text.textContent)
      mason.clear()
    }
  }
}
