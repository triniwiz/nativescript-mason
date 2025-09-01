//
//  MasonNode.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit


private func measure(_ node: UnsafeRawPointer?, _ knownDimensionsWidth: Float, _ knownDimensionsHeight: Float, _ availableSpaceWidth: Float, _ availableSpaceHeight: Float) -> Int64 {
  let node: MasonNode = Unmanaged.fromOpaque(node!).takeUnretainedValue()
  
  guard let size = node.measureFunc?(CGSize(width: CGFloat(knownDimensionsWidth), height: CGFloat(knownDimensionsHeight)), CGSize(width: CGFloat(availableSpaceWidth), height: CGFloat(availableSpaceHeight))) else {
    return MeasureOutput.make(Float.nan, Float.nan)
  }
  
  return MeasureOutput.make(width: size.width, height: size.height)
}


private func create_layout(_ floats: UnsafePointer<Float>?) -> UnsafeMutableRawPointer? {
  let layout = MasonLayout.fromFloatPoint(floats!).1
  return Unmanaged.passRetained(layout).toOpaque()
}


@objc(MasonNode)
@objcMembers
public class MasonNode: NSObject {
  internal var mason: NSCMason
  public internal(set) var nativePtr: OpaquePointer?
  
  public internal(set) var computedLayout = MasonLayout()
  
  public typealias MeasureFunc = (CGSize?, CGSize) -> CGSize
  
  public var data: Any? = nil
  
  internal var measureFunc: MeasureFunc? = nil
  
  
  lazy public var style: MasonStyle = {
    MasonStyle(node: self)
  }()
  
  public internal(set) var owner: MasonNode? = nil
  public internal(set) var children: [MasonNode] = []
  
  var inBatch = false {
    didSet {
      style.inBatch = inBatch
    }
  }
  
  internal init(mason doc: NSCMason) {
    mason = doc
    nativePtr = mason_node_new_node(mason.nativePtr)
    super.init()
  }
  
  
  public init(mason doc: NSCMason, children nodes: [MasonNode]) {
    var childrenMap = nodes.map { node in
      node.nativePtr
    }
    mason = doc
    nativePtr = mason_node_new_node_with_children(mason.nativePtr, &childrenMap, UInt(childrenMap.count))
    
    children = nodes
    
    super.init()
    
    children.forEach { node in
      node.owner = self
    }
  }
  
  
  internal init(mason doc : NSCMason, measureFunc function: @escaping MeasureFunc) {
    measureFunc = function
    mason = doc
    nativePtr = mason_node_new_node(mason.nativePtr)
    super.init()
    mason_node_set_context(mason.nativePtr, nativePtr, Unmanaged.passRetained(self).toOpaque(), measure)
  }
  
  deinit {
    mason_node_destroy(nativePtr)
  }
  
  
  
  static func to_vec_non_repeated_track_sizing_function(_ array: Array<MinMax>) -> CMasonNonRepeatedTrackSizingFunctionArray {
    let length = array.count
    var cArray = array.map({ minMax in
      minMax.cValue
    })
    return CMasonNonRepeatedTrackSizingFunctionArray(array: cArray.withUnsafeMutableBytes({ ptr in
      ptr.baseAddress!.bindMemory(to: CMasonMinMax.self, capacity: length)
    }), length: UInt(length))
  }
  
  
  
  @discardableResult public func layout() -> MasonLayout {
    
    let points = mason_node_layout(mason.nativePtr,
                                   nativePtr, create_layout)
    
    let layout: MasonLayout = Unmanaged.fromOpaque(points!).takeRetainedValue()
    return layout
  }
  
  public var isDirty: Bool {
    return mason_node_dirty(mason.nativePtr, nativePtr)
  }
  
  public func markDirty(){
    mason_node_mark_dirty(mason.nativePtr, nativePtr)
  }
  
  var root: MasonNode? {
    guard let owner = self.owner else {return nil}
    var current: MasonNode? = owner
    var next: MasonNode? = current
    while(next != nil){
      next = current?.owner
      if(next != nil){
        current = next
      }
    }
    return current
  }
  
  
  
  public func getRoot() -> MasonNode? {
    return root
  }
  
  internal var computeCache: CGSize?
  public func compute() {
    mason_node_compute(mason.nativePtr, nativePtr)
  }
  
  public func compute(_ width: Float, _ height: Float) {
    mason_node_compute_wh(mason.nativePtr, nativePtr, width, height)
    computeCache = CGSize(width: CGFloat(width), height: CGFloat(height))
  }
  
  public func computeMaxContent() {
    mason_node_compute_max_content(mason.nativePtr, nativePtr)
    computeCache = CGSize(width: CGFloat(-2), height: CGFloat(-2))
  }
  
