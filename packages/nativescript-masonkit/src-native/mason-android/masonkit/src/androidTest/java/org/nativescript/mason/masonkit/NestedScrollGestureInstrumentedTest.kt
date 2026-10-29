package org.nativescript.mason.masonkit

import android.os.SystemClock
import android.view.MotionEvent
import android.view.ViewConfiguration
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Overflow
import kotlin.math.sin

// A horizontal scroller inside a vertical one, driven by finger-like paths: fractional
// coordinates, drift off the swipe axis, and wobble on a tap.
@RunWith(AndroidJUnit4::class)
class NestedScrollGestureInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private class Fixture(val outer: Scroll, val inner: Scroll, val slop: Float)

  private data class Offsets(val outerY: Int, val innerX: Int)

  // Outer: 300x400px viewport, scrolls y over a 2000px column. The column's top 350px is the
  // inner scroller, which scrolls x over 1200px.
  private fun withNested(block: (Fixture) -> Unit) {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var fixture: Fixture
      scenario.onActivity { activity ->
        val host = FrameLayout(activity)
        activity.setContentView(host)
        val mason = Mason()
        val outer = mason.createScrollView(activity)
        outer.style.overflow = Point(Overflow.Hidden, Overflow.Scroll)
        outer.style.setSizePoints(300f, 400f)
        val column = mason.createView(activity)
        column.setSize(300f, 2000f)
        column.style.flexShrink = 0f
        val inner = mason.createScrollView(activity)
        inner.style.overflow = Point(Overflow.Scroll, Overflow.Hidden)
        inner.style.setSizePoints(300f, 350f)
        inner.style.flexShrink = 0f
        val content = mason.createView(activity)
        content.setSize(1200f, 350f)
        content.style.flexShrink = 0f
        inner.addView(content)
        column.addView(inner)
        outer.addView(column)
        host.addView(outer, FrameLayout.LayoutParams(300, 400))
        fixture = Fixture(outer, inner, ViewConfiguration.get(activity).scaledTouchSlop.toFloat())
      }
      instr.waitForIdleSync()
      instr.runOnMainSync {
        assertEquals(1600, fixture.outer.maxScrollY)
        assertEquals(900, fixture.inner.maxScrollX)
        assertEquals(0, fixture.inner.maxScrollY)
      }
      block(fixture)
    }
  }

  /** Touches down at the first point, moves through the rest 8ms apart, and lifts; returns the offsets after each move. */
  private fun drag(f: Fixture, path: List<Pair<Float, Float>>): List<Offsets> {
    val seen = ArrayList<Offsets>()
    instr.runOnMainSync {
      val down = SystemClock.uptimeMillis()
      fun send(action: Int, i: Int) {
        val (x, y) = path[i]
        val event = MotionEvent.obtain(down, down + i * 8L, action, x, y, 0)
        f.outer.dispatchTouchEvent(event)
        event.recycle()
      }
      send(MotionEvent.ACTION_DOWN, 0)
      for (i in 1 until path.size) {
        send(MotionEvent.ACTION_MOVE, i)
        seen += Offsets(f.outer.scrollY, f.inner.scrollX)
      }
      send(MotionEvent.ACTION_CANCEL, path.size - 1)
    }
    return seen
  }

  @Test
  fun horizontalSwipeWithVerticalDriftScrollsOnlyTheInnerScroller() = withNested { f ->
    val path = (0..30).map { i ->
      Pair(250f - i * 7.3f, 200f + f.slop * 1.5f * i / 30f + 2.5f * sin(i * 1.7f))
    }
    val end = drag(f, path).last()
    assertEquals("outer scrollY", 0, end.outerY)
    assertTrue("inner scrollX ${end.innerX}", end.innerX >= 219 - f.slop - 10)
  }

  @Test
  fun verticalSwipeWithHorizontalDriftScrollsOnlyTheOuterScroller() = withNested { f ->
    val path = (0..30).map { i ->
      Pair(150f + f.slop * 1.5f * i / 30f + 2.5f * sin(i * 1.3f), 300f - i * 7.3f)
    }
    val end = drag(f, path).last()
    assertEquals("inner scrollX", 0, end.innerX)
    assertTrue("outer scrollY ${end.outerY}", end.outerY >= 219 - f.slop - 10)
  }

  @Test
  fun wobbleWithinTheTouchSlopScrollsNothing() = withNested { f ->
    val r = f.slop * 0.8f
    // Every point stays within r of the down point on each axis.
    val path = (0..12).map { i -> Pair(150f + r * sin(i * 2.1f), 200f + r * sin(i * 3.7f)) }
    for (offsets in drag(f, path)) assertEquals(Offsets(0, 0), offsets)
  }

  @Test
  fun slowSubPixelMovesStillScroll() = withNested { f ->
    // Past the slop quickly, then 100 moves of 0.6px, as a slow finger reports at a high sample rate.
    val fast = (0..10).map { i -> Pair(250f - i * 6f, 200f) }
    val slow = (1..100).map { i -> Pair(190f - i * 0.6f, 200f) }
    val seen = drag(f, fast + slow)
    val afterFast = seen[fast.size - 2].innerX
    val moved = seen.last().innerX - afterFast
    assertTrue("slow moves scrolled $moved of 60px", moved >= 58)
  }
}
