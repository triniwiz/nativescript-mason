#if os(macOS)
import AppKit

final class ScrollIndicators {
  private weak var host: NSView?
  private let vertical = CALayer()
  private let horizontal = CALayer()
  private var hideWork: DispatchWorkItem?
  private var drag: (vertical: Bool, start: CGPoint, offset: CGPoint)?
  private var offset: CGPoint = .zero
  private var range: CGPoint = .zero
  private var travel: CGPoint = .zero

  private static let thickness: CGFloat = 7
  private static let inset: CGFloat = 2
  private static let minLength: CGFloat = 18
  private static let hideDelay: TimeInterval = 0.8

  init(host: NSView) {
    self.host = host
    for knob in [vertical, horizontal] {
      knob.cornerRadius = ScrollIndicators.thickness / 2
      knob.backgroundColor = NSColor(white: 0, alpha: 0.5).cgColor
      knob.borderColor = NSColor(white: 1, alpha: 0.5).cgColor
      knob.borderWidth = 1
      knob.opacity = 0
      knob.actions = ["position": NSNull(), "bounds": NSNull(), "backgroundColor": NSNull(), "hidden": NSNull()]
    }
  }

  func owns(_ layer: CALayer) -> Bool {
    layer === vertical || layer === horizontal
  }

  private var alwaysVisible: Bool { NSScroller.preferredScrollerStyle == .legacy }

  func update(offset: CGPoint, contentSize: CGSize, horizontalAxis: Bool, verticalAxis: Bool, flash: Bool) {
    guard let host else { return }
    let bounds = host.bounds
    let layer = host.backingLayer
    let showV = verticalAxis && contentSize.height > bounds.height + 0.5
    let showH = horizontalAxis && contentSize.width > bounds.width + 0.5
    self.offset = offset
    range = CGPoint(x: max(contentSize.width - bounds.width, 0), y: max(contentSize.height - bounds.height, 0))

    let t = ScrollIndicators.thickness, inset = ScrollIndicators.inset

    func place(_ knob: CALayer, show: Bool, track: CGFloat, viewport: CGFloat, content: CGFloat, value: CGFloat, maxValue: CGFloat) -> (CGFloat, CGFloat) {
      knob.isHidden = !show
      guard show, track > 0 else { return (0, 0) }
      // AppKit ignores zPosition among a view's sublayers, so the knob stays last.
      if layer.sublayers?.last !== knob { layer.addSublayer(knob) }
      let over = value < 0 ? -value : max(value - maxValue, 0)
      let length = min(track, max(ScrollIndicators.minLength, track * viewport / content - over))
      let progress = maxValue > 0 ? min(max(value / maxValue, 0), 1) : 0
      return (progress * (track - length), length)
    }

    let trackV = bounds.height - inset * 2 - (showH ? t + inset : 0)
    let (posV, lenV) = place(vertical, show: showV, track: trackV, viewport: bounds.height, content: contentSize.height, value: offset.y, maxValue: range.y)
    if showV { vertical.frame = CGRect(x: bounds.maxX - inset - t, y: bounds.minY + inset + posV, width: t, height: lenV) }
    let trackH = bounds.width - inset * 2 - (showV ? t + inset : 0)
    let (posH, lenH) = place(horizontal, show: showH, track: trackH, viewport: bounds.width, content: contentSize.width, value: offset.x, maxValue: range.x)
    if showH { horizontal.frame = CGRect(x: bounds.minX + inset + posH, y: bounds.maxY - inset - t, width: lenH, height: t) }
    travel = CGPoint(x: max(trackH - lenH, 1), y: max(trackV - lenV, 1))

    if alwaysVisible {
      setOpacity(1, animated: false)
    } else if flash {
      setOpacity(1, animated: false)
      scheduleHide()
    }
  }

  private func setOpacity(_ value: Float, animated: Bool) {
    for knob in [vertical, horizontal] {
      if animated {
        let fade = CABasicAnimation(keyPath: "opacity")
        fade.fromValue = knob.presentation()?.opacity ?? knob.opacity
        fade.toValue = value
        fade.duration = 0.25
        knob.add(fade, forKey: "fade")
      }
      knob.opacity = value
    }
  }

