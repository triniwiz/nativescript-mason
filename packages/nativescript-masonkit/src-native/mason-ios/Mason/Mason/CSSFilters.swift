//
//  CSSFilters.swift
//  Mason
//
//  Created by Osei Fortune on 20/11/2025.
//

import UIKit
import CoreImage
import CoreImage.CIFilterBuiltins
import Metal

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
  private static var ciContext: CIContext?

  // Shared color space — avoids CGColorSpaceCreateDeviceRGB() allocation per texture/image creation
  private static let deviceRGB = CGColorSpaceCreateDeviceRGB()

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
  
  static func captureViewToCIImage(view: UIView, scale: CGFloat, excludeLayer: CALayer?) -> CIImage? {
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

  /// An element filter's output, shown from the superview's layer next to the element.
  final class FilterOutputLayer: CALayer {
    weak var owner: CSSFilter?
    /// Set once an element filter painted; until then there is nothing to sweep.
    static var anyCreated = false

    override func action(forKey event: String) -> CAAction? { NSNull() }
  }

  /// Where an element filter's output goes relative to the element.
  enum OutputPlacement: Equatable {
    /// Only the chain's drop shadows, under the element.
    case under
    /// The whole filtered element, over it.
    case over
  }

  public class CSSFilter: NSObject {
    let layer = FilterOutputLayer()
    var filters: [Filter]
    private weak var view: UIView?

    // MARK: - backdrop-filter live-render state
    private weak var backdropView: UIView?
    private var backdropRenderLayer: CALayer?
    private var backdropClipPathProvider: (() -> UIBezierPath?)?

    // MARK: - element filter state
    /// The painted area in the view's local points, relative to its bounds origin.
    private var outputRegion: CGRect = .zero
    private var placement: OutputPlacement = .over
    /// Refreshed with the backdrop scheduler: the output covers the element with what is behind it.
    private var coversBackdrop = false
    private var appliedAlpha: CGFloat?
    private var alphaBefore: CGFloat = 1

    public override init() {
      filters = []
      super.init()
      layer.owner = self
    }

    init(default filters: [Filter] = []) {
      self.filters = filters
      super.init()
      layer.owner = self
    }

    public func reset() {
      filters = []
      detachOutput()
      restoreViewAlpha()
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

    /// Removes the element output layer; the view keeps rendering unfiltered.
    func detachOutput() {
      layer.removeFromSuperlayer()
      layer.contents = nil
      if coversBackdrop {
        coversBackdrop = false
        BackdropScheduler.shared.remove(self)
      }
    }

    private func setViewAlpha(_ view: UIView, _ alpha: CGFloat) {
      if appliedAlpha == nil { alphaBefore = view.alpha }
      view.alpha = alpha
      appliedAlpha = alpha
    }

    private func restoreViewAlpha() {
      guard let alpha = appliedAlpha else { return }
      if let view = view, view.alpha == alpha { view.alpha = alphaBefore }
      appliedAlpha = nil
    }

    /// The layer the output lives in: the superview's, unless a CSS mask or clip-path has to clip it.
    private func outputHost(for view: UIView) -> CALayer {
      if view.layer.mask is MasonMaskLayer { return view.layer }
      return view.superview?.layer ?? view.layer
    }

    /// Keeps the output layer over (or under) the view, matching its box, transform and visibility.
    func syncOutputGeometry() {
      guard let view = view else { return }
      guard let host = layer.superlayer, host === outputHost(for: view) else {
        // Detached with the view, or the view moved: put the last output back next to it.
        if layer.contents != nil, !filters.isEmpty, view.superview != nil { installOutput(on: view) }
        return
      }
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      defer { CATransaction.commit() }
      let v = view.layer
      let region = outputRegion.offsetBy(dx: v.bounds.minX, dy: v.bounds.minY)
      if host === v {
        if !CATransform3DIsIdentity(layer.transform) { layer.transform = CATransform3DIdentity }
        if layer.anchorPoint != CGPoint(x: 0.5, y: 0.5) { layer.anchorPoint = CGPoint(x: 0.5, y: 0.5) }
        if layer.frame != region { layer.frame = region }
        if layer.isHidden { layer.isHidden = false }
        if layer.opacity != 1 { layer.opacity = 1 }
        if host.sublayers?.last !== layer { host.addSublayer(layer) }
        return
      }
      let anchor = CGPoint(x: v.bounds.minX + v.anchorPoint.x * v.bounds.width,
                           y: v.bounds.minY + v.anchorPoint.y * v.bounds.height)
      let anchorPoint = CGPoint(x: region.width > 0 ? (anchor.x - region.minX) / region.width : 0.5,
                                y: region.height > 0 ? (anchor.y - region.minY) / region.height : 0.5)
      if layer.bounds != region { layer.bounds = region }
      if layer.anchorPoint != anchorPoint { layer.anchorPoint = anchorPoint }
      if layer.position != v.position { layer.position = v.position }
      if !CATransform3DEqualToTransform(layer.transform, v.transform) { layer.transform = v.transform }
      if layer.zPosition != v.zPosition { layer.zPosition = v.zPosition }
      if layer.isHidden != v.isHidden { layer.isHidden = v.isHidden }
      if layer.opacity != v.opacity { layer.opacity = v.opacity }
      if let subs = host.sublayers, let i = subs.firstIndex(where: { $0 === v }) {
        switch placement {
        case .over:
          if i + 1 >= subs.count || subs[i + 1] !== layer { host.insertSublayer(layer, above: v) }
        case .under:
          if i == 0 || subs[i - 1] !== layer { host.insertSublayer(layer, below: v) }
        }
      }
    }

    /// The element this filter paints for.
    var elementView: UIView? { view }

    private func installOutput(on view: UIView) {
      FilterOutputLayer.anyCreated = true
      let host = outputHost(for: view)
      if layer.superlayer !== host {
        layer.removeFromSuperlayer()
        if host === view.layer {
          host.addSublayer(layer)
        } else if placement == .under {
          host.insertSublayer(layer, below: view.layer)
        } else {
          host.insertSublayer(layer, above: view.layer)
        }
      }
      layer.contentsScale = CGFloat(NSCMason.scale)
      syncOutputGeometry()
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
      // The capture draws the view again, which lands back here.
      guard !isApplying else { return }
      isApplying = true
      defer { isApplying = false }

      if(device == nil){
        device = MTLCreateSystemDefaultDevice()
        guard let device = device else {return}
        ciContext = CSSFilters.makeContext(device)
      }
      if(self.view != view){
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

      let visual = filters.contains { if case .opacity = $0 { return false } else { return true } }
      guard visual else {
        // opacity() alone is group opacity, which the view's own alpha already is.
        detachOutput()
        let alpha = filters.reduce(CGFloat(1)) { acc, f in
          if case .opacity(let a) = f { return acc * min(max(a, 0), 1) }
          return acc
        }
        setViewAlpha(view, alpha)
        return
      }
      restoreViewAlpha()

      guard view.bounds.width > 0, view.bounds.height > 0, let context = ciContext else { return }
      let scale = CGFloat(NSCMason.scale)
      let box = CGRect(origin: .zero, size: view.bounds.size)
      let masked = view.layer.mask is MasonMaskLayer
      placement = !masked && view.superview != nil && CSSFilters.isShadowOnly(filters) ? .under : .over

      let regionPx = CSSFilters.paintRegionPixels(filters, box: box, scale: scale)
      outputRegion = CGRect(x: regionPx.minX / scale, y: box.height - regionPx.maxY / scale,
                            width: regionPx.width / scale, height: regionPx.height / scale)

      guard let content = CSSFilters.captureViewToCIImage(view: view, scale: scale, excludeLayer: layer) else { return }
      var output = placement == .under
        ? CSSFilters.applyShadowsOnly(filters, to: content, scale: scale)
        : CSSFilters.applyElementChain(filters, to: content, scale: scale)

      let cover = placement == .over && CSSFilters.needsBackdropCover(filters) && CATransform3DIsIdentity(view.layer.transform)
      if cover, let behind = CSSFilters.captureBackdropToCIImage(view: view, scale: scale, alsoHiding: layer) {
        output = output.composited(over: behind.cropped(to: CGRect(x: 0, y: 0, width: box.width * scale, height: box.height * scale)))
      }
      if cover != coversBackdrop {
        coversBackdrop = cover
        if cover { BackdropScheduler.shared.add(self) } else { BackdropScheduler.shared.remove(self) }
      }

      guard let image = context.createCGImage(output, from: regionPx, format: .BGRA8, colorSpace: CSSFilters.sRGB) else { return }
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      installOutput(on: view)
      layer.contents = image
      CATransaction.commit()
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
      if let view = backdropView {
        if view.window != nil { renderBackdropFrame() }
        return
      }
      if coversBackdrop, !isApplying, let view = view, view.window != nil { apply(to: view) }
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

  // MARK: - Element filter chain

  /// The area a chain paints, in the box's local points: the box grown by each blur and shadow.
  static func paintRegion(_ filters: [Filter], box: CGRect) -> CGRect {
    var r = box
    for filter in filters {
      switch filter {
      case .blur(let radius) where radius > 0:
        r = r.insetBy(dx: -3 * radius, dy: -3 * radius)
      case .dropShadow(let x, let y, let blur, _):
        r = r.union(r.offsetBy(dx: x, dy: y).insetBy(dx: -3 * blur, dy: -3 * blur))
      default:
        break
      }
    }
    // Keep the bitmap bounded for huge blur radii.
    let limit = max(box.width, box.height) + 1024
    return r.intersection(box.insetBy(dx: -limit, dy: -limit))
  }

  /// `paintRegion` in whole Core Image pixels (y up, origin at the box's bottom left).
  static func paintRegionPixels(_ filters: [Filter], box: CGRect, scale: CGFloat) -> CGRect {
    let r = paintRegion(filters, box: box)
    return CGRect(x: r.minX * scale, y: (box.height - r.maxY) * scale, width: r.width * scale, height: r.height * scale).integral
  }

  /// Whether the chain is only drop shadows, which can be painted under the live element.
  static func isShadowOnly(_ filters: [Filter]) -> Bool {
    !filters.isEmpty && filters.allSatisfy { if case .dropShadow = $0 { return true } else { return false } }
  }

  /// Whether the output can be more transparent than the element, so the element would show through it.
  static func needsBackdropCover(_ filters: [Filter]) -> Bool {
    filters.contains { filter in
      switch filter {
      case .blur(let radius): return radius > 0
      case .opacity(let amount): return amount < 1
      default: return false
      }
    }
  }

  /// `image`'s alpha in `color`, offset and blurred; drop-shadow()'s third length is the standard deviation.
  static func dropShadow(of image: CIImage, dx: CGFloat, dy: CGFloat, blur: CGFloat, color: UIColor, scale: CGFloat) -> CIImage {
    var shadow = CIImage(color: CIColor(color: color)).cropped(to: image.extent)
      .applyingFilter("CISourceInCompositing", parameters: [kCIInputBackgroundImageKey: image])
    let sigma = blur * scale
    if sigma > 0 { shadow = shadow.applyingGaussianBlur(sigma: Double(sigma)) }
    return shadow.transformed(by: CGAffineTransform(translationX: dx * scale, y: -dy * scale))
  }

  /// An element filter chain over `image` (the element at `scale` pixels per point); blurs and shadows spread past it.
  static func applyElementChain(_ filters: [Filter], to image: CIImage, scale: CGFloat) -> CIImage {
    var output = image
    for filter in filters {
      switch filter {
      case .blur(let radius):
        let sigma = radius * scale
        if sigma > 0 { output = output.applyingGaussianBlur(sigma: Double(sigma)) }
      case .dropShadow(let dx, let dy, let blur, let color):
        output = output.composited(over: dropShadow(of: output, dx: dx, dy: dy, blur: blur, color: color, scale: scale))
      case .opacity(let amount):
        output = output.applyingFilter("CIColorMatrix", parameters: ["inputAVector": CIVector(x: 0, y: 0, z: 0, w: min(max(amount, 0), 1))])
      default:
        output = applyColorFunction(filter, to: output)
      }
    }
    return output
  }

  /// The shadows a drop-shadow() only chain paints under `image`, without the image.
  static func applyShadowsOnly(_ filters: [Filter], to image: CIImage, scale: CGFloat) -> CIImage {
    var current = image
    var shadows = CIImage.empty()
    for filter in filters {
      guard case .dropShadow(let dx, let dy, let blur, let color) = filter else { continue }
      let shadow = dropShadow(of: current, dx: dx, dy: dy, blur: blur, color: color, scale: scale)
      shadows = shadows.composited(over: shadow)
      current = current.composited(over: shadow)
    }
    return shadows
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
  private static func captureBackdropToCIImage(view: UIView, scale: CGFloat, alsoHiding extra: CALayer? = nil) -> CIImage? {
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
    let extraWasHidden = extra?.isHidden ?? true
    extra?.isHidden = true
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
    extra?.isHidden = extraWasHidden
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
      } else {
        colorParts.append(part)
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
