//
//  MasonElement.swift
//  Mason
//
//  Created by Osei Fortune on 02/10/2025.
//
import UIKit
import FontManager

internal func create_layout(_ floats: UnsafePointer<Float>?, _ count: UInt) -> UnsafeMutableRawPointer? {
  guard let floats = floats else {return nil}
  let tree = MasonLayoutTree()
  tree.fromFloatPointer(floats, count: Int(count))
  let layout = MasonLayout(tree: tree, index: 0)
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
  
  var innerHTML: String {get set}
  
  func markNodeDirty()
  
  func isNodeDirty() -> Bool
  
  func configure(_ block: (MasonStyle) -> Void)
  
  @discardableResult func layout() -> MasonLayout
  
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
  
  func replaceChildAt(text: String, _ index: Int)
  
  func replaceChildAt(element: MasonElement, _ index: Int)
  
  func replaceChildAt(node: MasonNode, _ index: Int)
}

private struct MasonElementProperties {
  static var computeCache: UInt8 = 0
  static var isInLayout: UInt8 = 1
  static var computeCacheDirty: UInt8 = 2
  static var lastAutoComputeSize: UInt8 = 3
}

func ctFont(from cgFont: CGFont, fontSize: CGFloat, weight: UIFont.Weight, style: NSCFontStyle) -> CTFont {
  // UIFont.Weight → CoreText weight value
  let weightValue: CGFloat
  switch weight {
  case .thin: weightValue = -0.8
  case .ultraLight: weightValue = -1.0
  case .light: weightValue = -0.5
  case .regular: weightValue = 0
  case .medium: weightValue = 0.4
  case .semibold: weightValue = 0.6
  case .bold: weightValue = 0.8
  case .heavy, .black: weightValue = 1.0
  default: weightValue = 0
  }
  
  var traits: [CFString: Any] = [
    kCTFontWeightTrait: weightValue
  ]
  
  var symbolicTraits: CTFontSymbolicTraits = []
  switch(style.type) {
  case .normal:
    // noop
    break
  case .italic:
    symbolicTraits.insert(.traitItalic)
  case .oblique:
    symbolicTraits.insert(.traitItalic)
//    if style.obliqueAngle != nil {
//      // todo handle slant value
//      symbolicTraits.insert(.traitItalic)
//    }else {
//      symbolicTraits.insert(.traitItalic)
//    }
  @unknown default:
    //noop
    break
  }
  if weightValue >= 0.6 {
    symbolicTraits.insert(.traitBold)
  }
  
  if !symbolicTraits.isEmpty {
    traits[kCTFontSymbolicTrait] = symbolicTraits.rawValue
  }
  
  let postScriptName = cgFont.postScriptName! as String
  
  // System fonts (PostScript names starting with ".") can't be resolved by name alone —
  // CoreText ignores weight traits when an explicit name like ".SFUI-Regular" is given.
  // Use the family name + traits so CoreText selects the correct weight variant.
  let isSystemFont = postScriptName.hasPrefix(".")

  var attributes: [CFString: Any] = [
    kCTFontSizeAttribute: fontSize,
    kCTFontTraitsAttribute: traits
  ]

  if isSystemFont {
    let uiFont = UIFont.systemFont(ofSize: fontSize, weight: weight)
    return CTFontCreateWithFontDescriptor(uiFont.fontDescriptor as CTFontDescriptor, fontSize, nil)
  } else {
    // Resolve by FAMILY name + traits, not the exact PostScript name: pinning a
    // face makes CoreText ignore the weight trait. Fall back to the PostScript
    // name only if the family can't be determined.
    let baseCT = CTFontCreateWithGraphicsFont(cgFont, fontSize, nil, nil)
    if let familyName = CTFontCopyFamilyName(baseCT) as String? {
      attributes[kCTFontFamilyNameAttribute] = familyName as CFString
    } else {
      attributes[kCTFontNameAttribute] = postScriptName as CFString
    }
  }

  let descriptor = CTFontDescriptorCreateWithAttributes(attributes as CFDictionary)

  return CTFontCreateWithFontDescriptor(descriptor, fontSize, nil)
}

extension MasonElement {
  
