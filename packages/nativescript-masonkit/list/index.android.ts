import { ChangedData, CSSType, ItemEventData, ObservableArray, ProxyViewContainer, Utils, View } from '@nativescript/core';
import { itemsProperty, ListBase } from './common';
import { isMasonView_, native_, style_ } from '../symbols';
import { Tree } from '../tree';
import { Style } from '../style';

@NativeClass()
@Interfaces([org.nativescript.mason.masonkit.ListView.Listener])
class Listener extends java.lang.Object implements org.nativescript.mason.masonkit.ListView.Listener {
  _owner: WeakRef<List>;
  constructor() {
    super();
    return global.__native(this);
  }
  static fromOwner(owner: List) {
    const listener = new Listener();
    listener._owner = new WeakRef(owner);
    return listener;
  }
  public getItemViewType(index: number): number {
    const owner = this._owner.get();
    if (owner) {
      const template = owner._getItemTemplate(index);
      return owner._itemTemplatesInternal.indexOf(template);
    }
    return 0;
  }
  public onCreate(type: number): android.view.View {
    const owner = this._owner.get();
    if (owner) {
      const template = owner._getItemTemplate(type);

      const view = template.createView();

      if (view instanceof ProxyViewContainer) {
      } else {
        owner._inheritStyles(view);
        view._setupUI(owner._context);

        if (owner.isLoaded) {
          owner.loadView(view);
        }
      }

      view.nativeViewProtected['view'] = view;
      return view.nativeViewProtected;
    }
  }
  public onBind(holder: org.nativescript.mason.masonkit.ListView.Holder, index: number): void {
    const owner = this._owner.get();
    if (owner) {
      const holderView = holder.getView()?.['view'];
      let args = <ItemEventData>{
        eventName: ListBase.itemLoadingEvent,
        object: owner,
        android: holder,
        ios: undefined,
        index,
        view: holderView,
      };

      owner.notify(args);

      if (holderView) {
        owner._prepareItem(holderView, index);
      }
    }
  }
}

const listState_ = Symbol('[[listState]]');

export class List extends ListBase {
  readonly ordered: boolean;
  [style_];
  _inBatch = false;
  [listState_];
  constructor(ordered: boolean = false) {
    super();
    this.ordered = ordered ?? false;
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      const view = Tree.instance.createList(context) as org.nativescript.mason.masonkit.ListView;
      if (this.ordered) {
        view.setOrdered(true);
      }
      this[listState_] = new DataView((<any>ArrayBuffer).from(view.getValues()));
      this[native_] = view as never;
      return view;
    }
    return this[native_] as never as org.nativescript.mason.masonkit.ListView;
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
        this._view.addView(staticView.nativeViewProtected);
      }
    }

    return this._view;
  }

  initNativeView(): void {
    super.initNativeView();
    const listener = Listener.fromOwner(this);
    this._view.setListener(listener);
  }

  private _staticViews = [];

  _addChildFromBuilder(name: string, value: any): void {
    if (value instanceof View && !value.parent && !value.nativeView) {
      this._staticViews.push(value);
    }
  }

  private get _stateView(): DataView {
    return this[listState_];
  }

  public _onItemsChanged(args: ChangedData<any>): void {}

  public _updateItemsCount() {
    if (!this[listState_]) {
      this._view.setCount(this.items ? this.items.length : 0);
    } else {
      this._stateView.setInt32(0, this.items ? this.items.length : 0, true);
    }

    this._view.notifyDataSetChanged();
  }

  public refresh(): void {
    if (this[native_]) {
      this._view.notifyDataSetChanged();
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
