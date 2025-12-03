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
    }
    
    guard drawBounds.width > 0 else { return }
    
    let suggestedSize = CTFramesetterSuggestFrameSizeWithConstraints(
      framesetter,
      CFRange(location: 0, length: text.length),
      nil,
      CGSize(width: drawBounds.width, height: .greatestFiniteMagnitude),
      nil
    )
    
    let layoutBounds = CGRect(
      x: drawBounds.origin.x,
      y: drawBounds.origin.y,
      width: drawBounds.width,
      height: max(drawBounds.height, suggestedSize.height)
    )
    
    let path = CGPath(rect: layoutBounds, transform: nil)
    let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: text.length), path, nil)
    
    context.saveGState()
    context.clip(to: drawBounds)
    
    let linesCF = CTFrameGetLines(frame)
    let linesCount = CFArrayGetCount(linesCF)
    
    guard linesCount > 0 else { context.restoreGState(); return }
    
    var origins = Array(repeating: CGPoint.zero, count: linesCount)
    CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &origins)
    
    for i in 0..<linesCount {
      let line = unsafeBitCast(CFArrayGetValueAtIndex(linesCF, i), to: CTLine.self)
      let lineOrigin = origins[i]
      
      context.textPosition = CGPoint(x: lineOrigin.x, y: lineOrigin.y)
      
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
    var d: [ViewHelper]  = []
    
    for run in runs {
      let attrs = CTRunGetAttributes(run) as NSDictionary
  
      guard let helper = attrs[Constants.VIEW_PLACEHOLDER_KEY] as? ViewHelper else {
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
      return NSMutableAttributedString()
    }
    isBuilding = true
    defer { isBuilding = false }
    
    let composed = NSMutableAttributedString()
    
    // Track the end-state of the previously appended fragment so we don't need to
    // inspect `composed` (which may be different across nested calls).
    var prevEndedWithWhitespace: Bool = false
    var prevHadAttachment: Bool = false
    
    for (childIndex, child) in node.children.enumerated() {
      var fragment: NSAttributedString?
      if let textNode = child as? MasonTextNode {
        fragment = textNode.attributed()
      } else if let textView = child.view as? TextContainer {
        if shouldFlattenTextContainer(textView) {
          fragment = buildAttributedString(forMeasurement: forMeasurement)
        } else {
          fragment = createPlaceholder(for: child)
        }
      } else if (child.view != nil && child.nativePtr != nil) {
        fragment = createPlaceholder(for: child)
      }
      
      // If fragment exists, convert leading/trailing ASCII space runs to NBSP where needed
      // Don't mutate fragment. We'll decide and INSERT an explicit separator run
      // between fragments below when needed. This keeps source text intact and avoids
      // index/attribute mismatches from in-place replacements.
      
      guard let frag = fragment, frag.length > 0 else {
        if let frag = fragment {
          // append empty/placeholder fragment and update state
          composed.append(frag)
          // update prevEndedWithWhitespace / prevHadAttachment from the fragment if possible
          if frag.length > 0 {
            let first = (frag.string as NSString).substring(with: NSRange(location: 0, length: 1))
            prevEndedWithWhitespace = CharacterSet.whitespacesAndNewlines.contains(first.unicodeScalars.first!)
            prevHadAttachment = (frag.attribute(.attachment, at: 0, effectiveRange: nil) as? NSTextAttachment) != nil
          } else {
            prevEndedWithWhitespace = false
            prevHadAttachment = false
          }
        }
        continue
      }
      
      // Compute new-starts-with-space and new-has-attachment from the fragment itself
      let newStartsWithSpace: Bool = {
        let firstChar = (frag.string as NSString).substring(with: NSRange(location: 0, length: 1))
        return CharacterSet.whitespacesAndNewlines.contains(firstChar.unicodeScalars.first!)
      }()
      
      let newHasAttachment: Bool = {
        if frag.attribute(.attachment, at: 0, effectiveRange: nil) as? NSTextAttachment != nil { return true }
        let firstChar = (frag.string as NSString).substring(with: NSRange(location: 0, length: 1))
        return firstChar == "\u{FFFC}"
      }()
      
      // Also consult source nodes for user-intent whitespace when fragment normalization may have removed it
      let prevSourceEndsWithSpace: Bool = {
        guard childIndex > 0 else { return false }
        let prev = node.children[childIndex - 1]
        if let tn = prev as? MasonTextNode, let last = tn.data.last {
          return CharacterSet.whitespacesAndNewlines.contains(last.unicodeScalars.first!)
        }
        return false
      }()
      let currSourceStartsWithSpace: Bool = {
        if let tn = child as? MasonTextNode, let first = tn.data.first {
          return CharacterSet.whitespacesAndNewlines.contains(first.unicodeScalars.first!)
        }
        return false
      }()
      
      let prevHasWhitespace = prevEndedWithWhitespace || prevSourceEndsWithSpace
      let currStartsWithWhitespace = newStartsWithSpace || currSourceStartsWithSpace
      
      // Decide and append separator between runs based on source intent (ASCII spaces)
      let prevSourceEndsWithASCII: Bool = {
        guard childIndex > 0 else { return false }
        if let prev = node.children[childIndex - 1] as? MasonTextNode, let last = prev.data.last {
          return last == " "
        }
        return false
      }()
      
      let currSourceStartsWithASCII: Bool = {
        if let tn = child as? MasonTextNode, let first = tn.data.first {
          return first == " "
        }
        return false
      }()
      
      // If either side's SOURCE contains an ASCII space, force a NBSP so it won't be collapsed.
      if prevSourceEndsWithASCII || currSourceStartsWithASCII {
        // pick attributes from the current fragment, fallback to last composed run or defaults
        var sepAttrs = (frag.length > 0 ? frag.attributes(at: 0, effectiveRange: nil) : (composed.length > 0 ? composed.attributes(at: max(0, composed.length - 1), effectiveRange: nil) : node.getDefaultAttributes()))
        // ensure font & paragraph exist so CT will measure the separator correctly
        if sepAttrs[.font] == nil { sepAttrs[.font] = node.getDefaultAttributes()[.font] }
        if sepAttrs[.paragraphStyle] == nil { sepAttrs[.paragraphStyle] = node.getDefaultAttributes()[.paragraphStyle] }
        composed.append(NSAttributedString(string: "\u{00A0}", attributes: sepAttrs))
      } else {
        // fallback: preserve a regular collapsing space only when neither side has whitespace
        if !prevHasWhitespace && !currStartsWithWhitespace && node.style.whiteSpace != .Pre {
          var sepAttrs = (frag.length > 0 ? frag.attributes(at: 0, effectiveRange: nil) : (composed.length > 0 ? composed.attributes(at: max(0, composed.length - 1), effectiveRange: nil) : node.getDefaultAttributes()))
          if sepAttrs[.font] == nil { sepAttrs[.font] = node.getDefaultAttributes()[.font] }
          if sepAttrs[.paragraphStyle] == nil { sepAttrs[.paragraphStyle] = node.getDefaultAttributes()[.paragraphStyle] }
          composed.append(NSAttributedString(string: " ", attributes: sepAttrs))
        }
      }
      
      // append fragment
      composed.append(frag)
      // update prevEndedWithWhitespace from frag's trailing char
      prevEndedWithWhitespace = {
        let lastChar = (frag.string as NSString).substring(with: NSRange(location: frag.length - 1, length: 1))
        return CharacterSet.whitespacesAndNewlines.contains(lastChar.unicodeScalars.first!)
      }()
      prevHadAttachment = newHasAttachment
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
