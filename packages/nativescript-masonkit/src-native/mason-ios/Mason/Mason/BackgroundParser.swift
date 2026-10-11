//
//  BackgroundParser.swift
//  Mason
//
//  Created by Osei Fortune on 20/11/2025.
//


import UIKit
import CoreGraphics

// MARK: - BackgroundClip
/// Box keywords shared by `background-clip` and `background-origin`.
enum BackgroundClip: String {
  case borderBox = "border-box"
  case paddingBox = "padding-box"
  case contentBox = "content-box"

  static func parse(_ value: String) -> BackgroundClip? {
    BackgroundClip(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
  }
}

typealias BackgroundOrigin = BackgroundClip

// MARK: - BackgroundAttachment
enum BackgroundAttachment: String {
  case scroll
  case fixed
  case local

  static func parse(_ value: String) -> BackgroundAttachment? {
    BackgroundAttachment(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
  }
}

// MARK: - BackgroundBlendMode
enum BackgroundBlendMode: String {
  case normal
  case multiply
  case screen
  case overlay
  case darken
  case lighten
  case colorDodge = "color-dodge"
  case colorBurn = "color-burn"
  case hardLight = "hard-light"
  case softLight = "soft-light"
  case difference
  case exclusion
  case hue
  case saturation
  case color
  case luminosity

  static func parse(_ value: String) -> BackgroundBlendMode? {
    BackgroundBlendMode(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
  }

  var cgBlendMode: CGBlendMode {
    switch self {
    case .normal: return .normal
    case .multiply: return .multiply
    case .screen: return .screen
    case .overlay: return .overlay
    case .darken: return .darken
    case .lighten: return .lighten
    case .colorDodge: return .colorDodge
    case .colorBurn: return .colorBurn
    case .hardLight: return .hardLight
    case .softLight: return .softLight
    case .difference: return .difference
    case .exclusion: return .exclusion
    case .hue: return .hue
    case .saturation: return .saturation
    case .color: return .color
    case .luminosity: return .luminosity
    }
  }
}

// MARK: - BackgroundRepeat
enum BackgroundRepeat: String {
  case repeatXY = "repeat"
  case repeatX = "repeat-x"
  case repeatY = "repeat-y"
  case noRepeat = "no-repeat"
}

// MARK: - Gradient
struct Gradient {
  let type: String       // "linear", "radial" or "conic"
  let direction: String? // "to bottom" or angle like "0deg"
  let stops: [String]    // color stops (unparsed strings)
  var interpolation: ColorInterpolation? = nil
  /// `repeating-*-gradient`: the stop list tiles along the gradient line.
  var repeating = false
}

// MARK: - Background position / size
/// One axis of `background-position`: a fraction of the free space plus a length.
/// `px` is a device px like every other parsed length on iOS; `resolve` and
/// `points` divide by NSCMason.scale because CoreGraphics draws in points.
struct BackgroundOffset: Equatable {
  var fraction: CGFloat = 0
  var px: CGFloat = 0

  var points: CGFloat { px / CGFloat(NSCMason.scale) }

  func resolve(area: CGFloat, drawSize: CGFloat) -> CGFloat {
    fraction * (area - drawSize) + points
  }

  func cssValue(horizontal: Bool = true) -> String {
    let cssPx = Int(points)
    let pct = Int(fraction * 100)
    if px == 0 { return "\(pct)%" }
    if fraction == 0 { return "\(cssPx)px" }
    if fraction == 1 { return "\(horizontal ? "right" : "bottom") \(-cssPx)px" }
    return "calc(\(pct)% + \(cssPx)px)"
  }
}

struct BackgroundPosition: Equatable {
  var x = BackgroundOffset()
  var y = BackgroundOffset()

  var cssValue: String { "\(x.cssValue(horizontal: true)) \(y.cssValue(horizontal: false))" }
}

/// `background-size` for one axis: nil = auto, a fraction of the area, or device px.
struct BackgroundSize: Equatable {
  var width: BackgroundOffset? = nil
  var height: BackgroundOffset? = nil
  var keyword: String? = nil

  var cssValue: String {
    keyword ?? "\(width?.cssValue() ?? "auto") \(height?.cssValue() ?? "auto")"
  }
}

// MARK: - Background Layer
class BackgroundLayer {
  var image: String? = nil
  var repeatType: BackgroundRepeat = .repeatXY
  var position: BackgroundPosition? = nil
  var size: BackgroundSize? = nil
  var gradient: Gradient? = nil
  var shader: CGGradient? = nil
  // remember dimensions used to create cached gradient
  var shaderWidth: CGFloat = -1
  var shaderHeight: CGFloat = -1
  /// The stops `shader` was built from; a conic gradient samples them itself.
  var shaderColors: [CGColor] = []
  var shaderLocations: [CGFloat] = []
  var bitmap: UIImage? = nil
  /// A `data:image/svg+xml` image, parsed once; `bitmap` is its raster at the drawn size.
  var svg: SvgDocument? = nil
  /// The SVG didn't parse; don't retry every frame.
  var svgFailed = false
  /// The `currentColor` (0 when unused) and point size `bitmap` was rasterized with.
  var svgColor: UInt32 = 0
  var svgRasterSize: CGSize = .zero
  var clip: BackgroundClip = .borderBox
  var origin: BackgroundOrigin = .paddingBox
  var attachment: BackgroundAttachment = .scroll
  var blendMode: BackgroundBlendMode = .normal
  /// A color token seen in the shorthand; the last layer's becomes `Background.color`.
  var backgroundColor: UIColor? = nil

  var isDefault: Bool {
    image == nil && gradient == nil && position == nil && size == nil &&
      repeatType == .repeatXY && clip == .borderBox && origin == .paddingBox &&
      attachment == .scroll && blendMode == .normal
  }
}

public class BackgroundCALayer: CALayer {
  weak var background: Background?{
    didSet {
      setNeedsDisplay()
    }
  }
  
  public override func draw(in ctx: CGContext) {
    super.draw(in: ctx)
    guard let renderer = background else { return }
    renderer.draw(on: self, in: ctx, rect: bounds)
  }
  
  
  public func invalidate() {
    setNeedsDisplay()
  }
  
