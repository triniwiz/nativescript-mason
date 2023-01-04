//
//  MasonRect.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

@objcMembers
@objc(MasonDimensionRectCompat)
public class MasonDimensionRectCompat: NSObject {
    public var left: MasonDimensionCompat
    public var right: MasonDimensionCompat
    public var top: MasonDimensionCompat
    public var bottom: MasonDimensionCompat
    
    public init(_ left: MasonDimensionCompat, _ right: MasonDimensionCompat, _ top: MasonDimensionCompat, _ bottom: MasonDimensionCompat) {
        self.left = left
        self.right = right
        self.top = top
        self.bottom = bottom
    }
    
    public init(_ rect: MasonRect<MasonDimension>) {
        left = MasonDimensionCompat(value: rect.left)
        right = MasonDimensionCompat(value: rect.right)
        top = MasonDimensionCompat(value: rect.top)
        bottom = MasonDimensionCompat(value: rect.bottom)
    }
    
    func intoMasonRect()-> MasonRect<MasonDimension> {
        return MasonRect(left.dimension, right.dimension, top.dimension, bottom.dimension)
    }
}

@objcMembers
@objc(MasonLengthPercentageAutoRectCompat)
public class MasonLengthPercentageAutoRectCompat: NSObject {
    public var left: MasonLengthPercentageAutoCompat
    public var right: MasonLengthPercentageAutoCompat
    public var top: MasonLengthPercentageAutoCompat
    public var bottom: MasonLengthPercentageAutoCompat
    
    public init(_ left: MasonLengthPercentageAutoCompat, _ right: MasonLengthPercentageAutoCompat, _ top: MasonLengthPercentageAutoCompat, _ bottom: MasonLengthPercentageAutoCompat) {
        self.left = left
        self.right = right
        self.top = top
        self.bottom = bottom
    }
    
    public init(_ rect: MasonRect<MasonLengthPercentageAuto>) {
        left = MasonLengthPercentageAutoCompat(value: rect.left)
        right = MasonLengthPercentageAutoCompat(value: rect.right)
        top = MasonLengthPercentageAutoCompat(value: rect.top)
        bottom = MasonLengthPercentageAutoCompat(value: rect.bottom)
    }
    
    func intoMasonRect()-> MasonRect<MasonLengthPercentageAuto> {
        return MasonRect(left.length, right.length, top.length, bottom.length)
    }
}

@objcMembers
@objc(MasonLengthPercentageRectCompat)
public class MasonLengthPercentageRectCompat: NSObject {
    public var left: MasonLengthPercentageCompat
    public var right: MasonLengthPercentageCompat
    public var top: MasonLengthPercentageCompat
    public var bottom: MasonLengthPercentageCompat
    
    public init(_ left: MasonLengthPercentageCompat, _ right: MasonLengthPercentageCompat, _ top: MasonLengthPercentageCompat, _ bottom: MasonLengthPercentageCompat) {
        self.left = left
        self.right = right
        self.top = top
        self.bottom = bottom
    }
    
    public init(_ rect: MasonRect<MasonLengthPercentage>) {
        left = MasonLengthPercentageCompat(value: rect.left)
        right = MasonLengthPercentageCompat(value: rect.right)
        top = MasonLengthPercentageCompat(value: rect.top)
        bottom = MasonLengthPercentageCompat(value: rect.bottom)
    }
    
    func intoMasonRect()-> MasonRect<MasonLengthPercentage> {
        return MasonRect(left.length, right.length, top.length, bottom.length)
    }
}


public struct MasonRect<T> {
    var left: T
    var right: T
    var top: T
    var bottom: T
    
    internal var compatDimension: MasonDimensionRectCompat? = nil
    internal var compatLengthAuto: MasonLengthPercentageAutoRectCompat? = nil
    internal var compatLength: MasonLengthPercentageRectCompat? = nil
    
    public init(_ left: T, _ right: T, _ top: T, _ bottom: T) {
        self.left = left
        self.right = right
        self.top = top
        self.bottom = bottom
    }
    
    public init(uniform: T){
        self.left = uniform
        self.right = uniform
        self.top = uniform
        self.bottom = uniform
    }
    
    
    var cssValue: String {
        var ret = "(MasonRect)("
        
        ret += "left: \(left), "
        ret += "right: \(right), "
        ret += "top: \(top), "
        ret += "bottom: \(bottom) "
        
        ret += ")"
        
        return ret
    }
}

public let MasonDimensionRectAuto = MasonRect<MasonDimension>(uniform: .Auto)

public let MasonLengthPercentageAutoRectAuto = MasonRect<MasonLengthPercentageAuto>(uniform: .Auto)

public let MasonDimensionRectMaxPercentWH = MasonRect<MasonDimension>(uniform: .Percent(1))

public let MasonLengthPercentageAutoRectMaxPercentWH = MasonRect<MasonLengthPercentageAuto>(uniform: .Percent(1))

public let MasonLengthPercentageRectMaxPercentWH = MasonRect<MasonLengthPercentage>(uniform: .Percent(1))

public let MasonDimensionRectZero = MasonRect<MasonDimension>(uniform: .Points(0))

public let MasonLengthPercentageAutoRectZero = MasonRect<MasonLengthPercentageAuto>(uniform: .Points(0))

public let MasonLengthPercentageRectZero = MasonRect<MasonLengthPercentage>(uniform: .Points(0))
