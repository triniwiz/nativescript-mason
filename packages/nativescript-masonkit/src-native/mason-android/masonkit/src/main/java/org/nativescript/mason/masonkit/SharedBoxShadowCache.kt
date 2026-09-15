package org.nativescript.mason.masonkit

import android.graphics.Bitmap
import androidx.collection.LruCache

/** Process-local, byte-bounded cache of immutable outset shadow bitmaps. */
internal object SharedBoxShadowCache {
  private const val MAX_BYTES = 24 * 1024 * 1024

  data class Key(
    val widthBits: Int,
    val heightBits: Int,
    val radiiBits: List<Int>,
    val blurBits: Int,
    val spreadBits: Int,
    val color: Int,
    val offsetXBits: Int,
    val offsetYBits: Int,
    val densityDpi: Int,
    val rasterScaleBits: Int,
  )

  private val cache = object : LruCache<Key, Bitmap>(MAX_BYTES) {
    override fun sizeOf(key: Key, value: Bitmap): Int = value.allocationByteCount
  }

  fun get(key: Key): Bitmap? = cache.get(key)

  fun put(key: Key, bitmap: Bitmap) {
    cache.put(key, bitmap)
  }

  fun floatBits(value: Float): Int = if (value == 0f) 0 else value.toRawBits()
}
