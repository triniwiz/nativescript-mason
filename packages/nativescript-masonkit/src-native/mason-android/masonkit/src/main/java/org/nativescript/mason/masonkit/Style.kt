package org.nativescript.mason.masonkit

import android.util.Log
import java.nio.ByteBuffer
import java.nio.ByteOrder


enum class AlignItems(val value: Int) {
  Normal(-1),
  Start(0),
  End(1),
  Center(2),
  Baseline(3),
  Stretch(4),
  FlexStart(5),
  FlexEnd(6);

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
  Normal(-1),
  Start(0),
  End(1),
  Center(2),
  Baseline(3),
  Stretch(4),
  FlexStart(5),
  FlexEnd(6);

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
  Normal(-1),
  Start(0),
  End(1),
  Center(2),
  Stretch(3),
  SpaceBetween(4),
  SpaceAround(5),
  SpaceEvenly(6),
  FlexStart(7),
  FlexEnd(8);

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
  Inherit(0),
  LTR(1),
  RTL(2);

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

enum class Display(val value: Int) {
  None(0),
  Flex(1),
  Grid(2),
  Block(3);

  val cssValue: String
    get() {
      return when (this) {
        None -> "none"
        Flex -> "flex"
        Grid -> "grid"
        Block -> "block"
      }
    }

