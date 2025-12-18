package org.nativescript.mason.masonkit.enums

enum class ObjectFit(val value: Int) {
  Contain(0),
  Cover(1),
  Fill(2),
  None(3),
  ScaleDown(4);

  companion object {
    fun fromInt(value: Int): ObjectFit {
      return when (value) {
        0 -> Contain
        1 -> Cover
        2 -> Fill
        3 -> None
        4 -> ScaleDown
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
