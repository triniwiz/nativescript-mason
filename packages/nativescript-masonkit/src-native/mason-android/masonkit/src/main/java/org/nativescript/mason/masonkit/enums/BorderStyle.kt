package org.nativescript.mason.masonkit.enums


enum class BorderStyle(val value: Byte, val css: String) {
  None(0, "none"), Hidden(1, "hidden"), Dotted(2, "dotted"), Dashed(3, "dashed"), Solid(
    4,
    "solid"
  ),
  Double(5, "double"), Groove(6, "groove"), Ridge(7, "ridge"), Inset(8, "inset"), Outset(
    9,
    "outset"
  );

  companion object {
    fun from(value: Byte): BorderStyle {
      return when (value) {
        0.toByte() -> None
        1.toByte() -> Hidden
        2.toByte() -> Dotted
        3.toByte() -> Dashed
        4.toByte() -> Solid
        5.toByte() -> Double
        6.toByte() -> Groove
        7.toByte() -> Ridge
        8.toByte() -> Inset
        9.toByte() -> Outset
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }

    fun isValid(value: String): Boolean {
      return value.lowercase() in cssNames
    }

    fun fromName(value: String): BorderStyle? {
      return when (value) {
        "none" -> None
        "hidden" -> Hidden
        "dotted" -> Dotted
        "dashed" -> Dashed
        "solid" -> Solid
        "double" -> Double
        "groove" -> Groove
        "ridge" -> Ridge
        "inset" -> Inset
        "outset" -> Outset
        else -> null
      }
    }

    internal val cssNames = listOf(
      "none",
      "hidden",
      "dotted",
      "dashed",
      "solid",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset"
    )
  }
}
