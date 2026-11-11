//
//  Platform.swift
//  Mason
//
//  UIKit names on AppKit, so the shared sources read the same on iOS and macOS.
//

#if canImport(UIKit)
import UIKit
import CoreImage

public typealias MasonViewBase = UIView
public typealias MasonControlBase = UIControl
public typealias MasonGestureRecognizerBase = UIGestureRecognizer

extension UIView {
  @inline(__always) var backingLayer: CALayer { layer }

  var windowRootView: UIView? { window }

  func masonSizeThatFits(_ size: CGSize) -> CGSize { sizeThatFits(size) }
}

extension CIColor {
  convenience init(masonColor color: UIColor) {
    self.init(color: color)
  }
}

func masonLayoutIsLeftToRight() -> Bool {
  UIView.userInterfaceLayoutDirection(for: .unspecified) == .leftToRight
}

extension UIColor {
  static func from(cgColor: CGColor) -> UIColor { UIColor(cgColor: cgColor) }

  @discardableResult
  func getRGBA(_ r: inout CGFloat, _ g: inout CGFloat, _ b: inout CGFloat, _ a: inout CGFloat) -> Bool {
    getRed(&r, green: &g, blue: &b, alpha: &a)
  }
}

func masonDisplayLink(_ target: Any, _ selector: Selector) -> CADisplayLink {
  let link = CADisplayLink(target: target, selector: selector)
  link.add(to: .main, forMode: .common)
  return link
}

#else
import AppKit
import CoreImage
import QuartzCore

public typealias UIView = NSView
public typealias UIColor = NSColor
public typealias UIFont = NSFont
public typealias UIFontDescriptor = NSFontDescriptor
public typealias UIImage = NSImage
public typealias UIBezierPath = NSBezierPath
public typealias UIEdgeInsets = NSEdgeInsets
public typealias UIScreen = NSScreen
public typealias UIEvent = NSEvent
public typealias UIResponder = NSResponder
public typealias UIWindow = NSWindow
public typealias UIViewController = NSViewController
public typealias UIGestureRecognizer = NSGestureRecognizer
public typealias UIAccessibilityElement = NSAccessibilityElement
typealias UILabel = NSTextField

extension NSEdgeInsets: @retroactive Equatable {
  public static let zero = NSEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)

  public static func == (a: NSEdgeInsets, b: NSEdgeInsets) -> Bool {
    a.top == b.top && a.left == b.left && a.bottom == b.bottom && a.right == b.right
  }
}

open class MasonViewBase: NSView {
  @objc dynamic open class var layerClass: AnyClass { CALayer.self }

  public override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    masonSetUpLayer()
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
    masonSetUpLayer()
  }

  private func masonSetUpLayer() {
    wantsLayer = true
    layerContentsRedrawPolicy = .onSetNeedsDisplay
  }

  open override var isFlipped: Bool { true }

  open var backgroundColor: NSColor? {
    get { backingLayer.backgroundColor.flatMap { NSColor(cgColor: $0) } }
    set { backingLayer.backgroundColor = newValue?.cgColor }
  }

  private var masonOpaque = false
  open override var isOpaque: Bool {
    get { masonOpaque }
    set { masonOpaque = newValue }
  }

  open override func makeBackingLayer() -> CALayer {
    (Self.layerClass as! CALayer.Type).init()
  }

  open override var wantsUpdateLayer: Bool { false }

  @objc dynamic open func layoutSubviews() {}

  open override func layout() {
    super.layout()
    layoutSubviews()
  }

  @objc dynamic open func willMove(toSuperview newSuperview: NSView?) {}
  @objc dynamic open func willMove(toWindow newWindow: NSWindow?) {}
  @objc dynamic open func didMoveToSuperview() {}
  @objc dynamic open func didMoveToWindow() {}

  open override func viewWillMove(toSuperview newSuperview: NSView?) {
    super.viewWillMove(toSuperview: newSuperview)
    willMove(toSuperview: newSuperview)
  }

  open override func viewWillMove(toWindow newWindow: NSWindow?) {
    super.viewWillMove(toWindow: newWindow)
    willMove(toWindow: newWindow)
  }

  open override func viewDidMoveToSuperview() {
    super.viewDidMoveToSuperview()
    didMoveToSuperview()
  }

  open override func viewDidMoveToWindow() {
    super.viewDidMoveToWindow()
    didMoveToWindow()
  }

  @objc dynamic open func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    bounds.contains(point)
  }

  open override func hitTest(_ point: NSPoint) -> NSView? {
    guard isUserInteractionEnabled, !isHidden, alphaValue > 0.01 else { return nil }
    let local = convert(point, from: superview)
    guard self.point(inside: local, with: NSApp.currentEvent) else { return nil }
    for child in subviews.reversed() {
      if let hit = child.hitTest(local) { return hit }
    }
    return self
  }

  @objc dynamic open func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {}
  @objc dynamic open func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {}
  @objc dynamic open func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {}
  @objc dynamic open func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {}

  open override func mouseDown(with event: NSEvent) {
    touchesBegan([UITouch(event: event, view: self)], with: event)
  }

  open override func mouseDragged(with event: NSEvent) {
    touchesMoved([UITouch(event: event, view: self)], with: event)
  }

  open override func mouseUp(with event: NSEvent) {
    touchesEnded([UITouch(event: event, view: self)], with: event)
  }
}

