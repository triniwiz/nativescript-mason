//
//  MasonShadowLayer.swift
//  Mason
//
//  CSS box-shadow rendering using CALayer
//

import UIKit

/// A sublayer that renders CSS box-shadow effects outside the view's bounds
class MasonShadowLayer: CALayer {
  
  unowned var masonStyle: MasonStyle?
  
  // Cache for invalidation
  private var cachedBounds: CGRect = .zero
  private var cachedShadowsHash: Int = 0
  
  override init() {
    super.init()
    setup()
  }
  
  init(style: MasonStyle) {
    self.masonStyle = style
    super.init()
    setup()
  }
  
  override init(layer: Any) {
    if let other = layer as? MasonShadowLayer {
      self.masonStyle = other.masonStyle
    }
    super.init(layer: layer)
    setup()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  private func setup() {
    // Allow drawing outside bounds
    masksToBounds = false
    isOpaque = false
    needsDisplayOnBoundsChange = true
    contentsScale = UIScreen.main.scale
  }
  
  /// Update the layer to match the view's frame (in superview coordinates) plus shadow expansion
  func updateBounds(viewBounds: CGRect, viewFrame: CGRect) {
    guard let style = masonStyle else { return }
    
    let outsetShadows = style.boxShadows.filter { !$0.inset }
    if outsetShadows.isEmpty {
      isHidden = true
      return
    }
    
    isHidden = false
    
    // Calculate max shadow expansion
    var maxExpand: CGFloat = 0
    for shadow in outsetShadows {
      let expand = shadow.blurRadius * 3 + abs(shadow.offsetX) + abs(shadow.offsetY) + shadow.spreadRadius
      maxExpand = max(maxExpand, expand)
    }
    maxExpand += 20 // Extra padding
    
    // Position layer to cover shadow area (in superview coordinates)
    let expandedFrame = viewFrame.insetBy(dx: -maxExpand, dy: -maxExpand)
    if frame != expandedFrame {
      frame = expandedFrame
    }
    
    // Check if we need to redraw
    let shadowsHash = style.boxShadows.hashValue
    if cachedBounds != viewBounds || cachedShadowsHash != shadowsHash {
      cachedBounds = viewBounds
      cachedShadowsHash = shadowsHash
      setNeedsDisplay()
    }
  }
  
  override func draw(in context: CGContext) {
    guard let style = masonStyle else { return }
    
    let outsetShadows = style.boxShadows.filter { !$0.inset }
    if outsetShadows.isEmpty { return }
    
    // The view's rect within our expanded bounds
    let viewRect = CGRect(
      x: bounds.width / 2 - cachedBounds.width / 2,
      y: bounds.height / 2 - cachedBounds.height / 2,
      width: cachedBounds.width,
      height: cachedBounds.height
    )
    
    style.mBorderRender.resolve(for: cachedBounds)
    let hasRadii = style.mBorderRender.hasRadii()
    
    // Draw shadows in reverse order (first shadow ends up on top)
    for shadow in outsetShadows.reversed() {
      context.saveGState()
      
      let spread = shadow.spreadRadius
      
      // Calculate shadow shape bounds (expanded by spread)
      let shadowRect = CGRect(
        x: viewRect.origin.x - spread,
        y: viewRect.origin.y - spread,
        width: viewRect.width + spread * 2,
        height: viewRect.height + spread * 2
      )
      
      // Create shadow path
      let shadowPath: UIBezierPath
      if hasRadii {
        let adjustedRadius = adjustRadius(style.mBorderRender.radius, spread: spread, rect: shadowRect)
        shadowPath = style.mBorderRender.getClipPath(rect: shadowRect, radius: adjustedRadius)
      } else {
        shadowPath = UIBezierPath(rect: shadowRect)
      }
      
      // Set up shadow parameters
      let shadowColor = shadow.color.cgColor
      let shadowOffset = CGSize(width: shadow.offsetX, height: shadow.offsetY)
      let shadowBlur = shadow.blurRadius
      
      // Clip to area outside the view rect to only show shadow
      let clipPath = UIBezierPath(rect: bounds)
      let innerClipPath: UIBezierPath
      if hasRadii {
        innerClipPath = style.mBorderRender.getClipPath(rect: viewRect, radius: style.mBorderRender.radius)
      } else {
        innerClipPath = UIBezierPath(rect: viewRect)
      }
      clipPath.append(innerClipPath.reversing())
      context.addPath(clipPath.cgPath)
      context.clip()
      
      // Draw shadow
      context.setShadow(offset: shadowOffset, blur: shadowBlur, color: shadowColor)
      context.setFillColor(shadow.color.cgColor)
      context.addPath(shadowPath.cgPath)
      context.fillPath()
      
      context.restoreGState()
    }
  }
  
  /// Adjust border radius by spread amount
  private func adjustRadius(_ radius: CSSBorderRenderer.BorderRadius, spread: CGFloat, rect: CGRect) -> CSSBorderRenderer.BorderRadius {
    func adjustCorner(_ corner: CSSBorderRenderer.CornerRadius) -> CSSBorderRenderer.CornerRadius {
      let resolved = corner.resolved(rect: rect)
      let newX = max(0, resolved.x + spread)
      let newY = max(0, resolved.y + spread)
      return CSSBorderRenderer.CornerRadius(
        horizontal: .Points(Float(newX)),
        vertical: .Points(Float(newY)),
        exponent: corner.exponent
      )
    }
    
    return CSSBorderRenderer.BorderRadius(
      topLeft: adjustCorner(radius.topLeft),
      topRight: adjustCorner(radius.topRight),
      bottomRight: adjustCorner(radius.bottomRight),
      bottomLeft: adjustCorner(radius.bottomLeft)
    )
  }
}
