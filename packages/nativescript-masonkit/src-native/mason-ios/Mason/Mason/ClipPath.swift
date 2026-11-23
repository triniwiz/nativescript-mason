//
//  ClipPath.swift
//  Mason
//
//  CSS `clip-path` with the CSS Shapes 1 basic shapes. Resolved against the element's boxes at
//  layout and folded into the mask Mask.swift owns, so it composes with the other mask parts.
//

#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif
import CoreGraphics

// MARK: - CSS value helpers

/// Splits a CSS value on top-level whitespace; each character in `separators` (`,` or `/`)
/// becomes a token of its own. Parenthesised groups and quoted strings stay whole.
func splitCssValue(_ input: String, separators: Set<Character> = []) -> [String] {
  var tokens: [String] = []
  var current = ""
  var depth = 0
  var quote: Character? = nil
  func flush() {
    let t = current.trimmingCharacters(in: .whitespacesAndNewlines)
    if !t.isEmpty { tokens.append(t) }
    current = ""
  }
  for ch in input {
    if let q = quote {
      current.append(ch)
      if ch == q { quote = nil }
      continue
    }
    switch ch {
    case "\"", "'":
      quote = ch
      current.append(ch)
    case "(":
      depth += 1
      current.append(ch)
    case ")":
      depth = max(0, depth - 1)
      current.append(ch)
    default:
      if depth == 0 && (ch.isWhitespace || separators.contains(ch)) {
        flush()
        if separators.contains(ch) { tokens.append(String(ch)) }
      } else {
        current.append(ch)
      }
    }
  }
  flush()
  return tokens
}

/// Top-level comma-separated groups of a function's arguments (quotes and parentheses kept whole).
func splitCssCommaList(_ input: String) -> [String] {
  var groups: [String] = []
  var current: [String] = []
  for token in splitCssValue(input, separators: [","]) {
    if token == "," {
      groups.append(current.joined(separator: " "))
      current = []
    } else {
      current.append(token)
    }
  }
  groups.append(current.joined(separator: " "))
  return groups
}

/// `name(args)` -> lowercased name and the raw arguments; nil for anything else.
func cssFunction(_ token: String) -> (name: String, args: String)? {
  guard token.hasSuffix(")"), let open = token.firstIndex(of: "("), open > token.startIndex else { return nil }
  let name = token[..<open].trimmingCharacters(in: .whitespaces).lowercased()
  let args = token[token.index(after: open)..<token.index(before: token.endIndex)]
  return (name, String(args))
}

/// A finite plain number (no unit).
func cssNumber(_ token: String) -> CGFloat? {
  guard let v = Double(token), v.isFinite else { return nil }
  return CGFloat(v)
}

/// A projected clip-path length with optional Rust-owned math.
enum CssLength: Equatable {
  case points(CGFloat)
  /// 0.5 = 50%.
  case percent(CGFloat)
  case math(NativePaintOffset)

  func resolve(_ basis: CGFloat) -> CGFloat {
    switch self {
    case .points(let p): return p
    case .percent(let f): return f * basis
    case .math(let offset): return offset.resolve(basis: basis, units: nil)
    }
  }

  /// As a border-radius length (`.Points` holds device px there).
  func mason(basis: CGFloat) -> MasonLengthPercentage {
    switch self {
    case .points(let p): return .Points(Float(p) * NSCMason.scale)
    case .percent(let f): return .Percent(Float(f))
    case .math(let offset): return .Points(Float(max(0, offset.resolve(basis: basis, units: nil))) * NSCMason.scale)
    }
  }
}

/// TRBL / corner expansion of 1-4 values, as margin and border-radius do it.
func expandCssBox<T>(_ values: [T]) -> [T]? {
  switch values.count {
  case 1: return [values[0], values[0], values[0], values[0]]
  case 2: return [values[0], values[1], values[0], values[1]]
  case 3: return [values[0], values[1], values[2], values[1]]
  case 4: return values
  default: return nil
  }
}

// MARK: - Model

/// The reference box. HTML elements have no SVG boxes; CSS maps `fill-box`, `stroke-box` and
/// `view-box` to `border-box` for them.
enum ClipBox: Equatable {
  case borderBox
  case paddingBox
  case contentBox
  case marginBox
}

