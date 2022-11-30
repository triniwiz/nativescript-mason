package org.nativescript.mason.masonkit

object MeasureOutput {
    fun make(width: Float, height: Float): Long {
        val wBits = width.toRawBits()
        val hBits = height.toRawBits()
        return wBits.toLong() shl 32 or hBits.toLong()
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