  public override func layoutSublayers() {
    super.layoutSublayers()
    setNeedsDisplay()
  }
}

// MARK: - Background
class Background {
  var css: String = ""
  var color: UIColor? {
    set {
      guard let color = newValue else {
        style.prepareMut()
        style.setUInt32(StyleKeys.BACKGROUND_COLOR, 0)
        style.setUInt8(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.INHERIT)
        style.setUInt8(StyleKeys.BACKGROUND_COLOR_TYPE, StyleState.INHERIT)
        style.notifyTextStyleChanged(.backgroundColor)
        return
      }
      
      style.prepareMut()
      style.setUInt32(StyleKeys.BACKGROUND_COLOR, color.toUInt32())
      style.setUInt8(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
      style.setUInt8(StyleKeys.BACKGROUND_COLOR_TYPE, StyleState.SET)
      style.notifyTextStyleChanged(.backgroundColor)
    }
    get {
      let resolved = style.resolvedBackgroundColor
      if resolved == 0 {
        return nil
      }
      return UIColor.colorFromARGB(resolved)
    }
  }
  var layers: [BackgroundLayer] = []
  // Per-layer longhands in the order they were set. Layers come only from
  // images/gradients, so a longhand set before the layers is kept and
  // reapplied when they arrive. Core applies the `background` shorthand after
  // the longhands whatever their declaration order, so it reapplies them too.
  private var longhands: [(name: String, value: String)] = []
  unowned let style: MasonStyle
  init(style: MasonStyle) {
    self.style = style
  }
  
  
  public func reset(){
    let invalidate = color != nil || !layers.isEmpty
    color = nil
    layers.removeAll()
    longhands.removeAll()
    if(invalidate){
      style.node.view?.setNeedsDisplay()
    }
  }
  
  // MARK: - Parse Background
  public func parseBackground(_ css: String) {
    if css.isEmpty {
      self.css = css
      reset()
      return
    }
    let parsed = splitBackgroundLayers(css).map { parseLayer($0) }

    // The shorthand's color lives on its last layer; lift it off so the layer does not paint it too.
    // Only the final layer may carry a color; the others never paint one.
    let color = parsed.last?.backgroundColor
    for layer in parsed { layer.backgroundColor = nil }

    // `background: none` (or anything without a color) resets the color too.
    self.color = color
    self.layers = parsed.filter { !$0.isDefault }
    for (name, value) in longhands { applyLonghand(name, value) }
    self.css = css
    
    let newValue = color?.toUInt32() ?? 0
    // Ensure we prepare this style for mutation before writing low-level fields.
    style.prepareMut()
    style.setUInt32(StyleKeys.BACKGROUND_COLOR, newValue)
    style.setUInt8(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
    // change view as well ??
    // style.node.view?.backgroundColor = UIColor.colorFromARGB(newValue)
    
    invalidateView()
  }

  private func invalidateView() {
    if !style.inBatch {
      style.node.view?.setNeedsDisplay()
    }
  }

  private func setLonghand(_ name: String, _ value: String) {
    longhands.removeAll { $0.name == name }
    // `background-position` resets both axes set by the -x/-y longhands.
    if name == "background-position" {
      longhands.removeAll { $0.name == "background-position-x" || $0.name == "background-position-y" }
    }
    longhands.append((name, value))
    applyLonghand(name, value)
    invalidateView()
  }

  /// Apply a comma-separated per-layer list, repeating it cyclically as CSS does.
  private func applyLonghand(_ name: String, _ value: String) {
    let parts = splitBackgroundLayers(value).filter { !$0.isEmpty }
    if parts.isEmpty { return }
    for (idx, layer) in layers.enumerated() {
      let v = parts[idx % parts.count]
      switch name {
      case "background-repeat":
        layer.repeatType = parseRepeat(v)
      case "background-position":
        if let p = parsePosition(splitTopLevelWhitespace(v)) { layer.position = p }
      case "background-position-x":
        if let x = parseAxisPosition(splitTopLevelWhitespace(v), horizontal: true) {
          var p = layer.position ?? BackgroundPosition()
          p.x = x
          layer.position = p
        }
      case "background-position-y":
        if let y = parseAxisPosition(splitTopLevelWhitespace(v), horizontal: false) {
          var p = layer.position ?? BackgroundPosition()
          p.y = y
          layer.position = p
        }
      case "background-size":
        if let size = parseSize(v) { layer.size = size }
      case "background-clip":
        if let clip = BackgroundClip.parse(v) { layer.clip = clip }
      case "background-origin":
        if let origin = BackgroundOrigin.parse(v) { layer.origin = origin }
      case "background-attachment":
        if let attachment = BackgroundAttachment.parse(v) { layer.attachment = attachment }
      case "background-blend-mode":
        if let mode = BackgroundBlendMode.parse(v) { layer.blendMode = mode }
      default:
        break
      }
    }
  }

  private func applyBackgroundImage(_ value: String) {
    // Filtered: a stray color never creates a color-only layer.
    layers = parseBackgroundLayers(value)
    for (name, value) in longhands { applyLonghand(name, value) }
    invalidateView()
  }

  public func applyBackgroundProperty(name: String, value: String) {
    let key = name.lowercased().trimmingCharacters(in: .whitespaces)
    
    switch key {
      
    case "background":
      parseBackground(value)
      return
      
    case "background-color":
      if let c = parseColor(value) {
        self.color = c
        style.node.view?.setNeedsDisplay()
      }
      return
      
    case "background-image":
      applyBackgroundImage(value)
      return
      
    case "background-repeat":
      setLonghand(key, value)
      return
      
    case "background-position":
      setLonghand(key, value)
      return

    case "background-position-x":
      setLonghand(key, value)
      return

    case "background-position-y":
      setLonghand(key, value)
      return
      
    case "background-size":
      setLonghand(key, value)
      return
      
    case "background-clip":
      setLonghand(key, value)
      return

    case "background-origin":
      setLonghand(key, value)
      return

    case "background-attachment":
      setLonghand(key, value)
      return

    case "background-blend-mode":
      setLonghand(key, value)
      return
      
    default:
      return
    }
  }
}

// MARK: - Color Map
internal let colorMap: [String: UIColor] = [
  "crimson": UIColor(red: 220/255, green: 20/255, blue: 60/255, alpha: 1),
  "skyblue": UIColor(red: 135/255, green: 206/255, blue: 235/255, alpha: 1),
  "black": .black,
  "silver": UIColor(white: 0.75, alpha: 1),
  "gray": UIColor(red: 128/255, green: 128/255, blue: 128/255, alpha: 1),
  "grey": UIColor(red: 128/255, green: 128/255, blue: 128/255, alpha: 1),
  "white": .white,
  "maroon": UIColor(red: 0.5, green: 0, blue: 0, alpha: 1),
  "red": .red,
  "purple": UIColor(red: 0.5, green: 0, blue: 0.5, alpha: 1),
  "fuchsia": .magenta,
  "green": UIColor(red: 0, green: 128/255, blue: 0, alpha: 1),
  "lime": UIColor(red: 0, green: 1, blue: 0, alpha: 1),
  "olive": UIColor(red: 0.5, green: 0.5, blue: 0, alpha: 1),
  "yellow": .yellow,
  "navy": UIColor(red: 0, green: 0, blue: 0.5, alpha: 1),
  "blue": .blue,
  "teal": UIColor(red: 0, green: 0.5, blue: 0.5, alpha: 1),
  "aqua": .cyan,
  "orange": UIColor(red: 1, green: 165/255, blue: 0, alpha: 1),
  "brown": UIColor(red: 0.65, green: 0.16, blue: 0.16, alpha: 1),
  "pink": UIColor(red: 1, green: 192/255, blue: 203/255, alpha: 1),
  "transparent": .clear,
  "cyan": .cyan
]

// MARK: - Top-level splitters

/// Split background layers by top-level commas (commas not inside parentheses or
/// quotes: an unencoded SVG data URL can hold both).
func splitBackgroundLayers(_ input: String) -> [String] {
  var result: [String] = []
  var current = ""
  var depth = 0
  var quote: Character? = nil
  
  for ch in input {
    if let q = quote {
      if ch == q { quote = nil }
      current.append(ch)
      continue
    }
    if ch == "\"" || ch == "'" { quote = ch }
    else if ch == "(" { depth += 1 }
    else if ch == ")" { depth = max(0, depth - 1) }
    
    if ch == "," && depth == 0 {
      result.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
      current = ""
    } else {
      current.append(ch)
    }
  }
  
  if !current.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
    result.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
  }
  
  return result
}

/// Split gradient contents by top-level commas (safe for rgba(), functions, etc.)
func splitGradientParts(_ content: String) -> [String] {
  var parts: [String] = []
  var current = ""
  var depth = 0
  
  for ch in content {
    if ch == "(" { depth += 1 }
    else if ch == ")" { depth = max(0, depth - 1) }
    
    if ch == "," && depth == 0 {
      parts.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
      current = ""
    } else {
      current.append(ch)
    }
  }
  
  if !current.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
    parts.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
  }
  
