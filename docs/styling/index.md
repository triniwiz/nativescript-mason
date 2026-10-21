# How CSS applies

MasonKit doesn't ship its own stylesheet engine. NativeScript core parses your `.css` / `.scss` files and runs the cascade: selectors, classes, ids, specificity, `@media`, `@keyframes`, `var()`. MasonKit registers its properties on core's `Style`, so a rule such as `.card { display: grid }` cascades onto a `<div>` the same way `color` cascades onto a `Label`.

What MasonKit owns is the meaning of each value. Parsing a length, a grid template or a `box-shadow`, and laying the result out, happens in MasonKit and its Rust engine, with web semantics.

```css
/* app.css */
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 1rem;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card > h2 {
  margin: 0;
}
```

## Three ways to set a style

You set styles the same way you would on any NativeScript view.

::: code-group

```css [Stylesheet]
.row {
  display: flex;
  justify-content: space-between;
}
```

```html [Inline style]
<div class="row" style="padding: 8px 16px; gap: 8px">
  <span>Left</span>
  <span>Right</span>
</div>
```

```ts [TypeScript]
import { Div } from '@triniwiz/nativescript-masonkit/web';

const row = new Div();
row.style.display = 'flex';
row.style.justifyContent = 'space-between';
row.style.padding = '8px 16px';
row.style.gap = 8; // a bare number is a CSS pixel
```

:::

Precedence follows NativeScript: an inline `style` attribute or a value assigned in code is a *local* value and beats every stylesheet rule for that property, whatever the selector's specificity.

Property names are camelCase in TypeScript (`justifyContent`) and kebab-case in CSS (`justify-content`). Shorthands work in both. For the full list, see the [Property reference](/styling/reference).

## Mason elements and plain views

MasonKit's properties apply with web semantics to Mason elements only: `<div>`, `<p>`, `<span>`, `View`, `Text`, `Scroll` and the rest. A plain NativeScript view such as `Label` or `StackLayout` keeps core's own handling, even for properties both understand (`margin`, `padding`, `background`, `flex`, ...). Installing MasonKit doesn't change how existing views style.

One visible difference is the `px` unit: on a Mason element `px` is a CSS pixel, on a plain view it keeps core's device-pixel meaning. See [Units](/styling/units) and [Mixing with NativeScript views](/guide/mixing-views).

## User-agent defaults

HTML-shaped elements start with browser-like defaults. For example:

| Element | Default |
| --- | --- |
| `<div>`, `<section>`, `<header>`, ... | `display: block` |
| `<span>`, `<b>`, `<strong>`, `<em>`, `<i>`, `<a>`, `<code>` | `display: inline` |
| `<p>` | block, `margin: 1em 0` |
| `<h1>` to `<h6>` | block, bold, browser font sizes and margins (`<h1>` is 32px with `0.67em` margins) |
| `<ul>`, `<ol>` | `margin: 16px 0`, `padding-left: 40px`, `disc` / `decimal` markers |
| `<blockquote>` | `margin: 1em 40px` |
| `<pre>` | monospace, `white-space: pre`, `margin: 1em 0` |
| `<hr>` | 1px top border, `margin: 8px 0` |

These defaults sit below your stylesheet, as in a browser. `ul { margin: 0 }` or a utility class like `list-none` replaces them without needing `!important` or a more specific selector.

## Preflight

Preflight is an opt-in reset, in the spirit of a CSS normalize or the Tailwind base layer. With it enabled every element starts from:

- `margin: 0`, `padding: 0`, `border-width: 0`
- `border-style: solid`, so `border-width: 1px` alone draws a border
- a transparent background
- `list-style: none` on `<ul>` / `<ol>`
- `display: block` on `<img>`

```ts
// app entry, before any view is created
import { View } from '@triniwiz/nativescript-masonkit';

View.preflight = true;
```

Preflight is off by default and global to the Mason tree. Set it once at startup: changing it later re-seeds the defaults for new nodes but doesn't restyle nodes you've already customized.

::: tip Box sizing
Mason uses `box-sizing: border-box` by default, with or without preflight. Browsers default to `content-box`. Set `box-sizing: content-box` where you need the browser behavior.
:::

## Pseudo-classes

Rules with these pseudo-classes apply to Mason elements while the state holds:

| Pseudo-class | When |
| --- | --- |
| `:active` (also core's `:pressed` and `:highlighted`) | while the element is pressed, including inline pieces of text such as an `<a>` inside a `<p>` |
| `:focus` | while the element has focus |
| `:disabled` | while the element is disabled |
| `:hover` | while a mouse pointer is over the element (wired on Windows; touch screens have no hover) |
| `:checked` | a checked `<input type="checkbox">` or `<input type="radio">`, as on the web |

```css
button:active {
  background-color: #1d4ed8;
}

.check:checked {
  border-color: #16a34a;
}
```

## Animations

`@keyframes` and the `animation-*` properties come from NativeScript core, which plays opacity, background color, transforms, width and height. MasonKit adds `mask-position` and `mask-size` to the properties a keyframe can animate, interpolated per frame on the same timeline (delay, duration, iterations, timing functions and `animation-fill-mode` are honored).

```css
@keyframes pulse {
  from { opacity: 1; }
  to { opacity: 0.4; }
}

.loading {
  animation: pulse 0.8s ease-in-out infinite alternate;
}
```

CSS `transition` is not supported. Animate a change with `@keyframes`, or with core's `view.animate()` in code.

## Using Tailwind

`@nativescript/tailwind` works with MasonKit: the utility classes are plain CSS rules, and the HTML-shaped elements take them like any view.

- Import Tailwind's theme and utilities (Tailwind v4 syntax below), and use `View.preflight = true` in place of Tailwind's own base layer.
- `rem` values resolve against a 16px root font size, as in a browser.
- Because UA defaults sit below the stylesheet, utilities such as `m-0` or `list-none` override them directly.

```css
/* app.css */
@import 'tailwindcss/theme' layer(theme);
@import 'tailwindcss/utilities' layer(utilities);
```

```html
<div class="flex flex-col gap-3 p-4 rounded-xl bg-white">
  <h2 class="text-lg font-bold m-0">Title</h2>
  <p class="text-slate-600 m-0">Body text</p>
</div>
```

::: warning @nativescript/tailwind 2.x
Version 2.x runs a PostCSS step over every stylesheet in the app, not just Tailwind's output, and removes what NativeScript core doesn't support: `display`, values ending in `min-content`, `max-content`, `vw` or `vh`, and `:hover` rules. Your own MasonKit CSS loses those declarations without any error. The repo's React demo uses version 4, which keeps them.
:::

## When a value doesn't apply

A value MasonKit can't parse is dropped and the property keeps its previous value. To find out what was dropped and why, turn on [CSS diagnostics](/guide/diagnostics):

```ts
import { setCssDiagnostics, formatCssDiagnostics } from '@triniwiz/nativescript-masonkit';

setCssDiagnostics(true);
// ... render ...
console.log(formatCssDiagnostics());
```
