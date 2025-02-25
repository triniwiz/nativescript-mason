//
//  Enums.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit


@objc(MasonDimensionCompatType)
public enum MasonDimensionCompatType: Int, RawRepresentable {
    case Auto
    case Points
    case Percent
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Auto:
            return 0
        case .Points:
            return 1
        case .Percent:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Auto
        case 1:
            self = .Points
        case 2:
            self = .Percent
        default:
            return nil
        }
    }
}



@objc(MasonLengthPercentageAutoCompatType)
public enum MasonLengthPercentageAutoCompatType: Int, RawRepresentable {
    case Auto
    case Points
    case Percent
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Auto:
            return 0
        case .Points:
            return 1
        case .Percent:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Auto
        case 1:
            self = .Points
        case 2:
            self = .Percent
        default:
            return nil
        }
    }
}


@objc(MasonLengthPercentageCompatType)
public enum MasonLengthPercentageCompatType: Int, RawRepresentable {
    case Points
    case Percent
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Points:
            return 0
        case .Percent:
            return 1
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Points
        case 1:
            self = .Percent
        default:
            return nil
        }
    }
}


@objc(MasonBoxSizing)
public enum MasonBoxSizing: Int, RawRepresentable {
    case BorderBox
    case ContentBox
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .BorderBox:
            return 0
        case .ContentBox:
            return 1
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .BorderBox
        case 1:
            self = .ContentBox
        default:
            return nil
        }
    }
}

@objc(MasonTextAlign)
public enum MasonTextAlign: Int, RawRepresentable {
    case Auto
    case LegacyLeft
    case LegacyRight
    case LegacyCenter
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Auto:
            return 0
        case .LegacyLeft:
            return 1
        case .LegacyRight:
            return 2
        case .LegacyCenter:
            return 3
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
          self = .Auto
        case 1:
          self = .LegacyLeft
        case 2:
          self = .LegacyRight
        case 3:
          self = .LegacyCenter
        default:
            return nil
        }
    }
}


let decoder = JSONDecoder()
let encoder = JSONEncoder()

public func MasonDimensionFromPoints(value: Float) -> MasonDimension {
    return .Points(value)
}

public func MasonDimensionFromPercent(value: Float) -> MasonDimension {
    return .Percent(value)
}

public let MasonDimensionAuto = MasonDimension.Auto



public enum MasonDimension: Codable {
    case Auto
    case Points(Float)
    case Percent(Float)
    
    internal var isZero: Bool {
        get {
            switch(self){
            case .Auto:
                return false
            case .Points(let value):
                return value <= 0
            case .Percent(let value):
                return value <= 0
            }
        }
    }
    
