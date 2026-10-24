//
//  MasonShadowLayer.swift
//  Mason
//
//  CSS box-shadow rendering using CALayer
//

import UIKit

/// A sublayer that renders CSS box-shadow effects outside the view's bounds.
/// Under an opaque element each shadow is a Core Animation shadow on its own caster
/// sublayer. CSS never paints an outset shadow under the element, so a see-through one
/// gets a pre-blurred nine-slice image with the element cleared out instead: a mask
/// would do it too, but is rendered offscreen every frame.
class MasonShadowLayer: CALayer {
  
  weak var masonStyle: MasonStyle?

  private var casters: [CALayer] = []

  /// Set once any shadow layer exists; until then there is nothing to sweep.
  static var anyCreated = false
  
  // Cache for invalidation
  private var cachedBounds: CGRect = .zero
  private var cachedShadowsHash: Int = 0
  private var cachedRadius: CSSBorderRenderer.BorderRadius = .zero
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
    
    let shadowsHash = style.boxShadows.hashValue
    // The radius can arrive after the first layout; the casters and image follow it.
    style.mBorderRender.resolve(for: viewBounds)
    let radius = style.mBorderRender.radius
    if cachedBounds != viewBounds || cachedShadowsHash != shadowsHash || cachedRadius != radius {
      cachedBounds = viewBounds
      cachedShadowsHash = shadowsHash
      cachedRadius = radius
      updateCasters(style, outsetShadows)
    }
    updateMode(viewLayer: viewLayer)
  }

  /// Casters when the element covers the shadow under it, the cleared-out image otherwise.
  func updateMode(viewLayer: CALayer) {
    guard let style = masonStyle, cachedBounds.width > 0, cachedBounds.height > 0 else { return }
    let useImage = viewLayer.opacity < 1 || !style.paintsOpaqueBorderBox
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    defer { CATransaction.commit() }
    if useImage {
      if rasterBounds != cachedBounds || rasterShadowsHash != cachedShadowsHash || rasterRadius != cachedRadius {
        renderImage(style, resolveOutsetShadows())
      }
    } else if contents != nil {
      contents = nil
      rasterBounds = nil
    }
    for caster in casters where caster.isHidden != useImage { caster.isHidden = useImage }
  }

  private var rasterBounds: CGRect?
  private var rasterShadowsHash = 0
  private var rasterRadius: CSSBorderRenderer.BorderRadius = .zero

  private func renderImage(_ style: MasonStyle, _ shadows: [BoxShadow]) {
    rasterBounds = cachedBounds
    rasterShadowsHash = cachedShadowsHash
    rasterRadius = cachedRadius
    let w = cachedBounds.width
    let h = cachedBounds.height
    let e = (bounds.width - w) / 2
    let border = style.mBorderRender
    let radius = absoluteRadius(border.radius, w, h)

    // Past the corners and the blur, columns and rows stop changing along the edge, so one
    // stretchable point in the middle stands in for the rest of the box.
    var reach: CGFloat = 1
    for s in shadows {
      reach = max(reach, s.blurRadius * 1.5 + abs(s.spreadRadius) + max(abs(s.offsetX), abs(s.offsetY)) + 1)
    }
    let r = [radius.topLeft, radius.topRight, radius.bottomRight, radius.bottomLeft].map { $0.resolved(rect: cachedBounds) }
    let left = ceil(max(r[0].x, r[3].x) + reach)
    let right = ceil(max(r[1].x, r[2].x) + reach)
    let top = ceil(max(r[0].y, r[1].y) + reach)
    let bottom = ceil(max(r[3].y, r[2].y) + reach)
    let sliceX = w > left + right + 1
    let sliceY = h > top + bottom + 1
    let box = CGRect(x: e, y: e, width: sliceX ? left + right + 1 : w, height: sliceY ? top + bottom + 1 : h)
    let size = CGSize(width: box.width + e * 2, height: box.height + e * 2)

    let hasRadii = border.hasRadii()
    let format = UIGraphicsImageRendererFormat()
    format.scale = CGFloat(NSCMason.scale)
    format.opaque = false
    let image = UIGraphicsImageRenderer(size: size, format: format).image { ctx in
      let cg = ctx.cgContext
      // The fill is drawn off to the left and only its shadow moved back, as for inset shadows.
      let away = size.width
      for shadow in shadows.reversed() {
        let spread = shadow.spreadRadius
        let shape = box.insetBy(dx: -spread, dy: -spread)
        let path = hasRadii
          ? border.buildRoundedPath(in: shape, radius: adjustRadius(radius, spread: spread, rect: shape))
          : UIBezierPath(rect: shape)
        cg.saveGState()
        cg.setShadow(offset: CGSize(width: shadow.offsetX + away, height: shadow.offsetY), blur: shadow.blurRadius, color: shadow.color.cgColor)
        cg.translateBy(x: -away, y: 0)
        cg.addPath(path.cgPath)
        cg.setFillColor(UIColor.black.cgColor)
        cg.fillPath()
        cg.restoreGState()
      }
      cg.setBlendMode(.clear)
      cg.addPath((hasRadii ? border.buildRoundedPath(in: box, radius: radius) : UIBezierPath(rect: box)).cgPath)
      cg.fillPath()
    }
    contents = image.cgImage
    contentsScale = format.scale
    contentsGravity = .resize
    contentsCenter = CGRect(
      x: sliceX ? (e + left) / size.width : 0,
      y: sliceY ? (e + top) / size.height : 0,
      width: sliceX ? 1 / size.width : 1,
      height: sliceY ? 1 / size.height : 1
    )
  }

  /// The corners in points, scaled down as CSS does for this size, so a smaller box keeps them.
  private func absoluteRadius(_ radius: CSSBorderRenderer.BorderRadius, _ w: CGFloat, _ h: CGFloat) -> CSSBorderRenderer.BorderRadius {
    let rect = CGRect(x: 0, y: 0, width: w, height: h)
    let tl = radius.topLeft.resolved(rect: rect)
    let tr = radius.topRight.resolved(rect: rect)
    let br = radius.bottomRight.resolved(rect: rect)
    let bl = radius.bottomLeft.resolved(rect: rect)
    let ratio = max((tl.x + tr.x) / max(w, 1), (br.x + bl.x) / max(w, 1), (tl.y + bl.y) / max(h, 1), (tr.y + br.y) / max(h, 1))
    let f = ratio > 1 ? 1 / ratio : 1
    func corner(_ c: CSSBorderRenderer.CornerRadius, _ v: (x: CGFloat, y: CGFloat)) -> CSSBorderRenderer.CornerRadius {
      // `.Points` holds device pixels.
      CSSBorderRenderer.CornerRadius(
        horizontal: .Points(Float(v.x * f) * NSCMason.scale),
        vertical: .Points(Float(v.y * f) * NSCMason.scale),
        exponent: c.exponent
      )
    }
    return CSSBorderRenderer.BorderRadius(
      topLeft: corner(radius.topLeft, tl),
      topRight: corner(radius.topRight, tr),
      bottomRight: corner(radius.bottomRight, br),
      bottomLeft: corner(radius.bottomLeft, bl)
    )
  }

  private func updateCasters(_ style: MasonStyle, _ outsetShadows: [BoxShadow]) {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    defer { CATransaction.commit() }

    // The view's rect within our expanded bounds
    let viewRect = CGRect(
      x: bounds.width / 2 - cachedBounds.width / 2,
      y: bounds.height / 2 - cachedBounds.height / 2,
      width: cachedBounds.width,
      height: cachedBounds.height
    )
    
    style.mBorderRender.resolve(for: cachedBounds)
    let hasRadii = style.mBorderRender.hasRadii()
    
    // The element's exact shape. Inflating the rect while keeping the radius
    // drifts the arcs and opens a corner gap.
    let innerClipPath: UIBezierPath
    if hasRadii {
      innerClipPath = style.mBorderRender.getClipPath(rect: viewRect, radius: style.mBorderRender.radius)
    } else {
      innerClipPath = UIBezierPath(rect: viewRect)
    }

    while casters.count < outsetShadows.count {
      let caster = CALayer()
      caster.shadowOpacity = 1
      casters.append(caster)
      addSublayer(caster)
    }
    while casters.count > outsetShadows.count {
      casters.removeLast().removeFromSuperlayer()
    }

    // Later sublayers render on top, and the first CSS shadow is the topmost.
    for (index, shadow) in outsetShadows.reversed().enumerated() {
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
        // Zero spread (common case): reuse the EXACT element path so the fill
        // can't bleed past rounded corners.
        shadowPath = innerClipPath
      } else if hasRadii {
        let adjustedRadius = adjustRadius(style.mBorderRender.radius, spread: spread, rect: shadowRect)
        shadowPath = style.mBorderRender.getClipPath(rect: shadowRect, radius: adjustedRadius)
      } else {
        shadowPath = UIBezierPath(rect: shadowRect)
      }

      let caster = casters[index]
      caster.frame = bounds
      caster.shadowPath = shadowPath.cgPath
      caster.shadowColor = shadow.color.cgColor
      caster.shadowOffset = CGSize(width: shadow.offsetX, height: shadow.offsetY)
      // CSS blur is twice the Gaussian's standard deviation; shadowRadius is about one.
      caster.shadowRadius = shadow.blurRadius / 2
    }
  }
  
  /// Adjust border radius by spread amount
  private func adjustRadius(_ radius: CSSBorderRenderer.BorderRadius, spread: CGFloat, rect: CGRect) -> CSSBorderRenderer.BorderRadius {
    func adjustCorner(_ corner: CSSBorderRenderer.CornerRadius) -> CSSBorderRenderer.CornerRadius {
      let resolved = corner.resolved(rect: rect)
      let newX = max(0, resolved.x + spread)
      let newY = max(0, resolved.y + spread)
      // `.Points` holds device pixels.
      return CSSBorderRenderer.CornerRadius(
        horizontal: .Points(Float(newX) * NSCMason.scale),
        vertical: .Points(Float(newY) * NSCMason.scale),
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
