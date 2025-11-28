package org.nativescript.mason.masonkit.enums

enum class Direction(val value: Int) {
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
    fun fromInt(value: Int): Direction {
      return when (value) {
        0 -> Inherit
        1 -> LTR
        2 -> RTL
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
