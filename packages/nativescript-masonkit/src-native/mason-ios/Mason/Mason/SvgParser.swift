//
//  SvgParser.swift
//  Mason
//
//  Static SVG reader for `data:image/svg+xml` (Background.swift draws). No filters, <textPath>, nested <svg>
//  or remote references. Keep in step with SvgParser.kt.
//

import UIKit
import CoreGraphics

/// One absolute path segment. Arcs, H/V, S and T are already normalised away.
enum SvgPathCommand: Equatable {
  case move(CGFloat, CGFloat)
  case line(CGFloat, CGFloat)
  case cubic(CGFloat, CGFloat, CGFloat, CGFloat, CGFloat, CGFloat)
  case quad(CGFloat, CGFloat, CGFloat, CGFloat)
  case close

  var endPoint: CGPoint? {
    switch self {
    case let .move(x, y), let .line(x, y): return CGPoint(x: x, y: y)
    case let .cubic(_, _, _, _, x, y): return CGPoint(x: x, y: y)
    case let .quad(_, _, x, y): return CGPoint(x: x, y: y)
    case .close: return nil
    }
  }
}

enum SvgPaint: Equatable {
  case none
  /// The element's CSS `color`, supplied when rendering.
  case currentColor
  /// 0xAARRGGBB
  case color(UInt32)
  /// A gradient in the shape's own user space.
  case gradient(SvgGradient)
  /// A `<pattern>` tile in the shape's own user space.
  case pattern(SvgPattern)
  /// `url(#id)` while parsing, resolved per shape; never reaches a shape.
  indirect case ref(String, fallback: SvgPaint?)
}

enum SvgSpread { case pad, reflect, `repeat` }

/// `offset` in 0...1; `argb` includes stop-opacity. With `currentColor` only its alpha is used.
struct SvgGradientStop: Equatable {
  var offset: CGFloat
  var argb: UInt32
  var currentColor = false
}

struct SvgGradient: Equatable {
  var radial: Bool
  /// Linear: the gradient vector.
  var x1: CGFloat, y1: CGFloat, x2: CGFloat, y2: CGFloat
  /// Radial: the end circle and the focal point.
  var cx: CGFloat, cy: CGFloat, r: CGFloat, fx: CGFloat, fy: CGFloat
  var stops: [SvgGradientStop]
  var spread: SvgSpread
  /// Gradient space to the shape's user space (bounding-box units and gradientTransform).
  var transform: CGAffineTransform
}

/// A `<pattern>` resolved for one shape: `ops` draw one `width` x `height` tile, and `transform` maps
/// tile space (origin at a tile corner) to the shape's user space.
final class SvgPattern: Equatable {
  let width: CGFloat
  let height: CGFloat
  let transform: CGAffineTransform
  let ops: [SvgOp]

  init(width: CGFloat, height: CGFloat, transform: CGAffineTransform, ops: [SvgOp]) {
    self.width = width
    self.height = height
    self.transform = transform
    self.ops = ops
  }

  static func == (a: SvgPattern, b: SvgPattern) -> Bool { a === b }
}

/// A `<mask>` resolved for one element: `ops` (root user space) inside `region`, read as luminance
/// or alpha.
final class SvgMask {
  let ops: [SvgOp]
  let region: SvgClip
  let luminance: Bool

  init(ops: [SvgOp], region: SvgClip, luminance: Bool) {
    self.ops = ops
    self.region = region
    self.luminance = luminance
  }
}

/// One clip shape, with the transform to root user space.
struct SvgClipPath {
  var commands: [SvgPathCommand]
  var transform: CGAffineTransform
  var evenOdd: Bool
}

/// A clip region: the union of its paths.
final class SvgClip {
  let paths: [SvgClipPath]
  init(_ paths: [SvgClipPath]) { self.paths = paths }
}

/// An `<image>`; nil `width`/`height` means the image's own size.
struct SvgImage {
  var href: String
  var x: CGFloat, y: CGFloat
  var width: CGFloat?, height: CGFloat?
  var alignX: Int?, alignY: Int?
  var slice: Bool
  var transform: CGAffineTransform
  var opacity: CGFloat
}

enum SvgLineCap { case butt, round, square }
enum SvgLineJoin { case miter, round, bevel }

/// A paintable shape in the root's user space (`transform` maps it there).
struct SvgShape {
  var commands: [SvgPathCommand]
  var transform: CGAffineTransform
  var fill: SvgPaint
  var fillOpacity: CGFloat
  var evenOdd: Bool
  var stroke: SvgPaint
  var strokeOpacity: CGFloat
  var strokeWidth: CGFloat
  var lineCap: SvgLineCap
  var lineJoin: SvgLineJoin
  var miterLimit: CGFloat
  var dashArray: [CGFloat]?
  var dashOffset: CGFloat

  var hasFill: Bool { fill != .none && fillOpacity > 0 }
  var hasStroke: Bool { stroke != .none && strokeOpacity > 0 && strokeWidth > 0 }
}

enum SvgOp {
  case shape(SvgShape)
  /// Children until the matching `endGroup` composite as one layer at this opacity.
  case beginGroup(CGFloat)
  case endGroup
  /// Children until the matching `endClip` are clipped to the clip.
  case beginClip(SvgClip)
  case endClip
  case image(SvgImage)
  /// `content` drawn through the mask.
  case masked(SvgMask, [SvgOp])
}

final class SvgDocument {
  /// Intrinsic size in CSS px.
  let width: CGFloat
  let height: CGFloat
  let viewBox: CGRect?
  /// nil = `none`, else xMin/xMid/xMax (and y) as -1/0/1.
  let alignX: Int?
  let alignY: Int?
  let slice: Bool
  let ops: [SvgOp]
  /// Some paint still needs the element's CSS `color`.
  let usesCurrentColor: Bool

  init(width: CGFloat, height: CGFloat, viewBox: CGRect?, alignX: Int?, alignY: Int?, slice: Bool, ops: [SvgOp], usesCurrentColor: Bool) {
    self.width = width
    self.height = height
    self.viewBox = viewBox
    self.alignX = alignX
    self.alignY = alignY
    self.slice = slice
    self.ops = ops
    self.usesCurrentColor = usesCurrentColor
  }

  var shapes: [SvgShape] {
    ops.compactMap { if case let .shape(s) = $0 { return s } else { return nil } }
  }

  /// The affine that maps root user space onto an `outW` x `outH` viewport.
  func viewportTransform(_ outW: CGFloat, _ outH: CGFloat) -> CGAffineTransform {
    guard let vb = viewBox else {
      return CGAffineTransform(a: outW / width, b: 0, c: 0, d: outH / height, tx: 0, ty: 0)
    }
    return svgViewBoxTransform(vb, alignX, alignY, slice, outW, outH)
  }
}

/// Maps viewBox `vb` onto an `outW` x `outH` viewport per preserveAspectRatio.
func svgViewBoxTransform(_ vb: CGRect, _ alignX: Int?, _ alignY: Int?, _ slice: Bool, _ outW: CGFloat, _ outH: CGFloat) -> CGAffineTransform {
  let sx = outW / vb.width
  let sy = outH / vb.height
  guard let ax = alignX, let ay = alignY else {
    return CGAffineTransform(a: sx, b: 0, c: 0, d: sy, tx: 0 - vb.minX * sx, ty: 0 - vb.minY * sy)
  }
  let s = slice ? max(sx, sy) : min(sx, sy)
  let tx = 0 - vb.minX * s + (outW - vb.width * s) * CGFloat(ax + 1) / 2
  let ty = 0 - vb.minY * s + (outH - vb.height * s) * CGFloat(ay + 1) / 2
  return CGAffineTransform(a: s, b: 0, c: 0, d: s, tx: tx, ty: ty)
}

// MARK: - Number scanning

private let chSpace = UInt8(ascii: " "), chTab = UInt8(ascii: "\t"), chLF = UInt8(ascii: "\n"),
  chCR = UInt8(ascii: "\r"), chFF: UInt8 = 0x0C
private let chComma = UInt8(ascii: ","), chDot = UInt8(ascii: "."), chPlus = UInt8(ascii: "+"),
  chMinus = UInt8(ascii: "-"), chZero = UInt8(ascii: "0"), chOne = UInt8(ascii: "1"),
  chNine = UInt8(ascii: "9"), chE = UInt8(ascii: "e"), chUpperE = UInt8(ascii: "E")

@inline(__always) private func isSvgWsp(_ c: UInt8) -> Bool {
  c == chSpace || c == chTab || c == chLF || c == chCR || c == chFF
}

@inline(__always) private func isDigit(_ c: UInt8) -> Bool { c >= chZero && c <= chNine }

struct SvgScanner {
  let s: [UInt8]
  var i = 0

  init(_ string: String) { s = Array(string.utf8) }

  var atEnd: Bool { i >= s.count }
  var peek: UInt8 { s[i] }

  mutating func skipWsp() {
    while i < s.count && isSvgWsp(s[i]) { i += 1 }
  }

  mutating func skipCommaWsp() {
    skipWsp()
    if i < s.count && s[i] == chComma {
      i += 1
      skipWsp()
    }
  }

  /// An SVG number: `-1`, `.5`, `1.5` (so `1.5.5` is two numbers), `1e-3`.
  mutating func number() -> Double? {
    let n = s.count
    let start = i
    var j = i
    if j < n && (s[j] == chPlus || s[j] == chMinus) { j += 1 }
    var digits = 0
    while j < n && isDigit(s[j]) { j += 1; digits += 1 }
    if j < n && s[j] == chDot {
      j += 1
      while j < n && isDigit(s[j]) { j += 1; digits += 1 }
    }
    if digits == 0 { return nil }
    if j < n && (s[j] == chE || s[j] == chUpperE) {
      var k = j + 1
      if k < n && (s[k] == chPlus || s[k] == chMinus) { k += 1 }
      if k < n && isDigit(s[k]) {
        while k < n && isDigit(s[k]) { k += 1 }
        j = k
      }
    }
    guard let v = Double(String(decoding: s[start..<j], as: UTF8.self)) else { return nil }
    i = j
    return v
  }

  /// An arc flag: a single `0` or `1`, which needs no separator from what follows.
  mutating func flag() -> Bool? {
    guard i < s.count, s[i] == chZero || s[i] == chOne else { return nil }
    defer { i += 1 }
    return s[i] == chOne
  }

  /// Whatever follows the current position, as a string.
  var rest: String { String(decoding: s[min(i, s.count)...], as: UTF8.self) }
}

/// Every number in a list such as `points`, `viewBox` or `stroke-dasharray`.
func parseSvgNumberList(_ value: String) -> [Double] {
  var sc = SvgScanner(value)
  var out: [Double] = []
  sc.skipWsp()
  while !sc.atEnd {
    guard let v = sc.number() else { break }
    out.append(v)
    sc.skipCommaWsp()
  }
  return out
}

// MARK: - Path data

private let pathCommandBytes = Set("MmLlHhVvCcSsQqTtAaZz".utf8)

/// Parse SVG path data into absolute commands. On an error the path is kept up to the last
/// complete segment, as SVG requires.
func parseSvgPathData(_ d: String) -> [SvgPathCommand] {
  var ends: [Bool] = []
  return parseSvgPathData(d, vertexEnds: &ends)
}

