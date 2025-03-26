//
//  MasonNode.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation
import UIKit


private func measure(_ node: UnsafeRawPointer?, _ knownDimensionsWidth: Float, _ knownDimensionsHeight: Float, _ availableSpaceWidth: Float, _ availableSpaceHeight: Float) -> Int64 {
    let node: MasonNode = Unmanaged.fromOpaque(node!).takeUnretainedValue()
    
    guard let size = node.measureFunc?(CGSize(width: CGFloat(knownDimensionsWidth), height: CGFloat(knownDimensionsHeight)), CGSize(width: CGFloat(availableSpaceWidth), height: CGFloat(availableSpaceHeight))) else {
        return MeasureOutput.make(Float.nan, Float.nan)
    }
    
    return MeasureOutput.make(width: size.width, height: size.height)
}


private func create_layout(_ floats: UnsafePointer<Float>?) -> UnsafeMutableRawPointer? {
    let layout = MasonLayout.fromFloatPoint(floats!).1
    return Unmanaged.passRetained(layout).toOpaque()
}


@objc(MasonNode)
@objcMembers
public class MasonNode: NSObject {
    internal var mason: NSCMason
    public internal(set) var nativePtr: OpaquePointer?
    
    public typealias MeasureFunc = (CGSize?, CGSize) -> CGSize
    
    public var data: Any? = nil
    
    internal var measureFunc: MeasureFunc? = nil
    
    lazy public var style: MasonStyle = {
      MasonStyle(node: self)
    }()
  
    public internal(set) var owner: MasonNode? = nil
    public internal(set) var children: [MasonNode] = []
    
    var inBatch = false
    
    internal init(mason doc: NSCMason) {
      nativePtr = mason_node_new_node(mason.nativePtr)
      mason = doc
    }
    
    
    public init(mason: NSCMason, children nodes: [MasonNode]) {
        var childrenMap = nodes.map { node in
            node.nativePtr
        }
 
        nativePtr = mason_node_new_node_with_children(mason.nativePtr, &childrenMap, UInt(childrenMap.count))
        
        children = nodes
    
        super.init()
        
        children.forEach { node in
            node.owner = self
        }
    }
    
    
  internal init(mason: NSCMason, measureFunc function: @escaping MeasureFunc) {
        measureFunc = function
        nativePtr = mason_node_new_node(mason.nativePtr)
        super.init()
        mason_node_set_context(mason.nativePtr, nativePtr, Unmanaged.passRetained(self).toOpaque(), measure)
    }
    
    deinit {
        mason_node_destroy(nativePtr)
    }
    
    
    
    static func to_vec_non_repeated_track_sizing_function(_ array: Array<MinMax>) -> CMasonNonRepeatedTrackSizingFunctionArray {
        let length = array.count
        var cArray = array.map({ minMax in
            minMax.cValue
        })
        return CMasonNonRepeatedTrackSizingFunctionArray(array: cArray.withUnsafeMutableBytes({ ptr in
            ptr.baseAddress!.bindMemory(to: CMasonMinMax.self, capacity: length)
        }), length: UInt(length))
    }
    
    
    
    @discardableResult public func layout() -> MasonLayout {
        
        let points = mason_node_layout(NSCMason.instance.nativePtr,
                                       nativePtr, create_layout)
        
        
        let layout: MasonLayout = Unmanaged.fromOpaque(points!).takeRetainedValue()
        return layout
    }
    
    public var isDirty: Bool {
        return mason_node_dirty(NSCMason.instance.nativePtr, nativePtr)
    }
    
    public func markDirty(){
        mason_node_mark_dirty(NSCMason.instance.nativePtr, nativePtr)
    }

    
    public func getRoot() -> MasonNode? {
        guard let owner = self.owner else {return nil}
        var current = owner
        var next: MasonNode? = current
        while(next != nil){
            next = current.owner
            if(next != nil){
                current = next!
            }
        }
        return current
    }
    
    public func rootCompute() {
        getRoot()?.compute()
    }
    
    public func rootCompute(_ width: Float, _ height: Float) {
        getRoot()?.compute(width, height)
    }
    
    public func rootComputeMaxContent() {
        getRoot()?.computeMaxContent()
    }
    
    public func rootComputeMinContent() {
        getRoot()?.computeMinContent()
    }
    
    public func rootComputeWithViewSize(){
        getRoot()?.computeWithViewSize()
    }
    
    public func rootComputeWithViewSize(layout: Bool){
        getRoot()?.computeWithViewSize(layout: layout)
    }
    
    public func rootComputeWithMaxContent(){
        getRoot()?.computeWithMaxContent()
    }
    
    public func compute() {
        mason_node_compute(NSCMason.instance.nativePtr, nativePtr)
    }
    
    public func compute(_ width: Float, _ height: Float) {
        mason_node_compute_wh(NSCMason.instance.nativePtr, nativePtr, width, height)
    }
    
