package org.nativescript.mason.masonkit

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.os.Debug
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.PixelCopy
import android.view.View as AndroidView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class BoxShadowHardwareBenchmark {
  private data class Box(val width: Int, val height: Int, val radius: Int, val shadow: String?)

  @Before
  fun resetStats() = HardwareShadowStats.reset()

  @Test
  fun homeLegacyFirstFrame() = measure("Home legacy", homeBoxes(), forceLegacy = true)

  @Test
  fun homeHardwareFirstFrame() = measure("Home RenderNode", homeBoxes(), forceLegacy = false)

  @Test
  fun gradientLegacyFirstFrame() = measure("Gradient legacy", gradientBoxes(), forceLegacy = true)

  @Test
  fun gradientHardwareFirstFrame() = measure("Gradient RenderNode", gradientBoxes(), forceLegacy = false)

  @Test
  fun layoutStressFirstFrame() = measure(
    "Layout Stress",
    List(108) { Box(180, 80, 0, null) },
    forceLegacy = false,
  )

  @Test
  fun hardwarePathBuildsNoSoftwareShadowBitmaps() {
    measure("RenderNode allocation check", homeBoxes(), forceLegacy = false)
    val stats = HardwareShadowStats.snapshot()
    assertEquals(27, stats.nodes)
    assertEquals(27, stats.builds)
  }

  @Test
  fun profileHomeLegacy() {
    SystemClock.sleep(3_000)
    measure("Home legacy profile", homeBoxes(), forceLegacy = true)
  }

  @Test
  fun profileHomeHardware() {
    SystemClock.sleep(3_000)
    measure("Home RenderNode profile", homeBoxes(), forceLegacy = false)
  }

  private fun measure(name: String, boxes: List<Box>, forceLegacy: Boolean) {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      val drawn = CountDownLatch(1)
      val copied = CountDownLatch(1)
      lateinit var activity: Activity
      lateinit var surface: ShadowSurface
      val before = memory()
      val started = SystemClock.elapsedRealtimeNanos()
      scenario.onActivity {
        activity = it
        surface = ShadowSurface(it, boxes, forceLegacy) { drawn.countDown() }
        it.setContentView(surface)
      }
      assertTrue("first draw timed out", drawn.await(10, TimeUnit.SECONDS))
      val screenshot = Bitmap.createBitmap(surface.width, surface.height, Bitmap.Config.ARGB_8888)
      val location = IntArray(2)
      surface.getLocationInWindow(location)
      val source = Rect(location[0], location[1], location[0] + surface.width, location[1] + surface.height)
      PixelCopy.request(activity.window, source, screenshot, { copied.countDown() }, Handler(Looper.getMainLooper()))
      assertTrue("PixelCopy timed out", copied.await(10, TimeUnit.SECONDS))
      val elapsed = SystemClock.elapsedRealtimeNanos() - started
      val after = memory()
      val stats = HardwareShadowStats.snapshot()
      assertTrue("expected a hardware canvas", surface.usedHardwareCanvas)
      val visibleShadowPixels = if (boxes.any { it.shadow != null }) countFirstCardShadowPixels(screenshot) else 0
      if (boxes.any { it.shadow != null }) assertTrue("shadow was not visible", visibleShadowPixels > 100)
      Log.i(
        TAG,
        "$name firstFrameMs=${elapsed / 1_000_000.0} nodes=${stats.nodes} " +
          "nodeBuildMs=${stats.buildNanos / 1_000_000.0} " +
          "visibleShadowPixels=$visibleShadowPixels " +
          "nativeHeapDelta=${after.nativeHeap - before.nativeHeap} " +
          "graphicsPssDeltaKb=${after.graphicsPssKb - before.graphicsPssKb}",
      )
      screenshot.recycle()
    }
  }

  private fun countFirstCardShadowPixels(bitmap: Bitmap): Int {
    val background = Color.rgb(245, 247, 250)
    var count = 0
    for (y in 262 until minOf(286, bitmap.height)) {
      for (x in 30 until minOf(358, bitmap.width)) {
        val pixel = bitmap.getPixel(x, y)
        val difference = kotlin.math.abs(Color.red(pixel) - Color.red(background)) +
          kotlin.math.abs(Color.green(pixel) - Color.green(background)) +
          kotlin.math.abs(Color.blue(pixel) - Color.blue(background))
        if (difference > 6) count++
      }
    }
    return count
  }

  private class ShadowSurface(
    activity: Activity,
    boxes: List<Box>,
    private val forceLegacy: Boolean,
    private val drawn: () -> Unit,
  ) : AndroidView(activity) {
    private val shadows = boxes.map { box ->
      box to org.nativescript.mason.masonkit.View(activity, Mason.shared).also {
        it.style.borderRadius = "${box.radius}px"
        if (box.shadow != null) it.style.boxShadow = box.shadow
      }
    }
    private val contentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
    private var reported = false
    var usedHardwareCanvas = false
      private set

    override fun onDraw(canvas: Canvas) {
      usedHardwareCanvas = canvas.isHardwareAccelerated
      canvas.drawColor(Color.rgb(245, 247, 250))
      shadows.forEachIndexed { index, (box, view) ->
        if (box.shadow == null) return@forEachIndexed
        val x = (index % 3) * 360f + 24f
        val y = (index / 3) * 250f + 40f
        val save = canvas.save()
        canvas.translate(x, y)
        view.style.mBorderRenderer.updateCache(box.width.toFloat(), box.height.toFloat())
        view.style.mBoxShadowRenderer.drawOutsetShadows(
          view,
          canvas,
          box.width.toFloat(),
          box.height.toFloat(),
          view.style.mBorderRenderer,
          forceLegacy,
        )
        canvas.drawRoundRect(0f, 0f, box.width.toFloat(), box.height.toFloat(), box.radius.toFloat(), box.radius.toFloat(), contentPaint)
        canvas.restoreToCount(save)
      }
      if (!reported) {
        reported = true
        drawn()
      }
    }
  }

  private fun homeBoxes() = buildList {
    repeat(18) { add(Box(340, 220, 20, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)")) }
    repeat(4) { add(Box(260, 140, 18, "0px 6px 18px 0px rgba(15, 23, 42, 0.16)")) }
    repeat(3) { add(Box(400, 200, 24, "0px 0px 36px 4px rgba(99, 102, 241, 0.34)")) }
    add(Box(1080, 400, 28, "0px 16px 48px 0px rgba(15, 23, 42, 0.22)"))
    add(Box(340, 340, 20, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)"))
  }

  private fun gradientBoxes() = buildList {
    repeat(8) { index ->
      add(Box(860 - index * 45, 220 + index * 18, 12 + index * 3,
        "${index - 4}px ${8 + index}px ${12 + index * 6}px ${index % 3}px rgba(79, 70, 229, 0.${20 + index * 5})"))
    }
    repeat(6) { add(Box(320, 160, 16, "0px 10px 28px 2px rgba(15, 23, 42, 0.20)")) }
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
    private const val TAG = "BoxShadowHardware"
  }
}