  public func computeMinContent() {
    mason_node_compute_min_content(mason.nativePtr, nativePtr)
    computeCache = CGSize(width: CGFloat(-1), height: CGFloat(-1))
  }
  
  public func computeWithSize(_ width: Float, _ height: Float){
    compute(width, height)
    let layout = self.layout()
    MasonNode.applyToView(self, layout)
  }
  
  public func computeWithViewSize(){
    computeWithViewSize(layout: false)
  }
  
  public func computeWithViewSize(layout: Bool){
    guard let view = data as? MasonUIView else{return}
    compute(Float(view.frame.size.width) * NSCMason.scale, Float(view.frame.size.height) * NSCMason.scale)
    if(layout){
      MasonNode.applyToView(view.node, view.node.layout())
    }
  }
  
  public func computeWithMaxContent(){
    computeMaxContent()
    let layout = self.layout()
    MasonNode.applyToView(self, layout)
  }
  
  public func computeWithMinContent(){
    computeMinContent()
    let layout = self.layout()
    MasonNode.applyToView(self, layout)
  }
  
  public func attachAndApply(){
    let layout = self.layout()
    MasonNode.applyToView(self, layout)
  }
  func getChildAt(_ index: Int) -> MasonNode? {
    return children[index]
  }
  
  
  
  public func setChildren(value: [MasonNode]){
    let children = value.map { node in
      node.nativePtr
    }
    
    mason_node_set_children(mason.nativePtr, nativePtr, children, UInt(children.count))
    self.children.removeAll()
    self.children.append(contentsOf: value)
  }
  
  func addChildren(_ children: [OpaquePointer?]){
    mason_node_add_children(mason.nativePtr, nativePtr, children, UInt(children.count))
  }
  
  public func addChildren(_ children: [MasonNode]){
    let map = children.map { node in
      node.owner = self
      return node.nativePtr
    }
    
    mason_node_add_children(mason.nativePtr, nativePtr, map, UInt(map.count))
  }
  
  func addChild(_ child: MasonNode) {
    if(child.owner != nil){
      if(child.owner == self){return}
      child.owner?.removeChild(child: child)
      // remove parent
    }
    
    mason_node_add_child(mason.nativePtr, nativePtr, child.nativePtr)
    children.append(child)
    child.owner = self
  }
  
  func addChildAt(_ child: MasonNode, _ index: Int) {
    
    mason_node_add_child_at(mason.nativePtr, nativePtr, child.nativePtr, UInt(index))
    
    child.owner = self
    if(index == -1 || index == children.count){
      children.append(child)
    }else {
      children.insert(child, at: index)
      let removed = children.remove(at: index + 1)
      
      removed.owner = nil
    }
    
  }
  
  
  
  @discardableResult func removeChild(child: MasonNode) -> MasonNode? {
    let removedNode = mason_node_remove_child(mason.nativePtr, nativePtr, child.nativePtr)
    
    if (removedNode == nil) {
      return nil
    }
    child.owner = nil
    
    guard let index = children.firstIndex(of: child) else {
      return nil
    }
    children.remove(at: index)
    
    return child
  }
  
  
  func removeAllChildren() {
    mason_node_remove_children(mason.nativePtr, nativePtr)
    children.forEach { child in
      child.owner = nil
    }
    children.removeAll()
  }
  
  
  func removeChildAt(index: Int) -> MasonNode? {
    // TODO handle negative index
    if(index < 0){
      return nil
    }
    guard mason_node_remove_child_at(mason.nativePtr, nativePtr, UInt(index)) != nil else {return nil}
    let removed = children.remove(at: index)
    removed.owner = nil
    return removed
  }
  
  
  func removeMeasureFunction(){
    mason_node_remove_context(mason.nativePtr, nativePtr)
    self.measureFunc = nil
  }
  
  func setMeasureFunction(_ measureFunc: @escaping MeasureFunc) {
    self.measureFunc = measureFunc
    
    mason_node_set_context(mason.nativePtr, nativePtr, Unmanaged.passUnretained(self).toOpaque(), measure)
  }
  
  public func configure(_ block :(MasonNode) -> Void) {
    inBatch = true
    block(self)
    inBatch = false
    style.updateNativeStyle()
  }
  
  func setDefaultMeasureFunction(){
    guard let view = data as? UIView else {return}
    self.setMeasureFunction { knownDimensions, availableSpace in
      return MasonNode.measureFunction(view, knownDimensions, availableSpace)
    }
  }
  
