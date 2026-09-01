import { CSSType, Utils } from '@nativescript/core';
import { Scroll, View, Text } from '.';

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
  Pre = 13,
  Strong = 14,
  Em = 15,
  I = 16,
  A = 17,
}

/**
 * Apply user-agent default styles.
 *
 * Written to the `css:` tier rather than as local style values: a local value
 * outranks every stylesheet rule in NativeScript's cascade, so a UA default set
 * as `view.style.x` is impossible for an app to override — `ul { margin: 0 }`
 * and Tailwind's `list-none` both silently lost. On the `css:` tier an app rule
 * for the same property replaces it, which is what a UA default should do.
 */
function applyUaCss(view: Scroll | Text, declarations: Record<string, string | number>): void {
  const style = view.style as unknown as Record<string, unknown>;
  for (const property in declarations) {
    style[`css:${property}`] = declarations[property];
  }
}

/**
 * Block containers extend `Scroll`, not `View`, so any of them can scroll when
 * `overflow` says so — as in a browser, where every block box is scrollable.
 *
 * This is affordable because neither platform uses the system scroll view:
 * Android's `Scroll` is a custom `TwoDScrollView` (a FrameLayout with
 * two-dimensional and nested-scroll support), and on iOS the scroll component
 * hosts a `MasonUIView` with its own scroll handling, precisely because UIKit's
 * `UIScrollView` breaks with nested scroll views. So nesting these behaves the
 * way nested scrollable boxes do on the web.
 */
@CSSType('div')
export class Div extends Scroll {}

@CSSType('section')
export class Section extends Scroll {}

@CSSType('header')
export class Header extends Scroll {}

@CSSType('footer')
export class Footer extends Scroll {}

@CSSType('article')
export class Article extends Scroll {}

@CSSType('main')
export class Main extends Scroll {}

@CSSType('nav')
export class Nav extends Scroll {}

@CSSType('aside')
export class Aside extends Scroll {}

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

// Browser UA default for <ul>/<ol>: `margin: 1em 0; padding-inline-start: 40px`
// (16px assumes the standard 16px root font-size, matching ua_defaults.rs's
// convention for the other block tags below). The padding is what reserves
// the marker gutter — `View.kt`'s/`MasonUIView.swift`'s `drawListItemMarkers`
// (see below) draws each marker relative to its `<li>` child's own resolved
// position, so it lands inside whatever space the container's own padding
// already pushed that child into; no separate per-item bookkeeping needed.
function applyListUaDefaults(view: Scroll): void {
  applyUaCss(view, { 'margin-top': 16, 'margin-bottom': 16, 'padding-left': 40 });
}

@CSSType('ul')
export class Ul extends Scroll {
  constructor() {
    super();
    applyListUaDefaults(this);
  }
}

@CSSType('ol')
export class Ol extends Scroll {
  constructor() {
    super();
    applyListUaDefaults(this);
    applyUaCss(this, { 'list-style-type': 'decimal' });
  }
}

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

@CSSType('strong')
export class Strong extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.Strong);
  }
}

@CSSType('pre')
export class Pre extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.Pre);
  }
}

@CSSType('em')
export class Em extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.Em);
  }
}

@CSSType('i')
export class I extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.I);
  }
}

@CSSType('a')
export class A extends Text {
  private _href = '';
  private _listening = false;

  constructor() {
    // @ts-ignore
    super(TextType.A);
  }

  /** Navigates on click; the native side already makes `<a>` clickable/focusable. */
  get href(): string {
    return this._href;
  }

  set href(value: string) {
    this._href = value == null ? '' : String(value);
    // The native side delivers a click only to registered listeners, so this has
    // to hold one of its own. Registering before the native view exists is fine:
    // ViewBase queues it and replays the queue on initNativeView.
    if (this._href && !this._listening) {
      this._listening = true;
      // @ts-ignore — the renderers' event typing does not cover this.
      this.addEventListener('click', this.followHref);
    }
  }

  private followHref = (): void => {
    const href = this._href;
    // An in-page fragment has nothing to open; leave it to the app, which is the
    // only thing that knows what its own anchors mean.
    if (!href || href.startsWith('#')) {
      return;
    }
    try {
      Utils.openUrl(href);
    } catch (error) {
      // openUrl throws on a scheme the platform cannot handle; a dead link
      // should not take the app down.
    }
  };
}