/// As `parseSvgPathData(_:)`; `vertexEnds[i]` is false where command i ends inside an arc, which
/// is not a path vertex (markers skip it).
func parseSvgPathData(_ d: String, vertexEnds: inout [Bool]) -> [SvgPathCommand] {
  var out: [SvgPathCommand] = []
  var arcInner: [Int] = []
  var sc = SvgScanner(d)
  var cmd: UInt8 = 0
  var cx = 0.0, cy = 0.0, sx = 0.0, sy = 0.0
  // Last cubic second control point / quadratic control point, for S and T reflection.
  var lastCubic = false, lastQuad = false
  var ctrlX = 0.0, ctrlY = 0.0
  var needMove = false

  func ensureMove() {
    if needMove {
      out.append(.move(CGFloat(cx), CGFloat(cy)))
      needMove = false
    }
  }

  sc.skipWsp()
  loop: while !sc.atEnd {
    let c = sc.peek
    if pathCommandBytes.contains(c) {
      cmd = c
      sc.i += 1
      sc.skipWsp()
    } else if cmd == 0 || cmd == UInt8(ascii: "Z") || cmd == UInt8(ascii: "z") {
      break // a number where a command letter must be
    }
    if out.isEmpty && cmd != UInt8(ascii: "M") && cmd != UInt8(ascii: "m") { break } // must start with a moveto
    let rel = cmd >= UInt8(ascii: "a")
    let ox = rel ? cx : 0
    let oy = rel ? cy : 0
    switch Character(Unicode.Scalar(cmd)) {
    case "M", "m":
      guard let x = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let y = sc.number() else { break loop }
      cx = ox + x; cy = oy + y
      sx = cx; sy = cy
      out.append(.move(CGFloat(cx), CGFloat(cy)))
      needMove = false
      lastCubic = false; lastQuad = false
      cmd = rel ? UInt8(ascii: "l") : UInt8(ascii: "L") // further pairs are implicit linetos

    case "L", "l":
      guard let x = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let y = sc.number() else { break loop }
      ensureMove()
      cx = ox + x; cy = oy + y
      out.append(.line(CGFloat(cx), CGFloat(cy)))
      lastCubic = false; lastQuad = false

    case "H", "h":
      guard let x = sc.number() else { break loop }
      ensureMove()
      cx = ox + x
      out.append(.line(CGFloat(cx), CGFloat(cy)))
      lastCubic = false; lastQuad = false

    case "V", "v":
      guard let y = sc.number() else { break loop }
      ensureMove()
      cy = oy + y
      out.append(.line(CGFloat(cx), CGFloat(cy)))
      lastCubic = false; lastQuad = false

    case "C", "c", "S", "s":
      let smooth = cmd == UInt8(ascii: "S") || cmd == UInt8(ascii: "s")
      var x1 = cx, y1 = cy
      if smooth {
        if lastCubic { x1 = 2 * cx - ctrlX; y1 = 2 * cy - ctrlY }
      } else {
        guard let a = sc.number() else { break loop }
        sc.skipCommaWsp()
        guard let b = sc.number() else { break loop }
        sc.skipCommaWsp()
        x1 = ox + a; y1 = oy + b
      }
      guard let a2 = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let b2 = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let a3 = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let b3 = sc.number() else { break loop }
      let x2 = ox + a2, y2 = oy + b2, x = ox + a3, y = oy + b3
      ensureMove()
      out.append(.cubic(CGFloat(x1), CGFloat(y1), CGFloat(x2), CGFloat(y2), CGFloat(x), CGFloat(y)))
      ctrlX = x2; ctrlY = y2
      cx = x; cy = y
      lastCubic = true; lastQuad = false

    case "Q", "q", "T", "t":
      let smooth = cmd == UInt8(ascii: "T") || cmd == UInt8(ascii: "t")
      var x1 = cx, y1 = cy
      if smooth {
        if lastQuad { x1 = 2 * cx - ctrlX; y1 = 2 * cy - ctrlY }
      } else {
        guard let a = sc.number() else { break loop }
        sc.skipCommaWsp()
        guard let b = sc.number() else { break loop }
        sc.skipCommaWsp()
        x1 = ox + a; y1 = oy + b
      }
      guard let a2 = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let b2 = sc.number() else { break loop }
      let x = ox + a2, y = oy + b2
      ensureMove()
      out.append(.quad(CGFloat(x1), CGFloat(y1), CGFloat(x), CGFloat(y)))
      ctrlX = x1; ctrlY = y1
      cx = x; cy = y
      lastCubic = false; lastQuad = true

    case "A", "a":
      guard let rx = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let ry = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let rot = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let large = sc.flag() else { break loop }
      sc.skipCommaWsp()
      guard let sweep = sc.flag() else { break loop }
      sc.skipCommaWsp()
      guard let a = sc.number() else { break loop }
      sc.skipCommaWsp()
      guard let b = sc.number() else { break loop }
      let x = ox + a, y = oy + b
      ensureMove()
      let before = out.count
      appendSvgArc(&out, cx, cy, rx, ry, rot, large, sweep, x, y)
      if out.count - before > 1 { arcInner.append(contentsOf: before..<(out.count - 1)) }
      cx = x; cy = y
      lastCubic = false; lastQuad = false

    case "Z", "z":
      out.append(.close)
      cx = sx; cy = sy
      needMove = true // a drawing command straight after Z starts at the subpath start
      lastCubic = false; lastQuad = false

    default:
      break loop
    }
    sc.skipCommaWsp()
  }
  vertexEnds = [Bool](repeating: true, count: out.count)
  for i in arcInner { vertexEnds[i] = false }
  return out
}

/// An elliptical arc from (x1, y1) to (x2, y2) as cubic Béziers: endpoint to centre
/// parameterisation per SVG 1.1 F.6.5, radii scaled up per F.6.6, then at most 90° per cubic.
func appendSvgArc(_ out: inout [SvgPathCommand], _ x1: Double, _ y1: Double, _ rxIn: Double, _ ryIn: Double,
                  _ angleDeg: Double, _ largeArc: Bool, _ sweep: Bool, _ x2: Double, _ y2: Double) {
  if x1 == x2 && y1 == y2 { return }
  var rx = abs(rxIn), ry = abs(ryIn)
  if rx == 0 || ry == 0 {
    out.append(.line(CGFloat(x2), CGFloat(y2)))
    return
  }
  let phi = angleDeg.truncatingRemainder(dividingBy: 360) * .pi / 180
  let cosPhi = cos(phi), sinPhi = sin(phi)
  let dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2
  let x1p = cosPhi * dx2 + sinPhi * dy2
  let y1p = -sinPhi * dx2 + cosPhi * dy2
  let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if lambda > 1 {
    let s = lambda.squareRoot()
    rx *= s; ry *= s
  }
  let rx2 = rx * rx, ry2 = ry * ry
  let num = rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p
  let den = rx2 * y1p * y1p + ry2 * x1p * x1p
  var coef = den == 0 ? 0 : max(0, num / den).squareRoot()
  if largeArc == sweep { coef = -coef }
  let cxp = coef * (rx * y1p / ry)
  let cyp = coef * -(ry * x1p / rx)
  let cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2
  let cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2
  let ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry
  let vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry
  let theta1 = atan2(uy, ux)
  var dTheta = atan2(ux * vy - uy * vx, ux * vx + uy * vy)
  if !sweep && dTheta > 0 { dTheta -= 2 * .pi } else if sweep && dTheta < 0 { dTheta += 2 * .pi }

  let segments = max(1, Int((abs(dTheta) / (.pi / 2) - 1e-7).rounded(.up)))
  let delta = dTheta / Double(segments)
  let t = 4.0 / 3.0 * tan(delta / 4)
  func mapX(_ u: Double, _ v: Double) -> Double { cx + rx * cosPhi * u - ry * sinPhi * v }
  func mapY(_ u: Double, _ v: Double) -> Double { cy + rx * sinPhi * u + ry * cosPhi * v }
  var a1 = theta1
  for i in 0..<segments {
    let a2 = a1 + delta
    let c1 = cos(a1), s1 = sin(a1), c2 = cos(a2), s2 = sin(a2)
    let last = i == segments - 1
    out.append(.cubic(
      CGFloat(mapX(c1 - t * s1, s1 + t * c1)), CGFloat(mapY(c1 - t * s1, s1 + t * c1)),
      CGFloat(mapX(c2 + t * s2, s2 - t * c2)), CGFloat(mapY(c2 + t * s2, s2 - t * c2)),
      CGFloat(last ? x2 : mapX(c2, s2)), CGFloat(last ? y2 : mapY(c2, s2))
    ))
    a1 = a2
  }
}

// MARK: - Basic shapes

private let kappa: CGFloat = 0.5522847498307936

func svgEllipseCommands(_ cx: CGFloat, _ cy: CGFloat, _ rx: CGFloat, _ ry: CGFloat) -> [SvgPathCommand] {
  guard rx > 0, ry > 0 else { return [] }
  let kx = kappa * rx, ky = kappa * ry
  return [
    .move(cx + rx, cy),
    .cubic(cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry),
    .cubic(cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy),
    .cubic(cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry),
    .cubic(cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy),
    .close,
  ]
}

/// A rect, rounded when rx/ry are given; a missing one copies the other, both clamp to half.
func svgRectCommands(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ rxIn: CGFloat?, _ ryIn: CGFloat?) -> [SvgPathCommand] {
  guard w > 0, h > 0 else { return [] }
  var rx = rxIn.flatMap { $0 >= 0 ? $0 : nil }
  var ry = ryIn.flatMap { $0 >= 0 ? $0 : nil }
  if rx == nil { rx = ry ?? 0 }
  if ry == nil { ry = rx }
  let rxv = min(rx!, w / 2), ryv = min(ry!, h / 2)
  if rxv <= 0 || ryv <= 0 {
    return [.move(x, y), .line(x + w, y), .line(x + w, y + h), .line(x, y + h), .close]
  }
  let kx = kappa * rxv, ky = kappa * ryv
  let r = x + w, b = y + h
  return [
    .move(x + rxv, y),
    .line(r - rxv, y),
    .cubic(r - rxv + kx, y, r, y + ryv - ky, r, y + ryv),
    .line(r, b - ryv),
    .cubic(r, b - ryv + ky, r - rxv + kx, b, r - rxv, b),
    .line(x + rxv, b),
    .cubic(x + rxv - kx, b, x, b - ryv + ky, x, b - ryv),
    .line(x, y + ryv),
    .cubic(x, y + ryv - ky, x + rxv - kx, y, x + rxv, y),
    .close,
  ]
}

func svgPolyCommands(_ points: String, close: Bool) -> [SvgPathCommand] {
  let nums = parseSvgNumberList(points)
  let count = nums.count / 2
  guard count >= 2 else { return [] }
  var out: [SvgPathCommand] = []
  out.reserveCapacity(count + 1)
  for i in 0..<count {
    let x = CGFloat(nums[i * 2]), y = CGFloat(nums[i * 2 + 1])
    out.append(i == 0 ? .move(x, y) : .line(x, y))
  }
  if close { out.append(.close) }
  return out
}

// MARK: - Transforms

/// A `transform` list (matrix, translate, scale, rotate, skewX, skewY); nil if malformed.
func parseSvgTransform(_ value: String) -> CGAffineTransform? {
  var result = CGAffineTransform.identity
  let s = Array(value.utf8)
  var i = 0
  while i < s.count {
    while i < s.count && (isSvgWsp(s[i]) || s[i] == chComma) { i += 1 }
    if i >= s.count { break }
    let nameStart = i
    while i < s.count && ((s[i] >= 65 && s[i] <= 90) || (s[i] >= 97 && s[i] <= 122)) { i += 1 }
    let name = String(decoding: s[nameStart..<i], as: UTF8.self)
    while i < s.count && isSvgWsp(s[i]) { i += 1 }
    guard !name.isEmpty, i < s.count, s[i] == UInt8(ascii: "("),
          let close = s[i...].firstIndex(of: UInt8(ascii: ")")) else { return nil }
    let args = parseSvgNumberList(String(decoding: s[(i + 1)..<close], as: UTF8.self)).map { CGFloat($0) }
    i = close + 1
    let t: CGAffineTransform
    switch name {
    case "matrix":
      guard args.count == 6 else { return nil }
      t = CGAffineTransform(a: args[0], b: args[1], c: args[2], d: args[3], tx: args[4], ty: args[5])
    case "translate":
      guard args.count == 1 || args.count == 2 else { return nil }
      t = CGAffineTransform(translationX: args[0], y: args.count == 2 ? args[1] : 0)
    case "scale":
      guard args.count == 1 || args.count == 2 else { return nil }
      t = CGAffineTransform(scaleX: args[0], y: args.count == 2 ? args[1] : args[0])
    case "rotate":
      guard args.count == 1 || args.count == 3 else { return nil }
      let a = args[0] * .pi / 180
      let r = CGAffineTransform(a: cos(a), b: sin(a), c: -sin(a), d: cos(a), tx: 0, ty: 0)
      if args.count == 3 {
        // translate(cx cy) rotate(a) translate(-cx -cy)
        t = CGAffineTransform(translationX: -args[1], y: -args[2])
          .concatenating(r)
          .concatenating(CGAffineTransform(translationX: args[1], y: args[2]))
      } else {
        t = r
      }
    case "skewX":
      guard args.count == 1 else { return nil }
      t = CGAffineTransform(a: 1, b: 0, c: tan(args[0] * .pi / 180), d: 1, tx: 0, ty: 0)
    case "skewY":
      guard args.count == 1 else { return nil }
      t = CGAffineTransform(a: 1, b: tan(args[0] * .pi / 180), c: 0, d: 1, tx: 0, ty: 0)
    default:
      return nil
    }
    // `result t`: t applies first.
    result = t.concatenating(result)
  }
  return result
}

// MARK: - Paint and lengths

/// ARGB of a CSS/SVG colour, or nil.
func parseSvgColor(_ value: String) -> UInt32? {
  guard let color = parseColor(value) else { return nil }
  var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
  guard color.getRed(&r, green: &g, blue: &b, alpha: &a) else { return nil }
  func byte(_ v: CGFloat) -> UInt32 { UInt32((min(max(v, 0), 1) * 255).rounded()) }
  return (byte(a) << 24) | (byte(r) << 16) | (byte(g) << 8) | byte(b)
}

/// `fill`/`stroke` value; nil when it is not a valid paint (the attribute is then ignored).
func parseSvgPaint(_ raw: String) -> SvgPaint? {
  let v = raw.trimmingCharacters(in: .whitespacesAndNewlines)
  if v.isEmpty { return nil }
  let lower = v.lowercased()
  if lower == "none" { return SvgPaint.none }
  if lower == "currentcolor" { return .currentColor }
  if lower == "transparent" { return .color(0) }
  if lower.hasPrefix("url(") {
    guard let close = v.firstIndex(of: ")") else { return SvgPaint.none }
    let rest = v[v.index(after: close)...].trimmingCharacters(in: .whitespaces)
    let fallback = rest.isEmpty ? nil : parseSvgPaint(rest)
    return .ref(svgUrlFragment(String(v[...close])) ?? "", fallback: fallback)
  }
  return parseSvgColor(v).map { .color($0) }
}

/// The id in a local `url(#id)` (quotes allowed), else nil.
func svgUrlFragment(_ value: String) -> String? {
  let v = value.trimmingCharacters(in: .whitespacesAndNewlines)
  guard v.lowercased().hasPrefix("url("), let close = v.firstIndex(of: ")") else { return nil }
  let inner = v[v.index(v.startIndex, offsetBy: 4)..<close]
    .trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "\"'"))
    .trimmingCharacters(in: .whitespaces)
  guard inner.hasPrefix("#"), inner.count > 1 else { return nil }
  return String(inner.dropFirst())
}

