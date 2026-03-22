package org.nativescript.mason.masonkit

import android.content.Context
import android.util.Log
import org.nativescript.mason.masonkit.enums.AlignContent
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Direction
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.GridAutoFlow
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.JustifyItems
import org.nativescript.mason.masonkit.enums.JustifySelf
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Position
import org.nativescript.mason.masonkit.enums.TextAlign
import kotlin.math.max
import kotlin.math.min

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


  fun getFloat(view: android.view.View): org.nativescript.mason.masonkit.enums.Float {
    val node = mason.nodeForView(view)
    return node.style.float
  }

  fun setFloat(view: android.view.View, value: org.nativescript.mason.masonkit.enums.Float) {
    val node = mason.nodeForView(view)
    node.style.float = value
  }

  private fun convertFloatRectsToLocalSizes(rects: FloatArray): FloatArray {
    if (rects.isEmpty() || rects.size % 4 != 0) return rects

    val converted = FloatArray(rects.size)
    var i = 0
    while (i + 3 < rects.size) {
      val left = rects[i]
      val top = rects[i + 1]
      val right = rects[i + 2]
      val bottom = rects[i + 3]

      converted[i] = left
      converted[i + 1] = top
      converted[i + 2] = max(0f, right - left)
      converted[i + 3] = max(0f, bottom - top)
      i += 4
    }

    return converted
  }

  private fun queryFloatRects(node: Node): Pair<IntArray, FloatArray> {
    var current: Node? = node
    while (current != null) {
      if (current.nativePtr != 0L) {
        val rects = mason.getFloatRects(current)
        if (rects.isNotEmpty()) {
          val ids = mason.getFloatRectAndroidIds(current)
          return Pair(ids, convertFloatRectsToLocalSizes(rects))
        }
      }
      current = current.parent
    }

    return Pair(IntArray(0), FloatArray(0))
  }

  private fun queryFloatRectsWithIds(node: Node): LongArray {
    var current: Node? = node
    while (current != null) {
      if (current.nativePtr != 0L) {
        val rects = NativeHelpers.nativeNodeGetFloatRectWithIds(mason.getNativePtr(), current.nativePtr)
        if (rects.isNotEmpty()) {
          return rects
        }
      }
      current = current.parent
    }

    return LongArray(0)
  }

  fun getFloatRectsWithAndroidIds(view: android.view.View): LongArray {
    val node = mason.nodeForView(view)
    return queryFloatRectsWithIds(node)
  }

  fun getFloatRectsLocalToView(view: android.view.View): Pair<IntArray, FloatArray> {
    val node = mason.nodeForView(view)
    return queryFloatRects(node)
  }

  fun getCachedFloatInsetsForView(
    view: android.view.View,
    defaultLeft: Float,
    defaultRight: Float
  ): Pair<Float, Float> {
    val (_, rects) = getFloatRectsLocalToView(view)
    if (rects.isEmpty()) return Pair(defaultLeft, defaultRight)
    var leftInset = 0f
    var rightInset = Float.MAX_VALUE
    var i = 0
    while (i + 3 < rects.size) {
      val x = rects[i]
      val w = rects[i + 2]
      if (x <= 0.1f) {
        leftInset = max(leftInset, w)
      } else {
        rightInset = min(rightInset, x)
      }
      i += 4
    }
    if (rightInset == Float.MAX_VALUE) rightInset = leftInset
    return Pair(leftInset, rightInset)
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

  fun setFlexBasis(view: android.view.View, value: Float, type: Byte) {
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
    leftType: Byte,
    top: Float,
    topType: Byte,
    right: Float,
    rightType: Byte,
    bottom: Float,
    bottomType: Byte
  ) {
    val node = mason.nodeForView(view)
    if (LengthPercentage.isValid(leftType, left)) node.style.setPaddingLeft(left, leftType)
    if (LengthPercentage.isValid(rightType, right)) node.style.setPaddingRight(right, rightType)
    if (LengthPercentage.isValid(topType, top)) node.style.setPaddingTop(top, topType)
    if (LengthPercentage.isValid(bottomType, bottom)) node.style.setPaddingBottom(bottom, bottomType)
  }

    /**
     * Safely set padding from raw pixel values if they differ from current padding.
     * Uses `post` to defer the write to avoid re-entrant inset/layout callbacks.
     */
    fun setPaddingIfChanged(
      view: android.view.View,
      left: Float,
      top: Float,
      right: Float,
      bottom: Float
    ) {
      val node = mason.nodeForView(view)
      val current = node.style.padding
      val newLeft = LengthPercentage.Points(left)
      val newRight = LengthPercentage.Points(right)
      val newTop = LengthPercentage.Points(top)
      val newBottom = LengthPercentage.Points(bottom)

      val same = (current.left.type == newLeft.type && current.left.value == newLeft.value
        && current.right.type == newRight.type && current.right.value == newRight.value
        && current.top.type == newTop.type && current.top.value == newTop.value
        && current.bottom.type == newBottom.type && current.bottom.value == newBottom.value)

      if (same) return
      node.style.padding = Rect(newLeft, newRight, newTop, newBottom)
    }


    fun setPaddingLeft(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setPaddingLeft(value, type)

    }

    fun setPaddingRight(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setPaddingRight(value, type)

    }

    fun setPaddingTop(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setPaddingTop(value, type)

    }

    fun setPaddingBottom(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setPaddingBottom(value, type)

    }

    fun setPaddingWithValueType(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setPaddingWithValueType(value, type)

    }

    fun getBorderWidth(view: android.view.View): Rect<LengthPercentage> {
      val node = mason.nodeForView(view)
      return node.style.borderWidth
    }

    fun getBorderLeftWidth(view: android.view.View): LengthPercentage {
      val node = mason.nodeForView(view)
      return node.style.borderLeftWidth
    }

    fun getBorderRightWidth(view: android.view.View): LengthPercentage {
      val node = mason.nodeForView(view)
      return node.style.borderRightWidth
    }

    fun getBorderTopWidth(view: android.view.View): LengthPercentage {
      val node = mason.nodeForView(view)
      return node.style.borderTopWidth
    }

    fun getBorderBottomWidth(view: android.view.View): LengthPercentage {
      val node = mason.nodeForView(view)
      return node.style.borderBottomWidth
    }

    fun getBorderWidthCssValue(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.borderWidth.cssValue
    }

    fun getBorderWidthJsonValue(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.borderWidth.jsonValue
    }

    fun setBorder(view: android.view.View, value: String) {
      val node = mason.nodeForView(view)
      node.style.border = value
    }

    fun getBorder(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.border
    }

    fun setBorderWidth(
      view: android.view.View,
      left: Float,
      top: Float,
      right: Float,
      bottom: Float
    ) {
      val node = mason.nodeForView(view)
      node.style.borderWidth = Rect(
        LengthPercentage.Points(left),
        LengthPercentage.Points(right),
        LengthPercentage.Points(top),
        LengthPercentage.Points(bottom)
      )

    }

    fun setBorderWidth(
      view: android.view.View,
      left: LengthPercentage,
      top: LengthPercentage,
      right: LengthPercentage,
      bottom: LengthPercentage
    ) {
      val node = mason.nodeForView(view)
      node.style.borderWidth = Rect(
        left, right, top, bottom
      )

    }

    fun setBorderWidth(
      view: android.view.View,
      left: Float,
      leftType: Byte,
      top: Float,
      topType: Byte,
      right: Float,
      rightType: Byte,
      bottom: Float,
      bottomType: Byte
    ) {
      val node = mason.nodeForView(view)
      if (LengthPercentage.isValid(leftType, left)) node.style.setBorderLeftWidth(left, leftType)
      if (LengthPercentage.isValid(rightType, right)) node.style.setBorderRightWidth(right, rightType)
      if (LengthPercentage.isValid(topType, top)) node.style.setBorderTopWidth(top, topType)
      if (LengthPercentage.isValid(bottomType, bottom)) node.style.setBorderBottomWidth(bottom, bottomType)

    }

    fun setBorderLeftWidth(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setBorderLeftWidth(value, type)

    }

    fun setBorderRightWidth(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setBorderRightWidth(value, type)

    }

    fun setBorderTopWidth(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setBorderTopWidth(value, type)

    }

    fun setBorderBottomWidth(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setBorderBottomWidth(value, type)

    }

    fun setBorderWithValueType(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setBorderWidth(value, type)

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
      leftType: Byte,
      top: Float,
      topType: Byte,
      right: Float,
      rightType: Byte,
      bottom: Float,
      bottomType: Byte
    ) {
      val node = mason.nodeForView(view)
      if (LengthPercentageAuto.isValid(leftType, left)) node.style.setMarginLeft(left, leftType)
      if (LengthPercentageAuto.isValid(rightType, right)) node.style.setMarginRight(right, rightType)
      if (LengthPercentageAuto.isValid(topType, top)) node.style.setMarginTop(top, topType)
      if (LengthPercentageAuto.isValid(bottomType, bottom)) node.style.setMarginBottom(bottom, bottomType)
    }

    fun setMarginLeft(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setMarginLeft(value, type)

    }

    fun setMarginRight(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setMarginRight(value, type)

    }

    fun setMarginTop(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setMarginTop(value, type)

    }

    fun setMarginBottom(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setMarginBottom(value, type)

    }

    fun setMarginWithValueType(view: android.view.View, value: Float, type: Byte) {
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
      leftType: Byte,
      top: Float,
      topType: Byte,
      right: Float,
      rightType: Byte,
      bottom: Float,
      bottomType: Byte
    ) {
      val node = mason.nodeForView(view)
      if (LengthPercentageAuto.isValid(leftType, left)) node.style.setInsetLeft(left, leftType)
      if (LengthPercentageAuto.isValid(rightType, right)) node.style.setInsetRight(right, rightType)
      if (LengthPercentageAuto.isValid(topType, top)) node.style.setInsetTop(top, topType)
      if (LengthPercentageAuto.isValid(bottomType, bottom)) node.style.setInsetBottom(bottom, bottomType)

    }

    fun setInsetLeft(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setInsetLeft(value, type)

    }

    fun setInsetRight(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setInsetRight(value, type)

    }

    fun setInsetTop(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setInsetTop(value, type)

    }

    fun setInsetBottom(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setInsetBottom(value, type)

    }

    fun setInsetWithValueType(view: android.view.View, value: Float, type: Byte) {
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
      widthType: Byte,
      height: Float,
      heightType: Byte,
    ) {
      val node = mason.nodeForView(view)
      if (Dimension.isValid(widthType, width)) node.style.setMinSizeWidth(width, widthType)
      if (Dimension.isValid(heightType, height)) node.style.setMinSizeHeight(height, heightType)

    }


    fun setMinSizeWidth(view: android.view.View, value: Dimension) {
      val node = mason.nodeForView(view)
      node.style.setMinSizeWidth(value)

    }

    fun setMinSizeHeight(view: android.view.View, value: Dimension) {
      val node = mason.nodeForView(view)
      node.style.setMinSizeHeight(value)

    }


    fun setMinSizeWidth(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setMinSizeWidth(value, type)

    }

    fun setMinSizeHeight(view: android.view.View, value: Float, type: Byte) {
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
      widthType: Byte,
      height: Float,
      heightType: Byte,
    ) {
      val node = mason.nodeForView(view)
      if (Dimension.isValid(widthType, width)) node.style.setSizeWidth(width, widthType)
      if (Dimension.isValid(heightType, height)) node.style.setSizeHeight(height, heightType)
    }

    fun setSizeWidth(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setSizeWidth(value, type)

    }

    fun setSizeWidth(view: android.view.View, value: Dimension) {
      val node = mason.nodeForView(view)
      node.style.setSizeWidth(value)

    }

    fun setSizeHeight(view: android.view.View, value: Float, type: Byte) {
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
      widthType: Byte,
      height: Float,
      heightType: Byte,
    ) {
      val node = mason.nodeForView(view)
      if (Dimension.isValid(widthType, width)) node.style.setMaxSizeWidth(width, widthType)
      if (Dimension.isValid(heightType, height)) node.style.setMaxSizeHeight(height, heightType)

    }

    fun setMaxSizeWidth(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setMaxSizeWidth(value, type)

    }

    fun setMaxSizeHeight(view: android.view.View, value: Float, type: Byte) {
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
      widthType: Byte,
      height: Float,
      heightType: Byte,
    ) {
      val node = mason.nodeForView(view)
      if (LengthPercentage.isValid(widthType, width)) node.style.setGapRow(width, widthType)
      if (LengthPercentage.isValid(heightType, height)) node.style.setGapColumn(height, heightType)

    }

    fun setGapRow(view: android.view.View, value: Float, type: Byte) {
      if (LengthPercentage.isValid(type, value)) setRowGap(view, value, type)
    }

    fun setRowGap(view: android.view.View, value: Float, type: Byte) {
      val node = mason.nodeForView(view)
      node.style.setGapRow(value, type)

    }

    fun setGapColumn(view: android.view.View, value: Float, type: Byte) {
      if (LengthPercentage.isValid(type, value)) setColumnGap(view, value, type)
    }

    fun setColumnGap(view: android.view.View, value: Float, type: Byte) {
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

    fun getGridAutoRows(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridAutoRows
    }

    fun setGridAutoRows(view: android.view.View, gridAutoRows: String) {
      val node = mason.nodeForView(view)
      node.style.gridAutoRows = gridAutoRows

    }


    fun getGridAutoColumns(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridAutoColumns
    }

    fun setGridAutoColumns(view: android.view.View, gridAutoColumns: String) {
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


    fun getGridColumn(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridColumn
    }

    fun setGridColumn(view: android.view.View, gridColumn: String) {
      val node = mason.nodeForView(view)
      node.style.gridColumn = gridColumn

    }

    fun getGridColumnStart(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridColumnStart
    }

    fun setGridColumnStart(view: android.view.View, gridColumnStart: String) {
      val node = mason.nodeForView(view)
      node.style.gridColumnStart = gridColumnStart

    }

    fun getGridColumnEnd(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridColumnEnd
    }

    fun setGridColumnEnd(view: android.view.View, gridColumnEnd: String) {
      val node = mason.nodeForView(view)
      node.style.gridColumnEnd = gridColumnEnd

    }

    fun getGridRow(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridRow
    }

    fun setGridRow(view: android.view.View, gridRow: String) {
      val node = mason.nodeForView(view)
      node.style.gridRow = gridRow

    }

    fun getGridRowStart(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridRowStart
    }

    fun setGridRowStart(view: android.view.View, gridRowStart: String) {
      val node = mason.nodeForView(view)
      node.style.gridRowStart = gridRowStart

    }

    fun getGridRowEnd(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridRowEnd
    }

    fun setGridRowEnd(view: android.view.View, gridRowEnd: String) {
      val node = mason.nodeForView(view)
      node.style.gridRowEnd = gridRowEnd

    }

    fun getGridTemplateRows(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridTemplateRows
    }

    fun setGridTemplateRows(view: android.view.View, gridTemplateRows: String) {
      val node = mason.nodeForView(view)
      node.style.gridTemplateRows = gridTemplateRows

    }

    fun getGridTemplateColumns(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridTemplateColumns
    }

    fun setGridTemplateColumns(
      view: android.view.View,
      gridTemplateColumns: String
    ) {
      val node = mason.nodeForView(view)
      node.style.gridTemplateColumns = gridTemplateColumns
    }


    fun getGridArea(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridArea
    }

    fun setGridArea(
      view: android.view.View,
      area: String
    ) {
      val node = mason.nodeForView(view)
      node.style.gridArea = area
    }

    fun getGridTemplateAreas(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.gridTemplateAreas
    }

    fun setGridTemplateAreas(
      view: android.view.View,
      gridTemplateColumns: String
    ) {
      val node = mason.nodeForView(view)
      node.style.gridTemplateAreas = gridTemplateColumns
    }


    fun getBackground(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.background
    }

    fun setBackground(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.background = value
    }


    fun getFilter(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.filter
    }

    fun setFilter(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.filter = value
    }


    fun getBorderRadius(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.borderRadius
    }

    fun setBorderRadius(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.borderRadius = value
    }

    fun getBackgroundColor(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.mBackground?.color?.rgbaToHexCSS() ?: ""
    }

    fun setBackgroundColor(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.setBackgroundColor(value)
    }

    fun getBackgroundImage(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.backgroundImage
    }

    fun setBackgroundImage(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.backgroundImage = value
    }

    fun getBackgroundRepeat(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.backgroundRepeat
    }

    fun setBackgroundRepeat(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.backgroundRepeat = value
    }

    fun getBackgroundPosition(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.backgroundPosition
    }

    fun setBackgroundPosition(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.backgroundPosition = value
    }

    fun getBackgroundSize(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.backgroundSize
    }

    fun setBackgroundSize(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.backgroundSize = value
    }

    fun getBackgroundClip(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.backgroundClip
    }

    fun setBackgroundClip(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.backgroundClip = value
    }

    fun getTextShadow(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.textShadow
    }

    fun setTextShadow(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.textShadow = value
    }


    fun getCornerShape(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.cornerShape
    }

    fun setCornerShape(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.cornerShape = value
    }

    fun getCornerShapeTopLeft(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.cornerShapeTopLeft
    }

    fun setCornerShapeTopLeft(view: android.view.View, value: String) {
      val node = mason.nodeForView(view)
      node.style.cornerShapeTopLeft = value
    }

    fun getCornerShapeTopRight(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.cornerShapeTopRight
    }

    fun setCornerShapeTopRight(view: android.view.View, value: String) {
      val node = mason.nodeForView(view)
      node.style.cornerShapeTopRight = value
    }

    fun getCornerShapeBottomRight(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.cornerShapeBottomRight
    }

    fun setCornerShapeBottomRight(view: android.view.View, value: String) {
      val node = mason.nodeForView(view)
      node.style.cornerShapeBottomRight = value
    }

    fun getCornerShapeBottomLeft(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.cornerShapeBottomLeft
    }

    fun setCornerShapeBottomLeft(view: android.view.View, value: String) {
      val node = mason.nodeForView(view)
      node.style.cornerShapeBottomLeft = value
    }

    fun getBoxShadow(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.boxShadow
    }

    fun setBoxShadow(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.boxShadow = value
    }

    fun getTransform(view: android.view.View): String {
      val node = mason.nodeForView(view)
      return node.style.transform
    }

    fun setTransform(
      view: android.view.View,
      value: String
    ) {
      val node = mason.nodeForView(view)
      node.style.transform = value
    }

    fun compute(node: Node) {
      NativeHelpers.nativeNodeCompute(
        node.mason.nativePtr, node.nativePtr
      )
    }
  }
