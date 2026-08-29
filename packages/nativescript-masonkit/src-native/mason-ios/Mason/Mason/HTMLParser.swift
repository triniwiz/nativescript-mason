//
//  HTMLParser.swift
//  Mason
//
//  Created by Osei Fortune on 16/03/2026.
//

import UIKit

@objcMembers
@objc(MasonHTMLParser)
public class HTMLParser: NSObject {

  private let mason: NSCMason

  public init(mason: NSCMason) {
    self.mason = mason
    super.init()
  }

  // MARK: - Public API

  /// Parses an HTML string and returns a list of root-level MasonElement/MasonNode children.
  public func parse(_ html: String) -> [MasonNode] {
    let tokens = tokenize(html)
    return buildTree(tokens)
  }

  /// Parses HTML and appends resulting children to the given element.
  public func parseInto(_ html: String, element: MasonElement) {
    let children = parse(html)
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
        let node = createElement(name: name, attributes: attributes)

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
        let trimmed = text
        if trimmed.isEmpty { continue }

        if let parent = stack.last {
          let textNode = MasonTextNode(mason: mason, data: trimmed)
          parent.node.appendChild(textNode)
        } else {
          // Top-level text — wrap in a text container
          let textView = mason.createTextView(type: .Span)
          let textNode = MasonTextNode(mason: mason, data: trimmed)
          textView.node.appendChild(textNode)
          roots.append(textView.node)
        }
      }
    }

    return roots
  }

  // MARK: - Element Factory

  private func createElement(name: String, attributes: [String: String]) -> MasonNode {
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
    case "ul":
      element = mason.createListView(isOrdered: false)
    case "ol":
      element = mason.createListView(isOrdered: true)
    case "li":
      element = mason.createListItem()

    // Self-closing / special elements
    case "br":
      element = mason.createBr()
    case "img":
      let img = mason.createImageView()
      if let src = attributes["src"] {
        img.src = src
      }
      applyAttributes(attributes, to: img)
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

    applyAttributes(attributes, to: element)
    return element.node
  }

  // MARK: - Attribute Application

  private func applyAttributes(_ attributes: [String: String], to element: MasonElement) {
    for (key, value) in attributes {
      switch key {
      case "style":
        applyInlineStyle(value, to: element)
      case "src":
        if let img = element as? Img {
          img.src = value
        }
      default:
        break
      }
    }
  }

  // MARK: - Inline Style Parsing

  private func applyInlineStyle(_ styleString: String, to element: MasonElement) {
    let declarations = styleString.split(separator: ";")
    element.configure { style in
      for declaration in declarations {
        let parts = declaration.split(separator: ":", maxSplits: 1)
        guard parts.count == 2 else { continue }
        let property = parts[0].trimmingCharacters(in: .whitespaces).lowercased()
        let value = parts[1].trimmingCharacters(in: .whitespaces)
        applyStyleProperty(property, value: value, to: style)
      }
    }
  }

  private func applyStyleProperty(_ property: String, value: String, to style: MasonStyle) {
    switch property {
    case "display":
      switch value {
      case "flex": style.display = .Flex
      case "grid": style.display = .Grid
      case "block": style.display = .Block
      case "inline": style.display = .Inline
      case "inline-block": style.display = .InlineBlock
      case "inline-flex": style.display = .InlineFlex
      case "inline-grid": style.display = .InlineGrid
      case "none": style.display = .None
      default: break
      }

    case "flex-direction":
      switch value {
      case "row": style.flexDirection = .Row
      case "column": style.flexDirection = .Column
      case "row-reverse": style.flexDirection = .RowReverse
      case "column-reverse": style.flexDirection = .ColumnReverse
      default: break
      }

    case "justify-content":
      switch value {
      case "flex-start", "start": style.justifyContent = .Start
      case "flex-end", "end": style.justifyContent = .End
      case "center": style.justifyContent = .Center
      case "space-between": style.justifyContent = .SpaceBetween
      case "space-around": style.justifyContent = .SpaceAround
      case "space-evenly": style.justifyContent = .SpaceEvenly
      default: break
      }

    case "align-items":
      switch value {
      case "flex-start", "start": style.alignItems = .Start
      case "flex-end", "end": style.alignItems = .End
      case "center": style.alignItems = .Center
      case "stretch": style.alignItems = .Stretch
      case "baseline": style.alignItems = .Baseline
      default: break
      }

    case "align-self":
      switch value {
      case "flex-start", "start": style.alignSelf = .Start
      case "flex-end", "end": style.alignSelf = .End
      case "center": style.alignSelf = .Center
      case "stretch": style.alignSelf = .Stretch
      case "baseline": style.alignSelf = .Baseline
      default: break
      }

    case "flex-wrap":
      switch value {
      case "nowrap": style.flexWrap = .NoWrap
      case "wrap": style.flexWrap = .Wrap
      case "wrap-reverse": style.flexWrap = .WrapReverse
      default: break
      }

    case "flex-grow":
      if let v = Float(value) { style.flexGrow = v }

    case "flex-shrink":
      if let v = Float(value) { style.flexShrink = v }

    case "gap":
      // `gap` accepts one value (both axes) or two (`row-gap column-gap`).
      let gapTokens = value.split(whereSeparator: { $0.isWhitespace }).map(String.init)
      if gapTokens.count >= 2,
         let row = parseDimension(gapTokens[0]),
         let column = parseDimension(gapTokens[1]) {
        style.gap = MasonSize(row, column)
      } else if let v = parseDimension(value) {
        style.gap = MasonSize(v, v)
      }

    case "color":
      if let c = parseColor(value) {
        style.color = c
      }

    case "background-color":
      if let c = parseColor(value) {
        style.backgroundColor = c
      }

    case "font-size":
      if let v = parseFloatValue(value) {
        style.fontSize = Int32(v)
      }

    case "font-weight":
      style.fontWeight = value

    case "width":
      if let v = parseDimensionAuto(value) { style.width = v }
    case "height":
      if let v = parseDimensionAuto(value) { style.height = v }
    case "min-width":
      if let v = parseDimensionAuto(value) { style.minWidth = v }
    case "min-height":
      if let v = parseDimensionAuto(value) { style.minHeight = v }
    case "max-width":
      if let v = parseDimensionAuto(value) { style.maxWidth = v }
    case "max-height":
      if let v = parseDimensionAuto(value) { style.maxHeight = v }
      
    case "border":
      style.mBorderRender.parseBorderShorthand(value)
    case "border-left":
      style.mBorderRender.parseBorderSideShorthand(.left, value)
    case "border-right":
      style.mBorderRender.parseBorderSideShorthand(.right, value)
    case "border-top":
      style.mBorderRender.parseBorderSideShorthand(.top, value)
    case "border-bottom":
      style.mBorderRender.parseBorderSideShorthand(.bottom, value)
    case "padding":
      if let v = parseDimension(value) {
        style.padding = MasonRect(v, v, v, v)
      }
    case "padding-left":
      if let v = parseDimension(value) { style.paddingLeft = v }
    case "padding-right":
      if let v = parseDimension(value) { style.paddingRight = v }
    case "padding-top":
      if let v = parseDimension(value) { style.paddingTop = v }
    case "padding-bottom":
      if let v = parseDimension(value) { style.paddingBottom = v }

    case "margin":
      if let v = parseLengthPercentageAuto(value) {
        style.margin = MasonRect(v, v, v, v)
      }
    case "margin-left":
      if let v = parseLengthPercentageAuto(value) { style.marginLeft = v }
    case "margin-right":
      if let v = parseLengthPercentageAuto(value) { style.marginRight = v }
    case "margin-top":
      if let v = parseLengthPercentageAuto(value) { style.marginTop = v }
    case "margin-bottom":
      if let v = parseLengthPercentageAuto(value) { style.marginBottom = v }

    case "position":
      switch value {
      case "relative": style.position = .Relative
      case "absolute": style.position = .Absolute
      default: break
      }

    case "overflow":
      if let o = parseOverflow(value) {
        style.overflow = MasonPoint(o, o)
      }
    case "overflow-x":
      if let o = parseOverflow(value) { style.overflowX = o }
    case "overflow-y":
      if let o = parseOverflow(value) { style.overflowY = o }

    case "text-align":
      switch value {
      case "left": style.textAlign = .Left
      case "center": style.textAlign = .Center
      case "right": style.textAlign = .Right
      case "justify": style.textAlign = .Justify
      default: break
      }

    // MARK: Additional flex / grid alignment

    case "align-content":
      switch value {
      case "flex-start", "start": style.alignContent = .Start
      case "flex-end", "end": style.alignContent = .End
      case "center": style.alignContent = .Center
      case "stretch": style.alignContent = .Stretch
      case "space-between": style.alignContent = .SpaceBetween
      case "space-around": style.alignContent = .SpaceAround
      case "space-evenly": style.alignContent = .SpaceEvenly
      case "normal": style.alignContent = .Normal
      default: break
      }

    case "justify-items":
      switch value {
      case "flex-start", "start": style.justifyItems = .Start
      case "flex-end", "end": style.justifyItems = .End
      case "center": style.justifyItems = .Center
      case "stretch": style.justifyItems = .Stretch
      case "baseline": style.justifyItems = .Baseline
      case "normal": style.justifyItems = .Normal
      default: break
      }

    case "justify-self":
      switch value {
      case "flex-start", "start": style.justifySelf = .Start
      case "flex-end", "end": style.justifySelf = .End
      case "center": style.justifySelf = .Center
      case "stretch": style.justifySelf = .Stretch
      case "baseline": style.justifySelf = .Baseline
      case "normal": style.justifySelf = .Normal
      default: break
      }

    case "flex":
      applyFlexShorthand(value, to: style)
    case "flex-basis":
      if let v = parseDimensionAuto(value) { style.flexBasis = v }

    case "row-gap":
      if let v = parseDimension(value) { style.gap = MasonSize(v, style.gap.height) }
    case "column-gap":
      if let v = parseDimension(value) { style.gap = MasonSize(style.gap.width, v) }

    // MARK: Positioning

    case "inset":
      applyInsetShorthand(value, to: style)
    case "top":
      if let v = parseLengthPercentageAuto(value) { style.topInset = v }
    case "right":
      if let v = parseLengthPercentageAuto(value) { style.rightInset = v }
    case "bottom":
      if let v = parseLengthPercentageAuto(value) { style.bottomInset = v }
    case "left":
      if let v = parseLengthPercentageAuto(value) { style.leftInset = v }

    case "aspect-ratio":
      style.aspectRatio = parseAspectRatio(value)

    case "box-sizing":
      switch value {
      case "border-box": style.boxSizing = .BorderBox
      case "content-box": style.boxSizing = .ContentBox
      default: break
      }

    case "direction":
      switch value {
      case "ltr": style.direction = .LTR
      case "rtl": style.direction = .RTL
      case "inherit": style.direction = .Inherit
      default: break
      }

    // MARK: Grid

    case "grid-template-columns": style.gridTemplateColumns = value
    case "grid-template-rows": style.gridTemplateRows = value
    case "grid-template-areas": style.gridTemplateAreas = value
    case "grid-auto-rows": style.gridAutoRows = value
    case "grid-auto-columns": style.gridAutoColumns = value
    case "grid-auto-flow":
      switch value {
      case "row": style.gridAutoFlow = .Row
      case "column": style.gridAutoFlow = .Column
      case "row dense", "dense row", "dense": style.gridAutoFlow = .RowDense
      case "column dense", "dense column": style.gridAutoFlow = .ColumnDense
      default: break
      }
    case "grid-column": style.gridColumn = value
    case "grid-row": style.gridRow = value
    case "grid-area": style.gridArea = value
    case "grid-column-start": style.gridColumnStart = value
    case "grid-column-end": style.gridColumnEnd = value
    case "grid-row-start": style.gridRowStart = value
    case "grid-row-end": style.gridRowEnd = value

    // MARK: Visual (pass-through CSS string parsers)

    case "border-radius": style.borderRadius = value
    case "corner-shape": style.cornerShape = value
    case "box-shadow": style.boxShadow = value
    case "text-shadow": style.textShadow = value
    case "filter": style.filter = value
    case "backdrop-filter": style.backdropFilter = value
    case "transform": style.transform = value
    case "background": style.background = value
    case "background-image": style.backgroundImage = value
    case "background-repeat": style.backgroundRepeat = value
    case "background-position": style.backgroundPosition = value
    case "background-size": style.backgroundSize = value

    case "z-index":
      if let v = Int32(value) { style.zIndex = v }

    case "float":
      switch value {
      case "none": style.float = .None
      case "left": style.float = .Left
      case "right": style.float = .Right
      default: break
      }

    case "clear":
      switch value {
      case "none": style.clear = .None
      case "left": style.clear = .Left
      case "right": style.clear = .Right
      case "both": style.clear = .Both
      default: break
      }

    case "object-fit":
      switch value {
      case "fill": style.objectFit = .Fill
      case "contain": style.objectFit = .Contain
      case "cover": style.objectFit = .Cover
      case "none": style.objectFit = .None
      case "scale-down": style.objectFit = .ScaleDown
      default: break
      }

    case "list-style-type": style.applyListStyleType(value)
    case "list-style-position": style.applyListStylePosition(value)

    // MARK: Text / font

    case "font-family":
      style.fontFamily = value
    case "font-style":
      switch value {
      case "italic": style.setFontStyle(.Italic, 0)
      case "oblique": style.setFontStyle(.Oblique, 0)
      case "normal": style.setFontStyle(.Normal, 0)
      default: break
      }
    case "line-height":
      if value != "normal", let v = parseFloatValue(value) { style.lineHeight = v }
    case "letter-spacing":
      if value == "normal" {
        style.letterSpacing = 0
      } else if let v = parseFloatValue(value) {
        style.letterSpacing = v
      }
    case "font-variant-numeric":
      style.fontVariantNumericString = value

    case "text-decoration", "text-decoration-line":
      // The shorthand may carry color/style too; the line keyword is handled here
      // and the dedicated longhands below cover the rest.
      style.setTextDecoration(firstToken(value))
    case "text-decoration-color":
      style.setDecorationColor(css: value)

    case "text-transform":
      switch value {
      case "none": style.textTransform = .None
      case "capitalize": style.textTransform = .Capitalize
      case "uppercase": style.textTransform = .Uppercase
      case "lowercase": style.textTransform = .Lowercase
      default: break
      }

    case "white-space":
      switch value {
      case "normal": style.whiteSpace = .Normal
      case "pre": style.whiteSpace = .Pre
      case "pre-wrap": style.whiteSpace = .PreWrap
      case "pre-line": style.whiteSpace = .PreLine
      case "nowrap": style.whiteSpace = .NoWrap
      case "break-spaces": style.whiteSpace = .BreakSpaces
      default: break
      }

    case "text-wrap":
      switch value {
      case "wrap": style.textWrap = .Wrap
      case "nowrap": style.textWrap = .NoWrap
      case "balance": style.textWrap = .Balance
      case "pretty": style.textWrap = .Pretty
      default: break
      }

    case "text-overflow":
      switch value {
      case "clip": style.textOverflow = .Clip
      case "ellipsis": style.textOverflow = .Ellipse(nil)
      default: style.textOverflow = .Custom(value)
      }

    case "text-justify":
      switch value {
      case "none": style.textJustify = .None
      case "auto": style.textJustify = .Auto
      case "inter-word": style.textJustify = .InterWord
      case "inter-character": style.textJustify = .InterCharacter
      case "distribute": style.textJustify = .Distribute
      default: break
      }

    default:
      break
    }
  }

  // MARK: - Value Parsers

  // Length parsing delegates to the canonical parsers (BorderParser.swift) so that
  // device-scale and percentage handling match every other code path (margins,
  // borders, etc.). Doing the math locally previously left width/padding unscaled
  // while margins were scaled.

  private func parseDimension(_ value: String) -> MasonLengthPercentage? {
    return parseLengthPercentage(value)
  }

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
  private func firstToken(_ value: String) -> String {
    return value.split(whereSeparator: { $0.isWhitespace }).first.map(String.init) ?? value
  }

  private func parseOverflow(_ value: String) -> Overflow? {
    switch value {
    case "visible": return .Visible
    case "hidden": return .Hidden
    case "scroll": return .Scroll
    case "clip": return .Clip
    case "auto": return .Auto
    default: return nil
    }
  }

  /// Parses `aspect-ratio` as either a ratio (`16 / 9`) or a single number (`1.5`).
  private func parseAspectRatio(_ value: String) -> Float? {
    let v = value.lowercased()
    if v == "auto" { return nil }
    if v.contains("/") {
      let parts = v.split(separator: "/")
      if parts.count == 2,
         let w = Float(parts[0].trimmingCharacters(in: .whitespaces)),
         let h = Float(parts[1].trimmingCharacters(in: .whitespaces)),
         h != 0 {
        return w / h
      }
      return nil
    }
    return Float(v)
  }

  /// Parses the `flex` shorthand (`none`, `auto`, `<grow>`, `<grow> <shrink>`,
  /// `<grow> <shrink> <basis>`, `<grow> <basis>`).
  private func applyFlexShorthand(_ value: String, to style: MasonStyle) {
    let v = value.trimmingCharacters(in: .whitespaces).lowercased()
    switch v {
    case "none":
      style.flexGrow = 0; style.flexShrink = 0; style.flexBasis = .Auto
      return
    case "auto":
      style.flexGrow = 1; style.flexShrink = 1; style.flexBasis = .Auto
      return
    case "initial":
      style.flexGrow = 0; style.flexShrink = 1; style.flexBasis = .Auto
      return
    default: break
    }

    let tokens = v.split(whereSeparator: { $0.isWhitespace }).map(String.init)
    var grow: Float? = nil
    var shrink: Float? = nil
    var basis: MasonDimension? = nil

    for token in tokens {
      // A plain unitless number is a grow/shrink factor; anything else is a basis.
      if token == "auto" || token.hasSuffix("%") || token.hasSuffix("px") {
        basis = parseDimensionAuto(token)
      } else if let n = Float(token) {
        if grow == nil { grow = n } else if shrink == nil { shrink = n }
      } else {
        basis = parseDimensionAuto(token)
      }
    }

    style.flexGrow = grow ?? 1
    style.flexShrink = shrink ?? 1
    // `flex: 1` resolves basis to 0; an explicit basis token overrides that.
    style.flexBasis = basis ?? .Points(0)
  }

  /// Parses the `inset` shorthand (1–4 length/percentage/auto values, CSS order
  /// top / right / bottom / left).
  private func applyInsetShorthand(_ value: String, to style: MasonStyle) {
    let tokens = value.split(whereSeparator: { $0.isWhitespace }).map(String.init)
    let parsed = tokens.compactMap { parseLengthPercentageAuto($0) }
    guard !parsed.isEmpty else { return }

    let top = parsed[0]
    let right = parsed.count > 1 ? parsed[1] : top
    let bottom = parsed.count > 2 ? parsed[2] : top
    let left = parsed.count > 3 ? parsed[3] : right
    style.inset = MasonRect(top, right, bottom, left)
  }

  private func parseFloatValue(_ value: String) -> Float? {
    if value.hasSuffix("px") {
      return Float(value.dropLast(2))
    } else if value.hasSuffix("pt") {
      return Float(value.dropLast(2))
    } else if value.hasSuffix("em") {
      if let v = Float(value.dropLast(2)) {
        return v * 16 // approximate em to px
      }
    } else if value.hasSuffix("rem") {
      if let v = Float(value.dropLast(3)) {
        return v * 16
      }
    }
    return Float(value)
  }

  private func parseColor(_ value: String) -> UInt32? {
    // Prefer the canonical CSS color parser (handles rgb()/rgba()/hsl() and the
    // full named-color set); fall back to the local hex/named handling below.
    if let color = UIColor(css: value.trimmingCharacters(in: .whitespaces)) {
      return color.toUInt32()
    }

    var hex = value.trimmingCharacters(in: .whitespaces)
    if hex.hasPrefix("#") {
      hex = String(hex.dropFirst())
    } else {
      // Named colors
      return namedColor(hex)
    }

    var rgba: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&rgba)

    switch hex.count {
    case 3:
      // #RGB -> #RRGGBB
      let r = (rgba >> 8) & 0xF
      let g = (rgba >> 4) & 0xF
      let b = rgba & 0xF
      let red = (r * 0x11) << 16
      let green = (g * 0x11) << 8
      let blue = (b * 0x11)
      return UInt32(0xFF000000 | red | green | blue)
    case 6:
      // #RRGGBB
      return UInt32(0xFF000000 | rgba)
    case 8:
      // #RRGGBBAA
      let r = (rgba >> 24) & 0xFF
      let g = (rgba >> 16) & 0xFF
      let b = (rgba >> 8) & 0xFF
      let a = rgba & 0xFF
      return UInt32(a << 24 | r << 16 | g << 8 | b)
    default:
      return nil
    }
  }

  private func namedColor(_ name: String) -> UInt32? {
    switch name.lowercased() {
    case "black": return 0xFF000000
    case "white": return 0xFFFFFFFF
    case "red": return 0xFFFF0000
    case "green": return 0xFF008000
    case "blue": return 0xFF0000FF
    case "yellow": return 0xFFFFFF00
    case "cyan": return 0xFF00FFFF
    case "magenta": return 0xFFFF00FF
    case "gray", "grey": return 0xFF808080
    case "orange": return 0xFFFFA500
    case "purple": return 0xFF800080
    case "transparent": return 0x00000000
    default: return nil
    }
  }

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