/// A length in user units: plain, px, the absolute units, em/ex at 16px, % of `percentBasis`.
func parseSvgLength(_ raw: String?, _ percentBasis: CGFloat) -> CGFloat? {
  guard let v = raw?.trimmingCharacters(in: .whitespacesAndNewlines), !v.isEmpty else { return nil }
  var sc = SvgScanner(v)
  guard let n = sc.number() else { return nil }
  let unit = sc.rest.trimmingCharacters(in: .whitespaces).lowercased()
  let scale: Double
  switch unit {
  case "", "px": scale = 1
  case "%": scale = Double(percentBasis) / 100
  case "pt": scale = 4.0 / 3.0
  case "pc": scale = 16
  case "in": scale = 96
  case "cm": scale = 96 / 2.54
  case "mm": scale = 96 / 25.4
  case "em": scale = 16
  case "ex": scale = 8
  default: return nil
  }
  return CGFloat(n * scale)
}

private func parseSvgOpacity(_ raw: String) -> CGFloat? {
  let v = raw.trimmingCharacters(in: .whitespaces)
  let n: Double?
  if v.hasSuffix("%") {
    n = Double(v.dropLast().trimmingCharacters(in: .whitespaces)).map { $0 / 100 }
  } else {
    n = Double(v)
  }
  return n.map { CGFloat(min(max($0, 0), 1)) }
}

/// `preserveAspectRatio`: (alignX, alignY, slice); nil align means `none`.
func parseSvgPreserveAspectRatio(_ raw: String?) -> (Int?, Int?, Bool) {
  guard let raw = raw?.trimmingCharacters(in: .whitespaces) else { return (0, 0, false) }
  let parts = raw.split(whereSeparator: { $0 == " " || $0 == "\t" || $0 == "\n" }).map(String.init)
  let align = parts.first ?? ""
  let slice = parts.count > 1 && parts[1] == "slice"
  if align == "none" { return (nil, nil, slice) }
  if align.count == 8 && align.hasPrefix("x") {
    let chars = Array(align)
    let xs = String(chars[1..<4]), ys = String(chars[5..<8])
    return (xs == "Min" ? -1 : xs == "Max" ? 1 : 0, ys == "Min" ? -1 : ys == "Max" ? 1 : 0, slice)
  }
  return (0, 0, slice)
}

// MARK: - Bounds

/// Exact bounds of a path's geometry, or nil when it has no points.
func svgPathBounds(_ commands: [SvgPathCommand]) -> CGRect? {
  var minX = CGFloat.greatestFiniteMagnitude, minY = CGFloat.greatestFiniteMagnitude
  var maxX = -CGFloat.greatestFiniteMagnitude, maxY = -CGFloat.greatestFiniteMagnitude
  var any = false
  func add(_ x: CGFloat, _ y: CGFloat) {
    any = true
    minX = min(minX, x); minY = min(minY, y); maxX = max(maxX, x); maxY = max(maxY, y)
  }
  // Roots in (0, 1) of a t^2 + b t + c.
  func roots(_ a: Double, _ b: Double, _ c: Double) -> [Double] {
    var out: [Double] = []
    if abs(a) < 1e-12 {
      if abs(b) > 1e-12 { out.append(-c / b) }
    } else {
      let disc = b * b - 4 * a * c
      if disc >= 0 {
        let sq = disc.squareRoot()
        out.append((-b + sq) / (2 * a)); out.append((-b - sq) / (2 * a))
      }
    }
    return out.filter { $0 > 0 && $0 < 1 }
  }
  var px: CGFloat = 0, py: CGFloat = 0
  for c in commands {
    switch c {
    case let .move(x, y), let .line(x, y):
      add(x, y); px = x; py = y
    case let .cubic(x1, y1, x2, y2, x, y):
      add(x, y)
      func axis(_ p0: CGFloat, _ p1: CGFloat, _ p2: CGFloat, _ p3: CGFloat) -> [Double] {
        roots(Double(-p0 + 3 * p1 - 3 * p2 + p3), Double(2 * (p0 - 2 * p1 + p2)), Double(p1 - p0))
      }
      for t in axis(px, x1, x2, x) + axis(py, y1, y2, y) {
        let u = 1 - t
        let bx = u * u * u * Double(px) + 3 * u * u * t * Double(x1) + 3 * u * t * t * Double(x2) + t * t * t * Double(x)
        let by = u * u * u * Double(py) + 3 * u * u * t * Double(y1) + 3 * u * t * t * Double(y2) + t * t * t * Double(y)
        add(CGFloat(Float(bx)), CGFloat(Float(by)))
      }
      px = x; py = y
    case let .quad(x1, y1, x, y):
      add(x, y)
      func axis(_ p0: CGFloat, _ p1: CGFloat, _ p2: CGFloat) -> [Double] {
        roots(0, Double(2 * (p0 - 2 * p1 + p2)), Double(2 * (p1 - p0)))
      }
      for t in axis(px, x1, x) + axis(py, y1, y) {
        let u = 1 - t
        add(CGFloat(Float(u * u * Double(px) + 2 * u * t * Double(x1) + t * t * Double(x))),
            CGFloat(Float(u * u * Double(py) + 2 * u * t * Double(y1) + t * t * Double(y))))
      }
      px = x; py = y
    case .close:
      break
    }
  }
  return any ? CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY) : nil
}

private func unionBounds(_ a: CGRect?, _ b: CGRect?) -> CGRect? {
  guard let a = a else { return b }
  guard let b = b else { return a }
  return a.union(b)
}

// MARK: - Marker vertices

/// A vertex markers sit on, with the directions (degrees) of the segments into and out of it; nil
/// where there is none or it has no length.
struct SvgMarkerVertex: Equatable {
  var x: CGFloat
  var y: CGFloat
  var inAngle: CGFloat? = nil
  var outAngle: CGFloat? = nil

  /// The `orient="auto"` angle: the bisector where the path turns.
  var autoAngle: CGFloat {
    guard var i = inAngle, let o = outAngle else { return inAngle ?? outAngle ?? 0 }
    if abs(i - o) > 180 { i += 360 }
    return (i + o) / 2
  }
}

private func svgDirection(_ x0: CGFloat, _ y0: CGFloat, _ x1: CGFloat, _ y1: CGFloat) -> CGFloat? {
  if x0 == x1 && y0 == y1 { return nil }
  return CGFloat(atan2(Double(y1 - y0), Double(x1 - x0)) * 180 / .pi)
}

/// The vertices of a path in order. `vertexEnds` (from `parseSvgPathData`) marks commands that end
/// inside an arc. A closed subpath ends at its start, and both its ends take the turn there.
func svgMarkerVertices(_ commands: [SvgPathCommand], vertexEnds: [Bool]? = nil) -> [SvgMarkerVertex] {
  var out: [SvgMarkerVertex] = []
  var cx: CGFloat = 0, cy: CGFloat = 0, sx: CGFloat = 0, sy: CGFloat = 0
  var start = -1
  for (i, c) in commands.enumerated() {
    var d0: CGFloat? = nil, d1: CGFloat? = nil
    switch c {
    case let .move(x, y):
      out.append(SvgMarkerVertex(x: x, y: y))
      start = out.count - 1
      cx = x; cy = y; sx = x; sy = y
      continue
    case .close:
      guard start >= 0 else { continue }
      let d = svgDirection(cx, cy, sx, sy)
      let last = out.count - 1
      if d != nil && out[last].outAngle == nil { out[last].outAngle = d }
      let inAngle = d ?? out[last].inAngle
      out[start].inAngle = inAngle
      out.append(SvgMarkerVertex(x: sx, y: sy, inAngle: inAngle, outAngle: out[start].outAngle))
      cx = sx; cy = sy
      continue
    case let .line(x, y):
      d0 = svgDirection(cx, cy, x, y)
      d1 = d0
    case let .quad(x1, y1, x, y):
      d0 = svgDirection(cx, cy, x1, y1) ?? svgDirection(cx, cy, x, y)
      d1 = svgDirection(x1, y1, x, y) ?? svgDirection(cx, cy, x, y)
    case let .cubic(x1, y1, x2, y2, x, y):
      d0 = svgDirection(cx, cy, x1, y1) ?? svgDirection(cx, cy, x2, y2) ?? svgDirection(cx, cy, x, y)
      d1 = svgDirection(x2, y2, x, y) ?? svgDirection(x1, y1, x, y) ?? svgDirection(cx, cy, x, y)
    }
    guard start >= 0, let end = c.endPoint else { continue }
    let last = out.count - 1
    if out[last].outAngle == nil { out[last].outAngle = d0 }
    if vertexEnds.map({ i < $0.count ? $0[i] : true }) ?? true {
      out.append(SvgMarkerVertex(x: end.x, y: end.y, inAngle: d1))
    }
    cx = end.x; cy = end.y
  }
  return out
}

// MARK: - Style sheets

struct SvgCssDeclaration {
  let name: String
  let value: String
  let important: Bool
}

/// A compound selector: optional type, then ids and classes.
struct SvgCssSelector {
  let type: String?
  let ids: [String]
  let classes: [String]

  var specificity: Int { ids.count * 1_000_000 + classes.count * 1_000 + (type != nil ? 1 : 0) }

  func matches(_ name: String, _ id: String?, _ classes: Set<String>) -> Bool {
    (type == nil || type == name) && ids.allSatisfy { $0 == id } && self.classes.allSatisfy { classes.contains($0) }
  }
}

struct SvgCssRule {
  let selector: SvgCssSelector
  let declarations: [SvgCssDeclaration]
  let order: Int
}

private func isCssIdentChar(_ c: Character) -> Bool {
  c.isLetter || c.isNumber || c == "-" || c == "_" || (c.unicodeScalars.first?.value ?? 0) > 0x7F
}

/// One compound selector; nil for anything else (combinators, attributes, pseudo-classes).
func parseSvgCssSelector(_ raw: String) -> SvgCssSelector? {
  let s = Array(raw.trimmingCharacters(in: .whitespacesAndNewlines))
  if s.isEmpty { return nil }
  var i = 0
  var type: String? = nil
  if s[0] == "*" {
    i = 1
  } else if isCssIdentChar(s[0]) {
    while i < s.count && isCssIdentChar(s[i]) { i += 1 }
    type = String(s[0..<i])
  }
  var ids: [String] = [], classes: [String] = []
  while i < s.count {
    let c = s[i]
    if c != "." && c != "#" { return nil }
    i += 1
    let start = i
    while i < s.count && isCssIdentChar(s[i]) { i += 1 }
    if i == start { return nil }
    if c == "." { classes.append(String(s[start..<i])) } else { ids.append(String(s[start..<i])) }
  }
  return SvgCssSelector(type: type, ids: ids, classes: classes)
}

/// `name: value` pairs split on `;` outside quotes and parentheses.
func parseSvgCssDeclarations(_ text: String) -> [SvgCssDeclaration] {
  var out: [SvgCssDeclaration] = []
  func take(_ decl: Substring) {
    guard let colon = decl.firstIndex(of: ":") else { return }
    let name = decl[..<colon].trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    var value = decl[decl.index(after: colon)...].trimmingCharacters(in: .whitespacesAndNewlines)
    var important = false
    if let bang = value.lastIndex(of: "!"),
       value[value.index(after: bang)...].trimmingCharacters(in: .whitespaces).lowercased() == "important" {
      important = true
      value = value[..<bang].trimmingCharacters(in: .whitespacesAndNewlines)
    }
    if !name.isEmpty && !value.isEmpty { out.append(SvgCssDeclaration(name: name, value: value, important: important)) }
  }
  var depth = 0
  var quote: Character? = nil
  var start = text.startIndex
  var i = text.startIndex
  while i < text.endIndex {
    let c = text[i]
    if let q = quote {
      if c == q { quote = nil }
    } else if c == "\"" || c == "'" {
      quote = c
    } else if c == "(" {
      depth += 1
    } else if c == ")" {
      if depth > 0 { depth -= 1 }
    } else if c == ";" && depth == 0 {
      take(text[start..<i])
      start = text.index(after: i)
    }
    i = text.index(after: i)
  }
  take(text[start...])
  return out
}

/// Rules of a `<style>` sheet; at-rules are skipped.
func parseSvgStyleSheet(_ raw: String) -> [SvgCssRule] {
  // Comments out first.
  var css = ""
  var rest = Substring(raw)
  while let open = rest.range(of: "/*") {
    css += rest[..<open.lowerBound]
    css += " "
    guard let close = rest[open.upperBound...].range(of: "*/") else { rest = ""; break }
    rest = rest[close.upperBound...]
  }
  css += rest
  let s = Array(css)
  let n = s.count
  var rules: [SvgCssRule] = []
  var order = 0
  var i = 0
  func index(of c: Character, from: Int) -> Int {
    var k = from
    while k < n && s[k] != c { k += 1 }
    return k
  }
  while i < n {
    while i < n && s[i].isWhitespace { i += 1 }
    if i >= n { break }
    if s[i] == "@" {
      let semi = index(of: ";", from: i), brace = index(of: "{", from: i)
      if semi < brace {
        i = semi + 1
        continue
      }
      var depth = 0
      var j = brace
      while j < n {
        if s[j] == "{" { depth += 1 } else if s[j] == "}" { depth -= 1; if depth == 0 { break } }
        j += 1
      }
      i = j + 1
      continue
    }
    let open = index(of: "{", from: i)
    if open >= n { break }
    let close = index(of: "}", from: open)
    let declarations = parseSvgCssDeclarations(String(s[(open + 1)..<close]))
    for sel in String(s[i..<open]).split(separator: ",", omittingEmptySubsequences: false) {
      if let selector = parseSvgCssSelector(String(sel)) {
        rules.append(SvgCssRule(selector: selector, declarations: declarations, order: order))
        order += 1
      }
    }
    i = close + 1
  }
  return rules
}

