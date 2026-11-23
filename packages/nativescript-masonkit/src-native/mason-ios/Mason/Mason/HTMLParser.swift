//
//  HTMLParser.swift
//  Mason
//
//  Created by Osei Fortune on 16/03/2026.
//

#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

@objcMembers
@objc(MasonHTMLParser)
public class HTMLParser: NSObject {

  private let mason: NSCMason

  public init(mason: NSCMason) {
    self.mason = mason
    super.init()
  }

  // MARK: - Public API

  // MasonNode.view is weak: the views made by the last parse live here until something attaches
  // them, or a root's view (nothing else holds it) is gone before it can be added.
  private var created: [UIView] = []
  private var inlineViewport: CGSize?

  /// Parses an HTML string and returns a list of root-level MasonElement/MasonNode children.
  public func parse(_ html: String) -> [MasonNode] {
    created.removeAll()
    inlineViewport = nil
    let tokens = tokenize(html)
    return buildTree(tokens)
  }

  /// Parses HTML and appends resulting children to the given element.
  public func parseInto(_ html: String, element: MasonElement) {
    let children = parse(html)
    defer { created.removeAll() }
    // `innerHTML =` replaces the content, it does not add to it. This used to
    // only append, so assigning twice concatenated instead of replacing.
    element.node.removeAllChildren()
    for child in children {
      element.append(node: child)
    }
  }

  // MARK: - Tokenizer

  private enum Token {
    case openTag(name: String, attributes: [String: String], selfClosing: Bool)
    case closeTag(name: String)
    case text(String)
  }

  private static let voidElements: Set<String> = [
    "br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"
  ]

  /// Elements whose content is raw text rather than markup, so their body has to
  /// be consumed verbatim up to the matching close tag. Without this a `<style>`
  /// block's CSS was tokenized as tags and its body rendered as visible text.
  private static let rawTextElements: Set<String> = ["style", "script", "textarea", "title"]
  /// Never rendered: these and their content are left out of the tree.
  private static let droppedElements: Set<String> = ["style", "script", "title", "head", "meta", "link", "base"]

  private func tokenize(_ html: String) -> [Token] {
    var tokens: [Token] = []
    let chars = Array(html)
    let len = chars.count
    var i = 0

    while i < len {
      if chars[i] == "<" {
        // Check for comment <!-- ... -->
        if i + 3 < len && chars[i+1] == "!" && chars[i+2] == "-" && chars[i+3] == "-" {
          if let endIdx = findCommentEnd(chars, from: i + 4) {
            i = endIdx
            continue
          }
        }

        // `<!doctype html>`, `<?xml ...?>` and `<![CDATA[...]]>` are not tags;
        // skip them so they don't parse as a "!doctype" tag.
        if i + 1 < len && (chars[i+1] == "!" || chars[i+1] == "?") {
          var j = i + 2
          while j < len && chars[j] != ">" { j += 1 }
          i = j < len ? j + 1 : len
          continue
        }

        let tagStart = i
        i += 1

        // Skip whitespace after <
        while i < len && chars[i].isWhitespace { i += 1 }

        let isClosing = i < len && chars[i] == "/"
        if isClosing { i += 1 }

        // Parse tag name
        let nameStart = i
        while i < len && chars[i] != ">" && chars[i] != "/" && !chars[i].isWhitespace {
          i += 1
        }
        let tagName = String(chars[nameStart..<i]).lowercased()

        if tagName.isEmpty {
          // Malformed tag, treat as text
          tokens.append(.text(String(chars[tagStart...tagStart])))
          i = tagStart + 1
          continue
        }

        if isClosing {
          // Skip to >
          while i < len && chars[i] != ">" { i += 1 }
          if i < len { i += 1 }
          tokens.append(.closeTag(name: tagName))
          continue
        }

        // Parse attributes
        var attributes: [String: String] = [:]
        while i < len && chars[i] != ">" && chars[i] != "/" {
          // Skip whitespace
          while i < len && chars[i].isWhitespace { i += 1 }
          if i >= len || chars[i] == ">" || chars[i] == "/" { break }

          // Attribute name
          let attrNameStart = i
          while i < len && chars[i] != "=" && chars[i] != ">" && chars[i] != "/" && !chars[i].isWhitespace {
            i += 1
          }
          let attrName = String(chars[attrNameStart..<i]).lowercased()
          if attrName.isEmpty { break }

          // Skip whitespace
          while i < len && chars[i].isWhitespace { i += 1 }

          var attrValue = ""
          if i < len && chars[i] == "=" {
            i += 1
            // Skip whitespace
            while i < len && chars[i].isWhitespace { i += 1 }

            if i < len && (chars[i] == "\"" || chars[i] == "'") {
              let quote = chars[i]
              i += 1
              let valStart = i
              while i < len && chars[i] != quote { i += 1 }
              attrValue = String(chars[valStart..<i])
              if i < len { i += 1 } // skip closing quote
            } else {
              // Unquoted value
              let valStart = i
              while i < len && !chars[i].isWhitespace && chars[i] != ">" && chars[i] != "/" {
                i += 1
              }
              attrValue = String(chars[valStart..<i])
            }
          }

          attributes[attrName] = attrValue
        }

        var selfClosing = false
        if i < len && chars[i] == "/" {
          selfClosing = true
          i += 1
        }
        if i < len && chars[i] == ">" { i += 1 }

        if HTMLParser.voidElements.contains(tagName) {
          selfClosing = true
        }

        // A raw-text element's body is text, not markup: consume it verbatim up
        // to the matching close tag.
        if !selfClosing && HTMLParser.rawTextElements.contains(tagName) {
          tokens.append(.openTag(name: tagName, attributes: attributes, selfClosing: false))
          let closing = Array("</" + tagName)
          let bodyStart = i
          var j = i
          var found = -1
          while j + closing.count <= len {
            var matches = true
            for k in 0..<closing.count where Character(chars[j + k].lowercased()) != closing[k] {
              matches = false
              break
            }
            if matches {
              found = j
              break
            }
            j += 1
          }
          let bodyEnd = found >= 0 ? found : len
          if bodyEnd > bodyStart {
            tokens.append(.text(String(chars[bodyStart..<bodyEnd])))
          }
          i = bodyEnd
          if found >= 0 {
            while i < len && chars[i] != ">" { i += 1 }
            if i < len { i += 1 }
            tokens.append(.closeTag(name: tagName))
          }
          continue
        }

        tokens.append(.openTag(name: tagName, attributes: attributes, selfClosing: selfClosing))
      } else {
        // Text content
        let textStart = i
        while i < len && chars[i] != "<" { i += 1 }
        let text = decodeEntities(String(chars[textStart..<i]))
        if !text.isEmpty {
          tokens.append(.text(text))
        }
      }
    }

    return tokens
  }

