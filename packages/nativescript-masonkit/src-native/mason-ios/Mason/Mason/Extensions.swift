//
//  Extensions.swift
//  Mason
//
//  Created by Osei Fortune on 24/09/2025.
//

import UIKit

let BLACK_COLOR = UInt32(bitPattern:-16777216)
let WHITE_COLOR = UInt32(bitPattern:-1)

extension UIColor {
  internal static let deviceCS = CGColorSpaceCreateDeviceRGB()
  internal static let greyCS = CGColorSpaceCreateDeviceGray()
  public static func colorFromARGB(_ argb: UInt32) -> UIColor {
    switch(argb){
    case BLACK_COLOR:
      return .black
    case WHITE_COLOR:
      return .white
    case 0:
      return .clear
    default:
      let a = CGFloat((argb >> 24) & 0xFF) / 255.0
      let r = CGFloat((argb >> 16) & 0xFF) / 255.0
      let g = CGFloat((argb >> 8) & 0xFF) / 255.0
      let b = CGFloat(argb & 0xFF) / 255.0
      
      return UIColor(cgColor: CGColor(srgbRed: r, green: g, blue: b, alpha: a))
    }
    
  }
  
  public static func colorFromRGBA(_ rgba: UInt32) -> UIColor {
    let r = CGFloat((rgba >> 24) & 0xFF) / 255.0
    let g = CGFloat((rgba >> 16) & 0xFF) / 255.0
    let b = CGFloat((rgba >> 8) & 0xFF) / 255.0
    let a = CGFloat(rgba & 0xFF) / 255.0
    
    return UIColor(cgColor: CGColor(srgbRed: r, green: g, blue: b, alpha: a))
  }
  
  
  public func toUInt32() -> UInt32 {
    var r: CGFloat = 0
    var g: CGFloat = 0
    var b: CGFloat = 0
    var a: CGFloat = 0
    
    self.getRed(&r, green: &g, blue: &b, alpha: &a)
    
    let red = UInt8(r * 255)
    let green = UInt8(g * 255)
    let blue = UInt8(b * 255)
    let alpha = UInt8(a * 255)
    
    let argb = (UInt32(alpha) << 24) | (UInt32(red) << 16) | (UInt32(green) << 8) | UInt32(blue)
    return argb
  }
  
}


extension UIFont {
    /// Returns true if the font is italic or oblique
    var isItalicOrOblique: Bool {
        // Check symbolic traits
        if fontDescriptor.symbolicTraits.contains(.traitItalic) {
            return true
        }

        // As a fallback, check Core Text traits
        let ctFont = CTFontCreateWithName(self.fontName as CFString, self.pointSize, nil)
        let traitsDict = CTFontCopyTraits(ctFont) as? [CFString: Any]
        if let symbolicTraitsValue = traitsDict?[kCTFontSymbolicTrait] as? UInt32 {
          let symbolicTraits = CTFontSymbolicTraits(rawValue: symbolicTraitsValue)
            return symbolicTraits.contains(.traitItalic)
        }

        return false
    }
}


func markNodeDirty<T: MasonElement>(_ element: T) {
    element.markNodeDirty()
}

func isNodeDirty<T: MasonElement>(_ element: T) -> Bool {
    element.isNodeDirty()
}

func configure<T: MasonElement>(_ element: T, _ block: (MasonStyle) -> Void) {
    element.configure(block)
}

func layout<T: MasonElement>(_ element: T) -> MasonLayout {
   element.layout()
}

func compute<T: MasonElement>(_ element: T) {
    element.compute()
}

func compute<T: MasonElement>(_ element: T, width: Float, height: Float) {
  element.compute(width, height)
}

func computeMinContent<T: MasonElement>(_ element: T) {
    element.computeMinContent()
}

func computeMaxContent<T: MasonElement>(_ element: T) {
    element.computeMaxContent()
}

func computeWidthSize<T: MasonElement>(_ element: T, width: Float, height: Float) {
  element.computeWithSize(width, height)
}

func computeWithViewSize<T: MasonElement>(_ element: T) {
    element.computeWithViewSize()
}

func computeWithViewSize<T: MasonElement>(_ element: T, layout: Bool) {
    element.computeWithViewSize(layout: layout)
}

func computeWithMinContent<T: MasonElement>(_ element: T) {
    element.computeWithMinContent()
}

