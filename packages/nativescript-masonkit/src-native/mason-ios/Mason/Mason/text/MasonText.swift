//
//  MasonText.swift
//  Mason
//
//  Created by Osei Fortune on 20/03/2025.
//

import Foundation
import UIKit
import CoreText

// MARK: - Helper Functions (top-level)
func normalizeNewlines(_ s: String) -> String {
  guard s.utf8.contains(13) else { return s }
  return s.replacingOccurrences(of: "\r\n", with: "\n", options: .literal).replacingOccurrences(of: "\r", with: "\n", options: .literal)
}

let collapsible = #"[ \t\u{000B}\u{000C}]"#


func processPreLine(_ s: String, treatNBSPAsSpace: Bool = false) -> String {
  var t = normalizeNewlines(s)
  if treatNBSPAsSpace {
    // Optional: make NBSP behave like a normal space
    t = t.replacingOccurrences(of: "\u{00A0}", with: " ")
    // common “thin” non-breaking spaces from copy/paste:
      .replacingOccurrences(of: "\u{202F}", with: " ")
      .replacingOccurrences(of: "\u{2007}", with: " ")
  }
  // Trim collapsible spaces around newlines (space, tab, VT, FF)
  t = t.replacingOccurrences(of: #"[ \t\u{000B}\u{000C}]*\n[ \t\u{000B}\u{000C}]*"#,
                             with: "\n", options: .regularExpression)
  // Collapse remaining runs of collapsible spaces (NOT \n, NOT NBSP)
  t = t.replacingOccurrences(of: #"[ \t\u{000B}\u{000C}]+"#,
                             with: " ", options: .regularExpression)
  return t
}

// MARK: - Helper Classes
class ViewHelper {
  weak var view: UIView?
  let mason: NSCMason
  var image: UIImage?
  let node: MasonNode
  
  init(view: UIView, mason doc : NSCMason) {
    self.view = view
    mason = doc
    node = doc.nodeForView(view)
    // updateImage()
  }
  
  
  func updateImage(_ afterScreenUpdates: Bool = true) {
    guard let view = view else { return }
    let layout = node.computedLayout
    
    let size = CGSize(width: CGFloat(layout.width / NSCMason.scale), height:CGFloat( layout.height / NSCMason.scale))
    
    view.frame = CGRect(origin: view.frame.origin, size: size)
    
    if(afterScreenUpdates){
      CATransaction.setCompletionBlock {
        let renderer = UIGraphicsImageRenderer(size: size)
        self.image = renderer.image { _ in
          view.drawHierarchy(in: view.bounds, afterScreenUpdates: afterScreenUpdates)
        }
      }
      
    }else{
      let rendererFormat = UIGraphicsImageRendererFormat.default()
      rendererFormat.opaque = view.isOpaque
      
      self.image = UIGraphicsImageRenderer(size: view.bounds.size, format: rendererFormat).image { ctx in
        view.layer.render(in: ctx.cgContext)
      }
      
    }
    
  }
}


@objc(MasonTextType)
public enum MasonTextType: Int, RawRepresentable, CustomStringConvertible {
  case None
  case P
  case Span
  case Code
  case H1
  case H2
  case H3
  case H4
  case H5
  case H6
  case Li
  case Blockquote
  case B
  case Pre
  case Strong
  case Em
  case I
  case A
  
  public typealias RawValue = Int32
  
  public var rawValue: RawValue {
    switch self {
    case .None:
      return 0
    case .P:
      return 1
    case .Span:
      return 2
    case .Code:
      return 3
    case .H1:
      return 4
    case .H2:
      return 5
    case .H3:
      return 6
    case .H4:
      return 7
    case .H5:
      return 8
    case .H6:
      return 9
    case .Li:
      return 10
    case .Blockquote:
      return 11
    case .B:
      return 12
    case .Pre:
      return 13
    case .Strong:
      return 14
    case .Em:
      return 15
    case .I:
      return 16
    case .A:
      return 17
    }
  }
  
  
  public init?(rawValue: RawValue) {
    switch rawValue {
    case 0:
      self = .None
    case 1:
      self = .P
    case 2:
      self = .Span
    case 3:
      self = .Code
    case 4:
      self = .H1
    case 5:
      self = .H2
    case 6:
      self = .H3
    case 7:
      self = .H4
    case 8:
      self = .H5
    case 9:
      self = .H6
    case 10:
      self = .Li
    case 11:
      self = .Blockquote
    case 12:
      self = .B
    case 13:
      self = .Pre
    case 14:
      self = .Strong
    case 15:
      self = .Em
    case 16:
      self = .I
    case 17:
      self = .A
    default:
      return nil
    }
  }
  