// MARK: - Document

/// Inherited presentation state.
private struct SvgStyleState {
  var fill: SvgPaint = .color(0xFF00_0000)
  var fillOpacity: CGFloat = 1
  var evenOdd = false
  var stroke: SvgPaint = .none
  var strokeOpacity: CGFloat = 1
  var strokeWidth: CGFloat = 1
  var lineCap: SvgLineCap = .butt
  var lineJoin: SvgLineJoin = .miter
  var miterLimit: CGFloat = 4
  var dashArray: [CGFloat]? = nil
  var dashOffset: CGFloat = 0
  /// The SVG's own `color`, which `currentColor` resolves to before the element's CSS color.
  var color: UInt32? = nil
  var visible = true
  var clipEvenOdd = false
  var fontFamilies: [String] = ["serif"]
  var fontSize: CGFloat = 16
  var fontWeight = 400
  var italic = false
  var textAnchor: SvgTextAnchor = .start
  var baseline: SvgBaseline = .alphabetic
  var letterSpacing: CGFloat = 0
  var wordSpacing: CGFloat = 0
  /// `xml:space="preserve"` / `white-space: pre`: keep every space.
  var preserveSpace = false
  /// Marker ids, nil for none.
  var markerStart: String? = nil
  var markerMid: String? = nil
  var markerEnd: String? = nil

  var font: SvgFont { SvgFont(families: fontFamilies, size: fontSize, weight: fontWeight, italic: italic) }
  var hasMarkers: Bool { markerStart != nil || markerMid != nil || markerEnd != nil }
}

enum SvgTextAnchor { case start, middle, end }

/// The `dominant-baseline` a text's y positions refer to.
enum SvgBaseline { case alphabetic, middle, central, hanging, textTop, textBottom, mathematical }

/// The families of a `font-family` list, unquoted.
func parseSvgFontFamilies(_ raw: String) -> [String] {
  var out: [String] = []
  var current = ""
  var quote: Character? = nil
  for c in raw {
    if let q = quote {
      if c == q { quote = nil } else { current.append(c) }
    } else if c == "\"" || c == "'" {
      quote = c
    } else if c == "," {
      let f = current.trimmingCharacters(in: .whitespacesAndNewlines)
      if !f.isEmpty { out.append(f) }
      current = ""
    } else {
      current.append(c)
    }
  }
  let f = current.trimmingCharacters(in: .whitespacesAndNewlines)
  if !f.isEmpty { out.append(f) }
  return out
}

/// A length where `em` is `fontSize` and `%` is a fraction of `percentBasis`.
private func parseSvgFontRelativeLength(_ raw: String, _ fontSize: CGFloat, _ percentBasis: CGFloat) -> CGFloat? {
  let v = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  var sc = SvgScanner(v)
  guard let n = sc.number() else { return nil }
  switch sc.rest.trimmingCharacters(in: .whitespaces) {
  case "em": return CGFloat(n) * fontSize
  case "ex": return CGFloat(n) * fontSize / 2
  case "rem": return CGFloat(n) * 16
  default: return parseSvgLength(v, percentBasis)
  }
}

private let svgFontSizeKeywords: [String: CGFloat] = [
  "xx-small": 9, "x-small": 10, "small": 13, "medium": 16, "large": 18, "x-large": 24, "xx-large": 32, "xxx-large": 48,
]

/// A `font-size`; `em` and `%` are relative to the parent's size.
func parseSvgFontSize(_ raw: String, parent: CGFloat) -> CGFloat? {
  let v = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  if let k = svgFontSizeKeywords[v] { return k }
  if v == "larger" { return parent * 1.2 }
  if v == "smaller" { return parent / 1.2 }
  guard let size = parseSvgFontRelativeLength(v, parent, parent), size >= 0 else { return nil }
  return size
}

/// A `font-weight` as a number; `bolder`/`lighter` step from the parent's.
func parseSvgFontWeight(_ raw: String, parent: Int) -> Int? {
  switch raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
  case "normal": return 400
  case "bold": return 700
  case "bolder": return parent < 350 ? 400 : parent < 550 ? 700 : 900
  case "lighter": return parent < 550 ? 100 : parent < 750 ? 400 : 700
  case let v:
    guard let n = Double(v), n >= 1, n <= 1000 else { return nil }
    return Int(n)
  }
}

private let svgFontStretchKeywords: Set<String> = [
  "normal", "small-caps", "ultra-condensed", "extra-condensed", "condensed", "semi-condensed",
  "semi-expanded", "expanded", "extra-expanded", "ultra-expanded",
]

/// The `font` shorthand: [style || weight || variant || stretch] size[/line-height] family.
private func applySvgFontShorthand(_ raw: String, _ s: inout SvgStyleState, parentSize: CGFloat, parentWeight: Int) {
  var rest = Substring(raw.trimmingCharacters(in: .whitespacesAndNewlines))
  var italic = false
  var weight = 400
  while !rest.isEmpty {
    let end = rest.firstIndex(where: { $0.isWhitespace }) ?? rest.endIndex
    let token = String(rest[..<end])
    let lower = token.lowercased()
    let after = rest[end...].drop(while: { $0.isWhitespace })
    if lower == "italic" || lower == "oblique" {
      italic = true
    } else if svgFontStretchKeywords.contains(lower) {
      // nothing to apply
    } else if let w = parseSvgFontWeight(lower, parent: parentWeight), lower != "normal" {
      weight = w
    } else {
      let sizeText = lower.split(separator: "/", maxSplits: 1).first.map(String.init) ?? lower
      guard let size = parseSvgFontSize(sizeText, parent: parentSize) else { return }
      let families = parseSvgFontFamilies(String(after))
      if families.isEmpty { return }
      s.italic = italic
      s.fontWeight = weight
      s.fontSize = size
      s.fontFamilies = families
      return
    }
    rest = after
  }
}

/// A marker property: `.some(nil)` for none, `.some(id)` for a reference, nil when invalid.
private func parseSvgMarkerRef(_ raw: String) -> String?? {
  let v = raw.trimmingCharacters(in: .whitespacesAndNewlines)
  if v == "none" { return .some(nil) }
  guard let id = svgUrlFragment(v) else { return nil }
  return .some(id)
}

private let containerTags: Set<String> = ["svg", "g", "a", "switch"]
private let shapeTags: Set<String> = ["path", "rect", "circle", "ellipse", "line", "polyline", "polygon"]
private let gradientTags: Set<String> = ["linearGradient", "radialGradient"]
/// Elements whose character data is text content.
private let textContentTags: Set<String> = ["text", "tspan", "a"]
/// Shapes that take markers.
private let markerTags: Set<String> = ["path", "line", "polyline", "polygon"]
private let textNodeName = "#text"

/// Attributes of one start tag (the part after its name).
func parseSvgAttributes(_ tag: String) -> [String: String] {
  var attrs: [String: String] = [:]
  let s = Array(tag.utf8)
  let n = s.count
  var i = 0
  let eq = UInt8(ascii: "="), slash = UInt8(ascii: "/"), gt = UInt8(ascii: ">"),
    dq = UInt8(ascii: "\""), sq = UInt8(ascii: "'")
  while i < n {
    while i < n && (isSvgWsp(s[i]) || s[i] == slash) { i += 1 }
    let nameStart = i
    while i < n && !isSvgWsp(s[i]) && s[i] != eq && s[i] != slash && s[i] != gt { i += 1 }
    if i == nameStart { i += 1; continue }
    let name = String(decoding: s[nameStart..<i], as: UTF8.self)
    while i < n && isSvgWsp(s[i]) { i += 1 }
    if i >= n || s[i] != eq {
      attrs[name] = ""
      continue
    }
    i += 1
    while i < n && isSvgWsp(s[i]) { i += 1 }
    if i >= n { break }
    let q = s[i]
    let value: String
    if q == dq || q == sq {
      let end = s[(i + 1)...].firstIndex(of: q) ?? n
      value = String(decoding: s[(i + 1)..<end], as: UTF8.self)
      i = end + 1
    } else {
      let start = i
      while i < n && !isSvgWsp(s[i]) && s[i] != gt { i += 1 }
      value = String(decoding: s[start..<i], as: UTF8.self)
    }
    attrs[name] = decodeXmlEntities(value)
  }
  return attrs
}

private func decodeXmlEntities(_ v: String) -> String {
  guard v.contains("&") else { return v }
  var out = ""
  var rest = Substring(v)
  while let amp = rest.firstIndex(of: "&") {
    out += rest[..<amp]
    let after = rest[rest.index(after: amp)...]
    if let semi = after.firstIndex(of: ";") {
      let ent = String(after[..<semi])
      var rep: String? = nil
      switch ent {
      case "amp": rep = "&"
      case "lt": rep = "<"
      case "gt": rep = ">"
      case "quot": rep = "\""
      case "apos": rep = "'"
      default:
        if ent.hasPrefix("#x") || ent.hasPrefix("#X") {
          rep = UInt32(ent.dropFirst(2), radix: 16).flatMap { Unicode.Scalar($0) }.map { String(Character($0)) }
        } else if ent.hasPrefix("#") {
          rep = UInt32(ent.dropFirst()).flatMap { Unicode.Scalar($0) }.map { String(Character($0)) }
        }
      }
      if let rep = rep {
        out += rep
        rest = after[after.index(after: semi)...]
        continue
      }
    }
    out += "&"
    rest = after
  }
  out += rest
  return out
}

private func applySvgStyle(_ parent: SvgStyleState, _ props: [String: String]) -> SvgStyleState {
  var s = parent
  func prop(_ name: String) -> String? {
    guard let v = props[name]?.trimmingCharacters(in: .whitespacesAndNewlines), !v.isEmpty, v != "inherit" else { return nil }
    return v
  }
  if let v = prop("color"), v.lowercased() != "currentcolor", let c = parseSvgColor(v) { s.color = c }
  if let v = prop("fill"), let p = parseSvgPaint(v) { s.fill = p }
  if let v = prop("fill-opacity"), let o = parseSvgOpacity(v) { s.fillOpacity = o }
  if let v = prop("fill-rule") {
    if v == "evenodd" { s.evenOdd = true } else if v == "nonzero" { s.evenOdd = false }
  }
  if let v = prop("clip-rule") {
    if v == "evenodd" { s.clipEvenOdd = true } else if v == "nonzero" { s.clipEvenOdd = false }
  }
  if let v = prop("stroke"), let p = parseSvgPaint(v) { s.stroke = p }
  if let v = prop("stroke-opacity"), let o = parseSvgOpacity(v) { s.strokeOpacity = o }
  if let v = prop("stroke-width"), let w = parseSvgLength(v, 16), w >= 0 { s.strokeWidth = w }
  switch prop("stroke-linecap") {
  case "butt": s.lineCap = .butt
  case "round": s.lineCap = .round
  case "square": s.lineCap = .square
  default: break
  }
  switch prop("stroke-linejoin") {
  case "miter", "miter-clip", "arcs": s.lineJoin = .miter
  case "round": s.lineJoin = .round
  case "bevel": s.lineJoin = .bevel
  default: break
  }
  if let v = prop("stroke-miterlimit"), let m = Double(v), m >= 1 { s.miterLimit = CGFloat(m) }
  if let v = prop("stroke-dasharray") {
    if v == "none" {
      s.dashArray = nil
    } else {
      let nums = parseSvgNumberList(v).map { CGFloat($0) }
      if nums.isEmpty || nums.contains(where: { $0 < 0 }) || nums.allSatisfy({ $0 == 0 }) {
        s.dashArray = nil
      } else {
        s.dashArray = nums.count % 2 == 1 ? nums + nums : nums
      }
    }
  }
  if let v = prop("stroke-dashoffset"), let o = parseSvgLength(v, 16) { s.dashOffset = o }
  if let v = prop("visibility") { s.visible = v == "visible" }

  if let v = prop("font") { applySvgFontShorthand(v, &s, parentSize: parent.fontSize, parentWeight: parent.fontWeight) }
  if let v = prop("font-family") {
    let families = parseSvgFontFamilies(v)
    if !families.isEmpty { s.fontFamilies = families }
  }
  if let v = prop("font-size"), let size = parseSvgFontSize(v, parent: parent.fontSize) { s.fontSize = size }
  if let v = prop("font-weight"), let w = parseSvgFontWeight(v, parent: parent.fontWeight) { s.fontWeight = w }
  switch prop("font-style") {
  case "italic", "oblique": s.italic = true
  case "normal": s.italic = false
  default: break
  }
  switch prop("text-anchor") {
  case "start": s.textAnchor = .start
  case "middle": s.textAnchor = .middle
  case "end": s.textAnchor = .end
  default: break
  }
  switch prop("dominant-baseline") {
  case "auto", "alphabetic", "use-script", "no-change", "reset-size": s.baseline = .alphabetic
  case "middle": s.baseline = .middle
  case "central": s.baseline = .central
  case "hanging": s.baseline = .hanging
  case "text-top", "text-before-edge": s.baseline = .textTop
  case "text-bottom", "text-after-edge", "ideographic": s.baseline = .textBottom
  case "mathematical": s.baseline = .mathematical
  default: break
  }
  if let v = prop("letter-spacing") {
    if v == "normal" { s.letterSpacing = 0 } else if let l = parseSvgFontRelativeLength(v, s.fontSize, s.fontSize) { s.letterSpacing = l }
  }
  if let v = prop("word-spacing") {
    if v == "normal" { s.wordSpacing = 0 } else if let l = parseSvgFontRelativeLength(v, s.fontSize, s.fontSize) { s.wordSpacing = l }
  }
  switch prop("xml:space") {
  case "preserve": s.preserveSpace = true
  case "default": s.preserveSpace = false
  default: break
  }
  switch prop("white-space") {
  case "pre", "pre-wrap", "break-spaces": s.preserveSpace = true
  case "normal", "nowrap", "pre-line": s.preserveSpace = false
  default: break
  }
  if let v = prop("marker"), let ref = parseSvgMarkerRef(v) {
    s.markerStart = ref; s.markerMid = ref; s.markerEnd = ref
  }
  if let v = prop("marker-start"), let ref = parseSvgMarkerRef(v) { s.markerStart = ref }
  if let v = prop("marker-mid"), let ref = parseSvgMarkerRef(v) { s.markerMid = ref }
  if let v = prop("marker-end"), let ref = parseSvgMarkerRef(v) { s.markerEnd = ref }
  return s
}

