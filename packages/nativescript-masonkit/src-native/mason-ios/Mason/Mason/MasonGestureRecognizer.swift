//
//  MasonGestureRecognizer.swift
//  Mason
//
//  Created by Osei Fortune on 11/01/2026.
//

#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

class MasonGestureRecognizer: MasonGestureRecognizerBase {
  weak var owner: MasonElement?
  weak var targetView: UIView?
  internal var isSubmit: Bool = false
  var eventDispatched: Bool = false

  // Movement past this many points (in WINDOW coords, stable while a scroll view
  // moves content under the finger) marks a scroll/drag rather than a tap.
  // Matches UIScrollView's default pan slop.
  private static let tapSlop: CGFloat = 10.0
  // Touch-down location in window space; nil once the gesture has bailed.
  private var startLocationInWindow: CGPoint?

  init(targetView: UIView) {
    self.targetView = targetView
    super.init(target: nil, action: nil)
    // We dispatch the click event ourselves in touchesBegan and don't need UIKit
    // to delay touch-ended delivery or cancel touches in views. On iOS 26 the
    // default delaysTouchesEnded=true causes a nil-event crash in
    // _delayTouchesForEvent:inPhase: when state is set to .recognized before
    // touchesEnded has occurred.
#if canImport(UIKit)
    delaysTouchesEnded = false
    cancelsTouchesInView = false
#endif
  }

#if os(macOS)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
#endif

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    // Record the start in window coords so touchesEnded can tell a tap from a scroll.
    startLocationInWindow = touches.first?.location(in: nil)
  }

  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
    // Past the slop = scroll/drag; bail so touchesEnded won't fire a click.
    guard let touch = touches.first, let start = startLocationInWindow else { return }
    let now = touch.location(in: nil)
    if hypot(now.x - start.x, now.y - start.y) > Self.tapSlop {
      startLocationInWindow = nil
      state = .failed
    }
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
    guard let touch = touches.first, let view = targetView, let start = startLocationInWindow else {
      state = .failed
      return
    }

    // Reject if the touch moved too far overall (scroll/drag, not a tap).
    let endInWindow = touch.location(in: nil)
    guard hypot(endInWindow.x - start.x, endInWindow.y - start.y) <= Self.tapSlop else {
      state = .failed
      return
    }

    // Only fire click if the finger lifted inside the view (not a drag).
    let location = touch.location(in: view)
    guard view.bounds.contains(location) else {
      state = .failed
      return
    }

    // The click bubbles from the innermost element under the finger, so an
    // ancestor's recognizer leaves the touch to that element.
    if MasonGestureRecognizer.deeperTarget(from: touch.view, below: view, location: { touch.location(in: $0) }) {
      state = .failed
      return
    }

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
    click.target = view

    if let owner = owner {
      owner.node.mason.dispatch(click, owner.node)
    }

    if click.defaultPrevented {
      state = .failed
    } else {
      state = .recognized
    }

    eventDispatched = true
  }

  /// Whether an element between the touched view and `view` handles this click: one with its own
  /// recognizer, or an inline element drawn by a text view.
  static func deeperTarget(from hitView: UIView?, below view: UIView, location: (UIView) -> CGPoint) -> Bool {
    var current = hitView
    while let v = current, v !== view {
      if hasClickRecognizer(v) {
        return true
      }
      if let text = v as? MasonText, text.inlineClickTarget(at: location(text)) != nil {
        return true
      }
      current = v.superview
    }
    if let text = view as? MasonText, text.inlineClickTarget(at: location(text)) != nil {
      return true
    }
    return false
  }

  static func hasClickRecognizer(_ view: UIView) -> Bool {
    let recognizers: [UIGestureRecognizer]? = view.gestureRecognizers
    return recognizers?.contains(where: { $0 is MasonGestureRecognizer && $0.isEnabled }) == true
  }

#if os(macOS)
  // A control's own mouse tracking hides the release from recognizers: settle them and send the click.
  @discardableResult
  static func finishTrackedClick(_ control: NSView, down: NSEvent) -> MasonMouseEvent? {
    guard let up = NSApp.currentEvent, up.type == .leftMouseUp, up.timestamp >= down.timestamp else { return nil }
    var owner: MasonElement?
    var current: NSView? = control
    while let view = current {
      for recognizer in view.gestureRecognizers where recognizer is MasonGestureRecognizer && recognizer.state == .possible {
        recognizer.state = .failed
      }
      if owner == nil, let element = view as? MasonElement { owner = element }
      current = view.superview
    }
    let moved = hypot(up.locationInWindow.x - down.locationInWindow.x, up.locationInWindow.y - down.locationInWindow.y)
    guard let owner, moved <= tapSlop, control.bounds.contains(control.convert(up.locationInWindow, from: nil)) else { return nil }
    let location = owner.uiView.convert(up.locationInWindow, from: nil)
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
    click.target = owner.uiView
    owner.node.mason.dispatch(click, owner.node)
    return click
  }
#endif

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
    state = .cancelled
  }

  override func reset() {
    eventDispatched = false
    startLocationInWindow = nil
  }
}
