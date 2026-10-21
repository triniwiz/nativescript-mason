//
//  CSSFilters.swift
//  Mason
//
//  Created by Osei Fortune on 20/11/2025.
//

import UIKit
import CoreImage
import CoreImage.CIFilterBuiltins
import MetalKit
import MetalPerformanceShaders

public class CSSFilters {
  
  enum Filter {
    case blur(radius: CGFloat)
    case brightness(value: CGFloat)
    case contrast(value: CGFloat)
    case saturate(value: CGFloat)
    case hueRotate(degrees: CGFloat)
    case invert(amount: CGFloat)
    case opacity(amount: CGFloat)
    case sepia(amount: CGFloat)
    case grayscale(amount: CGFloat)
    case dropShadow(offsetX: CGFloat, offsetY: CGFloat, blur: CGFloat, color: UIColor)
  }
  
  
  private static var device: MTLDevice?
  private static var commandQueue: MTLCommandQueue?
  private static var ciContext: CIContext?

  // Shared color space — avoids CGColorSpaceCreateDeviceRGB() allocation per texture/image creation
  private static let deviceRGB = CGColorSpaceCreateDeviceRGB()

  private static var textureLoader: MTKTextureLoader?
  
  // MARK: - MPS Texture Helpers

  private static func createTexture(from ciImage: CIImage, context: CIContext, device: MTLDevice, commandQueue: MTLCommandQueue) -> MTLTexture? {
    let width = Int(ciImage.extent.width)
    let height = Int(ciImage.extent.height)
    guard width > 0 && height > 0 else { return nil }
    
    let descriptor = MTLTextureDescriptor.texture2DDescriptor(
      pixelFormat: .bgra8Unorm,
      width: width,
      height: height,
      mipmapped: false
    )
    descriptor.usage = [.shaderRead, .shaderWrite]
    descriptor.storageMode = .shared
    
    guard let texture = device.makeTexture(descriptor: descriptor) else { return nil }
    
    let normalizedImage = ciImage.transformed(by: CGAffineTransform(
      translationX: -ciImage.extent.origin.x,
      y: -ciImage.extent.origin.y
    ))
    
    guard let commandBuffer = commandQueue.makeCommandBuffer() else { return nil }
    context.render(
      normalizedImage,
      to: texture,
      commandBuffer: commandBuffer,
      bounds: CGRect(origin: .zero, size: ciImage.extent.size),
      colorSpace: deviceRGB
    )
    commandBuffer.commit()
    commandBuffer.waitUntilCompleted()
    
    return texture
  }
  
  private static func createCIImage(from texture: MTLTexture, extent: CGRect) -> CIImage? {
    guard let image = CIImage(mtlTexture: texture, options: [.colorSpace: deviceRGB]) else { return nil }
    
    return image.transformed(by: CGAffineTransform(translationX: extent.origin.x, y: extent.origin.y))
  }
  
  private static func applyMPSBlur(
    to sourceTexture: MTLTexture,
    sigma: Float,
    device: MTLDevice,
    commandQueue: MTLCommandQueue
  ) -> MTLTexture? {
    let descriptor = MTLTextureDescriptor.texture2DDescriptor(
      pixelFormat: sourceTexture.pixelFormat,
      width: sourceTexture.width,
      height: sourceTexture.height,
      mipmapped: false
    )
    descriptor.usage = [.shaderRead, .shaderWrite]
    descriptor.storageMode = .shared
    
    guard let outputTexture = device.makeTexture(descriptor: descriptor) else { return nil }
    
    let blur = MPSImageGaussianBlur(device: device, sigma: sigma)
    blur.edgeMode = .clamp
    
    guard let commandBuffer = commandQueue.makeCommandBuffer() else { return nil }
    blur.encode(commandBuffer: commandBuffer, sourceTexture: sourceTexture, destinationTexture: outputTexture)
    commandBuffer.commit()
    commandBuffer.waitUntilCompleted()
    
    return outputTexture
  }
  
