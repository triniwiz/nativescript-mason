import { ChangedData, CSSType, ItemEventData, ProxyViewContainer, Screen, StackLayout, Utils, View } from '@nativescript/core';
import { ListBase } from './common';
import { ViewBase } from '../common';
import { isMasonView_, native_, style_ } from '../symbols';
import { Tree } from '../tree/index';
import { Style } from '../style';

const ITEMLOADING = ListBase.itemLoadingEvent;

@NativeClass()
class ListDelegateImpl extends NSObject implements MasonListDelegate {
  static ObjCProtocols = [MasonListDelegate];

  _owner: WeakRef<List>;

  static initWithOwner(owner: WeakRef<List>): ListDelegateImpl {
    const delegate = ListDelegateImpl.new() as ListDelegateImpl;
    delegate._owner = owner;
    return delegate;
  }

  listCellForItemAt(list: UICollectionView, indexPath: NSIndexPath): UICollectionViewCell {
    const owner = this._owner?.deref();
    if (!owner) {
      return MasonListCell.initWithEmptyBackground();
    }

    const index = indexPath.item;
    const template = owner._getItemTemplate(index);
    const templateIndex = owner._itemTemplatesInternal.indexOf(template);
    const identifier = `template-${templateIndex}`;

    const cell = list.dequeueReusableCellWithReuseIdentifierForIndexPath(identifier, indexPath) as MasonListCell;

    console.log('Dequeued cell for index', index, 'with template index', templateIndex, 'and identifier', identifier);

    owner._prepareCell(cell, indexPath);

    return cell;
  }

  listWillDisplayForItemAt(list: UICollectionView, cell: UICollectionViewCell, indexPath: NSIndexPath): void {
    const owner = this._owner?.deref();
    if (!owner) {
      return;
    }

    if (owner.items && indexPath.item === owner.items.length - 1) {
      owner.notify({
        eventName: ListBase.loadMoreItemsEvent,
        object: owner,
      });
    }
  }
}

const listState_ = Symbol('[[listState]]');

