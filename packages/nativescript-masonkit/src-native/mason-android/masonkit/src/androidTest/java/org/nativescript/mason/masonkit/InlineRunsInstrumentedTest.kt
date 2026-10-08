package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View.MeasureSpec
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType

/**
 * A block's inline children share one anonymous text container per run, as one inline flow,
 * and taps on inline elements drawn by a text container reach those elements.
 */
@RunWith(AndroidJUnit4::class)
class InlineRunsInstrumentedTest {

  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  private fun blockDiv(mason: Mason) = mason.createView(context).apply {
    node.style.display = Display.Block
  }

  private fun bold(mason: Mason, text: String) = mason.createTextView(context, TextType.B).apply { append(text) }

  private fun block(mason: Mason) = mason.createView(context).apply { node.style.display = Display.Block }

  @Test
  fun inlineChildrenShareOneRun() {
    val mason = Mason()
    val div = blockDiv(mason)
    div.append("a ")
    div.append(bold(mason, "b"))
    div.append(" c")

    Assert.assertEquals(3, div.node.getChildren().size)
    Assert.assertEquals(1, div.node.children.size)
    Assert.assertTrue(div.node.children[0].isAnonymous)
  }

  @Test
  fun blockChildSplitsRunsAndRemovingItMergesThem() {
    val mason = Mason()
    val div = blockDiv(mason)
    val middle = block(mason)
    div.append("one ")
    div.append(bold(mason, "two"))
    div.append(middle)
    div.append("three")

    Assert.assertEquals(3, div.node.children.size)
    Assert.assertTrue(div.node.children[0].isAnonymous)
    Assert.assertSame(middle.node, div.node.children[1])
    Assert.assertTrue(div.node.children[2].isAnonymous)

    div.node.removeChild(middle.node)
    Assert.assertEquals(1, div.node.children.size)
    Assert.assertEquals(3, div.node.getChildren().size)
  }

  @Test
  fun displayChangeRebuildsRuns() {
    val mason = Mason()
    val div = blockDiv(mason)
    val b = bold(mason, "b")
    div.append("a ")
    div.append(b)
    div.append(" c")
    Assert.assertEquals(1, div.node.children.size)

    b.node.style.display = Display.Block
    Assert.assertEquals(3, div.node.children.size)
    Assert.assertSame(b.node, div.node.children[1])

    b.node.style.display = Display.Inline
    Assert.assertEquals(1, div.node.children.size)
  }

  private fun layOut(view: TextView, mason: Mason, width: Int) {
    NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.nativePtr, view.node.nativePtr, width.toFloat(), -1f)
    view.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    val height = maxOf(view.measuredHeight, view.node.computedHeight.toInt(), 1)
    view.layout(0, 0, width, height)
    view.draw(Canvas(Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)))
  }

  private fun tap(view: TextView, x: Float, y: Float) {
    val time = SystemClock.uptimeMillis()
    val down = MotionEvent.obtain(time, time, MotionEvent.ACTION_DOWN, x, y, 0)
    val up = MotionEvent.obtain(time, time + 50, MotionEvent.ACTION_UP, x, y, 0)
    view.onTouchEvent(down)
    view.onTouchEvent(up)
    down.recycle()
    up.recycle()
  }

  @Test
  fun inlineBoxIsARealChildLaidOutInItsText() {
    val mason = Mason()
    val div = blockDiv(mason)
    val box = mason.createView(context).apply {
      node.style.display = Display.InlineBlock
      node.style.setSizeWidth(60f, Dimension.Kind.Points.value)
      node.style.setSizeHeight(30f, Dimension.Kind.Points.value)
    }
    div.append("some text before ")
    div.append(box)
    div.append(" and after")

    NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.nativePtr, div.node.nativePtr, 1000f, -1f)
    div.measure(
      MeasureSpec.makeMeasureSpec(1000, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    div.layout(0, 0, 1000, maxOf(div.measuredHeight, 1))
    div.draw(Canvas(Bitmap.createBitmap(1000, maxOf(div.height, 1), Bitmap.Config.ARGB_8888)))

    val run = div.node.children[0].view as TextView
    Assert.assertSame(run, box.parent)
    Assert.assertEquals(60, box.width)
    Assert.assertEquals(30, box.height)
    Assert.assertTrue("box sits after the leading text", box.left > 0)
    Assert.assertTrue("box sits inside its text", box.right <= run.width && box.bottom <= run.height)

    box.node.style.display = Display.None
    run.engine.applyTextIfNeeded()
    Assert.assertNull("hidden box leaves its text", box.parent)
  }

  @Test
  fun tapOnFlattenedLinkClicksTheLinkThenBubbles() {
    val mason = Mason()
    val p = mason.createTextView(context, TextType.P)
    val link = mason.createTextView(context, TextType.A).apply { append("link") }
    p.append(link)
    p.append(" and some plain text after it")

    val order = mutableListOf<String>()
    link.addEventListener("click") { order.add("link") }
    p.addEventListener("click") { order.add("p") }

    layOut(p, mason, 1000)
    tap(p, p.paddingLeft + 4f, p.height / 2f)
    Assert.assertEquals(listOf("link", "p"), order)
  }

  @Test
  fun stopPropagationOnTheLinkKeepsTheClickFromTheParagraph() {
    val mason = Mason()
    val p = mason.createTextView(context, TextType.P)
    val link = mason.createTextView(context, TextType.A).apply { append("link") }
    p.append(link)
    p.append(" and more")

    val order = mutableListOf<String>()
    link.addEventListener("click") {
      order.add("link")
      it.stopPropagation()
    }
    p.addEventListener("click") { order.add("p") }

    layOut(p, mason, 1000)
    tap(p, p.paddingLeft + 4f, p.height / 2f)
    Assert.assertEquals(listOf("link"), order)
  }
}
