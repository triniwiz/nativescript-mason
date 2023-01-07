//
//  TrackSizingFunction.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation



@objc(TrackSizingFunction)
@objcMembers
public class TrackSizingFunction: NSObject {
    internal(set) public var isRepeating: Bool
   
    var singleValue: MinMax?
    var gridTrackRepetition: GridTrackRepetition?
    var repeatValue: Array<MinMax>?
    
    var cValue: UnsafeMutablePointer<CMasonTrackSizingFunction>? = nil
    
    public var value: Any? {
        get {
            if(isRepeating){
                return repeatValue
            }
            return singleValue
        }
    }
    
    init(isRepeating: Bool, singleValue: MinMax? = nil, gridTrackRepetition: GridTrackRepetition? = nil, repeatValue: Array<MinMax>? = nil) {
        self.isRepeating = isRepeating
        self.singleValue = singleValue
        self.gridTrackRepetition = gridTrackRepetition
        self.repeatValue = repeatValue
    }
    
    
    public static func Single(_ value: MinMax) -> TrackSizingFunction {
        let ret = TrackSizingFunction(isRepeating: false, singleValue: value)
        
        let tracking = UnsafeMutablePointer<CMasonTrackSizingFunction>.allocate(capacity: 1)
        
        tracking.pointee.tag = CMasonTrackSizingFunction_Tag(0)
        
        print(ret.singleValue!.cValue)
        
        tracking.pointee.single = ret.singleValue!.cValue
        
        ret.cValue = tracking
        
        return ret
    }
    
    var minMaxBuffer: UnsafeMutablePointer<CMasonNonRepeatedTrackSizingFunctionArray>? = nil
    
    var minMaxBufferValues: UnsafeMutableBufferPointer<CMasonMinMax>? = nil
    
    deinit {
        cValue?.deallocate()
        minMaxBufferValues?.deallocate()
        minMaxBufferValues?.deallocate()
    }
    
    public static func AutoRepeat(_ gridTrackRepetition: GridTrackRepetition, _ value: Array<MinMax>) -> TrackSizingFunction {
        let ret = TrackSizingFunction(isRepeating: true, singleValue: nil, gridTrackRepetition: gridTrackRepetition, repeatValue: value)
        
        let minMax = UnsafeMutablePointer<CMasonNonRepeatedTrackSizingFunctionArray>.allocate(capacity: 1)
        
        let minMaxValues = UnsafeMutableBufferPointer<CMasonMinMax>.allocate(capacity: value.count)
        
        let _ = minMaxValues.initialize(from: value.map({ value in
            value.cValue
        }))
                
        ret.minMaxBufferValues = minMaxValues
        
        let minMaxArray = CMasonNonRepeatedTrackSizingFunctionArray(array: minMaxValues.baseAddress, length: UInt(value.count))
        
        minMax.initialize(to: minMaxArray)
        
        ret.minMaxBuffer = minMax
        
        let tracking = UnsafeMutablePointer<CMasonTrackSizingFunction>.allocate(capacity: 1)
        
        var trackingValue = CMasonTrackSizingFunction()
        
        trackingValue.tag = Repeat
        
        trackingValue.repeat = Repeat_Body(_0: gridTrackRepetition.rawValue, _1: minMax)
        
        tracking.initialize(to: trackingValue)
        
        ret.cValue = tracking
        
       return ret
    }
    
    
}
