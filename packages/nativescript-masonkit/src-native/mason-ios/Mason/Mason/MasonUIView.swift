//
//  MasonView.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Foundation

@objcMembers
@objc(MasonUIView)
public class MasonUIView: UIView, MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener {
  func onStyleChange(_ low: UInt64, _ high: UInt64) {
    invalidateDrawFlags()
    MasonNode.invalidateDescendantTextViews(node, low, high)
  }
  
  internal let maskPath = CGMutablePath()
  
  // Cached draw-state flags — updated on style change, not every frame
  internal var _cachedHasBackground = false
  internal var _cachedHasBoxShadow = false
  internal var _cachedHasBorder = false
  internal var _cachedHasFilter = false
  internal var _drawFlagsDirty = true
  
  internal func invalidateDrawFlags() {
    _drawFlagsDirty = true
    setNeedsDisplay()
  }
  
  private func updateDrawFlagsIfNeeded() {
    guard _drawFlagsDirty else { return }
    _drawFlagsDirty = false
    let bgString = style.background.trimmingCharacters(in: .whitespacesAndNewlines)
    _cachedHasBackground = !bgString.isEmpty || !style.mBackground.layers.isEmpty || style.mBackground.color != nil
    _cachedHasBoxShadow = !style.boxShadows.isEmpty
    _cachedHasBorder = !style.mBorderRender.css.isEmpty
    _cachedHasFilter = !style.resolvedFilterString.isEmpty
  }
  
  public override func draw(_ rect: CGRect) {
    updateDrawFlagsIfNeeded()

    let hasBackground = _cachedHasBackground
    let hasBoxShadow = _cachedHasBoxShadow
    let hasBorder = _cachedHasBorder
    let hasFilter = _cachedHasFilter

    // Check for HTML <li> children that need marker drawing in the parent's padding zone.
    var hasListMarkers = false
    for sv in subviews where (sv as? MasonText)?.type == .Li {
      hasListMarkers = true
      break
    }

    // Early-out: skip all CoreGraphics work for plain views with no decoration
    guard hasBackground || hasBoxShadow || hasBorder || hasFilter || hasListMarkers else { return }

    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }

    style.mBorderRender.resolve(for: bounds)
    let borderWidths = style.mBorderRender.cachedWidths
    let hasRadii = style.mBorderRender.hasRadii()

    // Outset shadows are handled by MasonShadowLayer

    // Background across full bounds (border drawn on top) to avoid a 1px gap at
    // edge-aligned children when border widths are present.
    if hasBackground {
      // Expand by a fractional device pixel to avoid 1px hairline gaps
      let scale = CGFloat(NSCMason.scale)
      let expand: CGFloat = 1.0 / scale
      let innerRect = bounds.insetBy(dx: -expand, dy: -expand)

      context.saveGState()
      if hasRadii {
        let innerRadius = style.mBorderRender.radius
        let innerPath = style.mBorderRender.getClipPath(rect: innerRect, radius: innerRadius)
        context.addPath(innerPath.cgPath)
        context.clip()
      }
      style.mBackground.draw(on: self, in: context, rect: innerRect)
      context.restoreGState()
    }

    // Inset box shadows (render on top of background)
    if hasBoxShadow {
      style.mBoxShadowRenderer.drawInsetShadows(in: context, rect: bounds, borderRenderer: style.mBorderRender)
    }

    // Draw list markers for HTML <li> children into the parent's padding zone.
    if hasListMarkers {
      drawListItemMarkers(in: context)
    }

    // No external clip: CSSBorderRenderer.draw() builds its own rounded stroke
    // paths, and clipping the outer edge causes black anti-alias fringing with
    // border-radius + box-shadow.
    if hasBorder {
      style.mBorderRender.draw(in: context, rect: bounds)
    }

