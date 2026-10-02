//
//  BorderBufferSyncTests.swift
//  MasonTests
//
//  Border radii written straight into the style buffer (from JS) reach the
//  renderer when the sync carries the border-radius bit.
//

import XCTest
@testable import Mason

final class BorderBufferSyncTests: XCTestCase {

  private func sync(_ view: MasonUIView, _ state: StateKeys) {
    view.syncStyle(String(state.low), String(state.high))
  }

  private func writeCorner(_ style: MasonStyle, xType: Int, xValue: Int, yType: Int, yValue: Int, type: Int8, value: Float) {
    style.setInt8(xType, type)
    style.setFloat(xValue, value)
    style.setInt8(yType, type)
    style.setFloat(yValue, value)
  }

  func testRadiiWrittenToTheBufferReachTheRenderer() {
    let view = MasonUIView(mason: NSCMason.shared)
    let style = view.style
    style.prepareMut()
    writeCorner(style, xType: StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, xValue: StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE,
                yType: StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, yValue: StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE, type: 0, value: 12)
    writeCorner(style, xType: StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, xValue: StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE,
                yType: StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, yValue: StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE, type: 1, value: 0.5)
    sync(view, .borderRadius)

    let radius = style.mBorderRender.radius
    XCTAssertEqual(radius.topLeft.horizontal, .Points(12))
    XCTAssertEqual(radius.topLeft.vertical, .Points(12))
    XCTAssertEqual(radius.topRight.horizontal, .Percent(0.5))
    XCTAssertEqual(radius.bottomRight, .zero)
    XCTAssertEqual(radius.bottomLeft, .zero)
    XCTAssertTrue(style.mBorderRender.hasRadii())
  }

  func testARadiusWriteKeepsTheCornerShape() {
    let view = MasonUIView(mason: NSCMason.shared)
    let style = view.style
    style.cornerShapeTopLeft = "bevel"
    style.prepareMut()
    writeCorner(style, xType: StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, xValue: StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE,
                yType: StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, yValue: StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE, type: 0, value: 10)
    sync(view, .borderRadius)

    XCTAssertEqual(style.mBorderRender.radius.topLeft.horizontal, .Points(10))
    XCTAssertEqual(style.mBorderRender.radius.topLeft.exponent, 4)
  }

  func testZeroRadiiLeaveNoRadii() {
    let view = MasonUIView(mason: NSCMason.shared)
    let style = view.style
    style.borderRadius = "8"
    XCTAssertTrue(style.mBorderRender.hasRadii())
    style.prepareMut()
    for (xType, xValue, yType, yValue) in [
      (StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE),
      (StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE),
      (StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE),
      (StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE),
    ] {
      writeCorner(style, xType: xType, xValue: xValue, yType: yType, yValue: yValue, type: 0, value: 0)
    }
    sync(view, .borderRadius)
    XCTAssertFalse(style.mBorderRender.hasRadii())
  }

  // white-space is bit 63, so a low half carrying it is negative as a signed
  // 64-bit value; the sync must still reach the text, not be dropped.
  private func textRestyledAfterSync(_ sync: (MasonText, StateKeys) -> Void) -> Bool {
    let textView = MasonText(mason: NSCMason.shared)
    textView.engine.textContent = "hello world"
    guard let tn = textView.node.children.first as? MasonTextNode else { return false }
    _ = tn.attributed()
    XCTAssertFalse(tn.attributesStale)
    sync(textView, StateKeys.whiteSpace.union(.color))
    return tn.attributesStale
  }

  func testPartsSyncCarriesBit63() {
    XCTAssertTrue(textRestyledAfterSync { view, state in
      view.syncStyleParts(Int32(truncatingIfNeeded: state.low), Int32(truncatingIfNeeded: state.low >> 32),
                          Int32(truncatingIfNeeded: state.high), Int32(truncatingIfNeeded: state.high >> 32))
    })
  }

  func testStringSyncAcceptsANegativeLowHalf() {
    XCTAssertTrue(textRestyledAfterSync { view, state in
      view.syncStyle(String(Int64(bitPattern: state.low)), String(Int64(bitPattern: state.high)))
    })
  }
}
