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
  public var isComposing: Bool
  
  public override init() {
    isComposing = false
  }
  
  public init(isComposing: Bool = false) {
    self.isComposing = isComposing
  }
}

@objcMembers
@objc(MasonMouseEventOptions)
public class MasonMouseEventOptions: MasonEventOptions {
  var screenX: Float = 0
  var screenY: Float = 0
  var clientX: Float = 0
  var clientY: Float = 0
  var ctrlKey: Bool = false
  var shiftKey: Bool = false
  var altKey: Bool = false
  var metaKey: Bool = false
  var button: Int = 0
  var buttons: Int = 0
  var relatedTarget: Any? = nil
  var region: Any? = nil
  var movementX: Int = 0
  var movementY: Int = 0
  var pageX: Float = 0
  var pageY: Float = 0
}


@objcMembers
@objc(MasonEvent)
public class MasonEvent: NSObject {
  public let type: String
  public internal(set) var bubbles: Bool
  public internal(set) var cancelable: Bool
  public internal(set) var isComposing: Bool
  public let timeStamp: Double
  
  public internal(set) var defaultPrevented = false
  public internal(set) var propagationStopped = false
  public internal(set) var immediatePropagationStopped = false
  
  public internal(set) var target: Any?
  public internal(set) var currentTarget: Any?
  
  public init(type eventType: String, bubbles eventBubbles: Bool = false, cancelable eventCancelable: Bool = false, options: MasonEventOptions? = nil) {
    self.type = eventType
    self.bubbles = eventBubbles
    self.cancelable = eventCancelable
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


@objcMembers
@objc(MasonMouseEvent)
public class MasonMouseEvent: MasonEvent {
  
  public internal(set) var button: Int = 0
  public internal(set) var buttons: Int = 1

  public internal(set) var clientX: Float = 0
  public internal(set) var clientY: Float = 0

  public internal(set) var ctrlKey: Bool = false
  public internal(set) var shiftKey: Bool = false
  public internal(set) var altKey: Bool = false
  public internal(set) var metaKey: Bool = false

  public internal(set) var detail: Int = 1
  
  public internal(set) var screenX: Float = 0
  public internal(set) var screenY: Float = 0
  public internal(set) var relatedTarget: Any? = nil
  public internal(set) var region: Any? = nil
  public internal(set) var movementX: Int = 0
  public internal(set) var movementY: Int = 0
  public internal(set) var pageX: Float = 0
  public internal(set) var pageY: Float = 0
  
  public init(type: String, options: MasonMouseEventOptions? = nil) {
    super.init(type: type, options: options)
    self.button = options?.button ?? 0
    self.buttons = options?.buttons ?? 1
    self.clientX = options?.clientX ?? 0
    self.clientY = options?.clientY ?? 0
    self.ctrlKey = options?.ctrlKey ?? false
    self.shiftKey = options?.shiftKey ?? false
    self.altKey = options?.altKey ?? false
    self.shiftKey = options?.shiftKey ?? false
    self.metaKey = options?.metaKey ?? false
    self.detail = options?.buttons ?? 1
    self.screenX = options?.screenX ?? 0
    self.screenY = options?.screenY ?? 0
    self.relatedTarget = options?.relatedTarget
    self.region = options?.region
    self.movementX = options?.movementX ?? 0
    self.movementY = options?.movementY ?? 0
    self.pageX = options?.pageX ?? 0
    self.pageY = options?.pageY ?? 0
  }
}
