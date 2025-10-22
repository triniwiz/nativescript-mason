//
//  MasonElement.swift
//  Mason
//
//  Created by Osei Fortune on 02/10/2025.
//
import UIKit


internal func create_layout(_ floats: UnsafePointer<Float>?) -> UnsafeMutableRawPointer? {
  guard let floats = floats else {return nil}
  let layout = MasonLayout.fromFloatPoint(floats).1
  return Unmanaged.passRetained(layout).toOpaque()
}

@objc public protocol MasonElementObjc: NSObjectProtocol {
  @objc var style: MasonStyle { get }
  
  @objc var node: MasonNode { get }
  
  @objc var uiView: UIView { get }
}

public protocol MasonElement: NSObjectProtocol {
   var style: MasonStyle { get }
  
   var node: MasonNode { get }
  
   var uiView: UIView { get }
  
     func markNodeDirty()
  
     func isNodeDirty() -> Bool
  
     func configure(_ block: (MasonStyle) -> Void)
  
  @discardableResult    func layout() -> MasonLayout
  
     func compute()
  
     func compute(_ width: Float, _ height: Float)
  
     func computeMaxContent()
  
     func computeMinContent()
  
     func computeWithSize(_ width: Float, _ height: Float)
  
     func computeWithViewSize()
  
     func computeWithViewSize(layout: Bool)
  
     func computeWithMaxContent()
  
     func computeWithMinContent()
  
     func attachAndApply()
  
     func requestLayout()
  
     func append(_ element: MasonElement)
  
     func append(text: String)
  
     func append(node: MasonNode)
  
     func append(texts: [String])
  
     func append(elements: [MasonElement])
  
     func append(nodes: [MasonNode])
  
     func prepend(_ element: MasonElement)
  
     func prepend(string: String)
  
     func prepend(node: MasonNode)
  
     func prepend(strings: [String])
  
     func prepend(elements: [MasonElement])
  
     func prepend(nodes: [MasonNode])
  
     func addChildAt(text: String, _ index: Int)

     func addChildAt(element: MasonElement, _ index: Int)

     func addChildAt(node: MasonNode, _ index: Int)
}



private struct MasonElementProperties {
  static var computeCache: UInt8 = 0
  static var isInLayout: UInt8 = 1
}

extension MasonElement {
  
  public func addChildAt(text: String, _ index: Int) {
    node.addChildAt(MasonTextNode(mason: node.mason, data: text), index)
  }

  public func addChildAt(element: MasonElement, _ index: Int) {
    node.addChildAt(element.node, index)
  }

  public func addChildAt(node: MasonNode, _ index: Int) {
    node.addChildAt(node, index)
  }
  
  public var style: MasonStyle {
    get {
      return node.style
    }
  }
  
  public func syncStyle(_ state: String) {
    guard let stateValue = Int64(state, radix: 10) else {return}
    //  let keys = StateKeys(rawValue: UInt64(stateValue))
    if (stateValue != -1) {
      style.isDirty = stateValue
      style.updateNativeStyle()
    }
  }
  
