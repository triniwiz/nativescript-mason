//
//  Mask.swift
//  Mason
//
//  CSS masking (`mask-image`, `mask-size`, `mask-position`, `mask-repeat`, `mask-origin`,
//  `mask-clip`, `mask-mode`, `mask-composite`), `mask-border-*` and `clip-path`, all composed
//  into the one `layer.mask`.
//

import UIKit
import CoreGraphics

private let maskColorSpace = CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB()

/// Largest mask raster, in device pixels; a bigger box is rasterized below screen scale.
private let maxMaskPixels: CGFloat = 4096 * 4096

// MARK: - Keywords

enum MaskMode: String {
  case matchSource = "match-source"
  case alpha
  case luminance

  static func parse(_ value: String) -> MaskMode? {
    MaskMode(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
  }
}

/// How a layer combines with the layers below it (the layer is the source).
enum MaskComposite: String {
  case add
  case subtract
  case intersect
  case exclude

  static func parse(_ value: String) -> MaskComposite? {
    MaskComposite(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
  }

  var blendMode: CGBlendMode {
    switch self {
    case .add: return .normal
    case .subtract: return .sourceOut
    case .intersect: return .sourceIn
    case .exclude: return .xor
    }
  }
}

/// `mask-origin` / `mask-clip` boxes. HTML elements have no SVG boxes, and CSS maps
/// `fill-box`/`stroke-box`/`view-box` to `border-box` there; `margin-box` is treated the same.
enum MaskBox: Equatable {
  case borderBox
  case paddingBox
  case contentBox
  /// `mask-clip: no-clip`: the layer is not clipped to any box.
  case noClip

  static func parse(_ value: String, allowNoClip: Bool) -> MaskBox? {
    switch value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
    case "border-box", "fill-box", "stroke-box", "view-box", "margin-box": return .borderBox
    case "padding-box": return .paddingBox
    case "content-box": return .contentBox
    case "no-clip": return allowNoClip ? .noClip : nil
    default: return nil
    }
  }

  var backgroundBox: BackgroundClip {
    switch self {
    case .paddingBox: return .paddingBox
    case .contentBox: return .contentBox
    default: return .borderBox
    }
  }
}

/// `mask-repeat`, one or two keywords. `space` and `round` tile like `repeat`.
func parseMaskRepeat(_ value: String) -> BackgroundRepeat? {
  let tokens = splitTopLevelWhitespace(value.lowercased())
  func tiles(_ t: String) -> Bool? {
    switch t {
    case "repeat", "space", "round": return true
    case "no-repeat": return false
    default: return nil
    }
  }
  switch tokens.count {
  case 1:
    switch tokens[0] {
    case "repeat-x": return .repeatX
    case "repeat-y": return .repeatY
    default:
      guard let both = tiles(tokens[0]) else { return nil }
      return both ? .repeatXY : .noRepeat
    }
  case 2:
    guard let x = tiles(tokens[0]), let y = tiles(tokens[1]) else { return nil }
    switch (x, y) {
    case (true, true): return .repeatXY
    case (true, false): return .repeatX
    case (false, true): return .repeatY
    case (false, false): return .noRepeat
    }
  default:
    return nil
  }
}

// MARK: - Mask layer

/// One `mask-image` layer. `paint` holds the image and its size/position/repeat/origin and is
/// drawn by the background code; the rest is mask-only.
final class MaskLayer {
  let paint: BackgroundLayer
  /// `none`: a transparent layer that still takes a slot in the longhand lists.
  let isNone: Bool
  var mode: MaskMode = .matchSource
  var composite: MaskComposite = .add
  var clip: MaskBox = .borderBox

  init(paint: BackgroundLayer, isNone: Bool) {
    self.paint = paint
    self.isNone = isNone
  }

  /// `match-source` is alpha for images and gradients (luminance only applies to SVG `<mask>`).
  var usesLuminance: Bool { mode == .luminance }
}

// MARK: - Mask border

/// `mask-border`: a 9-slice image multiplied into the mask.
final class MaskBorder {
  let image: NineSliceImage
  let luminance: Bool

  init(image: NineSliceImage, luminance: Bool) {
    self.image = image
    self.luminance = luminance
  }
}

// MARK: - Mask

/// The element's mask: the raw longhands as set, the layers, clip path and mask border parsed
/// from them, and the rasterizer that composes them into the image `MasonMaskLayer` shows.
final class Mask {
  unowned let style: MasonStyle
  // Drawing only: masks reuse the background layer painter. Never parse into it or set its
  // color - that writes the element's background-color.
  private lazy var painter = Background(style: style)

