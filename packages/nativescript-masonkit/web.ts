import { CSSType, Property, Utils, ViewBase, unsetValue } from '@nativescript/core';
import { masonEngine } from './panel-helpers';
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
/** Browser-spacing UA declarations that `View.preflight` resets to zero. */
const PREFLIGHT_RESET = /^(margin|padding)(-|$)/;

function applyUaCss(view: Scroll | Text, declarations: Record<string, string | number>): void {
  const style = view.style as unknown as Record<string, unknown>;
  // Preflight (Tailwind-style) zeroes UA margins/padding on every element. The
  // native text types already do this through `ua_default_for_tag`, so the
  // block elements here must follow suit or `<figure>`/`<ul>` keep their
  // browser gutters while `<p>` loses them.
  const preflight = View.preflight;
  for (const property in declarations) {
    if (preflight && PREFLIGHT_RESET.test(property)) {
      continue;
    }
    style[`css:${property}`] = declarations[property];
  }
}

/**
 * Block containers extend `Scroll` so any of them can scroll when `overflow`
 * says so, as every block box can in a browser. Neither platform uses the system
 * scroll view (Android: `TwoDScrollView`, iOS: `MasonUIView`), so nesting works.
 * Unlike `<scroll>`, default `visible` overflow neither scrolls nor clips.
 */
class BlockElement extends Scroll {
  get _visibleOverflowScrolls(): boolean {
    return false;
  }
}

@CSSType('div')
export class Div extends BlockElement {}

@CSSType('section')
export class Section extends BlockElement {}

@CSSType('header')
export class Header extends BlockElement {}

@CSSType('footer')
export class Footer extends BlockElement {}

@CSSType('article')
export class Article extends BlockElement {}

@CSSType('main')
export class Main extends BlockElement {}

@CSSType('nav')
export class Nav extends BlockElement {}

@CSSType('aside')
export class Aside extends BlockElement {}

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
  applyUaCss(view, { 'margin-block-start': 16, 'margin-block-end': 16, 'padding-inline-start': 40 });
}

@CSSType('ul')
export class Ul extends BlockElement {
  constructor() {
    super();
    applyListUaDefaults(this);
    // list-style-type inherits, so a list sets its own: a `<ul>` in an `<ol>` keeps its discs.
    applyUaCss(this, { 'list-style-type': View.preflight ? 'none' : 'disc' });
  }
}

