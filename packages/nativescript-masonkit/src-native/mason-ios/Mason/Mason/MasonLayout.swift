//
//  MasonLayout.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation

@objc(MasonLayout)
@objcMembers
public class MasonLayout: NSObject {
    public let order: Int
    public let x: Float
    public let y: Float
    public let width: Float
    public let height: Float
    public let children: [MasonLayout]
    
    public override var description: String {
        var ret = "(MasonLayout)("
        
        ret += "order: \(order), "
        ret += "x: \(x), "
        ret += "y: \(y), "
        ret += "width: \(width), "
        ret += "height: \(height), "
        ret += "children: \(children.description)"
        
        ret += ")"
        
        return ret
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
        
        
        var children = Array<MasonLayout>()
        children.reserveCapacity(count)
        
        
        for _ in 0..<count {
            let child = fromFloatArray(args, offset)
            offset = child.0
            children.append(child.1)
        }
        
        return (offset, MasonLayout(Int(order), x, y, width, height, children))
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
        
        let childCount = Int(array.pointee)
        array = array.advanced(by: 1)
        
        var children = Array<MasonLayout>()
        children.reserveCapacity(childCount)
        
        
        for _ in 0..<childCount {
            let child = fromFloatPoint(array)
            array = child.0
            children.append(child.1)
        }
      
        return (array, MasonLayout(Int(order.rounded(.up)), x, y, width, height, children))
    }
}
