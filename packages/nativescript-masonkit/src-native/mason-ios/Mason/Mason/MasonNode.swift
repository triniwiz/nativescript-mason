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

@objc(MasonNode)
@objcMembers
public class MasonNode: NSObject {
  public internal(set) var mason: NSCMason
  
  internal var isAnonymous = false
  internal var isPlaceholder: Bool = false
  
  internal var cachedWidth: CGFloat = 0
  internal var cachedHeight: CGFloat = 0
  
  public var onNodeAttached: (() -> Void)? = nil
  public var onNodeDetached: (() -> Void)? = nil
  
  
  static func invalidateDescendantTextViews(_ node: MasonNode, _ state: Int64) {
    // Early exit if node has no initialized text values
    // if (!node.style.isTextValueInitialized) {
    //  return
    // }
    
    // Direct invalidation if this is a MasonText
    if let view = node.view as? TextContainer {
      // Notify all text style changes to ensure paint is fully updated
      view.onTextStyleChanged(change: state)
    }

    // Iterate children (only layout children, not author children)
    for child in node.children {
      invalidateDescendantTextViews(child, state)
    }
  }
  
  
  internal var suppressChildOps = 0
  
  @inline(__always)
  internal func suppressChildOperations<T>(_ block: () -> T) -> T {
    suppressChildOps += 1
    defer { suppressChildOps -= 1 }
    return block()
  }
  
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
  
  
  internal var layoutParent: MasonNode? = nil
  public internal(set) var parent: MasonNode? {
    get {
      var p = layoutParent
      while p?.isAnonymous == true {
        p = p?.parent
      }
      return p
    }
    set {
      layoutParent = newValue
    }
  }
  
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
  
  
  internal init(masonLineBreak doc: NSCMason) {
    mason = doc
    nativePtr = mason_node_new_line_break_node(mason.nativePtr)
    type = .element
    super.init()
    mason_node_set_apple_node(mason.nativePtr, nativePtr, Unmanaged.passRetained(self).toOpaque())
  }
  
  
  internal init(masonImage doc: NSCMason) {
    mason = doc
    nativePtr = mason_node_new_image_node(mason.nativePtr)
    type = .element
    super.init()
    mason_node_set_apple_node(mason.nativePtr, nativePtr, Unmanaged.passRetained(self).toOpaque())
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
  
  private func getDecorationColor() -> UIColor {
    let decColor = style.resolvedDecorationColor
    if decColor == Constants.UNSET_COLOR {
      return UIColor.colorFromARGB(style.resolvedColor)
    }
    return UIColor.colorFromARGB(decColor)
  }
  
  /// Helper to get default text attributes for new text nodes
  public func getDefaultAttributes() -> [NSAttributedString.Key: Any] {
    var attrs: [NSAttributedString.Key: Any] = [:]
    
    if(style.font.font == nil){
      style.font.loadSync { _ in }
    }
    
    let paragraphStyle = NSMutableParagraphStyle()
    
    var type = MasonTextType.None
    
    if let view = view as? MasonText {
      type = view.type
    }
    
    let scale = NSCMason.scale
    
    switch(type){
    case .H1:
      paragraphStyle.paragraphSpacing = CGFloat( 8 * scale)
      break
    case .H2:
      paragraphStyle.paragraphSpacing = CGFloat( 7 * scale)
      break
    case .H3:
      paragraphStyle.paragraphSpacing = CGFloat( 6 * scale)
      break
    case .H4:
      paragraphStyle.paragraphSpacing = CGFloat( 5 * scale)
      break
    case .H5:
      paragraphStyle.paragraphSpacing = CGFloat( 4 * scale)
      break
    case .H6:
      paragraphStyle.paragraphSpacing = CGFloat( 3 * scale)
      break
    case .Blockquote:
      paragraphStyle.headIndent = CGFloat(40)
      paragraphStyle.firstLineHeadIndent =  CGFloat(40)
      break
    default:
      //noop
      break
    }
    
    let fontFace = style.resolvedFontFace
    
    if(fontFace.font == nil){
      fontFace.loadSync { _ in}
    }
    
    if let font = fontFace.font {
      // Font
      let fontSize = style.resolvedFontSize
      let weight = style.resolvedFontWeight
      let style = style.resolvedInternalFontStyle
      let ctFont = ctFont(from: font, fontSize: CGFloat(fontSize), weight: weight.uiFontWeight, style: style)
      attrs[.font] = ctFont
      attrs[NSAttributedString.Key(Constants.FONT_WEIGHT)] = weight.uiFontWeight.rawValue
      attrs[NSAttributedString.Key(Constants.FONT_STYLE)] = style
    }
    
    
    // Color
    attrs[.foregroundColor] =  UIColor.colorFromARGB(style.resolvedColor)
    
    
    let backgroundColorValue = style.resolvedBackgroundColor
    // Background color
    if backgroundColorValue != 0 {
      attrs[.backgroundColor] = UIColor.colorFromARGB(backgroundColorValue)
    }
    
    
    switch(style.resolvedDecorationLine){
    case .None: break
      // noop
    case .Underline:
      attrs[.underlineStyle] = NSUnderlineStyle.single.rawValue
      attrs[.underlineColor] = getDecorationColor()
    case .Overline:
      // todo
      break
    case .LineThrough:
      attrs[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
      attrs[.strikethroughColor] = getDecorationColor()
      
    }
    
    
    let ws = style.resolvedWhiteSpace
    let noWrap = (style.resolvedTextWrap == .NoWrap)
    // Allow wrap unless textWrap=NoWrap or white-space forbids it
    let allowWrap = !(noWrap || ws == .Pre || ws == .NoWrap)

    switch ws {
    case .Normal, .PreWrap, .PreLine, .BreakSpaces:
      paragraphStyle.lineBreakMode = allowWrap ? .byWordWrapping : .byClipping
    case .Pre, .NoWrap:
      paragraphStyle.lineBreakMode = .byClipping
    }

    if #available(iOS 14.0, *) {
      paragraphStyle.lineBreakStrategy = allowWrap ? [.standard, .hangulWordPriority, .pushOut] : []
    }
    
    // Preserve spacing better when wrapping
    paragraphStyle.allowsDefaultTighteningForTruncation = false
    
    // letter spacing
    let letterSpacing = style.resolvedLetterSpacing
    if(letterSpacing > 0){
      attrs[.kern] = letterSpacing
    }
    
    let lineHeightType = style.resolvedLineHeightType
    let lineHeight = style.resolvedLineHeight
    if(lineHeightType == 1){
      let height = CGFloat(lineHeight)
      paragraphStyle.minimumLineHeight = height
      paragraphStyle.maximumLineHeight = height
    }else {
      if(lineHeight > 0){
        paragraphStyle.lineHeightMultiple = CGFloat(lineHeight)
      }
    }
    
    // text alignment
    switch style.resolvedTextAlign {
    case .Auto:
      paragraphStyle.alignment = .natural
    case .Left:
      paragraphStyle.alignment = .left
    case .Right:
      paragraphStyle.alignment = .right
    case .Center:
      paragraphStyle.alignment = .center
    case .Justify:
      paragraphStyle.alignment = .justified
    case .Start:
      let isLTR = UIView.userInterfaceLayoutDirection(for: .unspecified) == .leftToRight
      if(isLTR){
        paragraphStyle.alignment = .left
      }else {
        paragraphStyle.alignment = .right
      }
      break
    case .End:
      let isLTR = UIView.userInterfaceLayoutDirection(for: .unspecified) == .leftToRight
      if(isLTR){
        paragraphStyle.alignment = .right
      }else {
        paragraphStyle.alignment = .left
      }
      break
    }
    
    // Paragraph style
    attrs[.paragraphStyle] = paragraphStyle
    
    
    return attrs
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
    if (child is MasonTextNode) {
      let container = if (view is TextContainer) {
        self
      } else {
        getOrCreateAnonymousTextContainer()
      }
    
  
      container.children.append(child)
      if let child = child as? MasonTextNode, let it = container.view as? MasonText {
        child.attributes = it.getDefaultAttributes()
        child.container = it
        it.engine.invalidateInlineSegments()
      }
      (container.view as? TextContainer)?.engine.invalidateInlineSegments()
      NodeUtils.invalidateLayout(self)
    } else {
      children.append(child)
      child.parent = self
      NativeHelpers.nativeNodeAddChild(mason, self, child)
      NodeUtils.addView(self, child.view)
      // Single pass invalidation of descendants with text styles
      MasonNode.invalidateDescendantTextViews(child, TextStyleChangeMasks.all.rawValue)
      onNodeAttached?()
    }
  }
  
  
  internal func getOrCreateAnonymousTextContainer(_ append: Bool = true, checkLast: Bool = true) -> MasonNode {
    // Check if last child is an anonymous text container
    if checkLast,
       let lastChild = children.last,
       lastChild.isAnonymous,
       lastChild.view is TextContainer {
      return lastChild
    }
    
    // Create new anonymous container
    let textView = MasonText(mason: mason, isAnonymous: true)
    textView.style.display = .Inline
    
    if(append){
      // Add container to this node
      children.append(textView.node)
      
      textView.node.parent = self
      
      
      if(append && !(view is TextContainer)){
        view?.addSubview(textView)
      }
      
      // Add to native layout tree
      if let containerPtr = textView.node.nativePtr {
        mason_node_add_child(mason.nativePtr, nativePtr, containerPtr)
      }
      
    }
    
    return textView.node
  }
  
  @discardableResult
  func removeChild(_ child: MasonNode) -> MasonNode? {
    guard child.parent === self else { return nil }
    
    if (children.isEmpty) {
      return nil
    }
    let nodes = getChildren()
    guard let idx = nodes.firstIndex(of: child) else {return nil}
    return removeChildAt(index: idx)
  }
  
  
  
  internal func replaceChildAt(_ child: MasonNode, _ index: Int) {
    // --- Handle invalid indices ---
    if index <= -1 {
      appendChild(child)
      return
    }
    
    let nodes = getChildren()
    if index >= nodes.count {
      appendChild(child)
      return
    }
    
    let reference = nodes[index]
    if reference === child {
      return
    }
    
    // --- Handle TextNode replacement ---
    if let textChild = child as? MasonTextNode {
      if let referenceText = reference as? MasonTextNode {
        guard
          let container = referenceText.container,
          let idx = container.node.children.firstIndex(where: { $0 === referenceText })
        else { return }
        
        container.node.children[idx] = textChild
        textChild.attributes.removeAll()
        textChild.attributes.merge(container.node.getDefaultAttributes()) { _, new in new }
        textChild.container = container
        referenceText.container = nil
        
        container.engine.invalidateInlineSegments()
        if !style.inBatch {
          (container.node.view as? MasonElement)?.invalidateLayout()
        }
        
      } else {
        let container = getOrCreateAnonymousTextContainer(false, checkLast: false)
        container.children.append(textChild)
        
        if let textView = container.view as? MasonText {
          textChild.attributes.removeAll()
          textChild.attributes.merge(textView.getDefaultAttributes()) { _, new in new }
          textChild.container = textView
          textView.engine.invalidateInlineSegments()
        }
        
        guard let idx = children.firstIndex(where: { $0 === reference }) else { return }
        children[idx] = container
        reference.parent = nil
        NodeUtils.syncNode(self, children)
      }
      
      return
    }
    
    // --- Non-text child handling ---
    guard let idx: Int = {
      if let i = children.firstIndex(where: { $0 === reference }) {
        return i
      }
      if let refText = reference as? MasonTextNode,
         let containerNode = refText.container?.node,
         containerNode.isAnonymous,
         let i = containerNode.children.firstIndex(where: { $0 === reference }) {
        return i
      }
      return nil
    }() else {
      return
    }
    
    // --- Text node inside anonymous container (split handling) ---
    if let referenceText = reference as? MasonTextNode {
      let containerNode = referenceText.layoutParent ?? referenceText.container?.node
      if let containerNode = containerNode, containerNode.parent === self {
        let idxInContainer = containerNode.children.firstIndex(where: { $0 === referenceText }) ?? -1
        if idxInContainer >= 0 {
          let hasLeft = idxInContainer > 0
          let hasRight = idxInContainer < containerNode.children.count - 1
          let containerIndexInParent = children.firstIndex(where: { $0 === containerNode }) ?? -1
          
          var afterContainer: MasonNode? = nil
          if hasRight {
            afterContainer = getOrCreateAnonymousTextContainer(false, checkLast: false)
            
            // Move right-side text nodes into afterContainer
            let start = idxInContainer + 1
            let moved = Array(containerNode.children[start...])
            for m in moved {
              if let removeIndex = containerNode.children.firstIndex(where: { $0 === m }) {
                containerNode.children.remove(at: removeIndex)
              }
              m.parent = afterContainer
              afterContainer?.children.append(m)
              
              if let tv = afterContainer?.view as? MasonText, let mText = m as? MasonTextNode {
                mText.attributes = tv.getDefaultAttributes()
                mText.container = tv
              }
            }
            
            // Insert afterContainer into parent’s layout children immediately after original container
            if containerIndexInParent >= 0 {
              let insertAt = containerIndexInParent + 1
              children.insert(afterContainer!, at: insertAt)
              afterContainer?.parent = self
              
              if let viewGroup = view,
                 let refContainerView = referenceText.container?.node.view,
                 let idxChild = viewGroup.subviews.firstIndex(of: refContainerView),
                 idxChild > -1,
                 let afterView = afterContainer?.view {
                suppressChildOperations {
                  viewGroup.insertSubview(afterView, at: idxChild + 1)
                }
              }
              
              if let afterContainer = afterContainer {
                NativeHelpers.nativeNodeAddChild(mason, self, afterContainer)
              }
              
            } else {
              // Fallback: append
              children.append(afterContainer!)
              afterContainer?.parent = self
              
              if let viewGroup = view,
                 let refContainerView = referenceText.container?.node.view,
                 let idxChild = viewGroup.subviews.firstIndex(of: refContainerView),
                 idxChild > -1,
                 let afterView = afterContainer?.view {
                suppressChildOperations {
                  viewGroup.insertSubview(afterView, at: idxChild + 1)
                }
              }
              
              if let afterContainer = afterContainer {
                NativeHelpers.nativeNodeAddChild(mason, self, afterContainer)
              }
            }
          }
          
          // Remove the reference text node from the original container
          if idxInContainer >= 0 && idxInContainer < containerNode.children.count {
            containerNode.children.remove(at: idxInContainer)
          }
          
          referenceText.container?.engine.invalidateInlineSegments()
          referenceText.container?.node.view?.setNeedsDisplay()
          referenceText.parent = nil
          referenceText.container = nil
          
          // Remove empty container if necessary
          if containerNode.children.isEmpty {
            if let pIdx = children.firstIndex(where: { $0 === containerNode }) {
              children.remove(at: pIdx)
              NodeUtils.removeView(self, containerNode.view)
            }
          }
          
          // --- Insert or replace the element child ---
          switch (hasLeft, hasRight) {
          case (true, true):
            if let pos = children.firstIndex(where: { $0 === containerNode }) {
              children.insert(child, at: pos + 1)
            } else {
              children.append(child)
            }
            child.parent = self
            NodeUtils.addView(self, child.view)
            
          case (true, false):
            if let pos = children.firstIndex(where: { $0 === containerNode }) {
              children.insert(child, at: pos + 1)
            } else {
              children.append(child)
            }
            child.parent = self
            NodeUtils.addView(self, child.view)
            
          case (false, true):
            let pos = (containerIndexInParent >= 0)
            ? containerIndexInParent
            : children.firstIndex(where: { $0 === containerNode }) ?? -1
            if pos >= 0 && pos < children.count {
              children[pos] = child
            } else {
              children.append(child)
            }
            child.parent = self
            NodeUtils.addView(self, child.view)
            
          default:
            let pos = (containerIndexInParent >= 0)
            ? containerIndexInParent
            : children.firstIndex(where: { $0 === containerNode }) ?? -1
            if pos >= 0 && pos < children.count {
              children[pos] = child
            } else {
              children.append(child)
            }
            child.parent = self
            NodeUtils.addView(self, child.view)
          }
          
          
          // Single pass invalidation of descendants with text styles
          MasonNode.invalidateDescendantTextViews(child, TextStyleChangeMasks.all.rawValue)
          
          NodeUtils.syncNode(self, children)
          if !style.inBatch {
            (view as? MasonElement)?.invalidateLayout()
          }
          return
        }
      }
    }
    
    // --- Default non-text replacement ---
    children[idx] = child
    child.parent = self
    reference.parent = nil
    NodeUtils.removeView(self, reference.view)
    NodeUtils.addView(self, child.view)
    
    // Single pass invalidation of descendants with text styles
    MasonNode.invalidateDescendantTextViews(child, TextStyleChangeMasks.all.rawValue)
    
    
    NodeUtils.syncNode(self, children)
    
    if !style.inBatch {
      if child.view is TextContainer {
        (child.view as? MasonText)?.invalidate()
      }
      (view as? MasonElement)?.invalidateLayout()
    }
  }
  
  
  internal func addChildAt(_ child: MasonNode, _ index: Int) {
    if index <= -1 {
      appendChild(child)
      return
    }
    
    let authorChildren = getChildren()
    
    // if index is past end, fallback to append behavior
    if index >= authorChildren.count {
      appendChild(child)
      return
    }
    
    let reference = authorChildren[index]
    
    // Inserting a TextNode
    if let textChild = child as? MasonTextNode {
      if let referenceText = reference as? MasonTextNode {
        if let containerNode = referenceText.layoutParent ?? referenceText.container?.node, containerNode.parent === self {
          if let idxInContainer = containerNode.children.firstIndex(of: referenceText) {
            containerNode.children.insert(textChild, at: idxInContainer)
            textChild.parent = containerNode
            
            if let tv = containerNode.view as? MasonText {
              textChild.attributes.removeAll()
              textChild.attributes.merge(tv.getDefaultAttributes()) { _, new in new }
              textChild.container = tv
              tv.engine.invalidateInlineSegments()
            }
            
            if !style.inBatch {
              (containerNode as? MasonElement)?.invalidateLayout()
            }
            return
          }
        }
      }
      
      // Create an anonymous text container
      let container = getOrCreateAnonymousTextContainer(checkLast: false)
      container.children.removeAll()
      container.children.append(textChild)
      textChild.parent = container
      
      if let tv = container.view as? MasonText {
        textChild.attributes.removeAll()
        textChild.attributes.merge(tv.getDefaultAttributes()) { _, new in new }
        textChild.container = tv
        tv.engine.invalidateInlineSegments()
      }
      
      let refPos = children.firstIndex(of: reference) ?? 0
      children.insert(container, at: refPos)
      container.parent = self
      NodeUtils.addView(self, container.view)
      NodeUtils.syncNode(self, children)
      
      if !style.inBatch {
        (view as? MasonElement)?.invalidateLayout()
      }
      return
    }
    
    // Inserting a non-TextNode
    if let referenceText = reference as? MasonTextNode {
      if let containerNode = referenceText.layoutParent ?? referenceText.container?.node, containerNode.parent === self, let idxInContainer = containerNode.children.firstIndex(of: referenceText) {
        
        let containerIndexInParent = children.firstIndex(of: containerNode) ?? -1
        
        if containerIndexInParent < 0 {
          let insertIndex = children.firstIndex(of: reference) ?? index
          let pos = max(0, min(children.count, insertIndex))
          children.insert(child, at: pos)
          child.parent = self
          NodeUtils.addView(self, child.view)
          NodeUtils.syncNode(self, children)
          if !style.inBatch { (view as? MasonElement)?.invalidateLayout() }
          return
        }
        
        // Split container
        let leftSlice = Array(containerNode.children[..<idxInContainer])
        let rightSlice = Array(containerNode.children[idxInContainer...])
        
        containerNode.children.removeAll()
        for n in leftSlice {
          containerNode.children.append(n)
          n.parent = containerNode
        }
        
        if let tv = containerNode.view as? MasonText {
          for tn in containerNode.children {
            if let tnText = tn as? MasonTextNode {
              tnText.attributes.removeAll()
              tnText.attributes.merge(tv.getDefaultAttributes()) { _, new in new }
              tnText.container = tv
            }
          }
          tv.engine.invalidateInlineSegments()
        }
        (containerNode.view as? MasonElement)?.invalidateLayout()
        
        // after container
        var afterContainer: MasonNode? = nil
        if !rightSlice.isEmpty {
          afterContainer = getOrCreateAnonymousTextContainer(checkLast: false)
          afterContainer?.children.removeAll()
          for n in rightSlice {
            afterContainer?.children.append(n)
            n.parent = afterContainer
            if let tv = afterContainer?.view as? MasonText, let tnText = n as? MasonTextNode {
              tnText.attributes.removeAll()
              tnText.attributes.merge(tv.getDefaultAttributes()) { _, new in new }
              tnText.container = tv
            }
          }
          if let tv = afterContainer?.view as? MasonText {
            tv.engine.invalidateInlineSegments()
            tv.invalidateLayout()
          }
        }
        
        if !leftSlice.isEmpty {
          let insertPos = containerIndexInParent + 1
          children.insert(child, at: insertPos)
          child.parent = self
          if let after = afterContainer {
            children.insert(after, at: insertPos + 1)
            after.parent = self
            NodeUtils.addView(self, after.view)
          }
        } else {
          let replacePos = containerIndexInParent
          children.remove(at: replacePos)
          children.insert(child, at: replacePos)
          child.parent = self
          if let after = afterContainer {
            children.insert(after, at: replacePos + 1)
            after.parent = self
            NativeHelpers.nativeNodeAddChild(mason, self, after)
            NodeUtils.addView(self, after.view)
          } else {
            NodeUtils.removeView(self, containerNode.view)
          }
        }
        
        
     //   NodeUtils.syncNode(self, children)
        NodeUtils.addView(self, child.view)
        // Single pass invalidation of descendants with text styles
        MasonNode.invalidateDescendantTextViews(child, TextStyleChangeMasks.all.rawValue)
        
        
        NodeUtils.syncNode(self, children)
        
        
        
        (containerNode.view as? MasonElement)?.invalidateLayout()
        (afterContainer?.view as? MasonElement)?.invalidateLayout()
        (child.view as? MasonElement)?.invalidateLayout()
        
        
        
        if !style.inBatch { (view as? MasonElement)?.invalidateLayout() }
        return
      }
    }
    
    // Default: simple insert at index
    let insertIndex = children.firstIndex(of: reference) ?? index
    let pos = max(0, min(children.count, insertIndex))
    children.insert(child, at: pos)
    child.parent = self
    
    if child.nativePtr != nil {
      NativeHelpers.nativeNodeAddChild(mason, self, child)
    } else {
      NodeUtils.addView(self, child.view)
    }
    
    // Single pass invalidation of descendants with text styles
    MasonNode.invalidateDescendantTextViews(child, TextStyleChangeMasks.all.rawValue)
    
    NodeUtils.syncNode(self, children)
    if !style.inBatch { (view as? MasonElement)?.invalidateLayout() }
  }
  
  
  internal func removeChildAt(index: Int) -> MasonNode? {
    if (index < 0) {
      return nil
    }
    let children = getChildren()
    if (index >= children.count) {
      return nil
    }
    let reference = children[index]
    guard let idx =
            reference.layoutParent?.children.firstIndex(of: reference) else {return nil}
    guard let removed = reference.layoutParent?.children.remove(at: idx) else {return nil}
    if let removed = removed as? MasonTextNode {
      removed.container?.engine.invalidateInlineSegments()
      removed.container = nil
      if (reference.layoutParent?.children.isEmpty == true) {
        if let layoutParent = reference.layoutParent?.layoutParent {
          NodeUtils.removeView(layoutParent, reference.layoutParent?.view)
        }
        reference.layoutParent?.parent = nil
        NodeUtils.syncNode(self, children)
      }
    } else {
      if let parent = reference.parent {
        NodeUtils.removeView(parent, removed.view)
      }
      removed.parent = nil
    }
    return removed
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
    var result = node.view?.sizeThatFits(constraintSize)
    
    if let size = result {
      result?.width = size.width * CGFloat(NSCMason.scale)
      result?.height = size.height * CGFloat(NSCMason.scale)
    }
    
    
    node.cachedWidth = result?.width ?? 0
    node.cachedHeight = result?.height ?? 0
    
    return result ?? .zero
  }
  
  
}
