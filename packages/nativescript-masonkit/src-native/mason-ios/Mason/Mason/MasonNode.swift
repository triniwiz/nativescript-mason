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


public enum MasonNodeType: Int32, RawRepresentable {
  case element
  case text
}

@objc(MasonNode)
@objcMembers
public class MasonNode: NSObject {
  internal var mason: NSCMason
  
  internal var isAnonymous = false
  
  public internal(set) var nativePtr: OpaquePointer?
  
  public internal(set) var computedLayout = MasonLayout()
  
  public typealias MeasureFunc = (CGSize?, CGSize) -> CGSize
  
  internal var view: UIView? = nil
  
  internal var children: [MasonNode] = []
  
  internal var measureFunc: MeasureFunc? = nil
  
  public func getRootNode() -> MasonNode {
    var current = self
    while current.parent != nil {
      current = current.parent!
    }
    return current
  }
  
  lazy internal var style: MasonStyle = {
    MasonStyle(node: self)
  }()
  
  public internal(set) var parent: MasonNode? = nil
  
  public internal(set) var type: MasonNodeType = .element
  
  public func getChildren() -> [MasonNode] {
    var out: [MasonNode] = []
    collectAuthorChildren(into: &out, from: children)
    return out
  }
  
  
  public func getLayoutChildren() -> [MasonNode] {
    return children
  }
  
  // MARK: - Helpers
  
