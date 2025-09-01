package org.nativescript.mason.masonkit

import android.view.View

class StyleHelpers {
  companion object {
    @JvmStatic
    fun gridTemplateColumnsCSS(mason: Mason, view: View): String {
      return mason.nodeForView(view).style.gridTemplateColumns.cssValue
    }

    @JvmStatic
    fun gridTemplateRowsCSS(mason: Mason, view: View): String {
      return mason.nodeForView(view).style.gridTemplateRows.cssValue
    }


    @JvmStatic
    fun gridAutoColumnsCSS(mason: Mason, view: View): String {
      return mason.nodeForView(view).style.gridAutoColumns.cssValue
    }

    @JvmStatic
    fun gridAutoRowsCSS(mason: Mason, view: View): String {
      return mason.nodeForView(view).style.gridAutoRows.cssValue
    }
  }
}
