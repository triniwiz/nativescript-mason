#if os(macOS)
import AppKit

@objc public protocol UIScrollViewDelegate: NSObjectProtocol {
  @objc optional func scrollViewDidScroll(_ scrollView: UIScrollView)
  @objc optional func scrollViewWillBeginDragging(_ scrollView: UIScrollView)
  @objc optional func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool)
  @objc optional func scrollViewDidEndDecelerating(_ scrollView: UIScrollView)
}

open class UIScrollView: MasonViewBase {
  open weak var delegate: UIScrollViewDelegate?
  open var contentSize: CGSize = .zero {
    didSet { refreshIndicators(flash: false) }
  }
  open var isScrollEnabled = true
  open var showsVerticalScrollIndicator = true
  open var showsHorizontalScrollIndicator = true
  open var alwaysBounceVertical = false
  open var alwaysBounceHorizontal = false
  public private(set) var isDragging = false
  public private(set) var isDecelerating = false

  private lazy var indicators = ScrollIndicators(host: self)
  private var forwarding: Bool?
  private var dragStart: CGPoint = .zero
  private var translation: CGPoint = .zero
  private var velocity = WheelVelocity()
  private var link: CADisplayLink?
  private var linkVelocity: CGPoint = .zero
  private var linkOffset: CGPoint = .zero
  private var linkTime: CFTimeInterval = 0
  private var idleWork: DispatchWorkItem?

  open var contentOffset: CGPoint {
    get { bounds.origin }
    set {
      guard bounds.origin != newValue else { return }
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      setBoundsOrigin(newValue)
      CATransaction.commit()
      refreshIndicators(flash: true)
      delegate?.scrollViewDidScroll?(self)
    }
  }

  open func setContentOffset(_ offset: CGPoint, animated: Bool) {
    stopDeceleration()
    contentOffset = offset
  }

  open func scrollRectToVisible(_ rect: CGRect, animated: Bool) {
    var offset = contentOffset
    if rect.minX < offset.x { offset.x = rect.minX } else if rect.maxX > offset.x + bounds.width { offset.x = rect.maxX - bounds.width }
    if rect.minY < offset.y { offset.y = rect.minY } else if rect.maxY > offset.y + bounds.height { offset.y = rect.maxY - bounds.height }
    setContentOffset(clamped(offset), animated: animated)
  }

  private var maxOffset: CGPoint {
    CGPoint(x: max(contentSize.width - bounds.width, 0), y: max(contentSize.height - bounds.height, 0))
  }

  private var canScrollH: Bool { isScrollEnabled && (maxOffset.x > 0 || alwaysBounceHorizontal) }
  private var canScrollV: Bool { isScrollEnabled && (maxOffset.y > 0 || alwaysBounceVertical) }

  private func clamped(_ o: CGPoint) -> CGPoint {
    let range = maxOffset
    return CGPoint(x: min(max(o.x, 0), range.x), y: min(max(o.y, 0), range.y))
  }

  private func banded(_ o: CGPoint) -> CGPoint {
    let range = maxOffset
    return CGPoint(
      x: canScrollH ? ScrollPhysics.rubber(o.x, 0, range.x, bounds.width) : 0,
      y: canScrollV ? ScrollPhysics.rubber(o.y, 0, range.y, bounds.height) : 0
    )
  }

  private func refreshIndicators(flash: Bool) {
    indicators.update(offset: contentOffset, contentSize: contentSize, horizontalAxis: showsHorizontalScrollIndicator, verticalAxis: showsVerticalScrollIndicator, flash: flash)
  }

  open override func layoutSubviews() {
    super.layoutSubviews()
    refreshIndicators(flash: false)
  }

