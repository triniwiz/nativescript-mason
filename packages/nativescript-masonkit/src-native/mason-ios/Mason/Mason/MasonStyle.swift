//
//  MasonStyle.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation


private func getDimension(_ value: Float,_ type: Int) -> MasonDimension? {
    switch (type) {
    case 0: return .Auto
    case 1: return .Points(value)
    case 2: return .Percent(value)
    default:
        return nil
    }
}

private func getLengthPercentageAuto(_ value: Float,_ type: Int) -> MasonLengthPercentageAuto? {
    switch (type) {
    case 0: return .Auto
    case 1: return .Points(value)
    case 2: return .Percent(value)
    default:
        return nil
    }
}

private func getLengthPercentage(_ value: Float,_ type: Int) -> MasonLengthPercentage? {
    switch (type) {
    case 0: return .Points(value)
    case 1: return .Percent(value)
    default:
        return nil
    }
}


@objc(MasonStyle)
@objcMembers
public class MasonStyle: NSObject {
    internal var isDirty: Bool = false
    
    public internal (set) var nativePtr: OpaquePointer?
    
    
    public override init() {
        nativePtr = mason_style_init()
    }
    
    deinit {
        mason_style_destroy(nativePtr)
    }
    
    
    public var display =  Display.Flex {
        didSet {
            isDirty = true
        }
    }
    
    public var position = Position.Relative {
        didSet {
            isDirty = true
        }
    }
    
    
    // TODO
    public var direction = Direction.Inherit{
        didSet {
            isDirty = true
        }
    }
    
    public var flexDirection = FlexDirection.Row{
        didSet {
            isDirty = true
        }
    }
    
    public var flexWrap = FlexWrap.NoWrap{
        didSet {
            isDirty = true
        }
    }
    
    public var overflow = Overflow.Unset{
        didSet {
            isDirty = true
        }
    }
    
    public var overflowX = Overflow.Unset{
        didSet {
            isDirty = true
        }
    }
    
    public var overflowY = Overflow.Unset{
        didSet {
            isDirty = true
        }
    }
    
    public var alignItems = AlignItems.Normal {
        didSet {
            isDirty = true
        }
    }
    
    public var alignSelf = AlignSelf.Normal {
        didSet {
            isDirty = true
        }
    }
    
    public var alignContent = AlignContent.Normal{
        didSet {
            isDirty = true
        }
    }
    
    public var justifyItems = JustifyItems.Normal {
        didSet {
            isDirty = true
        }
    }
    
    public var justifySelf = JustifySelf.Normal {
        didSet {
            isDirty = true
        }
    }
    
    public var justifyContent = JustifyContent.Normal {
        didSet {
            isDirty = true
        }
    }
    
    public var inset = MasonLengthPercentageAutoRectAuto {
        didSet {
            isDirty = true
        }
    }
    
    public var insetCompat: MasonLengthPercentageAutoRectCompat {
        get {
            guard let inset = inset.compatLengthAuto else {
                let compat = MasonLengthPercentageAutoRectCompat(inset)
                inset.compatLengthAuto = compat
                return compat
            }
            
            return inset
        }
        set {
            inset = newValue.intoMasonRect()
        }
    }
    
    
    public func setInsetLeft(_ value: Float, _ type: Int) {
        guard let left = getLengthPercentageAuto(value, type) else {return}
        
        inset = MasonRect(left, inset.right, inset.top, inset.bottom)
    }
    
    public var leftInset: MasonLengthPercentageAuto {
        get {
            return inset.left
        }
        set {
            inset = MasonRect(newValue, inset.right, inset.top, inset.bottom)
        }
    }
    
    public func setInsetRight(_ value: Float, _ type: Int) {
        guard let right = getLengthPercentageAuto(value, type) else {return}
        
        inset = MasonRect(inset.left, right, inset.top, inset.bottom)
    }
    
    public var rightInset: MasonLengthPercentageAuto {
        get {
            return inset.right
        }
        set {
            inset = MasonRect(inset.left, newValue, inset.top, inset.bottom)
        }
    }
    
