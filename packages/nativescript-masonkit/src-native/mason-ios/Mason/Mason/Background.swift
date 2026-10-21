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
      if isSvgSource(urlStr) {
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
    let (width, height) = roundedTileSize(layer, area: area, resolveBitmapSize(layer.size, imgW: area.width, imgH: area.height, areaW: area.width, areaH: area.height))
    if width <= 0 || height <= 0 { return }

    // if size changed since last shader creation, clear cache
    if layer.shader != nil && (layer.shaderWidth != width || layer.shaderHeight != height) {
      layer.shader = nil
    }

    let kind = gradient.type.lowercased()
    var lineStart = CGPoint.zero, lineEnd = CGPoint.zero
    var radial = RadialGradientShape(center: .zero, rx: 1, ry: 1)
    // Stops placed with a length are fractions of this.
    var lineLength: CGFloat = 0
    switch kind {
    case "linear":
      (lineStart, lineEnd) = linearGradientPoints(direction: gradient.direction, width: width, height: height)
      lineLength = hypot(lineEnd.x - lineStart.x, lineEnd.y - lineStart.y)
    case "radial":
      radial = resolveRadialGradientShape(direction: gradient.direction, width: width, height: height)
      lineLength = radial.rx
    default:
      break
    }

    if layer.shader == nil {
      let parsed = parseGradientStops(gradient.stops, lineLength: lineLength)
      if parsed.colors.isEmpty { return }
      var (colors, locations) = expandInterpolatedStops(parsed.colors, parsed.locations, gradient.interpolation)
      layer.shaderExtent = 1
      if kind == "radial" {
        // Past its ending shape a radial runs on to its last stop, or repeats, up to the farthest corner.
        let corner = radial.farthestCornerScale(width: width, height: height)
        var extent = max(1, gradient.repeating ? corner : min(locations.last ?? 1, corner))
        // CoreGraphics extends a hard stop at the very end with its first colour, not its last.
        if !gradient.repeating, locations.count >= 2, locations[locations.count - 2] == locations[locations.count - 1],
           locations[locations.count - 1] >= extent { extent *= 1.001 }
        if extent > 1 { locations = locations.map { $0 / extent } }
        layer.shaderExtent = extent
      }
      if gradient.repeating {
        (colors, locations) = unrollRepeatingStops(colors, locations)
      } else {
        (colors, locations) = clipStopsToUnit(colors, locations)
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
    switch kind {
    case "linear":
      context.drawLinearGradient(shader, start: lineStart, end: lineEnd, options: options)
    case "radial":
      // An ellipse is a circle of radius rx, squashed vertically about the centre.
      context.translateBy(x: radial.center.x, y: radial.center.y)
      context.scaleBy(x: 1, y: radial.ry / radial.rx)
      context.drawRadialGradient(shader, startCenter: .zero, startRadius: 0, endCenter: .zero,
                                 endRadius: radial.rx * layer.shaderExtent, options: options)
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
    let offsetX = pos?.x.resolve(area: area.width, drawSize: drawW) ?? 0
    let offsetY = pos?.y.resolve(area: area.height, drawSize: drawH) ?? 0
    let xs = backgroundTileStarts(layer.repeatType.x, areaStart: area.minX, areaLength: area.width,
                                  clipStart: paintRect.minX, clipEnd: paintRect.maxX, tile: drawW, offset: offsetX)
    let ys = backgroundTileStarts(layer.repeatType.y, areaStart: area.minY, areaLength: area.height,
                                  clipStart: paintRect.minY, clipEnd: paintRect.maxY, tile: drawH, offset: offsetY)
    for py in ys {
      for px in xs { draw(px, py) }
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
    } else if let parsed = decodeSvgSource(url) {
      layer.svg = parsed
      doc = parsed
    } else {
      layer.svgFailed = true
      return
    }
    // Intrinsic size in points: 1 SVG px is 1 CSS px.
    let (drawWidth, drawHeight) = roundedTileSize(layer, area: area, resolveBitmapSize(layer.size, imgW: doc.width, imgH: doc.height, areaW: area.width, areaH: area.height))
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
    let (drawWidth, drawHeight) = drawSize ?? roundedTileSize(layer, area: area, resolveBitmapSize(layer.size, imgW: bitmap.size.width, imgH: bitmap.size.height, areaW: area.width, areaH: area.height))
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

/// `round` scales the tile so a whole number of tiles fills the area. When the other axis is
/// not `round` and its size is `auto`, it scales too, keeping the tile's ratio.
func roundedTileSize(_ layer: BackgroundLayer, area: CGRect, _ size: (CGFloat, CGFloat)) -> (CGFloat, CGFloat) {
  var (w, h) = size
  let rep = layer.repeatType
  let autoW = layer.size == nil || (layer.size?.keyword == nil && layer.size?.width == nil)
  let autoH = layer.size == nil || (layer.size?.keyword == nil && layer.size?.height == nil)
  if rep.x == .round && w > 0 && area.width > 0 {
    let old = w
    w = area.width / max(1, (area.width / w).rounded())
    if autoH && rep.y != .round { h *= w / old }
  }
  if rep.y == .round && h > 0 && area.height > 0 {
    let old = h
    h = area.height / max(1, (area.height / h).rounded())
    if autoW && rep.x != .round { w *= h / old }
  }
  return (w, h)
}

/// Where a layer's tiles start along one axis. `space` spreads whole tiles so the first and
/// last touch the area's edges (one tile at `offset` when two don't fit).
func backgroundTileStarts(_ style: RepeatStyle, areaStart: CGFloat, areaLength: CGFloat, clipStart: CGFloat,
                          clipEnd: CGFloat, tile: CGFloat, offset: CGFloat) -> [CGFloat] {
  guard tile > 0 else { return [] }
  if style == .noRepeat { return [areaStart + offset] }
  // Past this many the tiles are sub-pixel anyway.
  let maxTiles = 4096
  var step = tile
  var first: CGFloat
  if style == .space {
    let n = Int(floor(areaLength / tile + 1e-4))
    if n <= 1 { return [areaStart + offset] }
    step = tile + (areaLength - CGFloat(n) * tile) / CGFloat(n - 1)
    first = areaStart - ceil(max(0, areaStart - clipStart) / step) * step
  } else {
    first = areaStart + offset
    first -= ceil((first - clipStart) / tile) * tile
  }
  var starts: [CGFloat] = []
  var s = first
  while s < clipEnd && starts.count < maxTiles {
    starts.append(s)
    s += step
  }
  return starts
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

/// The CSS gradient line for a `width` x `height` box.
func linearGradientPoints(direction: String?, width: CGFloat, height: CGFloat) -> (CGPoint, CGPoint) {
  let (dx, dy) = linearGradientDirection(direction, width: width, height: height)
  let half = (abs(width * dx) + abs(height * dy)) / 2
  let cx = width / 2
  let cy = height / 2
  return (CGPoint(x: cx - dx * half, y: cy - dy * half), CGPoint(x: cx + dx * half, y: cy + dy * half))
}

/// Unit vector of the gradient line (y down); `to bottom` when unset or unreadable.
private func linearGradientDirection(_ direction: String?, width: CGFloat, height: CGFloat) -> (CGFloat, CGFloat) {
  let dir = direction?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""
  if dir.hasPrefix("to ") {
    var x: CGFloat = 0
    var y: CGFloat = 0
    for word in dir.dropFirst(3).split(separator: " ") {
      switch word {
      case "top": y = -1
      case "bottom": y = 1
      case "left": x = -1
      case "right": x = 1
      default: return (0, 1)
      }
    }
    if x != 0 && y != 0 {
      let n = hypot(width, height)
      return n > 0 ? (x * height / n, y * width / n) : (0, 1)
    }
    return x == 0 && y == 0 ? (0, 1) : (x, y)
  }
  guard let turns = cssAngleInTurns(dir) else { return (0, 1) }
  let rad = CGFloat(turns) * 2 * .pi
  return (sin(rad), -cos(rad))
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
      // Rounding can put a period's first stop a hair before the last one's end.
      outLocations.append(max(locations[i] + shift, outLocations.last ?? -.greatestFiniteMagnitude))
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

/// Stops placed outside 0...1 cut to that range, with the colours at the two ends sampled.
func clipStopsToUnit(_ colors: [CGColor], _ locations: [CGFloat]) -> (colors: [CGColor], locations: [CGFloat]) {
  guard colors.count == locations.count, let first = locations.first, let last = locations.last,
        first < 0 || last > 1 else { return (colors, locations) }
  var outColors: [CGColor] = []
  var outLocations: [CGFloat] = []
  // A stop exactly at an end already holds the colour past it, which a sample would not.
  if !locations.contains(0) {
    outColors.append(sampleGradient(colors, locations, 0))
    outLocations.append(0)
  }
  for (c, l) in zip(colors, locations) where l >= 0 && l <= 1 {
    outColors.append(c)
    outLocations.append(l)
  }
  if !locations.contains(1) {
    outColors.append(sampleGradient(colors, locations, 1))
    outLocations.append(1)
  }
  return (outColors, outLocations)
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

/// A radial gradient's centre and ending shape radii, in points.
struct RadialGradientShape: Equatable {
  var center: CGPoint
  var rx: CGFloat
  var ry: CGFloat

  /// How many ending shapes it takes to reach the box corner farthest from the centre.
  func farthestCornerScale(width: CGFloat, height: CGFloat) -> CGFloat {
    let dx = max(center.x, width - center.x)
    let dy = max(center.y, height - center.y)
    return hypot(dx / rx, dy / ry)
  }
}

/// The ending shape of `radial-gradient(<shape> <size> at <position>, ...)` per CSS Images 3:
/// `circle` or `ellipse`, a size keyword (default `farthest-corner`) or explicit radii.
func resolveRadialGradientShape(direction: String?, width: CGFloat, height: CGFloat) -> RadialGradientShape {
  let center = resolveRadialGradientCenter(direction: direction, width: width, height: height)
  var prelude = direction?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""
  if prelude.hasPrefix("at ") {
    prelude = ""
  } else if let at = prelude.range(of: " at ") {
    prelude = String(prelude[..<at.lowerBound])
  }
  var circle = false, ellipse = false
  var keyword = "farthest-corner"
  var radii: [CGFloat] = []
  for token in prelude.split(separator: " ").map(String.init) {
    switch token {
    case "circle": circle = true
    case "ellipse": ellipse = true
    case "closest-side", "closest-corner", "farthest-side", "farthest-corner": keyword = token
    default:
      switch parseLengthPercentage(token) {
      case .Points(let px)?: radii.append(CGFloat(px) / CGFloat(NSCMason.scale))
      case .Percent(let f)?: radii.append(CGFloat(f) * (radii.isEmpty ? width : height))
      default: break
      }
    }
  }
  // One length and no shape keyword is a circle.
  if !ellipse && radii.count == 1 { circle = true }
  let minRadius: CGFloat = 0.01
  if circle, let r = radii.first {
    return RadialGradientShape(center: center, rx: max(r, minRadius), ry: max(r, minRadius))
  }
  if !circle && radii.count >= 2 {
    return RadialGradientShape(center: center, rx: max(radii[0], minRadius), ry: max(radii[1], minRadius))
  }
  let closest = keyword.hasPrefix("closest")
  let sx = closest ? min(center.x, width - center.x) : max(center.x, width - center.x)
  let sy = closest ? min(center.y, height - center.y) : max(center.y, height - center.y)
  var rx: CGFloat, ry: CGFloat
  if circle {
    let r = keyword.hasSuffix("corner") ? hypot(sx, sy) : (closest ? min(sx, sy) : max(sx, sy))
    rx = r
    ry = r
  } else {
    // A corner ellipse keeps the side ellipse's aspect ratio and passes through the corner.
    let k: CGFloat = keyword.hasSuffix("corner") ? sqrt(2) : 1
    rx = sx * k
    ry = sy * k
  }
  return RadialGradientShape(center: center, rx: max(rx, minRadius), ry: max(ry, minRadius))
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
/// Parse gradient stop strings (e.g. "transparent 66%", "red 20px", "rgba(0,0,0,0.5)").
/// Returns parallel arrays of CGColor and CGFloat positions following CSS inference rules.
/// A length is placed as a fraction of `lineLength` (points), and is unplaced without one.
func parseGradientStops(_ stops: [String], lineLength: CGFloat = 0) -> (colors: [CGColor], locations: [CGFloat]) {
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
      } else if lineLength > 0, case .Points(let px)? = parseLengthPercentage(posPart) {
        position = CGFloat(px) / CGFloat(NSCMason.scale) / lineLength
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
    // A stop placed before an earlier one moves up to it.
    var furthest = -CGFloat.greatestFiniteMagnitude
    for k in 0..<n {
      guard let p = parsedPositions[k] else { continue }
      if p < furthest { parsedPositions[k] = furthest } else { furthest = p }
    }
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
/// `~/` is the NativeScript app folder and a bare absolute path is a file, as on the other platforms.
func resolveImageURL(_ source: String) -> URL? {
  if source.hasPrefix("~/") {
    return URL(fileURLWithPath: Bundle.main.bundlePath + "/app/" + source.dropFirst(2))
  }
  if source.hasPrefix("/") { return URL(fileURLWithPath: source) }
  return URL(string: source)
}

func loadImageAsync(url: String, completion: @escaping (UIImage?) -> Void) {
  if let image = decodeDataUrlImage(url: url) {
    completion(image)
    return
  }

  if url.hasPrefix("res://") {
    completion(UIImage(named: String(url.dropFirst("res://".count))))
    return
  }
  guard let u = resolveImageURL(url) else {
    completion(nil)
    return
  }
  if u.isFileURL {
    completion(UIImage(contentsOfFile: u.path))
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

/// A data URL or local file (`~/`, absolute path) holding SVG.
func isSvgSource(_ url: String) -> Bool {
  if isSvgDataUrl(url) { return true }
  guard let u = resolveImageURL(url), u.isFileURL else { return false }
  return u.pathExtension.lowercased() == "svg"
}

func decodeSvgSource(_ url: String) -> SvgDocument? {
  if isSvgDataUrl(url) { return decodeSvgDataUrl(url) }
  guard let u = resolveImageURL(url), u.isFileURL, let text = try? String(contentsOf: u, encoding: .utf8) else { return nil }
  return parseSvgDocument(text)
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
  default: argb = 0
  }
  return svgCGColor(argb: argb, opacity: opacity)
}

private func svgCGColor(argb: UInt32, opacity: CGFloat) -> CGColor {
  let a = CGFloat((argb >> 24) & 0xFF) / 255 * min(max(opacity, 0), 1)
  return CGColor(srgbRed: CGFloat((argb >> 16) & 0xFF) / 255, green: CGFloat((argb >> 8) & 0xFF) / 255,
                 blue: CGFloat(argb & 0xFF) / 255, alpha: a)
}

private func svgStopColor(_ stop: SvgGradientStop, currentColor: UInt32) -> CGColor {
  guard stop.currentColor else { return svgCGColor(argb: stop.argb, opacity: 1) }
  return svgCGColor(argb: currentColor, opacity: CGFloat((stop.argb >> 24) & 0xFF) / 255)
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

/// Stops over periods `lo..<hi` of a reflected or repeated gradient, in 0...1.
private func svgPeriodicStops(_ stops: [SvgGradientStop], _ spread: SvgSpread, _ lo: Int, _ hi: Int) -> [SvgGradientStop] {
  let span = CGFloat(hi - lo)
  var out: [SvgGradientStop] = []
  for k in lo..<hi {
    let reversed = spread == .reflect && ((k % 2) + 2) % 2 == 1
    let period = reversed ? stops.reversed().map { s -> SvgGradientStop in var r = s; r.offset = 1 - s.offset; return r } : stops
    for s in period {
      var e = s
      e.offset = (CGFloat(k - lo) + s.offset) / span
      out.append(e)
    }
  }
  return out
}

/// Draws `g` over the current clip; reflect and repeat are unrolled over the clipped area.
private func drawSvgGradient(_ cg: CGContext, _ g: SvgGradient, opacity: CGFloat, currentColor: UInt32) {
  cg.saveGState()
  defer { cg.restoreGState() }
  cg.concatenate(g.transform)
  cg.setAlpha(min(max(opacity, 0), 1))
  let box = cg.boundingBoxOfClipPath
  guard !box.isNull, !box.isInfinite else { return }
  let corners = [CGPoint(x: box.minX, y: box.minY), CGPoint(x: box.maxX, y: box.minY),
                 CGPoint(x: box.minX, y: box.maxY), CGPoint(x: box.maxX, y: box.maxY)]
  let maxPeriods = 256
  var stops = g.stops
  let space = CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB()
  func gradient() -> CGGradient? {
    CGGradient(colorsSpace: space, colors: stops.map { svgStopColor($0, currentColor: currentColor) } as CFArray,
               locations: stops.map { $0.offset })
  }

  if !g.radial {
    var start = CGPoint(x: g.x1, y: g.y1), end = CGPoint(x: g.x2, y: g.y2)
    if g.spread != .pad {
      let dx = g.x2 - g.x1, dy = g.y2 - g.y1, len2 = dx * dx + dy * dy
      let ts = corners.map { (($0.x - g.x1) * dx + ($0.y - g.y1) * dy) / len2 }
      var lo = Int(floor(ts.min() ?? 0)), hi = Int(ceil(ts.max() ?? 1))
      if hi <= lo { hi = lo + 1 }
      if hi - lo > maxPeriods { lo = max(lo, -maxPeriods / 2); hi = min(hi, lo + maxPeriods) }
      stops = svgPeriodicStops(g.stops, g.spread, lo, hi)
      start = CGPoint(x: g.x1 + CGFloat(lo) * dx, y: g.y1 + CGFloat(lo) * dy)
      end = CGPoint(x: g.x1 + CGFloat(hi) * dx, y: g.y1 + CGFloat(hi) * dy)
    }
    guard let gr = gradient() else { return }
    cg.drawLinearGradient(gr, start: start, end: end, options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
    return
  }

  let f = CGPoint(x: g.fx, y: g.fy)
  var endCenter = CGPoint(x: g.cx, y: g.cy), endRadius = g.r
  if g.spread != .pad {
    // The circle for t has centre f + t (c - f) and radius t r; find the largest t at a corner.
    let ex = g.cx - g.fx, ey = g.cy - g.fy
    let a = ex * ex + ey * ey - g.r * g.r
    var tMax: CGFloat = 1
    if a < 0 {
      for p in corners {
        let qx = p.x - g.fx, qy = p.y - g.fy
        let qe = qx * ex + qy * ey
        let t = (qe - (qe * qe - a * (qx * qx + qy * qy)).squareRoot()) / a
        tMax = max(tMax, t)
      }
    }
    let hi = min(maxPeriods, Int(ceil(tMax)))
    stops = svgPeriodicStops(g.stops, g.spread, 0, hi)
    endCenter = CGPoint(x: g.fx + CGFloat(hi) * ex, y: g.fy + CGFloat(hi) * ey)
    endRadius = CGFloat(hi) * g.r
  }
  guard let gr = gradient() else { return }
  cg.drawRadialGradient(gr, startCenter: f, startRadius: 0, endCenter: endCenter, endRadius: endRadius,
                        options: [.drawsAfterEndLocation])
}

/// The union of `clip`'s paths, and the rule to fill it with.
private func svgClipPath(_ clip: SvgClip) -> (CGPath, CGPathFillRule) {
  let first = clip.paths.first?.evenOdd ?? false
  let mixed = clip.paths.contains { $0.evenOdd != first }
  if mixed, #available(iOS 16.0, *) {
    var acc: CGPath = CGMutablePath()
    for c in clip.paths {
      let path = CGMutablePath()
      path.addPath(svgCGPath(c.commands), transform: c.transform)
      let region = path.union(path, using: c.evenOdd ? .evenOdd : .winding)
      acc = acc.union(region, using: .winding)
    }
    return (acc, .winding)
  }
  let out = CGMutablePath()
  for c in clip.paths { out.addPath(svgCGPath(c.commands), transform: c.transform) }
  return (out, first ? .evenOdd : .winding)
}

private func drawSvgImage(_ cg: CGContext, _ image: SvgImage) {
  guard let ui = decodeDataUrlImage(url: image.href), ui.size.width > 0, ui.size.height > 0 else { return }
  let iw = ui.size.width, ih = ui.size.height
  // An auto side keeps the image's aspect ratio.
  let w = image.width ?? image.height.map { $0 * iw / ih } ?? iw
  let h = image.height ?? image.width.map { $0 * ih / iw } ?? ih
  cg.saveGState()
  defer { cg.restoreGState() }
  cg.concatenate(image.transform)
  cg.translateBy(x: image.x, y: image.y)
  if image.slice { cg.clip(to: CGRect(x: 0, y: 0, width: w, height: h)) }
  cg.concatenate(svgViewBoxTransform(CGRect(x: 0, y: 0, width: iw, height: ih), image.alignX, image.alignY, image.slice, w, h))
  ui.draw(in: CGRect(x: 0, y: 0, width: iw, height: ih), blendMode: .normal, alpha: min(max(image.opacity, 0), 1))
}

private func setSvgStrokeStyle(_ cg: CGContext, _ shape: SvgShape) {
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
      case let .beginClip(clip):
        cg.saveGState()
        let (path, rule) = svgClipPath(clip)
        cg.addPath(path)
        cg.clip(using: rule)
      case .endClip:
        cg.restoreGState()
      case let .image(image):
        drawSvgImage(cg, image)
      case let .shape(shape):
        let path = svgCGPath(shape.commands)
        cg.saveGState()
        cg.concatenate(shape.transform)
        if shape.hasFill {
          cg.addPath(path)
          if case let .gradient(g) = shape.fill {
            cg.saveGState()
            cg.clip(using: shape.evenOdd ? .evenOdd : .winding)
            drawSvgGradient(cg, g, opacity: shape.fillOpacity, currentColor: currentColor)
            cg.restoreGState()
          } else {
            cg.setFillColor(svgCGColor(shape.fill, opacity: shape.fillOpacity, currentColor: currentColor))
            cg.fillPath(using: shape.evenOdd ? .evenOdd : .winding)
          }
        }
        if shape.hasStroke {
          cg.addPath(path)
          setSvgStrokeStyle(cg, shape)
          if case let .gradient(g) = shape.stroke {
            cg.saveGState()
            cg.replacePathWithStrokedPath()
            cg.clip()
            drawSvgGradient(cg, g, opacity: shape.strokeOpacity, currentColor: currentColor)
            cg.restoreGState()
          } else {
            cg.setStrokeColor(svgCGColor(shape.stroke, opacity: shape.strokeOpacity, currentColor: currentColor))
            cg.strokePath()
          }
        }
        cg.restoreGState()
      }
    }
  }
}
