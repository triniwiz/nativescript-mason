import CoreText
import UIKit

// text-orientation for vertical text. Lines are laid out sideways and turned clockwise; a
// grapheme kept upright is kerned out to a cell of its own along the line and drawn turned back. The same table and rules are in Android VerticalText.kt and Windows VerticalText.h.

/// Code points whose Unicode Vertical_Orientation is U, Tu or Tr (UAX #50): upright under
/// `text-orientation: mixed`. Sorted start/end pairs.
private let uprightRanges: [UInt32] = [
  0x00A7, 0x00A7, 0x00A9, 0x00A9, 0x00AE, 0x00AE, 0x00B1, 0x00B1, 0x00BC, 0x00BE,
  0x00D7, 0x00D7, 0x00F7, 0x00F7, 0x02EA, 0x02EB, 0x1100, 0x11FF, 0x1401, 0x167F,
  0x18B0, 0x18FF, 0x2016, 0x2016, 0x2020, 0x2021, 0x2030, 0x2031, 0x203B, 0x203C,
  0x2042, 0x2042, 0x2047, 0x2049, 0x2051, 0x2051, 0x2065, 0x2065, 0x20DD, 0x20E0,
  0x20E2, 0x20E4, 0x2100, 0x2101, 0x2103, 0x2109, 0x210F, 0x210F, 0x2113, 0x2114,
  0x2116, 0x2117, 0x211E, 0x2123, 0x2125, 0x2125, 0x2127, 0x2127, 0x2129, 0x2129,
  0x212E, 0x212E, 0x2135, 0x213F, 0x2145, 0x214A, 0x214C, 0x214D, 0x214F, 0x2189,
  0x218C, 0x218F, 0x221E, 0x221E, 0x2234, 0x2235, 0x2300, 0x2307, 0x230C, 0x231F,
  0x2324, 0x232B, 0x237D, 0x239A, 0x23BE, 0x23CD, 0x23CF, 0x23CF, 0x23D1, 0x23DB,
  0x23E2, 0x2422, 0x2424, 0x24FF, 0x25A0, 0x2619, 0x2620, 0x2767, 0x2776, 0x2793,
  0x2B12, 0x2B2F, 0x2B50, 0x2B59, 0x2BB8, 0x2BFF, 0x2E50, 0x2E51, 0x2E80, 0xA4CF,
  0xA960, 0xA97F, 0xAC00, 0xD7FF, 0xE000, 0xFAFF, 0xFE10, 0xFE1F, 0xFE30, 0xFE6F,
  0xFF01, 0xFF60, 0xFFE0, 0xFFE7, 0xFFF0, 0xFFF8, 0xFFFC, 0xFFFD, 0x13000, 0x1345F,
  0x14400, 0x1467F, 0x16FE0, 0x18AFF, 0x1B000, 0x1B2FF, 0x1D000, 0x1D1FF, 0x1D2E0, 0x1D37F,
  0x1F000, 0x1F2FF, 0x1F300, 0x1F64F, 0x1F680, 0x1F77F, 0x1F900, 0x1FAFF, 0x20000, 0x3FFFD,
]

/// The Tr ones among them (brackets, the long vowel mark, wave dashes): their vertical forms
/// are the glyph turned, so they're drawn sideways, which turns them the same way.
private let rotatedRanges: [UInt32] = [
  0x2329, 0x232A, 0x3008, 0x3011, 0x3014, 0x301F, 0x3030, 0x3030, 0x30A0, 0x30A0,
  0x30FC, 0x30FC, 0xFE59, 0xFE5E, 0xFF08, 0xFF09, 0xFF0D, 0xFF0D, 0xFF1A, 0xFF1E,
  0xFF3B, 0xFF3B, 0xFF3D, 0xFF3D, 0xFF3F, 0xFF3F, 0xFF5B, 0xFF60, 0xFFE3, 0xFFE3,
]

private func inRanges(_ ranges: [UInt32], _ cp: UInt32) -> Bool {
  var lo = 0
  var hi = ranges.count / 2 - 1
  while lo <= hi {
    let mid = (lo + hi) / 2
    if cp < ranges[mid * 2] {
      hi = mid - 1
    } else if cp > ranges[mid * 2 + 1] {
      lo = mid + 1
    } else {
      return true
    }
  }
  return false
}

