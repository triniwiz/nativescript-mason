//
//  Img.swift
//  Mason
//
//  Created by Osei Fortune on 07/05/2025.
//
import UIKit


@objc(MasonLoadingState)
public enum LoadingState: Int, RawRepresentable {
    case Loading
    case Loaded
    case Error
    
    public typealias RawValue = Int32
    
    public var rawValue: RawValue {
        switch self {
        case .Loading:
            return 0
        case .Loaded:
            return 1
        case .Error:
            return 2
        }
    }
    
    
    public init?(rawValue: RawValue) {
        switch rawValue {
        case 0:
          self = .Loaded
        case 1:
          self = .Loaded
        case 2:
          self = .Error
        default:
            return nil
        }
    }
}

@objcMembers
@objc(MasonImg)
public class Img: UIImageView, MasonElement, MasonElementObjc {
  
  public let node: MasonNode
  public let mason: NSCMason
  
  public var uiView: UIView {
    return self
  }
  
  public var style: MasonStyle {
    return node.style
  }
  
  public var didLayout: (() -> Void)?
  
  public var onStateChange: ((LoadingState, Error?) -> Void)?
  
  public override var image: UIImage? {
    didSet {
      self.setNeedsDisplay()
      requestLayout()
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
          self.onStateChange?(.Loaded, error)
          return
        }

        DispatchQueue.main.async {
          self.image = image
          self.setNeedsDisplay()
          self.node.markDirty()
          self.requestLayout()
          self.onStateChange?(.Loaded, nil)
        }
      })
      onStateChange?(.Loading, nil)
      currentTask?.resume()
    }
  }
  
  
  
  public func updateImage(_ image: UIImage?) {
    if(image != nil){
      onStateChange?(.Loading, nil)
    }
    self.image = image
    setNeedsDisplay()
    node.markDirty()
    requestLayout()
    onStateChange?(.Loaded, nil)
  }
  
  init(mason doc: NSCMason) {
    node = doc.createNode()
    node.style.display = Display.Inline
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
  
  private static func measure(_ view: Img, _ known: CGSize?, _ available: CGSize) -> CGSize {
    var ret = CGSize.zero
    if let known = known {
      if(!known.width.isNaN && !known.height.isNaN){
        view.node.cachedWidth = known.width
        view.node.cachedHeight = known.height
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
    
    view.node.cachedWidth = ret.width
    view.node.cachedHeight = ret.height
    
    return ret
  }
}
