package org.nativescript.mason.masonkit.enums

enum class FlexDirection(val value: Int) {
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
    fun fromInt(value: Int): FlexDirection {
      return when (value) {
        0 -> Row
        1 -> Column
        2 -> RowReverse
        3 -> ColumnReverse
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
