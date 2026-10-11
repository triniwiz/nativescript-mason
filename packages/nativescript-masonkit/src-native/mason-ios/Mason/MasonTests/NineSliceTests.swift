//
//  NineSliceTests.swift
//  MasonTests
//
//  The 9-slice painter behind `border-image` and `mask-border`: value parsing, the slice
//  geometry for each repeat mode, and pixels from both users.
//

import XCTest
import UIKit
@testable import Mason

final class NineSliceTests: XCTestCase {

  private let square = "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'><rect width='30' height='30'/></svg>\")"
  // A 30x30 frame: opaque 10-unit ring around a transparent middle.
  private let frame = "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'><path fill-rule='evenodd' d='M0 0H30V30H0Z M10 10H20V20H10Z'/></svg>\")"

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

  // MARK: - Parsing

  func testBorderImageShorthand() throws {
    let spec = try XCTUnwrap(NineSliceSpec.parseBorderImage("url(a.png) 30 fill / 10px / 2 round space"))
    XCTAssertEqual(spec.source, "url(a.png)")
    XCTAssertEqual(spec.slice, Array(repeating: .number(30), count: 4))
    XCTAssertTrue(spec.fill)
    XCTAssertEqual(spec.width, Array(repeating: .length(10), count: 4))
    XCTAssertEqual(spec.outset, Array(repeating: .number(2), count: 4))
    XCTAssertEqual(spec.repeatX, .round)
    XCTAssertEqual(spec.repeatY, .space)

    let gradient = try XCTUnwrap(NineSliceSpec.parseBorderImage("linear-gradient(rgba(255, 0, 0, 1), rgba(0, 0, 255, 1)) 10% 20"))
    XCTAssertEqual(gradient.source, "linear-gradient(rgba(255, 0, 0, 1), rgba(0, 0, 255, 1))")
    XCTAssertEqual(gradient.slice, [.percent(0.1), .number(20), .percent(0.1), .number(20)])
    XCTAssertFalse(gradient.fill)
    XCTAssertEqual(gradient.width, NineSliceSpec.borderImageInitial.width)
    XCTAssertEqual(gradient.repeatX, .stretch)

    // Any order; `/ /` skips the width.
    let reordered = try XCTUnwrap(NineSliceSpec.parseBorderImage("repeat fill 1 2 3 4 / / 5px url(x.png)"))
    XCTAssertEqual(reordered.slice, [.number(1), .number(2), .number(3), .number(4)])
    XCTAssertTrue(reordered.fill)
    XCTAssertEqual(reordered.width, NineSliceSpec.borderImageInitial.width)
    XCTAssertEqual(reordered.outset, Array(repeating: .length(5), count: 4))
    XCTAssertEqual(reordered.repeatX, .repeat)
    XCTAssertEqual(reordered.repeatY, .repeat)

    let widths = try XCTUnwrap(NineSliceSpec.parseBorderImage("url(a.png) 10/auto 2 10% 3px"))
    XCTAssertEqual(widths.width, [.auto, .number(2), .percent(0.1), .length(3)])

    // Initial values.
    let bare = try XCTUnwrap(NineSliceSpec.parseBorderImage("url(a.png)"))
    XCTAssertEqual(bare.slice, Array(repeating: .percent(1), count: 4))
    XCTAssertEqual(bare.outset, Array(repeating: .number(0), count: 4))

    XCTAssertEqual(NineSliceSpec.parseBorderImage("none")?.source, .some(nil), "none is valid and draws nothing")
    // Quoted SVG data with spaces survives tokenizing.
    XCTAssertEqual(NineSliceSpec.parseBorderImage("\(square) 10")?.source, square)
  }

  func testInvalidBorderImage() {
    for value in ["", "url(a) url(b)", "url(a) 30 /", "url(a) 30 / 1 /", "url(a) bogus", "url(a) -5",
                  "url(a) stretch round repeat", "url(a) 30 / -1", "url(a) 30 / 1 / 10%", "url(a) 1 2 3 4 5",
                  "red 10", "url(a) 10 fill fill", "/ 10px url(a)"] {
      XCTAssertNil(NineSliceSpec.parseBorderImage(value), value)
    }
  }

