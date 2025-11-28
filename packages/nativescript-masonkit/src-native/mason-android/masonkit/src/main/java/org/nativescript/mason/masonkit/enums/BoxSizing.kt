package org.nativescript.mason.masonkit.enums

enum class BoxSizing(val value: Int) {
  BorderBox(0), ContentBox(1);

  val cssValue: String
    get() {
      return when (this) {
        BorderBox -> "border-box"
        ContentBox -> "content-box"
      }
    }

  companion object {
    fun fromInt(value: Int): BoxSizing {
      return when (value) {
        0 -> BorderBox
        1 -> ContentBox
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
