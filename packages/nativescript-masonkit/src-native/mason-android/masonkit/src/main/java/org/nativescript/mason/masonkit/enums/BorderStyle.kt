package org.nativescript.mason.masonkit.enums


enum class BorderStyle(val value: Int, val css: String) {
  None(0, "none"), Hidden(1, "hidden"), Dotted(2, "dotted"), Dashed(3, "dashed"), Solid(
    4,
    "solid"
  ),
  Double(5, "double"), Groove(6, "groove"), Ridge(7, "ridge"), Inset(8, "inset"), Outset(
    9,
    "outset"
  );

  companion object {
    fun fromInt(value: Int): BorderStyle {
      return when (value) {
        0 -> None
        1 -> Hidden
        2 -> Dotted
        3 -> Dashed
        4 -> Solid
        5 -> Double
        6 -> Groove
        7 -> Ridge
        8 -> Inset
        9 -> Outset
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }

    fun isValid(value: String): Boolean {
      return value.lowercase() in cssNames
    }

    fun fromName(value: String): BorderStyle {
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
        else -> throw IllegalArgumentException("Unknown enum value: $value")
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
