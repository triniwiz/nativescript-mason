//
//  NineSlice.swift
//  Mason
//
//  The 9-slice painter shared by `border-image` (drawn in place of the border) and
//  `mask-border` (drawn into the element's mask).
//

#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif
import CoreGraphics

// MARK: - Values

enum NineSliceRepeat: String {
  case stretch
  case `repeat`
  case round
  case space
}

/// A `*-slice` value: image pixels / SVG coordinates, or a fraction of the image.
enum NineSliceNumber: Equatable {
  case number(CGFloat)
  case percent(CGFloat)
}

/// A `*-width` value: points, a fraction of the border image area, a multiple of the border
/// width, or `auto` (the slice's intrinsic size).
enum NineSliceWidth: Equatable {
  case length(CGFloat)
  case percent(CGFloat)
  case number(CGFloat)
  case math(NativePaintOffset)
  case auto
}

/// A `*-outset` value: points or a multiple of the border width.
enum NineSliceOutset: Equatable {
  case length(CGFloat)
  case number(CGFloat)
}

/// The longhands of `border-image` / `mask-border`, sides in top, right, bottom, left order.
struct NineSliceSpec: Equatable {
  /// The image or gradient as written; nil is `none`.
  var source: String?
  var slice: [NineSliceNumber]
  var fill: Bool
  var width: [NineSliceWidth]
  var outset: [NineSliceOutset]
  var repeatX: NineSliceRepeat
  var repeatY: NineSliceRepeat

  static let borderImageInitial = NineSliceSpec(source: nil, slice: Array(repeating: .percent(1), count: 4), fill: false,
                                                width: Array(repeating: .number(1), count: 4),
                                                outset: Array(repeating: .number(0), count: 4), repeatX: .stretch, repeatY: .stretch)

  static let maskBorderInitial = NineSliceSpec(source: nil, slice: Array(repeating: .number(0), count: 4), fill: false,
                                               width: Array(repeating: .auto, count: 4),
                                               outset: Array(repeating: .number(0), count: 4), repeatX: .stretch, repeatY: .stretch)

  static func parseBorderImage(_ value: String, em: CGFloat = 16) -> NineSliceSpec? {
    NativeNineSlice.borderImage(value)?.spec(em: em).0
  }

  static func maskBorder(source: String, slice: String, width: String, outset: String, repeat: String, em: CGFloat = 16) -> NineSliceSpec {
    NativeNineSlice.maskBorder([source, slice, width, outset, `repeat`, ""])?.spec(em: em).0 ?? maskBorderInitial
  }

  /// The border image area: the border box grown by the outsets. `borders` are the element's
  /// border widths in points.
  func area(box: CGRect, borders: UIEdgeInsets) -> CGRect {
    let b = [borders.top, borders.right, borders.bottom, borders.left]
    let o = (0..<4).map { i -> CGFloat in
      switch outset[i] {
      case .length(let p): return p
      case .number(let n): return n * b[i]
      }
    }
    return box.inset(by: UIEdgeInsets(top: -o[0], left: -o[3], bottom: -o[2], right: -o[1]))
  }
}

final class NativeNineSlice {
  private let handle: OpaquePointer

  private init(_ handle: OpaquePointer) { self.handle = handle }

  deinit { mason_css_nine_slice_release(handle) }

  static func borderImage(_ value: String, color: UInt32 = 0xff000000) -> NativeNineSlice? {
    value.withCString { mason_css_border_image_parse($0, color).map(NativeNineSlice.init) }
  }

  static func maskBorder(_ values: [String], color: UInt32 = 0xff000000) -> NativeNineSlice? {
    precondition(values.count == NineSliceInputRecord.stride)
    let strings = values.map { strdup($0) }
    defer { strings.forEach { free($0) } }
    guard !strings.contains(where: { $0 == nil }) else { return nil }
    let input = strings.map { $0.map { UnsafePointer<CChar>($0) } }
    return input.withUnsafeBufferPointer { mason_css_mask_border_parse($0.baseAddress, color).map(NativeNineSlice.init) }
  }

  static func install(_ program: NativeNineSlice?, on style: MasonStyle, mask: Bool) {
    let node = style.node
    guard !node.isPlaceholder else { return }
    let mason = node.mason
    if mason.inCompute { mason.deferStyleRecords(style) }
    else { style.prepareMut() }
    mason_css_nine_slice_install(mason.inCompute ? nil : mason.nativePtr, node.nativePtr, program?.handle, mask)
  }

