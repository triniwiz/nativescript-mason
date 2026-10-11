//
//  ClipPath.swift
//  Mason
//
//  CSS `clip-path` with the CSS Shapes 1 basic shapes. Resolved against the element's boxes at
//  layout and folded into the mask Mask.swift owns, so it composes with the other mask parts.
//

import UIKit
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

/// A `<length-percentage>` in points (CSS px) or a fraction.
enum CssLength: Equatable {
  case points(CGFloat)
  /// 0.5 = 50%.
  case percent(CGFloat)

  func resolve(_ basis: CGFloat) -> CGFloat {
    switch self {
    case .points(let p): return p
    case .percent(let f): return f * basis
    }
  }

  var isNegative: Bool {
    switch self {
    case .points(let p): return p < 0
    case .percent(let f): return f < 0
    }
  }

  /// As a border-radius length (`.Points` holds device px there).
  var mason: MasonLengthPercentage {
    switch self {
    case .points(let p): return .Points(Float(p) * NSCMason.scale)
    case .percent(let f): return .Percent(Float(f))
    }
  }

  /// `em` is the element's font size; other units go through the shared length scanner.
  static func parse(_ token: String, em: CGFloat) -> CssLength? {
    let t = token.lowercased()
    if t.hasSuffix("%") {
      guard let v = cssNumber(String(t.dropLast())) else { return nil }
      return .percent(v / 100)
    }
    if t.hasSuffix("em") && !t.hasSuffix("rem") {
      guard let v = cssNumber(String(t.dropLast(2))) else { return nil }
      return .points(v * em)
    }
    guard let lp = parseLengthPercentage(t) else { return nil }
    switch lp {
    case .Points(let p): return .points(CGFloat(p) / CGFloat(NSCMason.scale))
    case .Percent(let f): return .percent(CGFloat(f))
    case .Zero: return .points(0)
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

  static func parse(_ value: String) -> ClipBox? {
    switch value.lowercased() {
    case "border-box", "fill-box", "stroke-box", "view-box": return .borderBox
    case "padding-box": return .paddingBox
    case "content-box": return .contentBox
    case "margin-box": return .marginBox
    default: return nil
    }
  }
}

enum ClipRadius: Equatable {
  case closestSide
  case farthestSide
  case length(CssLength)

  static func parse(_ token: String, em: CGFloat) -> ClipRadius? {
    switch token.lowercased() {
    case "closest-side": return .closestSide
    case "farthest-side": return .farthestSide
    default:
      guard let l = CssLength.parse(token, em: em), !l.isNegative else { return nil }
      return .length(l)
    }
  }
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

  static func parse(_ name: String, _ args: String, em: CGFloat) -> ClipShape? {
    switch name {
    case "inset":
      guard let (lengths, radii) = splitRound(args, em: em), let values = expandCssBox(lengths) else { return nil }
      return .inset(values, radii: radii)
    case "rect":
      guard let (tokens, radii) = splitRoundTokens(args, em: em), tokens.count == 4 else { return nil }
      var edges: [CssLength?] = []
      for t in tokens {
        if t.lowercased() == "auto" { edges.append(nil); continue }
        guard let l = CssLength.parse(t, em: em) else { return nil }
        edges.append(l)
      }
      return .rect(edges, radii: radii)
    case "xywh":
      guard let (lengths, radii) = splitRound(args, em: em), lengths.count == 4,
            !lengths[2].isNegative, !lengths[3].isNegative else { return nil }
      return .xywh(x: lengths[0], y: lengths[1], width: lengths[2], height: lengths[3], radii: radii)
    case "circle":
      guard let (before, at) = splitAt(args) else { return nil }
      guard before.count <= 1 else { return nil }
      let radius = before.isEmpty ? .closestSide : ClipRadius.parse(before[0], em: em)
      guard let r = radius else { return nil }
      return .circle(r, at: at)
    case "ellipse":
      guard let (before, at) = splitAt(args) else { return nil }
      if before.isEmpty { return .ellipse(.closestSide, .closestSide, at: at) }
      guard before.count == 2, let rx = ClipRadius.parse(before[0], em: em),
            let ry = ClipRadius.parse(before[1], em: em) else { return nil }
      return .ellipse(rx, ry, at: at)
    case "polygon":
      var groups = splitCssCommaList(args).map { $0.trimmingCharacters(in: .whitespaces) }
      let evenOdd = fillRule(&groups)
      guard let evenOdd = evenOdd, !groups.isEmpty else { return nil }
      var points: [ClipPoint] = []
      for g in groups {
        let pair = splitCssValue(g)
        guard pair.count == 2, let x = CssLength.parse(pair[0], em: em), let y = CssLength.parse(pair[1], em: em) else { return nil }
        points.append(ClipPoint(x: x, y: y))
      }
      return .polygon(evenOdd: evenOdd, points: points)
    case "path":
      var groups = splitCssCommaList(args).map { $0.trimmingCharacters(in: .whitespaces) }
      guard let evenOdd = fillRule(&groups), groups.count == 1 else { return nil }
      let quoted = groups[0]
      guard quoted.count >= 2, let q = quoted.first, q == "\"" || q == "'", quoted.last == q else { return nil }
      let commands = parseSvgPathData(String(quoted.dropFirst().dropLast()))
      guard !commands.isEmpty else { return nil }
      return .path(evenOdd: evenOdd, commands: commands)
    default:
      return nil
    }
  }

  /// A leading `nonzero` / `evenodd` group is removed. Returns nil when the list is malformed
  /// (an empty group), else whether the rule is even-odd.
  private static func fillRule(_ groups: inout [String]) -> Bool? {
    if groups.contains(where: { $0.isEmpty }) { return nil }
    guard let first = groups.first?.lowercased() else { return nil }
    if first == "evenodd" || first == "nonzero" {
      groups.removeFirst()
      return first == "evenodd"
    }
    return false
  }

  /// Arguments before `round` and the radii after it.
  private static func splitRoundTokens(_ args: String, em: CGFloat) -> ([String], [ClipCorner]?)? {
    let tokens = splitCssValue(args, separators: ["/"])
    guard let round = tokens.firstIndex(where: { $0.lowercased() == "round" }) else {
      if tokens.contains("/") { return nil }
      return (tokens, nil)
    }
    let before = Array(tokens[..<round])
    if before.contains("/") { return nil }
    guard let radii = parseRadii(Array(tokens[(round + 1)...]), em: em) else { return nil }
    return (before, radii)
  }

  private static func splitRound(_ args: String, em: CGFloat) -> ([CssLength], [ClipCorner]?)? {
    guard let (tokens, radii) = splitRoundTokens(args, em: em), !tokens.isEmpty else { return nil }
    var lengths: [CssLength] = []
    for t in tokens {
      guard let l = CssLength.parse(t, em: em) else { return nil }
      lengths.append(l)
    }
    return (lengths, radii)
  }

  /// `<'border-radius'>`: 1-4 horizontal radii, optionally `/` 1-4 vertical ones; corners
  /// come back top-left, top-right, bottom-right, bottom-left.
  static func parseRadii(_ tokens: [String], em: CGFloat) -> [ClipCorner]? {
    let slash = tokens.firstIndex(of: "/")
    let hTokens = slash.map { Array(tokens[..<$0]) } ?? tokens
    let vTokens = slash.map { Array(tokens[($0 + 1)...]) }
    func lengths(_ ts: [String]) -> [CssLength]? {
      var out: [CssLength] = []
      for t in ts {
        guard t != "/", let l = CssLength.parse(t, em: em), !l.isNegative else { return nil }
        out.append(l)
      }
      return expandCssBox(out)
    }
    guard let h = lengths(hTokens) else { return nil }
    let v: [CssLength]
    if let vTokens = vTokens {
      guard let parsed = lengths(vTokens) else { return nil }
      v = parsed
    } else {
      v = h
    }
    return (0..<4).map { ClipCorner(x: h[$0], y: v[$0]) }
  }

  /// Tokens before `at`, and the position after it (nil when there is no `at`).
  private static func splitAt(_ args: String) -> ([String], BackgroundPosition?)? {
    let tokens = splitCssValue(args)
    guard let at = tokens.firstIndex(where: { $0.lowercased() == "at" }) else { return (tokens, nil) }
    let positionTokens = Array(tokens[(at + 1)...])
    guard !positionTokens.isEmpty, let position = parsePosition(positionTokens) else { return nil }
    return (Array(tokens[..<at]), position)
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
    let tokens = splitCssValue(value.trimmingCharacters(in: .whitespacesAndNewlines))
    guard !tokens.isEmpty, tokens.count <= 2 else { return nil }
    var shape: ClipShape? = nil
    var box: ClipBox? = nil
    for t in tokens {
      if let fn = cssFunction(t) {
        guard shape == nil, fn.name != "url", let s = ClipShape.parse(fn.name, fn.args, em: em) else { return nil }
        shape = s
      } else if let b = ClipBox.parse(t) {
        guard box == nil else { return nil }
        box = b
      } else {
        return nil
      }
    }
    return ClipPathValue(shape: shape, box: box ?? .borderBox)
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
                     width: w.resolve(ref.width), height: h.resolve(ref.height))
      return ClipPathValue.roundedRect(r, radii, renderer)
    case let .circle(radius, at):
      let c = ClipPathValue.center(at, ref)
      let dx = [abs(c.x - ref.minX), abs(ref.maxX - c.x)]
      let dy = [abs(c.y - ref.minY), abs(ref.maxY - c.y)]
      let r: CGFloat
      switch radius {
      case .closestSide: r = min(dx.min()!, dy.min()!)
      case .farthestSide: r = max(dx.max()!, dy.max()!)
      // A percentage is of the box's normalized diagonal.
      case .length(let l): r = l.resolve((ref.width * ref.width + ref.height * ref.height).squareRoot() / 2.0.squareRoot())
      }
      return CGPath(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r), transform: nil)
    case let .ellipse(rxValue, ryValue, at):
      let c = ClipPathValue.center(at, ref)
      func radius(_ value: ClipRadius, _ near: CGFloat, _ far: CGFloat, _ basis: CGFloat) -> CGFloat {
        switch value {
        case .closestSide: return min(near, far)
        case .farthestSide: return max(near, far)
        case .length(let l): return l.resolve(basis)
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
      CSSBorderRenderer.CornerRadius(horizontal: c[i].x.mason, vertical: c[i].y.mason, exponent: 1)
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
    guard let mask = view.layer.mask as? MasonMaskLayer, let shape = mask.clipShape else { return true }
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
