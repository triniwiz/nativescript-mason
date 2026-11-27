package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.view.View.MeasureSpec
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.math.abs

@RunWith(AndroidJUnit4::class)
class SaturationValueViewInstrumentedTest {

  @Test
  fun everyPointHasTheColorItsHueSaturationAndValueGive() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val w = 404
      val h = 262
      val view = SaturationValueView(context)
      view.measure(
        MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(h, MeasureSpec.EXACTLY)
      )
      view.layout(0, 0, w, h)
      // Puts the selector ring in the corner, away from the sampled points.
      view.setSV(1f, 1f)
      for (hue in listOf(0f, 47f, 120f, 200f, 300f, 359f)) {
        view.hue = hue
        val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        view.draw(Canvas(bitmap))
        for (x in 0..340 step 20) for (y in listOf(0, 60, 130, 200, h - 1)) {
          val s = x / (w - 1f)
          val v = 1f - y / (h - 1f)
          val want = Color.HSVToColor(floatArrayOf(hue, s, v))
          val got = bitmap.getPixel(x, y)
          val off = maxOf(
            abs(Color.red(want) - Color.red(got)),
            abs(Color.green(want) - Color.green(got)),
            abs(Color.blue(want) - Color.blue(got))
          )
          assertTrue(
            "hue $hue at ($x, $y): %08x, expected %08x".format(got, want),
            off <= 2 && Color.alpha(got) == 255
          )
        }
      }
    }
  }
}