  public var innerHTML: String {
    get {
      //todo
      return ""
    }
    set {
      node.mason.htmlParser.parseInto(newValue, element: self)
    }
  }
  
  public func dispatch(_ event: MasonEvent) {
    node.mason.dispatch(event, node)
  }

  public func elementFromPoint(_ x: CGFloat, _ y: CGFloat) -> UIView? {
    return MasonElementHelpers.elementFromPoint(uiView, x: x, y: y)
  }
  
  /// Helper to get default text attributes for new text nodes
  public func getDefaultAttributes() -> [NSAttributedString.Key: Any] {
    return node.getDefaultAttributes()
  }
  

  public func syncStyle(_ low: String, _ high: String) {
    func parseDecimalToUInt64(_ s: String) -> UInt64? {
      if s.isEmpty { return nil }
      if s.first == "-" {
        return UInt64(s)
      }
      
      return UInt64(s)
    }

    let lowValue = parseDecimalToUInt64(low)
    let highValue = parseDecimalToUInt64(high)

    if lowValue != nil || highValue != nil {
      let l = lowValue ?? 0
      let h = highValue ?? 0
      style.setStateFromHalves(l, h)
    }
  }
  
  public func addChildAt(text: String, _ index: Int) {
    node.addChildAt(MasonTextNode(mason: node.mason, data: text), index)
  }
  
  public func addChildAt(element: MasonElement, _ index: Int) {
    node.addChildAt(element.node, index)
  }
  
  public func addChildAt(node: MasonNode, _ index: Int) {
    self.node.addChildAt(node, index)
  }
  
  public func replaceChildAt(text: String, _ index: Int) {
    node.replaceChildAt(MasonTextNode(mason: node.mason, data: text), index)
  }
  
  public func replaceChildAt(element: MasonElement, _ index: Int) {
    node.replaceChildAt(element.node, index)
  }
  
  public func replaceChildAt(node: MasonNode, _ index: Int) {
    self.node.replaceChildAt(node, index)
  }
  
  public func removeAllChildren(){
    node.removeAllChildren()
  }
  
  public var style: MasonStyle {
    get {
      return node.style
    }
  }
  