  private(set) var layers: [MaskLayer] = []
  private(set) var clip: ClipPathValue?
  private(set) var border: MaskBorder?
  /// The resolved longhands everything was built from.
  private(set) var values: [String]? = nil

  /// The eight `mask-*` longhands, `clip-path`, then the six `mask-border-*` ones.
  static let valueCount = 15

  init(style: MasonStyle) {
    self.style = style
  }

  /// Some layer references an image; all-`none` (or nothing set) is no mask-image at all.
  var hasImageLayers: Bool { layers.contains { !$0.isNone } }

  /// Anything to apply: mask-image layers, a clip path or a mask border.
  var isActive: Bool { hasImageLayers || clip != nil || border != nil }

  /// Only a clip path: the mask layer can stay a vector shape.
  var isClipOnly: Bool { clip != nil && !hasImageLayers && border == nil }

  var hasNoClipLayer: Bool { layers.contains { !$0.isNone && $0.clip == .noClip } }

  /// Rebuild what changed among the resolved longhands (missing trailing ones are empty).
  /// Returns true if any did.
  @discardableResult
  func update(_ input: [String]) -> Bool {
    var resolved = input
    if resolved.count < Mask.valueCount { resolved += Array(repeating: "", count: Mask.valueCount - resolved.count) }
    if values == resolved { return false }
    let old = values
    values = resolved
    if old.map({ Array($0[0..<8]) }) != Array(resolved[0..<8]) {
      layers = Mask.parseLayers(image: resolved[0], size: resolved[1], position: resolved[2], repeat: resolved[3],
                                origin: resolved[4], clip: resolved[5], mode: resolved[6], composite: resolved[7])
    }
    if old?[8] != resolved[8] {
      clip = resolved[8].isEmpty ? nil : ClipPathValue.parse(resolved[8], em: style.emBasis)
    }
    if old.map({ Array($0[9..<15]) }) != Array(resolved[9..<15]) {
      border = Mask.parseBorder(source: resolved[9], slice: resolved[10], width: resolved[11], outset: resolved[12],
                                repeat: resolved[13], mode: resolved[14], em: style.emBasis)
    }
    return true
  }

  /// A mask border, or nil for `none` or a source that is not an image.
  static func parseBorder(source: String, slice: String, width: String, outset: String, repeat: String,
                          mode: String, em: CGFloat = 16) -> MaskBorder? {
    if source.isEmpty { return nil }
    let spec = NineSliceSpec.maskBorder(source: source, slice: slice, width: width, outset: outset, repeat: `repeat`, em: em)
    let image = NineSliceImage(spec)
    guard image.source != nil else { return nil }
    return MaskBorder(image: image, luminance: mode.trimmingCharacters(in: .whitespaces).lowercased() == "luminance")
  }

  /// Layers of a `mask-image` list with the per-layer longhands applied, each list repeating
  /// cyclically as CSS does. Invalid entries keep their initial value.
  static func parseLayers(image: String, size: String = "", position: String = "", repeat: String = "",
                          origin: String = "", clip: String = "", mode: String = "", composite: String = "") -> [MaskLayer] {
    let items = splitBackgroundLayers(image).filter { !$0.isEmpty }
    let layers: [MaskLayer] = items.map { item in
      let lower = item.lowercased()
      if lower == "none" {
        return MaskLayer(paint: BackgroundLayer(), isNone: true)
      }
      let paint = parseLayer(item)
      // An entry that is neither an image nor a gradient is invalid; it paints nothing.
      let isImage = paint.image != nil || paint.gradient != nil
      paint.backgroundColor = nil
      paint.position = nil
      paint.size = nil
      paint.repeatType = .repeatXY
      paint.attachment = .scroll
      paint.origin = .borderBox
      paint.clip = .borderBox
      return MaskLayer(paint: paint, isNone: !isImage)
    }
    if layers.isEmpty { return [] }

    func each(_ list: String, _ apply: (MaskLayer, String) -> Void) {
      let parts = splitBackgroundLayers(list).filter { !$0.isEmpty }
      if parts.isEmpty { return }
      for (i, layer) in layers.enumerated() { apply(layer, parts[i % parts.count]) }
    }
    each(size) { layer, v in if let s = parseSize(v) { layer.paint.size = s } }
    each(position) { layer, v in if let p = parsePosition(splitTopLevelWhitespace(v)) { layer.paint.position = p } }
    each(`repeat`) { layer, v in if let r = parseMaskRepeat(v) { layer.paint.repeatType = r } }
    each(origin) { layer, v in if let o = MaskBox.parse(v, allowNoClip: false) { layer.paint.origin = o.backgroundBox } }
    each(clip) { layer, v in if let c = MaskBox.parse(v, allowNoClip: true) { layer.clip = c } }
    each(mode) { layer, v in if let m = MaskMode.parse(v) { layer.mode = m } }
    each(composite) { layer, v in if let c = MaskComposite.parse(v) { layer.composite = c } }
    return layers
  }

