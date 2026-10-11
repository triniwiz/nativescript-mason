//
//  SvgParserTests.swift
//  MasonTests
//
//  Mirrors `SvgParserTest.kt`; keep the two in step. The render tests at the end are iOS only.
//

import XCTest
import UIKit
@testable import Mason

final class SvgParserTests: XCTestCase {

  // Bootstrap Icons v1.11 (MIT), verbatim from github.com/twbs/icons.
  private let house = """
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house" viewBox="0 0 16 16">
    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
  </svg>
  """
  private let grid = """
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grid" viewBox="0 0 16 16">
    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
  </svg>
  """
  private let layers = """
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-layers" viewBox="0 0 16 16">
    <path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882zm3.515 7.008L14.438 10 8 13.433 1.562 10 4.25 8.567l3.515 1.874a.5.5 0 0 0 .47 0zM8 9.433 1.562 6 8 2.567 14.438 6z"/>
  </svg>
  """
  private let checkLg = """
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
  </svg>
  """
  private let circleHalf = """
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-circle-half" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16"/>
  </svg>
  """

  // Bootstrap 5.3's own CSS data URIs, as they arrive (percent-encoded).
  private let bsSelectChevron = "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e"
  private let bsCheck = "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m5.5 10 3 3 6-6'/%3e%3c/svg%3e"
  private let bsAccordion = "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2300000080' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e"
  private let bsNavbarToggler = "%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2833, 37, 41, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e"

  // MARK: helpers

  private struct Bounds { var minX: CGFloat, minY: CGFloat, maxX: CGFloat, maxY: CGFloat }

  private func bounds(_ commands: [SvgPathCommand]) -> Bounds {
    var b = Bounds(minX: .greatestFiniteMagnitude, minY: .greatestFiniteMagnitude,
                   maxX: -.greatestFiniteMagnitude, maxY: -.greatestFiniteMagnitude)
    func add(_ x: CGFloat, _ y: CGFloat) {
      b.minX = min(b.minX, x); b.minY = min(b.minY, y); b.maxX = max(b.maxX, x); b.maxY = max(b.maxY, y)
    }
    var p = CGPoint.zero
    for c in commands {
      switch c {
      case let .move(x, y), let .line(x, y):
        add(x, y); p = CGPoint(x: x, y: y)
      case let .cubic(x1, y1, x2, y2, x, y):
        for i in 1...64 {
          let t = CGFloat(i) / 64, u = 1 - t
          add(u * u * u * p.x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
              u * u * u * p.y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y)
        }
        p = CGPoint(x: x, y: y)
      case let .quad(x1, y1, x, y):
        for i in 1...64 {
          let t = CGFloat(i) / 64, u = 1 - t
          add(u * u * p.x + 2 * u * t * x1 + t * t * x, u * u * p.y + 2 * u * t * y1 + t * t * y)
        }
        p = CGPoint(x: x, y: y)
      case .close:
        break
      }
    }
    return b
  }

  private func assertPoint(_ x: CGFloat, _ y: CGFloat, _ p: CGPoint?, accuracy: CGFloat = 1e-3,
                           file: StaticString = #filePath, line: UInt = #line) {
    guard let p = p else { return XCTFail("no point", file: file, line: line) }
    XCTAssertEqual(p.x, x, accuracy: accuracy, "x", file: file, line: line)
    XCTAssertEqual(p.y, y, accuracy: accuracy, "y", file: file, line: line)
  }

  private func assertBounds(_ e: Bounds, _ a: Bounds, accuracy: CGFloat, file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertEqual(a.minX, e.minX, accuracy: accuracy, "minX", file: file, line: line)
    XCTAssertEqual(a.minY, e.minY, accuracy: accuracy, "minY", file: file, line: line)
    XCTAssertEqual(a.maxX, e.maxX, accuracy: accuracy, "maxX", file: file, line: line)
    XCTAssertEqual(a.maxY, e.maxY, accuracy: accuracy, "maxY", file: file, line: line)
  }

  private func cubicAt(_ p0: CGPoint, _ c: SvgPathCommand, _ t: CGFloat) -> CGPoint? {
    guard case let .cubic(x1, y1, x2, y2, x, y) = c else { return nil }
    let u = 1 - t
    return CGPoint(x: u * u * u * p0.x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
                   y: u * u * u * p0.y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y)
  }

