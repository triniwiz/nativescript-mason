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
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class NestedTextRunsInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  private fun render(text: TextView): Bitmap {
    NativeHelpers.nativeNodeComputeWithSizeAndLayout(text.node.mason.nativePtr, text.node.nativePtr, 1000f, -1f)
    text.measure(MeasureSpec.makeMeasureSpec(1000, MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED))
    text.layout(0, 0, 1000, maxOf(text.measuredHeight, 1))
    val bitmap = Bitmap.createBitmap(1000, maxOf(text.height, 1), Bitmap.Config.ARGB_8888)
    Canvas(bitmap).apply { drawColor(Color.WHITE); text.draw(this) }
    return bitmap
  }

  private fun hasRedInk(bitmap: Bitmap): Boolean {
    for (y in 0 until bitmap.height) for (x in 0 until bitmap.width) {
      val p = bitmap.getPixel(x, y)
      if (Color.red(p) > 180 && Color.green(p) < 80 && Color.blue(p) < 80) return true
    }
    return false
  }

  @Test
  fun aSpanInsideASpanKeepsItsColour() {
    val mason = Mason()
    val p = mason.createTextView(context, TextType.P)
    val outer = mason.createTextView(context, TextType.Span)
    val inner = mason.createTextView(context, TextType.Span).apply {
      append("RED")
      style.color = Color.RED
    }
    outer.append(inner)
    p.append("plain ")
    p.append(outer)

    Assert.assertTrue("the inner span's red is drawn", hasRedInk(render(p)))
  }

  @Test
  fun aSpanInsideCodeInsidePreKeepsItsColour() {
    val mason = Mason()
    val pre = mason.createTextView(context, TextType.Pre)
    val code = mason.createTextView(context, TextType.Code)
    val token = mason.createTextView(context, TextType.Span).apply {
      append("const")
      style.color = Color.RED
    }
    code.append(token)
    code.append(" x = 1;")
    pre.append(code)

    Assert.assertTrue("the token's red is drawn", hasRedInk(render(pre)))
  }

  @Test
  fun aSpanInsidePreKeepsItsSpaces() {
    val mason = Mason()
    val pre = mason.createTextView(context, TextType.Pre).apply { style.whiteSpace = Styles.WhiteSpace.Pre }
    val gap = mason.createTextView(context, TextType.Span).apply { append("    ") }
    pre.append("[")
    pre.append(gap)
    pre.append("]")

    Assert.assertEquals("[    ]", pre.engine.applyTextIfNeeded().toString())
  }
}
