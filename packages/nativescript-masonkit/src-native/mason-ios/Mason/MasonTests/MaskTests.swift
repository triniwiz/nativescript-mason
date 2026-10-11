//
//  MaskTests.swift
//  MasonTests
//
//  CSS masking: parsing of the mask-* longhands, the data URLs they carry, and the
//  composed mask image.
//

import XCTest
import UIKit
@testable import Mason

final class MaskTests: XCTestCase {

  // Bootstrap writes its icons unencoded, quotes and all.
  private let rawChevron = "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 16c-.3 0-.5-.1-.7-.3l-6-6a1 1 0 0 1 1.4-1.4l5.3 5.3 5.3-5.3a1 1 0 0 1 1.4 1.4l-6 6c-.2.2-.4.3-.7.3z'/></svg>\")"
  // Bootstrap 5's `.btn-close` icon, percent-encoded.
  private let encodedClose = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414'/%3e%3c/svg%3e\")"
  private let circle = "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><circle cx='5' cy='5' r='5'/></svg>\")"

  // MARK: - Layer lists

  func testLayerListWithCyclingLonghands() {
    let layers = Mask.parseLayers(image: "linear-gradient(black, transparent), none, url(a.png)",
                                  size: "10px 20px, contain", position: "center", repeat: "no-repeat, repeat-x")
    XCTAssertEqual(layers.count, 3)
    XCTAssertNotNil(layers[0].paint.gradient)
    XCTAssertTrue(layers[1].isNone)
    XCTAssertEqual(layers[2].paint.image, "a.png")

    XCTAssertEqual(layers[0].paint.size?.width?.px, 10 * CGFloat(NSCMason.scale))
    XCTAssertEqual(layers[1].paint.size?.keyword, "contain")
    XCTAssertEqual(layers[2].paint.size?.width?.px, 10 * CGFloat(NSCMason.scale), "the size list repeats")
    for layer in layers {
      XCTAssertEqual(layer.paint.position, BackgroundPosition(x: BackgroundOffset(fraction: 0.5), y: BackgroundOffset(fraction: 0.5)))
    }
    XCTAssertEqual(layers.map { $0.paint.repeatType }, [.noRepeat, .repeatX, .noRepeat])
  }

  func testInitialValues() {
    let layer = Mask.parseLayers(image: "linear-gradient(black, black)")[0]
    XCTAssertEqual(layer.mode, .matchSource)
    XCTAssertEqual(layer.composite, .add)
    XCTAssertEqual(layer.clip, .borderBox)
    XCTAssertEqual(layer.paint.origin, .borderBox, "mask-origin starts at border-box, unlike background-origin")
    XCTAssertEqual(layer.paint.repeatType, .repeatXY)
    XCTAssertNil(layer.paint.size)
    XCTAssertNil(layer.paint.position)
  }

  func testAllNoneIsNoMask() {
    let view = MasonUIView(mason: NSCMason.shared)
    let mask = Mask(style: view.style)
    defer { withExtendedLifetime(view) {} }
    mask.update(["none, none", "", "", "", "", "", "", ""])
    XCTAssertEqual(mask.layers.count, 2)
    XCTAssertFalse(mask.isActive)
    mask.update(["none, linear-gradient(black, black)", "", "", "", "", "", "", ""])
    XCTAssertTrue(mask.isActive)
    mask.update(["", "", "", "", "", "", "", ""])
    XCTAssertTrue(mask.layers.isEmpty)
    XCTAssertFalse(mask.isActive)
  }

  func testInvalidImageIsATransparentLayer() {
    let layers = Mask.parseLayers(image: "red, linear-gradient(black, black)")
    XCTAssertEqual(layers.count, 2)
    XCTAssertTrue(layers[0].isNone)
    XCTAssertNil(layers[0].paint.backgroundColor)
  }

  func testModeCompositeClipOriginKeywords() {
    let layers = Mask.parseLayers(image: "url(a.png), url(b.png), url(c.png), url(d.png)",
                                  origin: "content-box, padding-box, view-box, margin-box",
                                  clip: "padding-box, content-box, no-clip, fill-box",
                                  mode: "alpha, luminance, match-source, bogus",
                                  composite: "subtract, intersect, exclude, add")
    XCTAssertEqual(layers.map { $0.paint.origin }, [.contentBox, .paddingBox, .borderBox, .borderBox])
    XCTAssertEqual(layers.map { $0.clip }, [.paddingBox, .contentBox, .noClip, .borderBox])
    XCTAssertEqual(layers.map { $0.mode }, [.alpha, .luminance, .matchSource, .matchSource])
    XCTAssertEqual(layers.map { $0.composite }, [.subtract, .intersect, .exclude, .add])
    XCTAssertEqual(layers.map { $0.composite.blendMode }, [.sourceOut, .sourceIn, .xor, .normal])
  }

