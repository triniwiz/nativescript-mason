//
//  TextIndentLineClampTests.swift
//  MasonTests
//
//  text-indent, line-clamp and transform-origin, set through the typed Swift API and through
//  the style buffer the way the TypeScript layer writes it.
//

import XCTest
@testable import Mason

final class TextIndentLineClampTests: XCTestCase {

  private let mason = NSCMason.shared
  private var kept: [UIView] = []
  private let scale = CGFloat(NSCMason.scale)

  private static let long = "The quick brown fox jumps over the lazy dog while the cat watches from the window and the bird sings on the fence all morning long"

  /// A <p> holding `text` in a root view `width` points wide, laid out and sized to its layout.
  private func paragraph(_ text: String, width: CGFloat = 200, _ configure: (MasonUIView, MasonText) -> Void = { _, _ in }) -> (root: MasonUIView, p: MasonText) {
    let root = mason.createView()
    let p = mason.createTextView(type: .P)
    kept.append(root)
    kept.append(p)
    root.addView(p)
    p.style.fontSize = 16
    p.mason_addChildAt(node: mason.createTextNode(text), 0)
    configure(root, p)
    layout(root, p, width: width)
    return (root, p)
  }

  private func layout(_ root: MasonUIView, _ p: MasonText, width: CGFloat = 200) {
    root.compute(Float(width * scale), -1)
    let l = p.layout()
    p.frame = CGRect(x: 0, y: 0, width: CGFloat(l.width) / scale, height: CGFloat(l.height) / scale)
    p.layoutIfNeeded()
  }

  private func height(_ p: MasonText) -> CGFloat {
    return CGFloat(p.layout().height)
  }

  /// Max-content width in device px, as Mason asks for it.
  private func maxContent(_ p: MasonText) -> CGFloat {
    return TextEngine.measure(p.engine, false, nil, CGSize(width: -2, height: -1)).width
  }

  private func draw(_ p: MasonText) {
    let size = p.bounds.size
    UIGraphicsBeginImageContextWithOptions(CGSize(width: max(size.width, 1), height: max(size.height, 1)), false, scale)
    defer { UIGraphicsEndImageContext() }
    guard let context = UIGraphicsGetCurrentContext() else { return XCTFail("no context") }
    p.engine.drawText(context: context, rect: p.bounds)
  }

  /// Marks the style buffer dirty the way the JS layer's commitState + syncStyle does.
  private func sync(_ element: MasonElement, _ key: StateKeys) {
    element.syncStyle(low: key.low, high: key.high)
  }

  // MARK: line-clamp

  func test_lineClamp_measures_the_height_of_n_lines() {
    let free = height(paragraph(TextIndentLineClampTests.long).p)
    let one = height(paragraph(TextIndentLineClampTests.long) { _, p in p.style.lineClamp = 1 }.p)
    let two = height(paragraph(TextIndentLineClampTests.long) { _, p in p.style.lineClamp = 2 }.p)
    XCTAssertGreaterThan(one, 0)
    XCTAssertLessThan(one, two)
    XCTAssertLessThan(two, free)
    // Two lines are twice one line's pitch, give or take rounding.
    XCTAssertEqual(two, one * 2, accuracy: 2 * scale)
  }

  func test_lineClamp_above_the_line_count_changes_nothing() {
    let free = height(paragraph("Short text").p)
    let clamped = height(paragraph("Short text") { _, p in p.style.lineClamp = 3 }.p)
    XCTAssertEqual(free, clamped)
  }

  func test_lineClamp_draws_n_lines_ending_in_an_ellipsis() {
    let p = paragraph(TextIndentLineClampTests.long) { _, p in p.style.lineClamp = 2 }.p
    draw(p)
    let lines = p.engine.drawnLines
    XCTAssertEqual(lines.count, 2)
    guard let last = lines.last?.line else { return }
    let width = CGFloat(CTLineGetTypographicBounds(last, nil, nil, nil))
    XCTAssertLessThanOrEqual(width, p.bounds.width + 0.5)
    // The last glyph drawn is the ellipsis.
    guard let run = (CTLineGetGlyphRuns(last) as! [CTRun]).last else { return XCTFail("no runs") }
    let attrs = CTRunGetAttributes(run) as NSDictionary
    let font = attrs[NSAttributedString.Key.font] as! CTFont
    var ellipsis: [UniChar] = [0x2026]
    var glyph = CGGlyph(0)
    XCTAssertTrue(CTFontGetGlyphsForCharacters(font, &ellipsis, &glyph, 1))
    let count = CTRunGetGlyphCount(run)
    var glyphs = [CGGlyph](repeating: 0, count: count)
    CTRunGetGlyphs(run, CFRange(location: 0, length: 0), &glyphs)
    XCTAssertEqual(glyphs.last, glyph)
  }

