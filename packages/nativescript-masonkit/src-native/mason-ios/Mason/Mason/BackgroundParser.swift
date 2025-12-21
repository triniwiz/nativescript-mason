//
//  BackgroundParser.swift
//  Mason
//
//  Created by Osei Fortune on 20/11/2025.
//


import UIKit
import CoreGraphics

// MARK: - BackgroundClip
enum BackgroundClip {
  case borderBox
  case paddingBox
  case contentBox
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

// MARK: - Background Layer
class BackgroundLayer {
  var image: String? = nil
  var repeatType: BackgroundRepeat = .noRepeat
  var position: (CGFloat, CGFloat)? = nil
  var size: (CGFloat, CGFloat)? = nil
  var gradient: Gradient? = nil
  var shader: CGGradient? = nil
  var bitmap: UIImage? = nil
  var clip: BackgroundClip = .borderBox
  var backgroundColor: UIColor? = nil
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
        style.setUInt32(TextStyleKeys.BACKGROUND_COLOR, 0, text: true)
        style.setUInt8(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.INHERIT, text: true)
        style.notifyTextStyleChanged(TextStyleChangeMasks.backgroundColor.rawValue)
        return
      }
      
      style.setUInt32(TextStyleKeys.BACKGROUND_COLOR, color.toUInt32(), text: true)
      style.setUInt8(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET, text: true)
      style.notifyTextStyleChanged(TextStyleChangeMasks.backgroundColor.rawValue)
    }
    get {
      if(style.getUInt8(TextStyleKeys.BACKGROUND_COLOR_STATE, text: true) != StyleState.SET){
        return nil
      }
      
      return UIColor.colorFromARGB(style.getUInt32(TextStyleKeys.BACKGROUND_COLOR, text: true))
    }
  }
  var layers: [BackgroundLayer] = []
  let style: MasonStyle!
  internal var isActive: Bool = false {
    didSet {
      style.node.view?.setNeedsDisplay()
    }
  }
  init(style: MasonStyle) {
    self.style = style
  }
  
  
  public func reset(){
    let invalidate = color != nil || !layers.isEmpty
    color = nil
    layers.removeAll()
    if(invalidate){
      style.node.view?.setNeedsDisplay()
    }
  }
  
  // MARK: - Parse Background
  public func parseBackground(_ css: String) {
    if css.isEmpty {
      self.css = css
      reset()
    }
    var layerStrings = splitBackgroundLayers(css)
    
    var color: UIColor? = nil
    
    // Check if the last token is just a color
    if let last = layerStrings.last, parseColor(last) != nil {
      color = parseColor(last)
      layerStrings.removeLast()
    }
    
    let layers = layerStrings.map { parseLayer($0) }
    if color == nil && layers.isEmpty { return }
    
    self.color = color
    self.layers = layers
    self.css = css
    
    
    let newValue = color?.toUInt32() ?? 0
    style.setUInt32(TextStyleKeys.BACKGROUND_COLOR, newValue, text: true)
    style.setUInt8(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET, text: true)
    // change view as well ??
    // style.node.view?.backgroundColor = UIColor.colorFromARGB(newValue)
    
    if(!style.inBatch){
      style.node.view?.setNeedsDisplay()
    }
  }
  
  
  
  private func applyBackgroundImage(_ value: String) {
    let chunks = splitBackgroundLayers(value)
    
    self.layers = chunks.map { chunk in
      let layer = BackgroundLayer()
      if let imageURL = parseImage(chunk) {
        layer.image = imageURL
      }else if let gradient = parseGradient(chunk) {
        layer.gradient = gradient
      }
      return layer
    }
    
    if(!style.inBatch){
      style.node.view?.setNeedsDisplay()
    }
  }
  
  
  private func applyBackgroundRepeat(_ value: String) {
    let part = value.trimmingCharacters(in: .whitespaces).lowercased()
    
    let repeats = splitBackgroundLayers(part)
    
    if layers.count < repeats.count {
      layers += Array(repeating: BackgroundLayer(), count: repeats.count - layers.count)
    }
    
    for (idx, rep) in repeats.enumerated() {
      layers[idx].repeatType = BackgroundRepeat(rawValue: rep) ?? .noRepeat
    }
    
    if(!style.inBatch){
      style.node.view?.setNeedsDisplay()
    }
  }
  
  
  private func applyBackgroundPosition(_ value: String) {
    let parts = splitBackgroundLayers(value)
    
    if layers.count < parts.count {
      layers += Array(repeating: BackgroundLayer(), count: parts.count - layers.count)
    }
    
    for (idx, p) in parts.enumerated() {
      layers[idx].position = parsePosition(p)
    }
    
    if(!style.inBatch){
      style.node.view?.setNeedsDisplay()
    }
  }
  
  private func applyBackgroundSize(_ value: String) {
    let parts = splitBackgroundLayers(value)
    
    if layers.count < parts.count {
      layers += Array(repeating: BackgroundLayer(), count: parts.count - layers.count)
    }
    
    for (idx, p) in parts.enumerated() {
      layers[idx].size = parseSize(p)
    }
    
    if(!style.inBatch){
      style.node.view?.setNeedsDisplay()
    }
  }
  
  private func applyBackgroundClip(_ value: String) {
    let v = value.trimmingCharacters(in: .whitespaces).lowercased()
    
    let clip: BackgroundClip
    switch v {
    case "border-box": clip = .borderBox
    case "padding-box": clip = .paddingBox
    case "content-box": clip = .contentBox
    default: return
    }
    
    for layer in layers {
      layer.clip = clip
    }
    
    if(!style.inBatch){
      style.node.view?.setNeedsDisplay()
    }
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
      applyBackgroundRepeat(value)
      return
      
    case "background-position":
      applyBackgroundPosition(value)
      return
      
    case "background-size":
      applyBackgroundSize(value)
      return
      
    case "background-clip":
      applyBackgroundClip(value)
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
  "gray": .gray,
  "grey": .gray,
  "white": .white,
  "maroon": UIColor(red: 0.5, green: 0, blue: 0, alpha: 1),
  "red": .red,
  "purple": UIColor(red: 0.5, green: 0, blue: 0.5, alpha: 1),
  "fuchsia": .magenta,
  "green": .green,
  "lime": UIColor(red: 0, green: 1, blue: 0, alpha: 1),
  "olive": UIColor(red: 0.5, green: 0.5, blue: 0, alpha: 1),
  "yellow": .yellow,
  "navy": UIColor(red: 0, green: 0, blue: 0.5, alpha: 1),
  "blue": .blue,
  "teal": UIColor(red: 0, green: 0.5, blue: 0.5, alpha: 1),
  "aqua": .cyan,
  "orange": .orange,
  "brown": UIColor(red: 0.65, green: 0.16, blue: 0.16, alpha: 1),
  "pink": UIColor.systemPink,
  "transparent": .clear
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


// MARK: - Parse Multiple Layers (deprecated wrapper)
// kept for compatibility with older call sites
func parseBackgroundLayers(_ css: String) -> [BackgroundLayer] {
  return splitBackgroundLayers(css).map { parseLayer($0) }
}

// MARK: - Parse Single Layer
func parseLayer(_ str: String) -> BackgroundLayer {
  let layer = BackgroundLayer()
  var value = str.trimmingCharacters(in: .whitespacesAndNewlines)
  
  if value.hasSuffix(";") {
    value = String(value.dropLast()).trimmingCharacters(in: .whitespacesAndNewlines)
  }
  
  // --- Entire layer is just a plain color ---
  if let col = parseColor(value) {
    layer.backgroundColor = col
    return layer
  }
  
  // --- Gradient ---
  if value.lowercased().hasPrefix("linear-gradient") || value.lowercased().hasPrefix("radial-gradient") {
    if let g = parseGradient(value) {
      layer.gradient = g
      
      var cgColors: [CGColor] = []
      var locations: [CGFloat] = []
      
      let colorStops: [String]
      // For radial-gradient, first stop can be shape/position
      if g.type == "radial" && g.stops.count > 1 {
        colorStops = Array(g.stops.dropFirst())
      } else if g.type == "linear", g.direction != nil {
        colorStops = Array(g.stops)
      } else {
        colorStops = g.stops
      }
      
      for stop in colorStops {
        if let lastSpace = stop.lastIndex(of: " ") {
          let colorPart = String(stop[..<lastSpace])
          let posPart = String(stop[stop.index(after: lastSpace)...]).trimmingCharacters(in: .whitespacesAndNewlines)
          
          if let color = parseColor(colorPart)?.cgColor {
            cgColors.append(color)
          }
          
          if let pos = Double(posPart.trimmingCharacters(in: CharacterSet(charactersIn: "%"))) {
            locations.append(CGFloat(pos) / 100)
          } else {
            locations.append(CGFloat(cgColors.count - 1) / CGFloat(colorStops.count - 1))
          }
        } else {
          if let color = parseColor(stop)?.cgColor {
            cgColors.append(color)
          }
          locations.append(CGFloat(cgColors.count - 1) / CGFloat(colorStops.count - 1))
        }
      }
      
      if !cgColors.isEmpty {
        layer.shader = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                  colors: cgColors as CFArray,
                                  locations: locations)
      }
      
      // gradient consumes whole layer string
      value = ""
      return layer
    }
  }
  
  // --- Image ---
  if let url = parseImage(value) {
    layer.image = url
    value = removeImageURL(from: value)
  }
  
  // --- Repeat keywords ---
  ["repeat", "repeat-x", "repeat-y", "no-repeat"].forEach { key in
    if value.contains(key) {
      layer.repeatType = BackgroundRepeat(rawValue: key) ?? .noRepeat
      value = value.replacingOccurrences(of: key, with: "")
    }
  }
  
  // --- Position / Size ---
  if value.contains("/") {
    let parts = value.components(separatedBy: "/").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
    let posPart = parts[0]
    let sizePart = parts.count > 1 ? parts[1] : nil
    layer.position = parsePosition(posPart)
    if let sizePart = sizePart { layer.size = parseSize(sizePart) }
  } else {
    layer.position = parsePosition(value)
  }
  
  // --- Background color token (after parsing gradient/image) ---
  // Only parse **standalone tokens** that are a color, do NOT split inside parentheses
  let tokens = value.split(separator: " ").map(String.init)
  for token in tokens {
    if let col = parseColor(token) {
      layer.backgroundColor = col
      break
    }
  }
  
  return layer
}

