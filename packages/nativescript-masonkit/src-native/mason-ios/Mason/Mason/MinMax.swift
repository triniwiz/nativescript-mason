//
//  MinMax.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

@objcMembers
@objc(MinMax)
public class MinMax: NSObject, Codable {
    let min: MinSizing
    let max: MaxSizing
    
    public init(_ min: MinSizing, _ max: MaxSizing) {
        self.min = min
        self.max = max
    }
    
    public static func Points(points: Float) -> MinMax {
        return MinMax(.Points(points), .Points(points))
    }
    
    public static func Percent(percent: Float) -> MinMax {
        return MinMax(.Percent(percent), .Percent(percent))
    }
    
    public static func Flex(flex: Float) -> MinMax {
        return MinMax(.Auto, .Fraction(flex))
    }
    
    public static func FitContent(fit: Float) -> MinMax {
        return MinMax(.Auto, .FitContent(fit))
    }
    
    public static func FitContentPercent(fit: Float) -> MinMax {
        return MinMax(.Auto, .FitContentPercent(fit))
    }
    
    public static let Auto = MinMax(.Auto, .Auto)
    
    public static func fromTypeValue(_ minType: Int, _ minValue: Float, _ maxType: Int, _ maxValue: Float) -> MinMax? {
        var min: MinSizing? = nil
        
        switch (minType) {
        case 0: min = MinSizing.Auto
            break
        case 1: min = MinSizing.MinContent
            break
        case 2: min = MinSizing.MaxContent
            break
        case 3: min = MinSizing.Points(minValue)
            break
        case 4: min = MinSizing.Percent(minValue)
            break
        default:
            min = nil
        }
        
        var max: MaxSizing? = nil
        
        switch (maxType) {
        case 0: max = MaxSizing.Auto
            break
        case 1: max = MaxSizing.MinContent
            break
        case 2: max = MaxSizing.MaxContent
            break
        case 3: max = MaxSizing.Points(maxValue)
            break
        case 4: max = MaxSizing.Percent(maxValue)
            break
        case 5 : max = MaxSizing.Fraction(maxValue)
            break
        case 6 : max = MaxSizing.FitContent(maxValue)
            break
        case 7 : max =  MaxSizing.FitContentPercent(maxValue)
            break
        default:
            max = nil
        }
        
        guard let min = min else{return nil}
        guard let max = max else{return nil}
        
        
        return MinMax(min, max)
    }
    
    
    
    var minType: Int32{
        get {
            return min.type
        }
    }
    
    var minValue: Float{
        get {
            return min.value
        }
    }
    
    
    var maxType: Int32{
        get {
            return max.type
        }
    }
    
    
    var maxValue: Float{
        get {
            return max.value
        }
    }
    
    
    
    public var cssValue: String {
        get {
            switch((self.min.internalType, self.max.internalType)){
            case (.Auto, .Auto):
                return "auto"
            case (.MinContent, .MinContent):
                return "min-content"
            case (.MaxContent, .MaxContent):
                return "max-content"
            case (.Points, .Points):
                if(self.min.value == self.max.value){
                    return "\(self.min.value)px"
                }else {
                    return "minmax(\(self.min.value)px, \(self.max.value))px"
                }
            case (.Percent, .Percent):
                if(self.min.value == self.max.value){
                    return "\(self.min.value)%"
                }else {
                    return "minmax(\(self.min.value)%, \(self.max.value))%"
                }
            case (.Auto, .Fraction):
                return "\(self.max.value)fr"
            case (.Auto, .FitContent):
                return "fit-content(\(self.max.value)px)"
            case (.Auto, .FitContentPercent):
                return "fit-content(\(self.max.value)%)"
            default:
                return "minmax(\(self.min.cssValue), \(self.max.cssValue))"
            }
        }
    }
    
    public var jsonValue: String? {
        do {
            return try String(data: encoder.encode(self), encoding: .utf8)
        }catch {return nil}
    }
    