private final class SvgNode {
  let name: String
  let attrs: [String: String]
  weak var parent: SvgNode?
  var children: [SvgNode] = []
  var props: [String: String]? = nil
  /// Character data, for a `#text` node.
  var text = ""

  init(name: String, attrs: [String: String], parent: SvgNode?) {
    self.name = name
    self.attrs = attrs
    self.parent = parent
  }

  lazy var classes: Set<String> = Set((attrs["class"] ?? "").split(whereSeparator: { $0.isWhitespace }).map(String.init))

  var href: String? { (attrs["href"] ?? attrs["xlink:href"])?.trimmingCharacters(in: .whitespacesAndNewlines) }
}

private struct SvgTree {
  let root: SvgNode
  let ids: [String: SvgNode]
  let css: String
}

/// Element tree under the first top-level `<svg>`, its ids and the text of its `<style>` sheets.
private func buildSvgTree(_ svg: String) -> SvgTree? {
  let s = Array(svg.utf8)
  let n = s.count
  var root: SvgNode? = nil
  // nil entries are elements skipped before the root.
  var stack: [SvgNode?] = []
  var ids: [String: SvgNode] = [:]
  var css = ""
  let lt = UInt8(ascii: "<"), gt = UInt8(ascii: ">"), slash = UInt8(ascii: "/"),
    dq = UInt8(ascii: "\""), sq = UInt8(ascii: "'"), colon = UInt8(ascii: ":")

  func starts(_ prefix: String, at index: Int) -> Bool {
    let p = Array(prefix.utf8)
    guard index + p.count <= n else { return false }
    for k in 0..<p.count where s[index + k] != p[k] { return false }
    return true
  }
  func find(_ needle: String, from: Int) -> Int? {
    let p = Array(needle.utf8)
    guard !p.isEmpty, from <= n - p.count else { return nil }
    var k = from
    while k <= n - p.count {
      if s[k] == p[0] && starts(needle, at: k) { return k }
      k += 1
    }
    return nil
  }

  // Character data inside text content, merged into one `#text` node per run.
  func appendText(_ text: String) {
    guard let p = stack.last ?? nil, textContentTags.contains(p.name), !text.isEmpty else { return }
    if let last = p.children.last, last.name == textNodeName {
      last.text += text
    } else {
      let node = SvgNode(name: textNodeName, attrs: [:], parent: p)
      node.text = text
      p.children.append(node)
    }
  }

  var i = 0
  while i < n {
    guard let open = s[i...].firstIndex(of: lt) else { break }
    if open > i { appendText(decodeXmlEntities(String(decoding: s[i..<open], as: UTF8.self))) }
    if starts("<!--", at: open) {
      i = find("-->", from: open + 4).map { $0 + 3 } ?? n
      continue
    }
    if starts("<![CDATA[", at: open) {
      let end = find("]]>", from: open + 9)
      appendText(String(decoding: s[(open + 9)..<(end ?? n)], as: UTF8.self))
      i = end.map { $0 + 3 } ?? n
      continue
    }
    if starts("<?", at: open) || starts("<!", at: open) {
      i = s[(open + 2)...].firstIndex(of: gt).map { $0 + 1 } ?? n
      continue
    }
    // Find the tag end, skipping quoted attribute values.
    var j = open + 1
    var quote: UInt8 = 0
    while j < n {
      let c = s[j]
      if quote != 0 {
        if c == quote { quote = 0 }
      } else if c == dq || c == sq {
        quote = c
      } else if c == gt {
        break
      }
      j += 1
    }
    if j >= n { break }
    let body = s[(open + 1)..<j]
    i = j + 1

    if body.first == slash {
      if let popped = stack.popLast(), let r = root, popped === r { break }
      continue
    }
    let selfClosing = body.last == slash
    var nameEnd = body.startIndex
    while nameEnd < body.endIndex && !isSvgWsp(body[nameEnd]) && body[nameEnd] != slash { nameEnd += 1 }
    var nameBytes = body[body.startIndex..<nameEnd]
    if let c = nameBytes.firstIndex(of: colon) { nameBytes = nameBytes[(c + 1)...] }
    let name = String(decoding: nameBytes, as: UTF8.self)

    if root == nil && (name != "svg" || !stack.isEmpty) {
      if !selfClosing { stack.append(nil) }
      continue
    }
    let parent = stack.last ?? nil
    let node = SvgNode(name: name, attrs: parseSvgAttributes(String(decoding: body[nameEnd...], as: UTF8.self)), parent: parent)
    parent?.children.append(node)
    if root == nil { root = node }
    if let id = node.attrs["id"]?.trimmingCharacters(in: .whitespaces), !id.isEmpty, ids[id] == nil { ids[id] = node }
    if name == "style" && !selfClosing {
      let end = find("</style", from: i) ?? n
      let text = String(decoding: s[i..<end], as: UTF8.self)
        .replacingOccurrences(of: "<![CDATA[", with: "").replacingOccurrences(of: "]]>", with: "")
        .replacingOccurrences(of: "<!--", with: "").replacingOccurrences(of: "-->", with: "")
      css += decodeXmlEntities(text) + "\n"
      i = end < n ? (s[end...].firstIndex(of: gt).map { $0 + 1 } ?? n) : n
      continue
    }
    if selfClosing {
      if node === root { break }
    } else {
      stack.append(node)
    }
  }
  guard let r = root else { return nil }
  return SvgTree(root: r, ids: ids, css: css)
}

/// Shorthands applySvgStyle reads before their longhands.
private let svgShorthands: [String: [String]] = [
  "font": ["font-family", "font-size", "font-weight", "font-style", "font-variant", "font-stretch", "line-height"],
  "marker": ["marker-start", "marker-mid", "marker-end"],
]

private let maxSvgDepth = 128
private let maxSvgVisits = 100_000
private let maxSvgOps = 50_000

/// a · b: apply b first, then a.
private func svgMultiply(_ a: CGAffineTransform, _ b: CGAffineTransform) -> CGAffineTransform { b.concatenating(a) }

private func translation(_ x: CGFloat, _ y: CGFloat) -> CGAffineTransform { CGAffineTransform(translationX: x, y: y) }

private func boxTransform(_ b: CGRect) -> CGAffineTransform {
  CGAffineTransform(a: b.width, b: 0, c: 0, d: b.height, tx: b.minX, ty: b.minY)
}

private enum SvgClipResolution {
  case none
  case empty
  case clip(SvgClip)
}

private enum SvgMaskResolution {
  case none
  case empty
  case mask(SvgMask)
}

/// One shaped run of a `<text>`: glyph outlines in the text's user space, with the style of the
/// element they came from.
private struct SvgTextPiece {
  var commands: [SvgPathCommand]
  var style: SvgStyleState
}

private struct SvgTextChar {
  var scalar: Unicode.Scalar
  /// The innermost text content element holding the character.
  var owner: SvgNode
  var style: SvgStyleState
  var x: CGFloat? = nil
  var y: CGFloat? = nil
  var dx: CGFloat = 0
  var dy: CGFloat = 0
}

/// Lengths in a list attribute such as a text's `x` or `dx`.
private func parseSvgLengthList(_ raw: String?, _ percentBasis: CGFloat) -> [CGFloat] {
  guard let raw = raw else { return [] }
  var out: [CGFloat] = []
  for token in raw.split(whereSeparator: { $0 == "," || $0.isWhitespace }) {
    guard let v = parseSvgLength(String(token), percentBasis) else { break }
    out.append(v)
  }
  return out
}

/// An angle in degrees: plain, or with `deg`, `rad`, `grad` or `turn`.
func parseSvgAngle(_ raw: String) -> CGFloat? {
  var sc = SvgScanner(raw.trimmingCharacters(in: .whitespacesAndNewlines))
  guard let n = sc.number() else { return nil }
  switch sc.rest.trimmingCharacters(in: .whitespaces).lowercased() {
  case "", "deg": return CGFloat(n)
  case "rad": return CGFloat(n * 180 / .pi)
  case "grad": return CGFloat(n * 0.9)
  case "turn": return CGFloat(n * 360)
  default: return nil
  }
}

func svgTranslated(_ commands: [SvgPathCommand], _ dx: CGFloat, _ dy: CGFloat) -> [SvgPathCommand] {
  if dx == 0 && dy == 0 { return commands }
  return commands.map {
    switch $0 {
    case let .move(x, y): return .move(x + dx, y + dy)
    case let .line(x, y): return .line(x + dx, y + dy)
    case let .cubic(x1, y1, x2, y2, x, y): return .cubic(x1 + dx, y1 + dy, x2 + dx, y2 + dy, x + dx, y + dy)
    case let .quad(x1, y1, x, y): return .quad(x1 + dx, y1 + dy, x + dx, y + dy)
    case .close: return .close
    }
  }
}

/// How far below `y` the alphabetic baseline sits for `baseline`.
private func svgBaselineShift(_ baseline: SvgBaseline, _ run: SvgTextRun) -> CGFloat {
  switch baseline {
  case .alphabetic: return 0
  case .middle: return run.xHeight / 2
  case .central: return (run.ascent - run.descent) / 2
  case .hanging: return run.ascent * 0.8
  case .textTop: return run.ascent
  case .textBottom: return -run.descent
  case .mathematical: return run.ascent / 2
  }
}

private final class SvgBuilder {
  let tree: SvgTree
  let vbW: CGFloat, vbH: CGFloat
  var ops: [SvgOp] = []
  var usesCurrentColor = false
  private let rules: [SvgCssRule]
  private var onStack = Set<ObjectIdentifier>()
  private var visits = 0
  /// Ops already moved into nested lists (pattern tiles, masks), counted against the budget.
  private var nestedOps = 0
  private let diag: CGFloat

  init(tree: SvgTree, vbW: CGFloat, vbH: CGFloat) {
    self.tree = tree
    self.vbW = vbW
    self.vbH = vbH
    rules = tree.css.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? [] : parseSvgStyleSheet(tree.css)
    diag = ((vbW * vbW + vbH * vbH) / 2).squareRoot()
  }

  /// Presentation attributes < style sheet < `style` attribute, with !important on top.
  func cascade(_ node: SvgNode) -> [String: String] {
    if let p = node.props { return p }
    var out = node.attrs
    let id = node.attrs["id"]?.trimmingCharacters(in: .whitespaces)
    let matched = rules.isEmpty ? [] : rules.filter { $0.selector.matches(node.name, id, node.classes) }
      .sorted { ($0.selector.specificity, $0.order) < ($1.selector.specificity, $1.order) }
    let inline = node.attrs["style"].map(parseSvgCssDeclarations) ?? []
    func put(_ d: SvgCssDeclaration) {
      // A shorthand resets the longhands set before it.
      if let longhands = svgShorthands[d.name] { for k in longhands { out.removeValue(forKey: k) } }
      out[d.name] = d.value
    }
    for r in matched { for d in r.declarations where !d.important { put(d) } }
    for d in inline where !d.important { put(d) }
    for r in matched { for d in r.declarations where d.important { put(d) } }
    for d in inline where d.important { put(d) }
    node.props = out
    return out
  }

  /// The inherited style at `node` in document order (for stops, clip paths, patterns, masks and markers).
  private func documentStyle(_ node: SvgNode) -> SvgStyleState {
    var chain: [SvgNode] = []
    var n: SvgNode? = node
    while let c = n { chain.append(c); n = c.parent }
    var s = SvgStyleState()
    for c in chain.reversed() { s = applySvgStyle(s, cascade(c)) }
    return s
  }

  private func compose(_ ctm: CGAffineTransform, _ node: SvgNode) -> CGAffineTransform {
    guard let t = node.attrs["transform"].flatMap(parseSvgTransform) else { return ctm }
    return svgMultiply(ctm, t)
  }

  private func isHidden(_ node: SvgNode) -> Bool {
    cascade(node)["display"]?.trimmingCharacters(in: .whitespaces) == "none"
  }

