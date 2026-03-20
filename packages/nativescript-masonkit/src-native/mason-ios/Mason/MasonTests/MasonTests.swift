//
//  MasonTests.swift
//  MasonTests
//
//  Created by Osei Fortune on 28/11/2022.
//

import XCTest
@testable import Mason

final class MasonTests: XCTestCase {

  private var mason: NSCMason!

  override func setUpWithError() throws {
    mason = NSCMason.shared
  }

  override func tearDownWithError() throws {
    mason = nil
  }

  // MARK: - View Creation Tests

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
