package org.nativescript.mason.masonkit

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater

class ViewLayoutFactory : LayoutInflater.Factory {
  companion object {
    @JvmStatic
    val instance = ViewLayoutFactory()
  }

  override fun onCreateView(
    name: String,
    context: Context,
    attrs: AttributeSet
  ): android.view.View? {
    if (View::class.simpleName == name) {
      return View(context, attrs)
    }
    return null
  }
}
