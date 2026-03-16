package org.nativescript.mason.masondemo

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*

import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.Float as MasonFloat
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.NodeHelper
import org.nativescript.mason.masonkit.Element
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.Dimension
import android.util.Log
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import android.view.ViewTreeObserver

@RunWith(AndroidJUnit4::class)
class FloatActivityInstrumentedTest {
  @Test
  fun reproduceFloatActivity() {
    val mason = Mason()

    val root = View.createBlockView(mason, androidx.test.core.app.ApplicationProvider.getApplicationContext())
    NodeHelper.shared.setDisplay(root, Display.Block)
    try { NodeHelper.shared.setSize(root, Dimension.Points(300f), Dimension.Auto) } catch (_: Throwable) {}

    val card = View.createBlockView(mason, androidx.test.core.app.ApplicationProvider.getApplicationContext())

    // left float (68x68)
    val drop = View(androidx.test.core.app.ApplicationProvider.getApplicationContext(), mason)
    try { NodeHelper.shared.setFloat(drop, MasonFloat.Left) } catch (_: Throwable) {}
    try { NodeHelper.shared.setSize(drop, Dimension.Points(68f), Dimension.Points(68f)) } catch (_: Throwable) {}
    card.appendView(drop)

    // prose following (200x20)
    val prose = View(androidx.test.core.app.ApplicationProvider.getApplicationContext(), mason)
    try { NodeHelper.shared.setSize(prose, Dimension.Points(200f), Dimension.Points(20f)) } catch (_: Throwable) {}
    card.appendView(prose)

    root.appendView(card)

    // Force compute/layout via public API
    try { root.compute(300f, Float.NaN) } catch (_: Throwable) {}

    val (ids, rects) = NodeHelper.shared.getFloatRectsLocalToView(root)
    assertNotNull(rects)
    assertTrue(rects.size % 4 == 0)
  }

  @Test
  fun floatActivityUiWrapsText() {
    ActivityScenario.launch(FloatActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        // find the prose TextView by matching its first few words
        val rootView = activity.findViewById(android.R.id.content) as android.view.ViewGroup
        val matches = ArrayList<android.view.View>()
        rootView.findViewsWithText(matches, "Lorem ipsum", android.view.View.FIND_VIEWS_WITH_TEXT)
        Log.d("FloatActivityTest", "matches count=${matches.size}")
        assertTrue("prose TextView missing", matches.isNotEmpty())
        val proseView = matches[0] as android.widget.TextView
        // Trigger engine compute/layout for the prose's root node to ensure measurements
        try {
          val rootNode = (proseView as? Element)?.node?.getRootNode()
          if (rootNode != null) {
            NodeHelper.shared.compute(rootNode)
          }
        } catch (_: Throwable) {}
        Log.d("FloatActivityTest", "prose class=${proseView.javaClass.name} visibility=${proseView.visibility} measuredWidth=${proseView.measuredWidth} layoutParams=${proseView.layoutParams}")

        // wait for layout pass using a global layout listener (wait until width>0)
        val latch = CountDownLatch(1)
        val listener = object : ViewTreeObserver.OnGlobalLayoutListener {
          override fun onGlobalLayout() {
            if (proseView.width > 0) {
              try { proseView.viewTreeObserver.removeOnGlobalLayoutListener(this) } catch (_: Throwable) {}
              latch.countDown()
            }
          }
        }
        try { proseView.requestLayout() } catch (_: Throwable) {}
        try { proseView.viewTreeObserver.addOnGlobalLayoutListener(listener) } catch (_: Throwable) {}
        latch.await(2, TimeUnit.SECONDS)

        Log.d("FloatActivityTest", "prose width=${proseView.width}")
        // ensure layout finished
        assertTrue(proseView.width > 0)

        val screenW = activity.metrics.widthPixels
        // drop cap is about 68px, expect prose to be < screenW - 50
        assertTrue(
          "prose width did not shrink around float",
          proseView.width < screenW - 50
        )
      }
    }
  }
}
