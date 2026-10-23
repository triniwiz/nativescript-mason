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
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class FlexTextAlignmentInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  private fun inkColumns(configure: TextView.() -> Unit): Pair<Int, Int> {
    val mason = Mason()
    val text = mason.createTextView(context, TextType.Span).apply {
      append("AB")
      node.style.setSizeWidth(200f, Dimension.Kind.Points.value)
      node.style.setSizeHeight(60f, Dimension.Kind.Points.value)
      configure()
    }
    NativeHelpers.nativeNodeComputeWithSizeAndLayout(mason.nativePtr, text.node.nativePtr, 1000f, -1f)
    text.measure(MeasureSpec.makeMeasureSpec(200, MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(60, MeasureSpec.EXACTLY))
    text.layout(0, 0, 200, 60)
    val bitmap = Bitmap.createBitmap(200, 60, Bitmap.Config.ARGB_8888)
    Canvas(bitmap).apply { drawColor(Color.WHITE); text.draw(this) }
    var left = -1
    var right = -1
    for (x in 0 until 200) for (y in 0 until 60) {
      val p = bitmap.getPixel(x, y)
      if (Color.red(p) < 100 && Color.green(p) < 100 && Color.blue(p) < 100) {
        if (left < 0) left = x
        right = x
        break
      }
    }
    return left to right
  }

  private fun assertCentred(columns: Pair<Int, Int>) {
    val (left, right) = columns
    Assert.assertTrue("text is drawn", left >= 0)
    Assert.assertTrue("text spans $left..$right, so it is not centred in 0..199", kotlin.math.abs(left - (199 - right)) <= 3)
  }

  @Test
  fun justifyContentCentresTheTextOfARow() {
    assertCentred(inkColumns {
      node.style.display = Display.Flex
      node.style.justifyContent = JustifyContent.Center
      node.style.alignItems = AlignItems.Center
    })
  }

  @Test
  fun alignItemsCentresTheTextOfAColumn() {
    assertCentred(inkColumns {
      node.style.display = Display.Flex
      node.style.flexDirection = FlexDirection.Column
      node.style.alignItems = AlignItems.Center
    })
  }

  @Test
  fun centredNowrapTextStaysInTheBox() {
    for (whiteSpace in listOf(Styles.WhiteSpace.NoWrap, Styles.WhiteSpace.Pre)) {
      assertCentred(inkColumns {
        node.style.display = Display.Flex
        node.style.justifyContent = JustifyContent.Center
        node.style.textAlign = TextAlign.Center
        node.style.whiteSpace = whiteSpace
      })
    }
  }

  @Test
  fun aBlockKeepsItsTextAtTheStart() {
    val (left, _) = inkColumns { node.style.display = Display.Block }
    Assert.assertTrue("block text starts at the left, at $left", left in 0..6)
  }
}
