//
//  MasonLi.swift
//  Mason
//
//  Created by Osei Fortune on 22/01/2026.
//

import UIKit

@objc(MasonLi)
@objcMembers
public class MasonLi: UIView,MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener {
  func onTextStyleChanged(change: Int64) {
    MasonNode.invalidateDescendantTextViews(node, change)
  }


  public func requestLayout() {
    if let cell = superview?.superview as? MasonList.MasonListCell {
      cell.setNeedsDisplay()
    }
  }


  public override func draw(_ rect: CGRect) {
    let hasBackground = style.mBackground.color != nil || !style.mBackground.layers.isEmpty
    let hasBoxShadow = !style.boxShadows.isEmpty
    let hasBorder = !style.mBorderRender.css.isEmpty
    let hasMarker = true // Li always potentially has a marker

    // Early-out: skip all CoreGraphics work for plain views with no decoration
    guard hasBackground || hasBoxShadow || hasBorder || hasMarker else { return }

    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }

    style.mBorderRender.resolve(for: bounds)
    let borderWidths = style.mBorderRender.cachedWidths
    let hasRadii = style.mBorderRender.hasRadii()

    let innerRect = bounds.inset(by: UIEdgeInsets(
      top: borderWidths.top,
      left: borderWidths.left,
      bottom: borderWidths.bottom,
      right: borderWidths.right
    ))

    // Outset shadows are handled by MasonShadowLayer

