package org.nativescript.mason.masonkit

import androidx.annotation.Keep
import java.lang.ref.WeakReference


interface MeasureFunc {
  /**
   * If a dimension is undefined, it will be passed as -3f.
   * Implementations should check for value == -3f to detect undefined.
   */
  fun measure(
    knownWidth: Float, knownHeight: Float,
    availableWidth: Float, availableHeight: Float
  ): Long
}

internal class MeasureFuncImpl(
  private val measureFunc: WeakReference<MeasureFunc>,
) {

  internal var hasObjectId = false
  internal val objectId by lazy {
    hasObjectId = true
    ObjectManager.shared.add(this)
  }

  private var released = false

  @Synchronized
  internal fun release() {
    if (hasObjectId && !released) {
      released = true
      ObjectManager.shared.remove(objectId)
    }
  }


  @Keep
  fun measure(knownDimensionsSpec: Long, availableSpaceSpec: Long): Long {
    val func = measureFunc.get()
      ?: // Fast path: no custom measure function, just return a default packed value (e.g., zero size)
      return MeasureOutput.ZERO

    val knownWidth = MeasureOutput.getWidth(knownDimensionsSpec)
    val knownHeight = MeasureOutput.getHeight(knownDimensionsSpec)
    val availableWidth = MeasureOutput.getWidth(availableSpaceSpec)
    val availableHeight = MeasureOutput.getHeight(availableSpaceSpec)

    return func.measure(knownWidth, knownHeight, availableWidth, availableHeight)
  }
}