internal func isUprightInMixed(_ cp: UInt32) -> Bool {
  inRanges(uprightRanges, cp) && !inRanges(rotatedRanges, cp)
}

/// Ideographic commas and full stops, whose vertical alternates sit in the cell's corner.
internal func takesVerticalAlternate(_ cp: UInt32) -> Bool {
  cp == 0x3001 || cp == 0x3002 || cp == 0xFF0C || cp == 0xFF0E
}

/// Full-width characters advance 1em upright; others the font's ascent plus descent.
internal func isWideUpright(_ cp: UInt32) -> Bool {
  cp >= 0x2E80 || (0x1100...0x11FF).contains(cp)
}

// Controls, line breaks and format characters (zero-width spaces among them) keep their
// sideways advance. Spaces are upright too under `upright`, as in browsers.
private func staysSideways(_ scalar: Unicode.Scalar) -> Bool {
  switch scalar.properties.generalCategory {
  case .control, .format, .lineSeparator, .paragraphSeparator: return true
  default: return false
  }
}

/// A grapheme kept upright: the attribute value marking it, unique per grapheme so each is a
/// run of its own.
final class UprightGlyph: NSObject {
  let grapheme: String
  /// Its cell along the line, without letter spacing.
  let cell: CGFloat
  /// Full width: centred on the ideographic em box, as CSS's central baseline does.
  let wide: Bool
  init(_ grapheme: String, cell: CGFloat, wide: Bool) {
    self.grapheme = grapheme
    self.cell = cell
    self.wide = wide
  }
}

extension Constants {
  /// Marks a grapheme kept upright in vertical text; the value is an `UprightGlyph`.
  static let UPRIGHT_GLYPH_KEY = NSAttributedString.Key("[[mason_upright_glyph]]")
}

extension TextEngine {
  /// Gives each grapheme `orientation` keeps upright (0 mixed, 1 upright, 2 sideways) a cell
  /// along the line, by kerning its glyph out to the cell's width; line breaking stays the
  /// text's own. Inline boxes are left alone.
  static func applyUprightGlyphs(_ text: NSAttributedString, orientation: UInt8) -> NSAttributedString {
    if orientation == 2 || text.length == 0 { return text }
    let result = NSMutableAttributedString(attributedString: text)
    var marked = false
    let string = text.string as NSString
    string.enumerateSubstrings(
      in: NSRange(location: 0, length: string.length), options: .byComposedCharacterSequences
    ) { grapheme, range, _, _ in
      guard let grapheme, let scalar = grapheme.unicodeScalars.first else { return }
      let upright = orientation == 1
        ? !staysSideways(scalar) && !inRanges(rotatedRanges, scalar.value) : isUprightInMixed(scalar.value)
      guard upright else { return }
      let attributes = text.attributes(at: range.location, effectiveRange: nil)
      if attributes[Constants.VIEW_PLACEHOLDER_KEY] != nil
        || attributes[NSAttributedString.Key(kCTRunDelegateAttributeName as String)] != nil
      {
        return
      }
      guard let value = attributes[.font], CFGetTypeID(value as CFTypeRef) == CTFontGetTypeID()
      else { return }
      let font = value as! CTFont
      let wide = isWideUpright(scalar.value)
      let cell = wide ? CTFontGetSize(font) : CTFontGetAscent(font) + CTFontGetDescent(font)
      var plain = attributes
      plain[.kern] = nil
      let glyph = CTLineCreateWithAttributedString(NSAttributedString(string: grapheme, attributes: plain))
      let advance = CGFloat(CTLineGetTypographicBounds(glyph, nil, nil, nil))
      // Letter spacing stays on top of the cell. Kerning applies after a character, so it
      // goes on the grapheme's last one.
      // Snapped to 1/64pt: float noise in the font's metrics would otherwise push a line that
      // exactly fits past its width.
      let fill = ((cell - advance) * 64).rounded() / 64
      if fill != 0 {
        let spacing = (attributes[.kern] as? CGFloat) ?? 0
        result.addAttribute(
          .kern, value: fill + spacing, range: NSRange(location: NSMaxRange(range) - 1, length: 1))
      }
      result.addAttribute(Constants.UPRIGHT_GLYPH_KEY, value: UprightGlyph(grapheme, cell: cell, wide: wide), range: range)
      marked = true
    }
    return marked ? result : text
  }

