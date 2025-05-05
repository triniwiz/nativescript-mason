//
//  MasonText.swift
//  Mason
//
//  Created by Osei Fortune on 20/03/2025.
//

import Foundation
import UIKit
import CoreText
let BLACK_COLOR = UInt32(bitPattern:-16777216)
let WHITE_COLOR = UInt32(bitPattern:-1)
extension UIColor {
  internal static let deviceCS = CGColorSpaceCreateDeviceRGB()
  internal static let greyCS = CGColorSpaceCreateDeviceGray()
  public static func colorFromARGB(_ argb: UInt32) -> UIColor {
    switch(argb){
    case BLACK_COLOR:
      return .black
    case WHITE_COLOR:
      return .white
    case 0:
      return .clear
    default:
      let a = CGFloat((argb >> 24) & 0xFF) / 255.0
      let r = CGFloat((argb >> 16) & 0xFF) / 255.0
      let g = CGFloat((argb >> 8) & 0xFF) / 255.0
      let b = CGFloat(argb & 0xFF) / 255.0
      
      return UIColor(cgColor: CGColor(srgbRed: r, green: g, blue: b, alpha: a))
    }
    
  }
  
  public static func colorFromRGBA(_ rgba: UInt32) -> UIColor {
    let r = CGFloat((rgba >> 24) & 0xFF) / 255.0
    let g = CGFloat((rgba >> 16) & 0xFF) / 255.0
    let b = CGFloat((rgba >> 8) & 0xFF) / 255.0
    let a = CGFloat(rgba & 0xFF) / 255.0
    
    return UIColor(cgColor: CGColor(srgbRed: r, green: g, blue: b, alpha: a))
  }
  
  
  public func toUInt32() -> UInt32 {
    var r: CGFloat = 0
    var g: CGFloat = 0
    var b: CGFloat = 0
    var a: CGFloat = 0
    
    self.getRed(&r, green: &g, blue: &b, alpha: &a)
    
    let red = UInt8(r * 255)
    let green = UInt8(g * 255)
    let blue = UInt8(b * 255)
    let alpha = UInt8(a * 255)
    
    let argb = (UInt32(alpha) << 24) | (UInt32(red) << 16) | (UInt32(green) << 8) | UInt32(blue)
    return argb
  }
  
}


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
  
  
  let height = (ascent + descent) * scale
  
  
  return CGSize(width: width, height: height)
}



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
    let layout = node.layout()
    
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

struct TextChild {
  var text: MasonText?
  var view: UIView?
  var attachment: NSMutableAttributedString?
  var attachmentView: ViewHelper?
}


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
    }
  }
  
  public var description: String {
    return cssValue
  }
}

@objc(MasonText)
@objcMembers
public class MasonText: UIView, MasonView {
  public internal(set) var owner: MasonText?
  public let node: MasonNode
  let actualNode: MasonNode
  private var children: [TextChild] = []
  internal var attachments: [ViewHelper] = []
  
  public internal(set) var textValues: Data = MasonText.createTextStyles()
  
  
  private func getUInt32(_ index: Int) -> UInt32 {
    return textValues.withUnsafeBytes { (rawBufferPointer: UnsafeRawBufferPointer) -> UInt32 in
      rawBufferPointer.load(fromByteOffset: index, as: UInt32.self)
    }
  }
  
  private func setUInt32(_ index: Int, _ value: UInt32) {
    textValues.withUnsafeMutableBytes { (rawBufferPointer: UnsafeMutableRawBufferPointer) in
      rawBufferPointer.storeBytes(of: value, toByteOffset: index, as: UInt32.self)
    }
  }
  
  private func getInt32(_ index: Int) -> Int32 {
    return textValues.withUnsafeBytes { (rawBufferPointer: UnsafeRawBufferPointer) -> Int32 in
      rawBufferPointer.load(fromByteOffset: index, as: Int32.self)
    }
  }
  
  private func setInt32(_ index: Int, _ value: Int32) {
    textValues.withUnsafeMutableBytes { (rawBufferPointer: UnsafeMutableRawBufferPointer) in
      rawBufferPointer.storeBytes(of: value, toByteOffset: index, as: Int32.self)
    }
  }
  
  
  private func getFloat(_ index: Int) -> Float {
    return textValues.withUnsafeBytes { (rawBufferPointer: UnsafeRawBufferPointer) -> Float in
      rawBufferPointer.load(fromByteOffset: index, as: Float.self)
    }
  }
  
