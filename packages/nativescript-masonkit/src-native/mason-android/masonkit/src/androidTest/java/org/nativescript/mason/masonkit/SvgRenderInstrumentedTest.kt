package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Mirrors the render tests at the end of `SvgParserTests.swift`. */
@RunWith(AndroidJUnit4::class)
class SvgRenderInstrumentedTest {

  private val png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADklEQVR4nGP4z8AAQv8BD/kD/YURmXYAAAAASUVORK5CYII="

  private fun render(svg: String, size: Int, color: Int = Color.BLACK): Bitmap {
    val doc = parseSvgDocument(svg)
    assertNotNull("no document", doc)
    val bitmap = renderSvgDocument(doc!!, size, size, color)
    assertNotNull("no bitmap", bitmap)
    return bitmap!!
  }

  private fun red(b: Bitmap, x: Int, y: Int) = Color.red(b.getPixel(x, y))
  private fun green(b: Bitmap, x: Int, y: Int) = Color.green(b.getPixel(x, y))
  private fun blue(b: Bitmap, x: Int, y: Int) = Color.blue(b.getPixel(x, y))
  private fun alpha(b: Bitmap, x: Int, y: Int) = Color.alpha(b.getPixel(x, y))

  @Test
  fun renderLinearGradientPadAndRepeat() {
    val stops = """<stop offset="0" stop-color="#ff0000"/><stop offset="1" stop-color="#0000ff"/>"""
    val pad = render("""<svg viewBox="0 0 10 10"><linearGradient id="g">$stops</linearGradient><rect width="10" height="10" fill="url(#g)"/></svg>""", 10)
    assertTrue(red(pad, 0, 5) > 220)
    assertTrue(blue(pad, 9, 5) > 220)
    // x2 = 50%: the second half repeats the first.
    val rep = render("""<svg viewBox="0 0 10 10"><linearGradient id="g" x2=".5" spreadMethod="repeat">$stops</linearGradient><rect width="10" height="10" fill="url(#g)"/></svg>""", 10)
    assertTrue(red(rep, 5, 5) > 200)
    assertTrue(blue(rep, 4, 5) > 150)
    val refl = render("""<svg viewBox="0 0 10 10"><linearGradient id="g" x2=".5" spreadMethod="reflect">$stops</linearGradient><rect width="10" height="10" fill="url(#g)"/></svg>""", 10)
    assertTrue(blue(refl, 5, 5) > 200)
    assertTrue(red(refl, 9, 5) > 150)
  }

  @Test
  fun renderRadialGradient() {
    val img = render("""<svg viewBox="0 0 20 20"><radialGradient id="g"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#000000"/></radialGradient><rect width="20" height="20" fill="url(#g)"/></svg>""", 20)
    assertTrue(red(img, 10, 10) > 230)
    assertTrue(red(img, 0, 0) < 10)
  }

  @Test
  fun renderClipPath() {
    val img = render("""<svg viewBox="0 0 20 20"><clipPath id="c"><circle cx="10" cy="10" r="8"/></clipPath><rect width="20" height="20" fill="#ff0000" clip-path="url(#c)"/></svg>""", 20)
    assertEquals(255, alpha(img, 10, 10))
    assertEquals(0, alpha(img, 1, 1))
  }

  @Test
  fun renderUseSymbolAndStyleSheet() {
    val img = render("""<svg viewBox="0 0 20 20"><style>.f{fill:#00ff00}</style><symbol id="s" viewBox="0 0 1 1"><rect class="f" width="1" height="1"/></symbol><use href="#s" x="10" width="10" height="10"/></svg>""", 20)
    assertEquals(255, alpha(img, 15, 5))
    assertEquals(255, green(img, 15, 5))
    assertEquals(0, alpha(img, 5, 5))
    assertEquals(0, alpha(img, 15, 15))
  }

  @Test
  fun renderImage() {
    // A 2x1 red | blue PNG stretched over the whole viewport.
    val img = render("""<svg viewBox="0 0 20 20"><image href="$png" width="20" height="20" preserveAspectRatio="none"/></svg>""", 20)
    assertEquals(255, alpha(img, 3, 10))
    assertTrue(red(img, 3, 10) > 200)
    assertTrue(blue(img, 16, 10) > 200)
  }
}