  public func configure(_ block :(MasonStyle) -> Void) {
    node.inBatch = true
    block(node.style)
    node.inBatch = false
    style.updateNativeStyle()
  }
  
  
  public func requestLayout() {
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
  
  
  public func addView(_ view: UIView){
    if(view.superview == uiView){
      return
    }
    
    if(!(self is MasonText)){
      uiView.addSubview(view)
    }
    
    if(view is MasonElement){
      if let textView = self as? MasonText {
        textView.addChild((view as! MasonElement).node)
      }else {
        append((view as! MasonElement))
      }
    } else {
      let childNode = node.mason.nodeForView(view)
      
      if let textView = self as? MasonText {
        textView.addChild(childNode)
      } else {
        append(node: childNode)
      }
    }
  }
  
  public func addView(_ view: UIView, at: Int){
    if(view.superview == uiView){
      return
    }
    if(!(self is MasonText)){
      if(at <= -1){
        uiView.addSubview(view)
      }else {
        uiView.insertSubview(view, at: at)
      }
    }
    
    
    if(view is MasonElement){
      node.addChildAt((view as! MasonElement).node, at)
    }else {
      node.addChildAt(node.mason.nodeForView(view), at)
    }
  }
  
  internal func computeCache() -> CGSize {
    return objc_getAssociatedObject(self, &MasonElementProperties.computeCache) as? CGSize ?? .zero
  }
  
  internal func setComputeCache(_ value: CGSize) {
    objc_setAssociatedObject(self, &MasonElementProperties.computeCache, value, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
  }
  
  public func append(_ element: MasonElement){
    node.appendChild(element.node)
  }
  
  public func append(text: String){
    if(uiView is MasonText){
      node.appendChild(MasonTextNode(mason: node.mason, data: text, attributes: (uiView as! MasonText).getDefaultAttributes()))
    }else {
      node.appendChild(MasonTextNode(mason: node.mason, data: text))
    }
  }
  
  public func append(node childNode: MasonNode){
    if let view = self as? MasonText {
      view.addChild(node)
      return
    }
    node.appendChild(childNode)
  }
  
  
  public func append(texts: [String]){
    guard !texts.isEmpty else { return }
    
    // Create text nodes
    let textNodes = texts.map { text in
      MasonTextNode(mason: node.mason, data: text)
    }
    
    // Add to author tree
    node.children.append(contentsOf: textNodes)
    for textNode in textNodes {
      textNode.parent = node
    }
    
    // Text nodes don't have nativePtr, so handle via anonymous container
    // Delegate to node's appendChild which handles text node containerization
    for textNode in textNodes {
      // Find or create anonymous text container
      let container = node.getOrCreateAnonymousTextContainer()
      if let masonText = container.view as? MasonText {
        masonText.addChild(textNode)
        if(container.parent == nil){
          append(masonText)
        }
      }
    }
    
    node.markDirty()
  }
  
  public func append(nodes: [MasonNode]){
    guard !nodes.isEmpty else { return }
    
    // Separate real nodes from text nodes
    var realNodes: [OpaquePointer] = []
    var textNodes: [MasonNode] = []
    
    for childNode in nodes {
      // Remove from old parent
      if let oldParent = childNode.parent {
        oldParent.removeChild(childNode)
      }
      
      if let childPtr = childNode.nativePtr {
        realNodes.append(childPtr)
      } else if childNode.type == .text {
        textNodes.append(childNode)
      }
    }
    
    // Add to author tree
    node.children.append(contentsOf: nodes)
    for childNode in nodes {
      childNode.parent = node
      if let childView = childNode.view {
        if(!(self.uiView is MasonText)){
          node.view?.addSubview(childView)
        }
      }
    }
    
    // Batch append real nodes to layout tree
    if !realNodes.isEmpty {
      var optionalNodes = realNodes.map { Optional($0) }
      mason_node_add_children(node.mason.nativePtr, node.nativePtr, &optionalNodes, UInt(realNodes.count))
    }
    
    // Handle text nodes via anonymous containers
    if !textNodes.isEmpty {
      for textNode in textNodes {
        let container = node.getOrCreateAnonymousTextContainer()
        if let masonText = container.view as? MasonText {
          masonText.addChild(textNode)
          if(container.parent == nil){
            append(masonText)
          }
        }
      }
    }
    
    node.markDirty()
  }
  
  public func append(elements: [MasonElement]){
    guard !elements.isEmpty else { return }
    
    let nodes = elements.map { $0.node }
    append(nodes: nodes)
  }
  
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  
  @discardableResult public func layout() -> MasonLayout {
    
    let points = mason_node_layout(node.mason.nativePtr,
                                   node.nativePtr, create_layout)
    
    guard let points = points else {
      return MasonLayout.zero
    }
    
    let layout: MasonLayout = Unmanaged.fromOpaque(points).takeRetainedValue()
    return layout
  }
  
  public func compute() {
    mason_node_compute(node.mason.nativePtr, node.nativePtr)
  }
  
  public func compute(_ width: Float, _ height: Float) {
    mason_node_compute_wh(node.mason.nativePtr, node.nativePtr, width, height)
    setComputeCache(CGSize(width: CGFloat(width), height: CGFloat(height)))
  }
  
  public func computeMaxContent() {
    mason_node_compute_max_content(node.mason.nativePtr, node.nativePtr)
    setComputeCache(CGSize(width: CGFloat(-2), height: CGFloat(-2)))
  }
  
  public func computeMinContent() {
    mason_node_compute_min_content(node.mason.nativePtr, node.nativePtr)
    setComputeCache(CGSize(width: CGFloat(-1), height: CGFloat(-1)))
  }
  
  public func computeWithSize(_ width: Float, _ height: Float){
    compute(width, height)
    let layout = self.layout()
    MasonElementHelpers.applyToView(node, layout)
  }
  
  public func computeWithViewSize(){
    computeWithViewSize(layout: false)
  }
  
  public func computeWithViewSize(layout: Bool){
    compute(Float(uiView.frame.size.width) * NSCMason.scale, Float(uiView.frame.size.height) * NSCMason.scale)
    if(layout){
      MasonElementHelpers.applyToView(node, self.layout())
    }
  }
  
  public func computeWithMaxContent(){
    computeMaxContent()
    let layout = self.layout()
    MasonElementHelpers.applyToView(node, layout)
  }
  
  public func computeWithMinContent(){
    computeMinContent()
    let layout = self.layout()
    MasonElementHelpers.applyToView(node, layout)
  }
  
  public func attachAndApply(){
    let layout = self.layout()
    MasonElementHelpers.applyToView(node, layout)
  }
}


extension MasonElement {
  
  public func prepend(_ element: MasonElement) {
    node.addChildAt(element.node, 0)
  }
  
  public func prepend(string: String) {
    let textNode = MasonTextNode(mason: node.mason, data: string)
    node.addChildAt(textNode, 0)
  }
  
  public func prepend(node childNode: MasonNode) {
    node.addChildAt(childNode, 0)
  }
  
  public func prepend(strings: [String]) {
    guard !strings.isEmpty else { return }
    
    // Create text nodes
    let textNodes = strings.map { text in
      MasonTextNode(mason: node.mason, data: text)
    }
    
    // Insert at beginning of author tree
    node.children.insert(contentsOf: textNodes, at: 0)
    for textNode in textNodes {
      textNode.parent = node
    }
    
    // Handle via anonymous containers
    for (index, textNode) in textNodes.enumerated() {
      let container = node.getOrCreateAnonymousTextContainer()
      if let masonText = container.view as? MasonText {
        masonText.insertChild(textNode, at: index)
      }
    }
    
    node.markDirty()
  }
  
  public func prepend(elements: [MasonElement]) {
    guard !elements.isEmpty else { return }
    
    let nodes = elements.map { $0.node }
    prepend(nodes: nodes)
  }
  
  public func prepend(nodes: [MasonNode]) {
    guard !nodes.isEmpty else { return }
    
    // Separate real nodes from text nodes
    var realNodes: [OpaquePointer] = []
    var textNodes: [MasonNode] = []
    
    for childNode in nodes {
      // Remove from old parent
      if let oldParent = childNode.parent {
        oldParent.removeChild(childNode)
      }
      
      if let childPtr = childNode.nativePtr {
        realNodes.append(childPtr)
      } else if childNode.type == .text {
        textNodes.append(childNode)
      }
    }
    
    // Insert at beginning of author tree
    node.children.insert(contentsOf: nodes, at: 0)
    for childNode in nodes {
      childNode.parent = node
      if let childView = childNode.view {
        if(!(self.uiView is MasonText)){
          node.view?.addSubview(childView)
        }
      }
    }
    
    // Batch prepend real nodes to layout tree (reversed to maintain order)
    if !realNodes.isEmpty {
      var optionalNodes = realNodes.reversed().map { Optional($0) }
      mason_node_prepend_children(node.mason.nativePtr, node.nativePtr, &optionalNodes, UInt(realNodes.count))
    }
    
    // Handle text nodes via anonymous containers
    if !textNodes.isEmpty {
      for (index, textNode) in textNodes.enumerated() {
        let container = node.getOrCreateAnonymousTextContainer()
        if let masonText = container.view as? MasonText {
          masonText.insertChild(textNode, at: index)
        }
      }
    }
    
    node.markDirty()
  }
}

class MasonElementHelpers: NSObject {
  
  public static func applyToView(_ node: MasonNode , _ layout: MasonLayout){
    node.computedLayout = layout
    if let view = node.view {
      var isTextView = false
      var realLayout = layout
      var hasWidthConstraint: Bool = false
      var hasHeightConstraint: Bool = false
      if let view = view as? MasonText {
        isTextView = true
        realLayout = view.node.computedLayout
        hasWidthConstraint = view.node.style.size.width != .Auto
        hasHeightConstraint = view.node.style.size.height != .Auto
      }
      
      let widthIsNan = realLayout.width.isNaN
      
      let heightIsNan = realLayout.height.isNaN
      
      let x = CGFloat(realLayout.x.isNaN ? 0 : realLayout.x/NSCMason.scale)
      
      let y = CGFloat(realLayout.y.isNaN ? 0 : realLayout.y/NSCMason.scale)
      
      var width = CGFloat(widthIsNan ? 0 : realLayout.width/NSCMason.scale)
      
      var height = CGFloat(heightIsNan ? 0 : realLayout.height/NSCMason.scale)
      
      if(isTextView){
        if(!hasWidthConstraint && realLayout.contentSize.width > realLayout.width){
          width = CGFloat(realLayout.contentSize.width.isNaN ? 0 : realLayout.contentSize.width/NSCMason.scale)
        }
        
        if(!hasHeightConstraint && realLayout.contentSize.height > realLayout.height){
          height = CGFloat(realLayout.contentSize.height.isNaN ? 0 : realLayout.contentSize.height/NSCMason.scale)
        }
      }
      
 
      let point = CGPoint(x: x, y: y)
      
      let size = CGSizeMake(width, height)
    
      view.frame = CGRect(origin: point, size: size)
      
      node.isLayoutValid = true
      
      if let scroll = node.view as? Scroll {
        let overflow = node.style.overflow
      
        
        scroll.contentSize = CGSize(width: CGFloat(realLayout.contentSize.width.isNaN ? 0 : realLayout.contentSize.width/NSCMason.scale), height: CGFloat(realLayout.contentSize.height.isNaN ? 0 : realLayout.contentSize.height/NSCMason.scale))
        
        MasonElementHelpers.handleOverflow(overflow.x, scroll)
        MasonElementHelpers.handleOverflow(overflow.y, scroll, true)
        
      }
      
      
    }
    
    if(!layout.children.isEmpty){
      let children = node.children.filter {
        let node = $0
        if(node.nativePtr == nil){
          return false
        }else if(node.parent?.view is MasonText && node.view is MasonText){
          let flatten = (node.parent!.view as! MasonText).shouldFlattenTextContainer(node.view as! MasonText)
          return !flatten
        }else {
          return true
        }
      }
      
      let count = children.count
      for i in 0..<count{
        let child = children[i]
        if(child.type == .text){
          continue
        }
        let layout = layout.children[i]
        applyToView(child, layout)
      }
    }
    
  }
  
  
  
  internal static func handleOverflow(_ overflow: Overflow, _ scroll: UIScrollView, _ vertical: Bool = false) {
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
}
