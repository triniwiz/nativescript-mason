import { CSSType, ItemEventData, View } from '@nativescript/core';
import { ListBase } from './common';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, native_, style_ } from '../symbols';
import { appendNativeChild } from '../windows-panel-helpers';

class ListView extends ListBase {
  [style_];
  protected _ordered = false;
  private _itemViews: View[] = [];

  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view(): NativeScript.Mason.List {
    if (!this[native_]) {
      this[native_] = Tree.instance.createList(this._ordered) as never;
    }
    return this[native_] as never as NativeScript.Mason.List;
  }

  // @ts-ignore
  get windows() {
    return this._view;
  }

  get _styleHelper(): Style {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView() {
    return this._view;
  }

  public refresh(): void {
    for (const view of this._itemViews) this.removeChild(view);
    this._itemViews = [];
    const items: any = this.items;
    const count = items ? (typeof items.length === 'number' ? items.length : 0) : 0;
    for (let index = 0; index < count; index++) {
      const view = ((this._getItemTemplate(index).createView() as View) ?? this._getDefaultItemContent(index)) as View;
      this.notify(<ItemEventData>{ eventName: ListBase.itemLoadingEvent, object: this, index, view, android: undefined, ios: undefined });
      if (!view) continue;
      this._prepareItem(view, index);
      this.addChild(view);
      this._itemViews.push(view);
    }
  }

  public _onItemsChanged(): void {
    this.refresh();
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: any, atIndex = -1): boolean {
    if (this._windowsAttach(child)) return true;
    const index = this._windowsNativeIndexOf(child, atIndex);
    super._addViewToNativeVisualTree(child, index);
    return appendNativeChild(this._view, child, index);
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(child: any): void {
    this._windowsDetachChild(child);
    child._isMasonChild = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(child);
  }
}

@CSSType('ul')
export class UnorderedList extends ListView {
  constructor() {
    super();
    this._ordered = false;
  }
}

@CSSType('ol')
export class OrderedList extends ListView {
  constructor() {
    super();
    this._ordered = true;
  }
}
