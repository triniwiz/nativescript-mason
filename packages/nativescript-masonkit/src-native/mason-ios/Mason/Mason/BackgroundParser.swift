//
//  BackgroundParser.swift
//  Mason
//
//  Created by Osei Fortune on 20/11/2025.
//


#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif
import CoreGraphics

// MARK: - BackgroundClip
/// Box keywords shared by `background-clip` and `background-origin`; `text` is a clip only.
enum BackgroundClip: String {
  case borderBox = "border-box"
  case paddingBox = "padding-box"
  case contentBox = "content-box"
  case text = "text"

  static func parse(_ value: String) -> BackgroundClip? {
    let clip = BackgroundClip(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
    if clip == .text { Background.textClipsInUse = true }
    return clip
  }

  static func parseOrigin(_ value: String) -> BackgroundClip? {
    let box = parse(value)
    return box == .text ? nil : box
  }
}

typealias BackgroundOrigin = BackgroundClip

// MARK: - BackgroundAttachment
enum BackgroundAttachment: String, CaseIterable {
  case scroll
  case fixed
  case local

  static func parse(_ value: String) -> BackgroundAttachment? {
    BackgroundAttachment(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
  }
}

// MARK: - BackgroundBlendMode
enum BackgroundBlendMode: String, CaseIterable {
  case normal
  case multiply
  case screen
  case overlay
  case darken
  case lighten
  case colorDodge = "color-dodge"
  case colorBurn = "color-burn"
  case hardLight = "hard-light"
  case softLight = "soft-light"
  case difference
  case exclusion
  case hue
  case saturation
  case color
  case luminosity

  static func parse(_ value: String) -> BackgroundBlendMode? {
    BackgroundBlendMode(rawValue: value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
  }

  var cgBlendMode: CGBlendMode {
    switch self {
    case .normal: return .normal
    case .multiply: return .multiply
    case .screen: return .screen
    case .overlay: return .overlay
    case .darken: return .darken
    case .lighten: return .lighten
    case .colorDodge: return .colorDodge
    case .colorBurn: return .colorBurn
    case .hardLight: return .hardLight
    case .softLight: return .softLight
    case .difference: return .difference
    case .exclusion: return .exclusion
    case .hue: return .hue
    case .saturation: return .saturation
    case .color: return .color
    case .luminosity: return .luminosity
    }
  }
}

// MARK: - BackgroundRepeat
/// One axis of `background-repeat` / `mask-repeat`.
enum RepeatStyle: String {
  case `repeat`
  case space
  case round
  case noRepeat = "no-repeat"
}

struct BackgroundRepeat: Equatable {
  var x: RepeatStyle
  var y: RepeatStyle

  static let repeatXY = BackgroundRepeat(x: .repeat, y: .repeat)
  static let repeatX = BackgroundRepeat(x: .repeat, y: .noRepeat)
  static let repeatY = BackgroundRepeat(x: .noRepeat, y: .repeat)
  static let noRepeat = BackgroundRepeat(x: .noRepeat, y: .noRepeat)

  /// One or two keywords (`repeat-x`, `space round`, ...); nil when invalid.
  static func parse(_ value: String) -> BackgroundRepeat? {
    readBackgroundLonghand("repeat", value) { $0.repeatType }
  }

  var rawValue: String {
    if x == y { return x.rawValue }
    if self == .repeatX { return "repeat-x" }
    if self == .repeatY { return "repeat-y" }
    return "\(x.rawValue) \(y.rawValue)"
  }
}

// MARK: - Gradient
final class Gradient {
  struct Units: Equatable {
    let scale = NSCMason.scale
    let rootFontSize = NSCMason.rootFontSize
    let viewport = NSCMason.viewportSize
    let fontSize: Float

    init(fontSize: Float = NSCMason.rootFontSize) {
      self.fontSize = fontSize
    }
  }

  private let handle: OpaquePointer
  let type: String
  let direction: String?
  let interpolation: ColorInterpolation?
  let repeating: Bool
  let stopCount: Int

  init(handle: OpaquePointer) {
    self.handle = handle
    let info = mason_css_gradient_info(handle)
    switch info.kind {
    case 1: type = "radial"
    case 2: type = "conic"
    default: type = "linear"
    }
    repeating = info.repeating
    stopCount = Int(info.stop_count)
    let direction = Self.string(info.direction)
    self.direction = direction.isEmpty ? nil : direction
    let space = Self.string(info.space)
    interpolation = space.isEmpty ? nil : ColorInterpolation.fromRust(space, Self.string(info.hue))
  }

  deinit { mason_css_gradient_release(handle) }

  private static func string(_ text: CMasonCssText) -> String {
    String(decoding: UnsafeBufferPointer(start: text.bytes, count: Int(text.len)), as: UTF8.self)
  }

  func layout(width: CGFloat, height: CGFloat, units: Units = Units()) -> CMasonCssGradientLayout {
    let scale = units.scale
    var layout = mason_css_gradient_layout(handle, Float(width) * scale, Float(height) * scale, scale,
                                           units.fontSize, units.rootFontSize,
                                           Float(units.viewport.width), Float(units.viewport.height))
    layout.center_x /= scale
    layout.center_y /= scale
    layout.radius_x /= scale
    layout.radius_y /= scale
    return layout
  }

