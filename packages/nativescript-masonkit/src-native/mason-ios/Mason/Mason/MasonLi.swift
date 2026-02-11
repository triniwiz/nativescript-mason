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
    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }
    style.mBorderRender.resolve(for: bounds)
    let borderWidths = style.mBorderRender.cachedWidths
    let innerRect = bounds.inset(by: UIEdgeInsets(
      top: borderWidths.top,
      left: borderWidths.left,
      bottom: borderWidths.bottom,
      right: borderWidths.right
    ))
    
    let innerRadius = style.mBorderRender.radius.insetByBorderWidths(borderWidths)
    let innerPath = style.mBorderRender.buildRoundedPath(in: innerRect, radius: innerRadius)
    
    context.saveGState()
    context.addPath(innerPath.cgPath)
    context.clip()
    style.mBackground.draw(on: self, in: context, rect: innerRect)
    context.restoreGState()
    
    // Marker
    drawMarker(in: context, rect: innerRect)
    
    style.mBorderRender.draw(in: context, rect: bounds)
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
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    
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
    node.computedLayout = MasonLayout.zero
    setComputeCache(.init(width: -2, height: -2))
  }
  
  /// Set marker value and position for this list item
  public func bind(position: Int, isOrdered: Bool) {
    self.position = position
    self.isOrdered = isOrdered
    
    // Set marker text based on ordered mode
    if isOrdered {
      self.marker = "\(position + 1)."
    } else {
      self.marker = "\u{2022}" // bullet character
    }
    
    // Mark node as dirty to trigger re-measurement
    node.markDirty()
    setNeedsLayout()
    setNeedsDisplay()
  }
  
  
  private func drawMarker(in context: CGContext, rect: CGRect) {
    guard markerWidth > 0, markerHeight > 0 else { return }
    
    let listType = resolveListStyleType()
    guard listType != .None else { return }
    
    let fontSize = CGFloat(style.font?.uiFont?.pointSize ?? CGFloat(Constants.DEFAULT_FONT_SIZE))
    let font = style.font?.uiFont ?? UIFont.systemFont(ofSize: fontSize)
    let ascent = font.ascender
    let descent = font.descender
    
    // Find first text baseline from children, like Android
    let baseline = findFirstTextBaseline() ?? (rect.minY + ascent)
    let x = rect.minX
    
    // Get text color from style or use label color
    let textColor = UIColor.label
    
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
    // Check parent ListView style first
    if let parentStyle = list?.style, parentStyle.isValueInitialized {
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
    
    // Default based on ordered mode
    return isOrdered ? .Decimal : .Disc
  }
  
  init(mason doc: NSCMason) {
    
    node = doc.createListItemNode()
    mason = doc
    
    super.init(frame: .zero)
    
    node.setMeasureFunction { known, available in
      // Sync isOrdered from parent
      if let list = self.node.parent?.view as? MasonList {
        self.isOrdered = list.isOrdered
      }
      
      // Get resolved list style type
      let listType = self.resolveListStyleType()
      
      // No marker for None type
      if listType == .None {
        self.markerWidth = 0
        self.markerHeight = 0
        self.markerSize = 0
        return .zero
      }
      
      let font = self.style.font
      if font?.font == nil {
        font?.loadSync { _ in }
      }
      
      let fontSize = font?.uiFont?.pointSize ?? CGFloat(Constants.DEFAULT_FONT_SIZE)
      let ascent = font?.uiFont?.ascender ?? fontSize * 0.8
      let descent = font?.uiFont?.descender ?? fontSize * 0.2
      let textHeight = ascent - descent
      
      // Calculate marker size (35% of font size for shapes)
      self.markerSize = Float(fontSize * 0.35)
      
      var width: CGFloat = 0
      
      switch listType {
      case .None:
        width = 0
        
      case .Custom:
        // Custom text marker
        if !self.marker.isEmpty, let ctFont = font?.ctFont {
          let attributes: [NSAttributedString.Key: Any] = [.font: ctFont]
          let attributed = NSAttributedString(string: self.marker, attributes: attributes)
          let line = CTLineCreateWithAttributedString(attributed)
          width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
        }
        
      case .Disc, .Circle, .Square:
        // Shape markers use markerSize
        width = CGFloat(self.markerSize)
        
      case .Decimal:
        // Decimal markers: measure the text
        if self.position > -1, let ctFont = font?.ctFont {
          let text = "\(self.position + 1)."
          let attributes: [NSAttributedString.Key: Any] = [.font: ctFont]
          let attributed = NSAttributedString(string: text, attributes: attributes)
          let line = CTLineCreateWithAttributedString(attributed)
          width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
        } else if let ctFont = font?.ctFont {
          // Fallback estimate
          let attributes: [NSAttributedString.Key: Any] = [.font: ctFont]
          let attributed = NSAttributedString(string: "0.", attributes: attributes)
          let line = CTLineCreateWithAttributedString(attributed)
          width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
        }
      }
      
      // Add gap to marker width
      let gap = fontSize * 0.5
      self.markerWidth = Float(width + gap)
      self.markerHeight = Float(textHeight)
      
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
