//
//  MasonCheckboxInput.swift
//  Mason
//
//  Created by Osei Fortune on 08/01/2026.
//

import UIKit

class MasonCheckboxInput: UIControl {

  internal var owner: MasonElement?
  
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
  
  private func dispatchInputAndChange() {
      guard let owner = owner else { return }

      let input = MasonInputEvent(
          type: "input",
          data: nil,
          inputType: "insertReplacementText",
          options: MasonEventOptions(
              isComposing: true
          )
      ).apply{ event in
        event.bubbles = true
        event.cancelable = false
      }
      input.target = owner
      owner.node.mason.dispatch(input, owner.node)

      let change = MasonInputEvent(
          type: "change",
          data: nil,
          inputType: "insertReplacementText",
          options: MasonEventOptions(
              isComposing: true
          )
      ).apply{ event in
        event.bubbles = true
        event.cancelable = false
      }
      change.target = owner
      owner.node.mason.dispatch(change, owner.node)
  }
  
  private func setChecked(_ checked: Bool) {
      isChecked = checked
  }

  func setCheckedFromUser(_ checked: Bool) {
      isChecked = checked
      dispatchInputAndChange()
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let owner = owner else {
            isChecked.toggle()
            return
        }

        let before = MasonInputEvent(
            type: "beforeinput",
            data: nil,
            inputType: "insertReplacementText",
            options: MasonEventOptions(
                isComposing: true
            )
        ).apply{ event in
          event.bubbles = true
          event.cancelable = true
        }
        before.target = owner
        owner.node.mason.dispatch(before, owner.node)

        if before.defaultPrevented {
            return
        }

        setCheckedFromUser(!isChecked)
    }
}