  func resolvedStops(lineLength: CGFloat = 0, units: Units = Units()) -> [CMasonCssGradientStop] {
    let scale = units.scale
    var stops = [CMasonCssGradientStop](repeating: CMasonCssGradientStop(color: 0, position: 0), count: stopCount)
    stops.withUnsafeMutableBufferPointer {
      mason_css_gradient_resolve(handle, Float(lineLength) * scale, scale, units.fontSize,
                                 units.rootFontSize, Float(units.viewport.width), Float(units.viewport.height), $0.baseAddress)
    }
    return stops
  }

  func paintStops(lineLength: CGFloat, units: Units = Units()) -> (colors: [CGColor], locations: [CGFloat]) {
    let stops = resolvedStops(lineLength: lineLength, units: units)
    return (stops.map { UIColor.cgColorFromARGB($0.color) }, stops.map { CGFloat($0.position) })
  }
}

// MARK: - Background position / size
final class NativePaintOffset: Equatable {
  private let handle: OpaquePointer

  init(owned handle: OpaquePointer) {
    self.handle = handle
  }

  deinit { mason_css_paint_offset_release(handle) }

  static func == (lhs: NativePaintOffset, rhs: NativePaintOffset) -> Bool { lhs === rhs }

  func resolve(basis: CGFloat, units: Gradient.Units?, fallbackScale: Float = NSCMason.scale) -> CGFloat {
    let scale = units?.scale ?? fallbackScale
    let value = mason_css_paint_offset_resolve(handle, Float(basis) * scale, units?.scale ?? 0,
      units?.fontSize ?? 0, units?.rootFontSize ?? 0,
      Float(units?.viewport.width ?? 0), Float(units?.viewport.height ?? 0))
    return CGFloat(value / scale)
  }

  func text(horizontal: Bool) -> String? {
    guard let text = mason_css_paint_offset_text(handle, horizontal) else { return nil }
    defer { mason_util_destroy_string(text) }
    return String(cString: text)
  }
}

/// One axis of `background-position`: a fraction of the free space plus a length.
/// `px` is a device px like every other parsed length on iOS; `resolve` and
/// `points` divide by NSCMason.scale because CoreGraphics draws in points.
struct BackgroundOffset: Equatable {
  var fraction: CGFloat = 0
  var px: CGFloat = 0
  var math: NativePaintOffset?

  var points: CGFloat { px / CGFloat(NSCMason.scale) }

  func resolve(area: CGFloat, drawSize: CGFloat, units: Gradient.Units? = nil) -> CGFloat {
    let basis = area - drawSize
    return math?.resolve(basis: basis, units: units) ?? (fraction * basis + points)
  }

  func cssValue(horizontal: Bool = true) -> String {
    if let formula = math?.text(horizontal: horizontal) { return formula }
    let cssPx = Int(points)
    let pct = Int(fraction * 100)
    if px == 0 { return "\(pct)%" }
    if fraction == 0 { return "\(cssPx)px" }
    if fraction == 1 { return "\(horizontal ? "right" : "bottom") \(-cssPx)px" }
    return "calc(\(pct)% + \(cssPx)px)"
  }
}

struct BackgroundPosition: Equatable {
  var x = BackgroundOffset()
  var y = BackgroundOffset()

  var cssValue: String { "\(x.cssValue(horizontal: true)) \(y.cssValue(horizontal: false))" }
}

/// `background-size` for one axis: nil = auto, a fraction of the area, or device px.
struct BackgroundSize: Equatable {
  var width: BackgroundOffset? = nil
  var height: BackgroundOffset? = nil
  var keyword: String? = nil

  var cssValue: String {
    keyword ?? "\(width?.cssValue() ?? "auto") \(height?.cssValue() ?? "auto")"
  }
}

// MARK: - Background Layer
class BackgroundLayer {
  var image: String? = nil
  var repeatType: BackgroundRepeat = .repeatXY
  var position: BackgroundPosition? = nil
  var size: BackgroundSize? = nil
  var gradient: Gradient? = nil
  var shader: CGGradient? = nil
  // remember dimensions used to create cached gradient
  var shaderWidth: CGFloat = -1
  /// A radial shader's end radius, in ending-shape radii.
  var shaderExtent: CGFloat = 1
  var shaderHeight: CGFloat = -1
  var shaderUnits: Gradient.Units?
  /// The stops `shader` was built from; a conic gradient samples them itself.
  var shaderColors: [CGColor] = []
  var shaderLocations: [CGFloat] = []
  var bitmap: UIImage? = nil
  /// A `data:image/svg+xml` image, parsed once; `bitmap` is its raster at the drawn size.
  var svg: SvgDocument? = nil
  /// The SVG didn't parse; don't retry every frame.
  var svgFailed = false
  /// The `currentColor` (0 when unused) and point size `bitmap` was rasterized with.
  var svgColor: UInt32 = 0
  var svgRasterSize: CGSize = .zero
  var clip: BackgroundClip = .borderBox
  var origin: BackgroundOrigin = .paddingBox
  var attachment: BackgroundAttachment = .scroll
  var blendMode: BackgroundBlendMode = .normal
  /// A color token seen in the shorthand; the last layer's becomes `Background.color`.
  var backgroundColor: UIColor? = nil