  private static func text(_ value: CMasonCssText) -> String? {
    guard value.len != 0 else { return nil }
    return String(decoding: UnsafeBufferPointer(start: value.bytes, count: Int(value.len)), as: UTF8.self)
  }

  func source() -> NineSliceSource? {
    NineSliceSource(url: Self.text(mason_css_nine_slice_url(handle)),
                    gradient: mason_css_nine_slice_gradient(handle).map { Gradient(handle: $0) })
  }

  func spec(em: CGFloat) -> (NineSliceSpec, Bool) {
    let viewport = NSCMason.viewportSize
    let records = mason_css_nine_slice_values(handle, 1, Float(em), NSCMason.rootFontSize,
                                              Float(viewport.width), Float(viewport.height))
    defer { mason_css_values_release(records) }
    let rows = UnsafeBufferPointer(start: records.values, count: Int(records.len))
    func side(_ index: Int) -> (Int, CGFloat) {
      let start = NineSliceRecord.stride + index * NineSliceSideRecord.stride
      return (Int(rows[start + NineSliceSideRecord.kind]), CGFloat(rows[start + NineSliceSideRecord.value]))
    }
    let repeatModes: [NineSliceRepeat] = [.stretch, .repeat, .round, .space]
    let spec = NineSliceSpec(
      source: Self.text(mason_css_nine_slice_source(handle)),
      slice: (0..<4).map {
        let (kind, value) = side($0)
        return kind == 1 ? .percent(value) : .number(value)
      },
      fill: rows[NineSliceRecord.fill] != 0,
      width: (0..<4).map { index in
        let start = NineSliceRecord.stride + (index + 4) * NineSliceSideRecord.stride
        if rows[start + NineSliceSideRecord.hasMath] != 0,
           let offset = mason_css_nine_slice_width_offset(handle, UInt(index), 1, Float(em),
             NSCMason.rootFontSize, Float(viewport.width), Float(viewport.height)) {
          return .math(NativePaintOffset(owned: offset))
        }
        let (kind, value) = side(index + 4)
        switch kind {
        case 0: return .number(value)
        case 1: return .percent(value)
        case 2: return .length(value)
        default: return .auto
        }
      },
      outset: (8..<12).map {
        let (kind, value) = side($0)
        return kind == 2 ? .length(value) : .number(value)
      },
      repeatX: repeatModes[Int(rows[NineSliceRecord.repeatX])],
      repeatY: repeatModes[Int(rows[NineSliceRecord.repeatY])]
    )
    return (spec, rows[NineSliceRecord.luminance] != 0)
  }
}

// MARK: - Geometry

enum NineSlice {
  /// One draw: `src` (image units) scaled into `dst`, clipped to its region `clip`.
  struct Tile: Equatable {
    var src: CGRect
    var dst: CGRect
    var clip: CGRect
  }

  /// Where the tiles of one region go along one axis, as (origin, length) pairs.
  /// `tile` is the length one tile has after scaling.
  static func axisTiles(_ mode: NineSliceRepeat, start: CGFloat, length: CGFloat, tile: CGFloat) -> [(CGFloat, CGFloat)] {
    guard length > 0 else { return [] }
    guard mode != .stretch, tile > 0, tile.isFinite else { return [(start, length)] }
    // Sub-pixel tiles would mean thousands of draws; past this many the pattern is invisible anyway.
    let t = max(tile, length / 1000)
    switch mode {
    case .stretch:
      return [(start, length)]
    case .repeat:
      // Centred on the region, extending both ways; the partial tiles at the ends are clipped.
      let first = start + length / 2 - t / 2
      var x = first - ceil((first - start) / t) * t
      var out: [(CGFloat, CGFloat)] = []
      while x < start + length {
        out.append((x, t))
        x += t
      }
      return out
    case .round:
      let n = max(1, (length / t).rounded())
      let size = length / n
      return (0..<Int(n)).map { (start + CGFloat($0) * size, size) }
    case .space:
      let n = floor(length / t)
      guard n >= 1 else { return [] }
      let gap = (length - n * t) / (n + 1)
      return (0..<Int(n)).map { (start + gap + CGFloat($0) * (t + gap), t) }
    }
  }

