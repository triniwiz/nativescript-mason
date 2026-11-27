//
//  PointerEventsTests.swift
//  MasonTests
//
//  DOM pointer events through MasonPointerRecognizer, and CSS pointer-events in hit testing.
//

import XCTest
import UIKit
@testable import Mason

private final class FakeTouch: UITouch {
  var point: CGPoint
  var hitView: UIView?
  var hostWindow: UIWindow?

  init(_ point: CGPoint, view: UIView?, window: UIWindow?) {
    self.point = point
    self.hitView = view
    self.hostWindow = window
    super.init()
  }

  override var view: UIView? { hitView }
  override var window: UIWindow? { hostWindow }
  override var type: UITouch.TouchType { .direct }
  override var force: CGFloat { 0 }
  override var maximumPossibleForce: CGFloat { 0 }
  override var majorRadius: CGFloat { 10 }

  // `point` is in window coordinates.
  override func location(in view: UIView?) -> CGPoint {
    guard let view else { return point }
    return view.convert(point, from: nil)
  }
}

final class PointerEventsTests: XCTestCase {
  private var window: UIWindow!
  private var root: MasonUIView!
  private var a: MasonUIView!
  private var b: MasonUIView!
  private var log: [String] = []

  private let types = ["pointerdown", "pointermove", "pointerup", "pointercancel", "pointerover", "pointerout",
                       "pointerenter", "pointerleave", "gotpointercapture", "lostpointercapture"]

  /// root 300x400 at (0, 0); a at (0, 0) 100x100; b at (50, 50) 100x100, above a.
  override func setUp() {
    super.setUp()
    window = UIWindow(frame: CGRect(x: 0, y: 0, width: 300, height: 400))
    root = MasonUIView(mason: NSCMason.shared)
    a = MasonUIView(mason: NSCMason.shared)
    b = MasonUIView(mason: NSCMason.shared)
    root.addView(a)
    root.addView(b)
    window.addSubview(root)
    root.frame = CGRect(x: 0, y: 0, width: 300, height: 400)
    a.frame = CGRect(x: 0, y: 0, width: 100, height: 100)
    b.frame = CGRect(x: 50, y: 50, width: 100, height: 100)
    window.isHidden = false
    log = []
  }

  override func tearDown() {
    for pointer in MasonPointerDispatch.shared.pointers.values { MasonPointerDispatch.shared.end(pointer) }
    window.isHidden = true
    window = nil
    super.tearDown()
  }

  private func name(_ target: Any?) -> String {
    switch target as AnyObject? {
    case let v where v === root: return "root"
    case let v where v === a: return "a"
    case let v where v === b: return "b"
    case nil: return "nil"
    default: return "?"
    }
  }

  private func record(_ on: MasonUIView) {
    for type in types {
      on.addEventListener(type) { [unowned self] e in self.log.append("\(e.type):\(self.name(e.target))") }
    }
  }

  private func recognizer(_ view: UIView) -> MasonPointerRecognizer {
    view.gestureRecognizers!.compactMap { $0 as? MasonPointerRecognizer }.first!
  }

  private func touch(at point: CGPoint) -> FakeTouch {
    FakeTouch(point, view: window.hitTest(point, with: nil), window: window)
  }

  func testTapRaisesTheDomSequenceAtTheTopmostElement() {
    record(root)
    let r = recognizer(root)
    let t = touch(at: CGPoint(x: 75, y: 75))
    r.touchesBegan([t], with: UIEvent())
    t.point = CGPoint(x: 80, y: 80)
    r.touchesMoved([t], with: UIEvent())
    r.touchesEnded([t], with: UIEvent())
    XCTAssertEqual(log, ["pointerover:b", "pointerenter:root", "pointerdown:b", "gotpointercapture:b",
                         "pointermove:b", "pointerup:b", "lostpointercapture:b", "pointerout:b", "pointerleave:root"])
  }

  func testEventFields() {
    var down: MasonPointerEvent?
    root.addEventListener("pointerdown") { down = $0 as? MasonPointerEvent }
    let r = recognizer(root)
    let t = touch(at: CGPoint(x: 75, y: 90))
    r.touchesBegan([t], with: UIEvent())
    r.touchesEnded([t], with: UIEvent())
    let e = try! XCTUnwrap(down)
    XCTAssertEqual(e.clientX, 75)
    XCTAssertEqual(e.clientY, 90)
    XCTAssertEqual(e.offsetX, 25, "relative to b at (50, 50)")
    XCTAssertEqual(e.offsetY, 40)
    XCTAssertEqual(e.pointerType, "touch")
    XCTAssertTrue(e.isPrimary)
    XCTAssertGreaterThanOrEqual(e.pointerId, 2)
    XCTAssertEqual(e.button, 0)
    XCTAssertEqual(e.buttons, 1)
    XCTAssertEqual(e.pressure, 0.5, "no force sensor")
    XCTAssertEqual(e.width, 20)
    XCTAssertFalse(e.bubbles, "Mason bubbles it; a DOM shim must not bubble it again")
    XCTAssertTrue(e.cancelable)
  }

