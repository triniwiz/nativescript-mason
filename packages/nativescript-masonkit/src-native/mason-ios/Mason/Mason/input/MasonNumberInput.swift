//
//  MasonNumberInput.swift
//  Mason
//
//  Created by Osei Fortune on 08/01/2026.
//

import UIKit

class MasonNumberInput: UIView, UITextFieldDelegate {
  
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
      textField.delegate = self
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
  
  internal var owner: MasonElement?
  
  func textField(
      _ textField: UITextField,
      shouldChangeCharactersIn range: NSRange,
      replacementString string: String
  ) -> Bool {
      guard let owner = owner else { return true }

      let inputType = mapTextInputType(
          current: textField.text ?? "",
          range: range,
          replacement: string
      )

      let event = MasonInputEvent(
          type: "beforeinput",
          data: string.isEmpty ? nil : string,
          inputType: inputType,
          options: MasonEventOptions(
              type: "beforeinput",
              bubbles: true,
              cancelable: true,
              isComposing: true
          )
      )
      event.target = owner

      owner.node.mason.dispatch(event, owner.node)

      return !event.defaultPrevented
  }
  
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
    dispatchStepperInput(delta: step)
  }

  @objc private func decrement() {
    dispatchStepperInput(delta: -step)
  }

  @objc private func textChanged() {
    guard let owner = owner else { return }

       if let text = textField.text, let newValue = Int(text) {
           skip = true
           value = newValue
           skip = false
       }

       let event = MasonInputEvent(
           type: "input",
           data: textField.text,
           inputType: "insertText",
           options: MasonEventOptions(
               type: "input",
               bubbles: true,
               cancelable: false,
               isComposing: true
           )
       )
       event.target = owner

       owner.node.mason.dispatch(event, owner.node)
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
  
  private func dispatchStepperInput(delta: Int) {
      guard let owner = owner else {
          setValue(value + delta)
          return
      }

      let before = MasonInputEvent(
          type: "beforeinput",
          data: "\(value + delta)",
          inputType: "insertReplacementText",
          options: MasonEventOptions(
              type: "beforeinput",
              bubbles: true,
              cancelable: true,
              isComposing: true
          )
      )
      before.target = owner

      owner.node.mason.dispatch(before, owner.node)

      if before.defaultPrevented { return }

      setValue(value + delta)

      let input = MasonInputEvent(
          type: "input",
          data: "\(value)",
          inputType: "insertReplacementText",
          options: MasonEventOptions(
              type: "input",
              bubbles: true,
              cancelable: false,
              isComposing: true
          )
      )
      input.target = owner

      owner.node.mason.dispatch(input, owner.node)
  }
  
  func textFieldDidEndEditing(_ textField: UITextField) {
      guard let owner = owner else { return }

      let event = MasonInputEvent(
          type: "change",
          data: textField.text,
          inputType: "insertText",
          options: MasonEventOptions(
              type: "change",
              bubbles: true,
              cancelable: false,
              isComposing: true
          )
      )
      event.target = owner

      owner.node.mason.dispatch(event, owner.node)
  }
}
