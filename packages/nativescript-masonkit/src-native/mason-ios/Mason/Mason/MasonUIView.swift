//
//  MasonView.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Foundation
import CoreText

@objcMembers
@objc(MasonUIView)
public class MasonUIView: UIView, MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener {
  func onStyleChange(_ low: UInt64, _ high: UInt64) {
    invalidateDrawFlags()
    MasonNode.invalidateDescendantTextViews(inheritedBy: node, low, high)
  }
  
  internal let maskPath = CGMutablePath()
  
  // Cached draw-state flags — updated on style change, not every frame
  internal var _cachedHasBackground = false
  internal var _cachedHasBoxShadow = false
  internal var _cachedHasBorder = false
  internal var _cachedHasFilter = false
  internal var _drawFlagsDirty = true
  
  internal func invalidateDrawFlags() {
    _drawFlagsDirty = true
    setNeedsDisplay()
    // Radius and shadows can change without a resize, so refresh what depends on them.
    guard bounds.width > 0, bounds.height > 0 else { return }
    updateOpacity()
    style.updateShadowLayer(for: CGRect(origin: .zero, size: bounds.size))
  }

  // An opaque backing store is only safe when the box fills its bounds.
  private func updateOpacity() {
    style.mBorderRender.resolve(for: bounds)
    let opaqueBackground = style.mBackground.map { bg in
      (style.resolvedBackgroundColor >> 24) == 0xFF && bg.layers.isEmpty
    } ?? false
    isOpaque = opaqueBackground && !style.mBorderRender.hasRadii() && style.boxShadows.isEmpty
  }
  
  private func updateDrawFlagsIfNeeded() {
    guard _drawFlagsDirty else { return }
    _drawFlagsDirty = false
    let bgString = style.background.trimmingCharacters(in: .whitespacesAndNewlines)
    _cachedHasBackground = !bgString.isEmpty || !style.mBackground.layers.isEmpty || style.resolvedBackgroundColor != 0
    _cachedHasBoxShadow = !style.boxShadows.isEmpty
    _cachedHasBorder = style.hasBorderImage || style.mBorderRender.hasVisibleBorder
    _cachedHasFilter = !style.resolvedFilterString.isEmpty
  }
  
  public override class var layerClass: AnyClass { MasonViewLayer.self }

  // `<li>` children draw their markers in this view's padding.
  private var hasListMarkers: Bool {
    for sv in subviews where (sv as? MasonText)?.type == .Li {
      return true
    }
    return false
  }

  // False for plain layout containers; MasonViewLayer then skips the backing store.
  internal var paintsContent: Bool {
    updateDrawFlagsIfNeeded()
    return _cachedHasBackground || _cachedHasBoxShadow || _cachedHasBorder || _cachedHasFilter || hasListMarkers
  }

  // True while the box is painted through CALayer properties instead of draw(_:).
  private var _usesLayerPaint = false

  /// Paint the box with CALayer properties and sublayers. Returns false, and clears them, when draw(_:) is needed.
  internal func applyLayerPaintIfEligible() -> Bool {
    // Nothing to paint is the degenerate case: every property cleared.
    let wanted: LayerPaint? = paintsContent ? layerPaint() : LayerPaint()
    guard let paint = wanted else {
      if contentMode != .redraw { contentMode = .redraw }
      if _usesLayerPaint {
        _usesLayerPaint = false
        layer.backgroundColor = nil
        layer.borderWidth = 0
        layer.borderColor = nil
        layer.cornerRadius = 0
        layer.maskedCorners = MasonUIView.allCorners
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        removeBorderLayer()
        setGradientLayer(nil, paint: nil)
        setSideLayers([])
        CATransaction.commit()
      }
      return false
    }
    _usesLayerPaint = true
    if layer.backgroundColor != paint.background { layer.backgroundColor = paint.background }
    if layer.cornerRadius != paint.radius { layer.cornerRadius = paint.radius }
    if layer.maskedCorners != paint.corners { layer.maskedCorners = paint.corners }
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    setGradientLayer(paint.gradient, paint: paint)
    // A layer's own border draws above its sublayers, so with children it moves to a bottom
    // sublayer; a clipping view keeps it, as CSS clips children inside the border.
    let clipsChildren = clipsToBounds || layer.mask != nil
    let useSublayer = paint.borderWidth > 0 && sublayersBesidesPaint() && !clipsChildren
    let ownWidth = useSublayer ? 0 : paint.borderWidth
    let ownColor = useSublayer ? nil : paint.borderColor
    if layer.borderWidth != ownWidth { layer.borderWidth = ownWidth }
    if layer.borderColor != ownColor { layer.borderColor = ownColor }
    if useSublayer {
      let border = _borderLayer ?? {
        let l = CALayer()
        l.name = "mason.border"
        _borderLayer = l
        return l
      }()
      if border.superlayer !== layer { layer.insertSublayer(border, at: paintLayerIndex()) }
      border.frame = CGRect(origin: .zero, size: bounds.size)
      border.borderWidth = paint.borderWidth
      border.borderColor = paint.borderColor
      border.cornerRadius = paint.radius
      border.maskedCorners = paint.corners
    } else {
      removeBorderLayer()
    }
    setSideLayers(paint.sides)
    CATransaction.commit()
    // Layer properties scale with the box; only size-dependent paint needs a redraw.
    let mode: UIView.ContentMode = paintDependsOnSize ? .redraw : .scaleToFill
    if contentMode != mode { contentMode = mode }
    return true
  }

  // Whether a resize changes what the layer paint sets.
  private var paintDependsOnSize: Bool {
    let border = style.mBorderRender
    return border.hasRadii() || _borderLayer?.superlayer != nil || !border.widthsIgnoreRect
      || _gradientLayer?.superlayer != nil || !_sideLayers.isEmpty
  }

  private static let allCorners: CACornerMask = [.layerMinXMinYCorner, .layerMaxXMinYCorner, .layerMaxXMaxYCorner, .layerMinXMaxYCorner]

  private var _borderLayer: CALayer?
  internal private(set) var _gradientLayer: CAGradientLayer?
  private var _sideLayers: [CAShapeLayer] = []

  private func removeBorderLayer() {
    if let border = _borderLayer, border.superlayer != nil {
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      border.removeFromSuperlayer()
      CATransaction.commit()
    }
  }

  private func isPaintLayer(_ l: CALayer) -> Bool {
    l === _borderLayer || l === _gradientLayer || _sideLayers.contains { $0 === l }
  }

  private func sublayersBesidesPaint() -> Bool {
    guard let sublayers = layer.sublayers else { return false }
    return sublayers.contains { !isPaintLayer($0) }
  }

  /// Index just above the gradient layer, where border layers go.
  private func paintLayerIndex() -> UInt32 {
    _gradientLayer?.superlayer === layer ? 1 : 0
  }

  private func setGradientLayer(_ gradient: LayerGradient?, paint: LayerPaint?) {
    guard let gradient = gradient, let paint = paint else {
      _gradientLayer?.removeFromSuperlayer()
      return
    }
    let g = _gradientLayer ?? {
      let l = CAGradientLayer()
      l.name = "mason.background"
      _gradientLayer = l
      return l
    }()
    if g.superlayer !== layer { layer.insertSublayer(g, at: 0) }
    g.frame = CGRect(origin: .zero, size: bounds.size)
    g.colors = gradient.colors
    g.locations = gradient.locations
    g.startPoint = gradient.start
    g.endPoint = gradient.end
    g.cornerRadius = paint.radius
    g.maskedCorners = paint.corners
    g.masksToBounds = paint.radius > 0
  }

  private func setSideLayers(_ sides: [(color: CGColor, path: CGPath)]) {
    while _sideLayers.count > sides.count { _sideLayers.removeLast().removeFromSuperlayer() }
    let base = paintLayerIndex()
    for (i, side) in sides.enumerated() {
      let shape: CAShapeLayer
      if i < _sideLayers.count {
        shape = _sideLayers[i]
      } else {
        shape = CAShapeLayer()
        shape.name = "mason.border"
        _sideLayers.append(shape)
      }
      if shape.superlayer !== layer { layer.insertSublayer(shape, at: base + UInt32(i)) }
      shape.frame = CGRect(origin: .zero, size: bounds.size)
      shape.fillColor = side.color
      shape.path = side.path
    }
  }

  // A border on the view's own layer has to move to a sublayer once something sits on top of it.
  public override func didAddSubview(_ subview: UIView) {
    super.didAddSubview(subview)
    if _usesLayerPaint && (layer.borderWidth > 0 || subview.layer.zPosition < 0) { layer.setNeedsDisplay() }
  }

