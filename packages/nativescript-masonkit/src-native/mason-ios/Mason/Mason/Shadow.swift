//
//  Shadow.swift
//  Mason
//
//  Created by Osei Fortune on 21/12/2025.
//

#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

struct TextShadow {
  let offsetX: CGFloat
  let offsetY: CGFloat
  let blurRadius: CGFloat
  let color: UIColor

  /// How far `shadows` reach past the glyphs on each side, blur included.
  static func outsets(_ shadows: [TextShadow]) -> UIEdgeInsets {
    var out = UIEdgeInsets.zero
    for s in shadows {
      let blur = ceil(s.blurRadius * 2)
      out.left = max(out.left, blur - s.offsetX)
      out.right = max(out.right, blur + s.offsetX)
      out.top = max(out.top, blur - s.offsetY)
      out.bottom = max(out.bottom, blur + s.offsetY)
    }
    return out
  }

  /// Paints `draw` once per shadow, last shadow first so the first ends up on top as in CSS,
  /// the same way `TextEngine` paints text-shadow. The caller paints the text itself afterwards.
  static func paint(_ shadows: [TextShadow], in context: CGContext, _ draw: () -> Void) {
    for s in shadows.reversed() {
      context.saveGState()
      context.setShadow(offset: CGSize(width: s.offsetX, height: -s.offsetY), blur: s.blurRadius, color: s.color.cgColor)
      draw()
      context.restoreGState()
    }
  }

#if canImport(UIKit)
  /// One shadow as a text attribute, for text views that take a single shadow.
  var nsShadow: NSShadow {
    let shadow = NSShadow()
    shadow.shadowOffset = CGSize(width: offsetX, height: offsetY)
    shadow.shadowBlurRadius = blurRadius
    shadow.shadowColor = color
    return shadow
  }
#endif
}

struct BoxShadow: Hashable {
  let offsetX: CGFloat
  let offsetY: CGFloat
  let blurRadius: CGFloat
  let spreadRadius: CGFloat
  let color: UIColor
  let inset: Bool
  
  func hash(into hasher: inout Hasher) {
    hasher.combine(offsetX)
    hasher.combine(offsetY)
    hasher.combine(blurRadius)
    hasher.combine(spreadRadius)
    hasher.combine(inset)
    // Hash color by its RGBA components
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
    color.getRGBA(&r, &g, &b, &a)
    hasher.combine(r)
    hasher.combine(g)
    hasher.combine(b)
    hasher.combine(a)
  }
  
  static func == (lhs: BoxShadow, rhs: BoxShadow) -> Bool {
    var lr: CGFloat = 0, lg: CGFloat = 0, lb: CGFloat = 0, la: CGFloat = 0
    var rr: CGFloat = 0, rg: CGFloat = 0, rb: CGFloat = 0, ra: CGFloat = 0
    lhs.color.getRGBA(&lr, &lg, &lb, &la)
    rhs.color.getRGBA(&rr, &rg, &rb, &ra)
    return lhs.offsetX == rhs.offsetX &&
           lhs.offsetY == rhs.offsetY &&
           lhs.blurRadius == rhs.blurRadius &&
           lhs.spreadRadius == rhs.spreadRadius &&
           lhs.inset == rhs.inset &&
           lr == rr && lg == rg && lb == rb && la == ra
  }
}

func withCssRecords<Result>(
  _ value: String, kind: CssParseKind, style: MasonStyle? = nil,
  _ decode: (UnsafeBufferPointer<Double>) -> Result
) -> Result {
  let viewport = NSCMason.viewportSize
  let result = value.withCString {
    mason_css_parse($0, kind.rawValue, 1, style?.fontSize ?? NSCMason.rootFontSize,
                    NSCMason.rootFontSize, Float(viewport.width), Float(viewport.height),
                    style?.color ?? 0xff000000)
  }
  defer { mason_css_values_release(result) }
  return decode(UnsafeBufferPointer(start: result.values, count: Int(result.len)))
}

func withStyleCssRecords<Result>(
  _ style: MasonStyle, _ value: String, kind: StyleRecordKind,
  _ decode: (UnsafeBufferPointer<Double>) -> Result
) -> Result {
  let viewport = NSCMason.viewportSize
  return projectStyleCssRecords(style, kind: kind, store: true, project: { mason, node in
    value.withCString {
      mason_css_set_style_records(mason, node, kind.rawValue, $0, 1, style.fontSize, NSCMason.rootFontSize,
                                  Float(viewport.width), Float(viewport.height), style.color)
    }
  }, decode: decode)
}

func projectStyleCssRecords<Result>(
  _ style: MasonStyle, kind: StyleRecordKind, store: Bool,
  project: (OpaquePointer?, OpaquePointer?) -> CMasonStyleRecords,
  decode: (UnsafeBufferPointer<Double>) -> Result
) -> Result {
  let node = style.node
  let attached = store && !node.isPlaceholder
  let deferred = attached && node.mason.inCompute
  if attached && !deferred {
    style.prepareMut()
  }
  let records = project(attached && !deferred ? node.mason.nativePtr : nil, attached ? node.nativePtr : nil)
  if deferred && (kind != .fontFeatures || records.values != nil) {
    node.mason.deferStyleRecords(style, kind: kind)
  }
  defer { mason_css_style_records_release(records) }
  return decode(UnsafeBufferPointer(start: records.values, count: Int(records.len)))
}

enum ShadowParser {
  static func parseTextShadow(style: MasonStyle, value: String) -> [TextShadow] {
    withStyleCssRecords(style, value, kind: .textShadow, readTextShadows)
  }

  static func readTextShadows(_ records: UnsafeBufferPointer<Double>) -> [TextShadow] {
    stride(from: 0, to: records.count, by: ShadowRecord.stride).map { index in
      TextShadow(
        offsetX: CGFloat(records[index + ShadowRecord.x]), offsetY: CGFloat(records[index + ShadowRecord.y]),
        blurRadius: CGFloat(records[index + ShadowRecord.blur]) * 0.1,
        color: UIColor.colorFromARGB(UInt32(records[index + ShadowRecord.color])).adjustedAlpha(1.15)
      )
    }
  }

  static func parseBoxShadow(style: MasonStyle, value: String) -> [BoxShadow] {
    withStyleCssRecords(style, value, kind: .boxShadow, readBoxShadows)
  }

  static func readBoxShadows(_ records: UnsafeBufferPointer<Double>) -> [BoxShadow] {
    stride(from: 0, to: records.count, by: ShadowRecord.stride).map { index in
      BoxShadow(
        offsetX: CGFloat(records[index + ShadowRecord.x]), offsetY: CGFloat(records[index + ShadowRecord.y]),
        blurRadius: CGFloat(records[index + ShadowRecord.blur]), spreadRadius: CGFloat(records[index + ShadowRecord.spread]),
        color: UIColor.colorFromARGB(UInt32(records[index + ShadowRecord.color])), inset: records[index + ShadowRecord.inset] != 0
      )
    }
  }
}
