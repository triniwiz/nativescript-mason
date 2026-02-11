package org.nativescript.mason.masonkit.enums

enum class Align(val value: Byte) {
  Auto(0), Left(1), Right(2), Center(3);

  val cssValue: String
    get() {
      return when (this) {
        Auto -> "auto"
        Left -> "left"
        Right -> "right"
        Center -> "center"
      }
    }

  companion object {
    fun from(value: Byte): Align {
      return when (value) {
        0.toByte() -> Auto
        1.toByte() -> Left
        2.toByte() -> Right
        3.toByte() -> Center
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
