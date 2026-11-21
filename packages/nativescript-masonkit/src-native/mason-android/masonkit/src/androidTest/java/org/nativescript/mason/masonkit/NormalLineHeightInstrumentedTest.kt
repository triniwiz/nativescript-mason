package org.nativescript.mason.masonkit

import android.text.TextPaint
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType
import kotlin.math.roundToInt

@RunWith(AndroidJUnit4::class)
class NormalLineHeightInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext
  private val density = context.resources.displayMetrics.density

  private fun probe(sizeDip: Float) = TextPaint().also { it.textSize = sizeDip * density }

  private fun floatLineHeight(paint: TextPaint) = paint.fontMetrics.let { it.descent - it.ascent }

  private fun intLineHeight(paint: TextPaint) = paint.fontMetricsInt.let { it.descent - it.ascent }

  private fun sizeWithFloatLineTallerThanInt(): Float {
    var size = 14f
    while (floatLineHeight(probe(size)) - intLineHeight(probe(size)) < 0.05f) size += 0.25f
    return size
  }

  @Test
  fun lineTopsOfALongParagraphAreTheRoundedRunningFloatSum() {
    val size = sizeWithFloatLineTallerThanInt()
    val mason = Mason().apply { setDeviceScale(density) }
    val root = mason.createView(context)
    val text = mason.createTextView(context, TextType.Span).apply {
      style.display = Display.Block
      style.fontSize = size
      textContent = "The quick brown fox jumps over the lazy dog. ".repeat(16).trim()
    }
    root.addView(text)
    val width = 300f * density
    root.style.setSizeWidth(width, Dimension.Kind.Points.value)
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val tree = root.computeAndLayout(width, -1f)
      if (tree.nodeCount > 0) root.applyLayoutFlat(root.node, tree)
    }

    val layout = text.cachedStaticLayout!!
    val paint = probe(size)
    assertEquals("the probe measures the text's font", paint.fontMetricsInt.ascent, layout.getLineAscent(0))
    assertTrue("the paragraph wraps to many lines (${layout.lineCount})", layout.lineCount >= 12)

    val line = floatLineHeight(paint)
    val expected = (0..layout.lineCount).map { (it * line).roundToInt() }
    val tops = (0..layout.lineCount).map { layout.getLineTop(it) }
    assertEquals("line tops for a ${line}px line", expected, tops)
    assertEquals("the text's height", expected.last(), text.height)
  }
}