  open override func scrollWheel(with event: NSEvent) {
    if !event.momentumPhase.isEmpty {
      if forwarding == true { nextResponder?.scrollWheel(with: event) }
      return
    }
    let phased = !event.phase.isEmpty
    let begins = event.phase.contains(.began) || event.phase.contains(.mayBegin)
    if !phased || begins { forwarding = nil }
    let scale: CGFloat = event.hasPreciseScrollingDeltas ? 1 : 10
    let dx = event.scrollingDeltaX * scale
    let dy = event.scrollingDeltaY * scale
    if forwarding == nil, dx != 0 || dy != 0 {
      forwarding = !(abs(dx) > abs(dy) ? canScrollH : canScrollV)
    }
    if forwarding == true {
      nextResponder?.scrollWheel(with: event)
      return
    }

    guard phased else {
      guard forwarding == false else { return }
      stopDeceleration()
      contentOffset = clamped(CGPoint(x: contentOffset.x - (canScrollH ? dx : 0), y: contentOffset.y - (canScrollV ? dy : 0)))
      idleWork?.cancel()
      let work = DispatchWorkItem { [weak self] in
        guard let self else { return }
        self.idleWork = nil
        self.delegate?.scrollViewDidEndDecelerating?(self)
      }
      idleWork = work
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.15, execute: work)
      return
    }

    if begins {
      stopDeceleration()
      isDragging = true
      dragStart = contentOffset
      translation = .zero
      velocity.reset()
      delegate?.scrollViewWillBeginDragging?(self)
    }
    if dx != 0 || dy != 0 {
      translation.x += dx
      translation.y += dy
      velocity.add(CGPoint(x: -dx, y: -dy), at: event.timestamp)
      let raw = CGPoint(x: dragStart.x - (canScrollH ? translation.x : 0), y: dragStart.y - (canScrollV ? translation.y : 0))
      contentOffset = event.hasPreciseScrollingDeltas ? banded(raw) : clamped(raw)
    }
    if event.phase.contains(.ended) || event.phase.contains(.cancelled) {
      isDragging = false
      let v = velocity.velocity(at: event.timestamp)
      let fling = CGPoint(x: canScrollH ? v.x : 0, y: canScrollV ? v.y : 0)
      let moving = hypot(fling.x, fling.y) > 1 || contentOffset != clamped(contentOffset)
      delegate?.scrollViewDidEndDragging?(self, willDecelerate: moving)
      if moving { startDeceleration(fling) }
    }
  }

  private func startDeceleration(_ v: CGPoint) {
    link?.invalidate()
    linkVelocity = v
    linkOffset = contentOffset
    linkTime = CACurrentMediaTime()
    isDecelerating = true
    let l = masonDisplayLink(self, #selector(decelerationStep))
    l.preferredFrameRateRange = CAFrameRateRange(minimum: 60, maximum: 120, preferred: 120)
    link = l
  }

  private func stopDeceleration() {
    guard link != nil else { return }
    link?.invalidate()
    link = nil
    isDecelerating = false
    delegate?.scrollViewDidEndDecelerating?(self)
  }

  @objc private func decelerationStep() {
    let now = link?.targetTimestamp ?? CACurrentMediaTime()
    let dt = CGFloat(min(max(now - linkTime, 0), 0.05))
    linkTime = now
    let range = maxOffset
    var o = linkOffset, v = linkVelocity
    var doneX = true, doneY = true
    if canScrollH { (o.x, v.x, doneX) = ScrollPhysics.step(o.x, v.x, 0, range.x, dt) }
    if canScrollV { (o.y, v.y, doneY) = ScrollPhysics.step(o.y, v.y, 0, range.y, dt) }
    linkOffset = o
    linkVelocity = v
    contentOffset = o
    if doneX && doneY { stopDeceleration() }
  }

  open override func hitTest(_ point: NSPoint) -> NSView? {
    if let parent = superview, indicators.contains(convert(point, from: parent)) { return self }
    return super.hitTest(point)
  }

  open override func mouseDown(with event: NSEvent) {
    guard let start = indicators.beginDrag(at: convert(event.locationInWindow, from: nil), window: event.locationInWindow) else {
      super.mouseDown(with: event)
      return
    }
    stopDeceleration()
    contentOffset = clamped(start)
  }

  open override func mouseDragged(with event: NSEvent) {
    guard let next = indicators.dragOffset(window: event.locationInWindow) else {
      super.mouseDragged(with: event)
      return
    }
    contentOffset = clamped(next)
  }

  open override func mouseUp(with event: NSEvent) {
    guard indicators.dragOffset(window: event.locationInWindow) != nil else {
      super.mouseUp(with: event)
      return
    }
    indicators.endDrag()
  }
}
#endif