  var isDefault: Bool {
    image == nil && gradient == nil && position == nil && size == nil &&
      repeatType == .repeatXY && clip == .borderBox && origin == .paddingBox &&
      attachment == .scroll && blendMode == .normal
  }
}

public class BackgroundCALayer: CALayer {
  weak var background: Background?{
    didSet {
      setNeedsDisplay()
    }
  }
  
  public override func draw(in ctx: CGContext) {
    super.draw(in: ctx)
    guard let renderer = background else { return }
    renderer.draw(on: self, in: ctx, rect: bounds)
  }
  
  
  public func invalidate() {
    setNeedsDisplay()
  }
  
  public override func layoutSublayers() {
    super.layoutSublayers()
    setNeedsDisplay()
  }
}

// MARK: - Background
class Background {
  var css: String = ""
  var color: UIColor? {
    set {
      guard let color = newValue else {
        style.prepareMut()
        style.setUInt32(StyleKeys.BACKGROUND_COLOR, 0)
        style.setUInt8(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.INHERIT)
        style.setUInt8(StyleKeys.BACKGROUND_COLOR_TYPE, StyleState.INHERIT)
        style.notifyTextStyleChanged(.backgroundColor)
        return
      }
      
      style.prepareMut()
      style.setUInt32(StyleKeys.BACKGROUND_COLOR, color.toUInt32())
      style.setUInt8(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
      style.setUInt8(StyleKeys.BACKGROUND_COLOR_TYPE, StyleState.SET)
      style.notifyTextStyleChanged(.backgroundColor)
    }
    get {
      let resolved = style.resolvedBackgroundColor
      if resolved == 0 {
        return nil
      }
      return UIColor.colorFromARGB(resolved)
    }
  }
  var layers: [BackgroundLayer] = []
  private var nativeBackground: NativeBackground?
  unowned(unsafe) let style: MasonStyle
  init(style: MasonStyle) {
    self.style = style
  }
  
  
  public func reset(){
    let invalidate = color != nil || !layers.isEmpty
    color = nil
    layers.removeAll()
    nativeBackground = nil
    installBackground(style, nil)
    if(invalidate){
      style.node.view?.setNeedsDisplay()
    }
  }
  
  // MARK: - Parse Background
  public func parseBackground(_ css: String) {
    if css.isEmpty {
      self.css = css
      reset()
      return
    }
    let native = backgroundProgram()
    let result = native.replace(css, currentColor: style.color)
    guard result >= -1 else { return }

    applyShorthandColor(result)
    layers = native.readLayers()
    for layer in layers { layer.backgroundColor = nil }
    installBackground(style, native)
    self.css = css
    invalidateView()
  }

  private func applyShorthandColor(_ value: Int64) {
    // A shorthand without a color resets the previous fill.
    let argb = value < 0 ? nil : UInt32(value)
    color = argb.map { UIColor.colorFromARGB($0) }
    style.prepareMut()
    style.setUInt32(StyleKeys.BACKGROUND_COLOR, argb ?? 0)
    style.setUInt8(StyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
  }

  func applyCompiled(_ fields: [String], initialColor: UInt32, fontSize: Float) {
    let native = backgroundProgram()
    guard let result = native.applyCompiled(fields, currentColor: initialColor, fontSize: fontSize) else { return }
    let shorthand = result[CssBackgroundResultRecord.shorthandValue]
    let reset = result[CssBackgroundResultRecord.shorthandReset] != 0
    if reset { css = "" }
    else if shorthand >= 0 { css = fields[Int(shorthand)] }
    let fill = result[CssBackgroundResultRecord.color]
    if result[CssBackgroundResultRecord.colorFromShorthand] != 0 {
      if reset { color = nil }
      else { applyShorthandColor(fill) }
    } else if fill >= 0 {
      style.backgroundColor = UInt32(fill)
    }
    if result[CssBackgroundResultRecord.layersChanged] != 0 {
      let imagesReplaced = result[CssBackgroundResultRecord.imagesReplaced] != 0
      layers = native.readLayers(reusing: imagesReplaced ? [] : layers)
      if result[CssBackgroundResultRecord.lastImageFromShorthand] != 0 {
        for layer in layers { layer.backgroundColor = nil }
      }
      installBackground(style, native)
    }
    invalidateView()
  }

  private func invalidateView() {
    if !style.inBatch {
      style.node.view?.setNeedsDisplay()
    }
  }

  private func setLonghand(_ name: String, _ value: String) {
    let native = backgroundProgram()
    let property = String(name.dropFirst("background-".count))
    let result = native.setLonghand(property, value)
    guard result >= 0 else { return }
    if result > 0 {
      layers = native.readLayers(reusing: layers)
      installBackground(style, native)
    }
    invalidateView()
  }

  private func applyBackgroundImage(_ value: String) {
    let native = backgroundProgram()
    guard native.replace(value, currentColor: style.color) >= -1 else { return }
    layers = native.readLayers()
    installBackground(style, native)
    invalidateView()
  }

  private func backgroundProgram() -> NativeBackground {
    if let nativeBackground { return nativeBackground }
    let native = NativeBackground()
    nativeBackground = native
    return native
  }

  public func applyBackgroundProperty(name: String, value: String) {
    let key = name.lowercased().trimmingCharacters(in: .whitespaces)
    
    switch key {
      
    case "background":
      parseBackground(value)
      return
      
    case "background-color":
      if let c = parseColor(value) {
        self.color = c
        style.node.view?.setNeedsDisplay()
      }
      return
      
    case "background-image":
      applyBackgroundImage(value)
      return
      
    case "background-repeat":
      setLonghand(key, value)
      return
      
    case "background-position":
      setLonghand(key, value)
      return

    case "background-position-x":
      setLonghand(key, value)
      return

    case "background-position-y":
      setLonghand(key, value)
      return
      
    case "background-size":
      setLonghand(key, value)
      return
      
    case "background-clip":
      setLonghand(key, value)
      return

    case "background-origin":
      setLonghand(key, value)
      return

    case "background-attachment":
      setLonghand(key, value)
      return

    case "background-blend-mode":
      setLonghand(key, value)
      return
      
    default:
      return
    }
  }
}

// MARK: - Top-level splitters

/// Split background layers by top-level commas (commas not inside parentheses or
/// quotes: an unencoded SVG data URL can hold both).
func splitBackgroundLayers(_ input: String) -> [String] {
  var result: [String] = []
  var current = ""
  var depth = 0
  var quote: Character? = nil
  
  for ch in input {
    if let q = quote {
      if ch == q { quote = nil }
      current.append(ch)
      continue
    }
    if ch == "\"" || ch == "'" { quote = ch }
    else if ch == "(" { depth += 1 }
    else if ch == ")" { depth = max(0, depth - 1) }
    
    if ch == "," && depth == 0 {
      result.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
      current = ""
    } else {
      current.append(ch)
    }
  }
  
  if !current.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
    result.append(current.trimmingCharacters(in: .whitespacesAndNewlines))
  }
  
  return result
}

// MARK: - Parse Background Layers
func parseBackgroundLayers(_ css: String, currentColor: UInt32 = 0xff000000) -> [BackgroundLayer] {
  (parseNativeBackgroundLayers(css, currentColor: currentColor) ?? []).filter { !$0.isDefault }
}

func parseLayer(_ css: String, currentColor: UInt32 = 0xff000000) -> BackgroundLayer {
  parseNativeBackgroundLayers(css, currentColor: currentColor)?.first ?? BackgroundLayer()
}

private func parseNativeBackgroundLayers(_ css: String, currentColor: UInt32) -> [BackgroundLayer]? {
  NativeBackground(css, currentColor: currentColor)?.readLayers()
}

private func installBackground(_ style: MasonStyle, _ background: NativeBackground?) {
  let node = style.node
  guard !node.isPlaceholder else { return }
  let mason = node.mason
  if mason.inCompute { mason.deferStyleRecords(style) }
  else { style.prepareMut() }
  mason_css_background_install(mason.inCompute ? nil : mason.nativePtr, node.nativePtr, background?.handle)
}

private final class NativeBackground {
  let handle: OpaquePointer

