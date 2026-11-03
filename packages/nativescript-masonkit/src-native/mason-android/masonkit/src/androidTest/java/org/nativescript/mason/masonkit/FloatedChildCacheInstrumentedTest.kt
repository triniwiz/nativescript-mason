package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Float as CSSFloat

@RunWith(AndroidJUnit4::class)
class FloatedChildCacheInstrumentedTest {

  @Test
  fun followsFloatAndChildChanges() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      val parent = mason.createView(context)
      val text = mason.createTextView(context)
      text.append("Beside a float")
      val box = mason.createView(context)
      parent.append(text)
      parent.append(box)
      val node = parent.node

      assertFalse(node.hasFloatedChildBesides(text.node))

      box.style.float = CSSFloat.Left
      assertTrue(node.hasFloatedChildBesides(text.node))
      assertFalse("a float is not its own sibling", node.hasFloatedChildBesides(box.node))

      parent.removeView(box)
      assertFalse(node.hasFloatedChildBesides(text.node))

      parent.append(box)
      assertTrue(node.hasFloatedChildBesides(text.node))

      box.style.float = CSSFloat.None
      assertFalse(node.hasFloatedChildBesides(text.node))
    }
  }
}
