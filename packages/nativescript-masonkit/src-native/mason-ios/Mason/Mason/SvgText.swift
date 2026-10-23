//
//  SvgText.swift
//  Mason
//
//  Glyph outlines for SVG `<text>` (SvgParser.swift lays the runs out). Keep in step with SvgText.kt.
//

import UIKit
import CoreText

/// The font a run of SVG text asks for.
struct SvgFont: Hashable {
  var families: [String]
  var size: CGFloat
  var weight: Int
  var italic: Bool
}

/// One shaped run: outlines with the pen at (0, 0) on the alphabetic baseline, y down.
struct SvgTextRun {
  var commands: [SvgPathCommand]
  var advance: CGFloat
  var ascent: CGFloat
  /// Positive, below the baseline.
  var descent: CGFloat
  var xHeight: CGFloat
}

protocol SvgTextShaping {
  func shape(_ text: String, font: SvgFont, letterSpacing: CGFloat, wordSpacing: CGFloat) -> SvgTextRun
}

/// Swapped in tests for a font-independent shaper.
var svgTextShaper: SvgTextShaping = CoreTextSvgShaper()

/// Outlines are taken at this size and scaled, so tiny viewBox units keep their shape.
private let svgShapeSize: CGFloat = 100
/// Slant for an italic the family doesn't have, as browsers synthesize it.
private let svgObliqueSkew: CGFloat = 0.2

final class CoreTextSvgShaper: SvgTextShaping {
  private let lock = NSLock()
  private var fonts: [SvgFont: (CTFont, Bool)] = [:]

  /// The font at the shaping size, and whether it still needs a synthesized slant.
  private func ctFont(_ font: SvgFont) -> (CTFont, Bool) {
    var key = font
    key.size = svgShapeSize
    lock.lock()
    defer { lock.unlock() }
    if let cached = fonts[key] { return cached }
    let resolved = CoreTextSvgShaper.resolve(font)
    fonts[key] = resolved
    return resolved
  }

  private static func uiWeight(_ w: Int) -> UIFont.Weight {
    switch w {
    case ..<150: return .ultraLight
    case ..<250: return .thin
    case ..<350: return .light
    case ..<450: return .regular
    case ..<550: return .medium
    case ..<650: return .semibold
    case ..<750: return .bold
    case ..<850: return .heavy
    default: return .black
    }
  }

  private static func resolve(_ font: SvgFont) -> (CTFont, Bool) {
    let weight = uiWeight(font.weight)
    var base: UIFontDescriptor? = nil
    for family in font.families + ["serif"] {
      switch family.lowercased() {
      case "sans-serif", "system-ui", "-apple-system", "ui-sans-serif", "ui-rounded":
        base = UIFont.systemFont(ofSize: svgShapeSize, weight: weight).fontDescriptor
      case "serif", "ui-serif":
        base = UIFontDescriptor(fontAttributes: [.family: "Times New Roman", .traits: [UIFontDescriptor.TraitKey.weight: weight.rawValue]])
      case "monospace", "ui-monospace":
        base = UIFont.monospacedSystemFont(ofSize: svgShapeSize, weight: weight).fontDescriptor
      case "cursive":
        base = UIFontDescriptor(fontAttributes: [.family: "Snell Roundhand", .traits: [UIFontDescriptor.TraitKey.weight: weight.rawValue]])
      case "fantasy":
        base = UIFontDescriptor(fontAttributes: [.family: "Papyrus", .traits: [UIFontDescriptor.TraitKey.weight: weight.rawValue]])
      default:
        if !UIFont.fontNames(forFamilyName: family).isEmpty {
          base = UIFontDescriptor(fontAttributes: [.family: family, .traits: [UIFontDescriptor.TraitKey.weight: weight.rawValue]])
        } else if UIFont(name: family, size: svgShapeSize) != nil {
          base = UIFontDescriptor(fontAttributes: [.name: family])
        }
      }
      if base != nil { break }
    }
    var descriptor = base ?? UIFont.systemFont(ofSize: svgShapeSize).fontDescriptor
    var synthesize = false
    if font.italic {
      if let italic = descriptor.withSymbolicTraits(descriptor.symbolicTraits.union(.traitItalic)) {
        descriptor = italic
      } else {
        synthesize = true
      }
    }
    let ui = UIFont(descriptor: descriptor, size: svgShapeSize)
    if font.italic && !synthesize && !ui.fontDescriptor.symbolicTraits.contains(.traitItalic) { synthesize = true }
    return (ui as CTFont, synthesize)
  }

