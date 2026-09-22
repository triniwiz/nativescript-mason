package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.ViewGroup
import android.widget.GridLayout
import android.widget.LinearLayout
import android.widget.TextView as AndroidTextView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection

@RunWith(AndroidJUnit4::class)
class CoreLayoutInteropInstrumentedTest {

  private val instrumentation = InstrumentationRegistry.getInstrumentation()
  private val context = instrumentation.targetContext

  @Test
  fun masonChildrenInsideLinearLayoutReceiveDeferredSizes() {
    val mason = Mason()
    val root = mason.createView(context).apply {
      style.display = Display.Flex
      style.flexDirection = FlexDirection.Column
    }
    val stack = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    }
    val paragraph = mason.createTextView(context).apply {
      append("Mason text inside a classic vertical layout should wrap and remain visible.")
    }
    val row = mason.createScrollView(context).apply {
      style.display = Display.Flex
      style.flexDirection = FlexDirection.Row
      style.setSizeHeight(32f, Dimension.Kind.Points.value)
    }
    val button = Button(context, mason).apply { textContent = "Mason button" }

    stack.addView(paragraph)
    stack.addView(row)
    stack.addView(button)
    root.addView(stack)

    measureAndLayout(root)
    instrumentation.waitForIdleSync()
    measureAndLayout(root)

    val childHeight = paragraph.measuredHeight + row.measuredHeight + button.measuredHeight
    assertTrue("paragraph should have a measured height", paragraph.measuredHeight > 0)
    assertTrue("paragraph should wrap", paragraph.measuredHeight > paragraph.paint.fontSpacing * 1.5f)
    assertTrue("row should have a measured height", row.measuredHeight > 0)
    assertTrue("button should have a measured height", button.measuredHeight > 0)
    assertTrue("stack should contain all three rows", stack.measuredHeight >= childHeight)
  }

  @Test
  fun masonChildrenInsideGridLayoutReceiveDeferredSizes() {
    val mason = Mason()
    val root = mason.createView(context)
    val grid = GridLayout(context).apply {
      columnCount = 2
      rowCount = 2
      layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    }
    val paragraph = mason.createTextView(context).apply { append("r0 c0") }
    val label = AndroidTextView(context).apply { text = "r0 c1" }
    val left = mason.createScrollView(context).apply { style.setSizeHeight(32f, Dimension.Kind.Points.value) }
    val right = mason.createScrollView(context).apply { style.setSizeHeight(32f, Dimension.Kind.Points.value) }

    grid.addView(paragraph, GridLayout.LayoutParams(GridLayout.spec(0), GridLayout.spec(0)))
    grid.addView(label, GridLayout.LayoutParams(GridLayout.spec(0), GridLayout.spec(1)))
    grid.addView(left, GridLayout.LayoutParams(GridLayout.spec(1), GridLayout.spec(0)))
    grid.addView(right, GridLayout.LayoutParams(GridLayout.spec(1), GridLayout.spec(1)))
    root.addView(grid)

    measureAndLayout(root)
    instrumentation.waitForIdleSync()
    measureAndLayout(root)

    assertTrue("grid should have content height", grid.measuredHeight > 0)
    assertTrue("Mason text should be visible", paragraph.measuredHeight > 0)
    assertTrue("core text should be visible", label.measuredHeight > 0)
    assertTrue("first Mason grid cell should be visible", left.measuredHeight > 0)
    assertTrue("second Mason grid cell should be visible", right.measuredHeight > 0)
  }

  @Test
  fun foreignLayoutKeepsWidthAssignedByMason() {
    val mason = Mason()
    val root = mason.createView(context)
    val row = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
      addView(AndroidTextView(context).apply { text = "A" })
      addView(AndroidTextView(context).apply { text = "B" })
      addView(AndroidTextView(context).apply { text = "C" })
    }
    root.addView(row)

    measureAndLayout(root)

    assertEquals(300, row.width)
    assertTrue("core children should remain visible", row.height > 0)
  }

  @Test
  fun attachedTextNodeUpdateChangesButtonText() {
    val mason = Mason()
    val root = mason.createView(context)
    val button = Button(context, mason)
    val textNode = TextNode(mason, "Count 0")
    button.node.appendChild(textNode)
    root.addView(button)

    measureAndLayout(root)
    assertEquals("Count 0", button.text.toString())

    instrumentation.runOnMainSync {
      textNode.data = "Count 1"
      button.draw(
        Canvas(
          Bitmap.createBitmap(
            button.width.coerceAtLeast(1),
            button.height.coerceAtLeast(1),
            Bitmap.Config.ARGB_8888
          )
        )
      )
    }

    assertEquals("Count 1", button.text.toString())
  }

  private fun measureAndLayout(root: android.view.View) {
    instrumentation.runOnMainSync {
      root.forceLayout()
      root.measure(
        android.view.View.MeasureSpec.makeMeasureSpec(300, android.view.View.MeasureSpec.EXACTLY),
        android.view.View.MeasureSpec.makeMeasureSpec(1000, android.view.View.MeasureSpec.AT_MOST)
      )
      root.layout(0, 0, root.measuredWidth, root.measuredHeight)
    }
  }
}