  private func handleOverflow(_ overflow: Overflow, _ scroll: UIScrollView, _ vertical: Bool = false) {
    switch(overflow){
    case .Visible:
      scroll.clipsToBounds = false
      if(vertical){
        scroll.alwaysBounceVertical = false
        scroll.showsVerticalScrollIndicator = false
      }else {
        scroll.alwaysBounceHorizontal = false
        scroll.showsHorizontalScrollIndicator = false
      }
    case .Hidden:
      scroll.clipsToBounds = true
      scroll.alwaysBounceVertical = true
      scroll.alwaysBounceHorizontal = true
      if(vertical){
        scroll.alwaysBounceVertical = true
        scroll.showsVerticalScrollIndicator = false
      }else {
        scroll.alwaysBounceHorizontal = true
        scroll.showsHorizontalScrollIndicator = false
      }
    case .Scroll:
      scroll.clipsToBounds = true
      if(vertical){
        scroll.alwaysBounceVertical = true
        scroll.showsVerticalScrollIndicator = true
      }else {
        scroll.alwaysBounceHorizontal = true
        scroll.showsHorizontalScrollIndicator = true
      }
    case .Clip:
      scroll.clipsToBounds = true
      if(vertical){
        scroll.alwaysBounceVertical = true
        scroll.showsVerticalScrollIndicator = false
      }else {
        scroll.alwaysBounceHorizontal = true
        scroll.showsHorizontalScrollIndicator = false
      }
    case .Auto:
      scroll.clipsToBounds = true
      if(vertical){
        if(scroll.contentSize.height > scroll.bounds.size.height){
          scroll.showsVerticalScrollIndicator = true
        }else {
          scroll.showsVerticalScrollIndicator = false
        }
        scroll.alwaysBounceVertical = true
      }else {
        if(scroll.contentSize.width > scroll.bounds.size.width){
          scroll.showsHorizontalScrollIndicator = true
        }else {
          scroll.showsHorizontalScrollIndicator = false
        }
        scroll.showsHorizontalScrollIndicator = false
      }
    }
  }
  
  static func applyToView(_ node: MasonNode , _ layout: MasonLayout){
    node.computedLayout = layout
    
    if let view = node.data as? UIView {
      var realLayout = layout
      var isText = false
      var hasWidthConstraint: Bool = false
      var hasHeightConstraint: Bool = false
      if let view = view as? MasonText {
        realLayout = view.node.computedLayout
        isText = true
        hasWidthConstraint = view.node.style.size.width != .Auto
        hasHeightConstraint = view.node.style.size.height != .Auto
      }
      
      let widthIsNan = realLayout.width.isNaN
      
      let heightIsNan = realLayout.height.isNaN
      
      let x = CGFloat(realLayout.x.isNaN ? 0 : realLayout.x/NSCMason.scale)
      
      let y = CGFloat(realLayout.y.isNaN ? 0 : realLayout.y/NSCMason.scale)
      
      var width = CGFloat(widthIsNan ? 0 : realLayout.width/NSCMason.scale)
      
      var height = CGFloat(heightIsNan ? 0 : realLayout.height/NSCMason.scale)
      
      if(isText){
        if(!hasWidthConstraint){
          width = CGFloat(realLayout.contentSize.width.isNaN ? 0 : realLayout.contentSize.width/NSCMason.scale)
        }
        
        if(!hasHeightConstraint){
          height = CGFloat(realLayout.contentSize.height.isNaN ? 0 : realLayout.contentSize.height/NSCMason.scale)
        }
      }
      
      let point = CGPoint(x: x, y: y)
      
      let size = CGSizeMake(width, height)
      
      view.frame = CGRect(origin: point, size: size)
      
      if let view = view as? MasonText {
        view.invalidate(layout: true)
      }
      
      if let scroll = node.data as? Scroll {
        let overflow = node.style.overflow
        
        
        scroll.contentSize = CGSize(width: CGFloat(realLayout.contentSize.width.isNaN ? 0 : realLayout.contentSize.width/NSCMason.scale), height: CGFloat(realLayout.contentSize.height.isNaN ? 0 : realLayout.contentSize.height/NSCMason.scale))
        
        
        node.handleOverflow(overflow.x, scroll)
        node.handleOverflow(overflow.y, scroll, true)
        
      }
      
    }
    
    
    let count = node.children.count
    for i in 0..<count{
      if let child = node.getChildAt(i) {
        let layout = layout.children[i]
        applyToView(child, layout)
      }
    }
    
    
  }
  
  enum MeasureMode {
    case Min
    case Max
    case Definite
  }
  
  static func measureFunction(_ view: UIView, _ knownDimensions: CGSize?,_ availableSpace: CGSize) -> CGSize {
    
    var width = CGFloat.greatestFiniteMagnitude
    var height = CGFloat.greatestFiniteMagnitude
    
    
    if(knownDimensions?.width.isZero == true){
      width = 0
    }else if(availableSpace.width > 0){
      width = availableSpace.width
    }
    
    if(knownDimensions?.height.isZero == true){
      height = 0
    }else if(availableSpace.height > 0){
      height = availableSpace.height
    }
    
    return view.sizeThatFits(CGSize(width: width, height: height))
  }
  
  
}
