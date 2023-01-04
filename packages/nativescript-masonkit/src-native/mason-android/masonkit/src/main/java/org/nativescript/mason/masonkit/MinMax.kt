package org.nativescript.mason.masonkit;

sealed class MinMax(
  val min: MinSizing,
  val max: MaxSizing
) {
  data class Points(val points: Float) :
    MinMax(MinSizing.Points(points), MaxSizing.Points(points))

  data class Percent(var percentage: Float) :
    MinMax(MinSizing.Percent(percentage), MaxSizing.Percent(percentage))

  data class Flex(var flex: Float) :
    MinMax(MinSizing.Auto, MaxSizing.Flex(flex))

  object Auto : MinMax(MinSizing.Auto, MaxSizing.Auto)
  object MinContent : MinMax(MinSizing.MinContent, MaxSizing.MinContent)
  object MaxContent : MinMax(MinSizing.MaxContent, MaxSizing.MaxContent)

  data class Values(
    val minVal: MinSizing,
    val maxVal: MaxSizing
  ) : MinMax(minVal, maxVal)

  companion object {
    fun fromTypeValue(minType: Int, minValue: Float, maxType: Int, maxValue: Float): MinMax? {
      val min = when (minType) {
        0 -> MinSizing.Auto
        1 -> MinSizing.MinContent
        2 -> MinSizing.MaxContent
        3 -> MinSizing.Percent(minValue)
        4 -> MinSizing.Points(minValue)
        else -> null
      }

      val max = when (maxType) {
        0 -> MaxSizing.Auto
        1 -> MaxSizing.MinContent
        2 -> MaxSizing.MaxContent
        3 -> MaxSizing.Percent(maxValue)
        4 -> MaxSizing.Points(maxValue)
        5 -> MaxSizing.Flex(maxValue)
        6 -> MaxSizing.FitContent(maxValue)
        7 -> MaxSizing.FitContentPercent(maxValue)
        else -> null
      }

      if (min == null || max == null) {
        return null
      }

      return Values(min, max)
    }
  }

  val minType: Int
    get() {
      return min.type
    }

  val minValue: Float
    get() {
      return min.value
    }

  val maxType: Int
    get() {
      return max.type
    }

  val maxValue: Float
    get() {
      return max.value
    }

}
