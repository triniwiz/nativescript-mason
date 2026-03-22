//
//  CSSBorderRenderer.swift
//  Mason
//
//  Created by Osei Fortune on 25/11/2025.
//

import UIKit

/// CSS-like border renderer that reads from a MasonStyle buffer.
public final class CSSBorderRenderer {
  
  public class BorderLayer: CALayer {
    var borderRenderer: CSSBorderRenderer?{
      didSet {
        setNeedsDisplay()
      }
    }
    
    public override func draw(in ctx: CGContext) {
      super.draw(in: ctx)
      guard let renderer = borderRenderer else { return }
      renderer.draw(in: ctx, rect: bounds)
    }
    
    
    public func invalidate() {
      setNeedsDisplay()
    }
    
    public override func layoutSublayers() {
      super.layoutSublayers()
      setNeedsDisplay()
    }
  }
  
  public enum BorderStyle: Equatable {
    case none
    case hidden
    case dotted(dot: CGFloat = 1, gap: CGFloat = 3)
    case dashed(dash: CGFloat = 6, gap: CGFloat = 6)
    case solid
    case double(spacing: CGFloat = 3)
    case groove
    case ridge
    case inset
    case outset
    
    public init?(rawValue: Int8) {
      switch rawValue {
      case 0:
        self = BorderStyle.none
      case 1:
        self = .hidden
      case 2:
        self = .dotted(dot: 1, gap: 3)
      case 3:
        self = .dashed(dash: 6, gap: 6)
      case 4:
        self = .solid
      case 5:
        self = .double(spacing: 3)
      case 6:
        self = .groove
      case 7:
        self = .ridge
      case 8:
        self = .inset
      default:
        return nil
      }
    }
    
    public var rawValue: Int8 {
      switch self {
      case .none:
        return 0
      case .hidden:
        return 1
      case .dotted(dot: _, gap: _):
        return 2
      case .dashed(dash: _, gap: _):
        return 3
      case .solid:
        return 4
      case .double(spacing: _):
        return 5
      case .groove:
        return 6
      case .ridge:
        return 7
      case .inset:
        return 8
      case .outset:
        return 9
      }
    }
    
    public init?(name: String){
      switch(name) {
      case "none":
        self = .none
      case "hidden":
        self = .hidden
      case "dotted":
        self = .dotted(dot: 1, gap: 3)
      case "dashed":
        self  = .dashed(dash: 6, gap: 6)
      case "solid":
        self = .solid
      case "double":
        self =  .double(spacing: 3)
      case "groove":
        self = .groove
      case "ridge":
        self = .ridge
      case "inset":
        self = .inset
      case "outset":
        self = .outset
      default:
        return nil
      }
    }
  }
  
  protocol IKey {
    var widthValue: Int { get }
    var widthType: Int { get }
    var style: Int { get }
    var color: Int { get }
    
    var corner1RadiusXType: Int { get }
    var corner1RadiusXValue: Int { get }
    var corner1RadiusYType: Int { get }
    var corner1RadiusYValue: Int { get }
    var corner1Exponent: Int { get }
    
    var corner2RadiusXType: Int { get }
    var corner2RadiusXValue: Int { get }
    var corner2RadiusYType: Int { get }
    var corner2RadiusYValue: Int { get }
    var corner2Exponent: Int { get }
  }
  
  
  class Keys {
    class Left: IKey {
      var widthValue: Int {
        return StyleKeys.BORDER_LEFT_VALUE
      }
      var widthType: Int {
        return StyleKeys.BORDER_LEFT_TYPE
      }
      var style: Int {
        StyleKeys.BORDER_LEFT_STYLE
      }
      var color: Int {
        return StyleKeys.BORDER_LEFT_COLOR
      }
      
      var corner1RadiusXType : Int {return StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE}
      var corner1RadiusXValue : Int {return StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE}
      var corner1RadiusYType : Int {return StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE}
      var corner1RadiusYValue : Int {return StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE}
      var corner1Exponent : Int {return StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT}
      
      var corner2RadiusXType : Int {return StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE}
      var corner2RadiusXValue : Int {return StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE}
      var corner2RadiusYType : Int {return StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE}
      var corner2RadiusYValue : Int {return StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE}
      var corner2Exponent : Int {return StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT}
      
      
    }
    
