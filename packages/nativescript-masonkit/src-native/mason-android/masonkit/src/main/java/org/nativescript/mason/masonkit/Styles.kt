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

  enum class DecorationLine(val value: Byte) {
    None(0),
    Underline(1),
    Overline(2),
    LineThrough(3),
    UnderlineLineThrough(4),
    UnderlineOverline(5),
    OverlineUnderlineLineThrough(6);

    companion object {
      fun from(value: Int): DecorationLine = from(value.toByte())

      fun from(value: Byte): DecorationLine {
        return when (value) {
          0.toByte() -> None
          1.toByte() -> Underline
          2.toByte() -> Overline
          3.toByte() -> LineThrough
          4.toByte() -> UnderlineLineThrough
          5.toByte() -> UnderlineOverline
          6.toByte() -> OverlineUnderlineLineThrough
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
      }
    }
  }

  enum class DecorationStyle(val value: Byte) {
    Solid(0),
    Double(1),
    Dotted(2),
    Dashed(3),
    Wavy(4);

    companion object {
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
