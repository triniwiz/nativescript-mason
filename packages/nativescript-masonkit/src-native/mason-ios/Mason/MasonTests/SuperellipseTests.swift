//
//  SuperellipseTests.swift
//  MasonTests
//
//  Tests for the superellipse curve implementation in CSSBorderRenderer.
//

import XCTest
@testable import Mason

final class SuperellipseTests: XCTestCase {

  private let epsilon: CGFloat = 1e-5

  // MARK: - Superellipse math helpers (mirrors Border.swift logic)

  /// Compute superellipse point: (cos(angle)^exp, sin(angle)^exp)
  private func superellipsePoint(t: Double, exponent: Double) -> (cx: CGFloat, cy: CGFloat) {
    let angle = t * .pi / 2.0
    let cx = CGFloat(pow(cos(angle), exponent))
    let cy = CGFloat(pow(sin(angle), exponent))
    return (cx, cy)
  }

  // MARK: - Math property tests

  func test_superellipse_boundaryPoints() {
    // At t=0: (1, 0), at t=1: (0, 1) for any exponent
    let exponents: [Double] = [0.3, 0.5, 1.0, 2.0, 4.0]

    for exp in exponents {
      let (cx0, cy0) = superellipsePoint(t: 0, exponent: exp)
      XCTAssertEqual(cx0, 1.0, accuracy: epsilon, "cx at t=0 should be 1 for exp=\(exp)")
      XCTAssertEqual(cy0, 0.0, accuracy: epsilon, "cy at t=0 should be 0 for exp=\(exp)")

      let (cx1, cy1) = superellipsePoint(t: 1, exponent: exp)
      XCTAssertEqual(cx1, 0.0, accuracy: 1e-3, "cx at t=1 should be ~0 for exp=\(exp)")
      XCTAssertEqual(cy1, 1.0, accuracy: epsilon, "cy at t=1 should be 1 for exp=\(exp)")
    }
  }

  func test_superellipse_exponent1_isCircular() {
    // For exponent=1, points should lie on the unit circle: x²+y² = 1
    for i in 0...16 {
      let t = Double(i) / 16.0
      let (cx, cy) = superellipsePoint(t: t, exponent: 1.0)
      let r2 = cx * cx + cy * cy
      XCTAssertEqual(r2, 1.0, accuracy: 1e-4, "x²+y² should ≈ 1 at t=\(t)")
    }
  }

  func test_superellipse_symmetryAtMidpoint() {
    // At t=0.5 (angle=π/4), cx should equal cy for any exponent
    let exponents: [Double] = [0.3, 0.5, 1.0, 1.5, 2.0, 4.0]

    for exp in exponents {
      let (cx, cy) = superellipsePoint(t: 0.5, exponent: exp)
      XCTAssertEqual(cx, cy, accuracy: epsilon, "cx and cy should be equal at midpoint for exp=\(exp)")
    }
  }

  func test_superellipse_smallerExponent_pushesOutward() {
    // Smaller exponent (squircle) should produce larger midpoint values
    let (cxCircle, _) = superellipsePoint(t: 0.5, exponent: 1.0)
    let (cxSquircle, _) = superellipsePoint(t: 0.5, exponent: 0.5)

    XCTAssertGreaterThan(cxSquircle, cxCircle,
      "Squircle midpoint should be larger (closer to corner) than circle")
  }

  func test_superellipse_largerExponent_pinchesCurve() {
    let (cxCircle, _) = superellipsePoint(t: 0.5, exponent: 1.0)
    let (cxPinched, _) = superellipsePoint(t: 0.5, exponent: 2.0)

    XCTAssertLessThan(cxPinched, cxCircle,
      "exp=2 midpoint should be smaller (more pinched) than circle")
  }

