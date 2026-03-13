package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class WritebackDetectorInstrumentedTest {

  @Test
  fun captureSetComputedSizeWritebacks() {
    val appContext = InstrumentationRegistry.getInstrumentation().targetContext

    val mason = Mason()

    // Create child measured node that returns zero size
    val child = mason.createNode(object : MeasureFunc {
      override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float> {
        return Size(0f, 0f)
      }
    })

    val parent = mason.createTextNode()
    parent.appendChild(child)

    val events = mutableListOf<Triple<Int, Float, Float>>()

    // Register callback to capture every writeback
    Node.setComputedSizeTestCallback { id, w, h ->
      android.util.Log.i("WritebackDetectorTest", "writeback -> id=$id w=$w h=$h")
      synchronized(events) { events.add(Triple(id, w, h)) }
    }

    // Create more children with varied measure behaviours
    val measures = listOf<MeasureFunc>(
      object : MeasureFunc { override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>) = Size(0f, 0f) },
      object : MeasureFunc { override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>) = Size(10f, 10f) },
      object : MeasureFunc { override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>) = Size(0f, 8f) }
    )

    for (m in measures) {
      val c = mason.createNode(m)
      parent.appendChild(c)
    }

    // Fire native compute several times to increase chance of observing platform writebacks
    for (i in 0 until 5) {
      NativeHelpers.nativeNodeCompute(mason.getNativePtr(), parent.nativePtr)
      try { Thread.sleep(150) } catch (_: InterruptedException) {}
    }

    // Allow callbacks to arrive
    try { Thread.sleep(1000) } catch (_: InterruptedException) {}

    Node.setComputedSizeTestCallback(null)

    // Snapshot events
    val captured: List<Triple<Int, Float, Float>> = synchronized(events) { events.toList() }
    android.util.Log.i("WritebackDetectorTest", "Captured events (count=${captured.size}): $captured")

    // --- Phase 2: exercise platform TextEngine measurement paths ---
    val textEvents = mutableListOf<Triple<Int, Float, Float>>()

    Node.setComputedSizeTestCallback { id, w, h ->
      synchronized(textEvents) { textEvents.add(Triple(id, w, h)) }
    }

    // Create a real TextView-backed node to trigger TextEngine measurement
    val tv = mason.createTextView(appContext, org.nativescript.mason.masonkit.enums.TextType.None, false)
    val tnode = TextNode(mason, "SingleLine")
    tv.node.appendChild(tnode)

    for (i in 0 until 10) {
      NativeHelpers.nativeNodeCompute(mason.getNativePtr(), tv.node.nativePtr)
      try { Thread.sleep(100) } catch (_: InterruptedException) {}
    }

    Node.setComputedSizeTestCallback(null)
    val capturedText: List<Triple<Int, Float, Float>> = synchronized(textEvents) { textEvents.toList() }
    android.util.Log.i("WritebackDetectorTest", "Text-phase captured (count=${capturedText.size}): $capturedText")

    // Helper to find a node by object id in the parent subtree
    fun findNodeByObjectId(root: Node, targetId: Int): Node? {
      if (root.objectId() == targetId) return root
      val children = root.getChildren()
      for (c in children) {
        val found = findNodeByObjectId(c, targetId)
        if (found != null) return found
      }
      return null
    }

    // Check for suspicious writebacks where engine computed height == 0 but platform wrote a non-zero height
    val suspicious = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in events) {
      try {
        val node = findNodeByObjectId(parent, id)
        if (node != null) {
          if (node.cachedHeight == 0f && h > 0f) {
            suspicious.add(Triple(id, w, h))
          }
        }
      } catch (e: Exception) {
        // ignore lookup errors
      }
    }

    Assert.assertTrue("Found suspicious writebacks: $suspicious", suspicious.isEmpty())
    
    // Also check the TextView-driven phase for suspicious writebacks
    val suspiciousText = mutableListOf<Triple<Int, Float, Float>>()
    for ((id, w, h) in capturedText) {
      try {
        val node = findNodeByObjectId(tv.node, id)
        if (node != null) {
          if (node.cachedHeight == 0f && h > 0f) {
            suspiciousText.add(Triple(id, w, h))
          }
        }
      } catch (e: Exception) {
        // ignore lookup errors
      }
    }

    Assert.assertTrue("Found suspicious writebacks in text phase: $suspiciousText", suspiciousText.isEmpty())
  }
}
