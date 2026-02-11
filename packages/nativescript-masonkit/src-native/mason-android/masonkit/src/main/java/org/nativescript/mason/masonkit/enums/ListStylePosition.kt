package org.nativescript.mason.masonkit.enums

enum class ListStylePosition(val value: Byte) {
  Outside(0),
  Inside(1);

  val cssValue: String
    get() {
      return when (this) {
        Outside -> "auto"
        Inside -> "inside"
      }
    }

  companion object {
    fun from(value: Byte): ListStylePosition {
      return when (value) {
        0.toByte() -> Outside
        1.toByte() -> Inside
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
