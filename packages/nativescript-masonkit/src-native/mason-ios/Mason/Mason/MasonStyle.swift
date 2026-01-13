//
//  MasonStyle.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit


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
  static let ALIGN = 304
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
  
  
  // ----------------------------
  // Border Style (per side)
  // ----------------------------
  static let BORDER_LEFT_STYLE = 348
  static let BORDER_RIGHT_STYLE = 352
  static let BORDER_TOP_STYLE = 356
  static let BORDER_BOTTOM_STYLE = 360
  
  // ----------------------------
  // Border Color (per side)
  // ----------------------------
  static let BORDER_LEFT_COLOR = 364
  static let BORDER_RIGHT_COLOR = 368
  static let BORDER_TOP_COLOR = 372
  static let BORDER_BOTTOM_COLOR = 376
  
  // ============================================================
  // Border Radius (elliptical + squircle exponent)
  // Each corner = 20 bytes:
  //   x_type (4), x_value (4), y_type (4), y_value (4), exponent (4)
  // ============================================================
  
  // ----------------------------
  // Top-left corner (20 bytes)
  // ----------------------------
  static let BORDER_RADIUS_TOP_LEFT_X_TYPE = 380
  static let BORDER_RADIUS_TOP_LEFT_X_VALUE = 384
  static let BORDER_RADIUS_TOP_LEFT_Y_TYPE = 388
  static let BORDER_RADIUS_TOP_LEFT_Y_VALUE = 392
  static let BORDER_RADIUS_TOP_LEFT_EXPONENT = 396
  
  // ----------------------------
  // Top-right corner
  // ----------------------------
  static let BORDER_RADIUS_TOP_RIGHT_X_TYPE = 400
  static let BORDER_RADIUS_TOP_RIGHT_X_VALUE = 404
  static let BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 408
  static let BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 412
  static let BORDER_RADIUS_TOP_RIGHT_EXPONENT = 416
  
  // ----------------------------
  // Bottom-right corner
  // ----------------------------
  static let BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 420
  static let BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 424
  static let BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 428
  static let BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 432
  static let BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 436
  
  // ----------------------------
  // Bottom-left corner
  // ----------------------------
  static let BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 440
  static let BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 444
  static let BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 448
  static let BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 452
  static let BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 456
  
  // ----------------------------
  // Float
  // ----------------------------
  static let FLOAT = 460
  static let CLEAR = 464
  
  static let OBJECT_FIT = 468
  
  static let FONT_METRICS_ASCENT_OFFSET = 472
  static let FONT_METRICS_DESCENT_OFFSET = 476
  static let FONT_METRICS_X_HEIGHT_OFFSET = 480
  static let FONT_METRICS_LEADING_OFFSET = 484
  static let FONT_METRICS_CAP_HEIGHT_OFFSET = 488
  static let VERTICAL_ALIGN_OFFSET_OFFSET = 492
  static let VERTICAL_ALIGN_IS_PERCENT_OFFSET = 496
  static let VERTICAL_ALIGN_ENUM_OFFSET = 500
  static let FIRST_BASELINE_OFFSET = 504
  static let Z_INDEX = 508
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
  static let align       = StateKeys(rawValue: 1 << 29)
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
  static let borderStyle = StateKeys(rawValue: 1 << 40)
  static let borderRadius = StateKeys(rawValue: 1 << 41)
  static let borderColor = StateKeys(rawValue: 1 << 42)
  static let float = StateKeys(rawValue: 1 << 43)
  static let clear = StateKeys(rawValue: 1 << 44)
  static let objectFit = StateKeys(rawValue: 1 << 45)
  static let zIndex = StateKeys(rawValue: 1 << 46)
}


// MARK: - Constants & Enums
struct TextStyleKeys {
  static let COLOR = 0
  static let COLOR_STATE = 4                    // 0 = inherit, 1 = set
  static let SIZE = 8
  static let SIZE_TYPE = 12
  static let SIZE_STATE = 13
  static let FONT_WEIGHT = 16
  static let FONT_WEIGHT_STATE = 20
  static let FONT_STYLE_SLANT = 24
  static let FONT_STYLE_TYPE = 28               // shifted +4 from 24
  static let FONT_STYLE_STATE = 29
  static let FONT_FAMILY_STATE = 30
  static let FONT_RESOLVED_DIRTY = 31           // single-byte flag
  static let BACKGROUND_COLOR = 32
  static let BACKGROUND_COLOR_STATE = 36
  static let DECORATION_LINE = 40
  static let DECORATION_LINE_STATE = 44
  static let DECORATION_COLOR = 48
  static let DECORATION_COLOR_STATE = 52
  static let DECORATION_STYLE = 56
  static let DECORATION_STYLE_STATE = 60
  static let LETTER_SPACING = 64
  static let LETTER_SPACING_STATE = 68
  static let TEXT_WRAP = 72
  static let TEXT_WRAP_STATE = 76
  static let WHITE_SPACE = 80
  static let WHITE_SPACE_STATE = 84
  static let TRANSFORM = 88
  static let TRANSFORM_STATE = 92
  static let TEXT_ALIGN = 96
  static let TEXT_ALIGN_STATE = 100
  static let TEXT_JUSTIFY = 104
  static let TEXT_JUSTIFY_STATE = 108
  static let TEXT_INDENT = 112
  static let TEXT_INDENT_STATE = 116
  static let TEXT_OVERFLOW = 120
  static let TEXT_OVERFLOW_STATE = 124
  static let LINE_HEIGHT = 128
  static let LINE_HEIGHT_TYPE = 132
  static let LINE_HEIGHT_STATE = 133
  static let VERTICAL_ALIGN_TYPE = 134
  static let VERTICAL_ALIGN = 135
  static let TEXT_SHADOW_STATE = 136
}

internal struct TextStyleChangeMasks: OptionSet {
  let rawValue: Int64
  
  init(rawValue: Int64) {
    self.rawValue = rawValue
  }
  
  init() {
    self.rawValue = 0
  }
  
  static let none = TextStyleChangeMasks()
  static let color = TextStyleChangeMasks(rawValue: 1 << 0)
  static let decorationLine = TextStyleChangeMasks(rawValue: 1 << 1)
  static let decorationColor = TextStyleChangeMasks(rawValue: 1 << 2)
  static let textAlign   = TextStyleChangeMasks(rawValue: 1 << 3)
  static let textJustify = TextStyleChangeMasks(rawValue: 1 << 4)
  static let backgroundColor = TextStyleChangeMasks(rawValue: 1 << 5)
  static let fontSize = TextStyleChangeMasks(rawValue: 1 << 6)
  static let textTransform = TextStyleChangeMasks(rawValue: 1 << 7)
  static let fontStyle = TextStyleChangeMasks(rawValue: 1 << 8)
  static let fontStyleSlant = TextStyleChangeMasks(rawValue: 1 << 9)
  static let textWrap = TextStyleChangeMasks(rawValue: 1 << 10)
  static let textOverflow = TextStyleChangeMasks(rawValue: 1 << 11)
  static let decorationStyle = TextStyleChangeMasks(rawValue: 1 << 12)
  static let whiteSpace = TextStyleChangeMasks(rawValue: 1 << 13)
  static let fontWeight = TextStyleChangeMasks(rawValue: 1 << 14)
  static let lineHeight = TextStyleChangeMasks(rawValue: 1 << 15)
  static let verticalAlign   = TextStyleChangeMasks(rawValue: 1 << 16)
  static let decorationThinkness = TextStyleChangeMasks(rawValue: 1 << 17)
  static let textShadow = TextStyleChangeMasks(rawValue: 1 << 18)
  static let fontFamily = TextStyleChangeMasks(rawValue: 1 << 19)
  static let letterSpacing = TextStyleChangeMasks(rawValue: 1 << 20)
  static let all = TextStyleChangeMasks(rawValue: -1)
}

protocol StyleChangeListener{
  func onTextStyleChanged(change: Int64)
}

internal struct StyleState {
  static let INHERIT: UInt8 = 0
  static let SET: UInt8 = 1
  static let INITIAL: UInt8 = 2
}


