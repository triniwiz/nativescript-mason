package org.nativescript.mason.masonkit

import android.content.Context
import android.util.Log

class NodeHelper(val mason: Mason) {
  companion object {
    @JvmStatic
    val shared = NodeHelper(Mason.shared)
  }

  val views: ArrayList<View> = ArrayList()

  fun configure(view: android.view.View, block: (Style) -> Unit) {
    mason.configureStyleForView(view, block)
  }

  private inline fun <T> measurePerformanceInMS(
    logger: (Long) -> Unit, function: () -> T
  ): T {
    val startTime = System.currentTimeMillis()
    val result: T = function.invoke()
    val endTime = System.currentTimeMillis()
    logger.invoke(endTime - startTime)
    return result
  }

  //the logger function
  fun logPerf(time: Long) {
    Log.d("JS", "PERFORMANCE IN MS: $time ms ")
  }

  //the function whose performance needs to be checked
  fun longRunningFunction(): Int {
    var x = 0
    for (i in 1..20000) x++
    return x
  }


  fun batchCreateViews(context: Context) {

//    measurePerformanceInMS({time -> logPerf(time)}){
    for (i in 1..1000) {
      views.add(View(context));
    }
//    }
  }

  private fun checkAndUpdateStyle(node: Node) {
    if (!node.style.inBatch) {
      node.style.updateNativeStyle()
    }
  }

  fun getDisplay(view: android.view.View): Display {
    val node = mason.nodeForView(view)
    return node.style.display
  }

  fun setDisplay(view: android.view.View, display: Display) {
    val node = mason.nodeForView(view)
    node.style.display = display

  }

  fun getPosition(view: android.view.View): Position {
    val node = mason.nodeForView(view)
    return node.style.position
  }

  fun setPosition(view: android.view.View, position: Position) {
    val node = mason.nodeForView(view)
    node.style.position = position

  }

  fun getDirection(view: android.view.View): Direction {
    val node = mason.nodeForView(view)
    return node.style.direction
  }

  fun setDirection(view: android.view.View, direction: Direction) {
    val node = mason.nodeForView(view)
    node.style.direction = direction

  }

  fun getFlexDirection(view: android.view.View): FlexDirection {
    val node = mason.nodeForView(view)
    return node.style.flexDirection
  }

  fun setFlexDirection(view: android.view.View, direction: FlexDirection) {
    val node = mason.nodeForView(view)
    node.style.flexDirection = direction

  }


  fun getFlexWrap(view: android.view.View): FlexWrap {
    val node = mason.nodeForView(view)
    return node.style.flexWrap
  }

  fun setFlexWrap(view: android.view.View, flexWrap: FlexWrap) {
    val node = mason.nodeForView(view)
    node.style.flexWrap = flexWrap

  }

  fun getOverflow(view: android.view.View): Point<Overflow> {
    val node = mason.nodeForView(view)
    return node.style.overflow
  }

  fun setOverflow(view: android.view.View, overflow: Point<Overflow>) {
    val node = mason.nodeForView(view)
    node.style.overflow = overflow

  }

  fun getOverflowX(view: android.view.View): Overflow {
    val node = mason.nodeForView(view)
    return node.style.overflowX
  }

  fun setOverflowX(view: android.view.View, overflow: Overflow) {
    val node = mason.nodeForView(view)
    node.style.overflowX = overflow

  }

  fun getOverflowY(view: android.view.View): Overflow {
    val node = mason.nodeForView(view)
    return node.style.overflowY
  }

  fun setOverflowY(view: android.view.View, overflow: Overflow) {
    val node = mason.nodeForView(view)
    node.style.overflowY = overflow

  }

  fun getScrollBarWidth(view: android.view.View): Float {
    val node = mason.nodeForView(view)
    return node.style.scrollBarWidth
  }

  fun setScrollBarWidth(view: android.view.View, scrollBarWidth: Float) {
    val node = mason.nodeForView(view)
    node.style.scrollBarWidth = scrollBarWidth

  }


  fun getAlignItems(view: android.view.View): AlignItems {
    val node = mason.nodeForView(view)
    return node.style.alignItems
  }

