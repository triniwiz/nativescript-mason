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

@RunWith(AndroidJUnit4::class)
class FloatMappingInstrumentedTest {

  @Test
  fun float_rects_mapped_inside_content_box() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason.shared

    val parent = mason.createView(appContext)
    // give the parent some padding so mapping must account for it
    parent.setPadding(20, 8, 0, 0)

    val floatBox = mason.createView(appContext).apply {
      configure {
        it.float = MasonFloat.Left
        it.size = org.nativescript.mason.masonkit.Size(
          org.nativescript.mason.masonkit.Dimension.Points(80f),
          org.nativescript.mason.masonkit.Dimension.Points(160f)
        )
      }
    }

    // Give the float a left margin so mapping must include margin influence
    NodeHelper.shared.setMargin(floatBox, 12f, 0f, 0f, 0f)

    val para = mason.createTextView(appContext, TextType.P).apply {
      append("Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
        "Vestibulum at risus vitae massa consequat sollicitudin.")
    }

    parent.append(floatBox)
    parent.append(para)

    try { parent.compute(300f, Float.NaN) } catch (_: Throwable) {}

    val (ids, rects) = NodeHelper.shared.getFloatRectsLocalToView(para)
    assertNotNull(rects)
    if (rects.isEmpty()) fail("expected at least one float rect")

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

    // For each rect: left/top must be >= 0 and right <= contentWidth
    val count = rects.size / 4
    for (j in 0 until count) {
      val base = j*4
      val l = rects[base]
      val t = rects[base+1]
      val w = rects[base+2]
      val r = l + w

      assertTrue("mapped left should be >= 0 but was $l", l >= -0.5f)
      assertTrue("mapped top should be >= 0 but was $t", t >= -0.5f)

      if (contentWidth > 0f) {
        assertTrue("mapped right ($r) should be <= contentWidth ($contentWidth)", r <= contentWidth + 0.5f)
      }
    }
  }
}