  func testOnlyOneRecognizerRaisesEachTouch() {
    record(root)
    b.addEventListener("pointerdown") { _ in }
    let outer = recognizer(root)
    let inner = recognizer(b)
    let t = touch(at: CGPoint(x: 75, y: 75))
    inner.touchesBegan([t], with: UIEvent())
    outer.touchesBegan([t], with: UIEvent())
    inner.touchesEnded([t], with: UIEvent())
    outer.touchesEnded([t], with: UIEvent())
    XCTAssertEqual(log.filter { $0.hasPrefix("pointerdown") || $0.hasPrefix("pointerup") }, ["pointerdown:b", "pointerup:b"])
  }

  func testTouchStaysCapturedToItsTarget() {
    record(root)
    let r = recognizer(root)
    let t = touch(at: CGPoint(x: 20, y: 20))
    r.touchesBegan([t], with: UIEvent())
    t.point = CGPoint(x: 250, y: 300)
    r.touchesMoved([t], with: UIEvent())
    r.touchesEnded([t], with: UIEvent())
    XCTAssertEqual(log.filter { $0.hasPrefix("pointermove") || $0.hasPrefix("pointerup") }, ["pointermove:a", "pointerup:a"])
  }

  func testExplicitCaptureRetargetsTheStream() {
    record(root)
    a.addEventListener("pointerdown") { [unowned self] e in
      _ = self.root.mason_setPointerCapture((e as! MasonPointerEvent).pointerId)
    }
    let r = recognizer(root)
    let t = touch(at: CGPoint(x: 20, y: 20))
    r.touchesBegan([t], with: UIEvent())
    t.point = CGPoint(x: 30, y: 30)
    r.touchesMoved([t], with: UIEvent())
    r.touchesEnded([t], with: UIEvent())
    XCTAssertEqual(log.filter { !$0.contains("over") && !$0.contains("out") && !$0.contains("enter") && !$0.contains("leave") },
                   ["pointerdown:a", "gotpointercapture:root", "pointermove:root", "pointerup:root", "lostpointercapture:root"])
  }

  func testATakeoverCancelsThePointer() {
    record(root)
    let r = recognizer(root)
    let t = touch(at: CGPoint(x: 20, y: 20))
    r.touchesBegan([t], with: UIEvent())
    // A pan recognizing fails the observer: UIKit resets it with the touch still down.
    r.reset()
    XCTAssertEqual(Array(log.suffix(3)), ["pointercancel:a", "pointerout:a", "pointerleave:root"])
    let pan = UIPanGestureRecognizer()
    XCTAssertTrue(r.canBePrevented(by: pan))
    XCTAssertFalse(r.canBePrevented(by: UITapGestureRecognizer()))
    XCTAssertFalse(r.canPrevent(pan))
  }

  func testPointerEventsNoneHitTesting() {
    b.node.pointerEvents = MasonPointerEventsValue.none
    // Where b overlaps a, a is hit; where only b covers, what's beneath it is.
    XCTAssertTrue(root.hitTest(CGPoint(x: 75, y: 75), with: nil) === a)
    XCTAssertTrue(root.hitTest(CGPoint(x: 125, y: 125), with: nil) === root)
    XCTAssertTrue(MasonElementHelpers.elementFromPoint(root, x: 75, y: 75) === a)
    XCTAssertTrue(MasonElementHelpers.elementFromPoint(root, x: 125, y: 125) === root)

    // A child set back to auto still takes touches, and its events bubble through b.
    let child = MasonUIView(mason: NSCMason.shared)
    b.addView(child)
    child.frame = CGRect(x: 0, y: 0, width: 20, height: 20)
    XCTAssertTrue(root.hitTest(CGPoint(x: 55, y: 55), with: nil) === child)
    var bubbled = false
    b.addEventListener("pointerdown") { _ in bubbled = true }
    let r = recognizer(b)
    let t = touch(at: CGPoint(x: 55, y: 55))
    r.touchesBegan([t], with: UIEvent())
    r.touchesEnded([t], with: UIEvent())
    XCTAssertTrue(bubbled)
  }

  func testInlineTargetSkipsANoneAncestor() {
    b.node.pointerEvents = MasonPointerEventsValue.none
    XCTAssertTrue(MasonPointerDispatch.target(hitView: b, point: .zero) === root.node)
  }
}