  /// Slices in image units (clamped to the image) and widths in points (reduced so opposite
  /// sides never overlap), for an image `units` in size drawn around `area`.
  /// `pointsPerUnit` is the image's intrinsic size per unit; nil when it has none (gradients).
  static func resolve(_ spec: NineSliceSpec, area: CGRect, borders: UIEdgeInsets, units: CGSize,
                      pointsPerUnit: CGFloat?) -> (slices: UIEdgeInsets, widths: UIEdgeInsets) {
    let dims = [units.height, units.width, units.height, units.width]
    let s = (0..<4).map { i -> CGFloat in
      let v: CGFloat
      switch spec.slice[i] {
      case .number(let n): v = n
      case .percent(let f): v = f * dims[i]
      }
      return min(max(v, 0), dims[i])
    }
    let b = [borders.top, borders.right, borders.bottom, borders.left]
    let areaDims = [area.height, area.width, area.height, area.width]
    var w = (0..<4).map { i -> CGFloat in
      switch spec.width[i] {
      case .length(let p): return p
      case .percent(let f): return f * areaDims[i]
      case .number(let n): return n * b[i]
      case .math(let offset): return max(0, offset.resolve(basis: areaDims[i], units: nil, fallbackScale: 1))
      // The slice's intrinsic size; an image without one uses the border width.
      case .auto: return pointsPerUnit.map { s[i] * $0 } ?? b[i]
      }
    }
    // Opposite widths that add up to more than the area are scaled down together.
    let fx = w[1] + w[3] > 0 ? area.width / (w[1] + w[3]) : 1
    let fy = w[0] + w[2] > 0 ? area.height / (w[0] + w[2]) : 1
    let f = min(fx, fy)
    if f < 1 { w = w.map { $0 * f } }
    return (UIEdgeInsets(top: s[0], left: s[3], bottom: s[2], right: s[1]),
            UIEdgeInsets(top: w[0], left: w[3], bottom: w[2], right: w[1]))
  }

  /// The draws for the nine regions: corners scaled into the corner boxes, edges and (with
  /// `fill`) the middle stretched or tiled per the repeat keywords.
  static func tiles(units: CGSize, slices: UIEdgeInsets, area: CGRect, widths: UIEdgeInsets,
                    repeatX: NineSliceRepeat, repeatY: NineSliceRepeat, fill: Bool) -> [Tile] {
    // When opposite slices meet, the edges and middle are empty (a transparent image).
    let midW = max(0, units.width - slices.left - slices.right)
    let midH = max(0, units.height - slices.top - slices.bottom)
    let srcX = [0, slices.left, units.width - slices.right]
    let srcW = [slices.left, midW, slices.right]
    let srcY = [0, slices.top, units.height - slices.bottom]
    let srcH = [slices.top, midH, slices.bottom]
    let dstX = [area.minX, area.minX + widths.left, area.maxX - widths.right]
    let dstW = [widths.left, max(0, area.width - widths.left - widths.right), widths.right]
    let dstY = [area.minY, area.minY + widths.top, area.maxY - widths.bottom]
    let dstH = [widths.top, max(0, area.height - widths.top - widths.bottom), widths.bottom]

    // Edge scale factors: an edge image is scaled to its border width, keeping its ratio.
    func factor(_ dst: CGFloat, _ src: CGFloat) -> CGFloat? {
      guard src > 0, dst > 0 else { return nil }
      return dst / src
    }
    let topF = factor(widths.top, slices.top), bottomF = factor(widths.bottom, slices.bottom)
    let leftF = factor(widths.left, slices.left), rightF = factor(widths.right, slices.right)

    var out: [Tile] = []
    func add(_ col: Int, _ row: Int, tileW: CGFloat?, tileH: CGFloat?) {
      guard srcW[col] > 0, srcH[row] > 0, dstW[col] > 0, dstH[row] > 0 else { return }
      let src = CGRect(x: srcX[col], y: srcY[row], width: srcW[col], height: srcH[row])
      let region = CGRect(x: dstX[col], y: dstY[row], width: dstW[col], height: dstH[row])
      let xs = tileW.map { axisTiles(repeatX, start: region.minX, length: region.width, tile: $0) } ?? [(region.minX, region.width)]
      let ys = tileH.map { axisTiles(repeatY, start: region.minY, length: region.height, tile: $0) } ?? [(region.minY, region.height)]
      for (y, h) in ys {
        for (x, w) in xs {
          out.append(Tile(src: src, dst: CGRect(x: x, y: y, width: w, height: h), clip: region))
        }
      }
    }
    // Corners.
    add(0, 0, tileW: nil, tileH: nil)
    add(2, 0, tileW: nil, tileH: nil)
    add(0, 2, tileW: nil, tileH: nil)
    add(2, 2, tileW: nil, tileH: nil)
    // Top and bottom edges tile horizontally; left and right vertically.
    add(1, 0, tileW: topF.map { srcW[1] * $0 }, tileH: nil)
    add(1, 2, tileW: bottomF.map { srcW[1] * $0 }, tileH: nil)
    add(0, 1, tileW: nil, tileH: leftF.map { srcH[1] * $0 })
    add(2, 1, tileW: nil, tileH: rightF.map { srcH[1] * $0 })
    if fill {
      // The middle is scaled like the top (else bottom) edge across, the left (else right) down.
      add(1, 1, tileW: srcW[1] * (topF ?? bottomF ?? 1), tileH: srcH[1] * (leftF ?? rightF ?? 1))
    }
    return out
  }

