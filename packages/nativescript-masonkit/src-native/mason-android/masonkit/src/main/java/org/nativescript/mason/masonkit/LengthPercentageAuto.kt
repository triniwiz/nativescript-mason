package org.nativescript.mason.masonkit


sealed class LengthPercentageAuto {
  data class Points(var points: Float) : LengthPercentageAuto()
  data class Percent(var percentage: Float) : LengthPercentageAuto()
  data object Auto : LengthPercentageAuto()
  data object Zero : LengthPercentageAuto()


  companion object {
    @JvmStatic
    fun isValid(type: Byte, value: Float): Boolean {
      return when (type) {
        0.toByte(), 1.toByte(), 2.toByte() -> true
        else -> false
      }
    }

    @JvmStatic
    fun fromTypeValue(type: Byte, value: Float): LengthPercentageAuto? {
      return when (type) {
        0.toByte() -> Auto
        1.toByte() -> Points(value)
        2.toByte() -> Percent(value)
        else -> null
      }
    }
  }

  internal val type: Byte
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
      is Zero -> 0f
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
          "$points${Constants.PX_UNIT}"
        }

        is Percent -> {
          "${percentage * 100}${Constants.PERCENT_UNIT}"
        }

        is Auto -> {
          Constants.AUTO_VALUE
        }

        is Zero -> {
          "0${Constants.PX_UNIT}"
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
