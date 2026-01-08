import { CSSType, Utils } from '@nativescript/core';
import { acceptProperty, InputBase, multipleProperty, valueProperty } from './common';
import { style_, isMasonView_, native_ } from '../symbols';
import { Tree } from '../tree';
import { placeholderProperty, typeProperty } from './common';
import { InputType } from '..';
import { Style } from '../style';

@CSSType('input')
export class Input extends InputBase {
  [style_];

  private _type: InputType = 'text';

  private getType(): MasonInputType {
    switch (this._type) {
      case 'text':
        return MasonInputType.Text;
      case 'button':
        return MasonInputType.Button;
      case 'checkbox':
        return MasonInputType.Checkbox;
      case 'email':
        return MasonInputType.Email;
      case 'password':
        return MasonInputType.Password;
      case 'date':
        return MasonInputType.Date;
      case 'radio':
        return MasonInputType.Radio;
      case 'number':
        return MasonInputType.Number;
      case 'range':
        return MasonInputType.Range;
      case 'tel':
        return MasonInputType.Tel;
      case 'url':
        return MasonInputType.Url;
      case 'color':
        return MasonInputType.Color;
      case 'file':
        return MasonInputType.File;
    }
    return MasonInputType.Text;
  }

  constructor() {
    super();
    this[isMasonView_] = true;
  }

  [multipleProperty.setNative](value) {
    this._type = value;
    if (this._view) {
      this._view.multiple = value;
    }
  }

  [valueProperty.setNative](value) {
    this._type = value;
    if (this._view) {
      this._view.value = value;
    }
  }

  set value(value: string) {
    if (this._view) {
      this._view.value = value;
    }
  }

  get value() {
    return this._view ? this._view.value : '';
  }

  set valueAsNumber(value: number) {
    if (this._view) {
      this._view.valueAsNumber = value;
    }
  }

  get valueAsNumber(): number {
    return this._view ? this._view.valueAsNumber : NaN;
  }

  set valueAsDate(value: Date | null) {
    if (this._view) {
      this._view.valueAsDate = value;
    }
  }

  get valueAsDate(): Date | null {
    return this._view ? this._view.valueAsDate : null;
  }

  [typeProperty.setNative](value: InputType) {
    this._type = value;
    if (this._view) {
      this._view.type = this.getType();
    }
  }

  [placeholderProperty.setNative](value: string) {
    if (this._view) {
      this._view.placeholder = value;
    }
  }

  [acceptProperty.setNative](value: string) {
    if (this._view) {
      this._view.accept = value;
    }
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createInputView(null, this._type) as never;
      this[native_] = view;
      return view;
    }
    return this[native_] as never as MasonInput;
  }

  get _styleHelper(): Style {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  _inBatch = false;

  createNativeView() {
    return this._view;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get ios() {
    return this._view;
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this._view;
    if (nativeView) {
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);

      if (!this[isMasonView_]) {
        // only call compute on the parent
        if (this.width === 'auto' && this.height === 'auto') {
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);

          // @ts-ignore
          const layout = this.ios.mason_layout();

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
          return;
        } else {
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

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    nativeView.frame = frame;
  }
}
