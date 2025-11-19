package org.nativescript.mason.masonkit

sealed class LengthPercentage {
  data class Points(val points: Float) : LengthPercentage()
  data class Percent(val percentage: Float) : LengthPercentage()
  data object Zero : LengthPercentage()

  companion object {
    @JvmStatic
    fun from(value: LengthPercentage): LengthPercentage {
      return when (value) {
        is Percent -> Percent(value.percentage)
        is Points -> Points(value.points)
        Zero -> Zero
      }
    }

    @JvmStatic
    fun fromTypeValue(type: Int, value: Float): LengthPercentage? {
      return when (type) {
        0 -> Points(value)
        1 -> Percent(value)
        else -> null
      }
    }
  }

  internal val type: Int
    get() = when (this) {
      is Points -> 0
      is Zero -> 0
      is Percent -> 1
    }

  internal val value: Float
    get() = when (this) {
      is Points -> this.points
      is Zero -> 0f
      is Percent -> this.percentage
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

        is Zero -> {
          "0${Constants.PX_UNIT}"
        }

        is Percent -> {
          "${percentage * 100}${Constants.PERCENT_UNIT}"
        }
      }
    }
}

val Rect<LengthPercentage>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Rect<LengthPercentage>.cssValue: String
  get() {
    return "\"{\"left\":${left.cssValue},\"right\":${right.cssValue},\"top\":${top.cssValue},\"bottom\":${bottom.cssValue}}\""
  }


val Size<LengthPercentage>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Size<LengthPercentage>.cssValue: String
  get() {
    return "{\"width\":${width.cssValue},\"height\":${height.cssValue}}"
  }

val Size<LengthPercentage>.widthCssValue: String
  get() {
    return width.cssValue
  }

val Size<LengthPercentage>.heightCssValue: String
  get() {
    return height.cssValue
  }

val Size<LengthPercentage>.widthJsonValue: String
  get() {
    return width.jsonValue
  }

val Size<LengthPercentage>.heightJsonValue: String
  get() {
    return height.jsonValue
  }
