# Positioning

`position` and the inset properties work as in CSS, including `fixed` and `sticky`.

```css
.badge-host {
  position: relative;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
}
```

## `position`

| Value | Behavior |
| --- | --- |
| `static` (default) | In normal flow. Insets are ignored, and the box isn't a containing block for absolute descendants. |
| `relative` | In normal flow, then shifted by its insets without affecting other boxes. A containing block for absolute descendants. |
| `absolute` | Out of flow, placed against its nearest positioned ancestor (any `position` other than `static`), or the Mason root if there is none. |
| `fixed` | Out of flow, placed against the Mason root, and stays in place when content scrolls. |
| `sticky` | In normal flow until scrolling would move it past its inset, then held at the inset within its parent. A containing block for absolute descendants. |

As on the web, `static` is the default, so an absolutely positioned box looks past its parent for a positioned ancestor. Give the intended container `position: relative`.

## Insets

`top`, `right`, `bottom`, `left` and the `inset` shorthand (one to four values, like `margin`) accept lengths, percentages and `auto`. Percentages resolve against the containing block: `left`/`right` against its width, `top`/`bottom` against its height. The logical forms (`inset-inline`, `inset-block`, `inset-inline-start`, ...) are also accepted and follow the writing mode and direction; see [Logical properties](/styling/box-model#logical-properties).

```css
.overlay {
  position: absolute;
  inset: 0;              /* cover the containing block */
}

.corner {
  position: absolute;
  inset: auto 16px 16px auto;  /* bottom-right */
}
```

With both `left` and `right` (or `top` and `bottom`) set and the size `auto`, an absolute box stretches between them. `margin: auto` on an absolute box with opposing insets centers it, as in CSS:

```css
.dialog {
  position: absolute;
  inset: 0;
  width: 280px;
  height: 160px;
  margin: auto;
}
```

## `fixed`

A fixed box is placed relative to the Mason root, the outermost Mason element in the page, and is drawn above the rest of the tree. Scrolling any container inside the root, including the root itself, doesn't move it.

```css
.fab {
  position: fixed;
  right: 16px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
}
```

::: info
The "viewport" for `fixed` is the Mason root's box, not the device screen. When the root sits inside other NativeScript layouts (below an `ActionBar`, inside a tab), fixed boxes are positioned within the root's area.
:::

## `sticky`

A sticky box lays out in normal flow. When its nearest scrolling ancestor scrolls far enough that the box would cross its inset, it's held at that offset, but never beyond the edges of its parent.

```html
<div class="list">
  <section>
    <h3 class="header">A</h3>
    <p>Aaron</p>
    <p>Abigail</p>
  </section>
  <section>
    <h3 class="header">B</h3>
    <p>Bella</p>
  </section>
</div>
```

```css
.list {
  height: 100%;
  overflow-y: auto;
}

.header {
  position: sticky;
  top: 0;
  background-color: white;
}
```

Each header sticks to the top while its section scrolls through, then is pushed away by the next one, because it can't leave its own `<section>`. `top`, `bottom`, `left` and `right` thresholds are all supported. A sticky box with no scrolling ancestor just stays in flow.

## Stacking with `z-index`

`z-index` reorders siblings: a higher value draws above a lower one. Without it, later siblings draw on top of earlier ones. Fixed boxes and engaged sticky boxes are brought above their siblings automatically.

```css
.menu {
  position: absolute;
  z-index: 10;
}
```

`z-index` orders siblings within the same parent. It doesn't build CSS stacking contexts, so a child can't use a high `z-index` to rise above its parent's siblings.
