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
  static let ITEM_IS_REPLACED = 320 //Byte
  static let DISPLAY_MODE = 324
  static let FORCE_INLINE = 328
  static let MIN_CONTENT_WIDTH = 332
  static let MIN_CONTENT_HEIGHT = 336
  static let MAX_CONTENT_WIDTH = 340
  static let MAX_CONTENT_HEIGHT = 344
}


internal struct StateKeys: OptionSet {
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
  static let itemIsReplaced  = StateKeys(rawValue: 1 << 33)
  static let displayMode     = StateKeys(rawValue: 1 << 34)
  static let forceInline     = StateKeys(rawValue: 1 << 35)
  static let minContentWidth = StateKeys(rawValue: 1 << 36)
  static let minContentHeight = StateKeys(rawValue: 1 << 37)
  static let maxContentWidth  = StateKeys(rawValue: 1 << 38)
  static let maxContentHeight = StateKeys(rawValue: 1 << 39)
}



@objc(MasonStyle)
@objcMembers
public class MasonStyle: NSObject {
  internal var isDirty: Int64 = -1
  internal var isSlowDirty = false
  let node: MasonNode
  var inBatch = false
  
 
//  private lazy var values: NSMutableData = {
//    let buffer = mason_style_get_style_buffer_apple(node.mason.nativePtr, node.nativePtr)
//    guard let buffer else {
//      // todo
//      fatalError("Could not allocate style buffer")
//    }
//    
//
//    let data = Unmanaged<NSMutableData>.fromOpaque(buffer)
//    
//
//    return data.takeRetainedValue()
//  }()
  
  internal var isValueInitialized: Bool  = false
  
  public lazy var valuesCompat: NSMutableData = {
    let buffer = mason_style_get_style_buffer_apple(node.mason.nativePtr, node.nativePtr)
    guard let buffer else {
      // todo
      fatalError("Could not allocate style buffer")
    }
    
    isValueInitialized = true
    
    return Unmanaged<NSMutableData>.fromOpaque(buffer).takeRetainedValue()
  }()
  