public typealias UIControl = MasonControlBase

open class MasonControlBase: MasonViewBase {
  public struct Event: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let touchDown = Event(rawValue: 1 << 0)
    public static let touchUpInside = Event(rawValue: 1 << 6)
    public static let touchUpOutside = Event(rawValue: 1 << 7)
    public static let touchCancel = Event(rawValue: 1 << 8)
    public static let valueChanged = Event(rawValue: 1 << 12)
    public static let primaryActionTriggered = Event(rawValue: 1 << 13)
  }

  public struct State: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let normal = State([])
    public static let highlighted = State(rawValue: 1 << 0)
    public static let disabled = State(rawValue: 1 << 1)
    public static let selected = State(rawValue: 1 << 2)
  }

  public enum ContentVerticalAlignment: Int, Sendable {
    case center, top, bottom, fill
  }

  open var contentVerticalAlignment: ContentVerticalAlignment = .center
  @objc dynamic open var isEnabled = true
  @objc dynamic open var isSelected = false
  @objc dynamic open var isHighlighted = false

  private struct Action {
    weak var target: AnyObject?
    let action: Selector
    let events: Event
  }
  private var actions: [Action] = []

  public func addTarget(_ target: Any?, action: Selector, for events: Event) {
    actions.append(Action(target: target as AnyObject?, action: action, events: events))
  }

  public func removeTarget(_ target: Any?, action: Selector?, for events: Event) {
    actions.removeAll { $0.target === (target as AnyObject?) && (action == nil || $0.action == action) && !$0.events.isDisjoint(with: events) }
  }

  public func sendActions(for events: Event) {
    for a in actions where !a.events.isDisjoint(with: events) {
      NSApp.sendAction(a.action, to: a.target, from: self)
    }
  }
}

public final class UITouch: NSObject {
  public let event: NSEvent
  public private(set) weak var view: NSView?

  init(event: NSEvent, view: NSView?) {
    self.event = event
    self.view = view
  }

  public func location(in view: NSView?) -> CGPoint {
    let p = event.locationInWindow
    guard let view else { return p }
    return view.convert(p, from: nil)
  }
}

open class MasonGestureRecognizerBase: NSGestureRecognizer {
  public override init(target: Any?, action: Selector?) {
    super.init(target: target, action: action)
    delaysPrimaryMouseButtonEvents = false
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
  }

  @objc dynamic open func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {}
  @objc dynamic open func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {}
  @objc dynamic open func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {}
  @objc dynamic open func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {}

  private func touch(_ event: NSEvent) -> Set<UITouch> {
    let hit = view?.window?.contentView?.hitTest(event.locationInWindow)
    return [UITouch(event: event, view: hit ?? view)]
  }

