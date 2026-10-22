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

/// The Tr ones among them (brackets, the long vowel mark, wave dashes): upright only as the
/// font's vertical form, else drawn sideways, which turns them the way that form does.
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

/// Full-width characters: drawn as their vertical forms, centred on the ideographic em box.
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
  /// The baseline's distance below the cell's top edge, across the upright glyph.
  let baseline: CGFloat
  /// The font's vertical form of the grapheme, drawn in its place; a nil font draws the
  /// grapheme itself.
  let form: CGGlyph
  let formFont: CTFont?
  /// text-combine-upright: the run's text set horizontally in one cell, squeezed by `squeeze`
  /// to fit it. `start` is where it begins in the text, so a run split by font fallback draws once.
  let combined: Bool
  let squeeze: CGFloat
  let start: Int
  init(_ grapheme: String, _ metrics: UprightMetrics) {
    self.grapheme = grapheme
    cell = metrics.cell
    baseline = metrics.baseline
    form = metrics.form
    formFont = metrics.formFont
    combined = false
    squeeze = 1
    start = 0
  }
  /// `glyph` set half-width: it keeps the part of its cell its ink is in.
  init(halving glyph: UprightGlyph, _ kind: PunctuationWidth) {
    grapheme = glyph.grapheme
    cell = glyph.cell / 2
    baseline = glyph.baseline - glyph.cell / 2 * HalfWidthPunctuation.leading(kind)
    form = glyph.form
    formFont = glyph.formFont
    combined = false
    squeeze = 1
    start = 0
  }
  init(combining text: String, at start: Int, cell: CGFloat, baseline: CGFloat, squeeze: CGFloat) {
    grapheme = text
    self.cell = cell
    self.baseline = baseline
    form = 0
    formFont = nil
    combined = true
    self.squeeze = squeeze
    self.start = start
  }
}

/// What the font says about a grapheme set upright.
struct UprightMetrics {
  let cell: CGFloat
  let baseline: CGFloat
  let form: CGGlyph
  let formFont: CTFont?
  /// The grapheme's own advance in the sideways line.
  let advance: CGFloat
}

extension Constants {
  /// Marks a grapheme kept upright in vertical text; the value is an `UprightGlyph`.
  static let UPRIGHT_GLYPH_KEY = NSAttributedString.Key("[[mason_upright_glyph]]")
  /// A run's text-orientation in vertical text (0 mixed, 1 upright, 2 sideways), as a UInt8.
  static let TEXT_ORIENTATION_KEY = NSAttributedString.Key("[[mason_text_orientation]]")
  /// A run's text-combine-upright in vertical text (1 all, 2-4 digits), as a UInt8.
  static let TEXT_COMBINE_KEY = NSAttributedString.Key("[[mason_text_combine]]")
}

private struct UprightKey: Hashable {
  let font: CTFont
  let grapheme: String
  func hash(into hasher: inout Hasher) {
    hasher.combine(CFHash(font))
    hasher.combine(grapheme)
  }
  static func == (a: UprightKey, b: UprightKey) -> Bool {
    a.grapheme == b.grapheme && CFEqual(a.font, b.font)
  }
}

private let uprightLock = NSLock()
private var uprightCache: [UprightKey: UprightMetrics?] = [:]
private let uprightCacheLimit = 4096
/// Whether a font has vertical metrics (vmtx) and vertical origins (VORG), by PostScript name.
private var verticalTables: [String: (vmtx: Bool, vorg: Bool)] = [:]
private let verticalFormsKey = NSAttributedString.Key(kCTVerticalFormsAttributeName as String)

private func tables(of font: CTFont) -> (vmtx: Bool, vorg: Bool) {
  let name = CTFontCopyPostScriptName(font) as String
  if let known = verticalTables[name] { return known }
  let found = (
    vmtx: CTFontCopyTable(font, CTFontTableTag(kCTFontTableVmtx), []) != nil,
    vorg: CTFontCopyTable(font, CTFontTableTag(kCTFontTableVORG), []) != nil)
  verticalTables[name] = found
  return found
}

