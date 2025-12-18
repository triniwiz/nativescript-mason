//
//  CSSFilters.swift
//  Mason
//
//  Created by Osei Fortune on 20/11/2025.
//

import UIKit
import CoreImage
import CoreImage.CIFilterBuiltins

class CSSFilters {
  
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
  private static var filteredViews: [UIView: CSSFilter] = [:]
  
  
  class CSSFilter {
    let layer = CAMetalLayer()
    var filters: [Filter]
    private var ciFilters: [CIFilter] = []
    private weak var view: UIView?
    init(filters: [Filter] = []) {
      self.filters = filters
      layer.isOpaque = false
      layer.masksToBounds = true
      layer.pixelFormat = .bgra8Unorm
      layer.framebufferOnly = false
    }
    
    func reset() {
      filters = []
      layer.removeFromSuperlayer()
    }
    
    func parse(css: String) {
      let isEmpty = filters.count == 0
      filters = CSSFilters.parse(css)
      if(!isEmpty && filters.count == 0){
        reset()
      }
    }
    
    func resizeLayerIfNeeded() {
      guard let view = view else { return }
      if layer.frame != view.bounds {
        let scale = view.window?.screen.scale ?? UIScreen.main.scale
        let pixelSize = CGSize(width: view.bounds.width * scale, height: view.bounds.height * scale)
        if layer.frame != view.bounds || layer.drawableSize != pixelSize || layer.contentsScale != scale {
          layer.frame = view.bounds
          layer.contentsScale = scale
          layer.drawableSize = pixelSize
        }
      }
    }
    
