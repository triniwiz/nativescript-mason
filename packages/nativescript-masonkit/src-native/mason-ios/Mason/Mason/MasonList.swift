//
//  MasonList.swift
//  Mason
//
//  Created by Osei Fortune on 22/01/2026.
//

import UIKit



@objc(MasonList)
@objcMembers
public class MasonList: UIView,MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener, UICollectionViewDataSource, UICollectionViewDelegate, UICollectionViewDelegateFlowLayout, UICollectionViewDataSourcePrefetching {
  
  public var delegate: MasonListDelegate?
  
  @objc(MasonListDelegate)
  public protocol MasonListDelegate {
    func list(_ list: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell
    func list(_ list: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath)
  }
  
  public class MasonListCell: UICollectionViewCell {
    public var willMove: ((MasonListCell) -> Void)?
    public private(set) var view: MasonElement? = nil
    private var cachedSized: CGSize? = nil
    private var cachedWidth: CGFloat = 0
    private var appliedLayoutHash: Int = 0
    internal var index: IndexPath? = nil

    public static func initWithEmptyBackground() -> MasonListCell {
      let cell = MasonListCell()
      cell.backgroundColor = .clear
      return cell
    }

    /// Set or replace the root view for this cell.
    /// If replacing an existing view, the old view hierarchy is cleaned up.
    public func setView(_ newView: MasonElement?) {
      guard view !== newView else { return }
      if let old = view {
        old.node.removeAllChildren()
        old.uiView.removeFromSuperview()
      }
      view = newView
      if let newView = newView {
        contentView.addSubview(newView.uiView)
      }
    }

    public override func willMove(toSuperview newSuperview: UIView?) {
      willMove?(self)
    }

    public override func prepareForReuse() {
      super.prepareForReuse()

      cachedSized = nil
      cachedWidth = 0
      appliedLayoutHash = 0
      index = nil

      if let view = view {
        // Clean up children but keep the root view for recycling
        view.node.removeAllChildren()
        view.node.computedLayout = MasonLayout.zero
        view.setComputeCache(.init(width: -2, height: -2))

        // Reset MasonLi specific state
        if let li = view as? MasonLi {
          li.resetForRecycle()
        }
      }

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

      // Check cell-level cache first
      if let cached = cachedSized, cachedWidth == availableWidth {
        attrs.size = cached
        return attrs
      }

      // Check list-level cache (survives cell recycling)
      if let idx = index?.item,
         let masonList = collectionView.superview as? MasonList,
         masonList.sizeCacheWidth == availableWidth,
         let listCached = masonList.sizeCache[idx] {
        cachedSized = listCached
        cachedWidth = availableWidth
        attrs.size = listCached
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

      // Store in list-level cache
      if let idx = index?.item,
         let masonList = collectionView.superview as? MasonList {
        if masonList.sizeCacheWidth != availableWidth {
          masonList.sizeCache.removeAll()
          masonList.sizeCacheWidth = availableWidth
        }
        masonList.sizeCache[idx] = size
      }

      attrs.size = size
      return attrs

    }
    
    public override func layoutSubviews() {
      super.layoutSubviews()

      guard let view = view else { return }

      let layout = view.node.computedLayout
      guard !layout.sizeIsEmpty else { return }

      let hash = layout.hashValue
      guard appliedLayoutHash != hash else { return }
      appliedLayoutHash = hash

      MasonElementHelpers.applyToView(view.node, layout)
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

    let hasBackground = style.mBackground.color != nil || !style.mBackground.layers.isEmpty

    style.mBorderRender.resolve(for: bounds)
    let borderWidths = style.mBorderRender.cachedWidths
    let hasRadii = style.mBorderRender.hasRadii()

    if hasBackground {
      let innerRect = bounds.inset(by: UIEdgeInsets(
        top: borderWidths.top,
        left: borderWidths.left,
        bottom: borderWidths.bottom,
        right: borderWidths.right
      ))

      context.saveGState()
      if hasRadii {
        let innerRadius = style.mBorderRender.radius.insetByBorderWidths(borderWidths)
        let innerPath = style.mBorderRender.getClipPath(rect: innerRect, radius: innerRadius)
        context.addPath(innerPath.cgPath)
        context.clip()
      }
      style.mBackground.draw(on: self, in: context, rect: innerRect)
      context.restoreGState()
    }

    style.mBorderRender.draw(in: context, rect: bounds)
  }
  
  
  public let node: MasonNode
  public let mason: NSCMason
  
  public var uiView: UIView { self }
  
  public var style: MasonStyle {
    return node.style
  }
  
  var staticViews: [MasonLi] = []

  // List-level size cache keyed by item index — survives cell recycling
  private var sizeCache: [Int: CGSize] = [:]
  private var sizeCacheWidth: CGFloat = 0
  
  public lazy var values: NSMutableData = {
    guard let data = NSMutableData(length: 32) else {
      let data = NSMutableData()
      data.increaseLength(by: 32)
      return data
    }
    return data
  }()
  
  public var count: Int {
    set {
      MasonStyle.setInt32(Keys.COUNT, Int32(newValue), values)
    }
    get {
      return staticViews.count + Int(values.bytes.advanced(by: Keys.COUNT).assumingMemoryBound(to: Int32.self).pointee)
    }
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
    collection.prefetchDataSource = self
    collection.backgroundColor = .clear
    return collection
  }()
  
  public override func layoutSubviews() {
    super.layoutSubviews()
    autoComputeIfRoot()
    list.frame = bounds
    print(bounds.width, bounds.height, count, list.numberOfSections)
  }
  
  public func register(cellClass: AnyClass?, forCellWithReuseIdentifier identifier: String ){
    list.register(cellClass, forCellWithReuseIdentifier: identifier)
  }
  
  
  public func reload(){
    sizeCache.removeAll()
    list.reloadData()
    setNeedsLayout()
    layoutIfNeeded()
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
  
  
  public func invalidateSizeCache() {
    sizeCache.removeAll()
  }

  public func invalidateSizeCache(at index: Int) {
    sizeCache.removeValue(forKey: index)
  }

  public func collectionView(_ collectionView: UICollectionView, prefetchItemsAt indexPaths: [IndexPath]) {
    // No-op: prefetch data source enables UICollectionView's built-in
    // adaptive prefetching which smooths fling deceleration by batching
    // cell preparation ahead of the scroll position.
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
