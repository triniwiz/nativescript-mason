package org.nativescript.mason.masonkit

enum class AlignItems {
  FlexStart,
  FlexEnd,
  Center,
  Baseline,
  Stretch;

  companion object {
    fun fromInt(value: Int): AlignItems {
      return when (value) {
        0 -> FlexStart
        1 -> FlexEnd
        2 -> Center
        3 -> Baseline
        4 -> Stretch
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class AlignSelf {
  Auto,
  FlexStart,
  FlexEnd,
  Center,
  Baseline,
  Stretch;

  companion object {
    fun fromInt(value: Int): AlignSelf {
      return when (value) {
        0 -> Auto
        1 -> FlexStart
        2 -> FlexEnd
        3 -> Center
        4 -> Baseline
        5 -> Stretch
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class AlignContent {
  FlexStart,
  FlexEnd,
  Center,
  Stretch,
  SpaceBetween,
  SpaceAround,
  SpaceEvenly;

  companion object {
    fun fromInt(value: Int): AlignContent {
      return when (value) {
        0 -> FlexStart
        1 -> FlexEnd
        2 -> Center
        3 -> Stretch
        4 -> SpaceBetween
        5 -> SpaceAround
        6 -> SpaceEvenly
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class Direction {
  Inherit,
  LTR,
  RTL;

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

enum class Display {
  Flex,
  None;

  companion object {
    fun fromInt(value: Int): Display {
      return when (value) {
        0 -> Flex
        1 -> None
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class FlexDirection {
  Row,
  Column,
  RowReverse,
  ColumnReverse;

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

enum class JustifyContent {
  FlexStart,
  FlexEnd,
  Center,
  SpaceBetween,
  SpaceAround,
  SpaceEvenly;

  companion object {
    fun fromInt(value: Int): JustifyContent {
      return when (value) {
        0 -> FlexStart
        1 -> FlexEnd
        2 -> Center
        3 -> SpaceBetween
        4 -> SpaceAround
        5 -> SpaceEvenly
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class Overflow {
  Visible,
  Hidden,
  Scroll;

  companion object {
    fun fromInt(value: Int): Overflow {
      return when (value) {
        0 -> Visible
        1 -> Hidden
        2 -> Scroll
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class PositionType {
  Relative,
  Absolute;

  companion object {
    fun fromInt(value: Int): PositionType {
      return when (value) {
        0 -> Relative
        1 -> Absolute
        else -> throw IllegalArgumentException("Unknown enum value: $value")
      }
    }
  }
}

enum class FlexWrap {
  NoWrap,
  Wrap,
  WrapReverse;

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

class Style internal constructor() {

  private var nativePtr = 0L

  internal var isDirty = false

  var display: Display = Display.Flex
    set(value) {
      field = value
      isDirty = true
    }

  var positionType: PositionType = PositionType.Relative
    set(value) {
      field = value
      isDirty = true
    }

  // TODO
  var direction: Direction = Direction.Inherit
    set(value) {
      field = value
      isDirty = true
    }

  var flexDirection: FlexDirection = FlexDirection.Row
    set(value) {
      field = value
      isDirty = true
    }

  var flexWrap: FlexWrap = FlexWrap.NoWrap
    set(value) {
      field = value
      isDirty = true
    }

  var overflow: Overflow = Overflow.Hidden
    set(value) {
      field = value
      isDirty = true
    }

  var alignItems: AlignItems = AlignItems.Stretch
    set(value) {
      field = value
      isDirty = true
    }

  var alignSelf: AlignSelf = AlignSelf.Auto
    set(value) {
      field = value
      isDirty = true
    }

  var alignContent: AlignContent = AlignContent.FlexStart
    set(value) {
      field = value
      isDirty = true
    }

  var justifyContent: JustifyContent = JustifyContent.FlexStart
    set(value) {
      field = value
      isDirty = true
    }

  var position: Rect<Dimension> =
    Rect(Dimension.Undefined, Dimension.Undefined, Dimension.Undefined, Dimension.Undefined)
    set(value) {
      field = value
      isDirty = true
    }

  fun setPositionLeft(value: Float, type: Int) {
    val left = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    left?.let {
      position = Rect(left, position.right, position.top, position.bottom)
    }
  }

  fun setPositionRight(value: Float, type: Int) {
    val right = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    right?.let {
      position = Rect(position.left, right, position.top, position.bottom)
    }
  }

  fun setPositionTop(value: Float, type: Int) {
    val top = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    top?.let {
      position = Rect(position.left, position.right, top, position.bottom)
    }
  }

  fun setPositionBottom(value: Float, type: Int) {
    val bottom = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    bottom?.let {
      position = Rect(position.left, position.right, position.top, bottom)
    }
  }

  fun setPositionWithValueType(value: Float, type: Int) {
    val position = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    position?.let {
      this.position = Rect(it, it, it, it)
    }
  }

  var margin: Rect<Dimension> =
    Rect(Dimension.Undefined, Dimension.Undefined, Dimension.Undefined, Dimension.Undefined)
    set(value) {
      field = value
      isDirty = true
    }

  fun setMarginLeft(value: Float, type: Int) {
    val left = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    left?.let {
      margin = Rect(it, margin.right, margin.top, margin.bottom)
    }
  }

  fun setMarginRight(value: Float, type: Int) {
    val right = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    right?.let {
      margin = Rect(margin.left, right, margin.top, margin.bottom)
    }
  }

  fun setMarginTop(value: Float, type: Int) {
    val top = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    top?.let {
      margin = Rect(margin.left, margin.right, top, margin.bottom)
    }
  }

  fun setMarginBottom(value: Float, type: Int) {
    val bottom = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    bottom?.let {
      margin = Rect(margin.left, margin.right, margin.top, bottom)
    }
  }

  fun setMarginWithValueType(value: Float, type: Int) {
    val margin = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    margin?.let {
      this.margin = Rect(it, it, it, it)
    }
  }

  var padding: Rect<Dimension> =
    Rect(Dimension.Undefined, Dimension.Undefined, Dimension.Undefined, Dimension.Undefined)
    set(value) {
      field = value
      isDirty = true
    }

  fun setPaddingLeft(value: Float, type: Int) {
    val left = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    left?.let {
      padding = Rect(it, padding.right, padding.top, padding.bottom)
    }
  }

  fun setPaddingRight(value: Float, type: Int) {
    val right = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    right?.let {
      padding = Rect(padding.left, right, padding.top, padding.bottom)
    }
  }

  fun setPaddingTop(value: Float, type: Int) {
    val top = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    top?.let {
      padding = Rect(padding.left, padding.right, top, padding.bottom)
    }
  }

  fun setPaddingBottom(value: Float, type: Int) {
    val bottom = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    bottom?.let {
      padding = Rect(padding.left, padding.right, padding.top, bottom)
    }
  }

  fun setPaddingWithValueType(value: Float, type: Int) {
    val padding = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    padding?.let {
      this.padding = Rect(it, it, it, it)
    }
  }

  var border: Rect<Dimension> =
    Rect(Dimension.Undefined, Dimension.Undefined, Dimension.Undefined, Dimension.Undefined)
    set(value) {
      field = value
      isDirty = true
    }

  fun setBorderLeft(value: Float, type: Int) {
    val left = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    left?.let {
      border = Rect(it, border.right, border.top, border.bottom)
    }
  }

  fun setBorderRight(value: Float, type: Int) {
    val right = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    right?.let {
      border = Rect(border.left, right, border.top, border.bottom)
    }
  }

  fun setBorderTop(value: Float, type: Int) {
    val top = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    top?.let {
      border = Rect(border.left, border.right, top, border.bottom)
    }
  }

  fun setBorderBottom(value: Float, type: Int) {
    val bottom = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    bottom?.let {
      border = Rect(border.left, border.right, border.top, bottom)
    }
  }

  fun setBorderWithValueType(value: Float, type: Int) {
    val border = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
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

  fun setFlexBasis(value: Float, type: Int) {
    when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
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
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    width?.let {
      minSize = Size(it, size.height)
    }
  }

  fun setMinSizeHeight(value: Float, type: Int) {
    val height = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    height?.let {
      minSize = Size(size.width, it)
    }
  }

  var size: Size<Dimension> = autoSize
    set(value) {
      field = value
      isDirty = true
    }

  fun setSizeWidth(value: Float, type: Int) {
    val width = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    width?.let {
      size = Size(it, size.height)
    }
  }

  fun setSizeHeight(value: Float, type: Int) {
    val height = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    height?.let {
      size = Size(size.width, it)
    }
  }

  var maxSize: Size<Dimension> = autoSize
    set(value) {
      field = value
      isDirty = true
    }

  fun setMaxSizeWidth(value: Float, type: Int) {
    val width = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    width?.let {
      maxSize = Size(it, size.height)
    }
  }

  fun setMaxSizeHeight(value: Float, type: Int) {
    val height = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    height?.let {
      maxSize = Size(size.width, it)
    }
  }

  var flexGap: Size<Dimension> = Size(Dimension.Undefined, Dimension.Undefined)
    set(value) {
      field = value
      isDirty = true
    }

  fun setFlexGap(width_value: Float, width_type: Int, height_value: Float, height_type: Int) {
    val width = when (width_type) {
      0 -> Dimension.Points(width_value)
      1 -> Dimension.Percent(width_value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    val height = when (height_type) {
      0 -> Dimension.Points(height_value)
      1 -> Dimension.Percent(height_value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    if (width != null && height != null) {
      flexGap = Size(width, height)
    }
  }


  fun setFlexGapWidth(value: Float, type: Int) {
    val width = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    width?.let {
      flexGap = Size(it, size.height)
    }
  }

  fun setFlexHeight(value: Float, type: Int) {
    val height = when (type) {
      0 -> Dimension.Points(value)
      1 -> Dimension.Percent(value)
      2 -> Dimension.Undefined
      3 -> Dimension.Auto
      else -> null
    }

    height?.let {
      flexGap = Size(size.width, it)
    }
  }

  var aspectRatio: Float? = null
    set(value) {
      field = value
      isDirty = true
    }

  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
    nativeDestroy(nativePtr)
  }

  internal fun updateStyle(
    display: Int,
    positionType: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyContent: Int,
    positionLeftType: Int,
    positionLeftValue: Float,
    positionEndType: Int,
    positionEndValue: Float,
    positionTopType: Int,
    positionTopValue: Float,
    positionBottomType: Int,
    positionBottomValue: Float,
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
    flexGapWidthType: Int,
    flexGapWidthValue: Float,
    flexGapHeightType: Int,
    flexGapHeightValue: Float,
    aspectRatio: Float
  ) {
    this.display = Display.values()[display]
    this.positionType = PositionType.values()[positionType]
    this.flexDirection = FlexDirection.values()[flexDirection]
    this.flexWrap = FlexWrap.values()[flexWrap]
    this.overflow = Overflow.values()[overflow]
    this.alignItems = AlignItems.values()[alignItems]
    this.alignSelf = AlignSelf.values()[alignSelf]
    this.alignContent = AlignContent.values()[alignContent]
    this.justifyContent = JustifyContent.values()[justifyContent]

    var positionLeft: Dimension = Dimension.Undefined
    var positionEnd: Dimension = Dimension.Undefined
    var positionTop: Dimension = Dimension.Undefined
    var positionBottom: Dimension = Dimension.Undefined

    Dimension.fromTypeValue(positionLeftType, positionLeftValue)?.let {
      positionLeft = it
    }

    Dimension.fromTypeValue(positionEndType, positionEndValue)?.let {
      positionEnd = it
    }

    Dimension.fromTypeValue(positionTopType, positionTopValue)?.let {
      positionTop = it
    }

    Dimension.fromTypeValue(positionBottomType, positionBottomValue)?.let {
      positionBottom = it
    }

    position = Rect(positionLeft, positionEnd, positionTop, positionBottom)

    var marginLeft: Dimension = Dimension.Undefined
    var marginEnd: Dimension = Dimension.Undefined
    var marginTop: Dimension = Dimension.Undefined
    var marginBottom: Dimension = Dimension.Undefined

    Dimension.fromTypeValue(marginLeftType, marginLeftValue)?.let {
      marginLeft = it
    }

    Dimension.fromTypeValue(marginEndType, marginEndValue)?.let {
      marginEnd = it
    }

    Dimension.fromTypeValue(marginTopType, marginTopValue)?.let {
      marginTop = it
    }

    Dimension.fromTypeValue(marginBottomType, marginBottomValue)?.let {
      marginBottom = it
    }

    margin = Rect(marginLeft, marginEnd, marginTop, marginBottom)

    var paddingLeft: Dimension = Dimension.Undefined
    var paddingEnd: Dimension = Dimension.Undefined
    var paddingTop: Dimension = Dimension.Undefined
    var paddingBottom: Dimension = Dimension.Undefined

    Dimension.fromTypeValue(paddingLeftType, paddingLeftValue)?.let {
      paddingLeft = it
    }

    Dimension.fromTypeValue(paddingEndType, paddingEndValue)?.let {
      paddingEnd = it
    }

    Dimension.fromTypeValue(paddingTopType, paddingTopValue)?.let {
      paddingTop = it
    }

    Dimension.fromTypeValue(paddingBottomType, paddingBottomValue)?.let {
      paddingBottom = it
    }

    padding = Rect(paddingLeft, paddingEnd, paddingTop, paddingBottom)

    var borderLeft: Dimension = Dimension.Undefined
    var borderEnd: Dimension = Dimension.Undefined
    var borderTop: Dimension = Dimension.Undefined
    var borderBottom: Dimension = Dimension.Undefined

    Dimension.fromTypeValue(borderLeftType, borderLeftValue)?.let {
      borderLeft = it
    }

    Dimension.fromTypeValue(borderEndType, borderEndValue)?.let {
      borderEnd = it
    }

    Dimension.fromTypeValue(borderTopType, borderTopValue)?.let {
      borderTop = it
    }

    Dimension.fromTypeValue(borderBottomType, borderBottomValue)?.let {
      borderBottom = it
    }

    border = Rect(borderLeft, borderEnd, borderTop, borderBottom)


    this.flexGrow = flexGrow
    this.flexShrink = flexShrink

    Dimension.fromTypeValue(flexBasisType, flexBasisValue)?.let {
      flexBasis = it
    }


    var sizeWidth: Dimension = Dimension.Undefined
    var sizeHeight: Dimension = Dimension.Undefined

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

    var flexGapWidth: Dimension = Dimension.Undefined
    var flexGapHeight: Dimension = Dimension.Undefined



    Dimension.fromTypeValue(flexGapWidthType, flexGapWidthValue)?.let {
      flexGapWidth = it
    }

    Dimension.fromTypeValue(flexGapHeightType, flexGapHeightValue)?.let {
      flexGapHeight = it
    }

    this.flexGap = Size(flexGapWidth, flexGapHeight)

    if (!aspectRatio.isNaN()) {
      this.aspectRatio = null
    } else {
      this.aspectRatio = aspectRatio
    }

  }


  fun getNativePtr(): Long {
    if (nativePtr == 0L) {
      nativePtr = nativeInitWithValues(
        display.ordinal,
        positionType.ordinal,
        direction.ordinal,
        flexDirection.ordinal,
        flexWrap.ordinal,
        overflow.ordinal,
        alignItems.ordinal,
        alignSelf.ordinal,
        alignContent.ordinal,
        justifyContent.ordinal,

        position.left.type,
        position.left.value,
        position.right.type,
        position.right.value,
        position.top.type,
        position.top.value,
        position.bottom.type,
        position.bottom.value,

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

        flexGap.width.type,
        flexGap.width.value,
        flexGap.height.type,
        flexGap.height.value,

        aspectRatio ?: Float.NaN
      )
      isDirty = false
    }

    return nativePtr
  }

  companion object {
    init {
      Mason.initLib()
    }
  }

  private external fun nativeDestroy(
    style: Long,
  )

  private external fun nativeInit(): Long

  private external fun nativeInitWithValues(
    display: Int,
    positionType: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyContent: Int,

    positionLeftType: Int,
    positionLeftValue: Float,
    positionRightType: Int,
    positionRightValue: Float,
    positionTopType: Int,
    positionTopValue: Float,
    positionBottomType: Int,
    positionBottomValue: Float,

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

    flexGapWidthType: Int,
    flexGapWidthValue: Float,
    flexGapHeightType: Int,
    flexGapHeightValue: Float,

    aspectRatio: Float
  ): Long


  private external fun nativeUpdateWithValues(
    style: Long,
    display: Int,
    positionType: Int,
    direction: Int,
    flexDirection: Int,
    flexWrap: Int,
    overflow: Int,
    alignItems: Int,
    alignSelf: Int,
    alignContent: Int,
    justifyContent: Int,

    positionLeftType: Int,
    positionLeftValue: Float,
    positionRightType: Int,
    positionRightValue: Float,
    positionTopType: Int,
    positionTopValue: Float,
    positionBottomType: Int,
    positionBottomValue: Float,

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

    flexGapWidthType: Int,
    flexGapWidthValue: Float,
    flexGapHeightType: Int,
    flexGapHeightValue: Float,

    aspectRatio: Float
  )

}