  init?(_ css: String, currentColor: UInt32) {
    let scale = NSCMason.scale
    let rootFontSize = NSCMason.rootFontSize
    let viewport = NSCMason.viewportSize
    guard let parsed = css.withCString({
      mason_css_background_parse($0, currentColor, scale, rootFontSize, rootFontSize,
                                 Float(viewport.width), Float(viewport.height))
    }) else { return nil }
    handle = parsed
  }

  init() {
    handle = mason_css_background_create()
  }

  deinit { mason_css_background_release(handle) }

  func replace(_ css: String, currentColor: UInt32) -> Int64 {
    let viewport = NSCMason.viewportSize
    return css.withCString {
      mason_css_background_mobile_replace(handle, $0, currentColor, NSCMason.scale, NSCMason.rootFontSize,
                                          Float(viewport.width), Float(viewport.height))
    }
  }

  func setLonghand(_ property: String, _ value: String) -> Int32 {
    let viewport = NSCMason.viewportSize
    return property.withCString { name in
      value.withCString {
        mason_css_background_mobile_set_longhand(handle, name, $0, NSCMason.scale, NSCMason.rootFontSize,
                                                 Float(viewport.width), Float(viewport.height))
      }
    }
  }

  func applyCompiled(_ fields: [String], currentColor: UInt32, fontSize: Float) -> [Int64]? {
    var input = fields.joined(separator: "\u{0}")
    var result = [Int64](repeating: 0, count: CssBackgroundResultRecord.stride)
    let viewport = NSCMason.viewportSize
    let applied = input.withUTF8 { bytes in
      result.withUnsafeMutableBufferPointer { output in
        mason_css_background_mobile_apply(handle, CMasonCssText(bytes: bytes.baseAddress, len: UInt(bytes.count)),
          currentColor, NSCMason.scale, fontSize, NSCMason.rootFontSize, Float(viewport.width), Float(viewport.height),
          output.baseAddress, UInt(output.count))
      }
    }
    return applied ? result : nil
  }

