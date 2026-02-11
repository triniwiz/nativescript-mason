package org.nativescript.mason.masonkit.enums

internal enum class DisplayMode(val value: Byte) {
  None(0), Inline(1), Box(2), ListItem(3);

  companion object {
    fun from(value: Byte): DisplayMode {
      return when (value) {
        0.toByte() -> None
        1.toByte() -> Inline
        2.toByte() -> Box
        3.toByte() -> ListItem
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
