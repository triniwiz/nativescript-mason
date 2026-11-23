package org.nativescript.mason.masonkit.enums

import org.nativescript.mason.masonkit.Mason

enum class BorderStyle(val value: Byte, val css: String) {
  // <style-keys:border-style-values> generated from tools/scripts/style-keys/style-keys.schema
  None(0, "none"),
  Hidden(1, "hidden"),
  Dotted(2, "dotted"),
  Dashed(3, "dashed"),
  Solid(4, "solid"),
  Double(5, "double"),
  Groove(6, "groove"),
  Ridge(7, "ridge"),
  Inset(8, "inset"),
  Outset(9, "outset");
  // </style-keys:border-style-values>

  companion object {
    // <style-keys:border-style-conversions> generated from tools/scripts/style-keys/style-keys.schema
    fun from(value: Byte): BorderStyle = when (value) {
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
    // </style-keys:border-style-conversions>

    fun isValid(value: String): Boolean = fromName(value) != null

    fun fromName(value: String): BorderStyle? =
      Mason.expandCssShorthand("keyword:border-style", value)?.firstOrNull()?.toByteOrNull()?.let(::from)
  }
}
