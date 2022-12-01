//
//  MasonStyle.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation


private func getDimension(_ value: Float,_ type: Int) -> MasonDimension? {
    switch (type) {
    case 0: return .Points(value)
    case 1: return .Percent(value)
    case 2: return .Undefined
    case 3: return .Auto
    default:
        return nil
    }
}

@objc(MasonStyle)
@objcMembers
public class MasonStyle: NSObject {
    internal var isDirty: Bool = false
    
    public internal (set) var nativePtr: UnsafeMutableRawPointer!

    
    public override init() {
        nativePtr = mason_style_init()
    }
    
    deinit {
        mason_style_destroy(nativePtr)
    }
    
    
    public var display: Display =  Display.Flex {
        didSet {
            isDirty = true
        }
    }
    
    public var positionType: PositionType = PositionType.Relative{
        didSet {
            isDirty = true
        }
    }
    
    
    // TODO
    public var direction: Direction = Direction.Inherit{
        didSet {
            isDirty = true
        }
    }
    
    public var flexDirection: FlexDirection = FlexDirection.Row{
        didSet {
            isDirty = true
        }
    }
    
    public var flexWrap: FlexWrap = FlexWrap.NoWrap{
        didSet {
            isDirty = true
        }
    }
    
    public var overflow: Overflow = Overflow.Hidden{
        didSet {
            isDirty = true
        }
    }
    
    public var alignItems: AlignItems = AlignItems.Stretch{
        didSet {
            isDirty = true
        }
    }
    
    public var alignSelf: AlignSelf = AlignSelf.Auto{
        didSet {
            isDirty = true
        }
    }
    
    public var alignContent: AlignContent = AlignContent.FlexStart{
        didSet {
            isDirty = true
        }
    }
    
    public var justifyContent: JustifyContent = JustifyContent.FlexStart{
        didSet {
            isDirty = true
        }
    }
    
    public var position: MasonRect<MasonDimension> =
    MasonRect(MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
    }
    
    public var positionCompat: MasonRectCompat {
        get {
            guard let position = position.compat else {
                let compat = MasonRectCompat(position)
                position.compat = compat
                return compat
            }
            
            return position
        }
        set {
            position = newValue.intoMasonRect()
        }
    }
    
    
    public func setPositionLeft(_ value: Float, _ type: Int) {
        guard let left = getDimension(value, type) else {return}
        
        position = MasonRect(left, position.right, position.top, position.bottom)
    }
    
    public func setPositionRight(_ value: Float, _ type: Int) {
        guard let right = getDimension(value, type) else {return}
        
        position = MasonRect(position.left, right, position.top, position.bottom)
    }
    
    public func setPositionTop(_ value: Float, _ type: Int) {
        guard let top = getDimension(value, type) else {return}
        
        position = MasonRect(position.left, position.right, top, position.bottom)
    }
    
    public func setPositionBottom(_ value: Float, _ type: Int) {
        guard let bottom = getDimension(value, type) else {return}
        position = MasonRect(position.left, position.right, position.top, bottom)
    }
    
    public func setPositionWithValueType(_ value: Float, _ type: Int) {
        guard let position = getDimension(value, type) else {return}
        
        self.position = MasonRect(position, position, position, position)
    }
    
    
    public var margin: MasonRect<MasonDimension> =
    MasonRect(MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
    }
    
    
    public var marginCompat: MasonRectCompat {
        get {
            guard let margin = margin.compat else {
                let compat = MasonRectCompat(margin)
                margin.compat = compat
                return compat
            }
            
            return margin
        }
        
        set {
            margin = newValue.intoMasonRect()
        }
    }
    
    public func setMarginLeft(_ value: Float, _ type: Int) {
        guard let left = getDimension(value, type) else {return}
        
        margin = MasonRect(left, margin.right, margin.top, margin.bottom)
    }
    
    public func setMarginRight(_ value: Float, _ type: Int) {
        guard let right = getDimension(value, type) else {return}
        
        margin = MasonRect(margin.left, right, margin.top, margin.bottom)
    }
    
    public func setMarginTop(_ value: Float, _ type: Int) {
        guard let top = getDimension(value, type) else {return}
        
        margin = MasonRect(margin.left, margin.right, top, margin.bottom)
    }
    
    public func setMarginBottom(_ value: Float, _ type: Int) {
        guard let bottom = getDimension(value, type) else {return}
        margin = MasonRect(margin.left, margin.right, margin.top, bottom)
    }
    
    public func setMarginWithValueType(_ value: Float, _ type: Int) {
        guard let margin = getDimension(value, type) else {return}
        
        self.margin = MasonRect(margin, margin, margin, margin)
    }
    
    
    public var padding: MasonRect<MasonDimension> =
    MasonRect(MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
    }
    
    
    public var paddingCompat: MasonRectCompat {
        get {
            guard let padding = padding.compat else {
                let compat = MasonRectCompat(padding)
                padding.compat = compat
                return compat
            }
            
            return padding
        }
        
        set {
            padding = newValue.intoMasonRect()
        }
    }
    
    
    public func setPaddingLeft(_ value: Float, _ type: Int) {
        guard let left = getDimension(value, type) else {return}
        
        padding = MasonRect(left, padding.right, padding.top, padding.bottom)
    }
    
    public func setPaddingRight(_ value: Float, _ type: Int) {
        guard let right = getDimension(value, type) else {return}
        
        padding = MasonRect(padding.left, right, padding.top, padding.bottom)
    }
    
    public func setPaddingTop(_ value: Float, _ type: Int) {
        guard let top = getDimension(value, type) else {return}
        
        padding = MasonRect(padding.left, padding.right, top, padding.bottom)
    }
    
