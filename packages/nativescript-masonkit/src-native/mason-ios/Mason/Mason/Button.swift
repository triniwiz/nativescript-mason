//
//  Button.swift
//  Mason
//
//  Created by Osei Fortune on 01/12/2025.
//

import UIKit


@objc(MasonButton)
public class Button: UIControl, MasonElement, MasonElementObjc, StyleChangeListener {
  public let node: MasonNode
  public let mason: NSCMason
  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
    return node.style
  }
  
  
  private func updateTitle(){
    cachedText = NSAttributedString(string: text, attributes: getDefaultAttributes())
    button.setAttributedTitle(cachedText, for: .normal)
  }
  
  internal var cachedText: NSAttributedString? = nil
  
  internal var button = UIButton(type: .system)
  
  public var text: String = "" {
    didSet {
      updateTitle()
    }
  }
  
  
  internal let bgLayer = CALayer()
    
  public override func draw(_ rect: CGRect) {
    
    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }
    
    style.mBackground.draw(on: bgLayer, in: context, rect: bounds)
    
    style.mBorderRender.draw(in: context, rect: bounds)
    
  }
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    bgLayer.frame = bounds
    button.frame = bounds
  }
  
  
  private func setup(){
    isOpaque = false
    node.style.display = Display.InlineBlock
    node.view = self
    style.setStyleChangeListener(listener: self)
    bgLayer.needsDisplayOnBoundsChange = true
    layer.addSublayer(bgLayer)
    addSubview(button)
    
    node.measureFunc = { known, available in
      var ret = CGSize.zero
      var hasKnownWidth = false
      var hasKnownHeight = false
      if let known = known {
        if(!known.width.isNaN && !known.height.isNaN){
          self.node.cachedWidth = known.width
          self.node.cachedHeight = known.height
          return known
        }
        
        if(!known.width.isNaN){
          ret.width = known.width
          hasKnownHeight = true
        }
        
        if(!known.height.isNaN){
          ret.height = known.height
          hasKnownWidth = true
        }
      }
      
      var contentSize: CGSize = .init(width: CGFloat.greatestFiniteMagnitude, height: .greatestFiniteMagnitude)
      
      if(hasKnownWidth){
        contentSize.width = known?.width ?? .zero
      }
      
      if(hasKnownHeight){
        contentSize.height = known?.height ?? .zero
      }
      
      
      
      if(!hasKnownWidth || !hasKnownHeight){
        ret = self.sizeThatFits(.init(width: contentSize.width, height: contentSize.height))
      }
          
      
      ret.width = ret.width * CGFloat(NSCMason.scale)
      ret.height = ret.height * CGFloat(NSCMason.scale)
      
      
      self.node.cachedWidth = ret.width
      self.node.cachedHeight = ret.height
      
      return ret
      
    }
    node.setMeasureFunction(node.measureFunc!)
  }
  
  public var textValues: NSMutableData {
    get {
      return style.textValues
    }
  }
  
  // Update attributes on all direct TextNode children when styles change
  internal func updateStyleOnTextNodes() {
    let defaultAttrs = getDefaultAttributes()
    
    for child in node.children {
      if let child = (child as? MasonTextNode), child.container == self {
        // Only update TextNodes that belong to THIS TextView
        // Don't touch TextNodes that belong to child TextViews
        child.attributes = defaultAttrs
      }
    }
  }
  
  func onTextStyleChanged(change: Int64) {
    let change = TextStyleChangeMasks(rawValue: change)
    var dirty = false
    var layout = false
    if (change.contains(.color)) {
      dirty = true
    }
    
    if (change.contains(.fontSize)) {
      layout = true
      dirty = true
    }
    
    if (change.contains(.fontWeight) || change.contains(.fontStyle) || change.contains(.fontFamily)) {
      dirty = true
    }
    
    
    if (
      change.contains(.textWrap) || change.contains(.whiteSpace) || change.contains(.textTransform) || change.contains(.decorationLine) || change.contains(.decorationColor) || change.contains(.decorationStyle) || change.contains(.letterSpacing) || change.contains(.textJustify) || change.contains(.backgroundColor) || change.contains(.lineHeight)
    ) {
      dirty = true
    }
    
    
    if (dirty) {
      updateStyleOnTextNodes()
      updateTitle()
      if (layout) {
        if (node.isAnonymous) {
          node.layoutParent?.markDirty()
        }
        invalidateLayout()
      }else {
        invalidate()
      }
    }
  }
  
  
  public override init(frame: CGRect) {
    node = NSCMason.shared.createNode()
    mason = NSCMason.shared
    super.init(frame: frame)
    setup()
  }
  
  
  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    setup()
  }
  
  
  required init?(coder: NSCoder) {
    node = NSCMason.shared.createNode()
    mason = NSCMason.shared
    super.init(coder: coder)
    setup()
  }
  
  
  
}