  func test_lineClamp_inherits_from_a_div_through_the_buffer() {
    let free = height(paragraph(TextIndentLineClampTests.long).p)
    let (root, p) = paragraph(TextIndentLineClampTests.long)
    root.style.prepareMut()
    root.style.setInt32(StyleKeys.LINE_CLAMP, 2)
    root.style.setUInt8(StyleKeys.LINE_CLAMP_STATE, 1)
    sync(root, .lineClamp)
    layout(root, p)
    let clamped = height(p)
    XCTAssertGreaterThan(clamped, 0)
    XCTAssertLessThan(clamped, free)
    XCTAssertEqual(p.style.resolvedLineClamp, 2)
  }

  func test_typed_lineClamp_setter_does_not_leak_into_a_shared_buffer() {
    let a = mason.createTextView(type: .P)
    let b = mason.createTextView(type: .P)
    kept.append(a)
    kept.append(b)
    a.style.lineClamp = 3
    XCTAssertEqual(a.style.lineClamp, 3)
    XCTAssertEqual(b.style.lineClamp, 0)
    XCTAssertEqual(b.style.resolvedLineClamp, 0)
  }

  // MARK: text-indent

  func test_textIndent_grows_max_content_by_the_indent() {
    let plain = maxContent(paragraph("Hello world").p)
    let indented = maxContent(paragraph("Hello world") { _, p in p.style.textIndent = .Points(Float(30 * scale)) }.p)
    XCTAssertEqual(indented - plain, 30 * scale, accuracy: 2)
  }

  func test_negative_textIndent_hangs_the_first_line() {
    let plain = maxContent(paragraph("Hello world").p)
    let hanging = maxContent(paragraph("Hello world") { _, p in p.style.textIndent = .Points(Float(-10 * scale)) }.p)
    XCTAssertEqual(plain - hanging, 10 * scale, accuracy: 2)

    // The first line starts left of the content box when drawn.
    let p = paragraph(TextIndentLineClampTests.long) { _, p in p.style.textIndent = .Points(Float(-10 * scale)) }.p
    draw(p)
    let lines = p.engine.drawnLines
    XCTAssertGreaterThan(lines.count, 1)
    guard lines.count > 1 else { return }
    XCTAssertEqual(lines[1].origin.x - lines[0].origin.x, 10, accuracy: 0.5)
  }

  func test_textIndent_moves_the_first_drawn_line_only() {
    let p = paragraph(TextIndentLineClampTests.long) { _, p in p.style.textIndent = .Points(Float(24 * scale)) }.p
    draw(p)
    let lines = p.engine.drawnLines
    XCTAssertGreaterThan(lines.count, 1)
    guard lines.count > 1 else { return }
    XCTAssertEqual(lines[0].origin.x - lines[1].origin.x, 24, accuracy: 0.5)
  }

  func test_rtl_textIndent_comes_off_the_right_edge() {
    func rightEdges(_ indent: CGFloat) -> [CGFloat] {
      let p = paragraph(TextIndentLineClampTests.long) { _, p in
        p.style.direction = .RTL
        p.style.textAlign = .Right
        p.style.textIndent = .Points(Float(indent * scale))
      }.p
      draw(p)
      return p.engine.drawnLines.map { line in
        line.origin.x + CGFloat(CTLineGetTypographicBounds(line.line, nil, nil, nil)) - CGFloat(CTLineGetTrailingWhitespaceWidth(line.line))
      }
    }
    let indented = rightEdges(24)
    XCTAssertGreaterThan(indented.count, 1)
    guard indented.count > 1 else { return }
    XCTAssertEqual(indented[1] - indented[0], 24, accuracy: 1)

    let hanging = rightEdges(-10)
    guard hanging.count > 1 else { return XCTFail("one line") }
    XCTAssertEqual(hanging[0] - hanging[1], 10, accuracy: 1)
  }

