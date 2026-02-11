package org.nativescript.mason.masonkit.enums

enum class JustifyContent(val value: Byte) {
  Normal(-1), Start(0), End(1), Center(2), Stretch(3), SpaceBetween(4), SpaceAround(5), SpaceEvenly(
    6
  ),
  FlexStart(7), FlexEnd(8);

  val cssValue: String
    get() {
      return when (this) {
        Normal -> "normal"
        Start -> "start"
        End -> "end"
        Center -> "center"
        Stretch -> "stretch"
        SpaceBetween -> "space-between"
        SpaceAround -> "space-around"
        SpaceEvenly -> "space-evenly"
        FlexStart -> "flex-start"
        FlexEnd -> "flex-end"
      }
    }

  companion object {
    fun from(value: Byte): JustifyContent {
      return when (value) {
        (-1).toByte() -> Normal
        0.toByte() -> Start
        1.toByte() -> End
        2.toByte() -> Center
        3.toByte() -> Stretch
        4.toByte() -> SpaceBetween
        5.toByte() -> SpaceAround
        6.toByte() -> SpaceEvenly
        7.toByte() -> FlexStart
        8.toByte() -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
