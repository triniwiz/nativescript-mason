//
//  Details.swift
//  Mason
//

import UIKit

/// HTML `<details>`/`<summary>`. A closed details lays out only its first summary (mason-core hides
/// the rest, leaving their `display` alone). A click on the summary, or VoiceOver activating it,
/// toggles the details and dispatches "toggle" on it; setting `open` from code doesn't.
internal enum MasonDetails {
  static let none = 0
  static let details = 1
  static let summary = 2

  static func setRole(_ node: MasonNode, _ role: Int) {
    guard node.detailsRole != role else { return }
    node.detailsRole = role
    mason_node_set_details(node.mason.nativePtr, node.nativePtr, UInt8(role), node.detailsOpen)
    if role == summary, let element = node.view as? MasonElement & MasonEventTarget {
      element.ensureClickGesture()
    }
    // Its text may have been built before it was a summary: the marker goes in now.
    refreshMarker(node)
    node.view?.setNeedsLayout()
  }

  static func setOpen(_ node: MasonNode, _ open: Bool) {
    guard node.detailsOpen != open else { return }
    node.detailsOpen = open
    mason_node_set_details(node.mason.nativePtr, node.nativePtr, UInt8(node.detailsRole), open)
    if let summary = summary(of: node) {
      refreshMarker(summary)
    }
    (node.view as? MasonElement)?.requestLayout()
    UIAccessibility.post(notification: .layoutChanged, argument: nil)
  }

  /// The first summary child of a details: what stays visible while closed, and what toggles.
  static func summary(of node: MasonNode) -> MasonNode? {
    guard node.detailsRole == details else { return nil }
    return node.children.first { $0.detailsRole == summary }
  }

  /// The details this node is the summary of.
  static func details(of node: MasonNode) -> MasonNode? {
    guard node.detailsRole == summary, let parent = node.layoutParent, summary(of: parent) === node else { return nil }
    return parent
  }

  /// Whether a closed details hides this node, as of the last layout pass.
  static func isHidden(_ node: MasonNode) -> Bool {
    guard node.layoutParent?.detailsRole == details else { return false }
    var len: Int = 0
    guard let ptr = mason_node_get_state_buffer(node.mason.nativePtr, node.nativePtr, &len), len > 5 else { return false }
    return ptr[5] != 0
  }

  /// Toggles the details `summary` heads and dispatches "toggle" on it.
  @discardableResult
  static func toggle(summary node: MasonNode) -> Bool {
    guard let details = details(of: node) else { return false }
    setOpen(details, !details.detailsOpen)
    let event = MasonEvent(type: "toggle")
    event.target = details.view
    details.mason.dispatch(event, details)
    return true
  }

  /// A click's default action: one inside a summary toggles its details, unless it hit
  /// interactive content (a link, button or input) first.
  static func activate(from node: MasonNode) {
    var current: MasonNode? = node
    while let n = current {
      if n.detailsRole == summary {
        toggle(summary: n)
        return
      }
      if let view = n.view, view is Button || view is MasonInput || view is MasonTextArea || (view as? MasonText)?.type == .A {
        return
      }
      current = n.parent
    }
  }

  /// The disclosure marker a summary's first text draws inside: ▸ closed, ▾ open. Left off when
  /// the summary sets `list-style-type: none`.
  static func marker(for text: MasonText) -> String {
    guard let summaryNode = text.node.layoutParent, summaryNode.detailsRole == summary,
          summaryNode.children.first(where: { $0.view is MasonText }) === text.node else { return "" }
    let style = summaryNode.style
    if style.isValueInitialized, style.getUInt8(StyleKeys.LIST_STYLE_TYPE_STATE) != 0,
       Int8(bitPattern: style.getUInt8(StyleKeys.LIST_STYLE_TYPE)) == ListStyleType.None.rawValue {
      return ""
    }
    return details(of: summaryNode)?.detailsOpen == true ? "\u{25BE} " : "\u{25B8} "
  }

  static func refreshMarker(_ summaryNode: MasonNode) {
    guard let text = summaryNode.children.first(where: { $0.view is MasonText })?.view as? MasonText else { return }
    if text.engine.insideMarker != MasonUIView.insideMarker(for: text) {
      text.engine.invalidate()
    }
  }

  /// A summary's accessible name: its text, without the marker.
  static func accessibleName(_ view: UIView) -> String {
    var parts: [String] = []
    func collect(_ v: UIView) {
      for sub in v.subviews where !sub.isHidden {
        if let text = sub as? MasonText {
          let label = (text.accessibilityLabel ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
          if !label.isEmpty { parts.append(label) }
        } else {
          collect(sub)
        }
      }
    }
    collect(view)
    return parts.joined(separator: " ")
  }
}
