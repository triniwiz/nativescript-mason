//
//  MasonText.swift
//  Mason
//
//  Created by Osei Fortune on 20/03/2025.
//

import Foundation
import UIKit


@objc(MasonText)
@objcMembers
public class MasonText: UIView {
  internal let layoutManager = NSLayoutManager()
  internal let storage = NSTextStorage()
  internal let container = NSTextContainer()
  internal let view: UITextView
  let node: MasonNode
  internal var children: [(MasonNode, UIView)] = []
  func measure(_ known: CGSize?, _ available: CGSize) -> CGSize {
    return .zero
  }
  public init(mason: NSCMason) {
    view = UITextView(frame: .zero, textContainer: container)
    node = MasonNode(mason: mason, measureFunc: measure)
    super.init(frame: .zero)
  }
  
  public init(node masonNode: MasonNode){
    view = UITextView(frame: .zero, textContainer: container)
    node = masonNode
    masonNode.measureFunc = measure
    super.init(frame: .zero)
  }
  
  private func setup(){
    addSubview(view)
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
  }
  
  lazy var textValues: NSMutableData = {
    let data = NSMutableData(length: 24)
  
    return data!
  }()
  
  
  public func updateText(_ value: String?){
    view.text = value ?? ""
  }
  
  
  public override func addSubview(_ view: UIView) {
    if(children.contains(where: { (_, child) in
      child == view
    })) {
      return
    }
    
    guard let view = view as? MasonText else {
      
    }
    children.append((view.node, view))
    layoutManager.addTextContainer(view.container)
    addSubview(view)
  }
  
  public override func willRemoveSubview(_ subview: UIView) {
//    guard let index = children.firstIndex { (_, view) in
//      view == subview
//    } else {return}
//    let removed = children.remove(at: index)
//    layoutManager.re
  }
  
}
