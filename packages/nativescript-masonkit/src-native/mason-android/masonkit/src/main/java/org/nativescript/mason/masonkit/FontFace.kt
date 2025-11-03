package org.nativescript.mason.masonkit

import android.content.Context
import android.graphics.Typeface
import android.os.Build
import android.util.Log
import androidx.core.net.toUri
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.URL
import java.nio.ByteBuffer
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.regex.Matcher
import java.util.regex.Pattern

val FONT_FAMILY_PATTERN = Regex("font-family:\\s*'([^']+)';")
val FONT_STYLE_PATTERN =
  Regex("font-style:\\s*(normal|italic|oblique(?:\\s+([-]?\\d+(\\.\\d+)?deg))?);")
val FONT_WEIGHT_PATTERN = Regex("font-weight:\\s*([^;]+);")
val FONT_DISPLAY_PATTERN = Regex("font-display:\\s*([^;]+);")
val FONT_SRC_PATTERN = Regex("src:\\s*url\\(([^)]+)\\)\\s*format\\('([^']+)'\\);")

val FONT_FACE_PATTERN: Pattern = Pattern.compile("@font-face\\s*\\{([^}]+)\\}")


class FontFace {
  var font: Typeface? = null
    private set

  var fontFamily: String
    private set

  private var fontData: ByteBuffer? = null

  var fontPath: String? = null
    private set

  private var localOrRemoteSource: String? = null
  internal var fontDescriptors: NSCFontDescriptors

  companion object {
    @JvmStatic
    private val genericFontFamilies = mutableMapOf(
      Pair("serif", "Noto Serif"),
      Pair("sans-serif", "Roboto"),
      Pair("monospace", "Roboto Mono, Droid Sans Mono"),
      Pair("cursive", "Dancing Script, Noto Sans Cursive"),
      Pair("fantasy", "Papyrus"),
      Pair("system-ui", "Roboto"),
      Pair("ui-serif", "Noto Serif"),
      Pair("ui-sans-serif", "Roboto"),
      Pair("ui-monospace", "Roboto Mono"),
      Pair("ui-rounded", "Google Sans Rounded, Roboto"),
      Pair("emoji", "Noto Emoji"),
    )

    @JvmStatic
    private val executors = Executors.newSingleThreadExecutor()

    @JvmStatic
    fun clearFontCache(context: Context) {
      executors.execute {
        val fonts = File(context.filesDir, "ns_fonts")
        if (fonts.exists()) {
          fonts.deleteRecursively()
        }
      }
    }

    @JvmStatic
    fun importFromRemote(
      context: Context,
      url: String,
      load: Boolean,
      callback: (fonts: List<FontFace>, error: String?) -> Unit
    ) {
      val result = arrayListOf<FontFace>()
      try {
        val remote = URL(url)
        executors.execute {
          try {
            val connection = remote.openConnection()
            val stream = BufferedInputStream(connection.getInputStream())
            val css = String(stream.readBytes())
            val matcher: Matcher = FONT_FACE_PATTERN.matcher(css)
            stream.close()
            while (matcher.find()) {
              val match = matcher.group(1)
              match?.let { it ->

                val fontFamily = FONT_FAMILY_PATTERN.find(it)?.let {
                  it.groupValues[1]
                }

                val fontDisplay = FONT_DISPLAY_PATTERN.find(it)?.let {
                  it.groupValues[1]
                } ?: "auto"

                val fontStyle = FONT_STYLE_PATTERN.find(it)?.let {
                  it.groupValues[1]
                } ?: "normal"

                val fontWeight = FONT_WEIGHT_PATTERN.find(it)?.let {
                  it.groupValues[1]
                } ?: "normal"


                val src = FONT_SRC_PATTERN.find(it)?.let {
                  it.groupValues[1]
                }

                val font = FontFace(fontFamily ?: "", src)
                font.setFontWeight(fontWeight)
                font.setFontDisplay(fontDisplay)
                font.setFontStyle(fontStyle)
                FontFaceSet.instance.add(font)
                if (load) {
                  font.loadSync(context) {}
                }
                result.add(font)
              }
            }
            callback(result, null)

          } catch (e: Exception) {
            callback(result, e.localizedMessage)
          }
        }
      } catch (e: Exception) {
        callback(result, e.localizedMessage)
      }
    }
  }

  enum class FontFaceStatus {
    unloaded,
    loading,
    loaded,
    error,
  }

  var status = FontFaceStatus.unloaded

  private val executor: ExecutorService = Executors.newSingleThreadExecutor()

