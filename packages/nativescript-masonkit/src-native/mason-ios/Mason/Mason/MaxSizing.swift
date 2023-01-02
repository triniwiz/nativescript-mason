//
//  MaxSizing.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

public enum MaxSizing:Codable, Equatable {
    case Points(Float)
    case Percent(Float)
    case FitContent(Float)
    case FitContentPercent(Float)
    case Flex(Float)
    case Auto
    case MinContent
    case MaxContent
    
    
    internal var type: Int32 {
        get {
            switch (self) {
            case .Auto: return 0
            case .MinContent: return 1
            case .MaxContent: return 2
            case .Percent: return 3
            case .Points: return 4
            case .Flex: return 5
            case .FitContent: return 6
            case .FitContentPercent: return 7
            }
        }
    }
    
    internal var value: Float{
        get {
            switch(self){
            case .Points(let points):
                return points
            case .Percent(let percent):
                return percent
            case .Auto:
                return 0
            case .MinContent:
                return 0
            case .MaxContent:
                return 0
            case .FitContent(let points):
                return points
            case .FitContentPercent(let percent):
                return percent
            case .Flex(let flex):
                return flex
            }
        }
    }
    
    static func fromTypeValue(_ type: Int, _ value: Float) -> MaxSizing? {
        switch (type) {
        case 0: return .Auto
        case 1: return .MinContent
        case 2: return .MaxContent
        case 3: return .Percent(value)
        case 4: return .Points(value)
        case 5: return .Flex(value)
        case 6: return .FitContent(value)
        case 7: return .FitContentPercent(value)
        default:
            return nil
        }
    }
    
    public var cssValue: String {
        get {
            switch(self){
            case .Auto:
                return "auto"
            case .MinContent:
                return "min-content"
            case .MaxContent:
                return "max-content"
            case .Percent(let percent):
                return "\(percent)%"
            case .Points(let points):
                return "\(points)px"
            case .FitContent(let fitPoints):
                return "fit-content(\(fitPoints)px)"
            case .FitContentPercent(let fixPercent):
                return "fit-content(\(fixPercent)%)"
            case .Flex(let flex):
                return "flex(\(flex)fr)"
            }
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
        case "min-content":
            self = .MinContent
        case "max-content":
            self = .MaxContent
        default:
            if(value.starts(with: "fit-content(")){
                
            let fitContent = value
                    .replacingOccurrences(of: "fit-content(", with: "")
                    .replacingOccurrences(of: "(", with: "")
                
                if(value.contains("%")){
                    self = .FitContentPercent(Float(fitContent.replacingOccurrences(of: "%", with: ""))!)
                }else if(value.contains("px")){
                    self = .FitContent(Float(fitContent.replacingOccurrences(of: "px", with: ""))!)
                }else {
                    // todo throw
                }
            }else if(value.starts(with: "flex(")){
                self = .Flex(Float(value
                    .replacingOccurrences(of: "flex(", with: "")
                    .replacingOccurrences(of: "(", with: "")
                    .replacingOccurrences(of: "fr", with: "")
                )!)
            }else if(value.contains("%")){
                self = .Percent(Float(value.replacingOccurrences(of: "%", with: ""))!)
            }else if(value.contains("px")){
                self = .Points(Float(value.replacingOccurrences(of: "px", with: ""))!)
            }else {
                // todo throw
            }
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(cssValue)
    }
}
