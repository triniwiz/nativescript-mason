//
//  MasonView.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Foundation

struct MasonAssociatedKeys {
    static var masonEnabled: UInt8 = 1
}

/*
// Can enable adding the owner to nodes
private func swizzle(_ v: UIView.Type) {
  [
    (#selector(v.didMoveToSuperview), #selector(v.mason_didMoveToSuperview))
  ]
  .forEach { original, swizzled in

    guard let originalMethod = class_getInstanceMethod(v, original),
      let swizzledMethod = class_getInstanceMethod(v, swizzled) else { return }

    let didAddViewDidLoadMethod = class_addMethod(
      v,
      original,
      method_getImplementation(swizzledMethod),
      method_getTypeEncoding(swizzledMethod)
    )

    if didAddViewDidLoadMethod {
      class_replaceMethod(
        v,
        swizzled,
        method_getImplementation(originalMethod),
        method_getTypeEncoding(originalMethod)
      )
    } else {
      method_exchangeImplementations(originalMethod, swizzledMethod)
    }
  }
}

private var hasSwizzled = false

*/

extension UIView {
   /* public final class func swizzleForMason() {
       guard !hasSwizzled else { return }

       hasSwizzled = true
        Mason.swizzle(self)
     }
    
    @objc internal func mason_didMoveToSuperview() {
      self.mason_didMoveToSuperview()
        if let superview = self.superview {
            mason.owner = superview.mason
        }
        else {
            mason.owner = nil
        }
    }
    */
    
    @objc public var rootView: UIView? {
        var view = self
           while let s = view.superview {
               view = s
           }
           return view
    }
    
    @objc public static func createGridView() -> UIView{
        let view = UIView(frame: .zero)
        view.mason.configure { node in
            node.style.display = .Grid
        }
        return view
    }
    
    @objc public static func createFlexView() -> UIView{
        let view = UIView(frame: .zero)
        view.mason.configure { node in
            node.style.display = .Flex
        }
        return view
    }
    
