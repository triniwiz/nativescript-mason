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
private let svgDimensionRegex = try! NSRegularExpression(pattern: #"(?i)\b(width|height)=["']?([0-9.]+)["']?"#, options: [])
private let svgViewBoxRegex = try! NSRegularExpression(pattern: #"(?i)\bviewBox=["']?\s*([-0-9.]+)\s+([-0-9.]+)\s+([-0-9.]+)\s+([-0-9.]+)"#, options: [])
private let svgFillRegex = try! NSRegularExpression(pattern: #"(?i)\bfill=["']([^"']+)["']"#, options: [])
private let svgFillOpacityRegex = try! NSRegularExpression(pattern: #"(?i)\bfill-opacity=["']([0-9.]+)["']"#, options: [])
private let svgPathRegex = try! NSRegularExpression(pattern: #"(?i)<path\b[^>]*\bd=["']([^"']+)["'][^>]*/?>"#, options: [])
private let svgPathTokenRegex = try! NSRegularExpression(pattern: #"[MmLlHhVvZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?"#, options: [])

// MARK: - Background
extension Background {

  var hasFixedLayer: Bool { layers.contains { $0.attachment == .fixed } }
  var hasLocalLayer: Bool { layers.contains { $0.attachment == .local } }
  /// A scroller's own `local` layers move with its content, so it repaints on scroll.
  var needsRedrawOnScroll: Bool { hasLocalLayer }

  /// Views that drew a `fixed` layer; a scroll repaints only these. Main thread only.
  private static let fixedViews = NSHashTable<UIView>.weakObjects()

  /// Redraw the registered fixed-attachment views inside `root` after it scrolled.
  static func invalidateFixedDescendants(_ root: UIView) {
    guard fixedViews.count > 0 else { return }
    for view in fixedViews.allObjects {
      guard let element = MasonViewKind.element(view), element.style.mBackground?.hasFixedLayer == true else {
        fixedViews.remove(view)
        continue
      }
      if view !== root && view.isDescendant(of: root) { view.setNeedsDisplay() }
    }
  }

  // See the `on view:` overload below for what `precomputedColor` is for.
  func draw(on layer: CALayer, in context: CGContext, rect: CGRect, precomputedColor: UInt32? = nil) {
    drawAll(view: style.node.view, caLayer: layer, in: context, rect: rect, precomputedColor: precomputedColor)
  }

  // `precomputedColor`: pass an already-resolved color to avoid resolving
  // it twice when the caller needed it anyway (resolution isn't a plain
  // buffer read - it walks the pseudo-state chain).
  func draw(on view: UIView, in context: CGContext, rect: CGRect, precomputedColor: UInt32? = nil) {
    drawAll(view: view, caLayer: nil, in: context, rect: rect, precomputedColor: precomputedColor)
  }

  /// `rect` is what the caller fills with the base color. Clip and positioning
  /// boxes come from the view's own border box, whatever inset `rect` carries.
  private func drawAll(view: UIView?, caLayer: CALayer?, in context: CGContext, rect: CGRect, precomputedColor: UInt32?) {
    let box = view?.bounds ?? caLayer?.bounds ?? rect
    let resolved = precomputedColor ?? style.resolvedBackgroundColor
    if resolved != 0 {
      // The color is clipped like the bottom-most layer.
      context.saveGState()
      if let clip = layers.last?.clip, clip != .borderBox {
        context.clip(to: box.inset(by: boxInsets(clip)))
      }
      context.setFillColor(UIColor.colorFromARGB(resolved).cgColor)
      context.fill(rect)
      context.restoreGState()
    }

    // Reverse so the first layer in the list is drawn on top.
    for bgLayer in layers.reversed() {
      context.saveGState()
      if bgLayer.clip != .borderBox {
        context.clip(to: box.inset(by: boxInsets(bgLayer.clip)))
      }
      context.setBlendMode(bgLayer.blendMode.cgBlendMode)
      if bgLayer.attachment == .fixed, let view = view { Background.fixedViews.add(view) }
      let (paintRect, area) = paintGeometry(for: bgLayer, view: view, rect: box)
      drawLayer(bgLayer, on: view, on: caLayer, in: context, paintRect: paintRect, area: area)
      context.restoreGState()
    }
  }

  /// Border (and padding) insets of `box` in points, from the node's computed layout (device px).
  private func boxInsets(_ box: BackgroundClip) -> UIEdgeInsets {
    if box == .borderBox { return .zero }
    let scale = CGFloat(NSCMason.scale)
    let l = style.node.computedLayout
    var top = CGFloat(l.borderTop)
    var left = CGFloat(l.borderLeft)
    var bottom = CGFloat(l.borderBottom)
    var right = CGFloat(l.borderRight)
    if box == .contentBox {
      top += CGFloat(l.paddingTop)
      left += CGFloat(l.paddingLeft)
      bottom += CGFloat(l.paddingBottom)
      right += CGFloat(l.paddingRight)
    }
    return UIEdgeInsets(top: top / scale, left: left / scale, bottom: bottom / scale, right: right / scale)
  }

  /// What to fill and the positioning area for one layer, in the caller's coordinates.
  private func paintGeometry(for layer: BackgroundLayer, view: UIView?, rect: CGRect) -> (paintRect: CGRect, area: CGRect) {
    switch layer.attachment {
    case .fixed:
      // Positioned against the app window; the origin box does not apply.
      if let view = view, let root = (view.window as UIView?) ?? style.node.getRootNode().view {
        return (rect, view.convert(root.bounds, from: root))
      }
      return (rect, rect)
    case .local:
      // The whole scrollable content, in the content coordinates a scrolled view draws in.
      var content: CGSize? = nil
      if let mv = view as? MasonUIView {
        content = mv.contentSize
      } else if let sv = view as? UIScrollView {
        content = sv.contentSize
      }
      if let view = view, let content = content {
        let full = CGRect(x: 0, y: 0, width: max(content.width, view.bounds.width), height: max(content.height, view.bounds.height))
        return (full, full.inset(by: boxInsets(layer.origin)))
      }
      return (rect, rect.inset(by: boxInsets(layer.origin)))
    case .scroll:
      return (rect, rect.inset(by: boxInsets(layer.origin)))
    }
  }

  private func drawLayer(_ layer: BackgroundLayer, on view: UIView?, on caLayer: CALayer?, in context: CGContext, paintRect: CGRect, area: CGRect) {
    // Draw layer color (before gradient or image)
    if let color = layer.backgroundColor {
      context.setFillColor(color.cgColor)
      context.fill(paintRect)
    }

    if layer.gradient != nil {
      drawGradient(layer: layer, context: context, paintRect: paintRect, area: area)
    }

    if let urlStr = layer.image {
      if let cached = layer.bitmap {
        drawBitmap(layer: layer, bitmap: cached, context: context, paintRect: paintRect, area: area)
      } else if let image = decodeDataUrlImage(url: urlStr) {
        layer.bitmap = image
        drawBitmap(layer: layer, bitmap: image, context: context, paintRect: paintRect, area: area)
      } else {
        loadImageAsync(url: urlStr) { image in
          layer.bitmap = image
          DispatchQueue.main.async {
            view?.setNeedsDisplay()
            caLayer?.setNeedsDisplay()
          }
        }
      }
    }
  }

  // MARK: - Gradient Drawing
  private func drawGradient(layer: BackgroundLayer, context: CGContext, paintRect: CGRect, area: CGRect) {
    guard let gradient = layer.gradient else { return }
    // A gradient is an image with no intrinsic size: `auto` is the positioning area.
    let (width, height) = resolveBitmapSize(layer.size, imgW: area.width, imgH: area.height, areaW: area.width, areaH: area.height)
    if width <= 0 || height <= 0 { return }

    // if size changed since last shader creation, clear cache
    if layer.shader != nil && (layer.shaderWidth != width || layer.shaderHeight != height) {
      layer.shader = nil
    }

    if layer.shader == nil {
      let (colors, locations) = parseGradientStops(gradient.stops)
      if colors.isEmpty { return }
      layer.shader = CGGradient(colorsSpace: deviceRGB, colors: colors as CFArray, locations: locations.isEmpty ? nil : locations)
      layer.shaderWidth = width
      layer.shaderHeight = height
    }
    guard let shader = layer.shader else { return }

    let options: CGGradientDrawingOptions = [.drawsBeforeStartLocation, .drawsAfterEndLocation]
    context.saveGState()
    context.clip(to: paintRect)
    forEachTile(layer, paintRect: paintRect, area: area, drawW: width, drawH: height) { x, y in
    context.saveGState()
    context.clip(to: CGRect(x: x, y: y, width: width, height: height))
    context.translateBy(x: x, y: y)
    switch gradient.type.lowercased() {
    case "linear":
      let (start, end) = linearGradientPoints(direction: gradient.direction, width: width, height: height)
      context.drawLinearGradient(shader, start: start, end: end, options: options)
    case "radial":
      let center = resolveRadialGradientCenter(direction: gradient.direction, width: width, height: height)
      // Radius must reach the farthest corner from the resolved centre.
      let radius = max([
        hypot(center.x, center.y),
        hypot(width - center.x, center.y),
        hypot(center.x, height - center.y),
        hypot(width - center.x, height - center.y)
      ].max() ?? max(width, height) / 2, 1)
      context.drawRadialGradient(shader, startCenter: center, startRadius: 0, endCenter: center, endRadius: radius, options: options)
    default:
      break
    }
    context.restoreGState()
    }
    context.restoreGState()
  }

  /// Visit each tile origin of a `drawW`x`drawH` image placed and repeated per the layer.
  private func forEachTile(_ layer: BackgroundLayer, paintRect: CGRect, area: CGRect, drawW: CGFloat, drawH: CGFloat, _ draw: (CGFloat, CGFloat) -> Void) {
    let pos = layer.position
    let x = area.minX + (pos?.x.resolve(area: area.width, drawSize: drawW) ?? 0)
    let y = area.minY + (pos?.y.resolve(area: area.height, drawSize: drawH) ?? 0)
    let repeatX = layer.repeatType == .repeatXY || layer.repeatType == .repeatX
    let repeatY = layer.repeatType == .repeatXY || layer.repeatType == .repeatY
    // Tiles start at the resolved position and extend both ways across the paint rect.
    let startX = repeatX ? x - ceil((x - paintRect.minX) / drawW) * drawW : x
    let startY = repeatY ? y - ceil((y - paintRect.minY) / drawH) * drawH : y
    let endX = repeatX ? paintRect.maxX : x + 1
    let endY = repeatY ? paintRect.maxY : y + 1
    var py = startY
    while py < endY {
      var px = startX
      while px < endX {
        draw(px, py)
        px += drawW
      }
      py += drawH
    }
  }

  // MARK: - Bitmap Drawing
  private func drawBitmap(layer: BackgroundLayer, bitmap: UIImage, context: CGContext, paintRect: CGRect, area: CGRect) {
    // Intrinsic size in points: a 1x image is 1 CSS px per pixel, a rasterized SVG keeps its point size.
    let (drawWidth, drawHeight) = resolveBitmapSize(layer.size, imgW: bitmap.size.width, imgH: bitmap.size.height, areaW: area.width, areaH: area.height)
    if drawWidth <= 0 || drawHeight <= 0 { return }

    // UIImage.draw keeps UIKit orientation in both UIView.draw and CALayer.draw(in:) contexts.
    context.saveGState()
    context.clip(to: paintRect)
    UIGraphicsPushContext(context)
    let blend = layer.blendMode.cgBlendMode
    forEachTile(layer, paintRect: paintRect, area: area, drawW: drawWidth, drawH: drawHeight) { px, py in
      bitmap.draw(in: CGRect(x: px, y: py, width: drawWidth, height: drawHeight), blendMode: blend, alpha: 1)
    }
    UIGraphicsPopContext()
    context.restoreGState()
  }
}

/// Resolve `background-size` against the positioning area (points), keeping the image ratio for `auto`.
func resolveBitmapSize(_ size: BackgroundSize?, imgW: CGFloat, imgH: CGFloat, areaW: CGFloat, areaH: CGFloat) -> (CGFloat, CGFloat) {
  guard let size = size, imgW > 0, imgH > 0 else { return (imgW, imgH) }
  let ratio = imgW / imgH
  switch size.keyword {
  case "cover":
    let scale = max(areaW / imgW, areaH / imgH)
    return (imgW * scale, imgH * scale)
  case "contain":
    let scale = min(areaW / imgW, areaH / imgH)
    return (imgW * scale, imgH * scale)
  default:
    break
  }
  let w = size.width.map { $0.fraction * areaW + $0.points }
  let h = size.height.map { $0.fraction * areaH + $0.points }
  switch (w, h) {
  case let (w?, h?): return (w, h)
  case let (w?, nil): return (w, w / ratio)
  case let (nil, h?): return (h * ratio, h)
  default: return (imgW, imgH)
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
  if let image = decodeDataUrlImage(url: url) {
    completion(image)
    return
  }

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

private func decodeDataUrlImage(url: String) -> UIImage? {
  guard url.range(of: "data:", options: [.caseInsensitive, .anchored]) != nil,
        let comma = url.firstIndex(of: ",") else {
    return nil
  }

  let meta = String(url[url.index(url.startIndex, offsetBy: 5)..<comma]).lowercased()
  let payload = String(url[url.index(after: comma)...])
  let data: Data?
  if meta.contains(";base64") {
    data = Data(base64Encoded: payload, options: .ignoreUnknownCharacters)
  } else {
    data = payload.removingPercentEncoding?.data(using: .utf8)
  }

  guard let imageData = data else { return nil }
  if meta.hasPrefix("image/svg+xml") {
    guard let svg = String(data: imageData, encoding: .utf8) else { return nil }
    return rasterizeSimpleSvg(svg)
  }
  return UIImage(data: imageData)
}

private func rasterizeSimpleSvg(_ svg: String) -> UIImage? {
  let dimensions = svgDimensions(svg)
  let viewBox = captureGroups(svgViewBoxRegex, in: svg)
  let vbX = CGFloat(Double(viewBox[safe: 0] ?? "") ?? 0)
  let vbY = CGFloat(Double(viewBox[safe: 1] ?? "") ?? 0)
  let vbW = CGFloat(Double(viewBox[safe: 2] ?? "") ?? Double(dimensions["width"] ?? 0))
  let vbH = CGFloat(Double(viewBox[safe: 3] ?? "") ?? Double(dimensions["height"] ?? 0))
  let imageWidth = max(CGFloat(dimensions["width"] ?? Float(vbW)), 1)
  let imageHeight = max(CGFloat(dimensions["height"] ?? Float(vbH)), 1)
  guard vbW > 0, vbH > 0 else { return nil }

  let fill = captureGroups(svgFillRegex, in: svg).first ?? "#000"
  let baseColor = parseColor(fill) ?? UIColor.black
  let fillOpacity = CGFloat(Double(captureGroups(svgFillOpacityRegex, in: svg).first ?? "") ?? 1)
  let color = baseColor.withAlphaComponent(baseColor.alphaComponent * min(max(fillOpacity, 0), 1))

  var drewPath = false
  let size = CGSize(width: imageWidth, height: imageHeight)
  let format = UIGraphicsImageRendererFormat.default()
  format.opaque = false
  let image = UIGraphicsImageRenderer(size: size, format: format).image { rendererContext in
    let cgContext = rendererContext.cgContext
    cgContext.setFillColor(color.cgColor)
    let range = NSRange(svg.startIndex..., in: svg)
    svgPathRegex.enumerateMatches(in: svg, options: [], range: range) { match, _, _ in
      guard let match = match,
            let pathDataRange = Range(match.range(at: 1), in: svg),
            let path = parseSimpleSvgPath(String(svg[pathDataRange])) else {
        return
      }
      path.apply(CGAffineTransform(a: imageWidth / vbW, b: 0, c: 0, d: imageHeight / vbH, tx: -vbX * imageWidth / vbW, ty: -vbY * imageHeight / vbH))
      path.fill()
      drewPath = true
    }
  }

  return drewPath ? image : nil
}

private func svgDimensions(_ svg: String) -> [String: Float] {
  var dimensions: [String: Float] = [:]
  let range = NSRange(svg.startIndex..., in: svg)
  svgDimensionRegex.enumerateMatches(in: svg, options: [], range: range) { match, _, _ in
    guard let match = match,
          let keyRange = Range(match.range(at: 1), in: svg),
          let valueRange = Range(match.range(at: 2), in: svg),
          let value = Float(svg[valueRange]) else {
      return
    }
    dimensions[String(svg[keyRange]).lowercased()] = value
  }
  return dimensions
}

private func captureGroups(_ regex: NSRegularExpression, in value: String) -> [String] {
  let range = NSRange(value.startIndex..., in: value)
  guard let match = regex.firstMatch(in: value, options: [], range: range) else { return [] }
  return (1..<match.numberOfRanges).compactMap { index in
    guard let groupRange = Range(match.range(at: index), in: value) else { return nil }
    return String(value[groupRange])
  }
}

private func parseSimpleSvgPath(_ data: String) -> UIBezierPath? {
  let tokens = svgPathTokens(data)
  guard !tokens.isEmpty else { return nil }

  let path = UIBezierPath()
  var index = 0
  var command: Character?
  var current = CGPoint.zero
  var subpathStart = CGPoint.zero
  var drew = false

  func isCommand(_ token: String) -> Bool {
    guard token.count == 1, let first = token.first else { return false }
    return "MmLlHhVvZz".contains(first)
  }

  func readNumber() -> CGFloat? {
    guard index < tokens.count, !isCommand(tokens[index]) else { return nil }
    defer { index += 1 }
    return CGFloat(Double(tokens[index]) ?? .nan)
  }

  while index < tokens.count {
    if isCommand(tokens[index]) {
      command = tokens[index].first
      index += 1
    }
    guard let activeCommand = command else { return nil }

    switch activeCommand {
    case "M", "m":
      var firstPoint = true
      while let xValue = readNumber(), let yValue = readNumber() {
        let point = activeCommand == "m"
          ? CGPoint(x: current.x + xValue, y: current.y + yValue)
          : CGPoint(x: xValue, y: yValue)
        if firstPoint {
          path.move(to: point)
          subpathStart = point
          firstPoint = false
        } else {
          path.addLine(to: point)
          drew = true
        }
        current = point
        if index < tokens.count, isCommand(tokens[index]) { break }
      }
      command = activeCommand == "m" ? "l" : "L"

    case "L", "l":
      while let xValue = readNumber(), let yValue = readNumber() {
        current = activeCommand == "l"
          ? CGPoint(x: current.x + xValue, y: current.y + yValue)
          : CGPoint(x: xValue, y: yValue)
        path.addLine(to: current)
        drew = true
        if index < tokens.count, isCommand(tokens[index]) { break }
      }

    case "H", "h":
      while let xValue = readNumber() {
        current.x = activeCommand == "h" ? current.x + xValue : xValue
        path.addLine(to: current)
        drew = true
        if index < tokens.count, isCommand(tokens[index]) { break }
      }

    case "V", "v":
      while let yValue = readNumber() {
        current.y = activeCommand == "v" ? current.y + yValue : yValue
        path.addLine(to: current)
        drew = true
        if index < tokens.count, isCommand(tokens[index]) { break }
      }

    case "Z", "z":
      path.close()
      current = subpathStart
      drew = true

    default:
      return nil
    }
  }

  return drew ? path : nil
}

private func svgPathTokens(_ data: String) -> [String] {
  let range = NSRange(data.startIndex..., in: data)
  return svgPathTokenRegex.matches(in: data, options: [], range: range).compactMap { match in
    guard let tokenRange = Range(match.range, in: data) else { return nil }
    return String(data[tokenRange])
  }
}

private extension UIColor {
  var alphaComponent: CGFloat {
    var alpha: CGFloat = 0
    getRed(nil, green: nil, blue: nil, alpha: &alpha)
    return alpha
  }
}

private extension Collection {
  subscript(safe index: Index) -> Element? {
    indices.contains(index) ? self[index] : nil
  }
}
