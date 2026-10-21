package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ViewportStyleInstrumentedTest {

  @Test
  fun viewportUnitText() {
    Assert.assertTrue(HTMLParser.hasViewportUnit("50vw"))
    Assert.assertTrue(HTMLParser.hasViewportUnit("calc(100vh - 10px)"))
    Assert.assertTrue(HTMLParser.hasViewportUnit("1px solid red, 2.5VMIN"))
    Assert.assertFalse(HTMLParser.hasViewportUnit("10px"))
    Assert.assertFalse(HTMLParser.hasViewportUnit("url(vw.png)"))
  }

  @Test
  fun innerHTMLViewportUnitsFollowResize() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason.shared
    val oldWidth = mason.viewportWidth
    val oldHeight = mason.viewportHeight
    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      try {
        mason.setViewport(400f, 800f)
        val root = mason.createView(context)
        root.innerHTML = "<div style=\"width: 50vw; height: 10vh\"></div>"
        val child = root.getChildAt(0) as Element
        val scale = mason.scale
        Assert.assertEquals(Dimension.Points(200f * scale), child.style.size.width)
        Assert.assertEquals(Dimension.Points(80f * scale), child.style.size.height)

        mason.setViewport(800f, 400f)
        Assert.assertEquals(Dimension.Points(400f * scale), child.style.size.width)
        Assert.assertEquals(Dimension.Points(40f * scale), child.style.size.height)
      } finally {
        mason.setViewport(oldWidth, oldHeight)
      }
    }
  }
}
