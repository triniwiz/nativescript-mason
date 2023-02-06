package org.nativescript.mason.masonkit

data class Line<T>(
  val start: T,
  val end: T,
) {
  companion object {
    @JvmStatic
    fun fromStartAndEndValues(
      startType: Int,
      startValue: Short,
      endType: Int,
      endValue: Short
    ): Line<GridPlacement>? {
      val start = when (startType) {
        0 -> GridPlacement.Auto
        1 -> GridPlacement.Line(startValue)
        2 -> GridPlacement.Span(startValue)
        else -> null
      }

      val end = when (endType) {
        0 -> GridPlacement.Auto
        1 -> GridPlacement.Line(endValue)
        2 -> GridPlacement.Span(endValue)
        else -> null
      }


      return if (start != null && end != null) {
        Line(start, end)
      } else {
        null
      }

    }
  }
}

val autoLine: Line<GridPlacement> = Line(GridPlacement.Auto, GridPlacement.Auto)


