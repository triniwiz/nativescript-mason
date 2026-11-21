package org.nativescript.mason.masonkit

import android.os.SystemClock
import android.view.MotionEvent
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Position
import org.nativescript.mason.masonkit.events.PointerEvent
import kotlin.math.abs

/** DOM pointer events and CSS pointer-events from real MotionEvents through a windowed Mason tree. */
@RunWith(AndroidJUnit4::class)
class PointerEventsInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()

  private class Tree(val root: View, val a: View, val b: View)

  private val types = listOf(
    "pointerdown", "pointermove", "pointerup", "pointercancel", "pointerover", "pointerout",
    "pointerenter", "pointerleave", "gotpointercapture", "lostpointercapture"
  )

  private fun absolute(view: View, left: Float, top: Float, w: Float, h: Float) {
    view.style.position = Position.Absolute
    view.style.inset = Rect(
      LengthPercentageAuto.Points(top), LengthPercentageAuto.Auto,
      LengthPercentageAuto.Auto, LengthPercentageAuto.Points(left)
    )
    view.setSize(w, h)
  }

  /** root 300x400; a at (0,0) 100x100; b at (50,50) 100x100, above a. */
  private fun withTree(block: (Tree) -> Unit) {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var tree: Tree
      scenario.onActivity { activity ->
        val host = FrameLayout(activity)
        activity.setContentView(host)
        val mason = Mason()
        val root = mason.createView(activity)
        root.setSize(300f, 400f)
        val a = mason.createView(activity)
        absolute(a, 0f, 0f, 100f, 100f)
        val b = mason.createView(activity)
        absolute(b, 50f, 50f, 100f, 100f)
        root.addView(a)
        root.addView(b)
        host.addView(root, FrameLayout.LayoutParams(300, 400))
        tree = Tree(root, a, b)
      }
      instr.waitForIdleSync()
      instr.runOnMainSync {
        assertEquals(100, tree.a.width)
        assertEquals(50, tree.b.left)
      }
      block(tree)
    }
  }

  private fun name(tree: Tree, target: Any?) = when (target) {
    tree.root -> "root"
    tree.a -> "a"
    tree.b -> "b"
    null -> "null"
    else -> "?"
  }

  /** Records every pointer event reaching [on], as "type:target". */
  private fun record(tree: Tree, on: View = tree.root, log: MutableList<String> = ArrayList()): MutableList<String> {
    instr.runOnMainSync {
      for (type in types) on.addEventListener(type) { log += "${it.type}:${name(tree, it.target)}" }
    }
    return log
  }

  private var downTime = 0L

  private fun send(view: android.view.View, action: Int, x: Float, y: Float, step: Int = 0): Boolean {
    var handled = false
    instr.runOnMainSync {
      if (action == MotionEvent.ACTION_DOWN) downTime = SystemClock.uptimeMillis()
      val event = MotionEvent.obtain(downTime, downTime + step * 8L, action, x, y, 0)
      handled = view.dispatchTouchEvent(event)
      event.recycle()
    }
    return handled
  }

  @Test
  fun tapRaisesTheDomSequenceAtTheTopmostElement() = withTree { tree ->
    val log = record(tree)
    assertTrue(send(tree.root, MotionEvent.ACTION_DOWN, 75f, 75f))
    send(tree.root, MotionEvent.ACTION_MOVE, 80f, 80f, 1)
    send(tree.root, MotionEvent.ACTION_UP, 80f, 80f, 2)
    assertEquals(
      listOf(
        "pointerover:b", "pointerenter:root", "pointerdown:b", "gotpointercapture:b",
        "pointermove:b", "pointerup:b", "lostpointercapture:b", "pointerout:b", "pointerleave:root"
      ),
      log
    )
  }

  @Test
  fun touchStaysCapturedToItsTarget() = withTree { tree ->
    val log = record(tree)
    send(tree.root, MotionEvent.ACTION_DOWN, 20f, 20f)
    // Moves onto b and off both: still a's.
    send(tree.root, MotionEvent.ACTION_MOVE, 120f, 120f, 1)
    send(tree.root, MotionEvent.ACTION_MOVE, 250f, 300f, 2)
    send(tree.root, MotionEvent.ACTION_UP, 250f, 300f, 3)
    assertEquals(listOf("pointermove:a", "pointermove:a", "pointerup:a"), log.filter { it.startsWith("pointermove") || it.startsWith("pointerup") })
  }

  @Test
  fun coordinatesAreCssPixels() = withTree { tree ->
    var event: PointerEvent? = null
    instr.runOnMainSync { tree.root.addEventListener("pointerdown") { event = it as PointerEvent } }
    send(tree.root, MotionEvent.ACTION_DOWN, 75f, 90f)
    send(tree.root, MotionEvent.ACTION_UP, 75f, 90f, 1)
    val e = event!!
    val scale = tree.root.node.mason.scale
    val loc = IntArray(2)
    instr.runOnMainSync { tree.root.getLocationInWindow(loc) }
    assertEquals((loc[0] + 75f) / scale, e.clientX, 0.01f)
    assertEquals((loc[1] + 90f) / scale, e.clientY, 0.01f)
    // Relative to b, which sits at (50, 50).
    assertEquals(25f / scale, e.offsetX, 0.01f)
    assertEquals(40f / scale, e.offsetY, 0.01f)
    assertEquals("touch", e.pointerType)
    assertTrue(e.isPrimary)
    assertEquals(0, e.button)
    assertEquals(1, e.buttons)
  }

  @Test
  fun pointerEventsNoneTapsThroughToWhatIsBeneath() = withTree { tree ->
    var aClicks = 0
    var bClicks = 0
    instr.runOnMainSync {
      tree.b.node.pointerEvents = PointerEvents.NONE
      tree.a.addEventListener("click") { aClicks++ }
      tree.b.addEventListener("click") { bClicks++ }
    }
    val log = record(tree)
    // Where b overlaps a, a takes it.
    send(tree.root, MotionEvent.ACTION_DOWN, 75f, 75f)
    send(tree.root, MotionEvent.ACTION_UP, 75f, 75f, 1)
    instr.waitForIdleSync()
    assertTrue(log.contains("pointerdown:a"))
    assertEquals(1, aClicks)
    assertEquals(0, bClicks)
    instr.runOnMainSync {
      assertSame(tree.a, tree.root.elementFromPoint(75f, 75f))
      // Only b covers (125, 125): the root is beneath it.
      assertSame(tree.root, tree.root.elementFromPoint(125f, 125f))
    }
  }

  @Test
  fun anAutoChildOfANoneElementStillTakesTouches() = withTree { tree ->
    lateinit var child: View
    instr.runOnMainSync {
      val mason = tree.root.node.mason
      child = mason.createView(tree.root.context)
      absolute(child, 0f, 0f, 20f, 20f)
      tree.b.addView(child)
      tree.b.node.pointerEvents = PointerEvents.NONE
    }
    instr.waitForIdleSync()
    val bLog = record(tree, tree.b)
    send(tree.root, MotionEvent.ACTION_DOWN, 55f, 55f)
    send(tree.root, MotionEvent.ACTION_UP, 55f, 55f, 1)
    // The child's pointerdown bubbles through b.
    assertTrue(bLog.contains("pointerdown:?"))
    bLog.clear()
    send(tree.root, MotionEvent.ACTION_DOWN, 140f, 140f)
    send(tree.root, MotionEvent.ACTION_UP, 140f, 140f, 1)
    assertTrue(bLog.none { it.startsWith("pointerdown") })
  }

  @Test
  fun explicitCaptureRetargetsTheStream() = withTree { tree ->
    val log = record(tree)
    instr.runOnMainSync {
      tree.a.addEventListener("pointerdown") { tree.root.setPointerCapture((it as PointerEvent).pointerId) }
    }
    send(tree.root, MotionEvent.ACTION_DOWN, 20f, 20f)
    send(tree.root, MotionEvent.ACTION_MOVE, 30f, 30f, 1)
    send(tree.root, MotionEvent.ACTION_UP, 30f, 30f, 2)
    assertEquals(
      listOf("pointerdown:a", "gotpointercapture:root", "pointermove:root", "pointerup:root", "lostpointercapture:root"),
      log.filter { !it.startsWith("pointerover") && !it.startsWith("pointerout") && !it.contains("enter") && !it.contains("leave") }
    )
  }

  @Test
  fun scrollingCancelsThePointer() {
    ActivityScenario.launch(BenchmarkActivity::class.java).use { scenario ->
      lateinit var scroll: Scroll
      lateinit var content: View
      val log = ArrayList<String>()
      scenario.onActivity { activity ->
        val host = FrameLayout(activity)
        activity.setContentView(host)
        val mason = Mason()
        scroll = mason.createScrollView(activity)
        scroll.style.overflow = Point(Overflow.Hidden, Overflow.Scroll)
        scroll.style.setSizePoints(300f, 400f)
        content = mason.createView(activity)
        content.setSize(300f, 2000f)
        content.style.flexShrink = 0f
        scroll.addView(content)
        host.addView(scroll, FrameLayout.LayoutParams(300, 400))
        for (type in types) content.addEventListener(type) { log += it.type }
      }
      instr.waitForIdleSync()
      send(scroll, MotionEvent.ACTION_DOWN, 150f, 300f)
      for (i in 1..12) send(scroll, MotionEvent.ACTION_MOVE, 150f, 300f - i * 10f, i)
      send(scroll, MotionEvent.ACTION_UP, 150f, 180f, 13)
      instr.runOnMainSync { assertTrue(scroll.scrollY > 0) }
      val cancel = log.indexOf("pointercancel")
      assertTrue("$log", cancel > 0)
      assertTrue("$log", log.drop(cancel).none { it == "pointermove" || it == "pointerup" })
      assertTrue("$log", log.contains("pointerleave"))
    }
  }

  @Test
  fun noListenersLeaveTouchesAlone() = withTree { tree ->
    // Nothing claims the touch, so it isn't consumed.
    assertTrue(!send(tree.root, MotionEvent.ACTION_DOWN, 75f, 75f))
    send(tree.root, MotionEvent.ACTION_CANCEL, 75f, 75f, 1)
    assertTrue(abs(tree.root.node.mason.pointerListenerCount) == 0)
  }
}
