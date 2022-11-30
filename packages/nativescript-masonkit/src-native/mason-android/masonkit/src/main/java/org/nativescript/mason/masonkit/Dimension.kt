package org.nativescript.mason.masonkit

sealed class Dimension {
    data class Points(var points: Float) : Dimension()
    data class Percent(var percentage: Float) : Dimension()
    object Undefined : Dimension()
    object Auto : Dimension()

    companion object {
        fun fromTypeValue(type: Int, value: Float): Dimension? {
            return when (type) {
                0 -> Points(value)
                1 -> Percent(value)
                2 -> Undefined
                3 -> Auto
                else -> null
            }
        }
    }

    internal val type: Int
        get() = when (this) {
            is Points -> 0
            is Percent -> 1
            is Undefined -> 2
            is Auto -> 3
        }

    internal val value: Float
        get() = when (this) {
            is Points -> this.points
            is Percent -> this.percentage
            is Undefined -> 0f
            is Auto -> 0f
        }

    internal fun updateValue(value: Float){
        when (this) {
            is Points -> {
                this.points = value
            }
            is Percent -> {
                this.percentage = value
            }
            else -> {}
        }
    }
}
