//
//  ScrollTests.swift
//  MasonTests
//
//  Element scrolling: clamping, seeks before layout, events, smooth scrolls and drags.
//

import XCTest
@testable import Mason

// Drives _handleScrollPan without a touch.
private final class SyntheticScrollPan: UIPanGestureRecognizer {
  var simulatedState: UIGestureRecognizer.State = .began
  var delta: CGPoint = .zero
  override var state: UIGestureRecognizer.State {
    get { simulatedState }
    set { simulatedState = newValue }
  }
  override func translation(in view: UIView?) -> CGPoint { delta }
  override func velocity(in view: UIView?) -> CGPoint { .zero }
}

final class ScrollTests: XCTestCase {
  // 200x150 viewport over 1000x2000 content: range (800, 1850).
  private func fixture() -> MasonUIView {
    let view = MasonUIView(mason: NSCMason.shared)
    view.isScrollContainer = true
    view.setSize(200 * NSCMason.scale, 150 * NSCMason.scale)
    view.configure { $0.overflow = MasonPoint(.Scroll, .Scroll) }
    let child = MasonUIView(mason: NSCMason.shared)
    child.setSize(1000 * NSCMason.scale, 2000 * NSCMason.scale)
    child.configure { $0.flexShrink = 0 }
    view.addView(child)
    return view
  }

  private func layout(_ view: MasonUIView) {
    view.frame = CGRect(x: 0, y: 0, width: 200, height: 150)
    view.computeWithSize(200 * NSCMason.scale, 150 * NSCMason.scale)
    view.setNeedsLayout()
    view.layoutIfNeeded()
  }

  private func spin(_ seconds: TimeInterval) {
    RunLoop.main.run(until: Date().addingTimeInterval(seconds))
  }

  private func count(_ view: MasonUIView, _ type: String) -> () -> Int {
    var n = 0
    _ = view.addEventListener(type) { _ in n += 1 }
    return { n }
  }

  func testSeekBeforeLayoutIsKeptPerAxisAndClampedAfterLayout() {
    let view = fixture()
    MasonWebScroll.scrollTo(view, 10, 20, smooth: false)
    MasonWebScroll.scrollTo(view, 300, .nan, smooth: false)
    MasonWebScroll.scrollTo(view, .nan, 99999, smooth: false)
    XCTAssertEqual(view.contentOffset, .zero)
    layout(view)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 300, y: view.webScrollRange.y))
    XCTAssertEqual(view.webScrollRange, CGPoint(x: 800, y: 1850))
  }

  func testClampsBothAxesAndOverflowHiddenStaysPut() {
    let view = fixture()
    layout(view)
    view.webScrollTo(99999, -100, smooth: false)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 800, y: 0))
    XCTAssertEqual(MasonWebScroll.scrollSize(view), CGSize(width: 1000, height: 2000))
    XCTAssertEqual(MasonWebScroll.clientSize(view), CGSize(width: 200, height: 150))
    view.webScrollTo(0, 0, smooth: false)
    view.configure { $0.overflow = MasonPoint(.Hidden, .Hidden) }
    layout(view)
    view.webScrollTo(100, 100, smooth: false)
    XCTAssertEqual(view.contentOffset, .zero)
    XCTAssertEqual(view.webScrollRange, .zero)
  }

  func testShrinkingContentClampsTheCurrentOffset() throws {
    let view = fixture()
    let child = try XCTUnwrap(view.subviews.first as? MasonUIView)
    layout(view)
    view.webScrollTo(800, 1850, smooth: false)
    child.setSize(300 * NSCMason.scale, 400 * NSCMason.scale)
    layout(view)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 100, y: 250))
  }

  func testDisablingScrollOverflowResetsAnExistingOffset() {
    let view = fixture()
    layout(view)
    view.webScrollTo(800, 1850, smooth: false)
    view.configure { $0.overflow = MasonPoint(.Hidden, .Hidden) }
    layout(view)
    XCTAssertEqual(view.contentOffset, .zero)
    view.configure { $0.overflow = MasonPoint(.Scroll, .Scroll) }
    layout(view)
    XCTAssertEqual(view.contentOffset, .zero, "re-enabling must not restore the stale offset")
  }

  func testEventsCoalescePerTurnAndStopWithoutListeners() {
    let view = fixture()
    layout(view)
    // No listener: nothing is queued.
    view.webScrollTo(0, 50, smooth: false)
    XCTAssertFalse(view.node.listensForScroll)
    let scrolls = count(view, "scroll")
    let ends = count(view, "scrollend")
    view.webScrollTo(0, 100, smooth: false)
    view.webScrollTo(0, 200, smooth: false)
    view.webScrollTo(10, 300, smooth: false)
    // Asynchronous, as on the web.
    XCTAssertEqual(scrolls(), 0)
    spin(0.05)
    XCTAssertEqual(scrolls(), 1)
    XCTAssertEqual(ends(), 1)
    _ = view.removeEventListener("scroll")
    _ = view.removeEventListener("scrollend")
    view.webScrollTo(0, 0, smooth: false)
    spin(0.05)
    XCTAssertEqual(scrolls(), 1)
    XCTAssertFalse(view.node.listensForScroll)
  }

  func testSmoothScrollReplacementStopAndDetach() {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 400, height: 400))
    let host = UIView(frame: CGRect(x: 0, y: 0, width: 200, height: 150))
    window.addSubview(host)
    let view = fixture()
    host.addSubview(view)
    layout(view)
    let ends = count(view, "scrollend")

    view.webScrollTo(400, 1200, smooth: true)
    spin(0.08)
    XCTAssertGreaterThan(view.contentOffset.y, 0)
    XCTAssertLessThan(view.contentOffset.y, 1200)
    // A new smooth scroll replaces it; only the last one ends.
    view.webScrollTo(100, 500, smooth: true)
    spin(0.45)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 100, y: 500))
    XCTAssertEqual(ends(), 1)

    // An instant seek cancels a running smooth scroll.
    view.webScrollTo(400, 1200, smooth: true)
    view.webScrollTo(20, 40, smooth: false)
    spin(0.4)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 20, y: 40))

    // Seeking to the current offset stops it where it is.
    view.webScrollTo(400, 1200, smooth: true)
    spin(0.08)
    view.webScrollTo(view.contentOffset.x, view.contentOffset.y, smooth: false)
    let stopped = view.contentOffset
    spin(0.4)
    XCTAssertEqual(view.contentOffset, stopped)

    // Leaving the window stops it too, and still ends it.
    let before = ends()
    view.webScrollTo(400, 1200, smooth: true)
    spin(0.05)
    view.removeFromSuperview()
    let detached = view.contentOffset
    spin(0.4)
    XCTAssertEqual(view.contentOffset, detached)
    XCTAssertEqual(ends(), before + 1)
  }

  func testSeekDuringDragIsKeptAndTheDragContinuesFromIt() {
    let view = fixture()
    layout(view)
    let pan = SyntheticScrollPan()
    view._handleScrollPan(pan)
    pan.delta = CGPoint(x: -80, y: -120)
    pan.simulatedState = .changed
    view._handleScrollPan(pan)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 80, y: 120))

    view.webScrollTo(300, 500, smooth: true)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 300, y: 500))
    // The finger moves another 10pt on each axis.
    pan.delta = CGPoint(x: -90, y: -130)
    view._handleScrollPan(pan)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 310, y: 510))

    pan.simulatedState = .ended
    view._handleScrollPan(pan)
    spin(0.35)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 310, y: 510))
  }
}