    public func setInsetTop(_ value: Float, _ type: Int) {
        guard let top = getLengthPercentageAuto(value, type) else {return}
        
        inset = MasonRect(inset.left, inset.right, top, inset.bottom)
    }
    
    public var topInset: MasonLengthPercentageAuto {
        get {
            return inset.top
        }
        set {
            inset = MasonRect(inset.left, inset.right, newValue, inset.bottom)
        }
    }
    
    public func setInsetBottom(_ value: Float, _ type: Int) {
        guard let bottom = getLengthPercentageAuto(value, type) else {return}
        inset = MasonRect(inset.left, inset.right, inset.top, bottom)
    }
    
    public var bottomInset: MasonLengthPercentageAuto {
        get {
            return inset.bottom
        }
        set {
            inset = MasonRect(inset.left, inset.right, inset.top, newValue)
        }
    }
    
    public func setInsetWithValueType(_ value: Float, _ type: Int) {
        guard let inset = getLengthPercentageAuto(value, type) else {return}
        
        self.inset = MasonRect(inset, inset, inset, inset)
    }
    
    
    public var margin =  MasonLengthPercentageAutoRectZero {
        didSet {
            isDirty = true
        }
    }
    
    
    public var marginCompat: MasonLengthPercentageAutoRectCompat {
        get {
            guard let margin = margin.compatLengthAuto else {
                let compat = MasonLengthPercentageAutoRectCompat(margin)
                margin.compatLengthAuto = compat
                return compat
            }
            
            return margin
        }
        
        set {
            margin = newValue.intoMasonRect()
        }
    }
    
    public func setMarginLeft(_ value: Float, _ type: Int) {
        guard let left = getLengthPercentageAuto(value, type) else {return}
        
        margin = MasonRect(left, margin.right, margin.top, margin.bottom)
    }
    
    public func setMarginRight(_ value: Float, _ type: Int) {
        guard let right = getLengthPercentageAuto(value, type) else {return}
        
        margin = MasonRect(margin.left, right, margin.top, margin.bottom)
    }
    
    public func setMarginTop(_ value: Float, _ type: Int) {
        guard let top = getLengthPercentageAuto(value, type) else {return}
        
        margin = MasonRect(margin.left, margin.right, top, margin.bottom)
    }
    
    public func setMarginBottom(_ value: Float, _ type: Int) {
        guard let bottom = getLengthPercentageAuto(value, type) else {return}
        margin = MasonRect(margin.left, margin.right, margin.top, bottom)
    }
    
    public func setMarginWithValueType(_ value: Float, _ type: Int) {
        guard let margin = getLengthPercentageAuto(value, type) else {return}
        
        self.margin = MasonRect(margin, margin, margin, margin)
    }
    
    
    public var padding = MasonLengthPercentageRectZero {
        didSet {
            isDirty = true
        }
    }
    
    
    public var paddingCompat: MasonLengthPercentageRectCompat {
        get {
            guard let padding = padding.compatLength else {
                let compat = MasonLengthPercentageRectCompat(padding)
                padding.compatLength = compat
                return compat
            }
            
            return padding
        }
        
        set {
            padding = newValue.intoMasonRect()
        }
    }
    
    
    public func setPaddingLeft(_ value: Float, _ type: Int) {
        guard let left = getLengthPercentage(value, type) else {return}
        
        padding = MasonRect(left, padding.right, padding.top, padding.bottom)
    }
    
    public func setPaddingRight(_ value: Float, _ type: Int) {
        guard let right = getLengthPercentage(value, type) else {return}
        
        padding = MasonRect(padding.left, right, padding.top, padding.bottom)
    }
    
    public func setPaddingTop(_ value: Float, _ type: Int) {
        guard let top = getLengthPercentage(value, type) else {return}
        
        padding = MasonRect(padding.left, padding.right, top, padding.bottom)
    }
    
