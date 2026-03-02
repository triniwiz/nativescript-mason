//
//  BoxShadowRenderer.swift
//  Mason
//
//  CSS box-shadow rendering for iOS using Core Graphics
//

import UIKit

/// Renders CSS box-shadow effects using Core Graphics
class BoxShadowRenderer {
  
  weak var style: MasonStyle?
  
  init(style: MasonStyle) {
    self.style = style
  }
  
  /// Draw outset (outer) box shadows
  func drawOutsetShadows(in context: CGContext, rect: CGRect, borderRenderer: CSSBorderRenderer) {
    guard let style = style else { return }
    let outsetShadows = style.boxShadows.filter { !$0.inset }
    if outsetShadows.isEmpty { return }
    
    let hasRadii = borderRenderer.hasRadii()
    
    // Draw shadows in reverse order (first shadow ends up on top)
    for shadow in outsetShadows.reversed() {
      context.saveGState()
      
      let spread = shadow.spreadRadius
      
      // Calculate shadow shape bounds (expanded by spread)
      let shadowRect = CGRect(
        x: rect.origin.x - spread,
        y: rect.origin.y - spread,
        width: rect.width + spread * 2,
        height: rect.height + spread * 2
      )
      
      // Create shadow path
      let shadowPath: UIBezierPath
      if hasRadii {
        // Adjust radii for spread
        let adjustedRadius = adjustRadius(borderRenderer.radius, spread: spread, rect: shadowRect)
        shadowPath = borderRenderer.getClipPath(rect: shadowRect, radius: adjustedRadius)
      } else {
        shadowPath = UIBezierPath(rect: shadowRect)
      }
      
      // Set up shadow parameters
      let shadowColor = shadow.color.cgColor
      let shadowOffset = CGSize(width: shadow.offsetX, height: shadow.offsetY)
      let shadowBlur = shadow.blurRadius
      
      // Create a large outer rect to ensure shadow is visible
      let outerExpand = shadowBlur * 3 + abs(shadow.offsetX) + abs(shadow.offsetY) + spread + 20
      let outerRect = rect.insetBy(dx: -outerExpand, dy: -outerExpand)
      
      // Clip to area outside the original shape to only show shadow
      let clipPath = UIBezierPath(rect: outerRect)
      let innerClipPath: UIBezierPath
      if hasRadii {
        innerClipPath = borderRenderer.getClipPath(rect: rect, radius: borderRenderer.radius)
      } else {
        innerClipPath = UIBezierPath(rect: rect)
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
  
  /// Draw inset (inner) box shadows
  func drawInsetShadows(in context: CGContext, rect: CGRect, borderRenderer: CSSBorderRenderer) {
    guard let style = style else { return }
    let insetShadows = style.boxShadows.filter { $0.inset }
    if insetShadows.isEmpty { return }
    
    let hasRadii = borderRenderer.hasRadii()
    
    // Draw shadows in reverse order (first shadow ends up on top)
    for shadow in insetShadows.reversed() {
      context.saveGState()
      
      // Clip to element bounds
      let clipPath: UIBezierPath
      if hasRadii {
        clipPath = borderRenderer.getClipPath(rect: rect, radius: borderRenderer.radius)
      } else {
        clipPath = UIBezierPath(rect: rect)
      }
      context.addPath(clipPath.cgPath)
      context.clip()
      
      let spread = shadow.spreadRadius
      
      // For inset shadows, we need to draw a shape that casts shadow inward
      // Create an outer frame that surrounds the element
      let frameExpand = shadow.blurRadius * 3 + abs(spread) + 40
      let outerRect = rect.insetBy(dx: -frameExpand, dy: -frameExpand)
      
      // Inner cutout (shrunk by spread)
      let innerRect = CGRect(
        x: rect.origin.x + spread,
        y: rect.origin.y + spread,
        width: rect.width - spread * 2,
        height: rect.height - spread * 2
      )
      
      let innerPath: UIBezierPath
      if hasRadii {
        let innerRadius = adjustRadius(borderRenderer.radius, spread: -spread, rect: innerRect)
        innerPath = borderRenderer.getClipPath(rect: innerRect, radius: innerRadius)
      } else {
        innerPath = UIBezierPath(rect: innerRect)
      }
      
      // Create frame path (outer - inner)
      let framePath = UIBezierPath(rect: outerRect)
      framePath.append(innerPath.reversing())
      
      // Apply shadow (inward direction)
      let shadowOffset = CGSize(width: shadow.offsetX, height: shadow.offsetY)
      context.setShadow(offset: shadowOffset, blur: shadow.blurRadius, color: shadow.color.cgColor)
      
      // Draw the frame
      context.addPath(framePath.cgPath)
      context.setFillColor(shadow.color.cgColor)
      context.fillPath()
      
      context.restoreGState()
    }
  }
  
  /// Adjust border radius by spread amount
  private func adjustRadius(_ radius: CSSBorderRenderer.BorderRadius, spread: CGFloat, rect: CGRect) -> CSSBorderRenderer.BorderRadius {
    func adjustCorner(_ corner: CSSBorderRenderer.CornerRadius) -> CSSBorderRenderer.CornerRadius {
      // Resolve the corner values first
      let resolved = corner.resolved(rect: rect)
      let newX = max(0, resolved.x + spread)
      let newY = max(0, resolved.y + spread)
      
      // Return new corner with Points values
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
