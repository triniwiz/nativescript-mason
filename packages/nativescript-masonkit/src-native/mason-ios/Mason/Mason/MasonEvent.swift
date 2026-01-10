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
  public var isComposing: Bool = false
  public var target: Any? = nil
  public init(type: String, bubbles: Bool, cancelable: Bool, isComposing: Bool) {
    self.type = type
    self.bubbles = bubbles
    self.cancelable = cancelable
    self.isComposing = isComposing
  }
}


@objcMembers
@objc(MasonEvent)
public class MasonEvent: NSObject {
  public let type: String
  public let bubbles: Bool
  public let cancelable: Bool
  public let isComposing: Bool
  public let timeStamp: Double
  
  public internal(set) var defaultPrevented = false
  public internal(set) var propagationStopped = false
  public internal(set) var immediatePropagationStopped = false
  
  public internal(set) var target: Any?
  public internal(set) var currentTarget: Any?
  
  public init(type: String, options: MasonEventOptions? = nil) {
    self.type = type
    self.bubbles = options?.bubbles ?? false
    self.cancelable = options?.cancelable ?? false
    self.isComposing = options?.isComposing ?? false
    self.timeStamp = CACurrentMediaTime() * 1000
  }
  
  public func preventDefault(){
    guard cancelable else { return }
    defaultPrevented = true
  }
  
  public func stopPropagation(){
    propagationStopped = true
  }
  
  public func stopImmediatePropagation() {
    immediatePropagationStopped = true
  }
}


@objcMembers
@objc(MasonInputEvent)
public class MasonInputEvent: MasonEvent {
  public  let data: String?
  public let inputType: String?
  
  public init(type: String, data inputData: String? = nil, inputType masonInputType: String? = nil, options: MasonEventOptions? = nil) {
    inputType = masonInputType
    data = inputData
    super.init(type: type, options: options)
  }
}


@objcMembers
@objc(MasonFileInputEvent)
public class MasonFileInputEvent: MasonEvent {
  public let data: String?
  public let inputType: String?
  public let rawData: [URL]
  
  public init(type: String, data inputData: String? = nil, inputType masonInputType: String? = nil, options: MasonEventOptions? = nil, rawData inputRawData: [URL]) {
    inputType = masonInputType
    data = inputData
    rawData = inputRawData
    super.init(type: type, options: options)
  }
}