    public func setPaddingBottom(_ value: Float, _ type: Int) {
        guard let bottom = getLengthPercentage(value, type) else {return}
        padding = MasonRect(padding.left, padding.right, padding.top, bottom)
    }
    
    public func setPaddingWithValueType(_ value: Float, _ type: Int) {
        guard let padding = getLengthPercentage(value, type) else {return}
        
        self.padding = MasonRect(padding, padding, padding, padding)
    }
    
    
    public var border = MasonLengthPercentageRectZero {
        didSet {
            isDirty = true
        }
    }
    
    public var borderCompat: MasonLengthPercentageRectCompat {
        get {
            guard let border = border.compatLength else {
                let compat = MasonLengthPercentageRectCompat(border)
                border.compatLength = compat
                return compat
            }
            
            return border
        }
        
        set {
            border = newValue.intoMasonRect()
        }
    }
    
    public func setBorderLeft(_ value: Float, _ type: Int) {
        guard let left = getLengthPercentage(value, type) else {return}
        
        padding = MasonRect(left, padding.right, padding.top, padding.bottom)
    }
    
    public func setBorderRight(_ value: Float, _ type: Int) {
        guard let right = getLengthPercentage(value, type) else {return}
        
        padding = MasonRect(padding.left, right, padding.top, padding.bottom)
    }
    
    public func setBorderTop(_ value: Float, _ type: Int) {
        guard let top = getLengthPercentage(value, type) else {return}
        
        padding = MasonRect(padding.left, padding.right, top, padding.bottom)
    }
    
    public func setBorderBottom(_ value: Float, _ type: Int) {
        guard let bottom = getLengthPercentage(value, type) else {return}
        padding = MasonRect(padding.left, padding.right, padding.top, bottom)
    }
    
    public func setBorderWithValueType(_ value: Float, _ type: Int) {
        guard let padding = getLengthPercentage(value, type) else {return}
        
        self.padding = MasonRect(padding, padding, padding, padding)
    }
    
    
    public var flexGrow: Float = 0 {
        didSet {
            isDirty = true
        }
    }
    
    public var flexShrink: Float = 1 {
        didSet {
            isDirty = true
        }
    }
    
    public var flexBasis = MasonDimension.Auto {
        didSet {
            isDirty = true
        }
    }
    
    public func setFlexBasis(_ value: Float,_ type: Int) {
        switch(type){
        case 0:
            flexBasis = MasonDimension.Auto
            break
        case 1:
            flexBasis =  MasonDimension.Points(value)
            break
        case 2:
            flexBasis =  MasonDimension.Percent(value)
            break
        default: break
            //noop
        }
    }
    
    public var scrollBarWidth = MasonDimension.Points(0.0) {
        didSet {
            isDirty = true
        }
    }
    
    public func setScrollBarWidth(_ value: Float) {
        scrollBarWidth = MasonDimension.Points(value);
    }
    
    
    public var minSize = MasonDimensionSizeAuto {
        didSet {
            isDirty = true
        }
    }
    
    
    public var minSizeCompat: MasonDimensionSizeCompat {
        get {
            guard let minSize = minSize.compatDimension else {
                let compat = MasonDimensionSizeCompat(minSize)
                minSize.compatDimension = compat
                return compat
            }
            
            return minSize
        }
        
        set {
            minSize = newValue.intoMasonSize()
        }
    }
    
    public func setMinSizeWidth(_ value: Float, _ type: Int) {
        guard let width = getDimension(value, type) else {return}
        
        minSize = MasonSize(width, minSize.height)
    }
    
    public func setMinSizeHeight(_ value: Float, _ type: Int) {
        guard let height = getDimension(value, type) else {return}
        minSize = MasonSize(minSize.width, height)
    }
    
    public func setMinSizeWidthHeight(_ value: Float, _ type: Int) {
        guard let wh = getDimension(value, type) else {return}
        minSize = MasonSize(wh, wh)
    }
    
    public var size: MasonSize<MasonDimension> = MasonDimensionSizeAuto {
        didSet {
            isDirty = true
        }
    }
    
