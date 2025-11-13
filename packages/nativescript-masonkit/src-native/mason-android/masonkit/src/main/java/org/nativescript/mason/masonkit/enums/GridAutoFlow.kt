package org.nativescript.mason.masonkit.enums

enum class GridAutoFlow(val value: Int) {
  Row(0), Column(1), RowDense(2), ColumnDense(3);

  val cssValue: String
    get() {
      return when (this) {
        Row -> "row"
        Column -> "column"
        RowDense -> "row-dense"
        ColumnDense -> "column-dense"
      }
    }

  companion object {
    fun fromInt(value: Int): GridAutoFlow {
      return when (value) {
        0 -> Row
        1 -> Column
        2 -> RowDense
        3 -> ColumnDense
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