  internal struct LayerGradient {
    var colors: [CGColor]
    var locations: [NSNumber]?
    var start: CGPoint
    var end: CGPoint
  }

  internal struct LayerPaint {
    var background: CGColor? = nil
    var borderWidth: CGFloat = 0
    var borderColor: CGColor? = nil
    var radius: CGFloat = 0
    var corners: CACornerMask = MasonUIView.allCorners
    var gradient: LayerGradient? = nil
    var sides: [(color: CGColor, path: CGPath)] = []
  }

  private func layerPaint() -> LayerPaint? {
    if _cachedHasFilter || hasListMarkers || style.hasBorderImage { return nil }
    if _cachedHasBoxShadow && style.boxShadows.contains(where: { $0.inset }) { return nil }
    var paint = LayerPaint()
    let bg = style.mBackground!
    if !bg.layers.isEmpty {
      guard let gradient = layerGradient(bg) else { return nil }
      paint.gradient = gradient
    }

    let border = style.mBorderRender
    border.resolve(for: bounds)
    let w = border.cachedWidths
    let sides = [border.top, border.right, border.bottom, border.left]
    let widths = [w.top, w.right, w.bottom, w.left]
    var visible = 0
    for (side, width) in zip(sides, widths) where width > 0 && side.style != .none && side.style != .hidden {
      if side.argb >> 24 > 0 { visible += 1 }
    }
    if visible == 4, widths.allSatisfy({ $0 == w.top }),
       sides.allSatisfy({ $0.style == .solid && $0.argb == border.top.argb }) {
      // A scroll container's sublayers scroll with its content.
      if isScrollContainer && sublayersBesidesPaint() { return nil }
      paint.borderWidth = w.top
      paint.borderColor = UIColor.cgColorFromARGB(border.top.argb)
    } else if visible != 0 {
      guard !border.hasRadii(), let shapes = sideBorderShapes(border) else { return nil }
      paint.sides = shapes
    }
    if isScrollContainer && (paint.gradient != nil || !paint.sides.isEmpty) { return nil }
    // A backdrop or a negative z-index child would go under paint sublayers.
    let borderSublayer = paint.borderWidth > 0 && sublayersBesidesPaint() && !(clipsToBounds || layer.mask != nil)
    if paint.gradient != nil || !paint.sides.isEmpty || borderSublayer {
      if !style.resolvedBackdropFilterString.isEmpty || subviews.contains(where: { $0.layer.zPosition < 0 }) { return nil }
    }

    if border.hasRadii() {
      guard let (radius, corners) = layerCornerRadius(border.radius) else { return nil }
      paint.radius = radius
      paint.corners = corners
    }

    let resolvedColor = style.resolvedBackgroundColor
    paint.background = resolvedColor == 0 ? nil : UIColor.cgColorFromARGB(resolvedColor)
    return paint
  }

  /// The one circular radius of the rounded corners, scaled as CSS scales overlapping radii.
  private func layerCornerRadius(_ r: CSSBorderRenderer.BorderRadius) -> (CGFloat, CACornerMask)? {
    let corners = [r.topLeft, r.topRight, r.bottomRight, r.bottomLeft]
    let masks: [CACornerMask] = [.layerMinXMinYCorner, .layerMaxXMinYCorner, .layerMaxXMaxYCorner, .layerMinXMaxYCorner]
    var value: CGFloat = 0
    var mask: CACornerMask = []
    var radii: [CGFloat] = [0, 0, 0, 0]
    for i in 0..<4 where corners[i] != .zero {
      let resolved = corners[i].resolved(rect: bounds)
      guard resolved.x == resolved.y else { return nil }
      if resolved.x <= 0 { continue }
      guard corners[i].exponent == 1, value == 0 || value == resolved.x else { return nil }
      value = resolved.x
      mask.insert(masks[i])
      radii[i] = resolved.x
    }
    if value == 0 { return (0, MasonUIView.allCorners) }
    let w = bounds.width
    let h = bounds.height
    var f: CGFloat = 1
    for (sum, side) in [(radii[0] + radii[1], w), (radii[3] + radii[2], w), (radii[0] + radii[3], h), (radii[1] + radii[2], h)] where sum > 0 {
      f = min(f, side / sum)
    }
    let radius = value * f
    guard radius <= min(w, h) / 2 + 0.001 else { return nil }
    return (radius, mask)
  }

  /// Square-cornered solid sides as one fill per color, split at the corners like draw(_:).
  private func sideBorderShapes(_ border: CSSBorderRenderer) -> [(color: CGColor, path: CGPath)]? {
    let w = border.cachedWidths
    let width = bounds.width
    let height = bounds.height
    guard w.left <= width / 2, w.right <= width / 2, w.top <= height / 2, w.bottom <= height / 2 else { return nil }
    let sides = [border.top, border.right, border.bottom, border.left]
    let widths = [w.top, w.right, w.bottom, w.left]
    let quads: [[CGPoint]] = [
      [CGPoint(x: 0, y: 0), CGPoint(x: width, y: 0), CGPoint(x: width - w.right, y: w.top), CGPoint(x: w.left, y: w.top)],
      [CGPoint(x: width, y: 0), CGPoint(x: width, y: height), CGPoint(x: width - w.right, y: height - w.bottom), CGPoint(x: width - w.right, y: w.top)],
      [CGPoint(x: 0, y: height), CGPoint(x: w.left, y: height - w.bottom), CGPoint(x: width - w.right, y: height - w.bottom), CGPoint(x: width, y: height)],
      [CGPoint(x: 0, y: 0), CGPoint(x: w.left, y: w.top), CGPoint(x: w.left, y: height - w.bottom), CGPoint(x: 0, y: height)],
    ]
    var order: [UInt32] = []
    var paths: [UInt32: CGMutablePath] = [:]
    for i in 0..<4 where widths[i] > 0 && sides[i].style != .none && sides[i].argb >> 24 > 0 {
      guard sides[i].style == .solid else { return nil }
      let argb = sides[i].argb
      let path = paths[argb] ?? {
        order.append(argb)
        let p = CGMutablePath()
        paths[argb] = p
        return p
      }()
      path.addLines(between: quads[i])
      path.closeSubpath()
    }
    return order.map { (UIColor.cgColorFromARGB($0), paths[$0]!) }
  }

  /// The only layer, when it is a linear gradient covering the border box.
  private func layerGradient(_ bg: Background) -> LayerGradient? {
    guard bg.layers.count == 1, let bgLayer = bg.layers.first, let gradient = bgLayer.gradient,
          bgLayer.image == nil, bgLayer.backgroundColor == nil, bgLayer.size == nil, bgLayer.position == nil,
          bgLayer.clip == .borderBox, bgLayer.attachment == .scroll, bgLayer.blendMode == .normal,
          !gradient.repeating, gradient.type.lowercased() == "linear",
          bg.boxInsets(bgLayer.origin) == .zero,
          bounds.width > 0, bounds.height > 0 else { return nil }
    let parsed = parseGradientStops(gradient.stops)
    guard !parsed.colors.isEmpty else { return nil }
    let (colors, locations) = expandInterpolatedStops(parsed.colors, parsed.locations, gradient.interpolation)
    guard colors.allSatisfy({ $0.alpha >= 1 }) else { return nil }
    if !locations.isEmpty {
      guard locations.count == colors.count,
            zip(locations, locations.dropFirst()).allSatisfy({ $0 <= $1 }),
            locations.allSatisfy({ $0 >= 0 && $0 <= 1 }) else { return nil }
    }
    let w = bounds.width
    let h = bounds.height
    let (start, end) = linearGradientPoints(direction: gradient.direction, width: w, height: h)
    // Core Animation keeps the bands perpendicular to start->end in unit space.
    let lengthSq = (end.x - start.x) * (end.x - start.x) + (end.y - start.y) * (end.y - start.y)
    guard lengthSq > 0 else { return nil }
    let gx = w * (end.x - start.x) / lengthSq
    let gy = h * (end.y - start.y) / lengthSq
    let gSq = gx * gx + gy * gy
    let unitStart = CGPoint(x: start.x / w, y: start.y / h)
    return LayerGradient(
      colors: colors,
      locations: locations.isEmpty ? nil : locations.map { NSNumber(value: Double($0)) },
      start: unitStart,
      end: CGPoint(x: unitStart.x + gx / gSq, y: unitStart.y + gy / gSq)
    )
  }

