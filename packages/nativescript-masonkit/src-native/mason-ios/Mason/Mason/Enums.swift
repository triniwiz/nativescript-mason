//
//  Enums.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit

@objcMembers
@objc(MasonRectCompat)
public class MasonRectCompat: NSObject {
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


public struct MasonRect<T> {
    var left: T
    var right: T
    var top: T
    var bottom: T
    internal var compat: MasonRectCompat? = nil
    
    public init(_ left: T, _ right: T, _ top: T, _ bottom: T) {
        self.left = left
        self.right = right
        self.top = top
        self.bottom = bottom
    }
    
    var cssValue: String {
        var ret = "(MasonRect)("
        
        ret += "left: \(left), "
        ret += "right: \(right), "
        ret += "top: \(top), "
        ret += "top: \(top) "
        
        ret += ")"
        
        return ret
    }
}

@objcMembers
@objc(MasonSizeCompat)
public class MasonSizeCompat: NSObject{
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


public struct MasonSize<T>{
    var width: T
    var height: T
    
    internal var compat: MasonSizeCompat? = nil
    
    public init(_ width: T, _ height: T) {
        self.width = width
        self.height = height
    }
    
    var cssValue: String {
        var ret = "(MasonSize)("
        
        ret += "width: \(width), "
        ret += "height: \(height) "
        
        ret += ")"
        
        return ret
    }
}

public let MasonSizeMaxPercentWH = MasonSize<MasonDimension>(MasonDimension.Percent(100), MasonDimension.Percent(100))


@objc(MasonDimensionCompatType)
public enum MasonDimensionCompatType: Int, RawRepresentable {
    case Points
    case Percent
    case Auto
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Points:
            return 0
        case .Percent:
            return 1
        case .Auto:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Points
        case 1:
            self = .Percent
        case 2:
            self = .Auto
        default:
            return nil
        }
    }
}

@objcMembers
@objc(MasonDimensionCompat)
public class MasonDimensionCompat: NSObject {
    internal let dimension: MasonDimension
    internal let dimensionType: MasonDimensionCompatType
    public init(points: Float) {
        dimension = .Points(points)
        dimensionType = .Points
    }
    
    public init(percent: Float) {
        dimension = .Percent(percent)
        dimensionType = .Percent
    }
    
    internal init(value: MasonDimension) {
        dimension = value
        switch(value){
        case .Points(_):
            dimensionType = .Points
        case .Percent(_):
            dimensionType = .Percent
        case .Auto:
            dimensionType = .Auto
        }
    }
    
    public var type: MasonDimensionCompatType {
        get {
            return dimensionType
        }
    }
    
    public var value: Float {
        get {
            switch(dimension){
            case .Points(let points):
                return points
            case .Percent(let percent):
                return percent
            case .Auto:
                return 0
            }
        }
    }
    
    public var cssValue: String {
        get {
            return dimension.cssValue
        }
    }
    
    
    public var jsonValue: String? {
        return dimension.jsonValue
    }
    
    public static let Auto = MasonDimensionCompat(value: .Auto)
    
    public static let Zero = MasonDimensionCompat(value: .Points(0))
}

private let encoder = JSONEncoder()

public func MasonDimensionFromPoints(value: Float) -> MasonDimension {
    return .Points(value)
}

public func MasonDimensionFromPercent(value: Float) -> MasonDimension {
    return .Percent(value)
}

public let MasonDimensionAuto = MasonDimension.Auto


public enum MasonDimension: Codable {
    case Points(Float)
    case Percent(Float)
    case Auto
    
    internal var type: Int32 {
        get {
            switch (self) {
            case .Points: return 0
            case .Percent: return 1
            case .Auto: return 2
            }
        }
    }

    internal var value: Float {
        get {

            switch (self) {
            case .Points(let points): return points
            case .Percent(let percent): return percent
            case .Auto: return 0
            }
        }
    }
    
    
    public var cssValue: String {
        get {
            switch(self){
            case .Points(let points):
                return "\(points)px"
            case .Percent(let percent):
                return "\(percent)%"
            case .Auto:
                return "auto"
            }
        }
    }
    
