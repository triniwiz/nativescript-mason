//
//  MasonInput.swift
//  Mason
//
//  Created by Osei Fortune on 03/01/2026.
//

import UIKit

@objcMembers
@objc(MasonInput)
public class MasonInput: UIView, MasonElement {
  
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

      ctx.setStrokeColor(UIColor.label.cgColor)
      ctx.setLineWidth(1.5)
      ctx.stroke(box)

      if isChecked {
        ctx.setLineWidth(2)
        ctx.move(to: CGPoint(x: box.minX + 3, y: box.midY))
        ctx.addLine(to: CGPoint(x: box.midX - 1, y: box.maxY - 4))
        ctx.addLine(to: CGPoint(x: box.maxX - 3, y: box.minY + 4))
        ctx.strokePath()
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
      ctx.setStrokeColor(UIColor.label.cgColor)
      ctx.setLineWidth(1.5)
      ctx.strokeEllipse(in: circleRect)

      if isSelectedRadio {
        let innerDiameter: CGFloat = 12
        let innerRect = CGRect(
          x: circleRect.midX - innerDiameter / 2,
          y: circleRect.midY - innerDiameter / 2,
          width: innerDiameter,
          height: innerDiameter
        )

        ctx.setFillColor(UIColor.label.cgColor)
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
      case .Text,.Email:
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
    case .Radio, .Checkbox:
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
      case .Text, .Email, .Password:
        size.width = max(CGFloat(self.size) * (ch.width * scale) , 150)
        size.height = ch.height * scale
      case .Button:
        let value = self.measureText(self.value)
        size.width = min(value.width * scale, 64 * scale)
        size.height = min(value.height * scale, 32 * scale)
        break
      case .Checkbox, .Radio:
        size.width =  24 * scale
        size.height = 24 * scale
        break
      case .Date:
        break
      case .Number:
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
    //style.setStyleChangeListener(listener: self)
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
    default:
      break
    }
  }
  
  private func setup(_ mason: NSCMason, _ type: MasonInputType){
    node.style.setUInt32(StyleKeys.ITEM_IS_REPLACED, 1)
    node.style.display = Display.Inline
    self.type = type
  }
}
