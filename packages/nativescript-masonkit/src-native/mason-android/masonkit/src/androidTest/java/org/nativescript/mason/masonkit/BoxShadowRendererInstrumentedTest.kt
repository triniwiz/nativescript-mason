package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.RenderNode
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.SdkSuppress
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BoxShadowRendererInstrumentedTest {
  @Test
  fun rasterScaleFallsAsBlurGrows() {
    assertEquals(1f, BoxShadowRenderer.rasterScale(4f))
    assertEquals(0.5f, BoxShadowRenderer.rasterScale(8f))
    assertEquals(0.25f, BoxShadowRenderer.rasterScale(24f))
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
}
