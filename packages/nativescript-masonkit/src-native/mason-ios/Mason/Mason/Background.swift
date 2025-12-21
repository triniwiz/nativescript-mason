//
//  Background.swift
//  Mason
//
//  Created by Osei Fortune on 19/11/2025.
//


import UIKit
import CoreGraphics

// MARK: - Background
extension Background {
  
  
  func draw(on layer: CALayer, in context: CGContext, rect: CGRect) {
    if let color = self.color {
      if(isActive){
        context.setFillColor(color.darker(by: 0.15).cgColor)
      }else {
        context.setFillColor(color.cgColor)
      }
      context.fill(rect)
    }
    
    for bgLayer in layers {
      drawLayer(bgLayer, on: nil, on: layer, in: context, rect: rect)
    }
  }
  
  func draw(on view: UIView, in context: CGContext, rect: CGRect) {
    if let color = self.color {
      if(isActive){
        context.setFillColor(color.darker(by: 0.15).cgColor)
      }else {
        context.setFillColor(color.cgColor)
      }
      context.fill(rect)
    }
    
    for layer in layers {
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
    if layer.shader == nil {
      let colors = gradient.stops.compactMap {
        colorMap[$0]?.cgColor ?? UIColor(css: $0)?.cgColor
      } as CFArray
      layer.shader = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: nil)
    }
    guard let shader = layer.shader else { return }
    
    switch gradient.type.lowercased() {
    case "linear":
      let (start, end) = linearGradientPoints(direction: gradient.direction, width: width, height: height)
      context.drawLinearGradient(shader, start: start, end: end, options: [])
    case "radial":
      let center = CGPoint(x: width/2, y: height/2)
      let radius = max(width, height) / 2
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
    let colors = gradient.stops
      .compactMap { parseColor($0)?.cgColor } as CFArray
    
    layer.shader = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                              colors: colors,
                              locations: nil)
  }
  
  guard let shader = layer.shader else { return }
  
  switch gradient.type.lowercased() {
  case "linear":
    let (start, end) = linearGradientPoints(direction: gradient.direction, width: width, height: height)
    context.drawLinearGradient(shader, start: start, end: end, options: [])
    
  case "radial":
    let center = CGPoint(x: width/2, y: height/2)
    let radius = max(width, height) / 2
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

// MARK: - Image Loading
func loadImageAsync(url: String, completion: @escaping (UIImage?) -> Void) {
  guard let u = URL(string: url) else {
    completion(nil)
    return
  }
  URLSession.shared.dataTask(with: u) { data, _, _ in
    guard let data = data else { completion(nil); return }
    completion(UIImage(data: data))
  }.resume()
}