  public override func draw(_ rect: CGRect) {
    updateDrawFlagsIfNeeded()

    let hasBackground = _cachedHasBackground
    let hasBoxShadow = _cachedHasBoxShadow
    let hasBorder = _cachedHasBorder
    let hasFilter = _cachedHasFilter
    let hasListMarkers = self.hasListMarkers

    // Early-out: skip all CoreGraphics work for plain views with no decoration
    guard hasBackground || hasBoxShadow || hasBorder || hasFilter || hasListMarkers else { return }

    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }

    style.mBorderRender.resolve(for: bounds)
    let hasRadii = style.mBorderRender.hasRadii()

    // Outset shadows are handled by MasonShadowLayer

    // Background across full bounds (border drawn on top) to avoid a 1px gap at
    // edge-aligned children when border widths are present.
    if hasBackground {
      // Expand by a fractional device pixel to avoid 1px hairline gaps
      let scale = CGFloat(NSCMason.scale)
      let expand: CGFloat = 1.0 / scale
      let innerRect = bounds.insetBy(dx: -expand, dy: -expand)

      context.saveGState()
      if hasRadii {
        let innerRadius = style.mBorderRender.radius
        let innerPath = style.mBorderRender.getClipPath(rect: innerRect, radius: innerRadius)
        context.addPath(innerPath.cgPath)
        context.clip()
      }
      style.mBackground.draw(on: self, in: context, rect: innerRect)
      context.restoreGState()
    }

    // Inset box shadows (render on top of background)
    if hasBoxShadow {
      style.mBoxShadowRenderer.drawInsetShadows(in: context, rect: bounds, borderRenderer: style.mBorderRender)
    }

    // Draw list markers for HTML <li> children into the parent's padding zone.
    if hasListMarkers {
      drawListItemMarkers(in: context)
    }

    // No external clip: CSSBorderRenderer.draw() builds its own rounded stroke
    // paths, and clipping the outer edge causes black anti-alias fringing with
    // border-radius + box-shadow.
    if hasBorder {
      style.mBorderRender.draw(in: context, rect: bounds)
    }

