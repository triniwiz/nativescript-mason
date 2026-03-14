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


public struct StyleKeys {
  public static let DISPLAY = 0
  public static let POSITION = 1
  public static let DIRECTION = 2
  public static let FLEX_DIRECTION = 3
  public static let FLEX_WRAP = 4
  public static let OVERFLOW_X = 5
  public static let OVERFLOW_Y = 6
  
  public static let ALIGN_ITEMS = 7
  public static let ALIGN_SELF = 8
  public static let ALIGN_CONTENT = 9
  
  public static let JUSTIFY_ITEMS = 10
  public static let JUSTIFY_SELF = 11
  public static let JUSTIFY_CONTENT = 12
  
  public static let INSET_LEFT_TYPE = 13
  public static let INSET_LEFT_VALUE = 14 // float (4 bytes: 14-17)
  public static let INSET_RIGHT_TYPE = 18
  public static let INSET_RIGHT_VALUE = 19 // float (4 bytes: 19-22)
  public static let INSET_TOP_TYPE = 23
  public static let INSET_TOP_VALUE = 24 // float (4 bytes: 24-27)
  public static let INSET_BOTTOM_TYPE = 28
  public static let INSET_BOTTOM_VALUE = 29 // float (4 bytes: 29-32)
  
  public static let MARGIN_LEFT_TYPE = 33
  public static let MARGIN_LEFT_VALUE = 34 // float (4 bytes: 34-37)
  public static let MARGIN_RIGHT_TYPE = 38
  public static let MARGIN_RIGHT_VALUE = 39 // float (4 bytes: 39-42)
  public static let MARGIN_TOP_TYPE = 43
  public static let MARGIN_TOP_VALUE = 44 // float (4 bytes: 44-47)
  public static let MARGIN_BOTTOM_TYPE = 48
  public static let MARGIN_BOTTOM_VALUE = 49 // float (4 bytes: 49-52)
  
  public static let PADDING_LEFT_TYPE = 53
  public static let PADDING_LEFT_VALUE = 54 // float (4 bytes: 54-57)
  public static let PADDING_RIGHT_TYPE = 58
  public static let PADDING_RIGHT_VALUE = 59 // float (4 bytes: 59-62)
  public static let PADDING_TOP_TYPE = 63
  public static let PADDING_TOP_VALUE = 64 // float (4 bytes: 64-67)
  public static let PADDING_BOTTOM_TYPE = 68
  public static let PADDING_BOTTOM_VALUE = 69 // float (4 bytes: 69-72)
  
  public static let BORDER_LEFT_TYPE = 73
  public static let BORDER_LEFT_VALUE = 74 // float (4 bytes: 74-77)
  public static let BORDER_RIGHT_TYPE = 78
  public static let BORDER_RIGHT_VALUE = 79 // float (4 bytes: 79-82)
  public static let BORDER_TOP_TYPE = 83
  public static let BORDER_TOP_VALUE = 84 // float (4 bytes: 84-87)
  public static let BORDER_BOTTOM_TYPE = 88
  public static let BORDER_BOTTOM_VALUE = 89 // float (4 bytes: 89-92)
  
  public static let FLEX_GROW = 93 // float (4 bytes: 93-96)
  public static let FLEX_SHRINK = 97 // float (4 bytes: 97-100)
  
  public static let FLEX_BASIS_TYPE = 101
  public static let FLEX_BASIS_VALUE = 102 // float (4 bytes: 102-105)
  
  public static let WIDTH_TYPE = 106
  public static let WIDTH_VALUE = 107 // float (4 bytes: 107-110)
  public static let HEIGHT_TYPE = 111
  public static let HEIGHT_VALUE = 112 // float (4 bytes: 112-115)
  
  public static let MIN_WIDTH_TYPE = 116
  public static let MIN_WIDTH_VALUE = 117 // float (4 bytes: 117-120)
  public static let MIN_HEIGHT_TYPE = 121
  public static let MIN_HEIGHT_VALUE = 122 // float (4 bytes: 122-125)
  
  public static let MAX_WIDTH_TYPE = 126
  public static let MAX_WIDTH_VALUE = 127 // float (4 bytes: 127-130)
  public static let MAX_HEIGHT_TYPE = 131
  public static let MAX_HEIGHT_VALUE = 132 // float (4 bytes: 132-135)
  
  public static let GAP_ROW_TYPE = 136
  public static let GAP_ROW_VALUE = 137 // float (4 bytes: 137-140)
  public static let GAP_COLUMN_TYPE = 141
  public static let GAP_COLUMN_VALUE = 142 // float (4 bytes: 142-145)
  
  public static let ASPECT_RATIO = 146 // float (4 bytes: 146-149)
  public static let GRID_AUTO_FLOW = 150
  public static let GRID_COLUMN_START_TYPE = 151
  public static let GRID_COLUMN_START_VALUE = 152 // float (4 bytes: 152-155)
  public static let GRID_COLUMN_END_TYPE = 156
  public static let GRID_COLUMN_END_VALUE = 157 // float (4 bytes: 157-160)
  public static let GRID_ROW_START_TYPE = 161
  public static let GRID_ROW_START_VALUE = 162 // float (4 bytes: 162-165)
  public static let GRID_ROW_END_TYPE = 166
  public static let GRID_ROW_END_VALUE = 167 // float (4 bytes: 167-170)
  public static let SCROLLBAR_WIDTH = 171 // float (4 bytes: 171-174)
  public static let ALIGN = 175
  public static let BOX_SIZING = 176
  public static let OVERFLOW = 177
  public static let ITEM_IS_TABLE = 178
  public static let ITEM_IS_REPLACED = 179
  public static let DISPLAY_MODE = 180
  public static let FORCE_INLINE = 181
  public static let MIN_CONTENT_WIDTH = 182 // float (4 bytes: 182-185)
  public static let MIN_CONTENT_HEIGHT = 186 // float (4 bytes: 186-189)
  public static let MAX_CONTENT_WIDTH = 190 // float (4 bytes: 190-193)
  public static let MAX_CONTENT_HEIGHT = 194 // float (4 bytes: 194-197)
  
  // ----------------------------
  // Border Style (per side)
  // ----------------------------
  public static let BORDER_LEFT_STYLE = 198
  public static let BORDER_RIGHT_STYLE = 199
  public static let BORDER_TOP_STYLE = 200
  public static let BORDER_BOTTOM_STYLE = 201
  
  // ----------------------------
  // Border Color (per side)
  // ----------------------------
  public static let BORDER_LEFT_COLOR = 202 // u32 (4 bytes: 202-205)
  public static let BORDER_RIGHT_COLOR = 206 // u32 (4 bytes: 206-209)
  public static let BORDER_TOP_COLOR = 210 // u32 (4 bytes: 210-213)
  public static let BORDER_BOTTOM_COLOR = 214 // u32 (4 bytes: 214-217)
  
  // ============================================================
  // Border Radius (elliptical + squircle exponent)
  // Each corner = 5 fields (12 bytes total):
  //   x_type (1), x_value (4), y_type (1), y_value (4), exponent (4)
  // ============================================================
  
  // ----------------------------
  // Top-left corner (12 bytes)
  // ----------------------------
  public static let BORDER_RADIUS_TOP_LEFT_X_TYPE = 218
  public static let BORDER_RADIUS_TOP_LEFT_X_VALUE = 219 // float (4 bytes: 219-222)
  public static let BORDER_RADIUS_TOP_LEFT_Y_TYPE = 223
  public static let BORDER_RADIUS_TOP_LEFT_Y_VALUE = 224 // float (4 bytes: 224-227)
  public static let BORDER_RADIUS_TOP_LEFT_EXPONENT = 228 // float (4 bytes: 228-231)
  
  // ----------------------------
  // Top-right corner
  // ----------------------------
  public static let BORDER_RADIUS_TOP_RIGHT_X_TYPE = 232
  public static let BORDER_RADIUS_TOP_RIGHT_X_VALUE = 233 // float (4 bytes: 233-236)
  public static let BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 237
  public static let BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 238 // float (4 bytes: 238-241)
  public static let BORDER_RADIUS_TOP_RIGHT_EXPONENT = 242 // float (4 bytes: 242-245)
  
  // ----------------------------
  // Bottom-right corner
  // ----------------------------
  public static let BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 246
  public static let BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 247 // float (4 bytes: 247-250)
  public static let BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 251
  public static let BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 252 // float (4 bytes: 252-255)
  public static let BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 256 // float (4 bytes: 256-259)
  
  // ----------------------------
  // Bottom-left corner
  // ----------------------------
  public static let BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 260
  public static let BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 261 // float (4 bytes: 261-264)
  public static let BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 265
  public static let BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 266 // float (4 bytes: 266-269)
  public static let BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 270 // float (4 bytes: 270-273)
  
  // ----------------------------
  // Float
  // ----------------------------
  public static let FLOAT = 274
  public static let CLEAR = 275
  
  public static let OBJECT_FIT = 276
  
  public static let FONT_METRICS_ASCENT_OFFSET = 277 // float (4 bytes: 277-280)
  public static let FONT_METRICS_DESCENT_OFFSET = 281 // float (4 bytes: 281-284)
  public static let FONT_METRICS_X_HEIGHT_OFFSET = 285 // float (4 bytes: 285-288)
  public static let FONT_METRICS_LEADING_OFFSET = 289 // float (4 bytes: 289-292)
  public static let FONT_METRICS_CAP_HEIGHT_OFFSET = 293 // float (4 bytes: 293-296)
  public static let VERTICAL_ALIGN_OFFSET_OFFSET = 297 // float (4 bytes: 297-300)
  public static let VERTICAL_ALIGN_IS_PERCENT_OFFSET = 301
  public static let VERTICAL_ALIGN_ENUM_OFFSET = 302 // float (4 bytes: 302-305)
  public static let FIRST_BASELINE_OFFSET = 306 // float (4 bytes: 306-309)
  public static let Z_INDEX = 310 // float (4 bytes: 310-313)
  public static let ITEM_IS_LIST = 314
  public static let ITEM_IS_LIST_ITEM = 315
  public static let LIST_STYLE_POSITION = 316
  public static let LIST_STYLE_TYPE = 317
  public static let LIST_STYLE_POSITION_STATE = 318
  public static let LIST_STYLE_TYPE_STATE = 319
  
  public static let REF_COUNT = 320 // int
  