  private func findCommentEnd(_ chars: [Character], from start: Int) -> Int? {
    var i = start
    let len = chars.count
    while i + 2 < len {
      if chars[i] == "-" && chars[i+1] == "-" && chars[i+2] == ">" {
        return i + 3
      }
      i += 1
    }
    return nil
  }

  // MARK: - Tree Builder

  private func buildTree(_ tokens: [Token]) -> [MasonNode] {
    var roots: [MasonNode] = []
    var stack: [(name: String, node: MasonNode)] = []
    var i = 0

    while i < tokens.count {
      let token = tokens[i]
      i += 1

      switch token {
      case .openTag(let name, let attributes, let selfClosing):
        if Self.droppedElements.contains(name) {
          if !selfClosing && !Self.voidElements.contains(name) { i = Self.indexAfterClose(of: name, in: tokens, from: i) }
          continue
        }
        let node = createElement(name: name, attributes: attributes, parent: stack.last?.node)

        if let parent = stack.last {
          parent.node.appendChild(node)
        } else {
          roots.append(node)
        }

        if !selfClosing {
          stack.append((name: name, node: node))
        }

      case .closeTag(let name):
        // Pop stack back to matching open tag
        while let last = stack.last {
          if last.name == name {
            stack.removeLast()
            break
          }
          // Implicit close of unclosed tags
          stack.removeLast()
        }

      case .text(let text):
        let parentIsRawText = stack.last.map { Self.rawTextElements.contains($0.name) } ?? false
        let inPre = stack.contains { $0.name == "pre" }
        // Outside a raw-text element or <pre>, HTML collapses whitespace runs to one
        // space. Whitespace-only text stays a space inside an inline flow
        // (`<b>b</b> <i>c</i>`); flex and grid containers ignore it.
        var trimmed = parentIsRawText || inPre ? text : Self.collapseWhitespace(text)
        // A newline right after <pre> is not content.
        if inPre, stack.last?.name == "pre", i >= 2, case .openTag("pre", _, _) = tokens[i - 2] {
          if trimmed.hasPrefix("\r\n") { trimmed.removeFirst(2) } else if trimmed.hasPrefix("\n") { trimmed.removeFirst() }
        }
        if trimmed.isEmpty && !text.isEmpty, let parent = stack.last,
           [Display.Block, Display.Inline, Display.InlineBlock].contains(parent.node.style.display) {
          trimmed = " "
        }
        if trimmed.isEmpty { continue }

        if let parent = stack.last {
          let textNode = MasonTextNode(mason: mason, data: trimmed)
          parent.node.appendChild(textNode)
        } else {
          // Top-level text — wrap in a text container
          let textView = mason.createTextView(type: .Span)
          created.append(textView)
          let textNode = MasonTextNode(mason: mason, data: trimmed)
          textView.node.appendChild(textNode)
          roots.append(textView.node)
        }
      }
    }

    return roots
  }