  var cssValue: String {
    switch self {
    case .None:
      return "text"
    case .P:
      return "p"
    case .Span:
      return "span"
    case .Code:
      return "code"
    case .H1:
      return "h1"
    case .H2:
      return "h2"
    case .H3:
      return "h3"
    case .H4:
      return "h4"
    case .H5:
      return "h5"
    case .H6:
      return "h6"
    case .Li:
      return "li"
    case .Blockquote:
      return "blockquote"
    case .B:
      return "b"
    case .Pre:
      return "pre"
    case .Strong:
      return "strong"
    case .Em:
      return "em"
    case .I:
      return "i"
    case .A:
      return "a"
    }
  }
  
  public var description: String {
    return cssValue
  }
}

public enum InlineSegmentPayload {
  case text(width: Float, ascent: Float, descent: Float)
  case inline(id: OpaquePointer, width: Float, height: Float, baseline: Float)
}

public class MasonTextLayer: CALayer {
  weak var textView: MasonText? = nil
  
  public override init() {
    super.init()
    isOpaque = false
    needsDisplayOnBoundsChange = true
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    isOpaque = false
    needsDisplayOnBoundsChange = true
  }
  
  public override init(layer: Any) {
    super.init(layer: layer)
    isOpaque = false
    needsDisplayOnBoundsChange = true
  }
  
  public override func draw(in context: CGContext) {
    guard let textView = textView else {
      return
    }
    // Ensure the context starts clear (transparent)
    context.clear(bounds)

    // Clip background and text content to border-radius, matching the pattern in
    // MasonUIView.draw: saveGState → clip to rounded path → draw content → restoreGState
    // → draw border (border uses its own rounded paths and must not be clipped).
    textView.style.mBorderRender.resolve(for: bounds)
    let hasRadii = textView.style.mBorderRender.hasRadii()
    if hasRadii {
      context.saveGState()
      let clipPath = textView.style.mBorderRender.getClipPath(rect: bounds, radius: textView.style.mBorderRender.radius)
      context.addPath(clipPath.cgPath)
      context.clip()
    }

    // Draw background first — but skip for paragraph text nodes or when a
    // parent container supplies a CSS `background` string. This avoids
    // the text layer filling the whole paragraph when the visual background
    // should be painted by the containing view instead of the flattened text.
    var skipBackground = false
    var resolvedBg: UInt32? = nil
    if let tv = textView as? MasonText {
      let bg = tv.style.resolvedBackgroundColor
      resolvedBg = bg
      let hasOwnBg = bg != 0 || !tv.style.mBackground.layers.isEmpty
      if tv.type == .P && !hasOwnBg { skipBackground = true }
      let parentBg = tv.node.parent?.style.background.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
      if !parentBg.isEmpty && !hasOwnBg { skipBackground = true }
    }

    let clipsToText = !skipBackground && textView.style.mBackground.hasTextClip
    if !skipBackground {
      textView.style.mBackground.draw(on: self, in: context, rect: bounds, precomputedColor: resolvedBg,
                                      pass: clipsToText ? .excludingText : .all)
    }

    // If this is a flattened blockquote, draw an inline left bar (on top of background)
    var flattenedBlockquote = false
    if let tv = textView as? MasonText, tv.type == .Blockquote {
      flattenedBlockquote = tv.engine.shouldFlattenTextContainer(tv)
      if flattenedBlockquote {
        // Resolve border renderer for this rect so cachedWidths/colors are available
        textView.style.mBorderRender.resolve(for: bounds)
        let leftWidth = textView.style.mBorderRender.cachedWidths.left
        let leftSide = textView.style.mBorderRender.left
        let leftVisible = leftWidth > 0 && leftSide.style != .none && leftSide.color.cgColor.alpha > 0
        if leftVisible {
          context.saveGState()
          context.setFillColor(leftSide.color.cgColor)
          context.fill(CGRect(x: bounds.minX, y: bounds.minY, width: leftWidth, height: bounds.height))
          context.restoreGState()
        }
      }
    }

    // A border image paints under the text (its `fill` middle would hide it otherwise), and
    // outside the radius clip: CSS does not round it.
    var borderImageDrawn = false
    if textView.style.hasBorderImage && !flattenedBlockquote {
      if hasRadii { context.restoreGState() }
      borderImageDrawn = textView.style.drawBorderImage(in: context, rect: bounds)
      if hasRadii {
        context.saveGState()
        context.addPath(textView.style.mBorderRender.getClipPath(rect: bounds, radius: textView.style.mBorderRender.radius).cgPath)
        context.clip()
      }
    }

    // Draw text. `background-clip: text` layers go behind it, inside the glyphs only.
    if clipsToText { context.beginTransparencyLayer(auxiliaryInfo: nil) }
    textView.engine.drawText(context: context, rect: bounds)
    if clipsToText {
      context.saveGState()
      context.addPath(textView.engine.glyphOutlinePath())
      context.clip()
      // The layers set their own blend modes, so composite them as one group behind the text.
      context.setBlendMode(.destinationOver)
      context.beginTransparencyLayer(auxiliaryInfo: nil)
      textView.style.mBackground.draw(on: self, in: context, rect: bounds, precomputedColor: resolvedBg, pass: .textOnly)
      context.endTransparencyLayer()
      context.restoreGState()
      context.endTransparencyLayer()
    }
    (textView as? MasonText)?.inlineBoxesDrawn()

    // Restore pre-clip state before drawing border — border uses its own rounded path
    // and must not be constrained by the content clip set above.
    if hasRadii {
      context.restoreGState()
    }

    // Draw full border only when not flattened (flattened blockquote uses inline bar above)
    if !flattenedBlockquote && !borderImageDrawn {
      textView.style.mBorderRender.draw(in: context, rect: bounds)
    }

    textView.style.applyResolvedFilter(in: context, rect: bounds, view: textView)
  }
}