  fun setAlignItems(view: android.view.View, alignItems: AlignItems) {
    val node = mason.nodeForView(view)
    node.style.alignItems = alignItems

  }


  fun getAlignSelf(view: android.view.View): AlignSelf {
    val node = mason.nodeForView(view)
    return node.style.alignSelf
  }

  fun setAlignSelf(view: android.view.View, alignSelf: AlignSelf) {
    val node = mason.nodeForView(view)
    node.style.alignSelf = alignSelf

  }


  fun getAlignContent(view: android.view.View): AlignContent {
    val node = mason.nodeForView(view)
    return node.style.alignContent
  }

  fun setAlignContent(view: android.view.View, alignContent: AlignContent) {
    val node = mason.nodeForView(view)
    node.style.alignContent = alignContent

  }

  fun getJustifyItems(view: android.view.View): JustifyItems {
    val node = mason.nodeForView(view)
    return node.style.justifyItems
  }

  fun setJustifyItems(view: android.view.View, justifyItems: JustifyItems) {
    val node = mason.nodeForView(view)
    node.style.justifyItems = justifyItems

  }

  fun getJustifySelf(view: android.view.View): JustifySelf {
    val node = mason.nodeForView(view)
    return node.style.justifySelf
  }

  fun setJustifySelf(view: android.view.View, justifySelf: JustifySelf) {
    val node = mason.nodeForView(view)
    node.style.justifySelf = justifySelf

  }

  fun getJustifyContent(view: android.view.View): JustifyContent {
    val node = mason.nodeForView(view)
    return node.style.justifyContent
  }

  fun setJustifyContent(view: android.view.View, justifyContent: JustifyContent) {
    val node = mason.nodeForView(view)
    node.style.justifyContent = justifyContent

  }

  fun getFlexGrow(view: android.view.View): Float {
    val node = mason.nodeForView(view)
    return node.style.flexGrow
  }

  fun setFlexGrow(view: android.view.View, flexGrow: Float) {
    val node = mason.nodeForView(view)
    node.style.flexGrow = flexGrow

  }


  fun getFlexShrink(view: android.view.View): Float {
    val node = mason.nodeForView(view)
    return node.style.flexShrink
  }

  fun setFlexShrink(view: android.view.View, flexShrink: Float) {
    val node = mason.nodeForView(view)
    node.style.flexShrink = flexShrink

  }

  fun setFlexBasis(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setFlexBasis(value, type)

  }


  fun getFlexBasis(view: android.view.View): Dimension {
    val node = mason.nodeForView(view)
    return node.style.flexBasis
  }

  fun setFlexBasis(view: android.view.View, flexBasis: Dimension) {
    val node = mason.nodeForView(view)
    node.style.flexBasis = flexBasis

  }

  fun getPadding(view: android.view.View): Rect<LengthPercentage> {
    val node = mason.nodeForView(view)
    return node.style.padding
  }

  fun getStylePaddingLeft(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.padding.left
  }

  fun getStylePaddingRight(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.padding.right
  }

  fun getStylePaddingTop(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.padding.top
  }

  fun getStylePaddingBottom(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.padding.bottom
  }

