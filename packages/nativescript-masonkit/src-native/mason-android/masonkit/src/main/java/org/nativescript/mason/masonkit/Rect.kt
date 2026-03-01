package org.nativescript.mason.masonkit

data class Rect<T>(
  val top: T,
  val right: T,
  val bottom: T,
  val left: T,
) {
  companion object {
    @JvmStatic
    fun <T> uniform(value: T): Rect<T> {
      return Rect(value, value, value, value)
    }

    fun withPx(
      top: Float,
      right: Float,
      bottom: Float,
      left: Float
    ): Rect<LengthPercentage> {
      return Rect(
        LengthPercentage.Points(
          top
        ),
        LengthPercentage.Points(
          right
        ), LengthPercentage.Points(
          bottom
        ), LengthPercentage.Points(
          left
        )
      )
    }

    fun withPxAuto(
      top: Float,
      right: Float,
      bottom: Float,
      left: Float
    ): Rect<LengthPercentageAuto> {
      return Rect(
        LengthPercentageAuto.Points(
          top
        ),
        LengthPercentageAuto.Points(
          right
        ), LengthPercentageAuto.Points(
          bottom
        ), LengthPercentageAuto.Points(
          left
        )
      )
    }
  }
}