  /// Device scale to rasterize a `size`-point mask at.
  static func pixelScale(for size: CGSize) -> CGFloat {
    let scale = max(CGFloat(NSCMason.scale), 1)
    let points = max(size.width * size.height, 1)
    return min(scale, (maxMaskPixels / points).squareRoot())
  }

  // MARK: Rendering

  /// Compose the layers into one image whose alpha is the mask, covering `maskRect` (box
  /// coordinates) at `scale`. `overflowClip` is folded in because the mask owns `layer.mask`.
  func renderImage(boxSize: CGSize, maskRect: CGRect, scale: CGFloat, overflowClip: CGPath? = nil,
                   clipShape: CGPath? = nil, clipEvenOdd: Bool = false, borders: UIEdgeInsets = .zero,
                   caLayer: CALayer? = nil) -> CGImage? {
    let pw = Int(ceil(maskRect.width * scale))
    let ph = Int(ceil(maskRect.height * scale))
    guard pw > 0, ph > 0, let acc = Mask.makeContext(pw, ph) else { return nil }
    let box = CGRect(origin: .zero, size: boxSize)
    let toPixels = Mask.userTransform(maskRect: maskRect, scale: scale, pixelHeight: ph)
    let full = CGRect(x: 0, y: 0, width: pw, height: ph)

    // The clips apply to everything below; nothing outside them is ever painted.
    if overflowClip != nil || clipShape != nil {
      acc.concatenate(toPixels)
      if let clip = overflowClip {
        acc.addPath(clip)
        acc.clip()
      }
      if let shape = clipShape {
        acc.addPath(shape)
        acc.clip(using: clipEvenOdd ? .evenOdd : .winding)
      }
      acc.concatenate(toPixels.inverted())
    }

    // The last listed layer is the bottom one; each layer above composites onto the result.
    // All-`none` layers are no mask-image (a clip path or mask border may still apply).
    for (i, layer) in (hasImageLayers ? layers : []).reversed().enumerated() {
      let blend: CGBlendMode = i == 0 ? .normal : layer.composite.blendMode
      if layer.isNone {
        // A transparent source: `subtract` and `intersect` leave nothing, `add`/`exclude` change nothing.
        if blend == .sourceIn || blend == .sourceOut { acc.clear(full) }
        continue
      }
      if blend == .normal && !layer.usesLuminance {
        // Source-over of an alpha layer: paint straight into the result.
        acc.saveGState()
        acc.concatenate(toPixels)
        paint(layer, in: acc, box: box, maskRect: maskRect, caLayer: caLayer)
        acc.restoreGState()
        continue
      }
      guard let image = renderLayer(layer, box: box, maskRect: maskRect, transform: toPixels, pw: pw, ph: ph, caLayer: caLayer) else {
        if blend == .sourceIn || blend == .sourceOut { acc.clear(full) }
        continue
      }
      acc.saveGState()
      acc.setBlendMode(blend)
      acc.draw(image, in: full)
      acc.restoreGState()
    }

    let onLoad: () -> Void = { [weak caLayer] in caLayer?.setNeedsDisplay() }
    if let border = border {
      if !hasImageLayers && !border.luminance {
        // The mask border is the whole mask: paint it straight in.
        acc.saveGState()
        acc.concatenate(toPixels)
        let drew = border.image.draw(in: acc, box: box, borders: borders, scale: scale, style: style, painter: painter, onLoad: onLoad)
        acc.restoreGState()
        if !drew { fillOpaque(acc, full) }
      } else if let ctx = Mask.makeContext(pw, ph) {
        ctx.concatenate(toPixels)
        if border.image.draw(in: ctx, box: box, borders: borders, scale: scale, style: style, painter: painter, onLoad: onLoad) {
          if border.luminance { Mask.convertToLuminance(ctx) }
          if let image = ctx.makeImage() {
            // Multiplied with the mask-image layers (or, alone, it is the mask).
            acc.saveGState()
            acc.setBlendMode(hasImageLayers ? .destinationIn : .normal)
            acc.draw(image, in: full)
            acc.restoreGState()
          }
        } else if !hasImageLayers {
          // A source still loading masks nothing yet.
          fillOpaque(acc, full)
        }
      }
    } else if !hasImageLayers {
      // A clip path alone: everything inside it shows.
      fillOpaque(acc, full)
    }
    return acc.makeImage()
  }

