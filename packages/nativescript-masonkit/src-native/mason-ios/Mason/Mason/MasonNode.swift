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

@objc(MasonNodeType)
public enum MasonNodeType: Int32, RawRepresentable {
  case element
  case text
  case document
  
  public typealias RawValue = Int32
  public var rawValue: Int32 {
    switch self {
    case .element:
      return 0
    case .text:
      return 1
    case .document:
      return 2
    }
  }
  
  public init?(rawValue: Int32) {
    switch rawValue {
    case 0:
      self = .element
    case 1:
      self = .text
    case 2:
      self = .document
    default:
      return nil
    }
  }
}


@objc
extension MasonNode {
  @objc func a() {
    
  }
}

@objc(MasonNode)
@objcMembers
public class MasonNode: NSObject {
  public internal(set) var mason: NSCMason
  
  internal var isAnonymous = false
  
  internal var cachedWidth: CGFloat = 0
  internal var cachedHeight: CGFloat = 0
  
  
  @objc private dynamic func setComputedSize(_ width: CGFloat, height: CGFloat){
    cachedWidth = width
    cachedHeight = height
  }
  
  
  @objc private dynamic var computedWidth: CGFloat {
    return cachedWidth
  }
  
  @objc private dynamic var computedHeight: CGFloat {
    return cachedHeight
  }
  
  
  public internal(set) var nativePtr: OpaquePointer?
  
  public internal(set) var computedLayout = MasonLayout()
  
  internal var isLayoutValid: Bool = false
  
  public internal(set) var document: MasonDocument? = nil
  
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
  
  public var parentNode: MasonNode? {
    return parent
  }
  
