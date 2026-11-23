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
  func testBackgroundShorthandBridgeAndPaintShareGrammar() {
    let css = "url(é.svg) center / contain local content-box text, linear-gradient(red, blue) #fff"
    XCTAssertEqual(NSCMason.expandCssShorthand("background", value: css),
                   ["#fff", "url(é.svg), linear-gradient(red, blue)", "", "center, 0% 0%", "contain, auto",
                    "text, border-box", "content-box, padding-box", "local, scroll"])
    let layers = parseBackgroundLayers(css)
    XCTAssertEqual(layers.count, 2)
    XCTAssertEqual(layers.first?.image, "é.svg")
    XCTAssertEqual(layers.first?.clip, .text)
    XCTAssertEqual(layers.first?.attachment, .local)
    XCTAssertEqual(layers.last?.gradient?.type, "linear")
    XCTAssertEqual(layers.last?.backgroundColor, UIColor.colorFromARGB(0xffffffff))
    XCTAssertNil(NSCMason.expandCssShorthand("background", value: "url(a.svg),"))
  }

  func testShorthandBridgeAndHtmlFollowTheSameLonghands() throws {
    let css = "url(a.svg) center / contain padding xor"
    XCTAssertEqual(NSCMason.expandCssShorthand("-webkit-mask", value: css),
                   ["url(a.svg)", "contain", "center", "repeat", "padding-box", "padding-box", "match-source", "exclude"])
    XCTAssertNil(NSCMason.expandCssShorthand("mask", value: "url(a.svg),"))
    let roots = HTMLParser(mason: NSCMason.shared)
      .parse("<div style='-webkit-mask: \(css); mask-border: url(b.svg) 25% / / 4px'></div>")
    let node = try XCTUnwrap(roots.first)
    XCTAssertEqual(node.style.maskSize, "contain")
    XCTAssertEqual(node.style.maskPosition, "center")
    XCTAssertEqual(node.style.maskComposite, "exclude")
    XCTAssertEqual(node.style.maskBorderSource, "url(b.svg)")
    XCTAssertEqual(node.style.maskBorderWidth, "auto")
    XCTAssertEqual(node.style.maskBorderOutset, "4px")
  }

  func testAnimationEndpointAndMaskAliasBridge() throws {
    XCTAssertEqual(NSCMason.expandCssShorthand("animation-position-list", value: "top right, 10.0000001PX"),
                   ["2", "number", "100", "%", "number", "0", "%", "2", "number", "10.0000001", "px", "number", "50", "%"])
    XCTAssertEqual(NSCMason.expandCssShorthand("animation-size-list", value: "10px, contain"),
                   ["2", "number", "10", "px", "keyword", "auto", "", "1", "keyword", "contain", ""])
    XCTAssertNil(NSCMason.expandCssShorthand("animation-position-list", value: "right 10px bottom 5px"))
    XCTAssertEqual(NSCMason.expandCssShorthand("webkit-mask-composite-list", value: "source-out, XOR, copy"),
                   ["subtract, exclude, add"])
    XCTAssertEqual(NSCMason.expandCssShorthand("webkit-mask-box-list", value: "padding, content-box"),
                   ["padding-box, content-box"])
  }


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

  func testMaskLayerSetterStoresTheRustLayers() {
    let mason = NSCMason()
    let view = MasonUIView(mason: mason)
    let sibling = MasonUIView(mason: mason)
    view.style.maskRepeat = "no-repeat"
    view.style.maskImage = "none, linear-gradient(black, transparent)"
    XCTAssertEqual(view.style.getUInt32(StyleKeys.MASK_REVISION), 1)
    XCTAssertEqual(sibling.style.getUInt32(StyleKeys.MASK_REVISION), 0)
    view.style.maskImage = "none"
    XCTAssertEqual(view.style.getUInt32(StyleKeys.MASK_REVISION), 2)
  }

  func testMaskBatchInstallsFinalLayersAndClipOnce() {
    let mason = NSCMason()
    let view = MasonUIView(mason: mason)
    let style = view.style
    style.applyMaskBatch("""
      ["0", "linear-gradient(black, transparent)", "0", "linear-gradient(red, blue)",
       "1", "min(25%, 20px) auto", "3", "no-repeat", "10", "4px", "14", "inset(1px)"]
      """)
    XCTAssertEqual(style.maskImage, "linear-gradient(red, blue)")
    XCTAssertEqual(style.maskSize, "min(25%, 20px) auto")
    let width = style.mMaskStorage?.layers.first?.paint.size?.width
    XCTAssertEqual(width?.resolve(area: 40, drawSize: 0), 10)
    XCTAssertEqual(width?.resolve(area: 120, drawSize: 0), 20)
    XCTAssertEqual(style.maskRepeat, "no-repeat")
    XCTAssertEqual(style.maskBorderWidth, "4px")
    XCTAssertEqual(style.clipPath, "inset(1px)")
    XCTAssertEqual(style.getUInt32(StyleKeys.MASK_REVISION), 1)
    XCTAssertEqual(style.getUInt32(StyleKeys.CLIP_PATH_REVISION), 1)

    style.applyMaskBatch(#"["0", ""]"#)
    XCTAssertEqual(style.maskImage, "")
    XCTAssertEqual(style.maskRepeat, "no-repeat")
    XCTAssertEqual(style.getUInt32(StyleKeys.MASK_REVISION), 2)
    XCTAssertEqual(style.getUInt32(StyleKeys.CLIP_PATH_REVISION), 1)
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
    XCTAssertEqual(MaskMode.parse("/**/LUMINANCE"), .luminance)
    XCTAssertEqual(MaskComposite.parse("exclude/**/"), .exclude)
    XCTAssertNil(MaskComposite.parse("xor"))
  }

  func testRepeatKeywords() {
    XCTAssertEqual(parseMaskRepeat("repeat"), .repeatXY)
    XCTAssertEqual(parseMaskRepeat("no-repeat"), .noRepeat)
    XCTAssertEqual(parseMaskRepeat("repeat-x"), .repeatX)
    XCTAssertEqual(parseMaskRepeat("repeat-y"), .repeatY)
    XCTAssertEqual(parseMaskRepeat("repeat no-repeat"), .repeatX)
    XCTAssertEqual(parseMaskRepeat("no-repeat round"), BackgroundRepeat(x: .noRepeat, y: .round))
    XCTAssertEqual(parseMaskRepeat("space"), BackgroundRepeat(x: .space, y: .space))
    XCTAssertEqual(parseMaskRepeat("round space"), BackgroundRepeat(x: .round, y: .space))
    XCTAssertNil(parseMaskRepeat("bogus"))
    XCTAssertNil(parseMaskRepeat("repeat-x repeat"))
  }

  func testRustBackgroundShorthandLayers() {
    let url = "data:image/svg+xml,<svg a='url(#a,b)'/>"
    let css = "url(\"\(url)\") right 10px bottom 25% / cover fixed content-box text, linear-gradient(red, blue) repeat-x currentColor"
    let layers = parseBackgroundLayers(css, currentColor: 0xff123456)
    XCTAssertEqual(layers.count, 2)
    guard layers.count == 2 else { return }
    XCTAssertEqual(layers[0].image, url)
    XCTAssertEqual(layers[0].position?.x.fraction, 1)
    XCTAssertEqual(layers[0].position?.x.points, -10)
    XCTAssertEqual(layers[0].position?.y.fraction, 0.75)
    XCTAssertEqual(layers[0].size?.keyword, "cover")
    XCTAssertEqual(layers[0].attachment, .fixed)
    XCTAssertEqual(layers[0].origin, .contentBox)
    XCTAssertEqual(layers[0].clip, .text)
    XCTAssertEqual(layers[1].gradient?.stopCount, 2)
    XCTAssertEqual(layers[1].repeatType, .repeatX)
    XCTAssertEqual(layers[1].backgroundColor?.toUInt32(), 0xff123456)
  }

  func testBackgroundRepeatShorthandAndSerialization() {
    XCTAssertEqual(parseLayer("url(a.png) space round").repeatType, BackgroundRepeat(x: .space, y: .round))
    XCTAssertEqual(parseLayer("url(a.png) repeat no-repeat").repeatType, .repeatX)
    XCTAssertEqual(parseLayer("url(a.png) round").repeatType, BackgroundRepeat(x: .round, y: .round))
    XCTAssertEqual(BackgroundRepeat.repeatX.rawValue, "repeat-x")
    XCTAssertEqual(BackgroundRepeat(x: .space, y: .space).rawValue, "space")
    XCTAssertEqual(BackgroundRepeat(x: .round, y: .space).rawValue, "round space")
  }

  func testBackgroundLonghandsFollowReplacementImages() {
    let view = MasonUIView(mason: NSCMason.shared)
    let style = view.style
    let sibling = NSCMason.shared.createNode()
    style.backgroundSize = "contain, 50% auto"
    style.backgroundRepeat = "space round, no-repeat"
    style.backgroundPositionX = "right 10px"
    style.backgroundImage = "url(a.png), url(b.png), url(c.png)"
    XCTAssertEqual(style.getUInt32(StyleKeys.BACKGROUND_REVISION), 1)
    let layers = style.mBackground.layers
    XCTAssertEqual(layers.map { $0.size?.keyword }, ["contain", nil, "contain"])
    XCTAssertEqual(layers[1].size?.width?.fraction, 0.5)
    XCTAssertEqual(layers.map { $0.repeatType.rawValue }, ["space round", "no-repeat", "space round"])
    XCTAssertEqual(layers[2].position?.x.points, -10)

    style.backgroundRepeat = "repeat, invalid"
    XCTAssertEqual(layers[0].repeatType.rawValue, "space round")
    XCTAssertEqual(style.getUInt32(StyleKeys.BACKGROUND_REVISION), 1)
    style.backgroundPosition = "left bottom"
    style.backgroundClip = "text, padding-box"
    style.backgroundImage = "url(d.png), url(e.png)"
    let replaced = style.mBackground.layers
    XCTAssertEqual(replaced[0].position?.x.fraction, 0)
    XCTAssertEqual(replaced[0].position?.y.fraction, 1)
    XCTAssertEqual(replaced.map(\.clip), [.text, .paddingBox])
    XCTAssertEqual(replaced[1].repeatType, .noRepeat)
    XCTAssertEqual(style.getUInt32(StyleKeys.BACKGROUND_REVISION), 4)
    style.background = ""
    XCTAssertEqual(style.getUInt32(StyleKeys.BACKGROUND_REVISION), 5)
    XCTAssertEqual(sibling.style.getUInt32(StyleKeys.BACKGROUND_REVISION), 0)

    let mask = Mask.parseLayers(image: "url(a.png), url(b.png), url(c.png)", repeat: "round, invalid")
    XCTAssertEqual(mask.map { $0.paint.repeatType.rawValue }, ["round", "repeat", "round"])
  }

  func testBackgroundReplayResetsLonghandsAndPublishesOnce() {
    let view = MasonUIView(mason: NSCMason.shared)
    let style = view.style
    style.backgroundRepeat = "no-repeat"
    style.background = "url(initial.png) red"
    let revision = style.getUInt32(StyleKeys.BACKGROUND_REVISION)
    style.applyBackgroundBatch("""
      ["background","","0","background-image","url(replacement.png)","0","background-size","cover",""]
      """)
    XCTAssertEqual(style.getUInt32(StyleKeys.BACKGROUND_REVISION), revision + 1)
    XCTAssertEqual(style.background, "")
    XCTAssertEqual(style.backgroundColor, 0)
    XCTAssertEqual(style.backgroundRepeat, "repeat")
    XCTAssertEqual(style.backgroundSize, "cover")
    XCTAssertEqual(style.mBackground.layers.first?.image, "replacement.png")
  }

  func testSpaceTileStarts() {
    // Three 30pt tiles in 100pt: 5pt gaps, the outer tiles touch the edges, position ignored.
    XCTAssertEqual(backgroundTileStarts(.space, areaStart: 0, areaLength: 100, clipStart: 0, clipEnd: 100, tile: 30, offset: 12), [0, 35, 70])
    // Fewer than two fit: one tile, at the position.
    XCTAssertEqual(backgroundTileStarts(.space, areaStart: 0, areaLength: 50, clipStart: 0, clipEnd: 50, tile: 30, offset: 10), [10])
    // A painting area past the positioning area keeps the spaced pattern going.
    XCTAssertEqual(backgroundTileStarts(.space, areaStart: 10, areaLength: 100, clipStart: 0, clipEnd: 120, tile: 30, offset: 0), [-25, 10, 45, 80, 115])
    XCTAssertEqual(backgroundTileStarts(.repeat, areaStart: 0, areaLength: 100, clipStart: 0, clipEnd: 100, tile: 30, offset: 10), [-20, 10, 40, 70])
  }

  func testRoundTileSize() {
    let layer = parseLayer("url(a.png) round no-repeat")
    let area = CGRect(x: 0, y: 0, width: 100, height: 40)
    // round(100 / 30) = 3 tiles of 33.3; the auto height keeps the 3:1 ratio.
    let (w, h) = roundedTileSize(layer, area: area, (30, 10))
    XCTAssertEqual(w, 100.0 / 3, accuracy: 1e-6)
    XCTAssertEqual(h, 100.0 / 9, accuracy: 1e-6)
    let both = parseLayer("url(a.png) round")
    let (bw, bh) = roundedTileSize(both, area: area, (30, 25))
    XCTAssertEqual(bw, 100.0 / 3, accuracy: 1e-6)
    XCTAssertEqual(bh, 20, accuracy: 1e-6, "round(40 / 25) = 2 tiles")
  }

  func testSpaceAndRoundMasksRender() throws {
    let halves = "linear-gradient(to right, black 50%, transparent 50%)"
    let space = try render(mask(halves, size: "30px 10px", repeat: "space no-repeat"), 100, 10)
    XCTAssertGreaterThan(alpha(space, 5, 5), 200)
    XCTAssertEqual(alpha(space, 32, 5), 0, "gap between spaced tiles")
    XCTAssertGreaterThan(alpha(space, 37, 5), 200)
    XCTAssertGreaterThan(alpha(space, 72, 5), 200)
    let round = try render(mask(halves, size: "30px 10px", repeat: "round no-repeat"), 100, 10)
    XCTAssertEqual(alpha(round, 31, 5), 0, "33.3pt tiles: transparent half")
    XCTAssertGreaterThan(alpha(round, 48, 5), 200)
    let tiled = try render(mask(halves, size: "30px 10px", repeat: "repeat no-repeat"), 100, 10)
    XCTAssertGreaterThan(alpha(tiled, 32, 5), 200)
    XCTAssertEqual(alpha(tiled, 48, 5), 0)
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

  func testRustBackgroundMathUsesThePositioningAreaAndTheTile() throws {
    let view = MasonUIView(mason: NSCMason.shared)
    view.style.background = "url(tiles.png) right min(10%, 2em) bottom calc(10% + 2px) / clamp(10px, 50%, 4em) auto"
    let layer = try XCTUnwrap(view.style.mBackground.layers.first)
    let x = try XCTUnwrap(layer.position?.x)
    let units = Gradient.Units(fontSize: 20)
    let first = resolveBitmapSize(layer.size, imgW: 40, imgH: 20, areaW: 120, areaH: 60, units: units)
    let second = resolveBitmapSize(layer.size, imgW: 40, imgH: 20, areaW: 200, areaH: 60, units: units)
    XCTAssertEqual(first.0, 60, accuracy: 0.0001)
    XCTAssertEqual(first.1, 30, accuracy: 0.0001)
    XCTAssertEqual(second.0, 80, accuracy: 0.0001)
    XCTAssertEqual(x.resolve(area: 120, drawSize: first.0, units: units), 54, accuracy: 0.0001)
    XCTAssertEqual(x.resolve(area: 200, drawSize: second.0, units: units), 108, accuracy: 0.0001)
    XCTAssertEqual(x.cssValue(), "right min(10%, 2em)")
    view.style.background = "none"
    XCTAssertEqual(x.resolve(area: 120, drawSize: 60, units: units), 54, accuracy: 0.0001)
  }

  func testGradientMathReprojectsAtDrawTime() throws {
    let view = MasonUIView(mason: NSCMason.shared)
    view.style.backgroundImage = "linear-gradient(calc(.25turn), red calc(50% - 1em), blue)"
    let gradient = try XCTUnwrap(view.style.mBackground.layers.first?.gradient)
    let units = Gradient.Units(fontSize: 10)
    XCTAssertEqual(gradient.layout(width: 100, height: 40, units: units).angle, 90)
    XCTAssertEqual(gradient.resolvedStops(lineLength: 100, units: units)[0].position, 0.4, accuracy: 0.0001)
    XCTAssertEqual(gradient.resolvedStops(lineLength: 200, units: units)[0].position, 0.45, accuracy: 0.0001)
    XCTAssertEqual(gradient.resolvedStops(lineLength: 100, units: Gradient.Units(fontSize: 20))[0].position, 0.3, accuracy: 0.0001)
  }

  func testRepeatingAndConicGradientsParse() throws {
    let repeating = try XCTUnwrap(parseGradient("repeating-linear-gradient(to right, black 0%, transparent 25%)"))
    XCTAssertEqual(repeating.type, "linear")
    XCTAssertTrue(repeating.repeating)
    XCTAssertEqual(repeating.direction, "to right")

    let conic = try XCTUnwrap(parseGradient("conic-gradient(from 90deg at 25% 75%, red 0deg, blue 0.5turn)"))
    XCTAssertEqual(conic.type, "conic")
    XCTAssertFalse(conic.repeating)
    XCTAssertEqual(conic.direction, "from 90deg at 25% 75%")
    XCTAssertEqual(conic.resolvedStops().map(\.position), [0, 0.5])

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

    let period: CGFloat = 12 / 182.3
    let rings = unrollRepeatingStops([black, black, clear, clear], [0, period / 3, period / 3, period]).locations
    XCTAssertTrue(zip(rings, rings.dropFirst()).allSatisfy { $0 <= $1 }, "never out of order")
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
