package org.nativescript.mason.masonkit.enums

internal enum class DisplayMode(val value: Int) {
  None(0), Inline(1), Box(2);

  companion object {
    fun fromInt(value: Int): DisplayMode {
      return when (value) {
        0 -> None
        1 -> Inline
        2 -> Box
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
