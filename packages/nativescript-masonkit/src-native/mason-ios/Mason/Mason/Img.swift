//
//  Img.swift
//  Mason
//
//  Created by Osei Fortune on 07/05/2025.
//
import UIKit

@objcMembers
@objc(MasonImg)
public class MasonImg: UIImageView, MasonView {
  public var style: MasonStyle {
    return node.style
  }
  
  public func markNodeDirty() {
    node.markDirty()
  }
  
  public func isNodeDirty() -> Bool {
    return node.isDirty
  }
  
  public func configure(_ block: (MasonNode) -> Void) {
    node.configure(block)
  }
  
  public var uiView: UIView {
    return self
  }
  
  public let node: MasonNode
  public let mason: NSCMason
  
  private var rootNode: MasonNode {
    var current = self.node
    while let parent = current.owner {
      current = parent
    }
    return current
  }
  
  private var currentTask: URLSessionDataTask?
  public var src: String? {
    didSet {
      currentTask?.cancel()
      guard let src = src, let url = URL(string: src) else {return}
      let request = URLRequest(url: url)
      
      currentTask = URLSession.shared.dataTask(with: request, completionHandler: { data, response, error in
        guard let data = data,  let image = UIImage(data: data) else {
          // todo
          return
        }

        DispatchQueue.main.async {
          print(self.bounds)
          self.image = image
          self.node.markDirty()
          
          self.setNeedsDisplay()
          
        }
      })
      
      currentTask?.resume()
    }
  }
  
  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    node.data = self
    isOpaque = false
    node.measureFunc = { known, available in
      return MasonImg.measure(self, known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  public func syncStyle(_ state: String) {
    guard let stateValue = Int64(state, radix: 10) else {return}
    let keys = StateKeys(rawValue: UInt64(stateValue))
    if (stateValue != -1) {
      style.isDirty = stateValue
      style.updateNativeStyle()
    }
  }
  
  private static func measure(_ view: MasonImg, _ known: CGSize?, _ available: CGSize) -> CGSize {
    var ret = CGSize.zero
    print(known, available)
    if let known = known {
      if(!known.width.isNaN && !known.height.isNaN){
        return known
      }
      
      if(!known.width.isNaN){
        ret.width = known.width
      }
      
      if(!known.height.isNaN){
        ret.height = known.height
      }
    }
    
    
    if let image = view.image {
      if let cgImage = image.cgImage {
        ret.width = CGFloat(cgImage.width)
        ret.height = CGFloat(cgImage.height)
      }
      
      if let ciImage = image.ciImage {
        ret.width = CGFloat(ciImage.extent.width)
        ret.height = CGFloat(ciImage.extent.height)
      }
    }
    return ret
  }
}
