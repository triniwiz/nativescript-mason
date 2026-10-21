package org.nativescript.mason.masonkit

import android.os.SystemClock
import android.view.MotionEvent
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Overflow

// Element scrolling: clamping, seeks before layout, events, smooth scrolls and detach.
@RunWith(AndroidJUnit4::class)
class ScrollInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private class Fixture(val host: FrameLayout, val scroll: Scroll)

  // 200x150px viewport over 1000x2000px content: range (800, 1850).
  private fun withScroll(attach: Boolean = true, block: (ActivityScenario<BenchmarkActivity>, Fixture) -> Unit) {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var fixture: Fixture
      scenario.onActivity { activity ->
        val host = FrameLayout(activity)
        activity.setContentView(host)
        val mason = Mason()
        val scroll = mason.createScrollView(activity)
        scroll.style.overflow = Point(Overflow.Scroll, Overflow.Scroll)
        scroll.style.setSizePoints(200f, 150f)
        val child = mason.createView(activity)
        child.setSize(1000f, 2000f)
        child.style.flexShrink = 0f
        scroll.addView(child)
        if (attach) host.addView(scroll, FrameLayout.LayoutParams(200, 150))
        fixture = Fixture(host, scroll)
      }
      instr.waitForIdleSync()
      block(scenario, fixture)
    }
  }

  private fun main(block: () -> Unit) = instr.runOnMainSync(block)

  private fun counter(scroll: Scroll, type: String): Pair<() -> Int, java.util.UUID> {
    var n = 0
    val id = scroll.addEventListener(type) { n++ }
    return Pair({ n }, id)
  }

  @Test
  fun seekBeforeLayoutIsKeptPerAxisAndClampedAfterLayout() = withScroll(attach = false) { _, f ->
    main {
      WebScroll.scrollTo(f.scroll, 10f, 20f, false)
      WebScroll.scrollTo(f.scroll, 300f, Float.NaN, false)
      WebScroll.scrollTo(f.scroll, Float.NaN, 99999f, false)
      assertEquals(0, f.scroll.scrollY)
      f.host.addView(f.scroll, FrameLayout.LayoutParams(200, 150))
    }
    instr.waitForIdleSync()
    main {
      assertEquals(800, f.scroll.maxScrollX)
      assertEquals(1850, f.scroll.maxScrollY)
      assertEquals(300, f.scroll.scrollX)
      assertEquals(1850, f.scroll.scrollY)
    }
  }

  @Test
  fun clampsBothAxesAndOverflowHiddenStaysPut() = withScroll { _, f ->
    main {
      WebScroll.scrollTo(f.scroll, 99999f, -100f, false)
      assertEquals(800, f.scroll.scrollX)
      assertEquals(0, f.scroll.scrollY)
      assertEquals(1000f, WebScroll.scrollWidth(f.scroll))
      assertEquals(2000f, WebScroll.scrollHeight(f.scroll))
      assertEquals(200f, WebScroll.clientWidth(f.scroll))
      // At the end of the range, scrollLeft + clientWidth == scrollWidth.
      assertEquals(WebScroll.scrollWidth(f.scroll), WebScroll.scrollLeft(f.scroll) + WebScroll.clientWidth(f.scroll))
      WebScroll.scrollTo(f.scroll, 0f, 0f, false)
      f.scroll.configure { it.overflow = Point(Overflow.Hidden, Overflow.Hidden) }
    }
    instr.waitForIdleSync()
    main {
      WebScroll.scrollTo(f.scroll, 100f, 100f, false)
      assertEquals(0, f.scroll.scrollX)
      assertEquals(0, f.scroll.scrollY)
      assertEquals(0, f.scroll.maxScrollX)
      assertEquals(0, f.scroll.maxScrollY)
    }
  }

  @Test
  fun eventsCoalescePerTurnAndStopWithoutListeners() = withScroll { _, f ->
    lateinit var scrolls: Pair<() -> Int, java.util.UUID>
    lateinit var ends: Pair<() -> Int, java.util.UUID>
    main {
      // No listener: nothing is queued.
      WebScroll.scrollTo(f.scroll, 0f, 50f, false)
      assertFalse(f.scroll.node.listensForScroll)
      scrolls = counter(f.scroll, "scroll")
      ends = counter(f.scroll, "scrollend")
      WebScroll.scrollTo(f.scroll, 0f, 100f, false)
      WebScroll.scrollTo(f.scroll, 0f, 200f, false)
      WebScroll.scrollTo(f.scroll, 10f, 300f, false)
      // Asynchronous, as on the web.
      assertEquals(0, scrolls.first())
    }
    instr.waitForIdleSync()
    main {
      assertEquals(1, scrolls.first())
      assertEquals(1, ends.first())
      f.scroll.removeEventListener("scroll", scrolls.second)
      f.scroll.removeEventListener("scrollend", ends.second)
      WebScroll.scrollTo(f.scroll, 0f, 0f, false)
    }
    instr.waitForIdleSync()
    main {
      assertEquals(1, scrolls.first())
      assertFalse(f.scroll.node.listensForScroll)
    }
  }

  @Test
  fun smoothScrollReplacementStopTouchAndDetach() = withScroll { _, f ->
    lateinit var ends: Pair<() -> Int, java.util.UUID>
    main {
      ends = counter(f.scroll, "scrollend")
      WebScroll.scrollTo(f.scroll, 400f, 1200f, true)
    }
    Thread.sleep(80)
    main {
      assertTrue(f.scroll.scrollY in 1..1199)
      // A new smooth scroll replaces it; only the last one ends.
      WebScroll.scrollTo(f.scroll, 100f, 500f, true)
    }
    Thread.sleep(500)
    instr.waitForIdleSync()
    main {
      assertEquals(100, f.scroll.scrollX)
      assertEquals(500, f.scroll.scrollY)
      assertEquals(1, ends.first())
      // An instant seek cancels a running smooth scroll.
      WebScroll.scrollTo(f.scroll, 400f, 1200f, true)
      WebScroll.scrollTo(f.scroll, 20f, 40f, false)
    }
    Thread.sleep(400)
    var stopped = Pair(0, 0)
    main {
      assertEquals(20, f.scroll.scrollX)
      assertEquals(40, f.scroll.scrollY)
      WebScroll.scrollTo(f.scroll, 400f, 1200f, true)
    }
    Thread.sleep(80)
    main {
      // Seeking to the current offset stops it where it is.
      WebScroll.scrollTo(f.scroll, f.scroll.scrollX.toFloat(), f.scroll.scrollY.toFloat(), false)
      stopped = Pair(f.scroll.scrollX, f.scroll.scrollY)
    }
    Thread.sleep(400)
    main {
      assertEquals(stopped, Pair(f.scroll.scrollX, f.scroll.scrollY))
      // A touch stops it too.
      WebScroll.scrollTo(f.scroll, 400f, 1200f, true)
    }
    Thread.sleep(80)
    main {
      val now = SystemClock.uptimeMillis()
      for (action in intArrayOf(MotionEvent.ACTION_DOWN, MotionEvent.ACTION_UP)) {
        val event = MotionEvent.obtain(now, now, action, 100f, 75f, 0)
        f.scroll.dispatchTouchEvent(event)
        event.recycle()
      }
      stopped = Pair(f.scroll.scrollX, f.scroll.scrollY)
    }
    Thread.sleep(400)
    var before = 0
    main {
      assertEquals(stopped, Pair(f.scroll.scrollX, f.scroll.scrollY))
      before = ends.first()
      WebScroll.scrollTo(f.scroll, 0f, 0f, true)
    }
    Thread.sleep(60)
    main {
      // Leaving the window stops it, and still ends it.
      f.host.removeView(f.scroll)
      stopped = Pair(f.scroll.scrollX, f.scroll.scrollY)
      assertFalse(f.scroll.isScrollInMotion)
    }
    Thread.sleep(400)
    instr.waitForIdleSync()
    main {
      assertEquals(stopped, Pair(f.scroll.scrollX, f.scroll.scrollY))
      assertEquals(before + 1, ends.first())
    }
  }
}
