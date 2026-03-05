//
//  NativeHelpers.swift
//  Mason
//
//  Created by Osei Fortune on 01/11/2025.
//

class NativeHelpers {
  static func nativeNodeAddChild(_ mason: NSCMason, _ parent: MasonNode, _ child: MasonNode){
    mason_node_add_child(mason.nativePtr, parent.nativePtr, child.nativePtr)
  }
  
  static internal func toSwiftString(_ function: ()-> UnsafeMutablePointer<CChar>?) -> String?{
    let cStringPointer = function()
    guard let cStringPointer = cStringPointer else {
      return nil
    }
    defer {
      mason_util_destroy_string(cStringPointer)
    }
    return String(cString: cStringPointer)
  }

  static func nativeNodeGetFloatRects(_ mason: NSCMason, _ node: MasonNode) -> [Float] {
    guard let buffer = mason_node_get_float_rects_buffer(mason.nativePtr, node.nativePtr) else { return [] }

    let buf = buffer.pointee
    defer { mason_node_release_float_rects_buffer(buffer) }

    guard buf.data != nil && buf.size > 0 else { return [] }

    let count = Int(buf.size) / MemoryLayout<Float>.size
    guard let rawPtr = UnsafeRawPointer(buf.data) else { return [] }
    let floatPtr = rawPtr.bindMemory(to: Float.self, capacity: count)
    let array = Array(UnsafeBufferPointer(start: floatPtr, count: count))
    return array
  }

  /// Return float rects along with the native CMasonNode pointer for each float.
  /// Each entry is `(nativePtr, rect)` where `nativePtr` is the CMasonNode pointer
  /// that was serialized by the Rust wrapper, and `rect` is in engine logical units.
  static func nativeNodeGetFloatRectsWithNodes(_ mason: NSCMason, _ node: MasonNode) -> [(OpaquePointer?, CGRect)] {
    guard let buffer = mason_node_get_float_rects_buffer(mason.nativePtr, node.nativePtr) else { return [] }

    let buf = buffer.pointee
    defer { mason_node_release_float_rects_buffer(buffer) }

    guard buf.data != nil && buf.size > 0 else { return [] }

    let ptrSize = MemoryLayout<UnsafeRawPointer>.size
    let floatSize = MemoryLayout<Float>.size
    let entrySize = ptrSize + 4 * floatSize
    let count = Int(buf.size) / entrySize
    guard let rawPtr = UnsafeRawPointer(buf.data) else { return [] }

    var out: [(OpaquePointer?, CGRect)] = []
    for i in 0..<count {
      let base = rawPtr.advanced(by: i * entrySize)
      // read pointer as native usize
      let nodePtrValue = base.bindMemory(to: UInt.self, capacity: 1).pointee
      let nodePtr = OpaquePointer(bitPattern: nodePtrValue)
      let floatBase = base.advanced(by: ptrSize).bindMemory(to: Float.self, capacity: 4)
      let left = CGFloat(floatBase[0])
      let top = CGFloat(floatBase[1])
      // Note: the engine encodes `right` and `bottom` as width and height
      // respectively (see Tree::FloatRect). Treat them as size, not edges.
      let width = CGFloat(floatBase[2])
      let height = CGFloat(floatBase[3])
      // Return raw engine values (device pixels). Caller should convert to
      // UIKit points if needed by dividing by `NSCMason.scale`.
      let rect = CGRect(x: left, y: top, width: max(0, width), height: max(0, height))
      out.append((nodePtr, rect))
    }

    return out
  }

}