  private func doc(_ svg: String, file: StaticString = #filePath, line: UInt = #line) throws -> SvgDocument {
    try XCTUnwrap(parseSvgDocument(svg), "no document", file: file, line: line)
  }

  // MARK: path grammar

  func testMoveLineAbsoluteAndRelative() {
    XCTAssertEqual(parseSvgPathData("M1 2 L3 4 m1 2 l1 1"), [.move(1, 2), .line(3, 4), .move(4, 6), .line(5, 7)])
  }

  func testImplicitLinetoAfterMoveto() {
    XCTAssertEqual(parseSvgPathData("m2 5 6 6 6-6"), [.move(2, 5), .line(8, 11), .line(14, 5)])
    XCTAssertEqual(parseSvgPathData("M0 0 1 1 2 0"), [.move(0, 0), .line(1, 1), .line(2, 0)])
  }

  func testHorizontalVerticalAndImplicitRepeats() {
    XCTAssertEqual(parseSvgPathData("M1 1H5V4h-2v-2-1"),
                   [.move(1, 1), .line(5, 1), .line(5, 4), .line(3, 4), .line(3, 2), .line(3, 1)])
  }

  func testCompactNumbers() {
    XCTAssertEqual(parseSvgPathData("M1.5.5L-1-2L1e1,2E-2L.5.25"),
                   [.move(1.5, 0.5), .line(-1, -2), .line(10, 0.02), .line(0.5, 0.25)])
  }

  func testCloseReturnsToSubpathStartAndNextSegmentStartsThere() {
    XCTAssertEqual(parseSvgPathData("M10 10 l5 0 z l0 5"),
                   [.move(10, 10), .line(15, 10), .close, .move(10, 10), .line(10, 15)])
  }

  func testCubicAndSmoothCubic() {
    let cmds = parseSvgPathData("M0 0 C1 2 3 4 5 6 S9 10 11 12 s1 1 2 2")
    XCTAssertEqual(cmds, [.move(0, 0), .cubic(1, 2, 3, 4, 5, 6), .cubic(7, 8, 9, 10, 11, 12), .cubic(13, 14, 12, 13, 13, 14)])
  }

  func testSmoothCubicWithoutPreviousCubicUsesCurrentPoint() {
    XCTAssertEqual(parseSvgPathData("M0 0S1 1 2 0"), [.move(0, 0), .cubic(0, 0, 1, 1, 2, 0)])
  }

  func testQuadraticAndSmoothQuadratic() {
    let cmds = parseSvgPathData("M0 0 Q5 10 10 0 T20 0 t10 0 q1 1 2 0")
    XCTAssertEqual(Array(cmds.dropFirst()), [.quad(5, 10, 10, 0), .quad(15, -10, 20, 0), .quad(25, 10, 30, 0), .quad(31, 1, 32, 0)])
  }

  func testImplicitRepeatsOfCurves() {
    let cmds = parseSvgPathData("M0 0c1 1 2 1 3 0 1 1 2 1 3 0")
    XCTAssertEqual(cmds.count, 3)
    XCTAssertEqual(cmds[2], .cubic(4, 1, 5, 1, 6, 0))
  }

  func testErrorsKeepTheValidPrefix() {
    XCTAssertEqual(parseSvgPathData("M0 0 L10 10 L20"), [.move(0, 0), .line(10, 10)])
    XCTAssertEqual(parseSvgPathData("L10 10"), [])
    XCTAssertEqual(parseSvgPathData("M0 0 H1 Z 5 5"), [.move(0, 0), .line(1, 0), .close])
    XCTAssertEqual(parseSvgPathData("M0 0 X 5"), [.move(0, 0)])
  }

  // MARK: arcs

  func testSemicircleArcPassesThroughTheTop() {
    let cmds = parseSvgPathData("M0 0 A10 10 0 0 1 20 0")
    XCTAssertEqual(cmds.count, 3)
    assertPoint(10, -10, cmds[1].endPoint)
    assertPoint(20, 0, cmds[2].endPoint)
    assertBounds(Bounds(minX: 0, minY: -10, maxX: 20, maxY: 0), bounds(cmds), accuracy: 0.01)
  }

