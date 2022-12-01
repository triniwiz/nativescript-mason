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
    public internal (set) var nativePtr: UnsafeMutableRawPointer!
    public override init() {
        nativePtr = mason_init_with_capacity(32)
    }
    
    deinit {
       // mason_destroy(nativePtr)
    }
    
    public func clear(){
        mason_clear(nativePtr)
    }
    
    static let instance = TSCMason()
    
    static var shared = false
    
    static let scale = Float(UIScreen.main.scale)
}
