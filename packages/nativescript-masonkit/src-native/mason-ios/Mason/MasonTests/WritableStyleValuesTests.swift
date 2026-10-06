//
//  WritableStyleValuesTests.swift
//  MasonTests
//
//  `mason_writableStyleValues` hands JS the node's own style buffer, so writes
//  through it reach that node and no other node sharing the default buffer.
//

import XCTest
@testable import Mason

final class WritableStyleValuesTests: XCTestCase {

  func testReturnsTheNodesOwnBuffer() {
    let view = MasonUIView(mason: NSCMason.shared)
    let other = MasonUIView(mason: NSCMason.shared)

    guard let data = view.mason_writableStyleValues() else {
      return XCTFail("no buffer")
    }
    XCTAssertEqual(MasonStyle.getInt32(StyleKeys.REF_COUNT, data), 1)

    data.mutableBytes.storeBytes(of: Int8(Display.Grid.rawValue), toByteOffset: StyleKeys.DISPLAY, as: Int8.self)

    XCTAssertEqual(view.style.getInt8(StyleKeys.DISPLAY), Int8(Display.Grid.rawValue))
    XCTAssertNotEqual(other.style.getInt8(StyleKeys.DISPLAY), Int8(Display.Grid.rawValue))
  }

  func testRepeatedCallsReturnTheSameBuffer() {
    let view = MasonUIView(mason: NSCMason.shared)
    let first = view.mason_writableStyleValues()
    let second = view.mason_writableStyleValues()
    XCTAssertNotNil(first)
    XCTAssertTrue(first === second)
  }
}
