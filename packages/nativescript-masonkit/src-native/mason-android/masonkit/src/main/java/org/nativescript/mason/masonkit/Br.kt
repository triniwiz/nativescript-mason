package org.nativescript.mason.masonkit

import android.content.Context
import android.text.BoringLayout
import android.text.Layout
import android.util.Log
import android.view.View

class Br(context: Context, mason: Mason) : Element, MeasureFunc {

  class FakeView(context: Context) : View(context)

  override val style: Style
    get() = node.style

  override var node: Node
    private set


  internal val mFake = FakeView(context)

  override val view: View
    get() {
      return mFake
    }

  init {
    node = mason.createLineBreakNode(this)

    node.view = mFake
  }

  override fun measure(
    knownWidth: Float, knownHeight: Float,
    availableWidth: Float, availableHeight: Float
  ): Long {

    var retWidth = 0f
    var retHeight = 0f

    val width = availableWidth.takeIf {
      it.isFinite() && it > 0
    }

    width?.let {
      retWidth = it
    }

    // Check if parent is a TextContainer - if so, the text layout handles the line break
    val parent = node.parent?.view
    if (parent is TextContainer) {
      // BR inside TextContainer has 0 height - the \n character handles spacing
      retHeight = 0f
    } else {
      // BR outside TextContainer needs to measure its own height
      val lineHeightType = style.resolvedLineHeightType
      val lineHeight = style.resolvedLineHeight

      if (lineHeightType == 1.toByte()) {
        retHeight = lineHeight
      } else {
        if (lineHeight > 0) {
          retHeight = lineHeight
        } else {
          val height = style.paint.textSize * 1.2f
          retHeight = height
        }
      }
    }

    return MeasureOutput.make(retWidth, retHeight)
  }
}
