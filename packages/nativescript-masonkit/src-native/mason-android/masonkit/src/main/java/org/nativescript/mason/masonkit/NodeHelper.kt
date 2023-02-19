package org.nativescript.mason.masonkit

object NodeHelper {

  fun configure(node: Node, block: (Node) -> Unit) {
    node.configure(block)
  }

  private fun checkAndUpdateStyle(node: Node) {
    if (!node.inBatch) {
      node.updateNodeStyle()
    }
  }

  fun getDisplay(node: Node): Display {
    return node.style.display
  }

  fun setDisplay(node: Node, display: Display) {
    node.style.display = display
    checkAndUpdateStyle(node)
  }

  fun getPosition(node: Node): Position {
    return node.style.position
  }

  fun setPosition(node: Node, position: Position) {
    node.style.position = position
    checkAndUpdateStyle(node)
  }

  fun getDirection(node: Node): Direction {
    return node.style.direction
  }

  fun setDirection(node: Node, direction: Direction) {
    node.style.direction = direction
    checkAndUpdateStyle(node)
  }

  fun getFlexDirection(node: Node): FlexDirection {
    return node.style.flexDirection
  }

  fun setFlexDirection(node: Node, direction: FlexDirection) {
    node.style.flexDirection = direction
    checkAndUpdateStyle(node)
  }


  fun getFlexWrap(node: Node): FlexWrap {
    return node.style.flexWrap
  }

  fun setFlexWrap(node: Node, flexWrap: FlexWrap) {
    node.style.flexWrap = flexWrap
    checkAndUpdateStyle(node)
  }

  fun getOverflow(node: Node): Overflow {
    return node.style.overflow
  }

  fun setOverflow(node: Node, overflow: Overflow) {
    node.style.overflow = overflow
    checkAndUpdateStyle(node)
  }


  fun getAlignItems(node: Node): AlignItems {
    return node.style.alignItems
  }

  fun setAlignItems(node: Node, alignItems: AlignItems) {
    node.style.alignItems = alignItems
    checkAndUpdateStyle(node)
  }


  fun getAlignSelf(node: Node): AlignSelf {
    return node.style.alignSelf
  }

  fun setAlignSelf(node: Node, alignSelf: AlignSelf) {
    node.style.alignSelf = alignSelf
    checkAndUpdateStyle(node)
  }


  fun getAlignContent(node: Node): AlignContent {
    return node.style.alignContent
  }

  fun setAlignContent(node: Node, alignContent: AlignContent) {
    node.style.alignContent = alignContent
    checkAndUpdateStyle(node)
  }

  fun getJustifyItems(node: Node): JustifyItems {
    return node.style.justifyItems
  }

  fun setJustifyItems(node: Node, justifyItems: JustifyItems) {
    node.style.justifyItems = justifyItems
    checkAndUpdateStyle(node)
  }

  fun getJustifySelf(node: Node): JustifySelf {
    return node.style.justifySelf
  }

  fun setJustifySelf(node: Node, justifySelf: JustifySelf) {
    node.style.justifySelf = justifySelf
    checkAndUpdateStyle(node)
  }

  fun getJustifyContent(node: Node): JustifyContent {
    return node.style.justifyContent
  }

  fun setJustifyContent(node: Node, justifyContent: JustifyContent) {
    node.style.justifyContent = justifyContent
    checkAndUpdateStyle(node)
  }

  fun getFlexGrow(node: Node): Float {
    return node.style.flexGrow
  }

  fun setFlexGrow(node: Node, flexGrow: Float) {
    node.style.flexGrow = flexGrow
    checkAndUpdateStyle(node)
  }


  fun getFlexShrink(node: Node): Float {
    return node.style.flexShrink
  }

  fun setFlexShrink(node: Node, flexShrink: Float) {
    node.style.flexShrink = flexShrink
    checkAndUpdateStyle(node)
  }

  fun setFlexBasis(node: Node, value: Float, type: Int) {
    node.style.setFlexBasis(value, type)
    checkAndUpdateStyle(node)
  }


  fun getFlexBasis(node: Node): Dimension {
    return node.style.flexBasis
  }