  /// Draw `tiles` from `image` (whose full extent is `units`) into a y-down context.
  static func draw(_ image: CGImage, units: CGSize, tiles: [Tile], in ctx: CGContext) {
    guard units.width > 0, units.height > 0 else { return }
    let kx = CGFloat(image.width) / units.width
    let ky = CGFloat(image.height) / units.height
    var crops: [[CGFloat]: CGImage] = [:]
    // Anti-aliased shared edges leave faint seams; snapped to device pixels and drawn
    // aliased, neighbouring tiles abut exactly.
    ctx.saveGState()
    ctx.setShouldAntialias(false)
    defer { ctx.restoreGState() }
    for tile in tiles {
      let dst = snapToDevicePixels(tile.dst, ctx)
      let clip = snapToDevicePixels(tile.clip, ctx)
      guard dst.width > 0, dst.height > 0, clip.width > 0, clip.height > 0 else { continue }
      let px = CGRect(x: (tile.src.minX * kx).rounded(), y: (tile.src.minY * ky).rounded(),
                      width: (tile.src.width * kx).rounded(), height: (tile.src.height * ky).rounded())
      guard px.width >= 1, px.height >= 1 else { continue }
      let key = [px.minX, px.minY, px.width, px.height]
      let piece: CGImage
      if let cached = crops[key] {
        piece = cached
      } else {
        guard let cropped = image.cropping(to: px) else { continue }
        crops[key] = cropped
        piece = cropped
      }
      ctx.saveGState()
      if tile.dst != tile.clip { ctx.clip(to: clip) }
      // CGContext.draw puts the image's first row at the rect's max y; flip it back upright.
      ctx.translateBy(x: dst.minX, y: dst.maxY)
      ctx.scaleBy(x: 1, y: -1)
      ctx.draw(piece, in: CGRect(origin: .zero, size: dst.size))
      ctx.restoreGState()
    }
  }

  /// `rect` with each edge moved to the nearest device pixel of `ctx`, so two rects that
  /// share an edge in user space still share it after rounding.
  static func snapToDevicePixels(_ rect: CGRect, _ ctx: CGContext) -> CGRect {
    let d = ctx.convertToDeviceSpace(rect)
    let minX = d.minX.rounded(), minY = d.minY.rounded()
    let snapped = CGRect(x: minX, y: minY, width: d.maxX.rounded() - minX, height: d.maxY.rounded() - minY)
    return ctx.convertToUserSpace(snapped)
  }
}

// MARK: - Source image

/// A `border-image-source` / `mask-border-source` loaded and rasterized for slicing. Slice
/// numbers are image pixels for rasters and SVG user units for SVG; a gradient has no
/// intrinsic size and is drawn at the size of the border image area.
final class NineSliceSource {
  struct Image {
    let cgImage: CGImage
    /// The coordinate space slice numbers live in.
    let units: CGSize
    /// Intrinsic points per unit; nil for an image without intrinsic size.
    let pointsPerUnit: CGFloat?
  }

