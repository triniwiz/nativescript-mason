import XCTest
@testable import Mason

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

final class ScrollContractTests: XCTestCase {
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

  func testBothAxesBoundsAndPendingSeek() {
    let view = fixture()
    var changes = [CGPoint]()
    view.scrollChangeListener = { changes.append(view.contentOffset) }
    view.scrollToOffset(CGPoint(x: 10, y: 20), animated: false)
    view.scrollToOffset(CGPoint(x: 300, y: 1200), animated: false)
    XCTAssertEqual(view.contentOffset, .zero)
    XCTAssertEqual(view.scrollableWidth, 0)
    XCTAssertEqual(view.scrollableHeight, 0)
    layout(view)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 300, y: 1200))
    XCTAssertGreaterThan(view.scrollableWidth, 300)
    XCTAssertGreaterThan(view.scrollableHeight, 1200)
    view.scrollToOffset(CGPoint(x: 99999, y: -100), animated: false)
    XCTAssertEqual(view.contentOffset, CGPoint(x: view.scrollableWidth, y: 0))
    XCTAssertEqual(changes.last, view.contentOffset)
    XCTAssertEqual(view.subviews.first!.frame.minY - view.bounds.minY, 0)
    view.scrollChangeListener = nil
    let count = changes.count
    view.scrollToOffset(.zero, animated: false)
    XCTAssertEqual(changes.count, count)
    print("SCROLL_CONTRACT iOS ranges=\(view.scrollableWidth),\(view.scrollableHeight) offsets=\(view.contentOffset) events=\(count)")
    view.configure { $0.overflow = MasonPoint(.Hidden, .Hidden) }
    layout(view)
    view.scrollToOffset(CGPoint(x: 100, y: 100), animated: false)
    XCTAssertEqual(view.contentOffset, .zero)
    XCTAssertEqual(view.scrollableWidth, 0)
    XCTAssertEqual(view.scrollableHeight, 0)
  }

  func testPanNotifiesWithCurrentOffsetsAndInterruptsAnimation() {
    let view = fixture()
    layout(view)
    var observed = CGPoint.zero
    view.scrollChangeListener = { observed = view.contentOffset }
    view.scrollToOffset(CGPoint(x: 400, y: 1200), animated: true)
    let pan = SyntheticScrollPan()
    view._handleScrollPan(pan)
    pan.delta = CGPoint(x: -80, y: -120)
    pan.simulatedState = .changed
    view._handleScrollPan(pan)
    XCTAssertEqual(view.contentOffset, CGPoint(x: 80, y: 120))
    XCTAssertEqual(observed, view.contentOffset)
    pan.simulatedState = .ended
    view._handleScrollPan(pan)
    RunLoop.main.run(until: Date().addingTimeInterval(0.35))
    XCTAssertEqual(view.contentOffset, CGPoint(x: 80, y: 120))
    view.scrollChangeListener = nil
  }

  func testAnimationReplacementStopAndDetach() {
    let view = fixture()
    layout(view)
    view.scrollToOffset(CGPoint(x: 400, y: 1200), animated: true)
    RunLoop.main.run(until: Date().addingTimeInterval(0.08))
    XCTAssertGreaterThan(view.contentOffset.y, 0)
    XCTAssertLessThan(view.contentOffset.y, 1200)
    view.scrollToOffset(CGPoint(x: 100, y: 500), animated: true)
    RunLoop.main.run(until: Date().addingTimeInterval(0.4))
    XCTAssertEqual(view.contentOffset, CGPoint(x: 100, y: 500))
    view.scrollToOffset(CGPoint(x: 400, y: 1200), animated: true)
    view.scrollToOffset(CGPoint(x: 20, y: 40), animated: false)
    RunLoop.main.run(until: Date().addingTimeInterval(0.35))
    XCTAssertEqual(view.contentOffset, CGPoint(x: 20, y: 40))
    view.scrollToOffset(CGPoint(x: 400, y: 1200), animated: true)
    view.stopScrolling()
    let stopped = view.contentOffset
    RunLoop.main.run(until: Date().addingTimeInterval(0.35))
    XCTAssertEqual(view.contentOffset, stopped)
    view.scrollToOffset(CGPoint(x: 400, y: 1200), animated: true)
    view.willMove(toWindow: nil)
    RunLoop.main.run(until: Date().addingTimeInterval(0.35))
    XCTAssertEqual(view.contentOffset, stopped)
  }
}