    public var sizeCompat: MasonDimensionSizeCompat {
        get {
            guard let size = size.compatDimension else {
                let compat = MasonDimensionSizeCompat(size)
                size.compatDimension = compat
                return compat
            }
            
            return size
        }
        
        set {
            size = newValue.intoMasonSize()
        }
    }
    
    public var sizeCompatWidth: MasonDimensionCompat {
        get {
            return MasonDimensionCompat(value: size.width)
        }
        
        set {
            size.width = newValue.dimension
        }
    }
    
    public var sizeCompatHeight: MasonDimensionCompat {
        get {
            return MasonDimensionCompat(value: size.height)
        }
        
        set {
            size.height = newValue.dimension
        }
    }
    
    public func setSizeWidth(_ value: Float, _ type: Int) {
        guard let width = getDimension(value, type) else {return}
        
        size = MasonSize(width, size.height)
    }
    
    public func setSizeHeight(_ value: Float, _ type: Int) {
        guard let height = getDimension(value, type) else {return}
        
        size = MasonSize(size.width, height)
    }
    
    public func setSizeWidthHeight(_ value: Float, _ type: Int) {
        guard let wh = getDimension(value, type) else {return}
        size = MasonSize(wh, wh)
    }
    
    
    public var maxSize = MasonDimensionSizeAuto {
        didSet {
            isDirty = true
        }
    }
    
    public var maxSizeCompat: MasonDimensionSizeCompat {
        get {
            guard let maxSize = maxSize.compatDimension else {
                let compat = MasonDimensionSizeCompat(maxSize)
                maxSize.compatDimension = compat
                return compat
            }
            
            return maxSize
        }
        
        set {
            maxSize = newValue.intoMasonSize()
        }
    }
    
    
    public func setMaxSizeWidth(_ value: Float, _ type: Int) {
        guard let width = getDimension(value, type) else {return}
        
        maxSize = MasonSize(width, maxSize.height)
    }
    
    public func setMaxSizeHeight(_ value: Float, _ type: Int) {
        guard let height = getDimension(value, type) else {return}
        maxSize = MasonSize(maxSize.width, height)
    }
    
    
    public func setMaxSizeWidthHeight(_ value: Float, _ type: Int) {
        guard let wh = getDimension(value, type) else {return}
        maxSize = MasonSize(wh, wh)
    }
    
    public var gap = MasonLengthPercentageSizeZero {
        didSet {
            isDirty = true
        }
    }
    
    
    public var gapCompat: MasonLengthPercentageSizeCompat {
        get {
            guard let gap = gap.compatLength else {
                let compat = MasonLengthPercentageSizeCompat(gap)
                gap.compatLength = compat
                return compat
            }
            
            return gap
        }
        
        set {
            gap = newValue.intoMasonSize()
        }
    }
    
    public func setGapRow(_ value: Float, _ type: Int) {
        setRowGap(value, type)
    }
    
    public func setGapColumn(_ value: Float, _ type: Int) {
        setColumnGap(value, type)
    }
    
    public func setRowGap(_ value: Float, _ type: Int) {
        guard let width = getLengthPercentage(value, type) else {return}
        
        gap = MasonSize(width, gap.height)
    }
    
    public func setColumnGap(_ value: Float, _ type: Int) {
        guard let height = getLengthPercentage(value, type) else {return}
        gap = MasonSize(gap.width, height)
    }
    
    
    public var aspectRatio: Float? = nil{
        didSet {
            isDirty = true
        }
    }
    
    public var gridAutoRows: Array<MinMax> = []{
        didSet{
            isDirty = true
        }
    }
    
    public var gridAutoColumns: Array<MinMax> = []{
        didSet{
            isDirty = true
        }
    }
    
    public var gridAutoFlow: GridAutoFlow = GridAutoFlow.Row{
        didSet{
            isDirty = true
        }
    }
    
