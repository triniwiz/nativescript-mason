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

  /// An SVG source, drawn as vectors at the size it is shown.
  var svg: SvgDocument? {
    didSet {
      svgRaster = nil
      if svg == nil && image == nil { contentsLayer.contents = nil }
      setNeedsLayout()
    }
  }
  private var svgRaster: (size: CGSize, color: UInt32)? = nil
  /// The SVG's whole object-fit box; `contentsLayer` shows the part inside the element.
  private var svgDrawSize: CGSize = .zero

  /// Rasterizes the SVG at its shown size and device scale; again when that or `currentColor` changes.
  func updateSvgContents() {
    guard let doc = svg, let view = view else { return }
    let size = svgDrawSize
    let color = doc.usesCurrentColor ? view.style.resolvedColor : 0
    if let r = svgRaster, r.size == size, r.color == color { return }
    svgRaster = (size, color)
    var image: CGImage? = nil
    if size.width > 0 && size.height > 0 {
      let scale = max(contentsScale, 1)
      let fit = min(1, maxImgSvgRasterPx / (max(size.width, size.height) * scale))
      image = renderSvgDocument(doc, size: CGSize(width: size.width * fit, height: size.height * fit), scale: scale,
                                currentColor: color)?.cgImage
    }
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    contentsLayer.contents = image
    CATransaction.commit()
  }

  private func setup(){
    masksToBounds = true
    contentsLayer.contentsGravity = .resizeAspectFill
    contentsLayer.contentsScale = CGFloat(NSCMason.scale)
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
    view.style.applyResolvedFilter(in: context, rect: bounds, view: view)
    // A redraw follows style changes, `color` among them.
    if svg != nil { updateSvgContents() }

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
      defer { if svg != nil { updateSvgContents() } }
      let imgW: CGFloat, imgH: CGFloat
      if let doc = svg {
        imgW = doc.width
        imgH = doc.height
      } else if let cgImage = image?.cgImage {
        imgW = CGFloat(cgImage.width) / contentsLayer.contentsScale
        imgH = CGFloat(cgImage.height) / contentsLayer.contentsScale
      } else {
        contentsLayer.frame = bounds
        contentsLayer.contentsRect = CGRect(x: 0, y: 0, width: 1, height: 1)
        return
      }
      guard let view = view, imgW > 0, imgH > 0 else {
        contentsLayer.frame = bounds
        contentsLayer.contentsRect = CGRect(x: 0, y: 0, width: 1, height: 1)
        return
      }

      let style = view.style
      let opXType = style.getUInt8(StyleKeys.OBJECT_POSITION_X_TYPE)
      let opYType = style.getUInt8(StyleKeys.OBJECT_POSITION_Y_TYPE)
      let opXPct = opXType != 0 ? CGFloat(style.getFloat(StyleKeys.OBJECT_POSITION_X_VALUE)) / 100.0 : 0.5
      let opYPct = opYType != 0 ? CGFloat(style.getFloat(StyleKeys.OBJECT_POSITION_Y_VALUE)) / 100.0 : 0.5

      let viewW = bounds.width
      let viewH = bounds.height
      let frame: CGRect

      switch fit {
      case .Cover:
        let scale = max(viewW / imgW, viewH / imgH)
        let w = imgW * scale
        let h = imgH * scale
        frame = CGRect(x: (viewW - w) * opXPct, y: (viewH - h) * opYPct, width: w, height: h)

      case .Contain:
        let scale = min(viewW / imgW, viewH / imgH)
        let w = imgW * scale
        let h = imgH * scale
        frame = CGRect(x: (viewW - w) * opXPct, y: (viewH - h) * opYPct, width: w, height: h)

      case .None:
        frame = CGRect(x: (viewW - imgW) * opXPct, y: (viewH - imgH) * opYPct, width: imgW, height: imgH)

      case .ScaleDown:
        let containScale = min(viewW / imgW, viewH / imgH)
        let scale = min(1.0, containScale)
        let w = imgW * scale
        let h = imgH * scale
        frame = CGRect(x: (viewW - w) * opXPct, y: (viewH - h) * opYPct, width: w, height: h)

      default:
        // Fill — stretch to bounds, object-position doesn't apply
        frame = bounds
      }
      svgDrawSize = frame.size
      // Replaced content is clipped to its box whatever `overflow` says: show only the part inside.
      let visible = frame.intersection(bounds)
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      if visible.isNull || visible.width <= 0 || visible.height <= 0 || frame.width <= 0 || frame.height <= 0 {
        contentsLayer.frame = .zero
      } else {
        contentsLayer.frame = visible
        contentsLayer.contentsRect = CGRect(x: (visible.minX - frame.minX) / frame.width, y: (visible.minY - frame.minY) / frame.height,
                                            width: visible.width / frame.width, height: visible.height / frame.height)
        contentsLayer.contentsGravity = .resize
      }
      CATransaction.commit()
  }
}

