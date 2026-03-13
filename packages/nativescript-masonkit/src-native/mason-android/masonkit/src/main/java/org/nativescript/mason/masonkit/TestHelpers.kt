package org.nativescript.mason.masonkit

import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.Float as MasonFloat

/**
 * Test helper: create a measured box node with the given size and optional float.
 */
fun makeBox(m: Mason, w: Float, h: Float, fl: MasonFloat?): Node {
  val meas = object : MeasureFunc {
    override fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float> {
      return Size(w, h)
    }
  }
  val n = m.createNode(meas)
  n.style.display = Display.Block
  if (fl != null) {
    n.style.float = fl
  }
  return n
}
