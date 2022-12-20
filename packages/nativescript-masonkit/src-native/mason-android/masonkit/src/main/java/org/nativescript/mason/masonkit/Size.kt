package org.nativescript.mason.masonkit

data class Size<T>(
  var width: T,
  val height: T,
)


fun Size<Dimension>.jsonValue(): String {
  return Mason.gson.toJson(this)
}

fun Size<Dimension>.cssValue(): String {
  return "{\"width\":${width.cssValue},\"height\":${height.cssValue}}"
}

fun Size<Dimension>.widthCssValue(): String {
  return width.cssValue
}

fun Size<Dimension>.heightCssValue(): String {
  return height.cssValue
}

fun Size<Dimension>.widthJsonValue(): String {
  return width.jsonValue
}

fun Size<Dimension>.heightJsonValue(): String {
  return height.jsonValue
}

val zeroSize = Size(0F, 0F)

val nanSize = Size(Float.NaN, Float.NaN)

val autoSize: Size<Dimension> = Size(Dimension.Auto, Dimension.Auto)
