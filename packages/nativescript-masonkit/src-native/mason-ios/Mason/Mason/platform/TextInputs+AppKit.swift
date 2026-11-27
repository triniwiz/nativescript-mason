#if os(macOS)
import AppKit

public typealias UITextView = MasonTextInput

final class TextInputEvents {
  weak var owner: MasonElement?
  private var lastInputType: String?
  private var skipNextChange = false

  private func dispatch(_ event: MasonEvent) -> Bool {
    guard let owner else { return true }
    event.target = owner
    owner.node.mason.dispatch(event, owner.node)
    return !event.defaultPrevented
  }

  private func simple(_ type: String) -> MasonEvent {
    MasonEvent(type: type).apply {
      $0.bubbles = true
      $0.cancelable = false
    }
  }

  private func beforeInput(_ inputType: String) -> Bool {
    dispatch(MasonInputEvent(type: "beforeinput", data: nil, inputType: inputType, options: MasonEventOptions(isComposing: true)).apply {
      $0.bubbles = true
      $0.cancelable = true
    })
  }

  func began() {
    _ = dispatch(simple("focus"))
  }

  func ended() {
    _ = dispatch(MasonEvent(type: "change", options: MasonEventOptions(isComposing: true)).apply {
      $0.bubbles = true
      $0.cancelable = false
    })
    _ = dispatch(simple("blur"))
  }

  func changed(_ text: String) {
    _ = dispatch(MasonInputEvent(type: "input", data: text, inputType: lastInputType ?? "insertText", options: MasonEventOptions(isComposing: true)).apply {
      $0.bubbles = true
      $0.cancelable = false
    })
    lastInputType = nil
  }

  func clipboard(_ inputType: String) -> Bool {
    guard beforeInput(inputType) else { return false }
    lastInputType = inputType
    skipNextChange = true
    return true
  }

  func shouldChange(_ current: String, _ range: NSRange, _ replacement: String, undoManager: UndoManager?) -> Bool {
    if skipNextChange {
      skipNextChange = false
      return true
    }
    var type = mapTextInputType(current: current, range: range, replacement: replacement)
    if undoManager?.isUndoing == true { type = "historyUndo" }
    if undoManager?.isRedoing == true { type = "historyRedo" }
    lastInputType = type
    return beforeInput(type)
  }
}

final class MasonEditorTextView: NSTextView {
  weak var input: MasonTextInput?

  override func paste(_ sender: Any?) {
    guard input?.events.clipboard("insertFromPaste") ?? true else { return }
    super.paste(sender)
  }

  override func cut(_ sender: Any?) {
    guard input?.events.clipboard("deleteByCut") ?? true else { return }
    super.cut(sender)
  }

  override func insertNewline(_ sender: Any?) {
    if input?.singleLineBehavior == true {
      window?.makeFirstResponder(nil)
    } else {
      super.insertNewline(sender)
    }
  }

  override func insertTab(_ sender: Any?) {
    if input?.singleLineBehavior == true {
      window?.selectNextKeyView(sender)
    } else {
      super.insertTab(sender)
    }
  }

  override func becomeFirstResponder() -> Bool {
    let ok = super.becomeFirstResponder()
    if ok, let input { input.events.began() }
    return ok
  }

  override func mouseDown(with event: NSEvent) {
    super.mouseDown(with: event)
    MasonGestureRecognizer.finishTrackedClick(self, down: event)
  }
}

private final class PlaceholderLabel: NSTextField {
  override func hitTest(_ point: NSPoint) -> NSView? { nil }
}

@objcMembers
@objc(MasonTextInput)
public class MasonTextInput: MasonViewBase, NSTextViewDelegate {
  internal let events = TextInputEvents()
  internal var owner: MasonElement? {
    get { events.owner }
    set { events.owner = newValue }
  }

  private let scrollView = NSScrollView()
  private let editor: MasonEditorTextView
  internal let placeholderLabel: NSTextField = PlaceholderLabel(labelWithString: "")

  public init(frame: CGRect, textContainer: NSTextContainer?) {
    editor = MasonEditorTextView(frame: CGRect(origin: .zero, size: frame.size))
    super.init(frame: frame)
    commonInit()
  }

  public convenience init() {
    self.init(frame: .zero, textContainer: nil)
  }

  public override convenience init(frame frameRect: NSRect) {
    self.init(frame: frameRect, textContainer: nil)
  }

  required init?(coder: NSCoder) {
    editor = MasonEditorTextView(frame: .zero)
    super.init(coder: coder)
    commonInit()
  }