  /// The token index after the close tag matching an open `name` whose content starts at `start`.
  private static func indexAfterClose(of name: String, in tokens: [Token], from start: Int) -> Int {
    var depth = 1
    var j = start
    while j < tokens.count {
      switch tokens[j] {
      case .openTag(let n, _, let selfClosing) where n == name && !selfClosing:
        depth += 1
      case .closeTag(let n) where n == name:
        depth -= 1
        if depth == 0 { return j + 1 }
      default:
        break
      }
      j += 1
    }
    return tokens.count
  }

  // MARK: - Element Factory

  private func createElement(name: String, attributes: [String: String], parent: MasonNode?) -> MasonNode {
    let element: MasonElement

    switch name {
    // Container / block-level elements
    case "div", "section", "header", "footer", "article", "main", "nav", "aside",
         "figure", "figcaption", "address", "details", "summary", "hgroup",
         "dl", "dt", "dd", "form", "fieldset", "picture", "hr":
      element = mason.createView()

    // Text elements
    case "p":
      element = mason.createTextView(type: .P)
    // Inline / phrasing text elements share an inline (span) box so they flow
    // within the surrounding line instead of breaking it.
    case "span", "small", "mark", "sub", "sup", "u", "s", "strike", "del", "ins",
         "abbr", "cite", "q", "dfn", "kbd", "samp", "var", "time", "output",
         "data", "bdi", "bdo", "big", "tt", "label", "ruby", "wbr":
      element = mason.createTextView(type: .Span)
    case "code":
      element = mason.createTextView(type: .Code)
    case "pre":
      element = mason.createTextView(type: .Pre)
    case "h1":
      element = mason.createTextView(type: .H1)
    case "h2":
      element = mason.createTextView(type: .H2)
    case "h3":
      element = mason.createTextView(type: .H3)
    case "h4":
      element = mason.createTextView(type: .H4)
    case "h5":
      element = mason.createTextView(type: .H5)
    case "h6":
      element = mason.createTextView(type: .H6)
    case "b":
      element = mason.createTextView(type: .B)
    case "strong":
      element = mason.createTextView(type: .Strong)
    case "em":
      element = mason.createTextView(type: .Em)
    case "i":
      element = mason.createTextView(type: .I)
    case "a":
      element = mason.createTextView(type: .A)
    case "blockquote":
      element = mason.createTextView(type: .Blockquote)

    // List elements
    // Plain containers whose `<li>` children are `.Li` text views — the only
    // arrangement the marker drawing in MasonUIView can paint a bullet for.
    // createListView/createListItem build the data-bound list widget instead,
    // whose marker system draws nothing for static markup.
    case "ul":
      let ul = mason.createView()
      applyListUaDefaults(ul, ordered: false)
      element = ul
    case "ol":
      let ol = mason.createView()
      applyListUaDefaults(ol, ordered: true)
      element = ol
    case "li":
      element = mason.createTextView(type: .Li)

    // Self-closing / special elements
    case "br":
      element = mason.createBr()
    case "img":
      let img = mason.createImageView()
      if let src = attributes["src"] {
        img.src = src
      }
      applyAttributes(attributes, to: img, parent: parent)
      created.append(img)
      return img.node

    // Scroll
    case "scroll":
      element = mason.createScrollView()

    // Input
    case "input":
      let inputType = mapInputType(attributes["type"])
      element = mason.createInput(inputType)

    // Multi-line text input
    case "textarea":
      element = mason.createTextArea()

    // Button
    case "button":
      element = mason.createButton()

    default:
      // Unknown tags become generic views
      element = mason.createView()
    }

    created.append(element.uiView)

    if name == "details" {
      MasonDetails.setRole(element.node, MasonDetails.details)
      // A boolean attribute: present means open.
      if attributes["open"] != nil { MasonDetails.setOpen(element.node, true) }
    } else if name == "summary" {
      MasonDetails.setRole(element.node, MasonDetails.summary)
    }

    applyAttributes(attributes, to: element, parent: parent)
    return element.node
  }

  // MARK: - Attribute Application

  /// The browser UA default for `<ul>`/`<ol>`: `margin: 1em 0` plus a
  /// `padding-inline-start: 40px` gutter, which is the space each bullet is drawn
  /// into. Mirrors `applyListUaDefaults` in web.ts so markup and JSX agree.
  private func applyListUaDefaults(_ view: MasonUIView, ordered: Bool) {
    let scale = NSCMason.scale
    let style = view.node.style
    // MasonRect's init takes (top, right, bottom, left).
    let vertical = MasonLengthPercentageAuto.Points(16 * scale)
    let margin = style.margin
    style.margin = MasonRect(vertical, margin.right, vertical, margin.left)
    let padding = style.padding
    style.padding = MasonRect(padding.top, padding.right, padding.bottom, MasonLengthPercentage.Points(40 * scale))
    style.listStyleType = ordered ? .Decimal : .Disc
  }

