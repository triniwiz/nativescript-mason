import { ActionBar, Frame, Page, ProxyViewContainer, View as NSView } from '@nativescript/core';
import { EmulatedRenderer, isKnownView, registerElement, ɵViewUtil } from '@nativescript/angular';
import { View } from '@triniwiz/nativescript-masonkit';

import { masonMeta } from './mason-meta';

/**
 * Internal element name the host container is registered under. Every component
 * host is created from this entry and then re-stamped with its original tag, so
 * this name never appears in a template.
 */
const COMPONENT_HOST_TAG = 'mason-component-host';

/** How a passthrough element can be identified. */
export type PassthroughMatcher = string | RegExp | ((elementName: string) => boolean);

/**
 * Element selectors that must stay a transparent `ProxyViewContainer` rather
 * than becoming a MasonKit host.
 *
 * These are the framework router outlets. They host a classic `Frame`/`Page`
 * that fills its parent by classic measurement. A `ProxyViewContainer` is a
 * logical passthrough — its child is hoisted into the nearest real native
 * ancestor and measured with an exact, fill-parent size. A MasonKit host is
 * instead a real Taffy box, and Taffy *content-sizes* a foreign (non-MasonKit)
 * child; it does not honour a `Frame`'s "fill parent" intent, so the `Frame`
 * collapses to ~0 and nothing from the outlet down renders.
 *
 * Most `@nativescript/angular` views (`ActionBar`, `ActionItem`, ...) are
 * already `registerElement`'d, so they are known views and keep classic
 * behaviour without needing to be listed here — only the outlets leak through
 * as unregistered elements.
 *
 * The Angular root component is deliberately *not* listed: it is handled by
 * {@link ComponentHostOptions.rootAsPassthrough} instead, which detects it
 * rather than assuming it is called `app-root`.
 */
export const DEFAULT_PASSTHROUGH_ELEMENTS: PassthroughMatcher[] = ['page-router-outlet', 'ns-empty-outlet', 'router-outlet'];

export interface ComponentHostOptions {
  /**
   * Turn component-host mode off entirely while keeping element registration.
   *
   * @default true
   */
  enabled?: boolean;
  /**
   * Extra elements to keep as a transparent `ProxyViewContainer`. Merged with
   * {@link DEFAULT_PASSTHROUGH_ELEMENTS}. Strings are compared
   * case-insensitively; regexes and predicates receive the raw element name.
   *
   * Use this for any component whose template root is a classic fill-parent
   * view (another router outlet, a `Frame`, a `Page`).
   */
  passthrough?: PassthroughMatcher[];
  /**
   * Watch what each host actually receives as a child and, when a classic
   * fill-parent view (`Frame`/`Page`) shows up, remember that element name as a
   * passthrough so later instances are created as proxies.
   *
   * See {@link learnPassthroughElement} for what this does and does not fix.
   *
   * @default true
   */
  autoDetectPassthrough?: boolean;
  /**
   * Keep the Angular root component's host element a `ProxyViewContainer`.
   *
   * `AppHostView` only wraps the root in its full-screen root `GridLayout` when
   * that root *is* a `ProxyViewContainer`, so the root element has to stay a
   * passthrough for the tree below it to have a viewport-sized ancestor to
   * resolve `height: 100%` against.
   *
   * Detected rather than hardcoded: Angular creates the root component's host
   * element before anything in its template, so the first unregistered element
   * this package is asked to create is the root.
   *
   * @default true
   */
  rootAsPassthrough?: boolean;
  /**
   * Make a host whose parent is a *classic* NativeScript view (a `Page`,
   * `ContentView`, `GridLayout`, ...) fill that parent.
   *
   * This restores the behaviour of the `ProxyViewContainer` the host replaced.
   * A proxy is hoisted into its nearest real native ancestor and measured with
   * that ancestor's exact size, so the tree below it inherits a real box to
   * resolve `height: 100%` and `flex: 1` against. A Taffy box left at its
   * `auto` default content-sizes instead, so a route component's host would
   * shrink-wrap its content in the middle of a full-screen `Page`.
   *
   * Only applied at the Mason/classic boundary — a host nested inside another
   * MasonKit view is left as a normal in-flow box.
   *
   * The size is written straight to the Mason style rather than through the
   * NativeScript `width`/`height` properties, deliberately: `View.onMeasure`
   * only forwards the incoming measure spec to Taffy while both NativeScript
   * dimensions are still `auto`, so going through the properties would push it
   * onto the max-content path and defeat the fill.
   *
   * @default true
   */
  fillClassicParent?: boolean;
}

/**
 * Live configuration. Read at element-creation time rather than captured at
 * install time, so `MasonKitModule.forRoot()` can adjust it regardless of
 * whether it is evaluated before or after the install call.
 */
const config: Required<ComponentHostOptions> = {
  enabled: true,
  passthrough: [...DEFAULT_PASSTHROUGH_ELEMENTS],
  autoDetectPassthrough: true,
  rootAsPassthrough: true,
  fillClassicParent: true,
};

