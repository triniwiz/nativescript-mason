package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.TextType
import kotlin.math.abs

/** text-indent, line-clamp, text-overflow: ellipsis and transform-origin. */
@RunWith(AndroidJUnit4::class)
class TextIndentClampOriginInstrumentedTest {

  private val context = InstrumentationRegistry.getInstrumentation().targetContext
  private val density = context.resources.displayMetrics.density

  private val longText = "The quick brown fox jumps over the lazy dog. ".repeat(8).trim()

  private fun createMason(): Mason = Mason().apply { setDeviceScale(density) }

  private fun column(mason: Mason, alignItems: AlignItems = AlignItems.Stretch): View =
    mason.createView(context).apply {
      style.display = Display.Flex
      style.flexDirection = FlexDirection.Column
      style.alignItems = alignItems
    }

  private fun text(mason: Mason, value: String): TextView =
    mason.createTextView(context, TextType.Span).apply {
      style.display = Display.Block
      textContent = value
    }

  private fun layOut(root: View, width: Float) {
    root.style.setSizeWidth(width, Dimension.Kind.Points.value)
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val tree = root.computeAndLayout(width, -1f)
      if (tree.nodeCount > 0) root.applyLayoutFlat(root.node, tree)
    }
  }

  private fun draw(view: android.view.View) {
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val bitmap = Bitmap.createBitmap(maxOf(view.width, 1), maxOf(view.height, 1), Bitmap.Config.ARGB_8888)
      view.draw(Canvas(bitmap))
    }
  }

  private fun laidOutText(width: Float, value: String = longText, configure: (TextView, View) -> Unit): TextView {
    val mason = createMason()
    val root = column(mason)
    val tv = text(mason, value)
    root.addView(tv)
    configure(tv, root)
    layOut(root, width)
    return tv
  }

  @Test
  fun lineClampShrinksToTheClampedLinesAndEllipsizes() {
    val width = 300f * density
    val plain = laidOutText(width) { _, _ -> }
    val oneLine = laidOutText(width, "Short") { _, _ -> }
    val clamped = laidOutText(width) { tv, _ -> tv.style.lineClamp = 2 }

    val lineHeight = oneLine.height
    assertTrue("unclamped text should wrap to many lines (${plain.height} vs $lineHeight)", plain.height > lineHeight * 3)
    assertTrue(
      "a 2-line clamp should be about two lines tall (${clamped.height} vs line $lineHeight)",
      abs(clamped.height - 2 * lineHeight) <= 2
    )

    draw(clamped)
    val layout = clamped.cachedStaticLayout
    assertNotNull(layout)
    assertEquals(2, layout!!.lineCount)
    assertTrue("the last visible line should end in an ellipsis", layout.getEllipsisCount(1) > 0)
  }

  @Test
  fun lineClampOnAContainerReachesItsText() {
    val width = 300f * density
    val oneLine = laidOutText(width, "Short") { _, _ -> }
    val clamped = laidOutText(width) { _, root -> root.style.lineClamp = 1 }
    assertTrue(
      "an inherited 1-line clamp should be one line tall (${clamped.height} vs ${oneLine.height})",
      abs(clamped.height - oneLine.height) <= 2
    )
  }

  @Test
  fun lineClampSetAfterLayoutRelayouts() {
    val width = 300f * density
    val mason = createMason()
    val root = column(mason)
    val tv = text(mason, longText)
    root.addView(tv)
    layOut(root, width)
    val before = tv.height
    InstrumentationRegistry.getInstrumentation().runOnMainSync { root.style.lineClamp = 1 }
    layOut(root, width)
    val clamped = tv.height
    InstrumentationRegistry.getInstrumentation().runOnMainSync { root.style.lineClamp = 0 }
    layOut(root, width)
    assertTrue("clamping after layout should shrink the text ($before -> $clamped)", clamped * 3 < before)
    assertEquals("removing the clamp should restore the height", before, tv.height)
  }

  @Test
  fun textIndentStartsFromTheRightInRtl() {
    val width = 300f * density
    val tv = laidOutText(width, "\u05e9\u05dc\u05d5\u05dd \u05e2\u05d5\u05dc\u05dd") { tv, _ ->
      tv.style.direction = org.nativescript.mason.masonkit.enums.Direction.RTL
      tv.style.setTextIndent(30f, false)
    }
    draw(tv)
    val layout = tv.cachedStaticLayout!!
    val contentWidth = tv.width - tv.paddingLeft - tv.paddingRight
    assertEquals(contentWidth - 30f * density, layout.getPrimaryHorizontal(0), 1f)
  }

  @Test
  fun textIndentGrowsMaxContentAndShiftsTheFirstLine() {
    val width = 600f * density
    fun shrinkWrapped(indent: String?): TextView {
      val mason = createMason()
      val root = column(mason, AlignItems.FlexStart)
      val tv = text(mason, "Indented")
      root.addView(tv)
      if (indent != null) tv.style.textIndent = indent
      layOut(root, width)
      draw(tv)
      return tv
    }

    val plain = shrinkWrapped(null)
    val indented = shrinkWrapped("40px")
    val indentPx = 40f * density
    assertTrue(
      "max-content width should grow by the indent (${plain.width} -> ${indented.width}, indent $indentPx)",
      abs(indented.width - plain.width - indentPx) <= 2f
    )
    val layout = indented.cachedStaticLayout!!
    assertEquals(indentPx, layout.getPrimaryHorizontal(0), 1f)
    assertEquals("40px", indented.style.textIndent)
  }

  @Test
  fun textIndentWrapsTheFirstLineEarlierAndOnlyIndentsIt() {
    val width = 300f * density
    val plain = laidOutText(width) { _, _ -> }
    val indented = laidOutText(width) { tv, _ -> tv.style.textIndent = "10%" }
    draw(plain)
    draw(indented)
    val plainLayout = plain.cachedStaticLayout!!
    val layout = indented.cachedStaticLayout!!
    val expected = 0.1f * (indented.width - indented.paddingLeft - indented.paddingRight)
    assertEquals(expected, layout.getPrimaryHorizontal(0), 1.5f)
    assertEquals(0f, layout.getPrimaryHorizontal(layout.getLineStart(1)), 0.5f)
    assertTrue(
      "the indented first line should hold less text (${layout.getLineEnd(0)} vs ${plainLayout.getLineEnd(0)})",
      layout.getLineEnd(0) < plainLayout.getLineEnd(0)
    )
  }

  @Test
  fun textOverflowEllipsisCutsANoWrapLine() {
    val tv = laidOutText(120f * density) { tv, _ ->
      tv.style.whiteSpace = Styles.WhiteSpace.NoWrap
      tv.style.textOverflow = Styles.TextOverflow.Ellipse
      tv.style.overflowX = org.nativescript.mason.masonkit.enums.Overflow.Hidden
    }
    draw(tv)
    val layout = tv.cachedStaticLayout!!
    assertEquals(1, layout.lineCount)
    assertTrue("the line should be ellipsized", layout.getEllipsisCount(0) > 0)
  }

  @Test
  fun transformOriginSetsThePivot() {
    val mason = createMason()
    val root = column(mason, AlignItems.FlexStart)
    val box = mason.createView(context)
    box.style.setSizeWidth(100f * density, Dimension.Kind.Points.value)
    box.style.setSizeHeight(50f * density, Dimension.Kind.Points.value)
    root.addView(box)
    box.style.transform = "rotate(45deg)"
    box.style.transformOrigin = "left top"
    layOut(root, 400f * density)
    assertEquals(0f, box.pivotX, 0.01f)
    assertEquals(0f, box.pivotY, 0.01f)

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      box.style.transformOrigin = "100% 20px"
    }
    assertEquals(box.width.toFloat(), box.pivotX, 0.01f)
    assertEquals(20f * density, box.pivotY, 0.5f)
    assertEquals("100% 20px", box.style.transformOrigin)

    // A percentage follows a resize.
    box.style.setSizeWidth(200f * density, Dimension.Kind.Points.value)
    layOut(root, 400f * density)
    assertEquals(box.width.toFloat(), box.pivotX, 0.01f)
    assertEquals(200f * density, box.pivotX, 1f)
  }
}
