#if os(macOS)
import AppKit
import UniformTypeIdentifiers

private func dispatchInputEvent(_ owner: MasonElement?, _ type: String, _ data: String) {
  guard let owner else { return }
  let event = MasonInputEvent(type: type, data: data, inputType: "insertReplacementText", options: MasonEventOptions(isComposing: true)).apply {
    $0.bubbles = true
    $0.cancelable = false
  }
  event.target = owner
  owner.node.mason.dispatch(event, owner.node)
}

class TrackedButton: NSButton {
  var onClick: (() -> Void)?

  override func mouseDown(with event: NSEvent) {
    super.mouseDown(with: event)
    if let click = MasonGestureRecognizer.finishTrackedClick(self, down: event), !click.defaultPrevented {
      onClick?()
    }
  }
}

final class MasonInputButton: TrackedButton {
  weak var owner: MasonElement?

  override init(frame: CGRect) {
    super.init(frame: frame)
    bezelStyle = .push
    title = ""
  }

  convenience init() {
    self.init(frame: .zero)
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
  }

  func setAttributedTitle(_ title: NSAttributedString?, for state: MasonControlBase.State) {
    attributedTitle = title ?? NSAttributedString()
  }

  var currentAttributedTitle: NSAttributedString? { attributedTitle }
}

final class MasonColorWell: NSColorWell {
  override func mouseDown(with event: NSEvent) {
    super.mouseDown(with: event)
    MasonGestureRecognizer.finishTrackedClick(self, down: event)
  }

  var selectedColor: NSColor? {
    get { color }
    set { color = newValue ?? .black }
  }
}

private final class MasonDatePicker: NSDatePicker {
  override func mouseDown(with event: NSEvent) {
    super.mouseDown(with: event)
    MasonGestureRecognizer.finishTrackedClick(self, down: event)
  }
}

final class MasonDateInput: MasonViewBase {
  internal var owner: MasonElement?
  private let picker: NSDatePicker = MasonDatePicker()

  private static let formatter: DateFormatter = {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = TimeZone(secondsFromGMT: 0)
    f.dateFormat = "yyyy-MM-dd"
    return f
  }()

  init() {
    super.init(frame: .zero)
    picker.datePickerStyle = .textFieldAndStepper
    picker.datePickerElements = .yearMonthDay
    picker.timeZone = TimeZone(secondsFromGMT: 0)
    picker.calendar = Calendar(identifier: .gregorian)
    picker.isBordered = false
    picker.drawsBackground = false
    picker.dateValue = Date()
    picker.target = self
    picker.action = #selector(changed)
    addSubview(picker)
  }

  required init?(coder: NSCoder) { fatalError("init(coder:) not implemented") }

  var value: String {
    get { Self.formatter.string(from: picker.dateValue) }
    set {
      if let date = Self.formatter.date(from: newValue) { picker.dateValue = date }
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    let size = picker.fittingSize
    picker.frame = CGRect(x: 0, y: (bounds.height - size.height) / 2, width: bounds.width, height: size.height)
  }

  override var intrinsicContentSize: CGSize {
    let size = picker.fittingSize
    return CGSize(width: size.width, height: max(size.height, 24))
  }

  @objc private func changed() {
    dispatchInputEvent(owner, "input", value)
    dispatchInputEvent(owner, "change", value)
  }
}

final class MasonRangeInput: NSSlider {
  internal var owner: MasonElement?

  override init(frame: CGRect) {
    super.init(frame: frame)
    minValue = 0
    maxValue = 100
    doubleValue = 50
    isContinuous = true
    target = self
    action = #selector(changed)
  }

  convenience init() {
    self.init(frame: .zero)
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
  }

  var value: Float {
    get { floatValue }
    set { floatValue = newValue }
  }

  var cssValue: String {
    get { String(Int(doubleValue.rounded())) }
    set {
      guard let number = Double(newValue.trimmingCharacters(in: .whitespaces)), number.isFinite else {
        doubleValue = (minValue + maxValue) / 2
        return
      }
      doubleValue = min(max(number.rounded(), minValue), maxValue)
    }
  }

  override func mouseDown(with event: NSEvent) {
    super.mouseDown(with: event)
    MasonGestureRecognizer.finishTrackedClick(self, down: event)
  }

  @objc private func changed() {
    doubleValue = doubleValue.rounded()
    dispatchInputEvent(owner, "input", cssValue)
    if NSApp.currentEvent?.type == .leftMouseUp {
      dispatchInputEvent(owner, "change", cssValue)
    }
  }
}

final class MasonFileInput: MasonViewBase {
  internal var owner: MasonInput?
  private let fileBtn = TrackedButton(title: "Browse...", target: nil, action: nil)
  private let fileLabel = NSTextField(labelWithString: "No file selected")

  var onPickFile: (() -> Void)?
  var onContentSizeChanged: (() -> Void)?

  var labelText: String {
    get { fileLabel.stringValue }
    set {
      fileLabel.stringValue = newValue
      invalidateIntrinsicContentSize()
      needsLayout = true
      onContentSizeChanged?()
    }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
    fileBtn.bezelStyle = .push
    fileBtn.onClick = { [weak self] in
      guard let self else { return }
      if let pick = self.onPickFile { pick() } else { self.pickFile() }
    }
    fileLabel.lineBreakMode = .byTruncatingTail
    addSubview(fileBtn)
    addSubview(fileLabel)
  }

  required init?(coder: NSCoder) { fatalError("init(coder:) not implemented") }

  func configure(attributes: [NSAttributedString.Key: Any]) {
    fileBtn.attributedTitle = NSAttributedString(string: "Browse...", attributes: attributes)
    fileLabel.attributedStringValue = NSAttributedString(string: fileLabel.stringValue, attributes: attributes)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    let spacing: CGFloat = 8
    let btn = fileBtn.fittingSize
    let labelHeight = fileLabel.fittingSize.height
    fileBtn.frame = CGRect(x: 0, y: (bounds.height - btn.height) / 2, width: btn.width, height: btn.height)
    fileLabel.frame = CGRect(x: btn.width + spacing, y: (bounds.height - labelHeight) / 2, width: max(0, bounds.width - btn.width - spacing), height: labelHeight)
  }

  override var intrinsicContentSize: CGSize {
    let btn = fileBtn.fittingSize
    let label = fileLabel.fittingSize
    return CGSize(width: btn.width + 8 + label.width, height: max(btn.height, label.height))
  }

  private func pickFile() {
    let panel = NSOpenPanel()
    panel.allowedContentTypes = utTypes(from: owner?.accept)
    panel.allowsMultipleSelection = owner?.multiple ?? false
    panel.canChooseDirectories = false
    let done: (NSApplication.ModalResponse) -> Void = { [weak self] response in
      guard response == .OK else { return }
      self?.didPick(panel.urls)
    }
    if let window {
      panel.beginSheetModal(for: window, completionHandler: done)
    } else {
      panel.begin(completionHandler: done)
    }
  }

  private func didPick(_ urls: [URL]) {
    guard !urls.isEmpty else { return }
    labelText = urls.count == 1 ? urls[0].lastPathComponent : "\(urls.count) files selected"
    guard let owner else { return }
    let change = MasonFileInputEvent(
      type: "change",
      data: urls.map(\.lastPathComponent).joined(separator: ","),
      options: MasonEventOptions(isComposing: true),
      rawData: urls
    ).apply {
      $0.bubbles = true
      $0.cancelable = false
    }
    change.target = owner
    owner.node.mason.dispatch(change, owner.node)
  }
}
#endif