extension TextEngine {
  /// Gives each grapheme its text-orientation keeps upright a cell along the line, by kerning
  /// its glyph out to the cell's width; line breaking stays the text's own. A run's orientation
  /// is its TEXT_ORIENTATION_KEY, else `orientation` (0 mixed, 1 upright, 2 sideways). Inline
  /// boxes are left alone.
  static func applyUprightGlyphs(_ text: NSAttributedString, orientation: UInt8) -> NSAttributedString {
    if text.length == 0 { return text }
    let whole = NSRange(location: 0, length: text.length)
    func has(_ key: NSAttributedString.Key) -> Bool {
      var found = false
      text.enumerateAttribute(key, in: whole) { value, _, stop in
        if value != nil {
          found = true
          stop.pointee = true
        }
      }
      return found
    }
    let combines = has(Constants.TEXT_COMBINE_KEY)
    if orientation == 2 && !combines && !has(Constants.HALF_WIDTH_KEY) {
      var other = false
      text.enumerateAttribute(Constants.TEXT_ORIENTATION_KEY, in: whole) { value, _, stop in
        if let value = value as? UInt8, value != 2 {
          other = true
          stop.pointee = true
        }
      }
      if !other { return text }
    }
    let result = NSMutableAttributedString(attributedString: text)
    var marked = combines && combineUpright(text, into: result)
    let string = text.string as NSString
    string.enumerateSubstrings(in: whole, options: .byComposedCharacterSequences) { grapheme, range, _, _ in
      guard let grapheme, let scalar = grapheme.unicodeScalars.first else { return }
      // Already part of a combined run.
      if marked && result.attribute(Constants.UPRIGHT_GLYPH_KEY, at: range.location, effectiveRange: nil) != nil { return }
      let attributes = text.attributes(at: range.location, effectiveRange: nil)
      let own = (attributes[Constants.TEXT_ORIENTATION_KEY] as? UInt8) ?? orientation
      // text-spacing-trim: a half-width mark set sideways is kerned as in horizontal text.
      let half = attributes[Constants.HALF_WIDTH_KEY] as? HalfWidthPunctuation
      func sideways() {
        if let half {
          halveSideways(result, at: range.location, half.kind)
          marked = true
        }
      }
      if own == 2 { return sideways() }
      let candidate = own == 1 ? !staysSideways(scalar) : inRanges(uprightRanges, scalar.value)
      guard candidate else { return sideways() }
      if attributes[Constants.VIEW_PLACEHOLDER_KEY] != nil
        || attributes[NSAttributedString.Key(kCTRunDelegateAttributeName as String)] != nil
      {
        return
      }
      guard let value = attributes[.font], CFGetTypeID(value as CFTypeRef) == CTFontGetTypeID()
      else { return }
      guard var metrics = uprightMetrics(grapheme, scalar.value, value as! CTFont) else { return sideways() }
      // A half-width mark keeps the part of its cell its ink is in: a closing mark's first half,
      // an opening mark's second, a middle mark's centre.
      if let half {
        metrics = UprightMetrics(
          cell: metrics.cell / 2, baseline: metrics.baseline - metrics.cell / 2 * HalfWidthPunctuation.leading(half.kind),
          form: metrics.form, formFont: metrics.formFont, advance: metrics.advance)
      }
      // Letter spacing stays on top of the cell. Kerning applies after a character, so it
      // goes on the grapheme's last one.
      // Snapped to 1/64pt: float noise in the font's metrics would otherwise push a line that
      // exactly fits past its width.
      let fill = ((metrics.cell - metrics.advance) * 64).rounded() / 64
      if fill != 0 {
        let spacing = (attributes[.kern] as? CGFloat) ?? 0
        result.addAttribute(
          .kern, value: fill + spacing, range: NSRange(location: NSMaxRange(range) - 1, length: 1))
      }
      result.addAttribute(Constants.UPRIGHT_GLYPH_KEY, value: UprightGlyph(grapheme, metrics), range: range)
      marked = true
    }
    return marked ? result : text
  }

