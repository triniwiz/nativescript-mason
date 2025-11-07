//
//  SwiftHelpers.swift
//  Mason
//
//  Created by Osei Fortune on 20/10/2025.
//

@objcMembers
@objc(MasonSwiftHelpers)
public class SwiftHelpers: NSObject {
  public static func markNodeDirty(_ element: MasonElementObjc) {
    guard let element = element as? MasonElement else {return}
    element.markNodeDirty()
  }
  
  public static func isNodeDirty(_ element : MasonElementObjc) -> Bool {
    guard let element = element as? MasonElement else {return false}
    return element.isNodeDirty()
  }
  
  public static func configure(_ element : MasonElementObjc, _ block: (MasonStyle) -> Void) {
    guard let element = element as? MasonElement else {return}
    element.configure(block)
  }
  
  @discardableResult public static func layout(_ element : MasonElementObjc) -> MasonLayout {
    guard let element = element as? MasonElement else {return .zero}
    return element.layout()
  }
  
  public static func compute(_ element : MasonElementObjc){
    guard let element = element as? MasonElement else {return}
    element.compute()
  }
  
  public static func compute(_ element : MasonElementObjc, _ width: Float, _ height: Float){
    guard let element = element as? MasonElement else {return}
    element.compute(width, height)
  }
  
  public static func computeMaxContent(_ element : MasonElementObjc){
    guard let element = element as? MasonElement else {return}
    element.computeMaxContent()
  }
  
  public static func computeMinContent(_ element : MasonElementObjc){
    guard let element = element as? MasonElement else {return}
    element.computeMinContent()
  }
  
  public static func computeWithSize(_ element : MasonElementObjc, _ width: Float, _ height: Float){
    print("SwiftHelpers: computeWithSize")
    guard let element = element as? MasonElement else {return}
    element.computeWithSize(width, height)
  }
  
  public static func computeWithViewSize(_ element : MasonElementObjc){
    guard let element = element as? MasonElement else {return}
    element.computeWithViewSize()
  }
  
  public static func computeWithViewSize(_ element : MasonElementObjc, layout: Bool) {
    guard let element = element as? MasonElement else {return}
    element.computeWithViewSize(layout: layout)
  }
  
  public static func computeWithMaxContent(_ element : MasonElementObjc){
    guard let element = element as? MasonElement else {return}
    element.computeWithMaxContent()
  }
  
  public static func computeWithMinContent(_ element : MasonElementObjc){
    guard let element = element as? MasonElement else {return}
    element.computeWithMinContent()
  }
  
  public static func attachAndApply(_ element : MasonElementObjc){
    guard let element = element as? MasonElement else {return}
    element.attachAndApply()
  }
  
  public static func requestLayout(_ element : MasonElementObjc){
    guard let element = element as? MasonElement else {return}
    element.requestLayout()
  }
  
  public static func append(_ parent : MasonElementObjc,_ element : MasonElementObjc){
    guard let parent = parent as? MasonElement else {return}
    guard let element = element as? MasonElement else {return}
    parent.append(element)
  }
  
  public static func append(_ parent : MasonElementObjc,text: String){
    guard let parent = parent as? MasonElement else {return}
    parent.append(text: text)
  }
  
  public static func append(_ parent : MasonElementObjc,node: MasonNode){
    guard let parent = parent as? MasonElement else {return}
    parent.append(node: node)
  }
  
  public static func append(_ parent : MasonElementObjc,texts: [String]){
    guard let parent = parent as? MasonElement else {return}
    parent.append(texts: texts)
  }
  
  public static func append(_ parent : MasonElementObjc,elements: [MasonElementObjc]){
    guard let parent = parent as? MasonElement else {return}
    guard let elements = elements as? [MasonElement] else {return}
    parent.append(elements: elements)
  }
  
  public static func append(_ parent : MasonElementObjc,nodes: [MasonNode]){
    guard let parent = parent as? MasonElement else {return}
    parent.append(nodes: nodes)
  }
  
  public static func prepend(_ parent : MasonElementObjc,_ element : MasonElementObjc){
    guard let parent = parent as? MasonElement else {return}
    guard let element = element as? MasonElement else {return}
    parent.prepend(element)
  }
  
  public static func prepend(_ parent : MasonElementObjc,string: String){
    guard let parent = parent as? MasonElement else {return}
    parent.prepend(string: string)
  }
  
  public static func prepend(_ parent : MasonElementObjc,node: MasonNode){
    guard let parent = parent as? MasonElement else {return}
    parent.prepend(node: node)
  }
  
  public static func prepend(_ parent : MasonElementObjc,strings: [String]){
    guard let parent = parent as? MasonElement else {return}
    parent.prepend(strings: strings)
  }
  
  public static func prepend(_ parent : MasonElementObjc,elements: [MasonElementObjc]){
    guard let parent = parent as? MasonElement else {return}
    guard let elements = elements as? [MasonElement] else {return}
    parent.prepend(elements: elements)
  }
  
  public static func prepend(_ parent : MasonElementObjc,nodes: [MasonNode]){
    guard let parent = parent as? MasonElement else {return}
    parent.prepend(nodes: nodes)
  }
  
  public static func addChildAt(_ parent : MasonElementObjc,text: String, _ index: Int){
    guard let parent = parent as? MasonElement else {return}
    parent.addChildAt(text: text, index)
  }

  public static func addChildAt(_ parent : MasonElementObjc,element : MasonElementObjc, _ index: Int){
    guard let parent = parent as? MasonElement else {return}
    guard let element = element as? MasonElement else {return}
    parent.addChildAt(element: element, index)
  }

  public static func addChildAt(_ parent : MasonElementObjc,node: MasonNode, _ index: Int){
    guard let parent = parent as? MasonElement else {return}
    parent.addChildAt(node: node, index)
  }
}