  private func collectAuthorChildren(into out: inout [MasonNode], from nodes: [MasonNode]) {
    for child in nodes {
      if child.isAnonymous {
        collectAuthorChildren(into: &out, from: child.children)
      } else {
        out.append(child)
      }
    }
  }
  
  
  var inBatch = false {
    didSet {
      style.inBatch = inBatch
    }
  }
  
  
  internal init(dataNode doc: NSCMason) {
    mason = doc
    nativePtr = nil
    type = .text
    super.init()
  }
  internal init(mason doc: NSCMason) {
    mason = doc
    nativePtr = mason_node_new_node(mason.nativePtr)
    type = .element
    super.init()
  }
  
  
  internal init(textNode doc: NSCMason) {
    mason = doc
    nativePtr = mason_node_new_text_node(mason.nativePtr)
    type = .element
    super.init()
  }
  
  
  public init(mason doc: NSCMason, children nodes: [MasonNode]) {
    var childrenMap = nodes.map { node in
      node.nativePtr
    }
    mason = doc
    nativePtr = mason_node_new_node_with_children(mason.nativePtr, &childrenMap, UInt(childrenMap.count))
    
    children = nodes
    type = .element
    super.init()
    
    children.forEach { node in
      node.parent = self
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
    guard let nativePtr else { return }
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
  
  public var isDirty: Bool {
    return mason_node_dirty(mason.nativePtr, nativePtr)
  }
  
  public func markDirty(){
    mason_node_mark_dirty(mason.nativePtr, nativePtr)
  }
  
  public func getRoot() -> UIView? {
    return getRootNode().view
  }
}


// MARK: - Child Management
extension MasonNode {
  
  func getChildAt(_ index: Int) -> MasonNode? {
    guard !children.isEmpty else { return nil }
    guard index >= 0 && index < children.count else { return nil }
    return children[index]
  }
  
  public func setChildren(value: [MasonNode]) {
    // Remove old children
    for child in children {
      child.parent = nil
      child.view?.removeFromSuperview()
    }
    
    // Set new children
    children = value
    
    // Update parent references and add views
    for child in value {
      child.parent = self
      if let childView = child.view {
        view?.addSubview(childView)
      }
    }
    
    // Sync to native layer (only real nodes with nativePtr)
    let nativeChildren = value.compactMap { Optional($0.nativePtr) }
    mason_node_set_children(mason.nativePtr, nativePtr, nativeChildren, UInt(nativeChildren.count))
    
    markDirty()
  }
  
  
  public func appendChild(_ child: MasonNode) {
    
    // Remove from old parent
    if let oldParent = child.parent {
      oldParent.removeChild(child)
    }
    
    
    // For MasonText containers, delegate to the MasonText view
    if let textView = view as? MasonText {
      textView.addChild(child)
      return
    }
    
    // Check if this is a text node
    if child is MasonTextNode {
      appendTextChild(child)
      return
    }
    
    // Check if child has a view (inline element or regular element)
    if child.view != nil && child.nativePtr != nil {
      appendElementChild(child)
      return
    }
    
    // Fallback
    children.append(child)
    child.parent = self
    
    if let ptr = nativePtr, let childPtr = child.nativePtr {
      mason_node_add_child(mason.nativePtr, ptr, childPtr)
    }
    
  }
  
  @discardableResult
  private func appendElementChild(_ child: MasonNode) -> MasonNode {
    // Remove from old parent
    if let oldParent = child.parent {
      oldParent.removeChild(child)
    }
    
    // Add to author tree
    children.append(child)
    child.parent = self
    
    // Add view to hierarchy
    if let childView = child.view {
      view?.addSubview(childView)
    }
    
    // Add to native layout tree
    if let childPtr = child.nativePtr {
      mason_node_add_child(mason.nativePtr, nativePtr, childPtr)
    }
    
    markDirty()
    return child
  }
  
  @discardableResult
  private func appendTextChild(_ child: MasonNode) -> MasonNode {
    // If this node already has a MasonText view, add directly to it
        if let textView = view as? MasonText {
            textView.addChild(child)
            return child
        }
        
        // Otherwise, check if we can append to an existing anonymous text container
        if let lastChild = children.last,
           lastChild.isAnonymous,
           let lastTextView = lastChild.view as? MasonText {
            // Append to existing anonymous container
            lastTextView.addChild(child)
            return child
        }
        
        // Create new anonymous container only if necessary
        let container = getOrCreateAnonymousTextContainer()
        if let masonText = container.view as? MasonText {
            masonText.addChild(child)
        }
        
        return child
  }
  
  internal func getOrCreateAnonymousTextContainer() -> MasonNode {
    // Check if last child is an anonymous text container
    let lastChild = children.last
    if(lastChild?.isAnonymous ?? false && lastChild?.view is MasonText){
     return lastChild!
    }
    
    // Create new anonymous container
    let textView = MasonText(mason: mason, isAnonymous: true)
    
    // Add container to this node
    children.append(textView.node)
    textView.node.parent = self
    view?.addSubview(textView)
    
    // Add to native layout tree
    if let containerPtr = textView.node.nativePtr {
      mason_node_add_child(mason.nativePtr, nativePtr, containerPtr)
    }
    
    return textView.node
  }
  
  @discardableResult
  func removeChild(_ child: MasonNode) -> MasonNode? {
    guard child.parent === self else { return nil }
    
    switch child.type {
    case .element:
      return removeElementChild(child)
    case .text:
      return removeTextChild(child)
    }
  }
  
  @discardableResult private func removeElementChild(_ child: MasonNode) -> MasonNode? {
    guard let index = children.firstIndex(where: { $0 === child }) else {
      return nil
    }
    
    // Remove from view hierarchy
    child.view?.removeFromSuperview()
    
    // Remove from author tree
    children.remove(at: index)
    child.parent = nil
    
    // Remove from native layout tree
    if let childPtr = child.nativePtr {
      mason_node_remove_child(mason.nativePtr, nativePtr, childPtr)
    }
    
    markDirty()
    return child
  }
  
  private func removeTextChild(_ child: MasonNode) -> MasonNode? {
    // Find the text container holding this text node
    for containerNode in children {
      guard containerNode.isAnonymous,
            let textContainer = containerNode.view as? MasonText else {
        continue
      }
      
      // Try to remove from this container
      if let removed = textContainer.removeChild(child) {
        // If container is now empty, remove it
        if textContainer.node.children.isEmpty {
          removeElementChild(containerNode)
        }
        return removed
      }
    }
    
    return nil
  }
  
  internal func addChildAt(_ child: MasonNode, _ index: Int) {
    guard child.parent !== self else { return }
    
    let idx: Int
    if index == -1 {
      idx = children.count
    } else {
      idx = max(0, min(index, children.count))
    }
    
    switch child.type {
    case .element:
      addElementChildAt(child, idx)
    case .text:
      addTextChildAt(child, idx)
    }
  }
  
  private func addElementChildAt(_ child: MasonNode, _ index: Int) {
    // Remove from old parent
    if let oldParent = child.parent {
      oldParent.removeChild(child)
    }
    
    // Insert into author tree
    children.insert(child, at: index)
    child.parent = self
    
    // Add view to hierarchy
    if let childView = child.view {
      if(index <= -1){
        view?.addSubview(childView)
      }else {
        view?.insertSubview(childView, at: index)
      }
    }
    
    // Sync native layout tree (full rebuild for insert to maintain order)
    let nativeChildren = children.compactMap { $0.nativePtr }
    
    // Convert [OpaquePointer] to [OpaquePointer?] for the C API
    var optionalChildren = nativeChildren.map { Optional($0) }
    mason_node_set_children(mason.nativePtr, nativePtr, &optionalChildren, UInt(optionalChildren.count))
    
    markDirty()
  }
  
  private func addTextChildAt(_ child: MasonNode, _ index: Int) {
    // For text nodes, find nearest text container or create one
    // If inserting at end (-1 or children.count), use appendChild behavior
    if index >= children.count {
      appendChild(child)
    } else {
      // TODO: Implement proper insertion into text containers at specific positions
      // For now, delegate to appendChild which handles containers
      appendChild(child)
    }
  }
  
  internal func removeChildAt(index: Int) -> MasonNode? {
    guard index >= 0 && index < children.count else { return nil }
    
    let child = children[index]
    return removeChild(child)
  }
  
  func removeAllChildren() {
    // Remove all children
    for child in children {
      child.parent = nil
      child.view?.removeFromSuperview()
    }
    
    children.removeAll()
    
    // Clear native layout tree
    mason_node_remove_children(mason.nativePtr, nativePtr)
    
    markDirty()
  }
  
  
  func removeMeasureFunction(){
    mason_node_remove_context(mason.nativePtr, nativePtr)
    self.measureFunc = nil
  }
  
  func setMeasureFunction(_ measureFunc: @escaping MeasureFunc) {
    self.measureFunc = measureFunc
    mason_node_set_context(mason.nativePtr, nativePtr, Unmanaged.passUnretained(self).toOpaque(), measure)
  }
  
  
  func setDefaultMeasureFunction(){
    guard let view = self.view else {return}
    self.setMeasureFunction { knownDimensions, availableSpace in
      return MasonNode.measureFunction(view, knownDimensions, availableSpace)
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
    
    let constraintSize = CGSize(width: width, height: height)
    let result = view.sizeThatFits(constraintSize)
    
    return result
  }
  
  
}
