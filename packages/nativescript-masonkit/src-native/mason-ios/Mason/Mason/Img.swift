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
      self = .Loading
    case 1:
      self = .Loaded
    case 2:
      self = .Error
    default:
      return nil
    }
  }
}


public class MasonImageLayer: CALayer {
  weak var view: Img? = nil
  
  public override init() {
    super.init()
    needsDisplayOnBoundsChange = true
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    needsDisplayOnBoundsChange = true
  }
  
  
  public override func draw(in context: CGContext) {
    guard bounds.width > 0, bounds.height > 0  else {
      return
    }
    
    guard let view = view,
          let image = view.image else {
      context.clear(bounds)
      return
    }
    
    view.style.mBackground.draw(on: self, in: context, rect: bounds)
    
    let imageSize = CGSize(width: image.size.width * 3, height: image.size.height * 3)
    let viewSize = bounds.size
    
    let fit = view.style.objectFit
    let drawRect: CGRect
    
    switch fit {
    case .Fill:
      drawRect = bounds
      
    case .Contain:
      let scale = min(viewSize.width / imageSize.width,
                      viewSize.height / imageSize.height)
      let w = imageSize.width * scale
      let h = imageSize.height * scale
      drawRect = CGRect(
        x: (viewSize.width - w) / 2,
        y: (viewSize.height - h) / 2,
        width: w,
        height: h
      )
      
    case .Cover:
      let scale = max(viewSize.width / imageSize.width,
                      viewSize.height / imageSize.height)
      let w = imageSize.width * scale
      let h = imageSize.height * scale
      drawRect = CGRect(
        x: (viewSize.width - w) / 2,
        y: (viewSize.height - h) / 2,
        width: w,
        height: h
      )
      
    case .None:
      drawRect = CGRect(
        x: (viewSize.width - imageSize.width) / 2,
        y: (viewSize.height - imageSize.height) / 2,
        width: imageSize.width,
        height: imageSize.height
      )
      
    case .ScaleDown:
      let fitsWithoutScaling =
      imageSize.width <= viewSize.width &&
      imageSize.height <= viewSize.height
      
      if fitsWithoutScaling {
        drawRect = CGRect(
          x: (viewSize.width - imageSize.width) / 2,
          y: (viewSize.height - imageSize.height) / 2,
          width: imageSize.width,
          height: imageSize.height
        )
      } else {
        let scale = min(viewSize.width / imageSize.width,
                        viewSize.height / imageSize.height)
        let w = imageSize.width * scale
        let h = imageSize.height * scale
        drawRect = CGRect(
          x: (viewSize.width - w) / 2,
          y: (viewSize.height - h) / 2,
          width: w,
          height: h
        )
      }
    }
    
    context.saveGState()
    context.clip(to: bounds)  // same as CSS overflow hidden
    UIGraphicsPushContext(context)
    image.draw(in: drawRect)
    UIGraphicsPopContext()
    context.restoreGState()
    
    view.style.mBorderRender.draw(in: context, rect: bounds)
  }
}

@objcMembers
@objc(MasonImg)
public class Img: UIView, MasonElement, MasonElementObjc {
  
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
  
  public override class var layerClass: AnyClass { MasonImageLayer.self }
  
  private func intrinsicContentSizeFitsInsideBounds() -> Bool {
    guard let image = self.image?.cgImage else { return true }
    
    let iw = CGFloat(image.width)
    let ih = CGFloat(image.height)
    let vw = bounds.width
    let vh = bounds.height
    
    return iw <= vw && ih <= vh
  }
  
  var masonLayer: MasonImageLayer {
    return layer as! MasonImageLayer
  }
  
  public var image: UIImage? {
    didSet {
      requestLayout()
      setNeedsDisplay()
    }
  }
  
  public func requestLayout() {
    let change = style.objectFit
    if(fit != change){
      setObjectFit(change)
    }
  }
  
  func setObjectFit(_ fit: ObjectFit) {
    setNeedsDisplay()
  }
  
  public override func setNeedsDisplay() {
    super.setNeedsDisplay()
    masonLayer.setNeedsDisplay()
  }
  
  private var fit: ObjectFit = .Fill
  
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
          self.node.markDirty()
          self.requestLayout()
          self.setNeedsDisplay()
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
    node.markDirty()
    requestLayout()
    setNeedsDisplay()
    onStateChange?(.Loaded, nil)
  }
  
  init(mason doc: NSCMason) {
    node = doc.createNode()
    node.style.display = Display.Inline
    mason = doc
    super.init(frame: .zero)
    masonLayer.view = self
    masonLayer.contentsScale = UIScreen.main.scale
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
