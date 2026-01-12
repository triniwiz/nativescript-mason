//
//  MasonTextInput.swift
//  Mason
//
//  Created by Osei Fortune on 07/01/2026.
//

import UIKit


internal func mapTextInputType(
  current: String,
  range: NSRange,
  replacement: String
) -> String {
  
  if replacement.isEmpty && range.length > 0 {
    return "deleteContentBackward"
  }
  
  if range.length > 0 {
    return "insertReplacementText"
  }
  
  return "insertText"
}

class MasonTextInput: UITextView, UITextViewDelegate {
  internal var owner: MasonElement? = nil
  
  override init(frame: CGRect, textContainer: NSTextContainer?) {
    super.init(frame: frame, textContainer: textContainer)
    commonInit()
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    commonInit()
  }
  
  private let placeholderLabel = UILabel()
  
  var placeholder: String? {
    didSet { placeholderLabel.text = placeholder }
  }
  
  override var text: String! {
    didSet { updatePlaceholder() }
  }
  
  override var attributedText: NSAttributedString! {
    didSet { updatePlaceholder() }
  }
  
  override var font: UIFont? {
    didSet { placeholderLabel.font = font ?? UIFont.systemFont(ofSize: UIFont.systemFontSize) }
  }
  
  override var textAlignment: NSTextAlignment {
    didSet { placeholderLabel.textAlignment = textAlignment }
  }
  
  private var defaultTextContainerInset: UIEdgeInsets = .zero
  
  private func commonInit() {
    delegate = self
    isScrollEnabled = false
    textContainer.maximumNumberOfLines = 1
    textContainer.lineBreakMode = .byTruncatingTail
    
    placeholderLabel.textColor = .placeholderText
    placeholderLabel.numberOfLines = 1
    placeholderLabel.lineBreakMode = .byTruncatingTail
    placeholderLabel.backgroundColor = .clear
    
    placeholderLabel.translatesAutoresizingMaskIntoConstraints = true
    placeholderLabel.isUserInteractionEnabled = false
    placeholderLabel.font = font ?? UIFont.systemFont(ofSize: UIFont.systemFontSize)
    
    addSubview(placeholderLabel)
    
    // remember original insets so we can preserve left/right padding
    defaultTextContainerInset = textContainerInset
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(textDidChangeNotification),
      name: UITextView.textDidChangeNotification,
      object: self
    )
    updatePlaceholder()
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    
    // For single-line behavior, vertically center text by adjusting top/bottom inset
    let f = font ?? placeholderLabel.font ?? UIFont.systemFont(ofSize: UIFont.systemFontSize)
    let verticalInset = max(0, (bounds.height - f.lineHeight) / 2)
    // preserve original left/right insets
    textContainerInset = UIEdgeInsets(
      top: verticalInset,
      left: defaultTextContainerInset.left,
      bottom: verticalInset,
      right: defaultTextContainerInset.right
    )
    
    // position placeholder using insets and lineFragmentPadding; limit placeholder to single-line height
    let left = textContainerInset.left + textContainer.lineFragmentPadding
    let right = textContainerInset.right + textContainer.lineFragmentPadding
    let maxWidth = max(0, bounds.width - left - right)
    let phHeight = f.lineHeight
    placeholderLabel.frame = CGRect(x: left, y: verticalInset, width: maxWidth, height: phHeight)
    