  private func applyAttributes(_ attributes: [String: String], to element: MasonElement, parent: MasonNode?) {
    for (key, value) in attributes {
      switch key {
      case "style":
        applyInlineStyle(value, to: element, parent: parent)
      case "src":
        if let img = element as? Img {
          img.src = value
        }
      // Recorded, but NOT driving the CSS cascade: a node built here is a native
      // view with a mason node, not a NativeScript ViewBase, so NativeScript's
      // selector engine never sees it. Keeping them lets an app find and style a
      // parsed subtree itself.
      case "class", "id", "href", "alt", "title":
        element.node.htmlAttributes[key] = value
      case "width":
        if let d = parseDimensionAuto(value) { element.node.style.width = d }
      case "height":
        if let d = parseDimensionAuto(value) { element.node.style.height = d }
      case "value":
        if let input = element as? MasonInput {
          input.value = value
        } else if let area = element as? MasonTextArea {
          area.value = value
        }
      case "placeholder":
        if let input = element as? MasonInput {
          input.placeholder = value
        } else if let area = element as? MasonTextArea {
          area.placeholder = value
        }
      case "disabled":
        // A boolean attribute is true whenever present, whatever its value.
        if let input = element as? MasonInput {
          input.disabled = true
        } else if let area = element as? MasonTextArea {
          area.disabled = true
        } else {
          (element as? UIControl)?.isEnabled = false
        }
      default:
        break
      }
    }
  }

  // MARK: - Inline Style Parsing

  /// Collapse whitespace the way HTML does outside a `white-space: pre` context:
  /// every run of whitespace becomes one space, and a run that is *only*
  /// whitespace disappears. A single space around markup is kept, because
  /// `a <b>b</b>` needs the gap.
  static func collapseWhitespace(_ text: String) -> String {
    if text.isEmpty { return text }
    if text.allSatisfy({ $0.isWhitespace }) { return "" }
    var out = ""
    var inWhitespace = false
    for ch in text {
      if ch.isWhitespace {
        inWhitespace = true
      } else {
        if inWhitespace { out.append(" ") }
        inWhitespace = false
        out.append(ch)
      }
    }
    if inWhitespace { out.append(" ") }
    return out
  }

  private struct StyleDeclaration {
    let name: String
    let value: String
    let fields: [String]
    var code: Int8? { fields.first.flatMap { Int8($0) } }

    func lengthKind(_ index: Int = 0) -> Int? {
      let offset = index * CssLengthResultRecord.stride + CssLengthResultRecord.kind
      return offset < fields.count ? Int(fields[offset]) : nil
    }

    func amount(_ index: Int = 0) -> Float? {
      let offset = index * CssLengthResultRecord.stride + CssLengthResultRecord.value
      return offset < fields.count ? Float(fields[offset]) : nil
    }

    func length(_ index: Int = 0) -> MasonLengthPercentage? {
      guard let value = amount(index) else { return nil }
      switch lengthKind(index) {
      case 1: return .Points(value)
      case 2: return .Percent(value)
      default: return nil
      }
    }

    func autoLength(_ index: Int = 0) -> MasonLengthPercentageAuto? {
      switch length(index) {
      case .Points(let value): return .Points(value)
      case .Percent(let value): return .Percent(value)
      case .Zero: return .Zero
      case nil: return lengthKind(index) == 3 ? .Auto : nil
      }
    }

    func dimension() -> MasonDimension? {
      guard let kind = lengthKind(), let value = amount() else { return nil }
      return MasonDimension.fromValueType(value, kind)
    }
  }

  private static func parseStyleDeclarations(_ fields: [String]) -> [StyleDeclaration] {
    var out: [StyleDeclaration] = []
    var index = CssInlineReplayRecord.stride
    while fields.count - index >= CssDeclarationHeaderRecord.stride {
      let start = index + CssDeclarationHeaderRecord.stride
      guard let count = Int(fields[index + CssDeclarationHeaderRecord.fieldCount]),
            count >= 0, count <= fields.count - start else { break }
      out.append(StyleDeclaration(name: fields[index + CssDeclarationHeaderRecord.name],
        value: fields[index + CssDeclarationHeaderRecord.value], fields: Array(fields[start ..< (start + count)])))
      index = start + count
    }
    return out
  }

  private func applyInlineStyle(_ css: String, to element: MasonElement, parent: MasonNode?) {
    let viewport = inlineViewport ?? NSCMason.viewportSize
    inlineViewport = viewport
    element.configure { style in
      if let replay = applyCompiledStyle(css, to: style, parent: parent, viewport: viewport) {
        Self.viewportStyles.setObject(replay, forKey: element.uiView)
        if replay.viewportDependent { NSCMason.watchViewport() }
      } else {
        Self.viewportStyles.removeObject(forKey: element.uiView)
      }
    }
  }

  private final class InlineStyleReplay: NSObject {
    let css: String
    let viewportDependent: Bool
    let parentFontSize: Float
    let fontSize: Float

    init(css: String, viewportDependent: Bool, parentFontSize: Float, fontSize: Float) {
      self.css = css
      self.viewportDependent = viewportDependent
      self.parentFontSize = parentFontSize
      self.fontSize = fontSize
    }
  }

