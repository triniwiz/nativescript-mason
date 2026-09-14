package org.nativescript.mason.masonkit

sealed class Dimension(val isZero: Boolean) {
  data class Points(var points: Float) : Dimension(points <= 0)
  data class Percent(var percentage: Float) : Dimension(percentage <= 0)
  data object Auto : Dimension(false)
  data object MinContent : Dimension(false)
  data object MaxContent : Dimension(false)
  data object FitContent : Dimension(false)
  data class FitContentPoints(var points: Float) : Dimension(points <= 0)
  data class FitContentPercent(var percentage: Float) : Dimension(percentage <= 0)
  data object Stretch : Dimension(false)
  data object Content : Dimension(false)

  enum class Kind(val value: Byte) {
    Auto(0),
    Points(1),
    Percent(2),
    MinContent(3),
    MaxContent(4),
    FitContent(5),
    FitContentPoints(6),
    FitContentPercent(7),
    Stretch(8),
    Content(9)
  }

  companion object {
    @JvmStatic
    fun isValid(type: Byte, value: Float): Boolean {
      return when (type) {
        Kind.Auto.value,
        Kind.Points.value,
        Kind.Percent.value,
        Kind.MinContent.value,
        Kind.MaxContent.value,
        Kind.FitContent.value,
        Kind.FitContentPoints.value,
        Kind.FitContentPercent.value,
        Kind.Stretch.value,
        Kind.Content.value -> true
        else -> false
      }
    }

    @JvmStatic
    fun fromTypeValue(type: Byte, value: Float): Dimension? {
      return when (type) {
        Kind.Auto.value -> Auto
        Kind.Points.value -> Points(value)
        Kind.Percent.value -> Percent(value)
        Kind.MinContent.value -> MinContent
        Kind.MaxContent.value -> MaxContent
        Kind.FitContent.value -> FitContent
        Kind.FitContentPoints.value -> FitContentPoints(value)
        Kind.FitContentPercent.value -> FitContentPercent(value)
        Kind.Stretch.value -> Stretch
        Kind.Content.value -> Content
        else -> null
      }
    }
  }

  internal val type: Byte
    get() = when (this) {
      is Auto -> Kind.Auto.value
      is Points -> Kind.Points.value
      is Percent -> Kind.Percent.value
      is MinContent -> Kind.MinContent.value
      is MaxContent -> Kind.MaxContent.value
      is FitContent -> Kind.FitContent.value
      is FitContentPoints -> Kind.FitContentPoints.value
      is FitContentPercent -> Kind.FitContentPercent.value
      is Stretch -> Kind.Stretch.value
      is Content -> Kind.Content.value
    }

  internal val value: Float
    get() = when (this) {
      is Points -> this.points
      is Percent -> this.percentage
      is FitContentPoints -> this.points
      is FitContentPercent -> this.percentage
      is Auto -> 0f
      else -> 0f
    }

  internal fun updateValue(value: Float) {
    when (this) {
      is Points -> {
        this.points = value
      }

      is Percent -> {
        this.percentage = value
      }

      is FitContentPoints -> {
        this.points = value
      }

      is FitContentPercent -> {
        this.percentage = value
      }

      else -> {}
    }
  }

  val jsonValue: String
    get() {
      return Mason.gson.toJson(this)
    }

  val cssValue: String
    get() {
      return when (this) {
        is Points -> {
          "$points${Constants.PX_UNIT}"
        }

        is Percent -> {
          "${percentage * 100}${Constants.PERCENT_UNIT}"
        }

        is Auto -> {
          Constants.AUTO_VALUE
        }

        is MinContent -> {
          "min-content"
        }

        is MaxContent -> {
          "max-content"
        }

        is FitContent -> {
          "fit-content"
        }

        is FitContentPoints -> {
          "fit-content($points${Constants.PX_UNIT})"
        }

        is FitContentPercent -> {
          "fit-content(${percentage * 100}${Constants.PERCENT_UNIT})"
        }

        is Stretch -> {
          "stretch"
        }

        is Content -> {
          "content"
        }
      }
    }
}

val Rect<Dimension>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Rect<Dimension>.cssValue: String
  get() {
    return "\"{\"left\":${left.cssValue},\"right\":${right.cssValue},\"top\":${top.cssValue},\"bottom\":${bottom.cssValue}}\""
  }


val Size<Dimension>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Size<Dimension>.cssValue: String
  get() {
    return "{\"width\":${width.cssValue},\"height\":${height.cssValue}}"
  }

val Size<Dimension>.widthCssValue: String
  get() {
    return width.cssValue
  }

val Size<Dimension>.heightCssValue: String
  get() {
    return height.cssValue
  }

val Size<Dimension>.widthJsonValue: String
  get() {
    return width.jsonValue
  }

val Size<Dimension>.heightJsonValue: String
  get() {
    return height.jsonValue
  }