  func test_percent_textIndent_resolves_against_the_width() {
    let free = height(paragraph(TextIndentLineClampTests.long).p)
    let p = paragraph(TextIndentLineClampTests.long) { _, p in p.style.textIndent = .Percent(0.5) }.p
    XCTAssertGreaterThanOrEqual(height(p), free)
    draw(p)
    let lines = p.engine.drawnLines
    guard lines.count > 1 else { return XCTFail("one line") }
    XCTAssertEqual(lines[0].origin.x - lines[1].origin.x, p.bounds.width / 2, accuracy: 1)
    // Intrinsic sizes treat a percentage as 0.
    XCTAssertEqual(maxContent(p), maxContent(paragraph(TextIndentLineClampTests.long).p), accuracy: 1)
  }

  func test_textIndent_inherits_from_a_div_through_the_buffer() {
    let plain = maxContent(paragraph("Hello world").p)
    let (root, p) = paragraph("Hello world")
    root.style.prepareMut()
    root.style.setFloat(StyleKeys.TEXT_INDENT, Float(20 * scale))
    root.style.setUInt8(StyleKeys.TEXT_INDENT_TYPE, 0)
    root.style.setUInt8(StyleKeys.TEXT_INDENT_STATE, 1)
    sync(root, .textIndent)
    layout(root, p)
    XCTAssertEqual(maxContent(p) - plain, 20 * scale, accuracy: 2)
  }

  func test_button_label_does_not_inherit_textIndent() {
    let root = mason.createView()
    let button = mason.createButton()
    kept.append(root)
    kept.append(button)
    root.addView(button)
    button.mason_append(text: "Press")
    let plain = TextEngine.measure(button.engine, false, nil, CGSize(width: -2, height: -1)).width
    root.style.textIndent = .Points(Float(20 * scale))
    let after = TextEngine.measure(button.engine, false, nil, CGSize(width: -2, height: -1)).width
    XCTAssertEqual(after, plain)
  }

  // MARK: transform-origin

  /// Where a point of the view's own bounds lands in its superview.
  private func placed(_ view: UIView, _ point: CGPoint) -> CGPoint {
    let fromCentre = CGPoint(x: point.x - view.bounds.midX, y: point.y - view.bounds.midY).applying(view.transform)
    return CGPoint(x: view.center.x + fromCentre.x, y: view.center.y + fromCentre.y)
  }

  private func settle() {
    let exp = expectation(description: "transform applied")
    DispatchQueue.main.async { exp.fulfill() }
    waitForExpectations(timeout: 1)
  }

  func test_transformOrigin_point_stays_put() {
    let view = mason.createView()
    kept.append(view)
    view.frame = CGRect(x: 0, y: 0, width: 100, height: 50)
    view.style.transform = "rotate(90deg) scale(2)"
    view.style.transformOrigin = (.Points(0), .Points(0))
    settle()
    let corner = placed(view, .zero)
    XCTAssertEqual(corner.x, 0, accuracy: 0.01)
    XCTAssertEqual(corner.y, 0, accuracy: 0.01)
    // Default origin still turns about the centre.
    XCTAssertEqual(view.layer.anchorPoint, CGPoint(x: 0.5, y: 0.5))
  }

  func test_transformOrigin_from_the_buffer_and_on_resize() {
    let view = mason.createView()
    kept.append(view)
    view.frame = CGRect(x: 0, y: 0, width: 100, height: 50)
    view.style.transform = "rotate(45deg)"
    view.style.prepareMut()
    view.style.setUInt8(StyleKeys.TRANSFORM_ORIGIN_X_TYPE, 1)
    view.style.setUInt8(StyleKeys.TRANSFORM_ORIGIN_Y_TYPE, 1)
    view.style.setFloat(StyleKeys.TRANSFORM_ORIGIN_X_VALUE, 100)
    view.style.setFloat(StyleKeys.TRANSFORM_ORIGIN_Y_VALUE, 100)
    view.style.setUInt8(StyleKeys.TRANSFORM_ORIGIN_STATE, 1)
    sync(view, .transformOrigin)
    settle()
    var corner = placed(view, CGPoint(x: 100, y: 50))
    XCTAssertEqual(corner.x, 100, accuracy: 0.01)
    XCTAssertEqual(corner.y, 50, accuracy: 0.01)

    // A percentage origin follows the size.
    view.bounds = CGRect(x: 0, y: 0, width: 200, height: 80)
    view.center = CGPoint(x: 100, y: 40)
    view.layoutSubviews()
    settle()
    corner = placed(view, CGPoint(x: 200, y: 80))
    XCTAssertEqual(corner.x, 200, accuracy: 0.01)
    XCTAssertEqual(corner.y, 80, accuracy: 0.01)
  }
}
