//
//  Img.swift
//  Mason
//
//  Created by Osei Fortune on 07/05/2025.
//
import UIKit

@objcMembers
@objc(MasonImg)
public class Img: UIImageView, MasonElement {
  
  public var uiView: UIView {
    return self
  }
  
  
  public let node: MasonNode
  public let mason: NSCMason
  
  public var didLayout: (() -> Void)?
  
  public func requestLayout(){
    node.markDirty()
    let root = node.getRootNode()
    if let view = root.view as? MasonElement {
      let computed = view.computeCache()
      view.computeWithSize(Float(computed.width), Float(computed.height))
      didLayout?()
    }
  }
  
  private var currentTask: URLSessionDataTask?
  public var src: String? {
    didSet {
      currentTask?.cancel()
      guard let src = src, let url = URL(string: src) else {return}
      let request = URLRequest(url: url)
      
      currentTask = URLSession.shared.dataTask(with: request, completionHandler: { data, response, error in
        guard let data = data,  let image = UIImage(data: data) else {
          self.image = nil
          self.requestLayout()
          self.setNeedsDisplay()
          return
        }

        DispatchQueue.main.async {
          self.image = image
          self.requestLayout()
          self.setNeedsDisplay()
          
        }
      })
      
      currentTask?.resume()
    }
  }
  
  
  
  public func updateImage(_ image: UIImage?) {
    self.image = image
    requestLayout()
    setNeedsDisplay()
  }
  
  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    isOpaque = false
    node.view = self
    node.measureFunc = { known, available in
      return Img.measure(self, known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  public func syncStyle(_ state: String) {
    guard let stateValue = Int64(state, radix: 10) else {return}
  //  let keys = StateKeys(rawValue: UInt64(stateValue))
    if (stateValue != -1) {
      style.isDirty = stateValue
      style.updateNativeStyle()
    }
  }
  
  private static func measure(_ view: Img, _ known: CGSize?, _ available: CGSize) -> CGSize {
    var ret = CGSize.zero
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
