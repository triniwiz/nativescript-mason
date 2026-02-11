package org.nativescript.mason.masonkit.enums

enum class BoxSizing(val value: Byte) {
  BorderBox(0), ContentBox(1);

  val cssValue: String
    get() {
      return when (this) {
        BorderBox -> "border-box"
        ContentBox -> "content-box"
      }
    }

  companion object {
    fun from(value: Byte): BoxSizing {
      return when (value) {
        0.toByte() -> BorderBox
        1.toByte() -> ContentBox
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