  private static func createCIImageFromLayerContents(view: UIView, scale: CGFloat, excludeLayer: CALayer?) -> CIImage? {
    // Only use fast path if:
    // 1. Layer has direct contents (CGImage)
    // 2. No sublayers (except our filter layer)
    // 3. No transforms on the view
    // 4. No corner radius or other layer effects
    let sublayersExcludingFilter = view.layer.sublayers?.filter { $0 !== excludeLayer }
    guard let contents = view.layer.contents,
          sublayersExcludingFilter == nil || sublayersExcludingFilter?.isEmpty == true,
          view.transform.isIdentity,
          view.layer.cornerRadius == 0,
          view.layer.borderWidth == 0,
          CFGetTypeID(contents as CFTypeRef) == CGImage.typeID else {
      return nil
    }
    
    let cgImage = contents as! CGImage
    let imageWidth = CGFloat(cgImage.width)
    let imageHeight = CGFloat(cgImage.height)
    
    let targetWidth = view.bounds.width * scale
    let targetHeight = view.bounds.height * scale
    
    guard imageWidth > 0 && imageHeight > 0 && targetWidth > 0 && targetHeight > 0 else { return nil }
    
    var ciImage = CIImage(cgImage: cgImage)
    
    let contentMode = view.contentMode
    
    let imageAspect = imageWidth / imageHeight
    let targetAspect = targetWidth / targetHeight
    
    var scaleX: CGFloat = 1
    var scaleY: CGFloat = 1
    var offsetX: CGFloat = 0
    var offsetY: CGFloat = 0
    
    switch contentMode {
    case .scaleToFill:
      scaleX = targetWidth / imageWidth
      scaleY = targetHeight / imageHeight
      
    case .scaleAspectFit:
      let fitScale: CGFloat
      if imageAspect > targetAspect {
        fitScale = targetWidth / imageWidth
      } else {
        fitScale = targetHeight / imageHeight
      }
      scaleX = fitScale
      scaleY = fitScale
      let scaledWidth = imageWidth * fitScale
      let scaledHeight = imageHeight * fitScale
      offsetX = (targetWidth - scaledWidth) / 2
      offsetY = (targetHeight - scaledHeight) / 2
      
    case .scaleAspectFill:
      let fillScale: CGFloat
      if imageAspect > targetAspect {
        fillScale = targetHeight / imageHeight
      } else {
        fillScale = targetWidth / imageWidth
      }
      scaleX = fillScale
      scaleY = fillScale
      let scaledWidth = imageWidth * fillScale
      let scaledHeight = imageHeight * fillScale
      offsetX = (targetWidth - scaledWidth) / 2
      offsetY = (targetHeight - scaledHeight) / 2
      
    case .center:
      offsetX = (targetWidth - imageWidth) / 2
      offsetY = (targetHeight - imageHeight) / 2
      
    case .top:
      offsetX = (targetWidth - imageWidth) / 2
      offsetY = targetHeight - imageHeight
      
    case .bottom:
      offsetX = (targetWidth - imageWidth) / 2
      offsetY = 0
      
    case .left:
      offsetX = 0
      offsetY = (targetHeight - imageHeight) / 2
      
    case .right:
      offsetX = targetWidth - imageWidth
      offsetY = (targetHeight - imageHeight) / 2
      
    case .topLeft:
      offsetX = 0
      offsetY = targetHeight - imageHeight
      
    case .topRight:
      offsetX = targetWidth - imageWidth
      offsetY = targetHeight - imageHeight
      
    case .bottomLeft:
      offsetX = 0
      offsetY = 0
      
    case .bottomRight:
      offsetX = targetWidth - imageWidth
      offsetY = 0
      
    case .redraw:
      return nil
      
    @unknown default:
      return nil
    }
    
    var transform = CGAffineTransform.identity
    transform = transform.scaledBy(x: scaleX, y: scaleY)
    transform = transform.translatedBy(x: offsetX / scaleX, y: offsetY / scaleY)
    
    ciImage = ciImage.transformed(by: transform)
    
    let targetRect = CGRect(x: 0, y: 0, width: targetWidth, height: targetHeight)
    ciImage = ciImage.cropped(to: targetRect)
    
    return ciImage
  }
  
  private static func captureViewToCIImage(view: UIView, scale: CGFloat, excludeLayer: CALayer?, device: MTLDevice, commandQueue: MTLCommandQueue) -> CIImage? {
    guard view.bounds.width > 0 && view.bounds.height > 0 else { return nil }
    
    if let fastImage = createCIImageFromLayerContents(view: view, scale: scale, excludeLayer: excludeLayer) {
      return fastImage
    }
    
    let wasHidden = excludeLayer?.isHidden ?? true
    excludeLayer?.isHidden = true
    
    view.layoutIfNeeded()
    
    let fmt = UIGraphicsImageRendererFormat()
    fmt.scale = scale
    fmt.opaque = false
    let renderer = UIGraphicsImageRenderer(bounds: view.bounds, format: fmt)
    let image = renderer.image { ctx in
      view.layer.render(in: ctx.cgContext)
    }
    
    excludeLayer?.isHidden = wasHidden
    
    if let cg = image.cgImage {
      return CIImage(cgImage: cg)
    }
    return CIImage(image: image)
  }

  public class CSSFilter: NSObject {
    let layer = CAMetalLayer()
    var filters: [Filter]
    private var ciFilters: [CIFilter] = []
    private weak var view: UIView?

    // MARK: - backdrop-filter live-render state
    private weak var backdropView: UIView?
    private var backdropRenderLayer: CALayer?
    private var backdropClipPathProvider: (() -> UIBezierPath?)?
    
    public override init() {
      filters = []
      layer.isOpaque = false
      layer.masksToBounds = false
      layer.pixelFormat = .bgra8Unorm
      layer.framebufferOnly = false
      super.init()
    }
    
    init(default filters: [Filter] = []) {
      self.filters = filters
      layer.isOpaque = false
      layer.masksToBounds = false
      layer.pixelFormat = .bgra8Unorm
      layer.framebufferOnly = false
    }
    
    public func reset() {
      filters = []
      layer.removeFromSuperlayer()
      boundsObservation = nil
      contentsObservation = nil
      sublayersObservation = nil
      sublayerContentObservations.removeAll()
      view = nil
      tearDownBackdropRendering()
    }