  func testMaskBorderLonghands() {
    let initial = NineSliceSpec.maskBorder(source: square, slice: "", width: "", outset: "", repeat: "")
    XCTAssertEqual(initial.source, square)
    XCTAssertEqual(initial.slice, Array(repeating: .number(0), count: 4))
    XCTAssertEqual(initial.width, Array(repeating: .auto, count: 4))
    XCTAssertEqual(initial.outset, Array(repeating: .number(0), count: 4))
    XCTAssertEqual(initial.repeatX, .stretch)

    let set = NineSliceSpec.maskBorder(source: "linear-gradient(black, black)", slice: "30 fill", width: "auto 10px 2 5%",
                                       outset: "1 2px", repeat: "round")
    XCTAssertEqual(set.slice, Array(repeating: .number(30), count: 4))
    XCTAssertTrue(set.fill)
    XCTAssertEqual(set.width, [.auto, .length(10), .number(2), .percent(0.05)])
    XCTAssertEqual(set.outset, [.number(1), .length(2), .number(1), .length(2)])
    XCTAssertEqual(set.repeatX, .round)
    XCTAssertEqual(set.repeatY, .round)

    let invalid = NineSliceSpec.maskBorder(source: square, slice: "x", width: "-1px", outset: "10%", repeat: "tile")
    XCTAssertEqual(invalid.slice, NineSliceSpec.maskBorderInitial.slice, "invalid longhands keep their initial value")
    XCTAssertEqual(invalid.width, NineSliceSpec.maskBorderInitial.width)
    XCTAssertEqual(invalid.outset, NineSliceSpec.maskBorderInitial.outset)

    XCTAssertNil(Mask.parseBorder(source: "none", slice: "", width: "", outset: "", repeat: "", mode: ""))
    XCTAssertNil(Mask.parseBorder(source: "red", slice: "", width: "", outset: "", repeat: "", mode: ""))
    XCTAssertEqual(Mask.parseBorder(source: square, slice: "", width: "", outset: "", repeat: "", mode: "luminance")?.luminance, true)
    XCTAssertEqual(Mask.parseBorder(source: square, slice: "", width: "", outset: "", repeat: "", mode: "alpha")?.luminance, false)
  }

  // MARK: - Geometry

  private func spans(_ tiles: [(CGFloat, CGFloat)]) -> [CGFloat] { tiles.map { ($0.0 * 100).rounded() / 100 } }

  func testAxisTiles() {
    XCTAssertEqual(spans(NineSlice.axisTiles(.stretch, start: 0, length: 100, tile: 30)), [0])
    XCTAssertEqual(NineSlice.axisTiles(.stretch, start: 0, length: 100, tile: 30).first?.1, 100)
    // Centred, partial tiles at both ends.
    XCTAssertEqual(spans(NineSlice.axisTiles(.repeat, start: 0, length: 100, tile: 30)), [-25, 5, 35, 65, 95])
    // A whole number of tiles, rescaled to fit.
    let round = NineSlice.axisTiles(.round, start: 0, length: 100, tile: 30)
    XCTAssertEqual(round.count, 3)
    XCTAssertEqual(round[1].0, 100.0 / 3, accuracy: 0.001)
    XCTAssertEqual(round[1].1, 100.0 / 3, accuracy: 0.001)
    XCTAssertEqual(NineSlice.axisTiles(.round, start: 0, length: 100, tile: 300).count, 1, "round never drops to zero tiles")
    // The leftover space spread evenly around the tiles.
    XCTAssertEqual(spans(NineSlice.axisTiles(.space, start: 0, length: 100, tile: 30)), [2.5, 35, 67.5])
    XCTAssertTrue(NineSlice.axisTiles(.space, start: 0, length: 100, tile: 120).isEmpty, "no whole tile fits")
    XCTAssertTrue(NineSlice.axisTiles(.repeat, start: 0, length: 0, tile: 10).isEmpty)
  }

