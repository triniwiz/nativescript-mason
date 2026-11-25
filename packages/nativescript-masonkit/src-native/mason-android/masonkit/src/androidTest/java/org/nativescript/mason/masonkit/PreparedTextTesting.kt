package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View.MeasureSpec

internal fun <T> withPreparedText(on: Boolean, block: () -> T): T {
  val was = PreparedText.enabled
  PreparedText.enabled = on
  try {
    return block()
  } finally {
    PreparedText.enabled = was
  }
}

internal fun layOutAndDraw(root: Element, width: Int): Bitmap {
  val tree = root.computeAndLayout(width.toFloat(), -1f)
  if (tree.nodeCount > 0) root.applyLayoutFlat(root.node, tree)
  val view = root.view
  val height = maxOf(root.node.computedHeight.toInt(), 1)
  view.measure(
    MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
    MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
  )
  view.layout(0, 0, width, height)
  return drawn(root)
}

internal fun drawn(root: Element): Bitmap {
  val view = root.view
  return Bitmap.createBitmap(maxOf(view.width, 1), maxOf(view.height, 1), Bitmap.Config.ARGB_8888)
    .also { view.draw(Canvas(it)) }
}

internal fun Node.size() = "${computedWidth}x${computedHeight}"
