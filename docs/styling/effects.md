# Effects and transforms

Filters, masks, clipping, transforms and image fitting on MasonKit elements. Support differs more between platforms here than anywhere else in MasonKit, so each section ends with its platform notes.

## opacity and visibility

`opacity` (0 to 1) and `visibility` (`visible`, `hidden`) work as on any NativeScript view.

```css
.disabled { opacity: 0.5; }
```

MasonKit's layout does not read `visibility`, so a hidden element keeps its space. To remove an element from layout, use `display: none`.

## transform

```css
.badge { transform: translate(8px, -8px) rotate(12deg); }
.zoom:active { transform: scale(0.96); }
```

The function list is applied left to right, as in CSS. Lengths are CSS px; angles take `deg` or `rad`.

| Function | iOS | Android | Windows |
| --- | --- | --- | --- |
| `translate()`, `translateX()`, `translateY()` | yes | yes | yes |
| `scale()`, `scaleX()`, `scaleY()` | yes | yes | yes |
| `rotate()` | yes | yes | yes |
| `skew()` | no (use `skewX()`/`skewY()`) | yes | yes |
| `skewX()`, `skewY()` | yes | yes | yes |
| `matrix()` | yes | yes | yes |
| `matrix3d()` | yes | flattened to 2D | flattened to 2D |
| `translate3d()` | yes (z ignored) | flattened to 2D | flattened to 2D |
| `scale3d()`, `rotateZ()`, `rotateX()`, `rotateY()`, `rotate3d()` | no | flattened to 2D | `scale3d()` and `rotateZ()` only, in 2D |
| `perspective()` | no | accepted, no visible effect | no |

Percentages in `translate()` are of the element's own border box, as in CSS, so `translate(-50%, -50%)` centers a box on its anchor point.

A transform is visual only: it does not change layout, so neighbours stay where they were.

### transform-origin

```css
.needle { transform-origin: bottom center; transform: rotate(45deg); }
.corner { transform-origin: 0 0; }
```

Takes one or two keywords (`left`, `center`, `right`, `top`, `bottom`, in either order), lengths or percentages. The default is `50% 50%`. A third (z) value is accepted and ignored.

On Windows a length origin is converted using the element's size when the transform is applied, and is not recomputed when the element later resizes.

## filter

```css
.thumb { filter: grayscale(1); }
.thumb:active { filter: none; }
.glow { filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) brightness(1.1); }
```

Functions: `blur()`, `brightness()`, `contrast()`, `drop-shadow()`, `grayscale()`, `hue-rotate()`, `invert()`, `opacity()`, `saturate()`, `sepia()`. Amounts take numbers or percentages, and several functions chain in order. `url()` references to SVG filters are not supported.

`filter` applies to the element and everything inside it.

| Platform | Notes |
| --- | --- |
| iOS | All functions. |
| Android | All functions. Fastest on Android 12 (API 31) and later, which use `RenderEffect`; earlier versions take a slower offscreen path. |
| Windows | All functions. |

## backdrop-filter

`backdrop-filter` filters what is behind the element, leaving the element's own content sharp. It is how frosted glass panels are made:

```css
.glass {
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px) saturate(1.4);
  border-radius: 16px;
}
```

It takes the same functions as `filter`, except that `drop-shadow()` has no effect. The filtered backdrop is clipped to the element's `border-radius`.

| Platform | Notes |
| --- | --- |
| iOS | Draws a snapshot of the content behind the element through Core Image, refreshed while the screen changes and idle otherwise. The snapshot also picks up content painted above the element and misses Metal-backed layers. |
| Android | `RenderEffect` on Android 12 (API 31) and later; a downscaled software snapshot on older versions, with the same functions. |
| Windows | Supported. |

::: tip
Give the element a translucent `background-color`, as above. Without one, a light blur can be hard to see.
:::

## Masks

CSS masks hide parts of an element, including its background, border, content and children, based on an image's alpha (or luminance).

