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
    // updateImage()
  }
  
  
  func updateImage(_ afterScreenUpdates: Bool = true) {
    guard let view = view else { return }
    let layout = node.computedLayout
    
    let size = CGSize(width: CGFloat(layout.width / NSCMason.scale), height:CGFloat( layout.height / NSCMason.scale))
    
    view.frame = CGRect(origin: view.frame.origin, size: size)
    
    if(afterScreenUpdates){
      CATransaction.setCompletionBlock {
        let renderer = UIGraphicsImageRenderer(size: size)
        self.image = renderer.image { _ in
          view.drawHierarchy(in: view.bounds, afterScreenUpdates: afterScreenUpdates)
        }
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
  case Strong
  case Em
  case I
  case A
  
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
    case .Strong:
      return 14
    case .Em:
      return 15
    case .I:
      return 16
    case .A:
      return 17
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
    case 14:
      self = .Strong
    case 15:
      self = .Em
    case 16:
      self = .I
    case 17:
      self = .A
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
    case .Strong:
      return "strong"
    case .Em:
      return "em"
    case .I:
      return "i"
    case .A:
      return "a"
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

public class MasonTextLayer: CALayer {
  weak var textView: MasonText? = nil
  
  public override init() {
    super.init()
    needsDisplayOnBoundsChange = true
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    needsDisplayOnBoundsChange = true
  }
  
  public override init(layer: Any) {
    super.init(layer: layer)
    needsDisplayOnBoundsChange = true
  }
  
  public override func draw(in context: CGContext) {
    guard let textView = textView else {
      return
    }
    
    textView.style.mBackground.draw(on: self, in: context, rect: bounds)
    textView.engine.drawText(context: context, rect: bounds)
    textView.style.mBorderRender.draw(in: context, rect: bounds)
  }
}


// MARK: - MasonText Main Class
@objc(MasonText)
@objcMembers
public class MasonText: UIView, MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener, TextContainer {
  // MARK: Properties
  public let node: MasonNode
  public let type: MasonTextType
  
  lazy public var engine = {
    TextEngine(container: self)
  }()
  
  private var frameCache: [Int: CTFrame] = [:] // keyed by hash of attributed string + width
  
  private func cachedFrame(for text: NSAttributedString, width: CGFloat) -> CTFrame {
    let key = text.hash ^ width.hashValue
    if let cached = frameCache[key] {
      return cached
    }
    
    let framesetter = CTFramesetterCreateWithAttributedString(text)
    let path = CGPath(rect: CGRect(x: 0, y: 0, width: width, height: .greatestFiniteMagnitude), transform: nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: text.length), path, nil)
    
    frameCache[key] = frame
    return frame
  }
  
  public override class var layerClass: AnyClass { MasonTextLayer.self }
  
  var textLayer: MasonTextLayer {
    return layer as! MasonTextLayer
  }
  
  public var textValues: NSMutableData {
    get {
      return style.textValues
    }
  }
  
  
  public func onTextStyleChanged(change: Int64) {
    engine.onTextStyleChanged(change: change)
  }
  
  
  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
    return node.style
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
    node = mason.createTextNode(isAnonymous: isAnonymous)
    type = .None
    super.init(frame: .zero)
    node.isAnonymous = isAnonymous
    initText()
  }
  
  public override func setNeedsDisplay() {
    if(engine.drawState == DrawState.idle){
      super.setNeedsDisplay()
      engine.drawState = DrawState.pending
    }
  }
  
  
  public func requestLayout() {
    engine.invalidateInlineSegments()
    // handle text nesting
    if(node.parent?.view is TextContainer){
      if(!engine.shouldFlattenTextContainer(self)){
        setNeedsDisplay()
      }
      if let parent = node.parent?.view as? MasonText{
        parent.requestLayout()
      }
      return
    }
    textLayer.setNeedsDisplay()
    let root = node.getRootNode()
    let view = if(root.type == .document){
      root.document?.documentElement as? MasonElement
    }else {
      root.view as? MasonElement
    }
    
    if let view = view {
      if(view.computeCacheDirty){
        let computed = view.computeCache()
        view.computeWithSize(Float(computed.width), Float(computed.height))
      }
      setNeedsDisplay()
    }
  }
  
  public func addView(_ view: UIView){
    if(view.superview == self){
      return
    }
    if(view is MasonElement){
      append((view as! MasonElement))
    }else {
      append(node: node.mason.nodeForView(view))
    }
  }
  
  public func addView(_ view: UIView, at: Int){
    if(view.superview == self){
      return
    }
    
    if(view is MasonElement){
      node.addChildAt((view as! MasonElement).node, at)
    }else {
      node.addChildAt(node.mason.nodeForView(view), at)
    }
  }
  
  
  private func initText(){
    isOpaque = false
    textLayer.textView = self
    textLayer.contentsScale = UIScreen.main.scale
    style.setStyleChangeListener(listener: self)
    node.view = self
    node.measureFunc = { [self] known, available in
      let type = self.type
      return TextEngine.measure(engine, type == .None || type == .Span || type == .Code || type == .B , known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
    let scale = NSCMason.scale
    node.inBatch = true
    switch(type){
    case .None:
      // noop
      break
    case .P:
      style.display = .Block
      style.margin = MasonRect(.Points(16 * scale), .Points(0), .Points(16 * scale), .Points(0))
      break
    case .Span:
      break
    case .Code:
      break
    case .H1:
      fontSize = 32
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(16 * scale), .Points(0), .Points(16 * scale), .Points(0))
      break
    case .H2:
      fontSize = 24
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(14 * scale), .Points(0), .Points(14 * scale), .Points(0))
      break
    case .H3:
      fontSize = 18
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(12 * scale), .Points(0), .Points(12 * scale), .Points(0))
      break
    case .H4:
      fontSize = 16
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(10 * scale), .Points(0), .Points(10 * scale), .Points(0))
      break
    case .H5:
      fontSize = 13
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(8 * scale), .Points(0), .Points(8 * scale), .Points(0))
      break
    case .H6:
      fontSize = 10
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(6 * scale), .Points(0), .Points(6 * scale), .Points(0))
      break
    case .Li:
      break
    case .Blockquote:
      style.font.style = "italic"
      let indent: Float = 40 * scale
      style.display = .Block
      style.margin = MasonRect(.Points(indent), .Points(0), .Points(indent), .Points(0))
      break
    case .B, .Strong:
      style.font.weight = .bold
      break
    case .Pre:
      style.font = NSCFontFace(family: "ui-monospace")
      whiteSpace = .Pre
      break
    case .I, .Em:
      style.font.style = "italic"
      break
    case .A:
      node.style.display = Display.Inline
      node.style.decorationLine = DecorationLine.Underline
      let recognizer = MasonGestureRecognizer(targetView: self)
      recognizer.owner = self
      addGestureRecognizer(recognizer)
      break
    }
    
    style.font.loadSync { _ in }
    node.inBatch = false
  }
  
  
  
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  // MARK: - Text Style Properties
  
  // Text overflow
  public var textOverflow: TextOverflow {
    get {
      return style.textOverflow
    }
    set {
      style.textOverflow = newValue
    }
  }
  
  public var textOverflowCompat: TextOverflowCompat {
    get {
      return style.textOverflowCompat
    }
    set {
      style.textOverflowCompat = newValue
    }
  }
  
  
  public var color: UInt32 {
    get {
      return style.color
    }
    set {
      style.color = newValue
    }
  }
  
  public func setColor(ui color: UIColor) {
    self.color = color.toUInt32()
  }
  
  public var backgroundColorValue: UInt32 {
    get {
      return style.backgroundColor
    }
    set {
      style.backgroundColor = newValue
    }
  }
  
  public func setBackgroundColor(ui color: UIColor) {
    style.backgroundColor = color.toUInt32()
  }
  
  
  public var decorationColor: UInt32 {
    get {
      return style.decorationColor
    }
    set {
      style.decorationColor = newValue
    }
  }
  
  public func setDecorationColor(ui color: UIColor) {
    style.decorationColor = color.toUInt32()
  }
  
  public var decorationLine: DecorationLine {
    get {
      return style.decorationLine
    }
    set {
      style.decorationLine = newValue
    }
  }
  
  public var fontSize: Int32 {
    get {
      return style.fontSize
    }
    set {
      style.fontSize = newValue
    }
  }
  
  public var fontStyle: FontStyle {
    get {
      return style.fontStyle
    }
    set {
      style.fontStyle = newValue
    }
  }
  
  public func setFontStyle(_ style: FontStyle, slant: Int32) {
    self.style.setFontStyle(style, slant)
  }
  
  
  public var fontWeight: String {
    get {
      return style.fontWeight
    }
    set {
      style.fontWeight = newValue
    }
  }
  
  public var textTransform: TextTransform {
    get {
      return style.textTransform
    }
    set {
      style.textTransform = newValue
    }
  }
  
  
  public var whiteSpace: WhiteSpace {
    get {
      return style.whiteSpace
    }
    set {
      style.whiteSpace = newValue
    }
  }
  
  
  public var textWrap: TextWrap {
    get {
      return style.textWrap
    }
    set {
      style.textWrap = newValue
    }
  }
  
  public var lineHeight: Float {
    get {
      return style.lineHeight
    }
    set {
      style.lineHeight = newValue
    }
  }
  
  /// Text content - sets or gets the concatenated text from all text nodes
  public var textContent: String {
    get {
      engine.textContent
    }
    set {
      engine.textContent = newValue
    }
  }
}

