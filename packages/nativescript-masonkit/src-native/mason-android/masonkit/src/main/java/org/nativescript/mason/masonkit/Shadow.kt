package org.nativescript.mason.masonkit

import android.graphics.Color

internal fun parseCssRecords(value: String, kind: Int, style: Style? = null): DoubleArray {
  val mason = Mason.shared
  return Mason.nativeParseCss(
    value, kind, mason.scale, style?.fontSize ?: mason.rootFontSize, mason.rootFontSize,
    mason.viewportWidth, mason.viewportHeight, style?.color ?: Color.BLACK
  ) ?: doubleArrayOf()
}

internal fun setStyleCssRecords(style: Style, value: String, kind: StyleRecordKind): DoubleArray =
  installStyleCssRecords(style, value, kind) ?: doubleArrayOf()

internal fun installStyleCssRecords(style: Style, value: String, kind: StyleRecordKind): DoubleArray? {
  val node = style.node
  val mason = node.mason
  val attached = !node.isPlaceholder
  val deferred = attached && mason.inCompute
  if (attached && !deferred) style.prepareMut()
  val records = Mason.nativeSetStyleCssRecords(
    if (attached && !deferred) mason.nativePtr else 0L, if (attached) node.nativePtr else 0L,
    kind.id, value, mason.scale, style.fontSize,
    mason.rootFontSize, mason.viewportWidth, mason.viewportHeight, style.color
  )
  if (deferred && (kind != StyleRecordKind.FONT_FEATURES || records != null)) {
    mason.deferStyleRecords(style, kind)
  }
  return records
}

class Shadow {
  data class TextShadow(
    val offsetX: Float,
    val offsetY: Float,
    val blurRadius: Float,
    val color: Int
  )

  data class BoxShadow(
    val offsetX: Float,
    val offsetY: Float,
    val blurRadius: Float,
    val spreadRadius: Float,
    val color: Int,
    val inset: Boolean
  )

  companion object {
    fun parseTextShadow(style: Style, value: String): List<TextShadow> =
      readTextShadows(parseCssRecords(value, CssParseKind.SHADOWS, style))

    fun parseBoxShadow(style: Style, value: String): List<BoxShadow> =
      readBoxShadows(parseCssRecords(value, CssParseKind.SHADOWS, style))

    internal fun setStyleTextShadows(style: Style, value: String): List<TextShadow> =
      readTextShadows(setStyleCssRecords(style, value, StyleRecordKind.TEXT_SHADOW))

    internal fun setStyleBoxShadows(style: Style, value: String): List<BoxShadow> =
      readBoxShadows(setStyleCssRecords(style, value, StyleRecordKind.BOX_SHADOW))

    internal fun readTextShadows(records: DoubleArray): List<TextShadow> {
      return (records.indices step ShadowRecord.STRIDE).map { index ->
        TextShadow(records[index + ShadowRecord.X].toFloat(), records[index + ShadowRecord.Y].toFloat(),
          records[index + ShadowRecord.BLUR].toFloat(), records[index + ShadowRecord.COLOR].toLong().toInt())
      }
    }

    internal fun readBoxShadows(records: DoubleArray): List<BoxShadow> {
      return (records.indices step ShadowRecord.STRIDE).map { index ->
        BoxShadow(records[index + ShadowRecord.X].toFloat(), records[index + ShadowRecord.Y].toFloat(),
          records[index + ShadowRecord.BLUR].toFloat(), records[index + ShadowRecord.SPREAD].toFloat(),
          records[index + ShadowRecord.COLOR].toLong().toInt(), records[index + ShadowRecord.INSET] != 0.0)
      }
    }
  }
}
