package org.nativescript.mason.masonkit

class Styles {
  enum class TextJustify(val value: Byte) {
    None(-1),
    Auto(0),
    InterWord(1),
    InterCharacter(2),
    Distribute(3);

    val cssValue: String
      get() {
        return when (this) {
          None -> "none"
          Auto -> "auto"
          InterWord -> "inter-word"
          InterCharacter -> "inter-character"
          Distribute -> "distribute"
        }
      }

    companion object {
      fun from(value: Int): TextJustify = from(value.toByte())

      fun from(value: Byte): TextJustify {
        return when (value) {
          (-5).toByte() -> Auto
          (-1).toByte() -> None
          0.toByte() -> Auto
          1.toByte() -> InterWord
          2.toByte() -> InterCharacter
          3.toByte() -> Distribute
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  /**
   * `text-decoration-line`, stored as a bit set: 1 underline, 2 overline,
   * 4 line-through. `spelling-error` (8) and `grammar-error` (16) stand alone.
   * iOS and TS share this encoding.
   */
  enum class DecorationLine(val value: Byte) {
    None(0),
    Underline(1),
    Overline(2),
    UnderlineOverline(3),
    LineThrough(4),
    UnderlineLineThrough(5),
    OverlineLineThrough(6),
    UnderlineOverlineLineThrough(7),
    SpellingError(8),
    GrammarError(16);

    val hasUnderline: Boolean get() = (value.toInt() and UNDERLINE) != 0
    val hasOverline: Boolean get() = (value.toInt() and OVERLINE) != 0
    val hasLineThrough: Boolean get() = (value.toInt() and LINE_THROUGH) != 0
    val isSpellingError: Boolean get() = this == SpellingError
    val isGrammarError: Boolean get() = this == GrammarError

    val cssValue: String
      get() = when (this) {
        None -> "none"
        SpellingError -> "spelling-error"
        GrammarError -> "grammar-error"
        else -> buildList {
          if (hasUnderline) add("underline")
          if (hasOverline) add("overline")
          if (hasLineThrough) add("line-through")
        }.joinToString(" ")
      }

    companion object {
      const val UNDERLINE = 1
      const val OVERLINE = 2
      const val LINE_THROUGH = 4

      fun from(value: Int): DecorationLine = from(value.toByte())

      fun from(value: Byte): DecorationLine {
        return entries.firstOrNull { it.value == value }
          ?: throw IllegalArgumentException("Unknown enum value: $value")
      }

      /** Parse the `text-decoration-line` keywords; null when nothing valid was found. */
      fun parse(css: String): DecorationLine? {
        var mask = 0
        var seen = false
        for (token in css.trim().lowercase().split(Regex("\\s+"))) {
          when (token) {
            "" -> {}
            "none" -> { seen = true }
            "underline" -> { mask = mask or UNDERLINE; seen = true }
            "overline" -> { mask = mask or OVERLINE; seen = true }
            "line-through" -> { mask = mask or LINE_THROUGH; seen = true }
            "spelling-error" -> return SpellingError
            "grammar-error" -> return GrammarError
            else -> return null
          }
        }
        return if (seen) from(mask) else null
      }
    }
  }

  enum class DecorationStyle(val value: Byte) {
    Solid(0),
    Double(1),
    Dotted(2),
    Dashed(3),
    Wavy(4);

    val cssValue: String
      get() = when (this) {
        Solid -> "solid"
        Double -> "double"
        Dotted -> "dotted"
        Dashed -> "dashed"
        Wavy -> "wavy"
      }

    companion object {
      fun parse(css: String): DecorationStyle? = when (css.trim().lowercase()) {
        "solid" -> Solid
        "double" -> Double
        "dotted" -> Dotted
        "dashed" -> Dashed
        "wavy" -> Wavy
        else -> null
      }

      fun from(value: Int): DecorationStyle = from(value.toByte())

      fun from(value: Byte): DecorationStyle {
        return when (value) {
          0.toByte() -> Solid
          1.toByte() -> Double
          2.toByte() -> Dotted
          3.toByte() -> Dashed
          4.toByte() -> Wavy
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class TextTransform(val value: Byte) {
    None(0),
    Capitalize(1),
    Uppercase(2),
    Lowercase(3),
    FullWidth(4),
    FullSizeKana(5),
    MathAuto(6);

    companion object {
      fun from(value: Int): TextTransform = from(value.toByte())

      fun from(value: Byte): TextTransform {
        return when (value) {
          0.toByte() -> None
          1.toByte() -> Capitalize
          2.toByte() -> Uppercase
          3.toByte() -> Lowercase
          4.toByte() -> FullWidth
          5.toByte() -> FullSizeKana
          6.toByte() -> MathAuto
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class TextWrap(val value: Byte) {
    Wrap(0),
    NoWrap(1),
    Balance(2),
    Pretty(3);

    companion object {
      fun from(value: Int): TextWrap = from(value.toByte())

      fun from(value: Byte): TextWrap {
        return when (value) {
          0.toByte() -> Wrap
          1.toByte() -> NoWrap
          2.toByte() -> Balance
          3.toByte() -> Pretty
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class FontStyle(val value: Byte) {
    Normal(0),
    Italic(1),
    Oblique(2);

    companion object {
      fun from(value: Int): FontStyle = from(value.toByte())

      fun from(value: Byte): FontStyle {
        return when (value) {
          0.toByte() -> Normal
          1.toByte() -> Italic
          2.toByte() -> Oblique
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class WhiteSpace(val value: Byte) {
    Normal(0),
    Pre(1),
    PreWrap(2),
    PreLine(3),
    NoWrap(4),
    BreakSpaces(5);

    companion object {
      fun from(value: Int): WhiteSpace = from(value.toByte())

      fun from(value: Byte): WhiteSpace {
        return when (value) {
          0.toByte() -> Normal
          1.toByte() -> Pre
          2.toByte() -> PreWrap
          3.toByte() -> PreLine
          4.toByte() -> NoWrap
          5.toByte() -> BreakSpaces
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class TextOverflow(val value: Byte) {
    Clip(0),
    Ellipse(1),
    Custom(2);

    var token: String? = null
      internal set

    companion object {
      fun from(value: Int): TextOverflow = from(value.toByte())

      @JvmOverloads
      fun from(value: Byte, token: String? = null): TextOverflow {
        return when (value) {
          0.toByte() -> Clip
          1.toByte() -> Ellipse.apply {
            this.token = token
          }

          2.toByte() -> Custom.apply {
            this.token = token
          }

          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }

      @JvmStatic
      fun ellipse(token: String): TextOverflow {
        return Ellipse.apply {
          this.token = token
        }
      }

      @JvmOverloads
      @JvmStatic
      fun custom(token: String = ""): TextOverflow {
        return Custom.apply {
          this.token = token
        }
      }
    }

  }
}
