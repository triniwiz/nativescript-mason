package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Border, transform and child sizing state that is cached between draws and layouts
 * must follow style changes made without a resize, and resizes made without a style change.
 */
@RunWith(AndroidJUnit4::class)
class RedrawCacheInstrumentedTest {

  private val instrumentation = InstrumentationRegistry.getInstrumentation()
  private val context = instrumentation.targetContext

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

  private fun borderedView(): View {
    val view = View(context, createMason())
    instrumentation.runOnMainSync {
      view.style.configure {
        it.background = "white"
        it.border = "10dppx solid red"
      }
    }
    layout(view, 100, 100)
    return view
  }

  @Test
  fun borderColorChangeRedrawsWithoutResize() {
    val view = borderedView()
    assertEquals(Color.RED, render(view, 100, 100).getPixel(2, 50))

    instrumentation.runOnMainSync { view.style.configure { it.setBorderColor(Color.BLUE) } }
    assertEquals(Color.BLUE, render(view, 100, 100).getPixel(2, 50))
  }

  @Test
  fun borderRadiusChangeRedrawsWithoutResize() {
    val view = borderedView()
    assertEquals(Color.RED, render(view, 100, 100).getPixel(0, 0))

    instrumentation.runOnMainSync { view.style.borderRadius = "50dppx" }
    assertEquals(0, Color.alpha(render(view, 100, 100).getPixel(0, 0)))
  }

  @Test
  fun borderWidthChangeRedrawsWithoutResize() {
    val view = borderedView()
    assertEquals(Color.WHITE, render(view, 100, 100).getPixel(15, 50))

    instrumentation.runOnMainSync { view.style.border = "20dppx solid red" }
    layout(view, 100, 100)
    assertEquals(Color.RED, render(view, 100, 100).getPixel(15, 50))
  }

  @Test
  fun borderColorWrittenThroughSyncRedraws() {
    val view = borderedView()
    assertEquals(Color.RED, render(view, 100, 100).getPixel(2, 50))

    // As the TypeScript side does: write the buffer, then report the changed keys.
    instrumentation.runOnMainSync {
      view.style.prepareMut()
      view.style.values.putInt(StyleKeys.BORDER_LEFT_COLOR, Color.GREEN)
      view.syncStyle(StateKeys.BORDER_COLOR.low, StateKeys.BORDER_COLOR.high)
    }
    assertEquals(Color.GREEN, render(view, 100, 100).getPixel(2, 50))
  }

  private fun roundedRed(radius: String): Bitmap {
    val view = View(context, createMason())
    instrumentation.runOnMainSync {
      view.style.configure {
        it.background = "red"
        it.borderRadius = radius
      }
    }
    layout(view, 100, 100)
    return render(view, 100, 100)
  }

  @Test
  fun perCornerRadiiLandOnTheirCorners() {
    // Top-left and bottom-right rounded, the other two square.
    val bitmap = roundedRed("40dppx 0dppx 40dppx 0dppx")
    assertEquals(0, Color.alpha(bitmap.getPixel(2, 2)))
    assertEquals(Color.RED, bitmap.getPixel(97, 2))
    assertEquals(0, Color.alpha(bitmap.getPixel(97, 97)))
    assertEquals(Color.RED, bitmap.getPixel(2, 97))
  }

  @Test
  fun ellipticalRadiiKeepHorizontalAndVerticalApart() {
    // 40 wide, 10 tall: 12px down the left edge is already past the curve.
    val bitmap = roundedRed("40dppx / 10dppx")
    assertEquals(0, Color.alpha(bitmap.getPixel(2, 2)))
    assertEquals(Color.RED, bitmap.getPixel(2, 12))
    assertEquals(0, Color.alpha(bitmap.getPixel(10, 0)))
  }

  @Test
  fun percentBorderFollowsResizeWithoutStyleChange() {
    val view = View(context, createMason())
    instrumentation.runOnMainSync {
      view.style.configure {
        it.background = "white"
        it.border = "10% solid red"
      }
    }
    layout(view, 100, 100)
    assertEquals(Color.WHITE, render(view, 100, 100).getPixel(15, 50))

    layout(view, 200, 100)
    assertEquals(Color.RED, render(view, 200, 100).getPixel(15, 50))
  }

  @Test
  fun fixedBorderSurvivesResize() {
    val view = borderedView()
    render(view, 100, 100)
    layout(view, 160, 120)
    val bitmap = render(view, 160, 120)
    assertEquals(Color.RED, bitmap.getPixel(155, 60))
    assertEquals(Color.WHITE, bitmap.getPixel(80, 60))
  }

  @Test
  fun resizeKeepsTransformSetOnTheView() {
    val view = View(context, createMason())
    layout(view, 100, 100)
    instrumentation.runOnMainSync {
      view.translationX = 12f
      view.scaleY = 0.5f
    }
    layout(view, 200, 80)
    assertEquals(12f, view.translationX)
    assertEquals(0.5f, view.scaleY)
  }

  @Test
  fun resizeRecentersCssTransformPivot() {
    val view = View(context, createMason())
    instrumentation.runOnMainSync { view.style.transform = "rotate(45deg)" }
    layout(view, 100, 100)
    assertEquals(50f, view.pivotX)
    layout(view, 200, 80)
    assertEquals(100f, view.pivotX)
    assertEquals(40f, view.pivotY)
    assertEquals(45f, view.rotation)
  }

  @Test
  fun resizedChildReportsItsNewSize() {
    val mason = createMason()
    val root = mason.createView(context)
    val child = mason.createView(context)
    instrumentation.runOnMainSync {
      child.style.configure { it.setSizeHeight(Dimension.Points(10f)) }
      root.addView(child)
    }
    layout(root, 100, 100)
    assertEquals(100, child.width)
    assertEquals(100, child.measuredWidth)

    layout(root, 60, 100)
    assertEquals(60, child.width)
    assertEquals(60, child.measuredWidth)
    assertEquals(10, child.measuredHeight)
  }
}