  func readLayers(reusing existing: [BackgroundLayer] = []) -> [BackgroundLayer] {
    let layers = mason_css_background_layers(handle)

    return UnsafeBufferPointer(start: layers.data, count: Int(layers.count)).enumerated().map { index, parsed in
      readBackgroundLayer(parsed, existing: existing.indices.contains(index) ? existing[index] : nil) {
        mason_css_background_gradient(handle, UInt(index))
      }
    }
  }
}

func readBackgroundLayer(_ parsed: CMasonCssBackgroundLayer, existing: BackgroundLayer? = nil,
                         gradient: () -> OpaquePointer?) -> BackgroundLayer {
  func offset(_ value: CMasonCssOffset) -> BackgroundOffset? {
    guard value.present else { return nil }
    let math = value.math.flatMap { mason_css_paint_offset_retain($0) }.map(NativePaintOffset.init(owned:))
    return BackgroundOffset(fraction: CGFloat(value.fraction), px: CGFloat(value.pixels), math: math)
  }
  let layer = existing ?? BackgroundLayer()
  if existing == nil {
    if parsed.image_kind == 1 {
      layer.image = String(decoding: UnsafeBufferPointer(start: parsed.image.bytes, count: Int(parsed.image.len)), as: UTF8.self)
    } else if parsed.image_kind == 2, let gradient = gradient() {
      layer.gradient = Gradient(handle: gradient)
    }
    if parsed.has_color { layer.backgroundColor = UIColor.colorFromARGB(parsed.color) }
  }
  layer.repeatType = BackgroundRepeat(x: repeatStyle(Int(parsed.repeat_x)), y: repeatStyle(Int(parsed.repeat_y)))
  let x = offset(parsed.position_x)
  let y = offset(parsed.position_y)
  layer.position = x == nil && y == nil ? nil : BackgroundPosition(x: x ?? BackgroundOffset(), y: y ?? BackgroundOffset())
  switch parsed.size_kind {
  case 1: layer.size = BackgroundSize(width: offset(parsed.width), height: offset(parsed.height))
  case 2: layer.size = BackgroundSize(keyword: "contain")
  case 3: layer.size = BackgroundSize(keyword: "cover")
  default: layer.size = nil
  }
  layer.origin = backgroundBox(Int(parsed.origin))
  layer.clip = backgroundBox(Int(parsed.clip))
  if layer.clip == .text { Background.textClipsInUse = true }
  switch parsed.attachment {
  case 1: layer.attachment = .fixed
  case 2: layer.attachment = .local
  default: layer.attachment = .scroll
  }
  layer.blendMode = BackgroundBlendMode.allCases[Int(parsed.blend)]
  return layer
}

private func repeatStyle(_ value: Int) -> RepeatStyle {
  switch value {
  case 1: return .noRepeat
  case 2: return .space
  case 3: return .round
  default: return .repeat
  }
}

private func backgroundBox(_ value: Int) -> BackgroundClip {
  switch value {
  case 1: return .paddingBox
  case 2: return .contentBox
  case 3: return .text
  default: return .borderBox
  }
}

private let backgroundLonghandRecordSize = 6

private struct BackgroundLonghandRecord {
  let values: UnsafeBufferPointer<Double>
  let program: NativeBackgroundLonghand

  subscript(_ index: Int) -> Double { values[index] }

  func offset(_ index: Int, axis: Int) -> BackgroundOffset? {
    self[index].isNaN ? nil : BackgroundOffset(fraction: CGFloat(self[index]), px: CGFloat(self[index + 1]), math: program.offset(axis))
  }

  var repeatType: BackgroundRepeat {
    BackgroundRepeat(x: repeatStyle(Int(self[1])), y: repeatStyle(Int(self[2])))
  }

  var position: BackgroundPosition {
    BackgroundPosition(x: offset(1, axis: 0)!, y: offset(3, axis: 1)!)
  }

  var size: BackgroundSize {
    switch Int(self[1]) {
    case 2: return BackgroundSize(keyword: "contain")
    case 3: return BackgroundSize(keyword: "cover")
    default: return BackgroundSize(width: offset(2, axis: 0), height: offset(4, axis: 1))
    }
  }

}

/// Projects a parsed layer list for the mask renderer and CSS accessors.
final class NativeBackgroundLonghand {
  fileprivate let handle: OpaquePointer

  init?(_ name: String, _ value: String, allowInvalidEntries: Bool = false) {
    guard let parsed = name.withCString({ property in
      value.withCString { mason_css_background_longhand_parse(property, $0, allowInvalidEntries) }
    }) else { return nil }
    handle = parsed
  }

  deinit { mason_css_background_longhand_release(handle) }

  func offset(_ index: Int) -> NativePaintOffset? {
    let viewport = NSCMason.viewportSize
    return mason_css_background_longhand_offset(handle, UInt(index), NSCMason.scale, NSCMason.rootFontSize,
      Float(viewport.width), Float(viewport.height)).map(NativePaintOffset.init(owned:))
  }

