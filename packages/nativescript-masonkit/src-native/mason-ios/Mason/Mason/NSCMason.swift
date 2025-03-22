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
    
    public func clear(){
        mason_clear(nativePtr)
        nodes.removeAll()
        viewNodes.removeAll()
    }
    
  public func createView()-> MasonView {
    let view = MasonView(mason: self)
    
    return view
  }
  
  public func createTextView() -> MasonText {
    return MasonText(mason: self)
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