  private func fillOpaque(_ ctx: CGContext, _ rect: CGRect) {
    ctx.setFillColor(gray: 0, alpha: 1)
    ctx.fill(rect)
  }

  /// One layer on its own transparent image, converted to luminance when asked.
  private func renderLayer(_ layer: MaskLayer, box: CGRect, maskRect: CGRect, transform: CGAffineTransform,
                           pw: Int, ph: Int, caLayer: CALayer?) -> CGImage? {
    guard let ctx = Mask.makeContext(pw, ph) else { return nil }
    ctx.saveGState()
    ctx.concatenate(transform)
    paint(layer, in: ctx, box: box, maskRect: maskRect, caLayer: caLayer)
    ctx.restoreGState()
    if layer.usesLuminance { Mask.convertToLuminance(ctx) }
    return ctx.makeImage()
  }

  /// Paint a layer (in box coordinates) clipped to its `mask-clip` box.
  private func paint(_ layer: MaskLayer, in ctx: CGContext, box: CGRect, maskRect: CGRect, caLayer: CALayer?) {
    let paintRect: CGRect
    if layer.clip == .noClip {
      paintRect = maskRect
    } else {
      paintRect = box.inset(by: painter.boxInsets(layer.clip.backgroundBox))
      ctx.clip(to: paintRect)
    }
    painter.drawLayerContent(layer.paint, caLayer: caLayer, in: ctx, paintRect: paintRect, box: box)
  }

  /// Box coordinates (points, y down, origin at the box) to pixel coordinates (y up).
  static func userTransform(maskRect: CGRect, scale: CGFloat, pixelHeight: Int) -> CGAffineTransform {
    CGAffineTransform(a: scale, b: 0, c: 0, d: -scale, tx: -maskRect.minX * scale, ty: CGFloat(pixelHeight) + maskRect.minY * scale)
  }

  /// RGBA8, premultiplied, so luminance can be read straight from the bytes.
  static func makeContext(_ width: Int, _ height: Int) -> CGContext? {
    CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: maskColorSpace,
              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue)
  }

  /// `mask-mode: luminance`: the mask value is luminance x alpha. With premultiplied channels
  /// that is the luminance of the stored values, which becomes the new alpha.
  static func convertToLuminance(_ ctx: CGContext) {
    guard let data = ctx.data else { return }
    let bytes = data.bindMemory(to: UInt8.self, capacity: ctx.bytesPerRow * ctx.height)
    for y in 0..<ctx.height {
      let row = bytes + y * ctx.bytesPerRow
      for x in 0..<ctx.width {
        let p = row + x * 4
        if p[3] == 0 { continue }
        let lum = (0.2126 * Double(p[0]) + 0.7152 * Double(p[1]) + 0.0722 * Double(p[2])).rounded()
        let v = UInt8(min(255, max(0, lum)))
        p[0] = v; p[1] = v; p[2] = v; p[3] = v
      }
    }
  }
}

// MARK: - Mask CALayer

/// `view.layer.mask` while a CSS mask is set. Its contents are the composed mask, redrawn by
/// Core Animation (coalesced, before the frame is shown) when its size or the mask changes.
final class MasonMaskLayer: CALayer {
  weak var owner: Mask?
  /// The element's border box size; the layer itself may be larger for `mask-clip: no-clip`.
  var boxSize: CGSize = .zero {
    didSet { if boxSize != oldValue { setNeedsDisplay() } }
  }
  /// Where the layer starts in box coordinates (negative when it extends past the box).
  var maskOrigin: CGPoint = .zero {
    didSet { if maskOrigin != oldValue { setNeedsDisplay() } }
  }
  /// The overflow clip (box coordinates) that would otherwise be the view's own shape mask.
  private(set) var overflowClip: CGPath?
  /// The resolved `clip-path` (box coordinates); hit testing reads it too.
  private(set) var clipShape: CGPath?
  private(set) var clipEvenOdd = false
  /// The element's border widths in points, which size a mask border.
  var borderWidths: UIEdgeInsets = .zero {
    didSet { if borderWidths != oldValue { setNeedsDisplay() } }
  }
  /// Draws a lone clip path as a vector instead of a raster.
  private var vectorLayer: CAShapeLayer?