    struct Top : IKey {
      var widthValue :Int {
        StyleKeys.BORDER_TOP_VALUE }
      var widthType :Int {
        StyleKeys.BORDER_TOP_TYPE }
      var style :Int {
        StyleKeys.BORDER_TOP_STYLE }
      var color :Int {
        StyleKeys.BORDER_TOP_COLOR }
      
      var corner1RadiusXType : Int { StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE }
      var corner1RadiusXValue : Int { StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE }
      var corner1RadiusYType : Int { StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE }
      var corner1RadiusYValue : Int { StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE }
      var corner1Exponent : Int { StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT }
      
      var corner2RadiusXType : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE }
      var corner2RadiusXValue : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE }
      var corner2RadiusYType : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE }
      var corner2RadiusYValue : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE }
      var corner2Exponent : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT }
    }
    
    struct Right : IKey {
      var widthValue :Int {
        StyleKeys.BORDER_RIGHT_VALUE }
      var widthType :Int {
        StyleKeys.BORDER_RIGHT_TYPE }
      var style :Int {
        StyleKeys.BORDER_RIGHT_STYLE }
      var color :Int {
        StyleKeys.BORDER_RIGHT_COLOR }
      
      
      var corner1RadiusXType : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE }
      var corner1RadiusXValue : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE }
      var corner1RadiusYType : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE }
      var corner1RadiusYValue : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE }
      var corner1Exponent : Int { StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT }
      
      var corner2RadiusXType : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE }
      var corner2RadiusXValue : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE }
      var corner2RadiusYType : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE }
      var corner2RadiusYValue : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE }
      var corner2Exponent : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT }
    }
    
    struct Bottom : IKey {
      var widthValue :Int {
        StyleKeys.BORDER_BOTTOM_VALUE }
      var widthType :Int {
        StyleKeys.BORDER_BOTTOM_TYPE }
      var style :Int {
        StyleKeys.BORDER_BOTTOM_STYLE }
      var color :Int {
        StyleKeys.BORDER_BOTTOM_COLOR }
      
      var corner1RadiusXType : Int { StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE }
      var corner1RadiusXValue : Int { StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE }
      var corner1RadiusYType : Int { StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE }
      var corner1RadiusYValue : Int { StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE }
      var corner1Exponent : Int { StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT }
      
      var corner2RadiusXType : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE }
      var corner2RadiusXValue : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE }
      var corner2RadiusYType : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE }
      var corner2RadiusYValue : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE }
      var corner2Exponent : Int { StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT }
    }
    
    static let left = Keys.Left()
    static let top = Keys.Top()
    static let right = Keys.Right()
    static let bottom = Keys.Bottom()
  }
  
  public class BorderSide: CustomStringConvertible {

    public var description: String {
      return "BorderSide{ side: \(side),  width: \(width), color: \(color), style: \(style) }"
    }

    unowned let owner: MasonStyle
    public var width: MasonLengthPercentage {
      get {
        return MasonLengthPercentage.fromValueType(owner.getFloat(keys.widthValue), Int(owner.getInt8(keys.widthType)))!
      }
      
      set {
        owner.prepareMut()
        owner.setInt8(keys.widthType, newValue.type)
        owner.setFloat(keys.widthValue, newValue.value)
      }
    }
    
    public func setColor(color: UInt32){
      owner.prepareMut()
      owner.setUInt32(keys.color, color)
    }
    
    public var color: UIColor{
      get {
        let base = owner.getUInt32(keys.color)
        let resolved = owner.resolvePseudoUInt32(keys.color, keys.color, base, .borderColor)
        return UIColor.colorFromARGB(resolved)
      }
      
      set {
        owner.prepareMut()
        owner.setUInt32(keys.color, newValue.toUInt32())
      }
    }
    public var style: BorderStyle{
      get {
        return BorderStyle(rawValue: owner.getInt8(keys.style))!
      }
      
      set {
        owner.prepareMut()
        owner.setInt8(keys.style, newValue.rawValue)
      }
    }
    
    internal let side: Side
    internal let keys: any IKey
    
    public init(style: MasonStyle, side sideType : Side) {
      self.owner = style
      self.side = sideType
      switch(sideType){case .top:
        keys = Keys.top
      case .right:
        keys = Keys.right
      case .bottom:
        keys = Keys.bottom
      case .left:
        keys = Keys.left
      }
    }
  }
  
  public struct CornerRadius: Equatable {
    public var horizontal: MasonLengthPercentage
    public var vertical: MasonLengthPercentage
    public var exponent: CGFloat
    
    init(horizontal: MasonLengthPercentage, vertical: MasonLengthPercentage, exponent: CGFloat) {
      self.horizontal = horizontal
      self.vertical = vertical
      self.exponent = exponent
    }
    
    public static var zero: CornerRadius {
      CornerRadius(horizontal: .Zero, vertical: .Zero, exponent: 1)
    }
    
    func resolved(rect: CGRect) -> (x: CGFloat, y: CGFloat) {
      let x = horizontal.resolve(relativeTo: Float(rect.width))
      let y = vertical.resolve(relativeTo: Float(rect.height))
      return (CGFloat(x), CGFloat(y))
    }
  }
  
  public struct BorderRadius {
    public var topLeft: CornerRadius
    public var topRight: CornerRadius
    public var bottomRight: CornerRadius
    public var bottomLeft: CornerRadius
    
    public static var zero: BorderRadius {
      BorderRadius(
        topLeft: .zero,
        topRight: .zero,
        bottomRight: .zero,
        bottomLeft: .zero
      )
    }
    
    func resolved(rect: CGRect) -> BorderRadius {
      return BorderRadius(
        topLeft: topLeft,
        topRight: topRight,
        bottomRight: bottomRight,
        bottomLeft: bottomLeft
      )
    }
  }
  
  // MARK: - public state
  
  public var top: BorderSide
  public var right: BorderSide
  public var bottom: BorderSide
  public var left: BorderSide
  
  public var radius: BorderRadius
  
  unowned var style: MasonStyle
  
  // Cache
  private var lastHash: Int = 0
  private var cachedResolvedRect: CGRect = .zero
  private var cachedRadius: BorderRadius = .zero
  internal var cachedWidths: (top: CGFloat, right: CGFloat, bottom: CGFloat, left: CGFloat) = (0,0,0,0)
  internal var css: String = ""

  // Clip path cache — avoids UIBezierPath allocation every frame
  private var cachedClipPath: UIBezierPath?
  private var cachedClipRect: CGRect = .zero
  private var cachedClipRadius: BorderRadius = .zero
  private var clipPathDirty: Bool = true
  public init(style: MasonStyle) {
    self.style = style
    self.top = BorderSide(style: style, side: .top)
    self.right = BorderSide(style: style, side: .right)
    self.bottom = BorderSide(style: style, side: .bottom)
    self.left = BorderSide(style: style, side: .left)
    self.radius = BorderRadius.zero
  }
  
  public func hasRadii() -> Bool {
    return radius.topLeft != .zero || radius.topRight != .zero ||
           radius.bottomRight != .zero || radius.bottomLeft != .zero
  }

  /// Returns a cached clip path for the given rect and inner radius, avoiding UIBezierPath allocation every frame.
  public func getClipPath(rect: CGRect, radius: BorderRadius) -> UIBezierPath {
    if !clipPathDirty, let cached = cachedClipPath, cachedClipRect == rect {
      return cached
    }
    let path = buildRoundedPath(in: rect, radius: radius)
    cachedClipPath = path
    cachedClipRect = rect
    clipPathDirty = false
    return path
  }

  public func invalidateCache() {
    lastHash = 0
    clipPathDirty = true
    cachedClipPath = nil
  }

  internal func resetAllBorders(){
    top.color = .clear
    top.width = .Zero
    top.style = .none
    
    right.color = .clear
    right.width = .Zero
    right.style = .none
    
    bottom.color = .clear
    bottom.width = .Zero
    bottom.style = .none
    
    left.color = .clear
    left.width = .Zero
    left.style = .none
    
    css = ""
    
  }
  
  // MARK: - resolve
  
  internal func resolve(for rect: CGRect) {
    let hash = style.hashValue ^ Int(rect.width) ^ Int(rect.height)
    if hash == lastHash && cachedResolvedRect == rect {
      return
    }

    cachedResolvedRect = rect
    lastHash = hash
    clipPathDirty = true
    
    cachedWidths = (
      top: CGFloat(top.width.resolve(relativeTo: Float(rect.width))),
      right: CGFloat(right.width.resolve(relativeTo: Float(rect.width))),
      bottom: CGFloat(bottom.width.resolve(relativeTo: Float(rect.width))),
      left: CGFloat(left.width.resolve(relativeTo: Float(rect.width)))
    )
    
    cachedRadius = resolveRadius(rect: rect)
  }
  
  private func resolveRadius(rect: CGRect) -> BorderRadius {
    // Fetch corner radii from style buffer
    func corner(xType: Int, xValue: Int, yType: Int, yValue: Int, exp: Int) -> CornerRadius {
      let h = MasonLengthPercentage.fromValueType(style.getFloat(xValue), Int(style.getInt8(xType))) ?? .Zero
      let v = MasonLengthPercentage.fromValueType(style.getFloat(yValue), Int(style.getInt8(yType))) ?? .Zero
      let exponent = CGFloat(style.getFloat(exp))
      return CornerRadius(horizontal: h, vertical: v, exponent: exponent)
    }
    
    return BorderRadius(
      topLeft: corner(
        xType: StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE,
        xValue: StyleKeys.BORDER_RADIUS_TOP_LEFT_X_VALUE,
        yType: StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE,
        yValue: StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_VALUE,
        exp: StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT
      ),
      topRight: corner(
        xType: StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE,
        xValue: StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_VALUE,
        yType: StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE,
        yValue: StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_VALUE,
        exp: StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT
      ),
      bottomRight: corner(
        xType: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE,
        xValue: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE,
        yType: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE,
        yValue: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE,
        exp: StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT
      ),
      bottomLeft: corner(
        xType: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE,
        xValue: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_VALUE,
        yType: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE,
        yValue: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE,
        exp: StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT
      )
    )
  }
  
  // MARK: - draw
  
  public func draw(in ctx: CGContext, rect: CGRect) {
    resolve(for: rect)

    // Early bail — skip if all sides are invisible
    let topVisible = cachedWidths.top > 0 && top.style != .none && top.color.cgColor.alpha > 0
    let rightVisible = cachedWidths.right > 0 && right.style != .none && right.color.cgColor.alpha > 0
    let bottomVisible = cachedWidths.bottom > 0 && bottom.style != .none && bottom.color.cgColor.alpha > 0
    let leftVisible = cachedWidths.left > 0 && left.style != .none && left.color.cgColor.alpha > 0
    
    guard topVisible || rightVisible || bottomVisible || leftVisible else { return }

    ctx.saveGState()
    ctx.setAllowsAntialiasing(true)
    ctx.setShouldAntialias(true)

    let outerPath = buildRoundedPath(in: rect, radius: radius)

    // Uniform border fast path — single drawPath when all visible sides share color/style/width
    if topVisible && rightVisible && bottomVisible && leftVisible,
       cachedWidths.top == cachedWidths.right &&
       cachedWidths.right == cachedWidths.bottom &&
       cachedWidths.bottom == cachedWidths.left,
       top.style == right.style && right.style == bottom.style && bottom.style == left.style,
       top.color == right.color && right.color == bottom.color && bottom.color == left.color,
       top.style == .solid {
      let halfWidth = cachedWidths.top / 2.0
      let inset = UIEdgeInsets(top: halfWidth, left: halfWidth, bottom: halfWidth, right: halfWidth)
      let insetRect = rect.inset(by: inset)
      let insetRadius = radius.insetByBorderWidths((halfWidth, halfWidth, halfWidth, halfWidth))
      let strokePath = buildRoundedPath(in: insetRect, radius: insetRadius)
      ctx.setStrokeColor(top.color.cgColor)
      ctx.setLineWidth(cachedWidths.top)
      ctx.addPath(strokePath.cgPath)
      ctx.strokePath()
    } else {
      paintSide(.top, ctx: ctx, rect: rect, width: cachedWidths.top, side: top, outerPath: outerPath)
      paintSide(.right, ctx: ctx, rect: rect, width: cachedWidths.right, side: right, outerPath: outerPath)
      paintSide(.bottom, ctx: ctx, rect: rect, width: cachedWidths.bottom, side: bottom, outerPath: outerPath)
      paintSide(.left, ctx: ctx, rect: rect, width: cachedWidths.left, side: left, outerPath: outerPath)
    }

    ctx.restoreGState()
  }
  
  // MARK: - Helpers
  
  public enum Side { case top, right, bottom, left }
  
  private func drawGroove(_ ctx: CGContext, _ band: CGRect, _ color: UIColor, _ width: CGFloat) {
    let half = width/2
    let dark = color.darker()
    let light = color.lighter()
    
    let topLeft = CGRect(x: band.minX, y: band.minY, width: band.width, height: half)
    let bottomRight = CGRect(x: band.minX, y: band.minY + half, width: band.width, height: half)
    
    ctx.setFillColor(dark.cgColor)
    ctx.fill(topLeft)
    
    ctx.setFillColor(light.cgColor)
    ctx.fill(bottomRight)
  }
  
  
  private func drawRidge(_ ctx: CGContext, _ band: CGRect, _ color: UIColor, _ width: CGFloat) {
    let half = width/2
    let dark = color.darker()
    let light = color.lighter()
    
    let topLeft = CGRect(x: band.minX, y: band.minY, width: band.width, height: half)
    let bottomRight = CGRect(x: band.minX, y: band.minY + half, width: band.width, height: half)
    
    ctx.setFillColor(light.cgColor)
    ctx.fill(topLeft)
    
    ctx.setFillColor(dark.cgColor)
    ctx.fill(bottomRight)
  }
  
  
  
  private func drawInset(_ ctx: CGContext, _ band: CGRect, _ color: UIColor, _ width: CGFloat) {
    let dark = color.darker(by: 0.35)
    ctx.setFillColor(dark.cgColor)
    ctx.fill(band)
  }
  
  
  private func drawOutset(_ ctx: CGContext, _ band: CGRect, _ color: UIColor, _ width: CGFloat) {
    let light = color.lighter(by: 0.35)
    ctx.setFillColor(light.cgColor)
    ctx.fill(band)
  }
  
  
  // MARK: - Double border drawing + helpers

  private func drawDoubleBorder(_ ctx: CGContext,
                                sideEdge: Side,
                                rect: CGRect,
                                totalWidth: CGFloat,
                                side: BorderSide,
                                outerRadius: BorderRadius) {
    // Per CSS, if too thin render as solid
    guard totalWidth >= 3.0 else {
      // fallback to solid fill
      drawSolidBand(ctx, edge: sideEdge, rect: rect, color: side.color, width: totalWidth, outerPath: buildRoundedPath(in: rect, radius: outerRadius))
      return
    }

    // canonical split: outer line, gap, inner line -> roughly 1/3 each
    let line = totalWidth / 3.0       // each painted line thickness
    let gap  = totalWidth / 3.0       // central gap

    // Outer stroke path — inset half stroke so stroking centers on desired edge
    // We'll stroke paths rather than filling bands to respect corner radii
    // Compute insets for outer and inner stroking paths
    let outerInset = insetForSide(sideEdge, amount: line / 2.0)
    let innerCenterOffset = line + gap
    let innerInset = insetForSide(sideEdge, amount: innerCenterOffset + line / 2.0)

    // Outer path: inset rect by outerInset
    let outerRect = rect.inset(by: outerInset)
    let outerR = outerRadius.inset(by: outerInset)    // inset radii appropriately
    let outerPath = buildRoundedPath(in: outerRect, radius: outerR)

    ctx.saveGState()
    ctx.addPath(outerPath.cgPath)
    ctx.setStrokeColor(side.color.cgColor)
    ctx.setLineWidth(line)
    ctx.setLineCap(.butt)
    ctx.strokePath()
    ctx.restoreGState()

    // Inner path: inset rect by innerInset
    let innerRect = rect.inset(by: innerInset)
    let innerR = outerRadius.inset(by: innerInset)
    let innerPath = buildRoundedPath(in: innerRect, radius: innerR)

    ctx.saveGState()
    ctx.addPath(innerPath.cgPath)
    ctx.setStrokeColor(side.color.cgColor)
    ctx.setLineWidth(line)
    ctx.setLineCap(.butt)
    ctx.strokePath()
    ctx.restoreGState()
  }

  private func drawSolidBand(_ ctx: CGContext, edge: Side, rect: CGRect, color: UIColor, width: CGFloat, outerPath: UIBezierPath) {
    // simple band fill used as fallback / helper
    ctx.saveGState()
    ctx.addPath(outerPath.cgPath)
    ctx.clip()
    var band: CGRect
    switch edge {
    case .top:
      band = CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: width)
    case .right:
      band = CGRect(x: rect.maxX - width, y: rect.minY, width: width, height: rect.height)
    case .bottom:
      band = CGRect(x: rect.minX, y: rect.maxY - width, width: rect.width, height: width)
    case .left:
      band = CGRect(x: rect.minX, y: rect.minY, width: width, height: rect.height)
    }
    ctx.setFillColor(color.cgColor)
    ctx.fill(band)
    ctx.restoreGState()
  }

  /// Build a UIEdgeInsets that only insets the specified side by `amount`.
  private func insetForSide(_ side: Side, amount: CGFloat) -> UIEdgeInsets {
    switch side {
    case .top:    return UIEdgeInsets(top: amount, left: 0, bottom: 0, right: 0)
    case .right:  return UIEdgeInsets(top: 0, left: 0, bottom: 0, right: amount)
    case .bottom: return UIEdgeInsets(top: 0, left: 0, bottom: amount, right: 0)
    case .left:   return UIEdgeInsets(top: 0, left: amount, bottom: 0, right: 0)
    }
  }
  
  private func bandRect(for side: Side, rect: CGRect, width: CGFloat) -> CGRect {
    switch side {
    case .top: return CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: width)
    case .right: return CGRect(x: rect.maxX - width, y: rect.minY, width: width, height: rect.height)
    case .bottom: return CGRect(x: rect.minX, y: rect.maxY - width, width: rect.width, height: width)
    case .left: return CGRect(x: rect.minX, y: rect.minY, width: width, height: rect.height)
    }
  }
  
  private func strokeBandCenterline(
      for side: Side,
      in rect: CGRect,
      width: CGFloat
  ) -> CGRect {
      let inset = width / 2

      switch side {
      case .top:
          return rect.inset(by: UIEdgeInsets(top: inset, left: 0, bottom: 0, right: 0))
      case .right:
          return rect.inset(by: UIEdgeInsets(top: 0, left: 0, bottom: 0, right: inset))
      case .bottom:
          return rect.inset(by: UIEdgeInsets(top: 0, left: 0, bottom: inset, right: 0))
      case .left:
          return rect.inset(by: UIEdgeInsets(top: 0, left: inset, bottom: 0, right: 0))
      }
  }


  
  private func paintSide(_ s: Side, ctx: CGContext, rect: CGRect, width: CGFloat, side: BorderSide, outerPath: UIBezierPath) {
    guard width > 0, side.style != .none, side.color.cgColor.alpha > 0 else { return }
      ctx.saveGState()
      ctx.addPath(outerPath.cgPath)
      ctx.clip()

      // Clip to this side's band so the fill/stroke doesn't bleed into other sides
      let band = bandRect(for: s, rect: rect, width: width)
      ctx.clip(to: band)

      switch side.style {
      case .double(let spacing):
        // use resolved radius — you already have `radius` member resolved in resolve(for:)
        drawDoubleBorder(ctx, sideEdge: s, rect: rect, totalWidth: width, side: side, outerRadius: radius)
      case .solid:
        ctx.setFillColor(side.color.cgColor)
        ctx.fill(band)
      case .dashed(let dash, let gap):
      //  strokeBandCenterline(band: bandRect(for: s, rect: rect, width: width), side: s, ctx: ctx, color: side.color, lineWidth: width, dash: dash, gap: gap)
        break
      case .dotted(let dot, let gap):
      //  strokeBandCenterline(band: bandRect(for: s, rect: rect, width: width), side: s, ctx: ctx, color: side.color, lineWidth: dot, dash: dot, gap: gap)
        break
      case .groove:
        drawGroove(ctx, bandRect(for: s, rect: rect, width: width), side.color, width)
      case .ridge:
        drawRidge(ctx, bandRect(for: s, rect: rect, width: width), side.color, width)
      case .inset:
        drawInset(ctx, bandRect(for: s, rect: rect, width: width), side.color, width)
      case .outset:
        drawOutset(ctx, bandRect(for: s, rect: rect, width: width), side.color, width)
      default:
        break
      }

      ctx.restoreGState()
  }
  
  internal func buildRoundedPath(in rect: CGRect, radius: BorderRadius) -> UIBezierPath {
    let p = UIBezierPath()
    var tl = radius.topLeft.resolved(rect: rect)
    var tr = radius.topRight.resolved(rect: rect)
    var br = radius.bottomRight.resolved(rect: rect)
    var bl = radius.bottomLeft.resolved(rect: rect)

    let tlExp = radius.topLeft.exponent
    let trExp = radius.topRight.exponent
    let brExp = radius.bottomRight.exponent
    let blExp = radius.bottomLeft.exponent

    // CSS spec: if sum of adjacent radii exceeds the box dimension,
    // scale all radii down proportionally.
    let w = rect.width
    let h = rect.height
    let maxRatioX = max(
      (tl.x + tr.x) / max(w, 1),
      (br.x + bl.x) / max(w, 1)
    )
    let maxRatioY = max(
      (tl.y + bl.y) / max(h, 1),
      (tr.y + br.y) / max(h, 1)
    )
    let maxRatio = max(maxRatioX, maxRatioY)
    if maxRatio > 1 {
      let f = 1.0 / maxRatio
      tl = (tl.x * f, tl.y * f)
      tr = (tr.x * f, tr.y * f)
      br = (br.x * f, br.y * f)
      bl = (bl.x * f, bl.y * f)
    }

    p.move(to: CGPoint(x: rect.minX + tl.x, y: rect.minY))

    // Top edge
    p.addLine(to: CGPoint(x: rect.maxX - tr.x, y: rect.minY))

    // Top-right corner
    addCorner(to: p, corner: .topRight, radius: tr, exponent: trExp, rect: rect)

    // Right edge
    p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - br.y))

    // Bottom-right corner
    addCorner(to: p, corner: .bottomRight, radius: br, exponent: brExp, rect: rect)

    // Bottom edge
    p.addLine(to: CGPoint(x: rect.minX + bl.x, y: rect.maxY))

    // Bottom-left corner
    addCorner(to: p, corner: .bottomLeft, radius: bl, exponent: blExp, rect: rect)

    // Left edge
    p.addLine(to: CGPoint(x: rect.minX, y: rect.minY + tl.y))

    // Top-left corner
    addCorner(to: p, corner: .topLeft, radius: tl, exponent: tlExp, rect: rect)

    p.close()
    return p
  }

  private enum Corner {
    case topLeft, topRight, bottomRight, bottomLeft
  }

  private func addCorner(
    to path: UIBezierPath,
    corner: Corner,
    radius: (x: CGFloat, y: CGFloat),
    exponent: CGFloat,
    rect: CGRect
  ) {
    guard radius.x > 0 || radius.y > 0 else { return }

    if exponent == 1.0 {
      // Standard quadratic Bézier (circular arc approximation)
      let controlPoint: CGPoint
      let endPoint: CGPoint

      switch corner {
      case .topRight:
        controlPoint = CGPoint(x: rect.maxX, y: rect.minY)
        endPoint = CGPoint(x: rect.maxX, y: rect.minY + radius.y)
      case .bottomRight:
        controlPoint = CGPoint(x: rect.maxX, y: rect.maxY)
        endPoint = CGPoint(x: rect.maxX - radius.x, y: rect.maxY)
      case .bottomLeft:
        controlPoint = CGPoint(x: rect.minX, y: rect.maxY)
        endPoint = CGPoint(x: rect.minX, y: rect.maxY - radius.y)
      case .topLeft:
        controlPoint = CGPoint(x: rect.minX, y: rect.minY)
        endPoint = CGPoint(x: rect.minX + radius.x, y: rect.minY)
      }

      path.addQuadCurve(to: endPoint, controlPoint: controlPoint)
      return
    }

    // Superellipse curve
    let steps = 16
    let exp = Double(exponent)
    for i in 0...steps {
      let t = Double(i) / Double(steps)
      let angle = t * .pi / 2.0
      let cx = CGFloat(pow(cos(angle), exp))
      let cy = CGFloat(pow(sin(angle), exp))

      let px: CGFloat
      let py: CGFloat

      switch corner {
      case .topRight:
        px = rect.maxX - radius.x * (1 - cy)
        py = rect.minY + radius.y * (1 - cx)
      case .bottomRight:
        px = rect.maxX - radius.x * (1 - cx)
        py = rect.maxY - radius.y * (1 - cy)
      case .bottomLeft:
        px = rect.minX + radius.x * (1 - cy)
        py = rect.maxY - radius.y * (1 - cx)
      case .topLeft:
        px = rect.minX + radius.x * (1 - cx)
        py = rect.minY + radius.y * (1 - cy)
      }

      path.addLine(to: CGPoint(x: px, y: py))
    }
  }
}




