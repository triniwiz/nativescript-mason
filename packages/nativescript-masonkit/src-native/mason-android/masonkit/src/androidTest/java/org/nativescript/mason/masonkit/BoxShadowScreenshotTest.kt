package org.nativescript.mason.masonkit

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.PixelCopy
import android.view.View as AndroidView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.abs

@RunWith(AndroidJUnit4::class)
class BoxShadowScreenshotTest {
  private data class Variant(
    val title: String,
    val fileName: String,
    val mode: BoxShadowRenderer.RenderMode,
    val scale: Float?,
  )

  private data class Card(
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val radius: Float,
    val shadow: String,
    val label: String,
  )

  @After
  fun resetOverrides() {
    BoxShadowRenderer.renderModeOverride = null
    BoxShadowRenderer.softwareRasterScaleOverride = null
  }

  @Test
  fun captureSelectedVariant() {
    val selected = InstrumentationRegistry.getArguments().getString("shadowVariant") ?: "rendernode"
    val variant = variants[selected] ?: error("Unknown shadowVariant: $selected")
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var activity: Activity
      lateinit var surface: ScreenshotSurface
      scenario.onActivity {
        activity = it
        it.actionBar?.hide()
        surface = ScreenshotSurface(it)
        it.setContentView(surface)
      }
      capture(activity, surface, variant)
    }
  }

  private fun capture(activity: Activity, surface: ScreenshotSurface, variant: Variant) {
    val drawn = CountDownLatch(1)
    activity.runOnUiThread {
      BoxShadowRenderer.renderModeOverride = variant.mode
      BoxShadowRenderer.softwareRasterScaleOverride = variant.scale
      SharedBoxShadowCache.resetForBenchmark()
      surface.showVariant(variant.title) { drawn.countDown() }
    }
    assertTrue("draw timed out", drawn.await(10, TimeUnit.SECONDS))
    val committed = CountDownLatch(1)
    surface.postOnAnimation { committed.countDown() }
    assertTrue("committed frame timed out", committed.await(10, TimeUnit.SECONDS))
    SystemClock.sleep(750)

    val copied = CountDownLatch(1)
    val screenshot = Bitmap.createBitmap(surface.width, surface.height, Bitmap.Config.ARGB_8888)
    val location = IntArray(2)
    surface.getLocationInWindow(location)
    val source = Rect(location[0], location[1], location[0] + surface.width, location[1] + surface.height)
    var result = PixelCopy.ERROR_UNKNOWN
    PixelCopy.request(activity.window, source, screenshot, {
      result = it
      copied.countDown()
    }, Handler(Looper.getMainLooper()))
    assertTrue("PixelCopy timed out", copied.await(10, TimeUnit.SECONDS))
    assertEquals(PixelCopy.SUCCESS, result)
    if (variant.mode == BoxShadowRenderer.RenderMode.RENDER_NODE) {
      // The old CLAMP/unpadded node produced no blur outside its left source bound.
      val pixel = screenshot.getPixel(60, 250)
      val background = Color.rgb(245, 247, 250)
      val distance = abs(Color.red(pixel) - Color.red(background)) +
        abs(Color.green(pixel) - Color.green(background)) +
        abs(Color.blue(pixel) - Color.blue(background))
      assertTrue("RenderNode shadow is clipped at the source bounds", distance > 8)
    }
    val outputBitmap = screenshot.copy(Bitmap.Config.ARGB_8888, true)
    surface.annotate(outputBitmap)

    val directory = requireNotNull(activity.getExternalFilesDir("box-shadow-screenshots"))
    val output = File(directory, variant.fileName)
    FileOutputStream(output).use { outputBitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    Log.i(TAG, "saved=${output.absolutePath} width=${outputBitmap.width} height=${outputBitmap.height}")
    outputBitmap.recycle()
    screenshot.recycle()
  }

  private class ScreenshotSurface(
    activity: Activity,
  ) : AndroidView(activity) {
    private var title = "Box-shadow renderer comparison"
    private var drawn: (() -> Unit)? = null
    private val density = resources.displayMetrics.density
    private val cards = listOf(
      Card(72f, 180f, 936f, 250f, 32f, "0px 16px 48px 0px rgba(15, 23, 42, 0.22)", "Large, soft hero shadow"),
      Card(72f, 520f, 432f, 220f, 24f, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)", "Standard card"),
      Card(576f, 520f, 432f, 220f, 56f, "0px 8px 24px 0px rgba(15, 23, 42, 0.18)", "Large corner radius"),
      Card(72f, 840f, 300f, 120f, 16f, "0px 3px 8px 0px rgba(15, 23, 42, 0.28)", "Small blur"),
      Card(480f, 825f, 528f, 170f, 28f, "0px 0px 36px 4px rgba(99, 102, 241, 0.40)", "Translucent glow + spread"),
      Card(72f, 1090f, 936f, 220f, 12f, "-12px 20px 40px 8px rgba(2, 132, 199, 0.28)", "Offset shadow + spread"),
    )
    private val shadows = cards.map { card ->
      card to org.nativescript.mason.masonkit.View(activity, Mason.shared).also {
        it.style.borderRadius = "${card.radius}px"
        it.style.boxShadow = card.shadow
      }
    }
    private val cardPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
    private val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.rgb(15, 23, 42)
      textSize = 24f * density
      typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
    }
    private val subtitlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.rgb(100, 116, 139)
      textSize = 16f * density
    }
    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.rgb(51, 65, 85)
      textSize = 15f * density
      typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
    }

    fun showVariant(title: String, drawn: () -> Unit) {
      this.title = title
      this.drawn = drawn
      invalidate()
    }

    fun annotate(bitmap: Bitmap) {
      val canvas = Canvas(bitmap)
      cards.forEach { card ->
        canvas.drawText(card.label, card.x + 28f, card.y + card.height / 2f + 6f, labelPaint)
      }
      canvas.drawText(title, 72f, 76f, titlePaint)
      canvas.drawText("Identical geometry, style, device and capture path", 72f, 125f, subtitlePaint)
    }

    override fun onDraw(canvas: Canvas) {
      canvas.drawColor(Color.rgb(245, 247, 250))
      shadows.forEach { (card, view) ->
        val save = canvas.save()
        canvas.translate(card.x, card.y)
        view.style.mBorderRenderer.updateCache(card.width, card.height)
        view.style.mBoxShadowRenderer.drawOutsetShadows(
          view,
          canvas,
          card.width,
          card.height,
          view.style.mBorderRenderer,
          false,
        )
        canvas.restoreToCount(save)
      }

      cards.forEach { card ->
        val save = canvas.save()
        canvas.translate(card.x, card.y)
        canvas.drawRoundRect(0f, 0f, card.width, card.height, card.radius, card.radius, cardPaint)
        canvas.restoreToCount(save)
      }

      drawn?.also {
        drawn = null
        it()
      }
    }
  }

  companion object {
    private const val TAG = "BoxShadowScreenshot"
    private val variants = mapOf(
      "rendernode" to Variant("RenderNode · API 31+", "box-shadow-rendernode.png", BoxShadowRenderer.RenderMode.RENDER_NODE, null),
      "software-1x" to Variant("Software · full resolution", "box-shadow-software-full.png", BoxShadowRenderer.RenderMode.SOFTWARE, 1f),
      "software-half" to Variant("Software · 1/2 resolution", "box-shadow-software-half.png", BoxShadowRenderer.RenderMode.SOFTWARE, 0.5f),
      "software-quarter" to Variant("Software · 1/4 resolution", "box-shadow-software-quarter.png", BoxShadowRenderer.RenderMode.SOFTWARE, 0.25f),
      "software-dynamic" to Variant("Software · dynamic resolution", "box-shadow-software-dynamic.png", BoxShadowRenderer.RenderMode.SOFTWARE, null),
    )
  }
}