    public func computeMaxContent() {
        mason_node_compute_max_content(NSCMason.instance.nativePtr, nativePtr)
    }
    
    public func computeMinContent() {
        mason_node_compute_min_content(NSCMason.instance.nativePtr, nativePtr)
    }
    
    public func computeWithSize(_ width: Float, _ height: Float){
        guard let view = data as? UIView else{return}
        MasonNode.attachNodesFromView(view)
        compute(width, height)
        MasonNode.applyToView(view)
    }
    
    public func computeWithViewSize(){
        computeWithViewSize(layout: false)
    }
    
    public func computeWithViewSize(layout: Bool){
        guard let view = data as? UIView else{return}
        MasonNode.attachNodesFromView(view)
        compute(Float(view.frame.size.width) * NSCMason.scale, Float(view.frame.size.height) * NSCMason.scale)
        if(layout){
            MasonNode.applyToView(view)
        }
    }
    
    
    public func computeWithMaxContent(){
        guard let view = data as? UIView else{return}
        MasonNode.attachNodesFromView(view)
        computeMaxContent()
        MasonNode.applyToView(view)
    }
    
    public func computeWithMinContent(){
        guard let view = data as? UIView else{return}
        MasonNode.attachNodesFromView(view)
        computeMinContent()
        MasonNode.applyToView(view)
    }
    
    public func attachAndApply(){
        guard let view = data as? UIView else{return}
        MasonNode.attachNodesFromView(view)
        MasonNode.applyToView(view)
    }
    func getChildAt(_ index: Int) -> MasonNode? {
        return children[index]
    }
    
    func setChildren(_ children: [OpaquePointer?]){
        // todo ensure data is set
        mason_node_set_children(NSCMason.instance.nativePtr, nativePtr, children, UInt(children.count))
    }
    
    
    public func setChildren(children: [MasonNode]){
        setChildren(children.map { child in
            child.owner = self
            return child.nativePtr!
        })
        
        self.children.removeAll()
    }
    
    func addChildren(_ children: [OpaquePointer?]){
        mason_node_add_children(NSCMason.instance.nativePtr, nativePtr, children, UInt(children.count))
    }
    
    public func addChildren(_ children: [MasonNode]){
        let map = children.map { node in
            node.owner = self
            return node.nativePtr
        }
        
        mason_node_add_children(NSCMason.instance.nativePtr, nativePtr, map, UInt(map.count))
    }
    
    func addChild(_ child: MasonNode) {
        guard let childPtr = child.nativePtr else {
            return
        }
        
      mason_node_add_child(mason.nativePtr, nativePtr, childPtr)
        
      guard let existing = children[childPtr] else {
            child.owner = self
            
            children.append(child)
            
            nodes[childPtr] = child
            
            return
        }
        
        existing.owner = self
        
    }
    
    func addChildAt(_ child: MasonNode, _ index: Int) {
        
        if (index == -1) {
            mason_node_add_child(NSCMason.instance.nativePtr, nativePtr, child.nativePtr)
            
            children.append(child)
            
            child.owner = self
            
            guard let childPtr = child.nativePtr else {return}
            
            nodes[childPtr] = child
            
            return
        }
        
      mason_node_add_child_at(mason.nativePtr, nativePtr, UnsafeMutableRawPointer(child.nativePtr), UInt(index))
        
        guard let childPtr = child.nativePtr else {
            return
        }
        
        
        child.owner = self
        
        children.insert(child, at: index)
        
        nodes[childPtr] = child
    }
    
    
    
    @discardableResult func removeChild(child: MasonNode) -> MasonNode? {
        let removedNode = mason_node_remove_child(NSCMason.instance.nativePtr, nativePtr, child.nativePtr)
      
        if (removedNode == nil) {
            return nil
        }
        assert(child.nativePtr == removedNode)
        child.owner = nil
        
        guard let index = children.firstIndex(of: child) else {
            return nil
        }
        children.remove(at: index)
        
        guard let childPtr = child.nativePtr else {
            return child
        }
        
        
        return child
    }
    
    
    func removeAllChildren() {
      mason_node_remove_children(mason.nativePtr, nativePtr)
        children.forEach { child in
            child.owner = nil
        }
        children.removeAll()
    }
    
    
    func removeChildAt(index: Int) -> MasonNode? {
        // TODO handle negative index
        if(index < 0){
            return nil
        }
        guard let removedNode = mason_node_remove_child_at(NSCMason.instance.nativePtr, nativePtr, UInt(index)) else {return nil}
        
        let node = nodes[removedNode]
        
        nodes[removedNode] = nil
        
        guard let node = node else {return nil}
        
        node.owner = nil
        
        guard let index = children.firstIndex(of: node) else {return nil}
        
        return children.remove(at: index)
    }
    
    
    func removeMeasureFunction(){
        mason_node_remove_context(NSCMason.instance.nativePtr, nativePtr)
        self.measureFunc = nil
    }
    