  private static let viewportStyles = NSMapTable<UIView, InlineStyleReplay>.weakToStrongObjects()

  @nonobjc static func refreshViewportStyles(viewport: CGSize = NSCMason.viewportSize) {
    guard viewportStyles.count > 0, let views = viewportStyles.keyEnumerator().allObjects as? [UIView] else { return }
    let parser = HTMLParser(mason: NSCMason.shared)
    let entries = views.compactMap { view -> (MasonElement, InlineStyleReplay, Int)? in
      guard let element = view as? MasonElement, let previous = viewportStyles.object(forKey: view) else { return nil }
      var depth = 0
      var parent = element.node.parent
      while let node = parent {
        depth += 1
        parent = node.parent
      }
      return (element, previous, depth)
    }.sorted { $0.2 < $1.2 }
    for (element, previous, _) in entries {
      element.configure { style in
        if let next = parser.applyCompiledStyle(previous.css, to: style, parent: style.node.parent,
                                                viewport: viewport, previous: previous) {
          viewportStyles.setObject(next, forKey: element.uiView)
        }
      }
    }
  }

  private func applyCompiledStyle(_ css: String, to style: MasonStyle, parent: MasonNode?,
                                  viewport: CGSize, previous: InlineStyleReplay? = nil) -> InlineStyleReplay? {
    let parentFontSize = parent?.style.resolvedFontSize ?? Constants.DEFAULT_FONT_SIZE
    let fontSize = parent != nil && style.getUInt8(StyleKeys.FONT_SIZE_STATE) == StyleState.INHERIT
      ? parentFontSize : style.resolvedFontSize
    if let previous, !previous.viewportDependent, previous.parentFontSize == parentFontSize,
       previous.fontSize == fontSize { return previous }
    guard let fields = NSCMason.compileInlineCss(css, fontSize: fontSize, parentFontSize: parentFontSize,
      viewport: viewport, previousFontSize: previous?.fontSize ?? .nan),
      fields.count >= CssInlineReplayRecord.stride,
      let resolvedFont = Float(fields[CssInlineReplayRecord.fontSize]) else { return nil }
    let initialColor = style.color
    let declarations = Self.parseStyleDeclarations(fields)
    for declaration in declarations where declaration.name == "font-size" {
      if let amount = declaration.amount() {
        style.setResolvedFontSize(amount, isPercent: declaration.lengthKind() == 2)
      }
    }
    for declaration in declarations where declaration.name != "font-size" {
      applyStyleProperty(declaration, to: style, initialColor: initialColor)
    }
    let viewportDependent = fields[CssInlineReplayRecord.viewportDependent] == "1"
    guard viewportDependent || fields[CssInlineReplayRecord.fontDependent] == "1" else { return nil }
    return InlineStyleReplay(css: css, viewportDependent: viewportDependent,
                             parentFontSize: parentFontSize, fontSize: resolvedFont)
  }

  private func rect<T: Codable>(_ read: (Int) -> T?) -> MasonRect<T>? {
    guard let top = read(0), let right = read(1), let bottom = read(2), let left = read(3) else { return nil }
    return MasonRect(top, right, bottom, left)
  }

