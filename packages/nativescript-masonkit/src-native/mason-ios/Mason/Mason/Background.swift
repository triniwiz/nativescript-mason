//
//  Background.swift
//  Mason
//
//  Created by Osei Fortune on 19/11/2025.
//


import UIKit
import CoreGraphics

// Shared color space — avoids deviceRGB allocation per gradient draw
private let deviceRGB = CGColorSpaceCreateDeviceRGB()

// MARK: - Background
extension Background {
  
  
  // See the `on view:` overload below for what `precomputedColor` is for.
  func draw(on layer: CALayer, in context: CGContext, rect: CGRect, precomputedColor: UInt32? = nil) {
    let resolved = precomputedColor ?? style.resolvedBackgroundColor
    if resolved != 0 {
      context.setFillColor(UIColor.colorFromARGB(resolved).cgColor)
      context.fill(rect)
    }

    for bgLayer in layers.reversed() {
      drawLayer(bgLayer, on: nil, on: layer, in: context, rect: rect)
    }

  }

  // `precomputedColor`: pass an already-resolved color to avoid resolving
  // it twice when the caller needed it anyway (resolution isn't a plain
  // buffer read - it walks the pseudo-state chain).
  func draw(on view: UIView, in context: CGContext, rect: CGRect, precomputedColor: UInt32? = nil) {
    let resolved = precomputedColor ?? style.resolvedBackgroundColor
    if resolved != 0 {
      context.setFillColor(UIColor.colorFromARGB(resolved).cgColor)
      context.fill(rect)
    }

    for layer in layers.reversed() {
      drawLayer(layer, on: view, in: context, rect: rect)
    }
  }
  
  
  private func drawLayer(_ layer: BackgroundLayer, on view: UIView? = nil, on caLayer: CALayer? = nil, in context: CGContext, rect: CGRect) {
    
    // Draw layer color (before gradient or image)
    if let color = layer.backgroundColor {
      context.setFillColor(color.cgColor)
      context.fill(CGRect(x: 0, y: 0, width: rect.width, height: rect.height))
    }
    
    
    
    // Draw gradient if present
    if let _ = layer.gradient {
      drawGradient(layer: layer, context: context, width: rect.width, height: rect.height)
    }
    
    // Draw image if present
    if let urlStr = layer.image {
      if let cached = layer.bitmap {
        drawBitmap(layer: layer, bitmap: cached, context: context, rect: rect)
      } else {
        loadImageCached(url: urlStr) { image in
          layer.bitmap = image
          if let view = view {
            DispatchQueue.main.async {
              view.setNeedsDisplay()
              caLayer?.needsDisplay()
            }
          }
          
          if let caLayer = caLayer {
            DispatchQueue.main.async {
              caLayer.needsDisplay()
            }
          }
        }
      }
    }
  }
  
  
  // MARK: - Gradient Drawing
  private func drawGradient(layer: BackgroundLayer, context: CGContext, width: CGFloat, height: CGFloat) {
    guard let gradient = layer.gradient else { return }

    // if size changed since last shader creation, clear cache
    if layer.shader != nil && (layer.shaderWidth != width || layer.shaderHeight != height) {
      layer.shader = nil
    }

    if layer.shader == nil {
      let (colors, locations) = parseGradientStops(gradient.stops)
      if locations.isEmpty {
        layer.shader = CGGradient(colorsSpace: deviceRGB, colors: colors as CFArray, locations: nil)
      } else {
        layer.shader = CGGradient(colorsSpace: deviceRGB, colors: colors as CFArray, locations: locations)
      }
      layer.shaderWidth = width
      layer.shaderHeight = height
    }
    guard let shader = layer.shader else { return }

    switch gradient.type.lowercased() {
    case "linear":
      let (start, end) = linearGradientPoints(direction: gradient.direction, width: width, height: height)
      context.drawLinearGradient(shader, start: start, end: end, options: [])
    case "radial":
      let center = resolveRadialGradientCenter(direction: gradient.direction, width: width, height: height)
      // Radius must reach the farthest corner from the resolved centre.
      let radius = max([
        hypot(center.x, center.y),
        hypot(width - center.x, center.y),
        hypot(center.x, height - center.y),
        hypot(width - center.x, height - center.y)
      ].max() ?? max(width, height) / 2, 1)
      context.drawRadialGradient(shader, startCenter: center, startRadius: 0, endCenter: center, endRadius: radius, options: [])
    default:
      break
    }
  }
  
  
  // MARK: - Bitmap Drawing
  private func drawBitmap(layer: BackgroundLayer, bitmap: UIImage, context: CGContext, rect: CGRect) {
    guard let cgImage = bitmap.cgImage else { return }
    let width = rect.width
    let height = rect.height
    
    let drawSize: CGSize
    if let size = layer.size {
      if size.0 < 0 || size.1 < 0 {
        drawSize = CGSize(width: cgImage.width, height: cgImage.height)
      } else {
        drawSize = CGSize(width: size.0 * width, height: size.1 * height)
      }
    } else {
      drawSize = CGSize(width: cgImage.width, height: cgImage.height)
    }
    
    let pos = layer.position ?? (0.5, 0.5)
    let x = pos.0 * (width - drawSize.width)
    let y = pos.1 * (height - drawSize.height)
    
    switch layer.repeatType {
    case .noRepeat:
      context.draw(cgImage, in: CGRect(x: x, y: y, width: drawSize.width, height: drawSize.height))
    case .repeatX:
      var px = x
      while px < width {
        context.draw(cgImage, in: CGRect(x: px, y: y, width: drawSize.width, height: drawSize.height))
        px += drawSize.width
      }
    case .repeatY:
      var py = y
      while py < height {
        context.draw(cgImage, in: CGRect(x: x, y: py, width: drawSize.width, height: drawSize.height))
        py += drawSize.height
      }
    case .repeatXY:
      var py = y
      while py < height {
        var px = x
        while px < width {
          context.draw(cgImage, in: CGRect(x: px, y: py, width: drawSize.width, height: drawSize.height))
          px += drawSize.width
        }
        py += drawSize.height
      }
    }
  }
  