export class List extends ListBase {
  readonly ordered: boolean;
  [style_];
  _inBatch = false;
  _preparingCell = false;
  private _map: Map<MasonListCell, View>;
  private _delegate: ListDelegateImpl;
  private _isDataDirty = false;
  [listState_];
  constructor(ordered: boolean = false) {
    super();
    this.ordered = ordered ?? false;
    this[isMasonView_] = true;
    this._map = new Map<MasonListCell, View>();
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createList() as MasonList;
      if (this.ordered) {
        view.isOrdered = true;
      }
      this[native_] = view as never;
      this[listState_] = new DataView(interop.bufferFromData(view.values));
      return view;
    }
    return this[native_] as never as MasonList;
  }

  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView(): Object {
    if (this._staticViews.length > 0) {
      for (const staticView of this._staticViews) {
        staticView._setupUI(this._context);
        this._view.addView((staticView as any)._view);
      }
    }

    return this._view;
  }

  initNativeView(): void {
    super.initNativeView();

    for (let i = 0; i < this._itemTemplatesInternal.length; i++) {
      this._view.registerWithCellClassForCellWithReuseIdentifier(MasonListCell.class(), `template-${i}`);
    }

    this._delegate = ListDelegateImpl.initWithOwner(new WeakRef(this));
    this._view.delegate = this._delegate;
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this._view;
    if (nativeView) {
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);

      if (!this[isMasonView_]) {
        const unconstrained = widthMode === Utils.layout.UNSPECIFIED || heightMode === Utils.layout.UNSPECIFIED || (widthMode === Utils.layout.AT_MOST && specWidth === 0) || (heightMode === Utils.layout.AT_MOST && specHeight === 0);

        if (this.width === 'auto' && this.height === 'auto' && !unconstrained) {
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);

          // @ts-ignore
          const layout = this.ios.mason_layout();

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
          return;
        } else {
          // fallback to max-content when unconstrained or explicit sizes
          // are provided
          // @ts-ignore
          this.ios.mason_computeWithMaxContent();
          // @ts-ignore
          const layout = this.ios.node.computedLayout;

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
        }
      } else {
        // @ts-ignore
        const layout = this.ios.node.computedLayout;
        const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
        const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

        this.setMeasuredDimension(w, h);
      }
    }
  }

  disposeNativeView(): void {
    this._delegate = null;
    this._view.delegate = null;
    super.disposeNativeView();
  }

  onLoaded(): void {
    super.onLoaded();
    if (this._isDataDirty) {
      this.refresh();
    }
  }

  private _staticViews = [];

  _addChildFromBuilder(name: string, value: any): void {
    if (value instanceof View && !value.parent && !value.nativeView) {
      this._staticViews.push(value);
    }
  }

  get _childrenCount(): number {
    return this._map.size + this._staticViews.length;
  }

  public eachChildView(callback: (child: View) => boolean): void {
    this._map.forEach((view) => {
      callback(view);
    });
  }

  public requestLayout(): void {
    if (!this._preparingCell) {
      super.requestLayout();
    }
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: any): boolean {
    return true;
  }

  private _layoutCell(cellView: View): void {
    if (!cellView) return;

    const masonElement = (cellView as any)._view;
    if (!masonElement) return;

    // Use the list's current bounds width as the available width
    const listWidth = this._view.bounds.size.width;
    if (listWidth <= 0) return;

    // @ts-ignore – compute mason layout
    const scale: number = Screen.mainScreen.scale;
    masonElement.mason_computeWithSize(listWidth * scale, -2);

    // @ts-ignore
    const layout = masonElement.mason_layout();
    const w = layout.width;
    const h = layout.height;

    if (w <= 0 || h <= 0) return;

    const wSpec = Utils.layout.makeMeasureSpec(w, Utils.layout.EXACTLY);
    const hSpec = Utils.layout.makeMeasureSpec(h, Utils.layout.EXACTLY);

    ViewBase.measureChild(this as never, cellView, wSpec, hSpec);
    View.layoutChild(this as never, cellView as never, 0, 0, w, h);
  }

  public _prepareCell(cell: MasonListCell, indexPath: NSIndexPath): void {
    try {
      this._preparingCell = true;

      const index = indexPath.item;
      let view: View = cell['nsView'];
      const template = this._getItemTemplate(index);

      if (!view) {
        view = template.createView();
      }

      const args = <ItemEventData>{
        eventName: ITEMLOADING,
        object: this,
        index,
        android: undefined,
        ios: cell,
        view,
      };

      this.notify(args);

      view = args.view || this._getDefaultItemContent(index);

      if (view instanceof ProxyViewContainer) {
        const sp = new StackLayout();
        sp.addChild(view);
        view = sp;
      }

      if (!cell['nsView']) {
        cell['nsView'] = view;
      } else if (cell['nsView'] !== view) {
        this._removeContainer(cell);
        cell['nsView'] = view;
      }

      this._prepareItem(view, index);
      this._map.set(cell, view);

      if (view && !view.parent) {
        this._addView(view);
        const masonElement = (view as any)._view;
        if (masonElement) {
          cell.setViewWithCompat(masonElement);
        }
      }

      this._layoutCell(view);

      // Set up willMove callback for cleanup
      cell.willMove = (c: MasonListCell) => {
        // When cell is removed from superview (newSuperview == nil),
        // willMove fires. Check if the cell still has a superview.
        // If not, clean up.
        const parent = c['nsView']?.parent;
        if (parent === this && !c.superview) {
          this._removeContainer(c);
        }
      };
    } finally {
      this._preparingCell = false;
    }
  }

  public _removeContainer(cell: MasonListCell): void {
    const view = cell['nsView'] as View;
    if (!view) {
      this._map.delete(cell);
      return;
    }

    if (view.parent) {
      if (!(view.parent instanceof List)) {
        this._removeView(view.parent);
      }

      const preparing = this._preparingCell;
      this._preparingCell = true;
      view.parent._removeView(view);
      this._preparingCell = preparing;
    }

    cell['nsView'] = null;
    this._map.delete(cell);
  }

  private get _stateView(): DataView {
    return this[listState_];
  }

  public _onItemsChanged(args: ChangedData<any>): void {
    this.refresh();
  }

  public _updateItemsCount() {
    if (!this[listState_]) {
      this._view.count = this.items ? this.items.length : 0;
    } else {
      this._stateView.setInt32(0, this.items ? this.items.length : 0, true);
    }

    this._view.reload();
  }

  public refresh(): void {
    if (this[native_]) {
      // Clear binding context for non-observable items
      this._map.forEach((view) => {
        if (view.bindingContext && !(view.bindingContext instanceof Object)) {
          view.bindingContext = null;
        }
      });

      if (this.isLoaded) {
        this._view.reload();
        this.requestLayout();
        this._isDataDirty = false;
      } else {
        this._isDataDirty = true;
      }
    }
  }
}

@CSSType('ul')
export class UnorderedList extends List {
  constructor() {
    super(false);
  }
}

@CSSType('ol')
export class OrderedList extends List {
  constructor() {
    super(true);
  }
}
