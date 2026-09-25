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
  let type: String       // "linear" or "radial"
  let direction: String? // "to bottom" or angle like "0deg"
  let stops: [String]    // color stops (unparsed strings)
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
  var bitmap: UIImage? = nil
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

/// Split background layers by top-level commas (commas not inside parentheses)
func splitBackgroundLayers(_ input: String) -> [String] {
  var result: [String] = []
  var current = ""
  var depth = 0
  
  for ch in input {
    if ch == "(" { depth += 1 }
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

/// Cut the first `linear-gradient(...)`/`radial-gradient(...)` out of `value`, balancing parentheses.
private func extractGradient(from value: String) -> (gradient: String, rest: String)? {
  let starts = ["linear-gradient(", "radial-gradient("].compactMap { value.range(of: $0, options: .caseInsensitive)?.lowerBound }
  guard let start = starts.min() else { return nil }
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
  let lower = str.lowercased()
  if lower.hasPrefix("linear-gradient(") || lower.hasPrefix("radial-gradient(") {
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
  if let first = parts.first {
    let t = first.trimmingCharacters(in: .whitespacesAndNewlines)
    if isAngleOrDirection(t) {
      direction = t
      parts = Array(parts.dropFirst())
    }
  }
  
  let stops = parts.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
  return Gradient(type: type, direction: direction, stops: stops)
}

// MARK: - Helper to detect if a token is an angle, direction, or radial shape/position
private func isAngleOrDirection(_ token: String) -> Bool {
  let v = token.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  
  // Check for angle: e.g., "180deg", "45deg"
  if v.hasSuffix("deg") || v.hasSuffix("rad") || v.hasSuffix("turn") || v.hasSuffix("grad") {
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
private let IMAGE_URL_REGEX = try! NSRegularExpression(pattern: #"url\(["']?(.*?)["']?\)"#, options: .caseInsensitive)
private let IMAGE_URL_REMOVAL_REGEX = try! NSRegularExpression(pattern: #"url\(["']?.*?["']?\)"#, options: .caseInsensitive)

func parseImage(_ value: String) -> String? {
  let ns = value as NSString
  let range = NSRange(location: 0, length: ns.length)
  guard let m = IMAGE_URL_REGEX.firstMatch(in: value, range: range) else { return nil }
  return ns.substring(with: m.range(at: 1))
}

func removeImageURL(from value: String) -> String {
  let range = NSRange(value.startIndex..., in: value)
  let replaced = IMAGE_URL_REMOVAL_REGEX.stringByReplacingMatches(in: value, options: [], range: range, withTemplate: "")
  return replaced.trimmingCharacters(in: .whitespacesAndNewlines)
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