    internal var type: Int32 {
        get {
            switch (self) {
            case .Auto: return 0
            case .Points: return 1
            case .Percent: return 2
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
            default:
                // todo
                // throw invaild ??
                self = .Percent(0)
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
                self = .Percent(value)
                break
                
            default:
                // todo
                // throw ???
                self = .Percent(0)
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
            try container.encode(value, forKey: .value)
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


public func MasonLengthPercentageFromPoints(value: Float) -> MasonLengthPercentage {
    return .Points(value)
}

public func MasonLengthPercentageFromPercent(value: Float) -> MasonLengthPercentage {
    return .Percent(value)
}

public let MasonLengthPercentageZero = MasonLengthPercentage.Points(0)


public enum MasonLengthPercentage: Codable {
    case Points(Float)
    case Percent(Float)
    
    
    static func fromValueType(_ value: Float, _ type: Int) -> MasonLengthPercentage? {
        switch(type){
        case 0:
            return Points(value)
        case 1:
            return Percent(value)
        default:
            return nil
        }
      }
    
    internal var type: Int32 {
        get {
            switch (self) {
            case .Points: return 0
            case .Percent: return 1
            }
        }
    }
    
    internal var value: Float {
        get {
            
            switch (self) {
            case .Points(let points): return points
            case .Percent(let percent): return percent
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
            }
        }
    }
    
    public var jsonValue: String? {
        do {
            return try String(data: encoder.encode(self), encoding: .utf8)
        }catch {return nil}
    }
    
    
    public init(from decoder: Decoder) throws {
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
            self = .Percent(value)
            break
            
        default:
            // todo
            // throw ???
            self = .Percent(0)
            break
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
            try container.encode(value, forKey: .value)
            try container.encode("%", forKey: .unit)
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case value
        case unit
    }
}


public func MasonLengthPercentageAutoFromPoints(value: Float) -> MasonLengthPercentageAuto {
    return .Points(value)
}

public func MasonLengthPercentageAutoFromPercent(value: Float) -> MasonLengthPercentageAuto {
    return .Percent(value)
}

public let MasonLengthPercentageAutoAuto = MasonLengthPercentageAuto.Auto

public let MasonLengthPercentageAutoZero = MasonLengthPercentageAuto.Points(0)


public enum MasonLengthPercentageAuto: Codable {
    case Auto
    case Points(Float)
    case Percent(Float)
    
    internal var type: Int32 {
        get {
            switch (self) {
            case .Auto: return 0
            case .Points: return 1
            case .Percent: return 2
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
            default:
                // todo
                // throw invaild ??
                self = .Percent(0)
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
                self = .Percent(value)
                break
                
            default:
                // todo
                // throw ???
                self = .Percent(0)
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
            try container.encode(value, forKey: .value)
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
    case Normal = -1
    case Start
    case End
    case Center
    case Baseline
    case Stretch
    case FlexStart
    case FlexEnd
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Normal:
            return -1
        case .Start:
            return 0
        case .End:
            return 1
        case .Center:
            return 2
        case .Baseline:
            return 3
        case .Stretch:
            return 4
        case .FlexStart:
            return 5
        case .FlexEnd:
            return 6
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case -1:
            self = .Normal
        case 0:
            self = .Start
        case 1:
            self = .End
        case 2:
            self = .Center
        case 3:
            self = .Baseline
        case 4:
            self = .Stretch
        case 5:
            self = .FlexStart
        case 6:
            self = .FlexEnd
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Normal:
            return "normal"
        case .Start:
            return "start"
        case .End:
            return "end"
        case .Center:
            return "center"
        case .Baseline:
            return "baseline"
        case .Stretch:
            return "stretch"
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
        }
    }
}

@objc(AlignSelf)
public enum AlignSelf: Int, RawRepresentable {
    case Normal = -1
    case Start
    case End
    case Center
    case Baseline
    case Stretch
    case FlexStart
    case FlexEnd
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Normal:
            return -1
        case .Start:
            return 0
        case .End:
            return 1
        case .Center:
            return 2
        case .Baseline:
            return 3
        case .Stretch:
            return 4
        case .FlexStart:
            return 5
        case .FlexEnd:
            return 6
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case -1:
            self = .Normal
        case 0:
            self = .Start
        case 1:
            self = .End
        case 2:
            self = .Center
        case 3:
            self = .Baseline
        case 4:
            self = .Stretch
        case 5:
            self = .FlexStart
        case 6:
            self = .FlexEnd
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Normal:
            return "normal"
        case .Start:
            return "start"
        case .End:
            return "end"
        case .Center:
            return "center"
        case .Baseline:
            return "baseline"
        case .Stretch:
            return "stretch"
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
        }
    }
}

@objc(AlignContent)
public enum AlignContent: Int, RawRepresentable  {
    case Normal = -1
    case Start
    case End
    case Center
    case Stretch
    case SpaceBetween
    case SpaceAround
    case SpaceEvenly
    case FlexStart
    case FlexEnd
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Normal:
            return -1
        case .Start:
            return 0
        case .End:
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
        case .FlexStart:
            return 7
        case .FlexEnd:
            return 8
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case -1:
            self = .Normal
        case 0:
            self = .Start
        case 1:
            self = .End
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
        case 7:
            self = .FlexStart
        case 8:
            self = .FlexEnd
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Normal:
            return "normal"
        case .Start:
            return "start"
        case .End:
            return "end"
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
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
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
    case None
    case Flex
    case Grid
    case Block
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .None:
            return 0
        case .Flex:
            return 1
        case .Grid:
            return 2
        case .Block:
            return 3
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .None
        case 1:
            self = .Flex
        case 2:
            self = .Grid
        case 3:
            self = .Block
        default:
            return nil
        }
    }
    
    
    var cssValue: String {
        switch self {
        case .None:
            return "none"
        case .Flex:
            return "flex"
        case .Grid:
            return "grid"
        case .Block:
            return "block"
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



@objc(JustifyItems)
public enum JustifyItems: Int, RawRepresentable {
    case Normal = -1
    case Start
    case End
    case Center
    case Baseline
    case Stretch
    case FlexStart
    case FlexEnd
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Normal:
            return -1
        case .Start:
            return 0
        case .End:
            return 1
        case .Center:
            return 2
        case .Baseline:
            return 3
        case .Stretch:
            return 4
        case .FlexStart:
            return 5
        case .FlexEnd:
            return 6
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case -1:
            self = .Normal
        case 0:
            self = .Start
        case 1:
            self = .End
        case 2:
            self = .Center
        case 3:
            self = .Baseline
        case 4:
            self = .Stretch
        case 5:
            self = .FlexStart
        case 6:
            self = .FlexEnd
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Normal:
            return "normal"
        case .Start:
            return "start"
        case .End:
            return "end"
        case .Center:
            return "center"
        case .Baseline:
            return "baseline"
        case .Stretch:
            return "stretch"
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
        }
    }
}

@objc(JustifySelf)
public enum JustifySelf: Int, RawRepresentable {
    case Normal = -1
    case Start
    case End
    case Center
    case Baseline
    case Stretch
    case FlexStart
    case FlexEnd
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Normal:
            return -1
        case .Start:
            return 0
        case .End:
            return 1
        case .Center:
            return 2
        case .Baseline:
            return 3
        case .Stretch:
            return 4
        case .FlexStart:
            return 5
        case .FlexEnd:
            return 6
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case -1:
            self = .Normal
        case 0:
            self = .Start
        case 1:
            self = .End
        case 2:
            self = .Center
        case 3:
            self = .Baseline
        case 4:
            self = .Stretch
        case 5:
            self = .FlexStart
        case 6:
            self = .FlexEnd
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Normal:
            return "normal"
        case .Start:
            return "start"
        case .End:
            return "end"
        case .Center:
            return "center"
        case .Baseline:
            return "baseline"
        case .Stretch:
            return "stretch"
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-end"
        }
    }
}