  func testSweepFlagPicksTheOtherSide() {
    assertPoint(10, 10, parseSvgPathData("M0 0 A10 10 0 0 0 20 0")[1].endPoint)
  }

  func testCompactArcFlags() {
    // `0110` = large 0, sweep 1, x 10.
    let cmds = parseSvgPathData("M0 0a10 10 0 0110 10")
    XCTAssertEqual(cmds.count, 2)
    assertPoint(10, 10, cmds[1].endPoint)
    let half = (0.5 as CGFloat).squareRoot() * 10
    assertPoint(half, 10 - half, cubicAt(.zero, cmds[1], 0.5), accuracy: 0.01)
  }

  func testLargeArcFlag() {
    let cmds = parseSvgPathData("M0 0 A10 10 0 1 0 10 10")
    XCTAssertEqual(cmds.count, 4)
    assertPoint(-10, 10, cmds[1].endPoint)
    assertPoint(0, 20, cmds[2].endPoint)
    assertPoint(10, 10, cmds[3].endPoint)
    assertBounds(Bounds(minX: -10, minY: 0, maxX: 10, maxY: 20), bounds(cmds), accuracy: 0.01)
  }

  func testTooSmallRadiiAreScaledUp() {
    let cmds = parseSvgPathData("M0 0 A1 1 0 0 1 20 0")
    assertPoint(10, -10, cmds[1].endPoint, accuracy: 0.01)
    assertBounds(Bounds(minX: 0, minY: -10, maxX: 20, maxY: 0), bounds(cmds), accuracy: 0.01)
  }

  func testRotatedEllipticalArc() {
    let cmds = parseSvgPathData("M0 0 A20 10 90 0 1 0 40")
    assertPoint(0, 40, cmds.last?.endPoint)
    assertBounds(Bounds(minX: 0, minY: 0, maxX: 10, maxY: 40), bounds(cmds), accuracy: 0.02)
  }

  func testDegenerateArcs() {
    XCTAssertEqual(parseSvgPathData("M0 0 A0 4 0 0 1 5 5"), [.move(0, 0), .line(5, 5)])
    XCTAssertEqual(parseSvgPathData("M3 3 A4 4 0 0 1 3 3"), [.move(3, 3)])
  }

  // MARK: shapes

  func testRectCircleEllipseLinePolys() throws {
    let d = try doc("""
      <svg viewBox="0 0 100 100">
        <rect x="1" y="2" width="10" height="20"/>
        <rect x="0" y="0" width="10" height="10" rx="20"/>
        <circle cx="50" cy="50" r="10"/>
        <ellipse cx="50" cy="50" rx="20" ry="5"/>
        <line x1="0" y1="0" x2="10" y2="10" stroke="red"/>
        <polyline points="0,0 10,0 10,10 5"/>
        <polygon points="0 0 10 0 10 10"/>
      </svg>
      """)
    let s = d.shapes
    XCTAssertEqual(s.count, 7)
    XCTAssertEqual(s[0].commands, [.move(1, 2), .line(11, 2), .line(11, 22), .line(1, 22), .close])
    assertBounds(Bounds(minX: 0, minY: 0, maxX: 10, maxY: 10), bounds(s[1].commands), accuracy: 0.01)
    assertBounds(Bounds(minX: 40, minY: 40, maxX: 60, maxY: 60), bounds(s[2].commands), accuracy: 0.01)
    assertBounds(Bounds(minX: 30, minY: 45, maxX: 70, maxY: 55), bounds(s[3].commands), accuracy: 0.01)
    XCTAssertEqual(s[4].fill, SvgPaint.none)
    XCTAssertEqual(s[4].stroke, .color(0xFFFF_0000))
    XCTAssertEqual(s[5].commands, [.move(0, 0), .line(10, 0), .line(10, 10)])
    XCTAssertEqual(s[6].commands.last, .close)
  }

  func testRoundedRectCorners() {
    let cmds = svgRectCommands(0, 0, 20, 10, 4, nil)
    XCTAssertEqual(cmds[0], .move(4, 0))
    XCTAssertEqual(cmds[1], .line(16, 0))
    assertPoint(20, 4, cmds[2].endPoint)
    assertBounds(Bounds(minX: 0, minY: 0, maxX: 20, maxY: 10), bounds(cmds), accuracy: 0.01)
  }