  return parts
}


// MARK: - Parse Multiple Layers
/// Layers of a `background`/`background-image` list, minus empty/default ones
/// (a bare color like "#fff" lives on `Background.color`, not a layer).
func parseBackgroundLayers(_ css: String) -> [BackgroundLayer] {
  splitBackgroundLayers(css).map { parseLayer($0) }.filter { !$0.isDefault }
}

private let REPEAT_KEYS: Set<String> = ["repeat", "repeat-x", "repeat-y", "no-repeat"]
private let POSITION_KEYS: Set<String> = ["top", "bottom", "left", "right", "center"]
private let BOX_KEYWORDS: Set<String> = ["border-box", "padding-box", "content-box"]
private let ATTACHMENT_KEYWORDS: Set<String> = ["scroll", "fixed", "local"]

func parseRepeat(_ value: String) -> BackgroundRepeat {
  BackgroundRepeat(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()) ?? .noRepeat
}

/// Cut the first `linear-`/`radial-`/`conic-gradient(...)` (or its `repeating-` form) out of
/// `value`, balancing parentheses.
private func extractGradient(from value: String) -> (gradient: String, rest: String)? {
  let starts = ["linear-gradient(", "radial-gradient(", "conic-gradient("].compactMap { value.range(of: $0, options: .caseInsensitive)?.lowerBound }
  guard var start = starts.min() else { return nil }
  let prefix = "repeating-"
  if value.distance(from: value.startIndex, to: start) >= prefix.count {
    let prefixStart = value.index(start, offsetBy: -prefix.count)
    if value[prefixStart..<start].lowercased() == prefix { start = prefixStart }
  }
  var depth = 0
  var end = value.endIndex
  var i = start
  while i < value.endIndex {
    let ch = value[i]
    if ch == "(" {
      depth += 1
    } else if ch == ")" {
      depth -= 1
      if depth == 0 { end = value.index(after: i); break }
    }
    i = value.index(after: i)
  }
  let rest = String(value[..<start]) + " " + String(value[end...])
  return (String(value[start..<end]), rest.trimmingCharacters(in: .whitespacesAndNewlines))
}

// MARK: - Parse Single Layer
/// One comma-separated layer of the `background` shorthand: image, gradient,
/// repeat, attachment, position [/ size] and up to two box keywords (origin,
/// then clip). A color token is kept on `backgroundColor` for the final layer.
func parseLayer(_ str: String) -> BackgroundLayer {
  let layer = BackgroundLayer()
  var value = str.trimmingCharacters(in: .whitespacesAndNewlines)
  
  if value.hasSuffix(";") {
    value = String(value.dropLast()).trimmingCharacters(in: .whitespacesAndNewlines)
  }

  // Image URL first: its contents must not be tokenized.
  if let url = parseImage(value) {
    layer.image = url
    value = removeImageURL(from: value)
  }

  // Gradient: the function consumes its own parentheses, the rest are tokens.
  if let (gradientText, rest) = extractGradient(from: value) {
    layer.gradient = parseGradient(gradientText)
    value = rest
  }

  var boxes: [BackgroundClip] = []
  var positionTokens: [String] = []
  var sizeTokens: [String] = []
  var afterSlash = false
  for raw in splitTopLevelWhitespace(value) {
    let t = raw.lowercased()
    // A "/" inside parentheses belongs to a color function such as rgb(0 0 0 / 50%).
    let bareSlash = !t.contains("(")
    if bareSlash && t == "/" {
      afterSlash = true
    } else if bareSlash && t.hasPrefix("/") {
      afterSlash = true
      sizeTokens.append(String(t.dropFirst()))
    } else if bareSlash && t.hasSuffix("/") {
      positionTokens.append(String(t.dropLast()))
      afterSlash = true
    } else if bareSlash, let slash = t.firstIndex(of: "/") {
      positionTokens.append(String(t[..<slash]))
      sizeTokens.append(String(t[t.index(after: slash)...]))
      afterSlash = true
    } else if afterSlash && (t == "auto" || t == "cover" || t == "contain" || parseBackgroundLength(t) != nil) {
      sizeTokens.append(t)
    } else if REPEAT_KEYS.contains(t) {
      layer.repeatType = parseRepeat(t)
    } else if ATTACHMENT_KEYWORDS.contains(t), let attachment = BackgroundAttachment.parse(t) {
      layer.attachment = attachment
    } else if BOX_KEYWORDS.contains(t), let box = BackgroundClip.parse(t) {
      boxes.append(box)
    } else if POSITION_KEYS.contains(t) || parseBackgroundLength(t) != nil {
      afterSlash = false
      positionTokens.append(t)
    } else if let col = parseColor(raw) {
      layer.backgroundColor = col
    }
  }
  if !positionTokens.isEmpty { layer.position = parsePosition(positionTokens) }
  if !sizeTokens.isEmpty { layer.size = parseSize(sizeTokens.joined(separator: " ")) }
  if boxes.count == 1 {
    layer.origin = boxes[0]
    layer.clip = boxes[0]
  } else if boxes.count >= 2 {
    layer.origin = boxes[0]
    layer.clip = boxes[1]
  }
  
  return layer
}

// MARK: - Parse Position
/// One `<length>` or `<percentage>` of a background position/size, or nil. Lengths are device px.
func parseBackgroundLength(_ token: String) -> BackgroundOffset? {
  let t = token.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  if t.isEmpty { return nil }
  guard let lp = parseLengthPercentage(t) else { return nil }
  switch lp {
  case .Percent(let p): return BackgroundOffset(fraction: CGFloat(p), px: 0)
  case .Points(let p): return BackgroundOffset(fraction: 0, px: CGFloat(p))
  case .Zero: return BackgroundOffset()
  }
}

private func isHorizontalKeyword(_ t: String) -> Bool { t == "left" || t == "right" }
private func isVerticalKeyword(_ t: String) -> Bool { t == "top" || t == "bottom" }

private func keywordOffset(_ t: String) -> BackgroundOffset? {
  switch t {
  case "left", "top": return BackgroundOffset(fraction: 0, px: 0)
  case "center": return BackgroundOffset(fraction: 0.5, px: 0)
  case "right", "bottom": return BackgroundOffset(fraction: 1, px: 0)
  default: return nil
  }
}

/// `background-position-x`/`-y`: a keyword, a length, or `<edge> <offset>`.
func parseAxisPosition(_ parts: [String], horizontal: Bool) -> BackgroundOffset? {
  let tokens = parts.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.filter { !$0.isEmpty }
  guard let first = tokens.first else { return nil }
  let edgeOk = horizontal ? (isHorizontalKeyword(first) || first == "center") : (isVerticalKeyword(first) || first == "center")
  if tokens.count == 1 {
    return edgeOk ? keywordOffset(first) : parseBackgroundLength(first)
  }
  if tokens.count == 2 && edgeOk && first != "center" {
    guard let offset = parseBackgroundLength(tokens[1]), let edge = keywordOffset(first) else { return nil }
    // `right 10px` means 10px in from the right: a negative device offset.
    return edge.fraction == 1 ? BackgroundOffset(fraction: 1 - offset.fraction, px: -offset.px) : offset
  }
  return nil
}

/// CSS `background-position` with the 1-, 2-, 3- and 4-value syntaxes.
func parsePosition(_ parts: [String]) -> BackgroundPosition? {
  let tokens = parts.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.filter { !$0.isEmpty }
  if tokens.isEmpty || tokens.count > 4 { return nil }
  switch tokens.count {
  case 1:
    let t = tokens[0]
    if isVerticalKeyword(t), let y = keywordOffset(t) {
      return BackgroundPosition(x: BackgroundOffset(fraction: 0.5), y: y)
    }
    guard let x = keywordOffset(t) ?? parseBackgroundLength(t) else { return nil }
    return BackgroundPosition(x: x, y: BackgroundOffset(fraction: 0.5))
  case 2:
    var a = tokens[0]
    var b = tokens[1]
    // `top left` is legal: keywords may swap axes, lengths may not.
    if isVerticalKeyword(a) || isHorizontalKeyword(b) { swap(&a, &b) }
    let xKeyword = isVerticalKeyword(a) ? nil : keywordOffset(a)
    let yKeyword = isHorizontalKeyword(b) ? nil : keywordOffset(b)
    guard let x = xKeyword ?? parseBackgroundLength(a), let y = yKeyword ?? parseBackgroundLength(b) else { return nil }
    return BackgroundPosition(x: x, y: y)
  default:
    // 3/4-value: edge keywords each optionally followed by an offset.
    var x: BackgroundOffset? = nil
    var y: BackgroundOffset? = nil
    var i = 0
    while i < tokens.count {
      let kw = tokens[i]
      let next = i + 1 < tokens.count ? tokens[i + 1] : nil
      let pair = (next != nil && parseBackgroundLength(next!) != nil) ? [kw, next!] : [kw]
      if isHorizontalKeyword(kw) || (kw == "center" && x == nil && !isVerticalKeyword(next ?? "")) {
        guard let v = parseAxisPosition(pair, horizontal: true) else { return nil }
        x = v
      } else if isVerticalKeyword(kw) || kw == "center" {
        guard let v = parseAxisPosition(pair, horizontal: false) else { return nil }
        y = v
      } else {
        return nil
      }
      i += pair.count
    }
    return BackgroundPosition(x: x ?? BackgroundOffset(fraction: 0.5), y: y ?? BackgroundOffset(fraction: 0.5))
  }
}

// MARK: - Parse Size
func parseSize(_ value: String) -> BackgroundSize? {
  let s = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  switch s {
  case "cover", "contain":
    return BackgroundSize(keyword: s)
  case "auto", "auto auto":
    return BackgroundSize()
  default:
    let tokens = splitTopLevelWhitespace(s)
    if tokens.isEmpty || tokens.count > 2 { return nil }
    var w: BackgroundOffset? = nil
    if tokens[0] != "auto" {
      guard let v = parseBackgroundLength(tokens[0]) else { return nil }
      w = v
    }
    var h: BackgroundOffset? = nil
    if tokens.count > 1, tokens[1] != "auto" {
      guard let v = parseBackgroundLength(tokens[1]) else { return nil }
      h = v
    }
    return BackgroundSize(width: w, height: h)
  }
}

func extractGradientContent(_ str: String) -> (type: String, content: String)? {
  var lower = str.lowercased()
  if lower.hasPrefix("repeating-") { lower.removeFirst("repeating-".count) }
  if lower.hasPrefix("linear-gradient(") || lower.hasPrefix("radial-gradient(") || lower.hasPrefix("conic-gradient(") {
    let typeEnd = str.firstIndex(of: "(")!
    let type = String(str[..<typeEnd]).lowercased().replacingOccurrences(of: "-gradient", with: "")
    var depth = 0
    var content = ""
    var started = false
    
    for ch in str[typeEnd...] {
      if ch == "(" {
        depth += 1
        started = true
        if depth == 1 { continue } // skip outer (
      }
      if ch == ")" {
        depth -= 1
        if depth == 0 { break } // stop at matching outer )
      }
      if started {
        content.append(ch)
      }
    }
    
    return (type, content)
  }
  return nil
}

// MARK: - Parse Gradient (preserve full rgba/rgb)
func parseGradient(_ str: String) -> Gradient? {
  guard let (type, content) = extractGradientContent(str) else { return nil }
  
  var parts = splitGradientParts(content)
  
  var direction: String? = nil
  var interpolation: ColorInterpolation? = nil
  if let first = parts.first {
    var t = first.trimmingCharacters(in: .whitespacesAndNewlines)
    // `to right in oklab`: the method shares the first argument with the direction.
    let extracted = ColorInterpolation.extract(t)
    if let extracted = extracted {
      interpolation = extracted.method
      t = extracted.rest
    }
    if !t.isEmpty && isAngleOrDirection(t) {
      direction = t
    }
    if direction != nil || extracted != nil {
      parts = Array(parts.dropFirst())
    }
  }

  var stops = expandColorStops(parts.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) })
  var kind = type
  let repeating = kind.hasPrefix("repeating-")
  if repeating { kind.removeFirst("repeating-".count) }
  // Conic stops may be placed by angle; the stop parser reads fractions of a turn.
  if kind == "conic" { stops = stops.map(conicStopAsPercent) }
  return Gradient(type: kind, direction: direction, stops: stops, interpolation: interpolation, repeating: repeating)
}

/// `red 90deg` -> `red 25%`; anything else is returned unchanged.
private func conicStopAsPercent(_ stop: String) -> String {
  var parts = splitTopLevelWhitespace(stop)
  guard parts.count == 2, let turns = cssAngleInTurns(parts[1]) else { return stop }
  parts[1] = "\(turns * 100)%"
  return parts.joined(separator: " ")
}

/// A CSS `<angle>` as a fraction of a full turn, or nil when `token` is not one.
func cssAngleInTurns(_ token: String) -> Double? {
  let t = token.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  let units: [(String, Double)] = [("grad", 400), ("turn", 1), ("deg", 360), ("rad", 2 * Double.pi)]
  for (unit, perTurn) in units where t.hasSuffix(unit) {
    guard let v = Double(t.dropLast(unit.count)) else { return nil }
    return v / perTurn
  }
  return nil
}

/// A stop with two positions ("red 10% 30%") is two stops of the same colour.
func expandColorStops(_ stops: [String]) -> [String] {
  return stops.flatMap { stop -> [String] in
    let parts = splitTopLevelWhitespace(stop)
    return parts.count == 3 ? ["\(parts[0]) \(parts[1])", "\(parts[0]) \(parts[2])"] : [stop]
  }
}

// MARK: - Helper to detect if a token is an angle, direction, or radial shape/position
private func isAngleOrDirection(_ token: String) -> Bool {
  let v = token.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  
  // Check for angle: e.g., "180deg", "45deg"
  if v.hasSuffix("deg") || v.hasSuffix("rad") || v.hasSuffix("turn") || v.hasSuffix("grad") {
    return true
  }
  
  // conic-gradient's `from <angle>` / `at <position>`, and radial's bare `at <position>`.
  if v.hasPrefix("from ") || v.hasPrefix("at ") {
    return true
  }

  // Check for linear-gradient direction: "to bottom", "to top left", etc.
  if v.hasPrefix("to ") {
    let parts = v.dropFirst(3).split(separator: " ")
    let validDirections = Set(["top", "bottom", "left", "right"])
    return parts.allSatisfy { validDirections.contains(String($0)) }
  }
  
  // Check for radial-gradient shape/position: "ellipse at center", "circle at top left"
  if v.contains(" at ") {
    let beforeAt = v.components(separatedBy: " at ").first?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let shapeKeywords = Set(["circle", "ellipse"])
    let sizeKeywords = Set(["closest-side", "closest-corner", "farthest-side", "farthest-corner"])
    let parts = beforeAt.split(separator: " ").map { String($0) }
    if parts.isEmpty || parts.contains(where: { shapeKeywords.contains($0) || sizeKeywords.contains($0) }) {
      return true
    }
  }
  
  // Check for standalone shape keywords: "circle", "ellipse"
  if v == "circle" || v == "ellipse" {
    return true
  }
  
  return false
}

// MARK: - Parse Image URL
/// The first `url(...)` in `value`: its unquoted argument and the range of the whole call.
/// A quoted argument ends at its closing quote, so an unencoded SVG data URL may hold
/// parentheses, commas and the other quote; an unquoted one ends at the balancing `)`.
private func findImageURL(_ value: String) -> (url: String, range: Range<String.Index>)? {
  guard let open = value.range(of: "url(", options: .caseInsensitive) else { return nil }
  var i = open.upperBound
  while i < value.endIndex, value[i].isWhitespace { i = value.index(after: i) }
  guard i < value.endIndex else { return nil }
  if value[i] == "\"" || value[i] == "'" {
    let q = value[i]
    let start = value.index(after: i)
    guard let close = value[start...].firstIndex(of: q) else {
      // Unterminated: take the rest, minus a trailing `)`.
      var url = String(value[start...])
      if url.hasSuffix(")") { url.removeLast() }
      return (url, open.lowerBound..<value.endIndex)
    }
    var end = value.index(after: close)
    while end < value.endIndex, value[end].isWhitespace { end = value.index(after: end) }
    if end < value.endIndex, value[end] == ")" { end = value.index(after: end) }
    return (String(value[start..<close]), open.lowerBound..<end)
  }
  var depth = 1
  var j = i
  while j < value.endIndex {
    if value[j] == "(" { depth += 1 }
    else if value[j] == ")" {
      depth -= 1
      if depth == 0 { break }
    }
    j = value.index(after: j)
  }
  let url = String(value[i..<j]).trimmingCharacters(in: .whitespaces)
  let end = j < value.endIndex ? value.index(after: j) : j
  return (url, open.lowerBound..<end)
}

func parseImage(_ value: String) -> String? {
  findImageURL(value)?.url
}

func removeImageURL(from value: String) -> String {
  var result = value
  while let found = findImageURL(result) {
    result.replaceSubrange(found.range, with: " ")
  }
  return result.trimmingCharacters(in: .whitespacesAndNewlines)
}

// MARK: - Parse Color
func parseColor(_ value: String) -> UIColor? {
  let v = value.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: ";"))
  if v.isEmpty { return nil }
  if let mapped = colorMap[v.lowercased()] { return mapped }
  return UIColor(css: v)
}


