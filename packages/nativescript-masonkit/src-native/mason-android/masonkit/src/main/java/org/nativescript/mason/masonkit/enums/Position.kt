package org.nativescript.mason.masonkit.enums

enum class Position(val value: Byte) {
  Relative(0), Absolute(1);

  val cssValue: String
    get() {
      return when (this) {
        Relative -> "relative"
        Absolute -> "absolute"
      }
    }

  companion object {
    fun from(value: Byte): Position {
      return when (value) {
        0.toByte() -> Relative
        1.toByte() -> Absolute
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