  companion object {
    fun fromInt(value: Int): Display {
      return when (value) {
        0 -> None
        1 -> Flex
        2 -> Grid
        3 -> Block
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class FlexDirection(val value: Int) {
  Row(0),
  Column(1),
  RowReverse(2),
  ColumnReverse(3);

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
  Normal(-1),
  Start(0),
  End(1),
  Center(2),
  Baseline(3),
  Stretch(4),
  FlexStart(5),
  FlexEnd(6);

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
  Normal(-1),
  Start(0),
  End(1),
  Center(2),
  Baseline(3),
  Stretch(4),
  FlexStart(5),
  FlexEnd(6);

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
  Normal(-1),
  Start(0),
  End(1),
  Center(2),
  Stretch(3),
  SpaceBetween(4),
  SpaceAround(5),
  SpaceEvenly(6),
  FlexStart(7),
  FlexEnd(7);

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
  Unset(-1),
  Visible(0),
  Hidden(1),
  Scroll(2);

  val cssValue: String
    get() {
      return when (this) {
        Unset -> "unset"
        Visible -> "visible"
        Hidden -> "hidden"
        Scroll -> "scroll"
      }
    }

  companion object {
    fun fromInt(value: Int): Overflow {
      return when (value) {
        -1 -> Unset
        0 -> Visible
        1 -> Hidden
        2 -> Scroll
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class Position(val value: Int) {
  Relative(0),
  Absolute(1);

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
  NoWrap(0),
  Wrap(1),
  WrapReverse(2);

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
  Row(0),
  Column(1),
  RowDense(2),
  ColumnDense(3);

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
  Auto(0),
  LegacyLeft(1),
  LegacyRight(2),
  LegacyCenter(3);

  val cssValue: String
    get() {
      return when (this) {
        Auto -> "auto"
        LegacyLeft -> "left"
        LegacyRight -> "right"
        LegacyCenter -> "center"
      }
    }

  companion object {
    fun fromInt(value: Int): TextAlign {
      return when (value) {
        0 -> Auto
        1 -> LegacyLeft
        2 -> LegacyRight
        3 -> LegacyCenter
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class BoxSizing(val value: Int) {
  BorderBox(0),
  ContentBox(1);

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
  object Auto : GridPlacement()
  data class Line(var value: Short) : GridPlacement()
  data class Span(var value: Short) : GridPlacement()


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
  object AutoFill : GridTrackRepetition()
  object AutoFit : GridTrackRepetition()
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
    builder.append(")")
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
  const val GRID_COLUMN_END_TYPE = 274
  const val GRID_COLUMN_END_VALUE = 278
  const val GRID_ROW_START_TYPE = 280
  const val GRID_ROW_START_VALUE = 284
  const val GRID_ROW_END_TYPE = 286
  const val GRID_ROW_END_VALUE = 290
  const val SCROLLBAR_WIDTH = 292
  const val TEXT_ALIGN = 296
  const val BOX_SIZING = 300
  const val OVERFLOW = 304
  const val ITEM_IS_TABLE = 308 //Byte
}


//grid_auto_rows: jobjectArray,
//grid_auto_columns: jobjectArray,
//
//grid_template_rows: jobjectArray,
//grid_template_columns: jobjectArray,
//
//
//
//
//
//
//class me {
//  init {
//    val buffer = ByteBuffer.allocate(10)
//    val buffer = ByteBuffer.allocate(21)
//    buffer.putInt(3);
//    val display = buffer.getInt(StyleKeys.DISPLAY)
//
//    buffer.put(StyleKeys.item_is_table, 1);
//    val item_is_table = buffer.get(StyleKeys.item_is_table) != BYTE_FALSE;
//
//    println("$display is table ?? $item_is_table")
//
//
//  }
//}


class Style internal constructor(private var node: Node) {
  internal var isDirty = false

  // Capacity is last StyleKeys key + byte size e.g ITEM_IS_TABLE is short
  val values: ByteBuffer = ByteBuffer.allocateDirect(StyleKeys.ITEM_IS_TABLE + 2).apply {
    this.order(ByteOrder.nativeOrder())
  }

  init {
    nativeUpdateStyleBuffer(node.mason.nativePtr, node.nativePtr, values)
  }

  var display: Display
    get() {
      return Display.fromInt(values.getInt(StyleKeys.DISPLAY))
    }
    set(value) {
      values.putInt(StyleKeys.DISPLAY, value.value)
      isDirty = true
    }

  var position: Position
    get() {
      return Position.fromInt(values.getInt(StyleKeys.POSITION))
    }
    set(value) {
      values.putInt(StyleKeys.POSITION, value.value)
      isDirty = true
    }

  // TODO
  var direction: Direction
    get() {
      return Direction.fromInt(values.getInt(StyleKeys.DIRECTION))
    }
    set(value) {
      values.putInt(StyleKeys.DIRECTION, value.value)
      isDirty = true
    }

  var flexDirection: FlexDirection
    get() {
      return FlexDirection.fromInt(values.getInt(StyleKeys.FLEX_DIRECTION))
    }
    set(value) {
      values.putInt(StyleKeys.FLEX_DIRECTION, value.value)
      isDirty = true
    }

  var flexWrap: FlexWrap
    get() {
      return FlexWrap.fromInt(values.getInt(StyleKeys.FLEX_WRAP))
    }
    set(value) {
      values.putInt(StyleKeys.FLEX_WRAP, value.value)
      isDirty = true
    }

  var overflow: Overflow
    get() {
      return Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW))
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW, value.value)
      isDirty = true
    }

  var overflowX: Overflow
    get() {
      return Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW_X))
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW_X, value.value)
      isDirty = true
    }

  var overflowY: Overflow
    get() {
      return Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW_Y))
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW_Y, value.value)
      isDirty = true
    }

  var alignItems: AlignItems
    get() {
      return AlignItems.fromInt(values.getInt(StyleKeys.ALIGN_ITEMS))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_ITEMS, value.value)
      isDirty = true
    }

  var alignSelf: AlignSelf
    get() {
      return AlignSelf.fromInt(values.getInt(StyleKeys.ALIGN_SELF))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_SELF, value.value)
      isDirty = true
    }

  var alignContent: AlignContent
    get() {
      return AlignContent.fromInt(values.getInt(StyleKeys.ALIGN_CONTENT))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_CONTENT, value.value)
      isDirty = true
    }


  var justifyItems: JustifyItems
    get() {
      return JustifyItems.fromInt(values.getInt(StyleKeys.JUSTIFY_ITEMS))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_ITEMS, value.value)
      isDirty = true
    }


