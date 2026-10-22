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

  // MARK: inline boxes in fixed line boxes

  func test_a_column_holding_a_box_wider_than_the_line_height_grows_to_fit_it() {
    let mason = NSCMason.shared
    let scale = CGFloat(NSCMason.scale)
    for relative in [Float(1.7), 0] {
      let root = mason.createView()
      root.style.prepareMut()
      root.style.setUInt8(StyleKeys.WRITING_MODE, 1)
      root.style.setUInt8(StyleKeys.WRITING_MODE_STATE, 1)
      root.syncStyle(low: StateKeys.writingMode.low, high: StateKeys.writingMode.high)
      root.style.setSizeHeight(MasonDimension.Points(Float(150 * scale)))
      let p = mason.createTextView(type: .P)
      root.addView(p)
      p.style.fontSize = 14
      if relative > 0 { p.style.setLineHeight(relative, true) }
      p.mason_addChildAt(node: mason.createTextNode("「縦書き」は、日本語の本や新聞でよく使われる書き方です。ちょっとした記号（括弧や句読点）も縦向きの字形になります。"), 0)
      p.mason_addChildAt(node: mason.createTextNode(" CSS は12月に読みました。 "), 1)
      let button = mason.createButton()
      button.mason_append(text: "送信")
      p.addView(button, at: 2)
      root.compute(-1, -1)
      keptViews.append(contentsOf: [root, button])
      let layout = p.layout()
      p.frame = CGRect(x: 0, y: 0, width: CGFloat(layout.width) / scale, height: CGFloat(layout.height) / scale)
      p.layoutIfNeeded()
      let context = CGContext(data: nil, width: Int(p.bounds.width) + 1, height: Int(p.bounds.height) + 1, bitsPerComponent: 8, bytesPerRow: (Int(p.bounds.width) + 1) * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
      p.engine.drawText(context: context, rect: p.bounds)

      // Every line is drawn: the view was measured for all of them.
      let text = p.engine.buildAttributedString()
      let last = try! XCTUnwrap(p.engine.drawnLines.last).line
      let range = CTLineGetStringRange(last)
      XCTAssertEqual(range.location + range.length, text.length, "line-height \(relative)")
      // The box sits in the last column, clear of the one before it.
      let box = try! XCTUnwrap(p.engine.drawnBoxFrame(for: button.node))
      let before = p.engine.drawnLines[p.engine.drawnLines.count - 2]
      var descent: CGFloat = 0
      CTLineGetTypographicBounds(before.line, nil, &descent, nil)
      XCTAssertLessThanOrEqual(box.maxX, before.origin.y - descent + 0.5, "line-height \(relative)")
      XCTAssertGreaterThanOrEqual(box.minX, -0.5)
      // Mason lays the paragraph out as wide as its text measures.
      let measured = TextEngine.measureUncached(p.engine, false, isBlock: true, nil, CGSize(width: 150 * scale, height: .infinity))
      XCTAssertEqual(CGFloat(layout.width), measured.height, accuracy: 0.5 * scale, "line-height \(relative)")
    }
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
    off.addAttribute(Constants.SPACING_TRIM_KEY, value: SPACING_TRIM_SPACE_ALL, range: NSRange(location: 0, length: 2))
    XCTAssertEqual(lineWidth(TextEngine.applySpacingTrim(off, vertical: false)), 40, accuracy: 0.05)
  }

  func test_vertical_half_width_marks_take_half_a_cell() {
    let hiragino = CTFontCreateWithName("HiraginoSans-W3" as CFString, 20, nil)
    let text = TextEngine.applySpacingTrim(NSAttributedString(string: "」「", attributes: [.font: hiragino]), vertical: true)
    XCTAssertEqual(lineWidth(TextEngine.applyUprightGlyphs(text, orientation: 0)), 30, accuracy: 0.05)
  }

  private func trimmed(_ s: String, _ mode: UInt8, vertical: Bool = false) -> NSAttributedString {
    let hiragino = CTFontCreateWithName("HiraginoSans-W3" as CFString, 20, nil)
    let text = NSMutableAttributedString(string: s, attributes: [.font: hiragino])
    if mode != 0 { text.addAttribute(Constants.SPACING_TRIM_KEY, value: mode, range: NSRange(location: 0, length: text.length)) }
    let marked = TextEngine.applySpacingTrim(text, vertical: vertical)
    return vertical ? TextEngine.applyUprightGlyphs(marked, orientation: 0) : marked
  }

  func test_paragraph_edges_trim_by_value() {
    // trim-start drops an opening mark's blank half at a paragraph's start; space-first and normal don't.
    XCTAssertEqual(lineWidth(trimmed("「字", SPACING_TRIM_START)), 30, accuracy: 0.05)
    XCTAssertEqual(lineWidth(trimmed("「字", SPACING_TRIM_SPACE_FIRST)), 40, accuracy: 0.05)
    XCTAssertEqual(lineWidth(trimmed("「字", 0)), 40, accuracy: 0.05)
    // trim-both also a closing mark's at its end, trim-all every mark's.
    XCTAssertEqual(lineWidth(trimmed("「字」", SPACING_TRIM_BOTH)), 40, accuracy: 0.05)
    XCTAssertEqual(lineWidth(trimmed("字・字、字", SPACING_TRIM_ALL)), 80, accuracy: 0.05)
    XCTAssertEqual(lineWidth(trimmed("「字」", SPACING_TRIM_BOTH, vertical: true)), 40, accuracy: 0.05)
  }

  func test_a_trimmed_opening_mark_is_drawn_back_by_its_dropped_half() {
    let shift = trimmed("「字", SPACING_TRIM_START).attribute(Constants.GLYPH_SHIFT_KEY, at: 0, effectiveRange: nil)
    XCTAssertEqual(shift as? CGFloat ?? 0, -10, accuracy: 0.05)
  }

  private func lineEnds(_ text: NSAttributedString, width: CGFloat) -> [Int] {
    let rect = CGRect(x: 0, y: 0, width: width, height: 1000)
    let out = TextEngine.trimmingLineEdges(text, in: rect)
    let frame = CTFramesetterCreateFrame(TextEngine.framesetter(out), CFRange(), CGPath(rect: rect, transform: nil), nil)
    return (CTFrameGetLines(frame) as? [CTLine] ?? []).map {
      let range = CTLineGetStringRange($0)
      return range.location + range.length
    }
  }

  func test_soft_line_breaks_trim_marks_as_chrome_does() {
    // 3em lines. trim-start halves the 「 starting the second line, and then 」 fits half-width at its end.
    XCTAssertEqual(lineEnds(trimmed("字字字「字字」字", SPACING_TRIM_START), width: 60), [3, 7, 8])
    XCTAssertEqual(lineEnds(trimmed("字字字「字字」字", SPACING_TRIM_START, vertical: true), width: 60 + 1 / 64), [3, 7, 8])
    // normal keeps 「 whole, so 」 doesn't fit either and takes the character before it along.
    XCTAssertEqual(lineEnds(trimmed("字字字「字字」字", 0), width: 60), [3, 5, 8])
    // A closing bracket that fits half-width ends its line; a full stop doesn't, nor does space-all trim.
    XCTAssertEqual(lineEnds(trimmed("字字字」字", 0), width: 70), [4, 5])
    XCTAssertEqual(lineEnds(trimmed("字字字。字", 0), width: 70), [2, 5])
    XCTAssertEqual(lineEnds(trimmed("字字字」字", SPACING_TRIM_SPACE_ALL), width: 70), [2, 5])
  }

  // MARK: line-height tighter than the font

  func test_a_tight_line_height_is_the_line_box_and_its_ink_overflows_it() {
    for vertical in [false, true] {
      let mason = NSCMason.shared
      let scale = CGFloat(NSCMason.scale)
      let root = mason.createView()
      if vertical {
        root.style.prepareMut()
        root.style.setUInt8(StyleKeys.WRITING_MODE, 1)
        root.style.setUInt8(StyleKeys.WRITING_MODE_STATE, 1)
        root.syncStyle(low: StateKeys.writingMode.low, high: StateKeys.writingMode.high)
        root.style.setSizeHeight(MasonDimension.Points(Float(100 * scale)))
      } else {
        root.style.setSizeWidth(MasonDimension.Points(Float(300 * scale)))
      }
      let p = mason.createTextView(type: .P)
      root.addView(p)
      p.style.fontSize = 16
      p.style.prepareMut()
      p.style.setFloat(StyleKeys.LINE_HEIGHT, 12)
      p.style.setUInt8(StyleKeys.LINE_HEIGHT_STATE, 1)
      p.style.setUInt8(StyleKeys.LINE_HEIGHT_TYPE, 1)
      p.syncStyle(low: StateKeys.lineHeight.low, high: StateKeys.lineHeight.high)
      p.mason_addChildAt(node: mason.createTextNode("HH HH"), 0)
      root.compute(-1, -1)
      keptViews.append(root)
      let l = p.layout()
      XCTAssertEqual(CGFloat(vertical ? l.width : l.height) / scale, 12, accuracy: 0.01)
      XCTAssertGreaterThan(p.engine.inkOverflow(), 0)
    }
  }

  func test_tight_cjk_lines_are_a_line_height_apart() {
    for vertical in [false, true] {
      let mason = NSCMason.shared
      let scale = CGFloat(NSCMason.scale)
      let root = mason.createView()
      if vertical {
        root.style.prepareMut()
        root.style.setUInt8(StyleKeys.WRITING_MODE, 1)
        root.style.setUInt8(StyleKeys.WRITING_MODE_STATE, 1)
        root.syncStyle(low: StateKeys.writingMode.low, high: StateKeys.writingMode.high)
      }
      let p = mason.createTextView(type: .P)
      root.addView(p)
      p.style.fontSize = 18
      if vertical {
        p.style.setSizeHeight(MasonDimension.Points(Float(200 * scale)))
      } else {
        p.style.setSizeWidth(MasonDimension.Points(Float(200 * scale)))
      }
      p.style.prepareMut()
      p.style.setFloat(StyleKeys.LINE_HEIGHT, 12)
      p.style.setUInt8(StyleKeys.LINE_HEIGHT_STATE, 1)
      p.style.setUInt8(StyleKeys.LINE_HEIGHT_TYPE, 1)
      p.syncStyle(low: StateKeys.lineHeight.low, high: StateKeys.lineHeight.high)
      // Two lines of full-width text at 18pt in a 200pt line.
      p.mason_addChildAt(node: mason.createTextNode("行間がとても狭い段落の文字が切れないこと"), 0)
      root.compute(-1, -1)
      keptViews.append(root)
      let l = p.layout()
      XCTAssertEqual(CGFloat(vertical ? l.width : l.height) / scale, 24, accuracy: 0.01)
    }
  }
}
