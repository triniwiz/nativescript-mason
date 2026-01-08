//
//  MasonDateInput.swift
//  Mason
//
//  Created by Osei Fortune on 08/01/2026.
//

import UIKit


class MasonDateInput: UIView {
  internal var owner: MasonElement?
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
  
  private var isUserEditing = false
  
  @objc private func editingBegan(_ sender: UITextField) {
    isUserEditing = true
    // Clear placeholder text when editing begins
    if sender.textColor == .placeholderText {
      sender.text = ""
      sender.textColor = .label
    }
  }
  
  @objc private func editingEnded(_ sender: UITextField) {
    validateAndCorrect(sender)

       guard let owner = owner else { return }
       guard isUserEditing else { return }

       isUserEditing = false

       let change = MasonInputEvent(
           type: "change",
           data: value,
           inputType: "insertReplacementText",
           options: MasonEventOptions(
               type: "change",
               bubbles: true,
               cancelable: false,
               composed: true
           )
       )
       change.target = owner
       owner.node.mason.dispatch(change, owner.node)
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
    guard let owner = owner else { return }
        guard isUserEditing else { return }

        let before = MasonInputEvent(
            type: "beforeinput",
            data: value,
            inputType: "insertText",
            options: MasonEventOptions(
                type: "beforeinput",
                bubbles: true,
                cancelable: true,
                composed: true
            )
        )
        before.target = owner
        owner.node.mason.dispatch(before, owner.node)

        if before.defaultPrevented {
            return
        }

        let text = sender.text ?? ""
        let filtered = text.filter { $0.isNumber }
        if filtered != text {
            sender.text = filtered
        }

        let maxLength = sender.maxDigits
        if filtered.count >= maxLength {
            validateAndCorrect(sender)
            if sender.tag + 1 < fields.count {
                fields[sender.tag + 1].becomeFirstResponder()
            }
        }

        let input = MasonInputEvent(
            type: "input",
            data: value,
            inputType: "insertText",
            options: MasonEventOptions(
                type: "input",
                bubbles: true,
                cancelable: false,
                composed: true
            )
        )
        input.target = owner
        owner.node.mason.dispatch(input, owner.node)
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
      guard let owner = self.owner else { return }

          let before = MasonInputEvent(
              type: "beforeinput",
              data: nil,
              inputType: "insertReplacementText",
              options: MasonEventOptions(
                  type: "beforeinput",
                  bubbles: true,
                  cancelable: true,
                  composed: true
              )
          )
          before.target = owner
          owner.node.mason.dispatch(before, owner.node)

          if before.defaultPrevented {
              return
          }

          let calendar = Calendar.current
          let comps = calendar.dateComponents([.year, .month, .day], from: picker.date)

          self.yearInput.text = String(format: "%04d", comps.year ?? 0)
          self.yearInput.textColor = .label
          self.monthInput.text = String(format: "%02d", comps.month ?? 0)
          self.monthInput.textColor = .label
          self.dayInput.text = String(format: "%02d", comps.day ?? 0)
          self.dayInput.textColor = .label

          let input = MasonInputEvent(
              type: "input",
              data: self.value,
              inputType: "insertReplacementText",
              options: MasonEventOptions(
                  type: "input",
                  bubbles: true,
                  cancelable: false,
                  composed: true
              )
          )
          input.target = owner
          owner.node.mason.dispatch(input, owner.node)

          let change = MasonInputEvent(
              type: "change",
              data: self.value,
              inputType: "insertReplacementText",
              options: MasonEventOptions(
                  type: "change",
                  bubbles: true,
                  cancelable: false,
                  composed: true
              )
          )
          change.target = owner
          owner.node.mason.dispatch(change, owner.node)
    }))
    
    alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
    parentVC.present(alert, animated: true)
  }
}
