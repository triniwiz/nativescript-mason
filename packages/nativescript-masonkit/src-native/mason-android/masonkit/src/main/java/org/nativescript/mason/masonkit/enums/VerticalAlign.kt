package org.nativescript.mason.masonkit.enums

import org.nativescript.mason.masonkit.Style
import org.nativescript.mason.masonkit.StyleKeys
import kotlin.Float

enum class VerticalAlign(val type: Byte) {
  Baseline(0),
  Length(0),
  Percent(0),
  Sub(6),
  Super(7),
  Top(1),
  TextTop(2),
  Middle(3),
  Bottom(4),
  TextBottom(
    5
  );

  var value: Float = 0F
    internal set

  val cssValue: String
    get() {
      return when (this) {
        Baseline -> "baseline"
        Length -> "${value}px"
        Percent -> "$value%"
        Sub -> "sub"
        Super -> "super"
        Top -> "top"
        TextTop -> "text-top"
        Middle -> "middle"
        Bottom -> "bottom"
        TextBottom -> "text-bottom"
      }
    }


  companion object {
    @JvmStatic
    internal fun fromStyle(style: Style): VerticalAlign {
      val isPercent = style.values.get(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET) == 1.toByte()
      val ret = fromTypeValue(
        style.values.get(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET),
        isPercent,
        style.values.getFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET)
      )

      if (ret == null) {
        throw IllegalArgumentException("Invalid vertical-align value")
      }

      return ret
    }

    @JvmStatic
    fun fromTypeValue(type: Byte, isPercent: Boolean, value: Float): VerticalAlign? {
      if (isPercent) {
        return Percent.apply {
          this.value = value
        }
      }

      if (value > 0) {
        return Length.apply {
          this.value = value
        }
      }

      return when (type.toInt()) {
        0 -> Baseline
        1 -> Top
        2 -> TextTop
        3 -> Middle
        4 -> Bottom
        5 -> TextBottom
        6 -> Sub
        7 -> Super
        else -> null
      }
    }

    @JvmStatic
    fun length(value: Float): VerticalAlign {
      return Length.apply {
        this.value = value
      }
    }

    @JvmStatic
    fun percent(value: Float): VerticalAlign {
      return Percent.apply {
        this.value = value
      }
    }
  }
}
