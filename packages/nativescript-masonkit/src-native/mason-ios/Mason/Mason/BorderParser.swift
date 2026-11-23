//
//  BorderParser.swift
//  Mason
//
//  Created by Osei Fortune on 25/11/2025.
//

#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

// MARK: - Parsing


private func lengthFields(_ value: String, kind: CssParseKind, scale: Float, fontSize: Float = 0) -> [Double]? {
  let viewport = value.range(of: "v", options: .caseInsensitive) == nil ? .zero : NSCMason.viewportSize
  return NSCMason.cssLengthValues(value, kind: kind.rawValue, scale: scale, fontSize: fontSize,
    rootFontSize: NSCMason.rootFontSize, viewportWidth: Float(viewport.width), viewportHeight: Float(viewport.height))
}

private func resolveLength(_ value: String, scale: Float, fontSize: Float = 0, clamp: Bool = false) -> MasonLengthPercentage? {
  guard let fields = lengthFields(value, kind: clamp ? .clampLength : .length, scale: scale,
                                  fontSize: fontSize) else { return nil }
  let amount = Float(fields[CssLengthResultRecord.value])
  guard amount.isFinite else { return nil }
  switch fields[CssLengthResultRecord.kind] {
  case 0: return .Points(amount * scale)
  case 1: return .Points(amount)
  case 2: return .Percent(amount)
  default: return nil
  }
}

func parseLengthPercentage(_ value: String, scale: Float = NSCMason.scale) -> MasonLengthPercentage? {
  resolveLength(value, scale: scale, clamp: true)
}

func parseLengthPercentageAuto(_ value: String, scale: Float = NSCMason.scale) -> MasonLengthPercentageAuto? {
  guard let fields = lengthFields(value, kind: .lengthAuto, scale: scale) else { return nil }
  return MasonLengthPercentageAuto.fromValueType(Float(fields[CssLengthResultRecord.value]),
                                                 Int(fields[CssLengthResultRecord.kind]))
}

func parseLength(_ style: MasonStyle, _ value: String, scale: Float = NSCMason.scale, resolve: Bool = false) -> Float? {
  switch resolveLength(value, scale: resolve ? 1 : scale, fontSize: style.fontSize) {
  case .Points(let amount): return amount
  case .Percent, .Zero: return 0
  case nil: return nil
  }
}

// MARK: - Parsing


extension CSSBorderRenderer {
  
  func parseBorderShorthand(_ value: String) {
    guard let fields = NSCMason.expandCssShorthand("border-components", value: value) else { return }
    let authoredWidths = fields.prefix(BorderComponentsRecord.style)
    let borderStyle = Int8(fields[BorderComponentsRecord.style]).flatMap(BorderStyle.init(rawValue:))
    let color = UInt32(fields[BorderComponentsRecord.color]).map(UIColor.colorFromARGB)
    guard !fields[BorderComponentsRecord.top].isEmpty || borderStyle != nil || color != nil else { return }

    let widths: [MasonLengthPercentage]
    if fields[BorderComponentsRecord.top].isEmpty {
      widths = Array(repeating: .Points(3), count: 4)
    } else {
      widths = authoredWidths.compactMap { parseLengthPercentage($0) }
      guard widths.count == 4 else { return }
    }
    applyResolvedBorder(value, widths: widths, borderStyle: borderStyle, color: color)
  }

  func applyResolvedBorder(_ value: String, widths: [MasonLengthPercentage],
                           borderStyle: BorderStyle?, color: UIColor?) {
    guard widths.count == 4 else { return }
    css = value
    for (side, width) in zip([top, right, bottom, left], widths) {
      side.width = width
      side.style = borderStyle ?? .solid
      side.color = color ?? .black
    }

    invalidateCache()
    (style.node.view as? MasonUIView)?.invalidateDrawFlags()
  }

  /// Parse a side-specific CSS border shorthand, e.g. `border-left: 4px solid #00B894`.
  func parseBorderSideShorthand(_ side: CSSBorderRenderer.Side, _ value: String) {
    if value.isEmpty {
      applyResolvedBorderSide(side, width: .Points(0), borderStyle: BorderStyle.none, color: .clear)
      return
    }

    guard let fields = NSCMason.expandCssShorthand("border-side-components", value: value) else { return }
    let authoredWidth = fields[BorderSideComponentsRecord.width]
    let borderStyle = Int8(fields[BorderSideComponentsRecord.style]).flatMap(BorderStyle.init(rawValue:))
    let color = UInt32(fields[BorderSideComponentsRecord.color]).map(UIColor.colorFromARGB)
    guard !authoredWidth.isEmpty || borderStyle != nil || color != nil else { return }
    guard let width = authoredWidth.isEmpty ? .Points(3) : parseLengthPercentage(authoredWidth) else { return }

    applyResolvedBorderSide(side, width: width, borderStyle: borderStyle, color: color)
  }

  func applyResolvedBorderSide(_ side: Side, width: MasonLengthPercentage,
                               borderStyle: BorderStyle?, color: UIColor?) {
    let borderSide: BorderSide
    switch side {
    case .left: borderSide = left
    case .top: borderSide = top
    case .right: borderSide = right
    case .bottom: borderSide = bottom
    }
    borderSide.width = width
    borderSide.style = borderStyle ?? .solid
    borderSide.color = color ?? .black

    invalidateCache()
    (style.node.view as? MasonUIView)?.invalidateDrawFlags()
  }

  static func parseBorderRadius(_ style: MasonStyle, _ value: String) {
      guard let fields = lengthFields(value, kind: .borderRadius, scale: NSCMason.scale,
                                      fontSize: style.resolvedFontSize) else { return }
      let radii = stride(from: 0, to: fields.count, by: CssLengthResultRecord.stride).compactMap { offset in
        MasonLengthPercentage.fromValueType(Float(fields[offset + CssLengthResultRecord.value]),
                                            Int(fields[offset + CssLengthResultRecord.kind]) - 1)
      }
      applyResolvedBorderRadius(style, radii)
  }

