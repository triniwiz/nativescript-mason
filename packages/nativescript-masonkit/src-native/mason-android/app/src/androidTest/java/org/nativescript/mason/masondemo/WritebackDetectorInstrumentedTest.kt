package org.nativescript.mason.masondemo

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Node
import org.nativescript.mason.masonkit.MeasureFunc
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextNode

@RunWith(AndroidJUnit4::class)
class WritebackDetectorInstrumentedTest {

  @Test
  fun captureSetComputedSizeWritebacks() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext

    val mason = Mason()

    val child = mason.createNode(object : MeasureFunc {
      override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float> {
        return Size(0f, 0f)
      }
    })

    val parentTv = mason.createTextView(appContext, org.nativescript.mason.masonkit.enums.TextType.None)
    parentTv.append(child)

    val events = mutableListOf<Triple<Int, Float, Float>>()

    Node.setComputedSizeTestCallback { id, w, h ->
      synchronized(events) { events.add(Triple(id, w, h)) }
    }

    val measures = listOf<MeasureFunc>(
      object : MeasureFunc { override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>) = Size(0f, 0f) },
      object : MeasureFunc { override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>) = Size(10f, 10f) },
      object : MeasureFunc { override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>) = Size(0f, 8f) }
    )

    for (m in measures) {
      val c = mason.createNode(m)
      parentTv.node.parent?.appendChild(c)
    }

    for (i in 0 until 5) {
      parentTv.computeAndLayout(400f, -1f)
      Thread.sleep(150)
    }

    Thread.sleep(1000)

    Node.setComputedSizeTestCallback(null)

    val captured: List<Triple<Int, Float, Float>> = synchronized(events) { events.toList() }

    val textEvents = mutableListOf<Triple<Int, Float, Float>>()

    Node.setComputedSizeTestCallback { id, w, h ->
      synchronized(textEvents) { textEvents.add(Triple(id, w, h)) }
    }

    val tv = mason.createTextView(appContext, org.nativescript.mason.masonkit.enums.TextType.None, false)
    val tnode = TextNode(mason, "SingleLine")
    tv.append(tnode)

    for (i in 0 until 10) {
      tv.computeAndLayout(400f, -1f)
      Thread.sleep(100)
    }

    Node.setComputedSizeTestCallback(null)
    val capturedText: List<Triple<Int, Float, Float>> = synchronized(textEvents) { textEvents.toList() }

    fun findNodeByObjectId(root: org.nativescript.mason.masonkit.Node, targetId: Int): org.nativescript.mason.masonkit.Node? {
      if (root.objectId() == targetId) return root
      val children = root.getChildren()
      for (c in children) {
        val found = findNodeByObjectId(c, targetId)
        if (found != null) return found
      }
      return null
    }

    val suspicious = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in captured) {
      val node = findNodeByObjectId(parentTv.node, id)
      if (node != null && node.computedLayout.height == 0f && h > 0f) {
        suspicious.add(Triple(id, w, h))
      }
    }

    Assert.assertTrue("Found suspicious writebacks: $suspicious", suspicious.isEmpty())

    val suspiciousText = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in capturedText) {
      val node = findNodeByObjectId(tv.node, id)
      if (node != null && node.computedLayout.height == 0f && h > 0f) {
        suspiciousText.add(Triple(id, w, h))
      }
    }

    Assert.assertTrue("Found suspicious writebacks in text phase: $suspiciousText", suspiciousText.isEmpty())
  }
}
