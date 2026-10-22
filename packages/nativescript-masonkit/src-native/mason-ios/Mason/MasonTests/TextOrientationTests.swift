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

  func test_mixed_keeps_cjk_upright_and_turns_latin_and_brackets() {
    // 漢 a 「 字 」 、
    XCTAssertEqual(upright("漢a「字」、", 0), [0, 3, 5])
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

  func test_full_width_cells_are_one_em_along_the_line() {
    let marked = TextEngine.applyUprightGlyphs(text("漢漢漢"), orientation: 0)
    let line = CTLineCreateWithAttributedString(marked)
    XCTAssertEqual(CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)), 60, accuracy: 0.05)
  }

  func test_narrow_upright_cells_are_the_fonts_height() {
    let marked = TextEngine.applyUprightGlyphs(text("AB"), orientation: 1)
    let line = CTLineCreateWithAttributedString(marked)
    let cell = CTFontGetAscent(font) + CTFontGetDescent(font)
    XCTAssertEqual(CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)), cell * 2, accuracy: 0.05)
  }
}
