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

enum DrawState: BitwiseCopyable {
  case idle
  case pending
  case drawing
}


// MARK: - MasonText Main Class
@objc(MasonText)
@objcMembers
public class MasonText: UIView, MasonElement, MasonElementObjc, StyleChangeListener {
  // MARK: Properties
  public let node: MasonNode
  public let type: MasonTextType
  internal var drawState: DrawState = .idle
  
  public var textValues: NSMutableData {
    get {
      return style.textValues
    }
  }
  
  
  func onTextStyleChanged(change: Int64) {
    let change = TextStyleChangeMasks(rawValue: change)
    var dirty = false
    var layout = false
    if (change.contains(.color)) {
      dirty = true
    }
    
    if (change.contains(.fontSize)) {
      layout = true
      dirty = true
    }
    
    if (change.contains(.fontWeight) || change.contains(.fontStyle) || change.contains(.fontFamily)) {
      dirty = true
    }
    
    
    if (
      change.contains(.textWrap) || change.contains(.whiteSpace) || change.contains(.textTransform) || change.contains(.decorationLine) || change.contains(.decorationColor) || change.contains(.decorationStyle) || change.contains(.letterSpacing) || change.contains(.textJustify) || change.contains(.backgroundColor) || change.contains(.lineHeight)
    ) {
      dirty = true
    }
    
    
    if (dirty) {
      updateStyleOnTextNodes()
      invalidateInlineSegments()
      if (layout) {
        if (node.isAnonymous) {
          node.layoutParent?.markDirty()
        }
        invalidateLayout()
      }else {
        invalidate()
      }
    }
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
    if(drawState == .idle){
      super.setNeedsDisplay()
      drawState = .pending
    }
  }
  
  
  public func requestLayout() {
    invalidateInlineSegments()
    // handle text nesting
    if(node.parent?.view is MasonText){
      if(!shouldFlattenTextContainer(self)){
        setNeedsDisplay()
      }
      if let parent = node.parent?.view as? MasonText{
        parent.requestLayout()
      }
      return
    }
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
    style.setStyleChangeListener(listener: self)
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
      style.display = .Block
      style.margin = MasonRect(.Points(0), .Points(0), .Points(16 * scale), .Points(16 * scale))
      break
    case .Span:
      break
    case .Code:
      break
    case .H1:
      fontSize = 32
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(0), .Points(0), .Points(16 * scale), .Points(16 * scale))
      break
    case .H2:
      fontSize = 24
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(0), .Points(0), .Points(14 * scale), .Points(14 * scale))
      break
    case .H3:
      fontSize = 18
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(0), .Points(0), .Points(12 * scale), .Points(12 * scale))
      break
    case .H4:
      fontSize = 16
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(0), .Points(0), .Points(10 * scale), .Points(10 * scale))
      break
    case .H5:
      fontSize = 13
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(0), .Points(0), .Points(8 * scale), .Points(8 * scale))
      break
    case .H6:
      fontSize = 10
      style.display = .Block
      style.font.weight = .bold
      style.margin = MasonRect(.Points(0), .Points(0), .Points(6 * scale), .Points(6 * scale))
      break
    case .Li:
      break
    case .Blockquote:
      style.font.style = "italic"
      let indent: Float = 40 * scale
      style.display = .Block
      style.margin = MasonRect(.Points(indent), .Points(0), .Points(indent), .Points(0))
      break
    case .B:
      style.font.weight = .bold
      break
    case .Pre:
      style.font = NSCFontFace(family: "ui-monospace")
      whiteSpace = .Pre
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
      requestLayout()
    }
  }
  
  // Update attributes on all direct TextNode children when styles change
  internal func updateStyleOnTextNodes() {
    let defaultAttrs = getDefaultAttributes()
    
    for child in node.children {
      if let child = (child as? MasonTextNode), child.container == self {
        // Only update TextNodes that belong to THIS TextView
        // Don't touch TextNodes that belong to child TextViews
        child.attributes = defaultAttrs
      }
    }
  }
  
  private var isBuilding = false
  internal var cachedAttributedString: NSAttributedString?
  
  // monotonically increasing version for invalidation; cachedAttributedString is valid when
  // attributedStringVersion == segmentsInvalidateVersion
  private var attributedStringVersion: Int = 0
  private var segmentsInvalidateVersion: Int = 0
  
  internal func buildAttributedString(forMeasurement: Bool = false) -> NSAttributedString {
    // Return cached version if valid
    if let cached = cachedAttributedString, attributedStringVersion == segmentsInvalidateVersion {
      return cached
    }
    
    if isBuilding {
      return NSMutableAttributedString()
    }
    
    isBuilding = true
    defer { isBuilding = false }
    
    let composed = NSMutableAttributedString()
    
    for child in node.children {
      // Build current attributed fragment depending on child type
           var fragment: NSAttributedString?
     
           if let textNode = child as? MasonTextNode {
             fragment = textNode.attributed()
           } else if let textView = child.view as? MasonText {
             if shouldFlattenTextContainer(textView) {
               fragment = textView.buildAttributedString(forMeasurement: forMeasurement)
             } else {
               fragment = createPlaceholder(for: child)
             }
           } else if (child.view != nil && child.nativePtr != nil) {
             fragment = createPlaceholder(for: child)
           }
     
           guard let frag = fragment, frag.length > 0 else {
             // still append empty fragments to preserve run ordering if needed
             if let frag = fragment {
               composed.append(frag)
             }
             continue
           }
     
           // If previous fragment ended without whitespace and this one starts without whitespace,
           // insert a single separating space when white-space rules allow collapsing (i.e. not Pre).
           if composed.length > 0 {
             let prevEndsWithSpace: Bool = {
               guard let last = composed.string.unicodeScalars.last else { return false }
               return CharacterSet.whitespacesAndNewlines.contains(last)
             }()
     
             let newStartsWithSpace: Bool = {
               guard let first = frag.string.unicodeScalars.first else { return false }
               return CharacterSet.whitespacesAndNewlines.contains(first)
             }()
     
             // Only insert when neither side already has whitespace and white-space mode permits collapsing
             if !prevEndsWithSpace && !newStartsWithSpace {
               let ws = node.style.whiteSpace
               if ws != .Pre {
                 let spaceAttr = NSAttributedString(string: " ", attributes: getDefaultAttributes())
                 composed.append(spaceAttr)
               }
             }
           }
     
           composed.append(frag)
    }
    
    // Cache the result
    cachedAttributedString = composed
    // mark cached string as up-to-date with the current invalidate version
    attributedStringVersion = segmentsInvalidateVersion
    
    return composed
  }
  
  
}