  open override func mouseDown(with event: NSEvent) { touchesBegan(touch(event), with: event) }
  open override func mouseDragged(with event: NSEvent) { touchesMoved(touch(event), with: event) }
  open override func mouseUp(with event: NSEvent) { touchesEnded(touch(event), with: event) }
}

func masonDisplayLink(_ target: Any, _ selector: Selector) -> CADisplayLink {
  let screen = NSScreen.main ?? NSScreen.screens.first!
  let link = screen.displayLink(target: target, selector: selector)
  link.add(to: .main, forMode: .common)
  return link
}

extension NSView {
  var backingLayer: CALayer {
    if layer == nil { wantsLayer = true }
    return layer!
  }

  var alpha: CGFloat {
    get { alphaValue }
    set { alphaValue = newValue }
  }

  var center: CGPoint {
    get { CGPoint(x: frame.midX, y: frame.midY) }
    set { setFrameOrigin(CGPoint(x: newValue.x - frame.width / 2, y: newValue.y - frame.height / 2)) }
  }

  var transform: CGAffineTransform {
    get { backingLayer.affineTransform() }
    set { backingLayer.setAffineTransform(newValue) }
  }

  @objc func setNeedsDisplay() { needsDisplay = true }

  private static var interactionDisabledKey = 0
  private static var contentModeKey = 0

  enum ContentMode: Int {
    case scaleToFill, scaleAspectFit, scaleAspectFill, redraw, center, top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight
  }

