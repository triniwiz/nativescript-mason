import { ChangedData, CSSType, ObservableArray, Utils } from '@nativescript/core';
import { itemsProperty, ListBase } from './common';
import { isMasonView_, native_, style_ } from '../symbols';
import { Tree } from '../tree';

@NativeClass()
@Interfaces([org.nativescript.mason.masonkit.ListView.Listener])
class Listener extends java.lang.Object implements org.nativescript.mason.masonkit.ListView.Listener {
  _owner: WeakRef<List>;
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
  public onCreate(index: number): android.view.View {
    const template = this.owner._getItemTemplate(index);
  }
  public onBind(holder: org.nativescript.mason.masonkit.ListView.Holder, index: number): void {}
}

export class List extends ListBase {
  readonly ordered: boolean;
  [style_];
  _inBatch = false;
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
      this[native_] = view as never;
      return view;
    }
    return this[native_] as never as org.nativescript.mason.masonkit.ListView;
  }

  initNativeView(): void {
    super.initNativeView();
    this._view.setListener(Listener.fromOwner(this));
  }

  public _onItemsChanged(args: ChangedData<any>): void {}
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
