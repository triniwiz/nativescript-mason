//
//  MeasureOutput.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation

@objcMembers
@objc(MeasureOutput)
public class MeasureOutput: NSObject {
    
    @nonobjc static func make(width: CGFloat, height: CGFloat) -> Int64 {
        return make(Float(width), Float(height))
    }
    
    static func make(_ width: Float, _ height: Float) -> Int64 {
        let wBits = width.bitPattern
        let hBits = height.bitPattern
        
        return Int64(bitPattern: UInt64(wBits)) << 32  | Int64(bitPattern: UInt64(hBits))
    }
    
    static func make(width: Int, height: Int) -> Int64 {
        return MeasureOutput.make(Float(width), Float(height))
    }
    
    static func getWidth(_ measureOutput: Int64) -> Float {
        return Float(bitPattern: UInt32(0xFFFFFFFF & (measureOutput  >> 32)))
    }
    
    static  func getHeight(_ measureOutput: Int64) -> Float {
        return Float(bitPattern: UInt32(0xFFFFFFFF & measureOutput))
    }
}