  var justifySelf: JustifySelf
    get() {
      return JustifySelf.fromInt(values.getInt(StyleKeys.JUSTIFY_SELF))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_SELF, value.value)
      isDirty = true
    }

  var justifyContent: JustifyContent
    get() {
      return JustifyContent.fromInt(values.getInt(StyleKeys.JUSTIFY_CONTENT))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_CONTENT, value.value)
      isDirty = true
    }

  var textAlign: TextAlign = TextAlign.Auto
    set(value) {
      field = value
      isDirty = true
    }

  var boxSizing: BoxSizing
    get() {
      return BoxSizing.fromInt(values.getInt(StyleKeys.BOX_SIZING))
    }
    set(value) {
      values.putInt(StyleKeys.BOX_SIZING, value.value)
      isDirty = true
    }


  var inset: Rect<LengthPercentageAuto>
    get() {
      return Rect(
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_LEFT_TYPE),
          values.getFloat(StyleKeys.INSET_LEFT_VALUE)
        )!!,
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_RIGHT_TYPE),
          values.getFloat(StyleKeys.INSET_RIGHT_VALUE)
        )!!,
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_TOP_TYPE),
          values.getFloat(StyleKeys.INSET_TOP_VALUE)
        )!!,
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_BOTTOM_TYPE),
          values.getFloat(StyleKeys.INSET_BOTTOM_VALUE)
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

      isDirty = true
    }

  fun setInsetLeft(value: Float, type: Int) {
    val left = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    left?.let {
      values.putInt(StyleKeys.INSET_LEFT_TYPE, type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value)
    }
  }

  fun setInsetRight(value: Float, type: Int) {
    val right = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    right?.let {
      values.putInt(StyleKeys.INSET_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value)
    }
  }

  fun setInsetTop(value: Float, type: Int) {
    val top = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    top?.let {
      values.putInt(StyleKeys.INSET_TOP_TYPE, type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value)
    }
  }

  fun setInsetBottom(value: Float, type: Int) {
    val bottom = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    bottom?.let {
      values.putInt(StyleKeys.INSET_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value)
    }
  }

  fun setInsetWithValueType(value: Float, type: Int) {
    val inset = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    inset?.let {
      values.putInt(StyleKeys.INSET_LEFT_TYPE, type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value)

      values.putInt(StyleKeys.INSET_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value)

      values.putInt(StyleKeys.INSET_TOP_TYPE, type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value)

      values.putInt(StyleKeys.INSET_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value)

    }
  }

  var margin: Rect<LengthPercentageAuto>
    get() {
      return Rect(
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_LEFT_TYPE),
          values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
        )!!,
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_RIGHT_TYPE),
          values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
        )!!,
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_TOP_TYPE),
          values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
        )!!,
        LengthPercentageAuto.fromTypeValue(
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
      isDirty = true
    }

  fun setMarginLeft(value: Float, type: Int) {
    val left = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    left?.let {
      values.putInt(StyleKeys.MARGIN_LEFT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value)
    }
  }

  fun setMarginRight(value: Float, type: Int) {
    val right = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    right?.let {
      values.putInt(StyleKeys.MARGIN_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value)
    }
  }

  fun setMarginTop(value: Float, type: Int) {
    val top = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    top?.let {
      values.putInt(StyleKeys.MARGIN_TOP_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value)
    }
  }

  fun setMarginBottom(value: Float, type: Int) {
    val bottom = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    bottom?.let {
      values.putInt(StyleKeys.MARGIN_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value)
    }
  }

  fun setMarginWithValueType(value: Float, type: Int) {
    val margin = when (type) {
      0 -> LengthPercentageAuto.Auto
      1 -> LengthPercentageAuto.Points(value)
      2 -> LengthPercentageAuto.Percent(value)
      else -> null
    }

    margin?.let {
      values.putInt(StyleKeys.MARGIN_LEFT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value)

      values.putInt(StyleKeys.MARGIN_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value)

      values.putInt(StyleKeys.MARGIN_TOP_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value)

      values.putInt(StyleKeys.MARGIN_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value)
    }
  }

  var padding: Rect<LengthPercentage> = LengthPercentageZeroRect
    set(value) {
      field = value
      isDirty = true
    }

  fun setPaddingLeft(value: Float, type: Int) {
    val left = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    left?.let {
      padding = Rect(it, padding.right, padding.top, padding.bottom)
    }
  }

  fun setPaddingRight(value: Float, type: Int) {
    val right = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    right?.let {
      padding = Rect(padding.left, right, padding.top, padding.bottom)
    }
  }

  fun setPaddingTop(value: Float, type: Int) {
    val top = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    top?.let {
      padding = Rect(padding.left, padding.right, top, padding.bottom)
    }
  }

  fun setPaddingBottom(value: Float, type: Int) {
    val bottom = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    bottom?.let {
      padding = Rect(padding.left, padding.right, padding.top, bottom)
    }
  }

  fun setPaddingWithValueType(value: Float, type: Int) {
    val padding = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    padding?.let {
      this.padding = Rect(it, it, it, it)
    }
  }

  var border: Rect<LengthPercentage> = LengthPercentageZeroRect
    set(value) {
      field = value
      isDirty = true
    }

  fun setBorderLeft(value: Float, type: Int) {
    val left = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    left?.let {
      border = Rect(it, border.right, border.top, border.bottom)
    }
  }

  fun setBorderRight(value: Float, type: Int) {
    val right = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    right?.let {
      border = Rect(border.left, right, border.top, border.bottom)
    }
  }

  fun setBorderTop(value: Float, type: Int) {
    val top = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    top?.let {
      border = Rect(border.left, border.right, top, border.bottom)
    }
  }

  fun setBorderBottom(value: Float, type: Int) {
    val bottom = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    bottom?.let {
      border = Rect(border.left, border.right, border.top, bottom)
    }
  }

  fun setBorderWithValueType(value: Float, type: Int) {
    val border = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    border?.let {
      this.border = Rect(it, it, it, it)
    }
  }

  var flexGrow: Float = 0f
    set(value) {
      field = value
      isDirty = true
    }

  var flexShrink: Float = 1f
    set(value) {
      field = value
      isDirty = true
    }

  var flexBasis: Dimension = Dimension.Auto
    set(value) {
      field = value
      isDirty = true
    }


  var scrollBarWidth: Dimension = Dimension.Points(0f)
    set(value) {
      field = value
      isDirty = true
    }

  fun setScrollBarWidth(value: Float) {
    scrollBarWidth = Dimension.Points(value)
  }


  fun setFlexBasis(value: Float, type: Int) {
    when (type) {
      0 -> Dimension.Auto
      1 -> Dimension.Points(value)
      2 -> Dimension.Percent(value)
      else -> null
    }?.let {
      flexBasis = it
    }
  }

  var minSize: Size<Dimension> = autoSize
    set(value) {
      field = value
      isDirty = true
    }

  fun setMinSizeWidth(value: Float, type: Int) {
    val width = when (type) {
      0 -> Dimension.Auto
      1 -> Dimension.Points(value)
      2 -> Dimension.Percent(value)
      else -> null
    }

    width?.let {
      minSize = Size(it, minSize.height)
    }
  }

  fun setMinSizeHeight(value: Float, type: Int) {
    val height = when (type) {
      0 -> Dimension.Auto
      1 -> Dimension.Points(value)
      2 -> Dimension.Percent(value)
      else -> null
    }


    height?.let {
      minSize = Size(minSize.width, it)
    }
  }


  fun setMinSizeWidth(value: Dimension) {
    minSize = Size(value, minSize.height)
  }

  fun setMinSizeHeight(value: Dimension) {
    minSize = Size(minSize.width, value)
  }


  fun setSizeWidth(value: Float, type: Int) {
    val width = when (type) {
      0 -> Dimension.Auto
      1 -> Dimension.Points(value)
      2 -> Dimension.Percent(value)
      else -> null
    }

    width?.let {
      size = Size(it, size.height)
    }
  }

  fun setSizeWidth(value: Dimension) {
    size = Size(value, size.height)
  }

  fun setSizeHeight(value: Float, type: Int) {
    val height = when (type) {
      0 -> Dimension.Auto
      1 -> Dimension.Points(value)
      2 -> Dimension.Percent(value)
      else -> null
    }

    height?.let {
      size = Size(size.width, it)
    }
  }

  fun setSizeHeight(value: Dimension) {
    size = Size(size.width, value)
  }

  var maxSize: Size<Dimension> = autoSize
    set(value) {
      field = value
      isDirty = true
    }

  fun setMaxSizeWidth(value: Float, type: Int) {
    val width = when (type) {
      0 -> Dimension.Auto
      1 -> Dimension.Points(value)
      2 -> Dimension.Percent(value)
      else -> null
    }

    width?.let {
      maxSize = Size(it, maxSize.height)
    }
  }

  fun setMaxSizeHeight(value: Float, type: Int) {
    val height = when (type) {
      0 -> Dimension.Auto
      1 -> Dimension.Points(value)
      2 -> Dimension.Percent(value)
      else -> null
    }

    height?.let {
      maxSize = Size(maxSize.width, it)
    }
  }


  fun setMaxSizeWidth(value: Dimension) {
    maxSize = Size(value, maxSize.height)
  }

  fun setMaxSizeHeight(value: Dimension) {
    maxSize = Size(maxSize.width, value)
  }

  var gap: Size<LengthPercentage> = LengthPercentageZeroSize
    set(value) {
      field = value
      isDirty = true
    }

  fun setGap(width_value: Float, width_type: Int, height_value: Float, height_type: Int) {
    val width = when (width_type) {
      0 -> LengthPercentage.Points(width_value)
      1 -> LengthPercentage.Percent(width_value)
      else -> null
    }

    val height = when (height_type) {
      0 -> LengthPercentage.Points(height_value)
      1 -> LengthPercentage.Percent(height_value)
      else -> null
    }

    if (width != null && height != null) {
      gap = Size(width, height)
    }
  }


  fun setGapRow(value: Float, type: Int) {
    val width = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    width?.let {
      gap = Size(it, gap.height)
    }
  }

  fun setGapColumn(value: Float, type: Int) {
    val height = when (type) {
      0 -> LengthPercentage.Points(value)
      1 -> LengthPercentage.Percent(value)
      else -> null
    }

    height?.let {
      gap = Size(gap.width, it)
    }
  }

  var aspectRatio: Float? = null
    set(value) {
      field = value
      isDirty = true
    }


  var gridAutoRows: Array<MinMax> = emptyArray()
    set(value) {
      field = value
      isDirty = true
    }

  var gridAutoColumns: Array<MinMax> = emptyArray()
    set(value) {
      field = value
      isDirty = true
    }

  var gridAutoFlow: GridAutoFlow = GridAutoFlow.Row
    set(value) {
      field = value
      isDirty = true
    }

  var gridColumn: Line<GridPlacement> = Line(GridPlacement.Auto, GridPlacement.Auto)
    set(value) {
      field = value
      isDirty = true
    }


  var gridColumnStart: GridPlacement
    get() {
      return gridColumn.start
    }
    set(value) {
      gridColumn = Line(value, gridColumn.end)
    }

  var gridColumnEnd: GridPlacement
    get() {
      return gridColumn.end
    }
    set(value) {
      gridColumn = Line(gridColumn.start, value)
    }


  var gridRow: Line<GridPlacement> = Line(GridPlacement.Auto, GridPlacement.Auto)
    set(value) {
      field = value
      isDirty = true
    }

  var gridRowStart: GridPlacement
    get() {
      return gridRow.start
    }
    set(value) {
      gridRow = Line(value, gridRow.end)
    }

  var gridRowEnd: GridPlacement
    get() {
      return gridRow.end
    }
    set(value) {
      gridRow = Line(gridRow.start, value)
    }


  var gridTemplateRows: Array<TrackSizingFunction> = emptyArray()
    set(value) {
      field = value
      isDirty = true
    }

  var gridTemplateColumns: Array<TrackSizingFunction> = emptyArray()
    set(value) {
      field = value
      isDirty = true
    }

  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
