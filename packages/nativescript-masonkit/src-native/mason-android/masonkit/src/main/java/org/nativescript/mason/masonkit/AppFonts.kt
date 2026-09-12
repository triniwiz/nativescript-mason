package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Typeface
import java.io.File
import java.io.RandomAccessFile
import java.util.concurrent.ConcurrentHashMap
import org.nativescript.fontmanager.FontFace

/**
 * Maps a CSS `font-family` to a font file shipped in the app's `fonts` folder.
 *
 * iOS gets this for free: the runtime registers every file in `app/fonts` with
 * CoreText at startup, so a custom family is findable by name. Android has no
 * system-wide registration, so a `FontFace(family)` built with no `source`
 * falls straight through fontmanager's generic-family table and never gets a
 * typeface -- text then measures and draws in the platform default instead.
 */
object AppFonts {
  private val EXTENSIONS = setOf("ttf", "otf", "ttc", "otc")

  // fontmanager resolves these itself; a same-named file must not shadow them.
  private val GENERIC_FAMILIES = setOf(
    "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
    "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "emoji", "math"
  )

  /**
   * Where to look. Set by the TS layer to `knownFolders.currentApp()/fonts`,
   * otherwise defaulted from the first Context we are handed.
   */
  @JvmStatic
  var fontsDirectory: String? = null
    set(value) {
      if (field == value) return
      field = value
      synchronized(this) {
        nameTableIndex = null
        cache.clear()
        typefaces.clear()
      }
    }

  // normalized family -> absolute path, "" meaning known-missing
  private val cache = ConcurrentHashMap<String, String>()

  private val typefaces = ConcurrentHashMap<String, Typeface>()

  // Built only once a plain filename match has failed.
  private var nameTableIndex: Map<String, String>? = null

  private fun normalize(value: String) = value.trim().trim('"', '\'').lowercase()

  private fun squash(value: String) = normalize(value).filter { it.isLetterOrDigit() }

  /** Absolute path of an app-bundled font file for [family], or null. */
  @JvmStatic
  @JvmOverloads
  fun resolve(family: String, context: Context? = null): String? {
    val key = normalize(family)
    if (key.isEmpty() || key in GENERIC_FAMILIES) return null

    cache[key]?.let { return it.ifEmpty { null } }

    if (fontsDirectory == null && context != null) {
      fontsDirectory = File(context.filesDir, "app/fonts").absolutePath
    }
    val dir = fontsDirectory?.let(::File) ?: return null
    if (!dir.isDirectory) return null

    val hit = matchByFileName(dir, family.trim().trim('"', '\''), key)
      ?: matchByNameTable(dir, key)
    cache[key] = hit ?: ""
    return hit
  }

  /**
   * A Typeface for [family] read straight from the app's font file.
   *
   * fontmanager's `FontFace.load()` always hops through an executor, so the
   * first measure of a freshly-mounted subtree runs before the face has a
   * Typeface and silently falls back to the platform default -- with the
   * FONT_FAMILY state flag already consumed, nothing re-applies it. Reading
   * the file here is cheap (cached per family) and lets that first measure be
   * correct.
   */
  @JvmStatic
  @JvmOverloads
  fun typeface(family: String, context: Context? = null): Typeface? {
    val key = normalize(family)
    typefaces[key]?.let { return it }
    val path = resolve(family, context) ?: return null
    return try {
      Typeface.createFromFile(path).also { typefaces[key] = it }
    } catch (e: Exception) {
      null
    }
  }

  /**
   * `fonts/<family>.ttf` is the NativeScript convention, but a `@font-face`
   * family is case-insensitive on the web, so fall back to a lenient match.
   */
  private fun matchByFileName(dir: File, family: String, key: String): String? {
    for (ext in EXTENSIONS) {
      val exact = File(dir, "$family.$ext")
      if (exact.isFile) return exact.absolutePath
    }
    val files = dir.listFiles() ?: return null
    val squashed = squash(key)
    var loose: String? = null
    for (file in files) {
      if (!file.isFile || file.extension.lowercase() !in EXTENSIONS) continue
      val base = file.nameWithoutExtension
      if (base.lowercase() == key) return file.absolutePath
      if (loose == null && squash(base) == squashed) loose = file.absolutePath
    }
    return loose
  }

  private fun matchByNameTable(dir: File, key: String): String? {
    val index = synchronized(this) {
      nameTableIndex ?: buildNameTableIndex(dir).also { nameTableIndex = it }
    }
    return index[key] ?: index[squash(key)]
  }

  private fun buildNameTableIndex(dir: File): Map<String, String> {
    val index = mutableMapOf<String, String>()
    val files = dir.listFiles() ?: return index
    for (file in files) {
      if (!file.isFile || file.extension.lowercase() !in EXTENSIONS) continue
      for (name in familyNames(file)) {
        index.putIfAbsent(normalize(name), file.absolutePath)
        index.putIfAbsent(squash(name), file.absolutePath)
      }
    }
    return index
  }

  /**
   * Family names declared inside the font's own `name` table (IDs 1 and 16),
   * so a family that differs from its filename still resolves -- the same
   * thing CoreText name matching gives iOS for free.
   */
  private fun familyNames(file: File): List<String> = try {
    RandomAccessFile(file, "r").use { raf ->
      fontOffsets(raf).flatMap { familyNamesAt(raf, it) }
    }
  } catch (e: Exception) {
    emptyList()
  }

  private fun fontOffsets(raf: RandomAccessFile): List<Long> {
    raf.seek(0)
    if (raf.readInt() != 0x74746366) return listOf(0L) // not a 'ttcf' collection
    raf.skipBytes(4) // version
    val count = raf.readInt()
    if (count <= 0 || count > 1024) return emptyList()
    return (0 until count).map { raf.readInt().toLong() and 0xFFFFFFFFL }
  }

  private fun familyNamesAt(raf: RandomAccessFile, base: Long): List<String> {
    raf.seek(base + 4)
    val numTables = raf.readUnsignedShort()
    var nameOffset = -1L
    for (i in 0 until numTables) {
      raf.seek(base + 12 + i * 16L)
      val tag = ByteArray(4).also { raf.readFully(it) }.toString(Charsets.US_ASCII)
      if (tag != "name") continue
      raf.skipBytes(4) // checksum
      nameOffset = raf.readInt().toLong() and 0xFFFFFFFFL
      break
    }
    if (nameOffset < 0) return emptyList()

    raf.seek(nameOffset + 2) // skip format
    val count = raf.readUnsignedShort()
    val storage = nameOffset + raf.readUnsignedShort()

    val names = mutableListOf<String>()
    for (i in 0 until count) {
      raf.seek(nameOffset + 6 + i * 12L)
      val platformId = raf.readUnsignedShort()
      raf.skipBytes(4) // encoding + language
      val nameId = raf.readUnsignedShort()
      if (nameId != 1 && nameId != 16) continue
      val length = raf.readUnsignedShort()
      val offset = raf.readUnsignedShort()
      if (length <= 0) continue
      val bytes = ByteArray(length)
      raf.seek(storage + offset)
      raf.readFully(bytes)
      // Platform 1 is Macintosh (single byte); 0 and 3 are UTF-16BE.
      names += String(bytes, if (platformId == 1) Charsets.ISO_8859_1 else Charsets.UTF_16BE)
    }
    return names
  }
}

/** The face's own Typeface, or the app-bundled file's while the load is in flight. */
internal val FontFace.resolvedTypeface: Typeface?
  get() = font ?: AppFonts.typeface(fontFamily)
