package org.nativescript.mason.masonkit.enums

enum class TextAlign(val value: Int) {
  Auto(0), Left(1), Right(2), Center(3), Justify(4), Start(5), End(6);

  val cssValue: String
    get() {
      return when (this) {
        Auto -> "auto"
        Left -> "left"
        Right -> "right"
        Center -> "center"
        Justify -> "justify"
        Start -> "start"
        End -> "end"
      }
    }

  companion object {
    fun fromInt(value: Int): TextAlign {
      return when (value) {
        0 -> Auto
        1 -> Left
        2 -> Right
        3 -> Center
        4 -> Justify
        5 -> Start
        6 -> End
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
