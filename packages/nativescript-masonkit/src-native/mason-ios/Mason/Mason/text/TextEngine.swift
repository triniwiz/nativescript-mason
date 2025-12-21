//
//  MasonTextEngine.swift
//  Mason
//
//  Created by Osei Fortune on 02/12/2025.
//

import UIKit

enum DrawState: BitwiseCopyable {
  case idle
  case pending
  case drawing
}


// MARK: - Run Delegate Callbacks
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


@objc(MasonTextContainer)
public protocol TextContainer: NSObjectProtocol {
  var engine: TextEngine { get }
  var node: MasonNode { get }
}

extension TextContainer {
  var defaultAttributes: [NSAttributedString.Key: Any] {
    return node.getDefaultAttributes()
  }
  
  func onTextStyleChanged(change: Int64){}
}


@objc(MasonTextEngine)
public class TextEngine: NSObject {
  
  internal var drawState: DrawState = .idle
  
  let container: TextContainer
  
  var node: MasonNode {
    return container.node
  }
  
  var style: MasonStyle {
    return container.node.style
  }
  
  init(container: TextContainer) {
    self.container = container
  }
  
  internal func handlePressDown() {
    style.mBackground.isActive = true
  }
  
  internal func handlePressUp() {
    style.mBackground.isActive = false
  }
  
