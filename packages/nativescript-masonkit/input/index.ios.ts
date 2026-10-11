import { Color, CSSType, Utils } from '@nativescript/core';
import { placeholderColorProperty } from '@nativescript/core/ui/editable-text-base';
import { acceptProperty, appearanceProperty, defaultValueProperty, getCheckedProperty, getValueProperty, InputAppearance, InputElementBase, multipleProperty, setCheckedProperty, setValueProperty, syncCheckedPseudoClass } from './common';
import { style_, isMasonView_, native_ } from '../symbols';
import { Tree } from '../tree';
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
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);

      if (!this[isMasonView_]) {
        // As a root/non-Mason parent, an UNSPECIFIED (or AT_MOST/0) spec must
        // be treated as unconstrained, not run through mason_computeWithSize
        // for auto/auto, which would collapse it.
        const unconstrained = widthMode === Utils.layout.UNSPECIFIED || heightMode === Utils.layout.UNSPECIFIED || (widthMode === Utils.layout.AT_MOST && specWidth === 0) || (heightMode === Utils.layout.AT_MOST && specHeight === 0);

        // Compute against the parent's bounds whenever the spec gives any; see
        // view/index.ios.ts for why auto/auto doesn't matter here.
        if (!unconstrained) {
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          // Claim this root for the host's spec; see view/index.ios.ts.
          // @ts-ignore
          this.ios.mason_markRootComputeAppliedWithSize(specWidth, specHeight);

          // @ts-ignore
          const layout = this.ios.node.computedLayout;

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
          return;
        } else {
          // either we have fixed dimensions or the spec did not constrain us
          // – compute using max-content so the view can grow to its children.
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
