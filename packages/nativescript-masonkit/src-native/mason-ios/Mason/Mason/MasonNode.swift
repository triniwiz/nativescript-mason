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
    public internal (set) var nativePtr: OpaquePointer?
    
    public typealias MeasureFunc = (CGSize?, CGSize) -> CGSize
    
    internal var measureFunc: MeasureFunc? = nil
    
    public var style: MasonStyle {
        willSet {
            mason_node_set_style(NSCMason.instance.nativePtr, nativePtr, newValue.nativePtr)
        }
    }
    
    public var includeInLayout = false
    var isUIView = false
    public var isEnabled = false
    public var data: AnyObject? = nil {
        didSet {
            guard let data = data else {
                isUIView = false
                return
            }
            isUIView = data.isMember(of: UIView.self)
        }
    }
    public internal (set) var owner: MasonNode? = nil
    public internal (set) var children: [MasonNode] = []
    // todo create weakmap
    internal var nodes: [OpaquePointer?: MasonNode] = [:]
    
    var inBatch = false
    
    
    internal init(_ nativePtr: OpaquePointer) {
        self.nativePtr = nativePtr
        style = MasonStyle()
    }
    
    public override init() {
        style = MasonStyle()
        nativePtr = mason_node_new_node(NSCMason.instance.nativePtr, style.nativePtr)
    }
    
    public init(style: MasonStyle) {
        self.style = style
        nativePtr = mason_node_new_node(NSCMason.instance.nativePtr, style.nativePtr)
    }
    
    public init(style: MasonStyle, children: [MasonNode]) {
        var childrenMap = children.map { node in
            node.nativePtr
        }
        
        nativePtr = mason_node_new_node_with_children(NSCMason.instance.nativePtr, style.nativePtr, &childrenMap, UInt(childrenMap.count))
        
        self.style = style
        self.children = children
        
        super.init()
        
        children.forEach { node in
            node.owner = self
        }
    }
    
    
    public init(style: MasonStyle, measureFunc: @escaping MeasureFunc) {
        self.style = style
        self.measureFunc = measureFunc
        self.nativePtr = nil
        
        super.init()
        
        nativePtr = mason_node_new_node_with_context(NSCMason.instance.nativePtr, style.nativePtr, Unmanaged.passRetained(self).toOpaque(), measure)
        
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
    
    public func updateNodeStyle() {
        if(inBatch){return}
        if (style.isDirty) {
            var gridAutoRows = style.gridAutoRows.map({ minMax in
                minMax.cValue
            })
            
            let gridAutoRowsCount = UInt(gridAutoRows.count)
            
            var gridAutoColumns = style.gridAutoColumns.map({ minMax in
                minMax.cValue
            })
            
            let gridAutoColumnsCount = UInt(gridAutoRows.count)
            
            
            var gridTemplateRows =  style.gridTemplateRows.map { value in
                value.cValue
            }
            
            let gridTemplateRowsCount = UInt(gridTemplateRows.count)
            
            var gridTemplateColumns =  style.gridTemplateColumns.map { value in
                value.cValue
            }
            
            let gridTemplateColumnsCount = UInt(gridTemplateColumns.count)
            
            gridAutoRows.withUnsafeMutableBufferPointer { gridAutoRowsBuffer in
                
                var gridAutoRows = CMasonNonRepeatedTrackSizingFunctionArray()
                
                if(gridAutoRowsCount > 0){
                    gridAutoRows = CMasonNonRepeatedTrackSizingFunctionArray(array: gridAutoRowsBuffer.baseAddress, length: gridAutoRowsCount)
                }
                
                
                gridAutoColumns.withUnsafeMutableBufferPointer { gridAutoColumnsBuffer in
                    
                    var gridAutoColumns = CMasonNonRepeatedTrackSizingFunctionArray()
                    
                    if(gridAutoColumnsCount > 0){
                        gridAutoColumns = CMasonNonRepeatedTrackSizingFunctionArray(array: gridAutoColumnsBuffer.baseAddress, length: gridAutoColumnsCount)
                    }
                    
                    
                    
                    gridTemplateRows.withUnsafeMutableBufferPointer{ gridTemplateRowsBuffer in
                        
                        var gridTemplateRows = CMasonTrackSizingFunctionArray()
                        
                        if(gridTemplateRowsCount > 0){
                            gridTemplateRows = CMasonTrackSizingFunctionArray(array: gridTemplateRowsBuffer.baseAddress, length: gridTemplateRowsCount)
                        }
                        
                        
                        
                        gridTemplateColumns.withUnsafeMutableBufferPointer { gridTemplateColumnsBuffer in
                            
                            var gridTemplateColumns = CMasonTrackSizingFunctionArray()
                            
                            if(gridTemplateColumnsCount > 0){
                                gridTemplateColumns = CMasonTrackSizingFunctionArray(array: gridTemplateColumnsBuffer.baseAddress, length: gridTemplateColumnsCount)
                            }
                            
                            mason_node_update_and_set_style_with_values(
                                NSCMason.instance.nativePtr,
                                nativePtr,
                                style.nativePtr,
                                style.display.rawValue,
                                style.position.rawValue,
                                style.direction.rawValue,
                                style.flexDirection.rawValue,
                                style.flexWrap.rawValue,
                                style.overflow.rawValue,
                                style.alignItems.rawValue,
                                style.alignSelf.rawValue,
                                style.alignContent.rawValue,
                                style.justifyItems.rawValue,
                                style.justifySelf.rawValue,
                                style.justifyContent.rawValue,
                                
                                style.inset.left.type,
                                style.inset.left.value,
                                style.inset.right.type,
                                style.inset.right.value,
                                style.inset.top.type,
                                style.inset.top.value,
                                style.inset.bottom.type,
                                style.inset.bottom.value,
                                
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
                                
                                style.gap.width.type,
                                style.gap.width.value,
                                style.gap.height.type,
                                style.gap.height.value,
                                
                                style.aspectRatio ?? Float.nan,
                                &gridAutoRows,
                                &gridAutoColumns,
                                style.gridAutoFlow.rawValue,
                                style.gridColumn.start.type,
                                style.gridColumn.start.placementValue,
                                style.gridColumn.end.type,
                                style.gridColumn.end.placementValue,
                                
                                style.gridRow.start.type,
                                style.gridRow.start.placementValue,
                                style.gridRow.end.type,
                                style.gridRow.end.placementValue,
                                &gridTemplateRows,
                                &gridTemplateColumns,
                                style.overflowX.rawValue,
                                style.overflowY.rawValue,
                                style.scrollBarWidth.value,
                                style.textAlign.rawValue,
                                style.boxSizing.rawValue
                            )
                        }
                    }
                    
                }
                
            }
            
            style.isDirty = false
        }
        
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
    
    @discardableResult func computeAndLayout(size: MasonSize<Float>? = nil) -> MasonLayout {
        var points: UnsafeMutableRawPointer? = nil
        if (size != nil) {
            
            var gridAutoRows = style.gridAutoRows.map({ minMax in
                minMax.cValue
            })
            
            let gridAutoRowsCount = UInt(gridAutoRows.count)
            
            var gridAutoColumns = style.gridAutoColumns.map({ minMax in
                minMax.cValue
            })
            
            let gridAutoColumnsCount = UInt(gridAutoRows.count)
            
            
            var gridTemplateRows =  style.gridTemplateRows.map { value in
                value.cValue
            }
            
            let gridTemplateRowsCount = UInt(gridTemplateRows.count)
            
            var gridTemplateColumns =  style.gridTemplateColumns.map { value in
                value.cValue
            }
            
            let gridTemplateColumnsCount = UInt(gridTemplateColumns.count)
            
            gridAutoRows.withUnsafeMutableBufferPointer { gridAutoRows in
                
                var gridAutoRows = CMasonNonRepeatedTrackSizingFunctionArray(array: gridAutoRows.baseAddress, length: gridAutoRowsCount)
                
                gridAutoColumns.withUnsafeMutableBufferPointer { gridAutoColumns in
                    
                    var gridAutoColumns = CMasonNonRepeatedTrackSizingFunctionArray(array: gridAutoColumns.baseAddress, length: gridAutoColumnsCount)
                    
                    gridTemplateRows.withUnsafeMutableBufferPointer{ gridTemplateRows in
                        
                        var gridTemplateRows = CMasonTrackSizingFunctionArray(array: gridTemplateRows.baseAddress, length: gridTemplateRowsCount)
                        
                        
                        gridTemplateColumns.withUnsafeMutableBufferPointer { gridTemplateColumns in
                            
                            var gridTemplateColumns = CMasonTrackSizingFunctionArray(array: gridTemplateColumns.baseAddress, length: gridTemplateColumnsCount)
                            
                            
                            points = mason_node_update_style_with_values_size_compute_and_layout(
                                NSCMason.instance.nativePtr,
                                nativePtr,
                                style.nativePtr,
                                size!.width, size!.height,
                                style.display.rawValue,
                                style.position.rawValue,
                                style.direction.rawValue,
                                style.flexDirection.rawValue,
                                style.flexWrap.rawValue,
                                style.overflow.rawValue,
                                style.alignItems.rawValue,
                                style.alignSelf.rawValue,
                                style.alignContent.rawValue,
                                style.justifyItems.rawValue,
                                style.justifySelf.rawValue,
                                style.justifyContent.rawValue,
                                
                                style.inset.left.type,
                                style.inset.left.value,
                                style.inset.right.type,
                                style.inset.right.value,
                                style.inset.top.type,
                                style.inset.top.value,
                                style.inset.bottom.type,
                                style.inset.bottom.value,
                                
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
                                
                                style.gap.width.type,
                                style.gap.width.value,
                                style.gap.height.type,
                                style.gap.height.value,
                                
                                style.aspectRatio ?? Float.nan,
                                &gridAutoRows,
                                &gridAutoColumns,
                                style.gridAutoFlow.rawValue,
                                style.gridColumn.start.type,
                                style.gridColumn.start.placementValue,
                                style.gridColumn.end.type,
                                style.gridColumn.end.placementValue,
                                
                                style.gridRow.start.type,
                                style.gridRow.start.placementValue,
                                style.gridRow.end.type,
                                style.gridRow.end.placementValue,
                                &gridTemplateRows,
                                &gridTemplateColumns,
                                style.overflowX.rawValue,
                                style.overflowY.rawValue,
                                style.scrollBarWidth.value,
                                style.textAlign.rawValue,
                                style.boxSizing.rawValue,
                                create_layout
                            )
                            
                            
                        }
                    }
                }
            }
            
            
        }else {
            
            var gridAutoRows = style.gridAutoRows.map({ minMax in
                minMax.cValue
            })
            
            let gridAutoRowsCount = UInt(gridAutoRows.count)
            
            var gridAutoColumns = style.gridAutoColumns.map({ minMax in
                minMax.cValue
            })
            
            let gridAutoColumnsCount = UInt(gridAutoRows.count)
            
            
            var gridTemplateRows =  style.gridTemplateRows.map { value in
                value.cValue
            }
            
            let gridTemplateRowsCount = UInt(gridTemplateRows.count)
            
            var gridTemplateColumns =  style.gridTemplateColumns.map { value in
                value.cValue
            }
            
            let gridTemplateColumnsCount = UInt(gridTemplateColumns.count)
            
            gridAutoRows.withUnsafeMutableBufferPointer { gridAutoRows in
                
                var gridAutoRows = CMasonNonRepeatedTrackSizingFunctionArray(array: gridAutoRows.baseAddress, length: gridAutoRowsCount)
                
                gridAutoColumns.withUnsafeMutableBufferPointer { gridAutoColumns in
                    
                    var gridAutoColumns = CMasonNonRepeatedTrackSizingFunctionArray(array: gridAutoColumns.baseAddress, length: gridAutoColumnsCount)
                    
                    gridTemplateRows.withUnsafeMutableBufferPointer{ gridTemplateRows in
                        
                        var gridTemplateRows = CMasonTrackSizingFunctionArray(array: gridTemplateRows.baseAddress, length: gridTemplateRowsCount)
                        
                        
                        gridTemplateColumns.withUnsafeMutableBufferPointer { gridTemplateColumns in
                            
                            var gridTemplateColumns = CMasonTrackSizingFunctionArray(array: gridTemplateColumns.baseAddress, length: gridTemplateColumnsCount)
                            
                            
                            points = mason_node_update_style_with_values_compute_and_layout(
                                NSCMason.instance.nativePtr, nativePtr, style.nativePtr,
                                style.display.rawValue,
                                style.position.rawValue,
                                style.direction.rawValue,
                                style.flexDirection.rawValue,
                                style.flexWrap.rawValue,
                                style.overflow.rawValue,
                                style.alignItems.rawValue,
                                style.alignSelf.rawValue,
                                style.alignContent.rawValue,
                                style.justifyItems.rawValue,
                                style.justifySelf.rawValue,
                                style.justifyContent.rawValue,
                                
                                style.inset.left.type,
                                style.inset.left.value,
                                style.inset.right.type,
                                style.inset.right.value,
                                style.inset.top.type,
                                style.inset.top.value,
                                style.inset.bottom.type,
                                style.inset.bottom.value,
                                
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
                                
                                style.gap.width.type,
                                style.gap.width.value,
                                style.gap.height.type,
                                style.gap.height.value,
                                
                                style.aspectRatio ?? Float.nan,
                                &gridAutoRows,
                                &gridAutoColumns,
                                style.gridAutoFlow.rawValue,
                                style.gridColumn.start.type,
                                style.gridColumn.start.placementValue,
                                style.gridColumn.end.type,
                                style.gridColumn.end.placementValue,
                                
                                style.gridRow.start.type,
                                style.gridRow.start.placementValue,
                                style.gridRow.end.type,
                                style.gridRow.end.placementValue,
                                &gridTemplateRows,
                                &gridTemplateColumns,
                                style.overflowX.rawValue,
                                style.overflowY.rawValue,
                                style.scrollBarWidth.value,
                                style.textAlign.rawValue,
                                style.boxSizing.rawValue,
                                create_layout)
                            
                        }
                    }
                }
            }
            
            
        }
        
        let layout: MasonLayout = Unmanaged.fromOpaque(points!).takeRetainedValue()
        return layout
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
        // todo support negative get
        if(index < 0){
            return nil
        }
        
        
        if (NSCMason.shared) {
            let child = mason_node_get_child_at(NSCMason.instance.nativePtr, nativePtr, UInt(index))
            if (child == nil) {
                return nil
            }
            return MasonNode(child!)
        }
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
        
        mason_node_add_child(NSCMason.instance.nativePtr, nativePtr, childPtr)
        
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
            mason_node_add_child(NSCMason.instance.nativePtr, nativePtr, child.nativePtr)
            
            children.append(child)
            
            child.owner = self
            
            guard let childPtr = child.nativePtr else {return}
            
            nodes[childPtr] = child
            
            return
        }
        
        mason_node_add_child_at(NSCMason.instance.nativePtr, nativePtr, UnsafeMutableRawPointer(child.nativePtr), UInt(index))
        
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
        
        nodes[childPtr] = nil
        
        return child
    }
    
    
    func removeAllChildren() {
        mason_node_remove_children(NSCMason.instance.nativePtr, nativePtr)
        children.forEach { child in
            child.owner = nil
            nodes[child.nativePtr] = nil
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
        updateNodeStyle()
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
                
        var widthIsNan = knownDimensions?.width.isNaN ?? true
        var heightIsNan = knownDimensions?.height.isNaN ?? true
        
        if(!widthIsNan && !heightIsNan){
            return knownDimensions!
        }
        
        var size: CGSize = .zero
        
        let scale = CGFloat(NSCMason.scale)
        
        
        let widthIsZero = node.style.size.width.isZero
        let heightIsZero = node.style.size.height.isZero
        
        
        if(widthIsZero && heightIsZero){
            return size
        }
        

        if (widthIsNan || knownDimensions!.width.isZero && !widthIsZero) {
            switch(node.style.size.width){
            case .Points(let value):
                size.width = CGFloat(value)
                if(!size.width.isNaN){
                    widthIsNan = false
                }
            case .Percent(let value):
                let parentView = node.owner?.data as? UIView
                if(parentView != nil){
                    size.width = (parentView!.frame.size.width.isNaN ? 0 : parentView!.frame.size.width * CGFloat(value)) * scale
                    widthIsNan = false
                }else {
                    let root = view.rootView
                    if(root != nil){
                        size.width = (root!.frame.size.width.isNaN ? 0 : root!.frame.size.width * CGFloat(value)) * scale
                        widthIsNan = false
                    }
                }
                if(size.width.isNaN || size.width.isZero){
                    let parentLayout = node.owner?.layout()
                    if(parentLayout != nil){
                        size.width = CGFloat(parentLayout?.width.isNaN ?? true ? 0 : parentLayout!.width * value)  * scale
                        widthIsNan = false
                    }
                }
            default:
                // noop
                break
            }
        }
        
        if (heightIsNan || knownDimensions!.height.isZero && !heightIsZero) {
            switch(node.style.size.height){
            case .Points(let value):
                size.height = CGFloat(value)
                if(!size.height.isNaN){
                    heightIsNan = false
                }
            case .Percent(let value):
                let parentView = node.owner?.data as? UIView
                if(parentView != nil){
                    size.height = (parentView!.frame.size.height.isNaN ? 0 : parentView!.frame.size.height * CGFloat(value)) * scale
                    heightIsNan = false
                }else {
                    let root = view.rootView
                    if(root != nil){
                        size.height = (root!.frame.size.height.isNaN ? 0 : root!.frame.size.height * CGFloat(value)) * scale
                        heightIsNan = false
                    }
                }
                if(size.height.isNaN || size.height.isZero){
                    let parentLayout = node.owner?.layout()
                    if(parentLayout != nil){
                        size.height = CGFloat(parentLayout?.height.isNaN ?? true ? 0 : parentLayout!.height * value)  * scale
                        heightIsNan = false
                    }
                }
                
            default:
                // noop
                break
            }
        }
        
        if(!widthIsNan && !widthIsZero && !heightIsNan && heightIsZero){
            return size
        }
        
        
        var widthMode: MeasureMode = .Definite
        var heightMode: MeasureMode = .Definite
        
        
        var widthConstraint: CGFloat = 0
        var heightConstraint: CGFloat = 0
        
        if(widthIsNan || !widthIsZero){
            if(availableSpace.width == -1){
                widthMode = .Min
                widthConstraint = CGFLOAT_MAX
            }else if(availableSpace.width == -2){
                widthMode = .Max
                widthConstraint = CGFLOAT_MAX
            }else {
                widthConstraint = availableSpace.width / scale
            }
        }else {
            widthConstraint = knownDimensions!.width / scale
        }
        
        
        if(heightIsNan || !heightIsZero){
            if(availableSpace.height == -1){
                heightMode = .Min
                heightConstraint = CGFLOAT_MAX
            }else if(availableSpace.height == -2){
                heightMode = .Max
                heightConstraint = CGFLOAT_MAX
            }else {
                heightConstraint = availableSpace.height / scale
            }
        }else {
            heightConstraint = knownDimensions!.height / scale
        }
        
    
        
        
        if(!node.isUIView || view.subviews.count > 0){
            
            let fits = view.sizeThatFits(CGSizeMake(widthConstraint, heightConstraint))
            
            switch(widthMode){
            case .Min:
                size.width = .minimum(fits.width, widthConstraint) * scale
            case .Max:
                size.width = fits.width * scale
            case .Definite:
                size.width = widthConstraint * scale
            }
            
            
            switch(heightMode){
            case .Min:
                size.height = .minimum(fits.height, heightConstraint) * scale
            case .Max:
                size.height = fits.height * scale
            case .Definite:
                size.height = heightConstraint * scale
            }
            
        }
        
        
        return size
        
    }
    
    
}
