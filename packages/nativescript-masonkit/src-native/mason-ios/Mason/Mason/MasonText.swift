//
//  MasonText.swift
//  Mason
//
//  Created by Osei Fortune on 20/03/2025.
//

import Foundation
import UIKit
import CoreText

extension UIColor {
  internal static func colorFromARGB(_ argb: Int32) -> UIColor {
    let a = CGFloat((argb >> 24) & 0xFF) / 255.0
    let r = CGFloat((argb >> 16) & 0xFF) / 255.0
    let g = CGFloat((argb >> 8) & 0xFF) / 255.0
    let b = CGFloat(argb & 0xFF) / 255.0
    
    return UIColor(red: r, green: g, blue: b, alpha: a)
  }
  
  internal static func colorFromRGBA(_ rgba: Int32) -> UIColor {
    let r = CGFloat((rgba >> 24) & 0xFF) / 255.0
    let g = CGFloat((rgba >> 16) & 0xFF) / 255.0
    let b = CGFloat((rgba >> 8) & 0xFF) / 255.0
    let a = CGFloat(rgba & 0xFF) / 255.0
    
    return UIColor(red: r, green: g, blue: b, alpha: a)
  }
  
  
  func toInt32() -> Int32 {
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
    return Int32(bitPattern: argb)
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
  var start: Int
  var end: Int
  var text: MasonText?
  var view: UIView?
  var attachment: ViewHelper?
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
  
  
  public init(mason: NSCMason) {
    node = MasonNode(mason: mason)
    actualNode = MasonNode(mason: mason)
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
    
//    if(view.owner == nil){
//      var maxWidth = CGFloat.greatestFiniteMagnitude
//      if(!available.width.isNaN && available.width > 0){
//        maxWidth = available.width
//      }
//      return measureBlock(text: view.txt, maxWidth: maxWidth)
//    }
//    
    
    var size = measureInline(text: view.txt)
    if let known = known {
      if(!known.width.isNaN && known.width >= 0){
        size.width = known.width
      }
      
      if(!known.height.isNaN && known.height >= 0){
        size.height = known.height
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
      return actualNode.style
    }
  }
  
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  public func configure(_ block: (MasonNode) -> Void) {
    actualNode.configure(block)
  }
  
  
  lazy var textValues: NSMutableData = {
    let data = NSMutableData(length: 40)!
    var pointer = data.mutableBytes
    
    let color = pointer.advanced(by: TextStyleKeys.COLOR).assumingMemoryBound(to: UInt32.self)
    color.pointee = 0xFF000000
    
    
    let bgColor = pointer.advanced(by: TextStyleKeys.BACKGROUND_COLOR).assumingMemoryBound(to: UInt32.self)
    bgColor.pointee = 0
    
    let decorationColor = pointer.advanced(by: TextStyleKeys.DECORATION_COLOR).assumingMemoryBound(to: UInt32.self)
    decorationColor.pointee = UNSET_COLOR
    
    let size = pointer.advanced(by: TextStyleKeys.SIZE).assumingMemoryBound(to: Float.self)
    size.pointee = Float(UIFont.systemFontSize)
    
    
    
    return data
  }()
  
  
  public func updateText(_ value: String?){
    text = value ?? ""
  }
  
  internal var originalTxt = String()
  internal var txt = NSMutableAttributedString()
  
  public internal(set) var font: UIFont = UIFont.systemFont(ofSize: UIFont.systemFontSize)
  
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
      txt.setAttributes([.font: font], range: NSRange(0..<txt.string.count))
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

  
  public var color: Int32 {
    get {
      return textValues.bytes.advanced(by: TextStyleKeys.COLOR).assumingMemoryBound(to: Int32.self).pointee
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.COLOR).assumingMemoryBound(to: Int32.self).pointee = newValue
      if(!txt.string.isEmpty){
        txt.setAttributes([.foregroundColor: UIColor.colorFromARGB(newValue)], range: NSRange(0..<txt.string.count))
      }
      if(!node.inBatch){
        invalidate()
      }
    }
  }
  
  
  public var backgroundColorValue: Int32 {
    get {
      return textValues.bytes.advanced(by: TextStyleKeys.BACKGROUND_COLOR).assumingMemoryBound(to: Int32.self).pointee
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.BACKGROUND_COLOR).assumingMemoryBound(to: Int32.self).pointee = newValue
      if(!txt.string.isEmpty){
        txt.setAttributes([.backgroundColor: UIColor.colorFromARGB(newValue)], range: NSRange(0..<txt.string.count))
      }
      if(!node.inBatch){
        invalidate()
      }
    }
  }
  
  
  public func setColor(ui color: UIColor){
    self.color = color.toInt32()
  }
  
  public func setBackgroundColor(ui color: UIColor){
    self.backgroundColorValue = color.toInt32()
  }
  
