package org.nativescript.mason.masonkit.enums

enum class ListStyleType(val value: Byte) {
  None(0),
  Custom(1),
  Disc(2),
  Circle(3),
  Square(4),
  Decimal(5);

  val cssValue: String
    get() {
      return when (this) {
        None -> "none"
        Custom -> "custom"
        Disc -> "disc"
        Circle -> "circle"
        Square -> "square"
        Decimal -> "decimal"
      }
    }

  companion object {
    fun from(value: Byte): ListStyleType {
      return when (value) {
        0.toByte() -> None
        1.toByte() -> Custom
        2.toByte() -> Disc
        3.toByte() -> Circle
        4.toByte() -> Square
        5.toByte() -> Decimal
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
