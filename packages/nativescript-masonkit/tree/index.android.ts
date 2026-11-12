import { Screen, Utils } from '@nativescript/core';
import { InputType } from '..';
import { setCssUnitContext } from '../units';
import { refreshViewportUnits } from '../style';
import { setDisplayDensity } from '../display-density';

enum TextType {
  None = 0,

  P = 1,

  Span = 2,

  Code = 3,

  H1 = 4,

  H2 = 5,

  H3 = 6,

  H4 = 7,

  H5 = 8,

  H6 = 9,

  Li = 10,

  Blockquote = 11,

  B = 12,

  Pre = 13,
  Strong = 14,
  Em = 15,
  I = 16,
  A = 17,
}

export class Tree {
  private _base: org.nativescript.mason.masonkit.Mason;
  private static _tree: Tree;
  constructor(base?: org.nativescript.mason.masonkit.Mason) {
    this._base = base ?? new org.nativescript.mason.masonkit.Mason();
  }

  static get instance() {
    if (!Tree._tree) {
      Tree._tree = new Tree(org.nativescript.mason.masonkit.Mason.getShared());
      const base = Tree._tree._base;
      base.setDeviceScale(Screen.mainScreen.scale);
      // `vw`/`vh` have nothing to resolve against until the viewport is known, and follow rotation and resizes.
      setCssUnitContext({ viewportWidth: Screen.mainScreen.widthDIPs, viewportHeight: Screen.mainScreen.heightDIPs });
      base.setViewportListener(
        new org.nativescript.mason.masonkit.Mason.ViewportListener({
          onViewportChanged(width: number, height: number) {
            setDisplayDensity(base.getScale());
            setCssUnitContext({ viewportWidth: width, viewportHeight: height });
            refreshViewportUnits();
          },
        }),
      );
      base.watchViewport(Utils.android.getApplicationContext());
    }
    return Tree._tree;
  }

  get native() {
    return this._base;
  }

  private _slotMailbox: Int32Array | undefined;
  private _textTypes: any[] = [];
  /** Style slot of the view the last createView or createTextView call made, or -1. */
  lastSlot = -1;

  private _takeSlot(): void {
    // @ts-ignore - typings regenerate from the AAR separately.
    const mailbox = (this._slotMailbox ??= new Int32Array((ArrayBuffer as any).from(this.native.getSlotMailbox())));
    this.lastSlot = mailbox[0];
  }

  createView(context) {
    // @ts-ignore - typings regenerate from the AAR separately.
    const view = this.native.createViewWithSlot(context);
    this._takeSlot();
    return view;
  }

  createTextView(context, type?: TextType) {
    const key = type ?? TextType.None;
    let nativeType = this._textTypes[key];
    if (nativeType === undefined) {
      // Each enum constant is a Java static field read; read it once per type.
      const types = org.nativescript.mason.masonkit.enums.TextType;
      switch (key) {
        case TextType.P:
          nativeType = types.P;
          break;
        case TextType.Span:
          nativeType = types.Span;
          break;
        case TextType.Code:
          nativeType = types.Code;
          break;
        case TextType.H1:
          nativeType = types.H1;
          break;
        case TextType.H2:
          nativeType = types.H2;
          break;
        case TextType.H3:
          nativeType = types.H3;
          break;
        case TextType.H4:
          nativeType = types.H4;
          break;
        case TextType.H5:
          nativeType = types.H5;
          break;
        case TextType.H6:
          nativeType = types.H6;
          break;
        case TextType.Li:
          nativeType = types.Li;
          break;
        case TextType.Blockquote:
          nativeType = types.Blockquote;
          break;
        case TextType.B:
          nativeType = types.B;
          break;
        case TextType.Pre:
          nativeType = types.Pre;
          break;
        case TextType.Strong:
          nativeType = types.Strong;
          break;
        case TextType.Em:
          nativeType = types.Em;
          break;
        case TextType.I:
          nativeType = types.I;
          break;
        case TextType.A:
          nativeType = types.A;
          break;
        default:
          nativeType = types.None;
          break;
      }
      this._textTypes[key] = nativeType;
    }
    // @ts-ignore - typings regenerate from the AAR separately.
    const view = this.native.createTextViewWithSlot(context, nativeType);
    this._takeSlot();
    return view;
  }

  createImageView(context) {
    return this.native.createImageView(context);
  }

  createScrollView(context) {
    return this.native.createScrollView(context);
  }

  createButtonView(context) {
    return this.native.createButton(context);
  }

  createBr(context) {
    //@ts-ignore
    return this.native.createBr(context);
  }

  createTextArea(context) {
    //@ts-ignore
    return this.native.createTextArea(context);
  }

  createInputView(context?, type?: InputType) {
    switch (type) {
      case 'number':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Number);
      case 'text':
        return this.native.createInput(context);
      case 'password':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Password);
      case 'email':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Email);
      case 'tel':
        //@ts-ignore
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Tel);
      case 'url':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Url);
      case 'search':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Search);
      case 'date':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Date);
      case 'time':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Time);
      case 'datetime-local':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.DatetimeLocal);
      case 'month':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Month);
      case 'week':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Week);
      case 'color':
        //@ts-ignore
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Color);
      case 'checkbox':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Checkbox);
      case 'radio':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Radio);
      case 'button':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Button);
      case 'submit':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Submit);
      case 'reset':
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.Reset);
      case 'file':
        //@ts-ignore
        return this.native.createInput(context, org.nativescript.mason.masonkit.Input.Type.File);
      default:
        return this.native.createInput(context);
    }
  }

  createTextNode() {
    return this.native.createTextNode();
  }

  createList(context) {
    return this.native.createListView(context);
  }

  createListItem(context) {
    return this.native.createListItem(context);
  }

  get preflight(): boolean {
    return this.native.getPreflight();
  }

  set preflight(value: boolean) {
    this.native.setPreflight(value);
  }
}
