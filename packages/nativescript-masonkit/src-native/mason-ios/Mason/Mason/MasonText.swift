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
}

let VIEW_PLACEHOLDER = "[[__view__]]"
let UNSET_COLOR = UInt32(0xDEADBEEF)

@objc(MasonText)
@objcMembers
public class MasonText: UIView, MasonView {
  public internal(set) var owner: MasonText?
  public let node: MasonNode
  let actualNode: MasonNode
  private var children: [TextChild] = []
  internal var attachments: [ViewHelper] = []
  public let textValues: NSMutableData
  
  private static func createTextValues() -> NSMutableData{
    let data = NSMutableData(length: Int(TextStyleKeys.TEXT_WRAP) + 4)!
    let pointer = data.mutableBytes
    
    let color = pointer.advanced(by: TextStyleKeys.COLOR).assumingMemoryBound(to: UInt32.self)
    color.pointee = 0xFF000000
    
    
    let bgColor = pointer.advanced(by: TextStyleKeys.BACKGROUND_COLOR).assumingMemoryBound(to: UInt32.self)
    bgColor.pointee = 0
    
    let decorationColor = pointer.advanced(by: TextStyleKeys.DECORATION_COLOR).assumingMemoryBound(to: UInt32.self)
    decorationColor.pointee = UNSET_COLOR
    
    let size = pointer.advanced(by: TextStyleKeys.SIZE).assumingMemoryBound(to: Float.self)
    size.pointee = Float(UIFont.systemFontSize)
    
    
    let wrap = pointer.advanced(by: TextStyleKeys.TEXT_WRAP).assumingMemoryBound(to: Int32.self)
    wrap.pointee = 0
    
   
    return data
  }
  
  public init(mason: NSCMason) {
    node = MasonNode(mason: mason)
    actualNode = MasonNode(mason: mason)
    textValues = MasonText.createTextValues()
    super.init(frame: .zero)
    isOpaque = false
    actualNode.data = self
    node.style.display = .Flex
    actualNode.measureFunc = { known, available in
      return MasonText.measure(self, known, available)
    }
    actualNode.setMeasureFunction(actualNode.measureFunc!)
    node.addChild(actualNode)
  }
  
  public init(node masonNode: MasonNode){
    node = masonNode
    actualNode = MasonNode(mason: node.mason)
    textValues = MasonText.createTextValues()
    super.init(frame: .zero)
    isOpaque = false
    actualNode.data = self
    node.style.display = .Flex
    actualNode.measureFunc = { known, available in
      return MasonText.measure(self, known, available)
    }
    actualNode.setMeasureFunction(actualNode.measureFunc!)
    node.addChild(actualNode)
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
        maxWidth = available.width
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
  
  public internal(set) var font: UIFont = UIFont.systemFont(ofSize: UIFont.systemFontSize)
  
  
  
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
    font = UIFont.systemFont(ofSize: fontSize, weight: weight)
    
    switch(fontStyle){
    case .Italic:
      font = UIFont(descriptor: font.fontDescriptor.withSymbolicTraits(.traitItalic)!, size: fontSize)
      break
    case .Oblique:
      // font.fontDescriptor.withSymbolicTraits(.traitItalic)
      // todo
      break
    default:
      // noop
      break
    }
    
    if(!txt.string.isEmpty){
      let range = NSRange(location: 0, length: txt.string.count)
      txt.removeAttribute(.font, range: range)
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
  
  
  public var textTransform: TextTransform {
    get {
      return TextTransform(rawValue:(textValues.bytes.advanced(by: TextStyleKeys.TRANSFORM).assumingMemoryBound(to: Int32.self).pointee))!
    }
    
    set {
      switch(newValue){
      case .None:
        txt.replaceCharacters(in: NSRange(0..<txt.string.count), with: originalTxt as String)
      case .Capitalize:
        txt.replaceCharacters(in: NSRange(0..<txt.string.count), with: originalTxt.capitalized as String)
      case .Uppercase:
        txt.replaceCharacters(in: NSRange(0..<txt.string.count), with: originalTxt.uppercased() as String)
      case .Lowercase:
        txt.replaceCharacters(in: NSRange(0..<txt.string.count), with: originalTxt.lowercased() as String)
      case .FullWidth:
        txt.replaceCharacters(in: NSRange(0..<txt.string.count), with: fullWidthTransformed(originalTxt) as String)
      case .FullSizeKana:
        if let full = originalTxt.applyingTransform(.fullwidthToHalfwidth, reverse: true) {
          txt.replaceCharacters(in: NSRange(0..<txt.string.count), with: full)
        }else {
          txt.replaceCharacters(in: NSRange(0..<txt.string.count), with: originalTxt)
        }
      case .MathAuto:
        // todo
        txt.replaceCharacters(in: NSRange(0..<txt.string.count), with: originalTxt as String)
      }
      if(!node.inBatch){
        invalidate()
      }
    }
  }
  
  
  public var fontSize: CGFloat {
    get {
      return CGFloat(textValues.bytes.advanced(by: TextStyleKeys.SIZE).assumingMemoryBound(to: Float.self).pointee)
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.SIZE).assumingMemoryBound(to: Float.self).pointee = Float(newValue)
      
      invalidateFont()
      
    }
  }
  
  public var fontStyle: FontStyle {
    get {
      let type = FontStyle(rawValue: textValues.bytes.advanced(by: TextStyleKeys.FONT_STYLE_TYPE).assumingMemoryBound(to: Int32.self).pointee)!
      return type
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.FONT_STYLE_TYPE).assumingMemoryBound(to: Int32.self).pointee = newValue.rawValue
      
      textValues.mutableBytes.advanced(by: TextStyleKeys.FONT_STYLE_SLANT).assumingMemoryBound(to: Int32.self).pointee = 0
      
      invalidateFont()
    }
  }
  
