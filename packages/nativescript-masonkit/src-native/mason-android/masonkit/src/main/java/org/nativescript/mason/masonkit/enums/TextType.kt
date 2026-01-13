package org.nativescript.mason.masonkit.enums

enum class TextType(val value: Int) {
  None(0), P(1), Span(2), Code(3), H1(4), H2(5), H3(6), H4(7), H5(8), H6(9), Li(10), Blockquote(11), B(
    12
  ),
  Pre(13), Strong(14), Em(15), I(16), A(17);

  val cssValue: String
    get() {
      return when (this) {
        None -> "text"
        P -> "p"
        Span -> "span"
        Code -> "code"
        H1 -> "h1"
        H2 -> "h2"
        H3 -> "h3"
        H4 -> "h4"
        H5 -> "h5"
        H6 -> "h6"
        Li -> "li"
        Blockquote -> "blockquote"
        B -> "b"
        Pre -> "pre"
        Strong -> "strong"
        Em -> "em"
        I -> "i"
        A -> "A"
      }
    }

  companion object {
    fun fromInt(value: Int): TextType {
      return when (value) {
        0 -> None
        1 -> P
        2 -> Span
        3 -> Code
        4 -> H1
        5 -> H2
        6 -> H3
        7 -> H4
        8 -> H5
        9 -> H6
        10 -> Li
        11 -> Blockquote
        12 -> B
        13 -> Pre
        14 -> Strong
        15 -> Em
        16 -> I
        17 -> A
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