func computeWithMaxContent<T: MasonElement>(_ element: T) {
    element.computeWithMaxContent()
}

func attachAndApply<T: MasonElement>(_ element: T) {
    element.attachAndApply()
}

func requestLayout<T: MasonElement>(_ element: T) {
    element.requestLayout()
}

func append<T: MasonElement>(_ element: T, _ child: T) {
    element.append(child)
}

func append<T: MasonElement>(_ element: T, text: String) {
    element.append(text: text)
}

func append<T: MasonElement>(_ element: T, node: MasonNode) {
    element.append(node: node)
}

func append<T: MasonElement>(_ element: T, _ elements: [T]) {
    element.append(elements: elements)
}

func append<T: MasonElement>(_ element: T, texts: [String]) {
    element.append(texts: texts)
}

func append<T: MasonElement>(_ element: T, nodes: [MasonNode]) {
    element.append(nodes: nodes)
}

func prepend<T: MasonElement>(_ element: T, _ child: T) {
    element.prepend(child)
}

func prepend<T: MasonElement>(_ element: T, text: String) {
    element.prepend(string: text)
}

func prepend<T: MasonElement>(_ element: T, node: MasonNode) {
    element.prepend(node: node)
}

func prepend<T: MasonElement>(_ element: T, _ elements: [T]) {
    element.prepend(elements: elements)
}

func prepend<T: MasonElement>(_ element: T, texts: [String]) {
    element.prepend(strings: texts)
}

func prepend<T: MasonElement>(_ element: T, nodes: [MasonNode]) {
    element.prepend(nodes: nodes)
}


func addChildAt<T: MasonElement>(_ element: T, text: String, index: Int) {
    element.addChildAt(text: text, index)
}

func addChildAt<T: MasonElement>(_ element: T, child: MasonElement, index: Int) {
    element.addChildAt(element: child, index)
}

func addChildAt<T: MasonElement>(_ element: T, node: MasonNode, index: Int) {
    element.addChildAt(node: node, index)
}


func replaceChildAt<T: MasonElement>(_ element: T, text: String, index: Int) {
    element.replaceChildAt(text: text, index)
}

func replaceChildAt<T: MasonElement>(_ element: T, child: MasonElement, index: Int) {
    element.replaceChildAt(element: child, index)
}

func replaceChildAt<T: MasonElement>(_ element: T, node: MasonNode, index: Int) {
    element.replaceChildAt(node: node, index)
}


@objc extension NSObject {
  
  @objc public func mason_addView(_ view: UIView){
    guard let element = self as? MasonElement else { return }
    if(view.superview == element.uiView){
      return
    }
    if(view is MasonElement){
      element.append((view as! MasonElement))
    }else {
      element.append(node: element.node.mason.nodeForView(view))
    }
  }
  
  @objc public func mason_addView(_ view: UIView, at: Int){
    guard let element = self as? MasonElement else { return }
    if(view.superview == element.uiView){
      return
    }

    if(view is MasonElement){
      element.node.addChildAt((view as! MasonElement).node, at)
    }else {
      element.node.addChildAt(element.node.mason.nodeForView(view), at)
    }
  }
  
  
  @objc public func mason_markNodeDirty() {
    guard let element = self as? MasonElement else { return }
    markNodeDirty(element)
  }
  
 @objc public func mason_isNodeDirty() -> Bool {
    guard let element = self as? MasonElement else { return false }
    return isNodeDirty(element)
  }
  
 @objc public func mason_configure(_ block: (MasonStyle) -> Void) {
    guard let element = self as? MasonElement else { return }
    configure(element, block)
  }
  
  @discardableResult @objc public func mason_layout() -> MasonLayout {
    guard let element = self as? MasonElement else { return MasonLayout.zero}
    return layout(element)
  }
  
 @objc public func mason_compute(){
    guard let element = self as? MasonElement else { return }
    compute(element)
  }
  
 @objc public func mason_compute(width: Float, height: Float){
    guard let element = self as? MasonElement else { return }
    compute(element, width: width, height: height)
  }
  
 @objc public func mason_computeMaxContent() {
    guard let element = self as? MasonElement else { return }
    computeMaxContent(element)
  }
  
 @objc public func mason_computeMinContent() {
    guard let element = self as? MasonElement else { return }
    computeMinContent(element)
  }
  
