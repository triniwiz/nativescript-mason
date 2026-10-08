package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection

@RunWith(AndroidJUnit4::class)
class InputInstrumentedTest {

  private fun layoutInput(configure: (Input) -> Unit): Pair<Input, MasonNodeView> {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    mason.setDeviceScale(context.resources.displayMetrics.density)

    val root = mason.createView(context)
    root.style.display = Display.Flex
    root.style.flexDirection = FlexDirection.Column

    val input = Input(context, mason)
    configure(input)
    root.addView(input)

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val tree = root.computeAndLayout(400f, -1f)
      if (tree.nodeCount > 0) {
        root.applyLayoutFlat(root.node, tree)
      }
    }
    val nv = root.node.layoutTree.cursor
    nv.pointTo(1)
    return input to nv
  }

  @Test
  fun textFieldIsInsetByCssPaddingAndBorder() {
    val (input, nv) = layoutInput {
      it.configure { style ->
        style.border = "2 solid #000000"
        style.paddingCss = "10 12"
      }
    }

    val left = nv.paddingLeft.toInt() + nv.borderLeft.toInt()
    val top = nv.paddingTop.toInt() + nv.borderTop.toInt()
    val right = input.width - nv.paddingRight.toInt() - nv.borderRight.toInt()
    val bottom = input.height - nv.paddingBottom.toInt() - nv.borderBottom.toInt()

    assertTrue("padding+border must be non-zero (left=$left)", left > 0)
    assertEquals("textInput.left", left, input.textInput.left)
    assertEquals("textInput.top", top, input.textInput.top)
    assertEquals("textInput.right", right, input.textInput.right)
    assertEquals("textInput.bottom", bottom, input.textInput.bottom)
  }

  @Test
  fun defaultTextFieldKeepsUserAgentPadding() {
    val (input, nv) = layoutInput { }
    assertTrue("default padding left > 0", nv.paddingLeft > 0f)
    assertTrue("default border left > 0", nv.borderLeft > 0f)
    assertEquals(
      "textInput.left = padding + border",
      nv.paddingLeft.toInt() + nv.borderLeft.toInt(), input.textInput.left
    )
  }

  @Test
  fun textAndPasswordFieldsAreNotMonospace() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    for (type in listOf(Input.Type.Text, Input.Type.Password, Input.Type.Email)) {
      val input = Input(context, mason, type)
      assertTrue(
        "$type typeface must not be monospace",
        input.textInput.typeface !== android.graphics.Typeface.MONOSPACE
      )
    }
  }

  @Test
  fun placeholderFollowsFontSizeAndTextAlign() {
    val (input, _) = layoutInput {
      it.placeholder = "hint"
      it.configure { style ->
        style.fontSize = 24
        style.textAlign = org.nativescript.mason.masonkit.enums.TextAlign.Center
      }
    }
    val tv = input.textInput
    val density = tv.resources.displayMetrics.density
    assertEquals("hint size", 24 * density, tv.textSize, 0.5f)
    assertTrue(
      "hint centered",
      tv.gravity and android.view.Gravity.HORIZONTAL_GRAVITY_MASK == android.view.Gravity.CENTER_HORIZONTAL
    )
  }

  @Test
  fun writingBackTypedValueKeepsCaret() {
    val (input, _) = layoutInput { it.value = "ab" }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val tv = input.textInput
      tv.setSelection(2)
      tv.text.insert(2, "c")
      input.value = "abc"
      assertEquals("abc", tv.text.toString())
      assertEquals("caret stays after typed char", 3, tv.selectionStart)
    }
  }

  @Test
  fun restylingKeepsCaret() {
    val (input, _) = layoutInput { it.value = "hello" }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val tv = input.textInput
      tv.setSelection(3)
      input.configure { style -> style.fontSize = 20 }
      assertEquals("caret survives a style change", 3, tv.selectionStart)
    }
  }

  @Test
  fun placeholderUsesGrayHint() {
    val (input, _) = layoutInput { it.placeholder = "you@example.com" }
    assertEquals(0xFF757575.toInt(), input.textInput.currentHintTextColor)
  }
}
