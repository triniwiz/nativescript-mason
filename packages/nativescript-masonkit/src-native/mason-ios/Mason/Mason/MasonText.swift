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




@available(iOS 15.0, *)
@objc(MasonText)
@objcMembers
public class MasonText: UIView, MasonView {
  
  public var text: String? = nil  {
    didSet {
      let string = text ?? ""
      storage.textStorage?.setAttributedString(NSAttributedString(string: string))
      setNeedsDisplay()
      invalidateIntrinsicContentSize()
    }
  }

  internal let container = NSTextContainer()
  internal let layoutManager = NSTextLayoutManager()
  internal let storage = NSTextContentStorage()
  
  
  public let node: MasonNode
  internal var children: [(MasonNode, UIView)] = []
  internal var attachments: [ViewAttachment] = []

  public init(mason: NSCMason) {
    storage.addTextLayoutManager(layoutManager)
    layoutManager.textContainer = container
    container.lineFragmentPadding = 0
    node = MasonNode(mason: mason)
    super.init(frame: .zero)
    node.data = self
    node.measureFunc = { known, available in
      return MasonText.measure(self, known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
  }
  
  public init(node masonNode: MasonNode){
    storage.addTextLayoutManager(layoutManager)
    layoutManager.textContainer = container
    container.lineFragmentPadding = 0
    node = masonNode
    super.init(frame: .zero)
    node.data = self
    masonNode.measureFunc = { known, available in
      return MasonText.measure(self, known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
  }
  
  public override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext() else { return }

           context.saveGState()
           context.translateBy(x: 0, y: bounds.height)
           context.scaleBy(x: 1.0, y: -1.0)

   
    layoutManager.enumerateTextLayoutFragments(from: layoutManager.documentRange.location) { layoutFragment in
      print(layoutFragment)
      layoutFragment.draw(at: .zero, in: context)
      return true
    }
           context.restoreGState()
  }
  
  public override var intrinsicContentSize: CGSize {
    guard let layoutFragment = layoutManager.textLayoutFragment(for: .zero) else {
             return .zero
         }
         return layoutFragment.layoutFragmentFrame.size
     }

  
  private static func measure(_ view: MasonText, _ known: CGSize?, _ available: CGSize) -> CGSize {
    view.sizeToFit()
    print("measure", view.intrinsicContentSize, known, available, view.text, view.frame, view.sizeThatFits(available))
    return view.intrinsicContentSize
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
      get {
          return node.style
      }
  }
  
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  public func configure(_ block: (MasonNode) -> Void) {
    block(node)
  }
  
  private func setup(){
   // addSubview(view)
  }
  
 
  lazy var textValues: NSMutableData = {
    let data = NSMutableData(length: 24)
  
    return data!
  }()
  
  
  public func updateText(_ value: String?){
    text = value ?? ""
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

    storage.textStorage?.append(view.storage.textStorage!)
    
    super.addSubview(view)
  }
  
  public override func willRemoveSubview(_ subview: UIView) {
    super.willRemoveSubview(subview)
    if let index = children.firstIndex(where: { node, view in
      view == subview
    }) {
      let child = children.remove(at: index)
      let textView = child.1 as? MasonText
      
      if let textView = textView {
        if let textStorage = storage.textStorage,
           let viewTextStorage = textView.storage.textStorage {
            let lengthToRemove = viewTextStorage.length
            let rangeToRemove = NSRange(location: textStorage.length - lengthToRemove, length: lengthToRemove)

            textStorage.deleteCharacters(in: rangeToRemove)
        }
        
      }
      
    }
    


  }
  
}
