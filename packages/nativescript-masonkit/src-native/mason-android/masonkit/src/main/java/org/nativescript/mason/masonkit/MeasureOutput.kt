package org.nativescript.mason.masonkit

object MeasureOutput {
  // Tagged quiet-NaN payloads for MinContent/MaxContent
  const val MIN_BITS: Int = 0x7FC00001
  const val MAX_BITS: Int = 0x7FC00002
  const val ZERO: Long = 0L

  @JvmStatic
  fun isMinContent(value: Float): Boolean = value.toRawBits() == MIN_BITS

  @JvmStatic
  fun isMaxContent(value: Float): Boolean = value.toRawBits() == MAX_BITS

  fun make(width: Float, height: Float): Long {
    val wBits = width.toRawBits().toLong() and 0xFFFFFFFFL
    val hBits = height.toRawBits().toLong() and 0xFFFFFFFFL
    return (wBits shl 32) or hBits
  }

  fun make(width: Int, height: Int): Long {
    return make(width.toFloat(), height.toFloat())
  }

  fun getWidth(measureOutput: Long): Float {
    return java.lang.Float.intBitsToFloat(-0x1 and (measureOutput shr 32).toInt())
  }

  fun getHeight(measureOutput: Long): Float {
    return java.lang.Float.intBitsToFloat(-0x1 and measureOutput.toInt())
  }
}