  private func applyStyleProperty(_ declaration: StyleDeclaration, to style: MasonStyle, initialColor: UInt32) {
    let value = declaration.value
    let fields = declaration.fields
    switch declaration.name {
    case "display":
      if let code = declaration.code, let keyword = Display(rawValue: code) {
        style.display = keyword
      }

    case "flex-direction":
      if let code = declaration.code, let keyword = FlexDirection(rawValue: code) {
        style.flexDirection = keyword
      }

    case "justify-content":
      if let code = declaration.code, let keyword = JustifyContent(rawValue: code) {
        style.justifyContent = keyword
      }

    case "align-items":
      if let code = declaration.code, let keyword = AlignItems(rawValue: code) {
        style.alignItems = keyword
      }

    case "align-self":
      if let code = declaration.code, let keyword = AlignSelf(rawValue: code) {
        style.alignSelf = keyword
      }

    case "flex-wrap":
      if let code = declaration.code, let keyword = FlexWrap(rawValue: code) {
        style.flexWrap = keyword
      }

    case "flex-grow":
      if let v = fields.first.flatMap({ Float($0) }) { style.flexGrow = v }

    case "flex-shrink":
      if let v = fields.first.flatMap({ Float($0) }) { style.flexShrink = v }

    case "gap", "grid-gap":
      if let row = declaration.length(0), let column = declaration.length(1) {
        style.gap = MasonSize(row, column)
      }

    case "color":
      if let c = fields.first.flatMap({ UInt32($0) }) {
        style.color = c
      }

    case "background-color":
      if let c = fields.first.flatMap({ UInt32($0) }) {
        style.backgroundColor = c
      }

    case "font-weight":
      style.setParsedFontWeight(fields)

    case "font-stretch":
      if let code = fields.first.flatMap({ Int32($0) }) { style.setParsedFontStretch(code) }

    case "width":
      if let v = declaration.dimension() { style.width = v }
    case "height":
      if let v = declaration.dimension() { style.height = v }
    case "min-width":
      if let v = declaration.dimension() { style.minWidth = v }
    case "min-height":
      if let v = declaration.dimension() { style.minHeight = v }
    case "max-width":
      if let v = declaration.dimension() { style.maxWidth = v }
    case "max-height":
      if let v = declaration.dimension() { style.maxHeight = v }
      
    case "border":
      if fields.count == CssBorderResultRecord.stride {
        let widths = (0..<4).map { declaration.length($0) ?? .Points(3) }
        let borderStyle = Int8(fields[CssBorderResultRecord.style]).flatMap(CSSBorderRenderer.BorderStyle.init(rawValue:))
        let color = UInt32(fields[CssBorderResultRecord.color]).map(UIColor.colorFromARGB)
        style.mBorderRender.applyResolvedBorder(value, widths: widths, borderStyle: borderStyle, color: color)
      }
    case "border-left", "border-right", "border-top", "border-bottom":
      if fields.count == CssBorderSideResultRecord.stride {
        let side: CSSBorderRenderer.Side = switch declaration.name {
        case "border-left": .left
        case "border-right": .right
        case "border-top": .top
        default: .bottom
        }
        let borderStyle = Int8(fields[CssBorderSideResultRecord.style]).flatMap(CSSBorderRenderer.BorderStyle.init(rawValue:))
        let color = UInt32(fields[CssBorderSideResultRecord.color]).map(UIColor.colorFromARGB)
        style.mBorderRender.applyResolvedBorderSide(side, width: declaration.length() ?? .Points(3),
          borderStyle: borderStyle, color: color)
      }
    case "padding":
      if let rect = rect(declaration.length) { style.padding = rect }
    case "padding-left":
      if let v = declaration.length() { style.paddingLeft = v }
    case "padding-right":
      if let v = declaration.length() { style.paddingRight = v }
    case "padding-top":
      if let v = declaration.length() { style.paddingTop = v }
    case "padding-bottom":
      if let v = declaration.length() { style.paddingBottom = v }

    case "margin":
      if let rect = rect(declaration.autoLength) { style.margin = rect }
    case "margin-left":
      if let v = declaration.autoLength() { style.marginLeft = v }
    case "margin-right":
      if let v = declaration.autoLength() { style.marginRight = v }
    case "margin-top":
      if let v = declaration.autoLength() { style.marginTop = v }
    case "margin-bottom":
      if let v = declaration.autoLength() { style.marginBottom = v }

    case "position":
      if let code = declaration.code, let keyword = Position(rawValue: code) {
        style.position = keyword
      }

    case "overflow":
      if fields.count == 2, let x = Int8(fields[0]).flatMap(Overflow.init(rawValue:)),
         let y = Int8(fields[1]).flatMap(Overflow.init(rawValue:)) {
        style.overflow = MasonPoint(x, y)
      }
    case "overflow-x":
      if let o = declaration.code.flatMap(Overflow.init(rawValue:)) { style.overflowX = o }
    case "overflow-y":
      if let o = declaration.code.flatMap(Overflow.init(rawValue:)) { style.overflowY = o }

    case "text-align":
      if let code = declaration.code, let keyword = TextAlign(rawValue: code) {
        style.textAlign = keyword
      }

    // MARK: Additional flex / grid alignment

    case "align-content":
      if let code = declaration.code, let keyword = AlignContent(rawValue: code) {
        style.alignContent = keyword
      }

    case "justify-items":
      if let code = declaration.code, let keyword = JustifyItems(rawValue: code) {
        style.justifyItems = keyword
      }

    case "justify-self":
      if let code = declaration.code, let keyword = JustifySelf(rawValue: code) {
        style.justifySelf = keyword
      }

    case "flex-basis":
      if let v = declaration.dimension() { style.flexBasis = v }

    case "row-gap":
      if let v = declaration.length() { style.gap = MasonSize(v, style.gap.height) }
    case "column-gap":
      if let v = declaration.length() { style.gap = MasonSize(style.gap.width, v) }

    // MARK: Positioning

    case "inset":
      if let rect = rect(declaration.autoLength) { style.inset = rect }
    case "top":
      if let v = declaration.autoLength() { style.topInset = v }
    case "right":
      if let v = declaration.autoLength() { style.rightInset = v }
    case "bottom":
      if let v = declaration.autoLength() { style.bottomInset = v }
    case "left":
      if let v = declaration.autoLength() { style.leftInset = v }

    case "aspect-ratio":
      style.aspectRatio = fields.first.flatMap { Float($0) }

    case "box-sizing":
      if let code = declaration.code, let keyword = BoxSizing(rawValue: code) {
        style.boxSizing = keyword
      }

    case "direction":
      if let code = declaration.code, let keyword = Direction(rawValue: code) {
        style.direction = keyword
      }

    // MARK: Grid

    case "grid-template-columns": style.gridTemplateColumns = value
    case "grid-template-rows": style.gridTemplateRows = value
    case "grid-template-areas": style.gridTemplateAreas = value
    case "grid-auto-rows": style.gridAutoRows = value
    case "grid-auto-columns": style.gridAutoColumns = value
    case "grid-auto-flow":
      if let code = declaration.code, let keyword = GridAutoFlow(rawValue: code) {
        style.gridAutoFlow = keyword
      }
    case "grid-column": style.gridColumn = value
    case "grid-row": style.gridRow = value
    case "grid-area": style.gridArea = value
    case "grid-column-start": style.gridColumnStart = value
    case "grid-column-end": style.gridColumnEnd = value
    case "grid-row-start": style.gridRowStart = value
    case "grid-row-end": style.gridRowEnd = value

    // MARK: Visual (pass-through CSS string parsers)

    case "border-radius":
      style.setCompiledBorderRadius(value, radii: (0..<BorderRadiiRecord.stride).compactMap(declaration.length))
    case "border-image": style.borderImage = value
    case "corner-shape": style.cornerShape = value
    case "corner-shape-top-left": style.cornerShapeTopLeft = value
    case "corner-shape-top-right": style.cornerShapeTopRight = value
    case "corner-shape-bottom-right": style.cornerShapeBottomRight = value
    case "corner-shape-bottom-left": style.cornerShapeBottomLeft = value
    case "effect-values":
      if let fontSize = Float(value) { style.applyCompiledEffects(fields, initialColor: initialColor, fontSize: fontSize) }
    case "transform": style.transform = value
    case "transform-origin":
      if fields.count == CssPositionResultRecord.stride,
         let x = Float(fields[CssPositionResultRecord.xValue]), let y = Float(fields[CssPositionResultRecord.yValue]) {
        style.transformOrigin = (
          fields[CssPositionResultRecord.xType] == "1" ? .Percent(x / 100) : .Points(x),
          fields[CssPositionResultRecord.yType] == "1" ? .Percent(y / 100) : .Points(y)
        )
      }
    case "background-values":
      if let fontSize = Float(value) { style.mBackground.applyCompiled(fields, initialColor: initialColor, fontSize: fontSize) }
    case "mask-values": style.applyCompiledMask(fields)

    case "z-index":
      if let v = fields.first.flatMap({ Int32($0) }) { style.zIndex = v }

    case "float":
      if let code = declaration.code, let keyword = MasonFloat(rawValue: code) {
        style.float = keyword
      }

    case "clear":
      if let code = declaration.code, let keyword = Clear(rawValue: code) {
        style.clear = keyword
      }

    case "object-fit":
      if let code = declaration.code, let keyword = ObjectFit(rawValue: code) {
        style.objectFit = keyword
      }

    case "list-style-type":
      if let keyword = declaration.code.flatMap(ListStyleType.init(rawValue:)) { style.listStyleType = keyword }
    case "list-style-position":
      if let keyword = declaration.code.flatMap(ListStylePosition.init(rawValue:)) { style.listStylePosition = keyword }

    // MARK: Text / font

    case "font-family":
      style.setParsedFontFamilies(fields)
    case "font-style":
      style.setParsedFontStyle(fields)
    case "line-height":
      if let amount = declaration.amount(), let kind = declaration.lengthKind() { style.setResolvedLineHeight(amount, kind: kind) }
    case "letter-spacing":
      if let amount = declaration.amount() { style.letterSpacing = amount }
    case "word-spacing":
      if let amount = declaration.amount(), let kind = declaration.code { style.setResolvedWordSpacing(amount, kind: UInt8(bitPattern: kind)) }
    case "text-indent":
      if let amount = declaration.amount() { style.textIndent = declaration.lengthKind() == 2 ? .Percent(amount) : .Points(amount) }
    case "vertical-align":
      if let kind = declaration.lengthKind(), let amount = declaration.amount() {
        style.setResolvedVerticalAlign(kind, amount)
      }
    case "font-feature-settings":
      style.fontFeatureSettings = value
    case "font-variant-numeric":
      if let code = fields.first.flatMap({ UInt8($0) }) {
        style.fontVariantNumeric = FontVariantNumeric(rawValue: code)
      }

    case "text-decoration":
      if fields.count == TextDecorationRecord.stride, let thickness = Float(fields[TextDecorationRecord.thickness]) {
        style.setParsedTextDecoration(fields, thickness: thickness)
      }
    case "text-decoration-line":
      if let line = declaration.code.flatMap(DecorationLine.init(rawValue:)) { style.decorationLine = line }
    case "text-decoration-color":
      if let color = fields.first.flatMap({ UInt32($0) }) { style.decorationColor = color }
    case "text-decoration-style":
      if let decoration = declaration.code.flatMap(DecorationStyle.init(rawValue:)) { style.decorationStyle = decoration }
    case "text-decoration-thickness":
      if let thickness = fields.first.flatMap({ Float($0) }) { style.decorationThickness = thickness }

    case "text-transform":
      if let code = declaration.code, let keyword = TextTransform(rawValue: code) {
        style.textTransform = keyword
      }

    case "white-space":
      if let code = declaration.code, let keyword = WhiteSpace(rawValue: code) {
        style.whiteSpace = keyword
      }

    case "text-wrap":
      if let code = declaration.code, let keyword = TextWrap(rawValue: code) {
        style.textWrap = keyword
      }

    case "hyphens":
      if let code = declaration.code { style.hyphens = UInt8(bitPattern: code) }
    case "writing-mode":
      if let code = declaration.code { style.writingMode = UInt8(bitPattern: code) }
    case "unicode-bidi":
      if let code = declaration.code { style.unicodeBidi = UInt8(bitPattern: code) }
    case "text-orientation":
      if let code = declaration.code { style.textOrientation = UInt8(bitPattern: code) }
    case "text-combine-upright":
      if let code = declaration.code { style.textCombineUpright = UInt8(bitPattern: code) }
    case "text-spacing-trim":
      if let code = declaration.code { style.textSpacingTrim = UInt8(bitPattern: code) }
    case "line-clamp", "-webkit-line-clamp":
      if let lines = fields.first.flatMap({ Int32($0) }) { style.lineClamp = lines }

    case "text-overflow":
      switch declaration.code {
      case 0: style.textOverflow = .Clip
      case 1: style.textOverflow = .Ellipse(nil)
      default: style.textOverflow = .Custom(value)
      }

    case "text-justify":
      if let keyword = declaration.code.flatMap(TextJustify.init(rawValue:)) { style.textJustify = keyword }

    default:
      break
    }
  }

