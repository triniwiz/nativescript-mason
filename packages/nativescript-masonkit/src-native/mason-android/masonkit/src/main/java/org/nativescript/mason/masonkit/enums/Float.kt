package org.nativescript.mason.masonkit.enums

enum class Float(val value: Int) {
  None(0),
  Left(1),
  Right(2);

  companion object {
    fun fromInt(value: Int): Float {
      return when (value) {
        0 -> None
        1 -> Left
        2 -> Right
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
