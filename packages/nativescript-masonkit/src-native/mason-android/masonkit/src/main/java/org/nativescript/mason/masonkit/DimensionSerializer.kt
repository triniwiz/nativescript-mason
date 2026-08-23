package org.nativescript.mason.masonkit

import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import java.lang.reflect.Type

class DimensionSerializer : JsonSerializer<Dimension> {
  override fun serialize(
    src: Dimension?,
    typeOfSrc: Type?,
    context: JsonSerializationContext?
  ): JsonElement {
    if (src == null || context == null) {
      return JsonNull.INSTANCE
    }
    val json = JsonObject()
    when (src) {
      is Dimension.Points -> {
        json.add("value", JsonPrimitive(src.points))
        json.add("unit", JsonPrimitive(Constants.PX_UNIT))
      }

      is Dimension.Percent -> {
        json.add("value", JsonPrimitive(src.percentage))
        json.add("unit", JsonPrimitive(Constants.PERCENT_UNIT))
      }

      is Dimension.Auto -> {
        return JsonPrimitive(Constants.AUTO_VALUE)
      }

      is Dimension.MinContent -> {
        return JsonPrimitive("min-content")
      }

      is Dimension.MaxContent -> {
        return JsonPrimitive("max-content")
      }

      is Dimension.FitContent -> {
        return JsonPrimitive("fit-content")
      }

      is Dimension.FitContentPoints -> {
        json.add("value", JsonPrimitive(src.points))
        json.add("unit", JsonPrimitive("fit-content-points"))
      }

      is Dimension.FitContentPercent -> {
        json.add("value", JsonPrimitive(src.percentage))
        json.add("unit", JsonPrimitive("fit-content-percent"))
      }

      is Dimension.Stretch -> {
        return JsonPrimitive("stretch")
      }

      is Dimension.Content -> {
        return JsonPrimitive("content")
      }
    }
    return json
  }
}