  // MARK: - Cached Image Loader
  private func loadImageCached(url: String, completion: @escaping (UIImage?) -> Void) {
    guard let u = URL(string: url) else { completion(nil); return }
    
    // Check URLCache first
    let request = URLRequest(url: u)
    if let cached = URLCache.shared.cachedResponse(for: request),
       let image = UIImage(data: cached.data) {
      completion(image)
      return
    }
    
    // Download and cache
    URLSession.shared.dataTask(with: u) { data, response, _ in
      guard let data = data else { completion(nil); return }
      if let response = response {
        let cachedData = CachedURLResponse(response: response, data: data)
        URLCache.shared.storeCachedResponse(cachedData, for: request)
      }
      completion(UIImage(data: data))
    }.resume()
  }
}

// MARK: - Draw Background Entry Point
func drawBackground(
  view: UIView?,
  layer: BackgroundLayer,
  context: CGContext,
  rect: CGRect
) {
  
  // Draw layer color (before gradient or image)
  if let color = layer.backgroundColor {
    context.setFillColor(color.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: rect.width, height: rect.height))
  }
  
  if layer.gradient != nil {
    drawGradient(layer: layer, context: context, width: rect.width, height: rect.height)
  }
  
  if let imageUrl = layer.image {
    if let cached = layer.bitmap {
      drawBitmapLayer(bitmap: cached, layer: layer, context: context, rect: rect)
      return
    }
    
    loadImageAsync(url: imageUrl) { image in
      layer.bitmap = image
      if let view = view {
        DispatchQueue.main.async {
          view.setNeedsDisplay()
        }
      }
    }
  }
}

// MARK: - Gradient Drawing
func drawGradient(layer: BackgroundLayer, context: CGContext, width: CGFloat, height: CGFloat) {
  guard let gradient = layer.gradient else { return }

  if layer.shader == nil {
    let (colors, locations) = parseGradientStops(gradient.stops)
    if locations.isEmpty {
      layer.shader = CGGradient(colorsSpace: deviceRGB, colors: colors as CFArray, locations: nil)
    } else {
      layer.shader = CGGradient(colorsSpace: deviceRGB, colors: colors as CFArray, locations: locations)
    }
  }
  
  guard let shader = layer.shader else { return }
  
  switch gradient.type.lowercased() {
  case "linear":
    let (start, end) = linearGradientPoints(direction: gradient.direction, width: width, height: height)
    context.drawLinearGradient(shader, start: start, end: end, options: [])
    
  case "radial":
    let center = resolveRadialGradientCenter(direction: gradient.direction, width: width, height: height)
    // Radius must reach the farthest corner from the resolved centre.
    let radius = max([
      hypot(center.x, center.y),
      hypot(width - center.x, center.y),
      hypot(center.x, height - center.y),
      hypot(width - center.x, height - center.y)
    ].max() ?? max(width, height) / 2, 1)
    context.drawRadialGradient(shader,
                               startCenter: center,
                               startRadius: 0,
                               endCenter: center,
                               endRadius: radius,
                               options: [])
    
  default:
    break
  }
}

