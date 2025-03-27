//
//  MasonCompat.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

@objcMembers
@objc(MasonDimensionCompat)
public class MasonDimensionCompat: NSObject, Codable {
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


@objcMembers
@objc(MasonLengthPercentageAutoCompat)
public class MasonLengthPercentageAutoCompat: NSObject, Codable {
    internal let length: MasonLengthPercentageAuto
    internal let lengthType: MasonLengthPercentageAutoCompatType
    public init(points: Float) {
        length = .Points(points)
        lengthType = .Points
    }
    
    public init(percent: Float) {
        length = .Percent(percent)
        lengthType = .Percent
    }
    
    internal init(value: MasonLengthPercentageAuto) {
        length = value
        switch(value){
        case .Points(_):
            lengthType = .Points
        case .Percent(_):
            lengthType = .Percent
        case .Auto:
            lengthType = .Auto
        }
    }
    
    public var type: MasonLengthPercentageAutoCompatType {
        get {
            return lengthType
        }
    }
    
    public var value: Float {
        get {
            switch(length){
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
            return length.cssValue
        }
    }
    
    
    public var jsonValue: String? {
        return length.jsonValue
    }
    
    public static let Auto = MasonLengthPercentageAutoCompat(value: .Auto)
    
    public static let Zero = MasonLengthPercentageAutoCompat(value: .Points(0))
}


@objcMembers
@objc(MasonLengthPercentageCompat)
public class MasonLengthPercentageCompat: NSObject, Codable {
    internal let length: MasonLengthPercentage
    internal let lengthType: MasonLengthPercentageCompatType
    public init(points: Float) {
        length = .Points(points)
        lengthType = .Points
    }
    
    public init(percent: Float) {
        length = .Percent(percent)
        lengthType = .Percent
    }
    
    internal init(value: MasonLengthPercentage) {
        length = value
        switch(value){
        case .Points(_):
            lengthType = .Points
        case .Percent(_):
            lengthType = .Percent
        }
    }
    
    public var type: MasonLengthPercentageCompatType {
        get {
            return lengthType
        }
    }
    
    public var value: Float {
        get {
            switch(length){
            case .Points(let points):
                return points
            case .Percent(let percent):
                return percent
            }
        }
    }
    
    public var cssValue: String {
        get {
            return length.cssValue
        }
    }
    
    
    public var jsonValue: String? {
        return length.jsonValue
    }
    
    public static let Zero = MasonLengthPercentageCompat(value: .Points(0))
}


@objcMembers
@objc(GridPlacementCompat)
public class GridPlacementCompat: NSObject {
    internal let placement: GridPlacement
    internal let placementType: GridPlacementCompatType
    public init(span: Int16) {
        placement = .Span(span)
        placementType = .Span
    }
    
    public init(line: Int16) {
        placement = .Line(line)
        placementType = .Line
    }
    
    internal init(value: GridPlacement) {
        placement = value
        switch(placement){
        case .Auto:
            placementType = .Auto
        case .Span(_):
            placementType = .Span
        case .Line(_):
            placementType = .Line
        }
    }
    
    public var type: GridPlacementCompatType {
        get {
            return placementType
        }
    }
    
    public var value: Int16 {
        get {
            switch(placement){
            case .Span(let span):
                return span
            case .Line(let line):
                return line
            case .Auto:
                return 0
            }
        }
    }
    
    public var cssValue: String {
        get {
            return placement.cssValue
        }
    }
    
    
    public var jsonValue: String? {
        return placement.jsonValue
    }
    
    public static let Auto = GridPlacementCompat(value: .Auto)
}
