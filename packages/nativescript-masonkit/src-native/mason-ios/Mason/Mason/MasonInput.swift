//
//  MasonInput.swift
//  Mason
//
//  Created by Osei Fortune on 03/01/2026.
//

import UIKit

// MARK: - Helpers
private extension UITextField {
    private struct AssociatedKeys { static var maxDigits = "maxDigits" }

    var maxDigits: Int {
        get { objc_getAssociatedObject(self, &AssociatedKeys.maxDigits) as? Int ?? 1 }
        set { objc_setAssociatedObject(self, &AssociatedKeys.maxDigits, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
    }

    func configure(maxDigits: Int, hint: String, width: CGFloat) {
        self.maxDigits = maxDigits
        self.keyboardType = .numberPad
        self.textAlignment = .center
        self.font = .systemFont(ofSize: 14)
        self.textColor = .placeholderText
        self.text = hint
        self.borderStyle = .none
        self.widthAnchor.constraint(equalToConstant: width).isActive = true
    }
}

private extension String {
    func paddingLeft(toLength: Int, withPad: String) -> String {
        if self.count < toLength {
            return String(repeating: withPad, count: toLength - self.count) + self
        }
        return self
    }
}


private extension UIView {
    var parentViewController: UIViewController? {
        var responder: UIResponder? = self
        while let r = responder {
            if let vc = r as? UIViewController { return vc }
            responder = r.next
        }
        return nil
    }
}


@objcMembers
@objc(MasonInput)
public class MasonInput: UIView, MasonElement, StyleChangeListener, UIDocumentPickerDelegate, UIImagePickerControllerDelegate {
  func onTextStyleChanged(change: Int64) {
    let change = TextStyleChangeMasks(rawValue: change)
    let color = change.contains(.color)
    let size = change.contains(.fontSize)
    let font = change.contains(.fontWeight) || change.contains(.fontStyle) || change.contains(.fontFamily)
    switch self.type {
    case .Text, .Number, .Email, .Password, .Tel, .Url:
      if(color){
        textInput.textColor = UIColor.colorFromARGB(style.resolvedColor)
      }
      if(size){
        textInput.minimumFontSize = CGFloat(style.resolvedFontSize)
      }
      if(font){
        let resolved = style.resolvedFontFace
        if let uiFont = resolved.uiFont {
          textInput.font = uiFont
        }
      }
    case .Button:
      break
    case .Checkbox:
      break
    case .Date:
      break
    case .Radio:
      break
    case .Range:
      break
    case .Color:
      break
    case .File:
      break
    }
  }
  
  final class DateControl: UIView {
    private let locale = Locale.current
    private let order: [String]
    
    internal let yearInput = UITextField()
    internal let monthInput = UITextField()
    internal let dayInput = UITextField()
    
    private var fields: [UITextField] = []
    private let showButton = UIButton(type: .system)
    private let stack = UIStackView()
    
    // Public API to get/set value like web input
    var value: String {
      get {
        let y = yearInput.text?.paddingLeft(toLength: 4, withPad: "0") ?? "0000"
        let m = monthInput.text?.paddingLeft(toLength: 2, withPad: "0") ?? "00"
        let d = dayInput.text?.paddingLeft(toLength: 2, withPad: "0") ?? "00"
        return "\(y)-\(m)-\(d)"
      }
      set {
        let parts = newValue.split(separator: "-")
        if parts.count == 3 {
          yearInput.text = String(parts[0])
          yearInput.textColor = .label
          monthInput.text = String(parts[1])
          monthInput.textColor = .label
          dayInput.text = String(parts[2])
          dayInput.textColor = .label
        }
      }
    }
    
    init() {
      // Determine order from locale (M/D/Y)
      let pattern = DateFormatter.dateFormat(fromTemplate: "yMd", options: 0, locale: locale) ?? "MdY"
      self.order = pattern.compactMap { char -> String? in
        switch char {
        case "y": return "Y"
        case "M": return "M"
        case "d": return "D"
        default: return nil
        }
      }
      
      super.init(frame: .zero)
      setupFields()
      setupLayout()
      setupAutoFocus()
      setupButton()
    }
    
    required init?(coder: NSCoder) { fatalError("init(coder:) not implemented") }
    
    // MARK: - Field setup
    private func setupFields() {
      yearInput.configure(maxDigits: 4, hint: "yyyy", width: 40)
      monthInput.configure(maxDigits: 2, hint: "mm", width: 26)
      dayInput.configure(maxDigits: 2, hint: "dd", width: 20)
      
      fields = []
      for part in order {
        switch part {
        case "Y": fields.append(yearInput)
        case "M": fields.append(monthInput)
        case "D": fields.append(dayInput)
        default: break
        }
      }
    }
    
    // MARK: - Layout
    private func setupLayout() {
      stack.axis = .horizontal
      stack.spacing = 2
      stack.alignment = .center
      stack.distribution = .fill
      
      for field in fields {
        stack.addArrangedSubview(field)
      }
      stack.addArrangedSubview(showButton)
      
      addSubview(stack)
    }
    
    override func layoutSubviews() {
      super.layoutSubviews()
      stack.frame = bounds
    }
    
    override var intrinsicContentSize: CGSize {
      let stackSize = stack.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
      return CGSize(width: stackSize.width, height: max(stackSize.height, 24))
    }
    
    // MARK: - Auto-focus to next field
    private func setupAutoFocus() {
      for (i, field) in fields.enumerated() {
        field.addTarget(self, action: #selector(textChanged(_:)), for: .editingChanged)
        field.addTarget(self, action: #selector(editingBegan(_:)), for: .editingDidBegin)
        field.addTarget(self, action: #selector(editingEnded(_:)), for: .editingDidEnd)
        field.tag = i
      }
    }
    
    @objc private func editingBegan(_ sender: UITextField) {
      // Clear placeholder text when editing begins
      if sender.textColor == .placeholderText {
        sender.text = ""
        sender.textColor = .label
      }
    }
    
    @objc private func editingEnded(_ sender: UITextField) {
      validateAndCorrect(sender)
    }
    
    private func validateAndCorrect(_ field: UITextField) {
      guard let text = field.text, !text.isEmpty else { return }
      guard let value = Int(text) else { return }
      
      if field === monthInput {
        // Month: 1-12
        let corrected = max(1, min(12, value))
        field.text = String(format: "%02d", corrected)
      } else if field === dayInput {
        // Day: 1-31 (adjusted for month if possible)
        let maxDay = maxDayForCurrentMonth()
        let corrected = max(1, min(maxDay, value))
        field.text = String(format: "%02d", corrected)
      } else if field === yearInput {
        // Year: ensure 4 digits, reasonable range
        let corrected = max(1, min(9999, value))
        field.text = String(format: "%04d", corrected)
        // Re-validate day in case of leap year change
        validateAndCorrect(dayInput)
      }
    }
    
    private func maxDayForCurrentMonth() -> Int {
      guard let monthText = monthInput.text, let month = Int(monthText), month >= 1, month <= 12 else {
        return 31
      }
      
      let year: Int
      if let yearText = yearInput.text, let y = Int(yearText), y > 0 {
        year = y
      } else {
        year = Calendar.current.component(.year, from: Date())
      }
      
      var components = DateComponents()
      components.year = year
      components.month = month
      components.day = 1
      
      guard let date = Calendar.current.date(from: components),
            let range = Calendar.current.range(of: .day, in: .month, for: date) else {
        return 31
      }
      
      return range.count
    }
    
    @objc private func textChanged(_ sender: UITextField) {
      guard let text = sender.text else { return }
      
      // Only allow digits
      let filtered = text.filter { $0.isNumber }
      if filtered != text {
        sender.text = filtered
      }
      
      let maxLength = sender.maxDigits
      if filtered.count >= maxLength {
        // Validate before moving to next field
        validateAndCorrect(sender)
        if sender.tag + 1 < fields.count {
          fields[sender.tag + 1].becomeFirstResponder()
        }
      }
    }
    
    // MARK: - Calendar button
    private func setupButton() {
      let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .regular)
      let calendarImage = UIImage(systemName: "calendar", withConfiguration: config)
      showButton.setImage(calendarImage, for: .normal)
      showButton.tintColor = .placeholderText
      showButton.setContentHuggingPriority(.required, for: .horizontal)
      showButton.setContentCompressionResistancePriority(.required, for: .horizontal)
      showButton.addTarget(self, action: #selector(showDatePicker), for: .touchUpInside)
    }
    
    @objc private func showDatePicker() {
      guard let parentVC = self.parentViewController else { return }
      
      let picker = UIDatePicker()
      picker.datePickerMode = .date
      picker.preferredDatePickerStyle = .inline
      
      let alert = UIAlertController(title: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", message: nil, preferredStyle: .actionSheet)
      alert.view.addSubview(picker)
      
      picker.translatesAutoresizingMaskIntoConstraints = false
      NSLayoutConstraint.activate([
        picker.leadingAnchor.constraint(equalTo: alert.view.leadingAnchor),
        picker.trailingAnchor.constraint(equalTo: alert.view.trailingAnchor),
        picker.topAnchor.constraint(equalTo: alert.view.topAnchor, constant: 8),
        picker.heightAnchor.constraint(equalToConstant: 360)
      ])
      
      alert.addAction(UIAlertAction(title: "Done", style: .default, handler: { _ in
        let calendar = Calendar.current
        let comps = calendar.dateComponents([.year, .month, .day], from: picker.date)
        self.yearInput.text = String(format: "%04d", comps.year ?? 0)
        self.yearInput.textColor = .label
        self.monthInput.text = String(format: "%02d", comps.month ?? 0)
        self.monthInput.textColor = .label
        self.dayInput.text = String(format: "%02d", comps.day ?? 0)
        self.dayInput.textColor = .label
      }))
      
      alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
      parentVC.present(alert, animated: true)
    }
  }
  
  final class NumberControl: UIView {
    
    // MARK: - Subviews
    
    internal let textField = UITextField()
    private let stepperContainer = UIStackView()
    private let incrementButton = UIButton(type: .custom)
    private let decrementButton = UIButton(type: .custom)

    // MARK: - Value

    internal var skip = false
    public var value: Int = 0 {
        didSet {
          if(skip){return}
            textField.text = "\(value)"
        }
    }

    public var step: Int = 1
    public var minValue: Int?
    public var maxValue: Int?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    // MARK: - Setup

    private func setup() {
        incrementButton.backgroundColor = .systemGray6
        decrementButton.backgroundColor = .systemGray6
      
        setupTextField()
        setupStepper()
        setupLayout()

        tintColor = nil // inherit system accent (green)
    }

    private func setupTextField() {
        textField.keyboardType = .numberPad
        textField.borderStyle = .none
        textField.textAlignment = .left
        textField.font = .systemFont(ofSize: 16)
        textField.addTarget(self, action: #selector(textChanged), for: .editingChanged)
    }

    private func setupStepper() {
        stepperContainer.axis = .vertical
        stepperContainer.distribution = .fillEqually
        stepperContainer.alignment = .fill
        stepperContainer.isUserInteractionEnabled = true

        let size = CGSize(width: 8, height: 4)
        let upChevron = UIImage.chevron(direction: .up, color: UIColor.label.withAlphaComponent(0.6), size: size, lineWidth: 3)
        let downChevron = UIImage.chevron(direction: .down, color: UIColor.label.withAlphaComponent(0.6), size: size, lineWidth: 3)
        
        incrementButton.setImage(upChevron, for: .normal)
        decrementButton.setImage(downChevron, for: .normal)
        
        // Add highlight effect on tap
        incrementButton.addTarget(self, action: #selector(buttonTouchDown(_:)), for: .touchDown)
        incrementButton.addTarget(self, action: #selector(buttonTouchUp(_:)), for: [.touchUpInside, .touchUpOutside, .touchCancel])
        decrementButton.addTarget(self, action: #selector(buttonTouchDown(_:)), for: .touchDown)
        decrementButton.addTarget(self, action: #selector(buttonTouchUp(_:)), for: [.touchUpInside, .touchUpOutside, .touchCancel])
        
        incrementButton.isUserInteractionEnabled = true
        decrementButton.isUserInteractionEnabled = true

        incrementButton.addTarget(self, action: #selector(increment), for: .touchUpInside)
        decrementButton.addTarget(self, action: #selector(decrement), for: .touchUpInside)

        stepperContainer.addArrangedSubview(incrementButton)
        stepperContainer.addArrangedSubview(decrementButton)
    }
    
    @objc private func buttonTouchDown(_ sender: UIButton) {
        sender.backgroundColor = .systemGray4
    }
    
    @objc private func buttonTouchUp(_ sender: UIButton) {
        sender.backgroundColor = .systemGray6
    }

    private var container: UIStackView!
    
    private func setupLayout() {
        // TextField should expand to fill available space
        textField.setContentHuggingPriority(.defaultLow, for: .horizontal)
        textField.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        
        // Stepper should stay fixed width
        stepperContainer.setContentHuggingPriority(.required, for: .horizontal)
        stepperContainer.setContentCompressionResistancePriority(.required, for: .horizontal)
        
        container = UIStackView(arrangedSubviews: [textField, stepperContainer])
        container.axis = .horizontal
        container.alignment = .fill
        container.distribution = .fill

        stepperContainer.translatesAutoresizingMaskIntoConstraints = false
        stepperContainer.widthAnchor.constraint(equalToConstant: 16).isActive = true

        addSubview(container)
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        container.frame = bounds.inset(by: UIEdgeInsets(top: 1, left: 8, bottom: 1, right: 1))
    }

    // MARK: - Actions

    @objc private func increment() {
        setValue(value + step)
    }

    @objc private func decrement() {
        setValue(value - step)
    }

    @objc private func textChanged() {
        if let text = textField.text, let newValue = Int(text) {
            setValue(newValue)
        }
    }

    private func setValue(_ newValue: Int) {
      if let text = textField.text, !text.isEmpty && Int(text, radix: 10) == nil{
        skip = true
        value = 0
        skip = false
        return
      }
        var v = newValue
        if let min = minValue { v = max(v, min) }
        if let max = maxValue { v = min(v, max) }
        value = v
    }
  }
  
  
  final class CheckboxControl: UIControl {

    var isChecked: Bool = false {
      didSet {
        setNeedsDisplay()
        sendActions(for: .valueChanged)
      }
    }
    
    override init(frame: CGRect) {
      super.init(frame: frame)
      isOpaque = false
    }
    
    required init?(coder: NSCoder) {
      super.init(coder: coder)
    }
    
    override func draw(_ rect: CGRect) {
      guard let ctx = UIGraphicsGetCurrentContext() else { return }

      let box = CGRect(x: 4, y: 3, width: 17, height: 17)

      
      if isChecked {
        ctx.setFillColor(UIColor.systemGreen.cgColor)
        ctx.fill(box)
        
        ctx.setStrokeColor(UIColor.white.cgColor)
        ctx.setLineWidth(2)
        ctx.move(to: CGPoint(x: box.minX + 3, y: box.midY))
        ctx.addLine(to: CGPoint(x: box.midX - 1, y: box.maxY - 4))
        ctx.addLine(to: CGPoint(x: box.maxX - 3, y: box.minY + 4))
        ctx.strokePath()
      }else {
        ctx.setStrokeColor(UIColor.label.cgColor)
        ctx.setLineWidth(1)
        ctx.stroke(box)
      }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
      isChecked.toggle()
    }
  }
  
  
  final class RadioButtonControl: UIControl {

    var isSelectedRadio: Bool = false {
      didSet {
        setNeedsDisplay()
        sendActions(for: .valueChanged)
      }
    }

    override init(frame: CGRect) {
      super.init(frame: frame)
      isOpaque = false
    }

    required init?(coder: NSCoder) {
      super.init(coder: coder)
    }

    override func draw(_ rect: CGRect) {
      guard let ctx = UIGraphicsGetCurrentContext() else { return }

      let diameter: CGFloat = 17
      let circleRect = CGRect(x: 4, y: 3, width: diameter, height: diameter)

      // Outer circle
      if isSelectedRadio {
        ctx.setStrokeColor(UIColor.systemGreen.cgColor)
      }else {
        ctx.setStrokeColor(UIColor.label.cgColor)
      }

      ctx.setLineWidth(1)
      ctx.strokeEllipse(in: circleRect)

      if isSelectedRadio {
        let innerDiameter: CGFloat = 12
        let innerRect = CGRect(
          x: circleRect.midX - innerDiameter / 2,
          y: circleRect.midY - innerDiameter / 2,
          width: innerDiameter,
          height: innerDiameter
        )

        ctx.setFillColor(UIColor.systemGreen.cgColor)
        ctx.fillEllipse(in: innerRect)
      }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
      guard !isSelectedRadio else { return }
      isSelectedRadio = true
    }
  }
  
  required init?(coder: NSCoder) {
    node = NSCMason.shared.createNode()
    mason = NSCMason.shared
    super.init(coder: coder)
  }
  public let node: MasonNode
  
  public let mason: NSCMason
  
  internal lazy var dateInput: DateControl  = {
    DateControl()
  }()
  
  
  internal lazy var textInput: UITextField  = {
    let field = UITextField()
    field.autocorrectionType = .no
    return field
  }()
  
  
  internal lazy var buttonInput: UIButton  = {
    let btn = UIButton()
    return btn
  }()
  
  internal lazy var checkboxInput: CheckboxControl  = {
    let cb = CheckboxControl()
    return cb
  }()
  
  internal lazy var radioInput: RadioButtonControl  = {
    let rb = RadioButtonControl()
    return rb
  }()
  
  
  class Range: UISlider {
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
           let bounds = self.bounds.insetBy(dx: -10, dy: -10)
           return bounds.contains(point)
       }
  }
  
 private func thumbImage(diameter: CGFloat, color: UIColor) -> UIImage {
      let renderer = UIGraphicsImageRenderer(size: CGSize(width: diameter, height: diameter))
      return renderer.image { ctx in
          ctx.cgContext.setFillColor(color.cgColor)
          ctx.cgContext.fillEllipse(in: CGRect(x: 0, y: 0, width: diameter, height: diameter))
      }
  }
  
  private func rangeThumbImage(
      diameter: CGFloat = 18,
      innerScale: CGFloat = 0.75,
      outerColor: UIColor = .white,
      innerColor: UIColor = .systemGreen,
      borderColor: UIColor = .systemGray,
      borderWidth: CGFloat = 1
  ) -> UIImage {

      let size = CGSize(width: diameter, height: diameter)
      let renderer = UIGraphicsImageRenderer(size: size)

      return renderer.image { ctx in
          let rect = CGRect(origin: .zero, size: size)

          // Outer circle (white)
          ctx.cgContext.setFillColor(outerColor.cgColor)
          ctx.cgContext.fillEllipse(in: rect)

          // Optional subtle border (web-like)
          ctx.cgContext.setStrokeColor(borderColor.cgColor)
          ctx.cgContext.setLineWidth(borderWidth)
          ctx.cgContext.strokeEllipse(in: rect.insetBy(dx: borderWidth / 2, dy: borderWidth / 2))

          // Inner circle (green)
          let innerDiameter = diameter * innerScale
          let innerRect = CGRect(
              x: (diameter - innerDiameter) / 2,
              y: (diameter - innerDiameter) / 2,
              width: innerDiameter,
              height: innerDiameter
          )

          ctx.cgContext.setFillColor(innerColor.cgColor)
          ctx.cgContext.fillEllipse(in: innerRect)
      }
  }

  
  private func rangeTrackImage(
      height: CGFloat = 4,
      fillColor: UIColor,
      borderColor: UIColor = .systemGray,
      borderWidth: CGFloat = 1
  ) -> UIImage {

      // Width must be > height so caps can stretch cleanly
      let width: CGFloat = height * 3
      let size = CGSize(width: width, height: height + borderWidth * 2)

      let renderer = UIGraphicsImageRenderer(size: size)
      let image = renderer.image { ctx in
          let rect = CGRect(
              x: borderWidth,
              y: borderWidth,
              width: width - borderWidth * 2,
              height: height
          )

          let radius = rect.height / 2

          // Border
          let borderPath = UIBezierPath(
              roundedRect: rect.insetBy(dx: -borderWidth, dy: -borderWidth),
              cornerRadius: radius + borderWidth
          )
          borderColor.setStroke()
          borderPath.lineWidth = borderWidth
          borderPath.stroke()

          // Fill
          let fillPath = UIBezierPath(
              roundedRect: rect,
              cornerRadius: radius
          )
          fillColor.setFill()
          fillPath.fill()
      }

      return image.resizableImage(
          withCapInsets: UIEdgeInsets(
              top: size.height / 2,
              left: size.width / 2,
              bottom: size.height / 2,
              right: size.width / 2
          )
      )
  }

  
  internal lazy var rangeInput: UISlider  = {
    let range = Range()
    range.contentVerticalAlignment = .center
    range.maximumValueImage = nil
    range.minimumValueImage = nil
    
    range.setMinimumTrackImage(rangeTrackImage(fillColor: .systemGreen), for: .normal)
    range.setMinimumTrackImage(rangeTrackImage(fillColor: .systemGreen.darker()), for: .highlighted)
    
    range.setMaximumTrackImage(rangeTrackImage(fillColor: .systemGray5), for: .normal)
    range.setMaximumTrackImage(rangeTrackImage(fillColor: .systemGray5.darker()), for: .highlighted)
    
    range.setThumbImage(rangeThumbImage(innerColor: .systemGray.darker()), for: .normal)
    range.setThumbImage(rangeThumbImage(innerColor: .systemGreen.darker()), for: .highlighted)

    return range
  }()
  
  internal lazy var numberInput: NumberControl  = {
    let ctrl = NumberControl()
    return ctrl
  }()
  
  
  internal lazy var colorInput: UIColorWell = {
    let well = UIColorWell()
    well.selectedColor = .black
    return well
  }()
  
  public var multiple: Bool = false {
    didSet {
      if(initializing){
        return
      }
      if type == .File {
        fileInput.labelText = "No file\(multiple ? "s" : "") selected"
      }
    }
  }
  
  final class FileInputControl: UIView {
    private let fileBtn = UIButton(type: .system)
    private let fileLabel = UILabel()
    private let stack: UIStackView
    
    var onPickFile: (() -> Void)?
    var onContentSizeChanged: (() -> Void)?
    
    var labelText: String {
      get { fileLabel.text ?? "" }
      set {
        fileLabel.text = newValue
        invalidateIntrinsicContentSize()
        setNeedsLayout()
        layoutIfNeeded()
        onContentSizeChanged?()
      }
    }
    
    override init(frame: CGRect) {
      stack = UIStackView(arrangedSubviews: [fileBtn, fileLabel])
      super.init(frame: frame)
      setup()
    }
    
    required init?(coder: NSCoder) {
      stack = UIStackView(arrangedSubviews: [fileBtn, fileLabel])
      super.init(coder: coder)
      setup()
    }
    
    private func setup() {
      clipsToBounds = false
      
      fileBtn.setTitle("Browse...", for: .normal)
      fileBtn.layer.borderWidth = 1
      fileBtn.layer.borderColor = UIColor.systemGray4.cgColor
      fileBtn.layer.cornerRadius = 4
      fileBtn.contentEdgeInsets = UIEdgeInsets(top: 2, left: 8, bottom: 2, right: 8)
      fileBtn.setContentHuggingPriority(.required, for: .horizontal)
      fileBtn.setContentCompressionResistancePriority(.required, for: .horizontal)
      
      fileLabel.text = "No file selected"
      fileLabel.lineBreakMode = .byTruncatingTail
      fileLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)
      fileLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
      
      stack.axis = .horizontal
      stack.spacing = 8
      stack.alignment = .center
      stack.distribution = .fill
      stack.clipsToBounds = false
      
      addSubview(stack)
      
      fileBtn.addTarget(self, action: #selector(didTapButton), for: .touchUpInside)
    }
    
    @objc private func didTapButton() {
      onPickFile?()
    }
    
    func configure(attributes: [NSAttributedString.Key: Any]) {
      fileBtn.setAttributedTitle(NSAttributedString(string: "Browse...", attributes: attributes), for: .normal)
      fileLabel.attributedText = NSAttributedString(string: fileLabel.text ?? "No file selected", attributes: attributes)
    }
    
    override func layoutSubviews() {
      super.layoutSubviews()
      stack.frame = bounds
    }
    
    override var intrinsicContentSize: CGSize {
      let btnSize = fileBtn.intrinsicContentSize
      let labelSize = fileLabel.intrinsicContentSize
      let width = btnSize.width + 8 + labelSize.width
      let height = max(btnSize.height, labelSize.height)
      return CGSize(width: width, height: height)
    }
    
    override func sizeThatFits(_ size: CGSize) -> CGSize {
      let fitting = stack.systemLayoutSizeFitting(
        CGSize(width: size.width, height: UIView.layoutFittingCompressedSize.height),
        withHorizontalFittingPriority: .fittingSizeLevel,
        verticalFittingPriority: .fittingSizeLevel
      )
      return fitting
    }
  }
  
  internal lazy var fileInput: FileInputControl = {
    let control = FileInputControl()
    control.configure(attributes: node.getDefaultAttributes())
    control.onPickFile = { [weak self] in
      self?.pickFile()
    }
    control.onContentSizeChanged = { [weak self] in
      self?.invalidateLayout()
    }
    return control
  }()
  
  
  public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    
  }
  
  public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard !urls.isEmpty else { return }
    
    if multiple {
      if urls.count == 1 {
        fileInput.labelText = urls.first?.lastPathComponent ?? ""
      } else {
        fileInput.labelText = "\(urls.count) files selected"
      }
    } else {
      fileInput.labelText = urls.first?.lastPathComponent ?? ""
    }
  }
  
  @objc private func pickFile() {
    let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.png, .jpeg, .webP])
    picker.delegate = self
    picker.allowsMultipleSelection = multiple
  
    if let controller = parentViewController {
      controller.present(picker, animated: true)
    }
  }

  
  public var uiView: UIView {
    self
  }
  
  public var style: MasonStyle {
    return node.style
  }
  
  private var initializing = true
  public var type: MasonInputType = .Text {
    didSet {
      if(initializing){
        return
      }
      configureInput(type)
      invalidateLayout()
    }
  }
  
  public var size: Int32 = 20 {
    didSet {
      invalidateLayout()
    }
  }
  
  public var value: String = "" {
    didSet {
      switch type {
      case .Text,.Email,.Url:
        textInput.text = value
      case .Button:
        let attributes = node.getDefaultAttributes()
        let title = NSAttributedString(string: value, attributes: attributes)
        buttonInput.setAttributedTitle(title, for: .normal)
        break
      case .Checkbox:
        break
      case .Password:
        break
      case .Date:
        break
      case .Radio:
        break
      case .Number:
        break
      case .Range:
        break
      case .Tel:
        break
      case .Color:
        break
      case .File:
        break
      }
    }
  }
  
  public var placeholder: String = "" {
    didSet {
      switch type {
      case .Text,.Email, .Password:
        textInput.placeholder = placeholder
      case .Button:
        break
      case .Checkbox:
        break
      case .Date:
        break
      case .Radio:
        break
      case .Number:
        numberInput.textField.placeholder = placeholder
        break
      case .Range:
        break
      case .Tel:
        break
      case .Url:
        break
      case .Color:
        break
      case .File:
        break
      }
    }
  }
  
  public override func draw(_ rect: CGRect) {
    
    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }
    
    style.mBorderRender.resolve(for: bounds)
    let borderWidths = style.mBorderRender.cachedWidths
    let innerRect = bounds.inset(by: UIEdgeInsets(
      top: borderWidths.top,
      left: borderWidths.left,
      bottom: borderWidths.bottom,
      right: borderWidths.right
    ))
    
    let innerRadius = style.mBorderRender.radius.insetByBorderWidths(borderWidths)
    let innerPath = style.mBorderRender.buildRoundedPath(in: innerRect, radius: innerRadius)
    
    context.saveGState()
    context.addPath(innerPath.cgPath)
    context.clip()
    style.mBackground.draw(on: self, in: context, rect: innerRect)
    context.restoreGState()
    
    switch(self.type){
    case .Radio, .Checkbox, .Range,.Color:
      break
    default:
      style.mBorderRender.draw(in: context, rect: bounds)
      break
    }
  }
  
  private func measureText(_ text: String) -> CGSize {
    let attributes = node.getDefaultAttributes()
    let attString = NSAttributedString(string: text, attributes: attributes)
    let framesetter = CTFramesetterCreateWithAttributedString(attString)
    return CTFramesetterSuggestFrameSizeWithConstraints(framesetter, CFRange(location: 0,length: attString.length), nil, .init(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude), nil)
  }
  
  init(mason doc: NSCMason, type: MasonInputType = .Text) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    setup(mason, type)
    node.view = self
    node.measureFunc = { known, available in
      var size = CGSize(width: 300, height: 150)
      let ch = self.measureText("0")
      let scale = CGFloat(NSCMason.scale)
      switch self.type {
      case .Text, .Email, .Password, .Url, .Tel, .Number:
        size.width = max(CGFloat(self.size) * (ch.width * scale) , 150)
        size.height = ch.height * scale
      case .Button:
        let value = self.measureText(self.value)
        size.width = min(value.width * scale, 64 * scale)
        size.height = min(value.height * scale, 32 * scale)
        break
      case .Color:
        size.width = 32 * scale
        size.height = 32 * scale
        break
      case .Checkbox, .Radio:
        size.width =  24 * scale
        size.height = 24 * scale
        break
      case .Date:
        let intrinsic = self.dateInput.intrinsicContentSize
        size.width = intrinsic.width * scale
        size.height = intrinsic.height * scale
        break
      case .Range:
        size.width = 160 * scale
        size.height = 20 * scale
        break
      case .File:
        let intrinsic = self.fileInput.intrinsicContentSize
        size.width = intrinsic.width * scale
        size.height = intrinsic.height * scale
        break
      }
      if let known = known {
        if(!known.width.isNaN && known.width.isFinite){
          size.width = known.width
        }
        
        if(!known.height.isNaN && known.height.isFinite){
          size.height = known.height
        }
      }
      return size
    }
    node.setMeasureFunction(node.measureFunc!)
    //self.delegate = self
    style.setStyleChangeListener(listener: self)
    isOpaque = false
  }
  
  
  public override func layoutSubviews() {
    var inputSize = bounds
    if(!node.computedLayout.paddingIsEmpty){
      let scale = NSCMason.scale
      var inset = UIEdgeInsets()
      if !node.computedLayout.paddingTop.isNaN && node.computedLayout.paddingTop.isFinite  { inset.top = CGFloat(node.computedLayout.paddingTop / scale) }
      if !node.computedLayout.paddingRight.isNaN && node.computedLayout.paddingRight.isFinite { inset.right = CGFloat(node.computedLayout.paddingRight / scale) }
      if !node.computedLayout.paddingBottom.isNaN && node.computedLayout.paddingBottom.isFinite { inset.bottom = CGFloat(node.computedLayout.paddingBottom / scale) }
      if !node.computedLayout.paddingLeft.isNaN && node.computedLayout.paddingLeft.isFinite { inset.left = CGFloat(node.computedLayout.paddingLeft / scale) }
      inputSize = bounds.insetBy(dx: inset.left, dy: inset.top)
    }
    switch type {
    case .Text, .Email, .Password:
      textInput.frame = inputSize
      break
    case .Button:
      buttonInput.frame = inputSize
      break
    case .Checkbox:
      checkboxInput.frame = bounds
      break
    case .Radio:
      radioInput.frame = bounds
      break
    case .Range:
      rangeInput.frame = inputSize
      break
    case .Number:
      numberInput.frame = inputSize
      break
    case .Color:
      colorInput.frame = inputSize
      break
    case .File:
      fileInput.frame = inputSize
      break
    case .Date:
      dateInput.frame = inputSize
      break
    default:
      break
    }
  }
  
  private func configureInput(_ type: MasonInputType){
    let scale = NSCMason.scale
    switch type {
    case .Text, .Email, .Password:
      textInput.tintColor = UIColor.colorFromARGB(style.resolvedColor)
      configure { style in
        style.border = "2px"
        style.borderRadius = "4px"
        style.padding = MasonRect(.Points(scale), .Points(scale * 2), .Points(scale), .Points(scale * 2))
        style.textAlign = TextAlign.Center
      }
      switch(type){
      case .Email:
        textInput.keyboardType = .emailAddress
        break
      case .Password:
          textInput.isSecureTextEntry = (type == .Password)
         textInput.textContentType = type == .Password ? .password : .none
         textInput.autocapitalizationType = .none
         textInput.autocorrectionType = .no
        break
      default:
        break
      }
      addSubview(textInput)
    case .Date:
      addSubview(dateInput)
      break
    case .Button:
      configure { style in
        style.border = "2px"
        style.borderRadius = "4px"
        style.padding = MasonRect(.Points(1), .Points(6), .Points(1), .Points(6))
        style.textAlign = TextAlign.Center
      }
      addSubview(buttonInput)
      break
    case .Checkbox:
      addSubview(checkboxInput)
      break
    case .Radio:
      addSubview(radioInput)
      break
    case .Range:
      addSubview(rangeInput)
      break
    case .Number:
      configure { style in
        style.border = "2px"
        style.borderRadius = "4px"
        style.padding = MasonRect(.Points(1), .Points(2), .Points(1), .Points(2))
        style.textAlign = TextAlign.Center
      }
      addSubview(numberInput)
      break
    case .Color:
      addSubview(colorInput)
      break
    case .File:
      addSubview(fileInput)
      break
    default:
      break
    }
  }
  
  private func setup(_ mason: NSCMason, _ type: MasonInputType){
    node.style.setUInt32(StyleKeys.ITEM_IS_REPLACED, 1)
    node.style.display = Display.InlineBlock
    self.type = type
    configureInput(type)
  }
}
