import CoreText
import XCTest
@testable import Mason

final class TextOrientationTests: XCTestCase {

  private let font = CTFontCreateUIFontForLanguage(.system, 20, nil)!

  private func text(_ string: String) -> NSAttributedString {
    NSAttributedString(string: string, attributes: [.font: font])
  }

  /// Indices of the UTF-16 units marked upright.
  private func upright(_ string: String, _ orientation: UInt8) -> [Int] {
    let marked = TextEngine.applyUprightGlyphs(text(string), orientation: orientation)
    var out: [Int] = []
    for i in 0..<marked.length where marked.attribute(Constants.UPRIGHT_GLYPH_KEY, at: i, effectiveRange: nil) != nil {
      out.append(i)
    }
    return out
  }

  func test_mixed_keeps_cjk_and_bracket_vertical_forms_upright_and_turns_latin() {
    // 漢 a 「 字 」 、
    XCTAssertEqual(upright("漢a「字」、", 0), [0, 2, 3, 4, 5])
  }

  func test_upright_keeps_latin_and_spaces_upright_but_not_zero_width_spaces() {
    XCTAssertEqual(upright("A B\u{200B}C", 1), [0, 1, 2, 4])
  }

  func test_sideways_marks_nothing() {
    let source = text("漢字")
    XCTAssertTrue(TextEngine.applyUprightGlyphs(source, orientation: 2) === source)
  }

  func test_a_grapheme_is_one_cell() {
    // e + combining acute, then an emoji with a skin tone modifier.
    XCTAssertEqual(upright("e\u{301}👍🏽", 1), [0, 1, 2, 3, 4, 5])
    let marked = TextEngine.applyUprightGlyphs(text("e\u{301}"), orientation: 1)
    var range = NSRange()
    _ = marked.attribute(
      Constants.UPRIGHT_GLYPH_KEY, at: 0, longestEffectiveRange: &range, in: NSRange(location: 0, length: marked.length))
    XCTAssertEqual(range.length, 2)
  }

