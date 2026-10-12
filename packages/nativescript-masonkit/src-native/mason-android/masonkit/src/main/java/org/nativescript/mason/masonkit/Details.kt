package org.nativescript.mason.masonkit

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.ListStyleType
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.events.Event

/**
 * HTML `<details>`/`<summary>`. A closed details lays out only its first summary (mason-core hides
 * the rest, leaving their `display` alone). A click on the summary, or TalkBack expanding or
 * collapsing it, toggles the details and dispatches "toggle" on it; setting `open` from code doesn't.
 */
internal object Details {
  const val NONE = 0
  const val DETAILS = 1
  const val SUMMARY = 2

  fun setRole(element: Element, role: Int) {
    val node = element.node
    if (node.detailsRole == role) return
    node.detailsRole = role
    NativeHelpers.nativeNodeSetDetails(node.mason.nativePtr, node.nativePtr, role, node.detailsOpen)
    if (role == SUMMARY) element.ensureNativeClickDispatch()
    // Its text may have been built before it was a summary: the marker goes in now.
    refreshMarker(node)
    element.view.requestLayout()
  }

  fun setOpen(element: Element, open: Boolean) {
    val node = element.node
    if (node.detailsOpen == open) return
    node.detailsOpen = open
    NativeHelpers.nativeNodeSetDetails(node.mason.nativePtr, node.nativePtr, node.detailsRole, open)
    summaryOf(node)?.let { refreshMarker(it) }
    element.invalidateLayout()
  }

  /** The first summary child of a details: what stays visible while closed, and what toggles. */
  fun summaryOf(node: Node): Node? {
    if (node.detailsRole != DETAILS) return null
    return node.children.firstOrNull { it.detailsRole == SUMMARY }
  }

  /** The details [node] is the summary of. */
  fun detailsOf(node: Node): Node? {
    if (node.detailsRole != SUMMARY) return null
    val parent = node.layoutParent ?: return null
    return if (summaryOf(parent) === node) parent else null
  }

  /** Whether a closed details hides [node], as of the last layout pass. */
  fun isHidden(node: Node): Boolean {
    if (node.layoutParent?.detailsRole != DETAILS || node.nativePtr == 0L) return false
    val state = node.stateValue
    return state.capacity() > NodeStateKeys.IS_HIDDEN && state.get(NodeStateKeys.IS_HIDDEN).toInt() != 0
  }

  /**
   * Shows or hides [view] after a layout pass as its details says. Only a change is applied, and
   * showing restores what it was before (core's `visibility` is left alone).
   */
  fun syncVisibility(node: Node, view: View) {
    val hidden = isHidden(node)
    if (hidden == node.detailsHidden) return
    node.detailsHidden = hidden
    val displayNone = node.style.isValueInitialized && node.style.display == Display.None
    if (hidden) {
      // INVISIBLE from `display: none` isn't restored: display may change while hidden.
      node.visibilityBeforeDetails = if (displayNone) View.VISIBLE else view.visibility
      view.visibility = View.INVISIBLE
    } else {
      view.visibility = if (displayNone) View.INVISIBLE else node.visibilityBeforeDetails
    }
  }

  /** Toggles the details [summary] heads and dispatches "toggle" on it. */
  fun toggle(summary: Node): Boolean {
    val details = detailsOf(summary) ?: return false
    val element = details.view as? Element ?: return false
    setOpen(element, !details.detailsOpen)
    element.dispatch(Event(type = "toggle").apply { target = element })
    return true
  }

  /**
   * A click's default action: one inside a summary toggles its details, unless it hit interactive
   * content (a link, button or input) first.
   */
  fun activate(from: Node) {
    var current: Node? = from
    while (current != null) {
      if (current.detailsRole == SUMMARY) {
        toggle(current)
        return
      }
      val view = current.view
      if (view is Button || view is Input || view is TextArea || (view as? TextView)?.type == TextType.A) return
      current = current.parent
    }
  }

  /**
   * The disclosure marker a summary's first text draws inside: ▸ closed, ▾ open. Left off when the
   * summary sets `list-style-type: none`.
   */
  fun marker(text: TextView): String {
    val summary = text.node.layoutParent ?: return ""
    if (summary.detailsRole != SUMMARY) return ""
    if (summary.children.firstOrNull { it.view is TextView } !== text.node) return ""
    val style = summary.style
    if (style.isValueInitialized &&
      style.values.get(StyleKeys.LIST_STYLE_TYPE_STATE) != StyleState.INHERIT &&
      style.values.get(StyleKeys.LIST_STYLE_TYPE) == ListStyleType.None.value
    ) return ""
    return if (detailsOf(summary)?.detailsOpen == true) "▾ " else "▸ "
  }

  fun refreshMarker(summary: Node) {
    val text = summary.children.firstOrNull { it.view is TextView }?.view as? TextView ?: return
    if (text.engine.insideMarker != ListMarkers.insideMarker(text)) {
      text.engine.invalidateInlineSegments()
    }
  }

  // A summary is a button, expanded or collapsed with its details. Its text children make its label.
  fun onInitializeAccessibilityNodeInfo(element: Element, info: AccessibilityNodeInfo) {
    val details = detailsOf(element.node) ?: return
    val open = details.detailsOpen
    info.className = android.widget.Button::class.java.name
    info.isClickable = true
    info.addAction(if (open) AccessibilityNodeInfo.AccessibilityAction.ACTION_COLLAPSE else AccessibilityNodeInfo.AccessibilityAction.ACTION_EXPAND)
    if (Build.VERSION.SDK_INT >= 36) {
      info.expandedState = if (open) AccessibilityNodeInfo.EXPANDED_STATE_FULL else AccessibilityNodeInfo.EXPANDED_STATE_COLLAPSED
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      info.stateDescription = if (open) "Expanded" else "Collapsed"
    }
  }

  /** Expand, collapse or click on a summary; true when handled. */
  fun performAccessibilityAction(element: Element, action: Int, @Suppress("UNUSED_PARAMETER") arguments: Bundle?): Boolean {
    val details = detailsOf(element.node) ?: return false
    return when (action) {
      AccessibilityNodeInfo.ACTION_EXPAND -> !details.detailsOpen && toggle(element.node)
      AccessibilityNodeInfo.ACTION_COLLAPSE -> details.detailsOpen && toggle(element.node)
      else -> false
    }
  }
}
