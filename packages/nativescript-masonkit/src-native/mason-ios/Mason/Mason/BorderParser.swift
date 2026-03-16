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

private let lengthPercentageRegex = try! NSRegularExpression(
    pattern: "^(-?(?:\\d*\\.\\d+|\\d+\\.\\d*|\\d+))(px|%|dip|em)?;?$",
    options: []
)

// Swift port of parseLengthPercentage
func parseLengthPercentage(_ value: String, scale: Float = NSCMason.scale) -> MasonLengthPercentage? {
  let v = value.trimmingCharacters(in: .whitespacesAndNewlines)
  guard let match = lengthPercentageRegex.firstMatch(in: v, range: NSRange(v.startIndex..<v.endIndex, in: v)) else {
    return nil
  }
  let ns = v as NSString
  let parsed = Double(ns.substring(with: match.range(at: 1)))
  let num = Float(parsed ?? 0)

  let unitRange = match.range(at: 2)
  let unit: String? =
      unitRange.location != NSNotFound
      ? String(v[Range(unitRange, in: v)!])
      : nil
  
  switch unit {
  case "px": return .Points(num)
  case "%": return .Percent(num / 100)
  case "dip": return .Points(num * scale)
  default: do {
    if(parsed != nil){
      return .Points(num * scale)
    }else {
      return nil
    }
  }
  }
}


func parseLength(_ style: MasonStyle, _ value: String, scale: Float = NSCMason.scale, resolve: Bool = false) -> Float? {
  let v = value.trimmingCharacters(in: .whitespacesAndNewlines)
  guard let match = lengthPercentageRegex.firstMatch(in: v, range: NSRange(v.startIndex..<v.endIndex, in: v)) else {
    return nil
  }
  let ns = v as NSString
  let parsed = Double(ns.substring(with: match.range(at: 1)))
  let num = Float(parsed ?? 0)
  

  let unitRange = match.range(at: 2)
  let unit: String? =
      unitRange.location != NSNotFound
      ? String(v[Range(unitRange, in: v)!])
      : nil
  
  switch unit {
  case "px":
    if(resolve){
      return num / scale
    }
    return num
  case "%": return 0
  case "dip": return num * scale
  case "em": return (Float(style.fontSize) * scale) * num
  default: do {
    if(parsed != nil){
      return num * scale
    }else {
      return nil
    }
  }
  }
}

// Split regex
private let splitRegex = try! NSRegularExpression(pattern: "\\s+", options: [])


// MARK: - Parsing


extension CSSBorderRenderer {
  