    /// Stops live backdrop rendering and removes the render layer. Does not touch `filters`.
    private func tearDownBackdropRendering() {
      BackdropScheduler.shared.remove(self)
      backdropRenderLayer?.removeFromSuperlayer()
      backdropRenderLayer = nil
      backdropClipPathProvider = nil
      backdropView = nil
    }
    
    public func parse(css: String) {
      let isEmpty = filters.count == 0
      filters = CSSFilters.parse(css)
      if(!isEmpty && filters.count == 0){
        reset()
      }
    }
    
    func resizeLayerIfNeeded() {
      guard let view = view else { return }
      let scale = CGFloat(NSCMason.scale)
      
      var padLeft: CGFloat = 0, padRight: CGFloat = 0
      var padTop: CGFloat = 0, padBottom: CGFloat = 0
      
      for filter in filters {
        if case .dropShadow(let offsetX, let offsetY, let blur, _) = filter {
          let spread = blur * 3
          padLeft = max(padLeft, spread - offsetX)
          padRight = max(padRight, spread + offsetX)
          padTop = max(padTop, spread - offsetY)
          padBottom = max(padBottom, spread + offsetY)
        }
      }
      
      padLeft = max(0, padLeft)
      padRight = max(0, padRight)
      padTop = max(0, padTop)
      padBottom = max(0, padBottom)
      
      let hasShadowOverflow = padLeft > 0 || padRight > 0 || padTop > 0 || padBottom > 0
      
      let targetFrame: CGRect
      if hasShadowOverflow {
        targetFrame = CGRect(
          x: -padLeft,
          y: -padTop,
          width: view.bounds.width + padLeft + padRight,
          height: view.bounds.height + padTop + padBottom
        )
        view.clipsToBounds = false
      } else {
        targetFrame = view.bounds
      }
      
      let pixelSize = CGSize(width: targetFrame.width * scale, height: targetFrame.height * scale)
      if layer.frame != targetFrame || layer.drawableSize != pixelSize || layer.contentsScale != scale {
        layer.frame = targetFrame
        layer.contentsScale = scale
        layer.drawableSize = pixelSize
      }
    }
    
    private var pendingInvalidate = false
    
    public func invalidate() {
      guard view != nil else { return }
      
      guard !pendingInvalidate else { return }
      pendingInvalidate = true
      
      // Defer to next run loop to ensure sublayers have finished rendering
      DispatchQueue.main.async { [weak self] in
        guard let self = self else { return }
        self.pendingInvalidate = false
        guard let view = self.view else { return }
        self.apply(to: view)
      }
    }
    
    private var boundsObservation: NSKeyValueObservation?
    private var contentsObservation: NSKeyValueObservation?
    private var sublayersObservation: NSKeyValueObservation?
    private var sublayerContentObservations: [NSKeyValueObservation] = []
    private var isApplying = false
 
    private func observeSublayerContents(layer: CALayer) {
      guard let sublayers = layer.sublayers else { return }
      for sublayer in sublayers {
        if sublayer === self.layer { continue }
      
        let observation = sublayer.observe(\.contents, options: [.new]) { [weak self] _, _ in
          guard let self = self, !self.isApplying else { return }
          self.invalidate()
        }
        sublayerContentObservations.append(observation)
        
        observeSublayerContents(layer: sublayer)
      }
    }
    
    private func setupSublayerObservation(for view: UIView) {
      sublayerContentObservations.removeAll()

      sublayersObservation = view.layer.observe(\.sublayers, options: [.new]) { [weak self] layer, _ in
        guard let self = self, !self.isApplying else { return }
        self.sublayerContentObservations.removeAll()
        self.observeSublayerContents(layer: layer)
        self.invalidate()
      }
      
      observeSublayerContents(layer: view.layer)
    }
    