// MARK: - Parse Position (accepts a string like "35% center" or "left top")
func parsePosition(_ str: String) -> (CGFloat, CGFloat) {
  var x: CGFloat = 0.5
  var y: CGFloat = 0.5
  let tokens = str.split(whereSeparator: { $0.isWhitespace }).map(String.init).filter { !$0.isEmpty }
  
  for part in tokens {
    if part.hasSuffix("%") {
      if let v = Float(part.dropLast()) {
        if x == 0.5 { x = CGFloat(v / 100) } else { y = CGFloat(v / 100) }
      }
    } else {
      switch part.lowercased() {
      case "left": x = 0
      case "right": x = 1
      case "top": y = 0
      case "bottom": y = 1
      case "center": if x == 0.5 { x = 0.5 } else { y = 0.5 }
      default: break
      }
    }
  }
  return (x, y)
}

// MARK: - Parse Size
func parseSize(_ str: String) -> (CGFloat, CGFloat)? {
  let s = str.lowercased()
  switch s {
  case "cover": return (-1, -1) // special handling in draw
  case "contain": return (-2, -2) // special handling in draw
  default:
    let tokens = s.split(whereSeparator: { $0.isWhitespace }).map(String.init)
    if tokens.count == 2 {
      let w = tokens[0].trimmingCharacters(in: CharacterSet(charactersIn: "px"))
      let h = tokens[1].trimmingCharacters(in: CharacterSet(charactersIn: "px"))
      if let wf = Float(w), let hf = Float(h) {
        return (CGFloat(wf), CGFloat(hf))
      }
    }
  }
  return nil
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
    if t.lowercased().hasPrefix("to ") || t.lowercased().hasSuffix("deg") {
      direction = t
      parts = Array(parts.dropFirst())
    }
  }
  
  let stops = parts.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
  return Gradient(type: type, direction: direction, stops: stops)
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
