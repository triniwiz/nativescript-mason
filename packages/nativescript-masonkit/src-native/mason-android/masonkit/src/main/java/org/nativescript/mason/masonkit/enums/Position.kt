package org.nativescript.mason.masonkit.enums

enum class Position(val value: Byte) {
  Static(0), Relative(1), Absolute(2), Fixed(3), Sticky(4);

  val cssValue: String
    get() {
      return when (this) {
        Static -> "static"
        Relative -> "relative"
        Absolute -> "absolute"
        Fixed -> "fixed"
        Sticky -> "sticky"
      }
    }

  companion object {
    fun from(value: Byte): Position {
      return when (value) {
        0.toByte() -> Static
        1.toByte() -> Relative
        2.toByte() -> Absolute
        3.toByte() -> Fixed
        4.toByte() -> Sticky
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
