package org.nativescript.mason.masonkit.enums

enum class Clear(val value: Byte) {
  None(0),
  Left(1),
  Right(2),
  Both(3);

  companion object {
    fun from(value: Byte): Clear {
      return when (value) {
        0.toByte() -> None
        1.toByte() -> Left
        2.toByte() -> Right
        3.toByte() -> Both
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
