//
//  MasonTests.swift
//  MasonTests
//
//  Created by Osei Fortune on 28/11/2022.
//

import CoreImage
import CoreText
import Metal
import XCTest
@testable import Mason

final class MasonTests: XCTestCase {

  private var mason: NSCMason!

  private func typographicWidth(_ text: NSAttributedString) -> CGFloat {
    let line = CTLineCreateWithAttributedString(text)
    return ceil(CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)))
  }

  override func setUpWithError() throws {
    mason = NSCMason.shared
  }

  override func tearDownWithError() throws {
    mason = nil
  }

  // MARK: - View Creation Tests

  func test_gradientStopWithTwoPositionsBecomesTwoStops() {
    let gradient = parseGradient("linear-gradient(to right, blue, rgb(0, 0, 255) 10% 30%, green 40%)")
    XCTAssertEqual(gradient?.resolvedStops().map(\.color), [0xff0000ff, 0xff0000ff, 0xff0000ff, 0xff008000])
    XCTAssertEqual(gradient?.resolvedStops().map(\.position), [0, 0.1, 0.3, 0.4])
  }

  func test_gradientInterpolationMethodIsSeparatedFromTheDirection() {
    let gradient = parseGradient("linear-gradient(to bottom right in oklab, #6366f1 0%, #d946ef 100%)")
    XCTAssertEqual(gradient?.direction, "to bottom right")
    XCTAssertEqual(gradient?.resolvedStops().map(\.color), [0xff6366f1, 0xffd946ef])
    XCTAssertEqual(gradient?.interpolation, ColorInterpolation(space: .oklab))

    let alone = parseGradient("linear-gradient(in oklab, red, blue)")
    XCTAssertNil(alone?.direction)
    XCTAssertEqual(alone?.resolvedStops().map(\.color), [0xffff0000, 0xff0000ff])
  }

  func test_gradientInterpolationExtractsHueMethodsAndUnknownSpaces() {
    let hue = ColorInterpolation.extract("90deg in oklch longer hue")
    XCTAssertEqual(hue?.rest, "90deg")
    XCTAssertEqual(hue?.method, ColorInterpolation(space: .oklch, hue: .longer))
    XCTAssertEqual(ColorInterpolation.extract("in oklch to right")?.rest, "to right")
    XCTAssertEqual(ColorInterpolation.extract("to right in display-p3")?.method.space, .srgb)
    XCTAssertNil(ColorInterpolation.extract("circle at center"))
  }

  // Reference values: CSS Color 4 `color-mix(in <space>, a, b)` at 50%.
  func test_gradientInterpolationMidpointsMatchColorMix() {
    func mix(_ a: [Double], _ b: [Double], _ space: ColorInterpolation.Space, _ hue: ColorInterpolation.HueMethod = .shorter) -> [Int] {
      return interpolateColor(a, b, 0.5, ColorInterpolation(space: space, hue: hue)).map { Int(($0 * 255).rounded()) }
    }
    let red = [1.0, 0, 0, 1], blue = [0.0, 0, 1, 1], white = [1.0, 1, 1, 1], black = [0.0, 0, 0, 1]
    func assertNear(_ actual: [Int], _ expected: [Int], file: StaticString = #filePath, line: UInt = #line) {
      for i in 0..<expected.count { XCTAssertLessThanOrEqual(abs(actual[i] - expected[i]), 1, "\(actual) vs \(expected)", file: file, line: line) }
    }
    assertNear(mix(red, blue, .oklab), [140, 83, 162, 255])
    assertNear(mix(white, black, .oklab), [99, 99, 99, 255])
    assertNear(mix(red, blue, .lab), [193, 0, 136, 255])
    assertNear(mix(red, blue, .oklch), [186, 0, 194, 255])
    assertNear(mix(white, black, .srgbLinear), [188, 188, 188, 255])
    let longer = mix(red, blue, .oklch, .longer)
    XCTAssertGreaterThan(longer[1], longer[0])
    assertNear(mix(red, [0, 0, 0, 0], .oklab), [255, 0, 0, 128])
  }

  func test_gradientInterpolationExpandsSegmentsAndSkipsHardStops() {
    let red = UIColor.red.cgColor, blue = UIColor.blue.cgColor
    let expanded = expandInterpolatedStops([red, blue], [0, 1], ColorInterpolation(space: .oklab))
    XCTAssertEqual(expanded.colors.count, 9)
    XCTAssertEqual(expanded.locations[4], 0.5, accuracy: 1e-6)
    let hard = expandInterpolatedStops([red, blue, blue], [0, 0.5, 0.5], ColorInterpolation(space: .oklab))
    XCTAssertEqual(hard.colors.count, 10)
    XCTAssertEqual(expandInterpolatedStops([red, blue], [0, 1], ColorInterpolation(space: .srgb)).colors.count, 2)
  }

  func test_createSimpleView() {
    let view = MasonUIView(mason: mason)
    XCTAssertNotNil(view.node.nativePtr)
  }

  func test_createFlexView() {
    let view = MasonUIView.createFlexView(mason)
    XCTAssertEqual(view.style.display, .Flex)
  }

  func test_createGridView() {
    let view = MasonUIView.createGridView(mason)
    XCTAssertEqual(view.style.display, .Grid)
  }

  func test_createBlockView() {
    let view = MasonUIView.createBlockView(mason)
    XCTAssertEqual(view.style.display, .Block)
  }

  // MARK: - Form Control Tests

  func test_textAreaOnlyScrollsWhenContentOverflows() {
    let textArea = MasonTextArea(mason: mason)
    textArea.rows = 4
    textArea.frame = CGRect(x: 0, y: 0, width: 300, height: 120)

    textArea.text = "Short note"
    textArea.layoutIfNeeded()
    XCTAssertFalse(textArea.isScrollEnabled)

    textArea.text = Array(repeating: "Line", count: 20).joined(separator: "\n")
    textArea.textViewDidChange(textArea)
    textArea.layoutIfNeeded()
    XCTAssertTrue(textArea.isScrollEnabled)
  }

  // MARK: - Layout Computation Tests

  func test_layoutSimpleView() {
    let view = MasonUIView(mason: mason)
    view.setSize(100, 100)

    view.compute(-1, -1)
    let layout = view.layout()
    XCTAssertGreaterThan(layout.width, 0)
  }

  func test_layoutWithChildren() {
    let parent = MasonUIView(mason: mason)
    parent.setSize(500, 500)
    parent.flexDirection = .Column

    for _ in 0..<10 {
      let child = MasonUIView(mason: mason)
      child.setSize(50, 50)
      parent.addView(child)
    }

    parent.compute(-1, -1)
    let layout = parent.layout()
    XCTAssertGreaterThan(layout.width, 0)
  }

  func test_layoutDeeplyNested() {
    var current = MasonUIView(mason: mason)
    current.setSize(500, 500)
    let root = current

    for _ in 0..<5 {
      let child = MasonUIView(mason: mason)
      child.setSize(100, 100)
      current.addView(child)
      current = child
    }

    root.compute(-1, -1)
    let layout = root.layout()
    XCTAssertGreaterThan(layout.width, 0)
  }

  func test_layoutComplexFlexbox() {
    let parent = MasonUIView.createFlexView(mason)
    parent.setSize(500, 500)
    parent.flexDirection = .Row

    for index in 0..<20 {
      let child = MasonUIView(mason: mason)
      child.flexGrow = Float(index % 3 + 1)
      child.flexShrink = 1
      parent.addView(child)
    }

    parent.compute(-1, -1)
    let layout = parent.layout()
    XCTAssertGreaterThan(layout.width, 0)
  }

  func test_layoutGrid() {
    let grid = MasonUIView.createGridView(mason)
    grid.setSize(500, 500)
    grid.gridTemplateColumns = "repeat(3, 1fr)"
    grid.gridTemplateRows = "repeat(3, 1fr)"

    for _ in 0..<9 {
      let item = MasonUIView(mason: mason)
      grid.addView(item)
    }

    grid.compute(-1, -1)
    let layout = grid.layout()
    XCTAssertGreaterThan(layout.width, 0)
  }

  // MARK: - Style Update Tests

  func test_updateSingleStyleProperty() {
    let view = MasonUIView(mason: mason)
    view.inBatch = true
    view.flexGrow = 1.5
    view.inBatch = false

    XCTAssertEqual(view.flexGrow, 1.5)
  }

  func test_updateMultipleStyleProperties() {
    let view = MasonUIView(mason: mason)

    view.inBatch = true
    view.flexGrow = 1.5
    view.flexShrink = 0.5
    view.flexDirection = .Row
    view.setSize(200, 200)
    view.setPadding(10, 10, 10, 10)
    view.setMargin(5, 5, 5, 5)
    view.inBatch = false

    XCTAssertEqual(view.flexGrow, 1.5)
    XCTAssertEqual(view.flexShrink, 0.5)
    XCTAssertEqual(view.flexDirection, .Row)
  }

  func test_updatePadding() {
    let view = MasonUIView(mason: mason)
    view.setPadding(10, 15, 20, 25)

    let padding = view.style.padding
    XCTAssertEqual(padding.left.value, 10)
  }

  func test_updateMargin() {
    let view = MasonUIView(mason: mason)
    view.setMargin(5, 10, 15, 20)

    let margin = view.style.margin
    XCTAssertEqual(margin.left.value, 5)
  }

  func test_updateSize() {
    let view = MasonUIView(mason: mason)
    view.inBatch = true
    view.setSize(200, 300)
    view.inBatch = false

    let size = view.style.size
    XCTAssertEqual(size.width.value, 200)
    XCTAssertEqual(size.height.value, 300)
  }

  func test_transform_rotate_applies_rotation() {
    let view = MasonUIView(mason: mason)
    // request a 90deg rotation
    view.style.transform = "rotate(90deg)"
    view.layoutSubviews()

    let exp = expectation(description: "transform applied")
    DispatchQueue.main.async {
      let t = view.transform
      let angle = atan2(t.b, t.a)
      XCTAssertEqual(Double(angle), Double.pi / 2.0, accuracy: 0.05)
      exp.fulfill()
    }
    waitForExpectations(timeout: 1)
  }

  func test_transform_translate_and_scale() {
    let view = MasonUIView(mason: mason)
    view.style.transform = "translate(24,12) scale(2)"
    view.layoutSubviews()

    let exp = expectation(description: "transform applied")
    DispatchQueue.main.async {
      let t = view.transform
      XCTAssertEqual(Double(t.tx), 24.0, accuracy: 0.5)
      XCTAssertEqual(Double(t.ty), 12.0, accuracy: 0.5)
      XCTAssertEqual(Double(t.a), 2.0, accuracy: 0.05)
      exp.fulfill()
    }
    waitForExpectations(timeout: 1)
  }

  func test_transform_long_list_reprojects_the_stored_program() {
    let view = MasonUIView(mason: mason)
    let style = view.style
    view.bounds.size = CGSize(width: 100, height: 40)
    style.transform = "translateX(calc(25% - 2px)) translateX(1px) translateX(1px) translateX(1px) translateX(1px) translateX(1px) matrix(1,0,0,1,1,0)"
    XCTAssertEqual(style.getUInt32(StyleKeys.TRANSFORM_REVISION), 1)
    XCTAssertTrue(style.transformDependsOnOrigin)

    let exp = expectation(description: "stored transform applied at both sizes")
    DispatchQueue.main.async {
      XCTAssertEqual(view.transform.tx, 29, accuracy: 0.01)
      view.bounds.size.width = 200
      style.applyTransformFromBuffer()
      DispatchQueue.main.async {
        XCTAssertEqual(view.transform.tx, 54, accuracy: 0.01)
        XCTAssertEqual(style.getUInt32(StyleKeys.TRANSFORM_REVISION), 1)
        style.transform = "none"
        XCTAssertEqual(view.transform, .identity)
        XCTAssertEqual(style.getUInt32(StyleKeys.TRANSFORM_REVISION), 2)
        exp.fulfill()
      }
    }
    waitForExpectations(timeout: 1)
  }

  func test_updateDisplay() {
    let view = MasonUIView(mason: mason)
    view.inBatch = true
    view.display = .Flex
    view.inBatch = false

    XCTAssertEqual(view.display, .Flex)
  }

  func testDisplayAndTextOverflowReadFromTheStyleBuffer() {
    let view = MasonUIView(mason: mason)
    let other = MasonUIView(mason: mason)
    for (display, base, mode) in [(Display.Inline, 3, 1), (.InlineBlock, 3, 2), (.InlineFlex, 1, 2), (.InlineGrid, 2, 2)] {
      view.style.display = display
      XCTAssertEqual(view.style.display, display)
      XCTAssertEqual(view.style.getUInt8(StyleKeys.DISPLAY), UInt8(base))
      XCTAssertEqual(view.style.getUInt8(StyleKeys.DISPLAY_MODE), UInt8(mode))
    }
    view.style.setUInt8(StyleKeys.VISIBILITY, 2)
    XCTAssertEqual(view.style.display, .None)
    XCTAssertTrue(view.style.hidesView)
    XCTAssertFalse(other.style.hidesView)

    view.style.textOverflow = .Custom("more")
    XCTAssertEqual(view.style.textOverflow.description, "more")
    view.style.setUInt8(StyleKeys.TEXT_OVERFLOW, 1)
    XCTAssertEqual(view.style.textOverflow.description, "ellipsis")
    XCTAssertEqual(other.style.textOverflow.description, "clip")
  }

  func testCustomTextOverflowUsesRustStorageAndClearsOnKeywordWrite() {
    let mason = NSCMason()
    let view = MasonUIView(mason: mason)
    let other = MasonUIView(mason: mason)
    view.style.textOverflow = .Custom("…\u{0}more")
    other.style.textOverflow = .Ellipse("↪")
    XCTAssertEqual(view.style.textOverflow.description, "…\u{0}more")
    XCTAssertEqual(other.style.textOverflow.description, "ellipsis ↪")

    mason.inCompute = true
    view.style.textOverflow = .Custom("pending")
    XCTAssertEqual(view.style.textOverflow.description, "…\u{0}more")
    mason.endCompute()
    XCTAssertEqual(view.style.textOverflow.description, "pending")
    let key = view.style.values.bytes.load(fromByteOffset: StyleKeys.TEXT_OVERFLOW_TOKEN, as: UInt64.self)
    XCTAssertNotEqual(key, 0)

    view.style.setUInt8(StyleKeys.TEXT_OVERFLOW, 1)
    view.style.setStateFromHalves(StateKeys.textOverflow.low, StateKeys.textOverflow.high)
    XCTAssertEqual(view.style.textOverflow.description, "ellipsis")
    let released = mason_css_text_overflow_token(key)
    XCTAssertNil(released.owner)
    if let owner = released.owner { mason_css_shorthand_release(owner) }
    XCTAssertEqual(other.style.textOverflow.description, "ellipsis ↪")
  }

  func test_text_engine_min_content_width_uses_widest_unbreakable_fragment() {
    let attrs: [NSAttributedString.Key: Any] = [
      .font: CTFontCreateWithName("Helvetica" as CFString, 17, nil)
    ]

    let short = NSAttributedString(string: "short", attributes: attrs)
    let long = NSAttributedString(string: "loooooooooong", attributes: attrs)
    let combined = NSAttributedString(string: "short loooooooooong", attributes: attrs)

    let shortWidth = typographicWidth(short)
    let longWidth = typographicWidth(long)
    let minContentWidth = TextEngine.minContentWidth(for: combined)

    XCTAssertGreaterThan(longWidth, shortWidth)
    XCTAssertEqual(minContentWidth, longWidth, accuracy: 0.5)
  }

  // Text breaks where CoreText breaks it (UAX #14), not only at spaces: between ideographs and
  // kana, and after a slash. A word with no break opportunity keeps its whole width.
  func test_text_engine_min_content_width_breaks_where_core_text_breaks() {
    let japaneseFont = CTFontCreateWithName("HiraginoSans-W3" as CFString, 17, nil)
    let japanese = NSAttributedString(string: "日本語の文章は空白なしで折り返します", attributes: [.font: japaneseFont])
    let oneIdeograph = typographicWidth(NSAttributedString(string: "語", attributes: [.font: japaneseFont]))
    let japaneseMin = TextEngine.minContentWidth(for: japanese)
    XCTAssertLessThan(japaneseMin, typographicWidth(japanese) / 4)
    XCTAssertLessThanOrEqual(japaneseMin, ceil(oneIdeograph * 2) + 1)

    let attrs: [NSAttributedString.Key: Any] = [.font: CTFontCreateWithName("Helvetica" as CFString, 17, nil)]
    let list = NSAttributedString(string: "red/green/yellow/purple", attributes: attrs)
    XCTAssertLessThan(TextEngine.minContentWidth(for: list), typographicWidth(list) / 2)

    let word = NSAttributedString(string: "unbreakable", attributes: attrs)
    XCTAssertEqual(TextEngine.minContentWidth(for: word), typographicWidth(word), accuracy: 1)
  }

  func test_text_engine_inline_child_baseline_from_bottom_matches_css_alignment_defaults() {
    let parentFont = FontMetrics(
      ascent: 20,
      descent: 6,
      x_height: 10,
      leading: 4,
      cap_height: 14
    )

    let scale: CGFloat = 2
    let height: CGFloat = 16

    XCTAssertEqual(
      TextEngine.inlineChildBaselineFromBottom(
        height: height,
        verticalAlign: .Baseline,
        parentFont: parentFont,
        scale: scale
      ),
      0,
      accuracy: 0.001
    )

    XCTAssertEqual(
      TextEngine.inlineChildBaselineFromBottom(
        height: height,
        verticalAlign: .TextBottom,
        parentFont: parentFont,
        scale: scale
      ),
      CGFloat(parentFont.descent) / scale,
      accuracy: 0.001
    )
  }

  func test_button_single_line_baseline_tracks_content_vertical_alignment() {
    let button = mason.createButton()
    let drawBounds = CGRect(x: 0, y: 0, width: 120, height: 40)
    let ascent: CGFloat = 10
    let descent: CGFloat = 4

    button.contentVerticalAlignment = .center
    XCTAssertEqual(
      button.singleLineTextBaselineY(ascent: ascent, descent: descent, in: drawBounds),
      23,
      accuracy: 0.001
    )

    button.contentVerticalAlignment = .top
    XCTAssertEqual(
      button.singleLineTextBaselineY(ascent: ascent, descent: descent, in: drawBounds),
      10,
      accuracy: 0.001
    )

    button.contentVerticalAlignment = .bottom
    XCTAssertEqual(
      button.singleLineTextBaselineY(ascent: ascent, descent: descent, in: drawBounds),
      36,
      accuracy: 0.001
    )
  }

  func test_text_engine_single_line_baseline_converts_top_origin_to_core_text_coordinates() {
    let bounds = CGRect(x: 0, y: 0, width: 120, height: 40)

    XCTAssertEqual(
      TextEngine.coreTextSingleLineBaselineY(fromTop: 10, in: bounds),
      30,
      accuracy: 0.001
    )

    XCTAssertEqual(
      TextEngine.coreTextSingleLineBaselineY(fromTop: 23, in: bounds),
      17,
      accuracy: 0.001
    )
  }

  func test_updatePosition() {
    let view = MasonUIView(mason: mason)
    view.inBatch = true
    view._position = .Absolute
    view.inBatch = false

    XCTAssertEqual(view._position, .Absolute)
  }

  // MARK: - Child Operations Tests

  func test_addSingleChild() {
    let parent = MasonUIView(mason: mason)
    let child = MasonUIView(mason: mason)

    parent.addView(child)

    XCTAssertEqual(parent.node.getChildren().count, 1)
  }

  func test_addMultipleChildren() {
    let parent = MasonUIView(mason: mason)
    let children = (0..<10).map { _ in MasonUIView(mason: mason) }

    for child in children {
      parent.addView(child)
    }

    XCTAssertEqual(parent.node.getChildren().count, 10)
  }

  func test_removeChild() {
    let parent = MasonUIView(mason: mason)
    let children = (0..<10).map { _ in MasonUIView(mason: mason) }
    for child in children {
      parent.addView(child)
    }

    parent.node.removeChildAt(index: 0)

    XCTAssertEqual(parent.node.getChildren().count, 9)
  }

  func test_removeAllChildren() {
    let parent = MasonUIView(mason: mason)
    let children = (0..<10).map { _ in MasonUIView(mason: mason) }
    for child in children {
      parent.addView(child)
    }

    parent.node.removeAllChildren()

    XCTAssertEqual(parent.node.getChildren().count, 0)
  }

  func test_addChildAtIndex() {
    let parent = MasonUIView(mason: mason)
    let baseChildren = (0..<10).map { _ in MasonUIView(mason: mason) }
    for child in baseChildren {
      parent.addView(child)
    }

    let childToInsert = MasonUIView(mason: mason)
    parent.addView(childToInsert, at: 5)

    XCTAssertEqual(parent.node.getChildren().count, 11)
  }

  // MARK: - Z-Index Tests

  func test_zIndexSorting() {
    let parent = MasonUIView(mason: mason)

    for index in 0..<20 {
      let child = MasonUIView(mason: mason)
      child.style.zIndex = Int32(index % 5)
      parent.addView(child)
    }

    XCTAssertEqual(parent.node.getChildren().count, 20)
  }

  // MARK: - Complex Scenarios

  func test_createComplexHierarchy() {
    let root = MasonUIView.createFlexView(mason)
    root.setSize(500, 500)

    let level1Views = (0..<3).map { _ -> MasonUIView in
      let v = MasonUIView.createFlexView(mason)
      v.flexDirection = .Column
      return v
    }

    let level2Views = (0..<9).map { _ -> MasonUIView in
      let v = MasonUIView(mason: mason)
      v.setSize(50, 50)
      v.setMargin(5, 5, 5, 5)
      return v
    }

    for (i, level1) in level1Views.enumerated() {
      for j in 0..<3 {
        level1.addView(level2Views[i * 3 + j])
      }
      root.addView(level1)
    }

    XCTAssertEqual(root.node.getChildren().count, 3)
  }

  func test_fullLayoutCycle() {
    let parent = MasonUIView.createFlexView(mason)
    parent.setSize(500, 500)

    for _ in 0..<10 {
      let child = MasonUIView(mason: mason)
      child.flexGrow = 1
      child.setSize(0, 50)
      parent.addView(child)
    }

    parent.compute(-1, -1)
    let layout = parent.layout()
    XCTAssertGreaterThan(layout.width, 0)
    XCTAssertGreaterThan(layout.height, 0)
  }

  // MARK: - Performance Benchmarks

  func test_benchmark_createSimpleView() {
    measure {
      for _ in 0..<100 {
        let view = MasonUIView(mason: mason)
        XCTAssertNotNil(view.node.nativePtr)
      }
    }
  }

  func test_benchmark_createFlexView() {
    measure {
      for _ in 0..<100 {
        let view = MasonUIView.createFlexView(mason)
        XCTAssertEqual(view.style.display, .Flex)
      }
    }
  }

  func test_benchmark_createGridView() {
    measure {
      for _ in 0..<100 {
        let view = MasonUIView.createGridView(mason)
        XCTAssertEqual(view.style.display, .Grid)
      }
    }
  }

  func test_benchmark_createBlockView() {
    measure {
      for _ in 0..<100 {
        let view = MasonUIView.createBlockView(mason)
        XCTAssertEqual(view.style.display, .Block)
      }
    }
  }

  func test_benchmark_layoutSimpleView() {
    let view = MasonUIView(mason: mason)
    view.setSize(100, 100)

    measure {
      view.compute(-1, -1)
      let layout = view.layout()
      XCTAssertGreaterThan(layout.width, 0)
    }
  }

  func test_benchmark_layoutWithChildren() {
    let parent = MasonUIView(mason: mason)
    parent.setSize(500, 500)
    parent.flexDirection = .Column

    for _ in 0..<10 {
      let child = MasonUIView(mason: mason)
      child.setSize(50, 50)
      parent.addView(child)
    }

    measure {
      parent.compute(-1, -1)
      let layout = parent.layout()
      XCTAssertGreaterThan(layout.width, 0)
    }
  }

  func test_benchmark_layoutDeeplyNested() {
    var current = MasonUIView(mason: mason)
    current.setSize(500, 500)
    let root = current

    for _ in 0..<5 {
      let child = MasonUIView(mason: mason)
      child.setSize(100, 100)
      current.addView(child)
      current = child
    }

    measure {
      root.compute(-1, -1)
      let layout = root.layout()
      XCTAssertGreaterThan(layout.width, 0)
    }
  }

  func test_benchmark_layoutComplexFlexbox() {
    let parent = MasonUIView.createFlexView(mason)
    parent.setSize(500, 500)
    parent.flexDirection = .Row

    for index in 0..<20 {
      let child = MasonUIView(mason: mason)
      child.flexGrow = Float(index % 3 + 1)
      child.flexShrink = 1
      parent.addView(child)
    }

    measure {
      parent.compute(-1, -1)
      let layout = parent.layout()
      XCTAssertGreaterThan(layout.width, 0)
    }
  }

  func test_benchmark_layoutGrid() {
    let grid = MasonUIView.createGridView(mason)
    grid.setSize(500, 500)
    grid.gridTemplateColumns = "repeat(3, 1fr)"
    grid.gridTemplateRows = "repeat(3, 1fr)"

    for _ in 0..<9 {
      let item = MasonUIView(mason: mason)
      grid.addView(item)
    }

    measure {
      grid.compute(-1, -1)
      let layout = grid.layout()
      XCTAssertGreaterThan(layout.width, 0)
    }
  }

  func test_benchmark_updateSingleStyleProperty() {
    let view = MasonUIView(mason: mason)

    measure {
      view.inBatch = true
      view.flexGrow = 1.5
      view.inBatch = false
    }
  }

  func test_benchmark_updateMultipleStyleProperties() {
    let view = MasonUIView(mason: mason)

    measure {
      view.inBatch = true
      view.flexGrow = 1.5
      view.flexShrink = 0.5
      view.flexDirection = .Row
      view.setSize(200, 200)
      view.setPadding(10, 10, 10, 10)
      view.setMargin(5, 5, 5, 5)
      view.inBatch = false
    }
  }

  func test_benchmark_updatePadding() {
    let view = MasonUIView(mason: mason)

    measure {
      view.setPadding(10, 15, 20, 25)
    }
  }

  func test_benchmark_updateMargin() {
    let view = MasonUIView(mason: mason)

    measure {
      view.setMargin(5, 10, 15, 20)
    }
  }

  func test_benchmark_updateSize() {
    let view = MasonUIView(mason: mason)

    measure {
      view.inBatch = true
      view.setSize(200, 300)
      view.inBatch = false
    }
  }

  func test_benchmark_updateDisplay() {
    let view = MasonUIView(mason: mason)

    measure {
      view.inBatch = true
      view.display = .Flex
      view.inBatch = false
    }
  }

  func test_benchmark_updatePosition() {
    let view = MasonUIView(mason: mason)

    measure {
      view.inBatch = true
      view._position = .Absolute
      view.inBatch = false
    }
  }

  func test_benchmark_addSingleChild() {
    let parent = MasonUIView(mason: mason)
    let child = MasonUIView(mason: mason)

    measure {
      if child.node.parent != nil {
        parent.node.removeChild(child.node)
      }
      parent.addView(child)
    }
  }

  func test_benchmark_addMultipleChildren() {
    let parent = MasonUIView(mason: mason)
    let children = (0..<10).map { _ in MasonUIView(mason: mason) }

    measure {
      parent.node.removeAllChildren()
      for child in children {
        parent.addView(child)
      }
    }
  }

  func test_benchmark_removeChild() {
    let parent = MasonUIView(mason: mason)
    let children = (0..<10).map { _ in MasonUIView(mason: mason) }
    for child in children {
      parent.addView(child)
    }

    measure {
      if parent.node.getChildren().isEmpty {
        for child in children {
          parent.addView(child)
        }
      }
      parent.node.removeChildAt(index: 0)
    }
  }

  func test_benchmark_removeAllChildren() {
    let parent = MasonUIView(mason: mason)
    let children = (0..<10).map { _ in MasonUIView(mason: mason) }

    measure {
      if parent.node.getChildren().isEmpty {
        for child in children {
          parent.addView(child)
        }
      }
      parent.node.removeAllChildren()
    }
  }

  func test_benchmark_addChildAtIndex() {
    let parent = MasonUIView(mason: mason)
    let baseChildren = (0..<10).map { _ in MasonUIView(mason: mason) }
    for child in baseChildren {
      parent.addView(child)
    }
    let childToInsert = MasonUIView(mason: mason)

    measure {
      if childToInsert.node.parent != nil {
        parent.node.removeChild(childToInsert.node)
      }
      parent.addView(childToInsert, at: 5)
    }
  }

  func test_benchmark_zIndexSorting() {
    let parent = MasonUIView(mason: mason)

    for index in 0..<20 {
      let child = MasonUIView(mason: mason)
      child.style.zIndex = Int32(index % 5)
      parent.addView(child)
    }

    measure {
      parent.setNeedsDisplay()
    }
  }

  func test_benchmark_createComplexHierarchy() {
    let root = MasonUIView.createFlexView(mason)
    root.setSize(500, 500)

    let level1Views = (0..<3).map { _ -> MasonUIView in
      let v = MasonUIView.createFlexView(mason)
      v.flexDirection = .Column
      return v
    }

    let level2Views = (0..<9).map { _ -> MasonUIView in
      let v = MasonUIView(mason: mason)
      v.setSize(50, 50)
      v.setMargin(5, 5, 5, 5)
      return v
    }

    measure {
      root.node.removeAllChildren()
      for level1 in level1Views {
        level1.node.removeAllChildren()
      }

      for (i, level1) in level1Views.enumerated() {
        for j in 0..<3 {
          level1.addView(level2Views[i * 3 + j])
        }
        root.addView(level1)
      }

      XCTAssertEqual(root.node.getChildren().count, 3)
    }
  }

  func test_benchmark_fullLayoutCycle() {
    let parent = MasonUIView.createFlexView(mason)
    parent.setSize(500, 500)

    for _ in 0..<10 {
      let child = MasonUIView(mason: mason)
      child.flexGrow = 1
      child.setSize(0, 50)
      parent.addView(child)
    }

    measure {
      parent.compute(-1, -1)
      let layout = parent.layout()
      XCTAssertGreaterThan(layout.width, 0)
      XCTAssertGreaterThan(layout.height, 0)
    }
  }
}

