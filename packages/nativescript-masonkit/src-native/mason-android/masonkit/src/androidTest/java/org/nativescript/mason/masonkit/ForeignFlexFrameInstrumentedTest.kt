package org.nativescript.mason.masonkit

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.View as AndroidView
import android.view.View.MeasureSpec
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView as AndroidTextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection

@RunWith(AndroidJUnit4::class)
class ForeignFlexFrameInstrumentedTest {
  private val instrumentation = InstrumentationRegistry.getInstrumentation()
  private val context = instrumentation.targetContext

  private fun label() = AndroidTextView(context).apply { text = "short" }

  private fun fixture(leaf: AndroidView, direction: FlexDirection, fixed: Boolean = false): View {
    val mason = Mason()
    val root = mason.createView(context).apply {
      style.display = Display.Flex
      style.flexDirection = direction
      style.setSizeWidth(107f, Dimension.Kind.Points.value)
      style.setSizeHeight(200f, Dimension.Kind.Points.value)
    }
    leaf.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    root.addView(leaf)
    mason.nodeForView(leaf).style.apply {
      if (fixed) {
        setSizeWidth(107f, Dimension.Kind.Points.value)
        setSizeHeight(200f, Dimension.Kind.Points.value)
      } else {
        flexGrow = 1f
        alignSelf = AlignSelf.Stretch
      }
    }
    return root
  }

  private fun layout(root: View, heightMode: Int = MeasureSpec.EXACTLY) {
    root.forceLayout()
    root.measure(MeasureSpec.makeMeasureSpec(107, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(200, heightMode))
    root.layout(0, 0, root.measuredWidth, root.measuredHeight)
  }

  private fun assertFills(root: View, leaf: AndroidView, stage: String) {
    val computed = root.node.mason.nodeForView(leaf).computedLayout
    assertEquals("$stage computed width", 107f, computed.width, 0f)
    assertEquals("$stage computed height", 200f, computed.height, 0f)
    assertEquals("$stage native width", 107, leaf.width)
    assertEquals("$stage native height", 200, leaf.height)
    assertEquals("$stage measured height", 200, leaf.measuredHeight)
  }

  private fun exerciseRequests(root: View, leaf: AndroidView) {
    // Assert each pass independently: a second parent-only pass used to hide
    // the incorrect frame produced by the first pass and leaf requests.
    layout(root)
    assertFills(root, leaf, "first layout")
    root.requestLayout()
    layout(root)
    assertFills(root, leaf, "parent request")
    repeat(2) {
      leaf.requestLayout()
      assertTrue(leaf.isLayoutRequested)
      layout(root)
      assertFills(root, leaf, "leaf request $it")
    }
    leaf.forceLayout()
    layout(root)
    assertFills(root, leaf, "leaf forceLayout")
  }

  @Test
  fun columnFlexGrowPreservesTheAssignedHeight() {
    instrumentation.runOnMainSync {
      val leaf = label()
      exerciseRequests(fixture(leaf, FlexDirection.Column), leaf)
    }
  }

  @Test
  fun rowCrossAxisStretchPreservesTheAssignedHeight() {
    instrumentation.runOnMainSync {
      val leaf = label()
      exerciseRequests(fixture(leaf, FlexDirection.Row), leaf)
    }
  }

  @Test
  fun changedTextPreservesTheAssignedHeight() {
    instrumentation.runOnMainSync {
      val leaf = label()
      val root = fixture(leaf, FlexDirection.Column)
      layout(root)
      leaf.text = "changed"
      layout(root)
      assertFills(root, leaf, "changed text")
    }
  }

  @Test
  fun imageIntrinsicAspectRatioDoesNotReplaceTheAssignedHeight() {
    instrumentation.runOnMainSync {
      val leaf = ImageView(context).apply {
        adjustViewBounds = true
        setImageDrawable(object : ColorDrawable(Color.TRANSPARENT) {
          override fun getIntrinsicWidth() = 400
          override fun getIntrinsicHeight() = 300
        })
      }
      exerciseRequests(fixture(leaf, FlexDirection.Column), leaf)
    }
  }

  @Test
  fun explicitHeightStillFillsTheBox() {
    instrumentation.runOnMainSync {
      val leaf = label()
      exerciseRequests(fixture(leaf, FlexDirection.Column, fixed = true), leaf)
    }
  }

  @Test
  fun intrinsicTextChangesStillReflowTheParentAndFollowingSibling() {
    instrumentation.runOnMainSync {
      val mason = Mason()
      val root = mason.createView(context).apply {
        style.display = Display.Flex
        style.flexDirection = FlexDirection.Column
      }
      val leaf = label().apply {
        layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
      }
      val footer = mason.createView(context).apply { style.setSizeHeight(20f, Dimension.Kind.Points.value) }
      root.addView(leaf)
      root.addView(footer)
      fun settle() { repeat(2) { layout(root, MeasureSpec.AT_MOST) } }
      settle()
      val initialHeight = leaf.height
      val initialRootHeight = root.measuredHeight
      leaf.text = "longer text that wraps over several lines in the narrow container"
      settle()
      assertTrue("text should grow", leaf.height > initialHeight)
      assertEquals(leaf.bottom, footer.top)
      assertEquals(leaf.height + footer.height, root.measuredHeight)
      leaf.text = "short"
      settle()
      assertEquals(initialHeight, leaf.height)
      assertEquals(leaf.bottom, footer.top)
      assertEquals(initialRootHeight, root.measuredHeight)
    }
  }
}
