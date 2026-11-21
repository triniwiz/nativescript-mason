package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View.MeasureSpec
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.TextType

/**
 * JavaScript attaches a view's children before its CSS reaches native. The tree it ends with
 * must match the one built when the view's display was known at every append.
 */
@RunWith(AndroidJUnit4::class)
class DeferredInlineRunsInstrumentedTest {
  private val instr = InstrumentationRegistry.getInstrumentation()
  private val context = instr.targetContext
  private val mason get() = Mason.shared

  private fun span(text: String) = mason.createTextViewWithSlot(context, TextType.Span, text)

  /** Writes [display] into each slot buffer as JavaScript does, then flushes one sync queue. */
  private fun syncDisplays(vararg writes: Pair<Element, Display>) {
    val words = (StateKeys.DISPLAY.low or StateKeys.DISPLAY_MODE.low) to
      (StateKeys.DISPLAY.high or StateKeys.DISPLAY_MODE.high)
    writes.forEachIndexed { i, (element, display) ->
      val (base, mode) = when (display) {
        Display.Inline -> Display.Block.value to 1.toByte()
        Display.InlineBlock -> Display.Block.value to 2.toByte()
        else -> display.value to 0.toByte()
      }
      assertTrue("a slot buffer, not a shared default", element.style.slot >= 0)
      element.style.values.put(StyleKeys.DISPLAY, base)
      element.style.values.put(StyleKeys.DISPLAY_MODE, mode)
      val at = i * 5 * 4
      mason.syncQueue.putInt(at, element.style.slot)
      mason.syncQueue.putInt(at + 4, words.first.toInt())
      mason.syncQueue.putInt(at + 8, (words.first ushr 32).toInt())
      mason.syncQueue.putInt(at + 12, words.second.toInt())
      mason.syncQueue.putInt(at + 16, (words.second ushr 32).toInt())
    }
    mason.syncStyleSlots(writes.size)
  }

  private fun view() = mason.createViewWithSlot(context)

  private fun shape(node: Node): String = node.children.joinToString(",", "[", "]") { child ->
    when {
      child.isAnonymous -> "anon(${child.style.display})" + shape(child)
      child is TextNode -> "'${child.data}'"
      child.view is TextView -> "span'${(child.view as TextView).textContent}'"
      else -> "view" + shape(child)
    }
  }

  private fun anonymousNodes(node: Node): Int =
    node.children.count { it.isAnonymous } + node.children.sumOf { anonymousNodes(it) }

  private class Rendered(val shape: String, val androidChildren: Int, val layout: Layout, val pixels: Bitmap)