internal struct GridState {
  var gridArea: String? = nil
  var gridTemplateAreas: String? = nil
  var gridAutoRows: String? = nil
  var gridAutoColumns: String? = nil
  var gridRow: String? = nil
  var gridRowStart: String? = nil
  var gridRowEnd: String? = nil
  var gridColumn: String? = nil
  var gridColumnStart: String? = nil
  var gridColumnEnd: String? = nil
  var gridTemplateRows: String? = nil
  var gridTemplateColumns: String? = nil
  
  mutating func clear() {
    gridArea = nil
    gridTemplateAreas = nil
    gridAutoRows = nil
    gridAutoColumns = nil
    gridRow = nil
    gridRowStart = nil
    gridRowEnd = nil
    gridColumn = nil
    gridColumnStart = nil
    gridColumnEnd = nil
    gridTemplateRows = nil
    gridTemplateColumns = nil
  }
}

struct FontMetrics {
  /// Distance from baseline to top of tallest glyph (positive value)
  let ascent: Float
  /// Distance from baseline to bottom of lowest glyph (positive value)
  let descent: Float
  /// Height of lowercase 'x' (used for middle alignment)
  let x_height: Float
  /// Leading (extra space between lines)
  let leading: Float
  /// Cap height (height of capital letters)
  let cap_height: Float
}