extension UIColor {
  
  func toCSS(includeAlpha: Bool = false) -> String {
          var r: CGFloat = 0
          var g: CGFloat = 0
          var b: CGFloat = 0
          var a: CGFloat = 0

          self.getRed(&r, green: &g, blue: &b, alpha: &a)

          if includeAlpha {
              let rgba = (Int(r * 255) << 24) | (Int(g * 255) << 16) | (Int(b * 255) << 8) | Int(a * 255)
              return String(format: "#%08X", rgba)
          } else {
              let rgb = (Int(r * 255) << 16) | (Int(g * 255) << 8) | Int(b * 255)
              return String(format: "#%06X", rgb)
          }
      }

  convenience init?(css: String) {
    let value = css
      .trimmingCharacters(in: .whitespacesAndNewlines)
      .lowercased()
    
    // MARK: - Hex (#rgb, #rgba, #rrggbb, #rrggbbaa)
    if value.hasPrefix("#") {
      let hexString = String(value.dropFirst())
      var hexValue = hexString
      
      // Expand #rgb → #rrggbb
      if hexValue.count == 3 {
        hexValue = hexValue.map { "\($0)\($0)" }.joined()
      }
      // Expand #rgba → #rrggbbaa
      if hexValue.count == 4 {
        hexValue = hexValue.map { "\($0)\($0)" }.joined()
      }
      
      guard let hex = Int(hexValue, radix: 16) else { return nil }
      
      switch hexValue.count {
      case 6: // RRGGBB
        self.init(
          red:   CGFloat((hex >> 16) & 0xFF) / 255,
          green: CGFloat((hex >> 8)  & 0xFF) / 255,
          blue:  CGFloat(hex & 0xFF)         / 255,
          alpha: 1
        )
        return
        
      case 8: // RRGGBBAA
        self.init(
          red:   CGFloat((hex >> 24) & 0xFF) / 255,
          green: CGFloat((hex >> 16) & 0xFF) / 255,
          blue:  CGFloat((hex >> 8)  & 0xFF) / 255,
          alpha: CGFloat(hex & 0xFF)         / 255
        )
        return
        
      default:
        return nil
      }
    }
    
    // MARK: - rgb() / rgba()
    if value.hasPrefix("rgb") {
      // Remove "rgb(" or "rgba("
      guard let open = value.firstIndex(of: "("),
            let close = value.lastIndex(of: ")") else { return nil }
      
      let inside = value[value.index(after: open)..<close]
        .trimmingCharacters(in: .whitespaces)
      
      // CSS4 allows: "rgb(255 0 0)" or "rgb(255, 0, 0)"
      let parts = inside
        .replacingOccurrences(of: "/", with: " ") // rgb(0 0 0 / 0.5)
        .split(whereSeparator: { " ,".contains($0) })
        .map { $0.trimmingCharacters(in: .whitespaces) }
      
      if parts.count < 3 { return nil }
      
      func parseComponent(_ s: String) -> CGFloat? {
        if s.hasSuffix("%") {
          let p = CGFloat(Double(s.dropLast()) ?? 0)
          return max(0, min(1, p / 100))
        }
        if let v = Double(s) {
          return max(0, min(1, CGFloat(v / 255)))
        }
        return nil
      }
      
      let r = parseComponent(parts[0])
      let g = parseComponent(parts[1])
      let b = parseComponent(parts[2])
      
      let a: CGFloat
      if parts.count >= 4 {
        if parts[3].hasSuffix("%") {
          a = CGFloat(Double(parts[3].dropLast()) ?? 100) / 100
        } else {
          a = CGFloat(Double(parts[3]) ?? 1)
        }
      } else {
        a = 1
      }
      
      guard let rr = r, let gg = g, let bb = b else { return nil }
      
      self.init(red: rr, green: gg, blue: bb, alpha: a)
      return
    }
    
    // MARK: - unsupported format
    return nil
  }
}

