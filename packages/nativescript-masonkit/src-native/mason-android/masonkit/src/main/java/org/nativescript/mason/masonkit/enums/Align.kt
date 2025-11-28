package org.nativescript.mason.masonkit.enums

enum class Align(val value: Int) {
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
    fun fromInt(value: Int): Align {
      return when (value) {
        0 -> Auto
        1 -> Left
        2 -> Right
        3 -> Center
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