// ---------------------------------------------------------------------------
// Remaining HTML elements
// ---------------------------------------------------------------------------
//
// TS-only additions: `TextType` is closed at 18 members, so each phrasing
// element below reuses `Span` and gets its distinguishing style from
// properties that already work.

/** A generic block container, same box as `<div>`. */
class BlockElement extends Scroll {}

@CSSType('figure')
export class Figure extends BlockElement {
  constructor() {
    super();
    // Browser UA default: `margin: 1em 40px`.
    applyUaCss(this, { 'margin-top': 16, 'margin-bottom': 16, 'margin-left': 40, 'margin-right': 40 });
  }
}

@CSSType('figcaption')
export class Figcaption extends BlockElement {}

@CSSType('address')
export class Address extends BlockElement {}

@CSSType('details')
export class Details extends BlockElement {}

@CSSType('summary')
export class Summary extends BlockElement {}

@CSSType('hgroup')
export class Hgroup extends BlockElement {}

@CSSType('dl')
export class Dl extends BlockElement {
  constructor() {
    super();
    applyUaCss(this, { 'margin-top': 16, 'margin-bottom': 16 });
  }
}

@CSSType('dt')
export class Dt extends BlockElement {}

@CSSType('dd')
export class Dd extends BlockElement {
  constructor() {
    super();
    // Browser UA default: `margin-inline-start: 40px`.
    applyUaCss(this, { 'margin-left': 40 });
  }
}

@CSSType('form')
export class Form extends BlockElement {}

@CSSType('fieldset')
export class Fieldset extends BlockElement {}

@CSSType('legend')
export class Legend extends BlockElement {}

@CSSType('picture')
export class Picture extends BlockElement {}

@CSSType('hr')
export class Hr extends BlockElement {
  constructor() {
    super();
    // A browser draws `<hr>` as an inset-bordered box: `margin: 0.5em auto`,
    // 1px border. Mason has no `border-style: inset`, so a plain 1px top border
    // is the closest honest approximation.
    applyUaCss(this, {
      'margin-top': 8,
      'margin-bottom': 8,
      'border-top-width': 1,
      'border-top-style': 'solid',
      height: 0,
    });
  }
}

/**
 * Phrasing elements. All of these previously resolved to a bare `Span` with no
 * visual difference at all — `<del>` looked identical to its surrounding text.
 */
class PhrasingElement extends Text {
  constructor() {
    // @ts-ignore
    super(TextType.Span);
  }
}

@CSSType('small')
export class Small extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'font-size': '0.8em' });
  }
}

@CSSType('mark')
export class Mark extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'background-color': 'Mark', color: 'MarkText' });
  }
}

@CSSType('sub')
export class Sub extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'font-size': '0.75em', 'vertical-align': 'sub' });
  }
}

@CSSType('sup')
export class Sup extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'font-size': '0.75em', 'vertical-align': 'super' });
  }
}

@CSSType('u')
export class U extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'text-decoration': 'underline' });
  }
}

@CSSType('ins')
export class Ins extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'text-decoration': 'underline' });
  }
}

@CSSType('s')
export class S extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'text-decoration': 'line-through' });
  }
}

@CSSType('del')
export class Del extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'text-decoration': 'line-through' });
  }
}

@CSSType('abbr')
export class Abbr extends PhrasingElement {}

@CSSType('cite')
export class Cite extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'font-style': 'italic' });
  }
}

@CSSType('dfn')
export class Dfn extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'font-style': 'italic' });
  }
}

@CSSType('q')
export class Q extends PhrasingElement {}

@CSSType('kbd')
export class Kbd extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'font-family': 'monospace', 'font-size': '0.9em' });
  }
}

@CSSType('samp')
export class Samp extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'font-family': 'monospace' });
  }
}

@CSSType('var')
export class Var extends PhrasingElement {
  constructor() {
    super();
    applyUaCss(this, { 'font-style': 'italic' });
  }
}

@CSSType('time')
export class Time extends PhrasingElement {}

@CSSType('label')
export class Label extends PhrasingElement {}

@CSSType('output')
export class Output extends PhrasingElement {}

@CSSType('bdi')
export class Bdi extends PhrasingElement {}

@CSSType('bdo')
export class Bdo extends PhrasingElement {}
