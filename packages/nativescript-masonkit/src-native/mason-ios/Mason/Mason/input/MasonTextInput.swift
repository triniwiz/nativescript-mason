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

@objcMembers
@objc(MasonTextInput)
public class MasonTextInput: UITextView, UITextViewDelegate {
  internal var owner: MasonElement? = nil
  
  override init(frame: CGRect, textContainer: NSTextContainer?) {
    super.init(frame: frame, textContainer: textContainer)
    commonInit()
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    commonInit()
  }
  
  internal let placeholderLabel = UILabel()
  
  public var placeholder: String? {
    didSet { placeholderLabel.text = placeholder }
  }
  
  public override var text: String! {
    didSet { updatePlaceholder() }
  }
  
  public override var attributedText: NSAttributedString! {
    didSet { updatePlaceholder() }
  }
  
  public override var font: UIFont? {
    didSet { placeholderLabel.font = font ?? UIFont.systemFont(ofSize: UIFont.systemFontSize) }
  }
  
  public override var textAlignment: NSTextAlignment {
    didSet { placeholderLabel.textAlignment = textAlignment }
  }
  
  internal var defaultTextContainerInset: UIEdgeInsets = .zero
  
  internal var singleLineBehavior: Bool = true {
    didSet {
      applyEditorBehavior()
      setNeedsLayout()
    }
  }
  
  private func commonInit() {
    delegate = self
    // The element paints the box; text starts at its content edge, as on the web.
    backgroundColor = .clear
    textContainer.lineFragmentPadding = 0
    placeholderLabel.textColor = .placeholderText
    placeholderLabel.backgroundColor = .clear
    
    placeholderLabel.translatesAutoresizingMaskIntoConstraints = true
    placeholderLabel.isUserInteractionEnabled = false
    placeholderLabel.font = font ?? UIFont.systemFont(ofSize: UIFont.systemFontSize)
    
    addSubview(placeholderLabel)
    
    // The element's padding insets the field, so the view adds none of its own.
    defaultTextContainerInset = .zero
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(textDidChangeNotification),
      name: UITextView.textDidChangeNotification,
      object: self
    )
    applyEditorBehavior()
    updatePlaceholder()
  }
  
  internal func applyEditorBehavior() {
    isScrollEnabled = !singleLineBehavior
    textContainer.maximumNumberOfLines = singleLineBehavior ? 1 : 0
    textContainer.lineBreakMode = singleLineBehavior ? .byTruncatingTail : .byWordWrapping
    placeholderLabel.numberOfLines = singleLineBehavior ? 1 : 0
    placeholderLabel.lineBreakMode = singleLineBehavior ? .byTruncatingTail : .byWordWrapping
  }
  
  internal func setBaseTextContainerInset(_ inset: UIEdgeInsets) {
    defaultTextContainerInset = inset
    if !singleLineBehavior {
      textContainerInset = inset
    }
    setNeedsLayout()
  }
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    
    let f = font ?? placeholderLabel.font ?? UIFont.systemFont(ofSize: UIFont.systemFontSize)
    if singleLineBehavior {
      let verticalInset = max(0, (bounds.height - f.lineHeight) / 2)
      textContainerInset = UIEdgeInsets(
        top: verticalInset,
        left: defaultTextContainerInset.left,
        bottom: verticalInset,
        right: defaultTextContainerInset.right
      )
    } else {
      textContainerInset = defaultTextContainerInset
    }
    
    let left = textContainerInset.left + textContainer.lineFragmentPadding
    let right = textContainerInset.right + textContainer.lineFragmentPadding
    let maxWidth = max(0, bounds.width - left - right)
    let placeholderY = textContainerInset.top
    let phHeight = singleLineBehavior
      ? f.lineHeight
      : max(
        f.lineHeight,
        placeholderLabel.sizeThatFits(
          CGSize(width: maxWidth, height: CGFloat.greatestFiniteMagnitude)
        ).height
      )
    placeholderLabel.frame = CGRect(x: left, y: placeholderY, width: maxWidth, height: phHeight)
    
    if singleLineBehavior && contentOffset != .zero {
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
  
  
  public func textViewDidChange(_ textView: UITextView) {
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
  
  public func textViewDidBeginEditing(_ textView: UITextView) {
    guard let owner = owner else { return }
    let event = MasonEvent(type: "focus").apply { event in
      event.bubbles = true
      event.cancelable = false
    }
    event.target = owner
    owner.node.mason.dispatch(event, owner.node)
  }
  
  public func textViewDidEndEditing(_ textView: UITextView) {
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
    
    let blur = MasonEvent(type: "blur").apply { event in
      event.bubbles = true
      event.cancelable = false
    }
    blur.target = owner
    owner.node.mason.dispatch(blur, owner.node)
  }
  
  private var didPaste = false
  public override func paste(_ sender: Any?) {
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
  public override func cut(_ sender: Any?) {
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
  
  
  public func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
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
  
  public override func caretRect(for position: UITextPosition) -> CGRect {
    var rect = super.caretRect(for: position)
    // shrink width
    rect.size.width = max(0.5, caretWidth)
    if !singleLineBehavior {
      return rect
    }
    
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
