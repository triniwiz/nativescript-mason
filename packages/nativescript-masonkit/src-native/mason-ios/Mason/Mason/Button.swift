//
//  Button.swift
//  Mason
//
//  Created by Osei Fortune on 01/12/2025.
//

import UIKit


@objcMembers
@objc(MasonButton)
public class Button: UIControl,MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener, TextContainer {
  public let node: MasonNode
  public let mason: NSCMason
  
  public lazy var engine = {
    TextEngine(container: self)
  }()

  private var touchStartTime: CFTimeInterval?
  private let tapThreshold: CFTimeInterval = 0.25
  
  
  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
    return node.style
  }
  
  /// Text content - sets or gets the concatenated text from all text nodes
  public var textContent: String {
    get {
      engine.textContent
    }
    set {
      engine.textContent = newValue
    }
  }
  
  public func requestLayout() {
    engine.invalidateInlineSegments()
    // handle text nesting
    if(node.parent?.view is TextContainer){
      if(!engine.shouldFlattenTextContainer(self)){
        setNeedsDisplay()
      }
      if let parent = node.parent?.view as? MasonText{
        parent.requestLayout()
      }
      return
    }
    let root = node.getRootNode()
    let view = if(root.type == .document){
      root.document?.documentElement as? MasonElement
    }else {
      root.view as? MasonElement
    }
    
    if let view = view {
      if(view.computeCacheDirty){
        let computed = view.computeCache()
        view.computeWithSize(Float(computed.width), Float(computed.height))
      }
      setNeedsDisplay()
    }
  }
  
  
  public func addView(_ view: UIView){
    if(view.superview == self){
      return
    }
    if(view is MasonElement){
      append((view as! MasonElement))
    }else {
      append(node: node.mason.nodeForView(view))
    }
  }
  
  public func addView(_ view: UIView, at: Int){
    if(view.superview == self){
      return
    }
    
    if(view is MasonElement){
      node.addChildAt((view as! MasonElement).node, at)
    }else {
      node.addChildAt(node.mason.nodeForView(view), at)
    }
  }

  
  public override func layoutSubviews() {
    super.layoutSubviews()
    style.updateShadowLayer(for: bounds)
    autoComputeIfRoot()
  }

  public override func draw(_ rect: CGRect) {
    let hasBackground = style.mBackground.color != nil || !style.mBackground.layers.isEmpty
    let hasBoxShadow = !style.boxShadows.isEmpty
    let hasBorder = !style.mBorderRender.css.isEmpty

    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }

    style.mBorderRender.resolve(for: bounds)
    let borderWidths = style.mBorderRender.cachedWidths
    let hasRadii = style.mBorderRender.hasRadii()

    // Outset shadows are handled by MasonShadowLayer

    // Block 1: Background with border-radius clip
    if hasBackground {
      let innerRect = bounds.inset(by: UIEdgeInsets(
        top: borderWidths.top,
        left: borderWidths.left,
        bottom: borderWidths.bottom,
        right: borderWidths.right
      ))

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

    engine.drawText(context: context, rect: bounds)

    // Border drawn OUTSIDE any clip scope so strokes aren't clipped
    if hasBorder {
      style.mBorderRender.draw(in: context, rect: bounds)
    }
  }

  private func setup(){
    isOpaque = false
    style.setStyleChangeListener(listener: self)
    
    let scale = Float((window?.screen.scale ?? CGFloat(NSCMason.scale)))
    let x =  6 * scale
    let y =  scale

    configure { style in
      style.display = Display.InlineBlock
      style.fontFamily = "system-ui"
      style.textWrap = .NoWrap
      style.padding = MasonRect(.Points(y), .Points(x), .Points(y), .Points(x))
      style.background = "#F0F0F0"
      style.textAlign = .Center
      style.border = "1 solid #767676"
      style.borderRadius = "4"
    }
    node.view = self

    // Default :active pseudo style — darken whatever background is set via
    // CSS filter brightness, matching browser behavior without replacing the color.
    node.setPseudoString(PseudoState.active.rawValue, key: "filter", value: "brightness(0.85)")

    node.measureFunc = { [weak self] known, available in
      guard let self = self else { return .zero }
      return TextEngine.measure(self.engine, true, isBlock: false, known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
  }
  
  public var textValues: NSMutableData {
    get {
      return style.values
    }
  }
  
  public func onStyleChange(_ low: UInt64, _ high: UInt64) {
    engine.onStyleChange(low, high)
  }
  
  
  public override init(frame: CGRect) {
    node = NSCMason.shared.createTextNode()
    mason = NSCMason.shared
    super.init(frame: frame)
    setup()
  }
  
  
  init(mason doc: NSCMason) {
    node = doc.createTextNode()
    mason = doc
    super.init(frame: .zero)
    setup()
  }
  
  
  required init?(coder: NSCoder) {
    node = NSCMason.shared.createTextNode()
    mason = NSCMason.shared
    super.init(coder: coder)
    setup()
  }
  
}



extension Button {

  
  public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
      super.touchesBegan(touches, with: event)
      node.setPseudo(.active, true)
    setNeedsDisplay()
    touchStartTime = CACurrentMediaTime()
  }

  public override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
      super.touchesEnded(touches, with: event)
    let now = CACurrentMediaTime()
    let duration = (touchStartTime != nil) ? (now - touchStartTime!) : 0
    touchStartTime = nil

    // Provide tap feedback for short taps, keep active state during hold
    if duration < tapThreshold {
      // Quick tap: animate a brief scale "press" effect
      UIView.animate(withDuration: 0.08, animations: {
        self.transform = CGAffineTransform(scaleX: 0.98, y: 0.98)
      }, completion: { _ in
        UIView.animate(withDuration: 0.08) {
          self.transform = .identity
        }
      })
    }

    node.setPseudo(.active, false)
    setNeedsDisplay()
  }

 public override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
      super.touchesCancelled(touches, with: event)
      node.setPseudo(.active, false)
      setNeedsDisplay()
  }
  
  

  public override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
      guard let touch = touches.first else { return }
      let point = touch.location(in: self)

      let inside = bounds.contains(point)
      node.setPseudo(.active, inside)
      setNeedsDisplay()
      #if DEBUG
      print("[DEBUG] Button.touchesMoved inside:\(inside) point:\(point) frame:\(self.frame)")
      #endif
  }
  
}
