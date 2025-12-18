package org.nativescript.mason.masonkit

sealed class MaxSizing {
  data class Points(var points: Float) : MaxSizing()
  data class Percent(var percentage: Float) : MaxSizing()
  data class FitContent(var fitContent: Float) : MaxSizing()
  data class FitContentPercent(var fitContent: Float) : MaxSizing()
  data class Fraction(var fraction: Float) : MaxSizing()
  data object Auto : MaxSizing()
  data object MinContent : MaxSizing()
  data object MaxContent : MaxSizing()

  companion object {
    @JvmStatic
    fun fromTypeValue(type: Int, value: Float): MaxSizing? {
      return when (type) {
        0 -> Auto
        1 -> MinContent
        2 -> MaxContent
        3 -> Points(value)
        4 -> Percent(value)
        5 -> Fraction(value)
        6 -> FitContent(value)
        7 -> FitContentPercent(value)
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
      is Fraction -> 5
      is FitContent -> 6
      is FitContentPercent -> 7
    }

  val value: Float
    get() = when (this) {
      is Auto -> 0f
      is MinContent -> 0f
      is MaxContent -> 0f
      is Percent -> this.percentage
      is Points -> this.points
      is Fraction -> this.fraction
      is FitContent -> this.fitContent
      is FitContentPercent -> this.fitContent
    }
}
