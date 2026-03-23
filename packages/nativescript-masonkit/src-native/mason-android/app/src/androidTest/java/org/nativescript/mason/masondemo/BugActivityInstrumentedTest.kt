package org.nativescript.mason.masondemo

import android.view.ViewGroup
import android.view.ViewTreeObserver
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class BugActivityInstrumentedTest {
  @Test
  fun bugActivity_childrenKeepTheirComputedPositions() {
    ActivityScenario.launch(BugActivity::class.java).use { scenario ->
      val bodyRef = arrayOfNulls<ViewGroup>(1)
      val containerRef = arrayOfNulls<ViewGroup>(1)
      val layoutLatch = CountDownLatch(1)

      scenario.onActivity { activity ->
        val root = activity.findViewById<ViewGroup>(android.R.id.content)
        val body = root.getChildAt(0) as? ViewGroup
        val container = body?.getChildAt(0) as? ViewGroup

        bodyRef[0] = body
        containerRef[0] = container

        if (body == null) {
          layoutLatch.countDown()
          return@onActivity
        }

        val listener = object : ViewTreeObserver.OnGlobalLayoutListener {
          override fun onGlobalLayout() {
            if (body.width > 0 && body.height > 0) {
              body.viewTreeObserver.removeOnGlobalLayoutListener(this)
              layoutLatch.countDown()
            }
          }
        }

        body.viewTreeObserver.addOnGlobalLayoutListener(listener)
        body.requestLayout()
      }

      assertTrue("Timed out waiting for BugActivity layout", layoutLatch.await(3, TimeUnit.SECONDS))
      InstrumentationRegistry.getInstrumentation().waitForIdleSync()

      scenario.onActivity {
        val body = bodyRef[0]
        val container = containerRef[0]

        assertNotNull("BugActivity body view missing", body)
        assertNotNull("BugActivity container view missing", container)
        assertTrue("BugActivity container has no children", (container?.childCount ?: 0) > 1)

        val sampleCount = minOf(container!!.childCount, 32)
        val positions = (0 until sampleCount).map { index ->
          val child = container.getChildAt(index)
          child.left to child.top
        }

        assertTrue(
          "Expected children to keep non-zero computed positions, got $positions",
          positions.any { (left, top) -> left != 0 || top != 0 }
        )
        assertTrue(
          "Expected multiple child positions after final layout, got $positions",
          positions.toSet().size > 1
        )
      }
    }
  }
}