    public var gridColumn = LineGridPlacementAuto {
        didSet{
            isDirty = true
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
    
    public var gridColumnCompat: LineGridPlacementCompat {
        get {
            return LineGridPlacementCompat(gridColumn.start, gridColumn.end)
        }
        set {
            gridColumn = Line<GridPlacement>(newValue.start.placement, newValue.end.placement)
        }
    }
    
    public var gridColumnStartCompat: GridPlacementCompat {
        get {
            return gridColumnCompat.start
        }
        
        set {
            gridColumn = Line<GridPlacement>(newValue.placement, gridColumn.end)
        }
    }
    
    public var gridColumnEndCompat: GridPlacementCompat {
        get {
            return gridColumnCompat.end
        }
        
        set {
            gridColumn = Line<GridPlacement>(gridColumn.start, newValue.placement)
        }
    }
    
    
    
    public var gridRow =  LineGridPlacementAuto{
        didSet{
            isDirty = true
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
    
    
    public var gridRowCompat: LineGridPlacementCompat {
        get {
            return LineGridPlacementCompat(gridRow.start, gridRow.end)
        }
        
        set {
            gridRow = Line<GridPlacement>(newValue.start.placement, newValue.end.placement)
        }
    }
    
    public var gridRowStartCompat: GridPlacementCompat {
        get {
            return gridRowCompat.start
        }
        
        set {
            gridRow = Line<GridPlacement>(newValue.placement, gridRow.end)
        }
    }
    
    public var gridRowEndCompat: GridPlacementCompat {
        get {
            return gridRowCompat.end
        }
        
        set {
            gridRow = Line<GridPlacement>(gridRow.start, newValue.placement)
        }
    }
    
    public var gridTemplateRows: Array<TrackSizingFunction> = []{
        didSet{
            isDirty = true
        }
    }
    
    public var gridTemplateColumns: Array<TrackSizingFunction> = []{
        didSet{
            isDirty = true
        }
    }
    
    
    public override var description: String {
        var aspectRatio = "undefined"
        if(self.aspectRatio != nil){
            aspectRatio = String(aspectRatio)
        }
        var ret = "(MasonStyle)("
        
        ret += "display: \(display.cssValue), "
        ret += "position: \(position.cssValue), "
        ret += "flexDirection: \(flexDirection.cssValue), "
        ret += "overflow: \(overflow.cssValue), "
        ret += "overflowX: \(overflowX.cssValue), "
        ret += "overflowY: \(overflowY.cssValue), "
        ret += "flexWrap: \(flexWrap.cssValue), "
        ret += "alignItems: \(alignItems.cssValue), "
        ret += "alignSelf: \(alignSelf.cssValue), "
        ret += "alignContent: \(alignContent.cssValue), "
        ret += "justifyItems: \(justifyItems.cssValue), "
        ret += "justifySelf: \(justifySelf.cssValue), "
        ret += "justifyContent: \(justifyContent.cssValue), "
        ret += "position: \(position.cssValue), "
        ret += "margin: \(margin.cssValue), "
        ret += "padding: \(padding.cssValue), "
        ret += "border: \(border.cssValue), "
        ret += "gap: \(gap.cssValue), "
        ret += "flexGrow: \(flexGrow.description),"
        ret += "flexShrink: \(flexShrink.description),"
        ret += "flexBasis: \(flexBasis.cssValue),"
        ret += "size: \(size.cssValue),"
        ret += "minSize: \(minSize.cssValue),"
        ret += "maxSize: \(maxSize.cssValue),"
        ret += "aspectRatio: \(aspectRatio),"
        ret += "gridAutoRows: \(gridAutoRows),"
        ret += "gridAutoColumns: \(gridAutoColumns),"
        ret += "gridColumn: \(gridColumn.start.cssValue) \\ \(gridColumn.end.cssValue),"
        ret += "gridRow: \(gridRow.start.cssValue) \\ \(gridRow.end.cssValue),"
        ret += "gridTemplateRows: \(gridTemplateRows),"
        ret += "gridTemplateColumns: \(gridTemplateColumns),"
        ret += "scrollBarWidth: \(scrollBarWidth),"
        ret += ")"
        
        return ret
    }
}