// MARK: - Layout & Measurement
extension MasonText {
  private static func measure(_ view: MasonText, _ known: CGSize?, _ available: CGSize) -> CGSize {
    // Build attributed string with measurement flag
    let text = view.buildAttributedString(forMeasurement: true)
    
    let isInLine = view.type == .None || view.type == .Span || view.type == .Code || view.type == .B
    
    if let known = known {
      if !isInLine && (!known.width.isNaN && known.width >= 0) && (!known.height.isNaN && known.height >= 0) {
        return known
      }
    }
    
    var maxWidth = CGFloat.greatestFiniteMagnitude
    

    var allowWrap = true
      if view.node.style.isTextValueInitialized {
        let ws = view.node.style.whiteSpace
        // No wrap for pre / nowrap
        if ws == .Pre || ws == .NoWrap { allowWrap = false }
        // Explicit override
        if view.node.style.textWrap == .NoWrap { allowWrap = false }
      }
    
    
    if allowWrap, available.width.isFinite && available.width > 0 {
      if !available.width.isNaN && available.width > 0 {
        maxWidth = available.width / CGFloat(NSCMason.scale)
      }
    }
    
    // Create framesetter and frame to collect segments
    let framesetter = CTFramesetterCreateWithAttributedString(text)
    
    let constraintSize = CGSize(width: maxWidth, height: .greatestFiniteMagnitude)
    let path = CGPath(rect: CGRect(origin: .zero, size: constraintSize), transform: nil)
    
    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)
    
    // Now calculate the size
    var size = CTFramesetterSuggestFrameSizeWithConstraints(
      framesetter,
      CFRangeMake(0, text.length),
      nil,
      constraintSize,
      nil
    )
    
    
    // IMPORTANT: Collect and push segments to Rust BEFORE returning size
    view.collectAndCacheSegments(from: frame)
    
    let scale = CGFloat(NSCMason.scale)
    size.width = (size.width * scale).rounded(.up)
    size.height = size.height * scale
    
    if let known = known {
      if !known.width.isNaN && known.width >= 0 {
        size.width = known.width
      }
      
      if !known.height.isNaN && known.height >= 0 {
        size.height = known.height
      }
    }
    
    
    view.node.cachedWidth = size.width
    view.node.cachedHeight = size.height
    
    return size
  }
}