    public func apply(to view: UIView) {
      isApplying = true
      defer { isApplying = false }
      
      if(device == nil){
        device = MTLCreateSystemDefaultDevice()
        guard let device = device else {return}
        commandQueue = device.makeCommandQueue()
        ciContext = CSSFilters.makeContext(device)
      }
      if(self.view != view){
        layer.device = device
        boundsObservation = view.observe(\.bounds) { [weak self] _, _ in
          guard let self = self, !self.isApplying else { return }
          self.invalidate()
        }
        contentsObservation = view.layer.observe(\.contents) { [weak self] _, _ in
          guard let self = self, !self.isApplying else { return }
          self.invalidate()
        }
        setupSublayerObservation(for: view)
        self.view = view
      }
      let scale = CGFloat(NSCMason.scale)
      
      var hasVisualFilters = false
      for filter in filters {
        switch filter {
        case .opacity(_): break
        default: hasVisualFilters = true
        }
      }
      
      if !hasVisualFilters {
        layer.removeFromSuperlayer()
      }
      
      guard hasVisualFilters else { return }
      
      if view.layer.sublayers?.last != layer {
        view.layer.addSublayer(layer)
      }
      
      resizeLayerIfNeeded()
      
      guard let drawable = layer.nextDrawable() else { return }
      
      guard let device = device, let queue = commandQueue else { return }
      guard var output = CSSFilters.captureViewToCIImage(view: view, scale: scale, excludeLayer: layer, device: device, commandQueue: queue) else { return }
  
      var padLeftPx: CGFloat = 0, padBottomPx: CGFloat = 0
      for filter in filters {
        if case .dropShadow(let offsetX, let offsetY, let blur, _) = filter {
          let spread = blur * 3
          padLeftPx = max(padLeftPx, max(0, spread - offsetX) * scale)
          padBottomPx = max(padBottomPx, max(0, spread + offsetY) * scale)
        }
      }
      
      if padLeftPx > 0 || padBottomPx > 0 {
        output = output.transformed(by: .init(translationX: padLeftPx, y: padBottomPx))
      }
      
      let contentExtent = output.extent
      
      for filter in filters {
        switch filter {
          
        case .dropShadow(let offsetX, let offsetY, let blur, let color):
          guard let colorGen = CIFilter(name: "CIConstantColorGenerator") else { continue }
          var cr: CGFloat = 0, cg: CGFloat = 0, cb: CGFloat = 0, ca: CGFloat = 0
          color.getRed(&cr, green: &cg, blue: &cb, alpha: &ca)
          colorGen.setValue(CIColor(red: cr, green: cg, blue: cb, alpha: ca), forKey: kCIInputColorKey)
          guard let colorImage = colorGen.outputImage?.cropped(to: contentExtent) else { continue }
          
          guard let sourceAtop = CIFilter(name: "CISourceAtopCompositing") else { continue }
          sourceAtop.setValue(colorImage, forKey: kCIInputImageKey)
          sourceAtop.setValue(output, forKey: kCIInputBackgroundImageKey)
          guard var shadow = sourceAtop.outputImage else { continue }
          
          let blurPx = blur * scale
          if blurPx > 0.0001 {
            let blurPadPx = blurPx * 3
            let blurCropExtent = contentExtent.insetBy(dx: -blurPadPx, dy: -blurPadPx)
            
            if let context = ciContext,
               let sourceTexture = CSSFilters.createTexture(from: shadow, context: context, device: device, commandQueue: queue),
               let blurredTexture = CSSFilters.applyMPSBlur(to: sourceTexture, sigma: Float(blurPx), device: device, commandQueue: queue),
               let blurredCI = CSSFilters.createCIImage(from: blurredTexture, extent: shadow.extent) {
              shadow = blurredCI.cropped(to: blurCropExtent)
            } else {
              let blurFilter = CIFilter.gaussianBlur()
              blurFilter.radius = Float(blurPx)
              if let clamp = CIFilter(name: "CIAffineClamp") {
                clamp.setValue(shadow, forKey: kCIInputImageKey)
                clamp.setValue(CGAffineTransform.identity, forKey: "inputTransform")
                if let clamped = clamp.outputImage {
                  blurFilter.inputImage = clamped
                  if let blurred = blurFilter.outputImage {
                    shadow = blurred.cropped(to: blurCropExtent)
                  }
                }
              } else {
                blurFilter.inputImage = shadow
                if let blurred = blurFilter.outputImage {
                  shadow = blurred.cropped(to: blurCropExtent)
                }
              }
            }
          }
          
          shadow = shadow.transformed(by: CGAffineTransform(
            translationX: offsetX * scale,
            y: -offsetY * scale
          ))
          
          guard let composite = CIFilter(name: "CISourceOverCompositing") else { continue }
          composite.setValue(output, forKey: kCIInputImageKey)
          composite.setValue(shadow, forKey: kCIInputBackgroundImageKey)
          if let filtered = composite.outputImage {
            output = filtered
          }
          
        case .blur(let radius):
          let blurPx = Float(radius * scale)
          guard blurPx > 0 else { continue }
          let cropExtent = output.extent
          
          let blurFilter = CIFilter.gaussianBlur()
          blurFilter.radius = blurPx
          if let clamp = CIFilter(name: "CIAffineClamp") {
            clamp.setValue(output, forKey: kCIInputImageKey)
            clamp.setValue(CGAffineTransform.identity, forKey: "inputTransform")
            if let clamped = clamp.outputImage {
              blurFilter.inputImage = clamped
              if let result = blurFilter.outputImage {
                output = result.cropped(to: cropExtent)
              }
              continue
            }
          }
          blurFilter.inputImage = output
          if let result = blurFilter.outputImage {
            output = result.cropped(to: cropExtent)
          }
          
        case .opacity(let amount):
          view.alpha = amount

        case .brightness, .contrast, .saturate, .hueRotate, .invert, .sepia, .grayscale:
          output = CSSFilters.applyColorFunction(filter, to: output)
        }
      }

      let drawableBounds = CGRect(
        origin: .zero,
        size: CGSize(width: CGFloat(drawable.texture.width), height: CGFloat(drawable.texture.height))
      )
      output = output.cropped(to: drawableBounds)
      
      guard output.extent.width > 0 && output.extent.height > 0 else { return }
      
      let cb = commandQueue?.makeCommandBuffer()
      ciContext?.render(output,
                        to: drawable.texture,
                        commandBuffer: cb,
                        bounds: drawableBounds,
                        colorSpace: CSSFilters.deviceRGB)
      if let cb = cb {
        cb.present(drawable)
        cb.commit()
      } else {
        drawable.present()
      }
    }

