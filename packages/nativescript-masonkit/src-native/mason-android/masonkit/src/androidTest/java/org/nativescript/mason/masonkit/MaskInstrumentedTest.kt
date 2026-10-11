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

/** `mask-*` rendering: draws masked views into a software bitmap and reads pixels back. */
@RunWith(AndroidJUnit4::class)
class MaskInstrumentedTest {

  private val instrumentation = InstrumentationRegistry.getInstrumentation()
  private val context = instrumentation.targetContext

  private val circle =
    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><circle cx='5' cy='5' r='5'/></svg>\")"

  private fun createMason(): Mason = Mason().apply {
    setDeviceScale(context.resources.displayMetrics.density)
  }

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

  @Test
  fun unmaskedViewIsOpaque() {
    val bitmap = render(redView(40, 40) {}, 40, 40)
    assertEquals(255, alpha(bitmap, 20, 2))
    assertEquals(255, alpha(bitmap, 20, 37))
  }

  @Test
  fun gradientMaskFadesTopToBottom() {
    val bitmap = render(redView(40, 40) { it.maskImage = "linear-gradient(black, transparent)" }, 40, 40)
    val top = alpha(bitmap, 20, 1)
    val middle = alpha(bitmap, 20, 20)
    val bottom = alpha(bitmap, 20, 38)
    assertTrue("top $top", top > 230)
    assertTrue("middle $middle", middle in 90..165)
    assertTrue("bottom $bottom", bottom < 25)
    // The colour underneath survives; only coverage changes.
    val pixel = bitmap.getPixel(20, 1)
    assertTrue(Color.red(pixel) > 240 && Color.green(pixel) < 10 && Color.blue(pixel) < 10)
  }

  @Test
  fun centeredSvgCircleWithContain() {
    val view = redView(100, 60) {
      it.maskImage = circle
      it.maskPosition = "center"
      it.maskSize = "contain"
      it.maskRepeat = "no-repeat"
    }
    val bitmap = render(view, 100, 60)
    // A 60px circle centred at (50, 30).
    assertEquals(255, alpha(bitmap, 50, 30))
    assertEquals(255, alpha(bitmap, 30, 30))
    assertEquals(0, alpha(bitmap, 22, 3)) // in the tile, outside the circle
    assertEquals(0, alpha(bitmap, 10, 30)) // outside the tile
    assertEquals(0, alpha(bitmap, 90, 30))
  }

  @Test
  fun subtractPunchesTheCircleOut() {
    val view = redView(60, 60) {
      it.maskImage = "linear-gradient(black, black), $circle"
      it.maskComposite = "subtract, add"
      it.maskRepeat = "no-repeat"
      it.maskSize = "100% 100%"
    }
    val bitmap = render(view, 60, 60)
    assertEquals(0, alpha(bitmap, 30, 30))
    assertEquals(255, alpha(bitmap, 1, 1))
  }

  @Test
  fun intersectKeepsOnlyTheOverlap() {
    val view = redView(60, 60) {
      it.maskImage = "linear-gradient(to right, black 50%, transparent 50%), $circle"
      it.maskComposite = "intersect"
      it.maskRepeat = "no-repeat"
      it.maskSize = "100% 100%"
    }
    val bitmap = render(view, 60, 60)
    assertEquals(255, alpha(bitmap, 15, 30)) // circle, left half
    assertEquals(0, alpha(bitmap, 45, 30)) // circle, right half
    assertEquals(0, alpha(bitmap, 1, 1)) // left half, outside the circle
  }

  @Test
  fun luminanceMode() {
    val white = render(redView(20, 20) {
      it.maskImage = "linear-gradient(white, white)"
      it.maskMode = "luminance"
    }, 20, 20)
    assertTrue(alpha(white, 10, 10) > 250)
    val black = render(redView(20, 20) {
      it.maskImage = "linear-gradient(black, black)"
      it.maskMode = "luminance"
    }, 20, 20)
    assertEquals(0, alpha(black, 10, 10))
    // Alpha mode reads black as opaque.
    val alphaMode = render(redView(20, 20) { it.maskImage = "linear-gradient(black, black)" }, 20, 20)
    assertEquals(255, alpha(alphaMode, 10, 10))
  }

  @Test
  fun hardwareRenderingIsMasked() {
    // Bitmap.createBitmap(Picture) replays through HWUI, the pipeline apps draw with.
    val view = redView(60, 60) {
      it.maskImage = "linear-gradient(black, transparent), $circle"
      it.maskComposite = "exclude"
      it.maskRepeat = "no-repeat"
      it.maskSize = "100% 100%"
    }
    val picture = android.graphics.Picture()
    instrumentation.runOnMainSync {
      val canvas = picture.beginRecording(60, 60)
      view.draw(canvas)
      picture.endRecording()
    }
    val bitmap = Bitmap.createBitmap(picture).copy(Bitmap.Config.ARGB_8888, false)
    // Top: gradient XOR circle. Centre top is inside both (cancels), the corner only the gradient.
    assertTrue(alpha(bitmap, 1, 1) > 230)
    assertTrue(alpha(bitmap, 30, 3) < 40)
    // Bottom: the gradient has faded, so the circle shows through on its own.
    assertTrue(alpha(bitmap, 30, 56) > 200)
    assertTrue(alpha(bitmap, 1, 58) < 15)
  }

  @Test
  fun noneLayersAloneMeanNoMask() {
    val bitmap = render(redView(20, 20) { it.maskImage = "none" }, 20, 20)
    assertEquals(255, alpha(bitmap, 10, 10))
  }

  @Test
  fun clearingTheMaskRestoresTheView() {
    val view = redView(20, 20) { it.maskImage = "linear-gradient(transparent, transparent)" }
    assertEquals(0, alpha(render(view, 20, 20), 10, 10))
    instrumentation.runOnMainSync { view.style.maskImage = "" }
    assertEquals(255, alpha(render(view, 20, 20), 10, 10))
  }

  @Test
  fun buttonIsMasked() {
    val mason = createMason()
    val button = Button(context, mason)
    instrumentation.runOnMainSync {
      button.style.background = "red"
      button.style.isValueInitialized = true
      button.style.maskImage = "linear-gradient(black, transparent)"
    }
    layout(button, 40, 40)
    val bitmap = render(button, 40, 40)
    assertTrue(alpha(bitmap, 20, 1) > 230)
    assertTrue(alpha(bitmap, 20, 38) < 25)
  }

  @Test
  fun scrolledContainerKeepsTheMaskOnTheBox() {
    val scroll = Scroll(context)
    instrumentation.runOnMainSync {
      scroll.style.background = "red"
      scroll.style.isValueInitialized = true
      scroll.style.maskImage = "linear-gradient(black, transparent)"
    }
    layout(scroll, 40, 40)
    val bitmap = Bitmap.createBitmap(40, 40, Bitmap.Config.ARGB_8888)
    instrumentation.runOnMainSync {
      scroll.scrollTo(0, 0)
      scroll.draw(Canvas(bitmap))
    }
    assertTrue(alpha(bitmap, 20, 1) > 230)
    assertTrue(alpha(bitmap, 20, 38) < 25)
  }
}
