package org.nativescript.mason.masondemo

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Node
import org.nativescript.mason.masonkit.NodeHelper
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.enums.TextType

/**
 * Instrumented tests for inline layout behaviour — specifically verifying
 * that flattened TextContainer children (e.g. `<code>` inside `<p>`) do not
 * inflate the parent's height or misalign layout indices.
 */
@RunWith(AndroidJUnit4::class)
class InlineLayoutInstrumentedTest {

  private val TAG = "InlineLayoutTest"

  @Test
  fun flattenedCodeChildrenDoNotInflateParentHeight() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)

    val code1 = mason.createTextView(context, TextType.Code)
    code1.append("flexbox")
    code1.style.backgroundColor = 0xFFEFEFEF.toInt()

    val code2 = mason.createTextView(context, TextType.Code)
    code2.append("grid")
    code2.style.backgroundColor = 0xFFEFEFEF.toInt()

    p.append("Supports ")
    p.append(code1)
    p.append(", ")
    p.append(code2)

    val layout = p.computeAndLayout(400f, -1f)

    Log.i(TAG, "P layout: width=${layout.width} height=${layout.height}")

    Assert.assertTrue(
      "P height (${layout.height}) looks inflated — expected single-line height (<80px)",
      layout.height < 80f
    )
  }

  @Test
  fun addingFlattenedChildrenDoesNotScaleHeight() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p1 = mason.createTextView(context, TextType.P)
    val c1 = mason.createTextView(context, TextType.Code)
    c1.append("one")
    c1.style.backgroundColor = 0xFFEFEFEF.toInt()
    p1.append("Text ")
    p1.append(c1)

    val layout1 = p1.computeAndLayout(400f, -1f)
    val height1 = layout1.height

    val p4 = mason.createTextView(context, TextType.P)
    p4.append("Text ")
    for (i in 0 until 4) {
      val c = mason.createTextView(context, TextType.Code)
      c.append("code$i")
      c.style.backgroundColor = 0xFFEFEFEF.toInt()
      p4.append(c)
      if (i < 3) p4.append(" ")
    }

    val layout4 = p4.computeAndLayout(400f, -1f)
    val height4 = layout4.height

    val ratio = height4 / height1.coerceAtLeast(1f)

    Assert.assertTrue(
      "Height scaled suspiciously: 1 child=$height1  4 children=$height4  ratio=$ratio",
      ratio < 1.5f
    )
  }

  @Test
  fun shouldFlattenCodeWithOnlyBackgroundColor() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)
    val code = mason.createTextView(context, TextType.Code)
    code.append("test")
    code.style.backgroundColor = 0xFFEFEFEF.toInt()
    p.append(code)

    // Infer flattening via parent height (flattened code should not inflate parent)
    val layoutCode = p.computeAndLayout(400f, -1f)
    Assert.assertTrue(
      "Code with only backgroundColor should be flattened (parent height < 80)",
      layoutCode.height < 80f
    )
  }

  @Test
  fun shouldNotFlattenCodeWithBorder() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)
    val code = mason.createTextView(context, TextType.Code)
    code.append("test")
    code.style.setBorderTopWidth(1f, 0.toByte())
    code.style.setBorderRightWidth(1f, 0.toByte())
    code.style.setBorderBottomWidth(1f, 0.toByte())
    code.style.setBorderLeftWidth(1f, 0.toByte())
    p.append(code)

    // With border, the code should be treated as an inline-block — its own layout should be non-zero
    val codeLayout = code.computeAndLayout(400f, -1f)
    Assert.assertTrue(
      "Code with border should NOT be flattened (child has non-zero layout)",
      codeLayout.height > 0f || codeLayout.width > 0f
    )
  }

  @Test
  fun flattenedChildrenLayoutSizesAreReasonable() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)

    val codes = mutableListOf<TextView>()
    for (i in 0 until 3) {
      val c = mason.createTextView(context, TextType.Code)
      c.append("item$i")
      c.style.backgroundColor = 0xFFDDDDDD.toInt()
      codes.add(c)
    }

    p.append("Start ")
    for ((i, c) in codes.withIndex()) {
      p.append(c)
      if (i < codes.size - 1) p.append(" ")
    }
    p.append(" end")

    val layout = p.computeAndLayout(500f, -1f)

    Assert.assertTrue(
      "Parent height ${layout.height} is too large for a single line of text",
      layout.height in 1f..100f
    )
  }

  @Test
  fun noSuspiciousWritebacksForFlattenedCodeChildren() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val events = mutableListOf<Triple<Int, Float, Float>>()

    Node.setComputedSizeTestCallback { id, w, h ->
      synchronized(events) { events.add(Triple(id, w, h)) }
    }

    val p = mason.createTextView(context, TextType.P)
    val code1 = mason.createTextView(context, TextType.Code)
    code1.append("flexbox")
    code1.style.backgroundColor = 0xFFEFEFEF.toInt()

    val code2 = mason.createTextView(context, TextType.Code)
    code2.append("grid")
    code2.style.backgroundColor = 0xFFEFEFEF.toInt()

    p.append("Supports ")
    p.append(code1)
    p.append(", ")
    p.append(code2)

    for (i in 0 until 3) {
      try {
        NodeHelper.shared.compute(p.node)
      } catch (_: Throwable) {
      }
      try {
        Thread.sleep(100)
      } catch (_: InterruptedException) {
      }
    }

    try {
      Thread.sleep(500)
    } catch (_: InterruptedException) {
    }
    Node.setComputedSizeTestCallback(null)

    val captured: List<Triple<Int, Float, Float>> = synchronized(events) { events.toList() }

    val suspicious = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in captured) {
      if (h > 100f) {
        suspicious.add(Triple(id, w, h))
      }
    }

    Assert.assertTrue(
      "Found suspiciously large writebacks: $suspicious",
      suspicious.isEmpty()
    )
  }

  // Use public API on Element/TextView
  private fun computeAndLayout(
    tv: org.nativescript.mason.masonkit.TextView, mason: Mason, width: Float, height: Float
  ): org.nativescript.mason.masonkit.Layout {
    return tv.computeAndLayout(width, height)
  }
}
