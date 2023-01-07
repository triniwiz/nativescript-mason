//
//  MaxSizing.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

enum MaxSizingType: Equatable {
    case Points
    case Percent
    case FitContent
    case FitContentPercent
    case Flex
    case Auto
    case MinContent
    case MaxContent
    
}

@objcMembers
@objc(MaxSizing)
public class MaxSizing:NSObject, Codable {
    var internalType: MaxSizingType
    internal(set) public var value: Float = 0
    
    init(_ type: MaxSizingType, _ value: Float) {
        internalType = type
        super.init()
        self.value = value
    }
    
    public static func Points(_ points: Float) -> MaxSizing {
        return MaxSizing(.Points, points)
    }
    
    public static func Percent(_ percent: Float) -> MaxSizing {
        return MaxSizing(.Percent, percent)
    }
    
    public static func FitContent(_ fit: Float) -> MaxSizing {
        return MaxSizing(.FitContent, fit)
    }
    
    public static func FitContentPercent(_ fit: Float) -> MaxSizing {
        return MaxSizing(.FitContentPercent, fit)
    }
    
    public static func Flex(_ flex: Float) -> MaxSizing {
        return MaxSizing(.Flex, flex)
    }
    
    public static let Auto = MaxSizing(.Auto, 0)
    
    public static let MinContent = MaxSizing(.MinContent, 0)
    
    public static let MaxContent = MaxSizing(.MaxContent, 0)
    
    internal var type: Int32 {
        get {
            switch (self.internalType) {
            case .Auto: return 0
            case .MinContent: return 1
            case .MaxContent: return 2
            case .Points: return 3
            case .Percent: return 4
            case .Flex: return 5
            case .FitContent: return 6
            case .FitContentPercent: return 7
            }
        }
    }
    
    static func fromTypeValue(_ type: Int, _ value: Float) -> MaxSizing? {
        switch (type) {
        case 0: return .Auto
        case 1: return .MinContent
        case 2: return .MaxContent
        case 3: return .Points(value)
        case 4: return .Percent(value)
        case 5: return .Flex(value)
        case 6: return .FitContent(value)
        case 7: return .FitContentPercent(value)
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
            case .FitContent:
                return "fit-content(\(value)px)"
            case .FitContentPercent:
                return "fit-content(\(value)%)"
            case .Flex:
                return "flex(\(value)fr)"
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
            if(value.starts(with: "fit-content(")){
                
            let fitContent = value
                    .replacingOccurrences(of: "fit-content(", with: "")
                    .replacingOccurrences(of: ")", with: "")
                
                if(value.contains("%")){
                    self.internalType = .FitContentPercent
                    self.value = Float(fitContent.replacingOccurrences(of: "%", with: ""))!
                }else if(value.contains("px")){
                    self.internalType = .FitContent
                    self.value = Float(fitContent.replacingOccurrences(of: "px", with: ""))!
                }else {
                    // todo throw
                    throw NSError(domain: "Invalid type", code: 1000)
                }
            }else if(value.starts(with: "flex(")){
                self.internalType = .Flex
                self.value = Float(value
                    .replacingOccurrences(of: "flex(", with: "")
                    .replacingOccurrences(of: ")", with: "")
                    .replacingOccurrences(of: "fr", with: "")
                )!
            }else if(value.contains("%")){
                self.internalType = .Percent
                self.value = Float(value.replacingOccurrences(of: "%", with: ""))!
            }else if(value.contains("px")){
                self.internalType = .Points
                self.value = Float(value.replacingOccurrences(of: "px", with: ""))!
            }else {
                // todo throw
                
                throw NSError(domain: "Invalid type", code: 1000)

            }
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(cssValue)
    }
}