  public var parentElement: MasonElement? {
    guard let parent = parent else {return nil}
    return parent.type == .element ? parent.view as? MasonElement : nil
  }
  
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
  
  
  public var inBatch = false {
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
  internal init(mason doc: NSCMason, _ isAnonymous: Bool = false) {
    mason = doc
    nativePtr = mason_node_new_node(mason.nativePtr, isAnonymous)
    type = .element
    super.init()
    self.isAnonymous = isAnonymous
    mason_node_set_apple_node(mason.nativePtr, nativePtr, Unmanaged.passRetained(self).toOpaque())
  }
  
  
  internal init(textNode doc: NSCMason, _ isAnonymous: Bool = false) {
    mason = doc
    nativePtr = mason_node_new_text_node(mason.nativePtr, isAnonymous)
    type = .element
    super.init()
    self.isAnonymous = isAnonymous
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
    nativePtr = mason_node_new_node(mason.nativePtr, false)
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
    isLayoutValid = false
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
    if(type == .document){
      if(!children.isEmpty){
        // todo error
        return
      }
      
      if(child.type == .text){
        // todo error
        return
      }
      
      if(child.type == .document){
        // todo error
        return
      }
      
      document?.documentElement = child.view as? MasonElement
    }
    
    // Remove from old parent
    if let oldParent = child.parent {
      oldParent.removeChild(child)
    }
    
    
    // For MasonText containers, delegate to the MasonText view
    if let textView = view as? MasonText, child is MasonTextNode {
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
      if(!(view is MasonText)){
        view?.addSubview(childView)
      }
    }
    
    // Add to native layout tree
    if let childPtr = child.nativePtr {
      mason_node_add_child(mason.nativePtr, nativePtr, childPtr)
    }
    
    if let view = child.view as? MasonElement {
      view.requestLayout()
    }else {
      markDirty()
    }
    
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
    
    // Create new anonymous container only if necessary
    let container = getOrCreateAnonymousTextContainer()
    if let masonText = container.view as? MasonText {
      masonText.addChild(child)
    }
    return child
  }
  
  internal func getOrCreateAnonymousTextContainer(_ append: Bool = true, checkLast: Bool = true) -> MasonNode {
    // Check if last child is an anonymous text container
    if checkLast,
       let lastChild = children.last,
       lastChild.isAnonymous,
       lastChild.view is MasonText {
      return lastChild
    }

    // Create new anonymous container
    let textView = MasonText(mason: mason, isAnonymous: true)
    
    if(append){
      // Add container to this node
      children.append(textView.node)
    }
    
    textView.node.parent = self
    
    
    if(append && !(view is MasonText)){
      view?.addSubview(textView)
    }
    
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
    case .document:
      return nil
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
    if(index <= -1){
      appendChild(child)
      return
    }
    let nodes = getChildren()
    let idx = nodes.firstIndex(of: child)
    if(idx == index){
      return
    }
    
    switch child.type {
    case .element:
      addElementChildAt(child, index, nil)
      break
    case .text:
      addTextChildAt(child, index, nil)
      break
    case .document:
      // noop
      break
    }
  }
  
  private func addElementChildAt(_ child: MasonNode, _ index: Int, _ nodes: [MasonNode]? = nil) {
    // Remove from old parent
    if let oldParent = child.parent {
      oldParent.removeChild(child)
    }
    let authorNodes = nodes ?? getChildren()
    
    if(authorNodes.isEmpty || index >= authorNodes.count){
      appendElementChild(child)
      return
    }
    
    let element = authorNodes[index]
    
    if let textNode = element as? MasonTextNode {
      assert(textNode.container != nil, "text node must have a container")
      if let container = textNode.container {
        if(container.node.isAnonymous){
          // IMPORTANT: element is the text node at the AUTHOR index
          // Find where this text node is in the container's children
          if let idx = container.node.children.firstIndex(where: {$0 === textNode}) {
            
            // if the index to insert at is the first get the container parent position
            // then insert the element there
            if(idx == 0){
              if let newIdx = children.firstIndex(of: container.node) {
                children.insert(child, at: newIdx)
                // Add view to hierarchy
                if let childView = child.view {
                  if(!(view is MasonText)){
                    view?.addSubview(childView)
                  }
                }
                mason_node_insert_child_before(mason.nativePtr, nativePtr, child.nativePtr, container.node.nativePtr)
                child.parent = self
                markDirty()
              }
            } else if idx == container.node.children.count {
              // Inserting after the last item in the container
              if let newIdx = children.firstIndex(of: container.node) {
                children.insert(child, at: newIdx + 1)
                child.parent = self
                
                if let childView = child.view, !(view is MasonText) {
                  view?.addSubview(childView)
                }
                
                // Insert after the container in native tree
                if newIdx + 1 < children.count {
                  if let nextNode = children[newIdx + 1].nativePtr {
                    mason_node_insert_child_before(mason.nativePtr, nativePtr, child.nativePtr, nextNode)
                  }
                } else {
                  mason_node_add_child(mason.nativePtr, nativePtr, child.nativePtr)
                }
                
                markDirty()
              }
            } else {
              // Split the container in the middle
              let newContainer = getOrCreateAnonymousTextContainer(false, checkLast: false)
              newContainer.parent = self
              
              let range = idx...
              
              
              // IMPORTANT: Create a copy of the slice for safe iteration
              let nodesToMove = Array(container.node.children[range])
              
              // FIRST: Remove from original container
              container.node.children.removeSubrange(range)
              
          
              // THEN: Move nodes to new container
              for node in nodesToMove {
                // Update references
                node.parent = newContainer
                if let textNode = node as? MasonTextNode,
                   let newContainerView = newContainer.view as? MasonText {
                  textNode.container = newContainerView
                }
                
                // Add to new container
                newContainer.children.append(node)
              }
              
  
              
              // Force rebuild of both containers
              container.invalidateInlineSegments()
              
              if let newContainerView = newContainer.view as? MasonText {
                newContainerView.invalidateInlineSegments()
              }
              
              // Find container's position in parent
              if let containerIdx = children.firstIndex(of: container.node) {
                // Insert: [original container, new element, new container]
                children.insert(child, at: containerIdx + 1)
                child.parent = self
                
                if let childView = child.view, !(view is MasonText) {
                  if let view = view {
                    if let idx = view.subviews.firstIndex(of: container) {
                      if idx < view.subviews.count - 1 {
                        view.insertSubview(childView, at: idx + 1)
                      }else {
                        view.addSubview(childView)
                      }
                    }else {
                      view.addSubview(childView)
                    }
                  }
                }
                
                children.insert(newContainer, at: containerIdx + 2)
                
                // CRITICAL: Add new container's view to hierarchy
                if let newContainerView = newContainer.view as? MasonText {
                  if !(view is MasonText) {
                    if let view = view {
                      if let idx = view.subviews.firstIndex(of: container) {
                        if idx < view.subviews.count - 1 {
                          view.insertSubview(newContainerView, at: idx + 1)
                        }else {
                          view.addSubview(newContainerView)
                        }
                      }else {
                        view.addSubview(newContainerView)
                      }
                    }
                  }
                }
                
                
                // IMPORTANT: Sync native layout tree with proper pointers
                let nativeChildren = children.compactMap { $0.nativePtr }
                var optionalChildren = nativeChildren.map { Optional($0) }
                mason_node_set_children(mason.nativePtr, nativePtr, &optionalChildren, UInt(optionalChildren.count))
                
                markDirty()
              } else {
                // Fallback: append everything
                appendChild(child)
                appendChild(newContainer)
              }
            }
          } else {
            // always append if node can't be found
            appendChild(child)
          }
        } else {
          // real text container .. don't split just insert
          
          if let newIdx = container.node.children.firstIndex(where: {$0 === textNode}) {
            container.node.children.insert(child, at: newIdx)
            
            // Add ALL non-text nodes to layout tree (including TextViews that won't be flattened)
            if child.type != .text && child.nativePtr != nil {
              // Check if this TextView should be inline-block
              if let textView = child.view as? MasonText {
                // Only add to layout tree if it won't be flattened
                if !container.shouldFlattenTextContainer(textView) {
                  container.syncLayoutChildren()
                }
              } else {
                // Non-TextView elements always go in layout tree
               // syncLayoutChildren()
                
                
                // Add view to hierarchy
                if let childView = child.view {
                  if(!(view is MasonText)){
                    view?.addSubview(childView)
                  }
                }
                mason_node_insert_child_before(mason.nativePtr, container.node.nativePtr, child.nativePtr, textNode.nativePtr)
                child.parent = container.node
              }
            }
            markDirty()
            
          }else {
            appendChild(child)
          }
        }
      }
    } else if element.view is MasonElement {
      if let idx = children.firstIndex(of: element)  {
        // Insert into author tree
        children.insert(child, at: idx)
        child.parent = self
        
        if(!(child.view is MasonText)){
          // Add view to hierarchy
          if let childView = child.view {
            if(index <= -1){
              view?.addSubview(childView)
            }else {
              view?.insertSubview(childView, at: index)
            }
          }
        }
        
        // Sync native layout tree (full rebuild for insert to maintain order)
        let nativeChildren = children.compactMap { $0.nativePtr }
        
        // Convert [OpaquePointer] to [OpaquePointer?] for the C API
        var optionalChildren = nativeChildren.map { Optional($0) }
        mason_node_set_children(mason.nativePtr, nativePtr, &optionalChildren, UInt(optionalChildren.count))
        
        markDirty()
      } else {
        appendElementChild(child)
      }
    }
    
  }
  
  private func addTextChildAt(_ child: MasonNode, _ index: Int, _ nodes: [MasonNode]? = nil) {
    // For text nodes, find nearest text container or create one
    // If inserting at end (-1 or children.count), use appendChild behavior
    
    switch(type) {
    case .document:
      if (!children.isEmpty) {
        return
      }
      
      if (child.type == .text || child.type == .document) {
        return
      }
      break
      
    case .text : return
    default:
      // noop
      break
    }
    
    // Remove from old parent
    if let oldParent = child.parent {
      oldParent.removeChild(child)
    }
    
    let authorNodes = nodes ?? getChildren()
    
    if (index >= authorNodes.count || index <= -1) {
      appendChild(child)
      return
    }
    
    let element = authorNodes[index]
    
    if let textNode = element as? MasonTextNode {
      // Find the position of this text node within its container
      guard let container = textNode.container else {
        appendChild(child)
        return
      }
      
      guard let layoutIndex = container.node.children.firstIndex(of: textNode) else {
        // Text node not found in container, append instead
        container.node.children.append(child)
        if let child = child as? MasonTextNode {
          child.container = container
          child.attributes = container.getDefaultAttributes()
        }
        child.parent = container.node
        container.invalidateInlineSegments()
        markDirty()
        return
      }
      
      // Insert BEFORE the target text node in the container
      container.node.children.insert(child, at: layoutIndex)
      
      if let child = child as? MasonTextNode {
        child.container = container
        child.attributes = container.getDefaultAttributes()
      }
      child.parent = container.node
      
      container.invalidateInlineSegments()
      
      markDirty()

    } else if element.view is MasonElement {
      let layoutIndex = children.firstIndex(of: element)
      
      // For TextView containers, delegate to the TextView
      if (view is MasonText && child is MasonTextNode) {
        if let layoutIndex = layoutIndex {
          children.insert(child, at: layoutIndex)
        }else {
          children.append(child)
        }
        child.parent = self
        if let container = (view as? MasonText) {
          (child as! MasonTextNode).container = container
          (child as! MasonTextNode).attributes = container.getDefaultAttributes()
        }
        return
      }
      
      // Check if this is a text node get or create anonymous textContainer
      if (child.type == .text) {
        let container = getOrCreateAnonymousTextContainer(false)
        container.appendChild(child)
        if let child = child as? MasonTextNode, let containerView = container.view as? MasonText {
          child.attributes = containerView.getDefaultAttributes()
          child.parent = container
          child.container = containerView
        }
        
        if let layoutIndex = layoutIndex {
          children.insert(container, at: layoutIndex)
        }else {
          children.append(container)
        }
        
        // Add container to native layout tree
        if let containerPtr = container.nativePtr {
          mason_node_insert_child_before(mason.nativePtr, nativePtr, containerPtr, element.nativePtr)
        }
        
        markDirty()
        
        return
      }
      
      // Check if child has a view (element)
      if (child.view != nil && child.nativePtr != nil) {
        addElementChildAt(child, index)
        return
      }
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
    self.setMeasureFunction { knownDimensions, availableSpace in
      return MasonNode.measureFunction(self, knownDimensions, availableSpace)
    }
  }
  
  enum MeasureMode {
    case Min
    case Max
    case Definite
  }
  
  static func measureFunction(_ node: MasonNode, _ knownDimensions: CGSize?,_ availableSpace: CGSize) -> CGSize {
    
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
    
    if let known = knownDimensions {
      if(!known.width.isNaN && !known.height.isNaN){
        node.cachedWidth = known.width
        node.cachedHeight = known.height
        return known
      }
    }
    
    let constraintSize = CGSize(width: width, height: height)
    let result = node.view?.sizeThatFits(constraintSize)
    
    node.cachedWidth = result?.width ?? 0
    node.cachedHeight = result?.height ?? 0
    
    return result ?? .zero
  }
  
  
}
