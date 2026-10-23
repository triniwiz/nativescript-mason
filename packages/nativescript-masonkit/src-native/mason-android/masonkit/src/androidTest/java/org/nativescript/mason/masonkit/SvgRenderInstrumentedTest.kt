package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType
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

  @Test
  fun renderPattern() {
    val img = render(
      """<svg viewBox="0 0 20 20"><pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="#ff0000"/><rect x="5" y="5" width="5" height="5" fill="#0000ff"/></pattern>
        <rect width="20" height="20" fill="url(#p)"/></svg>""", 40
    )
    assertTrue(red(img, 4, 4) > 220)
    assertTrue(blue(img, 15, 15) > 220)
    assertEquals(0, alpha(img, 15, 4))
    // Second tile repeats the first.
    assertTrue(red(img, 24, 24) > 220)
    assertTrue(blue(img, 35, 35) > 220)
    assertEquals(0, alpha(img, 4, 35))
  }

  @Test
  fun renderLuminanceAndAlphaMasks() {
    val lum = render(
      """<svg viewBox="0 0 20 20"><mask id="m"><rect width="10" height="20" fill="white"/><rect x="10" width="10" height="20" fill="#808080"/></mask>
        <rect width="20" height="20" fill="#ff0000" mask="url(#m)"/></svg>""", 20
    )
    assertEquals(255, alpha(lum, 5, 10))
    assertTrue(red(lum, 5, 10) > 240)
    assertTrue(kotlin.math.abs(alpha(lum, 15, 10) - 128) <= 3)
    val alphaMask = render(
      """<svg viewBox="0 0 20 20"><mask id="m" mask-type="alpha"><rect width="10" height="20" fill="#000000"/></mask>
        <rect width="20" height="20" fill="#0000ff" mask="url(#m)"/></svg>""", 20
    )
    assertEquals(255, alpha(alphaMask, 5, 10))
    assertEquals(0, alpha(alphaMask, 15, 10))
  }

  @Test
  fun renderMarker() {
    val img = render(
      """<svg viewBox="0 0 40 40"><marker id="a" markerWidth="10" markerHeight="10" refX="0" refY="5" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0 0 L10 5 L0 10z" fill="#ff0000"/></marker>
        <line x1="5" y1="20" x2="25" y2="20" stroke="#0000ff" stroke-width="2" marker-end="url(#a)"/></svg>""", 40
    )
    assertTrue(red(img, 27, 20) > 220)
    assertTrue(blue(img, 15, 20) > 220)
    assertEquals(0, alpha(img, 37, 20))
  }

  @Test
  fun renderTextWithSystemFonts() {
    val img = render(
      """<svg viewBox="0 0 100 100"><text x="50" y="60" font-family="sans-serif" font-size="40" font-weight="bold" fill="#ff0000" text-anchor="middle">II</text></svg>""",
      100
    )
    // Two bold stems around the centre; nothing at the edges or below the baseline.
    var inked = 0
    var first = 100
    var last = 0
    for (x in 0 until 100) {
      if (alpha(img, x, 50) > 200) {
        inked++
        first = minOf(first, x)
        last = maxOf(last, x)
      }
    }
    assertTrue("inked $inked", inked > 6)
    assertTrue(red(img, first, 50) > 220)
    assertEquals(50.0, (first + last) / 2.0, 3.0)
    assertEquals(0, alpha(img, 2, 50))
    assertEquals(0, alpha(img, 97, 50))
    assertEquals(0, alpha(img, 50, 75))
  }

  @Test
  fun imgDrawsAnSvgSource() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val img = Img(context, Mason.shared)
      img.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='10'><rect width='20' height='10' fill='%23ff0000'/></svg>"
      val doc = img.svg
      assertNotNull(doc)
      val density = context.resources.displayMetrics.density
      assertEquals(Math.ceil(20.0 * density).toInt(), img.drawable.intrinsicWidth)
      assertEquals(Math.ceil(10.0 * density).toInt(), img.drawable.intrinsicHeight)
      // Drawn at the size it is shown, not scaled from the intrinsic raster.
      val bitmap = Bitmap.createBitmap(60, 30, Bitmap.Config.ARGB_8888)
      val canvas = android.graphics.Canvas(bitmap)
      img.drawable.setBounds(0, 0, 60, 30)
      img.drawable.draw(canvas)
      assertEquals(255, alpha(bitmap, 30, 15))
      assertTrue(red(bitmap, 59, 29) > 220)
      img.src = ""
      assertEquals(null, img.svg)
    }
  }

  /** A block `<img>` and a block label are block children of their div, not one inline run. */
  @Test
  fun blockImgAndLabelLeaveTheInlineRun() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    for (styleFirst in listOf(true, false)) for (viaAddView in listOf(false, true)) {
      InstrumentationRegistry.getInstrumentation().runOnMainSync {
        val mason = Mason()
        val div = mason.createView(context).apply { node.style.display = Display.Block }
        val img = Img(context, mason)
        val label = mason.createTextView(context, TextType.Span).apply { append("img fill") }
        fun style() {
          img.node.style.display = Display.Block
          label.node.style.display = Display.Block
        }
        if (styleFirst) style()
        if (viaAddView) {
          div.addView(img)
          div.addView(label)
        } else {
          div.append(img)
          div.append(label)
        }
        if (!styleFirst) style()
        val kids = div.node.children
        android.util.Log.i("SVGTEST", "styleFirst=$styleFirst addView=$viaAddView kids=${kids.map { it.isAnonymous }} imgParent=${img.parent?.javaClass?.simpleName}")
        assertEquals("styleFirst=$styleFirst addView=$viaAddView", 2, kids.size)
        assertTrue(kids[0] === img.node)
        assertTrue(kids[1] === label.node)
      }
    }
  }
}
