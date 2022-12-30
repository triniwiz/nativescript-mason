package org.nativescript.mason.masonkit

sealed class MinMaxSizing {
  data class Points(var points: Float) : MinMaxSizing()
  data class Percent(var percentage: Float) : MinMaxSizing()
  object Auto : MinMaxSizing()
  object MinContent : MinMaxSizing()
  object MaxContent : MinMaxSizing()

  companion object {
    fun fromTypeValue(type: Int, value: Float): MinMaxSizing? {
      return when (type) {
        0 -> Auto
        1 -> MinContent
        2 -> MaxContent
        3 -> Percent(value)
        4 -> Points(value)
        else -> null
      }
    }
  }

  val type: Int
    get() = when (this) {
      is Auto -> 0
      is MinContent -> 1
      is MaxContent -> 2
      is Percent -> 3
      is Points -> 4
    }

  val value: Float
    get() = when (this) {
      is Auto -> 0f
      is MinContent -> 0f
      is MaxContent -> 0f
      is Percent -> this.percentage
      is Points -> this.points
    }
}
