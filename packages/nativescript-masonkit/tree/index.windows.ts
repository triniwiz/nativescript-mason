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

  Strong = 14,

  Em = 15,

  I = 16,

  A = 17,
}

export class Tree {
  private static _tree: Tree;

  static get instance() {
    if (!Tree._tree) {
      Tree._tree = new Tree();
    }
    return Tree._tree;
  }

  get native() {
    return NativeScript.Mason.Mason.Instance();
  }

  createView() {
    return new NativeScript.Mason.View();
  }

  createTextView(context?, type?: TextType) {
    return new NativeScript.Mason.Text();
  }

  createTextNode() {
    return new NativeScript.Mason.TextNode();
  }

  createImageView() {
    return new NativeScript.Mason.Image();
  }

  createScrollView() {
    return new NativeScript.Mason.View();
  }

  createButtonView() {
    return new NativeScript.Mason.Button();
  }

  createBr() {
    return new NativeScript.Mason.Br();
  }

  createTextArea() {
    return new NativeScript.Mason.TextArea();
  }

  createInputView(context?, type?: InputType) {
    return new NativeScript.Mason.Input();
  }

  createList(ordered = false) {
    return new NativeScript.Mason.List(ordered);
  }

  createListItem() {
    return new NativeScript.Mason.Li();
  }

  get preflight(): boolean {
    return this.native.Preflight;
  }

  set preflight(value: boolean) {
    this.native.Preflight = value;
  }
}