// MARK: - Invalidation
extension MasonText {
  
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
    
    engine.invalidateInlineSegments()
    node.markDirty()
    return child
  }
  
  /// Insert child at specific index
  internal func insertChild(_ child: MasonNode, at index: Int) {
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
    
    engine.invalidateInlineSegments()
    node.markDirty()
  }
  
  
  /// Insert child at specific index
  internal func replaceChild(_ child: MasonNode, at index: Int) {
    if(index < 0 || index >= node.children.count) {
      return
    }
    
    if let oldParent = child.parent, oldParent !== node {
      if let textParent = oldParent.view as? MasonText {
        textParent.removeChild(child)
      }
    }
    
    let removing = node.children[index]
    removeChild(removing)
    
    node.children[index] = child
    
    child.parent = node
    
    // Sync layout tree if it's a real node
    if child.nativePtr != nil {
      syncLayoutChildren()
    }
    
    engine.invalidateInlineSegments()
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
      if(!textNode.attributesInitialized){
        textNode.attributes = getDefaultAttributes()
        textNode.attributesInitialized = true
      }
    }
    
    node.children.append(child)
    child.parent = node
    
    
    invalidate()
  }
  
  internal func syncLayoutChildren() {
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
}

// MARK: - Text Content Management
extension MasonText {
  
  /// Append text to the container
  internal func appendText(_ text: String) {
    
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
    
    engine.invalidateInlineSegments()
    requestLayout()
  }
}
