import XCTest
@testable import Mason

final class AnonymousContainerRemovalTests: XCTestCase {

  func test_remove_non_text_child_detaches_view() {
    let mason = NSCMason.shared
    let parent = mason.createView()
    let child = mason.createView()

    // Attach child to parent
    parent.addView(child)
    XCTAssertTrue(child.uiView.superview === parent.uiView)

    // Remove child via node API
    let removed = parent.node.removeChild(child.node)
    XCTAssertNotNil(removed)

    // Child's UIView should no longer have a superview
    XCTAssertNil(child.uiView.superview)
  }

}
