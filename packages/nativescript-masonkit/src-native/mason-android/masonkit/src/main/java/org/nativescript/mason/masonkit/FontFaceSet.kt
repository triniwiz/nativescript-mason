package org.nativescript.mason.masonkit

import android.content.Context
import java.util.concurrent.Executors

val familyNamePattern = Regex("""\d+px\s+(["']?)([\w\s]+)\1$""")

class FontFaceSet {
  private val fontCache = mutableSetOf<FontFace>()
  private var executor = Executors.newSingleThreadExecutor()

  enum class FontFaceSetStatus {
    loading,
    loaded
  }

  var status = FontFaceSetStatus.loading
    private set

  var onStatus: ((FontFaceSetStatus) -> Unit)? = null

  val iter: Iterator<FontFace>
    get() {
      return fontCache.iterator()
    }

  val array: Array<FontFace>
    get() {
      return fontCache.toTypedArray()
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
      fontCache.find { font ->
        font.fontFamily == match.groups[2]?.value
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
      onStatus?.let {
        it(FontFaceSetStatus.loading)
      }
      val matchResult = familyNamePattern.find(font)
      if (matchResult != null) {
        val first = fontCache.find {
          it.fontFamily == matchResult.groups[2]?.value
        }

        if (first != null) {
          first.loadSync(context) {}
          if (first.status == FontFace.FontFaceStatus.loaded) {
            status = FontFaceSetStatus.loaded
            onStatus?.let {
              it(FontFaceSetStatus.loaded)
            }
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
