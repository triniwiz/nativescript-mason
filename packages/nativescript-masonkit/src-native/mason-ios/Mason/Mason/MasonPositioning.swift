//
//  MasonPositioning.swift
//  Mason
//

import UIKit

enum MasonPositioning {

  // MARK: - Shared

  static func rootView(of node: MasonNode) -> UIView? {
    let root = node.getRootNode()
    if root.type == .document {
      return (root.document?.documentElement as? MasonElement)?.uiView
    }
    return root.view
  }

  // `MasonUIView.isScrollContainer` is true for most plain divs; check the actual overflow instead.
  static func isScrollContainer(_ view: UIView) -> Bool {
    if view is Scroll { return true }
    guard let element = view as? MasonElement else { return false }
    let overflow = element.style.overflow
    return overflow.x == .Scroll || overflow.x == .Auto || overflow.y == .Scroll || overflow.y == .Auto
  }

  // Sum of frame origins from `view` up to `host`; scroll offsets don't affect `frame`, so this ignores scrolling.
  static func accumulateOrigin(_ base: CGPoint, from view: UIView, upTo host: UIView) -> CGPoint {
    var origin = base
    var current = view.superview
    while let cur = current, cur !== host {
      origin.x += cur.frame.origin.x
      origin.y += cur.frame.origin.y
      current = cur.superview
    }
    return origin
  }

  private static func resolvedInset(_ v: MasonLengthPercentageAuto, relativeTo dimension: CGFloat) -> CGFloat? {
    switch v {
    case .Auto: return nil
    case .Zero: return 0
    case .Points(let p): return CGFloat(p)
    case .Percent(let p): return dimension * CGFloat(p) / 100
    }
  }

  // MARK: - Fixed

  // `fixed`'s containing block: the tree root's nearest non-scrolling ancestor.
  static func fixedHost(for node: MasonNode) -> UIView? {
    guard let rootView = rootView(of: node) else { return nil }
    if isScrollContainer(rootView), let superview = rootView.superview {
      return superview
    }
    return rootView
  }

  // Reparents to the fixed host once, then rewrites `frame` from root-relative to the host's space.
  static func applyFixed(node: MasonNode, view: UIView, frame: inout CGRect) {
    guard let host = fixedHost(for: node), let rootView = rootView(of: node) else { return }
    if view.superview !== host {
      if node.fixedOriginalSuperview == nil {
        node.fixedOriginalSuperview = view.superview
      }
      host.addSubview(view)
    }
    host.bringSubviewToFront(view)
    node.fixedRootOrigin = frame.origin
    fixedViews.add(view)
    let origin = accumulateOrigin(rootView.frame.origin, from: rootView, upTo: host)
    frame.origin.x += origin.x
    frame.origin.y += origin.y
  }

  // Views placed by applyFixed, so rootDidMove can find them.
  private static let fixedViews = NSHashTable<UIView>.weakObjects()

  // The host keeps its place when the root moves (e.g. NativeScript lays the page
  // out below the action bar after mason's layout), so re-offset fixed boxes.
  static func rootDidMove(_ root: UIView) {
    guard fixedViews.count > 0 else { return }
    for case let view as UIView in fixedViews.allObjects {
      guard let element = view as? MasonElement, element.node.style.position == .Fixed,
            rootView(of: element.node) === root, let host = view.superview else { continue }
      let origin = accumulateOrigin(root.frame.origin, from: root, upTo: host)
      let target = CGPoint(x: element.node.fixedRootOrigin.x + origin.x, y: element.node.fixedRootOrigin.y + origin.y)
      if view.transform.isIdentity && CATransform3DIsIdentity(view.layer.transform) {
        if view.frame.origin != target { view.frame.origin = target }
      } else {
        let center = CGPoint(x: target.x + view.bounds.width / 2, y: target.y + view.bounds.height / 2)
        if view.center != center { view.center = center }
      }
    }
  }

  // Undoes applyFixed once a node stops being fixed.
  static func clearPositioning(node: MasonNode, view: UIView) {
    node.stickyScrollHost = nil
    fixedViews.remove(view)
    if let original = node.fixedOriginalSuperview {
      node.fixedOriginalSuperview = nil
      if view.superview !== original {
        original.addSubview(view)
      }
    }
  }

