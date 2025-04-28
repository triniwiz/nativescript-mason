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
  
  public internal(set) var layoutCache: MasonLayout? = nil
  public internal(set) var lastMeasureKnownSize: CGSize?
  public internal(set) var lastMeasureAvailableSize: CGSize?
  
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
  
  
  public func getRoot() -> MasonNode? {
    guard let owner = self.owner else {return nil}
    var current = owner
    var next: MasonNode? = current
    while(next != nil){
      next = current.owner
      if(next != nil){
        current = next!
      }
    }
    return current
  }
  
  public func compute() {
    mason_node_compute(mason.nativePtr, nativePtr)
  }
  
  public func compute(_ width: Float, _ height: Float) {
    mason_node_compute_wh(mason.nativePtr, nativePtr, width, height)
  }
  
  public func computeMaxContent() {
    mason_node_compute_max_content(mason.nativePtr, nativePtr)
  }
  
  public func computeMinContent() {
    mason_node_compute_min_content(mason.nativePtr, nativePtr)
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
    if(index == 0 && children.isEmpty){
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
      self.lastMeasureKnownSize = knownDimensions
      self.lastMeasureAvailableSize = availableSpace
      return MasonNode.measureFunction(view, knownDimensions, availableSpace)
    }
  }
  
  static func applyToView(_ node: MasonNode , _ layout: MasonLayout){
    node.layoutCache = layout
    if let view = node.data as? UIView {
      var realLayout = layout
      if(view is MasonText){
        let textView = view as! MasonText
        realLayout = textView.node.layoutCache!
      }
      let widthIsNan = realLayout.width.isNaN
      
      let heightIsNan = realLayout.height.isNaN
      
      let x = CGFloat(realLayout.x.isNaN ? 0 : realLayout.x/NSCMason.scale)
      
      let y = CGFloat(realLayout.y.isNaN ? 0 : realLayout.y/NSCMason.scale)
      
      let width = CGFloat(widthIsNan ? 0 : realLayout.width/NSCMason.scale)
      
      let height = CGFloat(heightIsNan ? 0 : realLayout.height/NSCMason.scale)
  
      let point = CGPoint(x: x, y: y)
      
      let size = CGSizeMake(width, height)
      
      view.frame = CGRect(origin: point, size: size)
      
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