    if hasFilter {
      style.applyResolvedFilter(in: context, rect: bounds, view: self)
    }
  }

  // MARK: Accessibility
  // A <summary> reads as one button named by its text, expanded or collapsed with its details.
  private var isSummary: Bool { node.detailsRole == MasonDetails.summary }

  public override var isAccessibilityElement: Bool {
    get { isSummary || super.isAccessibilityElement }
    set { super.isAccessibilityElement = newValue }
  }

  public override var accessibilityLabel: String? {
    get { super.accessibilityLabel ?? (isSummary ? MasonDetails.accessibleName(self) : nil) }
    set { super.accessibilityLabel = newValue }
  }

  public override var accessibilityTraits: UIAccessibilityTraits {
    get { isSummary ? super.accessibilityTraits.union(.button) : super.accessibilityTraits }
    set { super.accessibilityTraits = newValue }
  }

  @available(iOS 18.0, *)
  public override var accessibilityExpandedStatus: UIAccessibility.ExpandedStatus {
    get {
      guard isSummary, let details = MasonDetails.details(of: node) else { return super.accessibilityExpandedStatus }
      return details.detailsOpen ? .expanded : .collapsed
    }
    set { super.accessibilityExpandedStatus = newValue }
  }

  public override func accessibilityActivate() -> Bool {
    if isSummary, MasonDetails.toggle(summary: node) { return true }
    return super.accessibilityActivate()
  }

  private func drawListItemMarkers(in context: CGContext) {
    var position = 0
    for sv in subviews {
      guard let liText = sv as? MasonText, liText.type == .Li else { continue }
      // An inside marker is text in the item; rebuild it when the list, type or index changed.
      let marker = MasonUIView.insideMarker(for: liText)
      if marker != liText.engine.insideMarker {
        liText.engine.insideMarker = marker
        DispatchQueue.main.async { [weak liText] in liText?.engine.invalidate() }
      }
      if !MasonUIView.isInside(list: style, item: liText) {
        drawMarkerFor(listItem: liText, in: context, position: position)
      }
      position += 1
    }
  }

  // The item's own list-style-type wins over the list's.
  private static func listStyleType(list: MasonStyle, item: MasonText, preflight: Bool) -> ListStyleType {
    for style in [item.style, list] where style.isValueInitialized {
      let isSet = style.getUInt8(StyleKeys.LIST_STYLE_TYPE_STATE) != 0
      if isSet, let type = ListStyleType(rawValue: Int8(style.getUInt8(StyleKeys.LIST_STYLE_TYPE))) {
        return type
      }
    }
    // UA lists default to disc; preflight resets them to none.
    return preflight ? .None : .Disc
  }

  // The item's own list-style-position wins over the list's.
  private static func isInside(list: MasonStyle, item: MasonText) -> Bool {
    for style in [item.style, list] where style.isValueInitialized {
      if style.getUInt8(StyleKeys.LIST_STYLE_POSITION_STATE) != 0 {
        return style.getUInt8(StyleKeys.LIST_STYLE_POSITION) == UInt8(ListStylePosition.Inside.rawValue)
      }
    }
    return false
  }

  /// Leading text for the item's `inside` marker, drawn in its own font, or "" when it has none.
  internal static func insideMarker(for item: MasonText) -> String {
    guard item.type == .Li else { return MasonDetails.marker(for: item) }
    guard let list = item.node.parent else { return "" }
    guard isInside(list: list.style, item: item) else { return "" }
    var index = 1
    for child in list.children {
      guard let view = child.view as? MasonText else { continue }
      if view === item { break }
      if view.type == .Li { index += 1 }
    }
    switch listStyleType(list: list.style, item: item, preflight: list.mason.preflight) {
    case .Disc, .Custom: return "\u{2022} "
    case .Circle: return "\u{25E6} "
    case .Square: return "\u{25AA} "
    case .Decimal: return "\(index). "
    case .None: return ""
    }
  }

  private func resolveListStyleTypeFor(_ child: MasonText) -> ListStyleType {
    return MasonUIView.listStyleType(list: style, item: child, preflight: node.mason.preflight)
  }

  // Through CoreText at an explicit baseline, as the item's text is drawn; UIKit string
  // drawing puts SF's baseline higher.
  private func drawMarkerText(_ text: String, font: UIFont, color: UIColor, right: CGFloat, baseline: CGFloat, in context: CGContext) {
    let attributed = NSAttributedString(string: text, attributes: [
      .font: font,
      NSAttributedString.Key(kCTForegroundColorAttributeName as String): color.cgColor,
    ])
    let line = CTLineCreateWithAttributedString(attributed)
    let width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
    context.saveGState()
    context.textMatrix = .identity
    context.translateBy(x: right - width, y: baseline)
    context.scaleBy(x: 1, y: -1)
    context.textPosition = .zero
    CTLineDraw(line, context)
    context.restoreGState()
  }

  private func drawMarkerFor(listItem child: MasonText, in context: CGContext, position: Int) {
    let listType = resolveListStyleTypeFor(child)
    guard listType != .None else { return }

    let uiFont = child.style.resolvedFontFace.uiFont ?? UIFont.systemFont(ofSize: CGFloat(Constants.DEFAULT_FONT_SIZE))
    let fontSize = uiFont.pointSize
    let ascent = uiFont.ascender   // positive: distance from baseline to top
    let descent = uiFont.descender // negative: distance from baseline to bottom

    let markerSize = fontSize * 0.35
    let gap = fontSize * 0.5

    // Baseline in self (MasonUIView) coordinate space (y-down).
    let childFrame = child.frame
    // Centre the marker on the first line's box midpoint (text sits centred in
    // the line-height box) — not the bare font baseline, which drifts off-line.
    let lineHeightType = child.style.resolvedLineHeightType
    let lineHeightVal = CGFloat(child.style.resolvedLineHeight)
    let fontLineHeight = uiFont.ascender - uiFont.descender
    let lineBox: CGFloat = {
      if lineHeightType == 1 { return max(lineHeightVal, fontLineHeight) }   // absolute pt
      if lineHeightVal > 0 { return max(lineHeightVal * fontSize, fontLineHeight) } // multiplier
      return max(fontLineHeight, fontSize * 1.2) // block text's normal line box
    }()
    let lineCenter = childFrame.minY + lineBox / 2.0
    // Baseline of the first line, placed exactly as the item's own text places it.
    let lineRect = CGRect(x: childFrame.minX, y: childFrame.minY, width: childFrame.width, height: lineBox)
    let baseline = child.engine.singleLineBaselineFromTop(ascent: ascent, descent: -descent, capHeight: uiFont.capHeight, baselineOffset: 0, in: lineRect)
    // Marker shape centres on the line's visual middle (cap/x-height midpoint).
    let cy = lineCenter

    // Marker zone: child.frame.minX - gap - markerContentWidth .. child.frame.minX - gap
    // (gap separates the marker from the text content)
    let markerRight = childFrame.minX - gap

    let textColor = UIColor.colorFromARGB(child.style.resolvedColor)

    context.saveGState()
    context.setFillColor(textColor.cgColor)
    context.setStrokeColor(textColor.cgColor)

    switch listType {
    case .Disc:
      let r = markerSize / 2.0
      let cx = markerRight - r
      context.fillEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))

    case .Circle:
      let r = markerSize / 2.0
      let cx = markerRight - r
      let lineWidth = max(1.0, fontSize * 0.08)
      context.setLineWidth(lineWidth)
      context.strokeEllipse(in: CGRect(
        x: cx - r + lineWidth / 2,
        y: cy - r + lineWidth / 2,
        width: r * 2 - lineWidth,
        height: r * 2 - lineWidth
      ))

    case .Square:
      let half = markerSize / 2.0
      let cx = markerRight - half
      context.fill(CGRect(x: cx - half, y: cy - half, width: half * 2, height: half * 2))

    case .Decimal:
      drawMarkerText("\(position + 1).", font: uiFont, color: textColor, right: markerRight, baseline: baseline, in: context)

    case .Custom:
      drawMarkerText("\u{2022}", font: uiFont, color: textColor, right: markerRight, baseline: baseline, in: context)

    case .None:
      break
    }

    context.restoreGState()
  }

  public let node: MasonNode
  public let mason: NSCMason

  public var uiView: UIView { self }

  // MARK: - Scroll state
  // When overflow is scroll/auto, this view scrolls like a web <div> via
  // bounds.origin (as UIScrollView does), driven by a pan gesture that only
  // begins when actually scrollable.
  // Only assigned for overflow scroll/auto, so it doubles as the gesture trigger.
  public var contentSize: CGSize = .zero {
    didSet { _ensureScrollGesture() }
  }
  // When true, default `visible` overflow on Y acts as `auto` (web-like scroll-on-overflow).
  @objc public var isScrollContainer: Bool = false {
    didSet {
      if isScrollContainer { _ensureScrollGesture() }
      // Clipping and content size depend on it; the next layout pass re-applies them.
      if isScrollContainer != oldValue { node.appliedStyleVersion = .max }
    }
  }
  private var _scrollPanStartOffset: CGPoint = .zero
  private var _scrollPanTranslation: CGPoint = .zero
  private var _scrollDecelerationLink: CADisplayLink?
  private var _scrollDecelerationVelocity: CGPoint = .zero
  // DecelerationRate.normal (0.998) is per-millisecond; raise to 1000/60 to get
  // the per-frame factor (≈0.967) matching UIScrollView feel.
  private let _scrollDecelerationRate: CGFloat = pow(UIScrollView.DecelerationRate.normal.rawValue, 1000.0 / 60.0)
  private var _lastBoundsSize: CGSize = .zero
  private var _scrollGestureDelegate: _MasonScrollPanDelegate?
  // True while a scroll gesture/deceleration is active; layoutSubviews skips
  // autoComputeIfRoot so scroll-step bounds changes don't retrigger layout.
  private var _isScrolling = false
  internal var isScrollingNow: Bool { _isScrolling }
  // Scroll event state, used once the node has a scroll listener.
  private var _panActive = false
  private var _scrollEventQueued = false
  private var _scrolledSinceEvent = false
  private var _scrolledSinceEnd = false
  // Smooth programmatic scroll.
  private var _scrollAnimationLink: CADisplayLink?
  private var _scrollAnimationFrom: CGPoint = .zero
  private var _scrollAnimationTo: CGPoint = .zero
  private var _scrollAnimationStart: CFTimeInterval = 0
  // scrollTo made before layout; NaN keeps an axis.
  private var _pendingScroll = CGPoint(x: CGFloat.nan, y: CGFloat.nan)
  private var _pendingScrollSmooth = false

  public var contentOffset: CGPoint {
    get { bounds.origin }
    set { _setScrollOrigin(_clampScrollOffset(newValue)) }
  }

  // position: sticky descendants of this scroll container — see MasonPositioning.swift.
  fileprivate lazy var stickyDescendants = NSHashTable<UIView>.weakObjects()

  func registerSticky(_ view: UIView) {
    stickyDescendants.add(view)
  }

  // Set the scroll origin without clamping, so pan/deceleration can hold an overscrolled position.
  private func _setScrollOrigin(_ c: CGPoint) {
    guard bounds.origin != c else { return }
    // Disable implicit CA animations so scroll bounds changes don't lag.
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    var b = bounds; b.origin = c; bounds = b
    _updateScrollMask()
    CATransaction.commit()
    // Fixed-attachment backgrounds are positioned against the window, so they repaint on scroll.
    if style.mBackground.needsRedrawOnScroll { setNeedsDisplay() }
    Background.invalidateFixedDescendants(self)
    if isScrollContainer {
      MasonPositioning.recomputeSticky(scrollHost: self, descendants: stickyDescendants)
    }
    if node.listensForScroll { _noteScrolled() }
  }

  // Attached lazily: most views never scroll, and a recognizer per view is not free.
  private func _ensureScrollGesture() {
    guard _scrollGestureDelegate == nil else { return }
    // Delegate gates begin on scrollability and allows simultaneous
    // recognition with parent gestures.
    let d = _MasonScrollPanDelegate()
    d.owner = self
    _scrollGestureDelegate = d
    _scrollPanGesture.delegate = d
    addGestureRecognizer(_scrollPanGesture)
  }

  private lazy var _scrollPanGesture: UIPanGestureRecognizer = {
    let g = UIPanGestureRecognizer(target: self, action: #selector(_handleScrollPan(_:)))
    return g
  }()
  
  public var style: MasonStyle {
    return node.style
  }
  
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  // Keeps fixed boxes on their root when it moves; returns early if there are none.
  public override var frame: CGRect {
    didSet {
      if frame.origin != oldValue.origin { MasonPositioning.rootDidMove(self) }
    }
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    // Skip layout during scroll steps — bounds.origin changes only shift the
    // visible window, not child positions.
    guard !_isScrolling else { return }
    // Must run before the size guard: style-only changes (overflow, color) mark
    // the node dirty without resizing, and gating on size would leave contentSize
    // at zero so scroll clamps to (0,0).
    autoComputeIfRoot()
    // Safety-net sweep for orphaned outset-shadow layers on UIKit-driven
    // relayouts that bypass applyToView's reconcile.
    MasonElementHelpers.reconcileShadowLayers(self)
    let currentSize = bounds.size
    // Always reposition the shadow layer: frame.origin can change without a size
    // change, and the layer is keyed to our frame in the superview's coords.
    style.updateShadowLayer(for: CGRect(origin: .zero, size: currentSize))
    // Keep the backdrop-filter effect view/layer sized to us (it's usually set
    // before layout, when bounds is still .zero).
    style.updateBackdropFrames(for: CGRect(origin: .zero, size: currentSize))
    guard !currentSize.equalTo(_lastBoundsSize) else { return }
    let wasEmpty = _lastBoundsSize.width <= 0 || _lastBoundsSize.height <= 0
    _lastBoundsSize = currentSize
    // Draw flags and isOpaque depend on the style, so only the first size needs them.
    if wasEmpty { invalidateDrawFlags() }

    // Never rasterize: it flattens the sublayer subtree into an offscreen bitmap
    // that gets resampled when composited, softening child text. draw(_:) already
    // clips the gradient background to the rounded border path, so corners stay
    // clean without it.
    if layer.shouldRasterize { layer.shouldRasterize = false }
    // Transforms pivot on the layer's centre anchor; a transform-origin or a percentage depends on the size.
    if style.transformDependsOnOrigin { style.applyTransformFromBuffer() }
  }

  public override func willMove(toWindow newWindow: UIWindow?) {
    super.willMove(toWindow: newWindow)
    if newWindow == nil {
      _stopScrollDeceleration()
      _stopScrollAnimation()
    }
  }

  public override func willMove(toSuperview newSuperview: UIView?) {
    super.willMove(toSuperview: newSuperview)
    // On detach, remove our outset-shadow layer while the old superview (which
    // owns it) is still current, else it's orphaned.
    if newSuperview == nil {
      style.removeShadowLayer()
    }
  }

  // Non-placeholder view composition attaches via UIKit's generic addSubview
  // path, which skips the Mason-aware append that sets `node.parent` (layout
  // still works via the Rust/taffy tree, linked separately). Sync it here —
  // the one hook every subview attach goes through — so resolvedFontSize/
  // resolvedColor/etc. can walk up through a plain element ancestor.
  public override func didMoveToSuperview() {
    super.didMoveToSuperview()
    guard let sv = superview as? MasonElement else { return }
    if node.layoutParent !== sv.node {
      node.parent = sv.node
    }
    // A text descendant may have cached default attributes (font-size,
    // line-height, color, ...) while unreachable from `sv`, resolving
    // inheritance to nothing. The cache can't detect an ancestor change,
    // so force a rebuild on attach.
    MasonNode.invalidateDescendantDefaultAttributes(node)
    if !style.inBatch {
      invalidateLayout()
    }
  }

  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    isOpaque = false
    setComputeCache(.init(width: -2, height: -2))
    computeCacheDirty = false
    node.view = self
    style.setStyleChangeListener(listener: self)
    // Redraw bg/border when bounds.origin shifts during scroll.
    contentMode = .redraw
    // Mason positions children itself and doesn't use layout margins.
    autoresizesSubviews = false
    insetsLayoutMarginsFromSafeArea = false
  }


  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  
  @objc public static func createGridView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Grid
    }
    return view
  }
  
  @objc public static func createFlexView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Flex
    }
    return view
  }
  
  @objc public static func createBlockView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Block
    }
    return view
  }
  
  
  /// A child already in this node's tree isn't added again. Only a direct layout child is a
  /// subview; an inline run draws its members.
  private func attachExistingChild(_ view: UIView) -> Bool {
    let childNode = (view as? MasonElement)?.node ?? mason.nodeForView(view)
    guard childNode.parent === node else { return false }
    if childNode.layoutParent === node && view.superview == nil {
      node.suppressChildOperations { addSubview(view) }
    }
    return true
  }

  public func addView(_ view: UIView){
    if(view.superview == self){
      return
    }
    if attachExistingChild(view) { return }
    if(view is MasonElement){
      append((view as! MasonElement))
    }else {
      append(node: mason.nodeForView(view))
    }
  }
  
  public func addView(_ view: UIView, at: Int){
    if(view.superview == self){
      return
    }
    if attachExistingChild(view) { return }
    //    if(at <= -1){
    //      addSubview(view)
    //    }else {
    //      insertSubview(view, at: at)
    //    }
    
    
    if(view is MasonElement){
      node.addChildAt((view as! MasonElement).node, at)
    }else {
      node.addChildAt(mason.nodeForView(view), at)
    }
  }

  // Inverse of addView: node.removeChild detaches the subview, removes the
  // Rust node, and invalidates layout, avoiding a stale layout slot + ghost.
  public func removeView(_ view: UIView) {
    let childNode = (view as? MasonElement)?.node ?? mason.nodeForView(view)
    _ = node.removeChild(childNode)
  }

  public func removeView(at index: Int) {
    _ = node.removeChildAt(index: index)
  }


  @objc public func addSubviews(_ views: [UIView]){
    addSubviews(views, at: -1)
  }
  
  @objc public func addSubviews(_ views: [UIView], at index: Int){
    views.enumerated().forEach { seq in
      if (index < 0) {
        addSubview(seq.element)
      } else {
        insertSubview(seq.element, at: index + seq.offset)
      }
    }
  }
  
  @objc public var inBatch: Bool {
    get{
      return node.inBatch
    }
    
    set(value) {
      node.inBatch = value
    }
  }
  
  func checkAndUpdateStyle() {
    if (!node.inBatch) {
      node.style.updateNativeStyle()
      // Trigger a layout pass for style-only changes (e.g. overflowY) that don't
      // resize the view and so wouldn't otherwise cause layoutSubviews.
      setNeedsLayout()
    }
  }
  
  @objc public var background: String {
    get{
      return style.background
    }
    set(value) {
      style.background = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var display: Display {
    get{
      return style.display
    }
    set(value) {
      style.display = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var _position: Position {
    get{
      return style.position
    }
    set(value) {
      style.position = value
      checkAndUpdateStyle()
    }
  }
  @objc public var direction: Direction {
    get{
      return style.direction
    }
    set(value) {
      style.direction = value
    }
  }
  
  
  @objc public var flexDirection: FlexDirection {
    get{
      return style.flexDirection
    }
    set(value) {
      style.flexDirection = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var flexWrap: FlexWrap {
    get{
      return style.flexWrap
    }
    set(value) {
      style.flexWrap = value
      checkAndUpdateStyle()
    }
  }
  
  
  //    @objc public var overflow: Overflow {
  //        get{
  //            return style.overflow
  //        }
  //        set(value) {
  //            style.overflow = value
  //            checkAndUpdateStyle()
  //        }
  //    }
  
  
  @objc public var overflowX: Overflow {
    get{
      return style.overflowX
    }
    set(value) {
      style.overflowX = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var overflowY: Overflow {
    get{
      return style.overflowY
    }
    set(value) {
      style.overflowY = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var alignItems: AlignItems{
    get{
      return style.alignItems
    }
    set(value) {
      style.alignItems = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var alignSelf: AlignSelf {
    get {
      return style.alignSelf
    }
    set(value) {
      style.alignSelf = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var alignContent: AlignContent {
    get{
      return style.alignContent
    }
    set(value) {
      style.alignContent = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var justifyItems: JustifyItems {
    get{
      return style.justifyItems
    }
    set(value) {
      style.justifyItems = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var justifySelf: JustifySelf {
    get{
      return style.justifySelf
    }
    set(value) {
      style.justifySelf = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var justifyContent: JustifyContent{
    get{
      return style.justifyContent
    }
    set(value) {
      style.justifyContent = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var flexGrow: Float {
    get{
      return style.flexGrow
    }
    set(value) {
      style.flexGrow = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var flexShrink: Float {
    get{
      return style.flexShrink
    }
    set(value) {
      style.flexShrink = value
      checkAndUpdateStyle()
    }
  }
  
  
  
  public var scrollBarWidth: MasonDimension {
    get {
      return style.scrollBarWidth
    }
    set(value) {
      style.scrollBarWidth = value
      checkAndUpdateStyle()
    }
  }
  
  func setScrollBarWidth(value: Float) {
    style.setScrollBarWidth(value);
    checkAndUpdateStyle()
  }
  
  @objc public var scrollBarWidthCompat: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: style.scrollBarWidth)
    }
    set(value) {
      style.scrollBarWidth = value.dimension
      checkAndUpdateStyle()
    }
  }
  
  func setFlexBasis(value: Float, type: Int) {
    style.setFlexBasis(value, type)
    checkAndUpdateStyle()
  }
  
  public var flexBasis: MasonDimension {
    get {
      return style.flexBasis
    }
    set(value) {
      style.flexBasis = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var flexBasisCompat: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: style.flexBasis)
    }
    set(value) {
      style.flexBasis = value.dimension
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var aspectRatio: Float{
    get{
      return style.aspectRatio ?? Float.nan
    }
    set(value) {
      style.aspectRatio = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridArea: String {
    get {
      return style.gridArea
    }
    set(value) {
      style.gridArea = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridTemplateAreas: String {
    get {
      return style.gridTemplateAreas
    }
    set(value) {
      style.gridTemplateAreas = value
      checkAndUpdateStyle()
    }
  }
  
  
  
  @objc public var gridAutoRows: String {
    get {
      return style.gridAutoRows
    }
    set(value) {
      style.gridAutoRows = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridAutoColumns: String{
    get{
      return style.gridAutoColumns
    }
    set(value) {
      style.gridAutoColumns = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridAutoFlow: GridAutoFlow{
    get{
      return style.gridAutoFlow
    }
    set(value) {
      style.gridAutoFlow = value
      checkAndUpdateStyle()
    }
  }
  
  
  public var gridColumn: String{
    get{
      return style.gridColumn
    }
    set(value) {
      style.gridColumn = value
      checkAndUpdateStyle()
    }
  }
  
  public var gridColumnStart: String {
    get {
      return style.gridColumnStart
    }
    
    set {
      style.gridColumnStart = newValue
    }
  }
  
  public var gridColumnEnd: String {
    get {
      return style.gridColumnEnd
    }
    
    set {
      style.gridColumnEnd = newValue
    }
  }
  
  
  public var gridRow: String{
    get{
      return style.gridRow
    }
    set(value) {
      style.gridRow = value
      checkAndUpdateStyle()
    }
  }
  
  public var gridRowStart: String {
    get {
      return style.gridRowStart
    }
    
    set {
      style.gridRowStart = newValue
    }
  }
  
  public var gridRowEnd: String {
    get {
      return style.gridRowEnd
    }
    
    set {
      style.gridRowEnd = newValue
    }
  }
  
  
  @objc public var gridTemplateRows: String {
    get{
      return style.gridTemplateRows
    }
    set(value) {
      style.gridTemplateRows = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridTemplateColumns: String {
    get{
      return style.gridTemplateColumns
    }
    set(value) {
      style.gridTemplateColumns = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public func setPadding(_ left: Float,_ top:Float, _ right: Float,_ bottom: Float) {
    node.style.padding = MasonRect(
      MasonLengthPercentage.Points(top),
      MasonLengthPercentage.Points(right),
      MasonLengthPercentage.Points(bottom),
      MasonLengthPercentage.Points(left)
    )
  }
  
  @objc public func getPadding() -> MasonLengthPercentageRectCompat{
    return node.style.paddingCompat
  }
  
  @objc public func setPaddingLeft(_ left: Float, _ type: Int) {
    node.style.setPaddingLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingRight(_ right: Float, _ type: Int) {
    node.style.setPaddingRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingTop(_ top: Float, _ type: Int) {
    node.style.setPaddingTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingBottom(_ bottom: Float, _ type: Int) {
    node.style.setPaddingBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getPaddingLeft() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.left
  }
  
  @objc public func getPaddingRight() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.right
  }
  
  @objc public func getPaddingTop() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.top
  }
  
  
  @objc public func getPaddingBottom() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.bottom
  }
  
  @objc public func setBorderWidth(_ left: Float,_ top: Float,_ right: Float, _ bottom: Float) {
    style.borderWidth = MasonRect(
      MasonLengthPercentage.Points(top),
      MasonLengthPercentage.Points(right),
      MasonLengthPercentage.Points(bottom),
      MasonLengthPercentage.Points(left)
    )
  }
  
  @objc public func getBorderWidth() -> MasonLengthPercentageRectCompat{
    return node.style.borderWidthCompat
  }
  
  @objc public func setBorderLeftWidth(_ left: Float, _ type: Int) {
    node.style.setBorderLeftWidth(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderRightWidth(_ right: Float, _ type: Int) {
    node.style.setBorderRightWidth(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderTopWidth(_ top: Float, _ type: Int) {
    node.style.setBorderTopWidth(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderBottomWidth(_ bottom: Float, _ type: Int) {
    node.style.setBorderBottomWidth(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getBorderLeft() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.left
  }
  
  @objc public func getBorderRight() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.right
  }
  
  @objc public func getBorderBottom() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.bottom
  }
  
  @objc public func getBorderTop() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.top
  }
  
  @objc public func setMargin(_ left: Float, _ top: Float,_ right: Float,_ bottom: Float) {
    node.style.margin = MasonRect(
      MasonLengthPercentageAuto.Points(top),
      MasonLengthPercentageAuto.Points(right),
      MasonLengthPercentageAuto.Points(bottom),
      MasonLengthPercentageAuto.Points(left)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMargin() -> MasonLengthPercentageAutoRectCompat{
    return node.style.marginCompat
  }
  
  @objc public func setMarginLeft(_ left: Float, _ type: Int) {
    node.style.setMarginLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginRight(_ right: Float, _ type: Int) {
    node.style.setMarginRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginTop(_ top: Float, _ type: Int) {
    node.style.setMarginTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginBottom(_ bottom: Float, _ type: Int) {
    node.style.setMarginBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getMarginLeft() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.left
  }
  
  @objc public func getMarginRight() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.right
  }
  
  @objc public func getMarginTop() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.top
  }
  
  @objc public func getMarginBottom() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.bottom
  }
  
  @objc public func setInset(_ left: Float,_  top: Float, _ right: Float,_  bottom: Float) {
    node.style.inset = MasonRect(
      MasonLengthPercentageAuto.Points(top),
      MasonLengthPercentageAuto.Points(right),
      MasonLengthPercentageAuto.Points(bottom),
      MasonLengthPercentageAuto.Points(left)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getInset() -> MasonLengthPercentageAutoRectCompat{
    return node.style.insetCompat
  }
  
  @objc public func setInsetLeft(_ left: Float,_  type: Int) {
    node.style.setInsetLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetRight(_ right: Float,_  type: Int) {
    node.style.setInsetRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetTop(_ top: Float,_  type: Int) {
    node.style.setInsetTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetBottom(_ bottom: Float,_  type: Int) {
    node.style.setInsetBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getInsetLeft() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.left
  }
  
  @objc public func getInsetRight() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.right
  }
  
  @objc public func getInsetTop() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.top
  }
  
  @objc public func getInsetBottom() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.bottom
  }
  
  @objc public func setMinSize(_ width: Float,_ height: Float) {
    node.style.minSize = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMinSize() -> MasonDimensionSizeCompat{
    return node.style.minSizeCompat
  }
  
  @objc public func setMinSizeWidth(_ width: Float,_ type: Int) {
    node.style.setMinSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMinSizeHeight(_ height: Float,_ type: Int) {
    node.style.setMinSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  
  @objc public func getMinSizeWidth() -> MasonDimensionCompat{
    return node.style.minSizeCompat.width
  }
  
  @objc public func getMinSizeHeight() -> MasonDimensionCompat{
    return node.style.minSizeCompat.height
  }
  
  @objc public func setSize(_ width: Float,_  height: Float) {
    node.style.size = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func setSizeWidth(_ width: Float,_ type: Int) {
    node.style.setSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setSizeHeight(_ height: Float,_ type: Int) {
    node.style.setSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getSize() -> MasonDimensionSizeCompat{
    return node.style.sizeCompat
  }
  
  @objc public func getSizeWidth() -> MasonDimensionCompat{
    return node.style.sizeCompat.width
  }
  
  @objc public func getSizeHeight() -> MasonDimensionCompat{
    return node.style.sizeCompat.height
  }
  
  @objc public func setMaxSize(_ width: Float, _ height: Float) {
    node.style.maxSize = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMaxSize() -> MasonDimensionSizeCompat{
    return node.style.maxSizeCompat
  }
  
  @objc public func setMaxSizeWidth(_ width: Float,_ type: Int) {
    node.style.setMaxSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMaxSizeHeight(_ height: Float,_ type: Int) {
    node.style.setMaxSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getMaxSizeWidth() -> MasonDimensionCompat{
    return node.style.minSizeCompat.width
  }
  
  @objc public func getMaxSizeHeight() -> MasonDimensionCompat{
    return node.style.minSizeCompat.height
  }
  
  @objc public func setGap(_ width: Float,_ height: Float) {
    node.style.gap = MasonSize(
      MasonLengthPercentage.Points(width),
      MasonLengthPercentage.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func setGapWithWidthHeightType(_ width: Float , _ width_type: Int8,_ height: Float, _ height_type: Int8) {
    guard let width = MasonLengthPercentage.fromValueType(width, Int(width_type)) else {return}
    guard let height = MasonLengthPercentage.fromValueType(height, Int(height_type)) else {return}
    node.style.gap = MasonSize(
      width,
      height
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getGap() -> MasonLengthPercentageSizeCompat{
    return node.style.gapCompat
  }
  
  @objc public func setRowGap(_ row: Float,_ type: Int) {
    node.style.setRowGap(row, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setColumnGap(_ column: Float,_ type: Int) {
    node.style.setColumnGap(column, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getRowGap() -> MasonLengthPercentageCompat{
    return node.style.gapCompat.width
  }
  
  @objc public func getColumnGap() -> MasonLengthPercentageCompat{
    return node.style.gapCompat.height
  }
}

// MARK: - Scroll implementation
extension MasonUIView {

  var _canScrollH: Bool {
    switch node.style.overflow.x {
    case .Scroll: return true
    case .Auto:    return contentSize.width > bounds.width
    default:       return false
    }
  }

  var _canScrollV: Bool {
    switch node.style.overflow.y {
    case .Scroll: return true
    case .Auto:    return contentSize.height > bounds.height
    case .Visible: return isScrollContainer && contentSize.height > bounds.height
    default:       return false
    }
  }

  private func _clampScrollOffset(_ offset: CGPoint) -> CGPoint {
    CGPoint(
      x: _canScrollH ? max(0, min(offset.x, max(0, contentSize.width  - bounds.width))) : 0,
      y: _canScrollV ? max(0, min(offset.y, max(0, contentSize.height - bounds.height))) : 0
    )
  }

  // MARK: Rubber-banding
  // UIScrollView-style resistance curve; `dim` is the viewport size along the axis.
  private func _rubber(_ distance: CGFloat, _ dim: CGFloat) -> CGFloat {
    let c: CGFloat = 0.55
    let d = max(dim, 1)
    return (1 - 1 / (distance * c / d + 1)) * d
  }

  private func _rubberAxis(_ v: CGFloat, _ lo: CGFloat, _ hi: CGFloat, _ dim: CGFloat) -> CGFloat {
    if v < lo { return lo - _rubber(lo - v, dim) }
    if v > hi { return hi + _rubber(v - hi, dim) }
    return v
  }

  private func _rubberBanded(_ o: CGPoint) -> CGPoint {
    let hiX = max(0, contentSize.width - bounds.width)
    let hiY = max(0, contentSize.height - bounds.height)
    return CGPoint(
      x: _canScrollH ? _rubberAxis(o.x, 0, hiX, bounds.width) : 0,
      y: _canScrollV ? _rubberAxis(o.y, 0, hiY, bounds.height) : 0
    )
  }

  // Keep the clip mask on the viewport as bounds.origin scrolls. Layout decides
  // whether a mask exists; its path is in viewport-local coordinates.
  func _updateScrollMask() {
    if let cssMask = layer.mask as? MasonMaskLayer {
      // A CSS mask can be larger than the box (mask-clip: no-clip); keep its offset.
      cssMask.follow(viewBounds: bounds)
    } else {
      layer.mask?.frame = bounds
    }
  }

  // MARK: Pan handler

  @objc func _handleScrollPan(_ gesture: UIPanGestureRecognizer) {
    switch gesture.state {
    case .began:
      _panActive = true
      _stopScrollAnimation()
      _isScrolling = true
      _stopScrollDeceleration()
      _scrollPanStartOffset = contentOffset
      _scrollPanTranslation = .zero

    case .changed:
      let t = gesture.translation(in: self)
      _scrollPanTranslation = t
      let raw = CGPoint(
        x: _scrollPanStartOffset.x - (_canScrollH ? t.x : 0),
        y: _scrollPanStartOffset.y - (_canScrollV ? t.y : 0)
      )
      _setScrollOrigin(_rubberBanded(raw))

    case .ended, .cancelled:
      _panActive = false
      let v = gesture.velocity(in: self)
      _startScrollDeceleration(CGPoint(
        x: _canScrollH ? -v.x : 0,
        y: _canScrollV ? -v.y : 0
      ))

    default: break
    }
  }

  // MARK: Deceleration

  private func _startScrollDeceleration(_ velocity: CGPoint) {
    // Start when there's momentum to decay or we're overscrolled and must spring back.
    let overscrolled = contentOffset != _clampScrollOffset(contentOffset)
    guard hypot(velocity.x, velocity.y) > 1 || overscrolled else {
      _isScrolling = false
      _scrollMotionEnded()
      return
    }
    _scrollDecelerationLink?.invalidate()
    _scrollDecelerationVelocity = velocity
    _isScrolling = true
    let link = CADisplayLink(target: self, selector: #selector(_scrollDecelerationStep))
    link.add(to: .main, forMode: .common)
    _scrollDecelerationLink = link
  }

  private func _stopScrollDeceleration() {
    _scrollDecelerationLink?.invalidate()
    _scrollDecelerationLink = nil
    _scrollDecelerationVelocity = .zero
    _isScrolling = false
    _scrollMotionEnded()
  }

  // Advance one axis: momentum decay in-bounds, spring-back when overscrolled.
  // Returns (offset, velocity, settled).
  private func _integrateScrollAxis(
    _ value: CGFloat, _ velocity: CGFloat, _ lo: CGFloat, _ hi: CGFloat, _ dt: CGFloat
  ) -> (CGFloat, CGFloat, Bool) {
    if value >= lo && value <= hi {
      let nv = velocity * _scrollDecelerationRate
      let nval = value + nv * dt
      // Settle only when slow and still in-bounds (else momentum bounces off the edge).
      if abs(nv) < 30, nval >= lo, nval <= hi { return (nval, nv, true) }
      return (nval, nv, false)
    }
    let target = value < lo ? lo : hi
    let stiffness: CGFloat = 280
    let damping = 2 * stiffness.squareRoot()   // critically damped — no oscillation
    let nv = velocity + (-stiffness * (value - target) - damping * velocity) * dt
    let nval = value + nv * dt
    if abs(nval - target) < 0.5, abs(nv) < 5 { return (target, 0, true) }
    return (nval, nv, false)
  }

  @objc func _scrollDecelerationStep() {
    let dt: CGFloat = 1.0 / 60.0
    let hiX = max(0, contentSize.width - bounds.width)
    let hiY = max(0, contentSize.height - bounds.height)
    var o = contentOffset
    var v = _scrollDecelerationVelocity
    var doneX = true
    var doneY = true
    // If relayout makes an axis non-scrollable mid-gesture, clear any stale
    // offset instead of stopping the display link with it still overscrolled.
    if _canScrollH {
      (o.x, v.x, doneX) = _integrateScrollAxis(o.x, v.x, 0, hiX, dt)
    } else if o.x != 0 {
      o.x = 0
      v.x = 0
    }
    if _canScrollV {
      (o.y, v.y, doneY) = _integrateScrollAxis(o.y, v.y, 0, hiY, dt)
    } else if o.y != 0 {
      o.y = 0
      v.y = 0
    }
    _scrollDecelerationVelocity = v
    _setScrollOrigin(o)
    if doneX && doneY { _stopScrollDeceleration() }
  }
}

// MARK: - Scroll offsets, events and programmatic scrolling
extension MasonUIView {
  private static let smoothScrollDuration: CFTimeInterval = 0.3

  private var _scrollInMotion: Bool {
    _panActive || _scrollDecelerationLink != nil || _scrollAnimationLink != nil
  }

  private func _noteScrolled() {
    _scrolledSinceEvent = true
    _scrolledSinceEnd = true
    _queueScrollEvents()
  }

  // A drag, momentum or smooth scroll stopped; "scrollend" follows if it moved.
  private func _scrollMotionEnded() {
    if node.listensForScroll && _scrolledSinceEnd { _queueScrollEvents() }
  }

  // Coalesces this run loop turn's offset changes into one "scroll".
  private func _queueScrollEvents() {
    guard !_scrollEventQueued else { return }
    _scrollEventQueued = true
    DispatchQueue.main.async { [weak self] in self?._fireScrollEvents() }
  }

  private func _fireScrollEvents() {
    _scrollEventQueued = false
    let mason = node.mason
    guard mason.hasListener(node, "scroll") || mason.hasListener(node, "scrollend") else {
      // All listeners were removed.
      node.listensForScroll = false
      _scrolledSinceEvent = false
      _scrolledSinceEnd = false
      return
    }
    if _scrolledSinceEvent {
      _scrolledSinceEvent = false
      let event = MasonEvent(type: "scroll")
      event.target = self
      mason.dispatchAtTarget(event, node)
    }
    if _scrolledSinceEnd && !_scrollInMotion {
      _scrolledSinceEnd = false
      let event = MasonEvent(type: "scrollend")
      event.target = self
      mason.dispatchAtTarget(event, node)
    }
  }

  /// Scrolls to `x`/`y` (points, NaN keeps that axis), clamped to the scroll range.
  func webScrollTo(_ x: CGFloat, _ y: CGFloat, smooth: Bool) {
    let current = contentOffset
    let target = _clampScrollOffset(CGPoint(x: x.isNaN ? current.x : x, y: y.isNaN ? current.y : y))
    _stopScrollAnimation()
    if _scrollDecelerationLink != nil { _stopScrollDeceleration() }
    guard target != current else { return }
    if _panActive {
      // Mid-drag the seek is instant and the drag carries on from it, rather than the next
      // pan step putting the offset back.
      let t = _scrollPanTranslation
      _scrollPanStartOffset = CGPoint(x: target.x + (_canScrollH ? t.x : 0), y: target.y + (_canScrollV ? t.y : 0))
      _setScrollOrigin(target)
      return
    }
    guard smooth, window != nil else {
      _setScrollOrigin(target)
      return
    }
    _scrollAnimationFrom = current
    _scrollAnimationTo = target
    _scrollAnimationStart = CACurrentMediaTime()
    _isScrolling = true
    let link = CADisplayLink(target: self, selector: #selector(_scrollAnimationStep))
    link.add(to: .main, forMode: .common)
    _scrollAnimationLink = link
  }

  /// Keeps a scrollTo made before layout for the next layout pass; a later one replaces it per axis.
  func setPendingScroll(_ x: CGFloat, _ y: CGFloat, smooth: Bool) {
    if !x.isNaN { _pendingScroll.x = x }
    if !y.isNaN { _pendingScroll.y = y }
    _pendingScrollSmooth = smooth
    guard !node.hasPendingScroll else { return }
    node.hasPendingScroll = true
    // In case no layout pass comes: retry once layout is current.
    DispatchQueue.main.async { [weak self] in
      guard let self, self.node.hasPendingScroll, self.node.isLayoutValid, self.flushPendingLayout() else { return }
      self.applyPendingScroll()
    }
  }

  func clearPendingScroll() {
    node.hasPendingScroll = false
    _pendingScroll = CGPoint(x: CGFloat.nan, y: CGFloat.nan)
  }

  func applyPendingScroll() {
    let target = _pendingScroll
    clearPendingScroll()
    webScrollTo(target.x, target.y, smooth: _pendingScrollSmooth)
  }

  @objc func _scrollAnimationStep() {
    let t = min(1, (CACurrentMediaTime() - _scrollAnimationStart) / MasonUIView.smoothScrollDuration)
    let e = CGFloat(1 - pow(1 - t, 3))
    let from = _scrollAnimationFrom
    let to = _scrollAnimationTo
    // Clamped each step: a relayout mid-animation can shrink the range.
    _setScrollOrigin(_clampScrollOffset(CGPoint(x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e)))
    if t >= 1 { _stopScrollAnimation() }
  }

  private func _stopScrollAnimation() {
    guard let link = _scrollAnimationLink else { return }
    link.invalidate()
    _scrollAnimationLink = nil
    _isScrolling = false
    _scrollMotionEnded()
  }

  /// The furthest `contentOffset` can go on each axis (0 for an axis that doesn't scroll).
  var webScrollRange: CGPoint {
    CGPoint(
      x: _canScrollH ? max(0, contentSize.width - bounds.width) : 0,
      y: _canScrollV ? max(0, contentSize.height - bounds.height) : 0
    )
  }
}

/// Element scroll offsets, sizes and scrolling, in points.
enum MasonWebScroll {
  private static func px(_ v: Float) -> CGFloat {
    v.isNaN ? 0 : CGFloat(v) / CGFloat(NSCMason.scale)
  }

  static func offset(_ element: MasonElement) -> CGPoint {
    (element.uiView as? MasonUIView)?.contentOffset ?? .zero
  }

  /// The padding box (scrollbars overlay, so they take no room).
  static func clientSize(_ element: MasonElement) -> CGSize {
    element.flushPendingLayout()
    return _clientSize(element)
  }

  private static func _clientSize(_ element: MasonElement) -> CGSize {
    let l = element.node.computedLayout
    let size = element.uiView.bounds.size
    return CGSize(
      width: max(0, size.width - px(l.borderLeft) - px(l.borderRight)),
      height: max(0, size.height - px(l.borderTop) - px(l.borderBottom))
    )
  }

  static func scrollSize(_ element: MasonElement) -> CGSize {
    element.flushPendingLayout()
    let client = _clientSize(element)
    let l = element.node.computedLayout
    var size = CGSize(width: max(client.width, px(l.contentWidth)), height: max(client.height, px(l.contentHeight)))
    // On a scrolling axis, scrollTop + clientHeight == scrollHeight at the end.
    if let view = element.uiView as? MasonUIView {
      let range = view.webScrollRange
      if view._canScrollH { size.width = client.width + range.x }
      if view._canScrollV { size.height = client.height + range.y }
    }
    return size
  }

  /// Before the element is laid out, the request waits for its next layout pass.
  static func scrollTo(_ element: MasonElement, _ x: CGFloat, _ y: CGFloat, smooth: Bool) {
    guard let view = element.uiView as? MasonUIView else { return }
    guard element.flushPendingLayout(), element.node.isLayoutValid else {
      view.setPendingScroll(x, y, smooth: smooth)
      return
    }
    if view.node.hasPendingScroll {
      view.setPendingScroll(x, y, smooth: smooth)
      view.applyPendingScroll()
    } else {
      view.webScrollTo(x, y, smooth: smooth)
    }
  }

  /// Scrolls each Mason scroll container above `element` so it shows.
  /// `block`/`inline`: 0 start, 1 center, 2 end, 3 nearest.
  static func scrollIntoView(_ element: MasonElement, block: Int, inline: Int, smooth: Bool) {
    element.flushPendingLayout()
    let target = element.uiView
    // How far the planned inner scrolls move the target in outer containers.
    var shift = CGPoint.zero
    var plan: [(MasonUIView, CGPoint)] = []
    var outermost: UIView = target
    var current = target.superview
    while let host = current, MasonViewKind.isElement(host) {
      outermost = host
      if let scroller = host as? MasonUIView, scroller._canScrollH || scroller._canScrollV {
        let rect = target.convert(target.bounds, to: scroller).offsetBy(dx: -shift.x, dy: -shift.y)
        let l = scroller.node.computedLayout
        let offset = scroller.contentOffset
        let b = scroller.bounds
        let portX = offset.x + px(l.borderLeft)
        let portY = offset.y + px(l.borderTop)
        let portW = b.width - px(l.borderLeft) - px(l.borderRight)
        let portH = b.height - px(l.borderTop) - px(l.borderBottom)
        let range = scroller.webScrollRange
        let to = CGPoint(
          x: min(max(0, align(rect.minX, rect.width, portX, portW, offset.x, inline)), range.x),
          y: min(max(0, align(rect.minY, rect.height, portY, portH, offset.y, block)), range.y)
        )
        if to != offset {
          plan.append((scroller, to))
          shift.x += to.x - offset.x
          shift.y += to.y - offset.y
        }
      }
      current = host.superview
    }
    for (scroller, to) in plan { scroller.webScrollTo(to.x, to.y, smooth: smooth) }
    // A host UIScrollView outside the Mason tree scrolls to it too.
    var ancestor = outermost.superview
    while let host = ancestor, !(host is UIScrollView) { ancestor = host.superview }
    if let scrollView = ancestor as? UIScrollView {
      // Instant scrolls already moved the target; smooth ones haven't yet.
      let pending = smooth ? shift : .zero
      let rect = target.convert(target.bounds, to: scrollView).offsetBy(dx: -pending.x, dy: -pending.y)
      scrollView.scrollRectToVisible(rect, animated: smooth)
    }
  }

  /// The offset that aligns [start, start + size) in the scrollport per `mode`.
  private static func align(_ start: CGFloat, _ size: CGFloat, _ portStart: CGFloat, _ portSize: CGFloat, _ offset: CGFloat, _ mode: Int) -> CGFloat {
    let end = start + size
    let portEnd = portStart + portSize
    switch mode {
    case 0: return offset + start - portStart
    case 1: return offset + (start + size / 2) - (portStart + portSize / 2)
    case 2: return offset + end - portEnd
    default:
      // CSSOM "nearest".
      if start < portStart && end > portEnd { return offset }
      if (start < portStart && size <= portSize) || (end > portEnd && size > portSize) { return offset + start - portStart }
      if (start < portStart && size > portSize) || (end > portEnd && size <= portSize) { return offset + end - portEnd }
      return offset
    }
  }
}

extension MasonUIView {
  /// `touch-action` for a touch at `point`: this view's flags and those of every
  /// view from the one under the point up to it, intersected.
  func _touchActionAt(_ point: CGPoint) -> Int {
    var flags = node.touchAction
    var current = hitTest(point, with: nil)
    while let view = current, view !== self {
      if let element = view as? MasonElement {
        flags &= element.node.touchAction
      }
      current = view.superview
    }
    return flags
  }
}

// MARK: - Private gesture delegate
// Separate class: UIView already exposes gestureRecognizerShouldBegin with the
// same ObjC selector, so conforming MasonUIView directly would conflict.
private final class _MasonScrollPanDelegate: NSObject, UIGestureRecognizerDelegate {
  weak var owner: MasonUIView?

  func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let v = owner else { return false }
    guard v._canScrollH || v._canScrollV else { return false }
    // `touch-action`: don't start a pan along an axis the touched element (or
    // anything between it and this view) keeps for itself, e.g. a slider.
    if let pan = gestureRecognizer as? UIPanGestureRecognizer {
      let axes = v._touchActionAt(pan.location(in: v))
      let velocity = pan.velocity(in: v)
      let horizontal = abs(velocity.x) > abs(velocity.y)
      if horizontal && axes & 1 == 0 { return false }
      if !horizontal && axes & 2 == 0 { return false }
    }
    return true
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
  ) -> Bool { true }
}

// Skips the backing store (and draw(_:)) while the owning view paints nothing.
final class MasonViewLayer: CALayer {
  override func display() {
    if let view = delegate as? MasonUIView, view.applyLayerPaintIfEligible() {
      contents = nil
      return
    }
    super.display()
  }
}
