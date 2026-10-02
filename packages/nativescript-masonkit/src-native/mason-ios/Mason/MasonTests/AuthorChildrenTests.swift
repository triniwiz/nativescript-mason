//
//  AuthorChildrenTests.swift
//  MasonTests
//
//  Author children skip anonymous wrappers; containers that never had one
//  answer from their layout children directly.
//

import XCTest
@testable import Mason

final class AuthorChildrenTests: XCTestCase {

  func testWithoutAnonymousChildrenTheAuthorChildrenAreTheLayoutChildren() {
    let mason = NSCMason.shared
    let parent = MasonUIView(mason: mason)
    let views = (0..<3).map { _ in MasonUIView(mason: mason) }
    for (i, v) in views.enumerated() { parent.node.addChildAt(v.node, i) }
    XCTAssertEqual(parent.node.getChildren(), views.map { $0.node })
    XCTAssertEqual(parent.node.getChildren(), parent.node.getLayoutChildren())
  }

  func testTextInAnAnonymousWrapperCountsAsOneAuthorChild() {
    let mason = NSCMason.shared
    let parent = MasonUIView(mason: mason)
    let first = MasonUIView(mason: mason)
    let text = MasonTextNode(mason: mason, data: "hello")
    let last = MasonUIView(mason: mason)
    parent.node.addChildAt(first.node, 0)
    parent.node.addChildAt(text, 1)
    // Index 2 is one past the author children: an append.
    parent.node.addChildAt(last.node, 2)

    let layout = parent.node.getLayoutChildren()
    XCTAssertTrue(layout.contains { $0.isAnonymous }, "text should sit in an anonymous wrapper")
    XCTAssertEqual(parent.node.getChildren(), [first.node, text, last.node])

    // A middle insert lands before the text, not before its wrapper's position by accident.
    let middle = MasonUIView(mason: mason)
    parent.node.addChildAt(middle.node, 1)
    XCTAssertEqual(parent.node.getChildren(), [first.node, middle.node, text, last.node])
  }

  func testRemovingAnElementLeavesTheOthersInOrder() {
    let mason = NSCMason.shared
    let parent = MasonUIView(mason: mason)
    let views = (0..<4).map { _ in MasonUIView(mason: mason) }
    for (i, v) in views.enumerated() { parent.node.addChildAt(v.node, i) }
    parent.node.removeChild(views[1].node)
    XCTAssertEqual(parent.node.getChildren(), [views[0].node, views[2].node, views[3].node])
    XCTAssertNil(views[1].node.parent)
  }
}
