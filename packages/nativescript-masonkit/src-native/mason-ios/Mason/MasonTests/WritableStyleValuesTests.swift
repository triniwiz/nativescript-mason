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

  func testForeignBufferSyncInvalidatesCachedLayoutAndResizesTheView() throws {
    let mason = NSCMason.shared
    let root = MasonUIView(mason: mason)
    root.frame = CGRect(x: 0, y: 0, width: 300, height: 100)
    let leaf = UILabel()
    leaf.text = "foreign"
    root.addView(leaf)
    let node = mason.nodeForView(leaf)
    let data = try XCTUnwrap(leaf.mason_writableStyleValues())

    func resize(_ width: Float, _ height: Float) {
      data.mutableBytes.storeBytes(of: Int8(1), toByteOffset: StyleKeys.WIDTH_TYPE, as: Int8.self)
      data.mutableBytes.storeBytes(of: width * NSCMason.scale, toByteOffset: StyleKeys.WIDTH_VALUE, as: Float.self)
      data.mutableBytes.storeBytes(of: Int8(1), toByteOffset: StyleKeys.HEIGHT_TYPE, as: Int8.self)
      data.mutableBytes.storeBytes(of: height * NSCMason.scale, toByteOffset: StyleKeys.HEIGHT_VALUE, as: Float.self)
      let state = StateKeys.size
      leaf.mason_syncStyleParts(Int32(truncatingIfNeeded: state.low), Int32(truncatingIfNeeded: state.low >> 32),
                                Int32(truncatingIfNeeded: state.high), Int32(truncatingIfNeeded: state.high >> 32))
    }

    resize(31, 36)
    root.computeWithSize(300, 100)
    XCTAssertEqual(leaf.frame.width, 31, accuracy: 0.01)
    XCTAssertEqual(leaf.frame.height, 36, accuracy: 0.01)
    XCTAssertTrue(node.isLayoutValid)
    resize(54, 43)
    XCTAssertFalse(node.isLayoutValid)
    root.computeWithSize(300, 100)
    XCTAssertEqual(leaf.frame.width, 54, accuracy: 0.01)
    XCTAssertEqual(leaf.frame.height, 43, accuracy: 0.01)
  }

  func testForeignSyncPreservesAllFourDirtyWords() {
    let leaf = UIView()
    let style = NSCMason.shared.nodeForView(leaf).style
    style.inBatch = true
    style.isDirty = 0
    style.isDirtyHigh = 0
    leaf.mason_syncStyleParts(Int32.min, Int32.min | 1, -1, Int32.min | 2)
    XCTAssertEqual(style.isDirty, 0x8000000180000000)
    XCTAssertEqual(style.isDirtyHigh, 0x80000002ffffffff)
  }
}
