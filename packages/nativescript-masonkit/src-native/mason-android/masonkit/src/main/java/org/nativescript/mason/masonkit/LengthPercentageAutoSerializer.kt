package org.nativescript.mason.masonkit

import com.google.gson.*
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
        json.add("unit", JsonPrimitive(PxUnit))
      }

      is LengthPercentageAuto.Zero -> {
        json.add("value", JsonPrimitive(0))
        json.add("unit", JsonPrimitive(PxUnit))
      }

      is LengthPercentageAuto.Percent -> {
        json.add("value", JsonPrimitive(src.percentage))
        json.add("unit", JsonPrimitive(PercentUnit))
      }

      is LengthPercentageAuto.Auto -> {
        return JsonPrimitive(AutoValue)
      }
    }
    return json
  }
}
