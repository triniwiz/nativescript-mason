import CoreText
import UIKit

// text-spacing-trim: full-width punctuation gives up its blank half next to other punctuation
// (every value but space-all), at the start of a line (trim-start, space-first past the first
// line, trim-both), at the end of a line (trim-both, else a closing bracket when that lets it
// fit, as Chrome does) or everywhere (trim-all). A mark's ink sits in one part of its em: a closing mark's at its start, an opening
// mark's at its end, a middle mark's in its centre. So the blank part goes by kerning, the ink
// drawn back by what went before it, which needs no font support; an upright cell in vertical
// text is halved instead (see VerticalText.swift). The same classes and rules are in Android
// SpacingTrim.kt and Windows SpacingTrim.h.

enum PunctuationWidth {
  case opening, closing, middle
}

// text-spacing-trim as stored: 0 normal, 1 space-all, 2 space-first, 3 trim-start, 4 trim-both,
// 5 trim-all, 6 auto (as normal).
let SPACING_TRIM_SPACE_ALL: UInt8 = 1
let SPACING_TRIM_SPACE_FIRST: UInt8 = 2
let SPACING_TRIM_START: UInt8 = 3
let SPACING_TRIM_BOTH: UInt8 = 4
let SPACING_TRIM_ALL: UInt8 = 5

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

private func isForcedBreak(_ c: unichar) -> Bool {
  c == 0x0A || c == 0x0D || c == 0x2028 || c == 0x2029
}

private func isBidiControl(_ c: unichar) -> Bool {
  (0x202A...0x202E).contains(c) || (0x2066...0x2069).contains(c)
}

/// Whether the character at `index` starts a paragraph: nothing but bidi controls before it
/// since the text's start or a forced break.
private func startsParagraph(_ string: NSString, _ index: Int) -> Bool {
  var i = index - 1
  while i >= 0 && isBidiControl(string.character(at: i)) { i -= 1 }
  return i < 0 || isForcedBreak(string.character(at: i))
}

private func endsParagraph(_ string: NSString, _ index: Int) -> Bool {
  var i = index + 1
  while i < string.length && isBidiControl(string.character(at: i)) { i += 1 }
  return i >= string.length || isForcedBreak(string.character(at: i))
}

/// A full-width mark set half-width.
final class HalfWidthPunctuation: NSObject {
  let kind: PunctuationWidth
  init(_ kind: PunctuationWidth) { self.kind = kind }

  /// The part of a half-width mark's dropped half that comes before its ink, as a fraction.
  static func leading(_ kind: PunctuationWidth) -> CGFloat {
    kind == .opening ? 1 : kind == .middle ? 0.5 : 0
  }
}

extension Constants {
  /// A run's text-spacing-trim when not normal, as a UInt8.
  static let SPACING_TRIM_KEY = NSAttributedString.Key("[[mason_spacing_trim]]")
  /// A mark set half-width; the value is a `HalfWidthPunctuation`.
  static let HALF_WIDTH_KEY = NSAttributedString.Key("[[mason_half_width]]")
  /// How far along the line a run's glyphs are drawn from where they are laid out, as a CGFloat.
  static let GLYPH_SHIFT_KEY = NSAttributedString.Key("[[mason_glyph_shift]]")
}

extension TextEngine {
  private static func spacingTrim(_ text: NSAttributedString, at index: Int) -> UInt8 {
    (text.attribute(Constants.SPACING_TRIM_KEY, at: index, effectiveRange: nil) as? UInt8) ?? 0
  }

  /// Marks the punctuation set half-width wherever the line breaks: next to other punctuation
  /// (an opening mark after a mark, a closing mark before a closing or middle one), at the
  /// start and end of each paragraph, and everywhere for trim-all. Horizontal text drops each
  /// blank half here; vertical text leaves the marks for its upright cells.
  static func applySpacingTrim(_ text: NSAttributedString, vertical: Bool) -> NSAttributedString {
    let string = text.string as NSString
    let length = string.length
    if length == 0 { return text }
    var result: NSMutableAttributedString?
    for i in 0..<length {
      guard let kind = fullWidthPunctuation(string.character(at: i)) else { continue }
      let mode = spacingTrim(text, at: i)
      if mode == SPACING_TRIM_SPACE_ALL { continue }
      let trimmed: Bool
      switch kind {
      case .opening:
        trimmed = mode == SPACING_TRIM_ALL || (i > 0 && fullWidthPunctuation(string.character(at: i - 1)) != nil)
          || ((mode == SPACING_TRIM_START || mode == SPACING_TRIM_BOTH) && startsParagraph(string, i))
      case .closing:
        let next = i + 1 < length ? fullWidthPunctuation(string.character(at: i + 1)) : nil
        trimmed = mode == SPACING_TRIM_ALL || next == .closing || next == .middle
          || (mode == SPACING_TRIM_BOTH && endsParagraph(string, i))
      case .middle:
        trimmed = mode == SPACING_TRIM_ALL
      }
      guard trimmed else { continue }
      let out = result ?? NSMutableAttributedString(attributedString: text)
      result = out
      out.addAttribute(Constants.HALF_WIDTH_KEY, value: HalfWidthPunctuation(kind), range: NSRange(location: i, length: 1))
      if !vertical { halveSideways(out, at: i, kind) }
    }
    return result ?? text
  }

