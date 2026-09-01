package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Every unstyled node reads one shared copy-on-write style buffer, so a style
 * write must always copy out of it first, never land in it in place.
 *
 * Style.prepareMut decides that from REF_COUNT, which is a u32 but used to be
 * compared one byte wide: once enough nodes shared the buffer for its count to
 * reach 257 (then 513, 769, ...) the low byte read back as 1, the writing node
 * believed it owned the buffer alone, and its margins landed in the copy every
 * unstyled node was still reading.
 *
 * The victims below never set a style, so their margins must stay zero no
 * matter how many siblings are created and written to alongside them. Which
 * sibling lands on a bad ref count depends on the count's increment, so this
 * writes to enough of them to sweep past at least one.
 */
@RunWith(AndroidJUnit4::class)
class SharedStyleBufferInstrumentedTest {

  @Test
  fun writingOneNodeNeverLeaksIntoNodesSharingTheDefaultBuffer() {
    val context = InstrumentationRegistry.getInstrumentation().targetContext
    val mason = Mason()
    val root = mason.createView(context)

    val victims = ArrayList<View>(VICTIM_COUNT)
    var firstLeak: String? = null

    InstrumentationRegistry.getInstrumentation().runOnMainSync {
      repeat(VICTIM_COUNT) {
        val victim = mason.createView(context)
        root.append(victim)
        victims.add(victim)
      }

      for (i in 0 until WRITER_COUNT) {
        val writer = mason.createView(context)
        root.append(writer)
        writer.style.setMargin(1f, 2f, 3f, 4f)

        if (firstLeak == null) {
          for ((v, victim) in victims.withIndex()) {
            val m = victim.style
            if (m.marginLeft.value != 0f || m.marginTop.value != 0f ||
              m.marginRight.value != 0f || m.marginBottom.value != 0f
            ) {
              firstLeak = "victim $v inherited margin from writer $i: " +
                "(${m.marginLeft.value},${m.marginTop.value}," +
                "${m.marginRight.value},${m.marginBottom.value})"
              break
            }
          }
        }
      }
    }

    Assert.assertNull(firstLeak, firstLeak)
  }

  private companion object {
    const val VICTIM_COUNT = 4
    const val WRITER_COUNT = 400
  }
}
