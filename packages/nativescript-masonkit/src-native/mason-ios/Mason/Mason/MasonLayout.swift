//
//  MasonLayout.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import simd

// MARK: - Internal Flat Layout Tree (Swift-only)

public final class MasonLayoutTree {
  // Node order
  var order: [Int] = []
  
  // Geometry: x, y, width, height
  var frames: [SIMD4<Float>] = []
  
  // Borders, Margins, Paddings: top, right, bottom, left
  var borders: [SIMD4<Float>] = []
  var margins: [SIMD4<Float>] = []
  var paddings: [SIMD4<Float>] = []
  
  // Content & Scrollbar sizes: width, height
  var contentSizes: [SIMD2<Float>] = []
  var scrollbarSizes: [SIMD2<Float>] = []
  
  // Children indices
  var childStart: [Int] = []
  var childCount: [Int] = []
  var childIndices: [Int] = []
  
  public var nodeCount: Int { frames.count }
  
  public init() {}
  
  // MARK: - Parsing from [Float] array
  
  public func fromFloatArray(_ args: [Float]) {
    reset()
    var currentIndex = 0
    var arrayIndex = 0
    
    while arrayIndex < args.count {
      let nodeOrder = Int(args[arrayIndex]); arrayIndex += 1
      let x = args[arrayIndex]; arrayIndex += 1
      let y = args[arrayIndex]; arrayIndex += 1
      let width = args[arrayIndex]; arrayIndex += 1
      let height = args[arrayIndex]; arrayIndex += 1
      
      frames.append(SIMD4<Float>(x, y, width, height))
      
      borders.append(SIMD4<Float>(args[arrayIndex], args[arrayIndex + 1], args[arrayIndex + 2], args[arrayIndex + 3]))
      arrayIndex += 4
      margins.append(SIMD4<Float>(args[arrayIndex], args[arrayIndex + 1], args[arrayIndex + 2], args[arrayIndex + 3]))
      arrayIndex += 4
      paddings.append(SIMD4<Float>(args[arrayIndex], args[arrayIndex + 1], args[arrayIndex + 2], args[arrayIndex + 3]))
      arrayIndex += 4
      
      contentSizes.append(SIMD2<Float>(args[arrayIndex], args[arrayIndex + 1]))
      arrayIndex += 2
      scrollbarSizes.append(SIMD2<Float>(args[arrayIndex], args[arrayIndex + 1]))
      arrayIndex += 2
      
      let childrenCountNode = Int(args[arrayIndex]); arrayIndex += 1
      
      order.append(nodeOrder)
      childStart.append(childIndices.count)
      childCount.append(childrenCountNode)
      
      for _ in 0..<childrenCountNode {
        childIndices.append(currentIndex + 1) // placeholder sequential
      }
      
      currentIndex += 1
    }
  }
  
  // MARK: - Parsing from UnsafePointer<Float>
  
  public func fromFloatPointer(_ ptr: UnsafePointer<Float>, count: Int) {
    reset()
    var array = ptr
    let end = ptr.advanced(by: count)

    while array < end {
      let nodeOrder = Int(array.pointee.rounded(.towardZero)); array = array.advanced(by: 1)
      let x = array.pointee; array = array.advanced(by: 1)
      let y = array.pointee; array = array.advanced(by: 1)
      let width = array.pointee; array = array.advanced(by: 1)
      let height = array.pointee; array = array.advanced(by: 1)
      
      frames.append(SIMD4<Float>(x, y, width, height))
      
      borders.append(SIMD4<Float>(array.pointee, array.advanced(by: 1).pointee, array.advanced(by: 2).pointee, array.advanced(by: 3).pointee))
      array = array.advanced(by: 4)
      
      margins.append(SIMD4<Float>(array.pointee, array.advanced(by: 1).pointee, array.advanced(by: 2).pointee, array.advanced(by: 3).pointee))
      array = array.advanced(by: 4)
      
      paddings.append(SIMD4<Float>(array.pointee, array.advanced(by: 1).pointee, array.advanced(by: 2).pointee, array.advanced(by: 3).pointee))
      array = array.advanced(by: 4)
      
      contentSizes.append(SIMD2<Float>(array.pointee, array.advanced(by: 1).pointee))
      array = array.advanced(by: 2)
      
      scrollbarSizes.append(SIMD2<Float>(array.pointee, array.advanced(by: 1).pointee))
      array = array.advanced(by: 2)
      
      let childrenCountNode = Int(array.pointee.rounded(.towardZero)); array = array.advanced(by: 1)

      let nodeIndex = order.count
      order.append(nodeOrder)
      childStart.append(childIndices.count)
      childCount.append(childrenCountNode)

      for i in 0..<childrenCountNode {
        childIndices.append(nodeIndex + 1 + i) // sequential indexing
      }
    }
  }
  