enum ClipRadius: Equatable {
  case closestSide
  case farthestSide
  case closestCorner
  case farthestCorner
  case length(CssLength)
}

struct ClipCorner: Equatable {
  var x: CssLength
  var y: CssLength
}

struct ClipPoint: Equatable {
  var x: CssLength
  var y: CssLength
}

enum ClipShape: Equatable {
  /// Insets from the reference box edges, top/right/bottom/left.
  case inset([CssLength], radii: [ClipCorner]?)
  /// Edge positions from the box's top and left edges; nil is `auto`.
  case rect([CssLength?], radii: [ClipCorner]?)
  case xywh(x: CssLength, y: CssLength, width: CssLength, height: CssLength, radii: [ClipCorner]?)
  case circle(ClipRadius, at: BackgroundPosition?)
  case ellipse(ClipRadius, ClipRadius, at: BackgroundPosition?)
  case polygon(evenOdd: Bool, points: [ClipPoint])
  case path(evenOdd: Bool, commands: [SvgPathCommand])

  var evenOdd: Bool {
    switch self {
    case .polygon(let e, _), .path(let e, _): return e
    default: return false
    }
  }
}

/// The element's boxes in its own coordinates (the border box starts at the origin).
struct ClipReferenceBoxes {
  var border: CGRect
  var borderWidths: UIEdgeInsets = .zero
  var padding: UIEdgeInsets = .zero
  var margin: UIEdgeInsets = .zero

  func rect(_ box: ClipBox) -> CGRect {
    switch box {
    case .borderBox: return border
    case .paddingBox: return border.inset(by: borderWidths)
    case .contentBox: return border.inset(by: borderWidths).inset(by: padding)
    case .marginBox:
      return border.inset(by: UIEdgeInsets(top: -margin.top, left: -margin.left, bottom: -margin.bottom, right: -margin.right))
    }
  }
}

/// A parsed `clip-path`: a basic shape, a reference box, or both. `none`, `url()` and invalid
/// values parse to nil (an SVG `<clipPath>` reference has nothing to point at here, and CSS
/// ignores a reference that does not resolve).
struct ClipPathValue: Equatable {
  var shape: ClipShape?
  var box: ClipBox = .borderBox

  var evenOdd: Bool { shape?.evenOdd ?? false }

  static func parse(_ value: String, em: CGFloat = 16) -> ClipPathValue? {
    NativeClipPath(value)?.project(em: em)
  }

