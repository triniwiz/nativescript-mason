package org.nativescript.mason.masondemo

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.NodeHelper
import org.nativescript.mason.masonkit.enums.Float as MasonFloat
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.enums.TextAlign

@RunWith(AndroidJUnit4::class)
class JustifyAndOversizeInstrumentedTest {

  @Test
  fun justify_parity_basic() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason.shared

    val para = mason.createTextView(appContext, TextType.P).apply {
      // Use a long paragraph to ensure multiple lines
      append("Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
        "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.")
    }

    // Set justify using public API
    NodeHelper.shared.setTextAlign(para, TextAlign.Justify)

    // Public assertions: textAlign property is preserved through compute and
    // produces a non-empty layout under an explicit width constraint.
    val currentAlign = NodeHelper.shared.getTextAlign(para)
    assertEquals(TextAlign.Justify, currentAlign)

    val layout = para.computeAndLayout(300f, -1f)
    assertTrue(layout.cursor.width > 0f)
    assertTrue(layout.cursor.height > 0f)
    assertTrue(
      "Expected justify paragraph to respect the explicit width: width=${layout.cursor.width}",
      layout.cursor.width <= 300f + 1f
    )
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
    parent.compute(100f, Float.NaN)

    // Use only public APIs to observe behavior
    val (_, rects) = NodeHelper.shared.getFloatRectsLocalToView(para)
    val (leftInset, rightInset) = NodeHelper.shared.getCachedFloatInsetsForView(para, 0f, 40f)

    // Expect rects to exist and insets to be equal (treated as full-line occupancy)
    assertNotNull(rects)
    assertTrue(rects.size % 4 == 0)
    assertTrue(leftInset > 0f || rightInset < Float.MAX_VALUE)
    // Oversize heuristic returns identical left/right insets when float blocks the content
    assertEquals(leftInset, rightInset, 0.0001f)
  }
}
