package org.nativescript.mason.masonkit

import android.graphics.Canvas
import android.graphics.Color
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
import org.nativescript.mason.masonkit.enums.ObjectFit
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Position
import org.nativescript.mason.masonkit.enums.TextAlign
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.ceil


object StyleKeys {
  const val DISPLAY = 0
  const val POSITION = 4
  const val DIRECTION = 8
  const val FLEX_DIRECTION = 12
  const val FLEX_WRAP = 16
  const val OVERFLOW_X = 20
  const val OVERFLOW_Y = 24

  const val ALIGN_ITEMS = 28
  const val ALIGN_SELF = 32
  const val ALIGN_CONTENT = 36

  const val JUSTIFY_ITEMS = 40
  const val JUSTIFY_SELF = 44
  const val JUSTIFY_CONTENT = 48

  const val INSET_LEFT_TYPE = 52
  const val INSET_LEFT_VALUE = 56
  const val INSET_RIGHT_TYPE = 60
  const val INSET_RIGHT_VALUE = 64
  const val INSET_TOP_TYPE = 68
  const val INSET_TOP_VALUE = 72
  const val INSET_BOTTOM_TYPE = 76
  const val INSET_BOTTOM_VALUE = 80

  const val MARGIN_LEFT_TYPE = 84
  const val MARGIN_LEFT_VALUE = 88
  const val MARGIN_RIGHT_TYPE = 92
  const val MARGIN_RIGHT_VALUE = 96
  const val MARGIN_TOP_TYPE = 100
  const val MARGIN_TOP_VALUE = 104
  const val MARGIN_BOTTOM_TYPE = 108
  const val MARGIN_BOTTOM_VALUE = 112

  const val PADDING_LEFT_TYPE = 116
  const val PADDING_LEFT_VALUE = 120
  const val PADDING_RIGHT_TYPE = 124
  const val PADDING_RIGHT_VALUE = 128
  const val PADDING_TOP_TYPE = 132
  const val PADDING_TOP_VALUE = 136
  const val PADDING_BOTTOM_TYPE = 140
  const val PADDING_BOTTOM_VALUE = 144

  const val BORDER_LEFT_TYPE = 148
  const val BORDER_LEFT_VALUE = 152
  const val BORDER_RIGHT_TYPE = 156
  const val BORDER_RIGHT_VALUE = 160
  const val BORDER_TOP_TYPE = 164
  const val BORDER_TOP_VALUE = 168
  const val BORDER_BOTTOM_TYPE = 172
  const val BORDER_BOTTOM_VALUE = 176

  const val FLEX_GROW = 180
  const val FLEX_SHRINK = 184

  const val FLEX_BASIS_TYPE = 188
  const val FLEX_BASIS_VALUE = 192

  const val WIDTH_TYPE = 196
  const val WIDTH_VALUE = 200
  const val HEIGHT_TYPE = 204
  const val HEIGHT_VALUE = 208

  const val MIN_WIDTH_TYPE = 212
  const val MIN_WIDTH_VALUE = 216
  const val MIN_HEIGHT_TYPE = 220
  const val MIN_HEIGHT_VALUE = 224

  const val MAX_WIDTH_TYPE = 228
  const val MAX_WIDTH_VALUE = 232
  const val MAX_HEIGHT_TYPE = 236
  const val MAX_HEIGHT_VALUE = 240

  const val GAP_ROW_TYPE = 244
  const val GAP_ROW_VALUE = 248
  const val GAP_COLUMN_TYPE = 252
  const val GAP_COLUMN_VALUE = 256

  const val ASPECT_RATIO = 260
  const val GRID_AUTO_FLOW = 264
  const val GRID_COLUMN_START_TYPE = 268
  const val GRID_COLUMN_START_VALUE = 272
  const val GRID_COLUMN_END_TYPE = 276
  const val GRID_COLUMN_END_VALUE = 280
  const val GRID_ROW_START_TYPE = 284
  const val GRID_ROW_START_VALUE = 288
  const val GRID_ROW_END_TYPE = 292
  const val GRID_ROW_END_VALUE = 296
  const val SCROLLBAR_WIDTH = 300
  const val ALIGN = 304
  const val BOX_SIZING = 308
  const val OVERFLOW = 312
  const val ITEM_IS_TABLE = 316 //Byte
  const val ITEM_IS_REPLACED = 320 //Byte
  const val DISPLAY_MODE = 324
  const val FORCE_INLINE = 328
  const val MIN_CONTENT_WIDTH = 332
  const val MIN_CONTENT_HEIGHT = 336
  const val MAX_CONTENT_WIDTH = 340
  const val MAX_CONTENT_HEIGHT = 344

  // ----------------------------
  // Border Style (per side)
  // ----------------------------
  const val BORDER_LEFT_STYLE = 348
  const val BORDER_RIGHT_STYLE = 352
  const val BORDER_TOP_STYLE = 356
  const val BORDER_BOTTOM_STYLE = 360

  // ----------------------------
  // Border Color (per side)
  // ----------------------------
  const val BORDER_LEFT_COLOR = 364
  const val BORDER_RIGHT_COLOR = 368
  const val BORDER_TOP_COLOR = 372
  const val BORDER_BOTTOM_COLOR = 376

  // ============================================================
  // Border Radius (elliptical + squircle exponent)
  // Each corner = 20 bytes:
  //   x_type (4), x_value (4), y_type (4), y_value (4), exponent (4)
  // ============================================================

  // ----------------------------
  // Top-left corner (20 bytes)
  // ----------------------------
  const val BORDER_RADIUS_TOP_LEFT_X_TYPE = 380
  const val BORDER_RADIUS_TOP_LEFT_X_VALUE = 384
  const val BORDER_RADIUS_TOP_LEFT_Y_TYPE = 388
  const val BORDER_RADIUS_TOP_LEFT_Y_VALUE = 392
  const val BORDER_RADIUS_TOP_LEFT_EXPONENT = 396

