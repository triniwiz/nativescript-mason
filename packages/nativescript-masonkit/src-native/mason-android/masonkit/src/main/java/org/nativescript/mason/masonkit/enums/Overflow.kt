package org.nativescript.mason.masonkit.enums

enum class Overflow(val value: Byte, val cssValue: String) {
  Visible(0, "visible"), Hidden(1, "hidden"), Scroll(2, "scroll"), Clip(3, "clip"), Auto(4, "auto");

  companion object {
    fun from(value: Byte): Overflow {
      return when (value) {
        0.toByte() -> Visible
        1.toByte() -> Hidden
        2.toByte() -> Scroll
        3.toByte() -> Clip
        4.toByte() -> Auto
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
