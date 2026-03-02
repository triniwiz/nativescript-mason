//
//  Img.swift
//  Mason
//
//  Created by Osei Fortune on 07/05/2025.
//
import UIKit
@_implementationOnly import SDWebImage

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
  weak var view: Img?
  
  var image: UIImage? {
    didSet {
      contentsLayer.contents = image?.cgImage
    }
  }
  
  internal var fit: ObjectFit = .Fill
  
  let contentsLayer = CALayer()

  private func setup(){
    masksToBounds = true
    contentsLayer.contentsGravity = .resizeAspectFill
    contentsLayer.contentsScale = UIScreen.main.scale
    addSublayer(contentsLayer)
  }
  
  public override init() {
    super.init()
    needsDisplayOnBoundsChange = true
    setup()
  }
  
  public init(view: Img) {
    self.view = view
    super.init()
    needsDisplayOnBoundsChange = true
    setup()
  }
  
  public override init(layer: Any) {
    let other = layer as! MasonImageLayer
    self.view = other.view
    super.init(layer: layer)
    needsDisplayOnBoundsChange = true
    setup()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  public override func draw(in context: CGContext) {
    guard bounds.width > 0, bounds.height > 0  else {
      return
    }
    
    guard let view = view else { return }

//    guard let view = view, let image = image else {
//      context.clear(bounds)
//      return
//    }
    
    view.style.mBackground.draw(on: self, in: context, rect: bounds)
    
    /*
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
    
    */
    
    view.style.mBorderRender.draw(in: context, rect: bounds)
  }
  
  
  public override func layoutSublayers() {
      super.layoutSublayers()
      contentsLayer.frame = bounds
  }
}

@objcMembers
@objc(MasonImg)
public class Img: UIView, MasonEventTarget, MasonElement, MasonElementObjc {
  
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
      masonLayer.image = image
      node.markDirty()
      requestLayout()
    }
  }
  
  public func requestLayout() {
    let change = style.objectFit
    if(masonLayer.fit != change){
      setObjectFit(change)
    }
    node.parentElement?.requestLayout()
  }
  
  func setObjectFit(_ fit: ObjectFit) {
    masonLayer.fit = fit
    switch fit {
      case .Fill:
          masonLayer.contentsLayer.contentsGravity = .resize
      case .Contain:
          masonLayer.contentsLayer.contentsGravity = .resizeAspect
      case .Cover:
          masonLayer.contentsLayer.contentsGravity = .resizeAspectFill
      default:
          masonLayer.contentsLayer.contentsGravity = .resizeAspect
      }
  }
  
  internal var state: LoadingState? = nil
  
  internal func loadImage(){
    let current = CFRunLoopGetCurrent()
    guard let src = src, let url = URL(string: src) else {
      if let current = current {
        CFRunLoopPerformBlock(current, CFRunLoopMode.commonModes.rawValue) {
          self.state = .Loaded
          self.image = nil
          self.onStateChange?(.Loaded, nil)
        }
        CFRunLoopWakeUp(current)
      }else {
        self.state = .Loaded
        self.image = nil
        self.onStateChange?(.Loaded, nil)
      }
      self.state = nil
      return
    }
    self.state = .Loading
    onStateChange?(.Loading, nil)
    if let image = SDImageCache.shared.imageFromCache(forKey: src) {
      if let current = current {
        CFRunLoopPerformBlock(current, CFRunLoopMode.commonModes.rawValue) {
          self.state = .Loaded
          self.image = image
          self.onStateChange?(.Loaded, nil)
        }
        CFRunLoopWakeUp(current)
      }else {
        self.state = .Loaded
        self.image = image
        self.onStateChange?(.Loaded, nil)
      }
    }else {
      SDWebImageManager.shared.loadImage(with: url, progress: nil) { image, _ , error, type, finished, _ in
        if let current = current {
          CFRunLoopPerformBlock(current, CFRunLoopMode.commonModes.rawValue) {
            self.state = .Loaded
            self.image = image
            self.onStateChange?(.Loaded, error)
          }
          CFRunLoopWakeUp(current)
        }else {
          self.state = .Loaded
          self.image = image
          self.onStateChange?(.Loaded, error)
        }
      }
    }
  }
  public var src: String? {
    didSet {
      loadImage()
    }
  }
  
  public func updateImage(_ image: UIImage?) {
    if(image != nil){
      self.state = .Loading
      onStateChange?(.Loading, nil)
    }
    self.state = .Loaded
    self.image = image
    onStateChange?(.Loaded, nil)
  }
  
  
  init(mason doc: NSCMason) {
    node = doc.createImageNode()
    mason = doc
    super.init(frame: .zero)
    masonLayer.view = self
    masonLayer.contentsScale = UIScreen.main.scale
    isOpaque = false
    node.view = self
    node.measureFunc = { [weak self] known, available in
      guard let self = self else { return .zero }
      return Img.measure(self, known, available)
    }
    node.setMeasureFunction(node.measureFunc!)
  }
  
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    autoComputeIfRoot()
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