  /// Draws an upright-glyph run turned back, centred in its cell on the line's central
  /// baseline. The context is in the sideways text frame vertical text is drawn in.
  func drawUprightRun(_ run: CTRun, attributes: NSDictionary, at lineOrigin: CGPoint, in context: CGContext) {
    guard let upright = attributes[Constants.UPRIGHT_GLYPH_KEY] as? UprightGlyph,
      let value = attributes[NSAttributedString.Key.font],
      CFGetTypeID(value as CFTypeRef) == CTFontGetTypeID()
    else { return }
    let font = value as! CTFont
    let ascent = CTFontGetAscent(font)
    let descent = CTFontGetDescent(font)
    var position = CGPoint.zero
    CTRunGetPositions(run, CFRange(location: 0, length: 1), &position)

    var glyphAttributes: [NSAttributedString.Key: Any] = [:]
    for case let (key as NSAttributedString.Key, attribute) in attributes {
      // The line's baseline shift (line-height) is the cell's, not the glyph's.
      if key == Constants.UPRIGHT_GLYPH_KEY || key == .kern || key == .baselineOffset { continue }
      glyphAttributes[key] = attribute
    }
    // Undo the sideways turn about the cell's centre: local x runs across the line, y up.
    let centre = CGPoint(
      x: lineOrigin.x + position.x + upright.cell / 2,
      y: lineOrigin.y + position.y + (ascent - descent) / 2)
    // The text position isn't part of the saved state; the line's other runs draw from it.
    let textPosition = context.textPosition
    context.saveGState()
    context.concatenate(CGAffineTransform(a: 0, b: 1, c: -1, d: 0, tx: centre.x, ty: centre.y))
    defer {
      context.restoreGState()
      context.textPosition = textPosition
    }

    let line = CTLineCreateWithAttributedString(NSAttributedString(string: upright.grapheme, attributes: glyphAttributes))
    var glyphAscent: CGFloat = 0
    var glyphDescent: CGFloat = 0
    let glyphWidth = CGFloat(CTLineGetTypographicBounds(line, &glyphAscent, &glyphDescent, nil))
    // The baseline in the cell: full-width glyphs centre their em box (0.12em below the
    // baseline to 0.88em above it), others their ascent and descent.
    let baseline = upright.wide ? -0.38 * CTFontGetSize(font) : -(glyphAscent - glyphDescent) / 2
    // Commas and full stops take their vertical alternate, in the cell's corner. Only vertical
    // forms substitute it, and drawn as a line CoreText turns it back, so it's drawn as a glyph
    // where the plain one would be: alternates share its design space.
    if let scalar = upright.grapheme.unicodeScalars.first, takesVerticalAlternate(scalar.value) {
      var formsAttributes = glyphAttributes
      formsAttributes[NSAttributedString.Key(kCTVerticalFormsAttributeName as String)] = true
      let forms = CTLineCreateWithAttributedString(NSAttributedString(string: upright.grapheme, attributes: formsAttributes))
      // Filled as an outline: CTFontDrawGlyphs draws nothing for some of these alternates.
      if let alternate = TextEngine.singleGlyph(forms),
        let outline = CTFontCreatePathForGlyph(alternate.font, alternate.glyph, nil), !outline.boundingBox.isEmpty {
        let color = (attributes[NSAttributedString.Key.foregroundColor] as? UIColor)?.cgColor ?? UIColor.black.cgColor
        context.translateBy(x: -glyphWidth / 2, y: baseline)
        context.addPath(outline)
        context.setFillColor(color)
        context.fillPath()
        return
      }
    }

    // Everything else as it is, centred in the cell.
    context.textPosition = CGPoint(x: -glyphWidth / 2, y: baseline)
    CTLineDraw(line, context)
  }

  /// The glyph and font of a line holding exactly one glyph.
  private static func singleGlyph(_ line: CTLine) -> (glyph: CGGlyph, font: CTFont)? {
    guard let runs = CTLineGetGlyphRuns(line) as? [CTRun], runs.count == 1, CTRunGetGlyphCount(runs[0]) == 1,
      let value = (CTRunGetAttributes(runs[0]) as NSDictionary)[kCTFontAttributeName],
      CFGetTypeID(value as CFTypeRef) == CTFontGetTypeID()
    else { return nil }
    var glyph = CGGlyph(0)
    CTRunGetGlyphs(runs[0], CFRange(location: 0, length: 1), &glyph)
    return (glyph, value as! CTFont)
  }
}