  func parseBorderShorthand(_ value: String){
    let parsed = CSSBorderRenderer.parseBorderShorthand(value)
    if(parsed.color == nil && parsed.style == nil && (parsed.widths == nil || parsed.widths!.isEmpty)){
      return
    }
    
    // Defaults
    // Determine widths per CSS shorthand rules
    var width = MasonLengthPercentage.Points(3) // medium default
    let widthsList = parsed.widths ?? []
    if !widthsList.isEmpty {
      width = widthsList[0]
    }
    var style = parsed.style ?? CSSBorderRenderer.BorderStyle.solid
    var color = parsed.color ?? UIColor.black
    
    // If only width is specified
    if (parsed.widths != nil && !(parsed.widths!.isEmpty)) && parsed.style == nil && parsed.color == nil {
      style = .solid
      color = .black
    }
    
    // If only style is specified
    if (parsed.widths == nil || parsed.widths!.isEmpty) && parsed.style != nil && parsed.color == nil {
      width = MasonLengthPercentage.Points(3) // medium
      color = .black
    }
    
    // If only color is specified
    if (parsed.widths == nil || parsed.widths!.isEmpty) && parsed.style == nil && parsed.color != nil {
      width = MasonLengthPercentage.Points(3) // medium
      style = .solid
    }
    
    css = value
    
    // Map widths list to per-side values per CSS rules
    if widthsList.isEmpty {
      self.top.width = width
      self.right.width = width
      self.bottom.width = width
      self.left.width = width
    } else {
      switch widthsList.count {
      case 1:
        let w = widthsList[0]
        self.top.width = w; self.right.width = w; self.bottom.width = w; self.left.width = w
      case 2:
        let w0 = widthsList[0]; let w1 = widthsList[1]
        self.top.width = w0; self.bottom.width = w0; self.right.width = w1; self.left.width = w1
      case 3:
        let w0 = widthsList[0]; let w1 = widthsList[1]; let w2 = widthsList[2]
        self.top.width = w0; self.right.width = w1; self.left.width = w1; self.bottom.width = w2
      default:
        let w0 = widthsList[0]; let w1 = widthsList[1]; let w2 = widthsList[2]; let w3 = widthsList[3]
        self.top.width = w0; self.right.width = w1; self.bottom.width = w2; self.left.width = w3
      }
    }

    // Apply style and color to all sides
    self.top.style = style; self.top.color = color
    self.right.style = style; self.right.color = color
    self.bottom.style = style; self.bottom.color = color
    self.left.style = style; self.left.color = color

    self.invalidateCache()
    self.style.node.view?.setNeedsDisplay()
  }
  /// Parse CSS shorthand border: "1px solid red"
  static func parseBorderShorthand(_ value: String) -> (widths: [MasonLengthPercentage]?, style: CSSBorderRenderer.BorderStyle?, color: UIColor?) {
    var widths: [MasonLengthPercentage] = []
    var style: BorderStyle? = nil
    var color: UIColor? = nil

    let tokens = value.split(separator: " ").map { String($0).lowercased() }
    for t in tokens {
      if let s = BorderStyle(name: t) { style = s; continue }
      if let w = parseLengthPercentage(t) { widths.append(w); continue }
      if let c = parseColor(t) { color = c; continue }
    }
    return (widths.isEmpty ? nil : widths, style, color)
  }
  
  
  
  static func parseBorderRadius(_ style: MasonStyle, _ value: String) {
      let parts = value
          .split(whereSeparator: { $0.isWhitespace })
          .compactMap { parseLengthPercentage(String($0)) }

      // Map 1-4 values to corners per CSS spec
      let corners: [(MasonLengthPercentage, MasonLengthPercentage)]
      switch parts.count {
      case 1:
        corners = Array(repeating: (parts[0], parts[0]), count: 4)
      case 2:
        corners = [(parts[0], parts[0]), (parts[1], parts[1]),
                   (parts[0], parts[0]), (parts[1], parts[1])]
      case 3:
        corners = [(parts[0], parts[0]), (parts[1], parts[1]),
                   (parts[2], parts[2]), (parts[1], parts[1])]
      case 4:
        corners = [(parts[0], parts[0]), (parts[1], parts[1]),
                   (parts[2], parts[2]), (parts[3], parts[3])]
      default:
        return
      }

      // Write to style buffer and update struct
      let cornerKeys: [(xType: Int, xValue: Int, yType: Int, yValue: Int, exp: Int)] = [
        (StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE,
         StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE,
         StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT),
        (StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE,
         StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE,
         StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT),
        (StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE,
         StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE,
         StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT),
        (StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE,
         StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE,
         StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT),
      ]

      style.prepareMut()
      for (i, (h, v)) in corners.enumerated() {
        let k = cornerKeys[i]
        style.setInt8(k.xType, h.type)
        style.setFloat(k.xValue, h.value)
        style.setInt8(k.yType, v.type)
        style.setFloat(k.yValue, v.value)
        style.setFloat(k.exp, 1.0)
      }

      // Keep struct in sync for hasRadii() checks
      style.mBorderRender.radius.topLeft = CornerRadius(horizontal: corners[0].0, vertical: corners[0].1, exponent: 1)
      style.mBorderRender.radius.topRight = CornerRadius(horizontal: corners[1].0, vertical: corners[1].1, exponent: 1)
      style.mBorderRender.radius.bottomRight = CornerRadius(horizontal: corners[2].0, vertical: corners[2].1, exponent: 1)
      style.mBorderRender.radius.bottomLeft = CornerRadius(horizontal: corners[3].0, vertical: corners[3].1, exponent: 1)
      style.mBorderRender.invalidateCache()

      if !style.inBatch {
        style.isDirty |= StateKeys.border.low
        style.isDirtyHigh |= StateKeys.border.high
        style.updateNativeStyle()
      }
  }

