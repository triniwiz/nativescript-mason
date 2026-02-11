package org.nativescript.mason.masonkit.enums

enum class Display(val value: Byte) {
  None(0), Flex(1), Grid(2), Block(3), Inline(4), InlineBlock(5), InlineFlex(6), InlineGrid(7), ListItem(
    8
  );

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
        ListItem -> "list-item"
      }
    }

  companion object {
    fun from(value: Byte): Display {
      return when (value) {
        0.toByte() -> None
        1.toByte() -> Flex
        2.toByte() -> Grid
        3.toByte() -> Block
        4.toByte() -> Inline
        5.toByte() -> InlineBlock
        6.toByte() -> InlineFlex
        7.toByte() -> InlineGrid
        8.toByte() -> ListItem
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}
