package org.nativescript.mason.masonkit


internal const val AutoValue = "auto"

internal const val PxUnit = "px"

internal const val PercentUnit = "%"


sealed class Dimension {
  data class Points(var points: Float) : Dimension()
  data class Percent(var percentage: Float) : Dimension()
  object Auto : Dimension()

  companion object {
    @JvmStatic
    fun fromTypeValue(type: Int, value: Float): Dimension? {
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
    }

  internal val value: Float
    get() = when (this) {
      is Points -> this.points
      is Percent -> this.percentage
      is Auto -> 0f
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
          "$percentage$PercentUnit"
        }
        is Auto -> {
          AutoValue
        }
      }
    }
}

fun Rect<Dimension>.jsonValue(): String {
  return Mason.gson.toJson(this)
}

fun Rect<Dimension>.cssValue(): String {
  return "\"{\"left\":${left.cssValue},\"right\":${right.cssValue},\"top\":${top.cssValue},\"bottom\":${bottom.cssValue}}\""
}

fun Size<Dimension>.jsonValue(): String {
  return Mason.gson.toJson(this)
}

fun Size<Dimension>.cssValue(): String {
  return "{\"width\":${width.cssValue},\"height\":${height.cssValue}}"
}

fun Size<Dimension>.widthCssValue(): String {
  return width.cssValue
}

fun Size<Dimension>.heightCssValue(): String {
  return height.cssValue
}

fun Size<Dimension>.widthJsonValue(): String {
  return width.jsonValue
}

fun Size<Dimension>.heightJsonValue(): String {
  return height.jsonValue
}