// MARK: - Gradient colour interpolation
/// A gradient's `in <colorspace> [<hue-method> hue]`. CGGradient only interpolates in sRGB,
/// so `expandInterpolatedStops` resamples each segment in the requested space.
struct ColorInterpolation: Equatable {
  enum Space: String {
    case srgb, srgbLinear = "srgb-linear", oklab, oklch, lab, lch, xyzD65 = "xyz-d65", xyzD50 = "xyz-d50", hsl, hwb

    var hueIndex: Int {
      switch self {
      case .oklch, .lch: return 2
      case .hsl, .hwb: return 0
      default: return -1
      }
    }

    static func parse(_ name: String) -> Space? {
      let n = name.lowercased()
      return n == "xyz" ? .xyzD65 : Space(rawValue: n)
    }
  }

  enum HueMethod: String { case shorter, longer, increasing, decreasing }

  let space: Space
  var hue: HueMethod = .shorter

  /// Splits the method from a gradient's first argument, or nil when there is none.
  static func extract(_ first: String) -> (rest: String, method: ColorInterpolation)? {
    var tokens = first.split(whereSeparator: { $0.isWhitespace }).map(String.init)
    guard let at = tokens.firstIndex(where: { $0.lowercased() == "in" }), at + 1 < tokens.count else { return nil }
    // Unknown spaces fall back to sRGB instead of dropping the gradient.
    let space = Space.parse(tokens[at + 1]) ?? .srgb
    var consumed = 2
    var hue = HueMethod.shorter
    if at + 3 < tokens.count, tokens[at + 3].lowercased() == "hue", let method = HueMethod(rawValue: tokens[at + 2].lowercased()) {
      hue = method
      consumed = 4
    }
    tokens.removeSubrange(at..<(at + consumed))
    return (tokens.joined(separator: " "), ColorInterpolation(space: space, hue: hue))
  }
}

