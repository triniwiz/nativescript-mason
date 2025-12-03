//
//  NodeUtils.swift
//  Mason
//
//  Created by Osei Fortune on 01/11/2025.
//

import UIKit

class NodeUtils {
  static func invalidateLayout(_ node: MasonNode){
    node.markDirty()
    let root = node.getRootNode()
    let view = if(root.type == .document){
      root.document?.documentElement as? MasonElement
    }else {
      root.view as? MasonElement
    }
    
    if let view = view {
      let computed = view.computeCache()
      view.computeWithSize(Float(computed.width), Float(computed.height))
    }
  }
  
  static func addView(_ node: MasonNode, _ view: UIView?){
    guard let view = view else { return }
    guard let parent = node.view else { return }
    if(parent is TextContainer){
      return
    }
    node.suppressChildOperations {
      parent.addSubview(view)
    }
  }
  
  static func addView(_ node: MasonNode, _ view: UIView?, _ index: Int){
    guard let view = view else { return }
    guard let parent = node.view else { return }
    if(parent is TextContainer){return}
    node.suppressChildOperations {
      parent.insertSubview(view, at: index)
    }
  }
  
  
  static func removeView(_ node: MasonNode, _ view: UIView?){
    guard let view = view else { return }
    guard let parent = node.view else { return }
    if(parent is TextContainer){return}
    node.suppressChildOperations {
      // only remove if child belongs to parent
      if(parent == view.superview){
        view.removeFromSuperview()
      }
    }
  }
  
  static func syncNode(_ node: MasonNode, _ children: [MasonNode]) {
    let nativeChildren = children
      .map{$0.nativePtr}
      .filter { $0 != nil }
      .map(\.self)
    mason_node_set_children(node.mason.nativePtr, node.nativePtr, nativeChildren, UInt(nativeChildren.count))
  }
}