  private func commonInit() {
    editor.input = self
    editor.delegate = self
    editor.drawsBackground = false
    editor.isRichText = false
    editor.allowsUndo = true
    editor.textContainerInset = .zero
    editor.textContainer?.lineFragmentPadding = 0
    editor.isAutomaticQuoteSubstitutionEnabled = false
    editor.isAutomaticDashSubstitutionEnabled = false
    editor.isAutomaticTextReplacementEnabled = false

    scrollView.drawsBackground = false
    scrollView.borderType = .noBorder
    scrollView.hasVerticalScroller = false
    scrollView.hasHorizontalScroller = false
    scrollView.documentView = editor
    addSubview(scrollView)

    placeholderLabel.textColor = .placeholderTextColor
    placeholderLabel.isEditable = false
    placeholderLabel.isSelectable = false
    placeholderLabel.drawsBackground = false
    placeholderLabel.isBordered = false
    addSubview(placeholderLabel)

    font = UIFont.systemFont(ofSize: UIFont.systemFontSize)
    applyEditorBehavior()
    updatePlaceholder()
  }

  public var text: String! {
    get { editor.string }
    set {
      editor.string = newValue ?? ""
      updatePlaceholder()
    }
  }

  public var placeholder: String? {
    didSet { placeholderLabel.stringValue = placeholder ?? "" }
  }

  public var font: UIFont? {
    get { editor.font }
    set {
      editor.font = newValue
      editor.typingAttributes[.font] = newValue
      placeholderLabel.font = newValue ?? UIFont.systemFont(ofSize: UIFont.systemFontSize)
      needsLayout = true
    }
  }

  public var textColor: UIColor? {
    get { editor.textColor }
    set {
      editor.textColor = newValue
      editor.typingAttributes[.foregroundColor] = newValue
    }
  }

  public var tintColor: UIColor? {
    get { editor.insertionPointColor }
    set { editor.insertionPointColor = newValue ?? .textColor }
  }

  public var textAlignment: NSTextAlignment {
    get { editor.alignment }
    set {
      editor.alignment = newValue
      placeholderLabel.alignment = newValue
    }
  }

  public var isEditable: Bool {
    get { editor.isEditable }
    set { editor.isEditable = newValue }
  }

  public var isSelectable: Bool {
    get { editor.isSelectable }
    set { editor.isSelectable = newValue }
  }

  public var textContainer: NSTextContainer { editor.textContainer! }

  public var textContainerInset: UIEdgeInsets = .zero {
    didSet { needsLayout = true }
  }

  public var isScrollEnabled = false {
    didSet { scrollView.hasVerticalScroller = isScrollEnabled && !singleLineBehavior }
  }

  public var contentOffset: CGPoint {
    get { scrollView.contentView.bounds.origin }
    set { scrollView.contentView.scroll(to: newValue) }
  }

  internal var defaultTextContainerInset: UIEdgeInsets = .zero

  internal var singleLineBehavior = true {
    didSet {
      applyEditorBehavior()
      needsLayout = true
    }
  }

  internal func applyEditorBehavior() {
    guard let container = editor.textContainer else { return }
    let big = CGFloat.greatestFiniteMagnitude
    container.maximumNumberOfLines = singleLineBehavior ? 1 : 0
    container.lineBreakMode = singleLineBehavior ? .byClipping : .byWordWrapping
    container.widthTracksTextView = !singleLineBehavior
    editor.isHorizontallyResizable = singleLineBehavior
    editor.isVerticallyResizable = !singleLineBehavior
    editor.autoresizingMask = singleLineBehavior ? [] : [.width]
    container.containerSize = singleLineBehavior ? CGSize(width: big, height: big) : CGSize(width: scrollView.contentSize.width, height: big)
    placeholderLabel.maximumNumberOfLines = singleLineBehavior ? 1 : 0
    placeholderLabel.lineBreakMode = singleLineBehavior ? .byTruncatingTail : .byWordWrapping
    scrollView.hasVerticalScroller = isScrollEnabled && !singleLineBehavior
  }

  internal func setBaseTextContainerInset(_ inset: UIEdgeInsets) {
    defaultTextContainerInset = inset
    if !singleLineBehavior { textContainerInset = inset }
    needsLayout = true
  }

  private var lineHeight: CGFloat {
    (font ?? UIFont.systemFont(ofSize: UIFont.systemFontSize)).lineHeight
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    if singleLineBehavior {
      let vertical = max(0, (bounds.height - lineHeight) / 2)
      textContainerInset = UIEdgeInsets(top: vertical, left: defaultTextContainerInset.left, bottom: vertical, right: defaultTextContainerInset.right)
    } else {
      textContainerInset = defaultTextContainerInset
    }
    let inner = bounds.inset(by: textContainerInset)
    scrollView.frame = inner
    if singleLineBehavior {
      editor.minSize = CGSize(width: inner.width, height: inner.height)
      editor.maxSize = CGSize(width: CGFloat.greatestFiniteMagnitude, height: inner.height)
      editor.setFrameSize(CGSize(width: max(inner.width, editor.frame.width), height: inner.height))
    } else {
      editor.minSize = CGSize(width: inner.width, height: inner.height)
      editor.maxSize = CGSize(width: inner.width, height: CGFloat.greatestFiniteMagnitude)
      textContainer.containerSize = CGSize(width: inner.width, height: CGFloat.greatestFiniteMagnitude)
      editor.setFrameSize(CGSize(width: inner.width, height: max(inner.height, editor.frame.height)))
    }
    let phHeight = singleLineBehavior ? lineHeight : max(lineHeight, placeholderLabel.sizeThatFits(CGSize(width: inner.width, height: .greatestFiniteMagnitude)).height)
    placeholderLabel.frame = CGRect(x: inner.minX, y: inner.minY, width: inner.width, height: phHeight)
  }

