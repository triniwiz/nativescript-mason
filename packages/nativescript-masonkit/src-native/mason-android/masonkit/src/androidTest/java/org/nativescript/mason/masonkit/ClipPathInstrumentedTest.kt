package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.os.SystemClock
import android.view.MotionEvent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.math.roundToInt

/**
 * `clip-path`, `mask-border` and `border-image` rendering: draws views into a software bitmap
 * (and through HWUI via a Picture) and reads pixels back, like [MaskInstrumentedTest].
 */
@RunWith(AndroidJUnit4::class)
class ClipPathInstrumentedTest {

  private val instrumentation = InstrumentationRegistry.getInstrumentation()
  private val context = instrumentation.targetContext

  // A solid 3x3 user-unit square, unencoded as authors write it.
  private val svgSquare =
    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 3'><rect width='3' height='3'/></svg>\")"

  private fun createMason(): Mason = Mason().apply {
    setDeviceScale(context.resources.displayMetrics.density)
  }

  /** Device px for [css] CSS px, as the parsers resolve them. */
  private fun dp(css: Float): Int = (css * Mason.shared.scale).roundToInt()

  private fun layout(view: android.view.View, w: Int, h: Int) {
    instrumentation.runOnMainSync {
      view.measure(
        android.view.View.MeasureSpec.makeMeasureSpec(w, android.view.View.MeasureSpec.EXACTLY),
        android.view.View.MeasureSpec.makeMeasureSpec(h, android.view.View.MeasureSpec.EXACTLY)
      )
      view.layout(0, 0, w, h)
    }
  }

  private fun render(view: android.view.View, w: Int, h: Int): Bitmap {
    val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    instrumentation.runOnMainSync { view.draw(Canvas(bitmap)) }
    return bitmap
  }

  /** Replays the draw through HWUI, the pipeline apps draw with. */
  private fun renderHardware(view: android.view.View, w: Int, h: Int): Bitmap {
    val picture = android.graphics.Picture()
    instrumentation.runOnMainSync {
      val canvas = picture.beginRecording(w, h)
      view.draw(canvas)
      picture.endRecording()
    }
    return Bitmap.createBitmap(picture).copy(Bitmap.Config.ARGB_8888, false)
  }

  /** A red box of [w]x[h] device px with [configure] applied. */
  private fun redView(w: Int, h: Int, configure: (Style) -> Unit): View {
    val view = View(context, createMason())
    instrumentation.runOnMainSync {
      view.style.background = "red"
      view.style.isValueInitialized = true
      configure(view.style)
    }
    layout(view, w, h)
    assertEquals(w, view.width)
    assertEquals(h, view.height)
    return view
  }

  private fun alpha(bitmap: Bitmap, x: Int, y: Int) = Color.alpha(bitmap.getPixel(x, y))

  private fun isRed(pixel: Int) = Color.alpha(pixel) > 240 && Color.red(pixel) > 240 && Color.green(pixel) < 15 && Color.blue(pixel) < 15
  private fun isBlue(pixel: Int) = Color.alpha(pixel) > 240 && Color.blue(pixel) > 240 && Color.red(pixel) < 15 && Color.green(pixel) < 15
  private fun isGreen(pixel: Int) = Color.alpha(pixel) > 240 && Color.green(pixel) > 100 && Color.red(pixel) < 15 && Color.blue(pixel) < 15

  // MARK: clip-path

  @Test
  fun circleClipsTheCorners() {
    val view = redView(40, 40) { it.clipPath = "circle(50%)" }
    for (bitmap in listOf(render(view, 40, 40), renderHardware(view, 40, 40))) {
      assertEquals(0, alpha(bitmap, 1, 1))
      assertEquals(0, alpha(bitmap, 38, 1))
      assertEquals(0, alpha(bitmap, 1, 38))
      assertEquals(0, alpha(bitmap, 38, 38))
      assertTrue(isRed(bitmap.getPixel(20, 20)))
      assertTrue(isRed(bitmap.getPixel(20, 2)))
      assertTrue(isRed(bitmap.getPixel(2, 20)))
    }
  }

