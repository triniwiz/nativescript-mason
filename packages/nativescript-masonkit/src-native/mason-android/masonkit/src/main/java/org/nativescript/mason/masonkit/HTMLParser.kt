package org.nativescript.mason.masonkit

import android.content.Context
import android.os.Build
import android.view.ViewGroup
import org.nativescript.fontmanager.FontStyle
import org.nativescript.fontmanager.FontWeight
import org.nativescript.mason.masonkit.enums.AlignContent
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.enums.BoxSizing
import org.nativescript.mason.masonkit.enums.Clear
import org.nativescript.mason.masonkit.enums.Direction
import org.nativescript.mason.masonkit.enums.Display
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
    // `innerHTML =` replaces content rather than appending to it.
    element.node.removeChildren()
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
    // Single shared splitter reused for every space-delimited shorthand
    // (gap, inset, flex, grid-auto-flow, text-decoration, …).
    private val WHITESPACE = Regex("\\s+")

    /**
     * Elements whose content is raw text rather than markup. Their body has to be
     * consumed verbatim up to the matching close tag.
     */
    private val RAW_TEXT_ELEMENTS = setOf("style", "script", "textarea", "title")

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

        // `<!doctype html>`, `<?xml ...?>` and `<![CDATA[...]]>` are not tags;
        // skip them here rather than parsing them as a generic tag.
        if (i + 1 < len && (chars[i + 1] == '!' || chars[i + 1] == '?')) {
          var j = i + 2
          while (j < len && chars[j] != '>') j++
          i = if (j < len) j + 1 else len
          continue
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

        // <style>, <script>, <textarea> and <title> hold raw text, not markup:
        // their body must be consumed verbatim instead of tokenized as tags.
        if (!selfClosing && tagName in RAW_TEXT_ELEMENTS) {
          tokens.add(Token.OpenTag(tagName, attributes, false))
          val closing = "</$tagName"
          val bodyStart = i
          var j = i
          var found = -1
          while (j <= len - closing.length) {
            if (String(chars, j, closing.length).lowercase() == closing) {
              found = j
              break
            }
            j++
          }
          val bodyEnd = if (found >= 0) found else len
          if (bodyEnd > bodyStart) {
            tokens.add(Token.Text(String(chars, bodyStart, bodyEnd - bodyStart)))
          }
          i = bodyEnd
          if (found >= 0) {
            while (i < len && chars[i] != '>') i++
            if (i < len) i++
            tokens.add(Token.CloseTag(tagName))
          }
          continue
        }

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
          val parentIsRawText = stack.lastOrNull()?.first in RAW_TEXT_ELEMENTS
          // Outside a raw-text element, HTML collapses whitespace runs to a
          // single space and drops whitespace-only text nodes.
          val text = if (parentIsRawText) token.content else collapseWhitespace(token.content)
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

  /**
   * The browser UA default for `<ul>`/`<ol>`: `margin: 1em 0` and a
   * `padding-inline-start: 40px` gutter, which is what reserves the space
   * `ListMarkers` draws each bullet into. Mirrors `applyListUaDefaults` in
   * web.ts so markup and JSX produce the same box.
   */
  /**
   * Collapse whitespace the way HTML does outside a `white-space: pre` context:
   * every run of whitespace becomes one space, and a run that is *only*
   * whitespace disappears. Leading and trailing spaces around markup are kept as
   * a single space, because `a <b>b</b>` needs the gap.
   */
  private fun collapseWhitespace(text: String): String {
    if (text.isEmpty()) return text
    if (text.isBlank()) return ""
    val collapsed = StringBuilder(text.length)
    var inWhitespace = false
    for (ch in text) {
      if (ch.isWhitespace()) {
        inWhitespace = true
      } else {
        if (inWhitespace && collapsed.isNotEmpty()) collapsed.append(' ')
        else if (inWhitespace && collapsed.isEmpty()) collapsed.append(' ')
        inWhitespace = false
        collapsed.append(ch)
      }
    }
    if (inWhitespace) collapsed.append(' ')
    return collapsed.toString()
  }

  private fun applyListUaDefaults(view: org.nativescript.mason.masonkit.View, ordered: Boolean) {
    val scale = Mason.shared.scale
    view.node.style.also { style ->
      val vertical = LengthPercentageAuto.Points(16f * scale)
      val margin = style.margin
      style.margin = Rect(top = vertical, right = margin.right, bottom = vertical, left = margin.left)
      val padding = style.padding
      style.padding = Rect(
        top = padding.top,
        right = padding.right,
        bottom = padding.bottom,
        left = LengthPercentage.Points(40f * scale),
      )
      style.listStyleType = if (ordered) ListStyleType.Decimal else ListStyleType.Disc
    }
  }

  private fun createElement(name: String, attributes: Map<String, String>): Node {
    val element: Element = when (name) {
      // Container / block-level elements
      "div", "section", "header", "footer", "article", "main", "nav", "aside",
      "figure", "figcaption", "address", "details", "summary", "hgroup",
      "dl", "dt", "dd", "form", "fieldset", "picture", "hr" ->
        mason.createView(context)

      // Text elements
      "p" -> mason.createTextView(context, TextType.P)
      // Inline / phrasing text elements share an inline (span) box so they flow
      // within the surrounding line instead of breaking it.
      "span", "small", "mark", "sub", "sup", "u", "s", "strike", "del", "ins",
      "abbr", "cite", "q", "dfn", "kbd", "samp", "var", "time", "output",
      "data", "bdi", "bdo", "big", "tt", "label", "ruby", "wbr" ->
        mason.createTextView(context, TextType.Span)
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

      // List elements. Plain containers whose `<li>` children are TextType.Li
      // text views — the only arrangement `ListMarkers` can draw a bullet for.
      // `createListView`/`createListItem` build the data-bound RecyclerView
      // widget instead, which draws nothing for static markup.
      "ul" -> mason.createView(context).also { applyListUaDefaults(it, ordered = false) }
      "ol" -> mason.createView(context).also { applyListUaDefaults(it, ordered = true) }
      "li" -> mason.createTextView(context, TextType.Li)

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

      // Multi-line text input
      "textarea" -> mason.createTextArea(context)

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
        // `class` and `id` are recorded but do NOT drive the CSS cascade: these
        // are native views with mason nodes, not NativeScript ViewBase instances,
        // so NativeScript's selector engine never sees them. Kept so an app can
        // find and style a parsed subtree itself.
        "class" -> element.node.htmlAttributes["class"] = value
        "id" -> element.node.htmlAttributes["id"] = value
        "href" -> element.node.htmlAttributes["href"] = value
        "alt", "title" -> element.node.htmlAttributes[key] = value
        "width" -> parseDimension(value)?.let { d ->
          element.configure { style ->
            val current = style.size
            style.size = Size(d, current.height)
          }
        }
        "height" -> parseDimension(value)?.let { d ->
          element.configure { style ->
            val current = style.size
            style.size = Size(current.width, d)
          }
        }
        "value" -> {
          when (element) {
            is Input -> element.value = value
            is TextArea -> element.value = value
            else -> {}
          }
        }
        "placeholder" -> {
          when (element) {
            is Input -> element.placeholder = value
            is TextArea -> element.placeholder = value
            else -> {}
          }
        }
        "disabled" -> {
          // A boolean attribute is true whenever present, whatever its value.
          element.view.isEnabled = false
        }
      }
    }
  }

  // endregion

  // region Inline Style Parsing

  /**
   * Split an inline `style` attribute into (property, value) pairs.
   *
   * Splits on `;` and `:` while ignoring both inside parentheses or quotes,
   * so values like `url(data:image/png;base64,...)` and `"A;B"` stay intact.
   */
  private fun splitDeclarations(styleString: String): List<Pair<String, String>> {
    val out = mutableListOf<Pair<String, String>>()
    for (declaration in splitTopLevel(styleString, ';')) {
      if (declaration.isBlank()) continue
      val colon = indexOfTopLevel(declaration, ':')
      if (colon <= 0) continue
      val property = declaration.substring(0, colon).trim().lowercase()
      val value = declaration.substring(colon + 1).trim()
      if (property.isNotEmpty() && value.isNotEmpty()) {
        out.add(property to value)
      }
    }
    return out
  }

  /** Split on [separator], ignoring occurrences inside quotes or parentheses. */
  private fun splitTopLevel(input: String, separator: Char): List<String> {
    val out = mutableListOf<String>()
    val current = StringBuilder()
    var depth = 0
    var quote: Char? = null
    for (ch in input) {
      when {
        quote != null -> {
          if (ch == quote) quote = null
          current.append(ch)
        }
        ch == '"' || ch == '\'' -> {
          quote = ch
          current.append(ch)
        }
        ch == '(' -> {
          depth++
          current.append(ch)
        }
        ch == ')' -> {
          if (depth > 0) depth--
          current.append(ch)
        }
        ch == separator && depth == 0 -> {
          out.add(current.toString())
          current.setLength(0)
        }
        else -> current.append(ch)
      }
    }
    out.add(current.toString())
    return out
  }

  /** Index of the first [target] outside quotes and parentheses, or -1. */
  private fun indexOfTopLevel(input: String, target: Char): Int {
    var depth = 0
    var quote: Char? = null
    for ((index, ch) in input.withIndex()) {
      when {
        quote != null -> if (ch == quote) quote = null
        ch == '"' || ch == '\'' -> quote = ch
        ch == '(' -> depth++
        ch == ')' -> if (depth > 0) depth--
        ch == target && depth == 0 -> return index
      }
    }
    return -1
  }

  private fun applyInlineStyle(styleString: String, element: Element) {
    val declarations = splitDeclarations(styleString)
    element.configure { style ->
      for ((property, value) in declarations) {
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
        "inline-block" -> style.display = Display.InlineBlock
        "inline-flex" -> style.display = Display.InlineFlex
        "inline-grid" -> style.display = Display.InlineGrid
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

      "gap" -> {
        // `gap` accepts one value (both axes) or two (`row-gap column-gap`).
        val gapTokens = value.split(WHITESPACE).filter { it.isNotEmpty() }
        if (gapTokens.size >= 2) {
          val row = parseLengthPercentage(gapTokens[0])
          val column = parseLengthPercentage(gapTokens[1])
          if (row != null && column != null) style.gap = Size(row, column)
        } else {
          parseLengthPercentage(value)?.let { v -> style.gap = Size(v, v) }
        }
      }

      "row-gap" -> parseLengthPercentage(value)?.let { v ->
        style.gap = Size(v, style.gap.height)
      }
      "column-gap" -> parseLengthPercentage(value)?.let { v ->
        style.gap = Size(style.gap.width, v)
      }

      "color" -> style.setColor(value)

      "background-color" -> style.setBackgroundColor(value)

      "font-size" -> parseFloatValue(value)?.let { style.fontSize = it.toInt() }

      "font-weight" -> when (value) {
        "bold", "700" -> style.fontWeight = FontWeight.Bold
        "normal", "400" -> style.fontWeight = FontWeight.Normal
        "100", "thin" -> style.fontWeight = FontWeight.Thin
        "200" -> style.fontWeight = FontWeight.ExtraLight
        "300", "light" -> style.fontWeight = FontWeight.Light
        "500", "medium" -> style.fontWeight = FontWeight.Medium
        "600", "semibold" -> style.fontWeight = FontWeight.SemiBold
        "800" -> style.fontWeight = FontWeight.ExtraBold
        "900", "black" -> style.fontWeight = FontWeight.Black
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

      "border" -> parseBorderShorthand(style, value)

      "border-left" -> parseBorderSideShorthand(style, Border.Side.Left, value)

      "border-right" -> parseBorderSideShorthand(style, Border.Side.Right, value)

      "border-top" -> parseBorderSideShorthand(style, Border.Side.Top, value)

      "border-bottom" -> parseBorderSideShorthand(style, Border.Side.Bottom, value)

      "border-radius" -> style.borderRadius = value

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

      "overflow" -> parseOverflow(value)?.let { style.overflow = Point(it, it) }
      "overflow-x" -> parseOverflow(value)?.let { style.overflowX = it }
      "overflow-y" -> parseOverflow(value)?.let { style.overflowY = it }

      "text-align" -> when (value) {
        "left" -> style.textAlign = TextAlign.Left
        "center" -> style.textAlign = TextAlign.Center
        "right" -> style.textAlign = TextAlign.Right
        "justify" -> style.textAlign = TextAlign.Justify
        "start" -> style.textAlign = TextAlign.Start
        "end" -> style.textAlign = TextAlign.End
      }

      // region Additional flex / grid alignment

      "align-content" -> when (value) {
        "flex-start", "start" -> style.alignContent = AlignContent.Start
        "flex-end", "end" -> style.alignContent = AlignContent.End
        "center" -> style.alignContent = AlignContent.Center
        "stretch" -> style.alignContent = AlignContent.Stretch
        "space-between" -> style.alignContent = AlignContent.SpaceBetween
        "space-around" -> style.alignContent = AlignContent.SpaceAround
        "space-evenly" -> style.alignContent = AlignContent.SpaceEvenly
        "normal" -> style.alignContent = AlignContent.Normal
      }

      "justify-items" -> when (value) {
        "flex-start", "start" -> style.justifyItems = JustifyItems.Start
        "flex-end", "end" -> style.justifyItems = JustifyItems.End
        "center" -> style.justifyItems = JustifyItems.Center
        "stretch" -> style.justifyItems = JustifyItems.Stretch
        "baseline" -> style.justifyItems = JustifyItems.Baseline
        "normal" -> style.justifyItems = JustifyItems.Normal
      }

      "justify-self" -> when (value) {
        "flex-start", "start" -> style.justifySelf = JustifySelf.Start
        "flex-end", "end" -> style.justifySelf = JustifySelf.End
        "center" -> style.justifySelf = JustifySelf.Center
        "stretch" -> style.justifySelf = JustifySelf.Stretch
        "baseline" -> style.justifySelf = JustifySelf.Baseline
        "normal" -> style.justifySelf = JustifySelf.Normal
      }

      "flex" -> applyFlexShorthand(value, style)
      "flex-basis" -> parseDimension(value)?.let { style.flexBasis = it }

      // endregion

      // region Positioning

      "inset" -> applyInsetShorthand(value, style)
      "top" -> parseLengthPercentageAuto(value)?.let { v ->
        val c = style.inset
        style.inset = Rect(v, c.right, c.bottom, c.left)
      }
      "right" -> parseLengthPercentageAuto(value)?.let { v ->
        val c = style.inset
        style.inset = Rect(c.top, v, c.bottom, c.left)
      }
      "bottom" -> parseLengthPercentageAuto(value)?.let { v ->
        val c = style.inset
        style.inset = Rect(c.top, c.right, v, c.left)
      }
      "left" -> parseLengthPercentageAuto(value)?.let { v ->
        val c = style.inset
        style.inset = Rect(c.top, c.right, c.bottom, v)
      }

      "aspect-ratio" -> style.aspectRatio = parseAspectRatio(value)

      "box-sizing" -> when (value) {
        "border-box" -> style.boxSizing = BoxSizing.BorderBox
        "content-box" -> style.boxSizing = BoxSizing.ContentBox
      }

      "direction" -> when (value) {
        "ltr" -> style.direction = Direction.LTR
        "rtl" -> style.direction = Direction.RTL
        "inherit" -> style.direction = Direction.Inherit
      }

      // endregion

      // region Grid

      "grid-template-columns" -> style.gridTemplateColumns = value
      "grid-template-rows" -> style.gridTemplateRows = value
      "grid-template-areas" -> style.gridTemplateAreas = value
      "grid-auto-rows" -> style.gridAutoRows = value
      "grid-auto-columns" -> style.gridAutoColumns = value
      "grid-auto-flow" -> when (value) {
        "row" -> style.gridAutoFlow = GridAutoFlow.Row
        "column" -> style.gridAutoFlow = GridAutoFlow.Column
        "row dense", "dense row", "dense" -> style.gridAutoFlow = GridAutoFlow.RowDense
        "column dense", "dense column" -> style.gridAutoFlow = GridAutoFlow.ColumnDense
      }
      "grid-column" -> style.gridColumn = value
      "grid-row" -> style.gridRow = value
      "grid-area" -> style.gridArea = value
      "grid-column-start" -> style.gridColumnStart = value
      "grid-column-end" -> style.gridColumnEnd = value
      "grid-row-start" -> style.gridRowStart = value
      "grid-row-end" -> style.gridRowEnd = value

      // endregion

      // region Visual (pass-through CSS string parsers)

      "corner-shape" -> style.cornerShape = value
      "box-shadow" -> style.boxShadow = value
      "text-shadow" -> style.textShadow = value
      "filter" -> style.filter = value
      "backdrop-filter" -> style.backdropFilter = value
      "transform" -> style.transform = value
      "background" -> style.background = value
      "background-image" -> style.backgroundImage = value
      "background-repeat" -> style.backgroundRepeat = value
      "background-position" -> style.backgroundPosition = value
      "background-size" -> style.backgroundSize = value

      "z-index" -> value.toIntOrNull()?.let { style.zIndex = it }

      "float" -> when (value) {
        "none" -> style.float = org.nativescript.mason.masonkit.enums.Float.None
        "left" -> style.float = org.nativescript.mason.masonkit.enums.Float.Left
        "right" -> style.float = org.nativescript.mason.masonkit.enums.Float.Right
      }

      "clear" -> when (value) {
        "none" -> style.clear = Clear.None
        "left" -> style.clear = Clear.Left
        "right" -> style.clear = Clear.Right
        "both" -> style.clear = Clear.Both
      }

      "object-fit" -> when (value) {
        "fill" -> style.objectFit = ObjectFit.Fill
        "contain" -> style.objectFit = ObjectFit.Contain
        "cover" -> style.objectFit = ObjectFit.Cover
        "none" -> style.objectFit = ObjectFit.None
        "scale-down" -> style.objectFit = ObjectFit.ScaleDown
      }

      "list-style-type" -> when (value) {
        "none" -> style.listStyleType = ListStyleType.None
        "disc" -> style.listStyleType = ListStyleType.Disc
        "circle" -> style.listStyleType = ListStyleType.Circle
        "square" -> style.listStyleType = ListStyleType.Square
        "decimal" -> style.listStyleType = ListStyleType.Decimal
      }
      "list-style-position" -> when (value) {
        "inside" -> style.listStylePosition = ListStylePosition.Inside
        "outside" -> style.listStylePosition = ListStylePosition.Outside
      }

      // endregion

      // region Text / font

      "font-family" -> style.fontFamily = value
      "font-style" -> when (value) {
        "italic" -> style.fontStyle = FontStyle.Italic
        "oblique" -> style.fontStyle = FontStyle.Oblique()
        "normal" -> style.fontStyle = FontStyle.Normal
      }
      "line-height" -> if (value != "normal") parseFloatValue(value)?.let { style.lineHeight = it }
      "letter-spacing" -> if (value == "normal") {
        style.letterSpacing = 0f
      } else {
        parseFloatValue(value)?.let { style.letterSpacing = it }
      }
      "font-variant-numeric" -> style.fontVariantNumericString = value

      "text-decoration", "text-decoration-line" -> when (firstToken(value)) {
        "none" -> style.decorationLine = Styles.DecorationLine.None
        "underline" -> style.decorationLine = Styles.DecorationLine.Underline
        "overline" -> style.decorationLine = Styles.DecorationLine.Overline
        "line-through" -> style.decorationLine = Styles.DecorationLine.LineThrough
      }
      "text-decoration-color" -> parseColor(value)?.let { style.decorationColor = it }
      "text-decoration-style" -> when (value) {
        "solid" -> style.decorationStyle = Styles.DecorationStyle.Solid
        "double" -> style.decorationStyle = Styles.DecorationStyle.Double
        "dotted" -> style.decorationStyle = Styles.DecorationStyle.Dotted
        "dashed" -> style.decorationStyle = Styles.DecorationStyle.Dashed
        "wavy" -> style.decorationStyle = Styles.DecorationStyle.Wavy
      }

      "text-transform" -> when (value) {
        "none" -> style.textTransform = Styles.TextTransform.None
        "capitalize" -> style.textTransform = Styles.TextTransform.Capitalize
        "uppercase" -> style.textTransform = Styles.TextTransform.Uppercase
        "lowercase" -> style.textTransform = Styles.TextTransform.Lowercase
      }

      "white-space" -> when (value) {
        "normal" -> style.whiteSpace = Styles.WhiteSpace.Normal
        "pre" -> style.whiteSpace = Styles.WhiteSpace.Pre
        "pre-wrap" -> style.whiteSpace = Styles.WhiteSpace.PreWrap
        "pre-line" -> style.whiteSpace = Styles.WhiteSpace.PreLine
        "nowrap" -> style.whiteSpace = Styles.WhiteSpace.NoWrap
        "break-spaces" -> style.whiteSpace = Styles.WhiteSpace.BreakSpaces
      }

      "text-wrap" -> when (value) {
        "wrap" -> style.textWrap = Styles.TextWrap.Wrap
        "nowrap" -> style.textWrap = Styles.TextWrap.NoWrap
        "balance" -> style.textWrap = Styles.TextWrap.Balance
        "pretty" -> style.textWrap = Styles.TextWrap.Pretty
      }

      "text-overflow" -> when (value) {
        "clip" -> style.textOverflow = Styles.TextOverflow.Clip
        "ellipsis" -> style.textOverflow = Styles.TextOverflow.Ellipse
      }

      "text-justify" -> when (value) {
        "none" -> style.textJustify = Styles.TextJustify.None
        "auto" -> style.textJustify = Styles.TextJustify.Auto
        "inter-word" -> style.textJustify = Styles.TextJustify.InterWord
        "inter-character" -> style.textJustify = Styles.TextJustify.InterCharacter
        "distribute" -> style.textJustify = Styles.TextJustify.Distribute
      }

      // endregion
    }
  }

  // endregion

  // region Value Parsers

  // Length and color parsing delegate to the canonical package-level parsers
  // (Border.kt / Background.kt). That keeps device-scale and percentage handling
  // consistent with every other code path (margins, borders, backgrounds) and
  // reuses the shared length/color regexes instead of duplicating them here.

  private fun parseDimension(value: String): Dimension? {
    return when (val lpa = parseLengthPercentageAuto(value)) {
      LengthPercentageAuto.Auto -> Dimension.Auto
      is LengthPercentageAuto.Points -> Dimension.Points(lpa.points)
      is LengthPercentageAuto.Percent -> Dimension.Percent(lpa.percentage)
      LengthPercentageAuto.Zero -> Dimension.Points(0f)
      null -> null
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

  private fun parseOverflow(value: String): Overflow? = when (value) {
    "visible" -> Overflow.Visible
    "hidden" -> Overflow.Hidden
    "scroll" -> Overflow.Scroll
    "clip" -> Overflow.Clip
    "auto" -> Overflow.Auto
    else -> null
  }

  /** First whitespace-delimited token (e.g. the line keyword of a `text-decoration` shorthand). */
  private fun firstToken(value: String): String =
    value.split(WHITESPACE).firstOrNull { it.isNotEmpty() } ?: value

  /** Parses `aspect-ratio` as a ratio (`16 / 9`) or a single number (`1.5`). */
  private fun parseAspectRatio(value: String): Float? {
    val v = value.lowercase()
    if (v == "auto") return null
    if (v.contains("/")) {
      val parts = v.split("/")
      if (parts.size == 2) {
        val w = parts[0].trim().toFloatOrNull()
        val h = parts[1].trim().toFloatOrNull()
        if (w != null && h != null && h != 0f) return w / h
      }
      return null
    }
    return v.toFloatOrNull()
  }

  /**
   * Parses the `flex` shorthand (`none`, `auto`, `<grow>`, `<grow> <shrink>`,
   * `<grow> <shrink> <basis>`, `<grow> <basis>`).
   */
  private fun applyFlexShorthand(value: String, style: Style) {
    when (value.trim().lowercase()) {
      "none" -> { style.flexGrow = 0f; style.flexShrink = 0f; style.flexBasis = Dimension.Auto; return }
      "auto" -> { style.flexGrow = 1f; style.flexShrink = 1f; style.flexBasis = Dimension.Auto; return }
      "initial" -> { style.flexGrow = 0f; style.flexShrink = 1f; style.flexBasis = Dimension.Auto; return }
    }

    var grow: Float? = null
    var shrink: Float? = null
    var basis: Dimension? = null
    for (token in value.split(WHITESPACE).filter { it.isNotEmpty() }) {
      // A plain unitless number is a grow/shrink factor; anything else is a basis.
      if (token == "auto" || token.endsWith("%") || token.endsWith("px")) {
        basis = parseDimension(token)
      } else {
        val n = token.toFloatOrNull()
        if (n != null) {
          if (grow == null) grow = n else if (shrink == null) shrink = n
        } else {
          basis = parseDimension(token)
        }
      }
    }
    style.flexGrow = grow ?: 1f
    style.flexShrink = shrink ?: 1f
    // `flex: 1` resolves basis to 0; an explicit basis token overrides that.
    style.flexBasis = basis ?: Dimension.Points(0f)
  }

  /** Parses the `inset` shorthand (1–4 values, CSS order top / right / bottom / left). */
  private fun applyInsetShorthand(value: String, style: Style) {
    val parsed = value.split(WHITESPACE).filter { it.isNotEmpty() }
      .mapNotNull { parseLengthPercentageAuto(it) }
    if (parsed.isEmpty()) return
    val top = parsed[0]
    val right = if (parsed.size > 1) parsed[1] else top
    val bottom = if (parsed.size > 2) parsed[2] else top
    val left = if (parsed.size > 3) parsed[3] else right
    style.inset = Rect(top, right, bottom, left)
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
      "search" -> Input.Type.Search
      "date" -> Input.Type.Date
      "time" -> Input.Type.Time
      "datetime-local" -> Input.Type.DatetimeLocal
      "month" -> Input.Type.Month
      "week" -> Input.Type.Week
      "color" -> Input.Type.Color
      "checkbox" -> Input.Type.Checkbox
      "radio" -> Input.Type.Radio
      "range" -> Input.Type.Range
      "file" -> Input.Type.File
      "submit" -> Input.Type.Submit
      "reset" -> Input.Type.Reset
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
