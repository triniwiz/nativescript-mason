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

  func testUnitlessShadowLengthsAreCSSPixels() throws {
    let bare = view(100, 50) { $0.boxShadow = "6 10 4 6 rgba(0, 0, 0, 0.5)" }
    let px = view(100, 50) { $0.boxShadow = "6px 10px 4px 6px rgba(0, 0, 0, 0.5)" }
    let a = try XCTUnwrap(bare.style.boxShadows.first)
    let b = try XCTUnwrap(px.style.boxShadows.first)
    XCTAssertEqual([a.offsetX, a.offsetY, a.blurRadius, a.spreadRadius], [6, 10, 4, 6])
    XCTAssertEqual([a.offsetX, a.offsetY, a.blurRadius, a.spreadRadius], [b.offsetX, b.offsetY, b.blurRadius, b.spreadRadius])
  }

  /// Alpha of the shadow layer at (x, y) in its own points.
  private func shadowAlpha(_ shadow: CALayer, _ x: CGFloat, _ y: CGFloat) throws -> Int {
    let bmp = try bitmap(shadow.bounds.size) { ctx in shadow.render(in: ctx) }
    return bmp.rgba(Int(x * scale), Int(y * scale)).a
  }

  // CSS paints no outset shadow under the box; a see-through box gets it from an image, not a mask.
  func testSeeThroughBoxShadowIsAClearedImage() throws {
    let host = UIView(frame: CGRect(x: 0, y: 0, width: 500, height: 400))
    let v = view(240, 110) {
      $0.backgroundColor = 0xFFFFFFFF
      $0.borderRadius = "16px"
      $0.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)"
    }
    v.frame.origin = CGPoint(x: 130, y: 145)
    host.addSubview(v)
    v.style.updateShadowLayer(for: CGRect(origin: .zero, size: v.bounds.size))
    let shadow = v.style.mShadowLayer
    let e = (shadow.bounds.width - 240) / 2
    XCTAssertNil(shadow.mask)
    XCTAssertNil(shadow.contents)

    v.style.backgroundColor = 0x59FFFFFF
    v.style.refreshShadowMode(v.layer)
    XCTAssertNil(shadow.mask)
    let image = try XCTUnwrap(shadow.contents) as! CGImage
    XCTAssertLessThan(CGFloat(image.width), shadow.bounds.width * CGFloat(NSCMason.scale), "nine-slice keeps the image small")
    XCTAssertEqual(try shadowAlpha(shadow, e + 120, e + 55), 0, "nothing under the box")
    XCTAssertEqual(try shadowAlpha(shadow, e + 30, e + 20), 0, "nothing under the box")
    let imageBelow = try shadowAlpha(shadow, e + 120, e + 110 + 10)
    XCTAssertGreaterThan(imageBelow, 0)
    // 2pt past the shadow's edge, with a Gaussian of sigma = blur / 2: 0.5 * Phi(-2 / 12).
    let expected = 255 * 0.5 * 0.5 * erfc((2.0 / 12.0) / 2.0.squareRoot())
    XCTAssertEqual(Double(imageBelow), expected, accuracy: 6, "CSS blur")

    v.style.backgroundColor = 0xFFFFFFFF
    v.style.refreshShadowMode(v.layer)
    XCTAssertNil(shadow.contents)
    v.layer.opacity = 0.5
    XCTAssertNotNil(shadow.contents, "a half-transparent box shows what is under it")
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

  // MARK: - Gradient geometry

  func testLengthStopsArePlacedOnTheGradientLine() {
    let parsed = parseGradientStops(expandColorStops(["red 0 20px", "blue 20px 40px"]), lineLength: 100)
    XCTAssertEqual(parsed.locations.map { ($0 * 1e4).rounded() / 1e4 }, [0, 0.2, 0.2, 0.4])
    XCTAssertEqual(parseGradientStops(["red 20px", "blue"]).locations, [0, 1], "no line, no length")
  }

  func testAStopBeforeAnEarlierOneMovesUpToIt() {
    let parsed = parseGradientStops(["red 50%", "blue 20%", "green"])
    XCTAssertEqual(parsed.locations, [0.5, 0.5, 1])
  }

  func testRadialShapeAndSize() {
    func shape(_ direction: String?) -> RadialGradientShape {
      resolveRadialGradientShape(direction: direction, width: 200, height: 100)
    }
    let corner = shape(nil)
    XCTAssertEqual(corner.rx, 100 * sqrt(2), accuracy: 1e-6, "farthest-corner ellipse by default")
    XCTAssertEqual(corner.ry, 50 * sqrt(2), accuracy: 1e-6)
    XCTAssertEqual(shape("circle").rx, hypot(100, 50), accuracy: 1e-6)
    XCTAssertEqual(shape("circle").ry, hypot(100, 50), accuracy: 1e-6)
    XCTAssertEqual(shape("closest-side"), RadialGradientShape(center: CGPoint(x: 100, y: 50), rx: 100, ry: 50))
    XCTAssertEqual(shape("circle closest-side").rx, 50)
    XCTAssertEqual(shape("circle farthest-side at 10% 50%").rx, 180, accuracy: 1e-6)
    XCTAssertEqual(shape("circle 30px").rx, 30, accuracy: 1e-6)
    XCTAssertEqual(shape("30px at top left").ry, 30, accuracy: 1e-6, "one length is a circle")
    let explicit = shape("ellipse 40px 20% at 0 0")
    XCTAssertEqual(explicit.rx, 40, accuracy: 1e-6)
    XCTAssertEqual(explicit.ry, 20, accuracy: 1e-6)
    XCTAssertEqual(explicit.center, .zero)
  }

  func testRadialPreludeIsNotAStop() {
    for (css, direction) in [("radial-gradient(circle 50px at 10px 20px, red, blue)", "circle 50px at 10px 20px"),
                             ("radial-gradient(40px 20%, red, blue)", "40px 20%"),
                             ("radial-gradient(ellipse closest-side, red, blue)", "ellipse closest-side")] {
      let g = parseGradient(css)
      XCTAssertEqual(g?.direction, direction, css)
      XCTAssertEqual(g?.stops.count, 2, css)
    }
  }

  private func color(_ b: Bitmap, _ x: CGFloat, _ y: CGFloat) -> String {
    let p = b.rgba(Int(x * scale), Int(y * scale))
    return p.r > 200 && p.b < 60 ? "red" : p.b > 200 && p.r < 60 ? "blue" : "\(p)"
  }

  func testRepeatingPxStripes() throws {
    let v = view(100, 10) { $0.background = "repeating-linear-gradient(to right, red 0 10px, blue 10px 20px)" }
    let b = try cpu(v)
    for (x, expected) in [(5.0, "red"), (15.0, "blue"), (25.0, "red"), (55.0, "blue"), (85.0, "red"), (95.0, "blue")] {
      XCTAssertEqual(color(b, x, 5), expected, "at x \(x)")
    }
  }

  func testEllipseRadial() throws {
    let v = view(200, 100) { $0.background = "radial-gradient(closest-side, red 0 90%, blue 90%)" }
    let b = try cpu(v)
    XCTAssertEqual(color(b, 185, 50), "red", "inside the ellipse on the long axis")
    XCTAssertEqual(color(b, 100, 7), "red", "inside on the short axis")
    XCTAssertEqual(color(b, 100, 2), "blue")
    XCTAssertEqual(color(b, 195, 50), "blue")
    XCTAssertEqual(color(b, 170, 20), "blue", "outside near the corner")
  }

  func testRepeatingRadialReachesTheCorners() throws {
    let v = view(100, 100) { $0.background = "repeating-radial-gradient(circle 10px, red 0 5px, blue 5px 10px)" }
    let b = try cpu(v)
    // Past the 10px ending shape the bands keep repeating out to the corners.
    XCTAssertEqual(color(b, 50 + 2, 50), "red")
    XCTAssertEqual(color(b, 50 + 7, 50), "blue")
    XCTAssertEqual(color(b, 50 + 42, 50), "red")
    XCTAssertEqual(color(b, 4, 4), "red", "about 64.7px out")
  }

  func testRadialStopsPastTheEndingShapeKeepGoing() throws {
    let v = view(100, 100) { $0.background = "radial-gradient(circle 10px, red 0 20px, blue 20px)" }
    let b = try cpu(v)
    XCTAssertEqual(color(b, 50 + 15, 50), "red")
    XCTAssertEqual(color(b, 50 + 25, 50), "blue")
  }

}
