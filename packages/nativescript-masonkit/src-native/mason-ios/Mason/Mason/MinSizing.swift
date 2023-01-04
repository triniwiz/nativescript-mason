//
//  MinSizing.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation


enum MinSizingType: Equatable {
    case Points
    case Percent
    case Auto
    case MinContent
    case MaxContent
}


@objcMembers
@objc(MinSizing)
public class MinSizing: NSObject, Codable {
    var internalType: MinSizingType
    internal(set) public var value: Float = 0
    
    init(_ type: MinSizingType, _ value: Float) {
        internalType = type
        super.init()
    }
    
    public static func Points(_ points: Float) -> MinSizing {
        return MinSizing(.Points, points)
    }
    
    public static func Percent(_ percent: Float) -> MinSizing {
        return MinSizing(.Percent, percent)
    }
    
    public static let Auto = MinSizing(.Auto, 0)
    
    public static let MinContent = MinSizing(.MinContent, 0)
    
    public static let MaxContent = MinSizing(.MaxContent, 0)
    
    
    internal var type: Int32 {
        get {
            switch (self.internalType) {
            case .Auto: return 0
            case .MinContent: return 1
            case .MaxContent: return 2
            case .Percent: return 3
            case .Points: return 4
            }
        }
    }
    
    
    static func fromTypeValue(_ type: Int, _ value: Float) -> MinSizing? {
        switch (type) {
        case 0: return .Auto
        case 1: return .MinContent
        case 2: return .MaxContent
        case 3: return .Percent(value)
        case 4: return .Points(value)
        default:
            return nil
        }
    }
    
    
    public var cssValue: String {
        get {
            switch(self.internalType){
            case .Auto:
                return "auto"
            case .MinContent:
                return "min-content"
            case .MaxContent:
                return "max-content"
            case .Percent:
                return "\(value)%"
            case .Points:
                return "\(value)px"
            }
        }
    }
    
    public var jsonValue: String? {
        do {
            return try String(data: encoder.encode(self), encoding: .utf8)
        }catch {return nil}
    }
    
    
    required public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let value = try container.decode(String.self)
        switch(value){
        case "auto":
            self.internalType = .Auto
        case "min-content":
            self.internalType = .MinContent
        case "max-content":
            self.internalType = .MaxContent
        default:
            if(value.contains("%")){
                self.internalType = .Percent
                self.value = Float(value.replacingOccurrences(of: "%", with: ""))!
            }else if(value.contains("px")){
                self.internalType = .Points
                self.value = Float(value.replacingOccurrences(of: "px", with: ""))!
            }
        }
        throw NSError(domain: "Invalid type", code: 1000)
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(cssValue)
    }
}
