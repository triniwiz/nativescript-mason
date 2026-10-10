import XCTest
@testable import Mason

/// Text and an inline box (a Mason element such as a button) in one paragraph, attached the
/// way the framework integrations attach them: text nodes right away, views when they load,
/// by index, which lands on append when the box comes last.
final class InlineBoxAfterTextTests: XCTestCase {

  private let mason = NSCMason.shared

  // MasonNode.view is weak; the app's framework keeps its views alive, so the tests do too.
  private var kept: [UIView] = []

  private func button(tall: Bool = false) -> Button {
    let button = mason.createButton()
    button.mason_append(text: "Btn")
    if tall {
      let scale = NSCMason.scale
      button.style.padding = MasonRect(.Points(8 * scale), .Points(16 * scale), .Points(8 * scale), .Points(16 * scale))
    }
    kept.append(button)
    return button
  }

  /// A <p> in a root view, built by `build`, laid out 400px wide and sized to its layout.
  private func paragraph(lineHeight: Bool = false, _ build: (MasonText) -> Void) -> MasonText {
    let root = mason.createView()
    let p = mason.createTextView(type: .P)
    kept.append(root)
    root.addView(p)
    if lineHeight {
      // Tailwind's text-base: a line box taller than the font, but shorter than a padded button.
      p.style.fontSize = 16
      p.style.setLineHeight(1.5, true)
    }
    build(p)
    root.compute(400, -1)
    let scale = CGFloat(NSCMason.scale)
    let layout = p.layout()
    p.frame = CGRect(x: 0, y: 0, width: CGFloat(layout.width) / scale, height: CGFloat(layout.height) / scale)
    p.layoutIfNeeded()
    return p
  }

  private func drawnString(_ p: MasonText) -> String {
    return p.engine.buildAttributedString().string
  }

  /// Opaque pixels the text layer draws; the inline box's own view isn't drawn here.
  private func inkedPixels(_ p: MasonText) -> Int {
    let width = Int(ceil(p.bounds.width)), height = Int(ceil(p.bounds.height))
    guard width > 0, height > 0,
          let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
                                  space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
    else { return 0 }
    p.layer.setNeedsDisplay()
    p.layer.render(in: context)
    guard let data = context.data?.assumingMemoryBound(to: UInt8.self) else { return 0 }
    var inked = 0
    for i in 0..<(width * height) where data[i * 4 + 3] > 128 { inked += 1 }
    return inked
  }

  func test_text_then_appended_box_keeps_the_text() {
    let p = paragraph { p in
      p.mason_addChildAt(node: mason.createTextNode("Alpha "), 0)
      p.addView(button(), at: 1)
    }
    let drawn = drawnString(p)
    XCTAssertTrue(drawn.contains("Alpha"), "got \(drawn.debugDescription)")
    XCTAssertTrue(drawn.contains("\u{FFFC}"), "got \(drawn.debugDescription)")
  }

  func test_text_box_text_keeps_both_runs() {
    let p = paragraph { p in
      p.mason_addChildAt(node: mason.createTextNode("Alpha "), 0)
      p.mason_addChildAt(node: mason.createTextNode(" omega"), 1)
      p.addView(button(), at: 1)
    }
    let drawn = drawnString(p)
    XCTAssertTrue(drawn.contains("Alpha"), "got \(drawn.debugDescription)")
    XCTAssertTrue(drawn.contains("omega"), "got \(drawn.debugDescription)")
    XCTAssertTrue(drawn.contains("\u{FFFC}"), "got \(drawn.debugDescription)")
  }

  func test_space_before_a_box_keeps_the_text_attributes() {
    let p = paragraph { p in
      p.mason_addChildAt(node: mason.createTextNode("Alpha "), 0)
      p.addView(button(), at: 1)
    }
    let attributed = p.engine.buildAttributedString()
    let space = (attributed.string as NSString).range(of: " ")
    XCTAssertNotEqual(space.location, NSNotFound)
    let attrs = attributed.attributes(at: space.location, effectiveRange: nil)
    XCTAssertNotNil(attrs[.font], "the space has the text's font")
    XCTAssertNotNil(attrs[.foregroundColor], "the space has the text's colour")
    XCTAssertNotNil(attrs[.paragraphStyle], "the space has the paragraph's style")
  }

  func test_a_box_taller_than_the_line_height_still_draws_the_text_before_it() {
    let p = paragraph(lineHeight: true) { p in
      p.mason_addChildAt(node: mason.createTextNode("Alpha "), 0)
      p.addView(button(tall: true), at: 1)
    }
    XCTAssertGreaterThan(inkedPixels(p), 20, "\"Alpha\" is drawn")
  }

  func test_a_box_taller_than_the_line_height_still_draws_the_text_after_it() {
    let p = paragraph(lineHeight: true) { p in
      p.mason_addChildAt(node: mason.createTextNode(" omega"), 0)
      p.addView(button(tall: true), at: 0)
    }
    XCTAssertGreaterThan(inkedPixels(p), 20, "\"omega\" is drawn")
  }
}
