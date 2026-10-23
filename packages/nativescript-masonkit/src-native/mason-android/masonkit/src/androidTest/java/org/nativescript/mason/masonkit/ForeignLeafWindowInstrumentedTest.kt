package org.nativescript.mason.masonkit

import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import android.widget.TextView as AndroidTextView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection

// Foreign leaf changes driven by a real window traversal rather than manual measure/layout calls.
@RunWith(AndroidJUnit4::class)
class ForeignLeafWindowInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private class Fixture(val root: View, val leaf: AndroidTextView, val footer: View)

  private fun withFixture(direction: FlexDirection, block: (Fixture) -> Unit) {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var fixture: Fixture
      scenario.onActivity { activity ->
        val host = FrameLayout(activity)
        activity.setContentView(host)
        val mason = Mason()
        val root = mason.createView(activity).apply {
          style.display = Display.Flex
          style.flexDirection = direction
        }
        val leaf = AndroidTextView(activity).apply {
          text = "short"
          val width = if (direction == FlexDirection.Column) ViewGroup.LayoutParams.MATCH_PARENT else ViewGroup.LayoutParams.WRAP_CONTENT
          layoutParams = ViewGroup.LayoutParams(width, ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        val footer = mason.createView(activity).apply { style.setSizePoints(20f, 20f) }
        root.addView(leaf)
        root.addView(footer)
        host.addView(root, FrameLayout.LayoutParams(800, FrameLayout.LayoutParams.WRAP_CONTENT))
        fixture = Fixture(root, leaf, footer)
      }
      instr.waitForIdleSync()
      block(fixture)
    }
  }

  // Changes the text, then counts the traversals that lay the window out until it settles.
  private fun changeText(f: Fixture, text: String): Int {
    var layouts = 0
    val listener = ViewTreeObserver.OnGlobalLayoutListener { layouts++ }
    instr.runOnMainSync {
      f.root.viewTreeObserver.addOnGlobalLayoutListener(listener)
      f.leaf.text = text
    }
    Thread.sleep(300)
    instr.waitForIdleSync()
    instr.runOnMainSync { f.root.viewTreeObserver.removeOnGlobalLayoutListener(listener) }
    return layouts
  }

  @Test
  fun columnTextGrowthReflowsInOneTraversal() = withFixture(FlexDirection.Column) { f ->
    var initialHeight = 0
    instr.runOnMainSync { initialHeight = f.leaf.height }
    val layouts = changeText(f, "longer text that wraps ".repeat(12))
    instr.runOnMainSync {
      assertTrue("text should grow", f.leaf.height > initialHeight)
      assertEquals("stretched width", 800, f.leaf.width)
      assertEquals("wrapped height", f.leaf.layout.height + f.leaf.totalPaddingTop + f.leaf.totalPaddingBottom, f.leaf.height)
      assertEquals(f.leaf.bottom, f.footer.top)
      assertEquals(f.leaf.height + f.footer.height, f.root.height)
    }
    assertEquals("traversals", 1, layouts)
  }

  @Test
  fun rowTextGrowthWidensInOneTraversal() = withFixture(FlexDirection.Row) { f ->
    var initialWidth = 0
    instr.runOnMainSync { initialWidth = f.leaf.width }
    val layouts = changeText(f, "a much longer label")
    instr.runOnMainSync {
      assertTrue("text should widen", f.leaf.width > initialWidth)
      assertEquals(f.leaf.right, f.footer.left)
    }
    assertEquals("traversals", 1, layouts)
  }

  @Test
  fun nestedRootInForeignLeafReflowsItsSiblings() {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var leaf: FrameLayout
      lateinit var footer: View
      scenario.onActivity { activity ->
        val host = FrameLayout(activity)
        activity.setContentView(host)
        val mason = Mason()
        val root = mason.createView(activity).apply {
          style.display = Display.Flex
          style.flexDirection = FlexDirection.Row
        }
        // A foreign layout hosting its own Mason root only knows its size outside the outer compute.
        leaf = FrameLayout(activity).apply {
          layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        val nested = mason.createView(activity).apply {
          addView(mason.createView(activity).apply { style.setSizePoints(100f, 50f) })
        }
        leaf.addView(nested, FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT))
        footer = mason.createView(activity).apply { style.setSizePoints(20f, 20f) }
        root.addView(leaf)
        root.addView(footer)
        host.addView(root, FrameLayout.LayoutParams(800, FrameLayout.LayoutParams.WRAP_CONTENT))
      }
      Thread.sleep(300)
      instr.waitForIdleSync()
      instr.runOnMainSync {
        assertEquals(100, leaf.width)
        assertEquals(leaf.right, footer.left)
      }
    }
  }
}
