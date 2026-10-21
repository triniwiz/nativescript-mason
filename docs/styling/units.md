# Units

MasonKit's units mean what they mean in a browser. CSS you copy from the web keeps its sizes.

```css
.panel {
  width: 320px;        /* CSS pixels: 320 dip */
  padding: 1rem;       /* 16px */
  margin-top: 2em;     /* twice this element's font size */
  height: 50vh;        /* half the viewport height */
  max-width: calc(100vw - 32px);
}
```

## Supported units

| Unit | Meaning |
| --- | --- |
| `px` | A CSS pixel, the same size as a dip. Scales with screen density, as on the web. |
| bare number | A CSS pixel (`width: 100` is `100px`). |
| `dip` | Same as `px`. |
| `%` | A percentage of the relevant basis (usually the containing block). |
| `rem` | Multiple of the root font size (16px by default). |
| `em` | Multiple of the element's own font size. On `font-size` itself, of the parent's. |
| `pt` | A point, 96/72 CSS px. |
| `vw`, `vh` | 1% of the viewport width / height. |
| `vmin`, `vmax` | 1% of the smaller / larger viewport side. |
| `dppx` | A literal device pixel, unscaled. |

Other units (`ch`, `ex`, `cm`, `mm`, `in`, container units, ...) aren't supported. An unknown unit is read as CSS px and reported in [CSS diagnostics](/guide/diagnostics), so `1ch` quietly becomes `1px` unless you look.

::: warning `px` differs from NativeScript core
In `@nativescript/core`, `px` means a device pixel. In MasonKit it's a CSS pixel, because MasonKit's elements are styled with web CSS. The two coexist: a plain NativeScript view (`Label`, `StackLayout`, ...) in the same app keeps core's meaning of `px`.

When you need an exact device pixel on a Mason element, for a hairline border for instance, use `dppx`:

```css
.divider {
  border-bottom: 1dppx solid #ddd;
}
```

`dppx` is MasonKit's name for a device pixel. In browser CSS `dppx` is a resolution unit used in media queries, so it won't mean the same thing in CSS you copy from the web.
:::

## Relative units

### `rem`

`rem` resolves against a root font size of 16px. Change it with `setCssUnitContext` before creating views:

```ts
import { setCssUnitContext } from '@triniwiz/nativescript-masonkit';

setCssUnitContext({ rootFontSize: 18 });
```

### `em`

On a length, `em` uses the element's own font size, so `padding: 0.5em` on an element with `font-size: 20px` is 10px. An element without a font size of its own uses its nearest Mason ancestor's.

On `font-size` itself, `em` and `%` are relative to the parent's font size, as in CSS: `font-size: 1.5em` is stored as `150%` and follows the parent if it changes.

### Viewport units

The viewport is the window size in dip, on every platform. MasonKit updates it on rotation and window resize. A viewport unit resolves when the value is set, so a value already applied keeps its size; values set after the change, including stylesheet rules that re-apply, use the new viewport.

To override the context yourself (for example in tests):

```ts
import { setCssUnitContext } from '@triniwiz/nativescript-masonkit';

setCssUnitContext({ viewportWidth: 1280, viewportHeight: 800 });
```

`cssUnits` exposes the current context (`rootFontSize`, `viewportWidth`, `viewportHeight`) for reading.

## `calc()`, `min()`, `max()`, `clamp()`

MasonKit evaluates math functions itself, using the units above, so `rem`, `em` and viewport units can be mixed freely:

```css
.title {
  font-size: clamp(1rem, 4vw, 2rem);
  padding: calc(0.5rem + 2px);
  width: min(600px, 90vw);
}
```

Math functions work in plain lengths and inside compound values that MasonKit parses, such as `box-shadow`, `border-radius` and `transform`.

There's one limit: the result has to be known before layout. A percentage can only be resolved during layout, so an expression that mixes `%` with a length doesn't resolve:

```css
.bad  { width: calc(100% - 20px); }  /* not supported: resolves to 0 */
.ok   { width: calc(50% - 10%); }    /* pure percentage: 40% */
```

For "full width minus a gutter", use margins or padding on the parent, `flex: 1`, or a grid track instead.

## `var()`

Custom properties are substituted by NativeScript core when it applies a stylesheet, so `var(--gap)` works in `.css` files. A `var()` assigned directly in code (`view.style.width = 'var(--w)'`) isn't substituted, and shows up in [CSS diagnostics](/guide/diagnostics).

## Reading values back

Length getters report CSS pixels whichever unit you used:

```ts
view.style.width = '2rem';
console.log(view.style.width); // { value: 32, unit: 'px' }
```