  override init() {
    super.init()
    needsDisplayOnBoundsChange = true
  }

  override init(layer: Any) {
    if let other = layer as? MasonMaskLayer {
      owner = other.owner
      boxSize = other.boxSize
      maskOrigin = other.maskOrigin
      overflowClip = other.overflowClip
      clipShape = other.clipShape
      clipEvenOdd = other.clipEvenOdd
      borderWidths = other.borderWidths
    }
    super.init(layer: layer)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // The mask follows layout and scrolling exactly; implicit animations would make it trail.
  override func action(forKey event: String) -> CAAction? {
    return NSNull()
  }

  func setOverflowClip(_ path: CGPath?) {
    if path == overflowClip { return }
    overflowClip = path
    setNeedsDisplay()
  }

  func setClip(_ path: CGPath?, evenOdd: Bool) {
    if path == clipShape && evenOdd == clipEvenOdd { return }
    clipShape = path
    clipEvenOdd = evenOdd
    setNeedsDisplay()
  }

  /// Keep the mask on the element box while `bounds.origin` scrolls the content.
  func follow(viewBounds: CGRect) {
    let origin = CGPoint(x: viewBounds.minX + maskOrigin.x, y: viewBounds.minY + maskOrigin.y)
    if frame.origin != origin { frame.origin = origin }
  }

  override func display() {
    guard let owner = owner, bounds.width > 0, bounds.height > 0, boxSize.width > 0, boxSize.height > 0 else {
      contents = nil
      removeVectorLayer()
      return
    }
    if owner.isClipOnly, overflowClip == nil, let clip = clipShape {
      // A clip path on its own stays a vector: no raster to allocate or redraw on resize.
      contents = nil
      let shape: CAShapeLayer
      if let existing = vectorLayer {
        shape = existing
      } else {
        shape = CAShapeLayer()
        shape.actions = ["path": NSNull(), "position": NSNull(), "bounds": NSNull(), "fillRule": NSNull()]
        addSublayer(shape)
        vectorLayer = shape
      }
      shape.frame = bounds
      var toLayer = CGAffineTransform(translationX: -maskOrigin.x, y: -maskOrigin.y)
      shape.path = clip.copy(using: &toLayer)
      shape.fillRule = clipEvenOdd ? .evenOdd : .nonZero
      return
    }
    removeVectorLayer()
    let scale = Mask.pixelScale(for: bounds.size)
    contentsScale = scale
    contents = owner.renderImage(boxSize: boxSize, maskRect: CGRect(origin: maskOrigin, size: bounds.size),
                                 scale: scale, overflowClip: overflowClip, clipShape: clipShape,
                                 clipEvenOdd: clipEvenOdd, borders: borderWidths, caLayer: self)
  }

  private func removeVectorLayer() {
    vectorLayer?.removeFromSuperlayer()
    vectorLayer = nil
  }

  /// The vector clip-path layer while one is in use (tests read it).
  var vectorClipLayer: CAShapeLayer? { vectorLayer }
}

// MARK: - Style hookup

extension MasonStyle {
  // In `Mask.update` order.
  static let maskPropertyNames = ["mask-image", "mask-size", "mask-position", "mask-repeat",
                                  "mask-origin", "mask-clip", "mask-mode", "mask-composite", "clip-path",
                                  "mask-border-source", "mask-border-slice", "mask-border-width",
                                  "mask-border-outset", "mask-border-repeat", "mask-border-mode"]

  /// True while a mask or clip path applies; the outset shadow is hidden then, as CSS clips it.
  internal var isMasked: Bool { mMaskStorage?.isActive == true }

  /// The mask longhands in effect: an active pseudo state's value, else the element's own.
  private func resolvedMaskValues() -> [String] {
    var values = [maskImage, maskSize, maskPosition, maskRepeat, maskOrigin, maskClip, maskMode, maskComposite, clipPath,
                  maskBorderSource, maskBorderSlice, maskBorderWidth, maskBorderOutset, maskBorderRepeat, maskBorderMode]
    guard hasPseudoMask else { return values }
    // One read: pseudoMask is an FFI round-trip.
    let mask = node.pseudoMask
    guard mask != 0 else { return values }
    for (i, name) in MasonStyle.maskPropertyNames.enumerated() {
      for state in PSEUDO_CSS_ORDER.reversed() where (mask & state.rawValue) != 0 {
        if let s = node.getPseudoString(state.rawValue, name), !s.isEmpty {
          values[i] = s
          break
        }
      }
    }
    return values
  }

