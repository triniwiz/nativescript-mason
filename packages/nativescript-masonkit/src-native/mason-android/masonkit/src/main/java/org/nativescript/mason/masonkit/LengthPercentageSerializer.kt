package org.nativescript.mason.masonkit

import com.google.gson.*
import java.lang.reflect.Type

class LengthPercentageSerializer : JsonSerializer<LengthPercentage> {
  override fun serialize(
    src: LengthPercentage?,
    typeOfSrc: Type?,
    context: JsonSerializationContext?
  ): JsonElement {
    if (src == null || context == null) {
      return JsonNull.INSTANCE
    }
    val json = JsonObject()
    when (src) {
      is LengthPercentage.Points -> {
        json.add("value", JsonPrimitive(src.points))
        json.add("unit", JsonPrimitive(PxUnit))
      }
      is LengthPercentage.Zero -> {
        json.add("value", JsonPrimitive(src.points))
        json.add("unit", JsonPrimitive(PxUnit))
      }
      is LengthPercentage.Percent -> {
        json.add("value", JsonPrimitive(src.percentage))
        json.add("unit", JsonPrimitive(PercentUnit))
      }
    }
    return json
  }
}