// MARK: - Radius inset helpers

internal extension CSSBorderRenderer.CornerRadius {
  
  func inset(x: CGFloat, y: CGFloat) -> CSSBorderRenderer.CornerRadius {
        let newHorizontal: MasonLengthPercentage
        switch horizontal {
        case .Points(let p):
            newHorizontal = .Points(max(0, p - Float(x)))
        default:
            newHorizontal = horizontal
        }
        let newVertical: MasonLengthPercentage
        switch vertical {
        case .Points(let p):
            newVertical = .Points(max(0, p - Float(y)))
        default:
            newVertical = vertical
        }
        return CSSBorderRenderer.CornerRadius(horizontal: newHorizontal, vertical: newVertical, exponent: exponent)
    }
  
  func inset(by edgeInset: UIEdgeInsets) -> CSSBorderRenderer.CornerRadius {
    // We need a conservative single scalar inset for each corner.
    // For top-left, effective inset along X is left inset, along Y is top inset.
    // Here caller will pass a UIEdgeInsets that only has one non-zero side (insetForSide).
    let xInset = max(edgeInset.left, edgeInset.right)
    let yInset = max(edgeInset.top, edgeInset.bottom)
    return CSSBorderRenderer.CornerRadius(horizontal: self.horizontal,
                                          vertical: self.vertical,
                                          exponent: self.exponent)
      .withReduced(horizontalDelta: Float(xInset), verticalDelta: Float(yInset))
  }