  fun setFlexBasis(node: Node, flexBasis: Dimension) {
    node.style.flexBasis = flexBasis
    checkAndUpdateStyle(node)
  }

  fun getPadding(node: Node): Rect<LengthPercentage> {
    return node.style.padding
  }

  fun getStylePaddingLeft(node: Node): LengthPercentage {
    return node.style.padding.left
  }

  fun getStylePaddingRight(node: Node): LengthPercentage {
    return node.style.padding.right
  }

  fun getStylePaddingTop(node: Node): LengthPercentage {
    return node.style.padding.top
  }

  fun getStylePaddingBottom(node: Node): LengthPercentage {
    return node.style.padding.bottom
  }

  fun getPaddingCssValue(node: Node): String {
    return node.style.padding.cssValue
  }

  fun getPaddingJsonValue(node: Node): String {
    return node.style.padding.jsonValue
  }

  fun setPadding(node: Node, left: Float, top: Float, right: Float, bottom: Float) {
    node.style.padding = Rect(
      LengthPercentage.Points(left),
      LengthPercentage.Points(right),
      LengthPercentage.Points(top),
      LengthPercentage.Points(bottom)
    )
    checkAndUpdateStyle(node)
  }

  fun setPadding(
    node: Node,
    left: LengthPercentage,
    top: LengthPercentage,
    right: LengthPercentage,
    bottom: LengthPercentage
  ) {
    node.style.padding = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle(node)
  }

  fun setPadding(
    node: Node,
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    node.style.padding = Rect(
      LengthPercentage.fromTypeValue(left_type, left) ?: node.style.padding.left,
      LengthPercentage.fromTypeValue(right_type, right) ?: node.style.padding.right,
      LengthPercentage.fromTypeValue(top_type, top) ?: node.style.padding.top,
      LengthPercentage.fromTypeValue(bottom_type, bottom) ?: node.style.padding.bottom
    )
    checkAndUpdateStyle(node)
  }


  fun setPaddingLeft(node: Node, value: Float, type: Int) {
    node.style.setPaddingLeft(value, type)
    checkAndUpdateStyle(node)
  }

  fun setPaddingRight(node: Node, value: Float, type: Int) {
    node.style.setPaddingRight(value, type)
    checkAndUpdateStyle(node)
  }

  fun setPaddingTop(node: Node, value: Float, type: Int) {
    node.style.setPaddingTop(value, type)
    checkAndUpdateStyle(node)
  }

  fun setPaddingBottom(node: Node, value: Float, type: Int) {
    node.style.setPaddingBottom(value, type)
    checkAndUpdateStyle(node)
  }

  fun setPaddingWithValueType(node: Node, value: Float, type: Int) {
    node.style.setPaddingWithValueType(value, type)
    checkAndUpdateStyle(node)
  }

  fun getBorder(node: Node): Rect<LengthPercentage> {
    return node.style.border
  }

  fun getBorderLeft(node: Node): LengthPercentage {
    return node.style.border.left
  }

  fun getBorderRight(node: Node): LengthPercentage {
    return node.style.border.right
  }

  fun getBorderTop(node: Node): LengthPercentage {
    return node.style.border.top
  }

  fun getBorderBottom(node: Node): LengthPercentage {
    return node.style.border.bottom
  }

  fun getBorderCssValue(node: Node): String {
    return node.style.border.cssValue
  }

  fun getBorderJsonValue(node: Node): String {
    return node.style.border.jsonValue
  }

  fun setBorder(node: Node, left: Float, top: Float, right: Float, bottom: Float) {
    node.style.border = Rect(
      LengthPercentage.Points(left),
      LengthPercentage.Points(right),
      LengthPercentage.Points(top),
      LengthPercentage.Points(bottom)
    )
    checkAndUpdateStyle(node)
  }

  fun setBorder(
    node: Node,
    left: LengthPercentage,
    top: LengthPercentage,
    right: LengthPercentage,
    bottom: LengthPercentage
  ) {
    node.style.border = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle(node)
  }