  func testNoClipIsNotAnOrigin() {
    XCTAssertNil(MaskBox.parse("no-clip", allowNoClip: false))
    XCTAssertEqual(MaskBox.parse("NO-CLIP", allowNoClip: true), .noClip)
    XCTAssertEqual(MaskBox.parse("stroke-box", allowNoClip: true), .borderBox)
    XCTAssertNil(MaskBox.parse("bogus", allowNoClip: true))
  }

  func testRepeatKeywords() {
    XCTAssertEqual(parseMaskRepeat("repeat"), .repeatXY)
    XCTAssertEqual(parseMaskRepeat("no-repeat"), .noRepeat)
    XCTAssertEqual(parseMaskRepeat("repeat-x"), .repeatX)
    XCTAssertEqual(parseMaskRepeat("repeat-y"), .repeatY)
    XCTAssertEqual(parseMaskRepeat("repeat no-repeat"), .repeatX)
    XCTAssertEqual(parseMaskRepeat("no-repeat round"), .repeatY)
    XCTAssertEqual(parseMaskRepeat("space"), .repeatXY)
    XCTAssertNil(parseMaskRepeat("bogus"))
  }

  // MARK: - Data URLs

  func testRawSvgDataUrl() throws {
    let url = try XCTUnwrap(parseImage(rawChevron))
    XCTAssertTrue(url.hasPrefix("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'"))
    XCTAssertTrue(url.hasSuffix("</svg>"))
    let doc = try XCTUnwrap(decodeSvgDataUrl(url))
    XCTAssertEqual(doc.width, 24)
    XCTAssertEqual(removeImageURL(from: rawChevron + " center"), "center")
  }

  func testPercentEncodedSvgDataUrl() throws {
    let url = try XCTUnwrap(parseImage(encodedClose))
    XCTAssertTrue(url.hasSuffix("%3c/svg%3e"))
    let doc = try XCTUnwrap(decodeSvgDataUrl(url))
    XCTAssertEqual(doc.width, 16)
  }

  /// Parentheses and commas inside a quoted SVG neither end the url() nor split the layer list.
  func testRawSvgWithParenthesesAndCommas() throws {
    let svg = "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><rect width='10' height='10' fill='rgb(0,0,0)' transform='rotate(45 5 5)'/></svg>\")"
    let layers = splitBackgroundLayers(svg + ", linear-gradient(black, transparent)")
    XCTAssertEqual(layers.count, 2)
    let url = try XCTUnwrap(parseImage(layers[0]))
    XCTAssertTrue(url.hasSuffix("</svg>"))
    XCTAssertNotNil(decodeSvgDataUrl(url))

    let unquoted = "url(data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><rect width='10' height='10' transform='rotate(45 5 5)'/></svg>)"
    XCTAssertTrue(try XCTUnwrap(parseImage(unquoted)).hasSuffix("</svg>"))

    let mask = Mask.parseLayers(image: svg + ", " + rawChevron)
    XCTAssertEqual(mask.count, 2)
    XCTAssertFalse(mask[0].isNone)
    XCTAssertFalse(mask[1].isNone)
  }

  func testPlainUrlsStillParse() {
    XCTAssertEqual(parseImage("url(a.png) no-repeat"), "a.png")
    XCTAssertEqual(parseImage("url('a.png')"), "a.png")
    XCTAssertEqual(parseImage("url( \"a b.png\" )"), "a b.png")
    XCTAssertNil(parseImage("linear-gradient(red, blue)"))
    XCTAssertEqual(parseBackgroundLayers("url(a.png), linear-gradient(red, blue)").count, 2)
  }

  // MARK: - Gradients

  func testRepeatingAndConicGradientsParse() throws {
    let repeating = try XCTUnwrap(parseGradient("repeating-linear-gradient(to right, black 0%, transparent 25%)"))
    XCTAssertEqual(repeating.type, "linear")
    XCTAssertTrue(repeating.repeating)
    XCTAssertEqual(repeating.direction, "to right")

    let conic = try XCTUnwrap(parseGradient("conic-gradient(from 90deg at 25% 75%, red 0deg, blue 0.5turn)"))
    XCTAssertEqual(conic.type, "conic")
    XCTAssertFalse(conic.repeating)
    XCTAssertEqual(conic.direction, "from 90deg at 25% 75%")
    XCTAssertEqual(conic.stops, ["red 0.0%", "blue 50.0%"])

    let layer = Mask.parseLayers(image: "repeating-radial-gradient(circle, black 0 5px, transparent 5px 10px)")[0]
    XCTAssertEqual(layer.paint.gradient?.type, "radial")
    XCTAssertEqual(layer.paint.gradient?.repeating, true)
    XCTAssertFalse(layer.isNone)
  }

