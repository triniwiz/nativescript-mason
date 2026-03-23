package org.nativescript.mason.masondemo

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class GridCrashTest {
  @Test
  fun reproduceGridCrash() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = org.nativescript.mason.masonkit.Mason.shared
    val metrics = appContext.resources.displayMetrics
    mason.setDeviceScale(metrics.density)

    val boxDp = 10f
    var boxSize = boxDp * metrics.density
    if (boxSize <= 0f) boxSize = 1f
    val maxWidthPx = metrics.widthPixels.toFloat()
    val maxHeightPx = metrics.heightPixels.toFloat() + (50f * metrics.density)

    val cols = 1.coerceAtLeast(kotlin.math.floor((maxWidthPx / boxSize).toDouble()).toInt())
    var rows = 1.coerceAtLeast(kotlin.math.floor((maxHeightPx / boxSize).toDouble()).toInt())

    // Keep the test dense enough to exercise the wrapped-grid path without
    // relying on a heavyweight real activity hierarchy.
    val MAX_CELLS = 1024L
    val total = cols.toLong() * rows.toLong()
    if (total > MAX_CELLS) {
      val newRows = 1.coerceAtLeast((MAX_CELLS / cols).toInt())
      rows = newRows
    }

    val body = mason.createView(appContext)

    val container = mason.createView(appContext)
    container.display = org.nativescript.mason.masonkit.enums.Display.Flex
    container.flexDirection = org.nativescript.mason.masonkit.enums.FlexDirection.Row
    container.style.flexWrap = org.nativescript.mason.masonkit.enums.FlexWrap.Wrap
    container.style.gap = org.nativescript.mason.masonkit.Size(
      org.nativescript.mason.masonkit.LengthPercentage.Points(0f),
      org.nativescript.mason.masonkit.LengthPercentage.Points(0f)
    )

    for (r in 0 until rows) {
      for (c in 0 until cols) {
        val v = mason.createView(appContext)
        v.style.setSizePoints(boxSize, boxSize)
        val colorInt = kotlin.random.Random.nextInt(0x1000000)
        v.style.prepareMut()
        v.style.backgroundColor = 0xFFFFFF and colorInt
        v.style.borderLeftStyle = org.nativescript.mason.masonkit.enums.BorderStyle.Solid
        v.style.values.putInt(org.nativescript.mason.masonkit.StyleKeys.BORDER_LEFT_COLOR, android.graphics.Color.BLACK)
        v.style.values.putInt(org.nativescript.mason.masonkit.StyleKeys.BORDER_TOP_COLOR, android.graphics.Color.BLACK)
        v.style.values.putInt(org.nativescript.mason.masonkit.StyleKeys.BORDER_RIGHT_COLOR, android.graphics.Color.BLACK)
        v.style.values.putInt(org.nativescript.mason.masonkit.StyleKeys.BORDER_BOTTOM_COLOR, android.graphics.Color.BLACK)

        v.style.values.put(org.nativescript.mason.masonkit.StyleKeys.BORDER_LEFT_STYLE, org.nativescript.mason.masonkit.enums.BorderStyle.Solid.value)
        v.style.values.put(org.nativescript.mason.masonkit.StyleKeys.BORDER_TOP_STYLE, org.nativescript.mason.masonkit.enums.BorderStyle.Solid.value)
        v.style.values.put(org.nativescript.mason.masonkit.StyleKeys.BORDER_RIGHT_STYLE, org.nativescript.mason.masonkit.enums.BorderStyle.Solid.value)
        v.style.values.put(org.nativescript.mason.masonkit.StyleKeys.BORDER_BOTTOM_STYLE, org.nativescript.mason.masonkit.enums.BorderStyle.Solid.value)

        v.style.values.put(org.nativescript.mason.masonkit.StyleKeys.BORDER_LEFT_TYPE, org.nativescript.mason.masonkit.LengthPercentage.Kind.Points.value)
        v.style.values.putInt(org.nativescript.mason.masonkit.StyleKeys.BORDER_LEFT_VALUE, 1)

        v.style.values.put(org.nativescript.mason.masonkit.StyleKeys.BORDER_TOP_TYPE, org.nativescript.mason.masonkit.LengthPercentage.Kind.Points.value)
        v.style.values.putInt(org.nativescript.mason.masonkit.StyleKeys.BORDER_TOP_VALUE, 1)

        v.style.values.put(org.nativescript.mason.masonkit.StyleKeys.BORDER_RIGHT_TYPE, org.nativescript.mason.masonkit.LengthPercentage.Kind.Points.value)
        v.style.values.putInt(org.nativescript.mason.masonkit.StyleKeys.BORDER_RIGHT_VALUE, 1)

        v.style.values.put(org.nativescript.mason.masonkit.StyleKeys.BORDER_BOTTOM_TYPE, org.nativescript.mason.masonkit.LengthPercentage.Kind.Points.value)
        v.style.values.putInt(org.nativescript.mason.masonkit.StyleKeys.BORDER_BOTTOM_VALUE, 1)

        container.append(v)
      }
    }

    body.addView(container)

    val layout = body.computeAndLayout(maxWidthPx, maxHeightPx)
    assertTrue(layout.nodeCount > 0)
  }
}
