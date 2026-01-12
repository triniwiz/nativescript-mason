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
  func onTextStyleChanged(change: Int64) {
    MasonNode.invalidateDescendantTextViews(node, change)
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
    
    style.mBorderRender.draw(in: context, rect: bounds)
    style.mBorderRender.draw(in: context, rect: bounds)
  }
  
  public let node: MasonNode
  public let mason: NSCMason
  
  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
    return node.style
  }
  
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