  /// The clip path in the element's coordinates. `renderer` supplies the element's border radii
  /// (a box alone clips to that box's rounded shape) and the rounded-rect builder.
  func path(_ boxes: ClipReferenceBoxes, renderer: CSSBorderRenderer) -> CGPath {
    let ref = boxes.rect(box)
    guard let shape = shape else { return boxPath(boxes, renderer: renderer) }
    switch shape {
    case let .inset(v, radii):
      var top = v[0].resolve(ref.height), bottom = v[2].resolve(ref.height)
      var left = v[3].resolve(ref.width), right = v[1].resolve(ref.width)
      // Insets that overlap are reduced in proportion until they meet.
      if top + bottom > ref.height, top + bottom > 0 {
        let f = ref.height / (top + bottom)
        top *= f
        bottom *= f
      }
      if left + right > ref.width, left + right > 0 {
        let f = ref.width / (left + right)
        left *= f
        right *= f
      }
      let r = CGRect(x: ref.minX + left, y: ref.minY + top, width: ref.width - left - right, height: ref.height - top - bottom)
      return ClipPathValue.roundedRect(r, radii, renderer)
    case let .rect(edges, radii):
      let top = edges[0]?.resolve(ref.height) ?? 0
      let left = edges[3]?.resolve(ref.width) ?? 0
      // The right and bottom edges never cross the left and top ones.
      let right = max(edges[1]?.resolve(ref.width) ?? ref.width, left)
      let bottom = max(edges[2]?.resolve(ref.height) ?? ref.height, top)
      let r = CGRect(x: ref.minX + left, y: ref.minY + top, width: right - left, height: bottom - top)
      return ClipPathValue.roundedRect(r, radii, renderer)
    case let .xywh(x, y, w, h, radii):
      let r = CGRect(x: ref.minX + x.resolve(ref.width), y: ref.minY + y.resolve(ref.height),
                     width: max(0, w.resolve(ref.width)), height: max(0, h.resolve(ref.height)))
      return ClipPathValue.roundedRect(r, radii, renderer)
    case let .circle(radius, at):
      let c = ClipPathValue.center(at, ref)
      let dx = [abs(c.x - ref.minX), abs(ref.maxX - c.x)]
      let dy = [abs(c.y - ref.minY), abs(ref.maxY - c.y)]
      let r: CGFloat
      switch radius {
      case .closestSide: r = min(dx.min()!, dy.min()!)
      case .farthestSide: r = max(dx.max()!, dy.max()!)
      case .closestCorner: r = hypot(dx.min()!, dy.min()!)
      case .farthestCorner: r = hypot(dx.max()!, dy.max()!)
      // A percentage is of the box's normalized diagonal.
      case .length(let l): r = max(0, l.resolve(hypot(ref.width, ref.height) / 2.0.squareRoot()))
      }
      return CGPath(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r), transform: nil)
    case let .ellipse(rxValue, ryValue, at):
      let c = ClipPathValue.center(at, ref)
      func radius(_ value: ClipRadius, _ near: CGFloat, _ far: CGFloat, _ basis: CGFloat) -> CGFloat {
        switch value {
        case .closestSide: return min(near, far)
        case .farthestSide: return max(near, far)
        case .closestCorner: return min(near, far) * 2.0.squareRoot()
        case .farthestCorner: return max(near, far) * 2.0.squareRoot()
        case .length(let l): return max(0, l.resolve(basis))
        }
      }
      let rx = radius(rxValue, abs(c.x - ref.minX), abs(ref.maxX - c.x), ref.width)
      let ry = radius(ryValue, abs(c.y - ref.minY), abs(ref.maxY - c.y), ref.height)
      return CGPath(ellipseIn: CGRect(x: c.x - rx, y: c.y - ry, width: 2 * rx, height: 2 * ry), transform: nil)
    case let .polygon(_, points):
      let path = CGMutablePath()
      path.addLines(between: points.map { CGPoint(x: ref.minX + $0.x.resolve(ref.width), y: ref.minY + $0.y.resolve(ref.height)) })
      path.closeSubpath()
      return path
    case let .path(_, commands):
      // Path data is in CSS px from the reference box's origin.
      var t = CGAffineTransform(translationX: ref.minX, y: ref.minY)
      return svgCGPath(commands).copy(using: &t) ?? CGMutablePath()
    }
  }

  /// The reference box on its own: its rounded shape (inner radii for padding/content).
  private func boxPath(_ boxes: ClipReferenceBoxes, renderer: CSSBorderRenderer) -> CGPath {
    let ref = boxes.rect(box)
    guard ref.width > 0, ref.height > 0 else { return CGMutablePath() }
    guard renderer.hasRadii() else { return CGPath(rect: ref, transform: nil) }
    let bw = boxes.borderWidths, p = boxes.padding, m = boxes.margin
    let radius: CSSBorderRenderer.BorderRadius
    switch box {
    case .borderBox: radius = renderer.radius
    case .paddingBox: radius = renderer.radius.insetByBorderWidths((bw.top, bw.right, bw.bottom, bw.left))
    case .contentBox:
      radius = renderer.radius.insetByBorderWidths((bw.top + p.top, bw.right + p.right, bw.bottom + p.bottom, bw.left + p.left))
    case .marginBox:
      // The margin box's corners grow by the margin, as shape-outside's do.
      radius = renderer.radius.insetByBorderWidths((-m.top, -m.right, -m.bottom, -m.left))
    }
    return renderer.buildRoundedPath(in: ref, radius: radius).cgPath
  }

  private static func roundedRect(_ r: CGRect, _ radii: [ClipCorner]?, _ renderer: CSSBorderRenderer) -> CGPath {
    guard r.width > 0, r.height > 0 else { return CGMutablePath() }
    guard let c = radii else { return CGPath(rect: r, transform: nil) }
    func corner(_ i: Int) -> CSSBorderRenderer.CornerRadius {
      CSSBorderRenderer.CornerRadius(horizontal: c[i].x.mason(basis: r.width),
                                     vertical: c[i].y.mason(basis: r.height), exponent: 1)
    }
    let radius = CSSBorderRenderer.BorderRadius(topLeft: corner(0), topRight: corner(1), bottomRight: corner(2), bottomLeft: corner(3))
    return renderer.buildRoundedPath(in: r, radius: radius).cgPath
  }

  /// `at <position>` in the reference box; the centre when omitted.
  private static func center(_ at: BackgroundPosition?, _ ref: CGRect) -> CGPoint {
    guard let p = at else { return CGPoint(x: ref.midX, y: ref.midY) }
    return CGPoint(x: ref.minX + p.x.resolve(area: ref.width, drawSize: 0), y: ref.minY + p.y.resolve(area: ref.height, drawSize: 0))
  }
}

