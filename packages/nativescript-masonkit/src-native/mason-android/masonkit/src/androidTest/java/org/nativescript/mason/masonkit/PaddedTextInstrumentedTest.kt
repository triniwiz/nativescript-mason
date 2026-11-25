package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class PaddedTextInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  private enum class OwnWidth { Auto, Px, Percent }

  private val containers = listOf<Pair<String, (Style) -> Unit>>(
    "block" to { it.display = Display.Block },
    "row" to { it.display = Display.Flex; it.flexDirection = FlexDirection.Row },
    "column" to { it.display = Display.Flex; it.flexDirection = FlexDirection.Column },
    "grid" to { it.display = Display.Grid },
  )

  private fun textHeight(
    container: (Style) -> Unit,
    containerWidth: Float,
    ownWidth: OwnWidth,
    padding: Float,
    boxSizing: BoxSizing,
  ): Float {
    val mason = Mason()
    val box = mason.createView(context).apply {
      container(style)
      style.setSizeWidth(containerWidth, Dimension.Kind.Points.value)
    }
    val text = TextView(context, mason, TextType.None).apply {
      textContent = "Padded text with a width of its own that wraps onto a few lines in its box"
      style.display = Display.Block
      style.boxSizing = boxSizing
      setTextSize(15f)
      when (ownWidth) {
        OwnWidth.Auto -> {}
        OwnWidth.Px -> {
          val content = containerWidth - if (boxSizing == BoxSizing.ContentBox) 2 * padding else 0f
          style.setSizeWidth(content, Dimension.Kind.Points.value)
        }
        OwnWidth.Percent -> style.setSizeWidth(1f, Dimension.Kind.Percent.value)
      }
      style.setPadding(padding, 0f, padding, 0f)
    }
    box.addView(text)
    val root = mason.createView(context).apply { addView(box) }
    root.applyLayoutFlat(root.node, root.computeAndLayout(1000f, -1f))
    return text.node.computedHeight
  }

  private fun assertPaddedTextIsAsTallAsTextAtItsContentWidth() {
    val unpadded = { width: Float ->
      textHeight(containers[0].second, width, OwnWidth.Auto, 0f, BoxSizing.BorderBox)
    }
    val mismatches = mutableListOf<String>()
    for ((name, container) in containers) {
      for (own in OwnWidth.values()) for (sizing in listOf(BoxSizing.BorderBox, BoxSizing.ContentBox)) {
        // A percentage of a content box would be wider than its container.
        if (own == OwnWidth.Percent && sizing == BoxSizing.ContentBox) continue
        val height = textHeight(container, 400f, own, 40f, sizing)
        val expected = unpadded(320f)
        if (height != expected) mismatches += "$name, $own, $sizing: $height, expected $expected"
      }
    }
    assertEquals(emptyList<String>(), mismatches)
  }

  @Test
  fun preparedPaddedTextIsAsTallAsTextAtItsContentWidth() =
    withPreparedText(true) { assertPaddedTextIsAsTallAsTextAtItsContentWidth() }

  @Test
  fun paddedTextIsAsTallAsTextAtItsContentWidth() =
    withPreparedText(false) { assertPaddedTextIsAsTallAsTextAtItsContentWidth() }
}
