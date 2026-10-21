# Introduction

MasonKit (`@triniwiz/nativescript-masonkit`) brings web layout and HTML-shaped elements to NativeScript. You build screens out of `<div>`, `<p>`, `<span>`, `<h1>`, `<ul>`, `<img>` and friends, style them with ordinary CSS (flexbox, grid, block and inline flow, floats, positioning), and every element renders as a real native view on iOS, Android and Windows.

Layout is computed by **Mason**, a layout engine written in Rust on top of [taffy](https://github.com/DioxusLabs/taffy). The same engine runs on every platform, so a stylesheet lays out the same way everywhere.

```html
<div class="card">
  <h2>Weekly report</h2>
  <p>Revenue is up <strong>12%</strong> on last week.</p>
  <ul>
    <li>Orders: 1,204</li>
    <li>Refunds: 18</li>
  </ul>
</div>
```

```css
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

## Why MasonKit

- **CSS means what it means on the web.** `px` is a CSS pixel, `rem`, `em`, `vw`, `vh` resolve, and `calc()`, `min()`, `max()` and `clamp()` are evaluated. CSS you already have (or a utility framework's output) behaves the way you expect. See [Units](/styling/units).
- **Real layout modes.** Flexbox, CSS Grid (template areas, `repeat()`, `minmax()`, `auto-fill`), block and inline formatting, floats, and `position: relative | absolute | fixed | sticky`.
- **HTML-shaped elements.** More than 60 tags with browser defaults: headings and paragraphs get their usual margins, lists get markers, `<a href>` opens links, `<details>` toggles. See [HTML elements](/elements/html).
- **Native views, not a web view.** Each element is a native view, so it composes with NativeScript views in both directions. See [Mixing with NativeScript views](/guide/mixing-views).
- **Rich visuals.** Borders and radii, box shadows, gradients, filters, transforms, masks and `clip-path`, `backdrop-filter`.
- **Text that flows.** Nested inline elements style runs of text inside a paragraph, with `line-clamp`, `text-indent`, `hyphens`, `writing-mode` and more. See [Typography](/styling/typography).
- **Works with every flavour.** Plain NativeScript (XML or TypeScript), Angular, Vue 3, Svelte Native, React and Solid. See [Frameworks](/frameworks/).

## Platforms

| Platform | Native backing |
| --- | --- |
| iOS | `Mason.xcframework` (Swift + Rust) |
| Android | `masonkit` AAR (Kotlin + Rust via JNI) |
| Windows | `NativeScript.Mason` WinRT component (C++/WinRT + Rust), for the NativeScript Windows runtime |

Feature support can differ between platforms. The [support matrix](/platforms/) lists the details.

## What MasonKit is not

- **Not a browser.** There is no HTML engine or web view. Elements are NativeScript views that happen to have HTML names and CSS behaviour.
- **Not a replacement for NativeScript's CSS engine.** Selectors, classes, specificity, `@media`, `@keyframes` and `var()` are handled by NativeScript's own CSS engine. MasonKit registers its properties onto it and does the layout and rendering. See [How CSS applies](/styling/).
- **Not a change to your other views.** Installing MasonKit does not alter how plain NativeScript views (`StackLayout`, `Label`, ...) lay out or interpret CSS, including core's `px`. MasonKit semantics apply inside MasonKit elements only.

## Next steps

- [Install the plugin](/guide/installation)
- [Build a first screen](/guide/quick-start)
- [Understand how it works](/guide/how-it-works)
