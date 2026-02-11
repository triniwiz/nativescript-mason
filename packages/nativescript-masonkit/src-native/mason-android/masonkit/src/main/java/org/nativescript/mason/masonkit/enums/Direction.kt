package org.nativescript.mason.masonkit.enums

enum class Direction(val value: Byte) {
  Inherit(0), LTR(1), RTL(2);

  val cssValue: String
    get() {
      return when (this) {
        Inherit -> "inherit"
        LTR -> "LTR"
        RTL -> "rtl"
      }
    }

  companion object {
    fun from(value: Byte): Direction {
      return when (value) {
        0.toByte() -> Inherit
        1.toByte() -> LTR
        2.toByte() -> RTL
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
