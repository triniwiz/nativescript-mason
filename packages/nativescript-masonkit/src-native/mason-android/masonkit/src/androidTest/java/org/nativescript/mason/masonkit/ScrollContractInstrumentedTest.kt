package org.nativescript.mason.masonkit

import android.view.View.MeasureSpec
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.nativescript.mason.masonkit.enums.Overflow
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ScrollContractInstrumentedTest {
  private val instrumentation = InstrumentationRegistry.getInstrumentation()

  private fun fixture(): Scroll {
    val mason = Mason()
    val scroll = mason.createScrollView(instrumentation.targetContext)
    scroll.style.overflow = Point(Overflow.Scroll, Overflow.Scroll)
    scroll.style.setSizePoints(200f, 150f)
    val child = mason.createView(instrumentation.targetContext)
    child.setSize(1000f, 2000f)
    child.style.flexShrink = 0f
    scroll.addView(child)
    return scroll
  }

  private fun layout(scroll: Scroll) {
    scroll.forceLayout()
    scroll.measure(MeasureSpec.makeMeasureSpec(200, MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(150, MeasureSpec.EXACTLY))
    scroll.layout(0, 0, 200, 150)
  }

  @Test fun bothAxesBoundsPendingAndNativeNotifications() {
    instrumentation.runOnMainSync {
      val scroll = fixture()
      var events = 0
      scroll.scrollListener = object : TwoDScrollView.ScrollChangeListener {
        override fun onScrollChanged(view: android.view.View?, x: Int, y: Int, oldx: Int, oldy: Int) {
          assertEquals(x, scroll.scrollX)
          assertEquals(y, scroll.scrollY)
          events++
        }
      }
      scroll.measure(MeasureSpec.makeMeasureSpec(200, MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(150, MeasureSpec.EXACTLY))
      scroll.scrollToOffset(10, 20, false)
      scroll.scrollToOffset(300, 1200, false)
      assertEquals(0, scroll.scrollY)
      assertEquals(0, scroll.scrollableWidth)
      assertEquals(0, scroll.scrollableHeight)
      layout(scroll)
      assertEquals(300, scroll.scrollX)
      assertEquals(1200, scroll.scrollY)
      assertTrue(scroll.scrollableWidth > 300)
      assertTrue(scroll.scrollableHeight > 1200)
      scroll.scrollToOffset(Int.MAX_VALUE, -100, false)
      assertEquals(scroll.scrollableWidth, scroll.scrollX)
      assertEquals(0, scroll.scrollY)
      // The notification is native, also covering movement initiated outside the JS seek.
      scroll.scrollTo(50, 60)
      val beforeTouch = events
      val now = android.os.SystemClock.uptimeMillis()
      fun touch(action: Int, x: Float, y: Float, time: Long) {
        val event = android.view.MotionEvent.obtain(now, time, action, x, y, 0)
        scroll.onTouchEvent(event)
        event.recycle()
      }
      scroll.scrollToOffset(400, 1200, true)
      touch(android.view.MotionEvent.ACTION_DOWN, 180f, 130f, now)
      touch(android.view.MotionEvent.ACTION_MOVE, 100f, 30f, now + 100)
      assertEquals(130, scroll.scrollX)
      assertEquals(160, scroll.scrollY)
      assertTrue(events > beforeTouch)
      touch(android.view.MotionEvent.ACTION_CANCEL, 100f, 30f, now + 200)
      scroll.stopScrolling()
      assertTrue(events >= 3)
      val count = events
      scroll.scrollListener = null
      scroll.scrollToOffset(0, 0, false)
      assertEquals(count, events)
      android.util.Log.i("ScrollContract", "ranges=${scroll.scrollableWidth},${scroll.scrollableHeight} offsets=${scroll.scrollX},${scroll.scrollY} events=$count density=${scroll.resources.displayMetrics.density}")
      scroll.style.overflow = Point(Overflow.Hidden, Overflow.Hidden)
      layout(scroll)
      scroll.scrollToOffset(100, 100, false)
      assertEquals(0, scroll.scrollX)
      assertEquals(0, scroll.scrollY)
      assertEquals(0, scroll.scrollableWidth)
      assertEquals(0, scroll.scrollableHeight)
    }
  }

  @Test fun animationReplacementAndStop() {
    lateinit var scroll: Scroll
    instrumentation.runOnMainSync {
      scroll = fixture()
      layout(scroll)
      scroll.scrollToOffset(400, 1200, true)
    }
    Thread.sleep(80)
    instrumentation.runOnMainSync {
      assertTrue(scroll.scrollY in 1..1199)
      scroll.scrollToOffset(100, 500, true)
    }
    Thread.sleep(400)
    instrumentation.runOnMainSync {
      assertEquals(100, scroll.scrollX)
      assertEquals(500, scroll.scrollY)
      scroll.scrollToOffset(400, 1200, true)
      scroll.scrollToOffset(20, 40, false)
    }
    Thread.sleep(350)
    instrumentation.runOnMainSync {
      assertEquals(20, scroll.scrollX)
      assertEquals(40, scroll.scrollY)
      scroll.scrollToOffset(400, 1200, true)
      scroll.stopScrolling()
    }
    Thread.sleep(350)
    instrumentation.runOnMainSync {
      assertEquals(20, scroll.scrollX)
      assertEquals(40, scroll.scrollY)
    }
  }
}
