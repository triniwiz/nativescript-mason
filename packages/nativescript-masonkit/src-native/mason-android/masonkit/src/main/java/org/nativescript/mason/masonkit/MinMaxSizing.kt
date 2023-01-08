package org.nativescript.mason.masonkit


sealed class MinSizing {
  data class Points(var points: Float) : MinSizing()
  data class Percent(var percentage: Float) : MinSizing()
  object Auto : MinSizing()
  object MinContent : MinSizing()
  object MaxContent : MinSizing()

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

sealed class MaxSizing {
  data class Points(var points: Float) : MaxSizing()
  data class Percent(var percentage: Float) : MaxSizing()
  data class FitContent(var fitContent: Float) : MaxSizing()
  data class FitContentPercent(var fitContent: Float) : MaxSizing()
  data class Flex(var flex: Float) : MaxSizing()
  object Auto : MaxSizing()
  object MinContent : MaxSizing()
  object MaxContent : MaxSizing()

  companion object {
    @JvmStatic
    fun fromTypeValue(type: Int, value: Float): MaxSizing? {
      return when (type) {
        0 -> Auto
        1 -> MinContent
        2 -> MaxContent
        3 -> Points(value)
        4 -> Percent(value)
        5 -> Flex(value)
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
      is Flex -> 5
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
      is Flex -> this.flex
      is FitContent -> this.fitContent
      is FitContentPercent -> this.fitContent
    }
}
