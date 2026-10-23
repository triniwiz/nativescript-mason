package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.view.View.MeasureSpec
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class InlineBoxBaselineInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  private fun render(root: View, width: Int): Bitmap {
    NativeHelpers.nativeNodeComputeWithSizeAndLayout(root.node.mason.nativePtr, root.node.nativePtr, width.toFloat(), -1f)
    root.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    root.layout(0, 0, width, maxOf(root.measuredHeight, 1))
    val bitmap = Bitmap.createBitmap(width, maxOf(root.height, 1), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.drawColor(Color.WHITE)
    root.draw(canvas)
    return bitmap
  }

  private fun inkBottom(bitmap: Bitmap, from: Int, to: Int): Int {
    for (y in bitmap.height - 1 downTo 0) {
      for (x in maxOf(from, 0) until minOf(to, bitmap.width)) {
        val p = bitmap.getPixel(x, y)
        if (Color.red(p) < 100 && Color.green(p) < 100 && Color.blue(p) < 100) return y
      }
    }
    return -1
  }

  private fun leftIn(view: android.view.View, root: android.view.View): Int {
    var x = 0
    var current: android.view.View? = view
    while (current != null && current !== root) {
      x += current.left
      current = current.parent as? android.view.View
    }
    return x
  }

  private fun assertOnBaseline(root: View, box: android.view.View) {
    val bitmap = render(root, 1000)
    val left = leftIn(box, root)
    val around = inkBottom(bitmap, 0, left - 2)
    val inside = inkBottom(bitmap, left + 2, left + box.width - 2)
    Assert.assertTrue("text is drawn around ($around) and inside ($inside) the box", around > 0 && inside > 0)
    Assert.assertTrue("text in the box ends on row $inside, the text around it on $around", kotlin.math.abs(inside - around) <= 2)
  }

  @Test
  fun paddedInlineBlockSitsOnItsTextBaseline() {
    val mason = Mason()
    val div = mason.createView(context)
    val chip = mason.createTextView(context, TextType.Span).apply {
      append("HHH")
      node.style.display = Display.InlineBlock
      node.style.setPadding(10f, 30f, 10f, 4f)
    }
    div.append("HHH ")
    div.append(chip)
    div.append(" HHH")

    assertOnBaseline(div, chip)
  }

  @Test
  fun inlineDivSitsOnItsLinksBaseline() {
    val mason = Mason()
    val p = mason.createTextView(context, TextType.P)
    val inner = mason.createView(context).apply { node.style.display = Display.Inline }
    val link = mason.createTextView(context, TextType.A).apply { append("HHH") }
    inner.append(link)
    p.append("HHH ")
    p.append(inner)
    p.append(" HHH")
    val root = mason.createView(context)
    root.append(p)

    assertOnBaseline(root, link)
    Assert.assertTrue("the inline div is laid out", inner.node.computedWidth > 0 && inner.node.computedHeight > 0)
    Assert.assertTrue("the link inside it is laid out", link.node.computedWidth > 0 && link.node.computedHeight > 0)
  }
}
