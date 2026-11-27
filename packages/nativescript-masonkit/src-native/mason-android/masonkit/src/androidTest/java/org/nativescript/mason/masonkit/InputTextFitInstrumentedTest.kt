package org.nativescript.mason.masonkit

import android.content.res.Configuration
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection

@RunWith(AndroidJUnit4::class)
class InputTextFitInstrumentedTest {

  @Test
  fun theFieldHoldsItsWholeLineAtEverySystemFontScale() {
    val base = InstrumentationRegistry.getInstrumentation().targetContext
    for (systemFontScale in listOf(0.85f, 1f, 1.3f)) {
      val context = base.createConfigurationContext(
        Configuration(base.resources.configuration).apply { fontScale = systemFontScale }
      )
      for (fontSize in listOf(12f, 16f, 32f)) for (padding in listOf("0", "1 2", "8")) {
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
          val mason = Mason()
          mason.setDeviceScale(context.resources.displayMetrics.density)
          val root = mason.createView(context)
          root.style.display = Display.Flex
          root.style.flexDirection = FlexDirection.Column
          val input = Input(context, mason)
          input.configure { style ->
            style.fontSize = fontSize
            style.paddingCss = padding
          }
          input.value = "gypsy"
          root.addView(input)
          val tree = root.computeAndLayout(800f, -1f)
          root.applyLayoutFlat(root.node, tree)

          val field = input.textInput
          val metrics = field.paint.fontMetricsInt
          val case = "font scale $systemFontScale, $fontSize px, padding $padding"
          val bottom = field.baseline + metrics.descent
          assertTrue("$case: descenders end at $bottom of ${field.height}", bottom <= field.height)
          val top = field.baseline + metrics.ascent
          assertTrue("$case: ascenders start at $top", top >= 0)
        }
      }
    }
  }
}
