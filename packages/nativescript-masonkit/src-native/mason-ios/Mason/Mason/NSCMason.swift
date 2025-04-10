//
//  Mason.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit

@objc(NSCMason)
@objcMembers
public class NSCMason: NSObject {
    public internal(set) var nativePtr: OpaquePointer?
    internal var nodes: [Int64: MasonNode] = [:]
    internal var viewNodes: [UIView: MasonNode] = [:]
  
    public override init() {
        nativePtr = mason_init()
    }
    
    deinit {
        mason_release(nativePtr)
    }
  
  public func nodeForView(_ view: UIView, _ isLeaf: Bool = true) -> MasonNode{
    if(view is MasonView){
      return (view as! MasonView).node
    }
    guard let node = viewNodes[view] else {
      let node = MasonNode(mason: self)
      node.data = view
      if(isLeaf && (view.subviews.isEmpty || view is UILabel)){
        node.setDefaultMeasureFunction()
      }

      viewNodes[view] = node
      return node
    }
    return node
  }
    
    public func clear(){
        mason_clear(nativePtr)
        nodes.removeAll()
        viewNodes.removeAll()
    }
    
  public func createView()-> MasonUIView {
    let view = MasonUIView(mason: self)
    
    return view
  }
  
  public func createTextView() -> MasonText {
    return MasonText(mason: self)
  }
  
  public func createNode() -> MasonNode{
    return MasonNode(mason: self)
  }
  
  public func createNode(measure: @escaping MasonNode.MeasureFunc) -> MasonNode{
    return MasonNode(mason: self, measureFunc: measure)
  }
  
  public func createTextNode() -> MasonNode{
    return MasonNode(mason: self)
  }
  
    public static let instance = NSCMason()

    
    static let scale = Float(UIScreen.main.scale)
}
