package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.text.TextPaint
import android.view.View
import androidx.core.graphics.withClip
import dalvik.annotation.optimization.FastNative
import org.nativescript.mason.masonkit.Border.IKeyCorner
import org.nativescript.mason.masonkit.Styles.TextJustify
import org.nativescript.mason.masonkit.Styles.TextWrap
import org.nativescript.mason.masonkit.enums.Align
import org.nativescript.mason.masonkit.enums.AlignContent
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.BorderStyle
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Direction
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.DisplayMode
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.GridAutoFlow
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.JustifyItems
import org.nativescript.mason.masonkit.enums.JustifySelf
import org.nativescript.mason.masonkit.enums.ListStylePosition
import org.nativescript.mason.masonkit.enums.ListStyleType
import org.nativescript.mason.masonkit.enums.ObjectFit
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Position
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.VerticalAlign
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.ceil


internal fun Int.rgbaToHexCSS(): String {
  val color = this.toUInt()
  val r = (color shr 24) and 0xFFu
  val g = (color shr 16) and 0xFFu
  val b = (color shr 8) and 0xFFu
  val a = (color and 0xFFu).toInt()
  if (a == 255) {
    return "#%02X%02X%02X".format(r.toInt(), g.toInt(), b.toInt())
  }
  return "#%02X%02X%02X%02X".format(
    r.toInt(), g.toInt(), b.toInt(), a
  )
}


object StyleKeys {
  const val DISPLAY = 0
  const val POSITION = 1
  const val DIRECTION = 2
  const val FLEX_DIRECTION = 3
  const val FLEX_WRAP = 4
  const val OVERFLOW_X = 5
  const val OVERFLOW_Y = 6

  const val ALIGN_ITEMS = 7
  const val ALIGN_SELF = 8
  const val ALIGN_CONTENT = 9

  const val JUSTIFY_ITEMS = 10
  const val JUSTIFY_SELF = 11
  const val JUSTIFY_CONTENT = 12

  const val INSET_LEFT_TYPE = 13
  const val INSET_LEFT_VALUE = 14 // float (4 bytes: 14-17)
  const val INSET_RIGHT_TYPE = 18
  const val INSET_RIGHT_VALUE = 19 // float (4 bytes: 19-22)
  const val INSET_TOP_TYPE = 23
  const val INSET_TOP_VALUE = 24 // float (4 bytes: 24-27)
  const val INSET_BOTTOM_TYPE = 28
  const val INSET_BOTTOM_VALUE = 29 // float (4 bytes: 29-32)

  const val MARGIN_LEFT_TYPE = 33
  const val MARGIN_LEFT_VALUE = 34 // float (4 bytes: 34-37)
  const val MARGIN_RIGHT_TYPE = 38
  const val MARGIN_RIGHT_VALUE = 39 // float (4 bytes: 39-42)
  const val MARGIN_TOP_TYPE = 43
  const val MARGIN_TOP_VALUE = 44 // float (4 bytes: 44-47)
  const val MARGIN_BOTTOM_TYPE = 48
  const val MARGIN_BOTTOM_VALUE = 49 // float (4 bytes: 49-52)

  const val PADDING_LEFT_TYPE = 53
  const val PADDING_LEFT_VALUE = 54 // float (4 bytes: 54-57)
  const val PADDING_RIGHT_TYPE = 58
  const val PADDING_RIGHT_VALUE = 59 // float (4 bytes: 59-62)
  const val PADDING_TOP_TYPE = 63
  const val PADDING_TOP_VALUE = 64 // float (4 bytes: 64-67)
  const val PADDING_BOTTOM_TYPE = 68
  const val PADDING_BOTTOM_VALUE = 69 // float (4 bytes: 69-72)

  const val BORDER_LEFT_TYPE = 73
  const val BORDER_LEFT_VALUE = 74 // float (4 bytes: 74-77)
  const val BORDER_RIGHT_TYPE = 78
  const val BORDER_RIGHT_VALUE = 79 // float (4 bytes: 79-82)
  const val BORDER_TOP_TYPE = 83
  const val BORDER_TOP_VALUE = 84 // float (4 bytes: 84-87)
  const val BORDER_BOTTOM_TYPE = 88
  const val BORDER_BOTTOM_VALUE = 89 // float (4 bytes: 89-92)

  const val FLEX_GROW = 93 // float (4 bytes: 93-96)
  const val FLEX_SHRINK = 97 // float (4 bytes: 97-100)

  const val FLEX_BASIS_TYPE = 101
  const val FLEX_BASIS_VALUE = 102 // float (4 bytes: 102-105)

  const val WIDTH_TYPE = 106
  const val WIDTH_VALUE = 107 // float (4 bytes: 107-110)
  const val HEIGHT_TYPE = 111
  const val HEIGHT_VALUE = 112 // float (4 bytes: 112-115)

  const val MIN_WIDTH_TYPE = 116
  const val MIN_WIDTH_VALUE = 117 // float (4 bytes: 117-120)
  const val MIN_HEIGHT_TYPE = 121
  const val MIN_HEIGHT_VALUE = 122 // float (4 bytes: 122-125)

  const val MAX_WIDTH_TYPE = 126
  const val MAX_WIDTH_VALUE = 127 // float (4 bytes: 127-130)
  const val MAX_HEIGHT_TYPE = 131
  const val MAX_HEIGHT_VALUE = 132 // float (4 bytes: 132-135)

  const val GAP_ROW_TYPE = 136
  const val GAP_ROW_VALUE = 137 // float (4 bytes: 137-140)
  const val GAP_COLUMN_TYPE = 141
  const val GAP_COLUMN_VALUE = 142 // float (4 bytes: 142-145)

  const val ASPECT_RATIO = 146 // float (4 bytes: 146-149)
  const val GRID_AUTO_FLOW = 150
  const val GRID_COLUMN_START_TYPE = 151
  const val GRID_COLUMN_START_VALUE = 152 // float (4 bytes: 152-155)
  const val GRID_COLUMN_END_TYPE = 156
  const val GRID_COLUMN_END_VALUE = 157 // float (4 bytes: 157-160)
  const val GRID_ROW_START_TYPE = 161
  const val GRID_ROW_START_VALUE = 162 // float (4 bytes: 162-165)
  const val GRID_ROW_END_TYPE = 166
  const val GRID_ROW_END_VALUE = 167 // float (4 bytes: 167-170)
  const val SCROLLBAR_WIDTH = 171 // float (4 bytes: 171-174)
  const val TEXT_ALIGN = 175
  const val BOX_SIZING = 176
  const val OVERFLOW = 177
  const val ITEM_IS_TABLE = 178
  const val ITEM_IS_REPLACED = 179
  const val DISPLAY_MODE = 180
  const val FORCE_INLINE = 181
  const val MIN_CONTENT_WIDTH = 182 // float (4 bytes: 182-185)
  const val MIN_CONTENT_HEIGHT = 186 // float (4 bytes: 186-189)
  const val MAX_CONTENT_WIDTH = 190 // float (4 bytes: 190-193)
  const val MAX_CONTENT_HEIGHT = 194 // float (4 bytes: 194-197)

  // ----------------------------
  // Border Style (per side)
  // ----------------------------
  const val BORDER_LEFT_STYLE = 198
  const val BORDER_RIGHT_STYLE = 199
  const val BORDER_TOP_STYLE = 200
  const val BORDER_BOTTOM_STYLE = 201

  // ----------------------------
  // Border Color (per side)
  // ----------------------------
  const val BORDER_LEFT_COLOR = 202 // u32 (4 bytes: 202-205)
  const val BORDER_RIGHT_COLOR = 206 // u32 (4 bytes: 206-209)
  const val BORDER_TOP_COLOR = 210 // u32 (4 bytes: 210-213)
  const val BORDER_BOTTOM_COLOR = 214 // u32 (4 bytes: 214-217)

  // ============================================================
  // Border Radius (elliptical + squircle exponent)
  // Each corner = 5 fields (12 bytes total):
  //   x_type (1), x_value (4), y_type (1), y_value (4), exponent (4)
  // ============================================================

  // ----------------------------
  // Top-left corner (12 bytes)
  // ----------------------------
  const val BORDER_RADIUS_TOP_LEFT_X_TYPE = 218
  const val BORDER_RADIUS_TOP_LEFT_X_VALUE = 219 // float (4 bytes: 219-222)
  const val BORDER_RADIUS_TOP_LEFT_Y_TYPE = 223
  const val BORDER_RADIUS_TOP_LEFT_Y_VALUE = 224 // float (4 bytes: 224-227)
  const val BORDER_RADIUS_TOP_LEFT_EXPONENT = 228 // float (4 bytes: 228-231)

  // ----------------------------
  // Top-right corner
  // ----------------------------
  const val BORDER_RADIUS_TOP_RIGHT_X_TYPE = 232
  const val BORDER_RADIUS_TOP_RIGHT_X_VALUE = 233 // float (4 bytes: 233-236)
  const val BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 237
  const val BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 238 // float (4 bytes: 238-241)
  const val BORDER_RADIUS_TOP_RIGHT_EXPONENT = 242 // float (4 bytes: 242-245)

  // ----------------------------
  // Bottom-right corner
  // ----------------------------
  const val BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 246
  const val BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 247 // float (4 bytes: 247-250)
  const val BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 251
  const val BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 252 // float (4 bytes: 252-255)
  const val BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 256 // float (4 bytes: 256-259)

  // ----------------------------
  // Bottom-left corner
  // ----------------------------
  const val BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 260
  const val BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 261 // float (4 bytes: 261-264)
  const val BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 265
  const val BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 266 // float (4 bytes: 266-269)
  const val BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 270 // float (4 bytes: 270-273)

  // ----------------------------
  // Float
  // ----------------------------
  const val FLOAT = 274
  const val CLEAR = 275

  const val OBJECT_FIT = 276

  const val FONT_METRICS_ASCENT_OFFSET = 277 // float (4 bytes: 277-280)
  const val FONT_METRICS_DESCENT_OFFSET = 281 // float (4 bytes: 281-284)
  const val FONT_METRICS_X_HEIGHT_OFFSET = 285 // float (4 bytes: 285-288)
  const val FONT_METRICS_LEADING_OFFSET = 289 // float (4 bytes: 289-292)
  const val FONT_METRICS_CAP_HEIGHT_OFFSET = 293 // float (4 bytes: 293-296)
  const val VERTICAL_ALIGN_OFFSET_OFFSET = 297 // float (4 bytes: 297-300)
  const val VERTICAL_ALIGN_IS_PERCENT_OFFSET = 301
  const val VERTICAL_ALIGN_ENUM_OFFSET = 302 // float (4 bytes: 302-305)
  const val FIRST_BASELINE_OFFSET = 306 // float (4 bytes: 306-309)
  const val Z_INDEX = 310 // float (4 bytes: 310-313)
  const val ITEM_IS_LIST = 314
  const val ITEM_IS_LIST_ITEM = 315
  const val LIST_STYLE_POSITION = 316
  const val LIST_STYLE_TYPE = 317
  const val LIST_STYLE_POSITION_STATE = 318
  const val LIST_STYLE_TYPE_STATE = 319

  const val REF_COUNT = 320 // int

}

@JvmInline
value class StateKeys internal constructor(val bits: Long) {
  companion object {
    val DISPLAY = StateKeys(1L shl 0)
    val POSITION = StateKeys(1L shl 1)
    val DIRECTION = StateKeys(1L shl 2)
    val FLEX_DIRECTION = StateKeys(1L shl 3)
    val FLEX_WRAP = StateKeys(1L shl 4)
    val OVERFLOW_X = StateKeys(1L shl 5)
    val OVERFLOW_Y = StateKeys(1L shl 6)
    val ALIGN_ITEMS = StateKeys(1L shl 7)
    val ALIGN_SELF = StateKeys(1L shl 8)
    val ALIGN_CONTENT = StateKeys(1L shl 9)
    val JUSTIFY_ITEMS = StateKeys(1L shl 10)
    val JUSTIFY_SELF = StateKeys(1L shl 11)
    val JUSTIFY_CONTENT = StateKeys(1L shl 12)
    val INSET = StateKeys(1L shl 13)
    val MARGIN = StateKeys(1L shl 14)
    val PADDING = StateKeys(1L shl 15)
    val BORDER = StateKeys(1L shl 16)
    val FLEX_GROW = StateKeys(1L shl 17)
    val FLEX_SHRINK = StateKeys(1L shl 18)
    val FLEX_BASIS = StateKeys(1L shl 19)
    val SIZE = StateKeys(1L shl 20)
    val MIN_SIZE = StateKeys(1L shl 21)
    val MAX_SIZE = StateKeys(1L shl 22)
    val GAP = StateKeys(1L shl 23)
    val ASPECT_RATIO = StateKeys(1L shl 24)
    val GRID_AUTO_FLOW = StateKeys(1L shl 25)
    val GRID_COLUMN = StateKeys(1L shl 26)
    val GRID_ROW = StateKeys(1L shl 27)
    val SCROLLBAR_WIDTH = StateKeys(1L shl 28)
    val ALIGN = StateKeys(1L shl 29)
    val BOX_SIZING = StateKeys(1L shl 30)
    val OVERFLOW = StateKeys(1L shl 31)
    val ITEM_IS_TABLE = StateKeys(1L shl 32)
    val ITEM_IS_REPLACED = StateKeys(1L shl 33)
    val DISPLAY_MODE = StateKeys(1L shl 34)
    val FORCE_INLINE = StateKeys(1L shl 35)
    val MIN_CONTENT_WIDTH = StateKeys(1L shl 36)
    val MIN_CONTENT_HEIGHT = StateKeys(1L shl 37)
    val MAX_CONTENT_WIDTH = StateKeys(1L shl 38)
    val MAX_CONTENT_HEIGHT = StateKeys(1L shl 39)
    val BORDER_STYLE = StateKeys(1L shl 40)
    val BORDER_RADIUS = StateKeys(1L shl 41)
    val BORDER_COLOR = StateKeys(1L shl 42)
    val FLOAT = StateKeys(1L shl 43)
    val CLEAR = StateKeys(1L shl 44)
    val OBJECT_FIT = StateKeys(1L shl 45)
    val Z_INDEX = StateKeys(1L shl 46)
    val LIST_STYLE_POSITION = StateKeys(1L shl 47)
    val LIST_STYLE_TYPE = StateKeys(1L shl 48)

  }

  infix fun or(other: StateKeys): StateKeys = StateKeys(bits or other.bits)
  infix fun and(other: StateKeys): StateKeys = StateKeys(bits and other.bits)
  infix fun hasFlag(flag: StateKeys): Boolean = (bits and flag.bits) != 0L
}

