package org.nativescript.mason.masonkit.enums

enum class ObjectFit(val value: Byte) {
  Contain(0),
  Cover(1),
  Fill(2),
  None(3),
  ScaleDown(4);

  companion object {
    fun from(value: Byte): ObjectFit {
      return when (value) {
        0.toByte() -> Contain
        1.toByte() -> Cover
        2.toByte() -> Fill
        3.toByte() -> None
        4.toByte() -> ScaleDown
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