@CSSType('ol')
export class Ol extends BlockElement {
  constructor() {
    super();
    applyListUaDefaults(this);
    applyUaCss(this, { 'list-style-type': View.preflight ? 'none' : 'decimal' });
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

@CSSType('figure')
export class Figure extends BlockElement {
  constructor() {
    super();
    // Browser UA default: `margin: 1em 40px`.
    applyUaCss(this, { 'margin-block-start': 16, 'margin-block-end': 16, 'margin-inline-start': 40, 'margin-inline-end': 40 });
  }
}

@CSSType('figcaption')
export class Figcaption extends BlockElement {}

@CSSType('address')
export class Address extends BlockElement {}

/** The native Mason view behind a block element, when it exists. */
function nativeOf(view: any): any {
  return view?._view ?? view?.nativeViewProtected;
}

/**
 * Where the native view does `<details>` itself (role + open): it hides the closed content, turns
 * the summary's marker, answers accessibility and toggles on a summary tap, reporting "toggle".
 */
const NATIVE_DETAILS = __WINDOWS__ || __APPLE__ || __ANDROID__;

declare const kotlin: any;

const enum DetailsRole {
  Details = 1,
  Summary = 2,
}

function setNativeRole(native: any, role: DetailsRole) {
  if (__WINDOWS__) native.Role = role;
  else if (__APPLE__) native.mason_detailsRole = role;
  else if (__ANDROID__) native.setDetailsRole(role);
}

function setNativeOpen(native: any, open: boolean) {
  if (__WINDOWS__) native.Open = open;
  else if (__APPLE__) native.mason_detailsOpen = open;
  else if (__ANDROID__) native.setDetailsOpen(open);
}

function isNativeOpen(native: any): boolean {
  if (__WINDOWS__) return !!native.Open;
  if (__APPLE__) return !!native.mason_detailsOpen;
  if (__ANDROID__) return !!native.getDetailsOpen();
  return false;
}

/** Calls `callback` on the native "toggle" event; returns what removes it. */
function onNativeToggle(native: any, callback: () => void): () => void {
  if (__WINDOWS__) {
    const listener = (globalThis as any).NSWinRT.asDelegate('NativeScript.Mason.EventListener', callback);
    const id = masonEngine().AddEventListener(native, 'toggle', listener);
    return () => masonEngine().RemoveEventListener(native, 'toggle', id);
  }
  if (__APPLE__) {
    const id = native.mason_addEventListener('toggle', callback);
    return () => native.mason_removeEventListenerId('toggle', id);
  }
  if (__ANDROID__) {
    const id = native.addEventListener('toggle', new kotlin.jvm.functions.Function1({ invoke: callback }));
    return () => native.removeEventListener('toggle', id);
  }
  return () => {};
}

/**
 * `<details>`: shows only its first `<summary>` until it's open. `open` is a real property, so
 * `details[open]` rules restyle whenever it changes (a plain attribute never notifies core), and
 * the element also matches `:open`. Opening one closes the others that share its `name`, which is
 * how an accordion stays single-open; every change fires `toggle`.
 */
@CSSType('details')
export class Details extends BlockElement {
  /** `true` when open; `undefined` (no attribute) when closed. */
  open: boolean | undefined;
  name: string;

  /** The first `<summary>` child: what stays visible while closed, and what toggles. */
  get summary(): Summary | null {
    return (this._children.find((child) => child instanceof Summary) as Summary) ?? null;
  }

  addChild(child: any) {
    super.addChild(child);
    this._syncContent();
  }

  insertChild(child: any, atIndex: number) {
    super.insertChild(child, atIndex);
    this._syncContent();
  }

  removeChild(child: any) {
    super.removeChild(child);
    if (hiddenByDetails.has(child)) showContent(child);
    this._syncContent();
  }

  onLoaded() {
    super.onLoaded();
    if (this.name) detailsGroup(this.name).add(this);
  }

  private _removeToggleListener: (() => void) | undefined;

  initNativeView() {
    super.initNativeView();
    if (!NATIVE_DETAILS) return;
    const native = nativeOf(this);
    if (!native) return;
    setNativeRole(native, DetailsRole.Details);
    setNativeOpen(native, !!this.open);
    const ref = new WeakRef(this);
    this._removeToggleListener = onNativeToggle(native, () => {
      const owner = ref.deref();
      const ownerNative = nativeOf(owner);
      if (owner && ownerNative) owner.open = isNativeOpen(ownerNative) ? true : undefined;
    });
  }

  disposeNativeView() {
    this._removeToggleListener?.();
    this._removeToggleListener = undefined;
    super.disposeNativeView();
  }

  onUnloaded() {
    if (this.name) detailsGroup(this.name).delete(this);
    super.onUnloaded();
  }

  /** Hides everything but the summary while closed, as the details' content slot does. */
  _syncContent() {
    if (NATIVE_DETAILS) return;
    const summary: unknown = this.summary;
    for (const child of this._children) {
      if (!(child instanceof ViewBase)) continue;
      if (this.open || child === summary) {
        if (hiddenByDetails.has(child)) showContent(child);
      } else if (!hiddenByDetails.has(child)) {
        hiddenByDetails.add(child);
        (child.style as any).display = 'none';
      }
    }
  }

  _onOpenChanged(oldValue: boolean, newValue: boolean) {
    if (oldValue === newValue) return;
    if (newValue) {
      this.addPseudoClass('open');
      if (this.name) {
        for (const other of detailsGroup(this.name)) {
          if (other !== this && other.open) other.open = undefined;
        }
      }
    } else {
      this.deletePseudoClass('open');
    }
    if (NATIVE_DETAILS) {
      const native = nativeOf(this);
      if (native) setNativeOpen(native, newValue);
    }
    this._syncContent();
    this.notify({ eventName: 'toggle', object: this, oldState: oldValue ? 'open' : 'closed', newState: newValue ? 'open' : 'closed' } as never);
  }

  _onNameChanged(oldValue: string, newValue: string) {
    if (!this.isLoaded) return;
    if (oldValue) detailsGroup(oldValue).delete(this);
    if (newValue) detailsGroup(newValue).add(this);
  }
}

/** `<summary>`: a tap opens or closes the `<details>` it heads. */
@CSSType('summary')
export class Summary extends BlockElement {
  constructor() {
    super();
    // The native view handles the tap itself.
    if (!NATIVE_DETAILS) this.on('tap', () => this._activate());
  }

  initNativeView() {
    super.initNativeView();
    const native = NATIVE_DETAILS ? nativeOf(this) : null;
    if (native) setNativeRole(native, DetailsRole.Summary);
  }

  /** What a tap does: opens or closes the `<details>` this is the summary of. */
  _activate() {
    const details: unknown = this.parent;
    if (details instanceof Details && details.summary === this) details.open = details.open ? undefined : true;
  }
}

const hiddenByDetails = new WeakSet<ViewBase>();

function showContent(child: ViewBase) {
  hiddenByDetails.delete(child);
  (child.style as any).display = unsetValue;
}

const detailsGroups = new Map<string, Set<Details>>();

function detailsGroup(name: string): Set<Details> {
  let group = detailsGroups.get(name);
  if (!group) {
    group = new Set();
    detailsGroups.set(name, group);
  }
  return group;
}

// `open` is a boolean attribute: present (even as "") means open. Closed is `undefined`, an
// absent attribute, because core's `[open]` matches any value that isn't null or undefined.
export const detailsOpenProperty = new Property<any, boolean>({
  name: 'open',
  defaultValue: undefined,
  valueConverter: (value: any) => (value === '' || (value !== 'false' && !!value) ? true : undefined),
  valueChanged: (target: Details, oldValue, newValue) => {
    target._onOpenChanged(!!oldValue, !!newValue);
    // The converter only sees strings: `open = false` from code is made absent here.
    if (newValue !== true && newValue !== undefined) target.open = undefined;
  },
});
detailsOpenProperty.register(Details);

export const detailsNameProperty = new Property<any, string>({
  name: 'name',
  defaultValue: '',
  valueChanged: (target: Details, oldValue, newValue) => target._onNameChanged(oldValue, newValue),
});
detailsNameProperty.register(Details);

@CSSType('hgroup')
export class Hgroup extends BlockElement {}

@CSSType('dl')
export class Dl extends BlockElement {
  constructor() {
    super();
    applyUaCss(this, { 'margin-block-start': 16, 'margin-block-end': 16 });
  }
}

@CSSType('dt')
export class Dt extends BlockElement {}

@CSSType('dd')
export class Dd extends BlockElement {
  constructor() {
    super();
    // Browser UA default: `margin-inline-start: 40px`.
    applyUaCss(this, { 'margin-inline-start': 40 });
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
      'margin-block-start': 8,
      'margin-block-end': 8,
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
    // The system colours Mark / MarkText resolve to these in browsers.
    applyUaCss(this, { 'background-color': '#ffff00', color: '#000000' });
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

/**
 * `<link>` — pure document metadata (stylesheet/preload/icon/etc.). Like a
 * browser, it never renders anything; registered mainly so a host framework's
 * `<head>` management or feature-detection probes don't throw creating one.
 */
@CSSType('link')
export class Link extends BlockElement {
  constructor() {
    super();
    applyUaCss(this, { display: 'none' });
  }
}
