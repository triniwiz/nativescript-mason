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
      case 9:
        self = .outset
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
  
  public struct BorderRadius: Equatable {
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
    if !clipPathDirty,
       let cached = cachedClipPath,
       cachedClipRect == rect,
       cachedClipRadius == radius {
      return cached
    }
    let path = buildRoundedPath(in: rect, radius: radius)
    cachedClipPath = path
    cachedClipRect = rect
    cachedClipRadius = radius
    clipPathDirty = false
    return path
  }

  public func invalidateCache() {
    lastHash = 0
    clipPathDirty = true
    cachedClipPath = nil
    cachedClipRadius = .zero
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
      paintRings(ctx, rect: rect, visible: [topVisible, rightVisible, bottomVisible, leftVisible])
    }

    ctx.restoreGState()
  }
  
  /// The rounded edge `f` of the way from the border edge to the padding edge.
  private func edgePath(_ rect: CGRect, _ f: CGFloat) -> UIBezierPath {
    let w = cachedWidths
    let insets = UIEdgeInsets(top: w.top * f, left: w.left * f, bottom: w.bottom * f, right: w.right * f)
    let radii = radius.insetByBorderWidths((insets.top, insets.right, insets.bottom, insets.left))
    return buildRoundedPath(in: rect.inset(by: insets), radius: radii)
  }

  // Shared with Windows' PaintBorder: each style fills rings between rounded edges, split per
  // side by the corner diagonals, so radii, double lines and 3D shades follow the shape.
  private func paintRings(_ ctx: CGContext, rect: CGRect, visible: [Bool]) {
    let sides = [top, right, bottom, left]
    let w = cachedWidths
    let widths = [w.top, w.right, w.bottom, w.left]

    // Dotted or dashed alike on every side: one stroke along the middle of the border.
    func patterned(_ style: BorderStyle) -> Int {
      switch style {
      case .dotted: return 1
      case .dashed: return 2
      default: return 0
      }
    }
    let drawn = (0..<4).filter { visible[$0] }
    if let first = drawn.first, patterned(sides[first].style) != 0, drawn.count == 4,
       drawn.allSatisfy({ patterned(sides[$0].style) == patterned(sides[first].style) && widths[$0] == widths[first] && sides[$0].color == sides[first].color }) {
      let width = widths[first]
      let dotted = patterned(sides[first].style) == 1
      ctx.saveGState()
      ctx.addPath(edgePath(rect, 0.5).cgPath)
      ctx.setStrokeColor(sides[first].color.cgColor)
      ctx.setLineWidth(width)
      ctx.setLineCap(dotted ? .round : .butt)
      ctx.setLineJoin(.round)
      ctx.setLineDash(phase: 0, lengths: dotted ? [0, width * 2] : [width * 2, width * 2])
      ctx.strokePath()
      ctx.restoreGState()
      return
    }

    let allDouble = drawn.allSatisfy { if case .double = sides[$0].style { return true } else { return false } }
    let bands: [(CGFloat, CGFloat)] = allDouble ? [(0, 1.0 / 3.0), (2.0 / 3.0, 1)] : [(0, 1)]
    // inset and groove darken the top and left; outset and ridge the bottom and right.
    func shade(_ i: Int) -> CGFloat {
      let topLeft = i == 0 || i == 3
      switch sides[i].style {
      case .inset, .groove: return topLeft ? 0.6 : 1
      case .outset, .ridge: return topLeft ? 1 : 0.6
      default: return 1
      }
    }
    func color(_ i: Int) -> CGColor {
      let f = shade(i)
      guard f != 1 else { return sides[i].color.cgColor }
      var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
      sides[i].color.getRed(&r, green: &g, blue: &b, alpha: &a)
      return UIColor(red: r * f, green: g * f, blue: b * f, alpha: a).cgColor
    }
    // A side with no width adds nothing to the ring, so it needn't match.
    let oneColor = drawn.allSatisfy { sides[$0].color == sides[drawn[0]].color && shade($0) == 1 } &&
      (0..<4).allSatisfy { drawn.contains($0) || widths[$0] <= 0 }

    // Where a corner's dividing line ends: from the outer corner through the inner one, on to the
    // edge of the radius box (at most half the rect, so lines can't cross); stopping at the inner
    // corner would leave a rounded corner's curve out of both sides.
    func split(_ corner: CGPoint, _ dirX: CGFloat, _ dirY: CGFloat, _ insetX: CGFloat, _ insetY: CGFloat, _ radius: CornerRadius) -> CGPoint {
      let r = radius.resolved(rect: rect)
      let boxX = min(max(r.x, insetX), rect.width / 2)
      let boxY = min(max(r.y, insetY), rect.height / 2)
      let tx = insetX > 0 ? boxX / insetX : .infinity
      let ty = insetY > 0 ? boxY / insetY : .infinity
      var t = min(tx, ty)
      if t.isInfinite { t = 0 }
      return CGPoint(x: corner.x + dirX * insetX * t, y: corner.y + dirY * insetY * t)
    }
    let tl = split(CGPoint(x: rect.minX, y: rect.minY), 1, 1, w.left, w.top, radius.topLeft)
    let tr = split(CGPoint(x: rect.maxX, y: rect.minY), -1, 1, w.right, w.top, radius.topRight)
    let br = split(CGPoint(x: rect.maxX, y: rect.maxY), -1, -1, w.right, w.bottom, radius.bottomRight)
    let bl = split(CGPoint(x: rect.minX, y: rect.maxY), 1, -1, w.left, w.bottom, radius.bottomLeft)
    let trapezoids: [[CGPoint]] = [
      [CGPoint(x: rect.minX, y: rect.minY), CGPoint(x: rect.maxX, y: rect.minY), tr, tl],
      [CGPoint(x: rect.maxX, y: rect.minY), CGPoint(x: rect.maxX, y: rect.maxY), br, tr],
      [CGPoint(x: rect.minX, y: rect.maxY), bl, br, CGPoint(x: rect.maxX, y: rect.maxY)],
      [CGPoint(x: rect.minX, y: rect.minY), tl, bl, CGPoint(x: rect.minX, y: rect.maxY)],
    ]

    for (from, to) in bands {
      let ring = CGMutablePath()
      ring.addPath(edgePath(rect, from).cgPath)
      ring.addPath(edgePath(rect, to).cgPath)
      if oneColor {
        ctx.addPath(ring)
        ctx.setFillColor(sides[drawn[0]].color.cgColor)
        ctx.fillPath(using: .evenOdd)
        continue
      }
      for i in drawn {
        ctx.saveGState()
        ctx.addPath(ring)
        ctx.clip(using: .evenOdd)
        ctx.addLines(between: trapezoids[i])
        ctx.closePath()
        ctx.clip()
        ctx.setFillColor(color(i))
        ctx.fill(rect)
        ctx.restoreGState()
      }
    }
  }

  // MARK: - Helpers
  
  public enum Side { case top, right, bottom, left }
  
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
      // Cubic Bézier approximation of a quarter (elliptical) arc. A quadratic
      // Bézier through the box corner under-rounds the curve (sits ~0.25·r from
      // the corner vs a true circle's ~0.293·r), leaving corners visibly squarer.
      // The standard kappa control-point offset matches a circular arc to within
      // ~0.02% and renders identically to CSS/Android.
      let k: CGFloat = 0.5522847498307936
      let cx = radius.x * (1 - k)
      let cy = radius.y * (1 - k)

      switch corner {
      case .topRight:
        // (maxX - radius.x, minY) -> (maxX, minY + radius.y)
        path.addCurve(
          to: CGPoint(x: rect.maxX, y: rect.minY + radius.y),
          controlPoint1: CGPoint(x: rect.maxX - cx, y: rect.minY),
          controlPoint2: CGPoint(x: rect.maxX, y: rect.minY + cy)
        )
      case .bottomRight:
        // (maxX, maxY - radius.y) -> (maxX - radius.x, maxY)
        path.addCurve(
          to: CGPoint(x: rect.maxX - radius.x, y: rect.maxY),
          controlPoint1: CGPoint(x: rect.maxX, y: rect.maxY - cy),
          controlPoint2: CGPoint(x: rect.maxX - cx, y: rect.maxY)
        )
      case .bottomLeft:
        // (minX + radius.x, maxY) -> (minX, maxY - radius.y)
        path.addCurve(
          to: CGPoint(x: rect.minX, y: rect.maxY - radius.y),
          controlPoint1: CGPoint(x: rect.minX + cx, y: rect.maxY),
          controlPoint2: CGPoint(x: rect.minX, y: rect.maxY - cy)
        )
      case .topLeft:
        // (minX, minY + radius.y) -> (minX + radius.x, minY)
        path.addCurve(
          to: CGPoint(x: rect.minX + radius.x, y: rect.minY),
          controlPoint1: CGPoint(x: rect.minX, y: rect.minY + cy),
          controlPoint2: CGPoint(x: rect.minX + cx, y: rect.minY)
        )
      }
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
  
  // `.Points` holds device pixels; x and y are points.
  func inset(x: CGFloat, y: CGFloat) -> CSSBorderRenderer.CornerRadius {
        let newHorizontal: MasonLengthPercentage
        switch horizontal {
        case .Points(let p):
            newHorizontal = .Points(max(0, p - Float(x) * NSCMason.scale))
        default:
            newHorizontal = horizontal
        }
        let newVertical: MasonLengthPercentage
        switch vertical {
        case .Points(let p):
            newVertical = .Points(max(0, p - Float(y) * NSCMason.scale))
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
      newHorizontal = .Points(max(0, p - dx * NSCMason.scale))
    default:
      // if percent, keep as-is (it will be resolved relative to rect later)
      newHorizontal = horizontal
    }
    let newVertical: MasonLengthPercentage
    switch vertical {
    case .Points(let p):
      newVertical = .Points(max(0, p - dy * NSCMason.scale))
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