    public func setPaddingBottom(_ value: Float, _ type: Int) {
        guard let bottom = getDimension(value, type) else {return}
        padding = MasonRect(padding.left, padding.right, padding.top, bottom)
    }
    
    public func setPaddingWithValueType(_ value: Float, _ type: Int) {
        guard let padding = getDimension(value, type) else {return}
        
        self.padding = MasonRect(padding, padding, padding, padding)
    }
    
    
    public var border: MasonRect<MasonDimension> =
    MasonRect(MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
    }
    
    public var borderCompat: MasonRectCompat {
        get {
            guard let border = border.compat else {
                let compat = MasonRectCompat(border)
                border.compat = compat
                return compat
            }
            
            return border
        }
        
        set {
            border = newValue.intoMasonRect()
        }
    }
    
    public func setBorderLeft(_ value: Float, _ type: Int) {
        guard let left = getDimension(value, type) else {return}
        
        padding = MasonRect(left, padding.right, padding.top, padding.bottom)
    }
    
    public func setBorderRight(_ value: Float, _ type: Int) {
        guard let right = getDimension(value, type) else {return}
        
        padding = MasonRect(padding.left, right, padding.top, padding.bottom)
    }
    
    public func setBorderTop(_ value: Float, _ type: Int) {
        guard let top = getDimension(value, type) else {return}
        
        padding = MasonRect(padding.left, padding.right, top, padding.bottom)
    }
    
    public func setBorderBottom(_ value: Float, _ type: Int) {
        guard let bottom = getDimension(value, type) else {return}
        padding = MasonRect(padding.left, padding.right, padding.top, bottom)
    }
    
    public func setBorderWithValueType(_ value: Float, _ type: Int) {
        guard let padding = getDimension(value, type) else {return}
        
        self.padding = MasonRect(padding, padding, padding, padding)
    }
    
    
    public var flexGrow: Float = 0 {
        didSet {
            isDirty = true
        }
    }
    
    public var flexShrink: Float = 1 {
        didSet {
            isDirty = true
        }
    }
    
    public var flexBasis = MasonDimension.Auto {
        didSet {
            isDirty = true
        }
    }
    
    
    public var minSize: MasonSize<MasonDimension> = MasonSize(MasonDimension.Auto , MasonDimension.Auto) {
        didSet {
            isDirty = true
        }
    }
    
    
    public var minSizeCompat: MasonSizeCompat {
        get {
            guard let minSize = minSize.compat else {
                let compat = MasonSizeCompat(minSize)
                minSize.compat = compat
                return compat
            }
            
            return minSize
        }
        
        set {
            minSize = newValue.intoMasonSize()
        }
    }
    
    public func setMinSizeWidth(_ value: Float, _ type: Int) {
        guard let width = getDimension(value, type) else {return}
        
        minSize = MasonSize(width, minSize.height)
    }
    
    public func setMinSizeHeight(_ value: Float, _ type: Int) {
        guard let height = getDimension(value, type) else {return}
        minSize = MasonSize(minSize.width, height)
    }
    
    
    public var size: MasonSize<MasonDimension> = MasonSize(MasonDimension.Auto , MasonDimension.Auto) {
        didSet {
            isDirty = true
        }
    }
    
    public var sizeCompat: MasonSizeCompat {
        get {
            guard let size = size.compat else {
                let compat = MasonSizeCompat(size)
                size.compat = compat
                return compat
            }
            
            return size
        }
        
        set {
            size = newValue.intoMasonSize()
        }
    }
    
    public func setSizeWidth(_ value: Float, _ type: Int) {
        guard let width = getDimension(value, type) else {return}
        
        size = MasonSize(width, size.height)
    }
    
    public func setSizeHeight(_ value: Float, _ type: Int) {
        guard let height = getDimension(value, type) else {return}
        
        size = MasonSize(size.width, height)
    }
    
    
    public var maxSize: MasonSize<MasonDimension> = MasonSize(MasonDimension.Auto , MasonDimension.Auto) {
        didSet {
            isDirty = true
        }
    }
    
    public var maxSizeCompat: MasonSizeCompat {
        get {
            guard let maxSize = maxSize.compat else {
                let compat = MasonSizeCompat(maxSize)
                maxSize.compat = compat
                return compat
            }
            
            return maxSize
        }
        
        set {
            maxSize = newValue.intoMasonSize()
        }
    }
    
    
    public func setMaxSizeWidth(_ value: Float, _ type: Int) {
        guard let width = getDimension(value, type) else {return}
        
        maxSize = MasonSize(width, maxSize.height)
    }
    
    public func setMaxSizeHeight(_ value: Float, _ type: Int) {
        guard let height = getDimension(value, type) else {return}
        maxSize = MasonSize(maxSize.width, height)
    }
    
    
    public var flexGap: MasonSize<MasonDimension> = MasonSize(MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
    }
    
    
    public var flexGapCompat: MasonSizeCompat {
        get {
            guard let flexGap = flexGap.compat else {
                let compat = MasonSizeCompat(flexGap)
                flexGap.compat = compat
                return compat
            }
            
            return flexGap
        }
        
        set {
            flexGap = newValue.intoMasonSize()
        }
    }
    
    public func setFlexGapWidth(_ value: Float, _ type: Int) {
        guard let width = getDimension(value, type) else {return}
        
        flexGap = MasonSize(width, flexGap.height)
    }
    
    public func setFlexGapHeight(_ value: Float, _ type: Int) {
        guard let height = getDimension(value, type) else {return}
        flexGap = MasonSize(flexGap.width, height)
    }
    
    
    public var aspectRatio: Float? = nil{
        didSet {
            isDirty = true
        }
    }
}