  class NSCFontStyle private constructor(internal val style: Style) {
    internal enum class Style(internal val value: Int) {
      Normal(0),
      Italic(1),
      Oblique(2)
    }

    private var angle: Int = 0

    val fontStyle: Int
      get() {
        return when (style) {
          Style.Normal -> Typeface.NORMAL
          Style.Italic -> Typeface.ITALIC
          Style.Oblique -> Typeface.NORMAL // SkewX = -0.25f for oblique
        }
      }

    companion object {
      @JvmStatic
      val Normal = NSCFontStyle(Style.Normal)

      @JvmStatic
      val Italic = NSCFontStyle(Style.Italic)

      @JvmStatic
      private val Oblique = NSCFontStyle(Style.Oblique)

      @JvmStatic
      @JvmOverloads
      fun Oblique(angle: Int = 0): NSCFontStyle {
        if (angle == 0) {
          return Oblique
        }
        val ret = NSCFontStyle(Style.Oblique)
        ret.angle = angle
        return ret
      }
    }

    override fun toString(): String {
      return when (style) {
        Style.Normal -> "normal"
        Style.Italic -> "italic"
        Style.Oblique -> {
          if (angle == 0) {
            "oblique"
          } else {
            "oblique $angle"
          }
        }
      }
    }
  }

  enum class NSCFontDisplay {
    Auto,
    Block,
    Fallback,
    Optional,
    Swap
  }

  enum class NSCFontWeight(val weight: Int) {
    Thin(100),
    ExtraLight(200),
    Light(300),
    Normal(400),
    Medium(500),
    SemiBold(600),
    Bold(700),
    ExtraBold(800),
    Black(900);

    val isBold: Boolean
      get() = weight >= 600
    val raw: Int
      get() {
        return weight
      }

    internal fun getStyle(isItalic: Boolean = false): Int {
      return when (weight) {
        in 100..599 -> {
          if (isItalic) {
            Typeface.ITALIC
          } else {
            Typeface.NORMAL
          }
        }

        else -> {
          if (isItalic) {
            Typeface.BOLD_ITALIC
          } else {
            Typeface.BOLD
          }
        }
      }
    }


    companion object {
      @JvmStatic
      fun from(value: Int): NSCFontWeight {
        if (value < 100) {
          return Thin
        }
        return when (value) {
          in 100..199 -> Thin
          in 200..299 -> ExtraLight
          in 300..399 -> Light
          in 400..499 -> Normal
          in 500..599 -> Medium
          in 600..699 -> SemiBold
          in 700..799 -> Bold
          in 800..899 -> ExtraBold
          else -> Black
        }
      }
    }
  }

  class NSCFontDescriptors(var family: String) {
    var weight: NSCFontWeight
    var ascentOverride: String
    var descentOverride: String
    var display: NSCFontDisplay
    var style: NSCFontStyle
    var stretch: String
    var unicodeRange: String
    var featureSettings: String
    var lineGapOverride: String
    var variationSettings: String
    var kerning: String
    var variantLigatures: String

    init {
      weight = NSCFontWeight.Normal
      this.ascentOverride = "normal"
      this.descentOverride = "normal"
      this.display = NSCFontDisplay.Auto
      this.style = NSCFontStyle.Normal
      this.stretch = "normal"
      this.unicodeRange = "U+0-10FFFF"
      this.featureSettings = "normal"
      this.variationSettings = "normal"
      this.lineGapOverride = "normal"
      this.kerning = "auto"
      this.variantLigatures = "normal"
    }

    internal fun update(value: String) {
      val matcher: Matcher = FONT_FACE_PATTERN.matcher(value)
      while (matcher.find()) {
        val match = matcher.group(1)
        match?.let { it ->

          val fontDisplay = FONT_DISPLAY_PATTERN.find(it)?.let {
            it.groupValues[1]
          } ?: "auto"

          val fontStyle = FONT_STYLE_PATTERN.find(it)?.let {
            it.groupValues[1]
          } ?: "normal"

          val fontWeight = FONT_WEIGHT_PATTERN.find(it)?.let {
            it.groupValues[1]
          } ?: "normal"

          this.setFontWeight(fontWeight)
          this.setFontDisplay(fontDisplay)
          this.setFontStyle(fontStyle)
        }
      }
    }

    fun setFontWeight(value: String) {
      when (value) {
        "normal" -> {
          weight = NSCFontWeight.Normal
        }

        "bold" -> {
          weight = NSCFontWeight.Bold
        }

        else -> {
          try {
            weight = NSCFontWeight.from(value.toInt())
          } catch (_: Exception) {
          }
        }
      }
    }

