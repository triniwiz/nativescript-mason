//
//  LengthScanTests.swift
//  MasonTests
//
//  The length parsers scan tokens by hand; this checks them against the
//  regex they replaced.
//

import XCTest
@testable import Mason

final class LengthScanTests: XCTestCase {

  private let reference = try! NSRegularExpression(
    pattern: "^(-?(?:\\d*\\.\\d+|\\d+\\.\\d*|\\d+)(?:[eE][+-]?\\d+)?)(dppx|px|%|dip|rem|em|vmin|vmax|vw|vh|pt)?;?$"
  )

  private let tokens = [
    "0", "10", "-10", "1.5", ".5", "-.5", "5.", "1e3", "1E-2", "2e+1px", "2em", "2e", "2e+", "1e5px",
    "10px", "10px;", "10;", "10dip", "10dppx", "50%", "-50%", "1.5rem", "2em", "12pt", "10vw", "10vh",
    "10vmin", "10vmax", "px", "", ".", "-", "10 px", "10PX", "10px;;", "abc", "10pxx", "1.2.3", "--1",
    "99999px", "-99999", "1e40", "auto", "0.0001%",
  ]

  // (number, unit) as the regex split them, or nil when it didn't match.
  private func referenceSplit(_ v: String) -> (Double?, String?)? {
    guard let m = reference.firstMatch(in: v, range: NSRange(v.startIndex..<v.endIndex, in: v)) else { return nil }
    let ns = v as NSString
    let unitRange = m.range(at: 2)
    return (Double(ns.substring(with: m.range(at: 1))), unitRange.location != NSNotFound ? ns.substring(with: unitRange) : nil)
  }

  func testLengthPercentageMatchesTheRegexGrammar() {
    for token in tokens {
      let parsed = parseLengthPercentage(token, scale: 3)
      guard let (number, unit) = referenceSplit(token) else {
        XCTAssertNil(parsed, "\(token) should not parse")
        continue
      }
      let raw = Float(number ?? 0)
      let clamped = max(-9999, min(9999, raw))
      switch unit {
      case "%": XCTAssertEqual(parsed, .Percent(raw / 100), token)
      case "dppx": XCTAssertEqual(parsed, .Points(clamped), token)
      case nil, "px", "dip": XCTAssertEqual(parsed, .Points(clamped * 3), token)
      default: XCTAssertNotNil(parsed, token)
      }
    }
  }

  func testLengthPercentageAutoMatchesTheRegexGrammar() {
    XCTAssertEqual(parseLengthPercentageAuto("auto"), .Auto)
    for token in tokens where token != "auto" {
      let parsed = parseLengthPercentageAuto(token, scale: 2)
      guard let (number, unit) = referenceSplit(token) else {
        XCTAssertNil(parsed, "\(token) should not parse")
        continue
      }
      let num = Float(number ?? 0)
      switch unit {
      case "%": XCTAssertEqual(parsed, .Percent(num / 100), token)
      case "dppx": XCTAssertEqual(parsed, .Points(num), token)
      case nil, "px", "dip": XCTAssertEqual(parsed, .Points(num * 2), token)
      default: XCTAssertNotNil(parsed, token)
      }
    }
  }

  func testExponentNeedsDigitsSoEmStaysAUnit() {
    XCTAssertEqual(parseLengthPercentage("2em", scale: 1), .Points(2 * NSCMason.rootFontSize))
    XCTAssertEqual(parseLengthPercentage("2e1", scale: 1), .Points(20))
    XCTAssertNil(parseLengthPercentage("2e", scale: 1))
  }
}
