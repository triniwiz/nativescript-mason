//
//  MasonNode.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation

private func measure(_ node: UnsafeRawPointer?, _ knownDimensionsWidth: Float, _ knownDimensionsHeight: Float, _ availableSpaceWidth: Float, _ availableSpaceHeight: Float) -> Int64 {
    let node: MasonNode = Unmanaged.fromOpaque(node!).takeUnretainedValue()
    
    guard let size = node.measureFunc?(CGSize(width: CGFloat(knownDimensionsWidth), height: CGFloat(knownDimensionsHeight)), CGSize(width: CGFloat(availableSpaceWidth), height: CGFloat(availableSpaceHeight))) else {
        return MeasureOutput.make(width: Float.nan, height: Float.nan)
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
    internal var nativePtr: UnsafeMutableRawPointer!
    
    public typealias MeasureFunc = (CGSize?, CGSize) -> CGSize
    
    internal var measureFunc: MeasureFunc? = nil
    
    internal var updatingChildren = false
    
    var style: MasonStyle {
        didSet {
            
        }
    }
    
    var data: Any? = nil
    internal var owner: MasonNode? = nil
    var children: [MasonNode] = []
    internal var nodes: [UnsafeMutableRawPointer: MasonNode] = [:]
    
    
    internal init(_ nativePtr: UnsafeMutableRawPointer) {
        self.nativePtr = nativePtr
        style = MasonStyle()
    }
    
    public override init() {
        style = MasonStyle()
        nativePtr = mason_node_new_node(TSCMason.instance.nativePtr, style.nativePtr)
    }
    
    public init(style: MasonStyle) {
        self.style = style
        nativePtr = mason_node_new_node(TSCMason.instance.nativePtr, style.nativePtr)
    }
    
    public init(style: MasonStyle, children: [MasonNode]) {
        var childrenMap = children.map { node in
            node.nativePtr!
        }
        
        nativePtr = mason_node_new_node_with_children(TSCMason.instance.nativePtr, style.nativePtr, &childrenMap, UInt(childrenMap.count))
        
        self.style = style
        self.children = children
        
        super.init()
        
        children.forEach { node in
            node.data = self
        }
    }
    
    
    public init(style: MasonStyle, measureFunc: @escaping MeasureFunc) {
        self.style = style
        self.measureFunc = measureFunc
        self.nativePtr = nil
        
        super.init()
        
        nativePtr = mason_node_new_node_with_measure_func(TSCMason.instance.nativePtr, style.nativePtr, Unmanaged.passRetained(self).toOpaque(), measure)
        
    }
    
    
    internal func updateNodeStyle() {
        if (style.isDirty) {
            mason_node_update_and_set_style_with_values(
                TSCMason.instance.nativePtr, nativePtr, style.nativePtr,
                style.display.rawValue,
                style.positionType.rawValue,
                style.direction.rawValue,
                style.flexDirection.rawValue,
                style.flexWrap.rawValue,
                style.overflow.rawValue,
                style.alignItems.rawValue,
                style.alignSelf.rawValue,
                style.alignContent.rawValue,
                style.justifyContent.rawValue,
                
                style.position.left.type,
                style.position.left.value,
                style.position.right.type,
                style.position.right.value,
                style.position.top.type,
                style.position.top.value,
                style.position.bottom.type,
                style.position.bottom.value,
                
                style.margin.left.type,
                style.margin.left.value,
                style.margin.right.type,
                style.margin.right.value,
                style.margin.top.type,
                style.margin.top.value,
                style.margin.bottom.type,
                style.margin.bottom.value,
                
                style.padding.left.type,
                style.padding.left.value,
                style.padding.right.type,
                style.padding.right.value,
                style.padding.top.type,
                style.padding.top.value,
                style.padding.bottom.type,
                style.padding.bottom.value,
                
                style.border.left.type,
                style.border.left.value,
                style.border.right.type,
                style.border.right.value,
                style.border.top.type,
                style.border.top.value,
                style.border.bottom.type,
                style.border.bottom.value,
                
                style.flexGrow,
                style.flexShrink,
                
                style.flexBasis.type,
                style.flexBasis.value,
                
                style.size.width.type,
                style.size.width.value,
                style.size.height.type,
                style.size.height.value,
                
                style.minSize.width.type,
                style.minSize.width.value,
                style.minSize.height.type,
                style.minSize.height.value,
                
                style.maxSize.width.type,
                style.maxSize.width.value,
                style.maxSize.height.type,
                style.maxSize.height.value,
                
                style.flexGap.width.type,
                style.flexGap.width.value,
                style.flexGap.height.type,
                style.flexGap.height.value,
                
                style.aspectRatio ?? Float.nan
            )
            style.isDirty = false
        }
        
    }
    
    @discardableResult func layout() -> MasonLayout {
        
        let points = mason_node_layout(TSCMason.instance.nativePtr,
                                       nativePtr, create_layout)
        
        
        let layout: MasonLayout = Unmanaged.fromOpaque(points!).takeUnretainedValue()
        return layout
    }
    
    @discardableResult func computeAndLayout(size: MasonSize<Float>? = nil) -> MasonLayout {
        var points: UnsafeMutableRawPointer? = nil
        if (size != nil) {
            points = mason_node_update_style_with_values_size_compute_and_layout(
                TSCMason.instance.nativePtr,
                nativePtr,
                style.nativePtr,
                size!.width, size!.height,
                style.display.rawValue,
                style.positionType.rawValue,
                style.direction.rawValue,
                style.flexDirection.rawValue,
                style.flexWrap.rawValue,
                style.overflow.rawValue,
                style.alignItems.rawValue,
                style.alignSelf.rawValue,
                style.alignContent.rawValue,
                style.justifyContent.rawValue,
                
                style.position.left.type,
                style.position.left.value,
                style.position.right.type,
                style.position.right.value,
                style.position.top.type,
                style.position.top.value,
                style.position.bottom.type,
                style.position.bottom.value,
                
                style.margin.left.type,
                style.margin.left.value,
                style.margin.right.type,
                style.margin.right.value,
                style.margin.top.type,
                style.margin.top.value,
                style.margin.bottom.type,
                style.margin.bottom.value,
                
                style.padding.left.type,
                style.padding.left.value,
                style.padding.right.type,
                style.padding.right.value,
                style.padding.top.type,
                style.padding.top.value,
                style.padding.bottom.type,
                style.padding.bottom.value,
                
                style.border.left.type,
                style.border.left.value,
                style.border.right.type,
                style.border.right.value,
                style.border.top.type,
                style.border.top.value,
                style.border.bottom.type,
                style.border.bottom.value,
                
                style.flexGrow,
                style.flexShrink,
                
                style.flexBasis.type,
                style.flexBasis.value,
                
                style.size.width.type,
                style.size.width.value,
                style.size.height.type,
                style.size.height.value,
                
                style.minSize.width.type,
                style.minSize.width.value,
                style.minSize.height.type,
                style.minSize.height.value,
                
                style.maxSize.width.type,
                style.maxSize.width.value,
                style.maxSize.height.type,
                style.maxSize.height.value,
                
                style.flexGap.width.type,
                style.flexGap.width.value,
                style.flexGap.height.type,
                style.flexGap.height.value,
                
                style.aspectRatio ?? Float.nan,
                create_layout
            )
            
            
            
        }else {
            points = mason_node_update_style_with_values_compute_and_layout(
                TSCMason.instance.nativePtr, nativePtr, style.nativePtr,
                style.display.rawValue,
                style.positionType.rawValue,
                style.direction.rawValue,
                style.flexDirection.rawValue,
                style.flexWrap.rawValue,
                style.overflow.rawValue,
                style.alignItems.rawValue,
                style.alignSelf.rawValue,
                style.alignContent.rawValue,
                style.justifyContent.rawValue,
                
                style.position.left.type,
                style.position.left.value,
                style.position.right.type,
                style.position.right.value,
                style.position.top.type,
                style.position.top.value,
                style.position.bottom.type,
                style.position.bottom.value,
                
                style.margin.left.type,
                style.margin.left.value,
                style.margin.right.type,
                style.margin.right.value,
                style.margin.top.type,
                style.margin.top.value,
                style.margin.bottom.type,
                style.margin.bottom.value,
                
                style.padding.left.type,
                style.padding.left.value,
                style.padding.right.type,
                style.padding.right.value,
                style.padding.top.type,
                style.padding.top.value,
                style.padding.bottom.type,
                style.padding.bottom.value,
                
                style.border.left.type,
                style.border.left.value,
                style.border.right.type,
                style.border.right.value,
                style.border.top.type,
                style.border.top.value,
                style.border.bottom.type,
                style.border.bottom.value,
                
                style.flexGrow,
                style.flexShrink,
                
                style.flexBasis.type,
                style.flexBasis.value,
                
                style.size.width.type,
                style.size.width.value,
                style.size.height.type,
                style.size.height.value,
                
                style.minSize.width.type,
                style.minSize.width.value,
                style.minSize.height.type,
                style.minSize.height.value,
                
                style.maxSize.width.type,
                style.maxSize.width.value,
                style.maxSize.height.type,
                style.maxSize.height.value,
                
                style.flexGap.width.type,
                style.flexGap.width.value,
                style.flexGap.height.type,
                style.flexGap.height.value,
                
                style.aspectRatio ?? Float.nan,
                create_layout)
        }
        
        let layout: MasonLayout = Unmanaged.fromOpaque(points!).takeUnretainedValue()
        return layout
    }
    
    func compute() {
        mason_node_compute(TSCMason.instance.nativePtr, nativePtr)
    }
    
    func compute(_ width: Float, _ height: Float) {
        mason_node_compute_wh(TSCMason.instance.nativePtr, nativePtr, width, height)
    }
    
    func computeMaxContent() {
        mason_node_compute_max_content(TSCMason.instance.nativePtr, nativePtr)
    }
    
    func computeMinContent() {
        mason_node_compute_min_content(TSCMason.instance.nativePtr, nativePtr)
    }
    
    func getChildAt(_ index: Int) -> MasonNode? {
        // todo support negative get
        if(index < 0){
            return nil
        }
        
        
        if (TSCMason.shared) {
            let child = mason_node_get_child_at(TSCMason.instance.nativePtr, nativePtr, UInt(index))
            if (child == nil) {
                return nil
            }
            return MasonNode(child!)
        }
        return children[index]
    }
    
    func addChild(_ child: MasonNode) {
        guard let childPtr = child.nativePtr else {
            return
        }
        
        mason_node_add_child(TSCMason.instance.nativePtr, nativePtr, childPtr)
        
        guard let existing = nodes[childPtr] else {
            child.owner = self
            
            children.append(child)
            
            nodes[childPtr] = child
            
            return
        }
        
        existing.owner = self
        
    }
    
    func addChildAt(_ child: MasonNode, _ index: Int) {
        
        if (index == -1) {
            mason_node_add_child(TSCMason.instance.nativePtr, nativePtr, child.nativePtr)
            
            children.append(child)
            
            child.owner = self
            
            guard let childPtr = child.nativePtr else {return}
            
            nodes[childPtr] = child
            
            return
        }
        
        mason_node_add_child_at(TSCMason.instance.nativePtr, nativePtr, child.nativePtr, UInt(index))
        
        guard let childPtr = child.nativePtr else {
            return
        }
        
        
        child.owner = self
        
        children.insert(child, at: index)
        
        nodes[childPtr] = child
    }
    
    
    
    @discardableResult func removeChild(child: MasonNode) -> MasonNode? {
        let removedNode = mason_node_remove_child(TSCMason.instance.nativePtr, nativePtr, child.nativePtr)
        
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
        
        nodes[childPtr] = nil
        
        return child
    }
    
    func removeChildAt(index: Int) -> MasonNode? {
        // TODO handle negative index
        if(index < 0){
            return nil
        }
        guard let removedNode = mason_node_remove_child_at(TSCMason.instance.nativePtr, nativePtr, UInt(index)) else {return nil}
        
        let node = nodes[removedNode]
        
        nodes[removedNode] = nil
        
        guard let node = node else {return nil}
        
        node.owner = nil
        
        guard let index = children.firstIndex(of: node) else {return nil}
        
        return children.remove(at: index)
    }
    
    
    func removeMeasureFunction(){
        mason_node_remove_measure_func(TSCMason.instance.nativePtr, nativePtr)
    }
    
    func setMeasureFunction(_ measureFunc:@escaping MeasureFunc) {
        self.measureFunc = measureFunc
        mason_node_set_measure_func(TSCMason.instance.nativePtr, nativePtr, Unmanaged.passRetained(self).toOpaque(), measure)
    }
    
}
