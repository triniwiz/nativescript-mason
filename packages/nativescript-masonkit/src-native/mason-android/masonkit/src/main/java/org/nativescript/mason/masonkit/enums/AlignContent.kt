package org.nativescript.mason.masonkit.enums

enum class AlignContent(val value: Int) {
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
    fun fromInt(value: Int): AlignContent {
      return when (value) {
        -1 -> Normal
        0 -> Start
        1 -> End
        2 -> Center
        3 -> Stretch
        4 -> SpaceBetween
        5 -> SpaceAround
        6 -> SpaceEvenly
        7 -> FlexStart
        8 -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
