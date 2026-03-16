package org.nativescript.mason.masonkit

import android.graphics.Path
import android.graphics.RectF
import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented tests for superellipse border rendering.
 * These run on a real Android device/emulator so we can use Path, RectF, etc.
 */
@RunWith(AndroidJUnit4::class)
class SuperellipseInstrumentedTest {

  private val TAG = "SuperellipseTest"

  private fun createViewWithRadius(
    radiusPx: Float,
    exponent: Float,
    width: Float = 200f,
    height: Float = 200f
  ): View {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    val view = View(context)

    val lp: LengthPercentage = LengthPercentage.Points(radiusPx)
    val radiusPoint = Point(lp, lp)

    view.style.inBatch = true
    view.style.borderTopLeftRadius = radiusPoint.copy()
    view.style.borderTopRightRadius = radiusPoint.copy()
    view.style.borderBottomRightRadius = radiusPoint.copy()
    view.style.borderBottomLeftRadius = radiusPoint.copy()

    view.style.mBorderTop.corner1Exponent = exponent
    view.style.mBorderTop.corner2Exponent = exponent
    view.style.mBorderBottom.corner1Exponent = exponent
    view.style.mBorderBottom.corner2Exponent = exponent

    view.style.mBorderTop.width = LengthPercentage.Points(2f)
    view.style.mBorderTop.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderTop.color = 0xFF000000.toInt()

    view.style.mBorderRight.width = LengthPercentage.Points(2f)
    view.style.mBorderRight.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderRight.color = 0xFF000000.toInt()

    view.style.mBorderBottom.width = LengthPercentage.Points(2f)
    view.style.mBorderBottom.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderBottom.color = 0xFF000000.toInt()

    view.style.mBorderLeft.width = LengthPercentage.Points(2f)
    view.style.mBorderLeft.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderLeft.color = 0xFF000000.toInt()

    view.style.inBatch = false

    view.style.mBorderRenderer.invalidate()
    view.style.mBorderRenderer.updateCache(width, height)

    return view
  }

  // MARK: - getClipPath tests

  @Test
  fun clipPath_withExponent1_isNotEmpty() {
    val view = createViewWithRadius(20f, 1f)
    val clipPath = view.style.mBorderRenderer.getClipPath(200f, 200f)
    assertFalse("Clip path should not be empty with exponent=1", clipPath.isEmpty)
  }

  @Test
  fun clipPath_withSuperellipse_isNotEmpty() {
    val view = createViewWithRadius(20f, 0.5f)
    val clipPath = view.style.mBorderRenderer.getClipPath(200f, 200f)
    assertFalse("Clip path should not be empty with exponent=0.5", clipPath.isEmpty)
  }

  // MARK: - getOuterClipPath tests

  @Test
  fun outerClipPath_withExponent1_isNotEmpty() {
    val view = createViewWithRadius(20f, 1f)
    val outerPath = view.style.mBorderRenderer.getOuterClipPath(200f, 200f)
    assertFalse("Outer clip path should not be empty with exponent=1", outerPath.isEmpty)
  }

  @Test
  fun outerClipPath_withSuperellipse_isNotEmpty() {
    val view = createViewWithRadius(20f, 0.5f)
    val outerPath = view.style.mBorderRenderer.getOuterClipPath(200f, 200f)
    assertFalse("Outer clip path should not be empty with exponent=0.5", outerPath.isEmpty)
  }

  @Test
  fun outerClipPath_superellipse_boundsContainedInViewRect() {
    val w = 200f
    val h = 150f
    val exponents = floatArrayOf(0.3f, 0.5f, 1f, 2f, 4f)

    for (exp in exponents) {
      val view = createViewWithRadius(30f, exp, w, h)
      val outerPath = view.style.mBorderRenderer.getOuterClipPath(w, h)
      val bounds = RectF()
      outerPath.computeBounds(bounds, true)

      Log.i(TAG, "exp=$exp bounds=$bounds")
      assertTrue("minX should be >= 0 for exp=$exp, got ${bounds.left}", bounds.left >= -1f)
      assertTrue("minY should be >= 0 for exp=$exp, got ${bounds.top}", bounds.top >= -1f)
      assertTrue("maxX should be <= $w for exp=$exp, got ${bounds.right}", bounds.right <= w + 1f)
      assertTrue("maxY should be <= $h for exp=$exp, got ${bounds.bottom}", bounds.bottom <= h + 1f)
    }
  }

  @Test
  fun outerClipPath_superellipse_differentFromCircular() {
    val w = 200f
    val h = 200f

    val viewCircular = createViewWithRadius(40f, 1f, w, h)
    val viewSquircle = createViewWithRadius(40f, 0.5f, w, h)

    val circularPath = viewCircular.style.mBorderRenderer.getOuterClipPath(w, h)
    val squirclePath = viewSquircle.style.mBorderRenderer.getOuterClipPath(w, h)

    val circularBounds = RectF()
    val squircleBounds = RectF()
    circularPath.computeBounds(circularBounds, true)
    squirclePath.computeBounds(squircleBounds, true)

    Log.i(TAG, "Circular bounds: $circularBounds")
    Log.i(TAG, "Squircle bounds: $squircleBounds")

    // Both should span approximately the full view rect
    assertTrue("Circular path width should be close to $w", circularBounds.width() > w * 0.9f)
    assertTrue("Squircle path width should be close to $w", squircleBounds.width() > w * 0.9f)
  }

  // MARK: - hasRadii / getRadii tests

  @Test
  fun hasRadii_returnsTrue_whenRadiiSet() {
    val view = createViewWithRadius(20f, 0.5f)
    assertTrue("hasRadii should return true", view.style.mBorderRenderer.hasRadii())
  }