  private func setFloat(_ index: Int, _ value: Float) {
    textValues.withUnsafeMutableBytes { (rawBufferPointer: UnsafeMutableRawBufferPointer) in
      rawBufferPointer.storeBytes(of: value, toByteOffset: index, as: Float.self)
    }
  }
  
  private static func createTextStyles() -> Data{
    var data = Data(count: Int(TextStyleKeys.WHITE_SPACE) + 4)
    
    data.withUnsafeMutableBytes { (rawBufferPointer: UnsafeMutableRawBufferPointer) in
      rawBufferPointer.storeBytes(of: 0xFF000000, toByteOffset: TextStyleKeys.COLOR, as: UInt32.self)
      rawBufferPointer.storeBytes(of: 0, toByteOffset: TextStyleKeys.BACKGROUND_COLOR, as: UInt32.self)
      rawBufferPointer.storeBytes(of: UNSET_COLOR, toByteOffset: TextStyleKeys.DECORATION_COLOR, as: UInt32.self)
      rawBufferPointer.storeBytes(of: Float(UIFont.systemFontSize), toByteOffset: TextStyleKeys.SIZE, as: Float.self)
      rawBufferPointer.storeBytes(of: 0, toByteOffset: TextStyleKeys.TEXT_WRAP, as: Int32.self)
    }
    
    return data
  }
  
  public let type: MasonTextType
  
  public internal(set) var font: NSCFontFace = NSCFontFace(family: "sans-serif")
  
  private func initText(){
    isOpaque = false
    actualNode.data = self
    actualNode.measureFunc = { known, available in
      return MasonText.measure(self, known, available)
    }
    actualNode.setMeasureFunction(actualNode.measureFunc!)
    node.addChild(actualNode)
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
    }
    
    font.loadSync { _ in }
    
