package org.nativescript.mason.masonkit

import com.google.gson.*
import java.lang.reflect.Type

private const val AutoValue = "auto"

private const val UndefinedValue = "undefined"

private const val PxUnit = "px"

private const val PercentUnit = "%"


class DimensionSerializer: JsonSerializer<Dimension> {
  override fun serialize(
    src: Dimension?,
    typeOfSrc: Type?,
    context: JsonSerializationContext?
  ): JsonElement {
    if (src == null || context == null){
      return JsonNull.INSTANCE
    }
    val json = JsonObject()
    when (src) {
      is Dimension.Points -> {
        json.add("value", JsonPrimitive(src.points))
        json.add("unit", JsonPrimitive(PxUnit))
      }
      is Dimension.Percent -> {
        json.add("value", JsonPrimitive(src.percentage))
        json.add("unit", JsonPrimitive(PercentUnit))
      }
      is Dimension.Auto -> {
        return JsonPrimitive(AutoValue)
      }
      else -> {
        return JsonPrimitive(UndefinedValue)
      }
    }
    return json
  }
}

sealed class Dimension {
  data class Points(var points: Float) : Dimension()
  data class Percent(var percentage: Float) : Dimension()
  object Undefined : Dimension()
  object Auto : Dimension()

  companion object {
    fun fromTypeValue(type: Int, value: Float): Dimension? {
      return when (type) {
        0 -> Points(value)
        1 -> Percent(value)
        2 -> Undefined
        3 -> Auto
        else -> null
      }
    }
  }

  internal val type: Int
    get() = when (this) {
      is Points -> 0
      is Percent -> 1
      is Undefined -> 2
      is Auto -> 3
    }

  internal val value: Float
    get() = when (this) {
      is Points -> this.points
      is Percent -> this.percentage
      is Undefined -> 0f
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
        else -> {
          UndefinedValue
        }
      }
    }
}