  private let layer: BackgroundLayer
  private var bitmap: UIImage?
  private var loading = false
  private var failed = false
  private var svg: SvgDocument?
  private var raster: (key: [CGFloat], image: CGImage)?

  init?(url: String?, gradient: Gradient?) {
    guard url != nil || gradient != nil else { return nil }
    let layer = BackgroundLayer()
    layer.image = url
    layer.gradient = gradient
    // Drawn as one tile filling the rect it is given.
    layer.backgroundColor = nil
    layer.position = nil
    layer.size = nil
    layer.repeatType = .noRepeat
    layer.origin = .borderBox
    layer.clip = .borderBox
    self.layer = layer
  }

  /// The source ready to slice for an `area`-sized border image area at device `scale`, or nil
  /// while a remote image loads (`onLoad` runs on the main thread when it lands) or if it failed.
  func image(area: CGSize, scale: CGFloat, style: MasonStyle, painter: Background, onLoad: @escaping () -> Void) -> Image? {
    if layer.gradient != nil {
      return gradientImage(area: area, scale: scale, painter: painter)
    }
    guard let url = layer.image, !failed else { return nil }
    if isSvgSource(url) {
      return svgImage(url, area: area, scale: scale, style: style)
    }
    if bitmap == nil && !loading {
      if url.range(of: "data:", options: [.caseInsensitive, .anchored]) != nil {
        bitmap = decodeDataUrlImage(url: url)
        failed = bitmap == nil
      } else {
        loading = true
        loadImageAsync(url: url) { [weak self] image in
          DispatchQueue.main.async {
            guard let self = self else { return }
            self.loading = false
            self.bitmap = image
            self.failed = image == nil
            onLoad()
          }
        }
      }
    }
    guard let image = bitmap, let cg = image.cgImage, cg.width > 0, cg.height > 0 else { return nil }
    // Slice numbers are image pixels; the intrinsic size is the image's point size.
    return Image(cgImage: cg, units: CGSize(width: cg.width, height: cg.height), pointsPerUnit: image.size.width / CGFloat(cg.width))
  }

  private func gradientImage(area: CGSize, scale: CGFloat, painter: Background) -> Image? {
    guard area.width > 0, area.height > 0 else { return nil }
    let key = [area.width, area.height, scale]
    if let cached = raster, cached.key == key {
      return Image(cgImage: cached.image, units: area, pointsPerUnit: nil)
    }
    let s = min(scale, Mask.pixelScale(for: area))
    let pw = Int(ceil(area.width * s)), ph = Int(ceil(area.height * s))
    guard let ctx = Mask.makeContext(pw, ph) else { return nil }
    // y-down points, like the view contexts the painter normally draws in.
    ctx.translateBy(x: 0, y: CGFloat(ph))
    ctx.scaleBy(x: s, y: -s)
    let rect = CGRect(origin: .zero, size: area)
    painter.drawLayerContent(layer, caLayer: nil, in: ctx, paintRect: rect, box: rect)
    guard let image = ctx.makeImage() else { return nil }
    raster = (key, image)
    return Image(cgImage: image, units: area, pointsPerUnit: nil)
  }

  private func svgImage(_ url: String, area: CGSize, scale: CGFloat, style: MasonStyle) -> Image? {
    if svg == nil {
      svg = decodeSvgSource(url)
      if svg == nil {
        failed = true
        return nil
      }
    }
    guard let doc = svg, doc.width > 0, doc.height > 0 else { return nil }
    // Slice numbers are in the SVG's own coordinates: its viewBox when it has one.
    let units = doc.viewBox.map { $0.size } ?? CGSize(width: doc.width, height: doc.height)
    guard units.width > 0, units.height > 0 else { return nil }
    // Sharp at the largest size a slice may be drawn at, within the raster cap.
    let fit = max(area.width / units.width, area.height / units.height, 1)
    let rasterScale = min(max(scale, 1) * fit, 4096 / max(units.width, units.height))
    let color = doc.usesCurrentColor ? style.resolvedColor : 0
    let key = [rasterScale, CGFloat(color)]
    if let cached = raster, cached.key == key {
      return Image(cgImage: cached.image, units: units, pointsPerUnit: doc.width / units.width)
    }
    guard let rendered = renderSvgDocument(doc, size: units, scale: rasterScale, currentColor: color)?.cgImage else { return nil }
    raster = (key, rendered)
    return Image(cgImage: rendered, units: units, pointsPerUnit: doc.width / units.width)
  }
}

