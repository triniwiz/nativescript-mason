import { CSSType } from '@nativescript/core';
import { View, Text, Scroll } from '.';

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

@CSSType('div')
export class Div extends Scroll {}

@CSSType('section')
export class Section extends View {}

@CSSType('header')
export class Header extends View {}

@CSSType('footer')
export class Footer extends View {}

@CSSType('article')
export class Article extends View {}

@CSSType('main')
export class Main extends View {}

@CSSType('nav')
export class Nav extends View {}

@CSSType('aside')
export class Aside extends View {}

@CSSType('span')
export class Span extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.Span);
  }
}

@CSSType('code')
export class Code extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.Code);
  }
}

@CSSType('h1')
export class H1 extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.H1);
  }
}

@CSSType('h2')
export class H2 extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.H2);
  }
}

@CSSType('h3')
export class H3 extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.H3);
  }
}

@CSSType('h4')
export class H4 extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.H4);
  }
}

@CSSType('h5')
export class H5 extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.H5);
  }
}

@CSSType('h6')
export class H6 extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.H6);
  }
}

@CSSType('p')
export class P extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.P);
  }
}

@CSSType('ul')
export class Ul extends View {}

@CSSType('li')
export class Li extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.Li);
  }
}

@CSSType('blockquote')
export class Blockquote extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.Blockquote);
  }
}

@CSSType('b')
export class B extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.B);
  }
}