  // MARK: - Value Parsers

  // Length parsing delegates to the canonical parsers (BorderParser.swift) so that
  // device-scale and percentage handling match every other code path (margins,
  // borders, etc.).

  private func parseDimensionAuto(_ value: String) -> MasonDimension? {
    guard let lpa = parseLengthPercentageAuto(value) else { return nil }
    switch lpa {
    case .Auto: return .Auto
    case .Points(let p): return .Points(p)
    case .Percent(let p): return .Percent(p)
    case .Zero: return .Points(0)
    }
  }

  /// First whitespace-delimited token of a value (e.g. the line keyword of a
  /// `text-decoration` shorthand).
  // MARK: - Input Type Mapping

  private func mapInputType(_ type: String?) -> MasonInputType {
    guard let type = type else { return .Text }
    switch type.lowercased() {
    case "text": return .Text
    case "password": return .Password
    case "email": return .Email
    case "number": return .Number
    case "tel", "telephone": return .Tel
    case "url": return .Url
    case "search": return .Search
    case "date": return .Date
    case "time": return .Time
    case "datetime-local": return .DatetimeLocal
    case "month": return .Month
    case "week": return .Week
    case "color": return .Color
    case "checkbox": return .Checkbox
    case "radio": return .Radio
    case "range": return .Range
    case "file": return .File
    case "submit": return .Submit
    case "reset": return .Reset
    case "button": return .Button
    default: return .Text
    }
  }