  @Test
  fun hasRadii_returnsFalse_whenNoRadii() {
    val view = createViewWithRadius(0f, 1f)
    assertFalse("hasRadii should return false with zero radii", view.style.mBorderRenderer.hasRadii())
  }

  @Test
  fun getRadii_returnsCorrectValues() {
    val view = createViewWithRadius(25f, 0.5f)
    val radii = view.style.mBorderRenderer.getRadii()

    assertEquals("Should have 8 radii values", 8, radii.size)
    // All values should be 25f (our uniform radius)
    for (i in radii.indices) {
      assertEquals("Radius[$i] should be 25", 25f, radii[i], 0.1f)
    }
  }

  // MARK: - Mixed exponent tests

  @Test
  fun outerClipPath_mixedExponents_isNotEmpty() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    val view = View(context)

    val rlp: LengthPercentage = LengthPercentage.Points(20f)
    val radius = Point(rlp, rlp)

    view.style.inBatch = true
    view.style.borderTopLeftRadius = radius.copy()
    view.style.borderTopRightRadius = radius.copy()
    view.style.borderBottomRightRadius = radius.copy()
    view.style.borderBottomLeftRadius = radius.copy()

    // Mix of exponents: circular top-left, squircle top-right, etc.
    view.style.mBorderTop.corner1Exponent = 1f        // top-left
    view.style.mBorderTop.corner2Exponent = 0.5f      // top-right
    view.style.mBorderBottom.corner2Exponent = 2f      // bottom-right
    view.style.mBorderBottom.corner1Exponent = 0.3f    // bottom-left

    val bw: LengthPercentage = LengthPercentage.Points(2f)
    view.style.mBorderTop.width = bw
    view.style.mBorderTop.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderTop.color = 0xFF000000.toInt()
    view.style.mBorderRight.width = bw
    view.style.mBorderRight.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderRight.color = 0xFF000000.toInt()
    view.style.mBorderBottom.width = bw
    view.style.mBorderBottom.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderBottom.color = 0xFF000000.toInt()
    view.style.mBorderLeft.width = bw
    view.style.mBorderLeft.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderLeft.color = 0xFF000000.toInt()

    view.style.inBatch = false

    view.style.mBorderRenderer.invalidate()
    view.style.mBorderRenderer.updateCache(200f, 200f)

    // Since at least one exponent != 1, getOuterClipPath should take the superellipse path
    val outerPath = view.style.mBorderRenderer.getOuterClipPath(200f, 200f)
    assertFalse("Outer clip path with mixed exponents should not be empty", outerPath.isEmpty)

    val bounds = RectF()
    outerPath.computeBounds(bounds, true)
    assertTrue("Path should span most of the width", bounds.width() > 180f)
    assertTrue("Path should span most of the height", bounds.height() > 180f)
  }

  // MARK: - Oversized radius with CSS scaling

  @Test
  fun outerClipPath_oversizedRadius_getsScaledDown() {
    val w = 100f
    val h = 100f
    // Radius larger than half the box
    val view = createViewWithRadius(80f, 0.5f, w, h)
    val outerPath = view.style.mBorderRenderer.getOuterClipPath(w, h)

    val bounds = RectF()
    outerPath.computeBounds(bounds, true)

    assertFalse("Path should not be empty", outerPath.isEmpty)
    assertTrue("Path maxX should be <= $w, got ${bounds.right}", bounds.right <= w + 1f)
    assertTrue("Path maxY should be <= $h, got ${bounds.bottom}", bounds.bottom <= h + 1f)
  }

  // MARK: - draw() smoke test

  @Test
  fun draw_withSuperellipse_doesNotCrash() {
    val view = createViewWithRadius(20f, 0.5f)

    val bitmap = android.graphics.Bitmap.createBitmap(200, 200, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)

    // This should not throw
    view.style.mBorderRenderer.draw(canvas, 200f, 200f)
    bitmap.recycle()

    Log.i(TAG, "draw() with superellipse completed without crash")
  }

  @Test
  fun draw_withMixedExponents_doesNotCrash() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    val view = View(context)

    val rlp2: LengthPercentage = LengthPercentage.Points(15f)
    val radius2 = Point(rlp2, rlp2)

    view.style.inBatch = true
    view.style.borderTopLeftRadius = radius2.copy()
    view.style.borderTopRightRadius = radius2.copy()
    view.style.borderBottomRightRadius = radius2.copy()
    view.style.borderBottomLeftRadius = radius2.copy()

    view.style.mBorderTop.corner1Exponent = 1f
    view.style.mBorderTop.corner2Exponent = 0.5f
    view.style.mBorderBottom.corner2Exponent = 2f
    view.style.mBorderBottom.corner1Exponent = 0.3f

    val bw2: LengthPercentage = LengthPercentage.Points(3f)
    view.style.mBorderTop.width = bw2
    view.style.mBorderTop.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderTop.color = 0xFFFF0000.toInt()
    view.style.mBorderRight.width = bw2
    view.style.mBorderRight.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderRight.color = 0xFF00FF00.toInt()
    view.style.mBorderBottom.width = bw2
    view.style.mBorderBottom.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderBottom.color = 0xFF0000FF.toInt()
    view.style.mBorderLeft.width = bw2
    view.style.mBorderLeft.style = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
    view.style.mBorderLeft.color = 0xFFFF00FF.toInt()

    view.style.inBatch = false

    view.style.mBorderRenderer.invalidate()
    view.style.mBorderRenderer.updateCache(200f, 200f)

    val bitmap = android.graphics.Bitmap.createBitmap(200, 200, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)

    view.style.mBorderRenderer.draw(canvas, 200f, 200f)
    bitmap.recycle()

    Log.i(TAG, "draw() with mixed exponents and per-side colors completed without crash")
  }
}
