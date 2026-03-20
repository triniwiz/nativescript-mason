//
//  MasonView.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Foundation

@objcMembers
@objc(MasonUIView)
public class MasonUIView: UIView, MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener {
  func onStyleChange(_ low: UInt64, _ high: UInt64) {
    MasonNode.invalidateDescendantTextViews(node, low, high)
  }
  
  public override func draw(_ rect: CGRect) {

    let bgString = style.background.trimmingCharacters(in: .whitespacesAndNewlines)
    let hasBackground: Bool = {
      if !bgString.isEmpty { return true }
      if !style.mBackground.layers.isEmpty { return true }
      if style.mBackground.color != nil { return true }
      return false
    }()
    let hasBoxShadow = !style.boxShadows.isEmpty
    let hasBorder = !style.mBorderRender.css.isEmpty
    
    let hasFilter = !style.resolvedFilterString.isEmpty

    // Early-out: skip all CoreGraphics work for plain views with no decoration
    guard hasBackground || hasBoxShadow || hasBorder || hasFilter else { return }

    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }

    style.mBorderRender.resolve(for: bounds)
    let borderWidths = style.mBorderRender.cachedWidths
    let hasRadii = style.mBorderRender.hasRadii()

    // Outset shadows are handled by MasonShadowLayer

    // Block 1: Background with border-radius clip
    // Draw background across the full bounds so it meets edge-aligned children
    // (image layers) and then draw the border on top. This avoids a 1px gap
    // when border widths are present.
    if hasBackground {
      // Expand background slightly (fractional device pixel) to avoid 1px hairline gaps
      let scale = UIScreen.main.scale
      let expand: CGFloat = 1.0 / scale
      let innerRect = bounds.insetBy(dx: -expand, dy: -expand)

      context.saveGState()
      if hasRadii {
        let innerRadius = style.mBorderRender.radius
        let innerPath = style.mBorderRender.getClipPath(rect: innerRect, radius: innerRadius)
        context.addPath(innerPath.cgPath)
        context.clip()
      }
      style.mBackground.draw(on: self, in: context, rect: innerRect)
      context.restoreGState()
    }

    // Inset box shadows (render on top of background)
    if hasBoxShadow {
      style.mBoxShadowRenderer.drawInsetShadows(in: context, rect: bounds, borderRenderer: style.mBorderRender)
    }

    // Border: when rounded radii exist, draw the border inside a rounded clip
    // so the stroke overlays the background and avoids visible gaps with outset shadows.
    if hasBorder {
      if hasRadii {
        context.saveGState()
        let outerPath = style.mBorderRender.getClipPath(rect: bounds, radius: style.mBorderRender.radius)
        context.addPath(outerPath.cgPath)
        context.clip()
        style.mBorderRender.draw(in: context, rect: bounds)
        context.restoreGState()
      } else {
        style.mBorderRender.draw(in: context, rect: bounds)
      }
    }