/** Lowercased string matchers, kept separate for O(1) lookup. */
const passthroughNames = new Set<string>(DEFAULT_PASSTHROUGH_ELEMENTS as string[]);
/** Regex and predicate matchers. */
const passthroughTests: Array<RegExp | ((name: string) => boolean)> = [];

let installed = false;
let elementsCreated = 0;

/**
 * The real native container behind every component host element.
 *
 * MasonKit's `View` is a `CustomLayoutView` backed by the Taffy layout engine;
 * it embeds in classic NativeScript layouts and hosts both MasonKit and classic
 * NativeScript children. Making a component's host element one of these gives
 * it the same mental model as the web: the host is a real box in the layout,
 * with the full style surface, and `flex`/`grid` on a component element does
 * what it says.
 */
export class MasonComponentHost extends View {
  /** The element name from the template, kept for diagnostics and auto-detect. */
  masonHostElementName?: string;

  addChild(child: unknown): void {
    inspectChild(this, child);
    super.addChild(child);
  }

  insertChild(child: unknown, atIndex: number): void {
    inspectChild(this, child);
    super.insertChild(child, atIndex);
  }

  onLoaded(): void {
    super.onLoaded();
    applyClassicParentFill(this);
  }
}

/** True when `view` manages children through MasonKit's own child list. */
function isMasonView(view: unknown): boolean {
  const candidate = view as { _children?: unknown; insertChild?: unknown };
  return !!candidate && Array.isArray(candidate._children) && typeof candidate.insertChild === 'function';
}

/**
 * Stretch a host that sits directly under a classic NativeScript parent.
 * See {@link ComponentHostOptions.fillClassicParent}.
 */
function applyClassicParentFill(host: MasonComponentHost): void {
  if (!config.fillClassicParent || filled.has(host)) {
    return;
  }
  const parent = host.parent;
  if (!parent || isMasonView(parent)) {
    return;
  }
  const style = (host as unknown as { _styleHelper?: { width: string; height: string } })._styleHelper;
  if (!style) {
    return;
  }
  filled.add(host);
  style.width = '100%';
  style.height = '100%';
}

/** Hosts already stretched, so a re-`loaded` does not redo the work. */
const filled = new WeakSet<MasonComponentHost>();

/**
 * True when `child` is a view that only lays out correctly if its parent is
 * transparent — i.e. one that expects classic fill-parent measurement from a
 * real native ancestor.
 *
 * Two shapes qualify:
 *
 * - `Frame` / `Page` — they fill their parent by classic measurement. Taffy
 *   *content-sizes* a foreign (non-MasonKit) child, so under a MasonKit host
 *   they collapse to ~0 and nothing below them renders.
 * - `ActionBar` — it never renders in place; it is hoisted to the owning
 *   `Page`. Its presence is the tell that this component *is* a page root, so
 *   its siblings are page-level content (typically a fill-parent `ScrollView`
 *   or layout) with the same requirement. This is the case every routed
 *   component in a NativeScript Angular app hits, and the symptom is
 *   distinctive: the ActionBar shows because it was hoisted, and the rest of
 *   the page is invisible because it was content-sized to nothing.
 */
function needsTransparentParent(child: unknown): boolean {
  if (child instanceof Frame || child instanceof Page || child instanceof ActionBar) {
    return true;
  }
  // A proxy hoists its own children, so look through it for the view it is
  // standing in for.
  if (child instanceof ProxyViewContainer) {
    const count = child.getChildrenCount();
    for (let i = 0; i < count; i++) {
      if (needsTransparentParent(child.getChildAt(i))) {
        return true;
      }
    }
  }
  return false;
}

function inspectChild(host: MasonComponentHost, child: unknown): void {
  if (!config.autoDetectPassthrough || !host.masonHostElementName) {
    return;
  }
  if (child instanceof NSView && needsTransparentParent(child)) {
    learnPassthroughElement(host.masonHostElementName);
  }
}

/**
 * Record an element name as a passthrough after the fact.
 *
 * Scope of the fix, stated plainly: the host that triggered the detection has
 * already been created and cannot change class — Angular's `ViewUtil` holds it
 * in a sibling linked list, so swapping it out mid-render would corrupt that
 * list. What this does is make *every later creation* of that element a proxy,
 * which covers the second and subsequent renders (a re-navigation, a second
 * instance, the next `*ngIf` toggle) and logs the name so it can be added to
 * `passthrough` to fix the very first render too.
 *
 * In practice the first render rarely breaks: the framework outlets that hit
 * this are already in {@link DEFAULT_PASSTHROUGH_ELEMENTS}.
 */
export function learnPassthroughElement(elementName: string): void {
  const name = elementName.toLowerCase();
  if (passthroughNames.has(name)) {
    return;
  }
  passthroughNames.add(name);
  console.log(`[masonkit/angular] <${elementName}> holds a page-level view (Frame, Page or ActionBar) that Taffy cannot size as a Mason box. ` + `It will be created as a transparent ProxyViewContainer from now on. Add '${elementName}' to the ` + `passthrough option to apply this from the first render too.`);
}

