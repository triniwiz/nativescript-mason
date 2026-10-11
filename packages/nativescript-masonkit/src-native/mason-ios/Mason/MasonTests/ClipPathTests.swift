//
//  ClipPathTests.swift
//  MasonTests
//
//  `clip-path`: parsing of the basic shapes and reference boxes, the resolved paths, the
//  composed mask they produce (alone and with `mask-image`) and hit testing.
//

import XCTest
import UIKit
@testable import Mason

final class ClipPathTests: XCTestCase {

  // A Mask (and the border renderer) hold their style unowned; keep the views alive.
  private var views: [MasonUIView] = []

  override func tearDown() {
    views.removeAll()
    super.tearDown()
  }

  private func makeView(_ w: CGFloat = 100, _ h: CGFloat = 100) -> MasonUIView {
    let view = MasonUIView(mason: NSCMason.shared)
    view.frame = CGRect(x: 0, y: 0, width: w, height: h)
    views.append(view)
    return view
  }

  private func parse(_ value: String) -> ClipPathValue? {
    ClipPathValue.parse(value, em: 20)
  }

  private func path(_ value: String, _ w: CGFloat = 100, _ h: CGFloat = 100, boxes: ClipReferenceBoxes? = nil) throws -> CGPath {
    let clip = try XCTUnwrap(parse(value), value)
    return clip.path(boxes ?? ClipReferenceBoxes(border: CGRect(x: 0, y: 0, width: w, height: h)), renderer: makeView(w, h).style.mBorderRender)
  }

  private func assertRect(_ r: CGRect, _ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertEqual(r.minX, x, accuracy: 0.01, file: file, line: line)
    XCTAssertEqual(r.minY, y, accuracy: 0.01, file: file, line: line)
    XCTAssertEqual(r.width, w, accuracy: 0.01, file: file, line: line)
    XCTAssertEqual(r.height, h, accuracy: 0.01, file: file, line: line)
  }

  // MARK: - Parsing

  func testInsetParsing() {
    XCTAssertEqual(parse("inset(10px)"), ClipPathValue(shape: .inset(Array(repeating: .points(10), count: 4), radii: nil), box: .borderBox))
    XCTAssertEqual(parse("inset(1px 2%)")?.shape, .inset([.points(1), .percent(0.02), .points(1), .percent(0.02)], radii: nil))
    XCTAssertEqual(parse("inset(1em)")?.shape, .inset(Array(repeating: .points(20), count: 4), radii: nil), "em uses the element's font size")
    guard case let .inset(values, radii)? = parse("INSET(1px 2px 3px 4px round 5px 6px / 7px)")?.shape else {
      return XCTFail("inset with radii")
    }
    XCTAssertEqual(values, [.points(1), .points(2), .points(3), .points(4)])
    XCTAssertEqual(radii?.map { $0.x }, [.points(5), .points(6), .points(5), .points(6)])
    XCTAssertEqual(radii?.map { $0.y }, Array(repeating: .points(7), count: 4))
    XCTAssertEqual(parse("inset(10px round 50%)")?.shape, .inset(Array(repeating: .points(10), count: 4),
                                                                   radii: Array(repeating: ClipCorner(x: .percent(0.5), y: .percent(0.5)), count: 4)))
  }

  func testCircleAndEllipseParsing() {
    XCTAssertEqual(parse("circle()")?.shape, .circle(.closestSide, at: nil))
    XCTAssertEqual(parse("circle(50%)")?.shape, .circle(.length(.percent(0.5)), at: nil))
    XCTAssertEqual(parse("circle(farthest-side at left top)")?.shape,
                   .circle(.farthestSide, at: BackgroundPosition(x: BackgroundOffset(fraction: 0), y: BackgroundOffset(fraction: 0))))
    XCTAssertEqual(parse("circle(at 25% 75%)")?.shape,
                   .circle(.closestSide, at: BackgroundPosition(x: BackgroundOffset(fraction: 0.25), y: BackgroundOffset(fraction: 0.75))))
    XCTAssertEqual(parse("ellipse()")?.shape, .ellipse(.closestSide, .closestSide, at: nil))
    XCTAssertEqual(parse("ellipse(10px 20% at center)")?.shape,
                   .ellipse(.length(.points(10)), .length(.percent(0.2)),
                            at: BackgroundPosition(x: BackgroundOffset(fraction: 0.5), y: BackgroundOffset(fraction: 0.5))))
  }

