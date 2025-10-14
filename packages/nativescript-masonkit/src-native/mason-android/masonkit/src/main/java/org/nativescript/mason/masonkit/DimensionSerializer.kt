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
    }
    return json
  }
}