```css
.fade-bottom {
  mask-image: linear-gradient(to bottom, black 70%, transparent);
}

.icon {
  background-color: currentColor;
  mask: url("data:image/svg+xml,...") center / contain no-repeat;
}
```

| Property | Values |
| --- | --- |
| `mask-image` | `none`, `url()` (including SVG data URLs), any gradient, or a comma separated list |
| `mask-mode` | `alpha`, `luminance`, `match-source` |
| `mask-position`, `mask-size`, `mask-repeat` | as for backgrounds |
| `mask-origin` | `border-box`, `padding-box`, `content-box`, and the SVG boxes `fill-box`, `stroke-box`, `view-box` |
| `mask-clip` | as `mask-origin`, plus `no-clip` |
| `mask-composite` | `add`, `subtract`, `intersect`, `exclude` |
| `mask` | shorthand for all of the above |

The `-webkit-` prefixed forms (`-webkit-mask`, `-webkit-mask-image`, `-webkit-mask-size`, `-webkit-mask-position`, `-webkit-mask-repeat`, `-webkit-mask-origin`, `-webkit-mask-clip`, `-webkit-mask-composite`) are accepted too, so CSS copied from the web works unchanged.

All mask gradients work on every platform, including `conic-gradient()` and the `repeating-*` forms.

`mask-position` and `mask-size` can be animated with CSS `@keyframes` (see [Animations](#animations)).

### mask-border

`mask-border` uses a 9-slice image as the mask edge, the way `border-image` draws a border. Longhands: `mask-border-source`, `mask-border-slice`, `mask-border-width`, `mask-border-outset`, `mask-border-repeat`, `mask-border-mode`. The prefixed `-webkit-mask-box-image` is accepted too.

### Platform notes

- **Hit testing:** as in browsers, a mask does not change where the element can be tapped; `clip-path` does.
- **`url(#id)`:** there is no in-document SVG to reference, so a `url(#id)` mask paints nothing on every platform.
- **Android:** while a `mask-border` image is loading the element is fully masked.
- **Windows:** masks are drawn with Direct2D.

## clip-path

`clip-path` clips the element to a shape. Unlike a mask, a tap outside the shape goes to whatever is underneath.

```css
.avatar { clip-path: circle(50%); }
.ribbon { clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%); }
.card { clip-path: inset(0 round 16px); }
```

Supported shapes: `inset()`, `rect()`, `xywh()` (all with an optional `round` radius), `circle()` and `ellipse()` (with `at <position>`), `polygon()` and `path()` (with an optional fill rule). A reference box (`border-box`, `padding-box`, `content-box`, ...) can follow the shape, or be used alone to clip to that box with its border radii. `url()` and invalid values behave as `none`.

Supported on iOS, Android and Windows, including hit testing against the shape.

## object-fit and object-position

For `<img>` and the `Img` widget:

```css
.cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  object-position: top;
}
```

- `object-fit`: `fill` (default), `contain`, `cover`, `none`, `scale-down`.
- `object-position`: keywords (`left`, `center`, `right`, `top`, `bottom`), lengths or percentages.

## Animations

CSS `@keyframes` animations run through NativeScript's animation system, so the properties it animates natively work on MasonKit elements: `opacity`, `background-color`, the transform properties (`scale`, `translate`, `rotate`), `width` and `height`.

On top of those, MasonKit interpolates `mask-position` and `mask-size` itself on the same timeline, honouring delay, duration, iteration count, each interval's timing function and `animation-fill-mode`.

```css
@keyframes shimmer {
  from { mask-position: -100% 0; }
  to { mask-position: 200% 0; }
}

.skeleton {
  mask-image: linear-gradient(90deg, transparent, black, transparent);
  mask-size: 50% 100%;
  mask-repeat: no-repeat;
  animation: shimmer 1.2s linear infinite;
}
```

On Windows, keyframed `rotate`, `scale` and `translate`, and `view.animate()` with them, are also played frame by frame by MasonKit.