  fun setBorder(
    node: Node,
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    node.style.border = Rect(
      LengthPercentage.fromTypeValue(left_type, left) ?: node.style.border.left,
      LengthPercentage.fromTypeValue(right_type, right) ?: node.style.border.right,
      LengthPercentage.fromTypeValue(top_type, top) ?: node.style.border.top,
      LengthPercentage.fromTypeValue(bottom_type, bottom) ?: node.style.border.bottom
    )
    checkAndUpdateStyle(node)
  }

  fun setBorderLeft(node: Node, value: Float, type: Int) {
    node.style.setBorderLeft(value, type)
    checkAndUpdateStyle(node)
  }

  fun setBorderRight(node: Node, value: Float, type: Int) {
    node.style.setBorderRight(value, type)
    checkAndUpdateStyle(node)
  }

  fun setBorderTop(node: Node, value: Float, type: Int) {
    node.style.setBorderTop(value, type)
    checkAndUpdateStyle(node)
  }

  fun setBorderBottom(node: Node, value: Float, type: Int) {
    node.style.setBorderBottom(value, type)
    checkAndUpdateStyle(node)
  }

  fun setBorderWithValueType(node: Node, value: Float, type: Int) {
    node.style.setBorderWithValueType(value, type)
    checkAndUpdateStyle(node)
  }

  fun getMargin(node: Node): Rect<LengthPercentageAuto> {
    return node.style.margin
  }

  fun getMarginLeft(node: Node): LengthPercentageAuto {
    return node.style.margin.left
  }

  fun getMarginRight(node: Node): LengthPercentageAuto {
    return node.style.margin.right
  }

  fun getMarginTop(node: Node): LengthPercentageAuto {
    return node.style.margin.top
  }

  fun getMarginBottom(node: Node): LengthPercentageAuto {
    return node.style.margin.bottom
  }

  fun getMarginCssValue(node: Node): String {
    return node.style.margin.cssValue
  }

  fun getMarginJsonValue(node: Node): String {
    return node.style.margin.jsonValue
  }

  fun setMargin(node: Node, left: Float, top: Float, right: Float, bottom: Float) {
    node.style.margin = Rect(
      LengthPercentageAuto.Points(left),
      LengthPercentageAuto.Points(right),
      LengthPercentageAuto.Points(top),
      LengthPercentageAuto.Points(bottom)
    )
    checkAndUpdateStyle(node)
  }

  fun setMargin(
    node: Node,
    left: LengthPercentageAuto,
    top: LengthPercentageAuto,
    right: LengthPercentageAuto,
    bottom: LengthPercentageAuto
  ) {
    node.style.margin = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle(node)
  }

  fun setMargin(
    node: Node,
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    node.style.margin = Rect(
      LengthPercentageAuto.fromTypeValue(left_type, left) ?: node.style.margin.left,
      LengthPercentageAuto.fromTypeValue(right_type, right) ?: node.style.margin.right,
      LengthPercentageAuto.fromTypeValue(top_type, top) ?: node.style.margin.top,
      LengthPercentageAuto.fromTypeValue(bottom_type, bottom) ?: node.style.margin.bottom
    )
    checkAndUpdateStyle(node)
  }

