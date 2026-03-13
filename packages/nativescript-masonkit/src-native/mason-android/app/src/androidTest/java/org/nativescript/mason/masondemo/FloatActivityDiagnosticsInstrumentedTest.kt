package org.nativescript.mason.masondemo

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith
import android.util.Log
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import android.view.ViewTreeObserver
import org.nativescript.mason.masonkit.NodeHelper

@RunWith(AndroidJUnit4::class)
class FloatActivityDiagnosticsInstrumentedTest {
  @Test
  fun diagnoseFloatActivityLayout() {
    ActivityScenario.launch(FloatActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val rootView = activity.findViewById(android.R.id.content) as android.view.ViewGroup
        val matches = ArrayList<android.view.View>()
        rootView.findViewsWithText(matches, "Lorem ipsum", android.view.View.FIND_VIEWS_WITH_TEXT)
        Log.d("FloatDiag", "matches count=${matches.size}")
        if (matches.isEmpty()) return@onActivity

        val proseView = matches[0]
        Log.d("FloatDiag", "prose class=${proseView.javaClass.name} visibility=${proseView.visibility} measuredWidth=${proseView.measuredWidth}")

        // locate the node for the prose view via Mason and force compute
        try {
          val node = org.nativescript.mason.masonkit.Mason.shared.nodeForView(proseView)
          val rootNode = node.getRootNode() ?: node
          Log.d("FloatDiag", "prose nodeObjectId=${rootNode.objectId()}")
          try {
            NodeHelper.shared.compute(rootNode)
            Log.d("FloatDiag", "forced compute on rootNode nativePtr=${rootNode.getNativePtr()}")
          } catch (_: Throwable) {}
        } catch (_: Throwable) {}

        // wait shortly for layout
        val latch = CountDownLatch(1)
        val listener = object : ViewTreeObserver.OnGlobalLayoutListener {
          override fun onGlobalLayout() {
            try { proseView.viewTreeObserver.removeOnGlobalLayoutListener(this) } catch (_: Throwable) {}
            latch.countDown()
          }
        }
        try { proseView.requestLayout() } catch (_: Throwable) {}
        try { proseView.viewTreeObserver.addOnGlobalLayoutListener(listener) } catch (_: Throwable) {}
        latch.await(2, TimeUnit.SECONDS)

        Log.d("FloatDiag", "after layout prose width=${proseView.width} measured=${proseView.measuredWidth}")

        // dump float rects for the prose's container
        try {
          val (ids, rects) = NodeHelper.shared.getFloatRectsLocalToView(proseView)
          Log.d("FloatDiag", "float rects count=${rects.size}")
          var i = 0
          while (i < rects.size) {
            Log.d("FloatDiag", "rect=${rects[i]},${rects[i+1]},${rects[i+2]},${rects[i+3]}")
            i += 4
          }
        } catch (e: Throwable) {
          Log.e("FloatDiag", "error dumping float rects", e)
        }
      }
    }
  }
}