  func withValues<Result>(_ body: (UnsafeBufferPointer<Double>) -> Result) -> Result {
    let viewport = NSCMason.viewportSize
    let result = mason_css_background_longhand_records(
      handle, NSCMason.scale, NSCMason.rootFontSize, Float(viewport.width), Float(viewport.height))
    defer { mason_css_values_release(result) }
    return body(UnsafeBufferPointer(start: result.values, count: Int(result.len)))
  }

}

private func readBackgroundLonghand<Result>(_ property: String, _ value: String, _ read: (BackgroundLonghandRecord) -> Result) -> Result? {
  guard let program = NativeBackgroundLonghand(property, value) else { return nil }
  return program.withValues { values -> Result? in
    guard values.count == backgroundLonghandRecordSize else { return nil }
    return read(BackgroundLonghandRecord(values: values, program: program))
  }
}

func parsePosition(_ parts: [String]) -> BackgroundPosition? {
  readBackgroundLonghand("position", parts.joined(separator: " ")) { $0.position }
}

func parseGradient(_ value: String, currentColor: UInt32 = 0xff000000) -> Gradient? {
  guard let handle = value.withCString({ mason_css_gradient_parse($0, currentColor) }) else { return nil }
  return Gradient(handle: handle)
}

// MARK: - Parse Image URL
/// The first `url(...)` in `value`: its unquoted argument and the range of the whole call.
/// A quoted argument ends at its closing quote, so an unencoded SVG data URL may hold
/// parentheses, commas and the other quote; an unquoted one ends at the balancing `)`.
private func findImageURL(_ value: String) -> (url: String, range: Range<String.Index>)? {
  guard let open = value.range(of: "url(", options: .caseInsensitive) else { return nil }
  var i = open.upperBound
  while i < value.endIndex, value[i].isWhitespace { i = value.index(after: i) }
  guard i < value.endIndex else { return nil }
  if value[i] == "\"" || value[i] == "'" {
    let q = value[i]
    let start = value.index(after: i)
    guard let close = value[start...].firstIndex(of: q) else {
      // Unterminated: take the rest, minus a trailing `)`.
      var url = String(value[start...])
      if url.hasSuffix(")") { url.removeLast() }
      return (url, open.lowerBound..<value.endIndex)
    }
    var end = value.index(after: close)
    while end < value.endIndex, value[end].isWhitespace { end = value.index(after: end) }
    if end < value.endIndex, value[end] == ")" { end = value.index(after: end) }
    return (String(value[start..<close]), open.lowerBound..<end)
  }
  var depth = 1
  var j = i
  while j < value.endIndex {
    if value[j] == "(" { depth += 1 }
    else if value[j] == ")" {
      depth -= 1
      if depth == 0 { break }
    }
    j = value.index(after: j)
  }
  let url = String(value[i..<j]).trimmingCharacters(in: .whitespaces)
  let end = j < value.endIndex ? value.index(after: j) : j
  return (url, open.lowerBound..<end)
}

func parseImage(_ value: String) -> String? {
  findImageURL(value)?.url
}

func removeImageURL(from value: String) -> String {
  var result = value
  while let found = findImageURL(result) {
    result.replaceSubrange(found.range, with: " ")
  }
  return result.trimmingCharacters(in: .whitespacesAndNewlines)
}

func parseColorArgb(_ value: String) -> UInt32? {
  guard let field = NSCMason.expandCssShorthand("color-value", value: value)?.first else { return nil }
  return UInt32(field)
}

func parseColor(_ value: String) -> UIColor? {
  UIColor(css: value)
}

extension UIColor {
  
  func toCSS(includeAlpha: Bool = false) -> String {
          var r: CGFloat = 0
          var g: CGFloat = 0
          var b: CGFloat = 0
          var a: CGFloat = 0

          self.getRGBA(&r, &g, &b, &a)

          if includeAlpha {
              let rgba = (Int(r * 255) << 24) | (Int(g * 255) << 16) | (Int(b * 255) << 8) | Int(a * 255)
              return String(format: "#%08X", rgba)
          } else {
              let rgb = (Int(r * 255) << 16) | (Int(g * 255) << 8) | Int(b * 255)
              return String(format: "#%06X", rgb)
          }
      }

  convenience init?(css: String) {
    guard let argb = parseColorArgb(css) else { return nil }
    self.init(
      red: CGFloat((argb >> 16) & 0xff) / 255,
      green: CGFloat((argb >> 8) & 0xff) / 255,
      blue: CGFloat(argb & 0xff) / 255,
      alpha: CGFloat(argb >> 24) / 255
    )
  }
}

// MARK: - Gradient colour interpolation
/// A gradient's `in <colorspace> [<hue-method> hue]`. CGGradient only interpolates in sRGB,
/// so `expandInterpolatedStops` resamples each segment in the requested space.
struct ColorInterpolation: Equatable {
  enum Space: String {
    case srgb, srgbLinear = "srgb-linear", oklab, oklch, lab, lch, xyzD65 = "xyz-d65", xyzD50 = "xyz-d50", hsl, hwb

    var hueIndex: Int {
      switch self {
      case .oklch, .lch: return 2
      case .hsl, .hwb: return 0
      default: return -1
      }
    }

    static func parse(_ name: String) -> Space? {
      let n = name.lowercased()
      return n == "xyz" ? .xyzD65 : Space(rawValue: n)
    }
  }

  enum HueMethod: String { case shorter, longer, increasing, decreasing }

  let space: Space
  var hue: HueMethod = .shorter

  static func fromRust(_ space: String, _ hue: String) -> ColorInterpolation {
    ColorInterpolation(space: Space.parse(space) ?? .srgb, hue: HueMethod(rawValue: hue) ?? .shorter)
  }

