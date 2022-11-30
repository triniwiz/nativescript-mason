//
//  Mason.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit

@objc(Mason)
@objcMembers
public class TSCMason: NSObject {
    var nativePtr: UnsafeMutableRawPointer?
    public override init() {
        nativePtr = mason_init()
    }
    
    public func clear(){
        mason_clear(nativePtr)
    }
    
    static let instance = TSCMason()
    
    static var shared = false
    
    static let scale = Float(UIScreen.main.scale)
}
