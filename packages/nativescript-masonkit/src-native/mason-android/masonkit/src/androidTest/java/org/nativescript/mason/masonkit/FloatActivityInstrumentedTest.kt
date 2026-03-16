package org.nativescript.mason.masonkit

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*

import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.Float as MasonFloat

@RunWith(AndroidJUnit4::class)
class FloatActivityInstrumentedTest {
  @Test
  fun reproduceFloatActivity() {
    val mason = Mason()

    val root = mason.createNode()
    root.style.display = Display.Block
    root.style.size = Size(Dimension.Points(300f), Dimension.Auto)

    val card = mason.createNode()
    card.style.display = Display.Block

    // left float (68x68)
    val drop = makeBox(mason, 68f, 68f, MasonFloat.Left)
    card.appendChild(drop)

    // prose following (200x20)
    val prose = makeBox(mason, 200f, 20f, null)
    card.appendChild(prose)

    root.appendChild(card)

    NativeHelpers.nativeNodeComputeWH(mason.getNativePtr(), root.nativePtr, 300f, Float.NaN)

    val rects = NativeHelpers.nativeNodeGetFloatRects(mason.getNativePtr(), root.nativePtr)
    assertTrue(rects.isNotEmpty())
    assertEquals(68f, rects[2], 0.001f)
  }
}
