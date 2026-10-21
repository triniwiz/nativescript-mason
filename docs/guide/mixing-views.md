# Mixing with NativeScript views

MasonKit elements and plain NativeScript views nest in both directions. You can drop a `Label`, `StackLayout` or any third-party view inside a Mason container, and you can place a Mason tree anywhere inside a regular NativeScript layout.

## A NativeScript view inside a Mason container

A plain view becomes a single leaf box in the Mason tree. It takes part in flex, grid and block layout like any other child, and NativeScript still measures and lays out its own content (including its own children).

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd"
      xmlns:web="@triniwiz/nativescript-masonkit/web">
  <web:Div class="toolbar">
    <Label text="Title" class="title" />
    <Button text="Save" class="save" />
  </web:Div>
</Page>
```

```css
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  flex-grow: 1;
}
```

### Layout properties a plain child honours

While a plain view is attached to a Mason parent, these properties are copied from its NativeScript style into its Mason box, so you can set them from CSS, from markup or from code as usual:

| Group | Properties |
|---|---|
| Size | `width`, `height`, `min-width`, `min-height`, `max-width`, `max-height` |
| Margins | `margin-top`, `margin-right`, `margin-bottom`, `margin-left` (and the `margin` shorthand) |
| Flex item | `flex-grow`, `flex-shrink`, `flex-basis` |
| Alignment | `align-self`, `justify-self` |
| Sizing | `aspect-ratio` |
| Position | `position`, `left`, `right`, `top`, `bottom` |
| Grid placement | `grid-row-start`, `grid-row-end`, `grid-column-start`, `grid-column-end` |

A few details worth knowing:

- An unset `min-width` / `min-height` stays `auto`, so the plain view keeps the automatic minimum size a flex or grid item normally has.
- `align-self: auto` is treated as `normal`.
- For grid placement on a plain view, use the four longhands. The `grid-area`, `grid-row` and `grid-column` shorthands only apply to Mason elements.
- The plain view's own `padding`, `background`, `border` and so on are still handled by NativeScript core, exactly as they would be anywhere else.

## A Mason tree inside a NativeScript layout

A Mason element whose parent is not a Mason element acts as a layout root. It computes its layout against the space its NativeScript parent gives it.

```xml
<GridLayout rows="auto, *">
  <Label row="0" text="Header from core" />
  <web:Div row="1" class="content">
    <web:P text="Laid out by Mason" />
  </web:Div>
</GridLayout>
```

::: tip Safe area on iOS
A Mason root keeps its content inside the safe area by default, as a web page does. For a full-bleed root, set `iosOverflowSafeArea` to `true` on it and add the padding you need yourself.
:::

## The CSS boundary

Inside a Mason subtree, CSS follows web semantics. A plain NativeScript view keeps NativeScript core semantics, even when it sits inside a Mason container. Installing MasonKit does not change how your existing views are styled.

The most visible difference is the `px` unit:

| Where | `px` means |
|---|---|
| Mason elements | A CSS pixel, the same size as a dip (as on the web) |
| Plain NativeScript views | A device pixel (NativeScript core behaviour) |

So `width: 100px` on a `<div>` and `width: 100px` on a `<Label>` are different sizes on a 3x screen. When a plain child's size or margin is copied into its Mason box, the value is converted so the child keeps the size core would give it. See [Units](/styling/units) for the full picture.

Properties that both core and MasonKit define (`margin`, `padding`, `background`, `border-radius`, `box-shadow`, `transform`, `flex`, `font-family`, `white-space` and others) are routed per view: a Mason element gets MasonKit's handling, a plain view gets core's.

## Fonts do not inherit across the boundary

::: warning
On iOS and Android, font properties set on a plain NativeScript ancestor (for example a `font-family` or `font-size` on a `StackLayout`) are not inherited by Mason elements inside it. Set fonts on the Mason root, or on the Mason elements themselves:

```css
.content {
  font-family: Inter;
  font-size: 16px;
}
```

Inheritance between Mason elements works as on the web.
:::
