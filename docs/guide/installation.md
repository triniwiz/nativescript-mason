# Installation

```bash
ns plugin add @triniwiz/nativescript-masonkit
```

That is all a plain NativeScript app needs. The native libraries for iOS, Android and Windows ship inside the package.

## Requirements

| | Minimum |
| --- | --- |
| NativeScript iOS runtime | 8.0 |
| NativeScript Android runtime | 8.0 |
| NativeScript Windows runtime | 9.1 |
| iOS deployment target | 15.6 |
| Android `minSdk` | 21 |

On Android the plugin pulls in its own Gradle dependencies (including `org.nativescript:fontmanager` for font loading), so there is no extra setup step.

## Load order (handled for you)

MasonKit replaces how CSS shorthands such as `margin`, `padding`, `border-radius` and `background` are split, and adds units like `rem` and `em`. For that to apply to your `app.css`, MasonKit has to load before the stylesheet is parsed.

The package ships a `nativescript.webpack.js` that `@nativescript/webpack` discovers automatically. It inserts `@triniwiz/nativescript-masonkit` into the bundle entry right before your app entry, so you do not need to import it first yourself.

::: tip
If you use a custom bundler setup that does not run NativeScript's webpack plugin discovery, import `@triniwiz/nativescript-masonkit` as the very first line of your app entry instead.
:::

## Framework entry points

Angular, Vue 3 and Svelte Native have dedicated entry points inside the same package. Each one exposes an `installMasonKit()` that registers every element for you:

| Flavour | Import | Guide |
| --- | --- | --- |
| Angular | `@triniwiz/nativescript-masonkit/angular` | [Angular](/frameworks/angular) |
| Vue 3 | `@triniwiz/nativescript-masonkit/vue` | [Vue 3](/frameworks/vue) |
| Svelte Native | `@triniwiz/nativescript-masonkit/svelte` | [Svelte Native](/frameworks/svelte) |

React and Solid register elements from the shared element registry (`@triniwiz/nativescript-masonkit/elements`). See [React](/frameworks/react) and [Solid](/frameworks/solid). Plain XML and TypeScript apps need no registration: see [Plain NativeScript](/frameworks/core).

## Preflight (optional)

By default MasonKit applies browser user-agent defaults: `<p>` and headings have vertical margins, lists are indented with markers, and so on. If you prefer a clean slate, the way CSS reset or utility-first frameworks expect, turn on **preflight** at startup (it is off by default):

```ts
import { View } from '@triniwiz/nativescript-masonkit';

View.preflight = true;
```

With preflight on, every element starts from:

- `box-sizing: border-box`
- `margin: 0`, `padding: 0`, `border-width: 0`
- `background: transparent`
- `list-style: none` on `<ul>` and `<ol>`
- `display: block` on `<img>`

::: warning
Preflight is global to the whole Mason tree. Set it before any MasonKit view is created; changing it later does not restyle views you have already customised.
:::

## TypeScript

The package ships its own typings. Importing it augments NativeScript's `Style` with the CSS properties MasonKit adds (`display`, `gridTemplateColumns`, `gap`, `lineClamp`, `maskImage`, ...), so `view.style.gridTemplateColumns = 'repeat(3, 1fr)'` type checks.

```ts
import { View, Text, Img, Scroll } from '@triniwiz/nativescript-masonkit';
import { Div, P, Span, H1 } from '@triniwiz/nativescript-masonkit/web';
```

MasonKit's own widgets (`View`, `Text`, `Scroll`, `Img`, `Button`, `Input`, `TextArea`, `Br`, `Ul`, `Ol`, `Li`) come from the package root. The HTML-shaped elements (`Div`, `Section`, `P`, `Span`, `H1` to `H6`, ...) come from `/web`.

## Next

- [Quick start](/guide/quick-start)
- [Units](/styling/units): read this before porting existing CSS.
