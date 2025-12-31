package org.nativescript.mason.masonkit

import android.text.TextPaint
import android.widget.TextView

interface TextContainer : StyleChangeListener {
  val engine: TextEngine
  val node: Node
  fun setText(
    text: CharSequence,
    type: TextView.BufferType
  )

  fun setTextSize(size: Float)

  fun setTextSize(unit: Int, size: Float)

  fun getPaint(): TextPaint
}

val TextContainer.style: Style
  get() {
    return node.style
  }

val TextContainer.defaultAttributes: TextDefaultAttributes
  get() {
    return node.getDefaultAttributes()
  }
