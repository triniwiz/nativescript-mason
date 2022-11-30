//
//  Enums.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation


public struct MasonRect<T> {
    var left: T
    var right: T
    var top: T
    var bottom: T
    
    init(_ left: T, _ right: T, _ top: T, _ bottom: T) {
        self.left = left
        self.right = right
        self.top = top
        self.bottom = bottom
    }
}


public struct MasonSize<T>{
    var width: T
    var height: T
    
    init(_ width: T, _ height: T) {
        self.width = width
        self.height = height
    }
}


public enum MasonDimension {
    case Points(Float)
    case Percent(Float)
    case Auto
    case Undefined
    
    
    internal var type: Int32 {
        get {
            switch (self) {
            case .Points: return 0
            case .Percent: return 1
            case .Undefined: return 2
            case .Auto: return 3
            }
        }
    }

    internal var value: Float {
        get {

            switch (self) {
            case .Points(let points): return points
            case .Percent(let percent): return percent
            case .Undefined: return 0
            case .Auto: return 0
            }
        }
    }
}



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
}

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
}

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
}

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
}

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
}

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
}

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
}

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
}

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
}

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
}
