package org.nativescript.mason.masonkit;

sealed class MinMax(
  val min: MinMaxSizing,
  val max: MinMaxSizing
) {
  data class Points(val minPoints: Float, val maxPoints: Float) :
    MinMax(MinMaxSizing.Points(minPoints), MinMaxSizing.Points(maxPoints))

  data class Percent(var minPercentage: Float, var maxPercentage: Float) :
    MinMax(MinMaxSizing.Percent(minPercentage), MinMaxSizing.Percent(maxPercentage))

  object Auto : MinMax(MinMaxSizing.Auto, MinMaxSizing.Auto)
  object MinContent : MinMax(MinMaxSizing.MinContent, MinMaxSizing.MinContent)
  object MaxContent : MinMax(MinMaxSizing.MaxContent, MinMaxSizing.MaxContent)
  data class Values(
    val minVal: MinMaxSizing,
    val maxVal: MinMaxSizing
  ) : MinMax(minVal, maxVal)

  companion object {
    fun fromTypeValue(minType: Int, minValue: Float, maxType: Int, maxValue: Float): MinMax? {
      val min = when (minType) {
        0 -> MinMaxSizing.Auto
        1 -> MinMaxSizing.MinContent
        2 -> MinMaxSizing.MaxContent
        3 -> MinMaxSizing.Percent(minValue)
        4 -> MinMaxSizing.Points(minValue)
        else -> null
      }

      val max = when (maxType) {
        0 -> MinMaxSizing.Auto
        1 -> MinMaxSizing.MinContent
        2 -> MinMaxSizing.MaxContent
        3 -> MinMaxSizing.Percent(maxValue)
        4 -> MinMaxSizing.Points(maxValue)
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
