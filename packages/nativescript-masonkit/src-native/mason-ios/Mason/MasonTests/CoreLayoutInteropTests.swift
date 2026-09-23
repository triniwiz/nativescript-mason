//
//  CoreLayoutInteropTests.swift
//  MasonTests
//
//  A Mason root hosting a foreign (non-Mason) container, itself hosting a
//  Mason child added as a plain UIView subview rather than through Mason's
//  node tree — that child is its own root, measured from inside the foreign
//  container's own layout while the outer tree's compute holds Rust's lock.
//

import XCTest
@testable import Mason

/// Forces its child to resolve its own layout before reading its size,
/// simulating a core NativeScript layout container.
private final class ForeignSizingContainer: UIView {
  weak var masonChild: UIView?
  private(set) var sizeThatFitsCallCount = 0

  override func sizeThatFits(_ size: CGSize) -> CGSize {
    sizeThatFitsCallCount += 1
    masonChild?.setNeedsLayout()
    masonChild?.layoutIfNeeded()
    return masonChild?.bounds.size ?? .zero
  }
}

final class CoreLayoutInteropTests: XCTestCase {

  private var mason: NSCMason!

  override func setUpWithError() throws {
    mason = NSCMason.shared
  }

  override func tearDownWithError() throws {
    mason = nil
  }

  /// A Mason root's compute must not deadlock when measuring a foreign leaf
  /// whose `sizeThatFits` forces layout on a nested Mason root. If this
  /// regresses, this test never returns.
  func test_nestedMasonRootInsideForeignContainerDoesNotDeadlockDuringOuterCompute() {
    let root = MasonUIView(mason: mason)
    root.frame = CGRect(x: 0, y: 0, width: 300, height: 300)

    let container = ForeignSizingContainer(frame: CGRect(x: 0, y: 0, width: 300, height: 100))

    let nested = MasonUIView(mason: mason)
    nested.setSize(120, 60)
    container.addSubview(nested)
    container.masonChild = nested

    root.addView(container)

    // Would hang forever pre-fix: measuring `container` forces `nested`
    // through a second, reentrant compute call on the same thread.
    root.computeWithSize(300, 300)

    XCTAssertGreaterThan(
      container.sizeThatFitsCallCount, 0,
      "outer compute should have measured the foreign container"
    )

    // The nested root's compute was deferred — let the posted main-queue
    // work run, across however many follow-up passes get scheduled.
    RunLoop.main.run(until: Date().addingTimeInterval(0.2))
    RunLoop.main.run(until: Date().addingTimeInterval(0.2))

    XCTAssertGreaterThan(
      nested.frame.width, 0,
      "nested Mason root should end up with a real computed size after the deferred pass runs"
    )
    XCTAssertGreaterThan(
      nested.frame.height, 0,
      "nested Mason root should end up with a real computed size after the deferred pass runs"
    )
  }

  /// A Mason child added as a plain subview of a foreign container (not
  /// through Mason's node tree) should still resolve to a real, non-zero size.
  func test_masonChildInsideForeignContainerResolvesRealSize() {
    let root = MasonUIView(mason: mason)
    root.frame = CGRect(x: 0, y: 0, width: 300, height: 300)

    let container = UIView(frame: CGRect(x: 0, y: 0, width: 300, height: 80))
    let paragraph = MasonUIView(mason: mason)
    paragraph.setSize(200, 44)
    container.addSubview(paragraph)

    root.addView(container)
    root.computeWithSize(300, 300)

    RunLoop.main.run(until: Date().addingTimeInterval(0.2))
    RunLoop.main.run(until: Date().addingTimeInterval(0.2))

    XCTAssertGreaterThan(paragraph.frame.width, 0, "Mason child inside a foreign container should be visible")
    XCTAssertGreaterThan(paragraph.frame.height, 0, "Mason child inside a foreign container should be visible")
  }
}
