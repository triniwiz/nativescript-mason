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
    public internal (set) var nativePtr: UnsafeMutableRawPointer!
    
    public typealias MeasureFunc = (CGSize?, CGSize) -> CGSize
    
    internal var measureFunc: MeasureFunc? = nil
    
    public var style: MasonStyle {
        didSet {
            mason_node_set_style(TSCMason.instance.nativePtr, nativePtr, style.nativePtr)
        }
    }
    
    var didInitWithView = false
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
    internal var nodes: [UnsafeMutableRawPointer: MasonNode] = [:]
    
    var inBatch = false
    
    
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
                                TSCMason.instance.nativePtr,
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
                                &gridTemplateColumns
                            )
                        }
                    }
                    
                }
                
            }
            
            
            
            
            
            
            
            
            
            
    
            
            
            style.isDirty = false
        }
        
    }
    
    @discardableResult public func layout() -> MasonLayout {
        
        let points = mason_node_layout(TSCMason.instance.nativePtr,
                                       nativePtr, create_layout)
        
        
        let layout: MasonLayout = Unmanaged.fromOpaque(points!).takeRetainedValue()
        return layout
    }
    
    public var isDirty: Bool {
        return mason_node_dirty(TSCMason.instance.nativePtr, nativePtr)
    }
    
    public func markDirty(){
        mason_node_mark_dirty(TSCMason.instance.nativePtr, nativePtr)
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
                                TSCMason.instance.nativePtr,
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
                                TSCMason.instance.nativePtr, nativePtr, style.nativePtr,
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
                                create_layout)
                            
                        }
                    }
                }
            }
            
            
        }
        
        let layout: MasonLayout = Unmanaged.fromOpaque(points!).takeRetainedValue()
        return layout
    }
    
    public func compute() {
        mason_node_compute(TSCMason.instance.nativePtr, nativePtr)
    }
    
    public func compute(_ width: Float, _ height: Float) {
        mason_node_compute_wh(TSCMason.instance.nativePtr, nativePtr, width, height)
    }
    
    public func computeMaxContent() {
        mason_node_compute_max_content(TSCMason.instance.nativePtr, nativePtr)
    }
    
    public func computeMinContent() {
        mason_node_compute_min_content(TSCMason.instance.nativePtr, nativePtr)
    }
    

    public func computeWithViewSize(){
        guard let view = data as? UIView else{return}
        MasonNode.attachNodesFromView(view)
        compute(Float(view.frame.size.width) * TSCMason.scale, Float(view.frame.size.height) * TSCMason.scale)
        MasonNode.applyToView(view)
    }
    
    public func computeWithMaxContent(){
        guard let view = data as? UIView else{return}
        MasonNode.attachNodesFromView(view)
        compute()
        MasonNode.applyToView(view)
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
    
    func setChildren(_ children: [UnsafeMutableRawPointer]){
        // todo ensure data is set
        mason_node_set_children(TSCMason.instance.nativePtr, nativePtr, children, UInt(children.count))
    }
    
    
    public func setChildren(children: [MasonNode]){
        setChildren(children.map { child in
            child.nativePtr!
        })
        
        self.children.removeAll()
    }
    
    func addChildren(_ children: [UnsafeMutableRawPointer]){
        mason_node_add_children(TSCMason.instance.nativePtr, nativePtr, children, UInt(children.count))
    }
    
    public func addChildren(_ children: [MasonNode]){
        
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
    
    
    func removeAllChildren() {
        mason_node_remove_children(TSCMason.instance.nativePtr, nativePtr)
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
    
    func setMeasureFunction(_ measureFunc: @escaping MeasureFunc) {
        self.measureFunc = measureFunc
        mason_node_set_measure_func(TSCMason.instance.nativePtr, nativePtr, Unmanaged.passRetained(self).toOpaque(), measure)
    }
    
    public var isLeaf: Bool {
        assert(Thread.isMainThread, "This method must be called on the main thread.")
        if(isEnabled){
            guard let view = self.data as? UIView else {return true}
            for subview in view.subviews {
                let mason = subview.mason
                if(mason.isEnabled && mason.didInitWithView){
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
            
            var nodesToInclude = Array<UnsafeMutableRawPointer>()
            nodesToInclude.reserveCapacity(count)
            
            for subview in view.subviews {
                let mason = subview.mason
                if(mason.isEnabled && mason.didInitWithView){
                    subviewsToInclude.append(subview)
                    nodesToInclude.append(mason.nativePtr!)
                }
            }
            
            if(!mason_node_is_children_same(TSCMason.instance.nativePtr, node.nativePtr, &nodesToInclude, UInt(nodesToInclude.count))){
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
        
        if(!mason.didInitWithView){
            return
        }
        
        let layout = mason.layout()
    
        
        let widthIsNan = layout.width.isNaN
        let heightIsNan = layout.height.isNaN
    
        
        let x = CGFloat(layout.x.isNaN ? 0 : layout.x/TSCMason.scale)
        
        let y = CGFloat(layout.y.isNaN ? 0 : layout.y/TSCMason.scale)
        
        var width = CGFloat()
        
        if(widthIsNan && mason.style.size.width.type == MasonDimensionCompatType.Percent.rawValue){
            width = (view.superview?.frame.width ?? 0) * CGFloat(mason.style.size.width.value)
        }else {
            width = CGFloat(widthIsNan ? 0 : layout.width/TSCMason.scale)
        }
        
        
        var height = CGFloat()
        
        
        if(heightIsNan  && mason.style.size.height.type == MasonDimensionCompatType.Percent.rawValue){
            height = (view.superview?.frame.height ?? 0) * CGFloat(mason.style.size.height.value)
        }else {
            height = CGFloat(heightIsNan ? 0 : layout.height/TSCMason.scale)
        }
        
        let point = CGPoint(x: x, y: y)
        
        let size = CGSizeMake(width, height)
        

        view.frame = CGRect(origin: point, size: size)
 
        if (!mason.isLeaf) {
            view.subviews.forEach { subview in
                MasonNode.applyToView(subview)
            }
        }
    }
    
    static func measureFunction(_ view: UIView, _ knownDimensions: CGSize?,_ availableSpace: CGSize) -> CGSize {
        
        let node = view.mason
        
        var size = CGSize.zero
        
        var widthCalculated = false
        var heightCalculated = false
        
        var isWidthPercent = false
        var isHeightPercent = false
        
        // points
        if(node.style.size.width.type == MasonDimensionCompatType.Points.rawValue){
            widthCalculated = true
        }
        
        // percent
        if(node.style.size.width.type == MasonDimensionCompatType.Percent.rawValue){
            widthCalculated = true
            isWidthPercent = true
        }
        
        if(node.style.size.height.type == MasonDimensionCompatType.Points.rawValue){
            heightCalculated = true
        }
        
        if(node.style.size.height.type == MasonDimensionCompatType.Percent.rawValue){
            heightCalculated = true
            isHeightPercent = true
        }
        
        
        let scale = CGFloat(TSCMason.scale)
        
        
        let maxAvailableSpaceWidth = Float(availableSpace.width.isNaN ? ((view.superview?.frame.width ?? 0) * scale) : availableSpace.width)
        
        let maxAvailableSpaceHeight = Float(availableSpace.height.isNaN ? ((view.superview?.frame.height ?? 0) * scale) : availableSpace.height)
        
        let constrainedWidth = !widthCalculated ? CGFLOAT_MAX :
        isWidthPercent ?  CGFloat(
          maxAvailableSpaceWidth * node.style.size.width.value
        )  : CGFloat(node.style.size.width.value)
        
        let constrainedHeight = !heightCalculated ? CGFLOAT_MAX :
        isHeightPercent ?  CGFloat(
            maxAvailableSpaceHeight * node.style.size.height.value
        ) : CGFloat(node.style.size.height.value)
        
        
        if(!node.isUIView || view.subviews.count == 0){
            
            if(isWidthPercent){
                size.width = constrainedWidth
            }
            
            if(isHeightPercent){
                size.height = constrainedHeight
            }

        
            if(isWidthPercent && isHeightPercent){
                return size
            }
            
            if(widthCalculated && heightCalculated){
                return size
            }
            
                    
            size = view.sizeThatFits(CGSizeMake(constrainedWidth, constrainedHeight))
            
            size = CGSize(width: .minimum(size.width * scale, constrainedWidth), height: .minimum(size.height * scale, constrainedHeight))
        
        }else {
            
            guard let knownDimensions = knownDimensions  else {
                if(isWidthPercent){
                    size.width = constrainedWidth
                }
                
                if(isHeightPercent){
                    size.height = constrainedHeight
                }
                
                return size
            }
            
            size.width = knownDimensions.width.isNaN ? 0 : knownDimensions.width
            size.height = knownDimensions.height.isNaN ? 0 : knownDimensions.height
        }
        
        return size
        
    }

    
}
