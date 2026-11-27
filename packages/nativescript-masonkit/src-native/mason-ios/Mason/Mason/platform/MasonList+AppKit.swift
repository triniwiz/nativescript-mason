#if os(macOS)
import AppKit

extension MasonList {
  @objc(MasonListDelegate)
  public protocol MasonListDelegate {
    func list(_ list: NSCollectionView, cellForItemAt indexPath: IndexPath) -> NSCollectionViewItem
    func list(_ list: NSCollectionView, willDisplay cell: NSCollectionViewItem, forItemAt indexPath: IndexPath)
  }

  final class MasonListCellView: MasonViewBase {
    weak var item: MasonListCell?

    override func willMove(toSuperview newSuperview: NSView?) {
      guard let item else { return }
      item.willMove?(item)
    }

    override func layoutSubviews() {
      super.layoutSubviews()
      item?.applyLayout()
    }
  }

  @objc(MasonListCell)
  @objcMembers
  public class MasonListCell: NSCollectionViewItem {
    public var willMove: ((MasonListCell) -> Void)?
    public private(set) var element: MasonElement? = nil
    private var cachedSized: CGSize? = nil
    private var cachedWidth: CGFloat = 0
    private var appliedLayoutHash: Int = 0
    internal var index: IndexPath? = nil

    public override func loadView() {
      let content = MasonListCellView(frame: .zero)
      content.item = self
      view = content
    }

    public var contentView: NSView { view }

    public static func initWithEmptyBackground() -> MasonListCell {
      MasonListCell()
    }

    public func setView(_ newView: MasonElement?) {
      guard element !== newView else { return }
      if let old = element {
        old.node.removeAllChildren()
        old.uiView.removeFromSuperview()
      }
      element = newView
      if let newView { contentView.addSubview(newView.uiView) }
    }

    public func setView(compat view: MasonElementObjc?) {
      setView(view as? MasonElement)
    }

    public override func prepareForReuse() {
      super.prepareForReuse()
      cachedSized = nil
      cachedWidth = 0
      appliedLayoutHash = 0
      index = nil
      if let view = element {
        view.node.removeAllChildren()
        view.node.computedLayout = MasonLayout.empty
        view.setComputeCache(.init(width: -2, height: -2))
        (view as? MasonLi)?.resetForRecycle()
      }
      willMove = nil
    }

    public override func preferredLayoutAttributesFitting(_ layoutAttributes: NSCollectionViewLayoutAttributes) -> NSCollectionViewLayoutAttributes {
      let attrs = super.preferredLayoutAttributesFitting(layoutAttributes)
      guard let view = element, let collectionView, let masonList = collectionView.enclosingScrollView?.superview as? MasonList else {
        return attrs
      }
      let sectionInset = (collectionView.collectionViewLayout as? NSCollectionViewFlowLayout)?.sectionInset ?? NSEdgeInsetsZero
      let availableWidth = collectionView.bounds.width - sectionInset.left - sectionInset.right
      guard availableWidth > 0 else { return attrs }

      if let cached = cachedSized, cachedWidth == availableWidth {
        attrs.size = cached
        return attrs
      }
      if let idx = index?.item, masonList.sizeCacheWidth == availableWidth, let listCached = masonList.sizeCache[idx] {
        cachedSized = listCached
        cachedWidth = availableWidth
        attrs.size = listCached
        return attrs
      }

      let scale = NSCMason.scale
      view.compute(Float(availableWidth) * scale, -2)
      let layout = view.layout()
      view.setComputeCache(CGSize(width: CGFloat(layout.width), height: CGFloat(layout.height)))
      let size = CGSize(width: availableWidth, height: CGFloat(layout.height / scale).rounded(.up))
      cachedSized = size
      cachedWidth = availableWidth

      if let idx = index?.item {
        if masonList.sizeCacheWidth != availableWidth {
          masonList.sizeCache.removeAll()
          masonList.sizeCacheWidth = availableWidth
        }
        masonList.sizeCache[idx] = size
      }
      attrs.size = size
      return attrs
    }

    func applyLayout() {
      guard let view = element else { return }
      let layout = view.node.computedLayout
      guard !layout.sizeIsEmpty else { return }
      let hash = layout.hashValue
      guard appliedLayoutHash != hash else { return }
      appliedLayoutHash = hash
      MasonElementHelpers.applyToView(view.node, layout)
    }
  }

  func makeList() -> NSCollectionView {
    let layout = NSCollectionViewFlowLayout()
    layout.scrollDirection = .vertical
    layout.minimumInteritemSpacing = 0
    layout.minimumLineSpacing = 0
    layout.sectionInset = NSEdgeInsetsZero
    layout.estimatedItemSize = CGSize(width: 1, height: 44)

    let collection = NSCollectionView()
    collection.collectionViewLayout = layout
    collection.delegate = self
    collection.dataSource = self
    collection.backgroundColors = [.clear]
    collection.isSelectable = false
    return collection
  }

  func makeScrollView() -> NSScrollView {
    let scroll = NSScrollView()
    scroll.drawsBackground = false
    scroll.hasVerticalScroller = true
    scroll.autohidesScrollers = true
    scroll.documentView = list
    return scroll
  }

  public func register(cellClass: AnyClass?, forCellWithReuseIdentifier identifier: String) {
    list.register(cellClass, forItemWithIdentifier: NSUserInterfaceItemIdentifier(identifier))
  }

  func syncListWidth() {
    let width = scrollView.contentSize.width
    guard width > 0, let layout = list.collectionViewLayout as? NSCollectionViewFlowLayout,
          layout.estimatedItemSize.width != width else { return }
    layout.estimatedItemSize = CGSize(width: width, height: 44)
    layout.invalidateLayout()
  }
}

extension MasonList: NSCollectionViewDataSource, NSCollectionViewDelegateFlowLayout {
  public func numberOfSections(in collectionView: NSCollectionView) -> Int {
    1
  }

  public func collectionView(_ collectionView: NSCollectionView, numberOfItemsInSection section: Int) -> Int {
    count
  }

  public func collectionView(_ collectionView: NSCollectionView, itemForRepresentedObjectAt indexPath: IndexPath) -> NSCollectionViewItem {
    let index = indexPath.item
    if let staticItem = staticItems[index] {
      let cell = collectionView.makeItem(withIdentifier: NSUserInterfaceItemIdentifier("static"), for: indexPath) as? MasonListCell ?? MasonListCell.initWithEmptyBackground()
      cell.setView(staticItem)
      cell.index = indexPath
      staticItem.bind(position: index, isOrdered: isOrdered)
      return cell
    }
    let cell = delegate?.list(collectionView, cellForItemAt: indexPath) ?? MasonListCell.initWithEmptyBackground()
    if let cell = cell as? MasonListCell {
      cell.index = indexPath
      (cell.element as? MasonLi)?.bind(position: index, isOrdered: isOrdered)
    }
    return cell
  }

  public func collectionView(_ collectionView: NSCollectionView, willDisplay item: NSCollectionViewItem, forRepresentedObjectAt indexPath: IndexPath) {
    if let cell = item as? MasonListCell {
      cell.index = indexPath
      (cell.element as? MasonLi)?.bind(position: indexPath.item, isOrdered: isOrdered)
    }
    if staticItems[indexPath.item] == nil {
      delegate?.list(collectionView, willDisplay: item, forItemAt: indexPath)
    }
  }
}
#endif
