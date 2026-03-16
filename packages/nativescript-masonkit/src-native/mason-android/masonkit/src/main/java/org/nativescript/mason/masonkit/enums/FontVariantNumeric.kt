package org.nativescript.mason.masonkit.enums

/**
 * Bitmask for CSS font-variant-numeric values.
 * Multiple values can be combined (e.g. `tabular-nums` + `slashed-zero`).
 */
object FontVariantNumeric {
  const val NORMAL: Int             = 0
  const val LINING_NUMS: Int        = 1 shl 0
  const val OLDSTYLE_NUMS: Int      = 1 shl 1
  const val PROPORTIONAL_NUMS: Int  = 1 shl 2
  const val TABULAR_NUMS: Int       = 1 shl 3
  const val DIAGONAL_FRACTIONS: Int = 1 shl 4
  const val STACKED_FRACTIONS: Int  = 1 shl 5
  const val ORDINAL: Int            = 1 shl 6
  const val SLASHED_ZERO: Int       = 1 shl 7

  /**
   * Convert bitmask to Android Paint.fontFeatureSettings string.
   * Uses OpenType feature tags directly.
   */
  fun toFontFeatureSettings(mask: Int): String {
    if (mask == NORMAL) return ""
    val features = mutableListOf<String>()
    if (mask and LINING_NUMS != 0)        features.add("\"lnum\"")
    if (mask and OLDSTYLE_NUMS != 0)      features.add("\"onum\"")
    if (mask and PROPORTIONAL_NUMS != 0)  features.add("\"pnum\"")
    if (mask and TABULAR_NUMS != 0)       features.add("\"tnum\"")
    if (mask and DIAGONAL_FRACTIONS != 0) features.add("\"frac\"")
    if (mask and STACKED_FRACTIONS != 0)  features.add("\"afrc\"")
    if (mask and ORDINAL != 0)            features.add("\"ordn\"")
    if (mask and SLASHED_ZERO != 0)       features.add("\"zero\"")
    return features.joinToString(", ")
  }

  fun toCssString(mask: Int): String {
    if (mask == NORMAL) return "normal"
    val parts = mutableListOf<String>()
    if (mask and LINING_NUMS != 0)        parts.add("lining-nums")
    if (mask and OLDSTYLE_NUMS != 0)      parts.add("oldstyle-nums")
    if (mask and PROPORTIONAL_NUMS != 0)  parts.add("proportional-nums")
    if (mask and TABULAR_NUMS != 0)       parts.add("tabular-nums")
    if (mask and DIAGONAL_FRACTIONS != 0) parts.add("diagonal-fractions")
    if (mask and STACKED_FRACTIONS != 0)  parts.add("stacked-fractions")
    if (mask and ORDINAL != 0)            parts.add("ordinal")
    if (mask and SLASHED_ZERO != 0)       parts.add("slashed-zero")
    return parts.joinToString(" ")
  }

  fun parse(css: String): Int {
    val trimmed = css.trim().lowercase()
    if (trimmed.isEmpty() || trimmed == "normal") return NORMAL
    var result = 0
    for (token in trimmed.split(" ")) {
      when (token) {
        "lining-nums"        -> result = result or LINING_NUMS
        "oldstyle-nums"      -> result = result or OLDSTYLE_NUMS
        "proportional-nums"  -> result = result or PROPORTIONAL_NUMS
        "tabular-nums"       -> result = result or TABULAR_NUMS
        "diagonal-fractions" -> result = result or DIAGONAL_FRACTIONS
        "stacked-fractions"  -> result = result or STACKED_FRACTIONS
        "ordinal"            -> result = result or ORDINAL
        "slashed-zero"       -> result = result or SLASHED_ZERO
      }
    }
    return result
  }
}
