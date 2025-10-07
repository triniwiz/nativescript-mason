//
//  MasonLayout.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation

@objc(MasonLayout)
@objcMembers
public class MasonLayout: NSObject, Codable {
  public let order: Int
  public let x: Float
  public let y: Float
  public let width: Float
  public let height: Float
  public internal(set) var border: MasonRect<Float> = .init(0, 0, 0, 0)
  public internal(set) var margin: MasonRect<Float> = .init(0, 0, 0, 0)
  public internal(set) var padding: MasonRect<Float> = .init(0, 0, 0, 0)
  public internal(set) var contentSize: MasonSize<Float> = .init(0, 0)
  public internal(set) var scrollbarSize: MasonSize<Float> = .init(0, 0)
  public let children: [MasonLayout]
  public static let zero = MasonLayout()
  
  public override var description: String {
    do {
      let encoder = JSONEncoder()
      encoder.outputFormatting = [.prettyPrinted]
      
      encoder.nonConformingFloatEncodingStrategy = .convertToString(positiveInfinity: "-Infinity", negativeInfinity: "Infinity", nan: "NaN")
      
      let jsonData = try encoder.encode(self)
      return String(data: jsonData, encoding: .utf8) ?? ""
    } catch {
      return "json serialization error: \(error)"
    }
  }
  
  internal override init() {
    self.order = 0
    self.x = 0
    self.y = 0
    self.width = 0
    self.height = 0
    self.children = []
  }
  
  internal init(_ order: Int, _ x: Float, _ y: Float,_ width: Float,_ height: Float,_ children: Array<MasonLayout>) {
    self.order = order
    self.x = x
    self.y = y
    self.width = width
    self.height = height
    self.children = children
  }
  
  internal static func fromFloatArray(_ args: [Float], _ offset: Int) -> (Int, MasonLayout) {
    var offset = offset
    
    let order = args[offset]
    offset += 1
    
    let x = args[offset]
    offset += 1
    
    let y = args[offset]
    offset += 1
    
    let width = args[offset]
    offset += 1
    
    let height = args[offset]
    offset += 1
    
    let count = Int(args[offset])
    offset += 1
    
    var border = MasonRect<Float>(uniform: 0)
    
    border.left = args[offset]
    offset += 1
    border.right = args[offset]
    offset += 1
    border.top = args[offset]
    offset += 1
    border.bottom = args[offset]
    offset += 1
    
    var margin = MasonRect<Float>(uniform: 0)
    
    margin.left = args[offset]
    offset += 1
    margin.right = args[offset]
    offset += 1
    margin.top = args[offset]
    offset += 1
    margin.bottom = args[offset]
    offset += 1
    
    
    var padding = MasonRect<Float>(uniform: 0)
    
    padding.left = args[offset]
    offset += 1
    padding.right = args[offset]
    offset += 1
    padding.top = args[offset]
    offset += 1
    padding.bottom = args[offset]
    offset += 1
    
    var contentSize = MasonSize<Float>(uniform: 0)
    
    contentSize.width = args[offset]
    offset += 1
    contentSize.height = args[offset]
    offset += 1
    
    var scrollbarSize = MasonSize<Float>(uniform: 0)
    
    scrollbarSize.width = args[offset]
    offset += 1
    scrollbarSize.height = args[offset]
    offset += 1
    
    
    var children = Array<MasonLayout>()
    children.reserveCapacity(count)
    
    
    for _ in 0..<count {
      let child = fromFloatArray(args, offset)
      offset = child.0
      children.append(child.1)
    }
    
    let layout = MasonLayout(Int(order), x, y, width, height, children)
    layout.border = border
    layout.margin = margin
    layout.padding = padding
    layout.contentSize = contentSize
    layout.scrollbarSize = scrollbarSize
    
    return (offset, layout)
  }
  
  
  internal static func fromFloatPoint(args: UnsafeMutablePointer<Float>) -> (UnsafePointer<Float>, MasonLayout) {
    return MasonLayout.fromFloatPoint(UnsafePointer(args))
  }
  
  internal static func fromFloatPoint(_ args: UnsafePointer<Float>) -> (UnsafePointer<Float>, MasonLayout) {
    var array = args
    
    let order = array.pointee
    array = array.advanced(by: 1)
    
    let x = array.pointee
    array = array.advanced(by: 1)
    
    let y = array.pointee
    array = array.advanced(by: 1)
    
    let width = array.pointee
    array = array.advanced(by: 1)
    
    let height = array.pointee
    array = array.advanced(by: 1)
    
    
    
    var border = MasonRect<Float>(uniform: 0)
    
    border.left = array.pointee
    array = array.advanced(by: 1)
    border.right = array.pointee
    array = array.advanced(by: 1)
    border.top = array.pointee
    array = array.advanced(by: 1)
    border.bottom = array.pointee
    array = array.advanced(by: 1)
    
    var margin = MasonRect<Float>(uniform: 0)
    
    margin.left = array.pointee
    array = array.advanced(by: 1)
    margin.right = array.pointee
    array = array.advanced(by: 1)
    margin.top = array.pointee
    array = array.advanced(by: 1)
    margin.bottom = array.pointee
    array = array.advanced(by: 1)
    
    
    var padding = MasonRect<Float>(uniform: 0)
    
    padding.left = array.pointee
    array = array.advanced(by: 1)
    padding.right = array.pointee
    array = array.advanced(by: 1)
    padding.top = array.pointee
    array = array.advanced(by: 1)
    padding.bottom = array.pointee
    array = array.advanced(by: 1)
    
    var contentSize = MasonSize<Float>(uniform: 0)
    
    contentSize.width = array.pointee
    array = array.advanced(by: 1)
    contentSize.height = array.pointee
    array = array.advanced(by: 1)
    
    var scrollbarSize = MasonSize<Float>(uniform: 0)
    
    scrollbarSize.width = array.pointee
    array = array.advanced(by: 1)
    scrollbarSize.height = array.pointee
    array = array.advanced(by: 1)
    
    
    let childCount = Int(array.pointee)
    array = array.advanced(by: 1)
    
    
    var children = Array<MasonLayout>()
    children.reserveCapacity(childCount)
    
    
    for _ in 0..<childCount {
      let child = fromFloatPoint(array)
      array = child.0
      children.append(child.1)
    }
    
    let layout =  MasonLayout(Int(order.rounded(.up)), x, y, width, height, children)
    
    layout.border = border
    layout.margin = margin
    layout.padding = padding
    layout.contentSize = contentSize
    layout.scrollbarSize = scrollbarSize
    
    return (array, layout)
  }
}