  func shape(_ text: String, font: SvgFont, letterSpacing: CGFloat, wordSpacing: CGFloat) -> SvgTextRun {
    let empty = SvgTextRun(commands: [], advance: 0, ascent: 0, descent: 0, xHeight: 0)
    guard font.size > 0, !text.isEmpty else { return empty }
    let (ct, oblique) = ctFont(font)
    let k = font.size / svgShapeSize
    let attributed = NSMutableAttributedString(string: text, attributes: [.font: ct])
    let ls = letterSpacing / k, ws = wordSpacing / k
    if ls != 0 {
      attributed.addAttribute(.kern, value: ls, range: NSRange(location: 0, length: attributed.length))
      // CSS drops optional ligatures once letters are spaced.
      attributed.addAttribute(.ligature, value: 0, range: NSRange(location: 0, length: attributed.length))
    }
    if ws != 0 {
      let ns = text as NSString
      for i in 0..<ns.length where ns.character(at: i) == 0x20 || ns.character(at: i) == 0xA0 {
        attributed.addAttribute(.kern, value: ls + ws, range: NSRange(location: i, length: 1))
      }
    }
    let line = CTLineCreateWithAttributedString(attributed)
    let width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
    var commands: [SvgPathCommand] = []
    let skew = oblique ? svgObliqueSkew : 0
    for run in CTLineGetGlyphRuns(line) as! [CTRun] {
      let attrs = CTRunGetAttributes(run) as NSDictionary
      let runFont = attrs[kCTFontAttributeName].map { $0 as! CTFont } ?? ct
      let count = CTRunGetGlyphCount(run)
      if count == 0 { continue }
      var glyphs = [CGGlyph](repeating: 0, count: count)
      var positions = [CGPoint](repeating: .zero, count: count)
      CTRunGetGlyphs(run, CFRange(location: 0, length: count), &glyphs)
      CTRunGetPositions(run, CFRange(location: 0, length: count), &positions)
      for g in 0..<count {
        guard let path = CTFontCreatePathForGlyph(runFont, glyphs[g], nil) else { continue }
        // Font units are y up; SVG is y down.
        var t = CGAffineTransform(a: k, b: 0, c: k * skew, d: -k, tx: positions[g].x * k, ty: -positions[g].y * k)
        guard let placed = path.copy(using: &t) else { continue }
        appendSvgCommands(placed, &commands)
      }
    }
    return SvgTextRun(commands: commands, advance: width * k, ascent: CTFontGetAscent(ct) * k,
                      descent: CTFontGetDescent(ct) * k, xHeight: CTFontGetXHeight(ct) * k)
  }
}

/// `path`'s elements as SVG commands.
func appendSvgCommands(_ path: CGPath, _ out: inout [SvgPathCommand]) {
  path.applyWithBlock { element in
    let p = element.pointee.points
    switch element.pointee.type {
    case .moveToPoint: out.append(.move(p[0].x, p[0].y))
    case .addLineToPoint: out.append(.line(p[0].x, p[0].y))
    case .addQuadCurveToPoint: out.append(.quad(p[0].x, p[0].y, p[1].x, p[1].y))
    case .addCurveToPoint: out.append(.cubic(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y))
    case .closeSubpath: out.append(.close)
    @unknown default: break
    }
  }
}
