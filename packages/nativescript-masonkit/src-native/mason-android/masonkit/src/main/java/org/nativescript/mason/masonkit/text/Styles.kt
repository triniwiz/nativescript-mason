package org.nativescript.mason.masonkit.text

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
          0 -> None
          1 -> Auto
          2 -> InterWord
          3 -> InterCharacter
          4 -> Distribute
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class DecorationLine(val value: Int) {
    None(0), Underline(1), Overline(2), LineThrough(3);

    companion object {
      fun fromInt(value: Int): DecorationLine {
        return when (value) {
          0 -> None
          1 -> Underline
          2 -> Overline
          3 -> LineThrough
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
    NoWrap(0),
    Wrap(1),
    Balance(2);

    companion object {
      fun fromInt(value: Int): TextWrap {
        return when (value) {
          0 -> NoWrap
          1 -> Wrap
          2 -> Balance
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
}
