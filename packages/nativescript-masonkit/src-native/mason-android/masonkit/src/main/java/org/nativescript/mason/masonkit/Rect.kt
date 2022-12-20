package org.nativescript.mason.masonkit

import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import java.lang.reflect.Type

data class Rect<T>(
  val left: T,
  val right: T,
  val top: T,
  val bottom: T
)

fun Rect<Dimension>.jsonValue(): String {
  return Mason.gson.toJson(this)
}

fun Rect<Dimension>.cssValue(): String {
  return "\"{\"left\":${left.cssValue},\"right\":${right.cssValue},\"top\":${top.cssValue},\"bottom\":${bottom.cssValue}}\""
}
