package org.nativescript.mason.masonkit

@JvmInline
value class TextStateKeys internal constructor(val bits: Long) {
  companion object {
    val COLOR = TextStateKeys(1L shl 0)
    val DECORATION_LINE = TextStateKeys(1L shl 1)
    val DECORATION_COLOR = TextStateKeys(1L shl 2)
    val TEXT_ALIGN = TextStateKeys(1L shl 3)
    val TEXT_JUSTIFY = TextStateKeys(1L shl 4)
    val BACKGROUND_COLOR = TextStateKeys(1L shl 5)

    val SIZE = TextStateKeys(1L shl 6)
    val TRANSFORM = TextStateKeys(1L shl 7)
    val FONT_STYLE = TextStateKeys(1L shl 8)
    val FONT_STYLE_SLANT = TextStateKeys(1L shl 9)
    val TEXT_WRAP = TextStateKeys(1L shl 10)
    val WHITE_SPACE = TextStateKeys(1L shl 11)
    val TEXT_OVERFLOW = TextStateKeys(1L shl 12)
    val DECORATION_STYLE = TextStateKeys(1L shl 13)
  }

  infix fun or(other: TextStateKeys): TextStateKeys = TextStateKeys(bits or other.bits)
  infix fun and(other: TextStateKeys): TextStateKeys = TextStateKeys(bits and other.bits)
  infix fun hasFlag(flag: TextStateKeys): Boolean = (bits and flag.bits) != 0L
}