object TextStyleChangeMask {
  const val NONE: Int = 0
  const val COLOR: Int = 1 shl 0
  const val DECORATION_LINE: Int = 1 shl 1
  const val DECORATION_COLOR: Int = 1 shl 2
  const val TEXT_ALIGN: Int = 1 shl 3
  const val TEXT_JUSTIFY: Int = 1 shl 4
  const val BACKGROUND_COLOR: Int = 1 shl 5
  const val FONT_SIZE: Int = 1 shl 6
  const val TEXT_TRANSFORM: Int = 1 shl 7
  const val FONT_STYLE: Int = 1 shl 8
  const val FONT_STYLE_SLANT: Int = 1 shl 9
  const val TEXT_WRAP: Int = 1 shl 10
  const val TEXT_OVERFLOW: Int = 1 shl 11
  const val DECORATION_STYLE: Int = 1 shl 12
  const val WHITE_SPACE: Int = 1 shl 13
  const val FONT_WEIGHT: Int = 1 shl 14
  const val LINE_HEIGHT: Int = 1 shl 15
  const val VERTICAL_ALIGN: Int = 1 shl 16
  const val DECORATION_THICKNESS: Int = 1 shl 17
  const val TEXT_SHADOW: Int = 1 shl 18
  const val FONT_FAMILY: Int = 1 shl 19
  const val LETTER_SPACING: Int = 1 shl 20
  const val ALL: Int = -1
}


@JvmInline
internal value class GridStateKeys internal constructor(val bits: Long) {
  companion object {
    val gridTemplateAreas = GridStateKeys(1L shl 0)
    val gridAutoRows = GridStateKeys(1L shl 1)
    val gridAutoColumns = GridStateKeys(1L shl 2)
    val gridRowStart = GridStateKeys(1L shl 3)
    val gridRowEnd = GridStateKeys(1L shl 4)
    val gridColumnStart = GridStateKeys(1L shl 5)
    val gridColumnEnd = GridStateKeys(1L shl 6)
    val gridTemplateRows = GridStateKeys(1L shl 7)
    val gridTemplateColumns = GridStateKeys(1L shl 8)
  }

  infix fun or(other: GridStateKeys): GridStateKeys = GridStateKeys(bits or other.bits)
  infix fun and(other: GridStateKeys): GridStateKeys = GridStateKeys(bits and other.bits)
  infix fun hasFlag(flag: GridStateKeys): Boolean = (bits and flag.bits) != 0L
}

internal class GridState {
  var gridArea: String? = null
  var gridTemplateAreas: String? = null
  var gridAutoRows: String? = null
  var gridAutoColumns: String? = null
  var gridRow: String? = null
  var gridRowStart: String? = null
  var gridRowEnd: String? = null
  var gridColumn: String? = null
  var gridColumnStart: String? = null
  var gridColumnEnd: String? = null
  var gridTemplateRows: String? = null
  var gridTemplateColumns: String? = null

  fun clear() {
    gridArea = null
    gridTemplateAreas = null
    gridAutoRows = null
    gridAutoColumns = null
    gridRow = null
    gridRowStart = null
    gridRowEnd = null
    gridColumn = null
    gridColumnStart = null
    gridColumnEnd = null
    gridTemplateRows = null
    gridTemplateColumns = null
  }
}

interface StyleChangeListener {
  fun onTextStyleChanged(change: Int)
}

internal object StyleState {
  const val INHERIT: Byte = 0
  const val SET: Byte = 1
}

class Style internal constructor(internal var node: Node) {
  internal var isValueInitialized: Boolean = false
  internal var isTextValueInitialized: Boolean = false
  internal var gridState = GridState()

  internal var fontDirty = false

  // Guard flag: true while inside Rust measure callback (read lock held, no buffer writes)
  @JvmField
  internal var inMeasure = false
  private var pendingMetricsSync = false

  var font: FontFace = FontFace("sans-serif").apply {
    owner = this@Style
  }
    set(value) {
      val old = field
      if (old !== value) {
        field = value
        value.owner = this
        invalidateResolvedFontFace()
      }
    }

  // Cached resolved font face - invalidated when font properties change
  private var _cachedResolvedFontFace: FontFace? = null
  private var _resolvedFontFaceDirty = true

  private fun invalidateResolvedFontFace() {
    _resolvedFontFaceDirty = true
    _cachedResolvedFontFace = null
    fontDirty = true
  }