    node.inBatch = false
  }
  
  
  public init(mason: NSCMason, type textType: MasonTextType){
    node = MasonNode(mason: mason)
    actualNode = MasonNode(mason: mason)
    type = textType
    super.init(frame: .zero)
    initText()
  }
  
  public init(mason: NSCMason) {
    node = MasonNode(mason: mason)
    actualNode = MasonNode(mason: mason)
    type = .None
    super.init(frame: .zero)
    initText()
  }
  
  public init(node masonNode: MasonNode){
    node = masonNode
    actualNode = MasonNode(mason: node.mason)
    type = .None
    super.init(frame: .zero)
    initText()
  }
  
  
  private static func measure(_ view: MasonText, _ known: CGSize?, _ available: CGSize) -> CGSize {
    
    view.node.lastMeasureKnownSize = known
    view.node.lastMeasureAvailableSize = available
    
    view.actualNode.lastMeasureKnownSize = known
    view.actualNode.lastMeasureAvailableSize = available
    let txt = if view.owner != nil {
      view.txt
    }else {
      view.txtToRender
    }
    
    var size = measureInline(text: txt)
    if let known = known {
      if(!known.width.isNaN && known.width >= 0){
        size.width = known.width
      }
      
      if(!known.height.isNaN && known.height >= 0){
        size.height = known.height
      }
    }
    
    
    
    if(view.owner == nil && view.textWrap != .NoWrap && available.width.isFinite && available.width > 0){
      var maxWidth = CGFloat.greatestFiniteMagnitude
      if(!available.width.isNaN && available.width > 0){
        maxWidth = available.width / CGFloat(NSCMason.scale)
      }
      
      
      size =  measureBlock(text: txt, maxWidth: maxWidth)
      
      if let height = known?.height, !height.isNaN {
        size.height = height
      }
      
    }
    
    
    return size
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
    get {
      return node.style
    }
  }
  
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  public func configure(_ block: (MasonNode) -> Void) {
    node.configure(block)
  }
  
  
  public func updateText(_ value: String?){
    text = value ?? ""
  }
  
  internal var originalTxt = String()
  internal var txt = NSMutableAttributedString()
  public var txtToRender = NSMutableAttributedString()
  internal var paragraphStyle = NSMutableParagraphStyle()
  
  
  
  internal var effectiveText: NSMutableAttributedString {
    return owner != nil ? txt : txtToRender
  }
  
  public func invalidateStyle(_ state: Int64){
    if(state <= -1){
      return
    }
    if(txt.string.isEmpty){return}
    let range = NSRange(location: 0, length: txt.string.count)
    let textState = TextStateKeys(rawValue: UInt64(state))
    
    if(textState.contains(TextStateKeys.textAlign)){
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
        // todo
        break
      case .End:
        // todo
        break
      }
      txt.removeAttribute(.paragraphStyle, range: range)
      txt.addAttribute(.paragraphStyle, value: paragraphStyle, range: range)
    }
    
    if(textState.contains(TextStateKeys.backgroundColor)){
      txt.removeAttribute(.backgroundColor, range: range)
      txt.addAttribute(.backgroundColor, value: UIColor.colorFromARGB(backgroundColorValue), range: range)
    }
    
    if(textState.contains(TextStateKeys.color)){
      txt.removeAttribute(.foregroundColor, range: range)
      txt.addAttribute(.foregroundColor, value: UIColor.colorFromARGB(color), range: range)
    }
    
    if(textState.contains(TextStateKeys.decorationLine)){
      updateDecoration(decorationColor, decorationLine)
    }
    
    if(textState.contains(TextStateKeys.fontStyle) || textState.contains(TextStateKeys.size)){
      invalidateFont()
    }
    
    if(!node.inBatch){
      invalidate()
    }
  }
  
  private func invalidateFont(){
    if(!txt.string.isEmpty){
      let range = NSRange(location: 0, length: txt.string.count)
      txt.removeAttribute(.font, range: range)
      let font = CTFontCreateWithGraphicsFont(font.font!, fontSize, nil, nil)
      
      
      txt.addAttribute(.font, value: font, range: range)
    }
    
    if(!node.inBatch){
      invalidate()
    }
  }
  
  private func fullWidthTransformed(_ string: String) -> String {
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
  
  
  private func applyTextStyles(originalText: String, whiteSpace: WhiteSpace, textTransform: TextTransform, textWrap: TextWrap) -> String {
    
    
    var processedText: String
    switch whiteSpace {
    case .Normal:
      processedText = originalText.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
      paragraphStyle.lineBreakMode = .byWordWrapping
    case .Pre:
      processedText = originalText
      paragraphStyle.lineBreakMode = .byClipping
    case .PreWrap:
      processedText = originalText
      paragraphStyle.lineBreakMode = .byWordWrapping
    case .PreLine:
      processedText = originalText.replacingOccurrences(of: "[ \t]+", with: " ", options: .regularExpression)
      paragraphStyle.lineBreakMode = .byWordWrapping
    }
    
    if textWrap == .NoWrap && whiteSpace == .Normal {
      processedText = processedText.replacingOccurrences(of: "\n", with: " ")
    }
    
    switch textTransform {
    case .None:
      return processedText
    case .Capitalize:
      return processedText.capitalized
    case .Uppercase:
      return processedText.uppercased()
    case .Lowercase:
      return processedText.lowercased()
    case .FullWidth:
      return fullWidthTransformed(processedText)
    case .FullSizeKana:
      return processedText.applyingTransform(.fullwidthToHalfwidth, reverse: true) ?? processedText
    case .MathAuto:
      // TODO: implement proper math transform
      return processedText
    }
  }
  
  public var textTransform: TextTransform {
    get {
      return TextTransform(rawValue:(getInt32(TextStyleKeys.TRANSFORM)))!
    }
    
    set {
      let styled = applyTextStyles(
        originalText: originalTxt,
        whiteSpace: whiteSpace,
        textTransform: newValue,
        textWrap: textWrap
      )
      
      let range = NSRange(0..<txt.string.count)
      
      txt.replaceCharacters(in:range, with: styled)
      
      txt.removeAttribute(.paragraphStyle, range: range)
      txt.addAttribute(.paragraphStyle, value: paragraphStyle, range: range)
      
      setInt32(TextStyleKeys.TRANSFORM, Int32(newValue.rawValue))
      if(!node.inBatch){
        invalidate()
      }
    }
  }
  
  
  
  public var fontSize: CGFloat {
    get {
      return CGFloat(getFloat(TextStyleKeys.SIZE))
    }
    set {
      
      setFloat(TextStyleKeys.SIZE, Float(newValue))
      
      invalidateFont()
      
    }
  }
  
  public var fontStyle: FontStyle {
    get {
      let type = FontStyle(rawValue: getInt32(TextStyleKeys.FONT_STYLE_TYPE))!
      return type
    }
    set {
      setInt32(TextStyleKeys.FONT_STYLE_TYPE, newValue.rawValue)
      setInt32(TextStyleKeys.FONT_STYLE_SLANT, 0)
      
      invalidateFont()
    }
  }
  
  public func setFontStyle(_ style: FontStyle, slant: Int32) {
    setInt32(TextStyleKeys.FONT_STYLE_TYPE, style.rawValue)
    setInt32(TextStyleKeys.FONT_STYLE_SLANT, slant)
    
    invalidateFont()
  }
  
  private var weight = UIFont.Weight.regular
  private var weightName = "normal"
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
        break
      case "ultralight":
        weight = .ultraLight
        weightName = "ultralight"
        break
      case "light":
        weight = .light
        weightName = "light"
        break
      case "normal":
        weight = .regular
        weightName = "normal"
        break
      case "medium":
        weight = .medium
        weightName = "medium"
        break
      case "semibold":
        weight = .semibold
        weightName = "semibold"
        break
      case "bold":
        weight = .bold
        weightName = "bold"
        break
      case "heavy":
        weight = .heavy
        weightName = "heavy"
        break
      case "black":
        weight = .black
        weightName = "black"
        break
      default:
        if let weight = Int(newValue, radix: 10) {
          if(weight >= 100 && weight <= 1000){
            weightName = newValue
            switch(weight) {
            case 100..<200:
              self.weight = .thin
              break
            case 200..<300:
              self.weight = .ultraLight
              break
            case 300..<400:
              self.weight = .light
              break
            case 400..<500:
              self.weight = .regular
              break
            case 500..<600:
              self.weight = .medium
              break
            case 600..<700:
              self.weight = .semibold
              break
            case 700..<800:
              self.weight = .bold
              break
            case 800..<900:
              self.weight = .heavy
              break
            case 900..<1000:
              self.weight = .black
              break
            default:
              break
            }
          }
        }
        
        break
      }
      
      if(previous != weightName){
        invalidateFont()
      }
    }
    
  }
  
  
  public var color: UInt32 {
    get {
      return getUInt32(TextStyleKeys.COLOR)
    }
    set {
      setUInt32(TextStyleKeys.COLOR, newValue)
      if(!txt.string.isEmpty){
        let range = NSRange(0..<txt.string.count)
        txt.removeAttribute(.foregroundColor, range: range)
        txt.addAttribute(.foregroundColor, value: UIColor.colorFromARGB(newValue), range: range)
      }
      if(!node.inBatch){
        invalidate()
      }
    }
  }
  
  
  public var backgroundColorValue: UInt32 {
    get {
      return getUInt32(TextStyleKeys.BACKGROUND_COLOR)
    }
    set {
      setUInt32(TextStyleKeys.BACKGROUND_COLOR, newValue)
      if(!txt.string.isEmpty){
        let range = NSRange(0..<txt.string.count)
        txt.removeAttribute(.backgroundColor, range: range)
        txt.addAttribute(.backgroundColor, value: UIColor.colorFromARGB(newValue), range: range)
      }
      if(!node.inBatch){
        invalidate()
      }
    }
  }
  
  
  public func setColor(ui color: UIColor){
    self.color = color.toUInt32()
  }
  
  public func setBackgroundColor(ui color: UIColor){
    self.backgroundColorValue = color.toUInt32()
  }
  
  private func updateDecoration(_ color: UInt32, _ line: DecorationLine){
    if(line == .None){
      let range = NSRange(0..<txt.string.count)
      // todo only remove if it was previously set
      txt.removeAttribute(.strikethroughStyle, range: range)
      txt.removeAttribute(.strikethroughColor, range: range)
      
      txt.removeAttribute(.underlineStyle, range: range)
      txt.removeAttribute(.underlineColor, range: range)
      
      if(!node.inBatch){
        invalidate()
      }
      
      return
    }
    
    var decorationColor = UIColor.colorFromARGB(color)
    
    if(color == UNSET_COLOR){
      decorationColor = UIColor.colorFromARGB(self.color)
    }
    
    if(!txt.string.isEmpty){
      if(line == .LineThrough){
        txt.addAttributes([
          .strikethroughStyle: NSUnderlineStyle.single.rawValue,
          .strikethroughColor: decorationColor
        ], range: NSRange(0..<txt.string.count))
        
        if(!node.inBatch){
          invalidate()
        }
      }else {
        if(line == .Underline){
          txt.addAttributes([
            .underlineStyle: NSUnderlineStyle.single.rawValue,
            .underlineColor: decorationColor
          ], range: NSRange(0..<txt.string.count))
          
          if(!node.inBatch){
            invalidate()
          }
        }
      }
      
    }
  }
  
  public func setDecorationColor(ui color: UIColor){
    self.decorationColor = color.toUInt32()
  }
  
  public var decorationColor: UInt32 {
    get {
      return getUInt32(TextStyleKeys.DECORATION_COLOR)
    }
    set {
      
      setUInt32(TextStyleKeys.DECORATION_COLOR, newValue)
      
      updateDecoration(newValue, decorationLine)
    }
  }
  
  
  public var decorationLine: DecorationLine {
    get {
      return DecorationLine(rawValue: getInt32(TextStyleKeys.DECORATION_LINE))!
    }
    set {
      setUInt32(TextStyleKeys.DECORATION_LINE,  UInt32(newValue.rawValue))
      
      updateDecoration(decorationColor, newValue)
    }
  }
  
  private func getDecorationColor() -> UIColor {
    var decorationColor = UIColor.colorFromARGB(self.decorationColor)
    
    if(color == UNSET_COLOR){
      decorationColor = UIColor.colorFromARGB(color)
    }
    return decorationColor
  }
  
  
  
  public var whiteSpace: WhiteSpace {
    set {
      
      setInt32(TextStyleKeys.WHITE_SPACE, newValue.rawValue)
      
      let styledText = applyTextStyles(
        originalText: originalTxt,
        whiteSpace: newValue,
        textTransform: textTransform,
        textWrap: textWrap
      )
      
      let range = NSRange(0..<txt.string.count)
      txt.replaceCharacters(in: range, with: styledText)
      
      
      txt.removeAttribute(.paragraphStyle, range: range)
      txt.addAttribute(.paragraphStyle, value: paragraphStyle, range: range)
      
      root.node.markDirty()
      
      invalidate()
      
      if(!node.inBatch){
        if let size = root.node.computeCache {
          root.node.computeWithSize(Float(size.width), Float(size.height))
        }
      }
    }
    get {
      return WhiteSpace(rawValue:getInt32(TextStyleKeys.WHITE_SPACE))!
    }
  }
  
  
  public var textWrap: TextWrap {
    set {
      setInt32(TextStyleKeys.TEXT_WRAP, newValue.rawValue)
      
      let styledText = applyTextStyles(
        originalText: originalTxt,
        whiteSpace: whiteSpace,
        textTransform: textTransform,
        textWrap: newValue
      )
      
      let range = NSRange(0..<txt.string.count)
      txt.replaceCharacters(in: range, with: styledText)
      
      txt.removeAttribute(.paragraphStyle, range: range)
      txt.addAttribute(.paragraphStyle, value: paragraphStyle, range: range)
      
      root.node.markDirty()
      
      invalidate()
      
      if(!node.inBatch){
        if let size = root.node.computeCache {
          root.node.computeWithSize(Float(size.width), Float(size.height))
        }
      }
    }
    get {
      return TextWrap(rawValue:getInt32(TextStyleKeys.TEXT_WRAP))!
    }
  }
  
  
  private func createRunDelegate(node: MasonNode) -> CTRunDelegate {
    var callbacks = CTRunDelegateCallbacks(
      version: kCTRunDelegateCurrentVersion,
      dealloc: { refCon in
        let _ = Unmanaged<MasonNode>.fromOpaque(refCon).takeRetainedValue()
      },
      getAscent: { refCon in
        let nodePtr = Unmanaged<MasonNode>.fromOpaque(refCon)
        let node =  nodePtr.takeUnretainedValue()
        if let layout = node.layoutCache {
          return CGFloat(layout.height / NSCMason.scale)
        }else if let known = node.lastMeasureKnownSize{
          if(!known.height.isNaN){
            return known.height / CGFloat(NSCMason.scale)
          }
        }
        
        // todo only rely on taffy for computing
        
        var ascent: CGFloat = 0
        if case let MasonDimension.Points(height) = node.style.size.height {
          ascent = CGFloat(height)
          if case let MasonDimension.Points(minHeight) = node.style.minSize.height {
            if(ascent < CGFloat(minHeight)){
              ascent = CGFloat(minHeight)
            }
          }
          if case let MasonDimension.Points(maxHeight) = node.style.maxSize.height {
            if(ascent > CGFloat(maxHeight)){
              ascent = CGFloat(maxHeight)
            }
          }
          
          ascent = ascent / CGFloat(NSCMason.scale)
        }
        
        
        return ascent
      },
      getDescent: { _ in 0 },
      getWidth: { refCon in
        let nodePtr = Unmanaged<MasonNode>.fromOpaque(refCon)
        let node =  nodePtr.takeUnretainedValue()
        if let layout = node.layoutCache {
          return CGFloat(layout.width / NSCMason.scale)
        }else if let known = node.lastMeasureKnownSize{
          if(!known.width.isNaN){
            return known.width / CGFloat(NSCMason.scale)
          }
        }
        
        var width: CGFloat = 0
        if case let MasonDimension.Points(sizeWidth) = node.style.size.width {
          width = CGFloat(sizeWidth)
          if case let MasonDimension.Points(minWidth) = node.style.minSize.width {
            if(width < CGFloat(minWidth)){
              width = CGFloat(minWidth)
            }
          }
          if case let MasonDimension.Points(maxWidth) = node.style.maxSize.width {
            if(width > CGFloat(maxWidth)){
              width = CGFloat(maxWidth)
            }
          }
          
          width = width / CGFloat(NSCMason.scale)
        }
        
        return width
      }
    )
    
    let ref = Unmanaged.passRetained(node).toOpaque()
    
    return CTRunDelegateCreate(&callbacks, ref)!
  }
  
  public override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext() else { return }
    
    context.textMatrix = .identity
    context.saveGState()
    context.translateBy(x: 0, y: bounds.height)
    context.scaleBy(x: 1.0, y: -1.0)
    
    var text = txtToRender
    
    if(textWrap == .NoWrap){
      let mutable = NSMutableAttributedString(attributedString: txtToRender)
      let fullRange = NSRange(location: 0, length: mutable.length)
      mutable.mutableString.replaceOccurrences(of: "\n", with: " ", options: [], range: fullRange)
      text = mutable
    }
    
    let framesetter = CTFramesetterCreateWithAttributedString(text)
    
    var bounds = CGRect(origin: bounds.origin, size: bounds.size)
    
    
    if let layout = self.node.layoutCache {
      if(!layout.padding.isEmpty()){
        let scale = NSCMason.scale
        let padding = UIEdgeInsets(top: CGFloat(layout.padding.top / scale), left: CGFloat(layout.padding.left / scale), bottom: CGFloat(layout.padding.bottom / scale), right: CGFloat(layout.padding.right / scale))
        
        bounds = bounds.inset(by: padding)
      }
    }
    
    
    let path = CGPath(rect: bounds, transform: nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)
    
    
    CTFrameDraw(frame, context)
    
    
    guard let lines = CTFrameGetLines(frame) as? [CTLine], !lines.isEmpty else { return }
    
    var origins = [CGPoint](repeating: .zero, count: lines.count)
    CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &origins)
    
    for (lineIndex, line) in lines.enumerated() {
      let runs = CTLineGetGlyphRuns(line) as? [CTRun] ?? []
      let origin = origins[lineIndex]
      
      for run in runs {
        let attrs = CTRunGetAttributes(run) as NSDictionary
        
        if let view = attrs[VIEW_PLACEHOLDER] as? ViewHelper {
          var ascent: CGFloat = 0
          var descent: CGFloat = 0
          var leading: CGFloat = 0
          
          if let layout = view.node.layoutCache {
            
            let _ = CGFloat(CTRunGetTypographicBounds(run, CFRangeMake(0, 0), &ascent, &descent, &leading))
            
            let xOffset = CTLineGetOffsetForStringIndex(line, CTRunGetStringRange(run).location, nil)
            let x = origin.x + xOffset
            _ = CGFloat((layout.y / NSCMason.scale))
            
            // let layoutX = CGFloat(layout.x / NSCMason.scale)
            // let layoutY = CGFloat(layout.y / NSCMason.scale)
            
            let runBounds = CGRect(
              x: x,
              y: origin.y,
              width: CGFloat(layout.width / NSCMason.scale),
              height: CGFloat(layout.height / NSCMason.scale)
            )
            
            view.updateImage(false)
            
            if let image = view.image?.cgImage {
              context.draw(image, in: runBounds)
            }
          }
          
        }
      }
    }
    
    
    context.restoreGState()
  }
  
  
  
  private func invalidate(layout: Bool = false){
    guard let owner = owner else {
      root.txtToRender = root.rebuildText()
      setNeedsDisplay()
      if(layout){
        setNeedsLayout()
      }
      return
    }
    var parent = owner
    while parent.owner != nil {
      parent = parent.owner!
    }
    root.txtToRender = root.rebuildText()
    parent.setNeedsDisplay()
    if(layout){
      parent.setNeedsLayout()
    }
    
  }
  
  private var root: MasonText {
    var current = self
    while let parent = current.owner {
      current = parent
    }
    return current
  }
  
  private var rootNode: MasonNode {
    var current = self.node
    while let parent = current.owner {
      current = parent
    }
    return current
  }
  
  func rebuildText() -> NSMutableAttributedString {
    let result = NSMutableAttributedString()
    
    for child in children {
      if let childTextView = child.view as? MasonText {
        result.append(childTextView.rebuildText())
      } else if let attachment = child.attachment {
        result.append(attachment)
      }
    }
    
    result.append(self.txt)
    
    return result
  }
  
  
  private func createViewAttachment(view: UIView, mason: NSCMason) -> (ViewHelper, NSMutableAttributedString){
    let attachment = ViewHelper(view: view, mason: node.mason)
    
    let delegate = createRunDelegate(node: node.mason.nodeForView(view))
    
    let attrString = NSMutableAttributedString("\u{FFFC}")
    attrString.addAttributes([
      NSAttributedString.Key(kCTRunDelegateAttributeName as String): delegate,
      NSAttributedString.Key(VIEW_PLACEHOLDER): attachment
    ], range: NSRange(location: 0, length: 1))
    return (attachment, attrString)
  }
  
  
  
  public func addView(_ view: UIView, _ index: Int = -1) {
    guard !children.contains(where: { $0.view === view }) else { return }
    
    if let textView = view as? MasonText {
      textView.owner = self
      
      children.insert(TextChild(
        text: textView,
        view: view,
        attachment: nil
      ), at: index >= 0 ? index : children.count)
      
      node.addChild(textView.node)
      
    } else {
      let (attachmentView, attachment) = createViewAttachment(view: view, mason: node.mason)
      
      
      children.insert(TextChild(
        text: nil,
        view: view,
        attachment: attachment,
        attachmentView: attachmentView
      ), at: index >= 0 ? index : children.count)
      
      node.addChild(attachmentView.node)
    }
    
    root.invalidate()
  }
  
  public func removeView(_ view: UIView){
    if let index = children.firstIndex(where: { $0.view == view }) {
      children.remove(at: index)
      node.removeChild(child: node.mason.nodeForView(view))
      actualNode.markDirty()
      root.invalidate(layout: true)
    }
  }
  
  
  public var text: String? {
    get {
      return txt.string
    }
    set {
      let string = newValue ?? ""
      
      if(font.font == nil){
        font.loadSync { _ in }
      }
      
      let font = NSCFontFaceSet.instance.font(for: font.font!, size: fontSize)
      
      var attributes: [NSAttributedString.Key: Any] = [
        .font: font,
        .paragraphStyle: paragraphStyle,
        .foregroundColor: UIColor.colorFromARGB(color)
      ]
      if backgroundColorValue != 0 {
        attributes[.backgroundColor] = UIColor.colorFromARGB(backgroundColorValue)
      }
      
      switch decorationLine {
      case .LineThrough:
        attributes[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
        attributes[.strikethroughColor] = getDecorationColor()
      case .Underline:
        attributes[.underlineStyle] = NSUnderlineStyle.single.rawValue
        attributes[.underlineColor] = getDecorationColor()
      default:
        break
      }
      
      actualNode.markDirty()
      
      txt = NSMutableAttributedString(string: string, attributes: attributes)
      
      invalidate()
    }
  }
  
  
  public func syncStyle(_ state: String, _ textState: String) {
    guard let stateValue = Int64(state, radix: 10) else {return}
    guard let textStateValue = Int64(textState, radix: 10) else {return}
    invalidateStyle(textStateValue)
    if (stateValue != -1) {
      style.isDirty = stateValue
      style.updateNativeStyle()
    }
  }
  
  
  
  
}