    fun setFontStyle(value: String) {
      when (value) {
        "normal" -> style = NSCFontStyle.Normal
        "italic" -> style = NSCFontStyle.Italic
        else -> {
          FONT_STYLE_PATTERN.find("font-style: $value")?.let {
            var angle = 0

            try {
              angle = it.groupValues[2].toInt()
            } catch (_: Exception) {
            }

            style = NSCFontStyle.Oblique(angle)
          }
        }
      }
    }

    fun setFontDisplay(value: String) {
      when (value) {
        "auto" -> {
          display = NSCFontDisplay.Auto
        }

        "block" -> {
          display = NSCFontDisplay.Block
        }

        "fallback" -> {
          display = NSCFontDisplay.Fallback
        }

        "optional" -> {
          display = NSCFontDisplay.Optional
        }

        "swap" -> {
          display = NSCFontDisplay.Swap
        }
      }
    }

  }

  constructor(
    family: String
  ) {
    fontFamily = family
    fontDescriptors = NSCFontDescriptors(family)
  }

  constructor(
    family: String,
    source: String? = null,
    descriptors: NSCFontDescriptors? = null
  ) {
    fontFamily = family
    localOrRemoteSource = source
    fontDescriptors = descriptors ?: NSCFontDescriptors(family)
  }

  @JvmOverloads
  constructor(
    family: String,
    source: ByteArray,
    descriptors: NSCFontDescriptors? = null
  ) {
    fontFamily = family
    fontData = ByteBuffer.wrap(source)
    fontDescriptors = descriptors ?: NSCFontDescriptors(family)
  }

  @JvmOverloads
  constructor(
    family: String,
    source: ByteBuffer,
    descriptors: NSCFontDescriptors? = null
  ) {
    fontFamily = family
    fontData = source
    fontDescriptors = descriptors ?: NSCFontDescriptors(family)
  }


  interface Callback {
    fun onSuccess()
    fun onError(error: String)
  }

  fun updateDescriptor(value: String) {
    fontDescriptors.update(value)
  }

  var display: NSCFontDisplay
    get() {
      return fontDescriptors.display
    }
    set(value) {
      fontDescriptors.display = value
    }

  fun setFontDisplay(value: String): FontFace {
    fontDescriptors.setFontDisplay(value)
    return this
  }

  var weight: NSCFontWeight
    get() {
      return fontDescriptors.weight
    }
    set(value) {
      val old = weight
      if (value != old) {
        fontDescriptors.weight = value
        updateFontWeight(old)
      }

    }

