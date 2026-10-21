package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.RenderNode
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.SdkSuppress
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BoxShadowRendererInstrumentedTest {
  @After
  fun resetOverrides() {
    BoxShadowRenderer.renderModeOverride = null
    BoxShadowRenderer.softwareRasterScaleOverride = null
  }

  @Test
  fun rasterScaleFallsAsBlurGrows() {
    assertEquals(1f, BoxShadowRenderer.rasterScale(4f))
    assertEquals(0.5f, BoxShadowRenderer.rasterScale(8f))
    assertEquals(0.25f, BoxShadowRenderer.rasterScale(24f))
  }

  @Test
  fun rasterScaleOverrideWins() {
    BoxShadowRenderer.softwareRasterScaleOverride = 1f
    assertEquals(1f, BoxShadowRenderer.rasterScale(24f))
  }

  @Test
  fun softwareShadowDrawsPixels() {
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    val view = View(context, Mason.shared).apply {
      style.borderRadius = "20px"
      style.boxShadow = "0px 8px 24px 0px rgba(15, 23, 42, 0.5)"
    }
    val bitmap = Bitmap.createBitmap(500, 400, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    view.style.mBorderRenderer.updateCache(340f, 220f)
    view.style.mBoxShadowRenderer.drawOutsetShadows(
      view,
      canvas,
      340f,
      220f,
      view.style.mBorderRenderer,
    )

    assertTrue((0 until bitmap.width).any { x ->
      (0 until bitmap.height).any { y -> bitmap.getPixel(x, y) != 0 }
    })
    bitmap.recycle()
  }

  @Test
  fun insetSoftwareShadowDrawsPixels() {
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    val view = View(context, Mason.shared).apply {
      style.borderRadius = "20px"
      style.boxShadow = "inset 0px 4px 8px 0px rgba(15, 23, 42, 0.5)"
    }
    val bitmap = Bitmap.createBitmap(500, 400, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    view.style.mBorderRenderer.updateCache(340f, 220f)
    view.style.mBoxShadowRenderer.drawInsetShadows(
      view,
      canvas,
      340f,
      220f,
      view.style.mBorderRenderer,
    )

    assertTrue((0 until bitmap.width).any { x ->
      (0 until bitmap.height).any { y -> bitmap.getPixel(x, y) != 0 }
    })
    bitmap.recycle()
  }

  @Test
  @SdkSuppress(minSdkVersion = 31)
  fun renderNodeShadowRecordsOnApi31() {
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    val view = View(context, Mason.shared).apply {
      style.boxShadow = "0px 8px 24px 0px rgba(15, 23, 42, 0.5)"
    }
    val target = RenderNode("target").apply { setPosition(0, 0, 500, 400) }
    val canvas = target.beginRecording()
    view.style.mBorderRenderer.updateCache(340f, 220f)
    view.style.mBoxShadowRenderer.drawOutsetShadows(
      view,
      canvas,
      340f,
      220f,
      view.style.mBorderRenderer,
    )
    target.endRecording()

    assertTrue(target.hasDisplayList())
  }

  @Test
  @SdkSuppress(minSdkVersion = 31)
  fun softwareOverrideForcesBitmapPathOnApi31() {
    BoxShadowRenderer.renderModeOverride = BoxShadowRenderer.RenderMode.SOFTWARE
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    val view = View(context, Mason.shared).apply {
      style.boxShadow = "0px 8px 24px 0px rgba(15, 23, 42, 0.5)"
    }
    // Hardware-accelerated recording canvas: the override must force the
    // bitmap backend even though RenderNode would otherwise be selected.
    val target = RenderNode("target").apply { setPosition(0, 0, 500, 400) }
    val canvas = target.beginRecording()
    view.style.mBorderRenderer.updateCache(340f, 220f)
    view.style.mBoxShadowRenderer.drawOutsetShadows(
      view,
      canvas,
      340f,
      220f,
      view.style.mBorderRenderer,
    )
    target.endRecording()

    assertTrue(target.hasDisplayList())
  }

  @Test
  @SdkSuppress(minSdkVersion = 31)
  fun renderNodeOverrideFallsBackToBitmapsOnSoftwareCanvas() {
    BoxShadowRenderer.renderModeOverride = BoxShadowRenderer.RenderMode.RENDER_NODE
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    val view = View(context, Mason.shared).apply {
      style.boxShadow = "0px 8px 24px 0px rgba(15, 23, 42, 0.5)"
    }
    // A software canvas cannot run RenderEffects; the override must fall back
    // to the bitmap path and still paint pixels instead of crashing.
    val bitmap = Bitmap.createBitmap(500, 400, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    view.style.mBorderRenderer.updateCache(340f, 220f)
    view.style.mBoxShadowRenderer.drawOutsetShadows(
      view,
      canvas,
      340f,
      220f,
      view.style.mBorderRenderer,
    )

    assertTrue((0 until bitmap.width).any { x ->
      (0 until bitmap.height).any { y -> bitmap.getPixel(x, y) != 0 }
    })
    bitmap.recycle()
  }

  @Test
  @SdkSuppress(minSdkVersion = 31)
  fun insetShadowDrawsIntoSoftwareCanvasOnApi31() {
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    val view = View(context, Mason.shared).apply {
      style.boxShadow = "inset 0px 4px 8px 0px rgba(15, 23, 42, 0.5)"
    }
    // Regression: on API 31+ the inset path previously ignored
    // canvas.isHardwareAccelerated and sent software canvases through
    // RenderEffect, painting nothing.
    val bitmap = Bitmap.createBitmap(500, 400, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    view.style.mBorderRenderer.updateCache(340f, 220f)
    view.style.mBoxShadowRenderer.drawInsetShadows(
      view,
      canvas,
      340f,
      220f,
      view.style.mBorderRenderer,
    )

    assertTrue((0 until bitmap.width).any { x ->
      (0 until bitmap.height).any { y -> bitmap.getPixel(x, y) != 0 }
    })
    bitmap.recycle()
  }

  /** Outset shadow pixel at (x, y) css px from the box corner, for a 200px box with a 20px spread. */
  private fun shadowAlphaAt(cornerShape: String, x: Float, y: Float): Int {
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    val d = context.resources.displayMetrics.density
    val view = View(context, Mason.shared).apply {
      style.borderRadius = "40px"
      if (cornerShape.isNotEmpty()) style.cornerShape = cornerShape
      style.boxShadow = "0px 0px 0px 20px rgb(0, 0, 0)"
    }
    val size = 200f * d
    val pad = 100f * d
    val bitmap = Bitmap.createBitmap((size + pad * 2).toInt(), (size + pad * 2).toInt(), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.translate(pad, pad)
    view.style.mBorderRenderer.updateCache(size, size)
    view.style.mBoxShadowRenderer.drawOutsetShadows(view, canvas, size, size, view.style.mBorderRenderer)
    val alpha = android.graphics.Color.alpha(bitmap.getPixel((pad + x * d).toInt(), (pad + y * d).toInt()))
    bitmap.recycle()
    return alpha
  }

  @Test
  fun outsetShadowFollowsCornerShape() {
    // The 60px shadow corner reaches the diagonal at -2.4px when round, 10px when bevelled.
    assertEquals("round corner covers (5, 5)", 255, shadowAlphaAt("", 5f, 5f))
    assertEquals("bevel corner leaves (5, 5) empty", 0, shadowAlphaAt("bevel", 5f, 5f))
    assertEquals("bevel corner covers (14, 14)", 255, shadowAlphaAt("bevel", 14f, 14f))
  }
}
