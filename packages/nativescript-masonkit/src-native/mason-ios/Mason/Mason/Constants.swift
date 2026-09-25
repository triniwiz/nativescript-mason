//
//  Constants.swift
//  Mason
//
//  Created by Osei Fortune on 05/11/2025.
//

import UIKit

internal struct Constants {
  static let AUTO_VALUE = "auto"

  static let PX_UNIT = "px"

  static let PERCENT_UNIT = "%"

  static let UNSET_COLOR = UInt32(0xDEADBEEF)

  static let VIEW_PLACEHOLDER = "[[view_placeholder]]"
  
  static let VIEW_PLACEHOLDER_KEY = NSAttributedString.Key(Constants.VIEW_PLACEHOLDER)
  
  static let FONT_STYLE = "[[font_style]]"
  
  static let FONT_WEIGHT = "[[font_weight]]"

  static let DEFAULT_FONT_SIZE: Int32 = 16

  /// Attributed-string key carrying a `MasonTextDecoration`; TextEngine draws it.
  static let DECORATION_KEY = NSAttributedString.Key("[[mason_decoration]]")
}

/// Everything TextEngine needs to draw one run's `text-decoration`.
final class MasonTextDecoration: NSObject {
  let line: DecorationLine
  let style: DecorationStyle
  let color: UIColor?
  /// Points; 0 is `auto` (the font's underline thickness).
  let thickness: CGFloat

  init(line: DecorationLine, style: DecorationStyle, color: UIColor?, thickness: CGFloat) {
    self.line = line
    self.style = style
    self.color = color
    self.thickness = thickness
  }

  // Value equality, so equal runs from different nodes still merge and a
  // dashed or wavy line does not restart at every attribute run.
  override func isEqual(_ object: Any?) -> Bool {
    guard let other = object as? MasonTextDecoration else { return false }
    return line == other.line && style == other.style && thickness == other.thickness && color == other.color
  }

  override var hash: Int {
    var hasher = Hasher()
    hasher.combine(line.rawValue)
    hasher.combine(style.rawValue)
    hasher.combine(thickness)
    hasher.combine(color?.toUInt32())
    return hasher.finalize()
  }
}
