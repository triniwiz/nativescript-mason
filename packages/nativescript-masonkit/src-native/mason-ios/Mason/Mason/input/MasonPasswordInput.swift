//
//  MasonPasswordInput.swift
//  Mason
//
//  Created by Osei Fortune on 08/01/2026.
//

import UIKit


class MasonPasswordInput: UITextField, UITextFieldDelegate {
  internal var owner: MasonElement? = nil
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    commonInit()
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    commonInit()
  }
  
  
  private func commonInit() {
    delegate = self
    isSecureTextEntry = true
    textContentType = .password
    autocapitalizationType = .none
    autocorrectionType = .no
  }
  
  
  private var lastInputType: String? = nil
  
  
  func textViewDidChange(_ textView: UITextView) {
    guard let owner = owner else { return }
    
    let event = MasonInputEvent(
      type: "input",
      data: textView.text,
      inputType: lastInputType ?? "insertText",
      options: MasonEventOptions(
        type: "input",
        bubbles: true,
        cancelable: false,
        isComposing: true
      )
    )
    event.target = owner
    owner.node.mason.dispatch(event, owner.node)
    
    lastInputType = nil
  }
  

  
  func textFieldDidEndEditing(_ textField: UITextField) {
    guard let owner = owner else { return }
    
    let event = MasonEvent(
      type: "change",
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
  
  private var didPaste = false
  override func paste(_ sender: Any?) {
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
        type: "beforeinput",
        bubbles: true,
        cancelable: true,
        isComposing: true,
      )
    )
    
    event.target = owner
    
    owner.node.mason.dispatch(event,owner.node)
    
    if(!event.defaultPrevented){
      super.paste(sender)
    }
  }
  
  private var didCut = false
  override func cut(_ sender: Any?) {
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
        type: "beforeinput",
        bubbles: true,
        cancelable: true,
        isComposing: true,
      )
    )
    
    event.target = owner
    
    owner.node.mason.dispatch(event,owner.node)
    
    if(!event.defaultPrevented){
      super.cut(sender)
    }
  }
  
  func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
    let isRedoingOrUndoing = textField.undoManager?.isRedoing ?? false || textField.undoManager?.isUndoing ?? false
    
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
    var type = mapTextInputType(current: textField.text ?? "", range: range, replacement: string)
    
    if let undoManager = textField.undoManager {
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
        type: "beforeinput",
        bubbles: true,
        cancelable: true,
        isComposing: true,
      )
    )
    
    event.target = owner
    
    owner.node.mason.dispatch(event, owner.node)
    
    return !event.defaultPrevented
  }
}
