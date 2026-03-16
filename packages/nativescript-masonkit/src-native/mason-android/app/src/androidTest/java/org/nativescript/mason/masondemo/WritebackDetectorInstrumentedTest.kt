package org.nativescript.mason.masondemo

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.NativeHelpers
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
      android.util.Log.i("WritebackDetectorTest", "writeback -> id=$id w=$w h=$h")
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
      try { parentTv.compute() } catch (_: Throwable) {}
      try { Thread.sleep(150) } catch (_: InterruptedException) {}
    }

    try { Thread.sleep(1000) } catch (_: InterruptedException) {}

    Node.setComputedSizeTestCallback(null)

    val captured: List<Triple<Int, Float, Float>> = synchronized(events) { events.toList() }
    android.util.Log.i("WritebackDetectorTest", "Captured events (count=${captured.size}): $captured")

    val textEvents = mutableListOf<Triple<Int, Float, Float>>()

    Node.setComputedSizeTestCallback { id, w, h ->
      synchronized(textEvents) { textEvents.add(Triple(id, w, h)) }
    }

    val tv = mason.createTextView(appContext, org.nativescript.mason.masonkit.enums.TextType.None, false)
    val tnode = TextNode(mason, "SingleLine")
    tv.append(tnode)

    for (i in 0 until 10) {
      try { tv.compute() } catch (_: Throwable) {}
      try { Thread.sleep(100) } catch (_: InterruptedException) {}
    }

    Node.setComputedSizeTestCallback(null)
    val capturedText: List<Triple<Int, Float, Float>> = synchronized(textEvents) { textEvents.toList() }
    android.util.Log.i("WritebackDetectorTest", "Text-phase captured (count=${capturedText.size}): $capturedText")

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
    for ((id, w, h) in events) {
      try {
        val node = findNodeByObjectId(parentTv.node, id)
        if (node != null) {
          if (node.computedLayout.height == 0f && h > 0f) {
            suspicious.add(Triple(id, w, h))
          }
        }
      } catch (e: Exception) {
      }
    }

    Assert.assertTrue("Found suspicious writebacks: $suspicious", suspicious.isEmpty())

    val suspiciousText = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in capturedText) {
      try {
        val node = findNodeByObjectId(tv.node, id)
        if (node != null) {
          if (node.computedLayout.height == 0f && h > 0f) {
            suspiciousText.add(Triple(id, w, h))
          }
        }
      } catch (e: Exception) {
      }
    }

    Assert.assertTrue("Found suspicious writebacks in text phase: $suspiciousText", suspiciousText.isEmpty())
  }
}