  func testPolygonPathRectXywhParsing() {
    XCTAssertEqual(parse("polygon(50% 0, 100% 100%, 0 100%)")?.shape,
                   .polygon(evenOdd: false, points: [ClipPoint(x: .percent(0.5), y: .points(0)), ClipPoint(x: .percent(1), y: .percent(1)),
                                                     ClipPoint(x: .points(0), y: .percent(1))]))
    XCTAssertEqual(parse("polygon(evenodd, 0 0, 10px 0, 0 10px)")?.evenOdd, true)
    XCTAssertEqual(parse("polygon(nonzero, 0 0, 10px 0, 0 10px)")?.evenOdd, false)

    guard case let .path(evenOdd, commands)? = parse("path(evenodd, 'M0 0 L10 0 L0 10 Z')")?.shape else {
      return XCTFail("path")
    }
    XCTAssertTrue(evenOdd)
    XCTAssertEqual(commands.first, .move(0, 0))
    XCTAssertEqual(commands.last, .close)
    XCTAssertNotNil(parse("path(\"M 0,0 h 10 v 10 z\")"), "commas inside the quoted data are not separators")

    XCTAssertEqual(parse("rect(10px auto 90% 5px round 2px)")?.shape,
                   .rect([.points(10), nil, .percent(0.9), .points(5)], radii: Array(repeating: ClipCorner(x: .points(2), y: .points(2)), count: 4)))
    XCTAssertEqual(parse("xywh(1px 2px 3px 50%)")?.shape, .xywh(x: .points(1), y: .points(2), width: .points(3), height: .percent(0.5), radii: nil))
  }

  func testBoxes() {
    XCTAssertEqual(parse("padding-box"), ClipPathValue(shape: nil, box: .paddingBox))
    XCTAssertEqual(parse("content-box circle()"), ClipPathValue(shape: .circle(.closestSide, at: nil), box: .contentBox))
    XCTAssertEqual(parse("circle() margin-box"), ClipPathValue(shape: .circle(.closestSide, at: nil), box: .marginBox))
    XCTAssertEqual(parse("fill-box")?.box, .borderBox)
    XCTAssertEqual(parse("stroke-box")?.box, .borderBox)
    XCTAssertEqual(parse("view-box inset(0)")?.box, .borderBox)
    XCTAssertEqual(parse("inset(0)")?.box, .borderBox, "shapes default to the border box")
  }

  func testInvalidIsNone() {
    for value in ["", "none", "url(#clip)", "url(\"shapes.svg#c\") border-box", "circle(", "circle() circle()",
                  "border-box padding-box", "foo(1px)", "inset()", "inset(1px 2px 3px 4px 5px)", "circle(-10px)",
                  "circle(1px 2px)", "ellipse(10px)", "ellipse(1px 2px 3px)", "circle(at)", "polygon()",
                  "polygon(0 0, 10px)", "polygon(evenodd)", "path(M0 0)", "path('')", "rect(1px 2px 3px)",
                  "xywh(0 0 -1px 2px)", "inset(1px round)", "inset(1px round -2px)", "red", "circle(10px) red"] {
      XCTAssertNil(parse(value), value)
    }
  }

  // MARK: - Geometry

  func testCirclePaths() throws {
    // 50% of the normalized diagonal of a square is half its side.
    let half = try path("circle(50%)")
    assertRect(half.boundingBoxOfPath, 0, 0, 100, 100)
    XCTAssertTrue(half.contains(CGPoint(x: 50, y: 50)))
    XCTAssertFalse(half.contains(CGPoint(x: 3, y: 3)))

    assertRect(try path("circle()", 200, 100).boundingBoxOfPath, 50, 0, 100, 100)
    assertRect(try path("circle(farthest-side at 0 0)").boundingBoxOfPath, -100, -100, 200, 200)
    assertRect(try path("circle(10px at 20px 30px)").boundingBoxOfPath, 10, 20, 20, 20)
    assertRect(try path("ellipse(closest-side farthest-side at 25% 50%)").boundingBoxOfPath, 0, 0, 50, 100)
    assertRect(try path("ellipse(10% 20%)", 200, 100).boundingBoxOfPath, 80, 30, 40, 40)
  }

