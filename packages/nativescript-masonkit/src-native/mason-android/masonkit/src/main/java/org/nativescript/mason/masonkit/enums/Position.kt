package org.nativescript.mason.masonkit.enums

enum class Position(val value: Int) {
  Relative(0), Absolute(1);

  val cssValue: String
    get() {
      return when (this) {
        Relative -> "relative"
        Absolute -> "absolute"
      }
    }

  companion object {
    fun fromInt(value: Int): Position {
      return when (value) {
        0 -> Relative
        1 -> Absolute
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
