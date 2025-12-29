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

enum ShadowParser {

  static func parseTextShadow(style: MasonStyle, value: String) -> [TextShadow] {
    return value
      .split(separator: ",")
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

  // MARK: - Helpers

  private static func splitByWhitespace(_ string: String) -> [String] {
    let range = NSRange(string.startIndex..<string.endIndex, in: string)
    let matches = SPLIT_REGEX.matches(in: string, range: range)

    var tokens: [String] = []
    var lastIndex = string.startIndex

    for match in matches {
      if let r = Range(match.range, in: string) {
        let token = String(string[lastIndex..<r.lowerBound])
        if !token.isEmpty {
          tokens.append(token)
        }
        lastIndex = r.upperBound
      }
    }

    let tail = String(string[lastIndex...])
    if !tail.isEmpty {
      tokens.append(tail)
    }

    return tokens
  }
}