/// A parsed 9-slice (border image or mask border) with its loaded source.
final class NineSliceImage {
  let spec: NineSliceSpec
  let source: NineSliceSource?

  init(_ spec: NineSliceSpec, source: NineSliceSource?) {
    self.spec = spec
    self.source = source
  }

  /// Paint into `ctx` (y-down) around the border box `box`. Returns false when there is nothing
  /// to draw yet (no valid source, or it is still loading).
  @discardableResult
  func draw(in ctx: CGContext, box: CGRect, borders: UIEdgeInsets, scale: CGFloat, style: MasonStyle,
            painter: Background, onLoad: @escaping () -> Void) -> Bool {
    guard let source = source else { return false }
    let area = spec.area(box: box, borders: borders)
    guard area.width > 0, area.height > 0,
          let image = source.image(area: area.size, scale: scale, style: style, painter: painter, onLoad: onLoad) else { return false }
    let (slices, widths) = NineSlice.resolve(spec, area: area, borders: borders, units: image.units, pointsPerUnit: image.pointsPerUnit)
    let tiles = NineSlice.tiles(units: image.units, slices: slices, area: area, widths: widths,
                                repeatX: spec.repeatX, repeatY: spec.repeatY, fill: spec.fill)
    NineSlice.draw(image.cgImage, units: image.units, tiles: tiles, in: ctx)
    return true
  }
}

// MARK: - border-image hookup

/// The element's `border-image`: the string it was parsed from and the result.
final class BorderImage {
  private(set) var css: String = ""
  private(set) var image: NineSliceImage?

  func update(_ value: String, style: MasonStyle) {
    if value == css { return }
    css = value
    let program = NativeNineSlice.borderImage(value, color: style.color)
    NativeNineSlice.install(program, on: style, mask: false)
    image = program.map { NineSliceImage($0.spec(em: style.emBasis).0, source: $0.source()) }
  }
}

extension MasonStyle {
  /// Something may draw a border image; draw paths take the slow route while this holds.
  internal var hasBorderImage: Bool { !borderImage.isEmpty || hasPseudoBorderImage }

  /// The `border-image` in effect: an active pseudo state's value, else the element's own.
  private var resolvedBorderImage: String {
    guard hasPseudoBorderImage else { return borderImage }
    let mask = node.pseudoMask
    if mask != 0 {
      for state in PSEUDO_CSS_ORDER.reversed() where (mask & state.rawValue) != 0 {
        if let s = node.getPseudoString(state.rawValue, "border-image"), !s.isEmpty { return s }
      }
    }
    return borderImage
  }

  private func syncBorderImage() -> NineSliceImage? {
    let value = resolvedBorderImage
    if mBorderImageStorage == nil {
      guard !value.isEmpty else { return nil }
      mBorderImageStorage = BorderImage()
    }
    mBorderImageStorage?.update(value, style: self)
    return mBorderImageStorage?.image
  }

  /// `border-image` (or a pseudo state's) changed: repaint through draw(_:).
  internal func borderImageChanged() {
    _ = syncBorderImage()
    guard let view = node.view else { return }
    if let mv = view as? MasonUIView {
      mv.invalidateDrawFlags()
      mv.backingLayer.setNeedsDisplay()
    } else {
      view.setNeedsDisplay()
      (view as? MasonText)?.textLayer.setNeedsDisplay()
      view.backingLayer.setNeedsDisplay()
    }
  }

  /// Draw the border image in place of the border. Returns false when there is none or its
  /// source is not ready, so the border styles draw instead (as CSS falls back).
  internal func drawBorderImage(in ctx: CGContext, rect: CGRect) -> Bool {
    guard hasBorderImage, let image = syncBorderImage() else { return false }
    let borders = mBackground.boxInsets(.paddingBox)
    return image.draw(in: ctx, box: rect, borders: borders, scale: max(CGFloat(NSCMason.scale), 1), style: self,
                      painter: mBackground, onLoad: { [weak self] in self?.borderImageChanged() })
  }
}
