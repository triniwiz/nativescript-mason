package org.nativescript.mason.masonkit

data class Rect<T>(
  val left: T,
  val right: T,
  val top: T,
  val bottom: T
) {
  companion object {
    @JvmStatic
    fun <T> uniform(value: T): Rect<T> {
      return Rect(value, value, value, value)
    }
  }
}
