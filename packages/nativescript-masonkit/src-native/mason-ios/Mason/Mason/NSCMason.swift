//
//  Mason.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit

@objc(NSCMason)
@objcMembers
public class NSCMason: NSObject {
    public internal (set) var nativePtr: OpaquePointer?
    public override init() {
        nativePtr = mason_init();
    }
    
    deinit {
        mason_destroy(nativePtr)
    }
    
    public func clear(){
        mason_clear(nativePtr)
    }
    
    public static let instance = NSCMason()
    
    public static var shared = false
    
    static let scale = Float(UIScreen.main.scale)
    
    public static var alwaysEnable = false
}
