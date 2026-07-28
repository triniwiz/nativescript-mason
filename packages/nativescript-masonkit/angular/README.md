# @triniwiz/nativescript-masonkit/angular

Angular integration for MasonKit.

```ts
// main.ts
import { installMasonKit } from '@triniwiz/nativescript-masonkit/angular';

installMasonKit();

runNativeScriptAngularApp({
  appModuleBootstrap: () =>
    bootstrapApplication(AppComponent, {
      providers: [provideNativeScriptRouter(routes)],
    }),
});
```

Call it before the bootstrap, not from an `NgModule` import or an
`APP_INITIALIZER`: the element map and the renderer patch have to be in place
before Angular creates the root component's host element, and a plain call at
the top of the entry file is unambiguous about when that happens.

That one call replaces every manual `registerElement`, and fixes the two things
that make nested components lay out wrong under Angular.

## What it fixes

### 1. Child bookkeeping (`masonMeta`)

MasonKit's `ViewBase` extends `CustomLayoutView`, **not** `LayoutBase`.
`@nativescript/angular`'s `ViewUtil` branches on `instanceof LayoutBase`, so a
MasonKit container registered without a meta falls into the generic fallbacks:

| Operation | Fallback used                   | Consequence                                                                                                           |
| --------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| insert    | `parent._addChildFromBuilder()` | a plain append — the `next` sibling is discarded, so `*ngIf`/`*ngFor`/router insertions land at the end               |
| remove    | core's `parent._removeView()`   | bypasses MasonKit's `removeChild()`, so `_children` keeps a stale entry and every later native insertion index is off |

`masonMeta` routes both through MasonKit's own `insertChild`/`addChild`/
`removeChild`, keeping the Taffy tree, `_children` and the native view tree in
step. Every element this package registers gets it.

This applies to plain MasonKit elements too — it is not specific to component
hosts.

### 2. Component host elements

Stock `@nativescript/angular` creates a `ProxyViewContainer` for every element
that is not registered — i.e. every Angular component selector. A proxy creates
no native view, so `backgroundColor`, `margin`, `class="..."` and host bindings
on a component element have no visual effect, and the component is transparent
to layout. Nesting components then produces a layout that does not match the
template, because the boxes the template implies do not exist.

This package replaces that fallback with a real MasonKit view, so a component
host element is an actual box — the same model as the web, with the full style
surface and Taffy flex/grid layout.

It is **on by default**: installing this package is taken as the statement that
MasonKit is how the app lays out.

```ts
// opt out entirely, keep only the element registrations
installMasonKit({ componentHosts: false });
```

## Passthrough elements

Some component elements must stay a transparent `ProxyViewContainer`. A
`ProxyViewContainer`'s child is hoisted into the nearest real native ancestor and
measured with an exact fill-parent size; a MasonKit host is a real Taffy box, and
Taffy _content-sizes_ a foreign (non-MasonKit) child. A `Frame` under a MasonKit
host therefore collapses to ~0 and nothing below it renders.

Three mechanisms cover this:

- **The default list** — `page-router-outlet`, `ns-empty-outlet`,
  `router-outlet`. These are the only framework views that reach Angular
  unregistered; the rest (`ActionBar`, `ActionItem`, ...) are already known
  views.
- **The Angular root component** — detected, not hardcoded. Angular creates the
  root component's host element before anything in its template, so the first
  unregistered element is the root. It has to stay a proxy because `AppHostView`
  only wraps the root in its full-screen `GridLayout` when the root _is_ a
  proxy. Disable with `rootAsPassthrough: false`.
- **Routed components** — every component reached through a router outlet is a
  page root: its template is an `<ActionBar>` plus page-level content that fills
  the `Page` by classic measurement. A host between the `Page` and that content
  has to stay transparent. The symptom when it does not is distinctive — the
  ActionBar renders (it is hoisted to the `Page`) and the entire rest of the
  screen is invisible, because Taffy content-sized it away.

  Auto-detection catches this from the ActionBar and self-corrects from the
  second render on; list the selectors in `passthrough` to fix the first render
  too. Components _below_ the route root are unaffected and stay real MasonKit
  hosts.

- **Auto-detection** — a host that receives a `Frame`, `Page` or `ActionBar`
  child records its element name, so later instances are created as proxies, and
  logs the name.

  Scope of that last one, stated plainly: the host that triggered detection has
  already been created and cannot change class — Angular's `ViewUtil` holds it in
  a sibling linked list, so swapping it mid-render would corrupt the list. The
  **first** render of an undetected outlet-like component is still wrong; the
  second and every later one is right. Add the name to `passthrough` to fix the
  first render too.

```ts
installMasonKit({
  componentHosts: {
    passthrough: ['my-frame-wrapper', /-outlet$/],
  },
});
```

## Filling a classic parent

A host whose parent is a _classic_ NativeScript view (a `Page`, `ContentView`,
`GridLayout`) is stretched to fill it, restoring what the `ProxyViewContainer` it
replaced did. Without this a route component's host would shrink-wrap its content
in the middle of a full-screen `Page`, and `height: 100%` below it would have
nothing to resolve against. A host nested inside another MasonKit view is left as
a normal in-flow box.

The size is written straight to the Mason style rather than through the
NativeScript `width`/`height` properties, because `View.onMeasure` only forwards
the incoming measure spec to Taffy while both NativeScript dimensions are still
`auto`.

Turn it off with `componentHosts: { fillClassicParent: false }`.

## Registered elements

| Source                                | Elements                                                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@triniwiz/nativescript-masonkit`     | `View`, `Text`, `Scroll`, `Img`, `Button`, `Input`, `TextArea`, `Br`, `Ul`, `Ol`, `Li`                                                                |
| `@triniwiz/nativescript-masonkit/web` | `div`, `section`, `header`, `footer`, `article`, `main`, `nav`, `aside`, `span`, `code`, `h1`–`h6`, `p`, `ul`, `li`, `blockquote`, `b`, `strong`, `a` |

`registerElement` stores each name in its original, lowercase and kebab-case
spellings, so `<View>`, `<view>` and `<text-area>` all resolve.

Where the two sets overlap (`ul`, `li`) the `/web` element wins — its `Li` is an
inline `Text` subclass, so `<li>` stays inline. Tag names are read from the
`@CSSType` decorator's `prototype.cssType`, not `constructor.name`, so this
survives the `uglify: true` release build.

Registration **shadows** core: MasonKit's `Button` and `Img` and `/web`'s `Span`
replace core's `Button`, `img` (`Image`) and `Span` in Angular templates. That is
the intent, but each set can be disabled:

```ts
installMasonKit({ web: false }); // MasonKit elements only
```

## API

| Export                               | Purpose                                                           |
| ------------------------------------ | ----------------------------------------------------------------- |
| `installMasonKit(options)`           | The whole integration; call before bootstrap                      |
| `registerMasonKitElements(options)`  | Element registration only                                         |
| `enableMasonComponentHosts(options)` | Component-host mode only                                          |
| `masonMeta`                          | The `ViewClassMeta`, for registering your own MasonKit subclasses |
| `MasonComponentHost`                 | The host container class                                          |
| `DEFAULT_PASSTHROUGH_ELEMENTS`       | The built-in passthrough list                                     |

Registering your own MasonKit `View` subclass:

```ts
import { registerElement } from '@nativescript/angular';
import { masonMeta } from '@triniwiz/nativescript-masonkit/angular';

registerElement('MyBox', () => MyBox, masonMeta);
```