  static func applyResolvedBorderRadius(_ style: MasonStyle, _ radii: [MasonLengthPercentage]) {
      guard radii.count == BorderRadiiRecord.stride else { return }
      let vertical = BorderRadiiRecord.verticalTopLeft
      let corners = (0..<vertical).map { (radii[$0], radii[$0 + vertical]) }

      // Write to style buffer and update struct
      let cornerKeys: [(xType: Int, xValue: Int, yType: Int, yValue: Int, exp: Int)] = [
        (StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE,
         StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE,
         StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT),
        (StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE,
         StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE,
         StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT),
        (StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE,
         StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE,
         StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT),
        (StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE,
         StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE,
         StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT),
      ]

      style.prepareMut()
      for (i, (h, v)) in corners.enumerated() {
        let k = cornerKeys[i]
        style.setInt8(k.xType, h.type)
        style.setFloat(k.xValue, h.value)
        style.setInt8(k.yType, v.type)
        style.setFloat(k.yValue, v.value)
        style.setFloat(k.exp, 1.0)
      }

      // Keep struct in sync for hasRadii() checks
      style.mBorderRender.radius.topLeft = CornerRadius(horizontal: corners[0].0, vertical: corners[0].1, exponent: 1)
      style.mBorderRender.radius.topRight = CornerRadius(horizontal: corners[1].0, vertical: corners[1].1, exponent: 1)
      style.mBorderRender.radius.bottomRight = CornerRadius(horizontal: corners[2].0, vertical: corners[2].1, exponent: 1)
      style.mBorderRender.radius.bottomLeft = CornerRadius(horizontal: corners[3].0, vertical: corners[3].1, exponent: 1)
      style.mBorderRender.invalidateCache()

      style.setOrAppendState(.borderRadius)
  }

  /// Rebuilds the radius struct from the style buffer, for radii written from JS.
  static func syncBorderRadiusFromBuffer(_ style: MasonStyle) {
    func length(_ value: Int, _ type: Int) -> MasonLengthPercentage {
      let v = style.getFloat(value)
      let t = Int(style.getInt8(type))
      if v == 0 { return .Zero }
      return MasonLengthPercentage.fromValueType(v, t) ?? .Zero
    }
    func corner(_ xType: Int, _ xValue: Int, _ yType: Int, _ yValue: Int, _ exp: Int) -> CornerRadius {
      let e = style.getFloat(exp)
      return CornerRadius(horizontal: length(xValue, xType), vertical: length(yValue, yType), exponent: e.isNaN ? 1 : CGFloat(e))
    }
    let render = style.mBorderRender
    render.radius.topLeft = corner(StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE,
                                   StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE,
                                   StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT)
    render.radius.topRight = corner(StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE,
                                    StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE,
                                    StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT)
    render.radius.bottomRight = corner(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE,
                                       StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE,
                                       StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT)
    render.radius.bottomLeft = corner(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE,
                                      StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE,
                                      StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT)
    render.invalidateCache()
  }

  static func parsePhysicalEdges<T: Codable>(_ property: String, value: String, parse: (String) -> T?) -> MasonRect<T>? {
    guard let words = NSCMason.expandCssShorthand(property, value: value) else { return nil }
    return parsePhysicalEdges(words, parse: parse)
  }

  static func parsePhysicalEdges<T: Codable>(_ words: [String], parse: (String) -> T?) -> MasonRect<T>? {
    let sides = words.compactMap(parse)
    guard sides.count == 4 else { return nil }
    return MasonRect(sides[0], sides[1], sides[2], sides[3])
  }

  static func parsePaddingShorthand(_ style: MasonStyle, _ value: String) {
    let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ";", with: "")
    if cleaned.isEmpty {
      style.padding = MasonRect(uniform: .Points(0))
    } else if let rect = parsePhysicalEdges("padding", value: cleaned, parse: { parseLengthPercentage($0) }) {
      style.padding = rect
    }
  }

  static func parseMarginShorthand(_ style: MasonStyle, _ value: String) {
    let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ";", with: "")
    if cleaned.isEmpty {
      style.margin = MasonRect(uniform: .Points(0))
    } else if let rect = parsePhysicalEdges("margin", value: cleaned, parse: { parseLengthPercentageAuto($0) }) {
      style.margin = rect
    }
  }

  static func parseInsetShorthand(_ style: MasonStyle, _ value: String) {
    let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ";", with: "")
    if cleaned.isEmpty {
      style.inset = MasonRect(uniform: .Points(0))
    } else if let rect = parsePhysicalEdges("inset", value: cleaned, parse: { parseLengthPercentageAuto($0) }) {
      style.inset = rect
    }
  }

  // corner-shape stores the CSS superellipse parameter K per corner: round 1, squircle 2, bevel 0,
  // scoop -1, notch -infinity, square infinity, or superellipse(K).

  static func exponentToCornerShapeToken(_ exponent: Float) -> String {
    switch exponent {
    case 1.0: return "round"
    case 2.0: return "squircle"
    case 0.0: return "bevel"
    case -1.0: return "scoop"
    case -.infinity: return "notch"
    case .infinity: return "square"
    default:
      return exponent == exponent.rounded() && abs(exponent) < 1e6 ? "superellipse(\(Int(exponent)))" : "superellipse(\(exponent))"
    }
  }

  static func parseCornerShapeToken(_ token: String) -> Float? {
    guard let exponent = NSCMason.expandCssShorthand("corner-shape-value", value: token)?.first else { return nil }
    return Float(exponent)
  }
}
