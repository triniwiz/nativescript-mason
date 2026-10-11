//
//  InputAppearanceTests.swift
//  MasonTests
//
//  Mirrors `InputAppearanceTest.kt` for the parsing; keep the two in step.
//

import XCTest
import UIKit
@testable import Mason

final class InputAppearanceTests: XCTestCase {

  func testNoneTurnsTheNativeControlOff() {
    XCTAssertEqual(MasonInputAppearance(css: "none"), .None)
    XCTAssertEqual(MasonInputAppearance(css: " NONE "), .None)
  }

  func testEveryOtherKeywordIsAuto() {
    for value in ["auto", "menulist-button", "textfield", "button", "initial", "", "nonee"] {
      XCTAssertEqual(MasonInputAppearance(css: value), .Auto, value)
    }
  }

  func testNoneStopsDrawingTheCheckboxAndAutoRestoresIt() {
    let input = MasonInput(mason: NSCMason.shared, type: .Checkbox)
    XCTAssertTrue(input.drawsNativeControl)
    XCTAssertTrue(input.checkboxInput.drawsControl)

    input.cssAppearance = .None
    XCTAssertFalse(input.drawsNativeControl)
    XCTAssertFalse(input.checkboxInput.drawsControl)

    input.cssAppearance = .Auto
    XCTAssertTrue(input.checkboxInput.drawsControl)
  }

  func testNoneFollowsATypeChange() {
    let input = MasonInput(mason: NSCMason.shared, type: .Text)
    input.cssAppearance = .None
    // Only a checkbox or radio has a native control to drop.
    XCTAssertTrue(input.drawsNativeControl)

    input.type = .Radio
    XCTAssertFalse(input.drawsNativeControl)
    XCTAssertFalse(input.radioInput.drawsControl)
  }

  func testCheckedChangesAreReportedOnce() {
    let input = MasonInput(mason: NSCMason.shared, type: .Checkbox)
    var reported: [Bool] = []
    input.onCheckedChange = { reported.append($0) }

    input.checked = true
    input.checked = true
    input.checked = false

    XCTAssertEqual(reported, [true, false])
  }

  func testATapIsReported() {
    let input = MasonInput(mason: NSCMason.shared, type: .Checkbox)
    input.cssAppearance = .None
    var reported: [Bool] = []
    input.onCheckedChange = { reported.append($0) }

    input.checkboxInput.setCheckedFromUser(true)

    XCTAssertTrue(input.checked)
    XCTAssertEqual(reported, [true])
  }
}