/// applyToView skips a node whose box, style and view are unchanged; style-only changes must still land.
final class ReapplyTests: XCTestCase {
  private let mason = NSCMason.shared

  private func tree() -> (MasonUIView, MasonUIView) {
    let root = MasonUIView(mason: mason)
    let child = MasonUIView(mason: mason)
    child.setSize(50, 50)
    root.addView(child)
    root.computeWithSize(100, 100)
    return (root, child)
  }

  func testAspectRatioChangesInvalidateAnExistingLayout() {
    let scale = NSCMason.scale
    let root = MasonUIView(mason: mason)
    root.style.display = .Flex
    root.style.flexDirection = .Column
    root.style.alignItems = .FlexStart
    let child = MasonUIView(mason: mason)
    child.style.width = .Points(80 * scale)
    child.style.aspectRatio = 2
    root.addView(child)

    root.computeWithSize(200 * scale, 200 * scale)
    XCTAssertEqual(child.frame.height, 40, accuracy: 0.01)
    child.style.aspectRatio = 4
    root.computeWithSize(200 * scale, 200 * scale)
    XCTAssertEqual(child.frame.height, 20, accuracy: 0.01)
    child.style.aspectRatio = nil
    XCTAssertNil(child.style.aspectRatio)
  }

  func test_overflowChangeWithoutResizeIsApplied() {
    let (root, child) = tree()
    XCTAssertFalse(child.clipsToBounds)
    child.configure { $0.overflow = MasonPoint(.Hidden, .Hidden) }
    root.computeWithSize(100, 100)
    XCTAssertTrue(child.clipsToBounds)
    child.configure { $0.overflow = MasonPoint(.Visible, .Visible) }
    root.computeWithSize(100, 100)
    XCTAssertFalse(child.clipsToBounds)
  }