  public func configure(_ block :(MasonStyle) -> Void) {
    node.inBatch = true
    block(node.style)
    node.inBatch = false
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
      if view.isInLayout {
        // Currently inside a layout pass — defer to avoid re-entrant layout.
        DispatchQueue.main.async {
          view.computeWithViewSize(layout: true)
        }
      } else {
        view.isInLayout = true
        defer { view.isInLayout = false }
        view.computeWithViewSize(layout: true)
      }
    }
  }
  
  public func invalidate(markDirty: Bool = false) {
    //    if(markDirty){
    //      node.markDirty()
    //    }
    //    uiView.setNeedsDisplay()
  }
  
  public func invalidateLayout(){
    requestLayout()
  }
  
  
  public func addView(_ view: UIView){
    if(view.superview == uiView){
      return
    }
    
    if(!(self is TextContainer)){
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
    if(!(self is TextContainer)){
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
  
  
  internal var computeCacheDirty: Bool {
    get {
      return objc_getAssociatedObject(self, &MasonElementProperties.computeCacheDirty) as? Bool ?? false
    }
    set {
      objc_setAssociatedObject(self, &MasonElementProperties.computeCacheDirty, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
  }

  internal var isInLayout: Bool {
    get {
      return objc_getAssociatedObject(self, &MasonElementProperties.isInLayout) as? Bool ?? false
    }
    set {
      objc_setAssociatedObject(self, &MasonElementProperties.isInLayout, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
  }
  
  internal func computeCache() -> CGSize {
    return objc_getAssociatedObject(self, &MasonElementProperties.computeCache) as? CGSize ?? .zero
  }
  
  internal func setComputeCache(_ value: CGSize) {
    objc_setAssociatedObject(self, &MasonElementProperties.computeCache, value, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    computeCacheDirty = true
  }

  private var _lastAutoComputeSize: CGSize {
    get {
      return objc_getAssociatedObject(self, &MasonElementProperties.lastAutoComputeSize) as? CGSize ?? .zero
    }
    set {
      objc_setAssociatedObject(self, &MasonElementProperties.lastAutoComputeSize, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
  }

  /// Auto-compute layout when this is a root Mason view (parent isn't a
  /// MasonElement). Call from layoutSubviews; mirrors Android's onMeasure.
  public func autoComputeIfRoot() {
    guard !(uiView.superview is MasonElement) else { return }
    guard let parentSize = uiView.superview?.bounds.size else { return }
    // Zero parent bounds (transitions, pre-Auto-Layout): skip but keep dirty
    // flags so the next real-size call recomputes instead of hitting stale cache.
    guard parentSize.width > 0 || parentSize.height > 0 else { return }
    if _lastAutoComputeSize != parentSize || computeCacheDirty || node.isDirty {
      _lastAutoComputeSize = parentSize
      let scale = NSCMason.scale
      let w = scale * Float(parentSize.width)
      let h = scale * Float(parentSize.height)
      // Preserve root view's frame — managed by the parent, not Mason.
      let savedFrame = uiView.frame
      isInLayout = true
      defer { isInLayout = false }
      computeWithSize(w, h)
      computeCacheDirty = false
      if uiView.frame != savedFrame {
        uiView.frame = savedFrame
      }
    }
  }

  /// NativeScript's JS measure pass drives a root Mason view's compute+apply
  /// itself (mason_computeWithSize/mason_computeWithMaxContent) before setting
  /// this view's frame. That frame write triggers layoutSubviews, and without
  /// this call autoComputeIfRoot would see `computeCacheDirty` (set by every
  /// compute call) and immediately recompute a second time — via computeWithSize
  /// only, which silently overrides a max-content measurement with the parent's
  /// exact bounds. Call right after the JS-driven compute to tell
  /// autoComputeIfRoot the current parent size is already satisfied.
  public func markRootComputeApplied() {
    guard !(uiView.superview is MasonElement) else { return }
    guard let parentSize = uiView.superview?.bounds.size else { return }
    _lastAutoComputeSize = parentSize
    computeCacheDirty = false
  }

  public func append(_ element: MasonElement){
    node.appendChild(element.node)
  }
  
  public func append(text: String){
    if(uiView is TextContainer){
      node.appendChild(MasonTextNode(mason: node.mason, data: text, attributes: (uiView as! TextContainer).defaultAttributes))
    }else {
      node.appendChild(MasonTextNode(mason: node.mason, data: text))
    }
  }
  
  public func append(node childNode: MasonNode){
    node.appendChild(childNode)
  }
  
  
  public func append(texts: [String]){
    guard !texts.isEmpty else { return }
    
    let nodes = texts.map { text in
      MasonTextNode(mason: node.mason, data: text)
    }
    
    for node in nodes {
      self.node.appendChild(node)
    }
    
  }
  
  public func append(nodes: [MasonNode]){
    guard !nodes.isEmpty else { return }
    for node in nodes {
      self.node.appendChild(node)
    }
  }
  
  public func append(elements: [MasonElement]){
    guard !elements.isEmpty else { return }
    
    for element in elements {
      self.node.appendChild(element.node)
    }
    
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
      return MasonLayout.empty
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
    setComputeCache(CGSize(width: CGFloat(width), height: CGFloat(height)))
    let points = mason_node_compute_wh_and_layout(node.mason.nativePtr,
                                                   node.nativePtr, width, height, create_layout)
    guard let points = points else {
      return
    }
    let layout: MasonLayout = Unmanaged.fromOpaque(points).takeRetainedValue()
    MasonElementHelpers.applyToView(node, layout)
  }
  
  public func computeWithViewSize(){
    computeWithViewSize(layout: false)
  }
  
  public func computeWithViewSize(layout: Bool){
    let w = Float(uiView.frame.size.width) * NSCMason.scale
    let h = Float(uiView.frame.size.height) * NSCMason.scale
    if(layout){
      setComputeCache(CGSize(width: CGFloat(w), height: CGFloat(h)))
      let points = mason_node_compute_wh_and_layout(node.mason.nativePtr,
                                                     node.nativePtr, w, h, create_layout)
      guard let points = points else {
        return
      }
      let layout: MasonLayout = Unmanaged.fromOpaque(points).takeRetainedValue()
      MasonElementHelpers.applyToView(node, layout)
    } else {
      compute(w, h)
    }
  }
  
  public func computeWithMaxContent(){
    let points = mason_node_compute_max_content_and_layout(node.mason.nativePtr,
                                                            node.nativePtr, create_layout)
    setComputeCache(CGSize(width: CGFloat(-2), height: CGFloat(-2)))
    guard let points = points else {
      return
    }
    let layout: MasonLayout = Unmanaged.fromOpaque(points).takeRetainedValue()
    MasonElementHelpers.applyToView(node, layout)
  }
  
  public func computeWithMinContent(){
    let points = mason_node_compute_min_content_and_layout(node.mason.nativePtr,
                                                            node.nativePtr, create_layout)
    setComputeCache(CGSize(width: CGFloat(-1), height: CGFloat(-1)))
    guard let points = points else {
      return
    }
    let layout: MasonLayout = Unmanaged.fromOpaque(points).takeRetainedValue()
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
        if(!(self.uiView is TextContainer)){
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

extension UIView {
  @objc(mason_elementFromPoint:y:)
  public func mason_elementFromPoint(_ x: CGFloat, y: CGFloat) -> UIView? {
    return MasonElementHelpers.elementFromPoint(self, x: x, y: y)
  }
}


class MasonElementHelpers: NSObject {
  @objc public static func elementFromPoint(_ root: UIView, x: CGFloat, y: CGFloat) -> UIView? {
    return hitTest(root, CGPoint(x: x + root.bounds.origin.x, y: y + root.bounds.origin.y))
  }

  private static func contains(_ view: UIView, _ point: CGPoint) -> Bool {
    return view.bounds.contains(point)
  }

  private static func clipsAxis(_ value: Overflow, _ contentExtent: CGFloat, _ viewExtent: CGFloat) -> Bool {
    switch value {
    case .Hidden, .Scroll, .Clip:
      return true
    case .Auto:
      return contentExtent > viewExtent
    default:
      return false
    }
  }

  private static func clippedOutside(_ view: UIView, _ point: CGPoint) -> Bool {
    guard let element = view as? MasonElement else {
      return !contains(view, point)
    }
    if !element.style.isValueInitialized {
      return false
    }

    let overflow = element.style.overflow
    let layout = element.node.computedLayout
    let contentWidth = CGFloat(layout.contentWidth.isNaN ? 0 : layout.contentWidth / NSCMason.scale)
    let contentHeight = CGFloat(layout.contentHeight.isNaN ? 0 : layout.contentHeight / NSCMason.scale)
    let clipsX = clipsAxis(overflow.x, contentWidth, view.bounds.width)
    let clipsY = clipsAxis(overflow.y, contentHeight, view.bounds.height)

    return (clipsX && (point.x < view.bounds.minX || point.x >= view.bounds.maxX))
      || (clipsY && (point.y < view.bounds.minY || point.y >= view.bounds.maxY))
  }

  private static func zSortedSubviews(_ view: UIView) -> [UIView] {
    return view.subviews.enumerated().sorted { lhs, rhs in
      let left = lhs.element
      let right = rhs.element
      if left.layer.zPosition == right.layer.zPosition {
        return lhs.offset < rhs.offset
      }
      return left.layer.zPosition < right.layer.zPosition
    }.map { $0.element }
  }

  private static func hitTest(_ view: UIView, _ point: CGPoint) -> UIView? {
    if view.isHidden || view.bounds.width <= 0 || view.bounds.height <= 0 || view.alpha <= 0.01 {
      return nil
    }
    if clippedOutside(view, point) {
      return nil
    }

    let children = zSortedSubviews(view)
    for child in children.reversed() {
      let childPoint = child.convert(point, from: view)
      if let hit = hitTest(child, childPoint) {
        return hit
      }
    }

    return contains(view, point) ? view : nil
  }
  
  public static func applyToView(_ node: MasonNode , _ layout: MasonLayout){
    node.computedLayout = layout
    if let view = node.view, !(view is MasonBr.FakeView) {
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
        if(!hasWidthConstraint && realLayout.contentWidth > realLayout.width){
          width = CGFloat(realLayout.contentWidth.isNaN ? 0 : realLayout.contentWidth/NSCMason.scale)
        }
        
        if(!hasHeightConstraint && realLayout.contentSize.height > realLayout.height){
          height = CGFloat(realLayout.contentSize.height.isNaN ? 0 : realLayout.contentSize.height/NSCMason.scale)
        }
      }
      
      let point = CGPoint(x: x, y: y)
      
      let size = CGSizeMake(width, height)
      
      var newFrame = CGRect(origin: point, size: size)
      
      if(!realLayout.paddingIsEmpty){
        var top: CGFloat = 0
        if !realLayout.paddingTop.isZero {
          top = CGFloat(realLayout.paddingTop / NSCMason.scale)
        }
        
        var left: CGFloat = 0
        if !realLayout.paddingLeft.isZero {
          left = CGFloat(realLayout.paddingLeft / NSCMason.scale)
        }
        
        var bottom: CGFloat = 0
        if !realLayout.paddingBottom.isZero {
          bottom = CGFloat(realLayout.paddingBottom / NSCMason.scale)
        }
        
        var right: CGFloat = 0
        if !realLayout.paddingRight.isZero {
          right = CGFloat(realLayout.paddingRight / NSCMason.scale)
        }
        
        let insets = UIEdgeInsets(top: top, left: left, bottom: bottom, right: right)
        newFrame.inset(by: insets)
      }

      // Root scroll container is a VIEWPORT: Mason sizes a height:auto / visible
      // node to its full content, but the on-screen box must not exceed the
      // available space, or there is no scrollable delta (box == contentSize).
      // Clamp the box to the superview (the NativeScript-managed viewport); the
      // children stay laid out in the full content space and `contentSize`
      // (computed below from the unclamped layout) overflows it → scroll engages.
      // Only roots (superview is not a MasonElement) self-size; nested nodes are
      // positioned by their Mason parent and must keep the computed frame.
      if let mv = view as? MasonUIView, mv.isScrollContainer,
         !(view.superview is MasonElement),
         let avail = view.superview?.bounds.size,
         avail.width > 0, avail.height > 0 {
        if newFrame.size.height > avail.height { newFrame.size.height = avail.height }
        if newFrame.size.width > avail.width { newFrame.size.width = avail.width }
      }

      // Setting `view.frame` is undefined when the view has a non-identity
      // transform, so position via bounds+center instead (equivalent to frame
      // when the transform is identity).
      if view.transform.isIdentity && CATransform3DIsIdentity(view.layer.transform) {
        if view.frame != newFrame {
          view.frame = newFrame
        }
      } else {
        let newBounds = CGRect(origin: view.bounds.origin, size: newFrame.size)
        let newCenter = CGPoint(x: newFrame.midX, y: newFrame.midY)
        if view.bounds.size != newBounds.size {
          view.bounds = newBounds
        }
        if view.center != newCenter {
          view.center = newCenter
        }
      }

      // Reposition the outset box-shadow layer here (where the frame is applied):
      // layoutSubviews only fires on size changes, so position-only moves during
      // reflow would otherwise leave the shadow stranded.
      node.style.updateShadowLayer(for: CGRect(origin: .zero, size: view.bounds.size))

      // Clipping per the CSS overflow spec: Hidden/Scroll/Clip always clip the
      // axis, Auto clips only on overflow, Visible never. Border-radius always
      // clips children to the rounded rect regardless of overflow.
      let overflow = node.style.overflow
      // Scroll container: default `visible` acts as `auto` on the Y axis only;
      // horizontal stays visible to avoid surprise sideways scrolling.
      let _isScrollContainer = (node.view as? MasonUIView)?.isScrollContainer ?? false
      let clipX = overflow.x == .Hidden || overflow.x == .Scroll || overflow.x == .Clip
        || (overflow.x == .Auto && realLayout.contentWidth > realLayout.width)
      let clipY = overflow.y == .Hidden || overflow.y == .Scroll || overflow.y == .Clip
        || (overflow.y == .Auto && realLayout.contentHeight > realLayout.height)
        || (overflow.y == .Visible && _isScrollContainer && realLayout.contentHeight > realLayout.height)

      let borderRender = node.style.mBorderRender
      borderRender.resolve(for: view.bounds)
      let hasRadii = borderRender.hasRadii()

      // Never touch clipsToBounds on UIScrollView here: changing it during
      // layoutSubviews corrupts UIKit's gesture graph (UIGestureGraphEdge
      // assertions). It's fixed to true at init.
      if view is UIScrollView {
        // Nothing to do — clipping is fixed at init time.
      } else if clipX && clipY {
        // Both axes clip — use clipsToBounds (+ border-radius mask if needed)
        view.clipsToBounds = true
        if hasRadii {
          let clipPath = borderRender.getClipPath(rect: view.bounds, radius: borderRender.radius)
          let newCGPath = clipPath.cgPath
          if let existing = view.layer.mask as? CAShapeLayer {
            if existing.path == nil || existing.path!.boundingBoxOfPath != newCGPath.boundingBoxOfPath {
              existing.path = newCGPath
            }
          } else {
            let maskLayer = CAShapeLayer()
            maskLayer.path = newCGPath
            view.layer.mask = maskLayer
          }
        } else if view.layer.mask != nil {
          view.layer.mask = nil
        }
      } else if clipX || clipY {
        // Only one axis clips — use a layer mask that extends beyond
        // the view on the non-clipped axis so shadows/content can overflow.
        view.clipsToBounds = false

        // Large overflow allowance for the unclipped axis
        let overflowPad: CGFloat = 10000

        let clipRect: CGRect
        if clipX && !clipY {
          clipRect = CGRect(x: 0, y: -overflowPad, width: view.bounds.width, height: view.bounds.height + overflowPad * 2)
        } else {
          clipRect = CGRect(x: -overflowPad, y: 0, width: view.bounds.width + overflowPad * 2, height: view.bounds.height)
        }

        if hasRadii {
          let clipPath = borderRender.getClipPath(rect: view.bounds, radius: borderRender.radius)
          let newCGPath = clipPath.cgPath
          let maskLayer = (view.layer.mask as? CAShapeLayer) ?? CAShapeLayer()
          maskLayer.path = newCGPath
          view.layer.mask = maskLayer
        } else {
          let maskLayer = (view.layer.mask as? CAShapeLayer) ?? CAShapeLayer()
          maskLayer.path = UIBezierPath(rect: clipRect).cgPath
          view.layer.mask = maskLayer
        }
      } else {
        // Overflow visible: border-radius alone doesn't clip children (only the
        // element's own bg/border are rounded, drawn in draw()). A mask here would
        // clip the border stroke and overflowing children, so clear it.
        view.clipsToBounds = false
        if view.layer.mask != nil {
          view.layer.mask = nil
        }
      }
      
      node.isLayoutValid = true
      
      // Compute content size for any scrollable view (Scroll or MasonUIView).
      let _overflow = node.style.overflow
      let _ox = _overflow.x
      let _oy: Overflow = (_overflow.y == .Visible && _isScrollContainer) ? .Auto : _overflow.y
      let _hasScrollOverflow = _ox == .Scroll || _ox == .Auto
        || _oy == .Scroll || _oy == .Auto
      if _hasScrollOverflow {
        let cw = CGFloat(realLayout.contentWidth.isNaN ? 0 : realLayout.contentWidth/NSCMason.scale)
        let ch = CGFloat(realLayout.contentHeight.isNaN ? 0 : realLayout.contentHeight/NSCMason.scale)
        let bw = CGFloat(realLayout.width.isNaN ? 0 : realLayout.width/NSCMason.scale)
        let bh = CGFloat(realLayout.height.isNaN ? 0 : realLayout.height/NSCMason.scale)

        // For `scroll`: always use content size (allow scrolling even if smaller)
        // For `auto`: use content size only when it overflows the box
        // For `visible`/`hidden`/`clip`: use box size (no scrolling)
        let scrollWidth: CGFloat
        switch _ox {
        case .Scroll: scrollWidth = max(cw, bw)
        case .Auto:   scrollWidth = cw > bw ? cw : bw
        default:      scrollWidth = bw
        }
        let scrollHeight: CGFloat
        switch _oy {
        case .Scroll: scrollHeight = max(ch, bh)
        case .Auto:   scrollHeight = ch > bh ? ch : bh
        default:      scrollHeight = bh
        }
        let newContentSize = CGSize(width: scrollWidth, height: scrollHeight)

        if let scroll = node.view as? Scroll {
          if scroll.contentSize != newContentSize { scroll.contentSize = newContentSize }
          MasonElementHelpers.handleOverflow(_overflow.x, scroll)
          MasonElementHelpers.handleOverflow(_overflow.y, scroll, true)
        } else if let masonView = node.view as? MasonUIView {
          if masonView.contentSize != newContentSize { masonView.contentSize = newContentSize }
        }
      }

    }
    
    // `layout.children` allocates on every access; hoist it out of the loop
    let childLayouts = layout.children
    if !childLayouts.isEmpty {
      // Only children with nativePtr, matching Rust layout tree order. Keep
      // flattened text containers so indices stay aligned with childLayouts.
      let children = node.children.filter { $0.nativePtr != nil }

      let count = min(children.count, childLayouts.count)
      // Sweep orphaned outset-shadow layers (safety net for missed per-child
      // willMove cleanup under heavy churn).
      reconcileShadowLayers(node.view)
      for i in 0..<count {
        let child = children[i]
        if(child.type == .text){
          continue
        }

        // Skip flattened text containers — parent draws their text
        if child.parent?.view is TextContainer && child.view is TextContainer {
          if (child.parent!.view as! TextContainer).engine.shouldFlattenTextContainer(child.view as! TextContainer) {
            child.view?.frame = .zero
            continue
          }
        }

        applyToView(child, childLayouts[i])
      }
    }
    
  }
  
  
  
  /// Remove outset-shadow sublayers in `container` whose owner is no longer a
  /// direct child (or whose style was freed). Safety net for per-child cleanup.
  internal static func reconcileShadowLayers(_ container: UIView?) {
    guard let container = container, let sublayers = container.layer.sublayers else { return }
    for layer in sublayers {
      guard let shadow = layer as? MasonShadowLayer else { continue }
      let ownerView = shadow.masonStyle?.node.view
      if ownerView == nil || ownerView?.superview !== container {
        shadow.removeFromSuperlayer()
        // Reset bookkeeping so the owner re-attaches cleanly if it returns.
        shadow.masonStyle?.markShadowLayerDetached()
      }
    }
  }

  private static func setIfNeeded<T: Equatable>(_ keyPath: ReferenceWritableKeyPath<UIScrollView, T>, on scroll: UIScrollView, to value: T) {
    if scroll[keyPath: keyPath] != value {
      scroll[keyPath: keyPath] = value
    }
  }

  /// Configure scroll indicators and bounce behaviour for a single axis.
  /// Clipping (clipsToBounds / layer mask) is handled in the layout pass,
  /// not here, so that per-axis clipping works correctly.
  internal static func handleOverflow(_ overflow: Overflow, _ scroll: UIScrollView, _ vertical: Bool = false) {
    switch overflow {
    case .Scroll:
      if vertical {
        setIfNeeded(\.alwaysBounceVertical, on: scroll, to: true)
        setIfNeeded(\.showsVerticalScrollIndicator, on: scroll, to: true)
      } else {
        setIfNeeded(\.alwaysBounceHorizontal, on: scroll, to: true)
        setIfNeeded(\.showsHorizontalScrollIndicator, on: scroll, to: true)
      }
    case .Auto:
      if vertical {
        let overflows = scroll.contentSize.height > scroll.bounds.size.height
        setIfNeeded(\.showsVerticalScrollIndicator, on: scroll, to: overflows)
        setIfNeeded(\.alwaysBounceVertical, on: scroll, to: overflows)
      } else {
        let overflows = scroll.contentSize.width > scroll.bounds.size.width
        setIfNeeded(\.showsHorizontalScrollIndicator, on: scroll, to: overflows)
        setIfNeeded(\.alwaysBounceHorizontal, on: scroll, to: overflows)
      }
    default:
      // Visible, Hidden, Clip — no scrolling on this axis
      if vertical {
        setIfNeeded(\.alwaysBounceVertical, on: scroll, to: false)
        setIfNeeded(\.showsVerticalScrollIndicator, on: scroll, to: false)
      } else {
        setIfNeeded(\.alwaysBounceHorizontal, on: scroll, to: false)
        setIfNeeded(\.showsHorizontalScrollIndicator, on: scroll, to: false)
      }
    }
  }
}
