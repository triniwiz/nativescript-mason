package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class StyleSyncQueueInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()
  private val display = StateKeys.DISPLAY.let {
    intArrayOf(it.low.toInt(), (it.low ushr 32).toInt(), it.high.toInt(), (it.high ushr 32).toInt())
  }

  @Test
  fun theMailboxNamesTheNewViewsOwnSlot() {
    instr.runOnMainSync {
      val mason = Mason.shared
      val view = mason.createViewWithSlot(instr.targetContext)
      assertTrue(view.style.slot >= 0)
      assertEquals(view.style.slot, mason.slotMailbox.getInt(0))
      val text = mason.createTextViewWithSlot(instr.targetContext, TextType.Span)
      assertEquals(text.style.slot, mason.slotMailbox.getInt(0))
      assertTrue(text.style.slot != view.style.slot)
    }
  }

  @Test
  fun aQueuedSyncAppliesTheBufferLikeADirectOne() {
    instr.runOnMainSync {
      val mason = Mason.shared
      val direct = mason.createViewWithSlot(instr.targetContext)
      val queued = mason.createViewWithSlot(instr.targetContext)
      val untouched = mason.createViewWithSlot(instr.targetContext)
      for (view in listOf(direct, queued)) view.style.values.put(StyleKeys.DISPLAY, Display.None.value)

      direct.syncStyleParts(display[0], display[1], display[2], display[3])
      mason.syncQueue.putInt(0, queued.style.slot)
      display.forEachIndexed { i, word -> mason.syncQueue.putInt(4 * (i + 1), word) }
      mason.syncStyleSlots(1)

      assertEquals(android.view.View.INVISIBLE, direct.visibility)
      assertEquals(direct.visibility, queued.visibility)
      assertEquals(android.view.View.VISIBLE, untouched.visibility)
    }
  }
}
