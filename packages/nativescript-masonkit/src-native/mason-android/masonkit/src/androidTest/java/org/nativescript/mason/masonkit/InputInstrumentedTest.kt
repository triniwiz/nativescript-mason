package org.nativescript.mason.masonkit

import android.content.res.Configuration
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
  fun checkedSurvivesTypeChangeAndTracksTheUser() {
    val (input, _) = layoutInput { }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      input.checked = true
      input.type = Input.Type.Checkbox
      assertTrue("checkbox shows checked set before the type", input.checkBoxInput.isChecked)

      input.checkBoxInput.performClick()
      assertEquals("a tap updates checked", false, input.checked)
      assertEquals("value stays the submitted string", "on", input.value)
    }
  }

  @Test
  fun settingCheckedFromCodeFiresNoInputEvent() {
    val (input, _) = layoutInput { it.type = Input.Type.Checkbox }
    var inputs = 0
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      input.addEventListener("input") { inputs++ }
      input.checked = true
      input.checked = false
      assertEquals("programmatic sets", 0, inputs)

      input.checkBoxInput.performClick()
      assertEquals("a user tap", 1, inputs)
    }
  }

  @Test
  fun radioFiresInputWhenChecked() {
    val (input, _) = layoutInput { it.type = Input.Type.Radio }
    val events = mutableListOf<String>()
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      input.addEventListener("input") { events += "input" }
      input.addEventListener("change") { events += "change" }
      input.radioInput.performClick()
      assertEquals(listOf("input", "change"), events)
      assertTrue(input.checked)
    }
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
  fun placeholderUsesSystemColorForLightAndDark() {
    val (input, _) = layoutInput {
      it.placeholder = "you@example.com"
      it.configure { style -> style.color = 0xFFFF0000.toInt() }
    }
    val light = 0x4D3C3C43
    val dark = 0x4DEBEBF5
    val night = input.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    assertEquals(
      "matches the current mode, not the text color",
      if (night == Configuration.UI_MODE_NIGHT_YES) dark else light,
      input.textInput.currentHintTextColor
    )

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      fun switchTo(mode: Int) = input.dispatchConfigurationChanged(
        Configuration(input.resources.configuration).apply {
          uiMode = (uiMode and Configuration.UI_MODE_NIGHT_MASK.inv()) or mode
        }
      )
      switchTo(Configuration.UI_MODE_NIGHT_YES)
      assertEquals("dark", dark, input.textInput.currentHintTextColor)
      switchTo(Configuration.UI_MODE_NIGHT_NO)
      assertEquals("light", light, input.textInput.currentHintTextColor)
    }
  }

  private fun relayout(input: Input): MasonNodeView {
    val root = input.parent as View
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      root.applyLayoutFlat(root.node, root.computeAndLayout(400f, -1f))
    }
    return root.node.layoutTree.cursor.also { it.pointTo(1) }
  }

  @Test
  fun nonTextTypesGetNoUserAgentPadding() {
    for (type in listOf(Input.Type.Checkbox, Input.Type.Radio, Input.Type.Range, Input.Type.Date)) {
      val (input, nv) = layoutInput { it.type = type }
      assertEquals("$type padding", 0f, nv.paddingLeft)
      assertEquals("$type border", 0f, nv.borderLeft)
      val widget = input.getChildAt(0)
      assertEquals("$type widget is not inset", 0, widget.left)
    }
  }

  @Test
  fun switchingBetweenTextTypesKeepsAuthorPadding() {
    val (input, before) = layoutInput {
      it.configure { style -> style.paddingCss = "8 12" }
    }
    val authorPadding = before.paddingLeft
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      input.value = "secret"
      input.type = Input.Type.Password
    }
    val after = relayout(input)
    assertEquals("padding survives text -> password", authorPadding, after.paddingLeft)
    assertEquals("text survives text -> password", "secret", input.value)
  }

  @Test
  fun checkboxValueIsHeldApartFromChecked() {
    val (input, _) = layoutInput { it.type = Input.Type.Checkbox }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      assertEquals("default value", "on", input.value)
      input.checked = true
      input.value = "yes"
      assertTrue("setting value leaves checked alone", input.checked)
      assertEquals("yes", input.value)
    }
  }

  @Test
  fun paddingChangeWithAnUnchangedFrameReinsetsTheField() {
    val (input, _) = layoutInput {
      it.configure { style ->
        style.size = Size(Dimension.Points(300f), Dimension.Points(60f))
        style.paddingCss = "4"
      }
    }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      input.configure { style -> style.paddingCss = "10" }
    }
    val nv = relayout(input)
    assertEquals("frame unchanged", 300, input.width)
    assertEquals("field follows the new padding", (nv.paddingLeft + nv.borderLeft).toInt(), input.textInput.left)
  }

  @Test
  fun insetNeverGoesNegative() {
    val (input, _) = layoutInput {
      it.configure { style ->
        style.size = Size(Dimension.Points(10f), Dimension.Points(10f))
        style.paddingCss = "20"
      }
    }
    assertTrue("width ${input.textInput.width}", input.textInput.width >= 0)
    assertTrue("height ${input.textInput.height}", input.textInput.height >= 0)
  }

  @Test
  fun newValueFromCodePutsTheCaretAtTheEnd() {
    val (input, _) = layoutInput { it.value = "hello" }
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      input.textInput.setSelection(2)
      input.value = "goodbye world"
      assertEquals(13, input.textInput.selectionStart)
    }
  }
}
