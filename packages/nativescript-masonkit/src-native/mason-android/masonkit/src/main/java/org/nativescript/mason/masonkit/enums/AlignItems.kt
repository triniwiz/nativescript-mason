package org.nativescript.mason.masonkit.enums

enum class AlignItems(val value: Byte) {
  Normal(-1), Start(0), End(1), Center(2), Baseline(3), Stretch(4), FlexStart(5), FlexEnd(6);

  val cssValue: String
    get() {
      return when (this) {
        Normal -> "normal"
        Start -> "start"
        End -> "end"
        Center -> "center"
        Baseline -> "baseline"
        Stretch -> "stretch"
        FlexStart -> "flex-start"
        FlexEnd -> "flex-end"
      }
    }

  companion object {

    fun from(value: Byte): AlignItems {
      return when (value) {
        (-1).toByte() -> Normal
        0.toByte() -> Start
        1.toByte() -> End
        2.toByte() -> Center
        3.toByte() -> Baseline
        4.toByte() -> Stretch
        5.toByte() -> FlexStart
        6.toByte() -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