  // MARK: - HTML Entity Decoding

  private func decodeEntities(_ text: String) -> String {
    var result = text
    result = result.replacingOccurrences(of: "&amp;", with: "&")
    result = result.replacingOccurrences(of: "&lt;", with: "<")
    result = result.replacingOccurrences(of: "&gt;", with: ">")
    result = result.replacingOccurrences(of: "&quot;", with: "\"")
    result = result.replacingOccurrences(of: "&#39;", with: "'")
    result = result.replacingOccurrences(of: "&apos;", with: "'")
    result = result.replacingOccurrences(of: "&nbsp;", with: "\u{00A0}")
    // Numeric character references
    result = decodeNumericEntities(result)
    return result
  }

  private func decodeNumericEntities(_ text: String) -> String {
    var result = ""
    let chars = Array(text)
    let len = chars.count
    var i = 0

    while i < len {
      if chars[i] == "&" && i + 2 < len && chars[i+1] == "#" {
        var j = i + 2
        let isHex = j < len && (chars[j] == "x" || chars[j] == "X")
        if isHex { j += 1 }

        let numStart = j
        while j < len && chars[j] != ";" { j += 1 }

        if j < len && j > numStart {
          let numStr = String(chars[numStart..<j])
          let codePoint: UInt32?
          if isHex {
            codePoint = UInt32(numStr, radix: 16)
          } else {
            codePoint = UInt32(numStr)
          }

          if let cp = codePoint, let scalar = Unicode.Scalar(cp) {
            result.append(Character(scalar))
            i = j + 1
            continue
          }
        }
      }
      result.append(chars[i])
      i += 1
    }

    return result
  }
}

/// True when CSS text holds a vw/vh/vmin/vmax length.
func hasViewportUnit(_ value: String) -> Bool {
  NSCMason.expandCssShorthand("viewport-dependent", value: value) != nil
}