  // ----------------------------
  // Top-right corner
  // ----------------------------
  const val BORDER_RADIUS_TOP_RIGHT_X_TYPE = 400
  const val BORDER_RADIUS_TOP_RIGHT_X_VALUE = 404
  const val BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 408
  const val BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 412
  const val BORDER_RADIUS_TOP_RIGHT_EXPONENT = 416

  // ----------------------------
  // Bottom-right corner
  // ----------------------------
  const val BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 420
  const val BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 424
  const val BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 428
  const val BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 432
  const val BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 436

  // ----------------------------
  // Bottom-left corner
  // ----------------------------
  const val BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 440
  const val BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 444
  const val BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 448
  const val BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 452
  const val BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 456

  // ----------------------------
  // Float
  // ----------------------------
  const val FLOAT = 460
  const val CLEAR = 464

  const val OBJECT_FIT = 468
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
  }

  infix fun or(other: StateKeys): StateKeys = StateKeys(bits or other.bits)
  infix fun and(other: StateKeys): StateKeys = StateKeys(bits and other.bits)
  infix fun hasFlag(flag: StateKeys): Boolean = (bits and flag.bits) != 0L
}

object TextStyleChangeMask {
  const val NONE: Int = 0
  const val COLOR: Int = 1 shl 0
  const val FONT_SIZE: Int = 1 shl 1
  const val FONT_WEIGHT: Int = 1 shl 2
  const val FONT_STYLE: Int = 1 shl 3
  const val FONT_FAMILY: Int = 1 shl 4
  const val LETTER_SPACING: Int = 1 shl 5
  const val DECORATION_LINE: Int = 1 shl 6
  const val DECORATION_COLOR: Int = 1 shl 7
  const val DECORATION_STYLE: Int = 1 shl 8
  const val BACKGROUND_COLOR: Int = 1 shl 9
  const val TEXT_WRAP: Int = 1 shl 10
  const val WHITE_SPACE: Int = 1 shl 11
  const val TEXT_TRANSFORM: Int = 1 shl 12
  const val TEXT_JUSTIFY: Int = 1 shl 13
  const val TEXT_OVERFLOW: Int = 1 shl 14
  const val LINE_HEIGHT: Int = 1 shl 15
  const val TEXT_ALIGN: Int = 1 shl 16
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

  var font: FontFace = FontFace("sans-serif")
    internal set

  val values: ByteBuffer by lazy {
    isValueInitialized = true
    nativeGetStyleBuffer(node.mason.nativePtr, node.nativePtr).apply {
      order(ByteOrder.nativeOrder())
    }
  }

  val textValues: ByteBuffer by lazy {
    isTextValueInitialized = true
    ByteBuffer.allocateDirect(140).apply {
      order(ByteOrder.nativeOrder())

      // Initialize all values with INHERIT state
      putInt(TextStyleKeys.COLOR, Color.BLACK)
      put(TextStyleKeys.COLOR_STATE, StyleState.INHERIT)

      putInt(TextStyleKeys.SIZE, Constants.DEFAULT_FONT_SIZE)
      put(TextStyleKeys.SIZE_STATE, StyleState.INHERIT)

      putInt(TextStyleKeys.FONT_WEIGHT, FontFace.NSCFontWeight.Normal.weight)
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

      putInt(TextStyleKeys.TEXT_ALIGN, TextAlign.Start.value)
      put(TextStyleKeys.TEXT_ALIGN_STATE, StyleState.INHERIT)

      putInt(TextStyleKeys.TEXT_JUSTIFY, TextJustify.None.value)
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
        ) || value.hasFlag(TextStateKeys.DECORATION_LINE) || sizeDirty || weightDirty || styleDirty || lineHeightDirty
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

  // allow overriding of the display
  internal var forceInline: Boolean
    get() {
      return values.getInt(StyleKeys.FORCE_INLINE) != 0
    }
    set(value) {
      values.putInt(
        StyleKeys.FORCE_INLINE, if (value) {
          1
        } else {
          0
        }
      )
      setOrAppendState(StateKeys.FORCE_INLINE)
    }


  var objectFit: ObjectFit
    get() {
      return ObjectFit.fromInt(values.getInt(StyleKeys.OBJECT_FIT))
    }
    set(value) {
      values.putInt(StyleKeys.OBJECT_FIT, value.value)
      setOrAppendState(StateKeys.OBJECT_FIT)
    }


  var float: org.nativescript.mason.masonkit.enums.Float
    get() {
      return org.nativescript.mason.masonkit.enums.Float.fromInt(values.getInt(StyleKeys.FLOAT))
    }
    set(value) {
      values.putInt(StyleKeys.FLOAT, value.value)
      setOrAppendState(StateKeys.FLOAT)
    }

  var clear: org.nativescript.mason.masonkit.enums.Clear
    get() {
      return org.nativescript.mason.masonkit.enums.Clear.fromInt(values.getInt(StyleKeys.CLEAR))
    }
    set(value) {
      values.putInt(StyleKeys.CLEAR, value.value)
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
        mBackground = null
      } else {
        parseBackground(value)?.let {
          mBackground = it
          mBackgroundRaw = value
          (node.view as? View)?.invalidate()
        }
      }

    }

  var textJustify: TextJustify
    get() {
      return TextJustify.fromInt(textValues.getInt(TextStyleKeys.TEXT_JUSTIFY))
    }
    set(value) {
      textValues.putInt(TextStyleKeys.TEXT_JUSTIFY, value.value)
      textValues.put(TextStyleKeys.TEXT_JUSTIFY_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.TEXT_JUSTIFY)
    }

