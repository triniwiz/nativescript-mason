package org.nativescript.mason.masonkit.enums

enum class Display(val value: Int) {
  None(0), Flex(1), Grid(2), Block(3), Inline(4), InlineBlock(5), InlineFlex(6), InlineGrid(7);

  val cssValue: String
    get() {
      return when (this) {
        None -> "none"
        Flex -> "flex"
        Grid -> "grid"
        Block -> "block"
        Inline -> "inline"
        InlineBlock -> "inline-block"
        InlineFlex -> "inline-flex"
        InlineGrid -> "inline-grid"
      }
    }

  companion object {
    fun fromInt(value: Int): Display {
      return when (value) {
        0 -> None
        1 -> Flex
        2 -> Grid
        3 -> Block
        4 -> Inline
        5 -> InlineBlock
        6 -> InlineFlex
        7 -> InlineGrid
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