    func apply(to view: UIView) {
      if(device == nil){
        device = MTLCreateSystemDefaultDevice()
        guard let device = device else {return}
        commandQueue = device.makeCommandQueue()
        ciContext = CIContext(mtlDevice: device)
      }
      if(self.view != view){
        layer.device = device
        self.view = view
      }
      var ciFilters: [CIFilter] = []
      var shadowApplied = false
      // shadow is applied once store a ref to the blur
      var shadowBlur: (Int,Filter)? = nil
      for (i, filter) in filters.enumerated() {
        switch filter {
        case .blur(let radius):
          let blurFilter = CIFilter.gaussianBlur()
          blurFilter.name = "blur"
          blurFilter.radius = Float(radius)
          ciFilters.append(blurFilter)
        case .brightness(let value):
          let filter = CIFilter.colorControls()
          filter.name = "brightness"
          filter.brightness = Float(value - 1) // Core Image: 0 = normal
          ciFilters.append(filter)
        case .contrast(let value):
          let filter = CIFilter.colorControls()
          filter.name = "contrast"
          filter.contrast = Float(value)
          ciFilters.append(filter)
          
        case .saturate(let value):
          let filter = CIFilter.colorControls()
          filter.name = "saturate"
          filter.saturation = Float(value)
          ciFilters.append(filter)
          
        case .hueRotate(let degrees):
          let filter = CIFilter.hueAdjust()
          filter.name = "hueRotate"
          filter.angle = Float(degrees * .pi / 180)
          ciFilters.append(filter)
          
        case .invert(let amount):
          let t = CGFloat(1 - 2 * amount)
          let o = CGFloat(amount) // the offset
          let cmFilter = CIFilter.colorMatrix()
          cmFilter.name = "invert"
          cmFilter.rVector = CIVector(x: t, y: 0, z: 0, w: 0)
          cmFilter.gVector = CIVector(x: 0, y: t, z: 0, w: 0)
          cmFilter.bVector = CIVector(x: 0, y: 0, z: t, w: 0)
          cmFilter.aVector = CIVector(x: 0, y: 0, z: 0, w: 1)
          cmFilter.biasVector = CIVector(x: o, y: o, z: o, w: 0)
          ciFilters.append(cmFilter)
        case .opacity(let amount):
          view.alpha = amount
          
        case .sepia(let amount):
          let filter = CIFilter.sepiaTone()
          filter.intensity = Float(amount)
          ciFilters.append(filter)
          
        case .grayscale(let amount):
          let filter = CIFilter.colorControls()
          filter.saturation = Float(1 - amount)
          ciFilters.append(filter)
          
        case .dropShadow(_, _, _, _):
          
          // Store the filter info create after then insert into position
          if !shadowApplied {
            shadowBlur = (i, filter)
            shadowApplied = true
          }
          
          break
          
        }
      }
      
      // Apply CI filters to snapshot
      if !ciFilters.isEmpty || shadowBlur != nil {
        if(view.layer.sublayers?.last != layer){
          view.layer.addSublayer(layer)
        }
        
        resizeLayerIfNeeded()
        
        
        
        guard let drawable = layer.nextDrawable() else { return }
        
        // Get a CIImage from the view's layer contents (pixels) or snapshot at the correct scale
        var ciImage: CIImage?
        if let cg = view.layer.contents {
          let cg = cg as! CGImage
          ciImage = CIImage(cgImage: cg)
        } else {
          // Fallback snapshot at correct scale
          let scale = layer.contentsScale
          let fmt = UIGraphicsImageRendererFormat()
          fmt.scale = scale
          fmt.opaque = false
          let renderer = UIGraphicsImageRenderer(bounds: view.bounds, format: fmt)
          let image = renderer.image { ctx in
            view.layer.render(in: ctx.cgContext)
          }
          if let cg = image.cgImage {
            ciImage = CIImage(cgImage: cg)
          } else {
            ciImage = CIImage(image: image)
          }
        }
        
        guard var output = ciImage else { return }
        
        let originalExtent = output.extent
        
        if let (_, filter) = shadowBlur  {
          switch filter {
          case .dropShadow(offsetX: let offsetX, offsetY: let offsetY, blur: let blur, color: let color):
            // 1. Blur original image
            let blurFilter = CIFilter.gaussianBlur()
            blurFilter.radius = Float(blur)
            
            
            var blurredOutPut: CIImage? = nil
            
            if let clamp = CIFilter(name: "CIAffineClamp") {
              clamp.setValue(output, forKey: kCIInputImageKey)
              clamp.setValue(CGAffineTransform.identity, forKey: "inputTransform")
              if let clamped = clamp.outputImage {
                blurFilter.setValue(clamped, forKey: kCIInputImageKey)
                if let blurred = blurFilter.outputImage {
                  // crop back to the original image extent
                  blurredOutPut = blurred.cropped(to: originalExtent)
                }
              }
            }
            
            
            if(blurFilter.outputImage == nil){
              blurFilter.inputImage = output
            }
            
            
            guard let blurredShadow = blurredOutPut ?? blurFilter.outputImage else { break }
            
            // 2. Solid color
            guard let colorGen = CIFilter(name: "CIConstantColorGenerator") else { break }
            colorGen.setValue(CIColor(color: color), forKey: kCIInputColorKey)
            guard let colorImage = colorGen.outputImage else { break }
            
            // 3. Mask to alpha
            guard let mask = CIFilter(name: "CIMaskToAlpha") else { break }
            mask.setValue(blurredShadow, forKey: kCIInputImageKey)
            guard let alphaMask = mask.outputImage else { break }
            
            // 4. Multiply compositing (tint the shadow)
            guard let multiply = CIFilter(name: "CIMultiplyCompositing") else { break }
            multiply.setValue(colorImage, forKey: kCIInputImageKey)
            multiply.setValue(alphaMask, forKey: kCIInputBackgroundImageKey)
            guard let shadowImage = multiply.outputImage else { break }
            
            // 5. Offset shadow
            let offsetTransform = CGAffineTransform(translationX: offsetX, y: offsetY)
            let offsetShadow = shadowImage.transformed(by: offsetTransform)
            
            // 6. Composite original image over shadow
            guard let composite = CIFilter(name: "CISourceOverCompositing") else { break }
            composite.setValue(output, forKey: kCIInputImageKey)
            composite.setValue(offsetShadow, forKey: kCIInputBackgroundImageKey)
            if let filtered = composite.outputImage {
              output = filtered
            }
            
            break
          default:break
          }
        }
      
        
        // Apply filters
        for filter in ciFilters {
          
          
          // Special-case blur: clamp edges first so blur/invert samples outside pixels instead of producing transparent/uncropped edges.
              if filter.name == "blur" || filter.name == "invert" {
                // clamp input to avoid edge artifacts
                if let clamp = CIFilter(name: "CIAffineClamp") {
                  clamp.setValue(output, forKey: kCIInputImageKey)
                  clamp.setValue(CGAffineTransform.identity, forKey: "inputTransform")
                  if let clamped = clamp.outputImage {
                    filter.setValue(clamped, forKey: kCIInputImageKey)
                    if let blurred = filter.outputImage {
                      // crop back to the original image extent
                      output = blurred.cropped(to: originalExtent)
                    }
                    continue
                  }
                }
              }
          
          
          
          filter.setValue(output, forKey: kCIInputImageKey)
          if let filtered = filter.outputImage {
            output = filtered
          }
        }
        
        
        // Map CIImage -> drawable pixel space:
        let outputExtent = output.extent
        let texW = CGFloat(drawable.texture.width)
        let texH = CGFloat(drawable.texture.height)
        
        // protect against zero sized extents
        guard outputExtent.width > 0 && outputExtent.height > 0 else { return }
        
        // compute scale factors to map CI image extent -> texture pixels
        let scaleX = texW / outputExtent.width
        let scaleY = texH / outputExtent.height
        
        // translate image origin to (0,0) then scale to texture pixels
        var transform = CGAffineTransform(translationX: -outputExtent.origin.x, y: -outputExtent.origin.y)
        transform = transform.scaledBy(x: scaleX, y: scaleY)
        
        let finalImage = output.transformed(by: transform)
        
        // Render into the drawable's pixel-sized texture
        let targetBounds = CGRect(x: 0, y: 0, width: drawable.texture.width, height: drawable.texture.height)
        let cb = commandQueue?.makeCommandBuffer()
        
        ciContext?.render(finalImage,
                          to: drawable.texture,
                          commandBuffer: cb,
                          bounds: targetBounds,
                          colorSpace: CGColorSpaceCreateDeviceRGB())
        if let cb = cb {
          cb.present(drawable)
          cb.commit()
        } else {
          drawable.present()
        }
      }
    }
  }
  
  
  
