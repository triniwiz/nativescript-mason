package org.nativescript.mason.masonkit

import android.view.ViewGroup
import android.widget.TextView as AndroidTextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.FlexDirection

@RunWith(AndroidJUnit4::class)
class ReactiveForeignMeasureInstrumentedTest {
  private val instrumentation = InstrumentationRegistry.getInstrumentation()
  private val context = instrumentation.targetContext
  private val longText = "A regular NativeScript label must reflow when its text changes inside a Mason container. ".repeat(8)

  private fun fixture(text: String): Pair<View, AndroidTextView> {
    val mason = Mason()
    val root = mason.createView(context).apply { style.flexDirection = FlexDirection.Column }
    val label = AndroidTextView(context).apply {
      this.text = text
      layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    }
    root.addView(label)
    return root to label
  }

  private fun layout(root: View, width: Int = 300) {
    // Applying a changed foreign measurement can invalidate its ancestors for
    // a follow-up pass. Settle that pass before comparing final geometry.
    repeat(2) {
      root.forceLayout()
      root.measure(
        android.view.View.MeasureSpec.makeMeasureSpec(width, android.view.View.MeasureSpec.EXACTLY),
        android.view.View.MeasureSpec.makeMeasureSpec(2000, android.view.View.MeasureSpec.AT_MOST)
      )
      root.layout(0, 0, root.measuredWidth, root.measuredHeight)
    }
  }

  private fun freshHeight(text: String, width: Int = 300): Int {
    val (root, label) = fixture(text)
    layout(root, width)
    return label.height
  }

  @Test
  fun contentChangesReflowAtTheSameConstraints() {
    instrumentation.runOnMainSync {
      val (root, label) = fixture("Short")
      layout(root)
      val initial = label.height
      assertTrue(initial > 0)
      for (text in listOf(longText, "", "Short")) {
        label.text = text
        layout(root)
        assertEquals("updated text must match a fresh native measurement", freshHeight(text), label.height)
        if (text == longText) assertTrue("long text should wrap", label.height > initial * 2)
      }
      assertEquals(initial, label.height)
    }
  }

  @Test
  fun widthChangesReflowAndRestoreTheOriginalHeight() {
    instrumentation.runOnMainSync {
      val (root, label) = fixture(longText)
      layout(root, 300)
      val initial = label.height
      layout(root, 600)
      assertTrue(label.height < initial)
      assertEquals(freshHeight(longText, 600), label.height)
      layout(root, 300)
      assertEquals(initial, label.height)
    }
  }

  @Test
  fun detachedContentChangesAreMeasuredAfterReattachment() {
    instrumentation.runOnMainSync {
      val (root, label) = fixture("Short")
      layout(root)
      root.removeView(label)
      layout(root)
      label.text = longText
      root.addView(label)
      layout(root)
      assertEquals(root, label.parent)
      assertEquals(freshHeight(longText), label.height)
      assertTrue(label.height > 0)
    }
  }

  @Test
  fun contentChangesUpdateTheParentHeightAndFollowingSibling() {
    instrumentation.runOnMainSync {
      fun footer(root: View): View {
        return root.node.mason.createView(context).apply {
          style.setSizeHeight(20f, Dimension.Kind.Points.value)
          root.addView(this)
        }
      }
      val (root, label) = fixture("Short")
      val following = footer(root)
      layout(root)
      for (text in listOf(longText, "Short")) {
        label.text = text
        layout(root)
        val (freshRoot, freshLabel) = fixture(text)
        val freshFollowing = footer(freshRoot)
        layout(freshRoot)
        assertEquals(freshLabel.height, label.height)
        assertEquals(freshFollowing.top, following.top)
        assertEquals(freshRoot.measuredHeight, root.measuredHeight)
      }
    }
  }
}