  func test_borderRadiusOnClippedBoxWithoutResizeRoundsTheClip() {
    let (root, child) = tree()
    child.configure { $0.overflow = MasonPoint(.Hidden, .Hidden) }
    root.computeWithSize(100, 100)
    XCTAssertNil(child.layer.mask)
    XCTAssertEqual(child.layer.cornerRadius, 0)
    child.style.borderRadius = "10px"
    root.computeWithSize(100, 100)
    // One circular radius clips through the layer's own corners.
    XCTAssertTrue(child.clipsToBounds)
    // Scaled down as CSS does when adjacent corners would overlap.
    let side = min(child.bounds.width, child.bounds.height)
    XCTAssertEqual(child.layer.cornerRadius, min(10, side / 2), accuracy: 0.01, "the rounded clip must follow a radius change")
    child.style.borderRadius = "10px / 4px"
    root.computeWithSize(100, 100)
    XCTAssertNotNil(child.layer.mask as? CAShapeLayer, "elliptical corners still need the shape")
  }

  func test_unchangedPassKeepsFramesAndResizeStillApplies() {
    let (root, child) = tree()
    let first = child.frame
    root.computeWithSize(100, 100)
    XCTAssertEqual(child.frame, first)
    child.setSize(70, 30)
    root.computeWithSize(100, 100)
    XCTAssertEqual(child.frame.size.width, first.size.width * 70 / 50, accuracy: 0.5)
  }
}

