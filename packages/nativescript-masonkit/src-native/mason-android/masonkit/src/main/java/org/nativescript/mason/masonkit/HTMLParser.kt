package org.nativescript.mason.masonkit

import android.content.Context
import android.os.Build
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Position
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType

class HTMLParser(private val mason: Mason, internal var context: Context) {

  // region Public API

  fun parse(html: String): List<Node> {
    val tokens = tokenize(html)
    return buildTree(tokens)
  }

  fun parseInto(html: String, element: Element) {
    val children = parse(html)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      (element.view as? ViewGroup)?.suppressLayout(true)
    }
    for (child in children) {
      element.append(child)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      (element.view as? ViewGroup)?.suppressLayout(false)
    }
  }

  // endregion

  // region Tokenizer

  private sealed class Token {
    data class OpenTag(
      val name: String,
      val attributes: Map<String, String>,
      val selfClosing: Boolean
    ) : Token()

    data class CloseTag(val name: String) : Token()
    data class Text(val content: String) : Token()
  }

  companion object {
    private val VOID_ELEMENTS = setOf(
      "br",
      "hr",
      "img",
      "input",
      "meta",
      "link",
      "area",
      "base",
      "col",
      "embed",
      "source",
      "track",
      "wbr"
    )
  }

  private fun tokenize(html: String): List<Token> {
    val tokens = mutableListOf<Token>()
    val chars = html.toCharArray()
    val len = chars.size
    var i = 0

    while (i < len) {
      if (chars[i] == '<') {
        // Check for comment <!-- ... -->
        if (i + 3 < len && chars[i + 1] == '!' && chars[i + 2] == '-' && chars[i + 3] == '-') {
          val endIdx = findCommentEnd(chars, i + 4)
          if (endIdx != null) {
            i = endIdx
            continue
          }
        }

        val tagStart = i
        i++

        // Skip whitespace after <
        while (i < len && chars[i].isWhitespace()) i++

        val isClosing = i < len && chars[i] == '/'
        if (isClosing) i++

        // Parse tag name
        val nameStart = i
        while (i < len && chars[i] != '>' && chars[i] != '/' && !chars[i].isWhitespace()) {
          i++
        }
        val tagName = String(chars, nameStart, i - nameStart).lowercase()

        if (tagName.isEmpty()) {
          tokens.add(Token.Text(chars[tagStart].toString()))
          i = tagStart + 1
          continue
        }

        if (isClosing) {
          while (i < len && chars[i] != '>') i++
          if (i < len) i++
          tokens.add(Token.CloseTag(tagName))
          continue
        }

        // Parse attributes
        val attributes = mutableMapOf<String, String>()
        while (i < len && chars[i] != '>' && chars[i] != '/') {
          while (i < len && chars[i].isWhitespace()) i++
          if (i >= len || chars[i] == '>' || chars[i] == '/') break

          // Attribute name
          val attrNameStart = i
          while (i < len && chars[i] != '=' && chars[i] != '>' && chars[i] != '/' && !chars[i].isWhitespace()) {
            i++
          }
          val attrName = String(chars, attrNameStart, i - attrNameStart).lowercase()
          if (attrName.isEmpty()) break

          while (i < len && chars[i].isWhitespace()) i++

          var attrValue = ""
          if (i < len && chars[i] == '=') {
            i++
            while (i < len && chars[i].isWhitespace()) i++

            if (i < len && (chars[i] == '"' || chars[i] == '\'')) {
              val quote = chars[i]
              i++
              val valStart = i
              while (i < len && chars[i] != quote) i++
              attrValue = String(chars, valStart, i - valStart)
              if (i < len) i++
            } else {
              val valStart = i
              while (i < len && !chars[i].isWhitespace() && chars[i] != '>' && chars[i] != '/') {
                i++
              }
              attrValue = String(chars, valStart, i - valStart)
            }
          }

          attributes[attrName] = attrValue
        }

        var selfClosing = false
        if (i < len && chars[i] == '/') {
          selfClosing = true
          i++
        }
        if (i < len && chars[i] == '>') i++

        if (tagName in VOID_ELEMENTS) {
          selfClosing = true
        }

        tokens.add(Token.OpenTag(tagName, attributes, selfClosing))
      } else {
        // Text content
        val textStart = i
        while (i < len && chars[i] != '<') i++
        val text = decodeEntities(String(chars, textStart, i - textStart))
        if (text.isNotEmpty()) {
          tokens.add(Token.Text(text))
        }
      }
    }

    return tokens
  }

  private fun findCommentEnd(chars: CharArray, start: Int): Int? {
    var i = start
    val len = chars.size
    while (i + 2 < len) {
      if (chars[i] == '-' && chars[i + 1] == '-' && chars[i + 2] == '>') {
        return i + 3
      }
      i++
    }
    return null
  }

  // endregion

  // region Tree Builder

  private fun buildTree(tokens: List<Token>): List<Node> {
    val roots = mutableListOf<Node>()
    val stack = mutableListOf<Pair<String, Node>>()

    for (token in tokens) {
      when (token) {
        is Token.OpenTag -> {
          val node = createElement(token.name, token.attributes)

          val parent = stack.lastOrNull()
          if (parent != null) {
            parent.second.appendChild(node)
          } else {
            roots.add(node)
          }

          if (!token.selfClosing) {
            stack.add(token.name to node)
          }
        }

        is Token.CloseTag -> {
          while (stack.isNotEmpty()) {
            if (stack.last().first == token.name) {
              stack.removeAt(stack.lastIndex)
              break
            }
            stack.removeAt(stack.lastIndex)
          }
        }

        is Token.Text -> {
          val text = token.content
          if (text.isEmpty()) continue

          val parent = stack.lastOrNull()
          if (parent != null) {
            val textNode = TextNode(mason, text)
            parent.second.appendChild(textNode)
          } else {
            // Top-level text — wrap in a text container
            val textView = mason.createTextView(context, TextType.Span)
            val textNode = TextNode(mason, text)
            textView.node.appendChild(textNode)
            roots.add(textView.node)
          }
        }
      }
    }

    return roots
  }

  // endregion

  // region Element Factory

  private fun createElement(name: String, attributes: Map<String, String>): Node {
    val element: Element = when (name) {
      // Container elements
      "div", "section", "header", "footer", "article", "main", "nav", "aside" ->
        mason.createView(context)

      // Text elements
      "p" -> mason.createTextView(context, TextType.P)
      "span" -> mason.createTextView(context, TextType.Span)
      "code" -> mason.createTextView(context, TextType.Code)
      "pre" -> mason.createTextView(context, TextType.Pre)
      "h1" -> mason.createTextView(context, TextType.H1)
      "h2" -> mason.createTextView(context, TextType.H2)
      "h3" -> mason.createTextView(context, TextType.H3)
      "h4" -> mason.createTextView(context, TextType.H4)
      "h5" -> mason.createTextView(context, TextType.H5)
      "h6" -> mason.createTextView(context, TextType.H6)
      "b" -> mason.createTextView(context, TextType.B)
      "strong" -> mason.createTextView(context, TextType.Strong)
      "em" -> mason.createTextView(context, TextType.Em)
      "i" -> mason.createTextView(context, TextType.I)
      "a" -> mason.createTextView(context, TextType.A)
      "blockquote" -> mason.createTextView(context, TextType.Blockquote)

      // List elements
      "ul" -> mason.createListView(context, isOrdered = false)
      "ol" -> mason.createListView(context, isOrdered = true)
      "li" -> mason.createListItem(context)

      // Self-closing / special elements
      "br" -> mason.createBr(context)

      "img" -> {
        val img = mason.createImageView(context)
        attributes["src"]?.let { img.src = it }
        applyAttributes(attributes, img)
        return img.node
      }

      // Scroll
      "scroll" -> mason.createScrollView(context)

      // Input
      "input" -> {
        val inputType = mapInputType(attributes["type"])
        mason.createInput(context, inputType)
      }

      // Button
      "button" -> mason.createButton(context)

      // Unknown tags become generic views
      else -> mason.createView(context)
    }

    applyAttributes(attributes, element)
    return element.node
  }

  // endregion

  // region Attribute Application

  private fun applyAttributes(attributes: Map<String, String>, element: Element) {
    for ((key, value) in attributes) {
      when (key) {
        "style" -> applyInlineStyle(value, element)
        "src" -> {
          if (element is Img) {
            element.src = value
          }
        }
      }
    }
  }

  // endregion

  // region Inline Style Parsing

  private fun applyInlineStyle(styleString: String, element: Element) {
    val declarations = styleString.split(";")
    element.configure { style ->
      for (declaration in declarations) {
        val parts = declaration.split(":", limit = 2)
        if (parts.size != 2) continue
        val property = parts[0].trim().lowercase()
        val value = parts[1].trim()
        applyStyleProperty(property, value, style)
      }
    }
  }

  private fun applyStyleProperty(property: String, value: String, style: Style) {
    when (property) {
      "display" -> when (value) {
        "flex" -> style.display = Display.Flex
        "grid" -> style.display = Display.Grid
        "block" -> style.display = Display.Block
        "inline" -> style.display = Display.Inline
        "none" -> style.display = Display.None
      }

      "flex-direction" -> when (value) {
        "row" -> style.flexDirection = FlexDirection.Row
        "column" -> style.flexDirection = FlexDirection.Column
        "row-reverse" -> style.flexDirection = FlexDirection.RowReverse
        "column-reverse" -> style.flexDirection = FlexDirection.ColumnReverse
      }

      "justify-content" -> when (value) {
        "flex-start", "start" -> style.justifyContent = JustifyContent.Start
        "flex-end", "end" -> style.justifyContent = JustifyContent.End
        "center" -> style.justifyContent = JustifyContent.Center
        "space-between" -> style.justifyContent = JustifyContent.SpaceBetween
        "space-around" -> style.justifyContent = JustifyContent.SpaceAround
        "space-evenly" -> style.justifyContent = JustifyContent.SpaceEvenly
      }

      "align-items" -> when (value) {
        "flex-start", "start" -> style.alignItems = AlignItems.Start
        "flex-end", "end" -> style.alignItems = AlignItems.End
        "center" -> style.alignItems = AlignItems.Center
        "stretch" -> style.alignItems = AlignItems.Stretch
        "baseline" -> style.alignItems = AlignItems.Baseline
      }

      "align-self" -> when (value) {
        "flex-start", "start" -> style.alignSelf = AlignSelf.Start
        "flex-end", "end" -> style.alignSelf = AlignSelf.End
        "center" -> style.alignSelf = AlignSelf.Center
        "stretch" -> style.alignSelf = AlignSelf.Stretch
        "baseline" -> style.alignSelf = AlignSelf.Baseline
      }

      "flex-wrap" -> when (value) {
        "nowrap" -> style.flexWrap = FlexWrap.NoWrap
        "wrap" -> style.flexWrap = FlexWrap.Wrap
        "wrap-reverse" -> style.flexWrap = FlexWrap.WrapReverse
      }

      "flex-grow" -> value.toFloatOrNull()?.let { style.flexGrow = it }

      "flex-shrink" -> value.toFloatOrNull()?.let { style.flexShrink = it }

      "gap" -> parseLengthPercentage(value)?.let { v ->
        style.gap = Size(v, v)
      }

      "color" -> parseColor(value)?.let { style.color = it }

      "background-color" -> parseColor(value)?.let { style.backgroundColor = it }

      "font-size" -> parseFloatValue(value)?.let { style.fontSize = it.toInt() }

      "font-weight" -> when (value) {
        "bold", "700" -> style.fontWeight = FontFace.NSCFontWeight.Bold
        "normal", "400" -> style.fontWeight = FontFace.NSCFontWeight.Normal
        "100", "thin" -> style.fontWeight = FontFace.NSCFontWeight.Thin
        "200" -> style.fontWeight = FontFace.NSCFontWeight.ExtraLight
        "300", "light" -> style.fontWeight = FontFace.NSCFontWeight.Light
        "500", "medium" -> style.fontWeight = FontFace.NSCFontWeight.Medium
        "600", "semibold" -> style.fontWeight = FontFace.NSCFontWeight.SemiBold
        "800" -> style.fontWeight = FontFace.NSCFontWeight.ExtraBold
        "900", "black" -> style.fontWeight = FontFace.NSCFontWeight.Black
      }

      "width" -> parseDimension(value)?.let { d ->
        val current = style.size
        style.size = Size(d, current.height)
      }

      "height" -> parseDimension(value)?.let { d ->
        val current = style.size
        style.size = Size(current.width, d)
      }

      "min-width" -> parseDimension(value)?.let { style.minWidth = it }
      "min-height" -> parseDimension(value)?.let { style.minHeight = it }
      "max-width" -> parseDimension(value)?.let { style.maxWidth = it }
      "max-height" -> parseDimension(value)?.let { style.maxHeight = it }

      "padding" -> parseLengthPercentage(value)?.let { v ->
        style.padding = Rect(v, v, v, v)
      }

      "padding-left" -> parseLengthPercentage(value)?.let { v ->
        val current = style.padding
        style.padding = Rect(current.top, current.right, current.bottom, v)
      }

      "padding-right" -> parseLengthPercentage(value)?.let { v ->
        val current = style.padding
        style.padding = Rect(current.top, v, current.bottom, current.left)
      }

      "padding-top" -> parseLengthPercentage(value)?.let { v ->
        val current = style.padding
        style.padding = Rect(v, current.right, current.bottom, current.left)
      }

      "padding-bottom" -> parseLengthPercentage(value)?.let { v ->
        val current = style.padding
        style.padding = Rect(current.top, current.right, v, current.left)
      }

      "margin" -> parseLengthPercentageAuto(value)?.let { v ->
        style.margin = Rect(v, v, v, v)
      }

      "margin-left" -> parseLengthPercentageAuto(value)?.let { style.marginLeft = it }
      "margin-right" -> parseLengthPercentageAuto(value)?.let { style.marginRight = it }
      "margin-top" -> parseLengthPercentageAuto(value)?.let { style.marginTop = it }
      "margin-bottom" -> parseLengthPercentageAuto(value)?.let { style.marginBottom = it }

      "position" -> when (value) {
        "relative" -> style.position = Position.Relative
        "absolute" -> style.position = Position.Absolute
      }

      "overflow" -> when (value) {
        "visible" -> style.overflow = Point(Overflow.Visible, Overflow.Visible)
        "hidden" -> style.overflow = Point(Overflow.Hidden, Overflow.Hidden)
        "scroll" -> style.overflow = Point(Overflow.Scroll, Overflow.Scroll)
        "clip" -> style.overflow = Point(Overflow.Clip, Overflow.Clip)
        "auto" -> style.overflow = Point(Overflow.Auto, Overflow.Auto)
      }

      "text-align" -> when (value) {
        "left" -> style.textAlign = TextAlign.Left
        "center" -> style.textAlign = TextAlign.Center
        "right" -> style.textAlign = TextAlign.Right
        "justify" -> style.textAlign = TextAlign.Justify
      }
    }
  }

  // endregion

  // region Value Parsers

  private fun parseLengthPercentage(value: String): LengthPercentage? {
    return when {
      value.endsWith("%") -> value.dropLast(1).toFloatOrNull()?.let { LengthPercentage.Percent(it) }
      value.endsWith("px") -> value.dropLast(2).toFloatOrNull()?.let { LengthPercentage.Points(it) }
      else -> value.toFloatOrNull()?.let { LengthPercentage.Points(it) }
    }
  }

  private fun parseLengthPercentageAuto(value: String): LengthPercentageAuto? {
    if (value == "auto") return LengthPercentageAuto.Auto
    return when {
      value.endsWith("%") -> value.dropLast(1).toFloatOrNull()
        ?.let { LengthPercentageAuto.Percent(it) }

      value.endsWith("px") -> value.dropLast(2).toFloatOrNull()
        ?.let { LengthPercentageAuto.Points(it) }

      else -> value.toFloatOrNull()?.let { LengthPercentageAuto.Points(it) }
    }
  }

  private fun parseDimension(value: String): Dimension? {
    if (value == "auto") return Dimension.Auto
    return when {
      value.endsWith("%") -> value.dropLast(1).toFloatOrNull()?.let { Dimension.Percent(it) }
      value.endsWith("px") -> value.dropLast(2).toFloatOrNull()?.let { Dimension.Points(it) }
      else -> value.toFloatOrNull()?.let { Dimension.Points(it) }
    }
  }

  private fun parseFloatValue(value: String): Float? {
    return when {
      value.endsWith("px") -> value.dropLast(2).toFloatOrNull()
      value.endsWith("pt") -> value.dropLast(2).toFloatOrNull()
      value.endsWith("em") -> value.dropLast(2).toFloatOrNull()?.let { it * 16f }
      value.endsWith("rem") -> value.dropLast(3).toFloatOrNull()?.let { it * 16f }
      else -> value.toFloatOrNull()
    }
  }

  private fun parseColor(value: String): Int? {
    val trimmed = value.trim()
    if (trimmed.startsWith("#")) {
      val hex = trimmed.substring(1)
      return when (hex.length) {
        3 -> {
          // #RGB -> #RRGGBB
          val r = hex[0].digitToInt(16)
          val g = hex[1].digitToInt(16)
          val b = hex[2].digitToInt(16)
          (0xFF shl 24) or (r * 0x11 shl 16) or (g * 0x11 shl 8) or (b * 0x11)
        }

        6 -> {
          val rgb = hex.toLongOrNull(16) ?: return null
          (0xFF000000 or rgb).toInt()
        }

        8 -> {
          // #RRGGBBAA
          val rgba = hex.toLongOrNull(16) ?: return null
          val r = (rgba shr 24) and 0xFF
          val g = (rgba shr 16) and 0xFF
          val b = (rgba shr 8) and 0xFF
          val a = rgba and 0xFF
          ((a shl 24) or (r shl 16) or (g shl 8) or b).toInt()
        }

        else -> null
      }
    }
    return namedColor(trimmed)
  }

  private fun namedColor(name: String): Int? {
    return when (name.lowercase()) {
      "black" -> 0xFF000000.toInt()
      "white" -> 0xFFFFFFFF.toInt()
      "red" -> 0xFFFF0000.toInt()
      "green" -> 0xFF008000.toInt()
      "blue" -> 0xFF0000FF.toInt()
      "yellow" -> 0xFFFFFF00.toInt()
      "cyan" -> 0xFF00FFFF.toInt()
      "magenta" -> 0xFFFF00FF.toInt()
      "gray", "grey" -> 0xFF808080.toInt()
      "orange" -> 0xFFFFA500.toInt()
      "purple" -> 0xFF800080.toInt()
      "transparent" -> 0x00000000
      else -> null
    }
  }

  // endregion

  // region Input Type Mapping

  private fun mapInputType(type: String?): Input.Type {
    return when (type?.lowercase()) {
      "text" -> Input.Type.Text
      "password" -> Input.Type.Password
      "email" -> Input.Type.Email
      "number" -> Input.Type.Number
      "tel", "telephone" -> Input.Type.Tel
      "url" -> Input.Type.Url
      "date" -> Input.Type.Date
      "color" -> Input.Type.Color
      "checkbox" -> Input.Type.Checkbox
      "radio" -> Input.Type.Radio
      "range" -> Input.Type.Range
      "file" -> Input.Type.File
      "submit" -> Input.Type.Submit
      "button" -> Input.Type.Button
      else -> Input.Type.Text
    }
  }

  // endregion

  // region HTML Entity Decoding

  private fun decodeEntities(text: String): String {
    var result = text
    result = result.replace("&amp;", "&")
    result = result.replace("&lt;", "<")
    result = result.replace("&gt;", ">")
    result = result.replace("&quot;", "\"")
    result = result.replace("&#39;", "'")
    result = result.replace("&apos;", "'")
    result = result.replace("&nbsp;", "\u00A0")
    result = decodeNumericEntities(result)
    return result
  }

  private fun decodeNumericEntities(text: String): String {
    val sb = StringBuilder()
    val chars = text.toCharArray()
    val len = chars.size
    var i = 0

    while (i < len) {
      if (chars[i] == '&' && i + 2 < len && chars[i + 1] == '#') {
        var j = i + 2
        val isHex = j < len && (chars[j] == 'x' || chars[j] == 'X')
        if (isHex) j++

        val numStart = j
        while (j < len && chars[j] != ';') j++

        if (j < len && j > numStart) {
          val numStr = String(chars, numStart, j - numStart)
          val codePoint = if (isHex) {
            numStr.toIntOrNull(16)
          } else {
            numStr.toIntOrNull()
          }

          if (codePoint != null && Character.isValidCodePoint(codePoint)) {
            sb.appendCodePoint(codePoint)
            i = j + 1
            continue
          }
        }
      }
      sb.append(chars[i])
      i++
    }

    return sb.toString()
  }

  // endregion
}
