package org.nativescript.mason.masonkit

data class Line<T>(
  val start: T,
  val end: T,
)

val Line<GridPlacement>.cssValue: String
  get() {
    val startValue = start.cssValue
    val endValue = end.cssValue

    return if (startValue == endValue) {
      startValue
    } else {
      "$startValue / $endValue"
    }
  }

val autoLine: Line<GridPlacement> = Line(GridPlacement.Auto, GridPlacement.Auto)


