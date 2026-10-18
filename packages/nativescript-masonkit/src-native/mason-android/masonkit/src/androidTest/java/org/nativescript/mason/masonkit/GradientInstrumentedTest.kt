package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

/** Linear gradients follow the CSS gradient line, through software and HWUI drawing alike. */
@RunWith(AndroidJUnit4::class)
class GradientInstrumentedTest {

  private val instrumentation = InstrumentationRegistry.getInstrumentation()
  private val context = instrumentation.targetContext

  private fun view(w: Int, h: Int, configure: (Style) -> Unit): View {
    val mason = Mason().apply { setDeviceScale(context.resources.displayMetrics.density) }
    val view = View(context, mason)
    instrumentation.runOnMainSync {
      configure(view.style)
      view.style.isValueInitialized = true
      view.measure(
        android.view.View.MeasureSpec.makeMeasureSpec(w, android.view.View.MeasureSpec.EXACTLY),
        android.view.View.MeasureSpec.makeMeasureSpec(h, android.view.View.MeasureSpec.EXACTLY)
      )
      view.layout(0, 0, w, h)
    }
    return view
  }

  private fun renders(view: View, w: Int, h: Int): List<Bitmap> {
    val software = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val picture = android.graphics.Picture()
    instrumentation.runOnMainSync {
      view.draw(Canvas(software))
      val canvas = picture.beginRecording(w, h)
      view.draw(canvas)
      picture.endRecording()
    }
    return listOf(software, Bitmap.createBitmap(picture).copy(Bitmap.Config.ARGB_8888, false))
  }

  /** Red to blue at gradient position `t`. */
  private fun assertRedToBlue(bitmap: Bitmap, x: Int, y: Int, t: Double, label: String) {
    val p = bitmap.getPixel(x, y)
    assertEquals("$label red", 255 * (1 - t), Color.red(p).toDouble(), 4.0)
    assertEquals("$label blue", 255 * t, Color.blue(p).toDouble(), 4.0)
  }

  /** CSS: the line runs through the centre, |w sin a| + |h cos a| long. */
  private fun cssT(degrees: Double, w: Int, h: Int, x: Double, y: Double): Double {
    val a = Math.toRadians(degrees)
    val length = abs(w * sin(a)) + abs(h * cos(a))
    return ((x - w / 2.0) * sin(a) - (y - h / 2.0) * cos(a)) / length + 0.5
  }

  @Test
  fun cornerKeywordPutsTheOtherCornersHalfway() {
    val w = 400
    val h = 200
    val v = view(w, h) { it.background = "linear-gradient(to bottom right, rgb(255, 0, 0), rgb(0, 0, 255))" }
    for (bitmap in renders(v, w, h)) {
      assertRedToBlue(bitmap, w - 1, 0, 0.5, "top right")
      assertRedToBlue(bitmap, 0, h - 1, 0.5, "bottom left")
      assertRedToBlue(bitmap, 0, 0, 0.0, "top left")
      assertRedToBlue(bitmap, w - 1, h - 1, 1.0, "bottom right")
    }
  }

  @Test
  fun angleFollowsTheCssGradientLine() {
    val w = 400
    val h = 100
    val v = view(w, h) { it.background = "linear-gradient(135deg, rgb(255, 0, 0), rgb(0, 0, 255))" }
    for (bitmap in renders(v, w, h)) {
      for ((x, y) in listOf(20 to 20, 200 to 50, 380 to 80, 60 to 90, 340 to 10)) {
        val t = cssT(135.0, w, h, x + 0.5, y + 0.5).coerceIn(0.0, 1.0)
        assertRedToBlue(bitmap, x, y, t, "at $x,$y")
      }
    }
  }

  @Test
  fun roundedCornersClipTheGradient() {
    val w = 300
    val h = 120
    val v = view(w, h) {
      it.background = "linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 0, 255))"
      it.borderRadius = "40px 0 40px 0"
    }
    for (bitmap in renders(v, w, h)) {
      assertEquals("rounded top left", 0, Color.alpha(bitmap.getPixel(1, 1)))
      assertEquals("rounded bottom right", 0, Color.alpha(bitmap.getPixel(w - 2, h - 2)))
      assertEquals("square top right", 255, Color.alpha(bitmap.getPixel(w - 1, 0)))
      assertEquals("square bottom left", 255, Color.alpha(bitmap.getPixel(0, h - 1)))
      assertTrue("inside", Color.alpha(bitmap.getPixel(w / 2, h / 2)) == 255)
      assertRedToBlue(bitmap, w / 2, h / 2, (w / 2 + 0.5) / w, "middle")
    }
  }

  @Test
  fun colorUnderAGradientIsClippedToo() {
    val w = 200
    val h = 100
    val v = view(w, h) {
      it.background = "rgb(0, 255, 0) linear-gradient(rgba(255, 0, 0, 0), rgba(255, 0, 0, 0))"
      it.borderRadius = "30px"
    }
    for (bitmap in renders(v, w, h)) {
      assertEquals("corner", 0, Color.alpha(bitmap.getPixel(1, 1)))
      assertEquals("middle", Color.rgb(0, 255, 0), bitmap.getPixel(w / 2, h / 2))
    }
  }
}
