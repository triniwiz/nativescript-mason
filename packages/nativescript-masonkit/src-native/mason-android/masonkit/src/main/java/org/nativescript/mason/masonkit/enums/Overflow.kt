package org.nativescript.mason.masonkit.enums

enum class Overflow(val value: Int, val cssValue: String) {
  Visible(0, "visible"), Hidden(1, "hidden"), Scroll(2, "scroll"), Clip(3, "clip"), Auto(4, "auto");

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
