//
//  MasonEventTarget.swift
//  Mason
//
//  Created by Osei Fortune on 11/01/2026.
//

import UIKit

public protocol MasonEventTarget {
  var node: MasonNode { get }
  
  @discardableResult
  func addEventListener(_ event: String, _ listener: @escaping (MasonEvent) -> Void) -> UUID

  
  @discardableResult
  func removeEventListener(_ event: String, id: UUID) -> Bool
  
  @discardableResult
  func removeEventListener(_ event: String) -> Bool
  
  func dispatch(_ event: MasonEvent)
}


extension MasonEventTarget {
    @discardableResult
    public func addEventListener(_ event: String, _ listener: @escaping (MasonEvent) -> Void) -> UUID {
      let id = node.mason.addEventListener(node, event, listener)
      if event == "click" {
        ensureClickGesture()
      } else if event == "scroll" || event == "scrollend" {
        node.listensForScroll = true
      }
      return id
    }

    /// Dispatches "click" on a tap from now on.
    internal func ensureClickGesture() {
      guard !node.hasClickGesture, let element = self as? MasonElement else { return }
      node.hasClickGesture = true
      let view = element.uiView
      view.isUserInteractionEnabled = true
      let recognizer = MasonGestureRecognizer(targetView: view)
      recognizer.owner = element
      view.addGestureRecognizer(recognizer)
    }


    @discardableResult
    public func removeEventListener(_ event: String, id: UUID) -> Bool {
      return node.mason.removeEventListener(node, event, id: id)
    }

    @discardableResult
    public func removeEventListener(_ event: String) -> Bool {
      return node.mason.removeEventListener(node, event)
    }
}
