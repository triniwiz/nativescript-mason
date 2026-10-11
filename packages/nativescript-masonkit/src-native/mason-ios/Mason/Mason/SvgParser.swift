//
//  SvgParser.swift
//  Mason
//
//  A static-SVG reader for `data:image/svg+xml` images (pure parsing; `renderSvgDocument` in
//  Background.swift draws). Handles shapes, the full path grammar, fill/stroke presentation
//  attributes and `style`, `transform` and viewBox; not gradients, patterns, <use>, <text>,
//  <image>, clip paths, masks, filters or <style>. Keep in step with the Kotlin `SvgParser.kt`.
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
  var out: [SvgPathCommand] = []
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
      appendSvgArc(&out, cx, cy, rx, ry, rot, large, sweep, x, y)
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
    // Gradients/patterns aren't drawn: use the fallback colour, else nothing.
    guard let close = v.firstIndex(of: ")") else { return SvgPaint.none }
    let fallback = v[v.index(after: close)...].trimmingCharacters(in: .whitespaces)
    if fallback.isEmpty { return SvgPaint.none }
    return parseSvgPaint(fallback) ?? SvgPaint.none
  }
  return parseSvgColor(v).map { .color($0) }
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
}

private struct SvgFrame {
  let style: SvgStyleState
  let ctm: CGAffineTransform
  let skip: Bool
  let group: Bool
}

private let containerTags: Set<String> = ["svg", "g", "a", "switch"]
private let shapeTags: Set<String> = ["path", "rect", "circle", "ellipse", "line", "polyline", "polygon"]

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

/// Presentation attributes plus the `style` attribute's declarations (which win).
private func svgProperties(_ attrs: [String: String]) -> [String: String] {
  guard let style = attrs["style"] else { return attrs }
  var merged = attrs
  for decl in style.split(separator: ";") {
    guard let colon = decl.firstIndex(of: ":") else { continue }
    let name = decl[..<colon].trimmingCharacters(in: .whitespaces).lowercased()
    let value = decl[decl.index(after: colon)...].replacingOccurrences(of: "!important", with: "")
      .trimmingCharacters(in: .whitespaces)
    if !name.isEmpty && !value.isEmpty { merged[name] = value }
  }
  return merged
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
  return s
}

