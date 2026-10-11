package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection

/**
 * `white-space: nowrap` text is laid out unconstrained, a million pixels wide; a centred label
 * must still draw inside its button (Bootstrap's `.btn` and `.badge` are both `nowrap`).
 */
@RunWith(AndroidJUnit4::class)
class ButtonNoWrapInstrumentedTest {

  private fun createMason(): Mason {
    val mason = Mason()
    mason.setDeviceScale(
      InstrumentationRegistry.getInstrumentation().targetContext.resources.displayMetrics.density
    )
    return mason
  }

  /** Columns of [btn]'s drawn bitmap that hold any opaque-ish pixel. */
  private fun inkColumns(btn: Button): List<Int> {
    val bitmap = Bitmap.createBitmap(btn.width, btn.height, Bitmap.Config.ARGB_8888)
    bitmap.eraseColor(Color.TRANSPARENT)
    btn.draw(Canvas(bitmap))
    val columns = mutableListOf<Int>()
    for (x in 0 until bitmap.width) {
      for (y in 0 until bitmap.height) {
        if (Color.alpha(bitmap.getPixel(x, y)) > 128) {
          columns.add(x)
          break
        }
      }
    }
    return columns
  }

  private fun layOut(whiteSpace: Styles.WhiteSpace): Button {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = createMason()
    val root = mason.createView(context)
    root.style.display = Display.Flex
    root.style.flexDirection = FlexDirection.Column

    val btn = Button(context, mason)
    btn.textContent = "Apply"
    btn.whiteSpace = whiteSpace
    btn.configure { style ->
      // No border and a transparent background, so only the label draws.
      style.border = "0 solid #000000"
      style.backgroundColor = Color.TRANSPARENT
      style.color = Color.BLACK
    }
    root.addView(btn)

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val tree = root.computeAndLayout(300f, -1f)
      if (tree.nodeCount > 0) root.applyLayoutFlat(root.node, tree)
    }
    return btn
  }

  private fun assertLabelDrawnCentred(whiteSpace: Styles.WhiteSpace) {
    val btn = layOut(whiteSpace)
    var columns = emptyList<Int>()
    InstrumentationRegistry.getInstrumentation().runOnMainSync { columns = inkColumns(btn) }

    assertTrue("$whiteSpace: the label should draw inside the button", columns.isNotEmpty())
    val leftGap = columns.first()
    val rightGap = btn.width - 1 - columns.last()
    assertTrue(
      "$whiteSpace: the label should be centred (left gap $leftGap, right gap $rightGap, width ${btn.width})",
      kotlin.math.abs(leftGap - rightGap) <= btn.width / 10
    )
  }

  @Test
  fun wrappingLabelIsCentred() = assertLabelDrawnCentred(Styles.WhiteSpace.Normal)

  @Test
  fun noWrapLabelIsDrawnAndCentred() = assertLabelDrawnCentred(Styles.WhiteSpace.NoWrap)
}