// MARK: - Drawing
extension MasonText {
  public override func draw(_ rect: CGRect) {
    
    drawState = .drawing
    // Build attributed string for drawing (uses cache if valid)
    let text = buildAttributedString(forMeasurement: false)
    
    guard let context = UIGraphicsGetCurrentContext() else {
      drawState = .idle
      return
    }
    
    context.textMatrix = .identity
    context.saveGState()
    context.translateBy(x: 0, y: bounds.height)
    context.scaleBy(x: 1.0, y: -1.0)
    
    // Handle nowrap case
    if textWrap == .NoWrap {
      drawSingleLine(text: text, in: context)
      context.restoreGState()
      drawState = .idle
      return
    }
    // Multi-line text
    drawMultiLine(text: text, in: context)
    context.restoreGState()
    drawState = .idle
  }
  
  private func drawSingleLine(text: NSAttributedString, in context: CGContext) {
    var drawBounds = bounds
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
      context.saveGState()
      context.clip(to: drawBounds)
    }
    
  
    
    let line = CTLineCreateWithAttributedString(text)
    
    var ascent: CGFloat = 0
    var descent: CGFloat = 0
    var leading: CGFloat = 0
    let _ = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, &leading))
    
    let ctBounds = CGRect(
        x: drawBounds.minX,
        y: bounds.height - drawBounds.maxY,
        width: drawBounds.width,
        height: drawBounds.height
      )
    
    

    var originX = drawBounds.origin.x
       
    
    // Alignment from paragraph style
//     var flush: CGFloat = 0.0 // 0=left, 0.5=center, 1=right
//     if let para = text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle {
//       switch para.alignment {
//       case .center: flush = 0.5
//       case .right:  flush = 1.0
//       default:      flush = 0.0
//       }
//     }
//
//    // Horizontal offset inside ctBounds respecting alignment
//        let penOffset = CGFloat(CTLineGetPenOffsetForFlush(line, Double(flush), Double(ctBounds.width)))
//
//        // Baseline at top of ctBounds (single line)
//        let baselineOrigin = CGPoint(x: ctBounds.minX + penOffset, y: ctBounds.maxY - ascent)
//        context.textPosition = baselineOrigin

    
   let baselineOrigin = CGPoint(x: originX, y: drawBounds.origin.y)
    
    
    
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
    drawInlineAttachments(
      for: drawLine,
      origin: baselineOrigin,
      frameBounds: drawBounds,
      clipRect: drawBounds,
      in: context
    )
    
    if !node.computedLayout.padding.isEmpty() {
      context.restoreGState()
    }
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
      if origin.y >= drawBounds.minY && origin.y <= drawBounds.maxY {
        drawInlineAttachments(
          for: line,
          origin: origin,
          frameBounds: layoutBounds,
          clipRect: drawBounds,
          in: context
        )
      }
    }
  }
  
  private func drawInlineAttachments(
    for line: CTLine,
    origin: CGPoint,
    frameBounds: CGRect,
    clipRect: CGRect,
    in context: CGContext
  ) {
    let runs = CTLineGetGlyphRuns(line) as? [CTRun] ?? []
    var d: [ViewHelper]  = []
    
    for run in runs {
      let attrs = CTRunGetAttributes(run) as NSDictionary
      
      guard let helper = attrs[NSAttributedString.Key(Constants.VIEW_PLACEHOLDER)] as? ViewHelper else {
        continue
      }
      d.append(helper)
      
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      let _ = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, &descent, nil))
      
      // let glyphRange = CTRunGetStringRange(run)
      var runPosition = CGPoint.zero
      CTRunGetPositions(run, CFRange(location: 0, length: 1), &runPosition)
      
      let scale = CGFloat(NSCMason.scale)
      let childWidth = CGFloat(helper.node.cachedWidth / scale)
      let childHeight = CGFloat(helper.node.cachedHeight / scale)
      
      // Core Text position: origin is the baseline, x is the glyph offset
      let ctX = origin.x + runPosition.x
      let ctBaseline = origin.y
      
      // The child should sit on the baseline
      // In Core Text coords (bottom-left origin), child bottom = baseline - descent
      let ctY = ctBaseline - descent
      
      // Convert to UIKit coordinates (top-left origin)
      // Core Text Y increases upward, UIKit Y increases downward
      let uiX = ctX
      let uiY = bounds.height - ctY - childHeight
      
      let drawRect = CGRect(x: uiX, y: uiY, width: childWidth, height: childHeight)
      
      guard clipRect.intersects(drawRect) else { continue }
      guard let childView = helper.view else { continue }
      
      context.saveGState()
      context.clip(to: clipRect)
      
      // Translate to child origin, flip Y for UIKit rendering
      context.translateBy(x: drawRect.origin.x, y: drawRect.origin.y + drawRect.height)
      context.scaleBy(x: 1, y: -1)
      
      // Ensure child has correct size (only if changed)
      if childView.bounds.size != drawRect.size {
        childView.frame = CGRect(origin: .zero, size: drawRect.size)
        childView.layoutIfNeeded()
      }
      
      childView.layer.render(in: context)
      
      context.restoreGState()
    }
  }
  
  /// Collect inline segments and push to Rust
  /// This is called during measure to provide segments before Rust's inline layout runs
  private func collectAndCacheSegments(from frame: CTFrame) {
    
    let lines = CTFrameGetLines(frame) as? [CTLine] ?? []
    
    guard !lines.isEmpty else {
      // Empty text - send empty segments
      if let ptr = node.nativePtr {
        mason_node_clear_segments(node.mason.nativePtr, ptr)
      }
      attributedStringVersion = segmentsInvalidateVersion
      return
    }
    
    var segments: [CMasonSegment] = []
    let scale = CGFloat(NSCMason.scale)
    
    for (_, line) in lines.enumerated() {
      let runs = CTLineGetGlyphRuns(line) as? [CTRun] ?? []
      
      for (_, run) in runs.enumerated() {
        var ascent: CGFloat = 0
        var descent: CGFloat = 0
        let width = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, &descent, nil))
        
        
        let attrs = CTRunGetAttributes(run) as NSDictionary
        
        // Check if this is an inline child placeholder
        if let helper = attrs[NSAttributedString.Key(Constants.VIEW_PLACEHOLDER)] as? ViewHelper {
          if let childPtr = helper.node.nativePtr {
            var segment = CMasonSegment()
            segment.tag = InlineChild
            segment.inline_child = CMasonInlineChildSegment(node: childPtr, descent: Float(ascent * scale))
            segments.append(segment)
          }
        } else {
          // Text segment
          var segment = CMasonSegment()
          segment.tag = Text
          segment.text = CMasonInlineTextSegment(width: Float(width * scale).rounded(.up), ascent: Float(ascent * scale), descent: Float(descent * scale))
          
          segments.append(segment)
        }
      }
    }
    
    
    if let ptr = node.nativePtr {
      if(segments.isEmpty){
        mason_node_clear_segments(node.mason.nativePtr, ptr)
      }else {
        mason_node_set_segments(node.mason.nativePtr, ptr, &segments, UInt(segments.count))
      }
    }
    
    // segments are up-to-date now — align attributedStringVersion so cache checks succeed
    attributedStringVersion = segmentsInvalidateVersion
  }
}