  public lazy var values: Data = {
    let buffer = mason_style_get_style_buffer(node.mason.nativePtr, node.nativePtr)
    guard let buffer else {
      // todo
      fatalError("Could not allocate style buffer")
    }
    
    let data = Data(bytesNoCopy: buffer.pointee.data, count: Int(buffer.pointee.size), deallocator: .none)
    
    mason_style_release_style_buffer(buffer)

    return data
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
  
  private func getInt16(_ index: Int) -> Int16 {
    return valuesCompat.bytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee
  }
  
  private func setInt16(_ index: Int, _ value: Int16) {
    valuesCompat.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee = value
  }
  
  private func getInt32(_ index: Int) -> Int32 {
    return valuesCompat.bytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee
  }
  
  private func setInt32(_ index: Int, _ value: Int32) {
    valuesCompat.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
  }
  
  
  private func getFloat(_ index: Int) -> Float {
    return valuesCompat.bytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee
  }
  
  private func setFloat(_ index: Int, _ value: Float) {
    valuesCompat.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
  }
  
  private func updateIntField(offset: Int, value: Int32, state: StateKeys){
    setInt32(offset, value)
    setOrAppendState(state)
  }
  
  private func updateFloatField(offset: Int, value: Float, state: StateKeys){
    setFloat(offset, value)
    setOrAppendState(state)
  }
  
  
  
  public var display: Display {
    get {
      let mode = DisplayMode(rawValue: getInt32(Int(StyleKeys.DISPLAY_MODE)))!
      switch mode {
      case .None:
        return Display(rawValue: getInt32(Int(StyleKeys.DISPLAY)))!
      case .Inline:
        return .Inline
      case .Box:
        switch Display(rawValue: getInt32(Int(StyleKeys.DISPLAY)))! {
        case .Flex:
          return .InlineFlex
        case .Grid:
          return .InlineGrid
        case .Block:
          return .InlineBlock
        default:
          fatalError("Display cannot be anything other than 0,1,2 when mode is set")
        }
      }
    }
    set {
      if(newValue == .Inline && (node.view as? MasonText) == nil){
        return
      }
      
      var displayMode = DisplayMode.None
      var value: Int32
      switch (newValue){
      case .None, .Flex, .Grid , .Block:
        value = newValue.rawValue
      case .Inline:
        displayMode = .Inline
        value = Display.Block.rawValue
      case .InlineBlock:
        displayMode = .Box
        value = Display.Block.rawValue
      case .InlineFlex:
        displayMode = .Box
        value = Display.Flex.rawValue
      case .InlineGrid:
        displayMode = .Box
        value = Display.Grid.rawValue
      }
      
      setInt32(StyleKeys.DISPLAY, value)
      setInt32(StyleKeys.DISPLAY_MODE, displayMode.rawValue)
      setOrAppendState(StateKeys(rawValue: StateKeys.display.rawValue | StateKeys.displayMode.rawValue))
    }
  }
  
  public var position: Position {
    get {
      return Position(rawValue: getInt32(StyleKeys.POSITION))!
    }
    set {
      setInt32(StyleKeys.POSITION, Int32(newValue.rawValue))
      
      setOrAppendState(StateKeys.position)
    }
  }
  
  
  // TODO
  public var direction: Direction{
    get {
      return Direction(rawValue: getInt32(StyleKeys.POSITION))!
    }
    set {
      // todo
      setInt32(StyleKeys.POSITION, Int32(newValue.rawValue))
      
      setOrAppendState(StateKeys.direction)
      
    }
  }
  
  public var flexDirection: FlexDirection {
    get {
      return FlexDirection(rawValue: getInt32(Int(StyleKeys.FLEX_DIRECTION)))!
    }
    set {
      setInt32(StyleKeys.FLEX_DIRECTION, Int32(newValue.rawValue))
      
      setOrAppendState(StateKeys.flexDirection)
    }
  }
  
  
  public var flexWrap: FlexWrap{
    get {
      return FlexWrap(rawValue: getInt32(StyleKeys.FLEX_WRAP))!
    }
    set {
      setInt32(StyleKeys.FLEX_WRAP, newValue.rawValue)
      setOrAppendState(.flexWrap)
    }
  }
  
  public var overflowCompat: MasonOverflowPointCompat {
        get {
          return MasonOverflowPointCompat(Overflow(rawValue: getInt32(StyleKeys.OVERFLOW_X))!, Overflow(rawValue: getInt32(StyleKeys.OVERFLOW_Y))!)
        }
        set {
          updateIntField(offset: Int(StyleKeys.OVERFLOW_X), value:  Int32(newValue.x.rawValue), state: .overflowX)
          updateIntField(offset: Int(StyleKeys.OVERFLOW_Y), value:  Int32(newValue.y.rawValue), state: .overflowY)
        }
    }
  
    public var overflow: MasonPoint<Overflow> {
          get {
            return MasonPoint(Overflow(rawValue: getInt32(StyleKeys.OVERFLOW_X))!, Overflow(rawValue: getInt32(StyleKeys.OVERFLOW_Y))!)
          }
          set {
            updateIntField(offset: Int(StyleKeys.OVERFLOW_X), value:  Int32(newValue.x.rawValue), state: .overflowX)
            updateIntField(offset: Int(StyleKeys.OVERFLOW_Y), value:  Int32(newValue.y.rawValue), state: .overflowY)
          }
      }
  
  public var overflowX: Overflow{
    get {
      return Overflow(rawValue: getInt32(StyleKeys.OVERFLOW_X))!
    }
    set {
      setInt32(StyleKeys.OVERFLOW_X, newValue.rawValue)
      setOrAppendState(.overflowX)
    }
  }
  
  public var overflowY: Overflow{
    get {
      return Overflow(rawValue: getInt32(StyleKeys.OVERFLOW_Y))!
    }
    set {
      setInt32(StyleKeys.OVERFLOW_Y, newValue.rawValue)
      setOrAppendState(.overflowY)
    }
  }
  
  public var alignItems: AlignItems {
    get {
      return AlignItems(rawValue: getInt32(StyleKeys.ALIGN_ITEMS))!
    }
    set {
      setInt32(StyleKeys.ALIGN_ITEMS, newValue.rawValue)
      setOrAppendState(.alignItems)
    }
  }
  
  public var alignSelf: AlignSelf  {
    get {
      return AlignSelf(rawValue: getInt32(StyleKeys.ALIGN_SELF))!
    }
    set {
      setInt32(StyleKeys.ALIGN_SELF, newValue.rawValue)
      setOrAppendState(.alignSelf)
    }
  }
  
  public var alignContent: AlignContent {
    get {
      return AlignContent(rawValue: getInt32(StyleKeys.ALIGN_CONTENT))!
    }
    set {
      setInt32(StyleKeys.ALIGN_CONTENT, newValue.rawValue)
      setOrAppendState(.alignContent)
    }
  }
  
  public var justifyItems: JustifyItems {
    get {
      return JustifyItems(rawValue: getInt32(StyleKeys.JUSTIFY_ITEMS))!
    }
    set {
      setInt32(StyleKeys.JUSTIFY_ITEMS, newValue.rawValue)
      setOrAppendState(.justifyItems)
    }
  }
  
  public var justifySelf:  JustifySelf {
    get {
      return JustifySelf(rawValue: getInt32(StyleKeys.JUSTIFY_SELF))!
    }
    set {
      setInt32(StyleKeys.JUSTIFY_SELF, newValue.rawValue)
      setOrAppendState(.justifySelf)
    }
  }
  
  public var justifyContent: JustifyContent {
    get {
      return JustifyContent(rawValue: getInt32(StyleKeys.JUSTIFY_CONTENT))!
    }
    set {
      setInt32(StyleKeys.JUSTIFY_CONTENT, newValue.rawValue)
      setOrAppendState(.justifyContent)
    }
  }
  
  public var inset: MasonRect<MasonLengthPercentageAuto>{
    get{
      var type = getInt32(Int(StyleKeys.INSET_LEFT_TYPE))
      var value = getFloat(Int(StyleKeys.INSET_LEFT_VALUE))
      
      let left = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      type = getInt32(Int(StyleKeys.INSET_LEFT_TYPE))
      value = getFloat(Int(StyleKeys.INSET_RIGHT_VALUE))
      
      let right = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      type = getInt32(Int(StyleKeys.INSET_TOP_TYPE))
      value = getFloat(Int(StyleKeys.INSET_TOP_VALUE))
      
      let top = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      type = getInt32(Int(StyleKeys.INSET_BOTTOM_TYPE))
      value = getFloat(Int(StyleKeys.INSET_BOTTOM_VALUE))
      
      let bottom = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      
      return MasonRect(left, right, top, bottom)
    }
    set {
    
      setInt32(Int(StyleKeys.INSET_LEFT_TYPE), newValue.left.type)
      setFloat(Int(StyleKeys.INSET_LEFT_VALUE), newValue.left.value)
      
      setInt32(Int(StyleKeys.INSET_RIGHT_TYPE), newValue.right.type)
      setFloat(Int(StyleKeys.INSET_RIGHT_VALUE), newValue.right.value)
      
      setInt32(Int(StyleKeys.INSET_TOP_TYPE), newValue.top.type)
      setFloat(Int(StyleKeys.INSET_TOP_VALUE), newValue.top.value)
      
      setInt32(Int(StyleKeys.INSET_BOTTOM_TYPE), newValue.bottom.type)
      setFloat(Int(StyleKeys.INSET_BOTTOM_VALUE), newValue.bottom.value)
 
      setOrAppendState(.inset)
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
    
    setInt32(Int(StyleKeys.INSET_LEFT_TYPE), left.type)
    setFloat(Int(StyleKeys.INSET_LEFT_VALUE), left.value)
  
    
    setOrAppendState(.inset)
  }
  
  public var leftInset: MasonLengthPercentageAuto {
    get {
      return inset.left
    }
    set {
      setInt32(StyleKeys.INSET_LEFT_TYPE, newValue.type)
      setFloat(StyleKeys.INSET_LEFT_VALUE, newValue.value)
      
      setOrAppendState(.inset)
    }
  }
  
  public func setInsetRight(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentageAuto(value, type) else {return}
    
    setInt32(StyleKeys.INSET_RIGHT_TYPE, right.type)
    setFloat(StyleKeys.INSET_RIGHT_VALUE, right.value)
    
    setOrAppendState(.inset)
  }
  
  public var rightInset: MasonLengthPercentageAuto {
    get {
      return inset.right
    }
    set {
      setInt32(StyleKeys.INSET_RIGHT_TYPE, newValue.type)
      setFloat(StyleKeys.INSET_RIGHT_VALUE, newValue.value)
      
      setOrAppendState(.inset)
    }
  }
  
  public func setInsetTop(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentageAuto(value, type) else {return}
    
    setInt32(StyleKeys.INSET_TOP_TYPE, top.type)
    setFloat(StyleKeys.INSET_TOP_VALUE, top.value)
  
    setOrAppendState(.inset)
  }
  
  public var topInset: MasonLengthPercentageAuto {
    get {
      return inset.top
    }
    set {
      
      setInt32(StyleKeys.INSET_TOP_TYPE, newValue.type)
      setFloat(StyleKeys.INSET_TOP_VALUE, newValue.value)
      
      setOrAppendState(.inset)
    }
  }
  
  public func setInsetBottom(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentageAuto(value, type) else {return}
   
    setInt32(StyleKeys.INSET_BOTTOM_TYPE, bottom.type)
    setFloat(StyleKeys.INSET_BOTTOM_VALUE, bottom.value)
  
    setOrAppendState(.inset)
  }
  
  public var bottomInset: MasonLengthPercentageAuto {
    get {
      return inset.bottom
    }
    set {
      setInt32(StyleKeys.INSET_BOTTOM_TYPE, newValue.type)
      setFloat(StyleKeys.INSET_BOTTOM_VALUE, newValue.value)
      
      setOrAppendState(.inset)
    }
  }
  
  public func setInsetWithValueType(_ value: Float, _ type: Int) {
    guard let inset = getLengthPercentageAuto(value, type) else {return}
    self.inset = MasonRect(uniform: inset)
  }
  
  
  public var margin: MasonRect<MasonLengthPercentageAuto> {
    get{
      var type = getInt32(StyleKeys.MARGIN_LEFT_TYPE)
      var value = getFloat(StyleKeys.MARGIN_LEFT_VALUE)
      
      let left = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      
      type = getInt32(StyleKeys.MARGIN_RIGHT_TYPE)
      value =  getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
      
      let right = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      
      type = getInt32(StyleKeys.MARGIN_TOP_TYPE)
      value =  getFloat(StyleKeys.MARGIN_TOP_VALUE)
      
      let top = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.MARGIN_BOTTOM_TYPE)
      value =  getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
      
      let bottom = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      return MasonRect(left, right, top, bottom)
    }
    set {
      setInt32(Int(StyleKeys.MARGIN_LEFT_TYPE), newValue.left.type)
      setFloat(Int(StyleKeys.MARGIN_LEFT_VALUE), newValue.left.value)
      
      setInt32(Int(StyleKeys.MARGIN_RIGHT_TYPE), newValue.right.type)
      setFloat(Int(StyleKeys.MARGIN_RIGHT_VALUE), newValue.right.value)
      
      setInt32(Int(StyleKeys.MARGIN_TOP_TYPE), newValue.top.type)
      setFloat(Int(StyleKeys.MARGIN_TOP_VALUE), newValue.top.value)
      
      setInt32(Int(StyleKeys.MARGIN_BOTTOM_TYPE), newValue.bottom.type)
      setFloat(Int(StyleKeys.MARGIN_BOTTOM_VALUE), newValue.bottom.value)
      
      setOrAppendState(.margin)
    }
  }
  
  
  public var marginLeft: MasonLengthPercentageAuto {
    get{
      let type = getInt32(StyleKeys.MARGIN_LEFT_TYPE)
      let value = getFloat(StyleKeys.MARGIN_LEFT_VALUE)
      
      return MasonLengthPercentageAuto.fromValueType(value, Int(type))!
    }
    set {
      setInt32(Int(StyleKeys.MARGIN_LEFT_TYPE), newValue.type)
      setFloat(Int(StyleKeys.MARGIN_LEFT_VALUE), newValue.value)
      setOrAppendState(.margin)
    }
  }
  
  public var marginTop: MasonLengthPercentageAuto {
    get{
      let type = getInt32(StyleKeys.MARGIN_TOP_TYPE)
      let value = getFloat(StyleKeys.MARGIN_TOP_VALUE)
      
      return MasonLengthPercentageAuto.fromValueType(value, Int(type))!
    }
    set {
      setInt32(Int(StyleKeys.MARGIN_TOP_TYPE), newValue.type)
      setFloat(Int(StyleKeys.MARGIN_TOP_VALUE), newValue.value)
      setOrAppendState(.margin)
    }
  }
  
  public var marginRight: MasonLengthPercentageAuto {
    get{
      let type = getInt32(StyleKeys.MARGIN_RIGHT_TYPE)
      let value = getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
      
      return MasonLengthPercentageAuto.fromValueType(value, Int(type))!
    }
    set {
      setInt32(Int(StyleKeys.MARGIN_RIGHT_TYPE), newValue.type)
      setFloat(Int(StyleKeys.MARGIN_RIGHT_VALUE), newValue.value)
      setOrAppendState(.margin)
    }
  }
  
  public var marginBottom: MasonLengthPercentageAuto {
    get{
      let type = getInt32(StyleKeys.MARGIN_BOTTOM_TYPE)
      let value = getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
      
      return MasonLengthPercentageAuto.fromValueType(value, Int(type))!
    }
    set {
      setInt32(Int(StyleKeys.MARGIN_BOTTOM_TYPE), newValue.type)
      setFloat(Int(StyleKeys.MARGIN_BOTTOM_VALUE), newValue.value)
      setOrAppendState(.margin)
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
    
    setInt32(Int(StyleKeys.MARGIN_LEFT_TYPE), left.type)
    setFloat(Int(StyleKeys.MARGIN_LEFT_VALUE), left.value)
    
    setOrAppendState(.margin)
  }
  
  public func setMarginRight(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentageAuto(value, type) else {return}
    
    setInt32(Int(StyleKeys.MARGIN_RIGHT_TYPE), right.type)
    setFloat(Int(StyleKeys.MARGIN_RIGHT_VALUE), right.value)
    
    setOrAppendState(.margin)
  }
  
  public func setMarginTop(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentageAuto(value, type) else {return}
    
    setInt32(StyleKeys.MARGIN_TOP_TYPE, top.type)
    setFloat(StyleKeys.MARGIN_TOP_VALUE, top.value)
    
    setOrAppendState(.margin)
  }
  
  public func setMarginBottom(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentageAuto(value, type) else {return}
    
    setInt32(StyleKeys.MARGIN_BOTTOM_TYPE, bottom.type)
    setFloat(StyleKeys.MARGIN_BOTTOM_VALUE, bottom.value)
    
    setOrAppendState(.margin)
  }
  
  public func setMarginWithValueType(_ value: Float, _ type: Int) {
    guard let margin = getLengthPercentageAuto(value, type) else {return}
    
    self.margin = MasonRect(margin, margin, margin, margin)
  }
  
  
  public var padding: MasonRect<MasonLengthPercentage> {
    get{
      var type = getInt32(StyleKeys.PADDING_LEFT_TYPE)
      var value = getFloat(StyleKeys.PADDING_LEFT_VALUE)
      
      let left = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.PADDING_RIGHT_TYPE)
      value = getFloat(StyleKeys.PADDING_RIGHT_VALUE)
      
      let right = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.PADDING_TOP_TYPE)
      value = getFloat(StyleKeys.PADDING_TOP_VALUE)
      
      let top = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.PADDING_BOTTOM_TYPE)
      value = getFloat(StyleKeys.PADDING_BOTTOM_VALUE)
      
      let bottom = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      
      return MasonRect(left, right, top, bottom)
    }
    set {
      setInt32(StyleKeys.PADDING_LEFT_TYPE, newValue.left.type)
      setFloat(StyleKeys.PADDING_LEFT_VALUE, newValue.left.value)
      
      setInt32(StyleKeys.PADDING_RIGHT_TYPE, newValue.right.type)
      setFloat(StyleKeys.PADDING_RIGHT_VALUE, newValue.right.value)
      
      setInt32(StyleKeys.PADDING_TOP_TYPE, newValue.top.type)
      setFloat(StyleKeys.PADDING_TOP_VALUE, newValue.top.value)
      
      setInt32(StyleKeys.PADDING_BOTTOM_TYPE, newValue.bottom.type)
      setFloat(StyleKeys.PADDING_BOTTOM_VALUE, newValue.bottom.value)
      
      setOrAppendState(.padding)
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
    setInt32(StyleKeys.PADDING_LEFT_TYPE, left.type)
    setFloat(StyleKeys.PADDING_LEFT_VALUE, left.value)
    
    setOrAppendState(.padding)
  }
  
