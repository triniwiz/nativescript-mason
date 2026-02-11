//
//  MasonList.swift
//  Mason
//
//  Created by Osei Fortune on 22/01/2026.
//

import UIKit



@objc(MasonList)
@objcMembers
public class MasonList: UIView,MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener, UICollectionViewDataSource, UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
  
  public var delegate: MasonListDelegate?
  
  @objc(MasonListDelegate)
  public protocol MasonListDelegate {
    func list(_ list: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell
    func list(_ list: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath)
  }
  
  public class MasonListCell: UICollectionViewCell {
    public var willMove: ((MasonListCell) -> Void)?
    public var view: MasonElement? = nil
    private var cachedSized: CGSize? = nil
    private var cachedWidth: CGFloat = 0
    private var appliedLayoutHash: Int = 0
    internal var index: IndexPath? = nil
    
    public static func initWithEmptyBackground() -> MasonListCell {
      let cell = MasonListCell()
      cell.backgroundColor = .clear
      return cell
    }
    
    public override func willMove(toSuperview newSuperview: UIView?) {
      willMove?(self)
    }
    
    public override func prepareForReuse() {
      super.prepareForReuse()
      
      cachedSized = nil
      cachedWidth = 0
      index = nil
      
      if let view = view {
        view.node.computedLayout = MasonLayout.zero
        view.setComputeCache(.init(width: -2, height: -2))
        
        // Reset MasonLi specific state
        if let li = view as? MasonLi {
          li.resetForRecycle()
        }
      }
      
      contentView.subviews.forEach { $0.removeFromSuperview() }
      
      view = nil
      willMove = nil
    }
    
    internal var collectionView: UICollectionView? {
      get {
        return  superview as? UICollectionView
        ?? superview?.superview as? UICollectionView
      }
    }
    
    public override func preferredLayoutAttributesFitting(_ layoutAttributes: UICollectionViewLayoutAttributes) -> UICollectionViewLayoutAttributes {
      let attrs = super.preferredLayoutAttributesFitting(layoutAttributes)
      
      guard let view = view else {
        return attrs
      }
      
      guard
        let collectionView =
          superview as? UICollectionView
          ?? superview?.superview as? UICollectionView
      else {
        return attrs
      }
      
      let flowLayout = collectionView.collectionViewLayout as? UICollectionViewFlowLayout
      let sectionInset = flowLayout?.sectionInset ?? .zero
      let contentInset = collectionView.adjustedContentInset
      
      let availableWidth =
      collectionView.bounds.width
      - contentInset.left - contentInset.right
      - sectionInset.left - sectionInset.right
      
      
      guard availableWidth > 0 else { return attrs }
      
      if let cached = cachedSized, cachedWidth == availableWidth {
        attrs.size = cached
        return attrs
      }
      
      let scale = NSCMason.scale
      
      view.compute(
        Float(availableWidth) * scale,
        -2
      )
      
      let layout = view.layout()
      view.setComputeCache(CGSizeMake(CGFloat(layout.width), CGFloat(layout.height)))
      let size = CGSizeMake(CGFloat(layout.width / scale).rounded(.up), CGFloat(layout.height / scale).rounded(.up))
      cachedSized = size
      cachedWidth = availableWidth
      
      
      attrs.size = size
      return attrs
      
    }
    
    public override func layoutSubviews() {
      super.layoutSubviews()
      
      guard let view = view else { return }
      
      let layout = view.node.computedLayout
      guard !layout.sizeIsEmpty else { return }
      
      let hash = layout.hashValue
      
      guard appliedLayoutHash != hash else {
        return
      }
      
      appliedLayoutHash = hash
      
      
      if(view.node.computedLayout.sizeIsEmpty){
        let computeCache = view.computeCache()
        view.computeWithSize(Float(computeCache.width), Float(computeCache.height))
      }else {
        MasonElementHelpers.applyToView(view.node, layout)
      }
    }
    
  }
  
  func onTextStyleChanged(change: Int64) {
    MasonNode.invalidateDescendantTextViews(node, change)
  }
  
  
  struct Keys {
    static let COUNT = 0
    static let MULTI_TEMPLATE = 4
  }
  
  
  public override func draw(_ rect: CGRect) {
    
    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }
    
    style.mBorderRender.resolve(for: bounds)
    let borderWidths = style.mBorderRender.cachedWidths
    let innerRect = bounds.inset(by: UIEdgeInsets(
      top: borderWidths.top,
      left: borderWidths.left,
      bottom: borderWidths.bottom,
      right: borderWidths.right
    ))
    
    let innerRadius = style.mBorderRender.radius.insetByBorderWidths(borderWidths)
    let innerPath = style.mBorderRender.buildRoundedPath(in: innerRect, radius: innerRadius)
    
    context.saveGState()
    context.addPath(innerPath.cgPath)
    context.clip()
    style.mBackground.draw(on: self, in: context, rect: innerRect)
    context.restoreGState()
    
    style.mBorderRender.draw(in: context, rect: bounds)
  }
  
  
  public let node: MasonNode
  public let mason: NSCMason
  
  public var uiView: UIView { self }
  
  public var style: MasonStyle {
    return node.style
  }
  
  var staticViews: [MasonLi] = []
  
  public lazy var values: NSMutableData = {
    guard let data = NSMutableData(length: 32) else {
      let data = NSMutableData()
      data.increaseLength(by: 32)
      return data
    }
    return data
  }()
  
  public var count: Int {
    return staticViews.count + Int(values.bytes.advanced(by: Keys.COUNT).assumingMemoryBound(to: Int32.self).pointee)
  }
  
  
  lazy var list: UICollectionView = {
    let layout = UICollectionViewFlowLayout()
    layout.scrollDirection = .vertical
    layout.minimumInteritemSpacing = 0
    layout.minimumLineSpacing = 0
    layout.sectionInset = .zero
    
    layout.estimatedItemSize = UICollectionViewFlowLayout.automaticSize
    layout.itemSize = UICollectionViewFlowLayout.automaticSize
    
    let collection = UICollectionView(frame: .zero, collectionViewLayout: layout)
    collection.delegate = self
    collection.dataSource = self
    collection.backgroundColor = .clear
    return collection
  }()
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    list.frame = bounds
  }
  
  public func register(cellClass: AnyClass?, forCellWithReuseIdentifier identifier: String ){
    list.register(cellClass, forCellWithReuseIdentifier: identifier)
  }
  
  
  public func reload(){
    list.reloadData()
  }
  
  public var isOrdered: Bool = false
  
  init(mason doc: NSCMason) {
    node = doc.createNode()
    mason = doc
    super.init(frame: .zero)
    isOpaque = false
    setComputeCache(.init(width: -2, height: -2))
    computeCacheDirty = false
    node.view = self
    style.setStyleChangeListener(listener: self)
    addSubview(list)
  }
  
  required init?(coder: NSCoder) {
    mason = NSCMason.shared
    node = NSCMason.shared.createNode()
    super.init(coder: coder)
  }
  
  
  public func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
    return count
  }
  
  public func numberOfSections(in collectionView: UICollectionView) -> Int {
    return 1
  }
  
  public func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
    let cell = delegate?.list(collectionView, cellForItemAt: indexPath) ?? MasonListCell.initWithEmptyBackground()
    if let cell = cell as? MasonListCell {
      cell.index = indexPath
    }
    return cell
  }
  
  public func collectionView(_ collectionView: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
    if let cell = cell as? MasonListCell {
      cell.index = indexPath
      
      // Bind MasonLi with position and ordered state
      if let li = cell.view as? MasonLi {
        li.bind(position: indexPath.item, isOrdered: isOrdered)
      }
    }
    delegate?.list(collectionView, willDisplay: cell, forItemAt: indexPath)
  }
  
}
