package org.nativescript.mason.masonkit

sealed class AvailableSpace {
  data class Definite(val points: Float) : AvailableSpace()
  data object MinContent : AvailableSpace()
  data object MaxContent : AvailableSpace()

  companion object {
    @JvmStatic
    fun fromTypeValue(type: Int, value: Float): AvailableSpace? {
      return when (type) {
        0 -> Definite(value)
        1 -> MinContent
        2 -> MaxContent
        else -> null
      }
    }
  }

  internal val type: Int
    get() = when (this) {
      is Definite -> 0
      is MinContent -> 1
      is MaxContent -> 2
    }

  internal val value: Float
    get() = when (this) {
      is Definite -> this.points
      is MinContent -> -1f
      is MaxContent -> -2f
    }
}