final class NativeClipPath {
  let handle: OpaquePointer

  init?(_ value: String) {
    guard let handle = value.withCString({ mason_css_clip_path_parse($0) }) else { return nil }
    self.handle = handle
  }

  deinit { mason_css_clip_path_release(handle) }

  static func install(_ clip: NativeClipPath?, on style: MasonStyle) {
    let node = style.node
    guard !node.isPlaceholder else { return }
    let mason = node.mason
    if mason.inCompute { mason.deferStyleRecords(style) }
    else { style.prepareMut() }
    mason_css_clip_path_install(mason.inCompute ? nil : mason.nativePtr, node.nativePtr, clip?.handle)
  }

  func project(em: CGFloat) -> ClipPathValue? {
    let scale = NSCMason.scale
    let viewport = NSCMason.viewportSize
    let result = mason_css_clip_path_records(handle, scale, Float(em), NSCMason.rootFontSize,
                                            Float(viewport.width), Float(viewport.height))
    defer { mason_css_values_release(result) }
    let records = UnsafeBufferPointer(start: result.values, count: Int(result.len))
    let box: ClipBox = [.borderBox, .paddingBox, .contentBox, .marginBox][Int(records[ClipPathRecord.box])]
    let evenOdd = records[ClipPathRecord.evenOdd] != 0
    let args = records.dropFirst(ClipPathRecord.stride)
    let hasMath = records[ClipPathRecord.hasMath] != 0
    func pair(_ index: Int) -> (fraction: CGFloat, pixels: CGFloat) {
      let offset = ClipPathRecord.stride + index * 2
      return (CGFloat(records[offset]), CGFloat(records[offset + 1]))
    }
    func length(_ index: Int) -> CssLength {
      if let offset = math(index) { return .math(offset) }
      let (fraction, pixels) = pair(index)
      return fraction == 0 ? .points(pixels / CGFloat(scale)) : .percent(fraction)
    }
    func math(_ index: Int) -> NativePaintOffset? {
      guard hasMath, let offset = mason_css_clip_path_offset(handle, UInt(index), scale, Float(em),
        NSCMason.rootFontSize, Float(viewport.width), Float(viewport.height)) else { return nil }
      return NativePaintOffset(owned: offset)
    }
    func position(_ index: Int) -> BackgroundOffset {
      let (fraction, pixels) = pair(index)
      return BackgroundOffset(fraction: fraction, px: pixels, math: math(index))
    }
    func center() -> BackgroundPosition? {
      guard records[ClipPathRecord.hasPosition] != 0 else { return nil }
      return BackgroundPosition(x: position(0), y: position(1))
    }
    func radius(_ kind: Int, _ index: Int) -> ClipRadius {
      switch Int(records[kind]) {
      case 1: return .closestSide
      case 2: return .farthestSide
      case 3: return .closestCorner
      case 4: return .farthestCorner
      default: return .length(length(index))
      }
    }
    func corners() -> [ClipCorner]? {
      guard args.count > 8 else { return nil }
      return (0..<4).map { ClipCorner(x: length(4 + $0 * 2), y: length(5 + $0 * 2)) }
    }

    let shape: ClipShape?
    switch Int(records[ClipPathRecord.kind]) {
    case 0: shape = nil
    case 1: shape = .inset((0..<4).map(length), radii: corners())
    case 2: shape = .rect((0..<4).map { pair($0).fraction.isNaN ? nil : length($0) }, radii: corners())
    case 3: shape = .xywh(x: length(0), y: length(1), width: length(2), height: length(3), radii: corners())
    case 4:
      shape = .circle(radius(ClipPathRecord.radiusXKind, 2), at: center())
    case 5:
      shape = .ellipse(radius(ClipPathRecord.radiusXKind, 2), radius(ClipPathRecord.radiusYKind, 3),
                       at: center())
    case 6:
      shape = .polygon(evenOdd: evenOdd, points: (0..<(args.count / 4)).map {
        ClipPoint(x: length($0 * 2), y: length($0 * 2 + 1))
      })
    case 7:
      shape = .path(evenOdd: evenOdd, commands: decodeSvgPathRecords(records, offset: ClipPathRecord.stride))
    default: return nil
    }
    return ClipPathValue(shape: shape, box: box)
  }
}

