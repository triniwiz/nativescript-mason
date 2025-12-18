package org.nativescript.mason.masonkit.enums

enum class AlignSelf(val value: Int) {
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
    fun fromInt(value: Int): AlignSelf {
      return when (value) {
        -1 -> Normal
        0 -> Start
        1 -> End
        2 -> Center
        3 -> Baseline
        4 -> Stretch
        5 -> FlexStart
        6 -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