// Keeps each channel within ~1/255 of the exact curve.
private let interpolationSamplesPerSegment = 8

func expandInterpolatedStops(_ colors: [CGColor], _ locations: [CGFloat], _ interpolation: ColorInterpolation?) -> (colors: [CGColor], locations: [CGFloat]) {
  guard let interpolation = interpolation, interpolation.space != .srgb, colors.count >= 2, colors.count == locations.count else {
    return (colors, locations)
  }
  let rgba = colors.map(srgbComponents)
  var outColors: [CGColor] = []
  var outLocations: [CGFloat] = []
  for i in 0..<colors.count {
    outColors.append(colors[i])
    outLocations.append(locations[i])
    if i == colors.count - 1 { break }
    let p0 = locations[i]
    let p1 = locations[i + 1]
    if p1 - p0 <= 1e-6 { continue } // hard stop
    for k in 1..<interpolationSamplesPerSegment {
      let t = Double(k) / Double(interpolationSamplesPerSegment)
      let c = interpolateColor(rgba[i], rgba[i + 1], t, interpolation)
      outColors.append(UIColor(red: CGFloat(c[0]), green: CGFloat(c[1]), blue: CGFloat(c[2]), alpha: CGFloat(c[3])).cgColor)
      outLocations.append(p0 + (p1 - p0) * CGFloat(t))
    }
  }
  return (outColors, outLocations)
}

