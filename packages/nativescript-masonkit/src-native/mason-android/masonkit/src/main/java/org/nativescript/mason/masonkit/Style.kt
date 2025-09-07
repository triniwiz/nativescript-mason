package org.nativescript.mason.masonkit

import android.view.View
import dalvik.annotation.optimization.FastNative
import org.nativescript.mason.masonkit.Display.Block
import org.nativescript.mason.masonkit.Display.Flex
import org.nativescript.mason.masonkit.Display.Grid
import org.nativescript.mason.masonkit.Display.Inline
import org.nativescript.mason.masonkit.Display.InlineBlock
import org.nativescript.mason.masonkit.Display.InlineFlex
import org.nativescript.mason.masonkit.Display.InlineGrid
import org.nativescript.mason.masonkit.Display.None
import java.nio.ByteBuffer
import java.nio.ByteOrder


enum class TextType(val value: Int) {
  None(0), P(1), Span(2), Code(3), H1(4), H2(5), H3(6), H4(7), H5(8), H6(9), Li(10), Blockquote(11), B(
    12
  ),
  Pre(13);

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
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class AlignItems(val value: Int) {
  Normal(-1), Start(0), End(1), Center(2), Baseline(3), Stretch(4), FlexStart(5), FlexEnd(6);

  val cssValue: String
    get() {
      return when (this) {
        Normal -> "normal"
        Start -> "start"
        End -> "end"
        Center -> "center"
        Baseline -> "baseline"
        Stretch -> "stretch"
        FlexStart -> "flex-start"
        FlexEnd -> "flex-end"
      }
    }

  companion object {
    fun fromInt(value: Int): AlignItems {
      return when (value) {
        -1 -> Normal
        0 -> Start
        1 -> End
        2 -> Center
        3 -> Baseline
        4 -> Stretch
        5 -> FlexStart
        6 -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class AlignSelf(val value: Int) {
  Normal(-1), Start(0), End(1), Center(2), Baseline(3), Stretch(4), FlexStart(5), FlexEnd(6);

  val cssValue: String
    get() {
      return when (this) {
        Normal -> "normal"
        Start -> "start"
        End -> "end"
        Center -> "center"
        Baseline -> "baseline"
        Stretch -> "stretch"
        FlexStart -> "flex-start"
        FlexEnd -> "flex-end"
      }
    }

  companion object {
    fun fromInt(value: Int): AlignSelf {
      return when (value) {
        -1 -> Normal
        0 -> Start
        1 -> End
        2 -> Center
        3 -> Baseline
        4 -> Stretch
        5 -> FlexStart
        6 -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class AlignContent(val value: Int) {
  Normal(-1), Start(0), End(1), Center(2), Stretch(3), SpaceBetween(4), SpaceAround(5), SpaceEvenly(
    6
  ),
  FlexStart(7), FlexEnd(8);

  val cssValue: String
    get() {
      return when (this) {
        Normal -> "normal"
        Start -> "start"
        End -> "end"
        Center -> "center"
        Stretch -> "stretch"
        SpaceBetween -> "space-between"
        SpaceAround -> "space-around"
        SpaceEvenly -> "space-evenly"
        FlexStart -> "flex-start"
        FlexEnd -> "flex-end"
      }
    }


  companion object {
    fun fromInt(value: Int): AlignContent {
      return when (value) {
        -1 -> Normal
        0 -> Start
        1 -> End
        2 -> Center
        3 -> Stretch
        4 -> SpaceBetween
        5 -> SpaceAround
        6 -> SpaceEvenly
        7 -> FlexStart
        8 -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class Direction(val value: Int) {
  Inherit(0), LTR(1), RTL(2);

  val cssValue: String
    get() {
      return when (this) {
        Inherit -> "inherit"
        LTR -> "LTR"
        RTL -> "rtl"
      }
    }

  companion object {
    fun fromInt(value: Int): Direction {
      return when (value) {
        0 -> Inherit
        1 -> LTR
        2 -> RTL
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

internal enum class DisplayMode(val value: Int) {
  None(0), Inline(1), Box(2);

  companion object {
    fun fromInt(value: Int): DisplayMode {
      return when (value) {
        0 -> None
        1 -> Inline
        2 -> Box
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

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

enum class FlexDirection(val value: Int) {
  Row(0), Column(1), RowReverse(2), ColumnReverse(3);

  val cssValue: String
    get() {
      return when (this) {
        Row -> "row"
        Column -> "column"
        RowReverse -> "row-reverse"
        ColumnReverse -> "column-reverse"
      }
    }

  companion object {
    fun fromInt(value: Int): FlexDirection {
      return when (value) {
        0 -> Row
        1 -> Column
        2 -> RowReverse
        3 -> ColumnReverse
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class JustifySelf(val value: Int) {
  Normal(-1), Start(0), End(1), Center(2), Baseline(3), Stretch(4), FlexStart(5), FlexEnd(6);

  val cssValue: String
    get() {
      return when (this) {
        Normal -> "normal"
        Start -> "start"
        End -> "end"
        Center -> "center"
        Baseline -> "baseline"
        Stretch -> "stretch"
        FlexStart -> "flex-start"
        FlexEnd -> "flex-end"
      }
    }

  companion object {
    fun fromInt(value: Int): JustifySelf {
      return when (value) {
        -1 -> Normal
        0 -> Start
        1 -> End
        2 -> Center
        3 -> Baseline
        4 -> Stretch
        5 -> FlexStart
        6 -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class JustifyItems(val value: Int) {
  Normal(-1), Start(0), End(1), Center(2), Baseline(3), Stretch(4), FlexStart(5), FlexEnd(6);

  val cssValue: String
    get() {
      return when (this) {
        Normal -> "normal"
        Start -> "start"
        End -> "end"
        Center -> "center"
        Baseline -> "baseline"
        Stretch -> "stretch"
        FlexStart -> "flex-start"
        FlexEnd -> "flex-end"
      }
    }

  companion object {
    fun fromInt(value: Int): JustifyItems {
      return when (value) {
        -1 -> Normal
        0 -> Start
        1 -> End
        2 -> Center
        3 -> Baseline
        4 -> Stretch
        5 -> FlexStart
        6 -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class JustifyContent(val value: Int) {
  Normal(-1), Start(0), End(1), Center(2), Stretch(3), SpaceBetween(4), SpaceAround(5), SpaceEvenly(
    6
  ),
  FlexStart(7), FlexEnd(7);

  val cssValue: String
    get() {
      return when (this) {
        Normal -> "normal"
        Start -> "start"
        End -> "end"
        Center -> "center"
        Stretch -> "stretch"
        SpaceBetween -> "space-between"
        SpaceAround -> "space-around"
        SpaceEvenly -> "space-evenly"
        FlexStart -> "flex-start"
        FlexEnd -> "flex-end"
      }
    }

  companion object {
    fun fromInt(value: Int): JustifyContent {
      return when (value) {
        -1 -> Normal
        0 -> Start
        1 -> End
        2 -> Center
        3 -> Stretch
        4 -> SpaceBetween
        5 -> SpaceAround
        6 -> SpaceEvenly
        7 -> FlexStart
        8 -> FlexEnd
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class Overflow(val value: Int) {
  Visible(0), Hidden(1), Scroll(2), Clip(3), Auto(4);

  val cssValue: String
    get() {
      return when (this) {
        Visible -> "visible"
        Hidden -> "hidden"
        Scroll -> "scroll"
        Clip -> "clip"
        Auto -> "auto"
      }
    }

  companion object {
    fun fromInt(value: Int): Overflow {
      return when (value) {
        0 -> Visible
        1 -> Hidden
        2 -> Scroll
        3 -> Clip
        4 -> Auto
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class Position(val value: Int) {
  Relative(0), Absolute(1);

  val cssValue: String
    get() {
      return when (this) {
        Relative -> "relative"
        Absolute -> "absolute"
      }
    }

  companion object {
    fun fromInt(value: Int): Position {
      return when (value) {
        0 -> Relative
        1 -> Absolute
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class FlexWrap(val value: Int) {
  NoWrap(0), Wrap(1), WrapReverse(2);

  val cssValue: String
    get() {
      return when (this) {
        NoWrap -> "nowrap"
        Wrap -> "wrap"
        WrapReverse -> "wrap-reverse"
      }
    }

  companion object {
    fun fromInt(value: Int): FlexWrap {
      return when (value) {
        0 -> NoWrap
        1 -> Wrap
        2 -> WrapReverse
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class GridAutoFlow(val value: Int) {
  Row(0), Column(1), RowDense(2), ColumnDense(3);

  val cssValue: String
    get() {
      return when (this) {
        Row -> "row"
        Column -> "column"
        RowDense -> "row-dense"
        ColumnDense -> "column-dense"
      }
    }

  companion object {
    fun fromInt(value: Int): GridAutoFlow {
      return when (value) {
        0 -> Row
        1 -> Column
        2 -> RowDense
        3 -> ColumnDense
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class TextAlign(val value: Int) {
  Auto(0), Left(1), Right(2), Center(3), Justify(4), Start(5), End(6);

  val cssValue: String
    get() {
      return when (this) {
        Auto -> "auto"
        Left -> "left"
        Right -> "right"
        Center -> "center"
        Justify -> "justify"
        Start -> "start"
        End -> "end"
      }
    }

  companion object {
    fun fromInt(value: Int): TextAlign {
      return when (value) {
        0 -> Auto
        1 -> Left
        2 -> Right
        3 -> Center
        4 -> Justify
        5 -> Start
        6 -> End
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class BoxSizing(val value: Int) {
  BorderBox(0), ContentBox(1);

  val cssValue: String
    get() {
      return when (this) {
        BorderBox -> "border-box"
        ContentBox -> "content-box"
      }
    }

  companion object {
    fun fromInt(value: Int): BoxSizing {
      return when (value) {
        0 -> BorderBox
        1 -> ContentBox
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

sealed class GridPlacement {
  data object Auto : GridPlacement()
  data class Line(var value: Short) : GridPlacement()
  data class Span(var value: Short) : GridPlacement()


  companion object {
    @JvmStatic
    fun fromTypeValue(type: Int, value: Short): GridPlacement {
      return when (type) {
        0 -> Auto
        1 -> Line(value)
        2 -> Span(value)
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }


  internal val type: Int
    get() = when (this) {
      is Auto -> 0
      is Line -> 1
      is Span -> 2
    }

  internal val placementValue: Short
    get() = when (this) {
      is Auto -> 0
      is Line -> value
      is Span -> value
    }

  val jsonValue: String
    get() {
      return Mason.gson.toJson(this)
    }

  val cssValue: String
    get() {
      return when (this) {
        Auto -> "auto"
        is Line -> "$value"
        is Span -> "span $value"
      }
    }
}

sealed class GridTrackRepetition {
  data object AutoFill : GridTrackRepetition()
  data object AutoFit : GridTrackRepetition()
  data class Count(val count: Short) : GridTrackRepetition()

  val type: Int
    get() {
      return toInt()
    }

  val value: Short
    get() {
      return when (this) {
        AutoFill -> 0
        AutoFit -> 0
        is Count -> count
      }
    }

  val cssValue: String
    get() {
      return when (this) {
        AutoFill -> "auto-fill"
        AutoFit -> "auto-fit"
        is Count -> "$value"
      }
    }

  fun toInt(): Int {
    return when (this) {
      AutoFill -> 0
      AutoFit -> 1
      is Count -> 2
    }
  }

  companion object {
    @JvmStatic
    fun fromInt(type: Int, value: Short): GridTrackRepetition {
      return when (type) {
        0 -> AutoFill
        1 -> AutoFit
        2 -> Count(value)
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

sealed class TrackSizingFunction(val isRepeating: Boolean = false) {

  data class Single(val value: MinMax) : TrackSizingFunction()

  data class AutoRepeat(val gridTrackRepetition: GridTrackRepetition, val value: Array<MinMax>) :
    TrackSizingFunction(true) {

    fun gridTrackRepetitionNativeType(): Int {
      return gridTrackRepetition.toInt()
    }

    fun gridTrackRepetitionNativeValue(): Short {
      return gridTrackRepetition.value
    }

    override fun equals(other: Any?): Boolean {
      if (this === other) return true
      if (javaClass != other?.javaClass) return false

      other as AutoRepeat

      if (gridTrackRepetition != other.gridTrackRepetition) return false
      if (!value.contentEquals(other.value)) return false

      return true
    }

    override fun hashCode(): Int {
      var result = gridTrackRepetition.hashCode()
      result = 31 * result + value.contentHashCode()
      return result
    }
  }

  val cssValue: String
    get() {
      return when (this) {
        is AutoRepeat -> {
          val builder = StringBuilder("repeat(${gridTrackRepetition.cssValue}, ")
          val last = value.lastIndex
          value.forEachIndexed { index, minMax ->
            if (index == last) {
              builder.append(minMax.cssValue)
            } else {
              builder.append("${minMax.cssValue} ")
            }
          }
          builder.append(")")
          return builder.toString()
        }

        is Single -> value.cssValue
      }
    }
}

val Array<TrackSizingFunction>.jsonValue: String
  get() {
    return Mason.gson.toJson(this)
  }

val Array<TrackSizingFunction>.cssValue: String
  get() {
    if (isEmpty()) {
      return ""
    }
    val builder = StringBuilder()
    val last = this.lastIndex
    this.forEachIndexed { index, minMax ->
      if (index == last) {
        builder.append(minMax.cssValue)
      } else {
        builder.append("${minMax.cssValue} ")
      }
    }
    return builder.toString()
  }

const val BYTE_FALSE: Byte = 0

object StyleKeys {
  const val DISPLAY = 0
  const val POSITION = 4
  const val DIRECTION = 8
  const val FLEX_DIRECTION = 12
  const val FLEX_WRAP = 16
  const val OVERFLOW_X = 20
  const val OVERFLOW_Y = 24

  const val ALIGN_ITEMS = 28
  const val ALIGN_SELF = 32
  const val ALIGN_CONTENT = 36

  const val JUSTIFY_ITEMS = 40
  const val JUSTIFY_SELF = 44
  const val JUSTIFY_CONTENT = 48

  const val INSET_LEFT_TYPE = 52
  const val INSET_LEFT_VALUE = 56
  const val INSET_RIGHT_TYPE = 60
  const val INSET_RIGHT_VALUE = 64
  const val INSET_TOP_TYPE = 68
  const val INSET_TOP_VALUE = 72
  const val INSET_BOTTOM_TYPE = 76
  const val INSET_BOTTOM_VALUE = 80

  const val MARGIN_LEFT_TYPE = 84
  const val MARGIN_LEFT_VALUE = 88
  const val MARGIN_RIGHT_TYPE = 92
  const val MARGIN_RIGHT_VALUE = 96
  const val MARGIN_TOP_TYPE = 100
  const val MARGIN_TOP_VALUE = 104
  const val MARGIN_BOTTOM_TYPE = 108
  const val MARGIN_BOTTOM_VALUE = 112

  const val PADDING_LEFT_TYPE = 116
  const val PADDING_LEFT_VALUE = 120
  const val PADDING_RIGHT_TYPE = 124
  const val PADDING_RIGHT_VALUE = 128
  const val PADDING_TOP_TYPE = 132
  const val PADDING_TOP_VALUE = 136
  const val PADDING_BOTTOM_TYPE = 140
  const val PADDING_BOTTOM_VALUE = 144

  const val BORDER_LEFT_TYPE = 148
  const val BORDER_LEFT_VALUE = 152
  const val BORDER_RIGHT_TYPE = 156
  const val BORDER_RIGHT_VALUE = 160
  const val BORDER_TOP_TYPE = 164
  const val BORDER_TOP_VALUE = 168
  const val BORDER_BOTTOM_TYPE = 172
  const val BORDER_BOTTOM_VALUE = 176

  const val FLEX_GROW = 180
  const val FLEX_SHRINK = 184

  const val FLEX_BASIS_TYPE = 188
  const val FLEX_BASIS_VALUE = 192

  const val WIDTH_TYPE = 196
  const val WIDTH_VALUE = 200
  const val HEIGHT_TYPE = 204
  const val HEIGHT_VALUE = 208

  const val MIN_WIDTH_TYPE = 212
  const val MIN_WIDTH_VALUE = 216
  const val MIN_HEIGHT_TYPE = 220
  const val MIN_HEIGHT_VALUE = 224

  const val MAX_WIDTH_TYPE = 228
  const val MAX_WIDTH_VALUE = 232
  const val MAX_HEIGHT_TYPE = 236
  const val MAX_HEIGHT_VALUE = 240

  const val GAP_ROW_TYPE = 244
  const val GAP_ROW_VALUE = 248
  const val GAP_COLUMN_TYPE = 252
  const val GAP_COLUMN_VALUE = 256

  const val ASPECT_RATIO = 260
  const val GRID_AUTO_FLOW = 264
  const val GRID_COLUMN_START_TYPE = 268
  const val GRID_COLUMN_START_VALUE = 272
  const val GRID_COLUMN_END_TYPE = 276
  const val GRID_COLUMN_END_VALUE = 280
  const val GRID_ROW_START_TYPE = 284
  const val GRID_ROW_START_VALUE = 288
  const val GRID_ROW_END_TYPE = 292
  const val GRID_ROW_END_VALUE = 296
  const val SCROLLBAR_WIDTH = 300
  const val TEXT_ALIGN = 304
  const val BOX_SIZING = 308
  const val OVERFLOW = 312
  const val ITEM_IS_TABLE = 316 //Byte
  const val ITEM_IS_REPLACED = 320 //Byte
  const val DISPLAY_MODE = 324
  const val FORCE_INLINE = 328
  const val MIN_CONTENT_WIDTH = 332
  const val MIN_CONTENT_HEIGHT = 336
  const val MAX_CONTENT_WIDTH = 340
  const val MAX_CONTENT_HEIGHT = 344
}

@JvmInline
value class StateKeys internal constructor(val bits: Long) {
  companion object {
    val DISPLAY = StateKeys(1L shl 0)
    val POSITION = StateKeys(1L shl 1)
    val DIRECTION = StateKeys(1L shl 2)
    val FLEX_DIRECTION = StateKeys(1L shl 3)
    val FLEX_WRAP = StateKeys(1L shl 4)
    val OVERFLOW_X = StateKeys(1L shl 5)
    val OVERFLOW_Y = StateKeys(1L shl 6)
    val ALIGN_ITEMS = StateKeys(1L shl 7)
    val ALIGN_SELF = StateKeys(1L shl 8)
    val ALIGN_CONTENT = StateKeys(1L shl 9)
    val JUSTIFY_ITEMS = StateKeys(1L shl 10)
    val JUSTIFY_SELF = StateKeys(1L shl 11)
    val JUSTIFY_CONTENT = StateKeys(1L shl 12)
    val INSET = StateKeys(1L shl 13)
    val MARGIN = StateKeys(1L shl 14)
    val PADDING = StateKeys(1L shl 15)
    val BORDER = StateKeys(1L shl 16)
    val FLEX_GROW = StateKeys(1L shl 17)
    val FLEX_SHRINK = StateKeys(1L shl 18)
    val FLEX_BASIS = StateKeys(1L shl 19)
    val SIZE = StateKeys(1L shl 20)
    val MIN_SIZE = StateKeys(1L shl 21)
    val MAX_SIZE = StateKeys(1L shl 22)
    val GAP = StateKeys(1L shl 23)
    val ASPECT_RATIO = StateKeys(1L shl 24)
    val GRID_AUTO_FLOW = StateKeys(1L shl 25)
    val GRID_COLUMN = StateKeys(1L shl 26)
    val GRID_ROW = StateKeys(1L shl 27)
    val SCROLLBAR_WIDTH = StateKeys(1L shl 28)
    val TEXT_ALIGN = StateKeys(1L shl 29)
    val BOX_SIZING = StateKeys(1L shl 30)
    val OVERFLOW = StateKeys(1L shl 31)
    val ITEM_IS_TABLE = StateKeys(1L shl 32)
    val ITEM_IS_REPLACED = StateKeys(1L shl 33)
    val DISPLAY_MODE = StateKeys(1L shl 34)
    val FORCE_INLINE = StateKeys(1L shl 35)
    val MIN_CONTENT_WIDTH = StateKeys(1L shl 36)
    val MIN_CONTENT_HEIGHT = StateKeys(1L shl 37)
    val MAX_CONTENT_WIDTH = StateKeys(1L shl 38)
    val MAX_CONTENT_HEIGHT = StateKeys(1L shl 39)
  }

  infix fun or(other: StateKeys): StateKeys = StateKeys(bits or other.bits)
  infix fun and(other: StateKeys): StateKeys = StateKeys(bits and other.bits)
  infix fun hasFlag(flag: StateKeys): Boolean = (bits and flag.bits) != 0L
}


class Style internal constructor(private var node: Node) {
  val values: ByteBuffer = nativeGetStyleBuffer(node.mason.nativePtr, node.nativePtr).apply {
    order(ByteOrder.nativeOrder())
  }

  internal var isDirty = -1L
  private var isSlowDirty = false
    set(value) {
      if (value && !inBatch) {
        updateNativeStyle()
      }
      field = value
    }

  private fun setOrAppendState(value: StateKeys) {
    isDirty = if (isDirty == -1L) {
      value.bits
    } else {
      isDirty or value.bits
    }
    if (!inBatch) {
      updateNativeStyle()
    }
  }

  private fun resetState() {
    isDirty = -1
    isSlowDirty = false
  }

  var inBatch = false
    set(value) {
      val changed = field && !value
      field = value
      if (changed) {
        updateNativeStyle()
      }
    }

  fun configure(block: (Style) -> Unit) {
    inBatch = true
    block(this)
    inBatch = false
  }

  // allow overriding of the display
  internal var forceInline: Boolean
    get() {
      return values.getInt(StyleKeys.FORCE_INLINE) != 0
    }
    set(value) {
      values.putInt(
        StyleKeys.FORCE_INLINE, if (value) {
          1
        } else {
          0
        }
      )
      setOrAppendState(StateKeys.FORCE_INLINE)
    }

  var display: Display
    get() {
      val mode = DisplayMode.fromInt(values.getInt(StyleKeys.DISPLAY_MODE))
      return when (mode) {
        DisplayMode.None -> {
          Display.fromInt(values.getInt(StyleKeys.DISPLAY))
        }

        DisplayMode.Inline -> {
          Inline
        }

        DisplayMode.Box -> {
          when (Display.fromInt(values.getInt(StyleKeys.DISPLAY))) {
            Flex -> InlineFlex
            Grid -> InlineGrid
            Block -> InlineBlock
            else -> {
              // invalidate state
              // Block, Flex, Grid
              throw IllegalStateException("Display cannot be anything other than 0,1,2 when mode is set")
            }
          }
        }
      }
    }
    set(value) {
      if (value == Inline && !node.isTextView) {
        return
      }
      var displayMode = DisplayMode.None
      val display = when (value) {
        None, Flex, Grid, Block -> value.value
        Inline -> {
          displayMode = DisplayMode.Inline
          Block.value
        }

        InlineBlock -> {
          displayMode = DisplayMode.Box
          Block.value
        }

        InlineFlex -> {
          displayMode = DisplayMode.Box
          Flex.value
        }

        InlineGrid -> {
          displayMode = DisplayMode.Box
          Grid.value
        }
      }

      values.putInt(StyleKeys.DISPLAY_MODE, displayMode.value)
      setOrAppendState(StateKeys.DISPLAY_MODE)

      values.putInt(StyleKeys.DISPLAY, display)
      setOrAppendState(StateKeys.DISPLAY)
    }

  var position: Position
    get() {
      return Position.fromInt(values.getInt(StyleKeys.POSITION))
    }
    set(value) {
      values.putInt(StyleKeys.POSITION, value.value)
      setOrAppendState(StateKeys.POSITION)
    }

  // TODO
  var direction: Direction
    get() {
      return Direction.fromInt(values.getInt(StyleKeys.DIRECTION))
    }
    set(value) {
      values.putInt(StyleKeys.DIRECTION, value.value)
      setOrAppendState(StateKeys.DIRECTION)
    }

  var flexDirection: FlexDirection
    get() {
      return FlexDirection.fromInt(values.getInt(StyleKeys.FLEX_DIRECTION))
    }
    set(value) {
      values.putInt(StyleKeys.FLEX_DIRECTION, value.value)
      setOrAppendState(StateKeys.FLEX_DIRECTION)
    }

  var flexWrap: FlexWrap
    get() {
      return FlexWrap.fromInt(values.getInt(StyleKeys.FLEX_WRAP))
    }
    set(value) {
      values.putInt(StyleKeys.FLEX_WRAP, value.value)
      setOrAppendState(StateKeys.FLEX_WRAP)
    }

  var overflow: Overflow
    get() {
      return Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW))
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW, value.value)
      setOrAppendState(StateKeys.OVERFLOW)
    }

  var overflowX: Overflow
    get() {
      return Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW_X))
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW_X, value.value)
      setOrAppendState(StateKeys.OVERFLOW_X)
    }

  var overflowY: Overflow
    get() {
      return Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW_Y))
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW_Y, value.value)
      setOrAppendState(StateKeys.OVERFLOW_Y)
    }

  var alignItems: AlignItems
    get() {
      return AlignItems.fromInt(values.getInt(StyleKeys.ALIGN_ITEMS))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_ITEMS, value.value)
      setOrAppendState(StateKeys.ALIGN_ITEMS)
    }

  var alignSelf: AlignSelf
    get() {
      return AlignSelf.fromInt(values.getInt(StyleKeys.ALIGN_SELF))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_SELF, value.value)
      setOrAppendState(StateKeys.ALIGN_SELF)
    }

  var alignContent: AlignContent
    get() {
      return AlignContent.fromInt(values.getInt(StyleKeys.ALIGN_CONTENT))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_CONTENT, value.value)
      setOrAppendState(StateKeys.ALIGN_CONTENT)
    }


  var justifyItems: JustifyItems
    get() {
      return JustifyItems.fromInt(values.getInt(StyleKeys.JUSTIFY_ITEMS))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_ITEMS, value.value)
      setOrAppendState(StateKeys.JUSTIFY_ITEMS)
    }


  var justifySelf: JustifySelf
    get() {
      return JustifySelf.fromInt(values.getInt(StyleKeys.JUSTIFY_SELF))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_SELF, value.value)
      setOrAppendState(StateKeys.JUSTIFY_SELF)
    }

  var justifyContent: JustifyContent
    get() {
      return JustifyContent.fromInt(values.getInt(StyleKeys.JUSTIFY_CONTENT))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_CONTENT, value.value)
      setOrAppendState(StateKeys.JUSTIFY_CONTENT)
    }

  var textAlign: TextAlign
    get() {
      return TextAlign.fromInt(values.getInt(StyleKeys.TEXT_ALIGN))
    }
    set(value) {
      values.putInt(StyleKeys.TEXT_ALIGN, value.value)
      setOrAppendState(StateKeys.TEXT_ALIGN)
    }

  var boxSizing: BoxSizing
    get() {
      return BoxSizing.fromInt(values.getInt(StyleKeys.BOX_SIZING))
    }
    set(value) {
      values.putInt(StyleKeys.BOX_SIZING, value.value)
      setOrAppendState(StateKeys.BOX_SIZING)
    }


  var inset: Rect<LengthPercentageAuto>
    get() {
      return Rect(
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_LEFT_TYPE), values.getFloat(StyleKeys.INSET_LEFT_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_RIGHT_TYPE), values.getFloat(StyleKeys.INSET_RIGHT_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_TOP_TYPE), values.getFloat(StyleKeys.INSET_TOP_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_BOTTOM_TYPE), values.getFloat(StyleKeys.INSET_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {
      values.putInt(StyleKeys.INSET_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value.left.value)

      values.putInt(StyleKeys.INSET_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value.right.value)

      values.putInt(StyleKeys.INSET_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value.top.value)

      values.putInt(StyleKeys.INSET_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value.bottom.value)

      setOrAppendState(StateKeys.INSET)
    }

  fun setInsetLeft(value: Float, type: Int) {
    val left = LengthPercentageAuto.fromTypeValue(type, value)

    left?.let {
      values.putInt(StyleKeys.INSET_LEFT_TYPE, type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetRight(value: Float, type: Int) {
    val right = LengthPercentageAuto.fromTypeValue(type, value)

    right?.let {
      values.putInt(StyleKeys.INSET_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetTop(value: Float, type: Int) {
    val top = LengthPercentageAuto.fromTypeValue(type, value)

    top?.let {
      values.putInt(StyleKeys.INSET_TOP_TYPE, type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetBottom(value: Float, type: Int) {
    val bottom = LengthPercentageAuto.fromTypeValue(type, value)

    bottom?.let {
      values.putInt(StyleKeys.INSET_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetWithValueType(value: Float, type: Int) {
    val inset = LengthPercentageAuto.fromTypeValue(type, value)

    inset?.let {
      values.putInt(StyleKeys.INSET_LEFT_TYPE, type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value)

      values.putInt(StyleKeys.INSET_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value)

      values.putInt(StyleKeys.INSET_TOP_TYPE, type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value)

      values.putInt(StyleKeys.INSET_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  var margin: Rect<LengthPercentageAuto>
    get() {
      return Rect(
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_BOTTOM_TYPE),
          values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {
      values.putInt(StyleKeys.MARGIN_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value.left.value)

      values.putInt(StyleKeys.MARGIN_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value.right.value)

      values.putInt(StyleKeys.MARGIN_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value.top.value)

      values.putInt(StyleKeys.MARGIN_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value.bottom.value)

      setOrAppendState(StateKeys.MARGIN)
    }

  fun setMarginLeft(value: Float, type: Int) {
    val left = LengthPercentageAuto.fromTypeValue(type, value)

    left?.let {
      values.putInt(StyleKeys.MARGIN_LEFT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginRight(value: Float, type: Int) {
    val right = LengthPercentageAuto.fromTypeValue(type, value)

    right?.let {
      values.putInt(StyleKeys.MARGIN_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginTop(value: Float, type: Int) {
    val top = LengthPercentageAuto.fromTypeValue(type, value)

    top?.let {
      values.putInt(StyleKeys.MARGIN_TOP_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginBottom(value: Float, type: Int) {
    val bottom = LengthPercentageAuto.fromTypeValue(type, value)

    bottom?.let {
      values.putInt(StyleKeys.MARGIN_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginWithValueType(value: Float, type: Int) {
    val margin = LengthPercentageAuto.fromTypeValue(type, value)

    margin?.let {
      values.putInt(StyleKeys.MARGIN_LEFT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value)

      values.putInt(StyleKeys.MARGIN_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value)

      values.putInt(StyleKeys.MARGIN_TOP_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value)

      values.putInt(StyleKeys.MARGIN_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  var padding: Rect<LengthPercentage>
    get() {
      return Rect(
        LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.PADDING_LEFT_TYPE), values.getFloat(StyleKeys.PADDING_LEFT_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.PADDING_RIGHT_TYPE),
          values.getFloat(StyleKeys.PADDING_RIGHT_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.PADDING_TOP_TYPE), values.getFloat(StyleKeys.PADDING_TOP_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.PADDING_BOTTOM_TYPE),
          values.getFloat(StyleKeys.PADDING_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {
      values.putInt(StyleKeys.PADDING_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value.left.value)

      values.putInt(StyleKeys.PADDING_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value.right.value)

      values.putInt(StyleKeys.PADDING_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value.top.value)

      values.putInt(StyleKeys.PADDING_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value.bottom.value)
      setOrAppendState(StateKeys.PADDING)
    }

  fun setPaddingLeft(value: Float, type: Int) {
    val left = LengthPercentage.fromTypeValue(type, value)

    left?.let {
      values.putInt(StyleKeys.PADDING_LEFT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingRight(value: Float, type: Int) {
    val right = LengthPercentage.fromTypeValue(type, value)

    right?.let {
      values.putInt(StyleKeys.PADDING_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingTop(value: Float, type: Int) {
    val top = LengthPercentage.fromTypeValue(type, value)

    top?.let {
      values.putInt(StyleKeys.PADDING_TOP_TYPE, type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingBottom(value: Float, type: Int) {
    val bottom = LengthPercentage.fromTypeValue(type, value)

    bottom?.let {
      values.putInt(StyleKeys.PADDING_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingWithValueType(value: Float, type: Int) {
    val padding = LengthPercentage.fromTypeValue(type, value)

    padding?.let {
      values.putInt(StyleKeys.PADDING_LEFT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value)

      values.putInt(StyleKeys.PADDING_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value)

      values.putInt(StyleKeys.PADDING_TOP_TYPE, type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value)

      values.putInt(StyleKeys.PADDING_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  var border: Rect<LengthPercentage>
    get() {
      return Rect(
        LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.BORDER_LEFT_TYPE), values.getFloat(StyleKeys.BORDER_LEFT_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.BORDER_RIGHT_TYPE), values.getFloat(StyleKeys.BORDER_RIGHT_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.BORDER_TOP_TYPE), values.getFloat(StyleKeys.BORDER_TOP_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.BORDER_BOTTOM_TYPE),
          values.getFloat(StyleKeys.BORDER_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {
      values.putInt(StyleKeys.BORDER_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.BORDER_LEFT_VALUE, value.left.value)

      values.putInt(StyleKeys.BORDER_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.BORDER_RIGHT_VALUE, value.right.value)

      values.putInt(StyleKeys.BORDER_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.BORDER_TOP_VALUE, value.top.value)

      values.putInt(StyleKeys.BORDER_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.BORDER_BOTTOM_VALUE, value.bottom.value)
      setOrAppendState(StateKeys.BORDER)
    }

  fun setBorderLeft(value: Float, type: Int) {
    val left = LengthPercentage.fromTypeValue(type, value)

    left?.let {
      values.putInt(StyleKeys.BORDER_LEFT_TYPE, type)
      values.putFloat(StyleKeys.BORDER_LEFT_VALUE, value)
      setOrAppendState(StateKeys.BORDER)
    }
  }

  fun setBorderRight(value: Float, type: Int) {
    val right = LengthPercentage.fromTypeValue(type, value)

    right?.let {
      values.putInt(StyleKeys.BORDER_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.BORDER_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.BORDER)
    }
  }

  fun setBorderTop(value: Float, type: Int) {
    val top = LengthPercentage.fromTypeValue(type, value)

    top?.let {
      values.putInt(StyleKeys.BORDER_TOP_TYPE, type)
      values.putFloat(StyleKeys.BORDER_TOP_VALUE, value)
      setOrAppendState(StateKeys.BORDER)
    }
  }

  fun setBorderBottom(value: Float, type: Int) {
    val bottom = LengthPercentage.fromTypeValue(type, value)

    bottom?.let {
      values.putInt(StyleKeys.BORDER_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.BORDER_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.BORDER)
    }
  }

  fun setBorderWithValueType(value: Float, type: Int) {
    val border = LengthPercentage.fromTypeValue(type, value)

    border?.let {
      values.putInt(StyleKeys.BORDER_LEFT_TYPE, type)
      values.putFloat(StyleKeys.BORDER_LEFT_VALUE, value)

      values.putInt(StyleKeys.BORDER_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.BORDER_RIGHT_VALUE, value)

      values.putInt(StyleKeys.BORDER_TOP_TYPE, type)
      values.putFloat(StyleKeys.BORDER_TOP_VALUE, value)

      values.putInt(StyleKeys.BORDER_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.BORDER_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.BORDER)
    }
  }

  var flexGrow: Float
    get() {
      return values.getFloat(StyleKeys.FLEX_GROW)
    }
    set(value) {
      values.putFloat(StyleKeys.FLEX_GROW, value)
      setOrAppendState(StateKeys.FLEX_GROW)
    }

  var flexShrink: Float
    get() {
      return values.getFloat(StyleKeys.FLEX_SHRINK)
    }
    set(value) {
      values.putFloat(StyleKeys.FLEX_SHRINK, value)
      setOrAppendState(StateKeys.FLEX_SHRINK)
    }

  var flexBasis: Dimension
    get() {
      val type = values.getInt(StyleKeys.FLEX_BASIS_TYPE)
      val value = values.getFloat(StyleKeys.FLEX_BASIS_VALUE)
      // always valid
      return Dimension.fromTypeValue(type, value)!!
    }
    set(value) {
      values.putInt(StyleKeys.FLEX_BASIS_TYPE, value.type)
      values.putFloat(StyleKeys.FLEX_BASIS_VALUE, value.value)
      setOrAppendState(StateKeys.FLEX_BASIS)
    }


  var scrollBarWidth: Float
    get() {
      return values.getFloat(StyleKeys.SCROLLBAR_WIDTH)
    }
    set(value) {
      values.putFloat(StyleKeys.SCROLLBAR_WIDTH, value)
      setOrAppendState(StateKeys.SCROLLBAR_WIDTH)
    }


  fun setFlexBasis(value: Float, type: Int) {
    Dimension.fromTypeValue(type, value)?.let {
      values.putInt(StyleKeys.FLEX_BASIS_TYPE, type)
      values.putFloat(StyleKeys.FLEX_BASIS_VALUE, value)
      setOrAppendState(StateKeys.FLEX_BASIS)
    }
  }

  var minSize: Size<Dimension>
    get() {
      val widthType = values.getInt(StyleKeys.MIN_WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.MIN_WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.getInt(StyleKeys.MIN_HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.MIN_HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      values.putInt(StyleKeys.MIN_WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value.width.value)
      values.putInt(StyleKeys.MIN_HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }

  fun setMinSizeWidth(value: Float, type: Int) {
    val width = Dimension.fromTypeValue(type, value)
    width?.let {
      values.putInt(StyleKeys.MIN_WIDTH_TYPE, type)
      values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }
  }

  fun setMinSizeHeight(value: Float, type: Int) {
    val height = Dimension.fromTypeValue(type, value)
    height?.let {
      values.putInt(StyleKeys.MIN_HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }
  }


  fun setMinSizeWidth(value: Dimension) {
    values.putInt(StyleKeys.MIN_WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  fun setMinSizeHeight(value: Dimension) {
    values.putInt(StyleKeys.MIN_HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  var size: Size<Dimension>
    get() {
      val widthType = values.getInt(StyleKeys.WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.getInt(StyleKeys.HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      values.putInt(StyleKeys.WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.WIDTH_VALUE, value.width.value)

      values.putInt(StyleKeys.HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.SIZE)
    }


  fun setSizeWidth(value: Float, type: Int) {
    val width = Dimension.fromTypeValue(type, value)

    width?.let {
      values.putInt(StyleKeys.WIDTH_TYPE, type)
      values.putFloat(StyleKeys.WIDTH_VALUE, value)
      setOrAppendState(StateKeys.SIZE)
    }
  }

  fun setSizeWidth(value: Dimension) {
    values.putInt(StyleKeys.WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.SIZE)
  }

  fun setSizeHeight(value: Float, type: Int) {
    val height = Dimension.fromTypeValue(type, value)

    height?.let {
      values.putInt(StyleKeys.HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.SIZE)
    }
  }

  fun setSizeHeight(value: Dimension) {
    values.putInt(StyleKeys.HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.SIZE)
  }

  var maxSize: Size<Dimension>
    get() {
      val widthType = values.getInt(StyleKeys.MAX_WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.MAX_WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.getInt(StyleKeys.MAX_HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.MAX_HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      values.putInt(StyleKeys.MAX_WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value.width.value)
      values.putInt(StyleKeys.MAX_HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }

  fun setMaxSizeWidth(value: Float, type: Int) {
    val width = Dimension.fromTypeValue(type, value)

    width?.let {
      values.putInt(StyleKeys.MAX_WIDTH_TYPE, type)
      values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }
  }

  fun setMaxSizeHeight(value: Float, type: Int) {
    val height = Dimension.fromTypeValue(type, value)

    height?.let {
      values.putInt(StyleKeys.MAX_HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }
  }


  fun setMaxSizeWidth(value: Dimension) {
    values.putInt(StyleKeys.MAX_WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  fun setMaxSizeHeight(value: Dimension) {
    values.putInt(StyleKeys.MAX_HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  var gap: Size<LengthPercentage>
    get() {
      val widthType = values.getInt(StyleKeys.GAP_ROW_TYPE)
      val widthValue = values.getFloat(StyleKeys.GAP_ROW_VALUE)
      val width = LengthPercentage.fromTypeValue(widthType, widthValue)

      val heightType = values.getInt(StyleKeys.GAP_COLUMN_TYPE)
      val heightValue = values.getFloat(StyleKeys.GAP_COLUMN_VALUE)
      val height = LengthPercentage.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      values.putInt(StyleKeys.GAP_ROW_TYPE, value.width.type)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, value.width.value)
      values.putInt(StyleKeys.GAP_COLUMN_TYPE, value.height.type)
      values.putFloat(StyleKeys.GAP_COLUMN_VALUE, value.height.value)
      setOrAppendState(StateKeys.GAP)
    }

  fun setGap(widthValue: Float, widthType: Int, heightValue: Float, heightType: Int) {
    val width = LengthPercentage.fromTypeValue(widthType, widthValue)

    val height = LengthPercentage.fromTypeValue(heightType, heightValue)

    if (width != null && height != null) {
      values.putInt(StyleKeys.GAP_ROW_TYPE, widthType)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, widthValue)
      values.putInt(StyleKeys.GAP_COLUMN_TYPE, heightType)
      values.putFloat(StyleKeys.GAP_COLUMN_VALUE, heightValue)
      setOrAppendState(StateKeys.GAP)
    }
  }


  fun setGapRow(value: Float, type: Int) {
    val width = LengthPercentage.fromTypeValue(type, value)

    width?.let {
      values.putInt(StyleKeys.GAP_ROW_TYPE, type)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, value)
      setOrAppendState(StateKeys.GAP)
    }
  }

  fun setGapColumn(value: Float, type: Int) {
    val height = LengthPercentage.fromTypeValue(type, value)

    height?.let {
      values.putInt(StyleKeys.GAP_COLUMN_TYPE, type)
      values.putFloat(StyleKeys.GAP_COLUMN_VALUE, value)
      setOrAppendState(StateKeys.GAP)
    }
  }

  var aspectRatio: Float?
    get() {
      val value = values.getFloat(StyleKeys.ASPECT_RATIO)
      return if (value.isNaN()) {
        null
      } else {
        value
      }
    }
    set(value) {
      values.putFloat(StyleKeys.ASPECT_RATIO, value ?: Float.NaN)
      setOrAppendState(StateKeys.ASPECT_RATIO)
    }


  var gridAutoRows: Array<MinMax> = arrayOf()
    set(value) {
      field = value
      isSlowDirty = true
    }

  var gridAutoColumns: Array<MinMax> = emptyArray()
    set(value) {
      field = value
      isSlowDirty = true
    }

  var gridAutoFlow: GridAutoFlow
    get() {
      return GridAutoFlow.fromInt(values.getInt(StyleKeys.GRID_AUTO_FLOW))
    }
    set(value) {
      values.putInt(StyleKeys.GRID_AUTO_FLOW, value.value)
      setOrAppendState(StateKeys.GRID_AUTO_FLOW)
    }

  var gridColumn: Line<GridPlacement>
    get() {
      val startType = values.getInt(StyleKeys.GRID_COLUMN_START_TYPE)
      val startValue = values.getShort(StyleKeys.GRID_COLUMN_START_VALUE)
      val start = GridPlacement.fromTypeValue(startType, startValue)

      val endType = values.getInt(StyleKeys.GRID_COLUMN_END_TYPE)
      val endValue = values.getShort(StyleKeys.GRID_COLUMN_END_VALUE)
      val end = GridPlacement.fromTypeValue(endType, endValue)
      return Line(start, end)
    }
    set(value) {
      values.putInt(StyleKeys.GRID_COLUMN_START_TYPE, value.start.type)
      values.putShort(StyleKeys.GRID_COLUMN_START_VALUE, value.start.placementValue)

      values.putInt(StyleKeys.GRID_COLUMN_END_TYPE, value.end.type)
      values.putShort(StyleKeys.GRID_COLUMN_END_VALUE, value.end.placementValue)
      setOrAppendState(StateKeys.GRID_COLUMN)
    }


  var gridColumnStart: GridPlacement
    get() {
      val startType = values.getInt(StyleKeys.GRID_COLUMN_START_TYPE)
      val startValue = values.getShort(StyleKeys.GRID_COLUMN_START_VALUE)
      return GridPlacement.fromTypeValue(startType, startValue)
    }
    set(value) {
      values.putInt(StyleKeys.GRID_COLUMN_START_TYPE, value.type)
      values.putShort(StyleKeys.GRID_COLUMN_START_VALUE, value.placementValue)
      setOrAppendState(StateKeys.GRID_COLUMN)
    }

  var gridColumnEnd: GridPlacement
    get() {
      val endType = values.getInt(StyleKeys.GRID_COLUMN_END_TYPE)
      val endValue = values.getShort(StyleKeys.GRID_COLUMN_END_VALUE)
      return GridPlacement.fromTypeValue(endType, endValue)
    }
    set(value) {
      values.putInt(StyleKeys.GRID_COLUMN_END_TYPE, value.type)
      values.putShort(StyleKeys.GRID_COLUMN_END_VALUE, value.placementValue)
      setOrAppendState(StateKeys.GRID_COLUMN)
    }


  var gridRow: Line<GridPlacement>
    get() {
      val startType = values.getInt(StyleKeys.GRID_ROW_START_TYPE)
      val startValue = values.getShort(StyleKeys.GRID_ROW_START_VALUE)
      val start = GridPlacement.fromTypeValue(startType, startValue)

      val endType = values.getInt(StyleKeys.GRID_ROW_END_TYPE)
      val endValue = values.getShort(StyleKeys.GRID_ROW_END_VALUE)
      val end = GridPlacement.fromTypeValue(endType, endValue)
      return Line(start, end)
    }
    set(value) {
      values.putInt(StyleKeys.GRID_ROW_START_TYPE, value.start.type)
      values.putShort(StyleKeys.GRID_ROW_START_VALUE, value.start.placementValue)

      values.putInt(StyleKeys.GRID_ROW_END_TYPE, value.end.type)
      values.putShort(StyleKeys.GRID_ROW_END_VALUE, value.end.placementValue)
      setOrAppendState(StateKeys.GRID_ROW)
    }

  var gridRowStart: GridPlacement
    get() {
      val startType = values.getInt(StyleKeys.GRID_ROW_START_TYPE)
      val startValue = values.getShort(StyleKeys.GRID_ROW_START_VALUE)
      return GridPlacement.fromTypeValue(startType, startValue)
    }
    set(value) {
      values.putInt(StyleKeys.GRID_ROW_START_TYPE, value.type)
      values.putShort(StyleKeys.GRID_ROW_START_VALUE, value.placementValue)
      setOrAppendState(StateKeys.GRID_ROW)
    }

  var gridRowEnd: GridPlacement
    get() {
      val endType = values.getInt(StyleKeys.GRID_ROW_END_TYPE)
      val endValue = values.getShort(StyleKeys.GRID_ROW_END_VALUE)
      return GridPlacement.fromTypeValue(endType, endValue)
    }
    set(value) {
      values.putInt(StyleKeys.GRID_ROW_END_TYPE, value.type)
      values.putShort(StyleKeys.GRID_ROW_END_VALUE, value.placementValue)
      setOrAppendState(StateKeys.GRID_ROW)
    }


  var gridTemplateRows: Array<TrackSizingFunction> = emptyArray()
    set(value) {
      field = value
      isSlowDirty = true
    }

  var gridTemplateColumns: Array<TrackSizingFunction> = emptyArray()
    set(value) {
      field = value
      isSlowDirty = true
    }

  internal fun updateNativeStyle() {
    if (node.nativePtr == 0L) {
      return
    }

    if (isSlowDirty) {
      nativeUpdateWithValues(
        node.mason.nativePtr,
        node.nativePtr,
        display.value,
        position.value,
        direction.value,
        flexDirection.value,
        flexWrap.value,
        overflow.value,
        alignItems.value,
        alignSelf.value,
        alignContent.value,
        justifyItems.value,
        justifySelf.value,
        justifyContent.value,

        inset.left.type,
        inset.left.value,
        inset.right.type,
        inset.right.value,
        inset.top.type,
        inset.top.value,
        inset.bottom.type,
        inset.bottom.value,

        margin.left.type,
        margin.left.value,
        margin.right.type,
        margin.right.value,
        margin.top.type,
        margin.top.value,
        margin.bottom.type,
        margin.bottom.value,


        padding.left.type,
        padding.left.value,
        padding.right.type,
        padding.right.value,
        padding.top.type,
        padding.top.value,
        padding.bottom.type,
        padding.bottom.value,


        border.left.type,
        border.left.value,
        border.right.type,
        border.right.value,
        border.top.type,
        border.top.value,
        border.bottom.type,
        border.bottom.value,
        flexGrow,
        flexShrink,
        flexBasis.type,
        flexBasis.value,

        size.width.type,
        size.width.value,
        size.height.type,
        size.height.value,


        minSize.width.type,
        minSize.width.value,
        minSize.height.type,
        minSize.height.value,

        maxSize.width.type,
        maxSize.width.value,
        maxSize.height.type,
        maxSize.height.value,

        gap.width.type,
        gap.width.value,
        gap.height.type,
        gap.height.value,
        aspectRatio ?: Float.NaN,
        gridAutoRows,
        gridAutoColumns,
        gridAutoFlow.value,

        gridColumn.start.type,
        gridColumn.start.placementValue,
        gridColumn.end.type,
        gridColumn.end.placementValue,

        gridRow.start.type,
        gridRow.start.placementValue,
        gridRow.end.type,
        gridRow.end.placementValue,
        gridTemplateRows,
        gridTemplateColumns,
        overflowX.value,
        overflowY.value,
        scrollBarWidth,
        textAlign.value,
        boxSizing.value
      )
      resetState()
      when (val data = node.owner?.data) {
        is TextView -> {
          data.invalidateView()
        }

        is org.nativescript.mason.masonkit.View -> {
          data.invalidateLayout()
        }

        is View -> {
          data.requestLayout()
        }
      }
      return
    }

    if (isDirty != -1L) {

      resetState()
      when (val data = node.owner?.data) {
        is TextView -> {
          data.invalidateView()
        }
        is Scroll -> {
        }
        is org.nativescript.mason.masonkit.View -> {
          data.invalidateLayout()
        }

        is View -> {
          data.requestLayout()
        }
      }
      return
    }
  }

  fun getNativeMargins(): Rect<LengthPercentageAuto> {

    var marginLeft: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginRight: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginTop: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginBottom: LengthPercentageAuto = LengthPercentageAuto.Auto

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
    )?.let {
      marginLeft = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
    )?.let {
      marginRight = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
    )?.let {
      marginTop = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_BOTTOM_TYPE), values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
    )?.let {
      marginBottom = it
    }

    return Rect(marginLeft, marginRight, marginTop, marginBottom)
  }

  fun getNativeSize(): Size<Dimension> {
    val width = Dimension.fromTypeValue(
      values.getInt(StyleKeys.WIDTH_TYPE), values.getFloat(StyleKeys.WIDTH_VALUE)
    )
    val height = Dimension.fromTypeValue(
      values.getInt(StyleKeys.HEIGHT_TYPE), values.getFloat(StyleKeys.HEIGHT_VALUE)
    )
    return Size(width as Dimension, height as Dimension)
  }

  override fun toString(): String {
    var ret = "(MasonStyle)("
    ret += "display: ${display.cssValue}, \n"
    ret += "position: ${position.cssValue}, \n"
    ret += "inset: ${inset.cssValue}, \n"
    ret += "flexDirection: ${flexDirection.cssValue}, \n"
    ret += "flexWrap: ${flexWrap.cssValue}, \n"
    ret += "overflow: ${overflow.cssValue}, \n"
    ret += "alignItems: ${alignItems.cssValue}, \n"
    ret += "alignSelf: ${alignSelf.cssValue}, \n"
    ret += "alignContent: ${alignContent.cssValue}, \n"
    ret += "justifyItems: ${justifyItems.cssValue}, \n"
    ret += "justifySelf: ${justifySelf.cssValue}, \n"
    ret += "justifyContent: ${justifyContent.cssValue}, \n"
    ret += "margin: ${margin.cssValue}, \n"
    ret += "padding: ${padding.cssValue}, \n"
    ret += "border: ${border.cssValue}, \n"
    ret += "gap: ${gap.cssValue}, \n"
    ret += "flexGrow: ${flexGrow}, \n"
    ret += "flexShrink: ${flexShrink}, \n"
    ret += "flexBasis: ${flexBasis.cssValue}, \n"
    ret += "size: ${size.cssValue}, \n"
    ret += "minSize: ${minSize.cssValue}, \n"
    ret += "maxSize: ${maxSize.cssValue}, \n"
    ret += "aspectRatio: ${
      if (aspectRatio == null) {
        "undefined"
      } else {
        aspectRatio
      }
    }, \n"
    ret += "gridAutoRows: ${
      gridAutoRows.cssValue
    }, \n"
    ret += "gridAutoColumns: ${gridAutoColumns.cssValue}, \n"
    ret += "gridColumn: ${
      if (gridColumn.start == gridColumn.end) {
        gridColumn.start.cssValue
      } else {
        "${gridColumn.start.cssValue} \\ ${gridColumn.end.cssValue}"
      }
    }, \n"
    ret += "gridRow: ${
      if (gridRow.start == gridRow.end) {
        gridRow.start.cssValue
      } else {
        "${gridRow.start.cssValue} \\ ${gridRow.end.cssValue}"
      }
    }, \n"
    ret += "gridTemplateRows: ${gridTemplateRows.cssValue}, \n"
    ret += "gridTemplateColumns: ${gridTemplateColumns.cssValue} \n"

    ret += "overflowX: ${overflowX.cssValue} \n"
    ret += "overflowY: ${overflowY.cssValue} \n"
    ret += "scrollBarWidth: $scrollBarWidth \n"
    ret += "textAlign: ${textAlign.cssValue} \n"
    ret += "boxSizing: ${boxSizing.cssValue} \n"
    ret += ")"

    return ret
  }


  companion object {
    init {
      Mason.initLib()
    }

    @FastNative
    @JvmStatic
    external fun nativeGetStyleBuffer(
      mason: Long,
      node: Long,
    ): ByteBuffer


    @JvmStatic
    external fun nativeNonBufferData(
      mason: Long,
      node: Long,
      gridAutoRows: Array<MinMax>,
      gridAutoColumns: Array<MinMax>,
      gridTemplateRows: Array<TrackSizingFunction>,
      gridTemplateColumns: Array<TrackSizingFunction>
    )

    @JvmStatic
    external fun nativeUpdateWithValues(
      mason: Long,
      node: Long,
      display: Int,
      position: Int,
      direction: Int,
      flexDirection: Int,
      flexWrap: Int,
      overflow: Int,
      alignItems: Int,
      alignSelf: Int,
      alignContent: Int,
      justifyItems: Int,
      justifySelf: Int,
      justifyContent: Int,

      insetLeftType: Int,
      insetLeftValue: Float,
      insetRightType: Int,
      insetRightValue: Float,
      insetTopType: Int,
      insetTopValue: Float,
      insetBottomType: Int,
      insetBottomValue: Float,

      marginLeftType: Int,
      marginLeftValue: Float,
      marginRightType: Int,
      marginRightValue: Float,
      marginTopType: Int,
      marginTopValue: Float,
      marginBottomType: Int,
      marginBottomValue: Float,

      paddingLeftType: Int,
      paddingLeftValue: Float,
      paddingRightType: Int,
      paddingRightValue: Float,
      paddingTopType: Int,
      paddingTopValue: Float,
      paddingBottomType: Int,
      paddingBottomValue: Float,

      borderLeftType: Int,
      borderLeftValue: Float,
      borderRightType: Int,
      borderRightValue: Float,
      borderTopType: Int,
      borderTopValue: Float,
      borderBottomType: Int,
      borderBottomValue: Float,

      flexGrow: Float,
      flexShrink: Float,

      flexBasisType: Int,
      flexBasisValue: Float,

      widthType: Int,
      widthValue: Float,
      heightType: Int,
      heightValue: Float,

      minWidthType: Int,
      minWidthValue: Float,
      minHeightType: Int,
      minHeightValue: Float,

      maxWidthType: Int,
      maxWidthValue: Float,
      maxHeightType: Int,
      maxHeightValue: Float,

      gapRowType: Int,
      gapRowValue: Float,
      gapColumnType: Int,
      gapColumnValue: Float,

      aspectRatio: Float,

      gridAutoRows: Array<MinMax>,
      gridAutoColumns: Array<MinMax>,
      gridAutoFlow: Int,
      gridColumnStartType: Int,
      gridColumnStartValue: Short,
      gridColumnEndType: Int,
      gridColumnEndValue: Short,
      gridRowStartType: Int,
      gridRowStartValue: Short,
      gridRowEndType: Int,
      gridRowEndValue: Short,
      gridTemplateRows: Array<TrackSizingFunction>,
      gridTemplateColumns: Array<TrackSizingFunction>,
      overflowX: Int,
      overflowY: Int,
      scrollBarWidth: Float,
      textAlign: Int,
      boxSizing: Int,
    )
  }
}
