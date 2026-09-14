//
//  ApplyToViewPerfTests.swift
//  MasonTests
//
//  Temporary benchmark for the applyToView `layout.children` hoist fix.
//  Not part of the permanent suite — safe to delete after measuring.
//

import XCTest
@testable import Mason

final class ApplyToViewPerfTests: XCTestCase {

  private var mason: NSCMason!

  override func setUpWithError() throws {
    mason = NSCMason.shared
  }

  override func tearDownWithError() throws {
    mason = nil
  }

  private func buildWideRow(childCount: Int) -> MasonUIView {
    let parent = MasonUIView.createFlexView(mason)
    parent.setSize(2000, 200)
    parent.flexDirection = .Row
    for _ in 0..<childCount {
      let child = MasonUIView(mason: mason)
      child.setSize(20, 20)
      parent.addView(child)
    }
    return parent
  }

  func test_perf_applyToView_wideRow_200children() {
    let parent = buildWideRow(childCount: 200)
    measure {
      parent.markNodeDirty()
      parent.compute(-1, -1)
      parent.attachAndApply()
    }
  }

  func test_perf_applyToView_nestedWideRows() {
    // 10 wide rows of 100 children each, under one root — closer to a
    // realistic list-like screen than one flat 1000-wide row.
    let root = MasonUIView.createFlexView(mason)
    root.setSize(2000, 2000)
    root.flexDirection = .Column
    for _ in 0..<10 {
      let row = MasonUIView.createFlexView(mason)
      row.flexDirection = .Row
      row.setSize(2000, 100)
      for _ in 0..<100 {
        let child = MasonUIView(mason: mason)
        child.setSize(20, 20)
        row.addView(child)
      }
      root.addView(row)
    }

    measure {
      root.markNodeDirty()
      root.compute(-1, -1)
      root.attachAndApply()
    }
  }
}
