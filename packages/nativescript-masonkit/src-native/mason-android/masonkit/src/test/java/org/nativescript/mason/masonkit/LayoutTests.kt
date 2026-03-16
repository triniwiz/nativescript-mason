package org.nativescript.mason.masonkit

import org.junit.Test
import org.junit.Assert.*

// bring the Mason-specific enums into scope with disambiguation
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.DisplayMode
import kotlin.math.absoluteValue
import org.nativescript.mason.masonkit.enums.Float as MasonFloat

/**
 * A small collection of layout tests ported from the Rust core suite.  The
 * focus here is exercising the Android JNI bindings so that floating and
 * display mode behaviour can be confirmed from the JVM in addition to the
 * native regression tests that live in `crates/mason-core`.
 */
class LayoutTests {

  // helpers used across several tests ------------------------------------------------

  private val measure20x10 = object : MeasureFunc {
    override fun measure(
      knownDimensions: Size<Float?>,
      availableSpace: Size<Float?>
    ): Size<Float> {
      return Size(20f, 10f)
    }
  }

  private val measure30x15 = object : MeasureFunc {
    override fun measure(
      knownDimensions: Size<Float?>,
      availableSpace: Size<Float?>
    ): Size<Float> {
      return Size(30f, 15f)
    }
  }

  private val measure68x68 = object : MeasureFunc {
    override fun measure(
      knownDimensions: Size<Float?>,
      availableSpace: Size<Float?>
    ): Size<Float> {
      return Size(68f, 68f)
    }
  }

  private val measure200x20 = object : MeasureFunc {
    override fun measure(
      knownDimensions: Size<Float?>,
      availableSpace: Size<Float?>
    ): Size<Float> {
      return Size(200f, 20f)
    }
  }

  /**
   * Make a simple measured "box" node of the given size with an optional
   * float value.  The behaviour mirrors the Rust helper used in the
   * `android_float_activity_repro` test so that we can reuse the same
   * constants without capturing lambdas/closures.
   */
  private fun makeBox(
    m: Mason,
    w: Float,
    h: Float,
    fl: MasonFloat?
  ): Node {
    val meas = when {
      (w - 68f).absoluteValue < 0.001f && (h - 68f).absoluteValue < 0.001f -> measure68x68
      (w - 200f).absoluteValue < 0.001f && (h - 20f).absoluteValue < 0.001f -> measure200x20
      else -> measure20x10
    }

    val n = m.createNode(meas)
    n.style.display = Display.Block
    if (fl != null) {
      n.style.float = fl
    }
    return n
  }

  // --- tests ---------------------------------------------------------------

  @Test
  fun basicDisplayTypesDoNotCrash() {
    val variants = arrayOf(Display.Block, Display.Flex, Display.Grid, Display.None)

    for (disp in variants) {
      val mason = Mason()
      val root = mason.createNode()
      root.style.display = Display.Block
      root.style.size = Size(Dimension.Points(100f), Dimension.Points(100f))

      val child = mason.createNode(measure20x10)
      child.style.display = disp

      root.appendChild(child)

      val floats = NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.getNativePtr(), root.nativePtr, 100f, 100f)
      if (floats.isNotEmpty()) root.layoutTree.fromFloatArray(floats)

      val layout = child.computedLayout
      assertTrue(layout.width >= 0f && layout.width.isFinite())
      assertTrue(layout.height >= 0f && layout.height.isFinite())
    }
  }

  @Test
  fun displayModeVariantsAffectLayout() {
    // pick display values that exercise each mode via the Kotlin setter logic
    val variants = arrayOf(
      Display.None,       // mode None
      Display.Inline,     // mode Inline
      Display.InlineBlock, // mode Box
      Display.InlineFlex, // mode Box (flex)
      Display.InlineGrid, // mode Box (grid)
      Display.ListItem    // mode ListItem
    )

    for (variant in variants) {
      val mason = Mason()
      val n = mason.createNode(measure30x15)
      n.style.display = variant

      // unconstrained compute (compute+layout to populate layoutTree)
      val floats = NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.getNativePtr(), n.nativePtr, 50f, 50f)
      if (floats.isNotEmpty()) n.layoutTree.fromFloatArray(floats)
      val lay = n.computedLayout
      assertTrue(lay.width > 0f && lay.width.isFinite())
      assertTrue(lay.height.isFinite())
    }
  }

  @Test
  fun mixedDisplayChildrenPreserveConstraints() {
    val mason = Mason()
    val root = mason.createNode()
    root.style.display = Display.Block
    root.style.size = Size(Dimension.Points(100f), Dimension.Points(100f))

    val b = mason.createNode(measure20x10)
    b.style.display = Display.Block

    val f = mason.createNode(measure20x10)
    f.style.display = Display.Flex

    root.appendChild(b)
    root.appendChild(f)

    val floats = NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.getNativePtr(), root.nativePtr, 100f, 100f)
    if (floats.isNotEmpty()) root.layoutTree.fromFloatArray(floats)

    val lb = b.computedLayout
    val lf = f.computedLayout
    assertTrue(lb.width <= 100f + 1e-3f)
    assertTrue(lf.width <= 100f + 1e-3f)
  }

  @Test
  fun mixedDisplayModeSiblings() {
    val mason = Mason()
    val root = mason.createNode()
    root.style.display = Display.Block
    root.style.size = Size(Dimension.Points(100f), Dimension.Points(100f))

    val inlineNode = mason.createNode(measure20x10)
    inlineNode.style.display = Display.Inline

    val boxNode = mason.createNode(measure20x10)
    boxNode.style.display = Display.InlineBlock

    root.appendChild(inlineNode)
    root.appendChild(boxNode)

    val floats = NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.getNativePtr(), root.nativePtr, 100f, 100f)
    if (floats.isNotEmpty()) root.layoutTree.fromFloatArray(floats)

    assertTrue(inlineNode.computedLayout.width > 0f)
    assertTrue(boxNode.computedLayout.width > 0f)
  }

  @Test
  fun androidFloatActivityRepro() {
    val mason = Mason()

    val root = mason.createNode()
    root.style.display = Display.Block
    root.style.size = Size(Dimension.Points(300f), Dimension.Auto)

    // card container
    val card = mason.createNode()
    card.style.display = Display.Block

    // drop‑cap left float
    val drop = makeBox(mason, 68f, 68f, MasonFloat.Left)
    card.appendChild(drop)

    // prose text following
    val prose = makeBox(mason, 200f, 20f, null)
    card.appendChild(prose)

    root.appendChild(card)

    val floats = NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.getNativePtr(), root.nativePtr, 300f, Float.NaN)
    if (floats.isNotEmpty()) root.layoutTree.fromFloatArray(floats)

    val rects = NativeHelpers.nativeNodeGetFloatRects(mason.getNativePtr(), root.nativePtr)
    assertTrue(rects.isNotEmpty())
    // third element in the flat array is width of third rectangle
    assertEquals(68f, rects[2], 0.001f)
  }
}