  /// Splits the method from a gradient's first argument, or nil when there is none.
  static func extract(_ first: String) -> (rest: String, method: ColorInterpolation)? {
    guard let fields = NSCMason.expandCssShorthand("gradient-interpolation", value: first),
          fields.count == GradientInterpolationRecord.stride else { return nil }
    return (fields[GradientInterpolationRecord.direction],
            fromRust(fields[GradientInterpolationRecord.space], fields[GradientInterpolationRecord.hue]))
  }
}

// Keeps each channel within ~1/255 of the exact curve.
private let interpolationSamplesPerSegment = 8

func expandInterpolatedStops(_ colors: [CGColor], _ locations: [CGFloat], _ interpolation: ColorInterpolation?) -> (colors: [CGColor], locations: [CGFloat]) {
  guard let interpolation = interpolation, interpolation.space != .srgb, colors.count >= 2, colors.count == locations.count else {
    return (colors, locations)
  }
  let rgba = colors.map(srgbComponents)
  var outColors: [CGColor] = []
  var outLocations: [CGFloat] = []
  for i in 0..<colors.count {
    outColors.append(colors[i])
    outLocations.append(locations[i])
    if i == colors.count - 1 { break }
    let p0 = locations[i]
    let p1 = locations[i + 1]
    if p1 - p0 <= 1e-6 { continue } // hard stop
    for k in 1..<interpolationSamplesPerSegment {
      let t = Double(k) / Double(interpolationSamplesPerSegment)
      let c = interpolateColor(rgba[i], rgba[i + 1], t, interpolation)
      outColors.append(UIColor(red: CGFloat(c[0]), green: CGFloat(c[1]), blue: CGFloat(c[2]), alpha: CGFloat(c[3])).cgColor)
      outLocations.append(p0 + (p1 - p0) * CGFloat(t))
    }
  }
  return (outColors, outLocations)
}

private func srgbComponents(_ color: CGColor) -> [Double] {
  var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
  UIColor.from(cgColor: color).getRGBA(&r, &g, &b, &a)
  return [Double(r), Double(g), Double(b), Double(a)]
}

// Premultiplied, per CSS Color 4 §12.
func interpolateColor(_ from: [Double], _ to: [Double], _ t: Double, _ interpolation: ColorInterpolation) -> [Double] {
  let space = interpolation.space
  let fromAlpha = from[3]
  let toAlpha = to[3]
  var a = ColorSpaces.fromSrgb(space, Array(from[0..<3]))
  var b = ColorSpaces.fromSrgb(space, Array(to[0..<3]))

  let hue = space.hueIndex
  if hue >= 0 {
    // A powerless hue (grey or transparent) takes the other endpoint's.
    let aGray = isAchromatic(space, a) || fromAlpha == 0
    let bGray = isAchromatic(space, b) || toAlpha == 0
    if aGray && !bGray { a[hue] = b[hue] }
    if bGray && !aGray { b[hue] = a[hue] }
    let d = b[hue] - a[hue]
    switch interpolation.hue {
    case .shorter: if d > 180 { a[hue] += 360 } else if d < -180 { b[hue] += 360 }
    case .longer: if d > 0 && d < 180 { a[hue] += 360 } else if d > -180 && d <= 0 { b[hue] += 360 }
    case .increasing: if d < 0 { b[hue] += 360 }
    case .decreasing: if d > 0 { a[hue] += 360 }
    }
  }

  for i in 0..<3 where i != hue {
    a[i] *= fromAlpha
    b[i] *= toAlpha
  }
  let alpha = fromAlpha + (toAlpha - fromAlpha) * t
  var mixed = [0.0, 0.0, 0.0]
  for i in 0..<3 {
    mixed[i] = a[i] + (b[i] - a[i]) * t
    if i != hue && alpha > 0 { mixed[i] /= alpha }
  }
  if hue >= 0 { mixed[hue] = (mixed[hue].truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360) }

  let rgb = ColorSpaces.toSrgb(space, mixed)
  return rgb.map { min(max($0, 0), 1) } + [min(max(alpha, 0), 1)]
}

private func isAchromatic(_ space: ColorInterpolation.Space, _ v: [Double]) -> Bool {
  switch space {
  // HWB's hue is powerless when whiteness + blackness reach 100%.
  case .hwb: return v[1] + v[2] >= 100 - 1e-4
  default: return abs(v[1]) < 1e-4
  }
}

// Matrices from CSS Color 4 §18.
enum ColorSpaces {
  private static let linearSrgbToXyz: [[Double]] = [
    [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
    [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
    [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
  ]
  private static let xyzToLinearSrgb: [[Double]] = [
    [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
    [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
    [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
  ]
  private static let d65ToD50: [[Double]] = [
    [1.0479298208405488, 0.022946793341019088, -0.05019222954313557],
    [0.029627815688159344, 0.990434484573249, -0.01707382502938514],
    [-0.009243058152591178, 0.015055144896577895, 0.7518742899580008],
  ]
  private static let d50ToD65: [[Double]] = [
    [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
    [-0.028369706963208136, 1.0099954580106629, 0.021041398966943008],
    [0.012314001688319899, -0.020507696433477912, 1.3303659366080753],
  ]
  private static let d50White: [Double] = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585]
  private static let labE = 216.0 / 24389.0
  private static let labK = 24389.0 / 27.0

  static func fromSrgb(_ space: ColorInterpolation.Space, _ rgb: [Double]) -> [Double] {
    switch space {
    case .srgb: return rgb
    case .srgbLinear: return linear(rgb)
    case .oklab: return oklab(linear(rgb))
    case .oklch: return polar(oklab(linear(rgb)))
    case .lab: return lab(mul(d65ToD50, mul(linearSrgbToXyz, linear(rgb))))
    case .lch: return polar(lab(mul(d65ToD50, mul(linearSrgbToXyz, linear(rgb)))))
    case .xyzD65: return mul(linearSrgbToXyz, linear(rgb))
    case .xyzD50: return mul(d65ToD50, mul(linearSrgbToXyz, linear(rgb)))
    case .hsl: return hsl(rgb)
    case .hwb: return hwb(rgb)
    }
  }

  static func toSrgb(_ space: ColorInterpolation.Space, _ v: [Double]) -> [Double] {
    switch space {
    case .srgb: return v
    case .srgbLinear: return gamma(v)
    case .oklab: return gamma(oklabToLinear(v))
    case .oklch: return gamma(oklabToLinear(rectangular(v)))
    case .lab: return gamma(mul(xyzToLinearSrgb, mul(d50ToD65, labToXyz(v))))
    case .lch: return gamma(mul(xyzToLinearSrgb, mul(d50ToD65, labToXyz(rectangular(v)))))
    case .xyzD65: return gamma(mul(xyzToLinearSrgb, v))
    case .xyzD50: return gamma(mul(xyzToLinearSrgb, mul(d50ToD65, v)))
    case .hsl: return hslToRgb(v)
    case .hwb: return hwbToRgb(v)
    }
  }

  private static func mul(_ m: [[Double]], _ v: [Double]) -> [Double] {
    return (0..<3).map { r in m[r][0] * v[0] + m[r][1] * v[1] + m[r][2] * v[2] }
  }

  private static func toLinear(_ c: Double) -> Double {
    let a = abs(c)
    return a <= 0.04045 ? c / 12.92 : (c < 0 ? -1 : 1) * pow((a + 0.055) / 1.055, 2.4)
  }

  private static func fromLinear(_ c: Double) -> Double {
    let a = abs(c)
    return a <= 0.0031308 ? c * 12.92 : (c < 0 ? -1 : 1) * (1.055 * pow(a, 1 / 2.4) - 0.055)
  }

  private static func linear(_ rgb: [Double]) -> [Double] { rgb.map(toLinear) }
  private static func gamma(_ rgb: [Double]) -> [Double] { rgb.map(fromLinear) }

  private static func oklab(_ lin: [Double]) -> [Double] {
    let l = cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2])
    let m = cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2])
    let s = cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2])
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ]
  }

