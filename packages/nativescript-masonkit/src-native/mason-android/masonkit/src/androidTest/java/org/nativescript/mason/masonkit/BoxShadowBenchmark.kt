package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Debug
import android.os.SystemClock
import android.util.Log
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.math.abs

/** Focused coverage for the combined shared and downsampled software fallback. */
@RunWith(AndroidJUnit4::class)
class BoxShadowBenchmark {
  private data class Box(val width: Int, val height: Int, val radius: Int, val shadow: String?)

  private val context = ApplicationProvider.getApplicationContext<android.content.Context>()
  private val mason = Mason.shared

  @Before
  fun resetStats() {
    SharedBoxShadowCache.resetForBenchmark()
    DownsampleShadowStats.reset()
    BoxShadowDiagnostics.enabled = true
    BoxShadowDiagnostics.reset()
    BoxShadowRenderer.softwareRasterScaleOverride = null
  }

  @After
  fun clearOverrides() {
    BoxShadowRenderer.softwareRasterScaleOverride = null
    BoxShadowDiagnostics.enabled = false
  }

  @Test
  fun homeUsesSharedDownsampledResources() {
    report("Home software auto", homeBoxes())
    val cache = SharedBoxShadowCache.snapshot()
    val raster = DownsampleShadowStats.snapshot()
    assertEquals(5, cache.uniqueResources)
    assertEquals(22, cache.hits)
    assertEquals(5, cache.misses)
    assertEquals(5, cache.rasterizations)
    assertEquals(5, raster.rasterizations)
    assertEquals(5, BoxShadowDiagnostics.snapshot().rasterizations)
    assertTrue(raster.scales.keys.all { it == 0.25f })
  }

  @Test
  fun rasterScaleOverrideControlsMemory() {
    val box = homeBoxes().first()
    BoxShadowRenderer.softwareRasterScaleOverride = 1f
    report("Single shadow 1x", listOf(box))
    val fullBytes = DownsampleShadowStats.snapshot().bitmapBytes

    SharedBoxShadowCache.resetForBenchmark()
    DownsampleShadowStats.reset()
    BoxShadowRenderer.softwareRasterScaleOverride = 0.25f
    report("Single shadow quarter", listOf(box))
    val quarterBytes = DownsampleShadowStats.snapshot().bitmapBytes

    assertTrue("quarter=$quarterBytes full=$fullBytes", quarterBytes < fullBytes / 10)
  }

  @Test(expected = IllegalArgumentException::class)
  fun rasterScaleOverrideRejectsInvalidValues() {
    BoxShadowRenderer.softwareRasterScaleOverride = 0f
  }

  @Test
  fun quarterScaleVisualDifferenceIsBounded() {
    val box = Box(360, 220, 28, "0px 10px 24px 2px rgba(20, 30, 60, 0.35)")
    val full = render(box, 1f)
    val quarter = render(box, 0.25f)
    var alphaError = 0L
    var largeErrors = 0
    val pixels = full.width * full.height
    val a = IntArray(pixels)
    val b = IntArray(pixels)
    full.getPixels(a, 0, full.width, 0, 0, full.width, full.height)
    quarter.getPixels(b, 0, quarter.width, 0, 0, quarter.width, quarter.height)
    for (i in a.indices) {
      val error = abs((a[i] ushr 24) - (b[i] ushr 24))
      alphaError += error
      if (error > 32) largeErrors++
    }
    val mean = alphaError.toDouble() / pixels
    val largeFraction = largeErrors.toDouble() / pixels
    Log.i(TAG, "visual meanAlphaError=$mean largeErrorFraction=$largeFraction")
    assertTrue("mean alpha error $mean", mean < 6.0)
    assertTrue("large alpha error fraction $largeFraction", largeFraction < 0.03)
    full.recycle()
    quarter.recycle()
  }

  @Test
  fun repeatedDrawAndReplacementAccounting() {
    val view = shadowView(homeBoxes().first())
    val target = Bitmap.createBitmap(1200, 600, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(target)
    draw(view, canvas, 340, 220)
    draw(view, canvas, 340, 220)
    draw(view, canvas, 341, 220)
    val stats = BoxShadowDiagnostics.snapshot()
    assertEquals(2, stats.cacheMisses)
    assertEquals(1, stats.cacheHits)
    assertEquals(1, stats.cacheReplacements)
    target.recycle()
  }

  @Test
  fun layoutStressHasNoShadowWork() {
    report("Layout Stress", List(108) { Box(180, 80, 0, null) })
    assertEquals(0, SharedBoxShadowCache.snapshot().rasterizations)
  }

  private fun report(name: String, boxes: List<Box>) {
    val views = boxes.map(::shadowView)
    val target = Bitmap.createBitmap(1600, 3200, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(target)
    val before = Debug.getNativeHeapAllocatedSize()
    val started = SystemClock.elapsedRealtimeNanos()
    boxes.indices.forEach { index ->
      val box = boxes[index]
      if (box.shadow != null) draw(views[index], canvas, box.width, box.height)
      else views[index].draw(canvas)
    }
    val elapsed = SystemClock.elapsedRealtimeNanos() - started
    Log.i(
      TAG,
      "$name firstFrameMs=${elapsed / 1_000_000.0} cache=${SharedBoxShadowCache.snapshot()} " +
        "raster=${DownsampleShadowStats.snapshot()} diagnostics=${BoxShadowDiagnostics.snapshot()} " +
        "nativeHeapDelta=${Debug.getNativeHeapAllocatedSize() - before}"
    )
    target.recycle()
  }

  private fun render(box: Box, scale: Float): Bitmap {
    SharedBoxShadowCache.resetForBenchmark()
    DownsampleShadowStats.reset()
    BoxShadowRenderer.softwareRasterScaleOverride = scale
    val target = Bitmap.createBitmap(640, 480, Bitmap.Config.ARGB_8888)
    draw(shadowView(box), Canvas(target), box.width, box.height)
    return target
  }

  private fun homeBoxes() = buildList {
    repeat(18) { add(Box(340, 220, 20, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)")) }
    repeat(4) { add(Box(260, 140, 18, "0px 6px 18px 0px rgba(15, 23, 42, 0.16)")) }
    repeat(3) { add(Box(400, 200, 24, "0px 0px 36px 4px rgba(99, 102, 241, 0.34)")) }
    add(Box(1080, 400, 28, "0px 16px 48px 0px rgba(15, 23, 42, 0.22)"))
    add(Box(340, 340, 20, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)"))
  }

  private fun shadowView(box: Box) = View(context, mason).also {
    it.style.borderRadius = "${box.radius}px"
    if (box.shadow != null) it.style.boxShadow = box.shadow
  }

  private fun draw(view: View, canvas: Canvas, width: Int, height: Int) {
    view.style.mBorderRenderer.updateCache(width.toFloat(), height.toFloat())
    view.style.mBoxShadowRenderer.drawOutsetShadows(
      view, canvas, width.toFloat(), height.toFloat(), view.style.mBorderRenderer, forceLegacy = true
    )
  }

  companion object {
    private const val TAG = "BoxShadowBenchmark"
  }
}
