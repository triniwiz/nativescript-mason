package org.nativescript.mason.masonkit

import android.content.Context
import android.os.Build
import android.view.ViewGroup
import org.nativescript.mason.masonkit.enums.BorderStyle
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

    /**
     * Elements whose content is raw text rather than markup. Their body has to be
     * consumed verbatim up to the matching close tag.
     */
    private val RAW_TEXT_ELEMENTS = setOf("style", "script", "textarea", "title")

    /** Document metadata and scripts: no box, and their text never renders. */
    private val DROPPED_ELEMENTS = setOf("style", "script", "title", "head", "meta", "link", "base")

    private data class InlineStyleReplay(
      val css: String, val viewportDependent: Boolean, val parentFontSize: Float, val fontSize: Float,
    )

    private val viewportStyles = java.util.WeakHashMap<Element, InlineStyleReplay>()

    /** True when CSS text holds a vw/vh/vmin/vmax length. */
    @JvmStatic
    fun hasViewportUnit(value: String): Boolean =
      Mason.expandCssShorthand("viewport-dependent", value) != null

    /** Replay ancestors first so descendants see the updated inherited font size. */
    internal fun refreshViewportStyles(mason: Mason) {
      if (viewportStyles.isEmpty()) return
      val entries = viewportStyles.entries
        .filter { it.key.node.mason === mason }
        .map { (element, previous) -> Triple(element, previous, generateSequence(element.node.parent) { it.parent }.count()) }
        .sortedBy { it.third }
      for ((element, previous) in entries) {
        val parser = HTMLParser(mason, element.view.context)
        element.configure { style ->
          val next = parser.applyCompiledStyle(previous.css, style, style.node.parent, previous)
          if (next != null) viewportStyles[element] = next
        }
      }
    }

    /** Elements whose text keeps its whitespace. */
    private val PREFORMATTED_ELEMENTS = setOf("pre", "textarea")

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
    // Open dropped elements (`<style>`, `<script>`, ...): everything inside is skipped.
    var dropped = 0
    var lastToken: Token? = null

    for (token in tokens) {
      val previous = lastToken
      lastToken = token
      if (dropped > 0) {
        if (token is Token.CloseTag && token.name in DROPPED_ELEMENTS) dropped--
        else if (token is Token.OpenTag && token.name in DROPPED_ELEMENTS && !token.selfClosing) dropped++
        continue
      }
      when (token) {
        is Token.OpenTag -> {
          if (token.name in DROPPED_ELEMENTS) {
            // `<head>` only wraps other metadata; its children are handled one by one.
            if (!token.selfClosing && token.name in RAW_TEXT_ELEMENTS) dropped++
            continue
          }
          val parent = stack.lastOrNull()
          val node = createElement(token.name, token.attributes, parent?.second)

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
          // A stray end tag is ignored, as in browsers.
          if (stack.none { it.first == token.name }) continue
          while (stack.isNotEmpty()) {
            if (stack.last().first == token.name) {
              stack.removeAt(stack.lastIndex)
              break
            }
            stack.removeAt(stack.lastIndex)
          }
        }

        is Token.Text -> {
          val preformatted = stack.lastOrNull()?.first in RAW_TEXT_ELEMENTS ||
            stack.any { it.first in PREFORMATTED_ELEMENTS }
          // Outside `<pre>` and raw-text elements, HTML collapses whitespace runs
          // to a single space. Whitespace-only text stays a space inside an inline
          // flow (`<b>b</b> <i>c</i>`); flex and grid containers ignore it.
          val parent = stack.lastOrNull()
          var text = if (preformatted) token.content else collapseWhitespace(token.content)
          // A newline right after `<pre>` is not content.
          if (previous is Token.OpenTag && previous.name == "pre") {
            text = text.removePrefix("\r\n").removePrefix("\n")
          }
          if (text.isEmpty() && token.content.isNotEmpty() && parent != null &&
            parent.second.style.display.let { it == Display.Block || it == Display.Inline || it == Display.InlineBlock }
          ) {
            text = " "
          }
          if (text.isEmpty()) continue

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
   * whitespace becomes empty. Leading and trailing spaces around markup are kept as
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

  private fun createElement(name: String, attributes: Map<String, String>, parent: Node?): Node {
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
        applyAttributes(attributes, img, parent)
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

    when (name) {
      "details" -> {
        Details.setRole(element, Details.DETAILS)
        // A boolean attribute: present means open.
        if (attributes.containsKey("open")) Details.setOpen(element, true)
      }
      "summary" -> Details.setRole(element, Details.SUMMARY)
    }

    applyAttributes(attributes, element, parent)
    return element.node
  }

  // endregion

  // region Attribute Application

  private fun applyAttributes(attributes: Map<String, String>, element: Element, parent: Node?) {
    for ((key, value) in attributes) {
      when (key) {
        "style" -> applyInlineStyle(value, element, parent)
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

  private data class StyleDeclaration(val name: String, val value: String, val fields: Array<String>) {
    val code: Byte? get() = fields.firstOrNull()?.toByteOrNull()

    fun lengthKind(index: Int = 0): Int? =
      fields.getOrNull(index * CssLengthResultRecord.STRIDE + CssLengthResultRecord.KIND)?.toIntOrNull()

    fun amount(index: Int = 0): Float? =
      fields.getOrNull(index * CssLengthResultRecord.STRIDE + CssLengthResultRecord.VALUE)?.toFloatOrNull()

    fun length(index: Int = 0): LengthPercentage? {
      val amount = amount(index) ?: return null
      return when (lengthKind(index)) {
        1 -> LengthPercentage.Points(amount)
        2 -> LengthPercentage.Percent(amount)
        else -> null
      }
    }

    fun autoLength(index: Int = 0): LengthPercentageAuto? = when (val length = length(index)) {
      is LengthPercentage.Points -> LengthPercentageAuto.Points(length.value)
      is LengthPercentage.Percent -> LengthPercentageAuto.Percent(length.value)
      LengthPercentage.Zero -> LengthPercentageAuto.Zero
      null -> if (lengthKind(index) == 3) LengthPercentageAuto.Auto else null
    }

    fun dimension(): Dimension? {
      val kind = lengthKind() ?: return null
      val value = amount() ?: return null
      return Dimension.fromTypeValue(kind.toByte(), value)
    }
  }

  private fun parseStyleDeclarations(fields: Array<String>): List<StyleDeclaration> {
    val out = ArrayList<StyleDeclaration>()
    var i = CssInlineReplayRecord.STRIDE
    while (fields.size - i >= CssDeclarationHeaderRecord.STRIDE) {
      val start = i + CssDeclarationHeaderRecord.STRIDE
      val count = fields[i + CssDeclarationHeaderRecord.FIELD_COUNT].toIntOrNull() ?: break
      if (count < 0 || count > fields.size - start) break
      out.add(StyleDeclaration(fields[i + CssDeclarationHeaderRecord.NAME],
        fields[i + CssDeclarationHeaderRecord.VALUE], fields.copyOfRange(start, start + count)))
      i = start + count
    }
    return out
  }

  private fun applyInlineStyle(css: String, element: Element, parent: Node?) {
    element.configure { style ->
      val replay = applyCompiledStyle(css, style, parent)
      if (replay != null) viewportStyles[element] = replay else viewportStyles.remove(element)
    }
  }

  private fun applyCompiledStyle(css: String, style: Style, parent: Node?, previous: InlineStyleReplay? = null): InlineStyleReplay? {
    val mason = style.node.mason
    val parentFontSize = parent?.style?.resolvedFontSize ?: Constants.DEFAULT_FONT_SIZE
    val fontSize = if (parent != null && style.values.get(StyleKeys.FONT_SIZE_STATE) == StyleState.INHERIT) {
      parentFontSize
    } else {
      style.resolvedFontSize
    }
    if (previous != null && !previous.viewportDependent &&
      previous.parentFontSize == parentFontSize && previous.fontSize == fontSize) return previous
    val fields = Mason.nativeCompileInlineCssReplay(css, mason.scale, fontSize, parentFontSize, mason.rootFontSize,
      mason.viewportWidth, mason.viewportHeight, previous?.fontSize ?: Float.NaN) ?: return null
    val resolvedFont = fields.getOrNull(CssInlineReplayRecord.FONT_SIZE)?.toFloatOrNull() ?: return null
    val initialColor = style.color
    val declarations = parseStyleDeclarations(fields)
    for (declaration in declarations) {
      if (declaration.name == "font-size") {
        declaration.amount()?.let { style.setResolvedFontSize(it, declaration.lengthKind() == 2) }
      }
    }
    for (declaration in declarations) {
      if (declaration.name != "font-size") applyStyleProperty(declaration, style, initialColor)
    }
    val viewport = fields[CssInlineReplayRecord.VIEWPORT_DEPENDENT] == "1"
    if (!viewport && fields[CssInlineReplayRecord.FONT_DEPENDENT] != "1") return null
    return InlineStyleReplay(css, viewport, parentFontSize, resolvedFont)
  }

  private fun <T> rect(read: (Int) -> T?): Rect<T>? {
    return Rect(read(0) ?: return null, read(1) ?: return null, read(2) ?: return null, read(3) ?: return null)
  }

  private fun applyStyleProperty(declaration: StyleDeclaration, style: Style, initialColor: Int) {
    val (property, value, fields) = declaration
    when (property) {
      "display" -> declaration.code?.let { style.display = Display.from(it) }

      "flex-direction" -> declaration.code?.let { style.flexDirection = FlexDirection.from(it) }

      "justify-content" -> declaration.code?.let { style.justifyContent = JustifyContent.from(it) }

      "align-items" -> declaration.code?.let { style.alignItems = AlignItems.from(it) }

      "align-self" -> declaration.code?.let { style.alignSelf = AlignSelf.from(it) }

      "flex-wrap" -> declaration.code?.let { style.flexWrap = FlexWrap.from(it) }

      "flex-grow" -> fields.firstOrNull()?.toFloatOrNull()?.let { style.flexGrow = it }

      "flex-shrink" -> fields.firstOrNull()?.toFloatOrNull()?.let { style.flexShrink = it }

      "gap", "grid-gap" -> {
        val row = declaration.length(0)
        val column = declaration.length(1)
        if (row != null && column != null) style.gap = Size(row, column)
      }

      "row-gap" -> declaration.length()?.let { v ->
        style.gap = Size(v, style.gap.height)
      }
      "column-gap" -> declaration.length()?.let { v ->
        style.gap = Size(style.gap.width, v)
      }

      "color" -> fields.firstOrNull()?.toUIntOrNull()?.let { style.color = it.toInt() }

      "background-color" -> fields.firstOrNull()?.toUIntOrNull()?.let { style.setParsedBackgroundColor(it.toInt()) }

      "font-weight" -> fields.firstOrNull()?.toIntOrNull()?.let { style.setParsedFontWeight(it) }

      "font-stretch" -> fields.firstOrNull()?.toIntOrNull()?.let { style.setParsedFontStretch(it) }

      "width" -> declaration.dimension()?.let { d ->
        val current = style.size
        style.size = Size(d, current.height)
      }

      "height" -> declaration.dimension()?.let { d ->
        val current = style.size
        style.size = Size(current.width, d)
      }

      "min-width" -> declaration.dimension()?.let { style.minWidth = it }
      "min-height" -> declaration.dimension()?.let { style.minHeight = it }
      "max-width" -> declaration.dimension()?.let { style.maxWidth = it }
      "max-height" -> declaration.dimension()?.let { style.maxHeight = it }

      "border" -> if (fields.size == CssBorderResultRecord.STRIDE) {
        val defaultWidth = LengthPercentage.Points(3 * style.node.mason.scale)
        val widths = rect { declaration.length(it) ?: defaultWidth } ?: return
        val borderStyle = fields[CssBorderResultRecord.STYLE].toByteOrNull()?.let(BorderStyle::from)
        val color = fields[CssBorderResultRecord.COLOR].toUIntOrNull()?.toInt()
        applyResolvedBorder(style, value, widths, borderStyle, color)
      }
      "border-left", "border-right", "border-top", "border-bottom" -> if (fields.size == CssBorderSideResultRecord.STRIDE) {
        val border = when (property) {
          "border-left" -> style.mBorderLeft
          "border-right" -> style.mBorderRight
          "border-top" -> style.mBorderTop
          else -> style.mBorderBottom
        }
        val width = declaration.length() ?: LengthPercentage.Points(3 * style.node.mason.scale)
        val borderStyle = fields[CssBorderSideResultRecord.STYLE].toByteOrNull()?.let(BorderStyle::from)
        val color = fields[CssBorderSideResultRecord.COLOR].toUIntOrNull()?.toInt()
        applyResolvedBorderSide(style, border, width, borderStyle, color)
      }
      "border-radius" -> style.setCompiledBorderRadius(value, (0 until BorderRadiiRecord.STRIDE).mapNotNull(declaration::length))

      "padding" -> rect(declaration::length)?.let { style.padding = it }

      "padding-left" -> declaration.length()?.let { v ->
        val current = style.padding
        style.padding = Rect(current.top, current.right, current.bottom, v)
      }

      "padding-right" -> declaration.length()?.let { v ->
        val current = style.padding
        style.padding = Rect(current.top, v, current.bottom, current.left)
      }

      "padding-top" -> declaration.length()?.let { v ->
        val current = style.padding
        style.padding = Rect(v, current.right, current.bottom, current.left)
      }

      "padding-bottom" -> declaration.length()?.let { v ->
        val current = style.padding
        style.padding = Rect(current.top, current.right, v, current.left)
      }

      "margin" -> rect(declaration::autoLength)?.let { style.margin = it }

      "margin-left" -> declaration.autoLength()?.let { style.marginLeft = it }
      "margin-right" -> declaration.autoLength()?.let { style.marginRight = it }
      "margin-top" -> declaration.autoLength()?.let { style.marginTop = it }
      "margin-bottom" -> declaration.autoLength()?.let { style.marginBottom = it }

      "position" -> declaration.code?.let { style.position = Position.from(it) }

      "overflow" -> fields.takeIf { it.size == 2 }?.let {
        val x = it[0].toByteOrNull()
        val y = it[1].toByteOrNull()
        if (x != null && y != null) style.overflow = Point(Overflow.from(x), Overflow.from(y))
      }
      "overflow-x" -> declaration.code?.let { style.overflowX = Overflow.from(it) }
      "overflow-y" -> declaration.code?.let { style.overflowY = Overflow.from(it) }

      "text-align" -> declaration.code?.let { style.textAlign = TextAlign.from(it) }

      // region Additional flex / grid alignment

      "align-content" -> declaration.code?.let { style.alignContent = AlignContent.from(it) }

      "justify-items" -> declaration.code?.let { style.justifyItems = JustifyItems.from(it) }

      "justify-self" -> declaration.code?.let { style.justifySelf = JustifySelf.from(it) }

      "flex-basis" -> declaration.dimension()?.let { style.flexBasis = it }

      // endregion

      // region Positioning

      "inset" -> rect(declaration::autoLength)?.let { style.inset = it }
      "top" -> declaration.autoLength()?.let { v ->
        val c = style.inset
        style.inset = Rect(v, c.right, c.bottom, c.left)
      }
      "right" -> declaration.autoLength()?.let { v ->
        val c = style.inset
        style.inset = Rect(c.top, v, c.bottom, c.left)
      }
      "bottom" -> declaration.autoLength()?.let { v ->
        val c = style.inset
        style.inset = Rect(c.top, c.right, v, c.left)
      }
      "left" -> declaration.autoLength()?.let { v ->
        val c = style.inset
        style.inset = Rect(c.top, c.right, c.bottom, v)
      }

      "aspect-ratio" -> style.aspectRatio = fields.firstOrNull()?.toFloatOrNull()

      "box-sizing" -> declaration.code?.let { style.boxSizing = BoxSizing.from(it) }

      "direction" -> declaration.code?.let { style.direction = Direction.from(it) }

      // endregion

      // region Grid

      "grid-template-columns" -> style.gridTemplateColumns = value
      "grid-template-rows" -> style.gridTemplateRows = value
      "grid-template-areas" -> style.gridTemplateAreas = value
      "grid-auto-rows" -> style.gridAutoRows = value
      "grid-auto-columns" -> style.gridAutoColumns = value
      "grid-auto-flow" -> declaration.code?.let { style.gridAutoFlow = GridAutoFlow.from(it) }
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
      "corner-shape-top-left" -> style.cornerShapeTopLeft = value
      "corner-shape-top-right" -> style.cornerShapeTopRight = value
      "corner-shape-bottom-right" -> style.cornerShapeBottomRight = value
      "corner-shape-bottom-left" -> style.cornerShapeBottomLeft = value
      "effect-values" -> value.toFloatOrNull()?.let { style.applyCompiledEffects(fields, initialColor, it) }
      "transform" -> style.transform = value
      "transform-origin" -> if (fields.size == CssPositionResultRecord.STRIDE) {
        val x = fields[CssPositionResultRecord.X_VALUE].toFloatOrNull() ?: return
        val y = fields[CssPositionResultRecord.Y_VALUE].toFloatOrNull() ?: return
        style.setResolvedTransformOrigin(x, fields[CssPositionResultRecord.X_TYPE] == "1",
          y, fields[CssPositionResultRecord.Y_TYPE] == "1")
      }
      "background-values" -> value.toFloatOrNull()?.let { style.applyCompiledBackground(fields, initialColor, it) }
      "mask-values" -> style.applyCompiledMask(fields)
      "border-image" -> style.borderImage = value

      "z-index" -> fields.firstOrNull()?.toIntOrNull()?.let { style.zIndex = it }

      "float" -> declaration.code?.let { style.float = org.nativescript.mason.masonkit.enums.Float.from(it) }

      "clear" -> declaration.code?.let { style.clear = Clear.from(it) }

      "object-fit" -> declaration.code?.let { style.objectFit = ObjectFit.from(it) }

      "list-style-type" -> declaration.code?.let { style.listStyleType = ListStyleType.from(it) }
      "list-style-position" -> declaration.code?.let { style.listStylePosition = ListStylePosition.from(it) }

      // endregion

      // region Text / font

      "font-family" -> AppFonts.selectFamily(fields.asList(), (style.node.view as? android.view.View)?.context)
        ?.let { style.fontFamily = it }
      "font-style" -> style.setParsedFontStyle(fields)
      "line-height" -> declaration.amount()?.let { style.setResolvedLineHeight(it, declaration.lengthKind() ?: return) }
      "letter-spacing" -> declaration.amount()?.let { style.letterSpacing = it }
      "word-spacing" -> declaration.amount()?.let { style.setResolvedWordSpacing(it, declaration.lengthKind() ?: return) }
      "text-indent" -> declaration.amount()?.let { style.setResolvedTextIndent(it, declaration.lengthKind() == 2) }
      "vertical-align" -> declaration.amount()?.let { style.setResolvedVerticalAlign(declaration.lengthKind() ?: return, it) }
      "font-feature-settings" -> style.fontFeatureSettings = value
      "font-variant-numeric" -> fields.firstOrNull()?.toIntOrNull()?.let { style.fontVariantNumeric = it }

      "text-decoration" -> fields.getOrNull(TextDecorationRecord.THICKNESS)?.toFloatOrNull()?.let { style.setParsedTextDecoration(fields, it) }
      "text-decoration-line" -> declaration.code?.let { style.decorationLine = Styles.DecorationLine.from(it) }
      "text-decoration-color" -> fields.firstOrNull()?.toUIntOrNull()?.let { style.decorationColor = it.toInt() }
      "text-decoration-style" -> declaration.code?.let { style.decorationStyle = Styles.DecorationStyle.from(it) }
      "text-decoration-thickness" -> fields.firstOrNull()?.toFloatOrNull()?.let { style.decorationThickness = it }

      "text-transform" -> declaration.code?.let { style.textTransform = Styles.TextTransform.from(it) }

      "white-space" -> declaration.code?.let { style.whiteSpace = Styles.WhiteSpace.from(it) }

      "text-wrap" -> declaration.code?.let { style.textWrap = Styles.TextWrap.from(it) }

      "hyphens" -> declaration.code?.let { style.hyphens = it }
      "writing-mode" -> declaration.code?.let { style.writingMode = it }
      "unicode-bidi" -> declaration.code?.let { style.unicodeBidi = it }
      "text-orientation" -> declaration.code?.let { style.textOrientation = it }
      "text-combine-upright" -> declaration.code?.let { style.textCombineUpright = it }
      "text-spacing-trim" -> declaration.code?.let { style.textSpacingTrim = it }
      "line-clamp", "-webkit-line-clamp" -> fields.firstOrNull()?.toIntOrNull()?.let { style.lineClamp = it }

      "text-overflow" -> declaration.code?.let { style.textOverflow = Styles.TextOverflow.from(it) }

      "text-justify" -> declaration.code?.let { style.textJustify = Styles.TextJustify.from(it) }

      // endregion
    }
  }

  // endregion

  // region Value Parsers

  // Use the same length resolver as the typed style adapters.

  private fun parseDimension(value: String): Dimension? {
    return when (val lpa = parseLengthPercentageAuto(value)) {
      LengthPercentageAuto.Auto -> Dimension.Auto
      is LengthPercentageAuto.Points -> Dimension.Points(lpa.points)
      is LengthPercentageAuto.Percent -> Dimension.Percent(lpa.percentage)
      LengthPercentageAuto.Zero -> Dimension.Points(0f)
      null -> null
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
