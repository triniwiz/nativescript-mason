package org.nativescript.mason.masonkit.enums

enum class FlexWrap(val value: Byte) {
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
    fun from(value: Byte): FlexWrap {
      return when (value) {
        0.toByte() -> NoWrap
        1.toByte() -> Wrap
        2.toByte() -> WrapReverse
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