  internal func handlePressCancel() {
    style.mBackground.isActive = false
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
      let textNode = MasonTextNode(mason: node.mason, data: newValue, attributes: node.getDefaultAttributes())
      textNode.container = container
      
      // Add to children
      node.children.append(textNode)
      textNode.parent = node
      
      // Clear layout tree (text nodes don't have nativePtr)
      if let ptr = node.nativePtr {
        mason_node_remove_children(node.mason.nativePtr, ptr)
      }
      
      invalidateInlineSegments()
      (node.view as? MasonElement)?.requestLayout()
    }
  }
  
  // Update attributes on all direct TextNode children when styles change
  internal func updateStyleOnTextNodes() {
    let defaultAttrs = node.getDefaultAttributes()
    
    for child in node.children {
      if let child = (child as? MasonTextNode), child.container?.isEqual(self) ?? false {
        // Only update TextNodes that belong to this TextView
        child.attributes = defaultAttrs
      }
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
      change.contains(.verticalAlign) || change.contains(.textWrap) || change.contains(.whiteSpace) || change.contains(.textTransform) || change.contains(.decorationLine) || change.contains(.decorationColor) || change.contains(.decorationStyle) || change.contains(.letterSpacing) || change.contains(.textJustify) || change.contains(.backgroundColor) || change.contains(.lineHeight)
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
        (node.view as? MasonElement)?.invalidateLayout()
      }else {
        invalidate()
      }
    }
  }
  
  
  // MARK: - Measurement
  
  static func measure(_ engine: TextEngine, _ isInLine: Bool, isBlock: Bool = false, _ known: CGSize?, _ available: CGSize) -> CGSize {
    // Build attributed string with measurement flag
    let text = engine.buildAttributedString(forMeasurement: true)
    
    if let known = known {
      if (!isInLine || isBlock) && (!known.width.isNaN && known.width >= 0) && (!known.height.isNaN && known.height >= 0) {
        return known
      }
    }
    
    var maxWidth = CGFloat.greatestFiniteMagnitude
    var maxHeight = CGFloat.greatestFiniteMagnitude
    
    
    var allowWrap = true
    if engine.node.style.isTextValueInitialized {
      let ws = engine.node.style.whiteSpace
      // No wrap for pre / nowrap
      if ws == .Pre || ws == .NoWrap { allowWrap = false }
      // Explicit override
      if engine.node.style.textWrap == .NoWrap { allowWrap = false }
    }
    
    
    if allowWrap, available.width.isFinite && available.width > 0 {
      if !available.width.isNaN && available.width > 0 {
        maxWidth = available.width / CGFloat(NSCMason.scale)
      }
    }
    
    if let known = known {
      if(isBlock && known.height.isFinite && known.height > 0){
        maxHeight = known.height / CGFloat(NSCMason.scale)
      }
    }
    
    // Create framesetter and frame to collect segments
    let framesetter = CTFramesetterCreateWithAttributedString(text)
    
    let constraintSize = CGSize(width: maxWidth, height: maxHeight)
    let path = CGPath(rect: CGRect(origin: .zero, size: constraintSize), transform: nil)
    
    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)
    
    // Now calculate the size
    // todo handle Float
    var size = CTFramesetterSuggestFrameSizeWithConstraints(
      framesetter,
      CFRangeMake(0, text.length),
      nil,
      constraintSize,
      nil
    )
    
    if text.length > 0 && size.width <= 0 {
      let line = CTLineCreateWithAttributedString(text)
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      let lineWidth = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, nil))
      
      if lineWidth > 0 {
        size.width = lineWidth
      }
    }
    
    
    // IMPORTANT: Collect and push segments to Rust BEFORE returning size
    engine.collectAndCacheSegments(from: frame, constraintSize)
    
    
    let scale = CGFloat(NSCMason.scale)
    if(!isInLine && maxWidth < CGFloat.greatestFiniteMagnitude && maxWidth != .greatestFiniteMagnitude){
      size.width = (maxWidth * scale).rounded(.up)
    }else {
      size.width = (size.width * scale).rounded(.up)
    }
    
    
    size.height = (size.height * scale).rounded(.up)
    
    if let known = known {
      if !known.width.isNaN && known.width >= 0 {
        size.width = known.width
      }
      
      if !known.height.isNaN && known.height >= 0 {
        size.height = known.height
      }
    }
    
    
    engine.node.cachedWidth = size.width
    engine.node.cachedHeight = size.height
    
    return size
  }
  
  
  private var isBuilding = false
  internal var cachedAttributedString: NSAttributedString?
  
  // monotonically increasing version for invalidation; cachedAttributedString is valid when
  // attributedStringVersion == segmentsInvalidateVersion
  private var segmentsInvalidateVersion: UInt64 = 0
  private var attributedStringVersion: UInt64 = 0
  
  
  
  
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
    (node.view as? MasonElement)?.requestLayout()
  }
  
  
  
  /// Decide whether to flatten a nested text container or treat it as inline-block
  internal func shouldFlattenTextContainer(_ container: TextContainer) -> Bool {
    let style = container.node.style
    
    // If style is not initialized, flatten by default
    guard style.isValueInitialized else {
      return true
    }
    
    // Check for view-like properties that require inline-block behavior
    let hasBackground =  container.node.style.backgroundColor != 0 || container.node.view?.backgroundColor?.cgColor.alpha ?? 0 > 0 //style.backgroundColor.alpha > 0.0
    
    let border = style.mBorderRender
    let hasBorder = border.top.width.value > 0.0 || border.right.width.value > 0.0 ||
    border.bottom.width.value > 0.0 || border.left.width.value > 0.0
    
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
    placeholder.addAttribute(Constants.VIEW_PLACEHOLDER_KEY,
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
  
  
  
  // MARK: - Drawing
  internal  func fakeBoldStroke(for weight: CGFloat, fontSize: CGFloat) -> CGFloat {
    switch weight {
    case ..<500: return 0
    case 500..<600: return fontSize * 0.03
    case 600..<700: return fontSize * 0.06
    case 700..<800: return fontSize * 0.1
    case 800..<900: return fontSize * 0.125
    default: return fontSize * 0.15
    }
  }
  
  internal func drawSingleLine(text: NSAttributedString, in context: CGContext, bounds: CGRect) {
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
    
    var originX = drawBounds.origin.x
    let baselineOrigin = CGPoint(x: originX, y: drawBounds.origin.y)
    
    var drawLine: CTLine = line
    
    // Apply text overflow truncation
    switch style.textOverflow {
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
    
    // Draw runs, skipping placeholders
    let runs = CTLineGetGlyphRuns(drawLine) as? [CTRun] ?? []
    context.textPosition = baselineOrigin
    
    for run in runs {
      let attrs = CTRunGetAttributes(run) as? [NSAttributedString.Key: Any] ?? [:]
      
      // Skip placeholder runs - handled by drawInlineAttachments
      if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil {
        continue
      }
      
      if let ctFont = attrs[.font], CFGetTypeID(ctFont as CFTypeRef) == CTFontGetTypeID() {
        let font = ctFont as! CTFont
        let traits = CTFontCopyTraits(font) as? [CFString: Any]
        let symbolicTraits = CTFontGetSymbolicTraits(font)
        let isBold = symbolicTraits.contains(.traitBold)
        let weight = attrs[NSAttributedString.Key(Constants.FONT_WEIGHT)] as? CGFloat ?? traits?[kCTFontWeightTrait as CFString] as? CGFloat ?? 0
        
        if !isBold && weight >= 0.4 {
          drawRunWithFakeBold(run, in: context, at: baselineOrigin)
        } else {
          CTRunDraw(run, context, CFRange(location: 0, length: 0))
        }
      } else {
        CTRunDraw(run, context, CFRange(location: 0, length: 0))
      }
    }
    
    // Draw inline attachments
    drawInlineAttachments(
      for: drawLine,
      origin: baselineOrigin,
      frameBounds: drawBounds,
      clipRect: drawBounds,
      in: context,
      bounds: bounds
    )
    
    if !node.computedLayout.padding.isEmpty() {
      context.restoreGState()
    }
  }
  
  
  func drawRunWithFakeBold(_ run: CTRun, in context: CGContext, at lineOrigin: CGPoint, boldAmount: CGFloat = 1.0) {
    let glyphCount = CTRunGetGlyphCount(run)
    guard glyphCount > 0 else { return }
    
    var positions = [CGPoint](repeating: .zero, count: glyphCount)
    CTRunGetPositions(run, CFRange(location: 0, length: 0), &positions)
    
    // Draw multiple offsets to simulate bold
    let offsets: [CGPoint] = [
      .zero,
      CGPoint(x: boldAmount, y: 0),
      CGPoint(x: 0, y: boldAmount),
      CGPoint(x: boldAmount, y: boldAmount)
    ]
    
    for offset in offsets {
      context.textPosition = CGPoint(
        x: lineOrigin.x + offset.x,
        y: lineOrigin.y + offset.y
      )
      CTRunDraw(run, context, CFRange(location: 0, length: 0))
    }
  }
  
  
  
  internal func drawMultiLine(text: NSAttributedString, in context: CGContext, bounds: CGRect) {
    guard text.length > 0 else { return }
    
    let framesetter = CTFramesetterCreateWithAttributedString(text)
    
    var paddingRestore =  false
    var drawBounds = bounds
  
    guard drawBounds.width > 0 else { return }
    
    let computedPadding = node.computedLayout.padding
    if !computedPadding.isEmpty() {
      paddingRestore = true
    //  context.saveGState()
      let scale = NSCMason.scale
      let padding = UIEdgeInsets(
        top: CGFloat(computedPadding.top / scale),
        left: CGFloat(computedPadding.left / scale),
        bottom: CGFloat(computedPadding.bottom / scale),
        right: CGFloat(computedPadding.right / scale)
      )
      
      drawBounds = drawBounds.inset(by: padding)
      
      guard drawBounds.width > 0, drawBounds.height > 0 else { return }
    }
    
    
    let suggestedSize = CTFramesetterSuggestFrameSizeWithConstraints(
      framesetter,
      CFRange(location: 0, length: text.length),
      nil,
      CGSize(width: drawBounds.width, height: .greatestFiniteMagnitude),
      nil
    )
    
    var layoutBounds = CGRect(
      x: drawBounds.origin.x,
      y: drawBounds.origin.y,
      width: drawBounds.width,
      height: max(drawBounds.height, suggestedSize.height)
    )
    
    
   
    let path = CGPath(rect: layoutBounds, transform: nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: text.length), path, nil)
    
    context.saveGState()
    context.clip(to: bounds)
    
    let linesCF = CTFrameGetLines(frame)
    let linesCount = CFArrayGetCount(linesCF)
    
    guard linesCount > 0 else { context.restoreGState(); return }
    
    var origins = Array(repeating: CGPoint.zero, count: linesCount)
    CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &origins)
    
    for i in 0..<linesCount {
      let line = unsafeBitCast(CFArrayGetValueAtIndex(linesCF, i), to: CTLine.self)
      let lineOrigin = origins[i]
      
      let verticalOffset = max(
        0,
        (layoutBounds.height - suggestedSize.height) / 2
      )

      let lineWidth = CTLineGetTypographicBounds(line, nil, nil, nil)

       let horizontalOffset = max(
         0,
         (drawBounds.width - CGFloat(lineWidth)) / 2
       )
      
      context.textPosition = CGPoint(x: drawBounds.minX + horizontalOffset, y: lineOrigin.y + verticalOffset)
      
      let runsCF = CTLineGetGlyphRuns(line)
      let runCount = CFArrayGetCount(runsCF)
      
      for j in 0..<runCount {
        let run = unsafeBitCast(CFArrayGetValueAtIndex(runsCF, j), to: CTRun.self)
        
        guard let attributes = CTRunGetAttributes(run) as? [NSAttributedString.Key: Any] else { continue }
        
        // Skip placeholder runs - these are drawn by drawInlineAttachments
        if attributes[Constants.VIEW_PLACEHOLDER_KEY] != nil {
          continue
        }
        
        if let ctFont = attributes[.font], CFGetTypeID(ctFont as CFTypeRef) == CTFontGetTypeID() {
          let font = ctFont as! CTFont
          let traits = CTFontCopyTraits(font) as? [CFString: Any]
          let symbolicTraits = CTFontGetSymbolicTraits(font)
          let isBold = symbolicTraits.contains(.traitBold)
          let weight = attributes[NSAttributedString.Key(Constants.FONT_WEIGHT)] as? CGFloat ?? traits?[kCTFontWeightTrait as CFString] as? CGFloat ?? 0
          
          if !isBold && weight >= 0.4 {
            drawRunWithFakeBold(run, in: context, at: lineOrigin)
          } else {
            CTRunDraw(run, context, CFRange(location: 0, length: 0))
          }
        } else {
          CTRunDraw(run, context, CFRange(location: 0, length: 0))
        }
      }
    }
    
    context.restoreGState()
    
    guard text.containsAttachments else { return }
    
    for i in 0..<linesCount {
      let line = unsafeBitCast(CFArrayGetValueAtIndex(linesCF, i), to: CTLine.self)
      let lineOrigin = origins[i]
      
      drawInlineAttachments(for: line, origin: lineOrigin, frameBounds: layoutBounds, clipRect: drawBounds, in: context, bounds: bounds)
    }
    
    if(paddingRestore){
     // context.restoreGState()
    }
    
  }
  
  
  private func drawInlineAttachments(
      for line: CTLine,
      origin: CGPoint,
      frameBounds: CGRect,
      clipRect: CGRect,
      in context: CGContext,
      bounds: CGRect
    ) {
      let runs = CTLineGetGlyphRuns(line) as? [CTRun] ?? []
      
      for run in runs {
        let attrs = CTRunGetAttributes(run) as NSDictionary
        
        guard let helper = attrs[Constants.VIEW_PLACEHOLDER_KEY] as? ViewHelper else {
          continue
        }
        
        var ascent: CGFloat = 0
        var descent: CGFloat = 0
        let _ = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, &descent, nil))
        
        var runPosition = CGPoint.zero
        CTRunGetPositions(run, CFRange(location: 0, length: 1), &runPosition)
        
        let scale = CGFloat(NSCMason.scale)
        let childWidth = CGFloat(helper.node.cachedWidth / scale)
        let childHeight = CGFloat(helper.node.cachedHeight / scale)
        
        // Context is already in CoreText coordinates (flipped in drawText/drawMultiLine)
        // So use CoreText coordinates directly
        let ctX = origin.x + runPosition.x
        let ctY = origin.y - descent  // baseline minus descent = bottom of inline element
        
        let drawRect = CGRect(x: ctX, y: ctY, width: childWidth, height: childHeight)
        
        guard clipRect.intersects(drawRect) else { continue }
        guard let childView = helper.view else { continue }
        
        context.saveGState()
        context.clip(to: clipRect)
        
        // Translate to top of child (ctY + childHeight) and flip for UIView rendering
        context.translateBy(x: drawRect.origin.x, y: drawRect.origin.y + drawRect.height)
        context.scaleBy(x: 1, y: -1)
        
        if childView.bounds.size != drawRect.size {
          childView.frame = CGRect(origin: .zero, size: drawRect.size)
          childView.layoutIfNeeded()
        }
        childView.layer.render(in: context)
        
        context.restoreGState()
      }
    }
  
  
  func drawText(context: CGContext, rect: CGRect){
    drawState = .drawing
    // Build attributed string for drawing (uses cache if valid)
    let text = buildAttributedString(forMeasurement: false)
    context.saveGState()
    context.textMatrix = .identity
    context.translateBy(x: 0, y: rect.height)
    context.scaleBy(x: 1.0, y: -1.0)
    
    // Handle nowrap case
    if style.textWrap == .NoWrap {
      drawSingleLine(text: text, in: context, bounds: rect)
      context.restoreGState()
      drawState = .idle
      return
    }
    // Multi-line text
    drawMultiLine(text: text, in: context, bounds: rect)
    context.restoreGState()
    drawState = .idle
  }
  
  
  internal func buildAttributedString(forMeasurement: Bool = false) -> NSAttributedString {
    // Return cached version if valid
    if let cached = cachedAttributedString, attributedStringVersion == segmentsInvalidateVersion {
      return cached
    }
    
    if isBuilding {
        // Never return empty — return last known good value
        return cachedAttributedString ?? NSMutableAttributedString()
    }
    
    isBuilding = true
    defer { isBuilding = false }
    
    // build `composed` from child fragments using HTML-like whitespace collapsing
    let wsSet = CharacterSet.whitespacesAndNewlines
    let collapseRegex = try? NSRegularExpression(pattern: "\\s+", options: [])

    func collapsedString(_ s: String) -> String {
      guard let rx = collapseRegex else { return s }
      // replace runs of whitespace with single ASCII space
      let ns = s as NSString
      let r = rx.rangeOfFirstMatch(in: s, options: [], range: NSRange(location: 0, length: ns.length))
      if r.location == NSNotFound && !s.isEmpty { return s }
      return rx.stringByReplacingMatches(in: s, options: [], range: NSRange(location: 0, length: ns.length), withTemplate: " ")
    }

    let composed = NSMutableAttributedString()
    var prevEndedWithWhitespace = false

    for (childIndex, child) in node.children.enumerated() {
      var fragment: NSAttributedString?
      if let textNode = child as? MasonTextNode {
        fragment = textNode.attributed()
      } else if let textView = child.view as? TextContainer {
        if shouldFlattenTextContainer(textView) {
          fragment = textView.engine.buildAttributedString(forMeasurement: forMeasurement)
        } else {
          fragment = createPlaceholder(for: child)
        }
      } else if (child.view != nil && child.nativePtr != nil) {
        fragment = createPlaceholder(for: child)
      }

      guard let frag = fragment, frag.length > 0 else {
        // append empty frag (or skip) but update flags if needed
        if let frag = fragment {
          composed.append(frag)
          // update whitespace flag if the fragment contains text
          if frag.length > 0 {
            let first = (frag.string as NSString).substring(with: NSRange(location: 0, length: 1))
            prevEndedWithWhitespace = wsSet.contains(first.unicodeScalars.first!)
          } else {
            prevEndedWithWhitespace = false
          }
        }
        continue
      }

      // If white-space is pre, preserve fragment exactly
      if node.style.whiteSpace == .Pre {
        // append directly (no collapsing)
        composed.append(frag)
        let lastChar = (frag.string as NSString).substring(with: NSRange(location: frag.length - 1, length: 1))
        prevEndedWithWhitespace = wsSet.contains(lastChar.unicodeScalars.first!)
        continue
      }

      // Non-pre handling: collapse whitespace inside fragment to single spaces
      // But preserve attachments/placeholders intact
      let hasAttachment = (frag.attribute(Constants.VIEW_PLACEHOLDER_KEY, at: 0, effectiveRange: nil) != nil)
        || (frag.attribute(.attachment, at: 0, effectiveRange: nil) != nil)

      if hasAttachment {
        // If fragment is an attachment placeholder, treat it as a token.
        // If previous ended with whitespace and fragment's source doesn't start with explicit space,
        // a single separating space should be preserved by HTML collapse rules only when there was whitespace.
        if prevEndedWithWhitespace {
          // ensure one space between previous text and attachment (but avoid adding if previous ends with attachment)
          let lastIndex = composed.length - 1
          var lastIsAttachment = false
          if lastIndex >= 0 {
            if composed.attribute(Constants.VIEW_PLACEHOLDER_KEY, at: lastIndex, effectiveRange: nil) != nil ||
               composed.attribute(.attachment, at: lastIndex, effectiveRange: nil) != nil {
              lastIsAttachment = true
            }
          }
          if !lastIsAttachment {
            composed.append(NSAttributedString(string: " "))
          }
        }
        composed.append(frag)
        prevEndedWithWhitespace = false
        continue
      }

      // For normal text fragment: collapse internal whitespace
      let raw = frag.string
      let collapsed = collapsedString(raw)

      if collapsed.isEmpty {
        // nothing to append but mark prevEndedWithWhitespace if original had whitespace
        prevEndedWithWhitespace = raw.unicodeScalars.allSatisfy { wsSet.contains($0) }
        continue
      }

      // Determine starts/ends with space for collapsed fragment
      let startsWithSpace = collapsed.first?.unicodeScalars.first.map { wsSet.contains($0) } ?? false
      let endsWithSpace = collapsed.last?.unicodeScalars.first.map { wsSet.contains($0) } ?? false

      // prepare fragment attributes for the collapsed text
      let attrs = frag.attributes(at: 0, effectiveRange: nil)
      // strip leading/trailing single spaces from collapsed when appending (we'll handle separator)
      var middle = collapsed
      if startsWithSpace { middle.removeFirst() }
      if endsWithSpace { middle.removeLast() }

      // Insert separator if needed: if composed not empty and (prevEndedWithWhitespace || startsWithSpace)
      if composed.length > 0 && (prevEndedWithWhitespace || startsWithSpace) {
        // ensure one space between pieces (avoid double-space)
        let lastIndex = composed.length - 1
        var lastIsSpace = false
        if lastIndex >= 0 {
          let lastChar = (composed.string as NSString).substring(with: NSRange(location: lastIndex, length: 1))
          lastIsSpace = wsSet.contains(lastChar.unicodeScalars.first!)
        }
        if !lastIsSpace {
          // use attributes from current frag if possible, otherwise default node attrs
          var sepAttrs = attrs
          if sepAttrs[.font] == nil { sepAttrs[.font] = node.getDefaultAttributes()[.font] }
          if sepAttrs[.paragraphStyle] == nil { sepAttrs[.paragraphStyle] = node.getDefaultAttributes()[.paragraphStyle] }
          composed.append(NSAttributedString(string: " ", attributes: sepAttrs))
        }
      }

      // append the trimmed/collapsed middle text with frag attrs
      if !middle.isEmpty {
        let a = NSAttributedString(string: middle, attributes: attrs)
        composed.append(a)
      }

      // update prevEndedWithWhitespace to endsWithSpace
      prevEndedWithWhitespace = endsWithSpace
    }

    // After all fragments, trim single trailing space (HTML collapses trailing block-end whitespace)
    if composed.length > 0 {
      let lastIndex = composed.length - 1
      let lastChar = (composed.string as NSString).substring(with: NSRange(location: lastIndex, length: 1))
      if wsSet.contains(lastChar.unicodeScalars.first!) {
        // only remove if last char is not an attachment
        let isAttachment = (composed.attribute(Constants.VIEW_PLACEHOLDER_KEY, at: lastIndex, effectiveRange: nil) != nil)
          || (composed.attribute(.attachment, at: lastIndex, effectiveRange: nil) != nil)
        if !isAttachment {
          composed.deleteCharacters(in: NSRange(location: lastIndex, length: 1))
        }
      }
    }

    // Cache the result
    cachedAttributedString = composed
    attributedStringVersion = segmentsInvalidateVersion
    return composed
  }
  
  
  
  
  /// Collect inline segments and push to Rust
  /// This is called during measure to provide segments before Rust's inline layout runs
  private func collectAndCacheSegments(from frame: CTFrame, _ constraints: CGSize) {
    
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
        if let helper = attrs[Constants.VIEW_PLACEHOLDER_KEY] as? ViewHelper {
          if let childPtr = helper.node.nativePtr {
            var segment = CMasonSegment()
            segment.tag = InlineChild
            segment.inline_child = CMasonInlineChildSegment(node: childPtr, descent: Float(ascent * scale).rounded(.up))
            segments.append(segment)
          }
        } else {
          // Text segment
          var segment = CMasonSegment()
          segment.tag = Text
          segment.text = CMasonInlineTextSegment(width: Float(width * scale).rounded(.up), ascent: Float(ascent * scale).rounded(.up), descent: Float(descent * scale).rounded(.up))
          
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