final class CSSFilterFunctionTests: XCTestCase {

  /// One opaque sRGB pixel through a filter chain, as 0...255 channels.
  private func run(_ css: String, _ r: CGFloat, _ g: CGFloat, _ b: CGFloat) throws -> [Int] {
    let device = try XCTUnwrap(MTLCreateSystemDefaultDevice())
    let context = CSSFilters.makeContext(device)
    let input = CIImage(color: CIColor(red: r, green: g, blue: b, alpha: 1, colorSpace: CSSFilters.sRGB)!)
      .cropped(to: CGRect(x: 0, y: 0, width: 4, height: 4))
    let output = CSSFilters.applyBackdropChain(CSSFilters.parse(css), to: input, scale: 1)
    var px = [UInt8](repeating: 0, count: 4)
    context.render(output, toBitmap: &px, rowBytes: 4, bounds: CGRect(x: 1, y: 1, width: 1, height: 1),
                   format: .RGBA8, colorSpace: CSSFilters.sRGB)
    return px.prefix(3).map { Int($0) }
  }

  private func assertPixel(_ css: String, _ input: (CGFloat, CGFloat, CGFloat), _ expected: [Int], line: UInt = #line) throws {
    let actual = try run(css, input.0, input.1, input.2)
    for (a, e) in zip(actual, expected) {
      XCTAssertEqual(a, e, accuracy: 2, "\(css): \(actual) vs \(expected)", line: line)
    }
  }

  func testColorFunctionsMatchTheSpecInSRGB() throws {
    // Expected values: the Filter Effects 1 matrices applied to gamma-encoded sRGB, as browsers do.
    try assertPixel("brightness(0.5)", (1, 1, 1), [128, 128, 128])
    try assertPixel("brightness(1.5)", (0.4, 0.2, 0), [153, 77, 0])
    try assertPixel("contrast(2)", (0.75, 0.25, 0.5), [255, 0, 128])
    try assertPixel("grayscale(1)", (1, 0, 0), [54, 54, 54])
    try assertPixel("sepia(1)", (1, 1, 1), [255, 255, 239])
    try assertPixel("saturate(0)", (0, 0, 1), [18, 18, 18])
    try assertPixel("hue-rotate(90deg)", (1, 0, 0), [0, 91, 0])
    try assertPixel("invert(1)", (1, 0.25, 0), [0, 191, 255])
    try assertPixel("invert(0.5)", (1, 0, 0), [128, 128, 128])
    try assertPixel("brightness(2) contrast(0.5)", (0.25, 0.25, 0.25), [128, 128, 128])
  }

  func testLengthsAreCSSPixels() {
    guard case .blur(let radius) = CSSFilters.parse("blur(6px)").first else { return XCTFail("blur") }
    XCTAssertEqual(radius, 6)
    guard case .dropShadow(let x, let y, let blur, _) = CSSFilters.parse("drop-shadow(2px 3px 4px black)").first else { return XCTFail("drop-shadow") }
    XCTAssertEqual([x, y, blur], [2, 3, 4])
  }
}

final class ElementFilterTests: XCTestCase {
  private let box = CGRect(x: 0, y: 0, width: 20, height: 20)

  /// An opaque `color` square the size of `box`, at 1 pixel per point.
  private func square(_ color: CIColor) -> CIImage {
    CIImage(color: color).cropped(to: box)
  }

  /// RGBA at Core Image pixel (x, y), y up from the box's bottom edge.
  private func rgba(_ image: CIImage, _ x: CGFloat, _ y: CGFloat) throws -> [Int] {
    let device = try XCTUnwrap(MTLCreateSystemDefaultDevice())
    var px = [UInt8](repeating: 0, count: 4)
    CSSFilters.makeContext(device).render(image, toBitmap: &px, rowBytes: 4, bounds: CGRect(x: x, y: y, width: 1, height: 1),
                                          format: .RGBA8, colorSpace: CSSFilters.sRGB)
    return px.map { Int($0) }
  }

  func testPaintRegionGrowsByThreeDeviationsPerBlurAndFollowsShadows() {
    XCTAssertEqual(CSSFilters.paintRegion(CSSFilters.parse("blur(4px)"), box: CGRect(x: 0, y: 0, width: 100, height: 50)),
                   CGRect(x: -12, y: -12, width: 124, height: 74))
    // The third length is the standard deviation, so 12pt around the offset box.
    XCTAssertEqual(CSSFilters.paintRegion(CSSFilters.parse("drop-shadow(10px 5px 4px black)"), box: CGRect(x: 0, y: 0, width: 100, height: 50)),
                   CGRect(x: -2, y: -7, width: 124, height: 74))
    XCTAssertEqual(CSSFilters.paintRegion(CSSFilters.parse("grayscale(1)"), box: box), box)
    XCTAssertEqual(CSSFilters.paintRegionPixels(CSSFilters.parse("blur(1px)"), box: box, scale: 3),
                   CGRect(x: -9, y: -9, width: 78, height: 78))
  }

  func testChainKinds() {
    XCTAssertTrue(CSSFilters.isShadowOnly(CSSFilters.parse("drop-shadow(1px 1px red) drop-shadow(2px 2px blue)")))
    XCTAssertFalse(CSSFilters.isShadowOnly(CSSFilters.parse("drop-shadow(1px 1px red) brightness(0.5)")))
    XCTAssertTrue(CSSFilters.needsBackdropCover(CSSFilters.parse("blur(2px)")))
    XCTAssertTrue(CSSFilters.needsBackdropCover(CSSFilters.parse("grayscale(1) opacity(0.5)")))
    XCTAssertFalse(CSSFilters.needsBackdropCover(CSSFilters.parse("drop-shadow(1px 1px 2px red) sepia(1)")))
  }

  func testBlurSpreadsPastTheBoxAndFadesAtItsEdges() throws {
    let out = CSSFilters.applyElementChain(CSSFilters.parse("blur(4px)"), to: square(CIColor(red: 1, green: 0, blue: 0)), scale: 1)
    XCTAssertGreaterThan(try rgba(out, -3, 10)[3], 20, "paints outside the box")
    XCTAssertEqual(Double(try rgba(out, 0, 10)[3]), 128, accuracy: 20, "half covered at the edge")
    // A 2.5 sd margin on both axes: erf(2.5 / sqrt(2)) squared.
    XCTAssertEqual(try rgba(out, 10, 10)[3], 249, accuracy: 3)
    XCTAssertLessThan(try rgba(out, -13, 10)[3], 2)
  }

