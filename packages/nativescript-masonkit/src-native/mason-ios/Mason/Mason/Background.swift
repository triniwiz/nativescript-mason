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

  /// Paint one layer's image or gradient, positioned in `box` per its origin and tiled across
  /// `paintRect`, without the clip, color and blend `drawAll` adds. Masks render through this;
  /// `caLayer` is redisplayed when a remote image arrives.
  func drawLayerContent(_ layer: BackgroundLayer, caLayer: CALayer?, in context: CGContext, paintRect: CGRect, box: CGRect) {
    drawLayer(layer, on: nil, on: caLayer, in: context, paintRect: paintRect, area: box.inset(by: boxInsets(layer.origin)))
  }

  /// Border (and padding) insets of `box` in points, from the node's computed layout (device px).
  func boxInsets(_ box: BackgroundClip) -> UIEdgeInsets {
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
      if isSvgDataUrl(urlStr) {
        drawSvgLayer(layer, url: urlStr, context: context, paintRect: paintRect, area: area)
        return
      }
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
      let parsed = parseGradientStops(gradient.stops)
      if parsed.colors.isEmpty { return }
      var (colors, locations) = expandInterpolatedStops(parsed.colors, parsed.locations, gradient.interpolation)
      if gradient.repeating {
        (colors, locations) = unrollRepeatingStops(colors, locations)
      }
      layer.shader = CGGradient(colorsSpace: deviceRGB, colors: colors as CFArray, locations: locations.isEmpty ? nil : locations)
      layer.shaderColors = colors
      layer.shaderLocations = locations
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
    case "conic":
      drawConicGradient(context: context, colors: layer.shaderColors, locations: layer.shaderLocations,
                        direction: gradient.direction, width: width, height: height)
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

  // MARK: - SVG Drawing

  /// Rasterized at the drawn size and device scale so `background-size` stays sharp; cached on
  /// the layer until that size or `currentColor` changes.
  private func drawSvgLayer(_ layer: BackgroundLayer, url: String, context: CGContext, paintRect: CGRect, area: CGRect) {
    if layer.svgFailed { return }
    let doc: SvgDocument
    if let parsed = layer.svg {
      doc = parsed
    } else if let parsed = decodeSvgDataUrl(url) {
      layer.svg = parsed
      doc = parsed
    } else {
      layer.svgFailed = true
      return
    }
    // Intrinsic size in points: 1 SVG px is 1 CSS px.
    let (drawWidth, drawHeight) = resolveBitmapSize(layer.size, imgW: doc.width, imgH: doc.height, areaW: area.width, areaH: area.height)
    if drawWidth <= 0 || drawHeight <= 0 { return }
    let scale = max(CGFloat(NSCMason.scale), 1)
    let fit = min(1, maxSvgRasterPx / (max(drawWidth, drawHeight) * scale))
    let rasterSize = CGSize(width: drawWidth * fit, height: drawHeight * fit)
    let color = doc.usesCurrentColor ? style.resolvedColor : 0
    let bitmap: UIImage
    if let cached = layer.bitmap, layer.svgRasterSize == rasterSize, layer.svgColor == color {
      bitmap = cached
    } else {
      guard let image = renderSvgDocument(doc, size: rasterSize, scale: scale, currentColor: color) else { return }
      layer.bitmap = image
      layer.svgColor = color
      layer.svgRasterSize = rasterSize
      bitmap = image
    }
    drawBitmap(layer: layer, bitmap: bitmap, context: context, paintRect: paintRect, area: area, drawSize: (drawWidth, drawHeight))
  }

  // MARK: - Bitmap Drawing
  /// `drawSize`, when given, is the already-resolved tile size in points.
  private func drawBitmap(layer: BackgroundLayer, bitmap: UIImage, context: CGContext, paintRect: CGRect, area: CGRect, drawSize: (CGFloat, CGFloat)? = nil) {
    // Intrinsic size in points: a 1x image is 1 CSS px per pixel.
    let (drawWidth, drawHeight) = drawSize ?? resolveBitmapSize(layer.size, imgW: bitmap.size.width, imgH: bitmap.size.height, areaW: area.width, areaH: area.height)
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

/// A repeating gradient's stops tiled across 0...1: the first-to-last stop span repeats both
/// ways, with colours interpolated at the two ends so one CGGradient draws the whole line.
func unrollRepeatingStops(_ colors: [CGColor], _ locations: [CGFloat]) -> (colors: [CGColor], locations: [CGFloat]) {
  guard colors.count >= 2, colors.count == locations.count, let first = locations.first, let last = locations.last else {
    return (colors, locations)
  }
  let period = last - first
  // Nothing to repeat; CSS paints a flat average, which the last stop approximates.
  guard period > 1e-4 else { return (colors, locations) }
  var outColors: [CGColor] = []
  var outLocations: [CGFloat] = []
  // A tiny span would mean thousands of stops; past this many the bands are sub-pixel anyway.
  let maxStops = 4096
  var k = Int(floor((0 - first) / period))
  let kEnd = Int(ceil((1 - first) / period))
  outer: while k <= kEnd {
    let shift = CGFloat(k) * period
    for i in 0..<colors.count {
      if outColors.count >= maxStops { break outer }
      outColors.append(colors[i])
      outLocations.append(locations[i] + shift)
    }
    k += 1
  }
  var clippedColors: [CGColor] = [sampleGradient(outColors, outLocations, 0)]
  var clippedLocations: [CGFloat] = [0]
  for (c, l) in zip(outColors, outLocations) where l > 0 && l < 1 {
    clippedColors.append(c)
    clippedLocations.append(l)
  }
  clippedColors.append(sampleGradient(outColors, outLocations, 1))
  clippedLocations.append(1)
  return (clippedColors, clippedLocations)
}

/// The colour of a stop list at `t`, interpolated in sRGB like CGGradient.
func sampleGradient(_ colors: [CGColor], _ locations: [CGFloat], _ t: CGFloat) -> CGColor {
  guard let firstColor = colors.first, let lastColor = colors.last, let firstLoc = locations.first, let lastLoc = locations.last else {
    return UIColor.clear.cgColor
  }
  if t <= firstLoc { return firstColor }
  if t >= lastLoc { return lastColor }
  for i in 1..<locations.count where t <= locations[i] {
    let l0 = locations[i - 1], l1 = locations[i]
    let f = l1 - l0 > 1e-9 ? (t - l0) / (l1 - l0) : 1
    var r0: CGFloat = 0, g0: CGFloat = 0, b0: CGFloat = 0, a0: CGFloat = 0
    var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0
    UIColor(cgColor: colors[i - 1]).getRed(&r0, green: &g0, blue: &b0, alpha: &a0)
    UIColor(cgColor: colors[i]).getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
    return CGColor(srgbRed: r0 + (r1 - r0) * f, green: g0 + (g1 - g0) * f, blue: b0 + (b1 - b0) * f, alpha: a0 + (a1 - a0) * f)
  }
  return lastColor
}

/// A conic gradient over a `width` x `height` tile. CoreGraphics has none, so it is drawn as
/// thin wedges around the centre (about 2pt of arc each at the far corner).
private func drawConicGradient(context: CGContext, colors: [CGColor], locations: [CGFloat], direction: String?, width: CGFloat, height: CGFloat) {
  guard !colors.isEmpty else { return }
  var from: Double = 0
  var center = CGPoint(x: width / 2, y: height / 2)
  if let dir = direction?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
    var rest = dir
    var position: String? = nil
    if let at = dir.range(of: "at "), at.lowerBound == dir.startIndex || dir[dir.index(before: at.lowerBound)] == " " {
      position = String(dir[at.upperBound...]).trimmingCharacters(in: .whitespaces)
      rest = String(dir[..<at.lowerBound])
    }
    let tokens = rest.split(separator: " ").map(String.init)
    if let i = tokens.firstIndex(of: "from"), i + 1 < tokens.count, let turns = cssAngleInTurns(tokens[i + 1]) {
      from = turns
    }
    if let position = position, !position.isEmpty {
      center = resolvePositionKeywords(position, width: width, height: height)
    }
  }
  let radius = [
    hypot(center.x, center.y), hypot(width - center.x, center.y),
    hypot(center.x, height - center.y), hypot(width - center.x, height - center.y)
  ].max() ?? 1
  let segments = max(90, min(2048, Int(ceil(2 * .pi * radius / 2))))
  context.saveGState()
  // Abutting wedges would show anti-aliased seams, so they overlap instead; copying
  // inside a transparency layer keeps a translucent overlap from painting twice.
  context.beginTransparencyLayer(auxiliaryInfo: nil)
  context.setShouldAntialias(false)
  context.setBlendMode(.copy)
  for s in 0..<segments {
    let t0 = CGFloat(s) / CGFloat(segments)
    let t1 = CGFloat(s + 1) / CGFloat(segments)
    // CSS: 0deg points up and angles run clockwise; y grows downward here.
    let a0 = (Double(t0) + from) * 2 * .pi - .pi / 2
    // Overlap the next wedge slightly so no pixel falls between the two.
    let a1 = (Double(t1) + from) * 2 * .pi - .pi / 2 + 0.002
    context.move(to: center)
    context.addLine(to: CGPoint(x: center.x + radius * 1.5 * CGFloat(cos(a0)), y: center.y + radius * 1.5 * CGFloat(sin(a0))))
    context.addLine(to: CGPoint(x: center.x + radius * 1.5 * CGFloat(cos(a1)), y: center.y + radius * 1.5 * CGFloat(sin(a1))))
    context.closePath()
    context.setFillColor(sampleGradient(colors, locations, (t0 + t1) / 2))
    context.fillPath()
  }
  context.endTransparencyLayer()
  context.restoreGState()
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

  // Extract the portion after "at " (`at 30% 70%` alone has no shape before it)
  guard let atRange = dir.hasPrefix("at ") ? dir.range(of: "at ") : dir.range(of: " at ") else { return defaultCenter }
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

/// Largest SVG raster edge, in device pixels; anything bigger is drawn scaled up.
private let maxSvgRasterPx: CGFloat = 4096

func isSvgDataUrl(_ url: String) -> Bool {
  url.range(of: "data:image/svg", options: [.caseInsensitive, .anchored]) != nil
}

/// Payload bytes of a `data:` URL, and its lowercased media type and parameters.
private func decodeDataUrl(_ url: String) -> (meta: String, data: Data)? {
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
    // Lenient: a stray `%` (e.g. `width='100%'` in an unencoded SVG) stays as written.
    data = percentDecodeBytes(payload)
  }
  guard let bytes = data else { return nil }
  return (meta, bytes)
}

func decodeSvgDataUrl(_ url: String) -> SvgDocument? {
  guard let decoded = decodeDataUrl(url), let svg = String(data: decoded.data, encoding: .utf8) else { return nil }
  return parseSvgDocument(svg)
}

func decodeDataUrlImage(url: String) -> UIImage? {
  guard let decoded = decodeDataUrl(url) else { return nil }
  let meta = decoded.meta, imageData = decoded.data
  if meta.hasPrefix("image/svg+xml") {
    // Background layers draw SVG through `drawSvgLayer`; this is the intrinsic-size fallback.
    guard let svg = String(data: imageData, encoding: .utf8), let doc = parseSvgDocument(svg) else { return nil }
    return renderSvgDocument(doc, size: CGSize(width: doc.width, height: doc.height),
                             scale: max(CGFloat(NSCMason.scale), 1), currentColor: 0xFF00_0000)
  }
  return UIImage(data: imageData)
}

private func svgCGColor(_ paint: SvgPaint, opacity: CGFloat, currentColor: UInt32) -> CGColor {
  let argb: UInt32
  switch paint {
  case let .color(c): argb = c
  case .currentColor: argb = currentColor
  case .none: argb = 0
  }
  let a = CGFloat((argb >> 24) & 0xFF) / 255 * min(max(opacity, 0), 1)
  return CGColor(srgbRed: CGFloat((argb >> 16) & 0xFF) / 255, green: CGFloat((argb >> 8) & 0xFF) / 255,
                 blue: CGFloat(argb & 0xFF) / 255, alpha: a)
}

func svgCGPath(_ commands: [SvgPathCommand]) -> CGPath {
  let path = CGMutablePath()
  var hasPoint = false
  for c in commands {
    switch c {
    case let .move(x, y):
      path.move(to: CGPoint(x: x, y: y))
      hasPoint = true
    case let .line(x, y):
      if hasPoint { path.addLine(to: CGPoint(x: x, y: y)) }
    case let .cubic(x1, y1, x2, y2, x, y):
      if hasPoint { path.addCurve(to: CGPoint(x: x, y: y), control1: CGPoint(x: x1, y: y1), control2: CGPoint(x: x2, y: y2)) }
    case let .quad(x1, y1, x, y):
      if hasPoint { path.addQuadCurve(to: CGPoint(x: x, y: y), control: CGPoint(x: x1, y: y1)) }
    case .close:
      if hasPoint { path.closeSubpath() }
    }
  }
  return path
}

/// Rasterize `doc` at `size` points and `scale`; `currentColor` paints use `currentColor` (ARGB).
func renderSvgDocument(_ doc: SvgDocument, size: CGSize, scale: CGFloat, currentColor: UInt32) -> UIImage? {
  guard size.width > 0, size.height > 0, !doc.ops.isEmpty else { return nil }
  let format = UIGraphicsImageRendererFormat.default()
  format.opaque = false
  format.scale = scale
  return UIGraphicsImageRenderer(size: size, format: format).image { rendererContext in
    let cg = rendererContext.cgContext
    cg.concatenate(doc.viewportTransform(size.width, size.height))
    for op in doc.ops {
      switch op {
      case let .beginGroup(opacity):
        cg.saveGState()
        cg.setAlpha(opacity)
        cg.beginTransparencyLayer(auxiliaryInfo: nil)
      case .endGroup:
        cg.endTransparencyLayer()
        cg.restoreGState()
      case let .shape(shape):
        let path = svgCGPath(shape.commands)
        cg.saveGState()
        cg.concatenate(shape.transform)
        if shape.hasFill {
          cg.addPath(path)
          cg.setFillColor(svgCGColor(shape.fill, opacity: shape.fillOpacity, currentColor: currentColor))
          cg.fillPath(using: shape.evenOdd ? .evenOdd : .winding)
        }
        if shape.hasStroke {
          cg.addPath(path)
          cg.setStrokeColor(svgCGColor(shape.stroke, opacity: shape.strokeOpacity, currentColor: currentColor))
          cg.setLineWidth(shape.strokeWidth)
          switch shape.lineCap {
          case .butt: cg.setLineCap(.butt)
          case .round: cg.setLineCap(.round)
          case .square: cg.setLineCap(.square)
          }
          switch shape.lineJoin {
          case .miter: cg.setLineJoin(.miter)
          case .round: cg.setLineJoin(.round)
          case .bevel: cg.setLineJoin(.bevel)
          }
          cg.setMiterLimit(shape.miterLimit)
          if let dashes = shape.dashArray { cg.setLineDash(phase: shape.dashOffset, lengths: dashes) }
          cg.strokePath()
        }
        cg.restoreGState()
      }
    }
  }
}