  // MARK: - Sticky

  // Walks the native superview chain, not Mason's node-parent chain, which other mounted screens can corrupt.
  private static func nearestScrollAncestor(of view: UIView) -> UIView? {
    var current = view.superview
    while let v = current {
      if isScrollContainer(v) {
        return v
      }
      current = v.superview
    }
    return nil
  }

  // Captures a sticky node's natural position, registers it, and applies its current offset.
  static func captureSticky(node: MasonNode, view: UIView, frame: inout CGRect) {
    guard let host = nearestScrollAncestor(of: view), let parentView = view.superview else {
      node.stickyScrollHost = nil
      node.isStickyEngaged = false
      return
    }

    node.stickyLocalOrigin = frame.origin
    node.stickyNaturalOrigin = accumulateOrigin(frame.origin, from: view, upTo: host)
    node.stickyViewSize = frame.size
    node.stickyContainingBlockRect = CGRect(
      origin: accumulateOrigin(parentView.frame.origin, from: parentView, upTo: host),
      size: parentView.bounds.size
    )
    node.stickyScrollHost = host

    if let scroll = host as? Scroll {
      scroll.registerSticky(view)
    } else if let mv = host as? MasonUIView {
      mv.registerSticky(view)
    }

    let delta = stickyDelta(node: node, host: host)
    frame.origin.x += delta.x
    frame.origin.y += delta.y
    updateEngagement(node: node, view: view, delta: delta)
  }

  // Called on scroll: recomputes every registered sticky descendant's offset.
  static func recomputeSticky(scrollHost: UIView, descendants: NSHashTable<UIView>) {
    for case let view as UIView in descendants.allObjects {
      guard let element = view as? MasonElement else { continue }
      let node = element.node
      guard node.style.position == .Sticky, node.stickyScrollHost === scrollHost else { continue }
      let delta = stickyDelta(node: node, host: scrollHost)
      let newOrigin = CGPoint(x: node.stickyLocalOrigin.x + delta.x, y: node.stickyLocalOrigin.y + delta.y)
      if view.frame.origin != newOrigin {
        view.frame.origin = newOrigin
      }
      updateEngagement(node: node, view: view, delta: delta)
    }
  }

  // Shift off natural position to hold the inset, clamped within the containing block.
  private static func stickyDelta(node: MasonNode, host: UIView) -> CGPoint {
    let viewport = host.bounds
    let natural = node.stickyNaturalOrigin
    let size = node.stickyViewSize
    let cb = node.stickyContainingBlockRect
    let inset = node.style.inset

    var dy: CGFloat = 0
    if let top = resolvedInset(inset.top, relativeTo: cb.height) {
      let minY = viewport.origin.y + top
      if natural.y < minY { dy = minY - natural.y }
    } else if let bottom = resolvedInset(inset.bottom, relativeTo: cb.height) {
      let maxY = viewport.origin.y + viewport.height - bottom - size.height
      if natural.y > maxY { dy = maxY - natural.y }
    }
    let minDy = cb.minY - natural.y
    let maxDy = cb.maxY - size.height - natural.y
    dy = max(minDy, min(dy, maxDy))

    var dx: CGFloat = 0
    if let left = resolvedInset(inset.left, relativeTo: cb.width) {
      let minX = viewport.origin.x + left
      if natural.x < minX { dx = minX - natural.x }
    } else if let right = resolvedInset(inset.right, relativeTo: cb.width) {
      let maxX = viewport.origin.x + viewport.width - right - size.width
      if natural.x > maxX { dx = maxX - natural.x }
    }
    let minDx = cb.minX - natural.x
    let maxDx = cb.maxX - size.width - natural.x
    dx = max(minDx, min(dx, maxDx))

    return CGPoint(x: dx, y: dy)
  }

  private static func updateEngagement(node: MasonNode, view: UIView, delta: CGPoint) {
    let engaged = delta.x != 0 || delta.y != 0
    if engaged != node.isStickyEngaged {
      node.isStickyEngaged = engaged
      if engaged, let superview = view.superview {
        superview.bringSubviewToFront(view)
      }
    }
  }
}