  // Text-related fields (added)
  public static let FONT_COLOR = 324 // int
  public static let FONT_COLOR_STATE = 328 // byte
  public static let FONT_SIZE = 329 // int
  public static let FONT_SIZE_TYPE = 333 // byte
  public static let FONT_SIZE_STATE = 334 // byte
  public static let FONT_WEIGHT = 335 // int
  public static let FONT_WEIGHT_STATE = 339 // byte
  public static let FONT_STYLE_SLANT = 340 // int
  public static let FONT_STYLE_TYPE = 344 // byte
  public static let FONT_STYLE_STATE = 345 // byte
  public static let FONT_FAMILY_STATE = 346 // byte
  public static let FONT_RESOLVED_DIRTY = 347 // byte
  public static let BACKGROUND_COLOR = 348 // int
  public static let BACKGROUND_COLOR_STATE = 352 // byte
  public static let BACKGROUND_COLOR_TYPE = 353 // byte
  public static let DECORATION_LINE = 354 // byte
  public static let DECORATION_LINE_STATE = 355 // byte
  public static let DECORATION_COLOR = 356 // int
  public static let DECORATION_COLOR_STATE = 360 // byte
  public static let DECORATION_STYLE = 361 // byte
  public static let DECORATION_STYLE_STATE = 362 // byte
  public static let LETTER_SPACING = 363 // int
  public static let LETTER_SPACING_STATE = 367 // byte
  public static let TEXT_WRAP = 368 // byte
  public static let TEXT_WRAP_STATE = 369 // byte
  public static let WHITE_SPACE = 370 // byte
  public static let WHITE_SPACE_STATE = 371 // byte
  public static let TEXT_TRANSFORM = 372 // byte
  public static let TEXT_TRANSFORM_STATE = 373 // byte
  public static let TEXT_ALIGN = 374 // byte
  public static let TEXT_ALIGN_STATE = 375 // byte
  public static let TEXT_JUSTIFY = 376 // byte
  public static let TEXT_JUSTIFY_STATE = 377 // byte
  public static let TEXT_INDENT = 378 // int
  public static let TEXT_INDENT_TYPE = 382 // byte
  public static let TEXT_INDENT_STATE = 383 // byte
  public static let LINE_HEIGHT = 384 // int
  public static let LINE_HEIGHT_STATE = 388 // byte
  public static let LINE_HEIGHT_TYPE = 389 // byte
  public static let DECORATION_THICKNESS = 390 // int
  public static let DECORATION_THICKNESS_STATE = 394 // byte
  public static let TEXT_SHADOW_STATE = 395 // byte
  public static let TEXT_OVERFLOW = 396 // byte
  public static let TEXT_OVERFLOW_STATE = 397 // byte

  // Pseudo set bitmask — tracks which properties were explicitly set on a pseudo style buffer
  public static let PSEUDO_SET_MASK_LOW = 398   // long (8 bytes: 398-405)
  public static let PSEUDO_SET_MASK_HIGH = 406  // long (8 bytes: 406-413)
  
  // Filter: brightness (float) + state
  public static let FILTER_BRIGHTNESS = 414 // float (4 bytes: 414-417)
  public static let FILTER_BRIGHTNESS_STATE = 418 // byte

  // font-variant-numeric bitmask (byte) + state
  public static let FONT_VARIANT_NUMERIC = 419 // byte (bitmask)
  public static let FONT_VARIANT_NUMERIC_STATE = 420 // byte
}


public struct StateKeys: Equatable {
  public let low: UInt64
  public let high: UInt64
  
  public init(low: UInt64, high: UInt64){
    self.low = low
    self.high = high
  }
  
  public init(_ value: UInt64) {
    if(value < 64){
      self.low = 1 << value
      self.high = 0
    }else {
      self.low = 0
      self.high = 1 << (value - 64)
    }
  }
  
  public func contains(_ other: StateKeys) -> Bool {
      return (low & other.low) != 0 ||
             (high & other.high) != 0
  }
  
  public func union(_ other: StateKeys) -> StateKeys {
    return StateKeys(low: self.low | other.low, high: self.high | other.high)
  }
  
  public static let none = StateKeys(low: 0, high: 0)
  public static let display         = StateKeys(0)
  public static let position        = StateKeys(1)
  public static let direction       = StateKeys(2)
  public static let flexDirection   = StateKeys(3)
  public static let flexWrap        = StateKeys(4)
  public static let overflowX       = StateKeys(5)
  public static let overflowY       = StateKeys(6)
  public static let alignItems      = StateKeys(7)
  public static let alignSelf       = StateKeys(8)
  public static let alignContent    = StateKeys(9)
  public static let justifyItems    = StateKeys(10)
  public static let justifySelf     = StateKeys(11)
  public static let justifyContent  = StateKeys(12)
  public static let inset           = StateKeys(13)
  public static let margin          = StateKeys(14)
  public static let padding         = StateKeys(15)
  public static let border          = StateKeys(16)
  public static let flexGrow        = StateKeys(17)
  public static let flexShrink      = StateKeys(18)
  public static let flexBasis       = StateKeys(19)
  public static let size            = StateKeys(20)
  public static let minSize         = StateKeys(21)
  public static let maxSize         = StateKeys(22)
  public static let gap             = StateKeys(23)
  public static let aspectRatio     = StateKeys(24)
  public static let gridAutoFlow    = StateKeys(25)
  public static let gridColumn      = StateKeys(26)
  public static let gridRow         = StateKeys(27)
  public static let scrollbarWidth  = StateKeys(28)
  public static let align           = StateKeys(29)
  public static let boxSizing       = StateKeys(30)
  public static let overflow        = StateKeys(31)
  public static let itemIsTable     = StateKeys(32)
  public static let itemIsReplaced  = StateKeys(33)
  public static let displayMode     = StateKeys(34)
  public static let forceInline     = StateKeys(35)
  public static let minContentWidth = StateKeys(36)
  public static let minContentHeight = StateKeys(37)
  public static let maxContentWidth  = StateKeys(38)
  public static let maxContentHeight = StateKeys(39)
  public static let borderStyle = StateKeys(40)
  public static let borderRadius = StateKeys(41)
  public static let borderColor = StateKeys(42)
  public static let float = StateKeys(43)
  public static let clear = StateKeys(44)
  public static let objectFit = StateKeys(45)
  public static let zIndex = StateKeys(46)
  public static let listStylePosition = StateKeys(47)
  public static let listStyleType = StateKeys(48)
  public static let invalidateText = StateKeys(49)
  public static let color = StateKeys(50)
  public static let decorationLine = StateKeys(51)
  public static let decorationColor = StateKeys(52)
  public static let textAlign   = StateKeys(53)
  public static let textJustify = StateKeys(54)
  public static let backgroundColor = StateKeys(55)
  public static let fontSize = StateKeys(56)
  public static let textTransform = StateKeys(57)
  public static let fontStyle = StateKeys(58)
  public static let fontStyleSlant = StateKeys(59)
  public static let textWrap = StateKeys(60)
  public static let textOverflow = StateKeys(61)
  public static let decorationStyle = StateKeys(62)
  public static let whiteSpace = StateKeys(63)
  public static let fontWeight = StateKeys(64)
  public static let lineHeight = StateKeys(65)
  public static let verticalAlign = StateKeys(66)
  public static let decorationThinkness = StateKeys(67)
  public static let textShadow = StateKeys(68)
  public static let fontFamily = StateKeys(69)
  public static let letterSpacing = StateKeys(70)
  public static let fontVariantNumeric = StateKeys(71)

  /// Union of all text-relevant keys that may differ in a pseudo buffer.
  public static let pseudoText = StateKeys(
    low:  color.low | fontSize.low | textAlign.low | fontWeight.low | fontStyle.low | fontFamily.low,
    high: color.high | fontSize.high | textAlign.high | fontWeight.high | fontStyle.high | fontFamily.high | fontVariantNumeric.high
  )
}


