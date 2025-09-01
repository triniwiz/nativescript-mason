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
    
    var cValue: CMasonTrackSizingFunction

    
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
        self.cValue = CMasonTrackSizingFunction()
    }
    
    
    public static func Single(_ value: MinMax) -> TrackSizingFunction {
        let ret = TrackSizingFunction(isRepeating: false, singleValue: value)
        
        var tracking = CMasonTrackSizingFunction()
        
        tracking.tag = CMasonTrackSizingFunction_Tag(0)
    
        tracking.single = ret.singleValue!.cValue
    
        ret.cValue = tracking
    
        return ret
    }
    
    var minMaxBuffer: UnsafeMutablePointer<CMasonNonRepeatedTrackSizingFunctionArray>? = nil
    
    var minMaxBufferValues: UnsafeMutableBufferPointer<CMasonMinMax>? = nil
    
    deinit {
        minMaxBuffer?.deallocate()
        minMaxBufferValues?.deallocate()
    }

    
    public static func AutoRepeat(_ gridTrackRepetition: GridTrackRepetition, _ value: Array<MinMax>) -> TrackSizingFunction {
        let ret = TrackSizingFunction(isRepeating: true, singleValue: nil, gridTrackRepetition: gridTrackRepetition, repeatValue: value)
        
        let minMaxValues = UnsafeMutableBufferPointer<CMasonMinMax>.allocate(capacity: value.count)
      
        let _ = minMaxValues.initialize(from: value.map({ value in
            value.cValue
        }))
                
        ret.minMaxBufferValues = minMaxValues
        
        let minMaxBuffer = UnsafeMutablePointer<CMasonNonRepeatedTrackSizingFunctionArray>.allocate(capacity: 1)
   
        minMaxBuffer.pointee.array = minMaxValues.baseAddress
        minMaxBuffer.pointee.length = UInt(value.count)

        ret.minMaxBuffer = minMaxBuffer
        
        var tracking = CMasonTrackSizingFunction()
    
        tracking.tag = Repeat
                
        tracking.repeat = Repeat_Body(_0: gridTrackRepetition.type, _1: gridTrackRepetition.value, _2: minMaxBuffer)
        
        ret.cValue = tracking
    
       return ret
    }
    
  public var cssValue: String {
    
  }
}