  func test_superellipse_monotonicity() {
    let exponents: [Double] = [0.3, 0.5, 1.0, 2.0, 4.0]

    for exp in exponents {
      var prevCx: CGFloat = .greatestFiniteMagnitude
      var prevCy: CGFloat = -.greatestFiniteMagnitude

      for i in 0...16 {
        let t = Double(i) / 16.0
        let (cx, cy) = superellipsePoint(t: t, exponent: exp)

        XCTAssertLessThanOrEqual(cx, prevCx + epsilon,
          "cx should decrease at t=\(t), exp=\(exp)")
        XCTAssertGreaterThanOrEqual(cy, prevCy - epsilon,
          "cy should increase at t=\(t), exp=\(exp)")

        prevCx = cx
        prevCy = cy
      }
    }
  }

  func test_superellipse_allPointsInUnitQuadrant() {
    let exponents: [Double] = [0.1, 0.3, 0.5, 1.0, 2.0, 5.0, 10.0]

    for exp in exponents {
      for i in 0...100 {
        let t = Double(i) / 100.0
        let (cx, cy) = superellipsePoint(t: t, exponent: exp)

        XCTAssertGreaterThanOrEqual(cx, -epsilon, "cx should be ≥ 0 at t=\(t), exp=\(exp)")
        XCTAssertLessThanOrEqual(cx, 1.0 + epsilon, "cx should be ≤ 1 at t=\(t), exp=\(exp)")
        XCTAssertGreaterThanOrEqual(cy, -epsilon, "cy should be ≥ 0 at t=\(t), exp=\(exp)")
        XCTAssertLessThanOrEqual(cy, 1.0 + epsilon, "cy should be ≤ 1 at t=\(t), exp=\(exp)")
      }
    }
  }

  // MARK: - CSSBorderRenderer path tests

  func test_buildRoundedPath_withExponent1_producesNonEmptyPath() {
    let mason = NSCMason.shared
    let view = MasonUIView(mason: mason)
    let renderer = view.style.borderRenderer

    // Set border radius
    view.style.borderRenderer.radius = CSSBorderRenderer.BorderRadius(
      topLeft: CSSBorderRenderer.CornerRadius(horizontal: .Points(10), vertical: .Points(10), exponent: 1.0),
      topRight: CSSBorderRenderer.CornerRadius(horizontal: .Points(10), vertical: .Points(10), exponent: 1.0),
      bottomRight: CSSBorderRenderer.CornerRadius(horizontal: .Points(10), vertical: .Points(10), exponent: 1.0),
      bottomLeft: CSSBorderRenderer.CornerRadius(horizontal: .Points(10), vertical: .Points(10), exponent: 1.0)
    )

    let rect = CGRect(x: 0, y: 0, width: 100, height: 100)
    let path = renderer.buildRoundedPath(in: rect, radius: renderer.radius)

    XCTAssertFalse(path.isEmpty, "Path should not be empty with exponent=1")
    XCTAssertTrue(path.bounds.width > 0, "Path should have nonzero width")
    XCTAssertTrue(path.bounds.height > 0, "Path should have nonzero height")
  }

  func test_buildRoundedPath_withSuperellipse_producesNonEmptyPath() {
    let mason = NSCMason.shared
    let view = MasonUIView(mason: mason)
    let renderer = view.style.borderRenderer

    renderer.radius = CSSBorderRenderer.BorderRadius(
      topLeft: CSSBorderRenderer.CornerRadius(horizontal: .Points(20), vertical: .Points(20), exponent: 0.5),
      topRight: CSSBorderRenderer.CornerRadius(horizontal: .Points(20), vertical: .Points(20), exponent: 0.5),
      bottomRight: CSSBorderRenderer.CornerRadius(horizontal: .Points(20), vertical: .Points(20), exponent: 0.5),
      bottomLeft: CSSBorderRenderer.CornerRadius(horizontal: .Points(20), vertical: .Points(20), exponent: 0.5)
    )

    let rect = CGRect(x: 0, y: 0, width: 100, height: 100)
    let path = renderer.buildRoundedPath(in: rect, radius: renderer.radius)

    XCTAssertFalse(path.isEmpty, "Path should not be empty with superellipse exponent=0.5")
    XCTAssertTrue(path.bounds.width > 0)
    XCTAssertTrue(path.bounds.height > 0)
  }

