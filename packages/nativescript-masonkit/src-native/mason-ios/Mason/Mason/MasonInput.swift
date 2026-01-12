//
//  MasonInput.swift
//  Mason
//
//  Created by Osei Fortune on 03/01/2026.
//

import UIKit

// MARK: - Helpers
internal extension UITextField {
  private struct AssociatedKeys { static var maxDigits = "maxDigits" }
  
  var maxDigits: Int {
    get { objc_getAssociatedObject(self, AssociatedKeys.maxDigits) as? Int ?? 1 }
    set { objc_setAssociatedObject(self, AssociatedKeys.maxDigits, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC) }
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

internal extension String {
  func paddingLeft(toLength: Int, withPad: String) -> String {
    if self.count < toLength {
      return String(repeating: withPad, count: toLength - self.count) + self
    }
    return self
  }
}


internal extension UIView {
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
public class MasonInput: UIView,MasonEventTarget, MasonElement, StyleChangeListener{
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
      if(font || size){
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
    case .Submit:
      break
    }
  }
  
  
  required init?(coder: NSCoder) {
    node = NSCMason.shared.createNode()
    mason = NSCMason.shared
    super.init(coder: coder)
  }
  public let node: MasonNode
  
  public let mason: NSCMason
  
  internal lazy var dateInput: MasonDateInput  = {
    let date = MasonDateInput()
    date.owner = self
    return date
  }()
  
  
  internal lazy var textInput: MasonTextInput  = {
    let field = MasonTextInput()
    field.owner = self
    
    if(style.font.uiFont == nil){
      style.font.loadSync { _ in }
    }
    if let font = style.font.uiFont {
      field.font = font
    }
    
    field.autocorrectionType = .no
    return field
  }()
  
  internal lazy var passwordInput: MasonPasswordInput = {
    let input = MasonPasswordInput()
    input.owner = self
    if(style.font.uiFont == nil){
      style.font.loadSync { _ in }
    }
    if let font = style.font.uiFont {
      input.font = font
    }
    return input
  }()
  
  
  internal lazy var buttonInput: UIButton  = {
    let btn = UIButton()
    let recognizer = MasonGestureRecognizer(targetView: btn)
    recognizer.owner = self
    btn.addGestureRecognizer(recognizer)
    return btn
  }()
  
  
  internal lazy var submitInput: UIButton  = {
    let btn = UIButton()
    let recognizer = MasonGestureRecognizer(targetView: btn)
    recognizer.owner = self
    recognizer.isSubmit = true
    btn.addGestureRecognizer(recognizer)
    return btn
  }()
  
  
  internal lazy var checkboxInput: MasonCheckboxInput  = {
    let cb = MasonCheckboxInput()
    cb.owner = self
    return cb
  }()
  
  internal lazy var radioInput: MasonRadioInput  = {
    let rb = MasonRadioInput()
    rb.owner = self
    return rb
  }()
  
  internal lazy var rangeInput: MasonRangeInput  = {
    let range = MasonRangeInput()
    range.owner = self
    range.contentVerticalAlignment = .center
    range.maximumValueImage = nil
    range.minimumValueImage = nil
    range.setMinimumTrackImage(rangeTrackImage(fillColor: UIColor.systemGreen), for: .normal)
    range.setMinimumTrackImage(rangeTrackImage(fillColor: .systemGreen.darker()), for: .highlighted)
    
    range.setMaximumTrackImage(rangeTrackImage(fillColor: .systemGray5), for: .normal)
    range.setMaximumTrackImage(rangeTrackImage(fillColor: .systemGray5.darker()), for: .highlighted)
    
    range.setThumbImage(rangeThumbImage(innerColor: .systemGray.darker()), for: .normal)
    range.setThumbImage(rangeThumbImage(innerColor: .systemGreen.darker()), for: .highlighted)
    
    return range
  }()
  
  internal lazy var numberInput: MasonNumberInput  = {
    let ctrl = MasonNumberInput()
    ctrl.owner = self
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
  
  internal lazy var fileInput: MasonFileInput = {
    let control = MasonFileInput()
    control.owner = self
    control.configure(attributes: node.getDefaultAttributes())
    control.onContentSizeChanged = { [weak self] in
      self?.invalidateLayout()
    }
    return control
  }()
  
  public var accept: String = "*/*"
  
  
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
  public var value: String {
    set {
      switch type {
      case .Text, .Email, .Url, .Tel:
        textInput.text = newValue
      case .Password:
        passwordInput.text = newValue
      case .Button, .Submit:
        let attributes = node.getDefaultAttributes()
        let title = NSAttributedString(string: newValue, attributes: attributes)
        if(type == MasonInputType.Submit){
          submitInput.setAttributedTitle(title, for: .normal)
        }else {
          buttonInput.setAttributedTitle(title, for: .normal)
        }
      case .Checkbox:
        checkboxInput.isChecked = (newValue == "true")
      case .Date:
        dateInput.value = newValue
      case .Radio:
        radioInput.isSelected = (newValue == "true")
      case .Number:
        numberInput.value = Int(newValue) ?? 0
      case .Range:
        rangeInput.value = Float(newValue) ?? 0
      case .Color:
        if let color = UIColor(css: newValue) {
          colorInput.selectedColor = color
        }
      case .File:
        fileInput.labelText = newValue
      }
    }
    get {
      switch type {
      case .Text, .Email, .Url, .Tel:
        return textInput.text ?? ""
      case .Password:
        return passwordInput.text ?? ""
      case .Button:
        return buttonInput.currentAttributedTitle?.string ?? ""
      case .Submit:
        return submitInput.currentAttributedTitle?.string ?? ""
      case .Checkbox:
        return checkboxInput.isChecked ? "true" : "false"
      case .Date:
        return dateInput.value
      case .Radio:
        return radioInput.isSelected ? "true" : "false"
      case .Number:
        return String(numberInput.value)
      case .Range:
        return String(rangeInput.value)
      case .Color:
        return colorInput.selectedColor?.toCSS(includeAlpha: true) ?? "#000000"
      case .File:
        return fileInput.labelText
      }
    }
  }
  
  
  
  public var valueAsNumber: Double {
    get {
      switch type {
      case .Number:
        return Double(numberInput.value)
      case .Range:
        return Double(rangeInput.value)
      case .Text, .Email, .Url, .Tel:
        if let txt = textInput.text, let d = Double(txt) { return d }
        return Double.nan
      case .Password:
        if let txt = passwordInput.text, let d = Double(txt) { return d }
        return Double.nan
      case .Date:
        if let d = valueAsDate { return d.timeIntervalSince1970 }
        return Double.nan
      default:
        return Double.nan
      }
    }
    set {
      if newValue.isNaN {
        value = ""
        return
      }
      
      switch type {
      case .Number:
        numberInput.value = Int(newValue)
        value = String(numberInput.value)
      case .Range:
        rangeInput.value = Float(newValue)
        value = String(newValue)
      case .Text, .Email, .Url, .Tel, .Password:
        value = String(newValue)
      case .Date:
        let date = Date(timeIntervalSince1970: newValue)
        valueAsDate = date
      default:
        value = String(newValue)
      }
    }
  }
  
  public var valueAsDate: Date? {
    get {
      let iso = ISO8601DateFormatter()
      let simple = DateFormatter()
      simple.calendar = Calendar(identifier: .gregorian)
      simple.locale = Locale(identifier: "en_US_POSIX")
      simple.timeZone = TimeZone(secondsFromGMT: 0)
      simple.dateFormat = "yyyy-MM-dd"
      
      switch type {
      case .Date:
        let s = dateInput.value
        if let d = simple.date(from: s) { return d }
        return nil
      case .Text, .Email, .Url, .Tel:
        if let d = iso.date(from: value) { return d }
        if let d = simple.date(from: value) { return d }
        return nil
      case .Password:
        if let txt = passwordInput.text {
          if let d = iso.date(from: txt) { return d }
          if let d = simple.date(from: txt) { return d }
        }
        return nil
      default:
        return nil
      }
    }
    set {
      guard let d = newValue else {
        value = ""
        return
      }
      
      let simple = DateFormatter()
      simple.calendar = Calendar(identifier: .gregorian)
      simple.locale = Locale(identifier: "en_US_POSIX")
      simple.timeZone = TimeZone(secondsFromGMT: 0)
      simple.dateFormat = "yyyy-MM-dd"
      
      switch type {
      case .Date:
        dateInput.value = simple.string(from: d)
        value = dateInput.value
      case .Text, .Email, .Url, .Tel, .Password:
        value = simple.string(from: d)
      default:
        value = simple.string(from: d)
      }
    }
  }
  
  public var placeholder: String = "" {
    didSet {
      switch type {
      case .Text, .Email:
        textInput.placeholder = placeholder
      case .Password:
        passwordInput.placeholder = placeholder
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
      case .Submit:
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
      case .Button, .Submit:
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
    case .Text, .Email, .Url, .Tel:
      textInput.frame = inputSize
      break
    case .Password:
      passwordInput.frame = inputSize
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
    case .Submit:
      submitInput.frame = inputSize
      break
    default:
      break
    }
  }
  
  private func configureInput(_ type: MasonInputType){
    let scale = NSCMason.scale
    if(!initializing){
      for subview in subviews {
        subview.removeFromSuperview()
      }
    }
    switch type {
    case .Text, .Email, .Password, .Tel, .Url:
      textInput.tintColor = UIColor.colorFromARGB(style.resolvedColor)
      configure { style in
        style.border = "2px"
        style.borderRadius = "4px"
        style.padding = MasonRect(.Points(scale), .Points(scale * 2), .Points(scale), .Points(scale * 2))
        style.textAlign = TextAlign.Center
      }
      switch(type){
      case .Tel:
        textInput.keyboardType = .phonePad
      case .Url:
        textInput.keyboardType = .URL
      case .Email:
        textInput.keyboardType = .emailAddress
        break
      case .Password:
        // For password use a real secure `UITextField` instead of `UITextView`.
        passwordInput.isSecureTextEntry = true
        passwordInput.textContentType = .password
        passwordInput.autocapitalizationType = .none
        passwordInput.autocorrectionType = .no
        break
      default:
        break
      }
      if type == .Password {
        addSubview(passwordInput)
      } else {
        addSubview(textInput)
      }
    case .Date:
      configure { style in
        style.border = ""
        style.borderRadius = ""
        style.padding = MasonRect(uniform: .Zero)
        style.textAlign = TextAlign.Auto
      }
      addSubview(dateInput)
      break
    case .Button, .Submit:
      configure { style in
        style.border = "2px"
        style.borderRadius = "4px"
        style.padding = MasonRect(.Points(1), .Points(6), .Points(1), .Points(6))
        style.textAlign = TextAlign.Center
      }
      if(type == MasonInputType.Submit){
        addSubview(submitInput)
      }else {
        addSubview(buttonInput)
      }
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
      configure { style in
        style.border = ""
        style.borderRadius = ""
        style.padding = MasonRect(uniform: .Zero)
        style.textAlign = TextAlign.Auto
      }
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
    initializing = false
  }
}