private func srgbComponents(_ color: CGColor) -> [Double] {
  var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
  UIColor(cgColor: color).getRed(&r, green: &g, blue: &b, alpha: &a)
  return [Double(r), Double(g), Double(b), Double(a)]
}

// Premultiplied, per CSS Color 4 §12.
func interpolateColor(_ from: [Double], _ to: [Double], _ t: Double, _ interpolation: ColorInterpolation) -> [Double] {
  let space = interpolation.space
  let fromAlpha = from[3]
  let toAlpha = to[3]
  var a = ColorSpaces.fromSrgb(space, Array(from[0..<3]))
  var b = ColorSpaces.fromSrgb(space, Array(to[0..<3]))

  let hue = space.hueIndex
  if hue >= 0 {
    // A powerless hue (grey or transparent) takes the other endpoint's.
    let aGray = isAchromatic(space, a) || fromAlpha == 0
    let bGray = isAchromatic(space, b) || toAlpha == 0
    if aGray && !bGray { a[hue] = b[hue] }
    if bGray && !aGray { b[hue] = a[hue] }
    let d = b[hue] - a[hue]
    switch interpolation.hue {
    case .shorter: if d > 180 { a[hue] += 360 } else if d < -180 { b[hue] += 360 }
    case .longer: if d > 0 && d < 180 { a[hue] += 360 } else if d > -180 && d <= 0 { b[hue] += 360 }
    case .increasing: if d < 0 { b[hue] += 360 }
    case .decreasing: if d > 0 { a[hue] += 360 }
    }
  }

  for i in 0..<3 where i != hue {
    a[i] *= fromAlpha
    b[i] *= toAlpha
  }
  let alpha = fromAlpha + (toAlpha - fromAlpha) * t
  var mixed = [0.0, 0.0, 0.0]
  for i in 0..<3 {
    mixed[i] = a[i] + (b[i] - a[i]) * t
    if i != hue && alpha > 0 { mixed[i] /= alpha }
  }
  if hue >= 0 { mixed[hue] = (mixed[hue].truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360) }

  let rgb = ColorSpaces.toSrgb(space, mixed)
  return rgb.map { min(max($0, 0), 1) } + [min(max(alpha, 0), 1)]
}

private func isAchromatic(_ space: ColorInterpolation.Space, _ v: [Double]) -> Bool {
  switch space {
  // HWB's hue is powerless when whiteness + blackness reach 100%.
  case .hwb: return v[1] + v[2] >= 100 - 1e-4
  default: return abs(v[1]) < 1e-4
  }
}