    public var jsonValue: String? {
        do {
            return try String(data: encoder.encode(self), encoding: .utf8)
        }catch {return nil}
    }
    
    
    public init(from decoder: Decoder) throws {
        do {
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            switch(value){
            case "auto":
                self = .Auto
                break
                break
            default:
                // throw invaild ??

                break
            }
        }catch {
            // should be an object
            
            let values = try decoder.container(keyedBy: CodingKeys.self)
            let value = try values.decode(Float.self, forKey: .value)
            let type = try values.decode(String.self, forKey: .unit)
            
            switch(type){
            case "px":
                self = .Points(value)
                break
            case "dip":
                self = .Points(value * Float(UIScreen.main.scale))
                break
            case "%", "percent":
                self = .Percent(value * 100)
                break
                
            default:
                // throw ???

                break
            }
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        switch(self){
        case .Points:
            var container = encoder.container(keyedBy: CodingKeys.self)
            try container.encode(value, forKey: .value)
            try container.encode("px", forKey: .unit)
        case .Percent:
            var container = encoder.container(keyedBy: CodingKeys.self)
            try container.encode(value / 100, forKey: .value)
            try container.encode("%", forKey: .unit)
        case .Auto:
            var container = encoder.singleValueContainer()
            try container.encode("auto")
            break
        }
    }
    
    enum CodingKeys: String, CodingKey {
           case value
           case unit
    }
}


@objc(AlignItems)
public enum AlignItems: Int, RawRepresentable {
    case FlexStart
    case FlexEnd
    case Center
    case Baseline
    case Stretch
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .FlexStart:
            return 0
        case .FlexEnd:
            return 1
        case .Center:
            return 2
        case .Baseline:
            return 3
        case .Stretch:
            return 4
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .FlexStart
        case 1:
            self = .FlexEnd
        case 2:
            self = .Center
        case 3:
            self = .Baseline
        case 4:
            self = .Stretch
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
        case .Center:
            return "center"
        case .Baseline:
            return "baseline"
        case .Stretch:
            return "stretch"
        }
    }
}

@objc(AlignSelf)
public enum AlignSelf: Int, RawRepresentable {
    case Auto
    case FlexStart
    case FlexEnd
    case Center
    case Baseline
    case Stretch
    
    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .Auto:
            return 0
        case .FlexStart:
            return 1
        case .FlexEnd:
            return 2
        case .Center:
            return 3
        case .Baseline:
            return 4
        case .Stretch:
            return 5
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Auto
        case 1:
            self = .FlexStart
        case 2:
            self = .FlexEnd
        case 3:
            self = .Center
        case 4:
            self = .Baseline
        case 5:
            self = .Stretch
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Auto:
            return "auto"
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
        case .Center:
            return "center"
        case .Baseline:
            return "baseline"
        case .Stretch:
            return "stretch"
        }
    }
}

@objc(AlignContent)
public enum AlignContent: Int, RawRepresentable  {
    case FlexStart
    case FlexEnd
    case Center
    case Stretch
    case SpaceBetween
    case SpaceAround
    case SpaceEvenly
    
    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .FlexStart:
            return 0
        case .FlexEnd:
            return 1
        case .Center:
            return 2
        case .Stretch:
            return 3
        case .SpaceBetween:
            return 4
        case .SpaceAround:
            return 5
        case .SpaceEvenly:
            return 6
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .FlexStart
        case 1:
            self = .FlexEnd
        case 2:
            self = .Center
        case 3:
            self = .Stretch
        case 4:
            self = .SpaceBetween
        case 5:
            self = .SpaceAround
        case 6:
            self = .SpaceEvenly
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
        case .Center:
            return "center"
        case .Stretch:
            return "stretch"
        case .SpaceBetween:
            return "space-between"
        case .SpaceAround:
            return "space-around"
        case .SpaceEvenly:
            return "space-evenly"
        }
    }
}