    // Block 1: Background with border-radius clip
    if hasBackground {
      context.saveGState()
      if hasRadii {
        let innerRadius = style.mBorderRender.radius.insetByBorderWidths(borderWidths)
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

    // Marker
    drawMarker(in: context, rect: innerRect)

    if hasBorder {
      style.mBorderRender.draw(in: context, rect: bounds)
    }
  }

  public private(set) var node: MasonNode
  public private(set) var mason: NSCMason

  public var uiView: UIView { self }

  public var style: MasonStyle {
    return node.style
  }

  public var isOrdered: Bool = false

  internal var position: Int = -1

  internal var marker = ""

  internal var markerWidth: Float = 0
  internal var markerHeight: Float = 0
  private var markerSize: Float = 0

  // Cached values to avoid recomputation during scroll
  private var cachedBaseline: CGFloat?
  private var cachedListStyleType: ListStyleType?
  private var metricsPosition: Int = -2  // tracks which position metrics were computed for
  private var metricsOrdered: Bool?      // tracks ordered state metrics were computed for

  public override func layoutSubviews() {
    super.layoutSubviews()
    style.updateShadowLayer(for: bounds)

    // Invalidate baseline cache when layout changes
    cachedBaseline = nil

    let markerOffset = CGFloat(markerWidth)
    layer.sublayerTransform = CATransform3DMakeTranslation(markerOffset, 0, 0)
  }

  /// Reset view state for recycling
  public func resetForRecycle() {
    position = -1
    isOrdered = false
    marker = ""
    markerWidth = 0
    markerHeight = 0
    markerSize = 0
    cachedBaseline = nil
    cachedListStyleType = nil
    metricsPosition = -2
    metricsOrdered = nil
    node.computedLayout = MasonLayout.zero
    setComputeCache(.init(width: -2, height: -2))
  }

  /// Set marker value and position for this list item
  public func bind(position: Int, isOrdered: Bool) {
    let changed = self.position != position || self.isOrdered != isOrdered
    self.position = position
    self.isOrdered = isOrdered

    // Set marker text based on ordered mode
    if isOrdered {
      self.marker = "\(position + 1)."
    } else {
      self.marker = "\u{2022}" // bullet character
    }

    guard changed else { return }

    // Invalidate caches
    cachedListStyleType = nil
    cachedBaseline = nil

    // Only recalculate if metrics are stale (measure function may have already computed them)
    if metricsPosition != position || metricsOrdered != isOrdered {
      calculateMarkerMetrics()
    }

    node.markDirty()
    setNeedsLayout()
    setNeedsDisplay()
  }

  /// Resolve the list style type, using cache when available
  private func resolvedListStyleType() -> ListStyleType {
    if let cached = cachedListStyleType {
      return cached
    }
    let resolved = resolveListStyleType()
    cachedListStyleType = resolved
    return resolved
  }

  /// Calculate marker width/height/size based on current list style and position.
  private func calculateMarkerMetrics() {
    let listType = resolvedListStyleType()

    guard listType != .None else {
      markerWidth = 0
      markerHeight = 0
      markerSize = 0
      metricsPosition = position
      metricsOrdered = isOrdered
      return
    }

    let font = style.font
    if font?.font == nil {
      font?.loadSync { _ in }
    }

    let fontSize = font?.uiFont?.pointSize ?? CGFloat(Constants.DEFAULT_FONT_SIZE)
    let ascent = font?.uiFont?.ascender ?? fontSize * 0.8
    let descent = font?.uiFont?.descender ?? fontSize * 0.2
    let textHeight = ascent - descent

    markerSize = Float(fontSize * 0.35)

    var width: CGFloat = 0

    switch listType {
    case .None:
      width = 0

    case .Custom:
      if !marker.isEmpty, let ctFont = font?.ctFont {
        let attributes: [NSAttributedString.Key: Any] = [.font: ctFont]
        let attributed = NSAttributedString(string: marker, attributes: attributes)
        let line = CTLineCreateWithAttributedString(attributed)
        width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
      }

    case .Disc, .Circle, .Square:
      width = CGFloat(markerSize)

    case .Decimal:
      if position > -1, let ctFont = font?.ctFont {
        let text = "\(position + 1)."
        let attributes: [NSAttributedString.Key: Any] = [.font: ctFont]
        let attributed = NSAttributedString(string: text, attributes: attributes)
        let line = CTLineCreateWithAttributedString(attributed)
        width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
      } else if let ctFont = font?.ctFont {
        let attributes: [NSAttributedString.Key: Any] = [.font: ctFont]
        let attributed = NSAttributedString(string: "0.", attributes: attributes)
        let line = CTLineCreateWithAttributedString(attributed)
        width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
      }
    }

    let gap = fontSize * 0.5
    markerWidth = Float(width + gap)
    markerHeight = Float(textHeight)
    metricsPosition = position
    metricsOrdered = isOrdered
  }


  private func drawMarker(in context: CGContext, rect: CGRect) {
    guard markerWidth > 0, markerHeight > 0 else { return }

    let listType = resolvedListStyleType()
    guard listType != .None else { return }

    let fontSize = CGFloat(style.font?.uiFont?.pointSize ?? CGFloat(Constants.DEFAULT_FONT_SIZE))
    let font = style.font?.uiFont ?? UIFont.systemFont(ofSize: fontSize)
    let ascent = font.ascender
    let descent = font.descender

    // Use cached baseline, falling back to computed value
    let baseline: CGFloat
    if let cached = cachedBaseline {
      baseline = cached
    } else {
      let computed = findFirstTextBaseline() ?? (rect.minY + ascent)
      cachedBaseline = computed
      baseline = computed
    }
    let x = rect.minX

    // Get text color from style or use label color
    let textColor = UIColor.colorFromARGB(style.color)

    context.saveGState()
    context.setFillColor(textColor.cgColor)
    context.setStrokeColor(textColor.cgColor)

    switch listType {
    case .Custom:
      // Custom text marker
      if !marker.isEmpty {
        let attributes: [NSAttributedString.Key: Any] = [
          .font: font,
          .foregroundColor: textColor
        ]
        let attributed = NSAttributedString(string: marker, attributes: attributes)
        // Draw at baseline
        attributed.draw(at: CGPoint(x: x, y: baseline - ascent))
      }

    case .Disc:
      // Filled disc
      let r = CGFloat(markerSize) / 2.0
      let cy = baseline + descent / 2.0
      let circleRect = CGRect(x: x, y: cy - r, width: r * 2, height: r * 2)
      context.fillEllipse(in: circleRect)

    case .Circle:
      // Hollow circle
      let r = CGFloat(markerSize) / 2.0
      let cy = baseline + descent / 2.0
      let lineWidth = max(1.0, fontSize * 0.08)
      let circleRect = CGRect(x: x + lineWidth/2, y: cy - r + lineWidth/2, width: r * 2 - lineWidth, height: r * 2 - lineWidth)
      context.setLineWidth(lineWidth)
      context.strokeEllipse(in: circleRect)

    case .Square:
      // Filled square
      let half = CGFloat(markerSize) / 2.0
      let cy = baseline + descent / 2.0
      let squareRect = CGRect(x: x, y: cy - half, width: half * 2, height: half * 2)
      context.fill(squareRect)

    case .Decimal:
      // Decimal number marker
      if position > -1 {
        let text = "\(position + 1)."
        let attributes: [NSAttributedString.Key: Any] = [
          .font: font,
          .foregroundColor: textColor
        ]
        let attributed = NSAttributedString(string: text, attributes: attributes)
        // Draw at baseline
        attributed.draw(at: CGPoint(x: x, y: baseline - ascent))
      }

    case .None:
      break
    }

    context.restoreGState()
  }

  /// Find the baseline of the first text view in the hierarchy
  private func findFirstTextBaseline() -> CGFloat? {
    return findFirstTextBaselineInView(self)
  }

  private func findFirstTextBaselineInView(_ view: UIView) -> CGFloat? {
    // Check if this is a UILabel
    if let label = view as? UILabel {
      // Return the baseline relative to self
      let labelFrame = label.convert(label.bounds, to: self)
      if let font = label.font {
        return labelFrame.minY + font.ascender
      }
    }

    // Check if this is a MasonText (custom text container)
    if view is TextContainer {
      let textFrame = view.convert(view.bounds, to: self)
      if let element = view as? MasonElement,
         let font = element.style.font?.uiFont {
        return textFrame.minY + font.ascender
      }
    }

    // Recursively check subviews
    for subview in view.subviews {
      if let baseline = findFirstTextBaselineInView(subview) {
        return baseline
      }
    }

    return nil
  }

  /// Resolves the effective list style type based on parent or own style
  private func resolveListStyleType() -> ListStyleType {
    let cell = superview?.superview as? MasonList.MasonListCell
    let list = cell?.collectionView?.superview as? MasonList

    // Also try to get list from node parent (more reliable during layout)
    let listFromNode = node.parent?.view as? MasonList
    let resolvedList = list ?? listFromNode

    // Check parent ListView style first
    if let parentStyle = resolvedList?.style, parentStyle.isValueInitialized {
      let isSet = parentStyle.getUInt8(StyleKeys.LIST_STYLE_TYPE_STATE) != 0
      if(isSet){
        let typeValue = parentStyle.getUInt8(StyleKeys.LIST_STYLE_TYPE)
        if let type = ListStyleType(rawValue: Int8(typeValue)) {
          return type
        }
      }
    }

    // Check own style
    if style.isValueInitialized {
      let isSet = style.getUInt8(StyleKeys.LIST_STYLE_TYPE_STATE) != 0
      if(isSet){
        let typeValue = style.getUInt8(StyleKeys.LIST_STYLE_TYPE)
        if let type = ListStyleType(rawValue: Int8(typeValue)) {
          return type
        }
      }
    }


    // Default based on parent list's ordered mode (fallback to local isOrdered)
    let orderedMode = resolvedList?.isOrdered ?? isOrdered

    return orderedMode ? .Decimal : .Disc
  }

  init(mason doc: NSCMason) {

    node = doc.createListItemNode()
    mason = doc

    super.init(frame: .zero)

    node.setMeasureFunction { [weak self] known, available in
      guard let self = self else { return .zero }
      // Sync isOrdered from parent
      if let list = self.node.parent?.view as? MasonList {
        self.isOrdered = list.isOrdered
      }

      // Only recalculate if metrics are stale
      if self.metricsPosition != self.position || self.metricsOrdered != self.isOrdered {
        self.calculateMarkerMetrics()
      }

      return CGSize(width: CGFloat(self.markerWidth), height: CGFloat(self.markerHeight))
    }

    isOpaque = false
    setComputeCache(.init(width: -2, height: -2))
    computeCacheDirty = false
    node.view = self
    style.setStyleChangeListener(listener: self)
  }



  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
