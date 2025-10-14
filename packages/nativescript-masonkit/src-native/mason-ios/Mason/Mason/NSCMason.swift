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
  
  public static var shared = NSCMason()
  
  public override init() {
    nativePtr = mason_init()
  }
  
  deinit {
    mason_release(nativePtr)
  }
  
  public func nodeForView(_ view: UIView, _ isLeaf: Bool = true) -> MasonNode{
    if let view = view as? MasonElement{
      return view.node
    }
    
    guard let node = viewNodes[view] else {
      let node = MasonNode(mason: self)
      node.view = view
      if(isLeaf){
        // Set measure function for all leaf nodes (inline elements)
        node.setDefaultMeasureFunction()
      }
      
      viewNodes[view] = node
      return node
    }
    return node
  }
  
  
  public func configureStyleForView(_ view: UIView, _ block :(MasonStyle) -> Void){
    let node = nodeForView(view, view.subviews.isEmpty)
    node.style.inBatch = true
    block(node.style)
    node.style.inBatch = false
    node.style.updateNativeStyle()
  }
  
  public func styleForView(_ view: UIView) -> MasonStyle {
    let node = nodeForView(view)
    return node.style
  }
  
  
  @discardableResult public func layoutForView(_ view: UIView) -> MasonLayout {
    let node = nodeForView(view, view.subviews.isEmpty)
    let points = mason_node_layout(node.mason.nativePtr,
                                   node.nativePtr, create_layout)
    
    guard let points = points else {
      return MasonLayout.zero
    }
    
    let layout: MasonLayout = Unmanaged.fromOpaque(points).takeRetainedValue()
    return layout
  }
  
  public func clear(){
    mason_clear(nativePtr)
    nodes.removeAll()
    viewNodes.removeAll()
  }
  
  
  public func createDocument()-> MasonDocument {
    return MasonDocument(mason: self)
  }
  
  public func createView()-> MasonUIView {
    let view = MasonUIView(mason: self)
    
    return view
  }
  
  public func createTextView() -> MasonText {
    return MasonText(mason: self)
  }
  
  public func createTextNode(_ data: String)-> MasonTextNode {
    return MasonTextNode(mason: self, data: data)
  }
  
  public func createTextView(type: MasonTextType) -> MasonText {
    return MasonText(mason: self, type: type)
  }
  
  public func createImageView()-> Img {
    return Img(mason: self)
  }
  
  public func createScrollView()-> Scroll {
    let view = Scroll(mason: self)
    
    return view
  }
  
  public func createNode() -> MasonNode {
    return MasonNode(mason: self)
  }
  
  public func createNode(measure: @escaping MasonNode.MeasureFunc) -> MasonNode{
    return MasonNode(mason: self, measureFunc: measure)
  }
  
  public func printTree(_ node: MasonNode){
    mason_print_tree(nativePtr, node.nativePtr)
  }
  
  public func createTextNode() -> MasonNode{
    return MasonNode(textNode: self)
  }
  
  static let scale = Float(UIScreen.main.scale)
}
