//
//  MasonText.swift
//  Mason
//
//  Created by Osei Fortune on 20/03/2025.
//

import Foundation
import UIKit


class ViewAttachment: NSTextAttachment {
    weak var view: UIView?

    init(view: UIView) {
        super.init(data: nil, ofType: nil)
        self.view = view
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }
    
    override func attachmentBounds(for textContainer: NSTextContainer?, proposedLineFragment lineFrag: CGRect, glyphPosition position: CGPoint, characterIndex charIndex: Int) -> CGRect {
        guard let view = view else { return .zero }
        return CGRect(origin: .zero, size: view.frame.size)
    }
}


@objc(MasonText)
@objcMembers
public class MasonText: UIView {
  internal let layoutManager = NSLayoutManager()
  internal let storage = NSTextStorage()
  internal let container = NSTextContainer()
  internal let view: UITextView
  let node: MasonNode
  internal var children: [(MasonNode, UIView)] = []
  internal var attachments: [ViewAttachment] = []
  private static func measure(_ known: CGSize?, _ available: CGSize) -> CGSize {
    return .zero
  }
  public init(mason: NSCMason) {
    view = UITextView(frame: .zero, textContainer: container)
    node = MasonNode(mason: mason, measureFunc: MasonText.measure)
    super.init(frame: .zero)
    node.data = self
  }
  
  public init(node masonNode: MasonNode){
    view = UITextView(frame: .zero, textContainer: container)
    node = masonNode
    masonNode.measureFunc = MasonText.measure
    super.init(frame: .zero)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  private func setup(){
    addSubview(view)
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
      node.mason
      return
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
