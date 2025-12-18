package org.nativescript.mason.masonkit

sealed class MinSizing {
  data class Points(var points: Float) : MinSizing()
  data class Percent(var percentage: Float) : MinSizing()
  data object Auto : MinSizing()
  data object MinContent : MinSizing()
  data object MaxContent : MinSizing()

  companion object {
    @JvmStatic
    fun fromTypeValue(type: Int, value: Float): MinSizing? {
      return when (type) {
        0 -> Auto
        1 -> MinContent
        2 -> MaxContent
        3 -> Points(value)
        4 -> Percent(value)
        else -> null
      }
    }
  }

  val type: Int
    get() = when (this) {
      is Auto -> 0
      is MinContent -> 1
      is MaxContent -> 2
      is Points -> 3
      is Percent -> 4
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