    func setMeasureFunction(_ measureFunc: @escaping MeasureFunc) {
        self.measureFunc = measureFunc
        mason_node_set_context(NSCMason.instance.nativePtr, nativePtr, Unmanaged.passUnretained(self).toOpaque(), measure)
    }
    
    public var isLeaf: Bool {
        assert(Thread.isMainThread, "This method must be called on the main thread.")
        if(isEnabled){
            guard let view = self.data as? UIView else {return true}
            for subview in view.subviews {
                let mason = subview.mason
                if(mason.isEnabled && mason.includeInLayout){
                    return false
                }
            }
        }
        return true
    }
    
    public func configure(_ block :(MasonNode) -> Void) {
        inBatch = true
        block(self)
        inBatch = false
        style.updateNativeStyle()
    }
    
    func setDefaultMeasureFunction(){
        guard let view = data as? UIView else {return}
        self.setMeasureFunction { knownDimensions, availableSpace in
            return MasonNode.measureFunction(view, knownDimensions, availableSpace)
        }
    }
    
    static func attachNodesFromView(_ view: UIView){
        let node = view.mason
        if(node.isLeaf){
            node.removeAllChildren()
            node.setMeasureFunction { knownDimensions, availableSpace in
                return measureFunction(view, knownDimensions, availableSpace)
            }
        } else {
            node.removeMeasureFunction()
            let count = view.subviews.count
            var subviewsToInclude = Array<UIView>()
            subviewsToInclude.reserveCapacity(count)
            
            var nodesToInclude = Array<OpaquePointer?>()
            nodesToInclude.reserveCapacity(count)
            
            for subview in view.subviews {
                let mason = subview.mason
                if(mason.isEnabled && mason.includeInLayout){
                    subviewsToInclude.append(subview)
                    nodesToInclude.append(mason.nativePtr)
                    mason.owner = view.mason
                }
            }
            
            if(!mason_node_is_children_same(NSCMason.instance.nativePtr, node.nativePtr, &nodesToInclude, UInt(nodesToInclude.count))){
                node.removeAllChildren()
                node.setChildren(nodesToInclude)
            }
            
            for subview in view.subviews {
                attachNodesFromView(subview)
            }
            
        }
    }
    
    static func applyToView(_ view: UIView){
        let mason = view.mason
        
        if(!mason.includeInLayout){
            return
        }
        
        var layout = mason.layout()
        
        var widthIsNan = layout.width.isNaN
        
        var heightIsNan = layout.height.isNaN
        
        let widthIsZero = mason.style.size.width.isZero
        
        let heightIsZero = mason.style.size.height.isZero
        
        var width = CGFloat(layout.width.isNaN ? 0 : layout.width/NSCMason.scale)
        
        var height = CGFloat(layout.height.isNaN ? 0 : layout.height/NSCMason.scale)
        
        var hasPercentDimensions = false
        
        if (width.isZero && !widthIsZero) {
            switch(mason.style.size.width){
            case .Auto:
                widthIsNan = true
            case .Percent(_):
                hasPercentDimensions = true
            default:
                break
            }
        }
        
        
        if (height.isZero && !heightIsZero) {
            switch(mason.style.size.height){
            case .Auto:
                heightIsNan = true
            case .Percent(_):
                hasPercentDimensions = true
            default:
                break
            }
        }
        
        if (hasPercentDimensions) {
            mason.owner?.markDirty()
            mason.markDirty()
            mason.rootComputeWithViewSize()
            layout = mason.layout()
            widthIsNan = layout.width.isNaN
            heightIsNan = layout.height.isNaN
            
            width = CGFloat(layout.width.isNaN ? 0 : layout.width/NSCMason.scale)
            
            height = CGFloat(layout.height.isNaN ? 0 : layout.height/NSCMason.scale)
            
        }
        
    
        if (widthIsZero) {
            width = 0
            widthIsNan = false
        }
        
        if (heightIsZero) {
            height = 0
            heightIsNan = false
        }
        
        
        if (widthIsNan || heightIsNan) {
            let fit = view.sizeThatFits(CGSizeMake(.greatestFiniteMagnitude, .greatestFiniteMagnitude))
            width = fit.width
            height = fit.height
        }
        
        
        let x = CGFloat(layout.x.isNaN ? 0 : layout.x/NSCMason.scale)
        
        let y = CGFloat(layout.y.isNaN ? 0 : layout.y/NSCMason.scale)
        
        let point = CGPoint(x: x, y: y)
        
        let size = CGSizeMake(width, height)
        
        view.frame = CGRect(origin: point, size: size)
        
        if (!mason.isLeaf) {
            view.subviews.forEach { subview in
                MasonNode.applyToView(subview)
            }
        }
    }
    
    enum MeasureMode {
        case Min
        case Max
        case Definite
    }
    
    static func measureFunction(_ view: UIView, _ knownDimensions: CGSize?,_ availableSpace: CGSize) -> CGSize {
    
        let node = view.mason
                
       
        
        return size
        
    }
    
    
}