    @objc public var mason: MasonNode {
       // UIView.swizzleForMason()
        guard let mason = objc_getAssociatedObject(self, &MasonAssociatedKeys.masonEnabled) as? MasonNode else {
            let mason = MasonNode()
            mason.data = self
            mason.includeInLayout = true
            mason.setDefaultMeasureFunction()
            mason.isEnabled = TSCMason.alwaysEnable
            objc_setAssociatedObject(
                self, &MasonAssociatedKeys.masonEnabled, mason, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            return mason
        }
        return mason
    }
    
    @objc static public var masonPtr: Int {
        return Int(bitPattern: TSCMason.instance.nativePtr)
    }
    
    @objc public var masonNodePtr: Int {
        return Int(bitPattern: mason.nativePtr)
    }
    
    @objc public var masonStylePtr: Int {
        return Int(bitPattern: mason.style.nativePtr)
    }
    
    @objc public var isMasonEnabled: Bool {
        return objc_getAssociatedObject(self, &MasonAssociatedKeys.masonEnabled) != nil
    }
    
    
    @objc public var style: MasonStyle {
        get {
            return mason.style
        }
        
        set {
            mason.style = newValue
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
    
    @objc public func configure(_ block :(MasonNode) -> Void) {
        mason.configure(block)
    }
    
    
    @objc public var inBatch: Bool {
        get{
            return mason.inBatch
        }
        
        set(value) {
            mason.inBatch = value
        }
    }
    
    func checkAndUpdateStyle() {
        if (!mason.inBatch) {
            mason.updateNodeStyle()
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
    
    
    @objc public var overflow: Overflow {
        get{
            return style.overflow
        }
        set(value) {
            style.overflow = value
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
        mason.style.padding = MasonRect(
            MasonLengthPercentage.Points(left),
            MasonLengthPercentage.Points(right),
            MasonLengthPercentage.Points(top),
            MasonLengthPercentage.Points(bottom)
        )
      checkAndUpdateStyle()
    }
    
    @objc public func getPadding() -> MasonLengthPercentageRectCompat{
        return mason.style.paddingCompat
    }
    
    @objc public func setPaddingLeft(_ left: Float, _ type: Int) {
        mason.style.setPaddingLeft(left, type)
        checkAndUpdateStyle()
    }
        
    @objc public func setPaddingRight(_ right: Float, _ type: Int) {
        mason.style.setPaddingRight(right, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setPaddingTop(_ top: Float, _ type: Int) {
        mason.style.setPaddingTop(top, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setPaddingBottom(_ bottom: Float, _ type: Int) {
        mason.style.setPaddingBottom(bottom, type)
        checkAndUpdateStyle()
    }
    
    @objc public func getPaddingLeft() -> MasonLengthPercentageCompat {
        return mason.style.paddingCompat.left
    }
    
    @objc public func getPaddingRight() -> MasonLengthPercentageCompat {
        return mason.style.paddingCompat.right
    }
    
    @objc public func getPaddingTop() -> MasonLengthPercentageCompat {
        return mason.style.paddingCompat.top
    }
    
    
    @objc public func getPaddingBottom() -> MasonLengthPercentageCompat {
        return mason.style.paddingCompat.bottom
    }
    
    @objc public func setBorder(_ left: Float,_ top: Float,_ right: Float, _ bottom: Float) {
        mason.style.border = MasonRect(
            MasonLengthPercentage.Points(left),
            MasonLengthPercentage.Points(right),
            MasonLengthPercentage.Points(top),
            MasonLengthPercentage.Points(bottom)
        )
    }
    
    @objc public func getBorder() -> MasonLengthPercentageRectCompat{
        return mason.style.borderCompat
    }
    
    @objc public func setBorderLeft(_ left: Float, _ type: Int) {
        mason.style.setBorderLeft(left, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setBorderRight(_ right: Float, _ type: Int) {
        mason.style.setBorderRight(right, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setBorderTop(_ top: Float, _ type: Int) {
        mason.style.setBorderTop(top, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setBorderBottom(_ bottom: Float, _ type: Int) {
        mason.style.setBorderBottom(bottom, type)
        checkAndUpdateStyle()
    }
    
    @objc public func getBorderLeft() -> MasonLengthPercentageCompat {
        return mason.style.borderCompat.left
    }
    
    @objc public func getBorderRight() -> MasonLengthPercentageCompat {
        return mason.style.borderCompat.right
    }
    
    @objc public func getBorderBottom() -> MasonLengthPercentageCompat {
        return mason.style.borderCompat.bottom
    }
    
    @objc public func getBorderTop() -> MasonLengthPercentageCompat {
        return mason.style.borderCompat.top
    }
        
    @objc public func setMargin(_ left: Float, _ top: Float,_ right: Float,_ bottom: Float) {
        mason.style.margin = MasonRect(
            MasonLengthPercentageAuto.Points(left),
            MasonLengthPercentageAuto.Points(right),
            MasonLengthPercentageAuto.Points(top),
            MasonLengthPercentageAuto.Points(bottom)
        )
        checkAndUpdateStyle()
    }
    
    @objc public func getMargin() -> MasonLengthPercentageAutoRectCompat{
        return mason.style.marginCompat
    }
    
    @objc public func setMarginLeft(_ left: Float, _ type: Int) {
        mason.style.setMarginLeft(left, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setMarginRight(_ right: Float, _ type: Int) {
        mason.style.setMarginRight(right, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setMarginTop(_ top: Float, _ type: Int) {
        mason.style.setMarginTop(top, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setMarginBottom(_ bottom: Float, _ type: Int) {
        mason.style.setMarginBottom(bottom, type)
        checkAndUpdateStyle()
    }
    
    @objc public func getMarginLeft() -> MasonLengthPercentageAutoCompat {
        return mason.style.marginCompat.left
    }
    
    @objc public func getMarginRight() -> MasonLengthPercentageAutoCompat {
        return mason.style.marginCompat.right
    }
    
    @objc public func getMarginTop() -> MasonLengthPercentageAutoCompat {
        return mason.style.marginCompat.top
    }
    
    @objc public func getMarginBottom() -> MasonLengthPercentageAutoCompat {
        return mason.style.marginCompat.bottom
    }
    
    @objc public func setInset(_ left: Float,_  top: Float, _ right: Float,_  bottom: Float) {
        mason.style.inset = MasonRect(
            MasonLengthPercentageAuto.Points(left),
            MasonLengthPercentageAuto.Points(right),
            MasonLengthPercentageAuto.Points(top),
            MasonLengthPercentageAuto.Points(bottom)
        )
        checkAndUpdateStyle()
    }
    
    @objc public func getInset() -> MasonLengthPercentageAutoRectCompat{
        return mason.style.insetCompat
    }
    
    @objc public func setInsetLeft(_ left: Float,_  type: Int) {
        mason.style.setInsetLeft(left, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setInsetRight(_ right: Float,_  type: Int) {
        mason.style.setInsetRight(right, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setInsetTop(_ top: Float,_  type: Int) {
        mason.style.setInsetTop(top, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setInsetBottom(_ bottom: Float,_  type: Int) {
        mason.style.setInsetBottom(bottom, type)
        checkAndUpdateStyle()
    }
    
    @objc public func getInsetLeft() -> MasonLengthPercentageAutoCompat {
        return mason.style.insetCompat.left
    }
    
    @objc public func getInsetRight() -> MasonLengthPercentageAutoCompat {
        return mason.style.insetCompat.right
    }
    
    @objc public func getInsetTop() -> MasonLengthPercentageAutoCompat {
        return mason.style.insetCompat.top
    }
    
    @objc public func getInsetBottom() -> MasonLengthPercentageAutoCompat {
        return mason.style.insetCompat.bottom
    }
    
    @objc public func setMinSize(_ width: Float,_ height: Float) {
        mason.style.minSize = MasonSize(
            MasonDimension.Points(width),
            MasonDimension.Points(height)
        )
        checkAndUpdateStyle()
    }
    
    @objc public func getMinSize() -> MasonDimensionSizeCompat{
        return mason.style.minSizeCompat
    }
    
    @objc public func setMinSizeWidth(_ width: Float,_ type: Int) {
        mason.style.setMinSizeWidth(width, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setMinSizeHeight(_ height: Float,_ type: Int) {
        mason.style.setMinSizeHeight(height, type)
        checkAndUpdateStyle()
    }
    
    
    @objc public func getMinSizeWidth() -> MasonDimensionCompat{
        return mason.style.minSizeCompat.width
    }
    
    @objc public func getMinSizeHeight() -> MasonDimensionCompat{
        return mason.style.minSizeCompat.height
    }
    
    @objc public func setSize(_ width: Float,_  height: Float) {
        mason.style.size = MasonSize(
            MasonDimension.Points(width),
            MasonDimension.Points(height)
        )
        checkAndUpdateStyle()
    }
    
    @objc public func setSizeWidth(_ width: Float,_ type: Int) {
        mason.style.setSizeWidth(width, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setSizeHeight(_ height: Float,_ type: Int) {
        mason.style.setSizeHeight(height, type)
        checkAndUpdateStyle()
    }
    
    @objc public func getSize() -> MasonDimensionSizeCompat{
        return mason.style.sizeCompat
    }
    
    @objc public func getSizeWidth() -> MasonDimensionCompat{
        return mason.style.sizeCompat.width
    }
    
    @objc public func getSizeHeight() -> MasonDimensionCompat{
        return mason.style.sizeCompat.height
    }
    
    @objc public func setMaxSize(_ width: Float, _ height: Float) {
        mason.style.maxSize = MasonSize(
            MasonDimension.Points(width),
            MasonDimension.Points(height)
        )
        checkAndUpdateStyle()
    }
    
    @objc public func getMaxSize() -> MasonDimensionSizeCompat{
        return mason.style.maxSizeCompat
    }
        
    @objc public func setMaxSizeWidth(_ width: Float,_ type: Int) {
        mason.style.setMaxSizeWidth(width, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setMaxSizeHeight(_ height: Float,_ type: Int) {
        mason.style.setMaxSizeHeight(height, type)
        checkAndUpdateStyle()
    }
    
    @objc public func getMaxSizeWidth() -> MasonDimensionCompat{
        return mason.style.minSizeCompat.width
    }
    
    @objc public func getMaxSizeHeight() -> MasonDimensionCompat{
        return mason.style.minSizeCompat.height
    }
    
    @objc public func setGap(_ width: Float,_ height: Float) {
        mason.style.gap = MasonSize(
            MasonLengthPercentage.Points(width),
            MasonLengthPercentage.Points(height)
        )
        checkAndUpdateStyle()
    }
    
    @objc public func setGapWithWidthHeightType(_ width: Float , _ width_type: Int,_ height: Float, _ height_type: Int) {
        guard let width = MasonLengthPercentage.fromValueType(width, width_type) else {return}
        guard let height = MasonLengthPercentage.fromValueType(height, height_type) else {return}
        mason.style.gap = MasonSize(
            width,
            height
        )
        checkAndUpdateStyle()
    }
    
    @objc public func getGap() -> MasonLengthPercentageSizeCompat{
        return mason.style.gapCompat
    }
    
    @objc public func setRowGap(_ row: Float,_ type: Int) {
        mason.style.setRowGap(row, type)
        checkAndUpdateStyle()
    }
    
    @objc public func setColumnGap(_ column: Float,_ type: Int) {
        mason.style.setColumnGap(column, type)
        checkAndUpdateStyle()
    }
    
    @objc public func getRowGap() -> MasonLengthPercentageCompat{
        return mason.style.gapCompat.width
    }
    
    @objc public func getColumnGap() -> MasonLengthPercentageCompat{
        return mason.style.gapCompat.height
    }
}
