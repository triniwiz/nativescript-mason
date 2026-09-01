//
//  Mason.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit
import FontManager

@objc(NSCMason)
@objcMembers
public class NSCMason: NSObject {
  public internal(set) var nativePtr: OpaquePointer?
  internal var nodes: [Int64: MasonNode] = [:]
  internal var viewNodes: [UIView: MasonNode] = [:]
  
  public static var shared = NSCMason()
  
  // Use NSMapTable with weak keys to avoid retaining nodes that have been removed
  private var nodeEventListeners: [MasonNode: [String: [UUID: (MasonEvent) -> Void]]] = [:]

  
  public override init() {
    nativePtr = mason_init()
    // Set the device scale up front so CSS strings parsed natively in Rust
    // (e.g. grid-template `px` tracks) resolve to points, not raw device pixels.
    mason_set_device_scale(nativePtr, NSCMason.scale)
    if let ptr = mason_get_buffer(nativePtr, 0) {
      let buffer = Unmanaged<NSMutableData>.fromOpaque(ptr).takeRetainedValue()
      let instance = NSCFontFaceSet.instance()
      instance.load("16px serif", text: nil) { fonts, error in
        if(error != nil){
          guard let font = fonts.first else {return}
          
            guard let font = font.uiFont else {return}
            
            let scale = NSCMason.scale
            let ascent = Float(font.ascender) * scale
            let descent = Float(-font.descender) * scale  // Make it positive
            let xHeight = Float(font.xHeight) * scale
            let capHeight = Float(font.capHeight) * scale
            let leading = Float(font.leading) * scale
            
            MasonStyle.setFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, ascent, buffer)
            MasonStyle.setFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, descent, buffer)
            MasonStyle.setFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, xHeight, buffer)
            MasonStyle.setFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, leading, buffer)
            MasonStyle.setFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, capHeight, buffer)
        }
      }
      
    }
  }
  
  deinit {
    mason_release(nativePtr)
  }
  
  public func setDeviceScale(_ value: Float) {
    mason_set_device_scale(nativePtr, value)
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
  
  public func styleForViewOrNode(_ viewOrNode: Any?) -> MasonStyle? {
    if let view = viewOrNode as? UIView {
      return styleForView(view)
    }
    return (viewOrNode as? MasonNode)?.style
  }
  
  @discardableResult public func layoutForView(_ view: UIView) -> MasonLayout {
    let node = nodeForView(view, view.subviews.isEmpty)
    let points = mason_node_layout(node.mason.nativePtr,
                                   node.nativePtr, create_layout)
    
    guard let points = points else {
      return MasonLayout.empty
    }
    
    let layout: MasonLayout = Unmanaged.fromOpaque(points).takeRetainedValue()
    return layout
  }
  
  @discardableResult
  public func addEventListener(_ node: MasonNode, _ event: String, _ listener: @escaping (MasonEvent) -> Void) -> UUID {
      var dict = nodeEventListeners[node] ?? [:]
      var listeners = dict[event] ?? [:]

      let id = UUID() // unique key for this closure
      listeners[id] = listener

      dict[event] = listeners
      nodeEventListeners[node] = dict

      return id
  }

  
  @discardableResult
  public func removeEventListener(_ node: MasonNode, _ event: String, id: UUID) -> Bool {
      guard var dict = nodeEventListeners[node], var listeners = dict[event] else { return false }
      listeners[id] = nil
      if listeners.isEmpty {
          dict[event] = nil
      } else {
          dict[event] = listeners
      }
      nodeEventListeners[node] = dict
      return true
  }
  
  @discardableResult
  public func removeEventListener(_ node: MasonNode, _ event: String) -> Bool {
      guard var dict = nodeEventListeners[node] else { return false }
      dict[event] = nil
      nodeEventListeners[node] = dict
      return true
  }
  

  public func dispatch(_ event: MasonEvent, _ node: MasonNode) {
      if let listeners = nodeEventListeners[node]?[event.type] {
          for listener in listeners.values {
              listener(event)
          }
      }
  }

  internal func removeAllEventListeners(_ node: MasonNode) {
    nodeEventListeners.removeValue(forKey: node)
  }

  
  public lazy var htmlParser = {
    HTMLParser(mason: self)
  }()
  
  
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
    return Scroll(mason: self)
  }
  
  public func createButton()-> Button {
    return Button(mason: self)
  }
  
  public func createNode() -> MasonNode {
    return MasonNode(mason: self)
  }
  
  public func createNode(measure: @escaping MasonNode.MeasureFunc) -> MasonNode{
    return MasonNode(mason: self, measureFunc: measure)
  }
  
  public func createBr() -> MasonBr {
    return MasonBr(mason: self)
  }
  
  public func createInput(_ type: MasonInputType = .Text) -> MasonInput {
    return MasonInput(mason: self, type: type)
  }
  
  public func printTree(_ node: MasonNode){
    mason_print_tree(nativePtr, node.nativePtr)
  }
  
  public func createTextNode() -> MasonNode{
    return MasonNode(textNode: self)
  }
  
  internal func createTextNode(isAnonymous: Bool = false) -> MasonNode{
    let node =  MasonNode(textNode: self, isAnonymous)
    return node
  }
  
  public func createImageNode() -> MasonNode {
    return MasonNode(masonImage: self)
  }

  public func createButtonNode() -> MasonNode {
    return MasonNode(masonButton: self)
  }
  
  public func createLineBreakNode() -> MasonNode {
    return MasonNode(masonLineBreak: self)
  }
  
  
  public func createListView(isOrdered: Bool = false)-> MasonList {
    let list = MasonList(mason: self)
    list.isOrdered = isOrdered
    return list
  }

  public func createListItemNode(measure: @escaping MasonNode.MeasureFunc) -> MasonNode {
    return MasonNode(listItem: self, measureFunc: measure)
  }
  
  public func createListItemNode() -> MasonNode {
    return MasonNode(listItem: self)
  }

  public func createListItem() -> MasonLi {
    return MasonLi(mason: self)
  }
  
  public func createTextArea() -> MasonTextArea {
    return MasonTextArea(mason: self)
  }

  @objc public var preflight: Bool {
    get { mason_get_preflight() }
    set { mason_set_preflight(nativePtr, newValue) }
  }

  /**
   * The context CSS relative units resolve against, mirroring the TS side's
   * `units.ts` and Android's `Mason.shared`. `rem` needs a root font size (the
   * CSS default is 16); the viewport is read from the key window, and is 0 until
   * one exists — an unresolvable viewport unit collapses to 0 rather than
   * silently becoming a bare number in the wrong unit.
   */
  @objc public static var rootFontSize: Float = 16

  @objc public static var viewportSize: CGSize {
    get {
      for scene in UIApplication.shared.connectedScenes {
        guard let windowScene = scene as? UIWindowScene else { continue }
        for window in windowScene.windows where window.isKeyWindow {
          return window.bounds.size
        }
      }
      return .zero
    }
  }

  @objc public static var scale: Float {
    get {
      for scene in UIApplication.shared.connectedScenes {
             guard let windowScene = scene as? UIWindowScene else { continue }

             for window in windowScene.windows where window.isKeyWindow {
                 return Float(window.traitCollection.displayScale)
             }
         }

         #if os(visionOS)
         return 1.0
         #else
         return Float(UIScreen.main.scale)
         #endif
    }
  }
}
