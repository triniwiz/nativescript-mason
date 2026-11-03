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

// Vertical text runs its lines down the page, so a box's height runs along the line.
private func boxIsInVerticalText(_ node: MasonNode) -> Bool {
  let mode = node.style.resolvedWritingMode
  return mode == 1 || mode == 2
}

/// A box's border-box size in points: laid out, else measured before its first layout. A text
/// box's measure is its content size, without its padding.
internal func inlineBoxSize(_ node: MasonNode) -> CGSize {
  let scale = CGFloat(NSCMason.scale)
  let layout = node.computedLayout
  let laidOut = !layout.width.isNaN && !layout.height.isNaN && (layout.width > 0 || layout.height > 0)
  let width = laidOut ? CGFloat(layout.width) : CGFloat(node.cachedWidth)
  let height = laidOut ? CGFloat(layout.height) : CGFloat(node.cachedHeight)
  return CGSize(width: width / scale, height: height / scale)
}

internal func inlineBoxBaseline(_ node: MasonNode, height: CGFloat) -> CGFloat {
  guard height > 0, !boxIsInVerticalText(node), node.style.verticalAlign.align == .Baseline else { return 0 }
  let fromBottom = CGFloat(node.inlineBaseline) / CGFloat(NSCMason.scale)
  return fromBottom.isFinite ? min(max(fromBottom, 0), height) : 0
}

private func runDelegateGetAscent(_ refCon: UnsafeMutableRawPointer) -> CGFloat {
  let node = Unmanaged<MasonNode>.fromOpaque(refCon).takeUnretainedValue()
  let size = inlineBoxSize(node)
  let extent = boxIsInVerticalText(node) ? size.width : size.height
  return extent - inlineBoxBaseline(node, height: extent)
}

private func runDelegateGetDescent(_ refCon: UnsafeMutableRawPointer) -> CGFloat {
  let node = Unmanaged<MasonNode>.fromOpaque(refCon).takeUnretainedValue()
  let size = inlineBoxSize(node)
  return inlineBoxBaseline(node, height: boxIsInVerticalText(node) ? size.width : size.height)
}