func linearGradientPoints(direction: String?, width: CGFloat, height: CGFloat)
-> (CGPoint, CGPoint) {
  switch direction?.lowercased() {
  case "to bottom", "180deg": return (CGPoint(x: 0, y: 0), CGPoint(x: 0, y: height))
  case "to top", "0deg": return (CGPoint(x: 0, y: height), CGPoint(x: 0, y: 0))
  case "to right", "90deg": return (CGPoint(x: 0, y: 0), CGPoint(x: width, y: 0))
  case "to left", "270deg": return (CGPoint(x: width, y: 0), CGPoint(x: 0, y: 0))
  default:
    // handle angle in degrees
    
    if let dir = direction, dir.hasSuffix("deg"), let angle = Double(dir.dropLast(3)) {
      // CSS: 0deg = up, clockwise; UIKit y-axis is downward
                 let rad = (angle - 90) * Double.pi / 180.0 // flip the rotation
                 
                 // unit vector
                 let dx = CGFloat(cos(rad))
                 let dy = CGFloat(sin(rad))
                 
                 // scale vector to cover the rectangle fully
                 let halfDiag = sqrt(pow(width, 2) + pow(height, 2)) / 2
                 let cx = width / 2
                 let cy = height / 2
                 
                 let start = CGPoint(x: cx - dx * halfDiag, y: cy - dy * halfDiag)
                 let end   = CGPoint(x: cx + dx * halfDiag, y: cy + dy * halfDiag)
                 return (start, end)
    }
    // fallback
    return (CGPoint(x: 0, y: 0), CGPoint(x: 0, y: height))
  }
}