@objc(JustifyContent)
public enum JustifyContent: Int, RawRepresentable {
    case Normal = -1
    case Start
    case End
    case Center
    case Stretch
    case SpaceBetween
    case SpaceAround
    case SpaceEvenly
    case FlexStart
    case FlexEnd
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Normal:
            return -1
        case .Start:
            return 0
        case .End:
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
        case .FlexStart:
            return 7
        case .FlexEnd:
            return 8
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case -1:
            self = .Normal
        case 0:
            self = .Start
        case 1:
            self = .End
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
        case 7:
            self = .FlexStart
        case 8:
            self = .FlexEnd
        default:
            return nil
        }
    }
    
    var cssValue: String {
        switch self {
        case .Normal:
            return "normal"
        case .Start:
            return "start"
        case .End:
            return "end"
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
        case .FlexStart:
            return "flex-start"
        case .FlexEnd:
            return "flex-start"
        }
    }
}

@objc(Overflow)
public enum Overflow: Int, RawRepresentable {
    case Unset
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
        case .Unset:
             return -1
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
        case -1:
            self = .Unset
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
        case .Unset:
             return "unset"
        }
    }
}

@objc(Position)
public enum Position: Int, RawRepresentable {
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
            return "nowrap"
        case .Wrap:
            return "wrap"
        case .WrapReverse:
            return "wrap-reverse"
        }
    }
}

@objc(FlexGridAutoFlowWrap)
public enum GridAutoFlow: Int, RawRepresentable {
    case Row
    case Column
    case RowDense
    case ColumnDense
    
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Row:
            return 0
        case .Column:
            return 1
        case .RowDense:
            return 2
        case .ColumnDense:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Row
        case 1:
            self = .Column
        case 2:
            self = .RowDense
        case 3:
            self = .ColumnDense
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
        case .RowDense:
            return "row-dense"
        case .ColumnDense:
            return "column-dense"
        }
    }
}


public enum GridPlacement: Codable {
  case Auto
  case Line(Int16)
  case Span(Int16)


    internal var type: Int32{
        get{
            switch (self) {
            case .Auto: return 0
            case .Line: return 1
            case .Span: return 2
            }
        }
        
    }

    internal var placementValue: Int16{
        get{
            switch (self) {
            case .Auto: return 0
            case .Line(let value): return value
            case .Span(let value): return value
            }
        }
        
    }
    
    var cssValue: String {
        switch self {
        case .Auto:
            return "auto"
        case .Line(let line):
            return "\(line)"
        case .Span(let span):
            return "span \(span)"
        }
    }
    
    public var jsonValue: String? {
        do {
            return try String(data: encoder.encode(self), encoding: .utf8)
        }catch {return nil}
    }
    
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let value = try container.decode(String.self)
        switch(value){
        case "auto":
            self = .Auto
            break
        default:
            let val = value.split(separator: " ")
            if(value.contains("span")){
                self = .Span(Int16(String(val.last!))!)
            }else {
                self = .Line(Int16(String(val.first!))!)
            }
            break
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(cssValue)
    }
}


@objc(GridPlacementCompatType)
public enum GridPlacementCompatType: Int, RawRepresentable {
    case Auto
    case Line
    case Span
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Auto:
            return 0
        case .Line:
            return 1
        case .Span:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
            self = .Auto
        case 1:
            self = .Line
        case 2:
            self = .Span
        default:
            return nil
        }
    }
}

enum GridTrackRepetitionType {
    case AutoFill
    case AutoFit
    case Count(UInt16)
}

@objcMembers
@objc(GridTrackRepetition)
public class GridTrackRepetition: NSObject {
    let repetition: GridTrackRepetitionType
    
    init(repetition: GridTrackRepetitionType) {
        self.repetition = repetition
    }
    
    public var type: Int32 {
        switch(repetition){
        case .AutoFill:
            return 0
        case .AutoFit:
            return 1
        case .Count(_):
            return 2
        }
    }
    
    public var value: UInt16 {
        switch(repetition){
        case .Count(let value):
            return value
        default:
            return 0
        }
    }
    
    public static let AutoFill = GridTrackRepetition(repetition: GridTrackRepetitionType.AutoFill)
    
    public static let AutoFit = GridTrackRepetition(repetition: GridTrackRepetitionType.AutoFit)
    
    public static func Count(_ value: UInt16) -> GridTrackRepetition {
        return GridTrackRepetition(repetition: GridTrackRepetitionType.Count(value))
    }
    
}
