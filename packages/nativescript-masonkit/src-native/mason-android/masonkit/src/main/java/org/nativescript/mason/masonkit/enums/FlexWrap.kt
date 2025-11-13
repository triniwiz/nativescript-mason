package org.nativescript.mason.masonkit.enums

enum class FlexWrap(val value: Int) {
  NoWrap(0), Wrap(1), WrapReverse(2);

  val cssValue: String
    get() {
      return when (this) {
        NoWrap -> "nowrap"
        Wrap -> "wrap"
        WrapReverse -> "wrap-reverse"
      }
    }

  companion object {
    fun fromInt(value: Int): FlexWrap {
      return when (value) {
        0 -> NoWrap
        1 -> Wrap
        2 -> WrapReverse
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
