import { AddChildFromBuilder, addWeakEventListener, Builder, ChangedData, EventData, ItemEventData, ItemsSource, KeyedTemplate, Label, Observable, ObservableArray, Property, removeWeakEventListener, Template, TemplatedItemsView, View } from '@nativescript/core';
import { ViewBase } from '../common';
import { isFunction } from '@nativescript/core/utils';

export const itemsProperty = new Property<ListBase, any[] | ItemsSource>({
  name: 'items',
  valueChanged: (target, oldValue, newValue) => {
    if (oldValue instanceof Observable) {
      removeWeakEventListener(oldValue, ObservableArray.changeEvent, target._onItemsChanged, target);
    }
    if (newValue instanceof Observable) {
      addWeakEventListener(newValue, ObservableArray.changeEvent, target._onItemsChanged, target);
    }
    target.refresh();
  },
});

export const itemTemplateProperty = new Property<ListBase, string | Template>({
  name: 'itemTemplate',
  valueChanged: (target) => {
    target.refresh();
  },
});

export const itemTemplatesProperty = new Property<ListBase, string | Array<KeyedTemplate>>({
  name: 'itemTemplates',
  valueConverter: (value) => {
    if (typeof value === 'string') {
      if (__UI_USE_XML_PARSER__) {
        return Builder.parseMultipleTemplates(value, null);
      } else {
        return null;
      }
    }
    return value;
  },
});

export abstract class ListBase extends ViewBase implements Omit<TemplatedItemsView, 'off' | 'on'>, AddChildFromBuilder {
  public static itemLoadingEvent = 'itemLoading';
  public static itemTapEvent = 'itemTap';
  public static loadMoreItemsEvent = 'loadMoreItems';
  public static searchChangeEvent = 'searchChange';
  // TODO: get rid of such hacks.
  public static knownFunctions = ['itemTemplateSelector', 'itemIdGenerator']; //See component-builder.ts isKnownFunction

  private _itemIdGenerator: (item: any, index: number, items: any) => number = (_item: any, index: number) => index;
  private _itemTemplateSelector: (item: any, index: number, items: any) => string;
  private _itemTemplateSelectorBindable = new Label();
  public _defaultTemplate: KeyedTemplate = {
    key: 'default',
    createView: () => {
      if (__UI_USE_EXTERNAL_RENDERER__) {
        if (isFunction(this.itemTemplate)) {
          return (<Template>this.itemTemplate)();
        }
      } else {
        if (this.itemTemplate) {
          return Builder.parse(this.itemTemplate, this);
        }
      }

      return undefined;
    },
  };

  public _itemTemplatesInternal = new Array<KeyedTemplate>(this._defaultTemplate);
  public items: any[] | ItemsSource;
  public itemTemplate: string | Template;
  public itemTemplates: string | Array<KeyedTemplate>;

  get itemTemplateSelector(): string | ((item: any, index: number, items: any) => string) {
    return this._itemTemplateSelector;
  }
  set itemTemplateSelector(value: string | ((item: any, index: number, items: any) => string)) {
    if (typeof value === 'string') {
      this._itemTemplateSelectorBindable.bind({
        sourceProperty: null,
        targetProperty: 'templateKey',
        expression: value,
      });
      this._itemTemplateSelector = (item: any, index: number, items: any) => {
        item['$index'] = index;

        if (this._itemTemplateSelectorBindable.bindingContext === item) {
          this._itemTemplateSelectorBindable.bindingContext = null;
        }

        this._itemTemplateSelectorBindable.bindingContext = item;

        return this._itemTemplateSelectorBindable.get('templateKey');
      };
    } else if (typeof value === 'function') {
      this._itemTemplateSelector = value;
    }
  }

  get itemIdGenerator(): (item: any, index: number, items: any) => number {
    return this._itemIdGenerator;
  }
  set itemIdGenerator(generatorFn: (item: any, index: number, items: any) => number) {
    this._itemIdGenerator = generatorFn;
  }

  public refresh() {
    //
  }

  public scrollToIndex(index: number) {
    //
  }

  public scrollToIndexAnimated(index: number) {
    //
  }

  public _onItemsChanged(args: ChangedData<any>) {
    this.refresh();
  }

  public _getItemTemplate(index: number): KeyedTemplate {
    let templateKey = 'default';
    if (this.itemTemplateSelector) {
      const dataItem = this._getDataItem(index);
      templateKey = this._itemTemplateSelector(dataItem, index, this.items);
    }

    for (let i = 0, length = this._itemTemplatesInternal.length; i < length; i++) {
      if (this._itemTemplatesInternal[i].key === templateKey) {
        return this._itemTemplatesInternal[i];
      }
    }

    // This is the default template
    return this._itemTemplatesInternal[0];
  }

  public _prepareItem(item: View, index: number) {
    if (item) {
      item.bindingContext = this._getDataItem(index);
    }
  }

  private _getDataItem(index: number): any {
    const thisItems = <ItemsSource>this.items;

    return thisItems.getItem ? thisItems.getItem(index) : thisItems[index];
  }

  public _getDefaultItemContent(index: number): View {
    const lbl = new Label();
    lbl.bind({
      targetProperty: 'text',
      sourceProperty: '$value',
    });

    return lbl;
  }
}

itemTemplatesProperty.register(ListBase);
itemTemplateProperty.register(ListBase);
itemsProperty.register(ListBase);
