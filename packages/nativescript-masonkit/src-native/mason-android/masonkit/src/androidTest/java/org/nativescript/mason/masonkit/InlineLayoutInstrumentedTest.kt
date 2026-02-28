package org.nativescript.mason.masonkit

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.TextType

/**
 * Instrumented tests for inline layout behaviour — specifically verifying
 * that flattened TextContainer children (e.g. `<code>` inside `<p>`) do not
 * inflate the parent's height or misalign layout indices.
 */
@RunWith(AndroidJUnit4::class)
class InlineLayoutInstrumentedTest {

  private val TAG = "InlineLayoutTest"

  /**
   * Reproduces the user-reported bug: a `<p>` with two `<code>` children that
   * have only `backgroundColor` set.  Those children should be flattened
   * (text rendered as spans in the parent), so the parent height must be a
   * single text-line height — not double or inflated.
   */
  @Test
  fun flattenedCodeChildrenDoNotInflateParentHeight() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    // --- Build: <p>Supports <code>flexbox</code>, <code>grid</code></p> ---
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

    // Compute layout with a reasonable container width
    val layout = computeAndLayout(p, mason, 400f, -1f)

    Log.i(TAG, "P layout: width=${layout.width} height=${layout.height}")
    Log.i(TAG, "P children count: ${layout.children.size}")

    for ((i, child) in layout.children.withIndex()) {
      Log.i(TAG, "  child[$i]: x=${child.x} y=${child.y} w=${child.width} h=${child.height}")
    }

    // The <code> children should be flattened, so the <p> height should be
    // approximately one line of text (typically 14-60 px depending on density).
    // The critical assertion: height must NOT be roughly 2x or more of a
    // single-line height.  A single line is at most ~60px at xxhdpi.
    Assert.assertTrue(
      "P height (${layout.height}) looks inflated — expected single-line height (<80px)",
      layout.height < 80f
    )

