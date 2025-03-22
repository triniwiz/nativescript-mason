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
}