  private func opacityOf(_ props: [String: String]) -> CGFloat { props["opacity"].flatMap(parseSvgOpacity) ?? 1 }

  private func lx(_ node: SvgNode, _ k: String) -> CGFloat? { parseSvgLength(node.attrs[k], vbW) }
  private func ly(_ node: SvgNode, _ k: String) -> CGFloat? { parseSvgLength(node.attrs[k], vbH) }

  /// The ops `body` appends, as their own list.
  private func capture(_ body: () -> Void) -> [SvgOp] {
    let saved = ops
    ops = []
    body()
    let out = ops
    ops = saved
    nestedOps += out.count
    return out
  }

  func shapeCommands(_ node: SvgNode) -> [SvgPathCommand] {
    switch node.name {
    case "path": return parseSvgPathData(node.attrs["d"] ?? "")
    case "rect":
      return svgRectCommands(lx(node, "x") ?? 0, ly(node, "y") ?? 0, lx(node, "width") ?? 0, ly(node, "height") ?? 0,
                             lx(node, "rx"), ly(node, "ry"))
    case "circle":
      let r = parseSvgLength(node.attrs["r"], diag) ?? 0
      return svgEllipseCommands(lx(node, "cx") ?? 0, ly(node, "cy") ?? 0, r, r)
    case "ellipse":
      let rx = lx(node, "rx"), ry = ly(node, "ry")
      return svgEllipseCommands(lx(node, "cx") ?? 0, ly(node, "cy") ?? 0, rx ?? ry ?? 0, ry ?? rx ?? 0)
    case "line": return [.move(lx(node, "x1") ?? 0, ly(node, "y1") ?? 0), .line(lx(node, "x2") ?? 0, ly(node, "y2") ?? 0)]
    case "polyline": return svgPolyCommands(node.attrs["points"] ?? "", close: false)
    case "polygon": return svgPolyCommands(node.attrs["points"] ?? "", close: true)
    default: return []
    }
  }

  // MARK: bounds

  private func useTarget(_ node: SvgNode) -> SvgNode? {
    guard let h = node.href, h.hasPrefix("#") else { return nil }
    return tree.ids[String(h.dropFirst())]
  }

  /// Bounds of `node`'s geometry in its own user space (inside its transform).
  private func localBounds(_ node: SvgNode, _ depth: Int, _ seen: inout Set<ObjectIdentifier>) -> CGRect? {
    let key = ObjectIdentifier(node)
    if depth > maxSvgDepth || seen.contains(key) { return nil }
    seen.insert(key)
    defer { seen.remove(key) }
    if shapeTags.contains(node.name) { return svgPathBounds(shapeCommands(node)) }
    switch node.name {
    case "image":
      guard let w = lx(node, "width"), let h = ly(node, "height") else { return nil }
      return CGRect(x: lx(node, "x") ?? 0, y: ly(node, "y") ?? 0, width: w, height: h)
    case "text":
      return textBounds(layoutText(node, documentStyle(node)))
    case "use":
      guard let target = useTarget(node) else { return nil }
      let t = translation(lx(node, "x") ?? 0, ly(node, "y") ?? 0)
      if target.name == "symbol" {
        return CGRect(x: 0, y: 0, width: lx(node, "width") ?? vbW, height: ly(node, "height") ?? vbH).applying(t)
      }
      return childBounds(target, depth + 1, &seen)?.applying(t)
    default:
      guard containerTags.contains(node.name) else { return nil }
      var b: CGRect? = nil
      for c in node.children { b = unionBounds(b, childBounds(c, depth + 1, &seen)) }
      return b
    }
  }

  /// Bounds of `node` in its parent's user space.
  private func childBounds(_ node: SvgNode, _ depth: Int, _ seen: inout Set<ObjectIdentifier>) -> CGRect? {
    if isHidden(node) { return nil }
    return localBounds(node, depth, &seen)?.applying(compose(.identity, node))
  }

  private func boundsOf(_ node: SvgNode) -> CGRect? {
    var seen = Set<ObjectIdentifier>()
    return localBounds(node, 0, &seen)
  }

  // MARK: paint

  private func resolvePaint(_ p: SvgPaint, _ style: SvgStyleState, _ bounds: () -> CGRect?) -> SvgPaint {
    switch p {
    case .currentColor:
      if let c = style.color { return .color(c) }
      usesCurrentColor = true
      return p
    case let .ref(id, fallback):
      if let node = tree.ids[id] {
        if gradientTags.contains(node.name) { return gradientPaint(node, bounds) }
        if node.name == "pattern", let paint = patternPaint(node, bounds) { return paint }
      }
      return fallback.map { resolvePaint($0, style, bounds) } ?? SvgPaint.none
    default:
      return p
    }
  }

  private func gradientPaint(_ node: SvgNode, _ bounds: () -> CGRect?) -> SvgPaint {
    // The href chain, this gradient first.
    var chain: [SvgNode] = []
    var seen = Set<ObjectIdentifier>()
    var g: SvgNode? = node
    while let c = g, gradientTags.contains(c.name), chain.count < 16, !seen.contains(ObjectIdentifier(c)) {
      seen.insert(ObjectIdentifier(c))
      chain.append(c)
      g = c.href.flatMap { $0.hasPrefix("#") ? tree.ids[String($0.dropFirst())] : nil }
    }
    func attr(_ k: String, sameType: Bool = false) -> String? {
      for c in chain where !sameType || c.name == node.name {
        if let v = c.attrs[k]?.trimmingCharacters(in: .whitespaces), !v.isEmpty { return v }
      }
      return nil
    }

    var stops: [SvgGradientStop] = []
    let stopNodes = chain.first(where: { $0.children.contains { $0.name == "stop" } })?.children.filter { $0.name == "stop" } ?? []
    var last: CGFloat = 0
    for stop in stopNodes {
      let props = cascade(stop)
      var offset: CGFloat = 0
      if let o = stop.attrs["offset"]?.trimmingCharacters(in: .whitespaces) {
        if o.hasSuffix("%") {
          offset = Float(o.dropLast().trimmingCharacters(in: .whitespaces)).map { CGFloat($0 / 100) } ?? 0
        } else {
          offset = Float(o).map { CGFloat($0) } ?? 0
        }
      }
      last = max(last, min(max(offset, 0), 1))
      let opacity = props["stop-opacity"].flatMap(parseSvgOpacity) ?? 1
      var raw = props["stop-color"]?.trimmingCharacters(in: .whitespaces) ?? ""
      if raw.isEmpty || raw == "inherit" { raw = "black" }
      var argb: UInt32 = 0xFF00_0000
      var current = false
      if raw.lowercased() == "currentcolor" {
        if let c = documentStyle(stop).color {
          argb = c
        } else {
          current = true
          usesCurrentColor = true
        }
      } else {
        argb = parseSvgColor(raw) ?? 0xFF00_0000
      }
      let alpha = UInt32(min(max(Int(CGFloat((argb >> 24) & 0xFF) * opacity), 0), 255))
      stops.append(SvgGradientStop(offset: last, argb: (alpha << 24) | (argb & 0xFF_FFFF), currentColor: current))
    }
    if stops.isEmpty { return SvgPaint.none }

    let obb = attr("gradientUnits") != "userSpaceOnUse"
    let spread: SvgSpread
    switch attr("spreadMethod") {
    case "reflect": spread = .reflect
    case "repeat": spread = .repeat
    default: spread = .pad
    }
    var transform = attr("gradientTransform").flatMap(parseSvgTransform) ?? .identity
    if obb {
      guard let b = bounds(), b.width > 0, b.height > 0 else { return SvgPaint.none }
      transform = svgMultiply(boxTransform(b), transform)
    }
    func len(_ k: String, _ def: String, _ basis: CGFloat) -> CGFloat {
      let b = obb ? 1 : basis
      return parseSvgLength(attr(k, sameType: true) ?? def, b) ?? parseSvgLength(def, b) ?? 0
    }
    func solid() -> SvgPaint {
      let s = stops[stops.count - 1]
      if !s.currentColor { return .color(s.argb) }
      var a = s, b = s
      a.offset = 0
      b.offset = 1
      return .gradient(SvgGradient(radial: false, x1: 0, y1: 0, x2: 1, y2: 0, cx: 0, cy: 0, r: 0, fx: 0, fy: 0,
                                   stops: [a, b], spread: .pad, transform: transform))
    }
    if stops.count == 1 { return solid() }

    if node.name == "linearGradient" {
      let x1 = len("x1", "0%", vbW), y1 = len("y1", "0%", vbH)
      let x2 = len("x2", "100%", vbW), y2 = len("y2", "0%", vbH)
      if x1 == x2 && y1 == y2 { return solid() }
      return .gradient(SvgGradient(radial: false, x1: x1, y1: y1, x2: x2, y2: y2, cx: 0, cy: 0, r: 0, fx: 0, fy: 0,
                                   stops: stops, spread: spread, transform: transform))
    }
    let cx = len("cx", "50%", vbW), cy = len("cy", "50%", vbH), r = len("r", "50%", diag)
    if r < 0 { return SvgPaint.none }
    if r == 0 { return solid() }
    var fx = attr("fx", sameType: true).flatMap { parseSvgLength($0, obb ? 1 : vbW) } ?? cx
    var fy = attr("fy", sameType: true).flatMap { parseSvgLength($0, obb ? 1 : vbH) } ?? cy
    // A focal point outside the end circle moves onto it, as in SVG 1.1.
    let d = CGFloat(Float(hypot(Double(fx - cx), Double(fy - cy))))
    if d > CGFloat(Float(r) * 0.999) {
      let k = CGFloat(Float(r) * 0.999) / d
      fx = cx + (fx - cx) * k
      fy = cy + (fy - cy) * k
    }
    return .gradient(SvgGradient(radial: true, x1: 0, y1: 0, x2: 0, y2: 0, cx: cx, cy: cy, r: r, fx: fx, fy: fy,
                                 stops: stops, spread: spread, transform: transform))
  }

  /// `<pattern>` with its `href` chain: attributes from the first pattern that sets them, children
  /// from the first that has any. nil when it can't paint (no size or content, a cycle), which
  /// takes the paint's fallback as in browsers.
  private func patternPaint(_ node: SvgNode, _ bounds: () -> CGRect?) -> SvgPaint? {
    var chain: [SvgNode] = []
    var seen = Set<ObjectIdentifier>()
    var p: SvgNode? = node
    while let c = p, c.name == "pattern", chain.count < 16, !seen.contains(ObjectIdentifier(c)) {
      seen.insert(ObjectIdentifier(c))
      chain.append(c)
      p = c.href.flatMap { $0.hasPrefix("#") ? tree.ids[String($0.dropFirst())] : nil }
    }
    func attr(_ k: String) -> String? {
      for c in chain {
        if let v = c.attrs[k]?.trimmingCharacters(in: .whitespaces), !v.isEmpty { return v }
      }
      return nil
    }
    guard let content = chain.first(where: { $0.children.contains { $0.name != textNodeName } }) else { return nil }
    let key = ObjectIdentifier(content)
    if onStack.contains(key) { return nil }

    var viewBox: CGRect? = nil
    if let v = attr("viewBox") {
      let nums = parseSvgNumberList(v)
      if nums.count == 4 {
        // A zero-sized viewBox disables the pattern.
        if nums[2] <= 0 || nums[3] <= 0 { return nil }
        viewBox = CGRect(x: nums[0], y: nums[1], width: nums[2], height: nums[3])
      }
    }
    let obbUnits = attr("patternUnits") != "userSpaceOnUse"
    // A viewBox overrides patternContentUnits.
    let obbContent = viewBox == nil && attr("patternContentUnits") == "objectBoundingBox"
    var box = CGRect.zero
    if obbUnits || obbContent {
      guard let b = bounds(), b.width > 0, b.height > 0 else { return nil }
      box = b
    }
    func len(_ k: String, _ basis: CGFloat) -> CGFloat { parseSvgLength(attr(k), obbUnits ? 1 : basis) ?? 0 }
    var x = len("x", vbW), y = len("y", vbH), w = len("width", vbW), h = len("height", vbH)
    if obbUnits {
      x = box.minX + x * box.width
      y = box.minY + y * box.height
      w *= box.width
      h *= box.height
    }
    guard w > 0, h > 0 else { return nil }
    var tile = CGAffineTransform.identity
    if let vb = viewBox {
      let (ax, ay, slice) = parseSvgPreserveAspectRatio(attr("preserveAspectRatio"))
      tile = svgViewBoxTransform(vb, ax, ay, slice, w, h)
    } else if obbContent {
      tile = CGAffineTransform(scaleX: box.width, y: box.height)
    }
    let transform = svgMultiply(attr("patternTransform").flatMap(parseSvgTransform) ?? .identity, translation(x, y))
    // Contents inherit from the pattern, not from the shape that uses it.
    let style = documentStyle(content)
    onStack.insert(key)
    let tileOps = capture { for child in content.children { walk(child, style, tile, 1) } }
    onStack.remove(key)
    if tileOps.isEmpty { return nil }
    return .pattern(SvgPattern(width: w, height: h, transform: transform, ops: tileOps))
  }

  // MARK: clipping

