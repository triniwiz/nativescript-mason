//
//  MasonEventTarget.swift
//  Mason
//
//  Created by Osei Fortune on 11/01/2026.
//


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
      return node.mason.addEventListener(node, event, listener)
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
