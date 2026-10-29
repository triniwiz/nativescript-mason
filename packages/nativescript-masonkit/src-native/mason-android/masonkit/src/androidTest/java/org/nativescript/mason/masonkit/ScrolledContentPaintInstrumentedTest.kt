package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.Overflow

@RunWith(AndroidJUnit4::class)
class ScrolledContentPaintInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private fun withBox(block: (Scroll) -> Unit) {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var box: Scroll
      scenario.onActivity { activity ->
        val host = FrameLayout(activity)
        activity.setContentView(host)
        val mason = Mason()
        box = mason.createScrollView(activity)
        box.visibleOverflowScrolls = false
        box.style.overflow = Point(Overflow.Scroll, Overflow.Scroll)
        box.style.borderRadius = "12px"
        box.style.setSizePoints(300f, 260f)
        val content = mason.createScrollView(activity)
        content.visibleOverflowScrolls = false
        content.style.flexShrink = 0f
        content.style.display = Display.Flex
        content.style.flexDirection = FlexDirection.Column
        for (i in 0 until 9) {
          val row = mason.createView(activity)
          row.setSize(600f, 100f)
          row.style.flexShrink = 0f
          row.style.background = if (i % 2 == 0) "red" else "blue"
          content.addView(row)
        }
        box.addView(content)
        host.addView(box, FrameLayout.LayoutParams(300, 260))
      }
      instr.waitForIdleSync()
      block(box)
    }
  }

  private fun render(box: Scroll): Bitmap {
    val bitmap = Bitmap.createBitmap(300, 260, Bitmap.Config.ARGB_8888)
    // Through the parent: a view's own scroll offset is applied by whoever draws it.
    instr.runOnMainSync { (box.parent as android.view.View).draw(Canvas(bitmap)) }
    return bitmap
  }

  private fun rowColor(scrollY: Int, y: Int) = if (((scrollY + y) / 100) % 2 == 0) Color.RED else Color.BLUE

  @Test
  fun contentScrolledIntoViewPaintsInsideRoundedCorners() = withBox { box ->
    instr.runOnMainSync {
      assertEquals(640, box.maxScrollY)
      box.scrollTo(100, 450)
    }
    val bitmap = render(box)
    for (y in intArrayOf(20, 60, 130, 240)) {
      for (x in intArrayOf(20, 150)) {
        assertEquals("pixel at $x,$y", rowColor(450, y), bitmap.getPixel(x, y))
      }
    }
  }
}
