import CoreText
import UIKit

// text-spacing-trim: full-width punctuation next to other punctuation gives up its blank half
// (CSS Text 4's trim-adjacent, part of `normal`). A mark's ink sits in one half of its em: a
// closing mark's at its start, an opening mark's at its end. So the blank half goes by kerning,
// which needs no font support, and an upright cell in vertical text is halved instead (see
// VerticalText.swift). The same classes and rules are in Android SpacingTrim.kt and Windows
// SpacingTrim.h.

enum PunctuationWidth {
  case opening, closing, middle
}

/// The full-width punctuation class of a UTF-16 unit, or nil.
internal func fullWidthPunctuation(_ c: unichar) -> PunctuationWidth? {
  switch c {
  case 0x3008, 0x300A, 0x300C, 0x300E, 0x3010, 0x3014, 0x3016, 0x3018, 0x301A, 0x301D, 0xFF08, 0xFF3B, 0xFF5B,
    0xFF5F:
    return .opening
  case 0x3001, 0x3002, 0x3009, 0x300B, 0x300D, 0x300F, 0x3011, 0x3015, 0x3017, 0x3019, 0x301B, 0x301E, 0x301F,
    0xFF09, 0xFF0C, 0xFF0E, 0xFF3D, 0xFF5D, 0xFF60:
    return .closing
  case 0x30FB, 0xFF1A, 0xFF1B:
    return .middle
  default:
    return nil
  }
}

/// A full-width mark set half-width: an opening mark drops its start half, a closing one its end half.
final class HalfWidthPunctuation: NSObject {
  let opening: Bool
  init(opening: Bool) { self.opening = opening }
}

extension Constants {
  /// A run whose text-spacing-trim is `space-all`, which trims nothing.
  static let SPACING_TRIM_OFF_KEY = NSAttributedString.Key("[[mason_spacing_trim_off]]")
  /// A mark set half-width; the value is a `HalfWidthPunctuation`.
  static let HALF_WIDTH_KEY = NSAttributedString.Key("[[mason_half_width]]")
}

extension TextEngine {
  /// Marks the punctuation trim-adjacent sets half-width: an opening mark after an opening,
  /// closing or middle mark, and a closing mark before a closing or middle mark. Horizontal text
  /// drops each blank half by kerning; vertical text leaves the marks for its upright cells.
  static func applySpacingTrim(_ text: NSAttributedString, vertical: Bool) -> NSAttributedString {
    let string = text.string as NSString
    let length = string.length
    if length < 2 { return text }
    var result: NSMutableAttributedString?
    var previous = fullWidthPunctuation(string.character(at: 0))
    for i in 0..<length {
      let current = previous
      previous = i + 1 < length ? fullWidthPunctuation(string.character(at: i + 1)) : nil
      guard let kind = current else { continue }
      let next = previous
      let trimmed: Bool
      switch kind {
      case .opening:
        trimmed = i > 0 && fullWidthPunctuation(string.character(at: i - 1)) != nil
      case .closing:
        trimmed = next == .closing || next == .middle
      case .middle:
        trimmed = false
      }
      guard trimmed, text.attribute(Constants.SPACING_TRIM_OFF_KEY, at: i, effectiveRange: nil) == nil else { continue }
      let out = result ?? NSMutableAttributedString(attributedString: text)
      result = out
      out.addAttribute(Constants.HALF_WIDTH_KEY, value: HalfWidthPunctuation(opening: kind == .opening), range: NSRange(location: i, length: 1))
      if !vertical { kernHalfWidth(out, at: i, opening: kind == .opening) }
    }
    return result ?? text
  }

  /// Drops the blank half of the mark at `index` by kerning: after a closing mark, before an
  /// opening one (on the character before it).
  static func kernHalfWidth(_ text: NSMutableAttributedString, at index: Int, opening: Bool) {
    let target = opening ? index - 1 : index
    guard target >= 0,
      let value = text.attribute(.font, at: index, effectiveRange: nil),
      CFGetTypeID(value as CFTypeRef) == CTFontGetTypeID()
    else { return }
    let mark = (text.string as NSString).substring(with: NSRange(location: index, length: 1))
    let line = CTLineCreateWithAttributedString(NSAttributedString(string: mark, attributes: [.font: value]))
    let half = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) / 2
    let kern = (text.attribute(.kern, at: target, effectiveRange: nil) as? CGFloat) ?? 0
    text.addAttribute(.kern, value: kern - half, range: NSRange(location: target, length: 1))
  }
}