    /// CSS backdrop-filter: a filtered snapshot of what is behind the view, under its content.
    public func applyAsBackdrop(to view: UIView, clipPathProvider: (() -> UIBezierPath?)? = nil) {
      isApplying = true
      defer { isApplying = false }

      view.layer.sublayers?.first(where: { $0.name == "_mason_backdrop_layer" })?.removeFromSuperlayer()
      tearDownBackdropRendering()

      let active = filters.contains { if case .dropShadow = $0 { return false } else { return true } }
      guard active else { return }

      if device == nil {
        device = MTLCreateSystemDefaultDevice()
        guard let device = device else { return }
        commandQueue = device.makeCommandQueue()
        ciContext = CSSFilters.makeContext(device)
      }

      backdropView = view
      backdropClipPathProvider = clipPathProvider
      setupBackdropRenderLayer(on: view)
      renderBackdropFrame()
      BackdropScheduler.shared.add(self)
    }

    private func setupBackdropRenderLayer(on view: UIView) {
      let renderLayer = CALayer()
      renderLayer.name = "_mason_backdrop_layer"
      renderLayer.frame = view.bounds
      renderLayer.masksToBounds = true
      renderLayer.contentsScale = CGFloat(NSCMason.scale)
      view.layer.insertSublayer(renderLayer, at: 0)
      backdropRenderLayer = renderLayer
    }

    private func updateBackdropMask(_ renderLayer: CALayer) {
      guard let provider = backdropClipPathProvider, let path = provider() else {
        if renderLayer.mask != nil { renderLayer.mask = nil }
        return
      }
      if let existing = renderLayer.mask as? CAShapeLayer {
        existing.path = path.cgPath
      } else {
        let maskLayer = CAShapeLayer()
        maskLayer.path = path.cgPath
        renderLayer.mask = maskLayer
      }
    }

    /// A blur of 2pt or more hides the detail a 1x snapshot loses.
    private var backdropCaptureScale: CGFloat {
      let blur = filters.reduce(CGFloat(0)) { acc, f in
        if case .blur(let r) = f { return max(acc, r) }
        return acc
      }
      return blur >= 2 ? 1 : CGFloat(NSCMason.scale)
    }

    func renderBackdropIfVisible() {
      guard let view = backdropView, view.window != nil else { return }
      renderBackdropFrame()
    }

    private func renderBackdropFrame() {
      guard let view = backdropView, let renderLayer = backdropRenderLayer,
            view.bounds.width > 0, view.bounds.height > 0, let context = ciContext else { return }
      let scale = backdropCaptureScale
      guard let input = CSSFilters.captureBackdropToCIImage(view: view, scale: scale) else { return }
      let output = CSSFilters.applyBackdropChain(filters, to: input, scale: scale)
      guard let cgImage = context.createCGImage(output, from: input.extent, format: .BGRA8, colorSpace: CSSFilters.sRGB) else {
        return
      }
      updateBackdropMask(renderLayer)
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      if renderLayer.frame != view.bounds { renderLayer.frame = view.bounds }
      renderLayer.contents = cgImage
      CATransaction.commit()
    }
  }

  /// Re-renders backdrops after the main run loop did any work, from one shared display link (up to 30 fps).
  final class BackdropScheduler: NSObject {
    static let shared = BackdropScheduler()
    private let filters = NSHashTable<CSSFilter>.weakObjects()
    private var link: CADisplayLink?
    private var observer: CFRunLoopObserver?
    private var dirty = false
    /// The run loop pass that ran our own render, which changes nothing behind.
    private var ownPass = false

    func add(_ filter: CSSFilter) {
      filters.add(filter)
      if observer == nil {
        let obs = CFRunLoopObserverCreateWithHandler(kCFAllocatorDefault, CFRunLoopActivity.beforeWaiting.rawValue, true, 0) { [weak self] _, _ in
          self?.runLoopDidWork()
        }
        CFRunLoopAddObserver(CFRunLoopGetMain(), obs, .commonModes)
        observer = obs
      }
      if link == nil {
        let l = CADisplayLink(target: self, selector: #selector(tick))
        l.preferredFrameRateRange = CAFrameRateRange(minimum: 10, maximum: 30, preferred: 30)
        l.isPaused = true
        l.add(to: .main, forMode: .common)
        link = l
      }
    }

    func remove(_ filter: CSSFilter) {
      filters.remove(filter)
      if filters.allObjects.isEmpty { stop() }
    }

    private func stop() {
      link?.invalidate()
      link = nil
      if let obs = observer {
        CFRunLoopRemoveObserver(CFRunLoopGetMain(), obs, .commonModes)
        observer = nil
      }
      dirty = false
    }

    private func runLoopDidWork() {
      if ownPass {
        ownPass = false
        return
      }
      if !dirty {
        dirty = true
        link?.isPaused = false
      }
    }

    @objc private func tick() {
      link?.isPaused = true
      guard dirty else { return }
      dirty = false
      let live = filters.allObjects
      if live.isEmpty {
        stop()
        return
      }
      for filter in live { filter.renderBackdropIfVisible() }
      ownPass = true
    }
  }

