const enum TextType {
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
  static readonly instance: Tree;

  constructor();

  readonly native: org.nativescript.mason.masonkit.Mason | NSCMason;

  createView(context?): org.nativescript.mason.masonkit.View | MasonView;

  createTextView(context?, type?: TextType): org.nativescript.mason.masonkit.TextView | MasonText;

  createImageView(context?): org.nativescript.mason.masonkit.Img | MasonImg;

  createScrollView(context?): org.nativescript.mason.masonkit.Scroll | MasonScroll;

  createButtonView(context?): org.nativescript.mason.masonkit.Button | MasonButton;

  createBr(context?);
}
