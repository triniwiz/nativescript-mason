import { InputType } from '..';

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
}

export class Tree {
  private _base: NSCMason;
  private static _tree: Tree;
  constructor(base?: NSCMason) {
    this._base = base ?? NSCMason.new();
  }

  static get instance() {
    if (!Tree._tree) {
      Tree._tree = new Tree(NSCMason.shared);
    }
    return Tree._tree;
  }

  get native() {
    return this._base;
  }

  createView() {
    return this.native.createView();
  }

  createTextView(context?, type?: TextType) {
    switch (type) {
      case TextType.P:
        return this.native.createTextViewWithType(MasonTextType.P);
      case TextType.Span:
        return this.native.createTextViewWithType(MasonTextType.Span);
      case TextType.Code:
        return this.native.createTextViewWithType(MasonTextType.Code);
      case TextType.H1:
        return this.native.createTextViewWithType(MasonTextType.H1);
      case TextType.H2:
        return this.native.createTextViewWithType(MasonTextType.H2);
      case TextType.H3:
        return this.native.createTextViewWithType(MasonTextType.H3);
      case TextType.H4:
        return this.native.createTextViewWithType(MasonTextType.H4);
      case TextType.H5:
        return this.native.createTextViewWithType(MasonTextType.H5);
      case TextType.H6:
        return this.native.createTextViewWithType(MasonTextType.H6);
      case TextType.Li:
        return this.native.createTextViewWithType(MasonTextType.Li);
      case TextType.Blockquote:
        return this.native.createTextViewWithType(MasonTextType.Blockquote);
      case TextType.B:
        return this.native.createTextViewWithType(MasonTextType.B);
      default:
        return this.native.createTextView();
    }
  }

  createTextNode() {
    //@ts-ignore
    return this.native.createTextNode('');
  }

  createImageView() {
    return this.native.createImageView();
  }

  createScrollView() {
    return this.native.createScrollView();
  }

  createButtonView() {
    return this.native.createButton();
  }

  createBr() {
    return this.native.createBr();
  }

  createTextArea() {
    return this.native.createTextArea();
  }

  createInputView(context?, type?: InputType) {
    switch (type) {
      case 'number':
        return this.native.createInput(MasonInputType.Number);
      case 'text':
        return this.native.createInput(MasonInputType.Text);
      case 'password':
        return this.native.createInput(MasonInputType.Password);
      case 'email':
        return this.native.createInput(MasonInputType.Email);
      case 'tel':
        return this.native.createInput(MasonInputType.Tel);
      case 'url':
        return this.native.createInput(MasonInputType.Url);
      case 'search':
        return this.native.createInput(MasonInputType.Search);
      case 'date':
        return this.native.createInput(MasonInputType.Date);
      case 'time':
        return this.native.createInput(MasonInputType.Time);
      case 'datetime-local':
        return this.native.createInput(MasonInputType.DatetimeLocal);
      case 'month':
        return this.native.createInput(MasonInputType.Month);
      case 'week':
        return this.native.createInput(MasonInputType.Week);
      case 'color':
        return this.native.createInput(MasonInputType.Color);
      case 'checkbox':
        return this.native.createInput(MasonInputType.Checkbox);
      case 'radio':
        return this.native.createInput(MasonInputType.Radio);
      case 'button':
        return this.native.createInput(MasonInputType.Button);
      case 'submit':
        return this.native.createInput(MasonInputType.Submit);
      case 'reset':
        return this.native.createInput(MasonInputType.Reset);
      case 'file':
        return this.native.createInput(MasonInputType.File);
      default:
        return this.native.createInput(MasonInputType.Text);
    }
  }

  createList() {
    return this.native.createListViewWithIsOrdered(false);
  }

  createListItem() {
    return this.native.createListItem();
  }

  /**
   * Enable or disable CSS Preflight (web-normalised / Tailwind-like) defaults.
   *
   * When `true` every element starts from a clean, browser-normalised slate:
   *  - `box-sizing: border-box`
   *  - `margin: 0`, `padding: 0`, `border-width: 0`
   *  - `background: transparent`
   *  - `list-style: none` on lists
   *  - `display: block` on `<img>`
   *
   * Set this **before** creating views for the cleanest result.  Changing it
   * afterwards re-seeds the arena so that unstyled nodes immediately pick up
   * the new defaults; nodes that were already individually styled are
   * not affected.
   */
  get preflight(): boolean {
    return this.native.preflight;
  }

  set preflight(value: boolean) {
    this.native.preflight = value;
  }
}
