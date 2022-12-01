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
    
    internal var didInitWithView = false
    internal var isUIView = false
    public var isEnabled = false
    public var data: Any? = nil
    public internal (set) var owner: MasonNode? = nil
    public internal (set) var children: [MasonNode] = []
    // todo create weakmap
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
    
    deinit {
        mason_node_destroy(nativePtr)
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
    

    public func computeWithViewSize(){
        guard let view = data as? UIView else{return}
        MasonNode.attachNodesFromView(view)
        compute(Float(view.frame.size.width) * TSCMason.scale, Float(view.frame.size.height) * TSCMason.scale)
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
        block(self)
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
        
        let x = CGFloat(layout.x.isNaN ? 0 : layout.x/TSCMason.scale)
        
        let y = CGFloat(layout.y.isNaN ? 0 : layout.y/TSCMason.scale)
        
        let width = CGFloat(layout.width.isNaN ? 0 : layout.width/TSCMason.scale)
        
        let height = CGFloat(layout.height.isNaN ? 0 : layout.height/TSCMason.scale)
        
        let point = CGPoint(x: x, y: y)
        
        let size = CGSizeMake(width, height)
    
        view.frame =  CGRect(origin: point, size: size)
        
        if (!mason.isLeaf) {
            view.subviews.forEach { subview in
                MasonNode.applyToView(subview)
            }
        }
    }
    
    static func measureFunction(_ view: UIView, _ knownDimensions: CGSize?,_ availableSpace: CGSize) -> CGSize {
        
        let node = view.mason
        
        var size = CGSize.zero
        
        let constrainedWidth = node.style.size.width.type == MasonDimension.Undefined.type ? CGFLOAT_MAX : CGFloat(node.style.size.width.value / TSCMason.scale)
        
        let constrainedHeight = node.style.size.height.type == MasonDimension.Undefined.type ? CGFLOAT_MAX : CGFloat(node.style.size.height.value / TSCMason.scale)
        
        
        if(view.subviews.count < 0){
            size = view.sizeThatFits(CGSizeMake(constrainedWidth, constrainedHeight))
            size = CGSize(width: .minimum(size.width, constrainedWidth), height: .minimum(size.height, constrainedHeight))
        }else {
            guard let knownDimensions = knownDimensions  else {return size}
            
            size.width = knownDimensions.width.isNaN ? 0 : knownDimensions.width / CGFloat(TSCMason.scale)
            size.height = knownDimensions.height.isNaN ? 0 : knownDimensions.height / CGFloat(TSCMason.scale)
        }
        
        print(size)
        
        return size
        
    }

    
}
