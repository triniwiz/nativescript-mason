//
//  MasonGestureRecognizer.swift
//  Mason
//
//  Created by Osei Fortune on 11/01/2026.
//

import UIKit

class MasonGestureRecognizer: UIGestureRecognizer {
  weak var owner: MasonElement?
  weak var targetView: UIView?
  internal var isSubmit: Bool = false
  var eventDispatched: Bool = false
  private let isButton: Bool
  init(targetView: UIView) {
    self.targetView = targetView
    isButton = targetView is UIButton
    super.init(target: nil, action: nil)
  }
  
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    guard let touch = touches.first else { return }
    if let view = targetView {
      let location = touch.location(in: view)
      
      if(isButton){
        let click = MasonMouseEvent(
          type: "click",
          options: MasonMouseEventOptions().apply {
            $0.clientX = Float(location.x)
            $0.clientY = Float(location.y)
            $0.screenX = Float(location.x)
            $0.screenY = Float(location.y)
            $0.pageX = Float(location.x)
            $0.pageY = Float(location.y)
          }
        )
        click.target = view
        
        if let owner = owner {
          owner.node.mason.dispatch(click, owner.node)
        }
        
        
        if click.defaultPrevented {
          state = .failed
        } else {
          state = .recognized
        }
        
        
        
        
        
        // todo handle form submit
        
        /*
         if(!click.defaultPrevented){}
         let submit = MasonEvent(
         type: "submit",
         options: MasonEventOptions(
         type: "submit",
         bubbles: true,
         cancelable: true
         )
         )
         submit.target = self
         node.mason.dispatch(submit, node)
         */
      }
      
      eventDispatched = true
    }
  }
  
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
    if !eventDispatched {
      state = .failed
    }
  }
  
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
    state = .cancelled
  }
  
  override func reset() {
    eventDispatched = false
    state = .possible
  }
}
