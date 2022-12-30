package org.nativescript.mason.masonkit

val LengthPercentageZeroSize =
  Size<LengthPercentage>(LengthPercentage.Zero, LengthPercentage.Zero)
val LengthPercentageAutoZeroSize =
  Size<LengthPercentageAuto>(LengthPercentageAuto.Zero, LengthPercentageAuto.Zero)

val zeroSize = Size(0F, 0F)

val nanSize = Size(Float.NaN, Float.NaN)

val autoSize: Size<Dimension> = Size(Dimension.Auto, Dimension.Auto)


val LengthPercentageZeroRect =
  Rect<LengthPercentage>(
    LengthPercentage.Zero,
    LengthPercentage.Zero,
    LengthPercentage.Zero,
    LengthPercentage.Zero
  )
val LengthPercentageAutoZeroRect =
  Rect<LengthPercentageAuto>(
    LengthPercentageAuto.Zero,
    LengthPercentageAuto.Zero,
    LengthPercentageAuto.Zero,
    LengthPercentageAuto.Zero
  )

