package org.nativescript.mason.masonkit.enums

enum class TextAlign(val value: Byte) {
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
    fun from(value: Byte): TextAlign {
      return when (value) {
        0.toByte() -> Auto
        1.toByte() -> Left
        2.toByte() -> Right
        3.toByte() -> Center
        4.toByte() -> Justify
        5.toByte() -> Start
        6.toByte() -> End
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