  private func scheduleHide() {
    hideWork?.cancel()
    guard !alwaysVisible else { return }
    let work = DispatchWorkItem { [weak self] in
      guard let self, self.drag == nil else { return }
      self.setOpacity(0, animated: true)
    }
    hideWork = work
    DispatchQueue.main.asyncAfter(deadline: .now() + ScrollIndicators.hideDelay, execute: work)
  }

  private func track(_ vertical: Bool) -> CGRect? {
    guard let host else { return nil }
    let knob = vertical ? self.vertical : horizontal
    guard !knob.isHidden, knob.opacity > 0 else { return nil }
    let b = host.bounds, t = ScrollIndicators.thickness + ScrollIndicators.inset * 2
    return vertical ? CGRect(x: b.maxX - t, y: b.minY, width: t, height: b.height) : CGRect(x: b.minX, y: b.maxY - t, width: b.width, height: t)
  }

  func contains(_ point: CGPoint) -> Bool {
    track(true)?.contains(point) == true || track(false)?.contains(point) == true
  }

  func beginDrag(at point: CGPoint, window: CGPoint) -> CGPoint? {
    for isVertical in [true, false] {
      guard let track = track(isVertical), track.contains(point) else { continue }
      let knob = isVertical ? vertical : horizontal
      var start = offset
      if !knob.frame.contains(point) {
        let along = isVertical ? point.y - track.minY - knob.frame.height / 2 : point.x - track.minX - knob.frame.width / 2
        if isVertical { start.y = along / travel.y * range.y } else { start.x = along / travel.x * range.x }
      }
      drag = (isVertical, window, start)
      hideWork?.cancel()
      return start
    }
    return nil
  }

  func dragOffset(window: CGPoint) -> CGPoint? {
    guard let drag else { return nil }
    var next = drag.offset
    if drag.vertical {
      next.y += (drag.start.y - window.y) / travel.y * range.y
    } else {
      next.x += (window.x - drag.start.x) / travel.x * range.x
    }
    return next
  }

  func endDrag() {
    drag = nil
    scheduleHide()
  }
}

struct WheelVelocity {
  private var samples: [(time: TimeInterval, delta: CGPoint)] = []

  mutating func reset() { samples.removeAll() }

  mutating func add(_ delta: CGPoint, at time: TimeInterval) {
    samples.append((time, delta))
    samples.removeAll { time - $0.time > 0.1 }
  }

  func velocity(at time: TimeInterval) -> CGPoint {
    let recent = samples.filter { time - $0.time <= 0.1 }
    guard let first = recent.first, recent.count > 1 else { return .zero }
    let span = max(time - first.time, 1.0 / 120)
    let sum = recent.reduce(CGPoint.zero) { CGPoint(x: $0.x + $1.delta.x, y: $0.y + $1.delta.y) }
    return CGPoint(x: sum.x / span, y: sum.y / span)
  }
}

enum ScrollPhysics {
  static let decelerationPerMs: CGFloat = 0.998

  static func rubber(_ value: CGFloat, _ lo: CGFloat, _ hi: CGFloat, _ dimension: CGFloat) -> CGFloat {
    func band(_ distance: CGFloat) -> CGFloat {
      let d = max(dimension, 1)
      return (1 - 1 / (distance * 0.55 / d + 1)) * d
    }
    if value < lo { return lo - band(lo - value) }
    if value > hi { return hi + band(value - hi) }
    return value
  }

  static func step(_ value: CGFloat, _ velocity: CGFloat, _ lo: CGFloat, _ hi: CGFloat, _ dt: CGFloat) -> (CGFloat, CGFloat, Bool) {
    if value >= lo && value <= hi {
      let decay = pow(decelerationPerMs, dt * 1000)
      let next = value + velocity * (decay - 1) / (1000 * log(decelerationPerMs))
      let v = velocity * decay
      return (next, v, abs(v) < 10 && next >= lo && next <= hi)
    }
    let target = value < lo ? lo : hi
    let stiffness: CGFloat = 280
    let v = velocity + (-stiffness * (value - target) - 2 * stiffness.squareRoot() * velocity) * dt
    let next = value + v * dt
    if abs(next - target) < 0.5, abs(v) < 5 { return (target, 0, true) }
    return (next, v, false)
  }
}
#endif
