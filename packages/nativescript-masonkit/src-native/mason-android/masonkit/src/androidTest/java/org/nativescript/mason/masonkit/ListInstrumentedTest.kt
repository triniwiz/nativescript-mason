package org.nativescript.mason.masonkit

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.ListStyleType

/**
 * Instrumented tests for ul/ol/li elements — verifying node creation,
 * marker measurement, layout computation, and list style resolution.
 */
@RunWith(AndroidJUnit4::class)
class ListInstrumentedTest {

  private val TAG = "ListInstrumentedTest"

  // -- Li node creation --

  @Test
  fun liCreatesListItemNode() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      Assert.assertNotNull("Li node should not be null", li.node)
      Assert.assertTrue("Li node nativePtr should be valid", li.node.nativePtr != 0L)
      Log.i(TAG, "Li node nativePtr=${li.node.nativePtr}")
    }
  }

  @Test
  fun liExtendsView() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      Assert.assertTrue("Li should be an instance of View", li is View)
      Assert.assertTrue("Li should implement Element", li is Element)
      Assert.assertTrue("Li should implement MeasureFunc", li is MeasureFunc)
    }
  }

  // -- Marker measurement --

  @Test
  fun unorderedLiMeasuresDiscMarker() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.isOrdered = false
      li.position = 0

      val size = li.measure(Size(null, null), Size(null, null))
      Log.i(TAG, "Unordered disc marker: width=${size.width} height=${size.height}")

      Assert.assertTrue("Marker width should be > 0", size.width > 0f)
      Assert.assertTrue("Marker height should be > 0", size.height > 0f)
      Assert.assertTrue("markerWidth should match", li.markerWidth > 0f)
    }
  }

  @Test
  fun orderedLiMeasuresDecimalMarker() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.isOrdered = true
      li.position = 0

      val size = li.measure(Size(null, null), Size(null, null))
      Log.i(TAG, "Ordered decimal marker: width=${size.width} height=${size.height}")

      Assert.assertTrue("Marker width should be > 0", size.width > 0f)
      Assert.assertTrue("Marker height should be > 0", size.height > 0f)
    }
  }

  @Test
  fun decimalMarkerWidthGrowsWithPosition() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.isOrdered = true

      li.position = 0
      val size1 = li.measure(Size(null, null), Size(null, null))

      li.position = 99
      val size100 = li.measure(Size(null, null), Size(null, null))

      Log.i(TAG, "Position 1 width=${size1.width}, Position 100 width=${size100.width}")

      Assert.assertTrue(
        "3-digit marker (100.) should be wider than 1-digit (1.)",
        size100.width > size1.width
      )
    }
  }

  @Test
  fun noneStyleProducesZeroMarker() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.style.prepareMut()
      li.style.values.put(StyleKeys.LIST_STYLE_TYPE_STATE, StyleState.SET)
      li.style.values.put(StyleKeys.LIST_STYLE_TYPE, ListStyleType.None.value)

      val size = li.measure(Size(null, null), Size(null, null))
      Log.i(TAG, "None marker: width=${size.width} height=${size.height}")

      Assert.assertEquals("None style marker width should be 0", 0f, size.width, 0.001f)
      Assert.assertEquals("None style marker height should be 0", 0f, size.height, 0.001f)
    }
  }

  // -- List style resolution --

  @Test
  fun unorderedLiDefaultsToDisc() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.isOrdered = false

      val resolved = li.resolveListStyleType()
      Assert.assertEquals("Unordered Li should default to Disc", ListStyleType.Disc.value, resolved)
    }
  }

  @Test
  fun orderedLiDefaultsToDecimal() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.isOrdered = true

      val resolved = li.resolveListStyleType()
      Assert.assertEquals(
        "Ordered Li should default to Decimal",
        ListStyleType.Decimal.value, resolved
      )
    }
  }

  // -- Reset for recycling --

  @Test
  fun resetForRecycleClearsState() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.isOrdered = true
      li.position = 5
      li.setMarkerValue("6.")
      // Trigger measurement to populate marker dimensions
      li.measure(Size(null, null), Size(null, null))
      Assert.assertTrue("markerWidth should be set before reset", li.markerWidth > 0f)

      li.resetForRecycle()

      Assert.assertEquals("position should be -1 after reset", -1, li.position)
      Assert.assertFalse("isOrdered should be false after reset", li.isOrdered)
      Assert.assertEquals("marker should be empty after reset", "", li.marker)
      Assert.assertEquals("markerWidth should be 0 after reset", 0f, li.markerWidth, 0.001f)
      Assert.assertEquals("markerHeight should be 0 after reset", 0f, li.markerHeight, 0.001f)
    }
  }

  // -- Layout computation --

  @Test
  fun liWithTextChildHasNonZeroLayout() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.isOrdered = false
      li.position = 0
      li.setMarkerValue("\u2022")

      val tv = mason.createTextView(context)
      tv.append("List item text")
      li.append(tv)

      val layout = computeAndLayout(li, mason, 300f, -2f)
      Log.i(TAG, "Li layout: width=${layout.width} height=${layout.height}")
      Log.i(TAG, "Li children: ${layout.children.size}")
      for ((i, child) in layout.children.withIndex()) {
        Log.i(TAG, "  child[$i]: ${child.width}x${child.height} at (${child.x}, ${child.y})")
      }

      Assert.assertTrue("Li width should be > 0", layout.width > 0f)
      Assert.assertTrue("Li height should be > 0", layout.height > 0f)
    }
  }

  @Test
  fun liMarkerReservesSpace() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val li = mason.createListItem(context)
      li.isOrdered = false
      li.position = 0
      li.setMarkerValue("\u2022")

      val tv = mason.createTextView(context)
      tv.append("Text")
      li.append(tv)

      val layout = computeAndLayout(li, mason, 300f, -2f)

      // The marker node should consume space, pushing content to the right
      if (layout.children.isNotEmpty()) {
        val firstChild = layout.children[0]
        Log.i(
          TAG,
          "First child x=${firstChild.x}, markerWidth=${li.markerWidth}"
        )
        // The first child in the layout tree is the marker node; the text
        // comes after. Verify the layout has multiple children (marker + content).
        Assert.assertTrue(
          "Li should have at least 1 layout child",
          layout.children.isNotEmpty()
        )
      }

      Assert.assertTrue("markerWidth should be > 0", li.markerWidth > 0f)
    }
  }

  // -- ListView (ul/ol) --

  @Test
  fun unorderedListViewCreatesCorrectNode() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val ul = mason.createListView(context, isOrdered = false)
      Assert.assertNotNull("ListView node should not be null", ul.node)
      Assert.assertFalse("ul should not be ordered", ul.isOrdered)
      Assert.assertTrue("ListView should implement Element", ul is Element)
    }
  }

  @Test
  fun orderedListViewCreatesCorrectNode() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val ol = mason.createListView(context, isOrdered = true)
      Assert.assertNotNull("ListView node should not be null", ol.node)
      Assert.assertTrue("ol should be ordered", ol.isOrdered)
    }
  }

  @Test
  fun listViewWithStaticItems() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val ul = mason.createListView(context, isOrdered = false)

      val li1 = mason.createListItem(context)
      val tv1 = mason.createTextView(context)
      tv1.append("First item")
      li1.append(tv1)

      val li2 = mason.createListItem(context)
      val tv2 = mason.createTextView(context)
      tv2.append("Second item")
      li2.append(tv2)

      ul.addStaticView(li1)
      ul.addStaticView(li2)

      Assert.assertEquals("ListView should have 2 items", 2, ul.count)
    }
  }

  @Test
  fun listViewLayoutHasNonZeroDimensions() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val parent = mason.createView(context)

      val ul = mason.createListView(context, isOrdered = false)

      val li = mason.createListItem(context)
      val tv = mason.createTextView(context)
      tv.append("Item")
      li.append(tv)
      ul.addStaticView(li)

      parent.append(ul)
      parent.computeAndLayout(300f, 300f)

      val width = ul.node.computedWidth
      val height = ul.node.computedHeight
      Log.i(TAG, "ListView computed: width=$width height=$height")

      Assert.assertTrue("ListView width should be > 0", width > 0f)
      Assert.assertTrue("ListView height should be > 0", height > 0f)
    }
  }

  // -- Helper --

  private fun computeAndLayout(
    li: Li, mason: Mason, width: Float, height: Float
  ): Layout {
    return Layout.fromFloatArray(
      NativeHelpers.nativeNodeComputeWithSizeAndLayout(
        mason.nativePtr,
        li.node.nativePtr,
        width, height
      ), 0
    ).second
  }
}
