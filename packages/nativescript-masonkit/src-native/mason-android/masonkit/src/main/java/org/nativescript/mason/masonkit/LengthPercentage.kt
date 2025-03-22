package org.nativescript.mason.masonkit

sealed class LengthPercentage {
  data class Points(var points: Float) : LengthPercentage()
  data class Percent(var percentage: Float) : LengthPercentage()
  data object Zero : LengthPercentage() {
    const val points: Float = 0f
  }

  companion object {
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
      is Zero -> this.points
      is Percent -> this.percentage
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
        is Zero -> {
          "$points$PxUnit"
        }
        is Percent -> {
          "${percentage * 100}$PercentUnit"
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
