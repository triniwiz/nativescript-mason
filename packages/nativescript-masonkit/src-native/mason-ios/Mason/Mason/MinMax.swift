//
//  MinMax.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

public struct MinMax: Codable {
    let min: MinSizing
    let max: MaxSizing
    let cValue: CMasonMinMax
    
    public init(_ min: MinSizing, _ max: MaxSizing) {
        self.min = min
        self.max = max
        self.cValue = CMasonMinMax(min_type: min.type, min_value: min.value, max_type: max.type, max_value: max.value)
    }

    public static func Points(points: Float) -> MinMax {
        return MinMax(.Points(points), .Points(points))
    }
    
    public static func Percent(percent: Float) -> MinMax {
        return MinMax(.Percent(percent), .Percent(percent))
    }
    
    public static func Flex(flex: Float) -> MinMax {
        return MinMax(.Auto, .Flex(flex))
    }
    
    public static func FitContent(fit: Float) -> MinMax {
        return MinMax(.Auto, .FitContent(fit))
    }
    
    public static func FitContentPercent(fit: Float) -> MinMax {
        return MinMax(.Auto, .FitContentPercent(fit))
    }
    
    public static let Auto = MinMax(.Auto, .Auto)
    
    
    
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
            switch((self.min, self.max)){
            case (MinSizing.Auto, MaxSizing.Auto):
                return "auto"
            case (MinSizing.MinContent, MaxSizing.MinContent):
               return "min-content"
            case (MinSizing.MaxContent, MaxSizing.MaxContent):
                return "max-content"
            case (MinSizing.Points(let minPoints), MaxSizing.Points(let maxPoints)):
                if(minPoints == maxPoints){
                    return "\(minPoints)px"
                }else {
                   return "minmax(\(minPoints)px, \(maxPoints)px"
                }
            case (MinSizing.Percent(let minPercent), MaxSizing.Percent(let maxPercent)):
                if(minPercent == maxPercent){
                    return "\(minPercent)%"
                }else {
                    return "minmax(\(minPercent)%, \(maxPercent)%"
                }
            case (MinSizing.Auto, MaxSizing.Flex(let flex)):
                return "flex(\(flex)fr)"
            case (MinSizing.Auto, MaxSizing.FitContent(let fitPx)):
                return "fit-content(\(fitPx)px)"
            case (MinSizing.Auto, MaxSizing.FitContentPercent(let fitPercent)):
                return "fit-content(\(fitPercent)%)"
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
    
    static func  decodeMaxValue(value: String) -> MaxSizing? {
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
                    .replacingOccurrences(of: "(", with: "")
                    .trimmingCharacters(in: .whitespaces)
            
                if(value.contains("%")){
                    return .FitContentPercent(Float(fitContent.replacingOccurrences(of: "%", with: ""))!)
                }else if(value.contains("px")){
                    return .FitContent(Float(fitContent.replacingOccurrences(of: "px", with: ""))!)
                }else {
                    return nil
                }
            }else if(value.starts(with: "flex(")){
                return .Flex(Float(value
                    .replacingOccurrences(of: "flex(", with: "")
                    .replacingOccurrences(of: "(", with: "")
                    .replacingOccurrences(of: "fr", with: "")
                    .trimmingCharacters(in: .whitespaces))!
                )
            }else if(value.contains("%")){
                return .Percent(Float(value.replacingOccurrences(of: "%", with: ""))!)
            }else if(value.contains("px")){
                return .Points(Float(value.replacingOccurrences(of: "px", with: ""))!)
            }
            
            return nil
            
        }
    }
    
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let value = try container.decode(String.self)
        switch(value){
        case "auto":
            self = .Auto
            break
        case "min-content":
            self = .init(.MinContent, .MinContent)
            break
        case "max-content":
            self = .init(.MaxContent, .MaxContent)
            break
        default:
            if(value.starts(with: "fit-content(")){
            let fitContent = value
                    .replacingOccurrences(of: "fit-content(", with: "")
                    .replacingOccurrences(of: "(", with: "")
                    .trimmingCharacters(in: .whitespaces)
            
                if(value.contains("%")){
                    self = .init(.Auto, .FitContentPercent(Float(fitContent.replacingOccurrences(of: "%", with: ""))!))
                }else if(value.contains("px")){
                    self = .init(.Auto, .FitContent(Float(fitContent.replacingOccurrences(of: "px", with: ""))!))
                }else {
                    // todo throw
                }
            }else if(value.starts(with: "flex(")){
                self = .init(.Auto, .Flex(Float(value
                    .replacingOccurrences(of: "flex(", with: "")
                    .replacingOccurrences(of: "(", with: "")
                    .replacingOccurrences(of: "fr", with: "")
                    .trimmingCharacters(in: .whitespaces))!
                ))
            }else if(value.contains("%")){
                self = .Percent(percent: Float(value.replacingOccurrences(of: "%", with: ""))!)
            }else if(value.contains("px")){
                self = .Points(points: Float(value.replacingOccurrences(of: "px", with: ""))!)
            }else if(value.starts(with: "minmax(")) {
               let split = value
                    .replacingOccurrences(of: "minmax(", with: "")
                    .replacingOccurrences(of: "(", with: "")
                    .trimmingCharacters(in: .whitespaces)
                    .split(separator: ",")
                
                let min = MinMax.decodeMinValue(value: String(split.first!))
                
                let max = MinMax.decodeMaxValue(value: String(split.last!))
                
                self = .init(min!, max!)
                
            }
            
            throw NSError(domain: "Invalid type", code: 1000)
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(cssValue)
    }
}
