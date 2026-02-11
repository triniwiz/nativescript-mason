package org.nativescript.mason.masonkit.enums

enum class Float(val value: Byte) {
  None(0),
  Left(1),
  Right(2);

  companion object {
    fun from(value: Byte): Float {
      return when (value) {
        0.toByte() -> None
        1.toByte() -> Left
        2.toByte() -> Right
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
