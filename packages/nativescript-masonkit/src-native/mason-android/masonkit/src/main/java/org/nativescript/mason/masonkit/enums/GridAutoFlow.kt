package org.nativescript.mason.masonkit.enums

enum class GridAutoFlow(val value: Byte) {
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
    fun from(value: Byte): GridAutoFlow {
      return when (value) {
        0.toByte() -> Row
        1.toByte() -> Column
        2.toByte() -> RowDense
        3.toByte() -> ColumnDense
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
