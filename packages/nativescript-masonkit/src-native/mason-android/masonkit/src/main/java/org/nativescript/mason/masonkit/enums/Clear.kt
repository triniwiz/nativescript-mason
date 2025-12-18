package org.nativescript.mason.masonkit.enums

enum class Clear(val value: Int) {
  None(0),
  Left(1),
  Right(2),
  Both(3);

  companion object {
    fun fromInt(value: Int): Clear {
      return when (value) {
        0 -> None
        1 -> Left
        2 -> Right
        3 -> Both
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
