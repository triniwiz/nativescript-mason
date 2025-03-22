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


struct StyleKeys {
    static let DISPLAY = 0
    static let POSITION = 4
    static let DIRECTION = 8
    static let FLEX_DIRECTION = 12
    static let FLEX_WRAP = 16
    static let OVERFLOW_X = 20
    static let OVERFLOW_Y = 24

    static let ALIGN_ITEMS = 28
    static let ALIGN_SELF = 32
    static let ALIGN_CONTENT = 36

    static let JUSTIFY_ITEMS = 40
    static let JUSTIFY_SELF = 44
    static let JUSTIFY_CONTENT = 48

    static let INSET_LEFT_TYPE = 52
    static let INSET_LEFT_VALUE = 56
    static let INSET_RIGHT_TYPE = 60
    static let INSET_RIGHT_VALUE = 64
    static let INSET_TOP_TYPE = 68
    static let INSET_TOP_VALUE = 72
    static let INSET_BOTTOM_TYPE = 76
    static let INSET_BOTTOM_VALUE = 80

    static let MARGIN_LEFT_TYPE = 84
    static let MARGIN_LEFT_VALUE = 88
    static let MARGIN_RIGHT_TYPE = 92
    static let MARGIN_RIGHT_VALUE = 96
    static let MARGIN_TOP_TYPE = 100
    static let MARGIN_TOP_VALUE = 104
    static let MARGIN_BOTTOM_TYPE = 108
    static let MARGIN_BOTTOM_VALUE = 112

    static let PADDING_LEFT_TYPE = 116
    static let PADDING_LEFT_VALUE = 120
    static let PADDING_RIGHT_TYPE = 124
    static let PADDING_RIGHT_VALUE = 128
    static let PADDING_TOP_TYPE = 132
    static let PADDING_TOP_VALUE = 136
    static let PADDING_BOTTOM_TYPE = 140
    static let PADDING_BOTTOM_VALUE = 144

    static let BORDER_LEFT_TYPE = 148
    static let BORDER_LEFT_VALUE = 152
    static let BORDER_RIGHT_TYPE = 156
    static let BORDER_RIGHT_VALUE = 160
    static let BORDER_TOP_TYPE = 164
    static let BORDER_TOP_VALUE = 168
    static let BORDER_BOTTOM_TYPE = 172
    static let BORDER_BOTTOM_VALUE = 176

    static let FLEX_GROW = 180
    static let FLEX_SHRINK = 184

    static let FLEX_BASIS_TYPE = 188
    static let FLEX_BASIS_VALUE = 192

    static let WIDTH_TYPE = 196
    static let WIDTH_VALUE = 200
    static let HEIGHT_TYPE = 204
    static let HEIGHT_VALUE = 208

    static let MIN_WIDTH_TYPE = 212
    static let MIN_WIDTH_VALUE = 216
    static let MIN_HEIGHT_TYPE = 220
    static let MIN_HEIGHT_VALUE = 224

    static let MAX_WIDTH_TYPE = 228
    static let MAX_WIDTH_VALUE = 232
    static let MAX_HEIGHT_TYPE = 236
    static let MAX_HEIGHT_VALUE = 240

    static let GAP_ROW_TYPE = 244
    static let GAP_ROW_VALUE = 248
    static let GAP_COLUMN_TYPE = 252
    static let GAP_COLUMN_VALUE = 256

    static let ASPECT_RATIO = 260
    static let GRID_AUTO_FLOW = 264
    static let GRID_COLUMN_START_TYPE = 268
    static let GRID_COLUMN_START_VALUE = 272
    static let GRID_COLUMN_END_TYPE = 276
    static let GRID_COLUMN_END_VALUE = 280
    static let GRID_ROW_START_TYPE = 284
    static let GRID_ROW_START_VALUE = 288
    static let GRID_ROW_END_TYPE = 292
    static let GRID_ROW_END_VALUE = 296
    static let SCROLLBAR_WIDTH = 300
    static let TEXT_ALIGN = 304
    static let BOX_SIZING = 308
    static let OVERFLOW = 312
    static let ITEM_IS_TABLE = 316 // Byte
}

struct StateKeys: OptionSet {
    let rawValue: UInt64

    init(rawValue: UInt64) {
        self.rawValue = rawValue
    }