/// Resolve the centre point of a radial-gradient from the CSS direction string.
///
/// Accepted formats: "circle at top left", "ellipse at 30% 70%",
/// "at center", "circle", etc.  Defaults to the element centre (50% 50%).
func resolveRadialGradientCenter(direction: String?, width: CGFloat, height: CGFloat) -> CGPoint {
  let defaultCenter = CGPoint(x: width / 2, y: height / 2)
  guard let dir = direction?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() else {
    return defaultCenter
  }

  // Extract the portion after "at "
  guard let atRange = dir.range(of: " at ") else { return defaultCenter }
  let positionStr = String(dir[atRange.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
  if positionStr.isEmpty { return defaultCenter }

  return resolvePositionKeywords(positionStr, width: width, height: height)
}

/// Convert a CSS background-position value (keyword or percentage based) to
/// absolute pixel coordinates.
private func resolvePositionKeywords(_ position: String, width: CGFloat, height: CGFloat) -> CGPoint {
  let parts = position.split(separator: " ").map { String($0) }

  func resolveToken(_ token: String, horizontal: Bool) -> CGFloat {
    switch token {
    case "left":   return 0
    case "right":  return width
    case "top":    return 0
    case "bottom": return height
    case "center": return horizontal ? width / 2 : height / 2
    default:
      if token.hasSuffix("%"), let pct = Double(token.dropLast()) {
        return CGFloat(pct / 100) * (horizontal ? width : height)
      }
      let cleaned = token.hasSuffix("px") ? String(token.dropLast(2)) : token
      if let px = Double(cleaned) { return CGFloat(px) }
      return horizontal ? width / 2 : height / 2
    }
  }

  if parts.count == 1 {
    switch parts[0] {
    case "top":    return CGPoint(x: width / 2, y: 0)
    case "bottom": return CGPoint(x: width / 2, y: height)
    default:
      let x = resolveToken(parts[0], horizontal: true)
      return CGPoint(x: x, y: height / 2)
    }
  }

  return CGPoint(
    x: resolveToken(parts[0], horizontal: true),
    y: resolveToken(parts[1], horizontal: false)
  )
}

// MARK: - Bitmap Drawing
private func drawBitmapLayer(
  bitmap: UIImage,
  layer: BackgroundLayer,
  context: CGContext,
  rect: CGRect
) {
  guard let cgImage = bitmap.cgImage else { return }
  
  let width = rect.width
  let height = rect.height
  
  var drawWidth: CGFloat
  var drawHeight: CGFloat
  
  // Handle size
  if let size = layer.size {
    switch (size.0, size.1) {
    case (-1, -1): // cover
      let scale = max(width / CGFloat(cgImage.width), height / CGFloat(cgImage.height))
      drawWidth = CGFloat(cgImage.width) * scale
      drawHeight = CGFloat(cgImage.height) * scale
    case (-2, -2): // contain
      let scale = min(width / CGFloat(cgImage.width), height / CGFloat(cgImage.height))
      drawWidth = CGFloat(cgImage.width) * scale
      drawHeight = CGFloat(cgImage.height) * scale
    default:
      drawWidth = size.0 < 0 ? CGFloat(cgImage.width) : size.0
      drawHeight = size.1 < 0 ? CGFloat(cgImage.height) : size.1
    }
  } else {
    drawWidth = CGFloat(cgImage.width)
    drawHeight = CGFloat(cgImage.height)
  }
  
  // Position
  let pos = layer.position ?? (0.5, 0.5)
  let x = pos.0 * (width - drawWidth)
  let y = pos.1 * (height - drawHeight)
  
  // Draw according to repeatType
  switch layer.repeatType {
  case .noRepeat:
    context.draw(cgImage, in: CGRect(x: x, y: y, width: drawWidth, height: drawHeight))
    
  case .repeatX:
    var px = x
    while px < width {
      context.draw(cgImage, in: CGRect(x: px, y: y, width: drawWidth, height: drawHeight))
      px += drawWidth
    }
    
  case .repeatY:
    var py = y
    while py < height {
      context.draw(cgImage, in: CGRect(x: x, y: py, width: drawWidth, height: drawHeight))
      py += drawHeight
    }
    
  case .repeatXY:
    var py = y
    while py < height {
      var px = x
      while px < width {
        context.draw(cgImage, in: CGRect(x: px, y: py, width: drawWidth, height: drawHeight))
        px += drawWidth
      }
      py += drawHeight
    }
  }
}

// MARK: - Gradient Stop Parsing
/// Parse gradient stop strings (e.g. "transparent 66%", "rgba(0,0,0,0.5)").
/// Returns parallel arrays of CGColor and CGFloat positions following CSS inference rules.
func parseGradientStops(_ stops: [String]) -> (colors: [CGColor], locations: [CGFloat]) {
  var parsedColors: [CGColor?] = []
  var parsedPositions: [CGFloat?] = []
  for raw in stops {
    let trimmed = raw.trimmingCharacters(in: .whitespaces)
    var depth = 0
    var lastSpace: String.Index? = nil
    for idx in trimmed.indices {
      let ch = trimmed[idx]
      if ch == "(" { depth += 1 }
      else if ch == ")" { depth -= 1 }
      else if ch == " " && depth == 0 { lastSpace = idx }
    }
    if let spaceIdx = lastSpace {
      let colorPart = String(trimmed[trimmed.startIndex..<spaceIdx])
      let posPart = String(trimmed[trimmed.index(after: spaceIdx)...]).trimmingCharacters(in: .whitespaces)
      let color = colorMap[colorPart]?.cgColor ?? UIColor(css: colorPart)?.cgColor
      var position: CGFloat? = nil
      if posPart.hasSuffix("%"), let val = Double(posPart.dropLast()) {
        position = CGFloat(val / 100.0)
      } else if let val = Double(posPart) {
        position = CGFloat(val <= 1.0 ? val : val / 100.0)
      }
      parsedColors.append(color)
      parsedPositions.append(position)
    } else {
      parsedColors.append(colorMap[trimmed]?.cgColor ?? UIColor(css: trimmed)?.cgColor)
      parsedPositions.append(nil)
    }
  }
  // CSS position inference: unspecified stops distribute evenly between anchored neighbors.
  let n = parsedPositions.count
  if n > 0 {
    if parsedPositions[0] == nil { parsedPositions[0] = 0.0 }
    if parsedPositions[n - 1] == nil { parsedPositions[n - 1] = 1.0 }
    // Forward pass: fill runs of nil between anchors by linear interpolation.
    var i = 0
    while i < n {
      if parsedPositions[i] == nil {
        var j = i + 1
        while j < n && parsedPositions[j] == nil { j += 1 }
        let start = parsedPositions[i - 1] ?? 0.0
        let end = parsedPositions[j < n ? j : n - 1] ?? 1.0
        let steps = j - i + 1
        for k in i..<j {
          parsedPositions[k] = start + (end - start) * CGFloat(k - i + 1) / CGFloat(steps)
        }
        i = j
      } else {
        i += 1
      }
    }
  }
  let validPairs = zip(parsedColors, parsedPositions).compactMap { (c, p) -> (CGColor, CGFloat)? in
    guard let color = c, let pos = p else { return nil }
    return (color, pos)
  }
  let colors = validPairs.map { $0.0 }
  let locations = validPairs.map { $0.1 }
  return (colors, locations)
}

// MARK: - Image Loading
func loadImageAsync(url: String, completion: @escaping (UIImage?) -> Void) {
  guard let u = URL(string: url) else {
    completion(nil)
    return
  }

  // Check URLCache first to avoid redundant network requests
  let request = URLRequest(url: u)
  if let cached = URLCache.shared.cachedResponse(for: request),
     let image = UIImage(data: cached.data) {
    completion(image)
    return
  }

  URLSession.shared.dataTask(with: u) { data, response, _ in
    guard let data = data else { completion(nil); return }
    if let response = response {
      let cachedData = CachedURLResponse(response: response, data: data)
      URLCache.shared.storeCachedResponse(cachedData, for: request)
    }
    completion(UIImage(data: data))
  }.resume()
}
