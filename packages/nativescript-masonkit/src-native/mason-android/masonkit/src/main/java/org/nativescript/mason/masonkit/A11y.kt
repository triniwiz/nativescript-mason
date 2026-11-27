package org.nativescript.mason.masonkit

import android.content.Context
import android.os.Build
import android.view.View
import android.view.accessibility.AccessibilityManager

internal object A11y {
  @Volatile
  private var manager: AccessibilityManager? = null

  fun serviceOn(context: Context): Boolean {
    val m = manager ?: (context.applicationContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager)
      ?.also { manager = it } ?: return true
    return m.isEnabled
  }
}

/**
 * Runs [init] (a super.onInitializeAccessibilityNodeInfo call) without the view's accessibility delegate while no
 * accessibility service is on. Android 17's content capture builds a node per appeared view; NativeScript core's
 * delegate is JavaScript (a V8 round trip and a Resources.getIdentifier per node) and only adds what a service
 * reads (role class name, clickable, heading, checked, view-id resource name).
 */
internal inline fun View.withoutDelegateWhileNoService(init: () -> Unit) {
  val delegate = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) accessibilityDelegate else null
  if (delegate == null || A11y.serviceOn(context)) return init()
  setAccessibilityDelegate(null)
  try {
    init()
  } finally {
    setAccessibilityDelegate(delegate)
  }
}
