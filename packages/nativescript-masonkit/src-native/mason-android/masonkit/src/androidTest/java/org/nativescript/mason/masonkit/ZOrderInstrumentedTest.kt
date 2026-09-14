package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * `View.rebuildZOrder` only enables custom child drawing order when a child
 * has a non-zero `z-index`, and orders equal z-indices by tree position.
 */
@RunWith(AndroidJUnit4::class)
class ZOrderInstrumentedTest {

  @Test
  fun noZIndexKeepsNativeOrder() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val parent = mason.createView(context)
      repeat(3) { parent.addView(mason.createView(context)) }
      assertFalse(parent.isChildrenDrawingOrderEnabled)
    }
  }

  @Test
  fun zIndexDrawsLastAndTiesKeepTreeOrder() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val parent = mason.createView(context)
      val a = mason.createView(context)
      val b = mason.createView(context)
      val c = mason.createView(context)
      parent.addView(a)
      parent.addView(b)
      parent.addView(c)
      // set after insertion: the parent must be told, not the child itself
      a.style.zIndex = 1

      assertTrue(parent.isChildrenDrawingOrderEnabled)
      // drawing order: b, c (z=0, tree order) then a (z=1)
      assertEquals(1, parent.getChildDrawingOrder(3, 0))
      assertEquals(2, parent.getChildDrawingOrder(3, 1))
      assertEquals(0, parent.getChildDrawingOrder(3, 2))
    }
  }
}
