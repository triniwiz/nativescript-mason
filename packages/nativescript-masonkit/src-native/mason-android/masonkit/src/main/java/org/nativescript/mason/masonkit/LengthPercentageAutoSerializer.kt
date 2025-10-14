package org.nativescript.mason.masonkit

import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import java.lang.reflect.Type

class LengthPercentageAutoSerializer : JsonSerializer<LengthPercentageAuto> {
  override fun serialize(
    src: LengthPercentageAuto?,
    typeOfSrc: Type?,
    context: JsonSerializationContext?
  ): JsonElement {
    if (src == null || context == null) {
      return JsonNull.INSTANCE
    }
    val json = JsonObject()
    when (src) {
      is LengthPercentageAuto.Points -> {
        json.add("value", JsonPrimitive(src.points))
        json.add("unit", JsonPrimitive(Constants.PX_UNIT))
      }

      is LengthPercentageAuto.Zero -> {
        json.add("value", JsonPrimitive(0))
        json.add("unit", JsonPrimitive(Constants.PX_UNIT))
      }

      is LengthPercentageAuto.Percent -> {
        json.add("value", JsonPrimitive(src.percentage))
        json.add("unit", JsonPrimitive(Constants.PERCENT_UNIT))
      }

      is LengthPercentageAuto.Auto -> {
        return JsonPrimitive(Constants.AUTO_VALUE)
      }
    }
    return json
  }
}