  internal fun updateFontWeight(previous: NSCFontWeight) {
    if (fontDescriptors.weight != previous) {
      font?.let {
        font = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          Typeface.create(it, fontDescriptors.weight.weight, fontDescriptors.weight.isBold)
        } else {
          Typeface.create(
            it,
            fontDescriptors.weight.getStyle(fontDescriptors.style == NSCFontStyle.Italic)
          )
        }
      }
    }
  }

  fun setFontWeight(value: String): FontFace {
    val old = weight
    fontDescriptors.setFontWeight(value)
    updateFontWeight(old)
    return this
  }

  internal fun updateFontStyle(previous: NSCFontStyle) {
    if (fontDescriptors.style != previous) {
      font?.let {
        font = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          Typeface.create(
            it,
            fontDescriptors.weight.weight,
            fontDescriptors.style == NSCFontStyle.Italic,
          )
        } else {
          Typeface.create(
            it,
            fontDescriptors.weight.getStyle(fontDescriptors.style == NSCFontStyle.Italic)
          )
        }
      }
    }
  }

  var style: NSCFontStyle
    get() {
      return fontDescriptors.style
    }
    set(value) {
      val old = style
      fontDescriptors.style = value
      updateFontStyle(old)
    }

  fun setFontStyle(value: String): FontFace {
    val old = style
    fontDescriptors.setFontStyle(value)
    updateFontStyle(old)
    return this
  }

  private fun floorToNearestHundred(value: Int): Int {
    return ((value / 100) * 100).coerceAtMost(900)
  }

  private fun getMathFont(weight: Int, italic: Boolean = false): Typeface {
    when (val value = weight.coerceIn(100, 1000)) {
      in 100..499 -> {
        if (italic) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return Typeface.create(Typeface.SANS_SERIF, floorToNearestHundred(value), true)
          }
          return Typeface.create("sans-serif", Typeface.ITALIC)
        }
        return Typeface.create("sans-serif", Typeface.NORMAL)
      }

      in 500..699 -> {
        if (italic) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return Typeface.create(Typeface.SANS_SERIF, floorToNearestHundred(value), true)
          }
          return Typeface.create("sans-serif-medium", Typeface.ITALIC)
        }

        return Typeface.create("sans-serif-medium", Typeface.NORMAL)
      }

      else -> {
        if (italic) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return Typeface.create(Typeface.SANS_SERIF, floorToNearestHundred(value), true)
          }
          return Typeface.create("sans-serif", Typeface.BOLD_ITALIC)
        }

        return Typeface.create("sans-serif", Typeface.BOLD)
      }
    }
  }

  private fun getFangsongFontPath(weight: Int, italic: Boolean = false): Int {
    val value = weight.coerceIn(100, 1000)
    return 0
//		return when (value) {
//			in 100..299 -> R.font.noto_serif_tc_extra_light
//			in 300..399 -> R.font.noto_serif_tc_light
//			in 400..499 -> R.font.noto_serif_tc_regular
//			in 500..599 -> R.font.noto_serif_tc_medium
//			in 600..699 -> R.font.noto_serif_tc_semi_bold
//			in 700..799 -> R.font.noto_serif_tc_bold
//			in 800..899 -> R.font.noto_serif_tc_extra_bold
//			else -> R.font.noto_serif_tc_black
//		}
  }

  private fun cacheData(context: Context, source: String): Typeface {
    val nsFonts = File(context.filesDir, "ns_fonts")
    nsFonts.mkdir()
    val uri = source.toUri()
    if (uri.lastPathSegment == null) {
      throw Error("Invalid source $source")
    }
    val path = File(nsFonts, uri.lastPathSegment!!)
    if (path.exists() && path.length() > 0) {
      val ret = handleFontPath(path)
      fontPath = path.absolutePath
      return ret
    }
    val url = URL(source)
    val fs = FileOutputStream(path)
    url.openStream().use { input ->
      fs.use { output ->
        input.copyTo(output)
      }
    }
    val ret = handleFontPath(path)
    fontPath = path.absolutePath
    return ret
  }

  private fun handleFontPath(file: File): Typeface {
    return Typeface.createFromFile(file)
  }

  fun load(context: Context, callback: (error: String?) -> Unit) {
    if (status == FontFaceStatus.loaded) {
      callback(null)
      return
    }
    status = FontFaceStatus.loading
    executor.execute {
      loadSync(context, callback)
    }
  }

  internal fun loadSync(context: Context, callback: (error: String?) -> Unit) {
    if (status == FontFaceStatus.loaded) {
      callback(null)
      return
    }
    status = FontFaceStatus.loading
    val isMath = fontFamily == "math"
    // todo handle "fangsong"
    when (fontFamily) {
      "math" -> {
        val font = try {
          getMathFont(fontDescriptors.weight.weight)
        } catch (_: Exception) {
          Log.w("JS", "Failed to get $fontFamily font falling back to the system default")
          Typeface.DEFAULT
        }
        status = FontFaceStatus.loaded
        this.font = font
        callback(null)
        return
      }

      else -> {
        if (fontData == null && localOrRemoteSource == null) {
          val family = genericFontFamilies[fontFamily]
          if (family != null) {
            val style = if (fontDescriptors.weight.isBold) {
              if (fontDescriptors.style == NSCFontStyle.Italic) {
                Typeface.BOLD_ITALIC
              } else {
                Typeface.BOLD
              }
            } else {
              fontDescriptors.style.fontStyle
            }

            var font = when (fontFamily) {
              "serif" -> {
                Typeface.SERIF
              }

              "san-serif" -> {
                Typeface.SANS_SERIF
              }

              "monospace" -> {
                Typeface.MONOSPACE
              }

              else -> {
                Typeface.create(family, style)
              }
            }

            if (fontDescriptors.weight != NSCFontWeight.Normal) {
              font = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                Typeface.create(font, fontDescriptors.weight.weight, fontDescriptors.weight.isBold)
              } else {
                Typeface.create(
                  font,
                  fontDescriptors.weight.getStyle(fontDescriptors.style == NSCFontStyle.Italic)
                )
              }
            }




            status = FontFaceStatus.loaded
            this.font = font
            callback(null)
            return
          }
        }
      }
    }

    if (localOrRemoteSource?.startsWith("http") == true) {
      try {
        val font = cacheData(context, localOrRemoteSource!!)
        this.font = font
        status = FontFaceStatus.loaded
        callback(null)
        return
      } catch (e: Exception) {
        status = FontFaceStatus.error
        callback(e.localizedMessage)
        return
      }
    }
  }
}