  private func tiles(_ repeatX: NineSliceRepeat = .stretch, _ repeatY: NineSliceRepeat = .stretch, fill: Bool = false) -> [NineSlice.Tile] {
    NineSlice.tiles(units: CGSize(width: 30, height: 30), slices: UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10),
                    area: CGRect(x: 0, y: 0, width: 100, height: 100), widths: UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10),
                    repeatX: repeatX, repeatY: repeatY, fill: fill)
  }

  func testStretchedRegions() {
    let noFill = tiles()
    XCTAssertEqual(noFill.count, 8, "four corners and four edges")
    XCTAssertTrue(noFill.contains(NineSlice.Tile(src: CGRect(x: 0, y: 0, width: 10, height: 10), dst: CGRect(x: 0, y: 0, width: 10, height: 10),
                                                 clip: CGRect(x: 0, y: 0, width: 10, height: 10))))
    XCTAssertTrue(noFill.contains(NineSlice.Tile(src: CGRect(x: 20, y: 20, width: 10, height: 10), dst: CGRect(x: 90, y: 90, width: 10, height: 10),
                                                 clip: CGRect(x: 90, y: 90, width: 10, height: 10))))
    XCTAssertTrue(noFill.contains(NineSlice.Tile(src: CGRect(x: 10, y: 0, width: 10, height: 10), dst: CGRect(x: 10, y: 0, width: 80, height: 10),
                                                 clip: CGRect(x: 10, y: 0, width: 80, height: 10))), "top edge stretched")
    XCTAssertTrue(noFill.contains(NineSlice.Tile(src: CGRect(x: 0, y: 10, width: 10, height: 10), dst: CGRect(x: 0, y: 10, width: 10, height: 80),
                                                 clip: CGRect(x: 0, y: 10, width: 10, height: 80))), "left edge stretched")
    XCTAssertFalse(noFill.contains { $0.src == CGRect(x: 10, y: 10, width: 10, height: 10) }, "no middle without fill")

    let filled = tiles(fill: true)
    XCTAssertEqual(filled.count, 9)
    XCTAssertTrue(filled.contains(NineSlice.Tile(src: CGRect(x: 10, y: 10, width: 10, height: 10), dst: CGRect(x: 10, y: 10, width: 80, height: 80),
                                                 clip: CGRect(x: 10, y: 10, width: 80, height: 80))))
  }

  func testRepeatRoundSpaceRegions() {
    // Top edge tiles are 10 wide (the slice scaled to the 10pt border), centred in the 80pt edge.
    let repeated = tiles(.repeat, .stretch).filter { $0.src == CGRect(x: 10, y: 0, width: 10, height: 10) }
    XCTAssertEqual(repeated.map { $0.dst.minX }, [5, 15, 25, 35, 45, 55, 65, 75, 85])
    XCTAssertTrue(repeated.allSatisfy { $0.clip == CGRect(x: 10, y: 0, width: 80, height: 10) })

    let rounded = tiles(.round, .round).filter { $0.src == CGRect(x: 0, y: 10, width: 10, height: 10) }
    XCTAssertEqual(rounded.count, 8, "the left edge holds eight 10pt tiles")
    XCTAssertEqual(rounded.first?.dst, CGRect(x: 0, y: 10, width: 10, height: 10))

    let spaced = NineSlice.tiles(units: CGSize(width: 30, height: 30), slices: UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10),
                                 area: CGRect(x: 0, y: 0, width: 105, height: 100), widths: UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10),
                                 repeatX: .space, repeatY: .stretch, fill: true)
    let top = spaced.filter { $0.src == CGRect(x: 10, y: 0, width: 10, height: 10) }
    XCTAssertEqual(top.count, 8)
    XCTAssertEqual(top.first?.dst.minX ?? 0, 10 + 5.0 / 9, accuracy: 0.001)
    // The middle is tiled across like the top edge and stretched down like the left one.
    let middle = spaced.filter { $0.src == CGRect(x: 10, y: 10, width: 10, height: 10) }
    XCTAssertEqual(middle.count, 8)
    XCTAssertEqual(middle.first?.dst.height, 80)
  }

  func testResolve() {
    let area = CGRect(x: 0, y: 0, width: 100, height: 100)
    var spec = NineSliceSpec.borderImageInitial
    spec.slice = [.percent(0.5), .number(40), .number(5), .number(5)]
    spec.width = [.length(60), .number(2), .length(60), .auto]
    let borders = UIEdgeInsets(top: 3, left: 4, bottom: 3, right: 4)
    let (slices, widths) = NineSlice.resolve(spec, area: area, borders: borders, units: CGSize(width: 30, height: 30), pointsPerUnit: 2)
    XCTAssertEqual(slices, UIEdgeInsets(top: 15, left: 5, bottom: 5, right: 30), "percentages of the image; slices clamp to it")
    // Top + bottom (120) overflow the 100pt area: everything scales by 100/120.
    let f: CGFloat = 100.0 / 120.0
    XCTAssertEqual(widths.top, 60 * f, accuracy: 0.001)
    XCTAssertEqual(widths.right, 8 * f, accuracy: 0.001, "a number multiplies the border width")
    XCTAssertEqual(widths.left, 10 * f, accuracy: 0.001, "auto is the slice at its intrinsic size")

    // Without intrinsic size `auto` falls back to the border width.
    let (_, gradientWidths) = NineSlice.resolve(spec, area: area, borders: borders, units: CGSize(width: 100, height: 100), pointsPerUnit: nil)
    XCTAssertEqual(gradientWidths.left, 4 * f, accuracy: 0.001)

    var outset = NineSliceSpec.borderImageInitial
    outset.outset = [.number(1), .length(5), .number(0), .length(2)]
    XCTAssertEqual(outset.area(box: area, borders: UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10)),
                   CGRect(x: -2, y: -10, width: 107, height: 110))
  }

  // MARK: - mask-border pixels

  private func alpha(_ image: CGImage, _ x: Int, _ y: Int) -> UInt8 {
    pixel(image, x, y)[3]
  }

  private func pixel(_ image: CGImage, _ x: Int, _ y: Int) -> [UInt8] {
    let ctx = Mask.makeContext(image.width, image.height)!
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    let bytes = ctx.data!.bindMemory(to: UInt8.self, capacity: ctx.bytesPerRow * ctx.height)
    let p = y * ctx.bytesPerRow + x * 4
    return [bytes[p], bytes[p + 1], bytes[p + 2], bytes[p + 3]]
  }

  private func maskBorder(_ source: String, slice: String = "10", width: String = "10px", outset: String = "", mode: String = "",
                          image: String = "", size: String = "", repeat: String = "", maskRect: CGRect? = nil) throws -> CGImage {
    let mask = Mask(style: makeView().style)
    mask.update([image, size, "", `repeat`, "", "", "", "", "", source, slice, width, outset, "", mode])
    XCTAssertNotNil(mask.border)
    XCTAssertTrue(mask.isActive)
    return try XCTUnwrap(mask.renderImage(boxSize: CGSize(width: 100, height: 100), maskRect: maskRect ?? CGRect(x: 0, y: 0, width: 100, height: 100),
                                          scale: 1, borders: UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10)))
  }

  func testMaskBorderWithoutFillHidesTheMiddle() throws {
    let image = try maskBorder(square)
    XCTAssertEqual(alpha(image, 5, 5), 255, "corner")
    XCTAssertEqual(alpha(image, 50, 5), 255, "top edge")
    XCTAssertEqual(alpha(image, 95, 50), 255, "right edge")
    XCTAssertEqual(alpha(image, 50, 50), 0, "no fill: the middle is transparent")
    XCTAssertEqual(alpha(image, 15, 50), 0)
  }

  func testMaskBorderWithFill() throws {
    let image = try maskBorder(square, slice: "10 fill")
    XCTAssertEqual(alpha(image, 50, 50), 255)
    XCTAssertEqual(alpha(image, 5, 95), 255)

    // The middle comes from the source's middle, which is a hole here.
    let framed = try maskBorder(frame, slice: "10 fill")
    XCTAssertEqual(alpha(framed, 50, 50), 0)
    XCTAssertEqual(alpha(framed, 50, 5), 255)
  }

  func testMaskBorderAutoWidthAndOutset() throws {
    // `auto` widths are the 10-unit slices at the SVG's intrinsic size (1px per unit).
    let auto = try maskBorder(square, width: "")
    XCTAssertEqual(alpha(auto, 5, 50), 255)
    XCTAssertEqual(alpha(auto, 15, 50), 0)

    // Outset by 5px: the mask image covers the outset area too.
    let outset = try maskBorder(square, outset: "5px", maskRect: CGRect(x: -5, y: -5, width: 110, height: 110))
    XCTAssertEqual(alpha(outset, 2, 55), 255, "left of the box")
    XCTAssertEqual(alpha(outset, 55, 55), 0)
  }

  func testMaskBorderLuminanceAndMaskImage() throws {
    // A black source is clear under luminance.
    let luminance = try maskBorder(square, slice: "10 fill", mode: "luminance")
    XCTAssertEqual(alpha(luminance, 50, 50), 0)

    // Multiplied with mask-image: the gradient covers only the left half.
    let both = try maskBorder(square, slice: "10 fill", image: "linear-gradient(black, black)", size: "50% 100%", repeat: "no-repeat")
    XCTAssertEqual(alpha(both, 25, 50), 255)
    XCTAssertEqual(alpha(both, 75, 50), 0)
    XCTAssertEqual(alpha(both, 75, 5), 0)
  }

  func testMaskBorderOnAView() throws {
    let view = makeView()
    view.style.maskBorderSource = square
    view.style.maskBorderSlice = "10 fill"
    XCTAssertEqual(view.style.maskBorderSource, square)
    XCTAssertEqual(view.style.maskBorderSlice, "10 fill")
    view.style.maskBorderWidth = "10px"
    view.style.maskBorderOutset = "4px"
    view.style.maskBorderRepeat = "round"
    view.style.maskBorderMode = "alpha"
    XCTAssertEqual(view.style.maskBorderOutset, "4px")
    let maskLayer = try XCTUnwrap(view.layer.mask as? MasonMaskLayer)
    XCTAssertEqual(maskLayer.frame, CGRect(x: -4, y: -4, width: 108, height: 108), "the mask covers the outset area")
    XCTAssertTrue(view.style.isMasked)
    maskLayer.display()
    XCTAssertNotNil(maskLayer.contents)

    view.style.maskBorderSource = "none"
    XCTAssertNil(view.layer.mask)
  }

  /// Pixels (x, y) whose alpha is below 255.
  private func translucentPixels(_ image: CGImage) -> [(Int, Int)] {
    let ctx = Mask.makeContext(image.width, image.height)!
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    let bytes = ctx.data!.bindMemory(to: UInt8.self, capacity: ctx.bytesPerRow * ctx.height)
    var out: [(Int, Int)] = []
    for y in 0..<image.height {
      for x in 0..<image.width where bytes[y * ctx.bytesPerRow + x * 4 + 3] != 255 { out.append((x, y)) }
    }
    return out
  }

  func testTiledMaskBorderHasNoSeams() throws {
    // Tile and region edges fall between device pixels; no seam may show where tiles meet.
    let size = CGSize(width: 103, height: 47)
    for scale: CGFloat in [2, 3] {
      for repeatMode in ["round", "repeat", "round repeat", "repeat round", "stretch round"] {
        let mask = Mask(style: makeView(size.width, size.height).style)
        mask.update(["", "", "", "", "", "", "", "", "", square, "7 fill", "9.3px", "", repeatMode, ""])
        let image = try XCTUnwrap(mask.renderImage(boxSize: size, maskRect: CGRect(origin: .zero, size: size), scale: scale,
                                                   borders: UIEdgeInsets(top: 9, left: 9, bottom: 9, right: 9)))
        XCTAssertEqual(image.width, Int(size.width * scale))
        let gaps = translucentPixels(image)
        XCTAssertTrue(gaps.isEmpty, "\(repeatMode) @\(scale)x: \(gaps.count) seam pixels, first \(gaps.prefix(5))")
      }
    }
  }

  func testTiledBorderImageHasNoSeams() throws {
    let view = makeView(103, 47)
    view.style.borderImage = "\(square) 7 fill / 9.3px round repeat"
    for scale: CGFloat in [2, 3] {
      let pw = Int(103 * scale), ph = Int(47 * scale)
      let ctx = try XCTUnwrap(Mask.makeContext(pw, ph))
      ctx.translateBy(x: 0, y: CGFloat(ph))
      ctx.scaleBy(x: scale, y: -scale)
      XCTAssertTrue(view.style.drawBorderImage(in: ctx, rect: CGRect(x: 0, y: 0, width: 103, height: 47)))
      let gaps = translucentPixels(try XCTUnwrap(ctx.makeImage()))
      XCTAssertTrue(gaps.isEmpty, "@\(scale)x: \(gaps.count) seam pixels, first \(gaps.prefix(5))")
    }
  }

  // MARK: - border-image pixels

  func testGradientBorderImage() throws {
    let view = makeView()
    view.style.borderImage = "linear-gradient(rgba(255, 0, 0, 1), rgba(0, 0, 255, 1)) 20 / 10px"
    XCTAssertTrue(view.style.hasBorderImage)
    let ctx = try XCTUnwrap(Mask.makeContext(100, 100))
    ctx.translateBy(x: 0, y: 100)
    ctx.scaleBy(x: 1, y: -1)
    XCTAssertTrue(view.style.drawBorderImage(in: ctx, rect: CGRect(x: 0, y: 0, width: 100, height: 100)))
    let image = try XCTUnwrap(ctx.makeImage())

    let top = pixel(image, 50, 5)
    XCTAssertEqual(top[3], 255)
    XCTAssertGreaterThan(top[0], top[2], "the top slice is the red end")
    let bottom = pixel(image, 50, 95)
    XCTAssertGreaterThan(bottom[2], bottom[0], "the bottom slice is the blue end")
    XCTAssertEqual(alpha(image, 50, 50), 0, "no fill")
    XCTAssertEqual(alpha(image, 5, 50), 255, "left edge")

    view.style.borderImage = "linear-gradient(rgba(255, 0, 0, 1), rgba(0, 0, 255, 1)) 20 fill / 10px"
    ctx.clear(CGRect(x: 0, y: 0, width: 100, height: 100))
    XCTAssertTrue(view.style.drawBorderImage(in: ctx, rect: CGRect(x: 0, y: 0, width: 100, height: 100)))
    let filled = try XCTUnwrap(ctx.makeImage())
    let middle = pixel(filled, 50, 50)
    XCTAssertEqual(middle[3], 255, "fill paints the middle")
    XCTAssertGreaterThan(middle[0], 60)
    XCTAssertGreaterThan(middle[2], 60)
  }

  func testBorderImageReplacesTheBorderOnlyWhenDrawable() throws {
    let view = makeView()
    XCTAssertFalse(view.style.hasBorderImage)
    let ctx = try XCTUnwrap(Mask.makeContext(10, 10))
    XCTAssertFalse(view.style.drawBorderImage(in: ctx, rect: CGRect(x: 0, y: 0, width: 10, height: 10)))
    XCTAssertNil(view.style.mBorderImageStorage, "nothing is allocated without a border image")

    view.style.borderImage = "none"
    XCTAssertFalse(view.style.drawBorderImage(in: ctx, rect: CGRect(x: 0, y: 0, width: 10, height: 10)))
    view.style.borderImage = "url(a.png) bogus"
    XCTAssertFalse(view.style.drawBorderImage(in: ctx, rect: CGRect(x: 0, y: 0, width: 10, height: 10)), "invalid: the border draws")
    view.style.borderImage = "\(square) 10 / 2px"
    XCTAssertTrue(view.style.drawBorderImage(in: ctx, rect: CGRect(x: 0, y: 0, width: 10, height: 10)))
    XCTAssertEqual(view.style.borderImage, "\(square) 10 / 2px")
  }
}
