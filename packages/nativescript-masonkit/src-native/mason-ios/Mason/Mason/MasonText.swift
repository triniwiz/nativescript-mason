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
  let suggestedSize = CTFramesetterSuggestFrameSizeWithConstraints(framesetter,
                                                                   CFRangeMake(0, text.length),
                                                                   nil,
                                                                   constraintSize,
                                                                   nil)
  return suggestedSize
}

func measureInline(text: NSAttributedString) -> CGSize {
  print("measureInline", text.string)
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
}

let VIEW_PLACEHOLDER = "[[__view__]]"
let UNSET_COLOR = UInt32(0xDEADBEEF)

@objc(MasonText)
@objcMembers
public class MasonText: UIView, MasonView {
  public internal(set) var owner: MasonText?
  // internal var info: TextChild
  public let node: MasonNode
  let actualNode: MasonNode
  private var children: [TextChild] = []
  internal var attachments: [ViewHelper] = []
  
  
  public init(mason: NSCMason) {
    node = MasonNode(mason: mason)
    actualNode = MasonNode(mason: mason)
    super.init(frame: .zero)
    isOpaque = false
    node.data = self
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
    node.data = self
    actualNode.data = self
    node.style.display = .Flex
    actualNode.measureFunc = { known, available in
      return MasonText.measure(self, known, available)
    }
    actualNode.setMeasureFunction(actualNode.measureFunc!)
    node.addChild(actualNode)
  }
  
  private static func measure(_ view: MasonText, _ known: CGSize?, _ available: CGSize) -> CGSize {
    return measureInline(text: view.txt)
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
    actualNode.configure(block)
  }
  
  
  lazy var textValues: NSMutableData = {
    let data = NSMutableData(length: 24)!
    var pointer = data.mutableBytes
    
    let color = pointer.advanced(by: TextStyleKeys.COLOR).assumingMemoryBound(to: UInt32.self)
    color.pointee = 0xFF000000
    
    
    let bgColor = pointer.advanced(by: TextStyleKeys.BACKGROUND_COLOR).assumingMemoryBound(to: UInt32.self)
    bgColor.pointee = 0
    
    let decorationColor = pointer.advanced(by: TextStyleKeys.DECORATION_COLOR).assumingMemoryBound(to: UInt32.self)
    decorationColor.pointee = UNSET_COLOR
    
    return data
  }()
  
  
  public func updateText(_ value: String?){
    text = value ?? ""
  }
  
  internal var txt = NSMutableAttributedString()
  
  
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
      var paragraphStyle =  NSMutableParagraphStyle()
      
      
      var attributes: [NSAttributedString.Key: Any] = [
        .font: UIFont.systemFont(ofSize: 14),
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
        let node = Unmanaged<MasonNode>.fromOpaque(refCon)
        if let layout = node.takeUnretainedValue().layoutCache {
          return CGFloat(layout.height)
        }
        return 0
      },
      getDescent: { _ in 0 },
      getWidth: { refCon in
        let node = Unmanaged<MasonNode>.fromOpaque(refCon)
        if let layout = node.takeUnretainedValue().layoutCache {
          return CGFloat(layout.width)
        }
        return 0
      }
    )
    
    let ref = Unmanaged.passRetained(node).toOpaque()
    
    return CTRunDelegateCreate(&callbacks, ref)!
  }
  
  public override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext() else { return }
    context.saveGState()
    context.translateBy(x: 0, y: bounds.height)
    context.scaleBy(x: 1.0, y: -1.0)

    let framesetter = CTFramesetterCreateWithAttributedString(txt)
    
    var bounds = CGRect(origin: bounds.origin, size: bounds.size)
    
    
    if let layout = self.node.layoutCache {
      let padding = UIEdgeInsets(top: CGFloat(layout.padding.top), left: CGFloat(layout.padding.left), bottom: CGFloat(layout.padding.bottom), right: CGFloat(layout.padding.right))
      
      bounds = bounds.inset(by: padding)
    }
   
    
    let path = CGPath(rect: bounds, transform: nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, txt.length), path, nil)
    CTFrameDraw(frame, context)
    
    
    let lines = CTFrameGetLines(frame) as! [CTLine]
    if(!lines.isEmpty){
      var origins = [CGPoint](repeating: .zero, count: lines.count)
      CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &origins)
      
      for (lineIndex, line) in lines.enumerated() {
        let runs = CTLineGetGlyphRuns(line) as! [CTRun]
        let origin = origins[lineIndex]
        
        for run in runs {
          let attrs = CTRunGetAttributes(run) as NSDictionary
          
          if let view = attrs[VIEW_PLACEHOLDER] as? ViewHelper {
            var ascent: CGFloat = 0
            var descent: CGFloat = 0
            
            let width = CGFloat(CTRunGetTypographicBounds(run, CFRangeMake(0, 0), &ascent, &descent, nil))
            let layout = view.node.layout()
      
            let xOffset = CTLineGetOffsetForStringIndex(line, CTRunGetStringRange(run).location, nil)
            let runBounds = CGRect(
              x: origin.x + xOffset,
              y: origin.y - descent,
              width: CGFloat(layout.width),
              height: CGFloat(layout.height) //ascent + descent
            )
            
      
            view.updateImage(false)
            
            if let image = view.image?.cgImage {
              print(image)
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
    
    node.addChild(node.mason.nodeForView(view))
    
    top.invalidate()
  }
  
  
  
  
}