  public func sizeThatFits(_ size: CGSize) -> CGSize {
    guard let manager = editor.layoutManager else { return size }
    manager.ensureLayout(for: textContainer)
    let used = manager.usedRect(for: textContainer)
    return CGSize(
      width: used.width + textContainerInset.left + textContainerInset.right,
      height: max(used.height, lineHeight) + textContainerInset.top + textContainerInset.bottom
    )
  }

  public override func becomeFirstResponder() -> Bool {
    window?.makeFirstResponder(editor) ?? false
  }

  public override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    if isEditable || isSelectable { window?.makeFirstResponder(editor) }
  }

  private func updatePlaceholder() {
    placeholderLabel.isHidden = !editor.string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }

  public func textViewDidChange(_ textView: UITextView) {
    events.changed(textView.text ?? "")
  }

  public func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
    events.shouldChange(textView.text ?? "", range, text, undoManager: editor.undoManager)
  }

  public func textDidChange(_ notification: Notification) {
    updatePlaceholder()
    textViewDidChange(self)
  }

  public func textDidEndEditing(_ notification: Notification) {
    events.ended()
  }

  public func textView(_ textView: NSTextView, shouldChangeTextIn affectedCharRange: NSRange, replacementString: String?) -> Bool {
    self.textView(self, shouldChangeTextIn: affectedCharRange, replacementText: replacementString ?? "")
  }
}

final class MasonPasswordInput: NSSecureTextField, NSTextFieldDelegate {
  private let events = TextInputEvents()
  internal var owner: MasonElement? {
    get { events.owner }
    set { events.owner = newValue }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
    delegate = self
    isBordered = false
    drawsBackground = false
    focusRingType = .none
    usesSingleLineMode = true
    cell?.isScrollable = true
    let formatter = EditFormatter()
    formatter.shouldChange = { [weak self] current, range, replacement in
      guard let self else { return true }
      return self.events.shouldChange(current, range, replacement, undoManager: self.currentEditor()?.undoManager)
    }
    self.formatter = formatter
  }

  convenience init() {
    self.init(frame: .zero)
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    delegate = self
  }

  var text: String? {
    get { stringValue }
    set { stringValue = newValue ?? "" }
  }

  var textAlignment: NSTextAlignment {
    get { alignment }
    set { alignment = newValue }
  }

  var tintColor: UIColor?

  var attributedPlaceholder: NSAttributedString? {
    get { placeholderAttributedString }
    set { placeholderAttributedString = newValue }
  }

  override func hitTest(_ point: NSPoint) -> NSView? {
    let hit = super.hitTest(point)
    return hit === currentEditor() ? self : hit
  }

  override func mouseDown(with event: NSEvent) {
    if let editor = currentEditor() {
      editor.mouseDown(with: event)
    } else {
      super.mouseDown(with: event)
    }
    MasonGestureRecognizer.finishTrackedClick(self, down: event)
  }

  override func becomeFirstResponder() -> Bool {
    let ok = super.becomeFirstResponder()
    if ok {
      if let tint = tintColor, let editor = currentEditor() as? NSTextView { editor.insertionPointColor = tint }
      events.began()
    }
    return ok
  }

  func controlTextDidChange(_ obj: Notification) {
    events.changed(stringValue)
  }

  func controlTextDidEndEditing(_ obj: Notification) {
    events.ended()
  }

}

private final class EditFormatter: Formatter {
  var shouldChange: ((String, NSRange, String) -> Bool)?

  override func string(for obj: Any?) -> String? { obj as? String }

  override func getObjectValue(_ obj: AutoreleasingUnsafeMutablePointer<AnyObject?>?, for string: String, errorDescription error: AutoreleasingUnsafeMutablePointer<NSString?>?) -> Bool {
    obj?.pointee = string as NSString
    return true
  }

  override func isPartialStringValid(_ partialStringPtr: AutoreleasingUnsafeMutablePointer<NSString>, proposedSelectedRange proposedSelRangePtr: NSRangePointer?, originalString origString: String, originalSelectedRange origSelRange: NSRange, errorDescription error: AutoreleasingUnsafeMutablePointer<NSString?>?) -> Bool {
    let old = origString as NSString
    let new = partialStringPtr.pointee
    var prefix = 0
    while prefix < old.length, prefix < new.length, old.character(at: prefix) == new.character(at: prefix) { prefix += 1 }
    var suffix = 0
    while suffix < old.length - prefix, suffix < new.length - prefix,
          old.character(at: old.length - 1 - suffix) == new.character(at: new.length - 1 - suffix) { suffix += 1 }
    let range = NSRange(location: prefix, length: old.length - prefix - suffix)
    let replacement = new.substring(with: NSRange(location: prefix, length: new.length - prefix - suffix))
    return shouldChange?(origString, range, replacement) ?? true
  }
}
#endif
