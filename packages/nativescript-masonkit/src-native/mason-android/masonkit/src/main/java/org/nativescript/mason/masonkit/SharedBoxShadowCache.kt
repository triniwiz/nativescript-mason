package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import androidx.collection.LruCache

/** Process-local, byte-bounded cache of immutable outset shadow bitmaps. */
internal object SharedBoxShadowCache {
  private const val MAX_BYTES = 24 * 1024 * 1024

  data class Key(
    val widthPx: Int,
    val heightPx: Int,
    val radiiBits: List<Int>,
    val blurBits: Int,
    val spreadBits: Int,
    val color: Int,
    val offsetXBits: Int,
    val offsetYBits: Int,
    val densityDpi: Int,
    val rasterScaleBits: Int,
  )

  data class Snapshot(
    val hits: Long,
    val misses: Long,
    val rasterizations: Long,
    val evictions: Long,
    val uniqueResources: Int,
    val cachedBytes: Int,
  )

  private var hits = 0L
  private var misses = 0L
  private var rasterizations = 0L
  private var evictions = 0L

  private val cache = object : LruCache<Key, Bitmap>(MAX_BYTES) {
    override fun sizeOf(key: Key, value: Bitmap): Int = value.allocationByteCount

    override fun entryRemoved(evicted: Boolean, key: Key, oldValue: Bitmap, newValue: Bitmap?) {
      // A view may still draw oldValue. Let normal reachability reclaim it.
      if (evicted) evictions++
    }
  }

  @Synchronized
  fun get(key: Key): Bitmap? = cache.get(key).also {
    if (it == null) misses++ else hits++
  }

  @Synchronized
  fun put(key: Key, bitmap: Bitmap) {
    rasterizations++
    cache.put(key, bitmap)
  }

  @Synchronized
  fun snapshot(): Snapshot = Snapshot(
    hits,
    misses,
    rasterizations,
    evictions,
    cache.snapshot().size,
    cache.size(),
  )

  @Synchronized
  fun resetForBenchmark() {
    cache.evictAll()
    hits = 0
    misses = 0
    rasterizations = 0
    evictions = 0
  }

  fun floatBits(value: Float): Int = if (value == 0f) 0 else value.toRawBits()
}
