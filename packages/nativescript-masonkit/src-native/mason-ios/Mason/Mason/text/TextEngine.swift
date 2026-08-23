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

internal protocol SingleLineTextBaselineProviding: AnyObject {
  /// Returns the baseline position in the view's normal top-origin coordinate space.
  func singleLineTextBaselineY(ascent: CGFloat, descent: CGFloat, in drawBounds: CGRect) -> CGFloat
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
  }

  internal func handlePressUp() {
  }

  internal func handlePressCancel() {
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

    var layout = false

    if state.contains(.fontSize) {
      layout = true
    }

    // Layout-affecting flags: require invalidateInlineSegments (full recompute).
    let textLayoutChanged = state.contains(.fontSize)
      || state.contains(.fontWeight)
      || state.contains(.fontStyle)
      || state.contains(.fontFamily)
      || state.contains(.fontVariantNumeric)
      || state.contains(.textWrap)
      || state.contains(.whiteSpace)
      || state.contains(.textTransform)
      || state.contains(.letterSpacing)
      || state.contains(.textJustify)
      || state.contains(.lineHeight)
      || state.contains(.textAlign)
      || state.contains(.textOverflow)
      || state.contains(.verticalAlign)
      || state.contains(.wordSpacing)
      || state.contains(.writingMode)
      || state.contains(.unicodeBidi)
      || state.contains(.hyphens)
      || state.contains(.fontStretch)

    // Visual-only flags: span rebuild + redraw, no layout recompute needed.
    let textVisualChanged = !textLayoutChanged && (
      state.contains(.color)
      || state.contains(.decorationLine)
      || state.contains(.decorationColor)
      || state.contains(.decorationStyle)
      || state.contains(.backgroundColor)
      || state.contains(.textShadow)
    )

    if textLayoutChanged {
      updateStyleOnTextNodes()
      invalidateInlineSegments()
      if layout {
        if node.isAnonymous {
          node.layoutParent?.markDirty()
        }
        (node.view as? MasonElement)?.invalidateLayout()
      } else {
        invalidate()
      }
    } else if textVisualChanged {
      // Visual-only change: rebuild spans and redraw without triggering a
      // full layout recompute that would shift sibling views.
      updateStyleOnTextNodes()
      invalidate()
    }
  }


  public func onStyleChange(_ low: UInt64, _ high: UInt64) {
    onStyleChange(low: low, high: high)
  }
  
  

  private static let whitespaceRegex = try! NSRegularExpression(pattern: "\\s+")
  private static let horizontalWsRegex: NSRegularExpression? = try? NSRegularExpression(pattern: "[ \\t]+", options: [])

  private static func splitByWhitespace(
    _ attr: NSAttributedString
    ) -> [NSAttributedString] {

    let regex = whitespaceRegex
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

  internal static func minContentWidth(for text: NSAttributedString) -> CGFloat {
    // Single-pass: measure each whitespace-delimited word without creating
    // an intermediate [NSAttributedString] array.
    var maxWidth: CGFloat = 0
    let nsText = text.string as NSString
    let fullRange = NSRange(location: 0, length: nsText.length)
    var lastLocation = 0

    let matches = whitespaceRegex.matches(in: text.string, range: fullRange)
    for match in matches {
      let r = match.range
      if r.location > lastLocation {
        let sub = text.attributedSubstring(from: NSRange(location: lastLocation, length: r.location - lastLocation))
        maxWidth = max(maxWidth, desiredWidth(sub))
      }
      lastLocation = r.location + r.length
    }
    if lastLocation < nsText.length {
      let sub = text.attributedSubstring(from: NSRange(location: lastLocation, length: nsText.length - lastLocation))
      maxWidth = max(maxWidth, desiredWidth(sub))
    }

    if maxWidth == 0, text.length > 0 {
      return desiredWidth(text)
    }

    return maxWidth
  }

  internal static func inlineChildBaselineFromBottom(
    height: CGFloat,
    verticalAlign: MasonVerticalAlignValue,
    parentFont: FontMetrics,
    scale: CGFloat
  ) -> CGFloat {
    let fontAscent = CGFloat(parentFont.ascent) / scale
    let fontDescent = CGFloat(parentFont.descent) / scale
    let xHeight = CGFloat(parentFont.x_height) / scale
    let lineHeight = CGFloat(parentFont.ascent + parentFont.descent + parentFont.leading) / scale

    switch verticalAlign.align {
    case .Baseline:
      return 0
    case .TextTop:
      return max(fontDescent, height - fontAscent)
    case .TextBottom:
      return fontDescent
    case .Middle:
      return (height / 2) - (xHeight / 2)
    case .Top:
      return 0
    case .Bottom:
      return height
    case .Sub:
      return fontDescent
    case .Super:
      return -(fontAscent * 0.5)
    case .Length:
      return -CGFloat(verticalAlign.offset) / scale
    case .Percent:
      return -(lineHeight * CGFloat(verticalAlign.offset) / 100)
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
    
    // Check for explicit line breaks (from <br> tags)
    let hasExplicitLineBreaks = text.string.contains("\n")
    
    var allowWrap = true
    if engine.node.style.isValueInitialized {
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
        maxWidth = minContentWidth(for: text)
      }
      
      if (available.width == -2){
        maxWidth = desiredWidth(text)
      }
    }
    
    // Reuse cached CTFramesetter when the attributed string hasn't changed.
    // Creating a framesetter is expensive: it triggers glyph lookup, font
    // fallback resolution, bidi analysis, and line-breaking table setup.
    let framesetter: CTFramesetter
    if let cached = engine.cachedFramesetter,
       engine.framesetterStringVersion == engine.segmentsInvalidateVersion {
      framesetter = cached
    } else {
      framesetter = CTFramesetterCreateWithAttributedString(text)
      engine.cachedFramesetter = framesetter
      engine.framesetterStringVersion = engine.segmentsInvalidateVersion
    }

    var constraintSize = CGSize(width: maxWidth, height: maxHeight)
    // Avoid passing infinite height to CoreText framesetter — use a large finite fallback.
    if !constraintSize.height.isFinite || constraintSize.height > 1_000_000 {
      if available.height.isFinite && available.height > 0 {
        constraintSize.height = available.height / CGFloat(NSCMason.scale)
      } else {
        constraintSize.height = 10000.0
      }
    }

    let scale = CGFloat(NSCMason.scale)

    // Fetch floats now so we know whether we need the suggested-size pre-pass.
    let containerNode = engine.node.parent ?? engine.node
    let floatEntries = NativeHelpers.nativeNodeGetFloatRectsWithNodes(engine.node.mason, containerNode)
    let textViewOffset = CGPoint(x: CGFloat(engine.node.computedLayout.x) / scale, y: CGFloat(engine.node.computedLayout.y) / scale)

    // When there are floats we need to size the exclusion path correctly, which
    // requires knowing the actual text height first — so we call SuggestFrameSize.
    // When there are no floats the simple outer rect is sufficient and we can skip
    // the suggest call entirely, computing height from the frame afterwards instead.
    //
    // `suggestedSize` is set only for the float path; for the no-float path it
    // stays nil and the size is derived from the frame's line origins instead.
    var suggestedSize: CGSize? = nil
    let pathHeight: CGFloat
    if floatEntries.isEmpty {
      pathHeight = constraintSize.height  // tall rect; real height computed from frame
    } else {
      var s = CTFramesetterSuggestFrameSizeWithConstraints(
        framesetter,
        CFRangeMake(0, text.length),
        nil,
        constraintSize,
        nil
      )
      if !s.height.isFinite || s.height <= 0 {
        s.height = min(constraintSize.height, 10000.0)
      }
      suggestedSize = s
      pathHeight = s.height
    }

    // Build exclusion path (outer rect ± float cutouts)
    let outerRect = CGRect(origin: .zero, size: CGSize(width: constraintSize.width, height: pathHeight))
    let bezier = UIBezierPath(rect: outerRect)
    bezier.usesEvenOddFillRule = true
    if !floatEntries.isEmpty {
      for (_, rectLogical) in floatEntries {
        let rectW = rectLogical.width / scale
        let rectH = rectLogical.height / scale
        let rectX = rectLogical.origin.x / scale
        let rectY = rectLogical.origin.y / scale
        let rectForPath = CGRect(x: rectX - textViewOffset.x, y: rectY - textViewOffset.y, width: rectW, height: rectH)
        bezier.append(UIBezierPath(rect: rectForPath))
      }
    }
    let path = bezier.cgPath

    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)

    // Compute the measured size.
    //
    // No-float path: derive size from the frame's line origins — one CT pass total.
    // In CoreText's Y-up coordinate space, lineOrigin.y is the baseline distance
    // from the BOTTOM of the frame rect:
    //   textTop    = firstLineOrigin.y + firstAscent
    //   textBottom = lastLineOrigin.y  - lastDescent
    //   height     = textTop - textBottom
    //
    // Float path: SuggestFrameSize already ran above, reuse its result.
    var size: CGSize
    if let s = suggestedSize {
      size = s  // float path: already have the correct size
    } else {
      let lines = CTFrameGetLines(frame) as? [CTLine] ?? []
      if lines.isEmpty {
        size = .zero
      } else {
        let count = lines.count
        var lineOrigins = [CGPoint](repeating: .zero, count: count)
        CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &lineOrigins)

        var firstAscent: CGFloat = 0
        CTLineGetTypographicBounds(lines[0], &firstAscent, nil, nil)
        var lastDescent: CGFloat = 0
        CTLineGetTypographicBounds(lines[count - 1], nil, &lastDescent, nil)
        let measuredHeight = (lineOrigins[0].y + firstAscent) - (lineOrigins[count - 1].y - lastDescent)

        var measuredWidth: CGFloat = 0
        for line in lines {
          let lw = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
          if lw > measuredWidth { measuredWidth = lw }
        }
        size = CGSize(width: measuredWidth, height: max(measuredHeight, 0))
      }
    }

    if text.length > 0 && size.width <= 0 {
      let line = CTLineCreateWithAttributedString(text)
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      let lineWidth = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, nil))
      if lineWidth > 0 { size.width = lineWidth }
    }
    
    
    // IMPORTANT: Collect and push segments to Rust BEFORE returning size
    engine.collectAndCacheSegments(from: frame, constraintSize)
    
    
    // Clamp to the available constraint but preserve the intrinsic width
    // so that flex cross-axis alignment (e.g. align-items: center) can
    // shrink the element to its content size instead of stretching it.
    if !isInLine && maxWidth < CGFloat.greatestFiniteMagnitude && maxWidth != .greatestFiniteMagnitude {
      size.width = (min(size.width, maxWidth) * scale).rounded(.up)
    } else {
      size.width = (size.width * scale).rounded(.up)
    }
    
    
    // CoreText single-line bounds are tight (~1.0× font size); CSS `line-height:
    // normal` expects ~1.2×. Floor to that so a single line matches the web/Android
    // box. Multi-line already exceeds 1.2×, so max() leaves it untouched.
    if !isInLine && size.height > 0,
       let fv = engine.node.getDefaultAttributes()[.font],
       CFGetTypeID(fv as CFTypeRef) == CTFontGetTypeID() {
      let normalLineHeight = CTFontGetSize(fv as! CTFont) * 1.2
      if normalLineHeight > size.height { size.height = normalLineHeight }
    }

    // A line-height tighter than the font's natural line box makes CoreText clamp
    // each line's ascent/descent, so the measured height (≈ lines × line-height)
    // is short of the glyph ink, which then clips at the edges. Reserve the
    // shortfall once so the first line's full ascent and last line's full descent
    // fit; the draw path re-anchors the baselines into that reserved space.
    if allowWrap, size.height > 0,
       let paragraph = text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle,
       paragraph.maximumLineHeight > 0,
       let fv = engine.node.getDefaultAttributes()[.font],
       CFGetTypeID(fv as CFTypeRef) == CTFontGetTypeID() {
      let font = fv as! CTFont
      let naturalLineHeight = CTFontGetAscent(font) + CTFontGetDescent(font)
      if paragraph.maximumLineHeight < naturalLineHeight {
        size.height += naturalLineHeight - paragraph.maximumLineHeight
      }
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

  // Cached CTFramesetter — expensive to create (glyph shaping, font fallback, bidi
  // analysis). Valid while the attributed string hasn't changed. Keyed by
  // segmentsInvalidateVersion so it is automatically stale after any invalidation.
  private var cachedFramesetter: CTFramesetter?
  private var framesetterStringVersion: UInt64 = UInt64.max

  // monotonically increasing version for invalidation; cachedAttributedString is valid when
  // attributedStringVersion == segmentsInvalidateVersion
  private var segmentsInvalidateVersion: UInt64 = 0
  private var attributedStringVersion: UInt64 = 0

  // Last (version, constraintSize) collectAndCacheSegments() sent for. The
  // CTFrame itself is rebuilt every call, so it can't signal "unchanged"
  // the way Android's cached StaticLayout instance does — this pair is the
  // narrowest substitute.
  private var lastSegmentsVersion: UInt64 = UInt64.max
  private var lastSegmentsConstraintSize = CGSize(width: -1, height: -1)

  private func currentFontMetrics() -> FontMetrics {
    let metrics = style.fontMetrics
    if metrics.ascent > 0 || metrics.descent > 0 {
      return metrics
    }

    if let fontValue = node.getDefaultAttributes()[.font],
       CFGetTypeID(fontValue as CFTypeRef) == CTFontGetTypeID() {
      let font = fontValue as! CTFont
      let scale = NSCMason.scale

      return FontMetrics(
        ascent: Float(CTFontGetAscent(font)) * scale,
        descent: Float(CTFontGetDescent(font)) * scale,
        x_height: Float(CTFontGetXHeight(font)) * scale,
        leading: Float(CTFontGetLeading(font)) * scale,
        cap_height: Float(CTFontGetCapHeight(font)) * scale
      )
    }

    return metrics
  }
  
  
  
  
  /// Mark segments as needing rebuild.
  /// Propagates upward to any parent TextContainer so flattened ancestors also
  /// discard their cached attributed strings and don't return stale content.
  func invalidateInlineSegments(_ markDirty: Bool = true) {
    segmentsInvalidateVersion &+= 1
    cachedAttributedString = nil
    cachedFramesetter = nil  // framesetter derives from the attributed string
    if markDirty {
      node.markDirty()
    }
    // Propagate to parent TextContainer: when this node is flattened into its
    // parent's attributed string the parent's cache embeds our old content.
    // Bump the parent version so its next buildAttributedString() rebuilds.
    if let parentNode = node.parent, let parentContainer = parentNode.view as? TextContainer {
      parentContainer.engine.invalidateInlineSegments(markDirty)
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
      return false
    }

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

  internal static func coreTextSingleLineBaselineY(fromTop baselineY: CGFloat, in bounds: CGRect) -> CGFloat {
    return bounds.height - baselineY
  }

  /// Baseline (top-origin) that vertically centres a single line in `drawBounds`.
  /// We centre the visible cap-height block (cap-top → baseline) rather than the
  /// full ascent+descent box: the ascent's internal leading and the (usually
  /// empty) descent make full-box centring read as slightly high. This matches how
  /// Android's text lands. `capHeight <= 0` falls back to centring the glyph box.
  ///
  /// `baselineOffset` is the value getDefaultAttributes() puts on the run for loose
  /// line-heights — CoreText raises the glyphs by it at draw time, so we add it
  /// back to the baseline to cancel it out. Without this, fonts whose natural line
  /// box is much smaller than the CSS line-height render visibly high. A guard
  /// keeps the ascenders from clipping above the content top in short boxes.
  internal func singleLineBaselineFromTop(ascent: CGFloat, descent: CGFloat, capHeight: CGFloat, baselineOffset: CGFloat, in drawBounds: CGRect) -> CGFloat {
    let centred: CGFloat
    if capHeight > 0 {
      centred = drawBounds.midY + capHeight / 2
    } else {
      let extra = max(0, drawBounds.height - (ascent + descent))
      centred = drawBounds.minY + extra / 2 + ascent
    }
    let ascenderGuard = drawBounds.minY + ascent
    return max(centred, ascenderGuard) + baselineOffset
  }

  private func singleLineBaselineY(ascent: CGFloat, descent: CGFloat, in drawBounds: CGRect, bounds: CGRect) -> CGFloat {
    let topBaselineY: CGFloat
    if let provider = container as? SingleLineTextBaselineProviding {
      topBaselineY = provider.singleLineTextBaselineY(ascent: ascent, descent: descent, in: drawBounds)
    } else {
      let attrs = node.getDefaultAttributes()
      let baselineOffset = (attrs[.baselineOffset] as? CGFloat) ?? 0
      let capHeight: CGFloat = {
        if let fv = attrs[.font], CFGetTypeID(fv as CFTypeRef) == CTFontGetTypeID() { return CTFontGetCapHeight(fv as! CTFont) }
        return 0
      }()
      topBaselineY = singleLineBaselineFromTop(ascent: ascent, descent: descent, capHeight: capHeight, baselineOffset: baselineOffset, in: drawBounds)
    }

    return Self.coreTextSingleLineBaselineY(fromTop: topBaselineY, in: bounds)
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

    let baselineY = singleLineBaselineY(ascent: ascent, descent: descent, in: drawBounds, bounds: bounds)
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
        // Fake-bold only when a bold weight is requested but no real bold face
        // exists. `weight` is the CSS weight (100–900), so threshold is 600.
        if !isBold && weight >= 600 {
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

    // Top-align text (matching CSS block-level behavior): no vertical offset
    let layoutBounds = CGRect(
      x: drawBounds.origin.x,
      y: drawBounds.origin.y,
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
        bezier.append(UIBezierPath(rect: rectForPath))
      }
    }
    let path = bezier.cgPath

    // DEBUG: visualize exclusion path (even-odd fill + stroke) so holes appear transparent
    #if DEBUG_EXCLUSION_PATH
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
    #endif

    let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: text.length), path, nil)

    context.saveGState()
    context.clip(to: bounds)

    let linesCF = CTFrameGetLines(frame)
    let linesCount = CFArrayGetCount(linesCF)
    guard linesCount > 0 else { context.restoreGState(); return }

    var origins = Array(repeating: CGPoint.zero, count: linesCount)
    CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &origins)

    // Re-anchor the vertical baseline using the font's true metrics rather than
    // CoreText's frame positioning, which is driven by the (possibly clamped)
    // line-height and leaves the glyph box off-centre or clipped.
    //   • A single line is centred within the content box — same rule as
    //     drawSingleLine — so padded inline-blocks (links, buttons, pills) sit in
    //     the middle instead of riding high/low from font ascent/descent asymmetry.
    //   • A tight multi-line block (line-height < the font's natural line box) has
    //     its first baseline pinned to the full font ascent so the first line's
    //     ascenders and the last line's descenders stay inside the reserved box.
    var textBaseY = layoutBounds.origin.y
    if text.length > 0,
       let fontValue = node.getDefaultAttributes()[.font],
       CFGetTypeID(fontValue as CFTypeRef) == CTFontGetTypeID() {
      let font = fontValue as! CTFont
      let fontAscent = CTFontGetAscent(font)
      let naturalLineHeight = fontAscent + CTFontGetDescent(font)
      let paragraph = text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle
      let maxLineHeight = paragraph?.maximumLineHeight ?? 0
      if linesCount == 1 {
        let baselineOffset = (text.attribute(.baselineOffset, at: 0, effectiveRange: nil) as? CGFloat) ?? 0
        let baselineFromTop = singleLineBaselineFromTop(ascent: fontAscent, descent: naturalLineHeight - fontAscent, capHeight: CTFontGetCapHeight(font), baselineOffset: baselineOffset, in: drawBounds)
        textBaseY = bounds.height - origins[0].y - baselineFromTop
      } else if maxLineHeight > 0 && maxLineHeight < naturalLineHeight {
        textBaseY = bounds.height - drawBounds.origin.y - fontAscent - origins[0].y
      }
    }

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
          let textPos = CGPoint(x: layoutBounds.origin.x + lineOrigin.x + horizontalOffset, y: lineOrigin.y + textBaseY)
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
      context.textPosition = CGPoint(x: layoutBounds.origin.x + lineOrigin.x + horizontalOffset, y: lineOrigin.y + textBaseY)
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
          // Fake-bold only when a bold weight is requested but no real bold face
          // exists. `weight` is the CSS weight (100–900), so threshold is 600.
          if !isBold && weight >= 600 {
              drawRunWithFakeBold(run, in: context, at: CGPoint(x: layoutBounds.origin.x + lineOrigin.x + horizontalOffset, y: lineOrigin.y + textBaseY))
            } else {
            CTRunDraw(run, context, CFRange(location: 0, length: 0))
          }
        } else {
          CTRunDraw(run, context, CFRange(location: 0, length: 0))
        }
      }

      // Draw text decorations (underline, strikethrough) for this line
      drawTextDecorations(for: line, at: CGPoint(x: layoutBounds.origin.x + lineOrigin.x + horizontalOffset, y: lineOrigin.y + textBaseY), in: context)
    }

    context.restoreGState()

    guard text.containsAttachments else { return }

    for i in 0..<linesCount {
      let line = unsafeBitCast(CFArrayGetValueAtIndex(linesCF, i), to: CTLine.self)
      let lineOrigin = CGPoint(x: origins[i].x, y: origins[i].y + (textBaseY - layoutBounds.origin.y))
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
    // When this TextContainer is flattened into a parent TextContainer, the parent's
    // text layer renders our content. Drawing here would produce duplicate text.
    if let parentNode = node.parent, let parentContainer = parentNode.view as? TextContainer,
       parentContainer.engine.shouldFlattenTextContainer(container) {
      drawState = .idle
      return
    }
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
    let collapseRegex = TextEngine.horizontalWsRegex

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

    // Wrap with Unicode bidi control characters when unicode-bidi requires
    // character-level overrides beyond what paragraph direction provides.
    let bidi = Int(style.resolvedUnicodeBidi)
    let isRTL = style.direction == .RTL
    
    let result: NSAttributedString
    switch bidi {
    case 1: // embed: LRE (U+202A) or RLE (U+202B) + PDF (U+202C)
      let wrapped = NSMutableAttributedString()
      wrapped.append(NSAttributedString(string: isRTL ? "\u{202B}" : "\u{202A}"))
      wrapped.append(composed)
      wrapped.append(NSAttributedString(string: "\u{202C}"))
      result = wrapped
    case 2: // bidi-override: LRO (U+202D) or RLO (U+202E) + PDF (U+202C)
      let wrapped = NSMutableAttributedString()
      wrapped.append(NSAttributedString(string: isRTL ? "\u{202E}" : "\u{202D}"))
      wrapped.append(composed)
      wrapped.append(NSAttributedString(string: "\u{202C}"))
      result = wrapped
    case 3: // isolate: LRI (U+2066) or RLI (U+2067) + PDI (U+2069)
      let wrapped = NSMutableAttributedString()
      wrapped.append(NSAttributedString(string: isRTL ? "\u{2067}" : "\u{2066}"))
      wrapped.append(composed)
      wrapped.append(NSAttributedString(string: "\u{2069}"))
      result = wrapped
    case 4: // isolate-override: LRI/RLI + LRO/RLO + content + PDF + PDI
      let wrapped = NSMutableAttributedString()
      wrapped.append(NSAttributedString(string: isRTL ? "\u{2067}" : "\u{2066}"))
      wrapped.append(NSAttributedString(string: isRTL ? "\u{202E}" : "\u{202D}"))
      wrapped.append(composed)
      wrapped.append(NSAttributedString(string: "\u{202C}"))
      wrapped.append(NSAttributedString(string: "\u{2069}"))
      result = wrapped
    case 5: // plaintext: FSI (U+2068) + PDI (U+2069)
      let wrapped = NSMutableAttributedString()
      wrapped.append(NSAttributedString(string: "\u{2068}"))
      wrapped.append(composed)
      wrapped.append(NSAttributedString(string: "\u{2069}"))
      result = wrapped
    default: // normal (0)
      result = composed
    }

    // Cache the result
    cachedAttributedString = result
    attributedStringVersion = segmentsInvalidateVersion
    return result
  }
  
  
  
  
  /// Collect inline segments and push to Rust
  /// This is called during measure to provide segments before Rust's inline layout runs
  private func collectAndCacheSegments(from frame: CTFrame, _ constraints: CGSize) {
    // Nothing relevant changed since the segments already sent for this
    // exact (content, constraint) pair — skip the frame/line walk + FFI push.
    if lastSegmentsVersion == segmentsInvalidateVersion && lastSegmentsConstraintSize == constraints {
      return
    }

    let lines = CTFrameGetLines(frame) as? [CTLine] ?? []

    guard !lines.isEmpty else {
      // Empty text - send empty segments
      if let ptr = node.nativePtr {
        mason_node_clear_segments(node.mason.nativePtr, ptr)
      }
      attributedStringVersion = segmentsInvalidateVersion
      lastSegmentsVersion = segmentsInvalidateVersion
      lastSegmentsConstraintSize = constraints
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
            let childHeight = max(CGFloat(helper.node.cachedHeight) / scale, ascent)
            let baselineFromBottom = Self.inlineChildBaselineFromBottom(
              height: childHeight,
              verticalAlign: helper.node.style.verticalAlign,
              parentFont: currentFontMetrics(),
              scale: scale
            )
            var segment = CMasonSegment()
            segment.tag = InlineChild
            segment.inline_child = CMasonInlineChildSegment(node: childPtr, descent: Float(baselineFromBottom * scale))
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
            segment.text = CMasonInlineTextSegment(width: Float(width * scale).rounded(.up), ascent: Float(ascent * scale).rounded(.up), descent: Float(descent * scale).rounded(.up), flags: UInt8(bitPattern: style.resolvedWhiteSpace.rawValue))
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
    lastSegmentsVersion = segmentsInvalidateVersion
    lastSegmentsConstraintSize = constraints
  }
}