  private func resolveClip(_ props: [String: String], _ ctm: CGAffineTransform, _ bounds: () -> CGRect?) -> SvgClipResolution {
    guard let id = props["clip-path"].flatMap(svgUrlFragment),
          let clipNode = tree.ids[id], clipNode.name == "clipPath" else { return .none }
    var base = ctm
    if clipNode.attrs["clipPathUnits"]?.trimmingCharacters(in: .whitespaces) == "objectBoundingBox" {
      guard let b = bounds(), b.width > 0, b.height > 0 else { return .empty }
      base = svgMultiply(base, boxTransform(b))
    }
    base = compose(base, clipNode)
    let style = documentStyle(clipNode)
    var paths: [SvgClipPath] = []
    for child in clipNode.children { collectClip(child, style, base, &paths, allowUse: true) }
    return paths.isEmpty ? .empty : .clip(SvgClip(paths))
  }

  private func collectClip(_ node: SvgNode, _ parent: SvgStyleState, _ base: CGAffineTransform, _ out: inout [SvgClipPath], allowUse: Bool) {
    if isHidden(node) { return }
    let style = applySvgStyle(parent, cascade(node))
    let m = compose(base, node)
    if node.name == "text" {
      for piece in layoutText(node, style) where piece.style.visible && piece.commands.count >= 2 {
        out.append(SvgClipPath(commands: piece.commands, transform: m, evenOdd: false))
      }
      return
    }
    if !style.visible { return }
    if shapeTags.contains(node.name) {
      let commands = shapeCommands(node)
      if commands.count >= 2 { out.append(SvgClipPath(commands: commands, transform: m, evenOdd: style.clipEvenOdd)) }
    } else if node.name == "use" && allowUse {
      guard let target = useTarget(node), shapeTags.contains(target.name) || target.name == "text" else { return }
      collectClip(target, style, svgMultiply(m, translation(lx(node, "x") ?? 0, ly(node, "y") ?? 0)), &out, allowUse: false)
    }
  }

  /// Runs `body` inside `props`' clip; skips it when the clip shows nothing.
  private func withClip(_ props: [String: String], _ ctm: CGAffineTransform, _ bounds: () -> CGRect?, _ body: () -> Void) {
    switch resolveClip(props, ctm, bounds) {
    case .empty:
      return
    case .none:
      body()
    case let .clip(clip):
      ops.append(.beginClip(clip))
      let start = ops.count
      body()
      if ops.count == start { ops.removeLast() } else { ops.append(.endClip) }
    }
  }

  // MARK: masking

  private func resolveMask(_ props: [String: String], _ ctm: CGAffineTransform, _ bounds: () -> CGRect?, _ depth: Int) -> SvgMaskResolution {
    guard let id = props["mask"].flatMap(svgUrlFragment), let maskNode = tree.ids[id], maskNode.name == "mask" else { return .none }
    let key = ObjectIdentifier(maskNode)
    // A mask used inside its own content is an error: nothing renders.
    if onStack.contains(key) { return .empty }
    let attrs = maskNode.attrs
    var regionT = ctm
    let x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat
    if attrs["maskUnits"]?.trimmingCharacters(in: .whitespaces) == "userSpaceOnUse" {
      x = parseSvgLength(attrs["x"] ?? "-10%", vbW) ?? 0
      y = parseSvgLength(attrs["y"] ?? "-10%", vbH) ?? 0
      w = parseSvgLength(attrs["width"] ?? "120%", vbW) ?? 0
      h = parseSvgLength(attrs["height"] ?? "120%", vbH) ?? 0
    } else {
      guard let b = bounds(), b.width > 0, b.height > 0 else { return .empty }
      regionT = svgMultiply(ctm, boxTransform(b))
      x = parseSvgLength(attrs["x"] ?? "-10%", 1) ?? 0
      y = parseSvgLength(attrs["y"] ?? "-10%", 1) ?? 0
      w = parseSvgLength(attrs["width"] ?? "120%", 1) ?? 0
      h = parseSvgLength(attrs["height"] ?? "120%", 1) ?? 0
    }
    guard w > 0, h > 0 else { return .empty }
    var contentT = ctm
    if attrs["maskContentUnits"]?.trimmingCharacters(in: .whitespaces) == "objectBoundingBox" {
      guard let b = bounds(), b.width > 0, b.height > 0 else { return .empty }
      contentT = svgMultiply(ctm, boxTransform(b))
    }
    // Contents inherit from the mask, not from the element it masks.
    let style = documentStyle(maskNode)
    onStack.insert(key)
    let maskOps = capture { for child in maskNode.children { walk(child, style, contentT, depth + 1) } }
    onStack.remove(key)
    if maskOps.isEmpty { return .empty }
    let region = SvgClip([SvgClipPath(commands: svgRectCommands(x, y, w, h, nil, nil), transform: regionT, evenOdd: false)])
    let alpha = cascade(maskNode)["mask-type"]?.trimmingCharacters(in: .whitespaces) == "alpha"
    return .mask(SvgMask(ops: maskOps, region: region, luminance: !alpha))
  }

  /// Runs `body` through `props`' mask; skips it when the mask shows nothing.
  private func withMask(_ props: [String: String], _ ctm: CGAffineTransform, _ bounds: () -> CGRect?, _ depth: Int, _ body: () -> Void) {
    switch resolveMask(props, ctm, bounds, depth) {
    case .empty:
      return
    case .none:
      body()
    case let .mask(mask):
      let content = capture(body)
      if !content.isEmpty { ops.append(.masked(mask, content)) }
    }
  }

  // MARK: markers

  /// The markers on a path, line, polyline or polygon, after the shape itself.
  private func walkMarkers(_ node: SvgNode, _ commands: [SvgPathCommand], _ style: SvgStyleState, _ ctm: CGAffineTransform, _ depth: Int) {
    var ends: [Bool]? = nil
    var cmds = commands
    if node.name == "path" {
      var e: [Bool] = []
      cmds = parseSvgPathData(node.attrs["d"] ?? "", vertexEnds: &e)
      ends = e
    }
    let vertices = svgMarkerVertices(cmds, vertexEnds: ends)
    guard !vertices.isEmpty else { return }
    let last = vertices.count - 1
    for (i, v) in vertices.enumerated() {
      if i == 0, let id = style.markerStart { drawMarker(id, v, start: true, style.strokeWidth, ctm, depth) }
      if i > 0 && i < last, let id = style.markerMid { drawMarker(id, v, start: false, style.strokeWidth, ctm, depth) }
      if i == last, let id = style.markerEnd { drawMarker(id, v, start: false, style.strokeWidth, ctm, depth) }
    }
  }

  private func drawMarker(_ id: String, _ v: SvgMarkerVertex, start: Bool, _ strokeWidth: CGFloat, _ ctm: CGAffineTransform, _ depth: Int) {
    guard let marker = tree.ids[id], marker.name == "marker" else { return }
    let key = ObjectIdentifier(marker)
    if depth > maxSvgDepth || onStack.contains(key) { return }
    let attrs = marker.attrs
    let mw = parseSvgLength(attrs["markerWidth"] ?? "3", vbW) ?? 0
    let mh = parseSvgLength(attrs["markerHeight"] ?? "3", vbH) ?? 0
    if mw <= 0 || mh <= 0 { return }
    var vbT = CGAffineTransform.identity
    var vb = CGRect(x: 0, y: 0, width: mw, height: mh)
    if let raw = attrs["viewBox"] {
      let nums = parseSvgNumberList(raw)
      if nums.count == 4 {
        if nums[2] <= 0 || nums[3] <= 0 { return }
        vb = CGRect(x: nums[0], y: nums[1], width: nums[2], height: nums[3])
        let (ax, ay, slice) = parseSvgPreserveAspectRatio(attrs["preserveAspectRatio"])
        vbT = svgViewBoxTransform(vb, ax, ay, slice, mw, mh)
      }
    }
    // refX/refY: viewBox units, or the SVG 2 keywords.
    func ref(_ raw: String?, _ lo: CGFloat, _ size: CGFloat, _ low: String, _ high: String) -> CGFloat {
      guard let v = raw?.trimmingCharacters(in: .whitespaces) else { return 0 }
      if v == low { return lo }
      if v == "center" { return lo + size / 2 }
      if v == high { return lo + size }
      return parseSvgLength(v, size) ?? 0
    }
    let refPoint = CGPoint(x: ref(attrs["refX"], vb.minX, vb.width, "left", "right"),
                           y: ref(attrs["refY"], vb.minY, vb.height, "top", "bottom")).applying(vbT)
    let scale = attrs["markerUnits"]?.trimmingCharacters(in: .whitespaces) == "userSpaceOnUse" ? 1 : strokeWidth
    if scale <= 0 { return }
    var angle: CGFloat
    switch attrs["orient"]?.trimmingCharacters(in: .whitespaces) {
    case "auto"?: angle = v.autoAngle
    case "auto-start-reverse"?: angle = v.autoAngle + (start ? 180 : 0)
    case let raw?: angle = parseSvgAngle(raw) ?? 0
    case nil: angle = 0
    }
    let rad = angle * .pi / 180
    let viewport = svgMultiply(ctm, CGAffineTransform(a: cos(rad) * scale, b: sin(rad) * scale, c: -sin(rad) * scale,
                                                      d: cos(rad) * scale, tx: v.x, ty: v.y))
      .translatedBy(x: -refPoint.x, y: -refPoint.y)
    let props = cascade(marker)
    let style = documentStyle(marker)
    let overflow = props["overflow"]?.trimmingCharacters(in: .whitespaces)
    let clip = overflow == "visible" || overflow == "auto" ? nil
      : SvgClip([SvgClipPath(commands: svgRectCommands(0, 0, mw, mh, nil, nil), transform: viewport, evenOdd: false)])
    onStack.insert(key)
    defer { onStack.remove(key) }
    if let clip = clip { ops.append(.beginClip(clip)) }
    let first = ops.count
    for child in marker.children { walk(child, style, svgMultiply(viewport, vbT), depth + 1) }
    if clip != nil { if ops.count == first { ops.removeLast() } else { ops.append(.endClip) } }
  }

  // MARK: text

  /// The text's characters after white space handling, with the `[start, end)` range each text
  /// content element covers (outermost first).
  private func collectText(_ node: SvgNode, _ style: SvgStyleState, _ out: inout [SvgTextChar],
                           _ ranges: inout [(SvgNode, Int, Int)], _ lastSpace: inout Bool, _ depth: Int) {
    if depth > maxSvgDepth { return }
    let slot = ranges.count
    ranges.append((node, out.count, out.count))
    for child in node.children {
      if child.name == textNodeName {
        for sc in child.text.unicodeScalars {
          let ws = sc == " " || sc == "\t" || sc == "\n" || sc == "\r"
          if style.preserveSpace {
            out.append(SvgTextChar(scalar: ws ? " " : sc, owner: node, style: style))
            lastSpace = false
          } else if ws {
            if lastSpace { continue }
            out.append(SvgTextChar(scalar: " ", owner: node, style: style))
            lastSpace = true
          } else {
            out.append(SvgTextChar(scalar: sc, owner: node, style: style))
            lastSpace = false
          }
        }
      } else if child.name == "tspan" || child.name == "a" {
        if isHidden(child) { continue }
        collectText(child, applySvgStyle(style, cascade(child)), &out, &ranges, &lastSpace, depth + 1)
      }
    }
    ranges[slot].2 = out.count
  }

  /// Glyph outlines of a `<text>` with `style`, laid out in its user space.
  private func layoutText(_ node: SvgNode, _ style: SvgStyleState) -> [SvgTextPiece] {
    var chars: [SvgTextChar] = []
    var ranges: [(SvgNode, Int, Int)] = []
    var lastSpace = true
    collectText(node, style, &chars, &ranges, &lastSpace, 0)
    if let last = chars.last, last.scalar == " ", !last.style.preserveSpace { chars.removeLast() }
    if chars.isEmpty { return [] }
    // Each element's positions go to its own characters in order; inner elements win.
    for (el, start, end) in ranges {
      let stop = min(end, chars.count)
      guard start < stop else { continue }
      let xs = parseSvgLengthList(el.attrs["x"], vbW), ys = parseSvgLengthList(el.attrs["y"], vbH)
      let dxs = parseSvgLengthList(el.attrs["dx"], vbW), dys = parseSvgLengthList(el.attrs["dy"], vbH)
      for k in 0..<(stop - start) {
        let i = start + k
        if k < xs.count { chars[i].x = xs[k] }
        if k < ys.count { chars[i].y = ys[k] }
        if k < dxs.count { chars[i].dx = dxs[k] }
        if k < dys.count { chars[i].dy = dys[k] }
      }
    }

    var pieces: [SvgTextPiece] = []
    // Anchored chunks: first piece, start x and anchor; each ends where the next starts.
    var chunks: [(first: Int, startX: CGFloat, endX: CGFloat, anchor: SvgTextAnchor)] = []
    var px: CGFloat = 0, py: CGFloat = 0
    var i = 0
    while i < chars.count {
      let c = chars[i]
      let penX = px
      if let x = c.x { px = x }
      if let y = c.y { py = y }
      px += c.dx
      py += c.dy
      if i == 0 || c.x != nil || c.y != nil {
        if !chunks.isEmpty { chunks[chunks.count - 1].endX = penX }
        chunks.append((first: pieces.count, startX: px, endX: px, anchor: c.style.textAnchor))
      }
      // One run: same element, no positioning after its first character.
      var j = i + 1
      while j < chars.count, chars[j].owner === c.owner, chars[j].x == nil, chars[j].y == nil, chars[j].dx == 0, chars[j].dy == 0 {
        j += 1
      }
      var scalars = String.UnicodeScalarView()
      scalars.append(contentsOf: chars[i..<j].map { $0.scalar })
      let run = svgTextShaper.shape(String(scalars), font: c.style.font, letterSpacing: c.style.letterSpacing,
                                    wordSpacing: c.style.wordSpacing)
      let shift = svgBaselineShift(c.style.baseline, run)
      if !run.commands.isEmpty {
        pieces.append(SvgTextPiece(commands: svgTranslated(run.commands, px, py + shift), style: c.style))
      }
      px += run.advance
      i = j
    }
    if !chunks.isEmpty { chunks[chunks.count - 1].endX = px }
    for (n, chunk) in chunks.enumerated() where chunk.anchor != .start {
      let width = chunk.endX - chunk.startX
      let dx = chunk.anchor == .middle ? -width / 2 : -width
      let end = n + 1 < chunks.count ? chunks[n + 1].first : pieces.count
      for p in chunk.first..<end { pieces[p].commands = svgTranslated(pieces[p].commands, dx, 0) }
    }
    return pieces
  }

