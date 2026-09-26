//
//  MasonShadowLayer.swift
//  Mason
//
//  CSS box-shadow rendering using CALayer
//

import UIKit

/// A sublayer that renders CSS box-shadow effects outside the view's bounds
class MasonShadowLayer: CALayer {
  
  weak var masonStyle: MasonStyle?

  /// Set once any shadow layer exists; until then there is nothing to sweep.
  static var anyCreated = false
  
  // Cache for invalidation
  private var cachedBounds: CGRect = .zero
  private var cachedShadowsHash: Int = 0
  private var cachedOutsetShadows: [BoxShadow] = []
  private var cachedOutsetHash: Int = 0
  
  override init() {
    super.init()
    setup()
  }
  
  init(style: MasonStyle) {
    self.masonStyle = style
    super.init()
    MasonShadowLayer.anyCreated = true
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
    masksToBounds = false
    isOpaque = false
    needsDisplayOnBoundsChange = true
    contentsScale = CGFloat(NSCMason.scale)
  }

  // Disable implicit CALayer animations so the shadow snaps with its item during
  // reflow instead of trailing behind (it's repositioned every layout pass).
  override func action(forKey event: String) -> CAAction? {
    return NSNull()
  }
  
  private func resolveOutsetShadows() -> [BoxShadow] {
    guard let style = masonStyle else { return [] }
    let h = style.boxShadows.hashValue
    if h != cachedOutsetHash {
      cachedOutsetHash = h
      cachedOutsetShadows = style.boxShadows.filter { !$0.inset }
    }
    return cachedOutsetShadows
  }

  /// Cover the shadow area around the view, mirroring the view layer's geometry
  /// (bounds, position, anchor, transform) so the shadow follows CSS transforms.
  /// The layer lives in the superview's layer, as a sibling below the view.
  func updateBounds(viewBounds: CGRect, viewLayer: CALayer) {
    guard let style = masonStyle else { return }

    let outsetShadows = resolveOutsetShadows()
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

    // `draw` centres the view rect in our bounds.
    let w = viewBounds.width
    let h = viewBounds.height
    let newBounds = CGRect(x: 0, y: 0, width: w + maxExpand * 2, height: h + maxExpand * 2)
    let a = viewLayer.anchorPoint
    let newAnchor = CGPoint(
      x: (a.x * w + maxExpand) / newBounds.width,
      y: (a.y * h + maxExpand) / newBounds.height
    )
    if bounds != newBounds { bounds = newBounds }
    if anchorPoint != newAnchor { anchorPoint = newAnchor }
    if position != viewLayer.position { position = viewLayer.position }
    if !CATransform3DEqualToTransform(transform, viewLayer.transform) { transform = viewLayer.transform }
    
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
    
    let outsetShadows = resolveOutsetShadows()
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
    
    // Inner clip = the element's EXACT shape (no inflation), so the opaque caster
    // fill is clipped precisely at the boundary and can't bleed into rounded
    // corners. Inflating the rect while keeping the radius drifts the arcs and
    // opens a corner gap.
    let innerClipPath: UIBezierPath
    if hasRadii {
      innerClipPath = style.mBorderRender.getClipPath(rect: viewRect, radius: style.mBorderRender.radius)
    } else {
      innerClipPath = UIBezierPath(rect: viewRect)
    }
    let reversedInner = innerClipPath.reversing()

    // Draw shadows in reverse order (first shadow ends up on top)
    for i in stride(from: outsetShadows.count - 1, through: 0, by: -1) {
      let shadow = outsetShadows[i]
      context.saveGState()

      let spread = shadow.spreadRadius

      // Calculate shadow shape bounds (expanded by spread)
      let shadowRect = CGRect(
        x: viewRect.origin.x - spread,
        y: viewRect.origin.y - spread,
        width: viewRect.width + spread * 2,
        height: viewRect.height + spread * 2
      )

      let shadowPath: UIBezierPath
      if spread == 0 {
        // Zero spread (common case): reuse the EXACT inner-clip path so caster ==
        // clip-exclusion and the fill can't bleed past rounded corners.
        shadowPath = innerClipPath
      } else if hasRadii {
        let adjustedRadius = adjustRadius(style.mBorderRender.radius, spread: spread, rect: shadowRect)
        shadowPath = style.mBorderRender.getClipPath(rect: shadowRect, radius: adjustedRadius)
      } else {
        shadowPath = UIBezierPath(rect: shadowRect)
      }

      // Set up shadow parameters
      let shadowColor = shadow.color.cgColor
      let shadowOffset = CGSize(width: shadow.offsetX, height: shadow.offsetY)
      let shadowBlur = shadow.blurRadius

      // Clip to area outside the view rect so only the shadow shows
      let clipPath = UIBezierPath(rect: bounds)
      clipPath.append(reversedInner)
      context.addPath(clipPath.cgPath)
      context.clip()

      // Fill with the shadow's own color at full opacity: the fill is clipped
      // away so only the blurred projection shows, and a translucent fill would
      // double-attenuate it. Using the shadow color (not black) avoids a black
      // anti-alias fringe at the clip edge.
      context.setShadow(offset: shadowOffset, blur: shadowBlur, color: shadowColor)
      let opaqueColor = shadow.color.withAlphaComponent(1.0).cgColor
      context.setFillColor(opaqueColor)
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
