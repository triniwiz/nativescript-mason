//
//  MinSizing.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation


public enum MinSizing:Codable, Equatable {
    case Points(Float)
    case Percent(Float)
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
            if(value.contains("%")){
                self = .Percent(Float(value.replacingOccurrences(of: "%", with: ""))!)
            }else if(value.contains("px")){
                self = .Points(Float(value.replacingOccurrences(of: "px", with: ""))!)
            }
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(cssValue)
    }
}