  // Reset all arrays
  private func reset() {
    order.removeAll(keepingCapacity: true)
    frames.removeAll(keepingCapacity: true)
    borders.removeAll(keepingCapacity: true)
    margins.removeAll(keepingCapacity: true)
    paddings.removeAll(keepingCapacity: true)
    contentSizes.removeAll(keepingCapacity: true)
    scrollbarSizes.removeAll(keepingCapacity: true)
    childStart.removeAll(keepingCapacity: true)
    childCount.removeAll(keepingCapacity: true)
    childIndices.removeAll(keepingCapacity: true)
  }
}

// MARK: - Swift Node View

public struct MasonNodeView {
  let tree: MasonLayoutTree
  let index: Int
  
  public var x: Float { tree.frames[index].x }
  public var y: Float { tree.frames[index].y }
  public var width: Float { tree.frames[index].z }
  public var height: Float { tree.frames[index].w }
  
  public var borderTop: Float { tree.borders[index].x }
  public var borderRight: Float { tree.borders[index].y }
  public var borderBottom: Float { tree.borders[index].z }
  public var borderLeft: Float { tree.borders[index].w }
  
  public var marginTop: Float { tree.margins[index].x }
  public var marginRight: Float { tree.margins[index].y }
  public var marginBottom: Float { tree.margins[index].z }
  public var marginLeft: Float { tree.margins[index].w }
  
  public var paddingTop: Float { tree.paddings[index].x }
  public var paddingRight: Float { tree.paddings[index].y }
  public var paddingBottom: Float { tree.paddings[index].z }
  public var paddingLeft: Float { tree.paddings[index].w }
  
  public var contentWidth: Float { tree.contentSizes[index].x }
  public var contentHeight: Float { tree.contentSizes[index].y }
  
  public var scrollbarWidth: Float { tree.scrollbarSizes[index].x }
  public var scrollbarHeight: Float { tree.scrollbarSizes[index].y }
  
  public var hasChildren: Bool { tree.childCount[index] > 0 }
  
  public var children: [MasonNodeView] {
    let start = tree.childStart[index]
    let count = tree.childCount[index]
    return (0..<count).map { MasonNodeView(tree: tree, index: tree.childIndices[start + $0]) }
  }
}

// MARK: - Obj-C Friendly Helper Classes

@objc(MasonRectHelper)
@objcMembers
public class MasonRectHelper: NSObject {
  private let tree: MasonLayoutTree
  private let index: Int
  private let array: [SIMD4<Float>]
  
  init(tree: MasonLayoutTree, index: Int, array: [SIMD4<Float>]) {
    self.tree = tree
    self.index = index
    self.array = array
  }
  
  public var top: Float { array[index].x }
  public var right: Float { array[index].y }
  public var bottom: Float { array[index].z }
  public var left: Float { array[index].w }
  
  
  public func isEmpty() -> Bool {
    return all(array[index] .== SIMD4<Float>(repeating: 0))
  }
}

@objc(MasonSizeHelper)
@objcMembers
public class MasonSizeHelper: NSObject {
  private let tree: MasonLayoutTree
  private let index: Int
  private let array: [SIMD2<Float>]
  
  init(tree: MasonLayoutTree, index: Int, array: [SIMD2<Float>]) {
    self.tree = tree
    self.index = index
    self.array = array
  }
  