  private func textBounds(_ pieces: [SvgTextPiece]) -> CGRect? {
    var b: CGRect? = nil
    for p in pieces { b = unionBounds(b, svgPathBounds(p.commands)) }
    return b
  }

  // MARK: walk

  func walk(_ node: SvgNode, _ parent: SvgStyleState, _ ctm: CGAffineTransform, _ depth: Int) {
    visits += 1
    if depth > maxSvgDepth || visits > maxSvgVisits || ops.count + nestedOps >= maxSvgOps { return }
    let key = ObjectIdentifier(node)
    if isHidden(node) || onStack.contains(key) { return }
    onStack.insert(key)
    defer { onStack.remove(key) }
    if containerTags.contains(node.name) {
      walkContainer(node, parent, ctm, depth)
    } else if shapeTags.contains(node.name) {
      walkShape(node, parent, ctm, depth)
    } else if node.name == "use" {
      walkUse(node, parent, ctm, depth)
    } else if node.name == "image" {
      walkImage(node, parent, ctm, depth)
    } else if node.name == "text" {
      walkText(node, parent, ctm, depth)
    }
  }

  private func walkContainer(_ node: SvgNode, _ parent: SvgStyleState, _ parentCtm: CGAffineTransform, _ depth: Int) {
    let props = cascade(node)
    let style = applySvgStyle(parent, props)
    // The root's own transform is ignored (as in SVG 1.1); nested elements compose theirs.
    let ctm = node === tree.root ? parentCtm : compose(parentCtm, node)
    let opacity = opacityOf(props)
    withMask(props, ctm, { boundsOf(node) }, depth) {
      withClip(props, ctm, { boundsOf(node) }) {
        let group = opacity < 1
        if group { ops.append(.beginGroup(opacity)) }
        for child in node.children { walk(child, style, ctm, depth + 1) }
        if group { ops.append(.endGroup) }
      }
    }
  }

  private func walkShape(_ node: SvgNode, _ parent: SvgStyleState, _ parentCtm: CGAffineTransform, _ depth: Int) {
    let props = cascade(node)
    let style = applySvgStyle(parent, props)
    let ctm = compose(parentCtm, node)
    let opacity = opacityOf(props)
    if !style.visible || opacity <= 0 { return }
    let commands = shapeCommands(node)
    if commands.count < 2 { return }
    var measured = false
    var bounds: CGRect? = nil
    let boundsFn: () -> CGRect? = {
      if !measured {
        bounds = svgPathBounds(commands)
        measured = true
      }
      return bounds
    }
    var shape = SvgShape(
      commands: commands,
      transform: ctm,
      fill: node.name == "line" ? .none : resolvePaint(style.fill, style, boundsFn),
      fillOpacity: style.fillOpacity,
      evenOdd: style.evenOdd,
      stroke: resolvePaint(style.stroke, style, boundsFn),
      strokeOpacity: style.strokeOpacity,
      strokeWidth: style.strokeWidth,
      lineCap: style.lineCap,
      lineJoin: style.lineJoin,
      miterLimit: style.miterLimit,
      dashArray: style.dashArray,
      dashOffset: style.dashOffset
    )
    let markers = style.hasMarkers && markerTags.contains(node.name)
    let painted = shape.hasFill || shape.hasStroke
    if !painted && !markers { return }
    withMask(props, ctm, boundsFn, depth) {
      withClip(props, ctm, boundsFn) {
        // Fill, stroke and markers overlap, so at partial opacity they composite together.
        let group = opacity < 1 && ((shape.hasFill && shape.hasStroke) || markers)
        if group {
          ops.append(.beginGroup(opacity))
        } else if opacity < 1 {
          shape.fillOpacity *= opacity
          shape.strokeOpacity *= opacity
        }
        if painted { ops.append(.shape(shape)) }
        if markers { walkMarkers(node, commands, style, ctm, depth) }
        if group { ops.append(.endGroup) }
      }
    }
  }

  private func walkUse(_ node: SvgNode, _ parent: SvgStyleState, _ parentCtm: CGAffineTransform, _ depth: Int) {
    guard let target = useTarget(node) else { return }
    let props = cascade(node)
    let style = applySvgStyle(parent, props)
    // x/y translate the referenced content; the use's own clip is in its user space.
    let own = compose(parentCtm, node)
    let ctm = svgMultiply(own, translation(lx(node, "x") ?? 0, ly(node, "y") ?? 0))
    let opacity = opacityOf(props)
    withMask(props, own, { boundsOf(node) }, depth) {
      withClip(props, own, { boundsOf(node) }) {
        let group = opacity < 1
        if group { ops.append(.beginGroup(opacity)) }
        if target.name == "symbol" { walkSymbol(target, node, style, ctm, depth + 1) } else { walk(target, style, ctm, depth + 1) }
        if group { ops.append(.endGroup) }
      }
    }
  }

  private func walkSymbol(_ symbol: SvgNode, _ use: SvgNode, _ parent: SvgStyleState, _ ctm: CGAffineTransform, _ depth: Int) {
    let key = ObjectIdentifier(symbol)
    if depth > maxSvgDepth || isHidden(symbol) || onStack.contains(key) { return }
    onStack.insert(key)
    defer { onStack.remove(key) }
    let w = lx(use, "width") ?? vbW, h = ly(use, "height") ?? vbH
    if w <= 0 || h <= 0 { return }
    let props = cascade(symbol)
    let style = applySvgStyle(parent, props)
    var inner = ctm
    if let v = symbol.attrs["viewBox"] {
      let nums = parseSvgNumberList(v)
      if nums.count == 4 && nums[2] > 0 && nums[3] > 0 {
        let (ax, ay, slice) = parseSvgPreserveAspectRatio(symbol.attrs["preserveAspectRatio"])
        let vb = CGRect(x: nums[0], y: nums[1], width: nums[2], height: nums[3])
        inner = svgMultiply(ctm, svgViewBoxTransform(vb, ax, ay, slice, w, h))
      }
    }
    let overflow = props["overflow"]?.trimmingCharacters(in: .whitespaces)
    let clip: SvgClip? = overflow == "visible" || overflow == "auto" ? nil
      : SvgClip([SvgClipPath(commands: svgRectCommands(0, 0, w, h, nil, nil), transform: ctm, evenOdd: false)])
    let opacity = opacityOf(props)
    if let clip = clip { ops.append(.beginClip(clip)) }
    if opacity < 1 { ops.append(.beginGroup(opacity)) }
    for child in symbol.children { walk(child, style, inner, depth + 1) }
    if opacity < 1 { ops.append(.endGroup) }
    if clip != nil { ops.append(.endClip) }
  }

  private func walkImage(_ node: SvgNode, _ parent: SvgStyleState, _ parentCtm: CGAffineTransform, _ depth: Int) {
    let props = cascade(node)
    let style = applySvgStyle(parent, props)
    let ctm = compose(parentCtm, node)
    let opacity = opacityOf(props)
    if !style.visible || opacity <= 0 { return }
    // Raster data: URLs only; an SVG inside an SVG is not drawn.
    guard let href = node.href, href.lowercased().hasPrefix("data:"), !href.lowercased().hasPrefix("data:image/svg") else { return }
    let w = lx(node, "width"), h = ly(node, "height")
    if let w = w, w <= 0 { return }
    if let h = h, h <= 0 { return }
    let x = lx(node, "x") ?? 0, y = ly(node, "y") ?? 0
    let (ax, ay, slice) = parseSvgPreserveAspectRatio(node.attrs["preserveAspectRatio"])
    let boundsFn: () -> CGRect? = { w != nil && h != nil ? CGRect(x: x, y: y, width: w!, height: h!) : nil }
    withMask(props, ctm, boundsFn, depth) {
      withClip(props, ctm, boundsFn) {
        ops.append(.image(SvgImage(href: href, x: x, y: y, width: w, height: h, alignX: ax, alignY: ay, slice: slice,
                                   transform: ctm, opacity: opacity)))
      }
    }
  }

  private func walkText(_ node: SvgNode, _ parent: SvgStyleState, _ parentCtm: CGAffineTransform, _ depth: Int) {
    let props = cascade(node)
    let style = applySvgStyle(parent, props)
    let ctm = compose(parentCtm, node)
    let opacity = opacityOf(props)
    if opacity <= 0 { return }
    let pieces = layoutText(node, style)
    if pieces.isEmpty { return }
    var measured = false
    var bounds: CGRect? = nil
    let boundsFn: () -> CGRect? = {
      if !measured {
        bounds = self.textBounds(pieces)
        measured = true
      }
      return bounds
    }
    // Paint servers in bounding-box units use the whole text's box.
    var shapes: [SvgShape] = []
    for piece in pieces where piece.style.visible {
      let s = piece.style
      let shape = SvgShape(commands: piece.commands, transform: ctm, fill: resolvePaint(s.fill, s, boundsFn),
                           fillOpacity: s.fillOpacity, evenOdd: false, stroke: resolvePaint(s.stroke, s, boundsFn),
                           strokeOpacity: s.strokeOpacity, strokeWidth: s.strokeWidth, lineCap: s.lineCap,
                           lineJoin: s.lineJoin, miterLimit: s.miterLimit, dashArray: s.dashArray, dashOffset: s.dashOffset)
      if shape.hasFill || shape.hasStroke { shapes.append(shape) }
    }
    if shapes.isEmpty { return }
    withMask(props, ctm, boundsFn, depth) {
      withClip(props, ctm, boundsFn) {
        if opacity < 1 { ops.append(.beginGroup(opacity)) }
        for shape in shapes { ops.append(.shape(shape)) }
        if opacity < 1 { ops.append(.endGroup) }
      }
    }
  }
}

/// Parse an SVG document; nil when it has no root `<svg>` or no usable size.
func parseSvgDocument(_ svg: String) -> SvgDocument? {
  guard let tree = buildSvgTree(svg) else { return nil }
  let attrs = tree.root.attrs
  var viewBox: CGRect? = nil
  if let vb = attrs["viewBox"] {
    let nums = parseSvgNumberList(vb)
    if nums.count == 4 && nums[2] > 0 && nums[3] > 0 {
      viewBox = CGRect(x: nums[0], y: nums[1], width: nums[2], height: nums[3])
    }
  }
  var vbW = viewBox?.width ?? 0
  var vbH = viewBox?.height ?? 0
  func dimension(_ key: String) -> CGFloat? {
    guard let v = attrs[key], !v.trimmingCharacters(in: .whitespaces).hasSuffix("%"),
          let len = parseSvgLength(v, 0), len > 0 else { return nil }
    return len
  }
  let w = dimension("width"), h = dimension("height")
  let ratio: CGFloat? = vbW > 0 && vbH > 0 ? vbW / vbH : nil
  let width = w ?? ((h != nil && ratio != nil) ? h! * ratio! : vbW)
  let height = h ?? ((w != nil && ratio != nil) ? w! / ratio! : vbH)
  if vbW <= 0 { vbW = width }
  if vbH <= 0 { vbH = height }
  let (alignX, alignY, slice) = parseSvgPreserveAspectRatio(attrs["preserveAspectRatio"])
  guard width > 0, height > 0 else { return nil }

  let builder = SvgBuilder(tree: tree, vbW: vbW, vbH: vbH)
  builder.walk(tree.root, SvgStyleState(), .identity, 0)
  return SvgDocument(width: width, height: height, viewBox: viewBox, alignX: alignX, alignY: alignY,
                     slice: slice, ops: builder.ops, usesCurrentColor: builder.usesCurrentColor)
}

/// Percent-decode a data URI payload; malformed escapes stay as written and `+` stays `+`.
func percentDecodeBytes(_ payload: String) -> Data {
  let s = Array(payload.utf8)
  var out = Data(capacity: s.count)
  var i = 0
  func hex(_ c: UInt8) -> UInt8? {
    switch c {
    case 48...57: return c - 48
    case 65...70: return c - 55
    case 97...102: return c - 87
    default: return nil
    }
  }
  while i < s.count {
    if s[i] == UInt8(ascii: "%"), i + 2 < s.count, let hi = hex(s[i + 1]), let lo = hex(s[i + 2]) {
      out.append(hi << 4 | lo)
      i += 3
      continue
    }
    out.append(s[i])
    i += 1
  }
  return out
}

func decodeSvgDataPayload(_ payload: String) -> String {
  guard payload.contains("%") else { return payload }
  return String(decoding: percentDecodeBytes(payload), as: UTF8.self)
}
