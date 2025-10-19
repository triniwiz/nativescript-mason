package org.nativescript.mason.masonkit

import androidx.annotation.Keep
import java.lang.ref.WeakReference


interface MeasureFunc {
  fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float>
}

internal class MeasureFuncImpl(
  private val measureFunc: WeakReference<MeasureFunc>,
) {
  @Keep
  fun measure(knownDimensionsSpec: Long, availableSpaceSpec: Long): Long {
    val knownWidth = MeasureOutput.getWidth(knownDimensionsSpec)
    val knownHeight = MeasureOutput.getHeight(knownDimensionsSpec)

    val availableWidth = MeasureOutput.getWidth(availableSpaceSpec)
    val availableHeight = MeasureOutput.getHeight(availableSpaceSpec)

    val result = measureFunc.get()?.measure(
      Size(
        if (knownWidth.isNaN()) null else knownWidth,
        if (knownHeight.isNaN()) null else knownHeight
      ), Size(
        if (availableWidth.isNaN()) null else availableWidth,
        if (availableHeight.isNaN()) null else availableHeight
      )
    )

    return MeasureOutput.make(result?.width ?: 0f, result?.height ?: 0f)
  }
}