@objc(MasonStyle)
@objcMembers
public class MasonStyle: NSObject {
  public internal(set) var font: NSCFontFace!
  internal var fontMetrics: FontMetrics {
    get {
      return FontMetrics(ascent:  getFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET), descent:  getFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET), x_height: getFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET), leading: getFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET), cap_height: getFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET))
    }
    
    set {
      setFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, newValue.ascent)
      setFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, newValue.descent)
      setFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, newValue.x_height)
      setFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, newValue.leading)
      setFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, newValue.cap_height)
    }
  }
  
  internal func syncFontMetrics(){
    guard let font = font.uiFont else {return}
    
    // UIFont properties:
    // - ascender: positive value, distance from baseline to top
    // - descender: negative value, distance from baseline to bottom
    // - lineHeight: total recommended line height
    // - xHeight: height of lowercase 'x'
    // - capHeight: height of capital letters
    // - leading: extra spacing between lines (usually small or 0)
    
    let scale = NSCMason.scale
    let ascent = Float(font.ascender) * scale
    let descent = Float(-font.descender) * scale  // Make it positive
    let lineHeight = Float(font.lineHeight) * scale
    let xHeight = Float(font.xHeight) * scale
    let capHeight = Float(font.capHeight) * scale
    let leading = Float(font.leading) * scale
    
    
    setFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, ascent)
    setFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, descent)
    setFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, xHeight)
    setFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, leading)
    setFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, capHeight)
    
    
    
  }
  
  
  private var gridState = GridState()
  
  // Weight tracking
  internal var weight = UIFont.Weight.regular
  private var weightName = "normal"
  
  
  internal var isDirty: Int64 = -1
  internal var isTextDirty:Int64 = -1
  internal var isSlowDirty = false {
    didSet {
      if (!inBatch) {
        updateTextStyle()
        updateNativeStyle()
      }
    }
  }
  let node: MasonNode
  var inBatch = false {
    didSet {
      if (!inBatch) {
        updateTextStyle()
        updateNativeStyle()
      }
    }
  }
  
  internal var isValueInitialized: Bool  = false
  internal var isTextValueInitialized: Bool = false
  
  private var styleChangeListener: StyleChangeListener? = nil
  
  internal func setStyleChangeListener(listener: StyleChangeListener?) {
    styleChangeListener = listener
  }
  
  
  internal func notifyTextStyleChanged(_ change: Int64) {
    styleChangeListener?.onTextStyleChanged(change: change)
  }
  
  
  public lazy var values: NSMutableData = {
    if(node.isPlaceholder){
      // use the same capacity set in rust
      let buffer = NSMutableData(length: 508)
      
      
      setFloat(StyleKeys.ASPECT_RATIO, Float.nan, buffer: buffer)
      // default shrink to 1
      setFloat(StyleKeys.FLEX_SHRINK, 1, buffer: buffer)
      
      setFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, 1, buffer: buffer)
      setFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, 1, buffer: buffer)
      setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, 1, buffer: buffer)
      setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, 1, buffer: buffer)
      
      
      // Default font metrics
      
      setFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, 14, buffer: buffer)
      setFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, 4, buffer: buffer)
      setFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, 7, buffer: buffer)
      setFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, 0, buffer: buffer)
      setFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, 10, buffer: buffer)
      
      setFloat(StyleKeys.FIRST_BASELINE_OFFSET, Float.nan, buffer: buffer)
      
      
      
      
      setInt32(StyleKeys.OBJECT_FIT, ObjectFit.Fill.rawValue, buffer: buffer)
      setInt32(StyleKeys.DISPLAY, Display.Block.rawValue, buffer: buffer)
      
      // default Normal -> -1
      setInt32(StyleKeys.ALIGN_ITEMS, -1, buffer: buffer)
      setInt32(StyleKeys.ALIGN_SELF, -1, buffer: buffer)
      setInt32(StyleKeys.ALIGN_CONTENT, -1, buffer: buffer)
      
      setInt32(StyleKeys.JUSTIFY_ITEMS, -1, buffer: buffer)
      setInt32(StyleKeys.JUSTIFY_SELF, -1, buffer: buffer)
      setInt32(StyleKeys.JUSTIFY_CONTENT, -1, buffer: buffer)
      
      setInt32(StyleKeys.MARGIN_LEFT_TYPE, 1, buffer: buffer)
      setInt32(StyleKeys.MARGIN_TOP_TYPE, 1, buffer: buffer)
      setInt32(StyleKeys.MARGIN_RIGHT_TYPE, 1, buffer: buffer)
      setInt32(StyleKeys.MARGIN_BOTTOM_TYPE, 1, buffer: buffer)
      
      //          setInt32(StyleKeys.PADDING_LEFT_TYPE, 0, buffer: buffer)
      //          setInt32(StyleKeys.PADDING_TOP_TYPE, 0, buffer: buffer)
      //          setInt32(StyleKeys.PADDING_RIGHT_TYPE, 0, buffer: buffer)
      //          setInt32(StyleKeys.PADDING_BOTTOM_TYPE, 0, buffer: buffer)
      
      
      //          setInt32(StyleKeys.BORDER_LEFT_TYPE, 0, buffer: buffer)
      //          setInt32(StyleKeys.BORDER_TOP_TYPE, 0, buffer: buffer)
      //          setInt32(StyleKeys.BORDER_RIGHT_TYPE, 0, buffer: buffer)
      //          setInt32(StyleKeys.BORDER_BOTTOM_TYPE, 0, buffer: buffer)
      
      
      
      guard let buffer else {
        // todo
        fatalError("Could not allocate style buffer")
      }
      
      isValueInitialized = true
      return buffer
      
    }
    let buffer = mason_style_get_style_buffer_apple(node.mason.nativePtr, node.nativePtr)
    guard let buffer else {
      // todo
      fatalError("Could not allocate style buffer")
    }
    
    isValueInitialized = true
    
    return Unmanaged<NSMutableData>.fromOpaque(buffer).takeRetainedValue()
  }()
  
  public lazy var textValues: NSMutableData = {
    let buffer = NSMutableData(length: 144)
    guard let buffer else {
      // todo
      fatalError("Could not allocate style buffer")
    }
    
    // Initialize all values with INHERIT state
    setUInt32(TextStyleKeys.COLOR, 0xFF000000, text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.COLOR_STATE, StyleState.INHERIT, text: true,  buffer: buffer)
    
    setInt32(TextStyleKeys.SIZE, Constants.DEFAULT_FONT_SIZE, text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.SIZE_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    setInt32(TextStyleKeys.FONT_WEIGHT, Int32(NSCFontWeight.normal.rawValue) ,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.FONT_WEIGHT_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    
    setInt32(TextStyleKeys.FONT_STYLE_TYPE, 0,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.FONT_STYLE_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.FONT_FAMILY_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    setUInt32(TextStyleKeys.BACKGROUND_COLOR, 0 ,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.INITIAL,text: true,  buffer: buffer)
    
    setUInt32(TextStyleKeys.DECORATION_COLOR, Constants.UNSET_COLOR,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.DECORATION_COLOR_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    setUInt8(TextStyleKeys.DECORATION_LINE_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.DECORATION_STYLE_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    setFloat(TextStyleKeys.LETTER_SPACING, 0,text: true, buffer: buffer)
    setUInt8(TextStyleKeys.LETTER_SPACING_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    setUInt8(TextStyleKeys.TEXT_WRAP_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.WHITE_SPACE_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.TRANSFORM_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    setInt32(TextStyleKeys.TEXT_ALIGN, TextAlign.Start.rawValue,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.TEXT_ALIGN_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    setInt32(TextStyleKeys.TEXT_JUSTIFY, TextJustify.None.rawValue,text: true,  buffer: buffer)
    setUInt8(TextStyleKeys.TEXT_JUSTIFY_STATE, StyleState.INHERIT,text: true,  buffer: buffer)
    
    
    isTextValueInitialized = true
    
    return buffer
  }()
  
  
  
  public init(node: MasonNode) {
    self.node = node
    super.init()
    font =  NSCFontFace(family: "serif",owner: self)
    mBackground = Background(style: self)
  }
  
  internal func invalidateStyle(_ state: Int64) {
    if state <= -1 {
      return
    }
    
    if (isDirty != -1) {
      (node.view as? MasonElement)?.invalidateLayout()
    }
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
  
  private func setOrAppendState(_ value: TextStyleChangeMasks) {
    if isTextDirty == -1 {
      isTextDirty = Int64(value.rawValue)
    } else {
      isTextDirty |= Int64(value.rawValue)
    }
    if (!inBatch) {
      updateTextStyle()
    }
  }
  
  internal func updateTextStyle() {
    if (node.nativePtr == nil) {
      return
    }
    
    if (isTextDirty > -1) {
      var invalidate = false
      let value = TextStyleChangeMasks(rawValue: isTextDirty)
      let colorDirty = value.contains(.color)
      let sizeDirty = value.contains(.fontSize)
      let weightDirty = value.contains(.fontWeight)
      let styleDirty = value.contains(.fontStyle)
      if (value.contains(.textTransform) || value.contains(.textWrap) || value.contains(.whiteSpace) || value.contains(.textOverflow) || colorDirty || value.contains(.backgroundColor) || value.contains(.decorationColor) || value.contains(.decorationLine) || sizeDirty || weightDirty || styleDirty || value.contains(.letterSpacing) || value.contains(.lineHeight)
      ) {
        invalidate = true
      }
      
      var state: TextStyleChangeMasks = .none
      
      if (styleDirty) {
        state = state.union(.fontStyle)
      }
      
      if (weightDirty) {
        state = state.union(.fontWeight)
      }
      
      if (sizeDirty) {
        state = state.union(.fontSize)
      }
      
      if (colorDirty) {
        state = state.union(.color)
      }
      
      if (state != .none) {
        notifyTextStyleChanged(state.rawValue)
      }
      
      isTextDirty = -1
      
      // todo validate behaviour
      if (invalidate && isDirty == -1) {
        (node.view as? MasonElement)?.invalidateLayout()
      }
      return
    }
  }
  
  
  internal func getUInt8(_ index: Int, text: Bool = false) -> UInt8 {
    if(text){
      return textValues.bytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee
    }
    return values.bytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee
  }
  
  internal func setUInt8(_ index: Int, _ value: UInt8, text: Bool = false, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
      return
    }
    if(text){
      textValues.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
  }
  
  
  internal func getInt16(_ index: Int, text: Bool = false) -> Int16 {
    if(text){
      return textValues.bytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee
    }
    return values.bytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee
  }
  
  private func setInt16(_ index: Int, _ value: Int16, text: Bool = false) {
    if(text){
      textValues.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee = value
  }
  
  
  internal func getUInt32(_ index: Int, text: Bool = false) -> UInt32 {
    if(text){
      return textValues.bytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee
    }
    return values.bytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee
  }
  
  internal func setUInt32(_ index: Int, _ value: UInt32, text: Bool = false, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
      return
    }
    if(text){
      textValues.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
  }
  
  internal func getInt32(_ index: Int, text: Bool = false) -> Int32 {
    if(text){
      return textValues.bytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee
    }
    return values.bytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee
  }
  
  internal func setInt32(_ index: Int, _ value: Int32, text: Bool = false, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
      return
    }
    
    if(text){
      textValues.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
  }
  
  internal func getFloat(_ index: Int, text: Bool = false) -> Float {
    if(text){
      return textValues.bytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee
    }
    return values.bytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee
  }
  
  internal func setFloat(_ index: Int, _ value: Float, text: Bool = false, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
      return
    }
    
    if(text){
      textValues.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
  }
  
  private func updateIntField(offset: Int, value: Int32, state: StateKeys){
    setInt32(offset, value)
    setOrAppendState(state)
  }
  
  private func updateFloatField(offset: Int, value: Float, state: StateKeys){
    setFloat(offset, value)
    setOrAppendState(state)
  }
  
  
  // Mark: - resetAllBorders
  
  internal func resetAllBorders(){
    mBorderRender.resetAllBorders()
  }
  
  
  // MARK: - zIndex
  
  public var zIndex: Int32 {
    get {
      return getInt32(StyleKeys.Z_INDEX)
    }
    set {
      setInt32(StyleKeys.Z_INDEX, newValue)
      setOrAppendState(.zIndex)
    }
  }
  
  
  // MARK: - VerticalAlign
  public var verticalAlign: MasonVerticalAlignValue {
    get {
      return MasonVerticalAlignValue(style: self)
    }
    set {
      setFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, newValue.offset)
      setUInt8(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, UInt8(newValue.align.rawValue))
      
      if(newValue.isPercent){
        setUInt8(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 1)
      }else {
        setUInt8(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0)
      }
      
      notifyTextStyleChanged(TextStyleChangeMasks.verticalAlign.rawValue)
    }
  }
  
  
  // MARK: - ObjectFit
  public var objectFit: ObjectFit {
    get {
      return ObjectFit(rawValue: getInt32(StyleKeys.OBJECT_FIT))!
    }
    set {
      setInt32(StyleKeys.OBJECT_FIT, newValue.rawValue)
      setOrAppendState(.objectFit)
    }
  }
  
  
  // MARK: - Float
  public var float: MasonFloat {
    get {
      return MasonFloat(rawValue: getInt32(StyleKeys.FLOAT))!
    }
    set {
      setInt32(StyleKeys.FLOAT, newValue.rawValue)
      setOrAppendState(.float)
    }
  }
  
  
  public var clear: Clear {
    get {
      return Clear(rawValue: getInt32(StyleKeys.CLEAR))!
    }
    set {
      setInt32(StyleKeys.CLEAR, newValue.rawValue)
      setOrAppendState(.clear)
    }
  }
  
  
  // MARK: - Text Style Properties
  public var color: UInt32 {
    get {
      return getUInt32(TextStyleKeys.COLOR, text: true)
    }
    set {
      setUInt32(TextStyleKeys.COLOR, newValue, text: true)
      setUInt8(TextStyleKeys.COLOR_STATE, StyleState.SET, text: true)
      if(inBatch){
        setOrAppendState(TextStyleChangeMasks.color)
      }else {
        notifyTextStyleChanged(TextStyleChangeMasks.color.rawValue)
      }
    }
  }
  
  public func setColor(ui color: UIColor) {
    self.color = color.toUInt32()
  }
  
  public func setColor(css color: String) {
    guard let color = UIColor(css: color) else {return}
    self.color = color.toUInt32()
  }
  
  
  lazy var mFilter: CSSFilters.CSSFilter = {
    CSSFilters.CSSFilter()
  }()
  
  public var filter: String = "" {
    didSet {
      if(filter.isEmpty && !mFilter.filters.isEmpty){
        mFilter.reset()
        return
      }
      
      mFilter.parse(css: filter)
      
      if(!mFilter.filters.isEmpty){
        if let view = node.view {
          mFilter.apply(to: view)
        }
      }
    }
  }
  
  
  internal var mBackground: Background!
  public var background: String  {
    set {
      mBackground.parseBackground(newValue)
    }
    get {
      return mBackground.css
    }
  }
  
  
  public var backgroundImage: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-image", value: newValue)
    }
    get {
      if(mBackground.layers.isEmpty){
        return ""
      }
      let img = mBackground.layers.map { layer in
        layer.image ?? ""
      }.joined(separator: ",")
      
      if(!img.isEmpty){
        return img + ";"
      }
      
      return ""
    }
  }
  
  public var backgroundRepeat: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-repeat", value: newValue)
    }
    get {
      return ""
    }
  }
  
  
  public var backgroundPosition: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-position", value: newValue)
    }
    get {
      return ""
    }
  }
  
  
  public var backgroundSize: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-size", value: newValue)
    }
    get {
      return ""
    }
  }
  
  
  
  public var backgroundClip: String {
    set {
      mBackground.applyBackgroundProperty(name: "background-clip", value: newValue)
    }
    get {
      return ""
    }
  }
  
  
  public var backgroundColor: UInt32 {
    get {
      return getUInt32(TextStyleKeys.BACKGROUND_COLOR, text: true)
    }
    set {
      setUInt32(TextStyleKeys.BACKGROUND_COLOR, newValue, text: true)
      setUInt8(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET, text: true)
      // change view as well ??
      //      node.view?.backgroundColor = UIColor.colorFromARGB(newValue)
      notifyTextStyleChanged(TextStyleChangeMasks.backgroundColor.rawValue)
    }
  }
  
  public func getBackgroundColor() -> String {
    if(getUInt8(TextStyleKeys.BACKGROUND_COLOR_STATE, text: true) != StyleState.SET){
      return ""
    }
    return backgroundColor.rgbaToHexCSS()
  }
  
  public func setBackgroundColor(string color: String) {
    guard let color = parseColor(color) else {return}
    mBackground.color = color
  }
  
  public func setBackgroundColor(ui color: UIColor) {
    backgroundColor = color.toUInt32()
  }
  
  
  public func setLineHeight(_ value: Float, _ isRelative: Bool){
    setFloat(TextStyleKeys.LINE_HEIGHT, value, text: true)
    setUInt8(TextStyleKeys.LINE_HEIGHT_STATE, StyleState.SET, text: true)
    if(!isRelative){
      setUInt8(TextStyleKeys.LINE_HEIGHT_TYPE, 1 ,text: true)
    }else {
      setUInt8(TextStyleKeys.LINE_HEIGHT_TYPE, 0 ,text: true)
    }
    notifyTextStyleChanged(TextStyleChangeMasks.lineHeight.rawValue)
  }
  
  
  public var lineHeight: Float {
    get {
      return getFloat(TextStyleKeys.LINE_HEIGHT, text: true)
    }
    set {
      setFloat(TextStyleKeys.LINE_HEIGHT, newValue, text: true)
      setUInt8(TextStyleKeys.LINE_HEIGHT_STATE, StyleState.SET, text: true)
      setUInt8(TextStyleKeys.LINE_HEIGHT_TYPE, 0 ,text: true)
      notifyTextStyleChanged(TextStyleChangeMasks.lineHeight.rawValue)
    }
  }
  
  public var letterSpacing: Float {
    get {
      return getFloat(TextStyleKeys.LETTER_SPACING, text: true)
    }
    set {
      setFloat(TextStyleKeys.LETTER_SPACING, newValue, text: true)
      setUInt8(TextStyleKeys.LETTER_SPACING_STATE, StyleState.SET, text: true)
      notifyTextStyleChanged(TextStyleChangeMasks.letterSpacing.rawValue)
    }
  }
  
  
  public var decorationColor: UInt32 {
    get {
      return getUInt32(TextStyleKeys.DECORATION_COLOR, text: true)
    }
    set {
      setUInt32(TextStyleKeys.DECORATION_COLOR, newValue, text: true)
      setUInt8(TextStyleKeys.DECORATION_COLOR_STATE, StyleState.SET, text: true)
      notifyTextStyleChanged(TextStyleChangeMasks.decorationColor.rawValue)
    }
  }
  
  public func setDecorationColor(ui color: UIColor) {
    decorationColor = color.toUInt32()
  }
  
  
  public var decorationLine: DecorationLine {
    get {
      return DecorationLine(rawValue: getInt32(TextStyleKeys.DECORATION_LINE, text: true))!
    }
    set {
      setInt32(TextStyleKeys.DECORATION_LINE, newValue.rawValue, text: true)
      setUInt8(TextStyleKeys.DECORATION_LINE_STATE, StyleState.SET, text: true)
      notifyTextStyleChanged(TextStyleChangeMasks.decorationLine.rawValue)
    }
  }
  
  public var fontSize: Int32 {
    get {
      return getInt32(TextStyleKeys.SIZE, text: true)
    }
    set {
      setInt32(TextStyleKeys.SIZE, newValue, text: true)
      setUInt8(TextStyleKeys.SIZE_TYPE, 0, text: true)
      setUInt8(TextStyleKeys.SIZE_STATE, StyleState.SET, text: true)
      notifyTextStyleChanged(TextStyleChangeMasks.fontSize.rawValue)
    }
  }
  
  public func setFontStyle(_ style: FontStyle, _ slant: Int32){
    // slant ignored unless it's oblique
    
    let previous = fontStyle
    if(previous != style){
      
      setInt32(TextStyleKeys.FONT_STYLE_TYPE, style.rawValue, text: true)
      setUInt8(TextStyleKeys.FONT_STYLE_STATE, StyleState.SET, text: true)
      
      switch style {
      case .Normal:
        font.style = "normal"
        setInt32(TextStyleKeys.FONT_STYLE_SLANT, 0, text: true)
        break
      case .Italic:
        font.style = "italic"
        setInt32(TextStyleKeys.FONT_STYLE_SLANT, 0, text: true)
        break
      case .Oblique:
        font.style = "oblique"
        setInt32(TextStyleKeys.FONT_STYLE_SLANT, slant, text: true)
        break
      }
      
      notifyTextStyleChanged(TextStyleChangeMasks.fontStyle.rawValue)
    }
  }
  
  public var textJustify: TextJustify {
    get {
      return TextJustify(rawValue: getInt32(TextStyleKeys.TEXT_JUSTIFY, text: true))!
    }
    set {
      let previous = textJustify
      if(previous != newValue){
        
        setInt32(TextStyleKeys.TEXT_JUSTIFY, newValue.rawValue, text: true)
        setUInt8(TextStyleKeys.TEXT_JUSTIFY_STATE, StyleState.SET, text: true)
        
        notifyTextStyleChanged(TextStyleChangeMasks.textJustify.rawValue)
      }
    }
  }
  
  internal var internalFontStyle: NSCFontStyle {
    let type = getInt32(TextStyleKeys.FONT_STYLE_TYPE, text: true)
    switch(type){
    case 0:
      return NSCFontStyle.normal
    case 1:
      return NSCFontStyle.italic
    case 2:
      let slant = getInt32(TextStyleKeys.FONT_STYLE_SLANT, text: true)
      if(slant > 0){
        return NSCFontStyle.oblique(Int(slant))
      }else {
        return NSCFontStyle.oblique(nil)
      }
    default:
      // todo handle invalid cases
      return font.fontDescriptors.styleValue
    }
  }
  
  
  public var fontStyle: FontStyle {
    get {
      switch(getInt32(TextStyleKeys.FONT_STYLE_TYPE, text: true)){
      case 0:
        return .Normal
      case 1:
        return .Italic
      case 2:
        return .Oblique
      default:
        break
      }
      
      // Invalid font style
      switch(font.fontDescriptors.styleValue){
      case .normal:
        return .Normal
      case .italic:
        return .Italic
      case .oblique(_):
        return .Oblique
      }
      
    }
    set {
      let previous = fontStyle
      if(previous != newValue){
        setInt32(TextStyleKeys.FONT_STYLE_TYPE, newValue.rawValue, text: true)
        setUInt8(TextStyleKeys.FONT_STYLE_STATE, StyleState.SET, text: true)
        // reset to slant 0
        setInt32(TextStyleKeys.FONT_STYLE_SLANT, 0, text: true)
        
        switch newValue {
        case .Normal:
          font.style = "normal"
          break
        case .Italic:
          font.style = "italic"
          break
        case .Oblique:
          font.style = "oblique"
          break
        }
        notifyTextStyleChanged(TextStyleChangeMasks.fontStyle.rawValue)
      }
    }
  }
  
  internal func toFontWeight(weight: Int) -> (String, UIFont.Weight, NSCFontWeight) {
    if weight >= 100 && weight <= 1000 {
      switch weight {
      case 100..<200:
        return ("thin", .thin, .thin)
      case 200..<300:
        return ("extraLight", .ultraLight, .extraLight)
      case 300..<400:
        return ("light", .light, .light)
      case 400..<500:
        return ("normal", .regular, .normal)
      case 500..<600:
        return ("medium", .medium, .medium)
      case 600..<700:
        return ("semiBold", .semibold, .semiBold)
      case 700..<800:
        return ("bold", .bold, .bold)
      case 800..<900:
        return ("extraBold", .heavy, .extraBold)
      case 900..<1000:
        return ("black", .black, .black)
      default:
        break
      }
    }
    return ("thin", .thin, .thin)
  }
  
  internal func setFontWeight(_ weight: Int,_ name: String?){
    var newWeight: NSCFontWeight? = nil
    if weight >= 100 && weight <= 1000 {
      var newWeightName: String? = name
      switch weight {
      case 100..<200:
        self.weight = .thin
        newWeight = .thin
        newWeightName = "100"
      case 200..<300:
        self.weight = .ultraLight
        newWeight = .extraLight
        newWeightName = "200"
      case 300..<400:
        self.weight = .light
        newWeight = .light
        newWeightName = "300"
      case 400..<500:
        self.weight = .regular
        newWeight = .normal
        newWeightName = "400"
      case 500..<600:
        self.weight = .medium
        newWeight = .medium
        newWeightName = "500"
      case 600..<700:
        self.weight = .semibold
        newWeight = .semiBold
        newWeightName = "600"
      case 700..<800:
        self.weight = .bold
        newWeight = .bold
        newWeightName = "700"
      case 800..<900:
        self.weight = .heavy
        font.weight = .extraBold
        newWeightName = "800"
      case 900..<1000:
        self.weight = .black
        font.weight = .black
        newWeightName = "900"
      default:
        break
      }
      if let name = newWeightName {
        weightName = name
      }
      
      if let newWeight = newWeight {
        node.style.setInt32(TextStyleKeys.FONT_WEIGHT, Int32(newWeight.rawValue) ,text: true)
        setUInt8(TextStyleKeys.FONT_WEIGHT_STATE, StyleState.SET, text: true)
        font.weight = newWeight
      }
    }
  }
  
  public var fontFamily: String {
    get {
      return font.fontFamily
    }
    set {
      let oldFamily = font.fontFamily
      if (oldFamily != newValue) {
        guard let oldFont = font else {return}
        // Create new font with updated family
        font = NSCFontFace(family: newValue)
        font.weight = oldFont.weight
        font.style = oldFont.style
        font.fontDescriptors.display = oldFont.fontDescriptors.display
        
        font.loadSync { _ in }
        
        syncFontMetrics()
        
        setUInt8(TextStyleKeys.FONT_FAMILY_STATE, StyleState.SET, text: true)
        notifyTextStyleChanged(TextStyleChangeMasks.fontFamily.rawValue)
      }
    }
  }
  
  public var fontWeight: String {
    get {
      return weightName
    }
    set {
      let previous = weightName
      switch newValue {
      case "thin":
        weight = .thin
        weightName = "thin"
        font.weight = .thin
      case "ultralight":
        weight = .ultraLight
        weightName = "ultralight"
        font.weight = .extraLight
      case "light":
        weight = .light
        weightName = "light"
        font.weight = .light
      case "normal":
        weight = .regular
        weightName = "normal"
        font.weight = .normal
      case "medium":
        weight = .medium
        weightName = "medium"
        font.weight = .medium
      case "semibold":
        weight = .semibold
        weightName = "semibold"
        font.weight = .semiBold
      case "bold":
        weight = .bold
        weightName = "bold"
        font.weight = .bold
      case "heavy":
        weight = .heavy
        weightName = "heavy"
        font.weight = .extraBold
      case "black":
        weight = .black
        weightName = "black"
        font.weight = .black
      default:
        if let weight = Int(newValue, radix: 10) {
          setFontWeight(weight, nil)
        }
      }
      if previous != weightName {
        setInt32(TextStyleKeys.FONT_WEIGHT, Int32(font.weight.rawValue), text: true)
        setUInt8(TextStyleKeys.FONT_WEIGHT_STATE, StyleState.SET, text: true)
        notifyTextStyleChanged(TextStyleChangeMasks.fontWeight.rawValue)
      }
    }
  }
  
  
  
  // Text overflow
  public var textOverflow: TextOverflow = .Clip {
    didSet {
      setInt32(TextStyleKeys.TEXT_OVERFLOW, textOverflow.rawValue, text: true)
      setUInt8(TextStyleKeys.TEXT_OVERFLOW_STATE, StyleState.SET, text: true)
      // Text overflow only affects rendering, not measurement
      notifyTextStyleChanged(TextStyleChangeMasks.textOverflow.rawValue)
    }
  }
  
  public func setTextOverflow(_ flow: TextOverflow, _ value: String){}
  
  public var textOverflowCompat: TextOverflowCompat {
    get {
      return TextOverflowCompat(flow: textOverflow)
    }
    set {
      textOverflow = newValue.flow
    }
  }
  
  public var textTransform: TextTransform {
    get {
      return TextTransform(rawValue: getInt32(TextStyleKeys.TRANSFORM, text: true))!
    }
    set {
      setInt32(TextStyleKeys.TRANSFORM, newValue.rawValue, text: true)
      setUInt8(TextStyleKeys.TRANSFORM_STATE, StyleState.SET, text: true)
      notifyTextStyleChanged(TextStyleChangeMasks.textTransform.rawValue)
    }
  }
  
  public var whiteSpace: WhiteSpace {
    get {
      return WhiteSpace(rawValue: getInt32(TextStyleKeys.WHITE_SPACE, text: true))!
    }
    set {
      setInt32(TextStyleKeys.WHITE_SPACE, newValue.rawValue, text: true)
      setUInt8(TextStyleKeys.WHITE_SPACE_STATE, StyleState.SET, text: true)
      notifyTextStyleChanged(TextStyleChangeMasks.whiteSpace.rawValue)
    }
  }
  
  public var textWrap: TextWrap {
    get {
      return TextWrap(rawValue: getInt32(TextStyleKeys.TEXT_WRAP, text: true))!
    }
    set {
      setInt32(TextStyleKeys.TEXT_WRAP, newValue.rawValue, text: true)
      setUInt8(TextStyleKeys.TEXT_WRAP_STATE, StyleState.SET, text: true)
      notifyTextStyleChanged(TextStyleChangeMasks.textWrap.rawValue)
    }
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
      
      type = getInt32(Int(StyleKeys.INSET_RIGHT_TYPE))
      value = getFloat(Int(StyleKeys.INSET_RIGHT_VALUE))
      
      let right = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      type = getInt32(Int(StyleKeys.INSET_TOP_TYPE))
      value = getFloat(Int(StyleKeys.INSET_TOP_VALUE))
      
      let top = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      type = getInt32(Int(StyleKeys.INSET_BOTTOM_TYPE))
      value = getFloat(Int(StyleKeys.INSET_BOTTOM_VALUE))
      
      let bottom = MasonLengthPercentageAuto.fromValueType(value, Int(type))!
      
      
      return MasonRect(top, right, bottom, left)
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
      
      return MasonRect(top, right, bottom, left)
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
      
      
      return MasonRect(top, right, bottom, left)
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
  
  internal var textShadows: [TextShadow] = []
  public var textShadow: String = "" {
    didSet {
      textShadows = ShadowParser.parseTextShadow(style: self, value: textShadow)
      
      if(textShadows.isEmpty){
        setUInt8(TextStyleKeys.TEXT_SHADOW_STATE, StyleState.INHERIT, text: true)
      }else {
        setUInt8(TextStyleKeys.TEXT_SHADOW_STATE, StyleState.SET, text: true)
      }
      
      notifyTextStyleChanged(TextStyleChangeMasks.textShadow.rawValue)
    }
  }
  
  internal lazy var mBorderRender: CSSBorderRenderer  = {
    CSSBorderRenderer(style: self)
  }()
  
  
  public var borderRadius: String {
    get {
      // todo
      return ""
    }
    set {
      CSSBorderRenderer.parseBorderRadius(self, newValue)
    }
  }
  
  public var border: String {
    get {
      return mBorderRender.css
    }
    set {
      mBorderRender.parseBorderShorthand(newValue)
    }
  }
  
  
  internal var mBorderLeft: CSSBorderRenderer.BorderSide {
    return mBorderRender.left
  }
  
  internal var mBorderTop: CSSBorderRenderer.BorderSide {
    return mBorderRender.top
  }
  
  internal var mBorderRight: CSSBorderRenderer.BorderSide {
    return mBorderRender.right
  }
  
  internal var mBorderBottom: CSSBorderRenderer.BorderSide {
    return mBorderRender.bottom
  }
  
  
  public var borderWidth: MasonRect<MasonLengthPercentage> {
    get {
      return MasonRect(mBorderRender.top.width, mBorderRender.right.width, mBorderRender.bottom.width, mBorderRender.left.width)
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
  
  public var borderWidthCompat: MasonLengthPercentageRectCompat {
    get {
      guard let borderWidth = borderWidth.compatLength else {
        let compat = MasonLengthPercentageRectCompat(borderWidth)
        borderWidth.compatLength = compat
        return compat
      }
      
      return borderWidth
    }
    
    set {
      borderWidth = newValue.intoMasonRect()
    }
  }
  
  public func setBorderLeftWidth(_ value: Float, _ type: Int) {
    guard let left = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.BORDER_LEFT_TYPE, left.type)
    setFloat(StyleKeys.BORDER_LEFT_VALUE,  left.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderRightWidth(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.BORDER_RIGHT_TYPE, right.type)
    setFloat(StyleKeys.BORDER_RIGHT_VALUE, right.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderTopWidth(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.BORDER_TOP_TYPE, top.type)
    setFloat(StyleKeys.BORDER_TOP_VALUE, top.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderBottomWidth(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentage(value, type) else {return}
    
    setInt32(StyleKeys.BORDER_TOP_TYPE, bottom.type)
    setFloat(StyleKeys.BORDER_TOP_VALUE, bottom.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderWidth(_ value: Float, _ type: Int) {
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
  
  public var align: Align {
    get {
      return Align(rawValue: getInt32(StyleKeys.ALIGN))!
    }
    set {
      setInt32(StyleKeys.ALIGN, Int32(newValue.rawValue))
      setOrAppendState(StateKeys.align)
    }
  }
  
  public var textAlign: TextAlign {
    get {
      return TextAlign(rawValue: getInt32(TextStyleKeys.TEXT_ALIGN, text: true))!
    }
    set {
      setInt32(TextStyleKeys.TEXT_ALIGN, Int32(newValue.rawValue), text: true)
      setUInt8(TextStyleKeys.TEXT_ALIGN_STATE, StyleState.SET, text: true)
      setOrAppendState(TextStyleChangeMasks.textAlign)
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
      
      setOrAppendState(StateKeys.size)
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
      
      setOrAppendState(StateKeys.size)
    }
  }
  
  public var sizeCompatHeight: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: size.height)
    }
    
    set {
      setInt32(StyleKeys.HEIGHT_TYPE, newValue.dimension.type)
      setFloat(StyleKeys.HEIGHT_VALUE, newValue.dimension.value)
      setOrAppendState(StateKeys.size)
    }
  }
  
  public func setSizeWidth(_ value: Float, _ type: Int) {
    guard let width = getDimension(value, type) else {return}
    
    
    setInt32(StyleKeys.WIDTH_TYPE, width.type)
    setFloat(StyleKeys.WIDTH_VALUE, width.value)
    
    setOrAppendState(StateKeys.size)
  }
  
  public func setSizeHeight(_ value: Float, _ type: Int) {
    guard let height = getDimension(value, type) else {return}
    
    setInt32(StyleKeys.HEIGHT_TYPE, height.type)
    setFloat(StyleKeys.HEIGHT_VALUE, height.value)
    
    setOrAppendState(StateKeys.size)
  }
  
  public func setSizeWidth(_ width: MasonDimension) {
    
    setInt32(StyleKeys.WIDTH_TYPE, width.type)
    setFloat(StyleKeys.WIDTH_VALUE, width.value)
    
    setOrAppendState(StateKeys.size)
  }
  
  
  public func setSizeHeight(_ height: MasonDimension) {
    
    setInt32(StyleKeys.HEIGHT_TYPE, height.type)
    setFloat(StyleKeys.HEIGHT_VALUE, height.value)
    
    setOrAppendState(StateKeys.size)
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
  
  
  private func lazyCache<T>(
    getCache: () -> T?,
    setCache: (T) -> Void,
    fetch: () -> T
  ) -> T {
    if let cached = getCache() {
      return cached
    } else {
      let value = fetch()
      setCache(value)
      return value
    }
  }
  
  
  private var _gridArea: String?
  public var gridArea: String{
    set {
      gridState.gridArea = newValue
      _gridArea = nil
      _gridColumnStart = nil
      _gridColumnEnd = nil
      _gridRowStart = nil
      _gridRowEnd = nil
      isSlowDirty = true
    }
    get {
      lazyCache(getCache: {_gridArea}, setCache: {it in _gridArea = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_area_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
  }
  
  private var _gridTemplateAreas: String?
  public var gridTemplateAreas: String{
    set {
      gridState.gridTemplateAreas = newValue
      _gridTemplateAreas = nil
      isSlowDirty = true
    }
    get {
      lazyCache(getCache: {_gridTemplateAreas}, setCache: {it in _gridTemplateAreas = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_template_areas_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
  }
  
  
  private var _gridAutoRows: String?
  public var gridAutoRows: String{
    set {
      gridState.gridAutoRows = newValue
      _gridAutoRows = nil
      isSlowDirty = true
    }
    get {
      lazyCache(getCache: {_gridAutoRows}, setCache: {it in _gridAutoRows = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_auto_rows_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
  }
  
  
  private var _gridAutoColumns: String?
  public var gridAutoColumns: String{
    set {
      gridState.gridAutoColumns = newValue
      _gridAutoColumns = nil
      isSlowDirty = true
    }
    get {
      lazyCache(getCache: {_gridAutoColumns}, setCache: {it in _gridAutoColumns = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_auto_columns_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
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
  
  private var _gridColumn: String?
  public var gridColumn: String {
    get{
      lazyCache(getCache: {_gridColumn}, setCache: {it in _gridColumn = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_column_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
    set {
      gridState.gridColumn = newValue
      _gridColumn = nil
      isSlowDirty = true
    }
  }
  
  
  private var _gridColumnStart: String?
  public var gridColumnStart: String {
    get{
      lazyCache(getCache: {_gridColumnStart}, setCache: {it in _gridColumnStart = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_column_start_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
    set {
      gridState.gridColumnStart = newValue
      _gridColumnStart = nil
      isSlowDirty = true
    }
  }
  
  private var _gridColumnEnd: String?
  public var gridColumnEnd: String {
    get{
      lazyCache(getCache: {_gridColumnEnd}, setCache: {it in _gridColumnEnd = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_column_end_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
    set {
      gridState.gridColumnEnd = newValue
      _gridColumnEnd = nil
      isSlowDirty = true
    }
  }
  
  
  private var _gridRow: String?
  public var gridRow: String {
    get{
      lazyCache(getCache: {_gridRow}, setCache: {it in _gridRow = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_row_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
    set {
      gridState.gridRow = newValue
      _gridRow = nil
      isSlowDirty = true
    }
  }
  
  
  private var _gridRowStart: String?
  public var gridRowStart: String {
    get{
      lazyCache(getCache: {_gridRowStart}, setCache: {it in _gridRowStart = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_row_start_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
    set {
      gridState.gridRowStart = newValue
      _gridRowStart = nil
      isSlowDirty = true
    }
  }
  
  private var _gridRowEnd: String?
  public var gridRowEnd: String {
    get{
      lazyCache(getCache: {_gridRowEnd}, setCache: {it in _gridRowEnd = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_row_end_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
    set {
      gridState.gridRowEnd = newValue
      _gridRowEnd = nil
      isSlowDirty = true
    }
  }
  
  
  private var _gridTemplateRows: String?
  public var gridTemplateRows: String {
    get{
      lazyCache(getCache: {_gridTemplateRows}, setCache: {it in _gridTemplateRows = it}, fetch: {
        NativeHelpers.toSwiftString {
          mason_style_get_grid_template_rows_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
    set {
      gridState.gridTemplateRows = newValue
      _gridTemplateRows = nil
      isSlowDirty = true
    }
  }
  
  
  
  private var _gridTemplateColumns: String?
  public var gridTemplateColumns: String {
    get{
      lazyCache(getCache: {_gridTemplateColumns}, setCache: {it in _gridTemplateColumns = it}, fetch: {
        return NativeHelpers.toSwiftString {
          mason_style_get_grid_template_columns_css(node.mason.nativePtr, node.nativePtr)
        } ?? ""
      })
    }
    set {
      gridState.gridTemplateColumns = newValue
      _gridTemplateColumns = nil
      isSlowDirty = true
    }
  }
  
  
  public func updateNativeStyle() {
    if(inBatch){return}
    if (isSlowDirty) {
      
      if(isDirty == -1){
        mason_style_update_non_buffer_data(
          node.mason.nativePtr,
          node.nativePtr,
          gridState.gridAutoRows,
          gridState.gridAutoColumns,
          gridState.gridColumn,
          gridState.gridColumnStart,
          gridState.gridColumnEnd,
          
          gridState.gridRow,
          gridState.gridRowStart,
          gridState.gridRowEnd,
          
          gridState.gridTemplateRows,
          gridState.gridTemplateColumns,
          gridState.gridArea,
          gridState.gridTemplateAreas,
        )
        
        isSlowDirty = false
        (node.view as? MasonElement)?.requestLayout()
        return
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
        
        mBorderRender.left.width.type,
        mBorderRender.left.width.value,
        mBorderRender.right.width.type,
        mBorderRender.right.width.value,
        mBorderRender.top.width.type,
        mBorderRender.top.width.value,
        mBorderRender.bottom.width.type,
        mBorderRender.bottom.width.value,
        
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
        gridState.gridAutoRows,
        gridState.gridAutoColumns,
        gridAutoFlow.rawValue,
        gridState.gridColumn,
        gridState.gridColumnStart,
        gridState.gridColumnEnd,
        
        gridState.gridRow,
        gridState.gridRowStart,
        gridState.gridRowEnd,
        
        gridState.gridTemplateRows,
        gridState.gridTemplateColumns,
        overflowX.rawValue,
        overflowY.rawValue,
        scrollBarWidth.value,
        textAlign.rawValue,
        boxSizing.rawValue,
        gridState.gridArea,
        gridState.gridTemplateAreas,
      )
      
      let element = node.view as? MasonElement
      
      if(isDirty > -1){
        let zIndexDirty = (UInt64(isDirty) & StateKeys.zIndex.rawValue) != 0
        if(zIndexDirty){
          element?.uiView.layer.zPosition = CGFloat(zIndex)
        }
      }
      
      isSlowDirty = false
      isDirty = -1
      (node.view as? MasonElement)?.requestLayout()
      return
    }
    
    if (isDirty != -1) {
      isDirty = -1
      (node.view as? MasonElement)?.requestLayout()
    }
    
  }
  
  
  public override var description: String {
    var aspectRatioDesc = "undefined"
    if let aspectRatio = self.aspectRatio {
      aspectRatioDesc = String(describing: aspectRatio)
    }
    
    let overflowDesc = overflowX == overflowY
    ? overflowX.cssValue
    : "\(overflowX.cssValue) \(overflowY.cssValue)"
    
    let parts: [String] = [
      "display: \(display.cssValue)",
      "position: \(position.cssValue)",
      "flexDirection: \(flexDirection.cssValue)",
      "overflow: \(overflowDesc)",
      "flexWrap: \(flexWrap.cssValue)",
      "alignItems: \(alignItems.cssValue)",
      "alignSelf: \(alignSelf.cssValue)",
      "alignContent: \(alignContent.cssValue)",
      "justifyItems: \(justifyItems.cssValue)",
      "justifySelf: \(justifySelf.cssValue)",
      "justifyContent: \(justifyContent.cssValue)",
      "margin: \(margin.cssValue)",
      "padding: \(padding.cssValue)",
      "border: \(border)",
      "gap: \(gap.cssValue)",
      "flexGrow: \(flexGrow)",
      "flexShrink: \(flexShrink)",
      "flexBasis: \(flexBasis.cssValue)",
      "size: \(size.cssValue)",
      "minSize: \(minSize.cssValue)",
      "maxSize: \(maxSize.cssValue)",
      "aspectRatio: \(aspectRatioDesc)",
      "gridAutoRows: \(gridAutoRows)",
      "gridAutoColumns: \(gridAutoColumns)",
      "gridColumn: \(gridColumn)",
      "gridRow: \(gridRow)",
      "gridTemplateRows: \(gridTemplateRows)",
      "gridTemplateColumns: \(gridTemplateColumns)",
      "scrollBarWidth: \(scrollBarWidth)"
    ]
    
    let joined = parts.joined(separator: ",\n  ")
    
    return """
        (MasonStyle) {
          \(joined)
        }
        """
  }
}


// Mark resolved props
extension MasonStyle {
  // Helper to find parent style with text values initialized
  private var parentStyleWithTextValues: MasonStyle? {
    var parent = node.parent
    while (parent != nil) {
      // Check if parent has text values initialized
      if (parent?.style.isTextValueInitialized == true) {
        return parent?.style
      }
      parent = parent?.parent
    }
    return nil
  }
  
  // Store the resolved FontFace - lazily computed
  internal var resolvedFontFace: NSCFontFace {
    let familyState = getUInt8(TextStyleKeys.FONT_FAMILY_STATE, text: true)
    let weightState = getUInt8(TextStyleKeys.FONT_WEIGHT_STATE, text: true)
    let styleState = getUInt8(TextStyleKeys.FONT_STYLE_STATE, text: true)
    
    // If all font properties are inherited, use parent's font face
    if (familyState == StyleState.INHERIT && weightState == StyleState.INHERIT && styleState == StyleState.INHERIT) {
      return parentStyleWithTextValues?.resolvedFontFace ?? font
    }
    
    // If family is inherited but weight/style are set, need to create a new FontFace
    let baseFamily = if (familyState == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontFace.fontFamily ?? font.fontFamily
    } else {
      font.fontFamily
    }
    
    let resolvedWeight = if (weightState == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontWeight
      ?? NSCFontWeight(rawValue: Int(getInt32(TextStyleKeys.FONT_WEIGHT, text:  true)))!
    } else {
      NSCFontWeight(rawValue: Int(getInt32(TextStyleKeys.FONT_WEIGHT, text: true)))!
    }
    
    let resolvedStyle = if (styleState == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedInternalFontStyle ?? internalFontStyle
    } else {
      internalFontStyle
    }
    
    
    // If everything matches current font, return it
    if (font.fontFamily == baseFamily && font.weight == resolvedWeight && font.fontDescriptors.styleValue == resolvedStyle) {
      return font
    }
    
    // Create a new FontFace with resolved properties
    let resolvedFont = NSCFontFace(family: baseFamily)
    
    resolvedFont.weight = resolvedWeight
    resolvedFont.style = resolvedStyle.cssValue
    
    return resolvedFont
  }
  
  // Resolved properties that handle inheritance
  internal var resolvedColor: UInt32 {
    let state = getUInt8(TextStyleKeys.COLOR_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedColor ?? getUInt32(TextStyleKeys.COLOR, text: true)
    } else {
      getUInt32(TextStyleKeys.COLOR, text: true)
    }
  }
  
  internal var resolvedFontSize: Int32 {
    let state = getUInt8(TextStyleKeys.SIZE_STATE, text: true)
    let type = getUInt8(TextStyleKeys.SIZE_TYPE, text: true)
    // PERCENT == 1
    if (type == StyleState.SET) {
      let parentFontSize = {
        if let parent = node.parent as? MasonTextNode, parent.style.isTextValueInitialized  {
          return parent.style.resolvedFontSize
        }else {
          return Constants.DEFAULT_FONT_SIZE
        }
      }()
      
      return resolvePercentageFontSize(parentFontSize, getInt32(TextStyleKeys.SIZE, text: true))
    }
    
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontSize ?? getInt32(TextStyleKeys.SIZE, text: true)
    } else {
      getInt32(TextStyleKeys.SIZE, text: true)
    }
  }
  
  internal func resolvePercentageFontSize(_ parentFontSize: Int32, _ percent: Int32) -> Int32 {
    let rawSize = getInt32(TextStyleKeys.SIZE, text: true)
    let percent = Float(rawSize) / 100
    return max(Int32((Float(parentFontSize) * percent).rounded(.up)), 0)
  }
  
  internal var resolvedFontWeight: NSCFontWeight  {
    let state = getUInt8(TextStyleKeys.FONT_WEIGHT_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontWeight
      ?? NSCFontWeight(rawValue: Int(getInt32(TextStyleKeys.FONT_WEIGHT, text: true)))!
    } else {
      NSCFontWeight(rawValue: Int(getInt32(TextStyleKeys.FONT_WEIGHT, text: true)))!
    }
  }
  
  internal var resolvedFontStyle: FontStyle{
    let state = getUInt8(TextStyleKeys.FONT_STYLE_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontStyle ?? fontStyle
    } else {
      fontStyle
    }
  }
  
  internal var resolvedInternalFontStyle: NSCFontStyle{
    let state = getUInt8(TextStyleKeys.FONT_STYLE_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedInternalFontStyle ?? internalFontStyle
    } else {
      internalFontStyle
    }
  }
  
  internal var resolvedBackgroundColor: UInt32 {
    let state = getUInt8(TextStyleKeys.BACKGROUND_COLOR_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedBackgroundColor
      ?? getUInt32(TextStyleKeys.BACKGROUND_COLOR, text: true)
    } else {
      getUInt32(TextStyleKeys.BACKGROUND_COLOR, text: true)
    }
  }
  
  internal var resolvedDecorationLine: DecorationLine {
    let state = getUInt8(TextStyleKeys.DECORATION_LINE_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationLine ?? DecorationLine(rawValue:
                                                                            getInt32(TextStyleKeys.DECORATION_LINE, text: true)
      )!
    } else {
      DecorationLine(rawValue: getInt32(TextStyleKeys.DECORATION_LINE, text: true))!
    }
  }
  
  internal var resolvedDecorationColor: UInt32{
    let state = getUInt8(TextStyleKeys.DECORATION_COLOR_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationColor
      ?? getUInt32(TextStyleKeys.DECORATION_COLOR, text: true)
    } else {
      getUInt32(TextStyleKeys.DECORATION_COLOR, text: true)
    }
  }
  
  internal var resolvedDecorationStyle: DecorationStyle {
    let state = getUInt8(TextStyleKeys.DECORATION_STYLE_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationStyle ?? DecorationStyle(rawValue:
                                                                              getInt32(TextStyleKeys.DECORATION_STYLE, text: true)
      )!
    } else {
      DecorationStyle(rawValue: getInt32(TextStyleKeys.DECORATION_STYLE, text: true))!
    }
  }
  
  internal var resolvedLetterSpacing: Float {
    let state = getUInt8(TextStyleKeys.LETTER_SPACING_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLetterSpacing
      ?? getFloat(TextStyleKeys.LETTER_SPACING, text: true)
    } else {
      getFloat(TextStyleKeys.LETTER_SPACING, text: true)
    }
  }
  
  internal var resolvedTextWrap: TextWrap{
    let state = getUInt8(TextStyleKeys.TEXT_WRAP_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextWrap ?? TextWrap(
        rawValue: getInt32(
          TextStyleKeys.TEXT_WRAP, text: true
        )
      )!
    } else {
      TextWrap(rawValue: getInt32(TextStyleKeys.TEXT_WRAP, text: true))!
    }
  }
  
  internal var resolvedWhiteSpace: WhiteSpace {
    let state = getUInt8(TextStyleKeys.WHITE_SPACE_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedWhiteSpace
      ?? WhiteSpace(rawValue: getInt32(TextStyleKeys.WHITE_SPACE, text: true))!
    } else {
      WhiteSpace(rawValue: getInt32(TextStyleKeys.WHITE_SPACE, text: true))!
    }
  }
  
  internal var resolvedTextTransform: TextTransform {
    let state = getUInt8(TextStyleKeys.TRANSFORM_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextTransform
      ?? TextTransform(rawValue: getInt32(TextStyleKeys.TRANSFORM, text: true))!
    } else {
      TextTransform(rawValue: getInt32(TextStyleKeys.TRANSFORM, text: true))!
    }
  }
  
  internal var resolvedTextAlign: TextAlign{
    let state = getUInt8(TextStyleKeys.TEXT_ALIGN_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextAlign ?? TextAlign(
        rawValue: getInt32(
          TextStyleKeys.TEXT_ALIGN , text: true
        )
      )!
    } else {
      TextAlign(rawValue: getInt32(TextStyleKeys.TEXT_ALIGN, text: true))!
    }
  }
  
  internal var resolvedTextJustify: TextJustify {
    let state = getUInt8(TextStyleKeys.TEXT_JUSTIFY_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextJustify ?? TextJustify(
        rawValue: getInt32(
          TextStyleKeys.TEXT_JUSTIFY, text: true
        )
      )!
    } else {
      TextJustify(rawValue: getInt32(TextStyleKeys.TEXT_JUSTIFY, text: true))!
    }
  }
  
  internal var resolvedLineHeight: Float {
    let state = getUInt8(TextStyleKeys.LINE_HEIGHT_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLineHeight
      ?? getFloat(TextStyleKeys.LINE_HEIGHT, text: true)
    } else {
      getFloat(TextStyleKeys.LINE_HEIGHT, text: true)
    }
  }
  
  internal var resolvedLineHeightType: UInt8 {
    let state = getUInt8(TextStyleKeys.LINE_HEIGHT_STATE, text: true)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLineHeightType
      ?? getUInt8(TextStyleKeys.LINE_HEIGHT_TYPE, text: true)
    } else {
      getUInt8(TextStyleKeys.LINE_HEIGHT_TYPE, text: true)
    }
  }
  
  
  // Reset methods
  func resetFontFamilyToInherit() {
    setUInt8(TextStyleKeys.FONT_FAMILY_STATE, StyleState.INHERIT, text: true)
    notifyTextStyleChanged(TextStyleChangeMasks.fontFamily.rawValue)
  }
  
  func resetFontWeightToInherit() {
    setUInt8(TextStyleKeys.FONT_WEIGHT_STATE, StyleState.INHERIT, text: true)
    notifyTextStyleChanged(TextStyleChangeMasks.fontWeight.rawValue)
  }
  
  func resetFontStyleToInherit() {
    setUInt8(TextStyleKeys.FONT_STYLE_STATE, StyleState.INHERIT, text: true)
    notifyTextStyleChanged(TextStyleChangeMasks.fontWeight.rawValue)
  }
}
