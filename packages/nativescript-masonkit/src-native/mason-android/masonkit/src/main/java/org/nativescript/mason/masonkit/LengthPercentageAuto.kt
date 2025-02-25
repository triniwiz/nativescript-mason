package org.nativescript.mason.masonkit

sealed class LengthPercentageAuto {
  data class Points(var points: Float) : LengthPercentageAuto()
  data class Percent(var percentage: Float) : LengthPercentageAuto()
  data object Auto : LengthPercentageAuto()
  data object Zero : LengthPercentageAuto() {
    const val points: Float = 0f
  }


  companion object {
    @JvmStatic
    fun fromTypeValue(type: Int, value: Float): LengthPercentageAuto? {
      return when (type) {
        0 -> Auto
        1 -> Points(value)
        2 -> Percent(value)
        else -> null
      }
    }
  }

  internal val type: Int
    get() = when (this) {
      is Auto -> 0
      is Points -> 1
      is Percent -> 2
      is Zero -> 1
    }

  internal val value: Float
    get() = when (this) {
      is Points -> this.points
      is Percent -> this.percentage
      is Auto -> 0f
      is Zero -> this.points
    }

  internal fun updateValue(value: Float) {
    when (this) {
      is Points -> {
        this.points = value
      }

      is Percent -> {
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
          "$points$PxUnit"
        }

        is Percent -> {
          "${percentage * 100}$PercentUnit"
        }

        is Auto -> {
          AutoValue
        }

        is Zero -> {
          "$points$PxUnit"
        }
      }
    }
}


val Rect<LengthPercentageAuto>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Rect<LengthPercentageAuto>.cssValue: String
  get() {
    return "\"{\"left\":${left.cssValue},\"right\":${right.cssValue},\"top\":${top.cssValue},\"bottom\":${bottom.cssValue}}\""
  }

val Size<LengthPercentageAuto>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Size<LengthPercentageAuto>.cssValue: String
  get() {
    return "{\"width\":${width.cssValue},\"height\":${height.cssValue}}"
  }

val Size<LengthPercentageAuto>.widthCssValue: String
  get() {
    return width.cssValue
  }

val Size<LengthPercentageAuto>.heightCssValue: String
  get() {
    return height.cssValue
  }

val Size<LengthPercentageAuto>.widthJsonValue: String
  get() {
    return width.jsonValue
  }

val Size<LengthPercentageAuto>.heightJsonValue: String
  get() {
    return height.jsonValue
  }
