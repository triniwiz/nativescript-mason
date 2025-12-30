//
//  MasonTextNode.swift
//  Mason
//
//  Created by Osei Fortune on 24/09/2025.
//


@objc public protocol MasonCharacterData {
  var data: String { get set }
   var length: Int { get }
  @discardableResult func appendData(_ s: String) -> Self
  @discardableResult func insertData(_ s: String, at offset: Int) -> Self
  @discardableResult func deleteData(offset: Int, count: Int) -> Self
  @discardableResult func replaceData(offset: Int, count: Int, with s: String) -> Self
  func substringData(offset: Int, count: Int) -> String

  // Cocoa convenience (NSRange is UTF-16)
  @discardableResult func deleteData(range: NSRange) -> Self
  @discardableResult func replaceData(range: NSRange, with s: String) -> Self
}

enum MasonError: Error {
    case DOMException(message: String)
}

@objc(MasonTextNode)
@objcMembers
public class MasonTextNode: MasonNode, MasonCharacterData {
   
  internal var container: TextContainer?
  
  public var data: String
  
  internal var attributes: [NSAttributedString.Key: Any] = [:]
  
  internal var attributesInitialized: Bool = false
  
  
  public init(mason doc: NSCMason, data text: String, attributes attrs: [NSAttributedString.Key: Any]? = nil) {
    data = text
    if let attrs = attrs {
      attributes = attrs
      attributesInitialized = true
    }
    super.init(dataNode: doc)
  }
  
  public override func appendChild(_ child: MasonNode) {

  }
  
  public var length: Int {
    get {
      return data.count
    }
  }
  
  // is always the attached container parent
  internal override var layoutParent: MasonNode? {
    get{
      return container?.node
    }
    set {
      // noop
    }
  }
  
  public func substringData(offset: Int, count: Int) -> String {
    let ns = data as NSString
    let r = NSRange(location: max(0, offset), length: max(0, count))
    let clipped = NSIntersectionRange(r, NSRange(location: 0, length: ns.length))
    return clipped.length > 0 ? ns.substring(with: clipped) : ""
  }

  @discardableResult public func appendData(_ s: String) -> Self {
    data += s
    return self
  }

  @discardableResult public  func insertData(_ s: String, at offset: Int) -> Self {
    let ns = data as NSString
    let i = max(0, min(offset, ns.length))
    let head = ns.substring(to: i)
    let tail = ns.substring(from: i)
    data = head + s + tail
    return self
  }

  @discardableResult public  func deleteData(offset: Int, count: Int) -> Self {
    let ns = data as NSString
    let r = NSRange(location: max(0, offset), length: max(0, count))
    let clipped = NSIntersectionRange(r, NSRange(location: 0, length: ns.length))
    if clipped.length > 0 {
      data = ns.replacingCharacters(in: clipped, with: "")
    }
    return self
  }

  @discardableResult public  func replaceData(offset: Int, count: Int, with s: String) -> Self {
    let ns = data as NSString
    let r = NSRange(location: max(0, offset), length: max(0, count))
    let clipped = NSIntersectionRange(r, NSRange(location: 0, length: ns.length))
    data = ns.replacingCharacters(in: clipped, with: s)
    return self
  }

  @discardableResult public  func deleteData(range: NSRange) -> Self {
    let ns = data as NSString
    let clipped = NSIntersectionRange(range, NSRange(location: 0, length: ns.length))
    if clipped.length > 0 {
      data = ns.replacingCharacters(in: clipped, with: "")
    }
    return self
  }

  @discardableResult public  func replaceData(range: NSRange, with s: String) -> Self {
    let ns = data as NSString
    let clipped = NSIntersectionRange(range, NSRange(location: 0, length: ns.length))
    data = ns.replacingCharacters(in: clipped, with: s)
    return self
  }
  
}

extension MasonTextNode {
    /// Get attributed string representation of this text node
    public func attributed() -> NSAttributedString {
        // Apply text transforms and whitespace processing
        let processedText = processText(data)
      
        return NSAttributedString(string: processedText, attributes: attributes)
    }
  
  internal func fullWidthTransformed(_ string: String) -> String {
    let mapped = string.unicodeScalars.map { scalar in
      if scalar.value >= 0x21 && scalar.value <= 0x7E {
        let fullWidth = scalar.value + 0xFEE0
        return UnicodeScalar(fullWidth)!
      } else {
        return scalar
      }
    }
    
    return String(String.UnicodeScalarView(mapped))
  }
    
    private func processText(_ text: String) -> String {
        guard let container = self.container else { return text }
        
        var processed = text
        
        // Apply text transform
      let transform = container.node.style.textTransform
        switch transform {
        case .None:
            break
        case .Capitalize:
            processed = processed.capitalized
        case .Uppercase:
            processed = processed.uppercased()
        case .Lowercase:
            processed = processed.lowercased()
        case .FullWidth:
            processed = fullWidthTransformed(processed)
        case .FullSizeKana:
            processed = processed.applyingTransform(.fullwidthToHalfwidth, reverse: true) ?? processed
        case .MathAuto:
            // TODO: implement proper math transform
            break
        }
        
        // Apply whitespace processing
      let whiteSpace = container.node.style.whiteSpace
        switch whiteSpace {
        case .Normal:
            processed = normalizeNewlines(processed)
                .replacingOccurrences(of: collapsiblePlusLF, with: " ", options: .regularExpression)
        case .Pre:
            processed = normalizeNewlines(processed)
        case .PreWrap:
            processed = normalizeNewlines(processed)
        case .PreLine:
            processed = processPreLine(processed, treatNBSPAsSpace: false)
        case .NoWrap:
            processed = normalizeNewlines(processed)
                .replacingOccurrences(of: collapsiblePlusLF, with: " ", options: .regularExpression)
        case .BreakSpaces:
          // todo
          break
        }
        
        return processed
    }
}