  /// Drops the blank half of the mark at `index` by kerning it, and draws its ink back by the
  /// part of that half that was before it.
  static func halveSideways(_ text: NSMutableAttributedString, at index: Int, _ kind: PunctuationWidth) {
    guard let value = text.attribute(.font, at: index, effectiveRange: nil),
      CFGetTypeID(value as CFTypeRef) == CTFontGetTypeID()
    else { return }
    let range = NSRange(location: index, length: 1)
    let mark = (text.string as NSString).substring(with: range)
    let line = CTLineCreateWithAttributedString(NSAttributedString(string: mark, attributes: [.font: value]))
    let half = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) / 2
    let kern = (text.attribute(.kern, at: index, effectiveRange: nil) as? CGFloat) ?? 0
    text.addAttribute(.kern, value: kern - half, range: range)
    let shift = half * HalfWidthPunctuation.leading(kind)
    if shift != 0 { text.addAttribute(Constants.GLYPH_SHIFT_KEY, value: -shift, range: range) }
  }

  /// Sets the mark at `index` half-width, as an upright cell or sideways.
  private static func halve(_ text: NSMutableAttributedString, at index: Int, _ kind: PunctuationWidth) {
    var range = NSRange()
    if let upright = text.attribute(Constants.UPRIGHT_GLYPH_KEY, at: index, effectiveRange: &range) as? UprightGlyph {
      guard !upright.combined else { return }
      let last = NSRange(location: NSMaxRange(range) - 1, length: 1)
      let kern = (text.attribute(.kern, at: last.location, effectiveRange: nil) as? CGFloat) ?? 0
      text.addAttribute(.kern, value: kern - ((upright.cell / 2) * 64).rounded() / 64, range: last)
      text.addAttribute(Constants.UPRIGHT_GLYPH_KEY, value: UprightGlyph(halving: upright, kind), range: range)
    } else {
      halveSideways(text, at: index, kind)
    }
    text.addAttribute(Constants.HALF_WIDTH_KEY, value: HalfWidthPunctuation(kind), range: NSRange(location: index, length: 1))
  }

  /// Whether a soft line break could trim a mark of `text`: an opening mark that trims at the
  /// start of a line, or any closing mark, which trims at the end of one if that lets it fit.
  static func trimsAtLineEdges(_ text: NSAttributedString) -> Bool {
    let string = text.string as NSString
    for i in 0..<string.length {
      guard let kind = fullWidthPunctuation(string.character(at: i)), kind != .middle,
        text.attribute(Constants.HALF_WIDTH_KEY, at: i, effectiveRange: nil) == nil
      else { continue }
      let mode = spacingTrim(text, at: i)
      if mode == SPACING_TRIM_SPACE_ALL || mode == SPACING_TRIM_ALL { continue }
      if kind == .closing || mode == SPACING_TRIM_SPACE_FIRST || mode == SPACING_TRIM_START || mode == SPACING_TRIM_BOTH {
        return true
      }
    }
    return false
  }

  /// `text` laid out in `rect` with the marks trimmed at its soft line breaks: an opening mark
  /// starting a line, a closing mark ending one (trim-both), and one that would end a line if
  /// it were half-width, which is set so (every value that trims). Trims move the breaks, so the
  /// layout is redone until they settle.
  static func trimmingLineEdges(_ text: NSAttributedString, in rect: CGRect) -> NSAttributedString {
    let string = text.string as NSString
    let path = CGPath(rect: rect, transform: nil)
    var applied: [Int: PunctuationWidth] = [:]
    // Fitting trims whose line still broke before them.
    var rejected = Set<Int>()
    var current = text
    for _ in 0..<3 {
      let frame = CTFramesetterCreateFrame(TextEngine.framesetter(current), CFRange(location: 0, length: 0), path, nil)
      let lines = (CTFrameGetLines(frame) as? [CTLine] ?? []).filter { CTLineGetStringRange($0).length > 0 }
      guard lines.count > 1 else { break }
      let ranges = lines.map {
        let range = CTLineGetStringRange($0)
        return NSRange(location: range.location, length: range.length)
      }
      var desired: [Int: PunctuationWidth] = [:]
      for (n, range) in ranges.enumerated() {
        let start = range.location
        let end = range.location + range.length
        if n > 0, !startsParagraph(string, start), fullWidthPunctuation(string.character(at: start)) == .opening,
          text.attribute(Constants.HALF_WIDTH_KEY, at: start, effectiveRange: nil) == nil
        {
          let mode = spacingTrim(text, at: start)
          if mode == SPACING_TRIM_SPACE_FIRST || mode == SPACING_TRIM_START || mode == SPACING_TRIM_BOTH {
            desired[start] = .opening
          }
        }
        guard n + 1 < ranges.count, !isForcedBreak(string.character(at: end - 1)) else { continue }
        var last = end - 1
        while last > start && string.character(at: last) == 0x20 { last -= 1 }
        if closingToTrim(text, last) {
          if spacingTrim(text, at: last) == SPACING_TRIM_BOTH || applied[last] == .closing { desired[last] = .closing }
        }
        // A closing mark the line broke before, when half-width would let it end this one.
        guard let mark = pushedClosingMark(text, ranges[n + 1]), !rejected.contains(mark), applied[mark] == nil
        else { continue }
        let line = lines[n]
        let used = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) - CGFloat(CTLineGetTrailingWhitespaceWidth(line))
        let next = ranges[n + 1].location
        let piece = CTLineCreateWithAttributedString(
          current.attributedSubstring(from: NSRange(location: next, length: mark + 1 - next)))
        let pieceWidth = CGFloat(CTLineGetTypographicBounds(piece, nil, nil, nil))
        if used + pieceWidth - halfWidth(current, mark) <= available(text, rect.width, start) + 0.01 {
          desired[mark] = .closing
        }
      }
      for (index, kind) in applied where kind == .closing && desired[index] == nil {
        if spacingTrim(text, at: index) != SPACING_TRIM_BOTH { rejected.insert(index) }
      }
      if desired == applied { break }
      applied = desired
      if applied.isEmpty {
        current = text
        continue
      }
      let out = NSMutableAttributedString(attributedString: text)
      for (index, kind) in applied { halve(out, at: index, kind) }
      current = out
    }
    return current
  }

  /// Whether the mark at `index` is a closing one a line end may still trim.
  private static func closingToTrim(_ text: NSAttributedString, _ index: Int) -> Bool {
    let string = text.string as NSString
    guard fullWidthPunctuation(string.character(at: index)) == .closing,
      text.attribute(Constants.HALF_WIDTH_KEY, at: index, effectiveRange: nil) == nil
    else { return false }
    let mode = spacingTrim(text, at: index)
    return mode != SPACING_TRIM_SPACE_ALL && mode != SPACING_TRIM_ALL
  }

  /// The closing bracket ending the first word of the line `range`, which a line may not start
  /// with, so the break before the word was taken because of it.
  private static func pushedClosingMark(_ text: NSAttributedString, _ range: NSRange) -> Int? {
    let string = text.string as NSString
    let end = min(range.location + range.length, range.location + 8)
    var i = range.location + 1
    while i < end {
      let c = string.character(at: i)
      if c == 0x20 || isForcedBreak(c) { return nil }
      if let kind = fullWidthPunctuation(c) {
        guard kind == .closing else { return nil }
        // The last of a run of closing marks; the ones before it are trimmed already.
        var last = i
        while last + 1 < range.location + range.length, fullWidthPunctuation(string.character(at: last + 1)) == .closing {
          last += 1
        }
        // Chrome fits closing brackets this way but not commas and full stops.
        let c = string.character(at: last)
        if c == 0x3001 || c == 0x3002 || c == 0xFF0C || c == 0xFF0E { return nil }
        return closingToTrim(text, last) ? last : nil
      }
      i += 1
    }
    return nil
  }

  private static func halfWidth(_ text: NSAttributedString, _ index: Int) -> CGFloat {
    if let upright = text.attribute(Constants.UPRIGHT_GLYPH_KEY, at: index, effectiveRange: nil) as? UprightGlyph {
      return upright.cell / 2
    }
    guard let value = text.attribute(.font, at: index, effectiveRange: nil) else { return 0 }
    let mark = (text.string as NSString).substring(with: NSRange(location: index, length: 1))
    let line = CTLineCreateWithAttributedString(NSAttributedString(string: mark, attributes: [.font: value]))
    return CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) / 2
  }

  /// The width a line starting at `index` has in a frame `width` wide: less its paragraph's indents.
  private static func available(_ text: NSAttributedString, _ width: CGFloat, _ index: Int) -> CGFloat {
    guard let style = text.attribute(.paragraphStyle, at: index, effectiveRange: nil) as? NSParagraphStyle else {
      return width
    }
    let head = startsParagraph(text.string as NSString, index) ? style.firstLineHeadIndent : style.headIndent
    let tail = style.tailIndent > 0 ? width - style.tailIndent : -style.tailIndent
    return width - head - tail
  }
}