private func runDelegateGetWidth(_ refCon: UnsafeMutableRawPointer) -> CGFloat {
  let node = Unmanaged<MasonNode>.fromOpaque(refCon).takeUnretainedValue()
  let size = inlineBoxSize(node)
  return boxIsInVerticalText(node) ? size.height : size.width
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
  
  unowned(unsafe) let container: TextContainer
  
  var node: MasonNode {
    return container.node
  }
  
  var style: MasonStyle {
    return container.node.style
  }
  
  init(container: TextContainer) {
    self.container = container
  }
  
  /// Marks the range a flattened element produced, so a tap on it can find it.
  static let inlineNodeKey = NSAttributedString.Key("MasonInlineNode")

  /// The current text keeps some glyphs upright (vertical text-orientation).
  internal private(set) var hasUprightGlyphs = false

  // Hit regions from the last draw, in CoreText coordinates; drawnTransform maps them to the view.
  internal private(set) var drawnLines: [(line: CTLine, origin: CGPoint)] = []
  private var drawnBoxes: [(rect: CGRect, node: InlineNodeRef)] = []
  private var drawnTransform = CGAffineTransform.identity

  /// The outlines of the glyphs from the last draw, in the view's coordinates; what
  /// `background-clip: text` paints through. Inline boxes are left out.
  internal func glyphOutlinePath() -> CGPath {
    let path = CGMutablePath()
    for (line, origin) in drawnLines {
      for case let run as CTRun in CTLineGetGlyphRuns(line) as NSArray {
        let attrs = CTRunGetAttributes(run) as NSDictionary as? [NSAttributedString.Key: Any] ?? [:]
        if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
        guard let fontValue = attrs[.font], CFGetTypeID(fontValue as CFTypeRef) == CTFontGetTypeID() else { continue }
        let font = fontValue as! CTFont
        let count = CTRunGetGlyphCount(run)
        guard count > 0 else { continue }
        var glyphs = [CGGlyph](repeating: 0, count: count)
        var positions = [CGPoint](repeating: .zero, count: count)
        CTRunGetGlyphs(run, CFRangeMake(0, count), &glyphs)
        CTRunGetPositions(run, CFRangeMake(0, count), &positions)
        let matrix = CTRunGetTextMatrix(run)
        for i in 0..<count {
          guard let glyph = CTFontCreatePathForGlyph(font, glyphs[i], nil) else { continue }
          let place = matrix
            .concatenating(CGAffineTransform(translationX: origin.x + positions[i].x, y: origin.y + positions[i].y))
            .concatenating(drawnTransform)
          path.addPath(glyph, transform: place)
        }
      }
    }
    return path
  }

  /// The inline element under a point in the view: an inline box, else the innermost flattened
  /// element whose text is under the point. Nil over plain text or empty space.
  internal func inlineNode(at point: CGPoint) -> MasonNode? {
    let p = point.applying(drawnTransform.inverted())
    for box in drawnBoxes where box.rect.contains(p) {
      return box.node.node
    }
    for (line, origin) in drawnLines {
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      let width = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, nil))
      guard p.y >= origin.y - descent, p.y <= origin.y + ascent,
            p.x >= origin.x, p.x <= origin.x + width else { continue }
      for run in CTLineGetGlyphRuns(line) as? [CTRun] ?? [] {
        var position = CGPoint.zero
        CTRunGetPositions(run, CFRange(location: 0, length: 1), &position)
        let runWidth = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), nil, nil, nil))
        let x = origin.x + position.x
        if p.x >= x && p.x < x + runWidth {
          let attrs = CTRunGetAttributes(run) as NSDictionary
          return (attrs[TextEngine.inlineNodeKey] as? InlineNodeRef)?.node
        }
      }
      return nil
    }
    return nil
  }

  private var accessibilityElementsCache: [Any]??

  /// Accessibility elements for the last draw: text pieces, links and inline boxes in reading
  /// order. Nil when nothing in the text is interactive, so the view reads as plain text.
  internal func inlineAccessibilityElements(in view: MasonText) -> [Any]? {
    if let cached = accessibilityElementsCache { return cached }
    var elements: [Any] = []
    var interactive = false

    func add(_ node: MasonNode?, _ label: String, _ traits: UIAccessibilityTraits, _ rect: CGRect) {
      let frame = rect.applying(drawnTransform)
      if let last = elements.last as? InlineAccessibilityElement, last.node === node, last.accessibilityTraits == traits, node != nil || traits == .staticText {
        last.accessibilityLabel = (last.accessibilityLabel ?? "") + label
        last.accessibilityFrameInContainerSpace = last.accessibilityFrameInContainerSpace.union(frame)
        return
      }
      let element = InlineAccessibilityElement(accessibilityContainer: view)
      element.node = node
      element.accessibilityLabel = label
      element.accessibilityTraits = traits
      element.accessibilityFrameInContainerSpace = frame
      elements.append(element)
    }

    for (line, origin) in drawnLines {
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      CTLineGetTypographicBounds(line, &ascent, &descent, nil)
      for run in CTLineGetGlyphRuns(line) as? [CTRun] ?? [] {
        let attrs = CTRunGetAttributes(run) as NSDictionary
        let range = CTRunGetStringRange(run)
        if let helper = attrs[Constants.VIEW_PLACEHOLDER_KEY] as? ViewHelper {
          // An inline box is a real subview and reaches accessibility itself, in reading order.
          if let boxView = helper.view, boxView.superview === view {
            interactive = true
            elements.append(boxView)
          }
          continue
        }
        if attrs[NSAttributedString.Key("BrSpan")] != nil { continue }
        var position = CGPoint.zero
        CTRunGetPositions(run, CFRange(location: 0, length: 1), &position)
        let width = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), nil, nil, nil))
        let rect = CGRect(x: origin.x + position.x, y: origin.y - descent, width: width, height: ascent + descent)
        var label = ""
        if let string = cachedAttributedString?.string as NSString?, range.location >= 0, range.location + range.length <= string.length {
          label = string.substring(with: NSRange(location: range.location, length: range.length))
        }
        if let child = (attrs[TextEngine.inlineNodeKey] as? InlineNodeRef)?.node,
           (child.view as? MasonText)?.type == .A || child.mason.hasListener(child, "click") {
          interactive = true
          add(child, label, (child.view as? MasonText)?.type == .A ? .link : .button, rect)
        } else {
          add(nil, label, .staticText, rect)
        }
      }
    }
    let result: [Any]? = interactive ? elements : nil
    accessibilityElementsCache = .some(result)
    return result
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
      
      // Create a single text node with the new text; its attributes are built
      // on first use, after the style syncs that usually follow.
      let textNode = MasonTextNode(mason: node.mason, data: newValue)
      textNode.attributesInitialized = true
      textNode.attributesStale = true
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
    for child in node.children {
      if let child = (child as? MasonTextNode), child.container?.engine == self {
        // Only update TextNodes that belong to this TextView
        child.attributesStale = true
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
      || state.contains(.textOrientation)
      || state.contains(.textCombineUpright)
      || state.contains(.textSpacingTrim)
      || state.contains(.unicodeBidi)
      || state.contains(.hyphens)
      || state.contains(.fontStretch)
      || state.contains(.listStylePosition)
      || state.contains(.listStyleType)
      || state.contains(.textIndent)
      || state.contains(.lineClamp)

    // Visual-only flags: span rebuild + redraw, no layout recompute needed.
    let textVisualChanged = !textLayoutChanged && (
      state.contains(.color)
      || state.contains(.decorationLine)
      || state.contains(.decorationColor)
      || state.contains(.decorationStyle)
      || state.contains(.decorationThinkness)
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
  // Soft wrap opportunities for min-content, which is wider than `\s`: U+200B
  // ZERO WIDTH SPACE breaks a line without being whitespace, so splitting on
  // whitespace alone reported a whole ZWSP-joined run as one unbreakable word.
  private static let softWrapRegex = try! NSRegularExpression(pattern: "[\\s\\x{200B}]+")
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
  
  fileprivate static func desiredWidth(_ text: NSAttributedString) -> CGFloat {
    let string = text.string as NSString
    guard string.rangeOfCharacter(from: .newlines).location != NSNotFound else {
      return ceil(CTLineGetTypographicBounds(CTLineCreateWithAttributedString(text), nil, nil, nil))
    }
    var widest: Double = 0
    string.enumerateSubstrings(in: NSRange(location: 0, length: string.length), options: [.byParagraphs, .substringNotRequired]) { _, range, _, _ in
      guard range.length > 0 else { return }
      let line = CTLineCreateWithAttributedString(text.attributedSubstring(from: range))
      widest = max(widest, CTLineGetTypographicBounds(line, nil, nil, nil))
    }
    return ceil(widest)
  }

  /// `firstLineIndent` (text-indent) widens the first word, which starts the first line.
  internal static func minContentWidth(for text: NSAttributedString, firstLineIndent: CGFloat = 0) -> CGFloat {
    let nsText = text.string as NSString
    let length = nsText.length
    let matches = softWrapRegex.matches(in: text.string, range: NSRange(location: 0, length: length))
    if matches.isEmpty { return max(0, desiredWidth(text) + firstLineIndent) }

    // One line for the whole string: a word's width is the caret distance across
    // it. Mixed-direction text has no such distance, so it measures word by word.
    let line = CTLineCreateWithAttributedString(text)
    let runs = CTLineGetGlyphRuns(line) as NSArray
    let hasRTL = runs.contains { CTRunGetStatus($0 as! CTRun).contains(.rightToLeft) }

    var maxWidth: CGFloat = 0
    var firstWord = true
    func word(_ start: Int, _ end: Int) {
      guard end > start else { return }
      var width: CGFloat
      if hasRTL {
        width = desiredWidth(text.attributedSubstring(from: NSRange(location: start, length: end - start)))
      } else {
        width = ceil(abs(CTLineGetOffsetForStringIndex(line, end, nil) - CTLineGetOffsetForStringIndex(line, start, nil)))
      }
      if firstWord {
        firstWord = false
        width += firstLineIndent
      }
      maxWidth = max(maxWidth, width)
    }
    var last = 0
    for match in matches {
      word(last, match.range.location)
      last = match.range.location + match.range.length
    }
    word(last, length)

    if maxWidth == 0, text.length > 0 {
      return max(0, desiredWidth(text) + firstLineIndent)
    }
    return maxWidth
  }

  // Intrinsic widths of the current content, valid for one invalidate version.
  private var intrinsicVersion: UInt64 = .max
  private var intrinsicMin: CGFloat = -1
  private var intrinsicMax: CGFloat = -1

  private func syncIntrinsicVersion() {
    if intrinsicVersion != segmentsInvalidateVersion {
      intrinsicVersion = segmentsInvalidateVersion
      intrinsicMin = -1
      intrinsicMax = -1
    }
  }

  // `indent` is the intrinsic text-indent, fixed for a version (a percentage is 0 here).
  fileprivate func minContent(_ text: NSAttributedString, indent: CGFloat) -> CGFloat {
    syncIntrinsicVersion()
    if intrinsicMin < 0 { intrinsicMin = TextEngine.minContentWidth(for: TextEngine.breakableAtSoftHyphens(text), firstLineIndent: indent) }
    return intrinsicMin
  }

  fileprivate func maxContent(_ text: NSAttributedString, indent: CGFloat) -> CGFloat {
    syncIntrinsicVersion()
    if intrinsicMax < 0 { intrinsicMax = TextEngine.desiredWidth(text) }
    return max(0, intrinsicMax + indent)
  }

  // text-indent and line-clamp, resolved once per invalidate version.
  private var paramsVersion: UInt64 = .max
  private var indentValue: Float = 0
  private var indentIsPercent = false
  private var clampLines = 0

  private func syncTextParams() {
    guard paramsVersion != segmentsInvalidateVersion else { return }
    paramsVersion = segmentsInvalidateVersion
    let style = self.style
    // A button's label takes neither from its parent, as with the web's UA `text-indent: 0`.
    if container is Button {
      let ownIndent = style.getUInt8(StyleKeys.TEXT_INDENT_STATE) != StyleState.INHERIT
      indentValue = ownIndent ? style.getFloat(StyleKeys.TEXT_INDENT) : 0
      indentIsPercent = ownIndent && style.getUInt8(StyleKeys.TEXT_INDENT_TYPE) == 1
      clampLines = style.getUInt8(StyleKeys.LINE_CLAMP_STATE) != StyleState.INHERIT ? Int(max(0, style.getInt32(StyleKeys.LINE_CLAMP))) : 0
      return
    }
    let indent = style.resolvedTextIndent
    indentValue = indent.value
    indentIsPercent = indent.isPercent
    clampLines = Int(style.resolvedLineClamp)
  }

  /// line-clamp: the most lines drawn and measured, 0 for no limit.
  internal var lineClamp: Int {
    syncTextParams()
    return clampLines
  }

  /// The first line's text-indent in points; a percentage resolves against `basis`, 0 if indefinite.
  internal func textIndent(basis: CGFloat) -> CGFloat {
    syncTextParams()
    if indentValue == 0 { return 0 }
    if indentIsPercent {
      guard basis.isFinite, basis > 0, basis < 1_000_000 else { return 0 }
      return basis * CGFloat(indentValue) / 100
    }
    return CGFloat(indentValue) / CGFloat(NSCMason.scale)
  }

  /// The rect lines wrap in. A negative indent hangs the first line past the start edge,
  /// so the rect grows by it there and the other lines take it back as head indent.
  /// The margin boxes of floats beside this text, in its content box (points, y down). Positions
  /// come from the last layout pass, so text not yet placed starts at the container's origin.
  /// Vertical text gets them in its sideways frame, which is the one a vertical container's
  /// exclusions are in: x along the lines, y across them from the block-start side.
  internal func floatExclusionRects() -> [CGRect] {
    guard let parent = node.parent else { return [] }
    let raw = NativeHelpers.nativeNodeGetFloatExclusions(node.mason, parent)
    guard raw.count >= 5 else { return [] }
    let scale = CGFloat(NSCMason.scale)
    let own = node.computedLayout
    let box = parent.computedLayout
    var offX = CGFloat(own.x - box.paddingLeft - box.borderLeft + own.paddingLeft + own.borderLeft)
    var offY = CGFloat(own.y - box.paddingTop - box.borderTop + own.paddingTop + own.borderTop)
    if verticalWritingMode != 0 {
      let blockStart = verticalWritingMode == 1
        ? (box.width - box.paddingRight - box.borderRight) - (own.x + own.width) + own.paddingRight + own.borderRight
        : own.x - box.paddingLeft - box.borderLeft + own.paddingLeft + own.borderLeft
      offX = CGFloat(own.y - box.paddingTop - box.borderTop + own.paddingTop + own.borderTop)
      offY = CGFloat(blockStart)
    }
    var rects: [CGRect] = []
    rects.reserveCapacity(raw.count / 5)
    var i = 0
    while i + 4 < raw.count {
      rects.append(CGRect(x: (CGFloat(raw[i]) - offX) / scale, y: (CGFloat(raw[i + 1]) - offY) / scale,
                          width: CGFloat(raw[i + 2]) / scale, height: CGFloat(raw[i + 3]) / scale))
      i += 5
    }
    return rects
  }

  internal func wrapRect(width: CGFloat, height: CGFloat, indent: CGFloat) -> CGRect {
    // Upright glyphs are runs of their own, and CoreText misses a line they exactly fill.
    let width = hasUprightGlyphs && width.isFinite ? width + 1 / 64 : width
    guard indent < 0 else { return CGRect(x: 0, y: 0, width: width, height: height) }
    let hang = -indent
    return CGRect(x: style.direction == .RTL ? 0 : -hang, y: 0, width: width + hang, height: height)
  }

  /// `text` with its first line indented by `indent` points; see wrapRect for a negative one.
  private static func indenting(_ text: NSAttributedString, _ indent: CGFloat) -> NSAttributedString {
    let out = NSMutableAttributedString(attributedString: text)
    let length = out.length
    let newline = (text.string as NSString).range(of: "\n").location
    let firstEnd = newline == NSNotFound ? length : newline + 1
    func adjust(_ range: NSRange, first: CGFloat, head: CGFloat) {
      guard range.length > 0 else { return }
      out.enumerateAttribute(.paragraphStyle, in: range) { value, sub, _ in
        let style = ((value as? NSParagraphStyle)?.mutableCopy() as? NSMutableParagraphStyle) ?? NSMutableParagraphStyle()
        style.firstLineHeadIndent += first
        style.headIndent += head
        out.addAttribute(.paragraphStyle, value: style, range: sub)
      }
    }
    let hang = max(0, -indent)
    adjust(NSRange(location: 0, length: firstEnd), first: max(0, indent), head: hang)
    if hang > 0 {
      adjust(NSRange(location: firstEnd, length: length - firstEnd), first: hang, head: hang)
    }
    return out
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

  /// Text types measured as inline runs; the rest are block text.
  static func isInlineTextType(_ type: MasonTextType) -> Bool {
    switch type {
    case .None, .Span, .Code, .B, .Strong, .Em, .I: return true
    default: return false
    }
  }
  
  static func measure(_ engine: TextEngine, _ isInLine: Bool, isBlock: Bool = false, _ known: CGSize?, _ available: CGSize) -> CGSize {
    if available.width == TextEngine.baselineQuery, let known {
      return CGSize(width: engine.baselineFromTop(of: known), height: TextEngine.baselineQuery)
    }
    if let known = known, (!isInLine || isBlock), !known.width.isNaN, known.width >= 0, !known.height.isNaN, known.height >= 0 {
      return known
    }
    let text = engine.buildAttributedString(forMeasurement: true)
    // Text measurement is a pure function of the string, its attributes and the
    // constraints, so a text another view already measured is answered from the
    // shared cache. Inline views and floats depend on other nodes: never cached.
    guard let key = TextLayoutCache.key(for: engine, text: text, isInLine: isInLine, isBlock: isBlock, known: known, available: available) else {
      return measureUncached(engine, isInLine, isBlock: isBlock, known, available)
    }
    let defaultFont = engine.node.getDefaultAttributes()[.font] as AnyObject?
    if let hit = TextLayoutCache.shared.lookup(key, text: text, font: defaultFont) {
      engine.applyCachedLayout(hit)
      return hit.size
    }
    engine.lastBuiltSegments = nil
    let size = measureUncached(engine, isInLine, isBlock: isBlock, known, available)
    if let segments = engine.lastBuiltSegments {
      TextLayoutCache.shared.store(key, TextLayoutCache.Entry(text: text, font: defaultFont, size: size, segments: segments, constraint: engine.lastSegmentsConstraintSize))
    }
    return size
  }

  static func measureUncached(_ engine: TextEngine, _ isInLine: Bool, isBlock: Bool = false, _ known: CGSize?, _ available: CGSize) -> CGSize {
    // Build attributed string with measurement flag
    let text = engine.buildAttributedString(forMeasurement: true)
    
    if let known = known {
      if (!isInLine || isBlock) && (!known.width.isNaN && known.width >= 0) && (!known.height.isNaN && known.height >= 0) {
        return known
      }
    }
    
    var maxWidth = CGFloat.greatestFiniteMagnitude
    var maxHeight = CGFloat.greatestFiniteMagnitude
    
    let allowWrap = engine.canWrap
    
    
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
    
    let scale = CGFloat(NSCMason.scale)
    // A percentage text-indent resolves against the line's width; it is 0 for intrinsic sizes.
    let indent = engine.textIndent(basis: available.width.isFinite && available.width > 0 ? available.width / scale : 0)

    if(maxWidth == CGFloat.greatestFiniteMagnitude){
      if(available.width == -1){
        maxWidth = allowWrap ? engine.minContent(text, indent: indent) : engine.maxContent(text, indent: indent)
      }
      
      if (available.width == -2){
        maxWidth = engine.maxContent(text, indent: indent)
      }
    }
    
    // Reuse cached CTFramesetter when the attributed string hasn't changed.
    // Creating a framesetter is expensive: it triggers glyph lookup, font
    // fallback resolution, bidi analysis, and line-breaking table setup.
    let framesetter = engine.framesetter(for: text, width: maxWidth, indent: indent)

    var constraintSize = CGSize(width: maxWidth, height: maxHeight)
    // Avoid passing infinite height to CoreText framesetter — use a large finite fallback.
    // Never the available height: a frame shorter than one line lays out zero lines.
    if !constraintSize.height.isFinite || constraintSize.height > 1_000_000 {
      constraintSize.height = 10000.0
    }

    let floatRects = engine.floatExclusionRects()

    // Lay out in a tall path either way; the height comes from the frame's lines.
    let pathHeight = constraintSize.height

    // Build exclusion path (outer rect ± float cutouts). CoreText's y runs up from the bottom.
    let outerRect = engine.wrapRect(width: constraintSize.width, height: pathHeight, indent: indent)
    let bezier = UIBezierPath(rect: outerRect)
    bezier.usesEvenOddFillRule = true
    // Even-odd: any part of a hole outside the outer rect would be filled instead, so clip it.
    for r in floatRects {
      let hole = CGRect(x: r.minX, y: pathHeight - r.maxY, width: r.width, height: r.height).intersection(outerRect)
      if !hole.isNull && !hole.isEmpty { bezier.append(UIBezierPath(rect: hole)) }
    }
    let path = bezier.cgPath

    let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, text.length), path, nil)

    // Derive size from the frame's line origins (CoreText's Y-up coordinate
    // space measures lineOrigin.y from the frame's bottom):
    //   height = (firstLineOrigin.y + firstAscent) - (lastLineOrigin.y - lastDescent)
    // line-clamp: only the first lines count, the last of them measured as it is drawn.
    var size: CGSize
    let lines = CTFrameGetLines(frame) as? [CTLine] ?? []
    let clamp = engine.lineClamp
    let shown = clamp > 0 ? min(lines.count, clamp) : lines.count
    if shown == 0 {
      size = .zero
    } else {
      let count = shown
      var lineOrigins = [CGPoint](repeating: .zero, count: count)
      CTFrameGetLineOrigins(frame, CFRangeMake(0, count), &lineOrigins)

      var firstAscent: CGFloat = 0
      CTLineGetTypographicBounds(lines[0], &firstAscent, nil, nil)
      var lastDescent: CGFloat = 0
      CTLineGetTypographicBounds(lines[count - 1], nil, &lastDescent, nil)
      // Beside floats the lines are drawn where CoreText puts them, below any space it leaves
      // above the first line, so count from the frame's top.
      let top = floatRects.isEmpty ? lineOrigins[0].y + firstAscent : outerRect.maxY
      var measuredHeight = top - (lineOrigins[count - 1].y - lastDescent)
      // A line-height tighter than the glyphs: n lines are n line boxes, as in CSS, and the ink
      // overflows them (see inkOverflow). Fallback fonts' ascents aren't clamped to the box.
      if floatRects.isEmpty, engine.inkOverflow() > 0,
        let paragraph = text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle
      {
        measuredHeight = lineOrigins[0].y - lineOrigins[count - 1].y + paragraph.maximumLineHeight
      }
      // Lines that hold boxes taller than a fixed line-height grow to fit them.
      if floatRects.isEmpty, let grown = grownBoxLines(Array(lines.prefix(count)), lineOrigins, text) {
        measuredHeight = grown.y[0] + grown.above[0] - (grown.y[count - 1] - grown.below[count - 1])
      }

      // The indent moves the first line along; it is not part of the CTLine's width.
      var measuredWidth: CGFloat = 0
      for i in 0..<count {
        let lw = CGFloat(CTLineGetTypographicBounds(lines[i], nil, nil, nil)) + (i == 0 ? indent : 0)
        if lw > measuredWidth { measuredWidth = lw }
      }
      size = CGSize(width: measuredWidth, height: max(measuredHeight, 0))
    }

    if text.length > 0 && size.width <= 0 {
      let line = CTLineCreateWithAttributedString(text)
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      let lineWidth = CGFloat(CTLineGetTypographicBounds(line, &ascent, &descent, nil))
      if lineWidth > 0 { size.width = max(0, lineWidth + indent) }
    }
    
    
    // IMPORTANT: Collect and push segments to Rust BEFORE returning size
    engine.collectAndCacheSegments(from: lines, shown, constraintSize)
    
    
    // Clamp to the available constraint but preserve the intrinsic width
    // so that flex cross-axis alignment (e.g. align-items: center) can
    // shrink the element to its content size instead of stretching it.
    if !isInLine && maxWidth < CGFloat.greatestFiniteMagnitude && maxWidth != .greatestFiniteMagnitude {
      size.width = (min(size.width, maxWidth) * scale).rounded(.up)
    } else {
      size.width = (size.width * scale).rounded(.up)
    }
    
    
    // CoreText single-line bounds are tight (~1.0× font size); CSS `line-height:
    // normal` is the font's ascent+descent+leading. Floor to it so the descenders
    // fit; block text also keeps its ~1.2× web/Android box. Multi-line already exceeds it.
    let lineHeightIsNormal = engine.node.style.resolvedLineHeight <= 0
    if lineHeightIsNormal && size.height > 0,
       let fv = engine.node.getDefaultAttributes()[.font],
       CFGetTypeID(fv as CFTypeRef) == CTFontGetTypeID() {
      let font = fv as! CTFont
      let natural = CTFontGetAscent(font) + CTFontGetDescent(font) + CTFontGetLeading(font)
      let normalLineHeight = isInLine && !engine.node.isAnonymous ? natural : max(natural, CTFontGetSize(font) * 1.2)
      if normalLineHeight > size.height { size.height = normalLineHeight }
    }

    // A line-height tighter than the font's natural line box keeps its CSS height; the glyph
    // ink that overflows it is drawn outside the box (see inkOverflow).

    // Not rounded here: layout snaps edges to device pixels, and a whole-pixel line height
    // per text adds up down a column of fractional font sizes.
    size.height = size.height * scale

    // A `known` dimension of exactly 0 is often a transient probe, not an
    // authoritative constraint; only treat a positive value as authoritative,
    // matching Android's TextEngine.kt (`knownWidth/knownHeight > 0`).
    if let known = known {
      if !known.width.isNaN && known.width > 0 {
        size.width = known.width
      }

      if !known.height.isNaN && known.height > 0 {
        size.height = known.height
      }
    }
    
    engine.node.cachedWidth = size.width
    engine.node.cachedHeight = size.height
    
    return size
  }
  
  
  private var isBuilding = false
  internal var cachedAttributedString: NSAttributedString?
  /// The cached text before vertical text's upright glyphs are marked; see buildAttributedString.
  private var cachedPlainAttributedString: NSAttributedString?

  // Cached CTFramesetter — expensive to create (glyph shaping, font fallback, bidi
  // analysis). Valid while the attributed string hasn't changed. Keyed by
  // segmentsInvalidateVersion so it is automatically stale after any invalidation.
  private var cachedFramesetter: CTFramesetter?
  private var framesetterStringVersion: UInt64 = UInt64.max
  // CoreText reads the run delegates when it typesets, so a framesetter made before its inline
  // boxes were laid out keeps their old metrics: it is also keyed by their sizes and baselines.
  private var framesetterBoxMetrics: [CGFloat] = []
  private var inlineBoxNodes: (version: UInt64, nodes: [MasonNode])?

  // The text's soft hyphens, first-line indent and inter-character justification resolved for one
  // width (0 when neither applies).
  private var fitted: (version: UInt64, width: CGFloat, indent: CGFloat, justify: CGFloat, trim: CGFloat, framesetter: CTFramesetter)?
  // Whether the text has a mark text-spacing-trim may trim at a soft line break.
  private var lineEdgeTrims: (version: UInt64, any: Bool)?

  /// How `text-align: justify` spreads a line's slack: nil when not justified.
  private var justification: Justification? {
    guard style.resolvedTextAlign == .Justify else { return nil }
    switch style.resolvedTextJustify {
    case .None: return nil
    case .InterCharacter, .Distribute: return .characters
    default: return .words
    }
  }

  enum Justification { case words, characters }

  /// The framesetter for `text` wrapped at `width`, with soft hyphens broken and drawn as on the
  /// web, and the first line indented by `indent` (lay it out in `wrapRect`).
  /// A framesetter for `text`. CoreText spaces the lines of CJK fonts by their own height past
  /// a paragraph's maximum line height unless its maximum line spacing is 0, which only a
  /// CTParagraphStyle can say; a fixed line box gets one, so lines are a line-height apart.
  static func framesetter(_ text: NSAttributedString) -> CTFramesetter {
    CTFramesetterCreateWithAttributedString(fixedLineSpacing(text))
  }

  /// CSS grows a line to hold an inline box taller than its line-height; CoreText keeps a fixed
  /// line box one line-height from the next and lets the box overlap it. Each line's baseline
  /// (`origins` are CoreText's), how far its line box reaches above and below it, and the growth
  /// in all; nil when no box sticks out of a fixed line box.
  static func grownBoxLines(_ lines: [CTLine], _ origins: [CGPoint], _ text: NSAttributedString)
    -> (y: [CGFloat], above: [CGFloat], below: [CGFloat], growth: CGFloat)?
  {
    guard lines.count > 1, origins.count >= lines.count, text.length > 0,
      let style = text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle,
      style.maximumLineHeight > 0, style.minimumLineHeight == style.maximumLineHeight
    else { return nil }
    let lineHeight = style.maximumLineHeight
    var boxes: [(above: CGFloat, below: CGFloat)?] = []
    for line in lines {
      var box: (above: CGFloat, below: CGFloat)?
      for run in CTLineGetGlyphRuns(line) as? [CTRun] ?? [] {
        guard (CTRunGetAttributes(run) as NSDictionary)[kCTRunDelegateAttributeName as String] != nil else { continue }
        var ascent: CGFloat = 0
        var descent: CGFloat = 0
        CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, &descent, nil)
        box = (max(box?.above ?? 0, ascent), max(box?.below ?? 0, descent))
      }
      boxes.append(box)
    }
    // Lines without boxes sit one line-height apart; they give the grid and the text's extents.
    guard let plain = boxes.firstIndex(where: { $0 == nil }) else { return nil }
    var textAbove: CGFloat = 0
    var textBelow: CGFloat = 0
    CTLineGetTypographicBounds(lines[plain], &textAbove, &textBelow, nil)
    guard boxes.contains(where: { $0.map { $0.above > textAbove + 0.5 || $0.below > textBelow + 0.5 } ?? false })
    else { return nil }
    var y: [CGFloat] = []
    var above: [CGFloat] = []
    var below: [CGFloat] = []
    var moved: CGFloat = 0
    for i in lines.indices {
      let up = max(0, (boxes[i]?.above ?? 0) - textAbove)
      let down = max(0, (boxes[i]?.below ?? 0) - textBelow)
      y.append(origins[plain].y + CGFloat(plain - i) * lineHeight - moved - up)
      above.append(textAbove + up)
      below.append(textBelow + down)
      moved += up + down
    }
    return (y, above, below, moved)
  }

  private static func fixedLineSpacing(_ text: NSAttributedString) -> NSAttributedString {
    var result: NSMutableAttributedString?
    text.enumerateAttribute(.paragraphStyle, in: NSRange(location: 0, length: text.length)) { value, range, _ in
      guard let style = value as? NSParagraphStyle, style.maximumLineHeight > 0,
        style.minimumLineHeight == style.maximumLineHeight
      else { return }
      let out = result ?? NSMutableAttributedString(attributedString: text)
      result = out
      out.addAttribute(.paragraphStyle, value: coreTextStyle(style), range: range)
    }
    return result ?? text
  }

  private static let coreTextFloatSpecs: [CTParagraphStyleSpecifier] = [
    .firstLineHeadIndent, .headIndent, .tailIndent, .minimumLineHeight, .maximumLineHeight,
    .minimumLineSpacing, .maximumLineSpacing, .paragraphSpacingBefore, .paragraphSpacing,
    .lineHeightMultiple, .defaultTabInterval,
  ]

  /// `style` as a CTParagraphStyle whose maximum line spacing is its own line spacing.
  private static func coreTextStyle(_ style: NSParagraphStyle) -> CTParagraphStyle {
    var alignment = CTTextAlignment(style.alignment)
    var lineBreak = CTLineBreakMode(rawValue: UInt8(style.lineBreakMode.rawValue)) ?? .byWordWrapping
    var direction = CTWritingDirection(rawValue: Int8(style.baseWritingDirection.rawValue)) ?? .natural
    var floats: [CGFloat] = [
      style.firstLineHeadIndent, style.headIndent, style.tailIndent, style.minimumLineHeight, style.maximumLineHeight,
      style.lineSpacing, style.lineSpacing, style.paragraphSpacingBefore, style.paragraphSpacing,
      style.lineHeightMultiple, style.defaultTabInterval,
    ]
    return floats.withUnsafeMutableBufferPointer { values in
      withUnsafeMutableBytes(of: &alignment) { a in
        withUnsafeMutableBytes(of: &lineBreak) { b in
          withUnsafeMutableBytes(of: &direction) { d in
            var settings = [
              CTParagraphStyleSetting(spec: .alignment, valueSize: a.count, value: a.baseAddress!),
              CTParagraphStyleSetting(spec: .lineBreakMode, valueSize: b.count, value: b.baseAddress!),
              CTParagraphStyleSetting(spec: .baseWritingDirection, valueSize: d.count, value: d.baseAddress!),
            ]
            for (i, spec) in coreTextFloatSpecs.enumerated() {
              settings.append(CTParagraphStyleSetting(spec: spec, valueSize: MemoryLayout<CGFloat>.size, value: values.baseAddress! + i))
            }
            return CTParagraphStyleCreate(settings, settings.count)
          }
        }
      }
    }
  }

  private func currentInlineBoxMetrics(_ text: NSAttributedString) -> [CGFloat] {
    if inlineBoxNodes?.version != segmentsInvalidateVersion {
      var nodes: [MasonNode] = []
      text.enumerateAttribute(Constants.VIEW_PLACEHOLDER_KEY, in: NSRange(location: 0, length: text.length), options: .longestEffectiveRangeNotRequired) { value, _, _ in
        if let helper = value as? ViewHelper { nodes.append(helper.node) }
      }
      inlineBoxNodes = (segmentsInvalidateVersion, nodes)
    }
    guard let nodes = inlineBoxNodes?.nodes, !nodes.isEmpty else { return [] }
    var metrics: [CGFloat] = []
    metrics.reserveCapacity(nodes.count * 3)
    for node in nodes {
      let size = inlineBoxSize(node)
      metrics.append(size.width)
      metrics.append(size.height)
      metrics.append(inlineBoxBaseline(node, height: boxIsInVerticalText(node) ? size.width : size.height))
    }
    return metrics
  }

  internal func framesetter(for text: NSAttributedString, width: CGFloat, indent: CGFloat = 0) -> CTFramesetter {
    let base: CTFramesetter
    let boxMetrics = currentInlineBoxMetrics(text)
    if let cached = cachedFramesetter, framesetterStringVersion == segmentsInvalidateVersion, framesetterBoxMetrics == boxMetrics {
      base = cached
    } else {
      base = TextEngine.framesetter(text)
      cachedFramesetter = base
      framesetterStringVersion = segmentsInvalidateVersion
      framesetterBoxMetrics = boxMetrics
      fitted = nil
    }
    let finiteWidth = width.isFinite && width > 0 && width < 1_000_000
    let hyphenWidth: CGFloat = finiteWidth
      && (text.string as NSString).range(of: "\u{00AD}").location != NSNotFound ? width : 0
    let justify = finiteWidth && hyphenWidth == 0 ? justification : nil
    let justifyWidth: CGFloat = justify == nil ? 0 : width
    if finiteWidth && lineEdgeTrims?.version != segmentsInvalidateVersion {
      lineEdgeTrims = (segmentsInvalidateVersion, TextEngine.trimsAtLineEdges(text))
    }
    let trimWidth: CGFloat = finiteWidth && lineEdgeTrims?.any == true ? width : 0
    if hyphenWidth == 0 && indent == 0 && justifyWidth == 0 && trimWidth == 0 { return base }
    if let fitted = fitted, fitted.version == segmentsInvalidateVersion, fitted.width == hyphenWidth, fitted.indent == indent,
       fitted.justify == justifyWidth, fitted.trim == trimWidth {
      return fitted.framesetter
    }
    var source = indent == 0 ? text : TextEngine.indenting(text, indent)
    if trimWidth > 0 {
      source = TextEngine.trimmingLineEdges(source, in: wrapRect(width: trimWidth, height: 1_000_000, indent: indent))
    }
    if let justify = justify { source = TextEngine.justifying(source, justifyWidth + max(0, -indent), justify) }
    // Nothing trimmed and nothing else fitted: the text's own framesetter.
    let framesetter = hyphenWidth > 0
      ? TextEngine.fitSoftHyphens(source, hyphenWidth + max(0, -indent))
      : source === text ? base : TextEngine.framesetter(source)
    fitted = (segmentsInvalidateVersion, hyphenWidth, indent, justifyWidth, trimWidth, framesetter)
    return framesetter
  }

  private static func lineEnds(_ framesetter: CTFramesetter, _ path: CGPath) -> [Int] {
    let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: 0), path, nil)
    return (CTFrameGetLines(frame) as? [CTLine] ?? []).map {
      let range = CTLineGetStringRange($0)
      return range.location + range.length
    }
  }

  /// word-spacing: each space gets its extra advance as kerning, on top of any letter-spacing.
  /// The key is consumed, so a container flattening this text doesn't add it again.
  static func applyWordSpacing(_ text: NSMutableAttributedString) {
    guard text.length > 0 else { return }
    let chars = text.string as NSString
    var spaced: [NSRange] = []
    text.enumerateAttribute(Constants.WORD_SPACING_KEY, in: NSRange(location: 0, length: text.length)) { value, range, _ in
      guard let extra = value as? CGFloat else { return }
      spaced.append(range)
      for i in range.location..<(range.location + range.length) {
        let c = chars.character(at: i)
        guard c == 0x20 || c == 0xA0 else { continue }
        let kern = (text.attribute(.kern, at: i, effectiveRange: nil) as? CGFloat) ?? 0
        text.addAttribute(.kern, value: kern + extra, range: NSRange(location: i, length: 1))
      }
    }
    for range in spaced { text.removeAttribute(Constants.WORD_SPACING_KEY, range: range) }
  }

  /// text-align: justify: each wrapped line but the last spreads its slack as kerning.
  static func justifying(_ text: NSAttributedString, _ width: CGFloat, _ mode: Justification) -> NSAttributedString {
    let path = CGPath(rect: CGRect(x: 0, y: 0, width: width, height: 1_000_000), transform: nil)
    let frame = CTFramesetterCreateFrame(TextEngine.framesetter(text), CFRange(location: 0, length: 0), path, nil)
    guard let lines = CTFrameGetLines(frame) as? [CTLine], !lines.isEmpty else { return text }
    var origins = [CGPoint](repeating: .zero, count: lines.count)
    CTFrameGetLineOrigins(frame, CFRange(location: 0, length: 0), &origins)
    let out = NSMutableAttributedString(attributedString: text)
    let chars = text.string as NSString
    for (index, line) in lines.enumerated() {
      let range = CTLineGetStringRange(line)
      let end = range.location + range.length
      guard range.length > 0, end < chars.length, chars.character(at: end - 1) != 0x0A else { continue }
      var last = end
      while last > range.location, isBreakSpace(chars.character(at: last - 1)) { last -= 1 }
      // Where the slack goes: after each character but the last, or on each inner space.
      var gaps: [NSRange] = []
      var i = range.location
      while i < last {
        let cluster = chars.rangeOfComposedCharacterSequence(at: i)
        let next = cluster.location + cluster.length
        if next < last {
          let c = chars.character(at: cluster.location)
          if mode == .characters || c == 0x20 || c == 0xA0 { gaps.append(cluster) }
        }
        i = next
      }
      guard !gaps.isEmpty else { continue }
      let used = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) - CGFloat(CTLineGetTrailingWhitespaceWidth(line))
      // A hair under the slack so the line still fits.
      let extra = (width - origins[index].x - used - 0.01) / CGFloat(gaps.count)
      guard extra > 0 else { continue }
      for cluster in gaps {
        let at = NSRange(location: cluster.location + cluster.length - 1, length: 1)
        let kern = (out.attribute(.kern, at: at.location, effectiveRange: nil) as? CGFloat) ?? 0
        out.addAttribute(.kern, value: kern + extra, range: at)
      }
    }
    return out
  }

  private static func isBreakSpace(_ c: unichar) -> Bool {
    return c == 0x20 || c == 0x0A || c == 0x09 || c == 0x200B
  }

  // CoreText draws nothing at a soft hyphen and doesn't pick its breaks greedily, so every
  // soft hyphen becomes a word joiner (same length). Then, line by line, the word that didn't
  // fit breaks at its last soft hyphen whose piece fits with a hyphen, as browsers do.
  private static func fitSoftHyphens(_ text: NSAttributedString, _ width: CGFloat) -> CTFramesetter {
    let fitted = NSMutableAttributedString(attributedString: text)
    let chars = fitted.mutableString
    var softHyphens: [Int] = []
    for i in 0..<chars.length where chars.character(at: i) == 0x00AD {
      softHyphens.append(i)
      chars.replaceCharacters(in: NSRange(location: i, length: 1), with: "\u{2060}")
    }
    let path = CGPath(rect: CGRect(x: 0, y: 0, width: width, height: 1_000_000), transform: nil)
    var framesetter = TextEngine.framesetter(fitted.copy() as! NSAttributedString)
    var ends = lineEnds(framesetter, path)
    var line = 0
    while line < ends.count - 1 {
      let start = line == 0 ? 0 : ends[line - 1]
      let end = ends[line]
      var wordStart = end
      while wordStart > start, !isBreakSpace(chars.character(at: wordStart - 1)) { wordStart -= 1 }
      var wordEnd = end
      while wordEnd < chars.length, !isBreakSpace(chars.character(at: wordEnd)) { wordEnd += 1 }
      for point in softHyphens.reversed() where point >= wordStart && point < wordEnd {
        let at = NSRange(location: point, length: 1)
        chars.replaceCharacters(in: at, with: "\u{2010}")
        let trial = TextEngine.framesetter(fitted.copy() as! NSAttributedString)
        let trialEnds = lineEnds(trial, path)
        if line < trialEnds.count, trialEnds[line] == point + 1 {
          framesetter = trial
          ends = trialEnds
          break
        }
        chars.replaceCharacters(in: at, with: "\u{2060}")
      }
      line += 1
    }
    return framesetter
  }

  /// `hyphens: none`: a word joiner in place of each soft hyphen keeps offsets and forbids the break.
  private static func joinSoftHyphens(_ text: NSMutableAttributedString) {
    let chars = text.mutableString
    var found = chars.range(of: "\u{00AD}")
    while found.location != NSNotFound {
      chars.replaceCharacters(in: found, with: "\u{2060}")
      let next = found.location + 1
      found = chars.range(of: "\u{00AD}", options: [], range: NSRange(location: next, length: chars.length - next))
    }
  }

  /// `hyphens: auto`: soft hyphens where the system dictionary for the current locale breaks words.
  private static func insertHyphenationPoints(_ text: NSMutableAttributedString) {
    let locale = Locale.current as CFLocale
    guard CFStringIsHyphenationAvailableForLocale(locale), text.length > 0 else { return }
    let string = text.string as NSString
    var points: [Int] = []
    string.enumerateSubstrings(in: NSRange(location: 0, length: string.length), options: [.byWords, .substringNotRequired]) { _, word, _, _ in
      guard word.length >= 5 else { return }
      let range = CFRange(location: word.location, length: word.length)
      var before = word.location + word.length
      while true {
        let point = CFStringGetHyphenationLocationBeforeIndex(string as CFString, before, range, 0, locale, nil)
        if point == kCFNotFound || point <= word.location { break }
        if string.character(at: point - 1) != 0x00AD && string.character(at: point) != 0x00AD {
          points.append(point)
        }
        before = point
      }
    }
    for point in points.sorted(by: >) {
      let attrs = text.attributes(at: point - 1, effectiveRange: nil)
      text.insert(NSAttributedString(string: "\u{00AD}", attributes: attrs), at: point)
    }
  }

  /// Soft hyphens are break points for min-content, each piece carrying its hyphen.
  private static func breakableAtSoftHyphens(_ text: NSAttributedString) -> NSAttributedString {
    let string = text.string as NSString
    guard string.range(of: "\u{00AD}").location != NSNotFound else { return text }
    let out = NSMutableAttributedString(attributedString: text)
    let chars = out.mutableString
    var found = chars.range(of: "\u{00AD}")
    while found.location != NSNotFound {
      chars.replaceCharacters(in: found, with: "\u{2010}\u{200B}")
      let next = found.location + 2
      found = chars.range(of: "\u{00AD}", options: [], range: NSRange(location: next, length: chars.length - next))
    }
    return out
  }

  // monotonically increasing version for invalidation; cachedAttributedString is valid when
  // attributedStringVersion == segmentsInvalidateVersion
  private var segmentsInvalidateVersion: UInt64 = 0
  private var attributedStringVersion: UInt64 = 0
  // The inside list marker in the last built text.
  internal var insideMarker = ""

  // Last (version, constraintSize) collectAndCacheSegments() sent for. The
  // CTFrame itself is rebuilt every call, so it can't signal "unchanged"
  // the way Android's cached StaticLayout instance does — this pair is the
  // narrowest substitute.
  private var lastSegmentsVersion: UInt64 = UInt64.max
  fileprivate var lastSegmentsConstraintSize = CGSize(width: -1, height: -1)
  // Text-only segments the last collectAndCacheSegments built, for the layout cache.
  fileprivate var lastBuiltSegments: [CMasonSegment]?

  /// Adopt a cached measurement: push its segments to Rust as a fresh measure would.
  fileprivate func applyCachedLayout(_ entry: TextLayoutCache.Entry) {
    if !(lastSegmentsVersion == segmentsInvalidateVersion && lastSegmentsConstraintSize == entry.constraint), let ptr = node.nativePtr {
      if entry.segments.isEmpty {
        mason_node_clear_segments(node.mason.nativePtr, ptr)
      } else {
        var segments = entry.segments
        mason_node_set_segments(node.mason.nativePtr, ptr, &segments, UInt(segments.count))
      }
    }
    attributedStringVersion = segmentsInvalidateVersion
    lastSegmentsVersion = segmentsInvalidateVersion
    lastSegmentsConstraintSize = entry.constraint
    node.cachedWidth = entry.size.width
    node.cachedHeight = entry.size.height
  }

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
    cachedPlainAttributedString = nil
    cachedFramesetter = nil  // framesetter derives from the attributed string
    if markDirty {
      node.markDirty()
    }
    // A flattened parent's attributed string embeds this content: invalidate it too.
    if let parentNode = node.layoutParent, let parentContainer = MasonViewKind.textContainer(parentNode.view) {
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

    // An inline-block (a button, say) is an atomic box, never merged into the text.
    if style.display == .InlineBlock { return false }
    // A filter needs the element's own painted box to work on.
    if !style.resolvedFilterString.isEmpty { return false }
    
    // A background image/gradient needs a real box; a plain color is painted per
    // run when flattened, like an inline box's background on the web (and Android).
    let hasBackgroundImage: Bool = {
      let bgString = container.node.style.background.trimmingCharacters(in: .whitespacesAndNewlines)
      if !bgString.isEmpty { return true }
      if let alpha = container.node.view?.backgroundColor?.cgColor.alpha, alpha > 0 { return true }
      return false
    }()
    let hasBackground = hasBackgroundImage || container.node.style.backgroundColor != 0

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
    if hasBackgroundImage || hasBorder || hasPadding || hasExplicitSize {
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

    // CoreText reads a paragraph's alignment from its first character, so a box that starts
    // a line has to carry the text's paragraph style or a centred line comes out left-aligned.
    if let paragraphStyle = node.getDefaultAttributes()[.paragraphStyle] {
      placeholder.addAttribute(.paragraphStyle, value: paragraphStyle, range: NSRange(location: 0, length: 1))
    }

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
    // Keep the whole line box inside: ascent below the top, descent above the bottom.
    let ascenderGuard = drawBounds.minY + ascent
    let descenderGuard = drawBounds.maxY - descent
    return max(min(centred, descenderGuard), ascenderGuard) + baselineOffset
  }

  private func singleLineBaselineY(ascent: CGFloat, descent: CGFloat, in drawBounds: CGRect, bounds: CGRect) -> CGFloat {
    let topBaselineY: CGFloat
    if let provider = container as? SingleLineTextBaselineProviding {
      topBaselineY = provider.singleLineTextBaselineY(ascent: ascent, descent: descent, in: drawBounds)
    } else {
      let attrs = node.getDefaultAttributes()
      let baselineOffset = (attrs[NSAttributedString.Key.baselineOffset] as? CGFloat) ?? 0
      let capHeight: CGFloat = {
        if let fv = attrs[NSAttributedString.Key.font], CFGetTypeID(fv as CFTypeRef) == CTFontGetTypeID() { return CTFontGetCapHeight(fv as! CTFont) }
        return 0
      }()
      topBaselineY = singleLineBaselineFromTop(ascent: ascent, descent: descent, capHeight: capHeight, baselineOffset: baselineOffset, in: drawBounds)
    }

    return Self.coreTextSingleLineBaselineY(fromTop: topBaselineY, in: bounds)
  }

  internal func drawSingleLine(text: NSAttributedString, in context: CGContext, bounds: CGRect) {
    var drawBounds = bounds
    if let padding = textFramePadding() {
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
    // A CTLine has no paragraph indent: text-indent narrows the line from its start side.
    let indent = textIndent(basis: drawBounds.width)
    let room = drawBounds.width - indent
    var horizontalOffset: CGFloat = 0
    switch style.resolvedTextAlign {
    case .Center:
      horizontalOffset = max(0, (room - lineWidth) / 2)
    case .Right, .End:
      horizontalOffset = max(0, room - lineWidth)
    case .Left, .Auto, .Start, .Justify:
      horizontalOffset = 0
    }
    let factor = containerAlignmentFactor
    if factor > 0 { horizontalOffset = max(0, factor * (room - lineWidth)) }
    let originX = drawBounds.origin.x + (style.direction == .RTL ? 0 : indent) + horizontalOffset
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
      if let truncated = CTLineCreateTruncatedLine(line, Double(bounds.width - indent), .end, tokenLine) {
        drawLine = truncated
      }
    case .Custom(let value):
      let tokenAttr = NSAttributedString(
        string: value,
        attributes: text.length > 0 ? text.attributes(at: 0, effectiveRange: nil) : [:]
      )
      let tokenLine = CTLineCreateWithAttributedString(tokenAttr)
      if let truncated = CTLineCreateTruncatedLine(line, Double(bounds.width - indent), .end, tokenLine) {
        drawLine = truncated
      }
    case .Clip:
      break
    }

    drawInlineBackgrounds(for: drawLine, at: baselineOrigin, in: context)
    drawnLines.append((drawLine, baselineOrigin))

    // Draw text shadows if any
    if !style.textShadows.isEmpty {
      for shadow in style.textShadows {
        context.saveGState()
        context.setShadow(offset: CGSize(width: shadow.offsetX, height: -shadow.offsetY), blur: shadow.blurRadius, color: shadow.color.cgColor)
        context.textPosition = baselineOrigin
        let runs = CTLineGetGlyphRuns(drawLine) as? [CTRun] ?? []
        for run in runs {
          let attrs = CTRunGetAttributes(run) as NSDictionary
          if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
          // Skip BR spans - they cause line breaks but shouldn't render a visible glyph
          if attrs[NSAttributedString.Key("BrSpan")] != nil { continue }
          if attrs[Constants.UPRIGHT_GLYPH_KEY] != nil {
            drawUprightRun(run, attributes: attrs, at: baselineOrigin, in: context)
            continue
          }
          withGlyphShift(attrs, context) { CTRunDraw(run, context, CFRange(location: 0, length: 0)) }
        }
        context.restoreGState()
      }
    }

    // Draw runs, skipping placeholders (main text, no shadow)
    let runs = CTLineGetGlyphRuns(drawLine) as? [CTRun] ?? []
    context.textPosition = baselineOrigin
    for run in runs {
      let attrs = CTRunGetAttributes(run) as NSDictionary
      if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
      // Skip BR spans - they cause line breaks but shouldn't render a visible glyph
      if attrs[NSAttributedString.Key("BrSpan")] != nil { continue }
      if attrs[Constants.UPRIGHT_GLYPH_KEY] != nil {
        drawUprightRun(run, attributes: attrs, at: baselineOrigin, in: context)
        continue
      }
      withGlyphShift(attrs, context) {
        if let ctFont = attrs[NSAttributedString.Key.font], CFGetTypeID(ctFont as CFTypeRef) == CTFontGetTypeID() {
          let font = ctFont as! CTFont
          let symbolicTraits = CTFontGetSymbolicTraits(font)
          let isBold = symbolicTraits.contains(.traitBold)
          let weight = attrs[NSAttributedString.Key(Constants.FONT_WEIGHT)] as? CGFloat
            ?? (CTFontCopyTraits(font) as? [CFString: Any])?[kCTFontWeightTrait as CFString] as? CGFloat ?? 0
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
  
  
  /// Runs `draw` with the context moved along the line by the run's glyph shift (text-spacing-trim).
  @inline(__always) func withGlyphShift(_ attributes: NSDictionary, _ context: CGContext, _ draw: () -> Void) {
    guard let shift = attributes[Constants.GLYPH_SHIFT_KEY] as? CGFloat else { return draw() }
    context.translateBy(x: shift, y: 0)
    draw()
    context.translateBy(x: -shift, y: 0)
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
  
  
  /// white-space and text-wrap are inherited, so a block inside `<pre>` doesn't wrap either.
  internal var canWrap: Bool {
    guard node.style.isValueInitialized else { return true }
    let ws = node.style.resolvedWhiteSpace
    return !((ws == .Pre || ws == .NoWrap) || node.style.resolvedTextWrap == .NoWrap)
  }

  /// Widest line, in points, when wrapped at `width`; trailing whitespace hangs.
  internal func widestWrappedLine(at width: CGFloat) -> CGFloat {
    let text = buildAttributedString(forMeasurement: true)
    guard text.length > 0, width > 0 else { return 0 }
    let indent = textIndent(basis: width)
    let setter = framesetter(for: text, width: width, indent: indent)
    let path = CGPath(rect: wrapRect(width: width, height: 1_000_000, indent: indent), transform: nil)
    let frame = CTFramesetterCreateFrame(setter, CFRange(location: 0, length: 0), path, nil)
    let lines = CTFrameGetLines(frame) as? [CTLine] ?? []
    let clamp = lineClamp
    var widest: CGFloat = 0
    for (i, line) in lines.prefix(clamp > 0 ? clamp : lines.count).enumerated() {
      let w = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) - CGFloat(CTLineGetTrailingWhitespaceWidth(line)) + (i == 0 ? indent : 0)
      widest = max(widest, w)
    }
    return widest
  }

  /// Tags a flattened span's text with its background; inner spans keep their own.
  static func withInlineBackground(_ text: NSAttributedString, _ argb: UInt32) -> NSAttributedString {
    guard argb != 0, text.length > 0 else { return text }
    let out = NSMutableAttributedString(attributedString: text)
    let color = UIColor.colorFromARGB(argb).cgColor
    out.enumerateAttribute(Constants.INLINE_BACKGROUND_KEY, in: NSRange(location: 0, length: out.length)) { value, range, _ in
      if value == nil { out.addAttribute(Constants.INLINE_BACKGROUND_KEY, value: color, range: range) }
    }
    return out
  }

  /// Paints each run's inline background over the font's ascent+descent, as the
  /// web paints an inline box's content area. Drawn before shadows and glyphs.
  private func drawInlineBackgrounds(for line: CTLine, at lineOrigin: CGPoint, in context: CGContext) {
    let runs = CTLineGetGlyphRuns(line) as NSArray
    for case let item as AnyObject in runs {
      let run = item as! CTRun
      let attrs = CTRunGetAttributes(run) as NSDictionary
      guard let value = attrs[Constants.INLINE_BACKGROUND_KEY], CFGetTypeID(value as CFTypeRef) == CGColor.typeID else { continue }
      if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil || attrs[NSAttributedString.Key("BrSpan")] != nil { continue }
      var runAscent: CGFloat = 0
      var runDescent: CGFloat = 0
      let width = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &runAscent, &runDescent, nil))
      guard width > 0 else { continue }
      var ascent = runAscent
      var descent = runDescent
      if let f = attrs[NSAttributedString.Key.font], CFGetTypeID(f as CFTypeRef) == CTFontGetTypeID() {
        ascent = CTFontGetAscent(f as! CTFont)
        descent = CTFontGetDescent(f as! CTFont)
      }
      var runPosition = CGPoint.zero
      CTRunGetPositions(run, CFRange(location: 0, length: 1), &runPosition)
      context.setFillColor(value as! CGColor)
      context.fill(CGRect(x: lineOrigin.x + runPosition.x, y: lineOrigin.y - descent, width: width, height: ascent + descent))
    }
  }

  /// Draws `text-decoration` for a CTLine from each run's DECORATION_KEY.
  /// CTRunDraw renders none of them, and CTLineDraw can't skip placeholder runs.
  private func drawTextDecorations(for line: CTLine, at lineOrigin: CGPoint, in context: CGContext) {
    let runs = CTLineGetGlyphRuns(line) as NSArray
    // Trailing whitespace at a soft wrap is not decorated.
    let visibleRight = lineOrigin.x + CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) - CGFloat(CTLineGetTrailingWhitespaceWidth(line))
    for case let item as AnyObject in runs {
      let run = item as! CTRun
      let attrs = CTRunGetAttributes(run) as NSDictionary
      guard let decoration = attrs[Constants.DECORATION_KEY] as? MasonTextDecoration else { continue }
      if attrs[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
      if attrs[NSAttributedString.Key("BrSpan")] != nil { continue }

      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      let width = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, &descent, nil))
      guard width > 0 else { continue }
      var runPosition = CGPoint.zero
      CTRunGetPositions(run, CFRange(location: 0, length: 1), &runPosition)
      let x0 = lineOrigin.x + runPosition.x
      let x1 = min(x0 + width, max(x0, visibleRight))

      var font: CTFont? = nil
      if let f = attrs[NSAttributedString.Key.font], CFGetTypeID(f as CFTypeRef) == CTFontGetTypeID() {
        font = (f as! CTFont)
      }
      let fontThickness = font.map { max(CTFontGetUnderlineThickness($0), 0.5) } ?? 1
      let thickness = decoration.thickness > 0 ? decoration.thickness : fontThickness
      // y-up CoreText space: the underline position is negative, below the baseline.
      let underlineY = lineOrigin.y + (font.map { CTFontGetUnderlinePosition($0) } ?? -descent * 0.3)
      let strikeY = lineOrigin.y + (font.map { CTFontGetXHeight($0) } ?? ascent * 0.5) / 2
      let overlineY = lineOrigin.y + ascent - thickness / 2

      let fallback = (attrs[NSAttributedString.Key.foregroundColor] as? UIColor) ?? .black
      let kind = decoration.line
      if kind.isSpellingError {
        strokeDecoration(context, x0, x1, underlineY, thickness, .red, .Wavy)
      } else if kind.isGrammarError {
        strokeDecoration(context, x0, x1, underlineY, thickness, UIColor(red: 0, green: 128 / 255, blue: 0, alpha: 1), .Wavy)
      } else {
        let color = decoration.color ?? fallback
        if kind.hasUnderline { strokeDecoration(context, x0, x1, underlineY, thickness, color, decoration.style) }
        if kind.hasOverline { strokeDecoration(context, x0, x1, overlineY, thickness, color, decoration.style) }
        if kind.hasLineThrough { strokeDecoration(context, x0, x1, strikeY, thickness, color, decoration.style) }
      }
    }
  }

  private func strokeDecoration(_ context: CGContext, _ x0: CGFloat, _ x1: CGFloat, _ y: CGFloat, _ thickness: CGFloat, _ color: UIColor, _ style: DecorationStyle) {
    context.saveGState()
    defer { context.restoreGState() }
    context.setStrokeColor(color.cgColor)
    context.setLineWidth(thickness)
    context.setLineCap(.butt)
    switch style {
    case .Solid:
      context.move(to: CGPoint(x: x0, y: y))
      context.addLine(to: CGPoint(x: x1, y: y))
    case .Double:
      for dy in [-thickness, thickness] {
        context.move(to: CGPoint(x: x0, y: y + dy))
        context.addLine(to: CGPoint(x: x1, y: y + dy))
      }
    case .Dotted:
      context.setLineCap(.round)
      context.setLineDash(phase: 0, lengths: [0.01, thickness * 2])
      context.move(to: CGPoint(x: x0, y: y))
      context.addLine(to: CGPoint(x: x1, y: y))
    case .Dashed:
      context.setLineDash(phase: 0, lengths: [thickness * 3, thickness * 2])
      context.move(to: CGPoint(x: x0, y: y))
      context.addLine(to: CGPoint(x: x1, y: y))
    case .Wavy:
      let amplitude = max(1, thickness)
      let half = max(2, thickness * 2)
      context.move(to: CGPoint(x: x0, y: y))
      var x = x0
      var up = true
      while x < x1 {
        let next = min(x + half, x1)
        let ctrlY = up ? y + amplitude * 2 : y - amplitude * 2
        context.addQuadCurve(to: CGPoint(x: next, y: y), control: CGPoint(x: (x + next) / 2, y: ctrlY))
        x = next
        up = !up
      }
    }
    context.strokePath()
  }
  
  
  private struct LineLayout {
    let lines: CFArray
    var origins: [CGPoint]
    let count: Int
    let clampedLast: CTLine?
    let drawBounds: CGRect
    let layoutBounds: CGRect
    let path: CGPath
    let textBaseY: CGFloat
    let grownExtents: (above: [CGFloat], below: [CGFloat])?

    func line(_ i: Int) -> CTLine {
      if i == count - 1, let last = clampedLast { return last }
      return unsafeBitCast(CFArrayGetValueAtIndex(lines, i), to: CTLine.self)
    }
  }

  private func drawsSingleLine(_ text: NSAttributedString) -> Bool {
    return !canWrap && !TextEngine.hasLineBreak(text)
  }

  private var containerAlignmentFactor: CGFloat {
    guard style.isValueInitialized, verticalWritingMode == 0 else { return 0 }
    func justify(_ value: JustifyContent, reversed: Bool) -> CGFloat {
      switch value {
      case .Center, .SpaceAround, .SpaceEvenly: return 0.5
      case .End: return 1
      case .FlexEnd: return reversed ? 0 : 1
      case .Normal, .FlexStart, .SpaceBetween, .Stretch: return reversed ? 1 : 0
      case .Start: return 0
      }
    }
    switch style.display {
    case .Flex, .InlineFlex:
      switch style.flexDirection {
      case .Row: return justify(style.justifyContent, reversed: false)
      case .RowReverse: return justify(style.justifyContent, reversed: true)
      default:
        switch style.alignItems {
        case .Center: return 0.5
        case .End, .FlexEnd: return 1
        default: return 0
        }
      }
    case .Grid, .InlineGrid:
      switch style.justifyItems {
      case .Center: return 0.5
      case .End, .FlexEnd: return 1
      default: return justify(style.justifyContent, reversed: false)
      }
    default:
      return 0
    }
  }

  /// mason-core's `BASELINE_QUERY`: an available width asking for the last baseline.
  static let baselineQuery: CGFloat = -4

  /// The last line's baseline from the top of a content box `size` big in pixels, where it is drawn.
  private func baselineFromTop(of size: CGSize) -> CGFloat {
    let scale = CGFloat(NSCMason.scale)
    let padding = textFramePadding() ?? .zero
    let height = size.height / scale + padding.top + padding.bottom
    let width = size.width / scale + padding.left + padding.right
    guard let fromBottom = lastBaselineFromBottom(width: width, height: height) else { return .nan }
    return (height - fromBottom - padding.top) * scale
  }

  private func lastBaselineFromBottom(width: CGFloat, height: CGFloat) -> CGFloat? {
    let text = buildAttributedString(forMeasurement: false)
    guard text.length > 0 else { return nil }
    let bounds = CGRect(x: 0, y: 0, width: width, height: height)
    if drawsSingleLine(text) {
      var drawBounds = bounds
      if let padding = textFramePadding() { drawBounds = drawBounds.inset(by: padding) }
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      _ = CTLineGetTypographicBounds(CTLineCreateWithAttributedString(text), &ascent, &descent, nil)
      return singleLineBaselineY(ascent: ascent, descent: descent, in: drawBounds, bounds: bounds)
    }
    guard let layout = layOutLines(text, bounds: bounds) else { return nil }
    return layout.origins[layout.count - 1].y + layout.textBaseY
  }

  private func layOutLines(_ text: NSAttributedString, bounds: CGRect) -> LineLayout? {
    guard text.length > 0 else { return nil }

    var drawBounds = bounds

    guard drawBounds.width > 0 else { return nil }
    if let padding = textFramePadding() {
      drawBounds = drawBounds.inset(by: padding)
      guard drawBounds.width > 0, drawBounds.height > 0 else { return nil }
    }

    // Reuses the framesetter measure() already cached for this string.
    let indent = textIndent(basis: drawBounds.width)
    let width = canWrap ? drawBounds.width : max(drawBounds.width, maxContent(text, indent: max(indent, 0)))
    let framesetter = self.framesetter(for: text, width: width, indent: indent)

    let suggestedSize = CTFramesetterSuggestFrameSizeWithConstraints(
      framesetter,
      CFRange(location: 0, length: text.length),
      nil,
      wrapRect(width: width, height: .greatestFiniteMagnitude, indent: indent).size,
      nil
    )

    // Lines beside floats need more height than the no-float suggestion; measure gave the view
    // that height, so lay out in all of it.
    let floatRects = floatExclusionRects()
    // Top-align text (matching CSS block-level behavior): no vertical offset
    let layoutBounds = CGRect(
      x: drawBounds.origin.x,
      y: drawBounds.origin.y,
      width: width,
      height: floatRects.isEmpty ? suggestedSize.height : max(suggestedSize.height, drawBounds.height)
    )

    // Build exclusion path in layout-local coordinates (origin at zero).
    // We'll flip Y so CoreText's frame-coordinate space matches the engine's top-based Y.
    let localOuter = wrapRect(width: layoutBounds.width, height: layoutBounds.height, indent: indent)
    let bezier = UIBezierPath(rect: localOuter)
    bezier.usesEvenOddFillRule = true
    // Floats beside the text, flipped into CoreText's bottom-up frame space.
    let exclusions = floatRects.map {
      CGRect(x: $0.minX, y: localOuter.height - $0.maxY, width: $0.width, height: $0.height)
    }
    // Even-odd fills any part of a hole outside the outer rect, so each is clipped to it.
    func appendHoles(_ path: UIBezierPath, inside outer: CGRect) {
      for exclusion in exclusions {
        let hole = exclusion.intersection(outer)
        if !hole.isNull && !hole.isEmpty { path.append(UIBezierPath(rect: hole)) }
      }
    }
    appendHoles(bezier, inside: localOuter)
    let path = bezier.cgPath

    var frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: text.length), path, nil)

    // CoreText's suggested size can be shorter than the frame it then needs: a line clamped by
    // line-height (maximumLineHeight) that holds a taller inline box fits the suggestion but
    // not the frame, which then drops it and nothing is drawn. Lay out in the height the view
    // was given instead, growing the path downward so the lines keep their top-anchored places.
    var originShift: CGFloat = 0
    if !floatRects.isEmpty {
      // Measure's height ends at the last line's descent, and CoreText drops a line whose leading
      // runs past the frame, so let the frame run on below; the draw is clipped to the view.
      originShift = 10000
      let tallerRect = CGRect(x: localOuter.minX, y: -originShift, width: localOuter.width, height: localOuter.height + originShift)
      let taller = UIBezierPath(rect: tallerRect)
      taller.usesEvenOddFillRule = true
      appendHoles(taller, inside: tallerRect)
      frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: text.length), taller.cgPath, nil)
    } else if CTFrameGetVisibleStringRange(frame).length < text.length {
      // The view was sized for every line (measure lays out in a tall frame), so lay out in one
      // as tall: lines it drops here would not be drawn.
      originShift = 10000
      let tallerRect = CGRect(x: localOuter.minX, y: -originShift, width: localOuter.width, height: localOuter.height + originShift)
      let taller = UIBezierPath(rect: tallerRect)
      taller.usesEvenOddFillRule = true
      appendHoles(taller, inside: tallerRect)
      frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: text.length), taller.cgPath, nil)
    }

    let linesCF = CTFrameGetLines(frame)
    var linesCount = CFArrayGetCount(linesCF)
    guard linesCount > 0 else { return nil }

    var origins = Array(repeating: CGPoint.zero, count: linesCount)
    CTFrameGetLineOrigins(frame, CFRangeMake(0, 0), &origins)
    // Origins count from the path's bottom edge; put them back on the original path's.
    // Across, they count from its left edge, which a hanging indent moves.
    if originShift > 0 || localOuter.minX != 0 {
      for i in origins.indices {
        origins[i].y -= originShift
        origins[i].x += localOuter.minX
      }
    }

    // Lines that hold boxes taller than a fixed line-height grow to fit them.
    var grownExtents: (above: [CGFloat], below: [CGFloat])?
    if floatRects.isEmpty, lineClamp == 0,
      let grown = TextEngine.grownBoxLines(CTFrameGetLines(frame) as? [CTLine] ?? [], origins, text)
    {
      for i in origins.indices { origins[i].y = grown.y[i] }
      grownExtents = (grown.above, grown.below)
    }

    // line-clamp: the first lines only, sitting as in a frame just that tall, the last one
    // ending in an ellipsis.
    var clampedLast: CTLine? = nil
    let clamp = lineClamp
    if clamp > 0 && linesCount > clamp {
      let cut = unsafeBitCast(CFArrayGetValueAtIndex(linesCF, clamp - 1), to: CTLine.self)
      var cutDescent: CGFloat = 0
      var endDescent: CGFloat = 0
      CTLineGetTypographicBounds(cut, nil, &cutDescent, nil)
      CTLineGetTypographicBounds(unsafeBitCast(CFArrayGetValueAtIndex(linesCF, linesCount - 1), to: CTLine.self), nil, &endDescent, nil)
      let drop = (origins[clamp - 1].y - cutDescent) - (origins[linesCount - 1].y - endDescent)
      for i in 0..<clamp { origins[i].y -= drop }
      let ellipsized = clampedLine(text, from: cut, width: drawBounds.width - (clamp == 1 ? indent : 0))
      origins[clamp - 1].x += flushFactor(text, cut) * (TextEngine.visibleWidth(cut) - TextEngine.visibleWidth(ellipsized))
      clampedLast = ellipsized
      linesCount = clamp
    }

    let factor = containerAlignmentFactor
    if factor > 0 {
      var left = CGFloat.greatestFiniteMagnitude
      var right = -CGFloat.greatestFiniteMagnitude
      for i in 0..<linesCount {
        let line = i == linesCount - 1 ? (clampedLast ?? unsafeBitCast(CFArrayGetValueAtIndex(linesCF, i), to: CTLine.self))
          : unsafeBitCast(CFArrayGetValueAtIndex(linesCF, i), to: CTLine.self)
        left = min(left, origins[i].x)
        right = max(right, origins[i].x + TextEngine.visibleWidth(line))
      }
      let free = drawBounds.width - (right - left)
      if free > 0 {
        let shift = factor * free - left
        for i in 0..<linesCount { origins[i].x += shift }
      }
    }

    // Re-anchor the vertical baseline using the font's true metrics, not
    // CoreText's frame positioning (driven by the possibly-clamped line-height).
    // A single line centers in the content box; a tight multi-line block pins
    // its first baseline to the full font ascent so ascenders/descenders fit.
    var textBaseY = layoutBounds.origin.y
    if text.length > 0,
       let fontValue = node.getDefaultAttributes()[.font],
       CFGetTypeID(fontValue as CFTypeRef) == CTFontGetTypeID() {
      let font = fontValue as! CTFont
      let fontAscent = CTFontGetAscent(font)
      let naturalLineHeight = fontAscent + CTFontGetDescent(font)
      let paragraph = text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle
      let maxLineHeight = paragraph?.maximumLineHeight ?? 0
      // A fixed line box puts the first line exactly as a single line in a box that tall;
      // the rest follow at the fixed pitch. CoreText's own first-line position sits higher.
      let fixedLineBox = linesCount > 1 && maxLineHeight >= naturalLineHeight
      if linesCount == 1 || fixedLineBox {
        let baselineOffset = (text.attribute(.baselineOffset, at: 0, effectiveRange: nil) as? CGFloat) ?? 0
        // An inline box taller than the font raises the line's ascent; keep the box inside.
        // Measure the boxes' own runs: the line's ascent also grows with a line-height
        // taller than the font (minimumLineHeight), and plain text must stay centred then.
        let line0 = unsafeBitCast(CFArrayGetValueAtIndex(linesCF, 0), to: CTLine.self)
        // A box on the baseline also reaches below it by its own baseline.
        var lineAscent: CGFloat = 0
        var lineDescent: CGFloat = 0
        for run in CTLineGetGlyphRuns(line0) as! [CTRun] {
          let runAttributes = CTRunGetAttributes(run) as NSDictionary
          guard runAttributes[kCTRunDelegateAttributeName as String] != nil else { continue }
          var runAscent: CGFloat = 0
          var runDescent: CGFloat = 0
          CTRunGetTypographicBounds(run, CFRangeMake(0, 0), &runAscent, &runDescent, nil)
          lineAscent = max(lineAscent, runAscent)
          lineDescent = max(lineDescent, runDescent)
        }
        let fontDescent = naturalLineHeight - fontAscent
        // Grown lines already make room for their boxes.
        let boxRaised = grownExtents == nil && (lineAscent > fontAscent + 0.5 || lineDescent > fontDescent + 0.5)
        var lineBounds = drawBounds
        if fixedLineBox { lineBounds.size.height = maxLineHeight }
        let baselineFromTop = singleLineBaselineFromTop(ascent: boxRaised ? max(lineAscent, fontAscent) : fontAscent, descent: boxRaised ? max(lineDescent, fontDescent) : fontDescent, capHeight: boxRaised ? 0 : CTFontGetCapHeight(font), baselineOffset: baselineOffset, in: lineBounds)
        textBaseY = bounds.height - origins[0].y - baselineFromTop
      } else if maxLineHeight > 0 && maxLineHeight < naturalLineHeight {
        textBaseY = bounds.height - drawBounds.origin.y - fontAscent - origins[0].y
      }
    }

    return LineLayout(lines: linesCF, origins: origins, count: linesCount, clampedLast: clampedLast,
                      drawBounds: drawBounds, layoutBounds: layoutBounds, path: path, textBaseY: textBaseY,
                      grownExtents: grownExtents)
  }

  internal func drawMultiLine(text: NSAttributedString, in context: CGContext, bounds: CGRect) {
    guard let layout = layOutLines(text, bounds: bounds) else { return }
    let drawBounds = layout.drawBounds
    let layoutBounds = layout.layoutBounds
    let linesCount = layout.count
    let textBaseY = layout.textBaseY
    var origins = layout.origins
    let grownExtents = layout.grownExtents
    func lineAt(_ i: Int) -> CTLine { layout.line(i) }

    #if DEBUG_EXCLUSION_PATH
    do {
      context.saveGState()
      context.translateBy(x: layoutBounds.origin.x, y: layoutBounds.origin.y)
      context.setAlpha(0.35)
      context.setFillColor(UIColor.systemPurple.withAlphaComponent(0.2).cgColor)
      context.setStrokeColor(UIColor.red.cgColor)
      context.setLineWidth(1.5)
      context.addPath(layout.path)
      context.drawPath(using: .eoFillStroke)
      context.restoreGState()
    }
    #endif

    context.saveGState()
    context.clip(to: bounds)

    // vertical-lr: glyphs still turn clockwise but lines stack from the left, so mirror
    // each line's block position within the content box (CoreText y-up).
    if verticalWritingMode == 2 {
      let blockLow = bounds.height - drawBounds.maxY
      let blockHigh = bounds.height - drawBounds.minY
      for i in 0..<linesCount {
        let line = lineAt(i)
        var ascent: CGFloat = 0
        var descent: CGFloat = 0
        CTLineGetTypographicBounds(line, &ascent, &descent, nil)
        if let grown = grownExtents {
          ascent = grown.above[i]
          descent = grown.below[i]
        }
        let y = origins[i].y + textBaseY
        origins[i].y = blockLow + blockHigh - y - ascent + descent - textBaseY
      }
    }

    for i in 0..<linesCount {
      let line = lineAt(i)
      drawInlineBackgrounds(for: line, at: CGPoint(x: layoutBounds.origin.x + origins[i].x, y: origins[i].y + textBaseY), in: context)
    }

    // Draw text shadows if any
    if !style.textShadows.isEmpty {
      for shadow in style.textShadows {
        for i in 0..<linesCount {
          let line = lineAt(i)
          let lineOrigin = origins[i]
          // The frame was laid out with `paragraphStyle.alignment` already set
          // (getDefaultAttributes), so CoreText has already centered/right-aligned
          // this line's origin within the frame's full column width - adding a
          // second manual offset here double-applies the alignment.
          let textPos = CGPoint(x: layoutBounds.origin.x + lineOrigin.x, y: lineOrigin.y + textBaseY)
          context.saveGState()
          context.setShadow(offset: CGSize(width: shadow.offsetX, height: -shadow.offsetY), blur: shadow.blurRadius, color: shadow.color.cgColor)
          
          context.textPosition = textPos
          let runsCF = CTLineGetGlyphRuns(line)
          let runCount = CFArrayGetCount(runsCF)
          for j in 0..<runCount {
            let run = unsafeBitCast(CFArrayGetValueAtIndex(runsCF, j), to: CTRun.self)
            let attributes = CTRunGetAttributes(run) as NSDictionary
            if attributes[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
            // Skip BR spans - they cause line breaks but shouldn't render a visible glyph
            if attributes[NSAttributedString.Key("BrSpan")] != nil { continue }
            if attributes[Constants.UPRIGHT_GLYPH_KEY] != nil {
              drawUprightRun(run, attributes: attributes, at: textPos, in: context)
              continue
            }
            withGlyphShift(attributes, context) { CTRunDraw(run, context, CFRange(location: 0, length: 0)) }
          }
          context.restoreGState()
        }
      }
    }

    // Draw main text (no shadow)
    for i in 0..<linesCount {
      let line = lineAt(i)
      let lineOrigin = origins[i]
      // Same double-alignment pitfall as the shadow pass above - `lineOrigin.x`
      // already reflects the paragraph style's alignment.
      context.textPosition = CGPoint(x: layoutBounds.origin.x + lineOrigin.x, y: lineOrigin.y + textBaseY)
      drawnLines.append((line, context.textPosition))
      let runsCF = CTLineGetGlyphRuns(line)
      let runCount = CFArrayGetCount(runsCF)
      for j in 0..<runCount {
        let run = unsafeBitCast(CFArrayGetValueAtIndex(runsCF, j), to: CTRun.self)
        let attributes = CTRunGetAttributes(run) as NSDictionary
        if attributes[Constants.VIEW_PLACEHOLDER_KEY] != nil { continue }
        // Skip BR spans - they cause line breaks but shouldn't render a visible glyph
        if attributes[NSAttributedString.Key("BrSpan")] != nil { continue }
        if attributes[Constants.UPRIGHT_GLYPH_KEY] != nil {
          drawUprightRun(run, attributes: attributes, at: context.textPosition, in: context)
          continue
        }
        withGlyphShift(attributes, context) {
          if let ctFont = attributes[NSAttributedString.Key.font], CFGetTypeID(ctFont as CFTypeRef) == CTFontGetTypeID() {
            let font = ctFont as! CTFont
            let symbolicTraits = CTFontGetSymbolicTraits(font)
            let isBold = symbolicTraits.contains(.traitBold)
            // The font's traits are only read when the run carries no weight.
            let weight = attributes[NSAttributedString.Key(Constants.FONT_WEIGHT)] as? CGFloat
              ?? (CTFontCopyTraits(font) as? [CFString: Any])?[kCTFontWeightTrait as CFString] as? CGFloat ?? 0
            // Fake-bold only when a bold weight is requested but no real bold face
            // exists. `weight` is the CSS weight (100–900), so threshold is 600.
            if !isBold && weight >= 600 {
              drawRunWithFakeBold(run, in: context, at: CGPoint(x: layoutBounds.origin.x + lineOrigin.x, y: lineOrigin.y + textBaseY))
            } else {
              CTRunDraw(run, context, CFRange(location: 0, length: 0))
            }
          } else {
            CTRunDraw(run, context, CFRange(location: 0, length: 0))
          }
        }
      }

      // Draw text decorations (underline, strikethrough) for this line
      drawTextDecorations(for: line, at: CGPoint(x: layoutBounds.origin.x + lineOrigin.x, y: lineOrigin.y + textBaseY), in: context)
    }

    context.restoreGState()

    guard text.containsAttachments else { return }

    for i in 0..<linesCount {
      let line = lineAt(i)
      // Where the line's text was drawn, padding offset included.
      let lineOrigin = CGPoint(x: layoutBounds.origin.x + origins[i].x, y: origins[i].y + textBaseY)
      drawInlineAttachments(for: line, origin: lineOrigin, frameBounds: layoutBounds, clipRect: drawBounds, in: context, bounds: bounds)
    }
  }
  
  
  private static func visibleWidth(_ line: CTLine) -> CGFloat {
    return CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) - CGFloat(CTLineGetTrailingWhitespaceWidth(line))
  }

  /// How far into its free space alignment puts `line`: 0 at the left, 0.5 centred, 1 right.
  private func flushFactor(_ text: NSAttributedString, _ line: CTLine) -> CGFloat {
    let start = CTLineGetStringRange(line).location
    let paragraph = start < text.length ? text.attribute(.paragraphStyle, at: start, effectiveRange: nil) as? NSParagraphStyle : nil
    switch paragraph?.alignment ?? .natural {
    case .center: return 0.5
    case .right: return 1
    case .left: return 0
    default: return style.direction == .RTL ? 1 : 0
    }
  }

  /// The last line line-clamp shows: `line`'s own text and an ellipsis, cut back to fit
  /// `width` when they don't.
  private func clampedLine(_ text: NSAttributedString, from line: CTLine, width: CGFloat) -> CTLine {
    let range = CTLineGetStringRange(line)
    let string = text.string as NSString
    var end = min(range.location + range.length, text.length)
    while end > range.location {
      let c = string.character(at: end - 1)
      guard c == 0x20 || c == 0x0A || c == 0x09 || c == 0x200B else { break }
      end -= 1
    }
    let content = NSMutableAttributedString(attributedString: text.attributedSubstring(from: NSRange(location: range.location, length: end - range.location)))
    var attrs = content.length > 0 ? content.attributes(at: content.length - 1, effectiveRange: nil) : node.getDefaultAttributes()
    for key in [kCTRunDelegateAttributeName as NSAttributedString.Key, Constants.VIEW_PLACEHOLDER_KEY, NSAttributedString.Key("ViewID"), NSAttributedString.Key("BrSpan"), .attachment] {
      attrs.removeValue(forKey: key)
    }
    let ellipsis = NSAttributedString(string: "\u{2026}", attributes: attrs)
    content.append(ellipsis)
    let full = CTLineCreateWithAttributedString(content)
    return CTLineCreateTruncatedLine(full, Double(max(width, 0)), .end, CTLineCreateWithAttributedString(ellipsis)) ?? full
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
      let glyphRaise = (node.getDefaultAttributes()[.baselineOffset] as? CGFloat) ?? 0
      
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
        
        // Along the line, then across it: vertical text runs its lines down the page.
        let vertical = verticalWritingMode != 0
        let size = inlineBoxSize(helper.node)
        let childWidth = vertical ? size.height : size.width
        let childHeight = vertical ? size.width : size.height
        
        // Context is already in CoreText coordinates (flipped in drawText/drawMultiLine)
        // So use CoreText coordinates directly
        let ctX = origin.x + runPosition.x
        // Baseline minus descent = bottom of the box. The text's glyphs are raised to centre
        // them in their line box (getDefaultAttributes), so the box is too.
        let ctY = origin.y + glyphRaise - descent
        
        let drawRect = CGRect(x: ctX, y: ctY, width: childWidth, height: childHeight)
        
        // The box is a real subview; record where the text left room for it.
        guard helper.view != nil else { continue }
        drawnBoxes.append((drawRect, InlineNodeRef(helper.node)))
      }
    }

  /// Where the last draw left room for [node]'s box, in the view's coordinates.
  internal func drawnBoxFrame(for node: MasonNode) -> CGRect? {
    guard let box = drawnBoxes.first(where: { $0.node.node === node }) else { return nil }
    return box.rect.applying(drawnTransform)
  }

  /// The views of the inline boxes in the current text.
  internal func inlineBoxViews() -> [UIView] {
    let text = buildAttributedString(forMeasurement: false)
    var views: [UIView] = []
    text.enumerateAttribute(Constants.VIEW_PLACEHOLDER_KEY, in: NSRange(location: 0, length: text.length)) { value, _, _ in
      if let view = (value as? ViewHelper)?.view { views.append(view) }
    }
    return views
  }
  
  
  /// writing-mode: 1 for vertical-rl, 2 for vertical-lr, 0 for horizontal text.
  internal var verticalWritingMode: UInt8 {
    let mode = style.resolvedWritingMode
    return mode == 1 || mode == 2 ? mode : 0
  }

  /// Padding in the text's own frame. Vertical text is drawn turned clockwise, so its
  /// line-start side is the physical top and its first-line side the physical right.
  private func textFramePadding() -> UIEdgeInsets? {
    let computedPadding = node.computedLayout.padding
    if computedPadding.isEmpty() { return nil }
    let scale = NSCMason.scale
    let top = CGFloat(computedPadding.top / scale)
    let left = CGFloat(computedPadding.left / scale)
    let bottom = CGFloat(computedPadding.bottom / scale)
    let right = CGFloat(computedPadding.right / scale)
    if verticalWritingMode != 0 {
      return UIEdgeInsets(top: right, left: top, bottom: left, right: bottom)
    }
    return UIEdgeInsets(top: top, left: left, bottom: bottom, right: right)
  }

  /// How far the glyph ink of wrapping text overflows its box when its line-height is tighter
  /// than the font's ascent plus descent: the first line's ascent and the last line's descent
  /// stick out by half of it each, as CSS's negative half-leading puts them.
  func inkOverflow() -> CGFloat {
    let text = buildAttributedString(forMeasurement: false)
    guard text.length > 0, !drawsSingleLine(text),
      let paragraph = text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle,
      paragraph.maximumLineHeight > 0,
      let fv = node.getDefaultAttributes()[.font], CFGetTypeID(fv as CFTypeRef) == CTFontGetTypeID()
    else { return 0 }
    let font = fv as! CTFont
    return max(0, CTFontGetAscent(font) + CTFontGetDescent(font) - paragraph.maximumLineHeight)
  }

  func drawText(context: CGContext, rect: CGRect){
    // When this TextContainer is flattened into a parent TextContainer, the parent's
    // text layer renders our content. Drawing here would produce duplicate text.
    if let parentNode = node.layoutParent, let parentContainer = MasonViewKind.textContainer(parentNode.view),
       parentContainer.engine.shouldFlattenTextContainer(container) {
      drawnLines.removeAll()
      drawState = .idle
      return
    }
    drawState = .drawing
    // Build attributed string for drawing (uses cache if valid)
    let text = buildAttributedString(forMeasurement: false)
    drawnLines.removeAll(keepingCapacity: true)
    drawnBoxes.removeAll(keepingCapacity: true)
    accessibilityElementsCache = nil
    context.saveGState()
    context.textMatrix = .identity
    // A rect away from the origin (the ink layer's, larger than the box) draws from its corner.
    let origin = CGAffineTransform(translationX: rect.minX, y: rect.minY)
    context.translateBy(x: rect.minX, y: rect.minY)
    var rect = CGRect(origin: .zero, size: rect.size)
    if verticalWritingMode != 0 {
      // Lines run down the box and stack from the right, glyphs turned clockwise:
      // CoreText's (x, y) lands at (y, x). vertical-lr mirrors its lines in drawMultiLine.
      let turn = CGAffineTransform(a: 0, b: 1, c: 1, d: 0, tx: 0, ty: 0)
      drawnTransform = turn.concatenating(origin)
      context.concatenate(turn)
      rect = CGRect(x: 0, y: 0, width: rect.height, height: rect.width)
    } else {
      drawnTransform = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: rect.height).concatenating(origin)
      context.translateBy(x: 0, y: rect.height)
      context.scaleBy(x: 1.0, y: -1.0)
    }

    if drawsSingleLine(text) {
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
  
  
  /// Collapses each run of spaces and tabs to one space, which keeps the attributes of the
  /// run's first character, so inner ranges (bold, links, inline boxes) survive.
  static func collapsingWhitespace(_ text: NSAttributedString) -> NSMutableAttributedString {
    let result = NSMutableAttributedString(attributedString: text)
    // Only a tab or two spaces in a row change anything; most text has neither.
    var prevSpace = false
    var collapsible = false
    for unit in text.string.utf16 {
      if unit == 0x09 || (unit == 0x20 && prevSpace) {
        collapsible = true
        break
      }
      prevSpace = unit == 0x20
    }
    guard collapsible, let rx = horizontalWsRegex else { return result }
    let matches = rx.matches(in: text.string, options: [], range: NSRange(location: 0, length: result.length))
    let ns = text.string as NSString
    for match in matches.reversed() where !(match.range.length == 1 && ns.character(at: match.range.location) == 0x20) {
      result.replaceCharacters(in: match.range, with: " ")
    }
    return result
  }

  /// White space HTML may collapse: spaces, tabs and line breaks. A no-break space (U+00A0) and the
  /// other Unicode spaces are content, so they are never trimmed or merged.
  static let collapsibleWhitespace = CharacterSet(charactersIn: " \t\n\r\u{000C}")

  /// Whether this element's text starts / ends with collapsible white space, looking through
  /// flattened inline children; nil when there is no text at that edge.
  ///
  /// A flattened element's own build trims its edges as if it were a whole block, so
  /// `<span>a</span><span> b</span>` would read "ab". The parent puts one space back at an edge
  /// that had one, and its separator logic then keeps exactly one at the boundary, as browsers do.
  private func edgeWhitespace(atStart: Bool) -> Bool? {
    for child in (atStart ? node.children : node.children.reversed()) {
      if child.view is MasonBr.FakeView { return false }
      if let textNode = child as? MasonTextNode {
        let text = textNode.attributed().string
        guard let scalar = atStart ? text.unicodeScalars.first : text.unicodeScalars.last else { continue }
        return TextEngine.collapsibleWhitespace.contains(scalar)
      }
      if child.style.isValueInitialized && child.style.display == .None { continue }
      if let textView = MasonViewKind.textContainer(child.view), shouldFlattenTextContainer(textView) {
        if let edge = textView.engine.edgeWhitespace(atStart: atStart) { return edge }
        continue
      }
      // An inline box or other placeholder.
      return false
    }
    return nil
  }

  /// Whether the text has an explicit line break (from <br>); NSString's search
  /// avoids walking the whole string as Swift Characters.
  static func hasLineBreak(_ text: NSAttributedString) -> Bool {
    return (text.string as NSString).range(of: "\n").location != NSNotFound
  }

  /// `nested` builds a flattened child's piece for its parent's text, without the upright
  /// glyphs of vertical text: the parent marks the whole text once.
  internal func buildAttributedString(forMeasurement: Bool = false, nested: Bool = false) -> NSAttributedString {
    // Return cached version if valid
    if let cached = cachedAttributedString, attributedStringVersion == segmentsInvalidateVersion {
      return nested ? (cachedPlainAttributedString ?? cached) : cached
    }
    
    if isBuilding {
        // Never return empty — return last known good value
        return (nested ? cachedPlainAttributedString : nil) ?? cachedAttributedString ?? NSMutableAttributedString()
    }
    
    isBuilding = true
    defer { isBuilding = false }
    
    // build `composed` from child fragments using HTML-like whitespace collapsing
    // Only collapse horizontal whitespace (spaces, tabs) - preserve line breaks
    let wsSet = TextEngine.collapsibleWhitespace
    // pre, pre-wrap and break-spaces keep every space; only their wrapping differs. white-space
    // inherits, so a span with no value of its own follows its <p>.
    let whiteSpace = node.style.resolvedWhiteSpace
    let preservesSpaces = whiteSpace == .Pre || whiteSpace == .PreWrap || whiteSpace == .BreakSpaces

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
      } else if child.style.isValueInitialized && child.style.display == .None {
        fragment = nil
      } else if let textView = MasonViewKind.textContainer(child.view) {
        if shouldFlattenTextContainer(textView) {
          let piece = NSMutableAttributedString(attributedString: TextEngine.withInlineBackground(textView.engine.buildAttributedString(forMeasurement: forMeasurement, nested: true), textView.node.style.resolvedBackgroundColor))
          if piece.length > 0 {
            let text = piece.string as NSString
            if textView.engine.edgeWhitespace(atStart: true) == true,
               let first = UnicodeScalar(text.character(at: 0)), !wsSet.contains(first) {
              piece.insert(NSAttributedString(string: " ", attributes: piece.attributes(at: 0, effectiveRange: nil)), at: 0)
            }
            let last = piece.length - 1
            if textView.engine.edgeWhitespace(atStart: false) == true,
               let end = UnicodeScalar((piece.string as NSString).character(at: last)), !wsSet.contains(end) {
              piece.append(NSAttributedString(string: " ", attributes: piece.attributes(at: last, effectiveRange: nil)))
            }
          }
          // Nested elements marked their own ranges first, so the innermost wins.
          let ref = InlineNodeRef(child)
          piece.enumerateAttribute(TextEngine.inlineNodeKey, in: NSRange(location: 0, length: piece.length)) { value, range, _ in
            if value == nil { piece.addAttribute(TextEngine.inlineNodeKey, value: ref, range: range) }
          }
          fragment = piece
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

      // If white-space preserves spaces, keep the fragment exactly
      if preservesSpaces {
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
            // The space keeps the attributes of the text before it, as a space between
            // two runs of text does; bare, it has no font, colour or paragraph style.
            var sepAttrs = node.getDefaultAttributes()
            if lastIndex >= 0 {
              let prev = composed.attributes(at: lastIndex, effectiveRange: nil)
              if prev[NSAttributedString.Key("BrSpan")] == nil {
                sepAttrs = prev
              }
            }
            if sepAttrs[.font] == nil { sepAttrs[.font] = node.getDefaultAttributes()[.font] }
            if sepAttrs[.paragraphStyle] == nil { sepAttrs[.paragraphStyle] = node.getDefaultAttributes()[.paragraphStyle] }
            composed.append(NSAttributedString(string: " ", attributes: sepAttrs))
          }
        }
        composed.append(frag)
        prevEndedWithWhitespace = false
        continue
      }

      // For normal text fragment: collapse internal whitespace, keeping the
      // attributes of a flattened element's inner ranges.
      let raw = frag.string
      let collapsedFrag = TextEngine.collapsingWhitespace(frag)
      let collapsed = collapsedFrag.string

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
      let middle = collapsedFrag
      if startsWithSpace && middle.length > 0 { middle.deleteCharacters(in: NSRange(location: 0, length: 1)) }
      if endsWithSpace && middle.length > 0 { middle.deleteCharacters(in: NSRange(location: middle.length - 1, length: 1)) }

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
          // The space keeps the attributes of the text it came from, so a span's
          // background or decoration doesn't extend over the preceding space.
          var sepAttrs = attrs
          if prevEndedWithWhitespace && !startsWithSpace && lastIndex >= 0 {
            let prev = composed.attributes(at: lastIndex, effectiveRange: nil)
            if prev[Constants.VIEW_PLACEHOLDER_KEY] == nil && prev[.attachment] == nil && prev[NSAttributedString.Key("BrSpan")] == nil {
              sepAttrs = prev
            }
          }
          if sepAttrs[.font] == nil { sepAttrs[.font] = node.getDefaultAttributes()[.font] }
          if sepAttrs[.paragraphStyle] == nil { sepAttrs[.paragraphStyle] = node.getDefaultAttributes()[.paragraphStyle] }
          composed.append(NSAttributedString(string: " ", attributes: sepAttrs))
        }
      }

      // append the trimmed/collapsed middle text with its own attributes
      if middle.length > 0 {
        composed.append(middle)
      }

      // update prevEndedWithWhitespace to endsWithSpace
      prevEndedWithWhitespace = endsWithSpace
    }

    // After all fragments, trim single trailing space (HTML collapses trailing block-end whitespace)
    if composed.length > 0 && !preservesSpaces {
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

    // `none` never breaks at a soft hyphen; `auto` adds the dictionary's break points.
    switch style.resolvedHyphens {
    case 1: TextEngine.joinSoftHyphens(composed)
    case 2: TextEngine.insertHyphenationPoints(composed)
    default: break
    }

    // An inside list marker leads the item's text, so wrapped lines run under it.
    insideMarker = (node.view as? MasonText).map { MasonUIView.insideMarker(for: $0) } ?? ""
    if !insideMarker.isEmpty {
      var attrs = node.getDefaultAttributes()
      for key: NSAttributedString.Key in [.backgroundColor, .underlineStyle, .strikethroughStyle, Constants.DECORATION_KEY] {
        attrs.removeValue(forKey: key)
      }
      composed.insert(NSAttributedString(string: insideMarker, attributes: attrs), at: 0)
    }

    TextEngine.applyWordSpacing(composed)

    // The paragraph's line box raises its glyphs to centre them (getDefaultAttributes). Runs
    // merged in from inline elements sit on the same lines, so they get the same raise.
    if let raise = node.getDefaultAttributes()[.baselineOffset] as? CGFloat, raise != 0, composed.length > 0 {
      let whole = NSRange(location: 0, length: composed.length)
      composed.enumerateAttributes(in: whole) { attrs, range, _ in
        if attrs[.baselineOffset] == nil && attrs[Constants.VIEW_PLACEHOLDER_KEY] == nil {
          composed.addAttribute(.baselineOffset, value: raise, range: range)
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
    let trimmed = TextEngine.applySpacingTrim(result, vertical: verticalWritingMode != 0)
    let oriented = verticalWritingMode != 0
      ? TextEngine.applyUprightGlyphs(trimmed, orientation: style.resolvedTextOrientation) : trimmed
    hasUprightGlyphs = oriented !== result
    cachedPlainAttributedString = result
    cachedAttributedString = oriented
    attributedStringVersion = segmentsInvalidateVersion
    return nested ? result : oriented
  }
  
  
  
  
  /// Collect inline segments and push to Rust
  /// This is called during measure to provide segments before Rust's inline layout runs
  /// `lines` are the frame's lines, of which the first `shown` are laid out (line-clamp).
  private func collectAndCacheSegments(from lines: [CTLine], _ shown: Int, _ constraints: CGSize) {
    // Nothing relevant changed since the segments already sent for this
    // exact (content, constraint) pair — skip the frame/line walk + FFI push.
    if lastSegmentsVersion == segmentsInvalidateVersion && lastSegmentsConstraintSize == constraints {
      return
    }

    guard shown > 0 else {
      lastBuiltSegments = []
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
    // A fixed line-height is the text's line box, not its font's ascent and descent: send what
    // a line without boxes reaches, so Mason stacks the lines as CoreText does.
    var lineBox: (ascent: CGFloat, descent: CGFloat)?
    if let text = cachedAttributedString, text.length > 0,
      let paragraph = text.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle,
      paragraph.maximumLineHeight > 0, paragraph.minimumLineHeight == paragraph.maximumLineHeight,
      let plain = lines.prefix(shown).first(where: { line in
        !(CTLineGetGlyphRuns(line) as? [CTRun] ?? []).contains {
          (CTRunGetAttributes($0) as NSDictionary)[kCTRunDelegateAttributeName as String] != nil
        }
      })
    {
      var ascent: CGFloat = 0
      var descent: CGFloat = 0
      CTLineGetTypographicBounds(plain, &ascent, &descent, nil)
      lineBox = (ascent, descent)
    }

    for line in lines.prefix(shown) {
      let runs = CTLineGetGlyphRuns(line) as? [CTRun] ?? []
      
      for (_, run) in runs.enumerated() {
        var ascent: CGFloat = 0
        var descent: CGFloat = 0
        let width = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, &descent, nil))
        
        
        let attrs = CTRunGetAttributes(run) as NSDictionary
        if let lineBox, attrs[kCTRunDelegateAttributeName as String] == nil {
          (ascent, descent) = lineBox
        }
        
        // Check if this is an inline child placeholder
        if let helper = attrs[Constants.VIEW_PLACEHOLDER_KEY] as? ViewHelper {
          if let childPtr = helper.node.nativePtr {
            let childHeight = max(inlineBoxSize(helper.node).height, ascent + descent)
            let baselineFromBottom = helper.node.style.verticalAlign.align == .Baseline
              ? descent
              : Self.inlineChildBaselineFromBottom(
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
    
  
    
    lastBuiltSegments = segments.contains { $0.tag == InlineChild } ? nil : segments
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

/// Measured sizes and inline segments shared by every text view, keyed by the
/// attributed string and the constraints. Main thread only, like measure.
final class TextLayoutCache {
  static let shared = TextLayoutCache()
  private static let capacity = 2048

  struct Key: Hashable {
    let textHash: Int
    let fontHash: Int
    let knownW: Float, knownH: Float, availW: Float, availH: Float
    let flags: UInt8
    let whiteSpace: Int8
    // Not in the attributed string: text-indent (at the available width) and line-clamp.
    let indent: Float
    let lineClamp: Int32
  }

  struct Entry {
    let text: NSAttributedString
    var font: AnyObject? = nil
    let size: CGSize
    let segments: [CMasonSegment]
    let constraint: CGSize
  }

  private var entries: [Key: Entry] = [:]

  static func key(for engine: TextEngine, text: NSAttributedString, isInLine: Bool, isBlock: Bool, known: CGSize?, available: CGSize) -> Key? {
    if text.length == 0 || text.containsAttachments { return nil }
    let node = engine.node
    // Floats beside the text reshape its lines.
    if !NativeHelpers.nativeNodeGetFloatRectsWithNodes(node.mason, node.parent ?? node).isEmpty { return nil }
    let style = node.style
    var flags: UInt8 = isInLine ? 1 : 0
    if isBlock { flags |= 2 }
    if style.isValueInitialized {
      flags |= 4
      if style.resolvedTextWrap == .NoWrap { flags |= 8 }
    }
    let font = node.getDefaultAttributes()[.font].map { CFHash($0 as CFTypeRef) } ?? 0
    return Key(
      textHash: text.hash ^ text.length,
      fontHash: Int(bitPattern: UInt(font)),
      knownW: Float(known?.width ?? -.infinity), knownH: Float(known?.height ?? -.infinity),
      availW: Float(available.width), availH: Float(available.height),
      flags: flags,
      whiteSpace: style.isValueInitialized ? style.resolvedWhiteSpace.rawValue : -1,
      indent: Float(engine.textIndent(basis: available.width.isFinite && available.width > 0 ? available.width / CGFloat(NSCMason.scale) : 0)),
      lineClamp: Int32(engine.lineClamp)
    )
  }

  func lookup(_ key: Key, text: NSAttributedString, font: AnyObject?) -> Entry? {
    guard let entry = entries[key], entry.text.isEqual(to: text) else { return nil }
    switch (entry.font, font) {
    case (nil, nil): return entry
    case let (a?, b?): return CFEqual(a as CFTypeRef, b as CFTypeRef) ? entry : nil
    default: return nil
    }
  }

  func store(_ key: Key, _ entry: Entry) {
    if entries.count >= TextLayoutCache.capacity { entries.removeAll(keepingCapacity: true) }
    entries[key] = entry
  }
}


/// An accessibility element for a piece of a text view: plain text, a link or an inline box.
final class InlineAccessibilityElement: UIAccessibilityElement {
  weak var node: MasonNode?

  override func accessibilityActivate() -> Bool {
    guard let node = node, let text = accessibilityContainer as? MasonText else { return false }
    let frame = accessibilityFrameInContainerSpace
    text.dispatchInlineClick(node, at: CGPoint(x: frame.midX, y: frame.midY))
    return true
  }
}

/// A weak reference to the element that produced a range of flattened text. Equal when it
/// names the same node, so rebuilt strings still match layout caches.
final class InlineNodeRef: NSObject {
  weak var node: MasonNode?

  init(_ node: MasonNode) {
    self.node = node
  }

  override func isEqual(_ object: Any?) -> Bool {
    guard let other = object as? InlineNodeRef else { return false }
    return other.node === node
  }

  override var hash: Int {
    node.map { ObjectIdentifier($0).hashValue } ?? 0
  }
}