    static let display         = StateKeys(rawValue: 1 << 0)
    static let position        = StateKeys(rawValue: 1 << 1)
    static let direction       = StateKeys(rawValue: 1 << 2)
    static let flexDirection   = StateKeys(rawValue: 1 << 3)
    static let flexWrap        = StateKeys(rawValue: 1 << 4)
    static let overflowX       = StateKeys(rawValue: 1 << 5)
    static let overflowY       = StateKeys(rawValue: 1 << 6)
    static let alignItems      = StateKeys(rawValue: 1 << 7)
    static let alignSelf       = StateKeys(rawValue: 1 << 8)
    static let alignContent    = StateKeys(rawValue: 1 << 9)
    static let justifyItems    = StateKeys(rawValue: 1 << 10)
    static let justifySelf     = StateKeys(rawValue: 1 << 11)
    static let justifyContent  = StateKeys(rawValue: 1 << 12)
    static let inset           = StateKeys(rawValue: 1 << 13)
    static let margin          = StateKeys(rawValue: 1 << 14)
    static let padding         = StateKeys(rawValue: 1 << 15)
    static let border          = StateKeys(rawValue: 1 << 16)
    static let flexGrow        = StateKeys(rawValue: 1 << 17)
    static let flexShrink      = StateKeys(rawValue: 1 << 18)
    static let flexBasis       = StateKeys(rawValue: 1 << 19)
    static let size            = StateKeys(rawValue: 1 << 20)
    static let minSize         = StateKeys(rawValue: 1 << 21)
    static let maxSize         = StateKeys(rawValue: 1 << 22)
    static let gap             = StateKeys(rawValue: 1 << 23)
    static let aspectRatio     = StateKeys(rawValue: 1 << 24)
    static let gridAutoFlow    = StateKeys(rawValue: 1 << 25)
    static let gridColumn      = StateKeys(rawValue: 1 << 26)
    static let gridRow         = StateKeys(rawValue: 1 << 27)
    static let scrollbarWidth  = StateKeys(rawValue: 1 << 28)
    static let textAlign       = StateKeys(rawValue: 1 << 29)
    static let boxSizing       = StateKeys(rawValue: 1 << 30)
    static let overflow        = StateKeys(rawValue: 1 << 31)
    static let itemIsTable     = StateKeys(rawValue: 1 << 32)


    func contains(_ flag: StateKeys) -> Bool {
        return self.contains(flag)
    }
}



@objc(MasonStyle)
@objcMembers
public class MasonStyle: NSObject {
    internal var isDirty: Int64 = -1
    internal var isSlowDirty = false
    let node: MasonNode
    var inBatch = false
  
  lazy var values: NSMutableData = {
    let buffer = mason_style_get_style_buffer(node.mason.nativePtr, node.nativePtr)
    guard let buffer else {
      // todo
      fatalError("Could not allocate style buffer")
    }
    return NSMutableData(bytesNoCopy: buffer.pointee.data, length: Int(buffer.pointee.size)) { _, _ in
      mason_style_release_style_buffer(buffer)
    }

  }()
    public init(node: MasonNode) {
      self.node = node
    }
  
  private func setOrAppendState(_ value: StateKeys) {
    if isDirty == -1 {
      isDirty = Int64(value.rawValue)
    } else {
      isDirty |= Int64(value.rawValue)
    }
     if (!inBatch) {
       updateNativeStyle()
     }
   }
    
    public var display =  Display.Flex {
        didSet {
          let value = values.mutableBytes.advanced(by: Int(StyleKeys.DISPLAY)).assumingMemoryBound(to: Int32.self)
        
          value.pointee = Int32(display.rawValue)
        
          setOrAppendState(StateKeys.display)
        }
    }
    
    public var position = Position.Relative {
        didSet {
          let value = values.mutableBytes.advanced(by: Int(StyleKeys.POSITION)).assumingMemoryBound(to: Int32.self)
        
          value.pointee = Int32(position.rawValue)
        
          setOrAppendState(StateKeys.display)
        }
    }
    
    
    // TODO
    public var direction = Direction.Inherit{
        didSet {
            // todo
          let value = values.mutableBytes.advanced(by: Int(StyleKeys.DIRECTION)).assumingMemoryBound(to: Int32.self)
        
          value.pointee = Int32(direction.rawValue)
        
          setOrAppendState(StateKeys.direction)
          
        }
    }
    
    public var flexDirection = FlexDirection.Row{
        didSet {
          let value = values.mutableBytes.advanced(by: Int(StyleKeys.FLEX_DIRECTION)).assumingMemoryBound(to: Int32.self)
        
          value.pointee = Int32(flexDirection.rawValue)
        
          setOrAppendState(StateKeys.flexDirection)
        }
    }
  
  private func updateIntField(offset: Int, value: Int32, state: StateKeys){
    let bytes = values.mutableBytes.advanced(by: offset).assumingMemoryBound(to: Int32.self)
    bytes.pointee = value
    setOrAppendState(state)
  }
    
    public var flexWrap = FlexWrap.NoWrap{
        didSet {
          updateIntField(offset: Int(StyleKeys.FLEX_WRAP), value:  Int32(flexWrap.rawValue), state: .flexWrap)
        }
    }
    
