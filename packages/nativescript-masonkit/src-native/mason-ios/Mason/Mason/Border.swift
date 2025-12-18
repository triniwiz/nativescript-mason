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
    
    public init?(rawValue: Int32) {
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
    
    public var rawValue: Int32 {
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
  
  public struct BorderSide: CustomStringConvertible {
    
    public var description: String {
      return "BorderSide{ side: \(side),  width: \(width), color: \(color), style: \(style) }"
    }
    
    internal let owner: MasonStyle
    public var width: MasonLengthPercentage {
      get {
        return MasonLengthPercentage.fromValueType(owner.getFloat(keys.widthValue), Int(owner.getInt32(keys.widthType)))!
      }
      
      set {
        owner.setInt32(keys.widthType, newValue.type)
        owner.setFloat(keys.widthValue, newValue.value)
      }
    }
    
    public func setColor(color: UInt32){
      owner.setUInt32(keys.color, color)
    }
    
    public var color: UIColor{
      get {
        return UIColor.colorFromARGB(
          owner.getUInt32(keys.color)
        )
      }
      
      set {
        owner.setUInt32(keys.color, newValue.toUInt32())
      }
    }
    public var style: BorderStyle{
      get {
        return BorderStyle(rawValue: owner.getInt32(keys.style))!
      }
      
      set {
        owner.setInt32(keys.style, newValue.rawValue)
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
  
  internal var style: MasonStyle
  
  // Cache
  private var lastHash: Int = 0
  private var cachedResolvedRect: CGRect = .zero
  private var cachedRadius: BorderRadius = .zero
  private var cachedWidths: (top: CGFloat, right: CGFloat, bottom: CGFloat, left: CGFloat) = (0,0,0,0)
  internal var css: String = ""
  public init(style: MasonStyle) {
    self.style = style
    self.top = BorderSide(style: style, side: .top)
    self.right = BorderSide(style: style, side: .right)
    self.bottom = BorderSide(style: style, side: .bottom)
    self.left = BorderSide(style: style, side: .left)
    self.radius = BorderRadius.zero
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
  
  private func resolve(for rect: CGRect) {
    let hash = style.hashValue ^ Int(rect.width) ^ Int(rect.height)
    if hash == lastHash && cachedResolvedRect == rect {
      return
    }
    
    cachedResolvedRect = rect
    lastHash = hash
    
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
      let h = MasonLengthPercentage.fromValueType(Float(xValue), xType) ?? .Zero
      let v = MasonLengthPercentage.fromValueType(Float(yValue), yType) ?? .Zero
      let exponent = CGFloat(exp)
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
    ctx.saveGState()
    ctx.setAllowsAntialiasing(true)
    ctx.setShouldAntialias(true)
    
    let outerPath = buildRoundedPath(in: rect, radius: radius)
    
    paintSide(.top, ctx: ctx, rect: rect, width: cachedWidths.top, side: top, outerPath: outerPath)
    paintSide(.right, ctx: ctx, rect: rect, width: cachedWidths.right, side: right, outerPath: outerPath)
    paintSide(.bottom, ctx: ctx, rect: rect, width: cachedWidths.bottom, side: bottom, outerPath: outerPath)
    paintSide(.left, ctx: ctx, rect: rect, width: cachedWidths.left, side: left, outerPath: outerPath)
    
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

      switch side.style {
      case .double(let spacing):
        // use resolved radius — you already have `radius` member resolved in resolve(for:)
        drawDoubleBorder(ctx, sideEdge: s, rect: rect, totalWidth: width, side: side, outerRadius: radius)
      case .solid:
        ctx.setFillColor(side.color.cgColor)
        // fill band as before
        var band: CGRect
        switch s {
        case .top: band = CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: width)
        case .right: band = CGRect(x: rect.maxX - width, y: rect.minY, width: width, height: rect.height)
        case .bottom: band = CGRect(x: rect.minX, y: rect.maxY - width, width: rect.width, height: width)
        case .left: band = CGRect(x: rect.minX, y: rect.minY, width: width, height: rect.height)
        }
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
  
  private func buildRoundedPath(in rect: CGRect, radius: BorderRadius) -> UIBezierPath {
    let p = UIBezierPath()
    let tl = radius.topLeft.resolved(rect: rect)
    let tr = radius.topRight.resolved(rect: rect)
    let br = radius.bottomRight.resolved(rect: rect)
    let bl = radius.bottomLeft.resolved(rect: rect)
    
    p.move(to: CGPoint(x: rect.minX + tl.x, y: rect.minY))
    p.addLine(to: CGPoint(x: rect.maxX - tr.x, y: rect.minY))
    p.addQuadCurve(to: CGPoint(x: rect.maxX, y: rect.minY + tr.y),
                   controlPoint: CGPoint(x: rect.maxX, y: rect.minY))
    p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - br.y))
    p.addQuadCurve(to: CGPoint(x: rect.maxX - br.x, y: rect.maxY),
                   controlPoint: CGPoint(x: rect.maxX, y: rect.maxY))
    p.addLine(to: CGPoint(x: rect.minX + bl.x, y: rect.maxY))
    p.addQuadCurve(to: CGPoint(x: rect.minX, y: rect.maxY - bl.y),
                   controlPoint: CGPoint(x: rect.minX, y: rect.maxY))
    p.addLine(to: CGPoint(x: rect.minX, y: rect.minY + tl.y))
    p.addQuadCurve(to: CGPoint(x: rect.minX + tl.x, y: rect.minY),
                   controlPoint: CGPoint(x: rect.minX, y: rect.minY))
    p.close()
    return p
  }
}




// MARK: - Radius inset helpers

private extension CSSBorderRenderer.CornerRadius {
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

private extension CSSBorderRenderer.BorderRadius {
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
}
