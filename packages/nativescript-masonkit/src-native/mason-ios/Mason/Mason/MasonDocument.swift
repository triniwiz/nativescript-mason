//
//  MasonDocument.swift
//  Mason
//
//  Created by Osei Fortune on 08/10/2025.
//
import UIKit

@objcMembers
@objc(MasonDocument)
public class MasonDocument: NSObject {
  public let node: MasonNode
  public let mason: NSCMason
  
  public internal(set) var documentElement: MasonElement? = nil
  
  public init(mason instance: NSCMason) {
    mason = instance
    node = instance.createNode()
    node.type = .document
    super.init()
    node.document = self
  }
}