function isPassthrough(elementName: string): boolean {
  if (passthroughNames.has(elementName.toLowerCase())) {
    return true;
  }
  for (const test of passthroughTests) {
    if (test instanceof RegExp ? test.test(elementName) : test(elementName)) {
      return true;
    }
  }
  return false;
}

function applyOptions(options: ComponentHostOptions): void {
  if (options.enabled !== undefined) {
    config.enabled = options.enabled;
  }
  if (options.autoDetectPassthrough !== undefined) {
    config.autoDetectPassthrough = options.autoDetectPassthrough;
  }
  if (options.rootAsPassthrough !== undefined) {
    config.rootAsPassthrough = options.rootAsPassthrough;
  }
  if (options.fillClassicParent !== undefined) {
    config.fillClassicParent = options.fillClassicParent;
  }
  for (const matcher of options.passthrough ?? []) {
    if (typeof matcher === 'string') {
      passthroughNames.add(matcher.toLowerCase());
    } else {
      passthroughTests.push(matcher);
    }
    config.passthrough.push(matcher);
  }
}

/**
 * Turn every Angular component host element into a real MasonKit view.
 *
 * Stock `@nativescript/angular` creates a `ProxyViewContainer` for every element
 * that is not `registerElement`'d — i.e. every Angular component selector. That
 * container creates no native view, so anything placed on a component element
 * (`backgroundColor`, `margin`, `class="..."`, host bindings) is set on an
 * invisible logical wrapper with no visual effect, and the component is
 * transparent to layout. Nesting components then produces layouts that do not
 * match the template, because the boxes the template implies do not exist.
 *
 * This replaces that fallback with a {@link MasonComponentHost}, so a component
 * host element is a real box, as on the web.
 *
 * Idempotent: repeated calls only update the configuration.
 *
 * Trade-off: an unknown element name (a typo, a component that was never
 * declared) becomes a host instead of throwing "No known component for element
 * X". Set `enabled: false` to keep the stock behaviour.
 */
export function enableMasonComponentHosts(options: ComponentHostOptions = {}): void {
  applyOptions(options);

  if (installed) {
    return;
  }
  installed = true;

  registerElement(COMPONENT_HOST_TAG, () => MasonComponentHost, masonMeta);

  // Patch point 1 of 2: `ViewUtil.createView` substitutes 'ProxyViewContainer'
  // for unregistered elements. `ɵViewUtil` is a frozen namespace, but the
  // `ViewUtil` prototype itself is mutable.
  const { ViewUtil } = ɵViewUtil;
  const originalCreateView = ViewUtil.prototype.createView;
  ViewUtil.prototype.createView = function (name: string) {
    const isFirstElement = elementsCreated === 0;
    const unregistered = !isKnownView(name);
    if (unregistered) {
      elementsCreated++;
    }

    if (!config.enabled || !unregistered || isPassthrough(name) || (config.rootAsPassthrough && isFirstElement)) {
      // Known element, or one we deliberately keep as a transparent
      // ProxyViewContainer. `originalCreateView` substitutes the proxy for
      // unregistered names but does not record the original tag (the renderer
      // normally does that), so stamp it here to keep CSS type selectors and
      // debugging output working on this path too.
      const view = originalCreateView.call(this, name);
      if (unregistered) {
        view.customCSSName = name;
      }
      return view;
    }

    const host = originalCreateView.call(this, COMPONENT_HOST_TAG) as MasonComponentHost & { nodeName: string; tagName: string; cssType: string; customCSSName: string };
    // Preserve the original tag for CSS type selectors, for debugging, and for
    // Angular's `rootElement.tagName.toLowerCase()` bootstrap check.
    host.nodeName = name;
    host.tagName = name;
    host.cssType = name;
    host.customCSSName = name;
    host.masonHostElementName = name;
    return host;
  };

  // Patch point 2 of 2: `NativeScriptRenderer.createElement` performs the same
  // 'ProxyViewContainer' substitution *before* delegating to `createView`, so
  // the patch above would never see the original tag. Route it through the
  // patched `createView` with the tag intact. The renderer class is not
  // exported, but `EmulatedRenderer` extends it and delegates via
  // `super.createElement()`, so patching the shared base prototype covers both.
  const rendererProto = Object.getPrototypeOf(EmulatedRenderer.prototype) as {
    createElement(this: { viewUtil: InstanceType<typeof ViewUtil> }, name: string, namespace?: string): unknown;
  };
  const originalCreateElement = rendererProto.createElement;
  rendererProto.createElement = function (name: string, namespace?: string) {
    if (isKnownView(name)) {
      // Nothing to intercept — keep the stock path, including its tracing.
      return originalCreateElement.call(this, name, namespace);
    }
    // Unregistered: hand the *original* tag to the patched `createView`, which
    // decides between a host and a proxy and stamps `customCSSName` either way.
    return this.viewUtil.createView(name);
  };
}

/** Current component-host configuration. Exposed for diagnostics and tests. */
export function getComponentHostConfig(): Readonly<Required<ComponentHostOptions>> {
  return config;
}
