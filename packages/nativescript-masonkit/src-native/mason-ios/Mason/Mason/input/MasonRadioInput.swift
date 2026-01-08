//
//  MasonRadioInput.swift
//  Mason
//
//  Created by Osei Fortune on 08/01/2026.
//

import UIKit

class MasonRadioInput: UIControl {
  
  internal var owner: MasonElement?

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
  
  private func dispatchInputAndChange() {
      guard let owner = owner else { return }

      let input = MasonInputEvent(
          type: "input",
          data: nil,
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
          data: nil,
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
  
  private func setSelected(_ selected: Bool) {
      isSelectedRadio = selected
  }
  
  func setSelectedFromUser(_ selected: Bool) {
      guard selected else { return } // radios can't be deselected by user
      isSelectedRadio = true
      dispatchInputAndChange()
  }


  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let owner = owner else {
           setSelected(true)
           return
       }

       // If already selected → do nothing (web behavior)
       if isSelectedRadio {
           return
       }

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

      // todo
       // IMPORTANT: unselect other radios in the same group
       // owner.node.mason.unselectOtherRadios(inGroupOf: owner)

       setSelectedFromUser(true)
  }
}
