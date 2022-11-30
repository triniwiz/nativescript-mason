package org.nativescript.mason.masonkit

data class Size<T>(
    var width: T,
    val height: T
)

val zeroSize = Size(0F, 0F)

val nanSize = Size(Float.NaN, Float.NaN)

val autoSize: Size<Dimension> = Size(Dimension.Auto, Dimension.Auto)