  fun getPaddingCssValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.padding.cssValue
  }

  fun getPaddingJsonValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.padding.jsonValue
  }

  fun setPadding(view: android.view.View, left: Float, top: Float, right: Float, bottom: Float) {
    val node = mason.nodeForView(view)
    node.style.padding = Rect(
      LengthPercentage.Points(left),
      LengthPercentage.Points(right),
      LengthPercentage.Points(top),
      LengthPercentage.Points(bottom)
    )

  }

  fun setPadding(
    view: android.view.View,
    left: LengthPercentage,
    top: LengthPercentage,
    right: LengthPercentage,
    bottom: LengthPercentage
  ) {
    val node = mason.nodeForView(view)
    node.style.padding = Rect(
      left, right, top, bottom
    )

  }

  fun setPadding(
    view: android.view.View,
    left: Float,
    leftType: Int,
    top: Float,
    topType: Int,
    right: Float,
    rightType: Int,
    bottom: Float,
    bottomType: Int
  ) {
    val node = mason.nodeForView(view)
    node.style.padding = Rect(
      LengthPercentage.fromTypeValue(leftType, left) ?: node.style.padding.left,
      LengthPercentage.fromTypeValue(rightType, right) ?: node.style.padding.right,
      LengthPercentage.fromTypeValue(topType, top) ?: node.style.padding.top,
      LengthPercentage.fromTypeValue(bottomType, bottom) ?: node.style.padding.bottom
    )

  }


  fun setPaddingLeft(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setPaddingLeft(value, type)

  }

  fun setPaddingRight(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setPaddingRight(value, type)

  }

  fun setPaddingTop(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setPaddingTop(value, type)

  }

  fun setPaddingBottom(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setPaddingBottom(value, type)

  }

  fun setPaddingWithValueType(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setPaddingWithValueType(value, type)

  }

  fun getBorder(view: android.view.View): Rect<LengthPercentage> {
    val node = mason.nodeForView(view)
    return node.style.border
  }

  fun getBorderLeft(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.border.left
  }

  fun getBorderRight(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.border.right
  }

  fun getBorderTop(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.border.top
  }

  fun getBorderBottom(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.border.bottom
  }

  fun getBorderCssValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.border.cssValue
  }

  fun getBorderJsonValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.border.jsonValue
  }

  fun setBorder(view: android.view.View, left: Float, top: Float, right: Float, bottom: Float) {
    val node = mason.nodeForView(view)
    node.style.border = Rect(
      LengthPercentage.Points(left),
      LengthPercentage.Points(right),
      LengthPercentage.Points(top),
      LengthPercentage.Points(bottom)
    )

  }

  fun setBorder(
    view: android.view.View,
    left: LengthPercentage,
    top: LengthPercentage,
    right: LengthPercentage,
    bottom: LengthPercentage
  ) {
    val node = mason.nodeForView(view)
    node.style.border = Rect(
      left, right, top, bottom
    )

  }

  fun setBorder(
    view: android.view.View,
    left: Float,
    leftType: Int,
    top: Float,
    topType: Int,
    right: Float,
    rightType: Int,
    bottom: Float,
    bottomType: Int
  ) {
    val node = mason.nodeForView(view)
    node.style.border = Rect(
      LengthPercentage.fromTypeValue(leftType, left) ?: node.style.border.left,
      LengthPercentage.fromTypeValue(rightType, right) ?: node.style.border.right,
      LengthPercentage.fromTypeValue(topType, top) ?: node.style.border.top,
      LengthPercentage.fromTypeValue(bottomType, bottom) ?: node.style.border.bottom
    )

  }

  fun setBorderLeft(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setBorderLeft(value, type)

  }

  fun setBorderRight(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setBorderRight(value, type)

  }

  fun setBorderTop(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setBorderTop(value, type)

  }

  fun setBorderBottom(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setBorderBottom(value, type)

  }

  fun setBorderWithValueType(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setBorderWithValueType(value, type)

  }

  fun getMargin(view: android.view.View): Rect<LengthPercentageAuto> {
    val node = mason.nodeForView(view)
    return node.style.margin
  }

  fun getMarginLeft(view: android.view.View): LengthPercentageAuto {
    val node = mason.nodeForView(view)
    return node.style.margin.left
  }

  fun getMarginRight(view: android.view.View): LengthPercentageAuto {
    val node = mason.nodeForView(view)
    return node.style.margin.right
  }

  fun getMarginTop(view: android.view.View): LengthPercentageAuto {
    val node = mason.nodeForView(view)
    return node.style.margin.top
  }

  fun getMarginBottom(view: android.view.View): LengthPercentageAuto {
    val node = mason.nodeForView(view)
    return node.style.margin.bottom
  }

  fun getMarginCssValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.margin.cssValue
  }

  fun getMarginJsonValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.margin.jsonValue
  }

  fun setMargin(view: android.view.View, left: Float, top: Float, right: Float, bottom: Float) {
    val node = mason.nodeForView(view)
    node.style.margin = Rect(
      LengthPercentageAuto.Points(left),
      LengthPercentageAuto.Points(right),
      LengthPercentageAuto.Points(top),
      LengthPercentageAuto.Points(bottom)
    )

  }

  fun setMargin(
    view: android.view.View,
    left: LengthPercentageAuto,
    top: LengthPercentageAuto,
    right: LengthPercentageAuto,
    bottom: LengthPercentageAuto
  ) {
    val node = mason.nodeForView(view)
    node.style.margin = Rect(
      left, right, top, bottom
    )

  }

  fun setMargin(
    view: android.view.View,
    left: Float,
    leftType: Int,
    top: Float,
    topType: Int,
    right: Float,
    rightType: Int,
    bottom: Float,
    bottomType: Int
  ) {
    val node = mason.nodeForView(view)
    node.style.margin = Rect(
      LengthPercentageAuto.fromTypeValue(leftType, left) ?: node.style.margin.left,
      LengthPercentageAuto.fromTypeValue(rightType, right) ?: node.style.margin.right,
      LengthPercentageAuto.fromTypeValue(topType, top) ?: node.style.margin.top,
      LengthPercentageAuto.fromTypeValue(bottomType, bottom) ?: node.style.margin.bottom
    )

  }

  fun setMarginLeft(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMarginLeft(value, type)

  }

  fun setMarginRight(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMarginRight(value, type)

  }

  fun setMarginTop(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMarginTop(value, type)

  }

  fun setMarginBottom(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMarginBottom(value, type)

  }

  fun setMarginWithValueType(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMarginWithValueType(value, type)

  }

  fun getInset(view: android.view.View): Rect<LengthPercentageAuto> {
    val node = mason.nodeForView(view)
    return node.style.inset
  }

  fun getInsetLeft(view: android.view.View): LengthPercentageAuto {
    val node = mason.nodeForView(view)
    return node.style.inset.left
  }

  fun getInsetRight(view: android.view.View): LengthPercentageAuto {
    val node = mason.nodeForView(view)
    return node.style.inset.right
  }

  fun getInsetTop(view: android.view.View): LengthPercentageAuto {
    val node = mason.nodeForView(view)
    return node.style.inset.top
  }

  fun getInsetBottom(view: android.view.View): LengthPercentageAuto {
    val node = mason.nodeForView(view)
    return node.style.inset.bottom
  }

  fun getInsetCssValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.inset.cssValue
  }

  fun getInsetJsonValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.inset.jsonValue
  }

  fun setPosition(view: android.view.View, left: Float, top: Float, right: Float, bottom: Float) {
    val node = mason.nodeForView(view)
    node.style.inset = Rect(
      LengthPercentageAuto.Points(left),
      LengthPercentageAuto.Points(right),
      LengthPercentageAuto.Points(top),
      LengthPercentageAuto.Points(bottom)
    )

  }

  fun setPosition(
    view: android.view.View,
    left: LengthPercentageAuto,
    top: LengthPercentageAuto,
    right: LengthPercentageAuto,
    bottom: LengthPercentageAuto
  ) {
    val node = mason.nodeForView(view)
    node.style.inset = Rect(
      left, right, top, bottom
    )

  }

  fun setInset(
    view: android.view.View,
    left: Float,
    leftType: Int,
    top: Float,
    topType: Int,
    right: Float,
    rightType: Int,
    bottom: Float,
    bottomType: Int
  ) {
    val node = mason.nodeForView(view)
    node.style.inset = Rect(
      LengthPercentageAuto.fromTypeValue(leftType, left) ?: node.style.inset.left,
      LengthPercentageAuto.fromTypeValue(rightType, right) ?: node.style.inset.right,
      LengthPercentageAuto.fromTypeValue(topType, top) ?: node.style.inset.top,
      LengthPercentageAuto.fromTypeValue(bottomType, bottom) ?: node.style.inset.bottom
    )

  }

  fun setInsetLeft(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setInsetLeft(value, type)

  }

  fun setInsetRight(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setInsetRight(value, type)

  }

  fun setInsetTop(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setInsetTop(value, type)

  }

  fun setInsetBottom(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setInsetBottom(value, type)

  }

  fun setInsetWithValueType(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setInsetWithValueType(value, type)

  }

  fun setMinSize(view: android.view.View, width: Float, height: Float) {
    val node = mason.nodeForView(view)
    node.style.minSize = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )

  }

  fun getMinSize(view: android.view.View): Size<Dimension> {
    val node = mason.nodeForView(view)
    return node.style.minSize
  }

  fun getMinSizeWidth(view: android.view.View): Dimension {
    val node = mason.nodeForView(view)
    return node.style.minSize.width
  }

  fun getMinSizeHeight(view: android.view.View): Dimension {
    val node = mason.nodeForView(view)
    return node.style.minSize.height
  }

  fun getMinSizeCssValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.minSize.cssValue
  }

  fun getMinSizeJsonValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.minSize.jsonValue
  }

  fun setMinSize(view: android.view.View, width: Dimension, height: Dimension) {
    val node = mason.nodeForView(view)
    node.style.minSize = Size(
      width,
      height,
    )

  }

  fun setMinSize(
    view: android.view.View,
    width: Float,
    widthType: Int,
    height: Float,
    heightType: Int,
  ) {
    val node = mason.nodeForView(view)
    node.style.minSize = Size(
      Dimension.fromTypeValue(widthType, width) ?: node.style.minSize.width,
      Dimension.fromTypeValue(heightType, height) ?: node.style.minSize.height
    )

  }


  fun setMinSizeWidth(view: android.view.View, value: Dimension) {
    val node = mason.nodeForView(view)
    node.style.setMinSizeWidth(value)

  }

  fun setMinSizeHeight(view: android.view.View, value: Dimension) {
    val node = mason.nodeForView(view)
    node.style.setMinSizeHeight(value)

  }


  fun setMinSizeWidth(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMinSizeWidth(value, type)

  }

  fun setMinSizeHeight(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMinSizeHeight(value, type)

  }

  fun setSize(view: android.view.View, width: Float, height: Float) {
    val node = mason.nodeForView(view)
    node.style.size = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )

  }

  fun getSize(view: android.view.View): Size<Dimension> {
    val node = mason.nodeForView(view)
    return node.style.size
  }

  fun getSizeCssValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.size.cssValue
  }

  fun getSizeJsonValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.size.jsonValue
  }

  fun getSizeWidth(view: android.view.View): Dimension {
    val node = mason.nodeForView(view)
    return node.style.size.width
  }

  fun getSizeHeight(view: android.view.View): Dimension {
    val node = mason.nodeForView(view)
    return node.style.size.height
  }

  fun setSize(view: android.view.View, width: Dimension, height: Dimension) {
    val node = mason.nodeForView(view)
    node.style.size = Size(
      width,
      height,
    )

  }

  fun setSize(
    view: android.view.View,
    width: Float,
    widthType: Int,
    height: Float,
    heightType: Int,
  ) {
    val node = mason.nodeForView(view)
    node.style.size = Size(
      Dimension.fromTypeValue(widthType, width) ?: node.style.size.width,
      Dimension.fromTypeValue(heightType, height) ?: node.style.size.height
    )

  }

  fun setSizeWidth(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setSizeWidth(value, type)

  }

  fun setSizeWidth(view: android.view.View, value: Dimension) {
    val node = mason.nodeForView(view)
    node.style.setSizeWidth(value)

  }

  fun setSizeHeight(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setSizeHeight(value, type)

  }

  fun setMaxSize(view: android.view.View, width: Float, height: Float) {
    val node = mason.nodeForView(view)
    node.style.maxSize = Size(
      Dimension.Points(width),
      Dimension.Points(height),
    )

  }

  fun getMaxSize(view: android.view.View): Size<Dimension> {
    val node = mason.nodeForView(view)
    return node.style.maxSize
  }

  fun getMaxSizeWidth(view: android.view.View): Dimension {
    val node = mason.nodeForView(view)
    return node.style.maxSize.width
  }

  fun getMaxSizeHeight(view: android.view.View): Dimension {
    val node = mason.nodeForView(view)
    return node.style.maxSize.height
  }

  fun getMaxSizeCssValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.maxSize.cssValue
  }

  fun getMaxSizeJsonValue(view: android.view.View): String {
    val node = mason.nodeForView(view)
    return node.style.maxSize.jsonValue
  }

  fun setMaxSize(view: android.view.View, width: Dimension, height: Dimension) {
    val node = mason.nodeForView(view)
    node.style.maxSize = Size(
      width,
      height,
    )

  }

  fun setMaxSize(
    view: android.view.View,
    width: Float,
    widthType: Int,
    height: Float,
    heightType: Int,
  ) {
    val node = mason.nodeForView(view)
    node.style.maxSize = Size(
      Dimension.fromTypeValue(widthType, width) ?: node.style.size.width,
      Dimension.fromTypeValue(heightType, height) ?: node.style.size.height
    )

  }

  fun setMaxSizeWidth(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMaxSizeWidth(value, type)

  }

  fun setMaxSizeHeight(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setMaxSizeHeight(value, type)

  }

  fun setMaxSizeWidth(view: android.view.View, value: Dimension) {
    val node = mason.nodeForView(view)
    node.style.setMaxSizeWidth(value)

  }

  fun setMaxSizeHeight(view: android.view.View, value: Dimension) {
    val node = mason.nodeForView(view)
    node.style.setMaxSizeHeight(value)

  }


  fun setGap(view: android.view.View, width: Float, height: Float) {
    val node = mason.nodeForView(view)
    node.style.gap = Size(
      LengthPercentage.Points(width),
      LengthPercentage.Points(height),
    )

  }

  fun getGap(view: android.view.View): Size<LengthPercentage> {
    val node = mason.nodeForView(view)
    return node.style.gap
  }

  fun getGapRow(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.gap.width
  }

  fun getGapColumn(view: android.view.View): LengthPercentage {
    val node = mason.nodeForView(view)
    return node.style.gap.height
  }


  fun setGap(view: android.view.View, row: LengthPercentage, column: LengthPercentage) {
    val node = mason.nodeForView(view)
    node.style.gap = Size(
      row,
      column,
    )

  }

  fun setGap(
    view: android.view.View,
    width: Float,
    widthType: Int,
    height: Float,
    heightType: Int,
  ) {
    val node = mason.nodeForView(view)
    node.style.gap = Size(
      LengthPercentage.fromTypeValue(widthType, width) ?: node.style.gap.width,
      LengthPercentage.fromTypeValue(heightType, height) ?: node.style.gap.height
    )

  }

  fun setGapRow(view: android.view.View, value: Float, type: Int) {
    setRowGap(view, value, type)
  }

  fun setRowGap(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setGapRow(value, type)

  }

  fun setGapColumn(view: android.view.View, value: Float, type: Int) {
    setColumnGap(view, value, type)
  }

  fun setColumnGap(view: android.view.View, value: Float, type: Int) {
    val node = mason.nodeForView(view)
    node.style.setGapColumn(value, type)

  }

  fun getAspectRatio(view: android.view.View): Float? {
    val node = mason.nodeForView(view)
    return node.style.aspectRatio
  }

  fun setAspectRatio(view: android.view.View, aspectRatio: Float?) {
    val node = mason.nodeForView(view)
    node.style.aspectRatio = aspectRatio

  }

  fun getTextAlign(view: android.view.View): TextAlign {
    val node = mason.nodeForView(view)
    return node.style.textAlign
  }

  fun setTextAlign(view: android.view.View, align: TextAlign) {
    val node = mason.nodeForView(view)
    node.style.textAlign = align
  }

  fun getBoxSizing(view: android.view.View): BoxSizing {
    val node = mason.nodeForView(view)
    return node.style.boxSizing
  }

  fun setTextAlign(view: android.view.View, sizing: BoxSizing) {
    val node = mason.nodeForView(view)
    node.style.boxSizing = sizing
  }

  fun getGridAutoRows(view: android.view.View): Array<MinMax> {
    val node = mason.nodeForView(view)
    return node.style.gridAutoRows
  }

  fun setGridAutoRows(view: android.view.View, gridAutoRows: Array<MinMax>) {
    val node = mason.nodeForView(view)
    node.style.gridAutoRows = gridAutoRows

  }


  fun getGridAutoColumns(view: android.view.View): Array<MinMax> {
    val node = mason.nodeForView(view)
    return node.style.gridAutoColumns
  }

  fun setGridAutoColumns(view: android.view.View, gridAutoColumns: Array<MinMax>) {
    val node = mason.nodeForView(view)
    node.style.gridAutoColumns = gridAutoColumns

  }


  fun getGridAutoFlow(view: android.view.View): GridAutoFlow {
    val node = mason.nodeForView(view)
    return node.style.gridAutoFlow
  }

  fun setGridAutoFlow(view: android.view.View, gridAutoFlow: GridAutoFlow) {
    val node = mason.nodeForView(view)
    node.style.gridAutoFlow = gridAutoFlow

  }


  fun getGridColumn(view: android.view.View): Line<GridPlacement> {
    val node = mason.nodeForView(view)
    return node.style.gridColumn
  }

  fun setGridColumn(view: android.view.View, gridColumn: Line<GridPlacement>) {
    val node = mason.nodeForView(view)
    node.style.gridColumn = gridColumn

  }

  fun getGridColumnStart(view: android.view.View): GridPlacement {
    val node = mason.nodeForView(view)
    return node.style.gridColumnStart
  }

  fun setGridColumnStart(view: android.view.View, gridColumnStart: GridPlacement) {
    val node = mason.nodeForView(view)
    node.style.gridColumnStart = gridColumnStart

  }

  fun getGridColumnEnd(view: android.view.View): GridPlacement {
    val node = mason.nodeForView(view)
    return node.style.gridColumnEnd
  }

  fun setGridColumnEnd(view: android.view.View, gridColumnEnd: GridPlacement) {
    val node = mason.nodeForView(view)
    node.style.gridColumnEnd = gridColumnEnd

  }

  fun getGridRow(view: android.view.View): Line<GridPlacement> {
    val node = mason.nodeForView(view)
    return node.style.gridRow
  }

  fun setGridRow(view: android.view.View, gridRow: Line<GridPlacement>) {
    val node = mason.nodeForView(view)
    node.style.gridRow = gridRow

  }

  fun getGridRowStart(view: android.view.View): GridPlacement {
    val node = mason.nodeForView(view)
    return node.style.gridRowStart
  }

  fun setGridRowStart(view: android.view.View, gridRowStart: GridPlacement) {
    val node = mason.nodeForView(view)
    node.style.gridRowStart = gridRowStart

  }

  fun getGridRowEnd(view: android.view.View): GridPlacement {
    val node = mason.nodeForView(view)
    return node.style.gridRowEnd
  }

  fun setGridRowEnd(view: android.view.View, gridRowEnd: GridPlacement) {
    val node = mason.nodeForView(view)
    node.style.gridRowEnd = gridRowEnd

  }

  fun getGridTemplateRows(view: android.view.View): Array<TrackSizingFunction> {
    val node = mason.nodeForView(view)
    return node.style.gridTemplateRows
  }

  fun setGridTemplateRows(view: android.view.View, gridTemplateRows: Array<TrackSizingFunction>) {
    val node = mason.nodeForView(view)
    node.style.gridTemplateRows = gridTemplateRows

  }

  fun getGridTemplateColumns(view: android.view.View): Array<TrackSizingFunction> {
    val node = mason.nodeForView(view)
    return node.style.gridTemplateColumns
  }

  fun setGridTemplateColumns(
    view: android.view.View,
    gridTemplateColumns: Array<TrackSizingFunction>
  ) {
    val node = mason.nodeForView(view)
    node.style.gridTemplateColumns = gridTemplateColumns

  }
}