//    Log.d("com.test", "style finalize: $nativePtr")
//    nativeDestroy(nativePtr)
//    nativePtr = 0
  }


  internal fun updateNativeStyle() {
    if (node.nativePtr == 0L) {
      return
    }
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
      scrollBarWidth.value,
      textAlign.value,
      boxSizing.value
    )
  }

  internal fun updateStyle(
    display: Int,
    position: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyContent: Int,
    insetLeftType: Int,
    insetLeftValue: Float,
    insetEndType: Int,
    insetEndValue: Float,
    insetTopType: Int,
    insetTopValue: Float,
    insetBottomType: Int,
    insetBottomValue: Float,
    marginLeftType: Int,
    marginLeftValue: Float,
    marginEndType: Int,
    marginEndValue: Float,
    marginTopType: Int,
    marginTopValue: Float,
    marginBottomType: Int,
    marginBottomValue: Float,
    paddingLeftType: Int,
    paddingLeftValue: Float,
    paddingEndType: Int,
    paddingEndValue: Float,
    paddingTopType: Int,
    paddingTopValue: Float,
    paddingBottomType: Int,
    paddingBottomValue: Float,
    borderLeftType: Int,
    borderLeftValue: Float,
    borderEndType: Int,
    borderEndValue: Float,
    borderTopType: Int,
    borderTopValue: Float,
    borderBottomType: Int,
    borderBottomValue: Float,
    flexGrow: Float,
    flexShrink: Float,
    flexBasisType: Int,
    flexBasisValue: Float,
    sizeWidthType: Int,
    sizeWidthValue: Float,
    sizeHeightType: Int,
    sizeHeightValue: Float,
    minSizeWidthType: Int,
    minSizeWidthValue: Float,
    minSizeHeightType: Int,
    minSizeHeightValue: Float,
    maxSizeWidthType: Int,
    maxSizeWidthValue: Float,
    maxSizeHeightType: Int,
    maxSizeHeightValue: Float,
    gapRowType: Int,
    gapRowValue: Float,
    gapColumnType: Int,
    gapColumnValue: Float,
    aspectRatio: Float,
    textAlign: Int,
    boxSizing: Int,
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
  ) {
    this.display = Display.fromInt(display)
    this.position = Position.fromInt(position)
    this.flexDirection = FlexDirection.fromInt(flexDirection)
    this.flexWrap = FlexWrap.fromInt(flexWrap)
    this.overflow = Overflow.fromInt(overflow)
    this.alignItems = AlignItems.fromInt(alignItems)
    this.alignSelf = AlignSelf.fromInt(alignSelf)
    this.alignContent = AlignContent.fromInt(alignContent)
    this.justifyContent = JustifyContent.fromInt(justifyContent)

    var insetLeft: LengthPercentageAuto = LengthPercentageAuto.Auto
    var insetEnd: LengthPercentageAuto = LengthPercentageAuto.Auto
    var insetTop: LengthPercentageAuto = LengthPercentageAuto.Auto
    var insetBottom: LengthPercentageAuto = LengthPercentageAuto.Auto

    LengthPercentageAuto.fromTypeValue(insetLeftType, insetLeftValue)?.let {
      insetLeft = it
    }

    LengthPercentageAuto.fromTypeValue(insetEndType, insetEndValue)?.let {
      insetEnd = it
    }

    LengthPercentageAuto.fromTypeValue(insetTopType, insetTopValue)?.let {
      insetTop = it
    }

    LengthPercentageAuto.fromTypeValue(insetBottomType, insetBottomValue)?.let {
      insetBottom = it
    }

    inset = Rect(insetLeft, insetEnd, insetTop, insetBottom)

    var marginLeft: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginEnd: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginTop: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginBottom: LengthPercentageAuto = LengthPercentageAuto.Auto

    LengthPercentageAuto.fromTypeValue(marginLeftType, marginLeftValue)?.let {
      marginLeft = it
    }

    LengthPercentageAuto.fromTypeValue(marginEndType, marginEndValue)?.let {
      marginEnd = it
    }

    LengthPercentageAuto.fromTypeValue(marginTopType, marginTopValue)?.let {
      marginTop = it
    }

    LengthPercentageAuto.fromTypeValue(marginBottomType, marginBottomValue)?.let {
      marginBottom = it
    }

    margin = Rect(marginLeft, marginEnd, marginTop, marginBottom)

    var paddingLeft: LengthPercentage = LengthPercentage.Zero
    var paddingEnd: LengthPercentage = LengthPercentage.Zero
    var paddingTop: LengthPercentage = LengthPercentage.Zero
    var paddingBottom: LengthPercentage = LengthPercentage.Zero

    LengthPercentage.fromTypeValue(paddingLeftType, paddingLeftValue)?.let {
      paddingLeft = it
    }

    LengthPercentage.fromTypeValue(paddingEndType, paddingEndValue)?.let {
      paddingEnd = it
    }

    LengthPercentage.fromTypeValue(paddingTopType, paddingTopValue)?.let {
      paddingTop = it
    }

    LengthPercentage.fromTypeValue(paddingBottomType, paddingBottomValue)?.let {
      paddingBottom = it
    }

    padding = Rect(paddingLeft, paddingEnd, paddingTop, paddingBottom)

    var borderLeft: LengthPercentage = LengthPercentage.Zero
    var borderEnd: LengthPercentage = LengthPercentage.Zero
    var borderTop: LengthPercentage = LengthPercentage.Zero
    var borderBottom: LengthPercentage = LengthPercentage.Zero

    LengthPercentage.fromTypeValue(borderLeftType, borderLeftValue)?.let {
      borderLeft = it
    }

    LengthPercentage.fromTypeValue(borderEndType, borderEndValue)?.let {
      borderEnd = it
    }

    LengthPercentage.fromTypeValue(borderTopType, borderTopValue)?.let {
      borderTop = it
    }

    LengthPercentage.fromTypeValue(borderBottomType, borderBottomValue)?.let {
      borderBottom = it
    }

    border = Rect(borderLeft, borderEnd, borderTop, borderBottom)


    this.flexGrow = flexGrow
    this.flexShrink = flexShrink

    Dimension.fromTypeValue(flexBasisType, flexBasisValue)?.let {
      flexBasis = it
    }


    var sizeWidth: Dimension = Dimension.Auto
    var sizeHeight: Dimension = Dimension.Auto

    Dimension.fromTypeValue(sizeWidthType, sizeWidthValue)?.let {
      sizeWidth = it
    }

    Dimension.fromTypeValue(sizeHeightType, sizeHeightValue)?.let {
      sizeHeight = it
    }

    this.size = Size(sizeWidth, sizeHeight)

    var minSizeWidth: Dimension = Dimension.Auto
    var minSizeHeight: Dimension = Dimension.Auto

    Dimension.fromTypeValue(minSizeWidthType, minSizeWidthValue)?.let {
      minSizeWidth = it
    }

    Dimension.fromTypeValue(minSizeHeightType, minSizeHeightValue)?.let {
      minSizeHeight = it
    }

    this.minSize = Size(minSizeWidth, minSizeHeight)


    var maxSizeWidth: Dimension = Dimension.Auto
    var maxSizeHeight: Dimension = Dimension.Auto

    Dimension.fromTypeValue(maxSizeWidthType, maxSizeWidthValue)?.let {
      maxSizeWidth = it
    }

    Dimension.fromTypeValue(maxSizeHeightType, maxSizeHeightValue)?.let {
      maxSizeHeight = it
    }

    this.maxSize = Size(maxSizeWidth, maxSizeHeight)

    var gapRow: LengthPercentage = LengthPercentage.Zero
    var gapColumn: LengthPercentage = LengthPercentage.Zero



    LengthPercentage.fromTypeValue(gapRowType, gapRowValue)?.let {
      gapRow = it
    }

    LengthPercentage.fromTypeValue(gapColumnType, gapColumnValue)?.let {
      gapColumn = it
    }

    this.gap = Size(gapRow, gapColumn)

    if (!aspectRatio.isNaN()) {
      this.aspectRatio = null
    } else {
      this.aspectRatio = aspectRatio
    }


    this.gridAutoRows = gridAutoRows
    this.gridAutoColumns = gridAutoColumns
    this.gridAutoFlow = GridAutoFlow.fromInt(gridAutoFlow)

    Line.fromStartAndEndValues(
      gridColumnStartType,
      gridColumnStartValue,
      gridColumnEndType,
      gridColumnEndValue
    )?.let {
      gridColumn = it
    }


    Line.fromStartAndEndValues(
      gridRowStartType,
      gridRowStartValue,
      gridRowEndType,
      gridRowEndValue
    )?.let {
      gridRow = it
    }

    this.gridTemplateRows = gridTemplateRows
    this.gridTemplateColumns = gridTemplateColumns

    this.textAlign = TextAlign.fromInt(textAlign)
    this.boxSizing = BoxSizing.fromInt(boxSizing)
  }

  fun getNativeMargins(): Rect<LengthPercentageAuto> {
    if (node.nativePtr == 0L) return LengthPercentageAutoZeroRect

    var marginLeft: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginRight: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginTop: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginBottom: LengthPercentageAuto = LengthPercentageAuto.Auto

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_LEFT_TYPE),
      values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
    )?.let {
      marginLeft = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_RIGHT_TYPE),
      values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
    )?.let {
      marginRight = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_TOP_TYPE),
      values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
    )?.let {
      marginTop = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_BOTTOM_TYPE),
      values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
    )?.let {
      marginBottom = it
    }

    return Rect(marginLeft, marginRight, marginTop, marginBottom)
  }

  fun getNativeSize(): Size<Dimension> {
    if (node.nativePtr == 0L) return autoSize
    val width = Dimension.fromTypeValue(
      values.getInt(StyleKeys.WIDTH_TYPE),
      values.getFloat(StyleKeys.WIDTH_VALUE)
    )
    val height = Dimension.fromTypeValue(
      values.getInt(StyleKeys.HEIGHT_TYPE),
      values.getFloat(StyleKeys.HEIGHT_VALUE)
    )
    return Size(width as Dimension, height as Dimension)
  }


  var size: Size<Dimension> = autoSize
    get() {
      if (node.nativePtr == 0L) return field
      val width = Dimension.fromTypeValue(
        values.getInt(StyleKeys.WIDTH_TYPE),
        values.getFloat(StyleKeys.WIDTH_VALUE)
      )
      val height = Dimension.fromTypeValue(
        values.getInt(StyleKeys.HEIGHT_TYPE),
        values.getFloat(StyleKeys.HEIGHT_VALUE)
      )
      return Size(width as Dimension, height as Dimension)
    }
    set(value) {
      field = value
      isDirty = true
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
    ret += "gridAutoRows: ${gridAutoRows.cssValue}, \n"
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
    ret += "scrollBarWidth: ${scrollBarWidth.cssValue} \n"
    ret += "textAlign: ${textAlign.cssValue} \n"
    ret += "boxSizing: ${boxSizing.cssValue} \n"
    ret += ")"

    return ret
  }

  companion object {
    init {
      Mason.initLib()
    }

    @JvmStatic
    external fun nativeUpdateStyleBuffer(
      mason: Long,
      node: Long,
      buffer: ByteBuffer,
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
