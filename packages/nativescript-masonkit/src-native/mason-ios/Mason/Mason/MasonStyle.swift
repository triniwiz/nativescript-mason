//
//  MasonStyle.swift
//  Mason
//
//  Created by Osei Fortune on 28/11/2022.
//

import Foundation

@objc(MasonStyle)
@objcMembers
public class MasonStyle: NSObject {
    internal var isDirty: Bool = false
    
    var nativePtr: UnsafeMutableRawPointer!
    
    public override init() {
        nativePtr = mason_style_init()
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
    
    public var margin: MasonRect<MasonDimension> =
    MasonRect(MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
    }
    
    public var padding: MasonRect<MasonDimension> =
    MasonRect(MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
    }
    
    public var border: MasonRect<MasonDimension> =
    MasonRect(MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
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
    
    public var size: MasonSize<MasonDimension> = MasonSize(MasonDimension.Auto , MasonDimension.Auto) {
        didSet {
            isDirty = true
        }
    }
    
    public var minSize: MasonSize<MasonDimension> = MasonSize(MasonDimension.Auto , MasonDimension.Auto) {
        didSet {
            isDirty = true
        }
    }
    
    public var maxSize: MasonSize<MasonDimension> = MasonSize(MasonDimension.Auto , MasonDimension.Auto) {
        didSet {
            isDirty = true
        }
    }
    
    public var flexGap: MasonSize<MasonDimension> = MasonSize(MasonDimension.Undefined, MasonDimension.Undefined){
        didSet {
            isDirty = true
        }
    }
    
    public var aspectRatio: Float? = nil{
        didSet {
            isDirty = true
        }
    }
}
