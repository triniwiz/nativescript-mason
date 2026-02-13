package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Typeface
import java.util.Collections
import java.util.concurrent.Executors

val familyNamePattern = Regex("""\d+px\s+(["']?)([\w\s]+)\1$""")

class FontFaceSet {
  private val fontCache: MutableSet<FontFace> by lazy {
    Collections.synchronizedSet(mutableSetOf<FontFace>()).apply {
      val font = FontFace("sans-serif", true)
      font.font = Typeface.SANS_SERIF
      font.status = FontFace.FontFaceStatus.loaded
      add(font)
    }
  }
  private val executor = Executors.newSingleThreadExecutor()

  enum class FontFaceSetStatus {
    loading,
    loaded
  }

  @Volatile
  var status = FontFaceSetStatus.loading
    internal set

  var onStatus: ((FontFaceSetStatus) -> Unit)? = null

  val iter: Iterator<FontFace>
    get() {
      synchronized(fontCache) {
        return fontCache.toList().iterator()
      }
    }

  operator fun get(family: String): FontFace {
    return fontCache.first { it.fontFamily == family }
  }

  fun getOrNull(family: String): FontFace? {
    return fontCache.find { it.fontFamily == family }
  }

  val array: Array<FontFace>
    get() {
      synchronized(fontCache) {
        return fontCache.toTypedArray()
      }
    }

  fun add(font: FontFace) {
    fontCache.add(font)
  }

  fun clear() {
    fontCache.clear()
  }

  fun delete(font: FontFace) {
    fontCache.remove(font)
  }

  val size: Int
    get() {
      return fontCache.size
    }

  fun check(
    font: String,
    text: String?
  ): Boolean {
    val matchResult = familyNamePattern.find(font)
    return matchResult?.let { match ->
      val familyName = match.groups[2]?.value
      synchronized(fontCache) {
        fontCache.find { it.fontFamily == familyName }
      }?.let {
        it.font != null
      } ?: false
    } ?: false
  }

  fun load(
    context: Context,
    font: String,
    text: String?,
    callback: (List<FontFace>, String?) -> Unit
  ) {
    executor.execute {
      status = FontFaceSetStatus.loading
      onStatus?.invoke(FontFaceSetStatus.loading)
      val matchResult = familyNamePattern.find(font)
      if (matchResult != null) {
        val familyName = matchResult.groups[2]?.value
        val first = synchronized(fontCache) {
          fontCache.find { it.fontFamily == familyName }
        }

        if (first != null) {
          first.loadSync(context) {}
          if (first.status == FontFace.FontFaceStatus.loaded) {
            status = FontFaceSetStatus.loaded
            onStatus?.invoke(FontFaceSetStatus.loaded)
          }
          callback(listOf(first), null)
        } else {
          callback(emptyList(), null)
        }
      } else {
        callback(emptyList(), null)
      }
    }
  }

  companion object {
    @JvmStatic
    val instance = FontFaceSet()
  }
}
