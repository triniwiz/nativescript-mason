//
//  MasonView.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Foundation

public protocol MasonView {
  var style: MasonStyle { get }
      
  var node: MasonNode { get }

  func markNodeDirty()

  func isNodeDirty() -> Bool

  func configure(_ block: (MasonNode) -> Void)
  
  var uiView: UIView { get }
}

@objcMembers
@objc(MasonUIView)
public class MasonUIView: UIView, MasonView {
  public var uiView: UIView { self }
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  public let node: MasonNode
  public let mason: NSCMason
  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    node.data = self
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  
  @objc public static func createGridView(_ mason: NSCMason) -> MasonUIView{
      let view = MasonUIView(mason: mason)
        view.node.configure { node in
            node.style.display = .Grid
        }
      return view
    }
    
    @objc public static func createFlexView(_ mason: NSCMason) -> MasonUIView{
      let view = MasonUIView(mason: mason)
        view.node.configure { node in
          node.style.display = .Flex
        }
      return view
    }
    
    @objc public static func createBlockView(_ mason: NSCMason) -> MasonUIView{
      let view = MasonUIView(mason: mason)
        view.node.configure { node in
          node.style.display = .Block
        }
      return view
    }
    
    
    @objc public var masonPtr: Int64 {
      if(mason.nativePtr == nil){
            return 0
        }
        guard let ptr = UnsafeRawPointer(mason.nativePtr) else {return 0}
        
        return Int64(Int(bitPattern: ptr))
    }
    
    @objc public var masonNodePtr: Int64 {
      if(node.nativePtr == nil){
            return 0
        }
        guard let ptr = UnsafeRawPointer(node.nativePtr) else {return 0}
        
        return Int64(Int(bitPattern: ptr))
    }
    

    
    @objc public var masonPtrs: String {
        return "\(masonPtr):\(masonNodePtr)"
    }

    
    @objc public var style: MasonStyle {
        get {
            return node.style
        }
        
        set {
            node.style = newValue
        }
    }
  
    

  public func addView(_ view: UIView){
    if(view.superview == self){
      return
    }
    addSubview(view)
    if(view is MasonView){
      node.addChild((view as! MasonView).node)
    }else {
      node.addChild(mason.nodeForView(view))
    }
  }
  
  public func addView(_ view: UIView, at: Int){
    if(view.superview == self){
      return
    }
    if(at <= -1){
      addSubview(view)
    }else {
      insertSubview(view, at: at)
    }

    if(view is MasonView){
      node.addChildAt((view as! MasonView).node, at)
    }else {
      node.addChildAt(mason.nodeForView(view), at)
    }
  }
  