/// Largest edge of an `<img>` SVG raster, in device pixels.
private let maxImgSvgRasterPx: CGFloat = 4096

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

  /// The SVG `src`, parsed; drawn by the layer instead of `image`.
  internal var svg: SvgDocument? {
    get { masonLayer.svg }
    set {
      masonLayer.svg = newValue
      node.markDirty()
      requestLayout()
    }
  }

  /// Bumped per `src` so a slow load can't overwrite a newer one.
  private var loadGeneration = 0

  /// Finishes a load on the thread that started it.
  private func finishLoad(_ generation: Int, on loop: CFRunLoop?, _ apply: @escaping () -> Void) {
    let run = { [weak self] in
      guard let self = self, self.loadGeneration == generation else { return }
      apply()
    }
    if let loop = loop {
      CFRunLoopPerformBlock(loop, CFRunLoopMode.commonModes.rawValue, run)
      CFRunLoopWakeUp(loop)
    } else {
      run()
    }
  }

  /// SVG sources (data URLs, files, `.svg` URLs) go through Mason's SVG reader; nil otherwise.
  private func loadSvg(_ src: String, _ generation: Int, _ current: CFRunLoop?) -> Bool {
    let svgUrl = isSvgSource(src)
    let remote = URL(string: src).flatMap { u -> URL? in
      guard let scheme = u.scheme?.lowercased(), scheme == "http" || scheme == "https",
            u.pathExtension.lowercased() == "svg" else { return nil }
      return u
    }
    guard svgUrl || remote != nil else { return false }
    state = .Loading
    onStateChange?(.Loading, nil)
    let done: (SvgDocument?, Error?) -> Void = { doc, error in
      self.finishLoad(generation, on: current) {
        self.state = doc != nil ? .Loaded : .Error
        self.image = nil
        self.svg = doc
        self.onStateChange?(doc != nil ? .Loaded : .Error, error)
      }
    }
    if let remote = remote {
      URLSession.shared.dataTask(with: remote) { data, _, error in
        let doc = data.flatMap { String(data: $0, encoding: .utf8) }.flatMap(parseSvgDocument)
        done(doc, error)
      }.resume()
    } else {
      done(decodeSvgSource(src), nil)
    }
    return true
  }
  
  internal func loadImage(){
    let current = CFRunLoopGetCurrent()
    loadGeneration += 1
    let generation = loadGeneration
    if svg != nil { svg = nil }
    if let src = src, loadSvg(src, generation, current) { return }
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
    masonLayer.contentsScale = CGFloat(NSCMason.scale)
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
    
    
    // Intrinsic size in device px: 1 SVG px is 1 CSS px, 1 raster px one device px.
    var natural = CGSize.zero
    if let doc = view.svg {
      let scale = CGFloat(NSCMason.scale)
      natural = CGSize(width: doc.width * scale, height: doc.height * scale)
    } else if let image = view.image {
      if let cgImage = image.cgImage {
        natural = CGSize(width: CGFloat(cgImage.width), height: CGFloat(cgImage.height))
      }
      if let ciImage = image.ciImage {
        natural = ciImage.extent.size
      }
    }
    // One known side keeps the image's ratio.
    let w = known?.width ?? .nan, h = known?.height ?? .nan
    if !w.isNaN && h.isNaN {
      ret.height = natural.width > 0 ? w * natural.height / natural.width : 0
    } else if w.isNaN && !h.isNaN {
      ret.width = natural.height > 0 ? h * natural.width / natural.height : 0
    } else {
      ret = natural
    }
    
    view.node.cachedWidth = ret.width
    view.node.cachedHeight = ret.height
        
    return ret
  }
}
