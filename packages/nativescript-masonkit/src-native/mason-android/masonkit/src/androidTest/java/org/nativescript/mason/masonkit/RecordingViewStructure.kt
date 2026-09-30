package org.nativescript.mason.masonkit

import android.graphics.Matrix
import android.os.Bundle
import android.os.LocaleList
import android.view.ViewStructure
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue

class RecordingViewStructure : ViewStructure() {
  val calls = mutableListOf<String>()
  private var text: CharSequence? = null
  private val extras = Bundle()

  private fun rec(name: String, vararg args: Any?) {
    calls += "$name(${args.joinToString { it?.toString() ?: "null" }})"
  }

  override fun setId(id: Int, packageName: String?, typeName: String?, entryName: String?) = rec("setId", id, packageName, typeName, entryName)
  override fun setDimens(left: Int, top: Int, scrollX: Int, scrollY: Int, width: Int, height: Int) = rec("setDimens", left, top, scrollX, scrollY, width, height)
  override fun setTransformation(matrix: Matrix?) = rec("setTransformation", matrix)
  override fun setElevation(elevation: Float) = rec("setElevation", elevation)
  override fun setAlpha(alpha: Float) = rec("setAlpha", alpha)
  override fun setVisibility(visibility: Int) = rec("setVisibility", visibility)
  override fun setEnabled(state: Boolean) = rec("setEnabled", state)
  override fun setClickable(state: Boolean) = rec("setClickable", state)
  override fun setLongClickable(state: Boolean) = rec("setLongClickable", state)
  override fun setContextClickable(state: Boolean) = rec("setContextClickable", state)
  override fun setFocusable(state: Boolean) = rec("setFocusable", state)
  override fun setFocused(state: Boolean) = rec("setFocused", state)
  override fun setAccessibilityFocused(state: Boolean) = rec("setAccessibilityFocused", state)
  override fun setCheckable(state: Boolean) = rec("setCheckable", state)
  override fun setChecked(state: Boolean) = rec("setChecked", state)
  override fun setSelected(state: Boolean) = rec("setSelected", state)
  override fun setActivated(state: Boolean) = rec("setActivated", state)
  override fun setOpaque(opaque: Boolean) = rec("setOpaque", opaque)
  override fun setClassName(className: String?) = rec("setClassName", className)
  override fun setContentDescription(contentDescription: CharSequence?) = rec("setContentDescription", contentDescription)
  override fun setText(text: CharSequence?) { this.text = text; rec("setText", text?.toString()) }
  override fun setText(text: CharSequence?, selectionStart: Int, selectionEnd: Int) { this.text = text; rec("setText", text?.toString(), selectionStart, selectionEnd) }
  override fun setTextStyle(size: Float, fgColor: Int, bgColor: Int, style: Int) = rec("setTextStyle", size, Integer.toHexString(fgColor), bgColor, style)
  override fun setTextLines(charOffsets: IntArray?, baselines: IntArray?) = rec("setTextLines", charOffsets?.toList(), baselines?.toList())
  override fun setHint(hint: CharSequence?) = rec("setHint", hint)
  override fun getText(): CharSequence? = text
  override fun getTextSelectionStart(): Int = -1
  override fun getTextSelectionEnd(): Int = -1
  override fun getHint(): CharSequence? = null
  override fun getExtras(): Bundle = extras
  override fun hasExtras(): Boolean = false
  override fun setChildCount(num: Int) = rec("setChildCount", num)
  override fun addChildCount(num: Int): Int { rec("addChildCount", num); return 0 }
  override fun getChildCount(): Int = 0
  override fun newChild(index: Int): ViewStructure = RecordingViewStructure()
  override fun asyncNewChild(index: Int): ViewStructure = RecordingViewStructure()
  override fun getAutofillId(): AutofillId? = null
  override fun setAutofillId(id: AutofillId) = rec("setAutofillId")
  override fun setAutofillId(parentId: AutofillId, virtualId: Int) = rec("setAutofillId", virtualId)
  override fun setAutofillType(type: Int) = rec("setAutofillType", type)
  override fun setAutofillHints(hint: Array<out String>?) = rec("setAutofillHints", hint?.toList())
  override fun setAutofillValue(value: AutofillValue?) = rec("setAutofillValue", value)
  override fun setAutofillOptions(options: Array<out CharSequence>?) = rec("setAutofillOptions", options?.toList())
  override fun setInputType(inputType: Int) = rec("setInputType", inputType)
  override fun setDataIsSensitive(sensitive: Boolean) = rec("setDataIsSensitive", sensitive)
  override fun asyncCommit() = rec("asyncCommit")
  override fun setWebDomain(domain: String?) = rec("setWebDomain", domain)
  override fun setLocaleList(localeList: LocaleList?) = rec("setLocaleList", localeList)
  override fun newHtmlInfoBuilder(tagName: String): HtmlInfo.Builder = throw UnsupportedOperationException()
  override fun setHtmlInfo(htmlInfo: HtmlInfo) = rec("setHtmlInfo")
  override fun setMinTextEms(minEms: Int) = rec("setMinTextEms", minEms)
  override fun setMaxTextEms(maxEms: Int) = rec("setMaxTextEms", maxEms)
  override fun setMaxTextLength(maxLength: Int) = rec("setMaxTextLength", maxLength)
  override fun setTextIdEntry(entryName: String) = rec("setTextIdEntry", entryName)
  override fun setHintIdEntry(entryName: String) = rec("setHintIdEntry", entryName)
  override fun setImportantForAutofill(mode: Int) = rec("setImportantForAutofill", mode)
  override fun setReceiveContentMimeTypes(mimeTypes: Array<out String>?) = rec("setReceiveContentMimeTypes", mimeTypes?.toList())
}
