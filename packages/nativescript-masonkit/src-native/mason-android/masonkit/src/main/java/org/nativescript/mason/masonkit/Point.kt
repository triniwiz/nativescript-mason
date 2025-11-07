package org.nativescript.mason.masonkit

data class Point<T>(
  val x: T,
  val y: T
)


val Point<Overflow>.cssValue: String
  get() {
    if (x == y) {
      return x.cssValue
    }
    return "${x.cssValue} ${y.cssValue}"
  }
