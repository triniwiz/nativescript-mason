package org.nativescript.mason.masonkit.enums

enum class Overflow(val value: Int) {
  Visible(0), Hidden(1), Scroll(2), Clip(3), Auto(4);

  val cssValue: String
    get() {
      return when (this) {
        Visible -> "visible"
        Hidden -> "hidden"
        Scroll -> "scroll"
        Clip -> "clip"
        Auto -> "auto"
      }
    }

  companion object {
    fun fromInt(value: Int): Overflow {
      return when (value) {
        0 -> Visible
        1 -> Hidden
        2 -> Scroll
        3 -> Clip
        4 -> Auto
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
