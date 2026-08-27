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
    pattern: "^(-?(?:\\d*\\.\\d+|\\d+\\.\\d*|\\d+)(?:[eE][+-]?\\d+)?)(px|%|dip|em)?;?$",
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
  // Clamp values that exceed a practical maximum (e.g. Float.MAX_VALUE from
  // calc(infinity*1px) evaluated by NS's CSS parser) to avoid overflow.
  let rawNum = Float(parsed ?? 0)
  let num = max(-9999, min(9999, rawNum))

  let unitRange = match.range(at: 2)
  let unit: String? =
      unitRange.location != NSNotFound
      ? String(v[Range(unitRange, in: v)!])
      : nil

  switch unit {
  case "px": return .Points(num * scale)
  case "%": return .Percent(rawNum / 100)  // percentages don't overflow so use rawNum
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


func parseLengthPercentageAuto(_ value: String, scale: Float = NSCMason.scale) -> MasonLengthPercentageAuto? {
  let v = value.trimmingCharacters(in: .whitespacesAndNewlines)
  // "auto" has no numeric part, so it can never match lengthPercentageRegex
  // below (its first group is a mandatory digit run) — check it separately.
  if v == "auto" { return .Auto }
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
  case "px": return .Points(num * scale)
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
      return num
    }
    return num * scale
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

/// Split on top-level whitespace but preserve parentheses groups (e.g. "rgba(0, 1, 2)").
func splitTopLevelWhitespace(_ input: String) -> [String] {
  var result: [String] = []
  var current = ""
  var depth = 0
  for ch in input {
    if ch == "(" { depth += 1; current.append(ch); continue }
    if ch == ")" { depth = max(0, depth - 1); current.append(ch); continue }

    if ch.isWhitespace && depth == 0 {
      let trimmed = current.trimmingCharacters(in: .whitespacesAndNewlines)
      if !trimmed.isEmpty { result.append(trimmed) }
      current = ""
    } else {
      current.append(ch)
    }
  }
  let finalTrim = current.trimmingCharacters(in: .whitespacesAndNewlines)
  if !finalTrim.isEmpty { result.append(finalTrim) }
  return result
}


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
    (self.style.node.view as? MasonUIView)?.invalidateDrawFlags()
  }

  /// Parse a side-specific CSS border shorthand, e.g. `border-left: 4px solid #00B894`.
  func parseBorderSideShorthand(_ side: CSSBorderRenderer.Side, _ value: String) {
    let borderSide: BorderSide
    switch side {
    case .left: borderSide = self.left
    case .top: borderSide = self.top
    case .right: borderSide = self.right
    case .bottom: borderSide = self.bottom
    }

    if value.isEmpty {
      borderSide.width = .Points(0)
      borderSide.style = .none
      borderSide.color = .clear
      self.invalidateCache()
      (self.style.node.view as? MasonUIView)?.invalidateDrawFlags()
      return
    }

    let parsed = CSSBorderRenderer.parseBorderShorthand(value)
    if parsed.color == nil && parsed.style == nil && (parsed.widths == nil || parsed.widths!.isEmpty) {
      return
    }

    let width = (parsed.widths != nil && !parsed.widths!.isEmpty) ? parsed.widths![0] : MasonLengthPercentage.Points(3)
    let style = parsed.style ?? .solid
    let color = parsed.color ?? .black

    borderSide.width = width
    borderSide.style = style
    borderSide.color = color

    self.invalidateCache()
    (self.style.node.view as? MasonUIView)?.invalidateDrawFlags()
  }

  /// Parse CSS shorthand border: "1px solid red"
  static func parseBorderShorthand(_ value: String) -> (widths: [MasonLengthPercentage]?, style: CSSBorderRenderer.BorderStyle?, color: UIColor?) {
    var widths: [MasonLengthPercentage] = []
    var style: BorderStyle? = nil
    var color: UIColor? = nil

    let tokens = splitTopLevelWhitespace(value)
    for raw in tokens {
      let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
      let lower = t.lowercased()
      if let s = BorderStyle(name: lower) { style = s; continue }
      if let w = parseLengthPercentage(t) { widths.append(w); continue }
      if let c = parseColor(t) { color = c; continue }
    }
    return (widths.isEmpty ? nil : widths, style, color)
  }
  
  
  
  static func parseBorderRadius(_ style: MasonStyle, _ value: String) {
      // Support horizontal/vertical slash syntax: e.g. "10px 20px / 5px 6px"
      let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ";", with: "")
      let horizPart: String
      let vertPart: String
      if let slashRange = cleaned.range(of: "/") {
        horizPart = cleaned[..<slashRange.lowerBound].trimmingCharacters(in: .whitespaces)
        vertPart = cleaned[slashRange.upperBound...].trimmingCharacters(in: .whitespaces)
      } else {
        horizPart = cleaned
        vertPart = ""
      }

      let hTokens = horizPart.split(whereSeparator: { $0.isWhitespace }).compactMap { parseLengthPercentage(String($0)) }
      let vTokens = vertPart.isEmpty ? [] : vertPart.split(whereSeparator: { $0.isWhitespace }).compactMap { parseLengthPercentage(String($0)) }

      func mapTokens(_ tokens: [MasonLengthPercentage]) -> [(MasonLengthPercentage, MasonLengthPercentage)]? {
        switch tokens.count {
        case 1:
          return Array(repeating: (tokens[0], tokens[0]), count: 4)
        case 2:
          return [(tokens[0], tokens[0]), (tokens[1], tokens[1]), (tokens[0], tokens[0]), (tokens[1], tokens[1])]
        case 3:
          return [(tokens[0], tokens[0]), (tokens[1], tokens[1]), (tokens[2], tokens[2]), (tokens[1], tokens[1])]
        case 4:
          return [(tokens[0], tokens[0]), (tokens[1], tokens[1]), (tokens[2], tokens[2]), (tokens[3], tokens[3])]
        default:
          return nil
        }
      }

      guard let hMapped = mapTokens(hTokens) else { return }
      let vMappedPairs: [(MasonLengthPercentage, MasonLengthPercentage)]
      if vTokens.isEmpty {
        vMappedPairs = hMapped
      } else if let vm = mapTokens(vTokens) {
        // vm currently pairs each token with itself; we need separate horizontal/vertical
        // We'll combine: hMapped contains (h,h) pairs; vm contains (v,v) pairs
        vMappedPairs = zip(hMapped, vm).map { (hpair, vpair) in (hpair.0, vpair.0) }
      } else {
        return
      }

      let corners = vMappedPairs

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

  static func parsePaddingShorthand(_ style: MasonStyle, _ value: String) {
    let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ";", with: "")
    if cleaned.isEmpty {
      style.prepareMut()
      let zero = MasonLengthPercentage.Points(0)
      style.setInt8(StyleKeys.PADDING_LEFT_TYPE, zero.type)
      style.setFloat(StyleKeys.PADDING_LEFT_VALUE, zero.value)
      style.setInt8(StyleKeys.PADDING_RIGHT_TYPE, zero.type)
      style.setFloat(StyleKeys.PADDING_RIGHT_VALUE, zero.value)
      style.setInt8(StyleKeys.PADDING_TOP_TYPE, zero.type)
      style.setFloat(StyleKeys.PADDING_TOP_VALUE, zero.value)
      style.setInt8(StyleKeys.PADDING_BOTTOM_TYPE, zero.type)
      style.setFloat(StyleKeys.PADDING_BOTTOM_VALUE, zero.value)
      style.setOrAppendState(.padding)
      return
    }

    // CSS spec: an invalid token anywhere invalidates the whole shorthand
    let rawTokens = splitTopLevelWhitespace(cleaned)
    if rawTokens.isEmpty || rawTokens.count > 4 { return }
    let parsedTokens = rawTokens.map { parseLengthPercentage($0) }
    if parsedTokens.contains(where: { $0 == nil }) { return }
    let tokens = parsedTokens.compactMap { $0 }

    let mapped: [MasonLengthPercentage]
    switch tokens.count {
    case 1: mapped = [tokens[0], tokens[0], tokens[0], tokens[0]]
    case 2: mapped = [tokens[0], tokens[1], tokens[0], tokens[1]]
    case 3: mapped = [tokens[0], tokens[1], tokens[2], tokens[1]]
    default: mapped = [tokens[0], tokens[1], tokens[2], tokens[3]]
    }

    style.prepareMut()
    style.setInt8(StyleKeys.PADDING_LEFT_TYPE, mapped[3].type)
    style.setFloat(StyleKeys.PADDING_LEFT_VALUE, mapped[3].value)
    style.setInt8(StyleKeys.PADDING_RIGHT_TYPE, mapped[1].type)
    style.setFloat(StyleKeys.PADDING_RIGHT_VALUE, mapped[1].value)
    style.setInt8(StyleKeys.PADDING_TOP_TYPE, mapped[0].type)
    style.setFloat(StyleKeys.PADDING_TOP_VALUE, mapped[0].value)
    style.setInt8(StyleKeys.PADDING_BOTTOM_TYPE, mapped[2].type)
    style.setFloat(StyleKeys.PADDING_BOTTOM_VALUE, mapped[2].value)
    style.setOrAppendState(.padding)
  }

  static func parseMarginShorthand(_ style: MasonStyle, _ value: String) {
    let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ";", with: "")
    if cleaned.isEmpty {
      style.prepareMut()
      let zero = MasonLengthPercentageAuto.Points(0)
      style.setInt8(StyleKeys.MARGIN_LEFT_TYPE, zero.type)
      style.setFloat(StyleKeys.MARGIN_LEFT_VALUE, zero.value)
      style.setInt8(StyleKeys.MARGIN_RIGHT_TYPE, zero.type)
      style.setFloat(StyleKeys.MARGIN_RIGHT_VALUE, zero.value)
      style.setInt8(StyleKeys.MARGIN_TOP_TYPE, zero.type)
      style.setFloat(StyleKeys.MARGIN_TOP_VALUE, zero.value)
      style.setInt8(StyleKeys.MARGIN_BOTTOM_TYPE, zero.type)
      style.setFloat(StyleKeys.MARGIN_BOTTOM_VALUE, zero.value)
      style.setOrAppendState(.margin)
      return
    }

    // See the comment in parsePaddingShorthand above: an invalid token must
    // invalidate the whole shorthand, not just get silently dropped.
    let rawTokens = splitTopLevelWhitespace(cleaned)
    if rawTokens.isEmpty || rawTokens.count > 4 { return }
    let parsedTokens = rawTokens.map { parseLengthPercentageAuto($0) }
    if parsedTokens.contains(where: { $0 == nil }) { return }
    let tokens = parsedTokens.compactMap { $0 }

    let mapped: [MasonLengthPercentageAuto]
    switch tokens.count {
    case 1: mapped = [tokens[0], tokens[0], tokens[0], tokens[0]]
    case 2: mapped = [tokens[0], tokens[1], tokens[0], tokens[1]]
    case 3: mapped = [tokens[0], tokens[1], tokens[2], tokens[1]]
    default: mapped = [tokens[0], tokens[1], tokens[2], tokens[3]]
    }

    style.prepareMut()
    style.setInt8(StyleKeys.MARGIN_LEFT_TYPE, mapped[3].type)
    style.setFloat(StyleKeys.MARGIN_LEFT_VALUE, mapped[3].value)
    style.setInt8(StyleKeys.MARGIN_RIGHT_TYPE, mapped[1].type)
    style.setFloat(StyleKeys.MARGIN_RIGHT_VALUE, mapped[1].value)
    style.setInt8(StyleKeys.MARGIN_TOP_TYPE, mapped[0].type)
    style.setFloat(StyleKeys.MARGIN_TOP_VALUE, mapped[0].value)
    style.setInt8(StyleKeys.MARGIN_BOTTOM_TYPE, mapped[2].type)
    style.setFloat(StyleKeys.MARGIN_BOTTOM_VALUE, mapped[2].value)
    style.setOrAppendState(.margin)
  }

  static func parseInsetShorthand(_ style: MasonStyle, _ value: String) {
    let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ";", with: "")
    if cleaned.isEmpty {
      style.prepareMut()
      let zero = MasonLengthPercentageAuto.Points(0)
      style.setInt8(StyleKeys.INSET_LEFT_TYPE, zero.type)
      style.setFloat(StyleKeys.INSET_LEFT_VALUE, zero.value)
      style.setInt8(StyleKeys.INSET_RIGHT_TYPE, zero.type)
      style.setFloat(StyleKeys.INSET_RIGHT_VALUE, zero.value)
      style.setInt8(StyleKeys.INSET_TOP_TYPE, zero.type)
      style.setFloat(StyleKeys.INSET_TOP_VALUE, zero.value)
      style.setInt8(StyleKeys.INSET_BOTTOM_TYPE, zero.type)
      style.setFloat(StyleKeys.INSET_BOTTOM_VALUE, zero.value)
      style.setOrAppendState(.inset)
      return
    }

    // See the comment in parsePaddingShorthand above: an invalid token must
    // invalidate the whole shorthand, not just get silently dropped.
    let rawTokens = splitTopLevelWhitespace(cleaned)
    if rawTokens.isEmpty || rawTokens.count > 4 { return }
    let parsedTokens = rawTokens.map { parseLengthPercentageAuto($0) }
    if parsedTokens.contains(where: { $0 == nil }) { return }
    let tokens = parsedTokens.compactMap { $0 }

    let mapped: [MasonLengthPercentageAuto]
    switch tokens.count {
    case 1: mapped = [tokens[0], tokens[0], tokens[0], tokens[0]]
    case 2: mapped = [tokens[0], tokens[1], tokens[0], tokens[1]]
    case 3: mapped = [tokens[0], tokens[1], tokens[2], tokens[1]]
    default: mapped = [tokens[0], tokens[1], tokens[2], tokens[3]]
    }

    style.prepareMut()
    style.setInt8(StyleKeys.INSET_LEFT_TYPE, mapped[3].type)
    style.setFloat(StyleKeys.INSET_LEFT_VALUE, mapped[3].value)
    style.setInt8(StyleKeys.INSET_RIGHT_TYPE, mapped[1].type)
    style.setFloat(StyleKeys.INSET_RIGHT_VALUE, mapped[1].value)
    style.setInt8(StyleKeys.INSET_TOP_TYPE, mapped[0].type)
    style.setFloat(StyleKeys.INSET_TOP_VALUE, mapped[0].value)
    style.setInt8(StyleKeys.INSET_BOTTOM_TYPE, mapped[2].type)
    style.setFloat(StyleKeys.INSET_BOTTOM_VALUE, mapped[2].value)
    style.setOrAppendState(.inset)
  }

  // corner-shape
  // CSS syntax:
  //   corner-shape: round                      → exponent 1 on all corners (default)
  //   corner-shape: superellipse               → exponent 0.5 on all corners
  //   corner-shape: superellipse(0.3)          → exponent 0.3 on all corners
  //   corner-shape: squircle                   → alias for superellipse (0.5)
  //   corner-shape: notch                      → exponent 2 on all corners
  //   corner-shape: bevel                      → exponent 4 on all corners
  //   1–4 value shorthand follows CSS corner order: TL TR BR BL
  

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
