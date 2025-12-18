package org.nativescript.mason.masonkit

class Styles {
  enum class TextJustify(val value: Int) {
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
      fun fromInt(value: Int): TextJustify {
        return when (value) {
          -1 -> None
          0 -> Auto
          1 -> InterWord
          2 -> InterCharacter
          3 -> Distribute
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class DecorationLine(val value: Int) {
    None(0),
    Underline(1),
    Overline(2),
    LineThrough(3),
    UnderlineLineThrough(4),
    UnderlineOverline(5),
    OverlineUnderlineLineThrough(6);

    companion object {
      fun fromInt(value: Int): DecorationLine {
        return when (value) {
          0 -> None
          1 -> Underline
          2 -> Overline
          3 -> LineThrough
          4 -> UnderlineLineThrough
          5 -> UnderlineOverline
          6 -> OverlineUnderlineLineThrough
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class DecorationStyle(val value: Int) {
    Solid(0),
    Double(1),
    Dotted(2),
    Dashed(3),
    Wavy(4);

    companion object {
      fun fromInt(value: Int): DecorationStyle {
        return when (value) {
          0 -> Solid
          1 -> Double
          2 -> Dotted
          3 -> Dashed
          4 -> Wavy
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class TextTransform(val value: Int) {
    None(0),
    Capitalize(1),
    Uppercase(2),
    Lowercase(3),
    FullWidth(4),
    FullSizeKana(5),
    MathAuto(6);

    companion object {
      fun fromInt(value: Int): TextTransform {
        return when (value) {
          0 -> None
          1 -> Capitalize
          2 -> Uppercase
          3 -> Lowercase
          4 -> FullWidth
          5 -> FullSizeKana
          6 -> MathAuto
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class TextWrap(val value: Int) {
    Wrap(0),
    NoWrap(1),
    Balance(2),
    Pretty(3);

    companion object {
      fun fromInt(value: Int): TextWrap {
        return when (value) {
          0 -> Wrap
          1 -> NoWrap
          2 -> Balance
          3 -> Pretty
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class FontStyle(val value: Int) {
    Normal(0),
    Italic(1),
    Oblique(2);

    companion object {
      fun fromInt(value: Int): FontStyle {
        return when (value) {
          0 -> Normal
          1 -> Italic
          2 -> Oblique
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class WhiteSpace(val value: Int) {
    Normal(0),
    Pre(1),
    PreWrap(2),
    PreLine(3),
    NoWrap(4),
    BreakSpaces(5);

    companion object {
      fun fromInt(value: Int): WhiteSpace {
        return when (value) {
          0 -> Normal
          1 -> Pre
          2 -> PreWrap
          3 -> PreLine
          4 -> NoWrap
          5 -> BreakSpaces
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class TextOverflow(val value: Int) {
    Clip(0),
    Ellipse(1),
    Custom(2);

    var token: String? = null
      internal set

    companion object {
      @JvmOverloads
      fun fromInt(value: Int, token: String? = null): TextOverflow {
        return when (value) {
          0 -> Clip
          1 -> Ellipse.apply {
            this.token = token
          }

          2 -> Custom.apply {
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
        return Ellipse.apply {
          this.token = token
        }
      }
    }

  }
}
