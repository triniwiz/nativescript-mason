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
class InlineBoxLineHeightInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext
  private val width = 600

  private fun layOut(root: View): Bitmap {
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

  /** The last row from [from] down that has dark ink, or -1. */
  private fun lastInkRow(bitmap: Bitmap, from: Int): Int {
    for (y in bitmap.height - 1 downTo maxOf(from, 0)) {
      for (x in 0 until bitmap.width) {
        val p = bitmap.getPixel(x, y)
        if (Color.red(p) < 100 && Color.green(p) < 100 && Color.blue(p) < 100) return y
      }
    }
    return -1
  }

  private fun topIn(view: android.view.View, ancestor: android.view.View): Int {
    var y = 0
    var current: android.view.View? = view
    while (current != null && current !== ancestor) {
      y += current.top
      current = current.parent as? android.view.View
    }
    return y
  }

  /**
   * [linesBefore] lines of text in a <p> (16px), then a [boxHeight] CSS px inline-block on the next.
   * Returns the paragraph, the box and the height of one text line in device px.
   */
  private fun paragraph(mason: Mason, lineHeight: Float?, boxHeight: Float, linesBefore: Int): Triple<TextView, TextView, Float> {
    val p = mason.createTextView(context, TextType.P)
    lineHeight?.let { p.style.setLineHeight(it, true) }
    val probe = android.text.TextPaint().apply { textSize = 16f * mason.scale }
    repeat(linesBefore) {
      p.append("line ${it + 1}")
      p.append(mason.createBr(context))
    }
    p.append("then ")
    val box = mason.createTextView(context, TextType.Span).apply {
      append("x")
      node.style.display = Display.InlineBlock
      style.setSizeHeight(boxHeight * mason.scale, Dimension.Kind.Points.value)
    }
    p.append(box)
    p.append(" after.")
    val textLine = lineHeight?.let { it * 16f * mason.scale } ?: probe.fontMetrics.let { it.descent - it.ascent }
    return Triple(p, box, textLine)
  }

  private fun assertBoxFitsItsLine(lineHeight: Float?, linesBefore: Int) {
    val mason = Mason()
    val root = mason.createView(context)
    val boxHeight = 60f
    val (p, box, textLine) = paragraph(mason, lineHeight, boxHeight, linesBefore)
    root.append(p)
    layOut(root)

    val linesAbove = textLine * linesBefore
    val boxTop = topIn(box, p)
    val boxBottom = boxTop + box.height
    Assert.assertTrue("the box (${box.height}px) is laid out", box.height >= boxHeight * mason.scale - 1)
    Assert.assertTrue("the box starts at $boxTop, inside the $linesBefore text line(s) above it, which end at $linesAbove", boxTop >= linesAbove - 1)
    Assert.assertTrue("the box ends at $boxBottom, below the paragraph's bottom (${p.height}px)", boxBottom <= p.height + 1)
  }

  /**
   * A three-line box on line 1, so the line's baseline is near the box's bottom, then text in one
   * run that wraps once, so line 2 starts inside that run.
   */
  private fun assertTextAfterBoxLineKeepsItsHeight(lineHeight: Float?) {
    val mason = Mason()
    val root = mason.createView(context)
    val p = mason.createTextView(context, TextType.P)
    lineHeight?.let { p.style.setLineHeight(it, true) }
    val box = mason.createTextView(context, TextType.Span).apply {
      append("a")
      append(mason.createBr(context))
      append("b")
      append(mason.createBr(context))
      append("c")
      node.style.display = Display.InlineBlock
    }
    val probe = android.text.TextPaint().apply { textSize = 16f * mason.scale }
    val words = StringBuilder(" ")
    while (probe.measureText(words.toString()) < width * 1.2f) words.append("word ")
    p.append(box)
    p.append(words.toString().trimEnd())
    root.append(p)
    val bitmap = layOut(root)

    val textLine = lineHeight?.let { it * 16f * mason.scale } ?: probe.fontMetrics.let { it.descent - it.ascent }
    val boxBottom = topIn(box, p) + box.height
    Assert.assertTrue(
      "the paragraph (${p.height}px) is the box's line ($boxBottom) and one ${textLine}px text line",
      p.height <= boxBottom + textLine + 2
    )
    val pTop = topIn(p, root)
    val ink = lastInkRow(bitmap, pTop + boxBottom) - pTop
    Assert.assertTrue("the second line's text is drawn ($ink) inside the paragraph (${p.height}px)", ink in boxBottom until p.height - 2)
  }

  @Test
  fun bigTextAfterABoxLineKeepsItsHeight() {
    val mason = Mason()
    val root = mason.createView(context)
    val p = mason.createTextView(context, TextType.P)
    val box = mason.createTextView(context, TextType.Span).apply {
      append("a")
      append(mason.createBr(context))
      append("b")
      node.style.display = Display.InlineBlock
    }
    val probe = android.text.TextPaint().apply { textSize = 16f * mason.scale }
    val words = StringBuilder(" ")
    while (probe.measureText(words.toString()) < width * 1.1f) words.append("word ")
    val big = mason.createTextView(context, TextType.Span).apply {
      append("BIG")
      style.fontSize = 32f
    }
    p.append(box)
    p.append(words.toString())
    p.append(big)
    p.append(" tail")
    root.append(p)
    layOut(root)

    val bigLine = android.text.TextPaint().apply { textSize = 32f * mason.scale }.fontMetrics.let { it.descent - it.ascent }
    val boxBottom = topIn(box, p) + box.height
    Assert.assertTrue(
      "the line after the box (${p.height - boxBottom}px) fits its 32px text (${bigLine}px)",
      p.height - boxBottom >= bigLine - 2
    )
  }

  @Test
  fun textAfterABoxLineKeepsItsLineHeight() = assertTextAfterBoxLineKeepsItsHeight(1.5f)

  @Test
  fun textAfterABoxLineKeepsNormalLineHeight() = assertTextAfterBoxLineKeepsItsHeight(null)

  @Test
  fun tallBoxGrowsTheSecondLine() = assertBoxFitsItsLine(1.5f, 1)

  @Test
  fun tallBoxGrowsTheThirdLine() = assertBoxFitsItsLine(1.5f, 2)

  @Test
  fun tallBoxGrowsALaterLineWithNormalLineHeight() = assertBoxFitsItsLine(null, 2)
}
