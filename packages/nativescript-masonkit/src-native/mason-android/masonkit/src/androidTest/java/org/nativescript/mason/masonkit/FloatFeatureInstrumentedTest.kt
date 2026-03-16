package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Float as CSSFloat

@RunWith(AndroidJUnit4::class)
class FloatFeatureInstrumentedTest {

  @Test
  fun noSubnormalOrNaNInNativeLayout() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext

    val mason = Mason()

    // Create a View parent and a TextView child to exercise inline/text layout paths
    val parentView = mason.createView(appContext)

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val tv = mason.createTextView(appContext)
      // exercise the float feature like FloatActivity
      tv.style.float = CSSFloat.Left
      tv.append("Test float metrics")
      parentView.append(tv)
      // Run a few compute variants
      parentView.computeAndLayout(-1f, -2f)
      parentView.computeAndLayout(-1f, -1f)
      parentView.computeAndLayout(300f, 300f)
    }

    // Call native float-rects helper and inspect raw floats
    val floats = NativeHelpers.nativeNodeGetFloatRects(mason.nativePtr, parentView.node.nativePtr)

    val problems = mutableListOf<String>()
    for ((i, f) in floats.withIndex()) {
      if (f.isNaN()) {
        problems.add("NaN at idx=$i")
      } else if (f != 0f && kotlin.math.abs(f) < java.lang.Float.MIN_NORMAL) {
        problems.add("subnormal idx=$i val=$f bits=0x${Integer.toHexString(java.lang.Float.floatToIntBits(f))}")
      }
    }

    Assert.assertTrue("Found problematic floats: $problems", problems.isEmpty())
  }
}