// Matrices from CSS Color 4 §18.
enum ColorSpaces {
  private static let linearSrgbToXyz: [[Double]] = [
    [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
    [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
    [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
  ]
  private static let xyzToLinearSrgb: [[Double]] = [
    [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
    [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
    [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
  ]
  private static let d65ToD50: [[Double]] = [
    [1.0479298208405488, 0.022946793341019088, -0.05019222954313557],
    [0.029627815688159344, 0.990434484573249, -0.01707382502938514],
    [-0.009243058152591178, 0.015055144896577895, 0.7518742899580008],
  ]
  private static let d50ToD65: [[Double]] = [
    [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
    [-0.028369706963208136, 1.0099954580106629, 0.021041398966943008],
    [0.012314001688319899, -0.020507696433477912, 1.3303659366080753],
  ]
  private static let d50White: [Double] = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585]
  private static let labE = 216.0 / 24389.0
  private static let labK = 24389.0 / 27.0

  static func fromSrgb(_ space: ColorInterpolation.Space, _ rgb: [Double]) -> [Double] {
    switch space {
    case .srgb: return rgb
    case .srgbLinear: return linear(rgb)
    case .oklab: return oklab(linear(rgb))
    case .oklch: return polar(oklab(linear(rgb)))
    case .lab: return lab(mul(d65ToD50, mul(linearSrgbToXyz, linear(rgb))))
    case .lch: return polar(lab(mul(d65ToD50, mul(linearSrgbToXyz, linear(rgb)))))
    case .xyzD65: return mul(linearSrgbToXyz, linear(rgb))
    case .xyzD50: return mul(d65ToD50, mul(linearSrgbToXyz, linear(rgb)))
    case .hsl: return hsl(rgb)
    case .hwb: return hwb(rgb)
    }
  }

  static func toSrgb(_ space: ColorInterpolation.Space, _ v: [Double]) -> [Double] {
    switch space {
    case .srgb: return v
    case .srgbLinear: return gamma(v)
    case .oklab: return gamma(oklabToLinear(v))
    case .oklch: return gamma(oklabToLinear(rectangular(v)))
    case .lab: return gamma(mul(xyzToLinearSrgb, mul(d50ToD65, labToXyz(v))))
    case .lch: return gamma(mul(xyzToLinearSrgb, mul(d50ToD65, labToXyz(rectangular(v)))))
    case .xyzD65: return gamma(mul(xyzToLinearSrgb, v))
    case .xyzD50: return gamma(mul(xyzToLinearSrgb, mul(d50ToD65, v)))
    case .hsl: return hslToRgb(v)
    case .hwb: return hwbToRgb(v)
    }
  }

  private static func mul(_ m: [[Double]], _ v: [Double]) -> [Double] {
    return (0..<3).map { r in m[r][0] * v[0] + m[r][1] * v[1] + m[r][2] * v[2] }
  }

  private static func toLinear(_ c: Double) -> Double {
    let a = abs(c)
    return a <= 0.04045 ? c / 12.92 : (c < 0 ? -1 : 1) * pow((a + 0.055) / 1.055, 2.4)
  }

  private static func fromLinear(_ c: Double) -> Double {
    let a = abs(c)
    return a <= 0.0031308 ? c * 12.92 : (c < 0 ? -1 : 1) * (1.055 * pow(a, 1 / 2.4) - 0.055)
  }

  private static func linear(_ rgb: [Double]) -> [Double] { rgb.map(toLinear) }
  private static func gamma(_ rgb: [Double]) -> [Double] { rgb.map(fromLinear) }

  private static func oklab(_ lin: [Double]) -> [Double] {
    let l = cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2])
    let m = cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2])
    let s = cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2])
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ]
  }

  private static func oklabToLinear(_ lab: [Double]) -> [Double] {
    let l = pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3)
    let m = pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3)
    let s = pow(lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2], 3)
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ]
  }

  private static func lab(_ xyzD50: [Double]) -> [Double] {
    let f = (0..<3).map { i -> Double in
      let n = xyzD50[i] / d50White[i]
      return n > labE ? cbrt(n) : (labK * n + 16) / 116
    }
    return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])]
  }

  private static func labToXyz(_ lab: [Double]) -> [Double] {
    let fy = (lab[0] + 16) / 116
    let fx = lab[1] / 500 + fy
    let fz = fy - lab[2] / 200
    let x = pow(fx, 3) > labE ? pow(fx, 3) : (116 * fx - 16) / labK
    let y = lab[0] > labK * labE ? pow(fy, 3) : lab[0] / labK
    let z = pow(fz, 3) > labE ? pow(fz, 3) : (116 * fz - 16) / labK
    return [x * d50White[0], y * d50White[1], z * d50White[2]]
  }

  private static func polar(_ v: [Double]) -> [Double] {
    var h = atan2(v[2], v[1]) * 180 / .pi
    if h < 0 { h += 360 }
    return [v[0], hypot(v[1], v[2]), h]
  }

  private static func rectangular(_ v: [Double]) -> [Double] {
    let rad = v[2] * .pi / 180
    return [v[0], v[1] * cos(rad), v[1] * sin(rad)]
  }

  private static func hsl(_ rgb: [Double]) -> [Double] {
    let r = rgb[0], g = rgb[1], b = rgb[2]
    let mx = max(r, g, b)
    let mn = min(r, g, b)
    let l = (mx + mn) / 2
    let d = mx - mn
    var h = 0.0
    var s = 0.0
    if d != 0 {
      s = (l == 0 || l == 1) ? 0 : (mx - l) / min(l, 1 - l)
      if mx == r { h = (g - b) / d + (g < b ? 6 : 0) }
      else if mx == g { h = (b - r) / d + 2 }
      else { h = (r - g) / d + 4 }
      h *= 60
    }
    return [h, s * 100, l * 100]
  }

  private static func hslToRgb(_ v: [Double]) -> [Double] {
    let h = v[0], s = v[1] / 100, l = v[2] / 100
    func f(_ n: Double) -> Double {
      let k = (n + h / 30).truncatingRemainder(dividingBy: 12)
      return l - s * min(l, 1 - l) * max(-1, min(k - 3, 9 - k, 1))
    }
    return [f(0), f(8), f(4)]
  }

  private static func hwb(_ rgb: [Double]) -> [Double] {
    return [hsl(rgb)[0], min(rgb[0], rgb[1], rgb[2]) * 100, (1 - max(rgb[0], rgb[1], rgb[2])) * 100]
  }

  private static func hwbToRgb(_ v: [Double]) -> [Double] {
    let w = v[1] / 100, b = v[2] / 100
    if w + b >= 1 {
      let gray = w / (w + b)
      return [gray, gray, gray]
    }
    return hslToRgb([v[0], 100, 50]).map { $0 * (1 - w - b) + w }
  }
}
