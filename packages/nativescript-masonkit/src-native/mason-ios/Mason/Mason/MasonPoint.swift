//
//  MasonPoint.swift
//  Mason
//
//  Created by Osei Fortune on 17/08/2025.
//


import Foundation


@objcMembers
@objc(MasonOverflowPointCompat)
public class MasonOverflowPointCompat: NSObject, Codable{
    public var x: Overflow
    public var y: Overflow
    
    init(_ x: Overflow, _ y: Overflow) {
        self.x = x
        self.y = y
    }
    
    func intoMasonPoints()-> MasonPoint<Overflow> {
      return MasonPoint(x, y)
    }
    
    public init(_ points: MasonPoint<Overflow>) {
        x = points.x
        y = points.y
    }
  
  public var cssValue: String {
      get {
        var ret = "(MasonPoint)("
        
        ret += "x: \(x.cssValue), "
        ret += "y: \(y.cssValue) "
        
        ret += ")"
        
        return ret
      }
  }
}

@objcMembers
@objc(MasonDimensionPointCompat)
public class MasonDimensionPointCompat: NSObject, Codable{
    public var x: MasonDimensionCompat
    public var y: MasonDimensionCompat
    
    init(_ x: MasonDimensionCompat, _ y: MasonDimensionCompat) {
        self.x = x
        self.y = y
    }
    
    func intoMasonPoints()-> MasonPoint<MasonDimension> {
        return MasonPoint(x.dimension, y.dimension)
    }
    
    public init(_ points: MasonPoint<MasonDimension>) {
        x = MasonDimensionCompat(value: points.x)
        y = MasonDimensionCompat(value: points.y)
    }
}


@objcMembers
@objc(MasonLengthPercentageAutoPointCompat)
public class MasonLengthPercentageAutoPointCompat: NSObject, Codable{
    public var x: MasonLengthPercentageAutoCompat
    public var y: MasonLengthPercentageAutoCompat
    
    init(_ x: MasonLengthPercentageAutoCompat, _ y: MasonLengthPercentageAutoCompat) {
        self.x = x
        self.y = y
    }
    
    func intoMasonPoints()-> MasonPoint<MasonLengthPercentageAuto> {
        return MasonPoint(x.length, y.length)
    }
    
    public init(_ points: MasonPoint<MasonLengthPercentageAuto>) {
        x = MasonLengthPercentageAutoCompat(value: points.x)
        y = MasonLengthPercentageAutoCompat(value: points.y)
    }
}

@objcMembers
@objc(MasonLengthPercentagePointCompat)
public class MasonLengthPercentagePointCompat: NSObject, Codable{
    public var x: MasonLengthPercentageCompat
    public var y: MasonLengthPercentageCompat
    
    init(_ x: MasonLengthPercentageCompat, _ y: MasonLengthPercentageCompat) {
        self.x = x
        self.y = y
    }
    
    func intoMasonPoints()-> MasonPoint<MasonLengthPercentage> {
      return MasonPoint(x.length, y.length)
    }
    
    public init(_ points: MasonPoint<MasonLengthPercentage>) {
        x = MasonLengthPercentageCompat(value: points.x)
        y = MasonLengthPercentageCompat(value: points.y)
    }
}

public struct MasonPoint<T: Codable>: Codable{
    var x: T
    var y: T
    
    internal var compatDimension: MasonDimensionPointCompat? = nil
    internal var compatLengthAuto: MasonLengthPercentageAutoPointCompat? = nil
    internal var compatLength: MasonLengthPercentagePointCompat? = nil
    internal var compatOverflow: MasonOverflowPointCompat? = nil
    
  public init(_ x: T, _ y: T) {
        self.x = x
        self.y = y
    }
    
    public init(uniform: T){
        self.x = uniform
        self.y = uniform
    }
    
    var cssValue: String {
        var ret = "(MasonPoint)("
        
        ret += "x: \(x), "
        ret += "y: \(y) "
        
        ret += ")"
        
        return ret
    }
}
