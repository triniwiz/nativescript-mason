//
//  BorderParser.swift
//  Mason
//
//  Created by Osei Fortune on 25/11/2025.
//

import UIKit

// MARK: - Parsing


private let cssNames = [
  "none",
  "hidden",
  "dotted",
  "dashed",
  "solid",
  "double",
  "groove",
  "ridge",
  "inset",
  "outset"
]

private let lengthPercentageRegex = try! NSRegularExpression(pattern: "^(\\d+(?:\\.\\d+)?)(px|%|dip)$", options: [])

// Swift port of parseLengthPercentage
func parseLengthPercentage(_ value: String, scale: Float = NSCMason.scale) -> MasonLengthPercentage? {
  let v = value.trimmingCharacters(in: .whitespacesAndNewlines)
  guard let match = lengthPercentageRegex.firstMatch(in: v, range: NSRange(v.startIndex..<v.endIndex, in: v)) else {
    return nil
  }
  let ns = v as NSString
  let num = Float(Double(ns.substring(with: match.range(at: 1))) ?? 0)
  let unit = ns.substring(with: match.range(at: 2))
  
  
  switch unit {
  case "px": return .Points(num)
  case "%": return .Percent(num / 100)
  case "dip": return .Points(num * scale)
  default: return nil
  }
}


// Split regex
private let splitRegex = try! NSRegularExpression(pattern: "\\s+", options: [])


// MARK: - Parsing


extension CSSBorderRenderer {
  
  func parseBorderShorthand(_ value: String){
    let parsed = CSSBorderRenderer.parseBorderShorthand(value)
    if(parsed.color == nil && parsed.style == nil && parsed.width == nil){
      return
    }
    
    // Defaults
    var width = parsed.width ?? MasonLengthPercentage.Points(3) // medium
    var style = parsed.style ?? CSSBorderRenderer.BorderStyle.solid
    var color = parsed.color ?? UIColor.black
    
    // If only width is specified
    if parsed.width != nil && parsed.style == nil && parsed.color == nil {
      style = .solid
      color = .black
    }
    
    // If only style is specified
    if parsed.width == nil && parsed.style != nil && parsed.color == nil {
      width = MasonLengthPercentage.Points(3) // medium
      color = .black
    }
    
    // If only color is specified
    if parsed.width == nil && parsed.style == nil && parsed.color != nil {
      width = MasonLengthPercentage.Points(3) // medium
      style = .solid
    }
    
    css = value
    
    self.top.width = width
    self.top.style = style
    self.top.color = color
    
    self.right.width = width
    self.right.style = style
    self.right.color = color
    
    self.bottom.width = width
    self.bottom.style = style
    self.bottom.color = color
    
    self.left.width = width
    self.left.style = style
    self.left.color = color
    
    self.style.node.view?.setNeedsDisplay()
  }
  /// Parse CSS shorthand border: "1px solid red"
  static func parseBorderShorthand(_ value: String) -> (width: MasonLengthPercentage?, style: CSSBorderRenderer.BorderStyle?, color: UIColor?) {
    var width: MasonLengthPercentage? = nil
    var style: BorderStyle? = nil
    var color: UIColor? = nil
    
    
    let tokens = value.split(separator: " ").map { String($0).lowercased() }
    for t in tokens {
      if let s = BorderStyle(name: t) { style = s; continue }
      if let w = parseLengthPercentage(t) { width = w; continue }
      if let c = parseColor(t) { color = c; continue }
    }
    return (width, style, color)
  }
  
  
  
  static func parseBorderRadius(_ style: MasonStyle, _ value: String) {
      let parts = value
          .split(whereSeparator: { $0.isWhitespace })
          .compactMap { parseLengthPercentage(String($0)) }

      switch parts.count {
      case 1:
          let lp = parts[0]
          style.mBorderRender.radius.topLeft = CornerRadius(horizontal: lp, vertical: lp, exponent: 1)
          style.mBorderRender.radius.topRight = CornerRadius(horizontal: lp, vertical: lp, exponent: 1)
          style.mBorderRender.radius.bottomRight = CornerRadius(horizontal: lp, vertical: lp, exponent: 1)
          style.mBorderRender.radius.bottomLeft = CornerRadius(horizontal: lp, vertical: lp, exponent: 1)

      case 2:
        
        let first = parts[0]
        let second = parts[1]
        
        style.mBorderRender.radius.topLeft = CornerRadius(horizontal: first, vertical: first, exponent: 1)
        style.mBorderRender.radius.topRight = CornerRadius(horizontal: second, vertical: second, exponent: 1)
        style.mBorderRender.radius.bottomRight = CornerRadius(horizontal: first, vertical: first, exponent: 1)
        style.mBorderRender.radius.bottomLeft = CornerRadius(horizontal: second, vertical: second, exponent: 1)

      case 3:
        
        style.mBorderRender.radius.topLeft = CornerRadius(horizontal: parts[0], vertical: parts[0], exponent: 1)
        style.mBorderRender.radius.topRight = CornerRadius(horizontal: parts[1], vertical: parts[1], exponent: 1)
        style.mBorderRender.radius.bottomRight = CornerRadius(horizontal: parts[2], vertical: parts[2], exponent: 1)
        style.mBorderRender.radius.bottomLeft = CornerRadius(horizontal: parts[1], vertical: parts[1], exponent: 1)

      case 4:
        style.mBorderRender.radius.topLeft = CornerRadius(horizontal: parts[0], vertical: parts[0], exponent: 1)
        style.mBorderRender.radius.topRight = CornerRadius(horizontal: parts[1], vertical: parts[1], exponent: 1)
        style.mBorderRender.radius.bottomRight = CornerRadius(horizontal: parts[2], vertical: parts[2], exponent: 1)
        style.mBorderRender.radius.bottomLeft = CornerRadius(horizontal: parts[3], vertical: parts[3], exponent: 1)

      default:
          break
      }

    
      if !parts.isEmpty {
          if !style.inBatch {
            // border radius ?
            style.isDirty = Int64(StateKeys.border.rawValue)
            style.updateNativeStyle()
          }
      }
  }
}