  public func syncStyle(_ state: String) {
    print("syncStyle", state)
    guard let stateValue = Int64(state, radix: 10) else {return}
    let keys = StateKeys(rawValue: UInt64(stateValue))
    print("gap",keys.contains(.gap), keys)
    if (stateValue != -1) {
      style.isDirty = stateValue
      style.updateNativeStyle()
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
    
    public func configure(_ block :(MasonNode) -> Void) {
      node.configure(block)
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


    @objc public var gridAutoRows: Array<MinMax> {
        get {
          return style.gridAutoRows
        }
        set(value) {
          style.gridAutoRows = value
          checkAndUpdateStyle()
        }
    }
    

    @objc public var gridAutoColumns: Array<MinMax>{
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
        

    public var gridColumn: Line<GridPlacement>{
        get{
          return style.gridColumn
        }
        set(value) {
          style.gridColumn = value
          checkAndUpdateStyle()
        }
    }
    
    public var gridColumnStart: GridPlacement {
        get {
            return gridColumn.start
        }
        
        set {
            gridColumn = Line<GridPlacement>(newValue, gridColumn.end)
        }
    }
    
    public var gridColumnEnd: GridPlacement {
        get {
            return gridColumn.end
        }
        
        set {
            gridColumn = Line<GridPlacement>(gridColumn.start, newValue)
        }
    }
    
 
    @objc public var gridColumnCompat: LineGridPlacementCompat {
        get {
            return style.gridColumnCompat
        }
        set {
            style.gridColumnCompat = newValue
            checkAndUpdateStyle()
        }
    }
    
    @objc public var gridColumnStartCompat: GridPlacementCompat {
        get {
            return style.gridColumnStartCompat
        }
        
        set {
            style.gridColumnStartCompat = newValue
            checkAndUpdateStyle()
        }
    }
    
    @objc public var gridColumnEndCompat: GridPlacementCompat {
        get {
            return gridColumnCompat.end
        }
        
        set {
            style.gridColumnEndCompat = newValue
            checkAndUpdateStyle()
        }
    }
        

    public var gridRow: Line<GridPlacement> {
        get{
          return style.gridRow
        }
        set(value) {
          style.gridRow = value
          checkAndUpdateStyle()
        }
    }
    
    public var gridRowStart: GridPlacement {
        get {
            return gridRow.start
        }
        
        set {
            gridRow = Line<GridPlacement>(newValue, gridRow.end)
        }
    }
    
    public var gridRowEnd: GridPlacement {
        get {
            return gridRow.end
        }
        
        set {
            gridRow = Line<GridPlacement>(gridRow.start, newValue)
        }
    }
    
    
    @objc public var gridRowCompat: LineGridPlacementCompat {
        get{
          return style.gridRowCompat
        }
        set {
          style.gridRowCompat = newValue
            checkAndUpdateStyle()
        }
    }
    
    @objc public var gridRowStartCompat: GridPlacementCompat {
        get {
            return style.gridRowStartCompat
        }
        
        set {
            style.gridRowStartCompat = newValue
            checkAndUpdateStyle()
        }
    }
    
    @objc public var gridRowEndCompat: GridPlacementCompat {
        get {
            return style.gridRowEndCompat
        }
        
        set {
            style.gridRowEndCompat = newValue
            checkAndUpdateStyle()
        }
    }
        

    @objc public var gridTemplateRows: Array<TrackSizingFunction> {
        get{
          return style.gridTemplateRows
        }
        set(value) {
          style.gridTemplateRows = value
          checkAndUpdateStyle()
        }
    }
        

    @objc public var gridTemplateColumns: Array<TrackSizingFunction> {
        get{
          return style.gridTemplateColumns
        }
        set(value) {
          style.gridTemplateColumns = value
          checkAndUpdateStyle()
        }
    }
        
    @objc public func setPadding(_ left: Float,_ right:Float, _ top: Float,_ bottom: Float) {
        node.style.padding = MasonRect(
            MasonLengthPercentage.Points(left),
            MasonLengthPercentage.Points(right),
            MasonLengthPercentage.Points(top),
            MasonLengthPercentage.Points(bottom)
        )
      checkAndUpdateStyle()
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
    
    @objc public func setBorder(_ left: Float,_ top: Float,_ right: Float, _ bottom: Float) {
        node.style.border = MasonRect(
            MasonLengthPercentage.Points(left),
            MasonLengthPercentage.Points(right),
            MasonLengthPercentage.Points(top),
            MasonLengthPercentage.Points(bottom)
        )
    }
    
    @objc public func getBorder() -> MasonLengthPercentageRectCompat{
        return node.style.borderCompat
    }
    
    @objc public func setBorderLeft(_ left: Float, _ type: Int) {
        node.style.setBorderLeft(left, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setBorderRight(_ right: Float, _ type: Int) {
        node.style.setBorderRight(right, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setBorderTop(_ top: Float, _ type: Int) {
        node.style.setBorderTop(top, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setBorderBottom(_ bottom: Float, _ type: Int) {
        node.style.setBorderBottom(bottom, type)
        checkAndUpdateStyle()
    }
    
    @objc public func getBorderLeft() -> MasonLengthPercentageCompat {
        return node.style.borderCompat.left
    }
    
    @objc public func getBorderRight() -> MasonLengthPercentageCompat {
        return node.style.borderCompat.right
    }
    
    @objc public func getBorderBottom() -> MasonLengthPercentageCompat {
        return node.style.borderCompat.bottom
    }
    
    @objc public func getBorderTop() -> MasonLengthPercentageCompat {
        return node.style.borderCompat.top
    }
        
    @objc public func setMargin(_ left: Float, _ top: Float,_ right: Float,_ bottom: Float) {
        node.style.margin = MasonRect(
            MasonLengthPercentageAuto.Points(left),
            MasonLengthPercentageAuto.Points(right),
            MasonLengthPercentageAuto.Points(top),
            MasonLengthPercentageAuto.Points(bottom)
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
            MasonLengthPercentageAuto.Points(left),
            MasonLengthPercentageAuto.Points(right),
            MasonLengthPercentageAuto.Points(top),
            MasonLengthPercentageAuto.Points(bottom)
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
    
    @objc public func setGapWithWidthHeightType(_ width: Float , _ width_type: Int,_ height: Float, _ height_type: Int) {
        guard let width = MasonLengthPercentage.fromValueType(width, width_type) else {return}
        guard let height = MasonLengthPercentage.fromValueType(height, height_type) else {return}
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