  /// text-combine-upright: each run to combine (all of an element's text, or each run of up to
  /// N ASCII digits) becomes one upright 1em cell, its text set horizontally and squeezed to
  /// fit. Returns whether any was.
  private static func combineUpright(_ text: NSAttributedString, into result: NSMutableAttributedString) -> Bool {
    let string = text.string as NSString
    var combined = false
    func combine(_ range: NSRange) {
      let attributes = text.attributes(at: range.location, effectiveRange: nil)
      if attributes[Constants.VIEW_PLACEHOLDER_KEY] != nil { return }
      guard let value = attributes[.font], CFGetTypeID(value as CFTypeRef) == CTFontGetTypeID() else { return }
      let font = value as! CTFont
      let piece = string.substring(with: range)
      let line = CTLineCreateWithAttributedString(NSAttributedString(string: piece, attributes: [.font: font]))
      let advance = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
      let cell = CTFontGetSize(font)
      guard advance > 0 else { return }
      // Spread over the run's characters: CoreText caps a negative kern at one glyph's advance.
      let fill = ((cell - advance) / CGFloat(range.length) * 64).rounded() / 64
      if fill != 0 {
        let spacing = (attributes[.kern] as? CGFloat) ?? 0
        result.addAttribute(.kern, value: fill, range: NSRange(location: range.location, length: range.length - 1))
        result.addAttribute(.kern, value: fill + spacing, range: NSRange(location: NSMaxRange(range) - 1, length: 1))
      }
      let glyph = UprightGlyph(
        combining: piece, at: range.location, cell: cell, baseline: cell / 2 + 0.38 * cell, squeeze: min(1, cell / advance))
      result.addAttribute(Constants.UPRIGHT_GLYPH_KEY, value: glyph, range: range)
      combined = true
    }
    text.enumerateAttribute(Constants.TEXT_COMBINE_KEY, in: NSRange(location: 0, length: text.length)) { value, range, _ in
      guard let mode = value as? UInt8, mode != 0 else { return }
      if mode == 1 {
        combine(range)
        return
      }
      // Runs of up to `mode` digits; a longer run stays as it is.
      var i = range.location
      let end = NSMaxRange(range)
      while i < end {
        guard (0x30...0x39).contains(string.character(at: i)) else {
          i += 1
          continue
        }
        var j = i
        while j < end && (0x30...0x39).contains(string.character(at: j)) { j += 1 }
        if j - i <= Int(mode) { combine(NSRange(location: i, length: j - i)) }
        i = j
      }
    }
    return combined
  }

  /// The cell and glyph of `grapheme` set upright in `font`, or nil to leave it sideways.
  /// Full-width graphemes take the font's vertical form ('vert'), as small kana, commas and
  /// brackets have one; a bracket or other Tr character without one stays sideways. Cells are
  /// the font's vertical advance (vmtx), else the height of the font the glyph comes from.
  static func uprightMetrics(_ grapheme: String, _ cp: UInt32, _ font: CTFont) -> UprightMetrics? {
    let key = UprightKey(font: font, grapheme: grapheme)
    uprightLock.lock()
    defer { uprightLock.unlock() }
    if let known = uprightCache[key] { return known }
    if uprightCache.count >= uprightCacheLimit { uprightCache.removeAll(keepingCapacity: true) }
    let metrics = resolveUprightMetrics(grapheme, cp, font)
    uprightCache[key] = .some(metrics)
    return metrics
  }

  private static func resolveUprightMetrics(_ grapheme: String, _ cp: UInt32, _ font: CTFont) -> UprightMetrics? {
    let rotated = inRanges(rotatedRanges, cp)
    let wide = rotated || isWideUpright(cp)
    let size = CTFontGetSize(font)
    let line = CTLineCreateWithAttributedString(NSAttributedString(string: grapheme, attributes: [.font: font]))
    var glyphAscent: CGFloat = 0
    var glyphDescent: CGFloat = 0
    let advance = CGFloat(CTLineGetTypographicBounds(line, &glyphAscent, &glyphDescent, nil))
    var cell = wide ? size : CTFontGetAscent(font) + CTFontGetDescent(font)
    // Full width: the ideographic em box is centred (0.12em below the baseline to 0.88em above
    // it), as CSS's central baseline does; otherwise the glyph's ascent and descent.
    var baseline = wide ? cell / 2 + 0.38 * size : cell / 2 + (glyphAscent - glyphDescent) / 2
    guard let plain = singleGlyph(line) else {
      return rotated ? nil : UprightMetrics(cell: cell, baseline: baseline, form: 0, formFont: nil, advance: advance)
    }
    var form = plain.glyph
    if wide {
      let forms = CTLineCreateWithAttributedString(
        NSAttributedString(string: grapheme, attributes: [.font: font, verticalFormsKey: true]))
      // The line's font is a vertical copy of the same face.
      if let alternate = singleGlyph(forms),
        CTFontCopyPostScriptName(alternate.font) as String == CTFontCopyPostScriptName(plain.font) as String
      {
        form = alternate.glyph
      }
    }
    if rotated && form == plain.glyph { return nil }
    let vertical = tables(of: plain.font)
    var vadvance = CGSize.zero
    if vertical.vmtx {
      var glyph = form
      CTFontGetAdvancesForGlyphs(plain.font, .vertical, &glyph, &vadvance, 1)
    }
    cell = vadvance.width > 0 ? vadvance.width : CTFontGetAscent(plain.font) + CTFontGetDescent(plain.font)
    baseline = wide ? cell / 2 + 0.38 * size : cell / 2 + (glyphAscent - glyphDescent) / 2
    // The font's own vertical origin. Without VORG CoreText guesses, a cell off in some
    // system fallbacks.
    if vertical.vorg {
      var glyph = form
      var translation = CGSize.zero
      CTFontGetVerticalTranslationsForGlyphs(plain.font, &glyph, &translation, 1)
      if translation.height < 0 { baseline = -translation.height }
    }
    return UprightMetrics(
      cell: cell, baseline: baseline, form: form, formFont: form == plain.glyph ? nil : plain.font, advance: advance)
  }

