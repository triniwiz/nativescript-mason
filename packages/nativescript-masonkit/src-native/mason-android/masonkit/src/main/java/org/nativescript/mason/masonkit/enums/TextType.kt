package org.nativescript.mason.masonkit.enums

enum class TextType(val value: Byte) {
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
    fun from(value: Byte): TextType {
      return when (value) {
        0.toByte() -> None
        1.toByte() -> P
        2.toByte() -> Span
        3.toByte() -> Code
        4.toByte() -> H1
        5.toByte() -> H2
        6.toByte() -> H3
        7.toByte() -> H4
        8.toByte() -> H5
        9.toByte() -> H6
        10.toByte() -> Li
        11.toByte() -> Blockquote
        12.toByte() -> B
        13.toByte() -> Pre
        14.toByte() -> Strong
        15.toByte() -> Em
        16.toByte() -> I
        17.toByte() -> A
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
