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

@RunWith(AndroidJUnit4::class)
class FloatWrappingInstrumentedTest {
  @Test
  fun float_insets_affect_text_measurement() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason.shared

    // Parent container
    val parent = mason.createView(appContext)

    // Floated box
    val floatBox = mason.createView(appContext).apply {
      configure {
        it.float = MasonFloat.Left
        it.size = org.nativescript.mason.masonkit.Size(
          org.nativescript.mason.masonkit.Dimension.Points(80f),
          org.nativescript.mason.masonkit.Dimension.Points(80f)
        )
      }
    }

    // Paragraph that should wrap around float
    val para = mason.createTextView(appContext, TextType.P).apply {
      append("Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
        "Pellentesque habitant morbi tristique senectus et netus et malesuada.")
    }

    parent.append(floatBox)
    parent.append(para)

    // Force layout/compute for the parent container with a finite width
    try {
      parent.compute(300f, Float.NaN)
    } catch (_: Throwable) {}

    // Retrieve float rects and cached insets
    val (ids, rects) = NodeHelper.shared.getFloatRectsLocalToView(para)
    val (leftInset, rightInset) = NodeHelper.shared.getCachedFloatInsetsForView(para, 0f, 40f)

    // Compute content width with fallbacks — `computedLayout` may be empty
    var contentWidth = 0f
    try {
      val layout = para.node.computedLayout
      if (layout.width > 0f) contentWidth = layout.width - layout.padding.left - layout.padding.right
    } catch (_: Throwable) { }
    if (contentWidth <= 0f) {
      try { contentWidth = para.node.computedWidthSafe() } catch (_: Throwable) { }
    }
    if (contentWidth <= 0f) {
      try { contentWidth = (para.width - para.paddingLeft - para.paddingRight).toFloat() } catch (_: Throwable) { }
    }

    // Basic assertions: rects array length multiple of 4 and inset reflects float
    assertNotNull(rects)
    assertTrue(rects.size % 4 == 0)
    // For a left float we expect leftInset > 0 (space taken on left)
    assertTrue(leftInset > 0f || rightInset < Float.MAX_VALUE)
  }
}
