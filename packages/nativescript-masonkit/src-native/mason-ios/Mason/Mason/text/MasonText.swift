//
//  MasonText.swift
//  Mason
//
//  Created by Osei Fortune on 20/03/2025.
//

import Foundation
import UIKit
import CoreText

// MARK: - Helper Functions (top-level)
func measureBlock(text: NSAttributedString, maxWidth: CGFloat) -> CGSize {
  let framesetter = CTFramesetterCreateWithAttributedString(text)
  
  let constraintSize = CGSize(width: maxWidth, height: .greatestFiniteMagnitude)
  var suggestedSize = CTFramesetterSuggestFrameSizeWithConstraints(framesetter,
                                                                   CFRangeMake(0, text.length),
                                                                   nil,
                                                                   constraintSize,
                                                                   nil)
  
  let scale = CGFloat(NSCMason.scale)
  
  suggestedSize.width = suggestedSize.width * scale
  suggestedSize.height = suggestedSize.height * scale
  
  return suggestedSize
}

func measureInline(text: NSAttributedString) -> CGSize {
  let line = CTLineCreateWithAttributedString(text)
  
  var ascent: CGFloat = 0
  var descent: CGFloat = 0
  var leading: CGFloat = 0
  
  let scale = CGFloat(NSCMason.scale)
  
  
  let width = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, &leading)) * scale
  
  
  
  if let font = text.attribute(.font, at: 0, effectiveRange: nil) as? UIFont {
    return CGSize(width: width, height: font.lineHeight * scale)
  }
  
  let height = ceil(ascent + descent + leading) * scale
  
  return CGSize(width: width, height: height)
}

