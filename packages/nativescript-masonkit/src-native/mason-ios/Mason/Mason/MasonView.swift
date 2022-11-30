//
//  MasonView.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Foundation

@objc(MasonView)
public class MasonView: UIView {
    let node = MasonNode()
    
    public override init(frame: CGRect) {
        super.init(frame: frame)
        autoresizesSubviews = false
        translatesAutoresizingMaskIntoConstraints = true
        
        node.data = self
        node.setMeasureFunction { [self] knownDimensions,availableSpace in
            return measure(node, knownDimensions, availableSpace)
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    internal var nodes: [UIView: MasonNode] = [:]
    
    static internal var nodesRef: [UIView?: MasonNode?] = [:]
    
    public var style: MasonStyle {
        get{
            return node.style
        }
        set {
            node.style = newValue
            node.updateNodeStyle()
        }
    }
    
    
    public override func layoutSubviews() {
        
        if((superview as? MasonView) == nil){
            
            var layout: MasonLayout
            if(frame.size.width > 0 && frame.size.height > 0){
                style.size = MasonSize(MasonDimension.Points(Float(frame.size.width) * TSCMason.scale), MasonDimension.Points(Float(frame.size.height) * TSCMason.scale))
                
                node.updateNodeStyle()
                
                layout = node.computeAndLayout()
            }else {
                let size = superview!.frame.size
                
                let width = Float(size.width) * TSCMason.scale
                let height = Float(size.height) * TSCMason.scale
                style.size = MasonSize(MasonDimension.Points(width), MasonDimension.Points(height))
                
                layout = node.computeAndLayout(size: MasonSize(width , height))
                
            }
            
            let x = Int(layout.x.isNaN ? 0: layout.x / TSCMason.scale)
            let y = Int(layout.y.isNaN ? 0: layout.y / TSCMason.scale)
            let width = Int(layout.width.isNaN ? 0: layout.width / TSCMason.scale)
            let height = Int(layout.height.isNaN ? 0: layout.height / TSCMason.scale)
            
            frame = CGRect(x: x, y: y, width: width, height: height)
            
            subviews.forEach { view in
                var node: MasonNode
                if((view as? MasonView) != nil){
                    node = (view as! MasonView).node
                }else {
                    node = nodeForView(view: view)
                }
                let layout = node.layout()
                
                if(layout.width.isNaN && layout.height.isNaN){
                    
                }else {
                    
                    let x = Int(layout.x.isNaN ? 0 : layout.x/TSCMason.scale)
                    
                    let y = Int(layout.y.isNaN ? 0 : layout.y/TSCMason.scale)
                    
                    
                    let size = CGSize.zero
                    
                    let constrainedWidth = node.style.size.width.type == MasonDimension.Undefined.type ? CGFLOAT_MAX : CGFloat(node.style.size.width.value)
                    
                    let constrainedHeight = node.style.size.height.type == MasonDimension.Undefined.type ? CGFLOAT_MAX : CGFloat(node.style.size.height.value)
                    
                    
                    var height = 0
                    
                    var width = 0
                    
                    if(layout.width.isNaN){
                        
                        width = Int(view.superview?.frame.width ?? 0)
                        
                        height = Int(layout.height / TSCMason.scale)
                        
                        if(view.subviews.isEmpty){
                            view.sizeThatFits(CGSizeMake(CGFLOAT_MAX,CGFLOAT_MAX))
                        }
                    }else {
                        width =  Int(layout.width / TSCMason.scale)
                        
                        height = Int(view.superview?.frame.height ?? 0)
                        
                        if(view.subviews.isEmpty){
                            view.sizeThatFits(CGSizeMake(CGFLOAT_MAX,CGFLOAT_MAX))
                        }
                    }
                    
                    view.frame = CGRect(x: x, y: y, width: width, height: height)
                    
                }
                
            }
            
        }else {
            subviews.forEach { view in
                let layout = node.layout()
                view.frame = CGRect(x: Int(layout.x/TSCMason.scale), y: Int(layout.y/TSCMason.scale), width: Int(layout.width/TSCMason.scale), height: Int(layout.height/TSCMason.scale))
            }
            
        }
    }
    
    public func nodeForView(view: UIView) -> MasonNode {
        // TODO evaluate
        
        let refNode = MasonView.nodesRef[view]
        
        var node: MasonNode
        
        if(refNode == nil){
            node = MasonNode()
            node.data = view
            nodes[view] = node
            MasonView.nodesRef[view] = node
            return node
        }
        
        guard let node = refNode else {
            node = MasonNode()
            node.data = view
            nodes[view] = node
            MasonView.nodesRef[view] = node
            return node
        }
        
        return node!
    }
    
    internal func measure(_ node: MasonNode, _ knownDimensions: CGSize?,_ availableSpace: CGSize) -> CGSize {
        guard let view = node.data as? UIView else {
            return .zero
        }
        
        guard let knownDimensions else {
            if (view.frame.size == .zero){
                if(view.subviews.isEmpty){
                    view.sizeThatFits(CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX))
                }
                return CGSizeMake(view.frame.size.width * CGFloat(TSCMason.scale), view.frame.size.height * CGFloat(TSCMason.scale))
            }
            return .zero
        }
        
        
        if(knownDimensions.width.isNaN && knownDimensions.height.isNaN){
            var width = knownDimensions.width
            var height = knownDimensions.height
            
            
            if(width.isNaN && style.size.width.type == MasonDimension.Auto.type){
                width = availableSpace.width
            }
            
            if(height.isNaN && style.size.height.type == MasonDimension.Auto.type){
                height = availableSpace.height
            }
            
            
            return CGSizeMake(CGFloat(width), CGFloat(height))
        }
        
        if(knownDimensions.width > 0 && knownDimensions.height > 0){
            return knownDimensions
        }
        
        if(knownDimensions.width.isNaN){
            if(view.subviews.isEmpty){
                let ret = view.sizeThatFits(CGSizeMake(0, knownDimensions.height/CGFloat(TSCMason.scale)))
                if(ret.width > 0 && ret.height > 0){
                    return CGSizeMake(ret.width * CGFloat(TSCMason.scale), ret.height * CGFloat(TSCMason.scale))
                }
            }
            return knownDimensions
        }
        
        if(knownDimensions.height.isNaN){
            if(view.subviews.isEmpty){
                let ret = view.sizeThatFits(CGSizeMake(knownDimensions.width/CGFloat(TSCMason.scale), 0))
                
                if(ret.width > 0 && ret.height > 0){
                    return CGSizeMake(ret.width * CGFloat(TSCMason.scale), ret.height * CGFloat(TSCMason.scale))
                }
                
            }
        
            return knownDimensions
        }
        
        return CGSize(width: CGFloat.nan, height: CGFloat.nan)
    }
    
    
    internal func addChildAt(_ child: UIView, _ index: Int){
        guard nodes[child] != nil else {
            
            var childNode: MasonNode
            
            if (child is MasonView) {
                childNode = (child as! MasonView).node
            } else {
                if (nodes[child] != nil) {
                    childNode = nodes[child]!
                } else {
                    childNode = MasonNode()
                }
                
                childNode.data = child
                
                
                childNode.setMeasureFunction { knownDimensions,availableSpace in
                    return self.measure(childNode, knownDimensions, availableSpace)
                }
            }
            
            nodes[child] = childNode
            
            
            if (index == -1) {
                node.addChild(childNode)
            } else {
                node.addChildAt(childNode, index)
            }
            childNode.owner = node
            return
        }
    }
    
    
    
    
    public override func addSubview(_ view: UIView) {
        node.removeMeasureFunction()
        super.addSubview(view)
        addChildAt(view, -1)
    }
    
    public override func insertSubview(_ view: UIView, at index: Int) {
        super.insertSubview(view, at: index)
        addChildAt(view, index)
    }
    
    public override func removeFromSuperview() {
        super.removeFromSuperview()
        node.removeChild(child: node)
    }
}