protocol StyleChangeListener: AnyObject {
  func onStyleChange(_ low: UInt64, _ high: UInt64)
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
  private var _cachedResolvedFont: NSCFontFace? = nil
  private var _resolvedFontKey: UInt64 = 0
  internal var fontMetrics: FontMetrics {
    get {
      return FontMetrics(ascent:  getFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET), descent:  getFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET), x_height: getFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET), leading: getFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET), cap_height: getFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET))
    }
    
    set {
      prepareMut()
      setFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, newValue.ascent)
      setFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, newValue.descent)
      setFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, newValue.x_height)
      setFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, newValue.leading)
      setFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, newValue.cap_height)
    }
  }
  
  /// Update font metrics on a Mason node when font changes.
  /// When called during a Rust measure callback (inMeasure == true),
  /// the write is deferred to avoid deadlocking the rwlock.
  internal func syncFontMetrics(){
    if inMeasure {
      pendingMetricsSync = true
      return
    }
    syncFontMetricsNow()
  }
  
  private func syncFontMetricsNow(){
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
    // let lineHeight = Float(font.lineHeight) * scale
    let xHeight = Float(font.xHeight) * scale
    let capHeight = Float(font.capHeight) * scale
    let leading = Float(font.leading) * scale
    
    
    setFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, ascent)
    setFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, descent)
    setFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, xHeight)
    setFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, leading)
    setFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, capHeight)
  }
  
  /// Flush deferred font metrics sync after measure callback returns.
  /// Returns true if a sync was pending (caller should mark node dirty).
  internal func flushPendingMetricsSync() -> Bool {
    if !pendingMetricsSync { return false }
    pendingMetricsSync = false
    syncFontMetricsNow()
    return true
  }
  
  
  private var gridState = GridState()
  
  // Weight tracking
  internal var weight = UIFont.Weight.regular
  private var weightName = "normal"
  
  
  // Guard flag: true while inside Rust measure callback (read lock held, no buffer writes)
  internal var inMeasure = false
  internal var pendingMetricsSync = false
  
  internal var isDirty: UInt64 = 0
  // high 64-bit half for expanded 128-bit state keys
  internal var isDirtyHigh: UInt64 = 0
  internal var isSlowDirty = false {
    didSet {
      if (!inBatch) {
        if(!pendingInvalidation.contains(.invalidating)){
          pendingInvalidation = pendingInvalidation.union(.pending)
        }
        updateNativeStyle()
      }
    }
  }
  unowned let node: MasonNode
  var inBatch = false {
    didSet {
      if (!inBatch) {
        if((isDirty != 0 || isDirtyHigh != 0) && !pendingInvalidation.contains(.invalidating)){
          pendingInvalidation = pendingInvalidation.union(.pending)
        }
        updateNativeStyle()
      }
    }
  }
  
  internal var isValueInitialized: Bool  = false
  internal var isTextValueInitialized: Bool = false
  
  private weak var styleChangeListener: StyleChangeListener? = nil
  
  internal func setStyleChangeListener(listener: StyleChangeListener?) {
    styleChangeListener = listener
  }
  
  
  internal func notifyTextStyleChanged(_ low: UInt64, _ high: UInt64) {
    styleChangeListener?.onStyleChange(low, high)
  }
  
  internal func notifyTextStyleChanged(_ state: StateKeys) {
    styleChangeListener?.onStyleChange(state.low, state.high)
  }
  
  public func prepareMut() {
    if (node.isPlaceholder) {
      return
    }
    
    let mutable = getInt32(StyleKeys.REF_COUNT) == 1
    
    
    if (!mutable) {
      mason_style_prepare_style_for_mut(node.mason.nativePtr, node.nativePtr)
      let buffer = mason_style_get_style_buffer_apple(node.mason.nativePtr, node.nativePtr)
      guard let buffer else {
        // todo
        fatalError("Could not allocate style buffer")
      }
      
      isValueInitialized = true
      
      writableValue = Unmanaged<NSMutableData>.fromOpaque(buffer).takeRetainedValue()
    } else {
      isValueInitialized = true
      writableValue = values
    }
  }
  
  private lazy var placeHolderValue: NSMutableData = {
    // use the same capacity set in rust
    let buffer = NSMutableData(length: 400)
    
    
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
    
    
    
    
    setInt8(StyleKeys.OBJECT_FIT, ObjectFit.Fill.rawValue, buffer: buffer)
    setInt8(StyleKeys.DISPLAY, Display.Block.rawValue, buffer: buffer)
    
    // default Normal -> -1
    setInt8(StyleKeys.ALIGN_ITEMS, -1, buffer: buffer)
    setInt8(StyleKeys.ALIGN_SELF, -1, buffer: buffer)
    setInt8(StyleKeys.ALIGN_CONTENT, -1, buffer: buffer)
    
    setInt8(StyleKeys.JUSTIFY_ITEMS, -1, buffer: buffer)
    setInt8(StyleKeys.JUSTIFY_SELF, -1, buffer: buffer)
    setInt8(StyleKeys.JUSTIFY_CONTENT, -1, buffer: buffer)
    
    setInt8(StyleKeys.MARGIN_LEFT_TYPE, 1, buffer: buffer)
    setInt8(StyleKeys.MARGIN_TOP_TYPE, 1, buffer: buffer)
    setInt8(StyleKeys.MARGIN_RIGHT_TYPE, 1, buffer: buffer)
    setInt8(StyleKeys.MARGIN_BOTTOM_TYPE, 1, buffer: buffer)
    
    setInt32(StyleKeys.REF_COUNT, 1)
    
    
    guard let buffer else {
      // todo
      fatalError("Could not allocate style buffer")
    }
    
    isValueInitialized = true
    return buffer
  }()
  
  private var writableValue: NSMutableData? = nil
  private var readableValue: NSMutableData? = nil
  
  
  public var values: NSMutableData {
    get {
      if(node.isPlaceholder){
        return placeHolderValue
      }
      
      let value = writableValue ?? readableValue
      
      guard let value = value else {
        
        let buffer = mason_style_get_style_buffer_apple(node.mason.nativePtr, node.nativePtr)
        guard let buffer else {
          // todo
          fatalError("Could not allocate style buffer")
        }
        
        isValueInitialized = true
        
        readableValue = Unmanaged<NSMutableData>.fromOpaque(buffer).takeRetainedValue()
        
        return readableValue!
        
      }
      return value
    }
  }
  
  public init(node: MasonNode) {
    self.node = node
    super.init()
    font =  NSCFontFace(family: "sans-serif",owner: self)
    mBackground = Background(style: self)
  }
  
  internal func invalidateStyle(_ state: Int64) {
    if state == 0 {
      return
    }
    
    if (isDirty > 0) {
      (node.view as? MasonElement)?.invalidateLayout()
    }
  }
  
  private func setOrAppendState(_ value: StateKeys) {
    setStateFromHalves(value.low, value.high)
  }

  // Helpers to set full 128-bit masks (low/high halves)
  internal func setStateFromHalves(_ low: UInt64, _ high: UInt64) {
    if isDirty == 0 && isDirtyHigh == 0 {
      isDirty = low
      isDirtyHigh = high
    } else {
      isDirty |= low
      isDirtyHigh |= high
    }
    if (!inBatch) {
      if((isDirty != 0 || isDirtyHigh != 0) && !pendingInvalidation.contains(.invalidating)){
        pendingInvalidation = pendingInvalidation.union(.pending)
      }
      updateNativeStyle()
    }
  }
  
  
  private struct InvalidationState {
      let rawValue: UInt64
     
     init(rawValue: UInt64) {
       self.rawValue = rawValue
     }
     
     init() {
       self.rawValue = 0
     }
    
    static let none = InvalidationState()
    static let pending = InvalidationState(rawValue: 1 << 0)
    static let invalidating = InvalidationState(rawValue: 1 << 1)
    
    func contains(_ other: InvalidationState) -> Bool{
      return (self.rawValue & other.rawValue) != 0
    }
    
    func union(_ other: InvalidationState) -> InvalidationState {
      return InvalidationState(rawValue: self.rawValue | other.rawValue)
    }
  }
  
  private var pendingInvalidation: InvalidationState = .none
  
  private func updateTextStyle() {
    if (node.nativePtr == nil) {
      return
    }
    
    let lowDirty = isDirty
    let highDirty = isDirtyHigh
    if (lowDirty > 0 || highDirty > 0) {
      var invalidate = false
      let value = StateKeys(low: isDirty, high: highDirty)
      let colorDirty = value.contains(.color)
      let sizeDirty = value.contains(.fontSize)
      let weightDirty = value.contains(.fontWeight)
      let styleDirty = value.contains(.fontStyle)
      if (value.contains(.textTransform) || value.contains(.textWrap) || value.contains(.whiteSpace) || value.contains(.textOverflow) || colorDirty || value.contains(.backgroundColor) || value.contains(.decorationColor) || value.contains(.decorationLine) || sizeDirty || weightDirty || styleDirty || value.contains(.letterSpacing) || value.contains(.lineHeight)
      ) {
        invalidate = true
      }
      
      var state: StateKeys = .none
      
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
      
      
      if(invalidate){
        pendingInvalidation = pendingInvalidation.union(.pending)
      }
      
      if (state != .none) {
        notifyTextStyleChanged(state)
      }
    }
  }
  
  
  internal func getUInt8(_ index: Int) -> UInt8 {
    return values.bytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee
  }
  
  internal func setUInt8(_ index: Int, _ value: UInt8, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
  }
  
  
  internal func getInt8(_ index: Int) -> Int8 {
    return values.bytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee
  }
  
  internal func setInt8(_ index: Int, _ value: Int8, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee = value
  }
  
  
  internal func getInt16(_ index: Int) -> Int16 {
    return values.bytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee
  }
  
  private func setInt16(_ index: Int, _ value: Int16) {
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee = value
  }
  
  
  internal func getUInt32(_ index: Int) -> UInt32 {
    return values.bytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee
  }
  
  internal func setUInt32(_ index: Int, _ value: UInt32, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
  }
  
  internal func getInt32(_ index: Int) -> Int32 {
    return values.bytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee
  }
  
  internal func setInt32(_ index: Int, _ value: Int32, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
  }
  
  internal func getFloat(_ index: Int) -> Float {
    return values.bytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee
  }
  
  internal func setFloat(_ index: Int, _ value: Float, buffer: NSMutableData? = nil) {
    if let buffer = buffer {
      buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
      return
    }
    values.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
  }
  
  private func updateIntField(offset: Int, value: Int8, state: StateKeys){
    setInt8(offset, value)
    setOrAppendState(state)
  }
  
  private func updateFloatField(offset: Int, value: Float, state: StateKeys){
    setFloat(offset, value)
    setOrAppendState(state)
  }
  
  
  static func getUInt8(_ index: Int, _ buffer: NSData) -> UInt8 {
    return buffer.bytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee
  }
  
  static func setUInt8(_ index: Int, _ value: UInt8, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt8.self).pointee = value
  }
  
  static func getInt8(_ index: Int, _ buffer: NSData) -> Int8 {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee
  }
  
  static func setInt8(_ index: Int, _ value: Int8, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int8.self).pointee = value
  }
  
  
  static func getInt16(_ index: Int, _ buffer: NSData) -> Int16 {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee
  }
  
  static func setInt16(_ index: Int, _ value: Int16, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int16.self).pointee = value
  }
  
  static func getUInt32(_ index: Int, _ buffer: NSData) -> UInt32 {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee
  }
  
  static func setUInt32(_ index: Int, _ value: UInt32, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
  }
  
  static func getInt32(_ index: Int, _ buffer: NSData) -> Int32 {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee
  }
  
  static func setInt32(_ index: Int, _ value: Int32, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
  }
  
  static func getFloat(_ index: Int, _ buffer: NSData) -> Float {
    buffer.bytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee
  }
  
  static func setFloat(_ index: Int, _ value: Float, _ buffer: NSMutableData) {
    buffer.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
  }
  
  
  // Mark: - resetAllBorders
  
  internal func resetAllBorders(){
    mBorderRender.resetAllBorders()
  }
  
  
  public var listStylePosition: ListStylePosition {
    get {
      return ListStylePosition(rawValue: getInt8(StyleKeys.LIST_STYLE_POSITION))!
    }
    set {
      prepareMut()
      setUInt8(StyleKeys.LIST_STYLE_POSITION, UInt8(newValue.rawValue))
      setUInt8(StyleKeys.LIST_STYLE_POSITION_STATE, StyleState.SET)
      // todo state
    }
  }
  
  
  public var listStyleType: ListStyleType {
    get {
      return ListStyleType(rawValue: getInt8(StyleKeys.LIST_STYLE_TYPE))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.LIST_STYLE_TYPE, newValue.rawValue)
      setInt8(StyleKeys.LIST_STYLE_TYPE_STATE, Int8(StyleState.SET))
      // todo state
    }
  }
  
  
  // MARK: - zIndex
  
  public var zIndex: Int32 {
    get {
      return getInt32(StyleKeys.Z_INDEX)
    }
    set {
      prepareMut()
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
      prepareMut()
      setFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, newValue.offset)
      setUInt8(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, UInt8(newValue.align.rawValue))
      
      if(newValue.isPercent){
        setUInt8(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 1)
      }else {
        setUInt8(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0)
      }

      
      if(inBatch){
        setOrAppendState(StateKeys.verticalAlign)
      }else {
        notifyTextStyleChanged(StateKeys.verticalAlign)
      }
    }
  }
  
  
  // MARK: - ObjectFit
  public var objectFit: ObjectFit {
    get {
      return ObjectFit(rawValue: getInt8(StyleKeys.OBJECT_FIT))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.OBJECT_FIT, newValue.rawValue)
      setOrAppendState(.objectFit)
    }
  }
  
  
  // MARK: - Float
  public var float: MasonFloat {
    get {
      return MasonFloat(rawValue: getInt8(StyleKeys.FLOAT))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.FLOAT, newValue.rawValue)
      setOrAppendState(.float)
    }
  }
  
  
  public var clear: Clear {
    get {
      return Clear(rawValue: getInt8(StyleKeys.CLEAR))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.CLEAR, newValue.rawValue)
      setOrAppendState(.clear)
    }
  }
  
  
  // MARK: - Text Style Properties
  public var color: UInt32 {
    get {
      return getUInt32(StyleKeys.FONT_COLOR)
    }
    set {
      prepareMut()
      setUInt32(StyleKeys.FONT_COLOR, newValue)
      setUInt8(StyleKeys.FONT_COLOR_STATE, StyleState.SET)
      if(inBatch){
        setOrAppendState(StateKeys.color)
      }else {
        notifyTextStyleChanged(StateKeys.color)
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

  /// Resolve filter string with pseudo-aware cascade. Returns the active pseudo's filter string
  /// according to PSEUDO_CSS_ORDER, or the base `filter` if none set.
  internal var resolvedFilterString: String {
    // Check pseudo string storage on node (Swift-side) using cascade order
    for state in PSEUDO_CSS_ORDER.reversed() {
      if node.hasPseudo(state) {
        if let s = node.getPseudoString(state.rawValue, key: "filter"), !s.isEmpty {
          return s
        }
      }
    }
    return filter
  }

  /// Apply the resolved CSS filter to the given context/view.
  /// Call at the END of an element's draw(_:) so the filter covers
  /// background, text, and border uniformly (matching CSS semantics).
  internal func applyResolvedFilter(in context: CGContext, rect: CGRect, view: UIView? = nil) {
    let css = resolvedFilterString
    if css.isEmpty {
      if !mFilter.filters.isEmpty { mFilter.reset() }
      return
    }
    mFilter.parse(css: css)
    guard !mFilter.filters.isEmpty else { return }

    // Clip to border-radius so the overlay follows the element shape.
    context.saveGState()
    if mBorderRender.hasRadii() {
      let clipPath = mBorderRender.getClipPath(rect: rect, radius: mBorderRender.radius)
      context.addPath(clipPath.cgPath)
      context.clip()
    }

    if !mFilter.applyFast(in: context, rect: rect) {
      context.restoreGState()
      if let view = view {
        mFilter.apply(to: view)
      }
      return
    }
    context.restoreGState()
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
      return getUInt32(StyleKeys.BACKGROUND_COLOR)
    }
    set {
      prepareMut()
      setUInt32(StyleKeys.BACKGROUND_COLOR, newValue)
      setUInt8(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
      setUInt8(StyleKeys.BACKGROUND_COLOR_TYPE, 0)
      // change view as well ??
      // node.view?.backgroundColor = UIColor.colorFromARGB(newValue)
 
      if(inBatch){
        setOrAppendState(StateKeys.backgroundColor)
      }else {
        notifyTextStyleChanged(StateKeys.backgroundColor)
      }
    }
  }
  
  public func getBackgroundColor() -> String {
    if(getUInt8(StyleKeys.BACKGROUND_COLOR_STATE) != StyleState.SET){
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
    setFloat(StyleKeys.LINE_HEIGHT, value)
    setUInt8(StyleKeys.LINE_HEIGHT_STATE, StyleState.SET)
    if(!isRelative){
      setUInt8(StyleKeys.LINE_HEIGHT_TYPE, 1)
    }else {
      setUInt8(StyleKeys.LINE_HEIGHT_TYPE, 0)
    }
    
    if(inBatch){
      setOrAppendState(StateKeys.lineHeight)
    }else {
      notifyTextStyleChanged(StateKeys.lineHeight)
    }
  }
  
  
  public var lineHeight: Float {
    get {
      return getFloat(StyleKeys.LINE_HEIGHT)
    }
    set {
      setFloat(StyleKeys.LINE_HEIGHT, newValue)
      setUInt8(StyleKeys.LINE_HEIGHT_STATE, StyleState.SET)
      setUInt8(StyleKeys.LINE_HEIGHT_TYPE, 0)

      if(inBatch){
        setOrAppendState(StateKeys.lineHeight)
      }else {
        notifyTextStyleChanged(StateKeys.lineHeight)
      }
    }
  }
  
  public var letterSpacing: Float {
    get {
      return getFloat(StyleKeys.LETTER_SPACING)
    }
    set {
      setFloat(StyleKeys.LETTER_SPACING, newValue)
      setUInt8(StyleKeys.LETTER_SPACING_STATE, StyleState.SET)
      
      if(inBatch){
        setOrAppendState(StateKeys.letterSpacing)
      }else {
        notifyTextStyleChanged(StateKeys.letterSpacing)
      }
    }
  }

  public var fontVariantNumeric: FontVariantNumeric {
    get {
      return FontVariantNumeric(rawValue: getUInt8(StyleKeys.FONT_VARIANT_NUMERIC))
    }
    set {
      let old = getUInt8(StyleKeys.FONT_VARIANT_NUMERIC)
      if newValue.rawValue != old {
        setUInt8(StyleKeys.FONT_VARIANT_NUMERIC, newValue.rawValue)
        setUInt8(StyleKeys.FONT_VARIANT_NUMERIC_STATE, StyleState.SET)
    
        if(inBatch){
          setOrAppendState(StateKeys.fontVariantNumeric)
        }else {
          notifyTextStyleChanged(StateKeys.fontVariantNumeric)
        }
      }
    }
  }

  public var fontVariantNumericString: String {
    get { fontVariantNumeric.cssValue }
    set { fontVariantNumeric = FontVariantNumeric.parse(newValue) }
  }

  public var decorationColor: UInt32 {
    get {
      return getUInt32(StyleKeys.DECORATION_COLOR)
    }
    set {
      prepareMut()
      setUInt32(StyleKeys.DECORATION_COLOR, newValue)
      setUInt8(StyleKeys.DECORATION_COLOR_STATE, StyleState.SET)
      
      if(inBatch){
        setOrAppendState(StateKeys.decorationColor)
      }else {
        notifyTextStyleChanged(StateKeys.decorationColor)
      }
    }
  }
  
  public func setDecorationColor(ui color: UIColor) {
    decorationColor = color.toUInt32()
  }
  
  public func setDecorationColor(css color: String) {
    guard let color = UIColor(css: color) else {return}
    decorationColor = color.toUInt32()
  }
  
  
  
  public var decorationLine: DecorationLine {
    get {
      return DecorationLine(rawValue: getInt8(StyleKeys.DECORATION_LINE))!
    }
    set {
      setInt8(StyleKeys.DECORATION_LINE, newValue.rawValue)
      setUInt8(StyleKeys.DECORATION_LINE_STATE, StyleState.SET)
      
      if(inBatch){
        setOrAppendState(StateKeys.decorationLine)
      }else {
        notifyTextStyleChanged(StateKeys.decorationLine)
      }
    }
  }
  
  public var fontSize: Int32 {
    get {
      return getInt32(StyleKeys.FONT_SIZE)
    }
    set {
      setInt32(StyleKeys.FONT_SIZE, newValue)
      setUInt8(StyleKeys.FONT_SIZE_TYPE, 0)
      setUInt8(StyleKeys.FONT_SIZE_STATE, StyleState.SET)
 
      if(inBatch){
        setOrAppendState(StateKeys.fontSize)
      }else {
        notifyTextStyleChanged(StateKeys.fontSize)
      }
      
      syncFontMetrics()
    }
  }
  
  public func setFontStyle(_ style: FontStyle, _ slant: Int32){
    // slant ignored unless it's oblique
    
    let previous = fontStyle
    if(previous != style){
      
      setInt8(StyleKeys.FONT_STYLE_TYPE, style.rawValue)
      setUInt8(StyleKeys.FONT_STYLE_STATE, StyleState.SET)
      
      switch style {
      case .Normal:
        font.style = "normal"
        setInt32(StyleKeys.FONT_STYLE_SLANT, 0)
        break
      case .Italic:
        font.style = "italic"
        setInt32(StyleKeys.FONT_STYLE_SLANT, 0)
        break
      case .Oblique:
        font.style = "oblique"
        setInt32(StyleKeys.FONT_STYLE_SLANT, slant)
        break
      }
      
      if(inBatch){
        setOrAppendState(StateKeys.fontStyle)
      }else {
        notifyTextStyleChanged(StateKeys.fontStyle)
      }
    
    }
  }
  
  public var textJustify: TextJustify {
    get {
      return TextJustify(rawValue: getInt8(StyleKeys.TEXT_JUSTIFY))!
    }
    set {
      let previous = textJustify
      if(previous != newValue){
        
        setInt8(StyleKeys.TEXT_JUSTIFY, newValue.rawValue)
        setUInt8(StyleKeys.TEXT_JUSTIFY_STATE, StyleState.SET)
        
        if(inBatch){
          setOrAppendState(StateKeys.textJustify)
        }else {
          notifyTextStyleChanged(StateKeys.textJustify)
        }
        
      }
    }
  }
  
  internal var internalFontStyle: NSCFontStyle {
    let type = getInt8(StyleKeys.FONT_STYLE_TYPE)
    switch(type){
    case 0:
      return NSCFontStyle.normal
    case 1:
      return NSCFontStyle.italic
    case 2:
      let slant = getInt32(StyleKeys.FONT_STYLE_SLANT)
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
      switch(getInt32(StyleKeys.FONT_STYLE_TYPE)){
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
        setInt8(StyleKeys.FONT_STYLE_TYPE, newValue.rawValue)
        setUInt8(StyleKeys.FONT_STYLE_STATE, StyleState.SET)
        // reset to slant 0
        setInt32(StyleKeys.FONT_STYLE_SLANT, 0)
        
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
        invalidateResolvedFontCache()
        if(inBatch){
          setOrAppendState(StateKeys.fontStyle)
        }else {
          notifyTextStyleChanged(StateKeys.fontStyle)
        }
        syncFontMetrics()
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
        node.style.setInt32(StyleKeys.FONT_WEIGHT, Int32(newWeight.rawValue) )
        setUInt8(StyleKeys.FONT_WEIGHT_STATE, StyleState.SET)
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
        
        setUInt8(StyleKeys.FONT_FAMILY_STATE, StyleState.SET)
        invalidateResolvedFontCache()
        
        if(inBatch){
          setOrAppendState(StateKeys.fontFamily)
        }else {
          notifyTextStyleChanged(StateKeys.fontFamily)
        }
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
        setInt32(StyleKeys.FONT_WEIGHT, Int32(font.weight.rawValue))
        setUInt8(StyleKeys.FONT_WEIGHT_STATE, StyleState.SET)
        invalidateResolvedFontCache()
        if(inBatch){
          setOrAppendState(StateKeys.fontWeight)
        }else {
          notifyTextStyleChanged(StateKeys.fontWeight)
        }
        syncFontMetrics()
      }
    }
  }
  
  
  
  // Text overflow
  public var textOverflow: TextOverflow = .Clip {
    didSet {
      setInt32(StyleKeys.TEXT_OVERFLOW, textOverflow.rawValue)
      setUInt8(StyleKeys.TEXT_OVERFLOW_STATE, StyleState.SET)
      // Text overflow only affects rendering, not measurement
      if(inBatch){
        setOrAppendState(StateKeys.textOverflow)
      }else {
        notifyTextStyleChanged(StateKeys.textOverflow)
      }
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
      return TextTransform(rawValue: getInt8(StyleKeys.TEXT_TRANSFORM))!
    }
    set {
      setInt8(StyleKeys.TEXT_TRANSFORM, newValue.rawValue)
      setUInt8(StyleKeys.TEXT_TRANSFORM_STATE, StyleState.SET)
      if(inBatch){
        setOrAppendState(StateKeys.textTransform)
      }else {
        notifyTextStyleChanged(StateKeys.textTransform)
      }
    }
  }
  
  public var whiteSpace: WhiteSpace {
    get {
      return WhiteSpace(rawValue: getInt8(StyleKeys.WHITE_SPACE))!
    }
    set {
      setInt8(StyleKeys.WHITE_SPACE, newValue.rawValue)
      setUInt8(StyleKeys.WHITE_SPACE_STATE, StyleState.SET)
      if(inBatch){
        setOrAppendState(StateKeys.whiteSpace)
      }else {
        notifyTextStyleChanged(StateKeys.whiteSpace)
      }
    }
  }
  
  public var textWrap: TextWrap {
    get {
      return TextWrap(rawValue: getInt8(StyleKeys.TEXT_WRAP))!
    }
    set {
      setInt8(StyleKeys.TEXT_WRAP, newValue.rawValue)
      setUInt8(StyleKeys.TEXT_WRAP_STATE, StyleState.SET)
      if(inBatch){
        setOrAppendState(StateKeys.textWrap)
      }else {
        notifyTextStyleChanged(StateKeys.textWrap)
      }
    }
  }
  
  
  public var display: Display {
    get {
      let mode = DisplayMode(rawValue: getInt8(StyleKeys.DISPLAY_MODE))!
      switch mode {
      case .None:
        return Display(rawValue: getInt8(StyleKeys.DISPLAY))!
      case .Inline:
        return .Inline
      case .Box:
        switch Display(rawValue: getInt8(StyleKeys.DISPLAY))! {
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
      var value: Int8
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
      prepareMut()
      setInt8(StyleKeys.DISPLAY, value)
      setInt8(StyleKeys.DISPLAY_MODE, displayMode.rawValue)
      setOrAppendState(StateKeys.display.union(StateKeys.displayMode))
    }
  }
  
  public var position: Position {
    get {
      return Position(rawValue: getInt8(StyleKeys.POSITION))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.POSITION, newValue.rawValue)
      
      setOrAppendState(StateKeys.position)
    }
  }
  
  
  // TODO
  public var direction: Direction{
    get {
      return Direction(rawValue: getInt8(StyleKeys.POSITION))!
    }
    set {
      prepareMut()
      // todo
      setInt8(StyleKeys.POSITION, newValue.rawValue)
      
      setOrAppendState(StateKeys.direction)
      
    }
  }
  
  public var flexDirection: FlexDirection {
    get {
      return FlexDirection(rawValue: getInt8(StyleKeys.FLEX_DIRECTION))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.FLEX_DIRECTION, newValue.rawValue)
      
      setOrAppendState(StateKeys.flexDirection)
    }
  }
  
  
  public var flexWrap: FlexWrap{
    get {
      return FlexWrap(rawValue: getInt8(StyleKeys.FLEX_WRAP))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.FLEX_WRAP, newValue.rawValue)
      setOrAppendState(.flexWrap)
    }
  }
  
  public var overflowCompat: MasonOverflowPointCompat {
    get {
      return MasonOverflowPointCompat(Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_X))!, Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_Y))!)
    }
    set {
      prepareMut()
      updateIntField(offset: StyleKeys.OVERFLOW_X, value:  newValue.x.rawValue, state: .overflowX)
      updateIntField(offset: StyleKeys.OVERFLOW_Y, value:  newValue.y.rawValue, state: .overflowY)
    }
  }
  
  public var overflow: MasonPoint<Overflow> {
    get {
      return MasonPoint(Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_X))!, Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_Y))!)
    }
    set {
      prepareMut()
      updateIntField(offset: StyleKeys.OVERFLOW_X, value:  newValue.x.rawValue, state: .overflowX)
      updateIntField(offset: StyleKeys.OVERFLOW_Y, value:  newValue.y.rawValue, state: .overflowY)
    }
  }
  
  public var overflowX: Overflow{
    get {
      return Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_X))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.OVERFLOW_X, newValue.rawValue)
      setOrAppendState(.overflowX)
    }
  }
  
  public var overflowY: Overflow{
    get {
      return Overflow(rawValue: getInt8(StyleKeys.OVERFLOW_Y))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.OVERFLOW_Y, newValue.rawValue)
      setOrAppendState(.overflowY)
    }
  }
  
  public var alignItems: AlignItems {
    get {
      return AlignItems(rawValue: getInt8(StyleKeys.ALIGN_ITEMS))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.ALIGN_ITEMS, newValue.rawValue)
      setOrAppendState(.alignItems)
    }
  }
  
  public var alignSelf: AlignSelf  {
    get {
      return AlignSelf(rawValue: getInt8(StyleKeys.ALIGN_SELF))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.ALIGN_SELF, newValue.rawValue)
      setOrAppendState(.alignSelf)
    }
  }
  
  public var alignContent: AlignContent {
    get {
      return AlignContent(rawValue: getInt8(StyleKeys.ALIGN_CONTENT))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.ALIGN_CONTENT, newValue.rawValue)
      setOrAppendState(.alignContent)
    }
  }
  
  public var justifyItems: JustifyItems {
    get {
      return JustifyItems(rawValue: getInt8(StyleKeys.JUSTIFY_ITEMS))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.JUSTIFY_ITEMS, newValue.rawValue)
      setOrAppendState(.justifyItems)
    }
  }
  
  public var justifySelf:  JustifySelf {
    get {
      return JustifySelf(rawValue: getInt8(StyleKeys.JUSTIFY_SELF))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.JUSTIFY_SELF, newValue.rawValue)
      setOrAppendState(.justifySelf)
    }
  }
  
  public var justifyContent: JustifyContent {
    get {
      return JustifyContent(rawValue: getInt8(StyleKeys.JUSTIFY_CONTENT))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.JUSTIFY_CONTENT, newValue.rawValue)
      setOrAppendState(.justifyContent)
    }
  }
  
  public var inset: MasonRect<MasonLengthPercentageAuto>{
    get{
      var type = getInt8(StyleKeys.INSET_LEFT_TYPE)
      var value = getFloat(StyleKeys.INSET_LEFT_VALUE)
      
      let left = MasonLengthPercentageAuto.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.INSET_RIGHT_TYPE)
      value = getFloat(StyleKeys.INSET_RIGHT_VALUE)
      
      let right = MasonLengthPercentageAuto.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.INSET_TOP_TYPE)
      value = getFloat(StyleKeys.INSET_TOP_VALUE)
      
      let top = MasonLengthPercentageAuto.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.INSET_BOTTOM_TYPE)
      value = getFloat(StyleKeys.INSET_BOTTOM_VALUE)
      
      let bottom = MasonLengthPercentageAuto.fromValueType(value, type)!
      
      
      return MasonRect(top, right, bottom, left)
    }
    set {
      prepareMut()
      setInt8(StyleKeys.INSET_LEFT_TYPE, newValue.left.type)
      setFloat(StyleKeys.INSET_LEFT_VALUE, newValue.left.value)
      
      setInt8(StyleKeys.INSET_RIGHT_TYPE, newValue.right.type)
      setFloat(StyleKeys.INSET_RIGHT_VALUE, newValue.right.value)
      
      setInt8(StyleKeys.INSET_TOP_TYPE, newValue.top.type)
      setFloat(StyleKeys.INSET_TOP_VALUE, newValue.top.value)
      
      setInt8(StyleKeys.INSET_BOTTOM_TYPE, newValue.bottom.type)
      setFloat(StyleKeys.INSET_BOTTOM_VALUE, newValue.bottom.value)
      
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
    prepareMut()
    setInt8(StyleKeys.INSET_LEFT_TYPE, left.type)
    setFloat(StyleKeys.INSET_LEFT_VALUE, left.value)
    
    
    setOrAppendState(.inset)
  }
  
  public var leftInset: MasonLengthPercentageAuto {
    get {
      return inset.left
    }
    set {
      prepareMut()
      setInt8(StyleKeys.INSET_LEFT_TYPE, newValue.type)
      setFloat(StyleKeys.INSET_LEFT_VALUE, newValue.value)
      
      setOrAppendState(.inset)
    }
  }
  
  public func setInsetRight(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentageAuto(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.INSET_RIGHT_TYPE, right.type)
    setFloat(StyleKeys.INSET_RIGHT_VALUE, right.value)
    
    setOrAppendState(.inset)
  }
  
  public var rightInset: MasonLengthPercentageAuto {
    get {
      return inset.right
    }
    set {
      prepareMut()
      setInt8(StyleKeys.INSET_RIGHT_TYPE, newValue.type)
      setFloat(StyleKeys.INSET_RIGHT_VALUE, newValue.value)
      
      setOrAppendState(.inset)
    }
  }
  
  public func setInsetTop(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentageAuto(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.INSET_TOP_TYPE, top.type)
    setFloat(StyleKeys.INSET_TOP_VALUE, top.value)
    
    setOrAppendState(.inset)
  }
  
  public var topInset: MasonLengthPercentageAuto {
    get {
      return inset.top
    }
    set {
      prepareMut()
      setInt8(StyleKeys.INSET_TOP_TYPE, newValue.type)
      setFloat(StyleKeys.INSET_TOP_VALUE, newValue.value)
      
      setOrAppendState(.inset)
    }
  }
  
  public func setInsetBottom(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentageAuto(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.INSET_BOTTOM_TYPE, bottom.type)
    setFloat(StyleKeys.INSET_BOTTOM_VALUE, bottom.value)
    
    setOrAppendState(.inset)
  }
  
  public var bottomInset: MasonLengthPercentageAuto {
    get {
      return inset.bottom
    }
    set {
      prepareMut()
      setInt8(StyleKeys.INSET_BOTTOM_TYPE, newValue.type)
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
      var type = getInt8(StyleKeys.MARGIN_LEFT_TYPE)
      var value = getFloat(StyleKeys.MARGIN_LEFT_VALUE)
      
      let left = MasonLengthPercentageAuto.fromValueType(value, type)!
      
      
      type = getInt8(StyleKeys.MARGIN_RIGHT_TYPE)
      value =  getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
      
      let right = MasonLengthPercentageAuto.fromValueType(value, type)!
      
      
      type = getInt8(StyleKeys.MARGIN_TOP_TYPE)
      value =  getFloat(StyleKeys.MARGIN_TOP_VALUE)
      
      let top = MasonLengthPercentageAuto.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.MARGIN_BOTTOM_TYPE)
      value =  getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
      
      let bottom = MasonLengthPercentageAuto.fromValueType(value, type)!
      
      return MasonRect(top, right, bottom, left)
    }
    set {
      prepareMut()
      setInt8(Int(StyleKeys.MARGIN_LEFT_TYPE), newValue.left.type)
      setFloat(Int(StyleKeys.MARGIN_LEFT_VALUE), newValue.left.value)
      
      setInt8(Int(StyleKeys.MARGIN_RIGHT_TYPE), newValue.right.type)
      setFloat(Int(StyleKeys.MARGIN_RIGHT_VALUE), newValue.right.value)
      
      setInt8(Int(StyleKeys.MARGIN_TOP_TYPE), newValue.top.type)
      setFloat(Int(StyleKeys.MARGIN_TOP_VALUE), newValue.top.value)
      
      setInt8(Int(StyleKeys.MARGIN_BOTTOM_TYPE), newValue.bottom.type)
      setFloat(Int(StyleKeys.MARGIN_BOTTOM_VALUE), newValue.bottom.value)
      
      setOrAppendState(.margin)
    }
  }
  
  
  public var marginLeft: MasonLengthPercentageAuto {
    get{
      let type = getInt8(StyleKeys.MARGIN_LEFT_TYPE)
      let value = getFloat(StyleKeys.MARGIN_LEFT_VALUE)
      
      return MasonLengthPercentageAuto.fromValueType(value, type)!
    }
    set {
      prepareMut()
      setInt8(Int(StyleKeys.MARGIN_LEFT_TYPE), newValue.type)
      setFloat(Int(StyleKeys.MARGIN_LEFT_VALUE), newValue.value)
      setOrAppendState(.margin)
    }
  }
  
  public var marginTop: MasonLengthPercentageAuto {
    get{
      let type = getInt8(StyleKeys.MARGIN_TOP_TYPE)
      let value = getFloat(StyleKeys.MARGIN_TOP_VALUE)
      
      return MasonLengthPercentageAuto.fromValueType(value, type)!
    }
    set {
      prepareMut()
      setInt8(Int(StyleKeys.MARGIN_TOP_TYPE), newValue.type)
      setFloat(Int(StyleKeys.MARGIN_TOP_VALUE), newValue.value)
      setOrAppendState(.margin)
    }
  }
  
  public var marginRight: MasonLengthPercentageAuto {
    get{
      let type = getInt8(StyleKeys.MARGIN_RIGHT_TYPE)
      let value = getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
      
      return MasonLengthPercentageAuto.fromValueType(value, type)!
    }
    set {
      prepareMut()
      setInt8(Int(StyleKeys.MARGIN_RIGHT_TYPE), newValue.type)
      setFloat(Int(StyleKeys.MARGIN_RIGHT_VALUE), newValue.value)
      setOrAppendState(.margin)
    }
  }
  
  public var marginBottom: MasonLengthPercentageAuto {
    get{
      let type = getInt8(StyleKeys.MARGIN_BOTTOM_TYPE)
      let value = getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
      
      return MasonLengthPercentageAuto.fromValueType(value, type)!
    }
    set {
      prepareMut()
      setInt8(Int(StyleKeys.MARGIN_BOTTOM_TYPE), newValue.type)
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
    prepareMut()
    setInt8(Int(StyleKeys.MARGIN_LEFT_TYPE), left.type)
    setFloat(Int(StyleKeys.MARGIN_LEFT_VALUE), left.value)
    
    setOrAppendState(.margin)
  }
  
  public func setMarginRight(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentageAuto(value, type) else {return}
    prepareMut()
    setInt8(Int(StyleKeys.MARGIN_RIGHT_TYPE), right.type)
    setFloat(Int(StyleKeys.MARGIN_RIGHT_VALUE), right.value)
    
    setOrAppendState(.margin)
  }
  
  public func setMarginTop(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentageAuto(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.MARGIN_TOP_TYPE, top.type)
    setFloat(StyleKeys.MARGIN_TOP_VALUE, top.value)
    
    setOrAppendState(.margin)
  }
  
  public func setMarginBottom(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentageAuto(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.MARGIN_BOTTOM_TYPE, bottom.type)
    setFloat(StyleKeys.MARGIN_BOTTOM_VALUE, bottom.value)
    
    setOrAppendState(.margin)
  }
  
  public func setMarginWithValueType(_ value: Float, _ type: Int) {
    guard let margin = getLengthPercentageAuto(value, type) else {return}
    
    self.margin = MasonRect(margin, margin, margin, margin)
  }
  
  
  public var padding: MasonRect<MasonLengthPercentage> {
    get{
      var type = getInt8(StyleKeys.PADDING_LEFT_TYPE)
      var value = getFloat(StyleKeys.PADDING_LEFT_VALUE)
      
      let left = MasonLengthPercentage.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.PADDING_RIGHT_TYPE)
      value = getFloat(StyleKeys.PADDING_RIGHT_VALUE)
      
      let right = MasonLengthPercentage.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.PADDING_TOP_TYPE)
      value = getFloat(StyleKeys.PADDING_TOP_VALUE)
      
      let top = MasonLengthPercentage.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.PADDING_BOTTOM_TYPE)
      value = getFloat(StyleKeys.PADDING_BOTTOM_VALUE)
      
      let bottom = MasonLengthPercentage.fromValueType(value, type)!
      
      
      return MasonRect(top, right, bottom, left)
    }
    set {
      prepareMut()
      setInt8(StyleKeys.PADDING_LEFT_TYPE, newValue.left.type)
      setFloat(StyleKeys.PADDING_LEFT_VALUE, newValue.left.value)
      
      setInt8(StyleKeys.PADDING_RIGHT_TYPE, newValue.right.type)
      setFloat(StyleKeys.PADDING_RIGHT_VALUE, newValue.right.value)
      
      setInt8(StyleKeys.PADDING_TOP_TYPE, newValue.top.type)
      setFloat(StyleKeys.PADDING_TOP_VALUE, newValue.top.value)
      
      setInt8(StyleKeys.PADDING_BOTTOM_TYPE, newValue.bottom.type)
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
  
  
  public var paddingLeft: MasonLengthPercentage {
    get {
      return MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_LEFT_VALUE), getInt8(StyleKeys.PADDING_LEFT_TYPE))!
    }
    set {
      setPaddingLeft(newValue.value, Int(newValue.type))
    }
  }
  
  public var paddingTop: MasonLengthPercentage {
    get {
      return MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_TOP_VALUE), getInt8(StyleKeys.PADDING_TOP_TYPE))!
    }
    set {
      setPaddingTop(newValue.value, Int(newValue.type))
    }
  }
  
  public var paddingRight: MasonLengthPercentage {
    get {
      return MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_RIGHT_VALUE), getInt8(StyleKeys.PADDING_RIGHT_TYPE))!
    }
    set {
      setPaddingRight(newValue.value, Int(newValue.type))
    }
  }
  
  public var paddingBottom: MasonLengthPercentage {
    get {
      return MasonLengthPercentage.fromValueType(getFloat(StyleKeys.PADDING_BOTTOM_VALUE), getInt8(StyleKeys.PADDING_BOTTOM_TYPE))!
    }
    set {
      setPaddingBottom(newValue.value, Int(newValue.type))
    }
  }
  
  public func setPaddingLeft(_ value: Float, _ type: Int) {
    guard let left = getLengthPercentage(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.PADDING_LEFT_TYPE, left.type)
    setFloat(StyleKeys.PADDING_LEFT_VALUE, left.value)
    
    setOrAppendState(.padding)
  }
  
  public func setPaddingRight(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentage(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.PADDING_RIGHT_TYPE, right.type)
    setFloat(StyleKeys.PADDING_RIGHT_VALUE, right.value)
    
    setOrAppendState(.padding)
  }
  
  public func setPaddingTop(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentage(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.PADDING_TOP_TYPE, top.type)
    setFloat(StyleKeys.PADDING_TOP_VALUE, top.value)
    
    setOrAppendState(.padding)
  }
  
  public func setPaddingBottom(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentage(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.PADDING_BOTTOM_TYPE, bottom.type)
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
        setUInt8(StyleKeys.TEXT_SHADOW_STATE, StyleState.INHERIT)
      }else {
        setUInt8(StyleKeys.TEXT_SHADOW_STATE, StyleState.SET)
      }
      
      notifyTextStyleChanged(StateKeys.textShadow)
    }
  }

  internal var boxShadows: [BoxShadow] = []
  internal lazy var mBoxShadowRenderer: BoxShadowRenderer = {
    BoxShadowRenderer(style: self)
  }()
  
  /// Shadow layer for rendering outset shadows outside view bounds
  internal lazy var mShadowLayer: MasonShadowLayer = {
    MasonShadowLayer(style: self)
  }()
  private var shadowLayerAdded = false
  private weak var shadowLayerParent: CALayer?
  
  public var boxShadow: String = "" {
    didSet {
      boxShadows = ShadowParser.parseBoxShadow(style: self, value: boxShadow)
      
      if let view = node.view {
        let hasOutsetShadows = boxShadows.contains { !$0.inset }
        
        if hasOutsetShadows {
          // Add shadow layer to superview's layer so it can extend beyond view bounds
          // without affecting the view's own clipping
          if let superview = view.superview {
            if !shadowLayerAdded || shadowLayerParent !== superview.layer {
              mShadowLayer.removeFromSuperlayer()
              superview.layer.insertSublayer(mShadowLayer, at: 0)
              shadowLayerAdded = true
              shadowLayerParent = superview.layer
            }
            mShadowLayer.updateBounds(viewBounds: view.bounds, viewFrame: view.frame)
          }
        } else if shadowLayerAdded {
          mShadowLayer.isHidden = true
        }
        
        view.setNeedsDisplay()
      }
    }
  }
  
  /// Call this from layoutSubviews to update shadow layer bounds
  internal func updateShadowLayer(for bounds: CGRect) {
    guard let view = node.view else { return }
    let hasOutsetShadows = boxShadows.contains { !$0.inset }
    guard hasOutsetShadows else {
      if shadowLayerAdded {
        mShadowLayer.isHidden = true
      }
      return
    }

    // Add shadow layer on first layout if it wasn't added during boxShadow setter
    // (e.g. boxShadow was set before the view had a superview)
    if !shadowLayerAdded || shadowLayerParent !== view.superview?.layer {
      if let superview = view.superview {
        mShadowLayer.removeFromSuperlayer()
        superview.layer.insertSublayer(mShadowLayer, at: 0)
        shadowLayerAdded = true
        shadowLayerParent = superview.layer
      }
    }

    if shadowLayerAdded {
      mShadowLayer.updateBounds(viewBounds: bounds, viewFrame: view.frame)
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
  
  public var cornerShape: String {
    get {
      return _cornerShape
    }
    set {
      _cornerShape = newValue
      CSSBorderRenderer.parseCornerShape(self, newValue)
    }
  }
  private var _cornerShape: String = ""

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
      prepareMut()
      setInt8(StyleKeys.BORDER_LEFT_TYPE, newValue.left.type)
      setFloat(StyleKeys.BORDER_LEFT_VALUE, newValue.left.value)
      
      setInt8(StyleKeys.BORDER_RIGHT_TYPE, newValue.right.type)
      setFloat(StyleKeys.BORDER_RIGHT_VALUE, newValue.right.value)
      
      setInt8(StyleKeys.BORDER_TOP_TYPE, newValue.top.type)
      setFloat(StyleKeys.BORDER_TOP_VALUE, newValue.top.value)
      
      setInt8(StyleKeys.BORDER_BOTTOM_TYPE, newValue.bottom.type)
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
    prepareMut()
    setInt8(StyleKeys.BORDER_LEFT_TYPE, left.type)
    setFloat(StyleKeys.BORDER_LEFT_VALUE,  left.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderRightWidth(_ value: Float, _ type: Int) {
    guard let right = getLengthPercentage(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.BORDER_RIGHT_TYPE, right.type)
    setFloat(StyleKeys.BORDER_RIGHT_VALUE, right.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderTopWidth(_ value: Float, _ type: Int) {
    guard let top = getLengthPercentage(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.BORDER_TOP_TYPE, top.type)
    setFloat(StyleKeys.BORDER_TOP_VALUE, top.value)
    
    setOrAppendState(.border)
  }
  
  public func setBorderBottomWidth(_ value: Float, _ type: Int) {
    guard let bottom = getLengthPercentage(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.BORDER_TOP_TYPE, bottom.type)
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
      prepareMut()
      setFloat(StyleKeys.FLEX_GROW, newValue)
      setOrAppendState(.flexGrow)
    }
  }
  
  public var flexShrink: Float {
    get {
      return getFloat(StyleKeys.FLEX_SHRINK)
    }
    set {
      prepareMut()
      setFloat(StyleKeys.FLEX_SHRINK, newValue)
      setOrAppendState(.flexShrink)
    }
  }
  
  public var flexBasis: MasonDimension {
    get {
      let value = getFloat(StyleKeys.FLEX_BASIS_VALUE)
      switch(getInt8(StyleKeys.FLEX_BASIS_TYPE)){
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
      prepareMut()
      setInt8(StyleKeys.FLEX_BASIS_TYPE, newValue.type)
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
      prepareMut()
      setFloat(StyleKeys.SCROLLBAR_WIDTH, newValue.value)
      setOrAppendState(.scrollbarWidth)
    }
  }
  
  public func setScrollBarWidth(_ value: Float) {
    scrollBarWidth = MasonDimension.Points(value);
  }
  
  public var align: Align {
    get {
      return Align(rawValue: getInt8(StyleKeys.TEXT_ALIGN))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.TEXT_ALIGN, newValue.rawValue)
      setOrAppendState(StateKeys.align)
    }
  }
  
  public var textAlign: TextAlign {
    get {
      return TextAlign(rawValue: getInt8(StyleKeys.TEXT_ALIGN))!
    }
    set {
      setInt8(StyleKeys.TEXT_ALIGN, newValue.rawValue)
      setUInt8(StyleKeys.TEXT_ALIGN_STATE, StyleState.SET)
      setOrAppendState(StateKeys.textAlign)
    }
  }
  
  public var boxSizing: BoxSizing {
    get {
      return BoxSizing(rawValue: getInt8(StyleKeys.BOX_SIZING))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.BOX_SIZING, newValue.rawValue)
      setOrAppendState(.boxSizing)
    }
  }
  
  
  public var minSize: MasonSize<MasonDimension>{
    get{
      var type = getInt8(StyleKeys.MIN_WIDTH_TYPE)
      
      var value = getFloat(StyleKeys.MIN_WIDTH_VALUE)
      
      let width = MasonDimension.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.MIN_HEIGHT_TYPE)
      value = getFloat(StyleKeys.MIN_HEIGHT_VALUE)
      
      let height = MasonDimension.fromValueType(value, type)!
      
      return MasonSize(width, height)
    }
    set {
      prepareMut()
      setInt8(StyleKeys.MIN_WIDTH_TYPE, newValue.width.type)
      setFloat(StyleKeys.MIN_WIDTH_VALUE, newValue.width.value)
      
      setInt8(StyleKeys.MIN_HEIGHT_TYPE, newValue.height.type)
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
  
  public var minWidth: MasonDimension {
    get {
      return minSize.width
    }
    set {
      prepareMut()
      setInt8(StyleKeys.MIN_WIDTH_TYPE, newValue.type)
      setFloat(StyleKeys.MIN_WIDTH_VALUE, newValue.value)
  
      setOrAppendState(StateKeys.minSize)
    }
  }
  
  public var minHeight: MasonDimension {
    get {
      return minSize.height
    }
    set {
      prepareMut()
      setInt8(StyleKeys.MIN_HEIGHT_TYPE, newValue.type)
      setFloat(StyleKeys.MIN_HEIGHT_VALUE, newValue.value)
  
      setOrAppendState(StateKeys.minSize)
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
      
      var type = getInt8(StyleKeys.WIDTH_TYPE)
      
      var value = getFloat(StyleKeys.WIDTH_VALUE)
      
      let width = MasonDimension.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.HEIGHT_TYPE)
      
      value = getFloat(StyleKeys.HEIGHT_VALUE)
      
      let height = MasonDimension.fromValueType(value, type)!
      
      
      return MasonSize(width, height)
    }
    set {
      prepareMut()
      setInt8(StyleKeys.WIDTH_TYPE, newValue.width.type)
      setFloat(StyleKeys.WIDTH_VALUE, newValue.width.value)
      
      setInt8(StyleKeys.HEIGHT_TYPE, newValue.height.type)
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
      prepareMut()
      setInt8(StyleKeys.WIDTH_TYPE, newValue.dimension.type)
      setFloat(StyleKeys.WIDTH_VALUE, newValue.dimension.value)
      
      setOrAppendState(StateKeys.size)
    }
  }
  
  public var sizeCompatHeight: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: size.height)
    }
    
    set {
      prepareMut()
      setInt8(StyleKeys.HEIGHT_TYPE, newValue.dimension.type)
      setFloat(StyleKeys.HEIGHT_VALUE, newValue.dimension.value)
      setOrAppendState(StateKeys.size)
    }
  }
  
  public func setSizeWidth(_ value: Float, _ type: Int) {
    guard let width = getDimension(value, type) else {return}
    prepareMut()
    
    setInt8(StyleKeys.WIDTH_TYPE, width.type)
    setFloat(StyleKeys.WIDTH_VALUE, width.value)
    
    setOrAppendState(StateKeys.size)
  }
  
  public func setSizeHeight(_ value: Float, _ type: Int) {
    guard let height = getDimension(value, type) else {return}
    prepareMut()
    setInt8(StyleKeys.HEIGHT_TYPE, height.type)
    setFloat(StyleKeys.HEIGHT_VALUE, height.value)
    
    setOrAppendState(StateKeys.size)
  }
  
  public func setSizeWidth(_ width: MasonDimension) {
    prepareMut()
    setInt8(StyleKeys.WIDTH_TYPE, width.type)
    setFloat(StyleKeys.WIDTH_VALUE, width.value)
    
    setOrAppendState(StateKeys.size)
  }
  
  
  public func setSizeHeight(_ height: MasonDimension) {
    prepareMut()
    setInt8(StyleKeys.HEIGHT_TYPE, height.type)
    setFloat(StyleKeys.HEIGHT_VALUE, height.value)
    
    setOrAppendState(StateKeys.size)
  }
  
  public func setSizeWidthHeight(_ value: Float, _ type: Int) {
    guard let wh = getDimension(value, type) else {return}
    size = MasonSize(wh, wh)
  }
  
  
  
  public var width: MasonDimension {
    get {
      let type = getInt8(StyleKeys.WIDTH_TYPE)
      
      let value = getFloat(StyleKeys.WIDTH_VALUE)
      
      return MasonDimension.fromValueType(value, type)!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.WIDTH_TYPE, newValue.type)
      setFloat(StyleKeys.WIDTH_VALUE, newValue.value)
      
      setOrAppendState(StateKeys.size)
    }
  }
  
  
  public var height: MasonDimension {
    get {
      let type = getInt8(StyleKeys.HEIGHT_TYPE)
      
      let value = getFloat(StyleKeys.HEIGHT_VALUE)
      
      return MasonDimension.fromValueType(getFloat(StyleKeys.HEIGHT_VALUE), getInt8(StyleKeys.HEIGHT_TYPE))!
    }
    set {
      prepareMut()
      setInt8(StyleKeys.HEIGHT_TYPE, newValue.type)
      setFloat(StyleKeys.HEIGHT_VALUE, newValue.value)
      
      setOrAppendState(StateKeys.size)
    }
  }
  
  public var maxWidth: MasonDimension {
    get {
      return maxSize.width
    }
    set {
      prepareMut()
      setInt8(StyleKeys.MAX_WIDTH_TYPE, newValue.type)
      setFloat(StyleKeys.MAX_WIDTH_VALUE, newValue.value)
  
      setOrAppendState(StateKeys.maxSize)
    }
  }
  
  public var maxHeight: MasonDimension {
    get {
      return maxSize.height
    }
    set {
      prepareMut()
      setInt8(StyleKeys.MAX_HEIGHT_TYPE, newValue.type)
      setFloat(StyleKeys.MAX_HEIGHT_VALUE, newValue.value)
  
      setOrAppendState(StateKeys.maxSize)
    }
  }
  
  
  
  public var maxSize: MasonSize<MasonDimension>{
    get{
      var type = getInt8(StyleKeys.MAX_WIDTH_TYPE)
      
      var value = getFloat(StyleKeys.MAX_WIDTH_VALUE)
      
      let width = MasonDimension.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.MAX_HEIGHT_TYPE)
      
      value = getFloat(StyleKeys.MAX_HEIGHT_VALUE)
      
      let height = MasonDimension.fromValueType(value, type)!
      
      return MasonSize(width, height)
    }
    set {
      prepareMut()
      setInt8(StyleKeys.MAX_WIDTH_TYPE, newValue.width.type)
      setFloat(StyleKeys.MAX_WIDTH_VALUE, newValue.width.value)
      
      setInt8(StyleKeys.MAX_HEIGHT_TYPE, newValue.height.type)
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
      var type = getInt8(StyleKeys.GAP_ROW_TYPE)
      var value = getFloat(StyleKeys.GAP_ROW_VALUE)
      
      let width = MasonLengthPercentage.fromValueType(value, type)!
      
      type = getInt8(StyleKeys.GAP_COLUMN_TYPE)
      value = getFloat(StyleKeys.GAP_COLUMN_VALUE)
      
      let height = MasonLengthPercentage.fromValueType(value, type)!
      
      return MasonSize(width, height)
    }
    set {
      prepareMut()
      
      setInt8(StyleKeys.GAP_ROW_TYPE, newValue.width.type)
      
      setFloat(StyleKeys.GAP_ROW_VALUE, newValue.width.value)
      
      setInt8(StyleKeys.GAP_COLUMN_TYPE, newValue.height.type)
      
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
      prepareMut()
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
      return GridAutoFlow(rawValue: getInt8(StyleKeys.GRID_AUTO_FLOW))!
    }
    
    set {
      setInt8(StyleKeys.GRID_AUTO_FLOW, newValue.rawValue)
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
    if(inBatch || pendingInvalidation.contains(.invalidating) || pendingInvalidation.rawValue == 0){
      return
    }
    
    if (isSlowDirty) {
      updateTextStyle()
      
      if(isDirty == 0 && isDirtyHigh == 0){
        
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
        pendingInvalidation = pendingInvalidation.union(.invalidating)
        (node.view as? MasonElement)?.requestLayout()
        pendingInvalidation = .none
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
      
      if(isDirty > 0 || isDirtyHigh > 0){
        let state = StateKeys(low: isDirty, high: isDirtyHigh)
        if(state.contains(.zIndex)){
          element?.uiView.layer.zPosition = CGFloat(zIndex)
        }
      }
      
      isSlowDirty = false
      isDirty = 0
      isDirtyHigh = 0
      pendingInvalidation = pendingInvalidation.union(.invalidating)
      (node.view as? MasonElement)?.requestLayout()
      pendingInvalidation = .none
      return
    }
    
    if (isDirty != 0 || isDirtyHigh != 0) {
      
      let element = node.view as? MasonElement

       updateTextStyle()
      
      if(isDirty > 0){
        let state = StateKeys(low: isDirty, high: isDirtyHigh)
        if(state.contains(.zIndex)){
          element?.uiView.layer.zPosition = CGFloat(zIndex)
        }
      }
      
      isDirty = 0
      isDirtyHigh = 0
      pendingInvalidation = pendingInvalidation.union(.invalidating)
      element?.requestLayout()
      pendingInvalidation = .none
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
  
  private static func resolvedFontCacheKey(family: String, weight: NSCFontWeight, style: NSCFontStyle) -> UInt64 {
    var hasher = Hasher()
    hasher.combine(family)
    hasher.combine(weight)
    hasher.combine(style)
    return UInt64(bitPattern: Int64(hasher.finalize()))
  }
  
  internal func invalidateResolvedFontCache() {
    _cachedResolvedFont = nil
    _resolvedFontKey = 0
  }
  
  internal var resolvedFontFace: NSCFontFace {
    let familyState = getUInt8(StyleKeys.FONT_FAMILY_STATE)
    let weightState = getUInt8(StyleKeys.FONT_WEIGHT_STATE)
    let styleState = getUInt8(StyleKeys.FONT_STYLE_STATE)
    
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
      ?? NSCFontWeight(rawValue: Int(getInt32(StyleKeys.FONT_WEIGHT)))!
    } else {
      NSCFontWeight(rawValue: Int(getInt32(StyleKeys.FONT_WEIGHT)))!
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
    
    // Check one-slot cache
    let key = MasonStyle.resolvedFontCacheKey(family: baseFamily, weight: resolvedWeight, style: resolvedStyle)
    if let cached = _cachedResolvedFont, _resolvedFontKey == key {
      return cached
    }
    
    // Create a new FontFace with resolved properties and cache it
    let resolvedFont = NSCFontFace(family: baseFamily)
    resolvedFont.weight = resolvedWeight
    resolvedFont.style = resolvedStyle.cssValue
    _cachedResolvedFont = resolvedFont
    _resolvedFontKey = key
    
    return resolvedFont
  }
  
  // MARK: - Pseudo-aware resolution helpers

  /// Resolve a UInt32 property with pseudo-state overlay.
  /// Returns the base value unless an active pseudo buffer overrides it.
  /// Only reads from pseudo buffers where the property was explicitly marked via `markPseudoSet`.
  internal func resolvePseudoByte(_ valueKey: Int, _ stateKey: Int, _ base: UInt8, _ key: StateKeys) -> UInt8 {
    let mask = node.pseudoMask
    if mask == 0 { return base }
    var result = base
    for state in PSEUDO_CSS_ORDER {
      if (mask & state.rawValue) != 0 {
        if let buf = node.getPseudoBuffer(state.rawValue),
           buf.count > stateKey {
          let lowOfs = StyleKeys.PSEUDO_SET_MASK_LOW
          let highOfs = StyleKeys.PSEUDO_SET_MASK_HIGH
          guard buf.count >= highOfs + 8 else { continue }
          let base = buf.baseAddress!
          var setLow: UInt64 = 0
          var setHigh: UInt64 = 0
          memcpy(&setLow, base + lowOfs, 8)
          memcpy(&setHigh, base + highOfs, 8)
          let isSet = (setLow & key.low) != 0 || (setHigh & key.high) != 0
          if isSet {
            result = base.advanced(by: valueKey).pointee
          }
        }
      }
    }
    return result
  }

  internal func resolvePseudoUInt32(_ valueKey: Int, _ stateKey: Int, _ base: UInt32, _ key: StateKeys) -> UInt32 {
    let mask = node.pseudoMask
    if mask == 0 { return base }
    var result = base
    for state in PSEUDO_CSS_ORDER {
      if (mask & state.rawValue) != 0 {
        if let buf = node.getPseudoBuffer(state.rawValue),
           buf.count > stateKey {
          // Check if this property was explicitly set in the pseudo buffer
          let lowOfs = StyleKeys.PSEUDO_SET_MASK_LOW
          let highOfs = StyleKeys.PSEUDO_SET_MASK_HIGH
          guard buf.count >= highOfs + 8 else { continue }
          let base = buf.baseAddress!
          var setLow: UInt64 = 0
          var setHigh: UInt64 = 0
          memcpy(&setLow, base + lowOfs, 8)
          memcpy(&setHigh, base + highOfs, 8)
          let isSet = (setLow & key.low) != 0 || (setHigh & key.high) != 0
          if isSet {
            var val: UInt32 = 0
            memcpy(&val, base + valueKey, 4)
            result = val
          }
        }
      }
    }
    return result
  }

  // Resolved properties that handle inheritance
  internal var resolvedColor: UInt32 {
    let state = getUInt8(StyleKeys.FONT_COLOR_STATE)
    let base: UInt32 = if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedColor ?? getUInt32(StyleKeys.FONT_COLOR)
    } else {
      getUInt32(StyleKeys.FONT_COLOR)
    }
    return resolvePseudoUInt32(StyleKeys.FONT_COLOR, StyleKeys.FONT_COLOR_STATE, base, .color)
  }

  internal var resolvedFontSize: Int32 {
    let state = getUInt8(StyleKeys.FONT_SIZE_STATE)
    let type = getUInt8(StyleKeys.FONT_SIZE_TYPE)
    // PERCENT == 1
    if (type == StyleState.SET) {
      let parentFontSize = {
        if let parent = node.parent as? MasonTextNode, parent.style.isTextValueInitialized  {
          return parent.style.resolvedFontSize
        }else {
          return Constants.DEFAULT_FONT_SIZE
        }
      }()
      
      return resolvePercentageFontSize(parentFontSize, getInt32(StyleKeys.FONT_SIZE))
    }
    
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontSize ?? getInt32(StyleKeys.FONT_SIZE)
    } else {
      getInt32(StyleKeys.FONT_SIZE)
    }
  }
  
  internal func resolvePercentageFontSize(_ parentFontSize: Int32, _ percent: Int32) -> Int32 {
    let rawSize = getInt32(StyleKeys.FONT_SIZE)
    let percent = Float(rawSize) / 100
    return max(Int32((Float(parentFontSize) * percent).rounded(.up)), 0)
  }
  
  internal var resolvedFontWeight: NSCFontWeight  {
    let state = getUInt8(StyleKeys.FONT_WEIGHT_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontWeight
      ?? NSCFontWeight(rawValue: Int(getInt32(StyleKeys.FONT_WEIGHT)))!
    } else {
      NSCFontWeight(rawValue: Int(getInt32(StyleKeys.FONT_WEIGHT)))!
    }
  }
  
  internal var resolvedFontStyle: FontStyle{
    let state = getUInt8(StyleKeys.FONT_STYLE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedFontStyle ?? fontStyle
    } else {
      fontStyle
    }
  }
  
  internal var resolvedInternalFontStyle: NSCFontStyle{
    let state = getUInt8(StyleKeys.FONT_STYLE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedInternalFontStyle ?? internalFontStyle
    } else {
      internalFontStyle
    }
  }
  
  internal var resolvedBackgroundColor: UInt32 {
    // background-color is NOT inherited in CSS - each element has its own.
    // Only return the color if explicitly set on this element.
    let state = getUInt8(StyleKeys.BACKGROUND_COLOR_STATE)
    let base: UInt32 = if (state == StyleState.SET) {
      getUInt32(StyleKeys.BACKGROUND_COLOR)
    } else {
      0 // transparent - do not inherit from parent
    }
    return resolvePseudoUInt32(StyleKeys.BACKGROUND_COLOR, StyleKeys.BACKGROUND_COLOR_STATE, base, .backgroundColor)
  }
  
  internal var resolvedDecorationLine: DecorationLine {
    let state = getUInt8(StyleKeys.DECORATION_LINE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationLine ?? DecorationLine(rawValue:
                                                                            getInt8(StyleKeys.DECORATION_LINE)
      )!
    } else {
      DecorationLine(rawValue: getInt8(StyleKeys.DECORATION_LINE))!
    }
  }
  
  internal var resolvedDecorationColor: UInt32{
    let state = getUInt8(StyleKeys.DECORATION_COLOR_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationColor
      ?? getUInt32(StyleKeys.DECORATION_COLOR)
    } else {
      getUInt32(StyleKeys.DECORATION_COLOR)
    }
  }
  
  internal var resolvedDecorationStyle: DecorationStyle {
    let state = getUInt8(StyleKeys.DECORATION_STYLE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedDecorationStyle ?? DecorationStyle(rawValue:
                                                                              getInt8(StyleKeys.DECORATION_STYLE)
      )!
    } else {
      DecorationStyle(rawValue: getInt8(StyleKeys.DECORATION_STYLE))!
    }
  }
  
  internal var resolvedLetterSpacing: Float {
    let state = getUInt8(StyleKeys.LETTER_SPACING_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLetterSpacing
      ?? getFloat(StyleKeys.LETTER_SPACING)
    } else {
      getFloat(StyleKeys.LETTER_SPACING)
    }
  }

  internal var resolvedFontVariantNumeric: FontVariantNumeric {
    let state = getUInt8(StyleKeys.FONT_VARIANT_NUMERIC_STATE)
    let base: UInt8 = if state == StyleState.INHERIT {
      parentStyleWithTextValues?.resolvedFontVariantNumeric.rawValue
      ?? getUInt8(StyleKeys.FONT_VARIANT_NUMERIC)
    } else {
      getUInt8(StyleKeys.FONT_VARIANT_NUMERIC)
    }
    let pseudoRaw = resolvePseudoByte(StyleKeys.FONT_VARIANT_NUMERIC, StyleKeys.FONT_VARIANT_NUMERIC_STATE, base, .fontVariantNumeric)
    return FontVariantNumeric(rawValue: pseudoRaw)
  }

  internal var resolvedTextWrap: TextWrap{
    let state = getUInt8(StyleKeys.TEXT_WRAP_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextWrap ?? TextWrap(
        rawValue: getInt8(
          StyleKeys.TEXT_WRAP
        )
      )!
    } else {
      TextWrap(rawValue: getInt8(StyleKeys.TEXT_WRAP))!
    }
  }
  
  internal var resolvedWhiteSpace: WhiteSpace {
    let state = getUInt8(StyleKeys.WHITE_SPACE_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedWhiteSpace
      ?? WhiteSpace(rawValue: getInt8(StyleKeys.WHITE_SPACE))!
    } else {
      WhiteSpace(rawValue: getInt8(StyleKeys.WHITE_SPACE))!
    }
  }
  
  internal var resolvedTextTransform: TextTransform {
    let state = getUInt8(StyleKeys.TEXT_TRANSFORM_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextTransform
      ?? TextTransform(rawValue: getInt8(StyleKeys.TEXT_TRANSFORM))!
    } else {
      TextTransform(rawValue: getInt8(StyleKeys.TEXT_TRANSFORM))!
    }
  }
  
  internal var resolvedTextAlign: TextAlign{
    let state = getUInt8(StyleKeys.TEXT_ALIGN_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextAlign ?? TextAlign(
        rawValue: getInt8(
          StyleKeys.TEXT_ALIGN
        )
      )!
    } else {
      TextAlign(rawValue: getInt8(StyleKeys.TEXT_ALIGN))!
    }
  }
  
  internal var resolvedTextJustify: TextJustify {
    let state = getUInt8(StyleKeys.TEXT_JUSTIFY_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedTextJustify ?? TextJustify(
        rawValue: getInt8(
          StyleKeys.TEXT_JUSTIFY
        )
      )!
    } else {
      TextJustify(rawValue: getInt8(StyleKeys.TEXT_JUSTIFY))!
    }
  }
  
  internal var resolvedLineHeight: Float {
    let state = getUInt8(StyleKeys.LINE_HEIGHT_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLineHeight
      ?? getFloat(StyleKeys.LINE_HEIGHT)
    } else {
      getFloat(StyleKeys.LINE_HEIGHT)
    }
  }
  
  internal var resolvedLineHeightType: UInt8 {
    let state = getUInt8(StyleKeys.LINE_HEIGHT_STATE)
    return if (state == StyleState.INHERIT) {
      parentStyleWithTextValues?.resolvedLineHeightType
      ?? getUInt8(StyleKeys.LINE_HEIGHT_TYPE)
    } else {
      getUInt8(StyleKeys.LINE_HEIGHT_TYPE)
    }
  }
  
  
  // Reset methods
  func resetFontFamilyToInherit() {
    setUInt8(StyleKeys.FONT_FAMILY_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.fontFamily)
  }
  
  func resetFontWeightToInherit() {
    setUInt8(StyleKeys.FONT_WEIGHT_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.fontWeight)
  }
  
  func resetFontStyleToInherit() {
    setUInt8(StyleKeys.FONT_STYLE_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.fontWeight)
  }

  func resetFontVariantNumericToInherit() {
    setUInt8(StyleKeys.FONT_VARIANT_NUMERIC_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(StateKeys.fontVariantNumeric)
  }
}