@objc(Direction)
public enum Direction: Int, RawRepresentable {
    case Inherit
    case LTR
    case RTL
    
    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .Inherit:
            return 0
        case .LTR:
            return 1
        case .RTL:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Inherit
        case 1:
            self = .LTR
        case 2:
            self = .RTL
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Inherit:
            return "inherit"
        case .LTR:
            return "ltr"
        case .RTL:
            return "rtl"
        }
    }
}

@objc(Display)
public enum Display: Int, RawRepresentable {
    case Flex
    case None
    
    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .Flex:
            return 0
        case .None:
            return 1
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Flex
        case 1:
            self = .None
        default:
            return nil
        }
    }
    
    
    var cssValue: String {
        switch self {
        case .Flex:
            return "flex"
        case .None:
            return "none"
        }
    }
}

@objc(FlexDirection)
public enum FlexDirection: Int, RawRepresentable {
    case Row
    case Column
    case RowReverse
    case ColumnReverse
    
    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .Row:
            return 0
        case .Column:
            return 1
        case .RowReverse:
            return 2
        case .ColumnReverse:
            return 3
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Row
        case 1:
            self = .Column
        case 2:
            self = .RowReverse
        case 3:
            self = .ColumnReverse
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Row:
            return "row"
        case .Column:
            return "column"
        case .RowReverse:
            return "row-reverse"
        case .ColumnReverse:
            return "column-reverse"
        }
    }
}

@objc(JustifyContent)
public enum JustifyContent: Int, RawRepresentable {
    case FlexStart
    case FlexEnd
    case Center
    case SpaceBetween
    case SpaceAround
    case SpaceEvenly

    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .FlexStart:
            return 0
        case .FlexEnd:
            return 1
        case .Center:
            return 2
        case .SpaceBetween:
            return 3
        case .SpaceAround:
            return 4
        case .SpaceEvenly:
            return 5
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .FlexStart
        case 1:
            self = .FlexEnd
        case 2:
            self = .Center
        case 3:
            self = .SpaceBetween
        case 4:
            self = .SpaceAround
        case 5:
            self = .SpaceEvenly
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
        case .Center:
            return "center"
        case .SpaceBetween:
            return "space-between"
        case .SpaceAround:
            return "space-around"
        case .SpaceEvenly:
            return "space-evenly"
        }
    }
}

@objc(Overflow)
public enum Overflow: Int, RawRepresentable {
    case Visible
    case Hidden
    case Scroll

    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .Visible:
            return 0
        case .Hidden:
            return 1
        case .Scroll:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Visible
        case 1:
            self = .Hidden
        case 2:
            self = .Scroll
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Visible:
            return "visible"
        case .Hidden:
            return "hidden"
        case .Scroll:
            return "scroll"
        }
    }
}

@objc(PositionType)
public enum PositionType: Int, RawRepresentable {
    case Relative
    case Absolute
    
    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .Relative:
            return 0
        case .Absolute:
            return 1
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Relative
        case 1:
            self = .Absolute
        default:
            return nil
        }
    }
    
    
    var cssValue: String {
        switch self {
        case .Relative:
            return "relative"
        case .Absolute:
            return "absolute"
        }
    }
    
}

@objc(FlexWrap)
public enum FlexWrap: Int, RawRepresentable {
    case NoWrap
    case Wrap
    case WrapReverse
    
    
    public typealias RawValue = Int32

    public var rawValue: RawValue {
        switch self {
        case .NoWrap:
            return 0
        case .Wrap:
            return 1
        case .WrapReverse:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .NoWrap
        case 1:
            self = .Wrap
        case 2:
            self = .WrapReverse
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .NoWrap:
            return "no-wrap"
        case .Wrap:
            return "wrap"
        case .WrapReverse:
            return "wrap-reverse"
        }
    }
}
