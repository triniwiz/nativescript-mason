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

  /// Snapshots the content behind `view` (walks to the topmost ancestor and
  /// renders just the region `view` occupies), excluding `view`'s own subtree —
  /// the "hole" needed so backdrop-filter never filters the element's own content.
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
    let renderer = UIGraphicsImageRenderer(size: frameInRoot.size, format: fmt)

    let wasHidden = view.isHidden
    view.isHidden = true
    let image = renderer.image { _ in
      // Offset so `view`'s region lands at the image origin; unscaled, so this
      // is a crop, not a stretch.
      let drawRect = CGRect(
        x: -frameInRoot.origin.x,
        y: -frameInRoot.origin.y,
        width: root.bounds.width,
        height: root.bounds.height
      )
      root.drawHierarchy(in: drawRect, afterScreenUpdates: false)
    }
    view.isHidden = wasHidden

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
    private var backdropBlurView: UIVisualEffectView?
    private var backdropDisplayLink: CADisplayLink?
    private var backdropClipPathProvider: (() -> UIBezierPath?)?
    private var backdropFrameParity = false
    
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

    /// Stops the live backdrop CADisplayLink and removes the render layer /
    /// blur view. Does not touch `filters` — called both from `reset()` and
    /// at the top of `applyAsBackdrop` before rebuilding.
    private func tearDownBackdropRendering() {
      backdropDisplayLink?.invalidate()
      backdropDisplayLink = nil
      backdropRenderLayer?.removeFromSuperlayer()
      backdropRenderLayer = nil
      backdropBlurView?.removeFromSuperview()
      backdropBlurView = nil
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
    
    /// Lightweight CGContext-based render for simple, single color filters.
    /// Returns true if handled; false means the caller should fall back to
    /// the full Metal/CIFilter pipeline via `apply(to:)`.
    public func applyFast(in context: CGContext, rect: CGRect) -> Bool {
      guard filters.count == 1 else { return false }

      switch filters[0] {
      case .brightness(let value):
        if value < 1.0 {
          // Darken: multiply blend darkens each channel proportionally
          context.saveGState()
          context.setBlendMode(.multiply)
          let gray = max(value, 0)
          context.setFillColor(UIColor(white: gray, alpha: 1).cgColor)
          context.fill(rect)
          context.restoreGState()
        } else if value > 1.0 {
          // Lighten: screen blend (additive) with white at (value-1) alpha
          context.saveGState()
          context.setBlendMode(.screen)
          let alpha = min(value - 1.0, 1.0)
          context.setFillColor(UIColor(white: 1, alpha: alpha).cgColor)
          context.fill(rect)
          context.restoreGState()
        }
        return true

      case .grayscale:
        // Desaturate via luminance overlay isn't accurate enough for a fast path
        return false

      case .opacity:
        // Opacity is already handled by the view's alpha — no CGContext trick
        return false

      default:
        return false
      }
    }

    public func apply(to view: UIView) {
      isApplying = true
      defer { isApplying = false }
      
      if(device == nil){
        device = MTLCreateSystemDefaultDevice()
        guard let device = device else {return}
        commandQueue = device.makeCommandQueue()
        ciContext = CIContext(mtlDevice: device)
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
          
        case .brightness(let value):
          let f = CIFilter.colorControls()
          f.brightness = Float(value - 1)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }
          
        case .contrast(let value):
          let f = CIFilter.colorControls()
          f.contrast = Float(value)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }
          
        case .saturate(let value):
          let f = CIFilter.colorControls()
          f.saturation = Float(value)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }
          
        case .hueRotate(let degrees):
          let f = CIFilter.hueAdjust()
          f.angle = Float(degrees * .pi / 180)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }
          
        case .invert(let amount):
          let t = CGFloat(1 - 2 * amount)
          let o = CGFloat(amount)
          let f = CIFilter.colorMatrix()
          f.rVector = CIVector(x: t, y: 0, z: 0, w: 0)
          f.gVector = CIVector(x: 0, y: t, z: 0, w: 0)
          f.bVector = CIVector(x: 0, y: 0, z: t, w: 0)
          f.aVector = CIVector(x: 0, y: 0, z: 0, w: 1)
          f.biasVector = CIVector(x: o, y: o, z: o, w: 0)
          let cropExtent = output.extent
          if let clamp = CIFilter(name: "CIAffineClamp") {
            clamp.setValue(output, forKey: kCIInputImageKey)
            clamp.setValue(CGAffineTransform.identity, forKey: "inputTransform")
            if let clamped = clamp.outputImage {
              f.setValue(clamped, forKey: kCIInputImageKey)
              if let result = f.outputImage {
                output = result.cropped(to: cropExtent)
              }
              continue
            }
          }
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }
          
        case .opacity(let amount):
          view.alpha = amount
          
        case .sepia(let amount):
          let f = CIFilter.sepiaTone()
          f.intensity = Float(amount)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }
          
        case .grayscale(let amount):
          let f = CIFilter.colorControls()
          f.saturation = Float(1 - amount)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }
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

    /// Apply filters as a backdrop effect (CSS backdrop-filter).
    /// Unlike `apply(to:)` which overlays the view's own content,
    /// this blurs/filters the content _behind_ the view.
    ///
    /// `CALayer.backgroundFilters` is macOS-only and silently ignored on iOS,
    /// so non-blur filters (and any mix with blur) are done by hand: snapshot
    /// the backdrop, run the CIFilter chain over it, and re-render on a
    /// CADisplayLink so it tracks whatever is scrolling/animating behind it.
    /// Pure blur (no other filters) still uses UIVisualEffectView — it's
    /// compositor-backed and already tracks the backdrop live for free.
    ///
    /// `clipPathProvider` supplies the element's border-radius clip path
    /// (independent of `overflow`, like its own background) — re-queried each
    /// render so it tracks layout changes.
    public func applyAsBackdrop(to view: UIView, clipPathProvider: (() -> UIBezierPath?)? = nil) {
      isApplying = true
      defer { isApplying = false }

      // Remove stale backdrop views/layers/link from a previous call.
      view.subviews.filter { $0.layer.name == "_mason_backdrop" }.forEach { $0.removeFromSuperview() }
      view.layer.sublayers?.first(where: { $0.name == "_mason_backdrop_layer" })?.removeFromSuperlayer()
      tearDownBackdropRendering()

      guard !filters.isEmpty else { return }

      if device == nil {
        device = MTLCreateSystemDefaultDevice()
        guard let device = device else { return }
        commandQueue = device.makeCommandQueue()
        ciContext = CIContext(mtlDevice: device)
      }

      var blurRadius: CGFloat = 0
      var hasOtherFilters = false
      for filter in filters {
        switch filter {
        case .blur(let r): blurRadius = max(blurRadius, r)
        case .dropShadow: break // not applicable to backdrop-filter
        default: hasOtherFilters = true
        }
      }

      guard blurRadius > 0 || hasOtherFilters else { return }

      backdropView = view
      backdropClipPathProvider = clipPathProvider

      if blurRadius > 0 && !hasOtherFilters {
        setupBackdropBlurView(on: view, radius: blurRadius)
        return
      }

      setupBackdropRenderLayer(on: view)
      renderBackdropFrame()

      let link = CADisplayLink(target: self, selector: #selector(backdropDisplayLinkStep))
      link.add(to: .main, forMode: .common)
      backdropDisplayLink = link
    }

    private func setupBackdropBlurView(on view: UIView, radius: CGFloat) {
      let blurEffect = UIBlurEffect(style: .regular)
      let effectView = UIVisualEffectView(effect: nil)
      effectView.frame = view.bounds
      effectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      effectView.layer.name = "_mason_backdrop"
      effectView.isUserInteractionEnabled = false
      view.insertSubview(effectView, at: 0)
      UIView.animate(withDuration: 0) {
        effectView.effect = blurEffect
      }
      // Set custom radius on the gaussian blur sublayer if accessible
      if let backdropLayers = effectView.layer.sublayers {
        for sublayer in backdropLayers {
          if let bgFilters = sublayer.value(forKey: "filters") as? [NSObject] {
            for bgFilter in bgFilters {
              let filterName = String(describing: type(of: bgFilter))
              if filterName.localizedCaseInsensitiveContains("blur") {
                bgFilter.setValue(radius, forKey: "inputRadius")
              }
            }
          }
        }
      }
      backdropBlurView = effectView
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

    @objc private func backdropDisplayLinkStep() {
      guard let view = backdropView else {
        backdropDisplayLink?.invalidate()
        backdropDisplayLink = nil
        return
      }
      // Skip the (relatively costly) snapshot+filter pass while off-window
      // rather than tearing the link down — it self-resumes on reattach.
      guard view.window != nil else { return }

      // Throttle to ~30fps: a full 60fps snapshot+CIFilter pass per frame is
      // unnecessary for a background effect and doubles the per-frame cost.
      backdropFrameParity.toggle()
      guard backdropFrameParity else { return }

      renderBackdropFrame()
    }

    private func renderBackdropFrame() {
      guard let view = backdropView, let renderLayer = backdropRenderLayer else {
        return
      }
      guard view.bounds.width > 0, view.bounds.height > 0 else {
        return
      }
      guard let context = ciContext else {
        return
      }

      let scale = CGFloat(NSCMason.scale)
      guard var output = CSSFilters.captureBackdropToCIImage(view: view, scale: scale) else {
        return
      }
      let extent = output.extent

      for filter in filters {
        switch filter {
        case .blur(let radius):
          let blurPx = Float(radius * scale)
          guard blurPx > 0 else { continue }
          let blurFilter = CIFilter.gaussianBlur()
          blurFilter.radius = blurPx
          if let clamp = CIFilter(name: "CIAffineClamp") {
            clamp.setValue(output, forKey: kCIInputImageKey)
            clamp.setValue(CGAffineTransform.identity, forKey: "inputTransform")
            if let clamped = clamp.outputImage {
              blurFilter.inputImage = clamped
            } else {
              blurFilter.inputImage = output
            }
          } else {
            blurFilter.inputImage = output
          }
          if let result = blurFilter.outputImage { output = result.cropped(to: extent) }

        case .brightness(let value):
          let f = CIFilter.colorControls()
          f.brightness = Float(value - 1)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }

        case .contrast(let value):
          let f = CIFilter.colorControls()
          f.contrast = Float(value)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }

        case .saturate(let value):
          let f = CIFilter.colorControls()
          f.saturation = Float(value)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }

        case .hueRotate(let degrees):
          let f = CIFilter.hueAdjust()
          f.angle = Float(degrees * .pi / 180)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }

        case .invert(let amount):
          let t = CGFloat(1 - 2 * amount)
          let o = CGFloat(amount)
          let f = CIFilter.colorMatrix()
          f.rVector = CIVector(x: t, y: 0, z: 0, w: 0)
          f.gVector = CIVector(x: 0, y: t, z: 0, w: 0)
          f.bVector = CIVector(x: 0, y: 0, z: t, w: 0)
          f.aVector = CIVector(x: 0, y: 0, z: 0, w: 1)
          f.biasVector = CIVector(x: o, y: o, z: o, w: 0)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }

        case .opacity(let amount):
          // backdrop-filter opacity: reduce alpha of the backdrop content
          let f = CIFilter.colorMatrix()
          f.rVector = CIVector(x: 1, y: 0, z: 0, w: 0)
          f.gVector = CIVector(x: 0, y: 1, z: 0, w: 0)
          f.bVector = CIVector(x: 0, y: 0, z: 1, w: 0)
          f.aVector = CIVector(x: 0, y: 0, z: 0, w: CGFloat(amount))
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }

        case .sepia(let amount):
          let f = CIFilter.sepiaTone()
          f.intensity = Float(amount)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }

        case .grayscale(let amount):
          let f = CIFilter.colorControls()
          f.saturation = Float(1 - amount)
          f.setValue(output, forKey: kCIInputImageKey)
          if let result = f.outputImage { output = result }

        case .dropShadow:
          break // drop-shadow not applicable for backdrop-filter
        }
      }

      guard let cgImage = context.createCGImage(output, from: extent, format: .BGRA8, colorSpace: CSSFilters.deviceRGB) else {
        return
      }

      updateBackdropMask(renderLayer)

      CATransaction.begin()
      CATransaction.setDisableActions(true)
      renderLayer.contents = cgImage
      CATransaction.commit()
    }
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
      let px = CGFloat(Double(trimmed.dropLast(2)) ?? Double(defaultValue))
      return px / CGFloat(NSCMason.scale)
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
      
      if trimmed.hasPrefix("#")
          || trimmed.hasPrefix("rgb(")
          || trimmed.hasPrefix("rgba(")
          || colorMap[trimmed] != nil {
        colorParts.append(part)
      } else {
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
    if let color = colorMap[value] {
      return color
    }
    if trimmed.hasPrefix("#") {
      let hex = String(trimmed.dropFirst())
      switch hex.count {
      case 3:
        let r = CGFloat(Int(String(repeating: hex[hex.startIndex], count: 2), radix: 16)!) / 255
        let g = CGFloat(Int(String(repeating: hex[hex.index(hex.startIndex, offsetBy: 1)], count: 2), radix: 16)!) / 255
        let b = CGFloat(Int(String(repeating: hex[hex.index(hex.startIndex, offsetBy: 2)], count: 2), radix: 16)!) / 255
        return UIColor(red: r, green: g, blue: b, alpha: 1)
      case 6:
        let intVal = Int(hex, radix: 16)!
        let r = CGFloat((intVal >> 16) & 0xFF)/255
        let g = CGFloat((intVal >> 8) & 0xFF)/255
        let b = CGFloat(intVal & 0xFF)/255
        return UIColor(red: r, green: g, blue: b, alpha: 1)
      case 8:
        let intVal = Int(hex, radix: 16)!
        let a = CGFloat((intVal >> 24) & 0xFF)/255
        let r = CGFloat((intVal >> 16) & 0xFF)/255
        let g = CGFloat((intVal >> 8) & 0xFF)/255
        let b = CGFloat(intVal & 0xFF)/255
        return UIColor(red: r, green: g, blue: b, alpha: a)
      default:
        return .black
      }
    } else if trimmed.hasPrefix("rgb(") {
      let nums = trimmed.dropFirst(4).dropLast().split(separator: ",").map { CGFloat(Double($0.trimmingCharacters(in: .whitespaces)) ?? 0) }
      return UIColor(red: nums[0]/255, green: nums[1]/255, blue: nums[2]/255, alpha: 1)
    } else if trimmed.hasPrefix("rgba(") {
      let nums = trimmed.dropFirst(5).dropLast().split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
      let r = CGFloat(Double(nums[0]) ?? 0)/255
      let g = CGFloat(Double(nums[1]) ?? 0)/255
      let b = CGFloat(Double(nums[2]) ?? 0)/255
      let a = CGFloat(Double(nums[3]) ?? 1)
      return UIColor(red: r, green: g, blue: b, alpha: a)
    }
    return .black
  }
  
}
