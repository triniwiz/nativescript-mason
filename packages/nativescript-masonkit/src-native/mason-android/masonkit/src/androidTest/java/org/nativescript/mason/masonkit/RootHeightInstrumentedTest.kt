package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class RootHeightInstrumentedTest {

  @Test
  fun rootDoesNotCollapseToZero() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext

    val mason = Mason()


    // Create an actual View parent so layout paths that rely on Android Views are exercised.
    val parentView = mason.createView(appContext)

    // Create and attach the view hierarchy on the main thread and measure it
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      // Also add a TextView with some text so inline/mixed layout paths run
      val tv = mason.createTextView(appContext)
      tv.append("Hello from test")
      parentView.append(tv)
      // Try multiple compute/layout variants: (-1,-2), (-1,-1), and (-1, concrete height)
      parentView.computeAndLayout(-1f, -2f)
      parentView.computeAndLayout(-1f, -1f)
      // Final compute: use an explicit concrete size ~300x300 to exercise size-aware path
      parentView.computeAndLayout(300f, 300f)
    }


    // Dump the raw flat layout exported by native compute for debugging
    val tree = parentView.node.layoutTree
    android.util.Log.d("RootHeightTest", "layoutTree.nodeCount=${tree.nodeCount} frames=${tree.frames.joinToString(",")}")
    android.util.Log.d("RootHeightTest", "layoutTree.contentSizes=${tree.contentSizes.joinToString(",")}")

    // Collect heights after the compute variants and log each
    val heights = mutableListOf<Float>()
    val h1 = parentView.node.computedLayout.height
    android.util.Log.i("RootHeightTest", "Computed parent height (final) = $h1")
    heights.add(h1)

    // For extra visibility, try reading from layoutTree cursor if available
    android.util.Log.d("RootHeightTest", "layoutTree.nodeCount=${tree.nodeCount}")

    // Assert that at least one compute variant produced a non-zero height
    Assert.assertTrue("Parent layout height should be > 0 (results=${heights})", heights.any { it > 0f })
  }
}