  func testDropShadowIsTheBlurredAlphaInItsColourUnderTheImage() throws {
    let white = square(CIColor(red: 1, green: 1, blue: 1))
    let out = CSSFilters.applyElementChain(CSSFilters.parse("drop-shadow(40px 0 4px blue)"), to: white, scale: 1)
    XCTAssertEqual(Array(try rgba(out, 10, 10).prefix(3)), [255, 255, 255], "the element stays on top")
    let centre = try rgba(out, 50, 10)
    XCTAssertEqual(centre[2], centre[3], accuracy: 3)
    XCTAssertLessThan(centre[0], 10, "the shadow is its colour, not a copy of the element")
    XCTAssertGreaterThan(centre[3], 230)
    XCTAssertEqual(Double(try rgba(out, 60, 10)[3]), 128, accuracy: 25, "blurred, not a hard edge")

    let shadows = CSSFilters.applyShadowsOnly(CSSFilters.parse("drop-shadow(40px 0 4px blue)"), to: white, scale: 1)
    XCTAssertLessThan(try rgba(shadows, 10, 10)[3], 10, "the shadow-only output leaves the element out")
    XCTAssertGreaterThan(try rgba(shadows, 50, 10)[3], 230)
  }

  func testShadowColoursParseWithoutCrashing() {
    for css in ["drop-shadow(1px 1px rgb(0 0 0 / 50%))", "drop-shadow(1px 1px #zzz)", "drop-shadow(1px 1px hsl(120 100% 50%))", "drop-shadow(#ff000080 1px 1px)"] {
      XCTAssertEqual(CSSFilters.parse(css).count, 1, css)
    }
    guard case .dropShadow(_, _, _, let color) = CSSFilters.parse("drop-shadow(#ff000080 1px 1px)").first else { return XCTFail("parse") }
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
    color.getRed(&r, green: &g, blue: &b, alpha: &a)
    XCTAssertEqual(r, 1, accuracy: 0.01)
    XCTAssertEqual(a, 0.5, accuracy: 0.01)
  }
}

final class BackdropCaptureTests: XCTestCase {
  /// The sRGB pixel at (x, 5) of `layer` rendered with `render(in:)`.
  private func pixel(_ layer: CALayer, _ x: CGFloat) -> [UInt8] {
    let fmt = UIGraphicsImageRendererFormat()
    fmt.scale = 1
    fmt.preferredRange = .standard
    let img = UIGraphicsImageRenderer(size: layer.bounds.size, format: fmt).image { ctx in layer.render(in: ctx.cgContext) }
    var px = [UInt8](repeating: 0, count: 4)
    CIContext().render(CIImage(cgImage: img.cgImage!), toBitmap: &px, rowBytes: 4, bounds: CGRect(x: x, y: 5, width: 1, height: 1),
                       format: .RGBA8, colorSpace: CSSFilters.sRGB)
    return Array(px.prefix(3))
  }

  func testGradientLayersAreCapturedAsTheScreenShowsThem() {
    let root = CALayer()
    root.frame = CGRect(x: 0, y: 0, width: 100, height: 10)
    let g = CAGradientLayer()
    g.frame = root.bounds
    g.colors = [UIColor.blue.cgColor, UIColor.magenta.cgColor]
    g.startPoint = CGPoint(x: 0, y: 0.5)
    g.endPoint = CGPoint(x: 1, y: 0.5)
    root.addSublayer(g)

    // render(in:) alone blends blue to magenta through green.
    XCTAssertGreaterThan(pixel(root, 50)[1], 30)

    let swapped = CSSFilters.substituteGradients(in: root, rect: root.bounds, scale: 1)
    XCTAssertEqual(swapped.count, 1)
    let mid = pixel(root, 50)
    XCTAssertEqual(Double(mid[0]), 128, accuracy: 3)
    XCTAssertEqual(mid[1], 0)
    XCTAssertEqual(mid[2], 255)
    XCTAssertEqual(pixel(root, 2)[0], 3, accuracy: 4, "start at the left")
    for (layer, colors, contents) in swapped {
      layer.colors = colors
      layer.contents = contents
    }
    XCTAssertEqual(g.colors?.count, 2)
    XCTAssertNil(g.contents)
    XCTAssertTrue(CSSFilters.substituteGradients(in: root, rect: CGRect(x: 200, y: 0, width: 10, height: 10), scale: 1).isEmpty,
                  "a gradient outside the region is left alone")
  }
}

final class TextFeatureTests: XCTestCase {

  private func width(_ s: NSAttributedString) -> CGFloat {
    CGFloat(CTLineGetTypographicBounds(CTLineCreateWithAttributedString(s), nil, nil, nil))
  }

  func testUnsetTextJustifyReadsAsAuto() {
    let text = NSCMason.shared.createTextView(type: .P)
    XCTAssertEqual(text.node.style.resolvedTextJustify, .Auto)
  }

  func testFontFeatureSettingsReachCoreText() {
    let text = NSCMason.shared.createTextView(type: .P)
    text.engine.textContent = "text"
    let run = text.node.children.first as? MasonTextNode
    _ = run?.attributed()
    XCTAssertEqual(run?.attributesStale, false)
    let style = text.node.style
    XCTAssertTrue(style.resolvedFontFeatures.isEmpty)
    style.inBatch = true
    style.fontFeatureSettings = "\"liga\" 0, 'tnum', \"ss01\" on, \"kern\" off, \"cv01\" 3"
    style.inBatch = false
    XCTAssertEqual(run?.attributesStale, true)
    let features = style.resolvedFontFeatures
    XCTAssertEqual(features.compactMap { $0[kCTFontOpenTypeFeatureTag] as? String }, ["liga", "tnum", "ss01", "kern", "cv01"])
    XCTAssertEqual(features.compactMap { $0[kCTFontOpenTypeFeatureValue] as? UInt32 }, [0, 1, 1, 0, 3])
    XCTAssertEqual(style.getUInt8(StyleKeys.FONT_FEATURES_REVISION), 1)
    style.fontFeatureSettings = "'liga' -1"
    XCTAssertEqual(style.resolvedFontFeatures.count, 5)
    XCTAssertEqual(style.getUInt8(StyleKeys.FONT_FEATURES_REVISION), 1)
    style.fontFeatureSettings = "NORMAL"
    XCTAssertTrue(style.resolvedFontFeatures.isEmpty)
    XCTAssertEqual(style.getUInt8(StyleKeys.FONT_FEATURES_REVISION), 2)
  }

  func testTabularNumbersChangeDigitWidths() {
    let font = CTFontCreateUIFontForLanguage(.system, 16, nil)!
    let attrs = [kCTFontFeatureSettingsAttribute: [[kCTFontOpenTypeFeatureTag: "tnum", kCTFontOpenTypeFeatureValue: 1]] as CFArray] as CFDictionary
    let tabular = CTFontCreateCopyWithAttributes(font, 0, nil, CTFontDescriptorCreateWithAttributes(attrs))
    let ones = width(NSAttributedString(string: "1111", attributes: [.font: font]))
    let tabularOnes = width(NSAttributedString(string: "1111", attributes: [.font: tabular]))
    let zeros = width(NSAttributedString(string: "0000", attributes: [.font: tabular]))
    XCTAssertNotEqual(ones, tabularOnes, accuracy: 0.1)
    XCTAssertEqual(tabularOnes, zeros, accuracy: 0.1)
  }

  func testFontStretchNarrowsAndWidens() {
    let font = CTFontCreateUIFontForLanguage(.system, 16, nil)!
    let normal = width(NSAttributedString(string: "Wide and narrow", attributes: [.font: font]))
    let condensed = width(NSAttributedString(string: "Wide and narrow", attributes: [.font: applyingFontStretch(font, percent: 75)]))
    let expanded = width(NSAttributedString(string: "Wide and narrow", attributes: [.font: applyingFontStretch(font, percent: 125)]))
    XCTAssertLessThan(condensed, normal - 5)
    XCTAssertGreaterThan(expanded, normal + 5)
  }

  func testWordSpacingKernsSpacesOnly() {
    let s = NSMutableAttributedString(string: "a b\u{00A0}c", attributes: [.kern: CGFloat(1), Constants.WORD_SPACING_KEY: CGFloat(5)])
    TextEngine.applyWordSpacing(s)
    XCTAssertEqual(s.attribute(.kern, at: 0, effectiveRange: nil) as? CGFloat, 1)
    XCTAssertEqual(s.attribute(.kern, at: 1, effectiveRange: nil) as? CGFloat, 6)
    XCTAssertEqual(s.attribute(.kern, at: 3, effectiveRange: nil) as? CGFloat, 6)
    // A container flattening this string applies nothing more.
    TextEngine.applyWordSpacing(s)
    XCTAssertEqual(s.attribute(.kern, at: 1, effectiveRange: nil) as? CGFloat, 6)
  }

  func testInterCharacterJustificationFillsEachLineButTheLast() {
    let font = CTFontCreateWithName("Helvetica" as CFString, 16, nil)
    let text = NSAttributedString(string: "aaaa bbbb cccc dddd eeee ffff", attributes: [.font: font])
    let justified = TextEngine.justifying(text, 100, .characters)
    let path = CGPath(rect: CGRect(x: 0, y: 0, width: 100, height: 1000), transform: nil)
    let before = CTFramesetterCreateFrame(CTFramesetterCreateWithAttributedString(text), CFRange(), path, nil)
    let frame = CTFramesetterCreateFrame(CTFramesetterCreateWithAttributedString(justified), CFRange(), path, nil)
    let lines = CTFrameGetLines(frame) as! [CTLine]
    XCTAssertEqual(lines.count, (CTFrameGetLines(before) as! [CTLine]).count, "same breaks")
    XCTAssertGreaterThan(lines.count, 1)
    for line in lines.dropLast() {
      let used = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) - CGFloat(CTLineGetTrailingWhitespaceWidth(line))
      XCTAssertEqual(used, 100, accuracy: 0.1)
    }
    let last = lines.last!
    XCTAssertLessThan(CGFloat(CTLineGetTypographicBounds(last, nil, nil, nil)), 99)
  }

  func testInterWordJustificationWidensOnlySpaces() {
    let font = CTFontCreateWithName("Helvetica" as CFString, 16, nil)
    let text = NSAttributedString(string: "aaaa bbbb cccc dddd eeee ffff", attributes: [.font: font])
    let justified = TextEngine.justifying(text, 100, .words)
    for i in 0..<justified.length {
      let kern = justified.attribute(.kern, at: i, effectiveRange: nil) as? CGFloat
      if (text.string as NSString).character(at: i) != 0x20 { XCTAssertNil(kern, "letters keep their spacing") }
    }
    let path = CGPath(rect: CGRect(x: 0, y: 0, width: 100, height: 1000), transform: nil)
    let lines = CTFrameGetLines(CTFramesetterCreateFrame(CTFramesetterCreateWithAttributedString(justified), CFRange(), path, nil)) as! [CTLine]
    for line in lines.dropLast() where CTLineGetStringRange(line).length > 5 {
      let used = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil)) - CGFloat(CTLineGetTrailingWhitespaceWidth(line))
      XCTAssertEqual(used, 100, accuracy: 0.1)
    }
  }

  func testPercentTranslateResolvesAgainstTheBox() {
    let ops: [(type: TransformOpType, percent: UInt8, a: CGFloat, b: CGFloat)] = [
      (.translate, StyleKeys.TRANSFORM_OP_A_PERCENT | StyleKeys.TRANSFORM_OP_B_PERCENT, -50, -50),
      (.translateX, 0, 10, 0),
    ]
    let t = MasonStyle.composeTransformOps(ops, size: CGSize(width: 60, height: 30))
    XCTAssertEqual(t.tx, -20, accuracy: 1e-6)
    XCTAssertEqual(t.ty, -15, accuracy: 1e-6)
  }
}

