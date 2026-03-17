package org.nativescript.mason.masondemo

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Node
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.enums.TextType

/**
 * Instrumented tests for inline layout behaviour — specifically verifying
 * that flattened TextContainer children (e.g. `<code>` inside `<p>`) do not
 * inflate the parent's height or misalign layout indices.
 */
@RunWith(AndroidJUnit4::class)
class InlineLayoutInstrumentedTest {

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

    val layout = computeOnSingleLine(p)

    Assert.assertTrue(
      "P height (${layout.cursor.height}) should stay close to its single-line intrinsic height",
      layout.cursor.height <= maxContentLayout(p).cursor.height + 1f
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

    val layout1 = computeOnSingleLine(p1)
    val height1 = layout1.cursor.height

    val p4 = mason.createTextView(context, TextType.P)
    p4.append("Text ")
    for (i in 0 until 4) {
      val c = mason.createTextView(context, TextType.Code)
      c.append("code$i")
      c.style.backgroundColor = 0xFFEFEFEF.toInt()
      p4.append(c)
      if (i < 3) p4.append(" ")
    }

    val layout4 = computeOnSingleLine(p4)
    val height4 = layout4.cursor.height

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

    // Infer flattening via parent height after giving the content enough room
    // to stay on a single line across device densities.
    val layoutCode = computeOnSingleLine(p)
    Assert.assertTrue(
      "Code with only backgroundColor should keep a compact single-line height",
      layoutCode.cursor.height <= maxContentLayout(p).cursor.height + 1f
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
      codeLayout.cursor.height > 0f || codeLayout.cursor.width > 0f
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

    val layout = computeOnSingleLine(p)

    Assert.assertTrue(
      "Parent height ${layout.cursor.height} should remain close to its intrinsic single-line height",
      layout.cursor.height <= maxContentLayout(p).cursor.height + 1f
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

    val targetWidth = singleLineWidth(p)
    for (i in 0 until 3) {
      p.computeAndLayout(targetWidth, -1f)
      Thread.sleep(100)
    }

    Thread.sleep(500)
    Node.setComputedSizeTestCallback(null)

    val finalLayout = p.computeAndLayout(targetWidth, -1f)
    val captured: List<Triple<Int, Float, Float>> = synchronized(events) { events.toList() }
    val maxAllowedHeight = finalLayout.cursor.height * 2f

    val suspicious = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in captured) {
      if (h > maxAllowedHeight + 1f) {
        suspicious.add(Triple(id, w, h))
      }
    }

    Assert.assertTrue(
      "Found suspiciously large writebacks: $suspicious",
      suspicious.isEmpty()
    )
  }

  private fun maxContentLayout(tv: TextView) = tv.computeAndLayout(-2f, -1f)

  private fun singleLineWidth(tv: TextView): Float {
    return maxContentLayout(tv).cursor.width + 24f
  }

  private fun computeOnSingleLine(tv: TextView) = tv.computeAndLayout(singleLineWidth(tv), -1f)
}