    if hasFilter {
      style.applyResolvedFilter(in: context, rect: bounds, view: self)
    }
  }

  private func drawListItemMarkers(in context: CGContext) {
    var position = 0
    for sv in subviews {
      guard let liText = sv as? MasonText, liText.type == .Li else { continue }
      drawMarkerFor(listItem: liText, in: context, position: position)
      position += 1
    }
  }

  private func resolveListStyleTypeFor(_ child: MasonText) -> ListStyleType {
    if style.isValueInitialized {
      let isSet = style.getUInt8(StyleKeys.LIST_STYLE_TYPE_STATE) != 0
      if isSet, let type = ListStyleType(rawValue: Int8(style.getUInt8(StyleKeys.LIST_STYLE_TYPE))) {
        return type
      }
    }
    if child.style.isValueInitialized {
      let isSet = child.style.getUInt8(StyleKeys.LIST_STYLE_TYPE_STATE) != 0
      if isSet, let type = ListStyleType(rawValue: Int8(child.style.getUInt8(StyleKeys.LIST_STYLE_TYPE))) {
        return type
      }
    }
    return .Disc
  }

  private func drawMarkerFor(listItem child: MasonText, in context: CGContext, position: Int) {
    let listType = resolveListStyleTypeFor(child)
    guard listType != .None else { return }

    let uiFont = child.style.resolvedFontFace.uiFont ?? UIFont.systemFont(ofSize: CGFloat(Constants.DEFAULT_FONT_SIZE))
    let fontSize = uiFont.pointSize
    let ascent = uiFont.ascender   // positive: distance from baseline to top
    let descent = uiFont.descender // negative: distance from baseline to bottom

    let markerSize = fontSize * 0.35
    let gap = fontSize * 0.5

    // Baseline in self (MasonUIView) coordinate space (y-down).
    let childFrame = child.frame
    // Centre the marker on the first line's box midpoint (text sits centred in
    // the line-height box) — not the bare font baseline, which drifts off-line.
    let lineHeightType = child.style.resolvedLineHeightType
    let lineHeightVal = CGFloat(child.style.resolvedLineHeight)
    let fontLineHeight = uiFont.ascender - uiFont.descender
    let lineBox: CGFloat = {
      if lineHeightType == 1 { return max(lineHeightVal, fontLineHeight) }   // absolute pt
      if lineHeightVal > 0 { return max(lineHeightVal * fontSize, fontLineHeight) } // multiplier
      return fontLineHeight
    }()
    let lineCenter = childFrame.minY + lineBox / 2.0
    // Baseline of the first line, derived from the centred line box.
    let baseline = lineCenter + (ascent + descent) / 2.0
    // Marker shape centres on the line's visual middle (cap/x-height midpoint).
    let cy = lineCenter

    // Marker zone: child.frame.minX - gap - markerContentWidth .. child.frame.minX - gap
    // (gap separates the marker from the text content)
    let markerRight = childFrame.minX - gap

    let textColor = UIColor.colorFromARGB(child.style.resolvedColor)

    context.saveGState()
    context.setFillColor(textColor.cgColor)
    context.setStrokeColor(textColor.cgColor)

    switch listType {
    case .Disc:
      let r = markerSize / 2.0
      let cx = markerRight - r
      context.fillEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))

    case .Circle:
      let r = markerSize / 2.0
      let cx = markerRight - r
      let lineWidth = max(1.0, fontSize * 0.08)
      context.setLineWidth(lineWidth)
      context.strokeEllipse(in: CGRect(
        x: cx - r + lineWidth / 2,
        y: cy - r + lineWidth / 2,
        width: r * 2 - lineWidth,
        height: r * 2 - lineWidth
      ))

    case .Square:
      let half = markerSize / 2.0
      let cx = markerRight - half
      context.fill(CGRect(x: cx - half, y: cy - half, width: half * 2, height: half * 2))

    case .Decimal:
      let text = "\(position + 1)."
      let attrs: [NSAttributedString.Key: Any] = [.font: uiFont, .foregroundColor: textColor]
      let attributed = NSAttributedString(string: text, attributes: attrs)
      let textWidth = attributed.size().width
      attributed.draw(at: CGPoint(x: markerRight - textWidth, y: baseline - ascent))

    case .Custom:
      let text = "\u{2022}"
      let attrs: [NSAttributedString.Key: Any] = [.font: uiFont, .foregroundColor: textColor]
      let attributed = NSAttributedString(string: text, attributes: attrs)
      let textWidth = attributed.size().width
      attributed.draw(at: CGPoint(x: markerRight - textWidth, y: baseline - ascent))

    case .None:
      break
    }

    context.restoreGState()
  }

  public let node: MasonNode
  public let mason: NSCMason

  public var uiView: UIView { self }

  // MARK: - Scroll state
  // When overflow is scroll/auto, this view scrolls like a web <div> via
  // bounds.origin (as UIScrollView does), driven by a pan gesture that only
  // begins when actually scrollable.
  public var contentSize: CGSize = .zero
  // When true, default `visible` overflow on Y acts as `auto` (web-like scroll-on-overflow).
  @objc public var isScrollContainer: Bool = false
  private var _scrollPanStartOffset: CGPoint = .zero
  private var _scrollDecelerationLink: CADisplayLink?
  private var _scrollDecelerationVelocity: CGPoint = .zero
  // DecelerationRate.normal (0.998) is per-millisecond; raise to 1000/60 to get
  // the per-frame factor (≈0.967) matching UIScrollView feel.
  private let _scrollDecelerationRate: CGFloat = pow(UIScrollView.DecelerationRate.normal.rawValue, 1000.0 / 60.0)
  private var _lastBoundsSize: CGSize = .zero
  private var _scrollGestureDelegate: _MasonScrollPanDelegate?
  // True while a scroll gesture/deceleration is active; layoutSubviews skips
  // autoComputeIfRoot so scroll-step bounds changes don't retrigger layout.
  private var _isScrolling = false

  public var contentOffset: CGPoint {
    get { bounds.origin }
    set { _setScrollOrigin(_clampScrollOffset(newValue)) }
  }

  // Set the scroll origin without clamping, so pan/deceleration can hold an overscrolled position.
  private func _setScrollOrigin(_ c: CGPoint) {
    guard bounds.origin != c else { return }
    // Disable implicit CA animations so scroll bounds changes don't lag.
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    var b = bounds; b.origin = c; bounds = b
    _updateScrollMask()
    CATransaction.commit()
  }

  private lazy var _scrollPanGesture: UIPanGestureRecognizer = {
    let g = UIPanGestureRecognizer(target: self, action: #selector(_handleScrollPan(_:)))
    return g
  }()
  
  public var style: MasonStyle {
    return node.style
  }
  
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    // Skip layout during scroll steps — bounds.origin changes only shift the
    // visible window, not child positions.
    guard !_isScrolling else { return }
    // Must run before the size guard: style-only changes (overflow, color) mark
    // the node dirty without resizing, and gating on size would leave contentSize
    // at zero so scroll clamps to (0,0).
    autoComputeIfRoot()
    // Safety-net sweep for orphaned outset-shadow layers on UIKit-driven
    // relayouts that bypass applyToView's reconcile.
    MasonElementHelpers.reconcileShadowLayers(self)
    let currentSize = bounds.size
    // Always reposition the shadow layer: frame.origin can change without a size
    // change, and the layer is keyed to our frame in the superview's coords.
    style.updateShadowLayer(for: CGRect(origin: .zero, size: currentSize))
    // Keep the backdrop-filter effect view/layer sized to us (it's usually set
    // before layout, when bounds is still .zero).
    style.updateBackdropFrames(for: CGRect(origin: .zero, size: currentSize))
    guard !currentSize.equalTo(_lastBoundsSize) else { return }
    _lastBoundsSize = currentSize
    invalidateDrawFlags()
    #if DEBUG
   // if !(superview is MasonElement) {
      node.mason.printTree(node)
   // }
    #endif

    // Optimize compositing: set isOpaque for solid opaque backgrounds
    style.mBorderRender.resolve(for: bounds)
    guard let bg = style.mBackground else {return}
    let hasOpaqueBackground = bg.color != nil && (bg.color!.cgColor.alpha >= 1.0) && bg.layers.isEmpty
    let hasBoxShadow = !style.boxShadows.isEmpty

    if hasOpaqueBackground && !style.mBorderRender.hasRadii() && !hasBoxShadow {
      isOpaque = true
    } else {
      isOpaque = false
    }

    // Never rasterize: it flattens the sublayer subtree into an offscreen bitmap
    // that gets resampled when composited, softening child text. draw(_:) already
    // clips the gradient background to the rounded border path, so corners stay
    // clean without it.
    layer.shouldRasterize = false
    // Re-apply transform after layout changes
    style.applyTransformFromBuffer()
  }

  public override func willMove(toWindow newWindow: UIWindow?) {
    super.willMove(toWindow: newWindow)
    if newWindow == nil { _stopScrollDeceleration() }
  }

  public override func willMove(toSuperview newSuperview: UIView?) {
    super.willMove(toSuperview: newSuperview)
    // On detach, remove our outset-shadow layer while the old superview (which
    // owns it) is still current, else it's orphaned.
    if newSuperview == nil {
      style.removeShadowLayer()
    }
  }

  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    isOpaque = false
    setComputeCache(.init(width: -2, height: -2))
    computeCacheDirty = false
    node.view = self
    style.setStyleChangeListener(listener: self)
    // Scroll pan gesture: delegate gates begin on scrollability and allows
    // simultaneous recognition with parent gestures.
    let d = _MasonScrollPanDelegate()
    d.owner = self
    _scrollGestureDelegate = d
    _scrollPanGesture.delegate = d
    addGestureRecognizer(_scrollPanGesture)
    // Redraw bg/border when bounds.origin shifts during scroll.
    contentMode = .redraw
  }


  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  
  @objc public static func createGridView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Grid
    }
    return view
  }
  
  @objc public static func createFlexView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Flex
    }
    return view
  }
  
  @objc public static func createBlockView(_ mason: NSCMason) -> MasonUIView{
    let view = MasonUIView(mason: mason)
    view.configure { style in
      style.display = .Block
    }
    return view
  }
  
  
  public func addView(_ view: UIView){
    if(view.superview == self){
      return
    }
    if(view is MasonElement){
      append((view as! MasonElement))
    }else {
      append(node: mason.nodeForView(view))
    }
  }
  
  public func addView(_ view: UIView, at: Int){
    if(view.superview == self){
      return
    }
    //    if(at <= -1){
    //      addSubview(view)
    //    }else {
    //      insertSubview(view, at: at)
    //    }
    
    
    if(view is MasonElement){
      node.addChildAt((view as! MasonElement).node, at)
    }else {
      node.addChildAt(mason.nodeForView(view), at)
    }
  }

  // Inverse of addView: node.removeChild detaches the subview, removes the
  // Rust node, and invalidates layout, avoiding a stale layout slot + ghost.
  public func removeView(_ view: UIView) {
    let childNode = (view as? MasonElement)?.node ?? mason.nodeForView(view)
    _ = node.removeChild(childNode)
  }

  public func removeView(at index: Int) {
    _ = node.removeChildAt(index: index)
  }


  @objc public func addSubviews(_ views: [UIView]){
    addSubviews(views, at: -1)
  }
  
  @objc public func addSubviews(_ views: [UIView], at index: Int){
    views.enumerated().forEach { seq in
      if (index < 0) {
        addSubview(seq.element)
      } else {
        insertSubview(seq.element, at: index + seq.offset)
      }
    }
  }
  
  @objc public var inBatch: Bool {
    get{
      return node.inBatch
    }
    
    set(value) {
      node.inBatch = value
    }
  }
  
  func checkAndUpdateStyle() {
    if (!node.inBatch) {
      node.style.updateNativeStyle()
      // Trigger a layout pass for style-only changes (e.g. overflowY) that don't
      // resize the view and so wouldn't otherwise cause layoutSubviews.
      setNeedsLayout()
    }
  }
  
  @objc public var background: String {
    get{
      return style.background
    }
    set(value) {
      style.background = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var display: Display {
    get{
      return style.display
    }
    set(value) {
      style.display = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var _position: Position {
    get{
      return style.position
    }
    set(value) {
      style.position = value
      checkAndUpdateStyle()
    }
  }
  
  
  // TODO
  @objc public var direction: Direction {
    get{
      return style.direction
    }
    set(value) {
      style.direction = value
    }
  }
  
  
  @objc public var flexDirection: FlexDirection {
    get{
      return style.flexDirection
    }
    set(value) {
      style.flexDirection = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var flexWrap: FlexWrap {
    get{
      return style.flexWrap
    }
    set(value) {
      style.flexWrap = value
      checkAndUpdateStyle()
    }
  }
  
  
  //    @objc public var overflow: Overflow {
  //        get{
  //            return style.overflow
  //        }
  //        set(value) {
  //            style.overflow = value
  //            checkAndUpdateStyle()
  //        }
  //    }
  
  
  @objc public var overflowX: Overflow {
    get{
      return style.overflowX
    }
    set(value) {
      style.overflowX = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var overflowY: Overflow {
    get{
      return style.overflowY
    }
    set(value) {
      style.overflowY = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var alignItems: AlignItems{
    get{
      return style.alignItems
    }
    set(value) {
      style.alignItems = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var alignSelf: AlignSelf {
    get {
      return style.alignSelf
    }
    set(value) {
      style.alignSelf = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var alignContent: AlignContent {
    get{
      return style.alignContent
    }
    set(value) {
      style.alignContent = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var justifyItems: JustifyItems {
    get{
      return style.justifyItems
    }
    set(value) {
      style.justifyItems = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var justifySelf: JustifySelf {
    get{
      return style.justifySelf
    }
    set(value) {
      style.justifySelf = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var justifyContent: JustifyContent{
    get{
      return style.justifyContent
    }
    set(value) {
      style.justifyContent = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var flexGrow: Float {
    get{
      return style.flexGrow
    }
    set(value) {
      style.flexGrow = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var flexShrink: Float {
    get{
      return style.flexShrink
    }
    set(value) {
      style.flexShrink = value
      checkAndUpdateStyle()
    }
  }
  
  
  
  public var scrollBarWidth: MasonDimension {
    get {
      return style.scrollBarWidth
    }
    set(value) {
      style.scrollBarWidth = value
      checkAndUpdateStyle()
    }
  }
  
  func setScrollBarWidth(value: Float) {
    style.setScrollBarWidth(value);
    checkAndUpdateStyle()
  }
  
  @objc public var scrollBarWidthCompat: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: style.scrollBarWidth)
    }
    set(value) {
      style.scrollBarWidth = value.dimension
      checkAndUpdateStyle()
    }
  }
  
  func setFlexBasis(value: Float, type: Int) {
    style.setFlexBasis(value, type)
    checkAndUpdateStyle()
  }
  
  public var flexBasis: MasonDimension {
    get {
      return style.flexBasis
    }
    set(value) {
      style.flexBasis = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public var flexBasisCompat: MasonDimensionCompat {
    get {
      return MasonDimensionCompat(value: style.flexBasis)
    }
    set(value) {
      style.flexBasis = value.dimension
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var aspectRatio: Float{
    get{
      return style.aspectRatio ?? Float.nan
    }
    set(value) {
      style.aspectRatio = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridArea: String {
    get {
      return style.gridArea
    }
    set(value) {
      style.gridArea = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridTemplateAreas: String {
    get {
      return style.gridTemplateAreas
    }
    set(value) {
      style.gridTemplateAreas = value
      checkAndUpdateStyle()
    }
  }
  
  
  
  @objc public var gridAutoRows: String {
    get {
      return style.gridAutoRows
    }
    set(value) {
      style.gridAutoRows = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridAutoColumns: String{
    get{
      return style.gridAutoColumns
    }
    set(value) {
      style.gridAutoColumns = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridAutoFlow: GridAutoFlow{
    get{
      return style.gridAutoFlow
    }
    set(value) {
      style.gridAutoFlow = value
      checkAndUpdateStyle()
    }
  }
  
  
  public var gridColumn: String{
    get{
      return style.gridColumn
    }
    set(value) {
      style.gridColumn = value
      checkAndUpdateStyle()
    }
  }
  
  public var gridColumnStart: String {
    get {
      return style.gridColumnStart
    }
    
    set {
      style.gridColumnStart = newValue
    }
  }
  
  public var gridColumnEnd: String {
    get {
      return style.gridColumnEnd
    }
    
    set {
      style.gridColumnEnd = newValue
    }
  }
  
  
  public var gridRow: String{
    get{
      return style.gridRow
    }
    set(value) {
      style.gridRow = value
      checkAndUpdateStyle()
    }
  }
  
  public var gridRowStart: String {
    get {
      return style.gridRowStart
    }
    
    set {
      style.gridRowStart = newValue
    }
  }
  
  public var gridRowEnd: String {
    get {
      return style.gridRowEnd
    }
    
    set {
      style.gridRowEnd = newValue
    }
  }
  
  
  @objc public var gridTemplateRows: String {
    get{
      return style.gridTemplateRows
    }
    set(value) {
      style.gridTemplateRows = value
      checkAndUpdateStyle()
    }
  }
  
  
  @objc public var gridTemplateColumns: String {
    get{
      return style.gridTemplateColumns
    }
    set(value) {
      style.gridTemplateColumns = value
      checkAndUpdateStyle()
    }
  }
  
  @objc public func setPadding(_ left: Float,_ top:Float, _ right: Float,_ bottom: Float) {
    node.style.padding = MasonRect(
      MasonLengthPercentage.Points(top),
      MasonLengthPercentage.Points(right),
      MasonLengthPercentage.Points(bottom),
      MasonLengthPercentage.Points(left)
    )
  }
  
  @objc public func getPadding() -> MasonLengthPercentageRectCompat{
    return node.style.paddingCompat
  }
  
  @objc public func setPaddingLeft(_ left: Float, _ type: Int) {
    node.style.setPaddingLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingRight(_ right: Float, _ type: Int) {
    node.style.setPaddingRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingTop(_ top: Float, _ type: Int) {
    node.style.setPaddingTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setPaddingBottom(_ bottom: Float, _ type: Int) {
    node.style.setPaddingBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getPaddingLeft() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.left
  }
  
  @objc public func getPaddingRight() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.right
  }
  
  @objc public func getPaddingTop() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.top
  }
  
  
  @objc public func getPaddingBottom() -> MasonLengthPercentageCompat {
    return node.style.paddingCompat.bottom
  }
  
  @objc public func setBorderWidth(_ left: Float,_ top: Float,_ right: Float, _ bottom: Float) {
    style.borderWidth = MasonRect(
      MasonLengthPercentage.Points(top),
      MasonLengthPercentage.Points(right),
      MasonLengthPercentage.Points(bottom),
      MasonLengthPercentage.Points(left)
    )
  }
  
  @objc public func getBorderWidth() -> MasonLengthPercentageRectCompat{
    return node.style.borderWidthCompat
  }
  
  @objc public func setBorderLeftWidth(_ left: Float, _ type: Int) {
    node.style.setBorderLeftWidth(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderRightWidth(_ right: Float, _ type: Int) {
    node.style.setBorderRightWidth(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderTopWidth(_ top: Float, _ type: Int) {
    node.style.setBorderTopWidth(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setBorderBottomWidth(_ bottom: Float, _ type: Int) {
    node.style.setBorderBottomWidth(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getBorderLeft() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.left
  }
  
  @objc public func getBorderRight() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.right
  }
  
  @objc public func getBorderBottom() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.bottom
  }
  
  @objc public func getBorderTop() -> MasonLengthPercentageCompat {
    return node.style.borderWidthCompat.top
  }
  
  @objc public func setMargin(_ left: Float, _ top: Float,_ right: Float,_ bottom: Float) {
    node.style.margin = MasonRect(
      MasonLengthPercentageAuto.Points(top),
      MasonLengthPercentageAuto.Points(right),
      MasonLengthPercentageAuto.Points(bottom),
      MasonLengthPercentageAuto.Points(left)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMargin() -> MasonLengthPercentageAutoRectCompat{
    return node.style.marginCompat
  }
  
  @objc public func setMarginLeft(_ left: Float, _ type: Int) {
    node.style.setMarginLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginRight(_ right: Float, _ type: Int) {
    node.style.setMarginRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginTop(_ top: Float, _ type: Int) {
    node.style.setMarginTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMarginBottom(_ bottom: Float, _ type: Int) {
    node.style.setMarginBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getMarginLeft() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.left
  }
  
  @objc public func getMarginRight() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.right
  }
  
  @objc public func getMarginTop() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.top
  }
  
  @objc public func getMarginBottom() -> MasonLengthPercentageAutoCompat {
    return node.style.marginCompat.bottom
  }
  
  @objc public func setInset(_ left: Float,_  top: Float, _ right: Float,_  bottom: Float) {
    node.style.inset = MasonRect(
      MasonLengthPercentageAuto.Points(top),
      MasonLengthPercentageAuto.Points(right),
      MasonLengthPercentageAuto.Points(bottom),
      MasonLengthPercentageAuto.Points(left)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getInset() -> MasonLengthPercentageAutoRectCompat{
    return node.style.insetCompat
  }
  
  @objc public func setInsetLeft(_ left: Float,_  type: Int) {
    node.style.setInsetLeft(left, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetRight(_ right: Float,_  type: Int) {
    node.style.setInsetRight(right, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetTop(_ top: Float,_  type: Int) {
    node.style.setInsetTop(top, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setInsetBottom(_ bottom: Float,_  type: Int) {
    node.style.setInsetBottom(bottom, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getInsetLeft() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.left
  }
  
  @objc public func getInsetRight() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.right
  }
  
  @objc public func getInsetTop() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.top
  }
  
  @objc public func getInsetBottom() -> MasonLengthPercentageAutoCompat {
    return node.style.insetCompat.bottom
  }
  
  @objc public func setMinSize(_ width: Float,_ height: Float) {
    node.style.minSize = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMinSize() -> MasonDimensionSizeCompat{
    return node.style.minSizeCompat
  }
  
  @objc public func setMinSizeWidth(_ width: Float,_ type: Int) {
    node.style.setMinSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMinSizeHeight(_ height: Float,_ type: Int) {
    node.style.setMinSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  
  @objc public func getMinSizeWidth() -> MasonDimensionCompat{
    return node.style.minSizeCompat.width
  }
  
  @objc public func getMinSizeHeight() -> MasonDimensionCompat{
    return node.style.minSizeCompat.height
  }
  
  @objc public func setSize(_ width: Float,_  height: Float) {
    node.style.size = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func setSizeWidth(_ width: Float,_ type: Int) {
    node.style.setSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setSizeHeight(_ height: Float,_ type: Int) {
    node.style.setSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getSize() -> MasonDimensionSizeCompat{
    return node.style.sizeCompat
  }
  
  @objc public func getSizeWidth() -> MasonDimensionCompat{
    return node.style.sizeCompat.width
  }
  
  @objc public func getSizeHeight() -> MasonDimensionCompat{
    return node.style.sizeCompat.height
  }
  
  @objc public func setMaxSize(_ width: Float, _ height: Float) {
    node.style.maxSize = MasonSize(
      MasonDimension.Points(width),
      MasonDimension.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getMaxSize() -> MasonDimensionSizeCompat{
    return node.style.maxSizeCompat
  }
  
  @objc public func setMaxSizeWidth(_ width: Float,_ type: Int) {
    node.style.setMaxSizeWidth(width, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setMaxSizeHeight(_ height: Float,_ type: Int) {
    node.style.setMaxSizeHeight(height, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getMaxSizeWidth() -> MasonDimensionCompat{
    return node.style.minSizeCompat.width
  }
  
  @objc public func getMaxSizeHeight() -> MasonDimensionCompat{
    return node.style.minSizeCompat.height
  }
  
  @objc public func setGap(_ width: Float,_ height: Float) {
    node.style.gap = MasonSize(
      MasonLengthPercentage.Points(width),
      MasonLengthPercentage.Points(height)
    )
    checkAndUpdateStyle()
  }
  
  @objc public func setGapWithWidthHeightType(_ width: Float , _ width_type: Int8,_ height: Float, _ height_type: Int8) {
    guard let width = MasonLengthPercentage.fromValueType(width, Int(width_type)) else {return}
    guard let height = MasonLengthPercentage.fromValueType(height, Int(height_type)) else {return}
    node.style.gap = MasonSize(
      width,
      height
    )
    checkAndUpdateStyle()
  }
  
  @objc public func getGap() -> MasonLengthPercentageSizeCompat{
    return node.style.gapCompat
  }
  
  @objc public func setRowGap(_ row: Float,_ type: Int) {
    node.style.setRowGap(row, type)
    checkAndUpdateStyle()
  }
  
  @objc public func setColumnGap(_ column: Float,_ type: Int) {
    node.style.setColumnGap(column, type)
    checkAndUpdateStyle()
  }
  
  @objc public func getRowGap() -> MasonLengthPercentageCompat{
    return node.style.gapCompat.width
  }
  
  @objc public func getColumnGap() -> MasonLengthPercentageCompat{
    return node.style.gapCompat.height
  }
}

// MARK: - Scroll implementation
extension MasonUIView {

  var _canScrollH: Bool {
    switch node.style.overflow.x {
    case .Scroll: return true
    case .Auto:    return contentSize.width > bounds.width
    default:       return false
    }
  }

  var _canScrollV: Bool {
    switch node.style.overflow.y {
    case .Scroll: return true
    case .Auto:    return contentSize.height > bounds.height
    case .Visible: return isScrollContainer && contentSize.height > bounds.height
    default:       return false
    }
  }

  private func _clampScrollOffset(_ offset: CGPoint) -> CGPoint {
    CGPoint(
      x: _canScrollH ? max(0, min(offset.x, max(0, contentSize.width  - bounds.width))) : 0,
      y: _canScrollV ? max(0, min(offset.y, max(0, contentSize.height - bounds.height))) : 0
    )
  }

  // MARK: Rubber-banding
  // UIScrollView-style resistance curve; `dim` is the viewport size along the axis.
  private func _rubber(_ distance: CGFloat, _ dim: CGFloat) -> CGFloat {
    let c: CGFloat = 0.55
    let d = max(dim, 1)
    return (1 - 1 / (distance * c / d + 1)) * d
  }

  private func _rubberAxis(_ v: CGFloat, _ lo: CGFloat, _ hi: CGFloat, _ dim: CGFloat) -> CGFloat {
    if v < lo { return lo - _rubber(lo - v, dim) }
    if v > hi { return hi + _rubber(v - hi, dim) }
    return v
  }

  private func _rubberBanded(_ o: CGPoint) -> CGPoint {
    let hiX = max(0, contentSize.width - bounds.width)
    let hiY = max(0, contentSize.height - bounds.height)
    return CGPoint(
      x: _canScrollH ? _rubberAxis(o.x, 0, hiX, bounds.width) : 0,
      y: _canScrollV ? _rubberAxis(o.y, 0, hiY, bounds.height) : 0
    )
  }

  // Reposition the layer mask to track bounds.origin without recreating a CGPath.
  func _updateScrollMask() {
    guard let maskLayer = layer.mask else { return }
   /* let o = bounds.origin
    let w = bounds.size.width
    let h = bounds.size.height
    let overflowPad: CGFloat = 10000
    let overflow = node.style.overflow
    let clipX = overflow.x == .Scroll || overflow.x == .Hidden || overflow.x == .Clip || overflow.x == .Auto
    let clipY = overflow.y == .Scroll || overflow.y == .Hidden || overflow.y == .Clip || overflow.y == .Auto
    // Reuse the existing layer size; only reposition it to follow the scroll offset.
    // For a two-axis clip the mask is exactly the viewport; for single-axis it extends
    // by overflowPad on the unconstrained side — set that as the layer's frame.
    if clipX && clipY {
      maskLayer.frame = CGRect(origin: o, size: bounds.size)
    } else if clipX {
      maskLayer.frame = CGRect(x: o.x, y: o.y - overflowPad, width: w, height: h + overflowPad * 2)
    } else {
      maskLayer.frame = CGRect(x: o.x - overflowPad, y: o.y, width: w + overflowPad * 2, height: h)
    }
    
    */
    
    let overflow = node.style.overflow

    let clipX = overflow.x == .Scroll || overflow.x == .Hidden || overflow.x == .Clip || overflow.x == .Auto
    let clipY = overflow.y == .Scroll || overflow.y == .Hidden || overflow.y == .Clip || overflow.y == .Auto

    guard clipX || clipY else {
      layer.mask = nil
      return
    }
    
  
    maskLayer.frame = bounds
  
  }

  // MARK: Pan handler

  @objc func _handleScrollPan(_ gesture: UIPanGestureRecognizer) {
    switch gesture.state {
    case .began:
      _isScrolling = true
      _stopScrollDeceleration()
      _scrollPanStartOffset = contentOffset

    case .changed:
      let t = gesture.translation(in: self)
      let raw = CGPoint(
        x: _scrollPanStartOffset.x - (_canScrollH ? t.x : 0),
        y: _scrollPanStartOffset.y - (_canScrollV ? t.y : 0)
      )
      _setScrollOrigin(_rubberBanded(raw))

    case .ended, .cancelled:
      let v = gesture.velocity(in: self)
      _startScrollDeceleration(CGPoint(
        x: _canScrollH ? -v.x : 0,
        y: _canScrollV ? -v.y : 0
      ))

    default: break
    }
  }

  // MARK: Deceleration

  private func _startScrollDeceleration(_ velocity: CGPoint) {
    // Start when there's momentum to decay or we're overscrolled and must spring back.
    let overscrolled = contentOffset != _clampScrollOffset(contentOffset)
    guard hypot(velocity.x, velocity.y) > 1 || overscrolled else {
      _isScrolling = false
      return
    }
    _scrollDecelerationLink?.invalidate()
    _scrollDecelerationVelocity = velocity
    _isScrolling = true
    let link = CADisplayLink(target: self, selector: #selector(_scrollDecelerationStep))
    link.add(to: .main, forMode: .common)
    _scrollDecelerationLink = link
  }

  private func _stopScrollDeceleration() {
    _scrollDecelerationLink?.invalidate()
    _scrollDecelerationLink = nil
    _scrollDecelerationVelocity = .zero
    _isScrolling = false
  }

  // Advance one axis: momentum decay in-bounds, spring-back when overscrolled.
  // Returns (offset, velocity, settled).
  private func _integrateScrollAxis(
    _ value: CGFloat, _ velocity: CGFloat, _ lo: CGFloat, _ hi: CGFloat, _ dt: CGFloat
  ) -> (CGFloat, CGFloat, Bool) {
    if value >= lo && value <= hi {
      let nv = velocity * _scrollDecelerationRate
      let nval = value + nv * dt
      // Settle only when slow and still in-bounds (else momentum bounces off the edge).
      if abs(nv) < 30, nval >= lo, nval <= hi { return (nval, nv, true) }
      return (nval, nv, false)
    }
    let target = value < lo ? lo : hi
    let stiffness: CGFloat = 280
    let damping = 2 * stiffness.squareRoot()   // critically damped — no oscillation
    let nv = velocity + (-stiffness * (value - target) - damping * velocity) * dt
    let nval = value + nv * dt
    if abs(nval - target) < 0.5, abs(nv) < 5 { return (target, 0, true) }
    return (nval, nv, false)
  }

  @objc func _scrollDecelerationStep() {
    let dt: CGFloat = 1.0 / 60.0
    let hiX = max(0, contentSize.width - bounds.width)
    let hiY = max(0, contentSize.height - bounds.height)
    var o = contentOffset
    var v = _scrollDecelerationVelocity
    var doneX = true
    var doneY = true
    if _canScrollH { (o.x, v.x, doneX) = _integrateScrollAxis(o.x, v.x, 0, hiX, dt) }
    if _canScrollV { (o.y, v.y, doneY) = _integrateScrollAxis(o.y, v.y, 0, hiY, dt) }
    _scrollDecelerationVelocity = v
    _setScrollOrigin(o)
    if doneX && doneY { _stopScrollDeceleration() }
  }
}

// MARK: - Private gesture delegate
// Separate class: UIView already exposes gestureRecognizerShouldBegin with the
// same ObjC selector, so conforming MasonUIView directly would conflict.
private final class _MasonScrollPanDelegate: NSObject, UIGestureRecognizerDelegate {
  weak var owner: MasonUIView?

  func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let v = owner else { return false }
    return v._canScrollH || v._canScrollV
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
  ) -> Bool { true }
}
