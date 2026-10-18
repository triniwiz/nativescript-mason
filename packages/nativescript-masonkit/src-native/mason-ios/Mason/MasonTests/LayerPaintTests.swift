//
//  LayerPaintTests.swift
//  MasonTests
//
//  Boxes painted through CALayer properties and sublayers match what draw(_:) paints.
//

import UIKit
import XCTest
@testable import Mason

final class LayerPaintTests: XCTestCase {

  private struct Bitmap {
    let width: Int
    let height: Int
    let pixels: [UInt8]

    func rgba(_ x: Int, _ y: Int) -> (r: Int, g: Int, b: Int, a: Int) {
      let i = (y * width + x) * 4
      return (Int(pixels[i]), Int(pixels[i + 1]), Int(pixels[i + 2]), Int(pixels[i + 3]))
    }
  }

  private let scale: CGFloat = 2

  private func bitmap(_ size: CGSize, _ draw: (CGContext) -> Void) throws -> Bitmap {
    let width = Int(size.width * scale)
    let height = Int(size.height * scale)
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    let ok = pixels.withUnsafeMutableBytes { raw -> Bool in
      guard let ctx = CGContext(data: raw.baseAddress, width: width, height: height, bitsPerComponent: 8,
                                bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(),
                                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
      ctx.translateBy(x: 0, y: CGFloat(height))
      ctx.scaleBy(x: scale, y: -scale)
      draw(ctx)
      return true
    }
    XCTAssertTrue(ok)
    return Bitmap(width: width, height: height, pixels: pixels)
  }

  private func cpu(_ view: MasonUIView) throws -> Bitmap {
    try bitmap(view.bounds.size) { ctx in
      UIGraphicsPushContext(ctx)
      view.draw(view.bounds)
      UIGraphicsPopContext()
    }
  }

  private func layered(_ view: MasonUIView) throws -> Bitmap {
    XCTAssertTrue(view.applyLayerPaintIfEligible(), "expected the layer paint path")
    return try bitmap(view.bounds.size) { ctx in view.layer.render(in: ctx) }
  }

  /// Pixels differing by more than `tolerance` on any channel.
  private func differing(_ a: Bitmap, _ b: Bitmap, tolerance: Int = 6) -> Int {
    var count = 0
    for y in 0..<a.height {
      for x in 0..<a.width {
        let p = a.rgba(x, y)
        let q = b.rgba(x, y)
        if abs(p.r - q.r) > tolerance || abs(p.g - q.g) > tolerance || abs(p.b - q.b) > tolerance || abs(p.a - q.a) > tolerance {
          count += 1
        }
      }
    }
    return count
  }

  private func view(_ width: CGFloat, _ height: CGFloat, _ configure: (MasonStyle) -> Void) -> MasonUIView {
    let v = MasonUIView(mason: NSCMason.shared)
    v.frame = CGRect(x: 0, y: 0, width: width, height: height)
    configure(v.style)
    return v
  }

  private func assertMatches(_ v: MasonUIView, edgePixels: Int, file: StaticString = #filePath, line: UInt = #line) throws {
    let expected = try cpu(v)
    let actual = try layered(v)
    let diff = differing(expected, actual)
    XCTAssertLessThanOrEqual(diff, edgePixels, "\(diff) of \(expected.width * expected.height) pixels differ", file: file, line: line)
  }

  /// The gradient value Core Animation paints at (x, y): bands perpendicular to start->end in unit space.
  private func layerT(_ g: CAGradientLayer, _ x: CGFloat, _ y: CGFloat) -> CGFloat {
    let u = CGPoint(x: x / g.bounds.width, y: y / g.bounds.height)
    let v = CGPoint(x: g.endPoint.x - g.startPoint.x, y: g.endPoint.y - g.startPoint.y)
    return ((u.x - g.startPoint.x) * v.x + (u.y - g.startPoint.y) * v.y) / (v.x * v.x + v.y * v.y)
  }

  /// CSS: the gradient line runs through the centre, |w sin a| + |h cos a| long.
  private func cssT(_ degrees: CGFloat, _ w: CGFloat, _ h: CGFloat, _ x: CGFloat, _ y: CGFloat) -> CGFloat {
    let a = degrees * .pi / 180
    let length = abs(w * sin(a)) + abs(h * cos(a))
    return ((x - w / 2) * sin(a) - (y - h / 2) * cos(a)) / length + 0.5
  }

  private func gradientLayer(_ v: MasonUIView) throws -> CAGradientLayer {
    XCTAssertTrue(v.applyLayerPaintIfEligible(), "expected the layer paint path")
    let g = try XCTUnwrap(v._gradientLayer)
    XCTAssertTrue(g.superlayer === v.layer)
    XCTAssertEqual(g.frame, v.bounds)
    return g
  }

  private func assertFollows(_ g: CAGradientLayer, degrees: CGFloat, file: StaticString = #filePath, line: UInt = #line) {
    let w = g.bounds.width
    let h = g.bounds.height
    for (fx, fy) in [(0.0, 0.0), (1.0, 1.0), (0.5, 0.5), (0.1, 0.9), (0.8, 0.2), (1.0, 0.0)] {
      let x = w * fx
      let y = h * fy
      XCTAssertEqual(layerT(g, x, y), cssT(degrees, w, h, x, y), accuracy: 1e-6, "at \(fx), \(fy)", file: file, line: line)
    }
  }

  /// draw(_:) uses the same gradient line.
  func testGradientLinePoints() {
    let (start, end) = linearGradientPoints(direction: "135deg", width: 300, height: 90)
    let half = (300 + 90) * sin(CGFloat.pi / 4) / 2
    XCTAssertEqual(start.x, 150 - half * sin(CGFloat.pi / 4), accuracy: 1e-6)
    XCTAssertEqual(start.y, 45 - half * sin(CGFloat.pi / 4), accuracy: 1e-6)
    XCTAssertEqual(end.x, 150 + half * sin(CGFloat.pi / 4), accuracy: 1e-6)
    XCTAssertEqual(end.y, 45 + half * sin(CGFloat.pi / 4), accuracy: 1e-6)
    let (top, bottom) = linearGradientPoints(direction: nil, width: 300, height: 90)
    XCTAssertEqual(top, CGPoint(x: 150, y: 0))
    XCTAssertEqual(bottom, CGPoint(x: 150, y: 90))
  }

  func testAngledGradient() throws {
    let g = try gradientLayer(view(300, 90) { $0.background = "linear-gradient(135deg, #e11d48, #16a34a)" })
    XCTAssertEqual(g.colors?.count, 2)
    XCTAssertEqual(g.locations?.map { $0.doubleValue }, [0, 1])
    assertFollows(g, degrees: 135)
  }

  func testGradientAngleUnits() throws {
    assertFollows(try gradientLayer(view(200, 80) { $0.background = "linear-gradient(0.3turn, red, blue)" }), degrees: 108)
    assertFollows(try gradientLayer(view(200, 80) { $0.background = "linear-gradient(-45deg, red, blue)" }), degrees: -45)
    assertFollows(try gradientLayer(view(200, 80) { $0.background = "linear-gradient(to left, red, blue)" }), degrees: 270)
  }

  /// A corner keyword aims the 50% line through the two other corners.
  func testCornerKeywordGradient() throws {
    let w: CGFloat = 200
    let h: CGFloat = 120
    let g = try gradientLayer(view(w, h) {
      $0.background = "linear-gradient(to bottom right, #2563eb, #f59e0b)"
      $0.borderRadius = "12px"
    })
    XCTAssertEqual(layerT(g, 0, 0), 0, accuracy: 1e-6)
    XCTAssertEqual(layerT(g, w, h), 1, accuracy: 1e-6)
    XCTAssertEqual(layerT(g, w, 0), 0.5, accuracy: 1e-6)
    XCTAssertEqual(layerT(g, 0, h), 0.5, accuracy: 1e-6)
    XCTAssertTrue(g.masksToBounds)
    XCTAssertEqual(g.cornerRadius, g.superlayer?.cornerRadius)
  }

  func testGradientStopPositions() throws {
    let g = try gradientLayer(view(160, 60) { $0.background = "linear-gradient(90deg, #ff0000 0%, #00ff00 30%, #0000ff 100%)" })
    let locations = try XCTUnwrap(g.locations).map { $0.doubleValue }
    XCTAssertEqual(locations.count, 3)
    for (actual, expected) in zip(locations, [0, 0.3, 1]) { XCTAssertEqual(actual, expected, accuracy: 1e-6) }
  }

  func testGradientOnSomeCorners() throws {
    let v = view(220, 100) {
      $0.background = "linear-gradient(30deg, #7c3aed, #10b981)"
      $0.borderRadius = "16px 0 16px 0"
    }
    let g = try gradientLayer(v)
    XCTAssertEqual(g.maskedCorners, [.layerMinXMinYCorner, .layerMaxXMaxYCorner])
    XCTAssertEqual(v.layer.maskedCorners, g.maskedCorners)
    XCTAssertGreaterThan(g.cornerRadius, 0)
    assertFollows(g, degrees: 30)
  }

  func testRadiusOnSomeCornersWithBorder() throws {
    let v = view(240, 110) {
      $0.backgroundColor = 0xFFFFFFFF
      $0.borderRadius = "16px 0 16px 0"
      $0.border = "2px solid #2563eb"
    }
    try assertMatches(v, edgePixels: 1500)
  }

  func testSidesWithDifferentWidthsAndColors() throws {
    let v = view(240, 110) {
      $0.backgroundColor = 0xFFFFFFFF
      $0.border = "1px solid #d0d4e0"
      $0.borderTop = "4px solid #dc2626"
    }
    try assertMatches(v, edgePixels: 20)
  }

  func testBottomBorderOnly() throws {
    let v = view(300, 44) {
      $0.backgroundColor = 0xFFFFFFFF
      $0.borderBottom = "1px solid #d0d4e0"
    }
    try assertMatches(v, edgePixels: 0)
  }

  func testUniformBorderAndRadius() throws {
    let v = view(120, 80) {
      $0.backgroundColor = 0xFFF5F6FA
      $0.borderRadius = "12px"
      $0.border = "1px solid #d0d4e0"
    }
    try assertMatches(v, edgePixels: 300)
  }

  func testCasesThatNeedDrawStayOnIt() {
    let rounded = view(200, 100) {
      $0.borderRadius = "8px"
      $0.border = "1px solid #d0d4e0"
      $0.borderTop = "4px solid #dc2626"
    }
    XCTAssertFalse(rounded.applyLayerPaintIfEligible(), "per-side borders with a radius")
    let elliptical = view(200, 100) {
      $0.backgroundColor = 0xFFFFFFFF
      $0.borderRadius = "20px / 10px"
    }
    XCTAssertFalse(elliptical.applyLayerPaintIfEligible(), "elliptical corners")
    let repeating = view(200, 100) { $0.background = "repeating-linear-gradient(90deg, red 0%, blue 20%)" }
    XCTAssertFalse(repeating.applyLayerPaintIfEligible(), "repeating gradient")
    let dashed = view(200, 100) { $0.borderBottom = "2px dashed #d0d4e0" }
    XCTAssertFalse(dashed.applyLayerPaintIfEligible(), "dashed side")
    let behind = view(200, 100) { $0.background = "linear-gradient(red, blue)" }
    let child = UIView()
    child.layer.zPosition = -1
    behind.addSubview(child)
    XCTAssertFalse(behind.applyLayerPaintIfEligible(), "negative z-index child under the gradient layer")
  }

}