/// Parse an SVG document; nil when it has no root `<svg>` or no usable size.
func parseSvgDocument(_ svg: String) -> SvgDocument? {
  let s = Array(svg.utf8)
  let n = s.count
  var ops: [SvgOp] = []
  var stack: [SvgFrame] = []
  var usesCurrentColor = false
  var rootFound = false
  var width: CGFloat = 0, height: CGFloat = 0
  var viewBox: CGRect? = nil
  var alignX: Int? = 0, alignY: Int? = 0
  var slice = false
  var vbW: CGFloat = 0, vbH: CGFloat = 0
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
  func resolvePaint(_ p: SvgPaint, _ style: SvgStyleState) -> SvgPaint {
    guard p == .currentColor else { return p }
    if let c = style.color { return .color(c) }
    usesCurrentColor = true
    return p
  }

  var i = 0
  while i < n {
    guard let open = s[i...].firstIndex(of: lt) else { break }
    if starts("<!--", at: open) {
      i = find("-->", from: open + 4).map { $0 + 3 } ?? n
      continue
    }
    if starts("<![CDATA[", at: open) {
      i = find("]]>", from: open + 9).map { $0 + 3 } ?? n
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
      if let frame = stack.popLast(), frame.group { ops.append(.endGroup) }
      continue
    }
    let selfClosing = body.last == slash
    var nameEnd = body.startIndex
    while nameEnd < body.endIndex && !isSvgWsp(body[nameEnd]) && body[nameEnd] != slash { nameEnd += 1 }
    var nameBytes = body[body.startIndex..<nameEnd]
    if let c = nameBytes.firstIndex(of: colon) { nameBytes = nameBytes[(c + 1)...] }
    let name = String(decoding: nameBytes, as: UTF8.self)
    let parent = stack.last

    if !rootFound && name != "svg" {
      if !selfClosing { stack.append(SvgFrame(style: SvgStyleState(), ctm: .identity, skip: true, group: false)) }
      continue
    }
    if let parent = parent, parent.skip {
      if !selfClosing { stack.append(SvgFrame(style: parent.style, ctm: parent.ctm, skip: true, group: false)) }
      continue
    }

    let attrs = parseSvgAttributes(String(decoding: body[nameEnd...], as: UTF8.self))
    let props = svgProperties(attrs)

    let isRoot = !rootFound
    if isRoot {
      rootFound = true
      if let vb = attrs["viewBox"] {
        let nums = parseSvgNumberList(vb)
        if nums.count == 4 && nums[2] > 0 && nums[3] > 0 {
          viewBox = CGRect(x: nums[0], y: nums[1], width: nums[2], height: nums[3])
        }
      }
      vbW = viewBox?.width ?? 0
      vbH = viewBox?.height ?? 0
      func dimension(_ key: String) -> CGFloat? {
        guard let v = attrs[key], !v.trimmingCharacters(in: .whitespaces).hasSuffix("%"),
              let len = parseSvgLength(v, 0), len > 0 else { return nil }
        return len
      }
      let w = dimension("width"), h = dimension("height")
      let ratio: CGFloat? = vbW > 0 && vbH > 0 ? vbW / vbH : nil
      width = w ?? ((h != nil && ratio != nil) ? h! * ratio! : vbW)
      height = h ?? ((w != nil && ratio != nil) ? w! / ratio! : vbH)
      if vbW <= 0 { vbW = width }
      if vbH <= 0 { vbH = height }
      if let par = attrs["preserveAspectRatio"]?.trimmingCharacters(in: .whitespaces) {
        let parts = par.split(whereSeparator: { $0 == " " || $0 == "\t" || $0 == "\n" }).map(String.init)
        let align = parts.first ?? ""
        if align == "none" {
          alignX = nil; alignY = nil
        } else if align.count == 8 && align.hasPrefix("x") {
          let chars = Array(align)
          let xs = String(chars[1..<4]), ys = String(chars[5..<8])
          alignX = xs == "Min" ? -1 : xs == "Max" ? 1 : 0
          alignY = ys == "Min" ? -1 : ys == "Max" ? 1 : 0
        }
        slice = parts.count > 1 && parts[1] == "slice"
      }
    }

    let parentStyle = parent?.style ?? SvgStyleState()
    let parentCtm = parent?.ctm ?? .identity
    let hidden = props["display"]?.trimmingCharacters(in: .whitespaces) == "none"
    let isContainer = containerTags.contains(name)
    let isShape = shapeTags.contains(name)

    if hidden || (!isContainer && !isShape) {
      if !selfClosing { stack.append(SvgFrame(style: parentStyle, ctm: parentCtm, skip: true, group: false)) }
      continue
    }

    let style = applySvgStyle(parentStyle, props)
    // The root's own transform is ignored (as in SVG 1.1); nested elements compose theirs.
    var ctm = parentCtm
    if !isRoot, let t = attrs["transform"].flatMap(parseSvgTransform) { ctm = t.concatenating(parentCtm) }
    let opacity = props["opacity"].flatMap(parseSvgOpacity) ?? 1

    if isContainer {
      let group = opacity < 1
      if group { ops.append(.beginGroup(opacity)) }
      if selfClosing {
        if group { ops.append(.endGroup) }
      } else {
        stack.append(SvgFrame(style: style, ctm: ctm, skip: false, group: group))
      }
      continue
    }

    // A shape. Its children (<title>, <animate>, ...) are never drawn.
    if !selfClosing { stack.append(SvgFrame(style: style, ctm: ctm, skip: true, group: false)) }
    if !style.visible || opacity <= 0 { continue }
    let diag = ((vbW * vbW + vbH * vbH) / 2).squareRoot()
    func lx(_ k: String) -> CGFloat? { parseSvgLength(attrs[k], vbW) }
    func ly(_ k: String) -> CGFloat? { parseSvgLength(attrs[k], vbH) }
    let commands: [SvgPathCommand]
    switch name {
    case "path": commands = parseSvgPathData(attrs["d"] ?? "")
    case "rect": commands = svgRectCommands(lx("x") ?? 0, ly("y") ?? 0, lx("width") ?? 0, ly("height") ?? 0, lx("rx"), ly("ry"))
    case "circle":
      let r = parseSvgLength(attrs["r"], diag) ?? 0
      commands = svgEllipseCommands(lx("cx") ?? 0, ly("cy") ?? 0, r, r)
    case "ellipse":
      let rx = lx("rx"), ry = ly("ry")
      commands = svgEllipseCommands(lx("cx") ?? 0, ly("cy") ?? 0, rx ?? ry ?? 0, ry ?? rx ?? 0)
    case "line": commands = [.move(lx("x1") ?? 0, ly("y1") ?? 0), .line(lx("x2") ?? 0, ly("y2") ?? 0)]
    case "polyline": commands = svgPolyCommands(attrs["points"] ?? "", close: false)
    case "polygon": commands = svgPolyCommands(attrs["points"] ?? "", close: true)
    default: commands = []
    }
    if commands.count < 2 { continue }

    var shape = SvgShape(
      commands: commands,
      transform: ctm,
      fill: name == "line" ? .none : resolvePaint(style.fill, style),
      fillOpacity: style.fillOpacity,
      evenOdd: style.evenOdd,
      stroke: resolvePaint(style.stroke, style),
      strokeOpacity: style.strokeOpacity,
      strokeWidth: style.strokeWidth,
      lineCap: style.lineCap,
      lineJoin: style.lineJoin,
      miterLimit: style.miterLimit,
      dashArray: style.dashArray,
      dashOffset: style.dashOffset
    )
    if !shape.hasFill && !shape.hasStroke { continue }
    if opacity < 1 {
      if shape.hasFill && shape.hasStroke {
        // Fill and stroke overlap, so they composite together.
        ops.append(.beginGroup(opacity))
        ops.append(.shape(shape))
        ops.append(.endGroup)
        continue
      }
      shape.fillOpacity *= opacity
      shape.strokeOpacity *= opacity
    }
    ops.append(.shape(shape))
  }
  // An unclosed document still balances its groups.
  for frame in stack.reversed() where frame.group { ops.append(.endGroup) }

  guard rootFound, width > 0, height > 0 else { return nil }
  return SvgDocument(width: width, height: height, viewBox: viewBox, alignX: alignX, alignY: alignY,
                     slice: slice, ops: ops, usesCurrentColor: usesCurrentColor)
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