  // MARK: - Filter functions

  static let sRGB = CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB()

  /// Browsers run CSS filter functions on gamma-encoded sRGB, not Core Image's linear default.
  static func makeContext(_ device: MTLDevice) -> CIContext {
    CIContext(mtlDevice: device, options: [.workingColorSpace: sRGB, .outputColorSpace: sRGB])
  }

  /// The row-major 3x3 matrix and per-channel bias of a CSS colour filter function, as Filter
  /// Effects 1 defines them; nil for blur, opacity and drop-shadow.
  static func colorMatrix(for filter: Filter) -> (m: [CGFloat], bias: CGFloat)? {
    func unit(_ v: CGFloat) -> CGFloat { min(max(v, 0), 1) }
    switch filter {
    case .brightness(let v):
      let v = max(v, 0)
      return ([v, 0, 0, 0, v, 0, 0, 0, v], 0)
    case .contrast(let v):
      let v = max(v, 0)
      return ([v, 0, 0, 0, v, 0, 0, 0, v], 0.5 - 0.5 * v)
    case .saturate(let v):
      let s = max(v, 0)
      return ([0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
               0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
               0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s], 0)
    case .grayscale(let amount):
      let s = 1 - unit(amount)
      return ([0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s,
               0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s,
               0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s], 0)
    case .sepia(let amount):
      let s = 1 - unit(amount)
      return ([0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s,
               0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s,
               0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s], 0)
    case .hueRotate(let degrees):
      let r = degrees * .pi / 180
      let c = cos(r), n = sin(r)
      return ([0.213 + c * 0.787 - n * 0.213, 0.715 - c * 0.715 - n * 0.715, 0.072 - c * 0.072 + n * 0.928,
               0.213 - c * 0.213 + n * 0.143, 0.715 + c * 0.285 + n * 0.140, 0.072 - c * 0.072 - n * 0.283,
               0.213 - c * 0.213 - n * 0.787, 0.715 - c * 0.715 + n * 0.715, 0.072 + c * 0.928 + n * 0.072], 0)
    case .invert(let amount):
      let a = unit(amount)
      return ([1 - 2 * a, 0, 0, 0, 1 - 2 * a, 0, 0, 0, 1 - 2 * a], a)
    default:
      return nil
    }
  }

  /// One colour filter function, clamped to 0...1 as each step is in a browser.
  static func applyColorFunction(_ filter: Filter, to image: CIImage) -> CIImage {
    guard let (m, bias) = colorMatrix(for: filter) else { return image }
    let f = CIFilter.colorMatrix()
    f.inputImage = image
    f.rVector = CIVector(x: m[0], y: m[1], z: m[2], w: 0)
    f.gVector = CIVector(x: m[3], y: m[4], z: m[5], w: 0)
    f.bVector = CIVector(x: m[6], y: m[7], z: m[8], w: 0)
    f.aVector = CIVector(x: 0, y: 0, z: 0, w: 1)
    f.biasVector = CIVector(x: bias, y: bias, z: bias, w: 0)
    let clamp = CIFilter.colorClamp()
    clamp.inputImage = f.outputImage
    clamp.minComponents = CIVector(x: 0, y: 0, z: 0, w: 0)
    clamp.maxComponents = CIVector(x: 1, y: 1, z: 1, w: 1)
    return clamp.outputImage ?? image
  }

  /// `image` with reflected copies across each edge and corner, cropped `margin` past its extent.
  static func mirrored(_ image: CIImage, margin: CGFloat) -> CIImage {
    let e = image.extent
    var out = image
    for sx in [-1, 0, 1] {
      for sy in [-1, 0, 1] where sx != 0 || sy != 0 {
        var t = CGAffineTransform.identity
        if sx != 0 { t = t.concatenating(CGAffineTransform(a: -1, b: 0, c: 0, d: 1, tx: 2 * (sx < 0 ? e.minX : e.maxX), ty: 0)) }
        if sy != 0 { t = t.concatenating(CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: 2 * (sy < 0 ? e.minY : e.maxY))) }
        out = image.transformed(by: t).composited(over: out)
      }
    }
    return out.cropped(to: e.insetBy(dx: -margin, dy: -margin))
  }

  /// A backdrop-filter chain over `image`, captured at `scale` pixels per point.
  static func applyBackdropChain(_ filters: [Filter], to image: CIImage, scale: CGFloat) -> CIImage {
    let extent = image.extent
    var output = image
    for filter in filters {
      switch filter {
      case .blur(let radius):
        // CSS blur() is the Gaussian's standard deviation; the backdrop reflects at its edges.
        let sigma = Float(radius * scale)
        guard sigma > 0 else { continue }
        let blur = CIFilter.gaussianBlur()
        blur.inputImage = mirrored(output, margin: CGFloat(sigma) * 3).clampedToExtent()
        blur.radius = sigma
        if let result = blur.outputImage { output = result.cropped(to: extent) }
      case .opacity(let amount):
        let f = CIFilter.colorMatrix()
        f.inputImage = output
        f.aVector = CIVector(x: 0, y: 0, z: 0, w: min(max(amount, 0), 1))
        if let result = f.outputImage { output = result }
      case .dropShadow:
        break
      default:
        output = applyColorFunction(filter, to: output)
      }
    }
    return output
  }

