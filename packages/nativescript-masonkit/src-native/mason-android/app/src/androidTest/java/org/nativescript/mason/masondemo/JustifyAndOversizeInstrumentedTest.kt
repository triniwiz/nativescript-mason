package org.nativescript.mason.masondemo

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.NodeHelper
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.enums.Float as MasonFloat
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.enums.TextAlign

@RunWith(AndroidJUnit4::class)
class JustifyAndOversizeInstrumentedTest {

  @Test
  fun justify_parity_basic() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason.shared

    val parent = mason.createView(appContext)

    val para = mason.createTextView(appContext, TextType.P).apply {
      // Use a long paragraph to ensure multiple lines
      append("Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
        "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.")
    }

    // Set justify using public API
    NodeHelper.shared.setTextAlign(para, TextAlign.Justify)

    parent.append(para)

    try {
      parent.compute(300f, Float.NaN)
    } catch (_: Throwable) {}

    // Public assertions: textAlign property applied and layout created with multiple lines
    val currentAlign = NodeHelper.shared.getTextAlign(para)
    assertEquals(TextAlign.Justify, currentAlign)

    val layout = try { (para as android.widget.TextView).layout } catch (_: Throwable) { null }
    assertNotNull(layout)
    if (layout != null) {
      assertTrue(layout.lineCount > 1)
    }
  }

  @Test
  fun oversize_float_prevents_inline_flow() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason.shared

    val parent = mason.createView(appContext)

    // Oversize float: make float wider than the container width we'll compute
    val floatBox = mason.createView(appContext).apply {
      configure {
        it.float = MasonFloat.Left
        it.size = org.nativescript.mason.masonkit.Size(
          org.nativescript.mason.masonkit.Dimension.Points(200f),
          org.nativescript.mason.masonkit.Dimension.Points(40f)
        )
      }
    }

    val para = mason.createTextView(appContext, TextType.P).apply {
      append("Short text to ensure float occupies the line and pushes text below.")
    }

    parent.append(floatBox)
    parent.append(para)

    // Compute with a narrow container so float is effectively oversize
    try {
      parent.compute(100f, Float.NaN)
    } catch (_: Throwable) {}

    // Use only public APIs to observe behavior
    val (ids, rects) = NodeHelper.shared.getFloatRectsLocalToView(para)
    val (leftInset, rightInset) = NodeHelper.shared.getCachedFloatInsetsForView(para, 0f, 40f)

    // Expect rects to exist and insets to be equal (treated as full-line occupancy)
    assertNotNull(rects)
    assertTrue(rects.size % 4 == 0)
    assertTrue(leftInset > 0f || rightInset < Float.MAX_VALUE)
    // Oversize heuristic returns identical left/right insets when float blocks the content
    assertEquals(leftInset, rightInset, 0.0001f)
  }
}