  data class FontMetrics(
    val ascent: Float,
    val descent: Float,
    val xHeight: Float,
    val leading: Float,
    val capHeight: Float
  ) {
    companion object {
      @JvmStatic
      fun from(style: Style): FontMetrics {
        return FontMetrics(
          style.values.getFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET),
          style.values.getFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET),
          style.values.getFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET),
          style.values.getFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET),
          style.values.getFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET)
        )
      }
    }
  }


  private var defaultPaint: TextPaint? = null

  internal val paint: TextPaint
    get() {
      return if (node.view is TextContainer) {
        (node.view as TextContainer).getPaint()
      } else {
        if (defaultPaint == null) {
          defaultPaint = TextPaint()
        }
        defaultPaint?.apply {
          textSize =
            Constants.DEFAULT_FONT_SIZE * ((node.view as? View)?.resources?.displayMetrics?.density
              ?: Mason.shared.scale)
        }
        defaultPaint!!.apply {
          if (font.font == null) {
            (node.view as? View)?.let {
              font.loadSync(it.context) {}
            }
          }
          // this.typeface = font.font
        }
      }
    }

  internal fun getFontMetrics(): FontMetrics {
    return FontMetrics.from(this)
  }

  private val xBounds = android.graphics.Rect()

  private val capBounds = android.graphics.Rect()


  /**
   * Update font metrics on a Mason node when font changes.
   * When called during a Rust measure callback (inMeasure == true),
   * the write is deferred to avoid deadlocking the rwlock.
   */
  internal fun syncFontMetrics() {
    if (!fontDirty) return
    if (inMeasure) {
      pendingMetricsSync = true
      return
    }
    syncFontMetricsNow()
  }

  private fun syncFontMetricsNow() {
    val fm = paint.fontMetrics

    // Android uses negative ascent, positive descent
    val ascent = -fm.ascent
    val descent = fm.descent
    val leading = fm.leading

    // Android doesn't directly expose x-height or cap-height
    // We approximate them based on the font
    val xHeight = getXHeight(paint, xBounds) ?: (ascent * 0.5f)
    val capHeight = getCapHeight(paint, capBounds) ?: (ascent * 0.7f)
    prepareMut()
    values.putFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, ascent)
    values.putFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, descent)
    values.putFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, xHeight)
    values.putFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, leading)
    values.putFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, capHeight)
    fontDirty = false
  }

  /**
   * Flush deferred font metrics sync after measure callback returns.
   * Returns true if a sync was pending (caller should mark node dirty).
   */
  internal fun flushPendingMetricsSync(): Boolean {
    if (!pendingMetricsSync) return false
    pendingMetricsSync = false
    syncFontMetricsNow()
    return true
  }

  /**
   * Update first baseline after text layout
   */
  internal fun updateFirstBaseline() {
    val baseline = -paint.fontMetrics.ascent
    prepareMut()
    values.putFloat(StyleKeys.FIRST_BASELINE_OFFSET, baseline)
  }

  /**
   * Clear metrics when node no longer has text
   */
  internal fun clearFontMetrics() {
    prepareMut()
    values.putFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, 14f)
    values.putFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, 4f)
    values.putFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, 7f)
    values.putFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, 0f)
    values.putFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, 10f)
  }

  private val mPlaceholder by lazy {
    isValueInitialized = true
    // use the same capacity set in rust
    ByteBuffer.allocateDirect(320).apply {
      order(ByteOrder.nativeOrder())

      // default ratio to NAN
      putFloat(StyleKeys.ASPECT_RATIO, Float.NaN)
      // default shrink to 1
      putFloat(StyleKeys.FLEX_SHRINK, 1f)

      putFloat(StyleKeys.BORDER_RADIUS_TOP_LEFT_EXPONENT, 1f)
      putFloat(StyleKeys.BORDER_RADIUS_TOP_RIGHT_EXPONENT, 1f)
      putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, 1f)
      putFloat(StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, 1f)


      // Default font metrics

      putFloat(StyleKeys.FONT_METRICS_ASCENT_OFFSET, 14f)
      putFloat(StyleKeys.FONT_METRICS_DESCENT_OFFSET, 4f)
      putFloat(StyleKeys.FONT_METRICS_X_HEIGHT_OFFSET, 7f)
      putFloat(StyleKeys.FONT_METRICS_LEADING_OFFSET, 0f)
      putFloat(StyleKeys.FONT_METRICS_CAP_HEIGHT_OFFSET, 10f)

      putFloat(StyleKeys.FIRST_BASELINE_OFFSET, Float.NaN)

      put(StyleKeys.OBJECT_FIT, ObjectFit.Fill.value)
      put(StyleKeys.DISPLAY, Display.Block.value)

      // default Normal -> -1
      put(StyleKeys.ALIGN_ITEMS, -1)
      put(StyleKeys.ALIGN_SELF, -1)
      put(StyleKeys.ALIGN_CONTENT, -1)

      put(StyleKeys.JUSTIFY_ITEMS, -1)
      put(StyleKeys.JUSTIFY_SELF, -1)
      put(StyleKeys.JUSTIFY_CONTENT, -1)

      put(StyleKeys.MARGIN_LEFT_TYPE, 1)
      put(StyleKeys.MARGIN_TOP_TYPE, 1)
      put(StyleKeys.MARGIN_RIGHT_TYPE, 1)
      put(StyleKeys.MARGIN_BOTTOM_TYPE, 1)
      put(StyleKeys.REF_COUNT, 1)

//          putInt(StyleKeys.PADDING_LEFT_TYPE, 0)
//          putInt(StyleKeys.PADDING_TOP_TYPE, 0)
//          putInt(StyleKeys.PADDING_RIGHT_TYPE, 0)
//          putInt(StyleKeys.PADDING_BOTTOM_TYPE, 0)


//          putInt(StyleKeys.BORDER_LEFT_TYPE, 0)
//          putInt(StyleKeys.BORDER_TOP_TYPE, 0)
//          putInt(StyleKeys.BORDER_RIGHT_TYPE, 0)
//          putInt(StyleKeys.BORDER_BOTTOM_TYPE, 0)
    }
  }
  private var mValues: ByteBuffer? = null

  private var mWritableValue: ByteBuffer? = null

  internal fun prepareMut() {
    if (node.isPlaceholder) {
      return
    }

    val mutable = values[StyleKeys.REF_COUNT] == 1.toByte()

    if (!mutable) {
      val buffer =
        ObjectManager.shared[nativePrepareMut(node.mason.nativePtr, node.nativePtr)] as ByteBuffer
      buffer.apply {
        order(ByteOrder.nativeOrder())
      }

      isValueInitialized = true
      mWritableValue = buffer
    } else {
      isValueInitialized = true
      mWritableValue = values
    }
  }

  val writableValue: ByteBuffer
    get() {
      if (node.isPlaceholder) {
        return mPlaceholder
      }
      prepareMut()

      return (mWritableValue)!!
    }

  val values: ByteBuffer
    get() {
      return mWritableValue ?: mValues ?: run {
        val buffer =
          ObjectManager.shared[nativeGetStyleBuffer(
            node.mason.nativePtr,
            node.nativePtr
          )] as ByteBuffer
        buffer.apply {
          order(ByteOrder.nativeOrder())
        }
        mValues = buffer
        buffer
      }
    }

  val textValues: ByteBuffer by lazy {
    isTextValueInitialized = true
    ByteBuffer.allocateDirect(57).apply {
      order(ByteOrder.nativeOrder())

      // Initialize all values with INHERIT state
      putInt(TextStyleKeys.COLOR, Color.BLACK)
      put(TextStyleKeys.COLOR_STATE, StyleState.INHERIT)

      putInt(TextStyleKeys.SIZE, Constants.DEFAULT_FONT_SIZE)
      put(TextStyleKeys.SIZE_STATE, StyleState.INHERIT)

      put(TextStyleKeys.FONT_WEIGHT, FontFace.NSCFontWeight.Normal.weight.toByte())
      put(TextStyleKeys.FONT_WEIGHT_STATE, StyleState.INHERIT)

      put(TextStyleKeys.FONT_STYLE_STATE, StyleState.INHERIT)
      put(TextStyleKeys.FONT_FAMILY_STATE, StyleState.INHERIT)

      putInt(TextStyleKeys.BACKGROUND_COLOR, 0)
      put(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.INHERIT)

      putInt(TextStyleKeys.DECORATION_COLOR, Constants.UNSET_COLOR.toInt())
      put(TextStyleKeys.DECORATION_COLOR_STATE, StyleState.INHERIT)

      put(TextStyleKeys.DECORATION_LINE_STATE, StyleState.INHERIT)
      put(TextStyleKeys.DECORATION_STYLE_STATE, StyleState.INHERIT)

      putFloat(TextStyleKeys.LETTER_SPACING, 0f)
      put(TextStyleKeys.LETTER_SPACING_STATE, StyleState.INHERIT)

      put(TextStyleKeys.TEXT_WRAP_STATE, StyleState.INHERIT)
      put(TextStyleKeys.WHITE_SPACE_STATE, StyleState.INHERIT)
      put(TextStyleKeys.TRANSFORM_STATE, StyleState.INHERIT)

      put(TextStyleKeys.TEXT_ALIGN, TextAlign.Start.value)
      put(TextStyleKeys.TEXT_ALIGN_STATE, StyleState.INHERIT)

      put(TextStyleKeys.TEXT_JUSTIFY, TextJustify.None.value)
      put(TextStyleKeys.TEXT_JUSTIFY_STATE, StyleState.INHERIT)
    }
  }

  internal var isDirty = -1L
  private var isSlowDirty = false
    set(value) {
      if (value && !inBatch) {
        updateNativeStyle()
      }
      field = value
    }

  internal var isTextDirty = -1L

  internal fun setOrAppendState(value: StateKeys) {
    isDirty = if (isDirty == -1L) {
      value.bits
    } else {
      isDirty or value.bits
    }
    if (!inBatch) {
      updateNativeStyle()
    }
  }

  internal fun setOrAppendState(keys: Array<StateKeys>) {
    for (value in keys) {
      isDirty = if (isDirty == -1L) {
        value.bits
      } else {
        isDirty or value.bits
      }
    }
    if (!inBatch) {
      updateNativeStyle()
    }
  }

  internal fun updateTextStyle() {
    if (node.nativePtr == 0L) {
      return
    }

    if (isTextDirty != -1L) {
      var invalidate = false
      val value = TextStateKeys(isTextDirty)
      val backgroundColorDirty = value.hasFlag(TextStateKeys.BACKGROUND_COLOR)
      val colorDirty = value.hasFlag(TextStateKeys.COLOR)
      val sizeDirty = value.hasFlag(TextStateKeys.SIZE)
      val weightDirty = value.hasFlag(TextStateKeys.FONT_WEIGHT)
      val styleDirty = value.hasFlag(TextStateKeys.FONT_STYLE)
      val lineHeightDirty = value.hasFlag(TextStateKeys.LINE_HEIGHT)
      if (value.hasFlag(TextStateKeys.TRANSFORM) || value.hasFlag(TextStateKeys.TEXT_WRAP) || value.hasFlag(
          TextStateKeys.WHITE_SPACE
        ) || value.hasFlag(
          TextStateKeys.TEXT_OVERFLOW
        ) || colorDirty || value.hasFlag(TextStateKeys.BACKGROUND_COLOR) || value.hasFlag(
          TextStateKeys.DECORATION_COLOR
        ) || value.hasFlag(TextStateKeys.DECORATION_LINE) || sizeDirty || weightDirty || styleDirty || lineHeightDirty || value.hasFlag(
          TextStateKeys.DECORATION_THICKNESS
        ) || value.hasFlag(
          TextStateKeys.TEXT_SHADOWS
        )
      ) {
        invalidate = true
      }

      var state = TextStyleChangeMask.NONE

      if (styleDirty) {
        state = state or TextStyleChangeMask.FONT_STYLE
      }

      if (weightDirty) {
        state = state or TextStyleChangeMask.FONT_WEIGHT
      }

      if (sizeDirty) {
        state = state or TextStyleChangeMask.FONT_SIZE
      }

      if (colorDirty) {
        state = state or TextStyleChangeMask.COLOR
      }

      if (lineHeightDirty) {
        state = state or TextStyleChangeMask.LINE_HEIGHT
      }

      if (backgroundColorDirty) {
        if (mBackground == null) {
          mBackground = Background(this)
        }
        state = state or TextStyleChangeMask.BACKGROUND_COLOR
      }

      if (state != TextStyleChangeMask.NONE) {
        notifyTextStyleChanged(state)
      }

      isTextDirty = -1L

      if (invalidate && isDirty == -1L) {
        (node.view as? Element)?.invalidateLayout()
      }
      return
    }
  }

  internal fun setOrAppendState(value: TextStateKeys) {
    isTextDirty = if (isTextDirty == -1L) {
      value.bits
    } else {
      isTextDirty or value.bits
    }

    if (!inBatch) {
      updateTextStyle()
    }

  }

  private fun setOrAppendState(keys: Array<TextStateKeys>) {
    for (value in keys) {
      isTextDirty = if (isTextDirty == -1L) {
        value.bits
      } else {
        isTextDirty or value.bits
      }
    }
    if (!inBatch) {
      updateTextStyle()
    }
  }

  private fun resetState() {
    isDirty = -1
    isSlowDirty = false
    gridState.clear()
  }

  var inBatch: Boolean = false
    set(value) {
      val changed = field && !value
      field = value
      if (changed) {
        updateTextStyle()
        updateNativeStyle()
      }
    }

  fun configure(block: (Style) -> Unit) {
    inBatch = true
    block(this)
    inBatch = false
  }

  private var styleChangeListener: StyleChangeListener? = null

  internal fun setStyleChangeListener(listener: StyleChangeListener?) {
    styleChangeListener = listener
  }

  @Suppress("NOTHING_TO_INLINE")
  private inline fun notifyTextStyleChanged(change: Int) {
    styleChangeListener?.onTextStyleChanged(change)
  }

  private inline val isMutable: Boolean
    get() {
      return values[StyleKeys.REF_COUNT] == 1.toByte()
    }

  // allow overriding of the display
  internal var forceInline: Boolean
    get() {
      return values.get(StyleKeys.FORCE_INLINE) != Constants.ZERO
    }
    set(value) {
      prepareMut()
      values.put(
        StyleKeys.FORCE_INLINE, if (value) {
          1
        } else {
          0
        }
      )
      setOrAppendState(StateKeys.FORCE_INLINE)
    }

  var zIndex: Int
    get() {
      return values.getInt(StyleKeys.Z_INDEX)
    }
    set(value) {
      prepareMut()
      values.putInt(StyleKeys.Z_INDEX, value)
      setOrAppendState(StateKeys.Z_INDEX)
    }


  var objectFit: ObjectFit
    get() {
      return ObjectFit.from(values.get(StyleKeys.OBJECT_FIT))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.OBJECT_FIT, value.value)
      setOrAppendState(StateKeys.OBJECT_FIT)
    }


  var float: org.nativescript.mason.masonkit.enums.Float
    get() {
      return org.nativescript.mason.masonkit.enums.Float.from(values.get(StyleKeys.FLOAT))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.FLOAT, value.value)
      setOrAppendState(StateKeys.FLOAT)
    }

  var clear: org.nativescript.mason.masonkit.enums.Clear
    get() {
      return org.nativescript.mason.masonkit.enums.Clear.from(values.get(StyleKeys.CLEAR))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.CLEAR, value.value)
      setOrAppendState(StateKeys.CLEAR)
    }

  internal var mFilter: CSSFilters.CSSFilter? = null

  var filter: String = ""
    set(value) {
      field = value
      val hadFilters = mFilter?.filters?.isNotEmpty() ?: false
      mFilter = CSSFilters.parse(value)
      if (mFilter?.filters?.isNotEmpty() == true || (value.isEmpty() && hadFilters)) {
        (node.view as? View)?.invalidate()
      }
    }

  internal var mBackground: Background? = null
  internal var mBackgroundRaw: String = ""
  var background: String
    get() = mBackgroundRaw
    set(value) {
      if (value.isEmpty()) {
        mBackground?.clear()
      } else {
        parseBackground(this, value)?.let {
          mBackground = it
          mBackgroundRaw = value
          (node.view as? View)?.invalidate()
        }
      }

    }

  var backgroundImage: String
    get() {
      return mBackground?.layers
        ?.map { it.image }?.joinToString(",", "", ";") ?: ""
    }
    set(value) {
      if (mBackground == null) {
        mBackground = Background(this)
      }
      val layers = parseBackgroundLayers(value)
      mBackground?.layers = layers.toMutableList()
    }

  fun setBackgroundColor(value: String) {
    parseColor(value)?.let {
      (mBackground ?: run { Background(this) }).color = it
    }
  }

  var textJustify: TextJustify
    get() {
      return TextJustify.from(textValues.get(TextStyleKeys.TEXT_JUSTIFY))
    }
    set(value) {
      textValues.put(TextStyleKeys.TEXT_JUSTIFY, value.value)
      textValues.put(TextStyleKeys.TEXT_JUSTIFY_STATE, StyleState.SET)
      if (inBatch) {
        setOrAppendState(TextStateKeys.TEXT_JUSTIFY)
      } else {
        notifyTextStyleChanged(TextStyleChangeMask.TEXT_JUSTIFY)
      }
    }

  var color: Int
    get() = textValues.getInt(TextStyleKeys.COLOR)
    set(value) {
      textValues.putInt(TextStyleKeys.COLOR, value)
      textValues.put(TextStyleKeys.COLOR_STATE, StyleState.SET)
      if (inBatch) {
        setOrAppendState(TextStateKeys.COLOR)
      } else {
        notifyTextStyleChanged(TextStyleChangeMask.COLOR)
      }
    }

  fun setColor(value: String) {
    parseColor(value)?.let {
      color = it
    }
  }

  var fontFamily: String
    get() {
      return font.fontFamily
    }
    set(value) {
      val oldFamily = font.fontFamily
      if (oldFamily != value) {
        val oldFont = font
        // Create new font with updated family
        font = FontFace(value).apply {
          weight = oldFont.weight
          style = oldFont.style
          fontDescriptors.display = oldFont.fontDescriptors.display
          owner = this@Style
        }
        textValues.put(TextStyleKeys.FONT_FAMILY_STATE, StyleState.SET)
        notifyTextStyleChanged(TextStyleChangeMask.FONT_FAMILY)
      }
    }

  var fontVariant: String
    get() {
      return font.fontDescriptors.variationSettings
    }
    set(value) {
      // todo
    }

  var fontStretch: String
    get() {
      return font.fontDescriptors.stretch
    }
    set(value) {
      // todo
    }

  var fontFeatureSettings: String
    get() {
      return font.fontDescriptors.featureSettings
    }
    set(value) {
      // todo
    }

  var fontKerning: String
    get() {
      return font.fontDescriptors.kerning
    }
    set(value) {
      // todo
    }

  var fontVariantLigatures: String
    get() {
      return font.fontDescriptors.variantLigatures
    }
    set(value) {
      // todo
    }


  var fontSize: Int
    get() {
      return textValues.getInt(TextStyleKeys.SIZE)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.SIZE, value)
      textValues.put(TextStyleKeys.SIZE_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.FONT_SIZE)
    }

  var fontWeight: FontFace.NSCFontWeight
    get() {
      val weight = textValues.getInt(TextStyleKeys.FONT_WEIGHT)
      return FontFace.NSCFontWeight.from(weight)
    }
    set(value) {
      val old = fontWeight
      if (value != old) {
        textValues.putInt(TextStyleKeys.FONT_WEIGHT, value.weight)
        textValues.put(TextStyleKeys.FONT_WEIGHT_STATE, StyleState.SET)
        font.weight = value
        invalidateResolvedFontFace()
        notifyTextStyleChanged(TextStyleChangeMask.FONT_WEIGHT)
      }
    }

  var fontStyle: FontFace.NSCFontStyle
    set(value) {
      val previous = fontStyle
      if (previous != value) {
        textValues.put(TextStyleKeys.FONT_STYLE_TYPE, value.style.value.toByte())
        textValues.put(TextStyleKeys.FONT_STYLE_STATE, StyleState.SET)
        font.style = value
        invalidateResolvedFontFace()
        notifyTextStyleChanged(TextStyleChangeMask.FONT_STYLE)
      }
    }
    get() {
      val style = textValues.get(TextStyleKeys.FONT_STYLE_TYPE)
      when (style) {
        0.toByte() -> {
          return FontFace.NSCFontStyle.Normal
        }

        1.toByte() -> {
          return FontFace.NSCFontStyle.Italic
        }

        2.toByte() -> {
          return FontFace.NSCFontStyle.Oblique()
        }

        else -> {
          return FontFace.NSCFontStyle.Normal
        }
      }
    }


  var letterSpacing: Float
    get() {
      return textValues.getFloat(TextStyleKeys.LETTER_SPACING)
    }
    set(value) {
      textValues.putFloat(TextStyleKeys.LETTER_SPACING, value)
      textValues.put(TextStyleKeys.LETTER_SPACING_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.LETTER_SPACING)
    }

  var textWrap: TextWrap
    get() {
      return TextWrap.from(textValues.get(TextStyleKeys.TEXT_WRAP))
    }
    set(value) {
      textValues.put(TextStyleKeys.TEXT_WRAP, value.value)
      textValues.put(TextStyleKeys.TEXT_WRAP_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.TEXT_WRAP)
    }

  var whiteSpace: Styles.WhiteSpace
    get() {
      return Styles.WhiteSpace.from(textValues.get(TextStyleKeys.WHITE_SPACE))
    }
    set(value) {
      textValues.put(TextStyleKeys.WHITE_SPACE, value.value)
      textValues.put(TextStyleKeys.WHITE_SPACE_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.WHITE_SPACE)
    }

  var textTransform: Styles.TextTransform
    get() {
      return Styles.TextTransform.from(textValues.get(TextStyleKeys.TRANSFORM))
    }
    set(value) {
      textValues.put(TextStyleKeys.TRANSFORM, value.value)
      textValues.put(TextStyleKeys.TRANSFORM_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.TEXT_TRANSFORM)
    }

  var verticalAlign: VerticalAlign
    get() {
      return VerticalAlign.fromStyle(this)
    }
    set(value) {
      when (value) {
        VerticalAlign.Length -> {
          prepareMut()
          values.put(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0)
          values.put(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0)
          values.putFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, value.value)
        }

        VerticalAlign.Percent -> {
          prepareMut()
          values.put(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, 0)
          values.put(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 1)
          values.putFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, value.value)
        }

        else -> {
          prepareMut()
          values.put(StyleKeys.VERTICAL_ALIGN_ENUM_OFFSET, value.type)
          values.put(StyleKeys.VERTICAL_ALIGN_IS_PERCENT_OFFSET, 0)
          values.putFloat(StyleKeys.VERTICAL_ALIGN_OFFSET_OFFSET, 0f)
        }
      }

      notifyTextStyleChanged(TextStyleChangeMask.VERTICAL_ALIGN)
    }


  var backgroundColor: Int
    get() {
      return textValues.getInt(TextStyleKeys.BACKGROUND_COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.BACKGROUND_COLOR, value)
      textValues.put(TextStyleKeys.BACKGROUND_COLOR_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.BACKGROUND_COLOR)
    }

  var decorationLine: Styles.DecorationLine
    get() {
      return Styles.DecorationLine.from(textValues.get(TextStyleKeys.DECORATION_LINE))
    }
    set(value) {
      textValues.put(TextStyleKeys.DECORATION_LINE, value.value)
      textValues.put(TextStyleKeys.DECORATION_LINE_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.DECORATION_LINE)
    }

  var decorationColor: Int
    get() {
      return textValues.getInt(TextStyleKeys.DECORATION_COLOR)
    }
    set(value) {
      textValues.putInt(TextStyleKeys.DECORATION_COLOR, value)
      textValues.put(TextStyleKeys.DECORATION_COLOR_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.DECORATION_COLOR)
    }

  var decorationStyle: Styles.DecorationStyle
    get() {
      return Styles.DecorationStyle.from(
        textValues.get(TextStyleKeys.DECORATION_STYLE)
      )
    }
    set(value) {
      textValues.put(TextStyleKeys.DECORATION_STYLE, value.value)
      textValues.put(TextStyleKeys.DECORATION_STYLE_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.DECORATION_STYLE)
    }


  var decorationThickness: Float
    get() {
      return textValues.getFloat(TextStyleKeys.DECORATION_THICKNESS)
    }
    set(value) {
      textValues.putFloat(TextStyleKeys.DECORATION_THICKNESS, value)
      textValues.put(TextStyleKeys.DECORATION_THICKNESS_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.DECORATION_THICKNESS)
    }

  var lineHeight: Float
    get() {
      return textValues.getFloat(TextStyleKeys.LINE_HEIGHT)
    }
    set(value) {
      textValues.putFloat(TextStyleKeys.LINE_HEIGHT, value)
      textValues.put(TextStyleKeys.LINE_HEIGHT_STATE, StyleState.SET)
      textValues.put(TextStyleKeys.LINE_HEIGHT_TYPE, 0)
      notifyTextStyleChanged(TextStyleChangeMask.LETTER_SPACING)
    }

  fun setLineHeight(value: Float, isRelative: Boolean) {
    textValues.putFloat(TextStyleKeys.LINE_HEIGHT, value)
    textValues.put(TextStyleKeys.LINE_HEIGHT_STATE, StyleState.SET)
    if (!isRelative) {
      textValues.put(TextStyleKeys.LINE_HEIGHT_TYPE, 1)
    } else {
      textValues.put(TextStyleKeys.LINE_HEIGHT_TYPE, 0)
    }
    notifyTextStyleChanged(TextStyleChangeMask.LETTER_SPACING)
  }


  var textOverflow: Styles.TextOverflow = Styles.TextOverflow.Clip
    set(value) {
      field = value
      textValues.put(TextStyleKeys.TRANSFORM, value.value)
      textValues.put(TextStyleKeys.TRANSFORM_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.TEXT_OVERFLOW)
    }


  var display: Display
    get() {
      val mode = DisplayMode.from(values.get(StyleKeys.DISPLAY_MODE))
      return when (mode) {
        DisplayMode.None -> {
          Display.from(values.get(StyleKeys.DISPLAY))
        }

        DisplayMode.Inline -> {
          Display.Inline
        }

        DisplayMode.ListItem -> {
          Display.ListItem
        }

        DisplayMode.Box -> {
          when (Display.from(values.get(StyleKeys.DISPLAY))) {
            Display.Flex -> Display.InlineFlex
            Display.Grid -> Display.InlineGrid
            Display.Block -> Display.InlineBlock
            else -> {
              // invalidate state
              // Block, Flex, Grid
              throw IllegalStateException("Display cannot be anything other than 0,1,2 when mode is set")
            }
          }
        }
      }
    }
    set(value) {
      var displayMode = DisplayMode.None
      val display = when (value) {
        Display.None, Display.Flex, Display.Grid, Display.Block -> value.value
        Display.Inline -> {
          displayMode = DisplayMode.Inline
          Display.Block.value
        }

        Display.InlineBlock -> {
          displayMode = DisplayMode.Box
          Display.Block.value
        }

        Display.InlineFlex -> {
          displayMode = DisplayMode.Box
          Display.Flex.value
        }

        Display.InlineGrid -> {
          displayMode = DisplayMode.Box
          Display.Grid.value
        }

        Display.ListItem -> {
          displayMode = DisplayMode.ListItem
          Display.Block.value
        }
      }

      prepareMut()
      values.put(StyleKeys.DISPLAY_MODE, displayMode.value)
      values.put(StyleKeys.DISPLAY, display)
      setOrAppendState(arrayOf(StateKeys.DISPLAY_MODE, StateKeys.DISPLAY))
    }

  var position: Position
    get() {
      return Position.from(values.get(StyleKeys.POSITION))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.POSITION, value.value)
      setOrAppendState(StateKeys.POSITION)
    }

  // TODO
  var direction: Direction
    get() {
      return Direction.from(values.get(StyleKeys.DIRECTION))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.DIRECTION, value.value)
      setOrAppendState(StateKeys.DIRECTION)
    }

  var flexDirection: FlexDirection
    get() {
      return FlexDirection.from(values.get(StyleKeys.FLEX_DIRECTION))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.FLEX_DIRECTION, value.value)
      setOrAppendState(StateKeys.FLEX_DIRECTION)
    }

  var flexWrap: FlexWrap
    get() {
      return FlexWrap.from(values.get(StyleKeys.FLEX_WRAP))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.FLEX_WRAP, value.value)
      setOrAppendState(StateKeys.FLEX_WRAP)
    }

  var overflow: Point<Overflow>
    get() {
      return Point(
        Overflow.from(values.get(StyleKeys.OVERFLOW_X)),
        Overflow.from(values.get(StyleKeys.OVERFLOW_Y))
      )
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.OVERFLOW_X, value.x.value)
      values.put(StyleKeys.OVERFLOW_Y, value.x.value)
      setOrAppendState(arrayOf(StateKeys.OVERFLOW_X, StateKeys.OVERFLOW_Y))
    }

  var overflowX: Overflow
    get() {
      return Overflow.from(values.get(StyleKeys.OVERFLOW_X))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.OVERFLOW_X, value.value)
      setOrAppendState(StateKeys.OVERFLOW_X)
    }

  var overflowY: Overflow
    get() {
      return Overflow.from(values.get(StyleKeys.OVERFLOW_Y))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.OVERFLOW_Y, value.value)
      setOrAppendState(StateKeys.OVERFLOW_Y)
    }

  var alignItems: AlignItems
    get() {
      return AlignItems.from(values.get(StyleKeys.ALIGN_ITEMS))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.ALIGN_ITEMS, value.value)
      setOrAppendState(StateKeys.ALIGN_ITEMS)
    }

  var alignSelf: AlignSelf
    get() {
      return AlignSelf.from(values.get(StyleKeys.ALIGN_SELF))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.ALIGN_SELF, value.value)
      setOrAppendState(StateKeys.ALIGN_SELF)
    }

  var alignContent: AlignContent
    get() {
      return AlignContent.from(values.get(StyleKeys.ALIGN_CONTENT))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.ALIGN_CONTENT, value.value)
      setOrAppendState(StateKeys.ALIGN_CONTENT)
    }


  var justifyItems: JustifyItems
    get() {
      return JustifyItems.from(values.get(StyleKeys.JUSTIFY_ITEMS))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.JUSTIFY_ITEMS, value.value)
      setOrAppendState(StateKeys.JUSTIFY_ITEMS)
    }


  var justifySelf: JustifySelf
    get() {
      return JustifySelf.from(values.get(StyleKeys.JUSTIFY_SELF))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.JUSTIFY_SELF, value.value)
      setOrAppendState(StateKeys.JUSTIFY_SELF)
    }

  var justifyContent: JustifyContent
    get() {
      return JustifyContent.from(values.get(StyleKeys.JUSTIFY_CONTENT))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.JUSTIFY_CONTENT, value.value)
      setOrAppendState(StateKeys.JUSTIFY_CONTENT)
    }


  var align: Align
    get() {
      return Align.from(values.get(StyleKeys.TEXT_ALIGN))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.TEXT_ALIGN, value.value)
      setOrAppendState(StateKeys.ALIGN)
    }

  var textAlign: TextAlign
    get() {
      return TextAlign.from(textValues.get(TextStyleKeys.TEXT_ALIGN))
    }
    set(value) {
      prepareMut()
      textValues.put(TextStyleKeys.TEXT_ALIGN, value.value)
      textValues.put(TextStyleKeys.TEXT_ALIGN_STATE, StyleState.SET)
      setOrAppendState(TextStateKeys.TEXT_ALIGN)
    }

  var boxSizing: BoxSizing
    get() {
      return BoxSizing.from(values.get(StyleKeys.BOX_SIZING))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.BOX_SIZING, value.value)
      setOrAppendState(StateKeys.BOX_SIZING)
    }


  var inset: Rect<LengthPercentageAuto>
    get() {
      return Rect(
        left = LengthPercentageAuto.fromTypeValue(
          values.get(StyleKeys.INSET_LEFT_TYPE), values.getFloat(StyleKeys.INSET_LEFT_VALUE)
        )!!,
        top = LengthPercentageAuto.fromTypeValue(
          values.get(StyleKeys.INSET_TOP_TYPE), values.getFloat(StyleKeys.INSET_TOP_VALUE)
        )!!,
        right = LengthPercentageAuto.fromTypeValue(
          values.get(StyleKeys.INSET_RIGHT_TYPE), values.getFloat(StyleKeys.INSET_RIGHT_VALUE)
        )!!,
        bottom = LengthPercentageAuto.fromTypeValue(
          values.get(StyleKeys.INSET_BOTTOM_TYPE), values.getFloat(StyleKeys.INSET_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.INSET_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value.left.value)

      values.put(StyleKeys.INSET_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value.right.value)

      values.put(StyleKeys.INSET_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value.top.value)

      values.put(StyleKeys.INSET_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value.bottom.value)

      setOrAppendState(StateKeys.INSET)
    }

  fun setInsetLeft(value: Float, type: Byte) {
    val left = LengthPercentageAuto.fromTypeValue(type, value)

    left?.let {
      prepareMut()
      values.put(StyleKeys.INSET_LEFT_TYPE, type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetRight(value: Float, type: Byte) {
    val right = LengthPercentageAuto.fromTypeValue(type, value)

    right?.let {
      prepareMut()
      values.put(StyleKeys.INSET_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetTop(value: Float, type: Byte) {
    val top = LengthPercentageAuto.fromTypeValue(type, value)

    top?.let {
      prepareMut()
      values.put(StyleKeys.INSET_TOP_TYPE, type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetBottom(value: Float, type: Byte) {
    val bottom = LengthPercentageAuto.fromTypeValue(type, value)

    bottom?.let {
      prepareMut()
      values.put(StyleKeys.INSET_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetWithValueType(value: Float, type: Byte) {

    val inset = LengthPercentageAuto.fromTypeValue(type, value)

    inset?.let {
      prepareMut()
      values.put(StyleKeys.INSET_LEFT_TYPE, type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value)

      values.put(StyleKeys.INSET_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value)

      values.put(StyleKeys.INSET_TOP_TYPE, type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value)

      values.put(StyleKeys.INSET_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  var margin: Rect<LengthPercentageAuto>
    get() {
      return Rect(
        left = LengthPercentageAuto.fromTypeValue(
          values.get(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
        )!!,
        top = LengthPercentageAuto.fromTypeValue(
          values.get(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
        )!!,

        right = LengthPercentageAuto.fromTypeValue(
          values.get(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
        )!!,
        bottom = LengthPercentageAuto.fromTypeValue(
          values.get(StyleKeys.MARGIN_BOTTOM_TYPE),
          values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.MARGIN_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value.left.value)

      values.put(StyleKeys.MARGIN_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value.right.value)

      values.put(StyleKeys.MARGIN_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value.top.value)

      values.put(StyleKeys.MARGIN_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value.bottom.value)

      setOrAppendState(StateKeys.MARGIN)
    }

  fun setMargin(left: Float, top: Float, right: Float, bottom: Float) {
    margin = Rect(
      LengthPercentageAuto.Points(
        top
      ),
      LengthPercentageAuto.Points(
        right
      ),
      LengthPercentageAuto.Points(
        bottom
      ),
      LengthPercentageAuto.Points(
        left
      ),
    )
  }

  fun setMargin(left: Int, top: Int, right: Int, bottom: Int) {
    margin = Rect(
      LengthPercentageAuto.Points(
        top.toFloat()
      ),
      LengthPercentageAuto.Points(
        right.toFloat()
      ),
      LengthPercentageAuto.Points(
        bottom.toFloat()
      ),
      LengthPercentageAuto.Points(
        left.toFloat()
      )
    )
  }

  fun setMarginLeft(value: Float, type: Byte) {
    val left = LengthPercentageAuto.fromTypeValue(type, value)

    left?.let {
      prepareMut()
      values.put(StyleKeys.MARGIN_LEFT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginRight(value: Float, type: Byte) {
    val right = LengthPercentageAuto.fromTypeValue(type, value)

    right?.let {
      prepareMut()
      values.put(StyleKeys.MARGIN_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginTop(value: Float, type: Byte) {
    val top = LengthPercentageAuto.fromTypeValue(type, value)

    top?.let {
      prepareMut()
      values.put(StyleKeys.MARGIN_TOP_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginBottom(value: Float, type: Byte) {
    val bottom = LengthPercentageAuto.fromTypeValue(type, value)

    bottom?.let {
      prepareMut()
      values.put(StyleKeys.MARGIN_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginWithValueType(value: Float, type: Byte) {
    val margin = LengthPercentageAuto.fromTypeValue(type, value)

    margin?.let {
      prepareMut()
      values.put(StyleKeys.MARGIN_LEFT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value)

      values.put(StyleKeys.MARGIN_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value)

      values.put(StyleKeys.MARGIN_TOP_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value)

      values.put(StyleKeys.MARGIN_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  var padding: Rect<LengthPercentage>
    get() {
      val left = LengthPercentage.fromTypeValue(
        values.get(StyleKeys.PADDING_LEFT_TYPE), values.getFloat(StyleKeys.PADDING_LEFT_VALUE)
      )!!

      val top = LengthPercentage.fromTypeValue(
        values.get(StyleKeys.PADDING_TOP_TYPE), values.getFloat(StyleKeys.PADDING_TOP_VALUE)
      )!!

      val right = LengthPercentage.fromTypeValue(
        values.get(StyleKeys.PADDING_RIGHT_TYPE),
        values.getFloat(StyleKeys.PADDING_RIGHT_VALUE)
      )!!

      val bottom = LengthPercentage.fromTypeValue(
        values.get(StyleKeys.PADDING_BOTTOM_TYPE),
        values.getFloat(StyleKeys.PADDING_BOTTOM_VALUE)
      )!!

      return Rect(
        top, right, bottom, left
      )
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.PADDING_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value.top.value)

      values.put(StyleKeys.PADDING_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value.right.value)

      values.put(StyleKeys.PADDING_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value.bottom.value)

      values.put(StyleKeys.PADDING_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value.left.value)

      setOrAppendState(StateKeys.PADDING)
    }

  fun setPadding(left: Float, top: Float, right: Float, bottom: Float) {
    padding = Rect(
      LengthPercentage.Points(
        top
      ),
      LengthPercentage.Points(
        right
      ),
      LengthPercentage.Points(
        bottom
      ),
      LengthPercentage.Points(
        left
      )
    )
  }

  fun setPadding(left: Int, top: Int, right: Int, bottom: Int) {
    padding = Rect(
      LengthPercentage.Points(
        top.toFloat()
      ),
      LengthPercentage.Points(
        right.toFloat()
      ),
      LengthPercentage.Points(
        bottom.toFloat()
      ),
      LengthPercentage.Points(
        left.toFloat()
      )
    )
  }

  fun setPaddingLeft(value: Float, type: Byte) {
    val left = LengthPercentage.fromTypeValue(type, value)

    left?.let {
      prepareMut()
      values.put(StyleKeys.PADDING_LEFT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingRight(value: Float, type: Byte) {
    val right = LengthPercentage.fromTypeValue(type, value)

    right?.let {
      prepareMut()
      values.put(StyleKeys.PADDING_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingTop(value: Float, type: Byte) {
    val top = LengthPercentage.fromTypeValue(type, value)

    top?.let {
      prepareMut()
      values.put(StyleKeys.PADDING_TOP_TYPE, type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingBottom(value: Float, type: Byte) {
    val bottom = LengthPercentage.fromTypeValue(type, value)

    bottom?.let {
      prepareMut()
      values.put(StyleKeys.PADDING_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingWithValueType(value: Float, type: Byte) {
    val padding = LengthPercentage.fromTypeValue(type, value)

    padding?.let {
      prepareMut()
      values.put(StyleKeys.PADDING_LEFT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value)

      values.put(StyleKeys.PADDING_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value)

      values.put(StyleKeys.PADDING_TOP_TYPE, type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value)

      values.put(StyleKeys.PADDING_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

//  var boxShadow: String
//    set(value) {
//      field = value
//    }

  internal var textShadows: List<Shadow.TextShadow> = listOf()
  var textShadow: String = ""
    set(value) {
      field = value
      textShadows = Shadow.parseTextShadow(this, value)
      if (textShadows.isEmpty()) {
        textValues.put(TextStyleKeys.TEXT_SHADOW_STATE, StyleState.INHERIT)
      } else {
        textValues.put(TextStyleKeys.TEXT_SHADOW_STATE, StyleState.SET)
      }
      notifyTextStyleChanged(TextStyleChangeMask.TEXT_SHADOW)
    }

  internal var mBorder: String = ""
  internal val mBorderRenderer by lazy {
    BorderRenderer(this)
  }
  internal val mBorderLeft by lazy {
    Border(this, Border.Side.Left)
  }

  internal val mBorderTop by lazy {
    Border(this, Border.Side.Top)
  }

  internal val mBorderRight by lazy {
    Border(this, Border.Side.Right)
  }

  internal val mBorderBottom by lazy {
    Border(this, Border.Side.Bottom)
  }


  var border: String
    get() {
      return mBorder
    }
    set(value) {
      parseBorderShorthand(this, value)
    }

  var borderRadius: String = ""
    set(value) {
      field = value
      parseBorderRadius(this, value)
    }

  internal fun getRadiusPoint(keys: IKeyCorner): Point<LengthPercentage> {
    val x = LengthPercentage.fromTypeValue(
      values.get(keys.xType), values.getFloat(keys.xValue)
    )!!
    val y = LengthPercentage.fromTypeValue(
      values.get(keys.yType), values.getFloat(keys.yValue)
    )!!
    return Point(x, y)
  }

  internal fun setRadiusPoint(keys: IKeyCorner, value: Point<LengthPercentage>) {
    prepareMut()
    values.put(keys.xType, value.x.type)
    values.putFloat(keys.xValue, value.x.value)
    values.put(keys.yType, value.y.type)
    values.putFloat(keys.yValue, value.y.value)
    setOrAppendState(StateKeys.BORDER_RADIUS)
  }

  fun setBorderStyle(value: BorderStyle) {
    mBorderLeft.apply {
      setState = false
      style = value
      setState = true
    }

    mBorderTop.apply {
      setState = false
      style = value
      setState = true
    }

    mBorderRight.apply {
      setState = false
      style = value
      setState = true
    }

    mBorderBottom.apply {
      setState = false
      style = value
      setState = true
    }

    setOrAppendState(StateKeys.BORDER_STYLE)
  }

  var borderStyle: Rect<BorderStyle>
    get() {
      return Rect(
        mBorderTop.style,
        mBorderRight.style,
        mBorderBottom.style,
        mBorderLeft.style
      )
    }
    set(value) {
      mBorderLeft.apply {
        setState = false
        style = value.left
        setState = true
      }

      mBorderTop.apply {
        setState = false
        style = value.top
        setState = true
      }

      mBorderRight.apply {
        setState = false
        style = value.right
        setState = true
      }

      mBorderBottom.apply {
        setState = false
        style = value.bottom
        setState = true
      }

      setOrAppendState(StateKeys.BORDER_STYLE)
    }


  var borderLeftStyle: BorderStyle
    get() {
      return mBorderLeft.style
    }
    set(value) {
      mBorderLeft.style = value
    }


  var borderTopStyle: BorderStyle
    get() {
      return mBorderTop.style
    }
    set(value) {
      mBorderTop.style = value
    }


  var borderRightStyle: BorderStyle
    get() {
      return mBorderRight.style
    }
    set(value) {
      mBorderRight.style = value
    }

  var borderBottomStyle: BorderStyle
    get() {
      return mBorderBottom.style
    }
    set(value) {
      mBorderBottom.style = value
    }


  var borderTopLeftRadius: Point<LengthPercentage>
    get() = getRadiusPoint(Border.cornerTopLeftKeys)
    set(value) = setRadiusPoint(Border.cornerTopLeftKeys, value)

  var borderTopRightRadius: Point<LengthPercentage>
    get() = getRadiusPoint(Border.cornerTopRightKeys)
    set(value) = setRadiusPoint(Border.cornerTopRightKeys, value)

  var borderBottomRightRadius: Point<LengthPercentage>
    get() = getRadiusPoint(Border.cornerBottomRightKeys)
    set(value) = setRadiusPoint(Border.cornerBottomRightKeys, value)

  var borderBottomLeftRadius: Point<LengthPercentage>
    get() = getRadiusPoint(Border.cornerBottomLeftKeys)
    set(value) = setRadiusPoint(Border.cornerBottomLeftKeys, value)


  var borderColor: Rect<Int>
    get() {
      return Rect(
        left = mBorderLeft.color,
        right = mBorderRight.color,
        top = mBorderTop.color,
        bottom = mBorderBottom.color
      )
    }
    set(value) {
      mBorderLeft.apply {
        setState = false
        color = value.left
        setState = true
      }

      mBorderTop.apply {
        setState = false
        color = value.top
        setState = true
      }

      mBorderRight.apply {
        setState = false
        color = value.right
        setState = true
      }

      mBorderBottom.apply {
        setState = false
        color = value.bottom
        setState = true
      }

      setOrAppendState(StateKeys.BORDER_COLOR)
    }

  fun setBorderColor(value: Int) {
    mBorderLeft.apply {
      setState = false
      color = value
      setState = true
    }

    mBorderTop.apply {
      setState = false
      color = value
      setState = true
    }

    mBorderRight.apply {
      setState = false
      color = value
      setState = true
    }

    mBorderBottom.apply {
      setState = false
      color = value
      setState = true
    }
    setOrAppendState(StateKeys.BORDER_COLOR)
  }

  var borderWidth: Rect<LengthPercentage>
    get() {
      return Rect(
        right = mBorderRight.width,
        top = mBorderTop.width,
        bottom = mBorderBottom.width,
        left = mBorderLeft.width,
      )
    }
    set(value) {
      mBorderLeft.apply {
        setState = false
        width = value.left
        setState = true
      }

      mBorderTop.apply {
        setState = false
        width = value.top
        setState = true
      }

      mBorderRight.apply {
        setState = false
        width = value.right
        setState = true
      }

      mBorderBottom.apply {
        setState = false
        width = value.bottom
        setState = true
      }
      setOrAppendState(StateKeys.BORDER)
    }

  var borderLeftWidth: LengthPercentage
    get() {
      return mBorderLeft.width
    }
    set(value) {
      mBorderLeft.width = value
    }

  var borderTopWidth: LengthPercentage
    get() {
      return mBorderTop.width
    }
    set(value) {
      mBorderTop.width = value
    }

  var borderRightWidth: LengthPercentage
    get() {
      return mBorderRight.width
    }
    set(value) {
      mBorderRight.width = value
    }

  var borderBottomWidth: LengthPercentage
    get() {
      return mBorderBottom.width
    }
    set(value) {
      mBorderBottom.width = value
    }

  fun setBorderLeftWidth(value: Float, type: Byte) {
    val left = LengthPercentage.fromTypeValue(type, value)
    left?.let {
      mBorderLeft.width = it
    }
  }

  fun setBorderRightWidth(value: Float, type: Byte) {
    val right = LengthPercentage.fromTypeValue(type, value)

    right?.let {
      mBorderRight.width = it
    }
  }

  fun setBorderTopWidth(value: Float, type: Byte) {
    val top = LengthPercentage.fromTypeValue(type, value)

    top?.let {
      mBorderTop.width = it
    }
  }

  fun setBorderBottomWidth(value: Float, type: Byte) {
    val bottom = LengthPercentage.fromTypeValue(type, value)

    bottom?.let {
      mBorderBottom.width = it
    }
  }

  fun setBorderWidth(value: Float, type: Byte) {
    val border = LengthPercentage.fromTypeValue(type, value)

    border?.let {
      mBorderLeft.apply {
        setState = false
        width = it
        setState = true
      }

      mBorderTop.apply {
        setState = false
        width = it
        setState = true
      }

      mBorderRight.apply {
        setState = false
        width = it
        setState = true
      }

      mBorderBottom.apply {
        setState = false
        width = it
        setState = true
      }
    }
  }

  var flexGrow: Float
    get() {
      return values.getFloat(StyleKeys.FLEX_GROW)
    }
    set(value) {
      prepareMut()
      values.putFloat(StyleKeys.FLEX_GROW, value)
      setOrAppendState(StateKeys.FLEX_GROW)
    }

  var flexShrink: Float
    get() {
      return values.getFloat(StyleKeys.FLEX_SHRINK)
    }
    set(value) {
      prepareMut()
      values.putFloat(StyleKeys.FLEX_SHRINK, value)
      setOrAppendState(StateKeys.FLEX_SHRINK)
    }

  var flexBasis: Dimension
    get() {
      val type = values.get(StyleKeys.FLEX_BASIS_TYPE)
      val value = values.getFloat(StyleKeys.FLEX_BASIS_VALUE)
      // always valid
      return Dimension.fromTypeValue(type, value)!!
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.FLEX_BASIS_TYPE, value.type)
      values.putFloat(StyleKeys.FLEX_BASIS_VALUE, value.value)
      setOrAppendState(StateKeys.FLEX_BASIS)
    }


  var scrollBarWidth: Float
    get() {
      return values.getFloat(StyleKeys.SCROLLBAR_WIDTH)
    }
    set(value) {
      prepareMut()
      values.putFloat(StyleKeys.SCROLLBAR_WIDTH, value)
      setOrAppendState(StateKeys.SCROLLBAR_WIDTH)
    }


  fun setFlexBasis(value: Float, type: Byte) {
    Dimension.fromTypeValue(type, value)?.let {
      prepareMut()
      values.put(StyleKeys.FLEX_BASIS_TYPE, type)
      values.putFloat(StyleKeys.FLEX_BASIS_VALUE, value)
      setOrAppendState(StateKeys.FLEX_BASIS)
    }
  }

  var minSize: Size<Dimension>
    get() {
      val widthType = values.get(StyleKeys.MIN_WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.MIN_WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.get(StyleKeys.MIN_HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.MIN_HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.MIN_WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value.width.value)
      values.put(StyleKeys.MIN_HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }

  fun setMinSizeWidth(value: Float, type: Byte) {
    val width = Dimension.fromTypeValue(type, value)
    width?.let {
      prepareMut()
      values.put(StyleKeys.MIN_WIDTH_TYPE, type)
      values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }
  }

  fun setMinSizeHeight(value: Float, type: Byte) {
    val height = Dimension.fromTypeValue(type, value)
    height?.let {
      prepareMut()
      values.put(StyleKeys.MIN_HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }
  }


  fun setMinSizeWidth(value: Dimension) {
    prepareMut()
    values.put(StyleKeys.MIN_WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  fun setMinSizeHeight(value: Dimension) {
    prepareMut()
    values.put(StyleKeys.MIN_HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  internal val isSizeAuto: Boolean
    get() {
      return values.get(StyleKeys.WIDTH_TYPE) == Constants.ZERO
        && values.get(StyleKeys.HEIGHT_TYPE) == Constants.ZERO
    }

  internal fun setSize(width: Int, height: Int) {
    prepareMut()
    values.put(StyleKeys.WIDTH_TYPE, 1)
    values.putFloat(StyleKeys.WIDTH_VALUE, width.toFloat())

    values.put(StyleKeys.HEIGHT_TYPE, 1)
    values.putFloat(StyleKeys.HEIGHT_VALUE, height.toFloat())
    setOrAppendState(StateKeys.SIZE)
  }

  var size: Size<Dimension>
    get() {
      val widthType = values.get(StyleKeys.WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.get(StyleKeys.HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.WIDTH_VALUE, value.width.value)

      values.put(StyleKeys.HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.SIZE)
    }


  fun setSizeWidth(value: Float, type: Byte) {
    val width = Dimension.fromTypeValue(type, value)

    width?.let {
      prepareMut()
      values.put(StyleKeys.WIDTH_TYPE, type)
      values.putFloat(StyleKeys.WIDTH_VALUE, value)
      setOrAppendState(StateKeys.SIZE)
    }
  }

  fun setSizeWidth(value: Dimension) {
    prepareMut()
    values.put(StyleKeys.WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.SIZE)
  }

  fun setSizeHeight(value: Float, type: Byte) {
    val height = Dimension.fromTypeValue(type, value)

    height?.let {
      prepareMut()
      values.put(StyleKeys.HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.SIZE)
    }
  }

  fun setSizeHeight(value: Dimension) {
    prepareMut()
    values.put(StyleKeys.HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.SIZE)
  }

  var maxSize: Size<Dimension>
    get() {
      val widthType = values.get(StyleKeys.MAX_WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.MAX_WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.get(StyleKeys.MAX_HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.MAX_HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.MAX_WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value.width.value)
      values.put(StyleKeys.MAX_HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }

  fun setMaxSizeWidth(value: Float, type: Byte) {
    val width = Dimension.fromTypeValue(type, value)

    width?.let {
      prepareMut()
      values.put(StyleKeys.MAX_WIDTH_TYPE, type)
      values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }
  }

  fun setMaxSizeHeight(value: Float, type: Byte) {
    val height = Dimension.fromTypeValue(type, value)

    height?.let {
      prepareMut()
      values.put(StyleKeys.MAX_HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }
  }


  fun setMaxSizeWidth(value: Dimension) {
    prepareMut()
    values.put(StyleKeys.MAX_WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  fun setMaxSizeHeight(value: Dimension) {
    prepareMut()
    values.put(StyleKeys.MAX_HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  var gap: Size<LengthPercentage>
    get() {
      val widthType = values.get(StyleKeys.GAP_ROW_TYPE)
      val widthValue = values.getFloat(StyleKeys.GAP_ROW_VALUE)
      val width = LengthPercentage.fromTypeValue(widthType, widthValue)

      val heightType = values.get(StyleKeys.GAP_COLUMN_TYPE)
      val heightValue = values.getFloat(StyleKeys.GAP_COLUMN_VALUE)
      val height = LengthPercentage.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.GAP_ROW_TYPE, value.width.type)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, value.width.value)
      values.put(StyleKeys.GAP_COLUMN_TYPE, value.height.type)
      values.putFloat(StyleKeys.GAP_COLUMN_VALUE, value.height.value)
      setOrAppendState(StateKeys.GAP)
    }

  fun setGap(widthValue: Float, widthType: Byte, heightValue: Float, heightType: Byte) {
    val width = LengthPercentage.fromTypeValue(widthType, widthValue)

    val height = LengthPercentage.fromTypeValue(heightType, heightValue)

    if (width != null && height != null) {
      prepareMut()
      values.put(StyleKeys.GAP_ROW_TYPE, widthType)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, widthValue)
      values.put(StyleKeys.GAP_COLUMN_TYPE, heightType)
      values.putFloat(StyleKeys.GAP_COLUMN_VALUE, heightValue)
      setOrAppendState(StateKeys.GAP)
    }
  }


  fun setGapRow(value: Float, type: Byte) {
    val width = LengthPercentage.fromTypeValue(type, value)

    width?.let {
      prepareMut()
      values.put(StyleKeys.GAP_ROW_TYPE, type)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, value)
      setOrAppendState(StateKeys.GAP)
    }
  }

  fun setGapColumn(value: Float, type: Byte) {
    val height = LengthPercentage.fromTypeValue(type, value)

    height?.let {
      prepareMut()
      values.put(StyleKeys.GAP_COLUMN_TYPE, type)
      values.putFloat(StyleKeys.GAP_COLUMN_VALUE, value)
      setOrAppendState(StateKeys.GAP)
    }
  }

  var aspectRatio: Float?
    get() {
      val value = values.getFloat(StyleKeys.ASPECT_RATIO)
      return if (value.isNaN()) {
        null
      } else {
        value
      }
    }
    set(value) {
      prepareMut()
      values.putFloat(StyleKeys.ASPECT_RATIO, value ?: Float.NaN)
      setOrAppendState(StateKeys.ASPECT_RATIO)
    }


  /* legacy helpers */
  fun setGridAutoRows(value: Array<MinMax>) {
    gridAutoRows = value.cssValue
  }

  fun setGridAutoColumns(value: Array<MinMax>) {
    gridAutoColumns = value.cssValue
  }

  fun setGridColumn(value: Line<GridPlacement>) {
    gridColumn = value.cssValue
  }

  fun setGridColumnStart(value: GridPlacement) {
    gridColumnStart = value.cssValue
  }

  fun setGridRow(value: Line<GridPlacement>) {
    gridRow = value.cssValue
  }

  fun setGridTemplateRows(value: Array<GridTemplate>) {
    gridTemplateRows = value.cssValue
  }

  fun setGridTemplateColumns(value: Array<GridTemplate>) {
    gridTemplateColumns = value.cssValue
  }

  /* legacy helpers */

  private fun <T> lazyCache(getCache: () -> T?, setCache: (T?) -> Unit, fetch: () -> T): T? {
    val cached = getCache()
    return cached ?: fetch().also { setCache(it) }
  }

  private var _gridArea: String? = null
  var gridArea: String
    get() {
      return lazyCache({ _gridArea }, { _gridArea = it }) {
        nativeGetGridArea(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridArea = value
      _gridArea = null
      _gridColumnStart = null
      _gridColumnEnd = null
      _gridRowStart = null
      _gridRowEnd = null
      isSlowDirty = true
    }

  private var _gridTemplateAreas: String? = null
  var gridTemplateAreas: String
    get() {
      return lazyCache({ _gridTemplateAreas }, { _gridTemplateAreas = it }) {
        nativeGetGridTemplateAreas(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridTemplateAreas = value
      _gridTemplateAreas = null
      isSlowDirty = true
    }

  private var _gridAutoRows: String? = null
  var gridAutoRows: String
    get() {
      return lazyCache({ _gridAutoRows }, { _gridAutoRows = it }) {
        nativeGetGridAutoRows(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridAutoRows = value
      _gridAutoRows = null
      isSlowDirty = true
    }

  private var _gridAutoColumns: String? = null
  var gridAutoColumns: String
    get() {
      return lazyCache({ _gridAutoColumns }, { _gridAutoColumns = it }) {
        nativeGetGridAutoColumns(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridAutoColumns = value
      _gridAutoColumns = null
      isSlowDirty = true
    }

  var gridAutoFlow: GridAutoFlow
    get() {
      return GridAutoFlow.from(values.get(StyleKeys.GRID_AUTO_FLOW))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.GRID_AUTO_FLOW, value.value)
      setOrAppendState(StateKeys.GRID_AUTO_FLOW)
    }

  private var _gridColumn: String? = null
  var gridColumn: String
    get() {
      return lazyCache({ _gridColumn }, { _gridColumn = it }) {
        nativeGetGridColumn(node.mason.nativePtr, node.nativePtr) ?: ""
      } ?: ""
    }
    set(value) {
      gridState.gridColumn = value
      _gridColumn = null
      isSlowDirty = true
    }

  private var _gridColumnStart: String? = null
  var gridColumnStart: String
    get() {
      return lazyCache({
        _gridColumnStart
      }, {
        _gridColumnStart = it
      }) {
        nativeGetGridColumnStart(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridColumnStart = value
      _gridColumnStart = null
      _gridColumn = null
      isSlowDirty = true
    }

  private var _gridColumnEnd: String? = null
  var gridColumnEnd: String
    get() {
      return lazyCache({
        _gridColumnEnd
      }, {
        _gridColumnEnd = it
      }) {
        nativeGetGridColumnEnd(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridColumnEnd = value
      _gridColumnEnd = null
      _gridColumn = null
      isSlowDirty = true
    }

  private var _gridRow: String? = null
  var gridRow: String
    get() {
      return lazyCache({ _gridRow }, { _gridRow = it }) {
        nativeGetGridRow(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridRow = value
      _gridRow = null
      isSlowDirty = true
    }

  private var _gridRowStart: String? = null
  var gridRowStart: String
    get() {
      return lazyCache({
        _gridRowStart
      }, {
        _gridRowStart = it
      }) {
        nativeGetGridRowStart(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridRowStart = value
      _gridRowStart = null
      _gridRow = null
      isSlowDirty = true
    }

  private var _gridRowEnd: String? = null
  var gridRowEnd: String
    get() {
      return lazyCache({
        _gridRowEnd
      }, {
        _gridRowEnd = it
      }) {
        nativeGetGridRowEnd(node.mason.nativePtr, node.nativePtr)
      } ?: ""
    }
    set(value) {
      gridState.gridRowEnd = value
      _gridRowEnd = null
      _gridRow = null
      isSlowDirty = true
    }


  private var _gridTemplateRows: String? = null
  var gridTemplateRows: String
    get() {
      return lazyCache({ _gridTemplateRows }, { _gridTemplateRows = it }) {
        nativeGetGridTemplateRows(
          node.mason.nativePtr, node.nativePtr
        )
      } ?: ""
    }
    set(value) {
      gridState.gridTemplateRows = value
      _gridTemplateRows = null
      isSlowDirty = true
    }

  private var _gridTemplateColumns: String? = null
  var gridTemplateColumns: String
    get() {
      return lazyCache({ _gridTemplateColumns }, { _gridTemplateColumns = it }) {
        nativeGetGridTemplateColumns(
          node.mason.nativePtr, node.nativePtr
        )
      } ?: ""
    }
    set(value) {
      gridState.gridTemplateColumns = value
      _gridTemplateColumns = null
      isSlowDirty = true
    }

  internal fun updateNativeStyle() {
    if (node.nativePtr == 0L) {
      return
    }

    val borderState = isDirty and StateKeys.BORDER.bits
    val borderRadius = isDirty and StateKeys.BORDER_RADIUS.bits
    val borderStyle = isDirty and StateKeys.BORDER_STYLE.bits
    val borderColor = isDirty and StateKeys.BORDER_COLOR.bits
    val zIndex = isDirty and StateKeys.Z_INDEX.bits

    if (borderState != 0L || borderRadius != 0L || borderStyle != 0L || borderColor != 0L) {
      mBorderRenderer.invalidate()
    }

    if (isSlowDirty) {
      if (isDirty == -1L) {
        nativeNonBufferData(
          node.mason.nativePtr,
          node.nativePtr,
          gridState.gridAutoRows,
          gridState.gridAutoColumns,
          gridState.gridColumn,
          gridState.gridColumnStart,
          gridState.gridColumnEnd,
          gridState.gridRow,
          gridState.gridRowStart,
          gridState.gridRowEnd,
          gridState.gridTemplateRows,
          gridState.gridTemplateColumns,
          gridState.gridArea,
          gridState.gridTemplateAreas
        )
        resetState()
        (node.view as? Element)?.invalidateLayout()
        return
      }

      nativeUpdateWithValues(
        node.mason.nativePtr,
        node.nativePtr,
        display.value,
        position.value,
        direction.value,
        flexDirection.value,
        flexWrap.value,
        0,
        alignItems.value,
        alignSelf.value,
        alignContent.value,
        justifyItems.value,
        justifySelf.value,
        justifyContent.value,

        inset.left.type,
        inset.left.value,
        inset.right.type,
        inset.right.value,
        inset.top.type,
        inset.top.value,
        inset.bottom.type,
        inset.bottom.value,

        margin.left.type,
        margin.left.value,
        margin.right.type,
        margin.right.value,
        margin.top.type,
        margin.top.value,
        margin.bottom.type,
        margin.bottom.value,


        padding.left.type,
        padding.left.value,
        padding.right.type,
        padding.right.value,
        padding.top.type,
        padding.top.value,
        padding.bottom.type,
        padding.bottom.value,


        mBorderLeft.width.type,
        mBorderLeft.width.value,
        mBorderRight.width.type,
        mBorderRight.width.value,
        mBorderTop.width.type,
        mBorderTop.width.value,
        mBorderBottom.width.type,
        mBorderBottom.width.value,
        flexGrow,
        flexShrink,
        flexBasis.type,
        flexBasis.value,

        size.width.type,
        size.width.value,
        size.height.type,
        size.height.value,


        minSize.width.type,
        minSize.width.value,
        minSize.height.type,
        minSize.height.value,

        maxSize.width.type,
        maxSize.width.value,
        maxSize.height.type,
        maxSize.height.value,

        gap.width.type,
        gap.width.value,
        gap.height.type,
        gap.height.value,
        aspectRatio ?: Float.NaN,
        gridState.gridAutoRows,
        gridState.gridAutoColumns,
        gridAutoFlow.value,
        gridState.gridColumn,
        gridState.gridColumnStart,
        gridState.gridColumnEnd,
        gridState.gridRow,
        gridState.gridRowStart,
        gridState.gridRowEnd,
        gridState.gridTemplateRows,
        gridState.gridTemplateColumns,
        overflowX.value,
        overflowY.value,
        scrollBarWidth,
        textAlign.value,
        boxSizing.value,
        gridState.gridArea,
        gridState.gridTemplateAreas
      )

      if (zIndex != 0L) {
        (node.view as? org.nativescript.mason.masonkit.View)?.onChildZIndexChanged()
      }

      resetState()
      (node.view as? Element)?.invalidateLayout()
      return
    }

    if (isDirty != -1L) {

      if (zIndex != 0L) {
        (node.view as? org.nativescript.mason.masonkit.View)?.onChildZIndexChanged()
      }

      resetState()
      (node.view as? Element)?.invalidateLayout()
      return
    }
  }

  fun getNativeMargins(): Rect<LengthPercentageAuto> {

    var marginLeft: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginRight: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginTop: LengthPercentageAuto = LengthPercentageAuto.Auto
    var marginBottom: LengthPercentageAuto = LengthPercentageAuto.Auto

    LengthPercentageAuto.fromTypeValue(
      values.get(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
    )?.let {
      marginLeft = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.get(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
    )?.let {
      marginRight = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.get(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
    )?.let {
      marginTop = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.get(StyleKeys.MARGIN_BOTTOM_TYPE), values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
    )?.let {
      marginBottom = it
    }

    return Rect(marginTop, marginRight, marginBottom, marginLeft)
  }

  fun getNativeSize(): Size<Dimension> {
    val width = Dimension.fromTypeValue(
      values.get(StyleKeys.WIDTH_TYPE), values.getFloat(StyleKeys.WIDTH_VALUE)
    )
    val height = Dimension.fromTypeValue(
      values.get(StyleKeys.HEIGHT_TYPE), values.getFloat(StyleKeys.HEIGHT_VALUE)
    )
    return Size(width as Dimension, height as Dimension)
  }

  var listStylePosition: ListStylePosition
    get() {
      return ListStylePosition.from(values.get(StyleKeys.LIST_STYLE_POSITION))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.LIST_STYLE_POSITION, value.value.toByte())
      values.put(StyleKeys.LIST_STYLE_POSITION_STATE, StyleState.SET)
      setOrAppendState(StateKeys.LIST_STYLE_POSITION)
    }


  var listStyleType: ListStyleType
    get() {
      return ListStyleType.from(values.get(StyleKeys.LIST_STYLE_TYPE))
    }
    set(value) {
      prepareMut()
      values.put(StyleKeys.LIST_STYLE_TYPE, value.value.toByte())
      values.put(StyleKeys.LIST_STYLE_TYPE_STATE, StyleState.SET)
      setOrAppendState(StateKeys.LIST_STYLE_TYPE)
    }

  override fun toString(): String {
    var ret = "(MasonStyle)("
    ret += "display: ${display.cssValue}, \n"
    ret += "position: ${position.cssValue}, \n"
    ret += "inset: ${inset.cssValue}, \n"
    ret += "flexDirection: ${flexDirection.cssValue}, \n"
    ret += "flexWrap: ${flexWrap.cssValue}, \n"
    ret += "overflow: ${overflow.cssValue}, \n"
    ret += "alignItems: ${alignItems.cssValue}, \n"
    ret += "alignSelf: ${alignSelf.cssValue}, \n"
    ret += "alignContent: ${alignContent.cssValue}, \n"
    ret += "justifyItems: ${justifyItems.cssValue}, \n"
    ret += "justifySelf: ${justifySelf.cssValue}, \n"
    ret += "justifyContent: ${justifyContent.cssValue}, \n"
    ret += "margin: ${margin.cssValue}, \n"
    ret += "padding: ${padding.cssValue}, \n"
    ret += "border: ${borderWidth.cssValue}, \n"
    ret += "gap: ${gap.cssValue}, \n"
    ret += "flexGrow: ${flexGrow}, \n"
    ret += "flexShrink: ${flexShrink}, \n"
    ret += "flexBasis: ${flexBasis.cssValue}, \n"
    ret += "size: ${size.cssValue}, \n"
    ret += "minSize: ${minSize.cssValue}, \n"
    ret += "maxSize: ${maxSize.cssValue}, \n"
    ret += "aspectRatio: ${
      if (aspectRatio == null) {
        "undefined"
      } else {
        aspectRatio
      }
    }, \n"
    ret += "gridAutoRows: $gridAutoRows, \n"
    ret += "gridAutoColumns: $gridAutoColumns, \n"
    ret += "gridColumn: $gridColumn, \n"
    ret += "gridRow: $gridRow, \n"
    ret += "gridTemplateRows: $gridTemplateRows, \n"
    ret += "gridTemplateColumns: $gridTemplateColumns \n"

    ret += "overflowX: ${overflowX.cssValue} \n"
    ret += "overflowY: ${overflowY.cssValue} \n"
    ret += "scrollBarWidth: $scrollBarWidth \n"
    ret += "textAlign: ${textAlign.cssValue} \n"
    ret += "boxSizing: ${boxSizing.cssValue} \n"
    ret += ")"

    return ret
  }


  /* Resolved Styles */

  private val parentStyleWithValues: Style?
    get() {
      var parent = node.parent
      while (parent != null) {
        // Check if parent has text values initialized
        if (parent.style.isValueInitialized) {
          return parent.style
        }
        parent = parent.parent
      }
      return null
    }

  // Helper to find parent style with text values initialized
  private val parentStyleWithTextValues: Style?
    get() {
      var parent = node.parent
      while (parent != null) {
        // Check if parent has text values initialized
        if (parent.style.isTextValueInitialized) {
          return parent.style
        }
        parent = parent.parent
      }
      return null
    }

  // Store the resolved FontFace - cached and invalidated when font properties change
  internal val resolvedFontFace: FontFace
    get() {
      if (!_resolvedFontFaceDirty && _cachedResolvedFontFace != null) {
        return _cachedResolvedFontFace!!
      }

      val familyState = textValues.get(TextStyleKeys.FONT_FAMILY_STATE)
      val weightState = textValues.get(TextStyleKeys.FONT_WEIGHT_STATE)
      val styleState = textValues.get(TextStyleKeys.FONT_STYLE_STATE)

      // If all font properties are inherited, use parent's font face
      if (familyState == StyleState.INHERIT && weightState == StyleState.INHERIT && styleState == StyleState.INHERIT) {
        val result = parentStyleWithTextValues?.resolvedFontFace ?: font
        _cachedResolvedFontFace = result
        _resolvedFontFaceDirty = false
        return result
      }

      // If family is inherited but weight/style are set, need to create a new FontFace
      val baseFamily = if (familyState == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontFace?.fontFamily ?: font.fontFamily
      } else {
        font.fontFamily
      }

      val resolvedWeight = if (weightState == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontWeight
          ?: FontFace.NSCFontWeight.from(textValues.getInt(TextStyleKeys.FONT_WEIGHT))
      } else {
        FontFace.NSCFontWeight.from(textValues.getInt(TextStyleKeys.FONT_WEIGHT))
      }

      val resolvedStyle = if (styleState == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontStyle ?: fontStyle
      } else {
        fontStyle
      }

      // If everything matches current font, return it
      if (font.fontFamily == baseFamily && font.weight == resolvedWeight && font.style == resolvedStyle) {
        _cachedResolvedFontFace = font
        _resolvedFontFaceDirty = false
        return font
      }

      // Create a new FontFace with resolved properties
      val resolvedFont = FontFace(baseFamily).apply {
        weight = resolvedWeight
        style = resolvedStyle
        owner = this@Style
      }

      // Eagerly load so resolvedFont.font is non-null (cheap with Typeface cache)
      if (resolvedFont.font == null) {
        (node.view as? View)?.let { view ->
          resolvedFont.loadSync(view.context) {}
        }
      }

      _cachedResolvedFontFace = resolvedFont
      _resolvedFontFaceDirty = false
      return resolvedFont
    }

  // Resolved properties that handle inheritance
  internal val resolvedColor: Int
    get() {
      val state = textValues.get(TextStyleKeys.COLOR_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedColor ?: textValues.getInt(TextStyleKeys.COLOR)
      } else {
        textValues.getInt(TextStyleKeys.COLOR)
      }
    }

  internal val resolvedFontSize: Int
    get() {
      val state = textValues.get(TextStyleKeys.SIZE_STATE)
      val type = textValues.get(TextStyleKeys.SIZE_TYPE)
      // PERCENT == 1
      if (type == StyleState.SET) {
        val parentFontSize =
          node.parent?.takeIf { it.style.isTextValueInitialized }?.style?.resolvedFontSize
            ?: Constants.DEFAULT_FONT_SIZE
        return resolvePercentageFontSize(parentFontSize, textValues.getInt(TextStyleKeys.SIZE))
      }
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontSize ?: textValues.getInt(TextStyleKeys.SIZE)
      } else {
        textValues.getInt(TextStyleKeys.SIZE)
      }
    }

  internal fun resolvePercentageFontSize(parentFontSize: Int, percent: Int): Int {
    val rawSize = textValues.getInt(TextStyleKeys.SIZE)
    val percent = rawSize.toFloat() / 100f
    return ceil((parentFontSize * percent).coerceAtLeast(0f)).toInt()
  }

  internal val resolvedFontWeight: FontFace.NSCFontWeight
    get() {
      val state = textValues.get(TextStyleKeys.FONT_WEIGHT_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontWeight
          ?: FontFace.NSCFontWeight.from(textValues.getInt(TextStyleKeys.FONT_WEIGHT))
      } else {
        FontFace.NSCFontWeight.from(textValues.getInt(TextStyleKeys.FONT_WEIGHT))
      }
    }

  internal val resolvedFontStyle: FontFace.NSCFontStyle
    get() {
      val state = textValues.get(TextStyleKeys.FONT_STYLE_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedFontStyle ?: fontStyle
      } else {
        fontStyle
      }
    }

  internal val resolvedBackgroundColor: Int
    get() {
      val state = textValues.get(TextStyleKeys.BACKGROUND_COLOR_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedBackgroundColor
          ?: textValues.getInt(TextStyleKeys.BACKGROUND_COLOR)
      } else {
        textValues.getInt(TextStyleKeys.BACKGROUND_COLOR)
      }
    }

  internal val resolvedDecorationLine: Styles.DecorationLine
    get() {
      val state = textValues.get(TextStyleKeys.DECORATION_LINE_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedDecorationLine ?: Styles.DecorationLine.from(
          textValues.get(TextStyleKeys.DECORATION_LINE)
        )
      } else {
        Styles.DecorationLine.from(textValues.get(TextStyleKeys.DECORATION_LINE))
      }
    }

  internal val resolvedDecorationColor: Int
    get() {
      val state = textValues.get(TextStyleKeys.DECORATION_COLOR_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedDecorationColor
          ?: textValues.getInt(TextStyleKeys.DECORATION_COLOR)
      } else {
        textValues.getInt(TextStyleKeys.DECORATION_COLOR)
      }
    }

  internal val resolvedDecorationStyle: Styles.DecorationStyle
    get() {
      val state = textValues.get(TextStyleKeys.DECORATION_STYLE_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedDecorationStyle ?: Styles.DecorationStyle.from(
          textValues.get(TextStyleKeys.DECORATION_STYLE)
        )
      } else {
        Styles.DecorationStyle.from(textValues.get(TextStyleKeys.DECORATION_STYLE))
      }
    }


  internal val resolvedDecorationThickness: Float
    get() {
      val state = textValues.get(TextStyleKeys.DECORATION_THICKNESS)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedDecorationThickness
          ?: textValues.getFloat(TextStyleKeys.DECORATION_THICKNESS)
      } else {
        textValues.getFloat(TextStyleKeys.DECORATION_THICKNESS)
      }
    }


  internal val resolvedLetterSpacing: Float
    get() {
      val state = textValues.get(TextStyleKeys.LETTER_SPACING_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedLetterSpacing
          ?: textValues.getFloat(TextStyleKeys.LETTER_SPACING)
      } else {
        textValues.getFloat(TextStyleKeys.LETTER_SPACING)
      }
    }

  internal val resolvedTextWrap: TextWrap
    get() {
      val state = textValues.get(TextStyleKeys.TEXT_WRAP_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextWrap ?: TextWrap.from(
          textValues.get(
            TextStyleKeys.TEXT_WRAP
          )
        )
      } else {
        TextWrap.from(textValues.get(TextStyleKeys.TEXT_WRAP))
      }
    }

  internal val resolvedWhiteSpace: Styles.WhiteSpace
    get() {
      val state = textValues.get(TextStyleKeys.WHITE_SPACE_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedWhiteSpace
          ?: Styles.WhiteSpace.from(textValues.get(TextStyleKeys.WHITE_SPACE))
      } else {
        Styles.WhiteSpace.from(textValues.get(TextStyleKeys.WHITE_SPACE))
      }
    }

  internal val resolvedTextTransform: Styles.TextTransform
    get() {
      val state = textValues.get(TextStyleKeys.TRANSFORM_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextTransform
          ?: Styles.TextTransform.from(textValues.get(TextStyleKeys.TRANSFORM))
      } else {
        Styles.TextTransform.from(textValues.get(TextStyleKeys.TRANSFORM))
      }
    }

  internal val resolvedTextAlign: TextAlign
    get() {
      val state = textValues.get(TextStyleKeys.TEXT_ALIGN_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextAlign ?: TextAlign.from(
          textValues.get(
            TextStyleKeys.TEXT_ALIGN
          )
        )
      } else {
        TextAlign.from(textValues.get(TextStyleKeys.TEXT_ALIGN))
      }
    }

  internal val resolvedTextJustify: TextJustify
    get() {
      val state = textValues.get(TextStyleKeys.TEXT_JUSTIFY_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextJustify ?: TextJustify.from(
          textValues.get(
            TextStyleKeys.TEXT_JUSTIFY
          )
        )
      } else {
        TextJustify.from(textValues.get(TextStyleKeys.TEXT_JUSTIFY))
      }
    }

  internal val resolvedLineHeight: Float
    get() {
      val state = textValues.get(TextStyleKeys.LINE_HEIGHT_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedLineHeight
          ?: textValues.getFloat(TextStyleKeys.LINE_HEIGHT)
      } else {
        textValues.getFloat(TextStyleKeys.LINE_HEIGHT)
      }
    }

  internal val resolvedLineHeightType: Byte
    get() {
      val state = textValues.get(TextStyleKeys.LINE_HEIGHT_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedLineHeightType
          ?: textValues.get(TextStyleKeys.LINE_HEIGHT_TYPE)
      } else {
        textValues.get(TextStyleKeys.LINE_HEIGHT_TYPE)
      }
    }


  internal val resolvedTextShadow: List<Shadow.TextShadow>
    get() {
      val state = textValues.get(TextStyleKeys.TEXT_SHADOW_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextShadow ?: textShadows
      } else {
        textShadows
      }
    }

  // Reset methods
  fun resetFontFamilyToInherit() {
    textValues.put(TextStyleKeys.FONT_FAMILY_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(TextStyleChangeMask.FONT_FAMILY)
  }

  fun resetFontWeightToInherit() {
    textValues.put(TextStyleKeys.FONT_WEIGHT_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(TextStyleChangeMask.FONT_WEIGHT)
  }

  fun resetFontStyleToInherit() {
    textValues.put(TextStyleKeys.FONT_STYLE_STATE, StyleState.INHERIT)
    notifyTextStyleChanged(TextStyleChangeMask.FONT_STYLE)
  }

  internal val resolvedListStyleType: ListStyleType
    get() {
      return parentStyleWithTextValues?.resolvedListStyleType ?: ListStyleType.from(
        values.get(
          StyleKeys.LIST_STYLE_TYPE
        )
      )
    }

  internal val resolvedListStyleTypeRaw: Byte
    get() {
      return parentStyleWithTextValues?.resolvedListStyleTypeRaw ?: values.get(
        StyleKeys.LIST_STYLE_TYPE
      )
    }

  internal val resolvedListStylePosition: ListStylePosition
    get() {
      return parentStyleWithTextValues?.resolvedListStylePosition ?: ListStylePosition.from(
        values.get(StyleKeys.LIST_STYLE_POSITION)
      )
    }


  /* Resolved Styles */

  companion object {
    init {
      Mason.initLib()
    }

    /**
     * Get x-height by measuring lowercase 'x'
     */
    internal fun getXHeight(paint: Paint, xBounds: android.graphics.Rect): Float? {
      paint.getTextBounds("x", 0, 1, xBounds)
      return if (xBounds.height() > 0) xBounds.height().toFloat() else null
    }

    /**
     * Get cap-height by measuring uppercase 'H'
     */
    internal fun getCapHeight(paint: Paint, capBounds: android.graphics.Rect): Float? {
      paint.getTextBounds("H", 0, 1, capBounds)
      return if (capBounds.height() > 0) capBounds.height().toFloat() else null
    }

    internal fun applyClip(canvas: Canvas, clip: BackgroundClip, node: Node) {
      val width = node.computedLayout.width
      val height = node.computedLayout.height
      val padding = node.computedLayout.padding
      val border = node.computedLayout.border

      val left = padding.left
      val top = padding.top
      val right = width - padding.right
      val bottom = height - padding.bottom

      // For content-box, subtract border
      val contentLeft = left + border.left
      val contentTop = top + border.top
      val contentRight = right - border.right
      val contentBottom = bottom - border.bottom


      when (clip) {
        BackgroundClip.BORDER_BOX -> canvas.clipRect(left, top, right, bottom)
        BackgroundClip.PADDING_BOX -> canvas.clipRect(left, top, right, bottom)
        BackgroundClip.CONTENT_BOX -> canvas.clipRect(
          contentLeft, contentTop, contentRight, contentBottom
        )
      }
    }

    internal fun applyOverflowClip(style: Style, canvas: Canvas, node: Node) {
      val width = node.computedLayout.width
      val height = node.computedLayout.height
      val padding = node.computedLayout.padding

      val overflowX = style.values.get(StyleKeys.OVERFLOW_X)
      val overflowY = style.values.get(StyleKeys.OVERFLOW_Y)

      // Nothing to do if both axes are visible
      if (overflowX == Overflow.Visible.value && overflowY == Overflow.Visible.value) return

      val clipX = when (overflowX.toInt()) {
        1, 3 -> true
        4 -> style.node.overflowWidth > width
        else -> false
      }

      val clipY = when (overflowY.toInt()) {
        1, 3 -> true
        4 -> style.node.overflowHeight > height
        else -> false
      }

      val clipLeft = if (clipX) padding.left else 0f
      val clipTop = if (clipY) padding.top else 0f
      val clipRight = if (clipX) width - padding.right else width
      val clipBottom = if (clipY) height - padding.bottom else height

      canvas.withClip(clipLeft, clipTop, clipRight, clipBottom) {}
    }

    @FastNative
    @JvmStatic
    external fun nativeGetStyleBuffer(
      mason: Long,
      node: Long,
    ): Int

    @FastNative
    @JvmStatic
    external fun nativePrepareMut(
      mason: Long,
      node: Long,
    ): Int


    @JvmStatic
    external fun nativeNonBufferData(
      mason: Long,
      node: Long,
      gridAutoRows: String?,
      gridAutoColumns: String?,
      gridColumn: String?,
      gridColumnStart: String?,
      gridColumnEnd: String?,
      gridRow: String?,
      gridRowStart: String?,
      gridRowEnd: String?,
      gridTemplateRows: String?,
      gridTemplateColumns: String?,
      gridArea: String?,
      gridTemplateAreas: String?,
    )

    @JvmStatic
    external fun nativeGetGridArea(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridTemplateAreas(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridAutoRows(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridAutoColumns(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridColumn(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridColumnStart(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridColumnEnd(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridRow(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridRowStart(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridRowEnd(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridTemplateRows(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeGetGridTemplateColumns(
      mason: Long, node: Long
    ): String?

    @JvmStatic
    external fun nativeUpdateWithValues(
      mason: Long,
      node: Long,
      display: Byte,
      position: Byte,
      direction: Byte,
      flexDirection: Byte,
      flexWrap: Byte,
      overflow: Byte,
      alignItems: Byte,
      alignSelf: Byte,
      alignContent: Byte,
      justifyItems: Byte,
      justifySelf: Byte,
      justifyContent: Byte,

      insetLeftType: Byte,
      insetLeftValue: Float,
      insetRightType: Byte,
      insetRightValue: Float,
      insetTopType: Byte,
      insetTopValue: Float,
      insetBottomType: Byte,
      insetBottomValue: Float,

      marginLeftType: Byte,
      marginLeftValue: Float,
      marginRightType: Byte,
      marginRightValue: Float,
      marginTopType: Byte,
      marginTopValue: Float,
      marginBottomType: Byte,
      marginBottomValue: Float,

      paddingLeftType: Byte,
      paddingLeftValue: Float,
      paddingRightType: Byte,
      paddingRightValue: Float,
      paddingTopType: Byte,
      paddingTopValue: Float,
      paddingBottomType: Byte,
      paddingBottomValue: Float,

      borderLeftType: Byte,
      borderLeftValue: Float,
      borderRightType: Byte,
      borderRightValue: Float,
      borderTopType: Byte,
      borderTopValue: Float,
      borderBottomType: Byte,
      borderBottomValue: Float,

      flexGrow: Float,
      flexShrink: Float,

      flexBasisType: Byte,
      flexBasisValue: Float,

      widthType: Byte,
      widthValue: Float,
      heightType: Byte,
      heightValue: Float,

      minWidthType: Byte,
      minWidthValue: Float,
      minHeightType: Byte,
      minHeightValue: Float,

      maxWidthType: Byte,
      maxWidthValue: Float,
      maxHeightType: Byte,
      maxHeightValue: Float,

      gapRowType: Byte,
      gapRowValue: Float,
      gapColumnType: Byte,
      gapColumnValue: Float,

      aspectRatio: Float,

      gridAutoRows: String?,
      gridAutoColumns: String?,
      gridAutoFlow: Byte,
      gridColumn: String?,
      gridColumnStart: String?,
      gridColumnEnd: String?,
      gridRow: String?,
      gridRowStart: String?,
      gridRowEnd: String?,
      gridTemplateRows: String?,
      gridTemplateColumns: String?,
      overflowX: Byte,
      overflowY: Byte,
      scrollbarWidth: Float,
      textAlign: Byte,
      boxSizing: Byte,
      gridArea: String?,
      gridTemplateAreas: String?,
    )
  }
}
