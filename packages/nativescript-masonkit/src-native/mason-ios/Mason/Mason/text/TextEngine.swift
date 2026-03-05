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
  func onStyleChange(_ low: UInt64, _ high: UInt64)
}

extension TextContainer {
  var defaultAttributes: [NSAttributedString.Key: Any] {
    return node.getDefaultAttributes()
  }
  
  public func onStyleChange(_ low: UInt64, _ high: UInt64) {
    engine.onStyleChange(low, high)
  }
  
  internal func onStyleChange(_ state: StateKeys) {
    engine.onStyleChange(state.low, state.high)
  }
}


@objc(MasonTextEngine)
public class TextEngine: NSObject {
  
  internal var drawState: DrawState = .idle
  
  unowned let container: TextContainer
  
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
      if let child = (child as? MasonTextNode), child.container?.engine == self {
        // Only update TextNodes that belong to this TextView
        child.attributes = defaultAttrs
      }
    }
  }


  func onStyleChange(low: UInt64, high: UInt64) {
    let state = StateKeys(low: low, high: high)


    var dirty = false
    var layout = false

    if (state.contains(.color)) {
      dirty = true
    }

    if (state.contains(.fontSize)) {
      layout = true
      dirty = true
    }

    if (state.contains(.fontWeight) || state.contains(.fontStyle) || state.contains(.fontFamily)) {
      dirty = true
    }

    if (state.contains(.verticalAlign) || state.contains(.verticalAlign) || state.contains(.textWrap) || state.contains(.textWrap) || state.contains(.whiteSpace) || state.contains(.whiteSpace) || state.contains(.textTransform) || state.contains(.textTransform) || state.contains(.decorationLine) || state.contains(.decorationLine) || state.contains(.decorationColor) || state.contains(.decorationColor) || state.contains(.decorationStyle) || state.contains(.decorationStyle) || state.contains(.letterSpacing) || state.contains(.letterSpacing) || state.contains(.textJustify) || state.contains(.textJustify) || state.contains(.backgroundColor) || state.contains(.backgroundColor) || state.contains(.lineHeight) || state.contains(.lineHeight)) {
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
      } else {
        invalidate()
      }
    }
  }


  public func onStyleChange(_ low: UInt64, _ high: UInt64) {
    onStyleChange(low: low, high: high)
  }
  
  

  private static func splitByWhitespace(
    _ attr: NSAttributedString
    ) -> [NSAttributedString] {

    let regex = try! NSRegularExpression(pattern: "\\s+")
    let text = attr.string as NSString
    let fullRange = NSRange(location: 0, length: text.length)

    var result: [NSAttributedString] = []
    var lastLocation = 0

    for match in regex.matches(in: attr.string, range: fullRange) {
        let r = match.range
        if r.location > lastLocation {
            let subrange = NSRange(
                location: lastLocation,
                length: r.location - lastLocation
            )
            result.append(attr.attributedSubstring(from: subrange))
        }
        lastLocation = r.location + r.length
    }

    if lastLocation < text.length {
        let subrange = NSRange(
            location: lastLocation,
            length: text.length - lastLocation
        )
        result.append(attr.attributedSubstring(from: subrange))
    }

    return result
}
  
  private static func desiredWidth(_ text: NSAttributedString) -> CGFloat {
    let line = CTLineCreateWithAttributedString(text)
    let width = CTLineGetTypographicBounds(line, nil, nil, nil)
    return ceil(width)
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
    
    // Check for explicit line breaks (from <br> tags)
    let hasExplicitLineBreaks = text.string.contains("\n")
    
    var allowWrap = true
    if engine.node.style.isTextValueInitialized {
      let ws = engine.node.style.whiteSpace
      // No wrap for pre / nowrap - but still allow if there are explicit line breaks
      if (ws == .Pre || ws == .NoWrap) && !hasExplicitLineBreaks { allowWrap = false }
      // Explicit override - but still allow if there are explicit line breaks
      if engine.node.style.textWrap == .NoWrap && !hasExplicitLineBreaks { allowWrap = false }
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
    
    if(maxWidth == CGFloat.greatestFiniteMagnitude){
      if(available.width == -1){
        if let min = splitByWhitespace(text).first {
          maxWidth = desiredWidth(min)
        }
      }
      
      if (available.width == -2){
        maxWidth = desiredWidth(text)
      }
    }
    
    // Create framesetter
    let framesetter = CTFramesetterCreateWithAttributedString(text)

    var constraintSize = CGSize(width: maxWidth, height: maxHeight)
    // Avoid passing infinite height to CoreText framesetter — use a large finite fallback.
    if !constraintSize.height.isFinite || constraintSize.height > 1_000_000 {
      if available.height.isFinite && available.height > 0 {
        constraintSize.height = available.height / CGFloat(NSCMason.scale)
      } else {
        constraintSize.height = 10000.0
      }
    }

    // First get the suggested size from CoreText using our constraints so we can build
    // the exclusion path with the same height CT will actually use. This prevents
    // mismatch where measurement used a huge outer rect while draw used a tight height.
    var suggested = CTFramesetterSuggestFrameSizeWithConstraints(
      framesetter,
      CFRangeMake(0, text.length),
      nil,
      constraintSize,
      nil
    )
    if !suggested.height.isFinite || suggested.height <= 0 {
      // Fallback to provided constraint or a reasonable default
      suggested.height = min(constraintSize.height, 10000.0)
    }

    let scale = CGFloat(NSCMason.scale)
    // Build exclusion path including floated native views returned by the engine
    // Use a frame-local outer rect (origin at zero) so rects from the engine (top-based)
    // can be appended directly without an extra flip.
    let outerRect = CGRect(origin: .zero, size: CGSize(width: constraintSize.width, height: suggested.height))
    let bezier = UIBezierPath(rect: outerRect)
    bezier.usesEvenOddFillRule = true
    let containerNode = engine.node.parent ?? engine.node
    let floatEntries = NativeHelpers.nativeNodeGetFloatRectsWithNodes(engine.node.mason, containerNode)
    // Compute this text view's origin in container coordinates (points)
    let textViewOffset = CGPoint(x: CGFloat(engine.node.computedLayout.x) / scale, y: CGFloat(engine.node.computedLayout.y) / scale)
    if floatEntries.count > 0 {
      for (_, rectLogical) in floatEntries {
        // Convert engine px -> points. Engine Y is top-based; use it directly in
        // the frame-local coordinates so the exclusion rect aligns with the native view.
        let rectW = rectLogical.width / scale
        let rectH = rectLogical.height / scale
        let rectX = rectLogical.origin.x / scale
        let rectY = rectLogical.origin.y / scale
        // Convert from container-local points to this text-view-local coordinates
        let rectForPath = CGRect(x: rectX - textViewOffset.x, y: rectY - textViewOffset.y, width: rectW, height: rectH)
        #if DEBUG
        NSLog("[TextEngine.measure] hole rect=\(rectForPath) outer=\(outerRect)")
        #endif
        bezier.append(UIBezierPath(rect: rectForPath))
      }
    }
    let path = bezier.cgPath

    // Create final frame using the path built with the CT-suggested height
    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)

    // Now calculate the size (use suggested which matches the path height)
    var size = suggested
    
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
        // Debug: log container background state to diagnose unexpected flattening
        #if DEBUG
        NSLog("[TextEngine.shouldFlatten] node=%@ background=%@ backgroundColor=%@ viewBg=%@",
          String(describing: container.node),
          style.background as NSString,
          NSNumber(value: style.backgroundColor),
          container.node.view?.backgroundColor?.description ?? "nil")
        #endif
    
    // If style is not initialized, flatten by default
    guard style.isValueInitialized else {
      return true
    }
    
    // Check for view-like properties that require inline-block behavior
    let hasBackground: Bool = {
      // Consider CSS `background` (string) as a visual background too
      let bgString = container.node.style.background.trimmingCharacters(in: .whitespacesAndNewlines)
      if !bgString.isEmpty { return true }

      if container.node.style.backgroundColor != 0 { return true }
      if let alpha = container.node.view?.backgroundColor?.cgColor.alpha, alpha > 0 { return true }
      return false
    }()

    let border = style.mBorderRender
    // Check configured per-side widths (shorthand parsing sets these)
    let hasBorder = border.top.width.value > 0.0 || border.right.width.value > 0.0 || border.bottom.width.value > 0.0 || border.left.width.value > 0.0

    let padding = style.padding
    let hasPadding = padding.top.value > 0.0 || padding.right.value > 0.0 || padding.bottom.value > 0.0 || padding.left.value > 0.0

    let size = style.size
    let hasExplicitSize = size.width != .Auto || size.height != .Auto

    // Special-case Blockquote: allow flattening when it's safe to render as an inline left-bar
    if let tv = container as? MasonText, tv.type == .Blockquote {
      // If only the LEFT border is present and there is no background/padding/explicit size,
      // it's safe to flatten and draw a left-bar inline (matches web shorthand like "0 0 0 3px").
      let hasBorderOtherThanLeft = border.top.width.value > 0.0 || border.right.width.value > 0.0 || border.bottom.width.value > 0.0
      let leftOnlyBorder = border.left.width.value > 0.0 && !hasBorderOtherThanLeft

      if leftOnlyBorder && !(hasBackground || hasPadding || hasExplicitSize) {
        return true
      }

      // If any other view-like properties that affect layout or clipping are present, do NOT flatten
      if hasBackground || hasPadding || hasExplicitSize || style.mBorderRender.hasRadii() {
        return false
      }

      // If there are borders on any side other than left, avoid flattening (we'd lose those borders)
      if hasBorderOtherThanLeft {
        return false
      }

      // Otherwise flatten (left-border will be drawn inline by the text layer)
      return true
    }

    // For general containers: if it has any view properties, treat as inline-block
    if hasBackground || hasBorder || hasPadding || hasExplicitSize {
      #if DEBUG
      NSLog("[TextEngine.shouldFlatten] node=%@ -> NOT flattening (hasBackground=%d hasBorder=%d hasPadding=%d hasExplicitSize=%d)", String(describing: container.node), hasBackground ? 1 : 0, hasBorder ? 1 : 0, hasPadding ? 1 : 0, hasExplicitSize ? 1 : 0)
      #endif
      return false
    }

    #if DEBUG
    NSLog("[TextEngine.shouldFlatten] node=%@ -> flattening (no view-like properties)", String(describing: container.node))
    #endif
    // Only has text properties: flatten it
    return true
  }
  
  
  /// Create placeholder attributed string for inline child
  private func createPlaceholder(for child: MasonNode) -> NSAttributedString {
    // If this child is floated, we do not insert an inline placeholder
    // — floated elements are positioned as native views and excluded via
    // CoreText exclusion paths, so they should not participate as inline
    // attachments in the attributed string.
    if child.style.float != .None {
      return NSAttributedString(string: "")
    }

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

    // Center the text vertically: place the baseline so the glyph center aligns with the draw area center
    let baselineY = drawBounds.midY - (ascent - descent) / 2
    let lineWidth = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
    var horizontalOffset: CGFloat = 0
    switch style.resolvedTextAlign {
    case .Center:
      horizontalOffset = max(0, (drawBounds.width - lineWidth) / 2)
    case .Right, .End:
      horizontalOffset = max(0, drawBounds.width - lineWidth)
    case .Left, .Auto, .Start, .Justify:
      horizontalOffset = 0
    }
    let originX = drawBounds.origin.x + horizontalOffset
    let baselineOrigin = CGPoint(x: originX, y: baselineY)

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

    // Draw text shadows if any
    if !style.textShadows.isEmpty {
      for shadow in style.textShadows {
        context.saveGState()
        context.setShadow(offset: CGSize(width: shadow.offsetX, height: -shadow.offsetY), blur: shadow.blurRadius, color: shadow.color.cgColor)
        context.textPosition = baselineOrigin
        let runs = CTLineGetGlyphRuns(drawLine) as? [CTRun] ?? []
        for run in runs {
          let attrs = CTRunGetAttributes(run) as? [NSAttributedString.Key: Any] ?? [:]
          if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
          // Skip BR spans - they cause line breaks but shouldn't render a visible glyph
          if attrs[NSAttributedString.Key("BrSpan")] != nil { continue }
          CTRunDraw(run, context, CFRange(location: 0, length: 0))
        }
        context.restoreGState()
      }
    }

    // Draw runs, skipping placeholders (main text, no shadow)
    let runs = CTLineGetGlyphRuns(drawLine) as? [CTRun] ?? []
    context.textPosition = baselineOrigin
    for run in runs {
      let attrs = CTRunGetAttributes(run) as? [NSAttributedString.Key: Any] ?? [:]
      if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
      // Skip BR spans - they cause line breaks but shouldn't render a visible glyph
      if attrs[NSAttributedString.Key("BrSpan")] != nil { continue }
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

    // Draw text decorations (underline, strikethrough) — CTRunDraw doesn't render these
    drawTextDecorations(for: drawLine, at: baselineOrigin, in: context)

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
  
  
  /// Manually draws text decorations (underline, strikethrough) for a CTLine.
  /// CTRunDraw does not render decorations — only CTLineDraw does — but we can't
  /// use CTLineDraw because we need to skip placeholder / BrSpan runs.
  private func drawTextDecorations(for line: CTLine, at lineOrigin: CGPoint, in context: CGContext) {
    let runs = CTLineGetGlyphRuns(line) as? [CTRun] ?? []
    for run in runs {
      guard let attrs = CTRunGetAttributes(run) as? [NSAttributedString.Key: Any] else { continue }
      if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
      if attrs[NSAttributedString.Key("BrSpan")] != nil { continue }

      let underlineStyleValue = attrs[.underlineStyle] as? Int ?? 0
      let strikethruStyleValue = attrs[.strikethroughStyle] as? Int ?? 0

      guard underlineStyleValue != 0 || strikethruStyleValue != 0 else { continue }

      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      var leading: CGFloat = 0
      let width = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, &descent, &leading))
      guard width > 0 else { continue }

      var runPosition = CGPoint.zero
      CTRunGetPositions(run, CFRange(location: 0, length: 1), &runPosition)
      let x = lineOrigin.x + runPosition.x

      // Try to get font for metrics
      let ctFont: CTFont? = {
        guard let f = attrs[.font], CFGetTypeID(f as CFTypeRef) == CTFontGetTypeID() else { return nil }
        return (f as! CTFont)
      }()

      if underlineStyleValue != 0 {
        let color: CGColor
        if let ulColor = attrs[.underlineColor] as? UIColor {
          color = ulColor.cgColor
        } else if let fgColor = attrs[.foregroundColor] as? UIColor {
          color = fgColor.cgColor
        } else {
          color = UIColor.black.cgColor
        }

        let thickness: CGFloat
        let y: CGFloat
        if let font = ctFont {
          thickness = max(CTFontGetUnderlineThickness(font), 0.5)
          // underlinePosition is negative in CoreText (below baseline)
          y = lineOrigin.y + CTFontGetUnderlinePosition(font)
        } else {
          thickness = 1.0
          y = lineOrigin.y - descent * 0.3
        }

        context.saveGState()
        context.setFillColor(color)
        context.fill(CGRect(x: x, y: y - thickness / 2, width: width, height: thickness))
        context.restoreGState()
      }

      if strikethruStyleValue != 0 {
        let color: CGColor
        if let stColor = attrs[.strikethroughColor] as? UIColor {
          color = stColor.cgColor
        } else if let fgColor = attrs[.foregroundColor] as? UIColor {
          color = fgColor.cgColor
        } else {
          color = UIColor.black.cgColor
        }

        let thickness: CGFloat = ctFont != nil ? max(CTFontGetUnderlineThickness(ctFont!), 0.5) : 1.0
        let xHeight: CGFloat = ctFont != nil ? CTFontGetXHeight(ctFont!) : ascent * 0.5
        let y = lineOrigin.y + xHeight / 2

        context.saveGState()
        context.setFillColor(color)
        context.fill(CGRect(x: x, y: y - thickness / 2, width: width, height: thickness))
        context.restoreGState()
      }
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

    // Use suggested height for layout so CTFrame positions lines tightly,
    // then offset the whole frame to vertically center within drawBounds
    let verticalCenterOffset = max(0, (drawBounds.height - suggestedSize.height) / 2)

    let layoutBounds = CGRect(
      x: drawBounds.origin.x,
      y: drawBounds.origin.y + verticalCenterOffset,
      width: drawBounds.width,
      height: suggestedSize.height
    )

    // Build exclusion path in layout-local coordinates (origin at zero).
    // We'll flip Y so CoreText's frame-coordinate space matches the engine's top-based Y.
    let localOuter = CGRect(origin: .zero, size: layoutBounds.size)
    var bezier = UIBezierPath(rect: localOuter)
    bezier.usesEvenOddFillRule = true
    let containerNode = node.parent ?? node
    let floatEntries = NativeHelpers.nativeNodeGetFloatRectsWithNodes(node.mason, containerNode)
    let scale = CGFloat(NSCMason.scale)
    // Compute this text view's origin in container coordinates (points)
    let textViewOffset = CGPoint(x: CGFloat(node.computedLayout.x) / scale, y: CGFloat(node.computedLayout.y) / scale)
    #if DEBUG
    NSLog("[TextEngine.drawMultiLine.debug] drawBounds=\(drawBounds) layoutBounds=\(layoutBounds) localOuter=\(localOuter) textViewOffset=\(textViewOffset)")
    NSLog("[TextEngine.drawMultiLine.debug] floatEntries(raw)=\(floatEntries.map { $0.1 })")
    #endif
    if floatEntries.count > 0 {
      for (nodePtr, rectLogical) in floatEntries {
        // Prefer using the actual child view frame if the native view exists
        // so exclusion holes exactly match placed native views. Fallback to
        // engine rect conversion otherwise.
        var rectForPath: CGRect
        if let np = nodePtr, let matched = containerNode.children.first(where: { $0.nativePtr == np }), let v = matched.view {
          // v.frame is already positioned relative to this text view (we
          // subtract offsets when placing the view). Use it directly and
          // flip Y into CT frame coordinates.
          let vf = v.frame
          rectForPath = CGRect(x: vf.origin.x, y: localOuter.height - (vf.origin.y + vf.size.height), width: vf.size.width, height: vf.size.height)
        } else {
          // Convert engine px -> points and flip Y for CoreText frame coordinates
          let rectW = rectLogical.width / scale
          let rectH = rectLogical.height / scale
          let rectX = rectLogical.origin.x / scale
          let flippedY = localOuter.height - ((rectLogical.origin.y + rectLogical.height) / scale)
          // Convert from container-local points to this text-view-local coordinates
          // Subtract layout origin to account for any left padding/inset applied to drawBounds
          rectForPath = CGRect(x: rectX - textViewOffset.x - layoutBounds.origin.x, y: flippedY - textViewOffset.y, width: rectW, height: rectH)
        }
        #if DEBUG
        NSLog("[TextEngine.drawMultiLine.debug] float rect converted=\(rectForPath)")
        NSLog("[TextEngine.drawMultiLine] hole rect=\(rectForPath) layoutBounds=\(localOuter)")
        #endif
        bezier.append(UIBezierPath(rect: rectForPath))
      }
    }
    let path = bezier.cgPath

    // DEBUG: visualize exclusion path (even-odd fill + stroke) so holes appear transparent
    do {
      context.saveGState()
      // Translate to layout origin so overlay aligns with onscreen coordinates
      context.translateBy(x: layoutBounds.origin.x, y: layoutBounds.origin.y)
      context.setAlpha(0.35)
      context.setFillColor(UIColor.systemPurple.withAlphaComponent(0.2).cgColor)
      context.setStrokeColor(UIColor.red.cgColor)
      context.setLineWidth(1.5)
      context.addPath(path)
      // Use even-odd fill rule so appended rects become holes
      context.drawPath(using: .eoFillStroke)
      context.restoreGState()
    }

    let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: text.length), path, nil)

    let visibleRange = CTFrameGetVisibleStringRange(frame)
    let pathBBox = path.boundingBox
    let floatRectsPoints = floatEntries.map { (_ , r) in
      CGRect(x: r.origin.x / scale, y: r.origin.y / scale, width: r.width / scale, height: r.height / scale)
    }
    let linesCF_dbg = CTFrameGetLines(frame)
    let linesCount_dbg = CFArrayGetCount(linesCF_dbg)
    let msg_te = "[TextEngine.drawMultiLine] visibleRange=\(visibleRange) pathBBox=\(pathBBox) lines=\(linesCount_dbg) scale=\(scale) floatRects=\(floatRectsPoints)"
    #if DEBUG
    NSLog("%@", msg_te)
    #endif

    context.saveGState()
    context.clip(to: bounds)

    let linesCF = CTFrameGetLines(frame)
    let linesCount = CFArrayGetCount(linesCF)
    guard linesCount > 0 else { context.restoreGState(); return }

    var origins = Array(repeating: CGPoint.zero, count: linesCount)
    CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &origins)
    #if DEBUG
    let sample = origins.prefix(min(5, origins.count))
    NSLog("[TextEngine.drawMultiLine.debug] CT line origins(sample)=\(sample)")
    #endif

    // Draw text shadows if any
    if !style.textShadows.isEmpty {
      for shadow in style.textShadows {
        for i in 0..<linesCount {
          let line = unsafeBitCast(CFArrayGetValueAtIndex(linesCF, i), to: CTLine.self)
          let lineOrigin = origins[i]
          let lineWidth = CTLineGetTypographicBounds(line, nil, nil, nil)
          // Compute horizontal offset based on resolved text alignment
          var horizontalOffset: CGFloat = 0
          switch style.resolvedTextAlign {
          case .Center:
            horizontalOffset = max(0, (drawBounds.width - CGFloat(lineWidth)) / 2)
          case .Right, .End:
            horizontalOffset = max(0, drawBounds.width - CGFloat(lineWidth))
          case .Left, .Auto, .Start, .Justify:
            horizontalOffset = 0
          }
          let textPos = CGPoint(x: layoutBounds.origin.x + lineOrigin.x + horizontalOffset, y: lineOrigin.y + layoutBounds.origin.y)
          context.saveGState()
          context.setShadow(offset: CGSize(width: shadow.offsetX, height: -shadow.offsetY), blur: shadow.blurRadius, color: shadow.color.cgColor)
          
          context.textPosition = textPos
          let runsCF = CTLineGetGlyphRuns(line)
          let runCount = CFArrayGetCount(runsCF)
          for j in 0..<runCount {
            let run = unsafeBitCast(CFArrayGetValueAtIndex(runsCF, j), to: CTRun.self)
            guard let attributes = CTRunGetAttributes(run) as? [NSAttributedString.Key: Any] else { continue }
            if attributes[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
            // Skip BR spans - they cause line breaks but shouldn't render a visible glyph
            if attributes[NSAttributedString.Key("BrSpan")] != nil { continue }
            CTRunDraw(run, context, CFRange(location: 0, length: 0))
          }
          context.restoreGState()
        }
      }
    }

    // Draw main text (no shadow)
    for i in 0..<linesCount {
      let line = unsafeBitCast(CFArrayGetValueAtIndex(linesCF, i), to: CTLine.self)
      let lineOrigin = origins[i]
      let lineWidth = CTLineGetTypographicBounds(line, nil, nil, nil)
      var horizontalOffset: CGFloat = 0
      switch style.resolvedTextAlign {
      case .Center:
        horizontalOffset = max(0, (drawBounds.width - CGFloat(lineWidth)) / 2)
      case .Right, .End:
        horizontalOffset = max(0, drawBounds.width - CGFloat(lineWidth))
      case .Left, .Auto, .Start, .Justify:
        horizontalOffset = 0
      }
      context.textPosition = CGPoint(x: layoutBounds.origin.x + lineOrigin.x + horizontalOffset, y: lineOrigin.y + layoutBounds.origin.y)
      let runsCF = CTLineGetGlyphRuns(line)
      let runCount = CFArrayGetCount(runsCF)
      for j in 0..<runCount {
        let run = unsafeBitCast(CFArrayGetValueAtIndex(runsCF, j), to: CTRun.self)
        guard let attributes = CTRunGetAttributes(run) as? [NSAttributedString.Key: Any] else { continue }
        if attributes[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
        // Skip BR spans - they cause line breaks but shouldn't render a visible glyph
        if attributes[NSAttributedString.Key("BrSpan")] != nil { continue }
        if let ctFont = attributes[.font], CFGetTypeID(ctFont as CFTypeRef) == CTFontGetTypeID() {
          let font = ctFont as! CTFont
          let traits = CTFontCopyTraits(font) as? [CFString: Any]
          let symbolicTraits = CTFontGetSymbolicTraits(font)
          let isBold = symbolicTraits.contains(.traitBold)
          let weight = attributes[NSAttributedString.Key(Constants.FONT_WEIGHT)] as? CGFloat ?? traits?[kCTFontWeightTrait as CFString] as? CGFloat ?? 0
          if !isBold && weight >= 0.4 {
              drawRunWithFakeBold(run, in: context, at: CGPoint(x: layoutBounds.origin.x + lineOrigin.x + horizontalOffset, y: lineOrigin.y + layoutBounds.origin.y))
            } else {
            CTRunDraw(run, context, CFRange(location: 0, length: 0))
          }
        } else {
          CTRunDraw(run, context, CFRange(location: 0, length: 0))
        }
      }

      // Draw text decorations (underline, strikethrough) for this line
      drawTextDecorations(for: line, at: CGPoint(x: layoutBounds.origin.x + lineOrigin.x + horizontalOffset, y: lineOrigin.y + layoutBounds.origin.y), in: context)
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
    
    // Check if text contains explicit line breaks (from <br> tags)
    let hasExplicitLineBreaks = text.string.contains("\n")
    
    // Handle nowrap case - but still respect explicit line breaks from <br>
    if style.textWrap == .NoWrap && !hasExplicitLineBreaks {
      drawSingleLine(text: text, in: context, bounds: rect)
      context.restoreGState()
      drawState = .idle
      return
    }
    // Multi-line text (or has explicit line breaks)
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
    // Only collapse horizontal whitespace (spaces, tabs) - preserve line breaks
    let wsSet = CharacterSet.whitespacesAndNewlines
    let horizontalWsSet = CharacterSet(charactersIn: " \t")
    // Use [ \t]+ to only match horizontal whitespace, not newlines or line separators
    let collapseRegex = try? NSRegularExpression(pattern: "[ \\t]+", options: [])

    func collapsedString(_ s: String) -> String {
      guard let rx = collapseRegex else { return s }
      // replace runs of horizontal whitespace with single ASCII space
      let ns = s as NSString
      let r = rx.rangeOfFirstMatch(in: s, options: [], range: NSRange(location: 0, length: ns.length))
      if r.location == NSNotFound && !s.isEmpty { return s }
      return rx.stringByReplacingMatches(in: s, options: [], range: NSRange(location: 0, length: ns.length), withTemplate: " ")
    }

    let composed = NSMutableAttributedString()
    var prevEndedWithWhitespace = false

    for (_, child) in node.children.enumerated() {
      var fragment: NSAttributedString?
      if child.view is MasonBr.FakeView {
        // Use newline character for line break
        let brString = NSMutableAttributedString(string: "\n")
        
        let attrs = node.getDefaultAttributes()
        
        brString.addAttribute(NSAttributedString.Key("BrSpan"), value: true, range: NSRange(location: 0, length: 1))
        brString.addAttributes(attrs, range: NSRange(location: 0, length: 1))
        
        fragment = brString
        
        // Since a line break ends any previous whitespace sequence
        prevEndedWithWhitespace = true
        
      }else if let textNode = child as? MasonTextNode {
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
      
      if let frag = fragment, frag.length > 0 {
          if frag.attribute(NSAttributedString.Key("BrSpan"), at: 0, effectiveRange: nil) != nil {
              composed.append(frag)
              prevEndedWithWhitespace = true
              continue
          }
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
      if startsWithSpace && !middle.isEmpty { middle.removeFirst() }
      if endsWithSpace && !middle.isEmpty { middle.removeLast() }

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
          // Text segment or explicit <br> span
          var segment = CMasonSegment()
          if attrs[NSAttributedString.Key("BrSpan")] != nil {
            // Explicit line break
            segment.tag = LineBreak
          } else {
            segment.tag = Text
            segment.text = CMasonInlineTextSegment(width: Float(width * scale).rounded(.up), ascent: Float(ascent * scale).rounded(.up), descent: Float(descent * scale).rounded(.up))
          }

          segments.append(segment)
        }
      }

      // // After processing all runs in this CTLine, insert an explicit LineBreak segment
      // // so Rust receives the same line breaks produced by CoreText.
      // var brSegment = CMasonSegment()
      // brSegment.tag = LineBreak
      // segments.append(brSegment)
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
