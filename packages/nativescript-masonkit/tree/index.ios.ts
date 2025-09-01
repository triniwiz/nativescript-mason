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
}

export class Tree {
  private _base: NSCMason;
  private static _tree: Tree;
  constructor(base?: NSCMason) {
    this._base = base ?? NSCMason.new();
  }

  static {
    this._tree = new Tree(NSCMason.shared);
  }

  static get instance() {
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

  createImageView() {
    return this.native.createImageView();
  }

  createScrollView() {
    return this.native.createScrollView();
  }
}