  func test_full_width_cells_are_the_fonts_vertical_advance() {
    let hiragino = CTFontCreateWithName("HiraginoSans-W3" as CFString, 20, nil)
    let marked = TextEngine.applyUprightGlyphs(
      NSAttributedString(string: "漢漢漢", attributes: [.font: hiragino]), orientation: 0)
    let line = CTLineCreateWithAttributedString(marked)
    XCTAssertEqual(CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)), 60, accuracy: 0.05)

    // The system font's CJK fallback has its own vertical advance, under 1em.
    let fallback = TextEngine.applyUprightGlyphs(text("漢"), orientation: 0)
    let glyph = try! XCTUnwrap(fallback.attribute(Constants.UPRIGHT_GLYPH_KEY, at: 0, effectiveRange: nil) as? UprightGlyph)
    let run = (CTLineGetGlyphRuns(CTLineCreateWithAttributedString(text("漢"))) as! [CTRun])[0]
    let runFont = (CTRunGetAttributes(run) as NSDictionary)[kCTFontAttributeName] as! CTFont
    var g = CGGlyph(0)
    CTRunGetGlyphs(run, CFRange(location: 0, length: 1), &g)
    var advance = CGSize.zero
    CTFontGetAdvancesForGlyphs(runFont, .vertical, &g, &advance, 1)
    XCTAssertEqual(glyph.cell, advance.width, accuracy: 0.01)
  }

  func test_small_kana_and_brackets_take_vertical_forms() {
    let hiragino = CTFontCreateWithName("HiraginoSans-W3" as CFString, 20, nil)
    let marked = TextEngine.applyUprightGlyphs(
      NSAttributedString(string: "ぁ「あ", attributes: [.font: hiragino]), orientation: 0)
    let forms = (0..<3).map { i in
      (marked.attribute(Constants.UPRIGHT_GLYPH_KEY, at: i, effectiveRange: nil) as? UprightGlyph)?.formFont != nil
    }
    XCTAssertEqual(forms, [true, true, false])
  }

  func test_a_runs_orientation_overrides_the_paragraphs() {
    let source = NSMutableAttributedString(string: "AB漢字", attributes: [.font: font])
    source.addAttribute(Constants.TEXT_ORIENTATION_KEY, value: UInt8(1), range: NSRange(location: 1, length: 1))
    source.addAttribute(Constants.TEXT_ORIENTATION_KEY, value: UInt8(2), range: NSRange(location: 3, length: 1))
    var out: [Int] = []
    let marked = TextEngine.applyUprightGlyphs(source, orientation: 0)
    for i in 0..<marked.length where marked.attribute(Constants.UPRIGHT_GLYPH_KEY, at: i, effectiveRange: nil) != nil {
      out.append(i)
    }
    XCTAssertEqual(out, [1, 2])

    // A sideways paragraph still keeps an upright run's glyphs upright.
    let sideways = NSMutableAttributedString(string: "漢字", attributes: [.font: font])
    sideways.addAttribute(Constants.TEXT_ORIENTATION_KEY, value: UInt8(0), range: NSRange(location: 1, length: 1))
    let turned = TextEngine.applyUprightGlyphs(sideways, orientation: 2)
    XCTAssertNil(turned.attribute(Constants.UPRIGHT_GLYPH_KEY, at: 0, effectiveRange: nil))
    XCTAssertNotNil(turned.attribute(Constants.UPRIGHT_GLYPH_KEY, at: 1, effectiveRange: nil))
  }

  func test_narrow_upright_cells_are_the_fonts_height() {
    let marked = TextEngine.applyUprightGlyphs(text("AB"), orientation: 1)
    let line = CTLineCreateWithAttributedString(marked)
    let cell = CTFontGetAscent(font) + CTFontGetDescent(font)
    XCTAssertEqual(CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)), cell * 2, accuracy: 0.05)
  }

  // MARK: UA margins as logical sides

  /// A <p> in a vertical-rl root `height` points tall, laid out.
  private func verticalParagraph(_ configure: (MasonText) -> Void = { _ in }) -> MasonText {
    let mason = NSCMason.shared
    let scale = CGFloat(NSCMason.scale)
    let root = mason.createView()
    root.style.prepareMut()
    root.style.setUInt8(StyleKeys.WRITING_MODE, 1)
    root.style.setUInt8(StyleKeys.WRITING_MODE_STATE, 1)
    root.syncStyle(low: StateKeys.writingMode.low, high: StateKeys.writingMode.high)
    root.style.setSizeHeight(MasonDimension.Points(Float(200 * scale)))
    let p = mason.createTextView(type: .P)
    root.addView(p)
    p.mason_addChildAt(node: mason.createTextNode("縦書き"), 0)
    configure(p)
    root.compute(-1, -1)
    keptViews.append(root)
    return p
  }

  private var keptViews: [UIView] = []

  func test_a_vertical_paragraphs_ua_margins_are_on_its_left_and_right() {
    let p = verticalParagraph()
    let layout = p.layout()
    let em = Float(16 * NSCMason.scale)
    XCTAssertEqual(layout.marginRight, em, accuracy: 0.5)
    XCTAssertEqual(layout.marginLeft, em, accuracy: 0.5)
    XCTAssertEqual(layout.marginTop, 0)
    XCTAssertEqual(layout.marginBottom, 0)
  }

  func test_a_native_margin_overrides_the_ua_margins() {
    let p = verticalParagraph { p in
      p.style.margin = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
    }
    let layout = p.layout()
    XCTAssertEqual(layout.marginRight, 0)
    XCTAssertEqual(layout.marginLeft, 0)
  }

  // MARK: text-combine-upright

  private func combined(_ string: String, _ mode: UInt8) -> NSAttributedString {
    let source = NSMutableAttributedString(string: string, attributes: [.font: font])
    source.addAttribute(Constants.TEXT_COMBINE_KEY, value: mode, range: NSRange(location: 0, length: source.length))
    return TextEngine.applyUprightGlyphs(source, orientation: 0)
  }

  func test_digits_combine_runs_of_up_to_that_many_into_one_em() {
    let marked = combined("平成31年12345", 2)
    let glyph = try! XCTUnwrap(marked.attribute(Constants.UPRIGHT_GLYPH_KEY, at: 2, effectiveRange: nil) as? UprightGlyph)
    XCTAssertTrue(glyph.combined)
    XCTAssertEqual(glyph.grapheme, "31")
    // Both digits are one run, one em along the line.
    let line = CTLineCreateWithAttributedString(marked.attributedSubstring(from: NSRange(location: 2, length: 2)))
    XCTAssertEqual(CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)), 20, accuracy: 0.05)
    // Five digits are too many: they stay sideways.
    XCTAssertNil(marked.attribute(Constants.UPRIGHT_GLYPH_KEY, at: 6, effectiveRange: nil))
  }

  func test_all_squeezes_wide_text_into_its_cell() {
    let marked = combined("2026", 1)
    let glyph = try! XCTUnwrap(marked.attribute(Constants.UPRIGHT_GLYPH_KEY, at: 0, effectiveRange: nil) as? UprightGlyph)
    XCTAssertEqual(glyph.grapheme, "2026")
    XCTAssertLessThan(glyph.squeeze, 1)
    let line = CTLineCreateWithAttributedString(marked)
    XCTAssertEqual(CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)), 20, accuracy: 0.05)
  }


  // MARK: text-spacing-trim

  private func lineWidth(_ text: NSAttributedString) -> CGFloat {
    CGFloat(CTLineGetTypographicBounds(CTLineCreateWithAttributedString(text), nil, nil, nil))
  }

  func test_adjacent_punctuation_drops_a_blank_half() {
    let hiragino = CTFontCreateWithName("HiraginoSans-W3" as CFString, 20, nil)
    let plain = { (s: String) in NSAttributedString(string: s, attributes: [.font: hiragino]) }
    // A closing mark before an opening one, two closing marks, two opening marks: 1.5em each.
    for pair in ["」「", "。」", "「「"] {
      XCTAssertEqual(lineWidth(TextEngine.applySpacingTrim(plain(pair), vertical: false)), 30, accuracy: 0.05, pair)
    }
    // A mark beside a letter keeps its width, and space-all trims nothing.
    XCTAssertEqual(lineWidth(TextEngine.applySpacingTrim(plain("字」"), vertical: false)), 40, accuracy: 0.05)
    let off = NSMutableAttributedString(attributedString: plain("」「"))
    off.addAttribute(Constants.SPACING_TRIM_OFF_KEY, value: true, range: NSRange(location: 0, length: 2))
    XCTAssertEqual(lineWidth(TextEngine.applySpacingTrim(off, vertical: false)), 40, accuracy: 0.05)
  }

  func test_vertical_half_width_marks_take_half_a_cell() {
    let hiragino = CTFontCreateWithName("HiraginoSans-W3" as CFString, 20, nil)
    let text = TextEngine.applySpacingTrim(NSAttributedString(string: "」「", attributes: [.font: hiragino]), vertical: true)
    XCTAssertEqual(lineWidth(TextEngine.applyUprightGlyphs(text, orientation: 0)), 30, accuracy: 0.05)
  }
}