  func testEmptyShapesAreSkipped() throws {
    XCTAssertEqual(try doc(#"<svg viewBox="0 0 10 10"><rect width="0" height="5"/><circle r="0"/><path d=""/></svg>"#).shapes.count, 0)
  }

  // MARK: paint

  func testFillRuleEvenOddAndNonzero() throws {
    let d = try doc("""
      <svg viewBox="0 0 10 10" fill-rule="evenodd">
        <path d="M0 0h10v10H0z"/>
        <path fill-rule="nonzero" d="M0 0h10v10H0z"/>
        <g><path style="fill-rule: nonzero" d="M0 0h1v1H0z"/></g>
      </svg>
      """)
    XCTAssertTrue(d.shapes[0].evenOdd)
    XCTAssertFalse(d.shapes[1].evenOdd)
    XCTAssertFalse(d.shapes[2].evenOdd)
  }

  func testGroupsInheritFillAndStroke() throws {
    let d = try doc("""
      <svg viewBox="0 0 10 10">
        <g fill="red" stroke="blue" stroke-width="3" stroke-linecap="square">
          <rect width="1" height="1"/>
          <g fill="none" stroke-linejoin="bevel"><rect width="1" height="1"/></g>
          <rect width="1" height="1" style="fill:#00ff00;stroke:none"/>
        </g>
        <rect width="1" height="1"/>
      </svg>
      """)
    let s = d.shapes
    XCTAssertEqual(s[0].fill, .color(0xFFFF_0000))
    XCTAssertEqual(s[0].stroke, .color(0xFF00_00FF))
    XCTAssertEqual(s[0].strokeWidth, 3)
    XCTAssertEqual(s[0].lineCap, .square)
    XCTAssertEqual(s[1].fill, SvgPaint.none)
    XCTAssertEqual(s[1].lineJoin, .bevel)
    XCTAssertEqual(s[2].fill, .color(0xFF00_FF00))
    XCTAssertFalse(s[2].hasStroke)
    XCTAssertEqual(s[3].fill, .color(0xFF00_0000))
    XCTAssertEqual(s[3].stroke, SvgPaint.none)
  }

  func testStrokeAttributes() throws {
    let d = try doc("""
      <svg viewBox="0 0 10 10"><path d="M0 0L5 5" fill="none" stroke="#123456" stroke-width="2.5"
        stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"
        stroke-dasharray="1 2 3" stroke-dashoffset="1"/></svg>
      """)
    let s = try XCTUnwrap(d.shapes.first)
    XCTAssertFalse(s.hasFill)
    XCTAssertEqual(s.stroke, .color(0xFF12_3456))
    XCTAssertEqual(s.strokeWidth, 2.5)
    XCTAssertEqual(s.strokeOpacity, 0.5)
    XCTAssertEqual(s.lineCap, .round)
    XCTAssertEqual(s.lineJoin, .round)
    XCTAssertEqual(s.miterLimit, 10)
    XCTAssertEqual(s.dashArray, [1, 2, 3, 1, 2, 3])
    XCTAssertEqual(s.dashOffset, 1)
  }

  func testOpacityFoldsIntoASinglePaintAndGroupsOtherwise() throws {
    let d = try doc("""
      <svg viewBox="0 0 10 10">
        <rect width="1" height="1" opacity=".5" fill-opacity=".5"/>
        <rect width="1" height="1" opacity=".5" stroke="red"/>
        <g opacity="0.25"><rect width="1" height="1"/></g>
      </svg>
      """)
    let ops = d.ops
    XCTAssertEqual(ops.count, 7)
    guard case let .shape(first) = ops[0] else { return XCTFail() }
    XCTAssertEqual(first.fillOpacity, 0.25, accuracy: 1e-6)
    guard case let .beginGroup(o1) = ops[1], case .shape = ops[2], case .endGroup = ops[3] else { return XCTFail() }
    XCTAssertEqual(o1, 0.5)
    guard case let .beginGroup(o2) = ops[4], case .shape = ops[5], case .endGroup = ops[6] else { return XCTFail() }
    XCTAssertEqual(o2, 0.25)
  }

  func testCurrentColorIsLeftForTheElementUnlessTheSvgSetsColor() throws {
    let d = try doc(house)
    XCTAssertTrue(d.usesCurrentColor)
    XCTAssertEqual(d.shapes.first?.fill, .currentColor)

    let own = try doc(##"<svg viewBox="0 0 1 1" color="#ff0000"><path fill="currentColor" stroke="currentColor" d="M0 0h1v1z"/></svg>"##)
    XCTAssertFalse(own.usesCurrentColor)
    XCTAssertEqual(own.shapes.first?.fill, .color(0xFFFF_0000))
    XCTAssertEqual(own.shapes.first?.stroke, .color(0xFFFF_0000))
  }

  func testUrlPaintUsesItsFallback() throws {
    let d = try doc("""
      <svg viewBox="0 0 1 1"><defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs>
        <path fill="url(#g) blue" d="M0 0h1v1z"/><path fill="url(#g)" stroke="red" d="M0 0h1v1z"/></svg>
      """)
    XCTAssertEqual(d.shapes.count, 2)
    XCTAssertEqual(d.shapes[0].fill, .color(0xFF00_00FF))
    XCTAssertEqual(d.shapes[1].fill, SvgPaint.none)
  }

  func testInvalidPaintKeepsTheInheritedOne() throws {
    let d = try doc(#"<svg viewBox="0 0 1 1" fill="red"><path fill="notacolor" d="M0 0h1v1z"/></svg>"#)
    XCTAssertEqual(d.shapes.first?.fill, .color(0xFFFF_0000))
  }

  // MARK: document structure

  func testNonRenderedContentIsSkipped() throws {
    let d = try doc("""
      <?xml version="1.0"?><!DOCTYPE svg><!-- <path d="M0 0h9v9z"/> -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
        <title>t</title><defs><path d="M0 0h1v1z"/></defs>
        <clipPath id="c"><rect width="5" height="5"/></clipPath>
        <path d="M0 0h2v2z"><title>has a child</title></path>
        <g display="none"><path d="M0 0h3v3z"/></g>
        <path visibility="hidden" d="M0 0h4v4z"/>
        <text>skip</text>
      </svg>
      """)
    XCTAssertEqual(d.shapes.count, 1)
    XCTAssertEqual(d.shapes.first?.commands[1], .line(2, 0))
  }

  func testTransforms() throws {
    let d = try doc("""
      <svg viewBox="0 0 10 10"><g transform="translate(2 3)"><rect width="1" height="1" transform="scale(2)"/></g>
        <rect width="1" height="1" transform="rotate(90 5 5)"/></svg>
      """)
    XCTAssertEqual(d.shapes[0].transform, CGAffineTransform(a: 2, b: 0, c: 0, d: 2, tx: 2, ty: 3))
    let p = CGPoint.zero.applying(d.shapes[1].transform)
    XCTAssertEqual(p.x, 10, accuracy: 1e-4)
    XCTAssertEqual(p.y, 0, accuracy: 1e-4)
    XCTAssertNil(parseSvgTransform("translate(1 2"))
    let skew = try XCTUnwrap(parseSvgTransform("skewX(45)"))
    XCTAssertEqual(skew.c, 1, accuracy: 1e-6)
  }

  func testIntrinsicSizeAndViewport() throws {
    XCTAssertEqual(try doc(house).width, 16)
    let vbOnly = try doc(#"<svg viewBox="0 0 20 10"><path d="M0 0h1v1z"/></svg>"#)
    XCTAssertEqual(vbOnly.width, 20)
    XCTAssertEqual(vbOnly.height, 10)
    XCTAssertEqual(try doc(#"<svg width="40px" viewBox="0 0 20 10"><path d="M0 0h1v1z"/></svg>"#).height, 20)
    XCTAssertNil(parseSvgDocument(#"<svg><path d="M0 0h1v1z"/></svg>"#))
    XCTAssertNil(parseSvgDocument("<div/>"))

    XCTAssertEqual(vbOnly.viewportTransform(40, 40), CGAffineTransform(a: 2, b: 0, c: 0, d: 2, tx: 0, ty: 10))
    let none = try doc(#"<svg viewBox="0 0 20 10" preserveAspectRatio="none"><path d="M0 0h1v1z"/></svg>"#)
    XCTAssertEqual(none.viewportTransform(40, 40), CGAffineTransform(a: 2, b: 0, c: 0, d: 4, tx: 0, ty: 0))
    let slice = try doc(#"<svg viewBox="0 0 20 10" preserveAspectRatio="xMinYMin slice"><path d="M0 0h1v1z"/></svg>"#)
    XCTAssertEqual(slice.viewportTransform(40, 40), CGAffineTransform(a: 4, b: 0, c: 0, d: 4, tx: 0, ty: 0))
  }

  // MARK: real icons

  private func checkIcon(_ svg: String, subpaths: Int, closes: Int, _ expected: Bounds, accuracy: CGFloat,
                         file: StaticString = #filePath, line: UInt = #line) throws {
    let d = try doc(svg, file: file, line: line)
    XCTAssertEqual(d.width, 16, file: file, line: line)
    XCTAssertNotNil(d.viewBox, file: file, line: line)
    let cmds = d.shapes.flatMap { $0.commands }
    XCTAssertEqual(cmds.filter { if case .move = $0 { return true } else { return false } }.count, subpaths, "subpaths", file: file, line: line)
    XCTAssertEqual(cmds.filter { $0 == .close }.count, closes, "closes", file: file, line: line)
    assertBounds(expected, bounds(cmds), accuracy: accuracy, file: file, line: line)
  }

  func testBootstrapHouse() throws {
    try checkIcon(house, subpaths: 2, closes: 2, Bounds(minX: 0.5, minY: 1.207, maxX: 15.5, maxY: 15), accuracy: 0.02)
  }

  func testBootstrapGrid() throws {
    try checkIcon(grid, subpaths: 8, closes: 8, Bounds(minX: 1, minY: 1, maxX: 15, maxY: 15), accuracy: 0.01)
  }

  func testBootstrapLayers() throws {
    try checkIcon(layers, subpaths: 3, closes: 3, Bounds(minX: 0, minY: 1.5, maxX: 16, maxY: 14.5), accuracy: 0.01)
  }

  func testBootstrapCheckLg() throws {
    let cmds = try XCTUnwrap(try doc(checkLg).shapes.first).commands
    XCTAssertEqual(cmds.filter { if case .move = $0 { return true } else { return false } }.count, 1)
    XCTAssertEqual(cmds.last, .close)
    assertPoint(12.716, 3.992, cmds[cmds.count - 2].endPoint, accuracy: 0.001)
    let b = bounds(cmds)
    XCTAssertTrue(b.minX > 2.9 && b.maxX < 14.2 && b.minY > 3.4 && b.maxY < 12.4)
  }

  func testBootstrapCircleHalf() throws {
    try checkIcon(circleHalf, subpaths: 2, closes: 1, Bounds(minX: 0, minY: 0, maxX: 16, maxY: 16), accuracy: 0.01)
    assertPoint(8, 16, try doc(circleHalf).shapes.first?.commands.last?.endPoint)
  }

  // MARK: Bootstrap's own data URIs

  func testBootstrapChevronIsAStrokeNotAFill() throws {
    let d = try doc(decodeSvgDataPayload(bsSelectChevron))
    let s = try XCTUnwrap(d.shapes.first)
    XCTAssertFalse(s.hasFill)
    XCTAssertEqual(s.stroke, .color(0xFF34_3A40))
    XCTAssertEqual(s.strokeWidth, 2)
    XCTAssertEqual(s.lineCap, .round)
    XCTAssertEqual(s.lineJoin, .round)
    XCTAssertEqual(s.commands, [.move(2, 5), .line(8, 11), .line(14, 5)])
    XCTAssertFalse(d.usesCurrentColor)
  }

  func testBootstrapCheckAndAccordionAndToggler() throws {
    let check = try XCTUnwrap(try doc(decodeSvgDataPayload(bsCheck)).shapes.first)
    XCTAssertFalse(check.hasFill)
    XCTAssertEqual(check.stroke, .color(0xFF00_0000))
    XCTAssertEqual(check.commands, [.move(5.5, 10), .line(8.5, 13), .line(14.5, 7)])

    let accordion = try XCTUnwrap(try doc(decodeSvgDataPayload(bsAccordion)).shapes.first)
    XCTAssertEqual(accordion.stroke, .color(0x8000_0000))

    let toggler = try doc(decodeSvgDataPayload(bsNavbarToggler))
    let t = try XCTUnwrap(toggler.shapes.first)
    XCTAssertEqual(toggler.width, 30)
    guard case let .color(argb) = t.stroke else { return XCTFail() }
    XCTAssertEqual(argb & 0xFF_FFFF, 0x21_2529)
    XCTAssertEqual(Double(argb >> 24), 191, accuracy: 1)
    XCTAssertEqual(t.miterLimit, 10)
    XCTAssertEqual(t.commands.filter { if case .move = $0 { return true } else { return false } }.count, 3)
  }

  func testDataPayloadDecoding() {
    XCTAssertEqual(decodeSvgDataPayload("%3csvg a='1+1'%3E"), "<svg a='1+1'>")
    XCTAssertEqual(decodeSvgDataPayload("100% %zz"), "100% %zz")
    XCTAssertEqual(decodeSvgDataPayload("%23%C3%A9"), "#é")
  }

  // MARK: rendering

  /// RGBA (straight alpha) of one pixel of a 1x render.
  private func pixel(_ image: UIImage, _ x: Int, _ y: Int) -> (r: Int, g: Int, b: Int, a: Int) {
    let cg = image.cgImage!
    var data = [UInt8](repeating: 0, count: 4)
    let ctx = CGContext(data: &data, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4,
                        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(cg, in: CGRect(x: -x, y: y - cg.height + 1, width: cg.width, height: cg.height))
    let a = Int(data[3])
    func un(_ v: UInt8) -> Int { a == 0 ? 0 : min(255, Int(v) * 255 / a) }
    return (un(data[0]), un(data[1]), un(data[2]), a)
  }

  private func render(_ svg: String, size: CGFloat, color: UInt32 = 0xFF00_0000) throws -> UIImage {
    let d = try doc(svg)
    return try XCTUnwrap(renderSvgDocument(d, size: CGSize(width: size, height: size), scale: 1, currentColor: color))
  }

  func testRenderEvenOddLeavesAHole() throws {
    let rings = #"<path d="M0 0h10v10H0z M3 3h4v4H3z"/>"#
    let nonzero = try render(#"<svg viewBox="0 0 10 10">\#(rings)</svg>"#, size: 10)
    let evenodd = try render(#"<svg viewBox="0 0 10 10" fill-rule="evenodd">\#(rings)</svg>"#, size: 10)
    XCTAssertEqual(pixel(nonzero, 5, 5).a, 255)
    XCTAssertEqual(pixel(evenodd, 5, 5).a, 0)
    XCTAssertEqual(pixel(evenodd, 1, 1).a, 255)
  }

  func testRenderChevronIsStrokedNotFilled() throws {
    let img = try render(decodeSvgDataPayload(bsSelectChevron), size: 16)
    // Inside the chevron's triangle but off its stroke: it must not be filled.
    XCTAssertEqual(pixel(img, 8, 7).a, 0)
    let onStroke = pixel(img, 8, 10)
    XCTAssertGreaterThan(onStroke.a, 200)
    XCTAssertLessThanOrEqual(abs(onStroke.r - 0x34), 3)
  }

  func testRenderCurrentColorAndScaleUp() throws {
    // grid's top-left cell edge is at x 1..7 / y 1..7 in a 16 viewBox; draw at 64.
    let img = try render(grid, size: 64, color: 0xFFFF_0000)
    XCTAssertEqual(img.size, CGSize(width: 64, height: 64))
    let edge = pixel(img, 6, 16) // on the left edge band (x 1..2 -> 4..8 px)
    XCTAssertEqual(edge.a, 255)
    XCTAssertEqual(edge.r, 255)
    XCTAssertEqual(edge.g, 0)
    XCTAssertEqual(pixel(img, 16, 16).a, 0) // inside the cell's hollow
  }

  func testRenderGroupOpacityCompositesOnce() throws {
    let img = try render(#"<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="black" stroke="black" stroke-width="4" opacity="0.5"/></svg>"#, size: 10)
    // Fill and stroke overlap at the edge; as one group they stay at 50%.
    XCTAssertEqual(Double(pixel(img, 0, 5).a), 128, accuracy: 2)
    XCTAssertEqual(Double(pixel(img, 5, 5).a), 128, accuracy: 2)
  }
}
