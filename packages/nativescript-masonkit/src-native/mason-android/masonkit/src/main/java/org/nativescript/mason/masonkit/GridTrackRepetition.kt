package org.nativescript.mason.masonkit

sealed class GridTrackRepetition {
  data object AutoFill : GridTrackRepetition()
  data object AutoFit : GridTrackRepetition()
  data class Count(val count: Short) : GridTrackRepetition()

  val type: Int
    get() {
      return toInt()
    }

  val value: Short
    get() {
      return when (this) {
        AutoFill -> 0
        AutoFit -> 0
        is Count -> count
      }
    }

  val cssValue: String
    get() {
      return when (this) {
        AutoFill -> "auto-fill"
        AutoFit -> "auto-fit"
        is Count -> "$value"
      }
    }

  fun toInt(): Int {
    return when (this) {
      AutoFill -> 0
      AutoFit -> 1
      is Count -> 2
    }
  }

  companion object {
    @JvmStatic
    fun fromInt(type: Int, value: Short): GridTrackRepetition {
      return when (type) {
        0 -> AutoFill
        1 -> AutoFit
        2 -> Count(value)
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