  func testInsetRectXywhPaths() throws {
    let inset = try path("inset(10px round 5px)", 100, 50)
    assertRect(inset.boundingBoxOfPath, 10, 10, 80, 30)
    XCTAssertTrue(inset.contains(CGPoint(x: 50, y: 25)))
    XCTAssertFalse(inset.contains(CGPoint(x: 10.5, y: 10.5)), "the corner is rounded")
    XCTAssertTrue(inset.contains(CGPoint(x: 15, y: 11)))

    // Overlapping insets shrink in proportion until they meet: nothing is left.
    XCTAssertTrue(try path("inset(60% 0 60% 0)").boundingBoxOfPath.isEmpty)
    XCTAssertFalse(try path("inset(60% 0 60% 0)").contains(CGPoint(x: 50, y: 50)))

    assertRect(try path("rect(10px auto auto 20px)").boundingBoxOfPath, 20, 10, 80, 90)
    // The right edge never crosses the left one: a zero-width rect clips everything.
    XCTAssertTrue(try path("rect(10px 5px 90% 20px)").boundingBoxOfPath.isEmpty)
    assertRect(try path("xywh(10px 10px 50% 20px)").boundingBoxOfPath, 10, 10, 50, 20)
    assertRect(try path("inset(-10px)").boundingBoxOfPath, -10, -10, 120, 120)
  }