  public func setPaddingRight(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.PADDING_RIGHT_TYPE, right.type)
    setFloat(StyleKeys.PADDING_RIGHT_VALUE, right.value)
    
    setOrAppendState(.padding)
  }
  
  public func setPaddingTop(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.PADDING_TOP_TYPE, top.type)
    setFloat(StyleKeys.PADDING_TOP_VALUE, top.value)
    
    setOrAppendState(.padding)
  }
  
  public func setPaddingBottom(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.PADDING_BOTTOM_TYPE, bottom.type)
    setFloat(StyleKeys.PADDING_BOTTOM_VALUE, bottom.value)
    
    setOrAppendState(.padding)
  }
  
  public func setPaddingWithValueType(_ value: Float, _ type: Int) {
    guard let padding = getLengthPercentage(value, type) else {return}
    
    self.padding = MasonRect(padding, padding, padding, padding)
  }
  
  
  public var border: MasonRect<MasonLengthPercentage> {
    get {
      var type = getInt32(StyleKeys.BORDER_LEFT_TYPE)
      var value = getFloat(StyleKeys.BORDER_LEFT_VALUE)
      
      let left = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.BORDER_RIGHT_TYPE)
      
      value = getFloat(StyleKeys.BORDER_RIGHT_VALUE)
      
      let right = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      
      type = getInt32(StyleKeys.BORDER_TOP_TYPE)
      
      value = getFloat(StyleKeys.BORDER_TOP_VALUE)
      
      let top = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      
      type = getInt32(StyleKeys.BORDER_BOTTOM_TYPE)
      
      value = getFloat(StyleKeys.BORDER_BOTTOM_VALUE)
      
      let bottom = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      
      return MasonRect(left, right, top, bottom)
    }
    set {
      setInt32(StyleKeys.BORDER_LEFT_TYPE, newValue.left.type)
      setFloat(StyleKeys.BORDER_LEFT_VALUE, newValue.left.value)
      
      setInt32(StyleKeys.BORDER_RIGHT_TYPE, newValue.right.type)
      setFloat(StyleKeys.BORDER_RIGHT_VALUE, newValue.right.value)
      
      setInt32(StyleKeys.BORDER_TOP_TYPE, newValue.top.type)
      setFloat(StyleKeys.BORDER_TOP_VALUE, newValue.top.value)
      
      setInt32(StyleKeys.BORDER_BOTTOM_TYPE, newValue.bottom.type)
      setFloat(StyleKeys.BORDER_BOTTOM_VALUE, newValue.bottom.value)
      
      setOrAppendState(.border)
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
    
    setInt32(StyleKeys.BORDER_LEFT_TYPE, left.type)
    setFloat(StyleKeys.BORDER_LEFT_VALUE,  left.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderRight(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.BORDER_RIGHT_TYPE, right.type)
    setFloat(StyleKeys.BORDER_RIGHT_VALUE, right.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderTop(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.BORDER_TOP_TYPE, top.type)
    setFloat(StyleKeys.BORDER_TOP_VALUE, top.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderBottom(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.BORDER_TOP_TYPE, bottom.type)
    setFloat(StyleKeys.BORDER_TOP_VALUE, bottom.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderWithValueType(_ value: Float, _ type: Int) {
    guard let padding = getLengthPercentage(value, type) else {return}
    
    self.padding = MasonRect(padding, padding, padding, padding)
  }
  
  
  public var flexGrow: Float {
    get {
      return getFloat(StyleKeys.FLEX_GROW)
    }
    set {
      setFloat(StyleKeys.FLEX_GROW, newValue)
      setOrAppendState(.flexGrow)
    }
  }
  
  public var flexShrink: Float {
    get {
      return getFloat(StyleKeys.FLEX_SHRINK)
    }
    set {
      setFloat(StyleKeys.FLEX_SHRINK, newValue)
      setOrAppendState(.flexShrink)
    }
  }
  
  public var flexBasis: MasonDimension {
    get {
      let value = getFloat(StyleKeys.FLEX_BASIS_VALUE)
      switch(getInt32(StyleKeys.FLEX_BASIS_TYPE)){
      case 0:
        return MasonDimension.Auto
      case 1:
        return MasonDimension.Points(value)
      case 2:
        return MasonDimension.Percent(value)
      default: return MasonDimension.Auto // assert ??
      }
      
    }
    set {
      setInt32(StyleKeys.FLEX_BASIS_TYPE, newValue.type)
      setFloat(StyleKeys.FLEX_BASIS_VALUE, newValue.value)
      
      setOrAppendState(.flexBasis)
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
  
  public var scrollBarWidth: MasonDimension {
    get {
      return MasonDimension.Points(getFloat(StyleKeys.SCROLLBAR_WIDTH))
    }
    set {
      setFloat(StyleKeys.SCROLLBAR_WIDTH, newValue.value)
      setOrAppendState(.scrollbarWidth)
    }
  }
  
  public func setScrollBarWidth(_ value: Float) {
    scrollBarWidth = MasonDimension.Points(value);
  }
  
  public var textAlign: TextAlign {
    get {
      return TextAlign(rawValue: getInt32(StyleKeys.TEXT_ALIGN))!
    }
    set {
      setInt32(StyleKeys.TEXT_ALIGN, Int32(newValue.rawValue))
      setOrAppendState(.textAlign)
    }
  }
  
  public var boxSizing: BoxSizing {
    get {
      return BoxSizing(rawValue: getInt32(StyleKeys.BOX_SIZING))!
    }
    set {
      setInt32(StyleKeys.BOX_SIZING, Int32(newValue.rawValue))
      setOrAppendState(.boxSizing)
    }
  }
  
  
  public var minSize: MasonSize<MasonDimension>{
    get{
      var type = getInt32(StyleKeys.MIN_WIDTH_TYPE)
      
      var value = getFloat(StyleKeys.MIN_WIDTH_VALUE)
      
      let width = MasonDimension.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.MIN_HEIGHT_TYPE)
      value = getFloat(StyleKeys.MIN_HEIGHT_VALUE)
      
      let height = MasonDimension.fromValueType(value, Int(type))!
      
      return MasonSize(width, height)
    }
    set {
      
      setInt32(StyleKeys.MIN_WIDTH_TYPE, newValue.width.type)
      setFloat(StyleKeys.MIN_WIDTH_VALUE, newValue.width.value)
      
      setInt32(StyleKeys.MIN_HEIGHT_TYPE, newValue.height.type)
      setFloat(StyleKeys.MIN_HEIGHT_VALUE, newValue.height.value)
      
      setOrAppendState(.minSize)
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
  
  public var size: MasonSize<MasonDimension>{
    get{
      
      var type = getInt32(StyleKeys.WIDTH_TYPE)
      
      var value = getFloat(StyleKeys.WIDTH_VALUE)
      
      let width = MasonDimension.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.HEIGHT_TYPE)
      
      value = getFloat(StyleKeys.HEIGHT_VALUE)
      
      let height = MasonDimension.fromValueType(value, Int(type))!
  
      
      return MasonSize(width, height)
    }
    set {
      setInt32(StyleKeys.WIDTH_TYPE, newValue.width.type)
      setFloat(StyleKeys.WIDTH_VALUE, newValue.width.value)
      
      setInt32(StyleKeys.HEIGHT_TYPE, newValue.height.type)
      setFloat(StyleKeys.HEIGHT_VALUE, newValue.height.value)
      
      
      setOrAppendState(.size)
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
      setInt32(StyleKeys.WIDTH_TYPE, newValue.dimension.type)
      setFloat(StyleKeys.WIDTH_VALUE, newValue.dimension.value)
      
      setOrAppendState(.size)
    }
  }
  
  public var sizeCompatHeight: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: size.height)
    }
    
    set {
      setInt32(StyleKeys.HEIGHT_TYPE, newValue.dimension.type)
      setFloat(StyleKeys.HEIGHT_VALUE, newValue.dimension.value)
      setOrAppendState(.size)
    }
  }
  
  public func setSizeWidth(_ value: Float, _ type: Int) {
    guard let width = getDimension(value, type) else {return}
    

    setInt32(StyleKeys.WIDTH_TYPE, width.type)
    setFloat(StyleKeys.WIDTH_VALUE, width.value)
    
    setOrAppendState(.size)
  }
  
  public func setSizeHeight(_ value: Float, _ type: Int) {
    guard let height = getDimension(value, type) else {return}
    
    setInt32(StyleKeys.HEIGHT_TYPE, height.type)
    setFloat(StyleKeys.HEIGHT_VALUE, height.value)
    
    setOrAppendState(.size)
  }
  
  public func setSizeWidth(_ width: MasonDimension) {
    
    setInt32(StyleKeys.WIDTH_TYPE, width.type)
    setFloat(StyleKeys.WIDTH_VALUE, width.value)
    
    setOrAppendState(.size)
  }
  
  
  public func setSizeHeight(_ height: MasonDimension) {

    setInt32(StyleKeys.HEIGHT_TYPE, height.type)
    setFloat(StyleKeys.HEIGHT_VALUE, height.value)
    
    setOrAppendState(.size)
  }
  
  public func setSizeWidthHeight(_ value: Float, _ type: Int) {
    guard let wh = getDimension(value, type) else {return}
    size = MasonSize(wh, wh)
  }
  
  
  public var maxSize: MasonSize<MasonDimension>{
    get{
      var type = getInt32(StyleKeys.MAX_WIDTH_TYPE)
      
      var value = getFloat(StyleKeys.MAX_WIDTH_VALUE)
      
      let width = MasonDimension.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.MAX_HEIGHT_TYPE)
      
      value = getFloat(StyleKeys.MAX_HEIGHT_VALUE)
      
      let height = MasonDimension.fromValueType(value, Int(type))!
      
      return MasonSize(width, height)
    }
    set {
      
      setInt32(StyleKeys.MAX_WIDTH_TYPE, newValue.width.type)
      setFloat(StyleKeys.MAX_WIDTH_VALUE, newValue.width.value)
      
      
      setInt32(StyleKeys.MAX_HEIGHT_TYPE, newValue.height.type)
      setFloat(StyleKeys.MAX_HEIGHT_VALUE, newValue.height.value)
      
      setOrAppendState(.maxSize)
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
  
  public var gap: MasonSize<MasonLengthPercentage>{
    get{
      var type = getInt32(StyleKeys.GAP_ROW_TYPE)
      var value = getFloat(StyleKeys.GAP_ROW_VALUE)
      
      let width = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.GAP_COLUMN_TYPE)
      value = getFloat(StyleKeys.GAP_COLUMN_VALUE)
      
      let height = MasonLengthPercentage.fromValueType(value, Int(type))!
      
      return MasonSize(width, height)
    }
    set {
  
      setInt32(StyleKeys.GAP_ROW_TYPE, newValue.width.type)
      
      setFloat(StyleKeys.GAP_ROW_VALUE, newValue.width.value)
      
      
      setInt32(StyleKeys.GAP_COLUMN_TYPE, newValue.height.type)
      
      setFloat(StyleKeys.GAP_COLUMN_VALUE,newValue.height.value)
      
      setOrAppendState(.gap)
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
  
  
  public var aspectRatio: Float?{
    get {
      let value = getFloat(StyleKeys.ASPECT_RATIO)
      if(value.isNaN){
        return nil
      }
      return value
    }
    set {
      if let value = newValue {
        if(value.isNaN){
          setFloat(StyleKeys.ASPECT_RATIO, Float.nan)
        }else {
          setFloat(StyleKeys.ASPECT_RATIO, value)
        }
      }else {
        setFloat(StyleKeys.ASPECT_RATIO, Float.nan)
      }
    }
  }
  
  
  func gridAutoToCss(_ value: Array<MinMax>) -> String {
    if(value.isEmpty){
      return ""
    }
    var ret = ""
    let last = value.count - 1
    for (i, row) in value.enumerated() {
      if(i == last){
        ret += "\(row.cssValue)"
      }else {
        ret += "\(row.cssValue) "
      }
      
    }
    return ret
  }
  
  public var gridAutoRows: Array<MinMax> = []{
    didSet{
      isSlowDirty = true
      if (!inBatch) {
        updateNativeStyle()
      }
    }
  }
  
  public var gridAutoColumns: Array<MinMax> = []{
    didSet{
      isSlowDirty = true
      if (!inBatch) {
        updateNativeStyle()
      }
    }
  }
  
  public var gridAutoFlow: GridAutoFlow {
    get {
      return GridAutoFlow(rawValue: getInt32(StyleKeys.GRID_AUTO_FLOW))!
    }

    set {
      setInt32(StyleKeys.GRID_AUTO_FLOW, Int32(newValue.rawValue))
      setOrAppendState(.gridAutoFlow)
    }
  }
  
  public var gridColumn:  Line<GridPlacement> {
    get{
      var type = getInt32(StyleKeys.GRID_COLUMN_START_TYPE)
      
      var value = getInt16(StyleKeys.GRID_COLUMN_START_VALUE)
      
      let start = GridPlacement.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.GRID_COLUMN_END_TYPE)
      
      value = getInt16(StyleKeys.GRID_COLUMN_END_VALUE)
      
      let end = GridPlacement.fromValueType(value, Int(type))!
      
      return Line(start, end)
    }
    set {
      setInt32(StyleKeys.GRID_COLUMN_START_TYPE, newValue.start.type)
      setInt16(StyleKeys.GRID_COLUMN_START_VALUE, newValue.start.placementValue)
      
      setInt32(StyleKeys.GRID_COLUMN_END_TYPE, newValue.end.type)
      setInt16(StyleKeys.GRID_COLUMN_END_VALUE, newValue.end.placementValue)
      
      setOrAppendState(.gridColumn)
    }
  }
  
  
  public var gridColumnStart: GridPlacement {
    get {
      let type = getInt32(StyleKeys.GRID_COLUMN_START_TYPE)
      
      let value = getInt16(StyleKeys.GRID_COLUMN_START_VALUE)
      
      return GridPlacement.fromValueType(value, Int(type))!
    }
    
    set {
      setInt32(StyleKeys.GRID_COLUMN_START_TYPE, newValue.type)
      setInt16(StyleKeys.GRID_COLUMN_START_VALUE, newValue.placementValue)
      setOrAppendState(.gridColumn)
    }
  }
  
  public var gridColumnEnd: GridPlacement {
    get {
      let type = getInt32(StyleKeys.GRID_COLUMN_END_TYPE)
      
      let value = getInt16(StyleKeys.GRID_COLUMN_END_VALUE)
      
      return GridPlacement.fromValueType(value, Int(type))!
    }
    
    set {
      setInt32(StyleKeys.GRID_COLUMN_END_TYPE, newValue.type)
      setInt16(StyleKeys.GRID_COLUMN_END_VALUE, newValue.placementValue)
      setOrAppendState(.gridColumn)
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
      gridColumnStart = newValue.placement
    }
  }
  
  public var gridColumnEndCompat: GridPlacementCompat {
    get {
      return gridColumnCompat.end
    }
    
    set {
      gridColumnEnd = newValue.placement
    }
  }
  
  
  
  public var gridRow:  Line<GridPlacement> {
    get{
      var type = getInt32(StyleKeys.GRID_ROW_START_TYPE)
      
      var value = getInt16(StyleKeys.GRID_ROW_START_VALUE)
      
      let start = GridPlacement.fromValueType(value, Int(type))!
      
      type = getInt32(StyleKeys.GRID_ROW_END_TYPE)
      
      value = getInt16(StyleKeys.GRID_ROW_END_VALUE)
      
      let end = GridPlacement.fromValueType(value, Int(type))!
      
      return Line(start, end)
    }
    set {
      setInt32(StyleKeys.GRID_ROW_START_TYPE, newValue.start.type)
      setInt16(StyleKeys.GRID_ROW_START_VALUE, newValue.start.placementValue)
      
      setInt32(StyleKeys.GRID_ROW_END_TYPE, newValue.end.type)
      setInt16(StyleKeys.GRID_ROW_END_VALUE,  newValue.end.placementValue)
      
      setOrAppendState(.gridRow)
    }
  }
  
  public var gridRowStart: GridPlacement {
    get {
      let type = getInt32(StyleKeys.GRID_ROW_START_TYPE)
      
      let value = getInt16(StyleKeys.GRID_ROW_START_VALUE)
      
      return GridPlacement.fromValueType(value, Int(type))!
    }
    
    set {
      setInt32(StyleKeys.GRID_ROW_START_TYPE, newValue.type)
      setInt16(StyleKeys.GRID_ROW_START_VALUE, newValue.placementValue)
      
      setOrAppendState(.gridRow)
    }
  }
  
  public var gridRowEnd: GridPlacement {
    get {
      let type = getInt32(StyleKeys.GRID_ROW_END_TYPE)
      let value = getInt16(StyleKeys.GRID_ROW_END_VALUE)
      
      return GridPlacement.fromValueType(value, Int(type))!
    }
    
    set {
      setInt32(StyleKeys.GRID_ROW_END_TYPE,  newValue.type)
      setInt16(StyleKeys.GRID_ROW_END_VALUE, newValue.placementValue)
      
      setOrAppendState(.gridRow)
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
      gridRowStart = newValue.placement
    }
  }
  
  public var gridRowEndCompat: GridPlacementCompat {
    get {
      return gridRowCompat.end
    }
    
    set {
      gridRowEnd = newValue.placement
    }
  }
  
  func gridTemplateToCss(_ value: Array<TrackSizingFunction>) -> String {
    if(value.isEmpty){
      return ""
    }
    var ret = ""
    let last = value.count - 1
    for (i, row) in value.enumerated() {
      if(i == last){
        ret += "\(row.cssValue)"
      }else {
        ret += "\(row.cssValue) "
      }
      
    }
    return ret
  }
  
  public var gridTemplateRowsCSS: String {
    return gridTemplateToCss(gridTemplateRows)
  }
  
  public var gridTemplateRows: Array<TrackSizingFunction> = []{
    didSet{
      isSlowDirty = true
      if (!inBatch) {
        updateNativeStyle()
      }
    }
  }
  
  public var gridTemplateColumnsCSS: String {
    return gridTemplateToCss(gridTemplateColumns)
  }
  
  public var gridTemplateColumns: Array<TrackSizingFunction> = []{
    didSet{
      isSlowDirty = true
      if (!inBatch) {
        updateNativeStyle()
      }
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
                //overflow.rawValue,
                Overflow.RawValue(0),
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
      isDirty = -1
    }
    
    if (isDirty != -1) {
    //  mason_style_sync_style(node.mason.nativePtr, node.nativePtr, isDirty)
//
//      values.withUnsafeMutableBytes { (ptr: UnsafeMutableRawBufferPointer) in
//        guard let ptr = ptr.baseAddress else {return}
//        mason_style_sync_style_with_buffer(node.mason.nativePtr, node.nativePtr, isDirty, ptr.assumingMemoryBound(to: UInt8.self), UInt(values.count))
//      }
//
      
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
    ret += "overflow: \(overflowX ==  overflowY ? overflowX.cssValue : "\(overflowX.cssValue) \(overflowY.cssValue)"), "
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