  func test_buildRoundedPath_superellipse_boundsContainedInRect() {
    let mason = NSCMason.shared
    let view = MasonUIView(mason: mason)
    let renderer = view.style.borderRenderer

    let exponents: [CGFloat] = [0.3, 0.5, 1.0, 2.0, 4.0]
    let rect = CGRect(x: 0, y: 0, width: 200, height: 150)

    for exp in exponents {
      let corner = CSSBorderRenderer.CornerRadius(horizontal: .Points(30), vertical: .Points(30), exponent: exp)
      renderer.radius = CSSBorderRenderer.BorderRadius(
        topLeft: corner, topRight: corner, bottomRight: corner, bottomLeft: corner
      )

      let path = renderer.buildRoundedPath(in: rect, radius: renderer.radius)

      // Path bounds should be contained within (or very close to) the input rect
      XCTAssertGreaterThanOrEqual(path.bounds.minX, rect.minX - 1,
        "Path minX should be >= rect minX for exp=\(exp)")
      XCTAssertGreaterThanOrEqual(path.bounds.minY, rect.minY - 1,
        "Path minY should be >= rect minY for exp=\(exp)")
      XCTAssertLessThanOrEqual(path.bounds.maxX, rect.maxX + 1,
        "Path maxX should be <= rect maxX for exp=\(exp)")
      XCTAssertLessThanOrEqual(path.bounds.maxY, rect.maxY + 1,
        "Path maxY should be <= rect maxY for exp=\(exp)")
    }
  }

  func test_buildRoundedPath_zeroRadius_producesRectangle() {
    let mason = NSCMason.shared
    let view = MasonUIView(mason: mason)
    let renderer = view.style.borderRenderer

    renderer.radius = .zero

    let rect = CGRect(x: 0, y: 0, width: 100, height: 100)
    let path = renderer.buildRoundedPath(in: rect, radius: renderer.radius)

    // With zero radius, path bounds should match the rect exactly
    XCTAssertEqual(path.bounds.width, rect.width, accuracy: 1)
    XCTAssertEqual(path.bounds.height, rect.height, accuracy: 1)
  }

  func test_buildRoundedPath_mixedExponents() {
    let mason = NSCMason.shared
    let view = MasonUIView(mason: mason)
    let renderer = view.style.borderRenderer

    // Mix of circular and superellipse corners
    renderer.radius = CSSBorderRenderer.BorderRadius(
      topLeft: CSSBorderRenderer.CornerRadius(horizontal: .Points(20), vertical: .Points(20), exponent: 1.0),
      topRight: CSSBorderRenderer.CornerRadius(horizontal: .Points(20), vertical: .Points(20), exponent: 0.5),
      bottomRight: CSSBorderRenderer.CornerRadius(horizontal: .Points(20), vertical: .Points(20), exponent: 1.0),
      bottomLeft: CSSBorderRenderer.CornerRadius(horizontal: .Points(20), vertical: .Points(20), exponent: 2.0)
    )

    let rect = CGRect(x: 0, y: 0, width: 100, height: 100)
    let path = renderer.buildRoundedPath(in: rect, radius: renderer.radius)

    XCTAssertFalse(path.isEmpty, "Path with mixed exponents should not be empty")
  }

  func test_buildRoundedPath_radiusExceedingBox_getsScaledDown() {
    let mason = NSCMason.shared
    let view = MasonUIView(mason: mason)
    let renderer = view.style.borderRenderer

    // Radius larger than half the box — CSS spec says scale down
    let corner = CSSBorderRenderer.CornerRadius(horizontal: .Points(80), vertical: .Points(80), exponent: 0.5)
    renderer.radius = CSSBorderRenderer.BorderRadius(
      topLeft: corner, topRight: corner, bottomRight: corner, bottomLeft: corner
    )

    let rect = CGRect(x: 0, y: 0, width: 100, height: 100)
    let path = renderer.buildRoundedPath(in: rect, radius: renderer.radius)

    // Path should still be contained in rect even with oversized radii
    XCTAssertFalse(path.isEmpty)
    XCTAssertLessThanOrEqual(path.bounds.maxX, rect.maxX + 1)
    XCTAssertLessThanOrEqual(path.bounds.maxY, rect.maxY + 1)
  }
}