    public var overflow = Overflow.Unset{
        didSet {
        // todo
        }
    }
    
    public var overflowX = Overflow.Unset{
        didSet {
          updateIntField(offset: Int(StyleKeys.OVERFLOW_X), value:  Int32(overflowX.rawValue), state: .overflowX)
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
  
  public var textAlign = MasonTextAlign.Auto {
      didSet {
          isDirty = true
      }
  }
  
  public var boxSizing = MasonBoxSizing.BorderBox {
      didSet {
          isDirty = true
      }
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
  
  
  public func updateNativeStyle() {
      if(inBatch){return}
    if (isSlowDirty) {
          var gridAutoRows = gridAutoRows.map({ minMax in
              minMax.cValue
          })
          
          let gridAutoRowsCount = UInt(gridAutoRows.count)
          
          var gridAutoColumns = gridAutoColumns.map({ minMax in
              minMax.cValue
          })
          
          let gridAutoColumnsCount = UInt(gridAutoRows.count)
          
          
          var gridTemplateRows =  gridTemplateRows.map { value in
              value.cValue
          }
          
          let gridTemplateRowsCount = UInt(gridTemplateRows.count)
          
          var gridTemplateColumns =  gridTemplateColumns.map { value in
              value.cValue
          }
          
          let gridTemplateColumnsCount = UInt(gridTemplateColumns.count)
          
          gridAutoRows.withUnsafeMutableBufferPointer { gridAutoRowsBuffer in
              
              var gridAutoRows = CMasonNonRepeatedTrackSizingFunctionArray()
              
              if(gridAutoRowsCount > 0){
                  gridAutoRows = CMasonNonRepeatedTrackSizingFunctionArray(array: gridAutoRowsBuffer.baseAddress, length: gridAutoRowsCount)
              }
              
              
              gridAutoColumns.withUnsafeMutableBufferPointer { gridAutoColumnsBuffer in
                  
                  var gridAutoColumns = CMasonNonRepeatedTrackSizingFunctionArray()
                  
                  if(gridAutoColumnsCount > 0){
                      gridAutoColumns = CMasonNonRepeatedTrackSizingFunctionArray(array: gridAutoColumnsBuffer.baseAddress, length: gridAutoColumnsCount)
                  }
                  
                  
                  
                  gridTemplateRows.withUnsafeMutableBufferPointer{ gridTemplateRowsBuffer in
                      
                      var gridTemplateRows = CMasonTrackSizingFunctionArray()
                      
                      if(gridTemplateRowsCount > 0){
                          gridTemplateRows = CMasonTrackSizingFunctionArray(array: gridTemplateRowsBuffer.baseAddress, length: gridTemplateRowsCount)
                      }
                      
                      
                      
                      gridTemplateColumns.withUnsafeMutableBufferPointer { gridTemplateColumnsBuffer in
                          
                          var gridTemplateColumns = CMasonTrackSizingFunctionArray()
                          
                          if(gridTemplateColumnsCount > 0){
                              gridTemplateColumns = CMasonTrackSizingFunctionArray(array: gridTemplateColumnsBuffer.baseAddress, length: gridTemplateColumnsCount)
                          }
                        
                        mason_style_set_with_values(
                              node.mason.nativePtr,
                              node.nativePtr,
                              display.rawValue,
                              position.rawValue,
                              direction.rawValue,
                              flexDirection.rawValue,
                              flexWrap.rawValue,
                              overflow.rawValue,
                              alignItems.rawValue,
                              alignSelf.rawValue,
                              alignContent.rawValue,
                              justifyItems.rawValue,
                              justifySelf.rawValue,
                              justifyContent.rawValue,
                              
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
                              
                              aspectRatio ?? Float.nan,
                              &gridAutoRows,
                              &gridAutoColumns,
                              gridAutoFlow.rawValue,
                              gridColumn.start.type,
                              gridColumn.start.placementValue,
                              gridColumn.end.type,
                              gridColumn.end.placementValue,
                              
                              gridRow.start.type,
                              gridRow.start.placementValue,
                              gridRow.end.type,
                              gridRow.end.placementValue,
                              &gridTemplateRows,
                              &gridTemplateColumns,
                              overflowX.rawValue,
                              overflowY.rawValue,
                              scrollBarWidth.value,
                              textAlign.rawValue,
                              boxSizing.rawValue
                          )
                      }
                  }
                  
              }
              
          }
      
        isSlowDirty = false
      }
    
    if (isDirty != -1) {
      mason_style_sync_style(node.mason.nativePtr, node.nativePtr, isDirty)
      isDirty = -1
    }
    
    // todo invalidate view
      
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
