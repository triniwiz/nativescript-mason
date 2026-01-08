//
//  MasonEvent.swift
//  Mason
//
//  Created by Osei Fortune on 07/01/2026.
//

import UIKit

@objcMembers
@objc(MasonEventOptions)
public class MasonEventOptions: NSObject {
  public var type: String = ""
  public var bubbles: Bool = false
  public var cancelable: Bool = false
  public var composed: Bool = false
  public var target: Any? = nil
  public init(type: String, bubbles: Bool, cancelable: Bool, composed: Bool) {
    self.type = type
    self.bubbles = bubbles
    self.cancelable = cancelable
    self.composed = composed
  }
}


@objcMembers
@objc(MasonEvent)
public class MasonEvent: NSObject {
  public let type: String
  public let bubbles: Bool
  public let cancelable: Bool
  public let composed: Bool
  public let timeStamp: Double
  
  public internal(set) var defaultPrevented = false
  public internal(set) var propagationStopped = false
  
  public internal(set) var target: Any?
  public internal(set) var currentTarget: Any?
  
  public init(type: String, options: MasonEventOptions? = nil) {
    self.type = type
    self.bubbles = options?.bubbles ?? false
    self.cancelable = options?.cancelable ?? false
    self.composed = options?.composed ?? false
    self.timeStamp = CACurrentMediaTime() * 1000
  }
  
  public func preventDefault(){
    guard cancelable else { return }
    defaultPrevented = true
  }
  
  public func stopPropagation(){
    propagationStopped = true
  }
}


@objcMembers
@objc(MasonInputEvent)
public class MasonInputEvent: MasonEvent {
  public  let data: String?
  public let inputType: String
  
  public init(type: String, data inputData: String? = nil, inputType masonInputType: String, options: MasonEventOptions? = nil) {
    inputType = masonInputType
    data = inputData
    super.init(type: type, options: options)
  }
}
