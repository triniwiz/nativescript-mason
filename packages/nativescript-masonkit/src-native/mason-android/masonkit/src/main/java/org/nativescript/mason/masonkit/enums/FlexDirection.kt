package org.nativescript.mason.masonkit.enums

enum class FlexDirection(val value: Byte) {
  Row(0), Column(1), RowReverse(2), ColumnReverse(3);

  val cssValue: String
    get() {
      return when (this) {
        Row -> "row"
        Column -> "column"
        RowReverse -> "row-reverse"
        ColumnReverse -> "column-reverse"
      }
    }

  companion object {
    fun from(value: Byte): FlexDirection {
      return when (value) {
        0.toByte() -> Row
        1.toByte() -> Column
        2.toByte() -> RowReverse
        3.toByte() -> ColumnReverse
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
