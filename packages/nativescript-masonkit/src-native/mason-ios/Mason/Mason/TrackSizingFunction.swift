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
    TrackSizingFunction(isRepeating: false, singleValue: value)
  }
  
  
  public static func AutoRepeat(_ gridTrackRepetition: GridTrackRepetition, _ value: Array<MinMax>) -> TrackSizingFunction {
    return TrackSizingFunction(isRepeating: true, singleValue: nil, gridTrackRepetition: gridTrackRepetition, repeatValue: value)
  }
  
  public var cssValue: String {
    
    if(!isRepeating){
      return singleValue?.cssValue ?? ""
    }
    guard let gridTrackRepetition = gridTrackRepetition, let repeatValue = repeatValue  else {
      return ""
    }
    if(repeatValue.isEmpty){
      return ""
    }
    var builder = "repeat(\(gridTrackRepetition.cssValue), "
    
    
    let last = repeatValue.count - 1
    repeatValue.enumerated().forEach { value in
      if(value.offset == last){
        builder += value.element.cssValue
      }else {
        builder += "\(value.element.cssValue) "
      }
    }
    builder += ")"
    return builder
    
  }
}
