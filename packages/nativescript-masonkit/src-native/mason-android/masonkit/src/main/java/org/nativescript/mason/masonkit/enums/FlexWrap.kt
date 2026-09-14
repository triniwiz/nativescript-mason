package org.nativescript.mason.masonkit.enums

enum class FlexWrap(val value: Byte) {
  NoWrap(0), Wrap(1), WrapReverse(2), Balance(3), BalanceReverse(4);

  val cssValue: String
    get() {
      return when (this) {
        NoWrap -> "nowrap"
        Wrap -> "wrap"
        WrapReverse -> "wrap-reverse"
        Balance -> "balance"
        BalanceReverse -> "balance-reverse"
      }
    }

  companion object {
    fun from(value: Byte): FlexWrap {
      return when (value) {
        0.toByte() -> NoWrap
        1.toByte() -> Wrap
        2.toByte() -> WrapReverse
        3.toByte() -> Balance
        4.toByte() -> BalanceReverse
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
