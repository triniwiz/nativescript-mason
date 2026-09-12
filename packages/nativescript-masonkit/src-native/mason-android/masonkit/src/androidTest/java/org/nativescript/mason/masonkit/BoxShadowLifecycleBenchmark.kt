package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Debug
import android.os.SystemClock
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/** Regression coverage for releasing parent-drawn shadow resources. */
@RunWith(AndroidJUnit4::class)
class BoxShadowLifecycleBenchmark {
  private data class Box(val width: Int, val height: Int, val radius: Int, val shadow: String)

  private val context = ApplicationProvider.getApplicationContext<android.content.Context>()
  private val mason = Mason.shared

  @Before
  fun resetStats() = BoxShadowLifecycleStats.reset()

  @Test
  fun windowDetachDropsCachedShadow() {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val root = FrameLayout(activity)
        val view = shadowView(homeBoxes().first(), activity)
        root.addView(view, ViewGroup.LayoutParams(340, 220))
        activity.setContentView(root)

        val target = Bitmap.createBitmap(600, 500, Bitmap.Config.ARGB_8888)
        draw(view, Canvas(target), 340, 220)
        assertEquals(1, BoxShadowLifecycleStats.snapshot().retainedResources)

        root.removeView(view)
        val released = BoxShadowLifecycleStats.snapshot()
        assertEquals(0, released.retainedResources)
        assertEquals(1, released.windowDetachReleases)

        root.addView(view, ViewGroup.LayoutParams(340, 220))
        draw(view, Canvas(target), 340, 220)
        assertEquals("shadow must rebuild after reattach", 1, BoxShadowLifecycleStats.snapshot().retainedResources)
        view.releaseBoxShadowResources()
        target.recycle()
      }
    }
  }

  @Test
  fun nodeRemovalDropsCachedShadowEvenWhenNeverWindowAttached() {
    val parent = View(context, mason)
    val child = shadowView(homeBoxes().first())
    parent.node.appendChild(child.node)
    val target = Bitmap.createBitmap(600, 500, Bitmap.Config.ARGB_8888)
    draw(child, Canvas(target), 340, 220)
    assertEquals(1, BoxShadowLifecycleStats.snapshot().retainedResources)

    parent.node.removeChild(child.node)
    assertEquals(0, BoxShadowLifecycleStats.snapshot().retainedResources)
    target.recycle()
  }

  @Test
  fun resizeReplacementDoesNotAccumulateRetainedBitmaps() {
    val view = shadowView(homeBoxes().first())
    val target = Bitmap.createBitmap(700, 500, Bitmap.Config.ARGB_8888)
    draw(view, Canvas(target), 340, 220)
    val firstBytes = BoxShadowLifecycleStats.snapshot().retainedBytes
    draw(view, Canvas(target), 341, 220)
    val afterResize = BoxShadowLifecycleStats.snapshot()
    assertEquals(1, afterResize.retainedResources)
    assertEquals(1, afterResize.releasedResources)
    assertTrue(afterResize.releasedBytes >= firstBytes)
    view.releaseBoxShadowResources()
    target.recycle()
  }

  @Test
  fun repeatedHomeNavigationReleasesEveryResource() {
    val baseline = nativeHeapAfterGc()
    val heaps = mutableListOf<Long>()
    repeat(5) { cycle ->
      renderAndDetachHome()
      val heap = nativeHeapAfterGc()
      heaps.add(heap)
      val stats = BoxShadowLifecycleStats.snapshot()
      assertEquals("cycle $cycle retained resources", 0, stats.retainedResources)
      assertEquals("cycle $cycle retained bytes", 0L, stats.retainedBytes)
    }
    val finalHeap = heaps.last()
    Log.i(
      TAG,
      "Home lifecycle baselineNativeHeap=$baseline cycleNativeHeaps=$heaps " +
        "finalDelta=${finalHeap - baseline} stats=${BoxShadowLifecycleStats.snapshot()}"
    )
    // Repeated identical pages should reuse the bounded temporary bitmap pool rather than grow each cycle.
    assertTrue("native heap kept climbing: $heaps", heaps.zipWithNext().any { (a, b) -> b <= a })
  }

  private fun renderAndDetachHome() {
    val boxes = homeBoxes()
    val views = boxes.map(::shadowView)
    val target = Bitmap.createBitmap(1600, 3200, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(target)
    boxes.indices.forEach { index ->
      val box = boxes[index]
      draw(views[index], canvas, box.width, box.height)
    }
    val rendered = BoxShadowLifecycleStats.snapshot()
    assertEquals(27, rendered.retainedResources)
    views.forEach { it.releaseBoxShadowResources() }
    target.recycle()
  }

  private fun homeBoxes() = buildList {
    repeat(18) { add(Box(340, 220, 20, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)")) }
    repeat(4) { add(Box(260, 140, 18, "0px 6px 18px 0px rgba(15, 23, 42, 0.16)")) }
    repeat(3) { add(Box(400, 200, 24, "0px 0px 36px 4px rgba(99, 102, 241, 0.34)")) }
    add(Box(1080, 400, 28, "0px 16px 48px 0px rgba(15, 23, 42, 0.22)"))
    add(Box(340, 340, 20, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)"))
  }

  private fun shadowView(box: Box, targetContext: android.content.Context = context) =
    View(targetContext, mason).also {
      it.style.borderRadius = "${box.radius}px"
      it.style.boxShadow = box.shadow
    }

  private fun draw(view: View, canvas: Canvas, width: Int, height: Int) {
    view.style.mBorderRenderer.updateCache(width.toFloat(), height.toFloat())
    view.style.mBoxShadowRenderer.drawOutsetShadows(
      view,
      canvas,
      width.toFloat(),
      height.toFloat(),
      view.style.mBorderRenderer,
      forceLegacy = true,
    )
  }

  private fun nativeHeapAfterGc(): Long {
    Runtime.getRuntime().gc()
    System.runFinalization()
    SystemClock.sleep(200)
    return Debug.getNativeHeapAllocatedSize()
  }

  companion object {
    private const val TAG = "BoxShadowLifecycle"
  }
}