  private static func oklabToLinear(_ lab: [Double]) -> [Double] {
    let l = pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3)
    let m = pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3)
    let s = pow(lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2], 3)
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ]
  }

  private static func lab(_ xyzD50: [Double]) -> [Double] {
    let f = (0..<3).map { i -> Double in
      let n = xyzD50[i] / d50White[i]
      return n > labE ? cbrt(n) : (labK * n + 16) / 116
    }
    return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])]
  }

  private static func labToXyz(_ lab: [Double]) -> [Double] {
    let fy = (lab[0] + 16) / 116
    let fx = lab[1] / 500 + fy
    let fz = fy - lab[2] / 200
    let x = pow(fx, 3) > labE ? pow(fx, 3) : (116 * fx - 16) / labK
    let y = lab[0] > labK * labE ? pow(fy, 3) : lab[0] / labK
    let z = pow(fz, 3) > labE ? pow(fz, 3) : (116 * fz - 16) / labK
    return [x * d50White[0], y * d50White[1], z * d50White[2]]
  }

  private static func polar(_ v: [Double]) -> [Double] {
    var h = atan2(v[2], v[1]) * 180 / .pi
    if h < 0 { h += 360 }
    return [v[0], hypot(v[1], v[2]), h]
  }

  private static func rectangular(_ v: [Double]) -> [Double] {
    let rad = v[2] * .pi / 180
    return [v[0], v[1] * cos(rad), v[1] * sin(rad)]
  }

  private static func hsl(_ rgb: [Double]) -> [Double] {
    let r = rgb[0], g = rgb[1], b = rgb[2]
    let mx = max(r, g, b)
    let mn = min(r, g, b)
    let l = (mx + mn) / 2
    let d = mx - mn
    var h = 0.0
    var s = 0.0
    if d != 0 {
      s = (l == 0 || l == 1) ? 0 : (mx - l) / min(l, 1 - l)
      if mx == r { h = (g - b) / d + (g < b ? 6 : 0) }
      else if mx == g { h = (b - r) / d + 2 }
      else { h = (r - g) / d + 4 }
      h *= 60
    }
    return [h, s * 100, l * 100]
  }

  private static func hslToRgb(_ v: [Double]) -> [Double] {
    let h = v[0], s = v[1] / 100, l = v[2] / 100
    func f(_ n: Double) -> Double {
      let k = (n + h / 30).truncatingRemainder(dividingBy: 12)
      return l - s * min(l, 1 - l) * max(-1, min(k - 3, 9 - k, 1))
    }
    return [f(0), f(8), f(4)]
  }

  private static func hwb(_ rgb: [Double]) -> [Double] {
    return [hsl(rgb)[0], min(rgb[0], rgb[1], rgb[2]) * 100, (1 - max(rgb[0], rgb[1], rgb[2])) * 100]
  }

  private static func hwbToRgb(_ v: [Double]) -> [Double] {
    let w = v[1] / 100, b = v[2] / 100
    if w + b >= 1 {
      let gray = w / (w + b)
      return [gray, gray, gray]
    }
    return hslToRgb([v[0], 100, 50]).map { $0 * (1 - w - b) + w }
  }
}
