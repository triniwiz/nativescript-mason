package org.nativescript.mason.masonkit

import android.content.Context
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.TextType

@RunWith(AndroidJUnit4::class)
class TextWrapWidthMeasureCacheInstrumentedTest {
  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  private class CountingTextView(context: Context, mason: Mason) : TextView(context, mason, TextType.None) {
    var measures = 0

    override fun measure(knownWidth: Float, knownHeight: Float, availableWidth: Float, availableHeight: Float): Long {
      measures++
      return super.measure(knownWidth, knownHeight, availableWidth, availableHeight)
    }
  }

  private class Scene(private val root: View, private val nodes: List<Node>, val measures: () -> Int) {
    fun layout(width: Float): List<Float> {
      root.style.setSizeWidth(width, Dimension.Kind.Points.value)
      InstrumentationRegistry.getInstrumentation().runOnMainSync {
        val tree = root.computeAndLayout(width, -1f)
        if (tree.nodeCount > 0) root.applyLayoutFlat(root.node, tree)
      }
      return nodes.flatMap { listOf(it.computedX, it.computedY, it.computedWidth, it.computedHeight) }
    }
  }

  private fun row(blockText: Boolean = false, withInlineBlock: Boolean = false): Scene {
    val mason = Mason()
    val row = mason.createView(context).apply { style.display = Display.Flex }
    val text = CountingTextView(context, mason).apply {
      textContent = SENTENCE
      if (blockText) style.display = Display.Block
    }
    val nodes = mutableListOf(row.node, text.node)
    row.addView(text)
    if (withInlineBlock) {
      val box = mason.createView(context).apply {
        style.display = Display.InlineBlock
        style.setSizeWidth(24f, Dimension.Kind.Points.value)
        style.setSizeHeight(12f, Dimension.Kind.Points.value)
      }
      text.addView(box)
      nodes += box.node
    }
    return Scene(row, nodes) { text.measures }
  }

  private fun shrinkWrappingColumn(mason: Mason) = mason.createView(context).apply {
    style.display = Display.Flex
    style.flexDirection = FlexDirection.Column
    style.alignItems = AlignItems.FlexStart
  }

  private fun Style.noWrapWithPercentIndent() {
    whiteSpace = Styles.WhiteSpace.NoWrap
    textIndent = "100%"
  }

  private fun assertMeasuresOncePerWrapWidth(newScene: () -> Scene) {
    val scene = newScene()
    scene.layout(300.25f)
    val measures = scene.measures()
    assertTrue("the text was measured", measures > 0)

    val boxes = scene.layout(300.5f)
    assertEquals("JVM measures after widening the row from 300.25 to 300.5 px", measures, scene.measures())
    assertEquals("boxes against a fresh 300.5 px layout", newScene().layout(300.5f), boxes)

    val nextBoxes = scene.layout(301.5f)
    assertTrue("the next wrap width measures again", scene.measures() > measures)
    assertEquals("boxes against a fresh 301.5 px layout", newScene().layout(301.5f), nextBoxes)
  }

  private fun assertMeasuresAtEveryWidth(newScene: () -> Scene) {
    val scene = newScene()
    val boxes = scene.layout(300.25f)
    val measures = scene.measures()
    assertTrue("the text was measured", measures > 0)

    val nextBoxes = scene.layout(301f)
    assertEquals("boxes against a fresh 301 px layout", newScene().layout(301f), nextBoxes)
    assertNotEquals("the measure answers 300.25 and 301 px differently", boxes, nextBoxes)
    assertTrue("the text measures again at 301 px", scene.measures() > measures)
  }

  @Test
  fun aTextInAFlexRowMeasuresOncePerWrapWidth() = assertMeasuresOncePerWrapWidth { row() }

  @Test
  fun aBlockTextInAFlexRowMeasuresOncePerWrapWidth() = assertMeasuresOncePerWrapWidth { row(blockText = true) }

  @Test
  fun aTextAroundAnInlineBlockMeasuresOncePerWrapWidth() = assertMeasuresOncePerWrapWidth { row(withInlineBlock = true) }

  @Test
  fun aNoWrapTextWithAPercentageIndentMeasuresAtEveryWidth() = assertMeasuresAtEveryWidth {
    val mason = Mason()
    val column = shrinkWrappingColumn(mason)
    val text = CountingTextView(context, mason).apply {
      textContent = SENTENCE
      style.display = Display.Block
      style.noWrapWithPercentIndent()
    }
    column.addView(text)
    Scene(column, listOf(text.node)) { text.measures }
  }

  @Test
  fun aTextInheritingAPercentageIndentThroughAnAnonymousRunMeasuresAtEveryWidth() = assertMeasuresAtEveryWidth {
    val mason = Mason()
    val block = mason.createView(context).apply {
      style.display = Display.Block
      style.noWrapWithPercentIndent()
    }
    val text = CountingTextView(context, mason).apply {
      textContent = SENTENCE
      style.display = Display.InlineBlock
    }
    block.addView(text)
    assertTrue("the text is in an anonymous run", text.node.layoutParent!!.isAnonymous)
    Scene(block, listOf(text.node)) { text.measures }
  }

  private fun customMeasure(createMeasuredNode: (Mason, MeasureFunc) -> Node): Scene {
    val mason = Mason()
    val column = shrinkWrappingColumn(mason)
    var measures = 0
    val node = createMeasuredNode(mason, object : MeasureFunc {
      override fun measure(knownWidth: Float, knownHeight: Float, availableWidth: Float, availableHeight: Float): Long {
        measures++
        val width = when {
          knownWidth > 0f -> knownWidth
          availableWidth > 0f -> availableWidth
          else -> CUSTOM_INTRINSIC_WIDTH
        }
        return MeasureOutput.make(width, 10f)
      }
    })
    column.node.appendChild(node)
    return Scene(column, listOf(node)) { measures }
  }

  @Test
  fun aTextNodeWithACustomMeasureMeasuresAtEveryWidth() =
    assertMeasuresAtEveryWidth { customMeasure { mason, measure -> mason.createTextNode(measure) } }

  @Test
  fun aButtonNodeWithACustomMeasureMeasuresAtEveryWidth() =
    assertMeasuresAtEveryWidth { customMeasure { mason, measure -> mason.createButtonNode(measure) } }

  private companion object {
    const val SENTENCE =
      "The quick brown fox jumps over the lazy dog while the layout engine measures every line of this paragraph"
    const val CUSTOM_INTRINSIC_WIDTH = 1000f
  }
}