  // helper to reduce stored MasonLengthPercentage/Float-based radii to new values
  func withReduced(horizontalDelta dx: Float, verticalDelta dy: Float) -> CSSBorderRenderer.CornerRadius {
    // convert existing horizontal/vertical to absolute floats if they are already resolved
    // In your design, CornerRadius.horizontal/vertical are MasonLengthPercentage; in your code above
    // CornerRadius stores MasonLengthPercentage. We will attempt to reduce only Points values here.
    // If Percent values remain, you might want to resolve earlier. For general safety, we do:
    let newHorizontal: MasonLengthPercentage
    switch horizontal {
    case .Points(let p):
      newHorizontal = .Points(max(0, p - dx))
    default:
      // if percent, keep as-is (it will be resolved relative to rect later)
      newHorizontal = horizontal
    }
    let newVertical: MasonLengthPercentage
    switch vertical {
    case .Points(let p):
      newVertical = .Points(max(0, p - dy))
    default:
      newVertical = vertical
    }
    return CSSBorderRenderer.CornerRadius(horizontal: newHorizontal, vertical: newVertical, exponent: exponent)
  }
}

internal extension CSSBorderRenderer.BorderRadius {
  func inset(by insets: UIEdgeInsets) -> CSSBorderRenderer.BorderRadius {
    // Inset each corner by the relevant x/y from the edge insets.
    // For simplicity pass the same insets to each corner since insetForSide gives single-side insets.
    return CSSBorderRenderer.BorderRadius(
      topLeft: topLeft.inset(by: insets),
      topRight: topRight.inset(by: insets),
      bottomRight: bottomRight.inset(by: insets),
      bottomLeft: bottomLeft.inset(by: insets)
    )
  }
  
  func insetByBorderWidths(_ borderWidths: (top: CGFloat, right: CGFloat, bottom: CGFloat, left: CGFloat)) -> CSSBorderRenderer.BorderRadius {
         return CSSBorderRenderer.BorderRadius(
             topLeft: topLeft.inset(x: borderWidths.left, y: borderWidths.top),
             topRight: topRight.inset(x: borderWidths.right, y: borderWidths.top),
             bottomRight: bottomRight.inset(x: borderWidths.right, y: borderWidths.bottom),
             bottomLeft: bottomLeft.inset(x: borderWidths.left, y: borderWidths.bottom)
         )
     }
}
