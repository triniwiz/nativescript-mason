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

// A scroller inside a vertical one, driven by finger-like paths: fractional coordinates, drift
// off the swipe axis, wobble on a tap, flicks, and content that takes taps as the demo's cards do.
@RunWith(AndroidJUnit4::class)
class NestedScrollGestureInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private class Fixture(val outer: Scroll, val inner: Scroll, val slop: Float) {
    var clicks = 0
  }

  private data class Offsets(val outerY: Int, val innerX: Int, val innerY: Int = 0)

  // Outer: 300x400px viewport, scrolls y over a 2000px column. The column's top 350px is the
  // inner scroller, which scrolls x over 1200px, and with [bothAxes] y over 1200px too.
  private fun withNested(bothAxes: Boolean = false, tappable: Boolean = false, block: (Fixture) -> Unit) {
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
        inner.style.overflow = Point(Overflow.Scroll, if (bothAxes) Overflow.Scroll else Overflow.Hidden)
        inner.style.setSizePoints(300f, 350f)
        inner.style.flexShrink = 0f
        val content = mason.createView(activity)
        content.setSize(1200f, if (bothAxes) 1200f else 350f)
        content.style.flexShrink = 0f
        inner.addView(content)
        column.addView(inner)
        outer.addView(column)
        host.addView(outer, FrameLayout.LayoutParams(300, 400))
        fixture = Fixture(outer, inner, ViewConfiguration.get(activity).scaledTouchSlop.toFloat())
        if (tappable) content.setOnClickListener { fixture.clicks++ }
      }
      instr.waitForIdleSync()
      instr.runOnMainSync {
        assertEquals(1600, fixture.outer.maxScrollY)
        assertEquals(900, fixture.inner.maxScrollX)
        assertEquals(if (bothAxes) 850 else 0, fixture.inner.maxScrollY)
      }
      block(fixture)
    }
  }

  private fun offsets(f: Fixture) = Offsets(f.outer.scrollY, f.inner.scrollX, f.inner.scrollY)

  /**
   * On the main thread: touches down at the first point, moves through the rest 8ms apart, and
   * ends with [end] at the last point; returns the offsets after each move.
   */
  private fun gesture(f: Fixture, path: List<Pair<Float, Float>>, end: Int = MotionEvent.ACTION_CANCEL): List<Offsets> {
    val seen = ArrayList<Offsets>()
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
      seen += offsets(f)
    }
    send(end, path.size - 1)
    return seen
  }

  private fun drag(f: Fixture, path: List<Pair<Float, Float>>, end: Int = MotionEvent.ACTION_CANCEL): List<Offsets> {
    lateinit var seen: List<Offsets>
    instr.runOnMainSync { seen = gesture(f, path, end) }
    return seen
  }

  private fun settle(): Unit = run {
    Thread.sleep(500)
    instr.waitForIdleSync()
  }

  // One 7.3px step: the move that crosses the slop starts the drag but doesn't scroll.
  private fun swiped(f: Fixture, distance: Float) = distance - f.slop - 7.3f - 3f

  private fun horizontalSwipe(f: Fixture) = (0..30).map { i ->
    Pair(250f - i * 7.3f, 200f + f.slop * 1.5f * i / 30f + 2.5f * sin(i * 1.7f))
  }

  private fun verticalSwipe(f: Fixture) = (0..30).map { i ->
    Pair(150f + f.slop * 1.5f * i / 30f + 2.5f * sin(i * 1.3f), 300f - i * 7.3f)
  }

  @Test
  fun horizontalSwipeWithVerticalDriftScrollsOnlyTheInnerScroller() = withNested { f ->
    val end = drag(f, horizontalSwipe(f)).last()
    assertEquals("outer scrollY", 0, end.outerY)
    assertTrue("inner scrollX ${end.innerX}", end.innerX >= swiped(f, 219f))
  }

  @Test
  fun verticalSwipeWithHorizontalDriftScrollsOnlyTheOuterScroller() = withNested { f ->
    val end = drag(f, verticalSwipe(f)).last()
    assertEquals("inner scrollX", 0, end.innerX)
    assertTrue("outer scrollY ${end.outerY}", end.outerY >= swiped(f, 219f))
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

  @Test
  fun aSwipeThatCurvesPastFortyFiveDegreesStaysWithTheScrollerThatClaimedIt() = withNested { f ->
    // 80px left, then 160px up: overall mostly vertical, but the inner scroller claimed it first.
    val path = (0..10).map { i -> Pair(250f - i * 8f, 300f) } + (1..20).map { i -> Pair(170f, 300f - i * 8f) }
    val end = drag(f, path).last()
    assertEquals("outer scrollY", 0, end.outerY)
    assertEquals("inner scrolls only along x", 0, end.innerY)
    assertTrue("inner scrollX ${end.innerX}", end.innerX >= swiped(f, 80f))
  }

  @Test
  fun aTwoAxisInnerScrollerTakesVerticalAndDiagonalSwipes() = withNested(bothAxes = true) { f ->
    val vertical = drag(f, verticalSwipe(f)).last()
    assertEquals("outer scrollY after a vertical swipe", 0, vertical.outerY)
    assertEquals("a vertical swipe locks to y", 0, vertical.innerX)
    assertTrue("inner scrollY ${vertical.innerY}", vertical.innerY >= swiped(f, 219f))

    val diagonal = drag(f, (0..20).map { i -> Pair(250f - i * 7f, 300f - i * 7f) }).last()
    assertEquals("outer scrollY after a diagonal swipe", 0, diagonal.outerY)
    assertTrue("a diagonal swipe moves x: ${diagonal.innerX}", diagonal.innerX >= swiped(f, 140f))
    assertTrue("a diagonal swipe moves y: ${diagonal.innerY - vertical.innerY}", diagonal.innerY - vertical.innerY >= swiped(f, 140f))
  }

  @Test
  fun tappableContentStillScrollsAndOnlyCountsTapsInsideTheSlop() = withNested(tappable = true) { f ->
    val end = drag(f, horizontalSwipe(f), MotionEvent.ACTION_UP).last()
    assertEquals("outer scrollY", 0, end.outerY)
    assertTrue("inner scrollX ${end.innerX}", end.innerX >= swiped(f, 219f))
    settle()
    assertEquals("a swipe isn't a tap", 0, f.clicks)

    val r = f.slop * 0.8f
    drag(f, (0..6).map { i -> Pair(150f + r * sin(i * 2.1f), 200f + r * sin(i * 3.7f)) }, MotionEvent.ACTION_UP)
    settle()
    assertEquals("a wobbly tap is a tap", 1, f.clicks)
  }

  @Test
  fun aFlickStartedOnTappableContentFlings() = withNested(tappable = true) { f ->
    var lifted = 0
    instr.runOnMainSync {
      gesture(f, (0..6).map { i -> Pair(260f - i * 30f, 200f) }, MotionEvent.ACTION_UP)
      lifted = f.inner.scrollX
    }
    settle()
    instr.runOnMainSync {
      assertTrue("flung from $lifted to ${f.inner.scrollX}", f.inner.scrollX >= lifted + 100)
      assertEquals("outer scrollY", 0, f.outer.scrollY)
    }
  }

  @Test
  fun catchingAFlingStillWaitsForTheTouchSlop() = withNested { f ->
    lateinit var caught: List<Offsets>
    instr.runOnMainSync {
      gesture(f, (0..6).map { i -> Pair(260f - i * 30f, 200f) }, MotionEvent.ACTION_UP)
      val r = f.slop * 0.8f
      caught = gesture(f, (0..8).map { i -> Pair(150f + r * sin(i * 2.1f), 200f + r * sin(i * 3.7f)) })
    }
    assertTrue("the wobble didn't scroll: $caught", caught.all { it == caught.first() })
    settle()
    instr.runOnMainSync { assertEquals("the fling stopped", caught.first(), offsets(f)) }
  }
}
