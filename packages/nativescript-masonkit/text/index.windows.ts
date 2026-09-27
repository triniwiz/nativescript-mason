import { TextBase, textContentProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isText_, isMasonView_, native_ } from '../symbols';
import { removeNativeChild } from '../windows-panel-helpers';

// crates/mason-core/src/utils/ua_defaults.rs as [font size, margin top, bottom, left, right] in CSS
// px, a font size of 0 leaving it inherited. Android and iOS read it over FFI;
// ua-defaults-drift.spec.ts keeps this copy equal.
export const UA_DEFAULTS: Record<string, [number, number, number, number, number]> = {
  p: [0, 16, 16, 0, 0],
  h1: [32, 21.44, 21.44, 0, 0],
  h2: [24, 19.92, 19.92, 0, 0],
  h3: [19, 18.72, 18.72, 0, 0],
  h4: [16, 21.28, 21.28, 0, 0],
  h5: [13, 22.18, 22.18, 0, 0],
  h6: [11, 24.98, 24.98, 0, 0],
  blockquote: [0, 16, 16, 40, 40],
  pre: [0, 16, 16, 0, 0],
};

// By web.ts TextType value.
const TAGS: Record<number, string> = { 1: 'p', 3: 'code', 4: 'h1', 5: 'h2', 6: 'h3', 7: 'h4', 8: 'h5', 9: 'h6', 11: 'blockquote', 12: 'b', 13: 'pre', 14: 'strong', 15: 'em', 16: 'i' };
const BOLD = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'strong']);

export class Text extends TextBase {
  [style_];
  _inBatch = false;
  private _type: number;
  constructor(type = 0) {
    super();
    this._type = type;
    this[isText_] = true;
    this[isMasonView_] = true;
    this._applyTagDefaults();
  }

  // What TextView.kt sets per TextType, minus display: inline, which Windows text doesn't lay out.
  private _applyTagDefaults() {
    const tag = TAGS[this._type];
    if (!tag) return;
    const style = this._styleHelper;
    const ua = UA_DEFAULTS[tag];
    if (ua) {
      style.display = 'block';
      if (ua[0] > 0) style.fontSize = ua[0];
      if (!Tree.instance.preflight) {
        style.marginTop = ua[1];
        style.marginBottom = ua[2];
        style.marginLeft = ua[3];
        style.marginRight = ua[4];
      }
    }
    if (BOLD.has(tag)) style.fontWeight = 'bold';
    if (tag === 'em' || tag === 'i') style.fontStyle = 'italic';
    if (tag === 'code' || tag === 'pre') this._view.SetFontFamily('monospace');
  }

  get _view(): NativeScript.Mason.Text {
    if (!this[native_]) {
      this[native_] = Tree.instance.createTextView(null, this._type) as never;
    }
    return this[native_] as never as NativeScript.Mason.Text;
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

  // Text lays out runs, not child panels, so a nested text element renders inside this one's runs.
  // @ts-ignore
  public _addViewToNativeVisualTree(child: any, atIndex = -1): boolean {
    if (child?.[isText_] && child._view) {
      this._view.SetInlineText(child._view, this._windowsNativeIndexOf(child, atIndex));
      child._isMasonChild = true;
      return true;
    }
    return super._addViewToNativeVisualTree(child, atIndex);
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(child: any): void {
    if (child?.[isText_] && child._view) {
      this._view.RemoveInlineText(child._view);
      child._isMasonChild = false;
    } else {
      removeNativeChild(this._view, child);
    }
    super._removeViewFromNativeVisualTree(child);
  }

  [textContentProperty.setNative](value) {
    const nativeView = this._view;
    if (nativeView) {
      nativeView.Content = value ?? '';
    }
  }
}