  func testPolygonAndPathFillRules() throws {
    // A pentagram: its centre is inside under nonzero, a hole under evenodd.
    let star = "50% 0, 79% 90%, 2% 35%, 98% 35%, 21% 90%"
    XCTAssertTrue(try path("polygon(\(star))").contains(CGPoint(x: 50, y: 50), using: .winding))
    let evenOdd = try XCTUnwrap(parse("polygon(evenodd, \(star))"))
    XCTAssertTrue(evenOdd.evenOdd)
    let p = evenOdd.path(ClipReferenceBoxes(border: CGRect(x: 0, y: 0, width: 100, height: 100)), renderer: makeView().style.mBorderRender)
    XCTAssertFalse(p.contains(CGPoint(x: 50, y: 50), using: .evenOdd))

    let triangle = try path("polygon(50% 0, 100% 100%, 0 100%)")
    XCTAssertTrue(triangle.contains(CGPoint(x: 50, y: 90)))
    XCTAssertFalse(triangle.contains(CGPoint(x: 5, y: 5)))

    // path() coordinates start at the reference box's origin.
    let boxes = ClipReferenceBoxes(border: CGRect(x: 0, y: 0, width: 100, height: 100), borderWidths: UIEdgeInsets(top: 5, left: 5, bottom: 5, right: 5),
                                   padding: UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10))
    assertRect(try path("path('M0 0 H10 V10 Z') content-box", boxes: boxes).boundingBoxOfPath, 15, 15, 10, 10)
  }

  func testReferenceBoxes() throws {
    let boxes = ClipReferenceBoxes(border: CGRect(x: 0, y: 0, width: 100, height: 100),
                                   borderWidths: UIEdgeInsets(top: 5, left: 5, bottom: 5, right: 5),
                                   padding: UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10),
                                   margin: UIEdgeInsets(top: 1, left: 2, bottom: 3, right: 4))
    assertRect(try path("border-box", boxes: boxes).boundingBoxOfPath, 0, 0, 100, 100)
    assertRect(try path("padding-box", boxes: boxes).boundingBoxOfPath, 5, 5, 90, 90)
    assertRect(try path("content-box", boxes: boxes).boundingBoxOfPath, 15, 15, 70, 70)
    assertRect(try path("margin-box", boxes: boxes).boundingBoxOfPath, -2, -1, 106, 104)
    // Percentages resolve against the reference box.
    assertRect(try path("inset(10%) padding-box", boxes: boxes).boundingBoxOfPath, 14, 14, 72, 72)
  }

  func testBoxAloneFollowsTheBorderRadius() throws {
    let view = makeView()
    view.style.borderRadius = "20px"
    let clip = try XCTUnwrap(parse("border-box"))
    let p = clip.path(ClipReferenceBoxes(border: CGRect(x: 0, y: 0, width: 100, height: 100)), renderer: view.style.mBorderRender)
    XCTAssertFalse(p.contains(CGPoint(x: 2, y: 2)), "the rounded corner is clipped")
    XCTAssertTrue(p.contains(CGPoint(x: 50, y: 50)))
    XCTAssertTrue(p.contains(CGPoint(x: 50, y: 1)))
  }

  // MARK: - Composed mask

  private func alpha(_ image: CGImage, _ x: Int, _ y: Int) -> UInt8 {
    let ctx = Mask.makeContext(image.width, image.height)!
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    let bytes = ctx.data!.bindMemory(to: UInt8.self, capacity: ctx.bytesPerRow * ctx.height)
    return bytes[y * ctx.bytesPerRow + x * 4 + 3]
  }

  /// The mask for `clip` (and optionally a mask-image), rendered at scale 1.
  private func render(clip: String, image: String = "", _ w: CGFloat = 100, _ h: CGFloat = 100) throws -> CGImage {
    let view = makeView(w, h)
    let mask = Mask(style: view.style)
    mask.update([image, "", "", "", "", "", "", "", clip])
    let value = try XCTUnwrap(mask.clip)
    let shape = value.path(ClipReferenceBoxes(border: CGRect(x: 0, y: 0, width: w, height: h)), renderer: view.style.mBorderRender)
    return try XCTUnwrap(mask.renderImage(boxSize: CGSize(width: w, height: h), maskRect: CGRect(x: 0, y: 0, width: w, height: h),
                                          scale: 1, clipShape: shape, clipEvenOdd: value.evenOdd))
  }

  func testCircleMaskPixels() throws {
    let image = try render(clip: "circle(50%)")
    XCTAssertEqual(alpha(image, 50, 50), 255)
    XCTAssertEqual(alpha(image, 1, 1), 0)
    XCTAssertEqual(alpha(image, 98, 98), 0)
    XCTAssertEqual(alpha(image, 98, 1), 0)
    XCTAssertEqual(alpha(image, 50, 2), 255)
  }

  func testRoundedInsetMaskPixels() throws {
    let image = try render(clip: "inset(10px round 5px)", 100, 50)
    XCTAssertEqual(alpha(image, 50, 25), 255)
    XCTAssertEqual(alpha(image, 5, 25), 0)
    XCTAssertEqual(alpha(image, 10, 10), 0, "rounded corner")
    XCTAssertEqual(alpha(image, 20, 11), 255)
    XCTAssertEqual(alpha(image, 95, 45), 0)
  }

  func testPolygonMaskPixels() throws {
    let image = try render(clip: "polygon(50% 0, 100% 100%, 0 100%)")
    XCTAssertEqual(alpha(image, 50, 90), 255)
    XCTAssertEqual(alpha(image, 5, 5), 0)
    XCTAssertEqual(alpha(image, 95, 5), 0)
  }

  func testClipPathWithMaskImage() throws {
    let image = try render(clip: "circle(50%)", image: "linear-gradient(black, transparent)")
    XCTAssertEqual(alpha(image, 2, 2), 0, "clipped although the gradient is opaque there")
    XCTAssertGreaterThan(alpha(image, 50, 6), 220, "the gradient's opaque top, inside the circle")
    XCTAssertEqual(Double(alpha(image, 50, 50)), 128, accuracy: 12)
    XCTAssertEqual(Double(alpha(image, 8, 50)), 128, accuracy: 12)
    XCTAssertLessThan(alpha(image, 50, 97), 15)
  }

  // MARK: - View hookup

  func testClipPathInstallsAVectorMask() throws {
    let view = makeView()
    view.style.clipPath = "circle(50%)"
    XCTAssertEqual(view.style.clipPath, "circle(50%)")
    XCTAssertTrue(view.style.isMasked, "the outset shadow is hidden while clipped")
    let maskLayer = try XCTUnwrap(view.layer.mask as? MasonMaskLayer)
    XCTAssertEqual(maskLayer.frame, view.bounds)
    maskLayer.display()
    XCTAssertNil(maskLayer.contents, "a lone clip path is not rasterized")
    let shape = try XCTUnwrap(maskLayer.vectorClipLayer)
    XCTAssertNotNil(shape.path)

    // What the mask layer composites: opaque in the circle, clear in the corners.
    let ctx = try XCTUnwrap(Mask.makeContext(100, 100))
    ctx.translateBy(x: 0, y: 100)
    ctx.scaleBy(x: 1, y: -1)
    maskLayer.render(in: ctx)
    let rendered = try XCTUnwrap(ctx.makeImage())
    XCTAssertEqual(alpha(rendered, 50, 50), 255)
    XCTAssertEqual(alpha(rendered, 2, 2), 0)

    // Adding a mask-image switches to the composed raster.
    view.style.maskImage = "linear-gradient(black, black)"
    maskLayer.display()
    XCTAssertNotNil(maskLayer.contents)
    XCTAssertNil(maskLayer.vectorClipLayer)

    view.style.maskImage = ""
    view.style.clipPath = "none"
    XCTAssertNil(view.layer.mask)
    XCTAssertFalse(view.style.isMasked)
  }

  func testClipPathKeepsTheOverflowClip() throws {
    let view = makeView(40, 20)
    let overflow = CAShapeLayer()
    overflow.path = CGPath(rect: CGRect(x: 0, y: 0, width: 20, height: 20), transform: nil)
    overflow.frame = view.bounds
    view.layer.mask = overflow
    view.style.clipPath = "inset(0)"
    let maskLayer = try XCTUnwrap(view.layer.mask as? MasonMaskLayer)
    XCTAssertNotNil(maskLayer.overflowClip)
    maskLayer.display()
    XCTAssertNil(maskLayer.vectorClipLayer, "two clips compose in the raster")
    XCTAssertNotNil(maskLayer.contents)
    let image = maskLayer.contents as! CGImage
    let scale = Int(maskLayer.contentsScale)
    XCTAssertEqual(alpha(image, 5 * scale, 10 * scale), 255)
    XCTAssertEqual(alpha(image, 30 * scale, 10 * scale), 0, "outside the overflow clip")

    view.style.clipPath = ""
    XCTAssertTrue(view.layer.mask is CAShapeLayer, "the overflow clip is handed back")
  }

  func testMaskGrowsWithTheClipPath() throws {
    let view = makeView()
    view.style.clipPath = "inset(-10px)"
    let maskLayer = try XCTUnwrap(view.layer.mask as? MasonMaskLayer)
    XCTAssertEqual(maskLayer.frame, CGRect(x: -10, y: -10, width: 120, height: 120))

    view.style.clipPath = "inset(60% 0 60% 0)"
    XCTAssertEqual(maskLayer.frame.size, .zero, "nothing left to show")
  }

  func testPseudoClipPath() throws {
    let view = makeView()
    view.node.setPseudoString(PseudoState.hover.rawValue, "clip-path", "circle(10px)")
    XCTAssertNil(view.layer.mask, "not hovered yet")
    view.node.setPseudo(.hover, true, autoDirty: false)
    let maskLayer = try XCTUnwrap(view.layer.mask as? MasonMaskLayer)
    XCTAssertEqual(maskLayer.frame, CGRect(x: 40, y: 40, width: 20, height: 20))
    view.node.setPseudo(.hover, false, autoDirty: false)
    XCTAssertNil(view.layer.mask)
  }

  func testHitTestingFollowsTheClipPath() {
    let view = makeView()
    let child = makeView(100, 100)
    view.addSubview(child)
    view.style.clipPath = "circle(50%)"
    XCTAssertTrue(view.point(inside: CGPoint(x: 50, y: 50), with: nil))
    XCTAssertFalse(view.point(inside: CGPoint(x: 3, y: 3), with: nil))
    XCTAssertNil(view.hitTest(CGPoint(x: 3, y: 3), with: nil), "clipped out, children included")
    XCTAssertTrue(view.hitTest(CGPoint(x: 50, y: 50), with: nil) === child)

    XCTAssertNil(MasonElementHelpers.elementFromPoint(view, x: 3, y: 3))
    XCTAssertTrue(MasonElementHelpers.elementFromPoint(view, x: 50, y: 50) === child)

    view.style.clipPath = ""
    XCTAssertTrue(view.point(inside: CGPoint(x: 3, y: 3), with: nil))
  }
}