  static func parse(_ value: String) -> [Filter] {
    var filters: [Filter] = []
    
    // Regex: matches "filterName(param)"
    let pattern = #"(\w+(?:-\w+)?)\(([^)]+)\)"#
    guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else {
      return filters
    }
    
    let nsValue = value as NSString
    let matches = regex.matches(in: value, range: NSRange(location: 0, length: nsValue.length))
    
    for match in matches {
      guard match.numberOfRanges == 3 else { continue }
      let name = nsValue.substring(with: match.range(at: 1)).lowercased()
      let param = nsValue.substring(with: match.range(at: 2)).trimmingCharacters(in: .whitespacesAndNewlines)
      
      switch name {
      case "blur":
        filters.append(.blur(radius: parseCssFloat(param)))
      case "brightness":
        filters.append(.brightness(value: parseCssFloat(param, defaultValue: 1)))
      case "contrast":
        filters.append(.contrast(value: parseCssFloat(param, defaultValue: 1)))
      case "saturate":
        filters.append(.saturate(value: parseCssFloat(param, defaultValue: 1)))
      case "hue-rotate":
        filters.append(.hueRotate(degrees: parseCssAngle(param)))
      case "invert":
        filters.append(.invert(amount: parseCssFloat(param, defaultValue: 0)))
      case "opacity":
        filters.append(.opacity(amount: parseCssFloat(param, defaultValue: 1)))
      case "sepia":
        filters.append(.sepia(amount: parseCssFloat(param, defaultValue: 0)))
      case "grayscale":
        filters.append(.grayscale(amount: parseCssFloat(param, defaultValue: 0)))
      case "drop-shadow":
        if let shadow = parseDropShadow(param) {
          filters.append(shadow)
        }
      default:
        continue
      }
    }
    
    return filters
  }
  
  
  
  // Parse a CSS float value like "5px" or "50%"
  private static func parseCssFloat(_ value: String, defaultValue: CGFloat = 0) -> CGFloat {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if trimmed.hasSuffix("px") {
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
    let parts = value.trimmingCharacters(in: .whitespacesAndNewlines).components(separatedBy: .whitespaces)
    guard parts.count >= 3 else { return nil }
    
    let offsetX = parseCssFloat(parts[0])
    let offsetY = parseCssFloat(parts[1])
    let blur = parseCssFloat(parts[2])
    let color: UIColor
    if parts.count >= 4 {
      let colorString = parts[3...].joined(separator: " ")
      color = parseCssColor(colorString)
    } else {
      color = .black
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
