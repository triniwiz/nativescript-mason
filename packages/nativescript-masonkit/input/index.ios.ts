import { Color, CSSType } from '@nativescript/core';
import { placeholderColorProperty } from '@nativescript/core/ui/editable-text-base';
import { isEnabledProperty } from '@nativescript/core/ui/core/view';
import { acceptProperty, appearanceProperty, defaultValueProperty, getCheckedProperty, getValueProperty, InputAppearance, InputElementBase, multipleProperty, setCheckedProperty, setValueProperty, syncCheckedPseudoClass } from './common';
import { style_, isMasonView_, native_ } from '../symbols';
import { Tree } from '../tree';
import { setMeasuredFromNative } from '../common';
import { placeholderProperty, typeProperty } from './common';
import { InputType } from '..';
import { Style } from '../style';

@CSSType('input')
export class Input extends InputElementBase {
  [style_];

  private getType(): MasonInputType {
    switch (this.type) {
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
      case 'search':
        return MasonInputType.Search;
      case 'time':
        return MasonInputType.Time;
      case 'datetime-local':
        return MasonInputType.DatetimeLocal;
      case 'month':
        return MasonInputType.Month;
      case 'week':
        return MasonInputType.Week;
      case 'color':
        return MasonInputType.Color;
      case 'file':
        return MasonInputType.File;
      case 'submit':
        return MasonInputType.Submit;
      case 'reset':
        return MasonInputType.Reset;
    }
    return MasonInputType.Text;
  }

  constructor() {
    super();
    this[isMasonView_] = true;
  }

  [multipleProperty.setNative](value) {
    if (this._view) {
      this._view.multiple = value;
    }
  }

  [defaultValueProperty]() {
    return '';
  }

  [getValueProperty]() {
    return this._view.value;
  }

  [setValueProperty](value) {
    this._view.value = value;
  }

  [getCheckedProperty]() {
    return this._view.checked;
  }

  [setCheckedProperty](checked: boolean) {
    this._view.checked = checked;
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
    if (this._view) {
      this._view.type = this.getType();
    }
  }

  [placeholderProperty.setNative](value: string) {
    if (this._view) {
      this._view.placeholder = value;
    }
  }

  // Core's placeholder-color (also what ::placeholder { color } compiles to), as on TextField.
  [placeholderColorProperty.setNative](value: Color | UIColor) {
    if (this._view) {
      this._view.placeholderColor = value instanceof Color ? value.ios : value;
    }
  }

  // Core only disables a UIControl, and MasonInput is a plain view hosting one.
  [isEnabledProperty.setNative](value: boolean) {
    if (this._view) {
      this._view.disabled = !value;
    }
  }

  [acceptProperty.setNative](value: string) {
    if (this._view) {
      this._view.accept = value;
    }
  }

  // Not `appearance` natively: that's UIAppearance's class method.
  [appearanceProperty.setNative](value: InputAppearance) {
    if (this._view) {
      this._view.cssAppearance = value === 'none' ? MasonInputAppearance.None : MasonInputAppearance.Auto;
    }
  }

  initNativeView() {
    super.initNativeView();
    // A tap changes the checked state natively; held weakly so the block doesn't keep the owner alive.
    const ref = new WeakRef(this);
    this._view.onCheckedChange = () => {
      ref.deref()?.[syncCheckedPseudoClass]();
    };
  }

  disposeNativeView() {
    this._view.onCheckedChange = null;
    super.disposeNativeView();
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createInputView(null, this.type) as never;
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
      // @ts-ignore
      setMeasuredFromNative(this, nativeView.mason_measure(widthMeasureSpec, heightMeasureSpec, !this.parent?.[isMasonView_], false));
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    nativeView.frame = frame;
  }
}
