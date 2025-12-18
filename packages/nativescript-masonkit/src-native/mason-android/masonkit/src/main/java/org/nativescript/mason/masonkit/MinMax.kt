package org.nativescript.mason.masonkit;

sealed class MinMax(
  val min: MinSizing,
  val max: MaxSizing
) {
  data class Points(val points: Float) :
    MinMax(MinSizing.Points(points), MaxSizing.Points(points))

  data class Percent(var percentage: Float) :
    MinMax(MinSizing.Percent(percentage), MaxSizing.Percent(percentage))

  data class Fraction(var fraction: Float) :
    MinMax(MinSizing.Auto, MaxSizing.Fraction(fraction))

  data class FitContent(var points: Float) :
    MinMax(MinSizing.Auto, MaxSizing.FitContent(points))

  data class FitContentPercent(var percent: Float) :
    MinMax(MinSizing.Auto, MaxSizing.FitContentPercent(percent))

  data object Auto : MinMax(MinSizing.Auto, MaxSizing.Auto)
  data object MinContent : MinMax(MinSizing.MinContent, MaxSizing.MinContent)
  data object MaxContent : MinMax(MinSizing.MaxContent, MaxSizing.MaxContent)

  data class Values(
    val minVal: MinSizing,
    val maxVal: MaxSizing
  ) : MinMax(minVal, maxVal)

  companion object {
    @JvmStatic
    fun fromTypeValue(minType: Int, minValue: Float, maxType: Int, maxValue: Float): MinMax? {
      val min = when (minType) {
        0 -> MinSizing.Auto
        1 -> MinSizing.MinContent
        2 -> MinSizing.MaxContent
        3 -> MinSizing.Points(minValue)
        4 -> MinSizing.Percent(minValue)
        else -> null
      }

      val max = when (maxType) {
        0 -> MaxSizing.Auto
        1 -> MaxSizing.MinContent
        2 -> MaxSizing.MaxContent
        3 -> MaxSizing.Points(maxValue)
        4 -> MaxSizing.Percent(maxValue)
        5 -> MaxSizing.Fraction(maxValue)
        6 -> MaxSizing.FitContent(maxValue)
        7 -> MaxSizing.FitContentPercent(maxValue)
        else -> null
      }

      return if (min != null && max != null) Values(min, max) else null
    }
  }

  val minType: Int get() = min.type
  val minValue: Float get() = min.value
  val maxType: Int get() = max.type
  val maxValue: Float get() = max.value

  val cssValue: String
    get() = when (this) {
      Auto -> "auto"
      is Fraction -> "${maxValue}fr"
      MaxContent -> "max-content"
      MinContent -> "min-content"
      is Percent -> "${"%.2f".format(minValue * 100)}%"
      is Points -> "${minValue}px"
      is FitContent -> "fit-content(${maxValue}px)"
      is FitContentPercent -> "fit-content(${"%.2f".format(maxValue * 100)}%)"
      is Values -> when {
        minVal == MinSizing.Auto && maxVal == MaxSizing.Auto -> "auto"
        minVal == MinSizing.MinContent && maxVal == MaxSizing.MinContent -> "min-content"
        minVal == MinSizing.MaxContent && maxVal == MaxSizing.MaxContent -> "max-content"
        minVal == MinSizing.Auto && maxVal is MaxSizing.Fraction -> "${maxValue}fr"
        minVal == MinSizing.Auto && maxVal is MaxSizing.FitContent -> "fit-content(${maxValue}px)"
        minVal == MinSizing.Auto && maxVal is MaxSizing.FitContentPercent ->
          "fit-content(${"%.2f".format(maxValue * 100)}%)"

        minType == maxType && minValue == maxValue -> when (minVal) {
          is MinSizing.Percent -> "${"%.2f".format(minVal.percentage * 100)}%"
          is MinSizing.Points -> "${minVal.points}px"
          else -> ""
        }

        else -> {
          val minStr = when (minVal) {
            MinSizing.Auto -> "auto"
            MinSizing.MaxContent -> "max-content"
            MinSizing.MinContent -> "min-content"
            is MinSizing.Percent -> "${"%.2f".format(minVal.percentage * 100)}%"
            is MinSizing.Points -> "${minVal.points}px"
          }

          val maxStr = when (maxVal) {
            MaxSizing.Auto -> "auto"
            MaxSizing.MaxContent -> "max-content"
            MaxSizing.MinContent -> "min-content"
            is MaxSizing.Percent -> "${"%.2f".format(maxVal.percentage * 100)}%"
            is MaxSizing.Points -> "${maxVal.points}px"
            is MaxSizing.Fraction -> "${maxValue}fr"
            // CSS doesn’t allow fit-content inside minmax, use fallback
            is MaxSizing.FitContent, is MaxSizing.FitContentPercent -> "auto"
          }

          "minmax($minStr, $maxStr)"
        }
      }
    }
}

val Array<MinMax>.jsonValue: String
  get() = Mason.gson.toJson(this)

val Array<MinMax>.cssValue: String
  get() = joinToString(" ") { it.cssValue }


typealias TrackSizingFunction = MinMax