  func testUnrollRepeatingStops() {
    let black = UIColor.black.cgColor
    let clear = UIColor.clear.cgColor
    let (colors, locations) = unrollRepeatingStops([black, clear], [0, 0.25])
    XCTAssertEqual(locations.first, 0)
    XCTAssertEqual(locations.last, 1)
    XCTAssertEqual(colors.count, locations.count)
    XCTAssertEqual(locations.filter { abs($0 - 0.25) < 1e-6 }.count, 2, "each period ends where the next begins")
    XCTAssertEqual(locations.filter { abs($0 - 0.5) < 1e-6 }.count, 2)
  }

  // MARK: - Rendering

  // A Mask holds its style unowned; keep the views alive for the test.
  private var views: [MasonUIView] = []

  override func tearDown() {
    views.removeAll()
    super.tearDown()
  }

  private func mask(_ image: String, size: String = "", position: String = "", repeat: String = "",
                    clip: String = "", mode: String = "", composite: String = "") -> Mask {
    let view = MasonUIView(mason: NSCMason.shared)
    views.append(view)
    let m = Mask(style: view.style)
    m.update([image, size, position, `repeat`, "", clip, mode, composite])
    return m
  }

  /// Alpha (0-255) of the pixel at (x, y), top-left origin.
  private func alpha(_ image: CGImage, _ x: Int, _ y: Int) -> UInt8 {
    let ctx = Mask.makeContext(image.width, image.height)!
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    let bytes = ctx.data!.bindMemory(to: UInt8.self, capacity: ctx.bytesPerRow * ctx.height)
    return bytes[y * ctx.bytesPerRow + x * 4 + 3]
  }

  private func render(_ m: Mask, _ w: CGFloat, _ h: CGFloat, clip: CGPath? = nil) throws -> CGImage {
    try XCTUnwrap(m.renderImage(boxSize: CGSize(width: w, height: h), maskRect: CGRect(x: 0, y: 0, width: w, height: h),
                                scale: 1, overflowClip: clip))
  }

  func testLinearGradientMask() throws {
    let image = try render(mask("linear-gradient(black, transparent)"), 10, 100)
    XCTAssertEqual(image.width, 10)
    XCTAssertEqual(image.height, 100)
    XCTAssertGreaterThan(alpha(image, 5, 1), 240)
    XCTAssertLessThan(alpha(image, 5, 98), 15)
    XCTAssertEqual(Double(alpha(image, 5, 50)), 128, accuracy: 12)
  }

  func testCenteredContainSvgCircle() throws {
    let image = try render(mask(circle, size: "contain", position: "center", repeat: "no-repeat"), 100, 50)
    XCTAssertEqual(alpha(image, 50, 25), 255)
    XCTAssertEqual(alpha(image, 30, 25), 255)
    XCTAssertEqual(alpha(image, 5, 25), 0, "contain leaves the sides empty")
    XCTAssertEqual(alpha(image, 95, 25), 0)
    XCTAssertEqual(alpha(image, 27, 3), 0, "outside the circle, inside its square")
  }

  func testRawSvgMaskRenders() throws {
    let image = try render(mask(rawChevron, size: "contain", repeat: "no-repeat"), 24, 24)
    // The chevron's point at (12, 15) is filled; the top corner is not.
    XCTAssertGreaterThan(alpha(image, 12, 14), 200)
    XCTAssertEqual(alpha(image, 1, 1), 0)
  }

  func testComposite() throws {
    // Top layer covers the box; the bottom one only its left half.
    let layers = "linear-gradient(black, black), linear-gradient(black, black)"
    let size = "100% 100%, 50% 100%"
    func render(_ composite: String) throws -> CGImage {
      try self.render(mask(layers, size: size, repeat: "no-repeat", composite: composite), 100, 10)
    }
    let add = try render("add")
    XCTAssertEqual(alpha(add, 10, 5), 255)
    XCTAssertEqual(alpha(add, 90, 5), 255)

    let subtract = try render("subtract")
    XCTAssertEqual(alpha(subtract, 10, 5), 0)
    XCTAssertEqual(alpha(subtract, 90, 5), 255)

    let intersect = try render("intersect")
    XCTAssertEqual(alpha(intersect, 10, 5), 255)
    XCTAssertEqual(alpha(intersect, 90, 5), 0)

    let exclude = try render("exclude")
    XCTAssertEqual(alpha(exclude, 10, 5), 0)
    XCTAssertEqual(alpha(exclude, 90, 5), 255)
  }