  public var width: Float { array[index].x }
  public var height: Float { array[index].y }
}

// MARK: - Obj-C Friendly MasonLayout Wrapper

@objc(MasonLayout)
@objcMembers
public class MasonLayout: NSObject {
  let tree: MasonLayoutTree
  let index: Int
  
  /// Empty SIMD-zero fallback
   private static let zeroFrame = SIMD4<Float>(repeating: 0)
   private static let zeroRect = SIMD4<Float>(repeating: 0)
   private static let zeroSize = SIMD2<Float>(repeating: 0)
  
  public init(tree: MasonLayoutTree, index: Int) {
    self.tree = tree
    self.index = index
  }
  
  public static let empty: MasonLayout = {
      let tree = MasonLayoutTree()
      // Ensure arrays have at least one element for SIMD indexing
      tree.frames = [zeroFrame]
      tree.borders = [zeroRect]
      tree.margins = [zeroRect]
      tree.paddings = [zeroRect]
      tree.contentSizes = [zeroSize]
      tree.scrollbarSizes = [zeroSize]
      tree.childCount = [0]
      tree.childStart = [0]
      tree.childIndices = []
      return MasonLayout(tree: tree, index: 0)
  }()
  
  // MARK: - Geometry
  public var x: Float { tree.frames[index].x }
  public var y: Float { tree.frames[index].y }
  public var width: Float { tree.frames[index].z }
  public var height: Float { tree.frames[index].w }
  
  
  public var borderTop: Float { tree.borders[index].x }
  public var borderRight: Float { tree.borders[index].y }
  public var borderBottom: Float { tree.borders[index].z }
  public var borderLeft: Float { tree.borders[index].w }
  
  public var marginTop: Float { tree.margins[index].x }
  public var marginRight: Float { tree.margins[index].y }
  public var marginBottom: Float { tree.margins[index].z }
  public var marginLeft: Float { tree.margins[index].w }
  
  public var paddingTop: Float { tree.paddings[index].x }
  public var paddingRight: Float { tree.paddings[index].y }
  public var paddingBottom: Float { tree.paddings[index].z }
  public var paddingLeft: Float { tree.paddings[index].w }
  
  public var contentWidth: Float { tree.contentSizes[index].x }
  public var contentHeight: Float { tree.contentSizes[index].y }
  
  public var scrollbarWidth: Float { tree.scrollbarSizes[index].x }
  public var scrollbarHeight: Float { tree.scrollbarSizes[index].y }
  
  public var sizeIsEmpty: Bool {
    let f = tree.frames[index]
    return f.z == 0 && f.w == 0
  }
  
  public var paddingIsEmpty: Bool {
      return all(tree.paddings[index] .== SIMD4<Float>(repeating: 0))
  }
  
  public var marginIsEmpty: Bool {
      return all(tree.margins[index] .== SIMD4<Float>(repeating: 0))
  }

  public var borderIsEmpty: Bool {
      return all(tree.borders[index] .== SIMD4<Float>(repeating: 0))
  }
  
  
  // MARK: - Rect Helpers
  public var border: MasonRectHelper {
    MasonRectHelper(tree: tree, index: index, array: tree.borders)
  }
  
  public var margin: MasonRectHelper {
    MasonRectHelper(tree: tree, index: index, array: tree.margins)
  }
  
  public var padding: MasonRectHelper {
    MasonRectHelper(tree: tree, index: index, array: tree.paddings)
  }
  
  // MARK: - Size Helpers
  public var contentSize: MasonSizeHelper {
    MasonSizeHelper(tree: tree, index: index, array: tree.contentSizes)
  }
  
  public var scrollbarSize: MasonSizeHelper {
    MasonSizeHelper(tree: tree, index: index, array: tree.scrollbarSizes)
  }
  
  // MARK: - Children
  public var hasChildren: Bool { tree.childCount[index] > 0 }
  
  public var children: [MasonLayout] {
    let start = tree.childStart[index]
    let count = tree.childCount[index]
    return (0..<count).map { MasonLayout(tree: tree, index: tree.childIndices[start + $0]) }
  }
}