    static func decodeMinValue(value: String) -> MinSizing? {
        switch(value){
        case "auto":
            return .Auto
        case "min-content":
            return .MinContent
        case "max-content":
            return .MaxContent
        default:
            if(value.contains("%")){
                return .Percent(Float(value.replacingOccurrences(of: "%", with: ""))!)
            }else if(value.contains("px")){
                return .Points(Float(value.replacingOccurrences(of: "px", with: ""))!)
            }
            
            return nil
            
        }
    }
    
    static func decodeMaxValue(value: String) -> MaxSizing? {
        switch(value){
        case "auto":
            return .Auto
        case "min-content":
            return .MinContent
        case "max-content":
            return .MaxContent
        default:
            if(value.starts(with: "fit-content(")){
                let fitContent = value
                    .replacingOccurrences(of: "fit-content(", with: "")
                    .replacingOccurrences(of: ")", with: "")
                    .trimmingCharacters(in: .whitespaces)
                
                if(value.contains("%")){
                    return .FitContentPercent(Float(fitContent.replacingOccurrences(of: "%", with: ""))!)
                }else if(value.contains("px")){
                    return .FitContent(Float(fitContent.replacingOccurrences(of: "px", with: ""))!)
                }else {
                    return nil
                }
            }else if(value.contains("fr")){
                return .Fraction(Float(value.replacingOccurrences(of: "fr", with: ""))!)
            }else if(value.contains("%")){
                return .Percent(Float(value.replacingOccurrences(of: "%", with: ""))!)
            }else if(value.contains("px")){
                return .Points(Float(value.replacingOccurrences(of: "px", with: ""))!)
            }
            
            return nil
            
        }
    }
    
    
    required public init(from decoder: Decoder) throws {
        min = .Auto
        max = .Auto
        let container = try decoder.singleValueContainer()
        let value = try container.decode(String.self)
        switch(value){
        case "auto":
            self.min.internalType = .Auto
            self.max.internalType = .Auto
            break
        case "min-content":
            self.min.internalType = .MinContent
            self.max.internalType = .MinContent
            break
        case "max-content":
            self.min.internalType = .MaxContent
            self.max.internalType = .MaxContent
            break
        default:
            if(value.starts(with: "fit-content(")){
                let fitContent = value
                    .replacingOccurrences(of: "fit-content(", with: "")
                    .replacingOccurrences(of: ")", with: "")
                    .trimmingCharacters(in: .whitespaces)
                
                if(value.contains("%")){
                    self.min.internalType = .Auto
                    self.max.internalType = .FitContentPercent
                    self.max.value = Float(fitContent.replacingOccurrences(of: "%", with: ""))!
                }else if(value.contains("px")){
                    self.min.internalType = .Auto
                    self.max.internalType = .FitContent
                    self.max.value = Float(fitContent.replacingOccurrences(of: "px", with: ""))!
                }else {
                    // todo throw
                }
            }else if(value.contains("fr")){
                self.min.internalType = .Auto
                self.max.internalType = .Fraction
                self.max.value =  Float(value.replacingOccurrences(of: "fr", with: ""))!
            }else if(value.starts(with: "minmax(")) {
                let split = value
                    .replacingOccurrences(of: "minmax(", with: "")
                    .replacingOccurrences(of: ")", with: "")
                    .trimmingCharacters(in: .whitespaces)
                    .split(separator: ",")
                
                let min = MinMax.decodeMinValue(value: String(split.first!))!
                
                let max = MinMax.decodeMaxValue(value: String(split.last!))!
                
                self.min.internalType = min.internalType
                self.min.value = min.value
                
                self.max.internalType = max.internalType
                self.max.value = max.value
                
                
            }else if(value.contains("%")){
                
                let value = Float(value.replacingOccurrences(of: "%", with: ""))!
                
                self.min.internalType = .Percent
                self.min.value = value
                self.max.internalType = .Percent
                self.max.value = value
            }else if(value.contains("px")){
                
                let value = Float(value.replacingOccurrences(of: "px", with: ""))!
                
                self.min.internalType = .Points
                self.min.value = value
                self.max.internalType = .Points
                self.max.value = value
                
            }
            
            throw NSError(domain: "Invalid type", code: 1000)
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(cssValue)
    }
}