  private final class GradientImage {
    let key: [AnyHashable]
    let image: CGImage
    init(key: [AnyHashable], image: CGImage) { self.key = key; self.image = image }
  }
  private static let gradientImages = NSMapTable<CAGradientLayer, GradientImage>.weakToStrongObjects()

  /// Draws axial gradients over `rect` with CoreGraphics while capturing; returns what to restore.
  static func substituteGradients(in root: CALayer, rect: CGRect, scale: CGFloat) -> [(CAGradientLayer, [Any]?, Any?)] {
    var swapped: [(CAGradientLayer, [Any]?, Any?)] = []
    func visit(_ layer: CALayer) {
      if layer.isHidden || layer.opacity == 0 { return }
      if let g = layer as? CAGradientLayer, g.type == .axial, let colors = g.colors, !colors.isEmpty,
         g.bounds.width > 0, g.bounds.height > 0, g.convert(g.bounds, to: root).intersects(rect),
         let image = gradientImage(g, colors: colors, scale: scale) {
        swapped.append((g, colors, g.contents))
        g.colors = nil
        g.contents = image
      }
      layer.sublayers?.forEach(visit)
    }
    visit(root)
    return swapped
  }

  private static func gradientImage(_ g: CAGradientLayer, colors: [Any], scale: CGFloat) -> CGImage? {
    let cgColors = colors.map { $0 as! CGColor }
    let locations = g.locations?.map { CGFloat(truncating: $0) }
    var key: [AnyHashable] = [g.bounds.width, g.bounds.height, scale, g.startPoint.x, g.startPoint.y, g.endPoint.x, g.endPoint.y]
    key += cgColors.flatMap { ($0.converted(to: sRGB, intent: .defaultIntent, options: nil)?.components ?? []).map { AnyHashable($0) } }
    key += (locations ?? []).map { AnyHashable($0) }
    if let cached = gradientImages.object(forKey: g), cached.key == key { return cached.image }
    let w = Int(ceil(g.bounds.width * scale)), h = Int(ceil(g.bounds.height * scale))
    guard w > 0, h > 0, w * h <= 16_000_000,
          let gradient = CGGradient(colorsSpace: deviceRGB, colors: cgColors as CFArray, locations: locations),
          let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: sRGB,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    // Unit-square points, y down as the layer's; the bitmap context is y up.
    let start = CGPoint(x: g.startPoint.x * CGFloat(w), y: (1 - g.startPoint.y) * CGFloat(h))
    let end = CGPoint(x: g.endPoint.x * CGFloat(w), y: (1 - g.endPoint.y) * CGFloat(h))
    ctx.drawLinearGradient(gradient, start: start, end: end, options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
    guard let image = ctx.makeImage() else { return nil }
    gradientImages.setObject(GradientImage(key: key, image: image), forKey: g)
    return image
  }

  /// The window's layers behind `view` over its region, rendered with `view` hidden.
  private static func captureBackdropToCIImage(view: UIView, scale: CGFloat) -> CIImage? {
    guard view.bounds.width > 0 && view.bounds.height > 0 else { return nil }

    var root: UIView = view
    while let superview = root.superview { root = superview }
    guard root !== view else { return nil }

    let frameInRoot = view.convert(view.bounds, to: root)
    guard frameInRoot.width > 0 && frameInRoot.height > 0 else { return nil }

    let fmt = UIGraphicsImageRendererFormat()
    fmt.scale = scale
    fmt.opaque = false
    // 8-bit sRGB is all the filter chain reads, at half the memory of the wide-colour default.
    fmt.preferredRange = .standard
    let renderer = UIGraphicsImageRenderer(size: frameInRoot.size, format: fmt)

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    let wasHidden = view.layer.isHidden
    view.layer.isHidden = true
    let swapped = substituteGradients(in: root.layer, rect: frameInRoot, scale: scale)
    let image = renderer.image { ctx in
      ctx.cgContext.translateBy(x: -frameInRoot.minX, y: -frameInRoot.minY)
      root.layer.render(in: ctx.cgContext)
    }
    for (layer, colors, contents) in swapped {
      layer.colors = colors
      layer.contents = contents
    }
    view.layer.isHidden = wasHidden
    CATransaction.commit()

    if let cg = image.cgImage {
      return CIImage(cgImage: cg)
    }
    return CIImage(image: image)
  }

  private static func splitCssArgs(_ input: String) -> [String] {
    var result: [String] = []
    var current = ""
    var depth = 0
    
    for ch in input {
      if ch == "(" { depth += 1 }
      if ch == ")" { depth -= 1 }
      
      if ch.isWhitespace && depth == 0 {
        if !current.isEmpty {
          result.append(current)
          current = ""
        }
      } else {
        current.append(ch)
      }
    }
    
    if !current.isEmpty {
      result.append(current)
    }
    
    return result
  }
  
  
  
  static func parse(_ value: String) -> [Filter] {
    var filters: [Filter] = []
    var i = value.startIndex
    
    func skipSpaces() {
      while i < value.endIndex && value[i].isWhitespace {
        i = value.index(after: i)
      }
    }
    
    while i < value.endIndex {
      skipSpaces()
      
      let nameStart = i
      while i < value.endIndex && (value[i].isLetter || value[i] == "-") {
        i = value.index(after: i)
      }
      
      guard nameStart < i else { break }
      let name = value[nameStart..<i].lowercased()
      
      skipSpaces()
      guard i < value.endIndex, value[i] == "(" else { break }
      i = value.index(after: i)
      
      var depth = 1
      let argsStart = i
      
      while i < value.endIndex && depth > 0 {
        if value[i] == "(" { depth += 1 }
        if value[i] == ")" { depth -= 1 }
        i = value.index(after: i)
      }
      
      let args = value[argsStart..<value.index(before: i)]
        .trimmingCharacters(in: .whitespacesAndNewlines)
      
      switch name {
      case "blur":
        filters.append(.blur(radius: parseCssFloat(String(args))))
      case "brightness":
        filters.append(.brightness(value: parseCssFloat(String(args), defaultValue: 1)))
      case "contrast":
        filters.append(.contrast(value: parseCssFloat(String(args), defaultValue: 1)))
      case "saturate":
        filters.append(.saturate(value: parseCssFloat(String(args), defaultValue: 1)))
      case "hue-rotate":
        filters.append(.hueRotate(degrees: parseCssAngle(String(args))))
      case "invert":
        filters.append(.invert(amount: parseCssFloat(String(args), defaultValue: 0)))
      case "opacity":
        filters.append(.opacity(amount: parseCssFloat(String(args), defaultValue: 1)))
      case "sepia":
        filters.append(.sepia(amount: parseCssFloat(String(args), defaultValue: 0)))
      case "grayscale":
        filters.append(.grayscale(amount: parseCssFloat(String(args), defaultValue: 0)))
      case "drop-shadow":
        if let shadow = parseDropShadow(String(args)) {
          filters.append(shadow)
        }
      default:
        break
      }
    }
    
    return filters
  }
  
  
  
  // Parse a CSS float value like "5px" or "50%"
  private static func parseCssFloat(_ value: String, defaultValue: CGFloat = 0) -> CGFloat {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if trimmed.hasSuffix("px") {
      // A CSS px is a point.
      return CGFloat(Double(trimmed.dropLast(2)) ?? Double(defaultValue))
    } else if trimmed.hasSuffix("%") {
      return CGFloat((Double(trimmed.dropLast()) ?? Double(defaultValue)) / 100.0)
    } else {
      return CGFloat(Double(trimmed) ?? Double(defaultValue))
    }
  }
  
  // Parse CSS angle: "30deg", "0.5turn", "1.57rad"
  private static func parseCssAngle(_ value: String) -> CGFloat {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if trimmed.hasSuffix("deg") {
      return CGFloat(Double(trimmed.dropLast(3)) ?? 0)
    } else if trimmed.hasSuffix("grad") {
      return CGFloat(Double(trimmed.dropLast(4)) ?? 0) * 0.9
    } else if trimmed.hasSuffix("rad") {
      } else {
        colorParts.append(part)
      return CGFloat(Double(trimmed.dropLast(3)) ?? 0) * 180 / .pi
    } else if trimmed.hasSuffix("turn") {
      return CGFloat(Double(trimmed.dropLast(4)) ?? 0) * 360
    } else {
      return CGFloat(Double(trimmed) ?? 0)
    }
  }
  
  // Parse drop-shadow: "5px 5px 10px #000"
  private static func parseDropShadow(_ value: String) -> Filter? {
    let parts = splitCssArgs(value.trimmingCharacters(in: .whitespacesAndNewlines))
    guard parts.count >= 2 else { return nil }
    
    var offsetX: CGFloat = 0
    var offsetY: CGFloat = 0
    var blur: CGFloat = 0
    var color: UIColor = .black
    
    var lengthValues: [CGFloat] = []
    var colorParts: [String] = []
    
    for part in parts {
      let trimmed = part.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      
      let number = trimmed.hasSuffix("px") ? String(trimmed.dropLast(2)) : trimmed
      if Double(number) != nil {
        lengthValues.append(parseCssFloat(part))
      }
    }
    
    guard lengthValues.count >= 2 else { return nil }
    
    offsetX = lengthValues[0]
    offsetY = lengthValues[1]
    blur = lengthValues.count >= 3 ? max(0, lengthValues[2]) : 0   // CSS clamps blur to >= 0
    
    if !colorParts.isEmpty {
      let colorString = colorParts.joined(separator: " ")
      color = parseCssColor(colorString)
    }
    
    return .dropShadow(offsetX: offsetX, offsetY: offsetY, blur: blur, color: color)
  }
  
  // MARK: - Helpers
  
  static func parseCssColor(_ value: String) -> UIColor {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    return colorMap[trimmed] ?? UIColor(css: trimmed) ?? .black
  }
  
}