  @Test
  fun clipEdgesAreAntiAliased() {
    // An aliased clip (canvas.clipPath) leaves only 0 or 255 alpha; the circle's edge
    // (~125 px around) should be mostly partial coverage.
    val view = redView(40, 40) { it.clipPath = "circle(50%)" }
    for (bitmap in listOf(render(view, 40, 40), renderHardware(view, 40, 40))) {
      var partial = 0
      for (y in 0 until 40) for (x in 0 until 40) if (alpha(bitmap, x, y) in 1..254) partial++
      assertTrue("partial-coverage pixels: $partial", partial >= 40)
    }
  }

  @Test
  fun insetWithRoundedCorners() {
    val inset = dp(10f)
    val size = inset * 2 + dp(30f)
    val view = redView(size, size) { it.clipPath = "inset(10px round 5px)" }
    val bitmap = render(view, size, size)
    val mid = size / 2
    assertEquals(0, alpha(bitmap, inset - 2, mid))
    assertEquals(0, alpha(bitmap, mid, inset - 2))
    assertEquals(0, alpha(bitmap, size - inset + 1, mid))
    assertTrue(isRed(bitmap.getPixel(inset + 2, mid)))
    assertTrue(isRed(bitmap.getPixel(mid, mid)))
    // The rounded corner cuts the inset rectangle's corner pixel.
    assertEquals(0, alpha(bitmap, inset, inset))
    assertTrue(isRed(bitmap.getPixel(inset + dp(5f), inset + dp(5f))))
  }

  @Test
  fun polygonTriangle() {
    val view = redView(40, 40) { it.clipPath = "polygon(50% 0, 100% 100%, 0 100%)" }
    for (bitmap in listOf(render(view, 40, 40), renderHardware(view, 40, 40))) {
      assertEquals(0, alpha(bitmap, 2, 2))
      assertEquals(0, alpha(bitmap, 37, 2))
      assertEquals(0, alpha(bitmap, 5, 20))
      assertTrue(isRed(bitmap.getPixel(20, 30)))
      assertTrue(isRed(bitmap.getPixel(2, 38)))
      assertTrue(isRed(bitmap.getPixel(37, 38)))
    }
  }

  @Test
  fun clipPathAndMaskImageBothApply() {
    val view = redView(40, 40) {
      it.clipPath = "circle(50%)"
      it.maskImage = "linear-gradient(black, transparent)"
    }
    for (bitmap in listOf(render(view, 40, 40), renderHardware(view, 40, 40))) {
      assertEquals(0, alpha(bitmap, 1, 1)) // clipped, though the mask is opaque there
      assertTrue("top ${alpha(bitmap, 20, 2)}", alpha(bitmap, 20, 2) > 220) // in the circle, mask opaque
      assertTrue("bottom ${alpha(bitmap, 20, 37)}", alpha(bitmap, 20, 37) < 30) // in the circle, mask faded
      assertTrue("middle ${alpha(bitmap, 2, 20)}", alpha(bitmap, 2, 20) in 90..165)
    }
  }

  @Test
  fun boxOnlyClipFollowsTheBorderRadius() {
    val view = redView(40, 40) {
      it.border = "5 solid red"
      it.borderRadius = "20"
      it.clipPath = "padding-box"
    }
    val bitmap = render(view, 40, 40)
    // Inside the border: padding box, rounded.
    val b = dp(5f)
    assertEquals(0, alpha(bitmap, b - 1, 20))
    assertTrue(isRed(bitmap.getPixel(b + 1, 20)))
    assertTrue(isRed(bitmap.getPixel(20, 20)))
  }

  @Test
  fun noneAndInvalidLeaveTheViewAlone() {
    for (value in listOf("none", "url(#missing)", "circle(bogus)")) {
      val bitmap = render(redView(20, 20) { it.clipPath = value }, 20, 20)
      assertEquals(value, 255, alpha(bitmap, 1, 1))
    }
  }

  @Test
  fun clearingTheClipRestoresTheView() {
    val view = redView(40, 40) { it.clipPath = "circle(10%)" }
    assertEquals(0, alpha(render(view, 40, 40), 1, 1))
    instrumentation.runOnMainSync { view.style.clipPath = "none" }
    assertEquals(255, alpha(render(view, 40, 40), 1, 1))
  }

