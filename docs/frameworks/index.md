# Frameworks

MasonKit works with every NativeScript flavour. The elements are ordinary NativeScript views, so anything that can render a view can render a MasonKit element. What differs between flavours is how the tags get registered.

| Flavour | Setup | Entry point |
| --- | --- | --- |
| [Plain NativeScript (XML / TS)](/frameworks/core) | XML namespaces or `new Div()` | `@triniwiz/nativescript-masonkit`, `.../web` |
| [Angular](/frameworks/angular) | `installMasonKit()` before bootstrap | `@triniwiz/nativescript-masonkit/angular` |
| [Vue 3](/frameworks/vue) | `installMasonKit()` before `createApp().start()` | `@triniwiz/nativescript-masonkit/vue` |
| [Svelte Native](/frameworks/svelte) | `installMasonKit()` before `svelteNative()` | `@triniwiz/nativescript-masonkit/svelte` |
| [React](/frameworks/react) | Register tags yourself from `getMasonKitElements()` | `@triniwiz/nativescript-masonkit/elements` |
| [Solid](/frameworks/solid) | Register tags yourself from `getMasonKitElements()` | `@triniwiz/nativescript-masonkit/elements` |

The Angular, Vue and Svelte entry points ship inside the main package, so there is nothing extra to install. Their framework packages are optional peer dependencies.

## What `installMasonKit()` does

Each dedicated entry point exports an `installMasonKit(options?)` that:

1. Registers every MasonKit element with the framework's element registry: MasonKit's own widgets (`View`, `Text`, `Scroll`, `Img`, `Button`, `Input`, `TextArea`, `Br`, `Ul`, `Ol`, `Li`) and every HTML-shaped element from `@triniwiz/nativescript-masonkit/web` (`div`, `p`, `span`, `h1` to `h6`, `a`, `details`, ...).
2. Attaches child bookkeeping to container elements, so framework inserts, moves and removals land at the right position in MasonKit's own child list. That list holds text runs as well as elements, which a framework's element-only index does not account for.
3. Keeps the core element available under an `n` prefix when a MasonKit tag takes over a name the framework already registered (for example `<nbutton>`). Which names are affected depends on the flavour; see each page.

It is idempotent, so calling it again (for example during HMR) is safe. The Angular version also turns component host elements into real layout boxes; see [Angular](/frameworks/angular#component-hosts).

All three accept the same two switches:

```ts
installMasonKit({ web: false }); // MasonKit widgets only
installMasonKit({ mason: false }); // HTML-shaped elements only
```

## The element registry

Every integration builds its tag list from one function, so they cannot drift apart:

```ts
import { getMasonKitElements } from '@triniwiz/nativescript-masonkit/elements';

for (const { tag, ctor, isContainer } of getMasonKitElements()) {
  // tag: 'div', 'h1', ... for /web elements; 'View', 'TextArea', ... for widgets
  // ctor: the view class
  // isContainer: true when the element hosts children through MasonKit's child list
}
```

| Field | Meaning |
| --- | --- |
| `tag` | Canonical spelling. Lowercase for `/web` elements (`'div'`), PascalCase for MasonKit widgets (`'View'`, `'TextArea'`). |
| `ctor` | The view class to instantiate. |
| `isContainer` | `true` for elements that accept children. `false` for `Img`, `Br`, `Input` and `TextArea`. |

Where `/web` and the widgets share a name (`ul`, `ol`, `li`), the `/web` element wins, so `<li>` is the inline text element. Duplicates are compared case-insensitively.

Use this list when your renderer has no dedicated entry point, as the [React](/frameworks/react) and [Solid](/frameworks/solid) pages show.

## Tag spelling

How a tag can be written depends on the framework's registry, not on MasonKit:

| Flavour | Rule | Example |
| --- | --- | --- |
| XML | Module export name, first letter case-insensitive, dashes become PascalCase | `<web:div>`, `<web:h1>`, `<ui:View>` |
| Angular | Original, lowercase and kebab-case spellings | `<View>`, `<view>`, `<text-area>` |
| Vue | Case-insensitive, hyphens ignored | `<View>`, `<view>`, `<text-area>` |
| Svelte Native | Lowercase | `<view>`, `<textarea>` |
| React, Solid | Whatever key you register (the demos use lowercase) | `<view>`, `<div>` |

## Build setup

### Platform flags

MasonKit branches on `__ANDROID__`, `__APPLE__` and `__WINDOWS__`. Some `@nativescript/webpack` releases (5.0.38 among them) do not define `__WINDOWS__`; MasonKit's webpack hook adds it when it is missing, so no `webpack.config.js` change is needed. If your bundler does not run NativeScript's plugin hooks, define it yourself (`false` on iOS and Android).

### Load order

The package ships a `nativescript.webpack.js` hook that adds MasonKit to the bundle right before your app entry. That way MasonKit's CSS properties are registered before `app.css` is parsed, and shorthands such as `padding`, `border-radius` and `rem` lengths in your global stylesheet are read by MasonKit's parsers. You do not need to import MasonKit first yourself.

## Custom renderers: `frameworkRegistry`

When a MasonKit text element's children change, MasonKit reads the framework's own child nodes to rebuild its text runs in order. It finds them through adapters in `frameworkRegistry`. Built-in adapters cover NativeScript core (`firstChild`/`nextSibling` with `TextNode` children) and DOM-shaped renderers (`childNodes` with `nodeType` 1 and 3, which covers the dominative-based React and Solid setups). The Vue entry point registers its own.

A renderer with a different node shape can register one:

```ts
import { frameworkRegistry, readChildNodes } from '@triniwiz/nativescript-masonkit';

frameworkRegistry.register({
  name: 'my-renderer',
  // Return the framework node that owns the children of this view, or null.
  getElement: (view) => view.__myNode ?? null,
  getChildren: readChildNodes, // or readLinkedList for firstChild/nextSibling
  classify(node) {
    if (node.kind === 'text') return 'text';
    if (node.kind === 'element') return 'element';
    return 'none'; // comments, anchors: occupy no slot
  },
  // Create a synthetic text node when `.text` is set on an element with no tracked children.
  syntheticTextOnEmpty: true,
});
```

`classify` returns `'text'`, `'break'`, `'element'` or `'none'`. Adapters registered later are checked first.

::: tip Custom MasonKit subclasses
If you subclass a MasonKit container and register it yourself, pass the entry point's `masonMeta` (Angular and Vue) so inserts and removals go through MasonKit's child list. See the [Angular](/frameworks/angular#custom-elements) and [Vue](/frameworks/vue#custom-elements) pages.
:::