// MARK: - Style hookup

extension MasonStyle {
  /// The element's boxes from its computed layout (device px), in points.
  internal func clipReferenceBoxes(size: CGSize) -> ClipReferenceBoxes {
    let scale = CGFloat(NSCMason.scale)
    let l = node.computedLayout
    func insets(_ t: Float, _ r: Float, _ b: Float, _ lft: Float) -> UIEdgeInsets {
      UIEdgeInsets(top: CGFloat(t) / scale, left: CGFloat(lft) / scale, bottom: CGFloat(b) / scale, right: CGFloat(r) / scale)
    }
    return ClipReferenceBoxes(border: CGRect(origin: .zero, size: size),
                              borderWidths: insets(l.borderTop, l.borderRight, l.borderBottom, l.borderLeft),
                              padding: insets(l.paddingTop, l.paddingRight, l.paddingBottom, l.paddingLeft),
                              margin: insets(l.marginTop, l.marginRight, l.marginBottom, l.marginLeft))
  }

  /// The element's own font size for `em`, falling back to the root size.
  internal var emBasis: CGFloat {
    let size = CGFloat(fontSize)
    return size > 0 ? size : CGFloat(NSCMason.rootFontSize)
  }

  /// False when `point` (view coordinates) lies outside the view's `clip-path`: CSS gives
  /// clipped-out regions no pointer events. True for every view without one.
  internal static func clipPathAllows(_ view: UIView, _ point: CGPoint) -> Bool {
    guard let mask = view.backingLayer.mask as? MasonMaskLayer, let shape = mask.clipShape else { return true }
    let p = CGPoint(x: point.x - view.bounds.minX, y: point.y - view.bounds.minY)
    return shape.contains(p, using: mask.clipEvenOdd ? .evenOdd : .winding)
  }
}

// MARK: - Hit testing

// Touches outside an element's clip-path miss it and everything inside it, as CSS hit testing does.
extension MasonUIView {
  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    super.point(inside: point, with: event) && MasonStyle.clipPathAllows(self, point)
  }
}

extension Scroll {
  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    super.point(inside: point, with: event) && MasonStyle.clipPathAllows(self, point)
  }
}

extension MasonText {
  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    super.point(inside: point, with: event) && MasonStyle.clipPathAllows(self, point)
  }
}

extension Button {
  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    super.point(inside: point, with: event) && MasonStyle.clipPathAllows(self, point)
  }
}

extension Img {
  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    super.point(inside: point, with: event) && MasonStyle.clipPathAllows(self, point)
  }
}

extension MasonInput {
  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    super.point(inside: point, with: event) && MasonStyle.clipPathAllows(self, point)
  }
}

extension MasonLi {
  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    super.point(inside: point, with: event) && MasonStyle.clipPathAllows(self, point)
  }
}

extension MasonList {
  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    super.point(inside: point, with: event) && MasonStyle.clipPathAllows(self, point)
  }
}