  var color: Int
    get() = textValues.getInt(TextStyleKeys.COLOR)
    set(value) {
      textValues.putInt(TextStyleKeys.COLOR, value)
      textValues.put(TextStyleKeys.COLOR_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.COLOR)
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
        notifyTextStyleChanged(TextStyleChangeMask.FONT_WEIGHT)
      }
    }

  var fontStyle: FontFace.NSCFontStyle
    set(value) {
      val previous = fontStyle
      if (previous != value) {
        textValues.putInt(TextStyleKeys.FONT_STYLE_TYPE, value.style.value)
        textValues.put(TextStyleKeys.FONT_STYLE_STATE, StyleState.SET)
        font.style = value
        notifyTextStyleChanged(TextStyleChangeMask.FONT_STYLE)
      }
    }
    get() {
      val style = textValues.getInt(TextStyleKeys.FONT_STYLE_TYPE)
      when (style) {
        0 -> {
          return FontFace.NSCFontStyle.Normal
        }

        1 -> {
          return FontFace.NSCFontStyle.Italic
        }

        2 -> {
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
      return TextWrap.fromInt(textValues.getInt(TextStyleKeys.TEXT_WRAP))
    }
    set(value) {
      textValues.putInt(TextStyleKeys.TEXT_WRAP, value.value)
      textValues.put(TextStyleKeys.TEXT_WRAP_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.TEXT_WRAP)
    }

  var whiteSpace: Styles.WhiteSpace
    get() {
      return Styles.WhiteSpace.fromInt(textValues.getInt(TextStyleKeys.WHITE_SPACE))
    }
    set(value) {
      textValues.putInt(TextStyleKeys.WHITE_SPACE, value.value)
      textValues.put(TextStyleKeys.WHITE_SPACE_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.WHITE_SPACE)
    }

  var textTransform: Styles.TextTransform
    get() {
      return Styles.TextTransform.fromInt(textValues.getInt(TextStyleKeys.TRANSFORM))
    }
    set(value) {
      textValues.putInt(TextStyleKeys.TRANSFORM, value.value)
      textValues.put(TextStyleKeys.TRANSFORM_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.TEXT_TRANSFORM)
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
      return Styles.DecorationLine.fromInt(textValues.getInt(TextStyleKeys.DECORATION_LINE))
    }
    set(value) {
      textValues.putInt(TextStyleKeys.DECORATION_LINE, value.value)
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
      return Styles.DecorationStyle.fromInt(
        textValues.getInt(TextStyleKeys.DECORATION_STYLE)
      )
    }
    set(value) {
      textValues.putInt(TextStyleKeys.DECORATION_STYLE, value.value)
      textValues.put(TextStyleKeys.DECORATION_STYLE_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.DECORATION_STYLE)
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
      textValues.putInt(TextStyleKeys.TRANSFORM, value.value)
      textValues.put(TextStyleKeys.TRANSFORM_STATE, StyleState.SET)
      notifyTextStyleChanged(TextStyleChangeMask.TEXT_OVERFLOW)
    }


  var display: Display
    get() {
      val mode = DisplayMode.fromInt(values.getInt(StyleKeys.DISPLAY_MODE))
      return when (mode) {
        DisplayMode.None -> {
          Display.fromInt(values.getInt(StyleKeys.DISPLAY))
        }

        DisplayMode.Inline -> {
          Display.Inline
        }

        DisplayMode.Box -> {
          when (Display.fromInt(values.getInt(StyleKeys.DISPLAY))) {
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
      }

      values.putInt(StyleKeys.DISPLAY_MODE, displayMode.value)
      values.putInt(StyleKeys.DISPLAY, display)
      setOrAppendState(arrayOf(StateKeys.DISPLAY_MODE, StateKeys.DISPLAY))
    }

  var position: Position
    get() {
      return Position.fromInt(values.getInt(StyleKeys.POSITION))
    }
    set(value) {
      values.putInt(StyleKeys.POSITION, value.value)
      setOrAppendState(StateKeys.POSITION)
    }

  // TODO
  var direction: Direction
    get() {
      return Direction.fromInt(values.getInt(StyleKeys.DIRECTION))
    }
    set(value) {
      values.putInt(StyleKeys.DIRECTION, value.value)
      setOrAppendState(StateKeys.DIRECTION)
    }

  var flexDirection: FlexDirection
    get() {
      return FlexDirection.fromInt(values.getInt(StyleKeys.FLEX_DIRECTION))
    }
    set(value) {
      values.putInt(StyleKeys.FLEX_DIRECTION, value.value)
      setOrAppendState(StateKeys.FLEX_DIRECTION)
    }

  var flexWrap: FlexWrap
    get() {
      return FlexWrap.fromInt(values.getInt(StyleKeys.FLEX_WRAP))
    }
    set(value) {
      values.putInt(StyleKeys.FLEX_WRAP, value.value)
      setOrAppendState(StateKeys.FLEX_WRAP)
    }

  var overflow: Point<Overflow>
    get() {
      return Point(
        Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW_X)),
        Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW_Y))
      )
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW_X, value.x.value)
      values.putInt(StyleKeys.OVERFLOW_Y, value.x.value)
      setOrAppendState(arrayOf(StateKeys.OVERFLOW_X, StateKeys.OVERFLOW_Y))
    }

  var overflowX: Overflow
    get() {
      return Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW_X))
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW_X, value.value)
      setOrAppendState(StateKeys.OVERFLOW_X)
    }

  var overflowY: Overflow
    get() {
      return Overflow.fromInt(values.getInt(StyleKeys.OVERFLOW_Y))
    }
    set(value) {
      values.putInt(StyleKeys.OVERFLOW_Y, value.value)
      setOrAppendState(StateKeys.OVERFLOW_Y)
    }

  var alignItems: AlignItems
    get() {
      return AlignItems.fromInt(values.getInt(StyleKeys.ALIGN_ITEMS))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_ITEMS, value.value)
      setOrAppendState(StateKeys.ALIGN_ITEMS)
    }

  var alignSelf: AlignSelf
    get() {
      return AlignSelf.fromInt(values.getInt(StyleKeys.ALIGN_SELF))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_SELF, value.value)
      setOrAppendState(StateKeys.ALIGN_SELF)
    }

  var alignContent: AlignContent
    get() {
      return AlignContent.fromInt(values.getInt(StyleKeys.ALIGN_CONTENT))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN_CONTENT, value.value)
      setOrAppendState(StateKeys.ALIGN_CONTENT)
    }


  var justifyItems: JustifyItems
    get() {
      return JustifyItems.fromInt(values.getInt(StyleKeys.JUSTIFY_ITEMS))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_ITEMS, value.value)
      setOrAppendState(StateKeys.JUSTIFY_ITEMS)
    }


  var justifySelf: JustifySelf
    get() {
      return JustifySelf.fromInt(values.getInt(StyleKeys.JUSTIFY_SELF))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_SELF, value.value)
      setOrAppendState(StateKeys.JUSTIFY_SELF)
    }

  var justifyContent: JustifyContent
    get() {
      return JustifyContent.fromInt(values.getInt(StyleKeys.JUSTIFY_CONTENT))
    }
    set(value) {
      values.putInt(StyleKeys.JUSTIFY_CONTENT, value.value)
      setOrAppendState(StateKeys.JUSTIFY_CONTENT)
    }


  var align: Align
    get() {
      return Align.fromInt(values.getInt(StyleKeys.ALIGN))
    }
    set(value) {
      values.putInt(StyleKeys.ALIGN, value.value)
      setOrAppendState(StateKeys.ALIGN)
    }

  var textAlign: TextAlign
    get() {
      return TextAlign.fromInt(textValues.getInt(TextStyleKeys.TEXT_ALIGN))
    }
    set(value) {
      textValues.putInt(TextStyleKeys.TEXT_ALIGN, value.value)
      textValues.put(TextStyleKeys.TEXT_ALIGN_STATE, StyleState.SET)
      setOrAppendState(TextStateKeys.TEXT_ALIGN)
    }

  var boxSizing: BoxSizing
    get() {
      return BoxSizing.fromInt(values.getInt(StyleKeys.BOX_SIZING))
    }
    set(value) {
      values.putInt(StyleKeys.BOX_SIZING, value.value)
      setOrAppendState(StateKeys.BOX_SIZING)
    }


  var inset: Rect<LengthPercentageAuto>
    get() {
      return Rect(
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_LEFT_TYPE), values.getFloat(StyleKeys.INSET_LEFT_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_RIGHT_TYPE), values.getFloat(StyleKeys.INSET_RIGHT_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_TOP_TYPE), values.getFloat(StyleKeys.INSET_TOP_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.INSET_BOTTOM_TYPE), values.getFloat(StyleKeys.INSET_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {
      values.putInt(StyleKeys.INSET_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value.left.value)

      values.putInt(StyleKeys.INSET_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value.right.value)

      values.putInt(StyleKeys.INSET_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value.top.value)

      values.putInt(StyleKeys.INSET_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value.bottom.value)

      setOrAppendState(StateKeys.INSET)
    }

  fun setInsetLeft(value: Float, type: Int) {
    val left = LengthPercentageAuto.fromTypeValue(type, value)

    left?.let {
      values.putInt(StyleKeys.INSET_LEFT_TYPE, type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetRight(value: Float, type: Int) {
    val right = LengthPercentageAuto.fromTypeValue(type, value)

    right?.let {
      values.putInt(StyleKeys.INSET_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetTop(value: Float, type: Int) {
    val top = LengthPercentageAuto.fromTypeValue(type, value)

    top?.let {
      values.putInt(StyleKeys.INSET_TOP_TYPE, type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetBottom(value: Float, type: Int) {
    val bottom = LengthPercentageAuto.fromTypeValue(type, value)

    bottom?.let {
      values.putInt(StyleKeys.INSET_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  fun setInsetWithValueType(value: Float, type: Int) {
    val inset = LengthPercentageAuto.fromTypeValue(type, value)

    inset?.let {
      values.putInt(StyleKeys.INSET_LEFT_TYPE, type)
      values.putFloat(StyleKeys.INSET_LEFT_VALUE, value)

      values.putInt(StyleKeys.INSET_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.INSET_RIGHT_VALUE, value)

      values.putInt(StyleKeys.INSET_TOP_TYPE, type)
      values.putFloat(StyleKeys.INSET_TOP_VALUE, value)

      values.putInt(StyleKeys.INSET_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.INSET_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.INSET)
    }
  }

  var margin: Rect<LengthPercentageAuto>
    get() {
      return Rect(
        LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
        )!!, LengthPercentageAuto.fromTypeValue(
          values.getInt(StyleKeys.MARGIN_BOTTOM_TYPE),
          values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {
      values.putInt(StyleKeys.MARGIN_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value.left.value)

      values.putInt(StyleKeys.MARGIN_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value.right.value)

      values.putInt(StyleKeys.MARGIN_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value.top.value)

      values.putInt(StyleKeys.MARGIN_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value.bottom.value)

      setOrAppendState(StateKeys.MARGIN)
    }

  fun setMarginLeft(value: Float, type: Int) {
    val left = LengthPercentageAuto.fromTypeValue(type, value)

    left?.let {
      values.putInt(StyleKeys.MARGIN_LEFT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginRight(value: Float, type: Int) {
    val right = LengthPercentageAuto.fromTypeValue(type, value)

    right?.let {
      values.putInt(StyleKeys.MARGIN_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginTop(value: Float, type: Int) {
    val top = LengthPercentageAuto.fromTypeValue(type, value)

    top?.let {
      values.putInt(StyleKeys.MARGIN_TOP_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginBottom(value: Float, type: Int) {
    val bottom = LengthPercentageAuto.fromTypeValue(type, value)

    bottom?.let {
      values.putInt(StyleKeys.MARGIN_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  fun setMarginWithValueType(value: Float, type: Int) {
    val margin = LengthPercentageAuto.fromTypeValue(type, value)

    margin?.let {
      values.putInt(StyleKeys.MARGIN_LEFT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_LEFT_VALUE, value)

      values.putInt(StyleKeys.MARGIN_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_RIGHT_VALUE, value)

      values.putInt(StyleKeys.MARGIN_TOP_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_TOP_VALUE, value)

      values.putInt(StyleKeys.MARGIN_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.MARGIN_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.MARGIN)
    }
  }

  var padding: Rect<LengthPercentage>
    get() {
      return Rect(
        LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.PADDING_LEFT_TYPE), values.getFloat(StyleKeys.PADDING_LEFT_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.PADDING_RIGHT_TYPE),
          values.getFloat(StyleKeys.PADDING_RIGHT_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.PADDING_TOP_TYPE), values.getFloat(StyleKeys.PADDING_TOP_VALUE)
        )!!, LengthPercentage.fromTypeValue(
          values.getInt(StyleKeys.PADDING_BOTTOM_TYPE),
          values.getFloat(StyleKeys.PADDING_BOTTOM_VALUE)
        )!!
      )
    }
    set(value) {

      values.putInt(StyleKeys.PADDING_LEFT_TYPE, value.left.type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value.left.value)

      values.putInt(StyleKeys.PADDING_RIGHT_TYPE, value.right.type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value.right.value)

      values.putInt(StyleKeys.PADDING_TOP_TYPE, value.top.type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value.top.value)

      values.putInt(StyleKeys.PADDING_BOTTOM_TYPE, value.bottom.type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value.bottom.value)
      setOrAppendState(StateKeys.PADDING)
    }

  fun setPaddingLeft(value: Float, type: Int) {
    val left = LengthPercentage.fromTypeValue(type, value)

    left?.let {
      values.putInt(StyleKeys.PADDING_LEFT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingRight(value: Float, type: Int) {
    val right = LengthPercentage.fromTypeValue(type, value)

    right?.let {
      values.putInt(StyleKeys.PADDING_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingTop(value: Float, type: Int) {
    val top = LengthPercentage.fromTypeValue(type, value)

    top?.let {
      values.putInt(StyleKeys.PADDING_TOP_TYPE, type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingBottom(value: Float, type: Int) {
    val bottom = LengthPercentage.fromTypeValue(type, value)

    bottom?.let {
      values.putInt(StyleKeys.PADDING_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
  }

  fun setPaddingWithValueType(value: Float, type: Int) {
    val padding = LengthPercentage.fromTypeValue(type, value)

    padding?.let {
      values.putInt(StyleKeys.PADDING_LEFT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_LEFT_VALUE, value)

      values.putInt(StyleKeys.PADDING_RIGHT_TYPE, type)
      values.putFloat(StyleKeys.PADDING_RIGHT_VALUE, value)

      values.putInt(StyleKeys.PADDING_TOP_TYPE, type)
      values.putFloat(StyleKeys.PADDING_TOP_VALUE, value)

      values.putInt(StyleKeys.PADDING_BOTTOM_TYPE, type)
      values.putFloat(StyleKeys.PADDING_BOTTOM_VALUE, value)
      setOrAppendState(StateKeys.PADDING)
    }
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
      values.getInt(keys.xType), values.getFloat(keys.xValue)
    )!!
    val y = LengthPercentage.fromTypeValue(
      values.getInt(keys.yType), values.getFloat(keys.yValue)
    )!!
    return Point(x, y)
  }

  internal fun setRadiusPoint(keys: IKeyCorner, value: Point<LengthPercentage>) {
    values.putInt(keys.xType, value.x.type)
    values.putFloat(keys.xValue, value.x.value)
    values.putInt(keys.yType, value.y.type)
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
        mBorderLeft.style,
        mBorderRight.style,
        mBorderTop.style,
        mBorderBottom.style,
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
        top = mBorderTop.color,
        right = mBorderRight.color,
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
        left = mBorderLeft.width,
        top = mBorderTop.width,
        right = mBorderRight.width,
        bottom = mBorderBottom.width
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

  fun setBorderLeftWidth(value: Float, type: Int) {
    val left = LengthPercentage.fromTypeValue(type, value)
    left?.let {
      mBorderLeft.width = it
    }
  }

  fun setBorderRightWidth(value: Float, type: Int) {
    val right = LengthPercentage.fromTypeValue(type, value)

    right?.let {
      mBorderRight.width = it
    }
  }

  fun setBorderTopWidth(value: Float, type: Int) {
    val top = LengthPercentage.fromTypeValue(type, value)

    top?.let {
      mBorderTop.width = it
    }
  }

  fun setBorderBottomWidth(value: Float, type: Int) {
    val bottom = LengthPercentage.fromTypeValue(type, value)

    bottom?.let {
      mBorderBottom.width = it
    }
  }

  fun setBorderWidth(value: Float, type: Int) {
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
      values.putFloat(StyleKeys.FLEX_GROW, value)
      setOrAppendState(StateKeys.FLEX_GROW)
    }

  var flexShrink: Float
    get() {
      return values.getFloat(StyleKeys.FLEX_SHRINK)
    }
    set(value) {
      values.putFloat(StyleKeys.FLEX_SHRINK, value)
      setOrAppendState(StateKeys.FLEX_SHRINK)
    }

  var flexBasis: Dimension
    get() {
      val type = values.getInt(StyleKeys.FLEX_BASIS_TYPE)
      val value = values.getFloat(StyleKeys.FLEX_BASIS_VALUE)
      // always valid
      return Dimension.fromTypeValue(type, value)!!
    }
    set(value) {
      values.putInt(StyleKeys.FLEX_BASIS_TYPE, value.type)
      values.putFloat(StyleKeys.FLEX_BASIS_VALUE, value.value)
      setOrAppendState(StateKeys.FLEX_BASIS)
    }


  var scrollBarWidth: Float
    get() {
      return values.getFloat(StyleKeys.SCROLLBAR_WIDTH)
    }
    set(value) {
      values.putFloat(StyleKeys.SCROLLBAR_WIDTH, value)
      setOrAppendState(StateKeys.SCROLLBAR_WIDTH)
    }


  fun setFlexBasis(value: Float, type: Int) {
    Dimension.fromTypeValue(type, value)?.let {
      values.putInt(StyleKeys.FLEX_BASIS_TYPE, type)
      values.putFloat(StyleKeys.FLEX_BASIS_VALUE, value)
      setOrAppendState(StateKeys.FLEX_BASIS)
    }
  }

  var minSize: Size<Dimension>
    get() {
      val widthType = values.getInt(StyleKeys.MIN_WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.MIN_WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.getInt(StyleKeys.MIN_HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.MIN_HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      values.putInt(StyleKeys.MIN_WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value.width.value)
      values.putInt(StyleKeys.MIN_HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }

  fun setMinSizeWidth(value: Float, type: Int) {
    val width = Dimension.fromTypeValue(type, value)
    width?.let {
      values.putInt(StyleKeys.MIN_WIDTH_TYPE, type)
      values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }
  }

  fun setMinSizeHeight(value: Float, type: Int) {
    val height = Dimension.fromTypeValue(type, value)
    height?.let {
      values.putInt(StyleKeys.MIN_HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.MIN_SIZE)
    }
  }


  fun setMinSizeWidth(value: Dimension) {
    values.putInt(StyleKeys.MIN_WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.MIN_WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  fun setMinSizeHeight(value: Dimension) {
    values.putInt(StyleKeys.MIN_HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.MIN_HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.MIN_SIZE)
  }

  var size: Size<Dimension>
    get() {
      val widthType = values.getInt(StyleKeys.WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.getInt(StyleKeys.HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      values.putInt(StyleKeys.WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.WIDTH_VALUE, value.width.value)

      values.putInt(StyleKeys.HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.SIZE)
    }


  fun setSizeWidth(value: Float, type: Int) {
    val width = Dimension.fromTypeValue(type, value)

    width?.let {
      values.putInt(StyleKeys.WIDTH_TYPE, type)
      values.putFloat(StyleKeys.WIDTH_VALUE, value)
      setOrAppendState(StateKeys.SIZE)
    }
  }

  fun setSizeWidth(value: Dimension) {
    values.putInt(StyleKeys.WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.SIZE)
  }

  fun setSizeHeight(value: Float, type: Int) {
    val height = Dimension.fromTypeValue(type, value)

    height?.let {
      values.putInt(StyleKeys.HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.SIZE)
    }
  }

  fun setSizeHeight(value: Dimension) {
    values.putInt(StyleKeys.HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.SIZE)
  }

  var maxSize: Size<Dimension>
    get() {
      val widthType = values.getInt(StyleKeys.MAX_WIDTH_TYPE)
      val widthValue = values.getFloat(StyleKeys.MAX_WIDTH_VALUE)
      val width = Dimension.fromTypeValue(widthType, widthValue)

      val heightType = values.getInt(StyleKeys.MAX_HEIGHT_TYPE)
      val heightValue = values.getFloat(StyleKeys.MAX_HEIGHT_VALUE)
      val height = Dimension.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      values.putInt(StyleKeys.MAX_WIDTH_TYPE, value.width.type)
      values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value.width.value)
      values.putInt(StyleKeys.MAX_HEIGHT_TYPE, value.height.type)
      values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value.height.value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }

  fun setMaxSizeWidth(value: Float, type: Int) {
    val width = Dimension.fromTypeValue(type, value)

    width?.let {
      values.putInt(StyleKeys.MAX_WIDTH_TYPE, type)
      values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }
  }

  fun setMaxSizeHeight(value: Float, type: Int) {
    val height = Dimension.fromTypeValue(type, value)

    height?.let {
      values.putInt(StyleKeys.MAX_HEIGHT_TYPE, type)
      values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value)
      setOrAppendState(StateKeys.MAX_SIZE)
    }
  }


  fun setMaxSizeWidth(value: Dimension) {
    values.putInt(StyleKeys.MAX_WIDTH_TYPE, value.type)
    values.putFloat(StyleKeys.MAX_WIDTH_VALUE, value.value)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  fun setMaxSizeHeight(value: Dimension) {
    values.putInt(StyleKeys.MAX_HEIGHT_TYPE, value.type)
    values.putFloat(StyleKeys.MAX_HEIGHT_VALUE, value.value)
    setOrAppendState(StateKeys.MAX_SIZE)
  }

  var gap: Size<LengthPercentage>
    get() {
      val widthType = values.getInt(StyleKeys.GAP_ROW_TYPE)
      val widthValue = values.getFloat(StyleKeys.GAP_ROW_VALUE)
      val width = LengthPercentage.fromTypeValue(widthType, widthValue)

      val heightType = values.getInt(StyleKeys.GAP_COLUMN_TYPE)
      val heightValue = values.getFloat(StyleKeys.GAP_COLUMN_VALUE)
      val height = LengthPercentage.fromTypeValue(heightType, heightValue)
      return Size(width!!, height!!)
    }
    set(value) {
      values.putInt(StyleKeys.GAP_ROW_TYPE, value.width.type)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, value.width.value)
      values.putInt(StyleKeys.GAP_COLUMN_TYPE, value.height.type)
      values.putFloat(StyleKeys.GAP_COLUMN_VALUE, value.height.value)
      setOrAppendState(StateKeys.GAP)
    }

  fun setGap(widthValue: Float, widthType: Int, heightValue: Float, heightType: Int) {
    val width = LengthPercentage.fromTypeValue(widthType, widthValue)

    val height = LengthPercentage.fromTypeValue(heightType, heightValue)

    if (width != null && height != null) {
      values.putInt(StyleKeys.GAP_ROW_TYPE, widthType)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, widthValue)
      values.putInt(StyleKeys.GAP_COLUMN_TYPE, heightType)
      values.putFloat(StyleKeys.GAP_COLUMN_VALUE, heightValue)
      setOrAppendState(StateKeys.GAP)
    }
  }


  fun setGapRow(value: Float, type: Int) {
    val width = LengthPercentage.fromTypeValue(type, value)

    width?.let {
      values.putInt(StyleKeys.GAP_ROW_TYPE, type)
      values.putFloat(StyleKeys.GAP_ROW_VALUE, value)
      setOrAppendState(StateKeys.GAP)
    }
  }

  fun setGapColumn(value: Float, type: Int) {
    val height = LengthPercentage.fromTypeValue(type, value)

    height?.let {
      values.putInt(StyleKeys.GAP_COLUMN_TYPE, type)
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

  private fun <T> lazyCache(getCache: () -> T?, setCache: (T) -> Unit, fetch: () -> T): T {
    val cached = getCache()
    return cached ?: fetch().also { setCache(it) }
  }

  private var _gridArea: String? = null
  var gridArea: String
    get() {
      return lazyCache({ _gridArea }, { _gridArea = it }) {
        nativeGetGridArea(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        nativeGetGridTemplateAreas(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        nativeGetGridAutoRows(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        nativeGetGridAutoColumns(node.mason.nativePtr, node.nativePtr) ?: ""
      }
    }
    set(value) {
      gridState.gridAutoColumns = value
      _gridAutoColumns = null
      isSlowDirty = true
    }

  var gridAutoFlow: GridAutoFlow
    get() {
      return GridAutoFlow.fromInt(values.getInt(StyleKeys.GRID_AUTO_FLOW))
    }
    set(value) {
      values.putInt(StyleKeys.GRID_AUTO_FLOW, value.value)
      setOrAppendState(StateKeys.GRID_AUTO_FLOW)
    }

  private var _gridColumn: String? = null
  var gridColumn: String
    get() {
      return lazyCache({ _gridColumn }, { _gridColumn = it }) {
        nativeGetGridColumn(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        nativeGetGridColumnStart(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        nativeGetGridColumnEnd(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        nativeGetGridRow(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        nativeGetGridRowStart(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        nativeGetGridRowEnd(node.mason.nativePtr, node.nativePtr) ?: ""
      }
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
        ) ?: ""
      }
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
        ) ?: ""
      }
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
      resetState()
      (node.view as? Element)?.invalidateLayout()
      return
    }

    if (isDirty != -1L) {
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
      values.getInt(StyleKeys.MARGIN_LEFT_TYPE), values.getFloat(StyleKeys.MARGIN_LEFT_VALUE)
    )?.let {
      marginLeft = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_RIGHT_TYPE), values.getFloat(StyleKeys.MARGIN_RIGHT_VALUE)
    )?.let {
      marginRight = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_TOP_TYPE), values.getFloat(StyleKeys.MARGIN_TOP_VALUE)
    )?.let {
      marginTop = it
    }

    LengthPercentageAuto.fromTypeValue(
      values.getInt(StyleKeys.MARGIN_BOTTOM_TYPE), values.getFloat(StyleKeys.MARGIN_BOTTOM_VALUE)
    )?.let {
      marginBottom = it
    }

    return Rect(marginLeft, marginRight, marginTop, marginBottom)
  }

  fun getNativeSize(): Size<Dimension> {
    val width = Dimension.fromTypeValue(
      values.getInt(StyleKeys.WIDTH_TYPE), values.getFloat(StyleKeys.WIDTH_VALUE)
    )
    val height = Dimension.fromTypeValue(
      values.getInt(StyleKeys.HEIGHT_TYPE), values.getFloat(StyleKeys.HEIGHT_VALUE)
    )
    return Size(width as Dimension, height as Dimension)
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

  // Store the resolved FontFace - lazily computed
  internal val resolvedFontFace: FontFace
    get() {
      val familyState = textValues.get(TextStyleKeys.FONT_FAMILY_STATE)
      val weightState = textValues.get(TextStyleKeys.FONT_WEIGHT_STATE)
      val styleState = textValues.get(TextStyleKeys.FONT_STYLE_STATE)

      // If all font properties are inherited, use parent's font face
      if (familyState == StyleState.INHERIT && weightState == StyleState.INHERIT && styleState == StyleState.INHERIT) {
        return parentStyleWithTextValues?.resolvedFontFace ?: font
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
        return font
      }

      // Create a new FontFace with resolved properties
      val resolvedFont = FontFace(baseFamily).apply {
        weight = resolvedWeight
        style = resolvedStyle
      }

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
        parentStyleWithTextValues?.resolvedDecorationLine ?: Styles.DecorationLine.fromInt(
          textValues.getInt(TextStyleKeys.DECORATION_LINE)
        )
      } else {
        Styles.DecorationLine.fromInt(textValues.getInt(TextStyleKeys.DECORATION_LINE))
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
        parentStyleWithTextValues?.resolvedDecorationStyle ?: Styles.DecorationStyle.fromInt(
          textValues.getInt(TextStyleKeys.DECORATION_STYLE)
        )
      } else {
        Styles.DecorationStyle.fromInt(textValues.getInt(TextStyleKeys.DECORATION_STYLE))
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

  internal val resolvedTextWrap: Styles.TextWrap
    get() {
      val state = textValues.get(TextStyleKeys.TEXT_WRAP_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextWrap ?: Styles.TextWrap.fromInt(
          textValues.getInt(
            TextStyleKeys.TEXT_WRAP
          )
        )
      } else {
        Styles.TextWrap.fromInt(textValues.getInt(TextStyleKeys.TEXT_WRAP))
      }
    }

  internal val resolvedWhiteSpace: Styles.WhiteSpace
    get() {
      val state = textValues.get(TextStyleKeys.WHITE_SPACE_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedWhiteSpace
          ?: Styles.WhiteSpace.fromInt(textValues.getInt(TextStyleKeys.WHITE_SPACE))
      } else {
        Styles.WhiteSpace.fromInt(textValues.getInt(TextStyleKeys.WHITE_SPACE))
      }
    }

  internal val resolvedTextTransform: Styles.TextTransform
    get() {
      val state = textValues.get(TextStyleKeys.TRANSFORM_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextTransform
          ?: Styles.TextTransform.fromInt(textValues.getInt(TextStyleKeys.TRANSFORM))
      } else {
        Styles.TextTransform.fromInt(textValues.getInt(TextStyleKeys.TRANSFORM))
      }
    }

  internal val resolvedTextAlign: TextAlign
    get() {
      val state = textValues.get(TextStyleKeys.TEXT_ALIGN_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextAlign ?: TextAlign.fromInt(
          textValues.getInt(
            TextStyleKeys.TEXT_ALIGN
          )
        )
      } else {
        TextAlign.fromInt(textValues.getInt(TextStyleKeys.TEXT_ALIGN))
      }
    }

  internal val resolvedTextJustify: TextJustify
    get() {
      val state = textValues.get(TextStyleKeys.TEXT_JUSTIFY_STATE)
      return if (state == StyleState.INHERIT) {
        parentStyleWithTextValues?.resolvedTextJustify ?: TextJustify.fromInt(
          textValues.getInt(
            TextStyleKeys.TEXT_JUSTIFY
          )
        )
      } else {
        TextJustify.fromInt(textValues.getInt(TextStyleKeys.TEXT_JUSTIFY))
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


  /* Resolved Styles */

  companion object {
    init {
      Mason.initLib()
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

      val overflowX = style.values.getInt(StyleKeys.OVERFLOW_X)
      val overflowY = style.values.getInt(StyleKeys.OVERFLOW_Y)

      // Nothing to do if both axes are visible
      if (overflowX == Overflow.Visible.value && overflowY == Overflow.Visible.value) return

      val clipX = when (overflowX) {
        1, 3 -> true
        4 -> style.node.overflowWidth > width
        else -> false
      }

      val clipY = when (overflowY) {
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
    ): ByteBuffer


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
      display: Int,
      position: Int,
      direction: Int,
      flexDirection: Int,
      flexWrap: Int,
      overflow: Int,
      alignItems: Int,
      alignSelf: Int,
      alignContent: Int,
      justifyItems: Int,
      justifySelf: Int,
      justifyContent: Int,

      insetLeftType: Int,
      insetLeftValue: Float,
      insetRightType: Int,
      insetRightValue: Float,
      insetTopType: Int,
      insetTopValue: Float,
      insetBottomType: Int,
      insetBottomValue: Float,

      marginLeftType: Int,
      marginLeftValue: Float,
      marginRightType: Int,
      marginRightValue: Float,
      marginTopType: Int,
      marginTopValue: Float,
      marginBottomType: Int,
      marginBottomValue: Float,

      paddingLeftType: Int,
      paddingLeftValue: Float,
      paddingRightType: Int,
      paddingRightValue: Float,
      paddingTopType: Int,
      paddingTopValue: Float,
      paddingBottomType: Int,
      paddingBottomValue: Float,

      borderLeftType: Int,
      borderLeftValue: Float,
      borderRightType: Int,
      borderRightValue: Float,
      borderTopType: Int,
      borderTopValue: Float,
      borderBottomType: Int,
      borderBottomValue: Float,

      flexGrow: Float,
      flexShrink: Float,

      flexBasisType: Int,
      flexBasisValue: Float,

      widthType: Int,
      widthValue: Float,
      heightType: Int,
      heightValue: Float,

      minWidthType: Int,
      minWidthValue: Float,
      minHeightType: Int,
      minHeightValue: Float,

      maxWidthType: Int,
      maxWidthValue: Float,
      maxHeightType: Int,
      maxHeightValue: Float,

      gapRowType: Int,
      gapRowValue: Float,
      gapColumnType: Int,
      gapColumnValue: Float,

      aspectRatio: Float,

      gridAutoRows: String?,
      gridAutoColumns: String?,
      gridAutoFlow: Int,
      gridColumn: String?,
      gridColumnStart: String?,
      gridColumnEnd: String?,
      gridRow: String?,
      gridRowStart: String?,
      gridRowEnd: String?,
      gridTemplateRows: String?,
      gridTemplateColumns: String?,
      overflowX: Int,
      overflowY: Int,
      scrollbarWidth: Float,
      textAlign: Int,
      boxSizing: Int,
      gridArea: String?,
      gridTemplateAreas: String?,
    )
  }
}