  var contentMode: ContentMode {
    get { (objc_getAssociatedObject(self, &NSView.contentModeKey) as? Int).flatMap(ContentMode.init) ?? .scaleToFill }
    set {
      objc_setAssociatedObject(self, &NSView.contentModeKey, newValue.rawValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
      layerContentsRedrawPolicy = newValue == .redraw ? .duringViewResize : .onSetNeedsDisplay
      switch newValue {
      case .scaleToFill, .redraw: layerContentsPlacement = .scaleAxesIndependently
      case .scaleAspectFit: layerContentsPlacement = .scaleProportionallyToFit
      case .scaleAspectFill: layerContentsPlacement = .scaleProportionallyToFill
      case .center: layerContentsPlacement = .center
      case .top: layerContentsPlacement = .top
      case .bottom: layerContentsPlacement = .bottom
      case .left: layerContentsPlacement = .left
      case .right: layerContentsPlacement = .right
      case .topLeft: layerContentsPlacement = .topLeft
      case .topRight: layerContentsPlacement = .topRight
      case .bottomLeft: layerContentsPlacement = .bottomLeft
      case .bottomRight: layerContentsPlacement = .bottomRight
      }
    }
  }

  var isUserInteractionEnabled: Bool {
    get { objc_getAssociatedObject(self, &NSView.interactionDisabledKey) == nil }
    set { objc_setAssociatedObject(self, &NSView.interactionDisabledKey, newValue ? nil : true, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
  }

  var windowRootView: NSView? { window?.contentView }

  func hitTest(_ point: CGPoint, with event: NSEvent?) -> NSView? {
    hitTest(superview.map { convert(point, to: $0) } ?? point)
  }

  func masonSizeThatFits(_ size: CGSize) -> CGSize {
    (self as? NSControl)?.sizeThatFits(size) ?? fittingSize
  }

  func setNeedsLayout() { needsLayout = true }

  func layoutIfNeeded() { layoutSubtreeIfNeeded() }


  func endEditing(_ force: Bool) {
    guard let window, let responder = window.firstResponder as? NSView else { return }
    let owner = (responder as? NSText)?.delegate as? NSView ?? responder
    if owner.isDescendant(of: self) { window.makeFirstResponder(nil) }
  }

  func insertSubview(_ view: NSView, at index: Int) {
    if index >= subviews.count {
      addSubview(view)
    } else {
      addSubview(view, positioned: .below, relativeTo: subviews[max(index, 0)])
    }
  }

  func insertSubview(_ view: NSView, belowSubview sibling: NSView) {
    addSubview(view, positioned: .below, relativeTo: sibling)
  }

  func insertSubview(_ view: NSView, aboveSubview sibling: NSView) {
    addSubview(view, positioned: .above, relativeTo: sibling)
  }

  func bringSubviewToFront(_ view: NSView) {
    guard view.superview === self else { return }
    addSubview(view, positioned: .above, relativeTo: nil)
  }
}

public struct UIAccessibilityTraits: OptionSet, Sendable {
  public let rawValue: UInt64
  public init(rawValue: UInt64) { self.rawValue = rawValue }
  public static let button = UIAccessibilityTraits(rawValue: 1 << 0)
  public static let link = UIAccessibilityTraits(rawValue: 1 << 1)
  public static let image = UIAccessibilityTraits(rawValue: 1 << 2)
  public static let staticText = UIAccessibilityTraits(rawValue: 1 << 6)
  public static let header = UIAccessibilityTraits(rawValue: 1 << 16)

  var role: NSAccessibility.Role {
    if contains(.link) { return .link }
    if contains(.button) { return .button }
    if contains(.image) { return .image }
    return .staticText
  }
}

extension CGRect {
  func inset(by insets: NSEdgeInsets) -> CGRect {
    CGRect(
      x: minX + insets.left,
      y: minY + insets.top,
      width: max(0, width - insets.left - insets.right),
      height: max(0, height - insets.top - insets.bottom)
    )
  }
}

extension NSColor {
  static func from(cgColor: CGColor) -> NSColor { NSColor(cgColor: cgColor) ?? .clear }

  // getRed raises for colours outside an RGB space (e.g. .black), so convert first.
  @discardableResult
  func getRGBA(_ r: inout CGFloat, _ g: inout CGFloat, _ b: inout CGFloat, _ a: inout CGFloat) -> Bool {
    guard let rgb = usingColorSpace(.sRGB) else { return false }
    rgb.getRed(&r, green: &g, blue: &b, alpha: &a)
    return true
  }

  static var placeholderText: NSColor { .placeholderTextColor }
  static var label: NSColor { .labelColor }
  static var secondaryLabel: NSColor { .secondaryLabelColor }
  static var systemBackground: NSColor { .windowBackgroundColor }
}

extension NSFont {
  var lineHeight: CGFloat { ceil(ascender - descender + leading) }

  static func fontNames(forFamilyName family: String) -> [String] {
    NSFontManager.shared.availableMembers(ofFontFamily: family)?.compactMap { $0.first as? String } ?? []
  }
}

extension NSFontDescriptor.SymbolicTraits {
  static let traitItalic = NSFontDescriptor.SymbolicTraits.italic
  static let traitBold = NSFontDescriptor.SymbolicTraits.bold
  static let traitMonoSpace = NSFontDescriptor.SymbolicTraits.monoSpace
  static let traitCondensed = NSFontDescriptor.SymbolicTraits.condensed
}

extension NSImage {
  convenience init(cgImage: CGImage) {
    self.init(cgImage: cgImage, size: NSSize(width: cgImage.width, height: cgImage.height))
  }

  func draw(in rect: CGRect, blendMode: CGBlendMode, alpha: CGFloat) {
    guard let ctx = UIGraphicsGetCurrentContext(), let cg = cgImage else { return }
    ctx.saveGState()
    ctx.setBlendMode(blendMode)
    ctx.setAlpha(alpha)
    ctx.translateBy(x: rect.minX, y: rect.maxY)
    ctx.scaleBy(x: 1, y: -1)
    ctx.draw(cg, in: CGRect(origin: .zero, size: rect.size))
    ctx.restoreGState()
  }

  func draw(in rect: CGRect) {
    draw(in: rect, blendMode: .normal, alpha: 1)
  }

  var cgImage: CGImage? {
    var rect = CGRect(origin: .zero, size: size)
    return cgImage(forProposedRect: &rect, context: nil, hints: nil)
  }
}

final class UIGraphicsImageRendererFormat {
  enum Range { case automatic, standard, extended }

  var scale: CGFloat = NSScreen.main?.backingScaleFactor ?? 2
  var opaque = false
  var preferredRange: Range = .automatic

  static func `default`() -> UIGraphicsImageRendererFormat { UIGraphicsImageRendererFormat() }
}

final class UIGraphicsImageRendererContext {
  let cgContext: CGContext
  let format: UIGraphicsImageRendererFormat

  init(cgContext: CGContext, format: UIGraphicsImageRendererFormat) {
    self.cgContext = cgContext
    self.format = format
  }

  func fill(_ rect: CGRect) { cgContext.fill(rect) }
}

final class UIGraphicsImageRenderer {
  let bounds: CGRect
  let format: UIGraphicsImageRendererFormat

  init(bounds: CGRect, format: UIGraphicsImageRendererFormat = .default()) {
    self.bounds = bounds
    self.format = format
  }

  convenience init(size: CGSize, format: UIGraphicsImageRendererFormat = .default()) {
    self.init(bounds: CGRect(origin: .zero, size: size), format: format)
  }

  func image(actions: (UIGraphicsImageRendererContext) -> Void) -> NSImage {
    let scale = max(format.scale, 1)
    let width = max(Int(ceil(bounds.width * scale)), 1)
    let height = max(Int(ceil(bounds.height * scale)), 1)
    let alpha: CGImageAlphaInfo = format.opaque ? .noneSkipFirst : .premultipliedFirst
    guard let ctx = CGContext(
      data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
      space: CGColorSpace(name: CGColorSpace.sRGB)!,
      bitmapInfo: alpha.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return NSImage(size: bounds.size) }
    ctx.translateBy(x: 0, y: CGFloat(height))
    ctx.scaleBy(x: scale, y: -scale)
    ctx.translateBy(x: -bounds.minX, y: -bounds.minY)
    UIGraphicsPushContext(ctx)
    actions(UIGraphicsImageRendererContext(cgContext: ctx, format: format))
    UIGraphicsPopContext()
    guard let image = ctx.makeImage() else { return NSImage(size: bounds.size) }
    return NSImage(cgImage: image, size: bounds.size)
  }
}

extension NSBezierPath {
  convenience init(roundedRect rect: CGRect, cornerRadius: CGFloat) {
    self.init(roundedRect: rect, xRadius: cornerRadius, yRadius: cornerRadius)
  }

  func addLine(to point: CGPoint) { line(to: point) }

  func addCurve(to point: CGPoint, controlPoint1: CGPoint, controlPoint2: CGPoint) {
    curve(to: point, controlPoint1: controlPoint1, controlPoint2: controlPoint2)
  }

  func addQuadCurve(to point: CGPoint, controlPoint: CGPoint) {
    curve(to: point, controlPoint: controlPoint)
  }

  // UIKit's clockwise is in y-down space, AppKit's in y-up.
  func addArc(withCenter center: CGPoint, radius: CGFloat, startAngle: CGFloat, endAngle: CGFloat, clockwise: Bool) {
    appendArc(withCenter: center, radius: radius, startAngle: startAngle * 180 / .pi, endAngle: endAngle * 180 / .pi, clockwise: !clockwise)
  }

  func apply(_ transform: CGAffineTransform) {
    self.transform(using: AffineTransform(m11: transform.a, m12: transform.b, m21: transform.c, m22: transform.d, tX: transform.tx, tY: transform.ty))
  }

  var usesEvenOddFillRule: Bool {
    get { windingRule == .evenOdd }
    set { windingRule = newValue ? .evenOdd : .nonZero }
  }

  func reversing() -> NSBezierPath { reversed }
}

extension CIImage {
  convenience init?(image: NSImage) {
    guard let cg = image.cgImage else { return nil }
    self.init(cgImage: cg)
  }
}

extension CIColor {
  convenience init(masonColor color: NSColor) {
    self.init(cgColor: (color.usingColorSpace(.sRGB) ?? .clear).cgColor)
  }
}

func masonLayoutIsLeftToRight() -> Bool {
  (NSApp?.userInterfaceLayoutDirection ?? .leftToRight) == .leftToRight
}

func UIGraphicsGetCurrentContext() -> CGContext? {
  NSGraphicsContext.current?.cgContext
}

func UIGraphicsPushContext(_ context: CGContext) {
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: true)
}

func UIGraphicsPopContext() {
  NSGraphicsContext.restoreGraphicsState()
}
#endif