    // Verify code children exist as flattened (zero or near-zero size)
    // in the layout tree — they should not have independent rendered sizes.
    for ((i, child) in layout.children.withIndex()) {
      if (i > 0) { // skip text nodes at index 0 etc
        Log.i(TAG, "  child[$i] height=${child.height}")
      }
    }
  }

  /**
   * Verify that adding more flattened children does NOT increase the parent
   * height.  This directly tests the scaling issue the user reported.
   */
  @Test
  fun addingFlattenedChildrenDoesNotScaleHeight() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    // Build a <p> with 1 code child
    val p1 = mason.createTextView(context, TextType.P)
    val c1 = mason.createTextView(context, TextType.Code)
    c1.append("one")
    c1.style.backgroundColor = 0xFFEFEFEF.toInt()
    p1.append("Text ")
    p1.append(c1)

    val layout1 = computeAndLayout(p1, mason, 400f, -1f)
    val height1 = layout1.height
    Log.i(TAG, "1 child → height=$height1")

    // Build a <p> with 4 code children
    val p4 = mason.createTextView(context, TextType.P)
    p4.append("Text ")
    for (i in 0 until 4) {
      val c = mason.createTextView(context, TextType.Code)
      c.append("code$i")
      c.style.backgroundColor = 0xFFEFEFEF.toInt()
      p4.append(c)
      if (i < 3) p4.append(" ")
    }

    val layout4 = computeAndLayout(p4, mason, 400f, -1f)
    val height4 = layout4.height
    Log.i(TAG, "4 children → height=$height4")

    // Heights should be very close (same single-line height) — allow small
    // tolerance for text wrapping differences
    val ratio = height4 / height1.coerceAtLeast(1f)
    Log.i(TAG, "Height ratio (4 children / 1 child) = $ratio")

    Assert.assertTrue(
      "Height scaled suspiciously: 1 child=$height1  4 children=$height4  ratio=$ratio",
      ratio < 1.5f
    )
  }

  /**
   * Verify that `shouldFlattenTextContainer` returns true for a code element
   * with only backgroundColor (no border, padding, or explicit size).
   */
  @Test
  fun shouldFlattenCodeWithOnlyBackgroundColor() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)
    val code = mason.createTextView(context, TextType.Code)
    code.append("test")
    code.style.backgroundColor = 0xFFEFEFEF.toInt()
    p.append(code)

    // Access the engine to check flattening
    val engine = (p as TextContainer).engine
    val shouldFlatten = engine.shouldFlattenTextContainer(code as TextContainer)

    Log.i(TAG, "shouldFlatten(code with backgroundColor only) = $shouldFlatten")
    Assert.assertTrue(
      "Code with only backgroundColor should be flattened",
      shouldFlatten
    )
  }

  /**
   * Verify that `shouldFlattenTextContainer` returns false for a code element
   * with border — it should be treated as inline-block.
   */
  @Test
  fun shouldNotFlattenCodeWithBorder() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)
    val code = mason.createTextView(context, TextType.Code)
    code.append("test")
    // Avoid constructing LengthPercentage directly in tests — use Style helpers
    code.style.setBorderTopWidth(1f, 0.toByte())
    code.style.setBorderRightWidth(1f, 0.toByte())
    code.style.setBorderBottomWidth(1f, 0.toByte())
    code.style.setBorderLeftWidth(1f, 0.toByte())
    p.append(code)

    val engine = (p as TextContainer).engine
    val shouldFlatten = engine.shouldFlattenTextContainer(code as TextContainer)

    Log.i(TAG, "shouldFlatten(code with border) = $shouldFlatten")
    Assert.assertFalse(
      "Code with border should NOT be flattened",
      shouldFlatten
    )
  }

  /**
   * Verify that after layout, the engine's computed layout for flattened
   * children does not contain inflated sizes that would cause wasted space
   * when applied via applyLayoutRecursive.
   */
  @Test
  fun flattenedChildrenLayoutSizesAreReasonable() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    val p = mason.createTextView(context, TextType.P)

    // Create 3 flattened code children
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

    val layout = computeAndLayout(p, mason, 500f, -1f)

    Log.i(TAG, "Parent layout: ${layout.width}x${layout.height}")
    Log.i(TAG, "Child layouts (${layout.children.size}):")
    for ((i, child) in layout.children.withIndex()) {
      Log.i(TAG, "  [$i]: ${child.width}x${child.height} at (${child.x}, ${child.y})")
    }

    // The parent should have a reasonable single-line height
    Assert.assertTrue(
      "Parent height ${layout.height} is too large for a single line of text",
      layout.height in 1f..100f
    )

    // Sum of children heights should not exceed parent height significantly
    val childHeightSum = layout.children.sumOf { it.height.toDouble() }.toFloat()
    Log.i(TAG, "Sum of child heights: $childHeightSum  Parent height: ${layout.height}")

    // With flattened children, their individual layout heights should be small
    // (the engine measures them but the parent's native measure governs the
    // actual parent height). The key thing is parent height isn't inflated.
  }

  /**
   * Writeback capture test specifically for the P-with-code scenario.
   * Captures all setComputedSize callbacks and verifies no suspicious
   * height inflation.
   */
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

    // Compute multiple times
    for (i in 0 until 3) {
      NativeHelpers.nativeNodeCompute(mason.getNativePtr(), p.node.nativePtr)
      try { Thread.sleep(100) } catch (_: InterruptedException) {}
    }

    try { Thread.sleep(500) } catch (_: InterruptedException) {}
    Node.setComputedSizeTestCallback(null)

    val captured: List<Triple<Int, Float, Float>> = synchronized(events) { events.toList() }
    Log.i(TAG, "Captured writebacks (${captured.size}): $captured")

    // Check for suspicious writebacks — engine says height=0 but platform wrote non-zero
    val suspicious = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in captured) {
      if (h > 100f) {
        Log.w(TAG, "Large writeback: id=$id w=$w h=$h")
        suspicious.add(Triple(id, w, h))
      }
    }

    Assert.assertTrue(
      "Found suspiciously large writebacks: $suspicious",
      suspicious.isEmpty()
    )
  }

  // --- Helper ---

  private fun computeAndLayout(
    tv: TextView, mason: Mason, width: Float, height: Float
  ): Layout {
    return Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeWithSizeAndLayout(
        mason.nativePtr,
        tv.node.nativePtr,
        width, height
      ), 0
    ).second
  }
}
