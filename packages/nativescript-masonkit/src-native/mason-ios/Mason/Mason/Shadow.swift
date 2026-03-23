//
//  Shadow.swift
//  Mason
//
//  Created by Osei Fortune on 21/12/2025.
//

import UIKit

private let SPLIT_REGEX = try! NSRegularExpression(pattern: "\\s+")

struct TextShadow {
  let offsetX: CGFloat
  let offsetY: CGFloat
  let blurRadius: CGFloat
  let color: UIColor
}

struct BoxShadow: Hashable {
  let offsetX: CGFloat
  let offsetY: CGFloat
  let blurRadius: CGFloat
  let spreadRadius: CGFloat
  let color: UIColor
  let inset: Bool
  
  func hash(into hasher: inout Hasher) {
    hasher.combine(offsetX)
    hasher.combine(offsetY)
    hasher.combine(blurRadius)
    hasher.combine(spreadRadius)
    hasher.combine(inset)
    // Hash color by its RGBA components
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
    color.getRed(&r, green: &g, blue: &b, alpha: &a)
    hasher.combine(r)
    hasher.combine(g)
    hasher.combine(b)
    hasher.combine(a)
  }
  
  static func == (lhs: BoxShadow, rhs: BoxShadow) -> Bool {
    var lr: CGFloat = 0, lg: CGFloat = 0, lb: CGFloat = 0, la: CGFloat = 0
    var rr: CGFloat = 0, rg: CGFloat = 0, rb: CGFloat = 0, ra: CGFloat = 0
    lhs.color.getRed(&lr, green: &lg, blue: &lb, alpha: &la)
    rhs.color.getRed(&rr, green: &rg, blue: &rb, alpha: &ra)
    return lhs.offsetX == rhs.offsetX &&
           lhs.offsetY == rhs.offsetY &&
           lhs.blurRadius == rhs.blurRadius &&
           lhs.spreadRadius == rhs.spreadRadius &&
           lhs.inset == rhs.inset &&
           lr == rr && lg == rg && lb == rb && la == ra
  }
}

enum ShadowParser {

  static func parseTextShadow(style: MasonStyle, value: String) -> [TextShadow] {
    return splitShadowLayers(value)
      .compactMap { rawShadow in
        let shadow = rawShadow.trimmingCharacters(in: .whitespacesAndNewlines)

        let tokens = splitByWhitespace(shadow)

        var offsetX: CGFloat?
        var offsetY: CGFloat?
        var blur: CGFloat = 0
        var color: UIColor?
        
        for token in tokens {
          if let length = parseLength(style, token, resolve: true) {
            if offsetX == nil {
              offsetX = CGFloat(length)
            } else if offsetY == nil {
              offsetY = CGFloat(length)
            } else {
              blur = max(0, CGFloat(length)) // blur must be ≥ 0
            }
            continue
          }

          if let parsedColor = parseColor(token) {
            color = parsedColor
          }
        }

        guard let x = offsetX, let y = offsetY else {
          return nil
        }
        
        return TextShadow(
          offsetX: x,
          offsetY: y,
          blurRadius: blur * 0.1,
          color: (color ?? .black).adjustedAlpha(1.15)
        )

      }
  }

  /// Parse CSS box-shadow value.
  /// Syntax: [inset] <offset-x> <offset-y> [blur-radius] [spread-radius] <color>
  /// Multiple shadows separated by commas are supported.
  static func parseBoxShadow(style: MasonStyle, value: String) -> [BoxShadow] {
    return splitShadowLayers(value)
      .compactMap { rawShadow in
        let shadow = rawShadow.trimmingCharacters(in: .whitespacesAndNewlines)
        let tokens = splitByWhitespace(shadow)

        var inset = false
        var lengths: [CGFloat] = []
        var color: UIColor?

        for token in tokens {
          // Check for inset keyword
          if token.lowercased() == "inset" {
            inset = true
            continue
          }

          // Try length first
          if let length = parseLength(style, token, resolve: true) {
            lengths.append(CGFloat(length))
            continue
          }

          // Try color
          if let parsedColor = parseColor(token) {
            color = parsedColor
          }
        }

        // Must have at least two lengths (offset-x and offset-y)
        guard lengths.count >= 2 else {
          return nil
        }

        let offsetX = lengths[0]
        let offsetY = lengths[1]
        let blur = lengths.count >= 3 ? max(0, lengths[2]) : 0
        let spread = lengths.count >= 4 ? lengths[3] : 0

        return BoxShadow(
          offsetX: offsetX,
          offsetY: offsetY,
          blurRadius: blur,
          spreadRadius: spread,
          color: color ?? .black,
          inset: inset
        )
      }
  }

  // MARK: - Helpers

  /// Tokenise keeping parenthesised groups (e.g. `rgba(0, 0, 0, 0.5)`) intact.
  private static func splitByWhitespace(_ string: String) -> [String] {
    var tokens: [String] = []
    var current = ""
    var depth = 0
    for ch in string {
      switch ch {
      case "(": depth += 1; current.append(ch)
      case ")": depth -= 1; current.append(ch)
      case _ where ch.isWhitespace && depth == 0:
        if !current.isEmpty { tokens.append(current); current = "" }
      default: current.append(ch)
      }
    }
    if !current.isEmpty { tokens.append(current) }
    return tokens
  }

  /// Split comma-separated shadow layers while respecting parenthesised groups.
  private static func splitShadowLayers(_ value: String) -> [String] {
    var layers: [String] = []
    var current = ""
    var depth = 0
    for ch in value {
      switch ch {
      case "(": depth += 1; current.append(ch)
      case ")": depth -= 1; current.append(ch)
      case "," where depth == 0:
        layers.append(current); current = ""
      default: current.append(ch)
      }
    }
    if !current.isEmpty { layers.append(current) }
    return layers
  }
}
