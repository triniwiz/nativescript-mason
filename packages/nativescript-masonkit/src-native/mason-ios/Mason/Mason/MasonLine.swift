//
//  MasonLine.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

public struct Line<T>{
    var start: T
    var end: T
    
    public init(_ start: T,_ end: T) {
        self.start = start
        self.end = end
    }
    
    static func fromStartAndEndValues(
        startType: Int,
        startValue: Int16,
        endType: Int,
        endValue: Int16
    ) -> Line<GridPlacement>? {
        var start: GridPlacement? = nil
        
        switch(startType){
        case 0: start = .Auto
        case 1: start = .Line(startValue)
        case 2: start = .Span(startValue)
        default:
            break
        }
        
        var end: GridPlacement? = nil
        
        switch(endType){
        case 0: end = .Auto
        case 1: end = .Line(startValue)
        case 2:  end = .Span(startValue)
        default:
            break
        }
        
        guard let start = start else {return nil}
        guard let end = end else {return nil}
        
        return Line<GridPlacement>(start, end)
    }
}

let LineGridPlacementAuto: Line<GridPlacement> = Line(GridPlacement.Auto, GridPlacement.Auto)


@objcMembers
@objc(LineGridPlacementCompat)
public class LineGridPlacementCompat: NSObject{
    internal(set) public var start: GridPlacementCompat
    internal(set) public var end: GridPlacementCompat
    
    
    init(_ startValue: GridPlacement,_ endValue: GridPlacement) {
        start = GridPlacementCompat(value: startValue)
        end = GridPlacementCompat(value: endValue)
        super.init()
    }
    
    
    static func fromStartAndEndValues(
        startType: Int32,
        startValue: Int16,
        endType: Int32,
        endValue: Int16
    ) -> LineGridPlacementCompat? {
        var start: GridPlacement? = nil
        
        switch(startType){
        case 0: start = .Auto
        case 1: start = .Line(startValue)
        case 2:  start = .Span(startValue)
        default:
            break
        }
        
        var end: GridPlacement? = nil
        
        switch(endType){
        case 0: end = .Auto
        case 1: end = .Line(startValue)
        case 2: end = .Span(startValue)
        default:
            break
        }
        
        guard let start = start else {return nil}
        guard let end = end else {return nil}
        
        return LineGridPlacementCompat(start, end)
    }
}