  private fun render(root: View): Rendered {
    root.measure(
      MeasureSpec.makeMeasureSpec(400, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    val height = maxOf(root.measuredHeight, 1)
    root.layout(0, 0, 400, height)
    val pixels = Bitmap.createBitmap(400, height, Bitmap.Config.ARGB_8888)
    root.draw(Canvas(pixels))
    return Rendered(shape(root.node), root.childCount, root.layout(), pixels)
  }

  /**
   * Builds the same tree twice and renders both. [build] reports each view's display through
   * its callback: the first tree gets those displays as JavaScript sends them, in one sync after
   * every append (none at all when [syncAfterAppends] is false); the second gets each display
   * as soon as its view exists.
   */
  private fun compare(
    syncAfterAppends: Boolean = true,
    build: (display: (Element, Display) -> Unit) -> View,
  ): Rendered {
    lateinit var jsRoot: View
    lateinit var knownRoot: View
    instr.runOnMainSync {
      val pending = mutableListOf<Pair<Element, Display>>()
      jsRoot = build { element, display -> pending.add(element to display) }
      if (syncAfterAppends && pending.isNotEmpty()) syncDisplays(*pending.toTypedArray())
      knownRoot = build { element, display -> syncDisplays(element to display) }
    }
    // Removed views leave their group in a batch posted to the main thread.
    instr.waitForIdleSync()
    var deferred: Rendered? = null
    var known: Rendered? = null
    instr.runOnMainSync {
      deferred = render(jsRoot)
      known = render(knownRoot)
    }
    val d = deferred!!
    val k = known!!
    assertEquals(k.shape, d.shape)
    assertEquals(k.androidChildren, d.androidChildren)
    assertEquals(k.layout, d.layout)
    val ink = IntArray(d.pixels.width * d.pixels.height).also {
      d.pixels.getPixels(it, 0, d.pixels.width, 0, 0, d.pixels.width, d.pixels.height)
    }
    assertTrue("the text drew", ink.any { it != 0 })
    assertTrue("same pixels", k.pixels.sameAs(d.pixels))
    return d
  }

  @Test
  fun flexParentNeverBuildsAnInlineRun() {
    var afterAppend = ""
    var afterSync = ""
    val androidChildren = IntArray(2)
    instr.runOnMainSync {
      val parent = view()
      parent.addView(span("one"))
      parent.addView(span("two"))
      afterAppend = shape(parent.node)
      androidChildren[0] = parent.childCount
      syncDisplays(parent to Display.Flex)
      afterSync = shape(parent.node)
      androidChildren[1] = parent.childCount
    }
    assertEquals("[span'one',span'two']", afterAppend)
    assertEquals("[span'one',span'two']", afterSync)
    assertEquals(listOf(2, 2), androidChildren.toList())
  }

  @Test
  fun flexParentMatchesTheKnownDisplayTree() {
    val rendered = compare { display ->
      view().apply {
        display(this, Display.Flex)
        addView(span("one"))
        addView(span("two"))
      }
    }
    assertEquals("[span'one',span'two']", rendered.shape)
  }

  @Test
  fun blockParentGroupsItsTextAtTheFirstSync() {
    var afterAppend = ""
    var afterSync = ""
    instr.runOnMainSync {
      val parent = view()
      parent.addView(span("one "))
      parent.addView(span("two"))
      afterAppend = shape(parent.node)
      syncDisplays(parent to Display.Block)
      afterSync = shape(parent.node)
    }
    assertEquals("[span'one ',span'two']", afterAppend)
    assertEquals("[anon(Block)[span'one ',span'two']]", afterSync)
  }

  @Test
  fun blockParentMatchesTheKnownDisplayTree() {
    val rendered = compare { display ->
      view().apply {
        display(this, Display.Block)
        addView(span("one "))
        addView(span("two"))
      }
    }
    assertEquals("[anon(Block)[span'one ',span'two']]", rendered.shape)
  }

  @Test
  fun parentWithoutAnySyncIsGroupedBeforeItsFirstLayout() {
    var beforeLayout = ""
    instr.runOnMainSync {
      val parent = view()
      parent.addView(span("one "))
      parent.addView(span("two"))
      parent.measure(
        MeasureSpec.makeMeasureSpec(400, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      )
      beforeLayout = shape(parent.node)
    }
    assertEquals("[anon(Block)[span'one ',span'two']]", beforeLayout)

    compare(syncAfterAppends = false) { display ->
      view().apply {
        display(this, Display.Block)
        addView(span("one "))
        addView(span("two"))
      }
    }
  }

  @Test
  fun insertAtAnIndexBeforeTheFirstSync() {
    for (parentDisplay in listOf(Display.Block, Display.Flex)) {
      compare { display ->
        view().apply {
          display(this, parentDisplay)
          addView(span("one "))
          addView(span("three"))
          addView(span("two "), 1)
          addView(view(), 0)
        }
      }
    }
  }

  @Test
  fun removeBeforeTheFirstSync() {
    for (parentDisplay in listOf(Display.Block, Display.Flex)) {
      val rendered = compare { display ->
        view().apply {
          display(this, parentDisplay)
          val gone = span("gone")
          addView(span("one "))
          addView(gone)
          addView(span("two"))
          removeView(gone)
        }
      }
      assertFalse(rendered.shape.contains("gone"))
    }
  }

  @Test
  fun childThatIsItselfWaitingForItsStyle() {
    for (parentDisplay in listOf(Display.Block, Display.Flex)) {
      compare { display ->
        view().apply {
          display(this, parentDisplay)
          val inner = view()
          display(inner, Display.InlineBlock)
          inner.addView(span("inner a "))
          inner.addView(span("inner b"))
          addView(span("before "))
          addView(inner)
          addView(span(" after"))
        }
      }
    }
  }

  @Test
  fun hiddenChildBetweenInlineText() {
    for (parentDisplay in listOf(Display.Block, Display.Flex)) {
      compare { display ->
        view().apply {
          display(this, parentDisplay)
          val hidden = span("hidden")
          display(hidden, Display.None)
          addView(span("one "))
          addView(hidden)
          addView(span("two"))
        }
      }
    }
  }

  @Test
  fun rawTextChildrenBesideElements() {
    for (parentDisplay in listOf(Display.Block, Display.Flex)) {
      compare { display ->
        view().apply {
          display(this, parentDisplay)
          append("raw ")
          addView(span("span"))
          append(" tail")
        }
      }
    }
  }

  @Test
  fun kotlinCreatedViewsStillGroupAtAppend() {
    var shape = ""
    var anonymous = 0
    instr.runOnMainSync {
      val parent = mason.createView(context)
      parent.addView(span("one "))
      parent.addView(span("two"))
      shape = shape(parent.node)
      anonymous = anonymousNodes(parent.node)
    }
    assertEquals("[anon(Block)[span'one ',span'two']]", shape)
    assertEquals(1, anonymous)
  }
}