final class HTMLParserTests: XCTestCase {
  func testSchemaKeywordsReachNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="display: INLINE-GRID; grid-auto-flow: dense  COLUMN;
        align-items: flex-end; justify-self: invalid; text-wrap: pretty;
        hyphens: auto; writing-mode: VERTICAL-RL; unicode-bidi: isolate;
        text-orientation: sideways-right; text-combine-upright: digits 4;
        text-spacing-trim: trim-both; line-clamp: 200; -webkit-line-clamp: 3;
        line-clamp: 5px"></div>
      """).first)
    let style = root.style
    XCTAssertEqual(style.display, .InlineGrid)
    XCTAssertEqual(style.gridAutoFlow, .ColumnDense)
    XCTAssertEqual(style.alignItems, .End)
    XCTAssertEqual(style.textWrap, .Pretty)
    XCTAssertEqual(style.resolvedHyphens, 2)
    XCTAssertEqual(style.resolvedWritingMode, 1)
    XCTAssertEqual(style.resolvedUnicodeBidi, 3)
    XCTAssertEqual(style.resolvedTextOrientation, 2)
    XCTAssertEqual(style.resolvedTextCombineUpright, 4)
    XCTAssertEqual(style.resolvedTextSpacingTrim, 4)
    XCTAssertEqual(style.resolvedLineClamp, 3)
    XCTAssertNil(NSCMason.htmlKeyword("justify-self", "invalid"))
  }

  func testRustGeometryReachesNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="aspect-ratio: auto 3 / 2; transform-origin: calc(10px + 5px) 25%"></div>
      """).first)
    XCTAssertEqual(root.style.aspectRatio, 1.5)
    XCTAssertEqual(root.style.transformOrigin.x, .Points(15 * NSCMason.scale))
    XCTAssertEqual(root.style.transformOrigin.y, .Percent(0.25))
  }

  func testRustTypographyReachesNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="line-height: 150%; letter-spacing: 0.25em; font-size: 20px;
        text-indent: 5% hanging; font-weight: BOLD; font-stretch: semi-condensed;
        font-family: 'Missing, Font', monospace; font-family: url(bad); font-feature-settings: 'tnum' on"></div>
      """).first)
    let style = root.style
    XCTAssertEqual(style.fontSize, 20)
    XCTAssertEqual(style.fontWeight, "bold")
    XCTAssertEqual(style.fontFamily, "monospace")
    XCTAssertEqual(style.lineHeight, 30)
    XCTAssertEqual(style.resolvedLineHeightType, 1)
    XCTAssertEqual(style.letterSpacing, 5 * NSCMason.scale)
    XCTAssertEqual(style.textIndent, .Percent(0.05))
    XCTAssertEqual(style.resolvedFontStretch, 8750)
    XCTAssertEqual(style.resolvedFontFeatures.first?[kCTFontOpenTypeFeatureTag] as? String, "tnum")
  }

  func testRustFontStyleAndWordSpacingReachNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="font-style: oblique -0.125turn; word-spacing: 25%;
        font-variant-numeric: tabular-nums slashed-zero; vertical-align: -25%"></div>
      """).first)
    let style = root.style
    XCTAssertEqual(style.fontStyle, .Oblique)
    XCTAssertEqual(style.getInt32(StyleKeys.FONT_STYLE_SLANT), -45)
    let spacing = try XCTUnwrap(style.resolvedWordSpacingValue)
    XCTAssertTrue(spacing.isPercent)
    XCTAssertEqual(spacing.value, 25)
    XCTAssertEqual(style.fontVariantNumeric, [.tabularNums, .slashedZero])
    XCTAssertTrue(style.verticalAlign.isPercent)
    XCTAssertEqual(style.verticalAlign.offset, -0.25)
    style.verticalAlign = .Top
    XCTAssertEqual(style.verticalAlign.align, .Top)
    style.verticalAlign = .percent(0.2)
    XCTAssertTrue(style.verticalAlign.isPercent)
    XCTAssertEqual(style.verticalAlign.offset, 0.2)
    XCTAssertEqual(MasonVerticalAlignValue(style: style).offset, 0.2)
    style.fontStyle = .Italic
    XCTAssertEqual(style.fontStyle, .Italic)
    XCTAssertEqual(style.getInt32(StyleKeys.FONT_STYLE_SLANT), 0)
  }

  func testRustInlineBatchPreservesDeclarationOrder() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="/* a:b;c */ display: grid; --ignored: url(data:image/svg+xml;x:y);
        flex-flow: column wrap; flex-direction: row; display: flex; overflow: hidden scroll;
        text-justify: INTER-WORD"></div>
      """).first)
    XCTAssertEqual(root.style.display, .Flex)
    XCTAssertEqual(root.style.flexDirection, .Row)
    XCTAssertEqual(root.style.flexWrap, .Wrap)
    XCTAssertEqual(root.style.overflowX, .Hidden)
    XCTAssertEqual(root.style.overflowY, .Scroll)
    XCTAssertEqual(root.style.textJustify, .InterWord)
  }

  func testRustInlineBatchResolvesInheritedFontContextAndViewportOverrides() throws {
    let parser = HTMLParser(mason: NSCMason.shared)
    let root = try XCTUnwrap(parser.parse("""
      <div style="font-size: 20px"><div style="letter-spacing: .5em; padding-left: 2em;
        font-size: calc(125% + 5px); line-height: 150%; width: 10vw; width: 30px"></div></div>
      """).first)
    let style = try XCTUnwrap(root.getChildren().first).style
    XCTAssertEqual(style.fontSize, 30)
    XCTAssertEqual(style.letterSpacing, 15 * NSCMason.scale)
    XCTAssertEqual(style.padding.left, .Points(60 * NSCMason.scale))
    XCTAssertEqual(style.lineHeight, 45)
    style.height = .Points(40)
    HTMLParser.refreshViewportStyles()
    XCTAssertEqual(style.width, .Points(30 * NSCMason.scale))
    XCTAssertEqual(style.height, .Points(40))
  }

  func testViewportReplayUpdatesInheritedFontChain() throws {
    let parser = HTMLParser(mason: NSCMason.shared)
    let root = try XCTUnwrap(parser.parse("""
      <div style="font-size: 5vw"><div style="font-size: calc(50% + 5px)"><div><div style="padding-left: 2em;
         line-height: 150%; height: 30px"></div></div></div><div style="font-size: 12px; padding-left: 2em"></div></div>
      """).first)
    let relative = try XCTUnwrap(root.getChildren().first)
    let container = try XCTUnwrap(relative.getChildren().first)
    let leaf = try XCTUnwrap(container.getChildren().first).style
    let fixed = try XCTUnwrap(root.getChildren().last).style
    HTMLParser.refreshViewportStyles(viewport: CGSize(width: 400, height: 800))
    XCTAssertEqual(relative.style.resolvedFontSize, 15)
    XCTAssertEqual(leaf.padding.left, .Points(30 * NSCMason.scale))
    leaf.height = .Points(70)
    fixed.paddingLeft = .Points(90)

    HTMLParser.refreshViewportStyles(viewport: CGSize(width: 800, height: 800))
    XCTAssertEqual(relative.style.resolvedFontSize, 25)
    XCTAssertEqual(leaf.padding.left, .Points(50 * NSCMason.scale))
    XCTAssertEqual(leaf.lineHeight, 37.5)
    XCTAssertEqual(leaf.height, .Points(70))
    XCTAssertEqual(fixed.padding.left, .Points(90))
  }

  func testRustInlineBatchAppliesResolvedBordersAndFinalMaskValues() throws {
    let parser = HTMLParser(mason: NSCMason.shared)
    let root = try XCTUnwrap(parser.parse("""
      <div style="border: .25em solid red; border-radius: .5em / 20%;
        mask: linear-gradient(currentColor, transparent) center / contain;
        mask-repeat: no-repeat; mask-border: none; mask-border-width: 4px;
        clip-path: inset(1px); color: #0080ff; font-size: 20px"></div>
      """).first)
    let style = root.style
    XCTAssertEqual(style.mBorderRender.top.width, .Points(5 * NSCMason.scale))
    XCTAssertEqual(style.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE), 10 * NSCMason.scale)
    XCTAssertEqual(style.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE), 0.2)
    XCTAssertEqual(style.maskRepeat, "no-repeat")
    XCTAssertEqual(style.maskBorderWidth, "4px")
    XCTAssertEqual(style.clipPath, "inset(1px)")
    let gradient = try XCTUnwrap(style.mMaskStorage?.layers.first?.paint.gradient)
    XCTAssertEqual(gradient.resolvedStops().first?.color, 0xff0080ff)
  }

  func testRustInlineBatchInstallsBackgroundOnce() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="background-repeat: round; color: red; background: url(a.svg) lime;
        color: blue; background-size: 2em auto; background-image: linear-gradient(currentColor, white);
        color: black; background-repeat: space; background-color: #123456; background: invalid;
        font-size: 20px"></div>
      """).first)
    let style = root.style
    XCTAssertEqual(style.getUInt32(StyleKeys.BACKGROUND_REVISION), 1)
    let layer = try XCTUnwrap(style.mBackground.layers.first)
    XCTAssertEqual(style.background, "url(a.svg) lime")
    XCTAssertEqual(style.backgroundColor, 0xff123456)
    XCTAssertEqual(style.backgroundRepeat, "space")
    XCTAssertEqual(layer.size?.width?.points, 40)
    XCTAssertEqual(layer.gradient?.resolvedStops().first?.color, 0xff0000ff)
  }

  func testRustInlineEffectBatchAppliesEachGroupOnce() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="box-shadow: 1px 2px blue; filter: blur(1px);
        box-shadow: calc(.1em + 2px) 3px rgb(calc(200 + 55) 0 0); text-shadow: 1px 2px blue;
        filter: blur(calc(1px + 1px)); backdrop-filter: brightness(calc(100% - 20%)); font-size: 20px"></div>
      """).first)
    let style = root.style
    for key in [StyleKeys.BOX_SHADOW_REVISION, StyleKeys.TEXT_SHADOW_REVISION,
                StyleKeys.FILTER_REVISION, StyleKeys.BACKDROP_FILTER_REVISION] {
      XCTAssertEqual(style.getUInt32(key), 1)
    }
    let shadow = try XCTUnwrap(style.boxShadows.first)
    XCTAssertEqual(shadow.offsetX, 4, accuracy: 0.001)
    XCTAssertEqual(shadow.color, UIColor.colorFromARGB(0xffff0000))
    XCTAssertEqual(style.filter, "blur(calc(1px + 1px))")
    XCTAssertEqual(style.backdropFilter, "brightness(calc(100% - 20%))")
  }

  func testGeneratedAccessorsKeepTypedValuesAndIsolateWrites() throws {
    let roots = HTMLParser(mason: NSCMason.shared).parse("<div></div><div></div>")
    XCTAssertEqual(roots.count, 2)
    let writer = try XCTUnwrap(roots.first).style
    let sibling = try XCTUnwrap(roots.last).style
    let original = sibling.margin.top
    let originalColor = sibling.color
    let originalBorder = sibling.borderWidth.bottom
    let siblingDirty = sibling.isDirty
    let siblingDirtyHigh = sibling.isDirtyHigh
    XCTAssertEqual(sibling.marginCompat.intoMasonRect().top, original)
    XCTAssertEqual(sibling.isDirty, siblingDirty)
    XCTAssertEqual(sibling.isDirtyHigh, siblingDirtyHigh)
    let siblingRightWidth = sibling.mBorderRight.width
    let siblingRightStyle = sibling.mBorderRight.style
    let siblingRightColor = sibling.mBorderRight.argb
    writer.mBorderRight.width = .Points(4)
    writer.mBorderRight.style = .dashed()
    writer.mBorderRight.setColor(color: 0xff030609)
    XCTAssertEqual(writer.borderWidth.right, .Points(4))
    XCTAssertEqual(writer.mBorderRight.style, .dashed())
    XCTAssertEqual(writer.mBorderRight.argb, 0xff030609)
    XCTAssertEqual(sibling.mBorderRight.width, siblingRightWidth)
    XCTAssertEqual(sibling.mBorderRight.style, siblingRightStyle)
    XCTAssertEqual(sibling.mBorderRight.argb, siblingRightColor)
    let siblingExponent = sibling.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT)
    writer.inBatch = true
    writer.cornerShape = "squircle notch"
    writer.cornerShapeBottomRight = "bevel"
    XCTAssertTrue(StateKeys(low: writer.isDirty, high: writer.isDirtyHigh).contains(.borderRadius))
    writer.inBatch = false
    XCTAssertEqual(writer.cornerShapeTopLeft, "squircle")
    XCTAssertEqual(writer.cornerShapeBottomRight, "bevel")
    XCTAssertEqual(writer.getFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT), -.infinity)
    XCTAssertEqual(sibling.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT), siblingExponent)
    writer.margin = MasonRect(.Percent(0.25), .Points(4), .Auto, .Points(8))
    writer.flexGrow = 2
    writer.decorationThickness = 3
    writer.color = 0xff123456
    writer.textWrap = .Balance
    writer.topInset = .Points(12)
    writer.size = MasonSize(.Points(80), .Percent(0.5))
    writer.setMinSizeWidthHeight(16, 1)
    writer.setMinSizeWidth(24, 1)
    writer.setMinSizeHeight(200, 255)
    writer.setRowGap(20, 0)
    writer.setColumnGap(0.25, 1)
    writer.paddingTop = .Points(6)
    writer.setBorderWidth(9, 0)
    writer.setBorderBottomWidth(0.25, 1)
    writer.setBorderColor("#010203 #040506 #070809 #0a0b0c")
    XCTAssertEqual(writer.margin.top, .Percent(0.25))
    XCTAssertEqual(writer.margin.right, .Points(4))
    XCTAssertEqual(writer.margin.bottom, .Auto)
    XCTAssertEqual(writer.marginLeft, .Points(8))
    XCTAssertEqual(writer.color, 0xff123456)
    XCTAssertEqual(writer.textWrap, .Balance)
    XCTAssertEqual(writer.topInset, .Points(12))
    XCTAssertEqual(writer.width, .Points(80))
    XCTAssertEqual(writer.height, .Percent(0.5))
    XCTAssertEqual(writer.minSizeCompat.intoMasonSize().width, .Points(24))
    XCTAssertEqual(writer.minSizeCompat.intoMasonSize().height, .Points(16))
    XCTAssertEqual(writer.gap.width, .Points(20))
    XCTAssertEqual(writer.gap.height, .Percent(0.25))
    XCTAssertEqual(writer.borderWidth.top, .Points(9))
    XCTAssertEqual(writer.borderWidth.left, .Points(9))
    XCTAssertEqual(writer.mBorderRight.width, .Points(9))
    XCTAssertEqual(writer.borderWidth.bottom, .Percent(0.25))
    XCTAssertEqual(writer.paddingTop, .Points(6))
    XCTAssertEqual(writer.mBorderBottom.argb, 0xff070809)
    XCTAssertEqual(sibling.borderWidth.bottom, originalBorder)
    XCTAssertEqual(CSSBorderRenderer.BorderStyle(name: "DASHED"), .dashed())
    XCTAssertNil(CSSBorderRenderer.BorderStyle(name: "dashed invalid"))
    XCTAssertEqual(sibling.color, originalColor)
    XCTAssertEqual(writer.flexGrow, 2)
    XCTAssertEqual(writer.decorationThickness, 3)
    XCTAssertEqual(sibling.margin.top, original)
    writer.inBatch = true
    writer.gridArea = "1 / 2 / 3 / 4"
    writer.gridRowStart = "5"
    writer.gridColumn = "tracks"
    writer.gridColumnEnd = "6"
    writer.width = .Points(91)
    writer.inBatch = false
    XCTAssertEqual(writer.gridRowStart, "5")
    XCTAssertEqual(writer.gridRowEnd, "3")
    XCTAssertEqual(writer.gridColumnStart, "tracks")
    XCTAssertEqual(writer.gridColumnEnd, "6")
    XCTAssertEqual(writer.width, .Points(91))
    writer.gridArea = ""
    XCTAssertEqual(writer.gridColumnEnd, "auto")
    writer.overflow = MasonPoint(.Hidden, .Scroll)
    XCTAssertEqual(writer.overflow.x, .Hidden)
    XCTAssertEqual(writer.overflow.y, .Scroll)

    let grid = MasonUIView.createGridView(NSCMason.shared)
    grid.setSize(500, 100)
    grid.style.inBatch = true
    grid.style.fontSize = 20
    let template = "repeat(2, calc(1em + 2dppx))"
    grid.style.gridTemplateColumns = template
    grid.style.inBatch = false
    grid.addView(MasonUIView(mason: NSCMason.shared))
    let second = MasonUIView(mason: NSCMason.shared)
    grid.addView(second)
    grid.compute(-1, -1)
    XCTAssertEqual(second.layout().x, 20 * NSCMason.scale + 2, accuracy: 0.5)
    XCTAssertEqual(grid.style.gridTemplateColumns, template)
  }

  func testRustLengthsReachNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="padding: calc(1rem + 2px) 3dppx; margin: calc(100% - 25%);
        border: calc(3px * 2) solid red; width: fit-content(calc(1rem + 2px));
        height: fit-content(calc(50% - 25%)); flex-basis: MIN-CONTENT; max-height: auto"></div>
      """).first)
    let style = root.style
    let scale = NSCMason.scale
    XCTAssertEqual(style.padding.top, .Points((NSCMason.rootFontSize + 2) * scale))
    XCTAssertEqual(style.padding.right, .Points(3))
    XCTAssertEqual(style.margin.top, .Percent(0.75))
    XCTAssertEqual(style.mBorderRender.top.width, .Points(6 * scale))
    XCTAssertEqual(style.width, .FitContentPoints((NSCMason.rootFontSize + 2) * scale))
    XCTAssertEqual(style.height, .FitContentPercent(0.25))
    XCTAssertEqual(style.height.cssValue, "fit-content(25.0%)")
    XCTAssertEqual(style.flexBasis, .MinContent)
    XCTAssertEqual(style.maxHeight, .Auto)
    XCTAssertEqual(parseLengthPercentageAuto("AUTO"), .Auto)
    XCTAssertNil(parseLengthPercentage("calc(1px"))
  }

  func testRustColorsReachNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="color: color-mix(in srgb, red 25%, blue);
        background-color: hsl(180 100% 50% / 50%); border: 2px solid #10203080"></div>
      """).first)
    let style = root.style
    XCTAssertEqual(style.color, 0xff4000bf)
    XCTAssertEqual(style.backgroundColor, 0x8000ffff)
    XCTAssertEqual(style.mBorderRender.top.argb, 0x80102030)
    XCTAssertEqual(parseSvgColor("rebeccapurple"), 0xff663399)
    XCTAssertNil(parseColorArgb("red blue"))
  }

  func testRustTextDecorationsReachNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="text-decoration: underline overline rgba(0, 0, 255, 50%) 2px dashed;
        text-decoration-line: line-through underline"></div>
      """).first)
    let style = root.style
    XCTAssertEqual(style.decorationLine, .UnderlineLineThrough)
    XCTAssertEqual(style.decorationStyle, .Dashed)
    XCTAssertEqual(style.decorationColor, 0x800000ff)
    XCTAssertEqual(style.decorationThickness, 2 * NSCMason.scale)
    style.setTextDecoration("overline shiny")
    XCTAssertEqual(style.decorationStyle, .Dashed)
    XCTAssertEqual(style.decorationLine, .UnderlineLineThrough)
    style.setTextDecoration("overline")
    XCTAssertEqual(style.decorationLine, .Overline)
    XCTAssertEqual(style.decorationStyle, .Solid)
    XCTAssertEqual(style.decorationColor, Constants.UNSET_COLOR)
    XCTAssertEqual(style.decorationThickness, 0)
  }

  func testRustCornerShapesReachNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="corner-shape: squircle superellipse( 1.5 ) notch;
        corner-shape-bottom-left: square"></div>
      """).first)
    let style = root.style
    XCTAssertEqual(style.cornerShapeTopLeft, "squircle")
    XCTAssertEqual(style.cornerShapeTopRight, "superellipse(1.5)")
    XCTAssertEqual(style.cornerShapeBottomRight, "notch")
    XCTAssertEqual(style.cornerShapeBottomLeft, "square")
    style.cornerShapeTopRight = "round bevel"
    XCTAssertEqual(style.cornerShapeTopRight, "superellipse(1.5)")
    style.cornerShape = ""
    XCTAssertEqual(style.cornerShapeBottomRight, "round")
  }

  func testRustBorderAndListShorthandsReachNativeStyles() throws {
    let root = try XCTUnwrap(HTMLParser(mason: NSCMason.shared).parse("""
      <div style="border: 2px 4px solid red; border-left: 6px dashed blue;
        border-radius: 9px / 3px; list-style: square inside"></div>
      """).first)
    let style = root.style
    let scale = NSCMason.scale
    XCTAssertEqual(style.mBorderRender.top.width, .Points(2 * scale))
    XCTAssertEqual(style.mBorderRender.right.width, .Points(4 * scale))
    XCTAssertEqual(style.mBorderRender.bottom.width, .Points(2 * scale))
    XCTAssertEqual(style.mBorderRender.left.width, .Points(6 * scale))
    XCTAssertEqual(style.mBorderRender.left.style, .dashed(dash: 6, gap: 6))
    XCTAssertEqual(style.mBorderRender.left.argb, 0xff0000ff)
    XCTAssertEqual(style.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE), 9 * scale)
    XCTAssertEqual(style.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE), 3 * scale)
    XCTAssertEqual(style.listStyleType, .Square)
    XCTAssertEqual(style.listStylePosition, .Inside)
    style.border = "8px dotted solid"
    XCTAssertEqual(style.mBorderRender.left.width, .Points(6 * scale))
    style.fontSize = 20
    style.borderRadius = "calc(100% / 2) 10dppx / 2 1em;"
    XCTAssertEqual(style.getFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE), 0.5)
    XCTAssertEqual(style.getFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE), 10)
    XCTAssertEqual(style.getFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE), 20 * scale)
  }

  func testRustLayoutShorthandsReachNativeStyles() throws {
    let parser = HTMLParser(mason: NSCMason.shared)
    let roots = parser.parse("""
      <div style="flex-flow: column wrap; flex: 2 3 10px; gap: normal 8px;
        padding: 1px 2px 3px; margin: 1px auto; inset: 4px auto;
        overflow: hidden scroll; place-items: center end"></div>
      """)
    let node = try XCTUnwrap(roots.first)
    let style = node.style
    XCTAssertEqual(style.flexDirection, .Column)
    XCTAssertEqual(style.flexWrap, .Wrap)
    XCTAssertEqual(style.flexGrow, 2)
    XCTAssertEqual(style.flexShrink, 3)
    XCTAssertEqual(style.flexBasis, .Points(10 * NSCMason.scale))
    XCTAssertEqual(style.gap.width, .Points(0))
    XCTAssertEqual(style.gap.height, .Points(8 * NSCMason.scale))
    XCTAssertEqual(style.padding.left, .Points(2 * NSCMason.scale))
    XCTAssertEqual(style.padding.bottom, .Points(3 * NSCMason.scale))
    XCTAssertEqual(style.margin.top, .Points(NSCMason.scale))
    XCTAssertEqual(style.margin.right, .Auto)
    XCTAssertEqual(style.inset.top, .Points(4 * NSCMason.scale))
    XCTAssertEqual(style.inset.left, .Auto)
    XCTAssertEqual(style.overflowX, .Hidden)
    XCTAssertEqual(style.overflowY, .Scroll)
    XCTAssertEqual(style.alignItems, .Center)
    XCTAssertEqual(style.justifyItems, .End)
    XCTAssertEqual(NSCMason.expandCssShorthand("grid-area", value: "hero / sidebar"), ["hero", "sidebar", "hero", "sidebar"])
    XCTAssertNil(NSCMason.expandCssShorthand("padding", value: "1px bogus 2px"))
    style.paddingCss = "1px bogus 2px"
    XCTAssertEqual(style.padding.left, .Points(2 * NSCMason.scale))
    let implicitFlex = try XCTUnwrap(parser.parse("<div style='flex: 2'></div>").first)
    XCTAssertEqual(implicitFlex.style.flexBasis, .Points(0))
  }


  private func texts(_ node: MasonNode) -> [String] {
    node.children.flatMap { child -> [String] in
      if let t = child as? MasonTextNode { return [t.data] }
      return texts(child)
    }
  }

  func testPreKeepsWhitespace() {
    let parser = HTMLParser(mason: NSCMason.shared)
    let roots = parser.parse("<pre>\n  a  b\n<code>  c\n    d</code></pre><p>  e   f  </p>")
    XCTAssertEqual(roots.count, 2)
    XCTAssertEqual(texts(roots[0]), ["  a  b\n", "  c\n    d"], "verbatim, minus the newline right after <pre>")
    XCTAssertEqual(texts(roots[1]), [" e f "])
  }

  func testDropsStyleAndScript() {
    let parser = HTMLParser(mason: NSCMason.shared)
    let roots = parser.parse("<style>p { color: red }</style><div>a<script>alert(1)</script>b</div><title>t</title><meta charset='utf-8'>")
    XCTAssertEqual(roots.count, 1)
    XCTAssertEqual(texts(roots[0]), ["a", "b"])
  }

  func testAppliesValueAndPlaceholder() throws {
    let parser = HTMLParser(mason: NSCMason.shared)
    let roots = parser.parse("<input value='hi' placeholder='Name'><textarea placeholder='Notes'></textarea>")
    let input = try XCTUnwrap(roots.first?.view as? MasonInput)
    XCTAssertEqual(input.value, "hi")
    XCTAssertEqual(input.placeholder, "Name")
    let area = try XCTUnwrap(roots.last?.view as? MasonTextArea)
    XCTAssertEqual(area.placeholder, "Notes")
  }

  func testDisabledInputAndTextArea() throws {
    let parser = HTMLParser(mason: NSCMason.shared)
    let roots = parser.parse("<input disabled><textarea disabled></textarea><input type='checkbox' disabled>")
    let input = try XCTUnwrap(roots[0].view as? MasonInput)
    XCTAssertTrue(input.disabled)
    XCTAssertFalse(input.isUserInteractionEnabled)
    let area = try XCTUnwrap(roots[1].view as? MasonTextArea)
    XCTAssertTrue(area.disabled)
    XCTAssertFalse(area.isEditable)
    XCTAssertFalse(area.isSelectable)
    let checkbox = try XCTUnwrap(roots[2].view as? MasonInput)
    XCTAssertFalse(checkbox.checkboxInput.isEnabled, "native controls draw disabled")

    input.type = .Range
    XCTAssertFalse(input.rangeInput.isEnabled, "kept across a type change")
    input.disabled = false
    XCTAssertTrue(input.isUserInteractionEnabled)
    XCTAssertTrue(input.rangeInput.isEnabled)
  }

  func testViewportUnitText() {
    XCTAssertTrue(hasViewportUnit("50vw"))
    XCTAssertTrue(hasViewportUnit("calc(100vh - 10px)"))
    XCTAssertTrue(hasViewportUnit("1px solid red, 2.5VMIN"))
    XCTAssertFalse(hasViewportUnit("10px"))
    XCTAssertFalse(hasViewportUnit("url(vw.png)"))
  }
}

/// `<img src="~/...">` reaches `Img.src` as an absolute path (img/index.ios.ts).
final class ImgLocalSourceTests: XCTestCase {
  private func load(_ src: String) -> (LoadingState, Img) {
    let img = NSCMason.shared.createImageView()
    let done = expectation(description: "load settles")
    var result: LoadingState = .Loading
    img.onStateChange = { state, _ in
      guard state != .Loading else { return }
      result = state
      done.fulfill()
    }
    img.src = src
    wait(for: [done], timeout: 10)
    return (result, img)
  }

  func testAbsolutePathLoads() throws {
    let size = CGSize(width: 4, height: 3)
    let png = UIGraphicsImageRenderer(size: size).image { ctx in
      UIColor.red.setFill()
      ctx.fill(CGRect(origin: .zero, size: size))
    }.pngData()!
    let path = NSTemporaryDirectory() + "mason-img-\(UUID().uuidString).png"
    try png.write(to: URL(fileURLWithPath: path))
    defer { try? FileManager.default.removeItem(atPath: path) }

    let (state, img) = load(path)
    XCTAssertEqual(state, .Loaded)
    XCTAssertNotNil(img.image)
  }

  func testMissingFileIsAnError() {
    let (state, img) = load(NSTemporaryDirectory() + "mason-img-missing-\(UUID().uuidString).png")
    XCTAssertEqual(state, .Error)
    XCTAssertNil(img.image)
  }
}
