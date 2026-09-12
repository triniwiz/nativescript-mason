package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.os.SystemClock

internal object DownsampleShadowStats {
  data class Snapshot(
    val rasterizations: Long,
    val bitmapBytes: Long,
    val rasterNanos: Long,
    val scales: Map<Float, Int>,
  )

  private var rasterizations = 0L
  private var bitmapBytes = 0L
  private var rasterNanos = 0L
  private val scales = HashMap<Float, Int>()

  @Synchronized
  fun record(bitmap: Bitmap, scale: Float, startedNanos: Long) {
    rasterizations++
    bitmapBytes += bitmap.allocationByteCount
    rasterNanos += SystemClock.elapsedRealtimeNanos() - startedNanos
    scales[scale] = (scales[scale] ?: 0) + 1
  }

  @Synchronized
  fun snapshot() = Snapshot(rasterizations, bitmapBytes, rasterNanos, scales.toMap())

  @Synchronized
  fun reset() {
    rasterizations = 0
    bitmapBytes = 0
    rasterNanos = 0
    scales.clear()
  }
}
