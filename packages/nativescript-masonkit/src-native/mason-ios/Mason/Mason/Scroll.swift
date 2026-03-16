//
//  MasonScroll.swift
//  Mason
//
//  Created by Osei Fortune on 16/08/2025.
//
import UIKit

@objc(MasonScroll)
@objcMembers
public class Scroll: UIScrollView, UIScrollViewDelegate,MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener {
  func onStyleChange(_ low: UInt64, _ high: UInt64) {
    if isHandlingStyleChange { return }
    isHandlingStyleChange = true
    defer { isHandlingStyleChange = false }

    MasonNode.invalidateDescendantTextViews(node, low, high)
  }
  
  public override func draw(_ rect: CGRect) {

    let hasBackground = style.mBackground.color != nil || !style.mBackground.layers.isEmpty
    let hasBoxShadow = !style.boxShadows.isEmpty
    let hasBorder = !style.mBorderRender.css.isEmpty

    // Early-out: skip all CoreGraphics work for plain views with no decoration
    guard hasBackground || hasBoxShadow || hasBorder else { return }

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

    // Border drawn OUTSIDE any clip scope so strokes aren't clipped
    if hasBorder {
      style.mBorderRender.draw(in: context, rect: bounds)
    }

    style.applyResolvedFilter(in: context, rect: bounds, view: self)
  }

  public override func layoutSubviews() {
    if isApplyingLayout {
      super.layoutSubviews()
      return
    }

    isApplyingLayout = true
    defer { isApplyingLayout = false }

    super.layoutSubviews()

    // Only update shadow layer / recompute if bounds actually changed
    if !bounds.equalTo(lastBounds) {
      style.updateShadowLayer(for: bounds)
      autoComputeIfRoot()
      lastBounds = bounds
    }
  }

  public let node: MasonNode
  public let mason: NSCMason

  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
    return node.style
  }

  private var isApplyingLayout: Bool = false
  private var isHandlingStyleChange: Bool = false
  private var lastBounds: CGRect = .zero
  
  internal var canScroll: (Bool, Bool) {
    let flow = node.style.overflow
    var canScrollHorizontally: Bool = false
    var canScrollVertically: Bool = false
    switch(flow.x, flow.y){
    case (let x, let y):
      switch(x){
      case .Hidden, .Scroll, .Auto:
        canScrollHorizontally = true
      case .Visible, .Clip:
        canScrollHorizontally = false
      }
      
      switch(y){
      case .Hidden, .Scroll, .Auto:
        canScrollVertically = true
      case .Visible, .Clip:
        canScrollVertically = false
      }
    }
    
    return (canScrollHorizontally, canScrollVertically)
  }

  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    node.view = self
    self.delegate = self
    style.setStyleChangeListener(listener: self)
    isOpaque = false
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  private var lastContentOffset: CGPoint = .zero
  public func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
    lastContentOffset = scrollView.contentOffset
  }
  
  
  public func scrollViewDidScroll(_ scrollView: UIScrollView) {
    let (canScrollHorizontally, canScrollVertically) = canScroll

    var targetOffset = scrollView.contentOffset

    if !canScrollHorizontally {
        targetOffset.x = lastContentOffset.x
    }
    if !canScrollVertically {
        targetOffset.y = lastContentOffset.y
    }

    if targetOffset != scrollView.contentOffset {
        scrollView.contentOffset = targetOffset
    }

    lastContentOffset = targetOffset
  }
  
  
  public func addView(_ view: UIView){
    if(view.superview == self){
      return
    }
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

    if(view is MasonElement){
      node.addChildAt((view as! MasonElement).node, at)
    }else {
      node.addChildAt(mason.nodeForView(view), at)
    }
  }
  
  
  func checkAndUpdateStyle() {
      if (!node.inBatch) {
        node.style.updateNativeStyle()
      }
  }
  
  @objc public func setSize(_ width: Float,_  height: Float) {
      node.style.size = MasonSize(
          MasonDimension.Points(width),
          MasonDimension.Points(height)
      )
      checkAndUpdateStyle()
  }
  
}