// MARK: - MasonText Main Class
@objc(MasonText)
@objcMembers
public class MasonText: UIView, MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener, TextContainer {
  // MARK: Properties
  public let node: MasonNode
  public let type: MasonTextType
  
  lazy public var engine = {
    TextEngine(container: self)
  }()

  // Last laid-out size; used to force a text redraw on resize (e.g. rotation).
  // needsDisplayOnBoundsChange alone leaves offscreen views with a stale bitmap
  // that CoreAnimation rescales into the new bounds, squishing the glyphs.
  private var lastLaidOutSize: CGSize = .zero

  
  public override class var layerClass: AnyClass { MasonTextLayer.self }
  
  var textLayer: MasonTextLayer {
    return layer as! MasonTextLayer
  }
  
  public var textValues: NSMutableData {
    get {
      return style.values
    }
  }
  
  
  public func onStyleChange(_ low: UInt64, _ high: UInt64) {
    engine.onStyleChange(low, high)
  }
  
  
  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
    return node.style
  }
  
  
  // MARK: Initialization
  public init(mason: NSCMason, type textType: MasonTextType){
    node = mason.createTextNode()
    type = textType
    super.init(frame: .zero)
    initText()
  }
  
  public init(mason: NSCMason) {
    node = mason.createTextNode()
    type = .None
    super.init(frame: .zero)
    initText()
  }
  
  
  internal init(mason: NSCMason, isAnonymous: Bool) {
    node = mason.createTextNode(isAnonymous: isAnonymous)
    type = .None
    super.init(frame: .zero)
    node.isAnonymous = isAnonymous
    initText()
  }
  
  public override func setNeedsDisplay() {
    // Never gate the invalidation itself. CoreAnimation already coalesces
    // repeated calls, but the old `drawState == .idle` guard could drop one
    // permanently: if a requested display never actually ran (backing store
    // dropped on re-attach, zero-sized pass, offscreen view), the engine
    // latched at `.pending` and swallowed every later invalidation.
    super.setNeedsDisplay()
    if engine.drawState == .idle {
      engine.drawState = .pending
    }
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    // A view that leaves and re-enters the hierarchy comes back with an empty
    // backing store; CoreAnimation does not replay the last draw. Ask for one
    // explicitly, and clear any stale `.pending` left by a display that never
    // ran, so the text cannot come back blank.
    guard window != nil else { return }
    engine.drawState = .idle
    textLayer.setNeedsDisplay()
  }
  
  
  public func requestLayout() {
    engine.invalidateInlineSegments()
    // handle text nesting
    if(MasonViewKind.isTextContainer(node.layoutParent?.view)){
      if(!engine.shouldFlattenTextContainer(self)){
        setNeedsDisplay()
      }
      if let parent = node.layoutParent?.view as? MasonText{
        parent.requestLayout()
      }
      return
    }
    textLayer.setNeedsDisplay()
    // Coalesce: many text writes in one turn share a single layout pass.
    if let root = rootLayoutElement() {
      root.setNeedsLayoutPass()
      setNeedsDisplay()
    }
  }
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    syncInlineBoxViews()
    for view in inlineBoxes.values {
      placeInlineBox(inlineBoxNode(view), view, view.frame)
    }

    // On a size change, redraw the text layer at the new width rather than
    // letting CoreAnimation rescale a stale bitmap.
    if !bounds.size.equalTo(lastLaidOutSize) {
      lastLaidOutSize = bounds.size
      textLayer.setNeedsDisplay()
    }
    // Keeps the outset shadow and filter output layers on the view as UIKit moves it.
    style.updateShadowLayer(for: CGRect(origin: .zero, size: bounds.size))
  }

  public override func willMove(toSuperview newSuperview: UIView?) {
    super.willMove(toSuperview: newSuperview)
    // Those layers live in the old superview, so remove them while it is still current.
    if newSuperview == nil {
      style.removeShadowLayer()
    }
  }

  // An inline element being pressed: an inline box or a flattened element such as <a>.
  private var inlineTapTarget: MasonNode?
  private var inlineTapStart: CGPoint?

  /// The inline element a tap at `point` goes to, when it or an ancestor listens for click.
  internal func inlineClickTarget(at point: CGPoint) -> MasonNode? {
    guard let target = engine.inlineNode(at: point), target !== node,
          node.mason.hasListenerOnPath(target, "click") else { return nil }
    // A box with its own click recognizer takes the touch itself.
    if let view = target.view, view.superview === self,
       view.gestureRecognizers?.contains(where: { $0 is MasonGestureRecognizer && $0.isEnabled }) == true {
      return nil
    }
    return target
  }

  // MARK: Inline boxes
  // The inline boxes in this text are its subviews; the text only leaves room for them.
  private var inlineBoxes: [ObjectIdentifier: UIView] = [:]

  internal func syncInlineBoxViews() {
    let wanted = engine.inlineBoxViews()
    if wanted.isEmpty && inlineBoxes.isEmpty { return }
    let wantedIds = Set(wanted.map { ObjectIdentifier($0) })
    for (id, view) in inlineBoxes where !wantedIds.contains(id) {
      inlineBoxes[id] = nil
      if view.superview === self { node.suppressChildOperations { view.removeFromSuperview() } }
      if let box = (view as? MasonElement)?.node, box.inlineTurn != 0 {
        box.inlineTurn = 0
        box.style.applyTransformFromBuffer()
      }
    }
    for view in wanted where view.superview !== self {
      if let owner = MasonViewKind.element(view.superview)?.node {
        owner.suppressChildOperations { view.removeFromSuperview() }
      } else {
        view.removeFromSuperview()
      }
      node.suppressChildOperations { addSubview(view) }
      inlineBoxes[ObjectIdentifier(view)] = view
    }
  }

  internal func ownsInlineBox(_ view: UIView) -> Bool {
    return inlineBoxes[ObjectIdentifier(view)] != nil && view.superview === self
  }

  /// Places an inline box: where the drawn text left room for it, else at `frame` (Mason's).
  internal func placeInlineBox(_ box: MasonNode, _ view: UIView, _ frame: CGRect) {
    var rect = engine.drawnBoxFrame(for: box) ?? frame
    // A form control in vertical text runs down the page like the text: the control is
    // horizontal, so it is laid out unturned around the same centre and turned clockwise.
    let turn: CGFloat = view is MasonInput && engine.verticalWritingMode != 0 ? .pi / 2 : 0
    if turn != 0 {
      rect = CGRect(x: rect.midX - rect.height / 2, y: rect.midY - rect.width / 2, width: rect.height, height: rect.width)
    }
    if box.inlineTurn != turn {
      box.inlineTurn = turn
      box.style.applyTransformFromBuffer()
    }
    let bounds = CGRect(origin: view.bounds.origin, size: rect.size)
    let center = CGPoint(x: rect.midX, y: rect.midY)
    let moved = view.bounds.size != bounds.size || view.center != center
    if view.bounds.size != bounds.size { view.bounds = bounds }
    if view.center != center { view.center = center }
    // Its shadow and filter output layers sit beside it in this view, so they follow it.
    if moved { box.style.updateShadowLayer(for: CGRect(origin: .zero, size: rect.size)) }
  }

  // After a draw, boxes the text moved are laid out again.
  internal func inlineBoxesDrawn() {
    guard !inlineBoxes.isEmpty else { return }
    for view in inlineBoxes.values {
      let box = inlineBoxNode(view)
      guard let rect = engine.drawnBoxFrame(for: box) else { continue }
      let size = box.inlineTurn != 0 ? CGSize(width: rect.height, height: rect.width) : rect.size
      if view.center != CGPoint(x: rect.midX, y: rect.midY) || view.bounds.size != size {
        DispatchQueue.main.async { [weak self] in self?.setNeedsLayout() }
        return
      }
    }
  }

  /// The pressed inline element and its ancestors inside this text view.
  private func setInlinePressed(_ target: MasonNode, _ pressed: Bool) {
    var current: MasonNode? = target
    while let n = current, n !== node {
      if n.hasPseudo(.active) != pressed {
        n.setPseudo(.active, pressed)
        n.view?.setNeedsDisplay()
        n.view?.layer.setNeedsDisplay()
      }
      current = n.parent
    }
    textLayer.setNeedsDisplay()
  }

  private func endInlineTap() {
    if let target = inlineTapTarget { setInlinePressed(target, false) }
    inlineTapTarget = nil
    inlineTapStart = nil
  }

  // Inline boxes and flattened elements are drawn by this view, so it routes their taps: the
  // click goes to the element under the finger and bubbles from there, as on the web.
  public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    if let touch = touches.first, beginInlineTap(at: touch.location(in: self), windowLocation: touch.location(in: nil)) {
      return
    }
    super.touchesBegan(touches, with: event)
  }

  internal func beginInlineTap(at point: CGPoint, windowLocation: CGPoint) -> Bool {
    endInlineTap()
    guard let target = inlineClickTarget(at: point) else { return false }
    inlineTapTarget = target
    inlineTapStart = windowLocation
    setInlinePressed(target, true)
    return true
  }

  public override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    if inlineTapTarget != nil {
      if let touch = touches.first, let start = inlineTapStart {
        let now = touch.location(in: nil)
        if hypot(now.x - start.x, now.y - start.y) > 10 { endInlineTap() }
      }
      return
    }
    super.touchesMoved(touches, with: event)
  }

  public override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard inlineTapTarget != nil else {
      super.touchesEnded(touches, with: event)
      return
    }
    finishInlineTap(at: touches.first?.location(in: self) ?? .zero)
  }

  internal func finishInlineTap(at location: CGPoint) {
    guard let target = inlineTapTarget else { return }
    endInlineTap()
    dispatchInlineClick(target, at: location)
  }

  internal func dispatchInlineClick(_ target: MasonNode, at location: CGPoint) {
    let click = MasonMouseEvent(
      type: "click",
      options: MasonMouseEventOptions().apply {
        $0.clientX = Float(location.x)
        $0.clientY = Float(location.y)
        $0.screenX = Float(location.x)
        $0.screenY = Float(location.y)
        $0.pageX = Float(location.x)
        $0.pageY = Float(location.y)
      }
    )
    click.target = target.view
    node.mason.dispatch(click, target)
  }

  // MARK: Accessibility
  // Reads as static text. A text view drawing interactive inline elements (links, buttons,
  // elements with click listeners) is instead a container of its text pieces and those elements.
  private var accessibilityElementOverride: Bool?

  private var accessibilityText: String {
    var text = engine.buildAttributedString().string.replacingOccurrences(of: "\u{FFFC}", with: "")
    // A marker (list bullet, summary triangle) isn't part of the accessible name.
    let marker = engine.insideMarker
    if !marker.isEmpty, text.hasPrefix(marker) { text.removeFirst(marker.count) }
    return text.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  public override var isAccessibilityElement: Bool {
    get { accessibilityElementOverride ?? (engine.inlineAccessibilityElements(in: self) == nil && !accessibilityText.isEmpty) }
    set { accessibilityElementOverride = newValue }
  }

  public override var accessibilityLabel: String? {
    get { super.accessibilityLabel ?? accessibilityText }
    set { super.accessibilityLabel = newValue }
  }

  public override var accessibilityTraits: UIAccessibilityTraits {
    get { super.accessibilityTraits.union(type == .A ? .link : .staticText) }
    set { super.accessibilityTraits = newValue }
  }

  public override var accessibilityElements: [Any]? {
    get { super.accessibilityElements ?? engine.inlineAccessibilityElements(in: self) }
    set { super.accessibilityElements = newValue }
  }

  public override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    if inlineTapTarget != nil {
      endInlineTap()
      return
    }
    super.touchesCancelled(touches, with: event)
  }

  public func addView(_ view: UIView){
    if(view.superview == self){
      return
    }
    if(view is MasonElement){
      append((view as! MasonElement))
    }else {
      append(node: inlineNode(forForeign: view))
    }
  }
  
  public func addView(_ view: UIView, at: Int){
    if(view.superview == self){
      return
    }

    if(view is MasonElement){
      node.addChildAt((view as! MasonElement).node, at)
    }else {
      node.addChildAt(inlineNode(forForeign: view), at)
    }
  }

  /// A plain UIView (an SVG, a canvas, a native control) in text is an atomic inline box, as a
  /// replaced element is in HTML; its node would otherwise be a block and break the line.
  private func inlineNode(forForeign view: UIView) -> MasonNode {
    let child = node.mason.nodeForView(view)
    if child.style.display == .Block {
      child.style.display = .InlineBlock
    }
    return child
  }

  /// The node an inline box's view is laid out by: its own for a Mason element, else the leaf
  /// Mason made for it.
  private func inlineBoxNode(_ view: UIView) -> MasonNode {
    return (view as? MasonElement)?.node ?? node.mason.nodeForView(view)
  }

  public func removeView(_ view: UIView) {
    let childNode = (view as? MasonElement)?.node ?? node.mason.nodeForView(view)
    node.removeChild(childNode)
    engine.invalidateInlineSegments()
  }

  public func removeView(at index: Int) {
    _ = node.removeChildAt(index: index)
    engine.invalidateInlineSegments()
  }

  public func removeAllViews() {
    if let ptr = node.nativePtr {
      mason_node_remove_children(node.mason.nativePtr, ptr)
    }
    node.children.removeAll()
    engine.invalidateInlineSegments()
  }
  
  
  // User-agent default (font-size, margin) for a block text tag ("p",
  // "h1".."h6", "blockquote", "pre"), in unscaled CSS px. Single source of
  // truth lives in mason-core (`ua_default_for_tag`); must stay in sync with
  // Android TextView.kt's equivalent call. Returns a zeroed struct if the
  // tag has no UA default.
  static func uaDefault(_ tag: String) -> CMasonUaDefault {
    var value = CMasonUaDefault(font_size: 0, margin_top: 0, margin_bottom: 0, margin_left: 0, margin_right: 0)
    _ = tag.withCString { cTag in
      mason_ua_default_for_tag(cTag, &value)
    }
    return value
  }

  static func uaMargin(_ ua: CMasonUaDefault, _ scale: Float) -> MasonRect<MasonLengthPercentageAuto> {
    return MasonRect(
      .Points(ua.margin_top * scale),
      .Points(ua.margin_right * scale),
      .Points(ua.margin_bottom * scale),
      .Points(ua.margin_left * scale)
    )
  }

  static func uaMargin(_ tag: String, _ scale: Float) -> MasonRect<MasonLengthPercentageAuto> {
    return uaMargin(uaDefault(tag), scale)
  }

  private func initText(){
    isOpaque = false
    textLayer.textView = self
    textLayer.contentsScale = CGFloat(NSCMason.scale)
    style.setStyleChangeListener(listener: self)
    node.view = self
    node.measureFunc = { [weak self] known, available in
      guard let self = self else { return .zero }
      let type = self.type
      return TextEngine.measure(self.engine, TextEngine.isInlineTextType(type), known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
    let scale = NSCMason.scale
    node.inBatch = true
    
    
    switch(type){
    case .None:
      break
    // Web user-agent default font-size/margin numbers live in mason-core
    // (single source of truth, see ua_default_for_tag), scaled here from CSS
    // px to mason's device-pixel space. Must stay in sync with Android
    // TextView.kt's equivalent call.
    case .P:
      style.display = .Block
      style.margin = MasonText.uaMargin("p", scale) // 1em
      break
    case .Span:
      style.display = .Inline
      break
    case .Code:
      style.display = .Inline
      // ui-monospace → Menlo; the `monospace` generic maps to Courier, which looks
    // wide/loose next to Android's clean mono.
    style.fontFamily = "ui-monospace"
      break
    case .H1:
      let ua1 = MasonText.uaDefault("h1") // fontSize 2em, margin 0.67em
      fontSize = ua1.font_size
      style.display = .Block
      style.fontWeight = "bold"
      style.margin = MasonText.uaMargin(ua1, scale)
      break
    case .H2:
      let ua2 = MasonText.uaDefault("h2") // fontSize 1.5em, margin 0.83em
      fontSize = ua2.font_size
      style.display = .Block
      style.fontWeight = "bold"
      style.margin = MasonText.uaMargin(ua2, scale)
      break
    case .H3:
      let ua3 = MasonText.uaDefault("h3") // fontSize 1.17em ≈ 18.72, margin 1em
      fontSize = ua3.font_size
      style.display = .Block
      style.fontWeight = "bold"
      style.margin = MasonText.uaMargin(ua3, scale)
      break
    case .H4:
      let ua4 = MasonText.uaDefault("h4") // fontSize 1em, margin 1.33em
      fontSize = ua4.font_size
      style.display = .Block
      style.fontWeight = "bold"
      style.margin = MasonText.uaMargin(ua4, scale)
      break
    case .H5:
      let ua5 = MasonText.uaDefault("h5") // fontSize 0.83em ≈ 13.28, margin 1.67em
      fontSize = ua5.font_size
      style.display = .Block
      style.fontWeight = "bold"
      style.margin = MasonText.uaMargin(ua5, scale)
      break
    case .H6:
      let ua6 = MasonText.uaDefault("h6") // fontSize 0.67em ≈ 10.72, margin 2.33em
      fontSize = ua6.font_size
      style.display = .Block
      style.fontWeight = "bold"
      style.margin = MasonText.uaMargin(ua6, scale)
      break
    case .Li:
      // Real browsers give <li> `display: list-item` (block box + ::marker).
      // Marker rendering here is handled separately, so `.Block` alone is
      // enough to stop siblings from running together on one line.
      style.display = .Block
      break
    case .Blockquote:
      style.display = .Block
      style.margin = MasonText.uaMargin("blockquote", scale) // 1em 40px
      break
    case .B, .Strong:
      style.display = .Inline
      style.fontWeight = "bold"
      break
    case .Pre:
      style.display = .Block
      // ui-monospace → Menlo; the `monospace` generic maps to Courier, which looks
    // wide/loose next to Android's clean mono.
    style.fontFamily = "ui-monospace"
      whiteSpace = .Pre
      style.margin = MasonText.uaMargin("pre", scale) // 1em
      break
    case .I, .Em:
      style.display = .Inline
      style.fontStyle = .Italic
      break
    case .A:
      node.style.display = Display.Inline
      // No forced underline — match web (CSS resets links); honor text-decoration.
      node.hasClickGesture = true
      let recognizer = MasonGestureRecognizer(targetView: self)
      recognizer.owner = self
      addGestureRecognizer(recognizer)
      break
    }
    
    // Generic families load lazily from a shared cache when attributes are built.
    if MasonStyle.loadedGenericFace(like: style.font) == nil {
      style.font.loadSync(nil)
    }
    node.inBatch = false
  }
  
  
  
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  // MARK: - Text Style Properties
  
  // Text overflow
  public var textOverflow: TextOverflow {
    get {
      return style.textOverflow
    }
    set {
      style.textOverflow = newValue
    }
  }
  
  public var textOverflowCompat: TextOverflowCompat {
    get {
      return style.textOverflowCompat
    }
    set {
      style.textOverflowCompat = newValue
    }
  }
  
  
  public var color: UInt32 {
    get {
      return style.color
    }
    set {
      style.color = newValue
    }
  }
  
  public func setColor(ui color: UIColor) {
    self.color = color.toUInt32()
  }
  
  public var backgroundColorValue: UInt32 {
    get {
      return style.backgroundColor
    }
    set {
      style.backgroundColor = newValue
    }
  }
  
  public func setBackgroundColor(ui color: UIColor) {
    style.backgroundColor = color.toUInt32()
  }
  
  
  public var decorationColor: UInt32 {
    get {
      return style.decorationColor
    }
    set {
      style.decorationColor = newValue
    }
  }
  
  public func setDecorationColor(ui color: UIColor) {
    style.decorationColor = color.toUInt32()
  }
  
  public var decorationLine: DecorationLine {
    get {
      return style.decorationLine
    }
    set {
      style.decorationLine = newValue
    }
  }
  
  public var fontSize: Float {
    get {
      return style.fontSize
    }
    set {
      style.fontSize = newValue
    }
  }
  
  public var fontStyle: FontStyle {
    get {
      return style.fontStyle
    }
    set {
      style.fontStyle = newValue
    }
  }
  
  public func setFontStyle(_ style: FontStyle, slant: Int32) {
    self.style.setFontStyle(style, slant)
  }
  
  
  public var fontWeight: String {
    get {
      return style.fontWeight
    }
    set {
      style.fontWeight = newValue
    }
  }
  
  public var textTransform: TextTransform {
    get {
      return style.textTransform
    }
    set {
      style.textTransform = newValue
    }
  }
  
  
  public var whiteSpace: WhiteSpace {
    get {
      return style.whiteSpace
    }
    set {
      style.whiteSpace = newValue
    }
  }
  
  
  public var textWrap: TextWrap {
    get {
      return style.textWrap
    }
    set {
      style.textWrap = newValue
    }
  }
  
  public var lineHeight: Float {
    get {
      return style.lineHeight
    }
    set {
      style.lineHeight = newValue
    }
  }
  
  /// Text content - sets or gets the concatenated text from all text nodes
  public var textContent: String {
    get {
      engine.textContent
    }
    set {
      engine.textContent = newValue
    }
  }
}

// MARK: - Invalidation
extension MasonText {
  
  /// Remove child from text container
  @discardableResult public func removeChild(_ child: MasonNode) -> MasonNode? {
    guard let index = node.children.firstIndex(where: { $0 === child }) else {
      return nil
    }
    
    // Remove from author tree
    node.children.remove(at: index)
    child.parent = nil
    
    // Remove from layout tree if it's a real node
    if let ptr = node.nativePtr, let childPtr = child.nativePtr {
      mason_node_remove_child(node.mason.nativePtr, ptr, childPtr)
    }
    
    engine.invalidateInlineSegments()
    node.markDirty()
    return child
  }
  
  /// Insert child at specific index
  internal func insertChild(_ child: MasonNode, at index: Int) {
    let idx = max(0, min(index, node.children.count))
    
    if let oldParent = child.parent, oldParent !== node {
      if let textParent = oldParent.view as? MasonText {
        textParent.removeChild(child)
      }
    }
    
    node.children.insert(child, at: idx)
    child.parent = node
    
    // Sync layout tree if it's a real node
    if child.nativePtr != nil {
      syncLayoutChildren()
    }
    
    engine.invalidateInlineSegments()
    node.markDirty()
  }
  
  
  /// Insert child at specific index
  internal func replaceChild(_ child: MasonNode, at index: Int) {
    if(index < 0 || index >= node.children.count) {
      return
    }
    
    if let oldParent = child.parent, oldParent !== node {
      if let textParent = oldParent.view as? MasonText {
        textParent.removeChild(child)
      }
    }
    
    let removing = node.children[index]
    removeChild(removing)
    
    node.children[index] = child
    
    child.parent = node
    
    // Sync layout tree if it's a real node
    if child.nativePtr != nil {
      syncLayoutChildren()
    }
    
    engine.invalidateInlineSegments()
    node.markDirty()
  }
  
  
  
  /// Sync layout children to Taffy (for bulk/insert operations)
  //  private func syncLayoutChildren() {
  //    guard let ptr = node.nativePtr else { return }
  //
  //    // Filter to only children with nativePtr (inline elements)
  //    let layoutChildren = node.children.filter { $0.nativePtr != nil }.compactMap { Optional($0.nativePtr) }
  //
  //    // Replace Taffy children with the filtered set
  //    mason_node_set_children(node.mason.nativePtr, ptr, layoutChildren, UInt(layoutChildren.count))
  //  }
}


// MARK: - Child Management
extension MasonText {
  public func addChild(_ child: MasonNode) {
    if let oldParent = child.parent, oldParent !== node {
      if let textParent = oldParent.view as? MasonText {
        textParent.removeChild(child)
      }
    }
    
    // Set container reference for text nodes FIRST
    if let textNode = child as? MasonTextNode {
      textNode.container = self
      if(!textNode.attributesInitialized){
        textNode.attributes = getDefaultAttributes()
        textNode.attributesInitialized = true
      }
    }
    
    node.children.append(child)
    child.parent = node
    
    
    invalidate()
  }
  
  internal func syncLayoutChildren() {
    guard let ptr = node.nativePtr else {
      return
    }
    
    // Collect only real nodes (with nativePtr) for layout tree
    let layoutChildren = node.children.compactMap { child -> OpaquePointer? in
      if child.nativePtr != nil {
        return child.nativePtr
      } else {
        return nil
      }
    }
    
    var optionalChildren = layoutChildren.map { Optional($0) }
    mason_node_set_children(node.mason.nativePtr, ptr, &optionalChildren, UInt(optionalChildren.count))
  }
}

// MARK: - Text Content Management
extension MasonText {
  
  /// Append text to the container
  internal func appendText(_ text: String) {
    
    // Check if last child is a text node - append to it
    if let lastTextNode = node.children.last as? MasonTextNode {
      lastTextNode.data += text
    } else {
      // Create new text node
      let textNode = MasonTextNode(mason: node.mason, data: text, attributes: getDefaultAttributes())
      textNode.container = self
      node.children.append(textNode)
      textNode.parent = node
    }
    
    engine.invalidateInlineSegments()
    requestLayout()
  }
}
