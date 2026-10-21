---
layout: home

hero:
  name: MasonKit
  text: Web layout for NativeScript
  tagline: Flexbox, grid, block and inline flow, and HTML-shaped elements, rendered as real native views on iOS, Android and Windows.
  image:
    src: /logo.svg
    alt: MasonKit
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/triniwiz/nativescript-mason

features:
  - title: CSS you already know
    details: display, flex, grid, position, float, gap, calc() and friends behave the way they do in a browser, including px as a CSS pixel and rem, em, vw and vh units.
    link: /styling/
    linkText: How CSS applies
  - title: HTML-shaped elements
    details: div, section, p, span, h1 to h6, ul, ol, li, a, img, input, details and more, with browser-like default styles and inline text flow.
    link: /elements/
    linkText: Browse elements
  - title: Native views, Rust layout
    details: Every element is a native view. Layout runs in a Rust core built on taffy.
    link: /guide/how-it-works
    linkText: How it works
  - title: Every NativeScript flavour
    details: Plain XML and TypeScript, Angular, Vue 3 and Svelte Native entry points ship in the package. React and Solid work through the same element registry.
    link: /frameworks/
    linkText: Framework setup
  - title: Mixes with existing views
    details: Drop a Label or StackLayout into a Mason container, or a Mason tree into a GridLayout. Plain views keep NativeScript's own semantics.
    link: /guide/mixing-views
    linkText: Mixing views
  - title: Tells you what it dropped
    details: Turn on CSS diagnostics to see every unknown unit, unparsable value or unsupported function instead of silently losing it.
    link: /guide/diagnostics
    linkText: CSS diagnostics
---

## Install

```bash
ns plugin add @triniwiz/nativescript-masonkit
```

```html
<div class="card">
  <h2>Hello Mason</h2>
  <p>Styled with <strong>real</strong> CSS.</p>
</div>
```

```css
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #3d5afe, #7c4dff);
  color: white;
}
```

Pick your flavour in [Framework setup](/frameworks/) to register the elements.