  private func updateDecoration(_ color: Int32, _ line: DecorationLine){
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
        txt.setAttributes([
          .strikethroughStyle: NSUnderlineStyle.single.rawValue,
          .strikethroughColor: decorationColor
        ], range: NSRange(0..<txt.string.count))
        
        if(!node.inBatch){
          invalidate()
        }
      }else {
        if(line == .Underline){
          txt.setAttributes([
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
    self.decorationColor = color.toInt32()
  }
  
  public var decorationColor: Int32 {
    get {
      return textValues.bytes.advanced(by: TextStyleKeys.DECORATION_COLOR).assumingMemoryBound(to: Int32.self).pointee
    }
    set {
      textValues.mutableBytes.advanced(by: TextStyleKeys.DECORATION_COLOR).assumingMemoryBound(to: Int32.self).pointee = newValue
      
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
  
  
  
  public var text: String? {
    get {
      return txt.string
    }
    set {
      let string = newValue ?? ""
      let paragraphStyle =  NSMutableParagraphStyle()
     
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
      
      
      
      var attributes: [NSAttributedString.Key: Any] = [
        .font: font,
        .paragraphStyle: paragraphStyle
      ]
      
      if(backgroundColorValue != 0){
        attributes[NSAttributedString.Key.backgroundColor] = UIColor.colorFromARGB(backgroundColorValue)
      }
      
      attributes[NSAttributedString.Key.foregroundColor] = UIColor.colorFromARGB(color)
      
      
      if(decorationLine == .LineThrough){
        attributes[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
        attributes[.strikethroughColor] = getDecorationColor()
      }else {
        if(decorationLine == .Underline){
          attributes[.underlineStyle] = NSUnderlineStyle.single.rawValue
          attributes[.underlineColor] = getDecorationColor()
        }
      }
      // always store ??
      originalTxt = string
      txt = NSMutableAttributedString(string: string, attributes: attributes)
      
      invalidate()
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
        return 0
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
        return 0
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
    
    let framesetter = CTFramesetterCreateWithAttributedString(txt)

    var bounds = CGRect(origin: bounds.origin, size: bounds.size)
        
    
    if let layout = self.actualNode.layoutCache {
      if(!layout.padding.isEmpty()){
        let scale = NSCMason.scale
        let padding = UIEdgeInsets(top: CGFloat(layout.padding.top / scale), left: CGFloat(layout.padding.left / scale), bottom: CGFloat(layout.padding.bottom / scale), right: CGFloat(layout.padding.right / scale))
        
        bounds = bounds.inset(by: padding)
      }
    }
    
    
    let path = CGPath(rect: bounds, transform: nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, txt.length), path, nil)

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
          
          if let layout = view.node.layoutCache {
           
            let width = CGFloat(CTRunGetTypographicBounds(run, CFRangeMake(0, 0), &ascent, &descent, nil))
            
            let xOffset = CTLineGetOffsetForStringIndex(line, CTRunGetStringRange(run).location, nil)
            let x = origin.x + xOffset
            let runBounds = CGRect(
              x: x,
              y: CGFloat((layout.y / NSCMason.scale)) + (origin.y - descent),
              width: CGFloat(layout.width / NSCMason.scale),
              height: CGFloat(layout.height / NSCMason.scale) //ascent + descent
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
  
  
  
  private func invalidate(){
    guard let owner = owner else {
      setNeedsDisplay()
      return
    }
    var parent = owner
    while parent.owner != nil {
      parent = parent.owner!
    }
    parent.setNeedsDisplay()
  }
  
  private func offset(in top: MasonText) -> Int {
    guard self !== root else { return 0 }
    
    guard let owner = owner else { return -1 }
    
    for child in owner.children {
      if child.text === self {
        let parentOffset = owner.offset(in: root)
        return parentOffset + child.start
      }
    }
    
    return -1
  }
  
  private func computeOffset(in top: MasonText) -> Int {
    if self === top {
      return txt.length
    }
    
    guard let owner = owner else {
      return -1
    }
    
    for child in owner.children {
      if child.text === self {
        return child.start + self.totalFlattenedLength()
      }
    }
    
    return -1
  }
  
  func flattenedText() -> NSAttributedString {
    let result = NSMutableAttributedString()
    result.append(txt)
    for child in children {
      if let childText = child.text {
        result.append(childText.flattenedText())
      } else if let attachment = child.attachment {
        print("flattenedText",child.attachment)
        // result.append(NSAttributedString(attachment: attachment))
      }
    }
    return result
  }
  
  func totalFlattenedLength() -> Int {
    var length = txt.length
    for child in children {
      if let text = child.text {
        length += text.totalFlattenedLength()
      }
    }
    return length
  }
  
  private var root: MasonText {
    var current = self
    while let parent = current.owner {
      current = parent
    }
    return current
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
  
  public func addView(_ view: UIView) {
    guard !children.contains(where: { $0.view === view }) else { return }
    
    let top = self.root
    
    if let textView = view as? MasonText {
      textView.owner = self
      let flatText = textView.flattenedText()
      let insertOffset = self.computeOffset(in: top)
      
      guard insertOffset >= 0, insertOffset <= top.txt.length else {
        print("Error: Invalid insert offset \(insertOffset)")
        return
      }
      
      top.txt.insert(flatText, at: insertOffset)
      
      let length = flatText.length
      children.append(TextChild(
        start: insertOffset,
        end: insertOffset + length,
        text: textView,
        view: view,
        attachment: nil
      ))
      
      node.addChild(textView.node)
      
      top.invalidate()
      return
    }
    
    
    let attachment = createViewAttachment(view: view, mason: node.mason)
    
    let insertOffset = self.computeOffset(in: top)
    
    guard insertOffset >= 0, insertOffset <= top.txt.length else {
      print("Error: Invalid insert offset \(insertOffset)")
      return
    }
    
    top.txt.insert(attachment.1, at: insertOffset)
    
    children.append(TextChild(
      start: insertOffset,
      end: insertOffset + 1,
      text: nil,
      view: view,
      attachment: attachment.0
    ))
    
    node.addChild(attachment.0.node)
    
    top.invalidate()
  }
  
  
  
  
}
