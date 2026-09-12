package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import android.os.Debug
import android.os.SystemClock

/** Opt-in counters for measuring the box-shadow renderer without changing its output. */
internal object BoxShadowDiagnostics {
  data class BitmapCreation(
    val role: String,
    val width: Int,
    val height: Int,
    val bytes: Int,
  )

  data class Event(
    val owner: Int,
    val width: Int,
    val height: Int,
    val radii: List<Float>,
    val blur: Float,
    val spread: Float,
    val color: Int,
    val bitmapWidth: Int,
    val bitmapHeight: Int,
    val bitmapBytes: Int,
    val rasterNanos: Long,
  )

  data class Snapshot(
    val bitmapCreations: Long,
    val bitmapBytesCreated: Long,
    val cacheHits: Long,
    val cacheMisses: Long,
    val cacheReplacements: Long,
    val abandonedBitmapCount: Long,
    val abandonedBitmapBytes: Long,
    val liveCachedBitmapCount: Int,
    val liveCachedBitmapBytes: Long,
    val rasterizations: Long,
    val rasterNanos: Long,
    val nativeHeapBytes: Long,
    val bitmapCreationDetails: List<BitmapCreation>,
    val events: List<Event>,
  )

  @Volatile
  var enabled = false

  private var bitmapCreations = 0L
  private var bitmapBytesCreated = 0L
  private var cacheHits = 0L
  private var cacheMisses = 0L
  private var cacheReplacements = 0L
  private var abandonedBitmapCount = 0L
  private var abandonedBitmapBytes = 0L
  private var rasterizations = 0L
  private var rasterNanos = 0L
  private val liveCaches = HashMap<Int, List<Bitmap>>()
  private val bitmapCreationDetails = ArrayList<BitmapCreation>()
  private val events = ArrayList<Event>()

  @Synchronized
  fun reset() {
    bitmapCreations = 0
    bitmapBytesCreated = 0
    cacheHits = 0
    cacheMisses = 0
    cacheReplacements = 0
    abandonedBitmapCount = 0
    abandonedBitmapBytes = 0
    rasterizations = 0
    rasterNanos = 0
    liveCaches.clear()
    bitmapCreationDetails.clear()
    events.clear()
  }

  @Synchronized
  fun bitmapCreated(role: String, bitmap: Bitmap) {
    if (!enabled) return
    bitmapCreations++
    bitmapBytesCreated += bitmap.allocationByteCount
    bitmapCreationDetails.add(BitmapCreation(role, bitmap.width, bitmap.height, bitmap.allocationByteCount))
  }

  @Synchronized
  fun cacheHit() {
    if (enabled) cacheHits++
  }

  @Synchronized
  fun cacheMiss() {
    if (enabled) cacheMisses++
  }

  @Synchronized
  fun discard(renderer: BoxShadowRenderer, bitmaps: List<Bitmap>, replacement: Boolean) {
    if (!enabled || bitmaps.isEmpty()) return
    liveCaches.remove(System.identityHashCode(renderer))
    if (replacement) cacheReplacements++
    abandonedBitmapCount += bitmaps.size
    abandonedBitmapBytes += bitmaps.sumOf { it.allocationByteCount.toLong() }
  }

  @Synchronized
  fun rasterized(
    renderer: BoxShadowRenderer,
    owner: android.view.View,
    width: Float,
    height: Float,
    radii: FloatArray?,
    shadow: Shadow.BoxShadow,
    bitmap: Bitmap,
    startedNanos: Long,
  ) {
    if (!enabled) return
    val elapsed = SystemClock.elapsedRealtimeNanos() - startedNanos
    rasterizations++
    rasterNanos += elapsed
    liveCaches.getOrPut(System.identityHashCode(renderer)) { ArrayList() }
    events.add(
      Event(
        System.identityHashCode(owner),
        width.toInt(),
        height.toInt(),
        radii?.toList() ?: emptyList(),
        shadow.blurRadius,
        shadow.spreadRadius,
        shadow.color,
        bitmap.width,
        bitmap.height,
        bitmap.allocationByteCount,
        elapsed,
      )
    )
  }

  @Synchronized
  fun cache(renderer: BoxShadowRenderer, bitmaps: List<Bitmap>) {
    if (enabled) liveCaches[System.identityHashCode(renderer)] = bitmaps
  }

  @Synchronized
  fun snapshot(): Snapshot {
    val live = liveCaches.values.flatten()
    return Snapshot(
      bitmapCreations,
      bitmapBytesCreated,
      cacheHits,
      cacheMisses,
      cacheReplacements,
      abandonedBitmapCount,
      abandonedBitmapBytes,
      live.size,
      live.sumOf { it.allocationByteCount.toLong() },
      rasterizations,
      rasterNanos,
      Debug.getNativeHeapAllocatedSize(),
      bitmapCreationDetails.toList(),
      events.toList(),
    )
  }
}
