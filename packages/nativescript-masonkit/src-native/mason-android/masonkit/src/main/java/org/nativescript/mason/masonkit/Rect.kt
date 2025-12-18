package org.nativescript.mason.masonkit

data class Rect<T>(
  val top: T,
  val right: T,
  val bottom: T,
  val left: T,
) {
  companion object {
    @JvmStatic
    fun <T> uniform(value: T): Rect<T> {
      return Rect(value, value, value, value)
    }
  }
}