  func testNoneLayerUnderIntersectClearsTheMask() throws {
    let image = try render(mask("none, linear-gradient(black, black)", composite: "intersect"), 10, 10)
    XCTAssertEqual(alpha(image, 5, 5), 0)
    let added = try render(mask("none, linear-gradient(black, black)"), 10, 10)
    XCTAssertEqual(alpha(added, 5, 5), 255)
  }

  func testLuminanceMode() throws {
    let white = try render(mask("linear-gradient(white, white)", mode: "luminance"), 10, 10)
    XCTAssertEqual(alpha(white, 5, 5), 255)
    let black = try render(mask("linear-gradient(black, black)", mode: "luminance"), 10, 10)
    XCTAssertEqual(alpha(black, 5, 5), 0)
    let alphaMode = try render(mask("linear-gradient(black, black)", mode: "alpha"), 10, 10)
    XCTAssertEqual(alpha(alphaMode, 5, 5), 255)
    let halfWhite = try render(mask("linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5))", mode: "luminance"), 10, 10)
    XCTAssertEqual(Double(alpha(halfWhite, 5, 5)), 128, accuracy: 3)
  }

  func testOverflowClipIsFoldedIn() throws {
    let leftHalf = CGPath(rect: CGRect(x: 0, y: 0, width: 50, height: 10), transform: nil)
    let image = try render(mask("linear-gradient(black, black)"), 100, 10, clip: leftHalf)
    XCTAssertEqual(alpha(image, 10, 5), 255)
    XCTAssertEqual(alpha(image, 90, 5), 0)
  }

  func testConicMaskRenders() throws {
    // Opaque for the first half turn (top, clockwise to bottom: the right half), clear after.
    let image = try render(mask("conic-gradient(black 0 50%, transparent 50% 100%)"), 100, 100)
    XCTAssertEqual(alpha(image, 80, 50), 255)
    XCTAssertEqual(alpha(image, 20, 50), 0)
  }

  // MARK: - View hookup

  func testMaskLayerInstallsAndRestoresTheOverflowClip() throws {
    let view = MasonUIView(mason: NSCMason.shared)
    view.frame = CGRect(x: 0, y: 0, width: 40, height: 20)
    let clip = CAShapeLayer()
    clip.path = CGPath(rect: CGRect(x: 0, y: 0, width: 40, height: 20), transform: nil)
    clip.frame = view.bounds
    view.layer.mask = clip

    view.style.maskImage = "linear-gradient(black, transparent)"
    XCTAssertEqual(view.style.maskImage, "linear-gradient(black, transparent)")
    let maskLayer = try XCTUnwrap(view.layer.mask as? MasonMaskLayer)
    XCTAssertEqual(maskLayer.frame, view.bounds)
    XCTAssertNotNil(maskLayer.overflowClip, "the overflow clip moves into the mask")
    XCTAssertTrue(view.style.isMasked)
    maskLayer.display()
    XCTAssertNotNil(maskLayer.contents)

    view.style.maskImage = "none"
    XCTAssertFalse(view.style.isMasked)
    XCTAssertTrue(view.layer.mask is CAShapeLayer, "the overflow clip is handed back")

    view.layer.mask = nil
    view.style.maskImage = ""
    XCTAssertNil(view.layer.mask)
  }

  func testUnmaskedViewGetsNoMaskStorage() {
    let view = MasonUIView(mason: NSCMason.shared)
    view.frame = CGRect(x: 0, y: 0, width: 40, height: 20)
    view.style.maskSize = "contain"
    view.style.syncMask(view)
    XCTAssertNil(view.style.mMaskStorage)
    XCTAssertNil(view.layer.mask)
    XCTAssertEqual(view.style.maskSize, "contain")
  }

  func testMaskFollowsScrolling() throws {
    let view = MasonUIView(mason: NSCMason.shared)
    view.frame = CGRect(x: 0, y: 0, width: 40, height: 20)
    view.style.maskImage = "linear-gradient(black, black)"
    view.bounds.origin = CGPoint(x: 0, y: 30)
    view._updateScrollMask()
    let maskLayer = try XCTUnwrap(view.layer.mask as? MasonMaskLayer)
    XCTAssertEqual(maskLayer.frame.origin, CGPoint(x: 0, y: 30))
  }
}