  public func setFontStyle(_ style: FontStyle, slant: Int32) {
    textValues.mutableBytes.advanced(by: TextStyleKeys.FONT_STYLE_TYPE).assumingMemoryBound(to: Int32.self).pointee = style.rawValue
    
    textValues.mutableBytes.advanced(by: TextStyleKeys.FONT_STYLE_SLANT).assumingMemoryBound(to: Int32.self).pointee = slant
    
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
      return textValues.bytes.advanced(by: TextStyleKeys.COLOR).assumingMemoryBound(to: UInt32.self).pointee
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.COLOR).assumingMemoryBound(to: UInt32.self).pointee = newValue
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
      return textValues.bytes.advanced(by: TextStyleKeys.BACKGROUND_COLOR).assumingMemoryBound(to: UInt32.self).pointee
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.BACKGROUND_COLOR).assumingMemoryBound(to: UInt32.self).pointee = newValue
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
      return textValues.bytes.advanced(by: TextStyleKeys.DECORATION_COLOR).assumingMemoryBound(to: UInt32.self).pointee
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.DECORATION_COLOR).assumingMemoryBound(to: UInt32.self).pointee = newValue
      
      updateDecoration(newValue, decorationLine)
    }
  }
  
  
  public var decorationLine: DecorationLine {
    get {
      return DecorationLine(rawValue: textValues.bytes.advanced(by: TextStyleKeys.DECORATION_LINE).assumingMemoryBound(to: Int32.self).pointee)!
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.DECORATION_LINE).assumingMemoryBound(to: Int32.self).pointee = newValue.rawValue
      
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
  
  
  public var textWrap: TextWrap {
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.TEXT_WRAP).assumingMemoryBound(to: Int32.self).pointee = newValue.rawValue
      switch(newValue){
      case .NoWrap:
        root.node.markDirty()
        break
      case .Wrap:
        root.node.markDirty()
        break
      case .Balance:
        // noop
        root.node.markDirty()
        break
      }
      
      if(!node.inBatch){
        rootNode.computeMaxContent()
      }
    }
    get {
      return TextWrap(rawValue: textValues.bytes.advanced(by: TextStyleKeys.TEXT_WRAP).assumingMemoryBound(to: Int32.self).pointee)!
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
    
    var text =  txtToRender
    
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
            
            let layoutX = CGFloat(layout.x / NSCMason.scale)
            let layoutY = CGFloat(layout.y / NSCMason.scale)
            
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
  
  private func rebuildText() -> NSMutableAttributedString {
      let result = NSMutableAttributedString()
      
      result.append(self.txt)
      
      for child in children {
          if let childTextView = child.view as? MasonText {
              result.append(childTextView.rebuildText())
          } else if let attachment = child.attachment {
            result.append(attachment)
          }
      }
      
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
