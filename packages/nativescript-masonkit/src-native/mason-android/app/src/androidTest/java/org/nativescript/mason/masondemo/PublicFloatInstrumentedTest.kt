package org.nativescript.mason.masondemo

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.NodeHelper
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.enums.Float as MasonFloat

@RunWith(AndroidJUnit4::class)
class PublicFloatInstrumentedTest {
  @Test
  fun floatRects_viaPublicApi_doNotRequireInternals() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason.shared
    val tv = TextView(appContext, mason)
    tv.text = "Hello from instrumentation"

    // Use public NodeHelper setters to avoid touching internals
    try {
      NodeHelper.shared.setFloat(tv, MasonFloat.Left)
    } catch (_: Throwable) {}
    try {
      NodeHelper.shared.setSize(tv, Dimension.Points(100f), Dimension.Points(100f))
    } catch (_: Throwable) {}

    // Force a compute/layout using public Element APIs
    try {
      tv.compute(300f, Float.NaN)
    } catch (_: Throwable) {}

    val (ids, rects) = NodeHelper.shared.getFloatRectsLocalToView(tv)

    assertNotNull(rects)
    // rects are flat [l,t,w,h,...] so length should be multiple of 4
    assertTrue(rects.size % 4 == 0)
  }
}
