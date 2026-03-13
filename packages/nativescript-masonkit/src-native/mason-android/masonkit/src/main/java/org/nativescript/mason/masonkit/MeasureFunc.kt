package org.nativescript.mason.masonkit

import androidx.annotation.Keep
import android.util.Log
import java.lang.ref.WeakReference


interface MeasureFunc {
  fun measure(knownDimensions: Size<Float?>, availableSpace: Size<Float?>): Size<Float>
}

internal class MeasureFuncImpl(
  private val measureFunc: WeakReference<MeasureFunc>,
) {

  internal var hasObjectId = false
  internal val objectId by lazy {
    hasObjectId = true
    ObjectManager.shared.add(this)
  }

  @Synchronized
  @Throws(Throwable::class)
  protected fun finalize() {
    if (hasObjectId) {
      ObjectManager.shared.remove(objectId)
    }
  }


  @Keep
  fun measure(knownDimensionsSpec: Long, availableSpaceSpec: Long): Long {
    val knownWidth = MeasureOutput.getWidth(knownDimensionsSpec)
    val knownHeight = MeasureOutput.getHeight(knownDimensionsSpec)

    val availableWidth = MeasureOutput.getWidth(availableSpaceSpec)
    val availableHeight = MeasureOutput.getHeight(availableSpaceSpec)

    try {
      Log.d(
        "mason-measure",
        "measure called idSpec=${knownDimensionsSpec} availSpec=${availableSpaceSpec} decodedKnown=(${knownWidth},${knownHeight}) decodedAvail=(${availableWidth},${availableHeight})"
      )
    } catch (_: Throwable) {
    }

    val result = measureFunc.get()?.measure(
      Size(
        if (knownWidth.isNaN()) null else knownWidth,
        if (knownHeight.isNaN()) null else knownHeight
      ), Size(
        if (availableWidth.isNaN()) null else availableWidth,
        if (availableHeight.isNaN()) null else availableHeight
      )
    )

    val outWidth = result?.width ?: 0f
    val outHeight = result?.height ?: 0f
    try {
      Log.d("mason-measure", "measure result out=(${outWidth},${outHeight})")
    } catch (_: Throwable) {
    }

    return MeasureOutput.make(outWidth, outHeight)
  }
}