    style.applyResolvedFilter(in: context, rect: bounds, view: self)
  }

  public let node: MasonNode
  public let mason: NSCMason

  public var uiView: UIView { self }
  
  public var style: MasonStyle {
    return node.style
  }
  
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    style.updateShadowLayer(for: bounds)
    autoComputeIfRoot()
    #if DEBUG
    if !(superview is MasonElement) {
      node.mason.printTree(node)
    }
    #endif

    // Optimize compositing: set isOpaque for solid opaque backgrounds
    style.mBorderRender.resolve(for: bounds)
    guard let bg = style.mBackground else {return}
    let hasOpaqueBackground = bg.color != nil && (bg.color!.cgColor.alpha >= 1.0) && bg.layers.isEmpty
    let hasBoxShadow = !style.boxShadows.isEmpty

    if hasOpaqueBackground && !style.mBorderRender.hasRadii() && !hasBoxShadow {
      isOpaque = true
    } else {
      isOpaque = false
    }

    // Rasterize complex decorated views (gradient + radii or box shadow)
    let hasGradient = !bg.layers.isEmpty
    if hasGradient && style.mBorderRender.hasRadii() || hasBoxShadow {
      layer.shouldRasterize = true
      layer.rasterizationScale = UIScreen.main.scale
    } else {
      layer.shouldRasterize = false
    }
    // Re-apply any CSS transform stored on style after layout changes
    style.applyTransformToNodeView(style.transform)
  }

  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    isOpaque = false
    setComputeCache(.init(width: -2, height: -2))
    computeCacheDirty = false
    node.view = self
    style.setStyleChangeListener(listener: self)
  }


  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  
  @objc public static func createGridView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Grid
    }
    return view
  }
  
  @objc public static func createFlexView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Flex
    }
    return view
  }
  
  @objc public static func createBlockView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Block
    }
    return view
  }
  
  
  public func addView(_ view: UIView){
    if(view.superview == self){
      return
    }
    if(view is MasonElement){
      append((view as! MasonElement))
    }else {
      append(node: mason.nodeForView(view))
    }
  }
  
  public func addView(_ view: UIView, at: Int){
    if(view.superview == self){
      return
    }
    //    if(at <= -1){
    //      addSubview(view)
    //    }else {
    //      insertSubview(view, at: at)
    //    }
    
    
    if(view is MasonElement){
      node.addChildAt((view as! MasonElement).node, at)
    }else {
      node.addChildAt(mason.nodeForView(view), at)
    }
  }
  
  
  @objc public func addSubviews(_ views: [UIView]){
    addSubviews(views, at: -1)
  }
  
  @objc public func addSubviews(_ views: [UIView], at index: Int){
    views.enumerated().forEach { seq in
      if (index < 0) {
        addSubview(seq.element)
      } else {
        insertSubview(seq.element, at: index + seq.offset)
      }
    }
  }
  
  @objc public var inBatch: Bool {
    get{
      return node.inBatch
    }
    
    set(value) {
      node.inBatch = value
    }
  }
  
  func checkAndUpdateStyle() {
    if (!node.inBatch) {
      node.style.updateNativeStyle()
    }
  }
  
  @objc public var background: String {
    get{
      return style.background
    }
    set(value) {
      style.background = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var display: Display {
    get{
      return style.display
    }
    set(value) {
      style.display = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var _position: Position {
    get{
      return style.position
    }
    set(value) {
      style.position = value
      checkAndUpdateStyle()
    }
  }
  
  
  // TODO
  @objc public var direction: Direction {
    get{
      return style.direction
    }
    set(value) {
      style.direction = value
    }
  }
  
  
  @objc public var flexDirection: FlexDirection {
    get{
      return style.flexDirection
    }
    set(value) {
      style.flexDirection = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var flexWrap: FlexWrap {
    get{
      return style.flexWrap
    }
    set(value) {
      style.flexWrap = value
      checkAndUpdateStyle()
    }
  }
  
  
  //    @objc public var overflow: Overflow {
  //        get{
  //            return style.overflow
  //        }
  //        set(value) {
  //            style.overflow = value
  //            checkAndUpdateStyle()
  //        }
  //    }
  
  
  @objc public var overflowX: Overflow {
    get{
      return style.overflowX
    }
    set(value) {
      style.overflowX = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var overflowY: Overflow {
    get{
      return style.overflowY
    }
    set(value) {
      style.overflowY = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var alignItems: AlignItems{
    get{
      return style.alignItems
    }
    set(value) {
      style.alignItems = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var alignSelf: AlignSelf {
    get {
      return style.alignSelf
    }
    set(value) {
      style.alignSelf = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var alignContent: AlignContent {
    get{
      return style.alignContent
    }
    set(value) {
      style.alignContent = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var justifyItems: JustifyItems {
    get{
      return style.justifyItems
    }
    set(value) {
      style.justifyItems = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var justifySelf: JustifySelf {
    get{
      return style.justifySelf
    }
    set(value) {
      style.justifySelf = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var justifyContent: JustifyContent{
    get{
      return style.justifyContent
    }
    set(value) {
      style.justifyContent = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var flexGrow: Float {
    get{
      return style.flexGrow
    }
    set(value) {
      style.flexGrow = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var flexShrink: Float {
    get{
      return style.flexShrink
    }
    set(value) {
      style.flexShrink = value
      checkAndUpdateStyle()
    }
  }
  
  
  
  public var scrollBarWidth: MasonDimension {
    get {
      return style.scrollBarWidth
    }
    set(value) {
      style.scrollBarWidth = value
      checkAndUpdateStyle()
    }
  }
  
  func setScrollBarWidth(value: Float) {
    style.setScrollBarWidth(value);
    checkAndUpdateStyle()
  }
  
  @objc public var scrollBarWidthCompat: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: style.scrollBarWidth)
    }
    set(value) {
      style.scrollBarWidth = value.dimension
      checkAndUpdateStyle()
    }
  }
  
  func setFlexBasis(value: Float, type: Int) {
    style.setFlexBasis(value, type)
    checkAndUpdateStyle()
  }
  
  public var flexBasis: MasonDimension {
    get {
      return style.flexBasis
    }
    set(value) {
      style.flexBasis = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var flexBasisCompat: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: style.flexBasis)
    }
    set(value) {
      style.flexBasis = value.dimension
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var aspectRatio: Float{
    get{
      return style.aspectRatio ?? Float.nan
    }
    set(value) {
      style.aspectRatio = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridArea: String {
    get {
      return style.gridArea
    }
    set(value) {
      style.gridArea = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridTemplateAreas: String {
    get {
      return style.gridTemplateAreas
    }
    set(value) {
      style.gridTemplateAreas = value
      checkAndUpdateStyle()
    }
  }
  
  
  
  @objc public var gridAutoRows: String {
    get {
      return style.gridAutoRows
    }
    set(value) {
      style.gridAutoRows = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridAutoColumns: String{
    get{
      return style.gridAutoColumns
    }
    set(value) {
      style.gridAutoColumns = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridAutoFlow: GridAutoFlow{
    get{
      return style.gridAutoFlow
    }
    set(value) {
      style.gridAutoFlow = value
      checkAndUpdateStyle()
    }
  }
  
  
  public var gridColumn: String{
    get{
      return style.gridColumn
    }
    set(value) {
      style.gridColumn = value
      checkAndUpdateStyle()
    }
  }
  
  public var gridColumnStart: String {
    get {
      return style.gridColumnStart
    }
    
    set {
      style.gridColumnStart = newValue
    }
  }
  
  public var gridColumnEnd: String {
    get {
      return style.gridColumnEnd
    }
    
    set {
      style.gridColumnEnd = newValue
    }
  }
  
  
  public var gridRow: String{
    get{
      return style.gridRow
    }
    set(value) {
      style.gridRow = value
      checkAndUpdateStyle()
    }
  }
  
  public var gridRowStart: String {
    get {
      return style.gridRowStart
    }
    
    set {
      style.gridRowStart = newValue
    }
  }
  
  public var gridRowEnd: String {
    get {
      return style.gridRowEnd
    }
    
    set {
      style.gridRowEnd = newValue
    }
  }
  
  
  @objc public var gridTemplateRows: String {
    get{
      return style.gridTemplateRows
    }
    set(value) {
      style.gridTemplateRows = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridTemplateColumns: String {
    get{
      return style.gridTemplateColumns
    }
    set(value) {
      style.gridTemplateColumns = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public func setPadding(_ left: Float,_ top:Float, _ right: Float,_ bottom: Float) {
    node.style.padding = MasonRect(
      MasonLengthPercentage.Points(top),
      MasonLengthPercentage.Points(right),
      MasonLengthPercentage.Points(bottom),
      MasonLengthPercentage.Points(left)
    )
  }
  
  @objc public func getPadding() -> MasonLengthPercentageRectCompat{
    return node.style.paddingCompat
  }
  
  @objc public func setPaddingLeft(_ left: Float, _ type: Int) {
    node.style.setPaddingLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingRight(_ right: Float, _ type: Int) {
    node.style.setPaddingRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingTop(_ top: Float, _ type: Int) {
    node.style.setPaddingTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingBottom(_ bottom: Float, _ type: Int) {
    node.style.setPaddingBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getPaddingLeft() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.left
  }
  
  @objc public func getPaddingRight() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.right
  }
  
  @objc public func getPaddingTop() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.top
  }
  
  
  @objc public func getPaddingBottom() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.bottom
  }
  
  @objc public func setBorderWidth(_ left: Float,_ top: Float,_ right: Float, _ bottom: Float) {
    style.borderWidth = MasonRect(
      MasonLengthPercentage.Points(top),
      MasonLengthPercentage.Points(right),
      MasonLengthPercentage.Points(bottom),
      MasonLengthPercentage.Points(left)
    )
  }
  
  @objc public func getBorderWidth() -> MasonLengthPercentageRectCompat{
    return node.style.borderWidthCompat
  }
  
  @objc public func setBorderLeftWidth(_ left: Float, _ type: Int) {
    node.style.setBorderLeftWidth(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderRightWidth(_ right: Float, _ type: Int) {
    node.style.setBorderRightWidth(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderTopWidth(_ top: Float, _ type: Int) {
    node.style.setBorderTopWidth(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderBottomWidth(_ bottom: Float, _ type: Int) {
    node.style.setBorderBottomWidth(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getBorderLeft() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.left
  }
  
  @objc public func getBorderRight() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.right
  }
  
  @objc public func getBorderBottom() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.bottom
  }
  
  @objc public func getBorderTop() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.top
  }
  
  @objc public func setMargin(_ left: Float, _ top: Float,_ right: Float,_ bottom: Float) {
    node.style.margin = MasonRect(
      MasonLengthPercentageAuto.Points(top),
      MasonLengthPercentageAuto.Points(right),
      MasonLengthPercentageAuto.Points(bottom),
      MasonLengthPercentageAuto.Points(left)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMargin() -> MasonLengthPercentageAutoRectCompat{
    return node.style.marginCompat
  }
  
  @objc public func setMarginLeft(_ left: Float, _ type: Int) {
    node.style.setMarginLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginRight(_ right: Float, _ type: Int) {
    node.style.setMarginRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginTop(_ top: Float, _ type: Int) {
    node.style.setMarginTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginBottom(_ bottom: Float, _ type: Int) {
    node.style.setMarginBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getMarginLeft() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.left
  }
  
  @objc public func getMarginRight() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.right
  }
  
  @objc public func getMarginTop() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.top
  }
  
  @objc public func getMarginBottom() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.bottom
  }
  
  @objc public func setInset(_ left: Float,_  top: Float, _ right: Float,_  bottom: Float) {
    node.style.inset = MasonRect(
      MasonLengthPercentageAuto.Points(top),
      MasonLengthPercentageAuto.Points(right),
      MasonLengthPercentageAuto.Points(bottom),
      MasonLengthPercentageAuto.Points(left)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getInset() -> MasonLengthPercentageAutoRectCompat{
    return node.style.insetCompat
  }
  
  @objc public func setInsetLeft(_ left: Float,_  type: Int) {
    node.style.setInsetLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetRight(_ right: Float,_  type: Int) {
    node.style.setInsetRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetTop(_ top: Float,_  type: Int) {
    node.style.setInsetTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetBottom(_ bottom: Float,_  type: Int) {
    node.style.setInsetBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getInsetLeft() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.left
  }
  
  @objc public func getInsetRight() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.right
  }
  
  @objc public func getInsetTop() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.top
  }
  
  @objc public func getInsetBottom() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.bottom
  }
  
  @objc public func setMinSize(_ width: Float,_ height: Float) {
    node.style.minSize = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMinSize() -> MasonDimensionSizeCompat{
    return node.style.minSizeCompat
  }
  
  @objc public func setMinSizeWidth(_ width: Float,_ type: Int) {
    node.style.setMinSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMinSizeHeight(_ height: Float,_ type: Int) {
    node.style.setMinSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  
  @objc public func getMinSizeWidth() -> MasonDimensionCompat{
    return node.style.minSizeCompat.width
  }
  
  @objc public func getMinSizeHeight() -> MasonDimensionCompat{
    return node.style.minSizeCompat.height
  }
  
  @objc public func setSize(_ width: Float,_  height: Float) {
    node.style.size = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func setSizeWidth(_ width: Float,_ type: Int) {
    node.style.setSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setSizeHeight(_ height: Float,_ type: Int) {
    node.style.setSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getSize() -> MasonDimensionSizeCompat{
    return node.style.sizeCompat
  }
  
  @objc public func getSizeWidth() -> MasonDimensionCompat{
    return node.style.sizeCompat.width
  }
  
  @objc public func getSizeHeight() -> MasonDimensionCompat{
    return node.style.sizeCompat.height
  }
  
  @objc public func setMaxSize(_ width: Float, _ height: Float) {
    node.style.maxSize = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMaxSize() -> MasonDimensionSizeCompat{
    return node.style.maxSizeCompat
  }
  
  @objc public func setMaxSizeWidth(_ width: Float,_ type: Int) {
    node.style.setMaxSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMaxSizeHeight(_ height: Float,_ type: Int) {
    node.style.setMaxSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getMaxSizeWidth() -> MasonDimensionCompat{
    return node.style.minSizeCompat.width
  }
  
  @objc public func getMaxSizeHeight() -> MasonDimensionCompat{
    return node.style.minSizeCompat.height
  }
  
  @objc public func setGap(_ width: Float,_ height: Float) {
    node.style.gap = MasonSize(
      MasonLengthPercentage.Points(width),
      MasonLengthPercentage.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func setGapWithWidthHeightType(_ width: Float , _ width_type: Int8,_ height: Float, _ height_type: Int8) {
    guard let width = MasonLengthPercentage.fromValueType(width, Int(width_type)) else {return}
    guard let height = MasonLengthPercentage.fromValueType(height, Int(height_type)) else {return}
    node.style.gap = MasonSize(
      width,
      height
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getGap() -> MasonLengthPercentageSizeCompat{
    return node.style.gapCompat
  }
  
  @objc public func setRowGap(_ row: Float,_ type: Int) {
    node.style.setRowGap(row, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setColumnGap(_ column: Float,_ type: Int) {
    node.style.setColumnGap(column, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getRowGap() -> MasonLengthPercentageCompat{
    return node.style.gapCompat.width
  }
  
  @objc public func getColumnGap() -> MasonLengthPercentageCompat{
    return node.style.gapCompat.height
  }
}
