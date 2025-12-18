package org.nativescript.mason.masonkit

data class Size<T>(
  var width: T,
  var height: T,
) {
  companion object {
    fun <T> uniform(value: T): Size<T> {
      return Size(value, value)
    }
  }
}