  /// A mask longhand (or a pseudo state's) changed, or a pseudo state toggled.
  internal func maskChanged() {
    guard let view = node.view else { return }
    syncMask(view)
  }

  /// Bring `view.layer.mask` in line with the mask longhands and the view's current box;
  /// free when no mask was ever set.
  internal func syncMask(_ view: UIView) {
    if mMaskStorage == nil && !hasPseudoMask && maskImage.isEmpty && clipPath.isEmpty && maskBorderSource.isEmpty { return }
    let mask: Mask
    if let existing = mMaskStorage {
      mask = existing
    } else {
      mask = Mask(style: self)
      mMaskStorage = mask
    }
    let wasActive = mask.isActive
    let changed = mask.update(resolvedMaskValues())
    if wasActive != mask.isActive {
      // The outset shadow shows only when unmasked.
      updateShadowLayer(for: CGRect(origin: .zero, size: view.bounds.size))
    }

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    defer { CATransaction.commit() }

    guard mask.isActive else {
      if let installed = view.layer.mask as? MasonMaskLayer {
        // Hand any overflow clip back to the plain shape mask layout would have set.
        if let clip = installed.overflowClip {
          let shape = CAShapeLayer()
          shape.path = clip
          shape.frame = view.bounds
          view.layer.mask = shape
        } else {
          view.layer.mask = nil
        }
      }
      return
    }

    let maskLayer: MasonMaskLayer
    if let installed = view.layer.mask as? MasonMaskLayer {
      maskLayer = installed
    } else {
      maskLayer = MasonMaskLayer()
      // Layout's overflow clip shape is box-local (its frame is the bounds); keep clipping by it.
      if let shape = view.layer.mask as? CAShapeLayer, let path = shape.path {
        maskLayer.setOverflowClip(path)
      }
      view.layer.mask = maskLayer
    }
    maskLayer.owner = mask

    let size = view.bounds.size
    let box = CGRect(origin: .zero, size: size)
    let boxes = clipReferenceBoxes(size: size)
    let clipShape = mask.clip.map { $0.path(boxes, renderer: mBorderRender) }
    maskLayer.setClip(clipShape, evenOdd: mask.clip?.evenOdd ?? false)
    maskLayer.borderWidths = boxes.borderWidths

    // The area anything can show through: each part bounds it, and they multiply.
    var bound: CGRect? = nil
    if mask.hasImageLayers {
      var layersRect = box
      if mask.hasNoClipLayer {
        // Not clipped to the box: cover what the children paint outside it, within reason.
        let origin = view.bounds.origin
        for sub in view.subviews where !sub.isHidden {
          layersRect = layersRect.union(sub.frame.offsetBy(dx: -origin.x, dy: -origin.y))
        }
      }
      bound = layersRect
    }
    if let border = mask.border {
      let area = border.image.spec.area(box: box, borders: boxes.borderWidths)
      bound = bound.map { $0.intersection(area) } ?? area
    }
    if let shape = clipShape {
      let shapeBounds = shape.boundingBoxOfPath
      bound = bound.map { $0.intersection(shapeBounds) } ?? shapeBounds
    }
    var maskRect = (bound ?? box).intersection(box.insetBy(dx: -size.width, dy: -size.height))
    // Nothing shows: an empty layer masks the element away.
    if maskRect.isNull || maskRect.isEmpty { maskRect = .zero }
    maskLayer.boxSize = size
    maskLayer.maskOrigin = maskRect.origin
    let frame = CGRect(origin: CGPoint(x: view.bounds.minX + maskRect.minX, y: view.bounds.minY + maskRect.minY), size: maskRect.size)
    if maskLayer.frame != frame { maskLayer.frame = frame }
    if changed { maskLayer.setNeedsDisplay() }
  }

  /// Layout's overflow clip, routed into the CSS mask while one owns `layer.mask`.
  /// Returns false when there is no CSS mask and the caller should set its shape mask.
  internal static func routeOverflowClip(_ view: UIView, _ path: CGPath?) -> Bool {
    guard let maskLayer = view.layer.mask as? MasonMaskLayer else { return false }
    maskLayer.setOverflowClip(path)
    return true
  }
}
