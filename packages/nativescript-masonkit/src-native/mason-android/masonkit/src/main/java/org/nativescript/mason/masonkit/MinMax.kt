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


  val cssValue: String
    get() {
      return when (this) {
        Auto -> "auto"
        is Fraction -> "${maxValue}fr"
        MaxContent -> "max-content"
        MinContent -> "min-content"
        is Percent -> "${minValue * 100}%"
        is Points -> "${minValue}px"
        is FitContent -> "fit-content(${maxValue}px)"
        is FitContentPercent -> "fit-content(${maxValue * 100}%)"
        is Values -> {
          if (minVal == MinSizing.Auto && maxVal == MaxSizing.Auto) {
            return "auto"
          } else if (minVal == MinSizing.MinContent && maxVal == MaxSizing.MinContent) {
            return "min-content"
          } else if (minVal == MinSizing.MaxContent && maxVal == MaxSizing.MaxContent) {
            return "max-content"
          } else if (minVal == MinSizing.Auto && maxVal is MaxSizing.Fraction) {
            return "${maxValue}fr"
          } else if (minVal == MinSizing.Auto && maxVal is MaxSizing.FitContent) {
            return "fit-content(${maxValue}px)"
          } else if (minVal == MinSizing.Auto && maxVal is MaxSizing.FitContentPercent) {
            return "fit-content(${maxValue * 100}%)"
          } else if (minType == maxType && minValue == maxValue) {
            when (minVal) {
              is MinSizing.Percent -> "${minVal.percentage * 100}%"
              is MinSizing.Points -> "${minVal.points}px"
              else -> ""
            }
          } else {
            return "minmax(${
              when (minVal) {
                MinSizing.Auto -> "auto"
                MinSizing.MaxContent -> "max-content"
                MinSizing.MinContent -> "min-content"
                is MinSizing.Percent -> "${minVal.percentage * 100}%"
                is MinSizing.Points -> "${minVal.points}px"
              }
            },${
              when (maxVal) {
                MaxSizing.Auto -> "auto"
                MaxSizing.MaxContent -> "max-content"
                MaxSizing.MinContent -> "min-content"
                is MaxSizing.Percent -> "${maxVal.percentage * 100}%"
                is MaxSizing.Points -> "${maxVal.points}px"
                is MaxSizing.FitContent -> "fit-content(${maxValue}px)" // should not return type maybe invalid
                is MaxSizing.FitContentPercent -> "fit-content(${maxValue * 100}%)" // should not return type maybe invalid
                is MaxSizing.Fraction -> "${maxValue}fr"
              }
            })"
          }
        }
      }
    }
}


val Array<MinMax>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Array<MinMax>.cssValue: String
  get() {
    if (isEmpty()) {
      return ""
    }
    val builder = StringBuilder()
    val last = this.lastIndex
    this.forEachIndexed { index, minMax ->
      if (index == last) {
        builder.append(minMax.cssValue)
      } else {
        builder.append("${minMax.cssValue} ")
      }
    }
    return builder.toString()
  }
