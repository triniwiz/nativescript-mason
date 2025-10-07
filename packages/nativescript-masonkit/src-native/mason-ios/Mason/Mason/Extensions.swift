//
//  Extensions.swift
//  Mason
//
//  Created by Osei Fortune on 24/09/2025.
//

import UIKit

let BLACK_COLOR = UInt32(bitPattern:-16777216)
let WHITE_COLOR = UInt32(bitPattern:-1)

extension UIColor {
  internal static let deviceCS = CGColorSpaceCreateDeviceRGB()
  internal static let greyCS = CGColorSpaceCreateDeviceGray()
  public static func colorFromARGB(_ argb: UInt32) -> UIColor {
    switch(argb){
    case BLACK_COLOR:
      return .black
    case WHITE_COLOR:
      return .white
    case 0:
      return .clear
    default:
      let a = CGFloat((argb >> 24) & 0xFF) / 255.0
      let r = CGFloat((argb >> 16) & 0xFF) / 255.0
      let g = CGFloat((argb >> 8) & 0xFF) / 255.0
      let b = CGFloat(argb & 0xFF) / 255.0
      
      return UIColor(cgColor: CGColor(srgbRed: r, green: g, blue: b, alpha: a))
    }
    
  }
  
  public static func colorFromRGBA(_ rgba: UInt32) -> UIColor {
    let r = CGFloat((rgba >> 24) & 0xFF) / 255.0
    let g = CGFloat((rgba >> 16) & 0xFF) / 255.0
    let b = CGFloat((rgba >> 8) & 0xFF) / 255.0
    let a = CGFloat(rgba & 0xFF) / 255.0
    
    return UIColor(cgColor: CGColor(srgbRed: r, green: g, blue: b, alpha: a))
  }
  
  
  public func toUInt32() -> UInt32 {
    var r: CGFloat = 0
    var g: CGFloat = 0
    var b: CGFloat = 0
    var a: CGFloat = 0
    
    self.getRed(&r, green: &g, blue: &b, alpha: &a)
    
    let red = UInt8(r * 255)
    let green = UInt8(g * 255)
    let blue = UInt8(b * 255)
    let alpha = UInt8(a * 255)
    
    let argb = (UInt32(alpha) << 24) | (UInt32(red) << 16) | (UInt32(green) << 8) | UInt32(blue)
    return argb
  }
  
}