  @Test
  fun touchesOutsideTheClipPassThrough() {
    val view = redView(40, 40) { it.clipPath = "circle(50%)" }
    var touches = 0
    instrumentation.runOnMainSync {
      view.isClickable = true
      view.setOnTouchListener { _, _ -> touches++; true }
    }
    fun down(x: Float, y: Float): Boolean {
      var handled = false
      instrumentation.runOnMainSync {
        val now = SystemClock.uptimeMillis()
        val ev = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, x, y, 0)
        handled = view.dispatchTouchEvent(ev)
        ev.recycle()
      }
      return handled
    }
    assertFalse(down(1f, 1f))
    assertEquals(0, touches)
    assertTrue(down(20f, 20f))
    assertEquals(1, touches)
    // elementFromPoint agrees.
    assertNull(view.elementFromPoint(1f, 1f))
    assertSame(view, view.elementFromPoint(20f, 20f))
  }

  @Test
  fun buttonIsClipped() {
    val button = Button(context, createMason())
    instrumentation.runOnMainSync {
      button.style.background = "red"
      button.style.isValueInitialized = true
      button.style.clipPath = "circle(50%)"
    }
    layout(button, 40, 40)
    val bitmap = render(button, 40, 40)
    assertEquals(0, alpha(bitmap, 1, 1))
    assertTrue(isRed(bitmap.getPixel(20, 20)))
  }

  // MARK: mask-border

  @Test
  fun maskBorderWithFillKeepsEverything() {
    val size = dp(10f) * 2 + 30
    val view = redView(size, size) {
      it.maskBorderSource = svgSquare
      it.maskBorderSlice = "1 fill"
      it.maskBorderWidth = "10px"
    }
    val mid = size / 2
    for (bitmap in listOf(render(view, size, size), renderHardware(view, size, size))) {
      assertTrue(isRed(bitmap.getPixel(mid, mid)))
      assertTrue(isRed(bitmap.getPixel(2, 2)))
      assertTrue(isRed(bitmap.getPixel(2, mid)))
    }
    // Same source without a mask-border-width: `auto` = the slice's intrinsic size, here 1px.
    val auto = render(redView(size, size) {
      it.maskBorderSource = svgSquare
      it.maskBorderSlice = "1"
    }, size, size)
    assertEquals(0, alpha(auto, mid, mid))
  }

  @Test
  fun maskBorderWithoutFillHidesTheMiddle() {
    val ring = dp(10f)
    val size = ring * 2 + 30
    val view = redView(size, size) {
      it.maskBorderSource = svgSquare
      it.maskBorderSlice = "1"
      it.maskBorderWidth = "10px"
    }
    val mid = size / 2
    for (bitmap in listOf(render(view, size, size), renderHardware(view, size, size))) {
      assertEquals(0, alpha(bitmap, mid, mid))
      assertTrue(isRed(bitmap.getPixel(2, mid)))
      assertTrue(isRed(bitmap.getPixel(mid, ring - 2)))
      assertEquals(0, alpha(bitmap, ring + 2, mid))
    }
  }

  @Test
  fun maskBorderMultipliesWithMaskImage() {
    val ring = dp(10f)
    val size = ring * 2 + 30
    val view = redView(size, size) {
      it.maskImage = "linear-gradient(to right, black 50%, transparent 50%)"
      it.maskBorderSource = svgSquare
      it.maskBorderSlice = "1"
      it.maskBorderWidth = "10px"
    }
    val mid = size / 2
    val bitmap = render(view, size, size)
    assertTrue(isRed(bitmap.getPixel(2, mid))) // left ring: both opaque
    assertEquals(0, alpha(bitmap, size - 3, mid)) // right ring: the image layer is transparent
    assertEquals(0, alpha(bitmap, ring + 3, mid)) // left middle: the border mask is transparent
  }

  @Test
  fun maskBorderLuminance() {
    // A black source in luminance mode masks everything away.
    val black = render(redView(30, 30) {
      it.maskBorderSource = svgSquare
      it.maskBorderSlice = "0 fill"
      it.maskBorderMode = "luminance"
    }, 30, 30)
    assertEquals(0, alpha(black, 15, 15))
    val white = render(redView(30, 30) {
      it.maskBorderSource = "linear-gradient(white, white)"
      it.maskBorderSlice = "0 fill"
      it.maskBorderMode = "luminance"
    }, 30, 30)
    assertTrue(alpha(white, 15, 15) > 250)
  }

  /** Pixels in [bitmap] below full alpha, as "x,y=a" (at most 10). */
  private fun holes(bitmap: Bitmap): List<String> {
    val out = ArrayList<String>()
    for (y in 0 until bitmap.height) for (x in 0 until bitmap.width) {
      val a = alpha(bitmap, x, y)
      if (a != 255 && out.size < 10) out.add("$x,$y=$a")
    }
    return out
  }

  @Test
  fun maskBorderTilesHaveNoSeams() {
    // An opaque source with `fill`, tiled at fractional sizes: every pixel must stay opaque
    // (no partial alpha where tiles or regions meet).
    for (repeat in listOf("round", "repeat", "stretch", "round repeat")) {
      val view = redView(283, 129) {
        it.maskBorderSource = svgSquare
        it.maskBorderSlice = "1 fill"
        it.maskBorderWidth = "7.3px"
        it.maskBorderRepeat = repeat
      }
      for (bitmap in listOf(render(view, 283, 129), renderHardware(view, 283, 129))) {
        val h = holes(bitmap)
        assertTrue("$repeat: $h", h.isEmpty())
      }
    }
  }

  @Test
  fun borderImageTilesHaveNoSeams() {
    for (repeat in listOf("round", "repeat")) {
      val view = View(context, createMason())
      instrumentation.runOnMainSync {
        view.style.isValueInitialized = true
        view.style.border = "7.3 solid green"
        view.style.borderImage = "$svgSquare 1 fill / 1 $repeat"
      }
      layout(view, 283, 129)
      for (bitmap in listOf(render(view, 283, 129), renderHardware(view, 283, 129))) {
        assertTrue("$repeat: ${holes(bitmap)}", holes(bitmap).isEmpty())
        assertEquals(Color.BLACK, bitmap.getPixel(141, 64))
      }
    }
  }

  // MARK: border-image

  @Test
  fun borderImageGradientReplacesTheBorder() {
    val ring = dp(10f)
    val size = ring * 2 + 20
    val view = redView(size, size) {
      it.border = "10 solid green"
      it.borderImage = "linear-gradient(blue, blue) 10"
    }
    for (bitmap in listOf(render(view, size, size), renderHardware(view, size, size))) {
      assertTrue(isBlue(bitmap.getPixel(2, size / 2)))
      assertTrue(isBlue(bitmap.getPixel(size / 2, 2)))
      assertTrue(isBlue(bitmap.getPixel(2, 2)))
      // No `fill`: the background shows in the middle.
      assertTrue(isRed(bitmap.getPixel(size / 2, size / 2)))
    }
  }

  @Test
  fun borderImageFillPaintsTheMiddle() {
    val ring = dp(10f)
    val size = ring * 2 + 20
    val view = redView(size, size) {
      it.border = "10 solid green"
      it.borderImage = "linear-gradient(blue, blue) 10 fill"
    }
    val bitmap = render(view, size, size)
    assertTrue(isBlue(bitmap.getPixel(size / 2, size / 2)))
  }

  @Test
  fun unusableBorderImageFallsBackToTheBorder() {
    val ring = dp(10f)
    val size = ring * 2 + 20
    val view = redView(size, size) {
      it.border = "10 solid green"
      it.borderImage = "url(data:image/png;base64,AAAA) 10"
    }
    val bitmap = render(view, size, size)
    assertTrue(isGreen(bitmap.getPixel(2, size / 2)))
    instrumentation.runOnMainSync { view.style.borderImage = "none" }
    assertTrue(isGreen(render(view, size, size).getPixel(2, size / 2)))
  }
}
