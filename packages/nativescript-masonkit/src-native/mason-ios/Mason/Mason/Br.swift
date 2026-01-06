//
//  Br.swift
//  Mason
//
//  Created by Osei Fortune on 29/12/2025.
//

import UIKit

@objc(MasonBr)
@objcMembers
public class MasonBr: NSObject, MasonElement {
  public let mason: NSCMason
  public var node: MasonNode
  
  internal class FakeView: UIView {}
  
  private lazy var view: FakeView =  {
    FakeView(frame: .zero)
  }()
  
  public var uiView: UIView {
    get {
      return view
    }
  }
  
  private static func measureText(_ node: MasonNode, _ text: String) -> CGSize {
    let attributes = node.getDefaultAttributes()
    let attString = NSAttributedString(string: text, attributes: attributes)
    let framesetter = CTFramesetterCreateWithAttributedString(attString)
    return CTFramesetterSuggestFrameSizeWithConstraints(framesetter, CFRange(location: 0,length: attString.length), nil, .init(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude), nil)
  }
  
  init(mason doc: NSCMason) {
    mason = doc
    node = doc.createLineBreakNode()
    super.init()
    node.view = view
    
    node.measureFunc = { known, available in
      var ret = CGSize.zero
      if(available.width.isFinite && available.width > 0){
        ret.width = available.width
      }
      
      let lineHeightType = self.style.resolvedLineHeightType
      let lineHeight = self.style.resolvedLineHeight
      
      if(lineHeightType == 1){
        ret.height = CGFloat(lineHeight)
      }else {
        if(lineHeight > 0){
          ret.height = CGFloat(lineHeight)
        }else {
          let size = MasonBr.measureText(self.node, "0")
          ret.height = size.height
        }
      }
      
      return ret
    }
    node.setMeasureFunction(node.measureFunc!)
  }

}
