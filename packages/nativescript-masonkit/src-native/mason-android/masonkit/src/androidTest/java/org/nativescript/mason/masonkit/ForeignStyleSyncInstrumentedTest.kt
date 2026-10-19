package org.nativescript.mason.masonkit

import android.widget.TextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ForeignStyleSyncInstrumentedTest {
  private val instrumentation = InstrumentationRegistry.getInstrumentation()

  @Test
  fun foreignBufferSyncInvalidatesCachedLayoutAndResizesTheView() {
    instrumentation.runOnMainSync {
      val mason = Mason()
      val root = mason.createView(instrumentation.targetContext)
      val leaf = TextView(instrumentation.targetContext).apply { text = "foreign" }
      root.addView(leaf)
      val node = mason.nodeForView(leaf)
      val style = node.style
      style.prepareMut()
      val values = style.values

      fun resize(width: Float, height: Float) {
        values.put(StyleKeys.WIDTH_TYPE, Dimension.Kind.Points.value)
        values.putFloat(StyleKeys.WIDTH_VALUE, width)
        values.put(StyleKeys.HEIGHT_TYPE, Dimension.Kind.Points.value)
        values.putFloat(StyleKeys.HEIGHT_VALUE, height)
        val state = StateKeys.SIZE
        mason.syncStyleParts(leaf, state.low.toInt(), (state.low ushr 32).toInt(),
          state.high.toInt(), (state.high ushr 32).toInt())
      }

      fun layout() {
        root.forceLayout()
        root.measure(android.view.View.MeasureSpec.makeMeasureSpec(300, android.view.View.MeasureSpec.EXACTLY),
          android.view.View.MeasureSpec.makeMeasureSpec(100, android.view.View.MeasureSpec.EXACTLY))
        root.layout(0, 0, 300, 100)
      }

      resize(31f, 36f)
      layout()
      assertEquals(31, leaf.width)
      assertEquals(36, leaf.height)
      assertFalse(root.node.computeCacheDirty)
      resize(54f, 43f)
      assertTrue(root.node.computeCacheDirty)
      layout()
      assertEquals(54, leaf.width)
      assertEquals(43, leaf.height)
    }
  }

  @Test
  fun allFourWordsPreserveSignBitsAndDoNotSignExtendLowerWords() {
    instrumentation.runOnMainSync {
      val mason = Mason()
      val foreign = TextView(instrumentation.targetContext)
      val element = mason.createView(instrumentation.targetContext)
      for (view in listOf<android.view.View>(foreign, element)) {
        val style = if (view is Element) view.style else mason.nodeForView(view).style
        style.inBatch = true
        style.isDirty = -1L
        style.isDirtyHigh = -1L
        // Every word has its sign bit set, and the halves exceed JS number precision.
        mason.syncStyleParts(view, Int.MIN_VALUE, Int.MIN_VALUE or 1, -1, Int.MIN_VALUE or 2)
        assertEquals(0x8000000180000000uL.toLong(), style.isDirty)
        assertEquals(0x80000002ffffffffuL.toLong(), style.isDirtyHigh)
      }
    }
  }
}
