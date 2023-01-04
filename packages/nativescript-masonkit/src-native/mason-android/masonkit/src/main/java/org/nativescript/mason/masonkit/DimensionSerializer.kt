package org.nativescript.mason.masonkit

import com.google.gson.*
import java.lang.reflect.Type

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
    }
    return json
  }
}