  /// Draws an upright-glyph run turned back in its cell, across the line's central baseline.
  /// The context is in the sideways text frame vertical text is drawn in.
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
    let baseline = upright.cell / 2 - upright.baseline

    var glyphAttributes: [NSAttributedString.Key: Any] = [:]
    for case let (key as NSAttributedString.Key, attribute) in attributes {
      // The line's baseline shift (line-height) is the cell's, not the glyph's.
      if key == Constants.UPRIGHT_GLYPH_KEY || key == .kern || key == .baselineOffset { continue }
      glyphAttributes[key] = attribute
    }

    // A combined run: its text across the cell, squeezed to fit, drawn once for the whole run.
    if upright.combined {
      guard CTRunGetStringRange(run).location == upright.start else { return }
      let line = CTLineCreateWithAttributedString(NSAttributedString(string: upright.grapheme, attributes: glyphAttributes))
      let width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
      context.scaleBy(x: upright.squeeze, y: 1)
      context.textPosition = CGPoint(x: -width / 2, y: baseline)
      CTLineDraw(line, context)
      return
    }

    // A vertical form: only vertical forms substitute it, and drawn as a line CoreText turns it
    // back, so it's drawn as a glyph. Filled as an outline: CTFontDrawGlyphs draws nothing for
    // some of these alternates.
    if let formFont = upright.formFont,
      let outline = CTFontCreatePathForGlyph(formFont, upright.form, nil), !outline.boundingBox.isEmpty
    {
      var glyph = upright.form
      let width = CGFloat(CTFontGetAdvancesForGlyphs(formFont, .horizontal, &glyph, nil, 1))
      let color = (attributes[NSAttributedString.Key.foregroundColor] as? UIColor)?.cgColor ?? UIColor.black.cgColor
      context.translateBy(x: -width / 2, y: baseline)
      context.addPath(outline)
      context.setFillColor(color)
      context.fillPath()
      return
    }

    let line = CTLineCreateWithAttributedString(NSAttributedString(string: upright.grapheme, attributes: glyphAttributes))
    let glyphWidth = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
    context.textPosition = CGPoint(x: -glyphWidth / 2, y: baseline)
    CTLineDraw(line, context)
  }

  /// The glyph and font of a line holding exactly one glyph.
  fileprivate static func singleGlyph(_ line: CTLine) -> (glyph: CGGlyph, font: CTFont)? {
    guard let runs = CTLineGetGlyphRuns(line) as? [CTRun], runs.count == 1, CTRunGetGlyphCount(runs[0]) == 1,
      let value = (CTRunGetAttributes(runs[0]) as NSDictionary)[kCTFontAttributeName],
      CFGetTypeID(value as CFTypeRef) == CTFontGetTypeID()
    else { return nil }
    var glyph = CGGlyph(0)
    CTRunGetGlyphs(runs[0], CFRange(location: 0, length: 1), &glyph)
    return (glyph, value as! CTFont)
  }
}
