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

/** Focused first-render and native-memory coverage for the parent-drawn shadow path. */
@RunWith(AndroidJUnit4::class)
class BoxShadowBenchmark {
  private data class Box(val width: Int, val height: Int, val radius: Int, val shadow: String?)

  private val context = ApplicationProvider.getApplicationContext<android.content.Context>()
  private val mason = Mason.shared

  @Before
  fun enableDiagnostics() {
    DownsampleShadowStats.reset()
  }

  @After
  fun disableDiagnostics() {
    BoxShadowRenderer.legacyRasterScaleOverride = null
  }

  @Test
  fun homeFullResolution() {
    BoxShadowRenderer.legacyRasterScaleOverride = 1f
    report("Home 1x", homeBoxes())
  }

  @Test
  fun homeHalfResolution() {
    BoxShadowRenderer.legacyRasterScaleOverride = 0.5f
    report("Home 1/2", homeBoxes())
  }

  @Test
  fun homeQuarterResolution() {
    BoxShadowRenderer.legacyRasterScaleOverride = 0.25f
    report("Home 1/4", homeBoxes())
  }

  @Test
  fun homeDynamicResolution() {
    report("Home dynamic", homeBoxes())
  }

  private fun homeBoxes() = buildList {
      repeat(18) { add(Box(340, 220, 20, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)")) }
      repeat(4) { add(Box(260, 140, 18, "0px 6px 18px 0px rgba(15, 23, 42, 0.16)")) }
      repeat(3) { add(Box(400, 200, 24, "0px 0px 36px 4px rgba(99, 102, 241, 0.34)")) }
      add(Box(1080, 400, 28, "0px 16px 48px 0px rgba(15, 23, 42, 0.22)"))
      add(Box(340, 340, 20, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)"))
  }

  @Test
  fun gradientBuilderFirstRender() {
    val boxes = buildList {
      repeat(8) { index ->
        add(Box(860 - index * 45, 220 + index * 18, 12 + index * 3,
          "${index - 4}px ${8 + index}px ${12 + index * 6}px ${index % 3}px rgba(79, 70, 229, 0.${20 + index * 5})"))
      }
      repeat(6) { add(Box(320, 160, 16, "0px 10px 28px 2px rgba(15, 23, 42, 0.20)")) }
    }
    report("Gradient Builder", boxes)
    assertEquals(14, DownsampleShadowStats.snapshot().rasterizations)
  }

  @Test
  fun layoutStressFirstRender() {
    report("Layout Stress", List(108) { Box(180, 80, 0, null) })
    assertEquals(0, DownsampleShadowStats.snapshot().rasterizations)
  }

  @Test
  fun dynamicScaleSelection() {
    assertEquals(1f, BoxShadowRenderer.legacyRasterScale(4f))
    assertEquals(0.5f, BoxShadowRenderer.legacyRasterScale(8f))
    assertEquals(0.25f, BoxShadowRenderer.legacyRasterScale(24f))
  }

  @Test
  fun quarterScaleVisualDifferenceIsBounded() {
    val box = Box(520, 260, 24, "4px 12px 24px 3px rgba(79, 70, 229, 0.35)")
    val full = renderBitmap(box, 1f)
    val quarter = renderBitmap(box, 0.25f)
    val fullPixels = IntArray(full.width * full.height)
    val quarterPixels = IntArray(quarter.width * quarter.height)
    full.getPixels(fullPixels, 0, full.width, 0, 0, full.width, full.height)
    quarter.getPixels(quarterPixels, 0, quarter.width, 0, 0, quarter.width, quarter.height)
    var alphaError = 0L
    var largeDifferences = 0
    fullPixels.indices.forEach { index ->
      val difference = kotlin.math.abs((fullPixels[index] ushr 24) - (quarterPixels[index] ushr 24))
      alphaError += difference
      if (difference > 32) largeDifferences++
    }
    val meanAlphaError = alphaError.toDouble() / fullPixels.size
    val largeDifferencePercent = largeDifferences * 100.0 / fullPixels.size
    Log.i(TAG, "Visual 1/4 meanAlphaError=$meanAlphaError largeDifferencePercent=$largeDifferencePercent")
    assertTrue("mean alpha error $meanAlphaError", meanAlphaError < 4.0)
    assertTrue("large alpha difference $largeDifferencePercent%", largeDifferencePercent < 1.0)
    full.recycle()
    quarter.recycle()
  }

  private fun report(name: String, boxes: List<Box>) {
    val views = boxes.map(::shadowView)
    val target = Bitmap.createBitmap(1600, 3200, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(target)
    val before = memory()
    val started = SystemClock.elapsedRealtimeNanos()
    boxes.indices.forEach { index ->
      val box = boxes[index]
      if (box.shadow != null) draw(views[index], canvas, box.width, box.height)
      else views[index].draw(canvas)
    }
    val elapsed = SystemClock.elapsedRealtimeNanos() - started
    val after = memory()
    val stats = DownsampleShadowStats.snapshot()
    Log.i(
      TAG,
      "$name firstFrameMs=${elapsed / 1_000_000.0} " +
        "bitmapBytes=${stats.bitmapBytes} scales=${stats.scales} " +
        "rasterizations=${stats.rasterizations} rasterMs=${stats.rasterNanos / 1_000_000.0} " +
        "nativeHeapDelta=${after.nativeHeap - before.nativeHeap} " +
        "graphicsPssDeltaKb=${after.graphicsPssKb - before.graphicsPssKb}"
    )
    target.recycle()
  }

  private fun shadowView(box: Box): View = View(context, mason).also {
    it.style.borderRadius = "${box.radius}px"
    if (box.shadow != null) it.style.boxShadow = box.shadow
  }

  private fun renderBitmap(box: Box, scale: Float): Bitmap {
    BoxShadowRenderer.legacyRasterScaleOverride = scale
    val bitmap = Bitmap.createBitmap(900, 600, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.translate(180f, 150f)
    draw(shadowView(box), canvas, box.width, box.height)
    return bitmap
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

  private data class Memory(val nativeHeap: Long, val graphicsPssKb: Int)

  private fun memory(): Memory {
    val info = Debug.MemoryInfo()
    Debug.getMemoryInfo(info)
    return Memory(
      Debug.getNativeHeapAllocatedSize(),
      info.memoryStats["summary.graphics"]?.toIntOrNull() ?: 0,
    )
  }

  companion object {
    private const val TAG = "BoxShadowBenchmark"
  }
}