func normalizeNewlines(_ s: String) -> String {
  s.replacingOccurrences(of: #"\r?\n|\r"#, with: "\n", options: .regularExpression)
}

let collapsible = #"[ \t\u{000B}\u{000C}]"#
let collapsiblePlusLF = #"[ \t\u{000B}\u{000C}\n]+"#

func processPreLine(_ s: String, treatNBSPAsSpace: Bool = false) -> String {
  var t = normalizeNewlines(s)
  if treatNBSPAsSpace {
    // Optional: make NBSP behave like a normal space
    t = t.replacingOccurrences(of: "\u{00A0}", with: " ")
    // common “thin” non-breaking spaces from copy/paste:
      .replacingOccurrences(of: "\u{202F}", with: " ")
      .replacingOccurrences(of: "\u{2007}", with: " ")
  }
  // Trim collapsible spaces around newlines (space, tab, VT, FF)
  t = t.replacingOccurrences(of: #"[ \t\u{000B}\u{000C}]*\n[ \t\u{000B}\u{000C}]*"#,
                             with: "\n", options: .regularExpression)
  // Collapse remaining runs of collapsible spaces (NOT \n, NOT NBSP)
  t = t.replacingOccurrences(of: #"[ \t\u{000B}\u{000C}]+"#,
                             with: " ", options: .regularExpression)
  return t
}

// MARK: - Helper Classes
class ViewHelper {
  weak var view: UIView?
  let mason: NSCMason
  var image: UIImage?
  let node: MasonNode
  
  init(view: UIView, mason doc : NSCMason) {
    self.view = view
    mason = doc
    node = doc.nodeForView(view)
    updateImage()
  }
  
  
  func updateImage(_ afterScreenUpdates: Bool = true) {
    guard let view = view else { return }
    let layout =  node.computedLayout
    
    let size = CGSize(width: CGFloat(layout.width / NSCMason.scale), height:CGFloat( layout.height / NSCMason.scale))
    
    view.frame = CGRect(origin: view.frame.origin, size: size)
    
    if(afterScreenUpdates){
      let renderer = UIGraphicsImageRenderer(size: size)
      self.image = renderer.image { _ in
        view.drawHierarchy(in: view.bounds, afterScreenUpdates: afterScreenUpdates)
      }
      
    }else{
      let rendererFormat = UIGraphicsImageRendererFormat.default()
      rendererFormat.opaque = view.isOpaque
      
      
      self.image = UIGraphicsImageRenderer(size: view.bounds.size, format: rendererFormat).image { ctx in
        view.layer.render(in: ctx.cgContext)
      }
      
    }
    
  }
  
}

// MARK: - Constants & Enums
struct TextStyleKeys {
  static let COLOR = 0
  static let DECORATION_LINE = 4
  static let DECORATION_COLOR = 8
  static let TEXT_ALIGN = 12
  static let TEXT_JUSTIFY = 16
  static let BACKGROUND_COLOR = 20
  static let SIZE = 24
  static let TRANSFORM = 28
  static let FONT_STYLE_TYPE = 32
  static let FONT_STYLE_SLANT = 36
  static let TEXT_WRAP = 40
  static let WHITE_SPACE = 44
  static let TEXT_OVERFLOW = 48
}

struct TextStateKeys: OptionSet {
  let rawValue: UInt64
  
  init(rawValue: UInt64) {
    self.rawValue = rawValue
  }
  
  static let color         = TextStateKeys(rawValue: 1 << 0)
  static let decorationLine        = TextStateKeys(rawValue: 1 << 1)
  static let decorationColor       = TextStateKeys(rawValue: 1 << 2)
  static let textAlign   = TextStateKeys(rawValue: 1 << 3)
  static let textJustify        = TextStateKeys(rawValue: 1 << 4)
  static let backgroundColor       = TextStateKeys(rawValue: 1 << 5)
  static let size       = TextStateKeys(rawValue: 1 << 6)
  static let transform      = TextStateKeys(rawValue: 1 << 7)
  static let fontStyle       = TextStateKeys(rawValue: 1 << 8)
  static let fontStyleSlant    = TextStateKeys(rawValue: 1 << 9)
  static let textWrap    = TextStateKeys(rawValue: 1 << 10)
  static let whiteSpace    = TextStateKeys(rawValue: 1 << 11)
  static let textOverflow    = TextStateKeys(rawValue: 1 << 12)
}

let VIEW_PLACEHOLDER = "[[__view__]]"
let UNSET_COLOR = UInt32(0xDEADBEEF)

@objc(MasonTextType)
public enum MasonTextType: Int, RawRepresentable, CustomStringConvertible {
  case None
  case P
  case Span
  case Code
  case H1
  case H2
  case H3
  case H4
  case H5
  case H6
  case Li
  case Blockquote
  case B
  case Pre
  
  public typealias RawValue = Int32
  
  public var rawValue: RawValue {
    switch self {
    case .None:
      return 0
    case .P:
      return 1
    case .Span:
      return 2
    case .Code:
      return 3
    case .H1:
      return 4
    case .H2:
      return 5
    case .H3:
      return 6
    case .H4:
      return 7
    case .H5:
      return 8
    case .H6:
      return 9
    case .Li:
      return 10
    case .Blockquote:
      return 11
    case .B:
      return 12
    case .Pre:
      return 13
    }
  }
  
  
  public init?(rawValue: RawValue) {
    switch rawValue {
    case 0:
      self = .None
    case 1:
      self = .P
    case 2:
      self = .Span
    case 3:
      self = .Code
    case 4:
      self = .H1
    case 5:
      self = .H2
    case 6:
      self = .H3
    case 7:
      self = .H4
    case 8:
      self = .H5
    case 9:
      self = .H6
    case 10:
      self = .Li
    case 11:
      self = .Blockquote
    case 12:
      self = .B
    case 13:
      self = .Pre
    default:
      return nil
    }
  }
  
  var cssValue: String {
    switch self {
    case .None:
      return "text"
    case .P:
      return "p"
    case .Span:
      return "span"
    case .Code:
      return "code"
    case .H1:
      return "h1"
    case .H2:
      return "h2"
    case .H3:
      return "h3"
    case .H4:
      return "h4"
    case .H5:
      return "h5"
    case .H6:
      return "h6"
    case .Li:
      return "li"
    case .Blockquote:
      return "blockquote"
    case .B:
      return "b"
    case .Pre:
      return "pre"
    }
  }
  
  public var description: String {
    return cssValue
  }
}

public enum InlineSegmentPayload {
  case text(width: Float, ascent: Float, descent: Float)
  case inline(id: OpaquePointer, width: Float, height: Float, baseline: Float)
}

// MARK: - MasonText Main Class
@objc(MasonText)
@objcMembers
public class MasonText: UIView, MasonElement {
  // MARK: Properties
  public let node: MasonNode
  public let type: MasonTextType
  
  public internal(set) var textValues: NSMutableData = MasonText.createTextStyles()
  public internal(set) var font: NSCFontFace = NSCFontFace(family: "sans-serif")
  internal var paragraphStyle = NSMutableParagraphStyle()
  
  
  public var uiView: UIView {
    return self
  }
  
  // Weight tracking
  private var weight = UIFont.Weight.regular
  private var weightName = "normal"
  
  // Text overflow
  public var textOverflow: TextOverflow = .Clip {
    didSet {
      setInt32(TextStyleKeys.TEXT_OVERFLOW, textOverflow.rawValue)
      // Text overflow only affects rendering, not measurement
      setNeedsDisplay()
    }
  }
  
  public var textOverflowCompat: TextOverflowCompat {
    get {
      return TextOverflowCompat(flow: textOverflow)
    }
    set {
      textOverflow = newValue.flow
    }
  }
  
  private func getInt32(_ index: Int) -> Int32 {
    return textValues.bytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee
  }
  
  private func setInt32(_ index: Int, _ value: Int32) {
    textValues.mutableBytes.advanced(by: index).assumingMemoryBound(to: Int32.self).pointee = value
  }
  
  private func getUInt32(_ index: Int) -> UInt32 {
    return textValues.bytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee
  }
  
  private func setUInt32(_ index: Int, _ value: UInt32) {
    textValues.mutableBytes.advanced(by: index).assumingMemoryBound(to: UInt32.self).pointee = value
  }
  
  private func getFloat(_ index: Int) -> Float {
    return textValues.bytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee
  }
  
  private func setFloat(_ index: Int, _ value: Float) {
    textValues.mutableBytes.advanced(by: index).assumingMemoryBound(to: Float.self).pointee = value
  }
  
  
  private static func createTextStyles() -> NSMutableData{
    let data = NSMutableData(length: Int(TextStyleKeys.TEXT_OVERFLOW) + 4)
    data?.mutableBytes.advanced(by: TextStyleKeys.COLOR).assumingMemoryBound(to: UInt32.self).pointee = 0xFF000000
    data?.mutableBytes.advanced(by: TextStyleKeys.BACKGROUND_COLOR).assumingMemoryBound(to: UInt32.self).pointee = 0
    data?.mutableBytes.advanced(by: TextStyleKeys.DECORATION_COLOR).assumingMemoryBound(to: UInt32.self).pointee = UNSET_COLOR
    data?.mutableBytes.advanced(by: TextStyleKeys.SIZE).assumingMemoryBound(to: Float.self).pointee = 16
    data?.mutableBytes.advanced(by: TextStyleKeys.TEXT_WRAP).assumingMemoryBound(to: Int32.self).pointee = 0
    
    return data!
  }
  
  // MARK: Initialization
  public init(mason: NSCMason, type textType: MasonTextType){
    node = mason.createTextNode()
    type = textType
    super.init(frame: .zero)
    initText()
  }
  
  public init(mason: NSCMason) {
    node = mason.createTextNode()
    type = .None
    super.init(frame: .zero)
    initText()
  }

  
  internal init(mason: NSCMason, isAnonymous: Bool) {
    node = mason.createTextNode()
    type = .None
    super.init(frame: .zero)
    self.node.isAnonymous = isAnonymous
    initText()
  }
  
  
  private func initText(){
    isOpaque = false
    node.view = self
    node.measureFunc = { known, available in
      return MasonText.measure(self, known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
    let scale = NSCMason.scale
    node.inBatch = true
    switch(type){
    case .None:
      // noop
      break
    case .P:
      break
    case .Span:
      break
    case .Code:
      break
    case .H1:
      fontSize = 32
      font.weight = .bold
      node.style.margin = MasonRect(.Points(0), .Points(0), .Points(16 * scale), .Points(16 * scale))
      paragraphStyle.paragraphSpacing = CGFloat( 8 * scale)
      break
    case .H2:
      fontSize = 24
      font.weight = .bold
      node.style.margin = MasonRect(.Points(0), .Points(0), .Points(14 * scale), .Points(14 * scale))
      paragraphStyle.paragraphSpacing = CGFloat( 7 * scale)
      break
    case .H3:
      fontSize = 18
      font.weight = .bold
      node.style.margin = MasonRect(.Points(0), .Points(0), .Points(12 * scale), .Points(12 * scale))
      paragraphStyle.paragraphSpacing = CGFloat( 6 * scale)
      break
    case .H4:
      fontSize = 16
      font.weight = .bold
      node.style.margin = MasonRect(.Points(0), .Points(0), .Points(10 * scale), .Points(10 * scale))
      paragraphStyle.paragraphSpacing = CGFloat( 5 * scale)
      break
    case .H5:
      fontSize = 13
      font.weight = .bold
      node.style.margin = MasonRect(.Points(0), .Points(0), .Points(8 * scale), .Points(8 * scale))
      paragraphStyle.paragraphSpacing = CGFloat( 4 * scale)
      break
    case .H6:
      fontSize = 10
      font.weight = .bold
      node.style.margin = MasonRect(.Points(0), .Points(0), .Points(6 * scale), .Points(6 * scale))
      paragraphStyle.paragraphSpacing = CGFloat( 3 * scale)
      break
    case .Li:
      break
    case .Blockquote:
      font.style = "italic"
      let indent: Float = 40 * scale
      
      node.style.margin = MasonRect(.Points(indent), .Points(0), .Points(indent), .Points(0))
      paragraphStyle.headIndent = CGFloat(40)
      paragraphStyle.firstLineHeadIndent =  CGFloat(40)
      
      break
    case .B:
      font.weight = .bold
      break
    case .Pre:
      font = NSCFontFace(family: "ui-monospace")
      whiteSpace = .Pre
      break
    }
    
    font.loadSync { _ in }
    
    node.inBatch = false
  }
  
  /*
   
   // MARK: Storage Helpers
   private static func measure(_ view: MasonText, _ known: CGSize?, _ available: CGSize) -> CGSize {
   // Build attributed string on-demand from text nodes
   let text = view.buildAttributedString()
   
   if let known = known {
   if (!known.width.isNaN && known.width >= 0) && (!known.height.isNaN && known.height >= 0) {
   return known
   }
   }
   
   var maxWidth = CGFloat.greatestFiniteMagnitude
   
   if view.textWrap != .NoWrap && available.width.isFinite && available.width > 0 {
   if !available.width.isNaN && available.width > 0 {
   maxWidth = available.width / CGFloat(NSCMason.scale)
   }
   }
   
   // Create framesetter and frame to collect segments
   let framesetter = CTFramesetterCreateWithAttributedString(text)
   let constraintSize = CGSize(width: maxWidth, height: .greatestFiniteMagnitude)
   let path = CGPath(rect: CGRect(origin: .zero, size: constraintSize), transform: nil)
   let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)
   
   // IMPORTANT: Collect and push segments to Rust BEFORE returning size
   // This ensures Rust's inline layout has the segments it needs
   view.collectAndCacheSegments(from: frame)
   
   // Now calculate the size
   var size = CTFramesetterSuggestFrameSizeWithConstraints(
   framesetter,
   CFRangeMake(0, text.length),
   nil,
   constraintSize,
   nil
   )
   
   let scale = CGFloat(NSCMason.scale)
   size.width = size.width * scale
   size.height = size.height * scale
   
   if let known = known {
   if !known.width.isNaN && known.width >= 0 {
   size.width = known.width
   }
   
   if !known.height.isNaN && known.height >= 0 {
   size.height = known.height
   }
   }
   
   return size
   }
   
   */
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  
  // MARK: - Text Style Properties (Refactored)
  public var color: UInt32 {
    get {
      return getUInt32(TextStyleKeys.COLOR)
    }
    set {
      setUInt32(TextStyleKeys.COLOR, newValue)
      
      // Update all text nodes with new color
      for child in node.children {
        if let textNode = child as? MasonTextNode {
          var attrs = textNode.attributes
          attrs[.foregroundColor] = UIColor.colorFromARGB(newValue)
          textNode.attributes = attrs
        }
      }
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  public var backgroundColorValue: UInt32 {
    get {
      return getUInt32(TextStyleKeys.BACKGROUND_COLOR)
    }
    set {
      setUInt32(TextStyleKeys.BACKGROUND_COLOR, newValue)
      
      // Update all text nodes with new background color
      for child in node.children {
        if let textNode = child as? MasonTextNode {
          var attrs = textNode.attributes
          if newValue != 0 {
            attrs[.backgroundColor] = UIColor.colorFromARGB(newValue)
          } else {
            attrs.removeValue(forKey: .backgroundColor)
          }
          textNode.attributes = attrs
        }
      }
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  public func setColor(ui color: UIColor) {
    self.color = color.toUInt32()
  }
  
  public func setBackgroundColor(ui color: UIColor) {
    self.backgroundColorValue = color.toUInt32()
  }
  
  public var decorationColor: UInt32 {
    get {
      return getUInt32(TextStyleKeys.DECORATION_COLOR)
    }
    set {
      setUInt32(TextStyleKeys.DECORATION_COLOR, newValue)
      updateDecorationOnTextNodes()
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  public func setDecorationColor(ui color: UIColor) {
    self.decorationColor = color.toUInt32()
  }
  
  public var decorationLine: DecorationLine {
    get {
      return DecorationLine(rawValue: getInt32(TextStyleKeys.DECORATION_LINE))!
    }
    set {
      setInt32(TextStyleKeys.DECORATION_LINE, newValue.rawValue)
      updateDecorationOnTextNodes()
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  private func updateDecorationOnTextNodes() {
    let line = decorationLine
    let color = decorationColor
    
    var decorationColor = UIColor.colorFromARGB(color)
    if color == UNSET_COLOR {
      decorationColor = UIColor.colorFromARGB(self.color)
    }
    
    for child in node.children {
      if let textNode = child as? MasonTextNode {
        var attrs = textNode.attributes
        
        // Remove existing decoration
        attrs.removeValue(forKey: .underlineStyle)
        attrs.removeValue(forKey: .underlineColor)
        attrs.removeValue(forKey: .strikethroughStyle)
        attrs.removeValue(forKey: .strikethroughColor)
        
        // Apply new decoration
        if line == .Underline {
          attrs[.underlineStyle] = NSUnderlineStyle.single.rawValue
          attrs[.underlineColor] = decorationColor
        } else if line == .LineThrough {
          attrs[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
          attrs[.strikethroughColor] = decorationColor
        }
        
        textNode.attributes = attrs
      }
    }
  }
  
  public var fontSize: CGFloat {
    get {
      return CGFloat(getFloat(TextStyleKeys.SIZE))
    }
    set {
      setFloat(TextStyleKeys.SIZE, Float(newValue))
      updateFontOnTextNodes()
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  public var fontStyle: FontStyle {
    get {
      return FontStyle(rawValue: getInt32(TextStyleKeys.FONT_STYLE_TYPE))!
    }
    set {
      setInt32(TextStyleKeys.FONT_STYLE_TYPE, newValue.rawValue)
      setInt32(TextStyleKeys.FONT_STYLE_SLANT, 0)
      updateFontOnTextNodes()
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  public func setFontStyle(_ style: FontStyle, slant: Int32) {
    setInt32(TextStyleKeys.FONT_STYLE_TYPE, style.rawValue)
    setInt32(TextStyleKeys.FONT_STYLE_SLANT, slant)
    updateFontOnTextNodes()
    
    invalidateInlineSegments()
    if !node.inBatch {
      node.markDirty()
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
      case "ultralight":
        weight = .ultraLight
        weightName = "ultralight"
      case "light":
        weight = .light
        weightName = "light"
      case "normal":
        weight = .regular
        weightName = "normal"
      case "medium":
        weight = .medium
        weightName = "medium"
      case "semibold":
        weight = .semibold
        weightName = "semibold"
      case "bold":
        weight = .bold
        weightName = "bold"
      case "heavy":
        weight = .heavy
        weightName = "heavy"
      case "black":
        weight = .black
        weightName = "black"
      default:
        if let weight = Int(newValue, radix: 10) {
          if weight >= 100 && weight <= 1000 {
            weightName = newValue
            switch weight {
            case 100..<200:
              self.weight = .thin
            case 200..<300:
              self.weight = .ultraLight
            case 300..<400:
              self.weight = .light
            case 400..<500:
              self.weight = .regular
            case 500..<600:
              self.weight = .medium
            case 600..<700:
              self.weight = .semibold
            case 700..<800:
              self.weight = .bold
            case 800..<900:
              self.weight = .heavy
            case 900..<1000:
              self.weight = .black
            default:
              break
            }
          }
        }
      }
      
      if previous != weightName {
        updateFontOnTextNodes()
        invalidateInlineSegments()
        if !node.inBatch {
          node.markDirty()
        }
      }
    }
  }
  
  private func updateFontOnTextNodes() {
    let ctFont = CTFontCreateWithGraphicsFont(font.font!, fontSize, nil, nil)
    
    for child in node.children {
      if let textNode = child as? MasonTextNode {
        var attrs = textNode.attributes
        attrs[.font] = ctFont
        textNode.attributes = attrs
      }
    }
  }
  
  public var textTransform: TextTransform {
    get {
      return TextTransform(rawValue: getInt32(TextStyleKeys.TRANSFORM))!
    }
    set {
      setInt32(TextStyleKeys.TRANSFORM, newValue.rawValue)
      applyTextTransformToNodes(newValue)
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  private func applyTextTransformToNodes(_ transform: TextTransform) {
    for child in node.children {
      if let textNode = child as? MasonTextNode {
        let transformed = applyTransform(textNode.data, transform)
        textNode.data = transformed
      }
    }
  }
  
  private func applyTransform(_ text: String, _ transform: TextTransform) -> String {
    switch transform {
    case .None:
      return text
    case .Capitalize:
      return text.capitalized
    case .Uppercase:
      return text.uppercased()
    case .Lowercase:
      return text.lowercased()
    case .FullWidth:
      return fullWidthTransformed(text)
    case .FullSizeKana:
      return text.applyingTransform(.fullwidthToHalfwidth, reverse: true) ?? text
    case .MathAuto:
      // TODO: implement proper math transform
      return text
    }
  }
  
  public var whiteSpace: WhiteSpace {
    get {
      return WhiteSpace(rawValue: getInt32(TextStyleKeys.WHITE_SPACE))!
    }
    set {
      setInt32(TextStyleKeys.WHITE_SPACE, newValue.rawValue)
      updateParagraphStyleForWhiteSpace(newValue)
      applyWhiteSpaceToNodes(newValue)
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  private func applyWhiteSpaceToNodes(_ whiteSpace: WhiteSpace) {
    for child in node.children {
      if let textNode = child as? MasonTextNode {
        let processed = processWhiteSpace(textNode.data, whiteSpace)
        textNode.data = processed
        
        var attrs = textNode.attributes
        attrs[.paragraphStyle] = paragraphStyle
        textNode.attributes = attrs
      }
    }
  }
  
  private func processWhiteSpace(_ text: String, _ whiteSpace: WhiteSpace) -> String {
    switch whiteSpace {
    case .Normal:
      return normalizeNewlines(text)
        .replacingOccurrences(of: collapsiblePlusLF, with: " ", options: .regularExpression)
    case .Pre:
      return normalizeNewlines(text)
    case .PreWrap:
      return normalizeNewlines(text)
    case .PreLine:
      return processPreLine(text, treatNBSPAsSpace: false)
    case .Nowrap:
      return normalizeNewlines(text)
        .replacingOccurrences(of: collapsiblePlusLF, with: " ", options: .regularExpression)
    }
  }
  
  private func updateParagraphStyleForWhiteSpace(_ whiteSpace: WhiteSpace) {
    switch whiteSpace {
    case .Normal:
      paragraphStyle.lineBreakMode = (textWrap == .NoWrap) ? .byClipping : .byWordWrapping
    case .Pre:
      paragraphStyle.lineBreakMode = .byClipping
    case .PreWrap:
      paragraphStyle.lineBreakMode = .byWordWrapping
    case .PreLine:
      paragraphStyle.lineBreakMode = .byWordWrapping
      paragraphStyle.headIndent = 0
      paragraphStyle.firstLineHeadIndent = 0
      paragraphStyle.tailIndent = 0
    case .Nowrap:
      paragraphStyle.lineBreakMode = .byClipping
    }
  }
  
  public var textWrap: TextWrap {
    get {
      return TextWrap(rawValue: getInt32(TextStyleKeys.TEXT_WRAP))!
    }
    set {
      setInt32(TextStyleKeys.TEXT_WRAP, newValue.rawValue)
      updateParagraphStyleForTextWrap(newValue)
      
      // Update paragraph style on all text nodes
      for child in node.children {
        if let textNode = child as? MasonTextNode {
          var attrs = textNode.attributes
          attrs[.paragraphStyle] = paragraphStyle
          textNode.attributes = attrs
        }
      }
      
      invalidateInlineSegments()
      if !node.inBatch {
        node.markDirty()
      }
    }
  }
  
  private func updateParagraphStyleForTextWrap(_ textWrap: TextWrap) {
    paragraphStyle.lineBreakMode = (textWrap == .NoWrap) ? .byClipping : .byWordWrapping
  }
  
  private func getDecorationColor() -> UIColor {
    let decColor = decorationColor
    if decColor == UNSET_COLOR {
      return UIColor.colorFromARGB(color)
    }
    return UIColor.colorFromARGB(decColor)
  }
  
  public func invalidateStyle(_ state: Int64) {
    if state <= -1 {
      return
    }
    
    let textState = TextStateKeys(rawValue: UInt64(state))
    
    if textState.contains(.textAlign) {
      switch style.textAlign {
      case .Auto:
        paragraphStyle.alignment = .natural
      case .Left:
        paragraphStyle.alignment = .left
      case .Right:
        paragraphStyle.alignment = .right
      case .Center:
        paragraphStyle.alignment = .center
      case .Justify:
        paragraphStyle.alignment = .justified
      case .Start:
        paragraphStyle.alignment = .natural
      case .End:
        paragraphStyle.alignment = .natural
      }
      
      // Update paragraph style on all text nodes
      for child in node.children {
        if let textNode = child as? MasonTextNode {
          var attrs = textNode.attributes
          attrs[.paragraphStyle] = paragraphStyle
          textNode.attributes = attrs
        }
      }
    }
    
    if textState.contains(.backgroundColor) {
      // Already handled by backgroundColorValue setter
    }
    
    if textState.contains(.color) {
      // Already handled by color setter
    }
    
    if textState.contains(.decorationLine) || textState.contains(.decorationColor) {
      updateDecorationOnTextNodes()
    }
    
    if textState.contains(.fontStyle) || textState.contains(.size) {
      updateFontOnTextNodes()
    }
    
    // Any style change invalidates segments
    invalidateInlineSegments()
    
    if !node.inBatch {
      node.markDirty()
    }
  }
  
  /// Helper to get default text attributes for new text nodes
  public func getDefaultAttributes() -> [NSAttributedString.Key: Any] {
    var attrs: [NSAttributedString.Key: Any] = [:]
    
    // Font
    let ctFont = CTFontCreateWithGraphicsFont(font.font!, fontSize, nil, nil)
    attrs[.font] = ctFont
    
    // Color
    attrs[.foregroundColor] = UIColor.colorFromARGB(color)
    
    // Background color
    if backgroundColorValue != 0 {
      attrs[.backgroundColor] = UIColor.colorFromARGB(backgroundColorValue)
    }
    
    // Paragraph style
    attrs[.paragraphStyle] = paragraphStyle
    
    // Decoration
    if decorationLine == .Underline {
      attrs[.underlineStyle] = NSUnderlineStyle.single.rawValue
      attrs[.underlineColor] = getDecorationColor()
    } else if decorationLine == .LineThrough {
      attrs[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
      attrs[.strikethroughColor] = getDecorationColor()
    }
    
    return attrs
  }
  
  
  internal func fullWidthTransformed(_ string: String) -> String {
    let mapped = string.unicodeScalars.map { scalar in
      if scalar.value >= 0x21 && scalar.value <= 0x7E {
        let fullWidth = scalar.value + 0xFEE0
        return UnicodeScalar(fullWidth)!
      } else {
        return scalar
      }
    }
    
    return String(String.UnicodeScalarView(mapped))
  }
}

// MARK: - Layout & Measurement
extension MasonText {
  private static func measure(_ view: MasonText, _ known: CGSize?, _ available: CGSize) -> CGSize {
    
    // Build attributed string on-demand from text nodes
    let text = view.buildAttributedString()
    
    if let known = known {
      if (!known.width.isNaN && known.width >= 0) && (!known.height.isNaN && known.height >= 0) {
        return known
      }
    }
    
    var maxWidth = CGFloat.greatestFiniteMagnitude
    
    if view.textWrap != .NoWrap && available.width.isFinite && available.width > 0 {
      if !available.width.isNaN && available.width > 0 {
        maxWidth = available.width / CGFloat(NSCMason.scale)
      }
    }
    
    
    // Create framesetter and frame to collect segments
    let framesetter = CTFramesetterCreateWithAttributedString(text)
    let constraintSize = CGSize(width: maxWidth, height: .greatestFiniteMagnitude)
    let path = CGPath(rect: CGRect(origin: .zero, size: constraintSize), transform: nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)
    
    // IMPORTANT: Collect and push segments to Rust BEFORE returning size
    view.collectAndCacheSegments(from: frame)
    
    // Now calculate the size
    var size = CTFramesetterSuggestFrameSizeWithConstraints(
      framesetter,
      CFRangeMake(0, text.length),
      nil,
      constraintSize,
      nil
    )
    
    let scale = CGFloat(NSCMason.scale)
    size.width = size.width * scale
    size.height = size.height * scale
    
    if let known = known {
      if !known.width.isNaN && known.width >= 0 {
        size.width = known.width
      }
      
      if !known.height.isNaN && known.height >= 0 {
        size.height = known.height
      }
    }
    
    
    return size
  }
}

// MARK: - Layout Override
//extension MasonText {
//    public override func layoutSubviews() {
//        super.layoutSubviews()
//
//       // setNeedsDisplay()
//    }
//}

// MARK: - Drawing
extension MasonText {
  public override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext() else { return }
    
    context.textMatrix = .identity
    context.saveGState()
    context.translateBy(x: 0, y: bounds.height)
    context.scaleBy(x: 1.0, y: -1.0)
    
    // Build attributed string from text nodes and inline children
    let text = buildAttributedString()
    
    // Handle nowrap case
    if textWrap == .NoWrap {
      drawSingleLine(text: text, in: context)
      context.restoreGState()
      return
    }
    // Multi-line text
    drawMultiLine(text: text, in: context)
    context.restoreGState()
  }
  
  private func drawSingleLine(text: NSAttributedString, in context: CGContext) {
    let mutable = NSMutableAttributedString(attributedString: text)
    let fullRange = NSRange(location: 0, length: mutable.length)
    mutable.mutableString.replaceOccurrences(of: "\n", with: " ", options: [], range: fullRange)
    
    let line = CTLineCreateWithAttributedString(mutable)
    
    var ascent: CGFloat = 0
    var descent: CGFloat = 0
    var leading: CGFloat = 0
    let _ = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, &leading))
    
    var drawLine: CTLine = line
    
    // Apply text overflow truncation
    switch textOverflow {
    case .Ellipse(let value):
      let token = value ?? "..."
      let tokenAttr = NSAttributedString(
        string: token,
        attributes: text.length > 0 ? text.attributes(at: 0, effectiveRange: nil) : [:]
      )
      let tokenLine = CTLineCreateWithAttributedString(tokenAttr)
      if let truncated = CTLineCreateTruncatedLine(line, Double(bounds.width), .end, tokenLine) {
        drawLine = truncated
      }
    case .Custom(let value):
      let tokenAttr = NSAttributedString(
        string: value,
        attributes: text.length > 0 ? text.attributes(at: 0, effectiveRange: nil) : [:]
      )
      let tokenLine = CTLineCreateWithAttributedString(tokenAttr)
      if let truncated = CTLineCreateTruncatedLine(line, Double(bounds.width), .end, tokenLine) {
        drawLine = truncated
      }
    case .Clip:
      break
    }
    
    // Draw the line
    CTLineDraw(drawLine, context)
    
    // Draw inline attachments
    drawInlineAttachments(for: drawLine, origin: .zero, in: context)
  }
  
  private func drawMultiLine(text: NSAttributedString, in context: CGContext) {
    guard text.length > 0 else { return }
    
    let framesetter = CTFramesetterCreateWithAttributedString(text)
    
    var drawBounds = bounds
    
    // Apply padding
    let computedPadding = node.computedLayout.padding
    if !computedPadding.isEmpty() {
      let scale = NSCMason.scale
      let padding = UIEdgeInsets(
        top: CGFloat(computedPadding.top / scale),
        left: CGFloat(computedPadding.left / scale),
        bottom: CGFloat(computedPadding.bottom / scale),
        right: CGFloat(computedPadding.right / scale)
      )
      drawBounds = drawBounds.inset(by: padding)
    }
    
    guard drawBounds.width > 0 else {
      return
    }
    
    // Get the natural size the text wants to be
    let suggestedSize = CTFramesetterSuggestFrameSizeWithConstraints(
      framesetter,
      CFRangeMake(0, text.length),
      nil,
      CGSize(width: drawBounds.width, height: .greatestFiniteMagnitude),
      nil
    )
    
    // Create a frame with the FULL height needed for text layout
    // This ensures CoreText can layout all the text properly
    let layoutBounds = CGRect(
      x: drawBounds.origin.x,
      y: drawBounds.origin.y,
      width: drawBounds.width,
      height: max(drawBounds.height, suggestedSize.height) // Use larger height
    )
    
    let path = CGPath(rect: layoutBounds, transform: nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)
    
    // Clip to the ACTUAL bounds (like CSS overflow: hidden)
    context.saveGState()
    context.clip(to: drawBounds)
    
    // Draw text (will be clipped to drawBounds)
    CTFrameDraw(frame, context)
    
    context.restoreGState()
    
    // Draw inline attachments if visible
    guard let lines = CTFrameGetLines(frame) as? [CTLine], !lines.isEmpty else {
      return
    }
    
    var origins = [CGPoint](repeating: .zero, count: lines.count)
    CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &origins)
    
    // Only draw inline attachments that are within the visible bounds
    for (lineIndex, line) in lines.enumerated() {
      let origin = origins[lineIndex]
      
      // Check if this line is within visible bounds
      if origin.y >= drawBounds.minY && origin.y <= drawBounds.maxY {
        drawInlineAttachments(for: line, origin: origin, in: context)
      }
    }
  }
  
  private func drawInlineAttachments(for line: CTLine, origin: CGPoint, in context: CGContext) {
    let runs = CTLineGetGlyphRuns(line) as? [CTRun] ?? []
    
    for run in runs {
      let attrs = CTRunGetAttributes(run) as NSDictionary
      
      guard let helper = attrs[NSAttributedString.Key(VIEW_PLACEHOLDER)] as? ViewHelper else {
        continue
      }
      
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      var leading: CGFloat = 0
      let _ = CGFloat(CTRunGetTypographicBounds(run, CFRangeMake(0, 0), &ascent, &descent, &leading))
      
      let xOffset = CTLineGetOffsetForStringIndex(line, CTRunGetStringRange(run).location, nil)
      let x = origin.x + xOffset
      
      let runBounds = CGRect(
        x: x,
        y: origin.y,
        width: CGFloat(helper.node.computedLayout.width / NSCMason.scale),
        height: CGFloat(helper.node.computedLayout.height / NSCMason.scale)
      )
      
      helper.updateImage(false)
      
      if let image = helper.image?.cgImage {
        context.draw(image, in: runBounds)
      }
    }
  }
  
  /// Collect inline segments and push to Rust
  /// This is called during measure to provide segments before Rust's inline layout runs
  private func collectAndCacheSegments(from frame: CTFrame) {
    
    let lines = CTFrameGetLines(frame) as? [CTLine] ?? []
    
    guard !lines.isEmpty else {
      // Empty text - send empty segments
      if let ptr = node.nativePtr {
        var emptySegments: [CMasonSegment] = []
        mason_node_set_segments(node.mason.nativePtr, ptr, &emptySegments, 0)
      }
      segmentsNeedRebuild = false
      return
    }
    
    var segments: [CMasonSegment] = []
    let scale = CGFloat(NSCMason.scale)
    
    for (lineIndex, line) in lines.enumerated() {
      let runs = CTLineGetGlyphRuns(line) as? [CTRun] ?? []
      
      for (runIndex, run) in runs.enumerated() {
        var ascent: CGFloat = 0
        var descent: CGFloat = 0
        let width = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, &descent, nil))
        
        let attrs = CTRunGetAttributes(run) as NSDictionary
        
        // Check if this is an inline child placeholder
        if let helper = attrs[NSAttributedString.Key(VIEW_PLACEHOLDER)] as? ViewHelper {
          
          if let childPtr = helper.node.nativePtr {
            // Inline child segment
            var segment = CMasonSegment()
            segment.tag = InlineChild
            segment.inline_child.node = childPtr
            segment.inline_child.descent = Float(ascent * scale) // baseline
            segments.append(segment)
          } else {
            // todo warning
           //  print("collectAndCacheSegments - WARNING: helper.node has no nativePtr!")
          }
        } else {
          // Text segment
          var segment = CMasonSegment()
          segment.tag = Text
          segment.text.width = Float(width * scale)
          segment.text.ascent = Float(ascent * scale)
          segment.text.descent = Float(descent * scale)
          segments.append(segment)
        }
      }
    }
    
    if let ptr = node.nativePtr {
      mason_node_set_segments(node.mason.nativePtr, ptr, &segments, UInt(segments.count))
    }
    
    segmentsNeedRebuild = false
  }
}

private var kSegmentsNeedRebuildKey: UInt8 = 0

// MARK: - Invalidation
extension MasonText {
  
  
  /// Track whether segments are stale
  private var segmentsNeedRebuild: Bool {
    get {
      (objc_getAssociatedObject(self, &kSegmentsNeedRebuildKey) as? Bool) ?? true
    }
    set {
      objc_setAssociatedObject(self, &kSegmentsNeedRebuildKey, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
  }
  
  /// Mark segments as needing rebuild
  func invalidateInlineSegments() {
    segmentsNeedRebuild = true
    node.markDirty()
  }
  
  func invalidate() {
    invalidateInlineSegments()
    setNeedsDisplay()
  }
  
  /// Remove child from text container
  @discardableResult public func removeChild(_ child: MasonNode) -> MasonNode? {
    guard let index = node.children.firstIndex(where: { $0 === child }) else {
      return nil
    }
    
    // Remove from author tree
    node.children.remove(at: index)
    child.parent = nil
    
    // Remove from layout tree if it's a real node
    if let ptr = node.nativePtr, let childPtr = child.nativePtr {
      mason_node_remove_child(node.mason.nativePtr, ptr, childPtr)
    }
    
    invalidateInlineSegments()
    node.markDirty()
    return child
  }
  
  /// Insert child at specific index
  public func insertChild(_ child: MasonNode, at index: Int) {
    let idx = max(0, min(index, node.children.count))
    
    if let oldParent = child.parent, oldParent !== node {
      if let textParent = oldParent.view as? MasonText {
        textParent.removeChild(child)
      }
    }
    
    node.children.insert(child, at: idx)
    child.parent = node
    
    // Sync layout tree if it's a real node
    if child.nativePtr != nil {
      syncLayoutChildren()
    }
    
    invalidateInlineSegments()
    node.markDirty()
  }
  
  /// Sync layout children to Taffy (for bulk/insert operations)
//  private func syncLayoutChildren() {
//    guard let ptr = node.nativePtr else { return }
//    
//    // Filter to only children with nativePtr (inline elements)
//    let layoutChildren = node.children.filter { $0.nativePtr != nil }.compactMap { Optional($0.nativePtr) }
//    
//    // Replace Taffy children with the filtered set
//    mason_node_set_children(node.mason.nativePtr, ptr, layoutChildren, UInt(layoutChildren.count))
//  }
}

// MARK: - Run Delegate Callbacks (add before MasonText class)
// Remove RunDelegateData class entirely and use node directly

private func runDelegateDealloc(_ refCon: UnsafeMutableRawPointer) {
  Unmanaged<MasonNode>.fromOpaque(refCon).release()
}

private func runDelegateGetAscent(_ refCon: UnsafeMutableRawPointer) -> CGFloat {
  let node = Unmanaged<MasonNode>.fromOpaque(refCon).takeUnretainedValue()
  let scale = NSCMason.scale
  let height = CGFloat(node.computedLayout.height / scale)
  return height
}

private func runDelegateGetDescent(_ refCon: UnsafeMutableRawPointer) -> CGFloat {
  return 0
}

private func runDelegateGetWidth(_ refCon: UnsafeMutableRawPointer) -> CGFloat {
  let node = Unmanaged<MasonNode>.fromOpaque(refCon).takeUnretainedValue()
  let scale = NSCMason.scale
  let width = CGFloat(node.computedLayout.width / scale)
  return width
}

// MARK: - Attributed String Building
extension MasonText {
 
  /// Build attributed string from text nodes and inline children
   internal func buildAttributedString() -> NSAttributedString {
     let composed = NSMutableAttributedString()
     
     // Process all children in order
     for (index, child) in node.children.enumerated() {
       
       if let textNode = child as? MasonTextNode {
         // Pure text node: add its attributed string
         textNode.container = self
         let run = textNode.attributed()
         composed.append(run)
       } else if let childTextView = child.view as? MasonText {
         // ⚠️ Nested MasonText: check if it should be flattened
         if shouldFlattenTextContainer(childTextView) {
           // Recursively build the nested text's attributed string
           let nestedString = childTextView.buildAttributedString()
           composed.append(nestedString)
         } else {
           // Has view properties: treat as inline-block
           let placeholder = createPlaceholder(for: child)
           composed.append(placeholder)
         }
       } else if child.nativePtr != nil && (!child.style.isValueInitialized || child.style.display != .None) {
         // Regular inline element: create placeholder
         let placeholder = createPlaceholder(for: child)
         composed.append(placeholder)
       }
     }
     return composed
   }
   
   /// Decide whether to flatten a nested text container or treat it as inline-block
   private func shouldFlattenTextContainer(_ textView: MasonText) -> Bool {
     let style = textView.node.style
     
     // If style is not initialized, flatten by default
     guard style.isValueInitialized else {
       return true
     }
     
     // Check for view-like properties that require inline-block behavior
     let hasBackground =  textView.backgroundColor?.cgColor.alpha ?? 0 > 0 //style.backgroundColor.alpha > 0.0
     
     let border = style.border
     let hasBorder = border.top.value > 0.0 || border.right.value > 0.0 ||
     border.bottom.value > 0.0 || border.left.value > 0.0
     
     let padding = style.padding
     let hasPadding = padding.top.value > 0.0 || padding.right.value > 0.0 ||
                      padding.bottom.value > 0.0 || padding.left.value > 0.0
     
     let size = style.size
     let hasExplicitSize = size.width != .Auto || size.height != .Auto
     
     // If it has any view properties, treat as inline-block
     if hasBackground || hasBorder || hasPadding || hasExplicitSize {
       return false
     }
     
     // Only has text properties: flatten it
     return true
   }
  
  /// Create placeholder attributed string for inline child
  private func createPlaceholder(for child: MasonNode) -> NSAttributedString {
    guard let childView = child.view else {
      return NSAttributedString(string: "")
    }
    
    let helper = ViewHelper(view: childView, mason: node.mason)
    let delegate = createRunDelegate(node: child)
    
    let placeholder = NSMutableAttributedString(string: "\u{FFFC}") // Object replacement character
    placeholder.addAttribute(kCTRunDelegateAttributeName as NSAttributedString.Key,
                             value: delegate,
                             range: NSRange(location: 0, length: 1))
    placeholder.addAttribute(NSAttributedString.Key(VIEW_PLACEHOLDER),
                             value: helper,
                             range: NSRange(location: 0, length: 1))
  
    return placeholder
  }
  
  /// Create CTRunDelegate for inline child
  /// The node is retained and passed as refCon - callbacks will read current layout values
  private func createRunDelegate(node: MasonNode) -> CTRunDelegate {
    // Retain the node and pass it as refCon
    // The callbacks will read the node's computedLayout directly
    let refCon = Unmanaged.passRetained(node).toOpaque()
    
    var callbacks = CTRunDelegateCallbacks(
      version: kCTRunDelegateCurrentVersion,
      dealloc: runDelegateDealloc,
      getAscent: runDelegateGetAscent,
      getDescent: runDelegateGetDescent,
      getWidth: runDelegateGetWidth
    )
    
    return CTRunDelegateCreate(&callbacks, refCon)!
  }
}

// MARK: - Child Management
extension MasonText {
    public func addChild(_ child: MasonNode) {
        if let oldParent = child.parent, oldParent !== node {
            if let textParent = oldParent.view as? MasonText {
                textParent.removeChild(child)
            }
        }
        
        // Set container reference for text nodes FIRST
        if let textNode = child as? MasonTextNode {
            textNode.container = self
        }
        
        node.children.append(child)
        child.parent = node
        
        // For inline elements (non-text children), ensure they're in the layout tree
      if child.type != .text && child.nativePtr != nil && !(child.view is MasonText) {
            syncLayoutChildren()
        }
        
        invalidate()
    }
    
    private func syncLayoutChildren() {
        guard let ptr = node.nativePtr else {
            return
        }
        
        // Collect only real nodes (with nativePtr) for layout tree
        let layoutChildren = node.children.compactMap { child -> OpaquePointer? in
            if child.nativePtr != nil {
                return child.nativePtr
            } else {
                return nil
            }
        }
        
        var optionalChildren = layoutChildren.map { Optional($0) }
        mason_node_set_children(node.mason.nativePtr, ptr, &optionalChildren, UInt(optionalChildren.count))
    }
  /*
    
    @discardableResult
    public func removeChild(_ child: MasonNode) -> MasonNode? {
        guard let index = node.children.firstIndex(where: { $0 === child }) else {
            return nil
        }
        
        node.children.remove(at: index)
        child.parent = nil
        
        // Remove from view hierarchy if it's an inline element
        if child.type != .text {
            child.view?.removeFromSuperview()
        }
        
        // Sync layout tree
        if child.nativePtr != nil {
            syncLayoutChildren()
        }
        
        invalidate()
        return child
    }
    
    func invalidate() {
        invalidateInlineSegments()
        setNeedsDisplay()
    }
  */
}

// MARK: - Text Content Management
extension MasonText {
    /// Text content - sets or gets the concatenated text from all text nodes
    public var text: String {
        get {
            var result = ""
            for child in node.children {
                if let textNode = child as? MasonTextNode {
                    result += textNode.data
                }
            }
            return result
        }
        set {
            // Remove all existing children
            node.children.removeAll()
            
            // Create a single text node with the new text
            let textNode = MasonTextNode(mason: node.mason, data: newValue, attributes: getDefaultAttributes())
            textNode.container = self
            
            // Add to children
            node.children.append(textNode)
            textNode.parent = node
            
            // Clear layout tree (text nodes don't have nativePtr)
            if let ptr = node.nativePtr {
                mason_node_remove_children(node.mason.nativePtr, ptr)
            }
            
            invalidateInlineSegments()
            node.markDirty()
            setNeedsDisplay()
            setNeedsLayout()
        }
    }
    
    /// Append text to the container
    public func appendText(_ text: String) {
        
        // Check if last child is a text node - append to it
        if let lastTextNode = node.children.last as? MasonTextNode {
            lastTextNode.data += text
        } else {
            // Create new text node
            let textNode = MasonTextNode(mason: node.mason, data: text, attributes: getDefaultAttributes())
            textNode.container = self
            node.children.append(textNode)
            textNode.parent = node
        }
        
        invalidateInlineSegments()
        node.markDirty()
        setNeedsDisplay()
        setNeedsLayout()
    }
}
