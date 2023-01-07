package org.nativescript.mason.masonkit

sealed class LengthPercentage {
  data class Points(var points: Float) : LengthPercentage()
  data class Percent(var percentage: Float) : LengthPercentage()
  object Zero : LengthPercentage() {
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
          "$percentage$PercentUnit"
        }
      }
    }
}

fun Rect<LengthPercentage>.jsonValue(): String {
  return Mason.gson.toJson(this)
}

fun Rect<LengthPercentage>.cssValue(): String {
  return "\"{\"left\":${left.cssValue},\"right\":${right.cssValue},\"top\":${top.cssValue},\"bottom\":${bottom.cssValue}}\""
}

fun Size<LengthPercentage>.jsonValue(): String {
  return Mason.gson.toJson(this)
}

fun Size<LengthPercentage>.cssValue(): String {
  return "{\"width\":${width.cssValue},\"height\":${height.cssValue}}"
}

fun Size<LengthPercentage>.widthCssValue(): String {
  return width.cssValue
}

fun Size<LengthPercentage>.heightCssValue(): String {
  return height.cssValue
}

fun Size<LengthPercentage>.widthJsonValue(): String {
  return width.jsonValue
}

fun Size<LengthPercentage>.heightJsonValue(): String {
  return height.jsonValue
}
