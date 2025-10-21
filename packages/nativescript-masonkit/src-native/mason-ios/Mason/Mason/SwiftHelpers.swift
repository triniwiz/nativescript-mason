//
//  SwiftHelpers.swift
//  Mason
//
//  Created by Osei Fortune on 20/10/2025.
//

@objcMembers
@objc(MasonSwiftHelpers)
public class SwiftHelpers: NSObject {
  public static func markNodeDirty(_ element: MasonElement) {
    element.markNodeDirty?()
  }
  
  public static func isNodeDirty(_ element: MasonElement) -> Bool {
    return element.isNodeDirty?() ?? false
  }
  
  public static func configure(_ element: MasonElement, _ block: (MasonStyle) -> Void) {
    element.configure?(block)
  }
  
  @discardableResult public static func layout(_ element: MasonElement) -> MasonLayout {
    return element.layout?() ?? MasonLayout.zero
  }
  
  public static func compute(_ element: MasonElement){
    element.compute?()
  }
  
  public static func compute(_ element: MasonElement, _ width: Float, _ height: Float){
    element.compute?(width, height)
  }
  
  public static func computeMaxContent(_ element: MasonElement){
    element.computeMaxContent?()
  }
  
  public static func computeMinContent(_ element: MasonElement){
    element.computeMinContent?()
  }
  
  public static func computeWithSize(_ element: MasonElement, _ width: Float, _ height: Float){
    element.computeWithSize?(width, height)
  }
  
  public static func computeWithViewSize(_ element: MasonElement){
    element.computeWithViewSize?()
  }
  
  public static func computeWithViewSize(_ element: MasonElement, layout: Bool) {
    element.computeWithViewSize?(layout: layout)
  }
  
  public static func computeWithMaxContent(_ element: MasonElement){
    element.computeWithMaxContent?()
  }
  
  public static func computeWithMinContent(_ element: MasonElement){
    element.computeWithMinContent?()
  }
  
  public static func attachAndApply(_ element: MasonElement){
    element.attachAndApply?()
  }
  
  public static func requestLayout(_ element: MasonElement){
    element.requestLayout?()
  }
  
  public static func append(_ parent: MasonElement,_ element: MasonElement){
    parent.append?(element)
  }
  
  public static func append(_ parent: MasonElement,text: String){
    parent.append?(text: text)
  }
  
  public static func append(_ parent: MasonElement,node: MasonNode){
    parent.append?(node: node)
  }
  
  public static func append(_ parent: MasonElement,texts: [String]){
    parent.append?(texts: texts)
  }
  
  public static func append(_ parent: MasonElement,elements: [MasonElement]){
    parent.append?(elements: elements)
  }
  
  public static func append(_ parent: MasonElement,nodes: [MasonNode]){
    parent.append?(nodes: nodes)
  }
  
  public static func prepend(_ parent: MasonElement,_ element: MasonElement){
    parent.prepend?(element)
  }
  
  public static func prepend(_ parent: MasonElement,string: String){
    parent.prepend?(string: string)
  }
  
  public static func prepend(_ parent: MasonElement,node: MasonNode){
    parent.prepend?(node: node)
  }
  
  public static func prepend(_ parent: MasonElement,strings: [String]){
    parent.prepend?(strings: strings)
  }
  
  public static func prepend(_ parent: MasonElement,elements: [MasonElement]){
    parent.prepend?(elements: elements)
  }
  
  public static func prepend(_ parent: MasonElement,nodes: [MasonNode]){
    parent.prepend?(nodes: nodes)
  }
  
  public static func addChildAt(_ parent: MasonElement,text: String, _ index: Int){
    parent.addChildAt?(text: text, index)
  }

  public static func addChildAt(_ parent: MasonElement,element: MasonElement, _ index: Int){
    parent.addChildAt?(element: element, index)
  }

  public static func addChildAt(_ parent: MasonElement,node: MasonNode, _ index: Int){
    parent.addChildAt?(node: node, index)
  }
}
