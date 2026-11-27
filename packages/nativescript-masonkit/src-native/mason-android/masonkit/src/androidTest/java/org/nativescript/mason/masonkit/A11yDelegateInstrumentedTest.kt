package org.nativescript.mason.masonkit

import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class A11yDelegateInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private class CountingDelegate : android.view.View.AccessibilityDelegate() {
    var inits = 0
    override fun onInitializeAccessibilityNodeInfo(host: android.view.View, info: AccessibilityNodeInfo) {
      inits++
      super.onInitializeAccessibilityNodeInfo(host, info)
    }
  }

  @Test
  fun delegateRunsOnlyWithAServiceOn() {
    instr.runOnMainSync {
      val context = instr.targetContext
      val mason = Mason()
      val views = listOf(
        View.createFlexView(mason, context),
        Scroll(context, mason),
        TextView(context, mason, TextType.Span).apply { textContent = "Row 42 title" }
      )
      val serviceOn = A11y.serviceOn(context)
      views.forEachIndexed { i, view ->
        val delegate = CountingDelegate()
        view.accessibilityDelegate = delegate
        val info = view.createAccessibilityNodeInfo()
        assertEquals("view$i delegate calls", if (serviceOn) 1 else 0, delegate.inits)
        assertSame("view$i delegate restored", delegate, view.accessibilityDelegate)
        view.accessibilityDelegate = null
        val bare = view.createAccessibilityNodeInfo()
        assertEquals("view$i class", bare.className, info.className)
        assertEquals("view$i text", bare.text?.toString(), info.text?.toString())
      }
    }
  }
}
