//
//  MasonScroll.swift
//  Mason
//
//  Created by Osei Fortune on 16/08/2025.
//
import UIKit

@objc(MasonScroll)
@objcMembers
public class Scroll: UIScrollView, MasonElement, UIScrollViewDelegate {
  public var style: MasonStyle {
    return node.style
  }
  
  public var uiView: UIView {
    return self
  }
  
  public let node: MasonNode
  public let mason: NSCMason
  
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
  

  public func syncStyle(_ state: String) {
    guard let stateValue = Int64(state, radix: 10) else {return}
  //  let keys = StateKeys(rawValue: UInt64(stateValue))
    if (stateValue != -1) {
      style.isDirty = stateValue
      style.updateNativeStyle()
    }
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
