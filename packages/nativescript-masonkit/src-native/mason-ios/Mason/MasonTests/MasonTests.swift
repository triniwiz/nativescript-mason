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
    XCTAssertEqual(gradient?.stops, ["blue", "rgb(0, 0, 255) 10%", "rgb(0, 0, 255) 30%", "green 40%"])
  }

  func test_gradientInterpolationMethodIsSeparatedFromTheDirection() {
    let gradient = parseGradient("linear-gradient(to bottom right in oklab, #6366f1 0%, #d946ef 100%)")
    XCTAssertEqual(gradient?.direction, "to bottom right")
    XCTAssertEqual(gradient?.stops, ["#6366f1 0%", "#d946ef 100%"])
    XCTAssertEqual(gradient?.interpolation, ColorInterpolation(space: .oklab))

    let alone = parseGradient("linear-gradient(in oklab, red, blue)")
    XCTAssertNil(alone?.direction)
    XCTAssertEqual(alone?.stops, ["red", "blue"])
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

  func test_updateDisplay() {
    let view = MasonUIView(mason: mason)
    view.inBatch = true
    view.display = .Flex
    view.inBatch = false

    XCTAssertEqual(view.display, .Flex)
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

  func test_borderRadiusOnClippedBoxWithoutResizeInstallsMask() {
    let (root, child) = tree()
    child.configure { $0.overflow = MasonPoint(.Hidden, .Hidden) }
    root.computeWithSize(100, 100)
    XCTAssertNil(child.layer.mask)
    child.style.borderRadius = "10px"
    root.computeWithSize(100, 100)
    XCTAssertNotNil(child.layer.mask as? CAShapeLayer, "the rounded clip must follow a radius change")
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

  func testFontFeatureSettingsParse() {
    XCTAssertTrue(parseFontFeatureSettings("normal").isEmpty)
    let parsed = parseFontFeatureSettings("\"liga\" 0, 'tnum', \"ss01\" on, \"kern\" off, \"cv01\" 3")
    XCTAssertEqual(parsed.map { $0.tag }, ["liga", "tnum", "ss01", "kern", "cv01"])
    XCTAssertEqual(parsed.map { $0.value }, [0, 1, 1, 0, 3])
    XCTAssertTrue(parseFontFeatureSettings("\"toolong\"").isEmpty, "a tag is four characters")
    XCTAssertTrue(parseFontFeatureSettings("\"liga\" -1").isEmpty)
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
}