    // ensure no unexpected content offset so caret aligns predictably
    if contentOffset != .zero {
      contentOffset = .zero
    }
  }
  
  @objc private func textDidChangeNotification() {
    updatePlaceholder()
  }
  
  private func updatePlaceholder() {
    let currentText = (text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    let hasText = !currentText.isEmpty || (attributedText?.length ?? 0) > 0
    placeholderLabel.isHidden = hasText
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
  }
  
  private var lastInputType: String? = nil
  
  
  func textViewDidChange(_ textView: UITextView) {
    guard let owner = owner else { return }
    
    let event = MasonInputEvent(
      type: "input",
      data: textView.text,
      inputType: lastInputType ?? "insertText",
      options: MasonEventOptions(
        isComposing: true
      )
    ).apply{ event in
      event.bubbles = true
      event.cancelable = false
    }
    event.target = owner
    owner.node.mason.dispatch(event, owner.node)
    
    lastInputType = nil
  }
  
  func textViewDidEndEditing(_ textView: UITextView) {
    guard let owner = owner else { return }
    
    let event = MasonEvent(
      type: "change",
      options: MasonEventOptions(
        isComposing: true
      )
    ).apply{ event in
      event.bubbles = true
      event.cancelable = false
    }
    event.target = owner
    owner.node.mason.dispatch(event, owner.node)
  }
  
  private var didPaste = false
  override func paste(_ sender: Any?) {
    didPaste = true
    
    guard let owner = owner else {
      super.paste(sender)
      return
    }
    
    let event = MasonInputEvent(
      type: "beforeinput",
      data: nil,
      inputType: "insertFromPaste",
      options: MasonEventOptions(
        isComposing: true,
      )
    ).apply{ event in
      event.bubbles = true
      event.cancelable = true
    }
    
    event.target = owner
    
    owner.node.mason.dispatch(event,owner.node)
    
    if(!event.defaultPrevented){
      super.paste(sender)
    }
  }
  
  private var didCut = false
  override func cut(_ sender: Any?) {
    didCut = true
    guard let owner = owner else {
      super.cut(sender)
      return
    }
    
    let event = MasonInputEvent(
      type: "beforeinput",
      data: nil,
      inputType: "deleteByCut",
      options: MasonEventOptions(
        isComposing: true,
      )
    ).apply{ event in
      event.bubbles = true
      event.cancelable = true
    }
    
    event.target = owner
    
    owner.node.mason.dispatch(event,owner.node)
    
    if(!event.defaultPrevented){
      super.cut(sender)
    }
  }
  
  
  func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
    let isRedoingOrUndoing = textView.undoManager?.isRedoing ?? false || textView.undoManager?.isUndoing ?? false
    
    if (didCut) {
      didCut = false
      // skip insert emit
      if (!isRedoingOrUndoing) {
        return true
      }
    }
    
    if (didPaste) {
      didPaste = false
      // skip insert emit
      if (!isRedoingOrUndoing) {
        return true
      }
    }
    
    guard let owner = owner else { return true }
    var type = mapTextInputType(current: textView.text ?? "", range: range, replacement: text)
    
    if let undoManager = textView.undoManager {
      if (undoManager.isUndoing) {
        type = "historyUndo"
      }
      
      if (undoManager.isRedoing) {
        type = "historyRedo"
      }
    }
    
    lastInputType = type
    
    let event = MasonInputEvent(
      type: "beforeinput",
      data: nil,
      inputType: type,
      options: MasonEventOptions(
        isComposing: true,
      )
    ).apply{ event in
      event.bubbles = true
      event.cancelable = true
    }
    
    event.target = owner
    
    owner.node.mason.dispatch(event, owner.node)
    
    return !event.defaultPrevented
  }
  
  // MARK: - Caret customization
  /// Width of the caret. Default is 1.0. Set to a smaller value to reduce thickness.
  var caretWidth: CGFloat = 1.0
  /// Optional explicit caret height. If nil, the caret height is derived from the font's capHeight.
  var caretHeight: CGFloat? = nil
  
  override func caretRect(for position: UITextPosition) -> CGRect {
    var rect = super.caretRect(for: position)
    // shrink width
    rect.size.width = max(0.5, caretWidth)
    
    // derive a sensible caret height from font metrics (prefer capHeight)
    let lineHeight = font?.lineHeight ?? placeholderLabel.font.lineHeight
    let cap = font?.capHeight ?? (lineHeight * 0.7)
    let desiredHeight = caretHeight ?? max(1.0, cap + 2.0)
    
    // clamp to line height
    let finalHeight = min(desiredHeight, lineHeight)
    
    // vertically center the caret relative to the visible single-line area
    let verticalInset = textContainerInset.top
    rect.size.height = finalHeight
    rect.origin.y = verticalInset + (lineHeight - finalHeight) / 2
    
    return rect
  }
}