  // ─── corner-shape ────────────────────────────────────────────────────────
  // CSS syntax:
  //   corner-shape: round                      → exponent 1 on all corners (default)
  //   corner-shape: superellipse               → exponent 0.5 on all corners
  //   corner-shape: superellipse(0.3)          → exponent 0.3 on all corners
  //   corner-shape: squircle                   → alias for superellipse (0.5)
  //   corner-shape: notch                      → exponent 2 on all corners
  //   corner-shape: bevel                      → exponent 4 on all corners
  //   1–4 value shorthand follows CSS corner order: TL TR BR BL
  // ─────────────────────────────────────────────────────────────────────────

  private static let cornerShapeTokenRegex = try! NSRegularExpression(
    pattern: "^(round|superellipse(?:\\((-?\\d+(?:\\.\\d+)?)\\))?|squircle|notch|bevel)$",
    options: [.caseInsensitive]
  )

  static func exponentToCornerShapeToken(_ exponent: Float) -> String {
    switch exponent {
    case 1.0: return "round"
    case 0.5: return "squircle"
    case 2.0: return "notch"
    case 4.0: return "bevel"
    default: return "superellipse(\(exponent))"
    }
  }

  static func parseCornerShapeToken(_ token: String) -> Float? {
    let t = token.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    let nsT = t as NSString
    guard let match = cornerShapeTokenRegex.firstMatch(
      in: t, range: NSRange(location: 0, length: nsT.length)
    ) else { return nil }

    let keyword = nsT.substring(with: match.range(at: 1))
    let expRange = match.range(at: 2)
    let explicitExp: Float? = expRange.location != NSNotFound
      ? Float(nsT.substring(with: expRange))
      : nil

    if keyword.hasPrefix("superellipse") { return explicitExp ?? 0.5 }
    switch keyword {
    case "squircle": return 0.5
    case "round":    return 1.0
    case "notch":    return 2.0
    case "bevel":    return 4.0
    default:         return nil
    }
  }

  static func parseCornerShape(_ style: MasonStyle, _ value: String) {
    let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines)
      .replacingOccurrences(of: ";", with: "")
    let tokens = cleaned.split(whereSeparator: { $0.isWhitespace })
    let exponents = tokens.compactMap { parseCornerShapeToken(String($0)) }
    guard !exponents.isEmpty else { return }

    let tl, tr, br, bl: Float
    switch exponents.count {
    case 1:
      tl = exponents[0]; tr = exponents[0]; br = exponents[0]; bl = exponents[0]
    case 2:
      tl = exponents[0]; tr = exponents[1]; br = exponents[0]; bl = exponents[1]
    case 3:
      tl = exponents[0]; tr = exponents[1]; br = exponents[2]; bl = exponents[1]
    default:
      tl = exponents[0]; tr = exponents[1]; br = exponents[2]; bl = exponents[3]
    }

    style.prepareMut()
    style.setFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, tl)
    style.setFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, tr)
    style.setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, br)
    style.setFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, bl)

    // Keep struct in sync
    style.mBorderRender.radius.topLeft.exponent = CGFloat(tl)
    style.mBorderRender.radius.topRight.exponent = CGFloat(tr)
    style.mBorderRender.radius.bottomRight.exponent = CGFloat(br)
    style.mBorderRender.radius.bottomLeft.exponent = CGFloat(bl)
    style.mBorderRender.invalidateCache()

    if !style.inBatch {
      style.isDirty |= StateKeys.border.low
      style.isDirtyHigh |= StateKeys.border.high
      style.updateNativeStyle()
    }
  }
}