// MARK: - Invalidation
extension MasonText {
  
  
  /// Mark segments as needing rebuild
  func invalidateInlineSegments(_ markDirty: Bool = true) {
    segmentsInvalidateVersion &+= 1
    cachedAttributedString = nil
    if(markDirty){
      node.markDirty()
    }
  }
  
  func invalidate() {
    invalidateInlineSegments()
    requestLayout()
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
    
    invalidateInlineSegments()
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
  let scale = CGFloat(NSCMason.scale)
  let height = node.cachedHeight / scale
  return height
}

private func runDelegateGetDescent(_ refCon: UnsafeMutableRawPointer) -> CGFloat {
  return 0
}

private func runDelegateGetWidth(_ refCon: UnsafeMutableRawPointer) -> CGFloat {
  let node = Unmanaged<MasonNode>.fromOpaque(refCon).takeUnretainedValue()
  let scale = CGFloat(NSCMason.scale)
  let width = node.cachedWidth / scale
  return width
}

// MARK: - Attributed String Building
extension MasonText {
  
  /// Build attributed string from text nodes and inline children
  internal func buildAttributedString() -> NSAttributedString {
    return buildAttributedString(forMeasurement: false)
  }
  
  /// Decide whether to flatten a nested text container or treat it as inline-block
  internal func shouldFlattenTextContainer(_ textView: MasonText) -> Bool {
    let style = textView.node.style
    
    // If style is not initialized, flatten by default
    guard style.isValueInitialized else {
      return true
    }
    
    // Check for view-like properties that require inline-block behavior
    let hasBackground =  textView.backgroundColorValue != 0 || textView.backgroundColor?.cgColor.alpha ?? 0 > 0 //style.backgroundColor.alpha > 0.0
    
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
    placeholder.addAttribute(NSAttributedString.Key(Constants.VIEW_PLACEHOLDER),
                             value: helper,
                             range: NSRange(location: 0, length: 1))
    
    // IMPORTANT: Add a unique attribute to force separate runs
    // Without this, CoreText may merge adjacent placeholders into one run
    placeholder.addAttribute(NSAttributedString.Key("ViewID"),
                             value: ObjectIdentifier(child).hashValue,
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
    
    invalidateInlineSegments()
    requestLayout()
  }
}
