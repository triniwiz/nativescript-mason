//
//  MasonSize.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

@objcMembers
@objc(MasonDimensionSizeCompat)
public class MasonDimensionSizeCompat: NSObject{
    public var width: MasonDimensionCompat
    public var height: MasonDimensionCompat
    
    init(_ width: MasonDimensionCompat, _ height: MasonDimensionCompat) {
        self.width = width
        self.height = height
    }
    
    func intoMasonSize()-> MasonSize<MasonDimension> {
        return MasonSize(width.dimension, height.dimension)
    }
    
    public init(_ size: MasonSize<MasonDimension>) {
        width = MasonDimensionCompat(value: size.width)
        height = MasonDimensionCompat(value: size.height)
    }
}

@objcMembers
@objc(MasonLengthPercentageAutoSizeCompat)
public class MasonLengthPercentageAutoSizeCompat: NSObject{
    public var width: MasonLengthPercentageAutoCompat
    public var height: MasonLengthPercentageAutoCompat
    
    init(_ width: MasonLengthPercentageAutoCompat, _ height: MasonLengthPercentageAutoCompat) {
        self.width = width
        self.height = height
    }
    
    func intoMasonSize()-> MasonSize<MasonLengthPercentageAuto> {
        return MasonSize(width.length, height.length)
    }
    
    public init(_ size: MasonSize<MasonLengthPercentageAuto>) {
        width = MasonLengthPercentageAutoCompat(value: size.width)
        height = MasonLengthPercentageAutoCompat(value: size.height)
    }
}


@objcMembers
@objc(MasonLengthPercentageSizeCompat)
public class MasonLengthPercentageSizeCompat: NSObject{
    public var width: MasonLengthPercentageCompat
    public var height: MasonLengthPercentageCompat
    
    init(_ width: MasonLengthPercentageCompat, _ height: MasonLengthPercentageCompat) {
        self.width = width
        self.height = height
    }
    
    func intoMasonSize()-> MasonSize<MasonLengthPercentage> {
        return MasonSize(width.length, height.length)
    }
    
    public init(_ size: MasonSize<MasonLengthPercentage>) {
        width = MasonLengthPercentageCompat(value: size.width)
        height = MasonLengthPercentageCompat(value: size.height)
    }
}


public struct MasonSize<T>{
    var width: T
    var height: T
    
    internal var compatDimension: MasonDimensionSizeCompat? = nil
    internal var compatLengthAuto: MasonLengthPercentageAutoSizeCompat? = nil
    internal var compatLength: MasonLengthPercentageSizeCompat? = nil
    
    public init(_ width: T, _ height: T) {
        self.width = width
        self.height = height
    }
    
    public init(uniform: T){
        self.width = uniform
        self.height = uniform
    }
    
    var cssValue: String {
        var ret = "(MasonSize)("
        
        ret += "width: \(width), "
        ret += "height: \(height) "
        
        ret += ")"
        
        return ret
    }
}

public let MasonDimensionSizeAuto = MasonSize<MasonDimension>(uniform: .Auto)

public let MasonLengthPercentageAutoSizeAuto = MasonSize<MasonLengthPercentageAuto>(uniform: .Auto)

public let MasonDimensionSizeMaxPercentWH = MasonSize<MasonDimension>(uniform: .Percent(1))

public let MasonLengthPercentageAutoSizeMaxPercentWH = MasonSize<MasonLengthPercentageAuto>(uniform: .Percent(1))

public let MasonLengthPercentageSizeMaxPercentWH = MasonSize<MasonLengthPercentage>(uniform: .Percent(1))

public let MasonDimensionSizeZero = MasonSize<MasonDimension>(uniform: .Points(0))

public let MasonLengthPercentageAutoSizeZero = MasonSize<MasonLengthPercentageAuto>(uniform: .Points(0))

public let MasonLengthPercentageSizeZero = MasonSize<MasonLengthPercentage>(uniform: .Points(0))