 @objc public func mason_computeWithSize(_ width: Float, _ height: Float){
    guard let element = self as? MasonElement else { return }
    computeWidthSize(element, width: width, height: height)
  }
  
 @objc public func mason_computeWithViewSize() {
    guard let element = self as? MasonElement else { return }
    computeWithViewSize(element)
  }
  
 @objc public func mason_computeWithViewSize(layout: Bool) {
    guard let element = self as? MasonElement else { return }
    computeWithViewSize(element, layout: layout)
  }
  
 @objc public func mason_computeWithMaxContent(){
    guard let element = self as? MasonElement else { return }
    computeWithMaxContent(element)
  }
  
 @objc public func mason_computeWithMinContent(){
    guard let element = self as? MasonElement else { return }
    computeWithMinContent(element)
  }
  
 @objc public func mason_attachAndApply(){
    guard let element = self as? MasonElement else { return }
    attachAndApply(element)
  }
  
 @objc public func mason_requestLayout(){
    guard let element = self as? MasonElement else { return }
    requestLayout(element)
  }
  
 @objc public func mason_invalidateLayout(){
    guard let element = self as? MasonElement else { return }
    requestLayout(element)
  }
  
 @objc public func mason_append(_ element: MasonElementObjc){
    guard let parent = self as? MasonElement else { return }
    guard let element = element as? MasonElement else { return }
    parent.append(element)
  }
  
 @objc public func mason_append(text: String){
    guard let element = self as? MasonElement else { return }
    append(element, text: text)
  }
  
 @objc public func mason_append(node: MasonNode){
    guard let element = self as? MasonElement else { return }
    append(element, node: node)
  }
  
 @objc public func mason_append(texts: [String]){
    guard let parent = self as? MasonElement else { return }
    append(parent, texts: texts)
  }
  
 @objc public func mason_append(elements: [MasonElementObjc]){
    guard let parent = self as? MasonElement else { return }
   guard let elements = elements as? [MasonElement] else { return }
    parent.append(elements: elements)
  }
  
 @objc public func mason_append(nodes: [MasonNode]){
    guard let parent = self as? MasonElement else { return }
    append(parent, nodes: nodes)
  }
  
 @objc public func mason_prepend(_ element: MasonElementObjc){
    guard let parent = self as? MasonElement else { return }
    guard let element = element as? MasonElement else { return }
    parent.prepend(element)
  }
  
 @objc public func mason_prepend(text: String){
    guard let parent = self as? MasonElement else { return }
    prepend(parent, text: text)
  }
  
 @objc public func mason_prepend(node: MasonNode){
    guard let parent = self as? MasonElement else { return }
    prepend(parent, node: node)
  }
  
 @objc public func mason_prepend(texts: [String]){
    guard let parent = self as? MasonElement else { return }
    prepend(parent, texts: texts)
  }
  
 @objc public func mason_prepend(elements: [MasonElementObjc]){
    guard let parent = self as? MasonElement else { return }
   guard let elements = elements as? [MasonElement] else { return }
   parent.prepend(elements: elements)
  }
  
 @objc public func mason_prepend(nodes: [MasonNode]){
    guard let parent = self as? MasonElement else { return }
    prepend(parent, nodes: nodes)
  }
  
 @objc public func mason_addChildAt(text: String, _ index: Int){
    guard let parent = self as? MasonElement else { return }
    addChildAt(parent, text: text, index: index)
  }

 @objc public func mason_addChildAt(element: MasonElementObjc, _ index: Int){
    guard let parent = self as? MasonElement else { return }
    guard let element = element as? MasonElement else { return }
    parent.addChildAt(element: element, index)
  }

 @objc public func mason_addChildAt(node: MasonNode, _ index: Int){
    guard let parent = self as? MasonElement else { return }
    addChildAt(parent, node: node, index: index)
  }
  
  
  
  @objc public func mason_replaceChildAt(text: String, _ index: Int){
     guard let parent = self as? MasonElement else { return }
     replaceChildAt(parent, text: text, index: index)
   }

  @objc public func mason_replaceChildAt(element: MasonElementObjc, _ index: Int){
     guard let parent = self as? MasonElement else { return }
     guard let element = element as? MasonElement else { return }
     parent.replaceChildAt(element: element, index)
   }

  @objc public func mason_replaceChildAt(node: MasonNode, _ index: Int){
     guard let parent = self as? MasonElement else { return }
     replaceChildAt(parent, node: node, index: index)
   }
}