  fun setMarginLeft(node: Node, value: Float, type: Int) {
    node.style.setMarginLeft(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMarginRight(node: Node, value: Float, type: Int) {
    node.style.setMarginRight(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMarginTop(node: Node, value: Float, type: Int) {
    node.style.setMarginTop(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMarginBottom(node: Node, value: Float, type: Int) {
    node.style.setMarginBottom(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMarginWithValueType(node: Node, value: Float, type: Int) {
    node.style.setMarginWithValueType(value, type)
    checkAndUpdateStyle(node)
  }

  fun getInset(node: Node): Rect<LengthPercentageAuto> {
    return node.style.inset
  }

  fun getInsetLeft(node: Node): LengthPercentageAuto {
    return node.style.inset.left
  }

  fun getInsetRight(node: Node): LengthPercentageAuto {
    return node.style.inset.right
  }

  fun getInsetTop(node: Node): LengthPercentageAuto {
    return node.style.inset.top
  }

  fun getInsetBottom(node: Node): LengthPercentageAuto {
    return node.style.inset.bottom
  }

  fun getInsetCssValue(node: Node): String {
    return node.style.inset.cssValue
  }

  fun getInsetJsonValue(node: Node): String {
    return node.style.inset.jsonValue
  }

  fun setPosition(node: Node, left: Float, top: Float, right: Float, bottom: Float) {
    node.style.inset = Rect(
      LengthPercentageAuto.Points(left),
      LengthPercentageAuto.Points(right),
      LengthPercentageAuto.Points(top),
      LengthPercentageAuto.Points(bottom)
    )
    checkAndUpdateStyle(node)
  }

  fun setPosition(
    node: Node,
    left: LengthPercentageAuto,
    top: LengthPercentageAuto,
    right: LengthPercentageAuto,
    bottom: LengthPercentageAuto
  ) {
    node.style.inset = Rect(
      left,
      right,
      top,
      bottom
    )
    checkAndUpdateStyle(node)
  }

  fun setInset(
    node: Node,
    left: Float,
    left_type: Int,
    top: Float,
    top_type: Int,
    right: Float,
    right_type: Int,
    bottom: Float,
    bottom_type: Int
  ) {
    node.style.inset = Rect(
      LengthPercentageAuto.fromTypeValue(left_type, left) ?: node.style.inset.left,
      LengthPercentageAuto.fromTypeValue(right_type, right) ?: node.style.inset.right,
      LengthPercentageAuto.fromTypeValue(top_type, top) ?: node.style.inset.top,
      LengthPercentageAuto.fromTypeValue(bottom_type, bottom) ?: node.style.inset.bottom
    )
    checkAndUpdateStyle(node)
  }

  fun setInsetLeft(node: Node, value: Float, type: Int) {
    node.style.setInsetLeft(value, type)
    checkAndUpdateStyle(node)
  }

  fun setInsetRight(node: Node, value: Float, type: Int) {
    node.style.setInsetRight(value, type)
    checkAndUpdateStyle(node)
  }

  fun setInsetTop(node: Node, value: Float, type: Int) {
    node.style.setInsetTop(value, type)
    checkAndUpdateStyle(node)
  }

  fun setInsetBottom(node: Node, value: Float, type: Int) {
    node.style.setInsetBottom(value, type)
    checkAndUpdateStyle(node)
  }

  fun setInsetWithValueType(node: Node, value: Float, type: Int) {
    node.style.setInsetWithValueType(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMinSize(node: Node, width: Float, height: Float) {
    node.style.minSize = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )
    checkAndUpdateStyle(node)
  }

  fun getMinSize(node: Node): Size<Dimension> {
    return node.style.minSize
  }

  fun getMinSizeWidth(node: Node): Dimension {
    return node.style.minSize.width
  }

  fun getMinSizeHeight(node: Node): Dimension {
    return node.style.minSize.height
  }

  fun getMinSizeCssValue(node: Node): String {
    return node.style.minSize.cssValue
  }

  fun getMinSizeJsonValue(node: Node): String {
    return node.style.minSize.jsonValue
  }

  fun setMinSize(node: Node, width: Dimension, height: Dimension) {
    node.style.minSize = Size(
      width,
      height,
    )
    checkAndUpdateStyle(node)
  }

  fun setMinSize(
    node: Node,
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    node.style.minSize = Size(
      Dimension.fromTypeValue(width_type, width) ?: node.style.minSize.width,
      Dimension.fromTypeValue(height_type, height) ?: node.style.minSize.height
    )
    checkAndUpdateStyle(node)
  }


  fun setMinSizeWidth(node: Node, value: Dimension) {
    node.style.setMinSizeWidth(value)
    checkAndUpdateStyle(node)
  }

  fun setMinSizeHeight(node: Node, value: Dimension) {
    node.style.setMinSizeHeight(value)
    checkAndUpdateStyle(node)
  }


  fun setMinSizeWidth(node: Node, value: Float, type: Int) {
    node.style.setMinSizeWidth(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMinSizeHeight(node: Node, value: Float, type: Int) {
    node.style.setMinSizeHeight(value, type)
    checkAndUpdateStyle(node)
  }

  fun setSize(node: Node, width: Float, height: Float) {
    node.style.size = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )
    checkAndUpdateStyle(node)
  }

  fun getSize(node: Node): Size<Dimension> {
    return node.style.size
  }

  fun getSizeCssValue(node: Node): String {
    return node.style.size.cssValue
  }

  fun getSizeJsonValue(node: Node): String {
    return node.style.size.jsonValue
  }

  fun getSizeWidth(node: Node): Dimension {
    return node.style.size.width
  }

  fun getSizeHeight(node: Node): Dimension {
    return node.style.size.height
  }

  fun setSize(node: Node, width: Dimension, height: Dimension) {
    node.style.size = Size(
      width,
      height,
    )
    checkAndUpdateStyle(node)
  }

  fun setSize(
    node: Node,
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    node.style.size = Size(
      Dimension.fromTypeValue(width_type, width) ?: node.style.size.width,
      Dimension.fromTypeValue(height_type, height) ?: node.style.size.height
    )
    checkAndUpdateStyle(node)
  }

  fun setSizeWidth(node: Node, value: Float, type: Int) {
    node.style.setSizeWidth(value, type)
    checkAndUpdateStyle(node)
  }

  fun setSizeWidth(node: Node, value: Dimension) {
    node.style.setSizeWidth(value)
    checkAndUpdateStyle(node)
  }

  fun setSizeHeight(node: Node, value: Float, type: Int) {
    node.style.setSizeHeight(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMaxSize(node: Node, width: Float, height: Float) {
    node.style.maxSize = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )
    checkAndUpdateStyle(node)
  }

  fun getMaxSize(node: Node): Size<Dimension> {
    return node.style.maxSize
  }

  fun getMaxSizeWidth(node: Node): Dimension {
    return node.style.maxSize.width
  }

  fun getMaxSizeHeight(node: Node): Dimension {
    return node.style.maxSize.height
  }

  fun getMaxSizeCssValue(node: Node): String {
    return node.style.maxSize.cssValue
  }

  fun getMaxSizeJsonValue(node: Node): String {
    return node.style.maxSize.jsonValue
  }

  fun setMaxSize(node: Node, width: Dimension, height: Dimension) {
    node.style.maxSize = Size(
      width,
      height,
    )
    checkAndUpdateStyle(node)
  }

  fun setMaxSize(
    node: Node,
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    node.style.maxSize = Size(
      Dimension.fromTypeValue(width_type, width) ?: node.style.size.width,
      Dimension.fromTypeValue(height_type, height) ?: node.style.size.height
    )
    checkAndUpdateStyle(node)
  }

  fun setMaxSizeWidth(node: Node, value: Float, type: Int) {
    node.style.setMaxSizeWidth(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMaxSizeHeight(node: Node, value: Float, type: Int) {
    node.style.setMaxSizeHeight(value, type)
    checkAndUpdateStyle(node)
  }

  fun setMaxSizeWidth(node: Node, value: Dimension) {
    node.style.setMaxSizeWidth(value)
    checkAndUpdateStyle(node)
  }

  fun setMaxSizeHeight(node: Node, value: Dimension) {
    node.style.setMaxSizeHeight(value)
    checkAndUpdateStyle(node)
  }


  fun setGap(node: Node, width: Float, height: Float) {
    node.style.gap = Size(
      LengthPercentage.Points(width),
      LengthPercentage.Points(height),
    )
    checkAndUpdateStyle(node)
  }

  fun getGap(node: Node): Size<LengthPercentage> {
    return node.style.gap
  }

  fun getGapRow(node: Node): LengthPercentage {
    return node.style.gap.width
  }

  fun getGapColumn(node: Node): LengthPercentage {
    return node.style.gap.height
  }


  fun setGap(node: Node, row: LengthPercentage, column: LengthPercentage) {
    node.style.gap = Size(
      row,
      column,
    )
    checkAndUpdateStyle(node)
  }

  fun setGap(
    node: Node,
    width: Float,
    width_type: Int,
    height: Float,
    height_type: Int,
  ) {
    node.style.gap = Size(
      LengthPercentage.fromTypeValue(width_type, width) ?: node.style.gap.width,
      LengthPercentage.fromTypeValue(height_type, height) ?: node.style.gap.height
    )
    checkAndUpdateStyle(node)
  }

  fun setGapRow(node: Node, value: Float, type: Int) {
    setRowGap(node, value, type)
  }

  fun setRowGap(node: Node, value: Float, type: Int) {
    node.style.setGapRow(value, type)
    checkAndUpdateStyle(node)
  }

  fun setGapColumn(node: Node, value: Float, type: Int) {
    setColumnGap(node, value, type)
  }

  fun setColumnGap(node: Node, value: Float, type: Int) {
    node.style.setGapColumn(value, type)
    checkAndUpdateStyle(node)
  }

  fun getAspectRatio(node: Node): Float? {
    return node.style.aspectRatio
  }

  fun setAspectRatio(node: Node, aspectRatio: Float?) {
    node.style.aspectRatio = aspectRatio
    checkAndUpdateStyle(node)
  }

  fun getGridAutoRows(node: Node): Array<MinMax> {
    return node.style.gridAutoRows
  }

  fun setGridAutoRows(node: Node, gridAutoRows: Array<MinMax>) {
    node.style.gridAutoRows = gridAutoRows
    checkAndUpdateStyle(node)
  }


  fun getGridAutoColumns(node: Node): Array<MinMax> {
    return node.style.gridAutoColumns
  }

  fun setGridAutoColumns(node: Node, gridAutoColumns: Array<MinMax>) {
    node.style.gridAutoColumns = gridAutoColumns
    checkAndUpdateStyle(node)
  }


  fun getGridAutoFlow(node: Node): GridAutoFlow {
    return node.style.gridAutoFlow
  }

  fun setGridAutoFlow(node: Node, gridAutoFlow: GridAutoFlow) {
    node.style.gridAutoFlow = gridAutoFlow
    checkAndUpdateStyle(node)
  }


  fun getGridColumn(node: Node): Line<GridPlacement> {
    return node.style.gridColumn
  }

  fun setGridColumn(node: Node, gridColumn: Line<GridPlacement>) {
    node.style.gridColumn = gridColumn
    checkAndUpdateStyle(node)
  }

  fun getGridColumnStart(node: Node): GridPlacement {
    return node.style.gridColumnStart
  }

  fun setGridColumnStart(node: Node, gridColumnStart: GridPlacement) {
    node.style.gridColumnStart = gridColumnStart
    checkAndUpdateStyle(node)
  }

  fun getGridColumnEnd(node: Node): GridPlacement {
    return node.style.gridColumnEnd
  }

  fun setGridColumnEnd(node: Node, gridColumnEnd: GridPlacement) {
    node.style.gridColumnEnd = gridColumnEnd
    checkAndUpdateStyle(node)
  }

  fun getGridRow(node: Node): Line<GridPlacement> {
    return node.style.gridRow
  }

  fun setGridRow(node: Node, gridRow: Line<GridPlacement>) {
    node.style.gridRow = gridRow
    checkAndUpdateStyle(node)
  }

  fun getGridRowStart(node: Node): GridPlacement {
    return node.style.gridRowStart
  }

  fun setGridRowStart(node: Node, gridRowStart: GridPlacement) {
    node.style.gridRowStart = gridRowStart
    checkAndUpdateStyle(node)
  }

  fun getGridRowEnd(node: Node): GridPlacement {
    return node.style.gridRowEnd
  }

  fun setGridRowEnd(node: Node, gridRowEnd: GridPlacement) {
    node.style.gridRowEnd = gridRowEnd
    checkAndUpdateStyle(node)
  }

  fun getGridTemplateRows(node: Node): Array<TrackSizingFunction> {
    return node.style.gridTemplateRows
  }

  fun setGridTemplateRows(node: Node, gridTemplateRows: Array<TrackSizingFunction>) {
    node.style.gridTemplateRows = gridTemplateRows
    checkAndUpdateStyle(node)
  }

  fun getGridTemplateColumns(node: Node): Array<TrackSizingFunction> {
    return node.style.gridTemplateColumns
  }

  fun setGridTemplateColumns(node: Node, gridTemplateColumns: Array<TrackSizingFunction>) {
    node.style.gridTemplateColumns = gridTemplateColumns
    checkAndUpdateStyle(node)
  }
}

